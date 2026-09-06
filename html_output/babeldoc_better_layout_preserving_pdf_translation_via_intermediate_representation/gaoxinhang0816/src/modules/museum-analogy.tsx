import React, { useEffect, useMemo, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  MUSEUM_COLORS,
  clearMuseumScene,
  drawCaptionCard,
  drawExhibitFrame,
  drawMuseumLabel,
  drawMuseumWall,
  drawTargetSeal,
} from './museum-hero';

const W = 244;
const H = 130;

const ARIA_LABELS: Record<number, string> = {
  1: '一张 IR 记录卡滑入原展框：卡片同时保留中文译文与位置、层级、顺序等页面依据，因此译文能回到原位',
  2: '保护罩盖住整条经典 attention 公式，使上标、下标、分式和根号绕过翻译模型',
  3: '两张展签保持原位，一个共同阅读窗扩展到同时覆盖二者，表示共享上下文而非合并页面块',
  4: '一张过长展签逐步收缩，并在第一次适配时停在原框内',
  5: '一个内层展框移动到外层画框中的正确位置',
  6: '三行评测指标索引：自动布局使用 BIoU 且越高越好，Gemini 评审使用 TP 且越高越好，人工评审使用 UTB 且越低越好；三者单位不同，不合成总分',
};

function baseScene(ctx: CanvasRenderingContext2D) {
  clearMuseumScene(ctx, W, H);
  drawMuseumWall(ctx, W, H, { pedestalY: 108 });
}

function drawChapter1(ctx: CanvasRenderingContext2D, t: number) {
  baseScene(ctx);
  const successHalf = t >= 0.5;
  const local = easeInOutQuad(successHalf ? (t - 0.5) * 2 : t * 2);
  drawExhibitFrame(ctx, 130, 30, 94, 66, {
    stroke: MUSEUM_COLORS.dark,
    fill: 'rgba(255,255,255,0.3)',
    lineWidth: 2,
    radius: 8,
  });
  const targetX = successHalf ? 144 : 184;
  const x = 8 + (targetX - 8) * local;
  drawCaptionCard(ctx, x, 46, 70, 34, '译文', {
    stroke: successHalf ? MUSEUM_COLORS.success : MUSEUM_COLORS.failure,
    fontSize: 12,
    padding: 7,
    align: 'center',
  });
  if (successHalf) {
    drawMuseumLabel(ctx, '约束', x + 61, 55, { color: MUSEUM_COLORS.current, fontSize: 8, align: 'right' });
    if (local > 0.88) drawTargetSeal(ctx, 216, 88, '合框', 10);
  } else if (local > 0.78) {
    ctx.save();
    ctx.fillStyle = 'rgba(196,63,82,0.16)';
    ctx.fillRect(224, 43, 20, 40);
    ctx.restore();
  }
  drawMuseumLabel(ctx, '译文', 12, 21, { color: MUSEUM_COLORS.emphasis });
  drawMuseumLabel(ctx, '固定展框', 177, 21, { color: MUSEUM_COLORS.dark, align: 'center' });
}

