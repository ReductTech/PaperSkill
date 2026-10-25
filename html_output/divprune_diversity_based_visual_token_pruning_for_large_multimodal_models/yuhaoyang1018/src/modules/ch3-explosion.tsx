import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { prepCanvas, useCanvasBox, useTween } from '../lib/hooks';
import { C, FONT_SANS, FONT_MONO } from '../lib/palette';
import { Feedback, Seg, Slider } from '../ui/kit';
import { log10Choose, pyRound } from '../lib/maxmin';

// 3.1 组合爆炸：log10 C(M, M̃) 放到对数刻度尺上。数字为本页计算（公式外推）。

const MS = [
  { v: 576, label: 'LLaVA 1.5 · 576' },
  { v: 1152, label: '视频 8 帧 · 1152' },
  { v: 2096, label: 'LLaVA 1.6 平均 · 2096' },
];

// 参照物（常见估计值，数量级参考）
const UNIVERSE_SEC = 17.64; // 约 138 亿年 ≈ 4.4×10^17 秒
const EVAL_BUDGET = UNIVERSE_SEC + 6; // 每秒评估 10^6 个子集，持续宇宙年龄
const ATOMS = 80;

function sci(lg: number): string {
  if (!Number.isFinite(lg)) return '—';
  const e = Math.floor(lg);
  const m = Math.pow(10, lg - e);
  return `${m.toFixed(1)} × 10^${e}`;
}

export const Ch3Explosion: React.FC<WidgetProps> = () => {
  const [M, setM] = useState(576);
  const [r, setR] = useState(9.8);
  const Mt = Math.max(1, pyRound((r / 100) * M));
  const lg = log10Choose(M, Mt);
  const lgT = useTween(lg, 420);
  const maxScale = Math.max(160, Math.ceil(log10Choose(M, Math.floor(M / 2)) / 50) * 50);

  const { wrapRef, canvasRef, w, h } = useCanvasBox(() => 120);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w) return;
    const ctx = prepCanvas(c, w, h);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const x0 = 10;
    const x1 = w - 14;
    const y = 62;
    const X = (v: number) => x0 + (Math.min(v, maxScale) / maxScale) * (x1 - x0);
    ctx.strokeStyle = C.ink2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.font = `500 11px ${FONT_MONO}`;
    ctx.fillStyle = C.muted;
    const step = maxScale <= 200 ? 20 : maxScale <= 400 ? 50 : 100;
    for (let v = 0; v <= maxScale; v += step) {
      ctx.beginPath();
      ctx.moveTo(X(v), y);
      ctx.lineTo(X(v), y + 6);
      ctx.stroke();
      if (w > 420 || v % (step * 2) === 0) {
        ctx.textAlign = v === 0 ? 'left' : 'center';
        ctx.fillText(`10^${v}`, v === 0 ? x0 - 4 : Math.min(X(v), w - 22), y + 20);
      }
    }
    ctx.textAlign = 'left';
    const marks = [
      { v: EVAL_BUDGET, color: C.cobalt, name: '可试完' },
      { v: ATOMS, color: C.ink2, name: '原子数' },
    ];
    marks.forEach((mk, i) => {
      ctx.strokeStyle = mk.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(X(mk.v), y - 30 + i * 4);
      ctx.lineTo(X(mk.v), y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = mk.color;
      ctx.font = `600 11px ${FONT_SANS}`;
      ctx.textAlign = i === 0 ? 'left' : 'right';
      ctx.fillText(mk.name, X(mk.v) + (i === 0 ? 4 : -4), y - 22 + i * 4);
    });
    ctx.textAlign = 'left';
    // 当前值
    const cx = X(lgT);
    ctx.fillStyle = C.vermSoft;
    ctx.fillRect(x0, y - 8, cx - x0, 8);
    ctx.fillStyle = C.verm;
    ctx.beginPath();
    ctx.moveTo(cx, y - 2);
    ctx.lineTo(cx - 7, y - 14);
    ctx.lineTo(cx + 7, y - 14);
    ctx.closePath();
    ctx.fill();
  }, [w, h, lgT, maxScale, canvasRef]);

  const gap = lg - EVAL_BUDGET;

  return (
    <div className="w">
      <div className="ctl-stack">
        <Seg label="视觉 token 总数 M" options={MS.map((m) => ({ value: m.v, label: m.label }))} value={M} onChange={setM} />
        <Slider label="保留比例 r" value={r} min={1} max={50} step={0.2} onChange={setR} display={`${r.toFixed(1)}% → 保留 M̃ = ${Mt} 个`} />
      </div>
      <div className="big-num" aria-live="polite">
        <span className="big-num-k">候选子集数 C({M}, {Mt}) ≈</span>
        <span className="big-num-v">
          10<sup>{lgT.toFixed(1)}</sup>
        </span>
        <span className="big-num-s">（{sci(lg)}）</span>
      </div>
      <div ref={wrapRef} className="cv">
        <canvas ref={canvasRef} role="img" aria-label={`对数刻度尺：当前约 10 的 ${lg.toFixed(1)} 次方`} />
      </div>
      <Feedback tone="bad">
        从 {M} 个里保留 {Mt} 个，共约 10<sup>{lg.toFixed(1)}</sup> 种选法。即使每秒评估一百万个子集、从宇宙诞生一直算到今天，也只能试约 10<sup>{EVAL_BUDGET.toFixed(1)}</sup> 个，
        {gap > 0 ? <>还差约 {gap.toFixed(0)} 个数量级。</> : <>这次刚好试得完——但这只发生在保留数极小的时候。</>}
        何况评估每个子集都要跑一次完整的模型前向。这就是 DivPrune 改用“多样性”代理目标、并用贪心算法逐个挑选的原因。
      </Feedback>
      <p className="w-note">本页外推：组合数用对数精确计算；“宇宙年龄约 4.4 × 10¹⁷ 秒”“可观测宇宙原子数约 10⁸⁰”为常见数量级估计，仅作参照。</p>
    </div>
  );
};

export default Ch3Explosion;
