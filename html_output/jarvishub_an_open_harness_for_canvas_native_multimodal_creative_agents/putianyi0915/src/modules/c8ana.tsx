import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 类比卡「把三条边收拢打成一个结」（560×140，2.8 秒循环）
// 一个主体（一只手）+ 一个动作（把三条边向中心收拢并绕两圈打结）+ 一个目标（合成一个整体）。
// 织片与线球不动，只有边与那根打结的线在动。

const W = 560;
const H = 140;
const CYCLE = 2800;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN = '#b8c9a7';
const YARN_DEEP = '#76906a';
const ORANGE = '#f07e47';
const BLUE = '#27446e';
const INK = '#21324a';
const SUB = '#68778f';

const PANEL_X = 150;
const PANEL_Y = 28;
const PANEL_W = 260;
const PANEL_H = 82;
const CX = PANEL_X + PANEL_W / 2;
const CY = PANEL_Y + PANEL_H / 2;
const GROUND_Y = 118;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(W, GROUND_Y);
  ctx.stroke();
}

/** 一个针织线圈：V 字形。 */
function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.46);
  ctx.quadraticCurveTo(cx - s * 0.18, cy + s * 0.34, cx, cy + s * 0.5);
  ctx.quadraticCurveTo(cx + s * 0.18, cy + s * 0.34, cx + s * 0.5, cy - s * 0.46);
  ctx.stroke();
  ctx.restore();
}

/** 织片本体：一块带线圈阵列的底面，本身不动。 */
function drawPanel(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  roundRectPath(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 7);
  ctx.fillStyle = 'rgba(184,201,167,0.28)';
  ctx.fill();
  ctx.restore();

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      const cx = PANEL_X + 18 + col * 28;
      const cy = PANEL_Y + 17 + row * 27;
      drawKnit(ctx, cx, cy, 18, YARN_DEEP, 2);
    }
  }
}

/** 一只手：握住打结线的一端并向外拉。 */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  ctx.fillStyle = '#f2cdab';
  ctx.strokeStyle = '#c08f6a';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, -8, -13, 26, 26, 9);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    roundRectPath(ctx, -28, -12 + i * 8, 24, 6.5, 3.2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, time: number): void {
  clearScene(ctx);

  const p = (time % CYCLE) / CYCLE;
  const gather = easeInOutQuad(clamp(p / 0.5, 0, 1));
  const wrap = clamp((p - 0.5) / 0.3, 0, 1);
  const tighten = easeOutCubic(clamp((p - 0.72) / 0.28, 0, 1));

  // 桌面上的线球：环境物件，始终不动
  ctx.save();
  ctx.beginPath();
  ctx.arc(482, 108, 20, 0, Math.PI * 2);
  ctx.fillStyle = YARN;
  ctx.fill();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  drawPanel(ctx);

  // 三条边向中心收拢：左、右、下
  const inset = gather * 62;
  const bottomLift = gather * 26;
  ctx.save();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(PANEL_X + inset, PANEL_Y + gather * 8);
  ctx.lineTo(PANEL_X + inset, PANEL_Y + PANEL_H - bottomLift);
  ctx.moveTo(PANEL_X + PANEL_W - inset, PANEL_Y + gather * 8);
  ctx.lineTo(PANEL_X + PANEL_W - inset, PANEL_Y + PANEL_H - bottomLift);
  ctx.moveTo(PANEL_X + inset, PANEL_Y + PANEL_H - bottomLift);
  ctx.lineTo(PANEL_X + PANEL_W - inset, PANEL_Y + PANEL_H - bottomLift);
  ctx.stroke();
  ctx.restore();

  // 三条边收拢后会到一处：一个小合点
  const px = CX;
  const py = PANEL_Y + PANEL_H - bottomLift - 2;
  const gx = lerp(px, CX, gather);
  const gy = lerp(py, CY, gather);

  // 打结的线：从织片底部引出，绕两圈后收紧
  const loopR = lerp(44, 13, tighten);
  const loopAlpha = wrap > 0.02 ? 1 : 0;
  ctx.save();
  ctx.globalAlpha = loopAlpha * (0.35 + 0.65 * wrap);
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(gx - 10, gy + 30);
  ctx.quadraticCurveTo(gx - 26, gy + 12, gx, gy - 16);
  ctx.stroke();
  ctx.restore();

  if (wrap > 0.02) {
    ctx.save();
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(gx, gy, loopR, loopR * 0.66, 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(gx, gy, loopR * 0.92, loopR * 0.6, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 结：收紧后在一个点上收紧成一个小结
  ctx.save();
  ctx.fillStyle = tighten > 0.55 ? ORANGE : YARN_DEEP;
  ctx.beginPath();
  ctx.arc(gx, gy, 4 + 5 * tighten, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 线尾：被手向外拉住，随收紧变短
  const tailX = gx + lerp(30, 96, tighten) - 40 * (1 - tighten);
  ctx.save();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.quadraticCurveTo(gx + 40, gy + 18 - tighten * 10, tailX, gy + 6 - tighten * 16);
  ctx.stroke();
  ctx.restore();

  drawHand(ctx, tailX + 26, gy + 2 - tighten * 16);

  // 最多两个短标签
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText('三边收拢', 40, 24);
  ctx.fillStyle = SUB;
  ctx.fillText('一结固定', 428, 24);
  ctx.restore();
}

export const Ch8Analogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const tick = () => {
      render(ctx, performance.now());
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch8Analogy;
