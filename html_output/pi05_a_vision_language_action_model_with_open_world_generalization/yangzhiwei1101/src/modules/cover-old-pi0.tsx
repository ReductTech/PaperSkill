import { useEffect, useRef } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { setupCanvas, easeInOutQuad, clamp } from '../lib/canvasKit';

const W = 664;
const H = 324;

const C = {
  bg: '#f7f3ec',
  counter: '#d8c7ad',
  wood: '#92400e',
  steel: '#cfd8e3',
  handle: '#9fb0c8',
  ink: '#21324a',
  muted: '#68778f',
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
  note: '#fdf6e6',
};

function ken(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // back wall tiles
  ctx.strokeStyle = 'rgba(159,176,200,0.35)';
  ctx.lineWidth = 1;
  for (let x = 24; x < W; x += 58) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 196);
    ctx.stroke();
  }
  // counter
  ctx.fillStyle = C.counter;
  ctx.fillRect(0, 196, W, 128);
  ctx.fillStyle = C.wood;
  ctx.fillRect(0, 196, W, 7);
}

function drawers(ctx: CanvasRenderingContext2D, open: number[]) {
  const xs = [330, 420, 510, 600];
  xs.forEach((x, i) => {
    const gap = open.includes(i) ? 12 : 0;
    ctx.fillStyle = C.steel;
    ctx.fillRect(x, 96 + gap, 78, 62);
    ctx.strokeStyle = C.handle;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 96 + gap, 78, 62);
    ctx.fillStyle = i === 1 ? '#7c8ba0' : C.handle;
    ctx.fillRect(x + 26, 118 + gap, 26, 6);
  });
}

function note(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number) {
  ctx.fillStyle = C.note;
  ctx.strokeStyle = '#e8d9b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 40, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = '600 15px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 26);
  ctx.textAlign = 'left';
}

function apprentice(ctx: CanvasRenderingContext2D, hx: number, hy: number, swing: number) {
  // body
  ctx.fillStyle = '#e8eef7';
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(150, 210, 44, 96, 10);
  ctx.fill();
  ctx.stroke();
  // head
  ctx.fillStyle = '#fdf6e6';
  ctx.beginPath();
  ctx.arc(172, 190, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // eyes look down at hand
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(180, 188, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // shoulder -> elbow -> hand
  const sx = 192;
  const sy = 232;
  const ex = (sx + hx) / 2 + 18 * Math.sin(swing);
  const ey = (sy + hy) / 2 - 26;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(ex, ey, hx, hy);
  ctx.stroke();
  // gripper hand
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(hx, hy, 7, 0, Math.PI * 2);
  ctx.fill();
}

function progressRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: number, color: string, label: string) {
  ctx.strokeStyle = '#dfe5ee';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p, 0, 1));
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = '700 17px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(p * 100)}%`, cx, cy + 6);
  ctx.fillStyle = C.muted;
  ctx.font = '500 12px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillText(label, cx, cy + 58);
  ctx.textAlign = 'left';
}

export function CoverOldPi0(_: { chapterId: string; moduleId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { progress } = useCoverPlayback();

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = setupCanvas(cv, W, H);
    ken(ctx);
    drawers(ctx, [0, 3]);

    // task note only — no subtask level
    note(ctx, '把这桌收拾干净', 240, 22, 200);

    // erratic arm: sweeps between drawers, never settling
    const t = progress * Math.PI * 6;
    const hx = 400 + 150 * Math.sin(t) + 40 * Math.sin(t * 3.1);
    const hy = 150 + 46 * Math.cos(t * 1.7);
    apprentice(ctx, hx, hy, t);

    // a plate wobbles on the counter edge and drops
    const drop = clamp((progress - 0.45) / 0.35, 0, 1);
    const px = 236 + 26 * Math.sin(t * 2);
    const py = 168 - 40 * drop * drop;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(0.35 * Math.sin(t * 3) + drop * 1.1);
    ctx.fillStyle = '#f4f7fb';
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (drop > 0.5) {
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px - 26, 236);
      ctx.lineTo(px, 250);
      ctx.lineTo(px - 10, 266);
      ctx.stroke();
    }

    // progress stalls low
    const p = 0.22 * easeInOutQuad(clamp(progress * 1.4, 0, 1));
    progressRing(ctx, 588, 258, p, C.red, '任务完成度');

    ctx.fillStyle = C.muted;
    ctx.font = '600 15px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText('没有中间层级：手在找，却不知道下一步做什么', 40, 300);
  }, [progress]);

  return <canvas ref={ref} aria-label="π0 总指令直接驱动低层动作的动画" />;
}
