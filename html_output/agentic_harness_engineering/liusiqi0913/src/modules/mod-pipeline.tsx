import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 module mod-pipeline (P5 clickable hotspots): AHE 五节点闭环图（对应论文 Figure 2）。
// 点击节点/chip → 高亮 + 活跃出边虚线流动 + 档案区刷新。1080x280。
const W = 1080;
const H = 280;

const BG = '#f4f6f8';
const TEXT = '#21324a';
const MUTED = '#68778f';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const BORDER = '#d7deea';

type NodeId = 'workspace' | 'rollout' | 'debugger' | 'evolve' | 'attribute';

interface PipeNode {
  id: NodeId;
  name: string;
  angle: number; // position on the ellipse (rad)
  color: string;
  duty: string;
  input: string;
  output: string;
  scale: string;
  feedback: { text: string; cls: string };
}

const NODES: PipeNode[] = [
  {
    id: 'workspace',
    name: 'Harness 工作区',
    angle: -Math.PI / 2,
    color: PURPLE,
    duty: '七类文件，各就其位',
    input: '上轮裁决后的工作区',
    output: '待评估的 Harness',
    scale: '7 类文件',
    feedback: { text: '组件可观测性：七类文件，每次修改定位到单一组件类', cls: '' },
  },
  {
    id: 'rollout',
    name: '试运行',
    angle: -Math.PI / 2 + (2 * Math.PI) / 5,
    color: BLUE,
    duty: 'Coding Agent × Environment',
    input: '当前 Harness',
    output: '原始轨迹 + 通过率',
    scale: '89 任务 × k=2',
    feedback: { text: '每个任务跑 k=2 次试运行，携带通过率信号', cls: '' },
  },
  {
    id: 'debugger',
    name: 'Agent Debugger',
    angle: -Math.PI / 2 + (4 * Math.PI) / 5,
    color: BLUE,
    duty: '蒸馏三层可钻取证据',
    input: '~10M token 原始轨迹',
    output: '分层证据报告',
    scale: '~10K token',
    feedback: { text: '经验可观测性：约 10M token 原始轨迹进，约 10K token 分层证据出', cls: '' },
  },
  {
    id: 'evolve',
    name: '进化智能体',
    angle: -Math.PI / 2 + (6 * Math.PI) / 5,
    color: GREEN,
    duty: '编辑组件 + 写变更清单',
    input: '证据报告 + 上轮裁决',
    output: '新工作区 + 变更清单',
    scale: '数次 commit',
    feedback: { text: '决策可观测性：每个编辑附自我声明的预测，写入变更清单', cls: 'good' },
  },
  {
    id: 'attribute',
    name: '归因与回滚',
    angle: -Math.PI / 2 + (8 * Math.PI) / 5,
    color: ORANGE,
    duty: '对账 + 文件级回滚',
    input: '清单预测 + 新结果',
    output: '裁决：保留 / 回滚',
    scale: '文件粒度',
    feedback: { text: '下一轮先在这里对账：未兑现的编辑按文件粒度回滚', cls: '' },
  },
];

const CX = 540;
const CY = 112;
const RX = 348;
const RY = 72;
const NR = 30; // node radius

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const nodePos = (n: PipeNode) => ({ x: CX + RX * Math.cos(n.angle), y: CY + RY * Math.sin(n.angle) });

