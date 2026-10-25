import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawGuide,
  drawWalker,
  drawTrail,
  drawMeter,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/trailKit';

const W = 1080;
const H = 280;

interface SeqState {
  turn: number;
  mask: boolean;
}

// Four rows: Human question, Assistant answer, then a second turn.
const ROWS = [
  { role: 'human', width: 0.58 },
  { role: 'assistant', width: 0.74 },
  { role: 'human', width: 0.46 },
  { role: 'assistant', width: 0.66 },
] as const;

const SEQ_X = 64;
const SEQ_W = 620;
const ROW_H = 28;
const ROW_GAP = 6;
const SEQ_TOP = 56;

const LOSS_ON = 0.35;
const LOSS_OFF = 0.72;

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [state, setState] = useState<SeqState>({ turn: 0, mask: true });
  const stateRef = useRef<SeqState>({ turn: 0, mask: true });

  const commit = (next: SeqState) => {
    stateRef.current = next;
    setState(next);
  };

  const { ref } = useCanvas<SeqState>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const loss = s.mask ? LOSS_ON : LOSS_OFF;

      drawLabel(ctx, `第 ${s.turn + 1} 轮`, 40, 40, { color: COLORS.muted, size: 14 });

      // one record page holds the whole dialogue
      ctx.save();
      ctx.beginPath();
      ctx.rect(SEQ_X - 12, SEQ_TOP - 10, SEQ_W + 24, 2 * (ROW_H + ROW_GAP) * 2 + 10);
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = COLORS.bg;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ROWS.forEach((row, i) => {
        const y = SEQ_TOP + i * (ROW_H + ROW_GAP);
        const assistant = row.role === 'assistant';
        const highlighted = s.mask && assistant;

        ctx.save();
        ctx.beginPath();
        ctx.rect(SEQ_X, y, SEQ_W, ROW_H);
        if (highlighted) {
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = COLORS.good;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = COLORS.good;
          ctx.lineWidth = 3;
        } else if (!s.mask) {
          ctx.globalAlpha = 0.16;
          ctx.fillStyle = COLORS.muted;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = COLORS.muted;
          ctx.lineWidth = 2;
        } else {
          ctx.globalAlpha = 0.88;
          ctx.fillStyle = COLORS.bg;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = COLORS.route;
          ctx.lineWidth = 1.5;
        }
        ctx.stroke();

        // speaker dot: green = assistant, blue = human prompt
        ctx.beginPath();
        ctx.arc(SEQ_X + 18, y + ROW_H / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = assistant ? COLORS.good : COLORS.route;
        ctx.fill();

        // one bar per row standing in for that row's tokens
        ctx.beginPath();
        ctx.moveTo(SEQ_X + 34, y + ROW_H / 2);
        ctx.lineTo(SEQ_X + 34 + (SEQ_W - 54) * row.width, y + ROW_H / 2);
        ctx.strokeStyle = highlighted ? COLORS.good : s.mask ? COLORS.route : COLORS.muted;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      });

      // frame the turn the walk is currently on
      const frameY = SEQ_TOP + s.turn * 2 * (ROW_H + ROW_GAP) - 6;
      ctx.save();
      ctx.strokeStyle = COLORS.fader;
      ctx.lineWidth = 3;
      ctx.strokeRect(SEQ_X - 6, frameY, SEQ_W + 12, 2 * ROW_H + ROW_GAP + 10);
      ctx.restore();

      // the walk along the recorded conversation
      drawTrail(ctx, [[SEQ_X, 214], [SEQ_X + SEQ_W, 214]], { dashed: true });
      const dotX = SEQ_X + SEQ_W * (s.turn === 0 ? 0.28 : 0.72);
      ctx.beginPath();
      ctx.arc(dotX, 214, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.fader;
      ctx.fill();

      // loss meter: only assistant answers contribute
      drawMeter(ctx, 760, 88, 260, 26, loss, { direction: 'down', label: '损失' });
      drawGuide(ctx, 800, 230, { eye: true });
      drawWalker(ctx, 1000, 230, {});

      drawLegend(ctx, 40, 268, [
        { color: COLORS.good, text: '助手回答' },
        { color: COLORS.route, text: '人类提示' },
        { color: COLORS.fader, text: '当前轮' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const feedback = state.mask
    ? { text: '只对回答计损失：问题和图像只是条件。', cls: 'good' }
    : { text: '全序列都算：把提示也当答案学，是错的——提示不该被预测。', cls: 'bad' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button
          className="tiny"
          onClick={() => commit({ ...state, turn: Math.max(0, state.turn - 1) })}
          disabled={state.turn === 0}
        >
          上一步
        </button>
        <button
          className="tiny"
          onClick={() => commit({ ...state, turn: Math.min(1, state.turn + 1) })}
          disabled={state.turn === 1}
        >
          下一步
        </button>
        <button className="tiny" onClick={() => commit({ turn: 0, mask: true })}>
          重置
        </button>
        <span className="val">损失 {state.mask ? '0.35' : '0.72'}</span>
        <div className="chip-row">
          <button
            className={`chip ${state.mask ? 'selected' : ''}`}
            onClick={() => commit({ ...state, mask: true })}
          >
            只算回答
          </button>
          <button
            className={`chip ${!state.mask ? 'selected' : ''}`}
            onClick={() => commit({ ...state, mask: false })}
          >
            全序列都算
          </button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
