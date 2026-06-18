"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

function requireSession() {
  return getServerSession(authOptions).then((s) => {
    if (!s) throw new Error("Unauthorized");
    return s;
  });
}

const TradeItemSchema = z.object({
  stickerId: z.string().min(1),
  quantity: z.number().int().min(1),
});

const CreateTradeSchema = z
  .object({
    receiverId: z.string().min(1),
    message: z.string().max(500).optional(),
    offered: z.array(TradeItemSchema),
    requested: z.array(TradeItemSchema),
  })
  .refine((d) => d.offered.length > 0 || d.requested.length > 0, {
    message: "A trade must include at least one sticker on either side",
  });

export async function createTrade(input: unknown) {
  const session = await requireSession();
  const parsed = CreateTradeSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid input" };

  const { receiverId, message, offered, requested } = parsed.data;
  if (receiverId === session.user.id) {
    return { success: false as const, error: "Cannot trade with yourself" };
  }

  // Verify offered stickers are owned
  for (const item of offered) {
    const us = await prisma.userSticker.findUnique({
      where: { userId_stickerId: { userId: session.user.id, stickerId: item.stickerId } },
    });
    if (!us || us.ownedQty < item.quantity) {
      return { success: false as const, error: `You don't have enough of sticker ${item.stickerId}` };
    }
  }

  const trade = await prisma.trade.create({
    data: {
      initiatorId: session.user.id,
      receiverId,
      message,
      items: {
        create: [
          ...offered.map((i) => ({ stickerId: i.stickerId, direction: "OFFERED", quantity: i.quantity })),
          ...requested.map((i) => ({ stickerId: i.stickerId, direction: "REQUESTED", quantity: i.quantity })),
        ],
      },
    },
    include: { items: true },
  });

  revalidatePath("/trade");
  return { success: true as const, data: trade };
}

export async function applyTradeToCollection(tradeId: string) {
  const session = await requireSession();

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: { items: true },
  });
  if (!trade) return { success: false as const, error: "Trade not found" };
  if (trade.status !== "ACCEPTED") return { success: false as const, error: "Trade is not accepted" };

  const isInitiator = trade.initiatorId === session.user.id;
  const isReceiver = trade.receiverId === session.user.id;
  if (!isInitiator && !isReceiver) return { success: false as const, error: "Not part of this trade" };

  // Check already applied
  if (isInitiator && trade.initiatorApplied) return { success: false as const, error: "Already applied" };
  if (isReceiver && trade.receiverApplied) return { success: false as const, error: "Already applied" };

  // From initiator's perspective: OFFERED = given by initiator, REQUESTED = given by receiver
  // This user gives away: OFFERED if initiator, REQUESTED if receiver
  // This user receives:   REQUESTED if initiator, OFFERED if receiver
  const givingDirection = isInitiator ? "OFFERED" : "REQUESTED";
  const receivingDirection = isInitiator ? "REQUESTED" : "OFFERED";

  const giving = trade.items.filter((i) => i.direction === givingDirection);
  const receiving = trade.items.filter((i) => i.direction === receivingDirection);

  const warnings: string[] = [];

  // Process removals (giving away)
  for (const item of giving) {
    const existing = await prisma.userSticker.findUnique({
      where: { userId_stickerId: { userId: session.user.id, stickerId: item.stickerId } },
    });
    const currentQty = existing?.ownedQty ?? 0;
    if (currentQty < item.quantity) {
      warnings.push(item.stickerId);
    }
    const newQty = Math.max(0, currentQty - item.quantity);
    if (newQty === 0) {
      await prisma.userSticker.deleteMany({
        where: { userId: session.user.id, stickerId: item.stickerId },
      });
    } else {
      await prisma.userSticker.upsert({
        where: { userId_stickerId: { userId: session.user.id, stickerId: item.stickerId } },
        create: { userId: session.user.id, stickerId: item.stickerId, ownedQty: newQty },
        update: { ownedQty: newQty },
      });
    }
  }

  // Process additions (receiving)
  for (const item of receiving) {
    const existing = await prisma.userSticker.findUnique({
      where: { userId_stickerId: { userId: session.user.id, stickerId: item.stickerId } },
    });
    const newQty = (existing?.ownedQty ?? 0) + item.quantity;
    await prisma.userSticker.upsert({
      where: { userId_stickerId: { userId: session.user.id, stickerId: item.stickerId } },
      create: { userId: session.user.id, stickerId: item.stickerId, ownedQty: newQty },
      update: { ownedQty: newQty },
    });
  }

  // Mark as applied
  await prisma.trade.update({
    where: { id: tradeId },
    data: isInitiator ? { initiatorApplied: true } : { receiverApplied: true },
  });

  revalidatePath("/collection");
  revalidatePath(`/trade/${tradeId}`);
  return { success: true as const, warnings };
}

export async function markDealDone(tradeId: string, done: boolean) {
  const session = await requireSession();
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade) return { success: false as const, error: "Trade not found" };

  const isInitiator = trade.initiatorId === session.user.id;
  // For virtual self-trades the user is both initiator and receiver; treat as initiator.
  const isReceiver = !trade.isVirtual && trade.receiverId === session.user.id;
  if (!isInitiator && !isReceiver) return { success: false as const, error: "Not part of this trade" };

  await prisma.trade.update({
    where: { id: tradeId },
    data: isInitiator ? { initiatorDealDone: done } : { receiverDealDone: done },
  });

  revalidatePath(`/trade/${tradeId}`);
  return { success: true as const };
}

const RespondSchema = z.object({
  tradeId: z.string().min(1),
  action: z.enum(["accept", "reject", "cancel"]),
});

export async function respondToTrade(tradeId: string, action: "accept" | "reject" | "cancel") {
  const session = await requireSession();
  const parsed = RespondSchema.safeParse({ tradeId, action });
  if (!parsed.success) return { success: false as const, error: "Invalid input" };

  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade) return { success: false as const, error: "Trade not found" };
  if (trade.status !== "PENDING") return { success: false as const, error: "Trade is not pending" };

  if (action === "cancel" && trade.initiatorId !== session.user.id) {
    return { success: false as const, error: "Only the initiator can cancel" };
  }
  if ((action === "accept" || action === "reject") && trade.receiverId !== session.user.id) {
    return { success: false as const, error: "Only the receiver can accept or reject" };
  }

  const statusMap = { accept: "ACCEPTED", reject: "REJECTED", cancel: "CANCELLED" } as const;
  const updated = await prisma.trade.update({
    where: { id: tradeId },
    data: { status: statusMap[action] },
  });

  revalidatePath("/trade");
  revalidatePath(`/trade/${tradeId}`);
  return { success: true as const, data: updated };
}
