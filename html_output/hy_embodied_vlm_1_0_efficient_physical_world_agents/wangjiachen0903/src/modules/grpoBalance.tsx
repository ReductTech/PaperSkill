import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 290;
const MU = 0.63;
const SIGMA = 0.182;
const EPS = 0.001;
const SAMPLES = [0.35, 0.52, 0.66, 0.74, 0.88];

export const GrpoBalance: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 2 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(2);
  const [feedback, setFeedback] = useState({ text: '五样本仅为教学简化，实际组大小 G=16。当前奖励 0.66 高于组均值 0.63，优势为正。', cls: 'good' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { sel: number }, t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      label(ctx, '本文 GRPO 优势归一化（变体）', W / 2, 20, 13, C.ink);
      const r = SAMPLES[s.sel];
      const adv = (r - MU) / (SIGMA + EPS);
      const angle = clamp(-adv * 0.5, -0.6, 0.6);
      const pivotX = 280;
      const pivotY = 124;
      // stand
      ctx.strokeStyle = C.route;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(pivotX, 186);
      ctx.moveTo(pivotX - 42, 186);
      ctx.lineTo(pivotX + 42, 186);
      ctx.stroke();
      // beam rotated around pivot
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(angle);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-150, 0);
      ctx.lineTo(150, 0);
      ctx.stroke();
      // left pan: group mean
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(-110, 26); ctx.stroke();
      ctx.fillStyle = C.purple;
      ctx.fillRect(-136, 26, 52, 18);
      label(ctx, 'μ', -110, 34, 10, '#ffffff');
      // right pan: current sample
      ctx.strokeStyle = s.sel === 0 ? C.red : C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(110, 0); ctx.lineTo(110, 26); ctx.stroke();
      ctx.fillStyle = s.sel === 0 ? C.red : C.orange;
      ctx.fillRect(84, 26, 52, 18);
      label(ctx, r.toFixed(2), 110, 34, 10, '#ffffff');
      ctx.restore();
      // pivot
      ctx.fillStyle = C.route;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 7, 0, Math.PI * 2);
      ctx.fill();
      // reward axis with clickable samples
      const y = 232;
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(500, y);
      ctx.stroke();
      SAMPLES.forEach((v, i) => {
        const x = 60 + (v / 1.0) * 440;
        const selected = i === s.sel;
        ctx.fillStyle = selected ? C.orange : C.blue;
        ctx.beginPath();
        ctx.arc(x, y, selected ? 10 : 7, 0, Math.PI * 2);
        ctx.fill();
        label(ctx, v.toFixed(2), x, y + (i % 2 === 0 ? 20 : 36), 10, selected ? C.orange : C.muted);
      });
      label(ctx, `Â = (${r.toFixed(2)} − ${MU.toFixed(2)}) / (${SIGMA.toFixed(2)} + ε) = ${adv.toFixed(2)}`, W / 2, 46, 12, adv >= 0 ? C.green : C.red);
      label(ctx, '五样本简化示例 · 实际 G=16', W / 2, 66, 10, C.muted);
      void t;
    };
    const tick = (now: number) => { render(stateRef.current, now / 1000); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const choose = (i: number) => {
    stateRef.current.sel = i;
    setSel(i);
    const r = SAMPLES[i];
    const adv = (r - MU) / (SIGMA + EPS);
    if (adv > 0.25) setFeedback({ text: `奖励 ${r.toFixed(2)} 明显高于组均值：优势 ${adv.toFixed(2)}，优化目标倾向于提高该回答相对旧策略的概率；实际幅度还受概率比与裁剪影响。`, cls: 'good' });
    else if (adv < -0.25) setFeedback({ text: `奖励 ${r.toFixed(2)} 明显低于组均值：优势 ${adv.toFixed(2)}，优化目标倾向于降低该回答相对旧策略的概率。`, cls: 'bad' });
    else setFeedback({ text: `奖励 ${r.toFixed(2)} 接近组均值：优势 ${adv.toFixed(2)}，相对学习信号很弱。`, cls: '' });
  };

  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    SAMPLES.forEach((v, i) => {
      const sx = 60 + (v / 1.0) * 440;
      if (Math.hypot(x - sx, y - 224) < 22) choose(i);
    });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} onPointerDown={hit} />
      <div className="chip-row">
        {SAMPLES.map((v, i) => (
          <button key={i} className={i === sel ? 'chip selected' : 'chip'} onClick={() => choose(i)}>{v.toFixed(2)}</button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default GrpoBalance;
