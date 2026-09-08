import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "PaddleOCR-VL-1.6: Expanding the Frontier of Document Parsing with Under-Optimized Region Refinement and Progressive Post-Training",
    titleZh: "PaddleOCR-VL-1.6：用欠优化区域精修与渐进式后训练拓展文档解析的新边界",
    venue: "arXiv 预印本 (arXiv:2606.03264v1)",
    authors: "Zelun Zhang 等 15 位作者",
    affiliation: "百度 PaddlePaddle 团队 (PaddlePaddle Team, Baidu Inc.)",
    domain: "多模态文档解析 · OCR · 视觉语言模型 (VLM)",
    coreProblem: "强基线 PaddleOCR-VL-1.5 的剩余错误集中在欠优化区域——继续无差别堆数据效率低下，如何定向诊断并修复这些弱区？",
    coreInsight: "不再均匀扩展数据，而是从旧模型诊断出<b>边界脆弱</b>、<b>覆盖稀疏</b>、<b>监督不可靠</b>三类欠优化区域，定向补数据、修标签，再用 <b>CPT→SFT→RL</b> 的渐进式配方分阶段吸收。",
    keywords: [
      "文档解析",
      "OCR",
      "视觉语言模型",
      "欠优化区域",
      "GRPO"
    ]
  },
  hero: {
    oldMethod: {
      desc: "传统多步管线：检测、识别、规则拼装——环节多，误差逐级累积，复杂版式越改越乱。",
      componentId: "hero-old"
    },
    newMethod: {
      desc: "PaddleOCR-VL-1.6：0.9B 端到端文档解析，OmniDocBench v1.6 总分 <b>96.33</b> 登顶，一页出干净答案。",
      componentId: "hero-new"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "引言与总览：论文的路线与系统",
      badge: "inf",
      badgeLabel: "入门必读",
      bridge: "文档解析已成为非结构化文档与大模型应用之间的核心接口：系统要恢复的不只是纯文本，还有布局区域、阅读顺序、公式、表格、图表、印章与带坐标的文本实例——这些结构化结果决定文档能否被忠实转成 Markdown/JSON，供下游检索与推理使用。论文的回答是：剩余错误不是均匀噪声，而是集中在「欠优化区域」——边界脆弱、覆盖稀疏、监督不可靠三类局部区域；与其无差别堆数据，不如诊断弱区、定向修补，再沿两条路由（检索补数据、修正标签）修复后，用 CPT→SFT→RL 的渐进式配方分阶段优化。系统层面（论文 Overview）：PP-DocLayoutV3 负责布局分析（保持不变），PaddleOCR-VL-1.6-0.9B 负责逐区域识别（原生分辨率视觉编码器 + 自适应 MLP 连接器 + ERNIE-4.5-0.3B），两大任务——文档解析走两阶段管线，文本定位识别端到端完成；1.5 已拿到 OmniDocBench v1.6 总分 94.93 的强基线（官方榜单口径），1.6 的升级全部来自数据与后训练，架构未动。",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "论文原图：数据引擎总览",
          desc: "在进入细节之前先记住一点：1.6 与 1.5 用的是同一套架构，它所有的进步都来自数据与后训练——下面这张论文原图（图 3）画的正是这条路线：三类欠优化区域经诊断后，沿两条路由进入标注与训练。",
          figure: "images/fig-3-data-engine.png"
        },
        {
          kind: "module",
          id: "1.2",
          title: "欠优化区域",
          desc: "点击三种诊断出的欠优化区域（边界脆弱、覆盖稀疏、监督不可靠），或使用下方按钮，查看每类区域对应的诊断方法与补数据预算——错误扎堆在少数薄弱区域，定向修补才划算。",
          componentId: "mod-ch1-1"
        },
        {
          kind: "module",
          id: "1.3",
          title: "如何修复：两条路由",
          desc: "点击切换数据引擎的两条路由：边界脆弱与覆盖稀疏区域作为检索种子定向补数据，监督不可靠区域用于修正已有标签——看清三类区域分别流向哪里。",
          componentId: "mod-ch1-2"
        }
      ],
      insight: "剩余错误不是均匀的噪声，而是集中在少数“欠优化区域”——找到它们，就找到了最值得花钱补数据的地方。",
      takeaways: [
        {
          icon: "🎯",
          title: "解析是 RAG 的入口",
          desc: "文档解析把非结构化文档转成 Markdown/JSON，是检索增强生成（RAG）的高保真摄入基础。"
        },
        {
          icon: "🔧",
          title: "三类区域，两条路由",
          desc: "边界脆弱、覆盖稀疏、监督不可靠三类弱区，经「检索补数据」「修正标签」两条路由修复。"
        },
        {
          icon: "✨",
          title: "1.5 强基线，1.6 只做后训练",
          desc: "1.5 总分 94.93（官方榜单口径）；1.6 架构未动，改进全部来自数据引擎与后训练配方。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "边界脆弱分数：小扰动为何带来大漂移",
      badge: "both",
      badgeLabel: "通用",
      bridge: "上一章把“错误扎堆”的直觉变成了三类区域——本章回答：怎么用数字给“不稳定”打分？",
      analogy: {
        title: "同一输入，时对时错",
        text: "同一个样本换个写法，输出有时对、有时错——<b>不稳定</b>的样本，就是<b>边界脆弱</b>的样本。",
        componentId: "ana-theme"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "扰动一下，输出漂多远",
          desc: "拖动「扰动强度」滑块：稳定输出保持不变，边界脆弱输出迅速变乱——漂移大小用归一化编辑距离（NED）量化。",
          componentId: "mod-ch2-1"
        },
        {
          kind: "module",
          id: "2.2",
          title: "脆弱分数流水线：从 128 次预测到检索种子",
          desc: "用「下一步」走完脆弱分数流水线：8×16=128 次预测、8128 对编辑距离、最大 128 对平均，最后按分数取前 1% 作为检索种子。每一步的网格与标注保持连贯，上一步的结果留在画布上。",
          componentId: "mod-ch2-2"
        }
      ],
      insight: "不稳定是可以用数字描述的——同一个样本，扰动一加输出就漂多远，就是它有多“脆弱”。",
      takeaways: [
        {
          icon: "🎯",
          title: "小扰动，大漂移",
          desc: "边界脆弱 = 小扰动带来大输出变化，说明模型在这个样本附近的映射没学稳。"
        },
        {
          icon: "🔧",
          title: "脆弱分数怎么算",
          desc: "8 个晚期 checkpoint × 16 种扰动得到 128 次预测，两两比较共 8128 对，取最大的 128 对平均。"
        },
        {
          icon: "✨",
          title: "前 1% 成为检索种子",
          desc: "分数最高的前 1% 样本被当作检索种子，把补数据的预算引到最脆弱的地方。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "覆盖稀疏：长尾数据如何被发现",
      badge: "both",
      badgeLabel: "通用",
      bridge: "上一章找到了“时对时错”的样本；但还有一类错误得又稳又隐蔽——因为它们在数据里本就稀少，样本不够，模型自然学不会。本章回答：怎么找出这些覆盖稀疏的区域？",
      analogy: {
        title: "给长尾数据补样本",
        text: "长尾样本在数据里只有孤零零几条。从<b>数据池</b>里抽出同类样本补进去，让<b>稀疏的一栏</b>慢慢凑齐一组。",
        componentId: "ana-theme"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "抬升阈值：浮现稀疏簇",
          desc: "拖动相似度阈值 τ，观察相似度图如何渐进切分：阈值太低时稀疏区域被大簇“吸收”，阈值升高后孤立小簇自己浮出来——它们就是“该去哪里补数据”的区域。图中 14 个节点与相似度数值为示意示例，论文未公布特征编码器细节。",
          componentId: "mod-ch3-1"
        }
      ],
      insight: "长尾数据不是不存在，而是被主流分布“淹没”了——只要保留邻域连通性，它们就会在阈值升高时自己浮出来。",
      formula: {
        lead: "先用特征向量算两个文档像不像，再用阈值决定它们之间有没有边。",
        unicode: "s_ij = z_iᵀ z_j　　E = { (i, j) | s_ij ≥ τ }",
        symbols: [
          {
            sym: "s_ij",
            desc: "样本 i 与 j 的余弦相似度"
          },
          {
            sym: "z_i",
            desc: "第 i 个样本的归一化文档特征向量"
          },
          {
            sym: "E",
            desc: "相似度图的边集合"
          },
          {
            sym: "τ",
            desc: "相似度阈值，逐步抬升"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "覆盖稀疏的代价",
          desc: "覆盖稀疏 = 局部邻域样本太少，长尾模式被主流分布淹没"
        },
        {
          icon: "🔧",
          title: "渐进切分",
          desc: "相似度图渐进切分让孤立小簇自己浮现，不必强制每个样本入簇"
        },
        {
          icon: "✨",
          title: "补数据导航图",
          desc: "这些小簇就是“该去哪里补数据”的导航图"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "监督不可靠：标签也可能出错",
      badge: "inf",
      badgeLabel: "入门必读",
      bridge: "上一章补上了稀缺的样本；可如果训练数据里的「标签」本身就标错了，补进来的数据只会把模型越教越偏。本章先解决：怎么发现并修好不可靠的标签？",
      analogy: {
        title: "三份标签对一对",
        text: "标签也可能出错。拿<b>三份专家结果</b>与<b>原标签</b>逐一核对，把可疑的一处圈出来。",
        componentId: "ana-theme"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "三分支共识：保留、替换、精炼",
          desc: "用三种专家共识局面试一遍三分支规则：原标签得到支持就保留、至少两位专家一致就替换、全不一致就送入渲染引导的判定-修正循环——选择「全部不一致」会自动进行 T 轮修正，超过 T 轮仍不一致则转人工预标注。",
          componentId: "mod-ch4-1"
        }
      ],
      insight: "模型“稳定地错”，错的可能是标签而不是模型——先修标签，再练模型。",
      takeaways: [
        {
          icon: "🎯",
          title: "稳定的错未必是输入难",
          desc: "高置信度的稳定错误，可能源于标签不可靠而非输入难"
        },
        {
          icon: "🔧",
          title: "三分支规则",
          desc: "有专家支持就保留、至少两位专家一致就替换、全不一致就精炼"
        },
        {
          icon: "✨",
          title: "图图比对",
          desc: "渲染引导让“图文比对”变成“图图比对”，订正更准"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "高潜力样本挖掘与奖励设计",
      badge: "trn",
      badgeLabel: "训练细节",
      bridge: "第 1–4 章解决了数据从哪来（三类区域诊断 + 两条路由修复）。在进入最后的分阶段训练之前，RL 阶段还有一个特殊问题——哪些样本才配进 RL（筛选），每条输出收到什么样的可验证标量信号（奖励）。本章先把这两个问题解决，为下一章的分阶段配方备好 RL 的弹药。",
      analogy: {
        title: "挑选高潜力样本",
        text: "数据里，笔只圈出<b>最有潜力的样本</b>——不是全部重练，只把<b>值得的</b>挑进 RL 训练集。",
        componentId: "ana-theme"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "潜力缺口筛选：GRPO 样本挖掘",
          desc: "论文的四条淘汰线（太难、太易、潜力小、奖励平坦）各配一幅静态图，对照底部「选中」条件，看清什么样的样本才值得进入 RL 训练集。",
          componentId: "mod-ch6-1"
        },
        {
          kind: "module",
          id: "5.2",
          title: "奖励的三因子：有效性门 · 结构因子 · 相似度",
          desc: "三张静态图分别讲解有效性门、结构因子与相似度，最后相乘得到整条奖励——非法输出直接 0 分，结构瑕疵打折，再按任务指标计分。",
          componentId: "mod-ch6-2"
        }
      ],
      insight: "RL 数据要精选——只练那些已经偶尔能做对、但还不稳定的样本，收益才稳。",
      formula: {
        lead: "先用三个因子给每条输出打分，再用潜力缺口把值得练的样本挑出来。",
        unicode: "R_t(y, y*) = Valid_t(y) · Struct_t(φ_t(y)) · Sim_t(φ_t(y), φ_t(y*))<br/>Score(x) = ( r_max(x) − r_mean(x) ) · exp( α·U(x) + β·V_r(x) )",
        symbols: [
          {
            sym: "R_t",
            desc: "任务 t 的最终奖励"
          },
          {
            sym: "Valid_t",
            desc: "有效性门（0/1，非法输出直接 0 分）"
          },
          {
            sym: "Struct_t",
            desc: "结构因子（0~1 折扣）"
          },
          {
            sym: "Sim_t",
            desc: "任务相似度（TEDS / 1−NED / CDM / RMS-F1 / 加权 F1）"
          },
          {
            sym: "φ_t",
            desc: "任务 t 的规范化表示映射"
          },
          {
            sym: "Score(x)",
            desc: "高潜力分：学习潜力缺口 × 不确定性/方差加权"
          },
          {
            sym: "r_max(x)",
            desc: "16 条 rollout 的最高奖励"
          },
          {
            sym: "r_mean(x)",
            desc: "16 条 rollout 的平均奖励"
          },
          {
            sym: "U(x)",
            desc: "生成不确定性"
          },
          {
            sym: "V_r(x)",
            desc: "rollout 奖励方差"
          },
          {
            sym: "α",
            desc: "U 的权重（α=1）"
          },
          {
            sym: "β",
            desc: "V_r 的权重（β=2）"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "组内相对差异",
          desc: "GRPO 靠组内相对差异学习，样本必须“有差异可学”。"
        },
        {
          icon: "🔧",
          title: "高潜力分",
          desc: "高潜力分 = 潜力缺口 × 不确定性/方差加权，每任务取 top 8K。"
        },
        {
          icon: "✨",
          title: "三分因子",
          desc: "奖励 = 有效性门 × 结构因子 × 相似度，三个因子给模型明确的路标。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "分阶段后训练：CPT → SFT → RL",
      badge: "trn",
      badgeLabel: "训练细节",
      bridge: "数据就绪，RL 的样本与奖励也已备好。本章把整套后训练配方串起来——先用三个概念热身：<b>CPT（Continued Pre-Training，继续预训练）</b>用 1680 万样本把新分布与修正后的标签整体注入，<b>SFT（Supervised Fine-Tuning，监督微调）</b>只用 730 万样本精修，来源有三——UACS 挖掘的难样本、专家分歧进入渲染修正的样本、标签被修正的样本，<b>RL（Reinforcement Learning，强化学习）</b>只用上一章精选的 4.9 万高潜力样本做奖励驱动的最后优化。然后用下方步进器看它们的数据规模、学习率与总分贡献如何逐级变化。",
      analogy: {
        title: "先通读数据，再圈重点样本",
        text: "一支笔先把全部数据<b>通读</b>一遍，再回头把<b>重点样本</b>圈出来标注。",
        componentId: "ana-theme"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "分阶段训练配方：CPT → SFT → RL",
          desc: "逐步走完 CPT→SFT→RL 三个阶段，看数据规模、学习率与总分贡献如何逐级变化。RL 阶段还采用了 DAPO 的两个技巧：clip-higher（ε_high=0.28，只限制概率上升幅度）与动态采样（丢弃组内奖励零方差的组），保证每次更新都有信息量。",
          componentId: "mod-ch5-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "分层使用数据",
          desc: "CPT 管广度、SFT 管难度、RL 管潜力——按数据可靠性分层使用。"
        },
        {
          icon: "🔧",
          title: "每阶段都为正",
          desc: "消融显示每阶段都为正贡献：+0.69 / +0.63 / +0.08。"
        },
        {
          icon: "✨",
          title: "配方胜于参数",
          desc: "对 0.9B 小模型，数据配方比堆参数更值得投入。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "成绩单：96.33 与真实的局限",
      badge: "both",
      badgeLabel: "通用",
      bridge: "前面每一章都在拼装配方的一块；剩下的问题只有一个——拼出来的配方到底赢没赢，哪里没有赢。本章先用数据表展示经核验的对比，再摆出论文自己写明的局限，用一场真实但有边界的第一名收尾。",
      analogy: {
        title: "榜单揭晓，绿色最高",
        text: "榜单翻开，<b>绿色分数柱</b>从同一起点追到最高；小字还标着：<b>阅读顺序并非第一</b>——登顶之外，还有诚实的边界。",
        componentId: "ana-theme"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "成绩单对比：四项指标真实数据",
          desc: "切换指标查看静态柱状图：1.6 在四项「越高越好」指标上全部领先——总分与 TEDS、Real5 赢面大，CDM 仅险胜——而论文自己写明的局限（RL 增益小、阅读顺序非最优、内部基准不可复现）也一并陈列。成绩单口径：OmniDocBench v1.6 相比 v1.5 新增了 MGAM（多粒度自适应匹配，消除分段粒度偏差）与 296 页困难子集，评分更严。下方论文原图（图 1）为 OmniDocBench v1.6 排行榜官方口径成绩。",
          componentId: "mod-ch7-1",
          figure: "images/fig-1-metric.png"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "双榜登顶",
          desc: "OmniDocBench v1.6 总分 96.33 与 Real5 93.19 双双登顶。"
        },
        {
          icon: "🔧",
          title: "消融归功",
          desc: "消融把功劳说清楚：CPT +0.69、SFT +0.63、RL +0.08。"
        },
        {
          icon: "✨",
          title: "诚实边界",
          desc: "阅读顺序非最优、内部基准不可复现、RL 余量有限——强基线上每一步都更贵。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1ueEB6uEeT",
      title: "2026 OCR工具排行榜：PaddleOCR-VL、MinerU、Docling谁才是第一？",
      reason: "横向对比主流文档解析工具，帮助理解本文所处的竞赛格局。",
      cover: "https://i2.hdslb.com/bfs/archive/58bd767e8103e9b869cd8dc117eafcba110448e3.jpg",
      views: "3.1万播放"
    }
  ]
};
