import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, fillRound, roundRect, drawArrow, label, legend } from './sceneKit';
import type { WidgetProps } from './registry';

// §8.1 系统结构图（P5）：六个节点固定顺序，点击节点或 DOM 按钮切换高亮环、
// 已点亮路径、.hotspot-info 详情区与反馈。节点填充色只编码层级（蓝＝事件级、
// 紫＝跨事件级）；Canvas 内只画六个序号与当前选中节点的中文名，六个全名放 DOM。

const W = 1080;
const H = 280;

const NODE_W = 148;
const NODE_H = 72;
const NODE_Y = 104;
const NODE_STEP = 168;

interface NodeDef {
  name: string;
  level: 'event' | 'cross';
  eq: string;
  input: string;
  output: string;
  cost: string;
}

const NODES: NodeDef[] = [
  {
    name: '双视角抽取',
    level: 'event',
    eq: 'Eq.1',
    input: '一条发言 m_i',
    output: '事实条目 Φ_i 与关系条目 Ψ_i',
    cost: '每句两次提示调用（事实提示 + 关系提示）',
  },
  {
    name: '时间锚定',
    level: 'event',
    eq: 'Eq.2',
    input: '条目与来源时间戳 τ_i',
    output: '事件级单元 ⟨x, e_x, τ_i⟩ 写入 M',
    cost: '一次嵌入计算，无额外 LLM 调用',
  },
  {
    name: '事件缓冲',
    level: 'cross',
    eq: 'Eq.3',
    input: '自上次合并以来未合并的条目 M_buffer',
    output: '按时间排序的缓冲 C_buf',
    cost: '本地排序，无 LLM 调用；等到时间阈值（默认 1 小时）才触发下一次合并',
  },
  {
    name: '语义检索种子',
    level: 'cross',
    eq: '§3.2 的种子检索（Eq.3 之后）',
    input: '由 C_buf 全部文本拼成的聚合查询',
    output: '按余弦相似度取回的前 K=15 条种子 S_k',
    cost: '一次嵌入 + 一次向量检索，无 LLM 调用',
  },
  {
    name: '事件重建',
    level: 'cross',
    eq: 'Eq.4–Eq.5',
    input: '每个种子 x*',
    output: '同一时间戳的全部条目 E_τ(x*) 与 C_cross = C_buf ∪ ⋃E_τ(x*)',
    cost: '按时间戳索引取回，无 LLM 调用',
  },
  {
    name: '周期合成',
    level: 'cross',
    eq: 'Eq.6',
    input: '跨事件结构 C_cross 与合成提示 P_cons',
    output: '写回记忆的合成记忆 C_cons',
    cost: '每个时间窗一次批量 LLM 调用，替代逐事件的图维护',
  },
];

const NOT_IN_STRUCTMEM: string[] = ['实体抽取', '实体去重', '关系去重'];
const EQ_LEVEL = { event: 'Eq.1–Eq.2', cross: 'Eq.3–Eq.6' };
const CONSOLIDATION_WINDOW_H = 1;
const K_DEFAULT = 15;

const FEEDBACK: { text: string; cls: string }[] = [
  { text: '第 1 步 双视角抽取：一条发言用事实提示与关系提示分别抽出 Φ 与 Ψ（Eq.1）。', cls: '' },
  { text: '第 2 步 时间锚定：条目绑上来源时间戳 τ，成为可复原的事件级单元（Eq.2）。', cls: '' },
  { text: '第 3 步 事件缓冲：条目先按时间排序堆在缓冲里，这一步不花 LLM 调用（Eq.3）。', cls: '' },
  { text: '第 4 步 语义检索种子：缓冲的聚合查询按余弦相似度取回前 15 条种子。', cls: '' },
  {
    text: '第 5 步 事件重建：抓住种子就能取回同一时间戳的全部条目，组成跨事件结构（Eq.4–Eq.5）。',
    cls: 'good',
  },
  {
    text: '第 6 步 周期合成：一次批量调用写出跨事件关系假设，这就是省掉逐事件图维护的地方（Eq.6）。',
    cls: 'good',
  },
];

function nodeX(i: number): number {
  return 40 + NODE_STEP * i;
}

