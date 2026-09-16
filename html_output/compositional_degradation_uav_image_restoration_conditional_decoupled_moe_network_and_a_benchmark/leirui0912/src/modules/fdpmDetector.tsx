import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';
import { FactorChips } from './factorChips';
import { DEGRADATIONS } from './uavScene';

// FDPM（论文 III-C 节）：P 就是 FDPM，原文称它是 "a CLIP-based multi-label degradation
// detector"，在原子因子级别（不是配置级别）预测，
//   fᵢ = Eᵥ(x) ∈ ℝᵈ（CLIP ViT-B/32，d = 512）
//   z  = h(fᵢ) ∈ ℝ^Ĉ（轻量多标签头：MLP + LayerNorm，隐层宽 2d）
//   m̂  = 1(z₁..₈ > 0.5)（式 3，阈值固定 0.5，论文没有可调阈值）
// 其中 Ĉ = D + 1 = 9，多出来的第 9 位是 clean 位；复原阶段丢弃它，只用剩下的 8 位。
// 训练用 K = 22 个对齐任务（1 clean + 21 已见），Stage I 微调视觉编码器 + 多标签头、
// 文本编码器冻结，Stage II 把 FDPM 整体冻结，为修复阶段提供 m̂ 与语义嵌入 p。
//
// 这个组件在第 4 章挂两处（类比卡与模块 4.1），两处刻意不同：
//   类比卡（moduleId === 'ana'）-> 前向流程。x → CLIP 编码器 → 多标签头 → logits（Ĉ = 9）
//        → 式(3) 按固定阈值 0.5 得到 8 位掩码 m̂，外加一个 clean 位。回答「FDPM 是什么」。
//   模块 4.1                     -> 论文 Fig. 3 讲的那件事。同一张图上叠了多种退化时，
//        常规对比对齐把整个组合当成一个独立类别、只让它对齐一个 prompt（one-hot 目标），
//        FDPM 改用标签向量之间的余弦相似度 S（式 4）当软目标，组合因此保留与成分因子的
//        重叠 —— 论文自己的例子：雨+雾 离 雨 和 雾 都比离 噪声 近。这些 S 在 9 维 0/1
//        标签向量上就是 |A∩B| / (|A||B|)^½，本模块直接按式(4) 算出来画，没有估计值。
//
// 先前两处画的是同一张图，且画了论文里没有的东西：8 根每次重绘现摇 Math.random() 的
// "置信度"条形（论文没报告过任何置信度），和一个拖动只让虚线挪位置、判定完全不参与的
// "检测阈值"滑块（论文里这个阈值是式(3) 的常数 0.5）。两处都删掉了。
//
// 8 个因子开关沿用封面与第 1、2 章共用的 FactorChips（.chip + 末尾「清除」）。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const OFF = '#eef2f6';
// 硬对齐那一条：中性灰，读起来是「旧做法」，跟绿色的软目标分得开
const HARD = '#b6c2d1';

const N = DEGRADATIONS.length;

// ---- 类比卡：前向流程 ----
const W_ANA = 560;
const H_ANA = 240;

const BIT = 30;
const GAP = 6;
const BIT_Y = 154;
// 8 位掩码与 clean 位之间空开一段：它不属于 m̂
const CLEAN_GAP = 30;

const MASK_W = N * BIT + (N - 1) * GAP;
const BX0 = (W_ANA - (MASK_W + CLEAN_GAP + BIT)) / 2;
const CLEAN_X = BX0 + MASK_W + CLEAN_GAP;

// ---- 模块 4.1：硬对齐 vs 软目标 ----
const W_MOD = 560;
const H_MOD = 306;
// 每一行 = 一个任务提示，行内两条：上=硬对齐目标，下=软目标 S
const ROW = 21;
const CHART_BOTTOM = 268;
const BAR_H = 7;
const LBL_X = 14; // 行标签左端
const DOT_X = 62; // 因子色点
const AX0 = 80; // S = 0 的位置
const AX1 = 466; // S = 1 的位置
const VAL_X = 548; // 数值右对齐位置

const rgba = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

/** 一个流程框：主行 + 副行。 */
function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  line1: string,
  line2: string
) {
  ctx.fillStyle = rgba(color, 0.12);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `11px ${FONT}`;
  ctx.fillText(line1, x + w / 2, y + h / 2);
  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText(line2, x + w / 2, y + h / 2 + 15);
}

function arrowRight(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1 - 5, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1 - 6, y - 4);
  ctx.lineTo(x1, y);
  ctx.lineTo(x1 - 6, y + 4);
  ctx.stroke();
}

// ---- 式(4)：标签向量的余弦相似度 ----

