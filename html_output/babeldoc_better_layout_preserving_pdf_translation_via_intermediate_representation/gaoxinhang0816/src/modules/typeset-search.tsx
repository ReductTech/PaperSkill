import React, { useCallback, useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  MUSEUM_COLORS,
  clearMuseumScene,
  drawCaptionCard,
  drawExhibitFrame,
  drawLegend,
  drawMuseumLabel,
  drawMuseumWall,
  drawTargetSeal,
} from './museum-hero';

const W = 960;
const H = 540;

type ScaleStep = 0 | 1 | 2 | 3;

const SCALE_VALUES = [1.0, 0.95, 0.9, 0.85] as const;
const BOX = { x: 224, y: 104, width: 420, height: 250, padding: 24 } as const;
const BASE_FONT_SIZE = 28;
const BASE_LINE_HEIGHT = 39;
const TEACHING_TEXT =
  '跨语言翻译会让技术说明变长，系统需要保留原段落框，并在不碰到相邻公式、图表和栏边界的前提下，逐步调整当前段落的字号与行距，直到译文首次完整进入固定空间，同时保持它仍然可以清楚阅读。';

interface LayoutResult {
  lines: string[];
  lineWidths: number[];
  fontSize: number;
  lineHeight: number;
  totalHeight: number;
  fits: boolean;
}

function layoutParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  gamma: number,
): LayoutResult {
  const fontSize = BASE_FONT_SIZE * gamma;
  const lineHeight = BASE_LINE_HEIGHT * gamma;
  const availableWidth = BOX.width - BOX.padding * 2;
  const availableHeight = BOX.height - BOX.padding * 2;
  ctx.font = `600 ${fontSize}px system-ui, "PingFang SC", sans-serif`;

  const lines: string[] = [];
  const lineWidths: number[] = [];
  let current = '';
  for (const character of Array.from(text)) {
    const candidate = current + character;
    if (current && ctx.measureText(candidate).width > availableWidth) {
      lines.push(current);
      lineWidths.push(ctx.measureText(current).width);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) {
    lines.push(current);
    lineWidths.push(ctx.measureText(current).width);
  }

  const totalHeight = lines.length * lineHeight;
  const fitsWidth = lineWidths.every((width) => width <= availableWidth + 0.5);
  return {
    lines,
    lineWidths,
    fontSize,
    lineHeight,
    totalHeight,
    fits: fitsWidth && totalHeight <= availableHeight + 0.5,
  };
}

function drawHatchedOverflow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (height <= 0) return;
  ctx.save();
  ctx.fillStyle = 'rgba(196, 63, 82, 0.10)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = MUSEUM_COLORS.failure;
  ctx.lineWidth = 1.5;
  for (let offset = -height; offset < width; offset += 14) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y + height);
    ctx.lineTo(x + offset + height, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  scaleStep: ScaleStep,
  layout: LayoutResult,
) {
  const gamma = SCALE_VALUES[scaleStep];
  clearMuseumScene(ctx, W, H);
  drawMuseumWall(ctx, W, H, { pedestalY: 402 });

  ctx.strokeStyle = MUSEUM_COLORS.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(106, 92);
  ctx.lineTo(106, 357);
  ctx.stroke();
  SCALE_VALUES.forEach((value, index) => {
    const y = 112 + index * 74;
    const isCurrent = index === scaleStep;
    const isPast = index < scaleStep;
    ctx.beginPath();
    ctx.arc(106, y, isCurrent ? 11 : 8, 0, Math.PI * 2);
    ctx.fillStyle = isCurrent
      ? layout.fits
        ? MUSEUM_COLORS.success
        : MUSEUM_COLORS.current
      : isPast
        ? MUSEUM_COLORS.current
        : MUSEUM_COLORS.border;
    ctx.fill();
    ctx.fillStyle = isCurrent ? MUSEUM_COLORS.text : MUSEUM_COLORS.muted;
    ctx.font = `${isCurrent ? '800' : '600'} 14px system-ui, sans-serif`;
    ctx.fillText(`γ=${value.toFixed(2)}`, 126, y + 5);
  });

  drawMuseumLabel(ctx, '局部 γ', 39, 66, {
    color: MUSEUM_COLORS.current,
    fontSize: 14,
    fontWeight: 800,
  });
  drawMuseumLabel(ctx, '原框', BOX.x + 8, BOX.y - 16, {
    color: MUSEUM_COLORS.dark,
    fontSize: 14,
    fontWeight: 800,
  });

  drawExhibitFrame(ctx, BOX.x, BOX.y, BOX.width, BOX.height, {
    fill: '#ffffff',
    stroke: layout.fits ? MUSEUM_COLORS.success : MUSEUM_COLORS.dark,
    lineWidth: layout.fits ? 3 : 2,
  });

  ctx.save();
  ctx.beginPath();
  ctx.rect(BOX.x, BOX.y, BOX.width, BOX.height);
  ctx.clip();
  ctx.font = `600 ${layout.fontSize}px system-ui, "PingFang SC", sans-serif`;
  ctx.textBaseline = 'alphabetic';
  layout.lines.forEach((line, index) => {
    const baseline = BOX.y + BOX.padding + layout.fontSize + index * layout.lineHeight;
    const lineBottom = BOX.y + BOX.padding + (index + 1) * layout.lineHeight;
    ctx.fillStyle = MUSEUM_COLORS.text;
    ctx.fillText(line, BOX.x + BOX.padding, baseline);
  });
  ctx.restore();

  const overflowHeight = Math.max(
    0,
    layout.totalHeight - (BOX.height - BOX.padding * 2),
  );
  if (!layout.fits) {
    drawHatchedOverflow(
      ctx,
      BOX.x,
      BOX.y + BOX.height + 7,
      BOX.width,
      28,
    );
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(BOX.x + 96, BOX.y + BOX.height + 10, 228, 22);
    ctx.fillStyle = MUSEUM_COLORS.failure;
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `仍有 ${Math.ceil(overflowHeight)} px 内容未入框`,
      BOX.x + BOX.width / 2,
      BOX.y + BOX.height + 26,
    );
    ctx.textAlign = 'left';
  } else {
    drawTargetSeal(ctx, BOX.x + BOX.width - 14, BOX.y + 24, '首次适配', 24);
  }

  drawExhibitFrame(ctx, 658, 104, 40, 250, {
    fill: 'rgba(217, 119, 6, 0.10)',
    stroke: layout.fits ? MUSEUM_COLORS.border : MUSEUM_COLORS.failure,
    lineWidth: 2,
    dashed: true,
  });
  ctx.save();
  ctx.translate(681, 329);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = MUSEUM_COLORS.emphasis;
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('相邻图表禁入区', 0, 0);
  ctx.restore();

  drawCaptionCard(ctx, 718, 77, 218, 92, ['当前步长', `教学演示采用 Δ=0.05`, `当前 γ=${gamma.toFixed(2)}`], {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.current,
    textColor: MUSEUM_COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    padding: 10,
    fontWeight: 650,
  });
  drawCaptionCard(ctx, 718, 185, 218, 92, ['停止条件', '第一次适配原框', '或达到预设下限'], {
    fill: '#ffffff',
    stroke: layout.fits ? MUSEUM_COLORS.success : MUSEUM_COLORS.emphasis,
    textColor: MUSEUM_COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    padding: 10,
    fontWeight: 650,
  });
  drawCaptionCard(ctx, 718, 293, 218, 92, ['案例边界', 'γ=0.85 是定性案例', '不是默认值或最优值'], {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.support,
    textColor: MUSEUM_COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    padding: 10,
    fontWeight: 650,
  });

  ctx.fillStyle = MUSEUM_COLORS.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('教学排版文本：每一步都用同一个 measureText 换行与测量函数。', 224, 427);
  ctx.fillStyle = MUSEUM_COLORS.emphasis;
  ctx.fillText('若到预设下限仍不适配，搜索停止；论文未公布下限数值。', 224, 454);

  drawLegend(
    ctx,
    [
      { label: '仍有溢出', color: MUSEUM_COLORS.failure },
      { label: '正在搜索', color: MUSEUM_COLORS.current },
      { label: '首次适配', color: MUSEUM_COLORS.success },
    ],
    575,
    500,
    { columns: 3, fontSize: 12, gap: 12 },
  );
}

