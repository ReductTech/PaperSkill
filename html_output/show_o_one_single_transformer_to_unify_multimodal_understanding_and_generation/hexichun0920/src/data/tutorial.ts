export const tutorial = {
  meta: {
    titleEn: 'Show-o: One Single Transformer to Unify Multimodal Understanding and Generation',
    titleZh: 'Show-o：同一舞台，两种节拍',
  },
  chapters: [
    { kind: 'chapter', id: 'problem', title: '统一什么', modules: [
      { kind: 'module', id: '1.1', title: '三种统一路线', componentId: 'compare-routes' },
      { kind: 'module', id: '1.2', title: '核心主张', componentId: 'core-claim' },
    ]},
    { kind: 'chapter', id: 'prompt', title: '统一提示', modules: [
      { kind: 'module', id: '2.1', title: '任务序列切换', componentId: 'prompt-lab' },
    ]},
    { kind: 'chapter', id: 'attention', title: 'Omni-Attention', modules: [
      { kind: 'module', id: '3.1', title: '注意力掩码', componentId: 'attention-lab' },
    ]},
    { kind: 'chapter', id: 'diffusion', title: '离散扩散', modules: [
      { kind: 'module', id: '4.1', title: '去噪过程', componentId: 'denoise-lab' },
    ]},
    { kind: 'chapter', id: 'training', title: '训练课程', modules: [
      { kind: 'module', id: '5.1', title: '三阶段训练', componentId: 'training-lab' },
    ]},
    { kind: 'chapter', id: 'evidence', title: '实验结果', modules: [
      { kind: 'module', id: '6.1', title: '理解指标', componentId: 'evidence-lab' },
    ]},
    { kind: 'chapter', id: 'ablation', title: '消融证据', modules: [
      { kind: 'module', id: '7.1', title: '视觉表征消融', componentId: 'ablation-lab' },
    ]},
    { kind: 'chapter', id: 'ability', title: '下游能力', modules: [
      { kind: 'module', id: '8.1', title: '能力边界', componentId: 'ability-map' },
    ]},
    { kind: 'chapter', id: 'limits', title: '成本与局限', modules: [
      { kind: 'module', id: '9.1', title: '误读审计', componentId: 'limit-audit' },
    ]},
    { kind: 'chapter', id: 'quiz', title: '理解验收', modules: [
      { kind: 'module', id: '10.1', title: '五题测验', componentId: 'quiz-lab' },
    ]},
  ],
}
