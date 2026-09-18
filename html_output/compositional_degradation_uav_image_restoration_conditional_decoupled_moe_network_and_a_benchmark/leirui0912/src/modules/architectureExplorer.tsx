import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';

// 第 8 章两个位置：
//   · 上方类比卡（moduleId === 'ana'）-> 论文 III-D-4 的 Base-Residual 双分支重建
//     （式 15，用户选定）。教程原先完全没讲这一块。回答「双分支重建是什么」。
//   · 模块 8.1 架构浏览器 -> 整条链路上每一段的数据形状与来历。回答「数据怎么流」。
//
// 8.1 旧版的问题：链路上的组件里有「CDMM Stage 1」「CDMM Stage 2」两个名字，论文里
// 根本没有 —— CDMM 内部的 5 阶段是 U 形骨干的 5 个 stage，不是两个级联的 CDMM。
// 整块已按论文重写：FDPM → 退化 token 编码器 → 5 阶段 U 形骨干（通道
// 24/48/96/48/24，每阶段 CDCB + DC-MoE）→ 低频基座分支 → ŷ = ŷ_base + ŷ_res。
// 描述里的常数（e = 256、4 头、S = 5、Eg = 3 / Es = 5、4× 下采样）都出自论文。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

// ---- 类比卡：Base-Residual 双分支（式 15）----
const W_ANA = 560;
const H_ANA = 306;

// ---- 模块 8.1：架构浏览器 ----
const W_MOD = 560;
const H_MOD = 348;

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const BLUE = '#2f6fd0';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const PURPLE = '#7c5cd6';

const BOX_X = 30;
const BOX_W = 220;
const BOX_Y0 = 58;
const BOX_H = 34;
const BOX_STEP = 48;

/** 链路上的每一段。name 是画在方块里的短名，lines 是右侧面板里的说明。 */
const CHAIN = [
  {
    id: 'input',
    chip: '输入',
    name: '输入退化图像 x',
    color: BLUE,
    lines: ['形状 3 × H × W', '一张图里最多同时含 4 种因子', '（MDUR 的 43 种有效配置之一）']
  },
  {
    id: 'fdpm',
    chip: 'FDPM',
    name: 'FDPM · 因子级退化感知',
    color: GREEN,
    lines: [
      'CLIP ViT-B/32（d = 512）+ 多标签头',
      'm̂ = 1[z₁:₈ ≥ 0.5]，另给图像嵌入 p',
      'Stage I 训到收敛即冻结，后面不再更新'
    ]
  },
  {
    id: 'encoder',
    chip: '编码器',
    name: '退化 token 编码器',
    color: ORANGE,
    lines: [
      'U = [u₁ … u₈ ; u_p ; u_g]，e = 256',
      '4 头交叉注意力 Z = Attn(Q, U, U)',
      '{gₛ}ₛ₌₁₅ = Z 的第 s 行（S = 5）',
      'm̂ⱼ = 0 的退化 token 走硬 key 掩码'
    ]
  },
  {
    id: 'backbone',
    chip: '骨干',
    name: 'CDMM · U 形骨干（5 阶段）',
    color: PURPLE,
    lines: [
      '通道宽度 24 / 48 / 96 / 48 / 24',
      '每阶段一个 CDCB（双分支，据 Fig. 4）',
      '每阶段再过一个 DC-MoE 前馈（据 Fig. 4）',
      'Eg = 3 全局专家 / Es = 5 空间专家'
    ]
  },
  {
    id: 'base',
    chip: '基座',
    name: '低频基座分支',
    color: BLUE,
    lines: [
      '输入 4× 双线性下采样',
      '低分辨率轻量 CNN 处理',
      '上采样回原分辨率得 ŷ_base',
      '由 L_base 监督到引导滤波目标'
    ]
  },
  {
    id: 'output',
    chip: '输出',
    name: '输出 ŷ',
    color: GREEN,
    lines: ['ŷ = ŷ_base + ŷ_res', '骨干只预测全分辨率的残差 ŷ_res', '残差通路不吸收粗光照误差']
  }
];

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
 * 类比卡：Base-Residual 双分支重建（式 15）。
 * 上面是输入，左边基座分支管低频/光照，右边残差分支管高频细节，最后相加。
 */
