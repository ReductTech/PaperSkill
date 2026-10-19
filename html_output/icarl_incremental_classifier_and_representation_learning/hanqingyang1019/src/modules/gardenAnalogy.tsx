import React, { useEffect, useRef } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// One shared 560x140 life animation for every chapter's analogy card.
// Theme: a small garden. Each chapter plays one continuous action with one
// moving subject, one verb and one visible goal (contract §4).
const W = 560;
const H = 140;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const WOOD = '#92400e';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const TEXT = '#21324a';

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function pot(ctx: CanvasRenderingContext2D, cx: number, base: number, w = 44, h = 24): void {
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, base - h);
  ctx.lineTo(cx + w / 2, base - h);
  ctx.lineTo(cx + w / 2 - 7, base);
  ctx.lineTo(cx - w / 2 + 7, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = DARK;
  ctx.fillRect(cx - w / 2, base - h - 4, w, 5);
}

function sprout(ctx: CanvasRenderingContext2D, x: number, base: number, h: number, color: string, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x - 4, base - h * 0.55, x + 2, base - h);
  ctx.stroke();
  ctx.fillStyle = color;
  [[x + 3, base - h * 0.55, -0.5], [x - 2, base - h * 0.78, -2.5]].forEach(([lx, ly, a]) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(8, 0, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, ch: number, t: number): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(184,201,167,0.45)';
  ctx.fillRect(0, H - 20, W, 20);
  const p = ease(t);

  switch (ch) {
    case 1: {
      // new sprout is transplanted into the only pot; the old sprout fades
      const x = 90 + p * 190;
      const y = 20 + p * 94;
      pot(ctx, 280, 120);
      sprout(ctx, 280, 118, 30 + p * 26, BLUE);
      sprout(ctx, 200, 120, 34, RED, 1 - p * 0.85);
      sprout(ctx, x, y, 26, GREEN);
      break;
    }
    case 2: {
      // a beam of light sweeps across one leaf, revealing its veins
      ctx.save();
      ctx.translate(280, 78);
      ctx.rotate(-0.25);
      ctx.fillStyle = LIGHT;
      ctx.beginPath();
      ctx.ellipse(0, 0, 70, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 1.6;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-64, 0);
        ctx.quadraticCurveTo(0, i * 9, 64, 0);
        ctx.stroke();
      }
      ctx.restore();
      const bx = 120 + p * 320;
      ctx.fillStyle = 'rgba(240,126,71,0.16)';
      ctx.fillRect(bx - 8, 24, 16, 96);
      break;
    }
    case 3: {
      // a new shoot is grafted onto the old rootstock
      sprout(ctx, 260, 120, 52, WOOD);
      const x = 400 - p * 130;
      sprout(ctx, x, 120, 48, GREEN);
      if (p > 0.8) {
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 4;
        ctx.strokeRect(252, 66, 18, 10);
      }
      break;
    }
    case 4: {
      // one flower drifts to the most similar bunch
      const bunches = [140, 280, 420];
      bunches.forEach((bx, i) => {
        sprout(ctx, bx, 120, 40, [BLUE, '#7c3aed', ORANGE][i]);
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = [BLUE, '#7c3aed', ORANGE][i];
          ctx.beginPath();
          ctx.arc(bx - 10 + k * 10, 72 - (k % 2) * 6, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      const target = bunches[1];
      const fx = 480 - p * (480 - target);
      const fy = 40 + Math.sin(p * Math.PI) * -18 + p * 30;
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.arc(fx, fy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy + 18);
      ctx.stroke();
      break;
    }
    case 5: {
      // a band is wound around the graft joint
      sprout(ctx, 250, 120, 55, WOOD);
      sprout(ctx, 262, 120, 60, GREEN);
      const a = p * Math.PI * 2;
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(258, 62, 16, 6, a, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 6: {
      // a vine climbs and wraps the nearest crossbar
      ctx.strokeStyle = WOOD;
      ctx.lineWidth = 5;
      ctx.strokeRect(250, 30, 120, 6);
      ctx.beginPath();
      ctx.moveTo(310, 120);
      ctx.quadraticCurveTo(250 + p * 60, 90 - p * 30, 310, 120 - p * 84);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.arc(310, 120 - p * 84, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 7: {
      // two fertilisers are poured in a balanced ratio
      pot(ctx, 320, 120);
      ctx.save();
      ctx.translate(150, 60);
      ctx.rotate(-0.5 * p);
      ctx.fillStyle = DARK;
      ctx.fillRect(-26, -18, 52, 26);
      ctx.fillRect(20, -14, 18, 6);
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        const fy = 40 + ((p * 80 + i * 20) % 80);
        ctx.fillStyle = i % 2 ? BLUE : ORANGE;
        ctx.fillRect(250 + i * 13, fy, 3, 8);
      }
      break;
    }
    case 8: {
      // a crossbar is lowered onto the standing pole
      ctx.strokeStyle = WOOD;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(190, 120);
      ctx.lineTo(190, 30);
      ctx.stroke();
      const y = 20 + p * 34;
      ctx.fillStyle = WOOD;
      ctx.fillRect(150, y, 90, 6);
      if (p > 0.9) {
        ctx.fillStyle = GREEN;
        ctx.beginPath();
        ctx.arc(195, y + 3, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 9: {
      // the most representative cutting is lifted out and kept
      pot(ctx, 200, 120);
      [170, 200, 230].forEach((x, i) => sprout(ctx, x, 118, 46 - i * 6, i === 1 ? GREEN : DARK));
      const x = 230 + p * 170;
      const y = 74 - p * 46;
      sprout(ctx, x, y + 46, 40, GREEN);
      break;
    }
    default: {
      // two rows of plants: the right row keeps growing
      for (let i = 0; i < 3; i++) {
        sprout(ctx, 150 + i * 40, 120, 26, RED);
        sprout(ctx, 350 + i * 40, 120, 26 + p * 34, GREEN);
      }
      break;
    }
  }

  // quiet ground line + one small caption mark
  ctx.strokeStyle = 'rgba(118,144,106,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 120);
  ctx.lineTo(540, 120);
  ctx.stroke();
  ctx.fillStyle = 'rgba(33,50,74,0.18)';
  ctx.fillRect(20, 132, 40 * (0.2 + 0.8 * p), 3);
}

export const GardenAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ch = Number((chapterId || 'chap-1').replace('chap-', '')) || 1;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = W * dpr;
    c.height = H * dpr;
    c.style.width = W + 'px';
    c.style.height = H + 'px';
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) % 3200) / 3200;
      draw(ctx, ch, t);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const startLoop = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c, startLoop, stop);
    c.classList.add('is-ready');
    startLoop();
    return () => {
      stop();
      disconnect();
    };
  }, [ch]);

  return <canvas ref={ref} width={W} height={H} />;
};

export default GardenAnalogy;
