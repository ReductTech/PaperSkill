import React, { useEffect, useRef, useState } from 'react';
import { SC } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 10.1 Result race (Table 1, three-run average). DOM bar race so the
// seven method names and bare values stay outside the canvas label budget.
type Metric = 'acc' | 'fgt' | 'fid' | 'txt' | 'img';

const METHODS = ['Zero-shot', 'SeqLoRA', 'ModelTailor', 'DualPrompt', 'MoELoRA', 'CL-MoE', 'MoDE'];
const DATA: Record<Metric, Array<number | null>> = {
  acc: [22.48, 28.43, 32.62, 31.92, 33.01, 32.86, 33.47],
  fgt: [null, 35.33, 27.66, 6.82, 30.77, 30.95, 25.99],
  fid: [52.13, 56.12, 55.47, 56.08, 65.16, 65.87, 53.74],
  txt: [0.2592, 0.2162, 0.2384, 0.2648, 0.2248, 0.2081, 0.2458],
  img: [0.5205, 0.515, 0.5093, 0.5083, 0.5095, 0.515, 0.517],
};
const METRIC_META: Record<Metric, { label: string; better: 'high' | 'low'; min: number; max: number; fmt: (v: number) => string }> = {
  acc: { label: 'ACC（越高越好）', better: 'high', min: 20, max: 34, fmt: (v) => v.toFixed(2) },
  fgt: { label: 'Fgt（越低越好）', better: 'low', min: 0, max: 36, fmt: (v) => v.toFixed(2) },
  fid: { label: 'FID（越低越好）', better: 'low', min: 50, max: 66, fmt: (v) => v.toFixed(2) },
  txt: { label: '文本对齐（越高越好）', better: 'high', min: 0.2, max: 0.27, fmt: (v) => v.toFixed(4) },
  img: { label: '图像对齐（越高越好）', better: 'high', min: 0.5, max: 0.525, fmt: (v) => v.toFixed(4) },
};
const FB: Record<Metric, { text: string; cls: string }> = {
  acc: { text: 'ACC（越高越好）：MoDE 33.47 全场最高，但距逐任务单独微调的上界 57.32（表2）仍有距离。', cls: 'good' },
  fgt: { text: 'Fgt（越低越好）：DualPrompt 6.82 最低——先别鼓掌，下一模块拆穿这个口径。MoDE 25.99 是「学到了真东西」的低遗忘。', cls: '' },
  fid: { text: 'FID（越低越好）：MoDE 53.74 在六种持续学习方法里最低，最接近零样本的 52.13。', cls: 'good' },
  txt: { text: '文本对齐（越高越好）：DualPrompt 0.2648 最高；MoDE 0.2458 略低于零样本 0.2592——保住了「像」，没完全保住「听提示」。', cls: '' },
  img: { text: '图像对齐（越高越好）：MoDE 0.5170 在持续学习方法里最高，与零样本 0.5205 几乎持平。', cls: 'good' },
};

function frac(m: Metric, v: number): number {
  const meta = METRIC_META[m];
  return Math.max(0.02, Math.min(1, (v - meta.min) / (meta.max - meta.min)));
}

export const M101Race: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<Metric>('acc');
  const [started, setStarted] = useState(false);
  const [grown, setGrown] = useState(false);
  const timerRef = useRef<number | null>(null);

  const start = (m: Metric = metric) => {
    setMetric(m);
    setStarted(true);
    setGrown(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setGrown(true), 60);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const vals = DATA[metric];
  // best among the six continual-learning methods (index 1..6)
  let bestIdx = 1;
  for (let i = 2; i <= 6; i++) {
    const vi = vals[i] as number;
    const vb = vals[bestIdx] as number;
    if (METRIC_META[metric].better === 'high' ? vi > vb : vi < vb) bestIdx = i;
  }
  const moDEWins = bestIdx === 6;

  return (
    <div>
      <div className="chip-row">
        {(Object.keys(METRIC_META) as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'selected' : ''}`} onClick={() => start(m)}>
            {METRIC_META[m].label.split('（')[0]}
          </button>
        ))}
        <button className="chip" onClick={() => start()}>
          开始评审
        </button>
      </div>
      <div style={{ margin: '6px 0 2px', color: SC.muted, fontSize: 13 }}>
        {METRIC_META[metric].label} · 表1（Chameleon，5 任务，三次运行平均）
      </div>
      <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
        {METHODS.map((name, i) => {
          const v = vals[i];
          const isMoDE = i === 6;
          const isZero = i === 0;
          const color = isMoDE ? SC.green : isZero ? SC.shade : SC.blue;
          return (
            <div key={name} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 64px', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 13, color: isMoDE ? SC.green : SC.ink, fontWeight: isMoDE ? 600 : 400 }}>
                {name}
                {moDEWins && isMoDE ? ' ★' : ''}
              </div>
              <div style={{ background: '#ece9df', borderRadius: 4, height: 18, overflow: 'hidden' }}>
                <div
                  style={{
                    width: v === null ? 0 : started && grown ? `${frac(metric, v) * 100}%` : '0%',
                    height: '100%',
                    background: color,
                    transition: 'width 1.1s cubic-bezier(0.22, 0.8, 0.36, 1)',
                    outline: isMoDE ? `2px solid ${SC.green}` : 'none',
                    outlineOffset: -1,
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: v === null ? SC.muted : color, textAlign: 'right' }}>
                {v === null ? '—' : METRIC_META[metric].fmt(v)}
              </div>
            </div>
          );
        })}
      </div>
      <div className={`feedback ${FB[metric].cls}`} style={{ marginTop: 10 }}>
        {started ? FB[metric].text : '切指标或按「开始评审」：条形从零生长，绿色是 MoDE，灰色是零样本参照。'}
      </div>
    </div>
  );
};
export default M101Race;
