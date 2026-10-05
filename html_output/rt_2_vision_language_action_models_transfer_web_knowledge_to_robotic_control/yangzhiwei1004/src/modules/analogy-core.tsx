import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// analogy-core — the single shared 560x140 automatic analogy animation widget.
// Every chapter's AnalogyCard points at this componentId; the scene is selected
// by `chapterId` so the ten chapters stay inside ONE kitchen theme while each
// shows a different simple action. One moving subject (a hand), at most two
// static props, continuous looped motion, pauses off-screen. No replay controls.
// Semantic colors only: red=failure, blue=current/guidance, green=success,
// orange=emphasis, purple=auxiliary (contract.md §5).
// ============================================================================

const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0',
  counter: '#e7e3d8',
  counterEdge: '#cfc8b6',
  envLight: '#b8c9a7',
  flame: '#f07e47',
  steam: 'rgba(104,119,143,0.35)',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

// ---- shared drawing kit ----
function drawKitchenBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.envLight;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, 0, W, 22);
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.counter;
  ctx.fillRect(0, 96, W, H - 96);
  ctx.strokeStyle = C.counterEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 96);
  ctx.lineTo(W, 96);
  ctx.stroke();
}

function drawPan(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, warm: boolean) {
  ctx.fillStyle = warm ? '#5a5f66' : '#8b9099';
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3f444b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r, cy);
  ctx.lineTo(cx + r + 34, cy - 3);
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#e8c39a';
  ctx.strokeStyle = '#c9a075';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, 13, 9, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 4);
  ctx.lineTo(x + 30, y + 16);
  ctx.lineTo(x + 46, y + 14);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#e8c39a';
  ctx.stroke();
}

function drawPlate(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, done: boolean) {
  ctx.strokeStyle = done ? C.green : '#b6bcc6';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.34, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (done) {
    ctx.fillStyle = 'rgba(34,141,92,0.14)';
    ctx.fill();
  }
}

function drawSaltJar(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt * 0.5);
  ctx.fillStyle = '#dfe4ec';
  ctx.strokeStyle = '#9aa4b4';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-9, -16, 18, 24, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, level: number) {
  if (level <= 0.02) return;
  ctx.strokeStyle = `rgba(240,126,71,${0.35 + 0.5 * level})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, 26 * (0.6 + 0.4 * level), 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(240,126,71,${0.25 + 0.4 * level})`;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 2);
  ctx.quadraticCurveTo(x, y - 12 - 10 * level, x + 8, y - 2);
  ctx.fill();
}

