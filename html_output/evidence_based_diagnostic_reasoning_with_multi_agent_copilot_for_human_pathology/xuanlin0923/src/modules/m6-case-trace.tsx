import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawLegend,
  drawMicroscope,
  drawReportSheet,
  drawTissueField,
} from './viz-kit';

// ---------------------------------------------------------------------------
// Module 6.1 — 原文 Figure 4：甲状腺病例的完整推理链
// One dominant operation: step through the three REAL rounds of the paper's
// thyroid case (1.25× → 5× → 20×). The Canvas is now a concrete pathology
// scene: a recognisable microscope whose selected objective follows the round,
// a large circular 镜下视野 drawn with the real H&E primitives (glands at
// 1.25×, follicles at 5×, nuclei at 20×, and at 20× the invaded vessel whose
// rim turns green), and one written observation record per finished round.
// Every name / coordinate / quotation stays in the DOM detail region below the
// Canvas — the Canvas carries two short labels, one legend and bare numbers only.
// ---------------------------------------------------------------------------

const W = 1080;
const H = 280;
const MAX_ROUND = 3;

/**
 * `drawMicroscope` puts the base centre at (x, y) and builds the instrument
 * upward from there, so `baseY` is the foot: the body reaches y - 68*scale.
 */
const MICROSCOPE = { cx: 140, baseY: 262, scale: 0.6 };
const FIELD = { cx: 478, cy: 140, r: 102 };
/** The right column stacks one written observation record per finished round. */
const RECORD = { x: 812, w: 228, h: 64, gap: 6, top: 58 };

type FeedbackCls = '' | 'good' | 'bad';

interface Roi {
  x: number;
  y: number;
}

interface RoundSpec {
  mag: string;
  task: string;
  report: string;
  rois: Roi[];
  /** the two lines written on that round's observation record */
  record: [string, string];
  /** objective on the microscope turret for this round (0=低倍 1=中倍 2=高倍) */
  objective: 0 | 1 | 2;
  /** magnification of the circular field of view for this round */
  fieldMag: 1.25 | 5 | 20;
  feedback: { text: string; cls: FeedbackCls };
}

/**
 * The three real rounds of the paper's Figure 4 thyroid case. Each round keeps the
 * real coordinates and magnifications; the task and report strings are short
 * Simplified-Chinese key points of the paper's English text rather than verbatim
 * quotations. Only the drawing metadata (objective / field magnification and the
 * two short record lines) is new.
 */
const ROUNDS: RoundSpec[] = [
  {
    mag: '1.25×',
    task:
      '以 1.25× 检查区域 0，注意结节性、乳头状结构或异常滤泡结构。',
    report:
      '1.25×：多个包膜完整的结节，细胞密集均匀、异型性极小，倾向良性滤泡性病变；建议对选定区域做更高倍复查。',
    rois: [
      { x: 24949, y: 19719 },
      { x: 38234, y: 27000 },
    ],
    record: ['1.25×', '包膜完整结节'],
    objective: 0,
    fieldMag: 1.25,
    feedback: {
      text: '1.25×：多个包膜完整的结节，细胞均匀、异型性小，倾向良性滤泡性病变。',
      cls: '',
    },
  },
  {
    mag: '5×',
    task:
      '在 (38234, 27000) 与 (38234, 5434) 附近以 5× 检查，注意包膜与周围实质的交界，评估细胞均匀性以及出血、坏死迹象。',
    report:
      '5×：结节边界清楚、包膜完整，滤泡大小不一但上皮均匀，未见侵犯，支持良性滤泡性过程。',
    rois: [
      { x: 38234, y: 27000 },
      { x: 38234, y: 5434 },
    ],
    record: ['5×', '包膜完整'],
    objective: 1,
    fieldMag: 5,
    feedback: {
      text: '5×：包膜完整、未见侵犯，仍支持良性——注意此时还不能下结论。',
      cls: '',
    },
  },
  {
    mag: '20×',
    task:
      '在 (25000, 10000) 附近以 20× 确认包膜完整性，评估滤泡细胞均匀性、胶质形态与核分裂情况，记录间质与血管的可疑改变。',
    report:
      '20×：肿瘤细胞核增大、包膜透亮，侵入内皮衬里的血管，在滤泡结构背景下确认滤泡型甲状腺癌（FTC）。',
    rois: [
      { x: 25000, y: 10000 },
      { x: 35000, y: 35000 },
    ],
    record: ['20×', '血管内肿瘤'],
    objective: 2,
    fieldMag: 20,
    feedback: {
      text: '20×：核增大、包膜透亮，侵入内皮衬里的血管 → 滤泡型甲状腺癌（FTC）。',
      cls: 'good',
    },
  },
];

