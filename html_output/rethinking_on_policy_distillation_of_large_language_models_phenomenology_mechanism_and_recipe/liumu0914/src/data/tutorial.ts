import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Rethinking On-Policy Distillation of Large Language Models: Phenomenology, Mechanism, and Recipe",
    "titleZh": "重新审视大语言模型的在策略蒸馏：现象、机制与实践方案",
    "venue": "arXiv:2604.13016v2 · 2026",
    "authors": "Yaxuan Li, Yuxin Zuo, Bingxiang He, Jinqian Zhang, Chaojun Xiao 等",
    "affiliation": "清华大学、上海科技大学、伊利诺伊大学厄巴纳-香槟分校、中国人民大学",
    "domain": "大语言模型 · 后训练 · 数学推理",
    "coreProblem": "更强的教师并不保证 OPD 成功：学生可能没有走到教师擅长的局部状态，或者教师只重复了学生已经见过的能力。",
    "coreInsight": "成功的 OPD 会在学生实际访问的前缀上，逐步对齐师生的高概率 token；共享区域承载了主要概率质量和有效梯度。",
    "keywords": [
      "On-policy Distillation",
      "Token Alignment",
      "Thinking Patterns",
      "Long Horizon"
    ],
    "paperUrl": "https://arxiv.org/abs/2604.13016",
    "codeUrl": "https://github.com/thunlp/OPD"
  },
  "hero": {
    "oldMethod": {
      "desc": "固定教师示范：学生在自己的轨迹外学习，遇到偏离前缀时监督变得间接。",
      "componentId": "opd-scene"
    },
    "newMethod": {
      "desc": "学生轨迹上的稠密监督：在实际访问的前缀上比较分布，并寻找共享高概率 token。",
      "componentId": "opd-scene"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "OPD 先问“学生走过哪里”",
      "badge": "inf",
      "badgeLabel": "现象",
      "bridge": "传统蒸馏把学生带到教师写好的答案旁边；本节先让你看到，学生真正访问的前缀可能完全不同。",
      "analogy": {
        "title": "先听自己弹到哪里",
        "text": "手指先试弹一个音符，再在同一个前缀上听教师的反馈。<b>监督位置</b>决定了反馈能不能被用上。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "固定示范还是自己的轨迹？",
          "desc": "切换两种监督路径，观察学生偏离示范后，教师是否仍在同一前缀上提供反馈。",
          "componentId": "opd-condition"
        }
      ],
      "insight": "OPD 在学生自己生成并实际访问的前缀上计算教师分布，从而提供逐 token 的稠密监督。",
      "formula": {
        "lead": "OPD 的序列目标可以拆成学生轨迹上的逐 token 反向 KL：",
        "unicode": "L_OPD(θ) = E_x,ŷ~πS [ Σ_t KL(πS(·|x,ŷ<t) || πT(·|x,ŷ<t)) ]",
        "symbols": [
          {
            "sym": "θ",
            "desc": "学生策略参数"
          },
          {
            "sym": "ŷ<t",
            "desc": "学生已经生成的前缀"
          },
          {
            "sym": "πT",
            "desc": "教师的下一 token 分布"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "轨迹先于答案",
          "desc": "监督要落在学生实际访问的状态。"
        },
        {
          "icon": "🔧",
          "title": "逐 token 分解",
          "desc": "序列级 reverse KL 提供每一步的局部信号。"
        },
        {
          "icon": "✨",
          "title": "先分清 on-policy",
          "desc": "学生自己生成的前缀是 OPD 的坐标系。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "概率不是一个答案，而是一组候选",
      "badge": "inf",
      "badgeLabel": "表示",
      "bridge": "同一个前缀下，模型不是只给一个答案，而是给整张 token 分布。k 决定我们查看这张分布的多大窗口。",
      "analogy": {
        "title": "把可能的音符圈出来",
        "text": "拖动窗口大小，手指会从一个最可能的音符，扩展到一簇共享候选。<b>支持集</b>越合理，反馈越稳。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "Top-k 窗口",
          "desc": "拖动 k，比较 Student Top-k 的候选规模、共享区域和计算开销。",
          "componentId": "opd-topk"
        }
      ],
      "formula": {
        "lead": "Top-k OPD 只在学生最有把握的 token 子集上重新归一化：",
        "unicode": "S_k = TopK(πS, k)；L_Top-k = E[ KL(π̃S|S_k || π̃T|S_k) ]",
        "symbols": [
          {
            "sym": "S_k",
            "desc": "学生 top-k token 集合"
          },
          {
            "sym": "k",
            "desc": "支持集大小"
          },
          {
            "sym": "π̃",
            "desc": "在子集上重新归一化的分布"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "k 是折中",
          "desc": "更密的信号换来更高的教师查询成本。"
        },
        {
          "icon": "🔧",
          "title": "避开 Top-1 偏置",
          "desc": "只盯 argmax 容易把微小抖动放大。"
        },
        {
          "icon": "✨",
          "title": "看主要质量",
          "desc": "后续机制集中在共享的高概率区域。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先要同拍，再谈更强",
      "badge": "inf",
      "badgeLabel": "条件",
      "bridge": "如果学生和教师的思考节奏不同，教师的高分也可能无法转化为学生能用的 token 级信号。",
      "analogy": {
        "title": "节拍合不合，决定能不能跟上",
        "text": "选择同拍或不同拍的示范，观察手指能否落在目标音上。<b>兼容性</b>先于榜单分数。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "初始 overlap 诊断",
          "desc": "选择思考模式相近或不相近的教师，观察训练起点的共享候选比例。",
          "componentId": "opd-pattern"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "分数高 ≠ 新知识",
          "desc": "比较同管线放大模型与额外 RL 后训练教师的可迁移增益。",
          "componentId": "opd-novelty"
        }
      ],
      "insight": "OPD 需要的是学生能用上的新信息，而不是一张更高的榜单分数。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "初始模式影响上限",
          "desc": "早期 mismatch 的损失不会自动消失。"
        },
        {
          "icon": "🔧",
          "title": "scale 不是 novelty",
          "desc": "更大的模型可能只是更好地拟合了相同数据。"
        },
        {
          "icon": "✨",
          "title": "先测 overlap",
          "desc": "选择教师前先检查局部候选空间是否兼容。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "共享高概率 token 是真正的练习片段",
      "badge": "both",
      "badgeLabel": "机制",
      "bridge": "现象层的 overlap 还不够；本节把它拆成候选集合、共享区内权重和置信度差距三个可操作指标。",
      "analogy": {
        "title": "把共同听见的音弹稳",
        "text": "拖动对齐程度，手指会靠近共同目标音；曲线和反馈同步变化。<b>共享区</b>承载主要概率质量。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "Overlap / Advantage / Entropy",
          "desc": "拖动 alignment，观察 overlap ratio、overlap-token advantage 和 entropy gap 如何一起改善。",
          "componentId": "opd-overlap"
        }
      ],
      "formula": {
        "lead": "三个指标分别问：候选是否相交、共享区内权重是否一致、置信度是否同拍。",
        "unicode": "M_overlap = E_t[|S_t^S ∩ S_t^T|/k]；A_t(v)=p̄_t(v)[log q̄_t(v)−log p̄_t(v)]；M_adv=E_t[Σ_{v∈交集}A_t(v)/|交集|]；ΔH_t=|H(q_t)−H(p_t)|",
        "symbols": [
          {
            "sym": "M_overlap",
            "desc": "top-k 候选集合的重合比例"
          },
          {
            "sym": "H",
            "desc": "分布熵"
          },
          {
            "sym": "ΔH",
            "desc": "师生熵差的绝对值"
          },
          {
            "sym": "M_adv",
            "desc": "共享 token 上加权对数概率比的平均值，接近 0 表示对齐改善"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "overlap 看候选空间",
          "desc": "它衡量学生是否进入教师支持区域。"
        },
        {
          "icon": "🔧",
          "title": "advantage 看权重",
          "desc": "共享 token 上的置信度差距应趋近零。"
        },
        {
          "icon": "✨",
          "title": "entropy 看节奏",
          "desc": "熵差变小表示不确定性 profile 更相似。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "只练共享音符也能得到主要收益",
      "badge": "both",
      "badgeLabel": "机制",
      "bridge": "如果共享区真的承载主要梯度，那么只优化它，应该仍能接近完整 Top-k OPD 的效果。",
      "analogy": {
        "title": "只保留共同谱面",
        "text": "逐步切换支持集，手指只在共享短句上练习时，绿色路径仍能保持。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "支持集拆分",
          "desc": "比较 Student Top-k、Overlap Top-k 与 Non-overlap Top-k 的验证表现和 overlap 曲线。",
          "componentId": "opd-support"
        }
      ],
      "formula": {
        "lead": "消融把学生 top-k 支持拆成交集与对称差集：",
        "unicode": "S_overlap = Top-k(πS) ∩ Top-k(πT)；S_non = Top-k(πS) △ Top-k(πT)",
        "symbols": [
          {
            "sym": "S_overlap",
            "desc": "师生 top-k 的交集"
          },
          {
            "sym": "S_non",
            "desc": "师生 top-k 的对称差集"
          },
          {
            "sym": "△",
            "desc": "对称差运算"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "共享区是主要作用区",
          "desc": "在本文消融中，Overlap Top-k 几乎恢复完整 Student Top-k 的收益。"
        },
        {
          "icon": "🔧",
          "title": "优化会自增强",
          "desc": "共享 token 被强化后，会把竞争 token 推出 top-k。"
        },
        {
          "icon": "✨",
          "title": "非共享贡献较小",
          "desc": "在本文实验中，Non-overlap Top-k 的有效贡献明显更小。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "每一步只在学生到过的前缀上发生",
      "badge": "inf",
      "badgeLabel": "轨迹",
      "bridge": "教师给出的下一 token 分布依赖当前前缀；前缀改变，监督的可靠性和可利用性也会改变。",
      "analogy": {
        "title": "逐拍检查，不跳过前缀",
        "text": "每次只前进一拍，下一音的反馈都绑定到手指刚刚走过的路径。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "Prefix stepper",
          "desc": "逐步推进学生前缀，理解教师从学生前缀继续生成时的正确率增益为何随深度下降。",
          "componentId": "opd-prefix"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "条件分布依赖前缀",
          "desc": "同一个 token 在不同状态下不是同一个问题。"
        },
        {
          "icon": "🔧",
          "title": "一步一步校准",
          "desc": "学生访问状态是 OPD 的真实训练坐标。"
        },
        {
          "icon": "✨",
          "title": "深度会放大漂移",
          "desc": "更长轨迹可能让教师面对更陌生的学生前缀。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "先用教师示范热身，再开始 OPD",
      "badge": "trn",
      "badgeLabel": "配方",
      "bridge": "当学生和教师的节奏差得太远，直接 OPD 的 token 信号难以利用；先用教师 rollout 做 SFT 是一个冷启动。",
      "analogy": {
        "title": "先练示范片段",
        "text": "手指先重复一段稳定短句，再进入自己的长段落。<b>热身</b>抬高了可学习的起点。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "Cold start 开关",
          "desc": "切换 Base→OPD 与 SFT→OPD，比较初始 overlap、训练轨迹和最终表现。",
          "componentId": "opd-coldstart"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "SFT 是热身",
          "desc": "教师 rollout 先把思考模式拉到可用范围。"
        },
        {
          "icon": "🔧",
          "title": "高起点 overlap",
          "desc": "冷启动让后续 OPD 的监督更容易被学生利用。"
        },
        {
          "icon": "✨",
          "title": "改变可学习性",
          "desc": "配方改变信号的可达性，而不是教师的身份。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "提示格式也会改变可学习状态",
      "badge": "trn",
      "badgeLabel": "配方",
      "bridge": "提示本身是学生访问状态的一部分；即使问题内容不变，格式也可能把学生带入教师熟悉的区域。",
      "analogy": {
        "title": "同一首曲子，谱面格式要对齐",
        "text": "切换两种谱面布局，目标音不变，但共享质量和探索程度会一起变化。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "Template / Content 对齐",
          "desc": "论文用两组独立实验考察模板与内容：模板对齐提高 accuracy 和 overlap；内容对齐的 overlap ratio 较低，但共享 token 概率质量更高、entropy 更低。",
          "componentId": "opd-prompt"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "prompt 也是状态",
          "desc": "学生进入什么前缀，取决于问题如何被呈现。"
        },
        {
          "icon": "🔧",
          "title": "对齐共享 token",
          "desc": "教师后训练格式能提高局部可用性。"
        },
        {
          "icon": "✨",
          "title": "别压垮探索",
          "desc": "论文建议可考虑混入教师后训练数据之外的 prompt，以保留策略熵和探索能力。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "轨迹越长，后缀奖励越不可靠",
      "badge": "trn",
      "badgeLabel": "边界",
      "bridge": "稠密奖励不是无限可靠：论文观察到中等长度最稳，过长轨迹会从后缀开始出现 entropy 和梯度异常。",
      "analogy": {
        "title": "练习段落不要无限拉长",
        "text": "拖动段落长度，后半段会从稳定绿色变成抖动红色，提示局部监督正在失真。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "Length / Entropy / Gradient",
          "desc": "调节最大响应长度，观察 0.5K 到 15K 的准确率、entropy 和 gradient 变化。",
          "componentId": "opd-length"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "存在稳定区间",
          "desc": "在本文设置中，3K-7K 比过短或过长更稳。"
        },
        {
          "icon": "🔧",
          "title": "后缀先漂移",
          "desc": "长轨迹的高 entropy 首先出现在输出末端。"
        },
        {
          "icon": "✨",
          "title": "长程需混合奖励",
          "desc": "agentic 场景可能需要短段稠密监督加长程结果奖励。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、折中与可迁移边界",
      "badge": "both",
      "badgeLabel": "总结",
      "bridge": "最后把效果、机制和边界放在同一张证据桌上：论文解释了数学推理中的 OPD，但也明确留下迁移问题。",
      "analogy": {
        "title": "比较终点，也检查代价",
        "text": "手指比较两种练法的终点，再回头检查轨迹长度和探索空间的代价。",
        "componentId": "opd-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "证据竞速",
          "desc": "切换效果、机制和边界，查看论文报告的 overlap、AUROC 与长度折中。",
          "componentId": "opd-results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "下一步该问什么？",
          "desc": "选择代码、开放域、agent 或混合长程监督，辨认哪些是未来工作。",
          "componentId": "opd-future"
        }
      ],
      "insight": "实验口径：主实验使用 DAPO-Math-17K，评估 AIME 2024、AIME 2025 和 AMC 2023；每题以 temperature 0.7、top-p 0.95 采样 16 个答案并报告 avg@16。关于失败教师的局部梯度各向异性，作者明确将其作为尚未直接验证的假设。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两条件共同作用",
          "desc": "模式兼容与新知识共同决定 OPD 是否可学。"
        },
        {
          "icon": "🔧",
          "title": "共享区解释机制",
          "desc": "高概率 overlap 是主要作用区，但不是万能保证。"
        },
        {
          "icon": "✨",
          "title": "边界必须保留",
          "desc": "目前证据集中在数学 benchmark，跨域结论仍待验证。"
        }
      ]
    }
  ]
};
