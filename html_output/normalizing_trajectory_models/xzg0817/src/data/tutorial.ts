import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Normalizing Trajectory Models",
    titleZh: "归一化轨迹模型",
    venue: "arXiv:2605.08078 · 2026 · Apple & UIUC",
    authors: "Jiatao Gu, Tianrong Chen, Ying Shen, David Berthelot, Shuangfei Zhai, Josh Susskind",
    affiliation: "Apple；伊利诺伊大学厄巴纳-香槟分校（UIUC）",
    domain: "文生图生成 · 归一化流 · 扩散模型",
    coreProblem: "扩散/流匹配把生成拆成几十个高斯小步；压到 4 步时，每一大步的真实反向分布变成多峰混合，单高斯假设失效，画质崩塌——而已有的少步方法（蒸馏、一致性、对抗）全都放弃了精确似然。",
    coreInsight: "标题即方法：<b>Trajectory</b>——保留流匹配/扩散已有的高斯前向轨迹，一步不改；<b>Normalizing</b>——对每一步反向条件做归一化流式的可逆换元。高斯预测器在 u 空间照常工作，换元公式把它精确拉回成能表达多峰的密度；搬运器取恒等时，整个模型严格退化回普通高斯扩散。",
    keywords: [
      "归一化流",
      "少步生成",
      "精确似然",
      "可逆变换",
      "文生图"
    ]
  },
  hero: {
    oldMethod: {
      desc: "<b>现有高斯轨迹</b>：前向 x_t=(1−t)x₀+tε；反向每步只用一个高斯。步数一少，真实 p(x_s|x_t) 变成多峰混合，高斯只能给出模糊平均。",
      componentId: "hero-old"
    },
    newMethod: {
      desc: "<b>NTM 换元</b>：同一条轨迹，反向每步先经可逆 f_T 变换坐标。u 空间里高斯够用，拉回 x 空间就是能盖住多峰的精确密度——4 步 GenEval 0.82。",
      componentId: "hero-new"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "什么是 Normalizing Trajectory？",
      badge: "inf",
      badgeLabel: "问题",
      bridge: "先拆标题。Trajectory 指流匹配/扩散已有的高斯加噪轨迹 x_t=(1−t)x₀+tε——NTM 一步不改地保留它；Normalizing 指对每一步反向条件做归一化流式的换元。为什么要换？亲手压一压步数就知道。",
      analogy: {
        title: "论文图 2 · 去噪轨迹对比",
        text: "左：流匹配 50 步正常、压到 4 步就糊；右：NTM 同样 4 步得到相当质量——差别只在它建模了<b>非高斯的反向条件</b>。",
        figure: "/images/paper/teaser_v1.jpeg"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "把 50 步压成 4 步会发生什么",
          desc: "拖动滑块改变去噪步数 T。左边是生成的样本，右边是画质随步数变化的示意曲线。注意步数压到 10 以下时的转折。",
          componentId: "m1-steps"
        },
        {
          kind: "module",
          id: "1.2",
          title: "同样 4 步，换 NTM 再试",
          desc: "步数固定为 4，切换两种方法。右侧小图是<b>其中一大步</b>要拟合的真实反向分布：单高斯盖不住多峰，归一化流可以贴上去。",
          componentId: "m1-method"
        }
      ],
      insight: "失败的根源不在步数本身，而在「每一步只允许用一个高斯」：步长越大，真实反向条件 p(x_s|x_t) 越偏离高斯。NTM 的选择是保住轨迹和精确似然，只换掉这个高斯假设。",
      formula: {
        lead: "一大步要跨过的真实分布，是对所有可能原图的混合——通常多峰、重尾：",
        unicode: "p(x<sub>s</sub> | x<sub>t</sub>) = ∫ p(x<sub>s</sub> | x<sub>t</sub>, x<sub>0</sub>) · p(x<sub>0</sub> | x<sub>t</sub>) dx<sub>0</sub>",
        symbols: [
          {
            sym: "x<sub>t</sub>",
            desc: "当前带噪样本"
          },
          {
            sym: "x<sub>s</sub>",
            desc: "更干净一步的样本（s < t）"
          },
          {
            sym: "x<sub>0</sub>",
            desc: "可能的干净原图，全部要积分进去"
          },
          {
            sym: "∫ … dx<sub>0</sub>",
            desc: "步长越大，这个混合越偏离单高斯"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "推理成本＝步数",
          desc: "50 步与 4 步是一个数量级的差距，少步是硬需求。"
        },
        {
          icon: "🔧",
          title: "坏的是高斯假设",
          desc: "蒸馏/一致性/对抗方法绕开它，但都放弃了精确似然。"
        },
        {
          icon: "✨",
          title: "NTM 的路线",
          desc: "轨迹不动、似然不丢，只对反向条件做可逆换元——下一章推导它。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "可逆变换元：换元公式怎么来",
      badge: "inf",
      badgeLabel: "核心",
      bridge: "NTM 全部的非高斯能力来自一个保维可逆映射 f_T（搬运器）。这一章推导核心等式：可逆映射不创造也不销毁概率质量，它只是重新分配体积——密度因此可以被精确换算。",
      analogy: {
        title: "推导三步走",
        text: "① 可逆 ⇒ x 与 u=f_T(x) 一一对应，概率质量守恒：p_x(x)dx = p_u(u)du；② 两边同除 dx，体积缩放率就是雅可比行列式 |det J_T|；③ 所以 p_x(x) = p_u(f_T(x))·|det J_T(x)|——<b>不是近似，是恒等式</b>。"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "同一条高斯，经 f_T 拉回 x 空间",
          desc: "点「做一次换元」。左图：现有方法用单高斯硬套多峰的 p(x_s|x_t)；右图：先学可逆 f_T，u 空间里仍是高斯，按换元公式拉回 x 空间后密度自动变成多峰。",
          componentId: "m3-transport"
        },
        {
          kind: "module",
          id: "2.2",
          title: "换元前后的 NLL 极限",
          desc: "拖动高斯中心 μ，看 NLL 最低能压到多少——这是分布形状的极限，不是调参问题。打开换元后目标被拉成单峰，同一个高斯就能对平。",
          componentId: "m4-gauss"
        }
      ],
      insight: "预测器 f_P 没有换成混合高斯或对抗网络——非高斯性全部来自 f_T 对坐标的弯曲。u 空间里的一个高斯，经过可逆拉回，在 x 空间里可以是任意复杂的密度。",
      formula: {
        lead: "核心恒等式（归一化流的换元公式，作用在每一步反向条件上）：",
        unicode: "p<sub>x</sub>(x) = p<sub>u</sub>(f<sub>T</sub>(x)) · |det J<sub>T</sub>(x)|",
        symbols: [
          {
            sym: "f<sub>T</sub>",
            desc: "搬运器：保维、可逆、雅可比可算的变换"
          },
          {
            sym: "p<sub>u</sub>",
            desc: "u 空间里的密度：这里用单高斯就够"
          },
          {
            sym: "J<sub>T</sub>",
            desc: "f_T 的雅可比矩阵：局部的体积缩放率"
          },
          {
            sym: "|det·|",
            desc: "体积账：坐标弯多少，密度就精确补多少"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "恒等式而非近似",
          desc: "换元公式来自概率质量守恒，没有 ELBO，没有「大约」。"
        },
        {
          icon: "🔧",
          title: "可逆是前提",
          desc: "f_T 必须可逆且 det J 可算——这直接决定了下一章的模块设计。"
        },
        {
          icon: "✨",
          title: "表达力免费升级",
          desc: "高斯 + 可逆弯曲 = 多峰、重尾都能表达，似然还能精确写出。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "框架：需要哪些模块、为什么长这样",
      badge: "both",
      badgeLabel: "框架",
      bridge: "换元思想落地要回答两个工程问题：f_T 怎么设计才可逆、det J 才好算？f_P 为什么可以只是高斯？这一章把论文图 3 重画成可点击的流程图，逐个部件看清楚。",
      analogy: {
        title: "论文图 8 · 三种模型的谱系",
        text: "TarFlow 把深度全花在可逆变换上（一步到位但很贵）；扩散模型全靠高斯小步（便宜但步数多）；NTM 居中：<b>浅可逆变换 + 深高斯预测器</b>，各取所长。",
        figure: "/images/paper/ntm_comparison.png"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "重画论文图 3：点亮每个部件",
          desc: "训练时的完整数据流：x_t 与 x_s 各自经<b>共享的</b>搬运器 f_T 进入 u 空间；预测器 f_P 拿 u_t 和随机数 z 产出 û_s；距离 D 在分布层面对齐 û_s 与 u_s。点击任意节点看它的结构、层数与设计理由。",
          componentId: "m3-frame"
        },
        {
          kind: "module",
          id: "3.2",
          title: "推理时怎么走：算法 2",
          desc: "点「下一步」走一遍 4 步采样：u 空间里预测器顺序走 T 步（空间维全并行），昂贵的自回归逆搬运 f_T⁻¹ <b>整个过程只做一次</b>。这是 NTM 少步快的结构性原因。",
          componentId: "m6-sample"
        }
      ],
      insight: "深度放在哪是本文与前作 STARFlow/TarFlow 的分水岭：搬运器只需把本步分布「掰」成高斯，浅（2 块 × 4 层、因果 AR、交替扫描）就够；跨步推理交给深预测器（24 层、非因果、可并行）。",
      formula: {
        lead: "预测器每一步就是一次带随机数的仿射预测（高斯的重参数化）：",
        unicode: "û<sub>s</sub> = μ<sub>P</sub>(u<sub>t</sub>, t, s, y) + σ<sub>P</sub>(u<sub>t</sub>, t, s, y) ⊙ z,&nbsp;&nbsp;z ∼ N(0, I)",
        symbols: [
          {
            sym: "u<sub>t</sub> = f<sub>T</sub>(x<sub>t</sub>)",
            desc: "搬运后的表示：反向条件在这里近似高斯"
          },
          {
            sym: "μ<sub>P</sub>, σ<sub>P</sub>",
            desc: "预测器输出的均值与尺度：一步一个高斯"
          },
          {
            sym: "z",
            desc: "标准高斯随机数：多样性的来源"
          },
          {
            sym: "y",
            desc: "文本条件；CFG 直接作用在 (μ, σ) 上"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "f_T：浅而可逆",
          desc: "因果自回归结构保证可逆、雅可比是三角阵（det 好算）；交替扫描补视野。"
        },
        {
          icon: "🔧",
          title: "f_P：深而并行",
          desc: "非因果全注意力，容量大头；因为只需输出高斯参数，不必可逆。"
        },
        {
          icon: "✨",
          title: "逆变换只付一次",
          desc: "采样在 u 空间循环，最后一次 f_T⁻¹（自回归 + KV 缓存）回到像素。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "Loss 怎么算：整条轨迹的精确 NLL",
      badge: "trn",
      badgeLabel: "推导",
      bridge: "把账算清楚：单步的 log p 由三项相加（换元公式展开），整条轨迹再对 T 步求和，就是训练损失——没有对抗项、没有感知项。顺便完成一个关键证明：f_T=id 时它精确退化成现有高斯扩散的损失。",
      analogy: {
        title: "三本账，一分不差",
        text: "每步的 log p(x_s|x_t) = <b>基分布账</b>（z 落在哪）+ <b>预测账</b>（log|det J_P|）+ <b>换元账</b>（Σ log|det J_T|）。三本相加是恒等式——训练目标就是让整条轨迹的总账最大。"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "三项分解与恒等退化（附录 A.2）",
          desc: "切换「恒等搬运器 / 学到的搬运器」，看三项如何加减。f_T=id 时 J_T=I，换元账为零——NTM 损失严格等于普通高斯扩散的 NLL。这证明 NTM 是现有方法的<b>严格推广</b>，不是平行的另一套。",
          componentId: "m4-identity"
        },
        {
          kind: "module",
          id: "4.2",
          title: "一次训练，多种步数",
          desc: "训练时 T ∈ {4, 8, 16} 随机采样，同一个模型学会三种步长。切换 T 看质量-速度权衡（ImageNet 256² FID-50K，越低越好；参照线是前作 STARFlow 在 256 步下的 2.67）。",
          componentId: "m7-tsteps",
          figure: "/images/paper/multi_traj.jpeg"
        }
      ],
      insight: "步数越多每步越接近高斯、画质越好：16 步 FID 2.80 已逼近 256 步的前作，甜点区在 T=4–8。而这一切共享同一个训练目标——整条轨迹的精确负对数似然。",
      formula: {
        lead: "训练损失＝整条轨迹的负对数似然（论文式 3.4），逐项都可精确计算：",
        unicode: "L<sub>NTM</sub> = Σ<sub>k</sub> [ ½‖z<sub>k</sub>‖² + Σ<sub>n</sub> log σ<sub>P</sub> + Σ<sub>ℓ</sub> log σ<sub>T</sub> ]",
        symbols: [
          {
            sym: "Σ<sub>k</sub>",
            desc: "对轨迹上全部 T 步求和"
          },
          {
            sym: "½‖z<sub>k</sub>‖²",
            desc: "基分布账：映射回的 z 要落在标准高斯高密度区"
          },
          {
            sym: "Σ log σ<sub>P</sub>",
            desc: "预测账：高斯预测那一步的体积缩放"
          },
          {
            sym: "Σ log σ<sub>T</sub>",
            desc: "换元账：搬运器逐层的体积缩放；f_T=id 时为 0"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "纯 NLL 就够",
          desc: "精确似然天然覆盖所有模式，训练稳定，无需对抗/感知损失来补。"
        },
        {
          icon: "🔧",
          title: "恒等退化＝身份证明",
          desc: "f_T=id ⇒ 换元账为零 ⇒ 损失与高斯扩散完全一致（附录 A.2）。"
        },
        {
          icon: "✨",
          title: "退化点即起跑线",
          desc: "既然 f_T=id 就是预训练模型，从它出发微调就是顺理成章——下一章。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "从现有模型迁移：微调配方",
      badge: "trn",
      badgeLabel: "迁移",
      bridge: "恒等退化不只是理论优雅，它直接给出微调配方：f_T 初始化为恒等、μ_P 锚到预训练模型的后验均值（命题 2 给出闭式系数）、尺度修正 δ_σ 零初始化——第 0 步的 NTM 就是 FLUX 本身，然后再慢慢长出非高斯能力。",
      analogy: {
        title: "论文图 7(a) · 不加对齐损失的下场",
        text: "只靠 NLL 驱动，训练不稳定，画质明显劣化、布满噪点伪影。锚（均值对齐损失）不是锦上添花，是<b>稳定性的关键</b>。",
        figure: "/images/paper/qualitative_2x2.png"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "三种起步方式对比",
          desc: "切换三种训练方式看损失曲线与最终画质：随机初始化、恒等初始化、恒等初始化 + 均值对齐损失（λ=2.5，余弦退火到 0——锚逐渐松手）。右图为论文图 7(b)：加了对齐损失后的正常结果。",
          componentId: "m5-finetune",
          figure: "/images/paper/qualitative_2x2_2.png"
        }
      ],
      insight: "配方三件套：① f_T=id（换元账清零）；② μ_P=μ_post——命题 2 证明预训练流匹配模型的速度场可以闭式换算成每步反向的后验均值；③ σ_P=σ_post·exp(δ_σ)，δ_σ 零初始化。三者合起来保证起点与预训练模型分毫不差。",
      formula: {
        lead: "起点＝预训练后验，辅助损失把均值锚住再逐渐松手：",
        unicode: "σ<sub>P</sub> = σ<sub>post</sub> · exp(δ<sub>σ</sub>),&nbsp;&nbsp;L<sub>aux</sub> = ‖μ<sub>P</sub> − μ<sub>FM</sub>‖²",
        symbols: [
          {
            sym: "μ<sub>FM</sub>",
            desc: "预训练流匹配模型给出的均值（冻结）"
          },
          {
            sym: "σ<sub>post</sub>",
            desc: "预训练模型对应的后验尺度（闭式，命题 2）"
          },
          {
            sym: "δ<sub>σ</sub>",
            desc: "尺度修正量，零初始化：起点分毫不差"
          },
          {
            sym: "L<sub>aux</sub>",
            desc: "均值对齐损失：λ=2.5，余弦退火到 0"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "无损起步",
          desc: "三件套让第 0 步的 NTM 就是预训练模型本身，不浪费任何预训练知识。"
        },
        {
          icon: "🔧",
          title: "先锚后放",
          desc: "均值对齐损失防早期发散（图 7），退火让模型后期自由学非高斯修正。"
        },
        {
          icon: "✨",
          title: "实战结果",
          desc: "微调 FLUX.2-klein（4B）得到 512² 少步文生图，DPG 83.38。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "效果、红利与边界",
      badge: "both",
      badgeLabel: "结果",
      bridge: "最后验收。成绩要连着步数一起看：NTM 是否同时拿到了「快」和「精确似然」？精确似然还额外送了什么？以及哪些事它还做不到。",
      analogy: {
        title: "论文图 1 · 4 步文生图",
        text: "上：从头训练（256²）；下：微调预训练流匹配模型（512²）。同一框架、两条路线，全部只用 <b>4 步去噪</b>。",
        figure: "/images/paper/qualitative_main.jpeg"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "成绩赛跑（连步数一起看）",
          desc: "点「开始比较」看各方法成绩条增长（每条都标注步数）。GenEval 越高越好；切到 ImageNet FID 注意方向反转——越低越好。下方论文图 9 是边界：T=1 时全部非高斯性压给浅搬运器，容量不够，严重退化。",
          componentId: "m10-race",
          figure: "/images/paper/failure_1step.png"
        },
        {
          kind: "module",
          id: "6.2",
          title: "精确似然的红利：轨迹分数去噪",
          desc: "似然可微 ⇒ 它的梯度就是整条轨迹的联合分数（命题 3），可对生成结果做一次整体修正。切换四种收尾方式看差别；再看论文图 7(c)：把这步蒸馏成学习去噪器 g_φ，0.20 → 1.88 img/s（约 9 倍），LPIPS 仅 0.121。",
          componentId: "m9-denoise",
          figure: "/images/paper/shallow_denoiser.png"
        }
      ],
      insight: "诚实的结论：4 步 GenEval 0.82 对归一化流家族是巨大跨越（前作 STARFlow 0.56 还要 256 步），也超过 SDXL、SD3-Medium 与 FLUX.1-dev，但距最强的 Qwen-Image 0.87 仍有差距；单步（T=1）精确似然生成仍是开放问题。",
      formula: {
        lead: "轨迹分数去噪：一次协方差加权的梯度修正，同时润色整条轨迹：",
        unicode: "x̂<sub>den</sub> = ( x̂ − S · ∇<sub>x̂</sub> L<sub>NTM</sub> ) / (1 − t)",
        symbols: [
          {
            sym: "∇ L<sub>NTM</sub>",
            desc: "精确 NLL 的梯度＝轨迹联合分数——放弃似然的方法拿不到"
          },
          {
            sym: "S",
            desc: "轨迹协方差矩阵：让各时间步互相纠错"
          },
          {
            sym: "1 − t",
            desc: "按时间缩放：越靠近成品端修正越直接"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "独有的组合",
          desc: "少步 + 精确似然同时成立——蒸馏、一致性、对抗方法都给不出。"
        },
        {
          icon: "🔧",
          title: "清楚的边界",
          desc: "T=1 退化（容量瓶颈）；位置/属性绑定仍弱；尚未做分布级后训练。"
        },
        {
          icon: "✨",
          title: "密度还能干什么",
          desc: "可计算的似然可用于异常检测、内容审计与更可控的编辑。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1gj1xBqEgR",
      title: "Normalizing Flow：Flow入门模型（NICE）",
      reason: "归一化流入门：可逆变换 + 换元公式（§2 的家族起点）"
    },
    {
      bvid: "BV1UuseewEVb",
      title: "Continuous Normalizing Flows（CNF）——连续标准化流",
      reason: "连续归一化流：连接「流」与 ODE 两种视角"
    },
    {
      bvid: "BV1tkxserE5V",
      title: "Flow Matching——流匹配",
      reason: "流匹配：NTM 的前向轨迹与预训练骨干所属的范式"
    },
    {
      bvid: "BV1Wv3xeNEds",
      title: "你一定能听懂的扩散模型 Flow Matching 流匹配基本原理深度解析",
      reason: "面向直觉的流匹配讲解，补足少步生成的背景"
    }
  ]
};
