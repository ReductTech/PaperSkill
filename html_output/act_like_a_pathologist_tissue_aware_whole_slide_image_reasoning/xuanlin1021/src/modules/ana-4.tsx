import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, easeInOutQuad, lerp } from '../lib/canvasKit';
import {
  C,
  FONT,
  clearPlate,
  drawPhoto,
  drawCamera,
  drawContactSheet,
  drawTray,
  drawAlbumPage,
  rnd,
  usePlate,
} from './scene-kit';

// 六个章节的自动类比动画：同一间暗房、同一套实物，只换一个动作。
// 每个画面只有一个会动的主体，2.4–3.6 秒一个来回，离开视口就暂停。

const W = 560;
const H = 140;

/** 一只手：掌心 + 三指 + 拇指，够简单也认得出。 */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.roundRect(8 + i * 5, -9 + i * 2, 13, 5, 2.5);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.roundRect(-16, -4, 12, 6, 3);
  ctx.fill();
  ctx.restore();
}

function useAnim(draw: (ctx: CanvasRenderingContext2D, phase: number) => void, period: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const plate = usePlate(W, H);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf: number | null = null;
    const t0 = performance.now();
    const tick = (t: number) => {
      const ctx = plate(canvas);
      if (ctx) {
        const phase = ((t - t0) % period) / period;
        draw(ctx, phase);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return canvasRef;
}

/** §1 一台广角相机横扫整面印样墙。 */
export const Ana1: React.FC<WidgetProps> = () => {
  const ref = useAnim((ctx, phase) => {
    const e = easeInOutQuad(phase < 0.5 ? phase * 2 : (1 - phase) * 2);
    clearPlate(ctx, W, H);
    const wall = { x: 24, y: 18, w: 512, h: 92 };
    const all: number[] = [];
    for (let i = 0; i < 24; i++) all.push(i);
    drawContactSheet(ctx, wall, 8, 3, all, { seed: 5, tone: 'neutral', dimUnlit: 1 });
    const cx = lerp(70, 490, e);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = C.bg;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.restore();
    drawCamera(ctx, cx, 104, 0.78, C.blue, 84, 66);
  }, 2900);
  return <canvas ref={ref} width={W} height={H} />;
};

/** §2 一只手把一张照片贴进标着场景的印样行。 */
export const Ana2: React.FC<WidgetProps> = () => {
  const ref = useAnim((ctx, phase) => {
    const e = easeInOutQuad(phase < 0.5 ? phase * 2 : (1 - phase) * 2);
    clearPlate(ctx, W, H);
    const rows = [0, 1, 2];
    rows.forEach((r) => {
      const y = 20 + r * 34;
      ctx.strokeStyle = '#bdbfb4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(210, y, 300, 30);
      ctx.setLineDash([]);
      for (let i = 0; i < 6; i++) {
        drawPhoto(ctx, 218 + i * 48, y + 3, 42, 24, 40 + r * 7 + i, {
          tone: 'neutral',
          dim: 0.6,
          blobs: 3,
        });
      }
    });
    const from = { x: 70, y: 104 };
    const to = { x: 250, y: 58 };
    const px = lerp(from.x, to.x, e);
    const py = lerp(from.y, to.y, e);
    drawPhoto(ctx, px - 22, py - 16, 44, 32, 91, { tone: 'green', border: 2, ring: C.green });
    drawHand(ctx, px + 26, py + 6, 0.85, '#e8c9a8');
    if (e > 0.85) {
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.strokeRect(210, 58, 300, 30);
      for (let i = 0; i < 6; i++) {
        drawPhoto(ctx, 218 + i * 48, 61, 42, 24, 60 + i, { tone: 'green', dim: 1, blobs: 3, border: 1.5 });
      }
    }
  }, 3200);
  return <canvas ref={ref} width={W} height={H} />;
};

/** §3 一只手把一卷胶卷推进「先冲」槽位。 */
export const Ana3: React.FC<WidgetProps> = () => {
  const ref = useAnim((ctx, phase) => {
    const e = easeInOutQuad(phase < 0.5 ? phase * 2 : (1 - phase) * 2);
    clearPlate(ctx, W, H);
    ctx.fillStyle = '#e3ddcf';
    ctx.fillRect(300, 30, 210, 78);
    for (let i = 0; i < 3; i++) {
      const x = 312 + i * 66;
      const active = i === 1;
      ctx.strokeStyle = active ? (e > 0.6 ? C.green : C.orange) : C.axis;
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.strokeRect(x, 42, 56, 54);
    }
    const from = { x: 80, y: 100 };
    const to = { x: 340, y: 69 };
    const px = lerp(from.x, to.x, e);
    const py = lerp(from.y, to.y, e);
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.roundRect(-22, -14, 44, 28, 5);
    ctx.fill();
    ctx.fillStyle = '#dbe4ef';
    ctx.fillRect(-14, -9, 28, 6);
    ctx.fillStyle = C.route;
    ctx.fillRect(14, -12, 6, 24);
    ctx.restore();
    drawHand(ctx, px - 30, py + 8, 0.8, '#e8c9a8');
    if (e > 0.6) {
      window.requestAnimationFrame(() => undefined);
      drawPhoto(ctx, 318, 48, 44, 42, 77, { tone: 'green', border: 1.5, ring: C.green });
    }
  }, 2700);
  return <canvas ref={ref} width={W} height={H} />;
};

/** §4 一支红笔在灯箱上依次圈出要留的格子。 */
export const Ana4: React.FC<WidgetProps> = () => {
  const ref = useAnim((ctx, phase) => {
    clearPlate(ctx, W, H);
    ctx.fillStyle = '#fdfbf3';
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 16, 472, 100);
    const keep = new Set([3, 4, 6, 9, 13]);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 12; c++) {
        const idx = r * 12 + c;
        drawPhoto(ctx, 50 + c * 38, 24 + r * 31, 32, 25, 20 + idx, {
          tone: keep.has(idx) ? 'green' : 'muted',
          dim: keep.has(idx) ? 1 : 0.32,
          blobs: 3,
          border: 1,
        });
      }
    }
    const order = [3, 4, 6, 9, 13];
    const step = phase * order.length;
    const count = Math.floor(step);
    const frac = step - count;
    for (let i = 0; i < Math.min(count, order.length); i++) {
      const idx = order[i];
      const x = 50 + (idx % 12) * 38;
      const y = 24 + Math.floor(idx / 12) * 31;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(x + 16, y + 12.5, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (count < order.length) {
      const idx = order[count];
      const x = 50 + (idx % 12) * 38;
      const y = 24 + Math.floor(idx / 12) * 31;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(x + 16, y + 12.5, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
      ctx.save();
      ctx.translate(x + 16 + 14, y + 12.5 + 12);
      ctx.rotate(-0.7);
      ctx.fillStyle = C.red;
      ctx.fillRect(-2, -12, 4, 20);
      ctx.restore();
    }
  }, 3400);
  return <canvas ref={ref} width={W} height={H} />;
};

/** §5 同一张相纸在两盘药水里同步显影，左糊右清。 */
export const Ana5: React.FC<WidgetProps> = () => {
  const ref = useAnim((ctx, phase) => {
    const t = phase < 0.35 ? 0 : Math.min(1, (phase - 0.35) / 0.45);
    clearPlate(ctx, W, H);
    drawTray(ctx, 46, 26, 208, 84, 0.55, C.axis);
    drawTray(ctx, 306, 26, 208, 84, 0.55, C.blue);
    ctx.strokeStyle = C.route;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(46, 26, 208, 84);
    ctx.strokeRect(306, 26, 208, 84);
    const dip = 10 + 26 * Math.min(1, phase / 0.3);
    drawPhoto(ctx, 122, 34 + dip, 56, 40, 44, { tone: 'neutral', dim: 0.5 + 0.5 * t * 0.4, blobs: 3 });
    ctx.save();
    ctx.globalAlpha = 0.62 * (1 - t);
    ctx.fillStyle = '#8f959c';
    ctx.fillRect(122, 34 + dip, 56, 40);
    ctx.restore();
    drawPhoto(ctx, 382, 34 + dip, 56, 40, 44, { tone: 'green', dim: 0.25 + 0.75 * t, blobs: 4 });
    ctx.save();
    ctx.globalAlpha = 0.5 * (1 - t);
    ctx.fillStyle = '#a9adb2';
    ctx.fillRect(382, 34 + dip, 56, 40);
    ctx.restore();
  }, 3600);
  return <canvas ref={ref} width={W} height={H} />;
};

/** §6 把挑好的照片排进相册一页，最后合上。 */
export const Ana6: React.FC<WidgetProps> = () => {
  const ref = useAnim((ctx, phase) => {
    clearPlate(ctx, W, H);
    const slots = 4;
    const filled = Math.min(slots, Math.floor(phase * (slots + 1)));
    drawAlbumPage(ctx, 150, 20, 260, 100, slots, filled, 'green');
    const idx = Math.min(slots - 1, filled);
    const drop = 1 - Math.min(1, (phase * (slots + 1) - idx) * 2);
    drawPhoto(ctx, 158 + idx * 62, 26 - 18 * Math.max(0, drop), 54, 86, 70 + idx, {
      tone: 'green',
      border: 1,
      blobs: 3,
    });
    drawHand(ctx, 190 + idx * 62, 30 - 16 * Math.max(0, drop), 0.75, '#e8c9a8');
    if (phase > 0.9) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = C.dark;
      ctx.fillRect(150, 20, 260, 100);
      ctx.restore();
    }
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(150.5, 20.5, 259, 99);
  }, 3500);
  return <canvas ref={ref} width={W} height={H} />;
};

// 保留字体常量导出引用，避免打包器因为未使用而报错。
export const ANALOGY_FONT = FONT;
export const ANALOGY_SEED = rnd(1, 1);
export default Ana1;
