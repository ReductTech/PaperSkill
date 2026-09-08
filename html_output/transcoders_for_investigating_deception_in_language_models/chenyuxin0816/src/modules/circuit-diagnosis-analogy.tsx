import { useEffect, useRef } from 'react';
import { clamp, easeInOutQuad, lerp, observeCanvas } from '../lib/canvasKit';
import {
  COLORS,
  drawArrow,
  drawNode,
  drawText,
  prepareCanvas,
  roundedRect,
  type CanvasWidgetProps,
} from './case-file-analogy';

function chapterNumber(chapterId?: string, moduleId?: string) {
  const match = (chapterId ?? moduleId ?? 'chap-1').match(/(?:chap-)?(\d+)/);
  return clamp(match ? Number(match[1]) : 1, 1, 10);
}
function drawChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  active = false
) {
  roundedRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = active ? '#eef4fb' : '#26384f';
  ctx.fill();
  ctx.strokeStyle = active ? COLORS.blue : '#17263a';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, label, x + width / 2, y + height / 2, {
    size: 11,
    align: 'center',
    color: active ? COLORS.blue : '#ffffff',
    weight: 800,
  });
}

function drawLed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
  label: string,
  color = COLORS.blue
) {
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = active ? color : '#ffffff';
  ctx.fill();
  ctx.strokeStyle = active ? color : COLORS.border;
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.stroke();
  drawText(ctx, label, x, y + 17, { size: 8, align: 'center', color: COLORS.muted });
}

