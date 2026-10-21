import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

const SKY = '#0b1830';
const GLOW = '#122346';
const STAR = '#dfe7f5';
const DIM = '#7f8db0';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const TUBE = '#8a97b8';
const TUBE_DARK = '#5c6b8f';
const SUPPORT = '#92400e';

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r = 3, c = STAR) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string, lw = 2) {
  ctx.strokeStyle = c;
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y - 4);
  ctx.lineTo(x + w / 2, y + 4);
  ctx.moveTo(x - 4, y + h / 2);
  ctx.lineTo(x + 4, y + h / 2);
  ctx.stroke();
}

function telescope(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle = 0, c = TUBE) {
  // tripod legs + mount head
  ctx.strokeStyle = TUBE_DARK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 22, H - 30);
  ctx.lineTo(cx, cy + 6);
  ctx.moveTo(cx + 22, H - 30);
  ctx.lineTo(cx, cy + 6);
  ctx.stroke();
  ctx.fillStyle = TUBE_DARK;
  ctx.fillRect(cx - 7, cy - 4, 14, 10);
  // main tube: dew shield (front, wider) + body + eyepiece (back) + finder on top
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = c;
  ctx.fillRect(-48, -9, 96, 18);
  ctx.fillStyle = TUBE_DARK;
  ctx.fillRect(-66, -12, 20, 24);
  ctx.fillRect(48, -5, 16, 10);
  ctx.fillStyle = SUPPORT;
  ctx.fillRect(-26, -16, 40, 6);
  ctx.restore();
}

type Ctx = CanvasRenderingContext2D;

function scene1(ctx: Ctx, t: number) {
  const bx = t * (W + 120) - 60;
  const g = ctx.createLinearGradient(bx - 40, 0, bx + 40, 0);
  g.addColorStop(0, 'rgba(196,63,82,0)');
  g.addColorStop(0.5, 'rgba(196,63,82,0.45)');
  g.addColorStop(1, 'rgba(196,63,82,0)');
  ctx.fillStyle = g;
  ctx.fillRect(bx - 40, 0, 80, H);
  star(ctx, 460, 80, 4, bx > 420 ? RED : DIM);
  frame(ctx, 440, 60, 40, 40, bx > 420 ? RED : 'rgba(196,63,82,0.3)');
  ctx.fillStyle = RED;
  ctx.font = '20px sans-serif';
  ctx.fillText('2s', 20, 30);
}

function scene2(ctx: Ctx, t: number) {
  star(ctx, 140, 70, 4, STAR);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(140, 70);
  ctx.lineTo(260, 46);
  ctx.moveTo(140, 70);
  ctx.lineTo(260, 96);
  ctx.stroke();
  ctx.fillStyle = TUBE;
  ctx.fillRect(260, 40, 52, 12);
  ctx.fillRect(260, 90, 52, 12);
  ctx.fillStyle = DIM;
  ctx.font = '15px sans-serif';
  ctx.fillText('寻星镜', 320, 50);
  ctx.fillText('目镜', 320, 100);
}

function scene3(ctx: Ctx, t: number) {
  // left: shared
  telescope(ctx, 150, 80, -0.12);
  ctx.strokeStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(80, 60);
  ctx.lineTo(150, 80);
  ctx.stroke();
  star(ctx, 80, 60, 3, STAR);
  ctx.fillStyle = GREEN;
  ctx.fillRect(110, 110, 60, 8);
  // right: two independent
  telescope(ctx, 420, 80, -0.12);
  telescope(ctx, 440, 100, 0.1, TUBE_DARK);
  ctx.strokeStyle = RED;
  ctx.beginPath();
  ctx.moveTo(330, 60);
  ctx.lineTo(420, 80);
  ctx.moveTo(330, 90);
  ctx.lineTo(440, 100);
  ctx.stroke();
  star(ctx, 330, 60, 3, RED);
  star(ctx, 330, 90, 3, RED);
  ctx.fillStyle = RED;
  ctx.fillRect(390, 112, 90, 8);
}

