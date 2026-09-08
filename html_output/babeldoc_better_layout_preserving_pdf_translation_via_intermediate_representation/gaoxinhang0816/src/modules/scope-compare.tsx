import React, { useEffect, useRef, useState } from 'react';
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

type MethodMode = 'textOnly' | 'irBacked';

const W = 1000;
const H = 500;
const CAPTION = '中间表示把文字内容和页面约束分开保存。';

function drawState(ctx: CanvasRenderingContext2D, mode: MethodMode) {
  clearMuseumScene(ctx, W, H);
  drawMuseumWall(ctx, W, H, { pedestalY: 462 });

  drawMuseumLabel(ctx, '同一句正确译文', 500, 34, {
    color: MUSEUM_COLORS.emphasis,
    fontSize: 14,
    align: 'center',
  });
  drawCaptionCard(ctx, 300, 50, 400, 62, CAPTION, {
    stroke: MUSEUM_COLORS.emphasis,
    fontSize: 18,
    align: 'center',
    padding: 14,
  });

  const pathColor = mode === 'textOnly' ? MUSEUM_COLORS.failure : MUSEUM_COLORS.current;
  ctx.save();
  ctx.strokeStyle = pathColor;
  ctx.lineWidth = 3;
  ctx.setLineDash(mode === 'textOnly' ? [10, 7] : []);
  ctx.beginPath();
  ctx.moveTo(500, 119);
  ctx.lineTo(500, 185);
  ctx.lineTo(mode === 'textOnly' ? 580 : 470, 279);
  ctx.stroke();
  ctx.restore();
  drawMuseumLabel(ctx, mode === 'textOnly' ? '纯文本链（教学示意）' : 'BabelDOC', 500, 159, {
    color: pathColor,
    fontSize: 14,
    align: 'center',
  });

  const tags = ['边界框', '层级', '绘制顺序'];
  tags.forEach((tag, index) => {
    const x = 288 + index * 212;
    drawCaptionCard(ctx, x, 190, 150, 48, tag, {
      stroke: mode === 'textOnly' ? MUSEUM_COLORS.failure : MUSEUM_COLORS.success,
      textColor: mode === 'textOnly' ? MUSEUM_COLORS.failure : MUSEUM_COLORS.success,
      fontSize: 14,
      align: 'center',
      padding: 8,
    });
    if (mode === 'textOnly') {
      ctx.save();
      ctx.strokeStyle = MUSEUM_COLORS.failure;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 62, 200);
      ctx.lineTo(x + 88, 228);
      ctx.moveTo(x + 88, 200);
      ctx.lineTo(x + 62, 228);
      ctx.stroke();
      ctx.restore();
    }
  });

  drawExhibitFrame(ctx, 430, 282, 420, 150, {
    stroke: MUSEUM_COLORS.dark,
    fill: 'rgba(255,255,255,0.30)',
    lineWidth: 3,
    radius: 14,
  });
  drawMuseumLabel(ctx, '来源页面中的固定展框', 640, 272, {
    color: MUSEUM_COLORS.dark,
    fontSize: 14,
    align: 'center',
  });

  if (mode === 'textOnly') {
    drawCaptionCard(ctx, 580, 318, 342, 90, CAPTION, {
      stroke: MUSEUM_COLORS.failure,
      fontSize: 18,
      lineHeight: 25,
      padding: 14,
    });
    ctx.save();
    ctx.fillStyle = 'rgba(196,63,82,0.15)';
    ctx.fillRect(850, 310, 72, 106);
    ctx.strokeStyle = MUSEUM_COLORS.failure;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(850, 304);
    ctx.lineTo(850, 421);
    ctx.stroke();
    ctx.restore();
    drawMuseumLabel(ctx, '越界 72 px（教学示意）', 882, 447, {
      color: MUSEUM_COLORS.failure,
      fontSize: 13,
      align: 'center',
    });
  } else {
    ctx.save();
    ctx.strokeStyle = MUSEUM_COLORS.success;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(456, 304);
    ctx.lineTo(824, 304);
    ctx.stroke();
    ctx.restore();
    drawCaptionCard(ctx, 470, 316, 330, 94, CAPTION, {
      stroke: MUSEUM_COLORS.success,
      fontSize: 16,
      lineHeight: 23,
      padding: 14,
    });
    drawMuseumLabel(ctx, '派生局部缩放，字体回退仍可能改变', 635, 447, {
      color: MUSEUM_COLORS.current,
      fontSize: 13,
      align: 'center',
    });
    drawTargetSeal(ctx, 818, 401, '合框', 20);
  }

  drawLegend(
    ctx,
    mode === 'textOnly'
      ? [{ label: '丢失约束', color: MUSEUM_COLORS.failure, dashed: true }]
      : [{ label: '保留约束', color: MUSEUM_COLORS.success }],
    60,
    470
  );
}

export const ScopeCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const visibleRef = useRef(false);
  const modeRef = useRef<MethodMode>('textOnly');
  const [methodMode, setMethodMode] = useState<MethodMode>('textOnly');

  useEffect(() => {
    modeRef.current = methodMode;
    if (visibleRef.current && ctxRef.current) drawState(ctxRef.current, methodMode);
  }, [methodMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      ctxRef.current = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const start = () => {
      visibleRef.current = true;
      if (ctxRef.current) drawState(ctxRef.current, modeRef.current);
      canvas.classList.add('is-ready');
    };
    const stop = () => {
      visibleRef.current = false;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      visibleRef.current = false;
      disconnect();
    };
  }, []);

  const feedback =
    methodMode === 'textOnly'
      ? '译文没有错；失败的是定位。这条教学示意中的纯文本链已丢失边界框、层级与绘制顺序，系统无法仅凭译文知道它该回到哪个框。'
      : 'IR 同时携带可编辑文字与来源页面约束；译文可以交给后续排版与重建模块重新锚定。局部缩放等派生输出仍可能改变。';

  return (
    <div>
      <div className="chip-row" role="group" aria-label="比较两条 PDF 翻译链">
        <button
          type="button"
          className={`chip ${methodMode === 'textOnly' ? 'selected' : ''}`}
          aria-pressed={methodMode === 'textOnly'}
          onClick={() => setMethodMode('textOnly')}
        >
          纯文本链
        </button>
        <button
          type="button"
          className={`chip ${methodMode === 'irBacked' ? 'selected' : ''}`}
          aria-pressed={methodMode === 'irBacked'}
          onClick={() => setMethodMode('irBacked')}
        >
          BabelDOC
        </button>
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={
          methodMode === 'textOnly'
            ? '纯文本链中的正确译文越出固定展框，边界框、层级和绘制顺序断开'
            : 'BabelDOC 保留页面约束，正确译文经局部排版落入固定展框'
        }
      />
      <div className={`feedback ${methodMode === 'textOnly' ? 'bad' : 'good'}`} aria-live="polite">
        {feedback}
      </div>
    </div>
  );
};

export default ScopeCompare;
