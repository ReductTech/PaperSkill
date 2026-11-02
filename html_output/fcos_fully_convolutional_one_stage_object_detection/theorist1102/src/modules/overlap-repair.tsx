import { useRef, useState } from 'react';

const CUP = { x: 150, y: 90, w: 340, h: 320, name: '杯子' };
const BOOK = { x: 280, y: 150, w: 360, h: 300, name: '书' };

function hit(box: { x: number; y: number; w: number; h: number }, pt: { x: number; y: number }, central: boolean) {
  const inset = central ? 0.25 : 0;
  const x = box.x + box.w * inset;
  const y = box.y + box.h * inset;
  const w = box.w * (1 - 2 * inset);
  const h = box.h * (1 - 2 * inset);
  return pt.x >= x && pt.x <= x + w && pt.y >= y && pt.y <= y + h;
}

export function OverlapRepair(_props: { chapterId: string; moduleId: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState({ x: 360, y: 250 });
  const [central, setCentral] = useState(false);
  const move = (clientX: number, clientY: number) => {
    const svg = ref.current;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    setPt({
      x: Math.min(860, Math.max(20, ((clientX - bounds.left) / bounds.width) * 900)),
      y: Math.min(560, Math.max(20, ((clientY - bounds.top) / bounds.height) * 580)),
    });
  };
  const hits = [CUP, BOOK].filter((box) => hit(box, pt, central));
  const fullHits = [CUP, BOOK].filter((box) => hit(box, pt, false));
  const target = hits.slice().sort((a, b) => a.w * a.h - b.w * b.h)[0];
  const tone = !target ? '#c43f52' : hits.length > 1 ? '#f07e47' : '#228d5c';
  const feedback = !target
    ? (central
      ? '这个点不在任一中心区域里，两张照片都不把它当正样本。示意的中心区域是各框向内 25%，论文没有规定唯一半径。'
      : '这个点谁也不包含，是背景。')
    : hits.length > 1
      ? `两张的${central ? '中心区域' : '整张照片'}都盖住了这个点，仍取面积更小的${target.name}。中心采样能减少歧义，但不能保证消掉。`
      : central && fullHits.length > 1
        ? `打开中心采样后，这个点只算在${target.name}上。表 3 里这项后续改动把当时的 37.4 AP 抬到 38.1，这里不重跑那个实验。`
        : `当前只落在${target.name}上，回归目标就是它。要看目标切换，把点放回两张照片的重叠处再打开中心采样。`;
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '900px 532px', gap: 40 }}>
      <svg ref={ref} viewBox="0 0 900 580" width="900" height="580" tabIndex={0} data-slide-keys="" role="slider"
        aria-label="在两张相近照片上移动手指" aria-valuetext={feedback}
        onPointerDown={(e) => { if (!e.isPrimary) return; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (e.buttons === 1) move(e.clientX, e.clientY); }}
        onKeyDown={(e) => {
          const step = 16;
          if (e.key === 'ArrowLeft') { e.preventDefault(); setPt((p) => ({ ...p, x: Math.max(20, p.x - step) })); }
          if (e.key === 'ArrowRight') { e.preventDefault(); setPt((p) => ({ ...p, x: Math.min(860, p.x + step) })); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setPt((p) => ({ ...p, y: Math.max(20, p.y - step) })); }
          if (e.key === 'ArrowDown') { e.preventDefault(); setPt((p) => ({ ...p, y: Math.min(560, p.y + step) })); }
        }}
        style={{ touchAction: 'none', background: '#f3ead7', borderRadius: 18, outline: 'none' }}>
        {[CUP, BOOK].map((box) => (
          <g key={box.name}>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={box.name === '杯子' ? '#fffdf8' : '#d7deea'} stroke={target === box ? '#228d5c' : '#92400e'} strokeWidth="6" />
            {central && <rect x={box.x + box.w * 0.25} y={box.y + box.h * 0.25} width={box.w * 0.5} height={box.h * 0.5} fill="none" stroke="#7c3aed" strokeWidth="4" strokeDasharray="8 6" />}
            <text x={box.x + 12} y={box.y + 36} fill="#21324a" fontSize="28">{box.name}</text>
          </g>
        ))}
        <circle cx={pt.x} cy={pt.y} r="12" fill="#f07e47" stroke="#21324a" strokeWidth="3" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
        <button type="button" onClick={() => setCentral((v) => !v)} aria-pressed={central}
          style={{ fontSize: 28, lineHeight: 1.3, padding: '10px 16px', borderRadius: 12, border: '2px solid #27446e', background: central ? '#27446e' : '#fff', color: central ? '#fff' : '#21324a', cursor: 'pointer' }}>
          {central ? '中心采样：开' : '中心采样：关'}
        </button>
        <div style={{ fontSize: 34, lineHeight: 1.25, fontWeight: 800, color: '#21324a' }}>{target ? `目标是${target.name}` : '没有正样本'}</div>
        <div style={{ fontSize: 28, lineHeight: 1.35, color: tone }}>{feedback}</div>
      </div>
    </div>
  );
}
