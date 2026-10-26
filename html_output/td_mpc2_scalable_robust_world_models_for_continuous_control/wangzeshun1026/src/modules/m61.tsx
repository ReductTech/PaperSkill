import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  GUIDE,
  BAD,
  EMPH,
  INK,
  LINE,
  clearScene,
  drawBall,
  drawShot,
  drawSceneLabel,
  drawLegend,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 6.1 直接回归 vs log 空间分类。
// 两个面板共享同一组目标值：左边在原始空间做线性拟合，右边在对数桶上做软目标交叉熵。
const W = 1080;
const H = 280;
const N_POINTS = 8;
const LOG_MIN = Math.log10(0.1);
const LOG_MAX = Math.log10(3000);
const BUCKETS = 16;

interface FeedbackState {
  text: string;
  cls: string;
}

function scaleFromSlider(v: number): number {
  return Math.pow(10, (v / 100) * 3);
}

function formatScale(scale: number): string {
  return scale < 10 ? scale.toFixed(1) : String(Math.round(scale));
}

function feedbackFor(scale: number): FeedbackState {
  if (scale < 3) {
    return {
      text: '量级接近时，直接回归也能拟合得不错；跨量级的差异要等奖励量级拉开后才显现。',
      cls: '',
    };
  }
  if (scale <= 50) {
    return {
      text: '量级差拉开后，平方误差开始被大奖励主导，小奖励的相对误差被放大；右侧在对数桶上做交叉熵，仍保持相对精度。',
      cls: '',
    };
  }
  return {
    text: '量级差已接近或超过两个数量级：直接回归为了压低大奖励的绝对误差，把小奖励压到接近 0 甚至为负；log 空间分类按桶预测，跨量级仍稳定。论文对奖励与价值预测都采用这一做法。',
    cls: 'good',
  };
}

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const scaleRef = useRef({ scale: 1000 });
  const [slider, setSlider] = useState(100);
  const [feedback, setFeedback] = useState<FeedbackState>(feedbackFor(1000));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const yTop = 66;
    const yBot = 206;
    const leftX0 = 50;
    const leftX1 = 520;
    const rightX0 = 570;
    const rightX1 = 1040;

    const yOf = (v: number) => {
      const clipped = clamp(v, 0.1, 3000);
      const lv = Math.log10(clipped);
      return lerp(yBot, yTop, (lv - LOG_MIN) / (LOG_MAX - LOG_MIN));
    };

    const render = () => {
      const scale = scaleRef.current.scale;
      clearScene(ctx, W, H);

      const targets: number[] = [];
      for (let i = 0; i < N_POINTS; i++) targets.push(Math.pow(scale, i / (N_POINTS - 1)));

      const panel = (x0: number, x1: number) => {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, yTop);
        ctx.lineTo(x0, yBot);
        ctx.lineTo(x1, yBot);
        ctx.stroke();

        ctx.globalAlpha = 0.28;
        for (let d = 0; d <= 4; d++) {
          const y = yOf(Math.pow(10, d - 1));
          ctx.strokeStyle = LINE;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x0, y);
          ctx.lineTo(x1, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };

      const xs = (x0: number, x1: number): number[] => {
        const out: number[] = [];
        for (let i = 0; i < N_POINTS; i++) {
          out.push(x0 + 18 + (i / (N_POINTS - 1)) * (x1 - x0 - 36));
        }
        return out;
      };

      // 左：原始空间的线性拟合
      panel(leftX0, leftX1);
      const lx = xs(leftX0, leftX1);
      let meanY = 0;
      for (const t of targets) meanY += t;
      meanY /= N_POINTS;
      let num = 0;
      let den = 0;
      for (let i = 0; i < N_POINTS; i++) {
        num += (i - (N_POINTS - 1) / 2) * (targets[i] - meanY);
        den += (i - (N_POINTS - 1) / 2) * (i - (N_POINTS - 1) / 2);
      }
      const slope = den === 0 ? 0 : num / den;
      const intercept = meanY - slope * ((N_POINTS - 1) / 2);
      const rawPred: number[] = [];
      for (let i = 0; i < N_POINTS; i++) rawPred.push(intercept + slope * i);

      for (let i = 0; i < N_POINTS - 1; i++) {
        const color = rawPred[i] <= 0.1 || rawPred[i + 1] <= 0.1 ? BAD : GUIDE;
        drawShot(ctx, [[lx[i], yOf(rawPred[i])], [lx[i + 1], yOf(rawPred[i + 1])]], color, 2.5);
      }
      for (let i = 0; i < N_POINTS; i++) {
        if (rawPred[i] <= 0.1) drawBall(ctx, lx[i], yBot, 2.5, BAD, false);
      }
      for (let i = 0; i < N_POINTS; i++) drawBall(ctx, lx[i], yOf(targets[i]), 3.5, INK, false);

      // 右：对数桶上的软目标与期望
      panel(rightX0, rightX1);
      const rx = xs(rightX0, rightX1);
      const bw = (LOG_MAX - LOG_MIN) / BUCKETS;
      const sigma = bw * 0.55;
      const centers: number[] = [];
      for (let k = 0; k < BUCKETS; k++) centers.push(LOG_MIN + (k + 0.5) * bw);

      ctx.globalAlpha = 0.2;
      for (let k = 0; k <= BUCKETS; k++) {
        const y = yOf(Math.pow(10, LOG_MIN + k * bw));
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rightX0, y);
        ctx.lineTo(rightX1, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const logPred: number[] = [];
      for (let i = 0; i < N_POINTS; i++) {
        const lt = Math.log10(targets[i]);
        const weights: number[] = [];
        let sum = 0;
        for (let k = 0; k < BUCKETS; k++) {
          const d = (centers[k] - lt) / sigma;
          const w = Math.exp(-0.5 * d * d);
          weights.push(w);
          sum += w;
        }
        let expected = 0;
        for (let k = 0; k < BUCKETS; k++) expected += (weights[k] / sum) * centers[k];
        logPred.push(Math.pow(10, expected));

        const haloTop = yOf(Math.pow(10, lt + sigma * 1.2));
        const haloBot = yOf(Math.pow(10, lt - sigma * 1.2));
        ctx.globalAlpha = 0.28;
        drawShot(ctx, [[rx[i], haloTop], [rx[i], haloBot]], EMPH, 5);
        ctx.globalAlpha = 1;
      }

      drawShot(ctx, logPred.map((v, i) => [rx[i], yOf(v)]), GUIDE, 2.5);
      for (let i = 0; i < N_POINTS; i++) drawBall(ctx, rx[i], yOf(targets[i]), 3.5, INK, false);

      ctx.globalAlpha = 1;
      drawSceneLabel(ctx, '直接回归', leftX0, 38, INK);
      drawSceneLabel(ctx, 'log 分类', rightX0, 38, INK);
      drawLegend(
        ctx,
        [
          { color: INK, text: '真实值' },
          { color: GUIDE, text: '预测值' },
          { color: EMPH, text: '软目标' },
        ],
        50,
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
    const v = clamp(Number(e.target.value), 0, 100);
    const scale = scaleFromSlider(v);
    scaleRef.current.scale = scale;
    setSlider(v);
    setFeedback(feedbackFor(scale));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          奖励量级跨度 <span className="val">×{formatScale(scaleFromSlider(slider))}</span>
        </label>
        <input type="range" min={0} max={100} step={1} value={slider} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M61;
