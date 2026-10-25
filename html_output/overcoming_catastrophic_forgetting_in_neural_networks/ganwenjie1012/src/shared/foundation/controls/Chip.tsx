import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> & {
  active?: boolean;
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
};

export function Chip({ active = false, tone = "neutral", className = "", children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`rk-chip rk-chip--${tone} ${active ? "is-active" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
