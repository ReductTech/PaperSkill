import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §10 analogy — 结果阶梯：通过率从 69.7 沿阶梯爬升到 77.0，
// 四个关键迭代（2/5/6/8）以圆点标在阶梯线上，终点闪绿。560x140, autoplay, 3s loop.

const W = 560;
const H = 140;
const LOOP = 3000;

const C = {
  bg: '#f4f6f8',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#f07e47',
};

// [迭代序号, 通过率]
const STEPS: Array<[number, number]> = [
  [0, 69.7],
  [2, 72.4],
  [5, 74.9],
  [6, 76.0],
  [8, 77.0],
  [10, 77.0],
];
const MILESTONES = [2, 5, 6, 8];

const CH = { x0: 52, x1: 524, yBase: 112, yTop: 26, v0: 69, v1: 78 };

function xOf(iter: number) {
  return CH.x0 + (iter / 10) * (CH.x1 - CH.x0);
}
function yOf(v: number) {
  return CH.yBase - ((v - CH.v0) / (CH.v1 - CH.v0)) * (CH.yBase - CH.yTop);
}
function valueAt(iter: number) {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (iter >= STEPS[i][0]) return STEPS[i][1];
  }
  return STEPS[0][1];
}

export const AnaRaceWatch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // 轴线
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CH.x0, CH.yTop - 6);
      ctx.lineTo(CH.x0, CH.yBase);
      ctx.lineTo(CH.x1 + 6, CH.yBase);
      ctx.stroke();
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillStyle = C.muted;
      ctx.fillText(String(CH.v1), CH.x0 - 20, CH.yTop + 3);
      ctx.fillText(String(CH.v0), CH.x0 - 20, CH.yBase + 3);
      ctx.fillText('迭代 →', CH.x1 - 30, CH.yBase + 14);

      // 阶梯揭示进度
      const p = easeInOutQuad(clamp(t / 0.72, 0, 1));
      const iterHead = p * 10;
      const xHead = xOf(iterHead);
      const vHead = valueAt(iterHead);

      // 阶梯折线（画到揭示头）
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xOf(STEPS[0][0]), yOf(STEPS[0][1]));
      for (let i = 1; i < STEPS.length; i++) {
        const [it, v] = STEPS[i];
        const xSeg = Math.min(xOf(it), xHead);
        // 水平段
        ctx.lineTo(xSeg, yOf(STEPS[i - 1][1]));
        if (xOf(it) <= xHead) {
          // 垂直段
          ctx.lineTo(xOf(it), yOf(v));
        } else {
          break;
        }
      }
      ctx.lineTo(xHead, yOf(vHead));
      ctx.stroke();

      // 关键迭代圆点（揭示到该处时弹入）
      MILESTONES.forEach((m) => {
        if (iterHead < m) return;
        const pop = clamp((iterHead - m) / 0.8, 0, 1);
        const r = 4 * (0.4 + 0.6 * pop);
        ctx.beginPath();
        ctx.arc(xOf(m), yOf(valueAt(m)), r, 0, Math.PI * 2);
        ctx.fillStyle = C.orange;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'center';
        ctx.fillText(String(m), xOf(m), CH.yBase + 14);
        ctx.textAlign = 'left';
      });

      // 揭示头 + 当前值
      ctx.beginPath();
      ctx.arc(xHead, yOf(vHead), 5, 0, Math.PI * 2);
      ctx.fillStyle = C.blue;
      ctx.fill();
      const done = t > 0.78;
      if (!done) {
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillStyle = C.text;
        ctx.fillText(vHead.toFixed(1), xHead + 8, yOf(vHead) - 8);
      }

      // 起点标注
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = C.muted;
      ctx.fillText('69.7', xOf(0) - 4, yOf(69.7) + 18);

      // 终点 77.0 闪绿
      if (done) {
        const blink = Math.floor(now / 240) % 2 === 0;
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillStyle = blink ? C.green : C.text;
        ctx.fillText('77.0', xOf(8) - 6, yOf(77.0) - 12);
        const fp = clamp((t - 0.78) / 0.22, 0, 1);
        ctx.globalAlpha = 1 - fp * 0.7;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(xOf(9.2), yOf(77.0), 8 + fp * 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 图例（2 项）
      const ly = 134;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(210, ly - 4);
      ctx.lineTo(230, ly - 4);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.fillText('通过率', 236, ly);
      ctx.beginPath();
      ctx.arc(300, ly - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.orange;
      ctx.fill();
      ctx.fillStyle = C.muted;
      ctx.fillText('关键迭代', 310, ly);
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

export default AnaRaceWatch;
