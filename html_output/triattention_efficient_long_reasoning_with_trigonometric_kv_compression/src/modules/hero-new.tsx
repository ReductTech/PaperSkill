import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 340, H = 200;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', BLUE = '#27446e', GREEN = '#228d5c', ORANGE = '#d97706';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';

const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, font: string) => {
  ctx.font = font;
  const w = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(245,248,240,0.92)';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const r = 6, h = 18;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w + r, y);
  ctx.arcTo(x + w + 2 * r, y, x + w + 2 * r, y + h, r);
  ctx.lineTo(x + w + 2 * r, y + h);
  ctx.arcTo(x + w + 2 * r, y + h, x + w + r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + h - r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fillText(text, x + r, y + 14);
};

// Hero 右：TriAttention —— 回到旋转前，Q/K 高度聚集，注意力变成可预测的距离曲线。
export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, lw: number) => {
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 6 * Math.cos(a - 0.4), y2 - 6 * Math.sin(a - 0.4));
      ctx.lineTo(x2 - 6 * Math.cos(a + 0.4), y2 - 6 * Math.sin(a + 0.4));
      ctx.closePath();
      ctx.fill();
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 顶部标题带
      ctx.fillStyle = INK;
      ctx.font = 'bold 13px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('pre-RoPE：稳定中心 → 距离可预测', 18, 22);

      // 左：旋转前的 Q/K 高度聚集（方向一致），以画布左半中心为基准
      const cx = 118, cy = 112;
      const base = -0.55 + Math.sin(t * 1.2) * 0.06;
      for (let i = 0; i < 8; i++) {
        const a = base + (i - 3.5) * 0.09;
        const len = 42 + (i % 3) * 4;
        arrow(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len, BLUE, 2.5);
      }
      ctx.fillStyle = GREEN;
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      label(ctx, 'R ≈ 0.97（聚集）', cx - 44, cy + 36, GREEN, 'bold 11px ' + FONT);

      // 右：由中心推出的距离偏好曲线（三角级数），坐标区居中于右半
      const bx = 216, by = 156, bw = 106, bh = 52;
      // 坐标区背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - 8, by - bh - 6, bw + 16, bh + 26);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx - 8, by - bh - 6, bw + 16, bh + 26);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - bh); ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const d = (i / 80) * 10;
        const v = 0.5 + 0.45 * Math.cos(2.4 * d + 0.7 + t * 0.3);
        const x = bx + (i / 80) * bw;
        const y = by - v * bh;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.fillStyle = MUT;
      ctx.font = '10px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('注意力 vs 距离 Δ', bx + bw / 2, by + 14);
      ctx.textAlign = 'left';
      label(ctx, '稳定中心 → 三角级数', bx - 8, 30, MUT, '11px ' + FONT);
      label(ctx, '提前预测哪个 Key 重要', bx - 8, 52, MUT, '11px ' + FONT);

      // 底部说明带
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText('用稳定中心替代旋转后的查询，预测距离偏好', 18, H - 12);
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

export default HeroNew;