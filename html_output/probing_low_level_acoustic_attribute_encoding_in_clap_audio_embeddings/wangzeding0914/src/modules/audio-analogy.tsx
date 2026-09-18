import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

const C = {
  field: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

type Scene = {
  subject: 'knob' | 'mic' | 'fork' | 'ruler' | 'fader' | 'needle' | 'card' | 'pointer' | 'switch' | 'sheet';
  action: string;
  targetX: number;
};

const scenes: Record<string, Scene> = {
  'chap-1': { subject: 'knob', action: '校准', targetX: 416 },
  'chap-2': { subject: 'mic', action: '放置', targetX: 360 },
  'chap-3': { subject: 'fork', action: '指向', targetX: 310 },
  'chap-4': { subject: 'ruler', action: '贴合', targetX: 394 },
  'chap-5': { subject: 'fader', action: '推到', targetX: 430 },
  'chap-6': { subject: 'needle', action: '停在', targetX: 380 },
  'chap-7': { subject: 'card', action: '替换', targetX: 350 },
  'chap-8': { subject: 'pointer', action: '拖动', targetX: 420 },
  'chap-9': { subject: 'switch', action: '切换', targetX: 396 },
  'chap-10': { subject: 'sheet', action: '核验', targetX: 430 },
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawStudioField(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.field;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.light;
  ctx.fillRect(0, 108, W, 32);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 108);
  ctx.lineTo(W, 108);
  ctx.stroke();
  roundedRect(ctx, 38, 24, 124, 66, 8, '#ffffff', C.border);
  roundedRect(ctx, 399, 34, 112, 54, 7, '#ffffff', C.border);
  ctx.fillStyle = C.dark;
  ctx.fillRect(55, 39, 90, 5);
  ctx.fillRect(55, 51, 64, 5);
  ctx.fillStyle = C.support;
  ctx.fillRect(76, 84, 48, 4);
  ctx.fillStyle = C.muted;
  ctx.fillRect(210, 105, 140, 3);
}

function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.green) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x + 16, y);
  ctx.moveTo(x, y - 16);
  ctx.lineTo(x, y + 16);
  ctx.stroke();
}

function drawKnob(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, color = C.orange) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(rotation);
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -12);
  ctx.stroke();
  ctx.restore();
}

function drawMic(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  roundedRect(ctx, -12, -28, 24, 48, 12, '#ffffff', C.blue);
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 2;
  for (let i = -7; i <= 7; i += 7) {
    ctx.beginPath();
    ctx.moveTo(i, -16);
    ctx.lineTo(i, 5);
    ctx.stroke();
  }
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.lineTo(0, 38);
  ctx.moveTo(-17, 38);
  ctx.lineTo(17, 38);
  ctx.stroke();
  ctx.restore();
}

function drawFork(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, 24);
  ctx.lineTo(-8, -18);
  ctx.moveTo(8, 24);
  ctx.lineTo(8, -18);
  ctx.moveTo(-8, 24);
  ctx.lineTo(0, 33);
  ctx.lineTo(8, 24);
  ctx.stroke();
  ctx.restore();
}

function drawRuler(ctx: CanvasRenderingContext2D, x: number, y: number, bend: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.07);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-54, -7 + bend, 108, 14, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1;
  for (let i = -42; i <= 42; i += 14) {
    ctx.beginPath();
    ctx.moveTo(i, -5 + bend);
    ctx.lineTo(i, 4 + bend);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFader(ctx: CanvasRenderingContext2D, x: number, y: number, amount: number) {
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 32);
  ctx.lineTo(x, y + 34);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.roundRect(x - 9, y - 31 + amount * 62, 18, 19, 4);
  ctx.fill();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 21, y - 1);
  ctx.lineTo(x + 21, y - 1);
  ctx.stroke();
}

function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(0, -22);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSubject(ctx: CanvasRenderingContext2D, scene: Scene, x: number, phase: number) {
  switch (scene.subject) {
    case 'knob':
      drawKnob(ctx, x, 71, -0.7 + phase * 1.4);
      break;
    case 'mic':
      drawMic(ctx, x, 63, Math.sin(phase * Math.PI * 2) * 0.08);
      break;
    case 'fork':
      drawFork(ctx, x, 67, -0.1 + Math.sin(phase * Math.PI * 2) * 0.08);
      break;
    case 'ruler':
      drawRuler(ctx, x, 67, Math.sin(phase * Math.PI * 2) * 2);
      break;
    case 'fader':
      drawFader(ctx, x, 68, phase);
      break;
    case 'needle':
      drawNeedle(ctx, x, 68, -1.1 + phase * 2.2, phase > 0.7 ? C.green : C.blue);
      break;
    case 'card':
      roundedRect(ctx, x - 34, 45, 68, 45, 5, '#ffffff', C.blue);
      ctx.fillStyle = C.orange;
      ctx.fillRect(x - 23, 56, 45, 4);
      ctx.fillStyle = C.dark;
      ctx.fillRect(x - 23, 67, 31, 4);
      ctx.fillStyle = C.green;
      ctx.fillRect(x - 23, 78, 39, 4);
      break;
    case 'pointer':
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - 21, 88);
      ctx.lineTo(x + 21, 43);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(x + 21, 43, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'switch':
      roundedRect(ctx, x - 24, 51, 48, 34, 17, '#ffffff', C.border);
      ctx.fillStyle = phase > 0.5 ? C.green : C.blue;
      ctx.beginPath();
      ctx.arc(x + (phase > 0.5 ? 10 : -10), 68, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'sheet':
      roundedRect(ctx, x - 38, 40, 76, 51, 4, '#ffffff', C.border);
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 22, 66);
      ctx.lineTo(x - 5, 79);
      ctx.lineTo(x + 24, 51);
      ctx.stroke();
      break;
    default:
      break;
  }
}

export const AudioAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = scenes[chapterId] ?? scenes['chap-1'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf: number | null = null;
    const render = (time: number) => {
      const cycle = reduceMotion ? 0.76 : (time / 3200) % 1;
      const wave = (Math.sin(cycle * Math.PI * 2) + 1) / 2;
      const eased = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
      const x = 198 + (scene.targetX - 198) * eased;
      drawStudioField(ctx);
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(194, 71);
      ctx.lineTo(scene.targetX, 71);
      ctx.stroke();
      drawTarget(ctx, scene.targetX, 71, eased > 0.84 ? C.green : C.blue);
      drawSubject(ctx, scene, x, wave);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (!reduceMotion) raf = requestAnimationFrame(render);
    };

    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (reduceMotion) {
        render(0);
      } else if (raf === null) {
        raf = requestAnimationFrame(render);
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [scene]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      aria-label={`录音棚校音动画：${scene.action}`}
    />
  );
};

export default AudioAnalogy;
