import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const INK = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

const stages = [
  { label: '输入与净化', evidence: '第 3 页 §2.2，式 (1)–(2)', symbol: 'Eᵢ,ₘ → 偏好相关模态' },
  { label: '用户-物品视图', evidence: '第 3 页 §2.3.1，式 (3)–(5)', symbol: 'E_id → Ē_id' },
  { label: '物品-物品视图', evidence: '第 3–4 页 §2.3.2，式 (6)–(10)', symbol: 'S̃ₘĔᵢ,ₘ → Ēᵢ,ₘ' },
  { label: '行为感知融合', evidence: '第 4 页 §2.4，式 (11)–(16)', symbol: 'E_s + Ẽₘ⊙Pₘ → E_mul' },
  { label: '偏好预测', evidence: '第 4 页 §2.5，式 (17)–(18)', symbol: 'eᵤᵀeᵢ → ŷᵤᵢ' },
] as const;

type ArchState = {
  activeStage: number;
  pulse: number;
  autoPlay: boolean;
  modality: 'visual' | 'text';
  visited: number[];
  judgment: 'correct' | 'wrong' | null;
};

const initialState: ArchState = {
  activeStage: 0,
  pulse: 0,
  autoPlay: false,
  modality: 'visual',
  visited: [0],
  judgment: null,
};

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 8) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, active: boolean) {
  ctx.strokeStyle = active ? BLUE : '#b8c9a7';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = active ? 3 : 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7, y2 - 4);
  ctx.lineTo(x2 - 7, y2 + 4);
  ctx.closePath();
  ctx.fill();
}

