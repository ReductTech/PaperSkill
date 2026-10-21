import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const palette = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', text: '#21324a', muted: '#68778f', border: '#d7deea',
};

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.min(r, Math.max(0, w / 2), Math.max(0, h / 2)));
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.restore();
}

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);
}

export function drawPaper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent = '#fffef8') {
  roundRect(ctx, x + 3, y + 4, w, h, 6, '#dfe6d8');
  roundRect(ctx, x, y, w, h, 6, accent, palette.light);
  ctx.save();
  ctx.strokeStyle = palette.light;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + w - 14, y + 1); ctx.lineTo(x + w - 14, y + 13); ctx.lineTo(x + w - 1, y + 13); ctx.stroke();
  ctx.restore();
}

export function drawGuide(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = palette.blue) {
  ctx.save();
  ctx.setLineDash([5, 4]); ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, color = palette.green) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 15, y); ctx.lineTo(x + 15, y); ctx.moveTo(x, y - 15); ctx.lineTo(x, y + 15); ctx.stroke();
  ctx.restore();
}

export function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, color = '#e6b38d') {
  ctx.save(); ctx.translate(x, y);
  roundRect(ctx, -9, 7, 23, 26, 8, color, palette.support);
  roundRect(ctx, -8, -8, 7, 24, 3.5, color, palette.support);
  roundRect(ctx, -1, -10, 7, 25, 3.5, color, palette.support);
  roundRect(ctx, 6, -7, 7, 22, 3.5, color, palette.support);
  roundRect(ctx, -15, 9, 9, 18, 4, color, palette.support);
  roundRect(ctx, -10, 29, 26, 12, 2, palette.blue);
  ctx.restore();
}

export function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = palette.text) {
  ctx.save(); ctx.fillStyle = color; ctx.font = '600 20px "Microsoft YaHei", sans-serif'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y); ctx.restore();
}

export function drawLegend(ctx: CanvasRenderingContext2D, items: { label: string; color: string }[], x: number, y: number) {
  items.slice(0, 3).forEach((item, index) => {
    roundRect(ctx, x + index * 140, y - 6, 12, 12, 3, item.color);
    drawLabel(ctx, item.label, x + index * 140 + 20, y);
  });
}

export function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = palette.blue) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(angle - 0.45), y2 - 10 * Math.sin(angle - 0.45));
  ctx.lineTo(x2 - 10 * Math.cos(angle + 0.45), y2 - 10 * Math.sin(angle + 0.45));
  ctx.closePath(); ctx.fill(); ctx.restore();
}

/** Keeps drawing closures fresh without restarting an animation on every state update. */
export function useDrawing(ref: React.RefObject<HTMLCanvasElement>, draw: (ctx: CanvasRenderingContext2D, t: number) => void, w = 1080, h = 280, animated = false) {
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const repaintRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let dpr = window.devicePixelRatio || 1;
    const configure = () => {
      ctx = setupCanvas(canvas, w, h);
      canvas.style.width = '100%'; canvas.style.height = 'auto';
      canvas.style.aspectRatio = `${w} / ${h}`;
    };
    configure();
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let frame = 0;
    let disposed = false;
    const paint = () => {
      if (disposed) return;
      ctx.save();
      drawRef.current(ctx, media.matches ? 1500 : performance.now());
      ctx.restore();
      canvas.classList.add('is-ready');
    };
    repaintRef.current = paint;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const tick = () => {
      frame = 0;
      if (!visible || document.hidden || media.matches || disposed) return;
      paint(); frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      stop(); paint();
      if (animated && visible && !document.hidden && !media.matches) frame = requestAnimationFrame(tick);
    };
    const unobserve = observeCanvas(canvas,
      () => { visible = true; sync(); },
      () => { visible = false; stop(); });
    const resize = () => {
      const nextDpr = window.devicePixelRatio || 1;
      if (dpr !== nextDpr) { dpr = nextDpr; configure(); }
      paint();
    };
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', resize);
    paint();
    return () => {
      disposed = true; stop(); unobserve(); repaintRef.current = null;
      media.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', resize);
    };
  }, [ref, w, h, animated]);

  useEffect(() => { repaintRef.current?.(); });
}