function paintDualBranch(ctx: CanvasRenderingContext2D) {
  // 画布保持透明，让卡片底色透出来（与第 1–7 章一致）
  ctx.clearRect(0, 0, W_ANA, H_ANA);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('Base-Residual 双分支重建', W_ANA / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文 III-D-4 / 式(15)：粗光照校正与细节恢复对解码器的要求不同，所以拆成两支', W_ANA / 2, 40);

  // ---- 输入 ----
  box(ctx, 250, 58, 60, 26, BLUE, 0.14);
  ctx.fillStyle = INK;
  ctx.font = `bold 11px ${MONO}`;
  ctx.fillText('x', 280, 76);
  arrow(ctx, 280, 84, 280, 96, BLUE, 1.6);
  arrow(ctx, 280, 96, 146, 104, BLUE, 1.2);
  arrow(ctx, 280, 96, 414, 104, GREEN, 1.2);

  // ---- 基座分支 ----
  box(ctx, 30, 104, 232, 96, BLUE, 0.08);
  ctx.textAlign = 'left';
  ctx.fillStyle = BLUE;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('基座分支 · 低频 / 光照', 42, 124);
  ctx.fillStyle = INK;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('输入 4× 双线性下采样', 42, 146);
  ctx.fillText('低分辨率轻量 CNN 处理', 42, 162);
  ctx.fillText('上采样回原分辨率', 42, 178);
  ctx.fillStyle = SLATE;
  ctx.fillText('→ ŷ_base（粗光照校正）', 42, 194);

  // ---- 残差分支 ----
  box(ctx, 298, 104, 232, 96, GREEN, 0.08);
  ctx.fillStyle = GREEN;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('残差分支 · 高频细节', 310, 124);
  ctx.fillStyle = INK;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('Transformer 骨干（5 阶段 U 形）', 310, 146);
  ctx.fillText('在全分辨率上预测', 310, 162);
  ctx.fillText('残差通路只学高频', 310, 178);
  ctx.fillStyle = SLATE;
  ctx.fillText('→ ŷ_res（不吸收粗光照误差）', 310, 194);

  // ---- 相加 ----
  arrow(ctx, 146, 200, 248, 216, BLUE, 1.2);
  arrow(ctx, 414, 200, 312, 216, GREEN, 1.2);
  box(ctx, 245, 216, 70, 26, ORANGE, 0.14);
  ctx.textAlign = 'center';
  ctx.fillStyle = ORANGE;
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText('⊕', 280, 236);

  arrow(ctx, 280, 242, 280, 254, ORANGE, 1.6);
  box(ctx, 195, 254, 170, 28, GREEN, 0.12);
  ctx.fillStyle = INK;
  ctx.font = `bold 10.5px ${MONO}`;
  ctx.fillText('ŷ = ŷ_base + ŷ_res', 280, 273);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文：这种分离能稳定训练，也减少残差通路吸收粗光照误差的倾向（原文为英文，此处是译文）', W_ANA / 2, 298);
}

/**
 * 模块 8.1：链路 + 右侧说明面板。
 * @param sel 选中的那一段的 id
 */
function paintChain(ctx: CanvasRenderingContext2D, sel: string) {
  ctx.clearRect(0, 0, W_MOD, H_MOD);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('DAME-Net 的整条链路', W_MOD / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('点方块或下面的按钮，看这一段的数据形状与来历', W_MOD / 2, 40);

  // ---- 链路 ----
  for (let i = 0; i < CHAIN.length; i++) {
    const y = BOX_Y0 + i * BOX_STEP;
    const on = sel === CHAIN[i].id;
    if (i > 0) arrow(ctx, BOX_X + BOX_W / 2, y - 14, BOX_X + BOX_W / 2, y - 2, SLATE, 1.2);

    ctx.globalAlpha = on ? 0.24 : 0.09;
    ctx.fillStyle = CHAIN[i].color;
    ctx.fillRect(BOX_X, y, BOX_W, BOX_H);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = CHAIN[i].color;
    ctx.lineWidth = on ? 2.5 : 1;
    ctx.strokeRect(BOX_X + 0.5, y + 0.5, BOX_W - 1, BOX_H - 1);

    ctx.fillStyle = INK;
    ctx.font = `${on ? 'bold ' : ''}10.5px ${FONT}`;
    ctx.fillText(CHAIN[i].name, BOX_X + BOX_W / 2, y + BOX_H / 2 + 4);
  }

  // ---- 右侧说明面板 ----
  const px = 270;
  const pw = 270;
  const py = BOX_Y0;
  const ph = CHAIN.length * BOX_STEP - 14;
  box(ctx, px, py, pw, ph, SLATE, 0.05);

  const item = CHAIN.filter((c) => c.id === sel)[0] || CHAIN[0];
  ctx.textAlign = 'left';
  ctx.fillStyle = item.color;
  ctx.font = `bold 11.5px ${FONT}`;
  ctx.fillText(item.name, px + 14, py + 24);

  ctx.fillStyle = LINE;
  ctx.fillRect(px + 14, py + 34, pw - 28, 1);

  ctx.fillStyle = INK;
  ctx.font = `9.5px ${FONT}`;
  item.lines.forEach((ln, i) => {
    // 论文里的式子用等宽字体，读起来和散文分得开
    ctx.font = /=|→|∈|\[|Attn/.test(ln) ? `9.5px ${MONO}` : `9.5px ${FONT}`;
    ctx.fillText(ln, px + 14, py + 56 + i * 19);
  });

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('常数出自论文 III-D（各组件小节）与 IV-A 实现细节', px + 14, py + ph - 12);
}

export const ArchitectureExplorer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [sel, setSel] = useState<string>('input');

  // 类比卡讲双分支重建，模块 8.1 看整条链路
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

    if (analogy) paintDualBranch(ctx);
    else paintChain(ctx, sel);

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvas);
  }, [sel, analogy, W, H]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // canvas 被 max-width 缩过，得按显示尺寸换算回内部坐标
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    for (let i = 0; i < CHAIN.length; i++) {
      const by = BOX_Y0 + i * BOX_STEP;
      if (x >= BOX_X && x <= BOX_X + BOX_W && y >= by && y <= by + BOX_H) {
        setSel(CHAIN[i].id);
        return;
      }
    }
  };

  const cur = CHAIN.filter((c) => c.id === sel)[0] || CHAIN[0];
  const feedback = analogy
    ? {
        text: '基座分支只出低频与光照（ŷ_base），骨干在全分辨率出高频残差（ŷ_res），两者相加才是最终输出',
        cls: ''
      }
    : { text: `${cur.name}：${cur.lines[0]}`, cls: '' };

  return (
    <div className="widget-container">
      <h3 className="widget-title">{analogy ? '式(15)：两支各管一段' : '整条链路，逐段拆开'}</h3>
      <p className="widget-description">
        {analogy
          ? '粗光照校正和细节恢复对解码器的要求不同，DAME-Net 把解码拆成基座分支与残差分支，输出是两者相加'
          : '点画布上的方块或下面的按钮，看每一段的数据形状与来历；5 阶段 U 形、通道 24/48/96/48/24、Eg/Es 专家数都按论文写'}
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={analogy ? undefined : handleClick}
          style={analogy ? undefined : { cursor: 'pointer' }}
        />

        {!analogy && (
          <div className="chip-row">
            {CHAIN.map((c) => {
              const on = sel === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`chip${on ? ' selected' : ''}`}
                  aria-pressed={on}
                  onClick={() => setSel(c.id)}
                >
                  {c.chip}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default ArchitectureExplorer;
