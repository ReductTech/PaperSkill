import { useCoverPlayback } from '../components/CoverPlayback';

function aspectOf(progress: number) {
  return 0.62 + 1.35 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2));
}

function iou(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
}

export function CoverAnchors(_props: { chapterId: string; moduleId: string }) {
  const { progress } = useCoverPlayback();
  const aspect = aspectOf(progress);
  const ph = 132;
  const pw = ph * aspect;
  const photo = { x: 320 - pw / 2, y: 168 - ph / 2, w: pw, h: ph };
  const mats = [
    { w: 148, h: 148 },
    { w: 214, h: 108 },
    { w: 96, h: 186 },
  ].map((m) => ({ ...m, x: 320 - m.w / 2, y: 168 - m.h / 2 }));
  return (
    <svg viewBox="0 0 640 320" width="100%" height="100%" role="img" aria-label="固定相框不跟着照片变化" style={{ display: 'block' }}>
      <rect width="640" height="320" rx="16" fill="#f3ead7" />
      {mats.map((m, i) => {
        const hit = iou(photo, m) >= 0.5;
        return <rect key={i} x={m.x} y={m.y} width={m.w} height={m.h} fill="none" stroke={hit ? '#228d5c' : '#c43f52'} strokeWidth="4" />;
      })}
      <rect x={photo.x} y={photo.y} width={photo.w} height={photo.h} fill="#fffdf8" stroke="#f07e47" strokeWidth="4" />
      <ellipse cx={photo.x + photo.w / 2} cy={photo.y + photo.h * 0.42} rx="16" ry="8" fill="#228d5c" />
      <path d={`M ${photo.x + photo.w / 2 - 12} ${photo.y + photo.h * 0.48} Q ${photo.x + photo.w / 2} ${photo.y + photo.h * 0.78} ${photo.x + photo.w / 2 + 12} ${photo.y + photo.h * 0.48}`} fill="#27446e" />
    </svg>
  );
}
