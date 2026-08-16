import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, bar, clear, label, metric } from './yolo-shared';

type Mode = 'sgd' | 'muon' | 'musgd';
const W = 720;
const H = 380;
const names: Record<Mode, string> = { sgd: 'SGD', muon: 'Muon', musgd: 'MuSGD' };

export const MusgdSpectrum: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('sgd');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clear(ctx, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(24, 28, 672, 280);
    label(ctx, '奇异值示意：比较三个更新方向的强度', 42, 52, C.orange, 12, 700);

    const values = mode === 'sgd' ? [10, 2, 0.1] : mode === 'muon' ? [1, 1, 1] : [5.5, 1.5, 0.55];
    const colors = mode === 'sgd'
      ? [C.red, C.orange, C.red]
      : mode === 'muon'
        ? [C.blue, C.blue, C.blue]
        : [C.green, C.green, C.blue];
    ['σ₁', 'σ₂', 'σ₃'].forEach((symbol, index) => {
      label(ctx, symbol, 48, 100 + index * 58, C.muted, 13, 700);
      bar(ctx, 92, 90 + index * 58, 270, 18, values[index], 10, colors[index]);
      label(ctx, values[index].toFixed(values[index] < 1 ? 2 : 1), 374, 100 + index * 58, colors[index], 13, 700);
    });

    ctx.strokeStyle = C.border;
    ctx.beginPath();
    ctx.moveTo(430, 85);
    ctx.lineTo(430, 255);
    ctx.stroke();
    label(ctx, mode === 'sgd' ? 'M = UΣVᵀ' : mode === 'muon' ? 'UΣVᵀ → UVᵀ' : 'Muon update + SGD update', 462, 116, mode === 'sgd' ? C.red : mode === 'muon' ? C.blue : C.green, 16, 700);
    label(ctx, mode === 'sgd' ? '保留原始尺度' : '改善方向条件', 462, 155, C.muted, 13, 600);
    label(ctx, mode === 'musgd' ? '一维参数：使用 SGD' : '高维权重更新', 462, 190, C.purple, 13, 600);
    metric(ctx, 452, 225, 210, 'COCO 受控实验', mode === 'musgd' ? '500 epoch · 47.4' : 'SGD: 600 · 47.0', mode === 'musgd' ? C.green : C.blue);
    canvas.classList.add('is-ready');
  }, [mode]);

  const feedback = mode === 'sgd'
    ? { className: 'bad', text: 'SGD 保留原始方向尺度，三个方向的更新强度差异较大。' }
    : mode === 'muon'
      ? { className: '', text: 'Muon 对高维权重更新进行近似正交化，使各方向的尺度更接近。' }
      : { className: 'good', text: 'MuSGD 对高维权重混合 Muon 与 SGD，一维参数继续使用 SGD。' };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} aria-label="SGD、Muon 与 MuSGD 更新方向比较" />
      <div className="ctrl">
        {(Object.keys(names) as Mode[]).map(item => (
          <button key={item} className={`chip ${mode === item ? 'active' : ''}`} onClick={() => setMode(item)}>
            {names[item]}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.className}`}>{feedback.text}</div>
      <details>
        <summary>理解原理｜SVD 在表达什么？</summary>
        <p>V 给出输入方向，Σ 给出各方向强度，U 给出输出方向。柱状图用来展示三个方向的相对强弱。</p>
      </details>
      <details>
        <summary>查看数学｜为什么会写成 UVᵀ？</summary>
        <p>Muon 使用 Newton–Schulz 迭代近似正交化动量更新；图中用 UΣVᵀ → UVᵀ 展示奇异值被拉平后的方向变化。</p>
      </details>
      <details>
        <summary>查看证据｜训练速度和精度如何变化？</summary>
        <p>论文 Table 4 的 COCO 受控实验中，MuSGD 训练 500 个 epoch 得到 47.4 mAP，SGD 训练 600 个 epoch 得到 47.0 mAP。</p>
      </details>
    </div>
  );
};
