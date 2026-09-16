// Shared river-valley drawing kit for the EMA-Nesterov tutorial.
// One quiet field, one water band, one canoe protagonist, one semantic palette
// (contract §5). Reused by every analogy card, hero panel and life-metaphor module.

export const C = {
  bg: '#f5f8f0',
  waterLight: '#b8c9a7',
  waterDeep: '#76906a',
  wood: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

/** Quiet field + shared water band with two banks. Water occupies the lower band. */
export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}

export function drawRiver(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  channelTop = 0.45,
  bend = 0 // -1..1 horizontal curvature of the centerline
) {
  const top = h * channelTop;
  // water band
  ctx.fillStyle = C.waterLight;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, top);
  ctx.quadraticCurveTo(w * 0.5, top + bend * h * 0.12, w, top);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // banks
  ctx.strokeStyle = C.waterDeep;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.quadraticCurveTo(w * 0.5, top + bend * h * 0.12, w, top);
  ctx.stroke();
}

/** Y of the channel centerline at x, given the same parameters as drawRiver. */
export function channelY(x: number, w: number, h: number, channelTop = 0.45, bend = 0): number {
  const t = x / w;
  const top = h * channelTop;
  return top + bend * h * 0.12 * (4 * t * (1 - t));
}

/** Trend streamline + drifting foam dots (the low-frequency signal). */
export function drawCurrent(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  channelTop = 0.45,
  bend = 0
) {
  ctx.strokeStyle = C.blue;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 16) {
    const y = channelY(x, w, h, channelTop, bend) + 14;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  // foam dots drifting downstream
  ctx.fillStyle = C.blue;
  for (let i = 0; i < 5; i++) {
    const fx = ((time * 40 + i * (w / 5)) % (w + 40)) - 20;
    const fy = channelY(fx, w, h, channelTop, bend) + 14;
    ctx.beginPath();
    ctx.arc(fx, fy, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** High-frequency wave ripples near the hull (the noisy one-step updates). */
export function drawWaves(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  color = C.red
) {
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const ph = time * 5 + i * 2.1;
    const r = 10 + 6 * Math.sin(ph);
    ctx.beginPath();
    ctx.arc(x + 18 * i - 14, y - 8, Math.max(4, r), Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** The recurring protagonist: a canoe with a paddler silhouette. */
export function drawCanoe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rot: number,
  color: string = C.blue,
  scale = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  // hull
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.quadraticCurveTo(0, 10, 34, 0);
  ctx.quadraticCurveTo(0, -6, -34, 0);
  ctx.closePath();
  ctx.fill();
  // paddler
  ctx.fillStyle = C.text;
  ctx.beginPath();
  ctx.arc(-4, -10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-8, -6, 8, 6);
  // paddle
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, -16);
  ctx.lineTo(20, 8);
  ctx.stroke();
  ctx.fillStyle = C.wood;
  ctx.beginPath();
  ctx.ellipse(21, 10, 4, 6, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Lookahead arrow: the extrapolated direction from the canoe. */
export function drawLookaheadArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  width = 4
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  const ang = Math.atan2(dy, dx);
  ctx.save();
  ctx.translate(x + dx, y + dy);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-11, -5.5);
  ctx.lineTo(-11, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Target marker: confluence flag (the converged solution). */
export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 26);
  ctx.stroke();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x + 16, y - 21);
  ctx.lineTo(x, y - 16);
  ctx.closePath();
  ctx.fill();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = C.text,
  size = 15
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillText(text, x, y);
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<[string, string]>, // [color, label]
  x: number,
  y: number
) {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  let cx = x;
  for (const [color, label] of items) {
    ctx.fillStyle = color;
    ctx.fillRect(cx, y - 9, 12, 9);
    ctx.fillStyle = C.muted;
    ctx.fillText(label, cx + 16, y);
    cx += 16 + ctx.measureText(label).width + 18;
  }
}

/** Standard rAF loop with off-screen pause and is-ready flag. */
export function runLoop(
  canvas: HTMLCanvasElement,
  draw: (time: number) => void
): () => void {
  let raf: number | null = null;
  const tick = (t: number) => {
    draw(t / 1000);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (raf === null) raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
  };
  const disconnect = (typeof IntersectionObserver !== 'undefined'
    ? (() => {
        const io = new IntersectionObserver(
          (es) => es.forEach((e) => (e.isIntersecting ? start() : stop())),
          { threshold: 0.05 }
        );
        io.observe(canvas);
        return () => io.disconnect();
      })()
    : (start(), () => {}));
  return () => {
    stop();
    disconnect();
  };
}

/** Neutral helper export so the kit file satisfies the widget-export check. */
export function RiverKit(): null {
  return null;
}
