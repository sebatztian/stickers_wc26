"use server";

import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const RegisterSchema = z.object({
  name: z.string().min(2).max(50),
  password: z.string().min(8),
});

export async function createUser(input: unknown) {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Name must be 2–50 chars, password at least 8" };
  }
  const { name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) {
    return { success: false as const, error: "Name already taken" };
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: { name, passwordHash },
    select: { id: true, name: true },
  });

  return { success: true as const, data: user };
}

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function changePassword(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false as const, error: "Not logged in" };

  const parsed = ChangePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "New password must be at least 8 characters" };
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false as const, error: "User not found" };

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) return { success: false as const, error: "Current password is incorrect" };

  const passwordHash = await hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true as const };
}
