import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap4Mod1 — training step slider + CSIA vs late-alignment loss curves (P1).

const W = 560;
const H = 240;
const MAX_STEPS = 20000;

function csiaLoss(t: number) {
  // t in [0, 1]
  return clamp(0.9 * Math.exp(-2.6 * t) + 0.15 + 0.02 * Math.sin(t * 14), 0, 1.5);
}
function lateLoss(t: number) {
  // early decay, then NaN past 0.25
  const base = 0.85 * Math.exp(-2.0 * t) + 0.25;
  if (t > 0.22) {
    const spike = 6 * Math.exp(-((t - 0.25) ** 2) / 0.0008);
    return clamp(base + spike, 0, 3.5);
  }
  return clamp(base, 0, 1.5);
}

export const Chap4Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0.3, anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0.3);
  const [feedback, setFeedback] = useState({ text: '两条曲线都已稳定下降。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const s = stateRef.current;
      s.anim = Math.min(1, s.anim + 0.04);
      const a = easeOutCubic(s.anim);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const ox = 60, oy = H - 40;
      const w = W - 80, h = H - 70;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - h); ctx.lineTo(ox + w, oy);
      ctx.stroke();

      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('loss', ox - 6, oy - h + 4);
      ctx.textAlign = 'left';
      ctx.fillText('pretrain step (×1k)', ox, oy + 16);

      // grid
      ctx.strokeStyle = '#e0e6ef';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 5; i++) {
        const gy = oy - (h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(ox, gy); ctx.lineTo(ox + w, gy);
        ctx.stroke();
      }

      // current step cursor
      const cutoff = s.step;
      const cursorX = ox + cutoff * w * a;
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cursorX, oy - h); ctx.lineTo(cursorX, oy);
      ctx.stroke();
      ctx.setLineDash([]);

      const STEPS = 60;
      // BabelRS curve
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= STEPS; i++) {
        const tt = i / STEPS;
        const v = csiaLoss(tt);
        const px = ox + tt * w;
        const py = oy - (v / 1.5) * h * a;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Late alignment curve
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let nanX: number | null = null;
      for (let i = 0; i <= STEPS; i++) {
        const tt = i / STEPS;
        const v = lateLoss(tt);
        if (v >= 3) { nanX = ox + tt * w; break; }
        const px = ox + tt * w;
        const py = oy - (v / 1.5) * h * a;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      if (nanX !== null) {
        ctx.fillStyle = '#c43f52';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💥 NaN', nanX - 30, oy - h * 0.5);
      }

      // legend
      ctx.fillStyle = '#228d5c';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('— BabelRS CSIA 损失', ox + 8, oy - h + 14);
      ctx.fillStyle = '#c43f52';
      ctx.fillText('— 晚期对齐联合损失', ox + 8, oy - h + 30);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.step = v;
    stateRef.current.anim = 0;
    setStep(v);
    const stepNum = Math.round(v * 20);
    if (v > 0.22) setFeedback({ text: `已到 ${stepNum}k 步，<b>晚期对齐</b>曲线出现 NaN 风险。`, cls: 'bad' });
    else if (v < 0.1) setFeedback({ text: `训练初期：两条曲线都还在下降，<b>CSIA</b> 更稳。`, cls: '' });
    else setFeedback({ text: `预训练 ${stepNum}k 步：<b>CSIA</b> 曲线持续收敛；晚期对齐已开始震荡。`, cls: 'good' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>训练步数 (×1k) <span className="val">{Math.round(step * 20)}k</span></label>
        <input type="range" min={0} max={100} value={Math.round(step * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Chap4Mod1;