/** The round-0 state: nothing examined yet, so the starting lens view is 1.25×. */
const IDLE_OBJECTIVE: 0 | 1 | 2 = 0;
const IDLE_FIELD_MAG: 1.25 | 5 | 20 = 1.25;

const CASE_INPUT = '男性患者的甲状腺切除标本，未提供其他临床信息。';
const CASE_TASK = '为该全切片图像中的疾病给出诊断。';
const INITIAL_DIFFERENTIALS =
  '乳头状甲状腺癌、滤泡型癌、髓样癌，以及结节性甲状腺肿等良性病变；理由是还需要结构评估来收窄。';

const START_FEEDBACK =
  '起步说明：原文病例只有一句临床信息。supervisor 先列出鉴别，再决定第一轮要看哪里——不先决定位置，就没有证据。';

const SUPERVISOR_REPORT =
  '镜下见包膜完整的滤泡结节、上皮均匀，一处见血管侵犯，无乳头状核特征。';

const REPORT_POINTS: string[] = [
  '血管侵犯确立诊断：滤泡型甲状腺癌（FTC）。',
  '滤泡型腺瘤因血管侵犯被排除。',
  '乳头状甲状腺癌因缺乏特征性核特征被排除。',
  '无需追加检查即可确认诊断。（原文要点）',
];

/** Rounded field-stop outline matching `drawTissueField`'s own rim shape. */
function fieldPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  pad: number
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

