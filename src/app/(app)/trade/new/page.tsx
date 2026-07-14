import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TradeCreateWizard } from "@/components/trades/TradeCreateWizard";

export default async function NewTradePage({
  searchParams,
}: {
  searchParams: Promise<{ receiverId?: string; offer?: string }>;
}) {
  const { receiverId, offer } = await searchParams;
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const offerIds = offer ? offer.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const [myStickers, preselectedOffer] = await Promise.all([
    prisma.userSticker.findMany({
      where: { userId, ownedQty: { gt: 0 } },
      include: { sticker: true },
    }),
    offerIds.length > 0
      ? prisma.sticker.findMany({ where: { id: { in: offerIds } } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-4xl font-bold text-panini-gold tracking-wide">
        PROPOSE TRADE
      </h1>
      <TradeCreateWizard
        myStickers={myStickers}
        preselectedReceiverId={receiverId ?? ""}
        preselectedOffer={preselectedOffer}
      />
    </div>
  );
}
