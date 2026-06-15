import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVirtualCollectionsWithMatches } from "@/lib/queries/trades";
import { ImportedComparison } from "@/components/trades/ImportedComparison";
import Link from "next/link";

export default async function TradeImportPage() {
  const session = await getServerSession(authOptions);
  const collections = await getVirtualCollectionsWithMatches(session!.user.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/trade/compare"
          className="text-panini-gray hover:text-panini-white text-sm transition-colors"
        >
          ← Back to comparison
        </Link>
        <h1 className="font-display text-4xl font-bold text-panini-gold tracking-wide mt-1">
          IMPORTED COLLECTION
        </h1>
        <p className="text-panini-gray text-sm mt-1">
          Add an outside collection by hand to find what you can trade. Only you can see it.
        </p>
      </div>

      <ImportedComparison collections={collections} />
    </div>
  );
}