export const M6CaseTrace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ round: number }>({ round: 0 });
  const rafRef = useRef<number | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { round: number }, t: number) => {
      const cur = clamp(Math.round(s.round), 0, MAX_ROUND);
      const spec = cur === 0 ? null : ROUNDS[cur - 1];

      clearScene(ctx, W, H);

      // Left: a recognisable microscope. Its turret objective follows the round
      // (1.25× → low, 5× → mid, 20× → high) and the chosen lens is long + blue.
      drawMicroscope(ctx, MICROSCOPE.cx, MICROSCOPE.baseY, MICROSCOPE.scale, {
        objective: spec === null ? IDLE_OBJECTIVE : spec.objective,
      });

      // Centre: the large circular field of view, drawn with the real H&E
      // primitives at that round's magnification. Round 3 shows tumour cells
      // inside an endothelium-lined vessel and the rim turns green.
      const found = cur === MAX_ROUND;
      ctx.save();
      if (spec === null) ctx.globalAlpha = 0.6;
      drawTissueField(ctx, FIELD.cx - FIELD.r, FIELD.cy - FIELD.r, FIELD.r * 2, FIELD.r * 2, {
        seed: 61 + cur * 17,
        magnification: spec === null ? IDLE_FIELD_MAG : spec.fieldMag,
        lesion: found ? 'vessel' : 'none',
      });
      ctx.restore();

      if (found) {
        const pulse = (Math.sin(t * Math.PI * 2) + 1) / 2;
        ctx.save();
        ctx.strokeStyle = SKIN.green;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.9 - pulse * 0.35;
        fieldPath(ctx, FIELD.cx, FIELD.cy, FIELD.r, 2 + pulse * 5);
        ctx.stroke();
        ctx.restore();
      } else if (spec !== null) {
        ctx.save();
        ctx.strokeStyle = SKIN.blue;
        ctx.lineWidth = 2;
        fieldPath(ctx, FIELD.cx, FIELD.cy, FIELD.r, 6);
        ctx.stroke();
        ctx.restore();
      }

      // Right: one written observation record per finished round. The DOM
      // metrics grid below the Canvas carries the same rounds in full text.
      ROUNDS.slice(0, cur).forEach((item, i) => {
        const y = RECORD.top + i * (RECORD.h + RECORD.gap);
        const isCurrent = i === cur - 1;
        ctx.save();
        ctx.globalAlpha = isCurrent ? 1 : 0.72;
        drawReportSheet(ctx, RECORD.x, y, RECORD.w, RECORD.h, item.record);
        ctx.restore();
        ctx.save();
        ctx.fillStyle = isCurrent ? SKIN.green : SKIN.axis;
        ctx.fillRect(RECORD.x, y + RECORD.h - 5, RECORD.w, 5);
        ctx.restore();
      });

      // At most two in-canvas labels (≤8 Chinese characters) and one legend.
      drawLabel(ctx, 40, 26, '镜下视野', SKIN.text, 16);
      drawLabel(ctx, RECORD.x, 26, '观察记录', SKIN.text, 16);
      drawLegend(ctx, 838, 256, [{ label: '血管侵犯', color: SKIN.green }]);
    };

    const tick = () => {
      render(stateRef.current, ((performance.now() / 1000) % 2) / 2);
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

  const goTo = (next: number): void => {
    const value = clamp(Math.round(next), 0, MAX_ROUND);
    stateRef.current = { round: value };
    setRound(value);
  };

  const current = round === 0 ? null : ROUNDS[round - 1];
  const feedback = current === null ? START_FEEDBACK : current.feedback.text;
  const feedbackCls: FeedbackCls = current === null ? '' : current.feedback.cls;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      <div className="ctrl step-ctrl">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => goTo(round - 1)}
          disabled={round === 0}
        >
          上一轮
        </button>
        <button
          type="button"
          className="tiny"
          onClick={() => goTo(round + 1)}
          disabled={round === MAX_ROUND}
        >
          {round === MAX_ROUND ? '已完成' : '下一轮'}
        </button>
        <button type="button" className="tiny ghost" onClick={() => goTo(0)}>
          重置
        </button>
        <label>
          当前轮次
          <span className="val">
            {round} / {MAX_ROUND}
          </span>
        </label>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="l">当前倍率</div>
          <div className="v">{current === null ? '尚未开始' : current.mag}</div>
        </div>
        <div className="metric">
          <div className="l">轮次</div>
          <div className="v">
            {round === 0 ? '未开始' : `第 ${round} 轮 / ${MAX_ROUND}`}
          </div>
        </div>
        <div className="metric">
          <div className="l">sufficient_evidence</div>
          <div className="v">{round === MAX_ROUND ? 'True' : '未置位'}</div>
        </div>
      </div>

      {current === null ? (
        <div className="metrics">
          <div className="metric">
            <div className="l">病例输入（原文要点）</div>
            <div>{CASE_INPUT}</div>
          </div>
          <div className="metric">
            <div className="l">任务原文要点</div>
            <div>{CASE_TASK}</div>
          </div>
          <div className="metric">
            <div className="l">supervisor 初始鉴别</div>
            <div>{INITIAL_DIFFERENTIALS}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="metrics">
            <div className="metric">
              <div className="l">本轮任务原文要点</div>
              <div>{current.task}</div>
            </div>
            <div className="metric">
              <div className="l">explorer 回报原文要点</div>
              <div>{current.report}</div>
            </div>
            <div className="metric">
              <div className="l">本轮关键 ROI 坐标（原文）</div>
              {current.rois.map((roi) => (
                <div className="v" key={roi.x + '-' + roi.y}>
                  ({roi.x}, {roi.y}) @{current.mag}
                </div>
              ))}
            </div>
          </div>
          {round === MAX_ROUND ? (
            <div className="metrics">
              <div className="metric">
                <div className="l">PathChat+ 诊断 Primary</div>
                <div className="v">滤泡型甲状腺癌（FTC）</div>
              </div>
              <div className="metric">
                <div className="l">PathChat+ 诊断 Differentials</div>
                <div className="v">滤泡型腺瘤、乳头状甲状腺癌</div>
              </div>
              <div className="metric">
                <div className="l">supervisor 报告要点（形态学部分）</div>
                <div>{SUPERVISOR_REPORT}</div>
              </div>
              <div className="metric">
                <div className="l">supervisor 报告要点</div>
                <div>
                  {REPORT_POINTS.map((point) => (
                    <div key={point}>{point}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      <div className="step-desc">
        原文 Figure 4 的关键：1.25× 与 5× 都指向良性，决定性证据只在 20× 的一个小位置。
        三轮回合的任务文本、回报文本与关键 ROI 坐标均为原文数据。
      </div>
      <div className={'feedback ' + feedbackCls}>{feedback}</div>
    </div>
  );
};

export default M6CaseTrace;
