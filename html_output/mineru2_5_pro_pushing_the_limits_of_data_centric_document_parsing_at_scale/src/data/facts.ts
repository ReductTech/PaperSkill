export const PAPER_URL = 'https://arxiv.org/html/2604.04771v2';

export const PAPER_FACTS = {
  architecture: {
    vision: 'NaViT-675M',
    language: 'Qwen2-0.5B',
    total: '1.2B',
    changed: false,
  },
  scores: {
    stage0: 92.98,
    stage1: 94.29,
    stage2: 95.25,
    stage3: 95.69,
    stageGains: {
      stage1: 1.31,
      stage2: 0.96,
      stage3: 0.45,
    },
    endpointGain: 2.71,
    roundedStageGain: 2.72,
    basePro: 96.12,
    baseBest: 96.19,
    hardPro: 94.08,
    // v2 主文 §6.2 的文字口径；附录 Table 8 另列 PaddleOCR-VL 92.48。
    hardMainTextComparator: 92.01,
    hardMainTextLead: 2.07,
    hardAppendixRunnerUp: 92.48,
    hardAppendixLead: 1.6,
  },
  data: {
    pageCandidates: '约 60M 页级候选',
    pageEmbedding: '512 维 ViT-base',
    stage1: '65.5M 跨任务样本',
    stage2: '3.9M 总样本',
    expertHard: '192K 专家 Hard',
    stage3: '192K 高质量样本',
    rollouts: 16,
  },
  benchmark: {
    basePages: 1355,
    hardPages: 296,
    fullPages: 1651,
  },
  modelCommittee: ['MinerU2.5', 'PaddleOCR-VL', 'Qwen3-VL-30B'],
  teacher: 'Qwen3-VL-235B',
  rewards: ['Edit Distance', 'CDM', 'TEDS', 'IoU'],
} as const;

export const RESEARCH_DIRECTIONS = [
  {
    title: '拆开数据引擎做消融',
    text: 'Table 3 只给出训练阶段的累计消融，尚不能区分 DDAS、CMCV 与 Judge-and-Refine 各自贡献。',
  },
  {
    title: '检查委员会相关错误',
    text: '更换外部模型池并报告条件准确率，检验三模型是否会共享同一种系统性偏差。',
  },
  {
    title: '披露标注与教师成本',
    text: '补充自动修复成功率、专家接管比例、教师调用量、算力和人工成本。',
  },
  {
    title: '刻画 MGAM 代价与偏置',
    text: '报告随预测块数增长的枚举时间、剪枝策略，以及多候选取最佳可能带来的乐观偏置。',
  },
  {
    title: '验证 GRPO 指标过拟合',
    text: '更换奖励指标、领域和语言，测试直接优化评测指标是否损害评测外能力。',
  },
  {
    title: '走向高层文档理解',
    text: '继续评测标题层级、图文指代、阅读顺序、跨页表格和跨页关系。',
  },
] as const;
