import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';
import { FactorChips } from './factorChips';
import { DEGRADATIONS, SW, SH, getDegraded, getScene } from './uavScene';

// 退化识别器：点选退化因子，照片当场变化。
//
// 同一个组件在页面里出现两次（第 1 章的类比卡与模块 1.1 各一次），
// 两处刻意不同，差别都在「标注」上 —— 照片与开关本身完全一致：
//   moduleId === 'ana' -> 类比卡（AnalogyCard.tsx 固定传 "ana"）：
//        只有照片，不写任何类型文字，也不给计数；按钮不带选中态，
//        点了之后唯一的反馈就是照片本身的变化。
//   其余（模块 1.1）    -> 照片同款，下方用小字标出激活的因子与数量，
//        按钮带选中态，便于把「点了哪个」和「照片里的变化」对上。
// 两处的按钮行末尾都带一个「清除」按钮，一次清空全部已选退化。
// 照片本身、可选因子、按钮样式两边完全一致，来自 uavScene / factorChips，
// 所以改动一次两边同步，不会各自漂移。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';

const SLATE = '#68778f';
const SLATE2 = '#8b97ab';
const LINE = '#d7deea';
const INK = '#21324a';

// 照片按景物条带（620x248 ≈ 2.5:1）的原始比例摆放，不拉伸
const PHOTO_W = 520;
const PHOTO_H = Math.round((PHOTO_W * SH) / SW);
const PHOTO_X = 12;
const PHOTO_Y = 12;

const W = PHOTO_W + PHOTO_X * 2;
const CAP_Y = PHOTO_Y + PHOTO_H + 24; // 计数行
const LEGEND_Y = CAP_Y + 22; // 小字图例首行
// 类比卡槽只有照片，高度到照片下沿再留同样的边距即可
const H_ANALOGY = PHOTO_Y + PHOTO_H + PHOTO_Y;
const H_MODULE = LEGEND_Y + 16;

const SWATCH = 9;
const LEGEND_GAP = 16;

/** 照片下方的计数行。 */
function drawCount(ctx: CanvasRenderingContext2D, n: number) {
  ctx.font = `500 12px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = n === 0 ? SLATE2 : SLATE;
  ctx.fillText(n === 0 ? '尚未选择退化类型' : `激活退化: ${n}/8`, PHOTO_X, CAP_Y);
}

/**
 * 小字列出当前激活的退化因子：一个色块 + 因子名。
 * 与封面的开关用同一套因子色，便于把「点了哪个」和「照片里的变化」对上。
 */
function drawLegend(ctx: CanvasRenderingContext2D, active: string[]) {
  if (!active.length) return;
  ctx.font = `500 11px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  let x = PHOTO_X;
  for (const id of active) {
    const d = DEGRADATIONS.find((k) => k.id === id);
    if (!d) continue;
    if (x > PHOTO_X) {
      ctx.fillStyle = LINE;
      ctx.fillText('·', x - LEGEND_GAP / 2 - 2, LEGEND_Y + SWATCH / 2);
    }
    ctx.fillStyle = d.color;
    ctx.fillRect(x, LEGEND_Y, SWATCH, SWATCH);
    ctx.strokeStyle = 'rgba(33,50,74,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, LEGEND_Y + 0.5, SWATCH - 1, SWATCH - 1);

    ctx.fillStyle = INK;
    ctx.fillText(d.name, x + SWATCH + 5, LEGEND_Y + SWATCH / 2 + 0.5);
    x += SWATCH + 5 + ctx.measureText(d.name).width + LEGEND_GAP;
  }
  ctx.textBaseline = 'alphabetic';
}

/** withMeta = 是否画照片下面那块文字（计数行 + 小字图例）。类比卡槽只画照片。 */
function paint(ctx: CanvasRenderingContext2D, active: string[], withMeta: boolean) {
  const h = withMeta ? H_MODULE : H_ANALOGY;
  ctx.clearRect(0, 0, W, h);

  const photo = active.length ? getDegraded(active) : getScene();
  ctx.drawImage(photo, 0, 0, SW, SH, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(PHOTO_X + 0.5, PHOTO_Y + 0.5, PHOTO_W - 1, PHOTO_H - 1);

  if (withMeta) {
    drawCount(ctx, active.length);
    drawLegend(ctx, active);
  }
}

export const DegradationInspector: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [active, setActive] = useState<string[]>([]);
  // 类比卡槽：照片之外不加任何文字，按钮也不带选中态（见文件头注释）
  const analogy = moduleId === 'ana';
  const withMeta = !analogy;

  const toggle = (id: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // 固定按 DEGRADATIONS 顺序存放，保证渲染结果稳定、可复现
      return DEGRADATIONS.filter((d) => next.has(d.id)).map((d) => d.id);
    });

  // 挂载即出图：建背衬 → 绘制 → 淡入都在同一个 effect 里完成，
  // 不依赖另一个 effect 先把 ctx 写进 ref，默认状态就不会停在空画布上。
  useEffect(() => {
    if (!canvasEl) return;

    const h = withMeta ? H_MODULE : H_ANALOGY;
    const dpr = window.devicePixelRatio || 1;
    let ctx = ctxRef.current;
    // 背衬尺寸与当前 dpr 不一致时才重建（首次挂载，或跨屏拖动导致 dpr 变化）。
    // setupCanvas 会重置位图，所以重建之后必须紧接着重绘。
    if (
      !ctx ||
      canvasEl.width !== Math.round(W * dpr) ||
      canvasEl.height !== Math.round(h * dpr)
    ) {
      try {
        ctx = setupCanvas(canvasEl, W, h);
        // 跟随栏宽并限高：避免在窄列中被裁切、在宽列中被放大糊掉
        canvasEl.style.width = '100%';
        canvasEl.style.height = 'auto';
        canvasEl.style.maxWidth = W + 'px';
        canvasEl.style.margin = '0 auto';
      } catch {
        // 退化路径：拿不到 2D 上下文时按 1x 画，至少不留空白
        const fallback = canvasEl.getContext('2d');
        if (!fallback) return;
        canvasEl.width = W;
        canvasEl.height = h;
        ctx = fallback;
      }
      ctxRef.current = ctx;
    }

    paint(ctx, active, withMeta);

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入。
    canvasEl.classList.add('is-ready');
  }, [canvasEl, active, withMeta]);

  const n = active.length;
  let feedbackText: string;
  let feedbackCls = '';
  if (n === 0) {
    feedbackText = '请至少选择一种退化类型';
  } else if (n === 1) {
    feedbackText = '单一退化：相对容易处理';
  } else if (n <= 3) {
    feedbackText = '组合退化：需要专门的修复方法';
  } else {
    feedbackText = '高阶组合退化：非常具有挑战性';
    feedbackCls = 'bad';
  }

  return (
    <div className="widget-container">
      <h3 className="widget-title">退化识别器</h3>
      <p className="widget-description">
        点击选择不同的退化类型，观察它们叠加后对图像的影响
      </p>

      <div className="widget-content">
        <canvas
          ref={setCanvasEl}
          id={`cv-${chapterId}-${moduleId}-deg`}
          width={W}
          height={withMeta ? H_MODULE : H_ANALOGY}
        />

        <FactorChips
          active={active}
          onToggle={toggle}
          showSelection={withMeta}
          onClear={() => setActive([])}
        />
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback ${feedbackCls}`}>
        {feedbackText}
      </div>
    </div>
  );
};

export default DegradationInspector;
