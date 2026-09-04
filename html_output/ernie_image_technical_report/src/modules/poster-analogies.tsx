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
  '8': 3100,
  '9': 3000,
  '10': 3100,
};

const ariaLabels: Record<string, string> = {
  '1': '一把钥匙移向上锁的专业工具箱，打开后显出开放、强大、易用三个目标。',
  '2': '一个光标指向蓝图组件并点亮对应路线。',
  '3': '一张校样卡滑向覆盖与质量的平衡标记。',
  '4': '一个裁切框扩展到标出的分辨率引导线。',
  '5': '一支笔把简短说明改写为用户式请求。',
  '6': '一枚旋钮从红色投机区转向绿色锚定区，并在安全位置稳定下来。',
  '7': '一张校样沿八个函数评估刻度前进到终点。',
  '8': '一支笔沿着方向标记移动，让模糊校样逐渐形成清晰结构。',
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
  const cx = 122;
  const cy = 63;
  const start = -2.68;
  const safe = -0.46;
  const settled = q < 0.86
    ? q / 0.86
    : 1 - Math.sin(((q - 0.86) / 0.14) * Math.PI) * 0.035;
  const angle = start + (safe - start) * settled;

  ctx.fillStyle = 'rgba(33, 50, 74, 0.12)';
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy + 25, 49, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const face = ctx.createRadialGradient(cx - 10, cy - 13, 3, cx, cy, 47);
  face.addColorStop(0, '#ffffff');
  face.addColorStop(0.72, '#f4f7f0');
  face.addColorStop(1, '#d7deea');
  ctx.fillStyle = face;
  ctx.strokeStyle = posterColor('current');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.strokeStyle = posterColor('failure');
  ctx.beginPath();
  ctx.arc(cx, cy, 36, start, -1.56);
  ctx.stroke();
  ctx.strokeStyle = posterColor('input');
  ctx.beginPath();
  ctx.arc(cx, cy, 36, -1.48, -1.02);
  ctx.stroke();
  ctx.strokeStyle = posterColor('success');
  ctx.beginPath();
  ctx.arc(cx, cy, 36, -0.94, safe);
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i <= 10; i += 1) {
    const tickAngle = start + (safe - start) * (i / 10);
    const inner = 26;
    const outer = i === 0 || i === 10 ? 31 : 29;
    ctx.strokeStyle = i < 5 ? posterColor('failure') : i > 7 ? posterColor('success') : posterColor('muted');
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = i === 0 || i === 10 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(tickAngle) * inner, cy + Math.sin(tickAngle) * inner);
    ctx.lineTo(cx + Math.cos(tickAngle) * outer, cy + Math.sin(tickAngle) * outer);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const needleColor = settled > 0.78
    ? posterColor('success')
    : settled < 0.48
    ? posterColor('failure')
    : posterColor('input');
  ctx.strokeStyle = needleColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(29, 0);
  ctx.stroke();
  ctx.fillStyle = needleColor;
  ctx.beginPath();
  ctx.arc(29, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const hub = ctx.createRadialGradient(cx - 3, cy - 4, 1, cx, cy, 10);
  hub.addColorStop(0, '#ffffff');
  hub.addColorStop(0.25, posterColor('border'));
  hub.addColorStop(1, posterColor('current'));
  ctx.fillStyle = hub;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();

  const targetX = cx + Math.cos(safe) * 36;
  const targetY = cy + Math.sin(safe) * 36;
  ctx.strokeStyle = `rgba(34, 141, 92, ${0.18 + Math.max(0, settled - 0.74) * 2.2})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(targetX, targetY, 7 + settled * 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = posterColor('failure');
  ctx.font = '700 10px "Segoe UI", sans-serif';
  ctx.fillText('投机', 51, 112);
  ctx.fillStyle = posterColor('success');
  ctx.fillText('锚定', 169, 112);
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

function scene8(ctx: CanvasRenderingContext2D, progress: number) {
  const q = phase(progress);
  drawPoster(ctx, 75, 21, 98, 82, 0.22 + q * 0.73, q > 0.84 ? posterColor('success') : posterColor('current'));
  line(ctx, 32, 98, 72, 72, posterColor('border'), 2, true);
  line(ctx, 72, 72, 132, 52, posterColor('input'), 2);
  drawTool(ctx, 'pen', 35 + q * 103, 96 - q * 46, 0.78, posterColor('input'), true);
  if (q > 0.86) drawTargetMark(ctx, 201, 61, posterColor('success'), q);
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
    case '8': scene8(ctx, progress); break;
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
