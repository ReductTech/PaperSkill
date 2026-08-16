import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Reward = 'ocr' | 'aesthetic' | 'semantic' | 'editing';
type Stage = 1 | 2;

const W = 820;
const H = 390;
const rewards: Array<{ id: Reward; label: string; evaluator: string }> = [
  { id: 'ocr', label: 'OCR 文本', evaluator: 'PaddleOCR-VL-1.5' },
  { id: 'aesthetic', label: '美学质量', evaluator: 'Qwen3.5-27B 美学 rubric' },
  { id: 'semantic', label: '语义理解', evaluator: 'Qwen3.5-27B 语义 rubric' },
  { id: 'editing', label: '编辑质量', evaluator: 'RationalRewards' },
];

const palette = {
  bg: '#f5f0e8', paper: '#faf9f5', grid: '#d8c9b0', blue: '#cc785c', green: '#5db872',
  red: '#c64545', orange: '#e8a55a', purple: '#5db8a6', text: '#252523', muted: '#6c6a64', axis: '#e6dfd8',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.stroke();
}

export const NftAlignmentLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reward, setReward] = useState<Reward>('ocr');
  const [stage, setStage] = useState<Stage>(1);
  const [update, setUpdate] = useState(0);
  const selected = rewards.find((item) => item.id === reward)!;
  const editing = reward === 'editing';
  const mixture = editing ? '编辑 : 文生图 = 4 : 1' : stage === 1 ? '美学 : 文本 : 语义 = 1 : 1 : 1' : '美学 : 文本 : 语义 = 2 : 4 : 1';
  const schedule = editing ? '共 300 个优化步' : stage === 1 ? '阶段 1 · 140 个优化步' : '阶段 2 · 继续 60 个优化步';
  const detail = editing
    ? '检查指令遵循、未编辑区域保持、物理与感知合理性、文字质量。'
    : reward === 'ocr'
      ? '核对目标文字、场景文字、排版与文字—对象关系。'
      : reward === 'aesthetic'
        ? '检查光照、构图、色彩、质感与风格。'
        : '把对象属性、空间关系、计数和动作拆成可核对问题。';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = palette.grid; ctx.globalAlpha = 0.28; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.font = '13px "Segoe UI", sans-serif'; ctx.textBaseline = 'middle';

    ctx.fillStyle = palette.paper; ctx.strokeStyle = palette.axis; roundRect(ctx, 24, 28, 178, 190);
    ctx.fillStyle = palette.blue; ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillText('能力标签', 42, 52);
    ctx.fillStyle = palette.text; ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(selected.label, 42, 82); ctx.fillText('每条提示只走一条路线', 42, 112);
    ctx.strokeStyle = palette.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(202, 122); ctx.lineTo(282, 122); ctx.stroke();
    ctx.fillStyle = palette.blue; ctx.beginPath(); ctx.moveTo(282, 122); ctx.lineTo(270, 116); ctx.lineTo(270, 128); ctx.fill();

    ctx.fillStyle = palette.paper; ctx.strokeStyle = palette.blue; ctx.lineWidth = 2.5; roundRect(ctx, 282, 62, 205, 120);
    ctx.fillStyle = palette.blue; ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillText('当前唯一评分器', 302, 86);
    ctx.fillStyle = palette.text; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(selected.evaluator, 302, 120);
    ctx.fillStyle = palette.muted; ctx.fillText('不与其他评分器分数相加', 302, 150);

    const levels = reward === 'semantic' ? [0.74, 0.42, 0.9] : reward === 'aesthetic' ? [0.38, 0.88, 0.65] : reward === 'editing' ? [0.55, 0.32, 0.86] : [0.3, 0.72, 0.94];
    ctx.fillStyle = palette.paper; ctx.strokeStyle = palette.axis; ctx.lineWidth = 1.5; roundRect(ctx, 520, 28, 276, 190);
    ctx.fillStyle = palette.purple; ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillText('同类型候选归一化 rᵢ', 540, 52);
    levels.forEach((level, i) => {
      const y = 84 + i * 42;
      ctx.fillStyle = palette.axis; ctx.fillRect(566, y, 182, 12);
      ctx.fillStyle = i === levels.indexOf(Math.max(...levels)) ? palette.green : i === levels.indexOf(Math.min(...levels)) ? palette.red : palette.purple;
      ctx.fillRect(566, y, 182 * level, 12);
      ctx.fillStyle = palette.text; ctx.fillText(`草稿 ${i + 1}`, 540, y + 6);
      ctx.fillStyle = palette.muted; ctx.fillText(level > 0.8 ? '较高' : level < 0.4 ? '较低' : '中等', 752, y + 6);
    });

    ctx.fillStyle = palette.paper; ctx.strokeStyle = palette.axis; roundRect(ctx, 24, 244, 772, 116);
    ctx.fillStyle = palette.text; ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillText(mixture, 46, 270);
    ctx.fillStyle = palette.muted; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(schedule, 46, 300);
    const slots = editing ? 5 : stage === 1 ? 3 : 7;
    const active = update % slots;
    for (let i = 0; i < slots; i += 1) {
      const sw = Math.min(72, 600 / slots);
      const x = 46 + i * (sw + 8);
      ctx.fillStyle = i === active ? palette.orange : i < active ? palette.green : palette.axis;
      ctx.fillRect(x, 326, sw, 12);
    }
    ctx.fillStyle = palette.muted; ctx.fillText('当前更新指针', 650, 332);
    canvas.classList.add('is-ready');
  }, [reward, stage, update, selected.label, selected.evaluator, mixture, schedule]);

  const feedback = editing
    ? '编辑与文生图更新按 4:1 交错，共 300 步；编辑候选只由 RationalRewards 评分。'
    : stage === 1
      ? '140 步保持 1:1:1，让文字、美学与语义能力同时在场。'
      : '再训练 60 步，并把较难文本提示的权重提高到 2:4:1；美学与语义仍保留。';

  return (
    <div>
      <div className="chip-row" role="group" aria-label="奖励类型">
        {rewards.map((item) => (
          <button key={item.id} className={`chip ${reward === item.id ? 'selected' : ''}`} aria-pressed={reward === item.id}
            onClick={() => { setReward(item.id); setUpdate(0); }}>{item.label}</button>
        ))}
      </div>
      <div className="chip-row" role="group" aria-label="训练阶段">
        {[1, 2].map((value) => (
          <button key={value} className={`chip ${stage === value && !editing ? 'selected' : ''}`} disabled={editing}
            aria-pressed={stage === value && !editing} onClick={() => { setStage(value as Stage); setUpdate(0); }}>阶段 {value}</button>
        ))}
        <button className="tiny" onClick={() => setUpdate((value) => value + 1)}>下一次更新</button>
      </div>
      {editing ? <div className="step-desc">编辑后训练采用单个 300 步联合日程，阶段选择在此模式下停用。</div> : null}
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-describedby={`sum-${chapterId}-${moduleId}`} />
      <div className="metrics" id={`sum-${chapterId}-${moduleId}`}>
        <div className="metric"><div className="l">当前评分器</div><div className="v" style={{ fontSize: 16 }}>{selected.evaluator}</div></div>
        <div className="metric"><div className="l">训练配比</div><div className="v" style={{ fontSize: 16 }}>{mixture}</div></div>
        <div className="metric"><div className="l">评分范围</div><div className="v" style={{ fontSize: 16 }}>仅当前奖励类型</div></div>
      </div>
      <p className="step-desc">{detail}</p>
      <div className="feedback good" aria-live="polite">{feedback} 不同评分器分布不同，因此只在同一奖励类型内归一化。</div>
    </div>
  );
};

export default NftAlignmentLab;
