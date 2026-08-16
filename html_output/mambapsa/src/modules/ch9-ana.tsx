import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9 类比卡：双向扫描。两个集成点各有走法——MambaPSA 替换主干末尾的 C2PSA，
// BiViM 则如正读一遍、再倒读一遍：一行 token 先正向扫、再反向扫，两个方向上下文相加。
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
const N = 8;
const SIZE = 15, PITCH = 23;
const X0 = 32, Y = 66;
const tokX = (i: number) => X0 + i * PITCH;
const LAST = tokX(N - 1);

export const Ch9Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    const drawTokens = (fill: (i: number) => string | null) => {
      for (let i = 0; i < N; i++) {
        const f = fill(i);
        if (f) {
          ctx.fillStyle = f;
          rr(ctx, tokX(i), Y, SIZE, SIZE, 4);
          ctx.fill();
        } else {
          ctx.fillStyle = '#ffffff';
          rr(ctx, tokX(i), Y, SIZE, SIZE, 4);
          ctx.fill();
          ctx.strokeStyle = C.line;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };
    const render = (t: number) => {
      clearScene(ctx, W, H);
      const p = (t / 3.0) % 1;

      if (p < 0.40) {
        // 正向扫描（橙）左→右
        const q = easeInOutQuad(clamp(p / 0.40, 0, 1));
        const head = lerp(X0 - SIZE, LAST, q);
        drawTokens((i) => (tokX(i) + SIZE / 2 <= head ? 'rgba(217,119,6,0.30)' : null));
        ctx.fillStyle = C.orange;
        ctx.beginPath(); ctx.arc(head + SIZE / 2, Y + SIZE / 2, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(head + SIZE / 2, Y + SIZE / 2, 4.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = C.orange; ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('正向扫描 →', X0, Y - 12);
      } else if (p < 0.80) {
        // 反向扫描（蓝）右→左
        const q = easeInOutQuad(clamp((p - 0.40) / 0.40, 0, 1));
        const head = lerp(LAST, X0 - SIZE, q);
        drawTokens((i) => (tokX(i) + SIZE / 2 >= head ? 'rgba(39,68,110,0.26)' : null));
        ctx.fillStyle = C.blue;
        ctx.beginPath(); ctx.arc(head + SIZE / 2, Y + SIZE / 2, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(head + SIZE / 2, Y + SIZE / 2, 4.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = C.blue; ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('← 反向扫描', X0, Y + SIZE + 18);
      } else {
        // 两向都扫过：相加 + 输出
        drawTokens(() => 'rgba(39,68,110,0.26)');
        drawTokens((i) => (i % 2 ? 'rgba(217,119,6,0.30)' : null));
        const mx = X0 + N * PITCH + 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(mx, Y + SIZE / 2, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.blue; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = C.blue; ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+', mx, Y + SIZE / 2 + 5);
        ctx.textAlign = 'left';
        ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('两向上下文相加', X0 + 6, Y + SIZE + 18);
      }
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
