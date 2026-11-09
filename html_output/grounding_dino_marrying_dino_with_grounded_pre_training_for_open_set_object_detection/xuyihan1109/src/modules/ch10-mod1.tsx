import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clamp, clearScene, drawLabel, drawLegend, useCanvas } from '../lib/pitchKit';

const W = 1080;
const H = 280;

const RES = {
  coco: {
    ours: 52.5,
    rival: 49.8,
    max: 60,
    label: 'COCO 零样本 AP（本方法 L vs GLIP-L）',
    name: 'COCO 零样本 AP',
    rivalName: 'GLIP-L',
  },
  odinw: {
    ours: 70.7,
    rival: 68.8,
    max: 80,
    label: 'ODinW 全量 AP（本方法 T vs DINO Swin-L）',
    name: 'ODinW 全量 AP',
    rivalName: 'DINO Swin-L',
  },
  lvis: {
    ours: 52.1,
    rival: 50.7,
    max: 60,
    label: 'LVIS 微调 AP（本方法 T vs DetCLIPv2-T）',
    name: 'LVIS 微调 AP',
    rivalName: 'DetCLIPv2-T',
  },
} as const;

type Bench = keyof typeof RES;
type Phase = 'idle' | 'running' | 'done';
type Feedback = { text: string; cls: string };

const BENCHES: Array<{ key: Bench; label: string }> = [
  { key: 'coco', label: 'COCO' },
  { key: 'odinw', label: 'ODinW' },
  { key: 'lvis', label: 'LVIS' },
];

const INITIAL: Feedback = { text: '选一组结果，按下开始。', cls: '' };

