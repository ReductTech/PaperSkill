import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  green: '#228d5c', red: '#c43f52', blue: '#27446e', orange: '#f07e47',
  text: '#21324a', muted: '#68778f', border: '#d7deea',
};

type Mode = 'inv' | 'struct' | 'flow';

/** P4：反演编辑 / 结构注入 / FlowEdit —— 可迁移性 */
export const Ch1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'flow' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('flow');
  const [feedback, setFeedback] = useState({
    text: 'FlowEdit 不改模型内部，跨架构可直接用。',
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

    const render = () => {
      const m = stateRef.current.mode;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      // two model shelves
      ['SD3', 'FLUX'].forEach((name, i) => {
        const x = 120 + i * 420;
        ctx.fillStyle = C.light;
        ctx.fillRect(x, 60, 300, 160);
        ctx.strokeStyle = C.dark;
        ctx.strokeRect(x, 60, 300, 160);
        ctx.fillStyle = C.text;
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillText(name, x + 20, 90);

        // photo
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = C.brown;
        ctx.lineWidth = 2;
        ctx.fillRect(x + 40, 120, 56, 44);
        ctx.strokeRect(x + 40, 120, 56, 44);

        if (m === 'inv') {
          ctx.strokeStyle = C.red;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(x + 130, 110, 120, 70);
          ctx.setLineDash([]);
          ctx.fillStyle = C.red;
          ctx.font = '14px "Segoe UI", sans-serif';
          ctx.fillText('需反演挂钩', x + 140, 150);
        } else if (m === 'struct') {
          ctx.fillStyle = C.orange;
          ctx.fillRect(x + 140, 125, 100, 36);
          ctx.fillStyle = '#fff';
          ctx.fillText('注入结构', x + 155, 148);
        } else {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 110, 142);
          ctx.lineTo(x + 250, 142);
          ctx.stroke();
          ctx.fillStyle = C.green;
          ctx.font = '14px "Segoe UI", sans-serif';
          ctx.fillText('即插即用', x + 160, 130);
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
    return () => {
      stop();
      off();
    };
  }, []);

  const pick = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    if (m === 'flow') {
      setFeedback({ text: 'FlowEdit：模型无关，SD3/FLUX 同流程。', cls: 'good' });
    } else if (m === 'inv') {
      setFeedback({ text: '反演编辑：依赖噪声路径，迁移成本高。', cls: 'bad' });
    } else {
      setFeedback({ text: '结构注入：常需改注意力或内部模块。', cls: 'bad' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {(
          [
            ['inv', '反演编辑'],
            ['struct', '结构注入'],
            ['flow', 'FlowEdit'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`chip${mode === id ? ' selected' : ''}`}
            aria-pressed={mode === id}
            onClick={() => pick(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod2;
