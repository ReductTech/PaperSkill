// Shared drawing kit for the OpenVLA tutorial — flat-pack furniture store theme.
// Semantic colors fixed per contract: green = paper method / success; red =
// closed-source / failure; blue = current state / model; orange = emphasis;
// purple = auxiliary (tokens / vocabulary).

export interface Pt {
  x: number;
  y: number;
}

export const C = {
  bg: '#f5f8f0',
  ground: '#b8c9a7',
  deep: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

/** Quiet field + counter line; optional light grid. */
export function drawSceneBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts?: { grid?: boolean; ground?: boolean }
) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  if (opts?.grid) {
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (opts?.ground !== false) {
    const gy = h - 34;
    ctx.strokeStyle = C.ground;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.25;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, gy);
    ctx.lineTo(w * 0.06, h * 0.22);
    ctx.lineTo(w * 0.94, h * 0.22);
    ctx.lineTo(w * 0.94, gy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/**
 * The recurring protagonist: an assembly worker. (x, y) = ground point.
 * mode: 'read' holds a blueprint, 'build' holds a screwdriver, 'locked' shrugs.
 */
export function drawWorker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opts?: { mode?: 'read' | 'build' | 'locked'; t?: number; color?: string }
) {
  const t = opts?.t ?? 0;
  const mode = opts?.mode ?? 'read';
  const cloth = opts?.color ?? C.green;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // body (work apron)
  ctx.fillStyle = cloth;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-11, -26, 22, 26, 6);
  ctx.fill();
  ctx.stroke();
  // head + cap
  ctx.fillStyle = '#f2e3cf';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -33, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.roundRect(-9, -42, 18, 5, 2);
  ctx.fill();
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(-3, -33, 1.1, 0, Math.PI * 2);
  ctx.arc(3, -33, 1.1, 0, Math.PI * 2);
  ctx.fill();
  // held item / pose
  if (mode === 'read') {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.support;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.roundRect(10, -26, 14, 11, 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(17, -25);
    ctx.lineTo(17, -16);
    ctx.stroke();
  } else if (mode === 'build') {
    ctx.strokeStyle = C.support;
    ctx.lineWidth = 2.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.lineTo(21, -25 + Math.sin(t * 2 * Math.PI) * 2);
    ctx.stroke();
    ctx.fillStyle = C.support;
    ctx.beginPath();
    ctx.arc(22, -27 + Math.sin(t * 2 * Math.PI) * 2, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // locked: both arms out, shrug
    ctx.strokeStyle = cloth;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -20);
    ctx.lineTo(-19, -14);
    ctx.moveTo(11, -20);
    ctx.lineTo(19, -14);
    ctx.stroke();
  }
  ctx.restore();
}

/** Flat-pack cardboard box with a rolled blueprint. */
export function drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#d9c7a7';
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-26, -30, 52, 30, 3);
  ctx.fill();
  ctx.stroke();
  // flaps
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-26, -30);
  ctx.lineTo(-34, -40);
  ctx.lineTo(-8, -30);
  ctx.lineTo(0, -42);
  ctx.lineTo(8, -30);
  ctx.lineTo(34, -40);
  ctx.lineTo(26, -30);
  ctx.stroke();
  // blueprint roll on top
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.roundRect(-18, -38, 36, 7, 3.5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** A cabinet: flat-pack state (panels) or assembled state. */
export function drawCabinet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s = 1,
  opts?: { assembled?: boolean; sticker?: boolean }
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (opts?.assembled) {
    ctx.fillStyle = C.ground;
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-24, -52, 48, 52, 3);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.fillStyle = C.deep;
    ctx.beginPath();
    ctx.arc(-6, -27, 1.6, 0, Math.PI * 2);
    ctx.arc(6, -27, 1.6, 0, Math.PI * 2);
    ctx.fill();
    if (opts?.sticker) {
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.roundRect(-22, -50, 20, 22, 2);
      ctx.fill();
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 1.25;
      ctx.strokeRect(-18, -46, 12, 8);
    }
  } else {
    // flat panels leaning
    ctx.fillStyle = C.ground;
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(-0.12 + i * 0.12);
      ctx.beginPath();
      ctx.roundRect(-8 - i * 2, -50 + i * 4, 16 + i * 4, 48 - i * 6, 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

/** The manual (Llama 2 backbone): open booklet. */
export function drawManual(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, -18);
  ctx.lineTo(0, -13);
  ctx.lineTo(24, -18);
  ctx.lineTo(24, 8);
  ctx.lineTo(0, 13);
  ctx.lineTo(-24, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(0, 13);
  ctx.stroke();
  // text lines
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.25;
  for (let r = 0; r < 3; r++) {
    ctx.beginPath();
    ctx.moveTo(-19, -12 + r * 7);
    ctx.lineTo(-5, -10 + r * 7);
    ctx.moveTo(5, -10 + r * 7);
    ctx.lineTo(19, -12 + r * 7);
    ctx.stroke();
  }
  ctx.restore();
}

/** A measuring ruler. semantic=true → SigLIP (blue); else DINOv2 (orange). */
export function drawRuler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  opts?: { semantic?: boolean }
) {
  const color = opts?.semantic ? C.blue : C.orange;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.stroke();
  // ticks every len/10
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 10; i++) {
    const tx = x + (len * i) / 10;
    ctx.beginPath();
    ctx.moveTo(tx, y);
    ctx.lineTo(tx, y - (i % 5 === 0 ? 10 : 6));
    ctx.stroke();
  }
  ctx.restore();
}

