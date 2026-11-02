// Chapter 10 module: the result race.
// One button starts a two-second race between this method (green) and the best
// comparison (grey), on a single axis. The three chips swap in the verified table
// values, and the limitations panel keeps the paper's own scope limits visible.
import React, { useRef, useState } from 'react';
import { COLORS, clearScene, drawLabel, drawLegend, useCanvas, clamp } from '../lib/roomKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const DURATION = 2000;

type Bench = 'coco' | 'lvis' | 'flickr';

const RES: Record<Bench, { ours: number; rival: number; axis: number; label: string }> = {
  coco: {
    ours: 49.8,
    rival: 43.6,
    axis: 60,
    label: 'COCO 零样本 AP（GLIP-L vs O365 DyHead-T）',
  },
  lvis: {
    ours: 26.9,
    rival: 25.4,
    axis: 35,
    label: 'LVIS val 零样本 AP（GLIP-L vs 监督 RFS）',
  },
  flickr: {
    ours: 87.1,
    rival: 84.3,
    axis: 100,
    label: 'Flickr30K test R@1（GLIP-L vs MDETR）',
  },
};

const BENCH_LIST: Array<{ id: Bench; label: string }> = [
  { id: 'coco', label: 'COCO' },
  { id: 'lvis', label: 'LVIS' },
  { id: 'flickr', label: 'Flickr30K' },
];

const smooth = (u: number): number => {
  const t = clamp(u, 0, 1);
  return t * t * (3 - 2 * t);
};

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [bench, setBench] = useState<Bench>('coco');
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>({
    text: '选一组结果，按下开始。',
    cls: '',
  });
  const stateRef = useRef({ bench: 'coco' as Bench, started: false, t0: 0 });

  const pick = (next: Bench) => {
    setBench(next);
    const s = stateRef.current;
    s.bench = next;
    s.started = false;
    s.t0 = 0;
    setStarted(false);
    setFeedback({ text: '选一组结果，按下开始。', cls: '' });
  };

  const start = () => {
    const s = stateRef.current;
    s.started = true;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    s.t0 = reduced ? performance.now() - DURATION * 2 : performance.now();
    setStarted(true);
    const r = RES[s.bench];
    setFeedback({
      text: `${r.label}：本方法 ${r.ours}，对照 ${r.rival}。`,
      cls: 'good',
    });
  };

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const s = stateRef.current;
    const res = RES[s.bench];
    clearScene(ctx, W, H);
    const elapsed = s.started ? clamp((time - s.t0) / DURATION, 0, 1) : 0;
    const grow = smooth(elapsed);

    const x0 = 110;
    const trackW = 850;
    const oursY = 70;
    const rivalY = 124;
    const barH = 24;

    // start gate and the single axis
    ctx.save();
    ctx.strokeStyle = COLORS.muted;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, 48);
    ctx.lineTo(x0, 158);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, 176);
    ctx.lineTo(x0 + trackW, 176);
    ctx.stroke();
    ctx.restore();

    // tracks
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = COLORS.axis;
    ctx.fillRect(x0, oursY, trackW, barH);
    ctx.fillRect(x0, rivalY, trackW, barH);
    ctx.restore();

    const oursEnd = x0 + trackW * (res.ours / res.axis);
    const rivalEnd = x0 + trackW * (res.rival / res.axis);

    // target ticks so the two ends can be compared before the run finishes
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rivalEnd, rivalY - 6);
    ctx.lineTo(rivalEnd, rivalY + barH + 6);
    ctx.stroke();
    ctx.restore();

    // faint target lengths keep the lanes readable before the race starts
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = COLORS.thread;
    ctx.fillRect(x0, oursY, trackW * (res.ours / res.axis), barH);
    ctx.fillStyle = COLORS.muted;
    ctx.fillRect(x0, rivalY, trackW * (res.rival / res.axis), barH);
    ctx.restore();

    ctx.fillStyle = COLORS.thread;
    ctx.fillRect(x0, oursY, trackW * (res.ours / res.axis) * grow, barH);
    ctx.fillStyle = COLORS.muted;
    ctx.fillRect(x0, rivalY, trackW * (res.rival / res.axis) * grow, barH);

    // the green bar leads: mark its tip once the race is over
    if (grow >= 1) {
      ctx.beginPath();
      ctx.arc(x0 + trackW * (res.ours / res.axis), oursY + barH / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.accent;
      ctx.fill();
      ctx.save();
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(oursEnd + 14, oursY + 2);
      ctx.lineTo(oursEnd + 14, rivalY + barH);
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.restore();
    }

    drawLabel(ctx, String(res.ours), oursEnd + 10, oursY - 8, {
      color: COLORS.thread,
      size: 15,
      bold: true,
    });
    drawLabel(ctx, String(res.rival), rivalEnd + 10, rivalY - 8, {
      color: COLORS.muted,
      size: 15,
    });
    drawLabel(ctx, String(res.axis), x0 + trackW, 200, {
      color: COLORS.muted,
      size: 13,
      align: 'right',
    });

    drawLegend(ctx, 110, 246, [
      { color: COLORS.thread, text: '本方法' },
      { color: COLORS.muted, text: '对照' },
      { color: COLORS.accent, text: '领先' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  const res = RES[bench];
  const diff = (res.ours - res.rival).toFixed(1);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {BENCH_LIST.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`chip ${bench === b.id ? 'selected' : ''}`}
              onClick={() => pick(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
        <button type="button" className="tiny" onClick={start}>
          开始比较
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">本方法</div>
          <div className="v">{res.ours}</div>
        </div>
        <div className="metric">
          <div className="l">对照</div>
          <div className="v">{res.rival}</div>
        </div>
        <div className="metric">
          <div className="l">差距</div>
          <div className="v">+{diff}</div>
        </div>
      </div>
      <div className="hotspot-info">
        <div>
          <b>边界</b>：论文自己承认：预训练仍需要一个检测集起步；图文数据规模的影响留给未来工作；表中对照为不同协议，不宜直接等同。
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod1;
