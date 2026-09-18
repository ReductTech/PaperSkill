import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawEventDots,
  drawLegend,
  drawPrint,
  drawSceneLabel,
  PAPER,
} from './halftoneKit';
import { cellMeans, drawFabricPatch, fabricCanvas } from './fabricKit';
import type { WidgetProps } from './registry';

// §5.1 双向传播的时间展开（版式对齐论文 Fig.5(a)）
//
// 三列 = 三个时刻 t−2 / t−1 / t，列心 x = 210 / 540 / 870。
// 每列自上而下：输入帧 → 纹理方块 / 运动方块（⊕ 圆把上一刻的特征送进来，C 圆把两路拼起来）
//              → 上采样梯形 → 输出帧。
// 两条传播路径同时存在：前向（蓝虚线）从第 i 列的 C 圆走到第 i+1 列的 ⊕ 圆；
// 后向（橙虚线）从第 i+1 列的 ⊕ 圆走回第 i 列的 C 圆，整体压低 14px 走，互不遮挡。
// 选中的方向线加粗到 2.4px；**每个方向上都有两个光点**沿路径循环流动（周期 2.4s、
// easeInOutQuad、两个光点相位差半个周期），光点带发光（半径渐大的半透明圆 + 实心圆）。
// 选中的方向光点半径 5、alpha 1；未选中的方向半径 3、alpha 0.35。
// 步进 0–2 选当前时刻，当前列的两个方块、⊕ 不进、C 圆与输入帧加绿描边。
//
// 悬停（辅助交互，主操作仍是 chip 与步进）：
//   指针落在某列的命中区（列心 ±90px）内 → 该列整条链路（输入帧 → 纹理/运动方块 → ⊕/C 圆
//   → 上采样 → 输出帧）加 PAPER.green 外发光，其余两列整体 alpha 降到 0.32。
//   指针坐标用 canvas.getBoundingClientRect() 换算回固有坐标。
//
// 点击（三个可展开的细节面板，状态 expanded: 'none' | 'texture' | 'motion' | 'fusion'）：
//   点某列的「纹理」/「运动」方块（3 列 × 2 = 6 个命中区）→ 画布下方展开该分支的细节面板；
//   点某列的 ⊕ 圆 → 展开融合面板（MathML 公式 + 四路特征色块）。同一时刻只展开一个，
//   再点同一个收起，点右上角「收起」也收起。展开时主画布上被点中的方块/圆加绿双线描边。
//   细节面板是一块独立的 1080×260 画布（+ DOM 说明文字），与主画布共用同一套绘图词汇。
//
// 性能：布纹在一块 2200×560 的离屏画布上烘一次（fabricKit 内部已缓存），
// rAF 里只做 drawImage，不取像素、不做面积平均。
// 细节面板的事件仿真（cellMeans 会 getImageData）与染色布纹、叠加图只在**展开的那一刻**
// 构建一次并缓存，rAF 里同样只绘制。

const W = 1080;
const H_WIDE = 520;
const H_NARROW = 780;

// 展开的分支面板：画布下方一块独立的 1080×260 画布（不随主画布窄屏加高）
const DETAIL_H = 260;

// 相邻两帧之间真实存在的位移（显示像素）。布纹线宽 10px，错开 TRUE_D 一眼可见。
const TRUE_D = 34;
const FAB_OX = 320; // 帧 t 的布纹窗口左上角
const FAB_OY = 140;

const FLOW_MS = 2400; // 光点沿路径跑一圈的周期
// 每个方向上两个光点，第二个与第一个相位差半个周期
const SPOT_PHASES = [0, 0.5];

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
const MINUS = '−';
const UNREACHED = '#d7deea';

type Dir = 'fwd' | 'bwd';
type Branch = 'texture' | 'motion';
type Expanded = 'none' | 'texture' | 'motion' | 'fusion';

/** 主画布上的命中区：某一列的纹理方块 / 运动方块 / ⊕ 圆。 */
interface Hit {
  col: number;
  kind: Branch | 'plus';
}

// 列心（绘图与命中区共用）
const COL_X: number[] = [210, 540, 870];
const HIT_DX = 90; // 悬停命中区 = 列心 ±90px
const PLUS_HIT_R = 18; // ⊕ 的命中半径放宽到 18，比画出来的 11 好点

const T2 = 't' + MINUS + '2';
const T1 = 't' + MINUS + '1';
const TIME_NAME = [T2, T1, 't'];

const FWD_HEAD =
  '前向：特征从 ' + T2 + ' 一路传到 t，每一列都接收左边一列传来的特征。当前时刻是 ';
const BWD_HEAD =
  '后向：特征从未来往回流，从 t 传回 ' +
  T2 +
  '。前后两个方向跑完之后，两条网络的隐状态互相连接——这就是双向循环。当前时刻是 ';
const INFO_TAIL = '。';

interface Pt {
  x: number;
  y: number;
}

/** 一屏（宽屏 / 窄屏）的全部坐标。窄屏只把各层往下摊开，列心不动。 */
interface Layout {
  colX: number[];
  inW: number;
  inH: number;
  inY: number;
  evX: number[];
  evY: number;
  evW: number;
  evH: number;
  boxW: number;
  boxH: number;
  texY: number;
  motY: number;
  plusDX: number;
  plusR: number;
  plusY: number;
  cR: number;
  cY: number;
  upY: number;
  upH: number;
  upWTop: number;
  upWBot: number;
  outW: number;
  outH: number;
  outY: number;
  labelInY: number;
  labelOutY: number;
  legendX: number;
  legendY: number;
  evLegendY: number;
}

function layout(narrow: boolean): Layout {
  const base: Layout = {
    colX: COL_X,
    inW: 140,
    inH: 86,
    inY: 56,
    evX: [290, 620],
    evY: 78,
    evW: 170,
    evH: 40,
    boxW: 140,
    boxH: 46,
    texY: 190,
    motY: 262,
    plusDX: 92,
    plusR: 11,
    plusY: 249, // (纹理底 236 + 运动顶 262) / 2
    cR: 12,
    cY: 330, // 运动底 308 + 22
    upY: 360,
    upH: 38,
    upWTop: 60,
    upWBot: 120,
    outW: 140,
    outH: 86,
    outY: 412,
    labelInY: 104,
    labelOutY: 462,
    legendX: 24,
    legendY: 505,
    evLegendY: 140,
  };
  if (!narrow) return base;
  // 窄屏：输入帧与事件条不动，下面各层依次下移，层间留 40–60px 呼吸。
  const texY = 238;
  const motY = 358;
  const cY = motY + base.boxH + 22;
  return {
    ...base,
    texY,
    motY,
    plusY: (texY + base.boxH + motY) / 2,
    cY,
    upY: 504,
    outY: 600,
    labelOutY: 644,
    legendY: 724,
  };
}

// ---------------------------------------------------------------- 事件点

interface EvDot {
  x: number;
  y: number;
  on: boolean;
}

/** 稀疏事件点：模块加载时按固定种子撒一次，之后每帧照搬，rAF 里不做随机。 */
function makeDots(w: number, h: number, seed: number): EvDot[] {
  const out: EvDot[] = [];
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 26; i++) {
    const x = 26 + rnd() * (w - 34); // 左侧 26px 留给 E 记号
    const y = 6 + rnd() * (h - 12);
    out.push({ x, y, on: rnd() > 0.42 });
  }
  return out;
}

const EV_DOTS: EvDot[][] = [makeDots(170, 40, 20260915), makeDots(170, 40, 73021)];

// ---------------------------------------------------------------- 路径工具

