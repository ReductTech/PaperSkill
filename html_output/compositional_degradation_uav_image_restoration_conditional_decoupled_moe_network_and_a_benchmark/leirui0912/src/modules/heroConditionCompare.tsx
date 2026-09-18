import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { FactorChips } from './factorChips';
import { ALL_IDS, clamp255, colorOf, mulberry32, SW, SH, getDegraded, getScene } from './uavScene';

// 封面（Hero）专用：隐式统一修复 vs 显式因子级条件。
//
// 同一个组件被 Hero 两侧复用，用 moduleId 区分渲染方向（Hero.tsx 固定传 "old"/"new"）：
//   moduleId === 'old' -> 隐式：整体条件（全局校正只反掉一部分退化），因子越多反掉得越少
//   其余（'new'）      -> 显式：每个激活因子由对应分支独立校正，因子之间互不干扰
//
// 两侧渲染同一景物、同一组退化，只有修复范式不同，构成受控对照：
//   上条 = 组合退化输入（两侧逐像素相同）
//   下条 = 该范式的修复结果
//
// 景物与 8 种退化来自 uavScene.ts，与第 1 章的退化识别器共用同一份，
// 所以封面和正文里看到的「无人机航拍照片」是同一张、退化表现也一致。
//
// 配色沿用 src/styles/paper.css 的 --paper-degradation-*，与第 1 章「退化识别器」同一套。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';

// 语义遵循 tokens.css：red=失败/旧方法，green=成功/本文方法
const SLATE = '#68778f';
const SLATE2 = '#8b97ab';
const LINE = '#d7deea';
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';

// ---------------------------------------------------------------------------
// 共享 store：两个 Hero 实例读写同一份状态
// ---------------------------------------------------------------------------

type Snapshot = { active: string[]; version: number };

let snapshot: Snapshot = { active: ['rain', 'haze'], version: 0 };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function toggleDegradation(id: string) {
  const next = new Set(snapshot.active);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  // 固定按 DEGRADATIONS 顺序存放，保证渲染结果稳定、可复现
  snapshot = { active: ALL_IDS.filter((k) => next.has(k)), version: snapshot.version + 1 };
  listeners.forEach((listener) => listener());
}

// ---------------------------------------------------------------------------
// 尺寸
// ---------------------------------------------------------------------------

// 画布取窄高比例：Hero 栏宽约 340–470px，这样两条带接近 1:1 显示，
// 缩小到栏宽时退化细节和 12px 标注都还看得清。
const W = 330;
const H = 322;

const PX = 10;
const PW = 310;
const PH = 124;
const IN_Y = 23;
const OUT_Y = 173;
const LBL_IN_Y = 17;
const LBL_OUT_Y = 167;
const CAP_Y = 314;

/** 激活因子颜色的均值 —— 隐式条件下因子被混在一起，表现为混色色偏。 */
function mixColor(active: string[]) {
  if (!active.length) return 'rgb(128,128,128)';
  let r = 0;
  let g = 0;
  let b = 0;
  for (const id of active) {
    const hex = colorOf(id).color;
    r += parseInt(hex.slice(1, 3), 16);
    g += parseInt(hex.slice(3, 5), 16);
    b += parseInt(hex.slice(5, 7), 16);
  }
  const n = active.length;
  r /= n;
  g /= n;
  b /= n;
  const m = (r + g + b) / 3;
  const sat = 1.5;
  return `rgb(${clamp255(m + (r - m) * sat) | 0},${clamp255(m + (g - m) * sat) | 0},${
    clamp255(m + (b - m) * sat) | 0
  })`;
}

// ---------------------------------------------------------------------------
// 绘制
// ---------------------------------------------------------------------------

function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/**
 * 隐式：单条整体条件做全局校正。
 *
 * 它并不是「没修」——统一条件确实能反掉一部分退化，只是反掉的比例随因子数
 * 增加迅速下降，反不掉的那部分就是残差。所以结果应当：
 *   · 明显好于左侧的退化输入（不能看起来没处理过）；
 *   · 又明显差于右侧的显式因子级校正（雨丝、雾感仍有残留，且带混色色偏）。
 *
 * 实现上用「叠上 recover 份干净影像」等价表达「反掉 recover 比例的退化」：
 * 雨丝、雾感、噪声按同一比例一起褪去，剩下的正是统一条件对不上的那部分。
 */
