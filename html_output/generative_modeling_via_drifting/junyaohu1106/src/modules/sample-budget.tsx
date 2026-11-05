import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Arrow, Dancer, Feedback, Slider, StageFloor, TapeMark, INK } from './danceKit';
import { cluster, driftAt, makeRng, Pt } from './driftCore';

const W = 730;
const H = 400;
const X: Pt = [330, 225];
// Only draw pool members that fit between the curtains; the estimate still uses the whole pool.
const onStage = (p: Pt) => p[0] > 60 && p[0] < W - 60 && p[1] > 50 && p[1] < H - 8;
const SIZES = [1, 2, 4, 8, 16, 32, 64];
const TABLE_POS = [{ n: '1', fid: 20.43 }, { n: '16', fid: 10.39 }, { n: '32', fid: 8.97 }, { n: '64', fid: 8.46 }];
const TABLE_BOTH = [{ n: '8', fid: 11.82 }, { n: '16', fid: 10.16 }, { n: '32', fid: 9.32 }, { n: '64', fid: 8.46 }];

function LinePanel({ title, rows }: { title: string; rows: { n: string; fid: number }[] }) {
  const w = 330;
  const h = 260;
  const px = (i: number) => 40 + (i / (rows.length - 1)) * (w - 80);
  const py = (v: number) => h - 44 - (v / 24) * (h - 84);
  return <div className="dk-col" style={{ gap: 0 }}>
    <div style={{ fontWeight: 750 }}>{title}</div>
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={`${title}：${rows.map(r => `${r.n} 时 FID ${r.fid}`).join('，')}`}>
      <line x1={10} x2={w - 10} y1={h - 44} y2={h - 44} stroke={INK.axis} strokeWidth={3} />
      <polyline points={rows.map((r, i) => `${px(i)},${py(r.fid)}`).join(' ')} fill="none" stroke={INK.net} strokeWidth={5} />
      {rows.map((r, i) => <g key={r.n}>
        <circle cx={px(i)} cy={py(r.fid)} r={7} fill={INK.net} />
        <text x={px(i)} y={py(r.fid) - 14} textAnchor="middle" fontSize={28} fontWeight={700} fill={INK.text}>{r.fid.toFixed(1)}</text>
        <text x={px(i)} y={h - 10} textAnchor="middle" fontSize={28} fill={INK.muted}>{r.n}</text>
      </g>)}
    </svg>
  </div>;
}

export function SampleBudget(_: WidgetProps) {
  const posPool = useMemo(() => [...cluster(111, 120, 120, 120, 50), ...cluster(112, 120, 590, 300, 60)], []);
  const negPool = useMemo(() => cluster(113, 200, 330, 240, 95), []);
  const [index, setIndex] = useState(0);
  const n = SIZES[index];
  const estimates = useMemo(() => {
    const r = makeRng(114 + n);
    const draw = (pool: Pt[]) => Array.from({ length: n }, () => pool[Math.floor(r() * pool.length)]);
    return Array.from({ length: 24 }, () => driftAt(X, draw(posPool), draw(negPool), 120).V);
  }, [n, posPool, negPool]);
  const mean: Pt = [estimates.reduce((s, v) => s + v[0], 0) / 24, estimates.reduce((s, v) => s + v[1], 0) / 24];
  const spread = Math.sqrt(estimates.reduce((s, v) => s + (v[0] - mean[0]) ** 2 + (v[1] - mean[1]) ** 2, 0) / 24);
  const tone = spread < 25 ? 'good' : spread < 70 ? 'mid' : 'bad';
  return <div className="dk-two" style={{ gridTemplateColumns: '730px minmax(0,1fr)' }}>
    <div className="dk-col">
      <div className="dk-stage" style={{ height: H, flex: 'none' }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`每次用 ${n} 个样本估计 V，24 次估计的散布为 ${spread.toFixed(0)}`}>
          <StageFloor w={W} h={H} />
          {posPool.filter((m, i) => i % 5 === 0 && onStage(m)).map((m, i) => <TapeMark key={i} at={m} size={6} opacity={0.65} />)}
          {negPool.filter((p, i) => i % 6 === 0 && onStage(p)).map((p, i) => <Dancer key={i} at={p} scale={0.7} opacity={0.55} />)}
          {estimates.map((v, i) => <Arrow key={i} from={X} vec={v} color={INK.net} width={3} maxLen={300} />)}
          <Dancer at={[X[0], X[1] + 12]} scale={1.5} color={INK.text} />
        </svg>
      </div>
      <Slider label="每轮看几个样本 N（正负各 N）" value={index} min={0} max={SIZES.length - 1} step={1} onChange={setIndex} display={`${n}`} />
      <div className="dk-row"><span>24 次重新抽样的散布（演示）</span><b className="dk-big">{spread.toFixed(0)}</b></div>
    </div>
    <div className="dk-panel">
      <div className="dk-h">论文 Table 2：FID 随样本数下降</div>
      <div style={{ display: 'flex', gap: 22 }}>
        <LinePanel title="增加 N_pos" rows={TABLE_POS} />
        <LinePanel title="N_pos = N_neg" rows={TABLE_BOTH} />
      </div>
      <p className="dk-muted">固定 100 轮、B=4096；FID 越低越好。</p>
      <Feedback tone={tone}>{tone === 'bad' ? 'N 很小：每次估计的方向差得很远，V 噪声大。' : tone === 'mid' ? '箭头开始收拢，估计逐渐稳定。' : 'N 足够大：多次估计几乎一致，V 更准确。'}</Feedback>
    </div>
  </div>;
}
