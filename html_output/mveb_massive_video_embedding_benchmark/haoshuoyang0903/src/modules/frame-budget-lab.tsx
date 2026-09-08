import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const MODULE_W = 560;
const MODULE_H = 240;
const ANALOGY_W = 244;
const ANALOGY_H = 130;

const C = {
  field: '#f5f8f0',
  wall: '#b8c9a7',
  contour: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

const FRAME_VALUES = [1, 8, 16, 32, 64] as const;
type FrameCount = (typeof FRAME_VALUES)[number];
type TaskCase = 'aggregate' | 'breakfast' | 'vatexT2VA' | 'omniVideoBench' | 'worldSense1Min';
type Judgment = 'none' | 'subsetCeiling' | 'universalOptimum';
type TrendKind = 'aggregate' | 'steep' | 'flat';
type FrameState = { frameCount: FrameCount; taskCase: TaskCase; judgment: Judgment };

const CASE_ORDER: TaskCase[] = ['aggregate', 'breakfast', 'vatexT2VA', 'omniVideoBench', 'worldSense1Min'];
const CASES: Record<TaskCase, {
  chip: string;
  canvasTab: string;
  protocol: string;
  trend: TrendKind;
  start: number | null;
  end: number | null;
}> = {
  aggregate: {
    chip: '总体趋势',
    canvasTab: '总体',
    protocol: '7 个长视频任务 · 各自原生指标的聚合趋势',
    trend: 'aggregate',
    start: null,
    end: null,
  },
  breakfast: {
    chip: 'Breakfast 分类',
    canvasTab: '早餐',
    protocol: 'Breakfast 分类 · 准确率 ↑',
    trend: 'steep',
    start: 15.88,
    end: 45.35,
  },
  vatexT2VA: {
    chip: 'VATEX T→VA',
    canvasTab: 'VATEX',
    protocol: 'VATEX T→VA 检索 · nDCG@10 ↑',
    trend: 'steep',
    start: 38.24,
    end: 76.03,
  },
  omniVideoBench: {
    chip: 'OmniVideoBench 问答',
    canvasTab: 'Omni问答',
    protocol: 'OmniVideoBench 问答 · 准确率 ↑',
    trend: 'flat',
    start: 25.85,
    end: 26.68,
  },
  worldSense1Min: {
    chip: 'WorldSense-1min 问答',
    canvasTab: 'World问答',
    protocol: 'WorldSense-1min 问答 · 准确率 ↑',
    trend: 'flat',
    start: 28.42,
    end: 30.60,
  },
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke = C.border,
  lineWidth = 1,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function clearGallery(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.field;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.wall;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.globalAlpha = 1;
}

function drawVisitor(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(0, -14 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  roundedRect(ctx, -11 * scale, -4 * scale, 22 * scale, 27 * scale, 9 * scale, C.blue, C.blue, 2);
  ctx.restore();
}

function drawExhibit(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  roundedRect(ctx, x, y, w, h, 5, '#fffdf7', C.route, 2);
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 9, y + h - 13);
  ctx.lineTo(x + w * 0.42, y + h * 0.4);
  ctx.lineTo(x + w - 9, y + h - 13);
  ctx.stroke();
}

function drawClueCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  roundedRect(ctx, x, y, w, h, 5, C.white, C.route, 2);
}

function drawGuidePath(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color = C.blue,
  width = 3,
  dashed = false,
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.stroke();
  ctx.restore();
}

function drawVerificationSeal(ctx: CanvasRenderingContext2D, x: number, y: number, r = 10) {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y);
  ctx.lineTo(x - r * 0.1, y + r * 0.4);
  ctx.lineTo(x + r * 0.58, y - r * 0.42);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.text,
  align: CanvasTextAlign = 'left',
  size = 12,
) {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ color: string; label: string }>,
  x: number,
  y: number,
) {
  let cursor = x;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  items.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(cursor, y - 4, 9, 8);
    ctx.fillStyle = C.muted;
    ctx.fillText(item.label, cursor + 13, y);
    cursor += 13 + ctx.measureText(item.label).width + 10;
  });
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, r = 10) {
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - r, y - r);
  ctx.lineTo(x + r, y + r);
  ctx.moveTo(x + r, y - r);
  ctx.lineTo(x - r, y + r);
  ctx.stroke();
}

function drawFlipbookStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  visibleLeaves: number,
  scale = 1,
) {
  for (let i = visibleLeaves - 1; i >= 0; i -= 1) {
    drawClueCard(ctx, x + i * 4 * scale, y - i * 3 * scale, 54 * scale, 42 * scale);
    ctx.strokeStyle = C.contour;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 9 * scale + i * 4 * scale, y + 28 * scale - i * 3 * scale);
    ctx.lineTo(x + 42 * scale + i * 4 * scale, y + 13 * scale - i * 3 * scale);
    ctx.stroke();
  }
}

function drawAnalogy(ctx: CanvasRenderingContext2D, elapsed: number, reducedMotion: boolean) {
  clearGallery(ctx, ANALOGY_W, ANALOGY_H);
  drawExhibit(ctx, 16, 21, 76, 74);
  drawVisitor(ctx, 205, 84, 0.92);
  const progress = reducedMotion ? 1 : clamp((elapsed - 300) / 850, 0, 1);
  const leaves = 1 + Math.floor(progress * 3.99);
  drawFlipbookStack(ctx, 105, 48, leaves, 0.94);
  drawGuidePath(ctx, [[192, 74], [167, 58], [158, 50]], C.blue, 3);
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(163, 48, 13, -0.4, 1.45);
  ctx.stroke();
  if (reducedMotion || elapsed >= 1150) {
    drawGuidePath(ctx, [[103, 74], [91, 61]], C.blue, 3);
    drawVerificationSeal(ctx, 83, 21, 9);
  }
  drawSceneLabel(ctx, '1 帧', 22, 14, C.red);
  drawSceneLabel(ctx, '32 帧后', 221, 14, C.orange, 'right');
}

function frameIndex(frameCount: FrameCount) {
  return FRAME_VALUES.indexOf(frameCount);
}

function evidenceAt(taskCase: TaskCase, frameCount: FrameCount): string {
  if (taskCase === 'aggregate') {
    if (frameCount === 1) return '基线';
    if (frameCount === 8) return '较 1 帧 +43.7%（相对）';
    if (frameCount === 16) return '正文未列单点值';
    if (frameCount === 32) return '研究子集的合理上限';
    return '较 32 帧 +2.2（绝对点）';
  }
  const data = CASES[taskCase];
  if (frameCount === 1) return data.start?.toFixed(2) ?? '';
  if (frameCount === 64) return data.end?.toFixed(2) ?? '';
  return '正文未逐点列值';
}

function qualitativeY(taskCase: TaskCase, index: number) {
  const kind = CASES[taskCase].trend;
  const profiles: Record<TrendKind, number[]> = {
    aggregate: [0.14, 0.55, 0.69, 0.79, 0.83],
    steep: [0.18, 0.46, 0.63, 0.78, 0.88],
    flat: [0.49, 0.5, 0.51, 0.52, 0.53],
  };
  return 180 - profiles[kind][index] * 108;
}

function drawTrendCurve(ctx: CanvasRenderingContext2D, taskCase: TaskCase, xs: number[]) {
  const dashed = taskCase !== 'aggregate';
  const points = xs.map((x, index) => [x, qualitativeY(taskCase, index)] as [number, number]);
  drawGuidePath(ctx, points, taskCase === 'aggregate' ? C.blue : C.purple, 3, dashed);
  points.forEach(([x, y], index) => {
    const known = taskCase === 'aggregate' ? index === 0 || index === 1 || index === 3 || index === 4 : index === 0 || index === 4;
    ctx.fillStyle = known ? C.white : C.field;
    ctx.strokeStyle = known ? C.purple : C.muted;
    ctx.lineWidth = known ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.arc(x, y, known ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!known) drawSceneLabel(ctx, '?', x, y - 11, C.muted, 'center', 9);
  });
}

