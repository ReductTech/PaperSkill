import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

/** 数据源体量变化 → 采样权重随之重配（少文字） */
const COLORS = [C.blue, C.orange, C.purple, C.green];

/** 三组「源体量」场景，权重按体量归一化 */
const SCENES: number[][] = [
  [0.45, 0.25, 0.20, 0.10],
  [0.15, 0.40, 0.30, 0.15],
  [0.25, 0.15, 0.10, 0.50],
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixWeights(a: number[], b: number[], t: number) {
  return a.map((v, i) => lerp(v, b[i], t));
}

export const Ana9: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0 = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const tick = (now: number) => {
      // 每段约 2s：停留 → 过渡到下一场景
      const cycle = ((now - t0.current) / 1000) % 6;
      const seg = Math.floor(cycle / 2);
      const local = (cycle % 2);
      const from = SCENES[seg % 3];
      const to = SCENES[(seg + 1) % 3];
      // 前 0.7s 停留，后 1.3s 插值
      const u = local < 0.7 ? 0 : Math.min(1, (local - 0.7) / 1.3);
      const ease = u * u * (3 - 2 * u);
      const w = mixWeights(from, to, ease);

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // 分区标签
      ctx.fillStyle = C.muted;
      ctx.font = '10px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('数据体量', 8, 12);

      // 上排：数据源「体量」小方块堆（高度=源大小）
      const baseY = 50;
      w.forEach((wi, i) => {
        const x = 22 + i * 54;
        const layers = Math.max(1, Math.round(wi * 5));
        for (let L = 0; L < layers; L++) {
          const ly = baseY - (L + 1) * 6;
          ctx.fillStyle = L === layers - 1 ? COLORS[i] : `${COLORS[i]}99`;
          ctx.strokeStyle = COLORS[i];
          ctx.lineWidth = 1;
          ctx.fillRect(x, ly, 36, 5);
          ctx.strokeRect(x, ly, 36, 5);
        }
        ctx.fillStyle = COLORS[i];
        ctx.beginPath();
        ctx.arc(x + 18, baseY + 7, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // 分隔线 + 「权重」标签
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(16, 64);
      ctx.lineTo(228, 64);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.font = '10px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('权重', 8, 76);

      // 下排：对应权重条（随源变化同步起伏）
      const barMax = 30;
      const barY = 118;
      w.forEach((wi, i) => {
        const x = 22 + i * 54;
        const bh = 5 + wi * barMax;
        ctx.fillStyle = '#e8edf5';
        ctx.fillRect(x + 6, barY - barMax - 4, 24, barMax + 4);
        ctx.fillStyle = COLORS[i];
        ctx.fillRect(x + 6, barY - bh, 24, bh);
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default Ana9;
