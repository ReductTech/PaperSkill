import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

const C = {
  bg: '#f5f8f0',
  envLight: '#b8c9a7',
  envDark: '#76906a',
  support: '#92400e',
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

type Painter = (ctx: CanvasRenderingContext2D, time: number) => void;

function useObservedCanvas(ref: React.RefObject<HTMLCanvasElement>, painter: Painter) {
  const painterRef = useRef(painter);
  painterRef.current = painter;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = W + ' / ' + H;

    let running = false;
    let rafId: number | null = null;

    const tick = (time: number) => {
      painterRef.current(ctx, time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (running) rafId = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);

    return () => {
      stop();
      disconnect();
    };
  }, [ref]);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke = C.border,
  lineWidth = 1
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
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function clearBikeScene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
}

function drawCanvasLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.text,
  size = 13,
  align: CanvasTextAlign = 'left',
  weight = 600
) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 3,
  dashed = false
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(angle - Math.PI / 6), y2 - 9 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 9 * Math.cos(angle + Math.PI / 6), y2 - 9 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWrench(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  focused: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  if (focused) {
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 33, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-30, 18);
  ctx.lineTo(18, -10);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(12, -16);
  ctx.lineTo(28, -25);
  ctx.moveTo(16, -7);
  ctx.lineTo(32, 2);
  ctx.stroke();
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.arc(-30, 18, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function feedbackClass(kind: 'neutral' | 'good' | 'bad') {
  return kind === 'good' ? 'feedback good' : kind === 'bad' ? 'feedback bad' : 'feedback';
}

type GainRelation = 'negative' | 'neutral' | 'positive';

function gainRelationFor(dragY: number): GainRelation {
  if (dragY < 126) return 'positive';
  if (dragY > 134) return 'negative';
  return 'neutral';
}

function gainFeedback(relation: GainRelation) {
  if (relation === 'positive') {
    return {
      text: 'G > 0：启发式策略增益转正，只提供有用性信号；它不是因果效应，也不会单独把策略变成技能。',
      kind: 'good' as const,
    };
  }
  if (relation === 'negative') {
    return {
      text: 'G < 0：关联这条策略的聚合轨迹价值更低，当前证据不支持把它送入晋升检查。',
      kind: 'bad' as const,
    };
  }
  return {
    text: 'G ≈ 0：两侧没有清晰差异；应继续保留可审计证据，而不是宣布策略有效。',
    kind: 'neutral' as const,
  };
}

function drawGainLab(
  ctx: CanvasRenderingContext2D,
  dragY: number,
  isDragging: boolean
) {
  clearBikeScene(ctx);
  const relation = gainRelationFor(dragY);
  const activeColor = relation === 'positive' ? C.green : relation === 'negative' ? C.red : C.blue;
  const fixedY = 130;

  roundedRect(ctx, 24, 30, 356, 196, 8, 'rgba(255,255,255,0.78)');
  roundedRect(ctx, 400, 30, 136, 196, 8, C.white);

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(132, 54);
  ctx.lineTo(132, 210);
  ctx.moveTo(292, 54);
  ctx.lineTo(292, 210);
  ctx.stroke();

  drawCanvasLabel(ctx, '关联策略聚合', 132, 48, C.muted, 12, 'center');
  drawCanvasLabel(ctx, '混合比较聚合', 292, 48, C.muted, 12, 'center');

  ctx.fillStyle = 'rgba(39,68,110,0.08)';
  ctx.fillRect(121, dragY, 22, 210 - dragY);
  ctx.fillRect(281, fixedY, 22, 210 - fixedY);

  ctx.strokeStyle = activeColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(104, dragY);
  ctx.lineTo(160, dragY);
  ctx.stroke();

  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(264, fixedY);
  ctx.lineTo(320, fixedY);
  ctx.stroke();

  const braceX = 350;
  ctx.strokeStyle = activeColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(braceX - 7, dragY);
  ctx.lineTo(braceX, dragY);
  ctx.lineTo(braceX, fixedY);
  ctx.lineTo(braceX - 7, fixedY);
  ctx.stroke();

  drawWrench(ctx, 82, dragY, C.support, isDragging);

  const sign = relation === 'positive' ? 'G > 0' : relation === 'negative' ? 'G < 0' : 'G ≈ 0';
  const label = relation === 'positive' ? '有用性信号' : relation === 'negative' ? '暂不支持' : '继续补证';
  drawCanvasLabel(ctx, sign, 468, 86, activeColor, 28, 'center', 800);
  drawCanvasLabel(ctx, label, 468, 126, activeColor, 14, 'center', 700);
  drawCanvasLabel(ctx, '不是因果效应', 468, 164, C.text, 13, 'center', 700);
  drawCanvasLabel(ctx, '不会自动结晶', 468, 188, C.muted, 12, 'center', 600);
  drawCanvasLabel(ctx, '相对位置，不是论文实测值', 280, 240, C.muted, 12, 'center', 500);
}

function GainLab({ chapterId, moduleId }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const [dragY, setDragY] = useState(130);
  const [isDragging, setIsDragging] = useState(false);
  const relation = gainRelationFor(dragY);
  const feedback = gainFeedback(relation);

  useObservedCanvas(canvasRef, (ctx) => drawGainLab(ctx, dragY, isDragging));

  const intrinsicPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (W / rect.width),
      y: (event.clientY - rect.top) * (H / rect.height),
    };
  };

  const commitY = (value: number) => setDragY(clamp(value, 58, 202));

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = intrinsicPoint(event);
    if (point.x < 42 || point.x > 176 || Math.abs(point.y - dragY) > 34) return;
    draggingRef.current = true;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    commitY(point.y);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    commitY(intrinsicPoint(event).y);
  };

  const finishPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      commitY(dragY - 4);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      commitY(dragY + 4);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setDragY(130);
    }
  };

  const ariaText =
    relation === 'positive' ? '高于对照，G 大于零' : relation === 'negative' ? '低于对照，G 小于零' : '接近对照，G 约等于零';

  return (
    <div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        role="slider"
        tabIndex={0}
        aria-label="关联策略聚合值的相对位置"
        aria-orientation="vertical"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={relation === 'positive' ? 1 : relation === 'negative' ? -1 : 0}
        aria-valuetext={ariaText}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onKeyDown={onKeyDown}
        style={{ width: '100%', height: 'auto', touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
      />
      <div className="ctrl">
        <span style={{ color: C.muted, flex: 1 }}>启发式策略增益只表达相对聚合关系</span>
        <button className="tiny ghost" type="button" onClick={() => setDragY(130)} title="回到相等">
          ↺ 回到相等
        </button>
      </div>
      <div className={feedbackClass(feedback.kind)} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
}

type LayerMode = 'overview' | 'l1' | 'l2' | 'l3' | 'invalidMix';

const layerModes: Array<{ id: LayerMode; label: string }> = [
  { id: 'overview', label: '关系总览' },
  { id: 'l1', label: 'L1 证据' },
  { id: 'l2', label: 'L2 程序' },
  { id: 'l3', label: 'L3 环境' },
  { id: 'invalidMix', label: '错误：L3 覆盖程序' },
];

function drawLayerCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  title: string,
  detail: string,
  active: boolean,
  color: string
) {
  roundedRect(ctx, x, 30, 130, 60, 7, active ? color + '18' : C.white, active ? color : C.border, active ? 2.5 : 1);
  drawCanvasLabel(ctx, title, x + 65, 49, active ? color : C.muted, 15, 'center', 800);
  drawCanvasLabel(ctx, detail, x + 65, 72, active ? C.text : C.muted, 14, 'center', 700);
}

function drawLayerLab(ctx: CanvasRenderingContext2D, mode: LayerMode) {
  clearBikeScene(ctx);
  const showAll = mode === 'overview';
  const l1Active = showAll || mode === 'l1';
  const l2Active = showAll || mode === 'l2';
  const l3Active = showAll || mode === 'l3' || mode === 'invalidMix';
  const invalid = mode === 'invalidMix';

  drawCanvasLabel(ctx, '形成 / 更新', 16, 14, C.text, 15, 'left', 800);
  drawLayerCard(ctx, 16, 'L1 证据簇', '多回合 e₁ · e₂ · e₃', l1Active, C.blue);
  drawLayerCard(ctx, 216, 'L2 活跃策略', 'π₁ · π₂ · π₃', l2Active, C.orange);
  drawLayerCard(ctx, 416, 'L3 环境认知', 'E · I · C', l3Active, invalid ? C.red : C.green);

  drawArrow(ctx, 150, 60, 211, 60, l1Active || l2Active ? C.orange : C.border, l1Active || l2Active ? 3 : 2);
  drawCanvasLabel(ctx, '归纳', 181, 82, l1Active || l2Active ? C.orange : C.muted, 14, 'center', 800);
  drawArrow(ctx, 350, 60, 411, 60, l2Active || l3Active ? (invalid ? C.red : C.green) : C.border, l2Active || l3Active ? 3 : 2);
  drawCanvasLabel(ctx, '抽象', 381, 82, l2Active || l3Active ? (invalid ? C.red : C.green) : C.muted, 14, 'center', 800);
  drawCanvasLabel(ctx, '受治理的更新来源，不是单条记录自动逐级升级', 280, 110, C.muted, 13, 'center', 700);

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, 128);
  ctx.lineTo(544, 128);
  ctx.stroke();

  drawCanvasLabel(ctx, '调用 / 协作', 16, 142, C.text, 15, 'left', 800);
  roundedRect(ctx, 18, 153, 195, 36, 6, l2Active ? C.orange + '18' : C.white, l2Active ? C.orange : C.border, l2Active ? 2.5 : 1);
  drawCanvasLabel(ctx, 'L2：程序 π + 验证 κ', 116, 171, l2Active ? C.orange : C.muted, 15, 'center', 800);

  roundedRect(ctx, 18, 206, 195, 36, 6, l3Active ? (invalid ? C.red : C.green) + '18' : C.white, l3Active ? (invalid ? C.red : C.green) : C.border, l3Active ? 2.5 : 1);
  drawCanvasLabel(ctx, 'L3：环境先验 E / I / C', 116, 224, l3Active ? (invalid ? C.red : C.green) : C.muted, 15, 'center', 800);

  const taskColor = invalid ? C.red : showAll ? C.text : mode === 'l2' ? C.orange : mode === 'l3' ? C.green : C.border;
  roundedRect(ctx, 390, 173, 152, 58, 7, invalid ? C.red + '12' : C.white, taskColor, invalid || showAll || mode === 'l2' || mode === 'l3' ? 2.5 : 1);
  drawCanvasLabel(ctx, '当前任务实例', 466, 191, invalid ? C.red : C.text, 15, 'center', 800);
  drawCanvasLabel(ctx, invalid ? '角色冲突：π 被覆盖' : 'π 保持不变', 466, 214, invalid ? C.red : C.muted, 14, 'center', 700);

  drawArrow(ctx, 216, 171, 385, 190, l2Active ? C.orange : C.border, l2Active ? 3.5 : 2);
  drawCanvasLabel(ctx, '执行', 298, 169, l2Active ? C.orange : C.muted, 14, 'center', 800);
  drawArrow(ctx, 216, 224, 385, 214, l3Active ? (invalid ? C.red : C.green) : C.border, l3Active ? 3.5 : 2, !invalid);
  drawCanvasLabel(ctx, invalid ? '错误覆盖 π' : '只补先验', 300, 231, l3Active ? (invalid ? C.red : C.green) : C.muted, 14, 'center', 800);

  if (invalid) {
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(523, 179);
    ctx.lineTo(536, 192);
    ctx.moveTo(536, 179);
    ctx.lineTo(523, 192);
    ctx.stroke();
    ctx.restore();
  }
}

