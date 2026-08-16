import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', BLUE = '#27446e', GREEN = '#228d5c', RED = '#c43f52', ORANGE = '#d97706';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';

const TOKENS = ['设', 'x', '=', '3', '。', 'x', '+', '5', '=', '8', '。', '8', '×', '2', '=', '16'];

// 第 1 章：KV 缓存越来越大 —— 每生成一个 token，缓存多一份，最终超出显存预算。
export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 顶部标题带
      ctx.fillStyle = INK;
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('生成 token → KV 缓存增长', 10, 20);

      // token 卡片行：逐个出现
      const cycle = (t % 4.8) / 4.8;
      const shown = Math.min(TOKENS.length, Math.floor(cycle * (TOKENS.length + 2)));
      const cw = 24, chh = 20, gap = 3;
      for (let i = 0; i < shown; i++) {
        const x = 8 + i * (cw + gap);
        if (x + cw > W - 6) break;
        const isNew = i === shown - 1;
        ctx.fillStyle = isNew ? BLUE : '#ffffff';
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const r = 4;
        ctx.moveTo(x + r, 26);
        ctx.lineTo(x + cw - r, 26);
        ctx.arcTo(x + cw, 26, x + cw, 26 + r, r);
        ctx.lineTo(x + cw, 26 + chh - r);
        ctx.arcTo(x + cw, 26 + chh, x + cw - r, 26 + chh, r);
        ctx.lineTo(x + r, 26 + chh);
        ctx.arcTo(x, 26 + chh, x, 26 + chh - r, r);
        ctx.lineTo(x, 26 + r);
        ctx.arcTo(x, 26, x + r, 26, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isNew ? '#fff' : INK;
        ctx.font = '11px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(TOKENS[i], x + cw / 2, 26 + 14);
        ctx.textAlign = 'left';
      }

      // 缓存容量柱 + 预算线
      const bx = 8, by = 66, bw = 228, bh = 14;
      const progress = shown / TOKENS.length;
      const budgetX = bx + bw * 0.8;
      ctx.fillStyle = '#eef1f5';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = progress > 0.8 ? RED : GREEN;
      ctx.fillRect(bx, by, Math.max(2, bw * progress), bh);
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(budgetX, by - 4); ctx.lineTo(budgetX, by + bh + 4); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ORANGE;
      ctx.font = '10px ' + FONT;
      ctx.fillText('显存预算', budgetX - 34, by + bh + 12);
      ctx.fillStyle = MUT;
      ctx.fillText('KV 缓存 ' + Math.round(progress * 100) + '%', bx, by + bh + 12);

      // 底部状态
      ctx.fillStyle = progress > 0.8 ? RED : MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText(progress > 0.8 ? '超出显存预算 → 长推理放不下' : '每生成一个 token，缓存多一份', 10, H - 8);
    };

    const tick = (ts: number) => {
      render(ts / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana1;