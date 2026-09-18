import React, { useEffect, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';
import { FactorChips } from './factorChips';
import { DEGRADATIONS, getDegraded } from './uavScene';

// 多标签退化编码：把「这张图有哪几种退化」写成一个多热向量 m ∈ {0,1}⁸。
//
// 这里的「编码」指的是数据格式，不是网络模块 —— 论文里真正输出这个掩码的是
// 第 4 章的 FDPM（CLIP 图像编码器 + 多标签预测头）。本章只演示格式本身：
// 8 个位各自独立地取 0/1，不是互斥的多分类（论文 III-C-2 节「CLIP-Based
// Multi-Label Perception」把退化感知形式化为多标签预测，正是这个意思）。
//
// 注意「位可以独立」不等于「配置可以任意搭配」：MDUR 只收录了 43 种有效配置
// （8 种原子退化里最多叠 4 个），不是 8 位的全部 2⁸ 种组合。画布注脚按论文写。
//
// 8 个因子开关与封面、第 1 章共用 FactorChips：同一套 .chip 样式、同一套
// 因子色、同样的选中底色，末尾也带「清除」。先前这里自己写了一套 bit-btn，
// 但框架 components.css 里没有这两个类（.chip 才是被样式覆盖的那套），
// 渲染出来是没样式的默认按钮，点了按钮本身也不会出现任何选中反馈。
//
// 这个组件在第 2 章挂两处（类比卡与模块 2.1），两处刻意不同：
//   类比卡（moduleId === 'ana'）-> 回答「这一步在做什么」：一张图变成一串 0/1。
//        不给 8 个自由开关（那是模块 2.1 的事），只给三档预设（1 / 2 / 3 个因子），
//        画布左边就是这一组因子作用下的那张合成航拍影像（与封面、第 1 章共用同一张，
//        来自 uavScene 的 getDegraded），右边是它对应的 8 位。三档连起来看，
//        「组合里的因子越多、向量里的 1 越多，而且每个 1 都对应一个具体的因子」
//        这件事一眼可见。
//   模块 2.1                    -> 回答「这个格式怎么用」：8 个因子各自一个开关，
//        随便点，位、二进制串与「激活:」一行同步变化。
//
// 两处共用同一套因子色、同一个 `.chip`、同一个多热向量的画法。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

// ---- 模块 2.1 ----
const W_MOD = 400;
const H_MOD = 180;
const BIT = 30;
const ROW_Y = 50;

// ---- 类比卡 ----
const W_ANA = 520;
const H_ANA = 190;
const A_BIT = 24;
const A_BITS_X = 260;
const A_BITS_Y = 74;
const A_THUMB_X = 30;
const A_THUMB_Y = 52;
// 620×248 的合成影像按 2.5:1 原样缩到这一档，不拉伸
const A_THUMB_W = 170;
const A_THUMB_H = 68;

const GAP = 5;

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const OFF = '#d7deea';
const ON = '#228d5c';

/**
 * 类比卡的三档预设。刻意不用 8 个自由开关：那一套在模块 2.1 里，
 * 这里要的是「因子多起来会怎样」，三档排开就能看出来。
 */
const PRESETS: { label: string; ids: string[] }[] = [
  { label: '雾', ids: ['haze'] },
  { label: '雨 + 雾', ids: ['rain', 'haze'] },
  { label: '雨 + 雾 + 噪声', ids: ['rain', 'haze', 'noise'] }
];

/** 按 DEGRADATIONS 顺序取出这一组因子的 id（位序固定，读出来的串才是后文用的 m）。 */
const orderedIds = (ids: string[]) => DEGRADATIONS.filter((d) => ids.includes(d.id)).map((d) => d.id);

/** 一串 0/1 读成的多热向量写法。 */
const vecText = (mask: boolean[]) => `m = [${mask.map((b) => (b ? '1' : '0')).join('')}]`;

function arrowLine(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number) {
  ctx.strokeStyle = SLATE;
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

/** 一行位：激活的位是实心绿底白字 1，未激活是浅灰底深字 0。 */
function paintBits(ctx: CanvasRenderingContext2D, mask: boolean[], x0: number, y: number, size: number, nameSize: number) {
  DEGRADATIONS.forEach((d, i) => {
    const x = x0 + i * (size + GAP);
    const on = mask[i];

    ctx.fillStyle = on ? ON : OFF;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    ctx.textAlign = 'center';
    ctx.fillStyle = on ? '#ffffff' : INK;
    ctx.font = `bold ${Math.round(size * 0.53)}px ${FONT}`;
    ctx.fillText(on ? '1' : '0', x + size / 2, y + size * 0.67);

    ctx.fillStyle = SLATE;
    ctx.font = `${nameSize}px ${FONT}`;
    ctx.fillText(d.name, x + size / 2, y + size + nameSize + 5);
  });
}

/**
 * 类比卡：一张图 → 一串 0/1。
 * @param ids 这一档预设里的因子
 */
function paintAnalogy(ctx: CanvasRenderingContext2D, ids: string[]) {
  const mask = DEGRADATIONS.map((d) => ids.includes(d.id));
  const names = DEGRADATIONS.filter((d) => ids.includes(d.id)).map((d) => d.name);

  // 画布保持透明，让卡片自己的底色透出来（与第 1、3、4 章一致）；
  // 先前这里铺了一层 #f5f8f0 的浅绿底，在类比卡的暖色卡片上是一块明显的绿斑。
  ctx.clearRect(0, 0, W_ANA, H_ANA);

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('图像信息 → 一串 0/1：每位对应一个退化因子', W_ANA / 2, 22);

  // 左边：这一组因子作用下的那张合成航拍影像（与封面、第 1 章是同一张）
  ctx.drawImage(getDegraded(orderedIds(ids)), A_THUMB_X, A_THUMB_Y, A_THUMB_W, A_THUMB_H);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(A_THUMB_X + 0.5, A_THUMB_Y + 0.5, A_THUMB_W - 1, A_THUMB_H - 1);
  ctx.fillStyle = SLATE;
  ctx.font = `10px ${FONT}`;
  ctx.fillText(names.join(' + '), A_THUMB_X + A_THUMB_W / 2, A_THUMB_Y + A_THUMB_H + 18);

  // 中间：从图指向向量
  arrowLine(ctx, A_THUMB_X + A_THUMB_W + 4, A_BITS_X - 15, A_THUMB_Y + A_THUMB_H / 2);

  // 右边：8 个位 + 读出来的串
  paintBits(ctx, mask, A_BITS_X, A_BITS_Y, A_BIT, 9);

  const bitsW = DEGRADATIONS.length * (A_BIT + GAP) - GAP;
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `13px ${MONO}`;
  ctx.fillText(vecText(mask), A_BITS_X + bitsW / 2, 144);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('8 个位各自独立取 0/1，不是互斥的多分类；但 MDUR 只收录 43 种有效配置（单因子到四因子）', W_ANA / 2, H_ANA - 16);
}

/**
 * 模块 2.1：8 个位 + 二进制串 + 「激活:」一行。
 * @param active 当前选中的因子
 */
function paintModule(ctx: CanvasRenderingContext2D, active: string[]) {
  const mask = DEGRADATIONS.map((d) => active.includes(d.id));

  ctx.clearRect(0, 0, W_MOD, H_MOD);

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText('多热退化掩码 m ∈ {0,1}⁸', W_MOD / 2, 25);

  const startX = (W_MOD - DEGRADATIONS.length * (BIT + GAP)) / 2;
  paintBits(ctx, mask, startX, ROW_Y, BIT, 10);

  // 位序固定为 DEGRADATIONS 的顺序，读出来的串就是后文用的 m
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `14px ${MONO}`;
  ctx.fillText(vecText(mask), W_MOD / 2, 130);

  const on = DEGRADATIONS.filter((d) => active.includes(d.id));
  if (on.length) {
    ctx.fillStyle = ON;
    ctx.font = `12px ${FONT}`;
    ctx.fillText(`激活: ${on.map((d) => d.name).join(', ')}`, W_MOD / 2, 160);
  }
}

export const MultiLabelEncoder: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState<string[]>([]);
  const [preset, setPreset] = useState(0);

  // 类比卡看「图 → 向量」，模块 2.1 看「点哪个位就翻哪个位」
  const analogy = moduleId === 'ana';
  const W = analogy ? W_ANA : W_MOD;
  const H = analogy ? H_ANA : H_MOD;
  const ids = analogy ? PRESETS[preset].ids : active;

  const toggle = (id: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // 固定按 DEGRADATIONS 顺序存放，位序稳定、可复现
      return DEGRADATIONS.filter((d) => next.has(d.id)).map((d) => d.id);
    });

  // 建背衬 → 绘制 → 淡入在同一个 effect 里完成，默认状态即出图
  useEffect(() => {
    if (!canvasEl) return;

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvasEl, W, H);
    } catch {
      // 退化路径：拿不到 2D 上下文时按 1x 画，至少不留空白
      const fallback = canvasEl.getContext('2d');
      if (!fallback) return;
      canvasEl.width = W;
      canvasEl.height = H;
      ctx = fallback;
    }
    // 跟随栏宽并限高：窄列不被裁切，宽列不被放大糊掉
    canvasEl.style.width = '100%';
    canvasEl.style.height = 'auto';
    canvasEl.style.maxWidth = W + 'px';
    canvasEl.style.margin = '0 auto';
    canvasEl.style.display = 'block';

    if (analogy) paintAnalogy(ctx, ids);
    else paintModule(ctx, ids);

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvasEl);
  }, [canvasEl, analogy, ids, W, H]);

  const n = ids.length;
  const onNames = DEGRADATIONS.filter((d) => ids.includes(d.id)).map((d) => d.name);
  const feedback = analogy
    ? { text: `${onNames.join(' + ')}：${n} 个因子点亮 ${n} 位，其余位是 0`, cls: '' }
    : {
        text: n === 0 ? '点选因子来激活退化类型' : `${n}种退化激活，形成多热向量`,
        cls: n ? 'good' : ''
      };

  return (
    <div className="widget-container">
      <h3 className="widget-title">多标签退化编码</h3>
      <p className="widget-description">
        {analogy
          ? '同一张图，因子多起来向量里的 1 也多起来：退化的组合就是这样写成一串 0/1'
          : '点选退化因子，观察多热向量如何表示组合退化'}
      </p>

      <div className="widget-content">
        <canvas
          ref={setCanvasEl}
          id={`cv-${chapterId}-${moduleId}-multi`}
          width={W}
          height={H}
        />

        {analogy ? (
          // 三档预设：不跟模块 2.1 抢那 8 个自由开关，只看「因子变多会怎样」
          <div className="chip-row">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                type="button"
                className={`chip${i === preset ? ' selected' : ''}`}
                aria-pressed={i === preset}
                onClick={() => setPreset(i)}
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : (
          <FactorChips active={active} onToggle={toggle} onClear={() => setActive([])} />
        )}
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default MultiLabelEncoder;
