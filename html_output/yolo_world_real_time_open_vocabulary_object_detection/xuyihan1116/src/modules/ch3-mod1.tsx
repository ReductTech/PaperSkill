import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLabel,
  drawLegend,
  drawMeter,
  drawRoster,
  useCanvas,
} from '../lib/classKit';

// §3 module: prompt-then-detect. step 0 = online vocabulary (text re-encoded per image),
// step 1 = the vocabulary encoded once and locked into a frame, step 2 = re-parameterized,
// encoder disconnected, one direct path. The per-image cost is RELATIVE and illustrative.

const W = 1080;
const H = 280;

const PER_IMAGE = [1.0, 0.62, 0.18];
const NAMES = ['小红', '小明', '小豆'];

const FB = [
  { text: '在线词表：每来一张图都要重新读一遍提示。', cls: '' },
  { text: '名单编码一次，得到离线词表。', cls: '' },
  { text: '把词表重参数化进层权重：之后每张图都不用再编码文本，所以才能实时。', cls: 'good' },
];

const SHEET = { x: 56, y: 54, w: 112, h: 96 };
const ENC = { x: 232, y: 66, w: 118, h: 78 };
const DET = { x: 450, y: 66, w: 122, h: 78 };
const VOC = { x: 240, y: 186, w: 108, h: 56 };

type Pt = [number, number];

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  weight: number,
  dashed: boolean
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = COLORS.board2;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.stroke();
  ctx.restore();
}

function polyArrow(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  color: string,
  opts: { weight?: number; dashed?: boolean; alpha?: number } = {}
): void {
  const weight = opts.weight ?? 2.5;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = weight;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (opts.dashed) ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(b[0], b[1]);
  ctx.lineTo(b[0] - 10 * Math.cos(ang - 0.42), b[1] - 10 * Math.sin(ang - 0.42));
  ctx.lineTo(b[0] - 10 * Math.cos(ang + 0.42), b[1] - 10 * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const Ch3Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: FB[0].text, cls: FB[0].cls });

  const { ref } = useCanvas<{ step: number }>((ctx, _time, s) => {
    const st = s.step;
    clearScene(ctx, W, H);

    // the user's prompt, written once on the sheet
    drawRoster(ctx, SHEET.x, SHEET.y, SHEET.w, SHEET.h, { lines: NAMES.length, labels: NAMES });

    // sheet -> encoder: read on every image (red), read once (amber), disconnected (muted)
    if (st === 0) polyArrow(ctx, [[SHEET.x + SHEET.w + 2, 102], [ENC.x - 4, 102]], COLORS.bad, { dashed: true });
    else if (st === 1) polyArrow(ctx, [[SHEET.x + SHEET.w + 2, 102], [ENC.x - 4, 102]], COLORS.book, { weight: 3 });
    else polyArrow(ctx, [[SHEET.x + SHEET.w + 2, 102], [ENC.x - 4, 102]], COLORS.muted, { dashed: true });

    // the text encoder: live at 0/1, disconnected at 2
    drawBox(ctx, ENC.x, ENC.y, ENC.w, ENC.h, st === 2 ? COLORS.muted : COLORS.name, st === 2 ? 2 : 2.5, st === 2);
    drawLabel(ctx, '编码器', ENC.x + ENC.w / 2, ENC.y - 8, {
      color: st === 2 ? COLORS.chalkDim : COLORS.chalk,
      size: 15,
      align: 'center',
    });
    if (st === 2) {
      // the disconnected stub, cut short of the box
      ctx.save();
      ctx.strokeStyle = COLORS.chalkDim;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(ENC.x + ENC.w * 0.3, ENC.y + ENC.h * 0.5);
      ctx.lineTo(ENC.x + ENC.w * 0.7, ENC.y + ENC.h * 0.5);
      ctx.stroke();
      ctx.restore();
    }

    // encoder -> detector: the per-image text path
    if (st === 2) polyArrow(ctx, [[ENC.x + ENC.w + 2, 105], [DET.x - 4, 105]], COLORS.muted, { dashed: true });
    else polyArrow(ctx, [[ENC.x + ENC.w + 2, 105], [DET.x - 4, 105]], COLORS.name);

    drawBox(ctx, DET.x, DET.y, DET.w, DET.h, COLORS.name, 2.5, false);
    drawLabel(ctx, '检测器', DET.x + DET.w / 2, DET.y - 8, { color: COLORS.chalk, size: 15, align: 'center' });

    // per-image re-encoding loop (online vocabulary) — faded once the list is cached
    if (st < 2) {
      polyArrow(
        ctx,
        [
          [DET.x + DET.w * 0.5, DET.y + DET.h + 2],
          [DET.x + DET.w * 0.5, 164],
          [ENC.x + ENC.w * 0.5, 164],
          [ENC.x + ENC.w * 0.5, ENC.y + ENC.h + 2],
        ],
        COLORS.bad,
        { weight: 2, dashed: true, alpha: st === 1 ? 0.35 : 1 }
      );
    }

    // the offline vocabulary: encoded once, locked into a frame
    if (st > 0) {
      drawRoster(ctx, VOC.x + 4, VOC.y + 4, VOC.w - 8, VOC.h - 8, { lines: 2, locked: true });
      if (st === 1) {
        polyArrow(ctx, [[ENC.x + ENC.w * 0.5, ENC.y + ENC.h + 2], [ENC.x + ENC.w * 0.5, VOC.y + 2]], COLORS.book, { weight: 3 });
      } else {
        polyArrow(ctx, [[ENC.x + ENC.w * 0.5, ENC.y + ENC.h + 2], [ENC.x + ENC.w * 0.5, VOC.y + 2]], COLORS.muted, { dashed: true, weight: 2 });
        // re-parameterized: one direct path from the locked vocabulary to the detector
        polyArrow(ctx, [[VOC.x + VOC.w + 2, VOC.y + VOC.h * 0.5], [DET.x - 4, DET.y + DET.h * 0.5]], COLORS.fast, { weight: 3.5 });
      }
    }

    // how long one image takes — relative, illustrative only
    drawMeter(ctx, 660, 96, 340, 28, PER_IMAGE[st], { direction: 'down', label: '每图耗时（示意）' });

    drawLegend(ctx, 660, 250, [
      { color: COLORS.bad, text: '在线回路' },
      { color: COLORS.book, text: '离线词表' },
      { color: COLORS.fast, text: '直接通路' },
    ]);
  }, W, H, stateRef);

  const sync = (s: number) => {
    stateRef.current.step = s;
    setStep(s);
    setFb(FB[s]);
  };
  const move = (delta: number) => {
    sync(Math.max(0, Math.min(FB.length - 1, stateRef.current.step + delta)));
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="chip" onClick={() => move(-1)}>
          上一步
        </button>
        <button type="button" className="chip" onClick={() => move(1)}>
          下一步
        </button>
        <button type="button" className="chip" onClick={() => sync(0)}>
          重置
        </button>
        <label>
          每图相对耗时 <span className="val">×{PER_IMAGE[step].toFixed(2)}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch3Mod1;
