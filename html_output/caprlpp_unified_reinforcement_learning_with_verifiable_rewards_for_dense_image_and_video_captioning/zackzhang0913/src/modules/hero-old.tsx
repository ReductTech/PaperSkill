import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  gameField,
  drawPictureCard,
  drawDescriber,
  drawScoreCell,
  drawLegend,
  drawBar,
} from '../canvas-scene';

const W = 520;
const H = 280;

// Hero 左侧：旧办法的两条路，上下两格。
//   上格 与参考答案比重合度（ROUGE / BLEU 这类指标，page 1 §1）
//   下格 判別者主观打分（奖励模型 / LLM 当裁判，page 1 §1 与 page 5 §3.1）
// 两格右下是同一块「盲学生答对格」，始终为空：两条路都不衡量「讲清了没有」。
const JUDGE = '#d97706';

function scrollBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.frame;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.muted;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 7, y + 7 + i * 7, w * (i === 0 ? 0.74 : i === 1 ? 0.58 : 0.4), 3);
  }
  ctx.restore();
}

function refBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.frame;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.muted;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 8, y + 9 + i * 10, w * (i === 0 ? 0.78 : i === 1 ? 0.6 : 0.42), 3);
  }
  ctx.restore();
}

/** 判别者剪影：头、脖子、肩、躯干四段分离，避免头部与身体重叠。
 *  s 为整体高度；头部半径 s*0.2，顶部与整体顶点留 s*0.04 的空隙。 */
function judgeMark(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const headR = s * 0.2;
  const headCy = y - s + headR;
  const shoulderY = y - s * 0.5;
  const neckHalf = s * 0.09;
  const bodyHalf = s * 0.3;
  ctx.save();
  ctx.fillStyle = JUDGE;
  // 躯干（下宽上窄，到肩线为止）
  ctx.beginPath();
  ctx.moveTo(x - bodyHalf, y);
  ctx.lineTo(x + bodyHalf, y);
  ctx.lineTo(x + bodyHalf * 0.72, shoulderY);
  ctx.lineTo(x - bodyHalf * 0.72, shoulderY);
  ctx.closePath();
  ctx.fill();
  // 脖子：连接肩线与头部下缘
  const neckTop = headCy + headR;
  if (neckTop < shoulderY) {
    ctx.beginPath();
    ctx.rect(x - neckHalf, neckTop, neckHalf * 2, shoulderY - neckTop + 1);
    ctx.fill();
  }
  // 头：浮在肩上，不侵入躯干
  ctx.beginPath();
  ctx.arc(x, headCy, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const HeroOld: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (t: number) => {
      const phase = ((t - t0) / 3600) % 1;
      const cycle = (phase * 2.2) % 1;
      const ink = 0.35 + 0.65 * Math.min(1, cycle / 0.4);
      gameField(ctx, W, H);

      // 分隔两格的淡线
      ctx.save();
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 140);
      ctx.lineTo(500, 140);
      ctx.stroke();
      ctx.restore();

      // ---------- 上格：与参考答案比重合度 ----------
      drawPictureCard(ctx, 22, 16, 60, 'clean');
      drawDescriber(ctx, 96, 122, 38, C.red);
      scrollBox(ctx, 118, 52, 74, 44, ink);
      drawBar(ctx, 210, 62, 130, 14, Math.min(1, cycle / 0.7), C.red);
      drawBar(ctx, 210, 84, 130, 14, 0, C.axis);
      refBox(ctx, 356, 46, 108, 54);
      drawScoreCell(ctx, 452, 108, 13, false, C.green);
      drawScoreCell(ctx, 468, 108, 13, false, C.green);
      drawScoreCell(ctx, 484, 108, 13, false, C.green);

      // ---------- 下格：判別者给分 ----------
      drawPictureCard(ctx, 22, 166, 60, 'clean');
      drawDescriber(ctx, 96, 262, 38, C.red);
      scrollBox(ctx, 118, 202, 74, 44, ink);
      judgeMark(ctx, 232, 252, 40);
      const bias = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
      drawBar(ctx, 268, 212, 120, 14, bias, JUDGE);
      drawBar(ctx, 268, 234, 120, 14, 0, C.axis);
      drawScoreCell(ctx, 452, 246, 13, false, C.green);
      drawScoreCell(ctx, 468, 246, 13, false, C.green);
      drawScoreCell(ctx, 484, 246, 13, false, C.green);

      drawLegend(ctx, [{ label: '盲学生答对格', color: C.green }], 300, 268);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-hero-old" ref={ref} width={W} height={H} />;
};

export default HeroOld;
