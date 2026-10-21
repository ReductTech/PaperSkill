import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 类比：攀岩者的手沿岩壁依次轻拍 3 颗岩钉；
// 被拍的岩钉蓝色脉冲，最受力的一颗脉冲最深。3.2 s 循环，无控件、无文字。

const W = 560;
const H = 140;
const LOOP = 3.2;
const PITON_X = [150, 285, 420];
const PULSE_ALPHA = [0.35, 0.6, 0.95]; // 第三颗最受力 → 脉冲最深

type Phase =
  | { kind: 'move'; from: number; to: number; dur: number }
  | { kind: 'dwell'; at: number; piton: number; dur: number };

const PHASES: Phase[] = [
  { kind: 'move', from: 116, to: 150, dur: 0.13 },
  { kind: 'dwell', at: 150, piton: 0, dur: 0.1 },
  { kind: 'move', from: 150, to: 285, dur: 0.13 },
  { kind: 'dwell', at: 285, piton: 1, dur: 0.1 },
  { kind: 'move', from: 285, to: 420, dur: 0.13 },
  { kind: 'dwell', at: 420, piton: 2, dur: 0.1 },
  { kind: 'move', from: 420, to: 285, dur: 0.09 },
  { kind: 'move', from: 285, to: 150, dur: 0.09 },
  { kind: 'move', from: 150, to: 116, dur: 0.09 },
];
const TOTAL = PHASES.reduce((s, p) => s + p.dur, 0);

export const Ch8Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // 手部路径：依次移动 → 轻拍 → 返回（首尾相接，无跳变）
      const u = ((t % LOOP) / LOOP) * TOTAL;
      let acc = 0;
      let pi = PHASES.length - 1;
      let frac = 1;
      for (let i = 0; i < PHASES.length; i++) {
        if (u < acc + PHASES[i].dur) {
          pi = i;
          frac = (u - acc) / PHASES[i].dur;
          break;
        }
        acc += PHASES[i].dur;
      }
      const ph = PHASES[pi];
      let hx = 116;
      let push = 0;
      let pulse = 0;
      let tapPiton = -1;
      if (ph.kind === 'move') {
        const e = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2;
        hx = lerp(ph.from, ph.to, e);
      } else {
        hx = ph.at;
        pulse = clamp(Math.sin(frac * Math.PI), 0, 1);
        push = pulse * 5;
        tapPiton = ph.piton;
      }

      // 三颗三角锚钉 + 绿环；被拍时蓝色脉冲
      for (let i = 0; i < 3; i++) {
        const x = PITON_X[i];
        ctx.fillStyle = '#21324a';
        ctx.beginPath();
        ctx.moveTo(x - 8, 64);
        ctx.lineTo(x + 8, 64);
        ctx.lineTo(x, 88);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, 76, 6, 0, Math.PI * 2);
        ctx.stroke();
        if (i === tapPiton && pulse > 0) {
          ctx.globalAlpha = PULSE_ALPHA[i] * pulse;
          ctx.fillStyle = '#27446e';
          ctx.beginPath();
          ctx.moveTo(x - 8, 64);
          ctx.lineTo(x + 8, 64);
          ctx.lineTo(x, 88);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.globalAlpha = (1 - pulse) * PULSE_ALPHA[i];
          ctx.strokeStyle = '#27446e';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, 76, 8 + 14 * pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // 攀岩者：圆头 + 躯干/四肢线，手沿岩壁移动
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.arc(84, 46, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(84, 55);
      ctx.lineTo(84, 88);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(84, 88);
      ctx.lineTo(70, 118);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(84, 88);
      ctx.lineTo(98, 118);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(84, 62);
      ctx.lineTo(hx, 78 + push);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, 80 + push, 4.5, 0, Math.PI * 2);
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

export default Ch8Ana;
