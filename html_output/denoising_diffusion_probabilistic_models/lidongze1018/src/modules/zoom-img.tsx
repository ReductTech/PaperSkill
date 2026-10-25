import React, { useEffect, useState } from 'react';

// Click-to-zoom image (review round 2, P2-1): classroom projection often needs a
// larger view. The overlay renders above everything and closes on click / Esc.
// External dependencies: none — keeps the single-file HTML fully offline.

export function ZoomImg({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <img
        className="zoomable"
        src={src}
        alt={alt}
        title="点击放大查看"
        loading="lazy"
        onClick={() => setOpen(true)}
      />
      {open ? (
        <div
          className="zoom-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <img src={src} alt={alt} />
          <div className="zoom-caption">{caption ?? '点击任意处或按 Esc 关闭'}</div>
        </div>
      ) : null}
    </>
  );
}

export default ZoomImg;