function drawSignal(ctx: CanvasRenderingContext2D, x: number, y: number, color = COLORS.blue) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawFrame(ctx: CanvasRenderingContext2D, title: string) {
  roundedRect(ctx, 8, 8, 228, 114, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawText(ctx, title, 18, 22, { size: 10, color: COLORS.blue, weight: 800 });
}

function drawAnalogy(ctx: CanvasRenderingContext2D, chapter: number, phase: number) {
  const p = easeInOutQuad(phase);
  drawFrame(ctx, chapter === 1 ? '知道，但没有说出' : '黑箱电路检修');

  if (chapter === 1) {
    drawText(ctx, '密钥 xhf2l1jk', 22, 48, { size: 10, weight: 700 });
    drawArrow(ctx, 92, 48, 116, 48, COLORS.blue, 2);
    drawChip(ctx, 121, 35, 54, 28, '模型');
    drawArrow(ctx, 177, 48, 212, 48, COLORS.red, 2);
    drawText(ctx, '不披露', 212, 70, { size: 9, align: 'center', color: COLORS.red, weight: 800 });
    drawText(ctx, '信息已进入模型', 76, 94, { size: 9, align: 'center', color: COLORS.green });
    drawText(ctx, '输出却隐藏答案', 177, 94, { size: 9, align: 'center', color: COLORS.red });
    drawSignal(ctx, lerp(24, 108, p), 48);
    return;
  }

  if (chapter === 2) {
    drawText(ctx, 'h', 22, 67, { size: 12, color: COLORS.blue, weight: 800 });
    drawArrow(ctx, 34, 67, 76, 67, COLORS.blue, 2);
    drawChip(ctx, 82, 44, 80, 46, 'MLP 黑箱');
    drawArrow(ctx, 166, 67, 208, 67, COLORS.blue, 2);
    drawText(ctx, 'y', 218, 67, { size: 12, color: COLORS.blue, weight: 800 });
    drawSignal(ctx, lerp(36, 204, p), 67);
    drawText(ctx, '只看得到输入与输出', 122, 105, { size: 9, align: 'center', color: COLORS.muted });
    return;
  }

  if (chapter === 3) {
    drawText(ctx, 'h', 17, 67, { size: 11, color: COLORS.blue, weight: 800 });
    drawArrow(ctx, 29, 67, 54, 67, COLORS.blue, 2);
    drawChip(ctx, 58, 51, 40, 32, 'Enc', true);
    const activeCount = p < 0.35 ? 0 : p < 0.65 ? 1 : 2;
    drawLed(ctx, 116, 52, activeCount >= 1, 'f₁');
    drawLed(ctx, 136, 72, activeCount >= 2, 'f₂', COLORS.green);
    drawLed(ctx, 116, 90, false, 'f₃');
    drawArrow(ctx, 146, 67, 166, 67, COLORS.blue, 2);
    drawChip(ctx, 169, 51, 40, 32, 'Dec', true);
    drawArrow(ctx, 211, 67, 226, 67, COLORS.blue, 2);
    drawText(ctx, 'ŷ≈y', 222, 96, { size: 9, align: 'center', color: COLORS.green, weight: 800 });
    drawText(ctx, '只有少数 Feature 通道亮起', 122, 111, { size: 9, align: 'center', color: COLORS.muted });
    return;
  }

  if (chapter === 4) {
    const points = [
      { x: 34, y: 70, label: 'token' },
      { x: 88, y: 48, label: 'feature' },
      { x: 146, y: 80, label: 'feature' },
      { x: 204, y: 52, label: 'output' },
    ];
    points.slice(0, -1).forEach((point, index) => {
      const next = points[index + 1];
      drawArrow(ctx, point.x + 9, point.y, next.x - 10, next.y, index < p * 3 ? COLORS.blue : COLORS.border, 2.5);
    });
    points.forEach((point, index) => drawNode(ctx, point.x, point.y, point.label, index <= p * 3, index === 3 && p > 0.9, 8));
    drawText(ctx, '沿有向贡献追到输出', 122, 110, { size: 9, align: 'center', color: COLORS.muted });
    return;
  }

  if (chapter === 5) {
    const stages = ['建图', '种子', '追踪', '干预'];
    stages.forEach((label, index) => {
      const x = 38 + index * 56;
      const active = p * 4 >= index + 0.5;
      drawLed(ctx, x, 64, active, label, active && index === 3 ? COLORS.green : COLORS.blue);
      if (index < 3) drawArrow(ctx, x + 10, 64, x + 45, 64, active ? COLORS.blue : COLORS.border, 2);
    });
    drawText(ctx, p > 0.82 ? '通过翻转规则，候选进入 112 项字典' : '候选仍需通过 Steering 验证', 122, 106, {
      size: 9,
      align: 'center',
      color: p > 0.82 ? COLORS.green : COLORS.muted,
      weight: p > 0.82 ? 800 : 500,
    });
    return;
  }

  if (chapter === 6) {
    const mode = Math.min(2, Math.floor(phase * 3));
    const labels = ['原始', '正向 α=5', '负向 α=5'];
    const colors = [COLORS.blue, COLORS.orange, COLORS.green];
    drawLed(ctx, 66, 61, true, 'Feature', colors[mode]);
    drawText(ctx, labels[mode], 66, 31, { size: 10, align: 'center', color: colors[mode], weight: 800 });
    drawArrow(ctx, 82, 61, 150, 61, colors[mode], 3);
    roundedRect(ctx, 156, 43, 64, 38, 6);
    ctx.fillStyle = mode === 2 ? '#e8f6ee' : mode === 1 ? '#fff4df' : '#eef4fb';
    ctx.fill();
    ctx.strokeStyle = colors[mode];
    ctx.lineWidth = 2;
    ctx.stroke();
    drawText(ctx, mode === 2 ? 'D → ND' : mode === 1 ? 'ND → D?' : '原回答', 188, 62, {
      size: 10,
      align: 'center',
      color: colors[mode],
      weight: 800,
    });
    drawText(ctx, '改变信号，再观察行为是否翻转', 122, 105, { size: 9, align: 'center', color: COLORS.muted });
    return;
  }

  if (chapter === 7) {
    const values = [95, 91, 86];
    values.forEach((value, index) => {
      const y = 44 + index * 21;
      ctx.fillStyle = '#edf1f6';
      ctx.fillRect(36, y, 130, 10);
      ctx.fillStyle = index === 0 ? COLORS.orange : COLORS.blue;
      ctx.fillRect(36, y, 130 * (value / 100) * clamp(p * 1.25 - index * 0.08, 0, 1), 10);
      drawText(ctx, `${value}/100`, 210, y + 5, { size: 9, align: 'right', color: COLORS.text, weight: 700 });
    });
    drawText(ctx, '反复出现的 Feature 先进入 Top-10', 122, 108, { size: 9, align: 'center', color: COLORS.muted });
    return;
  }

  if (chapter === 8) {
    const nodes = [
      { x: 48, y: 62, core: true },
      { x: 94, y: 42, core: false },
      { x: 94, y: 84, core: false },
      { x: 150, y: 42, core: true },
      { x: 150, y: 84, core: false },
      { x: 202, y: 62, core: false },
    ];
    const edges = [[0, 1], [0, 2], [0, 3], [3, 4], [3, 5]];
    edges.forEach(([from, to], index) => {
      const a = nodes[from];
      const b = nodes[to];
      drawArrow(ctx, a.x + 8, a.y, b.x - 8, b.y, index < p * edges.length ? COLORS.blue : COLORS.border, 2);
    });
    nodes.forEach((node) => drawNode(ctx, node.x, node.y, '', node.core && p > 0.45, node.core && p > 0.8, 7));
    drawText(ctx, '两个 6/10 节点成为局部枢纽', 122, 108, { size: 9, align: 'center', color: COLORS.muted });
    return;
  }

  if (chapter === 9) {
    const target = lerp(0, 100, p);
    const control = lerp(0, 45.8, p);
    ctx.fillStyle = '#edf1f6';
    ctx.fillRect(42, 48, 154, 14);
    ctx.fillRect(42, 78, 154, 14);
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(42, 48, 1.54 * target, 14);
    ctx.fillStyle = '#8ea1ba';
    ctx.fillRect(42, 78, 1.54 * control, 14);
    drawText(ctx, '核心组合', 38, 55, { size: 8, align: 'right' });
    drawText(ctx, '控制均值', 38, 85, { size: 8, align: 'right' });
    drawText(ctx, '100.0% vs 45.8%', 122, 108, { size: 9, align: 'center', color: COLORS.green, weight: 800 });
    return;
  }

  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(28, 38, 188, 54);
  ctx.setLineDash([]);
  drawText(ctx, 'Qwen3-4B · 100 synthetic prompts', 122, 55, { size: 9, align: 'center', color: COLORS.orange });
  drawText(ctx, '单套 PLT · 人工筛选 · α=5', 122, 77, { size: 9, align: 'center', color: COLORS.orange });
  drawText(ctx, '结论只在这条边界内成立', 122, 108, { size: 9, align: 'center', color: COLORS.muted, weight: 700 });
}

export function CircuitDiagnosisAnalogy({ chapterId, moduleId }: CanvasWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapter = chapterNumber(chapterId, moduleId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let startTime = 0;
    let running = false;

    const drawFrame = (time: number) => {
      if (!running) return;
      if (!startTime) startTime = time;
      const phase = ((time - startTime) % 3400) / 3400;
      const ctx = prepareCanvas(canvas, 244, 130);
      drawAnalogy(ctx, chapter, phase);
      canvas.classList.add('is-ready');
      frame = requestAnimationFrame(drawFrame);
    };

    const disconnect = observeCanvas(
      canvas,
      () => {
        if (running) return;
        running = true;
        startTime = 0;
        frame = requestAnimationFrame(drawFrame);
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
  }, [chapter]);

  return (
    <canvas
      ref={canvasRef}
      width={244}
      height={130}
      role="img"
      aria-label={`第 ${chapter} 节黑箱电路检修类比动画`}
      style={{ display: 'block', width: '100%', maxWidth: 244, height: 'auto', margin: '0 auto' }}
    />
  );
}
