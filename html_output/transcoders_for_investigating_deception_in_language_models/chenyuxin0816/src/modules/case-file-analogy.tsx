import { useEffect, useRef } from 'react';
import { clamp, easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';

export interface CanvasWidgetProps {
  chapterId?: string;
  moduleId?: string;
}

export const COLORS = {
  background: '#f5f8f0',
  environmentLight: '#b8c9a7',
  environmentDark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  paper: '#fffdf7',
};

export function prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const ctx = setupCanvas(canvas, width, height);
  canvas.style.width = '100%';
  canvas.style.maxWidth = `${width}px`;
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `${width} / ${height}`;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);
  return ctx;
}

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 8
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: { color?: string; size?: number; weight?: number; align?: CanvasTextAlign } = {}
) {
  ctx.fillStyle = options.color ?? COLORS.text;
  ctx.font = `${options.weight ?? 500} ${options.size ?? 13}px system-ui, sans-serif`;
  ctx.textAlign = options.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export function drawFile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  title = '保密档案'
) {
  ctx.save();
  roundedRect(ctx, x, y, width, height, 7);
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = COLORS.environmentLight;
  ctx.fillRect(x + 12, y + 12, Math.min(width - 24, 62), 5);
  drawText(ctx, title, x + 12, y + 29, { size: 12, weight: 700, color: COLORS.blue });
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  for (let row = 0; row < 3; row += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 48 + row * 15);
    ctx.lineTo(x + width - 12, y + 48 + row * 15);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  active: boolean,
  label = '证据'
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fillStyle = active ? '#e8f6ee' : '#ffffff';
  ctx.fill();
  ctx.strokeStyle = active ? COLORS.green : COLORS.border;
  ctx.lineWidth = active ? 3 : 2;
  ctx.stroke();
  if (active) {
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x - 1, y + 4);
    ctx.lineTo(x + 6, y - 5);
    ctx.stroke();
  }
  drawText(ctx, label, x, y + 21, { size: 10, align: 'center', color: COLORS.muted });
  ctx.restore();
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  active = false,
  success = false,
  radius = 12
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = active ? (success ? '#e8f6ee' : '#eef4fb') : '#ffffff';
  ctx.fill();
  ctx.strokeStyle = active ? (success ? COLORS.green : COLORS.blue) : COLORS.border;
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.stroke();
  drawText(ctx, label, x, y + radius + 12, { size: 10, align: 'center', color: COLORS.text });
  ctx.restore();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = COLORS.border,
  width = 2,
  dashed = false
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [5, 5] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(angle - Math.PI / 6), y2 - 7 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 7 * Math.cos(angle + Math.PI / 6), y2 - 7 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number, color = COLORS.blue) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 7, y + 7);
  ctx.lineTo(x + 17, y + 17);
  ctx.stroke();
  ctx.restore();
}

export function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number, angle = -0.4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  roundedRect(ctx, -3, -24, 7, 34, 2);
  ctx.fillStyle = '#e5a542';
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.moveTo(-3, 10);
  ctx.lineTo(4, 10);
  ctx.lineTo(0.5, 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function canvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number, width: number, height: number) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * width,
    y: ((clientY - rect.top) / rect.height) * height,
  };
}

function chapterNumber(chapterId?: string, moduleId?: string) {
  const raw = chapterId ?? moduleId ?? 'chap-1';
  const match = raw.match(/(?:chap-)?(\d+)/);
  return clamp(match ? Number(match[1]) : 1, 1, 10);
}

