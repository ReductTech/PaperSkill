import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  MUSEUM_COLORS,
  clearMuseumScene,
  drawExhibitFrame,
  drawMuseumLabel,
  drawMuseumWall,
} from './museum-hero';

const W = 960;
const H = 500;
const ANIMATION_MS = 560;

type ShieldStage = 'source' | 'masked' | 'translated' | 'restored';
type FormulaToken = 'Kᵀ' | '√dₖ' | 'softmax' | 'V' | '{v1}';

interface ShieldState {
  stage: ShieldStage;
  activeToken: FormulaToken | null;
}

interface TransitionState {
  from: ShieldStage;
  to: ShieldStage;
  progress: number;
}

interface FormulaMetrics {
  scale: number;
  baseSize: number;
  smallSize: number;
  prefixWidth: number;
  operatorWidth: number;
  openWidth: number;
  fractionWidth: number;
  tailCloseWidth: number;
  valueWidth: number;
  totalWidth: number;
  qWidth: number;
  kWidth: number;
  tWidth: number;
  dWidth: number;
  subKWidth: number;
  radicalLead: number;
}

const INITIAL_STATE: ShieldState = {
  stage: 'source',
  activeToken: null,
};

const STAGE_INDEX: Record<ShieldStage, number> = {
  source: 0,
  masked: 1,
  translated: 2,
  restored: 3,
};

const STAGE_LABELS: ReadonlyArray<{ stage: ShieldStage; short: string; full: string }> = [
  { stage: 'source', short: '1  原式', full: '公式尚未保护' },
  { stage: 'masked', short: '2  {v1}', full: '整体替换为占位符' },
  { stage: 'translated', short: '3  译文字', full: 'LLM 只翻周围文字' },
  { stage: 'restored', short: '4  回插', full: '同一公式结构回到译文' },
] as const;

const TOKEN_DETAILS: ReadonlyArray<{
  token: FormulaToken;
  label: string;
  text: string;
}> = [
  {
    token: 'Kᵀ',
    label: 'Kᵀ',
    text: 'T 是 K 的转置上标；PDF 中的字号差与相对基线位置不能丢。',
  },
  {
    token: '√dₖ',
    label: '√dₖ',
    text: 'k 是 d 的下标；根号横线和分式线都是需要保留的视觉结构。',
  },
  {
    token: 'softmax',
    label: 'softmax',
    text: 'softmax 位于公式区域，是数学算子，不当作普通英文单词交给翻译模型。',
  },
  {
    token: 'V',
    label: 'V',
    text: 'V 是公式中的变量；它与 softmax 输出的相对位置也属于被保护结构。',
  },
  {
    token: '{v1}',
    label: '{v1}',
    text: '{v1} 只在 LLM 阶段代表整条受保护公式；它不是公式译文，也不是让 LLM 重新猜公式。',
  },
] as const;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 10,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
}

function lerp(a: number, b: number, progress: number): number {
  return a + (b - a) * progress;
}

function drawHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  active: boolean,
) {
  if (!active) return;
  roundedRect(ctx, x, y, width, height, 6);
  ctx.fillStyle = 'rgba(124, 58, 237, 0.14)';
  ctx.fill();
  ctx.strokeStyle = MUSEUM_COLORS.auxiliary;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function measureAttentionFormula(
  ctx: CanvasRenderingContext2D,
  maxWidth: number,
): FormulaMetrics {
  const mathFont = '"Cambria Math", "STIX Two Math", Georgia, serif';
  const baseSizeAtOne = 34;
  const smallSizeAtOne = 20;

  const measureAt = (scale: number) => {
    const baseSize = baseSizeAtOne * scale;
    const smallSize = smallSizeAtOne * scale;
    ctx.font = `500 ${baseSize}px ${mathFont}`;
    const prefixWidth = ctx.measureText('Attention(Q, K, V) = ').width;
    ctx.font = `600 ${baseSize}px ${mathFont}`;
    const operatorWidth = ctx.measureText('softmax').width;
    ctx.font = `500 ${baseSize}px ${mathFont}`;
    const openWidth = ctx.measureText('(').width;
    const tailCloseWidth = ctx.measureText(')').width;
    ctx.font = `italic 600 ${baseSize}px ${mathFont}`;
    const qWidth = ctx.measureText('Q').width;
    const kWidth = ctx.measureText('K').width;
    const dWidth = ctx.measureText('d').width;
    const valueWidth = ctx.measureText('V').width;
    ctx.font = `italic 600 ${smallSize}px ${mathFont}`;
    const tWidth = ctx.measureText('T').width;
    const subKWidth = ctx.measureText('k').width;
    const radicalLead = 18 * scale;
    const numeratorWidth = qWidth + kWidth + tWidth * 0.78 + 6 * scale;
    const denominatorWidth = radicalLead + dWidth + subKWidth * 0.8 + 7 * scale;
    const fractionWidth = Math.max(numeratorWidth, denominatorWidth) + 14 * scale;
    const totalWidth =
      prefixWidth + operatorWidth + openWidth + fractionWidth + tailCloseWidth + valueWidth + 8 * scale;
    return {
      scale,
      baseSize,
      smallSize,
      prefixWidth,
      operatorWidth,
      openWidth,
      fractionWidth,
      tailCloseWidth,
      valueWidth,
      totalWidth,
      qWidth,
      kWidth,
      tWidth,
      dWidth,
      subKWidth,
      radicalLead,
    };
  };

  const natural = measureAt(1);
  return measureAt(Math.min(1, maxWidth / natural.totalWidth));
}

function drawAttentionFormula(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxWidth: number,
  activeToken: FormulaToken | null,
  alpha = 1,
) {
  const mathFont = '"Cambria Math", "STIX Two Math", Georgia, serif';
  const metrics = measureAttentionFormula(ctx, maxWidth);
  const {
    scale,
    baseSize,
    smallSize,
    prefixWidth,
    operatorWidth,
    openWidth,
    fractionWidth,
    tailCloseWidth,
    totalWidth,
    qWidth,
    kWidth,
    tWidth,
    dWidth,
    subKWidth,
    radicalLead,
  } = metrics;
  const startX = centerX - totalWidth / 2;
  const baseline = centerY + 8 * scale;
  const numeratorBaseline = centerY - 10 * scale;
  const fractionY = centerY + 1 * scale;
  const denominatorBaseline = centerY + 29 * scale;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = MUSEUM_COLORS.text;

  let cursorX = startX;
  ctx.font = `500 ${baseSize}px ${mathFont}`;
  ctx.fillText('Attention(Q, K, V) = ', cursorX, baseline);
  cursorX += prefixWidth;

  drawHighlight(
    ctx,
    cursorX - 3 * scale,
    baseline - baseSize * 0.86,
    operatorWidth + 6 * scale,
    baseSize * 1.08,
    activeToken === 'softmax',
  );
  ctx.font = `600 ${baseSize}px ${mathFont}`;
  ctx.fillStyle = MUSEUM_COLORS.current;
  ctx.fillText('softmax', cursorX, baseline);
  cursorX += operatorWidth;

  ctx.font = `500 ${baseSize}px ${mathFont}`;
  ctx.fillStyle = MUSEUM_COLORS.text;
  ctx.fillText('(', cursorX, baseline);
  cursorX += openWidth;

  const fractionX = cursorX;
  const numeratorWidth = qWidth + kWidth + tWidth * 0.78 + 6 * scale;
  const numeratorX = fractionX + (fractionWidth - numeratorWidth) / 2;
  const keyX = numeratorX + qWidth;
  drawHighlight(
    ctx,
    keyX - 2 * scale,
    numeratorBaseline - baseSize * 0.78,
    kWidth + tWidth * 0.9 + 5 * scale,
    baseSize * 0.96,
    activeToken === 'Kᵀ',
  );
  ctx.font = `italic 600 ${baseSize}px ${mathFont}`;
  ctx.fillStyle = MUSEUM_COLORS.text;
  ctx.fillText('QK', numeratorX, numeratorBaseline);
  ctx.font = `italic 600 ${smallSize}px ${mathFont}`;
  ctx.fillText('T', keyX + kWidth - 1 * scale, numeratorBaseline - 14 * scale);

  ctx.strokeStyle = MUSEUM_COLORS.text;
  ctx.lineWidth = Math.max(1.5, 2 * scale);
  ctx.beginPath();
  ctx.moveTo(fractionX + 4 * scale, fractionY);
  ctx.lineTo(fractionX + fractionWidth - 4 * scale, fractionY);
  ctx.stroke();

  const denominatorWidth = radicalLead + dWidth + subKWidth * 0.8 + 7 * scale;
  const denominatorX = fractionX + (fractionWidth - denominatorWidth) / 2;
  drawHighlight(
    ctx,
    denominatorX - 3 * scale,
    denominatorBaseline - baseSize * 0.86,
    denominatorWidth + 6 * scale,
    baseSize * 1.13,
    activeToken === '√dₖ',
  );

  const radicalTop = denominatorBaseline - 25 * scale;
  ctx.strokeStyle = MUSEUM_COLORS.text;
  ctx.lineWidth = Math.max(1.5, 2 * scale);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(denominatorX, denominatorBaseline - 8 * scale);
  ctx.lineTo(denominatorX + 5 * scale, denominatorBaseline - 3 * scale);
  ctx.lineTo(denominatorX + 10 * scale, denominatorBaseline - 18 * scale);
  ctx.lineTo(denominatorX + 14 * scale, radicalTop);
  ctx.lineTo(denominatorX + denominatorWidth - 3 * scale, radicalTop);
  ctx.stroke();

  const dX = denominatorX + radicalLead;
  ctx.font = `italic 600 ${baseSize}px ${mathFont}`;
  ctx.fillStyle = MUSEUM_COLORS.text;
  ctx.fillText('d', dX, denominatorBaseline);
  ctx.font = `italic 600 ${smallSize}px ${mathFont}`;
  ctx.fillText('k', dX + dWidth, denominatorBaseline + 8 * scale);

  cursorX += fractionWidth;
  ctx.font = `500 ${baseSize}px ${mathFont}`;
  ctx.fillStyle = MUSEUM_COLORS.text;
  ctx.fillText(')', cursorX, baseline);
  cursorX += tailCloseWidth + 5 * scale;

  drawHighlight(
    ctx,
    cursorX - 3 * scale,
    baseline - baseSize * 0.86,
    metrics.valueWidth + 6 * scale,
    baseSize * 1.08,
    activeToken === 'V',
  );
  ctx.font = `italic 600 ${baseSize}px ${mathFont}`;
  ctx.fillStyle = MUSEUM_COLORS.text;
  ctx.fillText('V', cursorX, baseline);
  ctx.restore();
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  activeToken: FormulaToken | null,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  roundedRect(ctx, x - 61, y - 34, 122, 68, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = activeToken === '{v1}' ? MUSEUM_COLORS.auxiliary : MUSEUM_COLORS.current;
  ctx.lineWidth = activeToken === '{v1}' ? 4 : 3;
  ctx.stroke();
  ctx.fillStyle = activeToken === '{v1}' ? MUSEUM_COLORS.auxiliary : MUSEUM_COLORS.current;
  ctx.font = '800 28px "Cambria Math", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('{v1}', x, y);
  ctx.restore();
}

function drawLead(
  ctx: CanvasRenderingContext2D,
  language: 'en' | 'zh',
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = MUSEUM_COLORS.muted;
  ctx.font = '700 15px system-ui, "PingFang SC", sans-serif';
  ctx.fillText(language === 'en' ? '待翻译文字' : '已翻译文字', 58, 132);
  ctx.fillStyle = MUSEUM_COLORS.text;
  ctx.font = '700 23px system-ui, "PingFang SC", sans-serif';
  ctx.fillText(
    language === 'en'
      ? 'Scaled dot-product attention is computed as'
      : '缩放点积注意力计算为',
    58,
    169,
  );
  ctx.restore();
}

function drawStageTracker(ctx: CanvasRenderingContext2D, stage: ShieldStage) {
  const activeIndex = STAGE_INDEX[stage];
  STAGE_LABELS.forEach((item, index) => {
    const x = 32 + index * 232;
    const isCurrent = index === activeIndex;
    const isPast = index < activeIndex;
    drawExhibitFrame(ctx, x, 420, 200, 52, {
      stroke: isCurrent
        ? MUSEUM_COLORS.current
        : isPast
          ? MUSEUM_COLORS.success
          : MUSEUM_COLORS.border,
      fill: '#ffffff',
      lineWidth: isCurrent ? 3 : 1.5,
      radius: 8,
    });
    drawMuseumLabel(ctx, item.short, x + 100, 441, {
      color: isCurrent
        ? MUSEUM_COLORS.current
        : isPast
          ? MUSEUM_COLORS.success
          : MUSEUM_COLORS.muted,
      fontSize: 14,
      fontWeight: 800,
      align: 'center',
    });
    drawMuseumLabel(ctx, item.full, x + 100, 459, {
      color: MUSEUM_COLORS.muted,
      fontSize: 11,
      align: 'center',
    });
    if (index < STAGE_LABELS.length - 1) {
      ctx.save();
      ctx.strokeStyle = index < activeIndex ? MUSEUM_COLORS.success : MUSEUM_COLORS.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 202, 446);
      ctx.lineTo(x + 226, 446);
      ctx.lineTo(x + 219, 441);
      ctx.moveTo(x + 226, 446);
      ctx.lineTo(x + 219, 451);
      ctx.stroke();
      ctx.restore();
    }
  });
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  state: ShieldState,
  transition?: TransitionState,
) {
  clearMuseumScene(ctx, W, H);
  drawMuseumWall(ctx, W, H, { pedestalY: 398 });

  roundedRect(ctx, 28, 16, 416, 30, 15);
  ctx.fillStyle = 'rgba(124, 58, 237, 0.10)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawMuseumLabel(ctx, '教学示例 · 经典 scaled dot-product attention · 非论文原式', 44, 32, {
    color: MUSEUM_COLORS.auxiliary,
    fontSize: 14,
    fontWeight: 800,
  });
  drawMuseumLabel(ctx, `当前：${STAGE_LABELS[STAGE_INDEX[state.stage]].full}`, 930, 32, {
    color: MUSEUM_COLORS.current,
    fontSize: 14,
    fontWeight: 700,
    align: 'right',
  });

  drawExhibitFrame(ctx, 28, 58, 560, 318, {
    stroke: MUSEUM_COLORS.current,
    fill: 'rgba(255,255,255,0.48)',
    lineWidth: 2,
    radius: 12,
  });
  drawExhibitFrame(ctx, 612, 58, 320, 318, {
    stroke: MUSEUM_COLORS.auxiliary,
    fill: 'rgba(255,255,255,0.48)',
    lineWidth: 2,
    radius: 12,
  });
  drawMuseumLabel(ctx, 'LLM 输入句', 52, 90, {
    color: MUSEUM_COLORS.current,
    fontSize: 18,
    fontWeight: 800,
  });
  drawMuseumLabel(ctx, 'IR 公式保留区', 636, 90, {
    color: MUSEUM_COLORS.auxiliary,
    fontSize: 18,
    fontWeight: 800,
  });

  const from = transition?.from ?? state.stage;
  const to = transition?.to ?? state.stage;
  const progress = transition?.progress ?? 1;
  const isTranslationTransition = from === 'masked' && to === 'translated';
  const displayEnglish = state.stage === 'source' || state.stage === 'masked';

  if (isTranslationTransition) {
    drawLead(ctx, 'en', 1 - progress);
    drawLead(ctx, 'zh', progress);
  } else {
    drawLead(ctx, displayEnglish ? 'en' : 'zh', 1);
  }

  let formulaX = 308;
  let formulaY = 246;
  let formulaMaxWidth = 500;
  let showFormula = true;
  let placeholderAlpha = 0;
  let formulaIsInVault = false;

  if (transition && from === 'source' && to === 'masked') {
    formulaX = lerp(308, 772, progress);
    formulaY = lerp(246, 214, progress);
    formulaMaxWidth = lerp(500, 280, progress);
    placeholderAlpha = progress;
    formulaIsInVault = progress > 0.62;
  } else if (transition && from === 'translated' && to === 'restored') {
    formulaX = lerp(772, 308, progress);
    formulaY = lerp(214, 246, progress);
    formulaMaxWidth = lerp(280, 500, progress);
    placeholderAlpha = 1 - progress;
    formulaIsInVault = progress < 0.38;
  } else if (state.stage === 'masked' || state.stage === 'translated') {
    formulaX = 772;
    formulaY = 214;
    formulaMaxWidth = 280;
    placeholderAlpha = 1;
    formulaIsInVault = true;
  } else if (state.stage === 'restored') {
    formulaX = 308;
    formulaY = 246;
    formulaMaxWidth = 500;
  } else if (state.stage !== 'source') {
    showFormula = false;
  }

  if (placeholderAlpha > 0.01) {
    drawPlaceholder(ctx, 308, 250, state.activeToken, placeholderAlpha);
    drawMuseumLabel(ctx, 'LLM 只看见这个稳定身份', 308, 306, {
      color: MUSEUM_COLORS.current,
      fontSize: 14,
      fontWeight: 700,
      align: 'center',
    });
  }

  if (showFormula) {
    drawAttentionFormula(
      ctx,
      formulaX,
      formulaY,
      formulaMaxWidth,
      state.activeToken,
    );
  }

  if (state.stage === 'source' && !transition) {
    drawMuseumLabel(ctx, '若直接翻译：上标、下标与矢量结构可能被改写', 308, 333, {
      color: MUSEUM_COLORS.failure,
      fontSize: 14,
      fontWeight: 700,
      align: 'center',
    });
  }

  const vaultOccupied =
    state.stage === 'masked' ||
    state.stage === 'translated' ||
    formulaIsInVault;
  if (!vaultOccupied && state.stage !== 'restored') {
    drawExhibitFrame(ctx, 650, 128, 244, 170, {
      stroke: MUSEUM_COLORS.border,
      fill: 'rgba(255,255,255,0.24)',
      lineWidth: 1.5,
      radius: 10,
      dashed: true,
    });
    drawMuseumLabel(ctx, '公式尚未进入 IR', 772, 215, {
      color: MUSEUM_COLORS.muted,
      fontSize: 17,
      fontWeight: 700,
      align: 'center',
    });
  }

  if (vaultOccupied) {
    roundedRect(ctx, 839, 108, 65, 26, 13);
    ctx.fillStyle = 'rgba(124, 58, 237, 0.12)';
    ctx.fill();
    drawMuseumLabel(ctx, '已保留', 871, 122, {
      color: MUSEUM_COLORS.auxiliary,
      fontSize: 12,
      fontWeight: 800,
      align: 'center',
    });
  } else if (state.stage === 'restored') {
    drawMuseumLabel(ctx, '✓', 772, 203, {
      color: MUSEUM_COLORS.success,
      fontSize: 44,
      fontWeight: 800,
      align: 'center',
    });
    drawMuseumLabel(ctx, '同一结构已回插', 772, 245, {
      color: MUSEUM_COLORS.success,
      fontSize: 17,
      fontWeight: 800,
      align: 'center',
    });
  }

  drawMuseumLabel(ctx, '保留：字符几何 · 基线偏移 · 矢量信息', 772, 326, {
    color: MUSEUM_COLORS.auxiliary,
    fontSize: 14,
    fontWeight: 700,
    align: 'center',
  });
  drawMuseumLabel(ctx, '不等于理解公式语义或恢复 LaTeX AST', 772, 350, {
    color: MUSEUM_COLORS.muted,
    fontSize: 13,
    align: 'center',
  });

  drawStageTracker(ctx, state.stage);
}

