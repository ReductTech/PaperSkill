import { useRef, useState } from 'react';

const LARGE = { x: 70, y: 48, w: 560, h: 430, name: '海报' };
const SMALL = { x: 250, y: 170, w: 230, h: 190, name: '杯子' };

function inside(box: { x: number; y: number; w: number; h: number }, pt: { x: number; y: number }) {
  return pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h;
}

export function OverlapChoice(_props: { chapterId: string; moduleId: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState({ x: 360, y: 260 });
  const move = (clientX: number, clientY: number) => {
    const svg = ref.current;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    setPt({
      x: Math.min(880, Math.max(16, ((clientX - bounds.left) / bounds.width) * 900)),
      y: Math.min(600, Math.max(16, ((clientY - bounds.top) / bounds.height) * 622)),
    });
  };
  const hits = [LARGE, SMALL].filter((box) => inside(box, pt));
  const target = hits.slice().sort((a, b) => a.w * a.h - b.w * b.h)[0];
  const tone = target ? (hits.length > 1 ? '#f07e47' : '#228d5c') : '#c43f52';
  const feedback = !target
    ? '这个点不在任何一张照片里，是背景，不回归边框。'
    : hits.length > 1
      ? `同时落在海报和杯子上。面积 ${LARGE.w * LARGE.h} 大于 ${SMALL.w * SMALL.h}，所以回归目标取杯子。海报要靠只属于它的位置来学。`
      : `只落在${target.name}上，回归目标就是这张照片。`;
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '900px 532px', gap: 40 }}>
      <svg ref={ref} viewBox="0 0 900 622" width="900" height="622" tabIndex={0} data-slide-keys="" role="slider"
        aria-label="在重叠的两张照片上移动手指" aria-valuetext={feedback}
        onPointerDown={(e) => { if (!e.isPrimary) return; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (e.buttons === 1) move(e.clientX, e.clientY); }}
        onKeyDown={(e) => {
          const step = 16;
          if (e.key === 'ArrowLeft') { e.preventDefault(); setPt((p) => ({ ...p, x: Math.max(16, p.x - step) })); }
          if (e.key === 'ArrowRight') { e.preventDefault(); setPt((p) => ({ ...p, x: Math.min(880, p.x + step) })); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setPt((p) => ({ ...p, y: Math.max(16, p.y - step) })); }
          if (e.key === 'ArrowDown') { e.preventDefault(); setPt((p) => ({ ...p, y: Math.min(600, p.y + step) })); }
        }}
        style={{ touchAction: 'none', background: '#f3ead7', borderRadius: 18, outline: 'none' }}>
        <rect x={LARGE.x} y={LARGE.y} width={LARGE.w} height={LARGE.h} fill="#d7deea" stroke={target === LARGE ? '#228d5c' : '#27446e'} strokeWidth="6" />
        <text x={LARGE.x + 16} y={LARGE.y + 40} fill="#21324a" fontSize="28">海报</text>
        <rect x={SMALL.x} y={SMALL.y} width={SMALL.w} height={SMALL.h} fill="#fffdf8" stroke={target === SMALL ? '#228d5c' : '#92400e'} strokeWidth="6" />
        <ellipse cx={SMALL.x + SMALL.w / 2} cy={SMALL.y + 70} rx="22" ry="10" fill="#228d5c" />
        <path d={`M ${SMALL.x + SMALL.w / 2 - 14} ${SMALL.y + 78} Q ${SMALL.x + SMALL.w / 2} ${SMALL.y + 120} ${SMALL.x + SMALL.w / 2 + 14} ${SMALL.y + 78}`} fill="#27446e" />
        <text x={SMALL.x + 16} y={SMALL.y + SMALL.h - 16} fill="#21324a" fontSize="28">杯子</text>
        <circle cx={pt.x} cy={pt.y} r="12" fill="#f07e47" stroke="#21324a" strokeWidth="3" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 34, lineHeight: 1.25, fontWeight: 800, color: '#21324a' }}>{target ? `回归${target.name}` : '背景'}</div>
        <div style={{ fontSize: 44, lineHeight: 1.35, fontWeight: 800, color: tone }}>{hits.length > 1 ? '取最小面积' : target ? '唯一目标' : '不回归'}</div>
        <div style={{ fontSize: 28, lineHeight: 1.35, color: tone }}>{feedback}</div>
        <div style={{ fontSize: 28, lineHeight: 1.35, color: '#21324a' }}>表 2：不用金字塔时不同类别的歧义正样本占 17.84%，用了之后降到 3.75%。这里的两张照片只演示取谁，不重算这个比例。</div>
      </div>
    </div>
  );
}
