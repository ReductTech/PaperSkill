import type { ReactNode } from 'react';
import { Callout, type CalloutProps, type FeedbackTone } from './Callout';

export type FeedbackStatus = 'hint' | 'info' | 'correct' | 'wrong';

const statusTone: Record<FeedbackStatus, FeedbackTone> = {
  hint: 'orange',
  info: 'blue',
  correct: 'green',
  wrong: 'red',
};

export interface FeedbackProps extends Omit<CalloutProps, 'tone' | 'text'> {
  status?: FeedbackStatus;
  message?: ReactNode;
  tone?: FeedbackTone;
}

export function Feedback({
  status = 'info',
  tone,
  message,
  className,
  ...props
}: FeedbackProps) {
  return (
    <Callout
      tone={tone ?? statusTone[status]}
      text={message}
      className={className}
      aria-live="polite"
      {...props}
    />
  );
}
