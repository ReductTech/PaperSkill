// Chapter 8.2: one chain, two entrances.
// The same list becomes "person. bicycle. car. …" for detection, or one free-form
// sentence for grounding — and the alignment matrix gains columns as the token count
// grows. Only the prompt changes; the parameters are shared.
import React, { useRef, useState } from 'react';
import { COLORS, clearScene, drawLabel, drawLegend, drawList, useCanvas } from '../lib/roomKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

type Task = 'det' | 'ground' | 'both';
type Tone = 'info' | 'good' | 'aux';

const PROMPT_TEXT: Record<Task, string> = {
  det: 'person. bicycle. car. …',
  ground: 'A woman holds a blow dryer, wearing protective goggles.',
  both: 'person. bicycle. car. …  ／  A woman holds a blow dryer, …',
};

const TOKENS: Record<Exclude<Task, 'both'>, number> = { det: 5, ground: 12 };

const COPY: Record<Task, { text: string; tone: Tone }> = {
  det: { text: '检测：清单就是 80 个类名用句点连起来。', tone: 'info' },
  ground: { text: 'grounding：清单是一句自由描述，词元多得多。', tone: 'good' },
  both: { text: '两者共用同一套参数：只是提示不同。', tone: 'aux' },
};

const TASK_LIST: Array<{ id: Task; label: string; tag: string }> = [
  { id: 'det', label: '检测', tag: '80 类拼接' },
  { id: 'ground', label: 'grounding', tag: '自由描述' },
  { id: 'both', label: '两者', tag: '两条并排' },
];

const TONE_CLS: Record<Tone, string> = { info: '', good: 'good', aux: '' };

function tokenStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  count: number
): void {
  const gap = 6;
  const cw = Math.min(28, (w - gap * (count - 1)) / count);
  for (let i = 0; i < count; i += 1) {
    const cx = x + i * (cw + gap);
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = COLORS.tag;
    ctx.fillRect(cx, y, cw, 16);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = COLORS.tag;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx + 0.5, y + 0.5, cw - 1, 15);
    ctx.restore();
  }
}

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  positives: number
): void {
  const pad = 6;
  const rows = 4;
  const cw = (w - pad * 2) / cols;
  const rh = (h - pad * 2) / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const on = r === 0 && c < positives;
      ctx.save();
      ctx.globalAlpha = on ? 0.75 : 0.4;
      ctx.fillStyle = on ? COLORS.thread : COLORS.axis;
      ctx.fillRect(x + pad + c * cw + 1, y + pad + r * rh + 1, cw - 2, rh - 2);
      ctx.restore();
    }
  }
  ctx.save();
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export const Ch8Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [task, setTask] = useState<Task>('det');
  const stateRef = useRef({ task: 'det' as Task });

  const pick = (next: Task) => {
    setTask(next);
    stateRef.current.task = next;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    clearScene(ctx, W, H);
    const info = TASK_LIST.find((t) => t.id === s.task) as { tag: string };
    drawLabel(ctx, info.tag, 44, 32, { color: COLORS.ink, size: 15, bold: true });

    if (s.task === 'both') {
      // two columns side by side: class names on the left, a sentence on the right
      drawList(ctx, 40, 50, 258, 130, { lines: 4 });
      tokenStrip(ctx, 40, 188, 258, TOKENS.det);
      drawList(ctx, 320, 50, 258, 130, { lines: 1, split: 0 });
      tokenStrip(ctx, 320, 188, 258, TOKENS.ground);
      drawMatrix(ctx, 680, 56, 150, 180, TOKENS.det, 2);
      drawMatrix(ctx, 850, 56, 150, 180, TOKENS.ground, 4);
      drawLabel(ctx, '4×5', 680, 48, { color: COLORS.muted, size: 13 });
      drawLabel(ctx, '4×12', 850, 48, { color: COLORS.muted, size: 13 });
    } else if (s.task === 'det') {
      drawList(ctx, 40, 50, 340, 130, { lines: 4 });
      tokenStrip(ctx, 40, 188, 340, TOKENS.det);
      drawMatrix(ctx, 720, 56, 280, 180, TOKENS.det, 2);
      drawLabel(ctx, '4×5', 720, 48, { color: COLORS.muted, size: 13 });
    } else {
      drawList(ctx, 40, 50, 340, 130, { lines: 1, split: 0 });
      tokenStrip(ctx, 40, 188, 340, TOKENS.ground);
      drawMatrix(ctx, 720, 56, 280, 180, TOKENS.ground, 4);
      drawLabel(ctx, '4×12', 720, 48, { color: COLORS.muted, size: 13 });
    }

    drawLegend(ctx, 430, 226, [
      { color: COLORS.tag, text: '词元' },
      { color: COLORS.thread, text: '对上的格子' },
      { color: COLORS.axis, text: '未对上' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  const fb = COPY[task];
  const style =
    fb.tone === 'aux'
      ? { color: 'var(--paper-aux)', borderLeftColor: 'var(--paper-aux)' }
      : undefined;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {TASK_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${task === t.id ? 'selected' : ''}`}
              onClick={() => pick(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label>
          列数 <span className="val">{task === 'both' ? '5 / 12' : TOKENS[task]}</span>
        </label>
      </div>
      <div className="hotspot-info">
        <div>
          <b>提示</b>：{PROMPT_TEXT[task]}
        </div>
        <div>
          {task === 'both'
            ? '同一套参数，两个入口：类名列表和自由描述。'
            : task === 'det'
            ? '80 个类名用句点连起来，词元少，矩阵只有 5 列。'
            : '一句自由描述，词元多，矩阵列数涨到 12。'}
        </div>
      </div>
      <div className={`feedback ${TONE_CLS[fb.tone]}`} style={style}>
        {fb.text}
      </div>
    </div>
  );
};

export default Ch8Mod2;
