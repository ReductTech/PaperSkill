import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 8.1（1080×280，P5 架构节点 + P4 阶段 chips）：点击架构图里的组件或切换训练阶段，
// 活动路径高亮、选中节点橙色脉冲，细节窗说明该组件的作用、训练阶段与显存峰值。

const W = 1080;
const H = 280;

type Side = 'gen' | 'und' | 'shared';
type Stage = 'I' | 'II' | 'III';

interface ArchNode {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  side: Side;
  role: string;
  training: string;
  clickable: boolean;
  /** 选中该节点时点亮的活动路径（节点集合）。 */
  active: string[];
}

interface ArchEdge {
  from: string;
  to: string;
}

const STAGES: Stage[] = ['I', 'II', 'III'];

const MEMORY: Record<Stage, string> = { I: '42GB', II: '41GB', III: '43GB' };

const GEN_PATH = ['corrupt', 'gen-enc', 'gen-expert', 'recovered', 'joint', 'answer'];
const UND_IMG_PATH = ['corrupt', 'und-enc', 'und-expert', 'joint', 'answer'];
const UND_TXT_PATH = ['question', 'tok', 'und-expert', 'joint', 'answer'];

const GEN_EXPERT: ArchNode = {
  id: 'gen-expert',
  name: '生成专家',
  x: 110,
  y: 140,
  w: 150,
  h: 34,
  side: 'gen',
  role: '生成侧主干，按恢复指令 Prec 重建恢复图像',
  training: '阶段 I、II、III 均更新',
  clickable: true,
  active: GEN_PATH,
};

const NODES: ArchNode[] = [
  {
    id: 'corrupt',
    name: '损坏图像',
    x: 90,
    y: 16,
    w: 170,
    h: 34,
    side: 'shared',
    role: '模型实际收到的损坏图像 Ic，同时送入理解与生成两条支路',
    training: '输入，不含可训练参数',
    clickable: true,
    active: GEN_PATH,
  },
  {
    id: 'question',
    name: '问题文本',
    x: 690,
    y: 16,
    w: 150,
    h: 34,
    side: 'shared',
    role: '用户提出的文本问题 Q，只进入理解侧',
    training: '输入，不含可训练参数',
    clickable: false,
    active: [],
  },
  {
    id: 'gen-enc',
    name: '生成编码器',
    x: 110,
    y: 78,
    w: 150,
    h: 34,
    side: 'gen',
    role: '把损坏图像编码到潜空间，作为恢复生成的起点',
    training: '阶段 I、II、III 均更新',
    clickable: true,
    active: GEN_PATH,
  },
  {
    id: 'und-enc',
    name: '理解编码器',
    x: 380,
    y: 78,
    w: 150,
    h: 34,
    side: 'und',
    role: '把损坏图像编码为视觉特征，供理解专家使用',
    training: '阶段 III 更新（阶段 I、II 冻结）',
    clickable: true,
    active: UND_IMG_PATH,
  },
  {
    id: 'tok',
    name: '文本分词器',
    x: 690,
    y: 78,
    w: 150,
    h: 34,
    side: 'und',
    role: '把问题文本切分为词元，供理解专家使用',
    training: '阶段 III 更新（阶段 I、II 冻结）',
    clickable: true,
    active: UND_TXT_PATH,
  },
  GEN_EXPERT,
  {
    id: 'und-expert',
    name: '理解专家',
    x: 470,
    y: 140,
    w: 150,
    h: 34,
    side: 'und',
    role: '理解侧主干，完成多模态推理',
    training: '阶段 III 更新（阶段 I、II 冻结）',
    clickable: true,
    active: UND_IMG_PATH,
  },
  {
    id: 'recovered',
    name: '恢复图像',
    x: 110,
    y: 202,
    w: 150,
    h: 34,
    side: 'gen',
    role: '生成侧输出 Ir，与损坏图像一起送入联合推理',
    training: '生成侧输出，不含可训练参数',
    clickable: true,
    active: GEN_PATH,
  },
  {
    id: 'joint',
    name: '联合推理',
    x: 470,
    y: 202,
    w: 150,
    h: 34,
    side: 'und',
    role: '联合 [Ic, Ir, Q] 做下一词预测，输出最终答案',
    training: '阶段 III 更新',
    clickable: true,
    active: ['corrupt', 'gen-enc', 'gen-expert', 'recovered', 'joint', 'answer', 'und-expert'],
  },
  {
    id: 'answer',
    name: '答案',
    x: 790,
    y: 202,
    w: 140,
    h: 34,
    side: 'shared',
    role: '最终答案 A',
    training: '输出，不含可训练参数',
    clickable: false,
    active: [],
  },
];

