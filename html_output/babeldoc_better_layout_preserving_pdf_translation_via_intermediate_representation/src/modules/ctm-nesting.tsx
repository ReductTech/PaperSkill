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
const H = 420;

type ViewMode = 'mapping' | 'restore';
type MappingStep = 0 | 1 | 2;
type RestoreMode = 'unset' | 'popped' | 'leaked';

interface CtmState {
  view: ViewMode;
  mappingStep: MappingStep;
  restoreMode: RestoreMode;
}

interface Point {
  x: number;
  y: number;
}

const INITIAL_STATE: CtmState = {
  view: 'mapping',
  mappingStep: 0,
  restoreMode: 'unset',
};

const LOCAL_POINT = { x: 40, y: 30 } as const;
const CHILD_OFFSET = { x: 80, y: 70 } as const;
const PARENT_OFFSET = { x: 420, y: 100 } as const;
const PARENT_POINT = {
  x: LOCAL_POINT.x + CHILD_OFFSET.x,
  y: LOCAL_POINT.y + CHILD_OFFSET.y,
} as const;
const PAGE_POINT = {
  x: PARENT_POINT.x + PARENT_OFFSET.x,
  y: PARENT_POINT.y + PARENT_OFFSET.y,
} as const;

const FRAME = {
  page: { x: 38, y: 40, w: 620, h: 320, origin: { x: 68, y: 76 } },
  parent: { x: 190, y: 90, w: 405, h: 225, origin: { x: 222, y: 126 } },
  child: { x: 310, y: 150, w: 220, h: 115, origin: { x: 342, y: 184 } },
  point: { x: 404, y: 221 },
} as const;

