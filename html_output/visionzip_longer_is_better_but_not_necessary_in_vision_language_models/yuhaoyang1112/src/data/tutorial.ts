export const chapters = [
  { kind: 'chapter', id: 'chap-1', short: '同图换问，视觉序列能否复用', title: '同一张图换个问题，还要重新选吗？', theme: '视觉编码', module: { kind: 'module', componentId: 'pipeline' } },
  { kind: 'chapter', id: 'chap-2', short: '主导筛选与上下文归并', title: '一张图上的 patch，最后去了哪里？', theme: '方法实验', module: { kind: 'module', componentId: 'lab' } },
  { kind: 'chapter', id: 'chap-3', short: '对照代码，数清 64 个输出', title: '代码里的 54 + 10，究竟数了什么？', theme: '代码对读', module: { kind: 'module', componentId: 'budget' } },
  { kind: 'chapter', id: 'chap-4', short: '精度、耗时与投影层微调', title: '压缩之后，为什么只微调投影层？', theme: '实验数据', module: { kind: 'module', componentId: 'results' } },
  { kind: 'chapter', id: 'chap-5', short: '高分辨率图像怎样分配预算', title: '一张图拆成五个视图，各能留下多少位置？', theme: 'LLaVA-NeXT', module: { kind: 'module', componentId: 'highResolution' } },
  { kind: 'chapter', id: 'chap-6', short: '视频理解怎样取舍帧数与细节', title: '同样长的视觉序列，可以多看几帧吗？', theme: 'Video-LLaVA', module: { kind: 'module', componentId: 'videoUnderstanding' } },
  { kind: 'chapter', id: 'chap-7', short: '五种方法分别让谁留下', title: '五种压缩方法，分别让谁留下？', theme: '系列回望', module: { kind: 'module', componentId: 'compare' } },
] as const;

export const endSections = [
  ['closing', '收束 · 结论分级'], ['glossary', '术语表'], ['sources', '来源与证据'], ['videos', 'B 站延伸学习'],
] as const;
export const repo = 'https://github.com/JIA-Lab-research/VisionZip';
export const pinned = repo + '/blob/8f86b55c6f000eb033e6912538af2dd7dcb30502/';
export const paper = 'https://openaccess.thecvf.com/content/CVPR2025/papers/Yang_VisionZip_Longer_is_Better_but_Not_Necessary_in_Vision_Language_CVPR_2025_paper.pdf';
export const supplement = 'https://openaccess.thecvf.com/content/CVPR2025/supplemental/Yang_VisionZip_Longer_is_CVPR_2025_supplemental.pdf';

// Verified against the original Bilibili pages and their video metadata.
export const videos = [
  { bvid: 'BV1wLGU66EWm', title: '大模型推理加速第5期—Token Compression--VisionZIP算法详解', up: '图明讲算法', scope: '本篇讲解', duration: '11:12', note: '配合方法章。看完算法思路，再回到实验点一个上下文代表，核对它接收了哪些位置。' },
  { bvid: 'BV15P4y137jb', title: 'ViT论文逐段精读【论文精读】', up: '跟李沐学AI', scope: '视觉编码背景', duration: '1:11:31', note: '配合 CLIP 打分这一步。先弄清图像怎样变成 patch 序列、CLS 放在哪里，再读注意力矩阵的首行。' },
] as const;