function polyLen(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

/** 折线上距起点 d 个显示像素处的点。d 会被夹在 [0, 全长] 内。 */
function polyAt(pts: Pt[], d: number): Pt {
  const total = polyLen(pts);
  if (!(total > 0)) return { x: pts[0].x, y: pts[0].y };
  const want = clamp(d, 0, total);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const seg = Math.hypot(dx, dy);
    if (seg < 1e-6) continue;
    if (acc + seg >= want) {
      const k = (want - acc) / seg;
      return { x: pts[i - 1].x + dx * k, y: pts[i - 1].y + dy * k };
    }
    acc += seg;
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y };
}

/** 前向：第 i 列的 C 圆 → 第 i+1 列的 ⊕ 圆，中间过一次折。 */
function fwdPts(L: Layout, i: number): Pt[] {
  const c0 = L.colX[i];
  const c1 = L.colX[i + 1];
  const mid = (c0 + c1) / 2;
  return [
    { x: c0 + L.cR, y: L.cY },
    { x: mid, y: L.cY },
    { x: mid, y: L.plusY },
    { x: c1 - L.plusDX - L.plusR, y: L.plusY },
  ];
}

/** 后向：第 i 列的 ⊕ 圆 → 第 i−1 列的 C 圆；横段比前向低 14px，从左侧进 C。 */
function bwdPts(L: Layout, i: number): Pt[] {
  const c1 = L.colX[i];
  const c0 = L.colX[i - 1];
  const sx = c1 - L.plusDX;
  const yB = L.cY + 14;
  const xUp = c0 - 34;
  return [
    { x: sx, y: L.plusY + L.plusR },
    { x: sx, y: yB },
    { x: xUp, y: yB },
    { x: xUp, y: L.cY },
    { x: c0 - L.cR, y: L.cY },
  ];
}

// ---------------------------------------------------------------- 外发光小件
// 悬停高亮用：给一个元素的轮廓套一圈绿色外发光（只描边，不改元素本身的画法）。

function glowRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.shadowColor = PAPER.green;
  ctx.shadowBlur = 13;
  ctx.strokeStyle = PAPER.green;
  ctx.lineWidth = 1.3;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function glowCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  ctx.save();
  ctx.shadowColor = PAPER.green;
  ctx.shadowBlur = 13;
  ctx.strokeStyle = PAPER.green;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** 悬停时非命中列的整体透明度。 */
function colAlpha(hover: number | null, i: number): number {
  if (hover === null) return 1;
  return hover === i ? 1 : 0.32;
}

// ---------------------------------------------------------------- 绘制

/** 直线箭头：先画到箭头根部，再补一个实心三角头。 */
function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lw: number
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (!(len > 1)) return;
  const ang = Math.atan2(dy, dx);
  const head = Math.min(9, len - 1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(ang) * head * 0.75, y2 - Math.sin(ang) * head * 0.75);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(ang - 0.4) * head, y2 - Math.sin(ang - 0.4) * head);
  ctx.lineTo(x2 - Math.cos(ang + 0.4) * head, y2 - Math.sin(ang + 0.4) * head);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 一条传播路径：虚线折线 + 末段方向上的箭头 + 沿路径循环流动的光点。
 * spots 是各光点在折线上的位置比例（0..1，调用方已做过 easeInOutQuad）；
 * r / spotAlpha 由调用方按「是否选中该方向」给定（选中 5 / 1，未选中 3 / 0.35）。
 */
function drawFlowPath(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  color: string,
  lw: number,
  alpha: number,
  spots: number[],
  r: number,
  spotAlpha: number
): void {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.setLineDash([]);

  const end = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
  const head = 8 + lw;
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - Math.cos(ang - 0.42) * head, end.y - Math.sin(ang - 0.42) * head);
  ctx.lineTo(end.x - Math.cos(ang + 0.42) * head, end.y - Math.sin(ang + 0.42) * head);
  ctx.closePath();
  ctx.fill();

  const total = polyLen(pts);
  if (total > 0) {
    for (const s of spots) {
      const p = polyAt(pts, clamp(s, 0, 1) * total);
      // 发光：先画半径渐大的半透明圆，再叠一个实心圆
      ctx.globalAlpha = spotAlpha * 0.16;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = spotAlpha * 0.34;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = spotAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      // 选中方向的光点加一个亮的芯，未选中方向不加（它本来就淡）
      if (spotAlpha > 0.9) {
        ctx.fillStyle = PAPER.print;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
      }
    }
  }
  ctx.restore();
}

/** 列内连线：帧→纹理→运动→C→上采样→输出，另加 ⊕ 汇入纹理的那一笔。 */
function drawWires(ctx: CanvasRenderingContext2D, L: Layout, c: number): void {
  const texX = c - L.boxW / 2;
  arrow(ctx, c, L.inY + L.inH, c, L.texY - 2, PAPER.muted, 1.4);
  arrow(ctx, c, L.texY + L.boxH, c, L.motY - 2, PAPER.muted, 1.4);
  arrow(ctx, c, L.motY + L.boxH, c, L.cY - L.cR - 2, PAPER.muted, 1.4);
  arrow(ctx, c, L.cY + L.cR, c, L.upY - 2, PAPER.muted, 1.4);
  arrow(ctx, c, L.upY + L.upH, c, L.outY - 2, PAPER.muted, 1.4);
  arrow(
    ctx,
    c - L.plusDX + L.plusR,
    L.plusY,
    texX - 2,
    L.texY + L.boxH / 2,
    PAPER.muted,
    1.4
  );
}

/** 输入 / 输出小图。blurry 为真时先加一层模糊，用来表现低分辨率帧。 */
function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ox: number,
  oy: number,
  blurry: boolean,
  edge: string,
  edgeW: number,
  cap: string
): void {
  ctx.save();
  if (blurry) {
    // 往外多画 4px，模糊出来的软边落在描边之外
    ctx.filter = 'blur(1.3px)';
    drawFabricPatch(ctx, x - 4, y - 4, w + 8, h + 8, ox - 4, oy - 4);
    ctx.filter = 'none';
  } else {
    drawFabricPatch(ctx, x, y, w, h, ox, oy);
  }
  ctx.strokeStyle = edge;
  ctx.lineWidth = edgeW;
  ctx.strokeRect(x + edgeW / 2, y + edgeW / 2, w - edgeW, h - edgeW);

  // 时刻记号写在画面内，属于图形内容，不占短标签额度
  ctx.font = '12px ' + FONT;
  const tw = ctx.measureText(cap).width;
  ctx.fillStyle = 'rgba(255,253,246,0.88)';
  ctx.fillRect(x + 4, y + 4, tw + 8, 16);
  ctx.fillStyle = PAPER.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(cap, x + 8, y + 12.5);
  ctx.restore();
}

/** 方块：纹理 / 运动。选中列用绿色外发光 + 双重描边；被点开面板的方块用绿双线 + 绿底。 */
function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  edge: string,
  fill: string,
  label: string,
  cur: boolean,
  pulse: number,
  pick: boolean
): void {
  ctx.save();
  ctx.fillStyle = pick ? 'rgba(34,141,92,0.16)' : fill;
  ctx.fillRect(x, y, w, h);
  if (pick) {
    ctx.shadowColor = PAPER.green;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = PAPER.green;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.1;
    ctx.strokeRect(x + 6.5, y + 6.5, w - 13, h - 13);
  } else if (cur) {
    ctx.shadowColor = PAPER.green;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = PAPER.green;
    ctx.lineWidth = 2.4;
    ctx.strokeRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.4 + 0.6 * pulse;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(x + 0.9, y + 0.9, w - 1.8, h - 1.8);
  }
  ctx.fillStyle = PAPER.ink;
  ctx.font = '15px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
  ctx.restore();
}

