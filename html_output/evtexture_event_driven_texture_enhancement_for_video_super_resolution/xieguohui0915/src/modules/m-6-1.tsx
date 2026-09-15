import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { clearScene, drawLegend, drawSceneLabel, drawEventDots, PAPER } from './halftoneKit';
import { cellMeans, fabricCanvas } from './fabricKit';
import type { WidgetProps } from './registry';

// §6.1 ITE 迭代步进器（制版台主题）
//
// 要回答的问题：ITE 的 5 次迭代，每一步到底在**消费什么、产出什么、累积到多少**。
//
// 做法：
//   1. 用与 §2.1 完全同一套 DVS 事件模型（每个像素存一个参考值 ref；每 50ms 读一次该像素
//      当前的格子平均值 v；只有 |v − ref| > C × 255 才报一个事件，并把 ref 更新成 v），
//      让相机掠过一段真实布纹（fabricKit 烘出来的那张），把 2 秒里报出来的事件
//      按时间**真切成 5 片**（论文 Eq.1–2 的 B = 5，每片 8 × 50ms = 400ms）。
//   2. 上排 5 张缩略图 = 5 片各自的**真实事件点**（极性配色）。布纹在动，所以这 5 张
//      本来就长得不一样——它们是真的不一样，不是画上去的装饰。
//   3. 右侧灰度图 = 已消费的那几片事件的**真实叠加**（逐格计数，按全局最大值归一到灰度）。
//      消费的片越多，亮的格子越多、格子的计数也越高，图就越密越深。
//   4. 左下残差条 = 已并入了多少片（5 格一格一片）：紫 = 之前已并入，橙 = 本步新并入，
//      条上写进度的裸数字，条右端是累积到的事件总数，
//      条上方橙色裸数字是**本步新并入的那一份**的大小（= 当前这一片的事件数）。
//
// 性能：本模块没有可调参数，事件流是固定的，所以整段仿真只在挂载时算一次并缓存；
//   rAF 的每一帧只负责把算好的数组画出来 —— 绝不逐帧调用 cellMeans / getImageData。
//
// 🔴 诚实边界（必须保留）：本模块展示的"叠加"是 5 片事件的**真实叠加**；论文里每一步
//   产出的是网络学出来的特征残差 ζ^i，与事件叠加不是一回事。这里的灰度叠加图只是让
//   "细节一层层累积"这件事有一个看得见的对应物。每一态反馈都写了「原理示意，非模型真实输出」。

const W = 1080;
const H_WIDE = 400;
const H_NARROW = 640;

// ---------------------------------------------------------------- 事件模型参数
// 与 §2.1 同一套定义，只有取样阵的形状不同：§2.1 是 24 格一排（凑近看一格），
// 这里是 32 × 16 的二维像素阵（看得见事件落在画面的哪个位置）。

const SLICES = 5; // 论文 Eq.1–2 的时间片数 B
const SLICE_STEPS = 8; // 每片 8 个仿真步 = 400ms
const SIM_MS = 50; // 仿真步长 50ms（与 §2.1 一致）
const NX = 32; // 像素阵列数
const NY = 16; // 像素阵行数
const CELL_FAB = 2.8; // 每格覆盖的布纹像素（与 §2.1 的 2.66 同一量级）
const FAB_OX0 = 320; // 布纹横向起点
const FAB_OY = 210; // 布纹纵向起点
// 布纹滑动速度 7.5 布纹像素/秒：每片滑过 3 像素，是织纹周期（10 像素）的 0.3。
// §2.1 用的是 20 像素/秒，这里放慢是实测决定的两件事：
//   滑太远（≥5 像素/片）时，每片都能越过阈值的事件集几乎一样（都是"梯度最陡的那几列"），
//   5 片会长得越来越像；滑 3 像素时每片的相位错开 0.3 周期，5 片的点阵才真的各不相同
//   （实测片间不一致率 0.41，与"随机独立"的基线相当，而不是高度相关）。
const SLIDE = 7.5;
// 阈值：本模块像素阵比 §2.1 密得多（512 格 vs 24 格），若沿用 §2.1 的默认 C = 0.08，
// 每片会报出上千个事件，缩略图会糊成一片；C 提到 0.28 以上则整片一个事件都不报
// （实测有一段很陡的空窗）。C = 0.18 落在 §2.1 滑块的 0.02–0.30 之内，
// 实测每片约 100–220 个事件：既看得出形状，又不会糊。
const C_EVENT = 0.18;

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
const UNREACHED = '#d7deea';

