import type { HTMLAttributes, ReactNode } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export type ValueTileTone = 'orange' | 'blue' | 'success' | 'danger';

export interface ValueTileProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
  tone?: ValueTileTone;
}

export function ValueTile({ label, value, tone, className, ...props }: ValueTileProps) {
  return (
    <div className={classNames('edu-value-tile', tone && `edu-value-tile--${tone}`, className)} {...props}>
      <Typography as="span" variant="label" tone="inherit" className="edu-value-label">{label}</Typography>
      <Typography as="output" variant="numeric" tone="inherit" className="edu-value-number" data-i18n-ignore="true">{value}</Typography>
    </div>
  );
}
