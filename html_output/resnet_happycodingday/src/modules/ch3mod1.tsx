import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawMark, drawSceneLabel } from './kit-p1';
import type { WidgetProps } from './registry';

// Ch3 M3.1: P3 synchronized before/after — one shared start button drives both panels.
const W = 560;
const H = 240;

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ running: false, t: 0 });
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { running: boolean; t: number }) => {
      clearScene(ctx, W, H);
      const t = s.t;
      // left panel (rewrite): clarity drops
      const lc = clamp(1 - t * 0.85, 0.18, 1);
      drawPage(ctx, 140, 130, 210, 92, 0);
      drawTextLines(ctx, 48, 112, 176, 3, lc, C.red);
      drawSceneLabel(ctx, '整段重写（plain）', 140, 24, C.red, 'center');
      drawSceneLabel(ctx, `清晰度 ${Math.round(lc * 100)}%`, 140, 210, lc > 0.5 ? C.red : C.muted, 'center');
      // right panel (residual): original + fixes improve
      const rc = clamp(0.35 + t * 0.65, 0.35, 1);
      drawPage(ctx, 420, 130, 210, 92, 0);
      drawTextLines(ctx, 328, 112, 176, 3, 1, C.ink);
      const marks = Math.floor(t * 5);
      for (let i = 0; i < marks; i++) {
        drawMark(ctx, 336 + i * 34, 124 + (i % 2) * 8, i % 2 === 0 ? 'caret' : 'under', C.red, 16);
      }
      drawSceneLabel(ctx, '原句+批注（ResNet）', 420, 24, C.green, 'center');
      drawSceneLabel(ctx, `清晰度 ${Math.round(rc * 100)}%`, 420, 210, rc > 0.8 ? C.green : C.muted, 'center');
    };
    const tick = () => {
      const s = stateRef.current;
      if (s.running) {
        s.t = clamp(s.t + 0.008, 0, 1);
        if (s.t >= 1) {
          s.running = false;
          setRunning(false);
        }
      }
      render(s);
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

  const begin = () => {
    stateRef.current.running = true;
    stateRef.current.t = 0;
    setRunning(true);
  };

  const done = !running && stateRef.current.t >= 1;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={begin} disabled={running}>
          开始对照
        </button>
      </div>
      <div className={`feedback ${done ? 'good' : ''}`}>
        {done
          ? '左栏越改越乱——每层都要无中生有；右栏一次比一次准——每层只改一点点。'
          : running
          ? '两栏以同一时间基准同步推进……'
          : '按「开始对照」，看同一处语病的两种改法。'}
      </div>
    </div>
  );
};

export default Ch3Mod1;
