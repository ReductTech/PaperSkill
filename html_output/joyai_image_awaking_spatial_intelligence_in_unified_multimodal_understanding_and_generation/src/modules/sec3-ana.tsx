import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const BG = '#fffaf1', INK = '#222222', MUTED = '#666666', BLUE = '#33ccff', DARK = '#9933ff';

// 类比：取景器框（角括号+十字准星）覆盖一个 3D 小盒子，缓慢平移。
export const Sec3Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    // 绘制一个等距立方体
    const box = (cx: number, cy: number, s: number) => {
      const d = s * 0.5;
      // 前面
      ctx.fillStyle = DARK;
      ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
      // 顶面
      ctx.fillStyle = '#8fa87f';
      ctx.beginPath();
      ctx.moveTo(cx - s / 2, cy - s / 2);
      ctx.lineTo(cx - s / 2 + d, cy - s / 2 - d);
      ctx.lineTo(cx + s / 2 + d, cy - s / 2 - d);
      ctx.lineTo(cx + s / 2, cy - s / 2);
      ctx.closePath(); ctx.fill();
      // 右侧面
      ctx.fillStyle = '#5f7756';
      ctx.beginPath();
      ctx.moveTo(cx + s / 2, cy - s / 2);
      ctx.lineTo(cx + s / 2 + d, cy - s / 2 - d);
      ctx.lineTo(cx + s / 2 + d, cy + s / 2 - d);
      ctx.lineTo(cx + s / 2, cy + s / 2);
      ctx.closePath(); ctx.fill();
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

      const cy = 56;
      // 平移
      const pan = Math.sin(t / 1400) * 22;
      box(W / 2 + pan * 0.4, cy, 30);

      // 取景器框
      const fw = 120, fh = 74;
      const fx = W / 2 - fw / 2 + pan, fy = cy - fh / 2;
      const c = 14;
      ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5;
      // 四角括号
      const corner = (x: number, y: number, dx: number, dy: number) => {
        ctx.beginPath();
        ctx.moveTo(x + dx * c, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * c);
        ctx.stroke();
      };
      corner(fx, fy, 1, 1);
      corner(fx + fw, fy, -1, 1);
      corner(fx, fy + fh, 1, -1);
      corner(fx + fw, fy + fh, -1, -1);

      // 十字准星
      const ccx = fx + fw / 2, ccy = fy + fh / 2;
      ctx.strokeStyle = MUTED; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ccx - 8, ccy); ctx.lineTo(ccx + 8, ccy);
      ctx.moveTo(ccx, ccy - 8); ctx.lineTo(ccx, ccy + 8);
      ctx.stroke();

      ctx.fillStyle = MUTED; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('取景器 · 多视角预览', W / 2, H - 8);
    };

    const tick = () => {
      render(performance.now());
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

export default Sec3Ana;
