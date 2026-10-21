import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field, bench } from './ov2-analogy';

const W = 1080;
const H = 280;

/* 论文 Table 2（8 个 Bridge 任务，80 rollouts）：成功率 / 显存；A5000 上 int8 仅 1.2Hz、int4 约 3Hz */
const MODES = [
  { name: 'bfloat16', s: 71.3, gb: 16.8, hz: '—', note: '默认精度：71.3%，16.8GB，单张 4090 上约 6Hz。', cls: 'good' },
  { name: 'int8', s: 58.1, gb: 10.2, hz: '1.2Hz', note: '显存降到 10.2GB，但量化开销拖慢推理到 1.2Hz，系统动态变了，成功率掉到 58.1%（红）。', cls: 'bad' },
  { name: 'int4', s: 71.9, gb: 7.0, hz: '约 3Hz', note: '显存 7.0GB（不到 bf16 的一半），成功率 71.9%，与 bf16 的 71.3% 相当。', cls: 'good' },
];

export const Ov2Ch7Quant: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(2);
  const [idx, setIdx] = useState(2);
  const [fb, setFb] = useState({ text: MODES[2].note, cls: 'good' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const m = MODES[stateRef.current];
      field(ctx, W, H);
      bench(ctx, W, H, 250);
      const sw = (m.s / 100) * 620;
      ctx.fillStyle = m.s >= 65 ? V.green : V.red;
      ctx.beginPath();
      ctx.roundRect(80, 72, Math.max(4, sw), 42, 4);
      ctx.fill();
      ctx.fillStyle = V.ink;
      ctx.font = '700 20px "Segoe UI", sans-serif';
      ctx.fillText(m.s.toFixed(1) + '%', 80 + Math.max(4, sw) + 12, 100);
      const gw = (m.gb / 18) * 620;
      ctx.fillStyle = V.blue;
      ctx.beginPath();
      ctx.roundRect(80, 156, Math.max(4, gw), 42, 4);
      ctx.fill();
      ctx.fillStyle = V.ink;
      ctx.font = '700 20px "Segoe UI", sans-serif';
      ctx.fillText(m.gb.toFixed(1) + 'GB', 80 + Math.max(4, gw) + 12, 184);
      ctx.fillStyle = V.muted;
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('实测吞吐 ' + m.hz, 80, 232);
    });
  }, []);

  const pick = (i: number) => {
    stateRef.current = i;
    setIdx(i);
    setFb({ text: MODES[i].note, cls: MODES[i].cls });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {MODES.map((m, i) => (
          <button key={m.name} className={`chip${idx === i ? ' selected' : ''}`} onClick={() => pick(i)}>
            {m.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>
        {fb.text} 上面一条是成功率，下面一条是显存；这组数字来自 8 个 Bridge 任务的 80 次 rollout，与上一模块的 Table 1 不是同一协议。
      </div>
    </div>
  );
};

export default Ov2Ch7Quant;