/** 圆节点：⊕（特征汇入）与 C（两路拼接）。pick = 该圆是当前展开面板的锚点。 */
function drawCircleNode(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  edge: string,
  label: string,
  cur: boolean,
  pulse: number,
  font: string,
  pick: boolean
): void {
  ctx.save();
  ctx.fillStyle = pick ? 'rgba(34,141,92,0.16)' : PAPER.print;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  if (pick) {
    ctx.shadowColor = PAPER.green;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = PAPER.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4.6, 0, Math.PI * 2);
    ctx.stroke();
  } else if (cur) {
    ctx.shadowColor = PAPER.green;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = PAPER.green;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.4 + 0.6 * pulse;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = PAPER.ink;
  ctx.font = font + ' ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + 0.5);
  ctx.restore();
}

/** 上采样梯形：上窄下宽。 */
function drawTrapezoid(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  h: number,
  wTop: number,
  wBot: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - wTop / 2, y);
  ctx.lineTo(cx + wTop / 2, y);
  ctx.lineTo(cx + wBot / 2, y + h);
  ctx.lineTo(cx - wBot / 2, y + h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(34,141,92,0.13)';
  ctx.fill();
  ctx.strokeStyle = PAPER.green;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = PAPER.ink;
  ctx.font = '13px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('上采样', cx, y + h * 0.68);
  ctx.restore();
}

/** 事件条：紫色横条 + 稀疏事件点 + 左端一个 E 记号。 */
function drawEventBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dots: EvDot[]
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(124,58,237,0.09)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PAPER.purple;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x + 0.8, y + 0.8, w - 1.6, h - 1.6);
  for (const d of dots) {
    ctx.fillStyle = d.on ? PAPER.evOn : PAPER.evOff;
    ctx.fillRect(x + d.x - 1.5, y + d.y - 1.5, 3, 3);
  }
  ctx.fillStyle = PAPER.purple;
  ctx.font = 'italic 15px ' + FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', x + 9, y + h / 2 + 0.5);
  ctx.restore();
}

/**
 * 一列的全部图形内容。
 * alpha = 悬停时整列的透明度（非命中列 0.32）；glow = 命中列，整条链路加绿色外发光；
 * pick = 这一列里被点开面板的那个节点（纹理/运动方块或 ⊕ 圆）。
 */
function drawColumn(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  ci: number,
  cur: boolean,
  pulse: number,
  glow: boolean,
  pick: Hit | null,
  alpha: number
): void {
  const c = L.colX[ci];
  const ox = FAB_OX - ci * TRUE_D; // 三帧依次错开 TRUE_D，内容一点点往右跑
  const pk = (k: Branch | 'plus'): boolean => pick !== null && pick.col === ci && pick.kind === k;

  ctx.save();
  ctx.globalAlpha = alpha;

  drawTile(
    ctx,
    c - L.inW / 2,
    L.inY,
    L.inW,
    L.inH,
    ox,
    FAB_OY,
    true,
    cur ? PAPER.green : PAPER.printEdge,
    cur ? 2.4 : 1.2,
    TIME_NAME[ci]
  );
  drawBox(
    ctx,
    c - L.boxW / 2,
    L.texY,
    L.boxW,
    L.boxH,
    PAPER.purple,
    'rgba(124,58,237,0.08)',
    '纹理',
    cur,
    pulse,
    pk('texture')
  );
  drawBox(
    ctx,
    c - L.boxW / 2,
    L.motY,
    L.boxW,
    L.boxH,
    PAPER.blue,
    'rgba(39,68,110,0.08)',
    '运动',
    cur,
    pulse,
    pk('motion')
  );
  drawCircleNode(
    ctx,
    c - L.plusDX,
    L.plusY,
    L.plusR,
    PAPER.purple,
    '⊕',
    false,
    pulse,
    '15px',
    pk('plus')
  );
  drawCircleNode(ctx, c, L.cY, L.cR, PAPER.blue, 'C', cur, pulse, 'bold 14px', false);
  drawTrapezoid(ctx, c, L.upY, L.upH, L.upWTop, L.upWBot);
  drawTile(
    ctx,
    c - L.outW / 2,
    L.outY,
    L.outW,
    L.outH,
    ox,
    FAB_OY,
    false,
    PAPER.blue,
    1.4,
    TIME_NAME[ci]
  );

  // 悬停命中列：整条链路（输入帧 → 两个方块 → ⊕/C → 上采样 → 输出帧）加绿色外发光
  if (glow) {
    glowRect(ctx, c - L.inW / 2 - 2, L.inY - 2, L.inW + 4, L.inH + 4);
    glowRect(ctx, c - L.boxW / 2 - 2, L.texY - 2, L.boxW + 4, L.boxH + 4);
    glowRect(ctx, c - L.boxW / 2 - 2, L.motY - 2, L.boxW + 4, L.boxH + 4);
    glowCircle(ctx, c - L.plusDX, L.plusY, L.plusR + 3);
    glowCircle(ctx, c, L.cY, L.cR + 3);
    glowRect(ctx, c - L.upWBot / 2 - 2, L.upY - 2, L.upWBot + 4, L.upH + 4);
    glowRect(ctx, c - L.outW / 2 - 2, L.outY - 2, L.outW + 4, L.outH + 4);
  }
  ctx.restore();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  dir: Dir,
  step: number,
  spots: number[],
  pulse: number,
  hover: number | null,
  pick: Hit | null
): void {
  // 列内连线先画，随后被方块压住（透明度跟着悬停走）
  L.colX.forEach((c, ci) => {
    ctx.save();
    ctx.globalAlpha = colAlpha(hover, ci);
    drawWires(ctx, L, c);
    ctx.restore();
  });

  // 两个方向同时存在、各自两个光点在流动；非选中方向降粗降透明度、光点也变小变淡
  const fwdOn = dir === 'fwd';
  for (let i = 1; i <= 2; i++) {
    drawFlowPath(
      ctx,
      bwdPts(L, i),
      PAPER.orange,
      fwdOn ? 1.2 : 2.4,
      fwdOn ? 0.35 : 1,
      spots,
      fwdOn ? 3 : 5,
      fwdOn ? 0.35 : 1
    );
  }
  for (let i = 0; i <= 1; i++) {
    drawFlowPath(
      ctx,
      fwdPts(L, i),
      PAPER.blue,
      fwdOn ? 2.4 : 1.2,
      fwdOn ? 1 : 0.35,
      spots,
      fwdOn ? 5 : 3,
      fwdOn ? 1 : 0.35
    );
  }

  L.colX.forEach((_c, ci) => {
    drawColumn(
      ctx,
      L,
      ci,
      ci === step,
      pulse,
      hover === ci,
      pick,
      colAlpha(hover, ci)
    );
  });

  L.evX.forEach((ex, k) => drawEventBar(ctx, ex, L.evY, L.evW, L.evH, EV_DOTS[k]));

  drawSceneLabel(ctx, 24, L.labelInY, '输入帧');
  drawSceneLabel(ctx, 24, L.labelOutY, '输出帧');
  drawLegend(ctx, L.legendX, L.legendY, [
    { color: PAPER.blue, label: '前向：特征往未来传' },
    { color: PAPER.orange, label: '后向：特征往过去传' },
  ]);
  drawLegend(ctx, L.evX[0] + 8, L.evLegendY, [
    { color: PAPER.evOn, label: '变亮' },
    { color: PAPER.evOff, label: '变暗' },
  ]);
}

// ================================================================ 细节面板
//
// 三个面板共用一块 1080×260 的独立画布，出现在主画布下方的 DOM 里，与主画布同一套绘图词汇。
// 面板的绘制数据只在**展开的那一刻**构建一次并缓存，rAF 里只绘制、不取像素。

