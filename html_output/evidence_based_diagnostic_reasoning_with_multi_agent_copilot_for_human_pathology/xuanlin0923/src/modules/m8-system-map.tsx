import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawLegend,
  drawMiniBars,
  drawSlide,
} from './viz-kit';

// ---------------------------------------------------------------------------
// Module 8.1 — 换掉一个零件，会损失什么 (supervisor–explorer 系统结构)
// The interactive map is kept exactly as before: four roles with directed edges
// (one cycle + one bypass), Canvas hotspots with equivalent DOM buttons, and the
// three configuration chips. What changed is only the drawing: the four abstract
// rounded-rectangle nodes are now four recognisable simple role figures drawn
// from primitives — a lead pathologist with glasses and a head mirror, a smaller
// trainee, a describer holding a report sheet and a reporter holding a pen — and
// a glass slide visibly travels from the highlighted figure to the next role.
// The right side keeps the aggregate ablation `drawMiniBars`
// (0.860 / 0.780 / 0.427). Node names, duties and numbers live in the DOM, never
// as Canvas prose.
// ---------------------------------------------------------------------------

const W = 1080;
const H = 280;

const PULSE_SECONDS = 1.6;

type NodeId = 'supervisor' | 'explorer' | 'pathchat' | 'report';
type Variant = 'full' | 'single-agent' | 'generic-captioner';
type FeedbackCls = '' | 'good' | 'bad';

interface FigureDef {
  id: NodeId;
  /** axis (vertical centre line) of the figure */
  x: number;
  /** 1 = full height lead pathologist, 0.86 = smaller trainee */
  scale: number;
}

/** Four role figures, left to right; 110 px apart, so the hit boxes never touch. */
const FIGURES: FigureDef[] = [
  { id: 'supervisor', x: 100, scale: 1 },
  { id: 'explorer', x: 250, scale: 0.86 },
  { id: 'pathchat', x: 400, scale: 1 },
  { id: 'report', x: 550, scale: 0.94 },
];

const HIT_W = 104;
const FIG_TOP = 52;
const FIG_H = 158;
const FIG_BOTTOM = FIG_TOP + FIG_H;
/** Half-width of a figure's silhouette, used to place the travelling slide. */
const shoulderGap = 40;

/** Which role receives the slide next (the real flow of the system). */
const NEXT_ROLE: Record<NodeId, NodeId> = {
  supervisor: 'explorer',
  explorer: 'pathchat',
  pathchat: 'supervisor',
  report: 'supervisor',
};

const NODE_NAME: Record<NodeId, string> = {
  supervisor: '监督智能体（supervisor）',
  explorer: '探索智能体（explorer）',
  pathchat: 'PathChat+（病理多模态大模型）',
  report: '报告智能体（报告 agent）',
};

interface EdgeDef {
  pts: [number, number][];
  tip: [number, number];
  angle: number;
}

// 0 supervisor→explorer, 1 explorer→pathchat, 2 pathchat→supervisor,
// 3 supervisor→report (bypass above the row).
const EDGES: EdgeDef[] = [
  {
    pts: [
      [158, 132],
      [194, 132],
    ],
    tip: [194, 132],
    angle: 0,
  },
  {
    pts: [
      [304, 132],
      [344, 132],
    ],
    tip: [344, 132],
    angle: 0,
  },
  {
    pts: [
      [438, FIG_BOTTOM],
      [438, 228],
      [100, 228],
      [100, FIG_BOTTOM],
    ],
    tip: [100, FIG_BOTTOM],
    angle: -Math.PI / 2,
  },
  {
    pts: [
      [100, FIG_TOP],
      [100, 30],
      [588, 30],
      [588, FIG_TOP],
    ],
    tip: [588, FIG_TOP],
    angle: Math.PI / 2,
  },
];

const ACTIVE_EDGES: Record<NodeId, number[]> = {
  supervisor: [0, 1, 2],
  explorer: [0, 1],
  pathchat: [1, 2],
  report: [3],
};

/** Real aggregate DDxBench top-1 (N=150) — the two swapped-captioner rows are DOM-only. */
const TOP1: Record<Variant, number> = {
  full: 0.86,
  'single-agent': 0.78,
  'generic-captioner': 0.427,
};