// ---------------------------------------------------------------- 仿真

export interface EvPt {
  c: number; // 列 0..NX-1
  r: number; // 行 0..NY-1
  p: number; // +1 变亮 / -1 变暗
}

export interface SliceInfo {
  pts: EvPt[];
  count: number;
  ox: number; // 这一片中点时刻，布纹滑到了哪里（缩略图底下垫的布纹用它）
  // 归一化包围盒与质心（0..1），用来核对"5 片彼此明显不同"
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  fp: number; // 指纹：事件集合的 32 位哈希
}

export interface ITEModel {
  slices: SliceInfo[]; // 5 片
  dens: Float32Array[]; // 长度 6：dens[k] = 前 k 片叠加后的逐格事件计数
  cumCount: number[]; // 长度 6：前 k 片的事件总数
  densMax: number; // 5 片全并入后单格最大计数（灰度归一化用）
}

function makeSliceInfo(pts: EvPt[], ox: number): SliceInfo {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0, sx = 0, sy = 0, fp = 2166136261;
  for (const pt of pts) {
    const u = (pt.c + 0.5) / NX;
    const v = (pt.r + 0.5) / NY;
    if (u < x0) x0 = u;
    if (u > x1) x1 = u;
    if (v < y0) y0 = v;
    if (v > y1) y1 = v;
    sx += u;
    sy += v;
    fp = (Math.imul(fp ^ (pt.c * 3 + pt.r * 7 + (pt.p > 0 ? 1 : 2)), 16777619) >>> 0);
  }
  const n = pts.length;
  if (n === 0) return { pts, count: 0, ox, x0: 0, y0: 0, x1: 0, y1: 0, cx: 0.5, cy: 0.5, fp: 0 };
  return { pts, count: n, ox, x0, y0, x1, y1, cx: sx / n, cy: sy / n, fp };
}

/**
 * 跑完整段事件流并按时间切成 5 片。只调用一次（挂载时），之后 rAF 只用结果。
 * 第一个仿真步只建立参考值、不报事件（与 §2.1 的 primed 一致）。
 */
export function buildModel(): ITEModel {
  const npix = NX * NY;
  const ref = new Float32Array(npix);
  const acc = new Float32Array(npix);
  const dens: Float32Array[] = [new Float32Array(npix)];
  const slices: SliceInfo[] = [];
  const cumCount: number[] = [0];
  const th = C_EVENT * 255;
  let primed = false;
  let ox = FAB_OX0;

  for (let s = 0; s < SLICES; s++) {
    const pts: EvPt[] = [];
    const oxStart = ox;
    for (let k = 0; k < SLICE_STEPS; k++) {
      ox += (SLIDE * SIM_MS) / 1000;
      // 真读一次像素：这一块布纹的面积平均（cellMeans 内部会 getImageData，所以只在这里调）
      const g = cellMeans(ox, FAB_OY, NX * CELL_FAB, NY * CELL_FAB, CELL_FAB);
      for (let r = 0; r < NY; r++) {
        const rr = Math.min(r, g.rows - 1) * g.cols;
        for (let c = 0; c < NX; c++) {
          const id = r * NX + c;
          const v = g.vals[rr + Math.min(c, g.cols - 1)];
          if (!primed) {
            ref[id] = v; // 建立参考值：不报事件
            continue;
          }
          const d = v - ref[id];
          if (Math.abs(d) > th) {
            pts.push({ c, r, p: d > 0 ? 1 : -1 });
            ref[id] = v; // 只有报事件时才更新参考值
          }
        }
      }
      primed = true;
    }
    // 缩略图底下垫的布纹取这一片的**中点**时刻：这一片里布纹只滑过 3 像素，
    // 中点与片内任何时刻最多差 1.5 像素（显示上约 3px），比一个事件点还小。
    slices.push(makeSliceInfo(pts, (oxStart + ox) / 2));
    cumCount.push(cumCount[cumCount.length - 1] + pts.length);
    for (const pt of pts) acc[pt.r * NX + pt.c] += 1;
    dens.push(acc.slice());
  }

  let densMax = 0;
  for (let i = 0; i < npix; i++) if (acc[i] > densMax) densMax = acc[i];
  return { slices, dens, cumCount, densMax };
}

