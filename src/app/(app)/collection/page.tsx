import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StickerGrid } from "@/components/stickers/StickerGrid";
import Link from "next/link";

export default async function CollectionPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [stickers, userStickers] = await Promise.all([
    prisma.sticker.findMany({ orderBy: { albumNumber: "asc" } }),
    prisma.userSticker.findMany({ where: { userId } }),
  ]);

  const userStickerMap = Object.fromEntries(
    userStickers.map((us) => [us.stickerId, { ownedQty: us.ownedQty }])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-panini-gold tracking-wide">
            MY COLLECTION
          </h1>
          <p className="text-panini-gray text-sm mt-1">
            FIFA World Cup 2026 Sticker Album
          </p>
        </div>
        <Link
          href="/admin/stickers/new"
          className="text-xs text-panini-gray hover:text-panini-white border border-panini-blue/30 rounded-lg px-3 py-1.5 transition-colors"
        >
          + Add Sticker
        </Link>
      </div>

      <StickerGrid stickers={stickers} initialUserStickers={userStickerMap} />
    </div>
  );
}
