import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

const COLORS = {
  bg: '#f5f8f0',
  ground: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
};

function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 9, y);
  ctx.lineTo(x + 9, y);
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x, y + 9);
  ctx.stroke();
  ctx.restore();
}

function bike(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  pedal = 0,
) {
  wheel(ctx, x - 24, y, color);
  wheel(ctx, x + 24, y, color);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 24, y);
  ctx.lineTo(x - 5, y - 18);
  ctx.lineTo(x + 17, y - 17);
  ctx.lineTo(x + 24, y);
  ctx.moveTo(x - 5, y - 18);
  ctx.lineTo(x + 3, y);
  ctx.lineTo(x + 24, y);
  ctx.moveTo(x + 3, y);
  ctx.lineTo(x - 24, y);
  ctx.stroke();

  const crankX = x + 3;
  const crankY = y - 1;
  ctx.translate(crankX, crankY);
  ctx.rotate(pedal);
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(8, 0);
  ctx.stroke();
  ctx.restore();
}

function rider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  pedal = 0,
  lean = 0,
) {
  bike(ctx, x, y, color, pedal);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 0, y - 4);
  ctx.lineTo(x + 7 + lean, y - 31);
  ctx.lineTo(x + 18 + lean, y - 25);
  ctx.lineTo(x + 21, y - 17);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 7 + lean, y - 37, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 18);
  ctx.lineTo(x + 20, y - 11);
  ctx.stroke();
  ctx.restore();
}

function load(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  count = 1,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i += 1) {
    const ww = size * (1 - i * 0.12);
    const hh = size * 0.55;
    ctx.fillRect(x - ww / 2, y - i * (hh + 3), ww, hh);
    ctx.strokeRect(x - ww / 2, y - i * (hh + 3), ww, hh);
  }
  ctx.restore();
}

