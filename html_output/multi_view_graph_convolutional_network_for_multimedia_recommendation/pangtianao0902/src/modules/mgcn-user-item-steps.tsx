import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas } from '../lib/canvasKit';

const W = 560;
const H = 240;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#d97706';
const TEXT = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

type NodeId = 'u0' | 'u1' | 'u2' | 'i0' | 'i1' | 'i2' | 'i3';
type State = { step: number; showAverage: boolean; selectedNode: NodeId; judgment: '' | 'right' | 'wrong' };
type Props = { chapterId: string; moduleId: string };

const nodes: Array<{ id: NodeId; x: number; y: number; label: string; kind: 'u' | 'i'; depth: number }> = [
  { id: 'u0', x: 58, y: 84, label: 'u₀', kind: 'u', depth: 0 },
  { id: 'i0', x: 142, y: 48, label: 'i₀', kind: 'i', depth: 1 },
  { id: 'i1', x: 142, y: 122, label: 'i₁', kind: 'i', depth: 1 },
  { id: 'u1', x: 226, y: 48, label: 'u₁', kind: 'u', depth: 2 },
  { id: 'u2', x: 226, y: 122, label: 'u₂', kind: 'u', depth: 2 },
  { id: 'i2', x: 310, y: 48, label: 'i₂', kind: 'i', depth: 3 },
  { id: 'i3', x: 310, y: 122, label: 'i₃', kind: 'i', depth: 3 },
];
const edges: Array<[NodeId, NodeId, number]> = [
  ['u0', 'i0', 1], ['u0', 'i1', 1], ['i0', 'u1', 2], ['i1', 'u2', 2], ['u1', 'i2', 3], ['u2', 'i3', 3],
];

function feedback(s: State) {
  if (!s.showAverage) return { text: '你正在只看当前层；论文最终表示会平均第 0 到第 L 层。', cls: '' };
  const lines = [
    '第 0 层：这里只是行为侧 ID 初始表示，还没有跨边传播。',
    '第 1 层：直接交互邻居开始交换协同信号。',
    '第 2 层：信号已到达二阶邻居，捕捉到更远的共同选择。',
    '第 3 层：目标物品已收到高阶协同线索；右侧仍对各层取平均。',
  ];
  return { text: lines[s.step], cls: s.step === 3 ? 'good' : '' };
}

