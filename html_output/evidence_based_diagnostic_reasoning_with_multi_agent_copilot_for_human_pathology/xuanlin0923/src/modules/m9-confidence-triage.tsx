import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawLegend,
  drawMiniBars,
  drawSlide,
  drawStainJar,
  drawTissueField,
} from './viz-kit';

// Module 9.1 — 五种记录，五种可信度 (hybrid linked views, pattern P4).
// Left: a real glass slide with its H&E section, plus the staining jar whose
// fluid level drops when the system is not sure of itself.
// Middle: the 镜下视野 — a crisp 20× field for the high-confidence record, a
// deliberately de-focused, low-contrast field (blur + translucent haze) for the
// uncertain one, and for the three failure records a crisp field carrying a red
// warning triangle. That triangle is a shape, not a colour code: the DOM detail
// region below the Canvas spells every failure out in words.
// Right: the two measured accuracies (0.906 / 0.778) as the exact-value inset.
//
// The five chips are five REAL records of the paper (no invented per-case outcome):
//   high   — 96 例自评高置信，准确率 0.906
//   low    — 54 例自评不确定，准确率 0.778（两组比较 p<0.05）
//   grade  — 分级错误 5 例＝全部失败的 45%；均为星形细胞瘤分级，3 例高估、2 例低估；
//            难点是核分裂活性、微血管增生、灶状坏死
//   miss   — 漏检 1/150：被良性组织包围的 Merkel 细胞癌微小灶（区域优先级失手）
//   halluc — 模态幻觉 1/150：supervisor 要求做 IHC，explorer 在 H&E 上编出 IHC 结果
// Canvas budget: two short labels plus one 2-entry legend plus bare numbers.
// Every sentence lives in the DOM metrics grid and the .feedback line.

const W = 1080;
const H = 280;

const PULSE_SECONDS = 1.8;

type CaseId = 'high' | 'low' | 'grade' | 'miss' | 'halluc';
type FeedbackCls = '' | 'good' | 'bad';

interface Metric {
  l: string;
  v: string;
}

interface CaseDef {
  id: CaseId;
  chip: string;
  /** one short in-canvas case label (<= 8 characters) */
  label: string;
  /** the single written logbook row (<= 8 characters) */
  row: string;
  lamp: boolean;
  notch: number;
  failure: boolean;
  /** bare numbers drawn only for the failure cases */
  mark: string;
  color: string;
  /** DOM: heading of the record card, carrying the ⚠ marker for failures */
  name: string;
  /** DOM: three real record numbers */
  metrics: Metric[];
  /** DOM: the real record in words */
  note: string;
  /** DOM: what the record means for review */
  use: string;
  feedback: string;
  cls: FeedbackCls;
}

const CASE_ORDER: CaseId[] = ['high', 'low', 'grade', 'miss', 'halluc'];