// ---------------------------------------------------------------- 2a 纹理面板：逐个 Bin 打开
//
// 与 §6.1 完全同一套事件模型与仿真参数（32×16 像素阵、C = 0.18、滑速 7.5 布纹 px/s、
// 50ms 一步、5 片 × 8 步 = 400ms 一片），只是版面换成一条 1080×260 的横排：
// 5 个 Bin 并排，右边一块「累积细节」。
//
// 🔴 诚实边界：Bin 里的事件点是真的（对烘出来的布纹做真实的面积平均 + 阈值触发），
// 右边「累积细节」也是这些事件的**真实叠加**；它对应的是"细节一层层累积"这件事，
// 不是网络学出来的特征残差 ζ^i。面板下方的 DOM 里写明了这一点。

const SLICES = 5; // 时间片数 B
const SLICE_STEPS = 8; // 每片 8 个仿真步 = 400ms
const SIM_MS = 50; // 仿真步长
const NX = 32; // 像素阵列数
const NY = 16; // 像素阵行数
const CELL_FAB = 2.8; // 每格覆盖的布纹像素
const ITE_OX0 = 320; // 布纹横向起点
const ITE_OY = 140; // 布纹纵向起点
const SLIDE = 7.5; // 布纹滑动速度（布纹像素/秒）
const C_EVENT = 0.18; // 事件阈值系数
const ITE_OPEN_MS = 600; // 每个 Bin 打开的间隔
const ITE_CYCLE = ITE_OPEN_MS * SLICES + 800; // 第 5 个开完再停 0.8 秒

interface EvPt {
  c: number; // 列 0..NX-1
  r: number; // 行 0..NY-1
  p: number; // +1 变亮 / -1 变暗
}

interface IteSlice {
  pts: EvPt[];
  count: number;
  ox: number; // 这一片中点时刻布纹滑到哪（Bin 底下垫的布纹用它）
}

interface IteModel {
  slices: IteSlice[];
  dens: Float32Array[]; // 长度 6：dens[k] = 前 k 片叠加后的逐格事件计数
  cumCount: number[]; // 长度 6：前 k 片的事件总数
  densMax: number; // 5 片全并入后单格最大计数（灰度归一化用）
}

/**
 * 跑完整段事件流并按时间切成 5 片。只在**第一次展开纹理面板时**调用一次
 * （cellMeans 内部会 getImageData，所以只在这里调），之后 rAF 只用结果。
 * 第一个仿真步只建立参考值、不报事件。
 */
function buildIteModel(): IteModel {
  const npix = NX * NY;
  const ref = new Float32Array(npix);
  const acc = new Float32Array(npix);
  const dens: Float32Array[] = [new Float32Array(npix)];
  const slices: IteSlice[] = [];
  const cumCount: number[] = [0];
  const th = C_EVENT * 255;
  let primed = false;
  let ox = ITE_OX0;

  for (let s = 0; s < SLICES; s++) {
    const pts: EvPt[] = [];
    const oxStart = ox;
    for (let k = 0; k < SLICE_STEPS; k++) {
      ox += (SLIDE * SIM_MS) / 1000;
      const g = cellMeans(ox, ITE_OY, NX * CELL_FAB, NY * CELL_FAB, CELL_FAB);
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
    slices.push({ pts, count: pts.length, ox: (oxStart + ox) / 2 });
    cumCount.push(cumCount[cumCount.length - 1] + pts.length);
    for (const pt of pts) acc[pt.r * NX + pt.c] += 1;
    dens.push(acc.slice());
  }

  let densMax = 0;
  for (let i = 0; i < npix; i++) if (acc[i] > densMax) densMax = acc[i];
  return { slices, dens, cumCount, densMax };
}

let _ite: IteModel | null = null;

/** 事件流是固定的：整段仿真只算一次，之后每帧只画不算。 */
function iteModel(): IteModel {
  if (_ite === null) _ite = buildIteModel();
  return _ite;
}

const TEX_BIN_X = 30;
const TEX_BIN_Y = 64;
const TEX_BIN_W = 140;
const TEX_BIN_H = 110;
const TEX_BIN_PITCH = 152;
const TEX_PAD = 6;
const TEX_TOP = 22; // 事件区相对 Bin 顶的偏移
const TEX_SCALE = 4; // 32 × 4 = 128，正好塞进 Bin 的内宽
const TEX_ACC_X = 806;
const TEX_ACC_Y = 64;
const TEX_ACC_W = 240;
const TEX_ACC_H = 120;

// Bin 内事件点的绝对坐标缓存：版面固定，对象数组复用，rAF 里不重建
const texPts: { x: number; y: number; p: number }[][] = [[], [], [], [], []];

function fillTexPts(m: IteModel, i: number, ax: number, ay: number): { x: number; y: number; p: number }[] {
  const out = texPts[i];
  const src = m.slices[i].pts;
  while (out.length < src.length) out.push({ x: 0, y: 0, p: 0 });
  out.length = src.length;
  for (let k = 0; k < src.length; k++) {
    const pt = src[k];
    out[k].x = ax + (pt.c + 0.5) * TEX_SCALE;
    out[k].y = ay + (pt.r + 0.5) * TEX_SCALE;
    out[k].p = pt.p > 0 ? 1 : -1;
  }
  return out;
}

/** 一个 Bin：真事件点 + 底下的真布纹 + 灰→紫的"打开"描边。 */
function drawTexBin(
  ctx: CanvasRenderingContext2D,
  m: IteModel | null,
  i: number,
  step: number,
  pulse: number
): void {
  const x = TEX_BIN_X + i * TEX_BIN_PITCH;
  const y = TEX_BIN_Y;
  const opened = i < step;
  const current = i === step - 1;
  const ax = x + TEX_PAD;
  const ay = y + TEX_TOP;

  ctx.save();
  ctx.fillStyle = PAPER.print;
  ctx.fillRect(x, y, TEX_BIN_W, TEX_BIN_H);

  if (m) {
    // 底色：这一片中点时刻那块真实布纹
    ctx.globalAlpha = 0.3;
    ctx.drawImage(
      fabricCanvas(),
      m.slices[i].ox,
      ITE_OY,
      NX * CELL_FAB,
      NY * CELL_FAB,
      ax,
      ay,
      NX * TEX_SCALE,
      NY * TEX_SCALE
    );
    // 事件点：真的属于这一片，按极性配色；没打开的 Bin 压淡
    ctx.globalAlpha = opened ? 1 : 0.3;
    drawEventDots(ctx, fillTexPts(m, i, ax, ay), 'polarity');
    ctx.globalAlpha = 1;
  }

  // 描边：没打开是浅灰，打开是紫（当前打开的那个脉动加粗）
  if (current) {
    ctx.strokeStyle = PAPER.purple;
    ctx.lineWidth = 2.6;
    ctx.globalAlpha = 0.4 + 0.6 * pulse;
    ctx.strokeRect(x + 1.3, y + 1.3, TEX_BIN_W - 2.6, TEX_BIN_H - 2.6);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 5, y + 5, TEX_BIN_W - 10, TEX_BIN_H - 10);
  } else if (opened) {
    ctx.strokeStyle = PAPER.purple;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x + 0.8, y + 0.8, TEX_BIN_W - 1.6, TEX_BIN_H - 1.6);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4.5, y + 4.5, TEX_BIN_W - 9, TEX_BIN_H - 9);
  } else {
    ctx.strokeStyle = UNREACHED;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TEX_BIN_W - 1, TEX_BIN_H - 1);
  }

  // 裸数字：左上 = Bin 序号，右下 = 这一片的事件数
  ctx.font = '600 12px ' + FONT;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = opened ? PAPER.purple : PAPER.muted;
  ctx.fillText(String(i + 1), x + TEX_PAD + 1, y + 14);

  ctx.textAlign = 'right';
  ctx.font = '600 13px ' + FONT;
  ctx.fillStyle = opened ? PAPER.ink : PAPER.muted;
  ctx.fillText(String(m ? m.slices[i].count : 0), x + TEX_BIN_W - TEX_PAD, y + TEX_BIN_H - 6);
  ctx.restore();
}

