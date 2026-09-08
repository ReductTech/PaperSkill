import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const C = {
  bg: '#f5f8f0', envL: '#b8c9a7', envD: '#76906a', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', text: '#21324a', muted: '#68778f', border: '#d7deea',
};

function drawScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.envL;
  ctx.fillRect(0, H - 36, W, 36);
}

function drawSafe(ctx: CanvasRenderingContext2D, x: number, y: number, open: number) {
  ctx.fillStyle = C.envD;
  ctx.fillRect(x, y, 90, 110);
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 90, 110);
  const door = 70 * (1 - open);
  ctx.fillStyle = C.blue;
  ctx.fillRect(x + 10, y + 15, door, 80);
  ctx.beginPath();
  ctx.arc(x + 55, y + 55, 10, 0, Math.PI * 2);
  ctx.fillStyle = C.orange;
  ctx.fill();
}

function drawPick(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(48, -6);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.fillRect(-8, -6, 14, 12);
  ctx.restore();
}

function drawDial(ctx: CanvasRenderingContext2D, x: number, y: number, v: number, label: string) {
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = v > 0.7 ? C.red : v > 0.4 ? C.orange : C.green;
  ctx.beginPath();
  ctx.arc(x, y, 28, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText(label, x - 22, y + 48);
  ctx.fillText(v.toFixed(2), x - 14, y + 5);
}


export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tau, setTau] = useState(0.5);
  const [n, setN] = useState(64);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ tau: 0.5, n: 64 });
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const s = stateRef.current; drawScene(ctx);
      // toy surface
      ctx.fillStyle = C.text; ctx.font = '14px sans-serif'; ctx.fillText('示意：ASR 只看单点，EVUS 积分阈值×样本量', 30, 28);
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 5; j++) {
          const val = clamp(0.2 + i * 0.08 + j * 0.05, 0, 1);
          ctx.fillStyle = val > s.tau ? C.green : C.red;
          ctx.globalAlpha = 0.35 + 0.65 * val;
          ctx.fillRect(40 + i * 50, 50 + j * 28, 44, 24);
        }
      }
      ctx.globalAlpha = 1;
      const asr = clamp(0.3 + (1 - s.tau) * 0.5 + Math.log10(s.n) * 0.08, 0, 0.99);
      const evus = clamp(asr * 0.85 + 0.1, 0, 0.99);
      ctx.fillStyle = C.blue; ctx.fillText(`示意 ASR(n,τ)≈${asr.toFixed(2)}`, 40, 220);
      ctx.fillStyle = C.orange; ctx.fillText(`示意 EVUS≈${evus.toFixed(2)}`, 280, 220);
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>阈值 τ <span className="val">{tau.toFixed(2)}</span></label>
        <input type="range" min={10} max={90} value={Math.round(tau * 100)} onChange={(e) => { const v = Number(e.target.value)/100; setTau(v); stateRef.current.tau = v; }} />
        <label>样本 n <span className="val">{n}</span></label>
        <input type="range" min={8} max={256} value={n} onChange={(e) => { const v = Number(e.target.value); setN(v); stateRef.current.n = v; }} />
      </div>
      <div className="feedback">画布为教学示意，不代表论文某一格具体数值；正式结果以 StrongReject 下报告的 EVUS/ASR 为准。</div>
    </div>
  );
};
export default Ch9Mod1;
