import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawTarget, ZQ, useZqCanvas } from './zq-kit';

const W = 1080;
const H = 280;
type Metric = 'acc' | 'mem' | 'lat';

const DATA: Record<Metric, { name: string; ratio: number; color: string; label: string }[]> = {
  acc: [
    { name: 'FP16', ratio: 0.84, color: ZQ.blue, label: '83.95' },
    { name: 'PTQ', ratio: 0.774, color: ZQ.red, label: '77.41' },
    { name: 'ZeroQuant', ratio: 0.8375, color: ZQ.green, label: '83.75' },
  ],
  mem: [
    { name: 'FP16', ratio: 1, color: ZQ.red, label: '1.00×' },
    { name: 'W4/8', ratio: 0.34, color: ZQ.green, label: '0.34×' },
  ],
  lat: [
    { name: 'FP16', ratio: 0.19, color: ZQ.red, label: '1.00×' },
    { name: 'ZeroQuant', ratio: 1, color: ZQ.green, label: '5.19×' },
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

  const ref = useZqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    DATA[metric].forEach((it, i) => {
      const y = 62 + i * 52;
      drawBar(ctx, 220, y, 620, 20, it.ratio * progress, it.color);
      drawSceneLabel(ctx, 40, y + 16, it.name, ZQ.ink, 14);
      drawSceneLabel(ctx, 856, y + 16, it.label, it.color, 13);
    });
    if (metric === 'acc') drawTarget(ctx, 846, 88, 10);
    drawSceneLabel(ctx, 220, 260, metric === 'acc' ? '精度越高越好' : metric === 'mem' ? '显存越低越好' : '加速越高越好', ZQ.muted, 12);
  }, W, H);

  const text =
    progress === 0 && !running
      ? '按下开始，把各方案放到同一把尺子上比较。'
      : metric === 'acc'
      ? 'BERT-base W8A8：ZeroQuant 83.75，FP16 83.95，PTQ 77.41（越高越好）。'
      : metric === 'mem'
      ? 'W4/8 显存约 3× 省（越低越好）。'
      : 'BERT 最高 5.19×，GPT-350M 4.16×（越高越好）。';

  return (
    <div>
      <canvas id="cv-m10-race" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['acc', 'mem', 'lat'] as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'selected' : ''}`} onClick={() => setMetric(m)}>
            {m === 'acc' ? '精度' : m === 'mem' ? '显存' : '延迟'}
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
            <th>PTQ</th>
            <th>ZeroQuant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>BERT-base · GLUE↑</td>
            <td>83.95</td>
            <td>77.41</td>
            <td>83.75</td>
          </tr>
          <tr>
            <td>BERT-base · 时间↓</td>
            <td>—</td>
            <td>6s</td>
            <td>0s</td>
          </tr>
          <tr>
            <td>显存（W4/8）↓</td>
            <td>1.00×</td>
            <td>—</td>
            <td>0.34×（约 3× 省）</td>
          </tr>
          <tr>
            <td>BERT-base · 延迟↓</td>
            <td>1.00×</td>
            <td>—</td>
            <td>最高 5.19× 加速</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default M10Race;
