import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { COLORS, text } from './river';
import type { WidgetProps } from './registry';

// 第 10 章：结果对比（P8 结果竞速 + 指标切换）。
const W = 1080;
const H = 300;
type Metric = 'ssim' | 'fps';

interface Racer {
  name: string;
  color: string;
  ssim: number;
  fps: number;
}

const RACERS: Racer[] = [
  { name: 'DriftWorld', color: COLORS.green, ssim: 0.9941, fps: 270 },
  { name: 'GPC', color: COLORS.blue, ssim: 0.9717, fps: 96 },
  { name: 'AVDC', color: COLORS.purple, ssim: 0.9862, fps: 6.4 },
  { name: 'Ctrl-World', color: COLORS.red, ssim: 0.8914, fps: 0.56 },
];

export const Ch10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ start: 0, running: false, metric: 'ssim' as Metric });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<Metric>('ssim');
  const [feedback, setFeedback] = useState({ text: '点击「开始对比」，查看 Push-T 上的核实数值。', cls: '' });
  const [, force] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { start: number; running: boolean; metric: Metric }) => {
      const dur = 1700;
      const p = s.running ? easeOutCubic(clamp((performance.now() - s.start) / dur, 0, 1)) : 0;
      const max = s.metric === 'ssim' ? 1 : 300;
      const labelW = 220;
      const top = 42;
      const rowH = 54;
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, W, H);
      text(ctx, s.metric === 'ssim' ? 'Push-T · SSIM（越高越好）' : 'Push-T · FPS（越高越快）', 36, 26, COLORS.ink, 20);
      RACERS.forEach((r, i) => {
        const y = top + i * rowH;
        const val = s.metric === 'ssim' ? r.ssim : r.fps;
        const ratio = clamp(val / max, 0, 1);
        const bw = (W - labelW - 90) * ratio * p;
        text(ctx, r.name, 30, y + rowH / 2, COLORS.ink, 20);
        ctx.fillStyle = COLORS.axis;
        ctx.fillRect(labelW, y, W - labelW - 90, 26);
        ctx.fillStyle = r.color;
        ctx.fillRect(labelW, y, bw, 26);
        text(ctx, s.metric === 'ssim' ? val.toFixed(3) : val.toFixed(1), W - 40, y + rowH / 2, COLORS.ink, 20, 'right');
      });
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

  const begin = () => {
    stateRef.current.start = performance.now();
    stateRef.current.running = true;
    setFeedback({
      text: metric === 'ssim' ? 'SSIM：DriftWorld 0.994，画质最高。' : 'FPS：DriftWorld 约 270，速度最快。',
      cls: 'good',
    });
    force((n) => n + 1);
  };

  const switchMetric = (m: Metric) => {
    stateRef.current.metric = m;
    stateRef.current.running = false;
    setMetric(m);
    setFeedback({ text: `已切换到 ${m === 'ssim' ? 'SSIM' : 'FPS'}，点击「开始对比」重新播放。`, cls: '' });
    force((n) => n + 1);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip active" onClick={begin}>
          开始对比
        </button>
        <button className={`chip ${metric === 'ssim' ? 'active' : ''}`} onClick={() => switchMetric('ssim')}>
          SSIM ↑
        </button>
        <button className={`chip ${metric === 'fps' ? 'active' : ''}`} onClick={() => switchMetric('fps')}>
          FPS ↑
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Race;
