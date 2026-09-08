import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  MUSEUM_COLORS,
  clearMuseumScene,
  drawCaptionCard,
  drawExhibitFrame,
  drawMuseumLabel,
  drawMuseumWall,
} from './museum-hero';

const W = 960;
const H = 500;

type BoundaryMode = 'column' | 'page';
type CheckStep = 0 | 1 | 2 | 3;

interface CheckerState {
  mode: BoundaryMode;
  step: CheckStep;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const INITIAL_STATE: CheckerState = {
  mode: 'column',
  step: 0,
};

const SOURCE_A = 'It relies on';
const SOURCE_B = 'a unified IR.';
const TRANSLATED_A = '它依赖';
const TRANSLATED_B = '统一的 IR。';

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 10
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const head = 9;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - head * Math.cos(angle - Math.PI / 6), toY - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - head * Math.cos(angle + Math.PI / 6), toY - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMutedLines(ctx: CanvasRenderingContext2D, rect: Rect, count = 3) {
  ctx.save();
  ctx.strokeStyle = MUSEUM_COLORS.border;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let index = 0; index < count; index += 1) {
    const y = rect.y + 11 + index * 12;
    ctx.beginPath();
    ctx.moveTo(rect.x + 8, y);
    ctx.lineTo(rect.x + rect.w - 8 - (index === count - 1 ? 18 : 0), y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCandidateBlock(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  id: 0 | 1,
  source: string,
  translated: string,
  step: CheckStep
) {
  const isBoundaryCandidate = step >= 1;
  const isBatched = step >= 2;
  const isWrittenBack = step >= 3;
  const borderColor = isWrittenBack
    ? MUSEUM_COLORS.success
    : isBatched
      ? MUSEUM_COLORS.auxiliary
      : isBoundaryCandidate
        ? MUSEUM_COLORS.current
        : MUSEUM_COLORS.dark;

  drawCaptionCard(ctx, rect.x, rect.y, rect.w, rect.h, isWrittenBack ? translated : source, {
    fill: '#ffffff',
    stroke: borderColor,
    textColor: MUSEUM_COLORS.text,
    fontSize: 10.5,
    lineHeight: 14,
    padding: 8,
    fontWeight: 650,
  });
  const blockName = id === 0 ? 'A' : 'B';
  drawMuseumLabel(ctx, step >= 2 ? `id:${id} · ${blockName}` : `正文块 ${blockName}`, rect.x + 5, rect.y - 7, {
    color: borderColor,
    fontSize: 10.5,
    fontWeight: 800,
  });
}

function drawColumnSource(ctx: CanvasRenderingContext2D, step: CheckStep) {
  const page = { x: 30, y: 64, w: 300, h: 326 };
  drawExhibitFrame(ctx, page.x, page.y, page.w, page.h, {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.dark,
    lineWidth: 1.5,
    radius: 12,
  });
  drawMuseumLabel(ctx, '原 PDF · 同页双栏', 180, 48, {
    color: MUSEUM_COLORS.text,
    align: 'center',
    fontSize: 14,
    fontWeight: 800,
  });

  ctx.save();
  ctx.strokeStyle = MUSEUM_COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(180, 82);
  ctx.lineTo(180, 366);
  ctx.stroke();
  ctx.restore();
  drawMuseumLabel(ctx, '左栏', 94, 90, {
    color: MUSEUM_COLORS.muted,
    align: 'center',
    fontSize: 10.5,
    fontWeight: 700,
  });
  drawMuseumLabel(ctx, '右栏', 253, 90, {
    color: MUSEUM_COLORS.muted,
    align: 'center',
    fontSize: 10.5,
    fontWeight: 700,
  });

  drawMutedLines(ctx, { x: 48, y: 104, w: 112, h: 48 }, 4);
  drawMutedLines(ctx, { x: 48, y: 164, w: 112, h: 48 }, 3);
  drawMutedLines(ctx, { x: 198, y: 212, w: 112, h: 48 }, 4);
  drawMutedLines(ctx, { x: 198, y: 280, w: 112, h: 48 }, 3);

  drawCandidateBlock(ctx, { x: 47, y: 274, w: 116, h: 76 }, 0, SOURCE_A, TRANSLATED_A, step);
  drawCandidateBlock(ctx, { x: 197, y: 112, w: 116, h: 82 }, 1, SOURCE_B, TRANSLATED_B, step);

  if (step >= 1) {
    drawArrow(ctx, 164, 312, 196, 153, MUSEUM_COLORS.current);
  }
}

function drawPageSource(ctx: CanvasRenderingContext2D, step: CheckStep) {
  const firstPage = { x: 24, y: 64, w: 145, h: 326 };
  const secondPage = { x: 191, y: 64, w: 145, h: 326 };
  drawExhibitFrame(ctx, firstPage.x, firstPage.y, firstPage.w, firstPage.h, {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.dark,
    lineWidth: 1.5,
    radius: 11,
  });
  drawExhibitFrame(ctx, secondPage.x, secondPage.y, secondPage.w, secondPage.h, {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.dark,
    lineWidth: 1.5,
    radius: 11,
  });
  drawMuseumLabel(ctx, '原 PDF · 相邻两页', 180, 48, {
    color: MUSEUM_COLORS.text,
    align: 'center',
    fontSize: 14,
    fontWeight: 800,
  });
  drawMuseumLabel(ctx, '第 n 页', 96, 88, {
    color: MUSEUM_COLORS.muted,
    align: 'center',
    fontSize: 10.5,
    fontWeight: 700,
  });
  drawMuseumLabel(ctx, '第 n+1 页', 264, 88, {
    color: MUSEUM_COLORS.muted,
    align: 'center',
    fontSize: 10.5,
    fontWeight: 700,
  });

  drawMutedLines(ctx, { x: 40, y: 105, w: 112, h: 48 }, 4);
  drawMutedLines(ctx, { x: 40, y: 165, w: 112, h: 48 }, 4);
  drawMutedLines(ctx, { x: 207, y: 215, w: 112, h: 48 }, 4);
  drawMutedLines(ctx, { x: 207, y: 278, w: 112, h: 48 }, 3);

  drawCandidateBlock(ctx, { x: 39, y: 278, w: 115, h: 76 }, 0, SOURCE_A, TRANSLATED_A, step);
  drawCandidateBlock(ctx, { x: 206, y: 108, w: 115, h: 82 }, 1, SOURCE_B, TRANSLATED_B, step);

  if (step >= 1) {
    drawArrow(ctx, 155, 316, 205, 149, MUSEUM_COLORS.current);
  }
}

function drawRuleCard(ctx: CanvasRenderingContext2D, state: CheckerState) {
  const { mode, step } = state;
  drawExhibitFrame(ctx, 354, 54, 238, 344, {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.border,
    lineWidth: 1.5,
    radius: 15,
  });
  const titles = ['① 筛正文块', '② 限定边界邻居', '③ 保留两个 id', '④ 按 id 分别回写'] as const;
  drawMuseumLabel(ctx, titles[step], 473, 85, {
    color: MUSEUM_COLORS.text,
    align: 'center',
    fontSize: 15,
    fontWeight: 800,
  });

  if (step === 0) {
    drawMuseumLabel(ctx, 'layout_label（教学概括）', 473, 113, {
      color: MUSEUM_COLORS.muted,
      align: 'center',
      fontSize: 11,
    });
    const labels = [
      ['text', true],
      ['plain text', true],
      ['paragraph_hybrid', true],
      ['figure_caption', false],
    ] as const;
    labels.forEach(([label, accepted], index) => {
      drawCaptionCard(ctx, 382, 135 + index * 55, 182, 39, `${accepted ? '✓' : '×'}  ${label}`, {
        fill: '#ffffff',
        stroke: accepted ? MUSEUM_COLORS.success : MUSEUM_COLORS.failure,
        textColor: accepted ? MUSEUM_COLORS.success : MUSEUM_COLORS.failure,
        fontSize: 12,
        align: 'center',
        fontWeight: 700,
      });
    });
  } else if (step === 1 && mode === 'column') {
    drawCaptionCard(ctx, 382, 126, 182, 56, '存储顺序中\n相邻的正文块', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.current,
      textColor: MUSEUM_COLORS.text,
      fontSize: 12,
      lineHeight: 17,
      align: 'center',
      fontWeight: 700,
    });
    drawArrow(ctx, 473, 193, 473, 220, MUSEUM_COLORS.current);
    drawCaptionCard(ctx, 382, 230, 182, 60, 'Δy₂ = 34 > 20', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.success,
      textColor: MUSEUM_COLORS.success,
      fontSize: 16,
      align: 'center',
      fontWeight: 800,
    });
    drawMuseumLabel(ctx, '代码规则示意', 473, 322, {
      color: MUSEUM_COLORS.emphasis,
      align: 'center',
      fontSize: 12,
      fontWeight: 800,
    });
  } else if (step === 1) {
    drawCaptionCard(ctx, 382, 126, 182, 48, '相邻页面', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.current,
      textColor: MUSEUM_COLORS.current,
      fontSize: 13,
      align: 'center',
      fontWeight: 800,
    });
    drawArrow(ctx, 473, 184, 473, 209, MUSEUM_COLORS.current);
    drawCaptionCard(ctx, 382, 219, 182, 52, '上一页末个正文块', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.current,
      textColor: MUSEUM_COLORS.text,
      fontSize: 12,
      align: 'center',
      fontWeight: 700,
    });
    drawArrow(ctx, 473, 281, 473, 306, MUSEUM_COLORS.current);
    drawCaptionCard(ctx, 382, 316, 182, 52, '下一页首个正文块', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.success,
      textColor: MUSEUM_COLORS.success,
      fontSize: 12,
      align: 'center',
      fontWeight: 700,
    });
  } else if (step === 2) {
    drawCaptionCard(ctx, 382, 130, 182, 54, '候选 A  →  id:0', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.auxiliary,
      textColor: MUSEUM_COLORS.auxiliary,
      fontSize: 13,
      align: 'center',
      fontWeight: 800,
    });
    drawCaptionCard(ctx, 382, 204, 182, 54, '候选 B  →  id:1', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.auxiliary,
      textColor: MUSEUM_COLORS.auxiliary,
      fontSize: 13,
      align: 'center',
      fontWeight: 800,
    });
    drawMuseumLabel(ctx, '身份不丢失', 473, 308, {
      color: MUSEUM_COLORS.auxiliary,
      align: 'center',
      fontSize: 13,
      fontWeight: 800,
    });
  } else {
    drawCaptionCard(ctx, 382, 130, 182, 54, '返回 id:0  →  回写 A', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.success,
      textColor: MUSEUM_COLORS.success,
      fontSize: 12,
      align: 'center',
      fontWeight: 800,
    });
    drawCaptionCard(ctx, 382, 204, 182, 54, '返回 id:1  →  回写 B', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.success,
      textColor: MUSEUM_COLORS.success,
      fontSize: 12,
      align: 'center',
      fontWeight: 800,
    });
    drawMuseumLabel(ctx, '版面位置不变', 473, 308, {
      color: MUSEUM_COLORS.success,
      align: 'center',
      fontSize: 13,
      fontWeight: 800,
    });
  }
}

