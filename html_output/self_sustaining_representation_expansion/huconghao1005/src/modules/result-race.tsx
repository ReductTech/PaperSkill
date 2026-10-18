import React, { useRef, useState } from 'react';
import { C, useScene, txt, line, rr, dot, bar, clamp, smooth, ring } from './scene';

// 第10章：哪个班管理得最好（真实结果对比）
// 数据来自论文 Table 3：平均增量准确率（%），越高越好。

const W = 1000;
const H = 300;

type Row = { name: string; color: string; v: number; ours?: boolean; note?: string };

const SETS: Record<string, Row[]> = {
  'cifar-5': [
    { name: 'PASS', color: '#9aa8b8', v: 63.47 },
    { name: 'SDC', color: '#9aa8b8', v: 56.77 },
    { name: 'UCIR*', color: '#b9a58c', v: 63.78, note: '每类 20 个样本' },
    { name: '本文', color: C.green, v: 65.88, ours: true },
  ],
  'cifar-10': [
    { name: 'PASS', color: '#9aa8b8', v: 61.84 },
    { name: 'SDC', color: '#9aa8b8', v: 57.0 },
    { name: 'UCIR*', color: '#b9a58c', v: 62.39, note: '每类 20 个样本' },
    { name: '本文', color: C.green, v: 65.04, ours: true },
  ],
  'cifar-20': [
    { name: 'PASS', color: '#9aa8b8', v: 58.09 },
    { name: 'SDC', color: '#9aa8b8', v: 58.9 },
    { name: 'UCIR*', color: '#b9a58c', v: 59.07, note: '每类 20 个样本' },
    { name: '本文', color: C.green, v: 61.7, ours: true },
  ],
  'tiny-5': [
    { name: 'PASS', color: '#9aa8b8', v: 49.55 },
    { name: 'UCIR*', color: '#b9a58c', v: 49.15, note: '每类 20 个样本' },
    { name: '本文', color: C.green, v: 50.39, ours: true },
  ],
  'tiny-10': [
    { name: 'PASS', color: '#9aa8b8', v: 47.29 },
    { name: 'UCIR*', color: '#b9a58c', v: 48.52, note: '每类 20 个样本' },
    { name: '本文', color: C.green, v: 48.93, ours: true },
  ],
  'tiny-20': [
    { name: 'PASS', color: '#9aa8b8', v: 42.07 },
    { name: 'UCIR*', color: '#b9a58c', v: 42.83, note: '每类 20 个样本' },
    { name: '本文', color: C.green, v: 48.17, ours: true },
  ],
  'in-10': [
    { name: 'PASS', color: '#9aa8b8', v: 61.8 },
    { name: 'UCIR*', color: '#b9a58c', v: 66.16, note: '每类 20 个样本' },
    { name: '本文', color: C.green, v: 67.69, ours: true },
  ],
};

const DATASETS = [
  { id: 'cifar', label: 'CIFAR-100', phases: [5, 10, 20] },
  { id: 'tiny', label: 'TinyImageNet', phases: [5, 10, 20] },
  { id: 'in', label: 'ImageNet-Subset', phases: [10] },
] as const;