export const Feedback: React.FC<{ children: React.ReactNode; tone?: 'good' | 'bad' | 'neutral' }> = ({ children, tone = 'neutral' }) => (
  <div className={`feedback${tone === 'neutral' ? '' : ` ${tone}`}`} role="status" aria-live="polite" aria-atomic="true">{children}</div>
);

function collage(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 240, h / 90);
  roundRect(ctx, 12, 48, 213, 30, 3, '#d2dfc4');
  roundRect(ctx, 86, 35, 58, 40, 2, '#f0cba7', palette.support);
  ctx.fillStyle = palette.orange;
  ctx.beginPath(); ctx.moveTo(78, 38); ctx.lineTo(115, 8); ctx.lineTo(153, 38); ctx.closePath(); ctx.fill();
  roundRect(ctx, 107, 50, 15, 25, 1, palette.support);
  roundRect(ctx, 179, 28, 7, 46, 1, palette.support);
  ctx.fillStyle = palette.dark; ctx.beginPath(); ctx.arc(182, 25, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8c959'; ctx.beginPath(); ctx.arc(35, 18, 11, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function ruler(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  roundRect(ctx, x, y, w, 17, 2, '#f2dfb0', palette.support);
  ctx.save(); ctx.strokeStyle = palette.support; ctx.lineWidth = 1;
  for (let i = 10; i < w - 5; i += 10) { ctx.beginPath(); ctx.moveTo(x + i, y + 2); ctx.lineTo(x + i, y + (i % 50 ? 7 : 12)); ctx.stroke(); }
  ctx.restore();
}

