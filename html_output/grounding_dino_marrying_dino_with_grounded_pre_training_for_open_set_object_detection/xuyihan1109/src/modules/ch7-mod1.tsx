import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPitch,
  drawPlayer,
  drawRing,
  drawFrame,
  drawCard,
  drawLink,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/pitchKit';

// Module 7.1 — the whole chain, clickable. Four hotspots + a 检测 / REC chip pair.
// Selecting a part moves the orange ring, re-colours the active path and replaces the
// `.hotspot-info` detail panel. The DOM chips mirror the canvas hotspots 1:1.

const W = 1080;
const H = 280;

type Sel = 'backbone' | 'fuse' | 'query' | 'dec';
type Task = 'det' | 'rec';

const PARTS: Array<{ id: Sel; label: string; short: string }> = [
  { id: 'backbone', label: '视觉主干', short: '两个主干' },
  { id: 'fuse', label: 'feature enhancer', short: '图文增强' },
  { id: 'query', label: 'query 选择', short: '圈出苗子' },
  { id: 'dec', label: '跨模态 decoder', short: '逐个确认' },
];
const ORDER: Sel[] = ['backbone', 'fuse', 'query', 'dec'];
const PANEL = { y: 52, w: 180, h: 176, step: 240, x0: 90 };
const panelX = (i: number) => PANEL.x0 + i * PANEL.step;
const indexOf = (sel: Sel) => ORDER.indexOf(sel);

const FB: Record<Sel, { text: string; cls: string }> = {
  backbone: { text: '两个主干：图像出 X_I，文本出 X_T。', cls: '' },
  fuse: { text: 'feature enhancer：图文在 neck 先互相对齐。', cls: '' },
  query: { text: '语言引导的 query 选择：按分数取前 900 个位置。', cls: '' },
  dec: { text: '跨模态 decoder：每个候选一边看图一边看卡，最后出框和词。', cls: 'good' },
};

const DETAIL: Record<Sel, { input: string; output: string }> = {
  backbone: {
    input: '图像 + 需求卡上的文字',
    output: '图像特征 X_I（N_I×d）与文本特征 X_T（N_T×d）',
  },
  fuse: {
    input: 'X_I 与 X_T',
    output: '自注意力 + 双向交叉注意力对齐后的图文特征',
  },
  query: {
    input: '对齐后的图文特征',
    output: '每个图像 token 的匹配分，取前 900 个位置当 query',
  },
  dec: {
    input: 'query + 对齐后的图文特征',
    output: '检测出多个框和词，REC 只取分数最高的框',
  },
};

