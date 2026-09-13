import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, trace, label, OK, BAD, MUTED, WHEEL, LINE } from './clayKit';

// 模块 10.1：同台比试。按论文数值比例推进两条赛道，并标出协议边界。
const W = 1080;
const H = 320;
const LANES = [
  { y: 110, ref: 0.35, color: OK },
  { y: 200, ref: 0.5, color: BAD },
];

export const Ch10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef({ running: false, t0: 0 });
  const uiRef = useRef({ metric: 'ppl' as 'ppl' | 'cond' });
  const [running, setRunning] = useState(false);
  const [metric, setMetric] = useState<'ppl' | 'cond'>('ppl');
  const [fb, setFb] = useState({ text: '按下开始：在 OWT 无条件协议下比较生成困惑度与采样步数。', cls: '' });

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
      const p = r.running ? Math.min(1, (now - r.t0) / 2400) : 0;
      field(ctx, W, H);
      LANES.forEach((lane, i) => {
        trace(ctx, [[120, lane.y], [920, lane.y]], '#cfd8c2', true);
        const progress = Math.min(1, p * (i === 0 ? 1.25 : 0.85));
        clay(ctx, 120 + 760 * progress, lane.y, 22, 0.18, now / 600 + i, i === 0 ? WHEEL : '#d8dfcc');
      });
      ctx.save();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(920, 70);
      ctx.lineTo(920, 240);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = OK;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('24', 932, 116);
      ctx.fillStyle = MUTED;
      ctx.fillText('32', 932, 206);
      ctx.restore();
      label(ctx, metric === 'ppl' ? 'OWT 无条件' : '条件任务', 120, 50, MUTED);
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
    setFb({ text: '同一协议下同时出发，比较谁用更少步数达到更低困惑度。', cls: '' });
    window.setTimeout(() => {
      runRef.current.running = false;
      setRunning(false);
      setFb(
        uiRef.current.metric === 'ppl'
          ? { text: 'OWT 上 ELF 用 32 步达到生成困惑度约 24，训练词元约 45B（基线常超 500B）。', cls: 'good' }
          : { text: 'WMT14 De-En BLEU 26.4；XSum R1 36.0±0.13 / R2 12.2 / RL 27.8，对比同规模基线最优。', cls: 'good' }
      );
    }, 2450);
  };

  const pick = (m: 'ppl' | 'cond') => {
    uiRef.current.metric = m;
    setMetric(m);
    runRef.current.running = false;
    setRunning(false);
    setFb(
      m === 'ppl'
        ? { text: 'OWT 协议：生成困惑度越低越好，需同时看熵。', cls: '' }
        : { text: '条件协议：BLEU 与 ROUGE 越高越好，不可与困惑度混比。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={start} disabled={running}>
          {running ? '比试中…' : '开始比试'}
        </button>
      </div>
      <div className="chip-row">
        <button className={`chip ${metric === 'ppl' ? 'selected' : ''}`} onClick={() => pick('ppl')}>
          OWT 无条件
        </button>
        <button className={`chip ${metric === 'cond' ? 'selected' : ''}`} onClick={() => pick('cond')}>
          条件任务
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch10Race;
