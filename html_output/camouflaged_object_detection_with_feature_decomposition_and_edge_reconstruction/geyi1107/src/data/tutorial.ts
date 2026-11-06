import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Camouflaged Object Detection with Feature Decomposition and Edge Reconstruction",
    "titleZh": "伪装目标检测：特征分解与边缘重建",
    "venue": "CVPR '23 · 论文交互教程",
    "authors": "Chunming He, Kai Li, Yachao Zhang, Longxiang Tang, Yulun Zhang, Zhenhua Guo, Xiu Li",
    "affiliation": "清华大学深圳国际研究生院 · NEC Laboratories America · ETH Zurich · 天翼交通科技",
    "domain": "计算机视觉 · 伪装目标检测与分割",
    "coreProblem": "伪装目标与背景内在相似（IS）时难以定位，边缘受扰（ED）时难以得到准确轮廓。",
    "coreInsight": "FEDER 用可学习小波式滤波分解高低频特征，筛出有用线索，并以 ODE 启发式边缘重建辅助生成清晰分割边界。",
    "keywords": [
      "伪装目标检测",
      "深度小波式分解",
      "频率注意力",
      "引导式特征聚合",
      "边缘重建"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "只靠常规视觉特征",
      "desc": "相似颜色先把目标位置藏起来，模糊边界也缺少额外复核线索。",
      "componentId": "feder-cover"
    },
    "newMethod": {
      "title": "FEDER：特征分解 + 边缘重建",
      "desc": "拆开高低频并筛出判别线索，再用边缘辅助把轮廓补回来。",
      "componentId": "feder-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "伪装目标的两道难题",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "相似性与边缘受扰",
          "desc": "区分定位失败与边界模糊两种挑战。",
          "componentId": "feder-challenge"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "深度小波式分解",
          "desc": "观察高频纹理与低频全局线索如何互补。",
          "componentId": "feder-dwd"
        }
      ],
      "scenes": [
        {
          "id": "s2-challenge",
          "title": "相似性与边缘受扰",
          "goal": "看不清目标，可能是定位或边界的不同困难。",
          "summary": "拖动相似度，观察定位置信与边界线索分开变化。",
          "interaction": "拖动相似度并切换边缘受扰。",
          "next": "再看特征怎样被拆分。",
          "notes": "依据 p.1 Abstract 与 §1。场景是概念示意，不能当作论文样例或定量阈值。",
          "componentId": "feder-challenge",
          "moduleId": "1.1"
        },
        {
          "id": "s3-dwd",
          "title": "深度小波式分解",
          "goal": "高频细节与低频全局信息提供不同线索。",
          "summary": "切换频段，比较纹理和颜色分布对伪装目标的提示。",
          "interaction": "选择高频、低频或并看。",
          "next": "进入频率注意力和跨尺度聚合。",
          "notes": "依据 p.4 §3.2.1 Eq.(1)。learnable filters initialized by Haar; toy cue scores are illustrative, not a paper metric. The flashlight is only an analogy, not an optical transform.",
          "componentId": "feder-dwd",
          "moduleId": "1.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "频率注意力与引导聚合",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "HFA、LFA 与 GFA",
          "desc": "选择频率分支并调整注意力引导，观察跨尺度聚合。",
          "componentId": "feder-attention"
        }
      ],
      "scenes": [
        {
          "id": "s4-attention",
          "title": "HFA、LFA 与 GFA",
          "goal": "不同频段需要不同注意力，再由引导聚合连起尺度信息。",
          "summary": "切换高低频分支并调节引导强度，观察注意区域和聚合系数变化。",
          "interaction": "选择 HFA/LFA 并拖动引导强度。",
          "next": "看边缘分支如何更新轮廓。",
          "notes": "依据 pp.4-5 §3.2.2-3.2.3 Eqs.(2)-(7), Fig.3。Bars and leaf texture are conceptual encodings, not measured attention maps.",
          "componentId": "feder-attention",
          "moduleId": "2.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "边缘重建与联合监督",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "ODE 启发式边缘重建",
          "desc": "比较一阶更新与带门控的 RK2 边缘状态更新。",
          "componentId": "feder-oer"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "分割与边缘的联合损失",
          "desc": "在透明玩具例子中观察两类监督的作用。",
          "componentId": "feder-loss"
        }
      ],
      "scenes": [
        {
          "id": "s5-oer",
          "title": "ODE 启发式边缘重建",
          "goal": "高阶更新与可学习门控用于更细致地重建边缘特征。",
          "summary": "逐步更新轮廓状态，比较 Euler 与 gated RK2 的示意路径。",
          "interaction": "选择更新器并点击推进一步。",
          "next": "边缘任务怎样与分割一起训练？",
          "notes": "依据 p.5 §3.3.2 Eqs.(11)-(12), Fig.4。Contour states are a toy numerical illustration, not measured edge errors.",
          "componentId": "feder-oer",
          "moduleId": "3.1"
        },
        {
          "id": "s6-loss",
          "title": "分割与边缘的联合损失",
          "goal": "分割监督与边缘辅助监督共同约束多尺度输出。",
          "summary": "调整玩具掩码与边缘质量，理解分割损失和边缘损失各自负责什么。",
          "interaction": "拖动分割与边缘质量滑块。",
          "next": "对照论文数据检查组件证据。",
          "notes": "依据 p.6 §3.4 Eq.(14)。Toy loss is explicitly illustrative; the displayed paper equation uses weighted BCE/IoU and Dice with level weights.",
          "componentId": "feder-loss",
          "moduleId": "3.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "实验结果与组件消融",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "四个基准上的结果",
          "desc": "按数据集和指标读取 Table 1 的同协议结果。",
          "componentId": "feder-results"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "DWD 与 OER 消融",
          "desc": "对照 Table 2 中去除组件与完整模型的实测值。",
          "componentId": "feder-ablation"
        }
      ],
      "scenes": [
        {
          "id": "s7-results",
          "title": "四个基准上的结果",
          "goal": "在相同评估设置内比较指标，并区分指标方向。",
          "summary": "切换数据集与指标，读取 FEDER-R50 和基线的 Table 1 实测值。",
          "interaction": "选择数据集和指标。",
          "next": "再看 DWD 与 OER 的消融结果。",
          "notes": "Exact values from p.6 Table 1. Show the common single-scale/single-stage setting separately from MIS/MS. M is lower-is-better; Fβ/Eφ/Sα are higher-is-better.",
          "componentId": "feder-results",
          "moduleId": "4.1"
        },
        {
          "id": "s8-ablation",
          "title": "DWD 与 OER 消融",
          "goal": "在论文报告的消融协议内检查组件证据。",
          "summary": "切换 DWD/OER 分支，对照 Table 2 的去除组件与完整模型。",
          "interaction": "切换分支并选择测试集。",
          "next": "最后看适用条件与代价。",
          "notes": "Exact values from p.8 Table 2(a)(b), on COD10K-Test and NC4K. Ablations support reported component effects but do not establish universal causal guarantees.",
          "componentId": "feder-ablation",
          "moduleId": "4.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "适用条件与代价",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "挑战对应的机制与边界",
          "desc": "把 IS、ED 与计算/数据条件映射回方法，并选择对应修复路径。",
          "componentId": "feder-boundary"
        }
      ],
      "scenes": [
        {
          "id": "s9-boundary",
          "title": "挑战对应的机制与边界",
          "goal": "方法选择要对应具体挑战，同时牢记论文设置和计算条件。",
          "summary": "选择相似性、边界或计算条件，再调用对应机制复核。",
          "interaction": "选择挑战并按下复核。",
          "next": "",
          "notes": "Evidence from pp.6-8 §4.1-4.3, Table 1/2 and p.8 conclusion. Training uses COD10K 3040 + CAMO 1000; NC4K is evaluation only; images resized to 384×384; implementation uses two RTX3090Ti. Do not generalize beyond these conditions.",
          "componentId": "feder-boundary",
          "moduleId": "5.1"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "s2-challenge": "./thumbnails/s2-challenge.png",
    "s3-dwd": "./thumbnails/s3-dwd.png?v=1106b",
    "s4-attention": "./thumbnails/s4-attention.png?v=1106b",
    "s5-oer": "./thumbnails/s5-oer.png?v=1106b",
    "s6-loss": "./thumbnails/s6-loss.png?v=1106b",
    "s7-results": "./thumbnails/s7-results.png?v=1106b",
    "s8-ablation": "./thumbnails/s8-ablation.png",
    "s9-boundary": "./thumbnails/s9-boundary.png?v=1106b"
  }
};