function drawChapter2(ctx: CanvasRenderingContext2D, t: number) {
  clearMuseumScene(ctx, W, H);
  drawMuseumWall(ctx, W, H, { pedestalY: 116 });

  drawMuseumLabel(ctx, 'IR 记录卡', 8, 17, {
    color: MUSEUM_COLORS.current,
    fontSize: 10,
    fontWeight: 800,
  });
  drawMuseumLabel(ctx, '原展框', 232, 16, {
    color: MUSEUM_COLORS.dark,
    fontSize: 10,
    align: 'right',
    fontWeight: 800,
  });

  drawExhibitFrame(ctx, 128, 24, 108, 78, {
    stroke: MUSEUM_COLORS.dark,
    fill: 'rgba(255,255,255,0.24)',
    lineWidth: 2,
    radius: 8,
  });
  drawExhibitFrame(ctx, 134, 31, 96, 64, {
    stroke: MUSEUM_COLORS.border,
    fill: 'rgba(255,255,255,0.16)',
    lineWidth: 1.5,
    radius: 6,
    dashed: true,
  });
  drawMuseumLabel(ctx, '等待译文归位', 182, 65, {
    color: MUSEUM_COLORS.muted,
    fontSize: 8,
    align: 'center',
  });

  const rawProgress = Math.min(1, Math.max(0, (t - 0.16) / 0.5));
  const p = easeInOutQuad(rawProgress);
  const cardX = 8 + (132 - 8) * p;
  const cardY = 35 - 5 * Math.sin(p * Math.PI);

  drawExhibitFrame(ctx, cardX, cardY, 100, 58, {
    stroke: p > 0.92 ? MUSEUM_COLORS.success : MUSEUM_COLORS.current,
    fill: '#ffffff',
    lineWidth: p > 0.92 ? 3 : 2,
    radius: 7,
  });

  drawMuseumLabel(ctx, '译文（可改）', cardX + 50, cardY + 20, {
    color: MUSEUM_COLORS.emphasis,
    fontSize: 10,
    align: 'center',
    fontWeight: 800,
  });
  drawMuseumLabel(ctx, '位置 · 层级 · 顺序 ✓', cardX + 50, cardY + 42, {
    color: MUSEUM_COLORS.current,
    fontSize: 8.5,
    align: 'center',
    fontWeight: 750,
  });

  if (p > 0.92) {
    drawMuseumLabel(ctx, '页面依据还在 → 放回原位', 182, 112, {
      color: MUSEUM_COLORS.success,
      fontSize: 9,
      fontWeight: 700,
      align: 'center',
    });
  } else {
    drawMuseumLabel(ctx, 'IR = 译文 + 页面依据', 122, 112, {
      color: MUSEUM_COLORS.current,
      fontSize: 9,
      fontWeight: 700,
      align: 'center',
    });
  }
}

function drawChapter3(ctx: CanvasRenderingContext2D, t: number) {
  baseScene(ctx);
  drawExhibitFrame(ctx, 66, 23, 112, 76, { fill: 'rgba(255,255,255,0.28)', radius: 9 });
  const phase = t * 2;
  const flip = Math.abs(Math.cos(phase * Math.PI));
  const showingBack = phase > 0.5 && phase < 1.5;
  const centerX = 122;
  const centerY = 62;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(Math.max(0.08, flip), 1);
  drawCaptionCard(ctx, -43, -24, 86, 48, showingBack ? '页面约束' : t > 0.75 ? '中文展签' : '文字内容', {
    stroke: showingBack ? MUSEUM_COLORS.current : t > 0.75 ? MUSEUM_COLORS.success : MUSEUM_COLORS.emphasis,
    fontSize: 12,
    align: 'center',
    padding: 6,
  });
  ctx.restore();
  if (t > 0.9) drawTargetSeal(ctx, 174, 92, '回框', 10);
  drawMuseumLabel(ctx, '可编辑面', 42, 18, { color: MUSEUM_COLORS.emphasis });
  drawMuseumLabel(ctx, '约束面', 202, 18, { color: MUSEUM_COLORS.current, align: 'right' });
}

function drawChapter4(ctx: CanvasRenderingContext2D, t: number) {
  baseScene(ctx);
  drawExhibitFrame(ctx, 39, 29, 166, 66, { fill: 'rgba(255,255,255,0.35)', radius: 8 });
  drawMuseumLabel(ctx, 'Attention(Q,K,V)', 122, 52, {
    color: MUSEUM_COLORS.text,
    fontSize: 10,
    fontWeight: 750,
    align: 'center',
  });
  drawMuseumLabel(ctx, '= softmax(QKᵀ/√dₖ)V', 122, 72, {
    color: MUSEUM_COLORS.text,
    fontSize: 9.5,
    fontWeight: 750,
    align: 'center',
  });
  const x = -128 + 169 * easeInOutQuad(t);
  ctx.save();
  ctx.fillStyle = 'rgba(39,68,110,0.18)';
  ctx.strokeStyle = MUSEUM_COLORS.current;
  ctx.lineWidth = 2;
  ctx.fillRect(x, 34, 162, 56);
  ctx.strokeRect(x, 34, 162, 56);
  ctx.fillStyle = MUSEUM_COLORS.current;
  ctx.font = '800 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('整条公式暂存为 {v1}', x + 81, 65);
  ctx.restore();
  if (t > 0.9) drawTargetSeal(ctx, 216, 98, '已护', 10);
  drawMuseumLabel(ctx, 'Attention 教学例', 41, 20, { color: MUSEUM_COLORS.failure });
  drawMuseumLabel(ctx, '整体保护', 205, 20, { color: MUSEUM_COLORS.current, align: 'right' });
}

