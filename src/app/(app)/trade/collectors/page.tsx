import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CollectorsLists, type CollectorLists } from "@/components/trades/CollectorsLists";
import Link from "next/link";

export default async function CollectorsPage() {
  const session = await getServerSession(authOptions);
  const myId = session!.user.id;

  const [users, allStickers] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: myId } },
      select: {
        id: true,
        name: true,
        collection: { select: { stickerId: true, ownedQty: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.sticker.findMany({ select: { id: true, albumNumber: true } }),
  ]);

  // Album order for stable, readable grouped output.
  const albumOrder = new Map(allStickers.map((s) => [s.id, s.albumNumber]));
  const allIdsSorted = [...allStickers]
    .sort((a, b) => a.albumNumber - b.albumNumber)
    .map((s) => s.id);

  const collectors: CollectorLists[] = users.map((u) => {
    const ownedQty = new Map(u.collection.map((c) => [c.stickerId, c.ownedQty]));
    const duplicates = u.collection
      .filter((c) => c.ownedQty > 1)
      .map((c) => c.stickerId)
      .sort((a, b) => (albumOrder.get(a) ?? 0) - (albumOrder.get(b) ?? 0));
    const missing = allIdsSorted.filter((id) => (ownedQty.get(id) ?? 0) === 0);
    return { id: u.id, name: u.name, duplicates, missing };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-4xl font-bold text-panini-gold tracking-wide">
            COLLECTORS
          </h1>
          <p className="text-panini-gray text-sm mt-1">
            View and copy every collector&rsquo;s duplicates and missing stickers
          </p>
        </div>
        <Link
          href="/trade/compare"
          className="text-sm font-medium border border-panini-blue/40 text-panini-gray hover:text-panini-white hover:border-panini-gold/40 rounded-lg px-4 py-2 transition-colors"
        >
          ← Back to comparison
        </Link>
      </div>

      <CollectorsLists collectors={collectors} />
    </div>
  );
}
