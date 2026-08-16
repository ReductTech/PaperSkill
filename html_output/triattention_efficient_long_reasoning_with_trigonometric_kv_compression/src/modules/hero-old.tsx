import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 340, H = 200;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', BLUE = '#27446e', RED = '#c43f52', ORANGE = '#d97706';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea', DIM = '#c7cfda';

// 标签底垫：避免文字与图形重叠
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

// Hero 左：传统压缩方法 —— post-RoPE 查询方向随位置旋转，观察窗口极小，关键 Key 常被误删。
export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const cx = 158, cy = 104, r = 52;
    const N = 12;

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 顶部标题带
      ctx.fillStyle = INK;
      ctx.font = 'bold 13px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('post-RoPE：查询随位置旋转', 18, 22);

      // 参考圆
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      const rot = t * 0.5;
      let keyTip: [number, number] = [0, 0];
      for (let i = 0; i < N; i++) {
        const isKey = i === 0; // 关键 Key：圆内、扇面中、不在观测窗口内的一个向量
        const recent = i >= N - 3;
        const ang = recent ? (i - (N - 2)) * 0.16 : -1.5 + (i / (N - 4)) * 3.0;
        const a = ang + rot;
        const len = recent ? r - 6 : r - 11;
        const x2 = cx + Math.cos(a) * len;
        const y2 = cy + Math.sin(a) * len;
        if (isKey) keyTip = [x2, y2];
        ctx.strokeStyle = isKey ? ORANGE : recent ? BLUE : DIM;
        ctx.lineWidth = isKey ? 3 : recent ? 2.5 : 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.fillStyle = isKey ? ORANGE : recent ? BLUE : DIM;
        ctx.beginPath(); ctx.arc(x2, y2, isKey ? 4.5 : recent ? 3.5 : 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

      // 观察窗口弧线（只包住最近 3 个）
      const wA = rot - 0.16;
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, r + 9, wA - 0.34, wA + 0.5, false); ctx.stroke();
      const lx = cx + Math.cos(wA + 0.1) * (r + 9);
      const ly = cy + Math.sin(wA + 0.1) * (r + 9);
      label(ctx, '观测窗口', Math.min(Math.max(lx - 34, 6), W - 90), Math.max(ly - 26, 30), ORANGE, '11px ' + FONT);

      // 关键 Key：圆内的一个向量，落在观测窗口之外，被误删（红叉标在向量上）
      const [kx2, ky2] = keyTip;
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(kx2 - 6, ky2 - 6); ctx.lineTo(kx2 + 6, ky2 + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(kx2 + 6, ky2 - 6); ctx.lineTo(kx2 - 6, ky2 + 6); ctx.stroke();
      label(ctx, '关键 Key（窗外）', Math.min(Math.max(kx2 - 46, 6), W - 110), Math.max(ky2 - 24, 30), ORANGE, 'bold 12px ' + FONT);
      label(ctx, '被误删', Math.min(Math.max(kx2 - 26, 6), W - 56), Math.max(ky2 + 6, 30), RED, '11px ' + FONT);

      // 底部说明带
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText('方向各异 → 只能看最近几个 → 关键记忆易丢失', 18, H - 12);
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

export default HeroOld;