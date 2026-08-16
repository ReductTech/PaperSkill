import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearStudio, drawLabel, drawLegend } from './studio-kit';

const W = 960;
const H = 490;

type InterfacePart = 'encoding' | 'decoding';
type Point = { x: number; y: number };

function card(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  body: string,
  detail: string,
  accent: string,
  active = false
) {
  ctx.save();
  ctx.fillStyle = active ? '#fff8e7' : C.white;
  ctx.strokeStyle = accent;
  ctx.lineWidth = active ? 3 : 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 7, height);
  drawLabel(ctx, title, x + 22, y + 26, C.muted, 12);
  drawLabel(ctx, body, x + width / 2 + 4, y + height / 2 - 2, C.text, 16, 'center');
  drawLabel(ctx, detail, x + width / 2 + 4, y + height - 23, C.muted, 11, 'center');
  ctx.restore();
}

function arrowHead(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(to.x, to.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-11, -6);
  ctx.lineTo(-11, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPath(ctx: CanvasRenderingContext2D, points: Point[], color: string = C.current, dashed = false) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash(dashed ? [7, 6] : []);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();
  ctx.restore();
  arrowHead(ctx, points[points.length - 2], points[points.length - 1], color);
}

function pointOnPath(points: Point[], progress: number): Point {
  const lengths = points.slice(1).map((point, index) => {
    const previous = points[index];
    return Math.hypot(point.x - previous.x, point.y - previous.y);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = total * Math.max(0, Math.min(1, progress));
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index]) {
      const start = points[index];
      const end = points[index + 1];
      const ratio = lengths[index] === 0 ? 0 : remaining / lengths[index];
      return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
    }
    remaining -= lengths[index];
  }
  return points[points.length - 1];
}

function drawPulse(ctx: CanvasRenderingContext2D, points: Point[], progress: number) {
  // Keep the moving marker inside the connector's empty gutter. It should arrive
  // at a card boundary, never travel through the card that performs the operation.
  const point = pointOnPath(points, 0.16 + Math.max(0, Math.min(1, progress)) * 0.68);
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.control;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPatchGrid(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      ctx.strokeRect(x + column * 12, y + row * 12, 10, 10);
    }
  }
  ctx.restore();
}

