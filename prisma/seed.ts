import * as fs from "fs";
import * as path from "path";
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

const CORRECTIONS: Record<string, string> = {
  SWI9: "SUI9",
  SWI20: "SUI20",
  KAS12: "KSA12",
};

interface StickerInput {
  id: string;
  albumNumber: number;
  code: string;
  position: number;
  name: string;
  country: string;
  isFoil: boolean;
  isTeamLogo: boolean;
  isTeamPhoto: boolean;
  isSpecial: boolean;
  imagePath: null;
}

function parseLine(line: string, albumNumber: number): StickerInput | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const m = trimmed.match(/^([A-Z0-9]+)\s+(.+)$/);
  if (!m) return null;

  let rawId = m[1];
  const desc = m[2];

  rawId = CORRECTIONS[rawId] ?? rawId;

  const isFoil = desc.includes("FOIL");
  const isTeamLogo = desc.includes("Team Logo");
  const isTeamPhoto = desc.includes("Team Photo");

  let code: string;
  let position: number;

  if (rawId === "00") {
    code = "00";
    position = 0;
  } else {
    const idMatch = rawId.match(/^([A-Z]+)(\d+)$/);
    if (!idMatch) return null;
    code = idMatch[1];
    position = parseInt(idMatch[2], 10);
  }

  const isSpecial = code === "00" || code === "FWC";

  const cleanDesc = desc.replace(/\s+FOIL$/, "").trim();
  const dashIdx = cleanDesc.lastIndexOf(" - ");
  const name = dashIdx >= 0 ? cleanDesc.slice(0, dashIdx).trim() : cleanDesc;
  const country = dashIdx >= 0 ? cleanDesc.slice(dashIdx + 3).trim() : "";

  return {
    id: rawId,
    albumNumber,
    code,
    position,
    name,
    country,
    isFoil,
    isTeamLogo,
    isTeamPhoto,
    isSpecial,
    imagePath: null,
  };
}

async function main() {
  const filePath = path.join(process.cwd(), "data", "stickers_list.txt");
  const lines = fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .filter((l) => l.trim());

  const stickers: StickerInput[] = [];
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i + 1);
    if (parsed) stickers.push(parsed);
  }

  console.log(`Parsed ${stickers.length} stickers from stickers_list.txt`);

  const existing = await prisma.sticker.count();
  if (existing === stickers.length) {
    console.log(`Already seeded (${existing} stickers). Skipping.`);
    return;
  }

  await prisma.sticker.deleteMany();
  await prisma.sticker.createMany({ data: stickers });

  const count = await prisma.sticker.count();
  console.log(`Database now has ${count} stickers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
