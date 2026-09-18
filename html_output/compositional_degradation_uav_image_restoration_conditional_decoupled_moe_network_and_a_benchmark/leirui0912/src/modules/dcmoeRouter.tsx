import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';
import { FactorChips } from './factorChips';
import { DEGRADATIONS } from './uavScene';

// DC-MoE（论文 III-D-3 节，式 13 / 式 14）。第 8 章的第二个模块。
//
// 论文原文：
//   · 专家分两组：Eg = 3 个全局专家（雾、低光、过曝，场景级退化），
//     Es = 5 个空间专家（雨、雪、模糊、噪声、伪影，局部退化）。
//   · 掩码先选出候选专家，两个独立门控再在激活子集上给权重，然后重归一化：
//       ω̂_g = Renorm(ω_g ⊙ m̂_g)，ω̂_s = Renorm(ω_s ⊙ m̂_s)        (13)
//     其中 m̂_g 选 {雾, 低光, 过曝} 三位，m̂_s 选 {雨, 雪, 模糊, 噪声, 伪影} 五位。
//   · 空间专家另外预测一张取值在 [0,1] 的 H×W 空间路由图 R_j，用来定位专家响应。
//   · FFN_MoE(X) = B(X) + Σ_i ω̂_i^g E_i^g(X) + Σ_j ω̂_j^s R_j ⊙ E_j^s(X)   (14)
//     B(·) 是基座分支，作用是「万一没有任何专家被激活也还有非零容量」。
//
// 旧版的问题：自带一套 EXPERTS 表，颜色是 #8b5cf6 / #06b6d4，和封面、第 1–5 章
// 用的 DEGRADATIONS 对不上（同一个「雨」三处三个颜色）；按 deg 字符串硬查表做
// 1:1 激活，论文写的是「掩码 × 门控后重归一化」的软权重，没有硬 1:1；六个按钮里
// 有四个键（过曝 / 雪 / 噪声 / 伪影 / 雨+低光）查不到映射，点了等于没反应；反馈行
// 直接打印英文 id。现在改成 8 个因子开关 + 两组各自重归一化的条形图。
//
// 门控 ω 的取值论文没有报告，所以这里按「组内均分」画，并在画布上写明这一点 ——
// 要看的不是那几个数字，而是「掩码先把未激活的专家清零，剩下的再在组内重归一化」。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

const W = 560;
const H = 322;

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const OFF = '#f4f6f9';
const ORANGE = '#f07e47'; // 全局组
const PURPLE = '#7c5cd6'; // 空间组

// 两组的成员与论文一致；顺序沿用全站共用的 DEGRADATIONS
const GROUP_IDS = {
  global: ['haze', 'lowlight', 'overexpose'],
  spatial: ['rain', 'snow', 'blur', 'noise', 'artifact']
};

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

/**
 * 画一组专家。
 * @param ids 该组的 8 位掩码里属于本组的那几位（顺序固定）
 * @param active 已激活的因子 id
 * @param groupColor 组框的颜色
 */
function paintGroup(
  ctx: CanvasRenderingContext2D,
  x: number,
  ids: string[],
  active: string[],
  groupColor: string,
  title: string,
  spatial: boolean
) {
  const rowY0 = 86;
  const rowStep = 26;
  const h = rowY0 - 56 + ids.length * rowStep + 4;

  box(ctx, x, 56, 250, h, groupColor, 0.05);

  ctx.textAlign = 'left';
  ctx.fillStyle = groupColor;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText(title, x + 16, 74);

  // 掩码 × 门控后重归一化：论文没给 ω，按组内均分画
  const k = ids.filter((id) => active.includes(id)).length;
  const w = k ? 1 / k : 0;

  ids.forEach((id, i) => {
    const y = rowY0 + i * rowStep;
    const d = DEGRADATIONS.filter((g) => g.id === id)[0];
    const on = active.includes(id);

    // 因子名
    ctx.fillStyle = on ? INK : SLATE;
    ctx.font = `10px ${FONT}`;
    ctx.fillText(d.name, x + 16, y + 16);

    // 掩码位 m̂_j
    ctx.fillStyle = on ? d.color : OFF;
    ctx.fillRect(x + 54, y + 7, 11, 11);
    ctx.strokeStyle = on ? d.color : LINE;
    ctx.lineWidth = 1;
    ctx.setLineDash(on ? [] : [2, 2]);
    ctx.strokeRect(x + 54.5, y + 7.5, 10, 10);
    ctx.setLineDash([]);

    // 路由权重条
    ctx.fillStyle = OFF;
    ctx.fillRect(x + 72, y + 6, 80, 13);
    if (on) {
      ctx.fillStyle = d.color;
      ctx.fillRect(x + 72, y + 6, 80 * w, 13);
    }
    ctx.strokeStyle = LINE;
    ctx.strokeRect(x + 72.5, y + 6.5, 79, 12);

    ctx.fillStyle = on ? INK : SLATE;
    ctx.font = `9px ${MONO}`;
    ctx.fillText(on ? `ω̂ = ${w.toFixed(2)}${spatial ? ' · R' : ''}` : 'ω̂ = 0', x + 158, y + 16);
  });
}

