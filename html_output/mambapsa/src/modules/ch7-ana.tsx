import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 类比卡：选择性记忆。并非所有内容都值得记忆——重要的内容被纳入隐状态（记忆条增长），
// 无关的内容从旁略过。每一步记忆多少由输入决定，这正是「选择性」。
const C = {
  scene: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#d97706', purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene;
  ctx.fillRect(0, 0, w, h);
}

const W = 244, H = 130;
// 关键内容（纳入记忆）与无关内容（略过）的投放时刻（0..1 循环）
const KEEP = [0, 0.5];
const SKIP = [0.25, 0.75];
const FALL = 0.42;

export const Ch7Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const render = (t: number) => {
      clearScene(ctx, W, H);
      const p = t / 3.0;

      // 记忆条底板
      ctx.fillStyle = C.line;
      rr(ctx, 30, 102, 184, 12, 6);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('隐状态 h', 30, 96);

      // 重要的内容：落入记忆条并被吸收
      let absorbed = 0;
      KEEP.forEach((t0) => {
        const local = clamp((p - t0) / FALL, 0, 1);
        if (local >= 1) {
          absorbed++;
          return;
        }
        const y = lerp(24, 96, easeInOutQuad(local));
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(122, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 无关的内容：略过，颜色淡
      SKIP.forEach((t0) => {
        const local = clamp((p - t0) / FALL, 0, 1);
        if (local >= 1) return;
        const y = lerp(24, 122, easeInOutQuad(local));
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = C.muted;
        ctx.beginPath();
        ctx.arc(172, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // 记忆条增长
      const fill = absorbed / KEEP.length;
      if (fill > 0) {
        ctx.fillStyle = C.blue;
        rr(ctx, 30, 102, Math.max(3, 184 * fill), 12, 6);
        ctx.fill();
      }

      // 图注
      ctx.fillStyle = C.orange;
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('重要 → 纳入记忆', 30, 20);
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('无关 → 略过', 172 - 58, 52);
    };
    const tick = (t: number) => {
      render((t / 1000) % 3.0);
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
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};
