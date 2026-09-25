import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
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

// Module 4.2 —— 什么时候可以说「够了」
// One dominant operation: step the paper's real Figure 4 thyroid case round by
// round and decide when to stop for a diagnosis. Stop too early and you land on
// the benign reading the paper's supervisor refused to accept.
// 画法：一台可辨认的显微镜（物镜随轮次 0→1→2）+ 一个大圆形镜下视野，视野按真实倍率重画：
//       第 1 轮 1.25× 腺体、第 2 轮 5×、第 3 轮 20× 且出现血管内肿瘤细胞；
//       右侧报告单逐轮记下该轮的原文所见。真实任务/回报原文全部写在 DOM。

const W = 1080;
const H = 280;

// Real ROI coordinates from the paper are on a 0–50000 slide axis and are printed
// verbatim in the DOM detail region (本轮关键 ROI).
const TAU = Math.PI * 2;

// ---- 画布几何：显微镜（底座落在实验台上）+ 大圆形镜下视野 + 报告单 ----
// drawMicroscope 以 (x, y) 为机身局部原点（scale 1 时底座下沿在 y+96、顶端在 y-95），
// 因此让它站上 254px 处的台面：y = 254 - 96 * 1.05 ≈ 153。
const SCOPE = { x: 150, y: 153, scale: 1.05 };
const VIEW_CX = 450;
const VIEW_CY = 132;
const VIEW_R = 104;
const SHEET = { x: 640, y: 44, w: 380, h: 196 };

/** 每轮在报告单上留下的短行（原文 log 的压缩写法，完整原文在 DOM）。 */
const SHORT_LOG: string[] = ['包膜完整', '未见侵犯', '血管侵犯'];

interface Region {
  x: number;
  y: number;
}

interface RoundRow {
  mag: string;
  radius: number;
  task: string;
  report: string;
  log: string;
  region: Region;
  extra: Region | null;
}

const ROUNDS: RoundRow[] = [
  {
    mag: '1.25×',
    radius: 112,
    task: '以 1.25× 检查区域 0，注意结节性、乳头状结构或异常滤泡结构。',
    report: '1.25×：多个包膜完整的结节，细胞密集均匀、异型性极小，倾向良性滤泡性病变；建议对选定区域做更高倍复查。',
    log: '1.25×：多个包膜完整的结节，细胞密集均匀',
    region: { x: 24949, y: 19719 },
    extra: null,
  },
  {
    mag: '5×',
    radius: 64,
    task: '在 (38234, 27000) 与 (38234, 5434) 附近以 5× 检查，注意包膜与周围实质的交界，评估细胞均匀性以及出血、坏死迹象。',
    report: '5×：结节边界清楚、包膜完整，滤泡大小不一但上皮均匀，未见侵犯，支持良性滤泡性过程。',
    log: '5×：结节边界清楚、包膜完整，未见侵犯',
    region: { x: 38234, y: 27000 },
    extra: { x: 38234, y: 5434 },
  },
  {
    mag: '20×',
    radius: 28,
    task: '在 (25000, 10000) 附近以 20× 确认包膜完整性，评估滤泡细胞均匀性、胶质形态与核分裂情况，记录间质与血管的可疑改变。',
    report: '20×：肿瘤细胞核增大、包膜透亮，侵入内皮衬里的血管，在滤泡结构背景下确认滤泡型甲状腺癌（FTC）。',
    log: '20×：核增大、包膜透亮，侵入内皮衬里血管',
    region: { x: 25000, y: 10000 },
    extra: { x: 35000, y: 35000 },
  },
];

const MAX_ROUND = ROUNDS.length;

const STEP_FEEDBACK: string[] = [
  '病例输入只有一句临床信息，supervisor 的初始鉴别同时挂着癌与良性病变——先做一轮低倍结构评估，再决定下一步看哪里。',
  '1.25×：多个包膜完整的结节，细胞均匀、异型性小，倾向良性滤泡性病变。',
  '5×：包膜完整、未见侵犯，仍支持良性——注意此时还不能下结论。',
  '20×：核增大、包膜透亮，侵入内皮衬里的血管 → 滤泡型甲状腺癌（FTC）。',
];