function drawChapter5(ctx: CanvasRenderingContext2D, t: number) {
  baseScene(ctx);
  drawExhibitFrame(ctx, 16, 34, 94, 55, { fill: 'rgba(255,255,255,0.25)', radius: 7 });
  drawExhibitFrame(ctx, 134, 34, 94, 55, { fill: 'rgba(255,255,255,0.25)', radius: 7 });
  drawMuseumLabel(ctx, 'id: 0', 25, 49, { color: MUSEUM_COLORS.muted, fontSize: 8 });
  drawMuseumLabel(ctx, '通过统一的…', 63, 69, {
    color: MUSEUM_COLORS.text,
    fontSize: 9,
    align: 'center',
    fontWeight: 700,
  });
  drawMuseumLabel(ctx, 'id: 1', 143, 49, { color: MUSEUM_COLORS.muted, fontSize: 8 });
  drawMuseumLabel(ctx, '中间表示…', 181, 69, {
    color: MUSEUM_COLORS.text,
    fontSize: 9,
    align: 'center',
    fontWeight: 700,
  });
  const p = easeInOutQuad(t);
  const windowX = 9;
  const windowWidth = 108 + 124 * p;
  ctx.save();
  ctx.fillStyle = 'rgba(39,68,110,0.08)';
  ctx.strokeStyle = p > 0.88 ? MUSEUM_COLORS.success : MUSEUM_COLORS.current;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.roundRect(windowX, 27, windowWidth, 70, 9);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  drawMuseumLabel(ctx, p > 0.88 ? '同一次请求 · 分别回写' : '共同阅读窗正在展开', 122, 112, {
    color: p > 0.88 ? MUSEUM_COLORS.success : MUSEUM_COLORS.current,
    fontSize: 9,
    align: 'center',
    fontWeight: 750,
  });
  if (p > 0.9) drawTargetSeal(ctx, 231, 101, '同看', 9);
  drawMuseumLabel(ctx, '块不移动', 16, 20, { color: MUSEUM_COLORS.dark });
  drawMuseumLabel(ctx, '共享上下文', 228, 20, { color: MUSEUM_COLORS.success, align: 'right' });
}

function drawChapter6(ctx: CanvasRenderingContext2D, t: number) {
  baseScene(ctx);
  const cardXs = [26, 94, 162];
  cardXs.forEach((x, index) => {
    const reached = t > (index + 1) / 3 - 0.08;
    drawCaptionCard(ctx, x, 52, 56, 31, reached ? '当前变换' : ['当前变换', '当前转换', '现行变换'][index], {
      stroke: reached ? MUSEUM_COLORS.success : MUSEUM_COLORS.failure,
      fontSize: 8,
      align: 'center',
      padding: 3,
    });
  });
  const segment = Math.min(2, Math.floor(t * 3));
  const local = t * 3 - segment;
  const fromX = segment === 0 ? 10 : cardXs[segment - 1] + 28;
  const toX = cardXs[segment] + 28;
  const stampX = fromX + (toX - fromX) * easeInOutQuad(local);
  const stampY = 38 - 8 * Math.sin(local * Math.PI);
  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.fillStyle = MUSEUM_COLORS.current;
  ctx.fillRect(-6, -12, 12, 15);
  ctx.strokeStyle = MUSEUM_COLORS.success;
  ctx.lineWidth = 2;
  ctx.strokeRect(-10, 3, 20, 8);
  ctx.restore();
  if (t > 0.94) drawTargetSeal(ctx, 221, 94, '统一', 10);
  drawMuseumLabel(ctx, '术语表', 18, 19, { color: MUSEUM_COLORS.current });
  drawMuseumLabel(ctx, '已统一', 224, 19, { color: MUSEUM_COLORS.success, align: 'right' });
}

