import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Unifying Heterogeneous Multi-Modal Remote Sensing Detection Via Language-Pivoted Pretraining",
    titleZh: "以语言为枢轴的预训练统一多模态遥感异构目标检测",
    venue: "arXiv:2603.01758v1 (preprint, 2 Mar 2026)",
    authors: "Yuxuan Li, Yuming Chen, Yunheng Li, Ming-Ming Cheng, Xiang Li, Jian Yang",
    affiliation: "PCA Lab & VCIP, CS, Nankai University; NKIARI, Shenzhen Futian",
    domain: "remote sensing · multi-modal object detection · language-pivoted pretraining",
    coreProblem: "晚期对齐把模态对齐与检测目标耦合在微调阶段，导致训练不稳定与跨模态泛化差。",
    coreInsight: "用预训练 LLM 作语义枢轴，把对齐提前到独立预训练阶段；CSIA 提供隐式跨模态对齐，LVSA 桥接粒度差。",
    keywords: [
      "遥感",
      "多模态检测",
      "异构模态",
      "语言预训练",
      "视觉-语言模型",
      "SAR",
      "红外",
      "目标检测"
    ]
  },
  hero: {
    oldMethod: {
      desc: "<b>晚期对齐</b>：三种课本同时读，笔尖来回跳，纸面染红。",
      componentId: "hero-late-align"
    },
    newMethod: {
      desc: "<b>BabelRS</b>：老师先写一张概念卡，三本书都贴上同一个标签。",
      componentId: "hero-babel-rs"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "模态冲突的根源：晚期对齐让微调频频失控",
      badge: "inf",
      badgeLabel: "原理",
      bridge: "<b>晚期对齐</b>把「模态对齐「与「目标检测「耦合在微调阶段的同一损失里，跨模态梯度相互拉扯——这是 BabelRS 想要解决的核心问题。",
      analogy: {
        title: "翻译老师面对三本「语种不通「的课本",
        text: "<b>晚期对齐</b>让老师同时读三本书、同时写译文——笔尖在三种风格之间反复横跳，纸面很快染红。",
        componentId: "ana-chap-1"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "模态冲突强度滑块",
          desc: "把滑块从 0 拉到 1，观察晚期对齐的损失曲线从稳定变到 NaN。",
          componentId: "chap-1-1"
        },
        {
          kind: "module",
          id: "1.2",
          title: "跨模态梯度余弦矩阵",
          desc: "切换是否启用「语言预训练「，看跨模态梯度余弦从负值变为非负。",
          componentId: "chap-1-2"
        }
      ],
      insight: "<b>冲突不是模型不够大，而是对齐目标与检测目标在同一阶段被强行相加。</b>",
      takeaways: [
        {
          icon: "🎯",
          title: "耦合是根因",
          desc: "晚期对齐把「对齐「与「检测「放在同一阶段的损失里。"
        },
        {
          icon: "🔧",
          title: "梯度冲突",
          desc: "跨模态梯度互相冲突是 NaN 与不稳定的根本来源。"
        },
        {
          icon: "✨",
          title: "把对齐提前",
          desc: "把对齐<b>提前</b>到独立阶段，让它不再与检测目标竞争。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "异构输入：RGB、SAR、红外为什么不能「对齐对齐就行「",
      badge: "inf",
      badgeLabel: "原理",
      bridge: "三种传感器记录的是不同的物理量——直接做像素对齐代价极高。BabelRS 因此选了另一条桥。",
      analogy: {
        title: "三种课本，三种「语言「",
        text: "<b>RGB</b> 写「形状与颜色「、<b>SAR</b> 写「散射回波「、<b>红外</b> 写「热辐射「——它们的「字形「互不相通。",
        componentId: "ana-chap-2"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "模态切换芯片",
          desc: "点击 RGB / SAR / IR 三个芯片，桌面上对应的课本被点亮，并显示一个真实样例的「指令 + 响应「。",
          componentId: "chap-2-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "异构模态",
          desc: "异构模态在像素层面对齐代价极高。"
        },
        {
          icon: "🔧",
          title: "语言现成",
          desc: "语言是一种<b>现成</b>的跨模态共同语。"
        },
        {
          icon: "✨",
          title: "绕开瓶颈",
          desc: "把语言当作枢轴，可绕过「像素对齐「瓶颈。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "核心洞察：把语言当作「语义枢轴「",
      badge: "inf",
      badgeLabel: "原理",
      bridge: "既然模态之间「字形不通「，那就让一个<b>共同语</b>来翻译三种课本——这个共同语就是预训练 LLM。",
      analogy: {
        title: "一张概念卡，三本书都贴上同一个标签",
        text: "<b>概念</b>把「图像里的东西「压缩成<b>一句自然语言</b>，无论原本是哪一种「字形「。",
        componentId: "ana-chap-3"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "晚期 vs. 早期对齐：相同起点、不同收敛",
          desc: "点击「开始比较「按钮，左右两栏同时从 t=0 启动，比较「晚期对齐「（红）与「早期 + 语言枢轴「（绿）两条路径的最终概念匹配。",
          componentId: "chap-3-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "语义枢轴",
          desc: "语言枢轴 = LLM 把不同模态映射到同一概念空间。"
        },
        {
          icon: "🔧",
          title: "对齐时机",
          desc: "对齐发生在<b>预训练</b>阶段，而非微调阶段。"
        },
        {
          icon: "✨",
          title: "隐式对齐",
          desc: "隐式对齐不强制特征距离，特征空间不会塌缩。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "概念共享指令对齐（CSIA）的数学骨架",
      badge: "both",
      badgeLabel: "原理+训练",
      bridge: "把「语言枢轴「变成公式：让 LLM 在视觉特征条件下预测响应文本——这就是 CSIA 的核心。",
      analogy: {
        title: "老师逐字抄写「标准答案「",
        text: "视觉特征 = <b>题目</b>，LLM 的响应 = <b>标准答案</b>；损失 = 逐字对得上。",
        componentId: "ana-chap-4"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "训练步数与 CSIA 损失",
          desc: "拖动「训练步数「滑块，观察 CSIA 语言建模损失与晚期对齐联合损失两条曲线的变化。",
          componentId: "chap-4-1"
        },
        {
          kind: "module",
          id: "4.2",
          title: "CSIA 损失公式与符号",
          desc: "阅读 L<sub>align</sub> = -∑<sub>j=1..|r|</sub> log P<sub>Φ</sub>(r<sub>j</sub> | q, r<sub>&lt;j</sub>, E<sub>M</sub>(x))，并点击每个符号查看含义。",
          componentId: "chap-4-2"
        }
      ],
      formula: {
        lead: "CSIA 用条件语言建模损失把每张图像映射到 LLM 的语义空间——下面公式中的每个符号都来自论文 §3.1。",
        unicode: "L<sub>align</sub> = - ∑<sub>j=1..|r|</sub> log P<sub>Φ</sub>( r<sub>j</sub> | q, r<sub>&lt;j</sub>, E<sub>M</sub>(x) )",
        symbols: [
          {
            sym: "L<sub>align</sub>",
            desc: "CSIA 的语言建模损失——只在响应 token 上计算，越小代表视觉特征越能让 LLM 复现「标准答案「。"
          },
          {
            sym: "Φ",
            desc: "冻结的预训练 LLM（论文中为 Qwen2，源自 InternVL-2.5 1B），充当跨模态的<b>语义枢轴</b>。"
          },
          {
            sym: "E<sub>M</sub>",
            desc: "在 RGB / SAR / IR 三种模态上<b>权重共享</b>的视觉编码器（ViT-Large, 24 层）。"
          },
          {
            sym: "x",
            desc: "任意一种模态的输入图像。"
          },
          {
            sym: "q, r",
            desc: "与 x 配对的<b>指令</b> q 与<b>响应</b> r（自然语言），二者都不需要跨模态配对。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "CSIA 是什么",
          desc: "CSIA = 共享视觉编码器 + 指令跟随损失。"
        },
        {
          icon: "🔧",
          title: "公式本质",
          desc: "公式本质是<b>条件语言建模</b>，视觉特征只通过「对响应的预测能力「参与训练。"
        },
        {
          icon: "✨",
          title: "隐式监督",
          desc: "隐式监督不强制特征距离，模态特有的低层结构得以保留。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "层间视觉-语义退火（LVSA）：让语言对齐带上「尺度感「",
      badge: "both",
      badgeLabel: "原理+训练",
      bridge: "CSIA 只对齐了「末层语义「，但目标检测需要多尺度、空间分辨的特征——LVSA 用退火把中间层平滑带进来。",
      analogy: {
        title: "先写主字，再添细节",
        text: "<b>退火</b> = 从「只看末层「平滑过渡到「全层融合「，避免训练早期就破坏预训练分布。",
        componentId: "ana-chap-5"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "退火系数 α(t) vs. 训练步数 t",
          desc: "拖动「退火时长 τ「滑块（4k / 6k / 10k 三个档位 + 连续），观察 α(t) 曲线以及「细节层是否被过快地加入「。",
          componentId: "chap-5-1"
        }
      ],
      formula: {
        lead: "LVSA 的核心是这条动态插值公式——它决定了中间层何时、以多大权重被并入语言对齐表征。",
        unicode: "α(t) = min( t / τ , 1 );   F̃ = (1 - α(t)) · F<sup>L</sup> + α(t) · (1 / |S|) · ∑<sub>l ∈ S</sub> F<sup>l</sup>",
        symbols: [
          {
            sym: "α(t)",
            desc: "退火系数，范围 [0, 1]：训练早期 ≈ 0（只取末层），训练后期 → 1（融合多尺度）。"
          },
          {
            sym: "τ",
            desc: "退火时长（步数）。论文推荐 <b>τ = 6k</b>，过短会破坏预训练分布，过长收益递减。"
          },
          {
            sym: "F̃",
            desc: "最终被送入 LLM 的融合特征，与末层 F<sup>L</sup> 同形。"
          },
          {
            sym: "S",
            desc: "参与融合的层下标集合，论文使用 {3, 9, 18, L=24}（ViT-Large）。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "退火是关键",
          desc: "退火让「全层融合「平滑发生，避免早期破坏预训练分布。"
        },
        {
          icon: "🔧",
          title: "经验最优",
          desc: "τ = 6k 是经验最优（论文图 6）。"
        },
        {
          icon: "✨",
          title: "配置胜出",
          desc: "LVSA 在共享投影头（config d）下效果最好。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "推理：把对齐好的表征交给检测头",
      badge: "inf",
      badgeLabel: "原理",
      bridge: "预训练结束后，对齐好的编码器被送进检测头——微调只做一件事，不包含任何对齐损失。",
      analogy: {
        title: "检查三本作业，全部打勾",
        text: "微调只做一件事：让每个模态的<b>检测头</b>读懂概念卡。",
        componentId: "ana-chap-6"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "微调步骤 1 → 4",
          desc: "通过「上一步 / 下一步「按钮观察微调阶段：① 加载对齐好的编码器；② 初始化模态检测头；③ 联合训练；④ 评估 H-mAP。",
          componentId: "chap-6-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "没有对齐损失",
          desc: "微调阶段不再有对齐损失。"
        },
        {
          icon: "🔧",
          title: "轻量微调",
          desc: "简单联合训练 + 模态检测头是 BabelRS 微调的全部。"
        },
        {
          icon: "✨",
          title: "提前的红利",
          desc: "这种「轻量微调「是对齐阶段提前带来的红利。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "训练流程：CSIA + LVSA → 简单联合微调",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "把前面所有组件拼成一条可执行流水线——这一章给出端到端训练流程的鸟瞰。",
      analogy: {
        title: "完整训练流程一览",
        text: "预训练（CSIA + LVSA）→ 微调（简单联合训练）→ 评估（H-mAP）。",
        componentId: "ana-chap-7"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "完整训练流程 6 步",
          desc: "步进浏览 BabelRS 的端到端训练流程，并对照晚期对齐流程做对比。",
          componentId: "chap-7-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "完整流程",
          desc: "数据准备 → CSIA → LVSA → 微调 → 评估。"
        },
        {
          icon: "🔧",
          title: "默认超参",
          desc: "预训练 20k 步、τ = 6k 是经验最优。"
        },
        {
          icon: "✨",
          title: "省去最难部分",
          desc: "与晚期对齐相比，少了「微调阶段的对齐目标「这一最难的部分。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "体系结构：点击 BabelRS 内部",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "前面都是抽象的——这一章把 BabelRS 的内部组件拆给你看：每点一个节点，下方信息面板会告诉你它做什么。",
      analogy: {
        title: "课本 → 投影仪 → 概念卡",
        text: "<b>ViT 编码器</b> + <b>共享投影头</b> + <b>Qwen2 LLM</b>。",
        componentId: "ana-chap-8"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "BabelRS 体系结构可点击地图",
          desc: "点击 ViT 编码器 / 共享投影头 / Qwen2 LLM / LVSA 退火器 四个节点中的任一个，下方信息面板显示其角色、维度、参数量与对最终 H-mAP 的贡献。",
          componentId: "chap-8-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "四个组件",
          desc: "BabelRS = 共享 ViT + 共享投影头 + LLM + LVSA 退火器。"
        },
        {
          icon: "🔧",
          title: "作用范围",
          desc: "LM 损失只作用在响应 token；视觉 token 与文本 token 不强制距离。"
        },
        {
          icon: "✨",
          title: "简化微调",
          desc: "微调阶段不再有对齐模块。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "实践技巧：合并策略、τ 选择、AMP 稳定性",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "论文里那些「小开关「——合并策略、退火时长、混合精度——是把配方变成可用模型的关键。",
      analogy: {
        title: "四种「书写风格「对比",
        text: "<b>共享投影头 + 退火</b> = 写出来的概念卡<b>最稳</b>。",
        componentId: "ana-chap-9"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "合并策略与 H-mAP",
          desc: "切换四种合并策略的芯片，观察 H-mAP 与 mAP 两条条形的变化。",
          componentId: "chap-9-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "最佳合并",
          desc: "LVSA 共享投影头是经验最优的合并策略。"
        },
        {
          icon: "🔧",
          title: "τ 默认值",
          desc: "退火时长 τ = 6k 是默认；过短易发散，过长收益递减。"
        },
        {
          icon: "✨",
          title: "AMP 稳定",
          desc: "AMP 下 BabelRS 仍稳定（79.13 / 50.17 / 51.52），而 4 种晚期基线 NaN。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "真实成绩：SOI-Det 主表、AMP 表、合并策略表",
      badge: "both",
      badgeLabel: "原理+训练",
      bridge: "三张表、三个模态——论文里所有声明都来自同一组对照实验；这里把数字跑给你看。",
      analogy: {
        title: "三张成绩单，三个模态",
        text: "在 <b>SOI-Det</b> 上同时拿到 RGB / SAR / IR 三项 <b>SOTA</b>。",
        componentId: "ana-chap-10"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "SOI-Det 三模态成绩赛跑",
          desc: "点击「开始比较「按钮，三个进度条按已验证的 mAP 值同步增长到 63.30 / 46.96 / 51.32，对照 SM3Det 的 60.64 / 46.47 / 48.87。",
          componentId: "chap-10-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "总体成绩",
          desc: "BabelRS = 81.32 / 51.57 / 53.02（Overall AP@50 / mAP / H-mAP）。"
        },
        {
          icon: "🔧",
          title: "提升来源",
          desc: "提升主要来自 SAR (91.70 AP@50) 和 IR (79.63 AP@50) 模态。"
        },
        {
          icon: "✨",
          title: "已知限制",
          desc: "依赖语言监督的覆盖度；当前为图像级检测，尚未建模时序。"
        }
      ]
    }
  ]
};
