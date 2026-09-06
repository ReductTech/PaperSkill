import type { MediaAsset, MediaCrop } from '../types';

export const OMNIDOCBENCH_PAPER_URL = 'https://arxiv.org/pdf/2412.07626';

const MEDIA_CROPS = {
  'mineru-data-engine': {
    ddas: { x: 0.5, y: 37, width: 61.5, height: 31, label: 'DDAS' },
    cmcv: { x: 0.5, y: 69, width: 61.5, height: 30, label: 'CMCV' },
    judgeRefine: { x: 63, y: 0.5, width: 36.5, height: 67, label: 'Judge-and-Refine' },
    trainingRoutes: { x: 0.5, y: 0.5, width: 61.5, height: 35, label: '训练路线' },
  },
  'mineru-ddas': {
    pageLevel: { x: 0.5, y: 0.5, width: 99, height: 48, label: '页面级采样' },
    elementLevel: { x: 0.5, y: 51, width: 62, height: 48, label: '元素级采样' },
    jointSample: { x: 64, y: 51, width: 35.5, height: 48, label: '联合采样' },
  },
  'omni-output': {
    originalPdf: { x: 2.5, y: 4, width: 31, height: 84, label: '原始 PDF' },
    outputA: { x: 34.4, y: 5, width: 31.3, height: 84, label: '输出 A' },
    outputB: { x: 66.4, y: 5, width: 31.2, height: 84, label: '输出 B' },
  },
  'omni-layout': {
    doubleColumn: { x: 2.2, y: 6, width: 31.2, height: 82, label: '双栏论文' },
    tripleColumn: { x: 34.1, y: 6, width: 31.2, height: 82, label: '三栏法规' },
    complexLayout: { x: 66.1, y: 6, width: 31.2, height: 82, label: '复杂杂志版式' },
  },
  'omni-table': {
    rotated: { x: 2.2, y: 7, width: 31, height: 80, label: '旋转表格' },
    formula: { x: 34.2, y: 7, width: 31, height: 80, label: '公式嵌入表格' },
    mergedCells: { x: 66, y: 7, width: 31.4, height: 80, label: '彩色与合并单元格' },
    mergedCellTable: { x: 65, y: 46, width: 33, height: 38, label: '合并单元格表格' },
  },
} as const satisfies Record<string, Record<string, MediaCrop>>;

const OMNI_FORBIDDEN_CLAIMS = [
  '不是 MinerU2.5-Pro 训练样本。',
  '不能默认视为 OmniDocBench v1.6 的296页Hard子集。',
  '不能将 OmniDocBench 原图解读为 MinerU2.5-Pro 的性能证据。',
  '不能将截图或原图用作 296 页 Hard 训练隔离的独立证明。',
];

