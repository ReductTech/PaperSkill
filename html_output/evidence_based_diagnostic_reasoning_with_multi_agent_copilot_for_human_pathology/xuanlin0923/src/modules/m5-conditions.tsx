import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawLegend,
  drawRequestForm,
  drawSlide,
} from './viz-kit';

// Module 5.1 —— 同一张切片，换个提问
// One dominant operation: switch between the paper's two real cases and watch the
// input task, the supervisor's initial differential list and the first-round task
// all change together — while the slide itself stays the same kind of object.
// 画法：左边一张可辨认的申请单（写该病例真实任务文本的前 14 字，标题条颜色随病例改变），
//       右边一张玻璃载玻片，片上高亮圈标出该病例首轮优先观察的区域（位置随病例移动）。
//       全部原文、鉴别清单与坐标写在 DOM。

const W = 1080;
const H = 280;

const TAU = Math.PI * 2;

// ---- 画布几何：申请单 + 载玻片 ----
const FORM = { x: 44, y: 42, w: 296, h: 186 };
const SLIDE = { x: 400, y: 34, w: 640, h: 196 };
/** drawSlide 的 H&E 组织：位于磨砂标签端之外的中央，长宽约为玻片的 60%×55%（再内收 15%）。 */
const FROST_W = Math.max(16, SLIDE.w * 0.24);
const TISSUE = {
  x: SLIDE.x + FROST_W + (SLIDE.w - FROST_W) * 0.5 - SLIDE.w * 0.3 * 0.85,
  y: SLIDE.y + SLIDE.h * 0.5 - SLIDE.h * 0.275 * 0.85,
  w: SLIDE.w * 0.6 * 0.85,
  h: SLIDE.h * 0.55 * 0.85,
};
/** 旧的缩略图坐标框：把数据里的 priority 坐标归一化后落到真实组织上。 */
const CHART = { x: 40, y: 44, w: 520, h: 188 };
/** 申请单的纸面倾角与标题条高度，与 viz-kit 的 drawRequestForm 保持一致。 */
const SHEET_ROT = -0.026;
const HEADER_H = Math.max(10, Math.min(FORM.h * 0.2, 22));

type CaseId = 'thyroid' | 'esophagus';
type Feedback = { text: string; cls: '' | 'good' | 'bad' };

interface CaseRow {
  id: CaseId;
  chip: string;
  inputTask: string;
  initial: string[];
  firstTask: string;
  /** Priority region for the first round — 示意位置，原文只给出坐标/描述。 */
  priority: { x: number; y: number };
  bar: number;
  feedback: Feedback;
}

const CASES: CaseRow[] = [
  {
    id: 'thyroid',
    chip: '甲状腺切除（原文 Figure 4）',
    inputTask: '为该全切片图像中的疾病给出诊断。',
    initial: [
      '乳头状甲状腺癌',
      '滤泡型癌',
      '髓样癌',
      '结节性甲状腺肿等良性病变',
    ],
    firstTask: '以 1.25× 检查区域 0，注意结节性、乳头状结构或异常滤泡结构。',
    priority: { x: 150, y: 132 },
    bar: 1,
    feedback: {
      text: '先做结构评估：滤泡型病变要靠包膜与血管侵犯区分，所以第一轮先看整体结构。',
      cls: '',
    },
  },
  {
    id: 'esophagus',
    chip: '食管组织（原文 Figure 1A）',
    inputTask: '请审阅这张食管组织切片，给出最可能的诊断。',
    initial: [
      '示意：鳞状上皮与角化珠是首轮的两个关注点（原文未列出鉴别诊断清单）。',
      '最终输出：镜下所见 = 恶性鳞状细胞（Image 1）、角化珠形成（Image 2）；诊断 = 食管鳞状细胞癌。',
    ],
    firstTask:
      '原文 Figure 1B 中 PathChat+ 对食管 ROI 的描述要点：「图像中可见鳞状细胞巢、胞质嗜酸性丰富、细胞边界清楚，并有多处角化珠形成。」',
    priority: { x: 340, y: 168 },
    bar: 1,
    feedback: {
      text: '先看鳞状上皮与角化珠：角化珠是鳞状分化的强提示。',
      cls: '',
    },
  },
];

function caseColor(id: CaseId): string {
  return id === 'thyroid' ? SKIN.blue : SKIN.purple;
}

/** 圆角矩形路径（画申请单标题条用，坐标在纸面局部系）。 */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y + rr, x + rr, y, rr);
  ctx.closePath();
}