/** DC-MoE：两组专家各自的掩码与重归一化。 */
function paintRouter(ctx: CanvasRenderingContext2D, active: string[]) {
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('掩码先清零，再在激活子集内重归一化', W / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文式(13)：ω̂_g = Renorm(ω_g ⊙ m̂_g)，ω̂_s = Renorm(ω_s ⊙ m̂_s)', W / 2, 40);

  paintGroup(ctx, 24, GROUP_IDS.global, active, ORANGE, '全局组 Eg = 3　场景级退化', false);
  paintGroup(ctx, 286, GROUP_IDS.spatial, active, PURPLE, '空间组 Es = 5　局部退化', true);

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文没有报告门控 ω 的取值：这里按组内均分画，重点看掩码先把未激活的专家清零、剩下的再在组内重归一化', W / 2, 248);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('空间专家的输出还要再乘一张 H×W 的空间路由图 Rⱼ（论文说它落在 [0,1]，只给了作用没给形式）', W / 2, 266);

  ctx.fillStyle = INK;
  ctx.font = `9.5px ${MONO}`;
  ctx.fillText('FFN_MoE(X) = B(X) + Σᵢ ω̂ᵢᵍ Eᵢᵍ(X) + Σⱼ ω̂ⱼˢ Rⱼ ⊙ Eⱼˢ(X)', W / 2, 290);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('表 IV：去掉 DC-MoE 22.34 dB（掉 0.70）；去掉解耦门控 22.46 dB（掉 0.58）；去掉空间路由 22.76 dB（掉 0.28）', W / 2, 310);
}

export const DCMoERouter: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [active, setActive] = useState<string[]>(['haze', 'rain']);

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

    paintRouter(ctx, active);
    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvas);
  }, [active]);

  const kg = GROUP_IDS.global.filter((id) => active.includes(id)).length;
  const ks = GROUP_IDS.spatial.filter((id) => active.includes(id)).length;
  const names = DEGRADATIONS.filter((d) => active.includes(d.id)).map((d) => d.name);

  const feedback =
    active.length === 0
      ? {
          text: '一个因子都没选：两组专家的掩码全为 0、ω̂ 全为 0，输出只剩基座分支 B(X) —— 这正是式(14) 里 B(·) 的作用',
          cls: 'good'
        }
      : {
          text: `${names.join('+')}：全局组激活 ${kg}/3、空间组激活 ${ks}/5；被掩码的专家 ω̂ 恒为 0，激活的在各自组内重归一化`,
          cls: 'good'
        };

  return (
    <div className="widget-container">
      <h3 className="widget-title">两组专家的掩码与路由权重</h3>
      <p className="widget-description">
        {moduleId === 'ana'
          ? '点因子看它落到哪一组；条形长度是组内重归一化之后的权重'
          : '点因子切换掩码位，再点「清除」把两组一起清空，看没有专家被激活时输出还剩什么'}
      </p>

      <div className="widget-content">
        <canvas ref={canvasRef} width={W} height={H} />
        <FactorChips active={active} onToggle={toggle} onClear={() => setActive([])} />
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default DCMoERouter;
