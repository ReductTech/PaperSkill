import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 模块 3.1「给产物连一条关系边」（1080×280，拖拽连线 + 五个关系类型 chip）
// 命名区域：scene（x 0–330，织片与线结）、graph（x 360–1060，四个节点卡片与边）。
// 边颜色按类型取自语义色：参考使用=蓝、版本谱系=紫、生成依赖=橙、分组=灰蓝、工作流延续=棕。
// 关系类型严格对齐论文 p.4 §2.2 公式(1) 的 R；论文未讨论成环，故不做成环校验。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN = '#b8c9a7';
const YARN_DEEP = '#76906a';
const RED = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const INK = '#21324a';
const SUB = '#68778f';
const WOOD = '#92400e';

type Relation = 'ref' | 'lineage' | 'dep' | 'group' | 'flow';

interface RelationDef {
  id: Relation;
  name: string;
  color: string;
}

// 论文 p.4 §2.2 公式(1) 的 R 共列 5 种关系，此处逐一对齐：
// reference use / version lineage / generation dependency / grouping / workflow continuation
const RELS: RelationDef[] = [
  { id: 'ref', name: '参考使用', color: BLUE },
  { id: 'lineage', name: '版本谱系', color: PURPLE },
  { id: 'dep', name: '生成依赖', color: ORANGE },
  { id: 'group', name: '分组', color: SUB },
  { id: 'flow', name: '工作流延续', color: WOOD },
];

interface NodeBox {
  id: string;
  name: string;
  x: number;
  y: number;
}

const NODE_W = 140;
const NODE_H = 56;

const NODES: NodeBox[] = [
  { id: 'ref1', name: '参考图', x: 360, y: 60 },
  { id: 'draft', name: '草稿', x: 560, y: 170 },
  { id: 'candA', name: '候选 A', x: 800, y: 40 },
  { id: 'candB', name: '候选 B', x: 800, y: 180 },
];

interface Edge {
  from: string;
  to: string;
  rel: Relation;
}

interface EdgeState {
  edges: Edge[];
  rel: Relation;
  dragFrom: string | null;
  pointer: { x: number; y: number } | null;
  last: { from: string; to: string } | null;
  flash: { to: string; at: number } | null;
  knotAt: number;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, 186, W, H - 186);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 186);
  ctx.lineTo(W, 186);
  ctx.stroke();
}

function nodeById(id: string): NodeBox {
  return NODES.find((n) => n.id === id) ?? NODES[0];
}

function centerOf(n: NodeBox): { x: number; y: number } {
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
}

function relOf(id: Relation): RelationDef {
  return RELS.find((r) => r.id === id) ?? RELS[0];
}

function nodeAt(x: number, y: number): string | null {
  for (const n of NODES) {
    if (x >= n.x && x <= n.x + NODE_W && y >= n.y && y <= n.y + NODE_H) return n.id;
  }
  return null;
}

function reachableFrom(edges: Edge[], start: string): Set<string> {
  const seen = new Set<string>();
  const queue: string[] = [start];
  while (queue.length > 0) {
    const cur = queue.shift() as string;
    for (const e of edges) {
      if (e.from === cur && !seen.has(e.to)) {
        seen.add(e.to);
        queue.push(e.to);
      }
    }
  }
  return seen;
}

