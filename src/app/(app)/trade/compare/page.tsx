import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TradeComparison } from "@/components/trades/TradeComparison";
import Link from "next/link";

export default async function TradeComparePage() {
  const session = await getServerSession(authOptions);
  const myId = session!.user.id;

  const [users, totalStickers] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, collection: { select: { ownedQty: true } } },
    }),
    prisma.sticker.count(),
  ]);

  const ranked = users
    .map((u) => {
      const uniqueCount = u.collection.length;
      const totalCount = u.collection.reduce((sum, c) => sum + c.ownedQty, 0);
      return {
        id: u.id,
        name: u.name,
        uniqueCount,
        totalCount,
        duplicateCount: totalCount - uniqueCount,
        isMe: u.id === myId,
      };
    })
    .sort((a, b) => b.uniqueCount - a.uniqueCount || b.totalCount - a.totalCount);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-4xl font-bold text-panini-gold tracking-wide">
            TRADE COMPARISON
          </h1>
          <p className="text-panini-gray text-sm mt-1">
            Find sticker matches with your friends
          </p>
        </div>
        <Link
          href="/trade/import"
          className="text-sm font-medium border border-panini-blue/40 text-panini-gray hover:text-panini-white hover:border-panini-gold/40 rounded-lg px-4 py-2 transition-colors"
        >
          Compare with imported collection →
        </Link>
      </div>

      <TradeComparison myId={myId} users={ranked} totalStickers={totalStickers} />
    </div>
  );
}
