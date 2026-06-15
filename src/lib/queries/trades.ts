import { prisma } from "@/lib/db";
import type { Sticker } from "@/generated/prisma/client";

export async function getTradeMatches(myId: string, theirId: string) {
  const [myStickers, theirStickers, activeTrades] = await Promise.all([
    prisma.userSticker.findMany({ where: { userId: myId }, include: { sticker: true } }),
    prisma.userSticker.findMany({ where: { userId: theirId }, include: { sticker: true } }),
    // Active trades between these two users in either direction
    prisma.trade.findMany({
      where: {
        status: { in: ["PENDING", "ACCEPTED"] },
        OR: [
          { initiatorId: myId, receiverId: theirId },
          { initiatorId: theirId, receiverId: myId },
        ],
      },
      include: { items: true },
    }),
  ]);

  // Sticker IDs I've already committed to give them (OFFERED in trades where I'm initiator)
  const myCommittedIds = new Set(
    activeTrades
      .filter((t) => t.initiatorId === myId)
      .flatMap((t) => t.items)
      .filter((i) => i.direction === "OFFERED")
      .map((i) => i.stickerId)
  );

  // Sticker IDs they've already committed to give me (OFFERED in trades where they're initiator)
  const theirCommittedIds = new Set(
    activeTrades
      .filter((t) => t.initiatorId === theirId)
      .flatMap((t) => t.items)
      .filter((i) => i.direction === "OFFERED")
      .map((i) => i.stickerId)
  );

  const myOwnedMap = new Map(myStickers.map((s) => [s.stickerId, s.ownedQty]));
  const theirOwnedMap = new Map(theirStickers.map((s) => [s.stickerId, s.ownedQty]));

  const iCanGiveThem = myStickers
    .filter(
      (s) =>
        s.ownedQty > 1 &&
        (theirOwnedMap.get(s.stickerId) ?? 0) === 0 &&
        !myCommittedIds.has(s.stickerId)
    )
    .map((s) => ({ sticker: s.sticker, ownedQty: s.ownedQty }));

  const theyCanGiveMe = theirStickers
    .filter(
      (s) =>
        s.ownedQty > 1 &&
        (myOwnedMap.get(s.stickerId) ?? 0) === 0 &&
        !theirCommittedIds.has(s.stickerId)
    )
    .map((s) => ({ sticker: s.sticker, ownedQty: s.ownedQty }));

  // Everything they own (qty > 0) — used by the trade wizard's "show all" toggle
  const theirOwned = theirStickers
    .filter((s) => s.ownedQty > 0)
    .map((s) => ({ sticker: s.sticker, ownedQty: s.ownedQty }));

  return { iCanGiveThem, theyCanGiveMe, theirOwned };
}

export type VirtualCollectionWithMatches = {
  id: string;
  name: string;
  duplicates: string[];
  missing: string[];
  iCanGiveThem: { sticker: Sticker; ownedQty: number }[];
  theyCanGiveMe: { sticker: Sticker; ownedQty: number }[];
};

/**
 * Load a user's imported (virtual) collections and, for each, work out the
 * tradeable stickers against the user's own collection:
 *   iCanGiveThem  = my duplicates (qty > 1) that the import lists as missing
 *   theyCanGiveMe = the import's duplicates that I don't own yet
 */
export async function getVirtualCollectionsWithMatches(
  myId: string
): Promise<VirtualCollectionWithMatches[]> {
  const [collections, myStickers, allStickers] = await Promise.all([
    prisma.virtualCollection.findMany({
      where: { ownerId: myId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userSticker.findMany({ where: { userId: myId }, include: { sticker: true } }),
    prisma.sticker.findMany(),
  ]);

  const myOwnedMap = new Map(myStickers.map((s) => [s.stickerId, s.ownedQty]));
  const stickerMap = new Map(allStickers.map((s) => [s.id, s]));

  return collections.map((vc) => {
    const missingSet = new Set(vc.missing);
    const iCanGiveThem = myStickers
      .filter((s) => s.ownedQty > 1 && missingSet.has(s.stickerId))
      .map((s) => ({ sticker: s.sticker, ownedQty: s.ownedQty }));

    const theyCanGiveMe = vc.duplicates
      .filter((id) => (myOwnedMap.get(id) ?? 0) === 0)
      .map((id) => stickerMap.get(id))
      .filter((s): s is Sticker => Boolean(s))
      .map((sticker) => ({ sticker, ownedQty: 1 }));

    return {
      id: vc.id,
      name: vc.name,
      duplicates: vc.duplicates,
      missing: vc.missing,
      iCanGiveThem,
      theyCanGiveMe,
    };
  });
}

export async function getTradesForUser(userId: string) {
  return prisma.trade.findMany({
    where: {
      OR: [{ initiatorId: userId }, { receiverId: userId }],
    },
    include: {
      initiator: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
      items: { include: { sticker: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
