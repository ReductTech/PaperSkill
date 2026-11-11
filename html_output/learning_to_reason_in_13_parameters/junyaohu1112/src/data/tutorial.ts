import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning to Reason in 13 Parameters",
    "titleZh": "TinyLoRA 测试导读",
    "venue": "Morris et al. · arXiv:2602.04118 · 2026",
    "authors": "John X. Morris, Niloofar Mireshghallah, Mark Ibrahim, Saeed Mahloujifar",
    "affiliation": "",
    "domain": "大模型推理与参数高效微调",
    "coreProblem": "常规 LoRA 的规模无法低于模型维度，学推理是否连 rank=1 都不需要？",
    "coreInsight": "【仅用于测试】这是为减论 App 测试准备的一页测试页，内容只取自论文摘要，未经人工核验，不是完整教程。",
    "keywords": ["TinyLoRA", "强化学习"]
  },
  "hero": {
    "oldMethod": {
      "title": "TinyLoRA 是什么",
      "desc": "把低秩适配器缩小到最少一个参数",
      "componentId": "abstract-note"
    },
    "newMethod": {
      "title": "摘要报告的结果",
      "desc": "极少参数下的推理表现",
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
