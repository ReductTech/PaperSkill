import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, lerp, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 9 章类比动画：攀岩者做安全检查——晃动一颗松动的岩钉（红描边），
// 再把它拧紧，直到绿描边稳固。560×140，3.2 s 自动循环，无控件、画布内无文字。

const W = 560;
const H = 140;
const LOOP = 3200;

const BG = '#f5f8f0';
const ROCK_L = '#b8c9a7';
const ROCK_D = '#76906a';
const BLUE = '#27446e';
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

function mix(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): string {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return `rgb(${r},${g},${b})`;
}

const RED_RGB: [number, number, number] = [196, 63, 82];
const GREEN_RGB: [number, number, number] = [34, 141, 92];

export const Ch9Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      ctx.fillRect(0, 46, W, H - 46);
      ctx.strokeStyle = ROCK_D;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 46);
      ctx.lineTo(W, 46);
      ctx.stroke();
    };

    const drawHold = (x: number, y: number, w: number, h: number): void => {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = ROCK_D;
      roundRect(ctx, x, y, w, h, 4);
      ctx.fill();
      ctx.restore();
    };

    // 三角锚钉 + 顶部圆环；angle 为晃动角，ring 为描边色（松=红，紧=绿）
    const drawPiton = (angle: number, ring: string): void => {
      ctx.save();
      ctx.translate(352, 112); // 钉尖位置
      ctx.rotate(angle);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-16, -34);
      ctx.lineTo(14, -30);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = ring;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-1, -32, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const render = (now: number): void => {
      const t = (now % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      drawWall();
      drawHold(90, 100, 26, 12);
      drawHold(150, 64, 22, 11);
      drawHold(432, 90, 26, 12);
      drawHold(486, 58, 20, 10);

      // 状态机：接近 → 晃动（松，红）→ 拧紧（红转绿）→ 稳固（绿）
      const gripX = 336;
      const gripY = 82;
      let wob = 0;
      let ring = RED;
      let handX = 252;
      let handY = 98;

      if (t < 0.28) {
        // 接近：手从休息位移向岩钉
        const e = clamp(t / 0.28, 0, 1);
        const ease = 1 - Math.pow(1 - e, 3);
        handX = lerp(252, gripX, ease);
        handY = lerp(98, gripY, ease);
      } else if (t < 0.55) {
        // 晃动：松动岩钉左右摇，红描边
        const k = t - 0.28;
        wob = k < 0.1 ? (k / 0.1) * 0.22 : 0.22;
        const shake = Math.sin(t * Math.PI * 20) * wob;
        handX = gripX + shake * 24;
        handY = gripY;
      } else if (t < 0.78) {
        // 拧紧：晃动衰减，描边红转绿
        const k = (t - 0.55) / 0.23;
        wob = 0.22 * (1 - k);
        const shake = Math.sin(t * Math.PI * 20) * wob;
        handX = gripX + shake * 24;
        handY = gripY;
        ring = mix(RED_RGB, GREEN_RGB, clamp(k * 1.15, 0, 1));
      } else {
        // 稳固：绿描边，手搭在岩钉上
        handX = gripX;
        handY = gripY;
        ring = GREEN;
      }

      drawPiton(Math.sin(t * Math.PI * 20) * wob, ring);

      // 攀岩者：头 + 躯干 + 检查岩钉的手臂（圆头四肢线风格）
      ctx.strokeStyle = BLUE;
      ctx.fillStyle = BLUE;
      ctx.lineCap = 'round';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(238, 76);
      ctx.lineTo(238, 112);
      ctx.stroke();
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(238, 80);
      ctx.lineTo(handX, handY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(238, 58, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(handX, handY, 9, 0, Math.PI * 2);
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

export default Ch9Ana;
