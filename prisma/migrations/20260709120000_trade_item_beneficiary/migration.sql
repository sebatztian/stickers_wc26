-- Add optional beneficiary user to trade items (middleman pickups).
ALTER TABLE "trade_items" ADD COLUMN "forUserId" TEXT;

ALTER TABLE "trade_items"
  ADD CONSTRAINT "trade_items_forUserId_fkey"
  FOREIGN KEY ("forUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