const VARIANT_COLOR: Record<Variant, string> = {
  full: SKIN.green,
  'single-agent': SKIN.blue,
  'generic-captioner': SKIN.red,
};

const VARIANT_TAG: Record<Variant, string> = {
  full: '完整层级',
  'single-agent': '压成单智能体',
  'generic-captioner': '通用描述模型',
};

const VARIANT_ORDER: Variant[] = ['full', 'single-agent', 'generic-captioner'];

interface AblationRow {
  label: string;
  top1: string;
  note: string;
}

/** Aggregate ablation table (paper Results); the label below says it is aggregate. */
const ABLATION: AblationRow[] = [
  { label: '完整层级', top1: '0.860', note: 'supervisor + explorer + PathChat+ + 报告 agent' },
  { label: '压成单 agent', top1: '0.780', note: '−8.00%，p<0.05' },
  { label: '换 PathChat 1', top1: '0.640', note: '把 PathChat+ 描述器换成 PathChat 1' },
  { label: '换通用描述器', top1: '0.427', note: '把 PathChat+ 描述器换成通用多模态模型' },
];

const DUTY: Record<NodeId, string> = {
  supervisor: '负责提出假设、派发带坐标与倍率的任务，并在每轮回报后更新计划。',
  explorer:
    '并行执行任务，通过切片查看接口取图，再让 PathChat+ 描述形态并回报关键 ROI。',
  pathchat: '只做一件事：把一块 ROI 说成可靠的形态学描述。',
  report: '把关键 ROI 的发现合成为可追溯的报告。',
};

const NODE_FEEDBACK: Record<NodeId, string> = {
  supervisor: 'supervisor 负责提出假设、派发带坐标与倍率的任务，并在每轮回报后更新计划。',
  explorer:
    'explorer 并行执行任务，通过切片查看接口取图，再让 PathChat+ 描述形态并回报关键 ROI。',
  pathchat: 'PathChat+ 只做一件事：把一块 ROI 说成可靠的形态学描述。',
  report: '报告 agent 把关键 ROI 的发现合成为可追溯的报告。',
};

/** Feedback keeps the previous wording and now says the numbers are aggregate. */
const VARIANT_FEEDBACK: Record<Variant, { text: string; cls: FeedbackCls }> = {
  full: {
    text: '聚合结果：完整层级 top-1 0.860，分工与病理专用描述都不能省。',
    cls: 'good',
  },
  'single-agent': {
    text: '聚合结果：压成单 agent，top-1 从 0.860 掉到 0.780（−8.00%，p<0.05）。',
    cls: 'bad',
  },
  'generic-captioner': {
    text: '聚合结果：换通用描述器，top-1 只剩 0.427（绝对下降 43.3%，p<0.001）。',
    cls: 'bad',
  },
};

const VARIANT_NOTE: Record<Variant, string> = {
  full: '完整层级：supervisor 规划、explorer 并发取证、PathChat+ 提供描述、报告 agent 汇总。',
  'single-agent': '压成单 agent：没有独立的 supervisor 层，聚合 top-1 落到 0.780。',
  'generic-captioner':
    '通用描述器：把 PathChat+ 换成通用多模态模型，聚合 top-1 落到 0.427。',
};

const BOUNDARY_NOTE =
  '边界：推理型 supervisor 带来的 +4.66% 提升未达显著（p=0.142）。';

const AGGREGATE_NOTE =
  'DDxBench 聚合结果，非本病例单独结果：以下四行都是 150 例聚合的 top-1，原文没有给出逐案例的消融结果。';

const BARS = { x: 720, y: 58, w: 324, h: 158 };

function strokeLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  edge: EdgeDef,
  active: boolean,
  dashed: boolean
): void {
  const color = active ? SKIN.blue : SKIN.axis;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash(dashed ? [7, 5] : []);
  ctx.beginPath();
  edge.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(edge.tip[0], edge.tip[1]);
  ctx.lineTo(
    edge.tip[0] - 10 * Math.cos(edge.angle - 0.42),
    edge.tip[1] - 10 * Math.sin(edge.angle - 0.42)
  );
  ctx.lineTo(
    edge.tip[0] - 10 * Math.cos(edge.angle + 0.42),
    edge.tip[1] - 10 * Math.sin(edge.angle + 0.42)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * One simple human figure per role, drawn only from primitives. `scale` shrinks
 * the trainee; `ink` is the outline colour; `accent` marks the swapped role.
 */
function drawFigure(
  ctx: CanvasRenderingContext2D,
  def: FigureDef,
  ink: string,
  accent: string | null,
  muted: boolean
): void {
  const u = 1 * def.scale;
  const x = def.x;
  const headR = 13 * u;
  const headY = FIG_TOP + headR;
  const neckY = headY + headR;
  const shoulderY = neckY + 10 * u;
  const hipY = shoulderY + 44 * u;
  const footY = FIG_TOP + FIG_H;
  const shoulderW = 21 * u;

  ctx.save();
  ctx.globalAlpha = muted ? 0.34 : 1;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Head, neck and torso.
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.fillStyle = muted ? SKIN.axis : SKIN.paper;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  strokeLine(ctx, x, neckY, x, shoulderY, ink, 2.4);
  strokeLine(ctx, x - shoulderW, shoulderY, x + shoulderW, shoulderY, ink, 2.4);
  strokeLine(ctx, x, shoulderY, x, hipY, ink, 2.4);
  strokeLine(ctx, x - 12 * u, hipY, x, shoulderY, ink, 2.2);
  strokeLine(ctx, x + 12 * u, hipY, x, shoulderY, ink, 2.2);
  strokeLine(ctx, x, hipY, x - 10 * u, footY, ink, 2.2);
  strokeLine(ctx, x, hipY, x + 10 * u, footY, ink, 2.2);

  if (def.id === 'supervisor') {
    // Lead pathologist: a head mirror on the forehead and round glasses.
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(x, headY - headR - 3 * u, 5.5 * u, 0, Math.PI * 2);
    ctx.fillStyle = SKIN.glass;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 5.2 * u, headY + 1.5 * u, 4.4 * u, 0, Math.PI * 2);
    ctx.arc(x + 5.2 * u, headY + 1.5 * u, 4.4 * u, 0, Math.PI * 2);
    ctx.stroke();
    strokeLine(ctx, x - 1 * u, headY + 1.5 * u, x + 1 * u, headY + 1.5 * u, ink, 1.6);
    // Arms carrying the plan out to the sides.
    strokeLine(ctx, x - shoulderW, shoulderY, x - shoulderW - 12 * u, shoulderY + 22 * u, ink, 2.2);
    strokeLine(ctx, x + shoulderW, shoulderY, x + shoulderW + 12 * u, shoulderY + 22 * u, ink, 2.2);
  } else if (def.id === 'explorer') {
    // Trainee: smaller build, one arm forward with a viewing loupe.
    strokeLine(ctx, x + shoulderW, shoulderY, x + shoulderW + 16 * u, shoulderY + 12 * u, ink, 2.2);
    strokeLine(ctx, x - shoulderW, shoulderY, x - shoulderW - 12 * u, shoulderY + 18 * u, ink, 2.2);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x + shoulderW + 22 * u, shoulderY + 15 * u, 5 * u, 0, Math.PI * 2);
    ctx.stroke();
  } else if (def.id === 'pathchat') {
    // Describer: both arms raised holding a report sheet.
    const sheetX = x + shoulderW + 8 * u;
    const sheetY = shoulderY + 4 * u;
    strokeLine(ctx, x + shoulderW, shoulderY, sheetX - 2 * u, sheetY + 8 * u, ink, 2.2);
    strokeLine(ctx, x - shoulderW, shoulderY, sheetX + 2 * u, sheetY + 20 * u, ink, 2.2);
    ctx.save();
    if (muted) ctx.globalAlpha = 0.5;
    drawReport(ctx, sheetX, sheetY, 34 * u, 42 * u, ink, accent);
    ctx.restore();
  } else {
    // Reporter: holds a pen over a short report line.
    const penX = x + shoulderW + 12 * u;
    strokeLine(ctx, x + shoulderW, shoulderY, penX - 4 * u, shoulderY + 16 * u, ink, 2.2);
    strokeLine(ctx, x - shoulderW, shoulderY, x - shoulderW - 10 * u, shoulderY + 20 * u, ink, 2.2);
    ctx.save();
    ctx.translate(penX, shoulderY + 12 * u);
    ctx.rotate(-0.5);
    ctx.fillStyle = SKIN.blue;
    ctx.fillRect(-1.6, -16 * u, 3.2, 26 * u);
    ctx.beginPath();
    ctx.moveTo(-1.6, 10 * u);
    ctx.lineTo(1.6, 10 * u);
    ctx.lineTo(0, 15 * u);
    ctx.closePath();
    ctx.fillStyle = SKIN.text;
    ctx.fill();
    ctx.restore();
    strokeLine(ctx, x - 16 * u, shoulderY + 30 * u, x + 16 * u, shoulderY + 30 * u, SKIN.axis, 1.6);
  }

  ctx.restore();
}

