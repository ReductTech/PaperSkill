export const tutorial = {
  meta: {
    titleEn: 'Chameleon: Mixed-Modal Early-Fusion Foundation Models',
    titleZh: 'Chameleon：把图像写进句子',
  },
  chapters: [
    { kind: 'chapter', id: 'thesis', title: '早期融合', modules: [
      { kind: 'module', id: '1.1', title: '三种融合路线', componentId: 'fusion-map' },
      { kind: 'module', id: '1.2', title: '论文主张', componentId: 'thesis-card' },
    ]},
    { kind: 'chapter', id: 'tokenizer', title: '图像成词', modules: [
      { kind: 'module', id: '2.1', title: 'Tokenizer 显微镜', componentId: 'tokenizer-lab' },
    ]},
    { kind: 'chapter', id: 'sequence', title: '混合序列', modules: [
      { kind: 'module', id: '3.1', title: '序列编排器', componentId: 'sequence-lab' },
    ]},
    { kind: 'chapter', id: 'stability', title: '稳定训练', modules: [
      { kind: 'module', id: '4.1', title: '失稳诊断台', componentId: 'stability-lab' },
    ]},
    { kind: 'chapter', id: 'scale', title: '规模配方', modules: [
      { kind: 'module', id: '5.1', title: '模型与训练账本', componentId: 'scale-lab' },
    ]},
    { kind: 'chapter', id: 'alignment', title: '对齐阶段', modules: [
      { kind: 'module', id: '6.1', title: 'SFT 数据调色盘', componentId: 'alignment-lab' },
    ]},
    { kind: 'chapter', id: 'evidence', title: '实验证据', modules: [
      { kind: 'module', id: '7.1', title: '人工评测还原', componentId: 'evidence-lab' },
    ]},
    { kind: 'chapter', id: 'lineage', title: '路线演进', modules: [
      { kind: 'module', id: '8.1', title: '统一模型三连读', componentId: 'lineage-lab' },
    ]},
    { kind: 'chapter', id: 'limits', title: '可信边界', modules: [
      { kind: 'module', id: '9.1', title: '结论审计', componentId: 'limits-audit' },
    ]},
    { kind: 'chapter', id: 'quiz', title: '理解验收', modules: [
      { kind: 'module', id: '10.1', title: '五题测验', componentId: 'quiz-lab' },
    ]},
  ],
}
