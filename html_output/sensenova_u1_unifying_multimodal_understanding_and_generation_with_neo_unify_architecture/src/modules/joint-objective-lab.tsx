import React, { useCallback, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStudio, drawDesk, drawGuide, drawLabel, useObservedCanvas } from './studio-kit';

const W = 960;
const H = 520;
type Branch = 'understanding' | 'generation';

const stages = ['构造输入', '模型预测', '构造目标', '计算损失'];
const copy: Record<Branch, string[]> = {
  understanding: [
    '给定前文与多模态上下文，目标是预测下一个文本 token。',
    '理解线性头把当前表示映射为词表上的预测概率。',
    '监督目标是语料中的真实下一个 token。',
    '对所有文本位置取平均交叉熵，得到理解损失。',
  ],
  generation: [
    '从干净图像与随机噪声构造当前的像素流状态。',
    '生成侧先直接预测干净图像，而不是直接预测速度。',
    '将预测图像与真实图像分别换算为预测速度和目标速度。',
    '对两种速度计算均方误差，得到生成损失。',
  ],
};

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, value: string, tone: string, active: boolean) {
  ctx.fillStyle = C.white;
  ctx.strokeStyle = active ? tone : C.border;
  ctx.lineWidth = active ? 4 : 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 11); ctx.fill(); ctx.stroke();
  drawLabel(ctx, title, x + w / 2, y + 25, active ? tone : C.muted, 12, 'center');
  drawLabel(ctx, value, x + w / 2, y + 58, active ? C.text : C.muted, 12, 'center');
}

export const JointObjectiveLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [branch, setBranch] = useState<Branch>('understanding');
  const [step, setStep] = useState(0);
  const tone = branch === 'understanding' ? C.current : C.success;

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    clearStudio(ctx, W, H);
    drawDesk(ctx, W, H, 464);
    drawLabel(ctx, '联合训练目标', 28, 30, C.text, 18);
    drawLabel(ctx, `当前分支：${branch === 'understanding' ? '理解分支 · 文本交叉熵' : '生成分支 · 像素空间流匹配'}`, 932, 30, tone, 12.5, 'right');

    ctx.strokeStyle = C.border; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(80, 88); ctx.lineTo(880, 88); ctx.stroke();
    stages.forEach((name, index) => {
      const x = 80 + index * (800 / 3);
      ctx.fillStyle = index === step ? C.control : index < step ? tone : C.white;
      ctx.strokeStyle = index <= step ? tone : C.border;
      ctx.lineWidth = index === step ? 4 : 2;
      ctx.beginPath(); ctx.arc(x, 88, index === step ? 12 : 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      drawLabel(ctx, `${index + 1} ${name}`, x, 116, index === step ? C.control : C.muted, 11, 'center');
    });

    const values = branch === 'understanding'
      ? ['前文 + 上下文', '词表预测概率', '真实下一个 token', '平均交叉熵']
      : ['干净图像 + 噪声', '预测干净图像', '预测速度 / 目标速度', '速度均方误差'];
    values.forEach((value, index) => {
      const x = 34 + index * 230;
      box(ctx, x, 166, 190, 102, stages[index], value, tone, index === step);
      if (index < values.length - 1) drawGuide(ctx, x + 190, 217, x + 230, 217, index < step ? tone : C.border);
    });

    ctx.fillStyle = C.white; ctx.strokeStyle = tone; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(82, 310, 796, 114, 12); ctx.fill(); ctx.stroke();
    drawLabel(ctx, copy[branch][step], 480, 340, C.text, 13, 'center');
    drawLabel(ctx, '完整符号与公式在本模块下方统一以数学排版呈现。', 480, 379, tone, 15, 'center');
    drawLabel(ctx, '总目标将理解损失与生成损失按权重组合。', 480, 449, C.aux, 15, 'center');
  }, [branch, step, tone]);

  useObservedCanvas(canvasRef, W, H, draw);

  const chooseBranch = (next: Branch) => { setBranch(next); setStep(0); };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} tabIndex={0}
        aria-label={`联合训练目标，当前${branch === 'understanding' ? '理解' : '生成'}分支，第${step + 1}步${stages[step]}`}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') setStep((value) => Math.min(3, value + 1));
          if (event.key === 'ArrowLeft') setStep((value) => Math.max(0, value - 1));
        }} />
      <div className="ctrl" role="radiogroup" aria-label="选择目标分支">
        <button type="button" role="radio" aria-checked={branch === 'understanding'} onClick={() => chooseBranch('understanding')}>理解分支：文本交叉熵</button>
        <button type="button" role="radio" aria-checked={branch === 'generation'} onClick={() => chooseBranch('generation')}>生成分支：像素空间流匹配</button>
      </div>
      <div className="ctrl" role="group" aria-label="选择目标计算步骤">
        {stages.map((name, index) => <button key={name} type="button" aria-pressed={step === index} onClick={() => setStep(index)}>{index + 1} · {name}</button>)}
      </div>
      <div className="feedback good" aria-live="polite">{copy[branch][step]}</div>
      <p className="note">论文依据：§3.3，Eq.1–5。生成分支先直接预测干净图像（x-predict），再换算为速度并计算均方误差。噪声尺度 σ_R 由 §3.1 定义，本节只引用该量。</p>
    </div>
  );
};

export default JointObjectiveLab;
