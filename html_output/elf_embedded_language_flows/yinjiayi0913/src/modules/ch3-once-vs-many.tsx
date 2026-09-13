import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, hand, seal, ring, label, GUIDE, OK, BAD, MUTED, WHEEL } from './clayKit';

// 模块 3.1：同一时间基准下比较「中途反复切块」与「终点只落款一次」。
const W = 1080;
const H = 320;
const GY = 220;

export const Ch3OnceVsMany: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef({ running: false, t0: 0 });
  const [running, setRunning] = useState(false);
  const [fb, setFb] = useState({ text: '按下开始，比较两条路径：左边每一步都在取整，右边只离散一次。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (now: number) => {
      const r = runRef.current;
      const p = r.running ? Math.min(1, (now - r.t0) / 3000) : 0;
      field(ctx, W, H);
      // 左面板：中途反复切块
      const lx = 300;
      clay(ctx, lx, GY, 62, 0.12 + 0.5 * p, p * 9, '#d8dfcc');
      const cuts = Math.floor(p * 6);
      for (let i = 0; i <= cuts; i++) {
        ctx.save();
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx - 62 + i * (124 / 6), GY - 64);
        ctx.lineTo(lx - 62 + i * (124 / 6), GY + 62);
        ctx.stroke();
        ctx.restore();
      }
      label(ctx, '中途切块', lx - 30, 46, BAD);
      // 右面板：连续到终点再落款
      const rx = 790;
      ring(ctx, rx, GY, 70, GUIDE, true);
      clay(ctx, rx, GY, 62, 0.12 * (1 - p), p * 9, WHEEL);
      if (p > 0.8) seal(ctx, rx, GY, true);
      label(ctx, '终点落款', rx - 30, 46, p > 0.8 ? OK : GUIDE);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const start = () => {
    runRef.current = { running: true, t0: performance.now() };
    setRunning(true);
    setFb({ text: '左侧每切一次就丢一次轮廓细节，右侧把连续信息保留到最后。', cls: '' });
    window.setTimeout(() => {
      runRef.current.running = false;
      setRunning(false);
      setFb({ text: '只离散一次：连续轨迹把信息完整带到终点才落款。', cls: 'good' });
    }, 3050);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={start} disabled={running}>
          {running ? '对比中…' : '开始对比'}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch3OnceVsMany;
