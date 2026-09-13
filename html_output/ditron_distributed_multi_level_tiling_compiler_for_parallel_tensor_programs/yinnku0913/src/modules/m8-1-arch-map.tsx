import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, dTileGround, dHand, dLabel, dLegend } from './ditron-theme-kit';

// §8 Module 8.1 — the interactive compiler-architecture map.
// Front-end / middle-end / back-end sit side by side. Clicking a stage (on the
// Canvas or through its DOM chip) moves the highlight, lights the flow path that
// belongs to that stage, writes the stage's input / artifact / mechanism into the
// stable detail region below the Canvas and updates the feedback line. The one flow
// that cannot exist — 分布式语义 → TTIR/TTGIR — is drawn red with a prohibition
// slash. Seven DOM chips mirror every Canvas hotspot, so the map stays keyboard
// reachable; no part of the explanation is tooltip-only.

const W = 1080;
const H = 280;
const HIT_TOL = 8;

type NodeId = 'interfaces' | 'frontend' | 'middle' | 'backend' | 'ttgir' | 'distir' | 'llvm';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface NodeDef {
  id: NodeId;
  chip: string;
  canvasName: string;
  box: string;
  canvasArtifact: string;
  input: string;
  artifact: string;
  detail: string;
  mechanism: string;
  rect: Rect;
  container: boolean;
}

interface ArchState {
  node: NodeId;
  invalidFlow: boolean;
}

interface EdgeDef {
  id: string;
  points: [number, number][];
}

const NODES: NodeDef[] = [
  {
    id: 'interfaces',
    chip: '三级接口',
    canvasName: '三级接口',
    box: '三级接口',
    canvasArtifact: '算子程序',
    input: '算子程序',
    artifact: '三级接口',
    detail: '算子程序 → 三级接口（核级 / 设备级 / 任务级）',
    mechanism:
      '用户用 Triton 风格的三级接口描述算子：核级用静态形状的砖（例如 128×128）、设备级以 chunk 为单位走 DMA 语义、任务级把整个负载当作任务 DAG。',
    rect: { x: 46, y: 46, w: 172, h: 36 },
    container: false,
  },
  {
    id: 'frontend',
    chip: '前端',
    canvasName: '前端',
    box: '前端',
    canvasArtifact: '两类 IR',
    input: '三级接口',
    artifact: '两类 IR',
    detail: '三级接口 → TTIR/TTGIR · 分布式中间表示',
    mechanism:
      '前端把单设备语义（dot、load/store）下沉到 TTIR 与 TTGIR，把分布式语义下沉到遵循 OpenSHMEM 的分布式中间表示。',
    rect: { x: 32, y: 32, w: 200, h: 184 },
    container: true,
  },
  {
    id: 'ttgir',
    chip: 'TTIR/TTGIR',
    canvasName: 'TTIR',
    box: 'TTIR/TTGIR',
    canvasArtifact: 'TTIR',
    input: 'dot / load',
    artifact: 'TTIR/TTGIR',
    detail: 'dot / load/store → TTIR/TTGIR（单设备语义）',
    mechanism:
      '只承接 dot、load/store 这类单设备语义与静态形状的砖（例如 128×128），直通张量核心与 TMA；它不承接分布式语义。',
    rect: { x: 46, y: 104, w: 78, h: 40 },
    container: false,
  },
  {
    id: 'distir',
    chip: '分布式 IR',
    canvasName: '分布式IR',
    box: '分布式 IR',
    canvasArtifact: '分布式 IR',
    input: 'wait / putmem',
    artifact: '分布式 IR',
    detail: 'wait / notify / putmem → 分布式中间表示（OpenSHMEM 语义）',
    mechanism:
      '遵循 OpenSHMEM 语义，是 putmem、getmem、symm_at 等分布式原语的落脚点，随后由中端注入 swizzle 重排。',
    rect: { x: 140, y: 104, w: 78, h: 40 },
    container: false,
  },
  {
    id: 'middle',
    chip: '中端 swizzle',
    canvasName: '中端',
    box: '中端',
    canvasArtifact: 'new_pid',
    input: '两类 IR',
    artifact: 'new_pid',
    detail: '两类中间表示 → new_pid（重排后的执行编号）',
    mechanism:
      '注入 swizzle，把 old_pid 换成 new_pid，起铺点为 rank mod local_world_size，并做系统感知优化（收集模式 / 分发模式）。',
    rect: { x: 262, y: 32, w: 200, h: 184 },
    container: true,
  },
  {
    id: 'backend',
    chip: '后端',
    canvasName: '后端',
    box: '后端',
    canvasArtifact: 'LLVM IR',
    input: '分布式 IR',
    artifact: 'LLVM IR',
    detail: '分布式中间表示 → LLVM IR',
    mechanism:
      '把分布式中间表示降到 LLVM IR，用 CallExtern 链接 NVSHMEM 或 rocSHMEM；移植新后端只需实例化原语并补充代码生成规则。',
    rect: { x: 492, y: 32, w: 200, h: 184 },
    container: true,
  },
  {
    id: 'llvm',
    chip: 'LLVM + CallExtern',
    canvasName: 'LLVM',
    box: 'LLVM',
    canvasArtifact: '可执行核',
    input: 'LLVM IR',
    artifact: '可执行核',
    detail: 'LLVM IR → 可执行核（CallExtern 链接厂商 SHMEM 库）',
    mechanism:
      '链接厂商 SHMEM 库；目前支持 5 种以上 GPU 与 NVLink/xGMI/PCIe/IB，是这套可移植性的出口。',
    rect: { x: 506, y: 134, w: 172, h: 40 },
    container: false,
  },
];

