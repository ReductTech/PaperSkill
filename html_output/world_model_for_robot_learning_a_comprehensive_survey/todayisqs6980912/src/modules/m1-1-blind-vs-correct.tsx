import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawGuide, drawInkPath, drawBrush, drawLegend } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 1.1 盲写 vs 胸有成竹：双轨对比（P3 开始按钮）。
// state: phase idle/run/done + t∈[0,1]；同一条 errOpen/errClosed 曲线驱动
// 双轨笔迹、右侧误差插图与反馈。

const W = 720;
const H = 360;
const RUN_MS = 3000;

const errOpen = (t: number) => 0.6 + 11 * Math.pow(clamp(t, 0, 1), 1.7);
const errClosed = (t: number) =>
  2.4 + 2.2 * Math.sin(6.28 * t) * Math.exp(-2.2 * t) + 0.9;

type Phase = 'idle' | 'run' | 'done';

export const M11BlindVsCorrect: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 'idle' as Phase, t: 0, last: 0 });
  const rafRef = useRef<number | null>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState({
    text: '点击开始：两条长横同时落笔。',
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

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 32, [
        { color: PALETTE.red, text: '盲写' },
        { color: PALETTE.blue, text: '预演' },
        { color: PALETTE.muted, text: '误差' },
      ]);

      const lanes = [
        { y: 96, open: true },
        { y: 236, open: false },
      ];
      const X0 = 60;
      const X1 = 470;
      const scale = 2.4;

      for (const lane of lanes) {
        drawGuide(ctx, [
          { x: X0, y: lane.y },
          { x: X1, y: lane.y },
        ]);
      }

      if (s.phase === 'idle') {
        drawBrush(ctx, X0, lanes[0].y, 0.2, 28);
        drawBrush(ctx, X0, lanes[1].y, 0.2, 28);
      } else {
        for (const lane of lanes) {
          const err = lane.open ? errOpen(s.t) : errClosed(s.t);
          const off = err * scale;
          const pts: { x: number; y: number }[] = [];
          const steps = Math.max(2, Math.round(s.t * 64));
          for (let i = 0; i <= steps; i++) {
            const u = (i / 64) * s.t;
            pts.push({ x: X0 + u * (X1 - X0), y: lane.y + off * Math.pow(u, 1.1) });
          }
          if (lane.open && pts.length > 1) {
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = PALETTE.red;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, lane.y);
            for (const p of pts) ctx.lineTo(p.x, p.y);
            ctx.lineTo(pts[pts.length - 1].x, lane.y);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
          drawInkPath(ctx, pts, {
            color: lane.open ? PALETTE.red : PALETTE.blue,
            width: 4,
          });
          if (pts.length > 1 && s.t < 1) {
            drawBrush(ctx, pts[pts.length - 1].x, pts[pts.length - 1].y, 0.2, 28);
          }
        }
      }

      // 右侧误差插图（两条曲线 + 细轴）
      const ix = 560;
      const iy = 60;
      const iw = 145;
      const ih = 220;
      ctx.save();
      ctx.strokeStyle = PALETTE.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(ix + 0.5, iy + 0.5, iw, ih);
      ctx.beginPath();
      ctx.moveTo(ix + 0.5, iy + ih - 0.5);
      ctx.lineTo(ix + iw - 0.5, iy + ih - 0.5);
      ctx.strokeStyle = PALETTE.muted;
      ctx.stroke();

      const plotErr = (fn: (t: number) => number, color: string) => {
        ctx.beginPath();
        const n = 40;
        for (let i = 0; i <= n; i++) {
          const u = (i / n) * s.t;
          const x = ix + 10 + u * (iw - 20);
          const y = iy + ih - 10 - clamp(fn(u) / 12, 0, 1) * (ih - 20);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      if (s.phase !== 'idle') {
        plotErr(errOpen, PALETTE.red);
        plotErr(errClosed, PALETTE.blue);
      }
      ctx.restore();

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (ms: number) => {
      const s = stateRef.current;
      if (s.last === 0) s.last = ms;
      const dt = ms - s.last;
      s.last = ms;
      if (s.phase === 'run') {
        s.t = clamp(s.t + dt / RUN_MS, 0, 1);
        if (labelRef.current) {
          labelRef.current.textContent = `书写中 ${Math.round(s.t * 100)}%`;
        }
        if (s.t >= 1) {
          s.phase = 'done';
          setPhase('done');
          setFeedback({
            text: '开环误差无界增长，闭环被拉回有界区间——这就是世界模型的价值。',
            cls: 'good',
          });
        }
      }
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      stateRef.current.last = 0;
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

  const onButton = () => {
    const s = stateRef.current;
    if (s.phase === 'idle') {
      s.phase = 'run';
      s.t = 0;
      s.last = 0;
      setPhase('run');
      setFeedback({
        text: '上轨盲写只看当前笔感；下轨每段落笔前先预演修正。',
        cls: '',
      });
    } else {
      s.phase = 'run';
      s.t = 0;
      s.last = 0;
      setPhase('run');
      setFeedback({
        text: '上轨盲写只看当前笔感；下轨每段落笔前先预演修正。',
        cls: '',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={onButton}>
          {phase === 'idle' ? '开始' : '重写'}
        </button>
        <span className="step-label" ref={labelRef}>
          {phase === 'idle' ? '待命' : phase === 'done' ? '完成：开环发散，闭环有界' : '书写中'}
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M11BlindVsCorrect;
