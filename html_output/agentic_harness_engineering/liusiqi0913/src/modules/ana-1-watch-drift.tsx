import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-1-watch-drift — 三大障碍示意：动作空间异构 / 信号被淹没 / 效果难归因
// 三个红框依次被红色辉光扫过（560x140，3s 循环，自动播放）

const W = 560;
const H = 140;
const LOOP = 3000;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  red: '#c43f52',
  green: '#228d5c',
  orange: '#f07e47',
};

const BOX_W = 160;
const BOX_H = 92;
const BOX_Y = 24;
const BOX_XS = [20, 200, 380];
const LABELS = ['动作空间异构', '信号被淹没', '效果难归因'];

const rnd = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const AnaWatchDrift: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      const s = t * 3;

      for (let i = 0; i < 3; i++) {
        const x = BOX_XS[i];
        const cx = x + BOX_W / 2;
        const glow = clamp(1 - Math.abs(s - (i + 0.5)) * 1.5, 0, 1);

        // 箱体 + 红色辉光脉冲
        ctx.save();
        if (glow > 0) {
          ctx.shadowColor = 'rgba(196,63,82,0.5)';
          ctx.shadowBlur = 15 * glow;
        }
        ctx.beginPath();
        ctx.roundRect(x, BOX_Y, BOX_W, BOX_H, 8);
        ctx.fillStyle = C.panel;
        ctx.fill();
        ctx.lineWidth = 2 + glow;
        ctx.strokeStyle = C.red;
        ctx.stroke();
        ctx.restore();
        if (glow > 0) {
          ctx.beginPath();
          ctx.roundRect(x, BOX_Y, BOX_W, BOX_H, 8);
          ctx.fillStyle = `rgba(196,63,82,${0.06 * glow})`;
          ctx.fill();
        }

        if (i === 0) {
          // 异构：散落的不同形状（轻微漂移）
          for (let k = 0; k < 9; k++) {
            const wob = Math.sin(now * 0.002 + k * 1.7) * 1.6;
            const px = x + 26 + rnd(k, 1) * (BOX_W - 52) + wob;
            const py = BOX_Y + 14 + rnd(k, 2) * 38 + Math.cos(now * 0.0023 + k) * 1.6;
            const kind = k % 3;
            ctx.strokeStyle = k % 4 === 0 ? C.red : C.steel;
            ctx.lineWidth = 1.8;
            if (kind === 0) {
              ctx.strokeRect(px - 3.5, py - 3.5, 7, 7);
            } else if (kind === 1) {
              ctx.beginPath();
              ctx.arc(px, py, 4, 0, Math.PI * 2);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.moveTo(px, py - 4.5);
              ctx.lineTo(px + 4, py + 3.5);
              ctx.lineTo(px - 4, py + 3.5);
              ctx.closePath();
              ctx.stroke();
            }
          }
        } else if (i === 1) {
          // 淹没：密集线堆中一条被埋没的橙色信号线
          for (let k = 0; k < 9; k++) {
            const ly = BOX_Y + 15 + k * 5.6;
            const len = 66 + rnd(k, 3) * 48;
            const hot = k === 4;
            ctx.strokeStyle = hot ? C.orange : C.muted;
            ctx.lineWidth = hot ? 3 : 1.6;
            ctx.globalAlpha = hot ? 0.65 + 0.35 * glow : 0.75;
            ctx.beginPath();
            ctx.moveTo(x + 26, ly);
            ctx.lineTo(x + 26 + len, ly);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        } else {
          // 归因：diff 符号上浮动的问号
          const bob = Math.sin(now * 0.004) * 2.5;
          ctx.fillStyle = C.muted;
          ctx.font = 'bold 20px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('?', cx, BOX_Y + 26 + bob);
          ctx.textAlign = 'left';
          ctx.font = '12px Consolas, "Courier New", monospace';
          ctx.fillStyle = C.red;
          ctx.fillText('-', cx - 34, BOX_Y + 52);
          ctx.fillStyle = C.green;
          ctx.fillText('+', cx - 34, BOX_Y + 66);
          ctx.strokeStyle = C.muted;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 22, BOX_Y + 48);
          ctx.lineTo(cx + 26, BOX_Y + 48);
          ctx.moveTo(cx - 22, BOX_Y + 62);
          ctx.lineTo(cx + 34, BOX_Y + 62);
          ctx.stroke();
        }

        // 标签
        ctx.fillStyle = glow > 0.4 ? C.red : C.text;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(LABELS[i], cx, BOX_Y + BOX_H - 10);
        ctx.textAlign = 'left';
      }
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

export default AnaWatchDrift;
