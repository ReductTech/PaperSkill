export type LearningResourceSectionId = 'video' | 'primary' | 'foundation';

export type LearningResourceKind = 'video' | 'paper' | 'code' | 'survey';

export interface VideoLearningTask {
  beforeQuestion: string;
  focusPoints: string[];
  selfCheckQuestion: string;
  selfCheckOptions: Array<{
    id: string;
    label: string;
  }>;
  correctOptionId: string;
  correctFeedback: string;
  retryFeedback: string;
  relatedChapter: {
    href: `#${string}`;
    label: string;
  };
}

export interface LearningResource {
  id: string;
  section: LearningResourceSectionId;
  kind: LearningResourceKind;
  title: string;
  provider: string;
  href: string;
  embedHref?: string;
  summary: string;
  learn: string;
  tags: string[];
  audience: '入门' | '进阶' | '实践';
  note?: string;
  videoTask?: VideoLearningTask;
}

export interface LearningResourceSection {
  id: LearningResourceSectionId;
  label: string;
  eyebrow: string;
  question: string;
  answer: string;
}

// All URLs and titles were checked against their public pages on 2026-08-16.
// These are optional outbound references: no tutorial state, image or runtime
// dependency is loaded from them.
export const LEARNING_RESOURCE_SECTIONS: LearningResourceSection[] = [
  {
    id: 'video',
    label: '视频导读',
    eyebrow: '先建立直觉',
    question: '真实的复杂 PDF 为什么难解析？',
    answer: '先看实际页面、输出和工程流程，再回到论文里的数据方法。',
  },
  {
    id: 'primary',
    label: '原始文献',
    eyebrow: '再核对证据',
    question: '论文中的方法和数字从哪里来？',
    answer: '优先阅读作者论文、官方代码和评测仓库，避免二手解读替代证据。',
  },
  {
    id: 'foundation',
    label: '先修知识',
    eyebrow: '最后补齐概念',
    question: 'DDAS、GRPO、ViT 和 TEDS 的背景是什么？',
    answer: '只补当前机制需要的知识，不必先学完一整套机器学习课程。',
  },
];

