import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawCard,
  drawPlayer,
  drawFrame,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/pitchKit';

// Module 7.2 — one card, two ways to ask.
// 检测: the card holds several class-name lines and every candidate box is kept.
// REC: the card holds one long sentence and only the highest-scoring box is emphasised.

const W = 1080;
const H = 280;

type Task = 'det' | 'rec';

const CARD = { x: 52, y: 44, w: 312, h: 190 };
const NAMES = ['cat', 'person', 'mouse'];
const SENTENCE = 'the cat on the left';

// Four illustrative output candidates, best first.
const OUT = [0.72, 0.61, 0.54, 0.43];
const ROW = { y0: 78, step: 52, barX: 736, barW: 200, frameX: 700 };

export const Ch7Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<{ task: Task }>({ task: 'det' });
  const [task, setTask] = useState<Task>('det');

  const pick = (next: Task) => {
    stateRef.current.task = next;
    setTask(next);
  };

  const draw = (ctx: CanvasRenderingContext2D, _time: number, s: { task: Task }) => {
    const rec = s.task === 'rec';
    clearScene(ctx, W, H, '两种问法');
    if (rec) {
      // one long sentence: a single continuous block on the card, read left to right
      drawCard(ctx, CARD.x, CARD.y, CARD.w, CARD.h, { lines: 1, oneLine: true });
      const sentX = CARD.x + (CARD.w - 126) / 2;
      const sentY = CARD.y + CARD.h * 0.535;
      drawLabel(ctx, 'the cat', sentX, sentY, { size: 15, color: COLORS.ink });
      drawLabel(ctx, 'on the', sentX + 54, sentY, { size: 15, color: COLORS.ink });
      drawLabel(ctx, 'left', sentX + 103, sentY, { size: 15, color: COLORS.ink });
    } else {
      // several class-name lines, each a separate candidate word
      drawCard(ctx, CARD.x, CARD.y, CARD.w, CARD.h, { lines: 3, labels: NAMES });
    }

    // card -> candidate outputs: the prompt is what all boxes are scored against
    const cy = CARD.y + CARD.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CARD.x + CARD.w + 8, cy);
    ctx.lineTo(646, cy);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(652, cy);
    ctx.lineTo(640, cy - 5);
    ctx.lineTo(640, cy + 5);
    ctx.closePath();
    ctx.fillStyle = COLORS.axis;
    ctx.fill();
    ctx.restore();

    OUT.forEach((v, i) => {
      const y = ROW.y0 + i * ROW.step;
      const winner = i === 0;
      const emph = rec && winner;
      if (rec) {
        // only the top box stays alive
        ctx.save();
        ctx.globalAlpha = emph ? 1 : 0.4;
        if (emph) {
          ctx.beginPath();
          ctx.rect(664, y - 20, 372, 40);
          ctx.fillStyle = 'rgba(29,127,122,0.10)';
          ctx.fill();
        }
        drawFrame(ctx, ROW.frameX, y, 48, 34, {
          color: emph ? COLORS.confirm : COLORS.muted,
          weight: emph ? 4 : 1.5,
          dashed: !emph,
        });
        drawPlayer(ctx, ROW.frameX, y + 5, 0.55, { dim: !emph });
        ctx.restore();
      } else {
        drawFrame(ctx, ROW.frameX, y, 48, 34, { color: COLORS.box, weight: 2 });
        drawPlayer(ctx, ROW.frameX, y + 5, 0.55, {});
      }
      const barColor = emph ? COLORS.confirm : rec ? COLORS.muted : COLORS.box;
      ctx.save();
      ctx.globalAlpha = rec && !emph ? 0.45 : 1;
      ctx.beginPath();
      ctx.rect(ROW.barX, y - 6, Math.max(4, v * ROW.barW), 12);
      ctx.fillStyle = barColor;
      ctx.fill();
      ctx.restore();
      drawLabel(ctx, v.toFixed(2), ROW.barX + ROW.barW + 10, y + 6, {
        size: 12,
        color: emph ? COLORS.confirm : COLORS.ink,
      });
    });

    drawLegend(ctx, 40, 264, [
      { color: COLORS.box, text: '候选框' },
      { color: COLORS.confirm, text: '最高分' },
      { color: COLORS.muted, text: '未采用' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  const feedback = task === 'det'
    ? { text: '检测：每个类名都是一个候选词，输出多个框。', cls: '' }
    : { text: 'REC：整句就是一个描述，只取分数最高的那个框作为答案。', cls: 'good' };
  const prompt =
    task === 'det' ? '卡上写的是类名：cat . person . mouse .' : '卡上写的是一整句：' + SENTENCE;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${task === 'det' ? 'selected' : ''}`}
            onClick={() => pick('det')}
            aria-pressed={task === 'det'}
          >
            检测
          </button>
          <button
            type="button"
            className={`chip ${task === 'rec' ? 'selected' : ''}`}
            onClick={() => pick('rec')}
            aria-pressed={task === 'rec'}
          >
            REC
          </button>
        </div>
        <label>
          输出 <span className="val">{task === 'det' ? '4 个框' : '1 个框'}</span>
        </label>
      </div>
      <div className="hotspot-info">{prompt}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod2;
