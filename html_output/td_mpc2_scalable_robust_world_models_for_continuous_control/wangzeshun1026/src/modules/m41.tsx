import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  GUIDE,
  OK,
  EMPH,
  INK,
  MUTED,
  LINE,
  clearScene,
  drawTable,
  drawBall,
  drawShot,
  drawPocket,
  drawSceneLabel,
  drawLegend,
  seeded,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 4.1 采样 512，留 64。
// 滑块改变 MPPI 的种群大小：左表画候选轨迹，右图画按回报排序的样本与精英阈值。
const W = 1080;
const H = 280;
const MAX_N = 512;
const ELITE = 64;

interface Sample {
  pts: number[][];
  score: number;
}

interface FeedbackState {
  text: string;
  cls: string;
}

function feedbackFor(n: number): FeedbackState {
  if (n >= MAX_N) {
    return {
      text: '论文设置：种群 512、精英 64、规划时域 H=3、每步迭代 6 次。512 条候选里只有回报最高的 64 条参与高斯分布的加权更新。',
      cls: 'good',
    };
  }
  if (n <= ELITE) {
    return {
      text: '采样数正好等于精英数：64 条全部入选，等于没有筛选，MPPI 的加权更新也就失去了意义。',
      cls: 'bad',
    };
  }
  return {
    text: `当前只采样 ${n} 条，候选轨迹明显更稀；精英仍取其中回报最高的 64 条，筛选比例从 1/8 变大。`,
    cls: '',
  };
}

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ n: MAX_N });
  const [n, setN] = useState(MAX_N);
  const [feedback, setFeedback] = useState<FeedbackState>(feedbackFor(MAX_N));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const rnd = seeded(512064);
    const sx = 82;
    const sy = 134;
    const px = 646;
    const py = 134;
    const samples: Sample[] = [];
    for (let i = 0; i < MAX_N; i++) {
      const endX = px - 2 + (rnd() - 0.5) * 30;
      const endY = py + (rnd() - 0.5) * 118;
      const bend = (rnd() - 0.5) * 70;
      const pts: number[][] = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        pts.push([
          lerp(sx, endX, t),
          lerp(sy, endY, t) + Math.sin(t * Math.PI) * bend,
        ]);
      }
      const score = -Math.hypot(endX - px, endY - py) - Math.abs(bend) * 0.25 + (rnd() - 0.5) * 10;
      samples.push({ pts, score });
    }
    samples.sort((a, b) => b.score - a.score);

    let minScore = samples[0].score;
    let maxScore = samples[0].score;
    for (const s of samples) {
      minScore = Math.min(minScore, s.score);
      maxScore = Math.max(maxScore, s.score);
    }
    const span = Math.max(0.0001, maxScore - minScore);
    const eliteThreshold = samples[ELITE - 1].score;

    const chartX0 = 720;
    const chartX1 = 1040;
    const chartTop = 66;
    const chartBot = 210;

    const render = () => {
      const count = stateRef.current.n;
      clearScene(ctx, W, H);
      drawTable(ctx, 40, 58, 620, 150);
      drawPocket(ctx, px, py, 8);

      // 候选轨迹：灰线
      ctx.globalAlpha = 0.1;
      for (let i = ELITE; i < count; i++) drawShot(ctx, samples[i].pts, MUTED, 1);
      // 精英轨迹
      ctx.globalAlpha = 0.42;
      for (let i = 0; i < Math.min(ELITE, count); i++) drawShot(ctx, samples[i].pts, OK, 1.4);
      // 回报最高的一条
      ctx.globalAlpha = 1;
      drawShot(ctx, samples[0].pts, EMPH, 2.6);
      drawBall(ctx, sx, sy, 8, '#f3f0e4', true);

      // 右图：按回报排序的样本
      ctx.globalAlpha = 1;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(chartX0, chartTop);
      ctx.lineTo(chartX0, chartBot);
      ctx.lineTo(chartX1, chartBot);
      ctx.stroke();

      const eliteW = (ELITE / count) * (chartX1 - chartX0);
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = OK;
      ctx.fillRect(chartX0, chartTop, eliteW, chartBot - chartTop);

      for (let i = 0; i < count; i++) {
        const x = chartX0 + ((i + 0.5) / count) * (chartX1 - chartX0);
        const y = chartBot - ((samples[i].score - minScore) / span) * (chartBot - chartTop);
        ctx.globalAlpha = i < ELITE ? 0.9 : 0.45;
        ctx.fillStyle = i < ELITE ? OK : MUTED;
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }

      const yThresh = chartBot - ((eliteThreshold - minScore) / span) * (chartBot - chartTop);
      ctx.globalAlpha = 0.55;
      drawShot(ctx, [[chartX0, yThresh], [chartX0 + eliteW, yThresh]], GUIDE, 1.5, [4, 4]);

      const bx = chartX0 + Math.max(4, (0.5 / count) * (chartX1 - chartX0));
      const by = chartBot - ((samples[0].score - minScore) / span) * (chartBot - chartTop);
      ctx.globalAlpha = 1;
      drawBall(ctx, bx, by, 3.5, EMPH, false);

      ctx.globalAlpha = 1;
      drawSceneLabel(ctx, '候选轨迹', 40, 46, INK);
      drawSceneLabel(ctx, '精英 64', chartX0, 46, INK);
      drawLegend(
        ctx,
        [
          { color: MUTED, text: '候选' },
          { color: OK, text: '精英' },
          { color: EMPH, text: '最优' },
        ],
        40,
        262
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clamp(Number(e.target.value), ELITE, MAX_N);
    stateRef.current.n = value;
    setN(value);
    setFeedback(feedbackFor(value));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          采样动作序列 <span className="val">{n}</span>
        </label>
        <input type="range" min={ELITE} max={MAX_N} step={32} value={n} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M41;