function drawAnalogy(ctx: CanvasRenderingContext2D, chapter: number, phase: number) {
  const p = easeInOutQuad(phase);
  ctx.fillStyle = '#eaf0e4';
  ctx.fillRect(0, 0, 244, 130);
  ctx.strokeStyle = COLORS.environmentLight;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(12, 112);
  ctx.lineTo(232, 112);
  ctx.stroke();

  if (chapter === 1) {
    drawFile(ctx, 20, 15, 166, 90, '密钥任务');
    drawText(ctx, 'xhf2l1jk', 43, 71, { size: 13, weight: 700 });
    const coverX = lerp(116, 38, p);
    roundedRect(ctx, coverX, 59, 88, 22, 4);
    ctx.fillStyle = COLORS.red;
    ctx.fill();
    drawText(ctx, '遮挡', coverX + 44, 70, { size: 10, align: 'center', color: '#fff', weight: 700 });
    drawSeal(ctx, 213, 42, p > 0.85, '边界');
    return;
  }

  if (chapter === 2) {
    drawFile(ctx, 18, 16, 168, 90, '同一回答');
    const xs = [62, 104, 146];
    xs.forEach((x, i) => drawNode(ctx, x, 70 - (i % 2) * 22, '', phase > 0.25 + i * 0.15, false, 7));
    if (phase > 0.5) {
      drawArrow(ctx, 69, 66, 96, 51, COLORS.blue, 2.5);
      drawArrow(ctx, 112, 51, 138, 66, COLORS.blue, 2.5);
    }
    drawMagnifier(ctx, lerp(42, 158, p), 43 + Math.sin(phase * Math.PI * 2) * 4);
    drawSeal(ctx, 213, 42, phase > 0.75, '路径');
    return;
  }

  if (chapter === 3) {
    drawFile(ctx, 18, 15, 180, 92, '透明描图');
    const points = [{ x: 47, y: 74 }, { x: 89, y: 52 }, { x: 130, y: 72 }, { x: 171, y: 48 }];
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();
    const segment = Math.min(2.999, p * 3);
    const index = Math.floor(segment);
    const local = segment - index;
    const start = points[index];
    const end = points[Math.min(index + 1, points.length - 1)];
    drawPencil(ctx, lerp(start.x, end.x, local), lerp(start.y, end.y, local));
    drawSeal(ctx, 218, 44, p > 0.92, '近似');
    return;
  }

  if (chapter === 4) {
    drawFile(ctx, 18, 15, 180, 92, '归因线索');
    const points = [{ x: 42, y: 76 }, { x: 88, y: 48 }, { x: 132, y: 75 }, { x: 177, y: 47 }];
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();
    const segment = Math.min(2.999, p * 3);
    const index = Math.floor(segment);
    const local = segment - index;
    const start = points[index];
    const end = points[Math.min(index + 1, points.length - 1)];
    drawMagnifier(ctx, lerp(start.x, end.x, local), lerp(start.y, end.y, local));
    drawText(ctx, 'hidden', 31, 93, { size: 10, color: COLORS.blue });
    drawSeal(ctx, 218, 44, p > 0.92, '输出');
    return;
  }

  if (chapter === 5) {
    drawFile(ctx, 18, 15, 176, 92, '候选线索');
    for (let i = 0; i < 4; i += 1) {
      const active = phase * 4 >= i + 0.6;
      ctx.beginPath();
      ctx.arc(46 + i * 34, 42, 7, 0, Math.PI * 2);
      ctx.fillStyle = active ? COLORS.blue : '#fff';
      ctx.fill();
      ctx.strokeStyle = active ? COLORS.blue : COLORS.border;
      ctx.stroke();
      drawText(ctx, String(i + 1), 46 + i * 34, 42, { size: 9, align: 'center', color: active ? '#fff' : COLORS.muted });
    }
    const drop = clamp((phase - 0.72) / 0.18, 0, 1);
    const stampY = lerp(64, 84, drop);
    roundedRect(ctx, 91, stampY - 15, 44, 24, 5);
    ctx.fillStyle = COLORS.green;
    ctx.fill();
    drawText(ctx, '保留', 113, stampY - 3, { size: 10, align: 'center', color: '#fff', weight: 700 });
    drawSeal(ctx, 218, 44, phase > 0.9, '验证');
    return;
  }

  if (chapter === 6) {
    drawFile(ctx, 18, 15, 176, 92, '同一特征');
    const slot = Math.min(2, Math.floor(phase * 3));
    const labels = ['原状态', '正向 +5', '负向 -5'];
    const colors = [COLORS.blue, COLORS.orange, COLORS.green];
    roundedRect(ctx, 56, 53, 92, 30, 5);
    ctx.fillStyle = `${colors[slot]}33`;
    ctx.fill();
    ctx.strokeStyle = colors[slot];
    ctx.lineWidth = 2;
    ctx.stroke();
    drawText(ctx, labels[slot], 102, 68, { size: 11, align: 'center', color: colors[slot], weight: 700 });
    drawSeal(ctx, 218, 44, slot === 2, '干预');
    return;
  }

  if (chapter === 7) {
    drawFile(ctx, 18, 15, 176, 92, '高频线索');
    const values = [95, 91, 86];
    values.forEach((value, i) => {
      const y = 43 + i * 19;
      ctx.fillStyle = '#eef3eb';
      ctx.fillRect(42, y, 112, 10);
      ctx.fillStyle = i === 0 ? COLORS.orange : COLORS.blue;
      ctx.fillRect(42, y, (value / 100) * 112 * clamp(p * 1.3 - i * 0.08, 0, 1), 10);
      drawText(ctx, String(value), 166, y + 5, { size: 10, align: 'right' });
    });
    drawSeal(ctx, 218, 44, p > 0.85, 'Top-10');
    return;
  }

  if (chapter === 8) {
    drawFile(ctx, 18, 15, 176, 92, 'Top-10 电路');
    for (let i = 0; i < 10; i += 1) {
      const x = 42 + (i % 5) * 29;
      const y = 48 + Math.floor(i / 5) * 31;
      const core = i === 0 || i === 2;
      drawNode(ctx, x, y, '', core && p > 0.45, core && p > 0.8, 6);
    }
    drawPencil(ctx, lerp(42, 100, p), lerp(35, 55, p));
    drawSeal(ctx, 218, 44, p > 0.85, '核心');
    return;
  }

  if (chapter === 9) {
    drawFile(ctx, 18, 15, 176, 92, '同规模比较');
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(57, 76);
    ctx.lineTo(157, 76);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(107, 76);
    ctx.lineTo(107, 92);
    ctx.stroke();
    const tilt = lerp(-0.02, -0.14, p);
    ctx.save();
    ctx.translate(107, 68);
    ctx.rotate(tilt);
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-43, 0);
    ctx.lineTo(43, 0);
    ctx.stroke();
    ctx.restore();
    drawText(ctx, '核心组合', 51, 46, { size: 10, color: COLORS.green });
    drawText(ctx, '控制组合', 145, 46, { size: 10, align: 'center', color: COLORS.muted });
    drawSeal(ctx, 218, 44, p > 0.85, '显著');
    return;
  }

  drawFile(ctx, 18, 15, 176, 92, '证据边界');
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(34, 31, 145, 58);
  ctx.setLineDash([]);
  drawText(ctx, 'Qwen3-4B / 100 条提示', 106, 42, { size: 9, align: 'center', color: COLORS.orange });
  const drop = clamp((phase - 0.45) / 0.35, 0, 1);
  roundedRect(ctx, 76, lerp(47, 69, drop), 60, 24, 5);
  ctx.fillStyle = COLORS.green;
  ctx.fill();
  drawText(ctx, '边界内结论', 106, lerp(59, 81, drop), { size: 9, align: 'center', color: '#fff', weight: 700 });
  drawSeal(ctx, 218, 44, phase > 0.82, '结案');
}

export function CaseFileAnalogy({ chapterId, moduleId }: CanvasWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapter = chapterNumber(chapterId, moduleId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let startTime = 0;
    let running = false;

    const drawFrame = (time: number) => {
      if (!running) return;
      if (!startTime) startTime = time;
      const cycle = 3200;
      const phase = ((time - startTime) % cycle) / cycle;
      const ctx = prepareCanvas(canvas, 244, 130);
      drawAnalogy(ctx, chapter, phase);
      canvas.classList.add('is-ready');
      frame = requestAnimationFrame(drawFrame);
    };

    const stop = observeCanvas(
      canvas,
      () => {
        if (running) return;
        running = true;
        startTime = 0;
        frame = requestAnimationFrame(drawFrame);
      },
      () => {
        running = false;
        cancelAnimationFrame(frame);
      }
    );

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      stop();
    };
  }, [chapter]);

  return (
    <canvas
      ref={canvasRef}
      width={244}
      height={130}
      role="img"
      aria-label={`第 ${chapter} 节保密档案类比动画`}
      style={{ display: 'block', width: '100%', maxWidth: 244, height: 'auto', margin: '0 auto' }}
    />
  );
}
