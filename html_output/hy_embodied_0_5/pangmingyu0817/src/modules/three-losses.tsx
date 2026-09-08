import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type TrainingStage = 'pretrain' | 'later';

const W = 244;
const H = 130;
const COLORS = { bg: '#f5f8f0', wall: '#b8c9a7', ink: '#21324a', blue: '#27446e', purple: '#7c3aed', green: '#228d5c', gray: '#d7deea' };

function draw(ctx: CanvasRenderingContext2D, stage: TrainingStage) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = COLORS.wall; ctx.lineWidth = 2;
  for (let x = 10; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, 105); ctx.stroke(); }
  const nodes = [
    { y: 28, color: COLORS.blue, label: '语言' },
    { y: 60, color: COLORS.purple, label: '局部' },
    { y: 92, color: COLORS.green, label: '全局' },
  ];
  nodes.forEach((node, index) => {
    const active = stage === 'pretrain' || index === 0;
    ctx.strokeStyle = active ? node.color : COLORS.gray;
    ctx.lineWidth = active ? 3 : 1;
    ctx.setLineDash(active ? [] : [4, 3]);
    ctx.beginPath(); ctx.moveTo(50, node.y); ctx.lineTo(112, 60); ctx.lineTo(190, node.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = active ? node.color : '#ffffff'; ctx.strokeStyle = active ? node.color : COLORS.gray;
    ctx.beginPath(); ctx.arc(40, node.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COLORS.ink; ctx.font = '11px system-ui'; ctx.fillText(node.label, 9, node.y + 4);
    if (!active) { ctx.strokeStyle = '#c43f52'; ctx.beginPath(); ctx.moveTo(34, node.y - 6); ctx.lineTo(46, node.y + 6); ctx.stroke(); }
  });
  ctx.strokeStyle = stage === 'pretrain' ? COLORS.green : COLORS.blue; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(104, 48, 28, 25, 7); ctx.stroke();
  ctx.fillStyle = COLORS.ink; ctx.font = 'bold 11px system-ui'; ctx.fillText('L总', 110, 64);
  ctx.font = 'bold 12px system-ui'; ctx.fillText(stage === 'pretrain' ? '预训练' : '仅语言', 95, 120);
}

export const ThreeLosses: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trainingStage, setTrainingStage] = useState<TrainingStage>('pretrain');

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => { draw(ctx, trainingStage); canvas.classList.add('is-ready'); };
    const disconnect = observeCanvas(canvas, render, () => {}); render();
    return disconnect;
  }, [trainingStage]);

  const pretrain = trainingStage === 'pretrain';
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} role="img" aria-label={pretrain ? '预训练阶段，语言、视觉下一代码与全局对齐三路损失汇合' : '后续阶段，仅语言损失启用，视觉和全局辅助监督已移除'} />
    <div className="chip-row" role="group" aria-label="选择训练阶段" onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setTrainingStage(pretrain ? 'later' : 'pretrain'); }}>
      <button className={`chip ${pretrain ? 'selected' : ''}`} aria-pressed={pretrain} onClick={() => setTrainingStage('pretrain')}>预训练</button>
      <button className={`chip ${!pretrain ? 'selected' : ''}`} aria-pressed={!pretrain} onClick={() => setTrainingStage('later')}>后续阶段</button>
    </div>
    <div className={`feedback ${pretrain ? 'good' : ''}`} aria-live="polite">{pretrain ? '预训练：语言、局部视觉代码与全局视觉语义共同受监督。' : '后续阶段：仅保留自回归语言损失；视觉与全局辅助监督已移除。'}</div>
    <div className="ctrl" aria-label="损失状态表">
      <span><b>L_llm</b>：启用</span><span><b>L_vision</b>：{pretrain ? '启用' : '已移除'}</span><span><b>L_global</b>：{pretrain ? '启用' : '已移除'}</span>
    </div>
  </div>;
};

export default ThreeLosses;
