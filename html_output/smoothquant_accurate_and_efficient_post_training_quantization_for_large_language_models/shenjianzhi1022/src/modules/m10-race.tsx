import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawTarget, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;
type Metric = 'acc' | 'lat' | 'mem';

const DATA: Record<Metric, { name: string; ratio: number; color: string; label: string }[]> = {
  acc: [
    { name: 'FP16', ratio: 0.84, color: SQ.purple, label: '66.9%' },
    { name: 'SQ-O3', ratio: 0.835, color: SQ.green, label: '66.8%' },
    { name: 'W8A8', ratio: 0.44, color: SQ.red, label: '35.5%' },
    { name: 'ZeroQuant', ratio: 0.45, color: SQ.red, label: '35.8%' },
  ],
  lat: [
    { name: 'FP16', ratio: 0.86, color: SQ.red, label: '343.0ms' },
    { name: 'SQ-O3', ratio: 0.57, color: SQ.green, label: '227.6ms' },
    { name: 'LLM.int8()', ratio: 0.97, color: SQ.purple, label: '387.9ms' },
  ],
  mem: [
    { name: 'FP16 16卡', ratio: 0.95, color: SQ.red, label: '1040GB' },
    { name: 'INT8 8卡', ratio: 0.48, color: SQ.green, label: '527GB' },
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

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const items = DATA[metric];
    items.forEach((it, i) => {
      const y = 60 + i * 52;
      drawBar(ctx, 220, y, 620, 20, it.ratio * progress, it.color);
      drawSceneLabel(ctx, 40, y + 16, it.name, SQ.ink, 14);
      drawSceneLabel(ctx, 856, y + 16, it.label, it.color, 13);
    });
    if (metric === 'acc') drawTarget(ctx, 846, 70, 10);
    drawSceneLabel(ctx, 220, 262, metric === 'acc' ? '精度越高越好' : metric === 'lat' ? '延迟越低越好' : '显存越低越好', SQ.muted, 12);
  }, W, H);

  const text =
    progress === 0 && !running
      ? '按下开始，把各方案放到同一条山路上比较。'
      : metric === 'acc'
      ? 'OPT-175B：SQ-O3 66.8% ≈ FP16 66.9%；W8A8/ZeroQuant 只有 ~35%（越高越好）。'
      : metric === 'lat'
      ? 'OPT-30B seq256：SQ-O3 227.6ms vs FP16 343.0ms；LLM.int8() 387.9ms（越低越好）。'
      : 'MT-NLG 530B：显存约 1040→527GB，卡数 16→8（越低越好）。';

  return (
    <div>
      <canvas id="cv-m10-race" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['acc', 'lat', 'mem'] as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'selected' : ''}`} onClick={() => setMetric(m)}>
            {m === 'acc' ? '精度' : m === 'lat' ? '延迟' : '显存'}
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
            <th>模型 / 指标</th>
            <th>FP16</th>
            <th>W8A8 基线</th>
            <th>LLM.int8()</th>
            <th>SmoothQuant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>OPT-175B · 7 任务平均精度↑</td>
            <td>66.9%</td>
            <td>35.5%</td>
            <td>66.7%</td>
            <td>66.8%（O3）</td>
          </tr>
          <tr>
            <td>OPT-30B · seq256 延迟↓</td>
            <td>343.0ms</td>
            <td>—</td>
            <td>387.9ms</td>
            <td>227.6ms（O3）</td>
          </tr>
          <tr>
            <td>MT-NLG 530B · 显存 / 卡数↓</td>
            <td>1040GB / 16</td>
            <td>—</td>
            <td>—</td>
            <td>527GB / 8</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default M10Race;
