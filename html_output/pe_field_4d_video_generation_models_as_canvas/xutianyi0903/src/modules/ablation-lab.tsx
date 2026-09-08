import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, drawSceneLabel, startObservedLoop } from './stage-analogy';

type Metric = 'dyn' | 'met3r' | 'trans' | 'rot';

const variants = ['w/o Temporal Dis.', 'w/o Depth', 'Ours'];

const metrics: Record<Metric, {
  label: string;
  values: number[];
  digits: number;
  scaleMax: number;
}> = {
  dyn: { label: 'Dyn-MEt3R ↑', values: [.7564, .8126, .8235], digits: 4, scaleMax: .9 },
  met3r: { label: 'MEt3R ↓', values: [.3479, .3047, .2968], digits: 4, scaleMax: .4 },
  trans: { label: 'TransErr ↓', values: [.0317, .0161, .0142], digits: 4, scaleMax: .08 },
  rot: { label: 'RotErr ↓', values: [3.284, 1.982, 1.887], digits: 3, scaleMax: 10 },
};

export const AblationLab: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ metric: 'dyn' as Metric });
  const [metric, setMetric] = useState<Metric>('dyn');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startObservedLoop(canvas, 760, 330, ctx => {
      const active = metrics[stateRef.current.metric];
      const barStart = 205;
      const barMaxWidth = 370;
      const valueX = barStart + barMaxWidth + 18;

      ctx.clearRect(0, 0, 760, 330);
      ctx.fillStyle = C.white;
      ctx.fillRect(0, 0, 760, 330);
      drawSceneLabel(ctx, active.label, 28, 28, C.ink);

      variants.forEach((name, index) => {
        const raw = active.values[index];
        const barWidth = (raw / active.scaleMax) * barMaxWidth;
        const y = 96 + index * 62;
        const barEnd = barStart + barWidth;
        const ours = name === 'Ours';

        drawSceneLabel(ctx, name, 25, y + 12, ours ? C.green : C.muted);
        ctx.fillStyle = C.line;
        ctx.fillRect(barStart, y, barMaxWidth, 14);
        ctx.fillStyle = ours ? C.green : C.blue;
        ctx.fillRect(barStart, y, barWidth, 14);
        ctx.beginPath();
        ctx.arc(barEnd, y + 7, ours ? 8 : 6, 0, Math.PI * 2);
        ctx.fill();

        if (ours) {
          ctx.fillStyle = C.orange;
          ctx.beginPath();
          ctx.moveTo(barEnd - 10, y - 4);
          ctx.lineTo(barEnd, y - 17);
          ctx.lineTo(barEnd + 10, y - 4);
          ctx.closePath();
          ctx.fill();
        }

        drawSceneLabel(ctx, raw.toFixed(active.digits), valueX, y + 12, ours ? C.green : C.ink);
      });

      drawSceneLabel(ctx, 'DAVIS视频 · 同一评测协议 · ↑/↓表示指标优劣方向', 380, 312, C.blue, 'center');
    });
  }, []);

  const choose = (nextMetric: Metric) => {
    stateRef.current = { metric: nextMetric };
    setMetric(nextMetric);
  };

  return (
    <div>
      <div className="metric-race-chart">
        <canvas ref={ref} width={760} height={330} />
        <div className="metric-race-switches">
          {(Object.keys(metrics) as Metric[]).map(key => (
            <button
              key={key}
              type="button"
              className={`chip ${metric === key ? 'active' : ''}`}
              onClick={() => choose(key)}
            >
              {metrics[key].label}
            </button>
          ))}
        </div>
      </div>
      <div className="feedback good">消融实验证明复制多份输入数据、深度归一化的方法提高了几何一致性和相机精度。</div>
    </div>
  );
};

export default AblationLab;
