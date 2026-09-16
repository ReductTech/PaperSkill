import { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clamp, W } from './visual-core';

const NODES = {
  REPR: { text: '中心：同架构冻结 AR 教师锚定 DLM 表示。', kind: 'core' }, AR: { text: '上游：Qwen3 AR 权重提供初始化与参考坐标系。', kind: 'evidence' }, DLM: { text: '目标：双向注意力下进行遮蔽去噪和任意顺序解码。', kind: 'evidence' },
  REPA: { text: '相关：视觉 REPA 通常对齐外部编码器；本文对齐同一个待转换 AR。', kind: 'related' }, XLNet: { text: '相关：排列语言建模也把生成顺序视为建模机制。', kind: 'related' }, P2: { text: '辅助：P2/PAPL 采样或损失在基线和对齐模型中共享。', kind: 'related' },
  CODE: { text: '下游证据：HumanEval、HumanEval+、MBPP、MBPP+。', kind: 'evidence' }, LIMIT: { text: '开放边界：同架构 Qwen3、代码任务、无误差条或多种子显著性；仍依赖强预训练 AR 教师和大量训练算力。', kind: 'open' },
} as const;

type NodeKey = keyof typeof NODES;
type Position = { x: number; y: number };
type Positions = Record<NodeKey, Position>;

function createInitialPositions(): Positions {
  const keys = Object.keys(NODES) as NodeKey[];
  const positions = keys.reduce((acc, key, index) => {
    acc[key] = {
      x: 540 + Math.cos(index * Math.PI / 4) * 350,
      y: 155 + Math.sin(index * Math.PI / 4) * 105,
    };
    return acc;
  }, {} as Positions);
  positions.REPR = { x: 540, y: 155 };
  return positions;
}

export const KnowledgeGraph: React.FC<WidgetProps> = () => {
  const keys = Object.keys(NODES) as NodeKey[];
  const [positions, setPositions] = useState(createInitialPositions);
  const [selected, setSelected] = useState<NodeKey>('REPR');
  const [dragging, setDragging] = useState<NodeKey | null>(null);
  const move = (event: React.PointerEvent<SVGSVGElement>) => { if (!dragging) return; const rect = event.currentTarget.getBoundingClientRect(); setPositions((current) => ({ ...current, [dragging]: { x: clamp((event.clientX - rect.left) * W / rect.width, 70, 1010), y: clamp((event.clientY - rect.top) * 310 / rect.height, 35, 275) } })); };
  const color = (key: NodeKey) => NODES[key].kind === 'core' ? C.green : NODES[key].kind === 'open' ? C.orange : NODES[key].kind === 'related' ? C.purple : C.blue;
  return <div>
    <svg className="ra-svg graph-svg" viewBox={`0 0 ${W} 310`} onPointerMove={move} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)} role="img" aria-label="REPR-ALIGN 可拖拽知识图谱">
      <rect width={W} height="310" fill={C.bg} />
      {keys.filter((key) => key !== 'REPR').map((key) => <line key={key} x1={positions.REPR.x} y1={positions.REPR.y} x2={positions[key].x} y2={positions[key].y} stroke={selected === key ? C.orange : C.line} strokeWidth={selected === key ? 5 : 2} strokeDasharray={NODES[key].kind === 'open' || NODES[key].kind === 'related' ? '8 7' : undefined} />)}
      {keys.map((key) => <g key={key} role="button" tabIndex={0} aria-label={`${key}：${NODES[key].text}`} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(key); setSelected(key); }} onClick={() => setSelected(key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(key); } }} style={{ cursor: dragging === key ? 'grabbing' : 'grab' }}><circle cx={positions[key].x} cy={positions[key].y} r={key === 'REPR' ? 36 : 28} fill={selected === key ? C.orange : color(key)} stroke="#fff" strokeWidth="4" /><text x={positions[key].x} y={positions[key].y + 5} textAnchor="middle" fill="#fff" fontSize={key === 'REPR' ? 14 : 12}>{key}</text></g>)}
      <text x="28" y="292" fill={C.muted} fontSize="13">实线：本文直接链路　虚线：相关工作或开放边界</text>
    </svg>
    <div className="chip-row">{keys.map((key) => <button type="button" key={key} className={`chip ${selected === key ? 'selected' : ''}`} onClick={() => setSelected(key)}>{key}</button>)}</div>
    <div className={`feedback ${selected === 'LIMIT' ? 'bad' : selected === 'REPR' ? 'good' : ''}`}>{NODES[selected].text}</div>
  </div>;
};
