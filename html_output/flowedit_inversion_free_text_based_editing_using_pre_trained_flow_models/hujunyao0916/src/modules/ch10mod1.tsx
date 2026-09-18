import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  green: '#228d5c', blue: '#27446e', orange: '#f07e47', red: '#c43f52',
  text: '#21324a', muted: '#68778f', border: '#d7deea',
};

/** Table S5 SD3: CLIP-T ↑ and LPIPS ↓ */
const ROWS = [
  { name: 'FlowEdit', clip: 0.344, lpips: 0.181, color: C.green },
  { name: 'SDEdit 0.2', clip: 0.33, lpips: 0.251, color: C.blue },
  { name: 'SDEdit 0.4', clip: 0.34, lpips: 0.316, color: C.orange },
  { name: 'ODE Inv.', clip: 0.337, lpips: 0.318, color: C.red },
  { name: 'iRFDS', clip: 0.335, lpips: 0.376, color: '#68778f' },
];

/** 结果赛跑条：CLIP↑ / LPIPS↓（Table S5 SD3） */
export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ playing: false, t0: 0, progress: 0 });
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({
    text: '点「开始对比」查看 SD3 表 S5 指标赛跑。',
    cls: '',
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

    const render = (p: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.text;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('CLIP-T ↑（左）', 80, 36);
      ctx.fillText('LPIPS ↓（右，越短越好）', 560, 36);

      const clipMax = 0.36;
      const lpipsMax = 0.4;
      ROWS.forEach((row, i) => {
        const y = 60 + i * 40;
        ctx.fillStyle = C.text;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(row.name, 40, y + 14);

        // CLIP bar grows right
        const cw = ((row.clip / clipMax) * 220) * p;
        ctx.fillStyle = C.border;
        ctx.fillRect(160, y, 220, 18);
        ctx.fillStyle = row.color;
        ctx.fillRect(160, y, cw, 18);
        if (p > 0.95) {
          ctx.fillStyle = C.text;
          ctx.font = '12px "Segoe UI", sans-serif';
          ctx.fillText(row.clip.toFixed(3), 390, y + 14);
        }

        // LPIPS bar: shorter is better — show remaining as filled from left but invert visually
        const lw = ((row.lpips / lpipsMax) * 280) * p;
        ctx.fillStyle = C.border;
        ctx.fillRect(560, y, 280, 18);
        ctx.fillStyle = row.name === 'FlowEdit' ? C.green : row.color;
        ctx.fillRect(560, y, lw, 18);
        if (p > 0.95) {
          ctx.fillStyle = C.text;
          ctx.fillText(row.lpips.toFixed(3), 850, y + 14);
        }
      });

      if (p > 0.98) {
        ctx.fillStyle = C.green;
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('FlowEdit：唯一同时高 CLIP 与低 LPIPS', 40, H - 20);
      }
      canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      const s = stateRef.current;
      let p = s.progress;
      if (s.playing) {
        p = easeInOutQuad(Math.min(1, (now - s.t0) / 1600));
        s.progress = p;
        if (p >= 1) {
          s.playing = false;
          setFeedback({
            text: '表 S5：FlowEdit CLIP 0.344、LPIPS 0.181，折中最优。',
            cls: 'good',
          });
        }
      }
      render(p);
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

  const onStart = () => {
    stateRef.current = { playing: true, t0: performance.now(), progress: 0 };
    setFeedback({ text: '指标条同步生长中……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={onStart} className="tiny">
          开始对比
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod1;
