import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export type FeedbackTone = 'orange' | 'blue' | 'green' | 'red';

export interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  tone?: FeedbackTone;
  label?: ReactNode;
  text?: ReactNode;
  streaming?: boolean;
  streamInterval?: number;
}

export function Callout({
  tone = 'blue',
  label,
  text,
  streaming = false,
  streamInterval = 28,
  className,
  children,
  ...props
}: CalloutProps) {
  const content = text ?? children;
  const sourceText = typeof content === 'string' ? content : null;
  const [streamedText, setStreamedText] = useState<string | null>(
    streaming && sourceText !== null ? '' : null,
  );
  const [isStreaming, setIsStreaming] = useState(streaming && sourceText !== null && sourceText.length > 0);

  useEffect(() => {
    if (!streaming || sourceText === null) {
      setStreamedText(null);
      setIsStreaming(false);
      return;
    }

    const characters = Array.from(sourceText);
    if (characters.length === 0) {
      setStreamedText('');
      setIsStreaming(false);
      return;
    }

    setStreamedText('');
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setStreamedText(sourceText);
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setStreamedText(characters.slice(0, index).join(''));
      if (index >= characters.length) {
        window.clearInterval(timer);
        setIsStreaming(false);
      }
    }, Math.max(12, streamInterval));

    return () => window.clearInterval(timer);
  }, [sourceText, streamInterval, streaming]);

  return (
    <div
      className={classNames(
        'edu-callout',
        `edu-callout--${tone}`,
        streaming && 'edu-callout--stream',
        isStreaming && 'is-streaming',
        className,
      )}
      {...props}
    >
      {label !== undefined && <Typography as="strong" variant="label" tone="inherit" className="edu-callout-label">{label}</Typography>}
      <Typography as="span" variant="bodySmall" tone="inherit" className="edu-callout-text" data-stream-output={streaming || undefined}>
        {sourceText !== null && streamedText !== null ? streamedText : content}
      </Typography>
    </div>
  );
}
