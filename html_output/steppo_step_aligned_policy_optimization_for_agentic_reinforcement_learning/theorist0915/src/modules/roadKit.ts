/** Shared road-trip Canvas kit for StepPO tutorial. */
export const C = {
  bg: '#f5f8f0', envL: '#b8c9a7', envD: '#76906a', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', text: '#21324a', muted: '#68778f', axis: '#d7deea',
};

export function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}

export function drawRoad(ctx: CanvasRenderingContext2D, y: number, w: number) {
  ctx.fillStyle = C.envL;
  ctx.fillRect(0, y - 18, w, 44);
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, y);
  ctx.lineTo(w - 20, y);
  ctx.stroke();
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = '#fff8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, y);
  ctx.lineTo(w - 30, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, scale = 1) {
  const s = scale;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 18 * s, y - 12 * s, 36 * s, 18 * s, 4);
  ctx.fill();
  ctx.fillStyle = '#dbe7f5';
  ctx.fillRect(x - 8 * s, y - 10 * s, 12 * s, 8 * s);
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(x - 10 * s, y + 8 * s, 4 * s, 0, Math.PI * 2);
  ctx.arc(x + 10 * s, y + 8 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.green) {
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 16);
  ctx.lineTo(x, y - 22);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x + 18, y - 14);
  ctx.lineTo(x, y - 6);
  ctx.closePath();
  ctx.fill();
}

export function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text) {
  ctx.fillStyle = color;
  ctx.font = '600 14px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText(text, x, y);
}

export function drawLegend(ctx: CanvasRenderingContext2D, items: { color: string; label: string }[], x: number, y: number) {
  items.slice(0, 3).forEach((it, i) => {
    const xx = x + i * 120;
    ctx.fillStyle = it.color;
    ctx.fillRect(xx, y - 8, 12, 12);
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(it.label, xx + 16, y + 2);
  });
}
