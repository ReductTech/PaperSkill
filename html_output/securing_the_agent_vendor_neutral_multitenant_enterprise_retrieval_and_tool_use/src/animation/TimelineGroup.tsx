import { useEffect, useRef, type ReactNode } from 'react';
import { TimelineContext, createTimelineStore, type TimelineStore } from './useTimeline';

interface TimelineGroupProps {
  children: ReactNode;
  durationMs?: number;
  autoPlay?: boolean;
}

export function TimelineGroup({ children, durationMs = 4_000, autoPlay = false }: TimelineGroupProps) {
  const storeRef = useRef<TimelineStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createTimelineStore(durationMs);
  }

  useEffect(() => {
    const store = storeRef.current;
    let startFrame: number | null = null;
    if (autoPlay && typeof requestAnimationFrame === 'function') {
      startFrame = requestAnimationFrame((timestamp) => store?.play(timestamp));
    } else if (autoPlay) {
      store?.play();
    }
    return () => {
      if (startFrame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(startFrame);
      store?.dispose();
    };
  }, [autoPlay]);

  return (
    <TimelineContext.Provider value={storeRef.current}>
      {children}
    </TimelineContext.Provider>
  );
}
