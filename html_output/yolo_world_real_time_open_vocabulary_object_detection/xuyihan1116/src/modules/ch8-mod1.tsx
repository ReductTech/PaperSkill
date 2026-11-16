import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawLabel, drawLegend, useCanvas, clamp } from '../lib/classKit';

// Module 8.1 — online vocabulary cap M + pre-training data.
// One dominant operation: the `m` slider (8-160, default 80). The visible roster rows
// grow with m and the illustrative AP curve moves. The measured data ablation and the
// pseudo-label numbers live in the .hotspot-info panel below — the curve is NOT data.

const W = 1080;
const H = 280;

const ROSTER = { x: 44, y: 46, w: 552, h: 196 };
const PANEL = { x: 660, y: 56, w: 372, h: 176 };
const MAX_ROWS = 24;

/** Illustrative only: rises with M, peaks near the paper default and flattens after 120. */
const apTrend = (m: number): number =>
  24 + 10.8 * (1 - Math.exp(-m / 30)) - 2.5 * Math.pow(Math.max(0, (m - 80) / 80), 1.3);

const pxOf = (m: number): number => PANEL.x + ((m - 8) / 152) * PANEL.w;
const pyOf = (ap: number): number => PANEL.y + PANEL.h - ((ap - 24) / 11) * PANEL.h;

/** The online vocabulary sheet: two columns of twelve lines, filled up to min(m, 24). */
function drawRosterList(ctx: CanvasRenderingContext2D, m: number): void {
  const { x, y, w, h } = ROSTER;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = COLORS.roster;
  ctx.fill();
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = COLORS.book;
  ctx.fillRect(x, y, 5, h);
  ctx.globalAlpha = 1;

  const visible = Math.min(m, MAX_ROWS);
  const rowsPerCol = 12;
  const rowH = 15.2;
  for (let j = 0; j < MAX_ROWS; j += 1) {
    const colIdx = j < rowsPerCol ? 0 : 1;
    const row = j % rowsPerCol;
    const lx = x + 18 + colIdx * 262;
    const ly = y + 18 + row * rowH;
    const filled = j < visible;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 234, ly);
    ctx.strokeStyle = filled ? COLORS.ink : COLORS.axis;
    ctx.globalAlpha = filled ? 0.8 : 0.35;
    ctx.lineWidth = filled ? 2 : 1.4;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // the sheet holds 24 lines; beyond that the list keeps going
  if (m > MAX_ROWS) {
    ctx.fillStyle = COLORS.ink;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(x + w - 32 + i * 9, y + h - 14, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [m, setM] = useState(80);
  const stateRef = useRef<{ m: number }>({ m: 80 });

  const draw = (ctx: CanvasRenderingContext2D, time: number, s: { m: number }): void => {
    clearScene(ctx, W, H);
    drawRosterList(ctx, s.m);

    // the AP panel (schematic curve, not measured data)
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    ctx.globalAlpha = 0.22;
    for (let i = 1; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(PANEL.x, PANEL.y + (PANEL.h / 3) * i);
      ctx.lineTo(PANEL.x + PANEL.w, PANEL.y + (PANEL.h / 3) * i);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = COLORS.name;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let v = 8; v <= 160; v += 2) {
      const x = pxOf(v);
      const y = pyOf(apTrend(v));
      if (v === 8) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // the paper default: reference line at M = 80
    const rx = pxOf(80);
    ctx.save();
    ctx.strokeStyle = COLORS.chalkDim;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(rx, PANEL.y);
    ctx.lineTo(rx, PANEL.y + PANEL.h);
    ctx.stroke();
    ctx.restore();
    drawLabel(ctx, '论文默认', rx + 8, PANEL.y + PANEL.h - 8, { color: COLORS.book, size: 12 });

    // current point + its drop line
    const cx = pxOf(s.m);
    const cy = pyOf(apTrend(s.m));
    ctx.save();
    ctx.strokeStyle = COLORS.chalkDim;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, PANEL.y + PANEL.h);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.book;
    ctx.fill();
    ctx.strokeStyle = COLORS.chalk;
    ctx.lineWidth = 2;
    ctx.stroke();

    drawLabel(ctx, 'AP 示意', PANEL.x + 4, PANEL.y - 14, { color: COLORS.chalkDim, size: 13 });
    drawLegend(ctx, PANEL.x, 262, [
      { color: COLORS.name, text: '示意曲线' },
      { color: COLORS.book, text: '当前上限' },
      { color: COLORS.chalkDim, text: '参考线' },
    ]);
  };

  const { ref } = useCanvas<{ m: number }>(draw, W, H, stateRef);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = clamp(Number(e.target.value) || 8, 8, 160);
    stateRef.current.m = v;
    setM(v);
  };

  const fb =
    m < 60
      ? { text: `上限 ${m}：名单偏短，正样本容易被裁掉。`, cls: '' }
      : m <= 110
      ? { text: `上限 ${m}：够用且不挤（论文取 80）。`, cls: 'good' }
      : { text: `上限 ${m}：名单太长，无关名词之间开始互相干扰，示意曲线也转平。`, cls: 'bad' };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        aria-label="拖动在线词表上限，观察名单长度与示意 AP 曲线"
      />
      <div className="ctrl">
        <label>
          词表上限 M <span className="val">{m}</span>
        </label>
        <input
          type="range"
          min={8}
          max={160}
          step={1}
          value={m}
          onChange={onChange}
          aria-label="在线词表名词上限 M"
        />
        <span className="step-label">示意 AP {apTrend(m).toFixed(1)}</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <div className="hotspot-info">
        <p>
          <b>数据消融</b>（YOLO-World-S，LVIS 零样本 Fixed AP）：O365 <b>23.5</b> → 加 GQA{' '}
          <b>31.9</b> → 加 GoldG <b>32.5</b> → 加 CC3M† <b>33.0</b>。
        </p>
        <p>
          <b>伪标注</b>：CC3M† 是 <b>24.6 万图 / 82.1 万伪框</b>——先抽名词，再用 GLIP 打伪框，
          最后经 CLIP 相关性 + NMS 过滤，不是原始 CC3M。
        </p>
        <p>
          <b>读图提醒</b>：右侧曲线只是示意，论文只给了上面几个离散的数据消融点，
          并没有「上限 M → AP」的实测扫描。
        </p>
      </div>
    </div>
  );
};

export default Ch8Mod1;
