import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Figure 3 交互折线图（示意重建）：Gibson / MP3D 上下两个子图（约束 B），五条曲线 + SLAM 常数线。
// 数据为按 §5 定性趋势重建的示意锚点（SLAM 恒定 0.59/0.42；Depth 约 10M Gibson / 30M MP3D 追上）。
const G = {
  key: 'Gibson 验证集', slam: 0.59,
  curves: [
    { name: 'Blind', color: '#7c3aed', pts: [[0, 0.02], [1, 0.28], [3, 0.38], [5, 0.42], [15, 0.44], [40, 0.45], [75, 0.45]] },
    { name: 'RGB', color: '#ea580c', pts: [[0, 0.02], [1, 0.18], [5, 0.42], [15, 0.55], [40, 0.62], [75, 0.66]] },
    { name: 'Depth', color: '#16a34a', pts: [[0, 0.02], [1, 0.12], [5, 0.42], [10, 0.60], [30, 0.72], [75, 0.80]] },
    { name: 'RGBD', color: '#dc2626', pts: [[0, 0.02], [1, 0.22], [5, 0.48], [15, 0.60], [40, 0.66], [75, 0.68]] },
  ],
};
const M = {
  key: 'MP3D 验证集', slam: 0.42,
  curves: [
    { name: 'Blind', color: '#7c3aed', pts: [[0, 0.02], [1, 0.16], [3, 0.22], [5, 0.25], [20, 0.26], [75, 0.26]] },
    { name: 'RGB', color: '#ea580c', pts: [[0, 0.02], [1, 0.10], [5, 0.24], [15, 0.32], [40, 0.38], [75, 0.40]] },
    { name: 'Depth', color: '#16a34a', pts: [[0, 0.02], [1, 0.06], [5, 0.22], [15, 0.42], [30, 0.50], [75, 0.55]] },
    { name: 'RGBD', color: '#dc2626', pts: [[0, 0.02], [1, 0.10], [5, 0.28], [15, 0.40], [40, 0.45], [75, 0.46]] },
  ],
};

const XMAX = 75, YMAX = 1.0;
const W = 560, H = 250, padL = 40, padB = 30, padT = 18, padR = 14;

function Subplot({ d }: { d: typeof G }) {
  const [hover, setHover] = useState<{ name: string; step: number; val: number } | null>(null);
  const x = (s: number) => padL + (s / XMAX) * (W - padL - padR);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / YMAX);
  const path = (pts: number[][]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
  return (
    <div className="subplot">
      <h5 className="subplot-title">{d.key}</h5>
      <svg viewBox={`0 0 ${W} ${H}`} className="dvc-svg">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#eef1f5" />
            <text x={padL - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#9aa5b1">{v.toFixed(2)}</text>
          </g>
        ))}
        {[15, 30, 45, 60].map((s) => (
          <text key={s} x={x(s)} y={H - 8} textAnchor="middle" fontSize="10" fill="#9aa5b1">{s}</text>
        ))}
        {/* SLAM 常数线 */}
        <line x1={x(0)} x2={x(XMAX)} y1={y(d.slam)} y2={y(d.slam)} stroke="#6b7280" strokeWidth="2" strokeDasharray="6 4" />
        <text x={W - padR} y={y(d.slam) - 6} textAnchor="end" fontSize="10" fill="#6b7280">SLAM {d.slam}</text>
        {/* curves */}
        {d.curves.map((c) => (
          <path key={c.name} d={path(c.pts)} fill="none" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" />
        ))}
        {/* hover dots */}
        {d.curves.map((c) => (
          <g key={'d' + c.name}>
            {c.pts.map((p, i) => (
              <circle key={i} cx={x(p[0])} cy={y(p[1])} r={hover && hover.name === c.name ? 4 : 2.5} fill={c.color}
                onMouseEnter={() => setHover({ name: c.name, step: p[0], val: p[1] })}
                onMouseLeave={() => setHover(null)}>
                <title>{c.name} @ {p[0]}M：{p[1].toFixed(2)}</title>
              </circle>
            ))}
          </g>
        ))}
        {hover ? (
          <text x={padL} y={padT - 4} fontSize="12" fontWeight="700" fill="#21324a">
            {hover.name} @ {hover.step}M 步：SPL {hover.val.toFixed(2)}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

export const Fig3Curves: React.FC<WidgetProps> = () => {
  return (
    <div className="dvc">
      <Subplot d={G} />
      <Subplot d={M} />
      <div className="dvc-legend">
        <span style={{ color: '#16a34a' }}>■ Depth</span>
        <span style={{ color: '#dc2626' }}>■ RGBD</span>
        <span style={{ color: '#ea580c' }}>■ RGB</span>
        <span style={{ color: '#7c3aed' }}>■ Blind</span>
        <span style={{ color: '#6b7280' }}>┄ SLAM</span>
      </div>
      <div className="feedback good">
        示意重建（原图为矢量）：锚点来自 §5 —— SLAM 恒定 0.59/0.42；Depth 约 10M(Gibson)/30M(MP3D) 追上 SLAM；Blind 早期领先但快速饱和。
      </div>
    </div>
  );
};

export default Fig3Curves;
