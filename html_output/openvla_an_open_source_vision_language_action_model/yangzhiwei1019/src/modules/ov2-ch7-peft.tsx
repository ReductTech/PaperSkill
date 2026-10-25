import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field, bench } from './ov2-analogy';

const W = 1080;
const H = 280;

/* 论文 Table 1（Franka-Tabletop，33 rollouts）：成功率 / 可训练参数（百万）/ 显存 */
const PLANS = [
  { name: '全参数', s: 69.7, p: 7188.1, mem: 163.3, note: '效果上限，也最贵：8 张 A100 跑 5–15 小时，显存 163.3GB（跨两张卡）。', cls: 'good' },
  { name: '只调末层', s: 30.3, p: 465.1, mem: 51.4, note: '只调最后一层和词嵌入：省显存，但视觉没适配，掉到 30.3%（红）。', cls: 'bad' },
  { name: '冻结视觉', s: 47.0, p: 6760.4, mem: 156.2, note: '冻结视觉：参数几乎没省，成功率只有 47.0%，说明视觉必须一起改。', cls: 'bad' },
  { name: 'Sandwich', s: 62.1, p: 914.2, mem: 64.0, note: '解冻视觉、词嵌入与最后一层：介于两者之间，64GB 显存。', cls: '' },
  { name: 'LoRA r=32', s: 68.2, p: 97.6, mem: 59.7, note: '只训练 1.4% 的参数（97.6M），68.2% 基本追平全参数；单卡 A100 10–15 小时，约 8 倍算力下降。', cls: 'good' },
  { name: 'LoRA r=64', s: 68.2, p: 195.2, mem: 60.5, note: '把 rank 翻倍到 64：成功率仍是 68.2%，参数翻到 195.2M、显存 60.5GB。rank 对策略表现影响可忽略，作者建议默认 r=32（绿）。', cls: 'good' },
];

export const Ov2Ch7Peft: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(4);
  const [idx, setIdx] = useState(4);
  const [fb, setFb] = useState({ text: PLANS[4].note, cls: 'good' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const p = PLANS[stateRef.current];
      field(ctx, W, H);
      bench(ctx, W, H, 250);
      const sw = (p.s / 100) * 620;
      ctx.fillStyle = p.s >= 60 ? V.green : V.red;
      ctx.beginPath();
      ctx.roundRect(80, 72, Math.max(4, sw), 42, 4);
      ctx.fill();
      ctx.fillStyle = V.ink;
      ctx.font = '700 20px "Segoe UI", sans-serif';
      ctx.fillText(p.s.toFixed(1) + '%', 80 + Math.max(4, sw) + 12, 100);
      const pw = (p.p / 7200) * 620;
      ctx.fillStyle = V.blue;
      ctx.beginPath();
      ctx.roundRect(80, 156, Math.max(4, pw), 42, 4);
      ctx.fill();
      ctx.fillStyle = V.ink;
      ctx.font = '700 20px "Segoe UI", sans-serif';
      ctx.fillText((p.p / 1000).toFixed(2) + 'B', 80 + Math.max(4, pw) + 12, 184);
      ctx.fillStyle = V.muted;
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('显存 ' + p.mem.toFixed(1) + 'GB', 80, 232);
    });
  }, []);

  const pick = (i: number) => {
    stateRef.current = i;
    setIdx(i);
    setFb({ text: PLANS[i].note, cls: PLANS[i].cls });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {PLANS.map((p, i) => (
          <button key={p.name} className={`chip${idx === i ? ' selected' : ''}`} onClick={() => pick(i)}>
            {p.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text} 上面一条是成功率，下面一条是可训练参数量（对数感上按 0–7.2B 线性映射）。</div>
    </div>
  );
};

export default Ov2Ch7Peft;