function drawModule(ctx: CanvasRenderingContext2D, state: FrameState) {
  clearGallery(ctx, MODULE_W, MODULE_H);
  const tabW = 104;
  CASE_ORDER.forEach((taskCase, index) => {
    const x = 12 + index * 107;
    const selected = state.taskCase === taskCase;
    roundedRect(ctx, x, 8, tabW, 24, 6, selected ? C.blue : C.white, selected ? C.blue : C.border, selected ? 2 : 1);
    drawSceneLabel(ctx, CASES[taskCase].canvasTab, x + tabW / 2, 20, selected ? C.white : C.muted, 'center', 9);
  });

  roundedRect(ctx, 12, 38, 150, 186, 9, 'rgba(255,255,255,0.88)');
  roundedRect(ctx, 174, 38, 242, 186, 9, 'rgba(255,255,255,0.9)');
  roundedRect(ctx, 428, 38, 120, 186, 9, 'rgba(255,255,255,0.88)');

  drawSceneLabel(ctx, `帧预算 N=${state.frameCount}`, 87, 55, C.orange, 'center', 12);
  ctx.save();
  ctx.globalAlpha = 0.42;
  drawExhibit(ctx, 24, 70, 54, 54);
  ctx.restore();
  drawVisitor(ctx, 137, 112, 0.75);
  drawFlipbookStack(ctx, 74, 91, frameIndex(state.frameCount) + 1, 0.74);
  drawGuidePath(ctx, [[132, 102], [116, 94]], C.blue, 2);
  const budgetColor = state.frameCount === 1 ? C.red : state.frameCount <= 16 ? C.blue : C.orange;
  roundedRect(ctx, 24, 163, 126, 34, 7, C.white, budgetColor, 2);
  drawSceneLabel(
    ctx,
    state.frameCount === 1 ? '空间快照' : state.frameCount <= 16 ? '主要增益区' : '平均平台区',
    87,
    180,
    budgetColor,
    'center',
    10,
  );
  drawSceneLabel(ctx, `${frameIndex(state.frameCount) + 1} 张示意页`, 87, 211, C.muted, 'center', 9);

  drawSceneLabel(ctx, CASES[state.taskCase].protocol, 295, 53, C.text, 'center', 9);
  const xs = FRAME_VALUES.map((_, index) => 193 + index * 50);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(193, 188);
  ctx.lineTo(393, 188);
  ctx.stroke();
  drawTrendCurve(ctx, state.taskCase, xs);
  xs.forEach((x, index) => {
    drawSceneLabel(ctx, String(FRAME_VALUES[index]), x, 204, FRAME_VALUES[index] === state.frameCount ? C.orange : C.muted, 'center', 9);
  });
  const selectedIndex = frameIndex(state.frameCount);
  const selectedX = xs[selectedIndex];
  ctx.strokeStyle = budgetColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(selectedX, 64);
  ctx.lineTo(selectedX, 188);
  ctx.stroke();
  ctx.fillStyle = budgetColor;
  ctx.beginPath();
  ctx.arc(selectedX, qualitativeY(state.taskCase, selectedIndex), 6, 0, Math.PI * 2);
  ctx.fill();
  drawSceneLabel(ctx, '虚线只示趋势，不反推中间数值', 295, 217, C.muted, 'center', 8);

  drawSceneLabel(ctx, '当前证据', 488, 55, C.muted, 'center', 10);
  const evidence = evidenceAt(state.taskCase, state.frameCount);
  const evidenceLines = evidence.length > 13 ? [evidence.slice(0, 13), evidence.slice(13)] : [evidence];
  evidenceLines.forEach((line, index) => drawSceneLabel(ctx, line, 488, 79 + index * 17, C.purple, 'center', 9));
  drawSceneLabel(ctx, '7 个长视频任务', 488, 126, C.text, 'center', 9);
  drawSceneLabel(ctx, '5 个兼容模型', 488, 145, C.text, 'center', 9);
  drawSceneLabel(ctx, '其他输入固定', 488, 171, C.blue, 'center', 9);
  drawSceneLabel(ctx, '固定长度模型排除', 488, 192, C.red, 'center', 8);
  if (state.judgment === 'subsetCeiling') drawVerificationSeal(ctx, 528, 211, 9);
  if (state.judgment === 'universalOptimum') drawCross(ctx, 528, 211, 8);
  drawLegend(ctx, [
    { color: C.red, label: '单帧警告' },
    { color: C.blue, label: '多帧收益' },
    { color: C.orange, label: '回报趋缓' },
  ], 187, 231);
}

