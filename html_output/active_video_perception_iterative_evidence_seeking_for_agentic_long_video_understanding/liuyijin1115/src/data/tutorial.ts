import { chapters } from '../content';

// Compatibility metadata sourced from the same ten chapters rendered by App.tsx.
export const tutorial = {
  chapters: [
    { kind: 'chapter', ...chapters[0], modules: [
      { kind: 'module', id: 'sampling', title: '固定采样与证据遗漏', componentId: 'avp-sampling' },
      { kind: 'module', id: 'question', title: '被动描述与主动观察', componentId: 'avp-question' },
    ] },
    { kind: 'chapter', ...chapters[1], modules: [
      { kind: 'module', id: 'flow', title: '三模块协作', componentId: 'avp-flow' },
      { kind: 'module', id: 'replan', title: '证据反馈与再次观察', componentId: 'avp-replan' },
    ] },
    { kind: 'chapter', ...chapters[2], modules: [
      { kind: 'module', id: 'what', title: '问题条件化的观察目标', componentId: 'avp-what' },
      { kind: 'module', id: 'where-how', title: '时间区间与采样粒度', componentId: 'avp-where-how' },
      { kind: 'module', id: 'replanning', title: '历史反馈与重新规划', componentId: 'avp-replanning' },
    ] },
    { kind: 'chapter', ...chapters[3], modules: [
      { kind: 'module', id: 'observation', title: '定向视频观察', componentId: 'avp-observation' },
      { kind: 'module', id: 'evidence-memory', title: '时间戳证据与工作记忆', componentId: 'avp-evidence-memory' },
    ] },
    { kind: 'chapter', ...chapters[4], modules: [
      { kind: 'module', id: 'evidence-gap', title: '证据充分性与缺失信息', componentId: 'avp-evidence-gap' },
      { kind: 'module', id: 'stop-decision', title: '置信度、迭代上限与停止', componentId: 'avp-stop-decision' },
    ] },
    { kind: 'chapter', ...chapters[5], modules: [
      { kind: 'module', id: 'search', title: '粗略搜索与精细观察', componentId: 'avp-search' },
      { kind: 'module', id: 'trace', title: '多轮执行与证据整合', componentId: 'avp-trace' },
    ] },
    { kind: 'chapter', ...chapters[6], modules: [
      { kind: 'module', id: 'allocation', title: '通用 Caption 与按需观察', componentId: 'avp-allocation' },
      { kind: 'module', id: 'results', title: '推理时间与 Token 成本', componentId: 'avp-results' },
    ] },
    { kind: 'chapter', ...chapters[7], modules: [
      { kind: 'module', id: 'benchmarks', title: '五个 Benchmark 的任务差异', componentId: 'avp-benchmarks' },
      { kind: 'module', id: 'baseline-results', title: '主实验与 Baseline 比较', componentId: 'avp-baseline-results' },
    ] },
    { kind: 'chapter', ...chapters[8], modules: [
      { kind: 'module', id: 'assembly', title: '三模块组件消融', componentId: 'avp-assembly' },
      { kind: 'module', id: 'explorer', title: '模型配置与关键超参数', componentId: 'avp-explorer' },
    ] },
    { kind: 'chapter', ...chapters[9], modules: [
      { kind: 'module', id: 'replay', title: '短暂事件与证据遗漏', componentId: 'avp-replay' },
      { kind: 'module', id: 'evidence', title: '高置信度错误', componentId: 'avp-evidence' },
      { kind: 'module', id: 'research', title: '研究贡献与开放问题', componentId: 'avp-research' },
    ] },
  ],
} as const;