const CASES: Record<CaseId, CaseDef> = {
  high: {
    id: 'high',
    chip: '高置信',
    label: '高置信',
    row: '高置信 96 例',
    lamp: false,
    notch: 2,
    failure: false,
    mark: '',
    color: SKIN.green,
    name: '高置信记录',
    metrics: [
      { l: '置信度分组', v: '高置信' },
      { l: '样本数', v: '96 例' },
      { l: '准确率', v: '0.906' },
    ],
    note: '论文按自评置信度分组：自评高置信的 96 例，准确率 0.906。',
    use: '置信度可作为分流复核的信号：高置信先放行，不确定优先人工看片。',
    feedback: '自评高置信的 96 例准确率 0.906：置信度高的一组，结果也更可靠。',
    cls: 'good',
  },
  low: {
    id: 'low',
    chip: '不确定',
    label: '不确定',
    row: '不确定 54 例',
    lamp: false,
    notch: 1,
    failure: false,
    mark: '',
    color: SKIN.blue,
    name: '不确定记录',
    metrics: [
      { l: '置信度分组', v: '不确定' },
      { l: '样本数', v: '54 例' },
      { l: '准确率', v: '0.778' },
    ],
    note: '自评不确定的 54 例，准确率 0.778；与高置信组的差异 p<0.05。',
    use: '置信度可作为分流复核的信号：不确定的一档应优先人工复核。',
    feedback: '自评不确定的 54 例准确率 0.778（两组比较 p<0.05）：它知道自己不确定。',
    cls: '',
  },
  grade: {
    id: 'grade',
    chip: '分级错误',
    label: '分级错误',
    row: '星形细胞瘤',
    lamp: true,
    notch: 2,
    failure: true,
    mark: '5 / 45%',
    color: SKIN.red,
    name: '⚠ 分级错误',
    metrics: [
      { l: '⚠ 病例数', v: '5 例' },
      { l: '⚠ 占全部失败', v: '45%' },
      { l: '分级方向', v: '3 例高估 · 2 例低估' },
    ],
    note: '5 例误分类＝全部失败的 45%，全部是星形细胞瘤（astrocytoma）分级错误：3 例高估、2 例低估。难点是核分裂活性、微血管增生、灶状坏死。',
    use: '⚠ 失败模式：必须由人工复核，不能只靠颜色判定。',
    feedback:
      '⚠ 分级错误：5 例＝全部失败的 45%，均为星形细胞瘤分级错误（3 例高估、2 例低估）；难点是核分裂活性、微血管增生、灶状坏死。',
    cls: 'bad',
  },
  miss: {
    id: 'miss',
    chip: '微小病灶漏检',
    label: '漏检',
    row: '微小灶漏检',
    lamp: true,
    notch: 0,
    failure: true,
    mark: '1 / 150',
    color: SKIN.red,
    name: '⚠ 微小病灶漏检',
    metrics: [
      { l: '⚠ 漏检', v: '1 / 150' },
      { l: '漏检对象', v: 'Merkel 细胞癌微小灶' },
      { l: '失手环节', v: '区域优先级' },
    ],
    note: '150 例中漏检 1 例：被良性组织包围的 Merkel 细胞癌微小灶——区域优先级失手。',
    use: '⚠ 失败模式：必须由人工复核，不能只靠颜色判定。',
    feedback: '⚠ 漏检 1/150：漏掉被良性组织包围的 Merkel 细胞癌微小灶——区域优先级失手。',
    cls: 'bad',
  },
  halluc: {
    id: 'halluc',
    chip: '模态幻觉',
    label: '幻觉',
    row: '编造 IHC',
    lamp: true,
    notch: 0,
    failure: true,
    mark: '1 / 150',
    color: SKIN.red,
    name: '⚠ 模态幻觉',
    metrics: [
      { l: '⚠ 幻觉', v: '1 / 150' },
      { l: '任务要求', v: 'IHC' },
      { l: '实际可用模态', v: 'H&E' },
    ],
    note: '150 例中出现 1 例：supervisor 要求做 IHC，explorer 在 H&E 上编出了 IHC 结果——任务必须受可用模态约束。',
    use: '⚠ 失败模式：必须由人工复核，不能只靠颜色判定。',
    feedback:
      '⚠ 模态幻觉 1/150：supervisor 要求做 IHC，explorer 在 H&E 上编出了 IHC 结果——任务必须受可用模态约束。',
    cls: 'bad',
  },
};

/** Geometry of the concrete scene. */
const SLIDE = { x: 40, y: 52, w: 196, h: 160 };
const JAR = { x: 112, y: 226, w: 116, h: 48 };
const FIELD = { cx: 470, cy: 146, r: 104 };
const BARS = { x: 650, y: 78, w: 350, h: 140 };

const SOFT_RECORDS: Record<CaseId, boolean> = {
  high: false,
  low: true,
  grade: false,
  miss: true,
  halluc: false,
};

/** Rounded field-stop outline matching `drawTissueField`'s own rim shape. */
function fieldPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  pad = 0
): void {
  const s = r + pad;
  const corner = r * 0.22;
  ctx.beginPath();
  ctx.moveTo(cx - s + corner, cy - s);
  ctx.arcTo(cx + s, cy - s, cx + s, cy + s, corner);
  ctx.arcTo(cx + s, cy + s, cx - s, cy + s, corner);
  ctx.arcTo(cx - s, cy + s, cx - s, cy - s, corner);
  ctx.arcTo(cx - s, cy - s, cx + s, cy - s, corner);
  ctx.closePath();
}

