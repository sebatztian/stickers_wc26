interface BadgeProps {
  variant: "foil" | "owned" | "needed" | "duplicate" | "pending" | "accepted" | "rejected" | "cancelled";
  children: React.ReactNode;
  className?: string;
}

const VARIANTS = {
  foil: "bg-panini-gold/20 text-panini-gold border border-panini-gold/40",
  owned: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
  needed: "bg-panini-blue-mid/20 text-panini-blue-lt border border-panini-blue-mid/40",
  duplicate: "bg-orange-500/20 text-orange-400 border border-orange-500/40",
  pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
  accepted: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
  rejected: "bg-panini-red/20 text-panini-red border border-panini-red/40",
  cancelled: "bg-panini-gray/20 text-panini-gray border border-panini-gray/40",
};

export function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
