import type { AblationRow, HitlRow, NavSection, PresenterStop, ResultRow } from '../types';

export const navSections: NavSection[] = [
  { id: 'motivation', number: '01', label: '动机' },
  { id: 'challenges', number: '02', label: '挑战' },
  { id: 'architecture', number: '03', label: '方法' },
  { id: 'simulator', number: '04', label: '如何运作' },
  { id: 'experiments', number: '05', label: '实验' },
  { id: 'takeaway', number: '06', label: '结论' },
];

export const presenterStops: PresenterStop[] = [
  { id: 'motivation', section: 'motivation', targetId: 'motivation', label: 'Motivation', durationSeconds: 25 },
  { id: 'challenges', section: 'challenges', targetId: 'challenges', label: 'Challenges', durationSeconds: 35 },
  { id: 'architecture', section: 'architecture', targetId: 'architecture', label: 'Architecture', durationSeconds: 20 },
  { id: 'hypothesis', section: 'simulator', targetId: 'sim-hypothesis', label: 'Hypothesis Debate', durationSeconds: 18 },
  { id: 'failure', section: 'simulator', targetId: 'sim-experiment', label: 'Experiment Failure', durationSeconds: 14 },
  { id: 'healing', section: 'simulator', targetId: 'sim-healing', label: 'Repair / Refine / Pivot', durationSeconds: 24 },
  { id: 'result-debate', section: 'simulator', targetId: 'sim-result-debate', label: 'Result Debate', durationSeconds: 12 },
  { id: 'verification', section: 'simulator', targetId: 'sim-verification', label: 'Verification', durationSeconds: 12 },
  { id: 'evolution', section: 'simulator', targetId: 'sim-evolution', label: 'Cross-Run Evolution', durationSeconds: 20 },
  { id: 'experiments', section: 'experiments', targetId: 'experiments', label: 'Experiments', durationSeconds: 30 },
  { id: 'hitl', section: 'experiments', targetId: 'hitl-study', label: 'HITL', durationSeconds: 20 },
  { id: 'takeaway', section: 'takeaway', targetId: 'takeaway', label: 'Takeaway', durationSeconds: 10 },
];

export const challenges = [
  {
    id: 'hypothesis',
    number: '01',
    title: '假设质量',
    short: '单智能体很容易提出、再自己认可一个看似合理却不可证伪的方向。',
    response: 'Multi-Agent Debate 让创新、可行性和反例在实验前发生结构化冲突。',
  },
  {
    id: 'execution',
    number: '02',
    title: '执行鲁棒性',
    short: '运行错误会让线性流程直接终止，而错误本身往往包含下一步线索。',
    response: 'Self-Healing 先修复可恢复的执行问题；必要时再 Refine 实验或 Pivot 研究方向。',
  },
  {
    id: 'memory',
    number: '03',
    title: '跨运行经验积累',
    short: '若每次运行都从零开始，系统会不断重犯已经知道的错误。',
    response: 'Cross-Run Evolution 将经验写入可检索、随时间衰减的 Lesson Store。',
  },
] as const;

export const mainResults: ResultRow[] = [
  { name: 'AutoResearchClaw CoPilot', codeDevelopment: 0.968, codeExecution: 0.578, resultAnalysis: 0.523, overall: 0.648, accent: 'method' },
  { name: 'AutoResearchClaw Full-Auto', codeDevelopment: 0.938, codeExecution: 0.562, resultAnalysis: 0.442, overall: 0.596, accent: 'method' },
  { name: 'AIDE-ML', codeDevelopment: 0.958, codeExecution: 0.415, resultAnalysis: 0.336, overall: 0.511 },
  { name: 'AI Scientist v2', codeDevelopment: 0.712, codeExecution: 0.442, resultAnalysis: 0.261, overall: 0.419, accent: 'baseline' },
];

export const ablations: AblationRow[] = [
  { id: 'full', label: 'Full AutoResearchClaw', completion: '10 / 10', quality: 5.62, accept: '3 / 10', fabricated: false, insight: '五个机制共同构成完整的科学反馈回路。' },
  { id: 'debate', label: 'Disable Debate', completion: '10 / 10', quality: 4.25, accept: '1 / 10', fabricated: false, insight: 'Debate 是最大的质量贡献者：缺少可行性筛选和反方审查，研究质量明显下降。' },
  { id: 'healing', label: 'Disable Self-Healing', completion: '6 / 10', quality: 4.83, accept: '1 / 6', fabricated: false, insight: 'Self-Healing 保持研究活着：第一次不可恢复的运行错误不再直接结束整次研究。' },
  { id: 'evolution', label: 'Disable Evolution', completion: '9 / 10', quality: 5.14, accept: '2 / 10', fabricated: false, insight: 'Evolution 主要避免已知失败模式，提升可靠性而不是抬高质量上限。' },
  { id: 'verification', label: 'Disable Verification', completion: '10 / 10', quality: 5.48, accept: '5 / 10', fabricated: true, insight: '表面接受数变高，但 5 篇中有 3 篇出现无法追溯到 measurement record 的数值。' },
  { id: 'debate-healing', label: 'Disable Debate + Self-Healing', completion: '4 / 10', quality: 3.47, accept: '0 / 4', fabricated: false, insight: '两者共同移除的损失是超加性的：好问题会崩溃，修复也可能服务于坏问题。' },
];

export const hitlRows: HitlRow[] = [
  { mode: 'Full-Auto', valid: '8 / 10', quality: 4.03, accept: '25.0%', interventions: 0 },
  { mode: 'Gate-Only', valid: '10 / 10', quality: 5.03, accept: '50.0%', interventions: 3 },
  { mode: 'CoPilot', valid: '8 / 10', quality: 7.27, accept: '87.5%', interventions: 6 },
  { mode: 'Thorough', valid: '7 / 10', quality: 4.86, accept: '42.9%', interventions: 8 },
  { mode: 'Step-by-Step', valid: '10 / 10', quality: 5.19, accept: '50.0%', interventions: 23 },
  { mode: 'Pre-Experiment', valid: '8 / 10', quality: 4.28, accept: '37.5%', interventions: 3 },
  { mode: 'Post-Experiment', valid: '6 / 10', quality: 5.08, accept: '50.0%', interventions: 3 },
];
