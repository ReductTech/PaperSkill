import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "OVOD-Agent: A Markov-Bandit Framework for Proactive Visual Reasoning and Self-Evolving Detection",
    "titleZh": "OVOD-Agent：从固定匹配到主动视觉推理",
    "venue": "CVPR 2026",
    "authors": "Chujie Wang · Jianyu Lu · Zhiyuan Luo · Xi Chen · Chu He",
    "affiliation": "武汉大学",
    "domain": "开放词汇目标检测",
    "coreProblem": "只靠固定类别名匹配，难以处理罕见类别与视觉歧义。",
    "coreInsight": "先探索可解释视觉动作，再用轻量模型学习如何逐步修正上下文。",
    "keywords": [
      "Visual-CoT",
      "w-MDP",
      "UCB",
      "Markov–Bandit",
      "奖励策略模型"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "固定名称匹配",
      "desc": "只凭“背包”查找，缺少当前图像的属性线索。",
      "componentId": "cover-old"
    },
    "newMethod": {
      "title": "主动修正上下文",
      "desc": "检查颜色、纹理与空间线索，逐步改进描述。",
      "componentId": "cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从固定类别名转向上下文修正",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "从固定类别名转向上下文修正",
          "desc": "示意不运行检测器",
          "componentId": "ovod-query"
        }
      ],
      "scenes": [
        {
          "id": "scene-1",
          "title": "从固定类别名转向上下文修正",
          "goal": "为什么只改类别名不够？",
          "summary": "从固定类别名转向上下文修正",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "七种可解释动作",
          "notes": "§3.1。示意不运行检测器。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-query",
          "moduleId": "1.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "七种可解释动作",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "七种可解释动作",
          "desc": "动作数与摘要八状态空间不可混为一谈",
          "componentId": "ovod-operators"
        }
      ],
      "scenes": [
        {
          "id": "scene-2",
          "title": "七种可解释动作",
          "goal": "一次视觉动作实际改变什么？",
          "summary": "七种可解释动作",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "Dirichlet 伪计数更新",
          "notes": "§3.1 Table 1。动作数与摘要八状态空间不可混为一谈。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-operators",
          "moduleId": "2.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "Dirichlet 伪计数更新",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "Dirichlet 伪计数更新",
          "desc": "三个后继仅为教学子集",
          "componentId": "ovod-markov"
        }
      ],
      "scenes": [
        {
          "id": "scene-3",
          "title": "Dirichlet 伪计数更新",
          "goal": "转移记录如何变成概率？",
          "summary": "Dirichlet 伪计数更新",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "UCB 平衡均值和探索",
          "notes": "§3.2 Eq.8; §3.3 Eq.11。三个后继仅为教学子集。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-markov",
          "moduleId": "3.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "UCB 平衡均值和探索",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "UCB 平衡均值和探索",
          "desc": "固定玩具均值与次数",
          "componentId": "ovod-ucb"
        }
      ],
      "scenes": [
        {
          "id": "scene-4",
          "title": "UCB 平衡均值和探索",
          "goal": "什么时候值得试一件不熟悉的工具？",
          "summary": "UCB 平衡均值和探索",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "1−IoU 是初始不确定性",
          "notes": "§3.3 Eq.9–10。固定玩具均值与次数。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-ucb",
          "moduleId": "4.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "1−IoU 是初始不确定性",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "1−IoU 是初始不确定性",
          "desc": "不能把大值说成定位更准",
          "componentId": "ovod-reward"
        }
      ],
      "scenes": [
        {
          "id": "scene-5",
          "title": "1−IoU 是初始不确定性",
          "goal": "奖励信号的方向能否读反？",
          "summary": "1−IoU 是初始不确定性",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "三项 RM 损失",
          "notes": "§3.2 Eq.7; Algorithm 1。不能把大值说成定位更准。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-reward",
          "moduleId": "5.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "三项 RM 损失",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "三项 RM 损失",
          "desc": "固定分项用于权重演示",
          "componentId": "ovod-distill"
        }
      ],
      "scenes": [
        {
          "id": "scene-6",
          "title": "三项 RM 损失",
          "goal": "采样记录如何变成部署模型？",
          "summary": "三项 RM 损失",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "RM 替代 UCB 部署",
          "notes": "§3.4 Eq.14。固定分项用于权重演示。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-distill",
          "moduleId": "6.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "RM 替代 UCB 部署",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "RM 替代 UCB 部署",
          "desc": "混合为可选，默认策略驱动",
          "componentId": "ovod-inference"
        }
      ],
      "scenes": [
        {
          "id": "scene-7",
          "title": "RM 替代 UCB 部署",
          "goal": "不做在线探索，怎样选择下一步？",
          "summary": "RM 替代 UCB 部署",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "GroundingDINO 指标与时间",
          "notes": "§3.5 Eq.15。混合为可选，默认策略驱动。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-inference",
          "moduleId": "7.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "GroundingDINO 指标与时间",
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "GroundingDINO 指标与时间",
          "desc": "LVIS val 30.2→32.9; minival35.4→37.0; COCO52.8→54.1; +120ms",
          "componentId": "ovod-evidence"
        }
      ],
      "scenes": [
        {
          "id": "scene-8",
          "title": "GroundingDINO 指标与时间",
          "goal": "精度提升是否值得额外耗时？",
          "summary": "GroundingDINO 指标与时间",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "两种失败模式",
          "notes": "§4.1 Table 2。LVIS val 30.2→32.9; minival35.4→37.0; COCO52.8→54.1; +120ms。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-evidence",
          "moduleId": "8.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "两种失败模式",
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "两种失败模式",
          "desc": "非典型外观、小物体与遮挡",
          "componentId": "ovod-failure"
        }
      ],
      "scenes": [
        {
          "id": "scene-9",
          "title": "两种失败模式",
          "goal": "什么情况下越推理越可能误判？",
          "summary": "两种失败模式",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "预算一致的后续实验",
          "notes": "§4.3。非典型外观、小物体与遮挡。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-failure",
          "moduleId": "9.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "预算一致的后续实验",
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "预算一致的后续实验",
          "desc": "未做复现，不作论文已完成实验",
          "componentId": "ovod-plan"
        }
      ],
      "scenes": [
        {
          "id": "scene-10",
          "title": "预算一致的后续实验",
          "goal": "怎样把个人疑问变成可测量的实验？",
          "summary": "预算一致的后续实验",
          "interaction": "操作本页控件，比较输入变化及中间结果。",
          "next": "回看方法与适用边界",
          "notes": "§4.3 + 个人分析。未做复现，不作论文已完成实验。统一使用失物招领类比，不代表真实检测结果。",
          "componentId": "ovod-plan",
          "moduleId": "10.1"
        }
      ]
    }
  ]
};
