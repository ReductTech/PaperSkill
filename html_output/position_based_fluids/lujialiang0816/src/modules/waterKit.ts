export const WATER = {
  page: '#f4f9ff',
  panel: '#ffffff',
  deep: '#0754a6',
  mid: '#1296d4',
  bright: '#35c6f4',
  light: '#bfeeff',
  foam: '#f7fdff',
  guide: '#0b4f9f',
  good: '#14825f',
  bad: '#c43f52',
  user: '#e17318',
  aux: '#6b55c5',
  ink: '#183451',
  muted: '#68778f',
  line: '#c8d9ec',
};

export type WaterPoint = { x: number; y: number };

export function drawWaterParticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  accent = WATER.mid,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(6, 79, 150, 0.22)';
  ctx.shadowBlur = Math.max(3, radius * 0.65);
  const gradient = ctx.createRadialGradient(
    x - radius * 0.38,
    y - radius * 0.42,
    radius * 0.12,
    x,
    y,
    radius,
  );
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.2, WATER.light);
  gradient.addColorStop(0.66, accent);
  gradient.addColorStop(1, WATER.deep);
  ctx.fillStyle = gradient;
  ctx.strokeStyle = 'rgba(5, 74, 139, 0.72)';
  ctx.lineWidth = Math.max(1.2, radius * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = Math.max(1, radius * 0.16);
  ctx.beginPath();
  ctx.arc(x - radius * 0.2, y - radius * 0.22, radius * 0.44, Math.PI * 1.05, Math.PI * 1.55);
  ctx.stroke();
  ctx.restore();
}

export function drawWaterDrop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  stretch = 1,
  accent = WATER.mid,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, stretch);
  const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.36, radius * 0.08, 0, 0, radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.18, WATER.light);
  gradient.addColorStop(0.62, accent);
  gradient.addColorStop(1, WATER.deep);
  ctx.shadowColor = 'rgba(5, 65, 125, 0.28)';
  ctx.shadowBlur = radius * 0.55;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = 'rgba(5, 74, 139, 0.78)';
  ctx.lineWidth = Math.max(1.5, radius * 0.1);
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.35);
  ctx.bezierCurveTo(radius * 0.15, -radius * 0.82, radius, -radius * 0.25, radius, radius * 0.35);
  ctx.bezierCurveTo(radius, radius * 1.18, radius * 0.45, radius * 1.55, 0, radius * 1.55);
  ctx.bezierCurveTo(-radius * 0.45, radius * 1.55, -radius, radius * 1.18, -radius, radius * 0.35);
  ctx.bezierCurveTo(-radius, -radius * 0.25, -radius * 0.15, -radius * 0.82, 0, -radius * 1.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(1.5, radius * 0.14);
  ctx.beginPath();
  ctx.arc(-radius * 0.28, radius * 0.02, radius * 0.36, Math.PI * 1.05, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();
}

export function drawWaterSurface(
  ctx: CanvasRenderingContext2D,
  points: WaterPoint[],
  bottom: number,
  accent = WATER.mid,
  alpha = 0.86,
) {
  if (points.length < 2) return;
  const gradient = ctx.createLinearGradient(0, Math.min(...points.map((point) => point.y)), 0, bottom);
  gradient.addColorStop(0, 'rgba(186, 238, 255, 0.9)');
  gradient.addColorStop(0.34, accent);
  gradient.addColorStop(1, WATER.deep);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = WATER.guide;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, bottom);
  ctx.lineTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;
    ctx.quadraticCurveTo(previous.x, previous.y, midX, (previous.y + current.y) / 2);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.lineTo(last.x, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(points[0].x + 3, points[0].y + 3);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y + 3));
  ctx.stroke();
  ctx.restore();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: WaterPoint,
  to: WaterPoint,
  color = WATER.guide,
  width = 2.5,
  dashed = false,
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - 8 * Math.cos(angle - Math.PI / 6), to.y - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - 8 * Math.cos(angle + Math.PI / 6), to.y - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