function stageFeedback(stage: ShieldStage) {
  if (stage === 'source') {
    return {
      cls: 'bad',
      text: '公式仍在 LLM 输入句中：若当作普通文本改写，上标、下标、分式和根号的结构存在损坏风险。',
    };
  }
  if (stage === 'masked') {
    return {
      cls: '',
      text: '保护完成：LLM 输入句中只剩 {v1}；原公式的字符几何、基线偏移与矢量信息仍留在 IR 保留区。',
    };
  }
  if (stage === 'translated') {
    return {
      cls: '',
      text: '英文已变为中文，{v1} 没有改变；LLM 没有翻译、重排或猜测公式。',
    };
  }
  return {
    cls: 'good',
    text: '恢复完成：同一条 Attention 公式按保留的几何与矢量信息回插到中文句子中。',
  };
}

export const FormulaShield: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const stateRef = useRef<ShieldState>(INITIAL_STATE);
  const [shieldState, setShieldState] = useState<ShieldState>(INITIAL_STATE);

  const feedback = useMemo(() => stageFeedback(shieldState.stage), [shieldState.stage]);
  const activeDetail = useMemo(
    () => TOKEN_DETAILS.find((item) => item.token === shieldState.activeToken) ?? null,
    [shieldState.activeToken],
  );

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const commit = useCallback((next: ShieldState) => {
    stateRef.current = next;
    setShieldState(next);
  }, []);

  const drawCurrent = useCallback((next: ShieldState) => {
    if (ctxRef.current && visibleRef.current) drawScene(ctxRef.current, next);
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
    reducedMotionRef.current =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    drawScene(ctx, stateRef.current);
    canvas.classList.add('is-ready');

    const disconnect = observeCanvas(
      canvas,
      () => {
        visibleRef.current = true;
        drawScene(ctx, stateRef.current);
      },
      () => {
        visibleRef.current = false;
        stopAnimation();
      },
    );
    return () => {
      stopAnimation();
      disconnect();
    };
  }, [stopAnimation]);

  const moveToStage = useCallback(
    (nextStage: ShieldStage) => {
      const previous = stateRef.current;
      const next: ShieldState = { ...previous, stage: nextStage };
      stopAnimation();
      commit(next);

      const ctx = ctxRef.current;
      if (!ctx || !visibleRef.current || reducedMotionRef.current) {
        if (ctx && visibleRef.current) drawScene(ctx, next);
        return;
      }

      const startTime = performance.now();
      const tick = (now: number) => {
        const linearProgress = Math.min(1, (now - startTime) / ANIMATION_MS);
        const progress = easeInOutQuad(linearProgress);
        drawScene(ctx, next, {
          from: previous.stage,
          to: nextStage,
          progress,
        });
        if (linearProgress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          drawScene(ctx, next);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [commit, stopAnimation],
  );

  const selectToken = useCallback(
    (token: FormulaToken) => {
      stopAnimation();
      const previous = stateRef.current;
      const next: ShieldState = {
        ...previous,
        activeToken: previous.activeToken === token ? null : token,
      };
      commit(next);
      drawCurrent(next);
    },
    [commit, drawCurrent, stopAnimation],
  );

  const reset = useCallback(() => {
    stopAnimation();
    commit(INITIAL_STATE);
    drawCurrent(INITIAL_STATE);
  }, [commit, drawCurrent, stopAnimation]);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        className="paper-canvas"
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
        aria-label="教学示例：经典 scaled dot-product attention 公式先整体进入 IR 公式保留区，LLM 输入只留下占位符，翻译周围文字后再把同一公式结构回插；该公式不是 BabelDOC 论文原式"
      />

      <div className="ctrl" role="group" aria-label="公式保护的三个步骤">
        <button
          className="tiny"
          type="button"
          onClick={() => moveToStage('masked')}
          disabled={shieldState.stage !== 'source'}
        >
          ① 保护公式
        </button>
        <button
          className="tiny"
          type="button"
          onClick={() => moveToStage('translated')}
          disabled={shieldState.stage !== 'masked'}
        >
          ② 翻译周围文字
        </button>
        <button
          className="tiny"
          type="button"
          onClick={() => moveToStage('restored')}
          disabled={shieldState.stage !== 'translated'}
        >
          ③ 恢复公式
        </button>
        <button className="tiny ghost" type="button" onClick={reset}>
          重置
        </button>
      </div>

      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>

      <p style={{ margin: '12px 0 8px', color: MUSEUM_COLORS.muted, fontSize: 14 }}>
        点击公式片段，查看它为什么不该进入自由翻译：
      </p>
      <div className="chip-row" role="group" aria-label="Attention 公式结构说明">
        {TOKEN_DETAILS.map((item) => (
          <button
            key={item.token}
            className={`chip ${shieldState.activeToken === item.token ? 'selected' : ''}`}
            type="button"
            onClick={() => selectToken(item.token)}
            aria-pressed={shieldState.activeToken === item.token}
          >
            {item.label}
          </button>
        ))}
      </div>
      {activeDetail ? (
        <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.auxiliary }} aria-live="polite">
          <b>{activeDetail.label}</b>：{activeDetail.text}
        </div>
      ) : null}

      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.support }}>
        BabelDOC 论文第 3 页 §3.2 描述的是通用公式遮罩与矢量重建机制；这里借经典 scaled dot-product attention
        公式展示上标、下标、分式和根号为何需要整体保护。
      </div>
      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.emphasis }}>
        适用边界：这一教学示意不表示 BabelDOC 理解 Q、K、V 的数学语义，也不表示它恢复 LaTeX AST；上游 IR
        若已漏掉或误判公式结构，占位符不能凭空修复。
      </div>
    </div>
  );
};

export default FormulaShield;
