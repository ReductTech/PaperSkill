import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawCanoe, drawLabel } from './river-kit';

// §2 Module 2.1: drag a time cursor along the training trajectory; a linked
// inset shows the one-step update signal split into trend + oscillation.

const W = 1080;
const H = 280;

// deterministic pseudo-trajectory: slow trend + oscillation
function trendAt(t: number): number {
  return t * 620 + 40 * Math.sin(t * 2.2);
}
function oscAt(t: number): number {
  return 14 * Math.sin(t * 14) + 8 * Math.sin(t * 31);
}

export const W2SignalDecomp: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ cursor: 0.3, dragging: false });
  const [cursor, setCursor] = useState(0.3);
  const [fb, setFb] = useState({ text: 't=0.30：这一步 Δx 的大部分是趋势，浪花只是围绕它摆动。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const toIntrinsic = (e: React.PointerEvent | PointerEvent): number => {
      const rect = canvas.getBoundingClientRect();
      return clamp(((e.clientX - rect.left) / rect.width) * W, 0, W);
    };

    const render = () => {
      const t = stateRef.current.cursor;
      clearScene(ctx, W, H);
      // main view: winding trajectory with canoe at cursor
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W * 0.66, H);
      ctx.clip();
      drawRiver(ctx, W * 0.66, H, 0.35, 0.5);
      // trajectory line
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const tt = i / 100;
        const x = 40 + tt * (W * 0.66 - 90);
        const y = 120 + Math.sin(tt * 4.4) * 26;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const cxp = 40 + t * (W * 0.66 - 90);
      const cyp = 120 + Math.sin(t * 4.4) * 26;
      // cursor line
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cxp, 24);
      ctx.lineTo(cxp, H - 24);
      ctx.stroke();
      ctx.setLineDash([]);
      drawCanoe(ctx, cxp, cyp, 0.03 * Math.sin(t * 14), C.blue, 0.8);
      ctx.restore();
      // inset: delta signal decomposition
      const ix = W * 0.68;
      const iw = W * 0.3;
      const iy = 40;
      const ih = H - 90;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeRect(ix, iy, iw, ih);
      // trend line
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const tt = i / 100;
        const x = ix + 8 + tt * (iw - 16);
        const y = iy + ih / 2 - trendAt(tt) * 0.35;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // oscillation waveform around the trend
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const tt = i / 300;
        const x = ix + 8 + tt * (iw - 16);
        const y = iy + ih / 2 - (trendAt(tt) * 0.35 + oscAt(tt));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // highlighted current point
      const hx = ix + 8 + t * (iw - 16);
      const hy = iy + ih / 2 - (trendAt(t) * 0.35 + oscAt(t));
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx, iy + ih / 2 - trendAt(t) * 0.35);
      ctx.stroke();
      drawLabel(ctx, `Δx=${(oscAt(t) + 2).toFixed(1)}`, hx + 8, hy - 8, C.text, 13);
      drawLabel(ctx, 'Δx 波形（灰）与趋势（蓝）', ix + 8, iy + 16, C.muted, 12);
    };

    render();
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');

    const onDown = (e: PointerEvent) => {
      stateRef.current.dragging = true;
      canvas.setPointerCapture(e.pointerId);
      onMove(e);
    };
    const onMove = (e: PointerEvent) => {
      if (!stateRef.current.dragging) return;
      const x = toIntrinsic(e);
      const t = clamp((x - 40) / (W * 0.66 - 90), 0, 1);
      stateRef.current.cursor = t;
      setCursor(t);
      render();
      setFb({
        text: `t=${t.toFixed(2)}：这一步 Δx 的大部分是趋势，浪花只是围绕它摆动。`,
        cls: '',
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const onUp = () => {
      stateRef.current.dragging = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const d = e.key === 'ArrowLeft' ? -0.02 : 0.02;
      const t = clamp(stateRef.current.cursor + d, 0, 1);
      stateRef.current.cursor = t;
      setCursor(t);
      render();
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%', cursor: 'grab', touchAction: 'none' }} />
      <div className="ctrl">
        <label>
          时间游标 t <span className="val">{cursor.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(cursor * 100)}
          onChange={(e) => {
            const t = Number(e.target.value) / 100;
            stateRef.current.cursor = t;
            setCursor(t);
            setFb({ text: `t=${t.toFixed(2)}：这一步 Δx 的大部分是趋势，浪花只是围绕它摆动。`, cls: '' });
          }}
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default W2SignalDecomp;
