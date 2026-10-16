import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Frame, Chip, Feedback } from './pvKit';
import { RetrievalDiagram, RLDiagram } from './flow-diagrams';

type Mode = 'inference' | 'sft' | 'rl';
type Step = { title: string; action: string; output: string; feedback: string; update: string };
const retrieval: Step[] = [
  { title: '读取当前条件', action: '把已有 Core 与文本化人格 P 放入结构化 prompt，结合当前图文 Q、时间戳与近期上下文。', output: '示意问题：比较这张物品图片与上次讨论的对象。此处只用文字占位描述图片，没有运行视觉模型。', feedback: '人格数值更新后转为文本描述；Fig.16 的结构化输入包含用户资料、五维人格分数、近期对话与当前输入。当前图片仍直接参与 MLLM 理解。', update: '尚未更新用户资料。' },
  { title: '提出查找条件', action: '模型生成关键词与时间范围，作为 retrieve 条件。', output: '示意条件：前次相关会话的时间范围 + 对象主题关键词。模型不在这里选择某一种 memory 类型。', feedback: '原文 retrieve 模板包含 keywords、start_time、end_time；下方流程使用手工编排条件，不是模型真实 think 输出。', update: '正在读取已有资料，尚未写入新状态。' },
  { title: '取回有关证据', action: '系统先按时间范围过滤，再并行检索 Procedural、Semantic、Episodic，汇总结果回填上下文。', output: '时间过滤 → { Procedural top-2 ∥ Semantic top-4 ∥ Episodic top-2 } → 证据回填。Episodic 通过话题摘要与轮次索引取回相关原始图文。', feedback: '这是本文默认文本检索流程。含图输入另自动触发 Grounding DINO crop + CLIP 视觉概念匹配；不据此虚构新的融合层。', update: '检索结果成为下一步推理可用的证据。' },
  { title: '再次判断并回答', action: '判断证据是否足够；不足时可继续检索，足够时结合当前图文、已有资料与 P 生成回答。', output: '示意回答依据：当前图片 + 相关历史图文 + 最新资料；P 提供回应方式的条件。这里不生成或展示真实模型答案。', feedback: '多轮检索是按需判断的过程；训练中的最多三次检索设定，不自动等于所有部署的硬上限。', update: 'Response 完成本轮回答。' },
  { title: '回答后更新', action: '进入 Update，根据本轮交互推断并保存后续要用的用户状态。', output: '按各类规则更新 P / memory，并保留原始图文历史。更新供后续轮次使用。', feedback: 'Response 使用已有状态；本轮结束后的 Update 不能被画成先用未来信息帮助本轮作答。', update: '用户资料发生变化；这不是重新训练模型权重。' },
];
const direct: Step[] = [retrieval[0],
  { title: '证据足够，直接回答', action: '当前输入、近期上下文、Core 与 P 已足以作答时，可以直接生成回答。', output: '示意路径：当前条件 → 生成回答。没有强制进入外部检索分支。', feedback: 'PersonaVLM 并非每问必检索。直接回答同样可以使用已经提供的个性化条件。', update: 'Response 完成；没有新增检索结果。' }, retrieval[4]];
const sft: Step[] = [
  { title: '读取训练输入', action: '从合成 personas、图文对话及中间监督中组织训练条目。', output: '示意训练输入：当前交互与相应上下文 / 已有状态。任务可包括人格推断、资料管理和结构化检索 / 回答。', feedback: '500 个训练 personas 与 200 个测试 personas 分开；约 78k SFT 样本不是 78k 个真实用户。', update: '模型能力训练阶段。' },
  { title: '查看监督目标', action: '用预先提供的监督目标学习结构化操作。训练 QA 目标依赖当前问题和取回证据重建。', output: '训练专用目标：应输出的结构化操作或参考回答。此处仅解释监督的角色，不编造一条论文原始训练样本。', feedback: '监督目标在训练时提供。切换到推理后，这些参考答案会消失。', update: '通过 SFT 学习相关任务；原文未披露完整 loss / mask 细节。' },
  { title: '区分两种更新', action: 'SFT 训练模型执行操作的能力；日常 Update 则修改某个用户的资料。', output: '未披露：参数冻结范围、具体微调方式及 SFT loss / mask 全细节。', feedback: '不能把用户资料更新当成权重微调，也不能把未披露的参数配置补成 LoRA 或全量训练。', update: '哪些参数训练 / 冻结：原文未说明。' },
];
const rl: Step[] = [
  { title: '同题，多条轨迹', action: 'Policy 根据问题 Q 及其上下文生成一组轨迹，先输出 think，再输出 retrieve 条件或 answer；检索反馈供后续步骤使用。', output: '生成：Q / 上下文 → policy → 候选轨迹。评估：参考答案 R̂ → 准确性奖励评估 ← 轨迹回答 Rτ。约 5.6k RL 训练样本。', feedback: '参考答案用于奖励评估，不作为 policy 生成轨迹时直接看到的答案输入。该角色区分同样适用于 RL 训练阶段。', update: '模型能力训练阶段。' },
  { title: '理解奖励组成', action: 'Qwen3-30B-A3B 零样本评估准确性与推理/回答的一致性；另计格式遵守项。', output: 'accuracy 比较参考答案 R̂ 与轨迹回答 Rτ；consistency 评估推理与最终答案。原文公式：reward = accuracy × consistency + 0.5 × format。', feedback: '参考答案进入 accuracy 的评估支路，奖励再用于优化 policy；不编造 judge 分值刻度或实测轨迹分数。', update: '训练反馈用于评估候选轨迹。' },
  { title: '组内比较与约束', action: '通过组内 advantage 与 KL 约束优化多轮轨迹。', output: '目标是学会更合适的结构化检索 / 回答行为；这里不运行训练，也没有 loss 曲线。', feedback: 'SFT / RL 是能力训练分工；Response / Update 是使用时的运行分工，二者不属于同一组阶段。', update: '参数冻结范围、具体微调方式：原文未说明。' },
];

