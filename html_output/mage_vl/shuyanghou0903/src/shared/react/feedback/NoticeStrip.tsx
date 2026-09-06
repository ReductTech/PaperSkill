import type { HTMLAttributes, ReactNode } from 'react';
import type { FeedbackTone } from './Callout';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export interface NoticeStripProps extends HTMLAttributes<HTMLDivElement> {
  tone?: FeedbackTone;
  lead?: ReactNode;
}

export function NoticeStrip({
  tone = 'blue',
  lead,
  className,
  children,
  ...props
}: NoticeStripProps) {
  return (
    <Typography as="div" variant="inherit" tone="inherit" className={classNames('edu-notice-strip', `edu-notice-strip--${tone}`, className)} {...props}>
      {lead !== undefined && <Typography as="strong" variant="inherit" tone="inherit">{lead}</Typography>}
      {lead !== undefined && children !== undefined ? ' ' : null}
      {children}
    </Typography>
  );
}