function drawJsonRecord(
  ctx: CanvasRenderingContext2D,
  y: number,
  id: 0 | 1,
  text: string,
  returned: boolean
) {
  const textKey = returned ? 'output' : 'input';
  drawCaptionCard(ctx, 638, y, 268, 86, [`{ "id": ${id},`, `  "${textKey}": "${text}" }`], {
    fill: '#ffffff',
    stroke: returned ? MUSEUM_COLORS.success : MUSEUM_COLORS.auxiliary,
    textColor: MUSEUM_COLORS.text,
    fontSize: 11.5,
    lineHeight: 18,
    padding: 10,
    fontWeight: 650,
  });
}

function drawRequestCard(ctx: CanvasRenderingContext2D, step: CheckStep) {
  drawExhibitFrame(ctx, 614, 54, 316, 344, {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.border,
    lineWidth: 1.5,
    radius: 15,
  });
  const returned = step === 3;
  drawMuseumLabel(ctx, returned ? '同一次 LLM 返回' : '同一次 LLM 请求', 772, 85, {
    color: MUSEUM_COLORS.text,
    align: 'center',
    fontSize: 15,
    fontWeight: 800,
  });

  if (step < 2) {
    drawCaptionCard(ctx, 654, 138, 236, 62, '等待边界候选确定', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.border,
      textColor: MUSEUM_COLORS.muted,
      fontSize: 13,
      align: 'center',
      fontWeight: 700,
    });
    drawCaptionCard(ctx, 654, 226, 236, 62, '候选确定后同批装入', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.border,
      textColor: MUSEUM_COLORS.muted,
      fontSize: 13,
      align: 'center',
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, '此时尚未调用 LLM', 772, 332, {
      color: MUSEUM_COLORS.muted,
      align: 'center',
      fontSize: 12,
    });
    return;
  }

  drawJsonRecord(ctx, 116, 0, returned ? TRANSLATED_A : SOURCE_A, returned);
  drawJsonRecord(ctx, 224, 1, returned ? TRANSLATED_B : SOURCE_B, returned);
  drawMuseumLabel(ctx, returned ? '相同 id · 分别返回' : '同一 JSON · 共享上下文', 772, 348, {
    color: returned ? MUSEUM_COLORS.success : MUSEUM_COLORS.auxiliary,
    align: 'center',
    fontSize: 13,
    fontWeight: 800,
  });
}

