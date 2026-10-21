import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLabel,
  drawLandmark,
  drawLegend,
  drawMeter,
  drawTrail,
  drawWalker,
  useCanvas,
} from '../lib/trailKit';

// §6 module 6.1 — step through 0 / 6 / 12 turns and switch between answering first and
// reasoning first. Footprints accumulate on the trail; the convergence marker and the
// meter show when the walk settles.
const W = 1080;
const H = 280;

type Order = 'answer-first' | 'reason-first';

const TURNS = [0, 6, 12];
// Meter shows how far training has progressed (not accuracy), so the label and the
// number cannot be read as a percentage of correct answers.
const PROGRESS: Record<Order, Record<number, number>> = {
  'reason-first': { 6: 0.6, 12: 1 },
  'answer-first': { 6: 0.5, 12: 1 },
};
const FOOT_START = 60;
const FOOT_GAP = 48;

const trailY = (x: number) => 202 + Math.sin(((x - 50) / 610) * Math.PI * 2) * 5;
const TRAIL: Array<[number, number]> = [50, 180, 330, 480, 610, 680].map(
  (x) => [x, trailY(x)] as [number, number]
);

function meterValue(turn: number, order: Order): number {
  return turn === 0 ? 0 : PROGRESS[order][turn];
}

function hasConverged(turn: number, order: Order): boolean {
  if (turn === 0) return false;
  return order === 'reason-first' ? turn >= 6 : turn >= 12;
}

function feedbackFor(turn: number, order: Order): { text: string; cls: string } {
  if (turn === 0) return { text: '还没走：先听清楚再迈步。', cls: '' };
  if (order === 'reason-first') return { text: '先推理：6 轮就收敛，最终 89.77%。', cls: 'good' };
  if (turn < 12) return { text: '先答：6 轮还没收敛，得训到 12 轮才追平。', cls: 'bad' };
  return { text: '先答：12 轮才追平，最终 89.77%。', cls: 'good' };
}

interface Ch6State {
  turn: number;
  order: Order;
}

export const Ch6Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch6State>({ turn: 0, order: 'reason-first' });
  const [turnIdx, setTurnIdx] = useState(0);
  const [order, setOrder] = useState<Order>('reason-first');
  const [feedback, setFeedback] = useState(feedbackFor(0, 'reason-first'));

  const apply = (nextIdx: number, nextOrder: Order) => {
    const idx = Math.min(TURNS.length - 1, Math.max(0, nextIdx));
    const turn = TURNS[idx];
    stateRef.current.turn = turn;
    stateRef.current.order = nextOrder;
    setTurnIdx(idx);
    setOrder(nextOrder);
    setFeedback(feedbackFor(turn, nextOrder));
  };

  const { ref } = useCanvas<Ch6State>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      drawTrail(ctx, TRAIL, { active: true });

      // one footprint per turn; the turns not walked yet stay as faint empty slots
      for (let i = 0; i < 12; i += 1) {
        const fx = FOOT_START + i * FOOT_GAP;
        const fy = trailY(fx) + 2;
        const reached = i < s.turn;
        ctx.save();
        if (reached) {
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.ellipse(fx, fy, 5, 3, 0, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.route;
          ctx.fill();
        } else {
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(fx, fy, 4, 0, Math.PI * 2);
          ctx.strokeStyle = COLORS.axis;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      const wx = FOOT_START + s.turn * FOOT_GAP;
      drawWalker(ctx, wx, trailY(wx) - 22, { walking: s.turn > 0 });

      // goal: the sign where the walk ends
      drawLandmark(ctx, 660, trailY(660), 'sign');

      // convergence marker: reason-first lands at turn 6, answer-first only at 12
      if (hasConverged(s.turn, s.order)) {
        const cx = FOOT_START + s.turn * FOOT_GAP;
        const cy = trailY(cx);
        ctx.beginPath();
        ctx.arc(cx - 26, cy - 32, 5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.good;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 26, cy - 28);
        ctx.lineTo(cx - 26, cy - 2);
        ctx.strokeStyle = COLORS.good;
        ctx.lineWidth = 3;
        ctx.stroke();
        drawLabel(ctx, '收敛', cx, cy - 46, {
          color: COLORS.good,
          size: 15,
          bold: true,
          align: 'center',
        });
      }

      // accuracy meter plus a twelve-turn scale
      drawMeter(ctx, 740, 70, 280, 26, meterValue(s.turn, s.order), { label: '训练进度', axisMax: 100 });
      for (let i = 0; i < 12; i += 1) {
        const tx = 740 + (i * 280) / 12;
        ctx.beginPath();
        ctx.moveTo(tx, 126);
        ctx.lineTo(tx, 142);
        ctx.strokeStyle = i < s.turn ? COLORS.route : COLORS.axis;
        ctx.lineWidth = i < s.turn ? 3 : 1.5;
        ctx.stroke();
      }

      drawLegend(ctx, 40, 268, [
        { color: COLORS.route, text: '脚印' },
        { color: COLORS.good, text: '收敛' },
        { color: COLORS.muted, text: '同伴' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const turn = TURNS[turnIdx];
  const value = meterValue(turn, order);

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button type="button" className="chip" disabled={turnIdx === 0} onClick={() => apply(turnIdx - 1, order)}>
            上一步
          </button>
          <button
            type="button"
            className="chip"
            disabled={turnIdx === TURNS.length - 1}
            onClick={() => apply(turnIdx + 1, order)}
          >
            下一步
          </button>
          <button type="button" className="chip" onClick={() => apply(0, order)}>
            重置
          </button>
        </div>
        <div className="chip-row">
          <button
            type="button"
            className={order === 'answer-first' ? 'chip selected' : 'chip'}
            onClick={() => apply(turnIdx, 'answer-first')}
          >
            先答
          </button>
          <button
            type="button"
            className={order === 'reason-first' ? 'chip selected' : 'chip'}
            onClick={() => apply(turnIdx, 'reason-first')}
          >
            先推理
          </button>
        </div>
        <label>
          已走 <span className="val">{turn} 轮</span>
        </label>
        <label>
          训练进度 <span className="val">{Math.round(value * 100)}%</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
