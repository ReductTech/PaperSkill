import React, { useEffect, useRef } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';

type Props = { chapterId: string; moduleId: string };

export const posterKit = {
  bg: '#f5f8f0', paper: '#fffdf6', light: '#b8c9a7', dark: '#76906a',
  support: '#92400e', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#f07e47', purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea'
};

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function posterSheet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = posterKit.light;
  roundRect(ctx, x + 5, y + 6, w, h, 8);
  ctx.fill();
  ctx.fillStyle = posterKit.paper;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = posterKit.dark;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#e8efe2';
  roundRect(ctx, x + 13, y + 13, w - 26, Math.max(10, h * 0.18), 3);
  ctx.fill();
  ctx.fillStyle = posterKit.blue;
  ctx.fillRect(x + 14, y + h * 0.49, w * 0.35, 5);
  ctx.fillStyle = posterKit.light;
  ctx.fillRect(x + 14, y + h * 0.59, w * 0.58, 4);
  ctx.fillRect(x + 14, y + h * 0.67, w * 0.45, 4);
}

export function nib(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color = posterKit.orange) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = posterKit.support;
  roundRect(ctx, -7, -25, 14, 26, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill();
  ctx.restore();
}

const scenePositions: Record<string, { sx: number; sy: number; ex: number; ey: number; mark: string }> = {
  'chap-1': { sx: 160, sy: 86, ex: 245, ey: 76, mark: 'route' },
  'chap-2': { sx: 116, sy: 106, ex: 214, ey: 106, mark: 'brief' },
  'chap-3': { sx: 334, sy: 65, ex: 402, ey: 65, mark: 'stretch' },
  'chap-4': { sx: 168, sy: 91, ex: 253, ey: 91, mark: 'compact' },
  'chap-5': { sx: 126, sy: 104, ex: 243, ey: 104, mark: 'underline' },
  'chap-6': { sx: 182, sy: 91, ex: 304, ey: 69, mark: 'correct' },
  'chap-7': { sx: 152, sy: 104, ex: 252, ey: 81, mark: 'shade' },
  'chap-8': { sx: 127, sy: 106, ex: 325, ey: 67, mark: 'link' },
  'chap-9': { sx: 246, sy: 104, ex: 338, ey: 60, mark: 'check' },
  'chap-10': { sx: 230, sy: 94, ex: 310, ey: 77, mark: 'finish' }
};

function drawScene(ctx: CanvasRenderingContext2D, chapterId: string, moduleId: string, phase: number) {
  const isHero = chapterId === 'hero';
  const old = isHero && moduleId === 'old';
  const scene = scenePositions[chapterId] || scenePositions['chap-1'];
  const w = isHero ? 420 : 560;
  const h = 140;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = posterKit.bg;
  ctx.fillRect(0, 0, w, h);

  const px = isHero ? 114 : 220;
  const pw = isHero ? 170 : chapterId === 'chap-3' ? 140 : 150;
  posterSheet(ctx, px, 16, pw, 106);

  // Two static supporting props at most: sheet and one goal/brief card.
  if (chapterId === 'chap-2' || chapterId === 'chap-5' || chapterId === 'chap-8') {
    ctx.fillStyle = '#e8efe2';
    roundRect(ctx, 40, 36, 132, 70, 7); ctx.fill();
    ctx.fillStyle = posterKit.dark;
    for (let i = 0; i < (chapterId === 'chap-2' ? 4 : 3); i++) ctx.fillRect(54, 49 + i * 12, 70 + i * 10, 3);
  } else if (chapterId === 'chap-4') {
    ctx.fillStyle = '#e8efe2';
    roundRect(ctx, 40, 44, 74, 60, 5); ctx.fill();
    ctx.strokeStyle = posterKit.dark; ctx.stroke();
    ctx.fillStyle = posterKit.blue;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.fillRect(52 + i * 17, 56 + j * 17, 9, 9);
  } else {
    const markX = isHero ? 330 : 470;
    const markY = 69;
    ctx.strokeStyle = old ? posterKit.red : posterKit.green;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(markX, markY, 21, -Math.PI * .15, Math.PI * 1.28);
    ctx.stroke();
    ctx.beginPath();
    if (old) {
      ctx.moveTo(markX - 9, markY - 9);
      ctx.lineTo(markX + 9, markY + 9);
      ctx.moveTo(markX + 9, markY - 9);
      ctx.lineTo(markX - 9, markY + 9);
    } else {
      ctx.moveTo(markX - 11, markY);
      ctx.lineTo(markX - 1, markY + 9);
      ctx.lineTo(markX + 18, markY - 14);
    }
    ctx.stroke();
  }

  // Keep the nib and its stroke inside the paper. The earlier coordinates were
  // authored for the whole canvas, so several chapter scenes accidentally ended
  // outside the sheet (especially the aspect-ratio scene). Clamp both endpoints
  // to the drawable paper area while leaving the goal mark as a separate prop.
  const safeLeft = px + 18;
  const safeRight = px + pw - 18;
  const sx = isHero ? 180 : clamp(scene.sx, safeLeft, safeRight);
  const ex = isHero ? 228 : clamp(scene.ex, safeLeft, safeRight);
  const sy = isHero ? 95 : clamp(scene.sy, 56, 106);
  const ey = isHero ? (old ? 70 : 82) : clamp(scene.ey, 56, 106);
  const t = Math.max(0, Math.min(1, phase));
  const x = sx + (ex - sx) * t;
  const y = sy + (ey - sy) * t;
  ctx.strokeStyle = old ? posterKit.red : posterKit.green;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(x, y);
  ctx.stroke();
  nib(ctx, x, y - 10, .25, old ? posterKit.red : posterKit.orange);
}

export const PosterAnalogy: React.FC<Props> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const w = chapterId === 'hero' ? 420 : 560;
    const ctx = setupCanvas(canvas, w, 140);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    let frame = 0;
    let active = false;
    let started = 0;
    const draw = (time: number) => {
      if (!active) return;
      if (!started) started = time;
      const phase = ((time - started) % 2300) / 2300;
      drawScene(ctx, chapterId, moduleId, phase);
      frame = requestAnimationFrame(draw);
    };
    const stop = observeCanvas(canvas, () => {
      if (!active) { active = true; frame = requestAnimationFrame(draw); }
    }, () => { active = false; cancelAnimationFrame(frame); });
    drawScene(ctx, chapterId, moduleId, 0);
    canvas.classList.add('is-ready');
    return () => { active = false; cancelAnimationFrame(frame); stop(); };
  }, [chapterId, moduleId]);
  return <canvas ref={ref} role="img" aria-label="海报设计类比动画：一支画笔在纸上移动" />;
};