function drawImplicit(
  ctx: CanvasRenderingContext2D,
  deg: HTMLCanvasElement,
  clean: HTMLCanvasElement,
  active: string[]
) {
  const n = active.length;

  ctx.save();
  ctx.beginPath();
  ctx.rect(PX, OUT_Y, PW, PH);
  ctx.clip();

  ctx.drawImage(deg, 0, 0, SW, SH, PX, OUT_Y, PW, PH);

  if (n > 0) {
    // 下界 0.30 保证「确实修掉了一些」，上界 0.80 保证「没修干净」：
    // 结果既不会与退化输入完全相同，也不会追平右侧。
    const recover = Math.max(0.3, 0.8 - (n - 1) * 0.072);

    ctx.globalAlpha = recover;
    ctx.drawImage(clean, 0, 0, SW, SH, PX, OUT_Y, PW, PH);
    ctx.globalAlpha = 1;

    // 多个因子被压进同一条条件 → 互相渗透的混色色偏
    const mix = mixColor(active);
    ctx.globalAlpha = Math.min(0.22, n * 0.028);
    ctx.fillStyle = mix;
    ctx.fillRect(PX, OUT_Y, PW, PH);
    ctx.globalAlpha = 1;

    // 全局校正无法逐项去除的残余
    const rn = mulberry32(4242);
    ctx.strokeStyle = mix;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    const streaks = Math.min(24, 3 + n * 3);
    for (let i = 0; i < streaks; i++) {
      const sx = PX + rn() * PW;
      const sy = OUT_Y + rn() * PH;
      const len = 7 + rn() * 15;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - len * 0.26, sy + len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  frame(ctx, PX, OUT_Y, PW, PH);
}

/** 显式：每个激活因子由对应分支独立校正，因子之间互不干扰。 */
function drawExplicit(ctx: CanvasRenderingContext2D, clean: HTMLCanvasElement) {
  ctx.drawImage(clean, 0, 0, SW, SH, PX, OUT_Y, PW, PH);
  frame(ctx, PX, OUT_Y, PW, PH);
}

function draw(
  ctx: CanvasRenderingContext2D,
  implicit: boolean,
  active: string[],
  deg: HTMLCanvasElement,
  clean: HTMLCanvasElement
) {
  const n = active.length;
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = 'left';

  ctx.fillStyle = SLATE2;
  ctx.font = `500 12px ${FONT}`;
  ctx.fillText(n === 0 ? '输入 · 原始图像' : `输入 · ${n} 种退化同时作用`, PX, LBL_IN_Y);

  ctx.drawImage(deg, 0, 0, SW, SH, PX, IN_Y, PW, PH);
  frame(ctx, PX, IN_Y, PW, PH);

  ctx.fillStyle = implicit ? (n >= 2 ? RED : SLATE) : BLUE;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText(
    implicit ? '隐式统一修复 · 单条整体条件' : 'DAME-Net · 显式因子级条件',
    PX,
    LBL_OUT_Y
  );

  if (implicit) drawImplicit(ctx, deg, clean, active);
  else drawExplicit(ctx, clean);

  ctx.font = `500 12px ${FONT}`;
  if (implicit) {
    ctx.fillStyle = n >= 2 ? RED : SLATE2;
    ctx.fillText(
      n === 0
        ? '尚未施加退化'
        : n === 1
        ? '单因子时勉强对应，残差较轻'
        : '整体校正只反掉一部分退化 → 混色色偏 + 残余',
      PX,
      CAP_Y
    );
  } else {
    ctx.fillStyle = n === 0 ? SLATE2 : GREEN;
    ctx.fillText(n === 0 ? '尚未施加退化' : '各因子独立校正，互不干扰', PX, CAP_Y);
  }
}

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

export const HeroConditionCompare: React.FC<WidgetProps> = ({ moduleId }) => {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const snap = useSyncExternalStore(subscribe, getSnapshot);
  const active = snap.active;
  const implicit = moduleId === 'old';

  // 挂载即出图：建背衬 → 绘制 → 淡入都在同一个 effect 里完成，
  // 不依赖另一个 effect 先把 ctx 写进 ref，默认状态就不会停在空画布上。
  useEffect(() => {
    if (!canvasEl) return;

    const dpr = window.devicePixelRatio || 1;
    let ctx = ctxRef.current;
    // 背衬尺寸与当前 dpr 不一致时才重建（首次挂载，或跨屏拖动导致 dpr 变化）。
    // setupCanvas 会重置位图，所以重建之后必须紧接着重绘。
    if (
      !ctx ||
      canvasEl.width !== Math.round(W * dpr) ||
      canvasEl.height !== Math.round(H * dpr)
    ) {
      try {
        ctx = setupCanvas(canvasEl, W, H);
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
        canvasEl.height = H;
        ctx = fallback;
      }
      ctxRef.current = ctx;
    }

    const clean = getScene();
    // 没选退化时输入条就是干净影像，与识别器那边的表现一致
    draw(ctx, implicit, active, active.length ? getDegraded(active) : clean, clean);

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入。
    // 补上这个类，否则画得再对也永远不可见。
    canvasEl.classList.add('is-ready');
  }, [canvasEl, implicit, active, snap.version]);

  const n = active.length;
  let feedbackText: string;
  let feedbackCls = '';
  if (n === 0) {
    feedbackText = '请至少选择一种退化，再对比两侧的修复结果。';
  } else if (implicit) {
    if (n === 1) {
      feedbackText = '只激活 1 种退化时，整体条件还能勉强对上具体因子，残差较轻。';
    } else {
      feedbackText = `${n} 种退化被压进同一条整体条件：全局校正只反掉一部分，因子越多反掉得越少，留下混色色偏与残余退化。`;
      feedbackCls = 'bad';
    }
  } else {
    feedbackText = `${n} 项退化分别由对应分支校正，因子之间互不干扰。`;
    feedbackCls = 'good';
  }

  return (
    <div>
      <canvas id={`cv-${moduleId}-cond`} ref={setCanvasEl} width={W} height={H} />

      <FactorChips active={active} onToggle={toggleDegradation} />

      <div className={`feedback ${feedbackCls}`}>{feedbackText}</div>
    </div>
  );
};

export default HeroConditionCompare;
