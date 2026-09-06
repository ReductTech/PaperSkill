import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  white: '#ffffff',
};

type Cleanup = () => void;

function mountCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  render: (ctx: CanvasRenderingContext2D, now: number, narrow: boolean) => void
): Cleanup {
  let ctx: CanvasRenderingContext2D;
  try {
    ctx = setupCanvas(canvas, width, height);
  } catch {
    return () => {};
  }
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  let raf: number | null = null;

  const tick = (now: number) => {
    render(ctx, now, canvas.getBoundingClientRect().width < 470);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
  };
  const start = () => {
    if (raf === null) raf = requestAnimationFrame(tick);
  };
  const disconnect = observeCanvas(canvas, start, stop);
  return () => {
    stop();
    disconnect();
  };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke = C.line,
  fill = C.white
) {
  roundedRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.text,
  size = 13,
  weight = 600,
  align: CanvasTextAlign = 'left'
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  dashed = false
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false
) {
  line(ctx, x1, y1, x2, y2, color, 2.5, dashed);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.55) * 8, y2 - Math.sin(angle - 0.55) * 8);
  ctx.lineTo(x2 - Math.cos(angle + 0.55) * 8, y2 - Math.sin(angle + 0.55) * 8);
  ctx.closePath();
  ctx.fill();
}

function clear(ctx: CanvasRenderingContext2D, width = W, height = H) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, width, height);
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    line(ctx, x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, C.line, 1);
  }
}

function drawBike(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, repaired = false) {
  const rear = x;
  const front = x + 76 * scale;
  const r = 23 * scale;
  drawWheel(ctx, rear, y, r);
  drawWheel(ctx, front, y, r);
  const hubX = x + 36 * scale;
  const seatX = x + 26 * scale;
  const seatY = y - 38 * scale;
  const headX = x + 60 * scale;
  const headY = y - 37 * scale;
  ctx.strokeStyle = C.support;
  ctx.lineWidth = Math.max(2, 4 * scale);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(rear, y);
  ctx.lineTo(hubX, y);
  ctx.lineTo(seatX, seatY);
  ctx.lineTo(rear, y);
  ctx.moveTo(hubX, y);
  ctx.lineTo(headX, headY);
  ctx.lineTo(front, y);
  ctx.moveTo(seatX, seatY);
  ctx.lineTo(headX, headY);
  ctx.stroke();
  ctx.strokeStyle = repaired ? C.green : C.red;
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.beginPath();
  ctx.moveTo(rear + 3 * scale, y + 2 * scale);
  ctx.quadraticCurveTo(hubX - 5 * scale, y + (repaired ? 3 : 11) * scale, hubX + 4 * scale, y + 2 * scale);
  ctx.stroke();
}

function drawNotebook(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, scale = 1) {
  panel(ctx, x, y, 54 * scale, 48 * scale, color, C.white);
  for (let i = 0; i < 3; i += 1) {
    line(
      ctx,
      x + 9 * scale,
      y + (13 + i * 10) * scale,
      x + 44 * scale,
      y + (13 + i * 10) * scale,
      C.line,
      Math.max(1, 1.5 * scale)
    );
  }
}

type CompareState = {
  runState: 'idle' | 'running' | 'done';
  progress: number;
};

const comparisonFeedback = (progress: number, state: CompareState['runState']) => {
  if (state === 'idle') return '同一故障、相同时钟：左侧只有痕迹重读循环；右侧将依次点亮三阶段技能调用接口。';
  if (state === 'done')
    return '旧方法停在“取回痕迹—重新抽象”的循环；本文方法形成“匹配触发与边界—执行标准程序—验证或回退”的三阶段调用接口。';
  if (progress < 0.34) return '左侧取回过往痕迹；右侧第 1 阶段先匹配触发条件，并确认当前情境位于适用边界内。';
  if (progress < 0.67) return '左侧仍要从记录中重新抽象做法；右侧第 2 阶段直接进入已经标准化的执行程序。';
  return '左侧仍需现场判断下一步；右侧第 3 阶段执行验证，不通过时按规则回退。';
};

type StageStatus = 'pending' | 'active' | 'complete';

function drawStageCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
  titleValue: string,
  detail: string,
  status: StageStatus,
  compact: boolean
) {
  const stroke = status === 'complete' ? C.green : status === 'active' ? C.orange : C.line;
  const fill = status === 'complete' ? '#eef8f2' : status === 'active' ? '#fffaf2' : C.white;
  panel(ctx, x, y, w, h, stroke, fill);

  const badgeX = x + (compact ? 16 : 13);
  const badgeY = y + (compact ? 14 : 15);
  ctx.fillStyle = status === 'pending' ? C.line : stroke;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, compact ? 10 : 9, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, String(index), badgeX, badgeY + 4, status === 'pending' ? C.muted : C.white, compact ? 10 : 9, 800, 'center');

  if (compact) {
    text(ctx, titleValue, x + 31, y + 18, status === 'pending' ? C.text : stroke, 11, 800);
    text(ctx, detail, x + 31, y + 36, C.muted, 10, 600);
  } else {
    text(ctx, titleValue, x + w / 2, y + 39, status === 'pending' ? C.text : stroke, 11, 800, 'center');
    text(ctx, detail, x + w / 2, y + 56, C.muted, 9, 600, 'center');
  }
}

