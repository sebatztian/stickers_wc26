CREATE TABLE "virtual_collections" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duplicates" TEXT[],
    "missing" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "virtual_collections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "virtual_collections_ownerId_idx" ON "virtual_collections"("ownerId");

ALTER TABLE "virtual_collections"
    ADD CONSTRAINT "virtual_collections_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