function feedbackFor(state: FrameState): { tone: 'red' | 'blue' | 'orange' | 'green'; text: string } {
  if (state.judgment === 'subsetCeiling') {
    return { tone: 'green', text: '绿｜判断成立：32 帧只是在这 7 个长视频任务、5 个兼容模型上的合理评测上限，不是通用最优值。' };
  }
  if (state.judgment === 'universalOptimum') {
    return { tone: 'red', text: '红｜判断不成立：任务曲线差异明显，固定长度模型也未参加扫参；不能把 32 帧外推为所有任务的最优值。' };
  }
  if (state.frameCount === 1) {
    const messages: Record<TaskCase, { tone: 'red' | 'blue'; text: string }> = {
      aggregate: { tone: 'red', text: '红｜1 帧只是空间快照；本实验把它当作时序上下文的基线。' },
      breakfast: { tone: 'red', text: '红｜Breakfast：1 帧准确率为 15.88，到 64 帧为 45.35；单帧明显漏掉了时序线索。' },
      vatexT2VA: { tone: 'red', text: '红｜VATEX T→VA：1 帧 nDCG@10 为 38.24，到 64 帧为 76.03；单帧明显不足。' },
      omniVideoBench: { tone: 'blue', text: '蓝｜OmniVideoBench 问答从 1 帧 25.85 到 64 帧 26.68；在这次实验中，加帧影响很小。' },
      worldSense1Min: { tone: 'blue', text: '蓝｜WorldSense-1min 问答从 1 帧 28.42 到 64 帧 30.60；在这次实验中，加帧影响较小。' },
    };
    return messages[state.taskCase];
  }
  if (state.frameCount === 8) {
    return state.taskCase === 'aggregate'
      ? { tone: 'blue', text: '蓝｜主要收益出现在早期：总体从 1 帧到 8 帧相对提升 43.7%。' }
      : { tone: 'blue', text: '蓝｜已进入多帧区间；该任务的 8 帧单点值未在文字证据中逐项列出，因此这里只标趋势。' };
  }
  if (state.frameCount === 16) {
    return { tone: 'blue', text: '蓝｜继续增加时间上下文；论文文字证据未逐点列出 16 帧数值，因此不补造分数。' };
  }
  if (state.frameCount === 32) {
    return { tone: 'orange', text: '橙｜32 帧是论文对这组长视频任务给出的合理上限判断；它不是所有任务的最优值。' };
  }
  const at64: Record<TaskCase, string> = {
    aggregate: '橙｜进入平均回报趋缓区：从 32 帧到 64 帧只增加 2.2 个绝对点；是否继续要看任务与成本。',
    breakfast: '橙｜Breakfast 到 64 帧为 45.35；论文未单列 32→64 的任务增量，不能宣称它在 32 帧后完全无收益。',
    vatexT2VA: '橙｜VATEX T→VA 到 64 帧为 76.03；论文未单列 32→64 的任务增量，不能宣称它在 32 帧后完全无收益。',
    omniVideoBench: '橙｜OmniVideoBench 问答到 64 帧为 26.68；从 1 帧起总变化很小，说明任务曲线并不一致。',
    worldSense1Min: '橙｜WorldSense-1min 问答到 64 帧为 30.60；从 1 帧起总变化较小，说明任务曲线并不一致。',
  };
  return { tone: 'orange', text: at64[state.taskCase] };
}

const groupLabelStyle: React.CSSProperties = { color: C.muted, fontWeight: 700, fontSize: 14 };
const boundaryStyle: React.CSSProperties = {
  marginTop: 10,
  padding: '9px 12px',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.muted,
  fontSize: 14,
  lineHeight: 1.6,
  background: '#fff',
};

