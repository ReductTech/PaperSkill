import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';

// CDCB（论文 III-D-2 节 + Fig. 5）：Condition-Aware Dual-domain Correction Block。
//
// 论文原文的要点：
//   · 输入特征 X 与逐阶段条件向量 g，两条并行分支，最后按学习的门融合。
//   · 频率分支：2D FFT 后预测退化条件的混合权重
//       ω = softmax(W(g + W_f·GAP(X))) ∈ ℝ^M，M = 2 个频率专家；
//     每个专家出一个低秩（rank r = 4）的谱调制图
//       M⁽ᵐ⁾ = c⁽ᵐ⁾ + Σ_ℓ v_h^{(m,ℓ)} ⊗ v_w^{(m,ℓ)}；
//     另有内容自适应的 DC 校正
//       M⁽ᵐ⁾_{:,0,0} ← 1 + b_dc + η·tanh(MLP_dc([g, μ, σ]))（式 11），η = 0.1 界定
//     校正幅度；b_dc 是可学习偏置，论文没有给它的取值。
//   · 空间分支：Swin 窗口注意力，捕局部结构相关性。
//   · 门：X_out = w·X_freq + (1 − w)·X_spatial，w ∈ [0,1] 是学出来的标量。
//   · 定性描述只有一句：频谱显著的退化（blur、noise）偏频率，结构局部化的退化
//     （rain streaks）偏空间 —— 论文从未报告任何具体的 w 数值。
//
// 这个组件在第 6 章挂两处（类比卡与模块 6.1），两处刻意不同：
//   类比卡（moduleId === 'ana'）-> CDCB 长什么样：Fig. 5 的两分支 + 门的静态拓扑，
//        把四条公式各自挂在对应分支上。回答「CDCB 是什么」。
//   模块 6.1                     -> 门这一件事：w 与 1 − w 的配比条，以及论文对两类
//        退化的定性倾向。回答「w 为什么不好给定」。
//
// 先前两处挂的是同一个组件、画同一张图，且画布是纯占位图（完全没有论文里的
// M = 2 / r = 4 / η = 0.1 这些常数）；反馈行按 w 阈值给「适合雨条纹」「适合
// 模糊、噪声」的断定，读起来像论文真的报过每类退化的 w，其实是编的 —— 现在明确
// 标注 w 由网络学习、论文未报告数值，反馈只重复论文那句定性描述。
//
// 另有旧版的几何问题：输出框之前有一根 3px 的箭头被输出框盖住（画了等于没画），
// 且合并箭头没有箭头尖。已重画。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

// ---- 类比卡：Fig. 5 的静态拓扑 ----
const W_ANA = 560;
const H_ANA = 312;

// ---- 模块 6.1：门控配比 ----
const W_MOD = 560;
const H_MOD = 280;

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const BLUE = '#2f6fd0'; // 频率分支
const GREEN = '#228d5c'; // 空间分支
const ORANGE = '#f07e47'; // 门

/** 描边 + 浅底的方框。 */
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, alpha = 0.1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/** 带箭头的直线。 */
function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color = SLATE, width = 1.4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  const a = Math.atan2(y1 - y0, x1 - x0);
  const L = 6;
  ctx.beginPath();
  ctx.moveTo(x1 - L * Math.cos(a - 0.42), y1 - L * Math.sin(a - 0.42));
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - L * Math.cos(a + 0.42), y1 - L * Math.sin(a + 0.42));
  ctx.stroke();
}

/**
 * 类比卡：CDCB 的两分支 + 门。
 * 左频率、右空间，各自把论文的公式挂在自己框里；下方汇到门，再出 X_out。
 */
