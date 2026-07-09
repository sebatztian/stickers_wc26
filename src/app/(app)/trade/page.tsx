import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTradesForUser } from "@/lib/queries/trades";
import { Badge } from "@/components/ui/Badge";
import { getDisplayStatus } from "@/lib/utils";
import Link from "next/link";

export default async function TradePage() {
  const session = await getServerSession(authOptions);
  const trades = await getTradesForUser(session!.user.id);

  const incoming = trades.filter(
    (t) => !t.isVirtual && t.receiverId === session!.user.id && t.status === "PENDING"
  );
  const outgoing = trades.filter(
    (t) => !t.isVirtual && t.initiatorId === session!.user.id && t.status === "PENDING"
  );
  const virtual = trades.filter((t) => t.isVirtual);
  const history = trades.filter((t) => !t.isVirtual && t.status !== "PENDING");

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-panini-gold tracking-wide">
            TRADES
          </h1>
          <p className="text-panini-gray text-sm mt-1">Manage your trade proposals</p>
        </div>
        <Link
          href="/trade/new"
          className="bg-panini-gold hover:bg-panini-gold-lt text-panini-navy font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + New Trade
        </Link>
      </div>

      <TradeSection title="Incoming" trades={incoming} currentUserId={session!.user.id} />
      <TradeSection title="Outgoing" trades={outgoing} currentUserId={session!.user.id} />
      <TradeSection title="Imported" trades={virtual} currentUserId={session!.user.id} />
      <TradeSection title="History" trades={history} currentUserId={session!.user.id} />
    </div>
  );
}

function TradeSection({
  title,
  trades,
  currentUserId,
}: {
  title: string;
  trades: Awaited<ReturnType<typeof getTradesForUser>>;
  currentUserId: string;
}) {
  if (trades.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-bold text-panini-white tracking-wide">
        {title} ({trades.length})
      </h2>
      <div className="space-y-2">
        {trades.map((trade) => {
          const partner =
            trade.initiatorId === currentUserId ? trade.receiver : trade.initiator;
          const offered = trade.items.filter((i) => i.direction === "OFFERED" && !i.forUserId);
          const requested = trade.items.filter((i) => i.direction === "REQUESTED" && !i.forUserId);
          const forFriends = trade.items.filter((i) => i.forUserId).length;

          const partnerLabel = trade.isVirtual
            ? trade.virtualPartnerName ?? "Imported"
            : partner.name;
          const directionLabel = trade.isVirtual
            ? "with"
            : title === "Incoming"
            ? "From"
            : "To";

          return (
            <Link
              key={trade.id}
              href={`/trade/${trade.id}`}
              className="flex items-center justify-between bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-4 hover:border-panini-gold/40 transition-colors"
            >
              <div>
                <p className="text-panini-white font-medium">
                  {directionLabel}{" "}
                  <span className="text-panini-gold">{partnerLabel}</span>
                </p>
                <p className="text-panini-gray text-xs mt-0.5">
                  {offered.length} offered · {requested.length} requested
                  {forFriends > 0 && (
                    <> · <span className="text-panini-gold">{forFriends} for friends</span></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const ds = getDisplayStatus(trade);
                  return (
                    <Badge variant={ds.toLowerCase() as "pending" | "accepted" | "rejected" | "cancelled" | "deal done"}>
                      {ds}
                    </Badge>
                  );
                })()}
                <span className="text-panini-gray text-xs">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
