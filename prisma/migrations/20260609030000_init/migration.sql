CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

CREATE TABLE "stickers" (
    "id" TEXT NOT NULL,
    "albumNumber" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isFoil" BOOLEAN NOT NULL DEFAULT false,
    "isTeamLogo" BOOLEAN NOT NULL DEFAULT false,
    "isTeamPhoto" BOOLEAN NOT NULL DEFAULT false,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "imagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stickers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stickers_albumNumber_key" ON "stickers"("albumNumber");
CREATE INDEX "stickers_code_idx" ON "stickers"("code");

CREATE TABLE "user_stickers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stickerId" TEXT NOT NULL,
    "ownedQty" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_stickers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_stickers_userId_stickerId_key" ON "user_stickers"("userId", "stickerId");
CREATE INDEX "user_stickers_userId_idx" ON "user_stickers"("userId");

CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "initiatorApplied" BOOLEAN NOT NULL DEFAULT false,
    "receiverApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trades_initiatorId_idx" ON "trades"("initiatorId");
CREATE INDEX "trades_receiverId_idx" ON "trades"("receiverId");

CREATE TABLE "trade_items" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "stickerId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "trade_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trade_items_tradeId_idx" ON "trade_items"("tradeId");

ALTER TABLE "user_stickers"
    ADD CONSTRAINT "user_stickers_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_stickers"
    ADD CONSTRAINT "user_stickers_stickerId_fkey"
    FOREIGN KEY ("stickerId") REFERENCES "stickers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trades"
    ADD CONSTRAINT "trades_initiatorId_fkey"
    FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "trades"
    ADD CONSTRAINT "trades_receiverId_fkey"
    FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "trade_items"
    ADD CONSTRAINT "trade_items_tradeId_fkey"
    FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trade_items"
    ADD CONSTRAINT "trade_items_stickerId_fkey"
    FOREIGN KEY ("stickerId") REFERENCES "stickers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