function resultFeedback(bench: Bench): Feedback {
  const r = RES[bench];
  return {
    text:
      `${r.label}：本方法 ${r.ours}，对照 ${r.rival}。` +
      '论文自己承认三条局限：不能做分割（不像 GLIPv2）、训练数据比最大的 GLIP 少、会出现误报（幻觉）；' +
      '另外常见类强于 GLIP、罕见类反而更弱，作者猜测这是 DETR 结构的短板（推测）。',
    cls: 'good',
  };
}

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<{ bench: Bench; startAt: number | null }>({ bench: 'coco', startAt: null });
  const timerRef = useRef<number | null>(null);
  const [bench, setBench] = useState<Bench>('coco');
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState<Feedback>(INITIAL);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const s = stateRef.current;
    // The first frame after a start request owns the clock, so the race is
    // independent of when the canvas last rendered.
    if (s.startAt === -1) s.startAt = time;
    const r = RES[s.bench];
    const p = s.startAt === null ? 0 : clamp((time - s.startAt) / 2000, 0, 1);
    const x0 = 100;
    const x1 = 980;
    const span = x1 - x0;
    const laneH = 22;
    const yOurs = 90;
    const yRival = 136;

    clearScene(ctx, W, H);

    // a single axis, four unlabelled ticks
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 4; i += 1) {
      const x = x0 + (span * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x, 82);
      ctx.lineTo(x, 168);
      ctx.stroke();
    }
    [yOurs, yRival].forEach((y) => {
      ctx.fillStyle = 'rgba(207,220,208,0.4)';
      ctx.fillRect(x0, y, span, laneH);
      ctx.strokeStyle = COLORS.axis;
      ctx.strokeRect(x0, y, span, laneH);
    });
    ctx.beginPath();
    ctx.moveTo(x0, 78);
    ctx.lineTo(x0, 170);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COLORS.muted;
    ctx.beginPath();
    ctx.moveTo(x1, 78);
    ctx.lineTo(x1, 170);
    ctx.stroke();
    ctx.restore();

    const barW = (v: number) => (span - 4) * (v / r.max) * p;
    const wOurs = barW(r.ours);
    const wRival = barW(r.rival);

    ctx.fillStyle = COLORS.good;
    ctx.fillRect(x0 + 2, yOurs + 2, wOurs, laneH - 4);
    ctx.fillStyle = COLORS.muted;
    ctx.fillRect(x0 + 2, yRival + 2, wRival, laneH - 4);

    if (p > 0) {
      // numbers sit at the final positions and fade in as the race settles
      const labelA = clamp((p - 0.92) / 0.08, 0, 1);
      if (labelA > 0) {
        ctx.save();
        ctx.globalAlpha = labelA;
        drawLabel(ctx, r.rival.toFixed(1), x0 + 2 + (span - 4) * (r.rival / r.max) + 10, yRival + 17, {
          color: COLORS.muted,
          size: 16,
          bold: true,
        });
        drawLabel(ctx, r.ours.toFixed(1), x0 + 2 + (span - 4) * (r.ours / r.max) + 10, yOurs + 17, {
          color: COLORS.good,
          size: 16,
          bold: true,
        });
        ctx.restore();
      }
    }

    if (p > 0.985 && r.ours > r.rival) {
      const from = x0 + 2 + (span - 4) * (r.rival / r.max);
      const to = x0 + 2 + (span - 4) * (r.ours / r.max);
      ctx.save();
      ctx.strokeStyle = COLORS.good;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(from, 124);
      ctx.lineTo(to, 124);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(to, 124);
      ctx.lineTo(to - 8, 119);
      ctx.moveTo(to, 124);
      ctx.lineTo(to - 8, 129);
      ctx.stroke();
      ctx.restore();
    }

    drawLegend(ctx, 40, 258, [
      { color: COLORS.good, text: '本方法' },
      { color: COLORS.muted, text: '对照' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  const start = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      stateRef.current.startAt = -1e9;
      setPhase('done');
      setFeedback(resultFeedback(bench));
      return;
    }
    stateRef.current.startAt = -1;
    setPhase('running');
    setFeedback(INITIAL);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setPhase('done');
      setFeedback(resultFeedback(stateRef.current.bench));
    }, 2000);
  };

  const onBench = (b: Bench) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    stateRef.current.bench = b;
    stateRef.current.startAt = null;
    setBench(b);
    setPhase('idle');
    setFeedback(INITIAL);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny" onClick={start} aria-busy={phase === 'running'}>
          开始比较
        </button>
        {BENCHES.map((b) => (
          <button
            key={b.key}
            type="button"
            className={`chip${bench === b.key ? ' selected' : ''}`}
            onClick={() => onBench(b.key)}
          >
            {b.label}
          </button>
        ))}
        <span className="val">{phase === 'idle' ? '待开始' : phase === 'running' ? '比较中' : '已完成'}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>

      <table className="paper">
        <thead>
          <tr>
            <th>基准</th>
            <th>本方法</th>
            <th>对照</th>
            <th>对照方法</th>
          </tr>
        </thead>
        <tbody>
          {BENCHES.map((b) => {
            const row = RES[b.key];
            const active = bench === b.key;
            return (
              <tr key={b.key}>
                <td>{active ? <b>{row.name}</b> : row.name}</td>
                <td>{active ? <b>{row.ours.toFixed(1)}</b> : row.ours.toFixed(1)}</td>
                <td>{active ? <b>{row.rival.toFixed(1)}</b> : row.rival.toFixed(1)}</td>
                <td>{active ? <b>{row.rivalName}</b> : row.rivalName}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="hotspot-info">
        <p>
          <b>论文自陈的三条局限</b>
        </p>
        <ul>
          <li>不能做分割（不像 GLIPv2）。</li>
          <li>训练数据比最大的 GLIP 少。</li>
          <li>会出现误报（幻觉）。</li>
        </ul>
        <p>
          <b>推测</b>：常见类强于 GLIP、罕见类反而更弱，作者猜测这是 DETR 结构的短板。
        </p>
      </div>
      <div className="hotspot-info">
        <div>
          <b>同一批实验里的其他已验证数字</b>
        </div>
        <div>
          零样本 COCO 的递进（Swin-T，逐步加数据）：只用 O365 是 46.7 AP，加 GoldG 到 48.1，再加 Cap4M 到 48.4；
          同规模的 DINO 基线是 46.2。LVIS 微调版是 52.1 AP，其中罕见类 APr 35.4。
          指代表达理解（RefCOCO/+/g）加了 RefC 数据后是 89.19 / 91.86 / 85.99。
        </div>
      </div>
    </div>
  );
};

export default Ch10Mod1;