function drawSteam(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, intensity: number) {
  ctx.strokeStyle = C.steam;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.6 + i * 0.33) % 1;
    ctx.globalAlpha = (1 - p) * intensity;
    ctx.beginPath();
    ctx.moveTo(x + i * 10 - 10, y);
    ctx.quadraticCurveTo(x + i * 10 - 4, y - 14 * p, x + i * 10 - 10, y - 26 * p);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawSpoon(ctx: CanvasRenderingContext2D, x: number, y: number, lifted: number) {
  ctx.strokeStyle = '#9aa4b4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 40, y - 26 - lifted * 14);
  ctx.lineTo(x + 6, y - 4 - lifted * 12);
  ctx.stroke();
  ctx.fillStyle = '#c7ccd4';
  ctx.beginPath();
  ctx.ellipse(x + 2, y - 2 - lifted * 12, 7, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.muted) {
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

// ---- per-chapter scene renderers (one action each) ----
function scene(chapterId: string, t: number, ctx: CanvasRenderingContext2D) {
  const cyc = t % 1;
  switch (chapterId) {
    case 'chap-1': {
      // hand drops raw food into a cold pan; plate stays grey
      drawPan(ctx, 240, 104, 62, false);
      drawPlate(ctx, 430, 112, 30, false);
      const drop = clamp(cyc * 2, 0, 1);
      drawHand(ctx, 226, lerp(24, 74, drop));
      ctx.fillStyle = '#b9772f';
      ctx.beginPath();
      ctx.ellipse(232, lerp(30, 100, drop), 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chap-2': {
      // hand drags an instruction card until it aligns with the fridge
      drawFridge(ctx, 360, 40);
      const x = lerp(70, 330, clamp(cyc * 1.6, 0, 1));
      drawCard(ctx, x, 48);
      drawHand(ctx, x + 46, 78);
      if (cyc > 0.62) {
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 20, 60);
        ctx.lineTo(360, 60);
        ctx.stroke();
      }
      break;
    }
    case 'chap-3': {
      // hand points at 8 digits; bars rise one by one
      drawPan(ctx, 150, 106, 50, true);
      for (let i = 0; i < 8; i++) {
        const on = clamp(cyc * 8 - i, 0, 1);
        const bx = 330 + i * 26;
        const h = 8 + 46 * on;
        ctx.fillStyle = i === 7 ? C.orange : on > 0.9 ? C.blue : '#c3c9d3';
        ctx.fillRect(bx, 112 - h, 14, h);
      }
      drawHand(ctx, lerp(80, 320, clamp(cyc * 1.2, 0, 1)), 84);
      break;
    }
    case 'chap-4': {
      // hand tilts a salt jar; grains fall onto a ruler with bins
      drawPan(ctx, 150, 108, 52, true);
      drawSaltJar(ctx, 232, 78, cyc * 2 - 1);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = '#eef2f7';
        ctx.fillRect(300 + i * 15, 96, 9, 26);
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 1;
        ctx.strokeRect(300 + i * 15, 96, 9, 26);
      }
      const px = 300 + Math.floor(((cyc * 0.8 + 0.1) % 1) * 16) * 15 + 4;
      ctx.fillStyle = C.orange;
      ctx.fillRect(px, 96, 2, 26);
      ctx.fillStyle = '#fdf6ee';
      ctx.beginPath();
      ctx.arc(240, 92 + (t * 60) % 14, 1.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chap-5': {
      // hand waits, a Plan bubble shows, then flips the food
      drawPan(ctx, 250, 106, 58, true);
      if (cyc < 0.5) {
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(200, 24, 110, 24, 8);
        ctx.stroke();
        drawLabel(ctx, 212, 40, '打算：翻个面', C.blue);
      }
      drawHand(ctx, 250, lerp(40, 86, clamp((cyc - 0.4) * 2, 0, 1)));
      ctx.fillStyle = '#b9772f';
      ctx.beginPath();
      ctx.ellipse(250 + 18 * clamp((cyc - 0.5) * 2, 0, 1), 100, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chap-6': {
      // hand tastes, then decides; a tick rhythm row below
      drawPan(ctx, 210, 100, 56, true);
      const lift = cyc < 0.5 ? cyc * 2 : (1 - cyc) * 2;
      drawSpoon(ctx, 250, 92, lift);
      drawHand(ctx, 292, 64 - lift * 8);
      for (let i = 0; i < 12; i++) {
        const on = clamp(cyc * 12 - i, 0, 1);
        ctx.fillStyle = on > 0.5 ? C.blue : '#c3c9d3';
        ctx.beginPath();
        ctx.arc(340 + i * 16, 120, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'chap-7': {
      // three pans, hand moves across them; flames differ
      const xs = [110, 250, 390];
      const levels = [0.25, 0.6, 1];
      for (let i = 0; i < 3; i++) {
        drawPan(ctx, xs[i], 104, 42, true);
        drawFlame(ctx, xs[i], 128, levels[i]);
      }
      drawHand(ctx, lerp(110, 390, cyc), 74);
      break;
    }
    case 'chap-8': {
      // hand slides across three fixed kitchen objects; purple link appears
      drawFridge(ctx, 120, 44);
      drawCard(ctx, 250, 52);
      drawPan(ctx, 400, 100, 42, true);
      const p = clamp(cyc * 1.4, 0, 1);
      ctx.strokeStyle = C.purple;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 70);
      ctx.lineTo(lerp(120, 400, p), lerp(70, 96, p));
      ctx.stroke();
      ctx.globalAlpha = 1;
      drawHand(ctx, lerp(120, 400, p), lerp(60, 82, p));
      break;
    }
    case 'chap-9': {
      // hand pours seasoning into two differently-labelled jars
      drawJar(ctx, 180, 100, '128');
      drawJar(ctx, 300, 100, '低');
      const p = clamp(cyc * 1.5, 0, 1);
      drawSaltJar(ctx, lerp(140, 280, p), 66, -0.6);
      drawHand(ctx, lerp(150, 290, p), 52);
      break;
    }
    case 'chap-10':
    default: {
      // hand pushes two plates side by side and withdraws
      const p = clamp(cyc * 1.6, 0, 1);
      drawPlate(ctx, lerp(120, 210, p), 110, 30, true);
      drawPlate(ctx, lerp(440, 330, p), 110, 30, false);
      drawHand(ctx, lerp(180, 470, p), 62);
      break;
    }
  }
}

function drawFridge(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#eef1f5';
  ctx.strokeStyle = C.counterEdge;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(x - 34, y - 12, 68, 60, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c3c9d3';
  ctx.fillRect(x + 24, y + 10, 4, 22);
  drawLabel(ctx, x - 20, y + 12, '冰箱', C.muted);
}

function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(x, y, 46, 30, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.axis;
  ctx.fillRect(x + 7, y + 9, 32, 3);
  ctx.fillRect(x + 7, y + 16, 24, 3);
}

function drawJar(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  ctx.fillStyle = '#dfe4ec';
  ctx.strokeStyle = '#9aa4b4';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(x - 14, y - 34, 28, 40, 5);
  ctx.fill();
  ctx.stroke();
  drawLabel(ctx, x - 6, y - 10, label, C.muted);
}

export const AnalogyCore: React.FC<WidgetProps> = ({ chapterId }) => {
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
    const start0 = performance.now();
    const tick = () => {
      const t = ((performance.now() - start0) / 2600) % 1;
      ctx.clearRect(0, 0, W, H);
      drawKitchenBackdrop(ctx);
      scene(chapterId, t, ctx);
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
  }, [chapterId]);

  return (
    <canvas
      id={`cv-${chapterId}-ana`}
      ref={canvasRef}
      width={W}
      height={H}
      aria-label="厨房类比动画"
    />
  );
};

export default AnalogyCore;
