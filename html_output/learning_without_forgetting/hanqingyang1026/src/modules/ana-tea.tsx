import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 茶桌类比动画：一章一个动作，共用同一套茶桌画具（茶壶、品茗杯、留样杯、茶匙、
// 风味卡、滤网、沙漏、评分牌）。所有场景都只有一个移动主体。
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0',
  table: '#c9b79a',
  edge: '#92400e',
  deep: '#7a4a22',
  porcelain: '#ece6d9',
  tea: '#a9713a',
  teaLight: '#d9b073',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  axis: '#d7deea',
  ink: '#21324a',
  steam: '#d7deea',
  leaf: '#76906a',
};

const DURATION: Record<string, number> = {
  'chap-1': 2600,
  'chap-2': 2800,
  'chap-3': 3200,
  'chap-4': 3000,
  'chap-5': 3400,
  'chap-6': 3000,
  'chap-7': 3000,
  'chap-8': 2400,
  'chap-9': 2800,
  'chap-10': 2600,
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function sceneBase(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // 桌面
  ctx.fillStyle = C.table;
  ctx.fillRect(0, 108, W, 22);
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 108);
  ctx.lineTo(W, 108);
  ctx.stroke();
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 130);
  ctx.lineTo(W, 130);
  ctx.stroke();
}