function drawChapter7(ctx: CanvasRenderingContext2D, t: number) {
  baseScene(ctx);
  drawExhibitFrame(ctx, 78, 27, 128, 72, { fill: 'rgba(255,255,255,0.28)', radius: 8 });
  ctx.save();
  ctx.strokeStyle = MUSEUM_COLORS.muted;
  ctx.lineWidth = 1.5;
  for (let x = 23; x <= 58; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 36);
    ctx.lineTo(x, x % 14 === 0 ? 55 : 49);
    ctx.stroke();
  }
  ctx.restore();
  const scale = 1 - 0.15 * easeInOutQuad(t);
  const width = 146 * scale;
  const height = 72 * scale;
  const x = 142 - width / 2;
  const y = 63 - height / 2;
  drawCaptionCard(ctx, x, y, width, height, '译文变长后逐档缩排', {
    stroke: t > 0.9 ? MUSEUM_COLORS.success : MUSEUM_COLORS.failure,
    fontSize: 12 * scale,
    lineHeight: 16 * scale,
    align: 'center',
    padding: 6,
  });
  if (t > 0.9) drawTargetSeal(ctx, 202, 97, '首适', 10);
  drawMuseumLabel(ctx, '原框', 82, 19, { color: MUSEUM_COLORS.dark });
  drawMuseumLabel(ctx, '局部 γ', 203, 19, { color: MUSEUM_COLORS.current, align: 'right' });
}

function drawChapter8(ctx: CanvasRenderingContext2D, t: number) {
  baseScene(ctx);
  const labels = ['建 IR', '护公式', '整语义', '缩排版', '重建'];
  const startX = 15;
  labels.forEach((label, index) => {
    const x = startX + index * 45;
    drawExhibitFrame(ctx, x, 46, 36, 35, {
      stroke: MUSEUM_COLORS.border,
      fill: 'rgba(255,255,255,0.24)',
      lineWidth: 1.5,
      radius: 5,
    });
    drawMuseumLabel(ctx, label, x + 18, 66, { color: MUSEUM_COLORS.muted, fontSize: 8, align: 'center' });
  });
  const beamX = 30 + 180 * easeInOutQuad(t);
  ctx.save();
  ctx.fillStyle = 'rgba(39,68,110,0.14)';
  ctx.beginPath();
  ctx.moveTo(beamX, 19);
  ctx.lineTo(beamX - 21, 91);
  ctx.lineTo(beamX + 21, 91);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = MUSEUM_COLORS.current;
  ctx.fillRect(beamX - 12, 13, 24, 9);
  ctx.restore();
  drawMuseumLabel(ctx, '当前展室', 15, 112, { color: MUSEUM_COLORS.current });
  drawMuseumLabel(ctx, '共享 IR', 228, 112, { color: MUSEUM_COLORS.auxiliary, align: 'right' });
}

function drawChapter9(ctx: CanvasRenderingContext2D, t: number) {
  baseScene(ctx);
  drawExhibitFrame(ctx, 46, 28, 116, 64, { fill: 'rgba(255,255,255,0.3)', radius: 8 });
  ctx.save();
  ctx.strokeStyle = MUSEUM_COLORS.muted;
  ctx.lineWidth = 1.5;
  [178, 192, 206].forEach((x, index) => {
    ctx.beginPath();
    ctx.moveTo(x, 84);
    ctx.lineTo(x, 44 + index * 8);
    ctx.stroke();
  });
  ctx.restore();
  const wedgeX = 90 - 58 * easeInOutQuad(t);
  ctx.save();
  ctx.fillStyle = t > 0.75 ? MUSEUM_COLORS.failure : MUSEUM_COLORS.support;
  ctx.beginPath();
  ctx.moveTo(wedgeX, 92);
  ctx.lineTo(wedgeX + 34, 92);
  ctx.lineTo(wedgeX + 27, 108);
  ctx.lineTo(wedgeX + 7, 108);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawMuseumLabel(ctx, '支撑楔', 18, 19, { color: MUSEUM_COLORS.support });
  drawMuseumLabel(ctx, '指标读数', 222, 19, { color: MUSEUM_COLORS.current, align: 'right' });
}

