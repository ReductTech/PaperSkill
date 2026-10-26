import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';

// 这个文件只提供绘图工具；为了让它随包一起被复制进 src/modules/，注册一个不渲染任何东西的组件。
export const SceneKit: React.FC<{ chapterId: string; moduleId: string }> = () => null;

// ============================================================================
//  共享场景工具箱：摄影外拍 + 接触印样 + 暗房冲洗。
//  所有画面都从「相纸 / 印样 / 相机 / 灯箱 / 药水盘 / 相册页」这六件实物出发，
//  语义色只用来表示状态：红=冗余或旧方法，绿=选中或本文方法，蓝=当前焦点，
//  橙=用户设定，紫=压缩等辅助机制。
// ============================================================================

export const C = {
  bg: '#f5f8f0',
  desk: '#efe6d8',
  print: '#f2ede2',
  light: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
};

export const FONT = '"Segoe UI","Microsoft YaHei",sans-serif';

/** 确定性伪随机，保证每次渲染（以及截图）一致。 */
export function rnd(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** 静场：暗房台面。 */
export function clearPlate(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.desk;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, h - 30, w, 30);
  ctx.globalAlpha = 1;
}

/** 一张装在卡纸里的组织照片：白边 + 组织纹理 + 柔和投影。 */
export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  opts?: {
    tone?: 'neutral' | 'red' | 'green' | 'blue' | 'muted';
    dim?: number;
    border?: number;
    ring?: string;
    badge?: string;
    blobs?: number;
  }
): void {
  const pad = 4;
  const inside = { x: x + pad, y: y + pad, w: w - pad * 2, h: h - pad * 2 };
  ctx.save();
  ctx.globalAlpha = (opts?.dim ?? 1) * 0.9;
  ctx.fillStyle = 'rgba(33,50,74,0.10)';
  ctx.fillRect(x + 2, y + 3, w, h);
  ctx.globalAlpha = opts?.dim ?? 1;
  ctx.fillStyle = C.print;
  ctx.fillRect(x, y, w, h);
  const tone = opts?.tone ?? 'neutral';
  const fill = tone === 'red' ? '#f2d3d6' : tone === 'green' ? '#d5ebd9' : tone === 'blue' ? '#d7dfec' : '#efe0e3';
  ctx.fillStyle = fill;
  ctx.fillRect(inside.x, inside.y, inside.w, inside.h);
  for (let i = 0; i < (opts?.blobs ?? 5); i++) {
    const bx = inside.x + 6 + rnd(seed, i * 3) * (inside.w - 12);
    const by = inside.y + 6 + rnd(seed, i * 3 + 1) * (inside.h - 12);
    const br = 3 + rnd(seed, i * 3 + 2) * Math.min(inside.w, inside.h) * 0.22;
    ctx.fillStyle = i % 3 === 0 ? '#5d7a54' : '#8fa87f';
    ctx.globalAlpha = (opts?.dim ?? 1) * 0.66;
    ctx.beginPath();
    ctx.ellipse(bx, by, br, br * 0.66, rnd(seed, i * 7) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = opts?.dim ?? 1;
  }
  ctx.strokeStyle = tone === 'muted' ? C.axis : opts?.ring ?? C.axis;
  ctx.lineWidth = opts?.border ?? 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (opts?.badge) {
    ctx.fillStyle = opts.ring ?? C.blue;
    ctx.beginPath();
    ctx.arc(x + w - 9, y + 9, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.badge, x + w - 9, y + 9);
  }
  ctx.restore();
}

/** 一台相机（机身 + 镜头 + 背带），右侧带一个取景框。 */
export function drawCamera(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
  frameW = 0,
  frameH = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (frameW > 0) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(14, -frameH / 2, frameW, frameH);
    ctx.setLineDash([]);
  }
  ctx.fillStyle = '#3c4a5c';
  ctx.fillRect(-26, -14, 34, 28);
  ctx.fillStyle = '#5b6b7f';
  ctx.fillRect(-24, -20, 12, 7);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(18, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dbe4ef';
  ctx.beginPath();
  ctx.arc(18, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3c4a5c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(18, 0, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-26, -6);
  ctx.quadraticCurveTo(-48, -26, -60, -12);
  ctx.stroke();
  ctx.restore();
}

/** 印样墙：一面贴着许多小样的墙，lit 里的格子是有画面的。 */
export function drawContactSheet(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; w: number; h: number },
  cols: number,
  rows: number,
  lit: number[],
  opts?: { seed?: number; tone?: 'neutral' | 'green' | 'red'; dimUnlit?: number; scale?: number }
): void {
  const gap = 6;
  const cw = (rect.w - gap * (cols - 1)) / cols;
  const ch = (rect.h - gap * (rows - 1)) / rows;
  const litSet = new Set(lit);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const on = litSet.has(idx);
      const x = rect.x + c * (cw + gap);
      const y = rect.y + r * (ch + gap);
      drawPhoto(ctx, x, y, cw, ch, (opts?.seed ?? 7) + idx, {
        tone: on ? opts?.tone ?? 'neutral' : 'muted',
        dim: on ? 1 : opts?.dimUnlit ?? 0.5,
        blobs: 4,
        ring: on ? (opts?.tone === 'green' ? C.green : opts?.tone === 'red' ? C.red : C.blue) : '#c9cdc2',
        border: on ? 1.5 : 1,
      });
    }
  }
}