// 原语库 is the auxiliary mechanism: drawn in the auxiliary colour, never selectable.
const AUX_BOX: Rect = { x: 506, y: 56, w: 172, h: 36 };

const EDGES: EdgeDef[] = [
  { id: 'if-ttgir', points: [[86, 82], [86, 104]] },
  { id: 'if-distir', points: [[179, 82], [179, 104]] },
  { id: 'ttgir-mid', points: [[85, 144], [85, 182], [262, 182]] },
  { id: 'distir-mid', points: [[179, 144], [179, 164], [262, 164]] },
  { id: 'mid-back', points: [[462, 108], [492, 108]] },
  { id: 'back-llvm', points: [[592, 92], [592, 134]] },
];

// The flow that does not exist: 分布式语义 → TTIR/TTGIR.
const BACKFLOW: [number, number][] = [[179, 104], [179, 88], [120, 88], [120, 104]];

const PATHS: Record<NodeId, string[]> = {
  interfaces: ['if-ttgir', 'if-distir'],
  frontend: ['if-ttgir', 'if-distir', 'ttgir-mid', 'distir-mid'],
  ttgir: ['if-ttgir', 'ttgir-mid'],
  distir: ['if-distir', 'distir-mid'],
  middle: ['ttgir-mid', 'distir-mid', 'mid-back'],
  backend: ['ttgir-mid', 'distir-mid', 'mid-back', 'back-llvm'],
  llvm: ['ttgir-mid', 'distir-mid', 'mid-back', 'back-llvm'],
};

const PATH_LABEL: Record<NodeId, string> = {
  interfaces: '算子程序 → 三级接口',
  frontend: '三级接口 → 前端 → TTIR/TTGIR · 分布式 IR',
  ttgir: '三级接口 → 前端 → TTIR/TTGIR',
  distir: '三级接口 → 前端 → 分布式 IR → 中端',
  middle: '三级接口 → 前端 → 中端 → 后端 → LLVM',
  backend: '三级接口 → 前端 → 中端 → 后端',
  llvm: '三级接口 → 前端 → 中端 → 后端 → LLVM',
};

// Stage messages. 后端 gets the portability conclusion (green) instead, so its
// mechanism sentence lives in the detail region of the node definition above.
type StageNodeId = Exclude<NodeId, 'backend'>;

const NODE_TEXT: Record<StageNodeId, string> = {
  interfaces: '三级接口：核级、设备级、任务级三层，用户用 Triton 风格的程序描述算子。',
  frontend: '前端：单设备语义下沉到 TTIR 与 TTGIR，分布式语义下沉到分布式中间表示。',
  middle: '中端：注入 swizzle，把 old_pid 换成 new_pid，并做系统感知优化（收集/分发模式）。',
  ttgir: 'TTIR/TTGIR：只承接单设备语义，如 dot、load/store、静态形状的砖（例如 128×128）。',
  distir: '分布式中间表示：遵循 OpenSHMEM 语义，是 putmem/getmem/symm_at 等原语的落脚点。',
  llvm: 'LLVM + CallExtern：链接厂商 SHMEM 库；目前支持 5 种以上 GPU 与 NVLink/xGMI/PCIe/IB。',
};

