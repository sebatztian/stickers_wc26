import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TradeComparison } from "@/components/trades/TradeComparison";

export default async function TradeComparePage() {
  const session = await getServerSession(authOptions);

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

      <TradeComparison myId={session!.user.id} />
    </div>
  );
}
