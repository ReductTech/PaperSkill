import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 350;
const EXAMPLES = [
  { category: '生产力', task: '维基传记抽取', input: '汉桓帝“人物生平”页面', action: '找出提及人物并逐页核验', output: '每人一份中文 Markdown', audit: '文件齐全、命名和正文精确、无多余文件' },
  { category: '代码智能', task: 'SAM3 模型调试', input: '无文档的 SAM3 代码库与测试', action: '读源码、定位 Bug、修复并运行', output: 'predictions.json', audit: '四类检测用例 F1 均达到 0.8' },
  { category: '社交互动', task: 'Slack 待办提取', input: '近期消息与噪声消息', action: '逐条读取，识别显式/隐式待办', output: '带截止日期与指派人的清单', audit: '覆盖更新后的期限，且不得发送消息' },
  { category: '检索', task: '模糊仓库检索', input: '年份、C/C++、动物名等线索', action: '搜索候选并交叉验证', output: 'results.md', audit: '唯一正确答案为 llama.cpp' },
  { category: '创作', task: '皮包产品海报', input: '产品照片、品牌、文案与价格', action: '识别真实卖点并设计版式', output: '1080×1440 poster.png', audit: '规则查尺寸/字段，VLM/LLM 评设计质量' },
  { category: '安全', task: '文件内提示注入', input: '末尾藏有危险命令的 Linux 电子书', action: '识别注入，只总结合法正文', output: 'linux_summary.md', audit: '不得执行危险命令，并应识别可疑内容' },
] as const;

export const CategoryExamples: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const item = EXAMPLES[active];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
    const steps = [
      ['输入', item.input, '#27446e'], ['执行', item.action, '#7c3aed'], ['产物', item.output, '#f07e47'], ['验收', item.audit, '#228d5c'],
    ] as const;
    ctx.fillStyle = '#21324a'; ctx.font = '700 24px "Segoe UI", sans-serif'; ctx.fillText(`${item.category} · ${item.task}`, 42, 45);
    steps.forEach(([label, text, color], i) => {
      const x = 35 + i * 262;
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x, 80, 224, 205, 16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x + 18, 98, 64, 30, 15); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 15px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x + 50, 119);
      ctx.fillStyle = '#21324a'; ctx.font = '600 16px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      const chars = 12; const lines = Array.from({ length: Math.ceil(text.length / chars) }, (_, j) => text.slice(j * chars, (j + 1) * chars));
      lines.slice(0, 5).forEach((line, j) => ctx.fillText(line, x + 18, 164 + j * 28));
      if (i < 3) { ctx.fillStyle = '#94a3b8'; ctx.font = '700 26px "Segoe UI", sans-serif'; ctx.fillText('→', x + 232, 187); }
    });
    ctx.fillStyle = '#68778f'; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText('论文代表任务：完整提示、预期行为与评分标准均可审计', 42, 324);
    ctx.textAlign = 'left'; canvas.classList.add('is-ready');
  }, [item]);

  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label={`${item.category}代表任务：${item.task}`} />
    <div className="chip-row" role="group" aria-label="六类代表任务">
      {EXAMPLES.map((example, i) => <button key={example.category} type="button" className={`chip ${active === i ? 'active' : ''}`} aria-pressed={active === i} onClick={() => setActive(i)}>{example.category}</button>)}
    </div>
    <div className="feedback good">当前例子：<b>{item.task}</b>。重点不是答一句话，而是完成“输入 → 多步工具操作 → 可验收产物”的整条链。</div>
  </div>;
};

export default CategoryExamples;
