import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field, bench } from './ov2-analogy';
import { clamp, easeOutCubic } from '../lib/canvasKit';

const W = 1080;
const H = 280;

const SETS = [
  { name: 'Bridge 17 任务', v: [70.6, 50.6, 20.0, 18.5], proto: '170 次 rollout（17×10），成功率越高越好' },
  { name: 'Google 12 任务', v: [85.0, 78.3, 33.3, 26.7], proto: '60 次 rollout（12×5），论文标注前两者误差条重叠' },
];
const NAMES = ['OpenVLA', 'RT-2-X', 'RT-1-X', 'Octo'];
const COLORS = [V.green, V.purple, V.red, '#d98a97'];

export const Ov2Ch8Race: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ set: 0, start: 0 });
  const [si, setSi] = useState(0);
  const [fb, setFb] = useState({ text: '选一个验收台，再让四个策略从同一基线起跑。', cls: '' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const s = stateRef.current;
      const d = SETS[s.set];
      const started = s.start > 0;
      const el = started ? easeOutCubic(clamp((performance.now() - s.start) / 1400, 0, 1)) : 1;
      field(ctx, W, H);
      bench(ctx, W, H, 250);
      ctx.globalAlpha = started ? 1 : 0.22;
      d.v.forEach((val, i) => {
        const y = 52 + i * 48;
        const w = (val / 100) * 740 * el;
        ctx.fillStyle = COLORS[i];
        ctx.beginPath();
        ctx.roundRect(200, y, Math.max(3, w), 30, 4);
        ctx.fill();
        ctx.fillStyle = V.ink;
        ctx.font = '700 17px "Segoe UI", sans-serif';
        ctx.fillText((val * el).toFixed(1), 200 + Math.max(3, w) + 10, y + 22);
        ctx.fillStyle = V.muted;
        ctx.font = '600 14px "Segoe UI", sans-serif';
        ctx.fillText(NAMES[i], 46, y + 21);
      });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = V.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(190, 40);
      ctx.lineTo(190, 248);
      ctx.stroke();
    });
  }, []);

  const start = () => {
    stateRef.current.start = performance.now();
    const d = SETS[stateRef.current.set];
    const gap = (d.v[0] - d.v[1]).toFixed(1);
    setFb({
      text:
        stateRef.current.set === 0
          ? `${d.v[0]}% 对 ${d.v[1]}%，同一协议下高 ${gap} 个百分点，而参数只有它的约 1/8（7B vs 55B）。${d.proto}。`
          : `${d.v[0]}% 对 ${d.v[1]}%，差 ${gap} 个百分点，但误差条重叠，属于相当。${d.proto}。`,
      cls: stateRef.current.set === 0 ? 'good' : '',
    });
  };

  const pick = (i: number) => {
    stateRef.current.set = i;
    stateRef.current.start = 0;
    setSi(i);
    setFb({ text: `已换到${SETS[i].name}，点「开始比较」重新起跑。`, cls: '' });
  };

  return (
    <div>
      <div className="chip-row">
        {SETS.map((s, i) => (
          <button key={s.name} className={`chip${si === i ? ' selected' : ''}`} onClick={() => pick(i)}>
            {s.name}
          </button>
        ))}
      </div>
      <canvas ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={start}>
          开始比较
        </button>
        <span className="step-label">
          当前 {SETS[si].v[0].toFixed(1)} %
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ov2Ch8Race;