export const MEDIA_ASSETS = {
  'document-concept': {
    id: 'document-concept',
    kind: 'teaching-art',
    src: 'images/document-parsing-concept.png',
    width: 1536,
    height: 1024,
    alt: '文档解析从页面元素恢复为结构化内容的教学示意图',
    role: 'problem-example',
    allowedClaim: '这是为教程绘制的文档解析概念图，用于说明页面结构化任务。',
  },
  'mineru-data-engine': {
    id: 'mineru-data-engine',
    kind: 'paper-figure',
    src: 'images/paper-figure-2-data-engine.png',
    width: 2004,
    height: 886,
    alt: 'MinerU2.5-Pro 论文中数据引擎各机制的关系图',
    role: 'mechanism-diagram',
    source: {
      title: 'MinerU2.5-Pro',
      url: 'https://arxiv.org/html/2604.04771v2#S3.F2',
      figure: 'Figure 2',
      licenseReview: 'pending',
    },
    allowedClaim: '论文将 DDAS、CMCV 与 Judge-and-Refine 组织为数据引擎的组成机制。',
    crops: MEDIA_CROPS['mineru-data-engine'],
  },
  'mineru-ddas': {
    id: 'mineru-ddas',
    kind: 'paper-figure',
    src: 'images/paper-figure-3-ddas.png',
    width: 2027,
    height: 934,
    alt: 'MinerU2.5-Pro 论文中 DDAS 页面级和元素级采样流程图',
    role: 'mechanism-diagram',
    source: {
      title: 'MinerU2.5-Pro',
      url: 'https://arxiv.org/html/2604.04771v2#S3.F3',
      figure: 'Figure 3',
      licenseReview: 'pending',
    },
    allowedClaim: '论文以页面级和元素级两层机制描述 DDAS 对训练样本分布的选择。',
    crops: MEDIA_CROPS['mineru-ddas'],
  },
  'omni-output': {
    id: 'omni-output',
    kind: 'paper-page',
    src: 'images/real-case-output-comparison.png',
    width: 1045,
    height: 540,
    alt: 'OmniDocBench 论文中原始 PDF 与两种结构化输出的对照页面',
    role: 'problem-example',
    source: {
      title: 'OmniDocBench',
      url: `${OMNIDOCBENCH_PAPER_URL}#page=16`,
      page: 16,
      figure: 'Figure S3',
      licenseReview: 'pending',
    },
    allowedClaim: '该论文页展示了文档内容边界和结构化输出规范会影响评测与训练数据。',
    forbiddenClaims: OMNI_FORBIDDEN_CLAIMS,
    crops: MEDIA_CROPS['omni-output'],
  },
  'omni-layout': {
    id: 'omni-layout',
    kind: 'paper-page',
    src: 'images/real-case-layout-diversity.png',
    width: 1040,
    height: 555,
    alt: 'OmniDocBench 论文中的双栏、三栏和复杂版式 PDF 页面',
    role: 'problem-example',
    source: {
      title: 'OmniDocBench',
      url: `${OMNIDOCBENCH_PAPER_URL}#page=19`,
      page: 19,
      figure: 'Figure S7',
      licenseReview: 'pending',
    },
    allowedClaim: '该论文页提供了双栏、三栏和复杂版式的真实文档解析任务示例。',
    forbiddenClaims: OMNI_FORBIDDEN_CLAIMS,
    crops: MEDIA_CROPS['omni-layout'],
  },
  'omni-table': {
    id: 'omni-table',
    kind: 'paper-page',
    src: 'images/real-case-table-structure.png',
    width: 1040,
    height: 640,
    alt: 'OmniDocBench 论文中的旋转、公式与合并单元格表格示例',
    role: 'problem-example',
    source: {
      title: 'OmniDocBench',
      url: `${OMNIDOCBENCH_PAPER_URL}#page=20`,
      page: 20,
      figure: 'Figure S10',
      licenseReview: 'pending',
    },
    allowedClaim: '该论文页展示了旋转表格、公式和合并单元格等结构恢复难例。',
    forbiddenClaims: OMNI_FORBIDDEN_CLAIMS,
    crops: MEDIA_CROPS['omni-table'],
  },
  'bili-mineru-open-talk': {
    id: 'bili-mineru-open-talk',
    kind: 'external-video',
    src: 'https://player.bilibili.com/player.html?bvid=BV15rHSeyEk2&p=1&autoplay=0&danmaku=0&poster=1',
    alt: 'MinerU 开源工具与复杂 PDF 解析背景导读视频',
    role: 'problem-example',
    source: {
      title: 'Bilibili：开源工具 MinerU 助力复杂 PDF 高效解析提取',
      url: 'https://www.bilibili.com/video/BV15rHSeyEk2/',
      licenseReview: 'pending',
    },
    allowedClaim: '视频只用作 MinerU 工具和复杂文档解析任务的背景导读。',
  },
  'bili-mineru-data-talk': {
    id: 'bili-mineru-data-talk',
    kind: 'external-video',
    src: 'https://player.bilibili.com/player.html?bvid=BV1uf421q7gp&p=1&autoplay=0&danmaku=0&poster=1',
    alt: 'MinerU 数据提取技术与工具分享视频',
    role: 'mechanism-diagram',
    source: {
      title: 'Bilibili：详解 MinerU',
      url: 'https://www.bilibili.com/video/BV1uf421q7gp/',
      licenseReview: 'pending',
    },
    allowedClaim: '视频只用作网页与 PDF 数据提取工作流的背景说明。',
  },
  'bili-mineru25-deploy': {
    id: 'bili-mineru25-deploy',
    kind: 'external-video',
    src: 'https://player.bilibili.com/player.html?bvid=BV1UVnkzKEnk&p=1&autoplay=0&danmaku=0&poster=1',
    alt: 'MinerU2.5 本地部署实践视频',
    role: 'result-evidence',
    source: {
      title: 'Bilibili：MinerU2.5 本地部署教程',
      url: 'https://www.bilibili.com/video/BV1UVnkzKEnk/',
      licenseReview: 'pending',
    },
    allowedClaim: '视频可用于解释本地部署实践，但不作为论文实验或性能结论证据。',
    forbiddenClaims: ['不能以第三方视频替代论文、官方仓库或基准评测证据。'],
  },
} as const satisfies Record<string, MediaAsset>;

export type MediaAssetId = keyof typeof MEDIA_ASSETS;

export function getMediaAsset(id: MediaAssetId): MediaAsset {
  return MEDIA_ASSETS[id];
}