// small per-node technical glyphs drawn inside the node circle
function drawNodeIcon(
  ctx: CanvasRenderingContext2D,
  id: NodeId,
  x: number,
  y: number,
  now: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  if (id === 'workspace') {
    // folder stack: two overlapping folder outlines
    ctx.strokeRect(-9, -5, 16, 10);
    ctx.beginPath();
    ctx.moveTo(-9, -5);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-2, -8);
    ctx.lineTo(0, -5);
    ctx.stroke();
    ctx.strokeRect(-5, -1 + 6, 16, 10);
    ctx.beginPath();
    ctx.moveTo(-5, 5);
    ctx.lineTo(-2, 2);
    ctx.lineTo(2, 2);
    ctx.lineTo(4, 5);
    ctx.stroke();
  } else if (id === 'rollout') {
    // play button
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-3, -5.5);
    ctx.lineTo(6, 0);
    ctx.lineTo(-3, 5.5);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'debugger') {
    // funnel (distillation)
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(10, -8);
    ctx.lineTo(3, 0);
    ctx.lineTo(3, 8);
    ctx.lineTo(-3, 8);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.stroke();
    // animated drips below the funnel
    const d = (now / 300) % 3;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 10 + d * 2, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (id === 'evolve') {
    // robot head + document
    ctx.strokeRect(-11, -7, 12, 11); // head
    ctx.beginPath();
    ctx.moveTo(-5, -7);
    ctx.lineTo(-5, -10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-5, -11, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-8.5, -3.5, 2, 2);
    ctx.fillRect(-4.5, -3.5, 2, 2);
    // document with folded corner
    ctx.beginPath();
    ctx.moveTo(3, -8);
    ctx.lineTo(9, -8);
    ctx.lineTo(12, -5);
    ctx.lineTo(12, 8);
    ctx.lineTo(3, 8);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9, -8);
    ctx.lineTo(9, -5);
    ctx.lineTo(12, -5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5.5, -1);
    ctx.lineTo(9.5, -1);
    ctx.moveTo(5.5, 2.5);
    ctx.lineTo(9.5, 2.5);
    ctx.stroke();
  } else {
    // attribute: revert arrow (counterclockwise)
    const a0 = Math.PI * 0.15;
    const a1 = Math.PI * 1.55;
    ctx.beginPath();
    ctx.arc(0, 0, 8, a0, a1, true);
    ctx.stroke();
    const ex = 8 * Math.cos(a1);
    const ey = 8 * Math.sin(a1);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 6, ey - 1);
    ctx.lineTo(ex - 1, ey - 6.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export const ModPipeline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ node: NodeId }>({ node: 'workspace' });
  const rafRef = useRef<number | null>(null);
  const [node, setNode] = useState<NodeId>('workspace');
  const [feedback, setFeedback] = useState(NODES[0].feedback);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const s = stateRef.current;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      const curIdx = NODES.findIndex((n) => n.id === s.node);

      // ---------- edges (ellipse arcs between consecutive nodes) ----------
      for (let i = 0; i < NODES.length; i++) {
        const a1 = NODES[i].angle;
        const a2 = NODES[(i + 1) % NODES.length].angle;
        // trim arc ends so the line stops at node borders
        const padA = Math.atan2(NR / RY, NR / RX) + 0.06;
        let from = a1 + padA;
        let to = a2 - padA;
        if (to < from) to += Math.PI * 2;
        const active = i === curIdx;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(CX, CY, RX, RY, 0, from, to, false);
        if (active) {
          ctx.strokeStyle = BLUE;
          ctx.lineWidth = 4;
          ctx.setLineDash([12, 9]);
          ctx.lineDashOffset = -now / 24;
        } else {
          ctx.strokeStyle = BORDER;
          ctx.lineWidth = 2;
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // arrowhead at the arc end
        const ex = CX + RX * Math.cos(to);
        const ey = CY + RY * Math.sin(to);
        const tx = -RX * Math.sin(to);
        const ty = RY * Math.cos(to);
        const tl = Math.hypot(tx, ty);
        const ux = tx / tl;
        const uy = ty / tl;
        ctx.fillStyle = active ? BLUE : BORDER;
        ctx.beginPath();
        ctx.moveTo(ex + ux * 2, ey + uy * 2);
        ctx.lineTo(ex - uy * 5 - ux * 6, ey + ux * 5 - uy * 6);
        ctx.lineTo(ex + uy * 5 - ux * 6, ey - ux * 5 - uy * 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // distillation magnitude label on the rollout → debugger edge
      {
        const mid = (NODES[1].angle + NODES[2].angle) / 2;
        const lx = CX + (RX + 30) * Math.cos(mid);
        const lyy = CY + (RY + 30) * Math.sin(mid);
        ctx.fillStyle = MUTED;
        ctx.font = 'bold 12px "Consolas", "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('~10M → ~10K tokens', lx, lyy);
        ctx.textAlign = 'left';
      }

      // ---------- nodes ----------
      NODES.forEach((n, i) => {
        const p = nodePos(n);
        const active = i === curIdx;
        if (active) {
          const pulse = 4 + 2.5 * Math.sin(now / 260);
          ctx.beginPath();
          ctx.arc(p.x, p.y, NR + 6 + pulse, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(39,68,110,0.12)';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, NR, 0, Math.PI * 2);
        ctx.fillStyle = active ? n.color : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = n.color;
        ctx.lineWidth = active ? 4 : 2.5;
        ctx.stroke();
        drawNodeIcon(ctx, n.id, p.x, p.y, now, active ? '#ffffff' : n.color);
        // node name beneath/beside (part of the node drawing)
        ctx.fillStyle = TEXT;
        ctx.font = `${active ? 'bold ' : ''}13px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.name, p.x, p.y + NR + 16);
        ctx.textAlign = 'left';
      });

      // ---------- archive region ----------
      const cur = NODES[curIdx];
      const ax = 30;
      const ay = 208;
      const aw = W - 60;
      const ah = 58;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, ax, ay, aw, ah, 8);
      ctx.fill();
      ctx.strokeStyle = cur.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      const cols = [
        { h: '职责', v: cur.duty, x: ax + 18 },
        { h: '输入', v: cur.input, x: ax + 260 },
        { h: '输出', v: cur.output, x: ax + 520 },
        { h: '量级', v: cur.scale, x: ax + 790 },
      ];
      ctx.textAlign = 'left';
      cols.forEach((c) => {
        ctx.fillStyle = cur.color;
        ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
        ctx.fillText(c.h, c.x, ay + 22);
        ctx.fillStyle = TEXT;
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.fillText(c.v, c.x, ay + 44);
      });
    };

    const tick = (now: number) => {
      render(now);
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

    const onClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ((ev.clientX - rect.left) / rect.width) * W;
      const my = ((ev.clientY - rect.top) / rect.height) * H;
      for (const n of NODES) {
        const p = nodePos(n);
        if (Math.hypot(mx - p.x, my - p.y) <= NR + 14) {
          select(n.id);
          break;
        }
      }
    };
    canvas.addEventListener('click', onClick);
    return () => {
      canvas.removeEventListener('click', onClick);
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (id: NodeId) => {
    stateRef.current.node = id;
    setNode(id);
    const n = NODES.find((x) => x.id === id)!;
    setFeedback(n.feedback);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl" style={{ gap: 8, flexWrap: 'wrap' }}>
        {NODES.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`chip${node === n.id ? ' on' : ''}`}
            onClick={() => select(n.id)}
          >
            {n.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModPipeline;
