import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label, ruler, sheet, pen } from './kit';

// Life-metaphor analogy card (244x130). One subject + one verb + one goal per scene.
// All ten scenes belong to the single "exam grading" theme; only the action varies.
const W = 244;
const H = 130;

function sceneIndex(chapterId: string): number {
  const m = /chap-(\d+)/.exec(chapterId);
  return m ? Math.min(Math.max(Number(m[1]), 1), 10) : 1;
}

function draw(idx: number, t: number, ctx: CanvasRenderingContext2D): void {
  clear(ctx, W, H);
  const ph = Math.sin(t * 2.2); // gentle phase for the primary motion
  const pulse = (Math.sin(t * 2.2) + 1) / 2;

  switch (idx) {
    case 1: {
      // Problem: one pen wavers over a sheet whose three rubric segments are misaligned.
      sheet(ctx, 26, 38, 120, 62, '#fff', 3);
      const offs = [22, 12, 30];
      for (let i = 0; i < 3; i++) {
        ruler(ctx, 34, 48 + i * 18, 104, 8, i === 1 ? C.red : C.muted, C.red);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = C.red;
        ctx.fillRect(34 + i * 10, 48 + i * 18 - 1, 4, 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.axis;
        void offs;
      }
      pen(ctx, 170 + ph * 8, 66 + ph * 14, C.red, 0.6 + ph * 0.15);
      label(ctx, '各套标准对不齐', 66, 116, 12, C.red, 'center', 700);
      break;
    }
    case 2: {
      // Input: one pen points between objective (choice boxes) and subjective (essay) halves.
      sheet(ctx, 24, 34, 196, 66, '#fff', 3);
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = C.axis;
        ctx.strokeRect(40 + i * 24, 52, 16, 16);
      }
      label(ctx, '客观·选择题', 40, 92, 11, C.blue);
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = C.muted;
        ctx.beginPath();
        ctx.moveTo(150, 48 + i * 12);
        ctx.lineTo(214, 48 + i * 12);
        ctx.stroke();
      }
      label(ctx, '主观·作文题', 152, 92, 11, C.orange);
      pen(ctx, 124 + ph * 96, 38, C.blue, 0.5);
      break;
    }
    case 3: {
      // Insight: one ruler slides down to align three stray marks into one straight line.
      const y = 40 + pulse * 20;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 0 ? C.red : i === 1 ? C.orange : C.red;
        ctx.beginPath();
        ctx.arc(70 + i * 50, 78 - (i === 1 ? 18 : 8), 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ruler(ctx, 34, y, 180, 10, C.green, C.green);
      label(ctx, '一把直尺对齐标准', 122, 116, 12, C.green, 'center', 700);
      break;
    }
    case 4: {
      // Cartesian grid: one pen ticks the model x dataset table cell by cell.
      const cols = 5;
      const rows = 3;
      const x0 = 40;
      const y0 = 32;
      const cw = 34;
      const ch = 24;
      const total = cols * rows;
      const cell = Math.floor((t * 1.6) % total);
      ctx.strokeStyle = C.axis;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(x0, y0 + r * ch); ctx.lineTo(x0 + cols * cw, y0 + r * ch); ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(x0 + c * cw, y0); ctx.lineTo(x0 + c * cw, y0 + rows * ch); ctx.stroke();
      }
      const cx = x0 + (cell % cols) * cw;
      const cy = y0 + Math.floor(cell / cols) * ch;
      ctx.fillStyle = C.orange;
      ctx.fillRect(cx + 6, cy + 6, cw - 12, ch - 12);
      pen(ctx, cx + cw / 2, cy + ch / 2, C.blue, 0.9);
      label(ctx, '模型 × 数据集', 122, 116, 12, C.blue, 'center', 700);
      break;
    }
    case 5: {
      // Evaluator choice: one pen moves between a rule (ruler) and a magnifier (LLM judge).
      ruler(ctx, 40, 84, 70, 8, C.blue, C.ink);
      ctx.strokeStyle = C.purple;
      ctx.beginPath();
      ctx.arc(168, 80, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(183, 95); ctx.lineTo(198, 110);
      ctx.stroke();
      const x = 104 + ph * 30;
      pen(ctx, x, 66, C.orange, 0.9);
      label(ctx, '规则 / 裁判', 122, 116, 12, C.purple, 'center', 700);
      break;
    }
    case 6: {
      // Partition: one cutter blade slices a tall stack into equal shorter stacks.
      const base = 92;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? '#f3ead2' : '#efe3c4';
        ctx.fillRect(60 + i * 58, base - 14 - i * 8, 40, 14 + i * 8);
      }
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(60, base - 14, 40, 14);
      ctx.strokeRect(118, base - 22, 40, 22);
      ctx.strokeRect(176, base - 30, 40, 30);
      const by = 20 + pulse * 46;
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(70, by);
      ctx.lineTo(196, by);
      ctx.stroke();
      ctx.lineWidth = 1;
      label(ctx, '切分成等份小叠', 122, 116, 12, C.green, 'center', 700);
      break;
    }
    case 7: {
      // Task route: one pen slides along a track from 作答 to 评分.
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, 70);
      ctx.lineTo(214, 70);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(30, 70, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(214, 70, 7, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, '作答', 30, 52, 11, C.green, 'center');
      label(ctx, '评分', 214, 52, 11, C.blue, 'center');
      const x = 40 + ((t * 0.8) % 1) * 164;
      pen(ctx, x, 70, C.red, 0.9);
      break;
    }
    case 8: {
      // Pipeline stamp: one stamp presses a 合格 mark onto a flow card.
      sheet(ctx, 46, 40, 90, 52, '#fff', 3);
      label(ctx, '评测流程卡', 91, 66, 10, C.muted, 'center');
      const sy = 44 + pulse * 30;
      ctx.fillStyle = C.green;
      rr(ctx, 150, sy, 44, 34, 6);
      ctx.fill();
      label(ctx, '合格', 172, sy + 18, 13, '#fff', 'center', 800);
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(172, sy - 6);
      ctx.lineTo(172, sy - 16);
      ctx.stroke();
      ctx.lineWidth = 1;
      label(ctx, '流程盖章合格', 122, 116, 12, C.green, 'center', 700);
      break;
    }
    case 9: {
      // Summarize: one pen collects three score chips into one total scorecard.
      const chips = [C.blue, C.green, C.orange];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = chips[i];
        ctx.beginPath();
        ctx.arc(46 + i * 34, 60, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      const tx = 46 + ((t * 0.7) % 1) * 102;
      pen(ctx, tx, 60, C.red, 0.9);
      ctx.fillStyle = '#fff';
      rr(ctx, 172, 42, 52, 40, 6);
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.strokeRect(172, 42, 52, 40);
      label(ctx, '总分', 198, 62, 12, C.green, 'center', 800);
      label(ctx, '把分数汇总成单', 122, 116, 12, C.green, 'center', 700);
      break;
    }
    case 10: {
      // Result: one runner crosses the finish line as the scoreboard lights up.
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(24, 92);
      ctx.lineTo(220, 92);
      ctx.stroke();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(196, 92);
      ctx.lineTo(196, 44);
      ctx.stroke();
      ctx.lineWidth = 1;
      const rx = 40 + ((t * 1.1) % 1) * 150;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(rx, 84, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.green;
      rr(ctx, 140, 22, 52, 20, 4);
      ctx.fill();
      label(ctx, '排行榜', 166, 32, 11, '#fff', 'center', 800);
      break;
    }
    default:
      label(ctx, '阅卷', 122, 66, 18, C.muted, 'center', 700);
  }
}

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idx = sceneIndex(chapterId);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      draw(idx, t, ctx);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [idx]);
  return <canvas ref={canvasRef} width={W} height={H} aria-label="章节类比动画" />;
};

export default AnalogyScene;
