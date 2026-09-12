// 阅读导览的六大部分分类（总纲 + 侧边目录共用）。
// chapters 为 1-based 的章节编号。

export interface OutlinePart {
  n: number;
  title: string;
  desc: string;
  chapters: number[];
}

export const PARTS: OutlinePart[] = [
  { n: 1, title: '项目概述', desc: '这篇论文研究什么、在什么场景下测量', chapters: [1, 2] },
  { n: 2, title: '核心思路与系统架构设计', desc: '贯穿全文的核心洞察与形式化框架', chapters: [3, 4] },
  { n: 3, title: '关键技术实现与核心模块', desc: '被测量的对象与具体机制', chapters: [5, 6, 7] },
  { n: 4, title: '实验设置与观测结果的分析', desc: '怎么测、看到了什么', chapters: [8, 10] },
  { n: 5, title: '防御措施与系统稳健性思考', desc: '提示变体、良性对照与安全含义', chapters: [9] },
  { n: 6, title: '复现指南与避坑要点', desc: '环境搭建、常见坑与伦理自查', chapters: [] },
];