function drawOldTraceLoop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number
) {
  const compact = h < 130;
  text(ctx, '旧：重读痕迹', x + 12, y + 22, C.red, 13, 800);
  text(ctx, '同一故障：车链脱落', x + w - 12, y + 22, C.muted, compact ? 10 : 9, 600, 'right');

  const gap = compact ? 50 : 24;
  const boxW = compact ? 148 : 88;
  const boxH = compact ? 43 : 55;
  const totalW = boxW * 2 + gap;
  const startX = x + (w - totalW) / 2;
  const boxY = y + (compact ? 32 : 57);
  const firstActive = progress > 0 && progress < 0.34;
  const secondActive = progress >= 0.34;

  panel(ctx, startX, boxY, boxW, boxH, firstActive ? C.orange : C.red, firstActive ? '#fffaf2' : '#fff7f8');
  const notebookScale = compact ? 0.62 : 0.52;
  drawNotebook(
    ctx,
    startX + 8,
    boxY + (boxH - 48 * notebookScale) / 2,
    firstActive ? C.orange : C.red,
    notebookScale
  );
  text(ctx, compact ? '取回旧轨迹' : '取回轨迹', startX + boxW - 9, boxY + boxH / 2 + 4, firstActive ? C.orange : C.red, compact ? 12 : 10, 800, 'right');

  const secondX = startX + boxW + gap;
  panel(ctx, secondX, boxY, boxW, boxH, secondActive ? C.orange : C.red, secondActive ? '#fffaf2' : '#fff7f8');
  text(ctx, '?', secondX + 23, boxY + boxH / 2 + 9, secondActive ? C.orange : C.red, compact ? 25 : 23, 800, 'center');
  text(ctx, compact ? '重新抽象做法' : '重新抽象', secondX + boxW - 9, boxY + boxH / 2 + 4, secondActive ? C.orange : C.red, compact ? 12 : 10, 800, 'right');
  arrow(ctx, startX + boxW + 5, boxY + boxH / 2, secondX - 6, boxY + boxH / 2, C.red);

  const loopY = boxY + boxH + (compact ? 9 : 15);
  ctx.save();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(secondX + boxW * 0.72, boxY + boxH);
  ctx.bezierCurveTo(secondX + boxW * 0.72, loopY, startX + boxW * 0.28, loopY, startX + boxW * 0.28, boxY + boxH);
  ctx.stroke();
  ctx.restore();
  text(ctx, progress >= 1 ? '仍无可调用接口' : '每次故障仍要重做', x + w / 2, y + h - 10, C.red, compact ? 10 : 11, 700, 'center');
}

function drawGovernedSkillFlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number
) {
  const compact = h < 130;
  text(ctx, '本文：三阶段调用', x + 12, y + 22, C.green, 13, 800);
  text(ctx, '同一故障：车链脱落', x + w - 12, y + 22, C.muted, compact ? 10 : 9, 600, 'right');

  const gap = compact ? 16 : 7;
  const innerW = w - 24;
  const cardW = (innerW - gap * 2) / 3;
  const cardH = compact ? 43 : 65;
  const cardY = y + (compact ? 32 : 57);
  const stages = [
    ['匹配', '触发 + 边界'],
    ['执行', '标准化程序'],
    ['校验', '验证或回退'],
  ] as const;

  stages.forEach(([titleValue, detail], index) => {
    const thresholdStart = index / 3;
    const thresholdEnd = (index + 1) / 3;
    const status: StageStatus =
      progress >= thresholdEnd || progress >= 1
        ? 'complete'
        : progress > thresholdStart
          ? 'active'
          : 'pending';
    const cardX = x + 12 + index * (cardW + gap);
    drawStageCard(ctx, cardX, cardY, cardW, cardH, index + 1, titleValue, detail, status, compact);
    if (index < stages.length - 1) {
      arrow(ctx, cardX + cardW + 2, cardY + cardH / 2, cardX + cardW + gap - 2, cardY + cardH / 2, status === 'complete' ? C.green : C.line);
    }
  });

  const footer = progress >= 1
    ? '三阶段完成：可执行，也可验证和回退'
    : progress < 0.34
      ? '阶段 1：先确认何时能用'
      : progress < 0.67
        ? '阶段 2：调用标准程序'
        : '阶段 3：检查结果并决定回退';
  text(ctx, footer, x + w / 2, y + h - 10, progress >= 1 ? C.green : C.blue, compact ? 10 : 11, 700, 'center');
}

function drawComparePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  method: 'old' | 'new',
  progress: number
) {
  const color = method === 'old' ? C.red : C.green;
  panel(ctx, x, y, w, h, color, C.white);
  if (method === 'old') {
    drawOldTraceLoop(ctx, x, y, w, h, progress);
  } else {
    drawGovernedSkillFlow(ctx, x, y, w, h, progress);
  }
}

const ComparisonLab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CompareState>({ runState: 'idle', progress: 0 });
  const startedAtRef = useRef(0);
  const phaseRef = useRef('idle');
  const aliveRef = useRef(true);
  const [runState, setRunState] = useState<CompareState['runState']>('idle');
  const [feedback, setFeedback] = useState(comparisonFeedback(0, 'idle'));

  useEffect(() => {
    aliveRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanup = mountCanvas(canvas, W, 250, (ctx, now, narrow) => {
      const current = stateRef.current;
      if (current.runState === 'running') {
        current.progress = clamp((now - startedAtRef.current) / 2600, 0, 1);
        const phase = current.progress < 0.34 ? 'early' : current.progress < 0.67 ? 'middle' : current.progress < 1 ? 'late' : 'done';
        if (phase !== phaseRef.current && aliveRef.current) {
          phaseRef.current = phase;
          setFeedback(comparisonFeedback(current.progress, phase === 'done' ? 'done' : 'running'));
        }
        if (current.progress >= 1) {
          current.runState = 'done';
          if (aliveRef.current) setRunState('done');
        }
      }
      clear(ctx, W, 250);
      if (narrow) {
        drawComparePanel(ctx, 16, 10, 528, 105, 'old', current.progress);
        drawComparePanel(ctx, 16, 130, 528, 105, 'new', current.progress);
      } else {
        drawComparePanel(ctx, 16, 16, 252, 176, 'old', current.progress);
        drawComparePanel(ctx, 292, 16, 252, 176, 'new', current.progress);
        text(ctx, '相同故障 · 相同时钟', 280, 229, C.muted, 12, 700, 'center');
      }
    });
    return () => {
      aliveRef.current = false;
      cleanup();
    };
  }, []);

  const start = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      stateRef.current = { runState: 'done', progress: 1 };
      phaseRef.current = 'done';
      setRunState('done');
      setFeedback(comparisonFeedback(1, 'done'));
      return;
    }
    startedAtRef.current = performance.now();
    stateRef.current = { runState: 'running', progress: 0 };
    phaseRef.current = 'early';
    setRunState('running');
    setFeedback(comparisonFeedback(0.01, 'running'));
  };

  const reset = () => {
    stateRef.current = { runState: 'idle', progress: 0 };
    phaseRef.current = 'idle';
    setRunState('idle');
    setFeedback(comparisonFeedback(0, 'idle'));
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={250} role="img" aria-label="旧方法重读痕迹循环与本文方法三阶段技能调用的同步对比" />
      <div className="step-ctrl">
        <button className="tiny" type="button" onClick={start} disabled={runState === 'running'}>
          {runState === 'done' ? '再次比较' : '同时开始'}
        </button>
        <button className="tiny ghost" type="button" onClick={reset} disabled={runState === 'idle'} aria-label="重置对比" title="重置对比">
          ↺
        </button>
      </div>
      <div className={`feedback ${runState === 'done' ? 'good' : ''}`} aria-live="polite">
        {feedback}
      </div>
    </div>
  );
};

