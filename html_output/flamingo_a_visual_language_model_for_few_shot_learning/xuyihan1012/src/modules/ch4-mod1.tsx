import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  clamp,
  drawChannelStrip,
  drawDeck,
  drawLabel,
  drawLegend,
  drawLevelMeter,
  drawSignalPath,
  useCanvas,
} from '../lib/consoleKit';

// §4 module (1080x280): switch between the three conditioning architectures and compare
// the aggregate score, trainable parameters and step time of Table 3 row (iv) (E23).
// The chain highlight moves with the mode: interleaved between frozen LM layers (gated),
// stacked above them (vanilla), or grafted after the frozen stack (grafting).

const W = 1080;
const H = 280;

type Mode = 'gated' | 'vanilla' | 'grafting';

interface ModeSpec {
  id: Mode;
  label: string;
  /** Evidence values, Table 3 row (iv): trainable params (B) / step time (s) / DEV Overall. */
  params: number;
  stepTime: number;
  overall: number;
}

const MODES: ModeSpec[] = [
  { id: 'gated', label: 'GATED XATTN-DENSE', params: 3.2, stepTime: 1.74, overall: 70.7 },
  { id: 'vanilla', label: 'VANILLA XATTN', params: 2.4, stepTime: 1.16, overall: 66.9 },
  { id: 'grafting', label: 'GRAFTING', params: 3.3, stepTime: 1.74, overall: 63.1 },
];

const FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  gated: {
    text: 'GATED XATTN-DENSE：总体得分 70.7，但可训练参数 3.2B、单步 1.74s，是三种里最贵的。',
    cls: 'good',
  },
  vanilla: { text: 'VANILLA XATTN：单步只要 1.16s、参数 2.4B，但总体得分降到 66.9。', cls: '' },
  grafting: {
    text: 'GRAFTING：把新层堆在冻结 LM 之后，总体得分只有 63.1，是三种里最差的。',
    cls: 'bad',
  },
};

function specOf(mode: Mode): ModeSpec {
  return MODES.find((m) => m.id === mode) ?? MODES[0];
}

/** Cost ranking among the three reported rows: cheapest = green, middle = blue, priciest = red. */
function costColor(values: number[], v: number): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (v <= min + 1e-9) return COLORS.good;
  if (v >= max - 1e-9) return COLORS.bad;
  return COLORS.route;
}

/**
 * One comparison bar: the current mode's value in its semantic color with the bold purple
 * outline of the active mode, plus axis-coloured ticks for the other two reported rows.
 */
function drawCompareBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  color: string,
  ghosts: number[],
  caption: string
): void {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = COLORS.axis;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = COLORS.axis;
  ctx.strokeRect(x, y, w, h);

  const vw = clamp(value, 0, 1) * (w - 3);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1.5, y + 1.5, vw, h - 3);
  // The active mode is marked with a bold purple outline (theme: adapter layers are purple).
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.aux;
  ctx.strokeRect(x + 1.5, y + 1.5, Math.max(vw, 2), h - 3);

  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.axis;
  ghosts.forEach((g) => {
    const gx = x + 1.5 + clamp(g, 0, 1) * (w - 3);
    ctx.beginPath();
    ctx.moveTo(gx, y - 5);
    ctx.lineTo(gx, y + h + 5);
    ctx.stroke();
  });

  drawLabel(ctx, caption, Math.min(x + 6 + vw + 10, x + w - 44), y + h / 2 + 5, {
    color: COLORS.ink,
    size: 13,
  });
}

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<Mode>('gated');
  const stateRef = useRef<{ mode: Mode }>({ mode: 'gated' });
  const spec = specOf(mode);
  const feedback = FEEDBACK[mode];

  const { ref } = useCanvas<typeof stateRef.current>(
    (ctx, time, s) => {
      clearScene(ctx, W, H);
      const current = specOf(s.mode);

      // ---- signal chain (40-560): vision encoder -> channel strips -> frozen LM -> output ----
      drawDeck(ctx, 78, 128, 28, { spin: time / 4000, frozen: true, label: '视觉输入' });

      ctx.fillStyle = COLORS.deck;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(230, 70, 200, 116);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.platter;
      ctx.strokeRect(230, 70, 200, 116);
      // frozen LM layers
      for (let i = 1; i <= 6; i += 1) {
        const ly = 70 + (116 / 7) * i;
        ctx.beginPath();
        ctx.moveTo(236, ly);
        ctx.lineTo(424, ly);
        ctx.stroke();
      }
      drawLabel(ctx, '冻结 LM', 330, 202, { color: COLORS.muted, size: 13, align: 'center' });

      // base route (inactive) and the active segments of the current mode
      drawSignalPath(ctx, [[106, 128], [230, 128]], { active: false });
      drawSignalPath(ctx, [[430, 128], [486, 128]], { active: false });
      drawSignalPath(ctx, [[106, 128], [230, 128]], { active: true });
      drawSignalPath(ctx, [[430, 128], [486, 128]], { active: true });

      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = COLORS.aux;
      if (s.mode === 'gated') {
        // inserted between the frozen LM layers
        ctx.fillRect(256, 74, 148, 88);
        ctx.restore();
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLORS.aux;
        ctx.strokeRect(256, 74, 148, 88);
        [89, 121, 153].forEach((bandY) => {
          drawChannelStrip(ctx, 262, bandY, 136, 10, { count: 5, active: 5 });
        });
      } else if (s.mode === 'vanilla') {
        // plain cross-attention stacked above the frozen stack
        ctx.fillRect(256, 34, 148, 24);
        ctx.restore();
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLORS.aux;
        ctx.strokeRect(256, 34, 148, 24);
        drawChannelStrip(ctx, 262, 40, 136, 12, { count: 5, active: 5 });
        drawSignalPath(ctx, [[380, 128], [380, 58]], { active: true });
      } else {
        // grafted on top of the frozen stack, after it
        ctx.fillRect(432, 86, 36, 84);
        ctx.restore();
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLORS.aux;
        ctx.strokeRect(432, 86, 36, 84);
        drawChannelStrip(ctx, 438, 92, 24, 72, { count: 3, active: 3 });
      }

      // output meter of the chain
      drawLevelMeter(ctx, 486, 106, 44, 44, current.overall / 100, { direction: 'up' });

      // ---- comparison bars (620-1020): score / params / step time ----
      const scoreValues = MODES.map((m) => m.overall / 100);
      const paramsValues = MODES.map((m) => m.params / 4);
      const timeValues = MODES.map((m) => m.stepTime / 2);
      const colors = {
        score: s.mode === 'gated' ? COLORS.good : s.mode === 'vanilla' ? COLORS.route : COLORS.bad,
        params: costColor(MODES.map((m) => m.params), current.params),
        time: costColor(MODES.map((m) => m.stepTime), current.stepTime),
      };
      drawCompareBar(
        ctx,
        620,
        64,
        400,
        26,
        current.overall / 100,
        colors.score,
        scoreValues.filter((v) => Math.abs(v - current.overall / 100) > 1e-9),
        current.overall.toFixed(1)
      );
      drawCompareBar(
        ctx,
        620,
        126,
        400,
        26,
        current.params / 4,
        colors.params,
        paramsValues.filter((v) => Math.abs(v - current.params / 4) > 1e-9),
        `${current.params.toFixed(1)}B`
      );
      drawCompareBar(
        ctx,
        620,
        188,
        400,
        26,
        current.stepTime / 2,
        colors.time,
        timeValues.filter((v) => Math.abs(v - current.stepTime / 2) > 1e-9),
        `${current.stepTime.toFixed(2)}s`
      );

      drawLegend(ctx, 48, 262, [
        { color: COLORS.aux, text: '当前方案' },
        { color: COLORS.good, text: '更省或更高' },
        { color: COLORS.axis, text: '其他方案' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const pick = (next: Mode) => {
    stateRef.current.mode = next;
    setMode(next);
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip${mode === m.id ? ' selected' : ''}`}
              onClick={() => pick(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="val">
          总体得分 {spec.overall.toFixed(1)} · 可训练参数 {spec.params.toFixed(1)}B · 单步{' '}
          {spec.stepTime.toFixed(2)}s
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
