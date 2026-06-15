ALTER TABLE "trades" ADD COLUMN "isVirtual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "trades" ADD COLUMN "virtualPartnerName" TEXT;
