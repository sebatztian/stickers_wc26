import { config } from "dotenv";
config({ path: ".env.local", override: true });
config({ path: ".env" });

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const total = await prisma.sticker.count();
  const withUrl = await prisma.sticker.count({ where: { imagePath: { not: null } } });
  const sample = await prisma.sticker.findMany({
    where: { imagePath: { not: null } },
    take: 3,
    select: { id: true, imagePath: true },
    orderBy: { albumNumber: "desc" },
  });
  console.log(`Total stickers:        ${total}`);
  console.log(`With imagePath set:    ${withUrl}`);
  console.log(`Without imagePath:     ${total - withUrl}`);
  console.log(`\nSample (highest album numbers):`);
  for (const s of sample) console.log(`  ${s.id}: ${s.imagePath?.slice(0, 70)}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
