import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
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

export const Mod12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ value: 0.5, cover: false, neighbor: false });
  const rafRef = useRef<number | null>(null);
  const [value, setValue] = useState(0.5);
  const [cover, setCover] = useState(false);
  const [neighbor, setNeighbor] = useState(false);
  const [feedback, setFeedback] = useState({ text: '打开参照开关，看拼块如何稳定落位。', cls: '' });

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

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      roundRect(ctx, 60, 60, 360, 150, 8);
      ctx.stroke();
      if (s.neighbor) piece(ctx, 150, 135, 40, '#27446e');
      if (s.cover) {
        ctx.fillStyle = '#7c3aed';
        roundRect(ctx, 300, 60, 60, 60, 4);
        ctx.fill();
      }
      ctx.strokeStyle = '#228d5c';
      ctx.setLineDash([6, 5]);
      roundRect(ctx, 210, 120, 60, 56, 6);
      ctx.stroke();
      ctx.setLineDash([]);

      const factor = 1 - (s.cover ? 0.5 : 0) - (s.neighbor ? 0.5 : 0);
      const jitter = s.value * 34 * Math.max(factor, 0.08);
      const jx = 240 + Math.sin(now * 0.004) * jitter;
      const settled = factor < 0.2;
      const color = settled ? '#228d5c' : '#c43f52';
      piece(ctx, jx, settled ? 148 : 96, 44, color);

      const err = s.value * Math.max(factor, 0.08);
      const bx = 560;
      const bw = 440;
      const bh = err * (H - 90);
      ctx.fillStyle = err > 0.6 ? '#c43f52' : err > 0.25 ? '#f07e47' : '#228d5c';
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
    updateFeedback(v, stateRef.current.cover, stateRef.current.neighbor);
  };

  const updateFeedback = (v: number, c: boolean, n: boolean) => {
    if (c && n) setFeedback({ text: '邻居 + 盒盖一起上，误差最小。', cls: 'good' });
    else if (c) setFeedback({ text: '有盒盖，均值补上了，稳多了。', cls: 'good' });
    else if (n) setFeedback({ text: '有邻居参照，比纯猜强。', cls: '' });
    else setFeedback({ text: '两个参照都关着，还在猜。', cls: 'bad' });
  };

  const toggleCover = () => {
    const next = !cover;
    stateRef.current.cover = next;
    setCover(next);
    updateFeedback(stateRef.current.value, next, stateRef.current.neighbor);
  };

  const toggleNeighbor = () => {
    const next = !neighbor;
    stateRef.current.neighbor = next;
    setNeighbor(next);
    updateFeedback(stateRef.current.value, stateRef.current.cover, next);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${cover ? 'selected' : ''}`} onClick={toggleCover}>
          盒盖参照（均值）
        </button>
        <button className={`chip ${neighbor ? 'selected' : ''}`} onClick={toggleNeighbor}>
          邻居参照（上下文）
        </button>
      </div>
      <div className="ctrl">
        <label>
          无参照难度 <span className="val">{value.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod12;