type MemoryMode = 'flat' | 'msce';

type DutyKind = 'evidence' | 'procedure' | 'environment' | 'skill';

const dutyColor: Record<DutyKind, string> = {
  evidence: C.blue,
  procedure: C.orange,
  environment: C.purple,
  skill: C.green,
};

const dutyFill: Record<DutyKind, string> = {
  evidence: '#f3f7fc',
  procedure: '#fff8ed',
  environment: '#f7f3ff',
  skill: '#eef8f2',
};

function drawDutyIcon(
  ctx: CanvasRenderingContext2D,
  kind: DutyKind,
  x: number,
  y: number,
  scale = 1
) {
  const color = dutyColor[kind];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'evidence') {
    roundedRect(ctx, 3, 3, 18, 19, 3);
    ctx.stroke();
    roundedRect(ctx, 8, 0, 8, 5, 2);
    ctx.fill();
    line(ctx, 7, 10, 17, 10, color, 1.5);
    line(ctx, 7, 15, 17, 15, color, 1.5);
  } else if (kind === 'procedure') {
    ctx.beginPath();
    ctx.arc(6, 7, 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4.5, 7);
    ctx.lineTo(5.8, 8.4);
    ctx.lineTo(8.4, 5.3);
    ctx.stroke();
    line(ctx, 12, 7, 22, 7, color, 1.7);
    ctx.beginPath();
    ctx.arc(6, 17, 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4.5, 17);
    ctx.lineTo(5.8, 18.4);
    ctx.lineTo(8.4, 15.3);
    ctx.stroke();
    line(ctx, 12, 17, 22, 17, color, 1.7);
  } else if (kind === 'environment') {
    ctx.beginPath();
    ctx.moveTo(2, 5);
    ctx.lineTo(9, 2);
    ctx.lineTo(16, 5);
    ctx.lineTo(23, 2);
    ctx.lineTo(23, 20);
    ctx.lineTo(16, 23);
    ctx.lineTo(9, 20);
    ctx.lineTo(2, 23);
    ctx.closePath();
    ctx.stroke();
    line(ctx, 9, 2, 9, 20, color, 1.4);
    line(ctx, 16, 5, 16, 23, color, 1.4);
    ctx.beginPath();
    ctx.arc(13, 12, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    roundedRect(ctx, 2, 7, 22, 15, 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(13, 7, 5, Math.PI, 0);
    ctx.stroke();
    line(ctx, 2, 13, 24, 13, color, 1.5);
    ctx.beginPath();
    ctx.moveTo(10, 17);
    ctx.lineTo(12.3, 19.2);
    ctx.lineTo(16.5, 15.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDutyCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: DutyKind,
  titleValue: string,
  detail: string,
  compactSize = 10
) {
  const color = dutyColor[kind];
  panel(ctx, x, y, w, h, color, dutyFill[kind]);
  if (h >= 50) {
    drawDutyIcon(ctx, kind, x + w / 2 - 10, y + 7, 0.82);
    text(ctx, titleValue, x + w / 2, y + h - 20, color, 10, 800, 'center');
    text(ctx, detail, x + w / 2, y + h - 7, C.muted, 9, 700, 'center');
    return;
  }
  if (h >= 38) {
    drawDutyIcon(ctx, kind, x + 7, y + h / 2 - 8, 0.62);
    text(ctx, titleValue, x + 29, y + 17, color, 10, 800);
    text(ctx, detail, x + 29, y + 34, C.muted, 9, 700);
    return;
  }
  drawDutyIcon(ctx, kind, x + 7, y + h / 2 - 8, compactSize >= 12 ? 0.72 : 0.62);
  text(ctx, `${titleValue}｜${detail}`, x + (compactSize >= 12 ? 32 : 27), y + h / 2 + compactSize * 0.38, color, compactSize, 800);
}

function drawNotebookEntry(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  titleValue: string,
  question: string,
  kind: DutyKind,
  compact: boolean
) {
  const color = dutyColor[kind];
  roundedRect(ctx, x, y, w, h, 4);
  ctx.fillStyle = dutyFill[kind];
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 8, y + h / 2, compact ? 3 : 3.5, 0, Math.PI * 2);
  ctx.fill();
  const baseline = y + h / 2 + (compact ? 3.5 : 4);
  text(ctx, titleValue, x + 16, baseline, color, compact ? 12 : 10, 800);
  text(ctx, `｜${question}`, x + (compact ? 75 : 68), baseline, C.muted, compact ? 12 : 10, 700);
}

function drawMixedNotebook(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  compact: boolean
) {
  panel(ctx, x, y, w, h, C.red, '#fffdf8');
  line(ctx, x + 13, y + 5, x + 13, y + h - 5, '#efb4bd', 1.5);
  for (let i = 0; i < (compact ? 4 : 6); i += 1) {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x + 6, y + 10 + i * ((h - 20) / (compact ? 3 : 5)), 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const entries: Array<[string, string, DutyKind]> = [
    ['故障记录', '发生了什么', 'evidence'],
    ['维修做法', '应该怎么做', 'procedure'],
    ['路况事实', '环境怎样', 'environment'],
  ];
  if (compact) {
    entries.forEach(([titleValue, question, kind], index) => {
      drawNotebookEntry(ctx, x + 18, y + 5 + index * 20, w - 25, 18, titleValue, question, kind, true);
    });
    return;
  }

  text(ctx, '三类信息混写', x + w / 2 + 4, y + 19, C.red, 11, 800, 'center');
  entries.forEach(([titleValue, question, kind], index) => {
    drawNotebookEntry(ctx, x + 19, y + 28 + index * 34, w - 27, 29, titleValue, question, kind, false);
  });
}

function drawQuestionCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  titleValue: string,
  question: string,
  kind: DutyKind
) {
  panel(ctx, x, y, w, 42, dutyColor[kind], dutyFill[kind]);
  text(ctx, titleValue, x + w / 2, y + 17, dutyColor[kind], 10, 800, 'center');
  text(ctx, question, x + w / 2, y + 33, C.muted, 9, 700, 'center');
}

function drawGovernanceGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  panel(ctx, x, y, w, h, C.green, '#f4fbf7');
  ctx.fillStyle = C.orange;
  roundedRect(ctx, x + w / 2 - 8, y + 8, 16, 5, 2);
  ctx.fill();
  text(ctx, '治理', x + w / 2, y + h / 2 + 2, C.green, 10, 800, 'center');
  text(ctx, '门槛', x + w / 2, y + h / 2 + 15, C.green, 10, 800, 'center');
}

function drawMemoryOrganization(ctx: CanvasRenderingContext2D, mode: MemoryMode, narrow: boolean) {
  clear(ctx);
  const life = narrow ? { x: 16, y: 12, w: 528, h: 100 } : { x: 16, y: 18, w: 210, h: 224 };
  const tech = narrow ? { x: 16, y: 126, w: 528, h: 120 } : { x: 246, y: 18, w: 298, h: 224 };
  panel(ctx, life.x, life.y, life.w, life.h, mode === 'flat' ? C.red : C.green, C.white);
  panel(ctx, tech.x, tech.y, tech.w, tech.h, mode === 'flat' ? C.red : C.green, C.white);

  if (mode === 'flat') {
    if (narrow) {
      text(ctx, '同一本维修本：三类信息混写', life.x + 12, life.y + 22, C.red, 14, 800);
      drawMixedNotebook(ctx, life.x + 12, life.y + 28, 374, 68, true);
      arrow(ctx, life.x + 394, life.y + 62, life.x + 407, life.y + 62, C.red);
      panel(ctx, life.x + 413, life.y + 40, 101, 45, C.red, '#fff5f6');
      text(ctx, '检索后仍要', life.x + 463.5, life.y + 59, C.red, 11, 800, 'center');
      text(ctx, '重新分辨', life.x + 463.5, life.y + 76, C.red, 12, 800, 'center');

      panel(ctx, tech.x + 12, tech.y + 12, 132, 92, C.red, '#fff8f9');
      text(ctx, '三类职责混写', tech.x + 78, tech.y + 33, C.red, 13, 800, 'center');
      [
        ['发生了什么', dutyColor.evidence],
        ['应该怎么做', dutyColor.procedure],
        ['环境怎样', dutyColor.environment],
      ].forEach(([labelValue, color], index) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(tech.x + 27, tech.y + 50 + index * 19, 3.5, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, labelValue, tech.x + 38, tech.y + 54 + index * 19, color, 11, 700);
      });
      arrow(ctx, tech.x + 144, tech.y + 59, tech.x + 165, tech.y + 59, C.red);
      panel(ctx, tech.x + 171, tech.y + 34, 97, 50, C.red, '#fff5f6');
      text(ctx, '平铺经历池', tech.x + 219.5, tech.y + 56, C.red, 11, 800, 'center');
      text(ctx, '职责未分', tech.x + 219.5, tech.y + 74, C.muted, 10, 700, 'center');
      arrow(ctx, tech.x + 268, tech.y + 59, tech.x + 292, tech.y + 59, C.red);
      panel(ctx, tech.x + 298, tech.y + 34, 82, 50, C.red, C.white);
      text(ctx, '混合片段', tech.x + 339, tech.y + 65, C.red, 11, 800, 'center');
      arrow(ctx, tech.x + 380, tech.y + 59, tech.x + 404, tech.y + 59, C.red);
      panel(ctx, tech.x + 410, tech.y + 34, 90, 50, C.red, '#fff5f6');
      text(ctx, '现场', tech.x + 455, tech.y + 56, C.red, 11, 800, 'center');
      text(ctx, '再归纳', tech.x + 455, tech.y + 74, C.red, 11, 800, 'center');
      return;
    }

    text(ctx, '同一本维修本', life.x + life.w / 2, life.y + 24, C.red, 13, 800, 'center');
    drawMixedNotebook(ctx, life.x + 13, life.y + 34, life.w - 26, 139, false);
    panel(ctx, life.x + 28, life.y + 184, life.w - 56, 27, C.red, '#fff5f6');
    text(ctx, '检索后仍要重新分辨', life.x + life.w / 2, life.y + 202, C.red, 10, 800, 'center');

    text(ctx, '三类职责未分', tech.x + tech.w / 2, tech.y + 22, C.red, 12, 800, 'center');
    const sourceXs = [tech.x + 12, tech.x + 106, tech.x + 200];
    drawQuestionCard(ctx, sourceXs[0], tech.y + 33, 82, '故障记录', '发生了什么', 'evidence');
    drawQuestionCard(ctx, sourceXs[1], tech.y + 33, 82, '维修做法', '应该怎么做', 'procedure');
    drawQuestionCard(ctx, sourceXs[2], tech.y + 33, 82, '路况事实', '环境怎样', 'environment');
    sourceXs.forEach((sourceX, index) => {
      arrow(ctx, sourceX + 41, tech.y + 75, tech.x + 72 + index * 76, tech.y + 94, C.red);
    });
    panel(ctx, tech.x + 55, tech.y + 94, 188, 43, C.red, '#fff5f6');
    text(ctx, '平铺经历池：混写', tech.x + tech.w / 2, tech.y + 120, C.red, 12, 800, 'center');
    arrow(ctx, tech.x + tech.w / 2, tech.y + 137, tech.x + tech.w / 2, tech.y + 154, C.red);
    panel(ctx, tech.x + 26, tech.y + 160, 91, 38, C.red, C.white);
    text(ctx, '混合片段', tech.x + 71.5, tech.y + 184, C.red, 10, 800, 'center');
    arrow(ctx, tech.x + 117, tech.y + 179, tech.x + 172, tech.y + 179, C.red);
    panel(ctx, tech.x + 178, tech.y + 160, 94, 38, C.red, '#fff5f6');
    text(ctx, '现场再归纳', tech.x + 225, tech.y + 184, C.red, 10, 800, 'center');
    text(ctx, '检索不等于职责分离', tech.x + tech.w / 2, tech.y + 214, C.muted, 10, 700, 'center');
    return;
  }

  if (narrow) {
    text(ctx, '维修台：四个固定位置，各司其职', life.x + 12, life.y + 22, C.green, 14, 800);
    const leftCardX = life.x + 12;
    const rightCardX = life.x + 270;
    const cardW = 242;
    drawDutyCard(ctx, leftCardX, life.y + 30, cardW, 28, 'evidence', '检修记录', 'L1 证据', 12);
    drawDutyCard(ctx, rightCardX, life.y + 30, cardW, 28, 'procedure', '维修步骤', 'L2 程序', 12);
    drawDutyCard(ctx, leftCardX, life.y + 64, cardW, 28, 'environment', '路况卡', 'L3 环境', 12);
    drawDutyCard(ctx, rightCardX, life.y + 64, cardW, 28, 'skill', '认证工具', 'K 技能', 12);

    const sourceX = tech.x + 12;
    const sourceW = 174;
    const sourceRows = [tech.y + 11, tech.y + 46, tech.y + 81];
    drawDutyCard(ctx, sourceX, sourceRows[0], sourceW, 28, 'evidence', 'L1 证据', '发生了什么', 11);
    drawDutyCard(ctx, sourceX, sourceRows[1], sourceW, 28, 'procedure', 'L2 程序', '应该怎么做', 11);
    drawDutyCard(ctx, sourceX, sourceRows[2], sourceW, 28, 'environment', 'L3 环境', '环境怎样组织', 11);
    const gate = { x: tech.x + 208, y: tech.y + 39, w: 62, h: 46 };
    const skill = { x: tech.x + 320, y: tech.y + 30, w: 110, h: 64 };
    arrow(ctx, sourceX + sourceW, sourceRows[0] + 14, gate.x + 12, gate.y, C.blue, true);
    arrow(ctx, sourceX + sourceW, sourceRows[1] + 14, gate.x, gate.y + gate.h / 2, C.orange);
    arrow(ctx, sourceX + sourceW, sourceRows[2] + 14, gate.x + 12, gate.y + gate.h, C.purple, true);
    drawGovernanceGate(ctx, gate.x, gate.y, gate.w, gate.h);
    arrow(ctx, gate.x + gate.w, gate.y + gate.h / 2, skill.x, skill.y + skill.h / 2, C.green);
    panel(ctx, skill.x, skill.y, skill.w, skill.h, C.green, dutyFill.skill);
    text(ctx, 'K 技能', skill.x + skill.w / 2, skill.y + 21, C.green, 12, 800, 'center');
    text(ctx, '何时调用', skill.x + skill.w / 2, skill.y + 40, C.text, 10, 700, 'center');
    text(ctx, '怎样验证', skill.x + skill.w / 2, skill.y + 56, C.text, 10, 700, 'center');
    text(ctx, 'L1 / L3 只作', tech.x + 474, tech.y + 44, C.muted, 10, 700, 'center');
    text(ctx, '判断依据', tech.x + 474, tech.y + 61, C.muted, 11, 800, 'center');
    text(ctx, '不直接成步骤', tech.x + 474, tech.y + 79, C.muted, 10, 700, 'center');
    return;
  }

  text(ctx, '维修台：四个固定位置', life.x + life.w / 2, life.y + 24, C.green, 13, 800, 'center');
  drawDutyCard(ctx, life.x + 12, life.y + 34, 88, 64, 'evidence', '检修记录', 'L1 证据');
  drawDutyCard(ctx, life.x + 110, life.y + 34, 88, 64, 'procedure', '维修步骤', 'L2 程序');
  drawDutyCard(ctx, life.x + 12, life.y + 106, 88, 64, 'environment', '路况卡', 'L3 环境');
  drawDutyCard(ctx, life.x + 110, life.y + 106, 88, 64, 'skill', '认证工具', 'K 技能');
  text(ctx, '四个位置，各司其职', life.x + life.w / 2, life.y + 205, C.green, 11, 800, 'center');

  text(ctx, '职责分开，执行通路受治理', tech.x + tech.w / 2, tech.y + 22, C.green, 12, 800, 'center');
  const sourceX = tech.x + 12;
  const sourceW = 100;
  const sourceRows = [tech.y + 33, tech.y + 87, tech.y + 141];
  drawDutyCard(ctx, sourceX, sourceRows[0], sourceW, 43, 'evidence', 'L1 证据', '发生了什么');
  drawDutyCard(ctx, sourceX, sourceRows[1], sourceW, 43, 'procedure', 'L2 程序', '应该怎么做');
  drawDutyCard(ctx, sourceX, sourceRows[2], sourceW, 43, 'environment', 'L3 环境', '环境怎样组织');
  const gate = { x: tech.x + 140, y: tech.y + 84, w: 54, h: 62 };
  const skill = { x: tech.x + 212, y: tech.y + 78, w: 72, h: 74 };
  arrow(ctx, sourceX + sourceW, sourceRows[0] + 21.5, gate.x + 11, gate.y, C.blue, true);
  arrow(ctx, sourceX + sourceW, sourceRows[1] + 21.5, gate.x, gate.y + gate.h / 2, C.orange);
  arrow(ctx, sourceX + sourceW, sourceRows[2] + 21.5, gate.x + 11, gate.y + gate.h, C.purple, true);
  drawGovernanceGate(ctx, gate.x, gate.y, gate.w, gate.h);
  arrow(ctx, gate.x + gate.w, gate.y + gate.h / 2, skill.x, skill.y + skill.h / 2, C.green);
  panel(ctx, skill.x, skill.y, skill.w, skill.h, C.green, dutyFill.skill);
  text(ctx, 'K 技能', skill.x + skill.w / 2, skill.y + 22, C.green, 11, 800, 'center');
  text(ctx, '何时调用', skill.x + skill.w / 2, skill.y + 43, C.text, 9, 700, 'center');
  text(ctx, '怎样验证', skill.x + skill.w / 2, skill.y + 59, C.text, 9, 700, 'center');
  text(ctx, 'L1 / L3 提供判断依据，不直接变成步骤', tech.x + tech.w / 2, tech.y + 213, C.muted, 9, 700, 'center');
}

