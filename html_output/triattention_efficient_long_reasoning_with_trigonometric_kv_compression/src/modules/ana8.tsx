import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', BLUE = '#27446e', PURPLE = '#7c3aed', GREEN = '#228d5c', RED = '#c43f52';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';

// 4 个 Key：S_trig（距离偏好，蓝）+ S_norm（范数，紫）相加排名
const KEYS = [
  { id: 'K1', trig: 0.9, norm: 0.8 },
  { id: 'K2', trig: 0.8, norm: 0.3 },
  { id: 'K3', trig: 0.5, norm: 0.9 },
  { id: 'K4', trig: 0.3, norm: 0.4 },
];

// 第 7 章：打分 —— 两个分数（S_trig 蓝 + S_norm 紫）相加，给 Key 排名。
export const Ana8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      const cycle = t % 4.4;
      const fill = clamp(cycle / 2.2, 0, 1); // 0..1 填充
      const ranked = cycle >= 2.6; // 排名阶段

      // 标题
      ctx.fillStyle = INK;
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('两个分数给 Key 排名', 10, 18);

      // 各 Key：两根分数条（S_trig 蓝在上，S_norm 紫在下）
      KEYS.forEach((k, i) => {
        const x = 16 + i * 56;
        const total = k.trig + k.norm;
        const top = total >= 1.3; // 保留阈值
        const pruned = ranked && !top;
        ctx.globalAlpha = ranked && pruned ? 0.35 : 1;
        // Key 标签
        ctx.fillStyle = INK;
        ctx.font = '11px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(k.id, x + 20, 32);
        // S_trig 蓝条
        const th = k.trig * 26 * fill;
        ctx.fillStyle = BLUE;
        ctx.fillRect(x + 8, 74 - th, 24, th);
        // S_norm 紫条
        const nh = k.norm * 18 * fill;
        ctx.fillStyle = PURPLE;
        ctx.fillRect(x + 8, 96 - nh, 24, nh);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 8, 48, 24, 48);
        // 排名标记
        if (ranked) {
          ctx.fillStyle = top ? GREEN : RED;
          ctx.font = 'bold 11px ' + FONT;
          ctx.fillText(top ? '✓' : '✗', x + 20, 116);
        }
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      });

      // 底部说明
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText(ranked ? '两个分数相加，高的保留' : 'S_trig + S_norm 依次填充', 10, H - 8);
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

export default Ana8;