import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap1Mod1 — Modality conflict strength slider (P1, hybrid).
// Drag the slider 0..1; loss curve + ink-blot color update.

const W = 560;
const H = 220;

const STEPS = 60;

function smoothBaseline(t: number) {
  return 0.5 + 0.35 * Math.exp(-t * 6);
}
function lateAlignLoss(t: number, conflict: number) {
  // late alignment loss = baseline + oscillating terms scaled by conflict
  const base = smoothBaseline(t);
  const osc = 0.18 * Math.sin(t * 8) * conflict + 0.12 * Math.cos(t * 13) * conflict;
  const spike = conflict > 0.7 ? Math.max(0, (conflict - 0.7) * 4 * Math.exp(-((t - 0.55) ** 2) / 0.005) * 6) : 0;
  return clamp(base + osc + spike, 0, 2.5);
}
function earlyLoss(t: number) {
  return clamp(0.3 + 0.25 * Math.exp(-t * 8), 0, 1.5);
}

export const Chap1Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ conflict: 0.4, anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [conflict, setConflict] = useState(0.4);
  const [feedback, setFeedback] = useState({ text: '中等冲突，曲线尚可训练。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const s = stateRef.current;
      s.anim += 0.02;
      const a = easeOutCubic(Math.min(1, s.anim));
      ctx.clearRect(0, 0, W, H);
      // field
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // axes
      const ox = 50, oy = H - 40;
      const w = W - 80, h = H - 70;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy - h);
      ctx.lineTo(ox + w, oy);
      ctx.stroke();

      // axis labels
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('loss', ox - 6, oy - h + 4);
      ctx.textAlign = 'left';
      ctx.fillText('fine-tune step →', ox, oy + 16);

      // gridlines
      ctx.strokeStyle = '#e0e6ef';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 5; i++) {
        const gy = oy - (h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(ox, gy); ctx.lineTo(ox + w, gy);
        ctx.stroke();
      }

      // late-alignment curve
      ctx.strokeStyle = s.conflict > 0.7 ? '#c43f52' : s.conflict > 0.3 ? '#27446e' : '#228d5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let nan = false;
      for (let i = 0; i <= STEPS; i++) {
        const tt = i / STEPS;
        const px = ox + tt * w;
        const v = lateAlignLoss(tt, s.conflict);
        const py = oy - (v / 2.5) * h * a;
        if (Number.isNaN(v) || v >= 2.5) {
          nan = true;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
          break;
        }
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // NaN marker
      if (nan) {
        ctx.fillStyle = '#c43f52';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💥 NaN', ox + 0.55 * w, oy - h * 0.4);
      }

      // BabelRS baseline (for reference)
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i <= STEPS; i++) {
        const tt = i / STEPS;
        const px = ox + tt * w;
        const v = earlyLoss(tt);
        const py = oy - (v / 2.5) * h * a;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // legend
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('— 晚期对齐（当前）', ox + 8, oy - h + 16);
      ctx.fillStyle = '#228d5c';
      ctx.fillText('-- BabelRS（参考）', ox + 8, oy - h + 32);

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
    stateRef.current.conflict = v;
    stateRef.current.anim = 0;
    setConflict(v);
    if (v > 0.7) setFeedback({ text: '<b>冲突过强</b>，晚期对齐曲线出现 NaN 风险。', cls: 'bad' });
    else if (v < 0.3) setFeedback({ text: '<b>冲突较小</b>，曲线能平稳收敛。', cls: 'good' });
    else setFeedback({ text: '中度冲突，曲线尚可训练但已不平稳。', cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>模态冲突强度 <span className="val">{conflict.toFixed(2)}</span></label>
        <input type="range" min={0} max={100} value={Math.round(conflict * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Chap1Mod1;
