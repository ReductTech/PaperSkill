import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', border: '#d7deea',
};

type Mode = 'dds' | 'ode';

/** P4：DDS 优化 vs FlowEdit ODE —— 为何不只做优化 */
export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode; t0: number }>({ mode: 'ode', t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('ode');
  const [feedback, setFeedback] = useState({
    text: 'FlowEdit 走固定 ODE，无需测试时迭代优化。',
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

    const render = (now: number) => {
      const { mode: m, t0 } = stateRef.current;
      const e = easeInOutQuad(((now - t0) % 2800) / 2800);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(50, 35, W - 100, H - 70);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(50, 35, W - 100, H - 70);

      if (m === 'dds') {
        // sweat / zig-zag optimize
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(120, 200);
        for (let i = 1; i <= 12; i++) {
          const x = 120 + i * 60;
          const y = 200 - Math.sin(i * 1.2 + e * 6) * (40 - i * 2) - i * 4;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          ctx.strokeStyle = C.red;
          ctx.beginPath();
          const dx = 200 + i * 80;
          ctx.moveTo(dx, 80 + ((e * 30 + i * 5) % 40));
          ctx.lineTo(dx, 88 + ((e * 30 + i * 5) % 40));
          ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = C.brown;
        ctx.fillRect(780, 90, 60, 48);
        ctx.strokeRect(780, 90, 60, 48);
        ctx.fillStyle = C.red;
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('测试时优化 · 慢且贵', 120, 60);
      } else {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(120, 160);
        ctx.lineTo(820, 160);
        ctx.stroke();
        const px = 120 + e * 700;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = C.brown;
        ctx.lineWidth = 2;
        ctx.fillRect(px - 30, 136, 60, 48);
        ctx.strokeRect(px - 30, 136, 60, 48);
        ctx.fillStyle = C.green;
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('一次 ODE 积分 · 免优化', 120, 60);
      }
      canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) {
        stateRef.current.t0 = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const off = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      off();
    };
  }, []);

  const pick = (m: Mode) => {
    stateRef.current.mode = m;
    stateRef.current.t0 = performance.now();
    setMode(m);
    setFeedback(
      m === 'ode'
        ? { text: 'FlowEdit 走固定 ODE，无需测试时迭代优化。', cls: 'good' }
        : { text: 'DDS 类优化：每张图反复迭代，耗时且不稳定。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={`chip${mode === 'dds' ? ' selected' : ''}`} aria-pressed={mode === 'dds'} onClick={() => pick('dds')}>
          DDS优化
        </button>
        <button type="button" className={`chip${mode === 'ode' ? ' selected' : ''}`} aria-pressed={mode === 'ode'} onClick={() => pick('ode')}>
          FlowEdit ODE
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