const BACKEND_GOOD =
  '后端是这套可移植性的出口：移植新后端只需实例化硬件无关原语并补充代码生成规则，无需重写上层程序。';

const BAD_FLOW =
  '分布式语义不能走 TTIR/TTGIR：它们只承接单设备语义（dot、load/store），分布式原语必须走遵循 OpenSHMEM 的分布式中间表示。';

const ROW_A: NodeId[] = ['interfaces', 'frontend', 'middle', 'backend'];
const ROW_B: NodeId[] = ['ttgir', 'distir', 'llvm'];

function nodeById(id: NodeId): NodeDef {
  const found = NODES.find((n) => n.id === id);
  return found ?? NODES[0];
}

function feedbackFor(s: ArchState): { text: string; cls: string } {
  if (s.invalidFlow) return { text: BAD_FLOW, cls: 'bad' };
  if (s.node === 'backend') return { text: BACKEND_GOOD, cls: 'good' };
  return { text: NODE_TEXT[s.node], cls: '' };
}

function rrPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/** Small structural diagram text (node and container names) — ≤ 13 px. */
function boxText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  color: string,
  size: number
): void {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, cx, cy + size * 0.35);
  ctx.textAlign = 'left';
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  width: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p[0], p[1]);
    else ctx.lineTo(p[0], p[1]);
  });
  ctx.stroke();
  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : last;
  const ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(last[0], last[1]);
  ctx.lineTo(last[0] - Math.cos(ang - 0.45) * 9, last[1] - Math.sin(ang - 0.45) * 9);
  ctx.lineTo(last[0] - Math.cos(ang + 0.45) * 9, last[1] - Math.sin(ang + 0.45) * 9);
  ctx.closePath();
  ctx.fill();
}

/** Canvas hit test in intrinsic 1080 × 280 coordinates; inner nodes win over containers. */
function nodeAt(x: number, y: number): NodeId | null {
  let found: NodeId | null = null;
  let best = Number.MAX_VALUE;
  for (let i = 0; i < NODES.length; i += 1) {
    const n = NODES[i];
    const r = n.rect;
    const inside =
      x >= r.x - HIT_TOL &&
      x <= r.x + r.w + HIT_TOL &&
      y >= r.y - HIT_TOL &&
      y <= r.y + r.h + HIT_TOL;
    if (!inside) continue;
    const weight = n.container ? r.w * r.h * 2 : r.w * r.h;
    if (weight < best) {
      best = weight;
      found = n.id;
    }
  }
  return found;
}

