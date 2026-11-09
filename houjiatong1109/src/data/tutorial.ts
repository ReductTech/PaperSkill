import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "chapters": [
    {
      "modules": [
        {
          "title": "选择方法，查看论文图1真实PSNR",
          "desc": "选择Bicubic、VDSR、SRResNet或EDSR+；数据来自DIV2K图像0853、×4示例。",
          "id": "1.1",
          "kind": "module",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "问题：从模糊小图重建",
        "text": "低分辨率输入只包含有限采样；插值能放大像素，却不保证恢复真实纹理。"
      },
      "bridge": "插值只能补像素，纹理必须由模型估计。 证据定位：第1页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "inf",
      "title": "从模糊小图到高分辨率",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "低分辨率输入只包含有限采样；插值能放大像素，却不保证恢复真实纹理。"
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "单张LR图像重建HR。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "示意图不代表论文测量值。"
        }
      ],
      "kind": "chapter",
      "id": "chap-1",
      "badgeLabel": "推理主线"
    },
    {
      "modules": [
        {
          "title": "切换倍率，观察输入通道与输出尺寸",
          "desc": "论文以LR/HR配对监督学习映射。 画面使用论文报告的数据或结构条件。",
          "id": "2.1",
          "kind": "module",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "输入表示：叠放 RGB 透明片",
        "text": "RGB三个通道在同一空间位置共同描述像素；倍率会改变输出的空间尺寸。"
      },
      "bridge": "论文以LR/HR配对监督学习映射。 证据定位：第2页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "inf",
      "title": "输入表示与重建路径",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "RGB三个通道在同一空间位置共同描述像素；倍率会改变输出的空间尺寸。"
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "RGB由三个同位通道组成。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "示意图不代表论文测量值。"
        }
      ],
      "kind": "chapter",
      "id": "chap-2",
      "badgeLabel": "推理主线"
    },
    {
      "modules": [
        {
          "title": "开关跳接，观察残差路径变化",
          "desc": "跳接让网络重点学习输入之外的残差信息。 画面使用论文报告的数据或结构条件。",
          "id": "3.1",
          "kind": "module",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "残差学习：补上一笔变化",
        "text": "保留输入主干，只学习需要补上的残差变化。"
      },
      "bridge": "跳接让网络重点学习输入之外的残差信息。 证据定位：第3页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "inf",
      "title": "为什么残差学习有效",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "保留输入主干，只学习需要补上的残差变化。"
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "网络学习输入之外的变化。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "示意图不代表论文测量值。"
        }
      ],
      "kind": "chapter",
      "id": "chap-3",
      "badgeLabel": "推理主线"
    },
    {
      "modules": [
        {
          "title": "切换BN状态，查看特征范围示意",
          "desc": "去掉BN，保留残差块中的卷积与非线性。 画面使用论文报告的数据或结构条件。",
          "id": "4.1",
          "kind": "module",
          "componentId": "example-slider"
        },
        {
          "title": "选择倍率，比较SRResNet的L1/L2实测结果",
          "desc": "表2报告DIV2K验证集在×2、×3、×4下的PSNR与SSIM；可切换倍率。",
          "id": "4.2",
          "kind": "module",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "结构简化：擦去多余步骤",
        "text": "擦去BN步骤以保留特征范围；这是论文针对SR的结构选择。"
      },
      "bridge": "去掉BN，保留残差块中的卷积与非线性。 证据定位：第4页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "inf",
      "title": "EDSR：删去BN的残差块",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "擦去BN步骤以保留特征范围；这是论文针对SR的结构选择。"
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "去BN保留特征范围并节省显存。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "示意图不代表论文测量值。"
        }
      ],
      "kind": "chapter",
      "id": "chap-4",
      "badgeLabel": "推理主线"
    },
    {
      "modules": [
        {
          "title": "切换模型配置，比较论文表1参数",
          "desc": "资源固定时，加宽比盲目加深更能增加容量。 画面使用论文报告的数据或结构条件。",
          "id": "5.1",
          "kind": "module",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "模型容量：换用更宽画笔",
        "text": "增加特征通道扩展模型容量；固定深度时参数量近似按通道数平方增长。"
      },
      "bridge": "资源固定时，加宽比盲目加深更能增加容量。 证据定位：第5页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "inf",
      "title": "尺度与模型容量",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "增加特征通道扩展模型容量；固定深度时参数量近似按通道数平方增长。"
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "加宽扩容伴随参数量增长。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "示意图不代表论文测量值。"
        }
      ],
      "kind": "chapter",
      "id": "chap-5",
      "badgeLabel": "推理主线"
    },
    {
      "modules": [
        {
          "title": "切换基线与EDSR配置，查看残差缩放",
          "desc": "宽网络训练可能不稳定，残差缩放抑制幅度。 画面使用论文报告的数据或结构条件。",
          "id": "6.1",
          "kind": "module",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "残差缩放：轻压笔尖",
        "text": "缩小残差支路幅度帮助大模型训练稳定；论文采用0.1。"
      },
      "bridge": "宽网络训练可能不稳定，残差缩放抑制幅度。 证据定位：第6页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "inf",
      "title": "大模型如何稳定训练",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "缩小残差支路幅度帮助大模型训练稳定；论文采用0.1。"
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "0.1残差缩放用于稳定大模型。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "示意图不代表论文测量值。"
        }
      ],
      "kind": "chapter",
      "id": "chap-6",
      "badgeLabel": "推理主线"
    },
    {
      "modules": [
        {
          "title": "切换初始化方式，查看论文收敛趋势",
          "desc": "低倍率模型提供可迁移初始化，缩短高倍率收敛。 画面使用论文报告的数据或结构条件。",
          "id": "7.1",
          "kind": "module",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "尺度迁移：借用×2底稿",
        "text": "先借用×2模型权重，再初始化×3或×4模型。"
      },
      "bridge": "低倍率模型提供可迁移初始化，缩短高倍率收敛。 证据定位：第7页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "both",
      "title": "从×2迁移到×3与×4",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "先借用×2模型权重，再初始化×3或×4模型。"
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "×2预训练可加速高倍率训练。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "示意图不代表论文测量值。"
        }
      ],
      "kind": "chapter",
      "id": "chap-7",
      "badgeLabel": "方法与证据"
    },
    {
      "modules": [
        {
          "title": "选择倍率，查看MDSR启用分支",
          "desc": "多尺度共享主干，边界模块仍按尺度专属。 画面使用论文报告的数据或结构条件。",
          "id": "8.1",
          "kind": "module",
          "componentId": "example-slider"
        },
        {
          "title": "比较MDSR多尺度参数共享",
          "desc": "切换三个单尺度基线与一个多尺度基线，比较表1/第3.3节报告的参数量。",
          "id": "8.2",
          "kind": "module",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "MDSR：共享底稿后选倍率",
        "text": "共享主干提取共通特征，尺度专属模块完成各自倍率重建。"
      },
      "bridge": "多尺度共享主干，边界模块仍按尺度专属。 证据定位：第8页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "both",
      "title": "MDSR：共享与专属分支",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "共享主干提取共通特征，尺度专属模块完成各自倍率重建。"
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "共用主干，尺度分支按需启用。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "示意图不代表论文测量值。"
        }
      ],
      "kind": "chapter",
      "id": "chap-8",
      "badgeLabel": "方法与证据"
    },
    {
      "modules": [
        {
          "title": "按倍率查看SRResNet的L1/L2实测结果",
          "desc": "表2报告DIV2K验证集在×2、×3、×4下的PSNR与SSIM；切换倍率查看同协议对照。",
          "id": "9.1",
          "kind": "module",
          "componentId": "example-slider"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "切换退化条件，判断能否使用几何自集成",
          "desc": "论文说明自集成仅适用于对称下采样；未知退化挑战赛未使用该策略。",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "自集成：翻转后对齐",
        "text": "翻转或旋转输入，将逆变换输出对齐后平均；要求对称下采样。"
      },
      "bridge": "L1是实验选择；自集成仅满足对称退化条件时使用。 证据定位：第8页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "both",
      "title": "训练目标与测试时集成",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "翻转或旋转输入，将逆变换输出对齐后平均；要求对称下采样。"
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "自集成仅对称下采样有效。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "未知退化挑战赛没有使用几何自集成。"
        }
      ],
      "kind": "chapter",
      "id": "chap-9",
      "badgeLabel": "方法与证据"
    },
    {
      "modules": [
        {
          "title": "切换倍率，比较DIV2K验证结果",
          "desc": "表2中的DIV2K验证结果；切换倍率，不混用公开基准测试协议。",
          "id": "10.1",
          "kind": "module",
          "componentId": "example-slider"
        },
        {
          "title": "切换NTIRE赛道与倍率",
          "desc": "表4分别报告NTIRE双三次与未知退化赛道成绩；可切换赛道和倍率。",
          "id": "10.2",
          "kind": "module",
          "componentId": "example-slider"
        }
      ],
      "analogy": {
        "componentId": "photo-analogy",
        "title": "评测：并排核对成绩单",
        "text": "只在相同数据集、倍率与评测协议内比较PSNR/SSIM."
      },
      "bridge": "结果要按数据集、尺度与评测协议分别读。 证据定位：第8页；请区分论文事实与交互示意。",
      "insight": "核心逻辑：结构改动与训练条件共同作用；单个消融结果不能替代完整协议。",
      "badge": "both",
      "title": "结果、边界与结论",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "本章要点",
          "desc": "只在相同数据集、倍率与评测协议内比较PSNR/SSIM."
        },
        {
          "icon": "🔧",
          "title": "机制",
          "desc": "跨数据集、倍率的结果不可直接比较。"
        },
        {
          "icon": "📊",
          "title": "边界",
          "desc": "不同评测条件下的数值不可直接比较。"
        }
      ],
      "kind": "chapter",
      "id": "chap-10",
      "badgeLabel": "方法与证据"
    }
  ],
  "hero": {
    "oldMethod": {
      "desc": "双三次插值把像素放大，却难以恢复真实边缘纹理。"
    },
    "newMethod": {
      "desc": "EDSR学习重建细节；MDSR以共享主体处理多个倍率。"
    }
  },
  "meta": {
    "coreInsight": "针对SR重构网络移除BN、放大模型并用残差缩放稳定训练；MDSR共享主体而保留尺度专属模块。",
    "domain": "单图像超分辨率",
    "titleEn": "Enhanced Deep Residual Networks for Single Image Super-Resolution",
    "titleZh": "增强型深度残差网络：单图超分辨率",
    "affiliation": "首尔国立大学",
    "venue": "CVPR 2017 Workshops / arXiv 1707.02921",
    "authors": "Bee Lim、Sanghyun Son、Heewon Kim、Seungjun Nah、Kyoung Mu Lee",
    "coreProblem": "如何从单张低分辨率图像恢复高分辨率细节，同时控制计算与多尺度模型成本？",
    "keywords": [
      "EDSR",
      "MDSR",
      "超分辨率"
    ]
  }
};