const OrganizationLab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MemoryMode>('flat');
  const [mode, setMode] = useState<MemoryMode>('flat');
  const feedback =
    mode === 'flat'
      ? '同一本维修本混写“发生了什么、应该怎么做、环境怎样”；检索只得到混合片段，代理仍要现场分辨并重新抽象。'
      : '维修台的四个固定位置分别对应 L1 证据、L2 程序、L3 环境认知和 K 技能；只有通过治理门槛的 L2 才能进入技能库，L1 与 L3 只提供判断依据。';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return mountCanvas(canvas, W, H, (ctx, _now, narrow) => drawMemoryOrganization(ctx, stateRef.current, narrow));
  }, []);

  const choose = (next: MemoryMode) => {
    stateRef.current = next;
    setMode(next);
  };

  const onKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      choose(mode === 'flat' ? 'msce' : 'flat');
    }
  };

  return (
    <div>
      <div className="chip-row" role="radiogroup" aria-label="选择记忆组织方式" onKeyDown={onKeys}>
        <button className={`chip ${mode === 'flat' ? 'selected' : ''}`} type="button" role="radio" aria-checked={mode === 'flat'} onClick={() => choose('flat')}>
          平铺记忆
        </button>
        <button className={`chip ${mode === 'msce' ? 'selected' : ''}`} type="button" role="radio" aria-checked={mode === 'msce'} onClick={() => choose('msce')}>
          MSCE 分层治理
        </button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} role="img" aria-label="维修本混写与 MSCE 四职责治理对照图" />
      <div className={`feedback ${mode === 'flat' ? 'bad' : 'good'}`} aria-live="polite">
        {feedback}
      </div>
    </div>
  );
};

