import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawLegend,
  drawSceneLabel,
  drawVehicle,
  EMPH,
  MUTED,
  OK,
  PAINT,
} from './drivingKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const METRICS = [
  { chip: '22 种本体', label: '机器人本体', scale: '1 点 = 1 种', color: OK },
  { chip: '21 家机构', label: '合作机构', scale: '1 点 = 1 家', color: OK },
  { chip: '527 项技能', label: '技能', scale: '1 点 = 1 项', color: OK },
  { chip: '160266 个任务', label: '任务', scale: '1 点 = 1000', color: EMPH },
  { chip: '100 万+ 轨迹', label: '轨迹', scale: '1 点 = 1 万', color: EMPH },
];

const METRIC_TEXT = [
  '22 种机器人本体——同一套数据格式要装下 22 种不同的机器人。',
  '21 家合作机构；60 个已有数据集来自 34 个实验室。',
  '527 项技能，对应 160266 个任务。',
  '160266 个任务：技能是类别，任务是具体要做的那件事。',
  '100 万+ 真实机器人轨迹，由 60 个已有数据集合并而来。',
];

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ metric: 0 });
  const [metric, setMetric] = useState(0);
  const [feedback, setFeedback] = useState(METRIC_TEXT[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawBodies = () => {
      const kinds = ['sedan', 'truck', 'van', 'bus', 'moto'];
      for (let i = 0; i < 22; i++) {
        const col = i % 11;
        const row = Math.floor(i / 11);
        drawVehicle(ctx, 90 + col * 86, 124 + row * 92, kinds[i % kinds.length], 0.7, PAINT);
      }
    };

    const drawInstitutions = () => {
      for (let i = 0; i < 21; i++) {
        const col = i % 11;
        const row = Math.floor(i / 11);
        const x = 90 + col * 86;
        const y = 92 + row * 92;
        ctx.fillStyle = PAINT;
        ctx.fillRect(x, y, 42, 46);
        ctx.fillStyle = '#ffffff';
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillRect(lerp(x + 7, x + 29, c / 2), y + 8 + r * 15, 6, 9);
          }
        }
        ctx.fillStyle = MUTED;
        ctx.fillRect(x + 15, y + 40, 12, 6);
      }
    };

    const drawDots = (count: number, cols: number, r: number, sx: number, sy: number, x0: number, y0: number, color: string) => {
      ctx.fillStyle = color;
      const rr = clamp(r, 1, 8);
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.beginPath();
        ctx.arc(x0 + col * sx, y0 + row * sy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = () => {
      clearScene(ctx, W, H);
      const m = stateRef.current.metric;

      if (m === 0) {
        drawBodies();
      } else if (m === 1) {
        drawInstitutions();
      } else if (m === 2) {
        drawDots(527, 48, 2.4, 17, 15, 132, 80, OK);
      } else if (m === 3) {
        drawDots(160, 20, 5.5, 44, 18, 100, 90, EMPH);
      } else {
        drawDots(100, 20, 7, 44, 28, 100, 100, EMPH);
      }

      drawSceneLabel(ctx, METRICS[m].label, 40, 34, PAINT);
      drawSceneLabel(ctx, METRICS[m].scale, 800, 34, MUTED);

      drawLegend(
        ctx,
        [
          { color: OK, text: '逐一计数' },
          { color: EMPH, text: '按比例' },
        ],
        400,
        34
      );
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (i: number) => {
    stateRef.current.metric = i;
    setMetric(i);
    setFeedback(METRIC_TEXT[i]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {METRICS.map((item, i) => (
          <button key={item.chip} className={'chip' + (metric === i ? ' selected' : '')} onClick={() => choose(i)}>
            {item.chip}
          </button>
        ))}
      </div>
      <div className={'feedback ' + (metric === 4 ? 'good' : '')}>{feedback}</div>
    </div>
  );
};

export default M31;
