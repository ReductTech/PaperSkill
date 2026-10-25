import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const DIM = '#7f8db0';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const BORDER = '#d7deea';

type Metric = 'voc07' | 'coco50' | 'cocoAll';

const DATA: Record<Metric, { label: string; rows: { name: string; value: number; color: string }[] }> = {
  voc07: {
    label: 'VOC 2007 test · mAP%',
    rows: [
      { name: 'SS + Fast R-CNN', value: 66.9, color: RED },
      { name: 'RPN 不共享', value: 68.5, color: BLUE },
      { name: 'RPN 共享', value: 69.9, color: GREEN },
    ],
  },
  coco50: {
    label: 'COCO test-dev · mAP@0.5',
    rows: [
      { name: 'Fast R-CNN', value: 39.3, color: RED },
      { name: 'Faster R-CNN', value: 42.1, color: GREEN },
      { name: 'Faster (trainval)', value: 42.7, color: GREEN },
    ],
  },
  cocoAll: {
    label: 'COCO test-dev · mAP@[.5,.95]',
    rows: [
      { name: 'Fast R-CNN', value: 19.3, color: RED },
      { name: 'Faster R-CNN', value: 21.5, color: GREEN },
      { name: 'Faster (trainval)', value: 21.9, color: GREEN },
    ],
  },
};

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const progressRef = useRef(1);
  const [metric, setMetric] = useState<Metric>('voc07');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({
    text: 'VOC 2007 测试集 mAP：SS 66.9%，Faster R-CNN 69.9%（VGG-16，共享）。',
    cls: 'good',
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
      const d = DATA[metric];
      const maxV = Math.max(...d.rows.map((r) => r.value));
      ctx.fillStyle = SKY;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = GLOW;
      ctx.fillRect(0, H - 50, W, 50);
      ctx.fillStyle = DIM;
      ctx.font = '16px sans-serif';
      ctx.fillText(d.label, 40, 34);
      d.rows.forEach((r, i) => {
        const y = 58 + i * 58;
        const w = (r.value / (maxV * 1.08)) * (W - 320) * p;
        ctx.fillStyle = '#122346';
        ctx.fillRect(150, y, W - 470, 24);
        ctx.fillStyle = r.color;
        ctx.fillRect(150, y, w, 24);
        ctx.fillStyle = '#dfe7f5';
        ctx.font = '15px sans-serif';
        ctx.fillText(r.name, 150, y - 8);
        ctx.fillText(r.value.toFixed(1), 150 + w + 8, y + 18);
      });
    };
    const tick = () => {
      const p = progressRef.current;
      if (running && p < 1) {
        progressRef.current = Math.min(1, p + 0.025);
        render(progressRef.current);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        render(progressRef.current);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    render(progressRef.current);
    return () => {
      stop();
      disconnect();
    };
  }, [metric, running]);

  const run = () => {
    progressRef.current = 0;
    setRunning(true);
    const d = DATA[metric];
    const top = d.rows[d.rows.length - 1];
    setFeedback({ text: `${d.label}：${d.rows.map((r) => `${r.name} ${r.value}%`).join('，')}。`, cls: 'good' });
  };

  const pick = (m: Metric) => {
    setMetric(m);
    progressRef.current = 1;
    setRunning(false);
    const d = DATA[m];
    setFeedback({ text: `切换到 ${d.label}，点击「开始比赛」查看对比。`, cls: '' });
  };

  const chips: { id: Metric; label: string }[] = [
    { id: 'voc07', label: 'VOC07' },
    { id: 'coco50', label: 'COCO@0.5' },
    { id: 'cocoAll', label: 'COCO@[.5,.95]' },
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={run}>
          开始比赛
        </button>
        {chips.map((c) => (
          <button key={c.id} type="button" className={metric === c.id ? 'active' : ''} onClick={() => pick(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod1;
