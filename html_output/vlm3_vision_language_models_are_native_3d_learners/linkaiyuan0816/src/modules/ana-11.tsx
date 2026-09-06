import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

/** 参考论文 Fig. 3：四角分别示意深度 / 物体 / 对应 / 位姿 */
const CELLS: {
  title: string;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, on: boolean) => void;
}[] = [
  {
    title: '深度',
    draw: (ctx, x, y, w, h, on) => {
      // 窗框 + 点云（室内深度示意）
      ctx.fillStyle = on ? '#e8f5ee' : '#fff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = on ? C.green : C.border;
      ctx.lineWidth = on ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      // 远近点
      const pts = [
        [0.2, 0.55, 2],
        [0.35, 0.4, 2.5],
        [0.5, 0.62, 3],
        [0.62, 0.35, 2],
        [0.75, 0.5, 3.5],
        [0.28, 0.72, 2],
        [0.55, 0.78, 2.5],
        [0.78, 0.7, 2],
      ];
      pts.forEach(([u, v, r]) => {
        ctx.beginPath();
        ctx.fillStyle = on ? C.green : C.blue;
        ctx.arc(x + u * w, y + 14 + v * (h - 18), r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = on ? C.green : C.text;
      ctx.font = '9px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('深度', x + 4, y + 11);
    },
  },
  {
    title: '物体',
    draw: (ctx, x, y, w, h, on) => {
      ctx.fillStyle = on ? '#eef2ff' : '#fff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = on ? C.purple : C.border;
      ctx.lineWidth = on ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      // 两个 bbox（可视化用，模型只看原图）
      ctx.strokeStyle = on ? C.purple : C.orange;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 8, y + 18, 28, 22);
      ctx.strokeRect(x + 42, y + 28, 32, 20);
      ctx.fillStyle = on ? C.purple : C.muted;
      ctx.font = '8px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('前/后', x + 10, y + 52);
      ctx.fillStyle = on ? C.purple : C.text;
      ctx.font = '9px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('物体', x + 4, y + 11);
    },
  },
  {
    title: '对应',
    draw: (ctx, x, y, w, h, on) => {
      ctx.fillStyle = on ? '#fff7ed' : '#fff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = on ? C.orange : C.border;
      ctx.lineWidth = on ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      // 左右两小图 + 匹配线（点线为预测，叉为 GT）
      const ly = y + 20;
      const lh = h - 28;
      const lw = (w - 16) / 2;
      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(x + 5, ly, lw, lh);
      ctx.fillRect(x + 9 + lw, ly, lw, lh);
      ctx.strokeStyle = on ? C.orange : C.blue;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(x + 5 + lw * 0.4, ly + lh * 0.35);
      ctx.lineTo(x + 9 + lw + lw * 0.55, ly + lh * 0.45);
      ctx.stroke();
      ctx.setLineDash([]);
      // GT cross
      const gx = x + 9 + lw + lw * 0.55;
      const gy = ly + lh * 0.55;
      ctx.strokeStyle = C.red;
      ctx.beginPath();
      ctx.moveTo(gx - 3, gy - 3);
      ctx.lineTo(gx + 3, gy + 3);
      ctx.moveTo(gx + 3, gy - 3);
      ctx.lineTo(gx - 3, gy + 3);
      ctx.stroke();
      // endpoints dots
      ctx.fillStyle = on ? C.orange : C.blue;
      ctx.beginPath();
      ctx.arc(x + 5 + lw * 0.4, ly + lh * 0.35, 2, 0, Math.PI * 2);
      ctx.arc(x + 9 + lw + lw * 0.55, ly + lh * 0.45, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = on ? C.orange : C.text;
      ctx.font = '9px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('对应', x + 4, y + 11);
    },
  },
  {
    title: '位姿',
    draw: (ctx, x, y, w, h, on) => {
      ctx.fillStyle = on ? '#eff6ff' : '#fff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = on ? C.blue : C.border;
      ctx.lineWidth = on ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      // 两台相机锥体示意
      const drawCam = (cx: number, cy: number, ang: number, col: string) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.strokeStyle = col;
        ctx.fillStyle = col + '44';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(14, -8);
        ctx.lineTo(14, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.fillRect(-3, -3, 6, 6);
        ctx.restore();
      };
      drawCam(x + 28, y + 36, -0.35, on ? C.blue : C.muted);
      drawCam(x + 72, y + 40, 0.45, on ? C.green : C.orange);
      ctx.fillStyle = on ? C.blue : C.text;
      ctx.font = '9px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('位姿', x + 4, y + 11);
    },
  },
];

export const Ana11: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0 = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const pad = 4;
    const gap = 3;
    const cellW = (W - pad * 2 - gap) / 2;
    const cellH = (H - pad * 2 - gap) / 2;
    const origins = [
      { x: pad, y: pad },
      { x: pad + cellW + gap, y: pad },
      { x: pad, y: pad + cellH + gap },
      { x: pad + cellW + gap, y: pad + cellH + gap },
    ];

    const tick = (now: number) => {
      const t = ((now - t0.current) / 1000) % 4.8;
      const st = Math.floor(t / 1.2) % 4;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      CELLS.forEach((cell, i) => {
        const o = origins[i];
        cell.draw(ctx, o.x, o.y, cellW, cellH, i === st);
      });

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

  return <canvas ref={canvasRef} width={W} height={H} />;
};

export default Ana11;
