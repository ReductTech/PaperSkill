export const rankExperiment = {
  source: {type:'conceptual_simulation' as const, scenarioId:'act-2-rank', mechanismReferences:['lora','scheduler'], assumptions:['四个同尺寸 64×64 教学矩阵','总 Rank 12','每处 Rank 0–8','只统计 LoRA 两因子参数'], disclaimer:'教学模拟，不代表真实训练结果'},
  initialRanks:[3,3,3,3], rankBudget:12, parametersPerRank:128, parameterBudget:1536, maxRank:8,
  positions:[
    {id:'A',name:'Attention · 示例 A'}, {id:'B',name:'Attention · 示例 B'},
    {id:'C',name:'FFN · 示例 C'}, {id:'D',name:'FFN · 示例 D'},
  ], performanceMetrics:null,
};
export const rankPredictions=[
  {id:'tradeoff',label:'需要让另一处让出一些容量。',detail:'我想保持总预算不变，重新分配份额。'},
  {id:'free',label:'只加一个通道，应该不用减少别处。',detail:'也许这点增加不会占用预算。'},
  {id:'accuracy',label:'把通道给 FFN，就一定能提高准确率。',detail:'我想沿用上一章的实验趋势。'},
] as const;
export const rankMechanism={
  source:{type:'paper_evidence' as const,sourceId:'uploaded-pdf',page:2,section:'Sections 1–2',locator:'Eq. 1; Section 2, Eq. 2',representation:'author_statement',url:'https://arxiv.org/abs/2303.10512v2'},
  intuition:'LoRA 用两张小参数表描述更新。Rank 改变时，两张表的尺寸随之改变，所以容量与可训练参数数量是连在一起的。',
  boundary:'这是论文结构定义的直觉解释，不是本次筹码交换的训练成绩。',
};
