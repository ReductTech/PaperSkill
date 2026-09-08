import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';
const WAVE = ['#c7cfda', '#6f8fc7', '#e0a05a'];
const SUM = '#21324a';

const FREQS = [1.0, 2.1, 3.6];
// 不同 head：权重与相位不同 → 总曲线形态不同（近距/远距/多峰）
const HEADS = [
  { id: 'A', type: '近距偏好', w: [1.0, 0.5, 0.2], ph: [0.2, 1.0, 2.0] },
  { id: 'B', type: '远距偏好', w: [0.3, 0.6, 1.0], ph: [1.0, 2.2, 3.0] },
  { id: 'C', type: '多峰', w: [0.6, 0.9, 0.5], ph: [0.0, 2.6, 0.8] },
];

// 第 6 章：注意力 = 距离的三角级数 —— 多个频率的余弦叠加成一条距离偏好曲线。
export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      const head = HEADS[Math.floor((t % 9) / 3)];
      const bx = 10, bw = 224, by = 102, bh = 60;

      // 标题
      ctx.fillStyle = INK;
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('多个频率叠加 = 三角级数', 10, 18);

      // 坐标区
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by - bh, bw, bh);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by - bh, bw, bh);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); ctx.stroke();
      ctx.fillStyle = MUT;
      ctx.font = '10px ' + FONT;
      ctx.fillText('距离 Δ', bx + bw - 34, by + 12);

      // 各频率余弦 + 叠加和
      const sumY: number[] = [];
      const drawWave = (i: number, color: string, lw: number, sum: boolean) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let d = 0; d <= 80; d++) {
          const x = bx + (d / 80) * bw;
          const dd = (d / 80) * 12;
          let v = 0;
          if (sum) {
            let s = 0, tw = 0;
            head.w.forEach((w, k) => { s += w * Math.cos(FREQS[k] * dd - t * 1.5 + head.ph[k]); tw += w; });
            v = s / Math.max(tw, 1e-6);
          } else {
            v = Math.cos(FREQS[i] * dd - t * 1.5 + head.ph[i]);
          }
          const y = by - (v * 0.5 + 0.5) * bh;
          if (d === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          sumY[d] = y;
        }
        ctx.stroke();
      };
      // 先画三条单频（仅当 head 阶段显示）
      head.w.forEach((_, i) => drawWave(i, WAVE[i], 1.2, false));
      // 再画加粗叠加和
      ctx.strokeStyle = SUM;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let d = 0; d <= 80; d++) {
        const x = bx + (d / 80) * bw;
        const dd = (d / 80) * 12;
        let s = 0, tw = 0;
        head.w.forEach((w, k) => { s += w * Math.cos(FREQS[k] * dd - t * 1.5 + head.ph[k]); tw += w; });
        const y = by - ((s / Math.max(tw, 1e-6)) * 0.5 + 0.5) * bh;
        if (d === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 图例 + head
      ctx.fillStyle = INK;
      ctx.font = '11px ' + FONT;
      ctx.fillText('头部 ' + head.id + '（' + head.type + '）', 10, 30);
      ctx.fillStyle = MUT;
      ctx.font = '10px ' + FONT;
      ctx.fillText('频率低影响远，频率高影响近', 10, 44);

      // 底部说明
      ctx.fillStyle = MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText('叠加成一条注意力-距离曲线', 10, H - 8);
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

export default Ana7;