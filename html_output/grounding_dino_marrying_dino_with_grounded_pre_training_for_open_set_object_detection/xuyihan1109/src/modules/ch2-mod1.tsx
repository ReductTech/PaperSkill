import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPlayer,
  drawCard,
  drawRing,
  drawFrame,
  drawLink,
  drawMeter,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/pitchKit';

const W = 1080;
const H = 280;

type Phase = 'neck' | 'query' | 'head' | 'all';

interface PhaseInfo {
  chip: string;
  caption: string;
  score: number;
  fb: string;
  cls: string;
}

// Illustrative scores from the plan: 0.62 / 0.66 / 0.64 / 0.79.
const PHASES: Record<Phase, PhaseInfo> = {
  neck: {
    chip: 'neck 融合',
    caption: '看球读卡',
    score: 0.62,
    fb: 'neck 融合：边看球边读卡，特征先对齐一次。（GLIP 只做到这一步）',
    cls: '',
  },
  query: {
    chip: 'query 初始化',
    caption: '按需圈人',
    score: 0.66,
    fb: 'query 初始化：按需求先圈出苗子。（OV-DETR 只做到这一步）',
    cls: '',
  },
  head: {
    chip: 'head 融合',
    caption: '走近对卡',
    score: 0.64,
    fb: 'head 融合：确认阶段再对照一次卡。',
    cls: '',
  },
  all: {
    chip: '三个都接',
    caption: '三段全接',
    score: 0.79,
    fb: '三个环节都接上：tight fusion，特征在最该对齐的地方都对上了。',
    cls: 'good',
  },
};

const ORDER: Phase[] = ['neck', 'query', 'head', 'all'];

const SEGMENTS: Array<{ phase: 'neck' | 'query' | 'head'; color: string }> = [
  { phase: 'neck', color: COLORS.fuse },
  { phase: 'query', color: COLORS.ring },
  { phase: 'head', color: COLORS.confirm },
];

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

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ phase: 'neck' as Phase });
  const [phase, setPhase] = useState<Phase>('neck');
  const [feedback, setFeedback] = useState({ text: PHASES.neck.fb, cls: PHASES.neck.cls });

  const choose = (p: Phase) => {
    stateRef.current.phase = p;
    setPhase(p);
    setFeedback({ text: PHASES[p].fb, cls: PHASES[p].cls });
  };

  const { ref } = useCanvas(
    (ctx) => {
      clearScene(ctx, W, H);
      const cur = stateRef.current.phase;
      const segW = 190;
      const gap = 14;
      const y0 = 88;
      const segH = 92;

      SEGMENTS.forEach((seg, i) => {
        const x = 40 + i * (segW + gap);
        const on = cur === 'all' || cur === seg.phase;
        const tone = seg.color;

        ctx.save();
        roundRect(ctx, x, y0, segW, segH, 8);
        ctx.fillStyle = tint(tone, on ? 0.2 : 0.06);
        ctx.fill();
        ctx.lineWidth = on ? 3 : 2;
        ctx.strokeStyle = on ? tone : COLORS.axis;
        ctx.stroke();
        ctx.restore();

        if (on) {
          ctx.save();
          roundRect(ctx, x - 7, y0 - 7, segW + 14, segH + 14, 12);
          ctx.strokeStyle = COLORS.ring;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }

        if (seg.phase === 'neck') {
          drawCard(ctx, x + 18, y0 + 22, 44, 34, { lines: 2 });
          drawPlayer(ctx, x + 144, y0 + 64, 1, { kind: 'stand' });
          drawLink(ctx, [x + 64, y0 + 38], [x + 144, y0 + 52], { active: on, twoWay: true });
        } else if (seg.phase === 'query') {
          [x + 42, x + 96, x + 150].forEach((px, k) => {
            drawPlayer(ctx, px, y0 + 64, 1, { kind: 'stand' });
            if (k < 2) {
              drawRing(ctx, px, y0 + 56, 17, {
                color: on ? COLORS.ring : COLORS.axis,
                weight: on ? 3 : 2,
                dashed: !on,
              });
            }
          });
        } else {
          drawCard(ctx, x + 18, y0 + 20, 40, 30, { lines: 2 });
          drawPlayer(ctx, x + 128, y0 + 62, 1, { kind: 'stand' });
          drawFrame(ctx, x + 128, y0 + 50, 44, 50, {
            color: on ? COLORS.confirm : COLORS.axis,
            weight: on ? 3 : 2,
            dashed: !on,
          });
        }
      });

      const info = PHASES[cur];
      drawLabel(ctx, info.caption, 700, 50, { size: 17, bold: true });
      drawMeter(ctx, 700, 118, 300, 18, info.score, {});
      drawLabel(ctx, info.score.toFixed(2), 700, 106, { size: 22, bold: true });
      drawLegend(ctx, 40, 250, [
        { color: COLORS.fuse, text: '看球时' },
        { color: COLORS.ring, text: '圈人时' },
        { color: COLORS.confirm, text: '确认时' },
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
        <label>融合位置</label>
        {ORDER.map((p) => (
          <button
            key={p}
            type="button"
            className={`chip ${phase === p ? 'selected' : ''}`}
            aria-pressed={phase === p}
            onClick={() => choose(p)}
          >
            {PHASES[p].chip}
          </button>
        ))}
        <span className="val">{PHASES[phase].score.toFixed(2)}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <div className="hotspot-info">
        <div>
          <b>去掉某一处融合会掉多少</b>（Swin-T，只用 O365 训练）：完整版在 COCO 零样本 46.7 AP、LVIS 零样本 16.1 AP。
          去掉 encoder 阶段的融合后变成 45.8 / 13.1；换成静态 query 选择是 46.3 / 13.6；去掉 decoder 里的文本交叉注意力是 46.1 / 14.3。
          三处融合各管一段，掉哪一处都会掉点，其中 encoder 融合对 LVIS 影响最大。
        </div>
      </div>
    </div>
  );
};

export default Ch2Mod1;
