import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawPitch,
  drawPlayer,
  drawCard,
  drawRing,
  drawFrame,
  drawLink,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/pitchKit';

const W = 1080;
const H = 280;

// Four shortlisted candidates on the pitch; clicking one switches the target.
const CANDIDATES = [
  { x: 300, y: 120 },
  { x: 440, y: 96 },
  { x: 360, y: 180 },
  { x: 516, y: 166 },
];

type Feedback = { text: string; cls: string };

function feedbackFor(zoom: number): Feedback {
  const conf = 0.35 + 0.6 * zoom;
  if (conf >= 0.75) {
    return { text: `走近后确认：是他，判定分 ${conf.toFixed(2)}。`, cls: 'good' };
  }
  if (conf >= 0.45) {
    return { text: `还没看清：分 ${conf.toFixed(2)}，再近一点。`, cls: '' };
  }
  return { text: `远处看着像，其实不是：分 ${conf.toFixed(2)}。`, cls: 'bad' };
}

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ zoom: 0, pick: 0 });
  const [zoom, setZoom] = useState(0);
  const [pick, setPick] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({
    text: '还没走近：只凭远处印象判断。',
    cls: '',
  });

  const draw = (ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    const target = CANDIDATES[s.pick];
    const conf = 0.35 + 0.6 * s.zoom;
    const zone = conf >= 0.75 ? 'good' : conf >= 0.45 ? 'mid' : 'bad';
    const frameColor = zone === 'good' ? COLORS.good : zone === 'mid' ? COLORS.box : COLORS.bad;

    clearScene(ctx, W, H);
    drawPitch(ctx, 40, 46, 580, 196, { rows: 4, cols: 8 });

    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(640, 46);
    ctx.lineTo(640, 242);
    ctx.stroke();
    ctx.restore();

    drawPlayer(ctx, 214, 74, 1.2, { kind: 'stand', dim: true });
    drawPlayer(ctx, 556, 210, 1.2, { kind: 'run', dim: true });

    CANDIDATES.forEach((p, i) => {
      drawPlayer(ctx, p.x, p.y, 1.5, { kind: i % 2 ? 'run' : 'stand', highlight: i === s.pick });
      drawRing(ctx, p.x, p.y - 2, 26, { color: COLORS.ring, weight: i === s.pick ? 4 : 2 });
    });

    drawCard(ctx, 58, 86, 92, 86, { lines: 3, active: 1 });
    drawLink(ctx, [150, 129], [target.x, target.y - 2], { active: true });

    const fw = 190 + (52 - 190) * s.zoom;
    const fh = 132 + (68 - 132) * s.zoom;
    const fy = target.y - 2;
    drawFrame(ctx, target.x, fy, fw, fh, { color: frameColor, weight: 3 });

    // judged: tick when confident, cross when the far-away guess is wrong
    const mx = target.x + fw / 2 - 8;
    const my = fy - fh / 2 - 8;
    ctx.save();
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (zone === 'good') {
      ctx.beginPath();
      ctx.moveTo(mx - 9, my);
      ctx.lineTo(mx - 3, my + 7);
      ctx.lineTo(mx + 8, my - 8);
      ctx.stroke();
    } else if (zone === 'bad') {
      ctx.beginPath();
      ctx.moveTo(mx - 7, my - 7);
      ctx.lineTo(mx + 7, my + 7);
      ctx.moveTo(mx + 7, my - 7);
      ctx.lineTo(mx - 7, my + 7);
      ctx.stroke();
    }
    ctx.restore();

    // how much the confirmation relies on the image vs. on the card
    const imgW = 0.78 - 0.3 * s.zoom;
    const txtW = 0.32 + 0.54 * s.zoom;
    const bar = (y: number, v: number, color: string) => {
      ctx.fillStyle = 'rgba(207,220,208,0.55)';
      ctx.fillRect(700, y, 300, 20);
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(700, y, 300, 20);
      ctx.fillStyle = color;
      ctx.fillRect(702, y + 2, 296 * clamp(v, 0, 1), 16);
    };
    bar(84, imgW, COLORS.box);
    bar(134, txtW, COLORS.fuse);

    drawLabel(ctx, '判定分', 660, 198, { color: COLORS.muted, size: 13 });
    drawLabel(ctx, conf.toFixed(2), 722, 202, { color: frameColor, size: 24, bold: true });

    drawLegend(ctx, 660, 250, [
      { color: COLORS.box, text: '图像权重' },
      { color: COLORS.fuse, text: '文本权重' },
      { color: COLORS.ring, text: '候选苗子' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  const onZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.zoom = v;
    setZoom(v);
    setFeedback(feedbackFor(v));
  };

  const onPick = (i: number) => {
    stateRef.current.pick = i;
    setPick(i);
    setFeedback(feedbackFor(stateRef.current.zoom));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          走近程度 <span className="val">{zoom.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(zoom * 100)}
          onChange={onZoom}
          aria-label="走近程度"
        />
        {CANDIDATES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`chip${pick === i ? ' selected' : ''}`}
            onClick={() => onPick(i)}
          >
            苗子 {i + 1}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
