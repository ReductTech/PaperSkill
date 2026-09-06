import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { MATCH_BEATS, sampleMatch, type SignalCell } from './match-story';

export const MVL = {
  ink: '#172033', muted: '#5c667a', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#d97706', purple: '#7c3aed', pitch: '#76906a', pitchLight: '#b8c9a7',
  line: '#d7deea', scene: '#f5f8f0', white: '#ffffff', mic: '#92400e', lab: '#fbfcfe',
};

export function useCanvasSurface(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, time: number) => void,
  deps: React.DependencyList,
  animate = false,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    if (animate) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    drawRef.current(ctx, 1);
    canvas.classList.add('is-ready');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!animate) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const render = (now: number) => {
      drawRef.current(ctx, reduced ? 1 : now / 1000);
      canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(render);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(render); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [animate, height, width]);

  return ref;
}

export function clearPitchScene(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = MVL.scene;
  ctx.fillRect(0, 0, width, height);
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 8) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawPitch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, grid = false) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.clip();
  ctx.fillStyle = MVL.pitch;
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 6; i += 1) {
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.fillRect(x + (i * w) / 6, y, w / 6, h);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,.82)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * .13, 0, Math.PI * 2); ctx.stroke();
  if (grid) {
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = .5;
    for (let i = 1; i < 16; i += 1) {
      ctx.beginPath(); ctx.moveTo(x + (i * w) / 16, y); ctx.lineTo(x + (i * w) / 16, y + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + (i * h) / 16); ctx.lineTo(x + w, y + (i * h) / 16); ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawCommentator(ctx: CanvasRenderingContext2D, x: number, y: number, pose = 'scan', scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.strokeStyle = MVL.blue; ctx.fillStyle = MVL.blue; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -15, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 15); ctx.stroke();
  const armY = pose === 'speak' ? -2 : 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-11, 8); ctx.moveTo(0, 0); ctx.lineTo(12, armY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(-9, 29); ctx.moveTo(0, 15); ctx.lineTo(9, 29); ctx.stroke();
  ctx.fillStyle = MVL.white; ctx.beginPath(); ctx.arc(-2, -17, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawMic(ctx: CanvasRenderingContext2D, x: number, y: number, raised: boolean) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(raised ? -0.72 : 0.2);
  ctx.strokeStyle = MVL.mic; ctx.fillStyle = MVL.mic; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 15); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -4, 4, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

export function drawFocusCone(ctx: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number, spread: number) {
  ctx.save(); ctx.fillStyle = 'rgba(217,119,6,.18)'; ctx.strokeStyle = MVL.orange; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx - spread, ty + spread); ctx.lineTo(tx + spread, ty + spread); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}

export function drawTargetMarker(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, kind: 'selected' | 'discarded' | 'motion' | 'residual' | 'memory' = 'selected') {
  const colors = { selected: MVL.green, discarded: MVL.red, motion: MVL.blue, residual: MVL.orange, memory: MVL.purple };
  ctx.save(); ctx.strokeStyle = colors[kind]; ctx.lineWidth = kind === 'discarded' ? 1.5 : 2.5;
  ctx.setLineDash(kind === 'discarded' ? [4, 4] : kind === 'memory' ? [2, 3] : []);
  ctx.strokeRect(x, y, w, h); ctx.restore();
}

export function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tone = MVL.ink) {
  ctx.save(); ctx.font = '600 12px "Segoe UI", sans-serif';
  const width = ctx.measureText(text).width + 12;
  roundRect(ctx, x, y - 14, width, 20, 6); ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fill();
  ctx.fillStyle = tone; ctx.fillText(text, x + 6, y); ctx.restore();
}

export function drawLegend(ctx: CanvasRenderingContext2D, items: Array<[string, string]>, x: number, y: number) {
  ctx.save(); ctx.font = '11px "Segoe UI", sans-serif';
  items.slice(0, 4).forEach(([label, color], i) => {
    const yy = y + i * 17; ctx.fillStyle = color; ctx.fillRect(x, yy - 8, 10, 10);
    ctx.fillStyle = MVL.muted; ctx.fillText(label, x + 15, yy);
  }); ctx.restore();
}

export function drawHeatCells(
  ctx: CanvasRenderingContext2D,
  cells: SignalCell[],
  pitch: { x: number; y: number; width: number; height: number },
  rgb: string,
  alpha = 1,
) {
  const cellWidth = pitch.width / 16;
  const cellHeight = pitch.height / 16;
  cells.forEach(([column, row, level]) => {
    const opacity = (level === 3 ? .66 : level === 2 ? .4 : .18) * alpha;
    ctx.fillStyle = `rgba(${rgb},${opacity})`;
    ctx.fillRect(pitch.x + column * cellWidth, pitch.y + row * cellHeight, cellWidth, cellHeight);
  });
}

