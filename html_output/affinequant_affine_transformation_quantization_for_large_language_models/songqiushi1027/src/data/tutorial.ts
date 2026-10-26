import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "AffineQuant: Affine Transformation Quantization for Large Language Models",
    "titleZh": "AffineQuant：大语言模型的仿射变换量化",
    "venue": "ICLR 2024",
    "authors": "Yuexiao Ma, Huixia Li, Xiawu Zheng, et al.",
    "affiliation": "厦门大学 · 字节跳动",
    "domain": "大语言模型 / 后训练量化 (PTQ) / 优化",
    "coreProblem": "低比特量化下，仅靠缩放或旋转的等价变换优化空间太窄，量化误差大。",
    "coreInsight": "把 PTQ 等价变换推广到一般可逆仿射矩阵 A（缩放＋平移＋旋转），在校准数据上以 block 输出 MSE 学习，并靠对角支配与渐进掩码保证可逆。",
    "keywords": [
      "PTQ",
      "仿射变换",
      "W4A4",
      "渐进掩码",
      "Lévy–Desplanques"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "仅缩放（SmoothQuant）",
      "desc": "只调每个通道的缩放，低比特下幅度仍失调，量化误差大。",
      "componentId": "cover-old"
    },
    "newMethod": {
      "title": "一般仿射变换（AffineQuant）",
      "desc": "同时缩放、平移、旋转，保持输出不变却大幅降低量化误差。",
      "componentId": "cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "低比特量化的误差与等价变换",
      "modules": [
        {
          "kind": "module",
          "id": "eq-transform",
          "title": "等价变换",
          "desc": "拖动缩放、平移、旋转，观察输出不变而量化误差可调。",
          "componentId": "eq-transform"
        }
      ],
      "scenes": [
        {
          "id": "ch1-equiv",
          "title": "等价变换：输出不变，误差可调",
          "goal": "改变 X 和 W 的表示，能否在不损坏输出 Y 的前提下降低量化误差？",
          "summary": "等价变换在 A 可逆时保持线性层输出不变：Y = XW = (XA⁻¹)(AW)。",
          "interaction": "拖动缩放 s、平移 t、旋转 θ 三个滑块",
          "next": "旧方法的变换空间为何受限",
          "notes": "来源：卡片 §核心方法·关键思路（等效性）。量化误差读数为示意映射，非论文实测；论文实际以 block 输出 MSE 为准。类比边界：相机缩放/平移/旋转=仿射 A 的 s/t/θ，被摄主体不变=Y 恒等。",
          "componentId": "eq-transform",
          "moduleId": "eq-transform"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "旧方法为何不够用",
      "modules": [
        {
          "kind": "module",
          "id": "limited-transforms",
          "title": "受限的等价变换族",
          "desc": "点选四种变换，观察矩阵结构与自由度的差异。",
          "componentId": "limited-transforms"
        }
      ],
      "scenes": [
        {
          "id": "ch2-limited",
          "title": "受限的等价变换族",
          "goal": "已有方法（SmoothQuant / OmniQuant / RPTQ / QuaRot）各自被锁在多小的空间里？",
          "summary": "对角、置换、正交都是可逆仿射的严格子集，自由度受限。",
          "interaction": "点选四种变换观察矩阵结构",
          "next": "一般仿射恰好同时具备缩放、平移、旋转",
          "notes": "来源：卡片 §等价变换演进 + §与其它方法对比。相对误差条为示意比较，不引用精确论文数值。",
          "componentId": "limited-transforms",
          "moduleId": "limited-transforms"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "一般仿射变换：缩放＋平移＋旋转",
      "modules": [
        {
          "kind": "module",
          "id": "affine-freedom",
          "title": "仿射的三类自由度",
          "desc": "勾选缩放、平移、旋转，观察矩阵结构与自由度的变化。",
          "componentId": "affine-freedom"
        }
      ],
      "scenes": [
        {
          "id": "ch3-affine",
          "title": "仿射矩阵同时缩放、平移、旋转",
          "goal": "一般仿射为什么是缩放＋平移＋旋转的组合？自由度有多少？",
          "summary": "缩放=对角、旋转=反对称非对角、平移=δ 向量，三者共同构成自由度最高的一般仿射。",
          "interaction": "勾选缩放 / 平移 / 旋转三个开关",
          "next": "怎样保证 A 在训练中始终可逆",
          "notes": "来源：卡片 §关键思路（仿射=缩放+平移+旋转，对比 QuaRot/SpinQuant 只有旋转、SmoothQuant 只有缩放）。自由度计数为示意。",
          "componentId": "affine-freedom",
          "moduleId": "affine-freedom"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "可逆保证：严格对角支配",
      "modules": [
        {
          "kind": "module",
          "id": "diag-dominant",
          "title": "对角支配让矩阵必可逆",
          "desc": "修改 2×2 矩阵元素，观察对角支配、行列式与可逆灯。",
          "componentId": "diag-dominant"
        }
      ],
      "scenes": [
        {
          "id": "ch4-diag",
          "title": "对角支配让矩阵必可逆",
          "goal": "训练中 A 怎么会变不可逆？怎么兜住？",
          "summary": "严格对角支配矩阵必可逆（Lévy–Desplanques 定理），论文以此兜底：初始化仅设对角。",
          "interaction": "用 + / − 修改 2×2 矩阵元素",
          "next": "如何安全地逐步解冻非对角元素",
          "notes": "来源：卡片 §保证可逆（定义1 + Lévy–Desplanques + 初始化仅设对角）。严格对角支配是充分非必要条件，这是数学事实。",
          "componentId": "diag-dominant",
          "moduleId": "diag-dominant"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "渐进掩码：逐步解冻",
      "modules": [
        {
          "kind": "module",
          "id": "gradual-mask",
          "title": "渐进掩码 GM 与稳定因子 α",
          "desc": "拖动 epoch 与 α，观察掩码带宽与可逆状态。",
          "componentId": "gradual-mask"
        }
      ],
      "scenes": [
        {
          "id": "ch5-mask",
          "title": "渐进掩码：逐步解冻非对角",
          "goal": "怎样安全地把非对角元素解冻出来又不破坏可逆？",
          "summary": "GM 随 epoch 逐步放宽对角带、α 控制带内幅度，逐带解冻。",
          "interaction": "拖动 epoch 与 α 滑块",
          "next": "拿什么当损失：block 输出 MSE",
          "notes": "来源：卡片 §渐进式掩码（式6）+ 源码 affinequant.py（qkvmask_num）。带宽按 h=12 示意，非论文真实 hidden_size；崩溃条件为示意。",
          "componentId": "gradual-mask",
          "moduleId": "gradual-mask"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "优化目标与统一性",
      "modules": [
        {
          "kind": "module",
          "id": "affine-specials",
          "title": "前人的方法都是仿射特例",
          "desc": "切换约束观察矩阵退化，理解统一性。",
          "componentId": "affine-specials"
        }
      ],
      "scenes": [
        {
          "id": "ch6-mse",
          "title": "block 输出 MSE 即优化目标",
          "goal": "用什么损失来优化仿射变换？",
          "summary": "最小化量化前后 Transformer Block 输出激活的 MSE，等价于优化 PPL。",
          "interaction": "阅读公式与示意损失曲线",
          "next": "前人的方法都是仿射的特例",
          "notes": "来源：卡片 §核心方法·优化目标 + 图2。损失曲线为示意估算，非原始图2；参考 LLaMA-7B 最后 block 约 40 epoch、OPT-1.3B 约 20 epoch。",
          "componentId": "block-mse"
        },
        {
          "id": "ch6-specials",
          "title": "前人的方法都是仿射特例",
          "goal": "OmniQuant / RPTQ / 旋转与本方法是什么关系？",
          "summary": "只保留对角=OmniQuant，置换矩阵=RPTQ，逐行归一=旋转，都是仿射的受约束特例。",
          "interaction": "切换约束观察矩阵退化",
          "next": "效果如何：W4A4 精度提升",
          "notes": "来源：卡片 §统一性。约束对应：只对角→OmniQuant、置换→RPTQ、逐行归一→SpinQuant/QuaRot。",
          "componentId": "affine-specials",
          "moduleId": "affine-specials"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "结果与局限",
      "modules": [
        {
          "kind": "module",
          "id": "stability-alpha",
          "title": "α 的敏感性与适用边界",
          "desc": "拖动 α（对数），观察退化/稳定/崩溃区间。",
          "componentId": "stability-alpha"
        }
      ],
      "scenes": [
        {
          "id": "ch7-results",
          "title": "W4A4 刷新 SOTA",
          "goal": "AffineQuant 到底带来多大收益？",
          "summary": "W4A4 下 PPL 与 zero-shot 均优于 OmniQuant，推理无额外开销。",
          "interaction": "阅读结果柱状图",
          "next": "α 的代价与适用边界",
          "notes": "来源：卡片 §关键实验数据。PPL 越低越好、zero-shot 准确率越高越好；与 OmniQuant 同协议对比。低比特与小模型收益最大。",
          "componentId": "results-bars"
        },
        {
          "id": "ch7-alpha",
          "title": "α 的敏感性与适用边界",
          "goal": "α 该怎么选？代价是什么？",
          "summary": "α 过小退化、过大会崩溃；且本方法排除 MLP 中间层、求逆有数值误差。",
          "interaction": "拖动 α（对数）滑块",
          "next": "（教程结尾）",
          "notes": "来源：卡片 §消融(4.3) + §原文（α 集合）+ §实现（--sf 0.1；LLaMA shift=0）。PPL 曲线为示意趋势，精确值以论文为准。",
          "componentId": "stability-alpha",
          "moduleId": "stability-alpha"
        }
      ]
    }
  ]
};
