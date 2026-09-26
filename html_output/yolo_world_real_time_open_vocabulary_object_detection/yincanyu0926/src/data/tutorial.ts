import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "YOLO-World: Real-Time Open-Vocabulary Object Detection",
    "titleZh": "YOLO-World：开放词汇检测如何实时运行",
    "venue": "CVPR 2024 · 正式论文版",
    "authors": "Tianheng Cheng、Lin Song、Yixiao Ge、Wenyu Liu、Xinggang Wang、Ying Shan",
    "affiliation": "腾讯 AI Lab / ARC Lab · 华中科技大学",
    "domain": "开放词汇目标检测 · 高效部署",
    "coreProblem": "怎样兼顾自定义词表与低延迟检测？",
    "coreInsight": "预训练连接区域与文字，部署前编码词表，并用可重参数化结构减少重复计算。",
    "keywords": [
      "离线词表",
      "RepVL-PAN",
      "区域—文本对齐",
      "速度与精度"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "每张图都重复编码同一组文字，会产生重复成本。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "先把用户词表编码并准备好，再让检测器连续处理图像。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "词表之外的目标，怎样找到",
      "badge": "inf",
      "badgeLabel": "机制与证据",
      "bridge": "点击候选物品标签；选中词表与场景框同时变化。本章要辨认：词表空时零框；加入杯子钟表盆栽后逐个出现；规则匹配不是真实推理。",
      "analogy": {
        "title": "静物摄影：框选",
        "text": "摄影师框选一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "编辑拍摄清单",
          "desc": "点击候选物品标签；选中词表与场景框同时变化。",
          "componentId": "vocab"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "给四图训练样本配词表",
          "desc": "选择正负名词并控制容量，观察漏掉正名词和超出预算的错误。",
          "componentId": "vocabulary-batch"
        }
      ],
      "insight": "词表空时零框；加入杯子钟表盆栽后逐个出现；规则匹配不是真实推理",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "词表之外的目标，怎样找到"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "点击候选物品标签；选中词表与场景框同时变化"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "词表空时零框；加入杯子钟表盆栽后逐个出现；规则匹配不是真实推理"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把文字与区域放进共同空间",
      "badge": "inf",
      "badgeLabel": "机制与证据",
      "bridge": "拖动二维对象向量端点，或数值输入角度；方向改变余弦及logit。本章要辨认：零向量归一化未定义；同向1、正交0、反向−1；αβ仅教学数值。",
      "analogy": {
        "title": "静物摄影：对焦",
        "text": "摄影师对焦一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "旋转语义方向",
          "desc": "拖动二维对象向量端点，或数值输入角度；方向改变余弦及logit。",
          "componentId": "cosine"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "相似度不变，为什么保留框变了",
          "desc": "调整仿射参数与筛选阈值，同时查看logit、sigmoid分数和保留框。",
          "componentId": "score-threshold"
        }
      ],
      "insight": "零向量归一化未定义；同向1、正交0、反向−1；αβ仅教学数值",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "把文字与区域放进共同空间"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "拖动二维对象向量端点，或数值输入角度；方向改变余弦及logit"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "零向量归一化未定义；同向1、正交0、反向−1；αβ仅教学数值"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先提示，再连续检测",
      "badge": "inf",
      "badgeLabel": "机制与证据",
      "bridge": "修改词表，生成缓存，单击拍下一帧；旧缓存状态禁止继续。本章要辨认：显示编码次数与帧数；词表改变须重建，旧词表不得默默复用。",
      "analogy": {
        "title": "静物摄影：锁定",
        "text": "摄影师锁定一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "为连拍准备词表",
          "desc": "修改词表，生成缓存，单击拍下一帧；旧缓存状态禁止继续。",
          "componentId": "cache"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "连拍的成本账本",
          "desc": "调整总帧数N与换词次数K，计算逐图编码与缓存编码的成本；成本常量人工构造，K≤N。",
          "componentId": "budget"
        }
      ],
      "insight": "显示编码次数与帧数；词表改变须重建，旧词表不得默默复用",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "先提示，再连续检测"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "修改词表，生成缓存，单击拍下一帧；旧缓存状态禁止继续"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "显示编码次数与帧数；词表改变须重建，旧词表不得默默复用"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "文本如何调节图像响应",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "编辑2×3原始点积矩阵；显示逐行max、sigmoid和乘后强度。本章要辨认：全零得0.5而非0；负值被抑制；不是softmax、不是概率检测结果。",
      "analogy": {
        "title": "静物摄影：补光",
        "text": "摄影师补光一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "照亮相关物体",
          "desc": "编辑2×3原始点积矩阵；显示逐行max、sigmoid和乘后强度。",
          "componentId": "gate"
        }
      ],
      "insight": "全零得0.5而非0；负值被抑制；不是softmax、不是概率检测结果",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "文本如何调节图像响应"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "编辑2×3原始点积矩阵；显示逐行max、sigmoid和乘后强度"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "全零得0.5而非0；负值被抑制；不是softmax、不是概率检测结果"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "图像怎样反过来补充文字",
      "badge": "inf",
      "badgeLabel": "机制与证据",
      "bridge": "点击4×4网格改变特征；显示每个2×2区块max得到4token。本章要辨认：教学4×4→2×2；真实三个尺度各3×3共27；显示选中块与获胜像素。",
      "analogy": {
        "title": "静物摄影：放大",
        "text": "摄影师放大一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "挑选局部细节",
          "desc": "点击4×4网格改变特征；显示每个2×2区块max得到4token。",
          "componentId": "pool"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "池化后如何更新文本",
          "desc": "选择一个文本查询，调整单个logit；用softmax分配27位置的简化3值示例，计算残差。",
          "componentId": "attention"
        }
      ],
      "insight": "教学4×4→2×2；真实三个尺度各3×3共27；显示选中块与获胜像素",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "图像怎样反过来补充文字"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "点击4×4网格改变特征；显示每个2×2区块max得到4token"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "教学4×4→2×2；真实三个尺度各3×3共27；显示选中块与获胜像素"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "固定词表怎样变成权重",
      "badge": "inf",
      "badgeLabel": "机制与证据",
      "bridge": "编辑2维图像向量；两路并排计算归一化文本点积与固定权重线性层。本章要辨认：修改文本后缓存失效、重新折叠恢复相等；不要折叠图像相关动态值。",
      "analogy": {
        "title": "静物摄影：调节",
        "text": "摄影师调节一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "锁定相机预设",
          "desc": "编辑2维图像向量；两路并排计算归一化文本点积与固定权重线性层。",
          "componentId": "reparam"
        }
      ],
      "insight": "修改文本后缓存失效、重新折叠恢复相等；不要折叠图像相关动态值",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "固定词表怎样变成权重"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "编辑2维图像向量；两路并排计算归一化文本点积与固定权重线性层"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "修改文本后缓存失效、重新折叠恢复相等；不要折叠图像相关动态值"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "哪些监督可以信任",
      "badge": "trn",
      "badgeLabel": "训练与机制",
      "bridge": "选择检测或图文样本，修改各损失项；条形图与总和变化。本章要辨认：图文样本回归项关闭；构造标量，不能声称训练日志或完整公式实现。",
      "analogy": {
        "title": "静物摄影：擦拭",
        "text": "摄影师擦拭一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "审校拍摄记录",
          "desc": "选择检测或图文样本，修改各损失项；条形图与总和变化。",
          "componentId": "loss"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "伪标注筛选也会出错",
          "desc": "调阈值并点击保留或删除，统计TP/FP/FN与精确率、召回率；空预测精确率未定义。",
          "componentId": "audit"
        }
      ],
      "insight": "图文样本回归项关闭；构造标量，不能声称训练日志或完整公式实现",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "哪些监督可以信任"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "选择检测或图文样本，修改各损失项；条形图与总和变化"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "图文样本回归项关闭；构造标量，不能声称训练日志或完整公式实现"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把结构与消融证据连起来",
      "badge": "trn",
      "badgeLabel": "训练与机制",
      "bridge": "点击结构节点同时查看输入输出形状、信息路径和局限。本章要辨认：YOLOv8骨干→多尺度RepVL→框及嵌入头；文本来自CLIP；非DINO查询。",
      "analogy": {
        "title": "静物摄影：换镜",
        "text": "摄影师换镜一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "切换镜头配置",
          "desc": "点击结构节点同时查看输入输出形状、信息路径和局限。",
          "componentId": "network"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "只比较论文报告的变体",
          "desc": "选择Table4确有记录的组合，显示AP和新增耗时；Table5展示CLIP冻结与微调反例。",
          "componentId": "ablation"
        }
      ],
      "insight": "YOLOv8骨干→多尺度RepVL→框及嵌入头；文本来自CLIP；非DINO查询",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "把结构与消融证据连起来"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "点击结构节点同时查看输入输出形状、信息路径和局限"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "YOLOv8骨干→多尺度RepVL→框及嵌入头；文本来自CLIP；非DINO查询"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "速度与精度，谁更适合任务",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "点击散点选择S/M/L与数据配置，切换原版/重参数化显示点位变化。本章要辨认：相同Table2协议；参数圈面积可比较；速度高不保证AP高。",
      "analogy": {
        "title": "静物摄影：连拍",
        "text": "摄影师连拍一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "对照拍摄成绩",
          "desc": "点击散点选择S/M/L与数据配置，切换原版/重参数化显示点位变化。",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "带着速度与参数预算选配置",
          "desc": "从Table2真实报告的实验点中筛选，观察可行配置与约束冲突。",
          "componentId": "model-choice"
        }
      ],
      "insight": "相同Table2协议；参数圈面积可比较；速度高不保证AP高",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "速度与精度，谁更适合任务"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "点击散点选择S/M/L与数据配置，切换原版/重参数化显示点位变化"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "相同Table2协议；参数圈面积可比较；速度高不保证AP高"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "读结论前，先检查条件",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "先回答证据挑战再展开原因，可重答；比较检测/分割指标。本章要辨认：Table6带TensorRT；Table8为mask AP；AP与APr不能互换。",
      "analogy": {
        "title": "静物摄影：盖章",
        "text": "摄影师盖章一个静物，让拍摄目标更明确。类比只解释准备、观察或比较动作；模型计算请看下方实验。",
        "componentId": "analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "检查成片标签",
          "desc": "先回答证据挑战再展开原因，可重答；比较检测/分割指标。",
          "componentId": "quiz"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "检测与分割的边界",
          "desc": "按Table6或8选择独立协议，图表展示真实报告数值，不连接成一条曲线。",
          "componentId": "transfer"
        }
      ],
      "insight": "Table6带TensorRT；Table8为mask AP；AP与APr不能互换",
      "takeaways": [
        {
          "icon": "◎",
          "title": "研究问题",
          "desc": "读结论前，先检查条件"
        },
        {
          "icon": "↔",
          "title": "可检验机制",
          "desc": "先回答证据挑战再展开原因，可重答；比较检测/分割指标"
        },
        {
          "icon": "✓",
          "title": "证据边界",
          "desc": "Table6带TensorRT；Table8为mask AP；AP与APr不能互换"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1bg9MY2EUN",
      "title": "YOLO 系列论文讲解（含 CVPR2024 YOLO-World）",
      "reason": "作为结构讲解补充，选择其中 YOLO-World 小节；数值与版本仍以本教程正式论文为准。"
    }
  ]
};
