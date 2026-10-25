// mod-6-1 (P2): step through the 5 inference steps.
import React, { useRef, useState, useEffect } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { palette, clearScene, drawBoard } from './carpentry-kit';

const W = 1080, H = 280;
const STEPS = [
  { node: '前向', value: '1200 个位置出分', fb: '前向：每个位置给出分类分数和四个距离。' },
  { node: '过线', value: '分数 > 0.05：剩 180', fb: '只留分数 > 0.05 的位置，大多数位置被筛掉。' },
  { node: '打折', value: '× centerness：剩 180', fb: '分数乘上 centerness：偏离中心的框被打折，分布左移。' },
  { node: '画框', value: '逆 Eq(1)：180 个框', fb: '按 Eq(1) 逆运算，从四个距离还原出框。' },
  { node: '去重', value: 'NMS：剩 7 个框', fb: 'NMS 去重：重叠的框只留分最高的。' },
];

function drawStep(canvas: HTMLCanvasElement, step: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  clearScene(ctx, W, H);
  // pipeline nodes
  const nx0 = 90, gap = 200;
  STEPS.forEach((s, i) => {
    const x = nx0 + i * gap;
    const y = 70;
    const doneStep = i < step;
    const cur = i === step;
    ctx.fillStyle = cur ? palette.nail : doneStep ? palette.good : '#ffffff';
    ctx.strokeStyle = cur ? palette.nail : doneStep ? palette.good : palette.techBorder;
    ctx.lineWidth = cur ? 4 : 2;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = cur || doneStep ? '#ffffff' : palette.inkMuted;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x, y + 6);
    ctx.fillStyle = cur ? palette.nail : palette.inkMuted;
    ctx.font = '14px sans-serif';
    ctx.fillText(s.node, x, y + 52);
    ctx.textAlign = 'left';
    if (i < STEPS.length - 1) {
      ctx.strokeStyle = doneStep ? palette.good : palette.techBorder;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 34, y);
      ctx.lineTo(x + gap - 34, y);
      ctx.stroke();
    }
  });
  // value panel
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = palette.techBorder;
  ctx.lineWidth = 2;
  ctx.fillRect(90, 150, 900, 90);
  ctx.strokeRect(90, 150, 900, 90);
  ctx.fillStyle = palette.ink;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(STEPS[step].value, 120, 205);
  // boxes visual for step 4/5
  if (step >= 3) {
    const n = step === 3 ? 9 : 3;
    for (let i = 0; i < n; i++) {
      const bx = 620 + (i % 3) * 110;
      const by = 160 + Math.floor(i / 3) * 28;
      drawBoard(ctx, bx, by, 80, 20);
      ctx.strokeStyle = step === 4 && i > 0 ? palette.inkMuted : palette.good;
      ctx.globalAlpha = step === 4 && i > 0 ? 0.35 : 1;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, 80, 20);
      ctx.globalAlpha = 1;
    }
  }
  if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
}

export const Mod61: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    setupCanvas(canvas, W, H);
    drawStep(canvas, 0);
    const disconnect = observeCanvas(canvas, () => drawStep(canvas, step), () => {});
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) drawStep(canvas, step);
  }, [step]);

  return (
    <div>
      <canvas ref={ref} aria-label="推理五步" />
      <div className="controls">
        <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          上一步
        </button>
        <span className="val">
          第 {step + 1} / 5 步
        </span>
        <button type="button" onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={step === 4}>
          下一步
        </button>
        <button type="button" onClick={() => setStep(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${step === 4 ? 'good' : 'mid'}`}>{STEPS[step].fb}</div>
    </div>
  );
};
