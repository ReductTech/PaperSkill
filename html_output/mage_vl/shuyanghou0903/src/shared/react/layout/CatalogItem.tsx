import type { ReactNode } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export type CatalogItemVariant = 'foundation' | 'button' | 'control' | 'visual';

export interface CatalogItemProps {
  title: ReactNode;
  description?: ReactNode;
  variant?: CatalogItemVariant;
  className?: string;
  children: ReactNode;
}

export function CatalogItem({
  title,
  description,
  variant = 'foundation',
  className,
  children,
}: CatalogItemProps) {
  if (variant === 'button' || variant === 'control') {
    return (
      <article className={classNames(`${variant}-entry`, className)}>
        <div className={`${variant}-preview`}>{children}</div>
        <div className={`${variant}-copy`}>
          <Typography as="h3" variant="h3">{title}</Typography>
          {description !== undefined && <Typography variant="bodySmall" tone="muted">{description}</Typography>}
        </div>
      </article>
    );
  }

  const visual = variant === 'visual';
  return (
    <article className={classNames(visual ? 'visual-entry' : 'foundation-entry', className)}>
      <header className={visual ? 'visual-entry-head' : 'foundation-entry-head'}>
        <Typography as="h3" variant="h3">{title}</Typography>
        {description !== undefined && <Typography variant="bodySmall" tone="muted">{description}</Typography>}
      </header>
      {children}
    </article>
  );
}
