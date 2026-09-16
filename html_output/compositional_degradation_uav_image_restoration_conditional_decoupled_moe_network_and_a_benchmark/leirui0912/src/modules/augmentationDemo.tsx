import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';
import { DEGRADATIONS, mulberry32 } from './uavScene';

// 掩码过载增强（mask-overload augmentation）。第 9 章。
//
// 论文原文（III-D-3 节末）：
//   "With probability 0.05, samples containing only rain or snow (with no haze
//    or low-light flag active) are assigned one randomly activated global
//    degradation bit. This perturbation reduces over-reliance on a perfectly
//    accurate mask by forcing the routing mechanism to suppress irrelevant
//    global experts when the image content does not support the extra activation."
// 表 V：w/o Mask Overload → 22.58 dB（掉 0.46；quad 掉 0.44）。
//
// 这个组件在第 9 章挂两处（类比卡与模块 9.1），两处刻意不同：
//   类比卡（moduleId === 'ana'）-> 这条规则长什么样：只含雨的掩码按 0.05 分成两支，
//        95% 原样通过、5% 随机点亮一个全局位。回答「掩码过载增强是什么」。
//   模块 9.1                     -> 真的按这个规则采样一批样本。回答「0.05 意味着什么」。
//
// 旧版有三处硬伤：
//   ① 事实错误：基底掩码写死成 [1,0,1,0,0,0,0,0] = 雨 + 雾，含雾，恰好违反论文
//      「只含雨或只含雪、且没有雾、没有低光」的前提；
//   ② 假滑块：augmentProb 只改自己的标签，画布里读的是硬编码的 '0.05'，拖动等于没反应；
//   ③ 文案说「随机激活」，代码是 augmentedMask[3] = 1 写死低光那一位，既非随机、
//      也永远不可能是雾或过曝。
// 现在改成用 mulberry32 真采样，并且把「不符合前提的整批跳过」也画出来 ——
// 那是论文规则的一半，旧版完全没体现。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

// ---- 类比卡：规则本身（静态） ----
const W_ANA = 560;
const H_ANA = 240;

// ---- 模块 9.1：批量采样 ----
const W_MOD = 560;
const H_MOD = 322;

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const OFF = '#f4f6f9';
const BLUE = '#2f6fd0';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';

// 论文在掩码过载那一句里只说「随机点亮一个全局退化位（one randomly activated
// global degradation bit）」，没有点名；但式(13) 下方明确定义了 m̂_g 选的就是
// {haze, low-light, over-exposure} 这三位，所以这里取雾、低光、过曝。
// （下标顺序沿用全站共用的 DEGRADATIONS：雨 0、雪 1、雾 2、低光 3、过曝 4、模糊 5、噪声 6、伪影 7）
const GLOBAL_IDX = [2, 3, 4];

const N = 30; // 一批采样多少个样本
const COLS = 6;
const CELL_W = 88;
const CELL_H = 38;

/** 画一条 8 位掩码。
 * @param ring 被这次增强点亮的全局位下标，画一圈橙框；不传则没有
 * @param names 是否在方块下面标因子名（大图上标，网格里太小不标）
 */
function drawMask(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y: number,
  sq: number,
  pitch: number,
  bits: number[],
  ring?: number,
  names?: boolean
) {
  DEGRADATIONS.forEach((d, i) => {
    const x = x0 + i * pitch;
    const on = bits[i] === 1;
    ctx.fillStyle = on ? d.color : OFF;
    ctx.fillRect(x, y, sq, sq);
    ctx.strokeStyle = on ? d.color : LINE;
    ctx.lineWidth = 1;
    // 未激活的用虚线：和「掩码位 = 0」这件事形状上就分得开
    ctx.setLineDash(on ? [] : [2, 2]);
    ctx.strokeRect(x + 0.5, y + 0.5, sq - 1, sq - 1);
    ctx.setLineDash([]);

    if (names) {
      ctx.textAlign = 'center';
      ctx.fillStyle = i === ring ? ORANGE : SLATE;
      ctx.font = `7.5px ${FONT}`;
      ctx.fillText(d.name, x + sq / 2, y + sq + 12);
    }

    if (ring === i) {
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 2.5, y - 2.5, sq + 5, sq + 5);
    }
  });
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
  const L = 5.5;
  ctx.beginPath();
  ctx.moveTo(x1 - L * Math.cos(a - 0.42), y1 - L * Math.sin(a - 0.42));
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - L * Math.cos(a + 0.42), y1 - L * Math.sin(a + 0.42));
  ctx.stroke();
}

/**
 * 类比卡：一条规则，两支结果。
 * 上面是原始样本的掩码，按 0.05 分成「原样通过」与「点亮一个全局位」。
 */
