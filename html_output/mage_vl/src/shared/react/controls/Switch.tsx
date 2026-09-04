import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export function Switch({ label, className, id, ...props }: SwitchProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={classNames('edu-switch', className)} htmlFor={inputId}>
      <input {...props} id={inputId} type="checkbox" />
      <Typography as="span" variant="inherit" tone="inherit">{label}</Typography>
    </label>
  );
}