const EDGES: ArchEdge[] = [
  { from: 'corrupt', to: 'gen-enc' },
  { from: 'corrupt', to: 'und-enc' },
  { from: 'question', to: 'tok' },
  { from: 'gen-enc', to: 'gen-expert' },
  { from: 'und-enc', to: 'und-expert' },
  { from: 'tok', to: 'und-expert' },
  { from: 'gen-expert', to: 'recovered' },
  { from: 'und-expert', to: 'joint' },
  { from: 'recovered', to: 'joint' },
  { from: 'joint', to: 'answer' },
];

const DEFAULT_NODE_ID = 'gen-expert';
const DEFAULT_STAGE: Stage = 'III';

/* ---------------- 绘图工具（局部实现，签名固定） ---------------- */

function roundRectPath(
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

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = '#21324a';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function byId(id: string): ArchNode | undefined {
  for (let i = 0; i < NODES.length; i++) {
    if (NODES[i].id === id) return NODES[i];
  }
  return undefined;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function edgeLine(a: ArchNode, b: ArchNode): Line {
  const acx = a.x + a.w / 2;
  const bcx = b.x + b.w / 2;
  if (Math.abs(a.y - b.y) <= 6) {
    const y = a.y + a.h / 2;
    const rightward = bcx >= acx;
    return {
      x1: rightward ? a.x + a.w : a.x,
      y1: y,
      x2: rightward ? b.x : b.x + b.w,
      y2: y,
    };
  }
  if (Math.abs(acx - bcx) <= 30) {
    return { x1: bcx, y1: a.y + a.h, x2: bcx, y2: b.y };
  }
  return { x1: acx, y1: a.y + a.h, x2: bcx, y2: b.y };
}

function drawArrow(ctx: CanvasRenderingContext2D, line: Line, color: string) {
  const ang = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
  const size = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(line.x2, line.y2);
  ctx.lineTo(line.x2 - size * Math.cos(ang - 0.42), line.y2 - size * Math.sin(ang - 0.42));
  ctx.lineTo(line.x2 - size * Math.cos(ang + 0.42), line.y2 - size * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
}

function drawNodeBox(ctx: CanvasRenderingContext2D, node: ArchNode, marked: boolean) {
  roundRectPath(ctx, node.x, node.y, node.w, node.h, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = node.clickable ? '#7c3aed' : '#d7deea';
  ctx.lineWidth = node.clickable ? 2.5 : 2;
  if (!node.clickable) ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.restore();
  if (marked) {
    // 训练中的模块：绿色底角标
    ctx.fillStyle = '#228d5c';
    ctx.beginPath();
    ctx.moveTo(node.x + node.w - 14, node.y + node.h - 3);
    ctx.lineTo(node.x + node.w - 3, node.y + node.h - 3);
    ctx.lineTo(node.x + node.w - 3, node.y + node.h - 14);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSelectedPulse(ctx: CanvasRenderingContext2D, node: ArchNode, now: number) {
  const pulse = easeInOutQuad(clamp(0.5 + 0.5 * Math.sin(now / 300), 0, 1));
  roundRectPath(ctx, node.x, node.y, node.w, node.h, 7);
  ctx.save();
  ctx.globalAlpha = lerp(0.14, 0.34, pulse);
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = lerp(2.4, 4.6, pulse);
  ctx.stroke();
}

/* ---------------- 反馈文案 ---------------- */

function feedbackFor(nodeId: string, stage: Stage): { text: string; cls: string } {
  const node = byId(nodeId);
  const name = node ? node.name : '';
  if (stage === 'III') {
    return { text: '阶段 III：理解与生成联合训练，显存峰值 43GB', cls: 'good' };
  }
  if (node && node.side === 'gen') {
    return { text: `${name}：阶段 ${stage} 训练生成侧，理解侧保持冻结`, cls: '' };
  }
  return { text: `${name}：阶段 ${stage} 不更新该组件，它保持预训练权重`, cls: '' };
}

/* ---------------- 组件 ---------------- */

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ nodeId: string; stage: Stage }>({
    nodeId: DEFAULT_NODE_ID,
    stage: DEFAULT_STAGE,
  });
  const rafRef = useRef<number | null>(null);
  const [nodeId, setNodeId] = useState<string>(DEFAULT_NODE_ID);
  const [stage, setStage] = useState<Stage>(DEFAULT_STAGE);
  const [feedback, setFeedback] = useState({
    text: '生成专家：阶段 I、II 只训练生成侧；阶段 III 与理解侧联合训练',
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

    const render = (now: number) => {
      const s = stateRef.current;
      const sel = byId(s.nodeId) || GEN_EXPERT;
      const active = sel.active;

      clearScene(ctx, W, H);

      // 活动路径：输入 → 选中节点 → 出口
      for (let i = 0; i < EDGES.length; i++) {
        const a = byId(EDGES[i].from);
        const b = byId(EDGES[i].to);
        if (!a || !b) continue;
        const hot = active.indexOf(a.id) >= 0 && active.indexOf(b.id) >= 0;
        const line = edgeLine(a, b);
        const color = hot ? '#27446e' : '#d7deea';
        ctx.strokeStyle = color;
        ctx.lineWidth = hot ? 3.2 : 2;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        drawArrow(ctx, line, color);
      }

      // 节点
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        const marked =
          s.stage === 'III'
            ? n.side === 'gen' || n.side === 'und'
            : n.side === 'gen';
        drawNodeBox(ctx, n, marked);
      }
      drawSelectedPulse(ctx, sel, now);

      // 图内仅两个短标签：恢复 / 答案
      const rec = byId('recovered');
      const ans = byId('answer');
      if (rec) drawSceneLabel(ctx, '恢复', rec.x + rec.w / 2, rec.y + rec.h / 2);
      if (ans) drawSceneLabel(ctx, '答案', ans.x + ans.w / 2, ans.y + ans.h / 2);
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const go = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, go, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const selectNode = (id: string) => {
    stateRef.current.nodeId = id;
    setNodeId(id);
    setFeedback(feedbackFor(id, stateRef.current.stage));
  };

  const selectStage = (s: Stage) => {
    stateRef.current.stage = s;
    setStage(s);
    setFeedback(feedbackFor(stateRef.current.nodeId, s));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i];
      if (!n.clickable) continue;
      if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
        selectNode(n.id);
        return;
      }
    }
  };

  const sel = byId(nodeId) || GEN_EXPERT;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
      />
      <div
        className="ctrl"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '6px 18px',
          alignItems: 'stretch',
          minHeight: 82,
        }}
      >
        <div>
          <b>组件名</b>：{sel.name}
        </div>
        <div>
          <b>作用</b>：{sel.role}
        </div>
        <div>
          <b>训练阶段</b>：{sel.training}
        </div>
        <div>
          <b>显存</b>：{MEMORY[stage]}（阶段 {stage} 峰值）
        </div>
      </div>
      <div className="ctrl">
        <label>训练阶段</label>
        {STAGES.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip${s === stage ? ' selected' : ''}`}
            aria-pressed={s === stage}
            onClick={() => selectStage(s)}
          >
            阶段 {s}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>组件</label>
        {NODES.filter((n) => n.clickable).map((n) => (
          <button
            key={n.id}
            type="button"
            className={`chip${n.id === nodeId ? ' selected' : ''}`}
            aria-pressed={n.id === nodeId}
            onClick={() => selectNode(n.id)}
          >
            {n.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod1;