/** 累积细节：已打开的那几片事件的**真实叠加**（逐格计数归一化成灰度）。 */
function drawTexAccum(ctx: CanvasRenderingContext2D, m: IteModel | null, step: number): void {
  const cw = TEX_ACC_W / NX;
  const ch = TEX_ACC_H / NY;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(TEX_ACC_X, TEX_ACC_Y, TEX_ACC_W, TEX_ACC_H);

  if (m) {
    const d = m.dens[step];
    const norm = m.densMax > 0 ? m.densMax : 1;
    for (let r = 0; r < NY; r++) {
      for (let c = 0; c < NX; c++) {
        const v = d[r * NX + c];
        const g = v > 0 ? Math.pow(Math.min(1, v / norm), 0.6) : 0;
        const grey = Math.round(255 - g * 215);
        ctx.fillStyle = 'rgb(' + grey + ',' + grey + ',' + grey + ')';
        ctx.fillRect(TEX_ACC_X + c * cw, TEX_ACC_Y + r * ch, cw + 0.5, ch + 0.5);
      }
    }
  }

  ctx.strokeStyle = step > 0 ? PAPER.purple : PAPER.printEdge;
  ctx.lineWidth = step > 0 ? 2 : 1;
  ctx.strokeRect(TEX_ACC_X + 0.5, TEX_ACC_Y + 0.5, TEX_ACC_W - 1, TEX_ACC_H - 1);

  // 累积到的事件总数（裸数字）
  ctx.fillStyle = PAPER.purple;
  ctx.font = '600 15px ' + FONT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(m ? m.cumCount[step] : 0), TEX_ACC_X + TEX_ACC_W, TEX_ACC_Y + TEX_ACC_H + 22);
  ctx.restore();
}

function renderTexture(ctx: CanvasRenderingContext2D, m: IteModel | null, time: number): void {
  const tt = ((time % ITE_CYCLE) + ITE_CYCLE) % ITE_CYCLE;
  const step = Math.min(SLICES, Math.floor(tt / ITE_OPEN_MS) + 1);
  const pulse = 0.5 + 0.5 * Math.sin((time / 320) * Math.PI * 2);

  clearScene(ctx, W, DETAIL_H);

  for (let i = 0; i < SLICES; i++) drawTexBin(ctx, m, i, step, pulse);
  drawTexAccum(ctx, m, step);

  drawSceneLabel(ctx, TEX_BIN_X, 46, '事件时间片');
  drawSceneLabel(ctx, TEX_ACC_X, 46, '累积细节');
  drawLegend(ctx, TEX_BIN_X, 240, [
    { color: PAPER.evOn, label: '变亮' },
    { color: PAPER.evOff, label: '变暗' },
    { color: PAPER.purple, label: '已打开' },
  ]);
}

// ---------------------------------------------------------------- 2b 运动面板：双流对齐
//
// 直接复用 §7.1 的"真实空间平移 + 叠加出双影"绘制核心：把布纹窗口按该流的估计位移
// 做 1:1 的空间平移，再与没有平移的那一帧各取 0.5 叠起来 —— 偏差多少像素，重影就错开多少像素。
// 两层分别染色成蓝（帧 t−1，被搬动的那一层）与橙（帧 t，参照），另各画一遍套准记号，
// 让"错开多少"肉眼直接可读。偏差是输入量（RGB 20% / 事件 4%），对齐结果是按它真算出来的。

const TTA_TRUE_D = 25; // 两帧之间真实存在的位移（显示像素）
const TTA_RGB_DEV = 0.2; // RGB 光流的偏差（输入量）
const TTA_EV_DEV = 0.04; // 事件流的偏差（输入量）
const TTA_HOLD_MS = 1200; // 每行停 1.2 秒

const TTA_IN_X = 96;
const TTA_IN_W = 100;
const TTA_IN_H = 100;
const TTA_BOX_X = 242;
const TTA_BOX_W = 110;
const TTA_BOX_H = 46;
const TTA_RES_X = 390;
const TTA_RES_W = 360;
const TTA_RES_H = 100;
const TTA_READ_X = 790;
const TTA_DEV_X = 920;
const TTA_DEV_W = 140;
const TTA_ROWS = [38, 148];
const TTA_CARD_H = 108;

const TTA_FAB_OX = 320;
const TTA_FAB_OY = 140;
// 染色布纹要覆盖所有用到的窗口：x ∈ [320 − 30, 320 − 30 + 360]，y ∈ [140, 240]
const TTA_TINT_X0 = TTA_FAB_OX - 48;
const TTA_TINT_Y0 = TTA_FAB_OY - 8;
const TTA_TINT_W = 460;
const TTA_TINT_H = 116;
const TTA_TINT_ALPHA = 0.3; // 染色强度：留 70% 的织纹明暗

// 套准记号：同一个布纹位置在两层里各画一次，两层记号的距离 = 这一行的偏差
const TTA_REF_X = [60, 130, 200, 270, 330];
const TTA_REF_Y = [30, 70];
const TTA_REF_ARM = 5;
const TTA_REF_LW = 2;

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

const tintCache = new Map<string, HTMLCanvasElement>();

/** 布纹的染色版本：懒做一次，之后一直是位图搬运。 */
function tintedFabric(color: string): HTMLCanvasElement {
  const hit = tintCache.get(color);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = TTA_TINT_W;
  c.height = TTA_TINT_H;
  const g = c.getContext('2d');
  if (g) {
    g.drawImage(fabricCanvas(), TTA_TINT_X0, TTA_TINT_Y0, TTA_TINT_W, TTA_TINT_H, 0, 0, TTA_TINT_W, TTA_TINT_H);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = hexToRgba(color, TTA_TINT_ALPHA);
    g.fillRect(0, 0, TTA_TINT_W, TTA_TINT_H);
    g.globalCompositeOperation = 'source-over';
  }
  tintCache.set(color, c);
  return c;
}

/** 把布纹的某一窗口（左上角 ox/oy）染色后画到 dx/dy，尺寸 dw×dh。 */
function drawTintedPatch(
  ctx: CanvasRenderingContext2D,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  ox: number,
  oy: number,
  color: string
): void {
  const src = tintedFabric(color);
  ctx.drawImage(src, ox - TTA_TINT_X0, oy - TTA_TINT_Y0, dw, dh, dx, dy, dw, dh);
}

/** 套准记号：位移 shift 的那一层里，记号落在 x = 基准 + (shift − 真实位移)。 */
function drawTtaRefMarks(ctx: CanvasRenderingContext2D, shift: number, color: string): void {
  const dx = shift - TTA_TRUE_D;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = TTA_REF_LW;
  ctx.beginPath();
  for (const bx of TTA_REF_X) {
    for (const by of TTA_REF_Y) {
      const x = bx + dx;
      ctx.moveTo(x - TTA_REF_ARM, by);
      ctx.lineTo(x + TTA_REF_ARM, by);
      ctx.moveTo(x, by - TTA_REF_ARM);
      ctx.lineTo(x, by + TTA_REF_ARM);
    }
  }
  ctx.stroke();
  ctx.restore();
}

