import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 模块 3.2 —— 点三根柱查看 ATE 消融（越低越好）。
const W = 560;
const H = 220;

type Sel = 'noGCM' | 'noGCS' | 'full';
interface Bar {
  key: Sel;
  label: string;
  ate: number;
  x: number;
}
interface MetricState {
  t: number;
  sel: Sel;
}

const ATE_MAX = 20; // y 轴满量程（略高于最大值 19.00）
const BARS: Bar[] = [
  { key: 'noGCM', label: '去掉 GCM', ate: 19.0, x: 120 },
  { key: 'noGCS', label: '去掉 GCS', ate: 15.8, x: 280 },
  { key: 'full', label: '完整', ate: 13.7, x: 440 },
];
const BAR_W = 84;

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.82, w * 0.6, h * 0.9);
  ctx.quadraticCurveTo(w * 0.85, h * 0.94, w, h * 0.86);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

export const ModDriftMetric: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MetricState>({ t: 0, sel: 'full' });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState<Sel>('full');
  const [feedback, setFeedback] = useState({
    text: '完整 Scal3R：ATE 13.70（越低越好）。点其他柱看去掉某模块的后果。',
    cls: 'good',
  });

  const baseTop = 40;
  const baseBottom = H - 34;
  const axisH = baseBottom - baseTop;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: MetricState) => {
      const pulse = Math.sin(s.t * 0.12) * 0.5 + 0.5; // 0..1 用于选中描边呼吸
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      // y 轴
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, baseTop);
      ctx.lineTo(60, baseBottom);
      ctx.lineTo(W - 24, baseBottom);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('ATE ↓ 更好', 20, baseTop - 12);

      BARS.forEach((b) => {
        const bh = (b.ate / ATE_MAX) * axisH;
        const bx = b.x - BAR_W / 2;
        const by = baseBottom - bh;
        const isFull = b.key === 'full';
        const selected = s.sel === b.key;
        ctx.fillStyle = isFull ? '#228d5c' : '#9aa7b8';
        ctx.fillRect(bx, by, BAR_W, bh);
        if (selected) {
          ctx.strokeStyle = '#27446e';
          ctx.lineWidth = 2 + pulse * 1.5;
          ctx.strokeRect(bx - 2, by - 2, BAR_W + 4, bh + 4);
        }
        // 读数
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.ate.toFixed(2), b.x, by - 8);
        ctx.fillStyle = '#68778f';
        ctx.font = '12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(b.label, b.x, baseBottom + 18);
        ctx.textAlign = 'left';
      });
    };

    const tick = () => {
      stateRef.current.t += 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const applySel = (k: Sel) => {
    stateRef.current.sel = k;
    setSel(k);
    if (k === 'full') {
      setFeedback({ text: '完整 Scal3R：ATE 13.70（越低越好）。', cls: 'good' });
    } else if (k === 'noGCM') {
      setFeedback({ text: '去掉 GCM：ATE 19.00，漂移最严重。', cls: 'bad' });
    } else {
      setFeedback({ text: '去掉 GCS：ATE 15.80。', cls: '' });
    }
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = W / canvas.clientWidth;
    const mx = e.nativeEvent.offsetX * scale;
    const my = e.nativeEvent.offsetY * scale;
    for (const b of BARS) {
      const bh = (b.ate / ATE_MAX) * axisH;
      const bx = b.x - BAR_W / 2;
      const by = baseBottom - bh;
      if (mx >= bx && mx <= bx + BAR_W && my >= by && my <= baseBottom) {
        applySel(b.key);
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        {BARS.map((b) => (
          <button
            key={b.key}
            className={`chip ${sel === b.key ? 'selected' : ''}`}
            onClick={() => applySel(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModDriftMetric;
