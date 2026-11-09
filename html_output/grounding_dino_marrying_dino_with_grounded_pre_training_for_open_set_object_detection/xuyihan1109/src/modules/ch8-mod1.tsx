import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawPitch,
  drawPlayer,
  drawFrame,
  drawMeter,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/pitchKit';

const W = 1080;
const H = 280;

type Mode = 'cls' | 'loc' | 'both';
type Feedback = { text: string; cls: string };

const MODE_FEEDBACK: Record<Mode, Feedback> = {
  cls: { text: '只管分类：位置会歪，框套不准。', cls: 'bad' },
  loc: { text: '只管定位：可能把空地圈得很准，但那不是人。', cls: 'bad' },
  both: { text: '两个都管：分类用 query 与文本的点积 + focal，定位用 L1 + GIoU。', cls: 'good' },
};

// Illustrative trade-off: λ = 1 sits at the minimum of the total loss,
// while the two terms slide against each other.
function losses(lambda: number): { cls: number; loc: number; total: number } {
  const a = Math.log10(lambda);
  const total = 0.45 + 0.2 * a * a;
  const share = 0.5 + 0.25 * a;
  return { cls: total * share, loc: total * (1 - share), total };
}

function drawCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s);
  ctx.lineTo(cx + s, cy + s);
  ctx.moveTo(cx + s, cy - s);
  ctx.lineTo(cx - s, cy + s);
  ctx.stroke();
  ctx.restore();
}

function drawOffset(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ring;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.ring;
  ctx.beginPath();
  ctx.arc(fromX, fromY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<{ lambda: number; mode: Mode }>({ lambda: 1, mode: 'both' });
  const [lambda, setLambda] = useState(1);
  const [mode, setMode] = useState<Mode>('both');
  const [feedback, setFeedback] = useState<Feedback>({
    text: '两项都在优化：既要圈对人，也要圈得准。',
    cls: '',
  });

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const s = stateRef.current;
    const { cls, loc, total } = losses(s.lambda);
    const norm = 0.65;

    clearScene(ctx, W, H);
    drawPitch(ctx, 40, 40, 580, 202, { rows: 4, cols: 8 });

    drawPlayer(ctx, 200, 100, 1.3, { kind: 'stand', dim: true });
    drawPlayer(ctx, 240, 205, 1.2, { kind: 'run', dim: true });
    drawPlayer(ctx, 455, 92, 1.2, { kind: 'stand', dim: true });
    drawPlayer(ctx, 330, 148, 1.6, { kind: 'run', highlight: true });

    if (s.mode === 'both') {
      // wrong person: a confident green frame on empty grass
      drawFrame(ctx, 505, 188, 74, 88, { color: COLORS.good, weight: 3 });
      drawCross(ctx, 505, 188, 9, COLORS.bad);
      // imprecise: the blue frame is offset from the player
      drawFrame(ctx, 330 + 40, 148 + 14, 64, 80, { color: COLORS.box, weight: 3 });
      drawOffset(ctx, 330, 148, 330 + 40, 148 + 14);
    } else if (s.mode === 'cls') {
      // classification is handled, but the position drifts
      const ox = 40 + 16 * Math.sin(time / 420);
      const oy = 14 + 8 * Math.sin(time / 330 + 1);
      drawFrame(ctx, 330 + ox, 148 + oy, 64, 80, { color: COLORS.box, weight: 3 });
      drawOffset(ctx, 330, 148, 330 + ox, 148 + oy);
    } else {
      // localization is handled: a precise, tight frame — on empty grass
      drawFrame(ctx, 505, 188, 54, 68, { color: COLORS.good, weight: 3 });
      drawCross(ctx, 505, 188, 8, COLORS.bad);
    }

    if (s.mode !== 'loc') {
      drawMeter(ctx, 700, 72, 340, 20, cls / norm, { direction: 'down' });
      drawLabel(ctx, '分类', 660, 86, { color: COLORS.muted, size: 13 });
    }
    if (s.mode !== 'cls') {
      drawMeter(ctx, 700, 120, 340, 20, loc / norm, { direction: 'down' });
      drawLabel(ctx, '定位', 660, 134, { color: COLORS.muted, size: 13 });
    }

    const activeTotal = s.mode === 'cls' ? cls : s.mode === 'loc' ? loc : total;
    ctx.fillStyle = 'rgba(207,220,208,0.55)';
    ctx.fillRect(700, 180, 340, 18);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(700, 180, 340, 18);
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(702, 182, 336 * clamp(activeTotal / norm, 0, 1), 14);
    ctx.restore();

    drawLegend(ctx, 660, 246, [
      { color: COLORS.good, text: '圈错人' },
      { color: COLORS.box, text: '圈歪' },
      { color: COLORS.ink, text: '总损失' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  const l = losses(lambda);
  const activeTotal = mode === 'cls' ? l.cls : mode === 'loc' ? l.loc : l.total;

  const onLambda = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value) / 100;
    const v = Math.pow(10, -1 + 2 * t);
    stateRef.current.lambda = v;
    setLambda(v);
    setFeedback(MODE_FEEDBACK[stateRef.current.mode]);
  };

  const onMode = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback(MODE_FEEDBACK[m]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          定位权重 λ <span className="val">{lambda.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(((Math.log10(lambda) + 1) / 2) * 100)}
          onChange={onLambda}
          aria-label="定位权重 λ"
        />
        <button type="button" className={`chip${mode === 'cls' ? ' selected' : ''}`} onClick={() => onMode('cls')}>
          只看分类
        </button>
        <button type="button" className={`chip${mode === 'loc' ? ' selected' : ''}`} onClick={() => onMode('loc')}>
          只看定位
        </button>
        <button type="button" className={`chip${mode === 'both' ? ' selected' : ''}`} onClick={() => onMode('both')}>
          两个都看
        </button>
        <span className="val">分类 {l.cls.toFixed(2)}</span>
        <span className="val">定位 {l.loc.toFixed(2)}</span>
        <span className="val">总 {activeTotal.toFixed(2)}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod1;
