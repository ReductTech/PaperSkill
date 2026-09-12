import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawLegend, drawValueChip } from './dogKit';
import type { WidgetProps } from './registry';

// Ch10 module 10.1 「基准对比」 (bar chart + explanation, technical).
// Switching a metric immediately redraws proportional horizontal bars with the
// verified values; the direction (higher/lower is better) is stated on the
// canvas and in the feedback; the DOM table below keeps the exact numbers and
// measurement conditions.
const W = 1080;
const H = 280;

type MetricKey = 'aj' | 'apd' | 'oa' | 'time' | 'mem';

interface Bar {
  name: string;
  text: string;
  value: number;
  color: string;
}

interface MetricDef {
  label: string;
  header: string;
  higherBetter: boolean;
  bars: Bar[];
  fb: string;
}

const METRICS: Record<MetricKey, MetricDef> = {
  aj: {
    label: 'AJ',
    header: 'AJ（五基准平均）',
    higherBetter: true,
    bars: [
      { name: 'DELTAv2+ViPE', text: '.4395', value: 0.4395, color: C.red },
      { name: 'DELTAv2+DA3', text: '.4975', value: 0.4975, color: C.red },
      { name: 'TC3R+ViPE', text: '.5639', value: 0.5639, color: C.green },
      { name: 'TC3R+DA3', text: '.6785', value: 0.6785, color: C.green },
    ],
    fb: 'TrackCraft3R+DA3 平均 AJ 0.679 领先（Sim(3) 对齐、五基准平均，越高越好）；效率指标越低越好：3.91 s vs 5.00 s，7.63 GB vs 35.46 GB。',
  },
  apd: {
    label: 'APD₃D',
    header: 'APD₃D（五基准平均）',
    higherBetter: true,
    bars: [
      { name: 'DELTAv2+ViPE', text: '.6184', value: 0.6184, color: C.red },
      { name: 'DELTAv2+DA3', text: '.6858', value: 0.6858, color: C.red },
      { name: 'TC3R+ViPE', text: '.6817', value: 0.6817, color: C.green },
      { name: 'TC3R+DA3', text: '.7931', value: 0.7931, color: C.green },
    ],
    fb: 'TrackCraft3R+DA3 平均 APD₃D 0.7931 领先（Sim(3) 对齐、五基准平均，越高越好）。',
  },
  oa: {
    label: 'OA',
    header: 'OA（五基准平均）',
    higherBetter: true,
    bars: [
      { name: 'DELTAv2+ViPE', text: '.8144', value: 0.8144, color: C.red },
      { name: 'DELTAv2+DA3', text: '.8128', value: 0.8128, color: C.red },
      { name: 'TC3R+ViPE', text: '.9258', value: 0.9258, color: C.green },
      { name: 'TC3R+DA3', text: '.9250', value: 0.925, color: C.green },
    ],
    fb: 'TrackCraft3R+ViPE 平均 OA 0.9258 领先（Sim(3) 对齐、五基准平均，越高越好）。',
  },
  time: {
    label: '12帧耗时(s)',
    header: '12 帧耗时（s）',
    higherBetter: false,
    bars: [
      { name: 'DELTA', text: '14.64', value: 14.64, color: C.muted },
      { name: 'DELTAv2', text: '5.00', value: 5.0, color: C.red },
      { name: 'TC3R', text: '3.91', value: 3.91, color: C.green },
    ],
    fb: '12 帧耗时越低越好（柱越短越好）：TC3R 3.91 s 最快——比 DELTAv2 5.00 s 快 1.3×，DELTA 14.64 s（A6000、448×448）。',
  },
  mem: {
    label: '12帧显存(GB)',
    header: '12 帧显存（GB）',
    higherBetter: false,
    bars: [
      { name: 'DELTA', text: '29.97', value: 29.97, color: C.muted },
      { name: 'DELTAv2', text: '35.46', value: 35.46, color: C.red },
      { name: 'TC3R', text: '7.63', value: 7.63, color: C.green },
    ],
    fb: '12 帧显存越低越好（柱越短越好）：TC3R 7.63 GB 最省——比 DELTAv2 35.46 GB 省 4.6×，DELTA 29.97 GB（A6000、448×448）。',
  },
};