export const M81ArchMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ArchState>({ node: 'frontend', invalidFlow: false });
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<ArchState>(stateRef.current);

  const def = nodeById(state.node);
  const fb = feedbackFor(state);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: ArchState, time: number): void => {
      const sel = nodeById(s.node);
      const active = PATHS[s.node];
      const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 4.5));

      dTileGround(ctx, W, H);

      // flow lines (active path in the guidance colour, 3 px)
      for (let i = 0; i < EDGES.length; i += 1) {
        const e = EDGES[i];
        const on = active.indexOf(e.id) >= 0;
        drawArrow(ctx, e.points, on ? KIT.guidance : KIT.border, on ? 3 : 2);
      }

      // the flow that must not exist
      drawArrow(ctx, BACKFLOW, s.invalidFlow ? KIT.failure : KIT.border, s.invalidFlow ? 3 : 2);
      if (s.invalidFlow) {
        ctx.strokeStyle = KIT.failure;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(144, 81);
        ctx.lineTo(156, 95);
        ctx.stroke();
      }

      // containers + node boxes
      for (let i = 0; i < NODES.length; i += 1) {
        const n = NODES[i];
        const r = n.rect;
        const on = s.node === n.id;
        if (on) {
          ctx.globalAlpha = 0.06;
          ctx.fillStyle = KIT.guidance;
          rrPath(ctx, r.x, r.y, r.w, r.h, n.container ? 10 : 6);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (!n.container) {
          ctx.fillStyle = KIT.quiet;
          rrPath(ctx, r.x, r.y, r.w, r.h, 6);
          ctx.fill();
        }
        ctx.strokeStyle = on ? KIT.guidance : KIT.border;
        ctx.lineWidth = on ? 3 : 2;
        rrPath(ctx, r.x, r.y, r.w, r.h, n.container ? 10 : 6);
        ctx.stroke();
        if (on) {
          ctx.globalAlpha = pulse;
          ctx.strokeStyle = KIT.guidance;
          ctx.lineWidth = 2;
          rrPath(ctx, r.x - 5, r.y - 5, r.w + 10, r.h + 10, n.container ? 12 : 8);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (n.container) {
          boxText(ctx, n.canvasName, r.x + r.w / 2, 16, on ? KIT.guidance : KIT.muted, 13);
        } else {
          boxText(ctx, n.box, r.x + r.w / 2, r.y + r.h / 2 - 7, on ? KIT.text : KIT.muted, 12);
        }
      }

      // auxiliary mechanism: the primitive library (never the guidance colour)
      ctx.fillStyle = KIT.quiet;
      rrPath(ctx, AUX_BOX.x, AUX_BOX.y, AUX_BOX.w, AUX_BOX.h, 6);
      ctx.fill();
      ctx.strokeStyle = KIT.auxiliary;
      ctx.lineWidth = 2;
      rrPath(ctx, AUX_BOX.x, AUX_BOX.y, AUX_BOX.w, AUX_BOX.h, 6);
      ctx.stroke();
      boxText(
        ctx,
        '原语库',
        AUX_BOX.x + AUX_BOX.w / 2,
        AUX_BOX.y + AUX_BOX.h / 2 - 7,
        KIT.auxiliary,
        12
      );

      // the hand points at whichever stage is selected
      dHand(ctx, 56, 206, time, KIT.text);
      ctx.strokeStyle = KIT.support;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(84, 200);
      ctx.lineTo(sel.rect.x + 12, sel.rect.y + sel.rect.h);
      ctx.stroke();

      dLabel(ctx, `节点 ${sel.canvasName}`, 32, 256, KIT.text);
      dLabel(ctx, `产物 ${sel.canvasArtifact}`, 232, 256, KIT.muted);
      dLegend(
        ctx,
        [
          { color: KIT.muted, text: '单设备语义' },
          { color: KIT.auxiliary, text: '分布式语义' },
          { color: KIT.text, text: '代码生成' },
        ],
        660,
        256
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(stateRef.current, 0);
    canvas.classList.add('is-ready');

    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      render(stateRef.current, (now - t0) / 1000);
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

  const select = (id: NodeId): void => {
    const next: ArchState = { node: id, invalidFlow: stateRef.current.invalidFlow };
    stateRef.current = next;
    setState(next);
  };

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) * W) / rect.width, 0, W);
    const y = clamp(((e.clientY - rect.top) * H) / rect.height, 0, H);
    const hit = nodeAt(x, y);
    if (hit) select(hit);
  };

  const onChipClick = (id: NodeId) => (): void => select(id);

  const onToggleInvalid = (): void => {
    const next: ArchState = {
      node: stateRef.current.node,
      invalidFlow: !stateRef.current.invalidFlow,
    };
    stateRef.current = next;
    setState(next);
  };

  const onReset = (): void => {
    const next: ArchState = { node: 'frontend', invalidFlow: false };
    stateRef.current = next;
    setState(next);
  };

  const chipButton = (id: NodeId) => {
    const n = nodeById(id);
    return (
      <button
        key={id}
        type="button"
        className={state.node === id ? 'chip selected' : 'chip'}
        aria-pressed={state.node === id}
        onClick={onChipClick(id)}
      >
        {n.chip}
      </button>
    );
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onPointerDown={onCanvasPointerDown}
      />
      <div className="chip-row">{ROW_A.map(chipButton)}</div>
      <div className="chip-row">{ROW_B.map(chipButton)}</div>
      <div className="chip-row">
        <button
          type="button"
          className={state.invalidFlow ? 'chip selected' : 'chip'}
          aria-pressed={state.invalidFlow}
          onClick={onToggleInvalid}
        >
          分布式语义 → TTIR/TTGIR？
        </button>
        <button type="button" className="chip" aria-pressed={false} onClick={onReset}>
          恢复默认视图
        </button>
      </div>
      <div className="step-desc">{def.detail}</div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前节点</div>
          <div className="v">{def.chip}</div>
        </div>
        <div className="metric">
          <div className="l">输入</div>
          <div className="v">{def.input}</div>
        </div>
        <div className="metric">
          <div className="l">产物 / 形状</div>
          <div className="v">{def.artifact}</div>
        </div>
      </div>
      <div className="step-desc">路径：{PATH_LABEL[state.node]}</div>
      <div className="step-desc">关键机制：{def.mechanism}</div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M81ArchMap;