export const MgcnUserItemSteps: React.FC<Props> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<State>({ step: 0, showAverage: true, selectedNode: 'u0', judgment: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
    ctx.fillRect(12, 12, 336, 176); ctx.strokeRect(12, 12, 336, 176);
    ctx.fillRect(360, 12, 188, 176); ctx.strokeRect(360, 12, 188, 176);

    for (const [a, b, depth] of edges) {
      const na = nodes.find(n => n.id === a)!; const nb = nodes.find(n => n.id === b)!;
      ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
      ctx.strokeStyle = depth <= state.step ? BLUE : BORDER;
      ctx.lineWidth = depth <= state.step ? 3 : 1; ctx.lineCap = 'round'; ctx.stroke();
    }
    for (const node of nodes) {
      const reached = node.depth <= state.step;
      const selected = node.id === state.selectedNode;
      if (node.kind === 'u') {
        ctx.beginPath(); ctx.arc(node.x, node.y, 17, 0, Math.PI * 2);
        ctx.fillStyle = '#fff8ed'; ctx.fill(); ctx.strokeStyle = selected ? ORANGE : reached ? BLUE : BORDER;
        ctx.lineWidth = selected ? 3 : 2; ctx.stroke();
      } else {
        ctx.fillStyle = '#b8c9a7'; ctx.fillRect(node.x - 20, node.y - 14, 40, 28);
        ctx.strokeStyle = node.depth === 3 && state.step === 3 ? GREEN : selected ? ORANGE : reached ? BLUE : BORDER;
        ctx.lineWidth = node.depth === 3 && state.step === 3 ? 3 : selected ? 3 : 2; ctx.strokeRect(node.x - 20, node.y - 14, 40, 28);
      }
      ctx.fillStyle = TEXT; ctx.font = '12px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(node.label, node.x, node.y + 4);
    }

    ctx.textAlign = 'left'; ctx.fillStyle = TEXT; ctx.font = 'bold 13px "Segoe UI",sans-serif';
    ctx.fillText(state.showAverage ? '层平均 Ē_id' : `当前层 E_id^(${state.step})`, 374, 34);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const active = state.showAverage ? c <= state.step : c === state.step;
      ctx.fillStyle = active ? `rgba(39,68,110,${0.28 + r * 0.08})` : '#eef2f6';
      ctx.fillRect(376 + c * 29, 48 + r * 20, 23, 14);
    }
    ctx.fillStyle = MUTED; ctx.font = '11px "Segoe UI",sans-serif';
    ctx.fillText(`选中：${state.selectedNode}`, 376, 164);
    ctx.fillText('依据：第 3 页 §2.3.1', 376, 181);
    ctx.fillText('公式 (3)–(5) · 结构定义', 376, 197);

    ctx.strokeStyle = BORDER; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(28, 216); ctx.lineTo(330, 216); ctx.stroke();
    [0, 1, 2, 3].forEach((v, idx) => {
      const x = 40 + idx * 92;
      ctx.beginPath(); ctx.arc(x, 216, v === state.step ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = v === state.step ? ORANGE : BORDER; ctx.fill();
      ctx.fillStyle = TEXT; ctx.font = '11px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`第 ${v} 层`, x, 236);
    });
    canvas.classList.add('is-ready');
  }, [state]);

  const chooseStep = (step: number) => setState(s => ({ ...s, step: clamp(step, 0, 3), judgment: '' }));
  const onCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) * W / rect.width, 0, W);
    const y = clamp((e.clientY - rect.top) * H / rect.height, 0, H);
    const hit = nodes.find(n => Math.hypot(n.x - x, n.y - y) <= 20);
    if (hit) setState(s => ({ ...s, selectedNode: hit.id }));
  };
  const fb = feedback(state);

  return <div onKeyDown={e => { if (e.key === 'ArrowRight') chooseStep(state.step + 1); if (e.key === 'ArrowLeft') chooseStep(state.step - 1); if (e.key === 'Home') chooseStep(0); }}>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onPointerDown={onCanvasPointer} style={{ maxWidth: '100%', height: 'auto' }} aria-label="用户-物品二部图传播画布" />
    <div className="ctrl" role="group" aria-label="传播层数">
      <button onClick={() => chooseStep(state.step - 1)} disabled={state.step === 0}>上一层</button>
      {[0,1,2,3].map(v => <button key={v} aria-pressed={state.step === v} onClick={() => chooseStep(v)}>第 {v} 层</button>)}
      <button onClick={() => chooseStep(state.step + 1)} disabled={state.step === 3}>下一层</button>
      <button onClick={() => setState(s => ({ ...s, showAverage: !s.showAverage }))} aria-pressed={state.showAverage}>显示层平均</button>
      <button onClick={() => setState({ step: 0, showAverage: true, selectedNode: 'u0', judgment: '' })}>重置</button>
    </div>
    <div className="ctrl" role="group" aria-label="图节点">
      {nodes.map(n => <button key={n.id} aria-pressed={state.selectedNode === n.id} onClick={() => setState(s => ({ ...s, selectedNode: n.id }))}>{n.label} · {n.kind === 'u' ? '用户' : '物品'}</button>)}
    </div>
    <div className={`feedback ${fb.cls}`} aria-live="polite">{fb.text}</div>
    <div className="ctrl" role="group" aria-label="学习判断">
      <strong>判断：为什么这里不能把视觉或文本相似度画在传播边上？</strong>
      <button onClick={() => setState(s => ({ ...s, judgment: 'right' }))}>因为此视图只传播行为 ID 表示</button>
      <button onClick={() => setState(s => ({ ...s, judgment: 'wrong' }))}>因为图中没有物品</button>
      <button onClick={() => setState(s => ({ ...s, judgment: 'wrong' }))}>因为只能传播一层</button>
    </div>
    {state.judgment && <div className={`feedback ${state.judgment === 'right' ? 'good' : 'bad'}`}>{state.judgment === 'right' ? '正确：用户-物品视图编码协同关系，模态语义留给独立的物品-物品视图。' : '再看边的来源：A 由交互矩阵 R 构造，不是由模态相似度构造。'}</div>}
  </div>;
};

export default MgcnUserItemSteps;
