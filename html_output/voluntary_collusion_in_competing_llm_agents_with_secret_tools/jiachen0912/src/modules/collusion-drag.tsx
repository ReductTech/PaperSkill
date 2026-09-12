import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P6 drag — drag a divider to split four seats into colluders (C) vs victims (V),
// and watch expected utility diverge (colluders up, victims down).
const W = 1080;
const H = 280;
const GREEN = '#228d5c';
const RED_C = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const FELT = '#b8c9a7';
const FELT_DARK = '#76906a';
const TEXT = '#21324a';
const MUTED = '#68778f';

export const CollusionDrag: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ split: 0.5 });
  const [split, setSplit] = useState(0.5);
  const [feedback, setFeedback] = useState({ text: '拖动分界线，把玩家分成合谋者与受害者。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { split: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = FELT;
      ctx.fillRect(0, H * 0.6, W, H * 0.4);

      // four seats as chips; left of divider = colluders (green), right = victims (red)
      const seats = [W * 0.16, W * 0.38, W * 0.62, W * 0.84];
      const dividerX = s.split * W;
      seats.forEach((x, i) => {
        const isC = x < dividerX;
        ctx.beginPath();
        ctx.arc(x, H * 0.3, 22, 0, Math.PI * 2);
        ctx.fillStyle = isC ? GREEN : RED_C;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isC ? 'C' : 'V', x, H * 0.3 + 5);
        ctx.textAlign = 'left';
      });

      // divider
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(dividerX, H * 0.1);
      ctx.lineTo(dividerX, H * 0.55);
      ctx.stroke();
      ctx.fillStyle = ORANGE;
      ctx.beginPath();
      ctx.moveTo(dividerX, H * 0.1);
      ctx.lineTo(dividerX - 8, H * 0.06);
      ctx.lineTo(dividerX + 8, H * 0.06);
      ctx.closePath();
      ctx.fill();

      // utility bars (values grounded in Table 18: colluders 10.33->31.80, victims 3.89->3.06)
      const uC = 10.33 + (31.8 - 10.33) * 0.6;
      const uV = 3.89 - (3.89 - 3.06) * 0.6;
      const max = 34;
      const bhC = (uC / max) * H * 0.4;
      const bhV = (uV / max) * H * 0.4;
      ctx.fillStyle = GREEN;
      ctx.fillRect(W * 0.62, H * 0.55 - bhC, 60, bhC);
      ctx.fillStyle = RED_C;
      ctx.fillRect(W * 0.8, H * 0.55 - bhV, 60, bhV);
      ctx.fillStyle = TEXT;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('合谋者', W * 0.62, H * 0.58 + 14);
      ctx.fillText('受害者', W * 0.8, H * 0.58 + 14);
      ctx.fillStyle = MUTED;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(uC.toFixed(1), W * 0.62 + 8, H * 0.55 - bhC - 6);
      ctx.fillText(uV.toFixed(1), W * 0.8 + 8, H * 0.55 - bhV - 6);
    };
    let rafId = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const setFromClientX = (clientX: number, rect: DOMRect) => {
    const x = (clientX - rect.left) * (W / rect.width);
    const s = clamp(x / W, 0.25, 0.75);
    stateRef.current.split = s;
    setSplit(s);
    setFeedback({ text: '合谋者效用 ↑（绿），受害者效用 ↓（红）——满足弱合谋条件。', cls: 'good' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    setFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        style={{ cursor: 'ew-resize', touchAction: 'none' }}
      />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#228d5c' }} />C 合谋者（效用 ↑）</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#c43f52' }} />V 受害者（效用 ↓）</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#f07e47' }} />橙色线＝拖动分界</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default CollusionDrag;
