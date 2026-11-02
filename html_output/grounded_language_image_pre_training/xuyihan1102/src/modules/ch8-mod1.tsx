// Chapter 8.1: the whole chain, spread out and clickable.
// Four parts — visual trunk, deep fusion, alignment score, loss — plus a
// detection / grounding / both chip row. Clicking a part moves the orange ring,
// re-colours the active path and replaces the fixed detail panel.
import React, { useRef, useState } from 'react';
import {
  COLORS,
  clearScene,
  drawItem,
  drawLabel,
  drawLegend,
  drawList,
  useCanvas,
} from '../lib/roomKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const TWO_PI = Math.PI * 2;

type PartId = 'enc' | 'fuse' | 'score' | 'loss';
type Task = 'det' | 'ground' | 'both';
type Tone = 'info' | 'good' | 'aux';

interface Part {
  id: PartId;
  name: string;
  input: string;
  output: string;
  note: string;
}

const ORDER: PartId[] = ['enc', 'fuse', 'score', 'loss'];

const PARTS: Part[] = [
  {
    id: 'enc',
    name: '视觉主干',
    input: '房间图像',
    output: '区域特征 O',
    note: 'Swin 主干加 DyHead 检测头，把每个候选区域编码成 N 条视觉特征。',
  },
  {
    id: 'fuse',
    name: '深度融合',
    input: 'O 与 P',
    output: '语言感知特征',
    note: '最后几层用 X-MHA 让视觉和语言交换上下文，再各自更新；不做就退化成晚期融合。',
  },
  {
    id: 'score',
    name: '对齐分',
    input: 'O 与 P',
    output: 'N×M 分数',
    note: '每个区域与每个词元点积，分数矩阵的列数就是词元数。',
  },
  {
    id: 'loss',
    name: '损失',
    input: '分数与真值',
    output: '训练信号',
    note: '对齐损失按词元算，定位损失按框算，两项一起回传。',
  },
];

const FEEDBACK: Record<PartId, { text: string; tone: Tone }> = {
  enc: { text: '视觉主干 + DyHead：出区域特征 O。', tone: 'info' },
  fuse: { text: 'X-MHA 深度融合：O 和 P 在最后几层互相更新。', tone: 'aux' },
  score: { text: '对齐分：每个区域与每个词元点积，得到 N×M。', tone: 'good' },
  loss: { text: '损失：对齐损失按词元算，定位损失按框算。', tone: 'info' },
};

const START_COPY: { text: string; tone: Tone } = {
  text: '深度融合：最后几层互相看，视觉特征变成语言感知的。',
  tone: 'aux',
};

const TASKS: Array<{ id: Task; label: string; tag: string }> = [
  { id: 'det', label: '检测', tag: '80 类' },
  { id: 'ground', label: 'grounding', tag: '自由描述' },
  { id: 'both', label: '两者', tag: '两条' },
];

const NODE_W = 100;
const NODE_H = 92;
const NODE_Y = 84;
const NODE_X: Record<PartId, number> = { enc: 200, fuse: 320, score: 440, loss: 560 };

const TONE_CLS: Record<Tone, string> = { info: '', good: 'good', aux: '' };

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function seg(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  weight: number,
  dashed: boolean
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.stroke();
  ctx.restore();
}

function head(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-7, 4);
  ctx.lineTo(-7, -4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  id: PartId,
  cx: number,
  cy: number,
  time: number
): void {
  if (id === 'enc') {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.rect(cx - 22 + i * 4, cy - 18 + i * 5, 26, 20);
      ctx.fillStyle = COLORS.item;
      ctx.fill();
      ctx.strokeStyle = COLORS.muted;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else if (id === 'fuse') {
    const pulse = 0.5 + 0.5 * Math.sin((time / 360) * TWO_PI);
    seg(ctx, cx - 24, cy - 9, cx + 20, cy - 9, COLORS.aux, 2 + pulse, false);
    head(ctx, cx + 24, cy - 9, 0, COLORS.aux);
    seg(ctx, cx + 24, cy + 9, cx - 20, cy + 9, COLORS.aux, 2 + pulse, false);
    head(ctx, cx - 24, cy + 9, Math.PI, COLORS.aux);
  } else if (id === 'score') {
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        ctx.beginPath();
        ctx.arc(cx - 21 + c * 14, cy - 14 + r * 14, 4, 0, TWO_PI);
        ctx.fillStyle = r === 0 && c < 2 ? COLORS.thread : COLORS.axis;
        ctx.fill();
      }
    }
  } else {
    for (let i = 0; i < 3; i += 1) {
      const h = 8 + i * 6;
      ctx.fillStyle = COLORS.box;
      ctx.fillRect(cx - 20 + i * 14, cy + 18 - h, 9, h);
    }
  }
}

