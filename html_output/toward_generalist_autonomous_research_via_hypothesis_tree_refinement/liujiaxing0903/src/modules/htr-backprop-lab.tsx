import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 680;
const H = 330;
const STEPS = [
  { label: '记录验证事实', note: 'N1.1 与 N2.1 的开发准确率均为 60.0%，节点被剪枝但标记为 informative：细粒度检查有用，却找不回从未被检索到的候选。' },
  { label: '定位覆盖瓶颈', note: '祖先洞见把问题从“验证不够严格”改写为“候选覆盖不足”；论文还指出，hostile verifier 的部分收益来自答案归一化。' },
  { label: '生成证据档案假设', note: 'N3.1 用 K=5 条独立 ReAct 轨迹和 evidence dossier 聚合候选，开发准确率 65.0%，状态为 merged。' },
  { label: '写入祖先约束', note: '全局研究状态保留两条约束：共享候选证据，同时保持搜索轨迹独立；该约束最终导向 N8.1 的两轮共享设计。' },
] as const;

function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  active: boolean,
  failed = false
) {
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.fillStyle = active ? (failed ? '#c43f52' : '#27446e') : '#f5f8f0';
  ctx.fill();
  ctx.lineWidth = active ? 4 : 2;
  ctx.strokeStyle = active ? (failed ? '#8f2638' : '#27446e') : '#76906a';
  ctx.stroke();
  ctx.fillStyle = active ? '#ffffff' : '#21324a';
  ctx.font = `600 13px "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
}

function drawBranch(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  active: boolean
) {
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.lineWidth = active ? 6 : 3;
  ctx.strokeStyle = active ? '#27446e' : '#b8c9a7';
  ctx.setLineDash(active ? [] : [7, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  ctx.font = `600 12px "Segoe UI", sans-serif`;
  const width = ctx.measureText(text).width + 18;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.fillRect(x - width / 2, y - 13, width, 26);
  ctx.strokeRect(x - width / 2, y - 13, width, 26);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export const HtrBackpropLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

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

    const root: [number, number] = [340, 58];
    const parent: [number, number] = [340, 150];
    const failed: [number, number] = [180, 260];
    const next: [number, number] = [500, 260];
    drawBranch(ctx, root, parent, step >= 3);
    drawBranch(ctx, parent, failed, step >= 1);
    drawBranch(ctx, parent, next, step >= 2);
    drawNode(ctx, root[0], root[1], '祖先', step >= 3);
    drawNode(ctx, parent[0], parent[1], '覆盖', step >= 1);
    drawNode(ctx, failed[0], failed[1], '验证器', true, true);
    drawNode(ctx, next[0], next[1], 'N3.1', step >= 2);

    drawTag(ctx, 180, 307, 'N1.1 / N2.1 · 60.0%', '#c43f52');
    if (step >= 1) drawTag(ctx, 252, 211, '洞见：覆盖不足', '#7c3aed');
    if (step >= 2) drawTag(ctx, 505, 307, '65.0% · merged', '#228d5c');
    if (step >= 3) drawTag(ctx, 505, 58, '共享证据，轨迹独立', '#228d5c');

    ctx.fillStyle = '#21324a';
    ctx.font = `600 14px "Segoe UI", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`T = (V, E)　当前回传阶段 ${step + 1}/4`, 18, 24);
    canvas.classList.add('is-ready');
  }, [step]);

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
          aria-label={`假设树回传图，当前阶段：${STEPS[step].label}`}
        />
      </div>
      <div className="ctrl" aria-label="回传步骤" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {STEPS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={step === index}
            onClick={() => setStep(index)}
            style={{ fontWeight: step === index ? 700 : 500 }}
          >
            {index + 1}. {item.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${step === 0 ? 'bad' : step === 3 ? 'good' : ''}`} aria-live="polite">
        <strong>{STEPS[step].label}：</strong>{STEPS[step].note}
      </div>
      <p style={{ color: '#21324a', marginBottom: 0 }}>节点、开发准确率与状态来自 Figure 6；画布中的祖先层级是回传机制示意，不重建论文未给出的这些节点的实际 parent_id。</p>
    </div>
  );
};

export default HtrBackpropLab;
