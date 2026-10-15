import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawTarget, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;
type Metric = 'ppl' | 'runtime' | 'speed';

const DATA: Record<Metric, { name: string; ratio: number; color: string; label: string }[]> = {
  ppl: [
    { name: 'FP16', ratio: 0.17, color: GQ.purple, label: '8.34' },
    { name: 'RTN-4', ratio: 0.55, color: GQ.red, label: '10.54' },
    { name: 'GPTQ-4', ratio: 0.19, color: GQ.green, label: '8.37' },
    { name: 'GPTQ-3', ratio: 0.30, color: GQ.green, label: '8.68' },
  ],
  runtime: [
    { name: 'OPT-175B', ratio: 0.84, color: GQ.green, label: '4.2h' },
    { name: 'BLOOM-176B', ratio: 0.76, color: GQ.green, label: '3.8h' },
    { name: 'ZeroQuant-1.3B', ratio: 0.6, color: GQ.red, label: '≈3h' },
  ],
  speed: [
    { name: 'A100', ratio: 0.72, color: GQ.green, label: '3.24×' },
    { name: 'A6000', ratio: 0.95, color: GQ.orange, label: '4.53×' },
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

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const items = DATA[metric];
    items.forEach((it, i) => {
      const y = 60 + i * 52;
      drawBar(ctx, 220, y, 620, 20, it.ratio * progress, it.color);
      drawSceneLabel(ctx, 40, y + 16, it.name, GQ.ink, 14);
      drawSceneLabel(ctx, 856, y + 16, it.label, it.color, 13);
    });
    if (metric === 'ppl') drawTarget(ctx, 846, 70, 10);
    drawSceneLabel(ctx, 220, 262, metric === 'ppl' ? '困惑度越低越好' : metric === 'runtime' ? '用时越低越好' : '提速越高越好', GQ.muted, 12);
  }, W, H);

  const text =
    progress === 0 && !running
      ? '按下开始，把各方法放到同一把尺子上比较。'
      : metric === 'ppl'
      ? 'OPT-175B：GPTQ-4 8.37 ≈ FP16 8.34；RTN-4 已掉到 10.54（越低越好）。'
      : metric === 'runtime'
      ? '单卡 A100：OPT-175B 4.2 小时、BLOOM-176B 3.8 小时；ZeroQuant 对 1.3B 就要约 3 小时（越低越好）。'
      : '3 位 OPT-175B：A100 提速 3.24×（5→1 卡），A6000 4.53×（8→2 卡）。';

  return (
    <div>
      <canvas id="cv-m10-race" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['ppl', 'runtime', 'speed'] as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'selected' : ''}`} onClick={() => setMetric(m)}>
            {m === 'ppl' ? '困惑度' : m === 'runtime' ? '运行时间' : '端到端提速'}
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
            <th>RTN</th>
            <th>GPTQ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>OPT-175B · WikiText2 PPL↓</td>
            <td>8.34</td>
            <td>10.54（4位）</td>
            <td>8.37（4位）/ 8.68（3位）</td>
          </tr>
          <tr>
            <td>BLOOM-176B · WikiText2 PPL↓</td>
            <td>8.11</td>
            <td>8.37（4位）</td>
            <td>8.21（4位）/ 8.64（3位）</td>
          </tr>
          <tr>
            <td>3 位 OPT-175B · 单卡 A100 提速↑</td>
            <td>1×（5 卡）</td>
            <td>崩溃</td>
            <td>3.24×（1 卡）</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default M10Race;
