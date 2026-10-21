import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "small" | "medium";
  children: ReactNode;
};

export function Button({ variant = "primary", size = "medium", className = "", type = "button", children, ...props }: ButtonProps) {
  return (
    <button type={type} className={`rk-button rk-button--${variant} rk-button--${size} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