function drawPart(
  ctx: CanvasRenderingContext2D,
  i: number,
  s: { sel: Sel; task: Task },
  time: number
): void {
  const x = panelX(i);
  const y = PANEL.y;
  if (i === 0) {
    // image backbone + text backbone
    drawCard(ctx, x + 16, y + 46, 58, 66, { lines: 3, oneLine: s.task === 'rec' });
    drawPitch(ctx, x + 94, y + 30, 68, 100, { rows: 2, cols: 1, spots: [{ r: 0, c: 0 }] });
  } else if (i === 1) {
    // feature enhancer: card and pitch keep looking at each other
    drawCard(ctx, x + 14, y + 46, 54, 62, { lines: 3, oneLine: s.task === 'rec' });
    drawPitch(ctx, x + 102, y + 32, 64, 96, { rows: 2, cols: 1, spots: [{ r: 1, c: 0 }] });
    drawLink(ctx, [x + 68, y + 72], [x + 100, y + 72], {
      twoWay: true,
      active: s.sel === 'fuse',
    });
  } else if (i === 2) {
    // language-guided query selection: a few players get ringed
    const spots = [
      { r: 0, c: 0 },
      { r: 0, c: 2 },
      { r: 1, c: 2 },
    ];
    drawPitch(ctx, x + 18, y + 26, 144, 110, { rows: 2, cols: 3, spots });
    const cw = 144 / 3;
    const ch = 110 / 2;
    spots.forEach((p, k) => {
      const r = 13 + (s.sel === 'query' ? Math.sin(time / 240 + k) * 1.5 : 0);
      drawRing(ctx, x + 18 + (p.c + 0.5) * cw, y + 26 + (p.r + 0.5) * ch, r, {
        color: COLORS.ring,
        weight: s.sel === 'query' ? 3 : 2,
      });
    });
  } else {
    // cross-modality decoder: card held up while the frame tightens
    drawCard(ctx, x + 12, y + 40, 54, 66, { lines: 3, oneLine: s.task === 'rec' });
    drawPlayer(ctx, x + 126, y + 92, 0.95, { kind: 'stand' });
    drawFrame(ctx, x + 126, y + 86, 50, 60, {
      color: s.sel === 'dec' ? COLORS.confirm : COLORS.axis,
      weight: s.sel === 'dec' ? 3 : 2,
    });
    if (s.task === 'det') {
      drawFrame(ctx, x + 152, y + 100, 40, 46, {
        color: s.sel === 'dec' ? COLORS.confirm : COLORS.axis,
        weight: 2,
        dashed: true,
      });
    }
  }
}

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<{ sel: Sel; task: Task }>({ sel: 'fuse', task: 'det' });
  const [sel, setSel] = useState<Sel>('fuse');
  const [task, setTask] = useState<Task>('det');

  const pick = (next: Sel) => {
    stateRef.current.sel = next;
    setSel(next);
  };
  const pickTask = (next: Task) => {
    stateRef.current.task = next;
    setTask(next);
  };

  const draw = (ctx: CanvasRenderingContext2D, time: number, s: { sel: Sel; task: Task }) => {
    clearScene(ctx, W, H, '整条链');
    // connectors first: the active path is blue, the rest stays muted
    for (let i = 0; i < 3; i += 1) {
      const x1 = panelX(i) + PANEL.w + 6;
      const x2 = panelX(i + 1) - 6;
      const y = PANEL.y + PANEL.h / 2;
      const on = indexOf(s.sel) > i;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.strokeStyle = on ? COLORS.box : COLORS.axis;
      ctx.lineWidth = on ? 3 : 2;
      if (!on) ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y);
      ctx.lineTo(x2 - 9, y - 5);
      ctx.lineTo(x2 - 9, y + 5);
      ctx.closePath();
      ctx.fillStyle = on ? COLORS.box : COLORS.axis;
      ctx.fill();
      ctx.restore();
    }
    // four panels
    for (let i = 0; i < 4; i += 1) {
      const x = panelX(i);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, PANEL.y, PANEL.w, PANEL.h);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < 4; i += 1) drawPart(ctx, i, s, time);
    // the orange selection ring
    const idx = indexOf(s.sel);
    drawFrame(ctx, panelX(idx) + PANEL.w / 2, PANEL.y + PANEL.h / 2, PANEL.w + 16, PANEL.h + 16, {
      color: COLORS.ring,
      weight: 3,
    });
    // one short caption for the selected part
    drawLabel(ctx, PARTS[idx].short, panelX(idx) + 12, PANEL.y + 166, {
      color: COLORS.ink,
      size: 14,
      bold: true,
    });
    drawLegend(ctx, 40, 266, [
      { color: COLORS.fuse, text: '图文融合' },
      { color: COLORS.ring, text: '圈出苗子' },
      { color: COLORS.confirm, text: '确认框' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) * W) / rect.width;
    const cy = ((e.clientY - rect.top) * H) / rect.height;
    if (cy < PANEL.y || cy > PANEL.y + PANEL.h) return;
    for (let i = 0; i < 4; i += 1) {
      const x = panelX(i);
      if (cx >= x && cx <= x + PANEL.w) {
        pick(ORDER[i]);
        return;
      }
    }
  };

  const feedback = FB[sel];
  const detail = DETAIL[sel];
  const taskNote =
    task === 'det' ? '检测：卡上写类名，用句点连成一句。' : 'REC：卡上是一整句描述。';

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        <div className="chip-row">
          {PARTS.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`chip ${sel === p.id ? 'selected' : ''}`}
              onClick={() => pick(p.id)}
              aria-pressed={sel === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${task === 'det' ? 'selected' : ''}`}
            onClick={() => pickTask('det')}
            aria-pressed={task === 'det'}
          >
            检测
          </button>
          <button
            type="button"
            className={`chip ${task === 'rec' ? 'selected' : ''}`}
            onClick={() => pickTask('rec')}
            aria-pressed={task === 'rec'}
          >
            REC
          </button>
        </div>
        <span className="val">{PARTS[indexOf(sel)].short}</span>
      </div>
      <div className="hotspot-info">
        <b>{PARTS[indexOf(sel)].label}</b>　输入：{detail.input}；输出：{detail.output}。
        <div>{taskNote}</div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
