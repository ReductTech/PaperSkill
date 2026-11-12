import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning to Reason in 13 Parameters",
    "titleZh": "TinyLoRA 测试导读 4/5：结果：更难的推理基准",
    "venue": "Morris et al. · arXiv:2602.04118 · 2026",
    "authors": "John X. Morris, Niloofar Mireshghallah, Mark Ibrahim, Saeed Mahloujifar",
    "affiliation": "",
    "domain": "大模型推理与参数高效微调",
    "coreProblem": "常规 LoRA 的规模无法低于模型维度，学推理是否连 rank=1 都不需要？",
    "coreInsight": "【仅用于测试】减论 App A18 测试数据（第 4/5 份），内容只取自论文摘要，未经人工核验，不是完整教程。",
    "keywords": ["TinyLoRA", "强化学习"]
  },
  "hero": {
    "oldMethod": {
      "title": "基准",
      "desc": "AIME、AMC、MATH500 等",
      "componentId": "abstract-note"
    },
    "newMethod": {
      "title": "结论",
      "desc": "少训 1000 倍参数仍保留大部分提升",
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
