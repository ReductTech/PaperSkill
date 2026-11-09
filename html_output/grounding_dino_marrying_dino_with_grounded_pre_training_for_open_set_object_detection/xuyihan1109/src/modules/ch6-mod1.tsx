import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawCard,
  drawMeter,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/pitchKit';

const W = 1080;
const H = 280;

type Mode = 'sent' | 'word' | 'sub';

interface ModeInfo {
  chip: string;
  caption: string;
  score: number;
  links: number;
  fb: string;
  cls: string;
}

// Illustrative scores from the plan: 0.58 / 0.61 / 0.68.
const MODE_INFO: Record<Mode, ModeInfo> = {
  sent: {
    chip: '整句',
    caption: '整句一段',
    score: 0.58,
    links: 1,
    fb: '整句压成一个特征：细粒度信息丢了。',
    cls: 'bad',
  },
  word: {
    chip: '逐词',
    caption: '词级堆叠',
    score: 0.61,
    links: 6,
    fb: '关键词堆一起：无关类别之间会互相干扰。',
    cls: 'bad',
  },
  sub: {
    chip: '子句级',
    caption: '子句独立',
    score: 0.68,
    links: 0,
    fb: '子句级：每条独立，既保留逐词特征又不互相干扰。消融里换回词级写法，COCO 零样本 46.7 → 46.4，LVIS 16.1 → 15.6。',
    cls: 'good',
  },
};

const ORDER: Mode[] = ['sent', 'word', 'sub'];

const CARD_X = 44;
const CARD_Y = 38;
const CARD_W = 520;
const CARD_H = 180;
const ROWS = [84, 134, 184];
const COLS = [140, 300, 460];

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ mode: 'sub' as Mode });
  const [mode, setMode] = useState<Mode>('sub');
  const [feedback, setFeedback] = useState({ text: MODE_INFO.sub.fb, cls: MODE_INFO.sub.cls });

  const choose = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback({ text: MODE_INFO[m].fb, cls: MODE_INFO[m].cls });
  };

  const { ref } = useCanvas(
    (ctx) => {
      clearScene(ctx, W, H);
      const cur = stateRef.current.mode;
      const info = MODE_INFO[cur];

      drawLabel(ctx, info.caption, CARD_X, CARD_Y - 10, { size: 15, bold: true });

      if (cur === 'sent') {
        drawCard(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, { lines: 3, oneLine: true });
      } else {
        ctx.save();
        roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 3);
        ctx.fillStyle = COLORS.card;
        ctx.fill();
        ctx.strokeStyle = COLORS.line;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        if (cur === 'word') {
          // Cross-category attention: red dashed links run between unrelated names.
          const pairs: Array<[number, number, number, number]> = [
            [0, 0, 1, 1],
            [0, 1, 1, 2],
            [0, 2, 1, 0],
            [1, 0, 2, 1],
            [1, 1, 2, 2],
            [1, 2, 2, 0],
          ];
          ctx.save();
          ctx.globalAlpha = 0.75;
          ctx.strokeStyle = COLORS.bad;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          pairs.forEach(([r1, c1, r2, c2]) => {
            ctx.beginPath();
            ctx.moveTo(COLS[c1], ROWS[r1]);
            ctx.lineTo(COLS[c2], ROWS[r2]);
            ctx.stroke();
          });
          ctx.restore();
        } else {
          // Sub-sentence: one masked clause per line, nothing crosses between lines.
          ROWS.forEach((ry) => {
            ctx.save();
            roundRect(ctx, CARD_X + 12, ry - 22, CARD_W - 24, 44, 8);
            ctx.fillStyle = tint(COLORS.ring, 0.09);
            ctx.fill();
            ctx.strokeStyle = COLORS.ring;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
          });
        }

        ROWS.forEach((ry) => {
          COLS.forEach((cx) => {
            ctx.save();
            roundRect(ctx, cx - 60, ry - 13, 120, 26, 5);
            ctx.fillStyle = COLORS.card;
            ctx.fill();
            ctx.fillStyle = tint(COLORS.ring, cur === 'word' ? 0.2 : 0.1);
            ctx.fill();
            ctx.strokeStyle = cur === 'sub' ? COLORS.ring : COLORS.line;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
          });
        });
      }

      drawMeter(ctx, 700, 116, 300, 18, info.score, {});
      drawLabel(ctx, info.score.toFixed(2), 700, 104, { size: 22, bold: true });

      // Interference marks: more red crosses when unrelated names are glued together.
      if (info.links === 0) {
        ctx.save();
        ctx.strokeStyle = COLORS.good;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(704, 172);
        ctx.lineTo(710, 179);
        ctx.lineTo(722, 164);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        ctx.strokeStyle = COLORS.bad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < info.links; i += 1) {
          const mx = 706 + i * 30;
          ctx.beginPath();
          ctx.moveTo(mx - 5, 164);
          ctx.lineTo(mx + 5, 176);
          ctx.moveTo(mx + 5, 164);
          ctx.lineTo(mx - 5, 176);
          ctx.stroke();
        }
        ctx.restore();
      }

      drawLegend(ctx, 700, 248, [
        { color: COLORS.bad, text: '干扰线' },
        { color: COLORS.ring, text: '子句' },
        { color: COLORS.fuse, text: '整句块' },
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
        <label>文本表示</label>
        {ORDER.map((m) => (
          <button
            key={m}
            type="button"
            className={`chip ${mode === m ? 'selected' : ''}`}
            aria-pressed={mode === m}
            onClick={() => choose(m)}
          >
            {MODE_INFO[m].chip}
          </button>
        ))}
        <span className="val">{MODE_INFO[mode].score.toFixed(2)}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