/** 论文的标签向量 tₖ ∈ {0,1}^Ĉ：8 位退化 + 第 9 位 clean（Ĉ = D + 1 = 9）。 */
const labelVec = (mask: boolean[], clean: boolean): number[] => [
  ...mask.map((b) => (b ? 1 : 0)),
  clean ? 1 : 0
];

const NO_FACTOR = DEGRADATIONS.map(() => false);
const ONLY = (i: number) => DEGRADATIONS.map((_, j) => j === i);

/**
 * 式(4)：S_ij = tᵢ·tⱼ / (‖tᵢ‖₂‖tⱼ‖₂)。
 * clean 位保证任何标签向量都不是零向量，所以分母不会为 0（clean 任务的 t 是第 9 位的单位向量）。
 */
function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * @param mask  8 个退化位（DEGRADATIONS 顺序）
 * @param clean clean 位：论文 tₖ ∈ {0,1}^Ĉ 里的第 9 位，只有 clean 任务（无退化）为 1
 */
function paintPipeline(ctx: CanvasRenderingContext2D, mask: boolean[], clean: boolean) {
  ctx.clearRect(0, 0, W_ANA, H_ANA);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = INK;
  ctx.font = `bold 12px ${FONT}`;
  ctx.fillText('CLIP 图像编码器 + 多标签头 → 退化掩码 m̂', W_ANA / 2, 24);

  // ---- 流程：x → Eᵥ → h(·) → z（Ĉ 维） ----
  const bw = [100, 170, 120, 88];
  const bx = [14, 132, 320, 458];
  const by = 44;
  const bh = 50;
  const cy = by + bh / 2;

  box(ctx, bx[0], by, bw[0], bh, BLUE, '输入 x', 'UAV 图像');
  box(ctx, bx[1], by, bw[1], bh, BLUE, 'CLIP ViT-B/32', '视觉编码器 Eᵥ');
  box(ctx, bx[2], by, bw[2], bh, BLUE, '多标签头 h(·)', 'MLP + LayerNorm');
  box(ctx, bx[3], by, bw[3], bh, ORANGE, 'logits z', 'ℝ⁹（Ĉ = 9）');
  for (let i = 0; i < 3; i++) {
    arrowRight(ctx, bx[i] + bw[i], bx[i + 1], cy, BLUE);
  }

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  // 框架没有 KaTeX，^ 会原样显示出来，所以按论文的符号写成 d = 512 与 ℝ⁹
  ctx.fillText(`fᵢ = Eᵥ(x)（d = 512），z = h(fᵢ) ∈ ℝ⁹，Ĉ = D + 1 = ${N + 1}`, W_ANA / 2, 110);

  // ---- 式(3)：硬阈值，论文里是常数 0.5 ----
  ctx.fillStyle = INK;
  ctx.font = `11px ${FONT}`;
  ctx.fillText('m̂ = 1(z₁..₈ > 0.5)　阈值固定 0.5（式 3）', W_ANA / 2, 132);

  // ---- 8 位掩码 + clean 位 ----
  DEGRADATIONS.forEach((d, i) => {
    const x = BX0 + i * (BIT + GAP);
    const on = mask[i];
    ctx.fillStyle = on ? GREEN : OFF;
    ctx.fillRect(x, BIT_Y, BIT, BIT);
    ctx.strokeStyle = on ? GREEN : LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, BIT_Y + 0.5, BIT - 1, BIT - 1);
    ctx.fillStyle = on ? '#ffffff' : SLATE;
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillText(on ? '1' : '0', x + BIT / 2, BIT_Y + 20);

    ctx.fillStyle = SLATE;
    ctx.font = `9px ${FONT}`;
    ctx.fillText(d.name, x + BIT / 2, BIT_Y + BIT + 14);
  });

  // clean 位：虚线框区别于掩码，只有无退化时为 1
  ctx.fillStyle = clean ? rgba(ORANGE, 0.18) : OFF;
  ctx.fillRect(CLEAN_X, BIT_Y, BIT, BIT);
  ctx.strokeStyle = clean ? ORANGE : LINE;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(CLEAN_X + 0.5, BIT_Y + 0.5, BIT - 1, BIT - 1);
  ctx.setLineDash([]);
  ctx.fillStyle = clean ? ORANGE : SLATE;
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText(clean ? '1' : '0', CLEAN_X + BIT / 2, BIT_Y + 20);
  ctx.fillStyle = ORANGE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('clean 位', CLEAN_X + BIT / 2, BIT_Y - 8);
  ctx.fillText('clean', CLEAN_X + BIT / 2, BIT_Y + BIT + 14);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('8 位退化掩码 m̂ 交给 CDMM 做掩码约束路由，clean 位在复原阶段丢弃', W_ANA / 2, H_ANA - 16);
}

