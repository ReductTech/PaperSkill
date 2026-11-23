import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawBar, drawLabel, withAlpha, drawLegend, type Ctx } from './scene';

const W = 1080;
const H = 280;

type Metric = 'tinAvg' | 'tinLast' | 'inrLast' | 'miniHAcc' | 'miniPD';

interface Spec {
  key: Metric;
  label: string;
  set: string;
  ours: number;
  base: number;
  lowerBetter: boolean;
  note: string;
}

const SPECS: Spec[] = [
  {
    key: 'tinAvg',
    label: 'Tiny Avg',
    set: 'Tiny-ImageNet，B100-5 任务',
    ours: 86.17,
    base: 83.42,
    lowerBetter: false,
    note: '同一 B100-5 设置：86.17 对 83.42，越高越好。',
  },
  {
    key: 'tinLast',
    label: 'Tiny Last',
    set: 'Tiny-ImageNet，B100-5 任务',
    ours: 81.86,
    base: 76.98,
    lowerBetter: false,
    note: '同一 B100-5 设置：81.86 对 76.98，越高越好。',
  },
  {
    key: 'inrLast',
    label: 'ImageNet-R',
    set: 'ImageNet-R，B0-10 任务',
    ours: 84.29,
    base: 80.72,
    lowerBetter: false,
    note: 'ImageNet-R 单独一组：84.29 对 80.72，不要和 Tiny 的数值横向比。',
  },
  {
    key: 'miniHAcc',
    label: 'Mini HAcc',
    set: 'Mini-ImageNet，少样本增量',
    ours: 74.81,
    base: 71.45,
    lowerBetter: false,
    note: 'Mini-ImageNet 单独一组：74.81 对 71.45，越高越好。',
  },
  {
    key: 'miniPD',
    label: 'Mini PD',
    set: 'Mini-ImageNet，少样本增量',
    ours: 12.93,
    base: 14.17,
    lowerBetter: true,
    note: 'PD 是掉点，越低越好：12.93 对 14.17，条越短越好（表 2）。',
  },
];

const specOf = (k: Metric) => SPECS.filter((s) => s.key === k)[0];

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<{ metric: Metric; start: number }>({ metric: 'tinAvg', start: 0 });
  const [metric, setMetric] = useState<Metric>('tinAvg');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({ text: '一组一组比，不同数据集的数不并排。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (now: number) => {
      const { metric: m, start } = viewRef.current;
      const s = specOf(m);
      const t = start === 0 ? 0 : clamp((now - start) / 1600, 0, 1);
      const ours = s.ours / (Math.max(s.ours, s.base) * 1.15);
      const base = s.base / (Math.max(s.ours, s.base) * 1.15);

      clearScene(ctx, W, H);

      // finish line
      ctx.save();
      ctx.strokeStyle = withAlpha(C.envDark, 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(940, 50);
      ctx.lineTo(940, 224);
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, 940, 240, '结案线', C.muted, 11, 'center');

      drawLabel(ctx, 60, 104, 'KG-GMM', C.green, 12);
      drawBar(ctx, 160, 92, 760, 18, ours * t, C.green, false);
      if (t === 1) drawLabel(ctx, 936, 104, s.ours.toFixed(2), C.ink, 13, 'right');

      drawLabel(ctx, 60, 184, '基线 GMM', C.muted, 12);
      drawBar(ctx, 160, 172, 760, 18, base * t, withAlpha(C.muted, 0.9), false);
      if (t === 1) drawLabel(ctx, 936, 184, s.base.toFixed(2), C.ink, 13, 'right');

      if (t === 1) {
        drawLegend(ctx, 160, 220, [
          { text: s.lowerBetter ? '越低越好 ↓' : '越高越好 ↑', color: s.lowerBetter ? C.orange : C.blue },
          { text: '无样本回放', color: C.muted },
        ]);
      }
    };

    let raf = 0;
    const tick = (now: number) => {
      render(now);
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
    viewRef.current.start = performance.now();
    setRunning(true);
    setFeedback({ text: '两卷案宗同时出发……', cls: '' });
    window.setTimeout(() => {
      setFeedback({ text: specOf(viewRef.current.metric).note, cls: 'good' });
    }, 1700);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className="chip" onClick={run}>
          {running ? '重来' : '开始盘点'}
        </button>
        {SPECS.map((s) => (
          <button
            key={s.key}
            className={`chip${metric === s.key ? ' selected' : ''}`}
            aria-pressed={metric === s.key}
            onClick={() => {
              viewRef.current = { metric: s.key, start: 0 };
              setMetric(s.key);
              setRunning(false);
              setFeedback({ text: `换到 ${s.set} 这一组；按“开始盘点”重新比。`, cls: '' });
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod1;