export const FURTHER_LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 'video-mineru-open-talk',
    section: 'video',
    kind: 'video',
    title: '开源工具 MinerU 助力复杂 PDF 高效解析提取',
    provider: 'OpenMMLab · Bilibili',
    href: 'https://www.bilibili.com/video/BV15rHSeyEk2/',
    embedHref: 'https://player.bilibili.com/player.html?bvid=BV15rHSeyEk2&p=1&autoplay=0&danmaku=0&poster=1',
    summary: 'OpenDataLab 数据提取工程师从高质量语料需求出发，介绍 MinerU 的任务背景与复杂文档解析流程。',
    learn: '适合在教程入口前观看，先把“PDF 不是纯文本”变成具体问题。',
    tags: ['复杂 PDF', '数据提取', '任务背景'],
    audience: '入门',
    note: '这是 MinerU 工具与问题背景导读，不是 MinerU2.5-Pro 论文逐节讲解。',
    videoTask: {
      beforeQuestion: '如果已经识别出全部文字，为什么复杂 PDF 仍可能无法被机器正确使用？',
      focusPoints: ['页面里有哪些不同元素', '阅读顺序如何被恢复', '结构化输出怎样进入后续流程'],
      selfCheckQuestion: '文档解析比普通文字识别多恢复了什么？',
      selfCheckOptions: [
        { id: 'characters', label: '只恢复更多字符' },
        { id: 'structure', label: '元素类型、位置、顺序与结构' },
        { id: 'pages', label: '只统计 PDF 页数' },
      ],
      correctOptionId: 'structure',
      correctFeedback: '正确：识别文字只是起点，文档解析还要恢复可用的页面结构。',
      retryFeedback: '再想一步：如果字符都对，但公式、表格与阅读顺序错了，输出仍不可用。',
      relatedChapter: { href: '#step-1', label: '回看第 1 步：数据瓶颈' },
    },
  },
  {
    id: 'video-mineru-ai-talk',
    section: 'video',
    kind: 'video',
    title: '详解 MinerU：赋能大模型的高质量网页与 PDF 数据提取技术及工具分享',
    provider: 'OpenDataLab · Bilibili',
    href: 'https://www.bilibili.com/video/BV1uf421q7gp/',
    embedHref: 'https://player.bilibili.com/player.html?bvid=BV1uf421q7gp&p=1&autoplay=0&danmaku=0&poster=1',
    summary: 'MinerU 核心开发者介绍网页与 PDF 数据提取的技术背景、工具链和实际需求。',
    learn: '看完后更容易理解论文为什么把文档解析视为训练数据基础设施。',
    tags: ['高质量数据', '工具链', '开发者分享'],
    audience: '进阶',
    videoTask: {
      beforeQuestion: '为什么一个 PDF 解析器会影响后续大模型能学到什么？',
      focusPoints: ['原始页面怎样变成结构化语料', '质量问题会在哪些环节累积', '工具链为何需要可复核输出'],
      selfCheckQuestion: '解析工具被称为“数据基础设施”的核心原因是？',
      selfCheckOptions: [
        { id: 'interface', label: '界面看起来更专业' },
        { id: 'corpus', label: '解析结果可形成后续训练可用的结构化语料' },
        { id: 'model-size', label: '它一定会增大模型参数量' },
      ],
      correctOptionId: 'corpus',
      correctFeedback: '正确：解析质量决定进入训练管线的数据内容与结构是否可信。',
      retryFeedback: '提示：关注解析输出最终流向哪里，而不是工具本身的界面或模型大小。',
      relatedChapter: { href: '#step-2', label: '回看第 2 步：DDAS 选数' },
    },
  },
  {
    id: 'video-mineru25-deploy',
    section: 'video',
    kind: 'video',
    title: 'PDF 解析之神！新一代 MinerU2.5 本地部署保姆级教程',
    provider: '第三方实践 · Bilibili',
    href: 'https://www.bilibili.com/video/BV1UVnkzKEnk/',
    embedHref: 'https://player.bilibili.com/player.html?bvid=BV1UVnkzKEnk&p=1&autoplay=0&danmaku=0&poster=1',
    summary: '以本地部署和实际文档处理为主，帮助读者把论文模型与可运行工具联系起来。',
    learn: '适合想进一步动手的读者；部署结论和效果判断应以官方仓库当前版本为准。',
    tags: ['MinerU2.5', '本地部署', '实践'],
    audience: '实践',
    note: '第三方视频，不作为本教程论文事实或性能数字的来源。',
    videoTask: {
      beforeQuestion: '一次本地部署演示，能直接证明论文报告的性能提升吗？',
      focusPoints: ['演示使用的版本与运行环境', '输入文档和输出格式', '哪些结论仍需回到论文与评测代码核对'],
      selfCheckQuestion: '看到第三方部署效果后，最稳妥的结论是什么？',
      selfCheckOptions: [
        { id: 'proof', label: '单个演示即可证明论文全部实验结论' },
        { id: 'replace', label: '视频结果可替代官方评测' },
        { id: 'practice', label: '它说明工具可实践，性能结论仍需核对版本与官方证据' },
      ],
      correctOptionId: 'practice',
      correctFeedback: '正确：部署视频帮助理解工程使用，论文数字仍应由原文与官方评测支撑。',
      retryFeedback: '注意证据层级：工程演示、标准评测和论文消融回答的是不同问题。',
      relatedChapter: { href: '#step-6', label: '回看第 6 步：公平评测' },
    },
  },
  {
    id: 'paper-mineru25-pro',
    section: 'primary',
    kind: 'paper',
    title: 'MinerU2.5-Pro: Pushing the Limits of Data-Centric Document Parsing at Scale',
    provider: '作者论文 · arXiv',
    href: 'https://arxiv.org/abs/2604.04771v2',
    summary: '本教程的主要事实来源，包含 DDAS、CMCV、Judge-and-Refine、分阶段训练、GRPO 与 OmniDocBench v1.6 实验。',
    learn: '核对教程中的机制、数据口径、实验结果和证据边界。',
    tags: ['主论文', '数据引擎', '实验'],
    audience: '进阶',
  },
  {
    id: 'paper-mineru25',
    section: 'primary',
    kind: 'paper',
    title: 'MinerU2.5: A Decoupled Vision-Language Model for Efficient High-Resolution Document Parsing',
    provider: '作者论文 · arXiv',
    href: 'https://arxiv.org/abs/2509.22186',
    summary: '解释 MinerU2.5 的 1.2B 粗到细架构：先在低分辨率图像上做全局布局分析，再对原分辨率局部区域进行识别。',
    learn: '用来理解 Pro 版本“架构保持不变”到底锁定了什么。',
    tags: ['1.2B 架构', '粗到细', '高分辨率'],
    audience: '进阶',
  },
  {
    id: 'paper-omnidocbench',
    section: 'primary',
    kind: 'paper',
    title: 'OmniDocBench: Benchmarking Diverse PDF Document Parsing with Comprehensive Annotations',
    provider: 'CVPR 2025 · arXiv',
    href: 'https://arxiv.org/abs/2412.07626',
    summary: '介绍覆盖多种文档类型、布局、语言和元素的文档解析评测框架，是理解 Base、Hard 与综合指标的前提。',
    learn: '重点看评测对象、细粒度标注和端到端匹配方式。',
    tags: ['评测集', '文档多样性', '公平比较'],
    audience: '进阶',
  },
  {
    id: 'code-mineru',
    section: 'primary',
    kind: 'code',
    title: 'OpenDataLab / MinerU 官方仓库',
    provider: '官方代码 · GitHub',
    href: 'https://github.com/opendatalab/MinerU',
    summary: '包含 MinerU 当前版本的安装、模型、CLI/API、输出格式与发布说明。',
    learn: '当论文版本与实际部署行为不同时，以仓库对应版本说明核对工程用法。',
    tags: ['官方实现', '安装', '版本记录'],
    audience: '实践',
  },
  {
    id: 'code-omnidocbench',
    section: 'primary',
    kind: 'code',
    title: 'OpenDataLab / OmniDocBench 官方评测仓库',
    provider: '官方代码 · GitHub',
    href: 'https://github.com/opendatalab/OmniDocBench',
    summary: '提供文本、公式、表格、布局和端到端文档解析的评测代码与数据说明。',
    learn: '用代码层面的输入、归一化和匹配流程理解“公平评测”不是只看一个分数。',
    tags: ['评测代码', 'MGAM', '复现'],
    audience: '实践',
  },
  {
    id: 'survey-data-centric-ai',
    section: 'foundation',
    kind: 'survey',
    title: 'Data-centric Artificial Intelligence: A Survey',
    provider: '综述 · arXiv',
    href: 'https://arxiv.org/abs/2303.10158',
    summary: '从训练数据开发、推理数据开发和数据维护三个目标组织数据中心 AI 的方法与挑战。',
    learn: '帮助判断 MinerU2.5-Pro 的数据选择、标注、评测集构建分别处在数据生命周期的哪一环。',
    tags: ['数据中心 AI', '数据生命周期', '综述'],
    audience: '入门',
  },
  {
    id: 'paper-deepseekmath-grpo',
    section: 'foundation',
    kind: 'paper',
    title: 'DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models',
    provider: 'GRPO 原始论文 · arXiv',
    href: 'https://arxiv.org/abs/2402.03300',
    summary: '提出 Group Relative Policy Optimization，通过同一问题的一组输出建立相对优势，减少 PPO 对价值模型的依赖。',
    learn: '对应教程中 G=16 rollout 的组内比较；MinerU2.5-Pro 使用的是任务指标奖励。',
    tags: ['GRPO', 'Rollout', '相对奖励'],
    audience: '进阶',
  },
  {
    id: 'paper-vit',
    section: 'foundation',
    kind: 'paper',
    title: 'An Image is Worth 16×16 Words: Transformers for Image Recognition at Scale',
    provider: 'ViT 原始论文 · arXiv',
    href: 'https://arxiv.org/abs/2010.11929',
    summary: '介绍把图像切成 patch 序列并用 Transformer 建模的 Vision Transformer。',
    learn: '用于理解 DDAS 为什么可以先把页面编码成视觉 embedding，再在向量空间中聚类。',
    tags: ['ViT', 'Embedding', '视觉特征'],
    audience: '入门',
  },
  {
    id: 'paper-pubtabnet-teds',
    section: 'foundation',
    kind: 'paper',
    title: 'Image-based Table Recognition: Data, Model, and Evaluation',
    provider: 'TEDS 来源论文 · arXiv',
    href: 'https://arxiv.org/abs/1911.10683',
    summary: '发布 PubTabNet，并提出基于树编辑距离的表格相似度 TEDS。',
    learn: '帮助理解为什么表格评测既要考虑文本内容，也要考虑 HTML 树结构。',
    tags: ['TEDS', '表格结构', '树编辑距离'],
    audience: '进阶',
  },
];

export const LEARNING_RESOURCE_KIND_LABEL: Record<LearningResourceKind, string> = {
  video: '视频',
  paper: '论文',
  code: '代码',
  survey: '综述',
};