function target(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 34);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x + 22, y - 28);
  ctx.lineTo(x, y - 21);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function road(
  ctx: CanvasRenderingContext2D,
  y: number,
  color = COLORS.ground,
  routeColor = COLORS.route,
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, y, W, H - y);
  ctx.strokeStyle = routeColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, y + 11);
  ctx.bezierCurveTo(160, y - 18, 350, y + 34, 540, y - 2);
  ctx.stroke();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, y + 11);
  ctx.bezierCurveTo(160, y - 18, 350, y + 34, 540, y - 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawMap(ctx: CanvasRenderingContext2D, x: number, y: number, hit: number) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, 76, 52);
  ctx.strokeRect(x, y, 76, 52);
  ctx.strokeStyle = COLORS.route;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 40);
  ctx.lineTo(x + 25, y + 24);
  ctx.lineTo(x + 42, y + 31);
  ctx.lineTo(x + 66, y + 12);
  ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = i < hit ? COLORS.green : COLORS.red;
    ctx.beginPath();
    ctx.arc(x + 12 + i * 10, y + 45, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const SqdAnalogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (time: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      road(ctx, 105);

      const phase = (time % 3000) / 3000;
      const x = 70 + phase * 390;
      const pedal = phase * Math.PI * 8;

      if (chapterId === 'hero' && moduleId === 'old') {
        rider(ctx, x, 94, COLORS.red, pedal, 0);
        load(ctx, x - 5, 60, 28, COLORS.red, 3);
        target(ctx, 515, 103, COLORS.dark);
        return;
      }

      if (chapterId === 'hero' && moduleId === 'new') {
        rider(ctx, x, 94, COLORS.blue, pedal, 1);
        load(ctx, x - 5, 74, 20, COLORS.green, 1);
        target(ctx, 515, 103, COLORS.green);
        return;
      }

      switch (chapterId) {
        case 'chap-1': {
          rider(ctx, x, 94, COLORS.red, pedal, 0);
          load(ctx, x - 5, 72, 20 + phase * 26, COLORS.red, 1 + Math.floor(phase * 3));
          target(ctx, 525, 103, COLORS.green);
          break;
        }
        case 'chap-2': {
          rider(ctx, 170, 94, COLORS.blue, pedal, 0);
          for (let i = 0; i < 4; i += 1) {
            ctx.save();
            ctx.translate(330 + i * 48, 82);
            ctx.rotate(phase * Math.PI * (i + 2));
            ctx.strokeStyle = [COLORS.blue, COLORS.red, COLORS.green, COLORS.orange][i];
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 15 + i, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            for (let tooth = 0; tooth < 10; tooth += 1) {
              const angle = (tooth / 10) * Math.PI * 2;
              ctx.moveTo(Math.cos(angle) * (15 + i), Math.sin(angle) * (15 + i));
              ctx.lineTo(Math.cos(angle) * (19 + i), Math.sin(angle) * (19 + i));
            }
            ctx.stroke();
            ctx.restore();
          }
          break;
        }
        case 'chap-3': {
          ctx.strokeStyle = COLORS.red;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(142, 116);
          ctx.bezierCurveTo(270, 88, 390, 76, 535, 47);
          ctx.stroke();
          ctx.strokeStyle = COLORS.green;
          ctx.beginPath();
          ctx.moveTo(142, 116);
          ctx.bezierCurveTo(270, 84, 390, 111, 535, 62);
          ctx.stroke();
          ctx.fillStyle = COLORS.orange;
          ctx.beginPath();
          ctx.arc(142, 116, 8, 0, Math.PI * 2);
          ctx.fill();
          rider(ctx, 112, 112, COLORS.blue, pedal, 0);
          break;
        }
        case 'chap-4': {
          ctx.strokeStyle = COLORS.route;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(24, 122);
          ctx.lineTo(530, 48);
          ctx.stroke();
          const px = 50 + phase * 420;
          const py = 122 - ((px - 24) / 506) * 74;
          rider(ctx, px, py + 9, COLORS.orange, pedal, -0.25);
          target(ctx, 525, 53, COLORS.green);
          break;
        }
        case 'chap-5': {
          rider(ctx, 150, 94, COLORS.red, pedal, 0);
          load(ctx, 150, 63, 26, COLORS.red, 2);
          rider(ctx, 390, 94, COLORS.green, pedal + 0.5, 1);
          load(ctx, 388, 74, 19, COLORS.green, 1);
          break;
        }
        case 'chap-6': {
          rider(ctx, x, 94, COLORS.blue, pedal * 0.4, 0.7);
          ctx.strokeStyle = COLORS.purple;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(360, 76);
          ctx.lineTo(445, 76);
          ctx.stroke();
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(445, 76);
          ctx.lineTo(505, 57);
          ctx.stroke();
          ctx.setLineDash([]);
          target(ctx, 520, 104, COLORS.green);
          break;
        }
        case 'chap-7': {
          rider(ctx, 122, 94, COLORS.blue, pedal, 0);
          drawMap(ctx, 380, 38, Math.floor(phase * 6) + 1);
          ctx.strokeStyle = COLORS.route;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(170, 90);
          ctx.quadraticCurveTo(260, 64, 375, 65);
          ctx.stroke();
          break;
        }
        case 'chap-8': {
          wheel(ctx, 165, 100, COLORS.ink);
          wheel(ctx, 340, 100, COLORS.ink);
          ctx.strokeStyle = COLORS.route;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(165, 100);
          ctx.lineTo(250, 67);
          ctx.lineTo(340, 100);
          ctx.moveTo(250, 67);
          ctx.lineTo(285, 100);
          ctx.stroke();
          for (let i = 0; i < 9; i += 1) {
            const cx = 250 + ((phase * 80 + i * 9) % 70);
            ctx.fillStyle = i % 2 ? COLORS.blue : COLORS.green;
            ctx.beginPath();
            ctx.arc(cx, 83 + Math.sin((cx + i) * 0.1) * 3, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'chap-9': {
          rider(ctx, 210, 94, COLORS.blue, pedal, 0.5);
          ctx.strokeStyle = COLORS.orange;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(240, 68);
          ctx.lineTo(283, 60);
          ctx.stroke();
          const pulse = 2 + phase * 4;
          for (let i = 0; i < 5; i += 1) {
            ctx.strokeStyle = i < 3 ? COLORS.green : COLORS.red;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(300 + i * 38, 84, pulse + i * 2, -1.1, 1.1);
            ctx.stroke();
          }
          break;
        }
        case 'chap-10': {
          rider(ctx, 70 + phase * 350, 94, COLORS.green, pedal, 0.8);
          rider(ctx, 70 + Math.min(0.92, phase * 0.8) * 350, 111, COLORS.red, pedal + 1, 0.3);
          ctx.strokeStyle = COLORS.ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(520, 42);
          ctx.lineTo(520, 124);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(505, 36, 30, 18);
          ctx.strokeStyle = COLORS.green;
          ctx.strokeRect(505, 36, 30, 18);
          break;
        }
        default: {
          rider(ctx, x, 94, COLORS.blue, pedal, 0.4);
          target(ctx, 520, 103, COLORS.green);
        }
      }
    };

    const tick = (time: number) => {
      render(time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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
  }, [chapterId, moduleId]);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default SqdAnalogy;
