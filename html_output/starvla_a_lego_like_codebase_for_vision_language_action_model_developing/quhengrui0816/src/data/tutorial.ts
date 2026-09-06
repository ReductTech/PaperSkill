/* 教程结构地图：9 幕章节与 10 个交互模块的索引。
   页面实际渲染由 src/App.tsx 按 DECK_ORDER 分节调度（PPT 模式），
   本文件是同一套结构的机器可读清单，componentId 与
   src/modules/registry.tsx 中的注册键一一对应。 */

import type { TutorialData } from "../types";

export const tutorial: TutorialData = {
  meta: {
    titleEn: "StarVLA: A Lego-like Codebase for Vision-Language-Action Model Developing",
    titleZh: "StarVLA：乐高式的视觉-语言-动作模型开发代码库",
    venue: "arXiv 2026 · cs.RO",
    paperUrl: "https://arxiv.org/abs/2604.05014",
    coreProblem:
      "VLA 研究割裂在互不兼容的架构、代码库和评测协议里：想法无法直接对比，结果无法复现，组件无法复用。",
    coreInsight:
      "用两份契约（骨干对内统一 hidden states、动作头对外统一 predict_action）把 VLA 研发变成搭乐高：骨干随便换、动作头随便插、多个基准一套接口测。",
  },
  chapters: [
    {
      kind: "chapter",
      id: "act-01-babel",
      act: "01",
      title: "巴比塔之痛",
      question: "同一个梦想，为什么被割裂在互不兼容的代码库里？",
      modules: [
        {
          kind: "module",
          id: "babel-lab",
          title: "积木拼装实验：跨阵营接口对不上",
          componentId: "babel-lab",
          autoplay: true,
        },
      ],
    },
    {
      kind: "chapter",
      id: "act-02c-matrix",
      act: "02",
      title: "能力总览",
      question: "和现有框架摆在一起，StarVLA 多出了什么？",
      modules: [
        {
          kind: "module",
          id: "matrix-table",
          title: "Table 1 能力矩阵逐格打勾",
          componentId: "matrix-table",
          autoplay: true,
        },
      ],
    },
    {
      kind: "chapter",
      id: "act-03-solution",
      act: "03",
      title: "乐高式解法（03A 两份契约 / 03B 亲手拼一台）",
      question: "两份契约如何把模型、数据、训练解耦？",
      modules: [
        {
          kind: "module",
          id: "contract-flow",
          title: "契约数据流动画：观测流入到动作块蹦出",
          componentId: "contract-flow",
          autoplay: true,
        },
        {
          kind: "module",
          id: "lego-builder",
          title: "拼装台：四种动作头轮插并显示实测成绩",
          componentId: "lego-builder",
          autoplay: true,
        },
      ],
    },
    {
      kind: "chapter",
      id: "act-03-formula",
      act: "04",
      title: "一个公式",
      question: "所有范式如何写进同一个预测目标？",
      modules: [
        {
          kind: "module",
          id: "formula-switch",
          title: "统一公式 π(a,y_aux|x,l) 三种范式轮播",
          componentId: "formula-switch",
          autoplay: true,
        },
      ],
    },
    {
      kind: "chapter",
      id: "act-04-heads",
      act: "05",
      title: "动作头剧场",
      question: "四种动作头在同一个骨干上各自怎么干活？",
      modules: [
        {
          kind: "module",
          id: "head-theater",
          title: "FAST 逐 token / OFT 并行回归 / π 去噪 / GR00T 双系统",
          componentId: "head-theater",
          autoplay: true,
        },
      ],
    },
    {
      kind: "chapter",
      id: "act-06-deploy",
      act: "06",
      title: "评测部署",
      question: "一套接口如何通吃所有考场？",
      modules: [
        {
          kind: "module",
          id: "server-client",
          title: "Server-Client 推理循环，轮转四个考场",
          componentId: "server-client",
          autoplay: true,
        },
      ],
    },
    {
      kind: "chapter",
      id: "act-07-recipe",
      act: "07",
      title: "训练配方（07A 配方清单 / 07B 遗忘实验）",
      question: "配方在工程上长什么样？只练动作为什么会学差？",
      modules: [
        {
          kind: "module",
          id: "yaml-mixer",
          title: "YAML 配方调台：拨开关实时生成训练配置",
          componentId: "yaml-mixer",
          autoplay: true,
        },
        {
          kind: "module",
          id: "forgetting-lab",
          title: "遗忘实验：只练动作 vs 多模态共训曲线",
          componentId: "forgetting-lab",
          autoplay: true,
        },
      ],
    },
    {
      kind: "chapter",
      id: "act-07-data",
      act: "08",
      title: "数据说话",
      question: "30K 步复现 SOTA、专才通才、256 卡扩展，数字怎么说？",
      modules: [
        {
          kind: "module",
          id: "results-lab",
          title: "效率 / 专才通才 / 扩展曲线三组实验图表",
          componentId: "results-lab",
          autoplay: true,
        },
      ],
    },
    {
      kind: "chapter",
      id: "act-08-end",
      act: "09",
      title: "收束",
      question: "这一幕落幕，你只记住哪三件事？",
      modules: [],
    },
  ],
};
