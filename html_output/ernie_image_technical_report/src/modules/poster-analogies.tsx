import React, { useEffect, useRef } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearDesk,
  drawArrow,
  drawBriefCard,
  drawNode,
  drawPoster,
  drawProofFrame,
  drawTargetMark,
  drawTool,
  posterColor,
} from './poster-kit';

const W = 244;
const H = 130;

const durations: Record<string, number> = {
  '1': 3000,
  '2': 2900,
  '3': 3200,
  '4': 3000,
  '5': 3200,
  '6': 3000,
  '7': 3200,
  '9': 3000,
  '10': 3100,
};

const ariaLabels: Record<string, string> = {
  '1': '一把钥匙移向上锁的专业工具箱，打开后显出开放、强大、易用三个目标。',
  '2': '一个光标指向蓝图组件并点亮对应路线。',
  '3': '一张校样卡滑向覆盖与质量的平衡标记。',
  '4': '一个裁切框扩展到标出的分辨率引导线。',
  '5': '一支笔把简短说明改写为用户式请求。',
  '6': '一个平衡旋钮转到锚定后的安全位置。',
  '7': '一张校样沿八个函数评估刻度前进到终点。',
  '9': '一只放大镜比较一对校样并停在选择上。',
  '10': '一个审批章压到当前协议的结果卡上。',
};

function normalizedChapterId(chapterId: string) {
  return chapterId.match(/\d+/)?.[0] ?? chapterId;
}

function phase(progress: number, start = 0.08, end = 0.86) {
  return easeInOutQuad(clamp((progress - start) / (end - start), 0, 1));
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  dashed = false
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function scene1(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  const open = q > 0.72;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = open ? posterColor('success') : posterColor('current');
  ctx.lineWidth = 2;
  ctx.fillRect(77, 49, 118, 58);
  ctx.strokeRect(77.5, 49.5, 117, 57);
  const lidLift = open ? 12 * Math.min(1, (q - 0.72) / 0.2) : 0;
  ctx.beginPath();
  ctx.moveTo(77, 49);
  ctx.lineTo(94, 35 - lidLift * 0.2);
  ctx.lineTo(188, 35 - lidLift);
  ctx.lineTo(195, 49);
  ctx.stroke();
  ctx.fillStyle = open ? posterColor('success') : posterColor('failure');
  ctx.fillRect(126, 65, 20, 20);
  ctx.strokeStyle = open ? posterColor('success') : posterColor('failure');
  ctx.beginPath();
  ctx.arc(136, 65, 8, Math.PI, 0);
  ctx.stroke();
  if (open) {
    ctx.fillStyle = posterColor('success');
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('开放', 101, 99);
    ctx.fillText('强大', 136, 99);
    ctx.fillText('易用', 171, 99);
  }
  ctx.restore();

  const keyX = 27 + q * 93;
  const keyY = 83 - Math.sin(q * Math.PI) * 15;
  ctx.save();
  ctx.strokeStyle = posterColor('input');
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(keyX, keyY, 8, 0, Math.PI * 2);
  ctx.moveTo(keyX + 8, keyY);
  ctx.lineTo(keyX + 27, keyY);
  ctx.lineTo(keyX + 27, keyY + 8);
  ctx.moveTo(keyX + 19, keyY);
  ctx.lineTo(keyX + 19, keyY + 6);
  ctx.stroke();
  ctx.restore();
}

function scene2(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  drawNode(ctx, 24, 30, 48, 28, '文字', posterColor('border'));
  drawNode(ctx, 98, 30, 48, 28, '潜变量', posterColor('border'));
  drawNode(ctx, 172, 30, 48, 28, 'DiT', q > 0.72 ? posterColor('success') : posterColor('border'), q > 0.72);
  drawArrow(ctx, 72, 44, 97, 44, posterColor('current'), 2);
  drawArrow(ctx, 146, 44, 171, 44, q > 0.46 ? posterColor('current') : posterColor('border'), q > 0.46 ? 3 : 2);
  drawTool(ctx, 'cursor', 42 + q * 151, 88 - q * 36, 0.8, posterColor('input'), true);
}

function scene3(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  line(ctx, 119, 21, 119, 101, posterColor('current'), 2);
  line(ctx, 62, 62, 180, 62, posterColor('success'), 2);
  drawTargetMark(ctx, 119, 62, posterColor('success'), q);
  drawPoster(ctx, 27 + q * 75, 77 - q * 34, 40, 28, 0.5 + q * 0.45, posterColor('input'));
}

function scene4(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  drawPoster(ctx, 78, 20, 91, 82, 0.35 + q * 0.65, posterColor('current'));
  const inset = 20 - q * 12;
  drawProofFrame(ctx, 78 + inset, 20 + inset, 91 - inset * 2, 82 - inset * 2, q > 0.84 ? posterColor('success') : posterColor('input'));
  drawTool(ctx, 'crop', 169 - inset, 102 - inset, 0.7, posterColor('input'), true);
  line(ctx, 191, 28, 191, 96, posterColor('border'), 1, true);
}

function scene5(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  drawBriefCard(ctx, 37, 21, 132, 80, 1 + Math.round(q * 3), q > 0.78 ? posterColor('success') : posterColor('current'));
  drawTool(ctx, 'pen', 70 + q * 106, 83 - q * 39, 0.82, posterColor('input'), true);
  if (q > 0.83) drawTargetMark(ctx, 196, 62, posterColor('success'), q);
}

function scene6(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  const cx = 88;
  const cy = 64;
  ctx.save();
  ctx.strokeStyle = posterColor('border');
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 31, Math.PI * 0.76, Math.PI * 2.24);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-1.7 + q * 2.15);
  drawTool(ctx, 'knob', 0, 0, 1, q > 0.78 ? posterColor('success') : posterColor('input'), true);
  ctx.restore();
  drawPoster(ctx, 156, 34, 55, 58, 0.55 + q * 0.4, posterColor('current'));
  if (q > 0.82) drawProofFrame(ctx, 151, 29, 65, 68, posterColor('success'));
}

