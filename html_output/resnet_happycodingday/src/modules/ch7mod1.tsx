import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawPen, drawSceneLabel } from './kit-p3';
import type { WidgetProps } from './registry';

// Ch7 M7.1: P1 log slider learning rate 0.01..1.0. Left: pen stroke. Right: loss curve shape.
const W = 560;
const H = 240;

function lrFeedback(lr: number): { text: string; cls: string } {
  if (lr >= 0.3) return { text: '力度太大，损失来回振荡甚至发散。', cls: 'bad' };
  if (lr <= 0.03) return { text: '力度太小，收敛极慢甚至不动。', cls: 'bad' };
  return { text: '力度合适，损失稳步下降——论文用 0.1 起步，平台期除以 10。', cls: 'good' };
}

function lrColor(lr: number): string {
  if (lr >= 0.3) return C.red;
  if (lr <= 0.03) return C.orange;
  return C.green;
}

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lr: 0.1 });
  const rafRef = useRef<number | null>(null);
  const [lr, setLr] = useState(0.1);
  const [feedback, setFeedback] = useState(lrFeedback(0.1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { lr: number }) => {
      clearScene(ctx, W, H);
      const l = s.lr;
      // left: manuscript + pen stroke
      drawPage(ctx, 140, 150, 200, 76, 0);
      drawTextLines(ctx, 52, 138, 176, 2, 1, C.ink);
      const lw = clamp(map(l, 0.01, 1, 1, 8), 1, 8);
      ctx.strokeStyle = lrColor(l);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(64, 168);
      ctx.lineTo(64 + clamp(map(l, 0.01, 1, 20, 150), 20, 150), 168);
      ctx.stroke();
      if (l >= 0.3) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(200, 150);
        ctx.lineTo(220, 176);
        ctx.lineTo(204, 202);
        ctx.stroke();
      }
      drawPen(ctx, 56, 166, -0.12);
      drawSceneLabel(ctx, `学习率 ${l}`, 40, 40, lrColor(l));
      // right: loss curve
      const ox = 350;
      const oy = 210;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + 190, oy);
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy - 160);
      ctx.stroke();
      drawSceneLabel(ctx, '损失', ox + 6, oy - 170, C.muted);
      drawSceneLabel(ctx, '迭代', ox + 150, oy + 8, C.muted);
      const curvePts: [number, number][] = [];
      const N = 60;
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        let y: number;
        if (l >= 0.3) y = 0.3 + 0.7 * Math.abs(Math.sin(x * 22)) + x * 0.2;
        else if (l <= 0.03) y = 0.95 - x * 0.05 + 0.05 * Math.sin(x * 8);
        else y = 0.92 * Math.exp(-x * 3.2) + 0.06;
        curvePts.push([ox + x * 180, oy - y * 150]);
      }
      ctx.strokeStyle = lrColor(l);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      curvePts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      drawSceneLabel(ctx, l >= 0.3 ? '发散振荡' : l <= 0.03 ? '收敛极慢' : '稳步下降', ox + 90, oy - 130, lrColor(l), 'center');
    };
    const tick = () => {
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.pow(10, map(Number(e.target.value), 0, 100, -2, 0)); // 0.01 .. 1.0 log
    stateRef.current.lr = v;
    setLr(v);
    setFeedback(lrFeedback(v));
  };

  const sliderVal = Math.round(map(Math.log10(lr), -2, 0, 0, 100));

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          学习率 <span className="val">{lr}</span>
        </label>
        <input type="range" min={0} max={100} value={sliderVal} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
