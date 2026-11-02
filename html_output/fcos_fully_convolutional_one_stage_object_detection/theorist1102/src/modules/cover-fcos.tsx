import { useCoverPlayback } from '../components/CoverPlayback';

function aspectOf(progress: number) {
  return 0.62 + 1.35 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2));
}

export function CoverFcos(_props: { chapterId: string; moduleId: string }) {
  const { progress } = useCoverPlayback();
  const aspect = aspectOf(progress);
  const ph = 132;
  const pw = ph * aspect;
  const x = 320 - pw / 2;
  const y = 168 - ph / 2;
  const cx = 320;
  const cy = 168;
  return (
    <svg viewBox="0 0 640 320" width="100%" height="100%" role="img" aria-label="量到四边后相框跟着照片合上" style={{ display: 'block' }}>
      <rect width="640" height="320" rx="16" fill="#f5f8f0" />
      <rect x={x - 8} y={y - 8} width={pw + 16} height={ph + 16} fill="none" stroke="#92400e" strokeWidth="8" />
      <rect x={x} y={y} width={pw} height={ph} fill="#fffdf8" stroke="#228d5c" strokeWidth="3" />
      <ellipse cx={cx} cy={cy - 16} rx="16" ry="8" fill="#228d5c" />
      <path d={`M ${cx - 12} ${cy - 8} Q ${cx} ${cy + 28} ${cx + 12} ${cy - 8}`} fill="#27446e" />
      <line x1={cx} y1={cy} x2={x} y2={cy} stroke="#27446e" strokeWidth="3" />
      <line x1={cx} y1={cy} x2={x + pw} y2={cy} stroke="#27446e" strokeWidth="3" />
      <line x1={cx} y1={cy} x2={cx} y2={y} stroke="#27446e" strokeWidth="3" />
      <line x1={cx} y1={cy} x2={cx} y2={y + ph} stroke="#27446e" strokeWidth="3" />
      <circle cx={cx} cy={cy} r="7" fill="#f07e47" />
    </svg>
  );
}