function cup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  level: number,
  tint: string
) {
  const w = 30 * s;
  const h = 34 * s;
  const top = y - h;
  ctx.fillStyle = C.porcelain;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, top);
  ctx.lineTo(x + w / 2, top);
  ctx.lineTo(x + w * 0.36, y);
  ctx.lineTo(x - w * 0.36, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const liquidH = h * 0.78 * clamp(level, 0, 1);
  ctx.fillStyle = tint;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.44, top + 3);
  ctx.lineTo(x + w * 0.44, top + 3);
  ctx.lineTo(x + w * 0.36, top + 3 + liquidH);
  ctx.lineTo(x - w * 0.36, top + 3 + liquidH);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(x, top, w / 2, 3.4, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function pot(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, level: number) {
  const w = 70 * s;
  const h = 46 * s;
  const top = y - h;
  ctx.fillStyle = C.porcelain;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  roundRect(ctx, x - w / 2, top + 8, w, h - 8, 10 * s);
  ctx.fill();
  ctx.stroke();
  // 壶嘴
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 2, top + 18);
  ctx.quadraticCurveTo(x + w / 2 + 22 * s, top + 12, x + w / 2 + 26 * s, top + 2);
  ctx.lineTo(x + w / 2 + 18 * s, top + 2);
  ctx.quadraticCurveTo(x + w / 2 + 14 * s, top + 12, x + w / 2 - 2, top + 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 壶盖
  ctx.beginPath();
  ctx.ellipse(x, top + 8, w / 2 - 4, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, top + 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 茶汤
  const liquidTop = y - 12 - (h - 24) * clamp(level, 0, 1) * 0.6;
  ctx.fillStyle = C.tea;
  ctx.globalAlpha = 0.55;
  roundRect(ctx, x - w / 2 + 4, liquidTop, w - 8, y - 4 - liquidTop, 6 * s);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function spoon(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, load: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(46, -28);
  ctx.stroke();
  ctx.fillStyle = '#d9cbb0';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (load > 0) {
    ctx.fillStyle = C.leaf;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(-3 + i * 2.2, -2 + (i % 2) * 2, 2.6, 1.5, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function card(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bars: number[]
) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  bars.forEach((b, i) => {
    const bh = (h - 22) * clamp(b, 0.02, 1);
    ctx.fillStyle = i === 0 ? C.blue : C.tea;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x + 14 + i * 20, y + h - 10 - bh, 8, bh);
    ctx.globalAlpha = 1;
  });
}

function steam(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.strokeStyle = C.steam;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 2; i++) {
    const ph = (t + i * 0.5) % 1;
    ctx.beginPath();
    ctx.moveTo(x + i * 7 - 3, y);
    ctx.bezierCurveTo(x + 8 + i * 7, y - 12, x - 8 + i * 7, y - 20 - ph * 10, x + i * 7, y - 30);
    ctx.globalAlpha = 0.55 * (1 - ph);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function pourStream(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number
) {
  ctx.strokeStyle = C.teaLight;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 6, x2, y2);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function render(ctx: CanvasRenderingContext2D, chapter: string, t: number) {
  sceneBase(ctx);
  const loop = t % 1;

  switch (chapter) {
    case 'chap-1': {
      // 添新叶：茶匙倾斜一次，叶子落进壶里；留样杯颜色不动。
      pot(ctx, 240, 112, 1, 0.55);
      cup(ctx, 450, 112, 1, 0.62, C.tea);
      const k = Math.sin(loop * Math.PI * 2);
      spoon(ctx, 330 + k * 6, 44 + k * 4, -0.5 + k * 0.55, 1);
      for (let i = 0; i < 3; i++) {
        const p = (loop + i * 0.16) % 1;
        const lx = 316 + i * 3 - p * 10;
        const ly = 44 + p * 52;
        ctx.globalAlpha = 1 - p * 0.35;
        ctx.fillStyle = C.leaf;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 3.2, 1.8, p * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'chap-2': {
      // 记卡：笔尖从左到右，三条记录依次出现。
      cup(ctx, 170, 112, 1, 0.6, C.tea);
      const bars = [0.2, 0.2, 0.2].map((_, i) => clamp((loop * 3 - i) / 0.8, 0.08, 1) * [0.62, 0.48, 0.3][i]);
      card(ctx, 300, 46, 190, 62, bars);
      const px = 318 + Math.min(1, loop * 1.1) * 150;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, 38);
      ctx.lineTo(px - 14, 58);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(px - 15, 60, 2.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chap-3': {
      // 分汤：一只公道杯把茶同时分进两只杯子，液面同步上升。
      const g = easeOutCubic(clamp(loop * 1.25, 0, 1));
      ctx.save();
      ctx.translate(150, 62);
      ctx.rotate(-0.35);
      ctx.fillStyle = C.porcelain;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.8;
      roundRect(ctx, -26, -22, 52, 40, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.tea;
      ctx.globalAlpha = 0.6;
      roundRect(ctx, -22, -4 + 14 * (1 - g), 44, 18, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      pourStream(ctx, 178, 66, 300, 84, 3);
      pourStream(ctx, 178, 66, 420, 84, 3);
      cup(ctx, 300, 112, 1.05, 0.12 + 0.6 * g, C.tea);
      cup(ctx, 420, 112, 1.05, 0.12 + 0.6 * g, C.tea);
      break;
    }
    case 'chap-4': {
      // 照灯：手拧旋钮，光锥变宽，杯里的层次显现。
      cup(ctx, 330, 112, 1.1, 0.66, C.tea);
      const spread = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(loop * Math.PI * 2));
      ctx.fillStyle = 'rgba(240,126,71,0.16)';
      ctx.beginPath();
      ctx.moveTo(120, 44);
      ctx.lineTo(330 - 46 * spread, 106);
      ctx.lineTo(330 + 46 * spread, 106);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 44);
      ctx.lineTo(300, 52);
      ctx.stroke();
      ctx.fillStyle = C.deep;
      ctx.beginPath();
      ctx.moveTo(120, 44);
      ctx.lineTo(96, 30);
      ctx.lineTo(96, 58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.fillRect(118, 58, 6, 50);
      ctx.fillRect(108, 104, 26, 6);
      break;
    }
    case 'chap-5': {
      // 配比：茶匙在两堆叶子之间，两堆此消彼长。
      const k = 0.5 + 0.5 * Math.sin(loop * Math.PI * 2);
      const left = 14 + 26 * k;
      const right = 14 + 26 * (1 - k);
      ctx.fillStyle = C.leaf;
      ctx.beginPath();
      ctx.moveTo(210, 104);
      ctx.quadraticCurveTo(240, 104 - left * 1.6, 270, 104);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(360, 104);
      ctx.quadraticCurveTo(390, 104 - right * 1.6, 420, 104);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(198, 106);
      ctx.lineTo(282, 106);
      ctx.moveTo(348, 106);
      ctx.lineTo(432, 106);
      ctx.stroke();
      spoon(ctx, 300 + (k - 0.5) * 60, 52, -0.9 + k * 0.5, 1);
      break;
    }
    case 'chap-6': {
      // 温壶：热水注进空壶，壶壁挂上水汽。
      pot(ctx, 250, 112, 1, 0.25 + 0.1 * Math.sin(loop * Math.PI));
      pourStream(ctx, 390, 46, 268, 78, 2.6);
      steam(ctx, 250, 64, loop);
      break;
    }
    case 'chap-7': {
      // 计时：沙漏里的沙流完一格，记录这一轮用时。
      const g = clamp(loop, 0, 1);
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.fillStyle = C.porcelain;
      ctx.beginPath();
      ctx.moveTo(252, 48);
      ctx.lineTo(308, 48);
      ctx.lineTo(288, 80);
      ctx.lineTo(308, 112);
      ctx.lineTo(252, 112);
      ctx.lineTo(272, 80);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(258, 52);
      ctx.lineTo(302, 52);
      ctx.lineTo(282, 52 + 22 * g);
      ctx.lineTo(278, 52 + 22 * g);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(278, 108);
      ctx.lineTo(282, 108);
      ctx.lineTo(288, 108 - 18 * g);
      ctx.lineTo(272, 108 - 18 * g);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(280, 76);
      ctx.lineTo(280, 90);
      ctx.stroke();
      break;
    }
    case 'chap-8': {
      // 装滤网：滤网从上方落下，扣进壶口。
      const p = easeOutCubic(clamp(loop / 0.45, 0, 1));
      pot(ctx, 280, 112, 1, 0.5);
      const y = 30 + p * 34;
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(300, y);
      ctx.lineTo(318, y - 12);
      ctx.stroke();
      ctx.fillStyle = '#d9cbb0';
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(280, y, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 0.9;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(280 + i * 9, y - 5);
        ctx.lineTo(280 + i * 9, y + 5);
        ctx.stroke();
      }
      break;
    }
    case 'chap-9': {
      // 撇沫：小勺沿杯口走一圈，浮沫被推到杯沿。
      cup(ctx, 300, 112, 1.6, 0.7, C.tea);
      const k = 0.5 + 0.5 * Math.sin(loop * Math.PI * 2);
      const sx = 266 + k * 68;
      const sy = 74 + Math.sin(k * Math.PI) * -6;
      spoon(ctx, sx, sy, -1.2 + k * 0.8, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(278 + i * 11, 84 - i * 0.4, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'chap-10': {
      // 举牌：评分牌升起，三只杯子排在桌面上。
      cup(ctx, 180, 112, 0.95, 0.55, C.tea);
      cup(ctx, 240, 112, 0.95, 0.62, C.tea);
      cup(ctx, 300, 112, 0.95, 0.5, C.tea);
      const p = easeOutCubic(clamp(loop * 1.2, 0, 1));
      const y = 112 - p * 58;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      roundRect(ctx, 372, y - 30, 86, 40, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.font = '600 20px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('76.1', 415, y - 3);
      ctx.textAlign = 'left';
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(415, y + 10);
      ctx.lineTo(415, 112);
      ctx.stroke();
      break;
    }
    default:
      break;
  }
}

export const AnaTea: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapterRef = useRef(chapterId);
  chapterRef.current = chapterId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const startAt = performance.now();
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      const dur = DURATION[chapterRef.current] || 2800;
      const t = reduce ? 0.62 : ((now - startAt) % dur) / dur;
      render(ctx, chapterRef.current, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = window.requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`ana-${chapterId}`} ref={canvasRef} width={W} height={H} />;
};

export default AnaTea;
