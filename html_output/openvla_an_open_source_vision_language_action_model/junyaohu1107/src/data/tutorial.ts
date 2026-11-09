import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "OpenVLA: An Open-Source Vision-Language-Action Model",
    "titleZh": "OpenVLA 测试导读",
    "venue": "Kim et al. · arXiv:2406.09246 · 2024",
    "authors": "Moo Jin Kim, Karl Pertsch, et al.",
    "affiliation": "",
    "domain": "机器人视觉-语言-动作模型",
    "coreProblem": "现有 VLA 大多封闭，也缺少针对新任务高效微调的方法。",
    "coreInsight": "这是用于验证多份导读显示和部署流程的一页测试页，内容只取自论文摘要，未经人工核验，不是完整教程。",
    "keywords": ["开源 VLA", "微调"]
  },
  "hero": {
    "oldMethod": {
      "title": "OpenVLA 是什么",
      "desc": "7B 参数的开源视觉-语言-动作模型",
      "componentId": "abstract-note"
    },
    "newMethod": {
      "title": "摘要报告的结果",
      "desc": "通用操作和微调两方面的对比",
      "componentId": "abstract-note"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "测试页",
      "modules": [],
      "scenes": []
    }
  ]
};
