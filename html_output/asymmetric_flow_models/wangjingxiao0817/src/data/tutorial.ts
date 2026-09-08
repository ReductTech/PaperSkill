import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Asymmetric Flow Models",
    titleZh: "高维 Pixel Generation 的非对称 Flow",
    venue: "arXiv 预印本 · 2026",
    authors: "Hansheng Chen、Jan Ackermann、Minseo Kim、Gordon Wetzstein、Leonidas Guibas",
    affiliation: "Stanford University",
    domain: "生成建模 · Flow Matching · 像素空间扩散",
    coreProblem: "Pixel Flow 的瓶颈不只是像素多，而是 velocity prediction 必须让高维随机噪声穿过整个网络。",
    coreInsight: "两项核心：<b>Low-rank Noise</b> 参数化；<b>Latent → Pixel</b> 迁移。",
    keywords: [
      "Pixel Flow",
      "Low-rank Noise",
      "Latent → Pixel"
    ]
  },
  hero: {
    oldMethod: {
      desc: "降低高维 Noise prediction 负担，并恢复 Full-rank Velocity。",
      componentId: "landing-knowledge-preview"
    },
    newMethod: {
      desc: "保留 pretrained trajectory，只修正剩余 Pixel gap。",
      componentId: "landing-knowledge-preview"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "从 Latent Generation 到 Pixel Generation",
      badge: "inf",
      badgeLabel: "背景",
      bridge: "比较 Latent 与 Pixel 两条生成路径。",
      analogy: {
        title: "两种生成表示",
        text: "先比较生成压缩表示与直接生成最终像素。"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "Latent / Pixel 表示路径",
          desc: "主动切换两条生成路径，观察 Decoder 是否存在以及最终像素细节由谁负责。",
          componentId: "latent-pixel-explorer"
        }
      ],
      takeaways: [
        {
          icon: "01",
          title: "Latent",
          desc: "在压缩表示中生成，更易扩展。"
        },
        {
          icon: "02",
          title: "Decoder",
          desc: "负责把 latent 恢复为最终像素。"
        },
        {
          icon: "03",
          title: "Pixel",
          desc: "直接控制最终低层表示。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "高维 Pixel Flow 的噪声瓶颈",
      badge: "inf",
      badgeLabel: "瓶颈",
      bridge: "拆开 velocity target，定位高维 Noise 瓶颈。",
      analogy: {
        title: "结构与随机性",
        text: "高维数据具有相关结构，高维高斯噪声却难以压缩。"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "Velocity Target 的组成",
          desc: "选择 x₀ 与 ε，比较 structured data 和 Gaussian noise 的表达性质。",
          componentId: "velocity-target-explorer"
        },
        {
          kind: "module",
          id: "2.2",
          title: "Noise Through the Network",
          desc: "切换 Latent / Pixel，比较需要预测的独立 Noise directions。",
          componentId: "noise-through-network"
        }
      ],
      takeaways: [
        {
          icon: "01",
          title: "Data",
          desc: "高维但有结构、相关且可复用。"
        },
        {
          icon: "02",
          title: "Noise",
          desc: "高维、随机且弱可压缩。"
        },
        {
          icon: "03",
          title: "Noise burden",
          desc: "Pixel Space 需要预测更多独立随机方向。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "现有 Pixel Generation 的两种折中",
      badge: "inf",
      badgeLabel: "折中",
      bridge: "比较两种 Pixel Generation 折中。",
      analogy: {
        title: "两条应对路线",
        text: "一条改 architecture，一条改 prediction target。"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "两种折中实验",
          desc: "分别测试 bypass 与 low-noise prediction 的作用和代价。",
          componentId: "pixel-tradeoff-explorer"
        }
      ],
      takeaways: [
        {
          icon: "01",
          title: "Bypass",
          desc: "让高维信息绕过主干瓶颈。"
        },
        {
          icon: "02",
          title: "x₀ target",
          desc: "避免直接预测满维高斯噪声。"
        },
        {
          icon: "03",
          title: "Open question",
          desc: "能否同时保留简单主干与稳定目标？"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "AsymFlow 的统一视角",
      badge: "both",
      badgeLabel: "核心思想",
      bridge: "只限制 Noise，不压缩 Data。",
      analogy: {
        title: "非对称设计",
        text: "Data 保持 full-dimensional，Noise 进入 meaningful low-rank subspace。"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "核心变化",
          desc: "比较 Standard 与 AsymFlow，区分保持不变的 Flow 与重新设计的 prediction target。",
          componentId: "asymflow-overview"
        }
      ],
      takeaways: [
        {
          icon: "01",
          title: "Asymmetry",
          desc: "只限制 noise component。"
        },
        {
          icon: "02",
          title: "Innovation I",
          desc: "降低 pixel noise prediction 负担。"
        },
        {
          icon: "03",
          title: "Innovation II",
          desc: "把 latent flow 迁移到 pixel space。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "Flow 与 Projection：必要工具",
      badge: "inf",
      badgeLabel: "必要工具",
      bridge: "掌握 Flow 时间与空间 Projection。",
      analogy: {
        title: "时间与空间",
        text: "Flow 描述轨迹运动，Projection 描述空间方向分解。"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "Flow 时间与空间 Projection",
          desc: "拖动时间与向量，观察两个基本操作。",
          componentId: "flow-projection-tools"
        }
      ],
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "非对称 Flow 参数化",
      badge: "both",
      badgeLabel: "Innovation I",
      bridge: "理解 Low-rank Noise 与 Velocity Recovery。",
      analogy: {
        title: "一次非对称改变",
        text: "Noise 进入低秩子空间，Data 仍保持完整维度。"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "低秩 Noise：重写 Prediction Target",
          desc: "调节 Rank，观察 ε 如何变为 Pε。",
          componentId: "asymflow-rank-lab"
        },
        {
          kind: "module",
          id: "6.2",
          title: "空间分解：同一 Target 的两种行为",
          desc: "先比较 P / I−P 的行为，再看 Rank 如何改变两者占比。",
          componentId: "spatial-decomposition-lab"
        },
        {
          kind: "module",
          id: "6.3",
          title: "Full-rank Velocity：恢复标准 Flow",
          desc: "沿两个正交分支恢复完整速度。",
          componentId: "velocity-recovery-path"
        }
      ],
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "Latent-to-Pixel 迁移",
      badge: "both",
      badgeLabel: "Innovation II",
      bridge: "理解 Latent Flow 如何迁移到 Pixel Space。",
      analogy: {
        title: "对齐、保留与修正",
        text: "先对齐空间，再保留轨迹，最后修正 Pixel gap。"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "空间对齐：Latent 进入 Pixel Subspace",
          desc: "依次对齐方向、尺度与 Flow 时间。",
          componentId: "latent-pixel-alignment"
        },
        {
          kind: "module",
          id: "7.2",
          title: "轨迹耦合：保留 Pretrained Flow",
          desc: "沿双轨移动，观察 Latent 与 Pixel Flow 的耦合。",
          componentId: "trajectory-coupling-lab"
        },
        {
          kind: "module",
          id: "7.3",
          title: "稳定 Finetuning：修正 Pixel Gap",
          desc: "用 Control Variate 与 LPIPS 完成修正。",
          componentId: "finetuning-correction-lab"
        }
      ],
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "实验证据：从机制到最终生成",
      badge: "both",
      badgeLabel: "Part III · Evidence",
      bridge: "用消融与最终结果验证两项创新。",
      analogy: {
        title: "机制、消融与结果",
        text: "实验用于定位证据与因果对应。"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "Rank 与 Subspace：Innovation I 的机制验证",
          desc: "比较 Rank、Subspace 与训练稳定性。",
          componentId: "rank-evidence-workspace"
        },
        {
          kind: "module",
          id: "8.2",
          title: "从初始化到修正：Innovation II 的消融验证",
          desc: "沿 Finetuning 阶段比较指标与局部图像。",
          componentId: "finetuning-ablation-evidence"
        },
        {
          kind: "module",
          id: "8.3",
          title: "最终生成质量：From Scratch 与 Latent-to-Pixel",
          desc: "比较 From Scratch、Latent-to-Pixel 与定性结果。",
          componentId: "final-performance-evidence"
        }
      ],
      takeaways: []
    }
  ],
  bilibili: [
    {
      bvid: "BV1cRwJeREgk",
      title: "NeurIPS 2024 Tutorial：Flow Matching for Generative Modeling",
      reason: "系统梳理流匹配基础、高级设计与模型适配。",
      views: "2.6万播放"
    },
    {
      bvid: "BV1Wv3xeNEds",
      title: "Flow Matching 流匹配基本原理深度解析",
      reason: "中文直觉讲解 x_t、速度场与 ODE。",
      views: "7.2万播放"
    },
    {
      bvid: "BV1sJJVz1EVn",
      title: "复现：扩散模型 Flow Matching",
      reason: "从训练与代码角度补足实现直觉。",
      views: "1.2万播放"
    },
    {
      bvid: "BV1fmHpzNE9s",
      title: "从零学习扩散模型：理论基础",
      reason: "串联 DDPM、DDIM 与 Flow Matching 的入门背景。",
      views: "1.9万播放"
    }
  ]
};
