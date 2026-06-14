"use client";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Small segmented toggle group used for sort/view controls across screens
 * (collection, compare, trade detail).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div className={`flex rounded-lg overflow-hidden border border-panini-blue/40 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            value === option.value
              ? "bg-panini-blue text-panini-white"
              : "bg-panini-navy text-panini-gray hover:text-panini-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
