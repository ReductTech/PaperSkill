import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { approach, useCanvasBox, useStageLoop, useTween } from '../lib/hooks';
import { C } from '../lib/palette';
import { Btn, Feedback, Seg } from '../ui/kit';
import { GRID, cachedDist, featDist, greedyMaxMin, greedyMinMax, makeScene, minPair, randomSubset, type DistFn } from '../lib/maxmin';
import { TABLE4 } from '../data/tutorial';

// 8.1 策略实验室：示意图块图上比较 余弦/ℓ1/ℓ2 Max-Min、随机、Min-Max；右侧为 Table 4 实测分数。

type Strat = 'cos' | 'l1' | 'l2' | 'random' | 'minmax';
const K = 56;
const REGION = ['天空', '太阳', '屋顶', '墙面', '树冠', '门', '树干', '草地'];
const METRICS: { key: 'mmb' | 'mmmu' | 'pope' | 'sqa' | 'avg'; label: string }[] = [
  { key: 'mmb', label: 'MMB' },
  { key: 'mmmu', label: 'MMMU' },
  { key: 'pope', label: 'POPE' },
  { key: 'sqa', label: 'SQA' },
  { key: 'avg', label: '平均' },
];

function Bar({ v, base, max }: { v: number; base: number; max: number }) {
  const t = useTween(v, 380);
  return (
    <div className="hbar">
      <div className="hbar-track">
        <div className="hbar-fill" style={{ transform: `scaleX(${t / max})` }} />
        <div className="hbar-ref" style={{ left: `${(base / max) * 100}%` }} aria-hidden="true" />
      </div>
      <span className="hbar-v">{t.toFixed(2)}</span>
    </div>
  );
}