function feedbackFor(step: ScaleStep, fits: boolean) {
  if (fits) {
    return {
      cls: 'good',
      text: step === 3
        ? 'γ=0.85：本教学排版首次适配。论文也在一个定性案例中展示了 γ=0.85，但它不是默认值或普适最优值。'
        : `γ=${SCALE_VALUES[step].toFixed(2)}：本环境测量到教学文本已首次适配，搜索在这里停止。`,
    };
  }
  if (step === 0) {
    return {
      cls: 'bad',
      text: 'γ=1.00：译文越过原段落边界，尚未满足布局约束。',
    };
  }
  if (step === 1) {
    return {
      cls: '',
      text: 'γ=0.95：重新排版后仍有溢出，继续局部搜索。',
    };
  }
  if (step === 2) {
    return {
      cls: '',
      text: 'γ=0.90：仍未完整进入固定框，再减小一个教学步长。',
    };
  }
  return {
    cls: 'bad',
    text: 'γ=0.85：本环境测量仍未完整适配；教学搜索已到最后一个演示档位，不能伪造成功状态。',
  };
}

export const TypesetSearch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const visibleRef = useRef(true);
  const timerRef = useRef<number | null>(null);
  const layoutCacheRef = useRef<LayoutResult[]>([]);
  const stepRef = useRef<ScaleStep>(0);
  const [scaleStep, setScaleStep] = useState<ScaleStep>(0);

  const cancelAuto = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const commitStep = useCallback((step: ScaleStep) => {
    stepRef.current = step;
    setScaleStep(step);
  }, []);

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
    ctxRef.current = ctx;
    layoutCacheRef.current = SCALE_VALUES.map((gamma) => layoutParagraph(ctx, TEACHING_TEXT, gamma));
    drawScene(ctx, 0, layoutCacheRef.current[0]);
    canvas.classList.add('is-ready');
    const disconnect = observeCanvas(
      canvas,
      () => {
        visibleRef.current = true;
        const layout = layoutCacheRef.current[stepRef.current];
        if (layout) drawScene(ctx, stepRef.current, layout);
      },
      () => {
        visibleRef.current = false;
        cancelAuto();
      },
    );
    return () => {
      cancelAuto();
      disconnect();
    };
  }, [cancelAuto]);

  useEffect(() => {
    stepRef.current = scaleStep;
    const layout = layoutCacheRef.current[scaleStep];
    if (ctxRef.current && layout && visibleRef.current) drawScene(ctxRef.current, scaleStep, layout);
  }, [scaleStep]);

  const currentLayout = layoutCacheRef.current[scaleStep];
  const measuredFit = currentLayout?.fits ?? false;

  const stepOnce = () => {
    cancelAuto();
    const layout = layoutCacheRef.current[scaleStep];
    if (layout?.fits || scaleStep === 3) return;
    commitStep((scaleStep + 1) as ScaleStep);
  };

  const runAuto = () => {
    cancelAuto();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) {
      const fitIndex = layoutCacheRef.current.findIndex((item, index) => index >= scaleStep && item.fits);
      commitStep((fitIndex >= 0 ? fitIndex : 3) as ScaleStep);
      return;
    }
    let next = scaleStep;
    const advance = () => {
      const current = layoutCacheRef.current[next];
      if (current?.fits || next >= 3 || !visibleRef.current) {
        timerRef.current = null;
        return;
      }
      next = (next + 1) as ScaleStep;
      commitStep(next);
      if (!layoutCacheRef.current[next]?.fits && next < 3) {
        timerRef.current = window.setTimeout(advance, 450);
      } else {
        timerRef.current = null;
      }
    };
    timerRef.current = window.setTimeout(advance, 120);
  };

  const reset = () => {
    cancelAuto();
    commitStep(0);
  };

  const feedback = feedbackFor(scaleStep, measuredFit);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        className="paper-canvas"
        width={W}
        height={H}
        aria-label={`固定段落框中的教学译文当前使用局部缩放因子 γ=${SCALE_VALUES[scaleStep].toFixed(2)}`}
      />

      <div className="ctrl" role="group" aria-label="局部缩放因子搜索">
        <button
          className="tiny"
          type="button"
          onClick={stepOnce}
          disabled={measuredFit || scaleStep === 3}
        >
          {measuredFit ? '已在第一次适配处停止' : '减小 0.05 并重排'}
        </button>
        <button
          className="tiny"
          type="button"
          onClick={runAuto}
          disabled={measuredFit || scaleStep === 3}
        >
          自动搜索 γ
        </button>
        <button className="tiny ghost" type="button" onClick={reset}>
          重置到 γ=1.00
        </button>
        <span className="val" aria-label="当前局部缩放因子">
          γ={SCALE_VALUES[scaleStep].toFixed(2)}
        </span>
      </div>

      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.emphasis }}>
        若到预设下限仍不适配，搜索停止；论文未公布下限数值。
      </div>
      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.support }}>
        论文第 4 页 §3.4：每个段落的 γ 从 1.0 开始，溢出时通常按 0.05 或 0.10 递减并重新排版，直到第一次适配或预设下限。第 7 页 §5.2 的 γ=0.85 只属于一个定性案例，不是默认值。
      </div>

      <div aria-label="判断自适应排版机制" style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <details>
          <summary className="chip">γ 属于当前段落，从 1.0 搜索到首次适配或配置下限</summary>
          <div className="feedback good">判断正确：这是段落局部迭代搜索，不是学习出的全局尺度。</div>
        </details>
        <details>
          <summary className="chip">γ=0.85 是所有页面默认值</summary>
          <div className="feedback bad">不对：0.85 只来自一个定性案例，不是下限、默认值或普适最优值。</div>
        </details>
        <details>
          <summary className="chip">自适应排版通过训练学习最优 γ</summary>
          <div className="feedback bad">不对：这里没有训练、梯度或损失函数；adaptive 指运行时迭代搜索。</div>
        </details>
      </div>

      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.emphasis }}>
        适用边界：极长译文、书写方向变化或复杂内联图像可能到下限仍然溢出；继续缩小会损害可读性，而局部适配也不等于整页排版达到全局最优。
      </div>
    </div>
  );
};

export default TypesetSearch;
