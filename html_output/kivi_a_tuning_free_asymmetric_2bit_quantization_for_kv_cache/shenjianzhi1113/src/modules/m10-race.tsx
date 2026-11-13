import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawTarget, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
type Metric = 'acc' | 'mem' | 'thr';

const DATA: Record<Metric, { name: string; ratio: number; color: string; label: string }[]> = {
  acc: [
    { name: 'FP16', ratio: 0.6388, color: KV.blue, label: '63.88' },
    { name: 'KIVI-2', ratio: 0.6305, color: KV.green, label: '63.05' },
  ],
  mem: [
    { name: 'FP16', ratio: 1, color: KV.red, label: '1.00×' },
    { name: 'KIVI-2', ratio: 0.385, color: KV.green, label: '0.385×' },
  ],
  thr: [
    { name: 'FP16', ratio: 0.29, color: KV.red, label: '1.00×' },
    { name: 'KIVI-2', ratio: 1, color: KV.green, label: '2.35-3.47×' },
  ],
};

export const M10Race: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<Metric>('acc');
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

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    DATA[metric].forEach((it, i) => {
      const y = 62 + i * 62;
      drawBar(ctx, 220, y, 620, 22, it.ratio * progress, it.color);
      drawSceneLabel(ctx, 40, y + 17, it.name, KV.ink, 14);
      drawSceneLabel(ctx, 856, y + 17, it.label, it.color, 13);
    });
    if (metric === 'acc') drawTarget(ctx, 846, 88, 10);
    drawSceneLabel(ctx, 220, 232, metric === 'acc' ? '精度越高越好' : metric === 'mem' ? '显存越低越好' : '吞吐越高越好', KV.muted, 12);
  }, W, H);

  const text =
    progress === 0 && !running
      ? '按下开始，把各方案放到同一把尺子上比较。'
      : metric === 'acc'
      ? 'Llama-2-7B：KIVI-2 63.05，FP16 63.88（越高越好）。'
      : metric === 'mem'
      ? '峰值显存省 2.6×（越低越好）。'
      : '吞吐 2.35-3.47×（越高越好）。';

  return (
    <div>
      <canvas id="cv-m10-race" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['acc', 'mem', 'thr'] as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'selected' : ''}`} onClick={() => setMetric(m)}>
            {m === 'acc' ? '精度' : m === 'mem' ? '显存' : '吞吐'}
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
            <th>KIVI-2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Llama-2-7B · CoQA↑</td>
            <td>63.88</td>
            <td>63.05</td>
          </tr>
          <tr>
            <td>Llama-2-7B · GSM8K↑</td>
            <td>13.50</td>
            <td>12.74</td>
          </tr>
          <tr>
            <td>峰值显存↓</td>
            <td>1.00×</td>
            <td>0.385×（2.6× 省）</td>
          </tr>
          <tr>
            <td>吞吐↑</td>
            <td>1.00×</td>
            <td>2.35-3.47×</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default M10Race;
