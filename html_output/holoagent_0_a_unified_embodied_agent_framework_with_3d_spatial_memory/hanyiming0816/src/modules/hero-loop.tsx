import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 360;
const H = 236;

type FlowKind = 'digital' | 'embodied';

const DIGITAL_STEPS = ['Structured State', 'LLM Agent', 'Tool', 'Explicit Result'];
const EMBODIED_STEPS = ['3D World Memory', 'AgentOS', 'Robot Skill', 'Physical World', 'Monitor & Verify', 'Update Memory'];
const DIGITAL_ACTIVE_SEQUENCE = [0, 1, 2, 3, 1, 2, 3, 1, 2, 3];
const EMBODIED_ACTIVE_SEQUENCE = [0, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
const DIGITAL_TOOLS = ['Search', 'Browser', 'Code'];
const EMBODIED_SKILLS = ['Navigate', 'Manipulate', 'Motion'];

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2 - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 4, y2 - 6);
  ctx.lineTo(x + 4, y2 - 6);
  ctx.lineTo(x, y2);
  ctx.closePath();
  ctx.fill();
}

function drawStep(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, accent: string, active: boolean) {
  ctx.save();
  roundedRect(ctx, x, y, w, 24, 7);
  ctx.fillStyle = active ? '#f7fbff' : '#ffffff';
  ctx.strokeStyle = active ? accent : '#d9e0e8';
  ctx.lineWidth = active ? 1.8 : 1;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = active ? '#162338' : '#46576d';
  ctx.font = active ? '700 12px Inter, Arial, sans-serif' : '600 12px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + 12);
  ctx.restore();
}

function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.save();
  const w = ctx.measureText(text).width + 18;
  roundedRect(ctx, x, y, w, 20, 10);
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#d9e0e8';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '700 10.5px Inter, Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 9, y + 10);
  ctx.restore();
}

function drawDigitalToolBranch(ctx: CanvasRenderingContext2D, accent: string) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 1.7;
  ctx.font = '800 10px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Software Tools', 276, 70);

  ctx.beginPath();
  ctx.moveTo(216, 114);
  ctx.lineTo(230, 114);
  ctx.lineTo(238, 114);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(238, 114);
  ctx.lineTo(231, 110);
  ctx.lineTo(231, 118);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(230, 90);
  ctx.lineTo(230, 138);
  ctx.moveTo(230, 90);
  ctx.lineTo(242, 90);
  ctx.moveTo(230, 114);
  ctx.lineTo(242, 114);
  ctx.moveTo(230, 138);
  ctx.lineTo(242, 138);
  ctx.stroke();
  ctx.restore();
}

function drawLoopMark(ctx: CanvasRenderingContext2D, kind: FlowKind, accent: string) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 2.2;
  if (kind === 'digital') {
    const llmCenterY = 26 + 38 + 12;
    const resultCenterY = 26 + 38 * 3 + 12;
    const stepLeft = 82;
    const stepRight = 82 + 134;
    ctx.beginPath();
    ctx.moveTo(stepRight, resultCenterY);
    ctx.lineTo(226, resultCenterY);
    ctx.lineTo(226, 188);
    ctx.lineTo(56, 188);
    ctx.lineTo(56, llmCenterY);
    ctx.lineTo(stepLeft, llmCenterY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(stepLeft, llmCenterY);
    ctx.lineTo(stepLeft - 9, llmCenterY - 6);
    ctx.lineTo(stepLeft - 9, llmCenterY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 10px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('use result', 112, 184);
  } else {
    const agentOsCenterY = 16 + 34 + 12;
    const updateCenterY = 16 + 34 * 5 + 12;
    const stepRight = 58 + 152;
    const loopX = 308;
    ctx.beginPath();
    ctx.moveTo(stepRight, updateCenterY);
    ctx.lineTo(loopX, updateCenterY);
    ctx.quadraticCurveTo(330, updateCenterY, 330, updateCenterY - 22);
    ctx.lineTo(330, agentOsCenterY + 22);
    ctx.quadraticCurveTo(330, agentOsCenterY, 308, agentOsCenterY);
    ctx.lineTo(stepRight, agentOsCenterY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(stepRight, agentOsCenterY);
    ctx.lineTo(stepRight + 9, agentOsCenterY - 6);
    ctx.lineTo(stepRight + 9, agentOsCenterY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 10px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('decide again', 286, 34);
  }
  ctx.restore();
}

function drawFlow(ctx: CanvasRenderingContext2D, kind: FlowKind, time = 0) {
  const isEmbodied = kind === 'embodied';
  const steps = isEmbodied ? EMBODIED_STEPS : DIGITAL_STEPS;
  const sideItems = isEmbodied ? EMBODIED_SKILLS : DIGITAL_TOOLS;
  const accent = isEmbodied ? '#2563eb' : '#64748b';
  const soft = isEmbodied ? '#eff6ff' : '#f8fafc';
  const activeSequence = isEmbodied ? EMBODIED_ACTIVE_SEQUENCE : DIGITAL_ACTIVE_SEQUENCE;
  const activeIndex = activeSequence[Math.floor((time / 900) % activeSequence.length)];
  const stepW = isEmbodied ? 152 : 134;
  const startX = isEmbodied ? 58 : 82;
  const topY = isEmbodied ? 16 : 26;
  const gap = isEmbodied ? 34 : 38;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = soft;
  roundedRect(ctx, 10, 10, W - 20, H - 20, 10);
  ctx.fill();
  ctx.strokeStyle = '#d9e0e8';
  ctx.stroke();

  steps.forEach((step, i) => {
    const y = topY + i * gap;
    drawStep(ctx, step, startX, y, stepW, accent, i === activeIndex);
    if (i < steps.length - 1) drawArrow(ctx, startX + stepW / 2, y + 25, y + gap - 2, accent);
  });

  const pillX = isEmbodied ? 226 : 244;
  const pillY = isEmbodied ? topY + gap * 2 + 9 : 80;
  ctx.font = '700 10.5px Inter, Arial, sans-serif';
  if (!isEmbodied) drawDigitalToolBranch(ctx, accent);
  sideItems.forEach((item, i) => drawPill(ctx, item, pillX, pillY + i * 24, accent));
  drawLoopMark(ctx, kind, accent);

  if (!isEmbodied) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 11px Inter, Arial, sans-serif';
    ctx.fillText('structured feedback', 28, 204);
  } else {
    ctx.fillStyle = '#2563eb';
    ctx.font = '700 11px Inter, Arial, sans-serif';
    ctx.fillText('runtime evidence', 28, 218);
  }
}

export const HeroLoop: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const kind: FlowKind = moduleId === 'new' ? 'embodied' : 'digital';
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const draw = (time: number) => {
      drawFlow(ctx, kind, reduced ? 0 : time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      draw(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (reduced) draw(0);
      else if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      aria-label={moduleId === 'new' ? 'HoloAgent-0 具身智能体闭环执行流程' : '数字 LLM Agent 工具调用流程'}
    />
  );
};

export default HeroLoop;