const ttaCache = new Map<string, HTMLCanvasElement>();

/**
 * 一行的对齐结果：把帧 t−1 按**估计位移** estD 平移之后，与帧 t（原样）各取一半叠起来。
 *   底：帧 t−1，窗口取自 FAB_OX − estD（即被搬了 estD 个像素），染色蓝，alpha 1
 *   上：帧 t，窗口取自 FAB_OX − TRUE_D（真实位置），染色橙，alpha 0.5
 *   → 每个像素 = 0.5 × 帧 t−1(搬过) + 0.5 × 帧 t
 * estD 与真实位移一致时两层逐像素重合，叠出来是一张清晰的织纹；差多少像素就错开多少。
 * 只在展开面板时构建（偏差是输入量），结果按 estD 缓存。
 */
function ttaOverlay(estD: number): HTMLCanvasElement {
  const key = estD.toFixed(3);
  const hit = ttaCache.get(key);
  if (hit) return hit;

  const c = document.createElement('canvas');
  c.width = TTA_RES_W;
  c.height = TTA_RES_H;
  const g = c.getContext('2d');
  if (g) {
    g.globalAlpha = 1;
    drawTintedPatch(g, 0, 0, TTA_RES_W, TTA_RES_H, TTA_FAB_OX - estD, TTA_FAB_OY, PAPER.blue);
    drawTtaRefMarks(g, estD, PAPER.blue);
    g.globalAlpha = 0.5;
    drawTintedPatch(g, 0, 0, TTA_RES_W, TTA_RES_H, TTA_FAB_OX - TTA_TRUE_D, TTA_FAB_OY, PAPER.orange);
    drawTtaRefMarks(g, TTA_TRUE_D, PAPER.orange);
    g.globalAlpha = 1;
  }
  ttaCache.set(key, c);
  return c;
}

function drawMotionArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y: number,
  x1: number,
  color: string
): void {
  if (!(x1 > x0 + 8)) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1 - 7, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 - 8, y - 5);
  ctx.lineTo(x1 - 8, y + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** 一行：印样卡 + 色规 + 行名 + 输入小图 + 模块 + 对齐结果 + 偏差读数。 */
function drawMotionRow(
  ctx: CanvasRenderingContext2D,
  i: number,
  active: boolean,
  overlay: HTMLCanvasElement | null
): void {
  const y = TTA_ROWS[i];
  const cy = y + TTA_RES_H / 2;
  const accent = i === 0 ? PAPER.blue : PAPER.purple;
  const dev = i === 0 ? TTA_RGB_DEV : TTA_EV_DEV;

  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.45;

  drawPrint(ctx, 6, y - 6, W - 12, TTA_CARD_H, { highlight: active ? PAPER.green : undefined });

  // 行首色规 + 行名
  ctx.fillStyle = accent;
  ctx.fillRect(16, y, 4, TTA_RES_H);
  drawSceneLabel(ctx, 28, cy + 5, i === 0 ? 'RGB 流' : '事件流', accent);

  // 输入小图：帧 t−1 的那块布纹（两行各染成自己流的颜色）
  drawTintedPatch(ctx, TTA_IN_X, y, TTA_IN_W, TTA_IN_H, TTA_FAB_OX - TTA_TRUE_D, TTA_FAB_OY, accent);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(TTA_IN_X + 1, y + 1, TTA_IN_W - 2, TTA_IN_H - 2);

  drawMotionArrow(ctx, TTA_IN_X + TTA_IN_W + 6, cy, TTA_BOX_X - 6, PAPER.muted);

  drawPrint(ctx, TTA_BOX_X, cy - TTA_BOX_H / 2, TTA_BOX_W, TTA_BOX_H, { highlight: accent });
  ctx.fillStyle = PAPER.ink;
  ctx.font = '600 16px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(i === 0 ? 'SpyNet' : 'U-Net', TTA_BOX_X + TTA_BOX_W / 2, cy + 1);

  drawMotionArrow(ctx, TTA_BOX_X + TTA_BOX_W + 6, cy, TTA_RES_X - 10, PAPER.muted);

  // 对齐结果：真平移 + 真叠加出来的双影
  drawPrint(ctx, TTA_RES_X - 8, y - 6, TTA_RES_W + 16, TTA_RES_H + 12, { highlight: accent });
  if (overlay) ctx.drawImage(overlay, TTA_RES_X, y);

  // 偏差读数 + 同一把尺子的偏差条（满量程 = 大运动下 RGB 的偏差）
  ctx.fillStyle = accent;
  ctx.font = '600 17px ' + FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('偏差 ' + Math.round(dev * 100) + '%', TTA_READ_X, cy);
  ctx.fillStyle = PAPER.axis;
  ctx.fillRect(TTA_DEV_X, cy - 5, TTA_DEV_W, 10);
  ctx.fillStyle = accent;
  ctx.fillRect(TTA_DEV_X, cy - 5, clamp(dev / TTA_RGB_DEV, 0, 1) * TTA_DEV_W, 10);

  // 正停住的那一行：绿框标出
  if (active) {
    ctx.strokeStyle = PAPER.green;
    ctx.lineWidth = 2;
    ctx.strokeRect(7, y - 7, W - 14, TTA_CARD_H + 2);
  }
  ctx.restore();
}

function renderMotion(
  ctx: CanvasRenderingContext2D,
  overlays: HTMLCanvasElement[] | null,
  time: number
): void {
  const phase = ((time % (TTA_HOLD_MS * 2)) + TTA_HOLD_MS * 2) % (TTA_HOLD_MS * 2);
  const active = Math.floor(phase / TTA_HOLD_MS); // 0 / 1，每行停 1.2 秒

  clearScene(ctx, W, DETAIL_H);
  drawLegend(ctx, 800, 18, [
    { color: PAPER.blue, label: '帧 t' + MINUS + '1' },
    { color: PAPER.orange, label: '帧 t' },
  ]);
  for (let i = 0; i < 2; i++) {
    drawMotionRow(ctx, i, i === active, overlays ? overlays[i] : null);
  }
}

// ---------------------------------------------------------------- 2c 融合面板

/** 四路特征：DOM 色块与画布色块共用同一套配色与短名。 */
interface Feature {
  name: string;
  sym: string; // 色块里的公式记号（图内记号，不占短标签额度）
  rgba: string;
  edge: string;
  fg: string;
}

const FEATURES: Feature[] = [
  { name: '当前帧', sym: 'I_t^LR', rgba: 'rgba(39,68,110,0.22)', edge: PAPER.blue, fg: PAPER.ink },
  { name: '反向特征', sym: 'f_t^B', rgba: 'rgba(240,126,71,0.30)', edge: PAPER.orange, fg: PAPER.ink },
  { name: '运动特征', sym: 'f_t^M', rgba: 'rgba(39,68,110,0.88)', edge: PAPER.blue, fg: PAPER.print },
  { name: '纹理特征', sym: 'f_t^T', rgba: 'rgba(124,58,237,0.88)', edge: PAPER.purple, fg: PAPER.print },
];

const FUSE_SW_X = 40;
const FUSE_SW_W = 260;
const FUSE_SW_H = 36;
const FUSE_BOX_X = 490;
const FUSE_BOX_Y = 84;
const FUSE_BOX_W = 190;
const FUSE_BOX_H = 92;

/** 融合节点：四路特征汇入 F，出来两路（上采样输出 / 传给下一个时间步）。 */
function renderFusion(ctx: CanvasRenderingContext2D, time: number): void {
  const pulse = 0.5 + 0.5 * Math.sin((time / 620) * Math.PI * 2);
  const midY = FUSE_BOX_Y + FUSE_BOX_H / 2;

  clearScene(ctx, W, DETAIL_H);

  // 四路输入色块 + 汇入 F 的箭头
  for (let i = 0; i < FEATURES.length; i++) {
    const f = FEATURES[i];
    const y = 34 + i * 48;
    ctx.save();
    ctx.fillStyle = f.rgba;
    ctx.fillRect(FUSE_SW_X, y, FUSE_SW_W, FUSE_SW_H);
    ctx.strokeStyle = f.edge;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(FUSE_SW_X + 0.8, y + 0.8, FUSE_SW_W - 1.6, FUSE_SW_H - 1.6);
    ctx.fillStyle = f.fg;
    ctx.font = '600 14px ' + FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.sym, FUSE_SW_X + 14, y + FUSE_SW_H / 2 + 1);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = f.edge;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(FUSE_SW_X + FUSE_SW_W + 6, y + FUSE_SW_H / 2);
    ctx.lineTo(FUSE_BOX_X - 16, midY);
    ctx.stroke();
    ctx.restore();
  }
  drawMotionArrow(ctx, FUSE_BOX_X - 22, midY, FUSE_BOX_X - 4, PAPER.muted);

  // 融合模块本身（在脉动的绿光里）
  ctx.save();
  ctx.shadowColor = PAPER.green;
  ctx.shadowBlur = 8 + 10 * pulse;
  drawPrint(ctx, FUSE_BOX_X, FUSE_BOX_Y, FUSE_BOX_W, FUSE_BOX_H, { highlight: PAPER.green });
  ctx.restore();
  ctx.save();
  ctx.fillStyle = PAPER.ink;
  ctx.font = '600 17px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('融合模块', FUSE_BOX_X + FUSE_BOX_W / 2, midY);
  ctx.restore();

  // 输出一：上采样（梯形，和主画布同一形状）——不带文字，形状本身即语义
  const outX = FUSE_BOX_X + FUSE_BOX_W;
  ctx.save();
  ctx.strokeStyle = PAPER.green;
  ctx.lineWidth = 1.8;
  ctx.shadowColor = PAPER.green;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(outX + 6, midY);
  ctx.lineTo(outX + 62, midY - 60);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(754 + (94 - 46) / 2, 44);
  ctx.lineTo(754 + (94 + 46) / 2, 44);
  ctx.lineTo(754 + 94, 92);
  ctx.lineTo(754, 92);
  ctx.closePath();
  ctx.fillStyle = 'rgba(34,141,92,0.13)';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 输出二：作为隐状态传给下一个时间步
  ctx.save();
  ctx.strokeStyle = PAPER.blue;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(outX + 6, midY);
  ctx.lineTo(outX + 62, midY + 58);
  ctx.stroke();
  ctx.restore();
  drawMotionArrow(ctx, outX + 62, midY + 58, 748, PAPER.blue);

  drawPrint(ctx, 760, 168, 180, 44, { highlight: PAPER.blue });
  ctx.save();
  ctx.fillStyle = PAPER.ink;
  ctx.font = '15px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('下一时间步', 850, 191);
  ctx.restore();
}