/** 把申请单顶部标题条改成该病例的颜色（纸面 -1.5°，绕纸面中心旋转，与 drawRequestForm 一致）。 */
function paintTitleBar(ctx: CanvasRenderingContext2D, color: string): void {
  const hw = FORM.w / 2;
  const hh = FORM.h / 2;
  ctx.save();
  ctx.translate(FORM.x + hw, FORM.y + hh);
  ctx.rotate(SHEET_ROT);
  ctx.fillStyle = color;
  roundRectPath(ctx, -hw + 1, -hh + 1, FORM.w - 2, HEADER_H, 2.5);
  ctx.fill();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-hw + 8, -hh + HEADER_H * 0.34, Math.min(FORM.w * 0.42, 58), Math.max(2, HEADER_H * 0.3));
  ctx.restore();
}

/** 数据里的 priority 坐标 → 玻片组织上的高亮中心。 */
function prioritySpot(row: CaseRow): { x: number; y: number } {
  const fx = clamp((row.priority.x - CHART.x) / CHART.w, 0, 1);
  const fy = clamp((row.priority.y - CHART.y) / CHART.h, 0, 1);
  return { x: TISSUE.x + fx * TISSUE.w, y: TISSUE.y + fy * TISSUE.h };
}

export const M5Conditions: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ id: CaseId }>({ id: 'thyroid' });
  const rafRef = useRef<number | null>(null);
  const [id, setId] = useState<CaseId>('thyroid');

  const row = CASES.find((c) => c.id === id) ?? CASES[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { id: CaseId }, now: number) => {
      const active = CASES.find((c) => c.id === s.id) ?? CASES[0];
      const color = caseColor(active.id);
      const spot = prioritySpot(active);
      clearScene(ctx, W, H);

      // ---- 右：一张真实的玻璃载玻片 + H&E 组织切片 ----
      drawSlide(ctx, SLIDE.x, SLIDE.y, SLIDE.w, SLIDE.h, { tissue: 'section', label: 'H&E' });

      // ---- 从申请单指向玻片优先区域的引线 ----
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(FORM.x + FORM.w + 2, FORM.y + 62);
      ctx.quadraticCurveTo(
        FORM.x + FORM.w + 60,
        spot.y - 46,
        spot.x - 30,
        spot.y
      );
      ctx.stroke();
      ctx.restore();

      // ---- 左：一张申请单（写该病例真实任务文本的前 14 字），标题条颜色随病例改变 ----
      drawRequestForm(ctx, FORM.x, FORM.y, FORM.w, FORM.h, [active.inputTask.slice(0, 14)]);
      paintTitleBar(ctx, color);

      // ---- 玻片上的优先区域：脉冲高亮圈 ----
      const pulse = 0.5 + 0.5 * Math.sin(now / 420);
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 26, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 26, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.35 + 0.4 * pulse;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 33 + 3 * pulse, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // 至多两个画布内标签 + 一个图例。
      drawLabel(ctx, FORM.x, 28, '申请单', SKIN.text, 15);
      drawLabel(ctx, SLIDE.x + 4, 24, '玻片', SKIN.text, 15);
      drawLegend(ctx, SLIDE.x + 20, 242, [{ label: '优先区域', color }]);
    };

    const tick = () => {
      render(stateRef.current, performance.now());
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

  const choose = (next: CaseId) => {
    stateRef.current = { id: next };
    setId(next);
  };

  return (
    <div>
      <div className="chip-row">
        {CASES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={'chip' + (id === c.id ? ' selected' : '')}
            aria-pressed={id === c.id}
            onClick={() => choose(c.id)}
          >
            {c.chip}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="metrics">
        <div className="metric">
          <div className="l">输入任务原文要点</div>
          <div>{row.inputTask}</div>
        </div>
        <div className="metric">
          <div className="l">
            {id === 'thyroid' ? 'supervisor 初始鉴别' : '首轮关注点 / 最终输出'}
          </div>
          <div>
            {row.initial.map((h) => (
              <div key={h}>{h}</div>
            ))}
          </div>
        </div>
      </div>
      {id === 'thyroid' ? (
        <div className="metrics">
          <div className="metric">
            <div className="l">初始鉴别数量</div>
            <div className="v">4</div>
          </div>
          <div className="metric">
            <div className="l">收窄理由（原文要点）</div>
            <div className="v">需要结构评估</div>
          </div>
        </div>
      ) : null}
      <div className="step-desc">首轮任务原文要点：{row.firstTask}</div>
      <div className="step-desc">
        优先区域（示意）：左图玻片上高亮圈的位置表示该病例首轮优先观察的区域，原文只给出坐标与文字描述。
      </div>
      <div className={'feedback ' + row.feedback.cls}>{row.feedback.text}</div>
    </div>
  );
};

export default M5Conditions;