export default function ResultRace() {
  const [ds, setDs] = useState<'cifar' | 'tiny' | 'in'>('cifar');
  const [ph, setPh] = useState(5);
  // 初始就显示最终数值（图表先立住），点按钮只是重播一次评比过程
  const [state, setState] = useState<'run' | 'done'>('done');
  const startRef = useRef(0);
  const timer = useRef<number | null>(null);

  const rows = SETS[`${ds}-${ph}`];
  const ours = rows.find((r) => r.ours)!;
  const bestOther = Math.max(...rows.filter((r) => !r.ours).map((r) => r.v));
  const bestNoEx = Math.max(
    ...rows.filter((r) => !r.ours && r.name !== 'UCIR*').map((r) => r.v)
  );

  const run = () => {
    startRef.current = performance.now();
    setState('run');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('done'), 1900);
  };

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    const p = state === 'run' ? clamp((performance.now() - startRef.current) / 1500, 0, 1) : 1;

    const x0 = 96;
    const x1 = 890;
    const minV = 40;
    const maxV = 70;
    const xOf = (v: number) => x0 + ((v - minV) / (maxV - minV)) * (x1 - x0);

    // 底部刻度
    line(ctx, x0, 262, x1, 262, C.line, 1.2);
    for (let v = 40; v <= 70; v += 5) {
      line(ctx, xOf(v), 262, xOf(v), 268, C.line, 1.2);
      txt(ctx, String(v), xOf(v), 284, 10, C.muted, 'center', 500);
    }

    const n = rows.length;
    rows.forEach((r, i) => {
      const y = 54 + i * ((250 - 54) / n) + 6;
      const stag = clamp((p - i * 0.06) / 0.8, 0, 1);
      const w = (xOf(r.v) - x0) * smooth(stag);
      rr(ctx, x0, y, x1 - x0, 20, 10);
      ctx.fillStyle = '#efe9dd';
      ctx.fill();
      if (w > 2) {
        rr(ctx, x0, y, w, 20, 10);
        ctx.fillStyle = r.color;
        ctx.fill();
      } else {
        // 静止状态给一个起点标记，避免整条看起来是空的
        rr(ctx, x0, y, 22, 20, 8);
        ctx.fillStyle = r.color;
        ctx.globalAlpha = 0.55;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // 数值
      txt(ctx, r.v.toFixed(2), x0 + w + 10, y + 15, 13, r.ours ? C.green : C.ink, 'left', 700);
      // 起点圆点
      dot(ctx, x0, y + 10, 3, r.color);
      if (r.ours && state === 'done') ring(ctx, x0 + w, y + 10, 14, C.green, t);
      if (stag > 0.9 && r.ours && state === 'done') {
        // 小奖杯
        const cx = x0 + w - 26;
        const cy = y + 10;
        ctx.save();
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - 6);
        ctx.lineTo(cx + 7, cy - 6);
        ctx.lineTo(cx + 4, cy + 3);
        ctx.lineTo(cx - 4, cy + 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(cx - 2, cy + 3, 4, 5);
        ctx.fillRect(cx - 6, cy + 8, 12, 3);
        ctx.restore();
      }
    });
  });

  const gap = ours.v - bestNoEx;
  const fb =
    state === 'run'
      ? { cls: '', text: '正在按论文 Table 3 的平均增量准确率上色……' }
      : {
          cls: 'good',
          text: `${
            ds === 'cifar' ? 'CIFAR-100' : ds === 'tiny' ? 'TinyImageNet' : 'ImageNet-Subset'
          } ${ph} 批：本文 ${ours.v.toFixed(2)}%，比最强的非样本方法（${bestNoEx.toFixed(
            2
          )}%）高 ${gap.toFixed(2)} 个点。UCIR* 是每类存 20 个样本的方法，本文一个样本都不存。`,
        };

  return (
    <div>
      <div className="chip-row" style={{ justifyContent: 'flex-start' }}>
        {DATASETS.map((d) => (
          <button
            key={d.id}
            className={`chip ${ds === d.id ? 'selected' : ''}`}
            onClick={() => {
              setDs(d.id);
              setPh((d.phases as readonly number[]).includes(ph) ? ph : d.phases[0]);
              setState('done');
            }}
          >
            {d.label}
          </button>
        ))}
        <span style={{ width: 10 }} />
        {DATASETS.find((d) => d.id === ds)!.phases.map((p) => (
          <button
            key={p}
            className={`chip ${ph === p ? 'selected' : ''}`}
            onClick={() => {
              setPh(p);
              setState('done');
            }}
          >
            {p} 批
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '4px 0 2px' }}>
        {rows.map((r) => (
          <span key={r.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#68778f' }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: r.color }} />
            {r.name}
            {r.note ? `（${r.note}）` : ''}
          </span>
        ))}
      </div>
      <canvas ref={ref} />
      <div className="ctrl">
        <button className="tiny" onClick={run} disabled={state === 'run'}>
          {state === 'done' ? '再比一次' : '开始评比'}
        </button>
        <span style={{ color: C.muted }}>指标：平均增量准确率（含第一阶段），越高越好</span>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">本文</div>
          <div className="v" style={{ color: C.green }}>{ours.v.toFixed(2)}%</div>
        </div>
        <div className="metric">
          <div className="l">最强非样本方法</div>
          <div className="v">{bestNoEx.toFixed(2)}%</div>
        </div>
        <div className="metric">
          <div className="l">提升</div>
          <div className="v" style={{ color: C.green }}>+{gap.toFixed(2)}</div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <div className="feedback" style={{ borderLeftColor: 'var(--line)' }}>
        注：CIFAR-100 20 批时最强对比是 SDC 58.90%；表中 UCIR*、iCaRL* 等带 * 的是带样本的复现结果，和本文的 E=0 设置不同，只看趋势。
      </div>
    </div>
  );
}