type TraceField = 's' | 'a' | 'o' | 'rho' | 'V';

const traceFields: Array<{
  id: TraceField;
  chip: string;
  symbol: string;
  title: string;
  content: string;
  feedback: string;
  color: string;
}> = [
  {
    id: 's',
    chip: '情境 s',
    symbol: 's',
    title: 's｜语义情境',
    content: '车链脱落，车辆停在上坡；当前目标是恢复可骑状态。',
    feedback: '情境回答“此刻面对什么、要完成什么”，它不是整段未切分的原始日志。',
    color: C.blue,
  },
  {
    id: 'a',
    chip: '动作 a',
    symbol: 'a',
    title: 'a｜原子动作',
    content: '用扳手重新张紧后拨链条。',
    feedback: '动作记录实际执行的原子操作，便于之后核对工具、条件与效果。',
    color: C.blue,
  },
  {
    id: 'o',
    chip: '观测 o',
    symbol: 'o',
    title: 'o｜环境观测',
    content: '链条已回到齿盘，但测试转动仍有跳齿。',
    feedback: '观测来自环境回应；它必须与代理自己的猜测分开保存。',
    color: C.blue,
  },
  {
    id: 'rho',
    chip: '反思 ρ',
    symbol: 'ρ',
    title: 'ρ｜自我反思',
    content: '只复位还不够；跳齿提示张力仍需校准。',
    feedback: '反思记录局部判断。它可能有噪声，后续只作为回填权重的依据之一。',
    color: C.purple,
  },
  {
    id: 'V',
    chip: '价值 V',
    symbol: 'V',
    title: 'V｜回填价值',
    content: '交互进行时：待回填。终局反馈到达后，才写入治理价值。',
    feedback: 'V 不是即时观测，也不是因果功劳；它在回合结束后由终局反馈与后继价值回填。',
    color: C.orange,
  },
];