function scene4(ctx: Ctx, t: number) {
  const scales = [1, 1.6, 2.4];
  const ratios = [0.6, 1, 1.6];
  const i = Math.floor(t * 9) % 9;
  const s = scales[Math.floor(i / 3)];
  const r = ratios[i % 3];
  const w = 34 * s;
  const h = (34 * s) / r;
  star(ctx, 280, 70, 4, STAR);
  frame(ctx, 280 - w / 2, 70 - h / 2, w, h, ORANGE);
  ctx.fillStyle = DIM;
  ctx.font = '15px sans-serif';
  ctx.fillText('9 个参考框', 20, 30);
}

function scene5(ctx: Ctx, t: number) {
  const e = 1 - Math.abs(t * 2 - 1); // 0..1..0
  const cx = 180 + e * 150; // 180 -> 330（星星中心 x）
  const cy = 110 - e * 40; // 110 -> 70（星星中心 y）
  const s = 120 - e * 80; // 120 -> 40（收紧套住星）
  star(ctx, 330, 70, 5, STAR);
  const c = e > 0.9 ? GREEN : e > 0.45 ? ORANGE : RED;
  frame(ctx, cx - s / 2, cy - s / 2, s, s, c, 3);
  ctx.fillStyle = c;
  ctx.font = '15px sans-serif';
  ctx.fillText('校正', 20, 30);
}

function scene6(ctx: Ctx, t: number) {
  const bx = 40 + t * 200;
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 70);
  ctx.lineTo(bx, 70);
  ctx.stroke();
  telescope(ctx, 300, 70, -0.12);
  frame(ctx, 240, 50, 40, 40, bx > 240 ? GREEN : 'rgba(34,141,92,0.3)');
  star(ctx, 430, 70, 4, bx > 430 ? GREEN : DIM);
  if (bx > 430) {
    ctx.fillStyle = GREEN;
    ctx.fillRect(430, 84, 24, 6);
  }
}

function scene7(ctx: Ctx, t: number) {
  star(ctx, 240, 70, 4, STAR);
  frame(ctx, 220, 50, 40, 40, GREEN);
  // checkmark
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(390, 70);
  ctx.lineTo(404, 84);
  ctx.lineTo(426, 54);
  ctx.stroke();
  // dial needle
  const a = Math.sin(t * Math.PI * 2) * 0.5;
  ctx.strokeStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(120, 90);
  ctx.lineTo(120 + Math.cos(a) * 22, 90 + Math.sin(a) * 22);
  ctx.stroke();
  ctx.fillStyle = DIM;
  ctx.font = '15px sans-serif';
  ctx.fillText('认得出 + 框得准', 310, 110);
}

function scene8(ctx: Ctx, t: number) {
  const onFinder = t < 0.5;
  // ground
  ctx.strokeStyle = TUBE_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, H - 24);
  ctx.lineTo(W - 20, H - 24);
  ctx.stroke();
  // tripod legs + mount head
  ctx.strokeStyle = TUBE_DARK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(210, H - 24);
  ctx.lineTo(250, 96);
  ctx.moveTo(290, H - 24);
  ctx.lineTo(250, 96);
  ctx.stroke();
  ctx.fillStyle = TUBE_DARK;
  ctx.fillRect(242, 86, 16, 14);
  // main tube (front-left = dew shield, back-right = eyepiece)
  ctx.fillStyle = TUBE;
  ctx.fillRect(140, 88, 190, 18);
  ctx.fillStyle = TUBE_DARK;
  ctx.fillRect(116, 84, 28, 26);
  ctx.fillStyle = onFinder ? TUBE : ORANGE;
  ctx.fillRect(330, 92, 22, 12);
  // finder scope on top (highlighted when active)
  ctx.fillStyle = onFinder ? ORANGE : TUBE;
  ctx.fillRect(178, 72, 62, 9);
  // starlight ray into the front of the tube
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 58);
  ctx.lineTo(116, 96);
  ctx.stroke();
  star(ctx, 70, 58, 4, STAR);
  // label
  ctx.fillStyle = DIM;
  ctx.font = '15px sans-serif';
  ctx.fillText(onFinder ? '寻星镜' : '目镜', 358, 80);
}

