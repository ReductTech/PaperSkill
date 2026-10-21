import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 类比：攀岩者反复试拉同一个岩点（手拉、岩点轻微弯曲），
// 旁边一个计数刻痕每次拉拽后从浅蓝加深。3 s 循环，无控件、无文字。

const W = 560;
const H = 140;
const LOOP = 3.0;

function mixHex(a: string, b: string, t: number): string {
  const p = (s: string) => [
    parseInt(s.slice(1, 3), 16),
    parseInt(s.slice(3, 5), 16),
    parseInt(s.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const k = clamp(t, 0, 1);
  return `rgb(${Math.round(r1 + (r2 - r1) * k)},${Math.round(g1 + (g2 - g1) * k)},${Math.round(
    b1 + (b2 - b1) * k
  )})`;
}

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
    const startT = performance.now();

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const render = (t: number) => {
      // 背景
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // 岩壁横带 + 深色轮廓
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 84, W, H - 84);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 84);
      ctx.lineTo(W, 84);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(118, 144, 106, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(70, 106);
      ctx.lineTo(150, 106);
      ctx.moveTo(300, 116);
      ctx.lineTo(420, 116);
      ctx.moveTo(180, 126);
      ctx.lineTo(260, 126);
      ctx.stroke();

      const loopT = (t % LOOP) / LOOP; // 0..1
      const ph = (loopT * 3) % 1; // 单次拉拽内的相位
      let pull = 0;
      if (ph >= 0.12 && ph <= 0.55) {
        pull = Math.sin(((ph - 0.12) / 0.43) * Math.PI);
      }
      const filled = Math.min(3, Math.floor(loopT * 3) + (ph >= 0.5 ? 1 : 0));

      // 计数刻痕：每次拉拽后从浅蓝加深
      for (let k = 0; k < 3; k++) {
        if (k < filled) {
          ctx.fillStyle = mixHex('#9db3d8', '#27446e', k / 2);
          roundRect(322 + k * 13, 90, 9, 40, 3);
          ctx.fill();
        } else {
          ctx.strokeStyle = '#76906a';
          ctx.lineWidth = 1.5;
          roundRect(322 + k * 13, 90, 9, 40, 3);
          ctx.stroke();
        }
      }

      // 岩点（被拉时轻微弯曲）
      ctx.save();
      ctx.translate(252, 98 + pull * 4);
      ctx.rotate(pull * 0.05);
      ctx.fillStyle = '#27446e';
      roundRect(-17, -11, 34, 22, 5);
      ctx.fill();
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 攀岩者：圆头 + 躯干/四肢线，手臂抓岩点
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.arc(148, 46, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(148, 55);
      ctx.lineTo(148, 88);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(148, 88);
      ctx.lineTo(134, 118);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(148, 88);
      ctx.lineTo(164, 118);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(148, 64);
      ctx.lineTo(236, 84 + pull * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(238, 86 + pull * 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = (now: number) => {
      render((now - startT) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch7Ana;