function drawStraightArrow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  lineWidth = 3
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const head = 10;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawActiveOrigin(
  ctx: CanvasRenderingContext2D,
  origin: Point,
  point: Point,
  label: string
) {
  ctx.save();
  ctx.strokeStyle = MUSEUM_COLORS.current;
  ctx.fillStyle = MUSEUM_COLORS.current;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(origin.x, point.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(origin.x - 10, origin.y);
  ctx.lineTo(origin.x + 10, origin.y);
  ctx.moveTo(origin.x, origin.y - 10);
  ctx.lineTo(origin.x, origin.y + 10);
  ctx.stroke();
  ctx.restore();
  drawMuseumLabel(ctx, label, origin.x - 12, origin.y - 10, {
    color: MUSEUM_COLORS.current,
    fontSize: 12,
    fontWeight: 700,
    align: 'right',
  });
}

function drawSamePoint(ctx: CanvasRenderingContext2D) {
  const point = FRAME.point;
  ctx.save();
  ctx.fillStyle = MUSEUM_COLORS.emphasis;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawMuseumLabel(ctx, '同一个点', point.x + 18, point.y + 5, {
    color: MUSEUM_COLORS.emphasis,
    fontSize: 13,
    fontWeight: 700,
  });
}

function drawMappingCalculation(ctx: CanvasRenderingContext2D, step: MappingStep) {
  drawExhibitFrame(ctx, 686, 50, 240, 300, {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.border,
    lineWidth: 1.5,
    radius: 16,
  });

  const titles = ['① 子对象坐标', '② 换到父对象', '③ 换到页面'] as const;
  const origins = ['当前参照：O_child', '当前参照：O_parent', '当前参照：O_page'] as const;
  drawMuseumLabel(ctx, titles[step], 806, 86, {
    color: MUSEUM_COLORS.text,
    align: 'center',
    fontSize: 16,
    fontWeight: 700,
  });
  drawMuseumLabel(ctx, origins[step], 806, 116, {
    color: MUSEUM_COLORS.muted,
    align: 'center',
    fontSize: 12,
  });

  if (step === 0) {
    drawMuseumLabel(ctx, 'p_local', 806, 172, {
      color: MUSEUM_COLORS.current,
      align: 'center',
      fontSize: 15,
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, `= (${LOCAL_POINT.x}, ${LOCAL_POINT.y})`, 806, 214, {
      color: MUSEUM_COLORS.text,
      align: 'center',
      fontSize: 22,
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, '先从它自己的原点量起', 806, 286, {
      color: MUSEUM_COLORS.muted,
      align: 'center',
      fontSize: 12,
    });
  } else if (step === 1) {
    drawMuseumLabel(ctx, 'p_parent = p_local + 子框偏移', 806, 158, {
      color: MUSEUM_COLORS.current,
      align: 'center',
      fontSize: 13,
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, `(${LOCAL_POINT.x}, ${LOCAL_POINT.y}) + (${CHILD_OFFSET.x}, ${CHILD_OFFSET.y})`, 806, 205, {
      color: MUSEUM_COLORS.text,
      align: 'center',
      fontSize: 17,
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, `= (${PARENT_POINT.x}, ${PARENT_POINT.y})`, 806, 247, {
      color: MUSEUM_COLORS.success,
      align: 'center',
      fontSize: 21,
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, '加入 M_child', 806, 295, {
      color: MUSEUM_COLORS.muted,
      align: 'center',
      fontSize: 12,
    });
  } else {
    drawMuseumLabel(ctx, 'p_page = p_parent + 父框偏移', 806, 158, {
      color: MUSEUM_COLORS.current,
      align: 'center',
      fontSize: 13,
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, `(${PARENT_POINT.x}, ${PARENT_POINT.y}) + (${PARENT_OFFSET.x}, ${PARENT_OFFSET.y})`, 806, 205, {
      color: MUSEUM_COLORS.text,
      align: 'center',
      fontSize: 17,
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, `= (${PAGE_POINT.x}, ${PAGE_POINT.y})`, 806, 247, {
      color: MUSEUM_COLORS.success,
      align: 'center',
      fontSize: 21,
      fontWeight: 700,
    });
    drawMuseumLabel(ctx, '再加入 M_parent', 806, 295, {
      color: MUSEUM_COLORS.muted,
      align: 'center',
      fontSize: 12,
    });
  }
}

function drawMappingView(ctx: CanvasRenderingContext2D, step: MappingStep) {
  const pageActive = step === 2;
  const parentActive = step === 1;
  const childActive = step === 0;

  drawExhibitFrame(ctx, FRAME.page.x, FRAME.page.y, FRAME.page.w, FRAME.page.h, {
    fill: '#ffffff',
    stroke: pageActive ? MUSEUM_COLORS.current : MUSEUM_COLORS.border,
    lineWidth: pageActive ? 3 : 1.5,
    radius: 18,
  });
  drawExhibitFrame(ctx, FRAME.parent.x, FRAME.parent.y, FRAME.parent.w, FRAME.parent.h, {
    fill: '#f9fbf7',
    stroke: parentActive ? MUSEUM_COLORS.current : MUSEUM_COLORS.light,
    lineWidth: parentActive ? 3 : 1.5,
    radius: 16,
  });
  drawExhibitFrame(ctx, FRAME.child.x, FRAME.child.y, FRAME.child.w, FRAME.child.h, {
    fill: '#ffffff',
    stroke: childActive ? MUSEUM_COLORS.current : MUSEUM_COLORS.border,
    lineWidth: childActive ? 3 : 1.5,
    radius: 14,
  });

  drawMuseumLabel(ctx, '页面', FRAME.page.x + FRAME.page.w - 20, 64, {
    color: pageActive ? MUSEUM_COLORS.current : MUSEUM_COLORS.muted,
    fontSize: 13,
    fontWeight: 700,
    align: 'right',
  });
  drawMuseumLabel(ctx, '父 XObject · 原点在页面 (+420, +100)', FRAME.parent.x + FRAME.parent.w / 2, 115, {
    color: parentActive ? MUSEUM_COLORS.current : MUSEUM_COLORS.muted,
    fontSize: 12,
    fontWeight: 700,
    align: 'center',
  });
  drawMuseumLabel(ctx, '子对象 · 原点在父框 (+80, +70)', FRAME.child.x + FRAME.child.w / 2, 174, {
    color: childActive ? MUSEUM_COLORS.current : MUSEUM_COLORS.muted,
    fontSize: 12,
    fontWeight: 700,
    align: 'center',
  });

  const activeOrigins = [FRAME.child.origin, FRAME.parent.origin, FRAME.page.origin] as const;
  const activeLabels = ['O_child', 'O_parent', 'O_page'] as const;
  drawActiveOrigin(ctx, activeOrigins[step], FRAME.point, activeLabels[step]);
  drawSamePoint(ctx);
  drawMappingCalculation(ctx, step);

  drawMuseumLabel(ctx, '点没有移动，变化的是测量它的参考原点', 348, 388, {
    color: MUSEUM_COLORS.current,
    align: 'center',
    fontSize: 14,
    fontWeight: 700,
  });
}

function drawDashedTarget(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = MUSEUM_COLORS.border;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.stroke();
  ctx.restore();
}

function drawStateStack(ctx: CanvasRenderingContext2D, mode: RestoreMode) {
  drawExhibitFrame(ctx, 48, 60, 330, 292, {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.border,
    lineWidth: 1.5,
    radius: 16,
  });
  drawMuseumLabel(ctx, '图形状态栈', 213, 89, {
    color: MUSEUM_COLORS.text,
    align: 'center',
    fontSize: 16,
    fontWeight: 700,
  });

  if (mode === 'popped') {
    drawMuseumLabel(ctx, 'M_child 已 pop ↑', 213, 128, {
      color: MUSEUM_COLORS.success,
      align: 'center',
      fontSize: 13,
      fontWeight: 700,
    });
    drawCaptionCard(ctx, 102, 152, 222, 52, 'M_parent · 当前栈顶', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.success,
      textColor: MUSEUM_COLORS.success,
      fontSize: 13,
      align: 'center',
    });
    drawCaptionCard(ctx, 102, 224, 222, 52, 'Page · 页面状态', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.border,
      textColor: MUSEUM_COLORS.muted,
      fontSize: 13,
      align: 'center',
    });
  } else {
    const childColor = mode === 'leaked' ? MUSEUM_COLORS.failure : MUSEUM_COLORS.auxiliary;
    drawCaptionCard(ctx, 102, 120, 222, 52, mode === 'leaked' ? 'M_child · 未移除' : 'M_child · 当前栈顶', {
      fill: '#ffffff',
      stroke: childColor,
      textColor: childColor,
      fontSize: 13,
      align: 'center',
    });
    drawCaptionCard(ctx, 102, 190, 222, 52, 'M_parent · 父对象状态', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.border,
      textColor: MUSEUM_COLORS.muted,
      fontSize: 13,
      align: 'center',
    });
    drawCaptionCard(ctx, 102, 260, 222, 52, 'Page · 页面状态', {
      fill: '#ffffff',
      stroke: MUSEUM_COLORS.border,
      textColor: MUSEUM_COLORS.muted,
      fontSize: 13,
      align: 'center',
    });
  }
}

function drawNextObject(ctx: CanvasRenderingContext2D, mode: RestoreMode) {
  drawExhibitFrame(ctx, 420, 60, 492, 292, {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.border,
    lineWidth: 1.5,
    radius: 16,
  });
  drawMuseumLabel(ctx, '下一个对象（不属于子对象）', 666, 89, {
    color: MUSEUM_COLORS.text,
    align: 'center',
    fontSize: 16,
    fontWeight: 700,
  });

  const target = { x: 530, y: 160, w: 142, h: 72 };
  drawDashedTarget(ctx, target.x, target.y, target.w, target.h);
  drawMuseumLabel(ctx, '目标位置', target.x + target.w / 2, target.y - 12, {
    color: MUSEUM_COLORS.muted,
    align: 'center',
    fontSize: 12,
    fontWeight: 700,
  });

  if (mode === 'unset') {
    drawMuseumLabel(ctx, '请选择退出方式', target.x + target.w / 2, target.y + 43, {
      color: MUSEUM_COLORS.muted,
      align: 'center',
      fontSize: 13,
      fontWeight: 700,
    });
  } else if (mode === 'popped') {
    drawCaptionCard(ctx, target.x, target.y, target.w, target.h, '下一对象', {
      fill: '#f3fbf5',
      stroke: MUSEUM_COLORS.success,
      textColor: MUSEUM_COLORS.success,
      fontSize: 14,
      align: 'center',
    });
    drawMuseumLabel(ctx, '只使用自己的页面状态', 666, 278, {
      color: MUSEUM_COLORS.success,
      align: 'center',
      fontSize: 13,
      fontWeight: 700,
    });
  } else {
    const wrong = { x: 724, y: 236, w: 142, h: 72 };
    drawCaptionCard(ctx, wrong.x, wrong.y, wrong.w, wrong.h, '下一对象', {
      fill: '#fff7f7',
      stroke: MUSEUM_COLORS.failure,
      textColor: MUSEUM_COLORS.failure,
      fontSize: 14,
      align: 'center',
    });
    drawStraightArrow(
      ctx,
      { x: target.x + target.w, y: target.y + target.h / 2 },
      { x: wrong.x, y: wrong.y + wrong.h / 2 },
      MUSEUM_COLORS.failure
    );
    drawMuseumLabel(ctx, '多应用了一次 M_child', 757, 202, {
      color: MUSEUM_COLORS.failure,
      align: 'center',
      fontSize: 12,
      fontWeight: 700,
    });
  }
}

function drawRestoreView(ctx: CanvasRenderingContext2D, mode: RestoreMode) {
  drawStateStack(ctx, mode);
  drawNextObject(ctx, mode);
  drawMuseumLabel(ctx, '退出子对象后，后续对象不应继续继承 M_child', 480, 388, {
    color: mode === 'leaked' ? MUSEUM_COLORS.failure : MUSEUM_COLORS.current,
    align: 'center',
    fontSize: 14,
    fontWeight: 700,
  });
}

export const CtmNesting: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [ctmState, setCtmState] = useState<CtmState>(INITIAL_STATE);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const stateRef = useRef<CtmState>(ctmState);

  useEffect(() => {
    stateRef.current = ctmState;
    drawRef.current?.();
  }, [ctmState]);

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
      const state = stateRef.current;
      clearMuseumScene(ctx, W, H);
      drawMuseumWall(ctx, W, H, { pedestalY: 368 });
      if (state.view === 'mapping') {
        drawMappingView(ctx, state.mappingStep);
      } else {
        drawRestoreView(ctx, state.restoreMode);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    drawRef.current = draw;
    const disconnect = observeCanvas(canvas, draw, () => {});
    return () => {
      drawRef.current = null;
      disconnect();
    };
  }, []);

  const feedback = ctmState.view === 'mapping'
    ? [
        `先看子对象：同一个点相对它自己的原点是 (${LOCAL_POINT.x}, ${LOCAL_POINT.y})。`,
        `加入子对象偏移 (+${CHILD_OFFSET.x}, +${CHILD_OFFSET.y})：同一个点在父对象中是 (${PARENT_POINT.x}, ${PARENT_POINT.y})。`,
        `再加入父对象偏移 (+${PARENT_OFFSET.x}, +${PARENT_OFFSET.y})：页面坐标是 (${PAGE_POINT.x}, ${PAGE_POINT.y})。点没有移动，变的是参照系。`,
      ][ctmState.mappingStep]
    : ctmState.restoreMode === 'popped'
      ? '已 pop：M_child 被移除，下一个对象只使用自己的图形状态，因此落在目标位置。'
      : ctmState.restoreMode === 'leaked'
        ? '漏掉 pop：M_child 仍在栈顶，下一个对象被多应用一次变换，因此整体偏位。'
        : '绘制子对象时，M_child 位于栈顶；退出前要恢复上一层状态。';

  const feedbackTone = ctmState.view === 'restore'
    ? ctmState.restoreMode === 'popped'
      ? 'good'
      : ctmState.restoreMode === 'leaked'
        ? 'bad'
        : ''
    : ctmState.mappingStep === 2
      ? 'good'
      : '';

  const ariaLabel = ctmState.view === 'mapping'
    ? '嵌套坐标换算示意：同一个点依次以子对象、父对象和页面为参照'
    : '图形状态恢复示意：对比正确弹出子对象状态与漏掉弹出造成的状态泄漏';

  return (
    <div>
      <div className="chip-row" role="tablist" aria-label="选择 CTM 教学视图">
        <button
          type="button"
          role="tab"
          className={`chip ${ctmState.view === 'mapping' ? 'selected' : ''}`}
          aria-selected={ctmState.view === 'mapping'}
          onClick={() => setCtmState((current) => ({ ...current, view: 'mapping' }))}
        >
          坐标逐层换算
        </button>
        <button
          type="button"
          role="tab"
          className={`chip ${ctmState.view === 'restore' ? 'selected' : ''}`}
          aria-selected={ctmState.view === 'restore'}
          onClick={() => setCtmState((current) => ({ ...current, view: 'restore' }))}
        >
          退出后为何要恢复
        </button>
      </div>

      {ctmState.view === 'mapping' ? (
        <div className="step-ctrl" role="group" aria-label="选择坐标换算步骤">
          {([
            ['① 子对象坐标', 0],
            ['② 换到父对象', 1],
            ['③ 换到页面', 2],
          ] as const).map(([label, step]) => (
            <button
              key={step}
              type="button"
              className={`tiny ${ctmState.mappingStep === step ? '' : 'ghost'}`}
              aria-pressed={ctmState.mappingStep === step}
              onClick={() => setCtmState((current) => ({ ...current, mappingStep: step }))}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="step-ctrl" role="group" aria-label="选择退出子对象的方式">
          <button
            type="button"
            className={`tiny ${ctmState.restoreMode === 'popped' ? '' : 'ghost'}`}
            aria-pressed={ctmState.restoreMode === 'popped'}
            onClick={() => setCtmState((current) => ({ ...current, restoreMode: 'popped' }))}
          >
            正确：pop 恢复上一层
          </button>
          <button
            type="button"
            className={`tiny ${ctmState.restoreMode === 'leaked' ? '' : 'ghost'}`}
            aria-pressed={ctmState.restoreMode === 'leaked'}
            onClick={() => setCtmState((current) => ({ ...current, restoreMode: 'leaked' }))}
          >
            反例：漏掉 pop
          </button>
        </div>
      )}

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        className="paper-canvas"
        style={{ width: '100%', height: 'auto' }}
        role="img"
        aria-label={ariaLabel}
      />

      <div className={`feedback ${feedbackTone}`} aria-live="polite">
        {feedback}
      </div>
      <p style={{ margin: '9px 2px 0', color: MUSEUM_COLORS.muted, fontSize: 13 }}>
        CTM 也可以包含缩放和旋转；这里使用纯平移示例，只为看清多层变换的组合顺序。
      </p>
    </div>
  );
};

export default CtmNesting;
