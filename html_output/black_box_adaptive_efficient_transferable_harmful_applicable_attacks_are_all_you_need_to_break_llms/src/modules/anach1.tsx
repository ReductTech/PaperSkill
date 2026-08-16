import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';

/** Chapter-1 analogy: looping metal-safe clip (provided as mp4, plays like a GIF). */
export const AnaCh1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const play = () => {
      void v.play().catch(() => undefined);
    };
    play();
    const onVis = () => {
      if (document.hidden) v.pause();
      else play();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <video
      id={`cv-${chapterId}-${moduleId}`}
      ref={videoRef}
      src="/images/safe-metal.mp4"
      width={244}
      height={130}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      style={{
        width: '244px',
        height: '130px',
        objectFit: 'cover',
        display: 'block',
        borderRadius: 6,
        background: '#f5f8f0',
      }}
    />
  );
};

export default AnaCh1;
