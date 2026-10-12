import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 10 章类比动画：两位攀岩者同爬一面墙（左右各一、同一时间基准）。
// 左边在关键点滑落（红），右边借锚点通过关键点登顶（顶部升起绿旗）。
// 560×140，3.6 s 自动循环，无控件、画布内无文字。

const W = 560;
const H = 140;
const LOOP = 3600;

const BG = '#f5f8f0';
const ROCK_L = '#b8c9a7';
const ROCK_D = '#76906a';
const ROPE = '#92400e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const INK = '#21324a';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const easeInOut = (k: number): number =>
  k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

export const Ch10Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawWall = (): void => {
      ctx.fillStyle = ROCK_L;
      ctx.fillRect(0, 40, W, H - 40);
      ctx.strokeStyle = ROCK_D;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(W, 40);
      ctx.stroke();
    };

    // 岩点（圆角矩形）；ring = true 时带绿环（关键岩点）
    const drawHold = (x: number, y: number, w: number, h: number, ring = false): void => {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = ROCK_D;
      roundRect(ctx, x - w / 2, y - h / 2, w, h, 4);
      ctx.fill();
      ctx.restore();
      if (ring) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2 + 6, h / 2 + 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    // 锚钉（关键点上方）
    const drawPiton = (): void => {
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(292, 66);
      ctx.lineTo(276, 34);
      ctx.lineTo(310, 38);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(293, 38, 8, 0, Math.PI * 2);
      ctx.stroke();
    };

    // 圆头四肢线攀岩者；gripY 为手抓高度，slump 为脱落后的下垂姿势
    const climber = (
      x: number,
      gripY: number,
      color: string,
      sway: number,
      slump: boolean
    ): void => {
      const hx = x + sway;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(hx, gripY - 34, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(hx, gripY - 26);
      ctx.lineTo(hx, gripY - 2);
      ctx.stroke();
      ctx.lineWidth = 5;
      if (slump) {
        ctx.beginPath();
        ctx.moveTo(hx, gripY - 22);
        ctx.lineTo(hx + 12, gripY - 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx, gripY - 22);
        ctx.lineTo(hx - 12, gripY - 6);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(hx, gripY - 22);
        ctx.lineTo(hx + 13, gripY - 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx, gripY - 22);
        ctx.lineTo(hx - 9, gripY - 6);
        ctx.stroke();
      }
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(hx, gripY - 2);
      ctx.lineTo(hx - 8, gripY + 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx, gripY - 2);
      ctx.lineTo(hx + 8, gripY + 12);
      ctx.stroke();
    };

    const render = (now: number): void => {
      const t = (now % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      drawWall();
      // 路线岩点：底部到关键点再到顶
      drawHold(284, 108, 22, 11);
      drawHold(272, 94, 20, 10);
      drawHold(286, 84, 20, 10);
      drawHold(272, 74, 26, 12, true);
      drawHold(286, 56, 20, 10);
      drawHold(272, 44, 20, 10);
      drawPiton();

      // 左攀岩者：0–0.5 爬向关键点，0.5–0.62 抓空抖动，0.62–0.85 滑落
      let lY = 118;
      let lJit = 0;
      let lFall = false;
      if (t < 0.5) {
        lY = lerp(118, 74, easeInOut(t / 0.5));
      } else if (t < 0.62) {
        lY = 74;
        lJit = (t - 0.5) / 0.12;
      } else if (t < 0.85) {
        const k = (t - 0.62) / 0.23;
        lY = 74 + 46 * k * k;
        lFall = true;
      } else {
        lY = 120;
      }

      // 右攀岩者：0–0.5 爬到关键点，0.5–0.8 借锚点继续登顶
      let rY = 118;
      if (t < 0.5) {
        rY = lerp(118, 74, easeInOut(t / 0.5));
      } else if (t < 0.8) {
        rY = lerp(74, 36, easeInOut((t - 0.5) / 0.3));
      } else {
        rY = 36;
      }

      // 左攀岩者滑落残影
      if (lFall) {
        ctx.globalAlpha = 0.18;
        climber(238, lY - 16, RED, 0, true);
        ctx.globalAlpha = 0.32;
        climber(238, lY - 7, RED, 0, true);
        ctx.globalAlpha = 1;
      }
      climber(238, lY, RED, lJit * Math.sin(t * Math.PI * 24) * 4, lFall);

      // 保护绳：从锚钉环连到右攀岩者（通过关键点期间紧绷）
      if (t >= 0.5 && t < 0.85) {
        ctx.strokeStyle = ROPE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(293, 40);
        ctx.quadraticCurveTo(330, 40, 322, rY - 4);
        ctx.stroke();
      }
      climber(322, rY, GREEN, Math.sin(t * Math.PI * 4) * 1.2, false);

      // 顶部绿旗升起
      const flagK = clamp((t - 0.78) / 0.14, 0, 1);
      const flagE = 1 - Math.pow(1 - flagK, 3);
      const flagY = lerp(46, 18, flagE);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(356, 44);
      ctx.lineTo(356, 16);
      ctx.stroke();
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.moveTo(356, flagY);
      ctx.lineTo(356, flagY + 12);
      ctx.lineTo(378, flagY + 6);
      ctx.closePath();
      ctx.fill();
    };

    const tick = (): void => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch10Ana;