/** Sticker sheets (LoRA): n small stickers on a strip. */
export function drawStickerSheet(ctx: CanvasRenderingContext2D, x: number, y: number, n: number) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i < 2 ? C.orange : '#e8d5c2'; // only a few applied vs full sheet
    ctx.strokeStyle = C.support;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(x + i * 16, y - 7, 13, 14, 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** One numeric command token chip. */
export function drawTokenChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: string,
  color: string = C.purple
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 17, y - 13, 34, 26, 5);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y + 1);
  ctx.restore();
}

export function drawTokenString(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  values: (string | number)[],
  gap = 40,
  highlightIndex = -1
) {
  values.forEach((v, i) => {
    drawTokenChip(ctx, x + i * gap, y, String(v), i === highlightIndex ? C.orange : C.purple);
  });
}

/** Large pulsing verdict badge (check/cross disc + halo). */
export function drawVerdict(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ok: boolean,
  opts?: { r?: number; pulse?: number }
) {
  const r = opts?.r ?? 17;
  const pulse = opts?.pulse ?? 0;
  ctx.save();
  const color = ok ? C.green : C.red;
  ctx.globalAlpha = 0.3 + 0.16 * Math.sin(pulse * Math.PI * 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r * (1.5 + 0.16 * Math.sin(pulse * Math.PI * 2)), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  if (ok) {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y + r * 0.05);
    ctx.lineTo(x - r * 0.1, y + r * 0.42);
    ctx.lineTo(x + r * 0.5, y - r * 0.38);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.42, y - r * 0.42);
    ctx.lineTo(x + r * 0.42, y + r * 0.42);
    ctx.moveTo(x + r * 0.42, y - r * 0.42);
    ctx.lineTo(x - r * 0.42, y + r * 0.42);
    ctx.stroke();
  }
  ctx.restore();
}

/** Simple 2-segment robot arm with gripper. */
export function drawArm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts?: { scale?: number; angle?: number; grip?: number; color?: string }
) {
  const s = opts?.scale ?? 1;
  const a = opts?.angle ?? 0.25;
  const g = opts?.grip ?? 1;
  const color = opts?.color ?? C.blue;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-9, -6, 18, 8, 2);
  ctx.fill();
  const x1 = -14 * Math.sin(a);
  const y1 = -14 * Math.cos(a);
  const x2 = x1 - 16 * Math.sin(a * 0.4);
  const y2 = y1 - 16 * Math.cos(a * 0.4);
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.lineWidth = 3;
  const ga = 0.5 * g;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(ga), y2 - 7 * Math.sin(ga));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(-ga), y2 - 7 * Math.sin(-ga));
  ctx.stroke();
  ctx.restore();
}

export function drawCheckMark(ctx: CanvasRenderingContext2D, x: number, y: number, r = 9) {
  ctx.save();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y + r * 0.1);
  ctx.lineTo(x - r * 0.1, y + r * 0.55);
  ctx.lineTo(x + r * 0.7, y - r * 0.5);
  ctx.stroke();
  ctx.restore();
}

export function drawCrossMark(ctx: CanvasRenderingContext2D, x: number, y: number, r = 9) {
  ctx.save();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y - r * 0.6);
  ctx.lineTo(x + r * 0.6, y + r * 0.6);
  ctx.moveTo(x + r * 0.6, y - r * 0.6);
  ctx.lineTo(x - r * 0.6, y + r * 0.6);
  ctx.stroke();
  ctx.restore();
}

/** In-canvas label (≤ 8 chars). */
export function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { color?: string; align?: CanvasTextAlign }
) {
  ctx.save();
  ctx.fillStyle = opts?.color ?? C.text;
  ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = opts?.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Compact legend, ≤ 3 entries. */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  entries: [string, string][],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textBaseline = 'middle';
  let cx = x;
  entries.forEach(([text, color]) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + 5, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText(text, cx + 14, y + 1);
    cx += 14 + ctx.measureText(text).width + 18;
  });
  ctx.restore();
}

/** Bare-number value chip. */
export function drawValueChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: string,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 22, y - 11, 44, 22, 5);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y + 1);
  ctx.restore();
}
