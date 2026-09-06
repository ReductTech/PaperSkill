import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoadH, drawCar, sceneLabel, inset } from './scene-kit';

const W = 560;
const H = 260;

// §6 M6.1 — P3 synchronized comparison: growing RoPE index (extrapolates out
// of the trained band; road jitters, schematic) vs fixed re-anchored index
// (sawtooth stays in band; road steady). Paper §3.2.1.
export const M6Rope: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 0, running: false, done: false });
  const rafRef = useRef<number | null>(null);
  const startTs = useRef(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '两侧初始完全相同。点「同时出发」。',
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

    const panel = (x0: number, p: number, fixed: boolean, time: number) => {
      inset(ctx, x0, 16, 262, 200);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, 16, 262, 200);
      ctx.clip();
      const roadY = 120;
      const overflow = fixed ? 0 : Math.max(0, p - 0.45) * 2;
      const jit = overflow * 6;
      // road with jitter on the growing side
      ctx.save();
      if (jit > 0) ctx.translate(Math.sin(time * 0.03) * jit, Math.cos(time * 0.037) * jit * 0.6);
      drawRoadH(ctx, roadY, x0 + 10, x0 + 252, 20);
      const carX = x0 + 24 + p * 210;
      drawCar(ctx, carX, roadY - 2, 0.75, fixed ? C.blue : overflow > 0 ? C.red : C.blue, 0);
      ctx.restore();
      // index gauge
      const gx = x0 + 16;
      const gy = 166;
      const gw = 230;
      ctx.strokeStyle = C.border;
      ctx.strokeRect(gx, gy, gw, 12);
      // trained band = first 55%
      ctx.fillStyle = 'rgba(39,68,110,0.10)';
      ctx.fillRect(gx, gy, gw * 0.55, 12);
      sceneLabel(ctx, '训练量程', gx + 4, gy - 4, true, 9);
      let tickX: number;
      if (fixed) {
        const saw = (p * 4) % 1;
        tickX = gx + saw * gw * 0.5;
        ctx.fillStyle = C.green;
      } else {
        tickX = gx + p * gw * 0.95;
        ctx.fillStyle = p > 0.55 ? C.red : C.blue;
        if (p > 0.55) {
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx + gw * 0.55, gy - 2);
          ctx.lineTo(gx + gw * 0.55, gy + 14);
          ctx.stroke();
        }
      }
      ctx.fillRect(tickX - 2, gy - 2, 4, 16);
      ctx.restore();
      sceneLabel(ctx, fixed ? '索引固定（重锚）' : '索引持续增长', x0 + 8, 34, false, 12);
    };

    const render = (s: { phase: number }, time: number) => {
      clearScene(ctx, W, H);
      panel(12, s.phase, false, time);
      panel(286, s.phase, true, time);
      sceneLabel(ctx, '同一时间轴同步推进', 210, 240, true, 11);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (t: number) => {
      const s = stateRef.current;
      if (s.running) {
        const el = (t - startTs.current) / 2800;
        s.phase = easeInOutQuad(clamp(el, 0, 1));
        if (el >= 1) {
          s.running = false;
          s.done = true;
          setRunning(false);
          setDone(true);
          setFeedback({
            text: '右侧把当前块、参考锚、历史块的起始索引都锚回固定原点（fᵢ, fᵢʳ, fᵢʰ），模型永远在熟悉的位置空间里工作；左侧的位置外推正是长序列抖动的来源之一。',
            cls: 'good',
          });
        }
      }
      render(s, t);
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

  const go = () => {
    const s = stateRef.current;
    s.phase = 0;
    s.done = false;
    s.running = true;
    startTs.current = performance.now();
    setRunning(true);
    setDone(false);
    setFeedback({ text: '同步推进中……注意两侧量表的走法。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={go} disabled={running}>
          {done ? '重来' : '同时出发'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M6Rope;
