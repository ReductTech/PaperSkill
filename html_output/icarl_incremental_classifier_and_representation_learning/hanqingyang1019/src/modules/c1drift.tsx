import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, line, dot, legend, type WidgetProps } from './kit';

// Chapter 1.1 — sequential training drifts the decision boundary into the old class.
const OLD = Array.from({ length: 12 }, (_, i) => ({ x: 300 + i * 9, y: 190 + ((i * 37) % 60) - 30 }));
const NEW_BASE = Array.from({ length: 12 }, (_, i) => ({ x: 764 + i * 8, y: 190 + ((i * 53) % 60) - 30 }));

function boundaryX(step: number): number {
  return 440 - step * 16;
}

function accuracy(step: number): number {
  const b = boundaryX(step);
  return OLD.filter((p) => p.x < b).length / OLD.length;
}

const TOTAL = OLD.length;

function feedbackFor(acc: number): { text: string; cls: string } {
  const correct = Math.round(acc * TOTAL);
  const wrong = TOTAL - correct;
  if (acc >= 0.99) return { text: `边界仍在新类一侧，${TOTAL} 个旧类样本全部判对。`, cls: 'good' };
  if (acc >= 0.6) return { text: `边界越过旧类边缘：${wrong} 个旧样本被判成新类，准确率 ${acc.toFixed(2)}。`, cls: '' };
  if (acc >= 0.3) return { text: `边界推进到旧类内部：${wrong} 个旧样本被判成新类，准确率 ${acc.toFixed(2)}。`, cls: '' };
  if (acc > 0) return { text: `旧类只剩 ${correct} 个样本还在边界左侧，准确率 ${acc.toFixed(2)}。`, cls: 'bad' };
  return { text: `${TOTAL} 个旧类样本全部被划成新类，旧类准确率归零——这就是灾难性遗忘。`, cls: 'bad' };
}

export const C1Drift: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const acc = accuracy(step);
  const feedback = feedbackFor(acc);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);
    const b = boundaryX(step);

    line(ctx, 90, 235, 1010, 235, C.border, 2);

    // decision boundary
    line(ctx, b, 52, b, 235, C.red, 3, [8, 6]);
    line(ctx, 90, 235, 1010, 235, C.border, 2);

    OLD.forEach((p) => {
      const ok = p.x < b;
      dot(ctx, p.x, p.y, 7, C.blue, ok ? undefined : C.red, 3);
    });
    NEW_BASE.forEach((p, i) => {
      const tighten = 1 - step * 0.035;
      dot(ctx, 540 + (p.x - 540) * tighten + (1 - tighten) * 40, p.y, 7, C.orange);
      void i;
    });

    txt(ctx, acc.toFixed(2), 1000, 48, acc > 0.85 ? C.green : acc > 0.5 ? C.orange : C.red, 30, 'right', '700');
    legend(ctx, [
      { label: '旧类', color: C.blue },
      { label: '新类', color: C.orange },
      { label: '边界', color: C.red },
    ], 96, 60);
    c.classList.add('is-ready');
  }, [step, acc]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          新类训练轮次 <span className="val">{step}</span>
        </label>
        <input type="range" min={0} max={10} step={1} value={step} onChange={(e) => setStep(Number(e.target.value))} />
        <span className="val">旧类准确率 {acc.toFixed(2)}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C1Drift;