function scene9(ctx: Ctx, t: number) {
  const onFinder = t < 0.5;
  // ground
  ctx.strokeStyle = TUBE_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, H - 24);
  ctx.lineTo(W - 20, H - 24);
  ctx.stroke();
  // tripod + mount head
  ctx.strokeStyle = TUBE_DARK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(210, H - 24);
  ctx.lineTo(250, 96);
  ctx.moveTo(290, H - 24);
  ctx.lineTo(250, 96);
  ctx.stroke();
  ctx.fillStyle = TUBE_DARK;
  ctx.fillRect(242, 86, 16, 14);
  // main tube + dew shield
  ctx.fillStyle = TUBE;
  ctx.fillRect(140, 88, 190, 18);
  ctx.fillStyle = TUBE_DARK;
  ctx.fillRect(116, 84, 28, 26);
  // finder scope highlight
  ctx.fillStyle = onFinder ? ORANGE : TUBE;
  ctx.fillRect(178, 72, 62, 9);
  // eyepiece highlight
  ctx.fillStyle = onFinder ? TUBE : ORANGE;
  ctx.fillRect(330, 92, 22, 12);
  // calibration indicator near the active part
  const ix = onFinder ? 209 : 341;
  const iy = onFinder ? 52 : 76;
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.arc(ix, iy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ix + 5, iy + 5);
  ctx.lineTo(ix + 16, iy + 16);
  ctx.stroke();
  // starlight into the front of the tube
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 58);
  ctx.lineTo(116, 96);
  ctx.stroke();
  star(ctx, 70, 58, 4, STAR);
  // label
  ctx.fillStyle = DIM;
  ctx.font = '15px sans-serif';
  ctx.fillText(onFinder ? '校准寻星镜' : '校准目镜', 30, 30);
}

function scene10(ctx: Ctx, t: number) {
  const xs = [120, 200, 280];
  const cols = [RED, BLUE, GREEN];
  for (let i = 0; i < 3; i++) {
    const done = t > 0.25 + i * 0.18;
    ctx.fillStyle = done ? cols[i] : DIM;
    ctx.fillRect(xs[i], 70 - (done ? 8 : 4), 28, done ? 16 : 8);
    frame(ctx, xs[i] - 8, 48, 44, 44, done ? cols[i] : 'rgba(127,141,176,0.4)');
  }
  star(ctx, 480, 70, 4, STAR);
  ctx.fillStyle = DIM;
  ctx.font = '15px sans-serif';
  ctx.fillText('SS / Fast / Faster', 300, 30);
}

const scenes: Record<string, (ctx: Ctx, t: number) => void> = {
  'chap-1': scene1,
  'chap-2': scene2,
  'chap-3': scene3,
  'chap-4': scene4,
  'chap-5': scene5,
  'chap-6': scene6,
  'chap-7': scene7,
  'chap-8': scene8,
  'chap-9': scene9,
  'chap-10': scene10,
};

export const StargazeAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
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
    const draw = scenes[chapterId] || scene1;
    const start0 = performance.now();
    const render = (now: number) => {
      const t = ((now - start0) % 3000) / 3000;
      ctx.fillStyle = SKY;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = GLOW;
      ctx.fillRect(0, H - 24, W, 24);
      for (let i = 0; i < 14; i++) {
        const px = ((i * 137 + 40) % W);
        const py = ((i * 67 + 24) % (H - 30));
        ctx.fillStyle = DIM;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(px, py, 2, 2);
        ctx.globalAlpha = 1;
      }
      draw(ctx, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId]);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default StargazeAnalogy;
