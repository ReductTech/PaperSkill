import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 analogy — 权限边界：workspace/ 可写区与禁区以虚线分隔；一个文件试图越过边界，被拦截弹回。
// 560x140, autoplay, 3s loop.

const W = 560;
const H = 140;
const LOOP = 3000;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  green: '#228d5c',
  red: '#c43f52',
};

const BOUND_X = 300;
const ZONE_L = { x: 10, w: BOUND_X - 20 };
const ZONE_R = { x: BOUND_X + 10, w: W - (BOUND_X + 10) - 10 };

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 小文件图标（带折角），左上角定位
function drawFile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: string) {
  const f = Math.min(w, h) * 0.28;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - f, y);
  ctx.lineTo(x + w, y + f);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w - f, y);
  ctx.lineTo(x + w - f, y + f);
  ctx.lineTo(x + w, y + f);
  ctx.stroke();
}

// 锁形符号，中心定位
function drawLock(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -3, 4, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = C.red;
  roundRect(ctx, -6, -3, 12, 10, 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 1.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 铅笔符号（写入中），中心定位
function drawPencil(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = C.steel;
  ctx.fillRect(-2.5, -10, 5, 14);
  ctx.beginPath();
  ctx.moveTo(-2.5, 4);
  ctx.lineTo(2.5, 4);
  ctx.lineTo(0, 10);
  ctx.closePath();
  ctx.fillStyle = C.text;
  ctx.fill();
  ctx.restore();
}

export const AnaLampBench: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (now: number) => {
      const t = (((now % LOOP) + LOOP) % LOOP) / LOOP;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ---- 两个区域 ----
      ctx.fillStyle = 'rgba(34,141,92,0.08)';
      roundRect(ctx, ZONE_L.x, 12, ZONE_L.w, 104, 8);
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(196,63,82,0.08)';
      roundRect(ctx, ZONE_R.x, 12, ZONE_R.w, 104, 8);
      ctx.fill();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 区域标签
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillStyle = C.green;
      ctx.fillText('workspace/', ZONE_L.x + 12, 30);
      ctx.fillStyle = C.red;
      ctx.fillText('禁区', ZONE_R.x + 12, 30);

      // 虚线边界
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(BOUND_X, 8);
      ctx.lineTo(BOUND_X, 122);
      ctx.stroke();
      ctx.setLineDash([]);

      // ---- 可写区：三个可编辑文件，中间一个正在写入 ----
      const editFiles = [44, 104, 164];
      editFiles.forEach((fx, i) => {
        drawFile(ctx, fx, 46, 26, 32, C.steel);
        // 文本行
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.5;
        for (let r = 0; r < 3; r++) {
          ctx.beginPath();
          ctx.moveTo(fx + 5, 56 + r * 7);
          ctx.lineTo(fx + 21, 56 + r * 7);
          ctx.stroke();
        }
        if (i === 1) {
          // 写入动画：一条绿线周期性增长 + 铅笔
          const wp = 0.5 + 0.5 * Math.sin(now / 350);
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fx + 5, 77);
          ctx.lineTo(fx + 5 + 16 * wp, 77);
          ctx.stroke();
          drawPencil(ctx, fx + 5 + 16 * wp, 70, 0.5);
        }
      });

      // ---- 禁区：三个只读项 + 锁 ----
      const locked = [
        { label: 'runs/', x: ZONE_R.x + 16 },
        { label: 'verifier', x: ZONE_R.x + 92 },
        { label: 'LLM 配置', x: ZONE_R.x + 168 },
      ];
      locked.forEach((it) => {
        drawFile(ctx, it.x, 46, 26, 32, C.red);
        drawLock(ctx, it.x + 13, 62, 0.9);
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'center';
        ctx.fillText(it.label, it.x + 13, 94);
        ctx.textAlign = 'left';
      });

      // ---- 越界动画：文件右移 → 触界红闪 → 弹回 ----
      // 0..0.42 接近，0.42..0.52 红闪，0.52..0.85 弹回，其余停顿
      const HOME_X = 216;
      const CONTACT_X = BOUND_X - 30;
      let fx2 = HOME_X;
      let flash = 0;
      if (t < 0.42) {
        fx2 = lerp(HOME_X, CONTACT_X, easeInOutQuad(t / 0.42));
      } else if (t < 0.52) {
        fx2 = CONTACT_X;
        flash = clamp((t - 0.42) / 0.1, 0, 1);
      } else if (t < 0.85) {
        fx2 = lerp(CONTACT_X, HOME_X, easeInOutQuad((t - 0.52) / 0.33));
      }
      const shake = flash > 0 ? Math.sin(now / 30) * 2 * flash : 0;
      drawFile(ctx, fx2 + shake, 44, 26, 32, flash > 0 ? C.red : C.steel);
      // 拦截红闪
      if (flash > 0) {
        ctx.globalAlpha = 1 - flash * 0.6;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(BOUND_X - 4, 60, 8 + flash * 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.red;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('✕', BOUND_X - 10, 40);
        ctx.textAlign = 'left';
      }

      // ---- 图例（3 项） ----
      const ly = 132;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillStyle = C.green;
      ctx.fillRect(150, ly - 9, 9, 9);
      ctx.fillStyle = C.muted;
      ctx.fillText('可写区', 164, ly);
      ctx.fillStyle = C.red;
      ctx.fillRect(228, ly - 9, 9, 9);
      ctx.fillStyle = C.muted;
      ctx.fillText('禁区', 242, ly);
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(296, ly - 4);
      ctx.lineTo(316, ly - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.fillText('权限边界', 322, ly);
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

export default AnaLampBench;