/**
 * 模块 4.1：把每个任务提示拿到的目标权重画成条形 —— 上面一条是常规对比对齐的
 * one-hot 目标（只在完全匹配的那一个 prompt 上给 1），下面一条是 FDPM 按式(4)
 * 的标签相似度 S 给出的软目标。
 *
 * @param mask 当前选中的因子（DEGRADATIONS 顺序）
 */
function paintAlignment(ctx: CanvasRenderingContext2D, mask: boolean[]) {
  ctx.clearRect(0, 0, W_MOD, H_MOD);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const names = DEGRADATIONS.filter((_, i) => mask[i]).map((d) => d.name);
  const k = names.length;
  // 无退化时当前配置就是 clean 任务，它的标签向量是第 9 位的单位向量
  const cur = labelVec(mask, k === 0);

  // 行 = 候选任务提示。k = 1 时「当前组合」就是那一个因子，单列一行会让同一个
  // prompt 出现两次，所以从 2 个因子起才单列。k = 0 时当前配置就是 clean。
  const rows: { label: string; color?: string; vec: number[] }[] = [];
  if (k >= 2) rows.push({ label: '当前组合', vec: cur });
  DEGRADATIONS.forEach((d, i) => {
    rows.push({ label: d.name, color: d.color, vec: labelVec(ONLY(i), false) });
  });
  rows.push({ label: 'clean', vec: labelVec(NO_FACTOR, true) });

  const scored = rows.map((r) => ({ ...r, s: cosine(cur, r.vec) }));

  ctx.fillStyle = INK;
  ctx.font = `bold 12px ${FONT}`;
  ctx.fillText('硬对齐的 one-hot 目标 vs 标签相似度引导的软目标（式 4）', W_MOD / 2, 22);

  // 当前组合 + 图例
  const combo =
    k === 0
      ? '干净（clean）'
      : k <= 3
        ? names.join(' + ')
        : `${names.slice(0, 3).join(' + ')} 等 ${k} 种`;
  ctx.textAlign = 'left';
  ctx.fillStyle = SLATE;
  ctx.font = `10px ${FONT}`;
  ctx.fillText(`当前组合：${combo}`, LBL_X, 44);

  ctx.fillStyle = HARD;
  ctx.fillRect(368, 39, 18, 6);
  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('硬对齐（one-hot）', 392, 45);
  ctx.fillStyle = GREEN;
  ctx.fillRect(478, 39, 18, 6);
  ctx.fillStyle = SLATE;
  ctx.fillText('软目标 S', 502, 45);

  // 刻度：只标 0.5 与 1，画在条形下面，免得压住绿色条
  const chartTop = CHART_BOTTOM - scored.length * ROW - 4;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(AX0 + (AX1 - AX0) / 2 + 0.5, chartTop);
  ctx.lineTo(AX0 + (AX1 - AX0) / 2 + 0.5, CHART_BOTTOM);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `8px ${FONT}`;
  ctx.fillStyle = SLATE;
  ctx.textAlign = 'center';
  ctx.fillText('0.5', AX0 + (AX1 - AX0) / 2, CHART_BOTTOM + 9);
  ctx.textAlign = 'right';
  ctx.fillText('1.0', AX1, CHART_BOTTOM + 9);

  const top = CHART_BOTTOM - scored.length * ROW;
  scored.forEach((r, i) => {
    const y = top + i * ROW;
    // 硬对齐唯一认下的那一行：整行加一层浅底，跟灰条唯一一次填满对上
    const only = r.s > 1 - 1e-9;
    if (only) {
      ctx.fillStyle = rgba(BLUE, 0.07);
      ctx.fillRect(6, y, W_MOD - 12, ROW - 3);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = only ? INK : SLATE;
    ctx.font = `${only ? 'bold ' : ''}10px ${FONT}`;
    ctx.fillText(r.label, LBL_X, y + 14);

    // 因子色点：和第 1、2 章开关上的色块同一套颜色，方便对上是哪个因子
    if (r.color) {
      ctx.fillStyle = r.color;
      ctx.fillRect(DOT_X, y + 6, 7, 7);
      ctx.strokeStyle = 'rgba(33,50,74,0.35)'; // 「雪」这类近白色块在白底上要描边
      ctx.lineWidth = 1;
      ctx.strokeRect(DOT_X + 0.5, y + 6.5, 6, 6);
    }

    // 两条共用同一条 0→1 刻度：上=硬对齐，下=软目标
    const track = (by: number) => {
      ctx.fillStyle = OFF;
      ctx.fillRect(AX0, by, AX1 - AX0, BAR_H);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(AX0 + 0.5, by + 0.5, AX1 - AX0 - 1, BAR_H - 1);
    };
    track(y + 1);
    if (only) {
      ctx.fillStyle = HARD;
      ctx.fillRect(AX0, y + 1, AX1 - AX0, BAR_H);
    }
    track(y + 11);
    if (r.s > 0) {
      ctx.fillStyle = GREEN;
      ctx.fillRect(AX0, y + 11, (AX1 - AX0) * r.s, BAR_H);
    }

    // 只印软目标的 S：硬对齐非 0 即 1，看灰条满不满就够了
    ctx.textAlign = 'right';
    ctx.fillStyle = r.s > 0 ? GREEN : SLATE;
    ctx.font = `${r.s > 0 ? 'bold ' : ''}9px ${FONT}`;
    ctx.fillText(r.s.toFixed(2), VAL_X, y + 16);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('式(5)：软目标由 S 的 softmax 给出（α = 2.0），S 越大的任务权重越高', W_MOD / 2, H_MOD - 16);
}

export const FDPMDetector: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [active, setActive] = useState<string[]>([]);

  // 类比卡看流程，模块 4.1 看对齐方式
  const analogy = moduleId === 'ana';
  const W = analogy ? W_ANA : W_MOD;
  const H = analogy ? H_ANA : H_MOD;

  const toggle = (id: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // 固定按 DEGRADATIONS 顺序存放，位序稳定、可复现
      return DEGRADATIONS.filter((d) => next.has(d.id)).map((d) => d.id);
    });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = ctxRef.current;
    if (!ctx) {
      try {
        ctx = setupCanvas(canvas, W, H);
      } catch {
        // 退化路径：拿不到 2D 上下文时按 1x 画，至少不留空白
        const fallback = canvas.getContext('2d');
        if (!fallback) return;
        canvas.width = W;
        canvas.height = H;
        ctx = fallback;
      }
      ctxRef.current = ctx;
      // 跟随栏宽并限高：窄列不被裁切，宽列不被放大糊掉
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.maxWidth = W + 'px';
      canvas.style.margin = '0 auto';
      canvas.style.display = 'block';
    }

    const mask = DEGRADATIONS.map((d) => active.includes(d.id));
    if (analogy) {
      // 论文的标签是 tₖ ∈ {0,1}^Ĉ：8 位退化 + 1 位 clean，无退化时 clean 位为 1
      paintPipeline(ctx, mask, active.length === 0);
    } else {
      paintAlignment(ctx, mask);
    }

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvas);
  }, [active, analogy, W, H]);

  const names = DEGRADATIONS.filter((d) => active.includes(d.id)).map((d) => d.name);
  const n = names.length;
  const feedback = analogy
    ? n === 0
      ? { text: '无退化：8 位退化掩码全 0，clean 位为 1', cls: '' }
      : { text: `${n} 种因子各占一位，m̂ 是 8 位多热向量；clean 位在复原阶段丢弃`, cls: 'good' }
    : n === 0
      ? { text: '干净任务：与自己的 S = 1，与 8 个退化任务的 S 全为 0（Q 仍不是 one-hot，见右）', cls: '' }
      : n === 1
        ? {
            text: '只选了 1 个因子：它与自己 S = 1、与其余 7 个因子和 clean 都是 0。但 Q = softmax(2·S) 仍不是 one-hot —— 自己只分到约 0.48，剩下约 0.52 摊给其他任务；只是单因子时软硬目标的差距最小',
            cls: ''
          }
        : {
            text: `${names.join('+')} 与每个成分因子的 S = ${(1 / Math.sqrt(n)).toFixed(2)}，与无关因子、clean 均为 0；硬对齐只认一个 prompt`,
            cls: 'good'
          };

  return (
    <div className="widget-container">
      <h3 className="widget-title">{analogy ? 'FDPM检测器' : '硬对齐 vs 软目标'}</h3>
      <p className="widget-description">
        {analogy
          ? '选择图中实际存在的退化因子，看 FDPM 输出的 8 位掩码 m̂ 与 logits 的 clean 位'
          : '选一组退化因子当一个组合，看它的标签向量与各个任务提示的相似度 S：硬对齐只认一个 prompt，软目标保留了成分因子的重叠'}
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          id={`cv-${chapterId}-${moduleId}-fdpm`}
          width={W}
          height={H}
        />

        <FactorChips active={active} onToggle={toggle} onClear={() => setActive([])} />
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default FDPMDetector;
