import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawWalker,
  drawTrail,
  drawMeter,
  drawLegend,
  useCanvas,
} from '../lib/trailKit';

const W = 1080;
const H = 280;
const MAX_LOSS = 1.2;
const PAPER_EPOCH = 3;

const ROUTE: Array<[number, number]> = [
  [80, 208],
  [196, 176],
  [312, 190],
  [428, 152],
  [544, 162],
  [612, 144],
];

interface TrainState {
  epoch: number;
}

function pathPoint(pts: Array<[number, number]>, t: number): [number, number] {
  const last = pts.length - 1;
  const scaled = Math.min(Math.max(t, 0), 0.9999) * last;
  const i = Math.floor(scaled);
  const f = scaled - i;
  const a = pts[i];
  const b = pts[Math.min(i + 1, last)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [epoch, setEpoch] = useState(1);
  const stateRef = useRef<TrainState>({ epoch: 1 });

  const commit = (next: number) => {
    stateRef.current = { epoch: next };
    setEpoch(next);
  };

  const { ref } = useCanvas<TrainState>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const stability = Math.min(s.epoch / PAPER_EPOCH, 1);
      const loss = MAX_LOSS * Math.pow(0.72, s.epoch);

      // the route itself
      drawTrail(ctx, ROUTE, { active: true });

      // tread depth grows with stability, line width 2 -> 4; extra epochs beyond
      // the paper's 3 no longer deepen the tread
      const passes = Math.min(s.epoch, PAPER_EPOCH);
      for (let i = 0; i < passes; i += 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ROUTE[0][0], ROUTE[0][1] + 6);
        for (let j = 1; j < ROUTE.length; j += 1) {
          ctx.lineTo(ROUTE[j][0], ROUTE[j][1] + 6);
        }
        ctx.strokeStyle = COLORS.trailDark;
        ctx.globalAlpha = 0.45 + i * 0.12;
        ctx.lineWidth = 2 + 2 * stability;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }

      // footprints of every pass, stacked on the same route
      ctx.save();
      for (let pass = 0; pass < s.epoch; pass += 1) {
        for (let k = 0; k < 4; k += 1) {
          const point = pathPoint(ROUTE, 0.18 + k * 0.2);
          ctx.beginPath();
          ctx.ellipse(point[0] + (pass % 2 === 0 ? -4 : 4), point[1] + 11, 3.6, 1.8, 0, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.trailDark;
          ctx.globalAlpha = 0.5 - pass * 0.06;
          ctx.fill();
        }
      }
      ctx.restore();

      drawWalker(ctx, 80, 204, { walking: true });

      // loss falls, stability saturates at the paper's 3 epochs
      drawMeter(ctx, 720, 74, 280, 24, loss / MAX_LOSS, { direction: 'down', label: '损失' });
      drawMeter(ctx, 720, 168, 280, 24, stability, { direction: 'up', label: '稳度' });

      drawLegend(ctx, 720, 268, [
        { color: COLORS.route, text: '路线' },
        { color: COLORS.trailDark, text: '踩痕' },
        { color: COLORS.good, text: '稳度' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const feedback =
    epoch < 2
      ? { text: '1 个 epoch：刚记住，还不稳。', cls: '' }
      : epoch <= PAPER_EPOCH
      ? { text: '2–3 个 epoch：论文用 3 个，损失降到约 0.45。', cls: 'good' }
      : { text: '4 个 epoch 以上：稳度不再涨，收益递减——这是示意，不是论文报告的数字。', cls: '' };

  const loss = MAX_LOSS * Math.pow(0.72, epoch);
  const stability = Math.min(epoch / PAPER_EPOCH, 1);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label htmlFor={`ep-${chapterId}-${moduleId}`}>
          训练轮数 <span className="val">{epoch}</span>
        </label>
        <input
          id={`ep-${chapterId}-${moduleId}`}
          type="range"
          min={1}
          max={5}
          step={1}
          value={epoch}
          onChange={(e) => commit(Number(e.target.value))}
        />
        <span className="val">损失 {loss.toFixed(2)}</span>
        <span className="val">稳度 {stability.toFixed(2)}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