export const C8SystemMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ activeNode: number; hoverNode: number | null }>({
    activeNode: 0,
    hoverNode: null,
  });
  const [activeNode, setActiveNode] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = () => {
      const s = stateRef.current;
      clearScene(ctx, W, H, true);

      // 两个层级底色（3% 洗色）：事件级 / 跨事件级
      ctx.save();
      ctx.globalAlpha = 0.06;
      fillRound(ctx, 32, 88, 332, 104, 10, COL.blue);
      fillRound(ctx, 368, 88, 668, 104, 10, COL.purple);
      ctx.restore();
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1;
      roundRect(ctx, 32, 88, 332, 104, 10);
      ctx.stroke();
      roundRect(ctx, 368, 88, 668, 104, 10);
      ctx.stroke();

      // 5 条相邻边：未点亮
      for (let i = 0; i < NODES.length - 1; i += 1) {
        drawArrow(ctx, nodeX(i) + NODE_W, 140, nodeX(i + 1), 140, COL.axis, 6);
      }
      // 已点亮路径（从第一个节点到当前节点）
      if (s.activeNode > 0) {
        for (let i = 0; i < s.activeNode; i += 1) {
          drawArrow(ctx, nodeX(i) + NODE_W, 140, nodeX(i + 1), 140, COL.blue, 6);
        }
      }

      // 六个节点卡：填充色只编码层级
      NODES.forEach((n: NodeDef, i: number) => {
        const levelColor = n.level === 'event' ? COL.blue : COL.purple;
        fillRound(ctx, nodeX(i), NODE_Y, NODE_W, NODE_H, 10, levelColor);
        ctx.strokeStyle = levelColor;
        ctx.lineWidth = 2;
        roundRect(ctx, nodeX(i), NODE_Y, NODE_W, NODE_H, 10);
        ctx.stroke();
        // 六个序号 1–6
        label(ctx, String(i + 1), nodeX(i) + NODE_W / 2, 142, COL.white, 'center', 20);
        // 只画当前选中节点的中文名
        if (i === s.activeNode) {
          label(ctx, n.name, nodeX(i) + NODE_W / 2, 166, COL.white, 'center', 16);
        }
        if (s.hoverNode === i && s.activeNode !== i) {
          ctx.strokeStyle = COL.ink;
          ctx.lineWidth = 2;
          roundRect(ctx, nodeX(i) - 3, NODE_Y - 3, NODE_W + 6, NODE_H + 6, 12);
          ctx.stroke();
        }
      });

      // 选中节点的橙色高亮环
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      roundRect(ctx, nodeX(s.activeNode) - 4, NODE_Y - 4, NODE_W + 8, NODE_H + 8, 12);
      ctx.stroke();

      // 1 个图例（3 项）
      legend(
        ctx,
        [
          { c: COL.blue, t: '事件级' },
          { c: COL.purple, t: '跨事件级' },
          { c: COL.blue, t: '当前路径' },
        ],
        48,
        200
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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
  }, []);

  const hitNode = (clientX: number, clientY: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const x = ((clientX - r.left) * W) / r.width;
    const y = ((clientY - r.top) * H) / r.height;
    for (let i = 0; i < NODES.length; i += 1) {
      if (x >= nodeX(i) && x <= nodeX(i) + NODE_W && y >= 96 && y <= NODE_Y + NODE_H + 8) {
        return i;
      }
    }
    return null;
  };

  const select = (n: number): void => {
    if (stateRef.current.activeNode === n) return;
    stateRef.current.activeNode = n;
    setActiveNode(n);
    setFeedback(FEEDBACK[n]);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const n = hitNode(e.clientX, e.clientY);
    if (n !== null) select(n);
  };

  const onCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    stateRef.current.hoverNode = hitNode(e.clientX, e.clientY);
  };

  const onCanvasLeave = (): void => {
    stateRef.current.hoverNode = null;
  };

  const active = NODES[activeNode];
  const levelText = active.level === 'event' ? '事件级' : '跨事件级';

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        onMouseMove={onCanvasMove}
        onMouseLeave={onCanvasLeave}
      />
      <div className="chip-row">
        {NODES.map((n: NodeDef, i: number) => (
          <button
            key={n.name}
            type="button"
            className={`chip${i === activeNode ? ' selected' : ''}`}
            aria-pressed={i === activeNode}
            onClick={() => select(i)}
          >
            {n.name}
          </button>
        ))}
      </div>
      <div className="hotspot-info" aria-live="polite">
        <div>
          <b>{active.name}</b>　层级：{levelText}（{active.eq}）
        </div>
        <div>输入：{active.input}</div>
        <div>输出：{active.output}</div>
        <div>代价：{active.cost}</div>
        <div>
          对照：图记忆基线才需要的组件是 {NOT_IN_STRUCTMEM.join(' / ')}
          ，它们只存在于基线系统里，不是 StructMem 的节点。
        </div>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前节点层级</div>
          <div className="v">{levelText}</div>
          <div className="l">
            {active.level === 'event' ? EQ_LEVEL.event : EQ_LEVEL.cross}
          </div>
        </div>
        <div className="metric">
          <div className="l">合并触发时间窗</div>
          <div className="v">{CONSOLIDATION_WINDOW_H} 小时</div>
          <div className="l">时间阈值触发，非逐事件</div>
        </div>
        <div className="metric">
          <div className="l">语义种子数 K</div>
          <div className="v">{K_DEFAULT}</div>
          <div className="l">A.3 实现默认</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C8SystemMap;