function drawDetail(
  ctx: CanvasRenderingContext2D,
  id: PartId,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number
): void {
  const cx = x + w / 2;
  const cy = y + h / 2 + 6;
  if (id === 'enc') {
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.rect(cx - 92 + i * 10, cy - 52 + i * 12, 70, 52);
      ctx.fillStyle = COLORS.item;
      ctx.fill();
      ctx.strokeStyle = COLORS.muted;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    head(ctx, x + w - 26, cy, 0, COLORS.box);
    seg(ctx, cx + 74, cy, x + w - 30, cy, COLORS.box, 2.5, false);
  } else if (id === 'fuse') {
    const pulse = 0.5 + 0.5 * Math.sin((time / 360) * TWO_PI);
    seg(ctx, cx - 96, cy - 26, cx + 84, cy - 26, COLORS.aux, 3 + pulse * 2, false);
    head(ctx, cx + 96, cy - 26, 0, COLORS.aux);
    seg(ctx, cx + 96, cy + 26, cx - 84, cy + 26, COLORS.aux, 3 + pulse * 2, false);
    head(ctx, cx - 96, cy + 26, Math.PI, COLORS.aux);
    for (const u of [((time / 900) % 1), 1 - ((time / 900) % 1)]) {
      ctx.beginPath();
      ctx.arc(cx - 96 + 192 * u, cy + (u < 0.5 ? 26 : -26), 4, 0, TWO_PI);
      ctx.fillStyle = COLORS.aux;
      ctx.fill();
    }
  } else if (id === 'score') {
    const cols = 5;
    const rows = 4;
    const cellW = 44;
    const cellH = 28;
    const sx = cx - (cols * cellW) / 2;
    const sy = cy - (rows * cellH) / 2;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        ctx.save();
        ctx.globalAlpha = r === 0 && c < 2 ? 0.75 : 0.4;
        ctx.fillStyle = r === 0 && c < 2 ? COLORS.thread : COLORS.axis;
        ctx.fillRect(sx + c * cellW + 1, sy + r * cellH + 1, cellW - 2, cellH - 2);
        ctx.restore();
      }
    }
  } else {
    const meter = (my: number, frac: number, color: string): void => {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(cx - 96, my, 192, 16);
      ctx.restore();
      ctx.fillStyle = color;
      ctx.fillRect(cx - 96, my, 192 * frac, 16);
    };
    meter(cy - 26, 0.62, COLORS.box);
    meter(cy + 14, 0.48, COLORS.tag);
  }
}

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [sel, setSel] = useState<PartId>('fuse');
  const [task, setTask] = useState<Task>('both');
  const [touched, setTouched] = useState(false);
  const stateRef = useRef({ sel: 'fuse' as PartId, task: 'both' as Task });

  const pickPart = (id: PartId) => {
    setSel(id);
    stateRef.current.sel = id;
    setTouched(true);
  };

  const pickTask = (id: Task) => {
    setTask(id);
    stateRef.current.task = id;
  };

  // the canvas hotspots mirror the DOM buttons so the chain itself is clickable
  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    for (const id of ORDER) {
      const nx = NODE_X[id];
      if (x >= nx && x <= nx + NODE_W && y >= NODE_Y && y <= NODE_Y + NODE_H) {
        pickPart(id);
        return;
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    const s = stateRef.current;
    clearScene(ctx, W, H);
    const selIndex = ORDER.indexOf(s.sel);

    // two inputs on the left: the room and the written list
    ctx.save();
    roundRect(ctx, 40, 44, 110, 74, 8);
    ctx.fillStyle = COLORS.paper;
    ctx.fill();
    ctx.strokeStyle = COLORS.rule;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    drawItem(ctx, 58, 62, 24, 34, { kind: 'bottle' });
    drawItem(ctx, 90, 72, 34, 40, { kind: 'box' });

    if (s.task === 'both') {
      drawList(ctx, 40, 150, 56, 86, { lines: 3 });
      drawList(ctx, 104, 150, 56, 86, { lines: 1, split: 0 });
    } else {
      drawList(ctx, 40, 150, 120, 86, {
        lines: s.task === 'det' ? 4 : 1,
        split: s.task === 'ground' ? 0 : undefined,
      });
    }

    // image -> visual trunk (always on)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(150, 81);
    ctx.quadraticCurveTo(176, 92, 200, 116);
    ctx.strokeStyle = COLORS.box;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    head(ctx, 200, 116, Math.atan2(116 - 92, 200 - 176), COLORS.box);

    // prompt -> deep fusion (on once the path reaches fusion)
    const promptOn = selIndex >= 1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(160, 198);
    ctx.quadraticCurveTo(250, 214, 320, 168);
    ctx.strokeStyle = promptOn ? COLORS.box : COLORS.axis;
    ctx.lineWidth = promptOn ? 3 : 2;
    if (!promptOn) ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.restore();
    head(
      ctx,
      320,
      168,
      Math.atan2(168 - 214, 320 - 250),
      promptOn ? COLORS.box : COLORS.axis
    );

    // the chain itself, left to right
    for (let i = 0; i < ORDER.length - 1; i += 1) {
      const fromX = NODE_X[ORDER[i]] + NODE_W;
      const toX = NODE_X[ORDER[i + 1]];
      const on = i < selIndex;
      seg(ctx, fromX, 130, toX, 130, on ? COLORS.box : COLORS.axis, on ? 3 : 2, !on);
      if (on) head(ctx, toX, 130, 0, COLORS.box);
    }

    for (const id of ORDER) {
      const x = NODE_X[id];
      const isSel = id === s.sel;
      const onPath = ORDER.indexOf(id) <= selIndex;
      ctx.save();
      roundRect(ctx, x, NODE_Y, NODE_W, NODE_H, 10);
      ctx.fillStyle = COLORS.paper;
      ctx.fill();
      if (isSel) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = COLORS.accent;
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = isSel ? COLORS.accent : onPath ? COLORS.box : COLORS.rule;
      ctx.lineWidth = isSel ? 3 : onPath ? 2.5 : 1.5;
      ctx.stroke();
      ctx.restore();
      if (isSel) {
        ctx.save();
        roundRect(ctx, x - 6, NODE_Y - 6, NODE_W + 12, NODE_H + 12, 14);
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      drawGlyph(ctx, id, x + NODE_W / 2, NODE_Y + 42, time);
    }

    // fixed detail panel on the right (the text lives in the DOM panel below)
    ctx.save();
    roundRect(ctx, 700, 44, 340, 200, 12);
    ctx.fillStyle = COLORS.paper;
    ctx.fill();
    ctx.strokeStyle = COLORS.rule;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    drawDetail(ctx, s.sel, 700, 44, 340, 200, time);

    const part = PARTS.find((p) => p.id === s.sel) as Part;
    const taskInfo = TASKS.find((t) => t.id === s.task) as { tag: string };
    drawLabel(ctx, part.name, 708, 34, { color: COLORS.ink, size: 15, bold: true });
    drawLabel(ctx, taskInfo.tag, 44, 34, { color: COLORS.muted, size: 15 });

    drawLegend(ctx, 40, 262, [
      { color: COLORS.box, text: '激活路径' },
      { color: COLORS.accent, text: '选中' },
      { color: COLORS.aux, text: '融合' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  const part = PARTS.find((p) => p.id === sel) as Part;
  const fb = touched ? FEEDBACK[sel] : START_COPY;
  const style =
    fb.tone === 'aux'
      ? { color: 'var(--paper-aux)', borderLeftColor: 'var(--paper-aux)' }
      : undefined;

  return (
    <div>
      <canvas ref={ref} width={W} height={H} id={`cv-${chapterId}-${moduleId}`} onClick={onCanvasClick} style={{ cursor: 'pointer' }} />
      <div className="ctrl">
        <div className="chip-row">
          {PARTS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip ${sel === p.id ? 'selected' : ''}`}
              onClick={() => pickPart(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="chip-row">
          {TASKS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${task === t.id ? 'selected' : ''}`}
              onClick={() => pickTask(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label>
          当前部件 <span className="val">{ORDER.indexOf(sel) + 1}/4</span>
        </label>
      </div>
      <div className="hotspot-info">
        <div>
          <b>{part.name}</b>：{part.input} → {part.output}
        </div>
        <div>{part.note}</div>
      </div>
      <div className={`feedback ${TONE_CLS[fb.tone]}`} style={style}>
        {fb.text}
      </div>
    </div>
  );
};

export default Ch8Mod1;
