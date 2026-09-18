import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 铺粉：手冲壶把咖啡粉倒进滤杯，粉面从一小堆落平成一层；粉层里的空隙随节奏呼吸。
const W = 560;
const H = 140;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const SUPPORT = '#92400e';
const BLUE = '#27446e';
const RED = '#c43f52';
const BEAN = '#6f4a2f';
const PAPER = '#efe7d8';

/** 手冲壶：椭圆壶身 + 壶盖 + 细长壶嘴 + 弧形把手。tilt 为顺时针弧度，返回壶嘴尖端坐标。 */
function drawKettle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  tilt: number,
  color: string
): { tipX: number; tipY: number } {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.66, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, -r * 0.62, r * 0.3, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -r * 0.28);
  ctx.quadraticCurveTo(-r * 1.5, -r * 0.62, -r * 2.05, -r * 1.0);
  ctx.stroke();

  ctx.lineWidth = Math.max(2, r * 0.15);
  ctx.beginPath();
  ctx.arc(r * 0.88, -r * 0.04, r * 0.52, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.stroke();

  ctx.restore();

  const lx = -r * 2.05;
  const ly = -r * 1.0;
  return {
    tipX: cx + lx * Math.cos(tilt) - ly * Math.sin(tilt),
    tipY: cy + lx * Math.sin(tilt) + ly * Math.cos(tilt),
  };
}

/** 滤杯（外壁 + 滤纸内衬）与下方分享壶。 */
function drawDripper(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  botY: number,
  topW: number,
  botW: number
): void {
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.moveTo(cx - topW * 0.44, topY + 3);
  ctx.lineTo(cx + topW * 0.44, topY + 3);
  ctx.lineTo(cx + botW * 0.42, botY - 2);
  ctx.lineTo(cx - botW * 0.42, botY - 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = SUPPORT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, topY);
  ctx.lineTo(cx + topW / 2, topY);
  ctx.lineTo(cx + botW / 2, botY);
  ctx.lineTo(cx - botW / 2, botY);
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - botW * 0.66, botY + 6);
  ctx.lineTo(cx + botW * 0.66, botY + 6);
  ctx.lineTo(cx + botW * 0.54, botY + 28);
  ctx.lineTo(cx - botW * 0.54, botY + 28);
  ctx.closePath();
  ctx.stroke();
}

/** 粉层：顶面由 flatFn 决定高度，并撒上颗粒纹理。 */
function drawBed(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  halfW: number,
  flatFn: (u: number) => number
): void {
  if (halfW < 3) return;
  ctx.fillStyle = BEAN;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, baseY);
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    ctx.lineTo(cx - halfW + u * halfW * 2, baseY - flatFn(u));
  }
  ctx.lineTo(cx + halfW, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  for (let i = 0; i < 22; i++) {
    const u = ((i * 37) % 100) / 100;
    const d = ((i * 61) % 9) / 9;
    const gx = cx - halfW + u * halfW * 2;
    const gy = baseY - flatFn(u) * (0.2 + d * 0.5);
    ctx.fillRect(gx, gy, 1.5, 1.5);
  }
}

export const PotsAna: React.FC<WidgetProps> = () => {
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

    const DRIP_CX = 268;
    const TOP_Y = 54;
    const BOT_Y = 100;
    const KETTLE = { cx: 386, cy: 44, r: 19, tilt: -0.55 };

    const render = (time: number) => {
      const t = (time % 3400) / 3400;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 台面
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 130, W, 10);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 130);
      ctx.lineTo(W, 130);
      ctx.stroke();

      drawDripper(ctx, DRIP_CX, TOP_Y, BOT_Y, 112, 64);

      // 粉层：前 45% 的时间从一小堆铺平成一层
      const spread = Math.min(1, t / 0.45);
      const halfW = 10 + spread * 36;
      const bedTop = (u: number) => {
        const mound = Math.max(0, 1 - Math.abs(u - 0.5) * 2);
        return 16 - spread * 8 * mound + 4;
      };
      drawBed(ctx, DRIP_CX, BOT_Y - 4, halfW, bedTop);

      // 洞：铺开后开始呼吸
      if (spread > 0.5) {
        const pulse = 0.5 + 0.5 * Math.sin((t - 0.5) * Math.PI * 4);
        ctx.fillStyle = RED;
        for (let i = 0; i < 4; i++) {
          const u = 0.18 + i * 0.21;
          const gx = DRIP_CX - halfW + u * halfW * 2;
          const gy = BOT_Y - 4 - bedTop(u) * 0.55;
          const rr = 2.2 + 1.5 * pulse;
          ctx.beginPath();
          ctx.ellipse(gx, gy, rr, rr * 0.78, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 手冲壶 + 落下的粉
      const tip = drawKettle(ctx, KETTLE.cx, KETTLE.cy, KETTLE.r, KETTLE.tilt, BLUE);
      if (spread < 1) {
        ctx.fillStyle = 'rgba(111,74,47,0.9)';
        for (let i = 0; i < 5; i++) {
          const p = ((t * 6 + i * 0.2) % 1);
          const fx = tip.tipX + (DRIP_CX + 8 - tip.tipX) * p;
          const fy = tip.tipY + (BOT_Y - 14 - tip.tipY) * p;
          ctx.beginPath();
          ctx.arc(fx, fy, 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('铺平了也有洞', 20, 24);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-pots-ana" ref={canvasRef} width={W} height={H} />;
};

export default PotsAna;
