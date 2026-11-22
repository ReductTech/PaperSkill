import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawTarget, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
type Metric = 'ppl' | 'mem' | 'lat';

const DATA: Record<Metric, { name: string; ratio: number; color: string; label: string }[]> = {
  ppl: [
    { name: 'FP16', ratio: 5.68 / 8, color: KQ.blue, label: '5.68' },
    { name: 'KVQuant-3bit', ratio: 5.75 / 8, color: KQ.green, label: '5.75' },
  ],
  mem: [
    { name: 'FP16', ratio: 1, color: KQ.red, label: '64GB' },
    { name: 'KVQuant-3bit', ratio: 13.3 / 64, color: KQ.green, label: '13.3GB' },
  ],
  lat: [
    { name: 'FP16', ratio: 0.63, color: KQ.red, label: '33.3µs' },
    { name: 'KVQuant-4bit', ratio: 1, color: KQ.green, label: '25.6µs' },
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

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    DATA[metric].forEach((it, i) => {
      const y = 62 + i * 62;
      drawBar(ctx, 220, y, 620, 22, it.ratio * progress, it.color);
      drawSceneLabel(ctx, 40, y + 17, it.name, KQ.ink, 14);
      drawSceneLabel(ctx, 856, y + 17, it.label, it.color, 13);
    });
    if (metric === 'ppl') drawTarget(ctx, 846, 88, 10);
    drawSceneLabel(ctx, 220, 232, metric === 'ppl' ? 'PPL 越低越好' : metric === 'mem' ? '显存越低越好' : '延迟越低越好', KQ.muted, 12);
  }, W, H);

  const text =
    progress === 0 && !running
      ? '按下开始，把各方案放到同一把尺子上比较。'
      : metric === 'ppl'
      ? 'LLaMA-7B 3bit-1%：5.75 vs 5.68（越低越好）。'
      : metric === 'mem'
      ? '128K KV：13.3GB vs 64GB，约 4.8×（越低越好）。'
      : '4bit matvec 最高约 1.7×（越低越好）。';

  return (
    <div>
      <canvas id="cv-m10-race" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['ppl', 'mem', 'lat'] as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'selected' : ''}`} onClick={() => setMetric(m)}>
            {m === 'ppl' ? '精度' : m === 'mem' ? '显存' : '延迟'}
          </button>
        ))}
      </div>
      <div className="step-ctrl">
        <button
          className="tiny"
          onClick={() => {
            setProgress(0);
            setRunning(true);
          }}
        >
          开始对比
        </button>
      </div>
      <div className={`feedback ${progress > 0 ? 'good' : ''}`}>{text}</div>
      <table className="paper">
        <thead>
          <tr>
            <th>模型 / 指标</th>
            <th>FP16</th>
            <th>KVQuant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>LLaMA-7B · Wikitext-2 PPL↓</td>
            <td>5.68</td>
            <td>5.75（3bit-1%）</td>
          </tr>
          <tr>
            <td>128K KV 显存↓</td>
            <td>64GB</td>
            <td>13.3GB（4.8×）</td>
          </tr>
          <tr>
            <td>1M 上下文 KV↓</td>
            <td>512GB</td>
            <td>74.4GB（2bit-1%）</td>
          </tr>
          <tr>
            <td>4bit matvec 延迟↓</td>
            <td>33.3µs</td>
            <td>25.6µs（最高 1.7×）</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default M10Race;