function drawChapter10(ctx: CanvasRenderingContext2D, _t: number) {
  baseScene(ctx);

  drawMuseumLabel(ctx, '协议', 20, 13, {
    color: MUSEUM_COLORS.muted,
    fontSize: 7,
    fontWeight: 700,
  });
  drawMuseumLabel(ctx, '指标方向', 122, 13, {
    color: MUSEUM_COLORS.muted,
    fontSize: 7,
    fontWeight: 700,
    align: 'center',
  });
  drawMuseumLabel(ctx, '单位', 224, 13, {
    color: MUSEUM_COLORS.muted,
    fontSize: 7,
    fontWeight: 700,
    align: 'right',
  });

  const rows = [
    { y: 20, protocol: '自动布局', metric: 'BIoU  ↑', unit: '%', color: MUSEUM_COLORS.current },
    { y: 49, protocol: 'Gemini', metric: 'TP  ↑', unit: '1–5 分', color: MUSEUM_COLORS.auxiliary },
    { y: 78, protocol: '人工评审', metric: 'UTB  ↓', unit: '块/页', color: MUSEUM_COLORS.support },
  ] as const;

  rows.forEach((row) => {
    drawExhibitFrame(ctx, 8, row.y, 228, 25, {
      stroke: row.color,
      fill: 'rgba(255,255,255,0.72)',
      lineWidth: 1.5,
      radius: 6,
    });
    drawMuseumLabel(ctx, row.protocol, 18, row.y + 14, {
      color: MUSEUM_COLORS.text,
      fontSize: 8,
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, row.metric, 122, row.y + 14, {
      color: row.color,
      fontSize: 10,
      fontWeight: 800,
      align: 'center',
    });
    drawMuseumLabel(ctx, row.unit, 226, row.y + 14, {
      color: MUSEUM_COLORS.muted,
      fontSize: 8,
      fontWeight: 700,
      align: 'right',
    });
  });

  drawMuseumLabel(ctx, '单位不同 · 不合成总分', 122, 119, {
    color: MUSEUM_COLORS.failure,
    fontSize: 9,
    fontWeight: 800,
    align: 'center',
  });
}

function drawCompactChapter5(ctx: CanvasRenderingContext2D, t: number) {
  baseScene(ctx);
  drawExhibitFrame(ctx, 38, 22, 168, 82, {
    stroke: MUSEUM_COLORS.dark,
    fill: 'rgba(255,255,255,0.28)',
    lineWidth: 2,
    radius: 9,
  });
  const p = easeInOutQuad(t);
  const startX = 5;
  const targetX = 94;
  const x = startX + (targetX - startX) * p;
  const y = 49 - 7 * Math.sin(p * Math.PI);
  drawExhibitFrame(ctx, x, y, 76, 38, {
    stroke: p > 0.9 ? MUSEUM_COLORS.success : MUSEUM_COLORS.current,
    fill: 'rgba(39,68,110,0.10)',
    lineWidth: p > 0.9 ? 3 : 2,
    radius: 6,
  });
  drawMuseumLabel(ctx, '局部坐标', x + 38, y + 22, {
    color: p > 0.9 ? MUSEUM_COLORS.success : MUSEUM_COLORS.current,
    fontSize: 9,
    align: 'center',
  });
  if (p > 0.9) drawTargetSeal(ctx, 199, 101, '归位', 10);
  drawMuseumLabel(ctx, '嵌套框', 42, 16, { color: MUSEUM_COLORS.current });
  drawMuseumLabel(ctx, '页面位置', 205, 16, { color: MUSEUM_COLORS.success, align: 'right' });
}

const DRAWERS: Record<number, (ctx: CanvasRenderingContext2D, t: number) => void> = {
  1: drawChapter2,
  2: drawChapter4,
  3: drawChapter5,
  4: drawChapter7,
  5: drawCompactChapter5,
  6: drawChapter10,
};

export const MuseumAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const chapterNumber = useMemo(() => {
    const match = chapterId.match(/(\d+)/);
    return match ? Math.min(6, Math.max(1, Number(match[1]))) : 1;
  }, [chapterId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const drawer = DRAWERS[chapterNumber] ?? DRAWERS[1];
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let startTime = 0;

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const progress = ((now - startTime) % 3200) / 3200;
      drawer(ctx, progress);
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      stop();
      if (reduced || chapterNumber === 6) {
        drawer(ctx, 0.96);
        canvas.classList.add('is-ready');
        return;
      }
      startTime = 0;
      rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterNumber]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      role="img"
      aria-label={ARIA_LABELS[chapterNumber]}
    />
  );
};

export default MuseumAnalogy;
