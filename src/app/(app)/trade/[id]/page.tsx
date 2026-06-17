import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { TradeActions } from "@/components/trades/TradeActions";
import { TradeApplyButton } from "@/components/trades/TradeApplyButton";
import { VirtualTradeActions } from "@/components/trades/VirtualTradeActions";
import { CopyTradeProposal } from "@/components/trades/CopyTradeProposal";
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

  const isInitiator = trade.initiatorId === session!.user.id;
  // From current user's perspective
  const myGiveDirection = isInitiator ? "OFFERED" : "REQUESTED";
  const myReceiveDirection = isInitiator ? "REQUESTED" : "OFFERED";
  const offered = trade.items.filter((i) => i.direction === "OFFERED");
  const requested = trade.items.filter((i) => i.direction === "REQUESTED");
  const myGiveIds = trade.items.filter((i) => i.direction === myGiveDirection).map((i) => i.stickerId);
  const myReceiveIds = trade.items.filter((i) => i.direction === myReceiveDirection).map((i) => i.stickerId);
  const partner = isInitiator ? trade.receiver : trade.initiator;
  const partnerName = trade.isVirtual
    ? (trade.virtualPartnerName ?? "Imported collection")
    : partner.name;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/trade" className="text-panini-gray hover:text-panini-white text-sm transition-colors">
        ← Back to trades
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-panini-white tracking-wide">
            Trade with <span className="text-panini-gold">{partnerName}</span>
          </h1>
          <p className="text-panini-gray text-sm mt-1">
            {new Date(trade.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CopyTradeProposal offerIds={myGiveIds} requestIds={myReceiveIds} />
          <Badge variant={trade.status.toLowerCase() as "pending" | "accepted" | "rejected" | "cancelled"}>
            {trade.status}
          </Badge>
        </div>
      </div>

      {trade.virtualContactUrl && (
        <div className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-panini-gray text-sm shrink-0">Listing:</span>
          <a
            href={trade.virtualContactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-panini-blue-lt hover:text-panini-gold text-sm truncate transition-colors"
          >
            {trade.virtualContactUrl}
          </a>
        </div>
      )}

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

      {trade.status === "PENDING" && !trade.isVirtual && (
        <TradeActions tradeId={trade.id} isInitiator={isInitiator} />
      )}

      {trade.status === "ACCEPTED" && (
        <div className="bg-panini-blue/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
          <p className="text-emerald-400 font-medium text-sm">
            {trade.isVirtual
              ? "Apply this trade to update your collection."
              : "This trade was accepted. Apply it to update your collection."}
          </p>
          <TradeApplyButton
            tradeId={trade.id}
            alreadyApplied={trade.isVirtual ? trade.initiatorApplied : isInitiator ? trade.initiatorApplied : trade.receiverApplied}
          />
        </div>
      )}

      {trade.isVirtual && (
        <VirtualTradeActions tradeId={trade.id} />
      )}
    </div>
  );
}
