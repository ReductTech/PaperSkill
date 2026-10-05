import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Figure 5 泛化矩阵热力图（P11）：行=(agent,train)，列=test set。悬停显示精确 SPL。
const ROWS = [
  { label: 'Blind / Gibson', v: [0.42, 0.34] },
  { label: 'Blind / MP3D', v: [0.28, 0.25] },
  { label: 'RGB / Gibson', v: [0.46, 0.40] },
  { label: 'RGB / MP3D', v: [0.25, 0.30] },
  { label: 'Depth / Gibson', v: [0.79, 0.68] },
  { label: 'Depth / MP3D', v: [0.56, 0.54] },
  { label: 'RGBD / Gibson', v: [0.70, 0.53] },
  { label: 'RGBD / MP3D', v: [0.44, 0.42] },
];
const COLS = ['test Gibson', 'test MP3D'];
const W = 560, H = 320, padL = 170, padR = 16, padT = 30, padB = 26;
const rowH = (H - padT - padB) / ROWS.length;
const colW = (W - padL - padR) / COLS.length;
const color = (v: number) => {
  // blue scale from light (0) to deep (1)
  const t = Math.round(v * 255);
  return `rgb(${Math.round(219 - t * 0.45)},${Math.round(234 - t * 0.5)},${Math.round(254 - t * 0.45)})`;
};

export const Fig5Heatmap: React.FC<WidgetProps> = () => {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  return (
    <div className="dvc">
      <svg viewBox={`0 0 ${W} ${H}`} className="dvc-svg" role="img" aria-label="Figure 5 泛化矩阵热力图">
        {COLS.map((c, ci) => (
          <text key={c} x={padL + ci * colW + colW / 2} y={padT - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#21324a">{c}</text>
        ))}
        {ROWS.map((r, ri) => (
          <g key={r.label}>
            <text x={padL - 8} y={padT + ri * rowH + rowH / 2 + 4} textAnchor="end" fontSize="11" fill="#374151">{r.label}</text>
            {r.v.map((val, ci) => {
              const x = padL + ci * colW;
              const y = padT + ri * rowH;
              const isH = hover && hover.r === ri && hover.c === ci;
              return (
                <rect key={ci} x={x} y={y} width={colW - 4} height={rowH - 4} rx={3}
                  fill={color(val)} stroke={isH ? '#2563eb' : 'none'} strokeWidth={isH ? 2 : 0}
                  onMouseEnter={() => setHover({ r: ri, c: ci })}
                  onMouseLeave={() => setHover(null)}>
                  <title>{r.label} → {COLS[ci]}：{val.toFixed(2)}</title>
                </rect>
              );
            })}
            <text x={padL + (r.v[0] < 0.45 ? 8 : colW - 12)} y={padT + ri * rowH + rowH / 2 + 4}
              textAnchor={r.v[0] < 0.45 ? 'start' : 'end'} fontSize="12" fontWeight="600" fill="#21324a">
              {r.v[0].toFixed(2)}
            </text>
            <text x={padL + colW + (r.v[1] < 0.5 ? 8 : colW - 12)} y={padT + ri * rowH + rowH / 2 + 4}
              textAnchor={r.v[1] < 0.5 ? 'start' : 'end'} fontSize="12" fontWeight="600" fill="#21324a">
              {r.v[1].toFixed(2)}
            </text>
          </g>
        ))}
        {hover ? (
          <text x={padL} y={H - 8} fontSize="12" fontWeight="700" fill="#2563eb">
            {ROWS[hover.r].label} → {COLS[hover.c]}：SPL {ROWS[hover.r].v[hover.c].toFixed(2)}
          </text>
        ) : null}
      </svg>
      <div className="feedback good">
        数据来源：Figure 5, §5。仅 Depth 跨数据集泛化良好；对角线为同数据集 train→test（与 Table 2 一致）。
      </div>
    </div>
  );
};

export default Fig5Heatmap;
