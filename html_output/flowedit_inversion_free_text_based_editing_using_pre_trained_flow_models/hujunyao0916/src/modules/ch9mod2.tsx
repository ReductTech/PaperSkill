import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', orange: '#f07e47', text: '#21324a',
  muted: '#68778f', border: '#d7deea',
};

type Metric = 'lpips' | 'clip';

/** P6/点击：检查 LPIPS / CLIP 含义卡片 */
export const Ch9Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ metric: Metric }>({ metric: 'clip' });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<Metric>('clip');
  const [feedback, setFeedback] = useState({
    text: 'CLIP↑：文本对齐越好，说明改对了语义。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const cards: { id: Metric; x: number; title: string; sub: string }[] = [
      { id: 'clip', x: 180, title: 'CLIP↑', sub: '文本对齐' },
      { id: 'lpips', x: 560, title: 'LPIPS↓', sub: '结构变化' },
    ];

    const render = () => {
      const m = stateRef.current.metric;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(40, 30, W - 80, H - 60);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(40, 30, W - 80, H - 60);

      // photo pair
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(80, 90, 70, 56);
      ctx.strokeRect(80, 90, 70, 56);
      ctx.fillRect(900, 90, 70, 56);
      ctx.strokeRect(900, 90, 70, 56);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('源', 100, 170);
      ctx.fillText('编辑', 912, 170);

      cards.forEach((c) => {
        const on = c.id === m;
        ctx.fillStyle = on ? '#e8f5ee' : '#fff';
        ctx.strokeStyle = on ? C.green : C.border;
        ctx.lineWidth = on ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(c.x, 70, 280, 140, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = '28px "Segoe UI", sans-serif';
        ctx.fillText(c.title, c.x + 30, 125);
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillStyle = C.muted;
        ctx.fillText(c.sub, c.x + 30, 160);
        if (c.id === 'clip') {
          ctx.fillStyle = C.green;
          ctx.fillRect(c.x + 30, 175, 180, 10);
        } else {
          ctx.fillStyle = C.orange;
          ctx.fillRect(c.x + 30, 175, 90, 10);
        }
      });
      canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const off = observeCanvas(canvas, start, stop);

    const hit = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const y = ((e.clientY - r.top) / r.height) * H;
      for (const c of cards) {
        if (x >= c.x && x <= c.x + 280 && y >= 70 && y <= 210) {
          stateRef.current.metric = c.id;
          setMetric(c.id);
          setFeedback(
            c.id === 'clip'
              ? { text: 'CLIP↑：文本对齐越好，说明改对了语义。', cls: 'good' }
              : { text: 'LPIPS↓：越小结构越稳，过大说明漂了。', cls: '' }
          );
        }
      }
    };
    canvas.style.cursor = 'pointer';
    canvas.addEventListener('pointerdown', hit);
    return () => {
      stop();
      off();
      canvas.removeEventListener('pointerdown', hit);
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button
          type="button"
          className={`chip${metric === 'clip' ? ' selected' : ''}`}
          aria-pressed={metric === 'clip'}
          onClick={() => {
            stateRef.current.metric = 'clip';
            setMetric('clip');
            setFeedback({ text: 'CLIP↑：文本对齐越好，说明改对了语义。', cls: 'good' });
          }}
        >
          CLIP↑
        </button>
        <button
          type="button"
          className={`chip${metric === 'lpips' ? ' selected' : ''}`}
          aria-pressed={metric === 'lpips'}
          onClick={() => {
            stateRef.current.metric = 'lpips';
            setMetric('lpips');
            setFeedback({ text: 'LPIPS↓：越小结构越稳，过大说明漂了。', cls: '' });
          }}
        >
          LPIPS↓
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod2;
