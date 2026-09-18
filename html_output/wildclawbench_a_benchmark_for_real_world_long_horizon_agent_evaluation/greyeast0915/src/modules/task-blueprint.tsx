import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 310;
const C = { bg: '#f5f8f0', rock: '#e3eadc', route: '#92400e', blue: '#27446e', green: '#228d5c', orange: '#f07e47', purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea' };
const labels = ['任务说明', '工作区与工具', '时间/技能配置', '评分函数'] as const;
type Step = 0 | 1 | 2 | 3;

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, active: boolean, done: boolean) {
  const color = done ? C.green : active ? C.blue : C.line;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = color; ctx.lineWidth = active ? 3 : 1.5; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color === C.line ? C.muted : color; ctx.font = '700 18px "Segoe UI", sans-serif'; ctx.fillText(title, x + 18, y + 30);
}

export const TaskBlueprint: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<{ step: Step }>({ step: 0 });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.height = 'auto';
    const render = () => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      const current = model.step;
      panel(ctx, 35, 46, 330, 210, '路线卡 / 结构化说明', current === 0, current > 0);
      ctx.fillStyle = current >= 0 ? C.blue : C.muted; ctx.font = '600 15px ui-monospace, monospace'; ctx.fillText('--- YAML 元数据 ---', 58, 92);
      ctx.fillStyle = C.ink; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText('目标：完成真实工作', 58, 126); ctx.fillText('提示：结构化 Markdown', 58, 158);
      ctx.strokeStyle = C.route; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, 202); ctx.lineTo(310, 202); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText('rubrics：验收要求', 58, 232);

      panel(ctx, 405, 46, 330, 210, '可复现容器', current === 1 || current === 2, current > 2);
      const resources = [
        { label: '工作区文件', color: C.route }, { label: '真实工具', color: C.blue },
        { label: '配置的时间预算', color: C.orange }, { label: '可选外部技能 / 环境变量', color: C.purple },
      ];
      resources.forEach((item, i) => {
        const enabled = i < 2 ? current >= 1 : current >= 2;
        ctx.fillStyle = enabled ? item.color : C.line; ctx.beginPath(); ctx.roundRect(430, 86 + i * 39, 18, 18, 5); ctx.fill();
        ctx.fillStyle = enabled ? C.ink : C.muted; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText(item.label, 462, 101 + i * 39);
      });

      panel(ctx, 775, 46, 270, 210, '评分函数接口', current === 3, false);
      ctx.strokeStyle = current === 3 ? C.green : C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(910, 139, 51, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = current === 3 ? C.green : C.muted; ctx.font = '700 18px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(current === 3 ? '已连接' : '待连接', 910, 146); ctx.textAlign = 'left';
      ctx.fillStyle = C.muted; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText('可执行验收', 870, 219);

      ctx.strokeStyle = current >= 1 ? C.green : C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(365, 151); ctx.lineTo(405, 151); ctx.stroke();
      ctx.strokeStyle = current >= 3 ? C.green : C.line; ctx.beginPath(); ctx.moveTo(735, 151); ctx.lineTo(775, 151); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '700 20px "Segoe UI", sans-serif'; ctx.fillText(`完整度 ${25 * (current + 1)}%`, 35, 292);
      ctx.fillStyle = C.line; ctx.fillRect(190, 276, 855, 14); ctx.fillStyle = current === 3 ? C.green : C.blue; ctx.fillRect(190, 276, 855 * ((current + 1) / 4), 14);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, render, () => {}); return () => disconnect();
  }, [model.step]);

  const messages = [
    '任务说明明确目标、提示与验收条目。',
    '工作区与真实工具进入同一可复现环境。',
    '时间、外部技能与环境变量按任务配置。',
    '任务、环境与评分函数已闭合，可以复现。',
  ];
  const move = (delta: number) => setModel({ step: clamp(model.step + delta, 0, 3) as Step });
  return (
    <div onKeyDown={(event) => { if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); }}>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label={`可执行任务组装图，完整度 ${25 * (model.step + 1)}%`} />
      <div className="ctrl" role="group" aria-label="任务组装步骤">
        {labels.map((label, index) => <button key={label} type="button" className={`chip ${model.step === index ? 'active' : ''}`} aria-pressed={model.step === index} onClick={() => setModel({ step: index as Step })}>{label}</button>)}
      </div>
      <div className={`feedback ${model.step === 3 ? 'good' : ''}`}>{messages[model.step]}</div>
    </div>
  );
};

export default TaskBlueprint;