const EARLY_STOP =
  '原文的 supervisor 在这两轮都没有置位 sufficient_evidence：5× 时包膜仍完整、未见侵犯。此时收工会得到与金标准不符的结论。';
const FINAL_STOP =
  '20× 发现血管侵犯 → PathChat+ 诊断：滤泡型甲状腺癌（FTC）。supervisor 此时置位 sufficient_evidence=True。滤泡型腺瘤被血管侵犯排除，乳头状甲状腺癌因缺乏特征性核特征被排除。';

/** 轮次 → 物镜转盘档位（0=低倍 4×、1=中倍 10×、2=高倍 40×）。 */
function objectiveAt(round: number): 0 | 1 | 2 {
  if (round <= 1) return 0;
  if (round === 2) return 1;
  return 2;
}

/** 轮次 → 镜下真实倍率：1.25× → 5× → 20×。 */
function magnificationAt(round: number): 1.25 | 5 | 20 {
  if (round <= 1) return 1.25;
  if (round === 2) return 5;
  return 20;
}

export const M4StopThreshold: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ round: number }>({ round: 0 });
  const rafRef = useRef<number | null>(null);
  const [round, setRound] = useState(0);
  const [verdict, setVerdict] = useState<{ text: string; cls: '' | 'good' | 'bad' } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // 换轮时视野做一个短促的「对焦」过渡。
    let lastRound = -1;
    let focusAt = -1e6;

    const render = (s: { round: number }, now: number) => {
      const r = clamp(Math.round(s.round), 0, MAX_ROUND);
      clearScene(ctx, W, H);

      if (r !== lastRound) {
        lastRound = r;
        focusAt = now;
      }
      const focus = easeOutCubic(clamp((now - focusAt) / 420, 0, 1));
      const radius = VIEW_R * (1.05 - 0.05 * focus);

      const objective = objectiveAt(r);
      const magnification = magnificationAt(r);
      const lesion: 'none' | 'vessel' = r >= MAX_ROUND ? 'vessel' : 'none';
      const ringColor = r >= MAX_ROUND ? SKIN.green : SKIN.blue;

      // ---- 左：一台可辨认的显微镜，物镜随轮次换档 ----
      drawMicroscope(ctx, SCOPE.x, SCOPE.y, SCOPE.scale, { objective });

      // ---- 中：大圆形镜下视野，按本轮真实倍率渲染 ----
      ctx.save();
      ctx.globalAlpha = 0.45 + 0.55 * focus;
      ctx.beginPath();
      ctx.arc(VIEW_CX, VIEW_CY, radius, 0, TAU);
      ctx.clip();
      ctx.fillStyle = SKIN.lumen;
      ctx.fillRect(VIEW_CX - radius, VIEW_CY - radius, radius * 2, radius * 2);
      drawTissueField(ctx, VIEW_CX - radius, VIEW_CY - radius, radius * 2, radius * 2, {
        seed: 11 + r * 7,
        magnification,
        lesion,
      });
      ctx.restore();

      // 目镜金属环 + 当前档位色环。
      ctx.save();
      ctx.strokeStyle = SKIN.metal;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(VIEW_CX, VIEW_CY, radius + 3.5, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(VIEW_CX, VIEW_CY, radius + 8, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // ---- 右：报告单，每完成一轮加一行原文所见 ----
      drawReportSheet(
        ctx,
        SHEET.x,
        SHEET.y,
        SHEET.w,
        SHEET.h,
        ROUNDS.slice(0, r).map((row, i) => SHORT_LOG[i] ?? row.log)
      );

      // 至多两个画布内标签 + 一个图例；数值可裸写。
      drawLabel(ctx, VIEW_CX - VIEW_R, 16, '镜下视野', SKIN.text, 15);
      drawLabel(ctx, SHEET.x, 30, '报告单', SKIN.text, 15);
      drawLabel(ctx, VIEW_CX - VIEW_R, 246, r > 0 ? ROUNDS[Math.min(r, MAX_ROUND) - 1].mag : '0×', SKIN.blue, 16);
      if (r >= MAX_ROUND) {
        drawLegend(ctx, VIEW_CX + 60, 246, [{ label: '血管侵犯', color: SKIN.green }]);
      }
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

  const nextRound = () => {
    const r = clamp(stateRef.current.round + 1, 0, MAX_ROUND);
    stateRef.current = { round: r };
    setRound(r);
    setVerdict(null);
  };

  const reset = () => {
    stateRef.current = { round: 0 };
    setRound(0);
    setVerdict(null);
  };

  const decide = () => {
    if (round === 0) {
      setVerdict({
        text: '一轮观察都还没做：原文的 supervisor 等到证据足够才置位 sufficient_evidence，此时下诊断没有任何证据支撑。',
        cls: '',
      });
      return;
    }
    if (round < MAX_ROUND) {
      setVerdict({ text: EARLY_STOP, cls: 'bad' });
      return;
    }
    setVerdict({ text: FINAL_STOP, cls: 'good' });
  };

  const done = round >= MAX_ROUND;
  const shown = round === 0 ? null : ROUNDS[round - 1];
  const stepText =
    round === 0 ? '病例已就绪：甲状腺切除，男性，无其他临床信息。' : STEP_FEEDBACK[round];
  const feedback: { text: string; cls: '' | 'good' | 'bad' } =
    verdict ?? { text: stepText, cls: '' };

  const diagnosis =
    verdict === null
      ? '尚未下诊断'
      : round >= MAX_ROUND
      ? '滤泡型甲状腺癌（FTC）'
      : '良性滤泡性病变 / 滤泡型腺瘤';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={nextRound} disabled={done}>
          {done ? '已完成' : '下一轮观察'}
        </button>
        <button type="button" className="tiny ghost" onClick={decide}>
          就此下诊断
        </button>
        <button type="button" className="tiny ghost" onClick={reset}>
          重置
        </button>
        <span className="step-label">
          轮次 <b>{round + ' / ' + MAX_ROUND}</b>
        </span>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前轮次倍率</div>
          <div className="v">{shown ? shown.mag : '尚未观察'}</div>
        </div>
        <div className="metric">
          <div className="l">sufficient_evidence</div>
          <div className="v">{round >= MAX_ROUND ? 'True' : 'False'}</div>
        </div>
        <div className="metric">
          <div className="l">当前诊断结论</div>
          <div className="v">{diagnosis}</div>
        </div>
      </div>
      {shown === null ? (
        <div className="step-desc">
          任务原文要点：为该全切片图像中的疾病给出诊断。supervisor 初始鉴别：乳头状甲状腺癌、滤泡型癌、
          髓样癌，以及结节性甲状腺肿等良性病变（理由是需要结构评估来收窄）。
        </div>
      ) : (
        <div>
          <div className="metrics">
            <div className="metric">
              <div className="l">本轮任务原文要点</div>
              <div>{shown.task}</div>
            </div>
            <div className="metric">
              <div className="l">本轮 explorer 回报原文要点</div>
              <div>{shown.report}</div>
            </div>
          </div>
          <div className="step-desc">
            本轮关键 ROI：({shown.region.x}, {shown.region.y}) @ {shown.mag}
            {shown.extra ? ' 与 (' + shown.extra.x + ', ' + shown.extra.y + ') @ ' + shown.mag : ''}
          </div>
        </div>
      )}
      {round >= MAX_ROUND ? (
        <div className="step-desc">
          supervisor 报告要点：镜下见包膜完整的滤泡结节、上皮均匀，一处见血管侵犯，无乳头状核特征；
          FTC 由血管侵犯确立，滤泡型腺瘤因血管侵犯被排除，乳头状甲状腺癌因缺乏特征性核特征被排除。
          无需追加检查即可确认诊断。（原文要点）
        </div>
      ) : null}
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M4StopThreshold;
