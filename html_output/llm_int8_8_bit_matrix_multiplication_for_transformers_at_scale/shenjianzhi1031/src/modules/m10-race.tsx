import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawTarget, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
type Metric = 'ppl' | 'mem' | 'speed';

const DATA: Record<Metric, { name: string; ratio: number; color: string; label: string }[]> = {
  ppl: [
    { name: '32 位', ratio: 0.62, color: LI.purple, label: '12.45' },
    { name: 'vector-wise', ratio: 0.82, color: LI.red, label: '16.48' },
    { name: 'LLM.int8', ratio: 0.62, color: LI.green, label: '12.45' },
  ],
  mem: [
    { name: 'FP16', ratio: 1, color: LI.red, label: '1.00×' },
    { name: 'LLM.int8', ratio: 0.51, color: LI.green, label: '0.51×' },
  ],
  speed: [
    { name: 'FP16', ratio: 1 / 2.5, color: LI.red, label: '1.00×' },
    { name: 'LLM.int8', ratio: 1.81 / 2.5, color: LI.green, label: '1.81×' },
    { name: '纯 Int8', ratio: 2.29 / 2.5, color: LI.purple, label: '2.29×' },
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

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const items = DATA[metric];
    items.forEach((it, i) => {
      const y = 60 + i * 52;
      drawBar(ctx, 220, y, 620, 20, it.ratio * progress, it.color);
      drawSceneLabel(ctx, 40, y + 16, it.name, LI.ink, 14);
      drawSceneLabel(ctx, 856, y + 16, it.label, it.color, 13);
    });
    if (metric === 'ppl') drawTarget(ctx, 846, 70, 10);
    drawSceneLabel(ctx, 220, 262, metric === 'ppl' ? '困惑度越低越好' : metric === 'mem' ? '显存越低越好' : '加速越高越好', LI.muted, 12);
  }, W, H);

  const text =
    progress === 0 && !running
      ? '按下开始，把各方案放到同一把尺子上比较。'
      : metric === 'ppl'
      ? '13B：LLM.int8 12.45 ≈ 32 位 12.45；vector-wise 16.48（越低越好）。'
      : metric === 'mem'
      ? 'BLOOM-176B：显存降到约 1/1.96（越低越好）。'
      : '175B 矩阵乘：LLM.int8 1.81×、纯 Int8 2.29×；小模型会变慢（越高越好）。';

  return (
    <div>
      <canvas id="cv-m10-race" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['ppl', 'mem', 'speed'] as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'selected' : ''}`} onClick={() => setMetric(m)}>
            {m === 'ppl' ? '困惑度' : m === 'mem' ? '显存' : '速度'}
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
            <th>FP16 / 32 位</th>
            <th>vector-wise</th>
            <th>LLM.int8</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>13B · C4 困惑度↓</td>
            <td>12.45</td>
            <td>16.48</td>
            <td>12.45</td>
          </tr>
          <tr>
            <td>BLOOM-176B · 显存↓</td>
            <td>1.00×</td>
            <td>—</td>
            <td>0.51×（1.96× 省）</td>
          </tr>
          <tr>
            <td>175B · 矩阵乘速度↑</td>
            <td>1.00×</td>
            <td>2.00×</td>
            <td>1.81×</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default M10Race;
