import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-3-loupe-reveal — workspace/ 文件树：七类文件依次高亮（蓝色左边框扫入），
// 每次高亮向下方的 git 历史轨道落下一枚提交点（560x140，3.5s 循环）

const W = 560;
const H = 140;
const LOOP = 3500;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
};

const FILES = [
  { name: 'system_prompt.md', dir: false },
  { name: 'tools.json', dir: false },
  { name: 'tools.py', dir: false },
  { name: 'middleware/', dir: true },
  { name: 'skills/', dir: true },
  { name: 'agents.json', dir: false },
  { name: 'memory.md', dir: false },
];

const ROW_X = 160;
const ROW_W = 240;
const ROW_TOP = 24;
const ROW_H = 13.5;
const RAIL_Y = 130;

export const AnaLoupeReveal: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // 根目录标签
      ctx.fillStyle = C.steel;
      ctx.font = 'bold 12px Consolas, "Courier New", monospace';
      ctx.fillText('workspace/', ROW_X + 2, 15);

      const fadeOut = t > 0.92 ? 1 - (t - 0.92) / 0.08 : 1;

      // 文件行
      for (let i = 0; i < FILES.length; i++) {
        const ai = i * 0.095; // 激活时刻
        const sweep = easeOutCubic(clamp((t - ai) / 0.05, 0, 1));
        const active = t >= ai && t < ai + 0.12;
        const top = ROW_TOP + i * ROW_H;

        if (sweep > 0) {
          // 高亮背景扫入
          ctx.fillStyle = `rgba(39,68,110,${(active ? 0.16 : 0.08) * sweep * fadeOut})`;
          ctx.fillRect(ROW_X, top, ROW_W * sweep, ROW_H - 1.5);
          // 蓝色左边框
          ctx.fillStyle = `rgba(39,68,110,${sweep * fadeOut})`;
          ctx.fillRect(ROW_X, top, 3, ROW_H - 1.5);
        }

        // 文件/目录图标
        const ix = ROW_X + 12;
        const iy = top + 2;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = FILES[i].dir ? C.blue : C.muted;
        if (FILES[i].dir) {
          ctx.beginPath();
          ctx.moveTo(ix, iy + 2);
          ctx.lineTo(ix + 3, iy + 2);
          ctx.lineTo(ix + 4.5, iy + 4);
          ctx.lineTo(ix + 10, iy + 4);
          ctx.lineTo(ix + 10, iy + 9);
          ctx.lineTo(ix, iy + 9);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeRect(ix, iy, 8, 9);
        }

        // 文件名
        ctx.fillStyle = C.text;
        ctx.globalAlpha = 0.55 + 0.45 * Math.max(sweep, 0.35);
        ctx.font = '12px Consolas, "Courier New", monospace';
        ctx.fillText(FILES[i].name, ROW_X + 28, top + 10);
        ctx.globalAlpha = 1;
      }

      // git 历史轨道
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(ROW_X, RAIL_Y);
      ctx.lineTo(ROW_X + 130, RAIL_Y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // 提交点：高亮时从行位置落下，停在轨道上
      for (let i = 0; i < FILES.length; i++) {
        const ai = i * 0.095 + 0.02;
        const k = clamp((t - ai) / 0.22, 0, 1);
        if (k <= 0) continue;
        const e = easeOutCubic(k);
        const sx = ROW_X + ROW_W - 24;
        const sy = ROW_TOP + i * ROW_H + 6;
        const tx = ROW_X + 12 + i * 18;
        const dx = lerp(sx, tx, e);
        const dy = lerp(sy, RAIL_Y, e);
        ctx.save();
        ctx.globalAlpha = fadeOut;
        ctx.shadowColor = C.blue;
        ctx.shadowBlur = k < 1 ? 6 : 0;
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

export default AnaLoupeReveal;
