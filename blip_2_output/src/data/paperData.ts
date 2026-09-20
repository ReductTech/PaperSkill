export const paperData = {
  stage1Ablation: {
    metric: 'Zero-shot VQAv2 accuracy',
    variants: [
      { id: 'two-stage', label: '完整两阶段', value: 63.0, approximate: false },
      { id: 'stage2-only', label: '直接 Stage 2', value: 40.0, approximate: true },
    ],
    note: '直接跳过 Stage 1 时性能显著下降；约值依据论文 Figure 5 曲线读取，用于呈现趋势而非精确表格比较。',
    source: 'BLIP-2, Figure 5',
  },
  efficiency: {
    models: [
      { id: 'blip2', label: 'BLIP-2 ViT-g + FlanT5XXL', vqa: 65.0, trainableScale: 1 },
      { id: 'flamingo', label: 'Flamingo80B', vqa: 56.3, trainableScale: 54 },
    ],
    reportedReduction: '54× fewer trainable parameters',
    note: '论文报告 BLIP-2 在该 zero-shot VQAv2 比较中高 8.7 个百分点，同时使用显著更少的可训练参数。比较仅对应论文给定配置与协议。',
    source: 'BLIP-2, Table 2 and abstract',
  },
  upgrades: {
    vision: { label: '视觉编码器升级', from: 'ViT-L + OPT2.7B', to: 'ViT-g + OPT2.7B', before: 49.7, after: 52.3, metric: 'VQAv2 test-dev' },
    language: { label: 'LLM 升级', from: 'ViT-g + FlanT5XL', to: 'ViT-g + FlanT5XXL', before: 63.0, after: 65.0, metric: 'VQAv2 test-dev' },
    note: '更强单模态模块能够在相同桥接思路下带来收益，但幅度取决于模型组合、任务和训练协议。',
    source: 'BLIP-2, Table 2',
  },
  capabilities: [
    { id: 'vqa', label: 'VQA', question: '根据图像回答问题', evidence: 'Zero-shot VQAv2 test-dev：65.0', signal: '视觉定位 + 语言作答' },
    { id: 'caption', label: 'Captioning', question: '把图像内容组织成自然语言描述', evidence: 'COCO zero-shot CIDEr：121.6', signal: '视觉信息 → 连贯描述' },
    { id: 'retrieval', label: 'Image-Text Retrieval', question: '让正确图片与文字彼此检索', evidence: 'Flickr30K zero-shot R@1：图到文 97.6 / 文到图 89.7', signal: '共享语义空间' },
    { id: 'instruction', label: 'Instructed Image-to-Text Generation', question: '按照自然语言指令改变图像输出方式', evidence: '论文展示零样本指令式图像到文本生成案例', signal: '视觉条件 + 指令跟随' },
  ],
  benchmarkRows: [
    { model: 'ViT-L + OPT2.7B', vqaVal: 50.1, vqaTest: 49.7, okVqa: 49.7, gqa: 30.2 },
    { model: 'ViT-g + OPT2.7B', vqaVal: 53.5, vqaTest: 52.3, okVqa: 52.3, gqa: 31.7 },
    { model: 'ViT-g + OPT6.7B', vqaVal: 54.3, vqaTest: 52.6, okVqa: 52.6, gqa: 36.4 },
    { model: 'ViT-L + FlanT5XL', vqaVal: 62.6, vqaTest: 62.3, okVqa: 62.3, gqa: 39.4 },
    { model: 'ViT-g + FlanT5XL', vqaVal: 63.1, vqaTest: 63.0, okVqa: 63.0, gqa: 40.7 },
    { model: 'ViT-g + FlanT5XXL', vqaVal: 65.2, vqaTest: 65.0, okVqa: 65.0, gqa: 45.9 },
  ],
  ablationNotes: [
    { title: 'Stage 1 representation learning', finding: '直接用 Stage 2 生成目标训练会导致 zero-shot VQA 明显退化；Figure 5 以曲线展示这一趋势。', source: 'Figure 5；数值以曲线约读呈现' },
    { title: 'In-context VQA demonstrations', finding: '增加 VQA 示例没有带来明显改善；作者将其与预训练阶段主要使用单个 image-text pair 联系起来。', source: 'Section 4.3 / zero-shot VQA discussion' },
    { title: 'Module scaling', finding: '更强视觉编码器与更强 LLM 都能在相同桥接范式下改善结果，但不是无条件保证。', source: 'Table 2；需保持评测协议一致' },
  ],
  dataBoundary: '表格数值来自论文给定配置；不同 split、metric 或 zero-shot / fine-tuned 协议不能直接横向比较。',
} as const;

export type CapabilityId = typeof paperData.capabilities[number]['id'];
