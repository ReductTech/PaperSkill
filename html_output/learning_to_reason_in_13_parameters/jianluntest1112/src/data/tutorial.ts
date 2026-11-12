import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning to Reason in 13 Parameters",
    "titleZh": "TinyLoRA 测试导读 1/5：问题：LoRA 能多小",
    "venue": "Morris et al. · arXiv:2602.04118 · 2026",
    "authors": "John X. Morris, Niloofar Mireshghallah, Mark Ibrahim, Saeed Mahloujifar",
    "affiliation": "",
    "domain": "大模型推理与参数高效微调",
    "coreProblem": "常规 LoRA 的规模无法低于模型维度，学推理是否连 rank=1 都不需要？",
    "coreInsight": "【仅用于测试】减论 App A18 测试数据（第 1/5 份），内容只取自论文摘要，未经人工核验，不是完整教程。",
    "keywords": ["TinyLoRA", "强化学习"]
  },
  "hero": {
    "oldMethod": {
      "title": "常规 LoRA 的下限",
      "desc": "规模无法低于模型维度",
      "componentId": "abstract-note"
    },
    "newMethod": {
      "title": "本文的问题",
      "desc": "学推理是否连 rank=1 都不需要",
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
