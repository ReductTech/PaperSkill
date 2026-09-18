import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 340;
const models = ['GPT-5.4', 'GLM-5', 'MiMo-V2-Pro', 'MiniMax-M2.7'] as const;
const categories = ['总体', '代码智能', '社交交互', '检索', '创意综合', '安全对齐'] as const;
type Model = typeof models[number];
type Category = typeof categories[number];

const overall: Record<Model, { base: number; delta: number }> = {
  'GPT-5.4': { base: 50.3, delta: 5.2 },
  'GLM-5': { base: 42.6, delta: -0.1 },
  'MiMo-V2-Pro': { base: 40.2, delta: 3.7 },
  'MiniMax-M2.7': { base: 33.8, delta: 0.1 },
};

const gptDelta: Record<Category, number> = {
  '总体': 5.2,
  '代码智能': 22.4,
  '社交交互': -48.5,
  '检索': 9.5,
  '创意综合': 15.9,
  '安全对齐': -0.5,
};

export const SkillAblation: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<Model>('GPT-5.4');
  const [category, setCategory] = useState<Category>('总体');
  const [enabled, setEnabled] = useState(false);
  const exact = category === '总体' || model === 'GPT-5.4';
  const delta = category === '总体' ? overall[model].delta : gptDelta[category];
  const base = category === '总体' ? overall[model].base : 50;
  const after = base + delta;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#21324a'; ctx.font = '700 24px "Segoe UI", sans-serif';
    ctx.fillText(`${model} · ${category}`, 48, 46);
    ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillStyle = '#68778f';
    ctx.fillText('技能消融：同一模型、同一类别前后对照', 48, 74);
    if (!exact) {
      ctx.fillStyle = '#eef2f7'; ctx.fillRect(48, 108, 984, 150);
      ctx.fillStyle = '#27446e'; ctx.font = '700 22px "Segoe UI", sans-serif';
      ctx.fillText('本教程未展示这个单元格的精确数值', 310, 168);
      ctx.font = '18px "Segoe UI", sans-serif'; ctx.fillStyle = '#68778f';
      ctx.fillText('论文的总体结论：代码智能与创意综合在四个模型上都提升。', 244, 208);
    } else {
      const scale = 8.8;
      const drawBar = (y: number, value: number, color: string, label: string) => {
        ctx.fillStyle = '#e7ebf1'; ctx.fillRect(210, y, 700, 44);
        ctx.fillStyle = color; ctx.fillRect(210, y, Math.max(4, Math.min(700, value * scale)), 44);
        ctx.fillStyle = '#21324a'; ctx.font = '700 18px "Segoe UI", sans-serif'; ctx.fillText(label, 48, y + 29);
        ctx.fillText(value.toFixed(1), 930, y + 29);
      };
      drawBar(118, base, '#27446e', '无技能');
      drawBar(194, after, delta >= 0 ? '#228d5c' : '#c43f52', '加载技能');
      ctx.fillStyle = delta >= 0 ? '#228d5c' : '#c43f52';
      ctx.font = '700 23px "Segoe UI", sans-serif';
      ctx.fillText(`${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`, 470, 302);
    }
    canvas.classList.add('is-ready');
  }, [model, category, exact, base, after, delta]);

  const feedback = !exact
    ? '该组合不显示未经蓝图记录的精确值；请只读取论文明确支持的类别趋势。'
    : !enabled
      ? '当前显示无技能基线；打开技能后查看同条件差值。'
      : delta > 0
        ? `加载技能后提高 ${delta.toFixed(1)}；这是该技能包下的相关性，不是普遍因果律。`
        : `加载技能后变化 ${delta.toFixed(1)}；技能可能挤占时间或诱发不匹配的工具路径。`;

  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    <div className="chip-row" aria-label="选择模型">
      {models.map(item => <button key={item} className={`chip ${model === item ? 'active' : ''}`} aria-pressed={model === item} onClick={() => { setModel(item); setCategory('总体'); }}>{item}</button>)}
    </div>
    <div className="chip-row" aria-label="选择任务类别">
      {categories.map(item => <button key={item} className={`chip ${category === item ? 'active' : ''}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
      <button className={`tiny ${enabled ? '' : 'ghost'}`} aria-pressed={enabled} onClick={() => setEnabled(v => !v)}>{enabled ? '已加载技能' : '加载技能'}</button>
    </div>
    <div className={`feedback ${enabled && exact ? (delta > 0 ? 'good' : 'bad') : ''}`}>{feedback}</div>
  </div>;
};

export default SkillAblation;
