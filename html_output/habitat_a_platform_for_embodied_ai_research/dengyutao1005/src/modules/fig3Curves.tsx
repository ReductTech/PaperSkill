import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Surface3D } from './surface3d';

// Figure 3 交互折线图（示意重建）：Gibson / MP3D 上下两个子图（约束 B），五条曲线 + SLAM 常数线。
// 新增「3D 曲面」视图：训练步数 × 传感器 × SPL（曲面 + 等高线 + 颜色映射），可切换 Gibson/MP3D。
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
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [ds, setDs] = useState<'G' | 'M'>('G');
  const datasets: Record<'G' | 'M', { key: string; curves: typeof G.curves }> = {
    G,
    M,
  };
  const cur = datasets[ds];
  // 训练步数网格（两个数据集的锚点并集），用于 3D 曲面 x 轴
  const STEPS = [0, 1, 3, 5, 10, 15, 20, 30, 40, 75];
  const interp = (pts: number[][], s: number) => {
    if (s <= pts[0][0]) return pts[0][1];
    if (s >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const [s0, v0] = pts[i];
      const [s1, v1] = pts[i + 1];
      if (s >= s0 && s <= s1) return v0 + ((s - s0) / (s1 - s0)) * (v1 - v0);
    }
    return pts[pts.length - 1][1];
  };
  const z3d = cur.curves.map((c) => STEPS.map((s) => Number(interp(c.pts, s).toFixed(3))));
  return (
    <div className="dvc">
      <div className="dvc-tools">
        <button className={`tgl ${view === '2d' ? 'active' : ''}`} onClick={() => setView('2d')}>2D 曲线</button>
        <button className={`tgl ${view === '3d' ? 'active' : ''}`} onClick={() => setView('3d')}>3D 曲面</button>
        {view === '3d' ? (
          <>
            <button className={`tgl ${ds === 'G' ? 'active' : ''}`} onClick={() => setDs('G')}>Gibson 验证集</button>
            <button className={`tgl ${ds === 'M' ? 'active' : ''}`} onClick={() => setDs('M')}>MP3D 验证集</button>
          </>
        ) : null}
      </div>
      {view === '3d' ? (
        <Surface3D
          spec={{
            title: `Figure 3 · 训练曲线示意（${cur.key}，曲面 = SPL，曲线锚点线性插值）`,
            xLabels: STEPS.map((s) => `${s}M`),
            yLabels: cur.curves.map((c) => c.name),
            z: z3d,
            xTitle: '训练步数（百万）',
            yTitle: '传感器',
            zTitle: 'SPL',
            zSuffix: ' SPL',
            height: 400,
            colorscale: 'Viridis',
          }}
        />
      ) : (
        <>
          <Subplot d={G} />
          <Subplot d={M} />
        </>
      )}
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
