import { useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const BOX = { x0: 150, y0: 78, x1: 710, y1: 540 };

export function EdgeMeasure(_props: { chapterId: string; moduleId: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState({ x: 400, y: 280 });
  const move = (clientX: number, clientY: number) => {
    const svg = ref.current;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const x = ((clientX - bounds.left) / bounds.width) * 860;
    const y = ((clientY - bounds.top) / bounds.height) * 622;
    setPt({ x: Math.min(840, Math.max(20, x)), y: Math.min(600, Math.max(20, y)) });
  };
  const inside = pt.x >= BOX.x0 && pt.x <= BOX.x1 && pt.y >= BOX.y0 && pt.y <= BOX.y1;
  const l = Math.round(pt.x - BOX.x0);
  const t = Math.round(pt.y - BOX.y0);
  const r = Math.round(BOX.x1 - pt.x);
  const b = Math.round(BOX.y1 - pt.y);
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '860px 572px', gap: 40 }}>
      <svg ref={ref} viewBox="0 0 860 622" width="860" height="622" tabIndex={0} data-slide-keys="" role="slider"
        aria-label="在照片上移动测量点" aria-valuetext={inside ? `左 ${l} 上 ${t} 右 ${r} 下 ${b}` : '背景位置'}
        onPointerDown={(e) => { if (!e.isPrimary) return; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (e.buttons === 1) move(e.clientX, e.clientY); }}
        onKeyDown={(e) => {
          const step = 14;
          if (e.key === 'ArrowLeft') { e.preventDefault(); setPt((p) => ({ ...p, x: Math.max(20, p.x - step) })); }
          if (e.key === 'ArrowRight') { e.preventDefault(); setPt((p) => ({ ...p, x: Math.min(840, p.x + step) })); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setPt((p) => ({ ...p, y: Math.max(20, p.y - step) })); }
          if (e.key === 'ArrowDown') { e.preventDefault(); setPt((p) => ({ ...p, y: Math.min(600, p.y + step) })); }
        }}
        style={{ touchAction: 'none', background: '#f3ead7', borderRadius: 18, outline: 'none' }}>
        <rect x={BOX.x0 - 10} y={BOX.y0 - 10} width={BOX.x1 - BOX.x0 + 20} height={BOX.y1 - BOX.y0 + 20} fill="none" stroke="#92400e" strokeWidth="8" />
        <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} fill="#fffdf8" />
        <ellipse cx={(BOX.x0 + BOX.x1) / 2} cy={(BOX.y0 + BOX.y1) / 2 - 30} rx="36" ry="16" fill="#228d5c" />
        <path d={`M ${(BOX.x0 + BOX.x1) / 2 - 22} ${(BOX.y0 + BOX.y1) / 2 - 16} Q ${(BOX.x0 + BOX.x1) / 2} ${(BOX.y0 + BOX.y1) / 2 + 50} ${(BOX.x0 + BOX.x1) / 2 + 22} ${(BOX.y0 + BOX.y1) / 2 - 16}`} fill="#27446e" />
        {inside && <>
          <line x1={pt.x} y1={pt.y} x2={BOX.x0} y2={pt.y} stroke="#27446e" strokeWidth="4" />
          <line x1={pt.x} y1={pt.y} x2={BOX.x1} y2={pt.y} stroke="#27446e" strokeWidth="4" />
          <line x1={pt.x} y1={pt.y} x2={pt.x} y2={BOX.y0} stroke="#27446e" strokeWidth="4" />
          <line x1={pt.x} y1={pt.y} x2={pt.x} y2={BOX.y1} stroke="#27446e" strokeWidth="4" />
          <text x={(pt.x + BOX.x0) / 2} y={pt.y - 10} textAnchor="middle" fill="#27446e" fontSize="28">l {l}</text>
          <text x={(pt.x + BOX.x1) / 2} y={pt.y - 10} textAnchor="middle" fill="#27446e" fontSize="28">r {r}</text>
          <text x={pt.x + 12} y={(pt.y + BOX.y0) / 2} fill="#27446e" fontSize="28">t {t}</text>
          <text x={pt.x + 12} y={(pt.y + BOX.y1) / 2} fill="#27446e" fontSize="28">b {b}</text>
        </>}
        <circle cx={pt.x} cy={pt.y} r="12" fill="#f07e47" stroke="#21324a" strokeWidth="3" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
        <div style={{ fontSize: 34, lineHeight: 1.25, fontWeight: 800, color: '#21324a' }}>{inside ? '四边距离' : '背景位置'}</div>
        <div style={{ fontSize: 44, lineHeight: 1.35, color: '#21324a' }}>
          <SymbolHint meaning="到左边的距离"><i>l</i></SymbolHint>
          {' = '}
          <SymbolHint meaning="当前位置的横坐标"><i>x</i></SymbolHint>
          {' − '}
          <SymbolHint meaning="边框左边缘"><i>x</i><sub>0</sub></SymbolHint>
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.35, color: inside ? '#228d5c' : '#c43f52' }}>
          {inside
            ? `示意像素：l=${l}，t=${t}，r=${r}，b=${b}。还原时左边缘是 x−l，右边缘是 x+r，相框回到原来的照片。`
            : '手指离开了照片。论文把框外的位置当成背景，分类目标为 0，不再回归四边。'}
        </div>
        <img src="./images/fig1-ltrb.png" alt="论文图1，左图是四边距离，右图是一个点落在两个框里" style={{ width: '100%', height: 168, objectFit: 'contain', background: '#fff', border: '1px solid #d7deea', borderRadius: 8 }} />
        <div style={{ fontSize: 28, lineHeight: 1.3, color: '#68778f' }}>论文图 1。右图的重叠放到下一页。</div>
      </div>
    </div>
  );
}
