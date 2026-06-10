"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as fs from "fs/promises";
import * as path from "path";

function requireSession() {
  return getServerSession(authOptions).then((s) => {
    if (!s) throw new Error("Unauthorized");
    return s;
  });
}

const CreateStickerSchema = z.object({
  id: z.string().regex(/^[A-Z0-9]+$/, "ID must be uppercase alphanumeric"),
  code: z.string().min(1),
  position: z.number().int().min(0),
  name: z.string().min(1),
  country: z.string(),
  isFoil: z.boolean().default(false),
  isTeamLogo: z.boolean().default(false),
  isTeamPhoto: z.boolean().default(false),
  isSpecial: z.boolean().default(false),
});

export async function createSticker(formData: FormData) {
  await requireSession();

  const raw = {
    id: formData.get("id"),
    code: formData.get("code"),
    position: Number(formData.get("position")),
    name: formData.get("name"),
    country: formData.get("country") ?? "",
    isFoil: formData.get("isFoil") === "true",
    isTeamLogo: formData.get("isTeamLogo") === "true",
    isTeamPhoto: formData.get("isTeamPhoto") === "true",
    isSpecial: formData.get("isSpecial") === "true",
  };

  const parsed = CreateStickerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const existing = await prisma.sticker.findUnique({ where: { id: parsed.data.id } });
  if (existing) return { success: false as const, error: "Sticker ID already exists" };

  const maxAlbum = await prisma.sticker.aggregate({ _max: { albumNumber: true } });
  const albumNumber = (maxAlbum._max.albumNumber ?? 0) + 1;

  let imagePath: string | null = null;
  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    const dir = path.join(process.cwd(), "data", "pictures", parsed.data.code);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${parsed.data.id}.jpg`);
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    imagePath = `pictures/${parsed.data.code}/${parsed.data.id}.jpg`;
  }

  const sticker = await prisma.sticker.create({
    data: { ...parsed.data, albumNumber, imagePath },
  });

  revalidatePath("/collection");
  return { success: true as const, data: sticker };
}
