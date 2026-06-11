import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TradeComparison } from "@/components/trades/TradeComparison";

export default async function TradeComparePage() {
  const session = await getServerSession(authOptions);
  const myId = session!.user.id;

  const users = await prisma.user.findMany({
    where: { id: { not: myId } },
    select: { id: true, name: true, collection: { select: { ownedQty: true } } },
  });

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
      };
    })
    .sort((a, b) => b.uniqueCount - a.uniqueCount || b.totalCount - a.totalCount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold text-panini-gold tracking-wide">
          TRADE COMPARISON
        </h1>
        <p className="text-panini-gray text-sm mt-1">
          Find sticker matches with your friends
        </p>
      </div>

      <TradeComparison myId={myId} users={ranked} />
    </div>
  );
}
