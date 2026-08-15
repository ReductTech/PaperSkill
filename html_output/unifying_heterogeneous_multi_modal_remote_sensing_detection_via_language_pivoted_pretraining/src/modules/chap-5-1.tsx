import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap5Mod1 — Annealing coefficient α(t) vs. training step (P1 + chip row).
// Three preset chips for τ + a continuous slider 0..10k; below the canvas
// is a strip showing which ViT layers are fused at the current step.

const W = 560;
const H = 240;
const STEPS = 200;
const MAX_STEP = 20;

function alpha(t: number, tau: number) {
  return Math.min(1, (t * 1000) / Math.max(1, tau));
}
function layers(t: number) {
  // returns [0, 1, 2, 3, 4] sub-set of {1, 3, 9, 18, 24}
  // S = {3, 9, 18, 24}; only L=24 is always on
  const a = alpha(t, 6);
  const set = [true]; // 24
  set.push(a > 0.15);
  set.push(a > 0.4);
  set.push(a > 0.7);
  return set;
}

export const Chap5Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ tau: 6000, anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [tau, setTau] = useState(6000);
  const [feedback, setFeedback] = useState({ text: 'τ = 6k 为推荐配置。', cls: 'good' });

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

      const ox = 60, oy = 50;
      const w = W - 80, h = 130;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + h); ctx.lineTo(ox + w, oy + h);
      ctx.stroke();

      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('α(t)', ox - 6, oy + 4);
      ctx.textAlign = 'left';
      ctx.fillText('t (×1k steps)', ox, oy + h + 16);

      // grid
      ctx.strokeStyle = '#e0e6ef';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 5; i++) {
        const gx = ox + (w * i) / 5;
        ctx.beginPath();
        ctx.moveTo(gx, oy); ctx.lineTo(gx, oy + h);
        ctx.stroke();
      }
      for (let i = 1; i < 5; i++) {
        const gy = oy + (h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(ox, gy); ctx.lineTo(ox + w, gy);
        ctx.stroke();
      }

      // three reference curves
      const drawAlpha = (tau: number, color: string, dash: number[]) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.setLineDash(dash);
        ctx.beginPath();
        for (let i = 0; i <= STEPS; i++) {
          const t = (i / STEPS) * MAX_STEP;
          const v = alpha(t, tau);
          const px = ox + (t / MAX_STEP) * w;
          const py = oy + h - v * h * a;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };
      drawAlpha(4000, '#c43f52', []);
      drawAlpha(s.tau, '#d97706', []);
      drawAlpha(10000, '#27446e', [4, 4]);

      // layer strip below
      const stripY = oy + h + 28;
      ctx.fillStyle = '#21324a';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('当前参与融合的层 S：', ox, stripY);
      const layerNames = ['L=24', '18', '9', '3'];
      const layerCount = layers(0.1).filter(Boolean).length; // for current snapshot
      // dynamic: at step where tau completes
      const tSnap = s.tau / 1000;
      const aSnap = alpha(Math.min(tSnap, MAX_STEP), s.tau);
      layerNames.forEach((name, i) => {
        const lx = ox + i * 50;
        const ly = stripY + 14;
        const active = i === 0 ? true : aSnap > [0.15, 0.4, 0.7][i - 1];
        ctx.fillStyle = active ? '#228d5c' : '#f5f8f0';
        ctx.fillRect(lx, ly, 40, 22);
        ctx.strokeStyle = active ? '#228d5c' : '#d7deea';
        ctx.strokeRect(lx, ly, 40, 22);
        ctx.fillStyle = active ? '#fff' : '#68778f';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, lx + 20, ly + 11);
      });

      // legend
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(ox + 220, stripY, 14, 8);
      ctx.fillStyle = '#21324a';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('τ=4k', ox + 240, stripY + 4);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(ox + 280, stripY, 14, 8);
      ctx.fillText('τ=当前', ox + 300, stripY + 4);
      ctx.fillStyle = '#27446e';
      ctx.fillRect(ox + 350, stripY, 14, 8);
      ctx.fillText('τ=10k', ox + 370, stripY + 4);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const setTauFrom = (v: number) => {
    setTau(v);
    stateRef.current.tau = v;
    stateRef.current.anim = 0;
    if (v <= 4000) setFeedback({ text: '<b>τ 过小</b>：细节层过早并入，训练有发散风险。', cls: 'bad' });
    else if (v >= 10000) setFeedback({ text: '<b>τ 过大</b>：收敛变慢，收益递减。', cls: '' });
    else setFeedback({ text: `<b>τ = ${(v / 1000).toFixed(1)}k</b> 在推荐区间内。`, cls: 'good' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${tau === 4000 ? 'selected' : ''}`} onClick={() => setTauFrom(4000)}>τ = 4k</button>
        <button className={`chip ${tau === 6000 ? 'selected' : ''}`} onClick={() => setTauFrom(6000)}>τ = 6k（推荐）</button>
        <button className={`chip ${tau === 10000 ? 'selected' : ''}`} onClick={() => setTauFrom(10000)}>τ = 10k</button>
      </div>
      <div className="ctrl">
        <label>连续 τ (步) <span className="val">{tau}</span></label>
        <input type="range" min={1000} max={10000} step={500} value={tau} onChange={(e) => setTauFrom(Number(e.target.value))} />
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Chap5Mod1;