function drawStageStrip(ctx: CanvasRenderingContext2D, part: InterfacePart) {
  const stages = [
    { label: '原生像素', color: C.camera },
    { label: 'Patch 编码', color: C.current },
    { label: '视觉 token', color: C.success },
    { label: '共享主干', color: C.aux },
    { label: 'Patch 解码', color: C.control },
  ];
  stages.forEach((stage, index) => {
    const x = 30 + index * 182;
    const selected = (part === 'encoding' && index === 1) || (part === 'decoding' && index === 4);
    ctx.save();
    ctx.fillStyle = selected ? '#fff8e7' : C.white;
    ctx.strokeStyle = selected ? C.control : C.border;
    ctx.lineWidth = selected ? 2.5 : 1;
    ctx.beginPath();
    ctx.roundRect(x, 54, 154, 38, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = stage.color;
    ctx.beginPath();
    ctx.arc(x + 18, 73, 5, 0, Math.PI * 2);
    ctx.fill();
    drawLabel(ctx, stage.label, x + 83, 73, selected ? C.text : C.muted, 12, 'center');
    ctx.restore();
    if (index < stages.length - 1) {
      drawPath(ctx, [{ x: x + 154, y: 73 }, { x: x + 174, y: 73 }], C.border);
    }
  });
}

function drawHeader(ctx: CanvasRenderingContext2D, part: InterfacePart) {
  drawLabel(ctx, 'Patch 接口：编码层与解码层', 30, 28, C.text, 19);
  drawLabel(ctx, part === 'encoding' ? '当前动画：Patch 编码层' : '当前动画：Patch 解码层', 930, 28, C.control, 13, 'right');
  drawStageStrip(ctx, part);
}

function drawEncoding(ctx: CanvasRenderingContext2D, phase: number) {
  // Every connector stops at a card boundary. Processing inside the cards is
  // expressed by their sequential highlight, rather than by a line crossing a card.
  const gaps = [
    [{ x: 198, y: 235 }, { x: 260, y: 235 }],
    [{ x: 478, y: 235 }, { x: 540, y: 235 }],
    [{ x: 694, y: 235 }, { x: 756, y: 235 }],
  ];
  const step = Math.min(3, Math.floor(phase * 4));
  const localPhase = (phase * 4) % 1;
  card(ctx, 34, 155, 164, 160, '输入', '原生图像 / 噪声', '像素网格', C.camera, step === 0);
  // Place the miniature grid below the text line, so it is a visual cue rather
  // than an overlay on the input/output labels.
  drawPatchGrid(ctx, 98, 246, C.camera);
  card(ctx, 260, 155, 218, 160, 'Patch 编码层', '两层卷积', '下采样 → GELU → 下采样', C.current, step === 1);
  drawLabel(ctx, '把局部像素压缩为 token', 369, 275, C.current, 12, 'center');
  card(ctx, 540, 155, 154, 160, '接口输出', '视觉 token', '每个 token 对应一个 patch', C.success, step === 2);
  drawPatchGrid(ctx, 598, 246, C.success);
  card(ctx, 756, 155, 170, 160, '交给主干', '共享嵌入', '与文本 token 一起建模', C.aux, step === 3);
  gaps.forEach((gap) => drawPath(ctx, gap, C.current));
  drawPulse(ctx, gaps[Math.min(step, gaps.length - 1)], localPhase);

  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(78, 354, 804, 62, 11);
  ctx.fill();
  ctx.stroke();
  drawLabel(ctx, '编码层决定“什么进入共享表示”', 100, 377, C.current, 14);
  drawLabel(ctx, '固定的 patch 粒度给出视觉 token 数；文本仍由语言模型的 tokenizer 处理。', 100, 400, C.muted, 12);
  ctx.restore();
}

function drawDecoding(ctx: CanvasRenderingContext2D, phase: number) {
  const sharedToDecoder = [{ x: 214, y: 252 }, { x: 284, y: 252 }];
  const decoderToUnderstanding = [
    { x: 484, y: 252 }, { x: 520, y: 252 }, { x: 520, y: 174 }, { x: 548, y: 174 },
  ];
  const understandingToText = [{ x: 714, y: 174 }, { x: 756, y: 174 }];
  const decoderToGeneration = [
    { x: 484, y: 252 }, { x: 520, y: 252 }, { x: 520, y: 340 }, { x: 548, y: 340 },
  ];
  const generationToPixels = [{ x: 714, y: 340 }, { x: 756, y: 340 }];
  const understandingActive = phase < 0.5;
  const branchPhase = (phase * 2) % 1;
  const legPhase = (branchPhase * 2) % 1;
  const activeFirstLeg = branchPhase < 0.5;
  card(ctx, 40, 194, 174, 116, '来自共享主干', 'token 表示', '已融合图像与文本信息', C.aux, activeFirstLeg);
  card(ctx, 284, 194, 200, 116, 'Patch 解码层', '按任务输出', '选择理解或生成路径', C.control, true);
  card(ctx, 548, 124, 166, 100, '理解路径', '线性头', '映射到词表概率', C.current, understandingActive && activeFirstLeg);
  card(ctx, 756, 124, 164, 100, '文本输出', '下一个词', '理解、问答、描述', C.success, understandingActive && !activeFirstLeg);
  card(ctx, 548, 290, 166, 100, '生成路径', 'MLP 头', '直接预测像素 patch', C.control, !understandingActive && activeFirstLeg);
  card(ctx, 756, 290, 164, 100, '像素输出', '图像 patch', '进入下一步去噪', C.success, !understandingActive && !activeFirstLeg);
  drawPath(ctx, sharedToDecoder, C.aux);
  drawPath(ctx, decoderToUnderstanding, C.current);
  drawPath(ctx, understandingToText, C.current);
  drawPath(ctx, decoderToGeneration, C.control);
  drawPath(ctx, generationToPixels, C.control);
  const firstGap = understandingActive ? decoderToUnderstanding : decoderToGeneration;
  const secondGap = understandingActive ? understandingToText : generationToPixels;
  drawPulse(ctx, sharedToDecoder, branchPhase);
  drawPulse(ctx, activeFirstLeg ? firstGap : secondGap, legPhase);
  drawLabel(ctx, '理解', 516, 139, C.current, 11, 'center');
  drawLabel(ctx, '生成', 516, 374, C.control, 11, 'center');

  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(76, 422, 808, 28, 9);
  ctx.fill();
  ctx.stroke();
  drawLabel(ctx, '解码层是任务输出接口：理解侧预测词表；生成侧预测像素 patch，不是编码层的逐像素逆变换。', 480, 436, C.muted, 11.5, 'center');
  ctx.restore();
}

function drawInterface(ctx: CanvasRenderingContext2D, part: InterfacePart, time: number) {
  clearStudio(ctx, W, H);
  drawHeader(ctx, part);
  const phase = (time % 3600) / 3600;
  if (part === 'encoding') drawEncoding(ctx, phase);
  else drawDecoding(ctx, phase);
  drawLegend(ctx, [
    { label: '数据路径', color: C.current },
    { label: '流动 token', color: C.control },
    { label: '任务输出', color: C.success },
  ], 42, 472, 174);
}

export const InputPaths: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  const partRef = useRef<InterfacePart>('encoding');
  const reducedMotionRef = useRef(false);
  const [part, setPart] = useState<InterfacePart>('encoding');
  partRef.current = part;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let context: CanvasRenderingContext2D;
    try {
      context = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    ctxRef.current = context;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = `${W} / ${H}`;
    reducedMotionRef.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let running = true;

    const render = (time: number) => {
      if (!running || !visibleRef.current) return;
      drawInterface(context, partRef.current, reducedMotionRef.current ? 0 : time);
      canvas.classList.add('is-ready');
      if (!reducedMotionRef.current) rafRef.current = window.requestAnimationFrame(render);
    };
    const start = () => {
      visibleRef.current = true;
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (reducedMotionRef.current) render(0);
      else rafRef.current = window.requestAnimationFrame(render);
    };
    const stop = () => {
      visibleRef.current = false;
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      running = false;
      stop();
      disconnect();
    };
  }, []);

  useEffect(() => {
    if (reducedMotionRef.current && visibleRef.current && ctxRef.current) {
      drawInterface(ctxRef.current, part, 0);
    }
  }, [part]);

  const feedback = part === 'encoding'
    ? '动画沿单一路径流动：原生图像或噪声先经两层卷积压缩为视觉 token，再与文本 token 一起进入共享主干。'
    : '动画从共享主干输出处分为上下两路：理解侧用线性头预测词表；生成侧用 MLP 头直接预测像素 patch。';

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={part === 'encoding' ? 'Patch 编码层的数据流动画' : 'Patch 解码层的理解与生成分叉动画'}
      />
      <div className="ctrl" role="group" aria-label="选择 Patch 接口部分">
        <button type="button" aria-pressed={part === 'encoding'} onClick={() => setPart('encoding')}>Patch 编码层</button>
        <button type="button" aria-pressed={part === 'decoding'} onClick={() => setPart('decoding')}>Patch 解码层</button>
      </div>
      <div className="feedback good" aria-live="polite">{feedback}</div>
      <p className="note">Patch 编码与解码共同构成视觉接口：前者把像素整理成可送入共享主干的视觉 token，后者把共享表示导向文本或像素两种任务输出。</p>
    </div>
  );
};

export default InputPaths;