const hotspotRects = traceFields.map((field, index) => ({ field: field.id, x: 24 + index * 104, y: 18, w: 88, h: 58 }));

function drawWrench(ctx: CanvasRenderingContext2D, x: number, y: number, angle = -0.3) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(42, 0);
  ctx.stroke();
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-10, -9);
  ctx.lineTo(1, 0);
  ctx.lineTo(-10, 9);
  ctx.stroke();
  ctx.restore();
}

function drawTrace(ctx: CanvasRenderingContext2D, selected: TraceField, now: number) {
  clear(ctx);
  const active = traceFields.find((field) => field.id === selected) || traceFields[0];
  line(ctx, 45, 47, 515, 47, C.line, 3);
  hotspotRects.forEach((rect, index) => {
    const field = traceFields[index];
    const isActive = field.id === selected;
    const pulse = isActive ? 2 + Math.sin(now / 280) * 1.2 : 0;
    ctx.fillStyle = isActive ? `${field.color}18` : '#ffffff';
    ctx.strokeStyle = isActive ? field.color : C.line;
    ctx.lineWidth = isActive ? 3 + pulse * 0.25 : 1.5;
    roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    text(ctx, field.symbol, rect.x + rect.w / 2, rect.y + 35, isActive ? field.color : C.muted, 20, 800, 'center');
  });

  panel(ctx, 18, 92, 300, 148, active.color, '#ffffff');
  ctx.fillStyle = C.light;
  ctx.beginPath();
  ctx.moveTo(28, 211);
  ctx.lineTo(308, 166);
  ctx.lineTo(308, 230);
  ctx.lineTo(28, 230);
  ctx.closePath();
  ctx.fill();
  drawBike(ctx, 86, 202, 0.72, selected !== 's' && selected !== 'o');

  if (selected === 's') {
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 4;
    roundedRect(ctx, 40, 112, 253, 109, 8);
    ctx.stroke();
    text(ctx, '上坡 · 掉链 · 恢复可骑', 46, 134, C.blue, 12, 800);
  } else if (selected === 'a') {
    drawWrench(ctx, 190, 176, -0.2);
    arrow(ctx, 215, 177, 177, 197, C.blue);
  } else if (selected === 'o') {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(162, 202, 22, -0.6, 0.4);
    ctx.stroke();
    text(ctx, '仍有跳齿', 206, 205, C.red, 12, 800);
  } else if (selected === 'rho') {
    panel(ctx, 188, 116, 108, 46, C.purple, '#faf8ff');
    text(ctx, '还需校准张力', 242, 144, C.purple, 11, 800, 'center');
  } else {
    ctx.save();
    ctx.setLineDash([6, 5]);
    panel(ctx, 194, 127, 96, 47, C.orange, '#fffaf2');
    ctx.restore();
    text(ctx, '待回填', 242, 157, C.orange, 14, 800, 'center');
  }

  panel(ctx, 336, 92, 206, 148, active.color, '#ffffff');
  text(ctx, active.symbol, 439, 154, active.color, 42, 800, 'center');
  text(ctx, selected === 'V' ? '终局后写入' : '当前字段已选中', 439, 185, C.muted, 12, 700, 'center');
  text(ctx, '自行车教学样例', 439, 218, C.muted, 10, 600, 'center');
}