function paintRule(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W_ANA, H_ANA);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('掩码过载增强是什么', W_ANA / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文：以 0.05 的概率，给「只含雨或只含雪」的样本随机点亮一个全局退化位', W_ANA / 2, 40);

  ctx.fillStyle = INK;
  ctx.font = `10.5px ${FONT}`;
  ctx.fillText('原始样本的掩码 m = 只含雨（没有雾、没有低光）', W_ANA / 2, 62);

  const bits = [1, 0, 0, 0, 0, 0, 0, 0];
  drawMask(ctx, 150, 74, 28, 33, bits, undefined, true);

  // 分叉：一路 95% 不动，一路 5% 点亮一个全局位
  arrow(ctx, 280, 116, 280, 126, SLATE, 1.3);
  ctx.strokeStyle = SLATE;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(142, 126);
  ctx.lineTo(418, 126);
  ctx.stroke();
  arrow(ctx, 142, 126, 142, 138, SLATE, 1.3);
  arrow(ctx, 418, 126, 418, 138, GREEN, 1.3);

  ctx.fillStyle = SLATE;
  ctx.font = `bold 10px ${FONT}`;
  ctx.fillText('95%：原样通过', 142, 156);
  ctx.fillStyle = GREEN;
  ctx.fillText('5%：点亮一个全局位', 418, 156);

  drawMask(ctx, 40, 166, 22, 26, bits);
  const aug = [1, 0, 0, 0, 1, 0, 0, 0]; // 雨 + 过曝，过曝是随机点亮的
  drawMask(ctx, 316, 166, 22, 26, aug, 4);

  ctx.textAlign = 'center';
  ctx.fillStyle = SLATE;
  ctx.font = `9px ${MONO}`;
  ctx.fillText('m′ = [雨]', 142, 206);
  ctx.fillStyle = ORANGE;
  ctx.fillText('m′ = [雨 + 过曝]', 418, 206);

  ctx.fillStyle = INK;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('目的：迫使路由在图像内容不支持这次额外激活时，抑制无关的全局专家', W_ANA / 2, 226);
}

/**
 * 模块 9.1：真按这条规则采样一批。
 * @param base 批次用的基底样本（论文只允许「只含雨」或「只含雪」）
 * @param p 改写概率
 * @param seed 随机种子，换一颗就是重采一批
 */
