import React, { useState } from 'react';
import {
  Feedback,
  PALETTE,
  PaperCanvas,
  type PaperWidgetProps,
  clearDesk,
  drawSceneLabel,
  drawTargetMark,
  drawWrappedLabel,
  roundedRect,
} from './cascade-vs-unified';

type Verdict = 'fit' | 'conditional' | 'unsupported';
type ScenarioId = 'long' | 'short' | 'longtail' | 'zeroCost' | 'faithful' | 'universal';

const verdicts: Record<Verdict, { label: string; color: string }> = {
  fit: { label: '适合采用', color: PALETTE.green },
  conditional: { label: '有条件采用', color: PALETTE.orange },
  unsupported: { label: '论文未证明', color: PALETTE.red },
};

const scenarios: Record<ScenarioId, {
  label: string;
  demand: string;
  answer: Verdict;
  condition: string;
  boundary: string;
  evidence: string;
}> = {
  long: {
    label: '长表格与公式',
    demand: '约 1B 端到端模型必须完整生成密集表格、公式或 Markdown，并允许部署草拟模型。',
    answer: 'fit',
    condition: 'DFlash 正面解决长结构输出的串行解码等待，目标模型仍负责验证。',
    boundary: '具体倍率仍取决于推理后端、输出长度和并发条件。',
    evidence: '§3 · Table 2、4、5、6',
  },
  short: {
    label: '很短的文字输出',
    demand: '任务主要输出几个短词或短句，希望也获得与长表格相同的加速比例。',
    answer: 'conditional',
    condition: '可以使用同一模型，但 DFlash 的净收益取决于候选接受长度能否覆盖额外开销。',
    boundary: '论文结果显示收益随输出类型和长度变化，不能承诺与长结构输出相同。',
    evidence: 'Table 4、5',
  },
  longtail: {
    label: '低资源与古文字',
    demand: '要补低资源语言、古文字或多页问答能力，并能获得针对性材料和质量检查。',
    answer: 'conditional',
    condition: 'Agentic Data Flow 适合把明确弱点转成材料、工具验证和可复用数据管线。',
    boundary: '效果依赖材料覆盖、工具可靠性、样本清洗和工程师复核，不是自动堆数据。',
    evidence: '§4.1–4.2 · Figure 3',
  },
  zeroCost: {
    label: '不增加部署组件',
    demand: '希望完全不训练、不部署额外组件，只替换一个开关就固定获得 6.37×。',
    answer: 'unsupported',
    condition: 'DFlash 需要单独训练并部署约 90.7M 参数的草拟模型。',
    boundary: '6.37×属于 Transformers 的特定评测协议，不是零成本的通用开关。',
    evidence: '§3.1–3.2 · Table 2',
  },
  faithful: {
    label: '必须绝对忠实',
    demand: '高风险场景要求面对无意义错词时几乎绝不擅自纠正，并希望论文结果已经证明可靠。',
    answer: 'unsupported',
    condition: 'CHAOS-Bench 可以测量视觉证据与语言先验的冲突，但不是可靠性保证。',
    boundary: 'HunyuanOCR-1.5 的 14.15 相对领先，绝对召回仍低，论文明确认为问题尚未解决。',
    evidence: '§6.1.9 · Table 11',
  },
  universal: {
    label: '所有协议固定倍率',
    demand: '把 Transformers 的 6.37×直接推广到任意硬件、任意后端、任意输出长度和并发 32。',
    answer: 'unsupported',
    condition: '不同后端、长度分组和并发结果必须在各自实验协议内解释。',
    boundary: '论文没有报告所有条件的笛卡尔组合，不能把不同分表拼成一个普遍结论。',
    evidence: 'Table 2、4、6',
  },
};

export const DeploymentBoundaryLab: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('long');
  const [choice, setChoice] = useState<Verdict | null>(null);
  const scenario = scenarios[scenarioId];
  const correct = choice === scenario.answer;
  const tone = choice === null ? PALETTE.blue : correct ? verdicts[scenario.answer].color : PALETTE.red;

  const chooseScenario = (id: ScenarioId) => {
    setScenarioId(id);
    setChoice(null);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 360);
    drawSceneLabel(ctx, '写清需求 → 对照证据与前提 → 给出三档结论', 280, 25, PALETTE.ink, 'center');

    roundedRect(ctx, 38, 48, 484, 82, 11);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = PALETTE.blue; ctx.lineWidth = 3; ctx.stroke();
    drawSceneLabel(ctx, scenario.label, 280, 76, PALETTE.blue, 'center');
    drawWrappedLabel(ctx, scenario.demand, 280, 102, 438, PALETTE.ink, 'center', 18);

    (Object.keys(verdicts) as Verdict[]).forEach((id, index) => {
      const item = verdicts[id];
      const x = 35 + index * 174;
      const selected = choice === id;
      const answer = choice !== null && scenario.answer === id;
      roundedRect(ctx, x, 159, 142, 58, 10);
      ctx.fillStyle = answer ? '#e3f4ea' : selected && !correct ? '#fde8ec' : '#fff'; ctx.fill();
      ctx.strokeStyle = answer ? verdicts[scenario.answer].color : selected ? PALETTE.red : PALETTE.axis;
      ctx.lineWidth = selected || answer ? 3 : 2; ctx.stroke();
      drawSceneLabel(ctx, item.label, x + 71, 193, answer ? verdicts[scenario.answer].color : item.color, 'center');
      if (answer) drawTargetMark(ctx, x + 123, 174, verdicts[scenario.answer].color);
    });

    roundedRect(ctx, 38, 245, 484, 79, 10);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = choice === null ? PALETTE.axis : tone; ctx.lineWidth = 2; ctx.stroke();
    drawWrappedLabel(ctx, choice === null ? '先作出判断，再核对采用前提与不能承诺的边界。' : `采用前提：${scenario.condition}`, 280, 269, 440, choice === null ? PALETTE.muted : PALETTE.ink, 'center', 18);
    if (choice !== null) drawWrappedLabel(ctx, `不能承诺：${scenario.boundary}`, 280, 304, 440, correct ? PALETTE.orange : PALETTE.red, 'center', 18);
    drawSceneLabel(ctx, scenario.evidence, 280, 348, PALETTE.muted, 'center');
  };

  const feedback = choice === null
    ? '先选择一个真实需求，再判断论文证据支持到哪一步。'
    : correct
      ? `判断正确：${scenario.condition} ${scenario.boundary}`
      : `这个判断越过了论文边界。该场景应归为“${verdicts[scenario.answer].label}”：${scenario.boundary}`;

  return <div className="paper-widget boundary-widget">
    <PaperCanvas height={360} draw={draw} ariaLabel={`${chapterId}-${moduleId} 适用条件与局限判断`} />
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(Object.keys(scenarios) as ScenarioId[]).map((id) => <button key={id} className={scenarioId === id ? 'active' : ''} onClick={() => chooseScenario(id)}>{scenarios[id].label}</button>)}
    </div>
    <div className="ctrl" aria-label="判断适用程度" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(Object.keys(verdicts) as Verdict[]).map((id) => <button key={id} className={choice === id ? 'active' : ''} onClick={() => setChoice(id)}>{verdicts[id].label}</button>)}
    </div>
    <Feedback tone={choice === null ? 'blue' : correct ? 'green' : 'red'}>{feedback}</Feedback>
  </div>;
};

export default DeploymentBoundaryLab;
