import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  label: ReactNode;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  controlClassName?: string;
  onChange?: (value: string, option: SelectOption) => void;
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  name,
  disabled = false,
  className,
  controlClassName,
  onChange,
}: SelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '');
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function choose(option: SelectOption) {
    if (option.disabled) return;
    if (value === undefined) setInternalValue(option.value);
    onChange?.(option.value, option);
    setOpen(false);
  }

  function focusOption(index: number) {
    const next = Math.max(0, Math.min(options.length - 1, index));
    optionRefs.current[next]?.focus();
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(options.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className={classNames('edu-control', controlClassName)}>
      <Typography as="span" variant="label" tone="muted" className="edu-label" id={`${id}-label`}>{label}</Typography>
      <div
        ref={rootRef}
        className={classNames('edu-selectbox', open && 'is-open', className)}
        data-dl-selectbox
      >
        <button
          className="edu-selectbox-trigger"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-menu`}
          aria-labelledby={`${id}-label ${id}-value`}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
              requestAnimationFrame(() => focusOption(Math.max(0, options.findIndex((option) => option.value === selectedValue))));
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          <Typography as="span" variant="inherit" tone="inherit" id={`${id}-value`} data-selectbox-value>{selectedOption?.label}</Typography>
        </button>
        <div
          className="edu-selectbox-menu"
          id={`${id}-menu`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          hidden={!open}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(node) => { optionRefs.current[index] = node; }}
              className="edu-selectbox-option"
              type="button"
              role="option"
              aria-selected={option.value === selectedValue}
              data-value={option.value}
              disabled={option.disabled}
              onClick={() => choose(option)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <Typography as="span" variant="inherit" tone="inherit">{option.label}</Typography>
            </button>
          ))}
        </div>
        {name && <input type="hidden" name={name} value={selectedValue} />}
      </div>
    </div>
  );
}
