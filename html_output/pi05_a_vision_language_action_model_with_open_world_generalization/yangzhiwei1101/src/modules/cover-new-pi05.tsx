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
  blue: '#27446e',
  green: '#228d5c',
  note: '#fdf6e6',
  water: '#dbe7f2',
};

function ken(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(159,176,200,0.35)';
  ctx.lineWidth = 1;
  for (let x = 24; x < W; x += 58) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 196);
    ctx.stroke();
  }
  ctx.fillStyle = C.counter;
  ctx.fillRect(0, 196, W, 128);
  ctx.fillStyle = C.wood;
  ctx.fillRect(0, 196, W, 7);
}

function drawers(ctx: CanvasRenderingContext2D) {
  [330, 420, 510, 600].forEach((x) => {
    ctx.fillStyle = C.steel;
    ctx.fillRect(x, 96, 78, 62);
    ctx.strokeStyle = C.handle;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 96, 78, 62);
    ctx.fillStyle = C.handle;
    ctx.fillRect(x + 26, 118, 26, 6);
  });
}

function sink(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.water;
  ctx.strokeStyle = C.handle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(196, 150, 104, 46, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.font = '500 12px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillText('水槽', 232, 216);
}

function master(ctx: CanvasRenderingContext2D, bubble: string) {
  ctx.fillStyle = '#f6e3cf';
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(44, 150, 34, 62, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fdf6e6';
  ctx.beginPath();
  ctx.arc(61, 136, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(66, 134, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // speech bubble
  const bx = 88;
  const by = 96;
  const bw = 232;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, 46, 10);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + 2, by + 34);
  ctx.lineTo(bx - 14, by + 52);
  ctx.lineTo(bx + 16, by + 44);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.font = '700 15px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillText(bubble, bx + 14, by + 30);
}

function apprentice(ctx: CanvasRenderingContext2D, hx: number, hy: number, twist: number) {
  ctx.fillStyle = '#e8eef7';
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(150, 210, 44, 96, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fdf6e6';
  ctx.beginPath();
  ctx.arc(172, 190, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(180, 188, 2.6, 0, Math.PI * 2);
  ctx.fill();
  const sx = 192;
  const sy = 232;
  const ex = (sx + hx) / 2;
  const ey = (sy + hy) / 2 - 20 + twist;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(ex, ey, hx, hy);
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(hx, hy, 7, 0, Math.PI * 2);
  ctx.fill();
}

function ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: number) {
  ctx.strokeStyle = '#dfe5ee';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.green;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p, 0, 1));
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = '700 17px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(p * 100)}%`, cx, cy + 6);
  ctx.fillStyle = C.muted;
  ctx.font = '500 12px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillText('任务完成度', cx, cy + 58);
  ctx.textAlign = 'left';
}

export function CoverNewPi05(_: { chapterId: string; moduleId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { progress } = useCoverPlayback();

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = setupCanvas(cv, W, H);
    ken(ctx);
    drawers(ctx);
    sink(ctx);

    const seg = progress * 3;
    const bubble =
      seg < 1 ? '先把手边的杯子放进水槽' : seg < 2 ? '再把盘子摞到架子边' : '最后擦一下台面';
    master(ctx, bubble);

    // cup position (carried in segment 1..2)
    const cupHome = { x: 500, y: 168 };
    const sinkSpot = { x: 268, y: 176 };
    let hx = 300;
    let hy = 190;
    let cupX = cupHome.x;
    let cupY = cupHome.y;
    let cupVisible = true;
    let twist = 0;

    if (seg < 1) {
      const k = easeInOutQuad(clamp(seg, 0, 1));
      hx = 300 + (cupHome.x - 300) * k;
      hy = 190 + (cupHome.y - 190) * k;
    } else if (seg < 2) {
      const k = easeInOutQuad(clamp(seg - 1, 0, 1));
      hx = cupHome.x + (sinkSpot.x - cupHome.x) * k;
      hy = cupHome.y + (sinkSpot.y - cupHome.y) * k - 26 * Math.sin(Math.PI * k);
      cupX = hx;
      cupY = hy + 12;
    } else {
      const k = easeInOutQuad(clamp(seg - 2, 0, 1));
      hx = sinkSpot.x + (368 - sinkSpot.x) * k;
      hy = sinkSpot.y - 18 + 14 * Math.sin(Math.PI * k);
      cupVisible = false;
      twist = 8 * Math.sin(progress * Math.PI * 12);
    }

    if (cupVisible) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cupX - 11, cupY - 14, 22, 24, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cupX + 13, cupY - 2, 6, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    } else {
      // cup resting in the sink
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(238, 158, 22, 24, 4);
      ctx.fill();
      ctx.stroke();
    }

    apprentice(ctx, hx, hy, twist);
    ring(ctx, 588, 258, 0.86 * easeInOutQuad(clamp(progress * 1.15, 0, 1)));

    ctx.fillStyle = C.muted;
    ctx.font = '600 15px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText('同一个模型：先报下一步，手再照这一步出动作块', 40, 300);
  }, [progress]);

  return <canvas ref={ref} aria-label="π0.5 先预测子任务再输出动作块的动画" />;
}
