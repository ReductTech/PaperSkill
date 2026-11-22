import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawVase,
  drawTag,
  drawLabel,
  drawBar,
  withAlpha,
  roundRect,
  type Ctx,
} from './scene';

const W = 1080;
const H = 280;

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 'idle' as 'idle' | 'running' | 'done', start: 0 });
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [feedback, setFeedback] = useState({ text: '同一件证物，两种贴法。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { phase: string; start: number }) => {
      clearScene(ctx, W, H);
      const t = s.phase === 'running' ? clamp((performance.now() - s.start) / 1500, 0, 1) : s.phase === 'done' ? 1 : 0;
      const fall = easeOutCubic(clamp(t / 0.55, 0, 1));

      ctx.save();
      ctx.strokeStyle = withAlpha(C.border, 0.9);
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(540, 30);
      ctx.lineTo(540, 250);
      ctx.stroke();
      ctx.restore();

      // left panel: 描述型标签
      drawVase(ctx, 142, 168, 1.9, C.envLight);
      drawTag(ctx, 100, 64 + fall * 74, 76, 26, '白底花纹', C.red);
      drawBar(ctx, 220, 150, 260, 12, 0.35 * t, C.red, false);
      drawLabel(ctx, 220, 132, '描述标签', C.red, 13);

      // right panel: 关系型标签
      drawVase(ctx, 662, 168, 1.9, C.envLight);
      drawTag(ctx, 620, 64 + fall * 74, 84, 26, '底款六年', C.green);
      drawBar(ctx, 740, 150, 260, 12, 0.86 * t, C.green, false);
      drawLabel(ctx, 740, 132, '关系标签', C.green, 13);

      if (s.phase === 'done') {
        drawLabel(ctx, 90, 232, '未命中', C.red, 13);
        drawLabel(ctx, 610, 232, '命中', C.green, 13);
      }
    };

    let raf = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const run = () => {
    stateRef.current = { phase: 'running', start: performance.now() };
    setPhase('running');
    setFeedback({ text: '两边同时出发……', cls: '' });
    window.setTimeout(() => {
      stateRef.current.phase = 'done';
      setPhase('done');
      setFeedback({
        text: '左栏还是没点到这一件；右栏三条关系直接命中。表 4 里只加描述 80.95，和 80.72 几乎没差。',
        cls: 'good',
      });
    }, 1600);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className="chip" onClick={run}>
          {phase === 'idle' ? '同时比对' : '重来'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