function edgeEnds(a: NodeBox, b: NodeBox): { x1: number; y1: number; x2: number; y2: number } {
  const ca = centerOf(a);
  const cb = centerOf(b);
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tx = NODE_W / 2 / (Math.abs(ux) < 1e-6 ? 1e-6 : Math.abs(ux));
  const ty = NODE_H / 2 / (Math.abs(uy) < 1e-6 ? 1e-6 : Math.abs(uy));
  const t = Math.min(tx, ty) + 2;
  return { x1: ca.x + ux * t, y1: ca.y + uy * t, x2: cb.x - ux * t, y2: cb.y - uy * t };
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / l2, 0, 1);
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, ux: number, uy: number, size: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - ux * size - uy * size * 0.5, y - uy * size + ux * size * 0.5);
  ctx.lineTo(x - ux * size + uy * size * 0.5, y - uy * size - ux * size * 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.46);
  ctx.quadraticCurveTo(cx - s * 0.18, cy + s * 0.34, cx, cy + s * 0.5);
  ctx.quadraticCurveTo(cx + s * 0.18, cy + s * 0.34, cx + s * 0.5, cy - s * 0.46);
  ctx.stroke();
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = YARN;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * r * 0.52, cy - r * 1.05, r * 1.12, 0.34 * Math.PI, 0.66 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const items = [RELS[0], RELS[1], RELS[2]];
  let cx = x;
  ctx.save();
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 11, 16, 12);
    ctx.fillStyle = SUB;
    ctx.fillText(it.name, cx + 22, y);
    cx += 22 + it.name.length * 16 + 18;
  });
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, s: EdgeState, time: number): void {
  // 织片
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      drawKnit(ctx, 48 + col * 26 + 13, 96 + row * 20 + 10, 18, BLUE, 3);
    }
  }
  // 线头连到结上
  ctx.save();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(150, 130);
  ctx.quadraticCurveTo(196, 138, 232, 126);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(268, 124);
  ctx.quadraticCurveTo(292, 150, 288, 202);
  ctx.stroke();
  ctx.restore();

  // 线结：建立边时收紧一次
  const kt = clamp((time - s.knotAt) / 600, 0, 1);
  const kr = 16 - 8 * kt + Math.sin(kt * Math.PI) * 3;
  ctx.save();
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(250, 125, kr, kr * 0.66, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = YARN_DEEP;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(250, 125, kr * 0.52, kr * 0.34, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawBall(ctx, 288, 210, 22);
}

function drawGraph(ctx: CanvasRenderingContext2D, s: EdgeState, time: number): void {
  const highlightNodes = new Set<string>();
  if (s.last) {
    highlightNodes.add(s.last.from);
    reachableFrom(s.edges, s.last.from).forEach((id) => highlightNodes.add(id));
  }

  // 节点卡片底板
  NODES.forEach((n) => {
    const orphan = n.id !== 'ref1' && !s.edges.some((e) => e.to === n.id);
    const highlighted = highlightNodes.has(n.id);
    const isLast = s.last !== null && (s.last.from === n.id || s.last.to === n.id);
    const dragging = s.dragFrom === n.id;

    let ox = 0;
    let oy = 0;
    if (dragging && s.pointer) {
      const c = centerOf(n);
      ox = clamp((s.pointer.x - c.x) * 0.12, -16, 16);
      oy = clamp((s.pointer.y - c.y) * 0.12, -16, 16);
    }

    ctx.save();
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, n.x + ox, n.y + oy, NODE_W, NODE_H, 8);
    ctx.fill();

    if (isLast) {
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
    } else if (highlighted) {
      ctx.strokeStyle = 'rgba(39,68,110,0.55)';
      ctx.lineWidth = 3;
    } else if (orphan) {
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
    } else {
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
    }
    roundRectPath(ctx, n.x + ox, n.y + oy, NODE_W, NODE_H, 8);
    ctx.stroke();
    ctx.restore();

    if (highlighted) {
      ctx.save();
      ctx.shadowColor = 'rgba(39,68,110,0.45)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(39,68,110,0.5)';
      ctx.lineWidth = 3;
      roundRectPath(ctx, n.x + ox, n.y + oy, NODE_W, NODE_H, 8);
      ctx.stroke();
      ctx.restore();
    }

    const flashOn = s.flash !== null && s.flash.to === n.id && time - s.flash.at < 300;
    if (flashOn) {
      ctx.save();
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
      roundRectPath(ctx, n.x + ox - 5, n.y + oy - 5, NODE_W + 10, NODE_H + 10, 10);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = INK;
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(n.name, n.x + ox + NODE_W / 2, n.y + oy + NODE_H / 2 + 7);
    ctx.restore();

    if (orphan) {
      ctx.save();
      ctx.fillStyle = RED;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('孤立', n.x + ox + NODE_W - 10, n.y + oy + NODE_H - 9);
      ctx.restore();
    }
  });

  // 边：先画未被点亮的灰色边，再画点亮的有向边
  const litEdges = s.edges.filter(
    (e) => highlightNodes.has(e.from) && highlightNodes.has(e.to) && s.last !== null
  );
  const dimEdges = s.edges.filter((e) => litEdges.indexOf(e) < 0);

  dimEdges.forEach((e) => {
    const p = edgeEnds(nodeById(e.from), nodeById(e.to));
    ctx.save();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.lineTo(p.x2, p.y2);
    ctx.stroke();
    ctx.restore();
  });

  litEdges.forEach((e) => {
    const def = relOf(e.rel);
    const p = edgeEnds(nodeById(e.from), nodeById(e.to));
    ctx.save();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.lineTo(p.x2, p.y2);
    ctx.stroke();
    const dx = p.x2 - p.x1;
    const dy = p.y2 - p.y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.fillStyle = def.color;
    arrow(ctx, p.x2, p.y2, dx / len, dy / len, 12);
    ctx.restore();

    // 中点类型标签
    const mx = (p.x1 + p.x2) / 2;
    const my = (p.y1 + p.y2) / 2;
    ctx.save();
    ctx.font = '16px "Segoe UI", sans-serif';
    const tw = def.name.length * 16 + 12;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRectPath(ctx, mx - tw / 2, my - 20, tw, 20, 4);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.textAlign = 'center';
    ctx.fillText(def.name, mx, my - 5);
    ctx.restore();
  });

  // 拖拽预览
  if (s.dragFrom && s.pointer) {
    const c = centerOf(nodeById(s.dragFrom));
    const tgt = nodeAt(s.pointer.x, s.pointer.y);
    ctx.save();
    ctx.strokeStyle = relOf(s.rel).color;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(s.pointer.x, s.pointer.y);
    ctx.stroke();
    ctx.restore();
    if (tgt && tgt !== s.dragFrom) {
      const n = nodeById(tgt);
      ctx.save();
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
      roundRectPath(ctx, n.x - 5, n.y - 5, NODE_W + 10, NODE_H + 10, 10);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function render(ctx: CanvasRenderingContext2D, s: EdgeState, time: number): void {
  clearScene(ctx);
  drawScene(ctx, s, time);
  drawGraph(ctx, s, time);
  drawLabel(ctx, '织片与线结', 36, 62, INK);
  drawLabel(ctx, '产物与依赖', 380, 30, INK);
  drawLegend(ctx, 420, 262);
}

function okFeedback(rel: Relation): { text: string; cls: string } {
  if (rel === 'ref') {
    return { text: '依赖链打通：从参考到下游产物可以一路追溯。', cls: 'good' };
  }
  if (rel === 'lineage') {
    return { text: '版本谱系已写下：这一支是原有产物的另一版，原版仍然保留。', cls: 'good' };
  }
  if (rel === 'dep') {
    return { text: '生成依赖已写下：上游一旦改变，下游需要重新生成。', cls: 'good' };
  }
  if (rel === 'flow') {
    return { text: '工作流延续已写下：这一步是在前一步之后接着进行的。', cls: 'good' };
  }
  return { text: '分组关系已写下：它们属于同一组，但不表示先后依赖。', cls: 'good' };
}

const ISOLATED = { text: '这些产物彼此孤立：没人知道哪张参考影响了哪张草稿。', cls: 'bad' };
const EMPTY_AGAIN = { text: '又回到孤立状态，复用与追溯都失去了依据。', cls: 'bad' };

export const Ch3Edge: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<EdgeState>({
    edges: [],
    rel: 'ref',
    dragFrom: null,
    pointer: null,
    last: null,
    flash: null,
    knotAt: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [rel, setRel] = useState<Relation>('ref');
  const [feedback, setFeedback] = useState(ISOLATED);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      render(ctx, stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -1, y: -1 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    const id = nodeAt(p.x, p.y);
    if (id) {
      stateRef.current.dragFrom = id;
      stateRef.current.pointer = p;
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    // 点击已有边即删除
    const edgesNow = stateRef.current.edges;
    for (let i = 0; i < edgesNow.length; i++) {
      const edge = edgesNow[i];
      const q = edgeEnds(nodeById(edge.from), nodeById(edge.to));
      if (distToSegment(p.x, p.y, q.x1, q.y1, q.x2, q.y2) < 9) {
        const next = edgesNow.filter((_, k) => k !== i);
        stateRef.current.edges = next;
        if (stateRef.current.last && (stateRef.current.last.from === edge.from || stateRef.current.last.to === edge.to)) {
          stateRef.current.last = null;
        }
        setEdges(next);
        setFeedback(next.length === 0 ? EMPTY_AGAIN : { text: '这条边已删除：剩余关系仍然可以被追溯。', cls: '' });
        return;
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    if (stateRef.current.dragFrom) stateRef.current.pointer = p;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.dragFrom) return;
    const p = toLocal(e);
    const from = s.dragFrom;
    const to = nodeAt(p.x, p.y);
    s.dragFrom = null;
    s.pointer = null;

    if (!to || to === from) return;

    // 论文未讨论关系边是否允许成环，因此不做成环校验，也不宣称画布拒绝成环。
    if (s.edges.some((ed) => ed.from === from && ed.to === to && ed.rel === s.rel)) {
      setFeedback({ text: '这条边已经存在，重复写入不会带来新的可追溯信息。', cls: 'orange' });
      return;
    }

    const next: Edge[] = s.edges.concat([{ from, to, rel: s.rel }]);
    s.edges = next;
    s.last = { from, to };
    s.flash = { to, at: performance.now() };
    s.knotAt = performance.now();
    setEdges(next);
    setFeedback(okFeedback(s.rel));
  };

  const pickRel = (id: Relation) => {
    stateRef.current.rel = id;
    setRel(id);
  };

  const reachableCount = stateRef.current.last
    ? reachableFrom(edges, stateRef.current.last.from).size + 1
    : 0;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="chip-row">
        {RELS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`chip${rel === r.id ? ' selected' : ''}`}
            onClick={() => pickRel(r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">关系边数</div>
          <div className="v">{edges.length}</div>
        </div>
        <div className="metric">
          <div className="l">当前边类型</div>
          <div className="v">{relOf(rel).name}</div>
        </div>
        <div className="metric">
          <div className="l">点亮的下游节点</div>
          <div className="v">{reachableCount} 个</div>
        </div>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        style={feedback.cls === 'orange' ? { color: ORANGE } : undefined}
      >
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch3Edge;
