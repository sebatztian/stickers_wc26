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
