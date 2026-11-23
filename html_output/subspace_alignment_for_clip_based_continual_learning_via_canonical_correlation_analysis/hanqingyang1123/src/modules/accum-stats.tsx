import React, { useState } from 'react';

const PAIRS = 7;

/** 跨任务累积：样本册逐批记落点，右栏 Σ 增长、投影更新、距离下降。 */
export function AccumStats({ moduleId }: { moduleId: string }) {
  const [t, setT] = useState(1);

  const dist = 0.74 - 0.045 * (t - 1);
  const dim = Math.min(3, 1 + Math.floor((t - 1) / 4)); // 3×3 示意矩阵最多 3 条方向
  const tone = dist > 0.55 ? 'bad' : dist > 0.4 ? 'warn' : 'good';

  const cells = (seed: number) =>
    Array.from({ length: 9 }, (_, k) => {
      const base = k % 4 === 0 ? 1 : 0.35;
      return Math.min(0.98, base * (0.35 + 0.09 * t) + 0.04 * seed);
    });

  const Grid = ({ label, seed, color }: { label: string; seed: number; color: string }) => (
    <div style={{ width: 190 }}>
      <p className="rs-t" style={{ color, fontWeight: 700 }}>{label}</p>
      <svg viewBox="0 0 150 150" width="150" height="150">
        {cells(seed).map((v, k) => {
          const x = (k % 3) * 50;
          const y = Math.floor(k / 3) * 50;
          return (
            <g key={k}>
              <rect x={x + 2} y={y + 2} width="46" height="46" rx="6"
                fill={color} opacity={0.1 + v * 0.75} />
              <text x={x + 25} y={y + 31} textAnchor="middle" fontSize="20" fill="#21324a" opacity={v > 0.45 ? 1 : 0.65}>
                {(v * (t + 1)).toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );

  return (
    <div className="rs">
      <div className="rs-field" style={{ left: 0, top: 0, width: 700, height: 622, background: '#fdfdf8' }}>
        <svg viewBox="0 0 700 622" width="100%" height="100%" role="img" aria-label="样本册逐批累积成对落点">
          <rect x="26" y="30" width="648" height="562" rx="10" fill="#fdfdf8" stroke="#d7deea" strokeWidth="2" />
          <path d="M350 46V576" stroke="#e8edf4" strokeWidth="2" />
          <text x="350" y="24" textAnchor="middle" fontSize="26" fill="#68778f">样本册 · 每批成对落点</text>
          {Array.from({ length: 7 }, (_, row) =>
            Array.from({ length: 2 }, (_, col) => {
              const idx = row + col * PAIRS;
              if (idx >= t * PAIRS) return null;
              const cx = 96 + col * 280 + (row % 3) * 34;
              const cy = 92 + row * 70;
              return (
                <g key={`p${idx}`}>
                  <path d={`M${cx} ${cy}h56`} stroke="#c9d3e2" strokeWidth="2" strokeDasharray="4 4" />
                  <circle cx={cx} cy={cy} r="8" fill="#27446e" />
                  <circle cx={cx + 56} cy={cy} r="8" fill="#228d5c" />
                </g>
              );
            })
          )}
          <text x="350" y="560" textAnchor="middle" fontSize="26" fill="#68778f">只记统计量，不存原图</text>
        </svg>
      </div>

      <div className="rs-panel" style={{ left: 724, top: 0, width: 748, height: 622 }}>
        <p className="rs-t muted">协方差统计量（3×3 示意，真实 D=512）</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Grid label="Σxx" seed={1} color="#27446e" />
          <Grid label="Σyy" seed={2} color="#228d5c" />
          <Grid label="Σxy" seed={3} color="#7c3aed" />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 10 }}>
          {Array.from({ length: 3 }, (_, k) => (
            <div key={k} style={{
              width: 34, height: 20 + k * 8,
              background: k < dim ? '#f07e47' : '#e6ebf2', borderRadius: 6,
            }} />
          ))}
          <span className="rs-t muted" style={{ marginLeft: 10 }}>保留 r={dim} 条（≤3；真实 r̄≈47）</span>
        </div>

        <div className="rs-readout" style={{ marginTop: 12 }}>
          <span>已累积</span><b>{t} 批</b>
          <span style={{ marginLeft: 18 }}>模态距离（示意）</span>
          <b className={tone === 'good' ? 'rs-green' : tone === 'warn' ? 'rs-orange' : 'rs-red'}>{dist.toFixed(2)}</b>
        </div>

        <div className={`rs-feedback ${tone}`} style={{ marginTop: 10 }}>
          {t === 1
            ? '第一批只够初始化统计量，投影还很粗糙。'
            : t < 6
            ? '每多一批，Σ 更完整，投影让两版靠近一些。'
            : '统计量趋稳：距离降下来了，而且没有保存任何样本。'}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button className="rs-btn" disabled={t >= 10} onClick={() => setT((v) => Math.min(10, v + 1))}>记下一批</button>
          <button className="rs-btn" onClick={() => setT(1)}>重置</button>
        </div>
        <p className="rs-t muted" style={{ marginTop: 10 }}>式(9) 递归更新三组统计量（含运行均值），不保留历史图像；距离逐批下降为演示设定。</p>
      </div>
    </div>
  );
}