/** 放大镜/取景镜：环形镜片 + 手柄，镜内细节随半径变密。 */
export function drawLens(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  density = 10
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
  ctx.clip();
  for (let i = 0; i < density; i++) {
    const a = (i / density) * Math.PI * 2;
    const rr = (0.25 + 0.6 * rnd(11, i)) * r;
    ctx.strokeStyle = i % 3 === 0 ? C.dark : C.light;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rr * 0.6, cy + Math.sin(a) * rr * 0.5, 2 + (i % 4), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.72, cy + r * 0.72);
  ctx.lineTo(cx + r * 1.12, cy + r * 1.12);
  ctx.stroke();
}

/** 暗房药水盘：level 0..1 表示液面高度。 */
export function drawTray(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  level: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = '#e7e2d6';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const lv = clamp(level, 0, 1);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.25 + 0.5 * lv;
  ctx.fillRect(x + 3, y + h - 3 - (h - 6) * lv, w - 6, (h - 6) * lv);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + h - 3 - (h - 6) * lv);
  ctx.lineTo(x + w - 3, y + h - 3 - (h - 6) * lv);
  ctx.stroke();
  ctx.restore();
}

/** 相册页：固定槽位，filled 个已排入。 */
export function drawAlbumPage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  slots: number,
  filled: number,
  tone: 'neutral' | 'green' | 'red' = 'green'
): void {
  ctx.save();
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const gap = 5;
  const cw = (w - gap * (slots + 1)) / slots;
  for (let i = 0; i < slots; i++) {
    const sx = x + gap + i * (cw + gap);
    const sy = y + gap;
    const sh = h - gap * 2;
    if (i < filled) {
      drawPhoto(ctx, sx, sy, cw, sh, 31 + i, { tone, border: 1, blobs: 3 });
    } else {
      ctx.strokeStyle = C.axis;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(sx + 0.5, sy + 0.5, cw - 1, sh - 1);
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

/** 画布内短标签：全文最多两个，每处不超过 8 个字。 */
export function drawTag(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { color?: string; size?: number; align?: CanvasTextAlign }
): void {
  ctx.fillStyle = opts?.color ?? C.text;
  ctx.font = `${opts?.size ?? 15}px ${FONT}`;
  ctx.textAlign = opts?.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

/** 画布内图例：最多三项。 */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  items.slice(0, 3).forEach((it, i) => {
    const ly = y + i * 19;
    ctx.fillStyle = it.color;
    ctx.fillRect(x, ly - 8, 11, 11);
    ctx.fillStyle = C.muted;
    ctx.font = `13px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(it.label, x + 17, ly + 2);
  });
}

/** 统一的画布初始化：只初始化一次，避免重复缩放。 */
export function usePlate(_w: number, _h: number) {
  return function ensure(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
    if (!canvas) return null;
    if (canvas.dataset.plateReady === '1') {
      return canvas.getContext('2d');
    }
    try {
      const ctx = setupCanvas(canvas, _w, _h);
      canvas.dataset.plateReady = '1';
      return ctx;
    } catch {
      return null;
    }
  };
}

export { setupCanvas, observeCanvas, clamp };