// ---------------------------------------------------------------- 版面

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  thumbs: Box[]; // 5 张时间片缩略图
  labelSlices: { x: number; y: number };
  bar: Box; // 残差条
  overlay: Box; // 叠加出来的细节
  labelOverlay: { x: number; y: number };
  legend: { x: number; y: number };
}

const TH_W = 190;
const TH_H = 120;
const TH_PITCH = 204; // 5 张共 1036px，落在 x 30–1066 内
const TH_Y = 66;
const TH_PAD = 7; // 缩略图里边距
const TH_TOP = 16; // 顶部留给片序号的带高（底部同样留 16 给事件数）
// 缩略图里的事件区：32 × 16 格按等比缩放进 176 × 88（布纹底用同一套比例，所以对得上）
const THUMB_SCALE = 5.5;

export function layoutFor(narrow: boolean): Layout {
  const thumbs: Box[] = [];
  for (let i = 0; i < SLICES; i++) {
    thumbs.push({ x: 30 + i * TH_PITCH, y: TH_Y, w: TH_W, h: TH_H });
  }
  if (narrow) {
    return {
      thumbs,
      labelSlices: { x: 30, y: 56 },
      // 条右端要留出写累积数字的地方，所以窄屏的条比 5 张缩略图略短
      bar: { x: 30, y: 240, w: 996, h: 30 },
      overlay: { x: 30, y: 350, w: 416, h: 208 },
      labelOverlay: { x: 30, y: 340 },
      legend: { x: 30, y: 612 },
    };
  }
  return {
    thumbs,
    labelSlices: { x: 30, y: 56 },
    bar: { x: 30, y: 246, w: 530, h: 26 },
    // 叠加图按 32×16 的格等比放大：240×120 就是 7.5px 一格，正好落在这块区域里
    overlay: { x: 717, y: 200, w: 240, h: 120 },
    labelOverlay: { x: 717, y: 192 },
    legend: { x: 30, y: 380 },
  };
}

// 缩略图里事件点的绝对坐标只跟版面有关，缓存起来，别在 rAF 里每帧重建对象数组。
let _ptCacheKey = '';
let _ptCache: { x: number; y: number; p: number }[][] = [];

function slicePoints(L: Layout): { x: number; y: number; p: number }[][] {
  const key = `${L.thumbs[0].x},${L.thumbs[0].y}`;
  if (key === _ptCacheKey) return _ptCache;
  _ptCacheKey = key;
  _ptCache = [];
  for (let i = 0; i < SLICES; i++) _ptCache.push([]);
  return _ptCache;
}

/** 把某一片的点填进（缓存的）绝对坐标数组。 */
function fillPoints(L: Layout, m: ITEModel, i: number): { x: number; y: number; p: number }[] {
  const box = L.thumbs[i];
  const ax = box.x + TH_PAD;
  const ay = box.y + TH_TOP;
  const out = slicePoints(L)[i];
  const src = m.slices[i].pts;
  while (out.length < src.length) out.push({ x: 0, y: 0, p: 0 });
  out.length = src.length;
  for (let k = 0; k < src.length; k++) {
    const pt = src[k];
    out[k].x = ax + (pt.c + 0.5) * THUMB_SCALE;
    out[k].y = ay + (pt.r + 0.5) * THUMB_SCALE;
    out[k].p = pt.p > 0 ? 1 : -1;
  }
  return out;
}

// ---------------------------------------------------------------- 绘制

