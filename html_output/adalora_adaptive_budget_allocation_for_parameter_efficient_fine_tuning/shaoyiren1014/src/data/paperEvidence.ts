export const figure1 = {
  source: { type: 'paper_evidence' as const, page: 2, locator: 'Figure 1a', url: 'https://arxiv.org/abs/2303.10512v2' },
  model: 'DeBERTaV3-base', dataset: 'MNLI-m', trainableParameters: '0.28M', metric: 'MNLI matched accuracy (%)',
  question: '可训练参数一样多，放到不同位置，结果会一样吗？',
  intuition: '研究者把同样数量的可训练参数放到六种不同位置，结果并不一样。这提醒我们：除了省参数，还要考虑把参数放在哪里。',
  boundary: '这是论文特定模型和任务的结果，不是你刚才的分配方案，也不能证明某种位置在所有任务中都最好。',
  rows: [
    { id: 'Wq', beginner: '位置 1', group: 'Attention', value: 88.58 },
    { id: 'Wk', beginner: '位置 2', group: 'Attention', value: 88.98 },
    { id: 'Wv', beginner: '位置 3', group: 'Attention', value: 89.36 },
    { id: 'Wo', beginner: '位置 4', group: 'Attention', value: 89.28 },
    { id: 'Wf1', beginner: '位置 5', group: 'FFN', value: 89.91 },
    { id: 'Wf2', beginner: '位置 6', group: 'FFN', value: 89.99 },
  ],
};

export const figure1b = {
  source: { type: 'paper_evidence' as const, page: 2, locator: 'Figure 1b', url: 'https://arxiv.org/abs/2303.10512v2' },
  model: 'DeBERTaV3-base', dataset: 'MNLI-m', trainableParameters: '0.28M',
  rows: [
    { id: '1–3', beginner: '第 1–3 层', value: 77.87 },
    { id: '4–6', beginner: '第 4–6 层', value: 85.82 },
    { id: '7–9', beginner: '第 7–9 层', value: 88.15 },
    { id: '10–12', beginner: '第 10–12 层', value: 88.60 },
  ],
};