export function TrainingInference({ chapterId }: WidgetProps) {
  const [mode, setMode] = useState<Mode>(Number(chapterId.replace(/\D/g, '')) === 6 ? 'sft' : 'inference');
  const [step, setStep] = useState(0);
  const [useRetrieval, setUseRetrieval] = useState(true);
  const steps = mode === 'inference' ? (useRetrieval ? retrieval : direct) : mode === 'sft' ? sft : rl;
  const current = steps[step] || steps[0];
  const chooseMode = (next: Mode) => { setMode(next); setStep(0); };
  const phase = useRetrieval ? (['input', 'conditions', 'retrieval', 'answer', 'update'] as const)[step] : (['input', 'answer', 'update'] as const)[step];
  return <Frame evidence="M4–M6 §3；S2–S4 Algorithm 1、Fig.7、Table 3、Eq.(4)" id="process">
    <p className="pv-muted">预设轨迹用于解释流程；下图不运行真实模型，也不是论文逐例输出。</p>
    <div className="pv-controls" aria-label="训练或推理模式">
      <Chip active={mode === 'inference'} onClick={() => chooseMode('inference')}>推理 Inference</Chip>
      <Chip active={mode === 'sft'} onClick={() => chooseMode('sft')}>训练 SFT</Chip>
      <Chip active={mode === 'rl'} onClick={() => chooseMode('rl')}>训练 RL / GRPO</Chip>
    </div>
    {mode === 'inference' && <div className="pv-controls" aria-label="推理分支">
      <Chip active={useRetrieval} onClick={() => { setUseRetrieval(true); setStep(0); }}>需要查找过去</Chip>
      <Chip active={!useRetrieval} onClick={() => { setUseRetrieval(false); setStep(0); }}>已有证据足够</Chip>
    </div>}
    <div className="pv-steps" aria-label="当前轨迹">
      {steps.map((s, index) => <span className={`pv-step ${index === step ? 'active' : ''}`} key={s.title} aria-current={index === step ? 'step' : undefined}>{index + 1}. {s.title}</span>)}
    </div>
    <h5>当前动作 · {current.title}</h5><p>{current.action}</p>
    <div className="pv-controls" aria-label="轨迹步进">
      <button type="button" className="chip" disabled={step === 0} onClick={() => setStep(x => Math.max(0, x - 1))}>上一步</button>
      <span>{step + 1} / {steps.length}</span>
      <button type="button" className="chip" disabled={step === steps.length - 1} onClick={() => setStep(x => Math.min(steps.length - 1, x + 1))}>下一步</button>
      <button type="button" className="chip" onClick={() => setStep(0)}>重置轨迹</button>
    </div>
    <Feedback>{current.feedback}</Feedback>
    {mode === 'inference' && <><RetrievalDiagram phase={phase || 'input'} bypass={!useRetrieval} /><p className="pv-flow-caption">当前图文、近期上下文与已有 Core / P 进入回答；回答后更新供后续交互使用。图中高亮表示正在讲解的步骤。</p></>}
    {mode === 'rl' && <RLDiagram step={step} />}
    <details className="pv-record-details" open={mode === 'sft'}><summary>查看当前输入、依据与更新对象</summary><div className="pv-split">
      <div className="pv-detail" data-role="policy-input"><strong>{mode === 'rl' ? 'Policy 生成时可见输入' : '可见输入'}</strong><p>{mode === 'inference' ? '当前文本 / 可选图片 / 时间戳 + 近期上下文 + 已有 Core / P 的结构化 prompt；按需加入取回证据。' : mode === 'sft' ? '训练条目的输入条件；监督目标作为要学习的输出。' : '问题 Q、对应上下文与逐步取回的证据。'}</p></div>
      <div><h5>{mode === 'inference' ? '运行轨迹与证据' : mode === 'rl' ? '生成结果 / 奖励评估' : '训练目标与反馈'}</h5><div className="pv-evidence active"><span className="pv-dot" /><p>{current.output}</p></div><p><strong>更新对象：</strong>{current.update}</p></div>
    </div></details>
  </Frame>;
}
