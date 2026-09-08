import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 250;

const STEPS = [
  '第 0 步：三个块都还是噪声，缓存为空，等待出发。',
  '第 1 步：块 1 从噪声去噪生成，相机口令以首帧为基准（蓝）。',
  '第 2 步：块 1 写入滚动 KV 缓存——历史被“记下一笔”。',
  '第 3 步：块 2 去噪生成，相机口令换成「相对块 1 末帧」，条件不会随路程衰减。',
  '第 4 步：块 2 写入缓存，块 3 就绪——只携带滚动历史，永不重播全程（绿）。',
];

export const Mod61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  stepRef.current = step;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const frame = (now: number) => {
      const s = stepRef.current;
      const pulse = 0.6 + 0.4 * Math.sin((now - t0) / 240);
      K.clearScene(ctx, W, H);
      const labels = ['块 1', '块 2', '块 3'];
      for (let i = 0; i < 3; i++) {
        const x = 40 + i * 170;
        const active = (s === 1 && i === 0) || (s === 3 && i === 1);
        const cached = (s >= 2 && i === 0) || (s >= 4 && i === 1);
        const ready = s >= 4 && i === 2;
        ctx.fillStyle = active ? `rgba(39,68,110,${0.25 * pulse})` : '#fff';
        ctx.strokeStyle = active ? K.C.guide : cached ? K.C.good : ready ? K.C.emph : K.C.axis;
        ctx.lineWidth = active || cached ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, 40, 130, 90, 6);
        ctx.fill();
        ctx.stroke();
        K.drawLabel(ctx, labels[i], x + 10, 60, K.C.ink, 12);
        if (s === 0) {
          K.drawLabel(ctx, '噪声', x + 10, 90, K.C.muted, 10);
        } else if (active) {
          K.drawLabel(ctx, '去噪中…', x + 10, 90, K.C.guide, 10);
        } else if (cached) {
          K.drawLabel(ctx, '已生成 ✓', x + 10, 90, K.C.good, 10);
        } else if (ready) {
          K.drawLabel(ctx, '就绪', x + 10, 90, K.C.emph, 10);
        } else {
          K.drawLabel(ctx, '等待', x + 10, 90, K.C.muted, 10);
        }
        if (cached) K.drawLabel(ctx, '→ 已写入缓存', x + 10, 112, K.C.good, 10);
      }
      // KV cache bar
      K.drawLabel(ctx, '滚动 KV 缓存', 40, 168, K.C.ink, 11);
      const fill = s >= 4 ? 2 / 3 : s >= 2 ? 1 / 3 : 0;
      K.drawBar(ctx, 150, 156, 340, 14, fill, K.C.good);
      // camera pose label
      const poseText =
        s >= 3 ? '相机口令：相对块 1 末帧' : s >= 1 ? '相机口令：相对首帧' : '相机口令：——';
      K.drawLabel(ctx, poseText, 40, 208, s >= 3 ? K.C.guide : K.C.muted, 11);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <div className="ctrl">
        <button className="chip" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>
          上一步
        </button>
        <button className="chip" onClick={() => setStep((v) => Math.min(4, v + 1))} disabled={step === 4}>
          下一步（{step}/4）
        </button>
        <button className="chip" onClick={() => setStep(0)}>
          重置
        </button>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={`feedback ${step === 4 ? 'good' : ''}`}>{STEPS[step]}</div>
    </div>
  );
};

export default Mod61;
