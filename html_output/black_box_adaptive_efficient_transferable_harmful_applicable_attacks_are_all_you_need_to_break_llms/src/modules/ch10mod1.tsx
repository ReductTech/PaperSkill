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


const METHODS = [
  { name: '弱基线', v: 0.45 },
  { name: '强基线', v: 0.72 },
  { name: 'IHO', v: 0.92 },
];
export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [setting, setSetting] = useState<'adapt' | 'hold' | 'xfer'>('adapt');
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ setting: 'adapt' as 'adapt' | 'hold' | 'xfer' });
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const s = stateRef.current; drawScene(ctx);
      const boost = s.setting === 'adapt' ? 0 : s.setting === 'hold' ? -0.05 : -0.08;
      ctx.fillStyle = C.text; ctx.font = '14px sans-serif';
      ctx.fillText({ adapt: '同模型训练行为（自适应）', hold: '留出行为迁移', xfer: '跨模型迁移' }[s.setting], 30, 28);
      METHODS.forEach((m, i) => {
        const val = clamp(m.v + boost + (m.name === 'IHO' ? 0.02 : 0), 0.05, 0.98);
        ctx.fillStyle = m.name === 'IHO' ? C.green : C.blue;
        ctx.fillRect(80, 55 + i * 50, val * 400, 32);
        ctx.fillStyle = C.text; ctx.fillText(`${m.name} 示意 ${val.toFixed(2)}`, 90, 76 + i * 50);
      });
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
        <button type="button" onClick={() => { setSetting('adapt'); stateRef.current.setting = 'adapt'; }}>自适应</button>
        <button type="button" onClick={() => { setSetting('hold'); stateRef.current.setting = 'hold'; }}>留出行为</button>
        <button type="button" onClick={() => { setSetting('xfer'); stateRef.current.setting = 'xfer'; }}>跨模型</button>
      </div>
      <div className="feedback good">条形为教学示意；论文在多层防御（如 CB+检测器）上报告 IHO 相对 SOTA 仍有提升，且无需防御特化适配。</div>
    </div>
  );
};
export default Ch10Mod1;
