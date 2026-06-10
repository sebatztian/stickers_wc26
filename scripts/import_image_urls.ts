/**
 * Reads data/image_urls.json and writes each URL into Sticker.imagePath.
 * Run after fetch_all_image_urls.py:
 *   pnpm tsx scripts/import_image_urls.ts
 */
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), "data", "image_urls.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("data/image_urls.json not found. Run fetch_all_image_urls.py first.");
    process.exit(1);
  }

  const urls: Record<string, string> = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const entries = Object.entries(urls);
  console.log(`Importing ${entries.length} image URLs into database…`);

  let updated = 0;
  let notFound = 0;

  for (const [stickerId, url] of entries) {
    const result = await prisma.sticker.updateMany({
      where: { id: stickerId },
      data: { imagePath: url },
    });
    if (result.count > 0) {
      updated++;
    } else {
      notFound++;
      console.warn(`  [not found in DB] ${stickerId}`);
    }
  }

  console.log(`Done. Updated: ${updated}, Not in DB: ${notFound}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