// ---------------------------------------------------------------- 面板文案（DOM）

const PANEL_TITLE: Record<Exclude<Expanded, 'none'>, string> = {
  texture: '纹理分支：5 个时间片逐个打开',
  motion: '运动分支：两条流的对齐叠加',
  fusion: '融合节点：四路特征在这里汇合',
};

const PANEL_NOTE: Record<Exclude<Expanded, 'none'>, string> = {
  texture: 'ITE：把 5 个时间片逐个打开，每次补一点细节——论文 Eq. 5–6。',
  motion:
    'TTA：RGB 光流在大运动下偏 20%，事件流只偏 4%——两条流各自把上一帧搬过来再融合（论文 Eq. 7–9）。',
  fusion:
    '四路特征在这个节点汇合，融合之后一路去上采样输出，另一路作为隐状态传给下一个时间步。',
};

// 论文 Eq.(10)：f_t = F(I_t^LR, f_t^B, f_t^M, f_t^T)。
// 属性一律用单引号，避免在字符串里转义（与 tutorial.ts 里其它公式的写法一致）。
const FUSION_FORMULA_HTML =
  "<math display='block'><msub><mi>f</mi><mi>t</mi></msub><mo>=</mo><mi>F</mi><mo>(</mo>" +
  "<msubsup><mi>I</mi><mi>t</mi><mrow><mi>L</mi><mi>R</mi></mrow></msubsup><mo>,</mo><mspace width='0.6em'/>" +
  "<msubsup><mi>f</mi><mi>t</mi><mi>B</mi></msubsup><mo>,</mo><mspace width='0.6em'/>" +
  "<msubsup><mi>f</mi><mi>t</mi><mi>M</mi></msubsup><mo>,</mo><mspace width='0.6em'/>" +
  "<msubsup><mi>f</mi><mi>t</mi><mi>T</mi></msubsup><mo>)</mo></math>" +
  '<p>F 是 15 个残差块组成的融合模块；I_t^LR 是当前帧，f_t^B 是反向传播来的特征，' +
  'f_t^M 与 f_t^T 分别是运动分支和纹理分支的输出。</p>';

// ================================================================ 组件

