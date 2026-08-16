import { useEffect, useRef } from 'react';
import { easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { CanvasWidgetProps } from './case-file-analogy';
import {
  COLORS,
  drawArrow,
  drawFile,
  drawMagnifier,
  drawNode,
  drawSeal,
  drawText,
  roundedRect,
} from './case-file-analogy';

function begin(canvas: HTMLCanvasElement) {
  const ctx = setupCanvas(canvas, 520, 240);
  canvas.style.width = '100%';
  canvas.style.maxWidth = '520px';
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = '13 / 6';
  ctx.clearRect(0, 0, 520, 240);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, 520, 240);
  return ctx;
}

function drawHero(ctx: CanvasRenderingContext2D, isNew: boolean, phase: number) {
  const p = easeInOutQuad(phase);
  roundedRect(ctx, 14, 14, 492, 212, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = isNew ? COLORS.green : COLORS.orange;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawFile(ctx, 30, 36, 176, 164, '同一密钥任务');
  drawText(ctx, '系统：密钥是 xhf2l1jk', 46, 92, { size: 12, color: COLORS.text });
  drawText(ctx, '要求：保持隐藏', 46, 115, { size: 12, color: COLORS.red, weight: 700 });
  drawText(ctx, '输出标签：D', 46, 160, { size: 13, color: COLORS.red, weight: 700 });

  if (!isNew) {
    drawText(ctx, '只看回答', 352, 43, { size: 14, align: 'center', color: COLORS.orange, weight: 700 });
    roundedRect(ctx, 244, 75, 216, 76, 7);
    ctx.fillStyle = '#fff9ef';
    ctx.fill();
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawText(ctx, 'D / ND', 352, 105, { size: 24, align: 'center', color: COLORS.red, weight: 800 });
    drawText(ctx, '内部路径不可见', 352, 135, { size: 12, align: 'center', color: COLORS.orange, weight: 700 });
    drawMagnifier(ctx, lerp(270, 430, p), 182 + Math.sin(phase * Math.PI * 2) * 3, COLORS.orange);
    drawSeal(ctx, 476, 44, false, '盲区');
    return;
  }

  drawText(ctx, '转码器归因图', 352, 43, { size: 14, align: 'center', color: COLORS.green, weight: 700 });
  const nodes = [
    { x: 260, y: 118, label: 'token' },
    { x: 326, y: 82, label: '前层特征' },
    { x: 394, y: 140, label: '后层特征' },
    { x: 458, y: 98, label: '输出' },
  ];
  nodes.forEach((node, index) => drawNode(ctx, node.x, node.y, node.label, p > index * 0.18, index === 3 && p > 0.82, 11));
  if (p > 0.2) drawArrow(ctx, 272, 112, 315, 87, COLORS.blue, 3);
  if (p > 0.43) drawArrow(ctx, 338, 88, 383, 132, COLORS.blue, 3);
  if (p > 0.67) drawArrow(ctx, 406, 133, 447, 104, COLORS.green, 3);
  drawMagnifier(ctx, lerp(254, 448, p), lerp(174, 162, p), COLORS.blue);
  drawText(ctx, '路径可追踪，影响可干预检查', 352, 198, {
    size: 12,
    align: 'center',
    color: COLORS.green,
    weight: 700,
  });
  drawSeal(ctx, 482, 44, p > 0.82, '路径');
}

export function HeroCircuitContrast({ moduleId }: CanvasWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isNew = (moduleId ?? 'old').toLowerCase().includes('new');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let startTime = 0;
    let running = false;

    const animate = (time: number) => {
      if (!running) return;
      if (!startTime) startTime = time;
      const phase = ((time - startTime) % 3000) / 3000;
      const ctx = begin(canvas);
      drawHero(ctx, isNew, phase);
      canvas.classList.add('is-ready');
      frame = requestAnimationFrame(animate);
    };

    const disconnect = observeCanvas(
      canvas,
      () => {
        if (running) return;
        running = true;
        startTime = 0;
        frame = requestAnimationFrame(animate);
      },
      () => {
        running = false;
        cancelAnimationFrame(frame);
      }
    );

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      disconnect();
    };
  }, [isNew]);

  return (
    <canvas
      ref={canvasRef}
      width={520}
      height={240}
      role="img"
      aria-label={isNew ? '转码器归因图能力示意' : '只看回答的可见性局限示意'}
      style={{ display: 'block', width: '100%', maxWidth: 520, height: 'auto', margin: '0 auto' }}
    />
  );
}