function drawThumb(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  m: ITEModel,
  i: number,
  step: number,
  pulse: number
): void {
  const box = L.thumbs[i];
  // "当前"= 本步刚并入的那一片（= step−1），不是"下一片要并入的"。
  // 这样橙色高亮、条上橙色那一格、反馈里"左图高亮的那张"三者指的是同一片；
  // step 0 时还没开始，5 张都是"未到"，没有高亮。
  const consumed = i < step - 1;
  const current = i === step - 1;

  const ax = box.x + TH_PAD;
  const ay = box.y + TH_TOP;
  const aw = NX * THUMB_SCALE;
  const ah = NY * THUMB_SCALE;

  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.fillRect(box.x, box.y, box.w, box.h);

  // 底色：这一片中点时刻那块真实布纹（淡垫，让"布纹在动"看得见；
  // 5 张缩略图因此本来就长得不一样，不是靠调色区分）
  ctx.globalAlpha = 0.3;
  ctx.drawImage(
    fabricCanvas(),
    m.slices[i].ox, FAB_OY, NX * CELL_FAB, NY * CELL_FAB,
    ax, ay, aw, ah
  );
  ctx.globalAlpha = 1;

  // 事件点：真正属于这一片的点，按极性配色
  const pts = fillPoints(L, m, i);
  ctx.globalAlpha = consumed || current ? 1 : 0.3;
  drawEventDots(ctx, pts, 'polarity');
  ctx.globalAlpha = 1;

  // 边框：已消费紫双线 / 当前橙脉动 / 未到浅灰
  if (current) {
    ctx.strokeStyle = PAPER.orange;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.4 + 0.6 * pulse;
    ctx.strokeRect(box.x + 1.5, box.y + 1.5, box.w - 3, box.h - 3);
    ctx.globalAlpha = 1;
  } else if (consumed) {
    ctx.strokeStyle = PAPER.purple;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(box.x + 0.8, box.y + 0.8, box.w - 1.6, box.h - 1.6);
    ctx.lineWidth = 1;
    ctx.strokeRect(box.x + 4.5, box.y + 4.5, box.w - 9, box.h - 9);
  } else {
    ctx.strokeStyle = UNREACHED;
    ctx.lineWidth = 1;
    ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
  }

  // 裸数字：左上 = 片序号，右下 = 这一片里的事件数
  ctx.font = `600 12px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = current ? PAPER.orange : consumed ? PAPER.purple : PAPER.muted;
  ctx.fillText(String(i + 1), box.x + TH_PAD + 1, box.y + 12);

  ctx.textAlign = 'right';
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = current ? PAPER.orange : consumed ? PAPER.ink : PAPER.muted;
  ctx.fillText(String(m.slices[i].count), box.x + box.w - TH_PAD, box.y + box.h - 5);
  ctx.restore();
}

function drawBar(ctx: CanvasRenderingContext2D, L: Layout, m: ITEModel, step: number): void {
  const box = L.bar;
  const seg = box.w / SLICES;
  const cy = box.y + box.h / 2;

  ctx.save();

  // 底槽 + 已并入的片（最后一格是"本步新并入的那一份"，用橙色区分）
  ctx.fillStyle = PAPER.axis;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  for (let i = 0; i < step; i++) {
    ctx.fillStyle = i === step - 1 ? PAPER.orange : PAPER.purple;
    ctx.fillRect(box.x + i * seg, box.y, seg, box.h);
  }

  // 分片刻度（5 片各占一格）
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < SLICES; i++) {
    const x = Math.round(box.x + i * seg) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, box.y + 1);
    ctx.lineTo(x, box.y + box.h - 1);
    ctx.stroke();
  }

  ctx.strokeStyle = PAPER.printEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

  // 条上裸数字：已并入几片
  ctx.fillStyle = step >= SLICES ? '#ffffff' : PAPER.ink;
  ctx.font = `600 14px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${step}/${SLICES}`, box.x + box.w - 9, cy);

  // 条右端：累积到多少（事件总数）
  ctx.fillStyle = PAPER.purple;
  ctx.font = `600 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(String(m.cumCount[step]), box.x + box.w + 14, cy);

  // 条上方：本步新并入的那份有多大（= 当前这一片的事件数），写在刚填满的那一格右端
  if (step > 0) {
    ctx.fillStyle = PAPER.orange;
    ctx.font = `600 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(m.slices[step - 1].count), clamp(box.x + seg * step, box.x + 20, W - 34), box.y - 6);
  }
  ctx.restore();
}

function drawOverlay(ctx: CanvasRenderingContext2D, L: Layout, m: ITEModel, step: number): void {
  const box = L.overlay;
  const cw = box.w / NX;
  const ch = box.h / NY;
  const d = m.dens[step];
  const norm = m.densMax > 0 ? m.densMax : 1;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(box.x, box.y, box.w, box.h);

  // 真实叠加出来的灰度图：每格 = 已消费的几片里落在这一格的事件总数。
  // 归一化用的是 5 片全并入后的最大值，所以片数越多整体越密 —— 这是真的在累加。
  for (let r = 0; r < NY; r++) {
    for (let c = 0; c < NX; c++) {
      const v = d[r * NX + c];
      const g = v > 0 ? Math.pow(Math.min(1, v / norm), 0.6) : 0;
      const grey = Math.round(255 - g * 215);
      ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
      ctx.fillRect(box.x + c * cw, box.y + r * ch, cw + 0.5, ch + 0.5);
    }
  }

  ctx.strokeStyle = step > 0 ? PAPER.purple : PAPER.printEdge;
  ctx.lineWidth = step > 0 ? 2 : 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
  ctx.restore();
}

export function renderITE(
  ctx: CanvasRenderingContext2D,
  H: number,
  L: Layout,
  m: ITEModel,
  step: number,
  time: number
): void {
  const pulse = 0.5 + 0.5 * Math.sin((time / 320) * Math.PI * 2);

  clearScene(ctx, W, H);

  for (let i = 0; i < SLICES; i++) drawThumb(ctx, L, m, i, step, pulse);
  drawBar(ctx, L, m, step);
  drawOverlay(ctx, L, m, step);

  drawSceneLabel(ctx, L.labelSlices.x, L.labelSlices.y, '事件时间片');
  drawSceneLabel(ctx, L.labelOverlay.x, L.labelOverlay.y, '叠加细节');

  // 凡画事件点必须配「变亮 / 变暗」两项图例；第三项说明紫框 = 已消费
  drawLegend(ctx, L.legend.x, L.legend.y, [
    { color: PAPER.evOn, label: '变亮' },
    { color: PAPER.evOff, label: '变暗' },
    { color: PAPER.purple, label: '已消费' },
  ]);
}

// ---------------------------------------------------------------- 反馈文案
// 逐字照抄规范；每一态都必须包含「原理示意，非模型真实输出」。

function feedbackFor(step: number): { text: string; cls: string } {
  if (step <= 0) {
    return {
      cls: 'info',
      text: '还没开始。此刻的纹理特征就是上一帧传来的传播特征。下面 5 张图，是这段时间的事件按时间切成的 5 片——每一片都是真实算出来的。原理示意，非模型真实输出。',
    };
  }
  if (step >= SLICES) {
    return {
      cls: 'good',
      text: '5 片全部并入，残差累加完毕——这就是 f_t^T = f_{t-1} + Σζ^i（Eq. 5–6）。消融显示 N = 5 最好，加到 8 次没有额外收益（Table VIII）。上面那张论文原图 Fig.5(b) 画的就是这套结构。原理示意，非模型真实输出。',
    };
  }
  return {
    cls: 'info',
    text: `第 ${step} 片并入。这一片里的事件集中在画面中这些位置（左图高亮的那张），网络从它里面提取纹理线索，产出一份残差补到特征上。右边能看到细节又密了一层。原理示意，非模型真实输出。`,
  };
}

// ---------------------------------------------------------------- 组件

export const M6_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<ITEModel | null>(null);
  if (modelRef.current === null) {
    // 事件流是固定的：整段仿真只在挂载时算一次，之后 rAF 只画不算。
    modelRef.current = buildModel();
  }
  const model = modelRef.current;

  const stepRef = useRef(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let H = H_WIDE;
    let narrow = false;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let raf = 0;
    let running = false;
    let ready = false;

    const frame = (now: number) => {
      const shown = canvas.getBoundingClientRect().width;
      const wantNarrow = shown > 0 && shown < 720;
      const wantH = wantNarrow ? H_NARROW : H_WIDE;
      if (wantH !== H) {
        H = wantH;
        narrow = wantNarrow;
        try {
          ctx = setupCanvas(canvas, W, H);
        } catch {
          /* 保持上一次尺寸继续画 */
        }
      }

      renderITE(ctx, H, layoutFor(narrow), model, stepRef.current, now);

      if (!ready) {
        ready = true;
        canvas.classList.add('is-ready');
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [model]);

  const stepBy = (delta: number) => setStep((v) => clamp(v + delta, 0, SLICES));
  const reset = () => setStep(0);

  const feedback = feedbackFor(step);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="ITE 迭代步进器"
      />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => stepBy(-1)} disabled={step === 0}>
          上一步
        </button>
        <button className="tiny" onClick={() => stepBy(1)} disabled={step >= SLICES}>
          下一步
        </button>
        <button className="tiny ghost" onClick={reset} disabled={step === 0}>
          重置
        </button>
        <span className="step-label">
          已并入 <b>{step}</b> / {SLICES} 片
        </span>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default M6_1;
