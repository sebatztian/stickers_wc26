import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { TradeActions } from "@/components/trades/TradeActions";
import { TradeApplyButton } from "@/components/trades/TradeApplyButton";
import { TradeStickerLists } from "@/components/trades/TradeStickerLists";
import Link from "next/link";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const trade = await prisma.trade.findUnique({
    where: { id },
    include: {
      initiator: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
      items: { include: { sticker: true } },
    },
  });

  if (!trade) notFound();
  if (trade.initiatorId !== session!.user.id && trade.receiverId !== session!.user.id) {
    notFound();
  }

  const offered = trade.items.filter((i) => i.direction === "OFFERED");
  const requested = trade.items.filter((i) => i.direction === "REQUESTED");
  const isInitiator = trade.initiatorId === session!.user.id;
  const partner = isInitiator ? trade.receiver : trade.initiator;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/trade" className="text-panini-gray hover:text-panini-white text-sm transition-colors">
        ← Back to trades
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-panini-white tracking-wide">
            Trade with <span className="text-panini-gold">{partner.name}</span>
          </h1>
          <p className="text-panini-gray text-sm mt-1">
            {new Date(trade.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={trade.status.toLowerCase() as "pending" | "accepted" | "rejected" | "cancelled"}>
          {trade.status}
        </Badge>
      </div>

      {trade.message && (
        <div className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4">
          <p className="text-panini-gray text-sm italic">&ldquo;{trade.message}&rdquo;</p>
        </div>
      )}

      <TradeStickerLists
        offered={{
          title: isInitiator ? "You offer" : `${trade.initiator.name} offers`,
          items: offered,
        }}
        requested={{
          title: isInitiator ? "You request" : `${trade.initiator.name} requests`,
          items: requested,
        }}
      />

      {trade.status === "PENDING" && (
        <TradeActions tradeId={trade.id} isInitiator={isInitiator} />
      )}

      {trade.status === "ACCEPTED" && (
        <div className="bg-panini-blue/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
          <p className="text-emerald-400 font-medium text-sm">
            This trade was accepted. Apply it to update your collection.
          </p>
          <TradeApplyButton
            tradeId={trade.id}
            alreadyApplied={isInitiator ? trade.initiatorApplied : trade.receiverApplied}
          />
        </div>
      )}
    </div>
  );
}