const ORDER: MetricKey[] = ['aj', 'apd', 'oa', 'time', 'mem'];

const winnerIdx = (def: MetricDef) => {
  let best = 0;
  def.bars.forEach((b, i) => {
    const cur = def.bars[best].value;
    if (def.higherBetter ? b.value > cur : b.value < cur) best = i;
  });
  return best;
};

export const Ch10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ metric: MetricKey }>({ metric: 'aj' });
  const [metric, setMetric] = useState<MetricKey>('aj');
  const [feedback, setFeedback] = useState({ text: METRICS.aj.fb, cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = () => {
      const def = METRICS[stateRef.current.metric];
      const wIdx = winnerIdx(def);
      const n = def.bars.length;
      const barH = 34;
      const gap = 14;
      const top = 46;
      const x0 = 210;
      const maxLen = 640;
      const mx = Math.max(...def.bars.map((b) => b.value));

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // headline: metric name + direction
      drawSceneLabel(ctx, def.header, 24, 22, { color: C.text });
      drawSceneLabel(ctx, def.higherBetter ? '越高越好' : '越低越好', W - 20, 22, {
        color: C.orange,
        align: 'right',
      });

      def.bars.forEach((b, i) => {
        const y = top + i * (barH + gap);
        const win = i === wIdx;
        // method name at the left (DOM table below repeats the exact mapping)
        drawSceneLabel(ctx, b.name, 24, y + barH / 2, { color: win ? C.green : C.muted });
        // full-length track
        ctx.strokeStyle = C.border;
        ctx.lineWidth = barH;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(x0, y + barH / 2);
        ctx.lineTo(x0 + maxLen, y + barH / 2);
        ctx.stroke();
        // value-proportional bar
        ctx.strokeStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(x0, y + barH / 2);
        ctx.lineTo(x0 + maxLen * (b.value / mx), y + barH / 2);
        ctx.stroke();
        // winner outline emphasis
        if (win) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.strokeRect(x0 - 3, y + barH / 2 - barH / 2 - 3, maxLen + 6, barH + 6);
        }
        // verified value at the bar end
        drawValueChip(ctx, x0 + maxLen * (b.value / mx) + 56, y + barH / 2, b.text, b.color);
      });

      drawLegend(
        ctx,
        [
          ['DELTAv2 系', C.red],
          ['TC3R 系', C.green],
          ['DELTA', C.muted],
        ],
        24,
        H - 14
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const chooseMetric = (m: MetricKey) => {
    stateRef.current.metric = m;
    setMetric(m);
    setFeedback({ text: METRICS[m].fb, cls: 'good' });
  };

  const def = METRICS[metric];
  const wIdx = winnerIdx(def);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {ORDER.map((m) => (
          <button
            key={m}
            type="button"
            className={`chip ${metric === m ? 'selected' : ''}`}
            onClick={() => chooseMetric(m)}
          >
            {METRICS[m].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <table className="paper" style={{ margin: '10px 0 0' }}>
        <thead>
          <tr>
            <th>方法</th>
            <th>
              {def.header}（{def.higherBetter ? '越高越好' : '越低越好'}）
            </th>
          </tr>
        </thead>
        <tbody>
          {def.bars.map((b, i) => (
            <tr key={b.name} style={i === wIdx ? { fontWeight: 700 } : undefined}>
              <td>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: b.color,
                    marginRight: 8,
                    verticalAlign: 'middle',
                  }}
                />
                {b.name}
                {i === wIdx ? '（最优）' : ''}
              </td>
              <td>{b.text}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={{ color: 'var(--slate-2)' }}>
              Sim(3) 对齐 · 五基准平均 · A6000 · 448×448
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Ch10Race;