function paintBatch(ctx: CanvasRenderingContext2D, base: { bits: number[]; ok: boolean }, p: number, seed: number) {
  ctx.clearRect(0, 0, W_MOD, H_MOD);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText(`批量采样：p = ${p.toFixed(2)} 时，${N} 个样本里期望 ${(N * (base.ok ? p : 0)).toFixed(1)} 个被改写`, W_MOD / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('掷骰子：符合条件的样本以 p 的概率随机点亮「雾 / 低光 / 过曝」里的一个', W_MOD / 2, 40);

  // 采样：同一颗种子必然得到同一批，换种子才换结果
  const rnd = mulberry32(seed);
  let hits = 0;

  for (let i = 0; i < N; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = 16 + col * CELL_W;
    const cy = 60 + row * CELL_H;

    const fired = base.ok && rnd() < p;
    let bit = -1;
    if (fired) {
      bit = GLOBAL_IDX[Math.floor(rnd() * GLOBAL_IDX.length)];
      hits++;
    }

    ctx.globalAlpha = fired ? 0.06 : 0;
    ctx.fillStyle = ORANGE;
    ctx.fillRect(cx, cy, CELL_W - 6, CELL_H - 6);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = fired ? ORANGE : LINE;
    ctx.lineWidth = fired ? 1.6 : 1;
    ctx.strokeRect(cx + 0.5, cy + 0.5, CELL_W - 7, CELL_H - 7);

    const bits = base.bits.slice();
    if (bit >= 0) bits[bit] = 1;
    drawMask(ctx, cx + 8, cy + 8, 8, 9, bits, bit >= 0 ? bit : undefined);

    if (bit >= 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = ORANGE;
      ctx.font = `bold 8px ${FONT}`;
      ctx.fillText(`+${DEGRADATIONS[bit].name}`, cx + 8, cy + 29);
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText(`本批实际改写 ${hits} 个（换一颗种子重采，个数会变；论文只用 p = 0.05 这一个值）`, W_MOD / 2, 272);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('只有「只含雨或只含雪（没有雾、没有低光）」的样本进入抽取，其余整批跳过 —— 这是论文的前提', W_MOD / 2, 292);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('「全局位」= 雾 / 低光 / 过曝：论文式(13) 下方定义 m̂_g 就是选这三位', W_MOD / 2, 308);

  ctx.fillText('表 V：去掉掩码过载增强 → 22.58 dB（掉 0.46；quad 任务掉 0.44）', W_MOD / 2, 312);
}

// 批次基底：前两个符合论文前提，后两个故意不符合，用来演示「整批跳过」
const BASES = [
  { id: 'rain', label: '只含雨', dots: ['rain'], bits: [1, 0, 0, 0, 0, 0, 0, 0], ok: true },
  { id: 'snow', label: '只含雪', dots: ['snow'], bits: [0, 1, 0, 0, 0, 0, 0, 0], ok: true },
  { id: 'rain-haze', label: '雨+雾', dots: ['rain', 'haze'], bits: [1, 0, 1, 0, 0, 0, 0, 0], ok: false },
  { id: 'lowlight-snow', label: '低光+雪', dots: ['lowlight', 'snow'], bits: [0, 1, 0, 1, 0, 0, 0, 0], ok: false }
];

export const AugmentationDemo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [p, setP] = useState(0.05);
  const [seed, setSeed] = useState(1);
  const [baseId, setBaseId] = useState('rain');

  // 类比卡讲规则，模块 9.1 跑采样
  const analogy = moduleId === 'ana';
  const W = analogy ? W_ANA : W_MOD;
  const H = analogy ? H_ANA : H_MOD;

  const base = BASES.filter((b) => b.id === baseId)[0] || BASES[0];

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

    if (analogy) paintRule(ctx);
    else paintBatch(ctx, base, p, seed);

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvas);
  }, [analogy, base, p, seed, W, H]);

  // 反馈行拿到的命中数要和画布一致：同一种子重算一遍，顺序与内层循环相同
  const hits = (() => {
    if (!base.ok) return 0;
    const rnd = mulberry32(seed);
    let k = 0;
    for (let i = 0; i < N; i++) {
      if (rnd() < p) {
        rnd(); // 那次「挑哪个全局位」的随机数，必须一并消耗掉才对得上
        k++;
      }
    }
    return k;
  })();

  const feedback = analogy
    ? {
        text: '95% 的样本原样通过，5% 的样本被随机点亮一个全局位 —— 目的是让路由学会抑制图像内容并不支持的全局专家',
        cls: ''
      }
    : base.ok
      ? {
          text: `${base.label}：${N} 个样本里 ${hits} 个被改写（期望 ${(N * p).toFixed(1)} 个），各自随机点亮雾 / 低光 / 过曝中的一个；重采会变，论文全文只用 p = 0.05`,
          cls: hits > 0 ? 'good' : ''
        }
      : {
          text: `${base.label}：含雾或低光，不符合论文「只含雨或只含雪、且没有雾、没有低光」的前提，整批 0 个被改写`,
          cls: 'bad'
        };

  return (
    <div className="widget-container">
      <h3 className="widget-title">{analogy ? '规则本身：一条掩码分成两支' : '这一批样本里被改写了几个'}</h3>
      <p className="widget-description">
        {analogy
          ? '只有「只含雨或只含雪」的样本会被抽到，被抽中的样本随机点亮雾、低光、过曝里的一位'
          : '拖 p 或换基底样本看命中数怎么变；「雨+雾」「低光+雪」两档故意违反论文的前提，用来对照'}
      </p>

      <div className="widget-content">
        <canvas ref={canvasRef} width={W} height={H} />

        {!analogy && (
          <>
            <div className="chip-row">
              {BASES.map((b) => {
                const on = baseId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`chip${on ? ' selected' : ''}`}
                    aria-pressed={on}
                    onClick={() => setBaseId(b.id)}
                    title={b.ok ? '符合论文前提' : '含雾或低光，不符合论文前提，整批跳过'}
                    style={b.ok ? undefined : { borderStyle: 'dashed' }}
                  >
                    {b.dots.map((id) => {
                      const d = DEGRADATIONS.filter((g) => g.id === id)[0];
                      return (
                        <span
                          key={id}
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 3,
                            background: d.color,
                            // 「雪」这类近白色块在白底上几乎看不见，描一圈边保证可辨
                            boxShadow: 'inset 0 0 0 1px rgba(33,50,74,0.35)',
                            display: 'inline-block',
                            marginRight: 2
                          }}
                        />
                      );
                    })}
                    {b.label}
                  </button>
                );
              })}
            </div>

            <div className="ctrl">
              <label>
                改写概率 p: <span className="val">{p.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0.02}
                max={0.3}
                step={0.01}
                value={p}
                onChange={(e) => setP(parseFloat(e.target.value))}
              />
              <button type="button" className="tiny ghost" onClick={() => setSeed((s) => s + 1)}>
                换一颗种子重采
              </button>
            </div>
          </>
        )}
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default AugmentationDemo;
