// 陶艺拉坯共用绘图工具（paper-specific drawing kit）。
// 所有画布——封面双panel、10 张类比卡、生活隐喻模块——都复用这套原语与语义色。
// 语义色取值以 contract.md 第 5 节为准：红=失败/旧法，绿=成功/论文方法，
// 蓝=引导/当前状态，橙=用户强调/阈值，紫=辅助机制。

export const SCENE = '#f5f8f0';
export const WHEEL = '#b8c9a7';
export const WHEEL_EDGE = '#76906a';
export const TOOL = '#92400e';
export const GUIDE = '#27446e';
export const OK = '#228d5c';
export const BAD = '#c43f52';
export const EMPH = '#f07e47';
export const AUX = '#7c3aed';
export const INK = '#21324a';
export const MUTED = '#68778f';
export const LINE = '#d7deea';

export type Ctx = CanvasRenderingContext2D;

/** 静场背景 + 转轮盘面：所有场景的第一层。 */
export function field(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = SCENE;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = WHEEL;
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 12, w * 0.46, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = WHEEL_EDGE;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** 中心环 / 目标轮廓。 */
export function ring(ctx: Ctx, x: number, y: number, r: number, color: string, dashed?: boolean) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [6, 6] : []);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** 泥团：主角。wobble 0（圆润）到 1（明显偏心/锯齿）；seed 控制抖动相位。 */
export function clay(ctx: Ctx, x: number, y: number, r: number, wobble: number, phase: number, fill: string) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = WHEEL_EDGE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const n = 44;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k =
      1 +
      wobble * 0.3 * Math.sin(a * 3 + phase * 1.7) +
      wobble * 0.14 * Math.sin(a * 5 - phase * 1.1);
    const px = x + Math.cos(a) * r * k;
    const py = y + Math.sin(a) * r * k * (1 - 0.16 * wobble);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** 一双手：简化掌形 + 两指，dir 控制朝向。 */
export function hand(ctx: Ctx, x: number, y: number, scale: number, dir: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * scale, scale);
  ctx.fillStyle = '#e9cdb0';
  ctx.strokeStyle = TOOL;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-20, -7, 15, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-18, 8, 13, 6, 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** 轨迹折线：速度场/采样路径可视化。 */
export function trace(ctx: Ctx, pts: number[][], color: string, dashed?: boolean) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [6, 6] : []);
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
  ctx.stroke();
  ctx.restore();
}

/** 样板卡尺：用于引导强度场景。 */
export function gauge(ctx: Ctx, x: number, y: number, w: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y + 8);
  ctx.moveTo(x + w, y - 8);
  ctx.lineTo(x + w, y + 8);
  ctx.stroke();
  ctx.restore();
}

/** 落款刻印：只在终点发生的离散化。 */
export function seal(ctx: Ctx, x: number, y: number, ok: boolean) {
  const c = ok ? OK : BAD;
  ctx.save();
  ctx.strokeStyle = c;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 11, y - 11, 22, 22);
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x + 5, y);
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x, y + 5);
  ctx.stroke();
  ctx.restore();
}

/** 技术曲线插框（白底 + LINE 边框），坐标已归一化到 0..1。 */
export function curve(ctx: Ctx, x: number, y: number, w: number, h: number, pts: number[][], color: string) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const px = x + p[0] * w;
    const py = y + h - p[1] * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** 紧凑对比条。 */
export function bars(ctx: Ctx, x: number, y: number, w: number, items: { label: string; value: number; color: string }[]) {
  items.forEach((it, i) => {
    const yy = y + i * 26;
    ctx.save();
    ctx.fillStyle = LINE;
    ctx.fillRect(x, yy, w, 12);
    ctx.fillStyle = it.color;
    ctx.fillRect(x, yy, w * Math.max(0, Math.min(1, it.value)), 12);
    ctx.fillStyle = MUTED;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(it.label, x + 6, yy + 11);
    ctx.restore();
  });
}

/** 画布内短标签（<= 8 字，13px）。 */
export function label(ctx: Ctx, text: string, x: number, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** 速度/方向箭头。 */
export function arrow(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4));
  ctx.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
