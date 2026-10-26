import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawSceneLabel,
  drawLegend,
  OK,
  EMPH,
  GUIDE,
  LINE,
  INK,
} from './billiardsKit';
import type { WidgetProps } from './registry';

type Metric = 'score' | 'days';

interface Row {
  p: string;
  days: number;
  score: number;
}

// 论文 Table 1 的原始数值：参数 / 单张 RTX 3090 上的 GPU 天 / 归一化分数
const DATA: Row[] = [
  { p: '1M', days: 3.7, score: 16.0 },
  { p: '5M', days: 4.2, score: 49.5 },
  { p: '19M', days: 5.3, score: 57.1 },
  { p: '48M', days: 12, score: 68.0 },
  { p: '317M', days: 33, score: 70.6 },
];

const W = 1080;
const H = 280;
const BASE = 200;
const MAXH = 140;
const BARW = 120;
const GAP = 44;
const STARTX = (W - (DATA.length * BARW + (DATA.length - 1) * GAP)) / 2;

function valuesFor(metric: Metric): number[] {
  return DATA.map((d) => (metric === 'score' ? d.score : d.days));
}

export const M71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ metric: 'score' as Metric, selected: 4, growStart: 0 });

  const [metric, setMetric] = useState<Metric>('score');
  const [selected, setSelected] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    stateRef.current.growStart = performance.now();

    const render = (now: number) => {
      const s = stateRef.current;
      const values = valuesFor(s.metric);
      const maxV = Math.max(...values);
      const bestV = s.metric === 'score' ? Math.max(...values) : Math.min(...values);
      const bestIdx = values.indexOf(bestV);
      const grow = clamp((now - s.growStart) / 700, 0, 1);
      const ge = grow * grow * (3 - 2 * grow);

      clearScene(ctx, W, H);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, BASE);
      ctx.lineTo(W - 40, BASE);
      ctx.stroke();

      for (let i = 0; i < DATA.length; i++) {
        const x = STARTX + i * (BARW + GAP);
        const h = lerp(0, (values[i] / maxV) * MAXH, ge);
        ctx.fillStyle = i === bestIdx ? OK : GUIDE;
        ctx.fillRect(x, BASE - h, BARW, h);
        if (i === s.selected) {
          ctx.strokeStyle = EMPH;
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 2, BASE - h - 2, BARW + 4, h + 4);
        }
      }

      drawSceneLabel(ctx, s.metric === 'score' ? '归一化分数' : '训练成本', 40, 42, INK);
      drawSceneLabel(ctx, s.metric === 'score' ? '越高越好' : '越低越好', 940, 42, OK);
      drawLegend(
        ctx,
        [
          { color: OK, text: '最优' },
          { color: EMPH, text: '选中' },
          { color: GUIDE, text: '其余' },
        ],
        40,
        258
      );
    };

    const tick = (now: number) => {
      render(now);
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

  const chooseMetric = (m: Metric) => {
    if (stateRef.current.metric === m) return;
    stateRef.current.metric = m;
    stateRef.current.growStart = performance.now();
    setMetric(m);
  };

  const chooseScale = (i: number) => {
    stateRef.current.selected = i;
    setSelected(i);
  };

  const values = valuesFor(metric);
  const bestIdx =
    metric === 'score' ? values.indexOf(Math.max(...values)) : values.indexOf(Math.min(...values));
  const worstIdx =
    metric === 'score' ? values.indexOf(Math.min(...values)) : values.indexOf(Math.max(...values));
  const row = DATA[selected];
  const bestRow = DATA[bestIdx];
  const worstRow = DATA[worstIdx];
  const cls = selected === bestIdx ? 'good' : selected === worstIdx ? 'bad' : '';
  const fb =
    metric === 'score'
      ? `归一化分数（越高越好，80 任务数据集）：${row.p} 参数得到 ${row.score.toFixed(1)} 分；同表最高 ${bestRow.score.toFixed(1)} 分（${bestRow.p}），最低 ${worstRow.score.toFixed(1)} 分（${worstRow.p}）。`
      : `训练成本（越低越好，80 任务数据集，单张 RTX 3090）：${row.p} 参数需要 ${row.days} GPU 天；同表最低 ${bestRow.days} GPU 天（${bestRow.p}），最高 ${worstRow.days} GPU 天（${worstRow.p}）。`;

  return (
    <div>
      <div className="chip-row">
        <button className={'chip' + (metric === 'score' ? ' selected' : '')} onClick={() => chooseMetric('score')}>
          归一化分数
        </button>
        <button className={'chip' + (metric === 'days' ? ' selected' : '')} onClick={() => chooseMetric('days')}>
          训练成本
        </button>
      </div>
      <div className="chip-row">
        {DATA.map((d, i) => (
          <button
            key={d.p}
            className={'chip' + (selected === i ? ' selected' : '')}
            onClick={() => chooseScale(i)}
          >
            {d.p}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={'feedback ' + cls}>{fb}</div>
      <table className="paper">
        <caption>Table 1：80 任务数据集，单张 RTX 3090</caption>
        <thead>
          <tr>
            <th>参数</th>
            <th>GPU 天（越低越好）</th>
            <th>归一化分数（越高越好）</th>
          </tr>
        </thead>
        <tbody>
          {DATA.map((d, i) => (
            <tr key={d.p}>
              <td>{i === selected ? <strong>{d.p}</strong> : d.p}</td>
              <td>{i === selected ? <strong>{d.days}</strong> : d.days}</td>
              <td>{i === selected ? <strong>{d.score.toFixed(1)}</strong> : d.score.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default M71;
