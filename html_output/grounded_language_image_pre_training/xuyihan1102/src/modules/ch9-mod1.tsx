import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawItem,
  drawBox,
  drawList,
  drawPerson,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/roomKit';

// Module 9.1 — three adaptation modes and a shots control driving three illustrative AP
// curves on ODinW. The curves are labelled 示意 trends only: no ODinW AP number is invented.

const W = 1080;
const H = 280;

type ModeId = 'full' | 'prompt' | 'rewrite';

interface Mode {
  id: ModeId;
  label: string;
  color: string;
  curve: number[];
  feedback: string;
  cls: string;
}

// Illustrative trends (normalised, no axis numbers): full > prompt > rewrite, and the
// gap between full tuning and prompt tuning shrinks as more shots are available.
const MODES: Mode[] = [
  {
    id: 'full',
    label: '全模型微调',
    color: COLORS.thread,
    curve: [0.35, 0.6, 0.76, 0.94],
    feedback: '全模型微调：最强，但要更新全部参数。',
    cls: '',
  },
  {
    id: 'prompt',
    label: '提示微调',
    color: COLORS.box,
    curve: [0.3, 0.56, 0.74, 0.92],
    feedback: '提示微调：只调提示嵌入、丢掉语言主干，几乎追平全模型微调。',
    cls: 'good',
  },
  {
    id: 'rewrite',
    label: '只改清单写法',
    color: COLORS.accent,
    curve: [0.2, 0.28, 0.33, 0.38],
    feedback:
      '只改写法：零标注，靠更具体的描述提升，例如 stingray 加「flat and round」AP50 4.6 → 9.7。',
    cls: '',
  },
];

const SHOT_LABELS = ['零样本', '5-shot', '10-shot', '全部'];

const XS = [640, 756, 872, 988];
const BASE_Y = 210;
const TOP_Y = 66;
const yOf = (v: number) => BASE_Y - v * (BASE_Y - TOP_Y);

// three small lists in the same room: one per adaptation mode
const PANELS = [
  { y: 26 },
  { y: 96 },
  { y: 166 },
];
const PX = 400;
const PW = 120;
const PH = 48;

const ZERO_SHOT = '零样本：这已经是 GLIP-L 超过 5-shot 监督基线的那一档。';

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<ModeId>('rewrite');
  const [shot, setShot] = useState(0);
  const stateRef = useRef<{ mode: ModeId; shot: number }>({ mode: 'rewrite', shot: 0 });
  const [feedback, setFeedback] = useState({
    text: '只改写法：零样本也能用，不需要任何标注。',
    cls: '',
  });

  const apply = (nextMode: ModeId, nextShot: number) => {
    stateRef.current = { mode: nextMode, shot: nextShot };
    setMode(nextMode);
    setShot(nextShot);
    const cfg = MODES.find((m) => m.id === nextMode) ?? MODES[0];
    setFeedback({
      text: nextShot === 0 ? `${cfg.feedback}${ZERO_SHOT}` : cfg.feedback,
      cls: cfg.cls,
    });
  };

  const { ref } = useCanvas<{ mode: ModeId; shot: number }>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);

      // the same room, untouched
      drawItem(ctx, 80, 96, 44, 58, { kind: 'bottle' });
      drawItem(ctx, 152, 110, 40, 44, { kind: 'cup' });
      drawItem(ctx, 222, 96, 50, 58, { kind: 'frame' });

      // three candidate lists; the active mode is the heavier frame
      MODES.forEach((m, i) => {
        drawList(ctx, PX, PANELS[i].y, PW, PH, { lines: 3 });
        drawBox(ctx, PX + PW / 2, PANELS[i].y + PH / 2, PW + 8, PH + 8, {
          color: m.color,
          weight: s.mode === m.id ? 3 : 2,
          dashed: s.mode !== m.id,
        });
      });
      drawPerson(ctx, 300, 120, 0.8, { role: 'searcher' });

      // plot frame
      ctx.save();
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(632, 214);
      ctx.lineTo(1006, 214);
      ctx.moveTo(632, 62);
      ctx.lineTo(632, 214);
      ctx.stroke();
      ctx.restore();

      // three illustrative curves
      MODES.forEach((m) => {
        const on = s.mode === m.id;
        ctx.save();
        ctx.globalAlpha = on ? 1 : 0.45;
        ctx.beginPath();
        m.curve.forEach((v, i) => {
          const x = XS[i];
          const y = yOf(v);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = m.color;
        ctx.lineWidth = on ? 3 : 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
      });

      // shots ticks
      XS.forEach((x, i) => {
        ctx.save();
        ctx.strokeStyle = COLORS.axis;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, 214);
        ctx.lineTo(x, 219);
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, i === 3 ? '全部' : String([0, 5, 10][i]), x, 234, {
          color: COLORS.muted,
          size: 13,
          align: 'center',
        });
      });

      // current point marker
      const cur = MODES.find((m) => m.id === s.mode) ?? MODES[0];
      const px = XS[s.shot];
      const py = yOf(cur.curve[s.shot]);
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.accent;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = COLORS.room;
      ctx.stroke();
      ctx.restore();

      drawLabel(ctx, 'AP（示意）', 636, 56, { color: COLORS.muted, size: 13 });
      drawLegend(ctx, 640, 262, [
        { color: COLORS.thread, text: '全模型' },
        { color: COLORS.box, text: '提示微调' },
        { color: COLORS.accent, text: '只改写法' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip ${mode === m.id ? 'selected' : ''}`}
            aria-pressed={mode === m.id}
            onClick={() => apply(m.id, shot)}
          >
            {m.label}
          </button>
        ))}
        <label>
          少样本数量 <span className="val">{SHOT_LABELS[shot]}</span>
        </label>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={shot}
          onChange={(e) => apply(mode, Number(e.target.value))}
          aria-label="少样本数量"
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
