import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';
import { FactorChips } from './factorChips';
import { DEGRADATIONS } from './uavScene';

// CDMM（论文 III-D 节）：Conditioned Decoupled MoE Module。
//
// 论文 III-D 开头明写它 "contains four coordinated components"：
//   ① 退化 token 编码器 —— 把 FDPM 给的 (m̂, p) 转成逐阶段的条件向量 {gₛ}ₛ₌₁⁵
//   ② 空间-频率混合骨干 —— 5 阶段 U 形，通道宽度 [24, 48, 96, 48, 24]，每阶段一个 CDCB
//   ③ DC-MoE 前馈 —— 按掩码先激活相关专家，再在激活子集内路由
//   ④ 低频基座分支 —— 粗光照校正
//
// 第 ① 个组件里最值得注意的是「严格 token 掩码」：论文原文说 m̂ⱼ = 0 的退化 token
// 是通过 hard key padding mask 排除的，"rather than softly down-weighted" —— 是硬排除，
// 不是把权重压低。表 III 里这一项单独消融过（去掉 → 22.48 dB，掉 0.56 dB）。
//
// 这个组件在第 5 章挂两处（类比卡与模块 5.1），两处刻意不同：
//   类比卡（moduleId === 'ana'）-> 四个协同组件怎么串起来，静态总览图，回答「CDMM 是什么」。
//   模块 5.1                     -> 「严格 token 掩码」这一件事：U 里 10 个 token 谁参与
//        注意力、谁被划掉，5 个阶段查询各自得到什么。回答「为什么要硬排除」。
//
// 先前两处挂的是同一个组件、画同一张图，且画的是「掩码直接激活 1 个专家」这种硬 1:1 映射
// （论文是式(13) 的掩码 × 门控后重归一化，没有硬 1:1），模块名还和第 8 章的 DC-MoE 路由器
// 撞车。两处现在分开，模块 5.1 改名为「退化 token 编码器」（路由是 DC-MoE 那个组件的事）。
//
// 8 个因子开关沿用封面与第 1、2、4 章共用的 FactorChips（.chip + 末尾「清除」）。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

// ---- 类比卡：四个协同组件总览 ----
const W_ANA = 560;
const H_ANA = 250;

// ---- 模块 5.1：退化 token 编码器 ----
const W_MOD = 560;
const H_MOD = 278;
const TOK = 32; // token 方格边长
const TOK_GAP = 8;

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const OFF = '#f4f6f9';

const SUB = ['₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈'];

