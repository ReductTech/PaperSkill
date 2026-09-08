import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { MiniFile, StateBadge, TRACE_ITEMS, TraceToken } from './colleague-ui';

const steps = ['选定 Trace', '抽取 Evidence', '形成 Rule', '渲染 Markdown', '写入 Skill'];
const evidence = [
  ['Review #7', '敏感字段不能出现在响应中'],
  ['Incident #3', '回滚前检查数据一致性'],
  ['Review #12', '拒绝前先解释风险'],
];

export const CreationLab: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [backtrack, setBacktrack] = useState(false);
  const next = () => { setStep(Math.min(steps.length - 1, step + 1)); setBacktrack(false); };
  const prev = () => { setStep(Math.max(0, step - 1)); setBacktrack(false); };
  return <div className="paper-widget creation-lab">
    <div className="creation-stepper" role="group" aria-label="创建步骤">
      {steps.map((label, index) => <button key={label} className={`${index === step ? 'active' : ''}${index < step ? 'complete' : ''}`} onClick={() => { setStep(index); setBacktrack(false); }}><span>{index + 1}</span><b>{label}</b></button>)}
    </div>
    <div className="creation-workbench">
      <aside className="creation-sources"><b>同一批 Trace Token</b>{TRACE_ITEMS.slice(0, 5).map((trace, index) => <TraceToken key={trace.id} trace={trace} active={step === 0 || (backtrack && [2, 3, 4].includes(index))} muted={step > 0 && !backtrack} />)}</aside>
      <section className="creation-result">
        {step === 0 && <div className="stage-content"><StateBadge tone="current">Trace</StateBadge><h4>选择范围内材料</h4><p>材料保留渠道与编号，后续规则才能反向追踪。</p></div>}
        {step === 1 && <div className="stage-content"><StateBadge tone="current">Evidence</StateBadge><h4>Analyzer 高亮可操作证据</h4>{evidence.map(row => <p className="evidence-line" key={row[0]}><b>{row[0]}</b><mark>{row[1]}</mark></p>)}</div>}
        {step === 2 && <div className="stage-content rule-candidates"><StateBadge tone="current">Rule</StateBadge><div><b>能力候选</b><p>API Review Heuristic</p><ol><li>检查认证与敏感字段。</li><li>验证回滚条件。</li><li>立即升级 P0。</li></ol></div><div><b>行为候选</b><p>拒绝提案时，先解释风险并给出替代方案。</p></div></div>}
        {step === 3 && <div className="stage-content"><StateBadge tone="current">Markdown</StateBadge><h4>Builder 渲染可编辑文件</h4><div className="mini-file-row"><MiniFile name="work.md" active tone="green" /><MiniFile name="persona.md" active tone="purple" /></div><button className={`why-button ${backtrack ? 'active' : ''}`} onClick={() => setBacktrack(!backtrack)}>为什么形成这条规则？</button></div>}
        {step === 4 && <div className="stage-content"><StateBadge tone="good">Skill Package</StateBadge><h4>Writer 写入工件契约</h4><div className="mini-file-row"><MiniFile name="SKILL.md" active tone="green" /><MiniFile name="manifest.json" active tone="orange" /><MiniFile name="meta.json · v1" active tone="blue" /></div><button className={`why-button ${backtrack ? 'active' : ''}`} onClick={() => setBacktrack(!backtrack)}>回溯规则证据</button></div>}
      </section>
    </div>
    {backtrack && <div className="backtrack-band"><StateBadge tone="good">Rule → Source Evidence</StateBadge><b>这条规则由 Review #7、Review #12 与 Incident #3 支撑。</b><span>证据关系在打包后仍可检查。</span></div>}
    <div className="ctrl"><button className="chip" onClick={prev} disabled={step === 0}>上一步</button><span>{step + 1} / {steps.length}</span><button onClick={next} disabled={step === steps.length - 1}>下一步</button></div>
    <div className={`feedback ${step === steps.length - 1 ? 'good' : ''}`}>{step === 0 ? '创建从有边界的痕迹开始，不从通用 persona 模板开始。' : step === 1 ? '证据是原文中可核查的片段，不是模型补写的动机。' : step === 2 ? '能力与行为在写入前就分轨，避免把判断和语气混在一起。' : step === 3 ? '可编辑 Markdown 让人工检查与修订有明确位置。' : '打包完成，但规则仍能回到来源；这才是可检查的蒸馏。'}</div>
  </div>;
};

export default CreationLab;