function layerFeedback(mode: LayerMode) {
  if (mode === 'overview') {
    return {
      text: '形成时：多回合 L1 证据支持归纳 L2，多个活跃 L2 可进一步抽象 L3。调用时：L2 提供程序 π 与验证 κ，L3 并行补充环境先验，π 保持不变。',
      kind: 'good' as const,
    };
  }
  if (mode === 'invalidMix') {
    return {
      text: '角色冲突：让 L3 直接改写或替代 π，会把环境事实与操作步骤重新混在一起。',
      kind: 'bad' as const,
    };
  }
  if (mode === 'l1') {
    return {
      text: 'L1 保存可追溯事实；跨回合重复且有支持的证据才可能被归纳为 L2，不是单条记录直接升级。',
      kind: 'neutral' as const,
    };
  }
  if (mode === 'l2') {
    return {
      text: 'L2 负责触发 φ、程序 π、验证 κ 与边界 B，在当前任务中承担“怎么做”。',
      kind: 'neutral' as const,
    };
  }
  return {
    text: 'L3 从多个活跃 L2 中抽象实体、规律与约束 E/I/C；调用时只补先验或参数，不执行、也不覆盖 π。',
    kind: 'good' as const,
  };
}

function LayerLab({ chapterId, moduleId }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [mode, setMode] = useState<LayerMode>('overview');
  const feedback = layerFeedback(mode);
  useObservedCanvas(canvasRef, (ctx) => drawLayerLab(ctx, mode));

  const moveMode = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const next = (index + delta + layerModes.length) % layerModes.length;
    setMode(layerModes[next].id);
    requestAnimationFrame(() => buttonRefs.current[next]?.focus());
  };

  const selectedStyle = (id: LayerMode): React.CSSProperties | undefined => {
    if (id !== mode) return undefined;
    const color = id === 'invalidMix' ? C.red : id === 'l3' ? C.green : id === 'l2' ? C.orange : id === 'l1' ? C.blue : C.text;
    return { background: color, borderColor: color, color: C.white };
  };

  return (
    <div>
      <div className="chip-row" role="radiogroup" aria-label="知识角色">
        {layerModes.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={mode === item.id}
            className={'chip' + (mode === item.id ? ' selected' : '')}
            style={selectedStyle(item.id)}
            onClick={() => setMode(item.id)}
            onKeyDown={(event) => moveMode(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label="L1、L2、L3 的形成关系与任务调用分工联动图"
        style={{ width: '100%', height: 'auto' }}
      />
      <div className={feedbackClass(feedback.kind)} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
}

type CaseMode = 'supported' | 'unsupportedTool';
type GateStep = 0 | 1 | 2 | 3 | 4;

function gateFeedback(caseMode: CaseMode, step: GateStep) {
  if (step === 0) {
    return {
      text: '这是 L2 可修订程序策略层中的候选策略；它尚未获得调用资格。',
      kind: 'neutral' as const,
    };
  }
  if (step === 1) {
    return {
      text: '门 1：先核对支持证据，并要求启发式策略增益超过实现设定的正阈值；这仍不是因果证明。',
      kind: 'neutral' as const,
    };
  }
  if (step === 2) {
    return {
      text: '门 2：近期证据必须与触发条件、程序和适用边界保持稳定一致。',
      kind: 'neutral' as const,
    };
  }
  if (step === 3 && caseMode === 'unsupportedTool') {
    return {
      text: '确定性校验失败：草稿声明了证据白名单中未观察到的工具；该草稿被丢弃，不会暴露给代理。',
      kind: 'bad' as const,
    };
  }
  if (step === 3) {
    return {
      text: '确定性校验通过：schema、证据标识、覆盖范围和已观察工具白名单均可核对。',
      kind: 'neutral' as const,
    };
  }
  return {
    text: '技能结晶完成：标准化对象保留 φ、π、κ、B，并加入证据锚点 A、决策指引 D 与可靠性 η。',
    kind: 'good' as const,
  };
}

function drawGauge(ctx: CanvasRenderingContext2D, step: GateStep, color: string) {
  const cx = 136;
  const cy = 151;
  const radius = 78;
  const start = (-130 * Math.PI) / 180;
  const end = (40 * Math.PI) / 180;
  const stageAngles = [-110, -70, -30, 5, 36];
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.beginPath();
  const activeEnd = (stageAngles[step] * Math.PI) / 180;
  ctx.arc(cx, cy, radius, start, activeEnd);
  ctx.stroke();

  stageAngles.forEach((angle, index) => {
    const a = (angle * Math.PI) / 180;
    const inner = radius - 13;
    const outer = radius + 7;
    ctx.strokeStyle = index <= step ? color : C.border;
    ctx.lineWidth = index === step ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.stroke();
  });

  const needleAngle = (stageAngles[step] * Math.PI) / 180;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(needleAngle) * 61, cy + Math.sin(needleAngle) * 61);
  ctx.stroke();
  ctx.fillStyle = C.support;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawPromotionLab(ctx: CanvasRenderingContext2D, caseMode: CaseMode, step: GateStep) {
  clearBikeScene(ctx);
  const rejected = caseMode === 'unsupportedTool' && step === 3;
  const complete = caseMode === 'supported' && step === 4;
  const activeColor = rejected ? C.red : complete ? C.green : C.blue;
  roundedRect(ctx, 18, 24, 236, 208, 8, 'rgba(255,255,255,0.72)');
  roundedRect(ctx, 278, 24, 264, 208, 8, C.white);
  drawCanvasLabel(ctx, '晋升治理表', 136, 48, C.text, 14, 'center', 800);
  drawGauge(ctx, step, activeColor);
  drawCanvasLabel(
    ctx,
    caseMode === 'unsupportedTool' ? '声明未观察工具' : '受证据支持',
    136,
    214,
    caseMode === 'unsupportedTool' ? C.red : C.green,
    12,
    'center',
    700
  );

  const labels = ['L2 候选', '证据 + 增益', '近期稳定', '确定性校验', '可调用技能'];
  const ys = [49, 88, 127, 166, 205];
  ctx.lineWidth = 3;
  for (let i = 0; i < labels.length - 1; i += 1) {
    const progressed = i < step;
    ctx.strokeStyle = progressed ? (rejected && i === 2 ? C.red : complete ? C.green : C.blue) : C.border;
    ctx.beginPath();
    ctx.moveTo(302, ys[i] + 10);
    ctx.lineTo(302, ys[i + 1] - 10);
    ctx.stroke();
  }
  labels.forEach((label, index) => {
    const isCurrent = index === step;
    const isPast = index < step;
    const nodeColor =
      isCurrent && rejected ? C.red : isCurrent && complete ? C.green : isCurrent ? C.orange : isPast ? C.blue : C.border;
    ctx.fillStyle = isCurrent || isPast ? nodeColor : C.white;
    ctx.strokeStyle = nodeColor;
    ctx.lineWidth = isCurrent ? 3 : 2;
    ctx.beginPath();
    ctx.arc(302, ys[index], isCurrent ? 9 : 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawCanvasLabel(ctx, label, 322, ys[index], isCurrent ? C.text : C.muted, 12, 'left', isCurrent ? 800 : 600);
  });

  if (step >= 3) {
    roundedRect(
      ctx,
      430,
      147,
      92,
      38,
      6,
      rejected ? 'rgba(196,63,82,0.10)' : 'rgba(34,141,92,0.10)',
      rejected ? C.red : C.green,
      2
    );
    drawCanvasLabel(ctx, rejected ? '工具未观察' : '工具可核对', 476, 166, rejected ? C.red : C.green, 11, 'center', 800);
  }

  const status = rejected ? '校验失败 · 草稿丢弃' : complete ? '技能结晶完成' : '当前：第 ' + (step + 1) + ' / 5 关';
  drawCanvasLabel(ctx, status, 280, 241, activeColor, 12, 'center', 800);
}

function PromotionLab({ chapterId, moduleId }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const caseRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [caseMode, setCaseMode] = useState<CaseMode>('unsupportedTool');
  const [step, setStep] = useState<GateStep>(0);
  const feedback = gateFeedback(caseMode, step);
  const rejected = caseMode === 'unsupportedTool' && step === 3;
  const complete = caseMode === 'supported' && step === 4;

  useObservedCanvas(canvasRef, (ctx) => drawPromotionLab(ctx, caseMode, step));

  const selectCase = (next: CaseMode) => {
    setCaseMode(next);
    setStep(0);
  };

  const onCaseKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = index === 0 ? 1 : 0;
    const nextMode: CaseMode = nextIndex === 0 ? 'unsupportedTool' : 'supported';
    selectCase(nextMode);
    requestAnimationFrame(() => caseRefs.current[nextIndex]?.focus());
  };

  const nextStep = () => {
    if (rejected || complete) return;
    setStep((current) => Math.min(4, current + 1) as GateStep);
  };

  const previousStep = () => setStep((current) => Math.max(0, current - 1) as GateStep);
  const nextLabel = rejected ? '草稿已丢弃' : complete ? '已结晶' : '下一关';

  return (
    <div>
      <div className="chip-row" role="radiogroup" aria-label="候选草稿">
        {[
          { id: 'unsupportedTool' as const, label: '声明未观察工具' },
          { id: 'supported' as const, label: '受证据支持' },
        ].map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              caseRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={caseMode === item.id}
            className={'chip' + (caseMode === item.id ? ' selected' : '')}
            style={
              caseMode === item.id
                ? {
                    background: item.id === 'unsupportedTool' ? C.red : C.green,
                    borderColor: item.id === 'unsupportedTool' ? C.red : C.green,
                    color: C.white,
                  }
                : undefined
            }
            onClick={() => selectCase(item.id)}
            onKeyDown={(event) => onCaseKey(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label="技能草稿晋升治理表与五阶段审查链"
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="step-ctrl">
        <button className="tiny ghost" type="button" disabled={step === 0} onClick={previousStep}>
          上一关
        </button>
        <span className="step-label" aria-live="polite">
          第 <b>{step + 1}</b> / 5 关
        </span>
        <button className="tiny" type="button" disabled={rejected || complete} onClick={nextStep}>
          {nextLabel}
        </button>
        <button className="tiny ghost" type="button" onClick={() => setStep(0)} title="重置审查">
          ↺ 重置审查
        </button>
      </div>
      <div className={feedbackClass(feedback.kind)} aria-live="polite">
        {feedback.text}
      </div>
      <div className="hotspot-info">
        在论文的 EvoAgentBench 组件消融中，移除技能结晶使各域 Pass@1 下降 6.15–11.54 个百分点，并使每个域成本上升；Pass@1 越高越好，成本需与成功率共同解释。
      </div>
    </div>
  );
}

type Outcome = 'pass' | 'fail';
type TrialNotice = 'empty' | 'pass' | 'fail' | 'undo' | 'limit';

interface TrialState {
  history: Outcome[];
  notice: TrialNotice;
}

function drawOutcomeTicks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  history: Outcome[]
) {
  for (let index = 0; index < 12; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 12;
    const x1 = cx + Math.cos(angle) * (radius - 8);
    const y1 = cy + Math.sin(angle) * (radius - 8);
    const x2 = cx + Math.cos(angle) * (radius + 5);
    const y2 = cy + Math.sin(angle) * (radius + 5);
    const outcome = history[index];
    ctx.strokeStyle = outcome === 'pass' ? C.green : outcome === 'fail' ? C.red : C.border;
    ctx.lineWidth = outcome ? 7 : 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (index === history.length - 1) {
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x2, y2, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawReliabilityLab(
  ctx: CanvasRenderingContext2D,
  time: number,
  history: Outcome[],
  motion: { startedAt: number; fromAngle: number; toAngle: number }
) {
  clearBikeScene(ctx);
  const nTrial = history.length;
  const nPass = history.reduce((count, outcome) => count + (outcome === 'pass' ? 1 : 0), 0);
  const eta = (nPass + 1) / (nTrial + 2);
  const lastOutcome = history.length ? history[history.length - 1] : null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elapsed = clamp((time - motion.startedAt) / 360, 0, 1);
  const progress = reduceMotion ? 1 : easeInOutQuad(elapsed);
  const angle = motion.fromAngle + (motion.toAngle - motion.fromAngle) * progress;
  const wobble = 8 * (1 - eta);
  const cx = 158 + Math.sin(angle) * wobble;
  const cy = 127;
  const radius = 72;

  roundedRect(ctx, 20, 26, 286, 204, 8, 'rgba(255,255,255,0.70)');
  roundedRect(ctx, 326, 26, 210, 116, 8, C.white);
  roundedRect(ctx, 326, 158, 210, 72, 8, C.white);

  ctx.strokeStyle = C.support;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(106, 215);
  ctx.lineTo(132, 174);
  ctx.lineTo(188, 174);
  ctx.lineTo(214, 215);
  ctx.stroke();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(83, 216);
  ctx.lineTo(232, 216);
  ctx.stroke();

  ctx.strokeStyle = C.text;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.envDark;
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const spokeAngle = angle + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(spokeAngle) * (radius - 8), cy + Math.sin(spokeAngle) * (radius - 8));
    ctx.stroke();
  }
  ctx.fillStyle = C.support;
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  drawOutcomeTicks(ctx, cx, cy, radius, history);
  drawCanvasLabel(ctx, '调用结果记录', 158, 45, C.text, 13, 'center', 800);

  drawCanvasLabel(ctx, '可靠性估计 η', 344, 46, C.text, 13, 'left', 800);
  drawCanvasLabel(ctx, '(' + nPass + ' + 1) / (' + nTrial + ' + 2)', 431, 78, C.blue, 19, 'center', 800);
  drawCanvasLabel(ctx, '= ' + eta.toFixed(3), 431, 108, lastOutcome === 'fail' ? C.red : lastOutcome === 'pass' ? C.green : C.blue, 23, 'center', 800);
  drawCanvasLabel(ctx, '通过 ' + nPass + ' · 调用 ' + nTrial, 431, 129, C.muted, 11, 'center', 700);

  drawCanvasLabel(ctx, '生命周期复查方向', 344, 174, C.text, 12, 'left', 800);
  const nodes = [
    { x: 352, label: '收集' },
    { x: 430, label: '活跃复查' },
    { x: 510, label: '边界/归档' },
  ];
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(352, 199);
  ctx.lineTo(510, 199);
  ctx.stroke();
  nodes.forEach((node, index) => {
    const active =
      (index === 0 && !lastOutcome) || (index === 1 && lastOutcome === 'pass') || (index === 2 && lastOutcome === 'fail');
    const color = index === 1 ? C.green : index === 2 ? C.red : C.blue;
    ctx.fillStyle = active ? color : C.white;
    ctx.strokeStyle = active ? color : C.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(node.x, 199, active ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawCanvasLabel(ctx, node.label, node.x, 218, active ? color : C.muted, 10, 'center', active ? 800 : 600);
  });
  if (lastOutcome === 'pass') drawArrow(ctx, 363, 191, 417, 191, C.green, 3, true);
  if (lastOutcome === 'fail') drawArrow(ctx, 363, 191, 497, 191, C.red, 3, true);

  drawCanvasLabel(ctx, '外部状态更新 · 基础 LLM 参数不变', 280, 242, C.muted, 11, 'center', 600);
}

function trialFeedback(state: TrialState, nPass: number, nTrial: number, eta: number) {
  const value = eta.toFixed(3);
  if (state.notice === 'pass') {
    return {
      text:
        '本次通过：n_pass=' +
        nPass +
        '，n_trial=' +
        nTrial +
        '，η=' +
        value +
        '。可靠性上调，可进入是否达到 active 阈值的后续判断；阈值由实现决定。',
      kind: 'good' as const,
    };
  }
  if (state.notice === 'fail') {
    return {
      text: '本次失败或纠正：η 降至 ' + value + '。系统应复查适用边界，并判断继续试用还是归档，不能盲目沿用。',
      kind: 'bad' as const,
    };
  }
  if (state.notice === 'undo') {
    return {
      text: '已撤销最近一次教学记录，可靠性按剩余调用重新计算为 η=' + value + '。',
      kind: 'neutral' as const,
    };
  }
  if (state.notice === 'limit') {
    return {
      text: '已到本轮 12 次显示上限；该上限只用于界面布局，不是论文的生命周期阈值。',
      kind: 'neutral' as const,
    };
  }
  return {
    text: '尚无调用记录：拉普拉斯平滑给出 η = 0.500；这不是论文实测的 50% 成功率。',
    kind: 'neutral' as const,
  };
}

function ReliabilityLab({ chapterId, moduleId }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionRef = useRef({ startedAt: 0, fromAngle: 0, toAngle: 0 });
  const [trialState, setTrialState] = useState<TrialState>({ history: [], notice: 'empty' });
  const nTrial = trialState.history.length;
  const nPass = trialState.history.reduce((count, outcome) => count + (outcome === 'pass' ? 1 : 0), 0);
  const eta = (nPass + 1) / (nTrial + 2);
  const feedback = trialFeedback(trialState, nPass, nTrial, eta);

  useObservedCanvas(canvasRef, (ctx, time) =>
    drawReliabilityLab(ctx, time, trialState.history, motionRef.current)
  );

  const addOutcome = (outcome: Outcome) => {
    setTrialState((current) => {
      if (current.history.length >= 12) return current;
      const nextLength = current.history.length + 1;
      motionRef.current = {
        startedAt: performance.now(),
        fromAngle: (current.history.length * Math.PI * 2) / 12,
        toAngle: (nextLength * Math.PI * 2) / 12,
      };
      return {
        history: [...current.history, outcome],
        notice: nextLength === 12 ? 'limit' : outcome,
      };
    });
  };

  const undo = () => {
    setTrialState((current) => {
      if (!current.history.length) return current;
      const next = current.history.slice(0, -1);
      const angle = (next.length * Math.PI * 2) / 12;
      motionRef.current = { startedAt: performance.now(), fromAngle: angle, toAngle: angle };
      return { history: next, notice: 'undo' };
    });
  };

  const reset = () => {
    motionRef.current = { startedAt: performance.now(), fromAngle: 0, toAngle: 0 };
    setTrialState({ history: [], notice: 'empty' });
  };

  const limitStyle: React.CSSProperties | undefined =
    trialState.notice === 'limit'
      ? { color: C.orange, background: 'rgba(217,119,6,0.10)', borderLeftColor: C.orange, fontStyle: 'normal' }
      : undefined;

  return (
    <div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label="维修架车轮调用记录、可靠性分式与生命周期复查方向"
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="ctrl" role="group" aria-label="记录技能调用结果">
        <button className="tiny" type="button" disabled={nTrial >= 12} onClick={() => addOutcome('pass')}>
          记录一次通过
        </button>
        <button
          className="tiny"
          type="button"
          disabled={nTrial >= 12}
          onClick={() => addOutcome('fail')}
          style={{ background: C.red, borderColor: C.red }}
        >
          记录一次失败/纠正
        </button>
        <button className="tiny ghost" type="button" disabled={nTrial === 0} onClick={undo} title="撤销最近一次">
          ↶ 撤销最近一次
        </button>
        <button className="tiny ghost" type="button" disabled={nTrial === 0} onClick={reset} title="清空演示">
          ↺ 清空演示
        </button>
      </div>
      <div className={feedbackClass(feedback.kind)} style={limitStyle} aria-live="polite">
        {feedback.text}
      </div>
      <div className="hotspot-info">
        这些变化更新外部认知状态 M1/M2/M3/K，不更新基础 LLM 参数；提示式更新算子仍有计算、延迟和成本，因此并非零成本。
      </div>
    </div>
  );
}

export const GovernanceLab: React.FC<WidgetProps> = (props) => {
  if (props.moduleId === '4.1') return <GainLab {...props} />;
  if (props.moduleId === '5.1') return <LayerLab {...props} />;
  if (props.moduleId === '6.1') return <PromotionLab {...props} />;
  if (props.moduleId === '7.1') return <ReliabilityLab {...props} />;
  return <div className="feedback bad">治理交互模块未找到：{props.moduleId}</div>;
};

export default GovernanceLab;
