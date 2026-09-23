import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawLegend,
  drawMiniBars,
  drawReportSheet,
  drawTissueField,
} from './viz-kit';

// ---------------------------------------------------------------------------
// Module 7.1 — 同一块组织，三种描述器
// One dominant operation: switch the captioner that describes the same ROI
// (PathChat+ / PathChat 1 / 通用多模态模型) and read that captioner's real
// DDxBench top-1. The Canvas now shows the same 20× H&E field of view for all
// three captioners, the three captioner outputs as report sheets (the PathChat+
// sheet carries more filled lines than the other two) and the real
// 0.860 / 0.640 / 0.427 comparison as the technical inset. The real Figure 1B
// quotation, the 「示意」 placeholders and the training-scale note all stay in the
// DOM detail region below the Canvas.
// ---------------------------------------------------------------------------

const W = 1080;
const H = 280;
const PULSE_SECONDS = 2.2;

type CaptionerId = 'pathchat-plus' | 'pathchat-1' | 'generic';
type FeedbackCls = '' | 'good' | 'bad';

interface CaptionerSpec {
  id: CaptionerId;
  name: string;
  legend: string;
  color: string;
  /** Real DDxBench top-1 reported in the paper. */
  top1: number;
  /** How many lines of the report sheet the captioner output fills (schematic). */
  sheetLines: string[];
  desc: string;
  feedback: { text: string; cls: FeedbackCls };
}

/** Real Figure 1B caption: PathChat+ describing the esophagus ROI. */
const FIG1B_QUOTE =
  '图像中可见鳞状细胞巢、胞质嗜酸性丰富、细胞边界清楚，并有多处角化珠形成。';

/** Extended Data Figure 2 comparison is qualitative only — no quotable caption. */
const SCHEMATIC_NOTE =
  '示意：原文 Extended Data Figure 2 的定性对比显示，这两类模型的形态学描述更笼统、缺少可直接支撑诊断的术语。';

/**
 * The three captioners' outputs as report sheets. PathChat+ 's sheet lists the
 * real features named in the Figure 1B quotation; the other two sheets are the
 * declared 「示意」 placeholders and therefore stay short and generic. Only the
 * Canvas drawing uses these strings — the DOM keeps its own approved copy.
 */
const PLUS_LINES: string[] = [
  '鳞状细胞巢',
  '嗜酸性胞质丰富',
  '细胞边界清楚',
  '角化珠形成',
  '多区域可见',
];
const OLD_LINES: string[] = ['上皮细胞', '未见特征性结构'];
const GENERIC_LINES: string[] = ['组织图像', '形态描述'];

const CAPTIONERS: CaptionerSpec[] = [
  {
    id: 'pathchat-plus',
    name: 'PathChat+',
    legend: '病理专用',
    color: SKIN.green,
    top1: 0.86,
    sheetLines: PLUS_LINES,
    desc:
      '「' + FIG1B_QUOTE + '」——这是原文 Figure 1B 对食管 ROI 的描述要点。',
    feedback: {
      text: '术语精确到细胞质、细胞边界与角化珠：下游 DDxBench top-1 0.860。',
      cls: 'good',
    },
  },
  {
    id: 'pathchat-1',
    name: 'PathChat 1',
    legend: '旧版病理',
    color: SKIN.blue,
    top1: 0.64,
    sheetLines: OLD_LINES,
    desc: SCHEMATIC_NOTE,
    feedback: {
      text: '换掉描述器，top-1 掉到 0.640（绝对下降 22.0%，p<0.001）。',
      cls: 'bad',
    },
  },
  {
    id: 'generic',
    name: '通用多模态模型',
    legend: '通用模型',
    color: SKIN.red,
    top1: 0.427,
    sheetLines: GENERIC_LINES,
    desc: SCHEMATIC_NOTE,
    feedback: {
      text: '通用模型描述最笼统：top-1 只剩 0.427（绝对下降 43.3%，p<0.001）。',
      cls: 'bad',
    },
  },
];

const TRAINING_SCALE = '1,133,241 条指令 / 549 万轮问答 / 62.4 万张唯一图像';
const TWO_STAGE =
  '两阶段：先冻结 LLM，用 50 万图文对训练适配器；再解冻 LLM + projector 做指令微调，损失只加在回答轮。';

const CANVAS_ROI_NOTE =
  '示意：左侧的镜下视野与右侧的报告单都是示意（原文检验描述质量用的是食管 ROI），不代表模型的原始输出图像。';

