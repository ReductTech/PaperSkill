import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, label, metric } from './yolo-shared';

const W = 760;
const H = 360;
const DEFAULT_WEIGHTS = Array.from({ length: 16 }, (_, i) => (i === 5 ? 0.3 : i === 6 ? 0.7 : 0));

export const DflDistanceExplorer: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [weights, setWeights] = useState<number[]>(DEFAULT_WEIGHTS);
  const total = useMemo(() => weights.reduce((sum, value) => sum + value, 0), [weights]);
  const weightedSum = useMemo(
    () => weights.reduce((sum, value, index) => sum + value * index, 0),
    [weights],
  );
  const probabilities = useMemo(
    () => weights.map(value => (total > 0 ? value / total : 0)),
    [weights, total],
  );
  const distance = total > 0 ? weightedSum / total : 0;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clear(ctx, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(24, 24, 712, 312);

    label(ctx, 'DFL：16 个离散位置的归一化权重', 44, 48, C.text, 16, 700);
    metric(ctx, 44, 68, 205, '输入权重总和', total.toFixed(2), C.blue);
    metric(ctx, 276, 68, 205, 'Σ(i × 权重ᵢ)', weightedSum.toFixed(2), C.purple);
    metric(ctx, 508, 68, 205, '预测距离', total > 0 ? distance.toFixed(3) : '等待输入', total > 0 ? C.green : C.red);

    const baseY = 292;
    const chartX = 54;
    const step = 42;
    const barWidth = 24;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(chartX - 8, baseY);
    ctx.lineTo(chartX + step * 15 + barWidth + 8, baseY);
    ctx.stroke();

    probabilities.forEach((probability, index) => {
      const x = chartX + index * step;
      const height = probability * 125;
      ctx.fillStyle = probability > 0 ? C.blue : C.border;
      ctx.fillRect(x, baseY - height, barWidth, Math.max(2, height));
      label(ctx, String(index), x + 7, 310, C.muted, 10, 600);
      if (probability > 0) label(ctx, probability.toFixed(2), x - 1, baseY - height - 12, C.blue, 10, 600);
    });

    if (total > 0) {
      const markerX = chartX + distance * step + barWidth / 2;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(markerX, 154);
      ctx.lineTo(markerX, baseY + 3);
      ctx.stroke();
      label(ctx, `加权结果 ${distance.toFixed(3)}`, Math.min(markerX + 8, 600), 148, C.orange, 12, 700);
    }
    canvas.classList.add('is-ready');
  }, [distance, probabilities, total, weightedSum]);

  const updateWeight = (index: number, rawValue: string) => {
    const parsed = Number(rawValue);
    const nextValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    setWeights(current => current.map((value, i) => (i === index ? nextValue : value)));
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} aria-label="DFL 离散权重与加权距离图" />
      <div className="dfl-weight-panel">
        <div className="dfl-weight-heading">
          <div>
            <strong>设置 0–15 各位置的权重</strong>
            <span>权重可以是任意非负数，系统会自动归一化为概率。</span>
          </div>
          <div className="dfl-weight-actions">
            <button onClick={() => setWeights(DEFAULT_WEIGHTS)}>载入 5.7 示例</button>
            <button onClick={() => setWeights(Array(16).fill(0))}>全部清零</button>
          </div>
        </div>
        <div className="dfl-weight-grid">
          {weights.map((value, index) => (
            <label key={index}>
              <span>{index}</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={value}
                aria-label={`位置 ${index} 的权重`}
                onChange={event => updateWeight(index, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
      <div className={`feedback ${total > 0 ? 'good' : 'bad'}`}>
        {total > 0
          ? `归一化后，预测距离 = ${weightedSum.toFixed(2)} ÷ ${total.toFixed(2)} = ${distance.toFixed(3)}。`
          : '请至少为一个位置输入大于 0 的权重。'}
      </div>
    </div>
  );
};
