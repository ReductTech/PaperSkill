import type { HTMLAttributes, ReactNode } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export interface ModuleShellProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  header?: ReactNode;
  headerClassName?: string;
  progress?: ReactNode;
  shellClassName?: string;
}

export function ModuleShell({
  title,
  subtitle,
  badge,
  header,
  headerClassName,
  progress,
  shellClassName,
  className,
  children,
  ...props
}: ModuleShellProps) {
  const hasHeader = header !== undefined || title !== undefined || subtitle !== undefined || badge !== undefined;

  return (
    <main className={classNames('edu-root', className)} {...props}>
      <section className={classNames('edu-shell', shellClassName)}>
        {hasHeader && (
          <header className={classNames('edu-header', headerClassName)}>
            {header ?? (
              <>
                <div>
                  {title !== undefined && <Typography as="h1" variant="display" className="edu-title">{title}</Typography>}
                  {subtitle !== undefined && <Typography variant="subtitle" tone="muted" className="edu-subtitle">{subtitle}</Typography>}
                </div>
                {badge !== undefined && <Typography as="span" variant="label" tone="muted" className="edu-badge">{badge}</Typography>}
              </>
            )}
          </header>
        )}
        {progress}
        {children}
      </section>
    </main>
  );
}
