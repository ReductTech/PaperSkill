import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比：攀岩者把岩钉敲进绿色圆环标记的关键岩点。敲入前岩点带红描边晃动，敲入后变实心绿。
// 3 s 循环；无控件、无重播提示、canvas 内不写字。
const W = 560;
const H = 140;
const LOOP_S = 3;

const COL = {
  bg: '#f5f8f0',
  rockLight: '#b8c9a7',
  rockDark: '#76906a',
  rope: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  muted: '#68778f',
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHold(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  fill: string
) {
  ctx.fillStyle = fill;
  roundedRect(ctx, x - s / 2, y - s / 2, s, s, 4);
  ctx.fill();
}

function drawClimber(
  ctx: CanvasRenderingContext2D,
  footX: number,
  footY: number,
  color: string,
  hand: { x: number; y: number }
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const hipY = footY - 52;
  const shY = hipY - 30;
  const shX = footX + 6;
  ctx.beginPath(); // legs
  ctx.moveTo(footX - 10, footY);
  ctx.lineTo(footX, hipY);
  ctx.lineTo(footX + 10, footY);
  ctx.stroke();
  ctx.beginPath(); // torso
  ctx.moveTo(footX, hipY);
  ctx.lineTo(shX, shY);
  ctx.stroke();
  ctx.beginPath(); // reaching arm
  ctx.moveTo(shX, shY);
  ctx.lineTo(hand.x, hand.y);
  ctx.stroke();
  ctx.beginPath(); // head
  ctx.arc(shX + 4, shY - 13, 8, 0, Math.PI * 2);
  ctx.fill();
}

export const Ch3Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const startTs = performance.now();

    const render = (tSec: number) => {
      const t = tSec % LOOP_S;
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, W, H);
      // rock band
      ctx.fillStyle = COL.rockLight;
      ctx.fillRect(0, 48, W, H - 48);
      ctx.strokeStyle = COL.rockDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(W, 48);
      ctx.stroke();

      const holdX = 330;
      const holdY = 92;
      const holdS = 30;
      const sinking = t >= 1.4 && t < 1.9;
      const drivenIn = t >= 1.9;

      // 锤击曲线：0.15–1.4 s 内三下
      let strike = 0;
      if (t >= 0.15 && t < 1.4) {
        const tau = (t - 0.15) % 0.42;
        strike = tau < 0.16 ? tau / 0.16 : clamp(1 - (tau - 0.16) / 0.1, 0, 1);
      }
      // 敲入前岩点晃动（红描边）
      const wobble = drivenIn
        ? 0
        : Math.sin(t * 32) * 3.5 * (sinking ? 0.35 : strike > 0 ? strike : 0.22);
      const hx = holdX + wobble;
      const hy = holdY + (sinking ? Math.sin(t * 45) * 1.2 : 0);

      // 绿色圆环（关键岩点标记）
      ctx.strokeStyle = COL.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx, hy, holdS / 2 + 7, 0, Math.PI * 2);
      ctx.stroke();

      // 岩点：敲入前浅色+红描边，敲入后实心绿
      if (drivenIn) {
        drawHold(ctx, hx, hy, holdS, COL.green);
      } else {
        drawHold(ctx, hx, hy, holdS, COL.rockLight);
        ctx.strokeStyle = COL.red;
        ctx.lineWidth = 2.5;
        roundedRect(ctx, hx - holdS / 2, hy - holdS / 2, holdS, holdS, 4);
        ctx.stroke();
      }

      // 岩钉随敲击逐渐沉入
      const pitonOff = lerp(-24, 0, clamp(t / 1.9, 0, 1));
      const pitonX = hx;
      const pitonY = hy - holdS / 2 - 2 + pitonOff;
      ctx.fillStyle = COL.ink;
      ctx.beginPath();
      ctx.moveTo(pitonX, pitonY - 6);
      ctx.lineTo(pitonX - 5, pitonY + 6);
      ctx.lineTo(pitonX + 5, pitonY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = drivenIn ? COL.green : COL.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pitonX, pitonY - 2, 9, 0, Math.PI * 2);
      ctx.stroke();

      // 攀岩者挥锤；敲入后手停在岩点上
      const hand = {
        x: hx - 6,
        y: hy - 4 - (drivenIn ? 0 : (1 - strike) * 16),
      };
      drawClimber(ctx, 236, 118, drivenIn ? COL.green : COL.blue, hand);

      // 锤头
      ctx.fillStyle = COL.ink;
      roundedRect(ctx, hand.x - 3, hand.y - 4, 14, 8, 2);
      ctx.fill();
    };

    let raf = 0;
    const tick = (now: number) => {
      render((now - startTs) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch3Ana;
