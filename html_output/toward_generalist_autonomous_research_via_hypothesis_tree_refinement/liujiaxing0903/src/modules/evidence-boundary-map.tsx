import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type EvidenceItem = {
  id: string;
  group: 'evidence' | 'boundary';
  tone: 'direct' | 'conditional' | 'limit';
  label: string;
  claim: string;
  protocol: string;
  boundary: string;
};

const ITEMS: EvidenceItem[] = [
  { id: 'main', group: 'evidence', tone: 'direct', label: '主结果', claim: '在六项真实 AO 任务中，Arbor 取得表内最好的留出结果。', protocol: '各方法使用相同的初始材料、优化目标、评估器与资源预算；真实任务运行采用 48 小时 wall-clock 时限。', boundary: '不能据此声称 Arbor 在所有开放式科研任务上都更优。' },
  { id: 'ablation', group: 'evidence', tone: 'direct', label: '树与洞见消融', claim: 'Table 4 中，完整 Arbor 的 Any Medal 为 81.82%；去掉树为 63.64%，去掉洞见回传为 54.54%。', protocol: 'MLE-Bench Lite、Claude Opus 4.6 骨干；其余工具、预算与评估协议保持一致。', boundary: '消融支持的是这些设置下的结果质量与后期精炼作用，不等同于一般意义上的“搜索更稳定”。' },
  { id: 'backbone', group: 'evidence', tone: 'conditional', label: '骨干泛化', claim: '相同 Arbor 控制器可配合 Gemini 3 Flash、Claude Opus 4.6 与 GPT-5.5，并在所测任务上产生改进。', protocol: '替换骨干模型，同时固定控制器、评估预算和任务适配器。', boundary: '论文也明确指出性能上限取决于任务与骨干模型的匹配，不能外推到任意模型或工具链。' },
  { id: 'transfer', group: 'evidence', tone: 'direct', label: '迁移证据', claim: '在 BrowseComp 上优化出的 search harness 冻结后，直接提升两个未见过的搜索任务。', protocol: '只用 BrowseComp 开发反馈完成优化；随后冻结代码，不做任务特定优化，直接评估 HLE 与 DeepSearchQA。', boundary: '证明的是该 harness 在三个搜索任务间的迁移，不等于假设树状态或领域知识可无损跨领域复用。' },
  { id: 'scope', group: 'boundary', tone: 'limit', label: '范围局限', claim: '当前证据来自模型训练、agent harness 工程、数据合成和 MLE-Bench Lite。', protocol: '任务具有可执行制品、固定目标与自动评估器。', boundary: '论文明确称这只是自主研究的初步探测，尚未覆盖生物、数学、物理等更广科研问题。' },
  { id: 'objective', group: 'boundary', tone: 'limit', label: '目标局限', claim: '当前 AO 接口主要优化任务特定评估器定义的固定标量目标。', protocol: '任务开始前定义目标、指标方向和评估命令。', boundary: '论文指出真实科研往往是多目标的；当前系统不能自动决定“什么值得研究”。' },
  { id: 'evaluator', group: 'boundary', tone: 'limit', label: '评估局限', claim: 'Edev 提供探索反馈，Etest 用于合并准入或最终验证。', protocol: '假设与实现决策不能把 Etest 当作探索预言机。', boundary: '评估器和基准指标的偏差会限制结论的外部有效性。' },
  { id: 'idea', group: 'boundary', tone: 'limit', label: '创意生成', claim: '论文观察到，Arbor 产生的有效想法通常是局部、可执行且由既有证据约束的改进。', protocol: '后续假设建立在已验证机制、失败节点与祖先洞见之上，因此更适合逐步精炼已有问题表述。', boundary: '系统仍可能无法提出真正的新机制、过早放弃有潜力的方向，或根据分数反向试探；假设树不能自动补足第一性原理推理与高层问题重构。' },
  { id: 'cost', group: 'boundary', tone: 'limit', label: '设施与成本', claim: 'Figure 4 的已完成 AO 成本日志中，Arbor 使用 20.12M–43.19M tokens，与单轨基线处于可比量级。', protocol: 'Arbor token 总量同时计入协调器与执行器；比较使用已完成成本日志。', boundary: '这不等于系统便宜；并行评估、工作树、调度和长时运行仍有显著设施成本。' },
  { id: 'model', group: 'boundary', tone: 'limit', label: '模型依赖', claim: '在论文测试的骨干模型与任务组合中，Arbor 的协调框架带来了改进。', protocol: '骨干模型仍负责提出与实现具体假设。', boundary: '框架不能补足基础模型完全缺失的领域能力。' },
];

const GROUPS = [
  { id: 'evidence' as const, title: '实验支持', hint: '论文报告的结果与比较' },
  { id: 'boundary' as const, title: '适用边界', hint: '结论成立所受的限制' },
];

const TONE_LABELS = {
  direct: '直接实验支持',
  conditional: '有限范围支持',
  limit: '论文局限 / 边界',
};

export const EvidenceBoundaryMap: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const item = ITEMS[active];
  const activeGroup = item.group;

  const chooseGroup = (group: EvidenceItem['group']) => {
    const next = ITEMS.findIndex((entry) => entry.group === group);
    if (next >= 0) setActive(next);
  };

  return (
    <div className={`evidence-boundary-lab tone-${item.tone}`}>
      <div className="evidence-boundary-toolbar">
        <p className="evidence-boundary-note">这是“结论适用范围”示意，不是 Arbor 的执行流程。</p>
        <div className="evidence-boundary-mode" role="tablist" aria-label="证据类型">
          {GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={activeGroup === group.id}
              className={activeGroup === group.id ? 'is-active' : ''}
              onClick={() => chooseGroup(group.id)}
            >
              <strong>{group.title}</strong>
              <span>{group.hint}</span>
            </button>
          ))}
        </div>

        <div className="evidence-boundary-options" role="tablist" aria-label="选择具体结论">
          {ITEMS.map((entry, index) => entry.group === activeGroup ? (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active === index}
              className={active === index ? 'is-active' : ''}
              onClick={() => setActive(index)}
            >
              {entry.label}
            </button>
          ) : null)}
        </div>
      </div>

      <div className="evidence-route" role="tabpanel" aria-live="polite" key={item.id}>
        <header className="evidence-route-head">
          <span>{TONE_LABELS[item.tone]}</span>
          <h3>{item.label}</h3>
        </header>

        <div className="evidence-route-scene">
          <div className="evidence-route-track" aria-hidden="true" />
          <div className="evidence-route-marker" aria-hidden="true"><span>证据</span></div>

          <section className="evidence-route-claim">
            <strong>{item.group === 'evidence' ? '论文支持的结论' : '论文局限与直接推论'}</strong>
            <p>{item.claim}</p>
          </section>

          <section className="evidence-route-gate">
            <strong>成立协议</strong>
            <p>{item.protocol}</p>
          </section>

          <div className="evidence-route-boundary" aria-label="外推边界">
            <span>外推边界</span>
          </div>

          <section className="evidence-route-overreach">
            <strong>不能推出</strong>
            <p>{item.boundary}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EvidenceBoundaryMap;
