import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 350;
const CASES = [
  { name: '叙事报告', exact: '检查文件与必填章节', semantic: '事实覆盖、结构与表达质量' },
  { name: '产品海报', exact: '检查 PNG、尺寸与文字字段', semantic: '版式、层级、真实卖点与完成度' },
  { name: '视频片段', exact: '检查文件、时长与编码', semantic: '片段是否对应事件、视听质量' },
] as const;

export const JudgeRubric: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const item = CASES[active];
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
    const cards = [
      { x: 46, title: '① 确定性门槛', body: item.exact, color: '#27446e' },
      { x: 382, title: '② LLM/VLM 语义评审', body: item.semantic, color: '#7c3aed' },
      { x: 718, title: '③ 附录可靠性核对', body: '5 个任务 × 2 位盲评专家；与 GPT-5.4 使用同一 rubric', color: '#228d5c' },
    ];
    cards.forEach((card, i) => {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = card.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(card.x, 62, 286, 210, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = card.color; ctx.font = '700 18px "Segoe UI", sans-serif'; ctx.fillText(card.title, card.x + 20, 101);
      ctx.fillStyle = '#21324a'; ctx.font = '600 16px "Segoe UI", sans-serif';
      const lines = Array.from({ length: Math.ceil(card.body.length / 16) }, (_, j) => card.body.slice(j * 16, (j + 1) * 16));
      lines.slice(0, 5).forEach((line, j) => ctx.fillText(line, card.x + 20, 145 + j * 28));
      if (i < 2) { ctx.fillStyle = '#94a3b8'; ctx.font = '700 27px "Segoe UI", sans-serif'; ctx.fillText('→', card.x + 296, 172); }
    });
    ctx.fillStyle = '#68778f'; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText('附录报告：抽样案例中 GPT 评审与人工平均得分的偏差通常小于 3；这不是“绝对可靠”证明。', 46, 315);
    canvas.classList.add('is-ready');
  }, [item]);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label={`${item.name}的开放输出评分流程`} />
    <div className="chip-row" role="group" aria-label="选择开放输出案例">
      {CASES.map((entry, i) => <button key={entry.name} type="button" className={`chip ${active === i ? 'active' : ''}`} aria-pressed={active === i} onClick={() => setActive(i)}>{entry.name}</button>)}
    </div>
    <div className="feedback good">LLM/VLM 只处理精确匹配难以判断的语义属性，并依据参考答案或 rubric 给分和理由；确定性属性仍由规则或环境审计把关。</div>
  </div>;
};

export default JudgeRubric;