/** 描边 + 浅底的方框。 */
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, alpha = 0.12) {
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
 * 类比卡：CDMM 的四个协同组件。
 * 主链路 x → ② 骨干（含 ③）→ ④ 基座分支；条件链路 (m̂, p) → ① 编码器 → 逐阶段注入。
 */
function paintAnalogy(ctx: CanvasRenderingContext2D) {
  // 画布保持透明，让卡片底色透出来（与第 1–4 章一致）
  ctx.clearRect(0, 0, W_ANA, H_ANA);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('CDMM：退化线索驱动的选择性修复', W_ANA / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文 III-D：CDMM 含四个协同组件', W_ANA / 2, 40);

  // ---- 主链路 ----
  // 输入 x
  box(ctx, 12, 72, 46, 28, BLUE, 0.14);
  ctx.fillStyle = INK;
  ctx.font = `11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('x', 35, 90);
  arrow(ctx, 58, 86, 74, 86, BLUE);

  // ②（含 ③）：一个框里两行，因为它们都是「每阶段」重复的
  box(ctx, 76, 52, 336, 64, ORANGE, 0.09);
  ctx.fillStyle = INK;
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('② 空间-频率混合骨干 · 5 阶段', 92, 76);
  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('通道宽度 24 / 48 / 96 / 48 / 24', 92, 94);
  ctx.fillText('③ 每阶段：CDCB 双域校正 → DC-MoE 前馈', 92, 110);
  arrow(ctx, 412, 86, 430, 86, BLUE);

  // ④ 低频基座分支
  box(ctx, 430, 52, 118, 64, BLUE, 0.12);
  ctx.fillStyle = INK;
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('④ 低频基座分支', 489, 76);
  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('ŷ = ŷ_base + ŷ_res', 489, 94);
  ctx.fillText('粗光照校正', 489, 110);

  // ---- 条件链路 ----
  box(ctx, 12, 176, 52, 46, BLUE, 0.14);
  ctx.fillStyle = INK;
  ctx.font = `bold 10.5px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('m̂, p', 38, 196);
  ctx.fillStyle = SLATE;
  ctx.font = `8.5px ${FONT}`;
  ctx.fillText('来自 FDPM', 38, 212);
  arrow(ctx, 64, 199, 76, 199, BLUE);

  box(ctx, 76, 176, 336, 46, GREEN, 0.1);
  ctx.fillStyle = INK;
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('① 退化 Token 编码器', 92, 196);
  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('U = [u₁ … u₈ ; u_p ; u_g]，形状 (D + 2) × e，e = 256', 92, 212);

  // 条件逐阶段注入骨干：从 ① 顶部往上回到 ② 的底部
  arrow(ctx, 244, 176, 244, 120, GREEN, 1.4);
  ctx.fillStyle = GREEN;
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('{gₛ}ₛ₌₁₅', 252, 150);

  // 论文英文原句的译文：emphasize the correction pathways relevant to the detected
  // factors while suppressing irrelevant ones（III-D 开头）
  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('强调与检出因子相关的校正通路，抑制无关通路', W_ANA / 2, 238);
}

/**
 * 模块 5.1：严格 token 掩码。
 * @param mask 8 个退化位；m̂ⱼ = 0 的退化 token 被硬 key 掩码排除
 */
function paintEncoder(ctx: CanvasRenderingContext2D, mask: boolean[]) {
  ctx.clearRect(0, 0, W_MOD, H_MOD);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('严格 token 掩码：m̂ⱼ = 0 的退化 token 被硬排除', W_MOD / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('U = [u₁ … u₈ ; u_p ; u_g]，形状 (D + 2) × e，e = 256', W_MOD / 2, 40);

  // ---- 10 个 token ----
  const total = (DEGRADATIONS.length + 2) * TOK + (DEGRADATIONS.length + 1) * TOK_GAP;
  const x0 = (W_MOD - total) / 2;
  const y = 60;

  // 前 8 个是退化 token（顺序与 DEGRADATIONS 一致），后两个是语义 token 与全局 token
  const tokens = [
    ...DEGRADATIONS.map((d, i) => ({
      sym: `u${SUB[i]}`,
      name: d.name,
      color: d.color,
      on: mask[i]
    })),
    { sym: 'u_p', name: '语义', color: BLUE, on: true },
    { sym: 'u_g', name: '全局', color: BLUE, on: true }
  ];

  tokens.forEach((t, i) => {
    const x = x0 + i * (TOK + TOK_GAP);

    ctx.fillStyle = t.on ? t.color : OFF;
    ctx.globalAlpha = t.on ? 0.22 : 1;
    ctx.fillRect(x, y, TOK, TOK);
    ctx.globalAlpha = 1;

    // 被排除的 token 用虚线框 + 一道斜杠，与参与注意力的 token 一眼分开
    ctx.strokeStyle = t.on ? t.color : LINE;
    ctx.lineWidth = t.on ? 1.5 : 1;
    ctx.setLineDash(t.on ? [] : [3, 3]);
    ctx.strokeRect(x + 0.5, y + 0.5, TOK - 1, TOK - 1);
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.fillStyle = t.on ? INK : SLATE;
    ctx.font = `${t.on ? 'bold ' : ''}11px ${MONO}`;
    ctx.fillText(t.sym, x + TOK / 2, y + TOK / 2 + 4);

    if (!t.on) {
      ctx.strokeStyle = SLATE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + TOK - 5);
      ctx.lineTo(x + TOK - 5, y + 5);
      ctx.stroke();
    }

    ctx.fillStyle = SLATE;
    ctx.font = `9px ${FONT}`;
    ctx.fillText(t.name, x + TOK / 2, y + TOK + 14);
  });

  // ---- 交叉注意力 ----
  arrow(ctx, W_MOD / 2, y + TOK + 24, W_MOD / 2, y + TOK + 56, GREEN, 1.6);
  ctx.textAlign = 'left';
  ctx.fillStyle = GREEN;
  ctx.font = `10px ${FONT}`;
  // 按论文文本层能取到的写法照录（第三个参数的转置上标在 PDF 里丢了）
  ctx.fillText('4 头交叉注意力　Z = Attn(Q, U, U)，再过 FFN', W_MOD / 2 + 12, y + TOK + 44);

  // ---- 5 个阶段：各自一个查询，各自得到该阶段的条件向量 ----
  const SW = 92;
  const SGAP = 12;
  const sRowW = 5 * SW + 4 * SGAP;
  const sx0 = (W_MOD - sRowW) / 2;
  const sy = 164;

  for (let s = 0; s < 5; s++) {
    const x = sx0 + s * (SW + SGAP);
    box(ctx, x, sy, SW, 42, GREEN, 0.1);
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = `bold 10.5px ${MONO}`;
    ctx.fillText(`q${SUB[s]} → g${SUB[s]}`, x + SW / 2, sy + 18);
    ctx.fillStyle = SLATE;
    ctx.font = `9px ${FONT}`;
    ctx.fillText(`阶段 ${s + 1}`, x + SW / 2, sy + 34);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `10px ${FONT}`;
  ctx.fillText('m̂ⱼ = 1 的退化 token 参与键值集合；m̂ⱼ = 0 的被硬 key 掩码排除，不是软降权', W_MOD / 2, 228);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('表 III：去掉严格 token 掩码 → 22.48 dB（掉 0.56 dB）；换成软掩码 → 22.89 dB', W_MOD / 2, 252);
}

export const CDMMRouter: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [active, setActive] = useState<string[]>(['haze', 'rain']);

  // 类比卡看总览，模块 5.1 看 token 谁被排除
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
    if (analogy) paintAnalogy(ctx);
    else paintEncoder(ctx, mask);

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvas);
  }, [active, analogy, W, H]);

  const n = active.length;
  const names = DEGRADATIONS.filter((d) => active.includes(d.id)).map((d) => d.name);
  const feedback = analogy
    ? {
        text: '退化线索 (m̂, p) 先变成 5 个阶段的条件向量，再逐阶段注入骨干；基座分支单独管粗光照',
        cls: ''
      }
    : n === 0
      ? { text: '没有因子：8 个退化 token 全部被硬排除，参与注意力的只剩 u_p 和 u_g', cls: '' }
      : {
          text: `${names.join('+')}：${n} 个退化 token + u_p + u_g = ${n + 2} 个 token 参与注意力，其余 ${8 - n} 个被硬排除`,
          cls: 'good'
        };

  return (
    <div className="widget-container">
      <h3 className="widget-title">{analogy ? 'CDMM 的四个协同组件' : '退化 token 编码器'}</h3>
      <p className="widget-description">
        {analogy
          ? '退化线索先编码成逐阶段的条件向量，再注入 5 阶段骨干；DC-MoE 与低频基座分支各自负责一类校正'
          : '点选退化因子，看哪些 token 参与注意力、哪些被硬 key 掩码排除 —— 论文强调是硬排除，不是把权重压低'}
      </p>

      <div className="widget-content">
        <canvas ref={canvasRef} width={W} height={H} />

        {!analogy && (
          <FactorChips active={active} onToggle={toggle} onClear={() => setActive([])} />
        )}
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default CDMMRouter;
