import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Griffon: Spelling out All Object Locations at Any Granularity with Large Language Models",
    "titleZh": "Griffon：用大语言模型在任意粒度标出全部目标位置",
    "venue": "arXiv:2311.14552v3 · 2024",
    "authors": "Yufei Zhan, Yousong Zhu, Zhiyang Chen, Fan Yang, Ming Tang, Jinqiao Wang",
    "affiliation": "中国科学院自动化研究所 · 中国科学院大学 · 鹏城实验室 · 武汉人工智能研究院",
    "domain": "视觉语言 · 目标定位 · LVLM",
    "coreProblem": "现有 LVLM 多只能定位单个已存在目标，复杂多目标与拒识场景力不从心，常依赖专家模型或定制检测头。",
    "coreInsight": "用 Language-prompted Localization Dataset 与统一对话式坐标表示，训练纯 LVLM 基线 Griffon，按自由文本在任意粒度标出全部目标位置。",
    "keywords": [
      "Griffon",
      "LVLM",
      "Localization",
      "RefCOCO",
      "Flickr30K",
      "MSCOCO"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "单目标 / 外请专家",
      "desc": "只能框一个已存在目标，或调用专家头；多目标与拒识脆弱。",
      "componentId": "griffon-cover-old"
    },
    "newMethod": {
      "title": "Griffon 纯 LVLM",
      "desc": "统一对话式拼写全部 label-[坐标]，无特殊 token 与检测头。",
      "componentId": "griffon-cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 问题与四种定位场景",
      "modules": [
        {
          "kind": "module",
          "id": "m-limit",
          "title": "单目标模式的代价",
          "desc": "在单目标锁定下尝试框选，观察漏检。",
          "componentId": "griffon-limit"
        },
        {
          "kind": "module",
          "id": "m-four",
          "title": "四种语言提示场景",
          "desc": "切换四种简报，观察输出如何变化。",
          "componentId": "griffon-four"
        }
      ],
      "scenes": [
        {
          "id": "c1-limit",
          "title": "单目标模式的代价",
          "goal": "体验只允许一个框时，同场其他人如何被漏检。",
          "summary": "旧 LVLM 常被锁在「只框一个已存在目标」。",
          "interaction": "点击画面中的人物尝试框选；再点「需要全场景定位」看洞察。",
          "next": "认识四种语言提示定位场景",
          "notes": "出处：Abstract 与 Fig.1。类比边界：棚拍漏检示意不等于具体模型在某一张图上的实测输出。",
          "componentId": "griffon-limit",
          "moduleId": "m-limit"
        },
        {
          "id": "c1-four",
          "title": "四种语言提示场景",
          "goal": "按标签与目标数量理解 1vs1、1vsn、None、nvsn。",
          "summary": "真实使用可按四种场景划分定位任务。",
          "interaction": "点选四种拍摄简报，观察画面框与输出字符串。",
          "next": "了解 Language-prompted Localization Dataset",
          "notes": "出处：§3.1 Scenarios Analysis；Fig.1、Fig.3。None 场景应输出 None。1vs1 示例可无 label，§3.2 统一实现为 label-first。",
          "componentId": "griffon-four",
          "moduleId": "m-four"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · Language-prompted Localization Dataset",
      "modules": [
        {
          "kind": "module",
          "id": "m-dataset",
          "title": "数据集构成",
          "desc": "切换关注预训练与指令数据构成。",
          "componentId": "griffon-dataset"
        },
        {
          "kind": "module",
          "id": "m-brief",
          "title": "简报对应场景",
          "desc": "根据拍摄简报选择正确输出行为。",
          "componentId": "griffon-brief"
        }
      ],
      "scenes": [
        {
          "id": "c2-dataset",
          "title": "Language-prompted Localization Dataset",
          "goal": "弄清约 6M 预训练与约 900K 指令数据各自解决什么。",
          "summary": "数据覆盖四种场景与逾 76K 类别。",
          "interaction": "拖滑块在 REC / 检测 / 合计 6M / 指令 900K 等离散点之间跳转。",
          "next": "用简报练习场景判断",
          "notes": "出处：§3.1；贡献 1。预训练约 4M REC + 2M 检测；指令含 Flickr30K Entities 与 LVIS 负类。滑块只落在报告点。",
          "componentId": "griffon-dataset",
          "moduleId": "m-dataset"
        },
        {
          "id": "c2-brief",
          "title": "从拍摄简报到输出行为",
          "goal": "根据简报判断应输出单框、多框、None 还是多类拼接。",
          "summary": "指令样本把四场景写成贴近日常的表达。",
          "interaction": "抽一张简报并选择正确输出类型，查看即时对错反馈。",
          "next": "学习统一坐标拼写格式",
          "notes": "出处：Fig.3 样本。玩具问答，不代表模型准确率。",
          "componentId": "griffon-brief",
          "moduleId": "m-brief"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 统一表示与纯 LVLM 结构",
      "modules": [
        {
          "kind": "module",
          "id": "m-format",
          "title": "统一坐标拼写",
          "desc": "拖动框并即时生成 label-[x1,y1,x2,y2] 字符串。",
          "componentId": "griffon-format"
        },
        {
          "kind": "module",
          "id": "m-tokens",
          "title": "数值坐标 vs 特殊 token",
          "desc": "对比两种坐标表示并理解论文选择。",
          "componentId": "griffon-tokens"
        },
        {
          "kind": "module",
          "id": "m-arch",
          "title": "纯 LVLM 结构",
          "desc": "高亮 Visual Encoder / Projection / LLM，确认无检测头。",
          "componentId": "griffon-arch"
        }
      ],
      "scenes": [
        {
          "id": "c3-format",
          "title": "拼写出全部目标位置",
          "goal": "用统一格式把多个框写成一条自然语言坐标串。",
          "summary": "label-[x1,y1,x2,y2]，多目标用 & 连接。",
          "interaction": "拖动两个框的角点，观察输出字符串按 0.001 精度更新。",
          "next": "比较数值坐标与特殊 token",
          "notes": "出处：§3.2。玩具交互；真实推理由 LLM 自回归生成，不是拖拽导出。",
          "componentId": "griffon-format",
          "moduleId": "m-format"
        },
        {
          "id": "c3-tokens",
          "title": "数值字符坐标，而非特殊 token",
          "goal": "理解为何采用自然语言数字坐标、精度 0.001。",
          "summary": "特殊坐标 token 需从零训练，收敛更慢。",
          "interaction": "切换「数值字符 / 特殊 token」表示，阅读论文取舍。",
          "next": "查看与 LLaVA 一致的结构",
          "notes": "出处：§3.2；引用 Shikra 在 REC 上的比较结论。本页为教学示意，不重训模型。",
          "componentId": "griffon-tokens",
          "moduleId": "m-tokens"
        },
        {
          "id": "c3-arch",
          "title": "保持与流行 LVLM 一致的结构",
          "goal": "确认 Griffon 不引入检测头、专家模型或特殊 token。",
          "summary": "Visual Encoder + Projection + LLM，一次前向可输出多目标。",
          "interaction": "点击三个模块查看职责；对照「无额外检测头」。",
          "next": "进入两阶段训练流程",
          "notes": "出处：§3.2；Fig.2。实现：CLIP ViT-L/14 + LLaMA2-13B。",
          "componentId": "griffon-arch",
          "moduleId": "m-arch"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 两阶段训练与置信打分",
      "modules": [
        {
          "kind": "module",
          "id": "m-stages",
          "title": "渐进两阶段训练",
          "desc": "切换 Stage I / II，观察哪些模块在训练。",
          "componentId": "griffon-stages"
        },
        {
          "kind": "module",
          "id": "m-score",
          "title": "训练无关置信打分",
          "desc": "调节标签与定位概率，计算几何平均分数。",
          "componentId": "griffon-score"
        }
      ],
      "scenes": [
        {
          "id": "c4-stages",
          "title": "渐进两阶段训练流水线",
          "goal": "区分 Stage I 基础多目标预训练与 Stage II 全场景指令微调。",
          "summary": "Stage I 训练全网；Stage II 微调 LLM 与投影层。",
          "interaction": "切换 Stage I / II，观察火焰（可训）与雪花（冻结）标记。",
          "next": "理解训练无关打分",
          "notes": "出处：Fig.2；§3.3。Stage I 用约 6M；Stage II 用约 900K。初始化自 LLaVA。",
          "componentId": "griffon-stages",
          "moduleId": "m-stages"
        },
        {
          "id": "c4-score",
          "title": "训练无关的置信打分",
          "goal": "用标签与坐标条件概率的几何平均给多目标排序。",
          "summary": "score = p(R)^q × p_loc^(1-q)，论文取 q=0.5。",
          "interaction": "拖动 p_label 与 p_loc，观察 score 与排序提示变化。",
          "next": "查看 RefCOCO / Flickr 结果",
          "notes": "出处：§3.4 式 (1)–(4)；消融见表 5。本页为公式玩具计算；高/中/低分档阈值为教学示意，非论文阈值。",
          "componentId": "griffon-score",
          "moduleId": "m-score"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 证据、消融与边界",
      "modules": [
        {
          "kind": "module",
          "id": "m-rec",
          "title": "RefCOCO 与 Flickr 结果",
          "desc": "切换数据集查看已验证指标。",
          "componentId": "griffon-rec"
        },
        {
          "kind": "module",
          "id": "m-coco",
          "title": "MSCOCO 与 Faster R-CNN",
          "desc": "比较检测 mAP / APS。",
          "componentId": "griffon-coco"
        },
        {
          "kind": "module",
          "id": "m-qual",
          "title": "四场景定性对照",
          "desc": "对照 Qwen-VL、Grounding DINO 与 Griffon 在四场景的行为差异。",
          "componentId": "griffon-qual"
        },
        {
          "kind": "module",
          "id": "m-bound",
          "title": "消融修复与局限",
          "desc": "打开 Label-first 与打分，观察示意提升并阅读局限。",
          "componentId": "griffon-bound"
        }
      ],
      "scenes": [
        {
          "id": "c5-rec",
          "title": "RefCOCO 系列与 Flickr30K Entities",
          "goal": "阅读 Griffon 在指称与短语定位上的已报告结果。",
          "summary": "主比通用 LVLM；Griffon-13B* 为仅 REC 公平设置。",
          "interaction": "切换 RefCOCO / Flickr 视图，阅读柱状对比与成绩印章。",
          "next": "对照 MSCOCO 检测结果",
          "notes": "出处：Table 1–2。仅展示 RefCOCO val；Griffon-13B 89.4 与 Qwen 并列，* 为 90.1。Flickr ANY 领先，MERGED test 低于 Ferret 84.8。",
          "componentId": "griffon-rec",
          "moduleId": "m-rec"
        },
        {
          "id": "c5-coco",
          "title": "接近 Faster R-CNN 的检测能力",
          "goal": "在 MSCOCO val2017 上对照 Griffon 与同分辨率 Faster R-CNN。",
          "summary": "mAP 接近，APS 更高；先前 LVLM 几乎无法一次多类检测。",
          "interaction": "查看 mAP / APS 对比柱与曝光印章，阅读协议说明。",
          "next": "看 Fig.4 风格的四场景定性对照",
          "notes": "出处：Table 3；§4.4。Griffon-13B mAP 24.8 vs FRCNN-R50 26.3 @448；APS 5.9 vs 4.6。",
          "componentId": "griffon-coco",
          "moduleId": "m-coco"
        },
        {
          "id": "c5-qual",
          "title": "四场景定性对照",
          "goal": "对照专家模型与通用 LVLM，Griffon 如何覆盖四场景？",
          "summary": "定性示意：单目标之外，拒识与多类多目标是关键差异。",
          "interaction": "点选四种场景，比较 Qwen-VL / Grounding DINO / Griffon 的行为标签。",
          "next": "用消融修复并看局限",
          "notes": "出处：§4.6、Fig.4。本页为机制示意，不复现原图像素，也不是新 AP 表。",
          "componentId": "griffon-qual",
          "moduleId": "m-qual"
        },
        {
          "id": "c5-bound",
          "title": "消融修复与适用边界",
          "goal": "分别体验 Label-first 与置信打分，并记住局限。",
          "summary": "两表独立读数；工作仍主要聚焦定位。",
          "interaction": "分别开关 Label-first 与打分，对照表 4 / 表 5；阅读局限条。",
          "next": "",
          "notes": "出处：Table 4–5；§5。Coord-first 17.8 → Label-first 22.2；打分 20.9→23.2。禁止把两消融平均成单一指标。局限：主要聚焦定位任务。",
          "componentId": "griffon-bound",
          "moduleId": "m-bound"
        }
      ]
    }
  ]
};
