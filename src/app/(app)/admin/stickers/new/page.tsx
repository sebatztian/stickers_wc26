import { StickerForm } from "@/components/admin/StickerForm";
import Link from "next/link";

export default function NewStickerPage() {
  return (
    <div className="max-w-lg space-y-6">
      <Link href="/collection" className="text-panini-gray hover:text-panini-white text-sm transition-colors">
        ← Back to collection
      </Link>
      <div>
        <h1 className="font-display text-4xl font-bold text-panini-gold tracking-wide">
          ADD STICKER
        </h1>
        <p className="text-panini-gray text-sm mt-1">Add a new player or card to the album</p>
      </div>
      <StickerForm />
    </div>
  );
}