function scene7(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  const left = 24;
  const right = 200;
  line(ctx, left, 91, right, 91, posterColor('border'), 2);
  for (let i = 0; i < 8; i += 1) {
    const x = left + (right - left) * (i / 7);
    line(ctx, x, 84, x, 98, i / 7 <= q ? posterColor(i === 7 && q > 0.93 ? 'success' : 'current') : posterColor('border'), i / 7 <= q ? 3 : 2);
  }
  const proofX = left + (right - left) * q - 19;
  drawPoster(ctx, proofX, 40, 38, 32, 0.4 + q * 0.55, posterColor('current'));
  if (q > 0.93) drawTargetMark(ctx, 218, 55, posterColor('success'), q);
}

function scene9(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  drawPoster(ctx, 32, 28, 69, 66, 0.7, posterColor('current'));
  drawPoster(ctx, 143, 28, 69, 66, 0.78, posterColor('current'));
  const loupeX = 55 + q * 113;
  drawTool(ctx, 'loupe', loupeX, 58, 0.8, posterColor('auxiliary'), true);
  if (q > 0.82) drawProofFrame(ctx, 139, 24, 77, 74, posterColor('success'));
}

function scene10(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  drawBriefCard(ctx, 61, 38, 123, 63, 3, posterColor('current'));
  const stampY = 28 + q * 48;
  drawTool(ctx, 'stamp', 123, stampY, 0.9, q > 0.78 ? posterColor('success') : posterColor('auxiliary'), true);
  if (q > 0.82) drawTargetMark(ctx, 155, 70, posterColor('success'), q);
}

function drawScene(ctx: CanvasRenderingContext2D, chapterId: string, progress: number) {
  clearDesk(ctx, W, H);
  switch (chapterId) {
    case '1': scene1(ctx, progress); break;
    case '2': scene2(ctx, progress); break;
    case '3': scene3(ctx, progress); break;
    case '4': scene4(ctx, progress); break;
    case '5': scene5(ctx, progress); break;
    case '6': scene6(ctx, progress); break;
    case '7': scene7(ctx, progress); break;
    case '9': scene9(ctx, progress); break;
    case '10': scene10(ctx, progress); break;
    default:
      drawPoster(ctx, 75, 20, 96, 82, progress, posterColor('current'));
      drawTargetMark(ctx, 196, 62, posterColor('success'), progress);
  }
}

export const PosterAnalogiesWidget: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneId = normalizedChapterId(chapterId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const duration = durations[sceneId] ?? 3000;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motion.matches;
    let visible = false;
    let hovered = false;
    let running = false;
    let raf: number | null = null;
    let elapsedBeforePause = 0;
    let startedAt = performance.now();

    const paint = (progress: number) => {
      drawScene(ctx, sceneId, progress);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const stop = () => {
      if (running) elapsedBeforePause += performance.now() - startedAt;
      running = false;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const tick = (time: number) => {
      if (!running) return;
      paint(((elapsedBeforePause + time - startedAt) % duration) / duration);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!visible || hovered || running) return;
      if (reducedMotion) {
        paint(1);
        return;
      }
      running = true;
      startedAt = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const enterViewport = () => {
      visible = true;
      start();
    };
    const leaveViewport = () => {
      visible = false;
      stop();
    };
    const enterHover = () => {
      hovered = true;
      stop();
    };
    const leaveHover = () => {
      hovered = false;
      start();
    };
    const motionChange = () => {
      reducedMotion = motion.matches;
      stop();
      elapsedBeforePause = 0;
      if (reducedMotion) paint(1);
      else start();
    };

    paint(reducedMotion ? 1 : 0);
    const disconnect = observeCanvas(canvas, enterViewport, leaveViewport);
    canvas.addEventListener('mouseenter', enterHover);
    canvas.addEventListener('mouseleave', leaveHover);
    motion.addEventListener?.('change', motionChange);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('mouseenter', enterHover);
      canvas.removeEventListener('mouseleave', leaveHover);
      motion.removeEventListener?.('change', motionChange);
    };
  }, [sceneId]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label={ariaLabels[sceneId] ?? '打磨复杂海报的单动作类比。'}
    />
  );
};

export default PosterAnalogiesWidget;
