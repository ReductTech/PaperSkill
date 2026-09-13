import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 模块 3.1 —— P2 步进 + 技术曲线（数学/技术模式）
// 展示：当关键信息位置从卷首移向卷尾，模型性能呈 U 形——首尾高、中间低。
const W = 720;
const H = 280;

// 定性 U 形曲线（论文图 1/3 的抽象）：端点性能好、中点最差
function perfAt(t: number): number {
  // t in 0..1, 返回 0..1 性能，端点~0.9，中点~0.45
  return 0.45 + 0.45 * Math.pow(Math.abs(t - 0.5) * 2, 1.3);
}

export function LitmPositionCurve({ chapterId, moduleId }: { chapterId: string; moduleId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const [step, setStep] = useState(0); // 0..10 步进揭示
  const stateRef = useRef({ step });
  stateRef.current = { step };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);

    const padL = 56, padR = 24, padT = 28, padB = 44;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const draw = () => {
      const { step: s } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f1830';
      ctx.fillRect(0, 0, W, H);
      // 坐标轴
      ctx.strokeStyle = '#5b6b8f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();
      ctx.fillStyle = '#9fb3d9';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('关键信息位置（卷首 → 卷尾）', padL + plotW / 2, H - 12);
      ctx.save();
      ctx.translate(16, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('模型性能', 0, 0);
      ctx.restore();

      // 网格刻度
      ctx.fillStyle = '#6b7aa0';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const y = padT + (plotH * i) / 4;
        ctx.fillText(`${100 - i * 25}`, padL - 8, y + 4);
      }

      // U 形曲线（按 step 揭示）
      const totalSteps = 10;
      const reveal = (s / totalSteps);
      ctx.strokeStyle = '#52e0a0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const N = 60;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        if (t > reveal + 0.001) break;
        const x = padL + t * plotW;
        const y = padT + (1 - perfAt(t)) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 中点最差标记（最后一步）
      if (s >= totalSteps) {
        const mx = padL + plotW / 2;
        const my = padT + (1 - perfAt(0.5)) * plotH;
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.fillText('中间最差', mx, my + 18);
      }
    };

    const start = () => {
      const loop = () => { draw(); reqRef.current = requestAnimationFrame(loop); };
      loop();
    };
    const stop = () => cancelAnimationFrame(reqRef.current);
    start();
    return () => stop();
  }, []);

  return (
    <div className="litm-widget">
      <canvas ref={canvasRef} className="litm-canvas" />
      <div className="litm-controls">
        <label>
          逐步揭示曲线：<b>{step}/10</b>
          <input type="range" min={0} max={10} step={1} value={step}
            onChange={(e) => setStep(Number(e.target.value))} />
        </label>
      </div>
      <p className="litm-hint">
        把滑块推到底，曲线完整呈现：性能在<strong>卷首与卷尾最高</strong>、在<strong>正中间跌到谷底</strong>，
        形状像字母 U。这与"首尾记忆好、中间被淹没"的直觉一致。
      </p>
    </div>
  );
}