/** Red warning triangle — the non-colour signal for the three failure cases. */
function drawWarningMark(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.save();
  ctx.fillStyle = SKIN.red;
  ctx.beginPath();
  ctx.moveTo(x, y - 15);
  ctx.lineTo(x + 16, y + 10);
  ctx.lineTo(x - 16, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', x, y + 1);

  // The bare record numbers, written next to the shape.
  ctx.fillStyle = SKIN.red;
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(text, x - 22, y - 4);
  ctx.textAlign = 'left';
  ctx.restore();
}

/** Translucent haze that flattens the contrast of an uncertain field of view. */
function drawHaze(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  strength: number
): void {
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.fillStyle = '#eef1ea';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = strength * 0.8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function renderCase(ctx: CanvasRenderingContext2D, c: CaseDef, t: number): void {
  clearScene(ctx, W, H);

  const soft = SOFT_RECORDS[c.id];
  const pulse = (Math.sin(t * Math.PI * 2) + 1) / 2;

  // Left: a real glass slide with its H&E section.
  drawSlide(ctx, SLIDE.x, SLIDE.y, SLIDE.w, SLIDE.h, { tissue: 'section' });
  drawLabel(ctx, SLIDE.x, 30, c.label, c.color, 17);

  // Below it: the staining jar the slide came out of. A jar that is only part
  // filled stands for a record the system is not sure about.
  drawStainJar(ctx, JAR.x, JAR.y, JAR.w, JAR.h, c.failure ? 0.5 : soft ? 0.34 : 0.72);

  // Middle: the microscopic field of view. The uncertain record is drawn
  // deliberately flatter and lower in contrast, then the field stop is redrawn
  // crisp so the field still reads as a field rather than a smudge.
  ctx.save();
  if (soft) ctx.globalAlpha = 0.62;
  drawTissueField(ctx, FIELD.cx - FIELD.r, FIELD.cy - FIELD.r, FIELD.r * 2, FIELD.r * 2, {
    seed: 91 + CASE_ORDER.indexOf(c.id) * 13,
    magnification: 20,
  });
  ctx.restore();

  if (soft) {
    drawHaze(ctx, FIELD.cx, FIELD.cy, FIELD.r, 0.44);
  }

  ctx.save();
  ctx.globalAlpha = soft ? 0.55 : 1;
  ctx.strokeStyle = SKIN.glassEdge;
  ctx.lineWidth = 1;
  fieldPath(ctx, FIELD.cx, FIELD.cy, FIELD.r);
  ctx.stroke();
  ctx.restore();

  if (!soft) {
    ctx.save();
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9 - pulse * 0.4;
    fieldPath(ctx, FIELD.cx, FIELD.cy, FIELD.r, 4);
    ctx.stroke();
    ctx.restore();
  }

  if (c.failure) {
    ctx.save();
    ctx.strokeStyle = SKIN.red;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.globalAlpha = 0.85 - pulse * 0.3;
    fieldPath(ctx, FIELD.cx, FIELD.cy, FIELD.r, 10);
    ctx.stroke();
    ctx.restore();
    drawWarningMark(ctx, FIELD.cx + FIELD.r - 8, FIELD.cy - FIELD.r + 12, c.mark);
  }

  drawLabel(ctx, FIELD.cx - FIELD.r, 30, '镜下 20×', SKIN.text, 16);

  // Right: the two measured accuracies, exact values kept verbatim.
  drawMiniBars(
    ctx,
    BARS.x,
    BARS.y,
    BARS.w,
    BARS.h,
    [
      { value: 0.906, color: SKIN.green },
      { value: 0.778, color: SKIN.blue },
    ],
    1
  );

  drawLegend(ctx, 760, 246, [
    { label: '高置信', color: SKIN.green },
    { label: '不确定', color: SKIN.blue },
  ]);
}

export const M9ConfidenceTriage: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const caseRef = useRef<CaseDef>(CASES.high);
  const [caseId, setCaseId] = useState<CaseId>('high');
  const [feedback, setFeedback] = useState<{ text: string; cls: FeedbackCls }>({
    text: CASES.high.feedback,
    cls: CASES.high.cls,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let raf: number | null = null;
    const tick = (): void => {
      const t = ((performance.now() / 1000) % PULSE_SECONDS) / PULSE_SECONDS;
      renderCase(ctx, caseRef.current, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = (): void => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const selectCase = (id: CaseId): void => {
    const next = CASES[id];
    caseRef.current = next;
    setCaseId(id);
    setFeedback({ text: next.feedback, cls: next.cls });
  };

  const current = CASES[caseId];

  return (
    <div>
      <div className="chip-row">
        {CASE_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={id === caseId ? 'chip selected' : 'chip'}
            aria-pressed={id === caseId}
            onClick={() => selectCase(id)}
          >
            {CASES[id].chip}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="metrics">
        {current.metrics.map((m) => (
          <div className="metric" key={m.l}>
            <div className="l">{m.l}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">{current.name}</div>
          <div>{current.note}</div>
        </div>
        <div className="metric">
          <div className="l">{current.failure ? '⚠ 复核要求' : '分流用法'}</div>
          <div>{current.use}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M9ConfidenceTriage;