/** Geometry: one shared 20× field of view, three report sheets, one numeric inset. */
const FIELD = { x: 40, y: 52, w: 196, h: 196 };
const SHEET_W = 130;
const SHEET_H = 132;
const SHEET_Y = 66;
const SHEET_X: number[] = [258, 404, 550];
const BARS = { x: 700, y: 84, w: 344, h: 150 };

export const M7TwoStageTraining: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ index: number }>({ index: 0 });
  const rafRef = useRef<number | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { index: number }, t: number) => {
      const idx = Math.max(0, Math.min(CAPTIONERS.length - 1, s.index));
      const picked = CAPTIONERS[idx];
      clearScene(ctx, W, H);

      // Left: one shared 20× H&E field of view — the same tissue for all three
      // captioners, so the difference can only come from the describer.
      drawTissueField(ctx, FIELD.x, FIELD.y, FIELD.w, FIELD.h, {
        seed: 71,
        magnification: 20,
      });

      // Middle: the three real captioner outputs drawn as report sheets. The
      // PathChat+ sheet is fuller (five filled lines) than the other two.
      CAPTIONERS.forEach((c, i) => {
        const x = SHEET_X[i];
        const y = SHEET_Y + (i === idx ? 0 : 3);
        const selected = i === idx;
        if (selected) {
          const pulse = (Math.sin(t * Math.PI * 2) + 1) / 2;
          ctx.save();
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.9 - pulse * 0.35;
          ctx.beginPath();
          ctx.arc(x + SHEET_W / 2, y + SHEET_H / 2, SHEET_W * 0.62 + pulse * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        if (!selected) ctx.globalAlpha = 0.78;
        drawReportSheet(ctx, x, y, SHEET_W, SHEET_H, c.sheetLines);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = c.color;
        ctx.fillRect(x + 6, y + SHEET_H - 8, SHEET_W - 12, 3);
        ctx.restore();
      });

      // Right: the real DDxBench top-1 comparison, exact values kept verbatim.
      // The coloured dot beside each row keeps the three rows identifiable in
      // colour without adding any in-canvas text.
      const slot = BARS.h / CAPTIONERS.length;
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = picked.color;
      ctx.fillRect(BARS.x - 6, BARS.y + slot * idx + 3, BARS.w + 4, slot - 6);
      ctx.restore();

      drawMiniBars(
        ctx,
        BARS.x,
        BARS.y,
        BARS.w,
        BARS.h,
        CAPTIONERS.map((c) => ({ value: c.top1, color: c.color })),
        1
      );

      ctx.save();
      CAPTIONERS.forEach((c, i) => {
        const cy = BARS.y + slot * (i + 0.5);
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(BARS.x + 2, cy, i === idx ? 5.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      drawLegend(
        ctx,
        780,
        208,
        CAPTIONERS.map((c) => ({ label: c.legend, color: c.color }))
      );

      // At most two in-canvas labels (≤8 Chinese characters).
      drawLabel(ctx, 40, 30, '镜下 20×', SKIN.text, 16);
      drawLabel(ctx, 700, 30, 'top-1 对比', SKIN.text, 16);
    };

    const tick = () => {
      const t = ((performance.now() / 1000) % PULSE_SECONDS) / PULSE_SECONDS;
      render(stateRef.current, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (next: number): void => {
    const value = Math.max(0, Math.min(CAPTIONERS.length - 1, next));
    stateRef.current = { index: value };
    setIndex(value);
  };

  const picked = CAPTIONERS[index];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      <div className="ctrl">
        <label>描述器</label>
        {CAPTIONERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={i === index ? 'chip selected' : 'chip'}
            aria-pressed={i === index}
            onClick={() => choose(i)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="l">当前描述器</div>
          <div className="v">{picked.name}</div>
        </div>
        <div className="metric">
          <div className="l">DDxBench top-1</div>
          <div className="v">{picked.top1.toFixed(3)}</div>
        </div>
        <div className="metric">
          <div className="l">PathChat+ 训练规模</div>
          <div>{TRAINING_SCALE}</div>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="l">
            {picked.id === 'pathchat-plus' ? '描述文本（原文要点）' : '描述文本（示意）'}
          </div>
          <div>{picked.desc}</div>
        </div>
        <div className="metric">
          <div className="l">两阶段训练</div>
          <div>{TWO_STAGE}</div>
        </div>
        <div className="metric">
          <div className="l">同一块组织</div>
          <div>
            三个描述器看到的是同一块 ROI；图像输入相同，差别只在描述器的训练方式与术语精度。
          </div>
        </div>
      </div>

      <div className="step-desc">{CANVAS_ROI_NOTE}</div>
      <div className={'feedback ' + picked.feedback.cls}>{picked.feedback.text}</div>
    </div>
  );
};

export default M7TwoStageTraining;
