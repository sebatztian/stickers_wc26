import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { getDisplayStatus, formatStickerId } from "@/lib/utils";
import { TradeActions } from "@/components/trades/TradeActions";
import { TradeApplyButton } from "@/components/trades/TradeApplyButton";
import { VirtualTradeActions } from "@/components/trades/VirtualTradeActions";
import { CopyTradeProposal } from "@/components/trades/CopyTradeProposal";
import { DealDoneButton } from "@/components/trades/DealDoneButton";
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
      items: { include: { sticker: true, forUser: { select: { id: true, name: true } } } },
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
  const offered = trade.items.filter((i) => i.direction === "OFFERED" && !i.forUserId);
  // Requested stickers meant for the trader themselves (not friend pickups).
  const requested = trade.items.filter((i) => i.direction === "REQUESTED" && !i.forUserId);
  const myGiveIds = trade.items
    .filter((i) => i.direction === myGiveDirection && !i.forUserId)
    .map((i) => i.stickerId);
  const myReceiveIds = trade.items
    .filter((i) => i.direction === myReceiveDirection && !i.forUserId)
    .map((i) => i.stickerId);

  // Stickers picked up from this trade on behalf of other users, grouped by user.
  const friendPickups = new Map<string, { name: string; items: typeof trade.items }>();
  for (const item of trade.items) {
    if (!item.forUserId || !item.forUser) continue;
    const entry = friendPickups.get(item.forUserId) ?? { name: item.forUser.name, items: [] };
    entry.items.push(item);
    friendPickups.set(item.forUserId, entry);
  }
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
          {(() => {
            const ds = getDisplayStatus(trade);
            return (
              <Badge variant={ds.toLowerCase() as "pending" | "accepted" | "rejected" | "cancelled" | "deal done"}>
                {ds}
              </Badge>
            );
          })()}
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

      {friendPickups.size > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-bold text-panini-white text-lg">
            Picking up for friends
          </h3>
          <div className="space-y-3">
            {[...friendPickups.entries()].map(([userId, { name, items }]) => (
              <div
                key={userId}
                className="bg-panini-blue/10 border border-panini-gold/30 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="foil">For {name}</Badge>
                  <span className="text-panini-gray text-xs">
                    {items.length} sticker{items.length !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/trade/new?receiverId=${userId}&offer=${items
                      .map((i) => encodeURIComponent(i.stickerId))
                      .join(",")}`}
                    className="ml-auto text-xs font-medium bg-panini-gold hover:bg-panini-gold-lt text-panini-navy rounded-lg px-3 py-1 transition-colors"
                  >
                    Trade with {name} →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((i) => (
                    <span
                      key={i.id}
                      className="text-xs font-medium text-panini-white bg-panini-navy border border-panini-blue/40 rounded px-2 py-1"
                    >
                      {formatStickerId(i.sticker.id)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <DealDoneButton
        tradeId={trade.id}
        isInitiator={isInitiator}
        initiatorDealDone={trade.initiatorDealDone}
        receiverDealDone={trade.receiverDealDone}
      />

      {trade.isVirtual && (
        <VirtualTradeActions tradeId={trade.id} />
      )}
    </div>
  );
}
