import { useEffect, type ReactNode, type RefObject } from 'react';
import { Typography } from '../typography/Typography';

export interface ScrollCueProps {
  targetRef: RefObject<Element | null>;
  onDismiss: () => void;
  children: ReactNode;
}

/** 模式 2 的唯一实现：提示下一段已出现，并在它进入视口后自动结束。 */
export function ScrollCue({ targetRef, onDismiss, children }: ScrollCueProps) {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onDismiss();
    }, { threshold: 0.08 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [onDismiss, targetRef]);

  return <div className="edu-scroll-cue" role="status"><span className="edu-scroll-cue-arrow" aria-hidden="true">↓</span><Typography as="span" variant="inherit" tone="inherit">{children}</Typography></div>;
}