const TraceLab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TraceField>('s');
  const [selected, setSelected] = useState<TraceField>('s');
  const active = traceFields.find((field) => field.id === selected) || traceFields[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return mountCanvas(canvas, W, H, (ctx, now) => drawTrace(ctx, stateRef.current, now));
  }, []);

  const choose = (field: TraceField) => {
    stateRef.current = field;
    setSelected(field);
  };

  const onCanvasPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * W) / rect.width;
    const y = ((event.clientY - rect.top) * H) / rect.height;
    const hit = hotspotRects.find((box) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h);
    if (hit) choose(hit.field);
  };

  const onKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = traceFields.findIndex((field) => field.id === selected);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      choose(traceFields[(current + 1) % traceFields.length].id);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      choose(traceFields[(current - 1 + traceFields.length) % traceFields.length].id);
    }
  };

  return (
    <div>
      <div className="chip-row" role="radiogroup" aria-label="选择 L1 字段" onKeyDown={onKeys}>
        {traceFields.map((field) => (
          <button
            key={field.id}
            className={`chip ${selected === field.id ? 'selected' : ''}`}
            type="button"
            role="radio"
            aria-checked={selected === field.id}
            onClick={() => choose(field.id)}
          >
            {field.chip}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label="可点击的 L1 五字段轨迹结构"
        onPointerDown={onCanvasPointer}
        style={{ cursor: 'pointer' }}
      />
      <div className="hotspot-info" style={{ minHeight: '96px' }}>
        <strong style={{ color: active.color }}>{active.title}</strong>
        <div>{active.content}</div>
      </div>
      <div className="feedback" aria-live="polite">
        {active.feedback}
      </div>
    </div>
  );
};

type BackfillState = {
  alpha: number;
};

function backfillValues(alpha: number) {
  const direct = alpha * 0.8;
  const inherited = (1 - alpha) * 0.9 * 0.8;
  const value = direct + inherited;
  return { direct, inherited, value };
}

function backfillFeedback(alpha: number) {
  const { direct, inherited, value } = backfillValues(alpha);
  if (alpha === 0) return '假设评分器输出 α=0.00：当前步不直接吸收 R；Vₜ=0.720 全部来自折扣后的后继价值。空白或同义反复的反思在论文评分提示中直接取 0。';
  if (alpha === 0.7)
    return '论文附录 Task A 算例取 α=0.70：0.7×0.8 + 0.3×0.9×0.8 = 0.776。0.7 是该算例给定值，不是默认值或最佳值。';
  if (alpha === 1) return '假设评分器输出 α=1.00：Vₜ=R=0.800，后继项为 0；这仍不证明当前步骤造成了终局结果。';
  if (alpha > 0.7)
    return `假设评分器输出 α=${alpha.toFixed(2)}：当前步更直接吸收终局反馈。真实运行中，评分器只在忠实性、因果洞察、可迁移性和具体性证据更强时给出高值；Vₜ=${value.toFixed(3)}。`;
  return `假设评分器输出 α=${alpha.toFixed(2)}：终局项贡献 ${direct.toFixed(3)}，后继项贡献 ${inherited.toFixed(3)}，Vₜ=${value.toFixed(3)}。滑杆只展示公式敏感性，不是在替评分器打分。`;
}

function drawAlphaOrigin(
  ctx: CanvasRenderingContext2D,
  area: { x: number; y: number; w: number; h: number },
  alpha: number,
  narrow: boolean
) {
  if (narrow) {
    const input = { x: area.x + 12, y: area.y + 14, w: 150, h: 62 };
    const scorer = { x: area.x + 198, y: area.y + 14, w: 166, h: 62 };
    const output = { x: area.x + 400, y: area.y + 14, w: 114, h: 62 };
    panel(ctx, input.x, input.y, input.w, input.h, C.blue, '#f3f7fc');
    text(ctx, '输入：L1 当前步', input.x + input.w / 2, input.y + 24, C.blue, 12, 800, 'center');
    text(ctx, 'ρₜ + (sₜ,aₜ,oₜ)', input.x + input.w / 2, input.y + 46, C.text, 12, 700, 'center');
    arrow(ctx, input.x + input.w, input.y + input.h / 2, scorer.x - 7, scorer.y + scorer.h / 2, C.purple);
    panel(ctx, scorer.x, scorer.y, scorer.w, scorer.h, C.purple, '#f7f3ff');
    text(ctx, '反思评分提示', scorer.x + scorer.w / 2, scorer.y + 22, C.purple, 12, 800, 'center');
    text(ctx, 'Π_reflexion_score', scorer.x + scorer.w / 2, scorer.y + 43, C.text, 11, 700, 'center');
    arrow(ctx, scorer.x + scorer.w, scorer.y + scorer.h / 2, output.x - 7, output.y + output.h / 2, C.orange);
    panel(ctx, output.x, output.y, output.w, output.h, C.orange, '#fff8ed');
    text(ctx, `输出 αₜ=${alpha.toFixed(1)}`, output.x + output.w / 2, output.y + 24, C.orange, 12, 800, 'center');
    text(ctx, '+ usable · reason', output.x + output.w / 2, output.y + 45, C.muted, 9, 700, 'center');
    return;
  }

  text(ctx, 'αₜ 的真实来源', area.x + area.w / 2, area.y + 25, C.text, 13, 800, 'center');
  const input = { x: area.x + 16, y: area.y + 37, w: area.w - 32, h: 45 };
  const scorer = { x: area.x + 16, y: area.y + 101, w: area.w - 32, h: 55 };
  const output = { x: area.x + 29, y: area.y + 177, w: area.w - 58, h: 34 };
  panel(ctx, input.x, input.y, input.w, input.h, C.blue, '#f3f7fc');
  text(ctx, '输入：L1 当前步', input.x + input.w / 2, input.y + 18, C.blue, 10, 800, 'center');
  text(ctx, 'ρₜ + (sₜ,aₜ,oₜ)', input.x + input.w / 2, input.y + 35, C.text, 11, 700, 'center');
  arrow(ctx, area.x + area.w / 2, input.y + input.h, area.x + area.w / 2, scorer.y - 6, C.purple);
  panel(ctx, scorer.x, scorer.y, scorer.w, scorer.h, C.purple, '#f7f3ff');
  text(ctx, 'Π_reflexion_score', scorer.x + scorer.w / 2, scorer.y + 21, C.purple, 11, 800, 'center');
  text(ctx, '忠实 · 因果洞察', scorer.x + scorer.w / 2, scorer.y + 37, C.text, 9, 700, 'center');
  text(ctx, '可迁移 · 具体', scorer.x + scorer.w / 2, scorer.y + 50, C.text, 9, 700, 'center');
  arrow(ctx, area.x + area.w / 2, scorer.y + scorer.h, area.x + area.w / 2, output.y - 6, C.orange);
  panel(ctx, output.x, output.y, output.w, output.h, C.orange, '#fff8ed');
  text(ctx, `输出 αₜ=${alpha.toFixed(1)}`, output.x + output.w / 2, output.y + 14, C.orange, 10, 800, 'center');
  text(ctx, '+ usable · reason', output.x + output.w / 2, output.y + 28, C.muted, 8, 700, 'center');
}

function drawBackfill(ctx: CanvasRenderingContext2D, alpha: number, narrow: boolean) {
  clear(ctx);
  const { direct, inherited, value } = backfillValues(alpha);
  const origin = narrow ? { x: 16, y: 12, w: 528, h: 92 } : { x: 16, y: 18, w: 206, h: 224 };
  const formula = narrow ? { x: 16, y: 116, w: 528, h: 52 } : { x: 242, y: 18, w: 302, h: 82 };
  const bars = narrow ? { x: 16, y: 180, w: 528, h: 66 } : { x: 242, y: 116, w: 302, h: 126 };
  panel(ctx, origin.x, origin.y, origin.w, origin.h, C.line, '#ffffff');
  panel(ctx, formula.x, formula.y, formula.w, formula.h, C.line, '#ffffff');
  panel(ctx, bars.x, bars.y, bars.w, bars.h, C.line, '#ffffff');
  drawAlphaOrigin(ctx, origin, alpha, narrow);

  text(ctx, 'Vₜ = αₜR + (1−αₜ)γVₜ₊₁', formula.x + formula.w / 2, formula.y + 31, C.text, narrow ? 15 : 17, 800, 'center');
  text(ctx, `= ${value.toFixed(3)}`, formula.x + formula.w / 2, formula.y + (narrow ? 47 : 61), alpha === 0.7 ? C.green : C.blue, 15, 800, 'center');

  const labelW = narrow ? 102 : 68;
  const barX = bars.x + labelW;
  const barW = bars.w - labelW - 26;
  const firstY = bars.y + (narrow ? 21 : 38);
  const secondY = bars.y + (narrow ? 49 : 78);
  text(ctx, '终局项', bars.x + 12, firstY + 5, C.green, 11, 800);
  text(ctx, '后继项', bars.x + 12, secondY + 5, C.blue, 11, 800);
  line(ctx, barX, firstY, barX + barW, firstY, C.line, 10);
  line(ctx, barX, secondY, barX + barW, secondY, C.line, 10);
  line(ctx, barX, firstY, barX + barW * (direct / 0.8), firstY, C.green, 10);
  line(ctx, barX, secondY, barX + barW * (inherited / 0.8), secondY, C.blue, 10);
  text(ctx, direct.toFixed(3), bars.x + bars.w - 10, firstY + 5, C.green, 11, 800, 'right');
  text(ctx, inherited.toFixed(3), bars.x + bars.w - 10, secondY + 5, C.blue, 11, 800, 'right');
  if (!narrow) text(ctx, '共同标尺 0—0.8', bars.x + bars.w / 2, bars.y + 112, C.muted, 10, 700, 'center');
}

const BackfillLab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<BackfillState>({ alpha: 0.7 });
  const [alpha, setAlpha] = useState(0.7);
  const values = backfillValues(alpha);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return mountCanvas(canvas, W, H, (ctx, _now, narrow) => drawBackfill(ctx, stateRef.current.alpha, narrow));
  }, []);

  const update = (raw: number) => {
    const next = Math.round(clamp(raw, 0, 10)) / 10;
    stateRef.current.alpha = next;
    setAlpha(next);
  };

  return (
    <div>
      <div className="hotspot-info" style={{ minHeight: '110px', marginBottom: '12px' }}>
        <strong style={{ color: C.purple }}>α 的真实生成链</strong>
        <div>
          当前 L1 步的 (sₜ,aₜ,oₜ,ρₜ) → 反思评分提示 Π_reflexion_score → 辅助 LLM →
          {' {alpha, usable, reason}'}。
        </div>
        <div style={{ color: C.muted }}>
          评分器核对忠实性、因果洞察、可迁移性和具体性；论文给出提示准则而非解析公式。实验中的辅助评分算子使用 GPT-4o。
        </div>
      </div>
      <canvas ref={canvasRef} width={W} height={H} role="img" aria-label="反思加权价值回填的两项贡献与总值" />
      <div className="ctrl">
        <label htmlFor="alpha-backfill">
          敏感性演示：替换评分器输出 αₜ <span className="val">{alpha.toFixed(2)}</span>
        </label>
        <input
          id="alpha-backfill"
          type="range"
          min={0}
          max={10}
          step={1}
          value={Math.round(alpha * 10)}
          onInput={(event) => update(Number((event.target as HTMLInputElement).value))}
          aria-label="敏感性演示，替换反思评分器输出 alpha"
          aria-valuetext={`α 等于 ${alpha.toFixed(2)}`}
        />
        <span style={{ color: C.muted, fontSize: '13px' }}>附录算例固定：R=0.8 · γ=0.9 · Vₜ₊₁=0.8</span>
      </div>
      <div className="metrics" aria-label="回填计算值">
        <div className="metric">
          <div className="l">终局项 αR</div>
          <div className="v" style={{ color: C.green }}>{values.direct.toFixed(3)}</div>
        </div>
        <div className="metric">
          <div className="l">折扣后继项</div>
          <div className="v" style={{ color: C.blue }}>{values.inherited.toFixed(3)}</div>
        </div>
        <div className="metric">
          <div className="l">治理价值 Vₜ</div>
          <div className="v" style={{ color: alpha === 0.7 ? C.green : C.blue }}>{values.value.toFixed(3)}</div>
        </div>
      </div>
      <div className={`feedback ${alpha === 0.7 ? 'good' : ''}`} aria-live="polite">
        {backfillFeedback(alpha)}
      </div>
      <div className="feedback bad">边界：滑杆不是论文中的 α 生成器；0.7 不是默认值或最佳值，V 也不是因果功劳。</div>
    </div>
  );
};

export const FoundationLab: React.FC<WidgetProps> = ({ moduleId }) => {
  if (moduleId === '1.1') return <ComparisonLab />;
  if (moduleId === '1.2') return <OrganizationLab />;
  if (moduleId === '2.1') return <TraceLab />;
  if (moduleId === '3.1') return <BackfillLab />;
  return <div className="feedback bad">基础交互模块未识别：{moduleId}</div>;
};

export default FoundationLab;
