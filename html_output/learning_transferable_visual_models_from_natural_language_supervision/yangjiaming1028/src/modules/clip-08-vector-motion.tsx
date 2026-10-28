import { useEffect, useRef, useState } from 'react';

type Angles = { image: number; text: number };
const shortestTurn = (from: number, to: number) => ((to - from + 540) % 360 + 360) % 360 - 180;

// Only the drawing is interpolated. The parent exposes the exact selected pair
// immediately, independently of animation frames and reduced-motion preferences.
function useVectorAngles(image: number, text: number) {
  const [drawing, setDrawing] = useState<Angles>({ image, text });
  const current = useRef(drawing);
  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const paint = (value: Angles) => { current.current = value; setDrawing(value); };
    const begin = () => {
      window.cancelAnimationFrame?.(frame);
      const start = current.current;
      const turn = { image: shortestTurn(start.image, image), text: shortestTurn(start.text, text) };
      if (preference?.matches || !window.requestAnimationFrame || (Math.abs(turn.image) < 1e-9 && Math.abs(turn.text) < 1e-9)) {
        paint({ image, text });
        return;
      }
      let startTime: number | null = null;
      const tick = (time: number) => {
        startTime ??= time;
        const progress = Math.min(1, (time - startTime) / 520);
        const eased = 1 - (1 - progress) ** 3;
        paint(progress === 1 ? { image, text } : { image: start.image + turn.image * eased, text: start.text + turn.text * eased });
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    };
    begin();
    preference?.addEventListener?.('change', begin);
    return () => { window.cancelAnimationFrame?.(frame); preference?.removeEventListener?.('change', begin); };
  }, [image, text]);
  return drawing;
}

export function AnimatedUnitPair({ imageAngle, textAngle, uid, projection = false }: {
  imageAngle: number; textAngle: number; uid: string; projection?: boolean;
}) {
  const angles = useVectorAngles(imageAngle, textAngle);
  const center = { x: 180, y: 162 }, radius = 118;
  const at = (angle: number, length = radius) => ({ x: center.x + Math.cos(angle * Math.PI / 180) * length, y: center.y - Math.sin(angle * Math.PI / 180) * length });
  const image = at(angles.image), text = at(angles.text);
  const turn = shortestTurn(angles.image, angles.text);
  const arcStart = at(angles.image, 40), arcEnd = at(angles.text, 40);
  const similarity = Math.cos(turn * Math.PI / 180);
  const foot = at(angles.image, radius * similarity);
  return <g className="enc-linked-vectors" aria-hidden="true" data-image-angle={angles.image} data-text-angle={angles.text}>
    <path className="enc-angle-sector" d={`M180 162 L${arcStart.x} ${arcStart.y} A40 40 0 0 ${turn < 0 ? 1 : 0} ${arcEnd.x} ${arcEnd.y} Z`} fill="#e8eaf3" />
    <line className="enc-image-ray" x1="180" y1="162" x2={image.x} y2={image.y} stroke="#5365ad" strokeWidth="3" markerEnd={`url(#${uid}-image-arrow)`} />
    <line className="enc-text-ray" x1="180" y1="162" x2={text.x} y2={text.y} stroke="#bd9254" strokeWidth="3" markerEnd={`url(#${uid}-text-arrow)`} />
    {projection && <g className="enc-cosine-projection">
      <line x1={text.x} y1={text.y} x2={foot.x} y2={foot.y} stroke="#a8967c" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="180" y1="162" x2={foot.x} y2={foot.y} stroke="#5365ad" strokeWidth="7" strokeLinecap="round" opacity=".23" />
      <circle className="enc-projection-foot" cx={foot.x} cy={foot.y} r="5" fill="#fff" stroke="#5365ad" strokeWidth="2.5" />
    </g>}
  </g>;
}
