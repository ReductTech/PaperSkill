import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 680;
const H = 340;

type NodeKey = 'verifier' | 'judge' | 'sharing';
type Action = 'refine' | 'prune' | 'merge' | null;

const NODES: Record<
  NodeKey,
  {
    id: string;
    title: string;
    dev: number;
    paperStatus: 'pruned' | 'merged';
    effect: string;
    fact: string;
    insight: string;
    expected: Exclude<Action, null>;
  }
> = {
  verifier: {
    id: 'N1.1',
    title: 'Constraint verifier',
    dev: 60,
    paperStatus: 'pruned',
    effect: 'informative',
    fact: '逐约束验证改善开发准确率，但只能检查已出现的候选。',
    insight: '细粒度验证方向有效；真正瓶颈转向候选覆盖。',
    expected: 'refine',
  },
  judge: {
    id: 'N6.2',
    title: 'Search-augmented judge',
    dev: 75,
    paperStatus: 'pruned',
    effect: 'informative',
    fact: '它在 Figure 6 中达到 75.0% 开发准确率，是所列节点最高值。',
    insight: '论文指出该路线会过拟合开发问题，高开发分不能覆盖机制风险。',
    expected: 'prune',
  },
  sharing: {
    id: 'N8.1',
    title: 'Two-round sharing',
    dev: 72.5,
    paperStatus: 'merged',
    effect: 'drives shift',
    fact: '第一轮保持独立，第二轮只共享候选答案与证据档案。',
    insight: '它同时扩大证据覆盖并保持轨迹独立，被论文记录为 merged。',
    expected: 'merge',
  },
};

const NODE_KEYS = Object.keys(NODES) as NodeKey[];
const ACTION_LABELS: Record<Exclude<Action, null>, string> = {
  refine: '剪枝节点，细化方向',
  prune: '剪枝该路线',
  merge: '进入合并准入',
};

export const PruneRefineDecision: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodeKey, setNodeKey] = useState<NodeKey>('verifier');
  const [action, setAction] = useState<Action>(null);
  const node = NODES[nodeKey];
  const correct = action === node.expected;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);

    const points = [
      { x: 110, y: 170, label: '祖先约束' },
      { x: 340, y: 170, label: node.id },
      { x: 570, y: 170, label: action ? ACTION_LABELS[action] : '等待决策' },
    ];
    ctx.strokeStyle = action === 'merge' ? '#228d5c' : action === 'prune' ? '#c43f52' : '#27446e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(points[0].x + 38, points[0].y);
    ctx.lineTo(points[1].x - 38, points[1].y);
    ctx.moveTo(points[1].x + 38, points[1].y);
    ctx.lineTo(points[2].x - 44, points[2].y);
    ctx.stroke();

    points.forEach((point, index) => {
      const color = index === 2
        ? action === 'merge' ? '#228d5c' : action === 'prune' ? '#c43f52' : action === 'refine' ? '#7c3aed' : '#d97706'
        : index === 1 ? '#27446e' : '#76906a';
      ctx.beginPath();
      ctx.arc(point.x, point.y, index === 2 ? 44 : 38, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `${index === 2 ? 600 : 700} 12px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(point.label, point.x, point.y + 4);
    });

    ctx.fillStyle = '#21324a';
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${node.id} · ${node.title}`, 24, 32);
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(`开发准确率 ${node.dev.toFixed(1)}%`, 24, 58);
    ctx.fillStyle = '#27446e';
    ctx.fillText(`事实：${node.fact}`, 24, 278);
    ctx.fillStyle = '#7c3aed';
    ctx.fillText(`洞见：${node.insight}`, 24, 306);
    ctx.fillStyle = '#21324a';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('分数用于描述实验结果；动作还必须服从机制证据与留出准入。', 24, 330);
    canvas.classList.add('is-ready');
  }, [action, node]);

  const chooseNode = (key: NodeKey) => {
    setNodeKey(key);
    setAction(null);
  };

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          ref={canvasRef}
          className="paper-wide-canvas"
          width={W}
          height={H}
          role="img"
          aria-label={`${node.id} 分支决策，开发准确率 ${node.dev.toFixed(1)}%，当前动作 ${action ?? '未选择'}`}
        />
      </div>
      <div className="ctrl" style={{ display: 'grid', gap: 10 }}>
        <div role="group" aria-label="选择 Figure 6 节点">
          {NODE_KEYS.map((key) => (
            <button key={key} type="button" aria-pressed={nodeKey === key} onClick={() => chooseNode(key)}>
              {NODES[key].id}
            </button>
          ))}
        </div>
        <div role="group" aria-label="选择研究动作">
          {(Object.keys(ACTION_LABELS) as Array<Exclude<Action, null>>).map((key) => (
            <button key={key} type="button" aria-pressed={action === key} onClick={() => setAction(key)}>
              {ACTION_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${action === null ? '' : correct ? 'good' : 'bad'}`} aria-live="polite">
        {action === null
          ? '先读实验事实与洞见，再决定当前节点应该被剪枝、推动方向细化，还是进入合并准入。'
          : correct
          ? <><strong>判断与论文轨迹一致：</strong>{node.id} 在 Figure 6 中为 {node.paperStatus} · {node.effect}。{node.insight}</>
          : <><strong>再检查一次机制证据：</strong>开发准确率不是唯一决策依据；该节点的论文状态是 {node.paperStatus}。</>}
      </div>
    </div>
  );
};

export default PruneRefineDecision;
