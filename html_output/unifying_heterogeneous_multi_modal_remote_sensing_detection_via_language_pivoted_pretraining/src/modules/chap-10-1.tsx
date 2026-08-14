import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap10Mod1 — SOI-Det result race (P8). One shared start button, three pairs
// of bars (BabelRS vs SM3Det) on a shared baseline.

const W = 560;
const H = 260;

const RACES: Array<{ name: string; babel: number; sm3: number; max: number }> = [
  { name: 'SARDet-100K', babel: 63.30, sm3: 60.64, max: 70 },
  { name: 'DOTA',        babel: 46.96, sm3: 46.47, max: 70 },
  { name: 'DroneVehicle',babel: 51.32, sm3: 48.87, max: 70 },
];

const RUN_DURATION = 1.6;

export const Chap10Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ run: 'idle' as 'idle' | 'running' | 'done', start: 0 });
  const rafRef = useRef<number | null>(null);
  const [run, setRun] = useState<'idle' | 'running' | 'done'>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const s = stateRef.current;
      let t = 0;
      if (s.run === 'running') {
        t = clamp((time - s.start) / 1000 / RUN_DURATION, 0, 1);
        if (t >= 1) { s.run = 'done'; setRun('done'); }
      } else if (s.run === 'done') {
        t = 1;
      }
      const ease = easeOutCubic(t);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const ox = 80, oy = 40, w = W - 100, h = H - 90;

      // axis
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy + h);
      ctx.lineTo(ox + w, oy + h);
      ctx.stroke();

      // grid
      ctx.strokeStyle = '#e0e6ef';
      ctx.lineWidth = 0.5;
      for (let v = 0; v <= 70; v += 10) {
        const gx = ox + (v / 70) * w;
        ctx.beginPath();
        ctx.moveTo(gx, oy); ctx.lineTo(gx, oy + h);
        ctx.stroke();
        ctx.fillStyle = '#68778f';
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(v), gx, oy + h + 12);
      }

      // bars
      const groupH = h / RACES.length;
      const barH = (groupH - 12) / 2;
      RACES.forEach((r, i) => {
        const y0 = oy + i * groupH + 4;
        // BabelRS
        const bx = ox + (r.babel / 70) * w * ease;
        ctx.fillStyle = '#228d5c';
        ctx.fillRect(ox, y0, bx - ox, barH);
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`BabelRS ${r.babel.toFixed(2)}`, ox + 6, y0 + barH / 2);

        // SM3Det
        const sx = ox + (r.sm3 / 70) * w * ease;
        ctx.fillStyle = '#c43f52';
        ctx.fillRect(ox, y0 + barH + 4, sx - ox, barH);
        ctx.fillStyle = '#21324a';
        ctx.fillText(`SM3Det ${r.sm3.toFixed(2)}`, ox + 6, y0 + barH + 4 + barH / 2);

        // group label
        ctx.fillStyle = '#27446e';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(r.name, ox - 8, y0 + groupH / 2 - 2);
      });

      // y-axis label
      ctx.fillStyle = '#68778f';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('mAP', ox + 4, oy - 8);

      // legend
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(W - 130, 12, 12, 8);
      ctx.fillStyle = '#21324a';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('BabelRS (本文)', W - 114, 20);
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(W - 130, 26, 12, 8);
      ctx.fillText('SM3Det (晚期对齐基线)', W - 114, 34);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onStart = () => {
    stateRef.current.run = 'running';
    stateRef.current.start = performance.now();
    setRun('running');
  };
  const onReset = () => {
    stateRef.current.run = 'idle';
    setRun('idle');
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={onStart} disabled={run === 'running'}>▶ 开始比较</button>
        <button className="tiny ghost" onClick={onReset}>重置</button>
      </div>
      <div className={`feedback ${run === 'done' ? 'good' : ''}`}>
        {run === 'done'
          ? '三个模态同时 SOTA：SAR +2.66 / DOTA +0.49 / IR +2.45 mAP（论文 Table 2）。'
          : run === 'running' ? '正在比较中……' : '点击"开始比较"，按论文 Table 2 的 mAP 同步增长。'}
      </div>
    </div>
  );
};

export default Chap10Mod1;
