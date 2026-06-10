import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
  <rect width="300" height="400" fill="#1B3A8C"/>
  <rect x="20" y="20" width="260" height="360" rx="6" fill="#0A1628" stroke="#F0B429" stroke-width="2"/>
  <circle cx="150" cy="160" r="60" fill="#2651C8"/>
  <ellipse cx="150" cy="320" rx="80" ry="30" fill="#2651C8"/>
  <text x="150" y="380" font-family="Arial,sans-serif" font-size="14" fill="#6B7A99" text-anchor="middle">No Image</text>
</svg>`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const sticker = await prisma.sticker.findUnique({
    where: { id },
    select: { imagePath: true, code: true },
  });

  if (sticker?.imagePath) {
    // Wikimedia URL — redirect the browser directly to it
    if (sticker.imagePath.startsWith("http")) {
      return NextResponse.redirect(sticker.imagePath, {
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }

    // Legacy local path (development fallback)
    try {
      const { promises: fs } = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "data", sticker.imagePath);
      const data = await fs.readFile(filePath);
      return new NextResponse(data, {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
      });
    } catch {
      // fall through
    }
  }

  // Dev fallback: try local file by convention
  if (sticker?.code) {
    try {
      const { promises: fs } = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "data", "pictures", sticker.code, `${id}.jpg`);
      const data = await fs.readFile(filePath);
      return new NextResponse(data, {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
      });
    } catch {
      // fall through
    }
  }

  // Do NOT cache the placeholder: once an image URL is added for this sticker,
  // the next request should pick it up instead of serving a stale placeholder.
  return new NextResponse(PLACEHOLDER_SVG, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  });
}
