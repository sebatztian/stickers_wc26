"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const s = await getServerSession(authOptions);
  if (!s) throw new Error("Unauthorized");
  return s;
}

const SetOwnedSchema = z.object({
  stickerId: z.string().min(1),
  qty: z.number().int().min(0),
});

export async function setOwned(stickerId: string, qty: number) {
  const session = await requireSession();
  const parsed = SetOwnedSchema.safeParse({ stickerId, qty });
  if (!parsed.success) return { success: false as const, error: "Invalid input" };

  if (qty === 0) {
    await prisma.userSticker.deleteMany({
      where: { userId: session.user.id, stickerId },
    });
  } else {
    await prisma.userSticker.upsert({
      where: { userId_stickerId: { userId: session.user.id, stickerId } },
      create: { userId: session.user.id, stickerId, ownedQty: qty },
      update: { ownedQty: qty },
    });
  }

  revalidatePath("/collection");
  return { success: true as const };
}

const AddByCodeSchema = z.object({
  code: z.string().trim().min(1),
});

// Quick-add a sticker to the collection by its code (e.g. "ME 18" / "mex18").
// Normalizes input (uppercase, strip whitespace) and increments ownedQty by 1.
export async function addByCode(code: string) {
  const session = await requireSession();
  const parsed = AddByCodeSchema.safeParse({ code });
  if (!parsed.success) return { success: false as const, error: "Invalid input" };

  const stickerId = parsed.data.code.replace(/\s+/g, "").toUpperCase();

  const sticker = await prisma.sticker.findUnique({ where: { id: stickerId } });
  if (!sticker) {
    return { success: false as const, error: `No sticker found for code "${stickerId}"` };
  }

  const updated = await prisma.userSticker.upsert({
    where: { userId_stickerId: { userId: session.user.id, stickerId } },
    create: { userId: session.user.id, stickerId, ownedQty: 1 },
    update: { ownedQty: { increment: 1 } },
  });

  revalidatePath("/collection");
  return {
    success: true as const,
    data: { stickerId, ownedQty: updated.ownedQty, name: sticker.name },
  };
}