/** A small report sheet held by a figure (distinct from the frozen drawReportSheet). */
function drawReport(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: string,
  accent: string | null
): void {
  ctx.save();
  ctx.fillStyle = SKIN.paper;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent ?? ink;
  ctx.lineWidth = accent ? 2.2 : 1.6;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = SKIN.green;
  ctx.fillRect(x, y, w, Math.max(3, h * 0.14));
  ctx.strokeStyle = SKIN.axis;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i += 1) {
    const ly = y + h * (0.28 + i * 0.16);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.16, ly);
    ctx.lineTo(x + w * (i === 3 ? 0.6 : 0.84), ly);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRole(
  ctx: CanvasRenderingContext2D,
  def: FigureDef,
  selected: boolean,
  removed: boolean,
  swapped: boolean,
  pulse: number
): void {
  const removedInk = SKIN.axis;
  const swappedInk = SKIN.red;
  const ink = removed ? removedInk : swapped ? swappedInk : SKIN.text;

  drawFigure(ctx, def, ink, swapped ? SKIN.red : null, removed);

  if (swapped) {
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = SKIN.red;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(def.x, FIG_TOP + FIG_H / 2, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (selected) {
    const grow = pulse * 7;
    ctx.save();
    ctx.globalAlpha = 0.6 - pulse * 0.4;
    ctx.strokeStyle = SKIN.blue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(def.x, FIG_TOP + FIG_H / 2, 56 + grow, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = SKIN.blue;
    ctx.beginPath();
    ctx.arc(def.x, FIG_TOP + FIG_H / 2, 56 + grow, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function figureAt(x: number, y: number): FigureDef | undefined {
  return FIGURES.find(
    (f) => x >= f.x - HIT_W / 2 && x <= f.x + HIT_W / 2 && y >= FIG_TOP && y <= FIG_BOTTOM
  );
}

export const M8SystemMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ node: NodeId; variant: Variant }>({
    node: 'supervisor',
    variant: 'full',
  });
  const rafRef = useRef<number | null>(null);
  const [node, setNode] = useState<NodeId>('supervisor');
  const [variant, setVariant] = useState<Variant>('full');
  const [feedback, setFeedback] = useState<{ text: string; cls: FeedbackCls }>({
    text: NODE_FEEDBACK.supervisor,
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { node: NodeId; variant: Variant }, t: number) => {
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);

      const pulse = (Math.sin(t * Math.PI * 2) + 1) / 2;
      const active = ACTIVE_EDGES[s.node];
      EDGES.forEach((edge, i) => {
        const dashed = s.variant === 'single-agent' && (i === 0 || i === 1);
        drawEdge(ctx, edge, active.indexOf(i) >= 0, dashed);
      });

      FIGURES.forEach((f) => {
        const removed = s.variant === 'single-agent' && f.id === 'supervisor';
        const swapped = s.variant === 'generic-captioner' && f.id === 'pathchat';
        drawRole(ctx, f, f.id === s.node, removed, swapped, pulse);
      });

      // The glass slide travels from the highlighted role to the next role on
      // the round trip, so the specimen flow is visible without any prose.
      const from = FIGURES.find((f) => f.id === s.node);
      const to = FIGURES.find((f) => f.id === NEXT_ROLE[s.node]);
      if (from !== undefined && to !== undefined && to.id !== from.id) {
        const travel = (Math.sin(t * Math.PI * 2) + 1) / 2;
        const sx = from.x + shoulderGap + (to.x - from.x - 2 * shoulderGap) * travel;
        const sy = FIG_TOP + 74 - Math.sin(t * Math.PI * 2) * 5;
        ctx.save();
        ctx.globalAlpha = s.variant === 'single-agent' && from.id === 'supervisor' ? 0.35 : 1;
        drawSlide(ctx, sx, sy, 62, 24, { tissue: 'section' });
        ctx.restore();
      }

      drawLabel(ctx, 60, 20, VARIANT_TAG[s.variant], SKIN.text, 14);
      if (s.variant === 'generic-captioner') {
        drawLabel(ctx, 458, 72, '通用', SKIN.red, 14);
      }

      // Right: the aggregate top-1 comparison, stable row order
      // (full / single agent / generic). PathChat 1 (0.640) is DOM-only.
      const rowIndex = VARIANT_ORDER.indexOf(s.variant);
      const slot = BARS.h / VARIANT_ORDER.length;
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = VARIANT_COLOR[s.variant];
      ctx.fillRect(BARS.x - 6, BARS.y + slot * rowIndex + 4, BARS.w + 4, slot - 8);
      ctx.restore();

      drawMiniBars(
        ctx,
        BARS.x,
        BARS.y,
        BARS.w,
        BARS.h,
        [
          { value: TOP1.full, color: SKIN.green },
          { value: TOP1['single-agent'], color: SKIN.blue },
          { value: TOP1['generic-captioner'], color: SKIN.red },
        ],
        1
      );

      drawLegend(ctx, 724, 248, [
        { label: '完整层级', color: SKIN.green },
        { label: '单个智能体', color: SKIN.blue },
        { label: '通用描述', color: SKIN.red },
      ]);
    };

    const tick = () => {
      const t = ((performance.now() / 1000) % PULSE_SECONDS) / PULSE_SECONDS;
      render(stateRef.current, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const chooseNode = (id: NodeId): void => {
    stateRef.current.node = id;
    setNode(id);
    setFeedback({ text: NODE_FEEDBACK[id], cls: '' });
  };

  const chooseVariant = (next: Variant): void => {
    stateRef.current.variant = next;
    setVariant(next);
    setFeedback(VARIANT_FEEDBACK[next]);
  };

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    const hit = figureAt(x, y);
    if (hit) chooseNode(hit.id);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        <label>节点</label>
        {FIGURES.map((f) => (
          <button
            key={f.id}
            type="button"
            className={f.id === node ? 'chip selected' : 'chip'}
            aria-pressed={f.id === node}
            onClick={() => chooseNode(f.id)}
          >
            {NODE_NAME[f.id]}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>消融配置</label>
        <button
          type="button"
          className={variant === 'full' ? 'chip selected' : 'chip'}
          aria-pressed={variant === 'full'}
          onClick={() => chooseVariant('full')}
        >
          完整层级
        </button>
        <button
          type="button"
          className={variant === 'single-agent' ? 'chip selected' : 'chip'}
          aria-pressed={variant === 'single-agent'}
          onClick={() => chooseVariant('single-agent')}
        >
          压成单 agent
        </button>
        <button
          type="button"
          className={variant === 'generic-captioner' ? 'chip selected' : 'chip'}
          aria-pressed={variant === 'generic-captioner'}
          onClick={() => chooseVariant('generic-captioner')}
        >
          通用 captioner
        </button>
      </div>

      <div className="hotspot-info">
        <div>
          <strong>{NODE_NAME[node]}</strong>：{DUTY[node]}
        </div>
        <div>{VARIANT_NOTE[variant]}</div>
        <div>当前配置聚合 top-1：{TOP1[variant].toFixed(3)}</div>
        <div>{BOUNDARY_NOTE}</div>
      </div>

      <div className="step-desc">{AGGREGATE_NOTE}</div>
      <div className="metrics">
        {ABLATION.map((row) => (
          <div className="metric" key={row.label}>
            <div className="l">{row.label}</div>
            <div className="v">{row.top1}</div>
            <div>{row.note}</div>
          </div>
        ))}
      </div>

      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M8SystemMap;