function drawScene(ctx: CanvasRenderingContext2D, state: CheckerState) {
  clearMuseumScene(ctx, W, H);
  drawMuseumWall(ctx, W, H, { pedestalY: 420 });
  if (state.mode === 'column') {
    drawColumnSource(ctx, state.step);
  } else {
    drawPageSource(ctx, state.step);
  }
  drawRuleCard(ctx, state);
  drawRequestCard(ctx, state.step);

  drawMuseumLabel(ctx, '共享上下文  ≠  合并段落', 480, 452, {
    color: MUSEUM_COLORS.current,
    align: 'center',
    fontSize: 17,
    fontWeight: 900,
  });
  drawMuseumLabel(ctx, 'A / B 始终保留各自 id 与页面位置', 480, 478, {
    color: MUSEUM_COLORS.muted,
    align: 'center',
    fontSize: 12.5,
    fontWeight: 700,
  });
}

function getFeedback(state: CheckerState): string {
  if (state.step === 0) {
    return '工程实现先筛正文类 layout_label：text、plain text、paragraph_hybrid。这里是对开源代码类别的教学概括，不是论文术语。';
  }
  if (state.step === 1 && state.mode === 'column') {
    return '跨栏模式：在存储顺序相邻的正文块中，代码用 Δy₂ > 20 判定跨栏边界；本例 34 > 20，因此 A / B 成为边界候选。';
  }
  if (state.step === 1) {
    return '跨页模式：工程规则取相邻页面中上一页的最后正文块与下一页的第一个正文块，A / B 成为边界候选。';
  }
  if (state.step === 2) {
    return '系统保留 id:0 和 id:1，把两块同批装入一个 JSON prompt。LLM 可以共享上下文，但两块没有被拼成一个字符串。';
  }
  return 'LLM 按相同 id 分别返回，系统将译文写回各自 IR 块；A / B 的页面位置没有移动。';
}

