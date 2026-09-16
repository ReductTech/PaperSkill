import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 330;
const FACTORS = [
  { name: '模型', hint: '基础推理、规划与多模态能力', color: '#27446e' },
  { name: '执行框架', hint: '工具接口、系统提示与上下文管理', color: '#7c3aed' },
  { name: '外部技能', hint: '可复用流程可能帮忙，也可能引入干扰', color: '#228d5c' },
  { name: '时间预算', hint: '过短会截断轨迹；加倍并非等比例增益', color: '#f07e47' },
  { name: '推理强度', hint: '更深思考可能改善计划，也可能触发超时', color: '#92400e' },
] as const;

export const ScoreFactorMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
    const centerX = 540; const centerY = 165;
    FACTORS.forEach((factor, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / FACTORS.length;
      const x = centerX + Math.cos(angle) * 330;
      const y = centerY + Math.sin(angle) * 112;
      ctx.strokeStyle = i === active ? factor.color : '#cbd5e1';
      ctx.lineWidth = i === active ? 5 : 2;
      ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = i === active ? '#edf8f2' : '#ffffff';
      ctx.strokeStyle = i === active ? factor.color : '#d7deea';
      ctx.lineWidth = i === active ? 3 : 1;
      ctx.beginPath(); ctx.roundRect(x - 80, y - 29, 160, 58, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = i === active ? factor.color : '#21324a';
      ctx.font = '700 17px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(factor.name, x, y + 6);
    });
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#228d5c'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(centerX, centerY, 68, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#21324a'; ctx.font = '700 22px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Benchmark', centerX, centerY - 5); ctx.fillText('得分', centerX, centerY + 24);
    ctx.textAlign = 'left'; canvas.classList.add('is-ready');
  }, [active]);

  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label={`影响基准得分的因素，当前选择${FACTORS[active].name}`} />
    <div className="chip-row" role="group" aria-label="选择影响因素">
      {FACTORS.map((factor, i) => <button key={factor.name} type="button" className={`chip ${active === i ? 'active' : ''}`} aria-pressed={active === i} onClick={() => setActive(i)}>{factor.name}</button>)}
    </div>
    <div className="feedback good"><b>{FACTORS[active].name}：</b>{FACTORS[active].hint}。这些是实验条件，不是论文给出的固定加权项。</div>
  </div>;
};

export default ScoreFactorMap;
