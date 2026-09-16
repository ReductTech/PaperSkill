import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P1 slider — warning intensity vs acceptance rate. The acceptance bar stays ~100%
// regardless of how strong the "unfair" label is, exposing the paper's core problem.

const W = 1080;
const H = 280;
const RED = '#c43f52';
const GREEN = '#228d5c';
const FELT = '#b8c9a7';
const FELT_DARK = '#76906a';
const TEXT = '#21324a';
const MUTED = '#68778f';

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const WarnSlider: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ warning: 50 });
  const [warning, setWarning] = useState(50);
  const [feedback, setFeedback] = useState({ text: '拖动滑块，观察接受率如何变化。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { warning: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = FELT;
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
      ctx.strokeStyle = FELT_DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.6);
      ctx.lineTo(W, H * 0.6);
      ctx.stroke();

      // left: a warning banner that grows with warning strength (fits its own area)
      const bannerW = 140 + (s.warning / 100) * 220;
      const bannerX = W * 0.08;
      const bannerY = H * 0.26;
      const bannerH = 54;
      ctx.fillStyle = RED;
      rr(ctx, bannerX, bannerY, bannerW, bannerH, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ 不公平提示', bannerX + bannerW / 2, bannerY + bannerH / 2 + 7);
      ctx.textAlign = 'left';

      // right: acceptance bar pinned near 100%
      const acc = 0.98;
      const bh = acc * H * 0.46;
      ctx.fillStyle = GREEN;
      ctx.fillRect(W * 0.62, H * 0.52 - bh, 70, bh);
      ctx.fillStyle = TEXT;
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText(Math.round(acc * 100) + '%', W * 0.62 + 8, H * 0.52 - bh - 8);
      ctx.fillStyle = MUTED;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('接受率', W * 0.62, H * 0.6 + 24);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.warning = v;
    setWarning(v);
    if (v < 30) setFeedback({ text: '提示很弱，接受率仍 ≈100%——模型照单全收。', cls: '' });
    else if (v < 70) setFeedback({ text: '提示中等，接受率依旧 ≈100%。', cls: '' });
    else setFeedback({ text: '提示最强，接受率还是 ≈100%——警示本身不是护栏（论文结论）。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#c43f52' }} />红色标签＝「不公平」提示强度（随滑块变大）</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#228d5c' }} />绿色柱＝接受率（始终 ≈100%）</span>
      </div>
      <div className="ctrl">
        <label>
          不公平提示强度 <span className="val">{warning}</span>
        </label>
        <input type="range" min={0} max={100} value={warning} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default WarnSlider;
