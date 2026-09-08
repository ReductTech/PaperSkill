import React, { useState } from 'react';

/**
 * Progressive hero media: plays the video at `src` when the file exists
 * (drop it under public/videos/), otherwise silently keeps the canvas
 * animation passed as children. No code change needed when the video lands.
 */
export function HeroVideo({ src, label, children }: {
  src: string;
  label: string;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ width: '100%' }}>
      {!failed ? (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          aria-label={label}
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
          style={{ width: '100%', borderRadius: 8, display: ready ? 'block' : 'none' }}
        />
      ) : null}
      <div style={{ display: ready ? 'none' : 'contents' }}>{children}</div>
    </div>
  );
}
