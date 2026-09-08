import { useId, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export interface RangeControlProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  digits?: number;
  prefix?: string;
  suffix?: string;
  unset?: boolean;
  scale?: ReactNode[];
  /** 离散档位滑杆会显示刻度标签与刻度线；默认是连续滑杆。 */
  discrete?: boolean;
  /** 首次交互前使用通用高亮提示效果。 */
  hint?: boolean;
  controlClassName?: string;
  formatValue?: (value: string) => ReactNode;
}

export function RangeControl({
  label,
  digits,
  prefix = '',
  suffix = '',
  unset = false,
  scale,
  discrete = false,
  hint = false,
  controlClassName,
  className,
  formatValue,
  id,
  value,
  defaultValue,
  onChange,
  onPointerEnter,
  onFocus,
  ...props
}: RangeControlProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [revealed, setRevealed] = useState(!unset);
  const [hintActive, setHintActive] = useState(hint);
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? value ?? props.min ?? 0));
  const currentValue = value === undefined ? internalValue : String(value);
  const isUnset = unset && !revealed;

  const formattedValue = (() => {
    if (isUnset) return null;
    if (formatValue) return formatValue(currentValue);
    const numericValue = Number(currentValue);
    const displayValue = digits === undefined || !Number.isFinite(numericValue)
      ? currentValue
      : numericValue.toFixed(Math.max(0, digits));
    return `${prefix}${displayValue}${suffix}`;
  })();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setRevealed(true);
    setHintActive(false);
    if (value === undefined) setInternalValue(event.currentTarget.value);
    onChange?.(event);
  }

  return (
    <label
      className={classNames('edu-control', discrete && 'is-discrete', isUnset && 'is-unset', controlClassName)}
      htmlFor={inputId}
    >
      <span className="edu-control-head">
        <Typography as="span" variant="label" tone="muted" className="edu-label">{label}</Typography>
        <Typography as="output" variant="code" tone="accent" className="edu-control-value" htmlFor={inputId} data-i18n-ignore="true">
          {formattedValue}
        </Typography>
      </span>
      <input
        {...props}
        id={inputId}
        type="range"
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={handleChange}
        onPointerEnter={(event) => {
          setHintActive(false);
          onPointerEnter?.(event);
        }}
        onFocus={(event) => {
          setHintActive(false);
          onFocus?.(event);
        }}
        className={classNames('edu-range', discrete && 'edu-range--discrete', isUnset && 'is-unset', hint && hintActive && 'edu-attention-hint', className)}
        data-dl-range
        data-range-digits={digits}
        data-range-prefix={prefix || undefined}
        data-range-suffix={suffix || undefined}
        aria-valuetext={isUnset ? '尚未输入' : String(formattedValue)}
      />
      {scale && scale.length > 0 && (
        <span className="edu-range-scale" aria-hidden="true">
          {scale.map((item, index) => <Typography as="span" variant="inherit" tone="inherit" key={index}><i aria-hidden="true" />{item}</Typography>)}
        </span>
      )}
    </label>
  );
}
