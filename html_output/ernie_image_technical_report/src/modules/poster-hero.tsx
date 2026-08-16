import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearDesk, drawSceneLabel, posterColor } from './poster-kit';

const W = 272;
const H = 190;
const DURATION = 4200;

const INK = posterColor('text');
const MUTED = posterColor('muted');
const BORDER = posterColor('border');
const BLUE = posterColor('current');
const GREEN = posterColor('success');
const RED = posterColor('failure');
const ORANGE = posterColor('emphasis');

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 6 * Math.cos(angle - Math.PI / 6), y2 - 6 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 6 * Math.cos(angle + Math.PI / 6), y2 - 6 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPaperField(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.fillRect(10, 27, 252, 125);
  ctx.strokeRect(10.5, 27.5, 251, 124);
}

function drawOldProof(ctx: CanvasRenderingContext2D, progress: number) {
  const q = easeInOutQuad(progress);
  clearDesk(ctx, W, H);
  drawSceneLabel(ctx, '传统思路 · 提高参数规模', 14, 13, MUTED);
  drawPaperField(ctx);

  const size = 48 + q * 22;
  const x = 73 - size / 2;
  const y = 87 - size / 2;
  ctx.save();
  for (let layer = 2; layer >= 0; layer -= 1) {
    const offset = layer * 4;
    ctx.fillStyle = layer === 0 ? '#eef3fb' : '#ffffff';
    ctx.strokeStyle = layer === 0 ? BLUE : BORDER;
    ctx.lineWidth = layer === 0 ? 2.5 : 1;
    ctx.fillRect(x - offset, y - offset, size, size);
    ctx.strokeRect(x - offset + 0.5, y - offset + 0.5, size - 1, size - 1);
  }
  ctx.fillStyle = BLUE;
  ctx.font = '700 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('模型', 73, 82);
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText('参数 ↑', 73, 99);
  ctx.textAlign = 'left';
  ctx.restore();

  drawArrow(ctx, 112, 87, 143, 87, BLUE);
  ['复杂指令', '文字渲染', '审美质量'].forEach((label, index) => {
    const yCard = 43 + index * 31;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = RED;
    ctx.lineWidth = 1.5;
    ctx.fillRect(151, yCard, 96, 23);
    ctx.strokeRect(151.5, yCard + 0.5, 95, 22);
    ctx.fillStyle = INK;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText(label, 160, yCard + 16);
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(236, yCard + 11.5, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = MUTED;
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.fillText('仍需专项数据与监督', 151, 142);
  ctx.fillText('计算需求', 20, 166);
  ctx.fillStyle = 'rgba(215,222,234,0.9)';
  ctx.fillRect(72, 158, 170, 10);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(72, 158, 70 + q * 100, 10);
}

function drawNewProof(ctx: CanvasRenderingContext2D, progress: number) {
  const q = easeInOutQuad(progress);
  clearDesk(ctx, W, H);
  drawSceneLabel(ctx, 'ERNIE 思路 · 完整训练链路', 14, 13, MUTED);
  drawPaperField(ctx);

  const stages = ['数据', '训练', '对齐', '蒸馏', '评估'];
  const activeProgress = q * stages.length;
  stages.forEach((label, index) => {
    const x = 15 + index * 49;
    const active = activeProgress >= index + 0.25;
    if (index < stages.length - 1) {
      ctx.strokeStyle = activeProgress >= index + 1 ? GREEN : BORDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 42, 60);
      ctx.lineTo(x + 49, 60);
      ctx.stroke();
    }
    ctx.fillStyle = active ? '#ecfdf5' : '#f3f6fa';
    ctx.strokeStyle = active ? GREEN : BORDER;
    ctx.lineWidth = active ? 2 : 1;
    ctx.fillRect(x, 45, 42, 30);
    ctx.strokeRect(x + 0.5, 45.5, 41, 29);
    ctx.fillStyle = active ? GREEN : MUTED;
    ctx.font = `${active ? '700' : '500'} 11px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + 21, 64);
  });

  drawArrow(ctx, 136, 80, 136, 98, activeProgress >= 4.5 ? GREEN : BLUE);
  const completed = q > 0.82;
  ctx.fillStyle = completed ? '#ecfdf5' : '#eef3fb';
  ctx.strokeStyle = completed ? GREEN : BLUE;
  ctx.lineWidth = completed ? 2.5 : 1.5;
  ctx.fillRect(72, 99, 128, 42);
  ctx.strokeRect(72.5, 99.5, 127, 41);
  ctx.fillStyle = completed ? GREEN : BLUE;
  ctx.font = '700 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('8B 单流 DiT', 136, 117);
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText(completed ? '完整链路共同提升能力' : '链路逐项接入', 136, 133);
  ctx.textAlign = 'left';

  ctx.fillStyle = completed ? GREEN : MUTED;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText(completed ? '✓ 能力提升来自系统协同' : '逐段检查监督来源', 64, 168);
}

export const PosterHeroWidget: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motion.matches;
    let visible = false;
    let raf: number | null = null;

    const paint = (progress: number) => {
      if (isNew) drawNewProof(ctx, progress);
      else drawOldProof(ctx, progress);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const tick = (time: number) => {
      paint((time % DURATION) / DURATION);
      if (visible && !reducedMotion) raf = requestAnimationFrame(tick);
      else raf = null;
    };
    const start = () => {
      visible = true;
      if (reducedMotion) paint(1);
      else if (raf === null) raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      visible = false;
      stop();
    };
    const motionChange = () => {
      reducedMotion = motion.matches;
      stop();
      if (visible) start();
    };

    paint(reducedMotion ? 1 : 0);
    const disconnect = observeCanvas(canvas, start, pause);
    motion.addEventListener?.('change', motionChange);
    return () => {
      stop();
      disconnect();
      motion.removeEventListener?.('change', motionChange);
    };
  }, [isNew]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label={
        isNew
          ? 'ERNIE 思路：数据、训练、对齐、蒸馏和评估五个环节依次点亮，并共同作用于 8B 单流 DiT。'
          : '传统思路：模型参数规模逐渐提高，同时计算需求上升；复杂指令、文字渲染和审美质量仍需要专项数据与监督。'
      }
    />
  );
};

export default PosterHeroWidget;
