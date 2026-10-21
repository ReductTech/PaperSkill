import type { ReactNode } from "react";

export type Segment<T extends string> = { value: T; label: ReactNode; disabled?: boolean };
export type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: Segment<T>[];
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({ label, value, options, onChange, className = "" }: SegmentedControlProps<T>) {
  return (
    <div className={`rk-segments ${className}`.trim()} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`rk-segments__option ${value === option.value ? "is-active" : ""}`}
          aria-pressed={value === option.value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
