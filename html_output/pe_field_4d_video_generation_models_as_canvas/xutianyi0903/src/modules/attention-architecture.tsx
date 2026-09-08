import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStage, drawSceneLabel, startObservedLoop } from './stage-analogy';

type Mode = 'base' | 'pe';
type DetailStep = 0 | 1 | 2 | 3;

const detailLabels = ['输入', 'Q/K/V', '分组检索', '输出'];

function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  color: string,
  active: boolean,
  sub?: string,
) {
  ctx.fillStyle = active ? `${color}20` : C.white;
  ctx.strokeStyle = active ? color : C.line;
  ctx.lineWidth = active ? 3 : 1.4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();
  drawSceneLabel(ctx, title, x + w / 2, y + 23, active ? color : C.ink, 'center');
  if (sub) {
    ctx.fillStyle = active ? color : C.muted;
    ctx.font = '600 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(sub, x + w / 2, y + h - 12);
    ctx.textAlign = 'left';
  }
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.line) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(a - .45), y2 - 7 * Math.sin(a - .45));
  ctx.lineTo(x2 - 7 * Math.cos(a + .45), y2 - 7 * Math.sin(a + .45));
  ctx.closePath(); ctx.fill();
}

export const AttentionArchitecture: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode; step: DetailStep }>({ mode: 'base', step: 0 });
  const [mode, setMode] = useState<Mode>('base');
  const [step, setStep] = useState<DetailStep>(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startObservedLoop(canvas, 760, 360, (ctx) => {
      const state = stateRef.current;
      const pe = state.mode === 'pe';
      clearStage(ctx, 760, 360);
      drawSceneLabel(ctx, pe ? 'PE-Field 4D：修改 Self-Attention 内部' : '原始 Wan2.1 Transformer Block', 22, 25, pe ? C.blue : C.ink);
      drawSceneLabel(ctx, '原文本 Cross-Attention 与 FFN 保留', 738, 25, C.green, 'right');

      block(ctx, 18, 62, 94, 70, '目标 x', C.purple, state.step === 0, '[B,N,D]');
      block(ctx, 135, 72, 74, 50, 'Norm', C.muted, false);
      block(ctx, 234, 53, 190, 88, pe ? '几何联合注意力' : 'Self-Attention', pe ? C.blue : C.purple, state.step === 1, pe ? 'Qₓ ↔ [Kₓ;Kᵧ]' : 'Qₓ ↔ Kₓ,Vₓ');
      block(ctx, 456, 72, 124, 50, '文本 Cross-Attn', C.green, state.step === 3, '保持不变');
      block(ctx, 606, 72, 72, 50, 'FFN', C.green, state.step === 3, '保持');
      block(ctx, 699, 62, 48, 70, 'x′', C.orange, state.step === 3, '[B,N,D]');
      arrow(ctx, 112, 97, 135, 97);
      arrow(ctx, 209, 97, 234, 97);
      arrow(ctx, 424, 97, 456, 97, pe ? C.blue : C.purple);
      arrow(ctx, 580, 97, 606, 97);
      arrow(ctx, 678, 97, 699, 97);

      block(ctx, 469, 155, 108, 54, '文本 Token', C.green, state.step === 0, '[B,Ltxt,Dtxt]');
      arrow(ctx, 523, 155, 523, 122, C.green);

      if (pe) {
        block(ctx, 155, 181, 140, 62, '参考内容 y', C.green, state.step === 0, '[B,M,D]');
        block(ctx, 155, 272, 140, 62, '投影地址 aᵧ', C.blue, state.step === 0, '(t+Δd,h̃,w̃)');
        arrow(ctx, 295, 212, 329, 141, C.green);
        arrow(ctx, 295, 302, 369, 141, C.blue);
      }

      ctx.fillStyle = C.white;
      ctx.strokeStyle = state.step === 2 ? C.orange : C.line;
      ctx.lineWidth = state.step === 2 ? 3 : 1.4;
      ctx.beginPath();
      ctx.roundRect(327, 172, 410, 162, 9);
      ctx.fill();
      ctx.stroke();

      if (!pe) {
        drawSceneLabel(ctx, '原始注意力只从目标视频自身读取记忆', 532, 202, C.ink, 'center');
        block(ctx, 365, 225, 132, 62, 'Qₓ', C.purple, state.step === 1, 'native RoPE');
        block(ctx, 557, 225, 132, 62, 'Kₓ , Vₓ', C.purple, state.step === 1, 'global memory');
        arrow(ctx, 497, 256, 557, 256, C.purple);
      } else if (state.step < 2) {
        drawSceneLabel(ctx, '同一个注意力算子中的两类记忆', 532, 198, C.ink, 'center');
        block(ctx, 348, 215, 106, 69, 'Qₓ', C.purple, state.step === 1, '目标提问');
        block(ctx, 478, 215, 106, 69, 'Kₓ,Vₓ', C.purple, state.step === 1, '全局目标');
        block(ctx, 608, 215, 106, 69, 'Kᵧ,Vᵧ', C.blue, state.step === 1, '参考几何');
        arrow(ctx, 454, 250, 478, 250, C.purple);
        arrow(ctx, 584, 250, 608, 250, C.blue);
      } else {
        drawSceneLabel(ctx, '第 g 个目标潜帧组', 532, 198, C.orange, 'center');
        block(ctx, 348, 216, 112, 72, 'Q⁽ᵍ⁾', C.purple, true, '[B,H,G,dₕ]');
        block(ctx, 481, 216, 112, 72, '全局 Kₓ,Vₓ', C.purple, true, '所有目标帧');
        block(ctx, 614, 216, 102, 72, '局部 Kᵧ⁽ᵍ⁾', C.blue, true, '同时间组');
        drawSceneLabel(ctx, '→ SDPA → O⁽ᵍ⁾', 532, 316, C.orange, 'center');
      }
    });
  }, []);

  const update = (nextMode: Mode, nextStep: DetailStep) => {
    stateRef.current = { mode: nextMode, step: nextStep };
    setMode(nextMode);
    setStep(nextStep);
  };

  const feedback = mode === 'base'
    ? '原始 Wan 已会生成、建模运动和补全未知区域，但没有参考视频到目标位置的显式几何 K/V。'
    : step === 0
      ? '新增输入只有参考视觉内容 y 与投影地址 aᵧ；文本条件、目标 latent 和扩散时间仍保留。'
      : step === 1
        ? 'Q 仍来自目标 x；目标 Kₓ,Vₓ 提供全局视频记忆，参考 Kᵧ,Vᵧ 提供位置对齐内容。'
        : step === 2
          ? '每组 Query 读取全局目标记忆，但只读取对应时间组的参考 context，兼顾跨帧一致与计算开销。'
          : '联合注意力输出形状仍为 [B,N,D]，继续进入原文本 Cross-Attention、FFN 和后续 Wan Block。';

  return (
    <div>
      <canvas ref={ref} width={760} height={360} aria-label="原始Wan2.1与PE-Field 4D交互式注意力结构对比" />
      <div className="ctrl">
        <button className={`chip ${mode === 'base' ? 'active' : ''}`} onClick={() => update('base', step)}>原始 Wan2.1</button>
        <button className={`chip ${mode === 'pe' ? 'active' : ''}`} onClick={() => update('pe', step)}>PE-Field 4D</button>
        {detailLabels.map((label, index) => (
          <button key={label} className={`chip ${step === index ? 'active' : ''}`} onClick={() => update(mode, index as DetailStep)}>
            {index + 1}. {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${mode === 'pe' && step === 3 ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};

export default AttentionArchitecture;
