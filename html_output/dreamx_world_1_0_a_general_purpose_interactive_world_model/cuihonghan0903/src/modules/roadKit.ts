// Shared Canvas drawing kit for the DreamX-World tutorial (road-trip theme).
// Semantic colors per contract: blue=guidance, green=paper method/success,
// red=failure/old method, orange=user emphasis, purple=auxiliary (memory).

export const C = {
  bg: '#f5f8f0',
  ground: '#b8c9a7',
  depth: '#76906a',
  road: '#92400e',
  guide: '#27446e',
  good: '#228d5c',
  bad: '#c43f52',
  emph: '#d97706',
  aux: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  white: '#ffffff',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  // distant hills
  ctx.fillStyle = C.ground;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.quadraticCurveTo(w * 0.25, h * 0.6, w * 0.5, h * 0.72);
  ctx.quadraticCurveTo(w * 0.75, h * 0.62, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = C.ink,
  size = 11,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

/** Like drawLabel (left-aligned only), but parses `_x` / `^{...}` / `^x` into
 *  true sub/superscripts, e.g. 'z_C^τ' → z with subscript C and superscript τ. */
export function drawRichLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = C.ink,
  size = 11
): void {
  const fontOf = (s: number) => `${s}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  const base = fontOf(size);
  const small = fontOf(Math.round(size * 0.72));
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.font = base;
  let cx = x;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if ((ch === '_' || ch === '^') && i + 1 < text.length) {
      i++;
      let script = '';
      if (text[i] === '{') {
        const end = text.indexOf('}', i);
        script = end === -1 ? text.slice(i + 1) : text.slice(i + 1, end);
        i = end === -1 ? text.length : end + 1;
      } else {
        script = text[i];
        i++;
      }
      ctx.font = small;
      ctx.fillText(script, cx, ch === '_' ? y + size * 0.28 : y - size * 0.42);
      cx += ctx.measureText(script).width + 1;
      ctx.font = base;
    } else {
      let j = i;
      while (j < text.length && text[j] !== '_' && text[j] !== '^') j++;
      const seg = text.slice(i, j);
      ctx.fillText(seg, cx, y);
      cx += ctx.measureText(seg).width;
      i = j;
    }
  }
}

export function drawRoad(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h = 16): void {
  ctx.fillStyle = C.road;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(x + 4, y + h / 2);
  ctx.lineTo(x + w - 4, y + h / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s = 1,
  color: string = C.guide
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-16, -10, 32, 12, 4);
  ctx.fill();
  // cabin
  ctx.beginPath();
  ctx.roundRect(-9, -17, 17, 9, 3);
  ctx.fill();
  // window
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(-6, -15, 6, 5);
  // wheels
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(-9, 3, 4, 0, Math.PI * 2);
  ctx.arc(9, 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string = C.good): void {
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 22);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x + 14, y - 17);
  ctx.lineTo(x, y - 12);
  ctx.closePath();
  ctx.fill();
}

export function drawSign(ctx: CanvasRenderingContext2D, x: number, y: number, color: string = C.guide, glow = false): void {
  if (glow) {
    ctx.fillStyle = 'rgba(39,68,110,0.18)';
    ctx.beginPath();
    ctx.arc(x, y - 18, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 24);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 11, y - 34, 22, 12, 3);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 31);
  ctx.lineTo(x + 8, y - 28);
  ctx.lineTo(x + 4, y - 25);
  ctx.closePath();
  ctx.fill();
}

export function drawMilestone(ctx: CanvasRenderingContext2D, x: number, y: number, lit: boolean): void {
  ctx.fillStyle = lit ? C.emph : C.axis;
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 16, 10, 16, 3);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1;
  ctx.stroke();
  if (lit) {
    ctx.fillStyle = 'rgba(217,119,6,0.25)';
    ctx.beginPath();
    ctx.arc(x, y - 8, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1, color: string = C.depth): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#6b4f2a';
  ctx.fillRect(-2, -6, 4, 6);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -12, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHouse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s = 1,
  color: string = C.depth
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fillRect(-12, -14, 24, 14);
  ctx.fillStyle = C.road;
  ctx.beginPath();
  ctx.moveTo(-14, -14);
  ctx.lineTo(0, -24);
  ctx.lineTo(14, -14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(-4, -10, 8, 10);
  ctx.restore();
}

export function drawGauge(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, value: number): void {
  // value 0..1; 0=red zone, 1=green zone
  const a0 = Math.PI * 0.85;
  const a1 = Math.PI * 2.15;
  // zones
  ctx.lineWidth = 7;
  ctx.strokeStyle = C.bad;
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a0 + (a1 - a0) * 0.35);
  ctx.stroke();
  ctx.strokeStyle = C.emph;
  ctx.beginPath();
  ctx.arc(x, y, r, a0 + (a1 - a0) * 0.35, a0 + (a1 - a0) * 0.65);
  ctx.stroke();
  ctx.strokeStyle = C.good;
  ctx.beginPath();
  ctx.arc(x, y, r, a0 + (a1 - a0) * 0.65, a1);
  ctx.stroke();
  // needle
  const ang = a0 + (a1 - a0) * Math.max(0, Math.min(1, value));
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(ang) * (r - 4), y + Math.sin(ang) * (r - 4));
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  border: string
): void {
  ctx.fillStyle = C.white;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  color: string,
  label?: string
): void {
  ctx.fillStyle = C.axis;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(h, w * Math.max(0, Math.min(1, frac))), h, h / 2);
  ctx.fill();
  if (label) drawLabel(ctx, label, x, y - 4, C.muted, 10);
}