export const AnalogyScene: React.FC<{ scene: number; variant?: 'local' | 'global' }> = ({ scene, variant = 'local' }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const descriptions = [
    '手移动取景框观察同一张拼贴纸', '裁刀沿直尺切开一张纸', '手把纸片对齐固定轮廓',
    '台灯转向纸张的不同位置', '手把描图纸叠在原稿上', '印章在完成的作品上落下',
    '橡皮擦去纸上的笔痕', '手把纸片放到同一个纸堆', '手翻开记录本的一页', '直尺沿作品边缘移动',
  ];
  useDrawing(ref, (ctx, t) => {
    clearScene(ctx, 560, 140);
    const cycle = (1 - Math.cos((t % 3000) / 3000 * Math.PI * 2)) / 2;
    if (scene === 1) {
      drawPaper(ctx, 144, 16, 260, 101); collage(ctx, 152, 22, 244, 90);
      const large = variant === 'global';
      const fx = large ? 151 + cycle * 10 : 155 + cycle * 155;
      const fy = large ? 23 : 40;
      ctx.save(); ctx.strokeStyle = palette.blue; ctx.lineWidth = 4;
      ctx.strokeRect(fx, fy, large ? 236 : 68, large ? 83 : 57); ctx.restore();
      drawHand(ctx, fx + (large ? 205 : 48), fy + (large ? 75 : 50));
    } else if (scene === 2) {
      drawPaper(ctx, 165, 19, 238, 95); ruler(ctx, 195, 74, 184);
      const cx = 209 + cycle * 156;
      ctx.save(); ctx.strokeStyle = palette.dark; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(203, 72); ctx.lineTo(cx, 72); ctx.stroke();
      ctx.translate(cx, 67); ctx.rotate(-0.5);
      roundRect(ctx, -5, -40, 13, 36, 3, palette.blue);
      ctx.fillStyle = '#bac7d6'; ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(8, -4); ctx.lineTo(-2, 12); ctx.closePath(); ctx.fill(); ctx.restore();
    } else if (scene === 3) {
      drawPaper(ctx, 179, 23, 228, 92); drawGuide(ctx, 259, 39, 91, 58);
      const px = 165 + cycle * 94, py = 20 + cycle * 19;
      drawPaper(ctx, px, py, 91, 58, '#e3edda'); drawHand(ctx, px + 78, py + 41);
    } else if (scene === 4) {
      drawPaper(ctx, 210, 67, 209, 46); collage(ctx, 219, 71, 188, 36);
      roundRect(ctx, 137, 108, 64, 8, 4, palette.blue);
      ctx.save(); ctx.strokeStyle = palette.blue; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(168, 110); ctx.lineTo(171, 31); ctx.lineTo(231, 31); ctx.stroke();
      const angle = -0.23 + cycle * 0.55;
      ctx.translate(231, 31); ctx.rotate(angle);
      ctx.fillStyle = 'rgba(242,208,104,0.24)'; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(45, 87); ctx.lineTo(135, 87); ctx.closePath(); ctx.fill();
      ctx.fillStyle = palette.blue; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(16, -7); ctx.lineTo(38, 13); ctx.lineTo(-15, 13); ctx.closePath(); ctx.fill(); ctx.restore();
    } else if (scene === 5) {
      drawPaper(ctx, 193, 38, 180, 74); drawGuide(ctx, 224, 52, 116, 44, palette.dark);
      const py = 6 + cycle * 32;
      ctx.save(); ctx.globalAlpha = 0.72; drawPaper(ctx, 193, py, 180, 74, '#e0edf7');
      drawGuide(ctx, 224, py + 14, 116, 44, palette.blue); ctx.restore();
      drawHand(ctx, 366, py + 53);
    } else if (scene === 6) {
      drawPaper(ctx, 190, 53, 192, 64); collage(ctx, 197, 58, 174, 52);
      if (cycle > 0.85) { ctx.save(); ctx.strokeStyle = palette.green; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(315, 94, 16, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      const sy = 12 + cycle * 56;
      roundRect(ctx, 296, sy, 37, 13, 6, palette.support);
      roundRect(ctx, 307, sy + 9, 15, 19, 3, palette.support);
      roundRect(ctx, 288, sy + 25, 53, 8, 2, palette.blue);
    } else if (scene === 7) {
      drawPaper(ctx, 184, 28, 206, 87); ruler(ctx, 207, 91, 157);
      const ex = 214 + cycle * 119;
      ctx.save(); ctx.strokeStyle = palette.muted; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ex + 16, 73); ctx.lineTo(363, 73); ctx.stroke(); ctx.restore();
      roundRect(ctx, ex, 53, 39, 23, 4, '#f0b6b4', palette.red);
      roundRect(ctx, ex + 23, 53, 16, 23, 3, '#d5dde7');
    } else if (scene === 8) {
      for (let i = 3; i >= 0; i--) drawPaper(ctx, 237 + i * 3, 84 - i * 5, 117, 33);
      drawGuide(ctx, 221, 67, 152, 55, palette.dark);
      const py = 6 + cycle * 61; drawPaper(ctx, 246, py, 117, 33, '#e3edda'); drawHand(ctx, 350, py + 16);
    } else if (scene === 9) {
      drawPaper(ctx, 173, 25, 215, 89); drawGuide(ctx, 424, 57, 69, 48, palette.dark);
      const pageWidth = 170 * Math.abs(1 - cycle * 2) + 8;
      const left = cycle < 0.5 ? 185 : 185 - pageWidth;
      drawPaper(ctx, left, 22, pageWidth, 87, '#f4eddc'); drawHand(ctx, left + pageWidth - 4, 75);
    } else {
      drawPaper(ctx, 168, 20, 227, 91); collage(ctx, 173, 26, 214, 78);
      drawGuide(ctx, 155, 9, 253, 111, palette.dark); ruler(ctx, 130 + cycle * 170, 105, 132);
    }
  }, 560, 140, true);
  return <canvas ref={ref} role="img" aria-label={descriptions[Math.max(0, Math.min(9, scene - 1))]} />;
};

// Assembly registers helpers as a packet; this component is deliberately unused by the page.
export const VitKit: React.FC = () => null;
