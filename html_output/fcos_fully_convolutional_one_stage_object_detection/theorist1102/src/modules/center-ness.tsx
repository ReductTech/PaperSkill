import { useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const BOX = { x0: 180, y0: 70, x1: 680, y1: 520 };

export function CenterNess(_props: { chapterId: string; moduleId: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState({ x: 430, y: 295 });
  const move = (clientX: number, clientY: number) => {
    const svg = ref.current;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const x = ((clientX - bounds.left) / bounds.width) * 860;
    const y = ((clientY - bounds.top) / bounds.height) * 622;
    setPt({
      x: Math.min(BOX.x1, Math.max(BOX.x0, x)),
      y: Math.min(BOX.y1, Math.max(BOX.y0, y)),
    });
  };
  const l = pt.x - BOX.x0;
  const t = pt.y - BOX.y0;
  const r = BOX.x1 - pt.x;
  const b = BOX.y1 - pt.y;
  const lr = Math.min(l, r) / Math.max(l, r, 1e-6);
  const tb = Math.min(t, b) / Math.max(t, b, 1e-6);
  const cn = Math.sqrt(lr * tb);
  const cls = 0.8;
  const finalScore = cls * cn;
  const tone = cn > 0.7 ? '#228d5c' : cn < 0.35 ? '#c43f52' : '#27446e';
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '860px 572px', gap: 40 }}>
      <svg ref={ref} viewBox="0 0 860 622" width="860" height="622" tabIndex={0} data-slide-keys="" role="slider"
        aria-label="在照片里移动，观察中心度" aria-valuetext={`中心度 ${cn.toFixed(2)}，最终分数 ${finalScore.toFixed(2)}`}
        onPointerDown={(e) => { if (!e.isPrimary) return; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (e.buttons === 1) move(e.clientX, e.clientY); }}
        onKeyDown={(e) => {
          const step = 14;
          if (e.key === 'ArrowLeft') { e.preventDefault(); setPt((p) => ({ ...p, x: Math.max(BOX.x0, p.x - step) })); }
          if (e.key === 'ArrowRight') { e.preventDefault(); setPt((p) => ({ ...p, x: Math.min(BOX.x1, p.x + step) })); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setPt((p) => ({ ...p, y: Math.max(BOX.y0, p.y - step) })); }
          if (e.key === 'ArrowDown') { e.preventDefault(); setPt((p) => ({ ...p, y: Math.min(BOX.y1, p.y + step) })); }
        }}
        style={{ touchAction: 'none', background: '#f3ead7', borderRadius: 18, outline: 'none' }}>
        <defs>
          <radialGradient id="cnGlow" cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor="#228d5c" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#f07e47" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#c43f52" stopOpacity="0.38" />
          </radialGradient>
        </defs>
        <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} fill="url(#cnGlow)" stroke="#92400e" strokeWidth="8" />
        <ellipse cx="430" cy="270" rx="34" ry="14" fill="#228d5c" />
        <path d="M 408 282 Q 430 340 452 282" fill="#27446e" />
        <circle cx={pt.x} cy={pt.y} r="12" fill="#f07e47" stroke="#21324a" strokeWidth="3" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
        <div style={{ fontSize: 34, lineHeight: 1.2, fontWeight: 800, color: '#21324a' }}>中心度 {cn.toFixed(2)}</div>
        <div style={{ fontSize: 44, lineHeight: 1.35, fontWeight: 800, color: tone }}>{finalScore.toFixed(2)}</div>
        <div style={{ fontSize: 28, lineHeight: 1.3, color: '#21324a' }}>
          <SymbolHint meaning="测试时用来排序的最终分数">最终分数</SymbolHint>
          {' = '}
          <SymbolHint meaning="示意分类分数，固定为 0.80，不是网络输出"><i>p</i></SymbolHint>
          {' × '}
          <SymbolHint meaning="由四边距离算出的中心度，范围 0 到 1">中心度</SymbolHint>
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.3, color: tone }}>
          {cn > 0.7
            ? '手指靠近照片中心，中心度接近 1，0.80 的分类分几乎留住。'
            : cn < 0.35
              ? '手指靠近边缘，中心度把分数乘小。这种低质量框更可能在 NMS 前被压下去。'
              : '还在中间带。再往边上挪，分数会继续变小。'}
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.3, color: '#21324a' }}>表 4：不用中心度 33.5 AP，用回归向量现算仍是 33.5，单独分支才到 37.1。滑块不改这三行。</div>
        <img src="./images/fig3-centerness.png" alt="论文图3，中心度从中心向四边衰减" style={{ width: 180, height: 150, objectFit: 'contain', background: '#fff', border: '1px solid #d7deea', borderRadius: 8 }} />
      </div>
    </div>
  );
}
