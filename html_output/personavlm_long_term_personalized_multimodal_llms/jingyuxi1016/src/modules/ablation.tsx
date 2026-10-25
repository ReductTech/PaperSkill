import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Frame, Chip, Feedback, Bars, C } from './pvKit';

const variants = [
  { id: 'full', label: '完整模型', values: [71.48, 71.05], role: '所有列出的组件均启用。' },
  { id: 'core', label: 'w/o Core', values: [69.80, 70.39], role: 'Core 提供每轮可用的核心用户资料；此项移除该组件。' },
  { id: 'procedural', label: 'w/o Procedural', values: [70.33, 69.39], role: 'Procedural 保存用户目标和习惯等资料；此项移除该组件。' },
  { id: 'semantic', label: 'w/o Semantic', values: [69.71, 69.94], role: 'Semantic 保存抽取的语义事实；此项移除该组件。' },
  { id: 'episodic', label: 'w/o Episodic', values: [59.07, 65.86], role: 'Episodic 以话题摘要和轮次索引组织对原始图文历史的访问；此项移除该组件。' },
  { id: 'reasoning', label: 'w/o Reasoning', values: [68.73, 67.32], role: '此处 w/o Reasoning 指关闭多轮检索，不能扩大解释成删掉所有推理能力。' },
];

export function AblationExplorer({ moduleId }: WidgetProps) {
  const [context, setContext] = useState<0 | 1>(1);
  const [selected, setSelected] = useState('full');
  const [pemRemoved, setPemRemoved] = useState(false);
  if (moduleId === '8.2') {
    const value = pemRemoved ? 45.6 : 49.6;
    return <Frame kind="paper" evidence="S9 Table 9 · P-SOUPS overall" id="ablation-pem">
      <p>独立协议：P-SOUPS overall accuracy (%)，越高越好。这里没有 32k / 128k 条件。</p>
      <div className="pv-controls" aria-label="PEM 消融设置"><Chip active={!pemRemoved} onClick={() => setPemRemoved(false)}>完整 PersonaVLM</Chip><Chip active={pemRemoved} onClick={() => setPemRemoved(true)}>w/o PEM</Chip></div>
      <div className={`pv-evidence ${pemRemoved ? 'inactive' : 'active'}`}><span className="pv-dot" /><div><strong>结构教学示意：PEM {pemRemoved ? '停用' : '启用'}</strong><p>本轮模型推断 → {pemRemoved ? '不采用 PEM 演化机制' : '平滑更新长期 Big Five profile'} → 回应方式的条件。</p></div></div>
      <Bars rows={[{ label: '完整 PersonaVLM', value: 49.6, color: C.muted }, { label: pemRemoved ? '所选：w/o PEM' : '所选：完整模型', value, color: pemRemoved ? C.red : C.blue }]} />
      <Feedback>{pemRemoved ? 'w/o PEM 从 49.6% 降到 45.6%，下降 4.0 pp（据表计算）。这支持 PEM 在该对齐设置中的收益，不证明模型准确测量了真实人格。' : '完整模型为 49.6%；切换 w/o PEM 查看受控消融。该分数不与 Table 8 的 Persona-MME overall 合并比较。'}</Feedback>
    </Frame>;
  }
  const current = variants.find(v => v.id === selected)!;
  const full = variants[0].values[context];
  const value = current.values[context];
  const drop = full - value;
  return <Frame kind="paper" evidence="S9 Table 8 · Persona-MME 六方面 overall" id="ablation">
    <p>一次只移除一个论文报告的组件；图中停用状态是结构教学示意，数值来自论文实测。</p>
    <div className="pv-controls" aria-label="消融历史配置"><span>Context：</span><Chip active={context === 0} onClick={() => setContext(0)}>32k</Chip><Chip active={context === 1} onClick={() => setContext(1)}>128k</Chip></div>
    <div className="pv-controls" aria-label="每次选择一个消融项">{variants.map(v => <Chip key={v.id} active={selected === v.id} onClick={() => setSelected(v.id)}>{v.label}</Chip>)}</div>
    <div className="pv-plot"><h5>结构教学示意 · 当前功能路径</h5><div className="pv-steps">{variants.slice(1).map(v => <span key={v.id} className={`pv-step ${selected === v.id ? 'active' : ''}`} style={{ borderColor: selected === v.id ? C.red : undefined, color: selected === v.id ? C.red : undefined }}>{v.label.replace('w/o ', '')} · {selected === v.id ? '停用' : '启用'}</span>)}</div><p>{current.role}</p></div>
    <p>Persona-MME 六方面 overall accuracy (%)；{context === 0 ? '32k' : '128k'}；越高越好。</p>
    <Bars rows={[{ label: '完整 PersonaVLM', value: full, color: C.muted }, { label: `所选：${current.label}`, value, color: selected === 'full' ? C.blue : C.red }]} />
    <Feedback tone={selected === 'full' ? 'info' : 'bad'}>{selected === 'full' ? `完整模型为 ${full.toFixed(2)}%。选择一项已报告的单组件消融，可查看对应分数及变化。` : `${current.label} 后，从 ${full.toFixed(2)}% 降到 ${value.toFixed(2)}%，下降 ${drop.toFixed(2)} pp（据表计算）。${selected === 'episodic' ? '在列出的 memory 消融中，Episodic 的整体降幅最大；不能据此推断所有子任务都同样依赖它。' : '这支持该组件在此设置中的收益；不等于对全部能力的精确因果分解。'}`}</Feedback>
    <p className="pv-muted">各下降值不能直接相加：论文未在此提供多组件联合移除的分数。PEM 另在 Table 9 的 P-SOUPS 协议中评估。</p>
  </Frame>;
}
