import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 350;
type Entry = { name: string; tag: string; detail: string; color: string };

const PANELS: Record<string, { title: string; entries: Entry[]; note: string }> = {
  '11.1': {
    title: '同期与相关评测：各自覆盖哪些坐标？',
    entries: [
      { name: 'SWE-/Terminal-Bench', tag: '可执行检查', detail: '复现性强，但主要是文本与单一交互面。', color: '#27446e' },
      { name: 'WebArena / OSWorld', tag: '网页与操作系统', detail: '强调状态或 GUI，但原生运行、双语等覆盖不完整。', color: '#7c3aed' },
      { name: 'Claw-Eval', tag: '同期工作', detail: '双语与混合验证；依赖脚本化模拟服务，原生运行支持有限。', color: '#f07e47' },
      { name: 'ClawBench', tag: '同期工作', detail: '原生环境与混合验证；跨模态和可复现性覆盖有限。', color: '#92400e' },
      { name: 'WildClawBench', tag: '本文', detail: '把跨模态、轨迹审计、原生运行、双语、容器复现与混合验证组合起来。', color: '#228d5c' },
    ],
    note: '论文的谨慎表述是“组合这些性质”，并非声称每项性质都由本文首创。',
  },
  '11.2': {
    title: '发表后的可观察进展：同一标尺上的新结果',
    entries: [
      { name: '论文时点', tag: '19 个模型', detail: 'OpenClaw 百分制最高为 Claude Opus 4.7：62.2。', color: '#68778f' },
      { name: '项目页更新', tag: '34 个模型', detail: '截至 2026-07-20，GPT-5.6 Sol 达到 67.2。', color: '#228d5c' },
      { name: '官方模型报告', tag: '外部采用', detail: 'Hunyuan3 Preview、Seed2.1 等开始报告 WildClawBench 成绩。', color: '#27446e' },
      { name: '个人配置榜', tag: '技能/记忆/人格', detail: '项目新增 Personal OpenClaw 评测，比较同模型下的配置差异。', color: '#7c3aed' },
    ],
    note: '这说明标尺被持续使用且新系统分数上升；不能仅凭排行榜证明提升由该论文直接导致。',
  },
  '11.3': {
    title: '后续工作如何使用这套基准？',
    entries: [
      { name: 'SkillSmith', tag: '技能—工具共演化', detail: '在含 WildClawBench 的三套基准上检验技能与工具共同改进。', color: '#7c3aed' },
      { name: 'AgentDecarbonizer', tag: '低碳调度', detail: '用 60 个长时程任务研究时限、缓存复用与电网碳强度。', color: '#228d5c' },
      { name: 'Harbor 版本', tag: '可移植封装', detail: '把 60 个任务重打包到 Harbor 格式，扩展运行生态。', color: '#27446e' },
      { name: '轨迹数据集', tag: '行为分析', detail: '公开更多完整执行轨迹，支持失败诊断与系统比较。', color: '#f07e47' },
    ],
    note: '后续价值不只在刷新排行榜，也在技能演化、系统效率和轨迹研究。',
  },
};

export const ResearchLandscape: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const panel = PANELS[moduleId] ?? PANELS['11.1'];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const item = panel.entries[active];
  useEffect(() => { setActive(0); }, [moduleId]);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#21324a'; ctx.font = '700 23px "Segoe UI", sans-serif'; ctx.fillText(panel.title, 42, 44);
    panel.entries.forEach((entry, i) => {
      const count = panel.entries.length;
      const w = count === 5 ? 184 : 226;
      const gap = count === 5 ? 20 : 30;
      const x = 42 + i * (w + gap);
      ctx.fillStyle = i === active ? '#edf8f2' : '#fff'; ctx.strokeStyle = i === active ? entry.color : '#d7deea'; ctx.lineWidth = i === active ? 3 : 1;
      ctx.beginPath(); ctx.roundRect(x, 75, w, 126, 16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = entry.color; ctx.font = '700 16px "Segoe UI", sans-serif'; ctx.fillText(entry.name, x + 14, 109);
      ctx.fillStyle = '#68778f'; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText(entry.tag, x + 14, 143);
      ctx.fillStyle = i === active ? '#228d5c' : '#cbd5e1'; ctx.beginPath(); ctx.arc(x + w - 20, 101, 7, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#fff'; ctx.strokeStyle = item.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(42, 226, 996, 80, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#21324a'; ctx.font = '600 17px "Segoe UI", sans-serif'; ctx.fillText(item.detail, 64, 260);
    ctx.fillStyle = '#68778f'; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText(panel.note, 64, 287);
    canvas.classList.add('is-ready');
  }, [active, item, panel]);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label={`${panel.title}，当前选择${item.name}`} />
    <div className="chip-row" role="group" aria-label={panel.title}>
      {panel.entries.map((entry, i) => <button key={entry.name} type="button" className={`chip ${active === i ? 'active' : ''}`} aria-pressed={active === i} onClick={() => setActive(i)}>{entry.name}</button>)}
    </div>
    <div className="feedback good">{panel.note}</div>
    {moduleId === '11.2' ? <div className="source-links">来源：<a href="https://internlm.github.io/WildClawBench/" target="_blank" rel="noreferrer">官方动态排行榜</a> · <a href="https://github.com/InternLM/WildClawBench" target="_blank" rel="noreferrer">官方仓库</a></div> : null}
    {moduleId === '11.3' ? <div className="source-links">论文：<a href="https://arxiv.org/abs/2606.01314" target="_blank" rel="noreferrer">SkillSmith</a> · <a href="https://arxiv.org/abs/2608.20566" target="_blank" rel="noreferrer">AgentDecarbonizer</a></div> : null}
  </div>;
};

export default ResearchLandscape;
