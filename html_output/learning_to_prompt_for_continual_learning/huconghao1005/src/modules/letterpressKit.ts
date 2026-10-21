// 调料大师 · 共享绘图套件（L2P 教程专用）
// 由协调者单独维护，章节目录下的 widget 只许「调用」这些 helper，不许重造。
// 语义色沿用 paper-skill contract.md §5 的角色划分，中性色按厨房暖色调。
// 稳定线宽 2px，被强调对象 3px。所有坐标单位为 CSS 像素。

export const LP = {
  bg: '#faf6f0',        // 厨房暖米色背景
  light: '#f0e8d8',     // 浅米色（台面/浅色区域）
  dark: '#c9b896',      // 深米色（木纹/深色区域）
  support: '#8b5a2b',   // 棕色（锅/厨具）
  guide: '#c97b3a',     // 暖橙色（引导/当前状态）
  success: '#4a8c5c',   // 绿色（好菜/成功）
  failure: '#b8453c',   // 红色（串味/失败）
  accent: '#d97706',    // 暖橙色（调料/学习者可控）
  aux: '#7c6a9e',       // 紫色（辅助机制）
  ink: '#3d2817',       // 深棕色（主文字）
  muted: '#8b7355',     // 灰棕色（次要文字）
  axis: '#e8dcc8',      // 浅棕色（轴线/边框）
} as const;

export const LP_FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
export const LP_LW = 2;
export const LP_LW_EMPH = 3;

export function lpFont(size: number, weight: string | number = 400): string {
  return `${weight} ${size}px ${LP_FONT}`;
}

/** 圆角矩形路径。 */
export function lpRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  // `fill` is deliberately overloaded: a boolean means "paint with the current
  // fillStyle" (the common case), while a colour string sets fillStyle first.
  // drawTypeCase's `fill` option is a colour, so both spellings read naturally
  // at the call site and neither one is silently wrong.
  fill: boolean | string = false,
  stroke = true
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
  if (typeof fill === 'string') {
    const previous = ctx.fillStyle;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.fillStyle = previous;
  } else if (fill) {
    ctx.fill();
  }
  if (stroke) ctx.stroke();
}

// ---------------------------------------------------------------- 场景底

