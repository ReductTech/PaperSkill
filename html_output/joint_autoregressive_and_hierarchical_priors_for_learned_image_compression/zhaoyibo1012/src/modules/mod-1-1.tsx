import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function piece(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  roundRect(ctx, x - s / 2, y - s / 2, s, s, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(33,50,74,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - s / 2, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export const Mod11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ value: 0.5, cover: false });
  const rafRef = useRef<number | null>(null);
  const [value, setValue] = useState(0.5);
  const [cover, setCover] = useState(false);
  const [feedback, setFeedback] = useState({ text: '拖动滑块，感受没有盒盖时的预测误差。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const s = stateRef.current;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      // left: board + slot + floating piece
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      roundRect(ctx, 60, 60, 340, 150, 8);
      ctx.stroke();
      ctx.strokeStyle = '#228d5c';
      ctx.setLineDash([6, 5]);
      roundRect(ctx, 200, 120, 60, 56, 6);
      ctx.stroke();
      ctx.setLineDash([]);

      const jitter = s.cover ? 0 : s.value * 34;
      const jx = 230 + Math.sin(now * 0.004) * jitter;
      const jy = s.cover ? 148 : 96 - s.value * 20;
      const color = s.cover ? '#228d5c' : s.value > 0.7 ? '#c43f52' : '#27446e';
      piece(ctx, jx, jy, 44, color);

      // right: error bar
      const err = s.cover ? 0.12 : s.value;
      const bx = 560;
      const bw = 440;
      const bh = err * (H - 90);
      ctx.fillStyle = err > 0.7 ? '#c43f52' : err > 0.3 ? '#f07e47' : '#228d5c';
      ctx.fillRect(bx, H - 40 - bh, bw, bh);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, 40, bw, H - 80);
      ctx.fillStyle = '#21324a';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText('预测误差', bx, 32);
      ctx.fillStyle = '#68778f';
      ctx.fillText(Math.round(err * 100) + '%', bx + bw - 70, 32);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.value = v;
    setValue(v);
    setFeedback(
      v > 0.7
        ? { text: '没有盒盖，根本对不上——误差很大。', cls: 'bad' }
        : v > 0.3
          ? { text: '越猜越慌，误差在变大。', cls: '' }
          : { text: '还能勉强放对，误差不大。', cls: 'good' }
    );
  };

  const onCover = () => {
    stateRef.current.cover = true;
    setCover(true);
    setFeedback({ text: '有盒盖参照，稳稳落位，误差很小。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          无盒盖难度 <span className="val">{value.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={onChange} />
        <button className="tiny" onClick={onCover} disabled={cover}>
          {cover ? '已看盒盖' : '看盒盖'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod11;
