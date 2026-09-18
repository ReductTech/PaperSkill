import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-5-tier-sort — 变更清单与对账：左侧清单卡（证据 / 根因 / 修复 / 预测影响，
// 预测行高亮），箭头指向右侧对账面板，两条编辑记录交替出现
// 绿色 ✓（兑现→保留）与红色 ↩（未兑现→回滚）（560x140，3s 循环）

const W = 560;
const H = 140;
const LOOP = 3000;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  blue: '#27446e',
};

const DOC_X = 30;
const DOC_Y = 18;
const DOC_W = 220;
const DOC_H = 104;
const PANEL_X = 310;
const PANEL_W = 220;

const ROWS = ['证据', '根因', '修复', '预测影响'];
const STROKE_W = [82, 96, 68, 88];

function win(t: number, a: number, b: number, edge: number): number {
  return clamp((t - a) / edge, 0, 1) * clamp((b - t) / edge, 0, 1);
}

function drawCheck(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x - s * 0.25, y + s * 0.75);
  ctx.lineTo(x + s, y - s * 0.85);
  ctx.stroke();
}

function drawRevert(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  const a0 = -Math.PI * 0.5;
  const a1 = Math.PI * 0.85;
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a1);
  ctx.stroke();
  const hx = x + Math.cos(a0) * r;
  const hy = y + Math.sin(a0) * r;
  const back = Math.atan2(-Math.cos(a0), Math.sin(a0)); // 切线反方向（指回）
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(hx + 5 * Math.cos(back), hy + 5 * Math.sin(back));
  ctx.lineTo(hx - 4 * Math.cos(back - 0.5), hy - 4 * Math.sin(back - 0.5));
  ctx.lineTo(hx - 4 * Math.cos(back + 0.5), hy - 4 * Math.sin(back + 0.5));
  ctx.closePath();
  ctx.fill();
}

export const AnaTierSort: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let startTs = 0;

    const render = (now: number) => {
      if (!startTs) startTs = now;
      const t = ((now - startTs) % LOOP) / LOOP;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      const a1 = win(t, 0.08, 0.46, 0.07); // ✓ 窗口
      const a2 = win(t, 0.55, 0.93, 0.07); // ↩ 窗口
      const hiPulse = 0.6 + 0.4 * Math.sin(now * 0.005);

      // 变更清单卡
      ctx.beginPath();
      ctx.roundRect(DOC_X, DOC_Y, DOC_W, DOC_H, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.border;
      ctx.stroke();

      // 预测影响行高亮
      const hiY = DOC_Y + 76;
      ctx.fillStyle = `rgba(240,126,71,${0.1 * hiPulse})`;
      ctx.fillRect(DOC_X + 5, hiY, DOC_W - 10, 20);
      ctx.fillStyle = `rgba(240,126,71,${0.75 * hiPulse})`;
      ctx.fillRect(DOC_X + 5, hiY, 3, 20);

      // 清单行：标签 + 类文本描线
      for (let i = 0; i < ROWS.length; i++) {
        const ry = DOC_Y + 22 + i * 22;
        ctx.fillStyle = i === 3 ? C.orange : C.text;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(ROWS[i], DOC_X + 16, ry + 4);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(DOC_X + 86, ry);
        ctx.lineTo(DOC_X + 86 + STROKE_W[i], ry);
        ctx.stroke();
      }

      // 中间箭头
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(DOC_X + DOC_W + 8, 70);
      ctx.lineTo(PANEL_X - 12, 70);
      ctx.stroke();
      ctx.fillStyle = C.steel;
      ctx.beginPath();
      ctx.moveTo(PANEL_X - 8, 70);
      ctx.lineTo(PANEL_X - 17, 65.5);
      ctx.lineTo(PANEL_X - 17, 74.5);
      ctx.closePath();
      ctx.fill();

      // 对账面板
      ctx.beginPath();
      ctx.roundRect(PANEL_X, DOC_Y, PANEL_W, DOC_H, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.border;
      ctx.stroke();

      // 两条编辑记录
      const rowYs = [DOC_Y + 12, DOC_Y + 56];
      for (let i = 0; i < 2; i++) {
        const ry = rowYs[i];
        const a = i === 0 ? a1 : a2;
        if (a > 0) {
          ctx.fillStyle =
            i === 0 ? `rgba(34,141,92,${0.1 * a})` : `rgba(196,63,82,${0.1 * a})`;
          ctx.fillRect(PANEL_X + 5, ry, PANEL_W - 10, 36);
        }
        // 编辑条：蓝色小块 + 两条描线
        ctx.fillStyle = C.blue;
        ctx.fillRect(PANEL_X + 16, ry + 8, 10, 10);
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(PANEL_X + 34, ry + 10);
        ctx.lineTo(PANEL_X + 34 + 92 + i * 18, ry + 10);
        ctx.moveTo(PANEL_X + 34, ry + 22);
        ctx.lineTo(PANEL_X + 34 + 58 + i * 10, ry + 22);
        ctx.stroke();
      }

      // 结果符号
      if (a1 > 0) {
        ctx.save();
        ctx.globalAlpha = a1;
        drawCheck(ctx, PANEL_X + PANEL_W - 26, rowYs[0] + 18, 8, C.green);
        ctx.restore();
      }
      if (a2 > 0) {
        ctx.save();
        ctx.globalAlpha = a2;
        drawRevert(ctx, PANEL_X + PANEL_W - 26, rowYs[1] + 18, 8, C.red);
        ctx.restore();
      }

      // 图例
      ctx.font = '12px "Segoe UI", sans-serif';
      drawCheck(ctx, 348, 131, 5, C.green);
      ctx.fillStyle = C.text;
      ctx.fillText('保留', 358, 135);
      drawRevert(ctx, 418, 131, 5, C.red);
      ctx.fillText('回滚', 428, 135);
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default AnaTierSort;