export const ContextStitch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [checkerState, setCheckerState] = useState<CheckerState>(INITIAL_STATE);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const stateRef = useRef<CheckerState>(checkerState);

  useEffect(() => {
    stateRef.current = checkerState;
    drawRef.current?.();
  }, [checkerState]);

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

    const draw = () => {
      drawScene(ctx, stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    drawRef.current = draw;
    const disconnect = observeCanvas(canvas, draw, () => {});
    return () => {
      drawRef.current = null;
      disconnect();
    };
  }, []);

  const feedback = getFeedback(checkerState);

  return (
    <div>
      <div className="chip-row" role="tablist" aria-label="选择跨边界场景">
        <button
          className={`chip ${checkerState.mode === 'column' ? 'selected' : ''}`}
          type="button"
          role="tab"
          aria-selected={checkerState.mode === 'column'}
          onClick={() => setCheckerState({ mode: 'column', step: 0 })}
        >
          跨栏边界
        </button>
        <button
          className={`chip ${checkerState.mode === 'page' ? 'selected' : ''}`}
          type="button"
          role="tab"
          aria-selected={checkerState.mode === 'page'}
          onClick={() => setCheckerState({ mode: 'page', step: 0 })}
        >
          跨页边界
        </button>
      </div>

      <div className="step-ctrl" role="group" aria-label="边界候选同批翻译的四个步骤">
        {([
          ['① 筛正文块', 0],
          ['② 限定边界邻居', 1],
          ['③ 同批送入 LLM', 2],
          ['④ 按 id 分别回写', 3],
        ] as const).map(([label, step]) => (
          <button
            key={step}
            type="button"
            className={`tiny ${checkerState.step === step ? '' : 'ghost'}`}
            aria-pressed={checkerState.step === step}
            onClick={() => setCheckerState((current) => ({ ...current, step }))}
          >
            {label}
          </button>
        ))}
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        className="paper-canvas"
        width={W}
        height={H}
        role="img"
        aria-label={`${checkerState.mode === 'column' ? '跨栏' : '跨页'}边界候选同批翻译四步检查器；当前为第 ${checkerState.step + 1} 步`}
      />

      <div className={`feedback ${checkerState.step === 3 ? 'good' : ''}`} aria-live="polite">
        {feedback}
      </div>
      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.support }}>
        论文边界：论文第 4 页 §3.3 只描述 IR 支持跨栏、跨页片段的逻辑接续与上下文共享，没有公开候选配对算法。
      </div>
      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.emphasis }}>
        工程来源：正文标签筛选、跨页末块/首块、跨栏相邻正文块与 Δy₂ &gt; 20、保留 id 的同批 JSON 翻译，来自项目开源实现 v0.6.1 及相关代码；它们不是论文正文的算法证据。
      </div>
    </div>
  );
};

export default ContextStitch;
