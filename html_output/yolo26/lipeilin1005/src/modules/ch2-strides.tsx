import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch2 Module 2.1 (P4): stride 8/16/32 — denser grid watches small objects,
// coarser grid saves effort on large ones. Linked views: slope riding + grid.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

const FB: Record<number, { text: string; cls: string }> = {
  8: { text: '细网格盯小物体：6 px 目标可能被锚点中心覆盖，也可能落空——位置不巧时就是零正样本，这正是第 9 章要修的问题。', cls: '' },
  16: { text: '中档兼顾：最常见的物体尺度落在这里。', cls: '' },
  32: { text: '粗网格省力看大图：大物体交给它，但 6 px 目标在这里没有任何锚点中心。', cls: 'bad' },
};

const BAND: Record<number, string> = { 8: '4–32 px', 16: '16–64 px', 32: '64–256 px' };
const SLOPE: Record<number, number> = { 8: 1, 16: 0.5, 32: 0.12 };
const CELLS: Record<number, number> = { 8: 64, 16: 32, 32: 16 };
const GEAR: Record<number, number> = { 8: 0, 16: 1, 32: 2 };
const BOXSIDE: Record<number, number> = { 8: 22, 16: 52, 32: 110 };

export const Ch2Strides: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ stride: 16 });
  const [stride, setStride] = useState(16);
  const [fb, setFb] = useState(FB[16]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const s = stateRef.current.stride;
      const d = SLOPE[s];
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left: slope riding, gentler for larger stride ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 500, 54);
      const slopeH = lerp(70, 8, d);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 232); ctx.lineTo(500, 232 - slopeH); ctx.stroke();
      const t = (time / 2600) % 1;
      const px = 40 + t * 380;
      const py = 232 - (px / 500) * slopeH + Math.sin(t * Math.PI * (8 + d * 10)) * (4 - d * 2.5);
      const sc = 0.85;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 18 * sc, py, 14 * sc, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 20 * sc, py, 14 * sc, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 18 * sc, py); ctx.lineTo(px - 2 * sc, py - 16 * sc);
      ctx.lineTo(px + 20 * sc, py); ctx.lineTo(px - 18 * sc, py);
      ctx.moveTo(px - 2 * sc, py - 16 * sc); ctx.lineTo(px + 4 * sc, py - 20 * sc);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2 * sc, py - 30 * sc, 6 * sc, 0, Math.PI * 2); ctx.fill();
      // gear indicator: three cogs, current one highlighted
      const gearIdx = GEAR[s];
      for (let i = 0; i < 3; i++) {
        const gx = 60 + i * 40; const gy = 40; const r = 10 + i * 4;
        ctx.strokeStyle = i === gearIdx ? C.blue : C.muted; ctx.lineWidth = i === gearIdx ? 3 : 1.5;
        ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(100, 40); ctx.lineTo(150, 66); ctx.stroke();
      // ---- right inset: grid + anchors + responsible band ----
      ctx.fillStyle = '#fff'; ctx.fillRect(540, 20, 520, 240);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(540, 20, 520, 240);
      const cells = CELLS[s];
      const gx0 = 580; const gy0 = 50; const gs = 192;
      ctx.strokeStyle = '#dfe6f0'; ctx.lineWidth = 1;
      const step = gs / Math.sqrt(cells);
      for (let i = 0; i <= Math.sqrt(cells); i++) {
        ctx.beginPath(); ctx.moveTo(gx0 + i * step, gy0); ctx.lineTo(gx0 + i * step, gy0 + gs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx0, gy0 + i * step); ctx.lineTo(gx0 + gs, gy0 + i * step); ctx.stroke();
      }
      // anchor centers (every other grid intersection)
      ctx.fillStyle = C.muted;
      for (let i = 0; i < Math.sqrt(cells); i += 2) {
        for (let j = 0; j < Math.sqrt(cells); j += 2) {
          ctx.beginPath(); ctx.arc(gx0 + (i + 0.5) * step, gy0 + (j + 0.5) * step, 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      // typical responsible box band
      const boxSide = BOXSIDE[s];
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5;
      ctx.strokeRect(800 - boxSide / 2, 146 - boxSide / 2, boxSide, boxSide);
      ctx.fillStyle = C.text; ctx.font = '14px sans-serif';
      ctx.fillText(BAND[s], 800 - 30, 146 + boxSide / 2 + 18);
      ctx.fillStyle = C.muted; ctx.font = '12px sans-serif';
      ctx.fillText('s = ' + s, 580, 244);
    };

    const tick = (time: number) => {
      render(time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (v: number) => { stateRef.current.stride = v; setStride(v); setFb(FB[v]); };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {[8, 16, 32].map((v) => (
            <button key={v} className={`chip ${stride === v ? 'selected' : ''}`} onClick={() => pick(v)}>stride {v}</button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch2Strides;