function stageCard(ctx: CanvasRenderingContext2D, i: number, active: boolean, done: boolean, modality: string) {
  const xs = [14, 112, 210, 350, 456];
  const widths = [88, 88, 128, 96, 90];
  const x = xs[i];
  const y = i === 1 ? 38 : i === 2 ? 112 : 72;
  const h = i === 1 || i === 2 ? 58 : 82;
  rounded(ctx, x, y, widths[i], h);
  ctx.fillStyle = active ? '#e8eef8' : '#ffffff';
  ctx.fill();
  ctx.strokeStyle = active ? BLUE : done ? GREEN : BORDER;
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.stroke();
  ctx.fillStyle = active ? BLUE : INK;
  ctx.font = '600 12px "Segoe UI", sans-serif';
  const labels = [
    ['行为引导', '净化器'],
    ['用户-物品', '协同传播'],
    ['物品-物品', `${modality === 'visual' ? '视觉' : '文本'} top-K`],
    ['行为感知', '融合器'],
    ['内积', '预测'],
  ];
  labels[i].forEach((line, n) => ctx.fillText(line, x + 9, y + 24 + n * 18));
  if (done) {
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(x + widths[i] - 10, y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function feedbackFor(s: ArchState): { text: string; cls: string } {
  if (s.judgment === 'correct') return { text: '判断正确：关键边界是先净化，再让协同信号与语义信号分别传播。', cls: 'good' };
  if (s.judgment === 'wrong') return { text: '再看蓝色路径：论文没有要求改预测函数，也没有承诺固定幅度的指标下降。', cls: 'bad' };
  if (s.activeStage === 0) return { text: '当前：行为引导净化器用行为侧 ID 表征生成门控，保留偏好相关的模态成分。', cls: '' };
  if (s.activeStage === 1) return s.pulse > 0
    ? { text: '已得到增强的行为表征 Ē_id；这里的 L 是传播矩阵，不是损失函数。', cls: 'good' }
    : { text: '点击“传播一次”，让 E_id 沿用户-物品视图聚合高阶协同信号。', cls: '' };
  if (s.activeStage === 2) return s.pulse > 0
    ? { text: '已得到语义增强的模态表征；浅层设计用于控制噪声与过平滑风险。', cls: 'good' }
    : { text: '当前：在所选模态的 top-K 物品图上进行一次浅层传播。', cls: '' };
  if (s.activeStage === 3) return { text: '行为感知融合器保留模态共享特征，并用 P_m 调节模态特有特征。', cls: '' };
  const ready = s.visited.includes(1) && s.visited.includes(2);
  return ready
    ? { text: '路径完整：行为表征与融合多模态表征相加后，以内积得到偏好分数。', cls: 'good' }
    : { text: '路径尚未完整：先检查两个视图，再进行最终打分。', cls: 'bad' };
}

export const MgcnArchitectureMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<ArchState>(initialState);

  const chooseStage = (index: number) => setState((s) => ({
    ...s,
    activeStage: clamp(index, 0, 4),
    pulse: 0,
    autoPlay: false,
    judgment: null,
    visited: s.visited.includes(index) ? s.visited : [...s.visited, index],
  }));

  useEffect(() => {
    if (!state.autoPlay) return;
    const timer = window.setInterval(() => {
      setState((s) => {
        const next = (s.activeStage + 1) % stages.length;
        return {
          ...s,
          activeStage: next,
          pulse: next === 1 || next === 2 ? 1 : 0,
          visited: s.visited.includes(next) ? s.visited : [...s.visited, next],
        };
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [state.autoPlay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    rounded(ctx, 6, 6, 548, 228, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.stroke();
    arrow(ctx, 102, 113, 112, 113, state.activeStage >= 1);
    arrow(ctx, 200, 73, 210, 73, state.activeStage === 1);
    arrow(ctx, 200, 143, 210, 143, state.activeStage === 2);
    arrow(ctx, 338, 73, 350, 96, state.activeStage >= 3);
    arrow(ctx, 338, 143, 350, 120, state.activeStage >= 3);
    arrow(ctx, 446, 113, 456, 113, state.activeStage >= 4);
    stages.forEach((_, i) => stageCard(ctx, i, state.activeStage === i, state.visited.includes(i), state.modality));

    if ((state.activeStage === 1 || state.activeStage === 2) && state.pulse > 0) {
      const y = state.activeStage === 1 ? 66 : 150;
      const x = 222 + (state.pulse % 4) * 26;
      ctx.fillStyle = ORANGE;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = PURPLE;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(398, 156);
    ctx.quadraticCurveTo(420, 182, 452, 160);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PURPLE;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('训练辅助一致性', 374, 178);

    ctx.fillStyle = '#f7f9fc';
    ctx.fillRect(14, 194, 532, 30);
    ctx.fillStyle = INK;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(`当前表征：${stages[state.activeStage].symbol}`, 24, 213);
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'right';
    ctx.fillText(stages[state.activeStage].evidence, 536, 213);
    ctx.textAlign = 'left';
  }, [state]);

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) * W / rect.width, 0, W);
    const y = clamp((event.clientY - rect.top) * H / rect.height, 0, H);
    const regions = [
      [14, 102, 72, 154], [112, 200, 38, 96], [210, 338, 112, 170], [350, 446, 72, 154], [456, 546, 72, 154],
    ];
    const hit = regions.findIndex(([x1, x2, y1, y2]) => x >= x1 && x <= x2 && y >= y1 && y <= y2);
    if (hit >= 0) chooseStage(hit);
  };

  const feedback = feedbackFor(state);
  const ready = state.visited.includes(1) && state.visited.includes(2);

  return (
    <div onKeyDown={(e) => {
      if (e.key === 'ArrowRight') chooseStage(state.activeStage + 1);
      if (e.key === 'ArrowLeft') chooseStage(state.activeStage - 1);
      if (e.key.toLowerCase() === 'p' && (state.activeStage === 1 || state.activeStage === 2)) {
        setState((s) => ({ ...s, pulse: Math.min(3, s.pulse + 1), autoPlay: false }));
      }
      if (e.key === 'Escape') setState((s) => ({ ...s, autoPlay: false }));
    }}>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        aria-label="MGCN 五阶段交互架构图，可用下方按钮执行同样操作"
      />
      <div className="ctrl" role="group" aria-label="架构阶段">
        {stages.map((stage, index) => (
          <button key={stage.label} type="button" aria-pressed={state.activeStage === index} onClick={() => chooseStage(index)}>
            {index + 1} {stage.label}
          </button>
        ))}
      </div>
      <div className="ctrl" role="group" aria-label="传播控制">
        <button type="button" onClick={() => chooseStage(state.activeStage - 1)} disabled={state.activeStage === 0}>上一步</button>
        <button type="button" onClick={() => chooseStage(state.activeStage + 1)} disabled={state.activeStage === 4}>下一步</button>
        <button
          type="button"
          disabled={state.activeStage !== 1 && state.activeStage !== 2}
          onClick={() => setState((s) => ({ ...s, pulse: Math.min(3, s.pulse + 1), autoPlay: false }))}
        >传播一次</button>
        <button type="button" aria-pressed={state.autoPlay} onClick={() => setState((s) => ({ ...s, autoPlay: !s.autoPlay }))}>
          {state.autoPlay ? '暂停演示' : '自动演示'}
        </button>
        <button type="button" onClick={() => setState(initialState)}>重置</button>
      </div>
      <div className="ctrl" role="group" aria-label="选择模态">
        <span>当前模态</span>
        {(['visual', 'text'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={state.modality === m} onClick={() => setState((s) => ({ ...s, modality: m, autoPlay: false }))}>
            {m === 'visual' ? '视觉' : '文本'}
          </button>
        ))}
        <span className="val">{ready && state.activeStage === 4 ? '路径完整' : '继续检查'}</span>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
      <div className="ctrl" role="group" aria-label="架构判断题">
        <span>把原始模态直接塞进用户-物品视图，会先破坏哪条边界？</span>
        <button type="button" onClick={() => setState((s) => ({ ...s, judgment: 'correct', autoPlay: false }))}>净化后再分视图</button>
        <button type="button" onClick={() => setState((s) => ({ ...s, judgment: 'wrong', autoPlay: false }))}>内积必须改成余弦</button>
        <button type="button" onClick={() => setState((s) => ({ ...s, judgment: 'wrong', autoPlay: false }))}>Recall 必须下降固定比例</button>
      </div>
      <div className="feedback">适用：已有隐式行为且模态可能带噪。警惕：行为侧信号过少时门控依据变弱；架构图本身不能证明跨协议的普遍领先。</div>
    </div>
  );
};

export default MgcnArchitectureMap;
