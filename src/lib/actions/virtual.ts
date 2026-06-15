"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { parseStickerIds } from "@/lib/utils";

async function requireSession() {
  const s = await getServerSession(authOptions);
  if (!s) throw new Error("Unauthorized");
  return s;
}

const CreateVirtualSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  duplicates: z.string().max(5000),
  missing: z.string().max(5000),
});

// Keep only IDs that match real stickers; report the rest so the user can fix typos.
async function resolveIds(ids: string[]): Promise<{ valid: string[]; unknown: string[] }> {
  if (ids.length === 0) return { valid: [], unknown: [] };
  const found = await prisma.sticker.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const foundSet = new Set(found.map((s) => s.id));
  return {
    valid: ids.filter((id) => foundSet.has(id)),
    unknown: ids.filter((id) => !foundSet.has(id)),
  };
}

export async function createVirtualCollection(input: unknown) {
  const session = await requireSession();
  const parsed = CreateVirtualSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const dupes = await resolveIds(parseStickerIds(parsed.data.duplicates));
  const missing = await resolveIds(parseStickerIds(parsed.data.missing));

  const created = await prisma.virtualCollection.create({
    data: {
      ownerId: session.user.id,
      name: parsed.data.name,
      duplicates: dupes.valid,
      missing: missing.valid,
    },
  });

  revalidatePath("/trade/import");
  return {
    success: true as const,
    data: { id: created.id },
    unknown: [...new Set([...dupes.unknown, ...missing.unknown])],
  };
}

export async function deleteVirtualCollection(id: string) {
  const session = await requireSession();
  // deleteMany scoped by owner so a user can only ever remove their own.
  await prisma.virtualCollection.deleteMany({ where: { id, ownerId: session.user.id } });
  revalidatePath("/trade/import");
  return { success: true as const };
}

const SaveVirtualTradeSchema = z.object({
  virtualCollectionId: z.string().min(1),
  give: z.array(z.string().min(1)),
  receive: z.array(z.string().min(1)),
});

/**
 * Save the selected stickers as a virtual (pre-accepted) trade record so it
 * shows up in trade history and can be applied to the collection from there.
 * receiverId is set to the initiator (self-trade) since the partner is virtual.
 */
export async function saveVirtualTrade(input: unknown) {
  const session = await requireSession();
  const parsed = SaveVirtualTradeSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid input" };

  const { virtualCollectionId, give, receive } = parsed.data;
  if (give.length === 0 && receive.length === 0) {
    return { success: false as const, error: "Select at least one sticker" };
  }

  const vc = await prisma.virtualCollection.findUnique({ where: { id: virtualCollectionId } });
  if (!vc || vc.ownerId !== session.user.id) {
    return { success: false as const, error: "Collection not found" };
  }

  const userId = session.user.id;

  // Verify offered stickers are in inventory
  for (const stickerId of give) {
    const us = await prisma.userSticker.findUnique({
      where: { userId_stickerId: { userId, stickerId } },
    });
    if (!us || us.ownedQty < 1) {
      return { success: false as const, error: `You don't have sticker ${stickerId}` };
    }
  }

  const trade = await prisma.trade.create({
    data: {
      initiatorId: userId,
      receiverId: userId, // self-referential for virtual trades
      status: "ACCEPTED",
      isVirtual: true,
      virtualPartnerName: vc.name,
      items: {
        create: [
          ...give.map((stickerId) => ({ stickerId, direction: "OFFERED", quantity: 1 })),
          ...receive.map((stickerId) => ({ stickerId, direction: "REQUESTED", quantity: 1 })),
        ],
      },
    },
  });

  revalidatePath("/trade");
  return { success: true as const, data: { id: trade.id } };
}

const ApplyVirtualSchema = z.object({
  give: z.array(z.string().min(1)),
  receive: z.array(z.string().min(1)),
});

/**
 * Apply a virtual (imported-collection) trade directly to the user's own
 * collection — no confirmation needed since the other side isn't a real user.
 * Each given sticker is decremented by 1, each received sticker incremented by 1.
 */
export async function applyVirtualTrade(input: unknown) {
  const session = await requireSession();
  const parsed = ApplyVirtualSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid input" };

  const { give, receive } = parsed.data;
  if (give.length === 0 && receive.length === 0) {
    return { success: false as const, error: "Select at least one sticker" };
  }

  const userId = session.user.id;
  const warnings: string[] = [];

  for (const stickerId of give) {
    const existing = await prisma.userSticker.findUnique({
      where: { userId_stickerId: { userId, stickerId } },
    });
    const newQty = Math.max(0, (existing?.ownedQty ?? 0) - 1);
    if (!existing || existing.ownedQty < 1) warnings.push(stickerId);
    if (newQty === 0) {
      await prisma.userSticker.deleteMany({ where: { userId, stickerId } });
    } else {
      await prisma.userSticker.update({
        where: { userId_stickerId: { userId, stickerId } },
        data: { ownedQty: newQty },
      });
    }
  }

  for (const stickerId of receive) {
    await prisma.userSticker.upsert({
      where: { userId_stickerId: { userId, stickerId } },
      create: { userId, stickerId, ownedQty: 1 },
      update: { ownedQty: { increment: 1 } },
    });
  }

  revalidatePath("/collection");
  revalidatePath("/trade/import");
  return { success: true as const, warnings };
}
