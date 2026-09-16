import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { COLORS, clearScene, drawPaperSheet, drawPen, drawMagnifier, drawStamp, drawRuler } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

// One everyday action per chapter, all inside the same 书法与信笺 theme.
// Zero in-Canvas labels: the action itself carries the meaning.
function drawScene(ctx: CanvasRenderingContext2D, ch: string, t: number): void {
  clearScene(ctx, W, H);
  const loop = (t % 3200) / 3200;

  if (ch === 'chap-1') {
    // 逐笔写满：钢笔一行行写，写到词数线才停。
    drawPaperSheet(ctx, 30, 24, 340, 92);
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(352, 30);
    ctx.lineTo(352, 110);
    ctx.stroke();
    const rows = Math.round(clamp(loop * 1.15, 0, 1) * 6);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    for (let i = 0; i < rows; i++) {
      const y = 40 + i * 13;
      ctx.beginPath();
      ctx.moveTo(52, y);
      ctx.lineTo(clamp(52 + (330 - 52) * (i === rows - 1 ? (loop * 1.15) % 1 || 1 : 1), 52, 330), y);
      ctx.stroke();
    }
    drawPen(ctx, 60 + 250 * clamp(loop * 1.15, 0, 1), 40 + rows * 13, -0.15, COLORS.route);
  } else if (ch === 'chap-2') {
    // 放大镜读字迹：一枚放大镜在信纸上来回照。
    drawPaperSheet(ctx, 30, 24, 340, 92);
    ctx.strokeStyle = COLORS.muted;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(56, 38 + i * 13);
      ctx.lineTo(344, 38 + i * 13);
      ctx.stroke();
    }
    const x = 90 + 220 * ((loop * 2) % 1);
    drawMagnifier(ctx, x, 70, 24, COLORS.blue);
  } else if (ch === 'chap-3') {
    // 换一种笔迹：同一行被重新描成另一种运笔。
    drawPaperSheet(ctx, 30, 24, 340, 92);
    ctx.strokeStyle = COLORS.muted;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(56, 62); ctx.lineTo(344, 62); ctx.stroke();
    const p = clamp(loop * 1.2, 0, 1);
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(56, 84);
    ctx.bezierCurveTo(120, 60, 220, 108, 56 + 288 * p, 84);
    ctx.stroke();
    drawPen(ctx, 56 + 288 * p, 84, -0.1, COLORS.blue);
  } else if (ch === 'chap-4') {
    // 量尺量两封信：一把量尺横在两封信之间。
    drawPaperSheet(ctx, 40, 34, 110, 70);
    drawPaperSheet(ctx, 400, 34, 110, 70);
    const span = 0.5 + 0.5 * Math.sin(loop * Math.PI * 2);
    drawRuler(ctx, 160, 70 - 10 + 20 * span, 400, 70 - 10 + 20 * span, COLORS.orange);
  } else if (ch === 'chap-5') {
    // 蘸墨的力道：一支毛笔在砚台里蘸墨。
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(210, 84, 140, 34);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(210, 84, 140, 34);
    const dip = 0.5 + 0.5 * Math.sin(loop * Math.PI * 2);
    ctx.fillStyle = '#3b3b3b';
    ctx.fillRect(214, 92 + 20 * (1 - dip), 132, 22 * dip);
    drawPen(ctx, 300, 92 - 30 + 40 * dip, -Math.PI / 2 + 0.2, COLORS.ink);
  } else if (ch === 'chap-6') {
    // 按序誊写一遍：钢笔按四个次序标记往下抄写。
    drawPaperSheet(ctx, 30, 24, 340, 92);
    for (let i = 0; i < 4; i++) {
      const on = loop > i * 0.22;
      ctx.fillStyle = on ? COLORS.blue : COLORS.line;
      ctx.fillRect(52 + i * 40, 30, 22, 8);
    }
    const p = clamp(loop * 1.1, 0, 1);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(56, 60);
    ctx.lineTo(56 + 288 * p, 60);
    ctx.stroke();
    drawPen(ctx, 56 + 288 * p, 60, 0, COLORS.route);
  } else if (ch === 'chap-7') {
    // 对照参考样本：量尺在参考信笺之间比对。
    drawPaperSheet(ctx, 30, 30, 110, 76);
    drawPaperSheet(ctx, 330, 30, 110, 76);
    const off = 26 * Math.sin(loop * Math.PI * 2);
    drawRuler(ctx, 160, 68 + off, 330, 68 + off, COLORS.blue);
  } else if (ch === 'chap-8') {
    // 逐层叠印：一枚印章反复落下，印痕一层层叠上去。
    drawPaperSheet(ctx, 120, 30, 240, 84);
    const layers = Math.round(clamp(loop * 1.2, 0, 1) * 4);
    for (let i = 0; i < layers; i++) {
      ctx.globalAlpha = 0.22 + 0.12 * i;
      ctx.strokeStyle = COLORS.purple;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(250, 72, 20 + i * 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    drawStamp(ctx, 250, 40 - 18 * (1 - (loop * 1.2) % 1), 16, COLORS.purple, '');
  } else if (ch === 'chap-9') {
    // 添一笔看不见的笔画：字面不变，只在字母之间落下一个隐形点。
    drawPaperSheet(ctx, 30, 24, 340, 92);
    ctx.fillStyle = COLORS.ink;
    ctx.font = '26px monospace';
    const word = 'hello';
    for (let i = 0; i < word.length; i++) {
      ctx.fillText(word[i], 56 + i * 26, 78);
    }
    const p = clamp(loop * 1.3, 0, 1);
    const dots = Math.round(p * 4);
    ctx.fillStyle = COLORS.purple;
    for (let i = 0; i < dots; i++) {
      ctx.beginPath();
      ctx.arc(70 + i * 26, 60, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    drawPen(ctx, 70 + dots * 26, 96, -0.5, COLORS.route);
  } else {
    // 盖下匿名章：一枚印章落下，留下最后的结果。
    drawPaperSheet(ctx, 120, 30, 240, 84);
    const p = clamp(loop * 1.4, 0, 1);
    const y = 30 - 24 * (1 - p) + 42 * p;
    drawStamp(ctx, 240, y, 24, p >= 1 ? COLORS.green : COLORS.orange, '');
    if (p >= 1) drawStamp(ctx, 240, 72, 26, COLORS.green, '匿名');
  }
}

export const AnalogyCanvas: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const tick = (t: number) => {
      drawScene(ctx, chapterId, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [chapterId]);

  return <canvas ref={ref} width={W} height={H} />;
};

export default AnalogyCanvas;
