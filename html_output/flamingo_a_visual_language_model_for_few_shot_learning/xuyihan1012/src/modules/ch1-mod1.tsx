import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDeck,
  drawLabel,
  drawLegend,
  drawLevelMeter,
  useCanvas,
  clamp,
} from '../lib/consoleKit';

// §1 module 1.1 (1080×280) — "重新训练要付多少代价", pattern P3 (one shared start key).
// ONE dominant operation: press 开始对比 once; both sides then run under the same
// condition. Old side = retrain every parameter (record re-cut, red), new side = freeze
// the backbones and train only the small adapters (green). Evidence E18 / E27b / E36.

const W = 1080;
const H = 280;
const DUR = 2400; // ~2.4 s eased run, per the chapter plan

// E27b parameter accounting for the 3B model: 1.4B LM + 435M vision encoder are frozen,
// 1.2B xattn + 194M resampler are trainable, so the trainable share is about 0.43.
const OLD_TRAINABLE = 1;
const NEW_TRAINABLE = 0.43;

type Line = { cls: string; text: string };
type Fb = Line & { extra?: Line };

const IDLE_FB: Fb = { cls: '', text: '按下开始，比较两种做法付出的代价。' };
const DONE_FB: Fb = {
  cls: 'bad',
  text: '重训整台模型：参数全动，还需要成千上万的标注样本。',
  extra: { cls: 'good', text: '冻结骨干：只训练很小的适配层，标注需求降到几十个示例。' },
};

const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const Ch1Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef({ run: 0, startedAt: 0, instant: false });
  const timerRef = useRef<number | null>(null);
  const reduceRef = useRef(prefersReducedMotion());
  const [run, setRun] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<Fb>(IDLE_FB);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const start = () => {
    const instant = reduceRef.current;
    stateRef.current.run = 1;
    stateRef.current.instant = instant;
    stateRef.current.startedAt = performance.now();
    setRun(1);
    setFb(DONE_FB);
    if (instant) {
      setBusy(false);
      return;
    }
    setBusy(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setBusy(false);
      timerRef.current = null;
    }, DUR);
  };

  const { ref } = useCanvas(
    (ctx, time, s) => {
      const p = s.run === 0 ? 0 : s.instant ? 1 : easeInOut(clamp((time - s.startedAt) / DUR, 0, 1));

      clearScene(ctx, W, H);

      // trackArea: the record is re-cut from scratch, one continuous red pass
      const cx = 170;
      const cy = 146;
      const r = 64;
      drawDeck(ctx, cx, cy, r, { spin: 0, frozen: false, accent: COLORS.bad });
      const groove = r * 0.86 * 0.62;
      if (p > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, groove, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
        ctx.strokeStyle = COLORS.bad;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
      const theta = -Math.PI / 2 + Math.PI * 2 * p;
      const bx = cx + Math.cos(theta) * groove;
      const by = cy + Math.sin(theta) * groove;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(theta) * 16, by + Math.sin(theta) * 16);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.bad;
      ctx.fill();
      ctx.restore();

      // meterOld: every parameter moves under the old method
      const oldValue = OLD_TRAINABLE * p;
      // meterNew: only the small trainable adapters move
      const newValue = NEW_TRAINABLE * p;
      drawLevelMeter(ctx, 380, 120, 280, 30, oldValue, { direction: 'down' });
      drawLevelMeter(ctx, 700, 120, 280, 30, newValue, { direction: 'down' });

      // target marker (weight 3 + filled dot) on the frozen-backbone route
      const tx = 700 + 280 * NEW_TRAINABLE;
      ctx.save();
      ctx.strokeStyle = COLORS.good;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx, 112);
      ctx.lineTo(tx, 158);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx, 112, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.good;
      ctx.fill();
      ctx.restore();

      // at most two short in-canvas labels plus one legend
      drawLabel(ctx, '重训全部', 380, 168, { color: COLORS.muted, size: 13, align: 'left' });
      drawLabel(ctx, '只训适配层', 700, 168, { color: COLORS.muted, size: 13, align: 'left' });
      drawLegend(ctx, 380, 250, [
        { color: COLORS.bad, text: '每个任务重训' },
        { color: COLORS.good, text: '冻结骨干 + 适配层' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button type="button" className="chip" onClick={start} disabled={busy}>
            {run === 0 ? '开始对比' : '重跑一次'}
          </button>
        </div>
        <label>
          需要更新的参数 <span className="val">3.2B</span> 对 <span className="val">1.4B</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      {fb.extra ? <div className={`feedback ${fb.extra.cls}`}>{fb.extra.text}</div> : null}
    </div>
  );
};

export default Ch1Mod1;
