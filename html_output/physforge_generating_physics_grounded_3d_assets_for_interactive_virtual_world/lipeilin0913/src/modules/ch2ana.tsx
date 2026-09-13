import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 analogy (560x140): 一张照片 → 零件清单（照片框 + 箭头 + 逐行打勾的清单卡片）。
// 左侧照片框里有一个可辨识的小柜子，扫描带扫过照片（模型在“看”），中间箭头脉冲，
// 右侧“零件清单”卡片逐行打勾（柜体 / 柜门 / 抽屉，与正文 §2 术语一致）。循环无瞬移。
const W = 560;
const H = 140;
const T = 3800; // full loop (ms)

const ROWS: Array<{ label: string; swatch: string }> = [
  { label: '柜体', swatch: '#92400e' },
  { label: '柜门', swatch: '#a0522d' },
  { label: '抽屉', swatch: '#7a3509' },
];

export const Ch2Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    // rounded-rect path helper (avoids ctx.roundRect for older TS DOM libs)
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // small but recognizable cabinet: body + door + drawer + knob/handle
    const miniCabinet = (x: number, y: number) => {
      ctx.fillStyle = '#92400e'; // 柜体
      ctx.fillRect(x, y, 90, 66);
      ctx.fillStyle = '#a0522d'; // 柜门
      ctx.fillRect(x + 6, y + 6, 78, 36);
      ctx.fillStyle = '#7a3509'; // 抽屉
      ctx.fillRect(x + 6, y + 47, 78, 13);
      ctx.fillStyle = '#d7deea'; // 把手
      ctx.beginPath();
      ctx.arc(x + 72, y + 24, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 37, y + 51, 16, 4);
    };

    const render = (time: number) => {
      const t = (time / T) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);

      // ---- left: photo frame containing a recognizable cabinet ----
      const px = 26;
      const py = 16;
      const pw = 168;
      const ph = 94;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      rr(px, py, pw, ph, 6);
      ctx.fill();
      ctx.stroke();
      // photo content (clipped inside the frame)
      ctx.save();
      rr(px + 5, py + 5, pw - 10, ph - 10, 4);
      ctx.clip();
      ctx.fillStyle = '#dfe9f2'; // photo backdrop
      ctx.fillRect(px + 5, py + 5, pw - 10, ph - 10);
      ctx.fillStyle = '#c9d6c2'; // floor inside the photo
      ctx.fillRect(px + 5, py + ph - 24, pw - 10, 19);
      miniCabinet(px + 40, py + 20);
      // scan band sweeps across the photo once per loop: the model “看” the picture
      const scan = easeInOutQuad(clamp(t / 0.3, 0, 1));
      if (t < 0.32) {
        const sx = px + 5 + scan * (pw - 10);
        ctx.fillStyle = 'rgba(34,141,92,0.22)';
        ctx.fillRect(sx - 16, py + 5, 16, ph - 10);
        ctx.fillStyle = 'rgba(34,141,92,0.5)';
        ctx.fillRect(sx - 1.5, py + 5, 3, ph - 10);
      }
      ctx.restore();
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('输入：一张照片', px + 42, 130);

      // ---- middle: pulsing arrow (green = PhysForge) ----
      const pulse = 0.5 + 0.5 * Math.sin(time / 260);
      const ax = 218;
      const ay = 63;
      const tipX = ax + 52 + 4 * pulse;
      ctx.strokeStyle = `rgba(34,141,92,${0.55 + 0.45 * pulse})`;
      ctx.fillStyle = `rgba(34,141,92,${0.55 + 0.45 * pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(tipX - 12, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tipX - 12, ay - 8);
      ctx.lineTo(tipX, ay);
      ctx.lineTo(tipX - 12, ay + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#228d5c';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('PhysForge', ax - 2, 96);

      // ---- right: parts-list card, rows get checked one by one ----
      const cx0 = 312;
      const cy0 = 12;
      const cw = 224;
      const ch = 106;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      rr(cx0, cy0, cw, ch, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('零件清单', cx0 + 14, cy0 + 21);
      // checks appear sequentially, hold, then fade out before the loop wraps
      const fade = 1 - clamp((t - 0.86) / 0.12, 0, 1);
      ROWS.forEach((row, i) => {
        const ry = cy0 + 44 + i * 22;
        // checkbox
        ctx.strokeStyle = '#76906a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx0 + 14, ry - 10, 12, 12);
        // label + wood-tone swatch tying each row to a real part
        ctx.fillStyle = '#21324a';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(row.label, cx0 + 34, ry + 1);
        ctx.fillStyle = row.swatch;
        ctx.fillRect(cx0 + 150, ry - 9, 14, 10);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx0 + 150, ry - 9, 14, 10);
        // green check pops in with easing
        const a = easeOutCubic(clamp((t - (0.34 + i * 0.13)) / 0.09, 0, 1)) * fade;
        if (a > 0.01) {
          ctx.globalAlpha = a;
          ctx.strokeStyle = '#228d5c';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx0 + 15.5, ry - 4);
          ctx.lineTo(cx0 + 19, ry - 0.5);
          ctx.lineTo(cx0 + 27.5, ry - 9);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('输出：由哪几件组成', cx0 + 42, 130);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch2Ana;