export const M5_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detailRef = useRef<HTMLCanvasElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    dir: Dir;
    step: number;
    hover: number | null;
    expanded: Expanded;
    hit: Hit | null;
  }>({ dir: 'fwd', step: 2, hover: null, expanded: 'none', hit: null });

  const [dir, setDir] = useState<Dir>('fwd');
  const [step, setStep] = useState(2);
  const [hover, setHover] = useState<number | null>(null);
  const [hit, setHit] = useState<Hit | null>(null);
  const [expanded, setExpanded] = useState<Expanded>('none');

  useEffect(() => {
    sceneRef.current.dir = dir;
    sceneRef.current.step = step;
    sceneRef.current.hover = hover;
    sceneRef.current.expanded = expanded;
    sceneRef.current.hit = hit;
  }, [dir, step, hover, expanded, hit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let H = H_WIDE;
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
      const shownW = canvas.getBoundingClientRect().width;
      const narrow = shownW > 0 && shownW < 720;
      const wantH = narrow ? H_NARROW : H_WIDE;
      if (wantH !== H) {
        H = wantH;
        try {
          ctx = setupCanvas(canvas, W, H);
        } catch {
          running = false;
          return;
        }
      }

      const L = layout(narrow);
      const phase = (((now % FLOW_MS) + FLOW_MS) % FLOW_MS) / FLOW_MS;
      // 每个方向两个光点，第二个与第一个相位差半个周期，各自再过一遍缓动
      const spots = [
        easeInOutQuad(phase),
        easeInOutQuad(((phase + SPOT_PHASES[1]) % 1 + 1) % 1),
      ];
      const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
      const s = sceneRef.current;
      const cur = Math.round(clamp(s.step, 0, 2));

      clearScene(ctx, W, H);
      drawScene(ctx, L, s.dir, cur, spots, pulse, s.hover, s.hit);

      if (!ready) {
        canvas.classList.add('is-ready');
        ready = true;
      }
      if (running) raf = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  // 细节面板：展开时才建这块画布上的东西（事件仿真 / 染色布纹 / 叠加图），rAF 里只绘制。
  useEffect(() => {
    if (expanded === 'none') return;
    const canvas = detailRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, DETAIL_H);
    } catch {
      return;
    }

    // 纹理面板：整段事件仿真只在这里算一次（cellMeans 会 getImageData）
    let ite: IteModel | null = null;
    if (expanded === 'texture') {
      try {
        ite = iteModel();
      } catch {
        ite = null; // 取不到像素也不该挡住面板
      }
    }
    // 运动面板：两行的叠加图按各自的估计位移构建一次并缓存
    let overlays: HTMLCanvasElement[] | null = null;
    if (expanded === 'motion') {
      try {
        overlays = [
          ttaOverlay(TTA_TRUE_D * (1 + TTA_RGB_DEV)),
          ttaOverlay(TTA_TRUE_D * (1 - TTA_EV_DEV)),
        ];
      } catch {
        overlays = null;
      }
    }

    const kind = expanded;
    let raf = 0;
    let running = false;
    let ready = false;
    let cssH = DETAIL_H;

    const frame = (now: number) => {
      // 窄屏时按显示宽度等比缩放显示高度（canvas 有 max-width:100%），不压扁画面
      const shownW = canvas.getBoundingClientRect().width;
      if (shownW > 0) {
        const want = Math.max(80, Math.round((DETAIL_H * shownW) / W));
        if (Math.abs(want - cssH) > 1) {
          cssH = want;
          canvas.style.height = cssH + 'px';
        }
      }

      if (kind === 'texture') renderTexture(ctx, ite, now);
      else if (kind === 'motion') renderMotion(ctx, overlays, now);
      else renderFusion(ctx, now);

      if (!ready) {
        ready = true;
        canvas.classList.add('is-ready');
      }
      if (running) raf = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [expanded]);

  const stepBy = (delta: number) => {
    const v = clamp(step + delta, 0, 2);
    sceneRef.current.step = v;
    setStep(v);
  };

  const pickDir = (d: Dir) => {
    if (d === dir) return;
    sceneRef.current.dir = d;
    setDir(d);
  };

  /** 指针坐标 → 固有坐标。画布在窄屏被 CSS 缩放，所以必须按显示宽度换算。 */
  const toLocal = (
    e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number; narrow: boolean } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    if (!(r.width > 0) || !(r.height > 0)) return null;
    const narrow = r.width < 720;
    const hi = narrow ? H_NARROW : H_WIDE;
    return {
      x: ((e.clientX - r.left) * W) / r.width,
      y: ((e.clientY - r.top) * hi) / r.height,
      narrow,
    };
  };

  // 悬停：辅助交互，命中区 = 列心 ±90px（整列高度都算）
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    let found: number | null = null;
    if (p) {
      for (let i = 0; i < COL_X.length; i++) {
        if (Math.abs(p.x - COL_X[i]) <= HIT_DX) {
          found = i;
          break;
        }
      }
    }
    if (found !== hover) {
      sceneRef.current.hover = found;
      setHover(found);
    }
  };

  const onLeave = () => {
    if (hover !== null) {
      sceneRef.current.hover = null;
      setHover(null);
    }
  };

  /** 展开 / 收起：同一时刻只有一个面板，再点同一个收起，点另一个替换。 */
  const pickNode = (col: number, kind: Branch | 'plus') => {
    const next: Expanded = kind === 'plus' ? 'fusion' : kind;
    const same = expanded === next && hit !== null && hit.col === col && hit.kind === kind;
    if (same) {
      sceneRef.current.expanded = 'none';
      sceneRef.current.hit = null;
      setHit(null);
      setExpanded('none');
      return;
    }
    const h: Hit = { col, kind };
    sceneRef.current.expanded = next;
    sceneRef.current.hit = h;
    setHit(h);
    setExpanded(next);
  };

  const collapse = () => {
    sceneRef.current.expanded = 'none';
    sceneRef.current.hit = null;
    setHit(null);
    setExpanded('none');
  };

  // 展开后把面板滚进视口。§5 的模块很高（论文原图 + 520 的画布），面板出现在画布
  // 下方，在笔记本视口里往往会落在屏幕外 —— 用户点了方块、看到方块变绿，却看不到
  // 面板，会以为"点击没反应"。block:'nearest' 只做最小幅度的滚动。
  useEffect(() => {
    if (expanded === 'none') return;
    const el = panelRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [expanded]);

  // 点击：3 列的纹理/运动方块（6 个命中区）+ 3 个 ⊕ 圆
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    if (!p) return;
    const L = layout(p.narrow);
    for (let i = 0; i < L.colX.length; i++) {
      const c = L.colX[i];
      if (Math.hypot(p.x - (c - L.plusDX), p.y - L.plusY) <= PLUS_HIT_R) {
        pickNode(i, 'plus');
        return;
      }
      if (p.x >= c - L.boxW / 2 && p.x <= c + L.boxW / 2) {
        if (p.y >= L.texY && p.y <= L.texY + L.boxH) {
          pickNode(i, 'texture');
          return;
        }
        if (p.y >= L.motY && p.y <= L.motY + L.boxH) {
          pickNode(i, 'motion');
          return;
        }
      }
    }
  };

  const info = (dir === 'fwd' ? FWD_HEAD : BWD_HEAD) + TIME_NAME[step] + INFO_TAIL;
  const panel = expanded === 'none' ? null : expanded;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H_WIDE}
        aria-label="双向传播的时间展开"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="chip-row">
        <button
          type="button"
          className={`chip${dir === 'fwd' ? ' selected' : ''}`}
          onClick={() => pickDir('fwd')}
        >
          前向传播
        </button>
        <button
          type="button"
          className={`chip${dir === 'bwd' ? ' selected' : ''}`}
          onClick={() => pickDir('bwd')}
        >
          后向传播
        </button>
      </div>
      <div className="step-ctrl">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => stepBy(-1)}
          disabled={step === 0}
        >
          上一步
        </button>
        <button
          type="button"
          className="tiny"
          onClick={() => stepBy(1)}
          disabled={step >= 2}
        >
          下一步
        </button>
        <span className="step-label">
          当前时刻 <b>{TIME_NAME[step]}</b>
        </span>
      </div>
      <div className="feedback info">{info}</div>

      <div className="hotspot-info" ref={panelRef}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ fontWeight: 600 }}>
            {panel ? PANEL_TITLE[panel] : '点画布上的「纹理」「运动」方块或 ⊕ 圆，展开对应分支的细节'}
          </span>
          {panel ? (
            <button type="button" className="tiny ghost" onClick={collapse}>
              收起
            </button>
          ) : null}
        </div>

        {panel ? (
          <>
            <div style={{ minHeight: DETAIL_H + 12, marginTop: 10 }}>
              <canvas
                ref={detailRef}
                width={W}
                height={DETAIL_H}
                aria-label={PANEL_TITLE[panel]}
              />
            </div>
            {panel === 'fusion' ? (
              <>
                <div
                  style={{ marginTop: 4 }}
                  dangerouslySetInnerHTML={{ __html: FUSION_FORMULA_HTML }}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  {FEATURES.map((f) => (
                    <div key={f.name} style={{ flex: '1 1 130px', minWidth: 130 }}>
                      <div
                        style={{
                          height: 36,
                          borderRadius: 4,
                          background: f.rgba,
                          border: '1px solid ' + f.edge,
                        }}
                      />
                      <div style={{ fontSize: 12, marginTop: 4, color: PAPER.muted }}>
                        {f.name}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            <div className="note" style={{ marginTop: 10, fontSize: 13 }}>
              {PANEL_NOTE[panel]}
            </div>
            {panel === 'texture' ? (
              <div className="note" style={{ marginTop: 6, fontSize: 13 }}>
                <b>🔴 原理示意，非模型真实输出</b>：Bin 里的事件点是按真实布纹仿真出来的，
                「累积细节」也是这些事件的真实叠加，它对应的只是"细节一层层累积"这件事，
                不是网络学出来的特征残差。
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default M5_1;