function paintTopology(ctx: CanvasRenderingContext2D) {
  // 画布保持透明，让卡片底色透出来（与第 1–5 章一致）
  ctx.clearRect(0, 0, W_ANA, H_ANA);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('CDCB：两条并行分支，一个学习的门', W_ANA / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文 Fig. 5 / III-D-2：给定输入特征 X 与逐阶段条件向量 g', W_ANA / 2, 40);

  // ---- 输入与分叉 ----
  box(ctx, 250, 58, 60, 26, BLUE, 0.14);
  ctx.fillStyle = INK;
  ctx.font = `bold 11px ${MONO}`;
  ctx.fillText('X', 280, 76);
  arrow(ctx, 280, 84, 280, 96, BLUE, 1.6);
  arrow(ctx, 280, 96, 148, 112, BLUE, 1.2);
  arrow(ctx, 280, 96, 412, 112, GREEN, 1.2);

  // ---- 频率分支 ----
  // 正文 8.5px：ω 那行按 9px 排会顶到框边（框内宽 240 − 2×10 内边距）
  box(ctx, 30, 112, 240, 104, BLUE, 0.08);
  ctx.textAlign = 'left';
  ctx.fillStyle = BLUE;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('频率分支', 40, 130);
  ctx.fillStyle = SLATE;
  ctx.font = `8.5px ${FONT}`;
  ctx.fillText('频谱显著的退化：blur、noise、压缩伪影', 40, 146);
  ctx.fillStyle = INK;
  ctx.font = `8.5px ${MONO}`;
  ctx.fillText('FFT → 谱调制 → 逆 FFT', 40, 166);
  // 8.5px 下希腊 ω 和门控 w 长得几乎一样，前面加「专家混合」把它和下方那个门分开
  ctx.fillText('专家混合 ω = softmax(W(g + W_f·GAP(X)))', 40, 181);
  ctx.fillText('M = 2 个专家，谱掩码 rank r = 4', 40, 196);
  ctx.fillText('DC 校正 η = 0.1 管雾/低光/过曝', 40, 211);

  // ---- 空间分支 ----
  box(ctx, 290, 112, 240, 104, GREEN, 0.08);
  ctx.fillStyle = GREEN;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('空间分支', 300, 130);
  ctx.fillStyle = SLATE;
  ctx.font = `8.5px ${FONT}`;
  ctx.fillText('结构局部化的退化：雨条纹', 300, 146);
  ctx.fillStyle = INK;
  ctx.font = `8.5px ${FONT}`;
  ctx.fillText('Swin 窗口注意力', 300, 166);
  ctx.fillText('捕局部结构相关性', 300, 181);
  ctx.fillStyle = SLATE;
  ctx.fillText('论文未报告每类退化的 w 值', 300, 196);
  ctx.fillText('w 是网络自己学出来的标量', 300, 211);

  // ---- 汇合到门 ----
  arrow(ctx, 150, 216, 250, 236, BLUE, 1.2);
  arrow(ctx, 410, 216, 310, 236, GREEN, 1.2);
  box(ctx, 228, 236, 104, 30, ORANGE, 0.14);
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `bold 10.5px ${FONT}`;
  ctx.fillText('学习的门 w ∈ [0, 1]', 280, 255);

  // ---- 输出 ----
  ctx.fillStyle = INK;
  ctx.font = `10px ${MONO}`;
  ctx.fillText('X_out = w · X_freq + (1 − w) · X_spatial', 280, 284);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('表 IV：去掉 Freq-Spa Gate → 22.09 dB（掉 0.95 dB，是 CDMM 里掉得最多的一项）', 280, 302);
}

/**
 * 模块 6.1：门控配比。
 * @param w 门控权重，纯粹是「如果 w 是这个值会怎样」的探索，不是论文报告值
 */
function paintGate(ctx: CanvasRenderingContext2D, w: number) {
  ctx.clearRect(0, 0, W_MOD, H_MOD);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('门把两条分支按 w 与 1 − w 混合', W_MOD / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文只写 w ∈ [0, 1] 是学出来的标量，全文没有报告任何具体数值', W_MOD / 2, 40);

  // ---- 配比条 ----
  const x0 = 60;
  const barW = 440;
  const y = 58;
  const h = 36;
  const wPx = Math.max(0, Math.min(barW, barW * w));

  ctx.fillStyle = BLUE;
  ctx.globalAlpha = 0.75;
  ctx.fillRect(x0, y, wPx, h);
  ctx.fillStyle = GREEN;
  ctx.globalAlpha = 0.75;
  ctx.fillRect(x0 + wPx, y, barW - wPx, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y + 0.5, barW - 1, h - 1);

  // 分界处画一根竖线，拖动时看得见边界在动
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + wPx, y);
  ctx.lineTo(x0 + wPx, y + h);
  ctx.stroke();

  // 段内标签：段太窄就不画，免得糊成一团
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 11px ${FONT}`;
  if (wPx > 96) ctx.fillText('w · X_freq', x0 + wPx / 2, y + 23);
  if (barW - wPx > 120) ctx.fillText('(1 − w) · X_spatial', x0 + wPx + (barW - wPx) / 2, y + 23);

  ctx.fillStyle = INK;
  ctx.font = `10.5px ${MONO}`;
  ctx.fillText(`w = ${w.toFixed(2)}　|　1 − w = ${(1 - w).toFixed(2)}`, W_MOD / 2, y + h + 20);

  // ---- 两条分支各自干什么 ----
  const cy = 134;
  box(ctx, 60, cy, 210, 84, BLUE, 0.08);
  ctx.textAlign = 'left';
  ctx.fillStyle = BLUE;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('频率分支', 72, cy + 18);
  ctx.fillStyle = INK;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('FFT → 谱调制 → 逆 FFT', 72, cy + 36);
  ctx.fillText('M = 2 个专家，rank r = 4', 72, cy + 52);
  ctx.fillText('DC 校正 η = 0.1', 72, cy + 68);

  box(ctx, 290, cy, 210, 84, GREEN, 0.08);
  ctx.fillStyle = GREEN;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('空间分支', 302, cy + 18);
  ctx.fillStyle = INK;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('Swin 窗口注意力', 302, cy + 36);
  ctx.fillText('捕局部结构相关性', 302, cy + 52);
  ctx.fillText('论文：雨条纹偏这边', 302, cy + 68);

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `10px ${FONT}`;
  ctx.fillText('论文的定性倾向：blur / noise 这类频谱显著退化偏频率，rain streaks 这类结构局部化退化偏空间', W_MOD / 2, 242);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('表 IV：去掉 Freq-Spa Gate → 22.09 dB（掉 0.95 dB；quad 任务掉 1.76 dB，是 CDMM 里最大的一项）', W_MOD / 2, 262);
}

export const CDCBProcessor: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [w, setW] = useState(0.5);

  // 类比卡看拓扑，模块 6.1 看门控配比
  const analogy = moduleId === 'ana';
  const W = analogy ? W_ANA : W_MOD;
  const H = analogy ? H_ANA : H_MOD;

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

    if (analogy) paintTopology(ctx);
    else paintGate(ctx, w);

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvas);
  }, [w, analogy, W, H]);

  const leans = w > 0.65 ? 'freq' : w < 0.35 ? 'spa' : 'mid';
  const feedback = analogy
    ? {
        text: '频率分支管频谱显著的退化、空间分支管结构局部化的退化，再由一个学习的门按 w 融合',
        cls: ''
      }
    : leans === 'freq'
      ? { text: 'w 偏大 → 输出更接近频率分支；论文说 blur、noise 这类频谱显著的退化会往这边偏', cls: 'good' }
      : leans === 'spa'
        ? { text: 'w 偏小 → 输出更接近空间分支；论文说 rain streaks 这类结构局部化的退化会往这边偏', cls: 'good' }
        : { text: 'w 居中 → 两条分支各出一半；这个值只是给你看的，论文没报告过任何具体 w 数值', cls: '' };

  return (
    <div className="widget-container">
      <h3 className="widget-title">{analogy ? 'CDCB 的两条分支与门' : '门控 w 的配比'}</h3>
      <p className="widget-description">
        {analogy
          ? '输入特征走频率与空间两条并行分支，频率分支做谱调制与 DC 校正，空间分支做 Swin 窗口注意力，最后按学习的门融合'
          : '拖动 w 看两条分支的配比怎么变 —— w 是网络学出来的标量，论文只给了「哪类退化偏哪边」的定性描述，没给数值'}
      </p>

      <div className="widget-content">
        <canvas ref={canvasRef} width={W} height={H} />

        {!analogy && (
          <div className="ctrl">
            <label>
              门控权重 w: <span className="val">{w.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={w}
              onChange={(e) => setW(parseFloat(e.target.value))}
            />
          </div>
        )}
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default CDCBProcessor;
