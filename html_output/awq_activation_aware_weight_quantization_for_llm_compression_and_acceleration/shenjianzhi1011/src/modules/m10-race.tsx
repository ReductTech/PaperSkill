import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawTarget, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;
type Metric = 'ppl' | 'vlm' | 'speed';

const DATA: Record<Metric, { name: string; value: number; ratio: number; color: string; label: string }[]> = {
  ppl: [
    { name: 'FP16', value: 5.47, ratio: 0.5, color: AQ.green, label: '5.47' },
    { name: 'RTN', value: 6.66, ratio: 0.65, color: AQ.red, label: '6.66' },
    { name: 'GPTQ', value: 6.43, ratio: 0.63, color: AQ.purple, label: '6.43' },
    { name: 'AWQ', value: 6.24, ratio: 0.61, color: AQ.green, label: '6.24' },
  ],
  vlm: [
    { name: 'AWQ', value: 1.17, ratio: 0.12, color: AQ.green, label: '−1.17' },
    { name: 'RTN', value: 4.57, ratio: 0.45, color: AQ.red, label: '−4.57' },
    { name: 'GPTQ', value: 6.72, ratio: 0.66, color: AQ.purple, label: '−6.72' },
  ],
  speed: [
    { name: '平均', value: 3.25, ratio: 0.65, color: AQ.green, label: '3.2–3.3×' },
    { name: '峰值 4090', value: 3.9, ratio: 0.78, color: AQ.orange, label: '3.9×' },
    { name: '峰值 Orin', value: 3.5, ratio: 0.7, color: AQ.blue, label: '3.5×' },
  ],
};

export const M10Race: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<Metric>('ppl');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 1600);
      setProgress(p);
      if (p >= 1) setRunning(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const items = DATA[metric];
    items.forEach((it, i) => {
      const y = 60 + i * 52;
      drawBar(ctx, 200, y, 620, 20, it.ratio * progress, it.color);
      drawSceneLabel(ctx, 40, y + 16, it.name, AQ.ink, 14);
      drawSceneLabel(ctx, 836, y + 16, it.label, it.color, 13);
    });
    if (metric === 'ppl') drawTarget(ctx, 826, 70, 10);
    drawSceneLabel(ctx, 200, 262, metric === 'ppl' ? '困惑度越低越好' : metric === 'vlm' ? 'CIDEr 损失越小越好' : '加速比越高越好', AQ.muted, 12);
  }, W, H);

  const text =
    progress === 0 && !running
      ? '按下开始，把各方法放到同一坐标比较。'
      : metric === 'ppl'
      ? 'Llama-2-7B INT3：AWQ 6.24，优于 RTN 6.66 与 GPTQ 6.43（越低越好）。'
      : metric === 'vlm'
      ? '多模态 INT4 的 32-shot CIDEr 损失：AWQ 1.17，远小于 GPTQ 6.72（越小越好）。'
      : '相对 HuggingFace FP16：平均 3.2–3.3×，峰值 4090 3.9×、Orin 3.5×。';

  return (
    <div>
      <canvas id="cv-m10-race" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['ppl', 'vlm', 'speed'] as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'selected' : ''}`} onClick={() => setMetric(m)}>
            {m === 'ppl' ? '困惑度' : m === 'vlm' ? '多模态' : '速度'}
          </button>
        ))}
      </div>
      <div className="step-ctrl">
        <button className="tiny" onClick={() => { setProgress(0); setRunning(true); }}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${progress > 0 ? 'good' : ''}`}>{text}</div>
      <table className="paper">
        <thead>
          <tr>
            <th>任务 / 指标</th>
            <th>FP16</th>
            <th>RTN</th>
            <th>GPTQ</th>
            <th>AWQ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Llama-2-7B · INT3-g128 · PPL↓</td>
            <td>5.47</td>
            <td>6.66</td>
            <td>6.43</td>
            <td>6.24</td>
          </tr>
          <tr>
            <td>OpenFlamingo-9B · INT4 · 32-shot ΔCIDEr（越小越好）</td>
            <td>0</td>
            <td>−4.57</td>
            <td>−6.72</td>
            <td>−1.17</td>
          </tr>
          <tr>
            <td>Llama-2-70B · INT3-g128 · PPL↓</td>
            <td>3.32</td>
            <td>3.98</td>
            <td>3.88</td>
            <td>3.74</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default M10Race;
