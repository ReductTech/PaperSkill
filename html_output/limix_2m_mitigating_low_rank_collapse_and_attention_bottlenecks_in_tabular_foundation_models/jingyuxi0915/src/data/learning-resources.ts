export interface LearningResource {
  id: string;
  group: '秩' | 'SVD' | 'Embedding' | '注意力机制';
  title: string;
  platform: string;
  type: '视频' | '图文教程';
  url: string;
  purpose: string;
  chapterIds: string[];
}
// Static, user-selected links. Topic titles are not asserted to be original video titles.
export const learningResources: LearningResource[] = [
  {
    "id": "R1",
    "group": "秩",
    "title": "秩与线性代数补充：指定第 8 集",
    "platform": "B 站",
    "type": "视频",
    "url": "https://www.bilibili.com/video/BV1ib411t7YR?p=8",
    "purpose": "补充独立方向与线性表示的理解；链接指向用户选定的第 8 集。",
    "chapterIds": [
      "ch02-value",
      "ch03-spectrum"
    ]
  },
  {
    "id": "R2",
    "group": "SVD",
    "title": "SVD：奇异值分解补充讲解",
    "platform": "B 站",
    "type": "视频",
    "url": "https://www.bilibili.com/video/BV1XcfiBeEwQ",
    "purpose": "配合第 3 章的奇异值实验，补充理解矩阵分解。",
    "chapterIds": [
      "ch03-spectrum"
    ]
  },
  {
    "id": "R3",
    "group": "SVD",
    "title": "SVD：矩阵分解的几何意义（MIT）",
    "platform": "YouTube",
    "type": "视频",
    "url": "https://www.youtube.com/watch?v=mBcLRGuAFUk",
    "purpose": "从几何角度理解 U、Σ、Vᵀ 在分解中的作用。",
    "chapterIds": [
      "ch03-spectrum"
    ]
  },
  {
    "id": "R4",
    "group": "Embedding",
    "title": "Embedding 入门：Word Embedding 与 Word2Vec",
    "platform": "YouTube",
    "type": "视频",
    "url": "https://www.youtube.com/watch?v=viZrOnJclY0",
    "purpose": "借词向量理解“用向量表示对象”。词嵌入与本文数值单元格的 RaBEL 是不同的具体编码方法。",
    "chapterIds": [
      "ch02-value",
      "ch05-rabel"
    ]
  },
  {
    "id": "R5",
    "group": "注意力机制",
    "title": "注意力汇聚：Nadaraya–Watson 核回归",
    "platform": "动手学深度学习",
    "type": "图文教程",
    "url": "https://zh.d2l.ai/chapter_attention-mechanisms/nadaraya-waston.html",
    "purpose": "理解 query 与 key 如何决定权重、如何汇聚 value，并联系 RBF 的局部响应；本篇聚焦核回归。",
    "chapterIds": [
      "ch06-attention"
    ]
  },
  {
    "id": "R6",
    "group": "注意力机制",
    "title": "Transformer 注意力机制：直观理解",
    "platform": "B 站",
    "type": "视频",
    "url": "https://www.bilibili.com/video/BV1TZ421j7Ke",
    "purpose": "补充 QKV 直觉，再回到本教程观察双轴注意力与模块排列。",
    "chapterIds": [
      "ch06-attention",
      "ch08-routing"
    ]
  }
];
