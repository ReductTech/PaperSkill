import React, { useState } from 'react';
import { C, useScene, txt, line, rr, dot, smooth, ring, clamp } from './scene';

// 第10章：消融实验（论文 Table 1，CIFAR-100）
// 点任意一条看这组组件的效果；三个组件都在时最高。

const W = 1000;
const H = 300;

const COMBOS = [
  { key: 'dsr', label: '只加 DSR', v: [61.11, 57.08, 51.04], color: C.blue },
  { key: 'mbd', label: '只加 MBD', v: [64.86, 63.25, 54.09], color: C.blue },
  { key: 'psm', label: '只加 PSM', v: [62.7, 62.6, 58.57], color: C.blue },
  { key: 'dm', label: 'DSR + MBD', v: [65.1, 63.87, 60.6], color: C.purple },
  { key: 'all', label: '三个都用', v: [65.88, 64.69, 61.61], color: C.green },
] as const;

const PH = [5, 10, 20] as const;

export default function Ablation() {
  const [sel, setSel] = useState(4);
  const [phase, setPhase] = useState(0);

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    const x0 = 96;
    const x1 = 890;
    const minV = 45;
    const maxV = 68;
    const xOf = (v: number) => x0 + ((v - minV) / (maxV - minV)) * (x1 - x0);

    line(ctx, x0, 262, x1, 262, C.line, 1.2);
    for (let v = 45; v <= 68; v += 3) {
      line(ctx, xOf(v), 262, xOf(v), 268, C.line, 1.2);
      txt(ctx, String(v), xOf(v), 284, 10, C.muted, 'center', 500);
    }

    COMBOS.forEach((c, i) => {
      const y = 48 + i * 42;
      const v = c.v[phase];
      const on = i === sel;
      const w = xOf(v) - x0;
      rr(ctx, x0, y, x1 - x0, 22, 11);
      ctx.fillStyle = '#efe9dd';
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = on ? 1 : 0.45;
      rr(ctx, x0, y, Math.max(4, w), 22, 11);
      ctx.fillStyle = on ? c.color : c.color;
      ctx.fill();
      ctx.restore();
      txt(ctx, v.toFixed(2), x0 + w + 10, y + 16, 13, on ? C.ink : C.muted, 'left', on ? 700 : 500);
      dot(ctx, x0, y + 11, 3, c.color);
      if (on) ring(ctx, x0 + w, y + 11, 13, C.orange, t);
    });
  });

  const cur = COMBOS[sel].v[phase];
  const full = COMBOS[4].v[phase];
  const gap = cur - full;

  const explain: Record<string, string> = {
    dsr: '只有结构扩展、没有主干蒸馏：新类学得进去，但主干的判别信息没人看着，旧类只到 61.11%（5 批）。论文指出这种情况下蒸馏误差随批次指数累积。',
    mbd: '只有主干蒸馏、没有结构扩展：旧类保得不错（64.86%），但新特征和老特征挤在同一个空间里，20 批时掉到 54.09%——挤不进去了。',
    psm: '只有原型选择、没有可扩展结构：能筛出该蒸馏的样本，但网络结构不扩，20 批时 58.57%，比只加 MBD 还高一点——说明选样本本身对长批次有用。',
    dm: '结构和蒸馏都有，但没有 PSM：65.10%，离完整模型只差 0.78。剩下的差距来自"哪些样本该去蒸馏"这个筛选。',
    all: '三个组件一起：65.88% / 64.69% / 61.61%。论文的结论是 DSR 和 MBD 各自带来 4.3 和 4.8 个点的提升，且 DSR 在批次少时更明显，MBD 在批次多时更关键。',
  };

  const fb =
    gap === 0
      ? { cls: 'good', text: explain[COMBOS[sel].key] }
      : {
          cls: '',
          text: `${COMBOS[sel].label}：${cur.toFixed(2)}%，比三个组件全用低 ${Math.abs(gap).toFixed(2)} 个点。${explain[COMBOS[sel].key]}`,
        };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const y = ((e.clientY - r.top) * H) / r.height;
    const i = Math.floor((y - 40) / 42);
    if (i >= 0 && i < COMBOS.length) setSel(i);
  };

  return (
    <div>
      <div className="chip-row" style={{ justifyContent: 'flex-start' }}>
        {PH.map((p, i) => (
          <button
            key={p}
            className={`chip ${phase === i ? 'selected' : ''}`}
            onClick={() => setPhase(i)}
          >
            {p} 批
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '4px 0 2px' }}>
        {COMBOS.map((c, i) => (
          <span
            key={c.key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: i === sel ? '#21324a' : '#68778f',
              fontWeight: i === sel ? 700 : 400,
              cursor: 'pointer',
            }}
            onClick={() => setSel(i)}
          >
            <span style={{ width: 10, height: 10, borderRadius: 5, background: c.color }} />
            {c.label}
          </span>
        ))}
      </div>
      <canvas ref={ref} style={{ cursor: 'pointer' }} onClick={onClick} />
      <div className="metrics">
        <div className="metric">
          <div className="l">当前组合（{PH[phase]} 批）</div>
          <div className="v" style={{ fontSize: 15 }}>{COMBOS[sel].label}</div>
        </div>
        <div className="metric">
          <div className="l">准确率</div>
          <div className="v" style={{ color: gap === 0 ? C.green : C.ink }}>{cur.toFixed(2)}%</div>
        </div>
        <div className="metric">
          <div className="l">与完整模型差距</div>
          <div className="v" style={{ color: gap === 0 ? C.green : C.orange }}>
            {gap === 0 ? '0.00' : `−${Math.abs(gap).toFixed(2)}`}
          </div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}