export const Ch8Strategies: React.FC<WidgetProps> = () => {
  const [strat, setStrat] = useState<Strat>('cos');
  const [rseed, setRseed] = useState(3);
  const patches = useMemo(() => makeScene(7), []);
  const n = patches.length;
  const dists = useMemo(() => {
    const out = {} as Record<'cos' | 'l1' | 'l2', DistFn>;
    (['cos', 'l1', 'l2'] as const).forEach((m) => (out[m] = cachedDist(n, featDist(patches, m))));
    return out;
  }, [patches, n]);
  const sel = useMemo(() => {
    if (strat === 'random') return randomSubset(n, K, rseed);
    if (strat === 'minmax') return greedyMinMax(n, K, dists.cos);
    return greedyMaxMin(n, K, dists[strat]);
  }, [strat, rseed, n, dists]);
  const regions = useMemo(() => {
    const cnt = new Array(REGION.length).fill(0);
    sel.forEach((i) => cnt[patches[i].region]++);
    return cnt;
  }, [sel, patches]);
  const covered = regions.filter((c) => c > 0).length;
  const missing = REGION.filter((_, i) => regions[i] === 0).join('、') || '无';
  const top2 = REGION.map((r, i) => [r, regions[i]] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const mm = minPair(sel, dists.cos).v;
  const row = TABLE4.find((r) => r.id === strat)!;
  const cos = TABLE4[0];

  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => Math.min(W, 360));

  // 动画：切换策略时，一道斜向光波扫过图块，波过之处才切换到新的选中状态；选中的图块带呼吸光晕。
  const animRef = useRef<{ wt: Float32Array; since: number; key: string; prev: Set<number>; cur: Set<number> }>({
    wt: new Float32Array(patches.length),
    since: 0,
    key: '',
    prev: new Set(),
    cur: new Set(),
  });

  useStageLoop(canvasRef, w, h, (ctx, t, dt) => {
    const a = animRef.current;
    const key = sel.join(',');
    if (a.key !== key) {
      a.prev = a.key ? a.cur : new Set(sel);
      a.cur = new Set(sel);
      a.key = key;
      a.since = 0;
    }
    a.since += dt;
    const final = t > 900;
    const WAVE = 0.55;
    ctx.clearRect(0, 0, w, h);
    const g = Math.min(w, h);
    const cell = g / GRID;
    const gx = (w - g) / 2;
    const front = final ? 99 : a.since / WAVE; // 0 → 1 扫过整张图
    patches.forEach((p, i) => {
      const cx = i % GRID;
      const cy = Math.floor(i / GRID);
      const pos = (cx + cy) / (2 * GRID - 2);
      const target = (front >= pos ? a.cur : a.prev).has(i) ? 1 : 0;
      a.wt[i] = final ? target : approach(a.wt[i], target, dt, 14);
      const x = gx + cx * cell;
      const y = cy * cell;
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.globalAlpha = 0.16 + 0.84 * a.wt[i];
      ctx.fillRect(x, y, cell - 0.6, cell - 0.6);
      // 扫描光波
      const dist = Math.abs(front - pos);
      if (!final && front < 1.25 && dist < 0.08) {
        ctx.globalAlpha = (1 - dist / 0.08) * 0.3;
        ctx.fillStyle = C.verm;
        ctx.fillRect(x, y, cell - 0.6, cell - 0.6);
      }
      ctx.globalAlpha = 1;
    });
    const pulse = final ? 1 : 0.75 + 0.25 * Math.sin(t * 2.6);
    ctx.save();
    ctx.shadowColor = C.verm;
    ctx.shadowBlur = 8 * pulse;
    ctx.strokeStyle = C.vermD;
    ctx.lineWidth = 1.6;
    patches.forEach((_, i) => {
      if (a.wt[i] < 0.5) return;
      const x = gx + (i % GRID) * cell;
      const y = Math.floor(i / GRID) * cell;
      ctx.globalAlpha = Math.min(1, (a.wt[i] - 0.5) * 2);
      ctx.strokeRect(x + 0.8, y + 0.8, cell - 2.2, cell - 2.2);
    });
    ctx.restore();
  }, [sel, patches]);

  const delta = cos.avg - row.avg;
  const rel = (delta / cos.avg) * 100;
  const fb: Record<Strat, string> = {
    cos: `余弦 Max-Min（默认）：56 个图块覆盖了 8 类区域中的 ${covered} 类，最近一对的余弦距离为 ${mm.toFixed(4)}。Table 4 平均 62.34。`,
    l1: `ℓ1 Max-Min：覆盖 ${covered} 类区域，选法与余弦相近。Table 4 平均 61.94，比余弦低 ${delta.toFixed(2)} 分——单次运行，差距在常见波动范围内。`,
    l2: `ℓ2 Max-Min：覆盖 ${covered} 类区域。Table 4 平均 62.22，比余弦低 ${delta.toFixed(2)} 分，同样不足以说明谁更好。`,
    random: `随机：覆盖 ${covered} 类区域；名额大致按面积分配（${top2[0][0]} ${top2[0][1]} 个、${top2[1][0]} ${top2[1][1]} 个），未覆盖：${missing}。Table 4 平均 56.66，低 ${delta.toFixed(2)} 个百分点（相对 −${rel.toFixed(1)}%）。`,
    minmax: `Min-Max：故意挑一团最相似的图块，只覆盖 ${covered} 类区域（未覆盖：${missing}）。Table 4 平均 46.53，低 ${delta.toFixed(2)} 个百分点（相对 −${rel.toFixed(1)}%）。论文正文把它写成“低约 15.8%”，那是百分点。`,
  };

  return (
    <div className="w">
      <div className="ctl-stack">
        <Seg
          label="选择策略"
          options={[
            { value: 'cos', label: '余弦 Max-Min' },
            { value: 'l1', label: 'ℓ1 Max-Min' },
            { value: 'l2', label: 'ℓ2 Max-Min' },
            { value: 'random', label: '随机' },
            { value: 'minmax', label: 'Min-Max' },
          ]}
          value={strat}
          onChange={setStrat}
        />
      </div>
      <div className="split">
        <div>
          <div ref={wrapRef} className="cv">
            <canvas ref={canvasRef} role="img" aria-label={`示意图块图：${strat} 策略选出的 56 个图块覆盖 ${covered} 类区域`} />
          </div>
          <div className="region-row" aria-label="各区域被选中的图块数">
            {REGION.map((r, i) => (
              <span key={r} className={regions[i] ? 'is-on' : ''}>
                {r} {regions[i]}
              </span>
            ))}
          </div>
          {strat === 'random' ? (
            <div className="ctl-row">
              <Btn onClick={() => setRseed((s) => s + 1)}>换一组随机</Btn>
            </div>
          ) : null}
        </div>
        <div className="t4">
          <div className="t4-head">Table 4 · {row.label}（论文实测；细竖线 = 余弦基准）</div>
          {METRICS.map((m) => (
            <div className="t4-row" key={m.key}>
              <span className="t4-k">{m.label}</span>
              <Bar v={row[m.key]} base={cos[m.key]} max={100} />
            </div>
          ))}
          <p className="w-note">同一保留数（56）、同一 TFLOP 比例（19.61%），LLaVA 1.5-7B。</p>
        </div>
      </div>
      <Feedback tone={strat === 'cos' ? 'good' : strat === 'minmax' ? 'bad' : strat === 'random' ? 'warn' : 'info'}>{fb[strat]}</Feedback>
      <p className="w-note">左侧为教学示意（程序生成的场景、4 维颜色特征、Min-Max 用贪心近似）；右侧分数直接取自 Table 4。</p>
    </div>
  );
};

export default Ch8Strategies;
