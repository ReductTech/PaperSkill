import type { InputHTMLAttributes } from "react";

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  label: string;
  value: number;
  onChange: (value: number) => void;
  displayValue?: string;
};

export function Slider({ label, value, onChange, displayValue, min = 0, max = 100, step = 1, ...props }: SliderProps) {
  const id = props.id ?? `rk-slider-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label className="rk-slider" htmlFor={id}>
      <span className="rk-slider__heading">
        <span>{label}</span>
        <output htmlFor={id}>{displayValue ?? value}</output>
      </span>
      <input
        {...props}
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}
