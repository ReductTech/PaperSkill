import type { MediaAssetId } from './media';

export type LearningResourceSectionId = 'video' | 'primary' | 'foundation';

export type LearningResourceKind = 'video' | 'paper' | 'code' | 'survey';

export interface LearningResource {
  id: string;
  section: LearningResourceSectionId;
  kind: LearningResourceKind;
  title: string;
  provider: string;
  href: string;
  summary: string;
  learn: string;
  tags: string[];
  audience: '入门' | '进阶' | '实践';
  note?: string;
  videoAssetId?: MediaAssetId;
  videoWhy?: string;
  watchFor?: readonly [string, string];
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
    summary: 'OpenDataLab 数据提取工程师从高质量语料需求出发，介绍 MinerU 的任务背景与复杂文档解析流程。',
    learn: '适合在教程入口前观看，先把“PDF 不是纯文本”变成具体问题。',
    tags: ['复杂 PDF', '数据提取', '任务背景'],
    audience: '入门',
    note: '这是 MinerU 工具与问题背景导读，不是 MinerU2.5-Pro 论文逐节讲解。',
    videoAssetId: 'bili-mineru-open-talk',
    videoWhy: '把“PDF 不只是纯文本”变成具体的页面与结构问题。',
    watchFor: ['页面里有哪些不同元素', '阅读顺序如何被恢复'],
  },
  {
    id: 'video-mineru-ai-talk',
    section: 'video',
    kind: 'video',
    title: '详解 MinerU：赋能大模型的高质量网页与 PDF 数据提取技术及工具分享',
    provider: 'OpenDataLab · Bilibili',
    href: 'https://www.bilibili.com/video/BV1uf421q7gp/',
    summary: 'MinerU 核心开发者介绍网页与 PDF 数据提取的技术背景、工具链和实际需求。',
    learn: '看完后更容易理解论文为什么把文档解析视为训练数据基础设施。',
    tags: ['高质量数据', '工具链', '开发者分享'],
    audience: '进阶',
    videoAssetId: 'bili-mineru-data-talk',
    videoWhy: '理解网页与 PDF 数据提取为何会影响后续可用语料。',
    watchFor: ['原始页面怎样变成结构化语料', '质量问题会在哪些环节累积'],
  },
  {
    id: 'video-mineru25-deploy',
    section: 'video',
    kind: 'video',
    title: 'PDF 解析之神！新一代 MinerU2.5 本地部署保姆级教程',
    provider: '第三方实践 · Bilibili',
    href: 'https://www.bilibili.com/video/BV1UVnkzKEnk/',
    summary: '以本地部署和实际文档处理为主，帮助读者把论文模型与可运行工具联系起来。',
    learn: '适合想进一步动手的读者；部署结论和效果判断应以官方仓库当前版本为准。',
    tags: ['MinerU2.5', '本地部署', '实践'],
    audience: '实践',
    note: '第三方视频，不作为本教程论文事实或性能数字的来源。',
    videoAssetId: 'bili-mineru25-deploy',
    videoWhy: '将论文中的模型与实际本地部署工具联系起来。',
    watchFor: ['演示使用的版本与运行环境', '输入文档和输出格式'],
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
