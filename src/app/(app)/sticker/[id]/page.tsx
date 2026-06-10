import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StickerCard } from "@/components/stickers/StickerCard";
import Link from "next/link";

export default async function StickerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [sticker, userSticker] = await Promise.all([
    prisma.sticker.findUnique({ where: { id } }),
    prisma.userSticker.findUnique({
      where: { userId_stickerId: { userId: session!.user.id, stickerId: id } },
    }),
  ]);

  if (!sticker) notFound();

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link
        href="/collection"
        className="text-panini-gray hover:text-panini-white text-sm transition-colors"
      >
        ← Back to collection
      </Link>

      <div className="flex justify-center">
        <StickerCard
          id={sticker.id}
          name={sticker.name}
          country={sticker.country}
          code={sticker.code}
          position={sticker.position}
          isFoil={sticker.isFoil}
          isTeamLogo={sticker.isTeamLogo}
          isTeamPhoto={sticker.isTeamPhoto}
          isSpecial={sticker.isSpecial}
          ownedQty={userSticker?.ownedQty ?? 0}
        />
      </div>

      <div className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4 space-y-2 text-sm">
        <p className="text-panini-gray">
          Album number: <span className="text-panini-white">#{sticker.albumNumber}</span>
        </p>
        <p className="text-panini-gray">
          Country code: <span className="text-panini-white">{sticker.code}</span>
        </p>
        <p className="text-panini-gray">
          Owned: <span className="text-panini-white">{userSticker?.ownedQty ?? 0}×</span>
        </p>
      </div>
    </div>
  );
}
