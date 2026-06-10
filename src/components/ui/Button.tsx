import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const VARIANTS = {
  primary: "bg-panini-gold hover:bg-panini-gold-lt text-panini-navy font-bold",
  secondary: "bg-panini-blue hover:bg-panini-blue-mid text-panini-white",
  ghost: "bg-transparent hover:bg-panini-blue/20 text-panini-gray hover:text-panini-white border border-panini-blue/30",
  danger: "bg-panini-red/20 hover:bg-panini-red/30 text-panini-red border border-panini-red/30",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 transition-colors font-medium ${VARIANTS[variant]} ${SIZES[size]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