export const FrameBudgetLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAnalogy = moduleId === 'ana';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<FrameState>({ frameCount: 1, taskCase: 'aggregate', judgment: 'none' });
  const [state, setState] = useState<FrameState>(stateRef.current);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = isAnalogy ? ANALOGY_W : MODULE_W;
    const h = isAnalogy ? ANALOGY_H : MODULE_H;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, w, h);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = `${w}px`;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let startTime = performance.now();
    const tick = (now: number) => {
      if (isAnalogy) drawAnalogy(ctx, reducedMotion ? 1500 : (now - startTime) % 3000, reducedMotion);
      else drawModule(ctx, stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) {
        startTime = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [isAnalogy]);

  const chooseTask = (taskCase: TaskCase) => {
    setState((prev) => ({ ...prev, taskCase, judgment: 'none' }));
  };

  const chooseFrameIndex = (index: number) => {
    const safeIndex = Math.round(clamp(index, 0, FRAME_VALUES.length - 1));
    setState((prev) => ({ ...prev, frameCount: FRAME_VALUES[safeIndex], judgment: 'none' }));
  };

  const onCanvasPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAnalogy) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (MODULE_W / rect.width);
    const y = (event.clientY - rect.top) * (MODULE_H / rect.height);
    if (y >= 8 && y <= 32 && x >= 12 && x <= 547) {
      const index = Math.floor((x - 12) / 107);
      if (index >= 0 && index < CASE_ORDER.length) chooseTask(CASE_ORDER[index]);
      return;
    }
    if (x >= 181 && x <= 405 && y >= 60 && y <= 216) {
      chooseFrameIndex((x - 193) / 50);
    }
  };

  const onTaskKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + delta + CASE_ORDER.length) % CASE_ORDER.length;
    document.getElementById(`frame-budget-lab-task-${CASE_ORDER[next]}`)?.focus();
  };

  const feedback = feedbackFor(state);
  const feedbackStyle: React.CSSProperties | undefined = feedback.tone === 'orange'
    ? { color: C.orange, background: '#fff7ed', borderLeftColor: C.orange, fontStyle: 'normal' }
    : undefined;
  const evidence = evidenceAt(state.taskCase, state.frameCount);
  const canvasLabel = isAnalogy
    ? '一名访客翻动同一本视频翻页卡，用更多连续画面识别事件，最后的翻页速度变慢表示收益递减。'
    : `当前查看${CASES[state.taskCase].chip}，帧预算 ${state.frameCount}；${CASES[state.taskCase].protocol}；${typeof evidence === 'string' ? evidence : String(evidence)}。`;

  if (isAnalogy) {
    return (
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={ANALOGY_W}
        height={ANALOGY_H}
        role="img"
        aria-label={canvasLabel}
      />
    );
  }

  return (
    <div>
      <div className="chip-row" id="frame-budget-lab-task-case" role="group" aria-label="选择观察对象">
        <span style={groupLabelStyle}>选择观察对象</span>
        {CASE_ORDER.map((taskCase, index) => (
          <button
            key={taskCase}
            id={`frame-budget-lab-task-${taskCase}`}
            type="button"
            className={`chip ${state.taskCase === taskCase ? 'selected' : ''}`}
            aria-pressed={state.taskCase === taskCase}
            onClick={() => chooseTask(taskCase)}
            onKeyDown={(event) => onTaskKeyDown(event, index)}
          >
            {CASES[taskCase].chip}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label htmlFor="frame-budget-lab-frame-count">
          帧预算 N <span className="val">{state.frameCount} 帧</span>
        </label>
        <input
          id="frame-budget-lab-frame-count"
          type="range"
          min={0}
          max={4}
          step={1}
          value={frameIndex(state.frameCount)}
          aria-valuetext={`${state.frameCount} 帧`}
          onChange={(event) => chooseFrameIndex(Number(event.target.value))}
        />
        <span style={{ color: C.muted, fontSize: 13 }}>1 · 8 · 16 · 32 · 64</span>
        <button
          id="frame-budget-lab-reset"
          type="button"
          className="tiny ghost"
          disabled={state.frameCount === 1 && state.taskCase === 'aggregate' && state.judgment === 'none'}
          onClick={() => setState({ frameCount: 1, taskCase: 'aggregate', judgment: 'none' })}
        >
          回到 1 帧总体趋势
        </button>
      </div>
      <div className="chip-row" id="frame-budget-lab-judgment" role="group" aria-label="你会如何下结论">
        <span style={groupLabelStyle}>你会如何下结论？</span>
        <button
          type="button"
          className={`chip ${state.judgment === 'subsetCeiling' ? 'selected' : ''}`}
          aria-pressed={state.judgment === 'subsetCeiling'}
          onClick={() => setState((prev) => ({ ...prev, judgment: 'subsetCeiling' }))}
        >
          子集中的合理上限
        </button>
        <button
          type="button"
          className={`chip ${state.judgment === 'universalOptimum' ? 'selected' : ''}`}
          aria-pressed={state.judgment === 'universalOptimum'}
          onClick={() => setState((prev) => ({ ...prev, judgment: 'universalOptimum' }))}
        >
          所有任务的最优值
        </button>
      </div>
      <div className="ctrl">
        <button id="frame-budget-lab-fixed-model" type="button" className="tiny ghost" disabled>
          固定长度模型
        </button>
        <span style={{ color: C.red, fontSize: 13 }}>位置嵌入绑定单一帧数，论文未纳入这次扫参。</span>
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={MODULE_W}
        height={MODULE_H}
        role="img"
        aria-label={canvasLabel}
        onPointerDown={onCanvasPointer}
        style={{ touchAction: 'manipulation' }}
      />
      <div
        className={`feedback ${feedback.tone === 'green' ? 'good' : feedback.tone === 'red' ? 'bad' : ''}`}
        style={feedbackStyle}
        role="status"
        aria-live="polite"
      >
        {feedback.text}
      </div>
      <div style={boundaryStyle}>
        <strong>判断边界：</strong>结论只适用于 7 个平均时长超过 15 秒的任务、5 个兼容模型，并要求均匀采样且其他输入固定。虚线中间点不是数值证据；32 帧不是固定长度模型或所有任务的通用最优值。
      </div>
    </div>
  );
};

export default FrameBudgetLab;