/** 铺满整个 Canvas 的暖白场景底。每个 widget 第一笔调用。 */
export function drawField(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.fillStyle = LP.bg;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// ---------------------------------------------------------------- 字盘格

export interface TypeCaseOpts {
  cols?: number;
  rows?: number;
  /** 每个格子的填充色，或返回填充色的函数（row, col）。 */
  fill?: string | ((row: number, col: number) => string);
  /** 被强调的格子，画 3px 描边。 */
  highlight?: Array<[number, number]>;
  /** 格内小字（≤8 字符），或返回字符串的函数。 */
  cellText?: string | ((row: number, col: number) => string);
  /** 第几号抽屉标签。 */
  drawerLabel?: string;
  gap?: number;
  radius?: number;
}

/**
 * 字盘格：排字房里分格的木盘，用来表示「存储 + 可检索」的结构。
 * 复用于 prompt pool、196 块 patch、频率计数矩阵。
 */
export function drawTypeCase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: TypeCaseOpts = {}
): void {
  const cols = Math.max(1, opts.cols ?? 5);
  const rows = Math.max(1, opts.rows ?? 4);
  const gap = opts.gap ?? 6;
  const radius = opts.radius ?? 5;
  const cw = (w - gap * (cols - 1)) / cols;
  const ch = (h - gap * (rows - 1)) / rows;
  const hl = new Set((opts.highlight ?? []).map(([r, c]) => `${r}:${c}`));

  ctx.save();
  ctx.lineJoin = 'round';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x + c * (cw + gap);
      const cy = y + r * (ch + gap);
      const fill =
        typeof opts.fill === 'function' ? opts.fill(r, c) : opts.fill ?? LP.light;
      ctx.fillStyle = fill;
      ctx.strokeStyle = hl.has(`${r}:${c}`) ? LP.accent : LP.dark;
      ctx.lineWidth = hl.has(`${r}:${c}`) ? LP_LW_EMPH : LP_LW;
      lpRoundRect(ctx, cx, cy, cw, ch, radius, true, true);
      const t = typeof opts.cellText === 'function' ? opts.cellText(r, c) : opts.cellText;
      if (t && cw > 18) {
        ctx.fillStyle = LP.ink;
        ctx.font = lpFont(Math.min(13, Math.max(9, ch * 0.34)));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.slice(0, 8), cx + cw / 2, cy + ch / 2);
      }
    }
  }
  if (opts.drawerLabel) {
    drawLabel(ctx, opts.drawerLabel, x + 2, y - 10, { align: 'left', size: 13 });
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 铅字

export interface SortOpts {
  /** 铅字上印的字面，例如 "猫" 或 "P3"。 */
  face?: string;
  fill?: string;
  /** 是否画 3px 强调描边。 */
  emphasis?: boolean;
  /** 抬升位移（用来表现被拈起 / 被插进版头），正数向上。 */
  lift?: number;
  /** 透明度，0–1。 */
  alpha?: number;
}

/**
 * 一枚铅字：圆角矩形字身 + 内嵌字面 + 底部字脚。
 * 这是全教程的「复现主体」，代表一段可学习参数（prompt）。
 */
export function drawSort(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: SortOpts = {}
): void {
  const lift = opts.lift ?? 0;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.translate(0, -lift);

  // 字脚（更暗的一条，让铅字有金属感）
  ctx.fillStyle = LP.dark;
  lpRoundRect(ctx, x + 1, y + h * 0.82, w - 2, h * 0.2, 3, true, false);

  // 字身
  ctx.fillStyle = opts.fill ?? LP.support;
  ctx.strokeStyle = opts.emphasis ? LP.accent : 'rgba(38,36,31,0.35)';
  ctx.lineWidth = opts.emphasis ? LP_LW_EMPH : LP_LW;
  lpRoundRect(ctx, x, y, w, h, 5, true, true);

  // 字面
  const pad = Math.max(3, w * 0.18);
  if (w - pad * 2 > 8) {
    ctx.fillStyle = LP.light;
    lpRoundRect(ctx, x + pad, y + pad * 0.9, w - pad * 2, h * 0.62, 3, true, false);
  }
  if (opts.face && w > 20) {
    ctx.fillStyle = LP.ink;
    ctx.font = lpFont(Math.min(16, Math.max(9, w * 0.44)), 600);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.face.slice(0, 2), x + w / 2, y + h * 0.42);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 版头 / 字条

export interface StickOpts {
  /** 版头里插了几条字条。 */
  slots?: number;
  /** 每条字条的字面。 */
  faces?: string[];
  /** 被点亮的字条下标（分类器真正会读的那几条）。 */
  lit?: number[];
  /** 整体是否置灰（没被选中的部分）。 */
  dim?: boolean;
}

/**
 * 版头（composing stick）：一条横槽里插着一排铅字。
 * 代表 prompt 被拼到输入最前面的那段序列。
 */
export function drawStick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: StickOpts = {}
): void {
  const slots = Math.max(1, opts.slots ?? 5);
  ctx.save();
  ctx.globalAlpha = opts.dim ? 0.4 : 1;

  // 槽
  ctx.fillStyle = LP.light;
  ctx.strokeStyle = LP.dark;
  ctx.lineWidth = LP_LW;
  lpRoundRect(ctx, x, y, w, h, 6, true, true);

  const gap = 5;
  const sw = Math.min(28, (w - gap * (slots + 1)) / slots);
  const lit = new Set(opts.lit ?? []);
  for (let i = 0; i < slots; i++) {
    const sx = x + gap + i * (sw + gap);
    const on = lit.size === 0 || lit.has(i);
    drawSort(ctx, sx, y + gap, sw, h - gap * 2, {
      face: opts.faces?.[i],
      emphasis: lit.has(i),
      alpha: on ? 1 : 0.35,
      fill: on ? LP.support : LP.dark,
    });
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 样张

export interface SheetOpts {
  /** 样张上那一行结果，例如 "猫 0.87"。 */
  result?: string;
  /** 结果是好是坏，决定颜色。 */
  tone?: 'good' | 'bad' | 'neutral';
  /** 压痕行数。 */
  lines?: number;
  /** 是否显示为空白（还没印）。 */
  blank?: boolean;
}

/**
 * 样张：印出来的那一张纸，带压痕和一行结果。
 * 代表模型的最终预测输出。
 */
export function drawSheet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: SheetOpts = {}
): void {
  ctx.save();
  ctx.fillStyle = '#fffefb';
  ctx.strokeStyle = LP.dark;
  ctx.lineWidth = LP_LW;
  ctx.shadowColor = 'rgba(38,36,31,0.10)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  lpRoundRect(ctx, x, y, w, h, 4, true, true);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const lines = opts.lines ?? 6;
  ctx.strokeStyle = LP.axis;
  ctx.lineWidth = 1;
  for (let i = 1; i <= lines; i++) {
    const ly = y + (h / (lines + 1)) * i;
    ctx.beginPath();
    ctx.moveTo(x + 10, ly);
    ctx.lineTo(x + w - 10, ly);
    ctx.stroke();
  }

  if (!opts.blank && opts.result) {
    const tone = opts.tone ?? 'neutral';
    ctx.fillStyle =
      tone === 'good' ? LP.success : tone === 'bad' ? LP.failure : LP.ink;
    ctx.font = lpFont(Math.min(17, h * 0.2), 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.result.slice(0, 10), x + w / 2, y + h / 2);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 签条

export interface TagOpts {
  /** 签条上的字，例如 "猫 / 狗"。 */
  text?: string;
  fill?: string;
  /** 命中 / 未命中。 */
  hit?: boolean;
  emphasis?: boolean;
  /** 被手指拈起的抬升量。 */
  lift?: number;
  alpha?: number;
}

/**
 * 签条：贴在抽屉格上标明「这一格适合什么样的输入」。
 * 代表 key（$k_j$）。命中时用绿色描边，未命中用灰色。
 */
export function drawTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: TagOpts = {}
): void {
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.translate(0, -(opts.lift ?? 0));

  // 穿绳孔
  ctx.fillStyle = LP.bg;
  ctx.beginPath();
  ctx.arc(x + 8, y + h / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = opts.fill ?? LP.light;
  ctx.strokeStyle = opts.hit ? LP.success : opts.emphasis ? LP.accent : LP.dark;
  ctx.lineWidth = opts.hit || opts.emphasis ? LP_LW_EMPH : LP_LW;
  lpRoundRect(ctx, x, y, w, h, 4, true, true);

  if (opts.text) {
    ctx.fillStyle = LP.ink;
    ctx.font = lpFont(Math.min(14, h * 0.5));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.text.slice(0, 8), x + w / 2 + 4, y + h / 2);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 压板

export interface PressOpts {
  /** 压板下压程度 0–1，0 为抬起。 */
  press?: number;
  /** 是否处于工作状态。 */
  active?: boolean;
}

/**
 * 压板：把版面上的墨压到纸上的那块平板。
 * 代表冻结主干的 Transformer 在做一次前向。
 */
export function drawPress(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: PressOpts = {}
): void {
  const dy = (opts.press ?? 0) * Math.min(14, h * 0.3);
  ctx.save();
  ctx.translate(0, dy);
  ctx.fillStyle = opts.active ? LP.dark : LP.light;
  ctx.strokeStyle = opts.active ? LP.guide : LP.axis;
  ctx.lineWidth = LP_LW;
  lpRoundRect(ctx, x, y, w, h, 4, true, true);
  // 压板上的手柄
  ctx.fillStyle = LP.support;
  lpRoundRect(ctx, x + w * 0.42, y - 9, w * 0.16, 9, 3, true, false);
  ctx.restore();
}

// ---------------------------------------------------------------- 墨辊

export interface InkOpts {
  /** 滚动相位（弧度），驱动表面纹路旋转。 */
  phase?: number;
  /** 出墨量 0–1，决定颜色深浅。 */
  amount?: number;
  /** 半径。 */
  r?: number;
}

/**
 * 油墨滚筒：给版面均匀上墨。
 * 代表梯度 / 优化器在给参数施加更新。
 */
export function drawInk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  opts: InkOpts = {}
): void {
  const r = opts.r ?? 16;
  const amount = opts.amount ?? 0.6;
  ctx.save();
  ctx.fillStyle = LP.aux;
  ctx.globalAlpha = 0.35 + 0.55 * Math.min(1, Math.max(0, amount));
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = LP.ink;
  ctx.lineWidth = LP_LW;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // 手柄
  ctx.beginPath();
  ctx.moveTo(cx + r, cy);
  ctx.lineTo(cx + r + 12, cy);
  ctx.stroke();
  // 表面纹路
  ctx.strokeStyle = LP.bg;
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const a = (opts.phase ?? 0) + (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.45, cy + Math.sin(a) * r * 0.45);
    ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 连接与标签

export interface LinkOpts {
  color?: string;
  /** 虚线（用来画「梯度在这里断掉」）。 */
  dashed?: boolean;
  /** 线宽。 */
  width?: number;
  /** 终点箭头。 */
  arrow?: boolean;
}

/** 两个对象之间的连线 / 拉力绳。 */
export function drawLink(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: LinkOpts = {}
): void {
  ctx.save();
  ctx.strokeStyle = opts.color ?? LP.support;
  ctx.lineWidth = opts.width ?? LP_LW;
  if (opts.dashed) ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (opts.arrow) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = opts.color ?? LP.support;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(a - 0.4), y2 - 10 * Math.sin(a - 0.4));
    ctx.lineTo(x2 - 10 * Math.cos(a + 0.4), y2 - 10 * Math.sin(a + 0.4));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export interface LabelOpts {
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  size?: number;
  weight?: string | number;
  color?: string;
}

/**
 * Canvas 内短标签。单场景内最多 2 个，每个 ≤8 字符。
 * 数字必须画成裸数字，不加单位解释。
 */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: LabelOpts = {}
): void {
  ctx.save();
  ctx.fillStyle = opts.color ?? LP.ink;
  ctx.font = lpFont(opts.size ?? 14, opts.weight ?? 500);
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = opts.baseline ?? 'alphabetic';
  ctx.fillText(text.slice(0, 8), x, y);
  ctx.restore();
}

export interface LegendItem {
  label: string;
  color: string;
}

/** Canvas 内图例。最多 3 项。 */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: LegendItem[],
  x: number,
  y: number,
  opts: { size?: number; vertical?: boolean } = {}
): void {
  const size = opts.size ?? 12;
  const step = size + 8;
  ctx.save();
  ctx.font = lpFont(size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  items.slice(0, 3).forEach((it, i) => {
    const ix = opts.vertical ? x : x + i * 110;
    const iy = opts.vertical ? y + i * step : y;
    ctx.fillStyle = it.color;
    ctx.fillRect(ix, iy - size * 0.45, size, size * 0.9);
    ctx.strokeStyle = LP.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(ix, iy - size * 0.45, size, size * 0.9);
    ctx.fillStyle = LP.muted;
    ctx.fillText(it.label.slice(0, 8), ix + size + 6, iy);
  });
  ctx.restore();
}

// ---------------------------------------------------------------- 小工具

/** 依据数值给出反馈状态色（好 / 中 / 差）。 */
export function lpTone(v: number, goodAbove: number, badBelow: number): string {
  return v >= goodAbove ? LP.success : v <= badBelow ? LP.failure : LP.guide;
}

/** 把 0–1 的进度画成一条细进度条，用于记忆保持率等指标。 */
export function drawMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = LP.light;
  lpRoundRect(ctx, x, y, w, h, h / 2, true, false);
  const v = Math.min(1, Math.max(0, value));
  if (v > 0.001) {
    ctx.fillStyle = color;
    lpRoundRect(ctx, x, y, Math.max(h, w * v), h, h / 2, true, false);
  }
  ctx.strokeStyle = LP.axis;
  ctx.lineWidth = 1;
  lpRoundRect(ctx, x, y, w, h, h / 2, false, true);
  ctx.restore();
}

// ================================================================
// 调料大师 · 厨房主题绘图函数
// ================================================================

/** 画一口锅（侧视图）。 */
export function drawPot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: string; stroke?: string; withSteam?: boolean; time?: number } = {}
): void {
  const fill = opts.fill ?? LP.support;
  const stroke = opts.stroke ?? LP.ink;
  ctx.save();
  // 锅身
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = LP_LW;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.2);
  ctx.lineTo(x + w * 0.1, y + h);
  ctx.lineTo(x + w * 0.9, y + h);
  ctx.lineTo(x + w, y + h * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 锅口
  ctx.fillStyle = LP.dark;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.2, w / 2, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 把手
  ctx.strokeStyle = stroke;
  ctx.lineWidth = LP_LW_EMPH;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.08, y + h * 0.35);
  ctx.lineTo(x - w * 0.18, y + h * 0.35);
  ctx.moveTo(x + w + w * 0.08, y + h * 0.35);
  ctx.lineTo(x + w + w * 0.18, y + h * 0.35);
  ctx.stroke();
  // 蒸汽
  if (opts.withSteam) {
    const t = opts.time ?? 0;
    ctx.strokeStyle = LP.muted;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      const sx = x + w * (0.3 + i * 0.2);
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.bezierCurveTo(
        sx - 8 + Math.sin(t * 2 + i) * 4, y - 10,
        sx + 8 + Math.sin(t * 2 + i + 1) * 4, y - 20,
        sx + Math.sin(t * 2 + i + 2) * 6, y - 30
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/** 画一个调料瓶。 */
export function drawSpiceBottle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { color?: string; label?: string; highlighted?: boolean } = {}
): void {
  const color = opts.color ?? LP.accent;
  ctx.save();
  // 瓶身
  ctx.fillStyle = color;
  ctx.strokeStyle = opts.highlighted ? LP.ink : LP.dark;
  ctx.lineWidth = opts.highlighted ? LP_LW_EMPH : LP_LW;
  lpRoundRect(ctx, x, y + h * 0.15, w, h * 0.85, 4, true, true);
  // 瓶盖
  ctx.fillStyle = LP.support;
  lpRoundRect(ctx, x + w * 0.15, y, w * 0.7, h * 0.2, 2, true, true);
  // 标签
  if (opts.label) {
    ctx.fillStyle = LP.bg;
    lpRoundRect(ctx, x + w * 0.1, y + h * 0.4, w * 0.8, h * 0.35, 2, true, false);
    ctx.fillStyle = LP.ink;
    ctx.font = lpFont(Math.min(11, h * 0.2), 600);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.label.slice(0, 4), x + w / 2, y + h * 0.58);
  }
  ctx.restore();
}

/** 画一个食材（圆形/蔬菜状）。 */
export function drawIngredient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  opts: { color?: string; type?: 'veg' | 'meat' | 'grain'; highlighted?: boolean } = {}
): void {
  const color = opts.color ?? LP.success;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = opts.highlighted ? LP.ink : LP.dark;
  ctx.lineWidth = opts.highlighted ? LP_LW_EMPH : LP_LW;
  if (opts.type === 'veg') {
    // 圆形蔬菜
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 叶子
    ctx.fillStyle = LP.success;
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.8, r * 0.3, r * 0.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (opts.type === 'meat') {
    // 不规则肉块
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // 谷物/圆形
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** 画厨师的手（拿调料瓶/锅铲的姿势）。 */
export function drawChefHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: { action?: 'sprinkle' | 'stir' | 'hold'; lift?: number; time?: number } = {}
): void {
  const action = opts.action ?? 'hold';
  const lift = opts.lift ?? 0;
  const t = opts.time ?? 0;
  ctx.save();
  ctx.translate(0, -lift * 8);
  // 袖子
  ctx.fillStyle = LP.light;
  ctx.strokeStyle = LP.dark;
  ctx.lineWidth = LP_LW;
  lpRoundRect(ctx, x - 20, y + 20, 40, 30, 6, true, true);
  // 手掌
  ctx.fillStyle = '#e8c9a0';
  ctx.strokeStyle = LP.support;
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (action === 'sprinkle') {
    // 手指捏着调料瓶，抖动
    const shake = Math.sin(t * 8) * 2;
    ctx.fillStyle = '#e8c9a0';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(x - 8 + i * 5 + shake, y - 2 + Math.sin(t * 8 + i) * 1, 3, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // 撒出的调料
    ctx.fillStyle = LP.accent;
    for (let i = 0; i < 6; i++) {
      const px = x + (Math.random() - 0.5) * 20;
      const py = y + 15 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (action === 'stir') {
    // 拿锅铲搅拌
    const angle = Math.sin(t * 3) * 0.3;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = LP.support;
    ctx.lineWidth = LP_LW_EMPH;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -35);
    ctx.stroke();
    // 铲头
    ctx.fillStyle = LP.dark;
    ctx.beginPath();
    ctx.moveTo(-8, -35);
    ctx.lineTo(8, -35);
    ctx.lineTo(6, -45);
    ctx.lineTo(-6, -45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** 画一个盘子。 */
export function drawPlate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  opts: { foodColor?: string; withFood?: boolean } = {}
): void {
  ctx.save();
  // 盘子外圈
  ctx.fillStyle = LP.bg;
  ctx.strokeStyle = LP.dark;
  ctx.lineWidth = LP_LW;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 盘子内圈
  ctx.strokeStyle = LP.axis;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.75, r * 0.25, 0, 0, Math.PI * 2);
  ctx.stroke();
  // 食物
  if (opts.withFood) {
    ctx.fillStyle = opts.foodColor ?? LP.accent;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, r * 0.5, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 画火苗。 */
export function drawFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time: number = 0
): void {
  ctx.save();
  const flicker = 1 + Math.sin(time * 10) * 0.1;
  // 外焰
  ctx.fillStyle = LP.accent;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - size * 0.5, y - size * 0.5, x - size * 0.3, y - size, x, y - size * flicker);
  ctx.bezierCurveTo(x + size * 0.3, y - size, x + size * 0.5, y - size * 0.5, x, y);
  ctx.fill();
  // 内焰
  ctx.fillStyle = LP.failure;
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.1);
  ctx.bezierCurveTo(x - size * 0.25, y - size * 0.4, x - size * 0.15, y - size * 0.6, x, y - size * 0.7 * flicker);
  ctx.bezierCurveTo(x + size * 0.15, y - size * 0.6, x + size * 0.25, y - size * 0.4, x, y - size * 0.1);
  ctx.fill();
  ctx.restore();
}

/** 画厨房台面（水平线 + 木纹）。 */
export function drawKitchenCounter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number
): void {
  ctx.save();
  // 台面
  ctx.fillStyle = LP.light;
  ctx.fillRect(x, y, w, 8);
  ctx.strokeStyle = LP.dark;
  ctx.lineWidth = LP_LW;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  // 木纹
  ctx.strokeStyle = LP.dark;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + 2 + i * 2);
    ctx.lineTo(x + w, y + 2 + i * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** 画调料架（一排调料瓶）。 */
export function drawSpiceRack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  opts: { activeIndex?: number; colors?: string[]; labels?: string[] } = {}
): void {
  const bottleW = 24;
  const bottleH = 40;
  const gap = 8;
  const colors = opts.colors ?? [LP.accent, LP.success, LP.failure, LP.guide, LP.aux, LP.support];
  const labels = opts.labels ?? [];
  ctx.save();
  // 架子
  ctx.fillStyle = LP.support;
  lpRoundRect(ctx, x - 4, y + bottleH - 4, count * (bottleW + gap) + 8, 8, 2, true, false);
  // 调料瓶
  for (let i = 0; i < count; i++) {
    const bx = x + i * (bottleW + gap);
    drawSpiceBottle(ctx, bx, y, bottleW, bottleH, {
      color: colors[i % colors.length],
      label: labels[i],
      highlighted: opts.activeIndex === i,
    });
  }
  ctx.restore();
}
