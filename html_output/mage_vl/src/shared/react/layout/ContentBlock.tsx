import type { HTMLAttributes, ReactNode } from 'react';
import { Typography, type TypographyVariant } from '../typography/Typography';
import { classNames } from '../utils';

export interface ContentBlockProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  headerClassName?: string;
  bodyClassName?: string;
}

export function ContentBlock({
  title,
  subtitle,
  headingLevel = 2,
  headerClassName,
  bodyClassName,
  className,
  children,
  ...props
}: ContentBlockProps) {
  const Heading = `h${headingLevel}` as const;
  const headingVariant: TypographyVariant = headingLevel === 2 ? 'h2' : 'h3';
  const hasHeader = title !== undefined || subtitle !== undefined;

  return (
    <section className={classNames('edu-content-block', className)} {...props}>
      {hasHeader && (
        <header className={classNames('edu-content-head', headerClassName)}>
          {title !== undefined && <Typography as={Heading} variant={headingVariant} tone="accent" className="edu-content-title">{title}</Typography>}
          {subtitle !== undefined && <Typography variant="bodySmall" tone="muted" className="edu-content-subtitle">{subtitle}</Typography>}
        </header>
      )}
      <div className={classNames('edu-content-body', bodyClassName)}>{children}</div>
    </section>
  );
}