const actionNames = ['扫描', '追球', '标记', '聚焦', '定位', '切换画面', '举麦', '分阶段练习', '分配预算', '赛后复盘'];
const chapterRanges: Array<[number, number]> = [
  [0, .25], [.08, .48], [.22, .62], [.38, .76], [.52, .86], [.64, .93], [.70, 1],
];

export const FootballAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const chapter = Math.max(1, Math.min(10, Number(chapterId.replace('chap-', '')) || 1));
  const ref = useCanvasSurface(244, 130, (ctx, seconds) => {
    const loop = (seconds % 4.8) / 4.8;
    const range = chapterRanges[Math.min(chapter - 1, chapterRanges.length - 1)] ?? [0, 1];
    const story = sampleMatch(range[0] + (range[1] - range[0]) * loop);
    const pitch = { x: 48, y: 18, width: 184, height: 92 };
    clearPitchScene(ctx, 244, 130);
    drawPitch(ctx, pitch.x, pitch.y, pitch.width, pitch.height, chapter >= 3 && chapter <= 5);
    const ballX = pitch.x + story.ball.x * pitch.width;
    const ballY = pitch.y + story.ball.y * pitch.height;
    const runnerX = pitch.x + story.runner.x * pitch.width;
    const runnerY = pitch.y + story.runner.y * pitch.height;
    drawCommentator(ctx, runnerX, runnerY, chapter === 7 && story.beat.gate === 'SPEAK' ? 'speak' : 'scan', .58);
    ctx.fillStyle = MVL.white; ctx.strokeStyle = MVL.ink; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(ballX, ballY, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    if (chapter === 1) {
      for (let row = 0; row < 4; row += 1) for (let column = 0; column < 8; column += 1) {
        drawTargetMarker(ctx, 52 + column * 22, 24 + row * 20, 18, 15, 'discarded');
      }
    }
    if (chapter === 2) {
      ctx.strokeStyle = MVL.blue; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(Math.max(pitch.x + 8, ballX - 34), ballY); ctx.lineTo(ballX - 7, ballY); ctx.stroke();
    }
    if (chapter === 3) drawHeatCells(ctx, story.beat.importance, pitch, '34,141,92');
    if (chapter === 4) drawHeatCells(ctx, story.beat.importance.filter(([, , level]) => level >= 2), pitch, '34,141,92');
    if (chapter === 5) {
      const originalX = 54 + story.beatIndex * 22;
      const compactX = 142 + story.beatIndex * 9;
      ctx.strokeStyle = MVL.purple; ctx.beginPath(); ctx.moveTo(originalX, 112); ctx.lineTo(compactX, 112); ctx.stroke();
      ctx.fillStyle = MVL.purple; ctx.beginPath(); ctx.arc(originalX, 112, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (chapter === 6) [82, 132, 182].forEach((x, i) => {
      ctx.fillStyle = i === Math.min(2, Math.floor(loop * 3)) ? MVL.green : MVL.line; ctx.fillRect(x, 36, 30, 22);
    });
    if (chapter === 7) {
      drawMic(ctx, 35, 70, story.beat.gate === 'SPEAK');
      drawSceneLabel(ctx, story.beat.gate, 164, 107, story.beat.gate === 'SPEAK' ? MVL.green : MVL.purple);
    }
    if (chapter === 8) for (let i = 0; i < 7; i += 1) {
      ctx.fillStyle = i <= Math.floor(loop * 7) ? (i < 2 ? MVL.blue : MVL.green) : MVL.line;
      ctx.fillRect(72 + i * 21, 91 - i * 7, 18, 7);
    }
    if (chapter === 9) {
      ctx.strokeStyle = MVL.line; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(56, 48); ctx.lineTo(226, 48); ctx.stroke();
      for (let i = 0; i < 24; i += 1) {
        const x = 58 + i * 7;
        ctx.fillStyle = i % 3 === 0 ? MVL.red : MVL.line;
        ctx.beginPath(); ctx.arc(x, 48, i % 3 === 0 ? 2.8 : 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = MVL.green;
        ctx.beginPath(); ctx.arc(x, 79, 1.9, 0, Math.PI * 2); ctx.fill();
      }
      drawSceneLabel(ctx, '少量时间点 · 完整看', 58, 67, MVL.red);
      drawSceneLabel(ctx, '更多时间点 · 稀疏看', 58, 101, MVL.green);
    }
    if (chapter === 10) {
      ctx.fillStyle = MVL.blue; ctx.fillRect(104, 35, 98, 54); ctx.fillStyle = MVL.white; ctx.font = '700 12px "Segoe UI"';
      ctx.fillText(loop < .55 ? '成绩' : '边界', 137, 66);
    }
    drawSceneLabel(ctx, actionNames[chapter - 1], 8, 18, chapter === 10 ? MVL.red : MVL.blue);
  }, [chapter], true);
  return <canvas ref={ref} width={244} height={130} role="img" aria-label={`足球解说类比：${actionNames[chapter - 1]}`}>足球解说类比：{actionNames[chapter - 1]}</canvas>;
};

export { MATCH_BEATS };
