import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Scaling Properties of Text Conditioning in Visual Generation",
    "titleZh": "视觉生成中文本条件化的缩放特性",
    "venue": "arXiv preprint (ByteDance Seed), 2026",
    "authors": "Zilong Chen, Chaorui Deng, Kunchang Li, Hongyi Yuan, Haoqi Fan",
    "affiliation": "ByteDance Seed",
    "domain": "文生图生成 · 扩散模型 · 文本条件缩放定律",
    "coreProblem": "文本生成图像的缩放长期只盯模型、数据与算力；加长自然语言提示词并不能带来更多可用监督，所有被评估的开放权重模型随提示词变长反而低于自己的短提示基线。",
    "coreInsight": "文生图的收敛训练损失与提示词长度无关，只取决于两点关键性质：<br/>白盒 GPG（图像落地信息）→ 损失线性下降；黑盒 ED（有效细节度）→ 损失幂律下降<br/>质量评估分两轴：结构化提示词提升可扩散性，专业化训练的 LLM 提示器提升可提示性。",
    "keywords": [
      "结构化提示词",
      "GPG",
      "Effective Detailness",
      "可扩散性",
      "可提示性",
      "缩放定律",
      "OPSD"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "把提示词从 400 字写到 2100 字——五个开放权重模型全部低于自己的短提示基线（Figure 1，GSB vs own shortest，N=150）",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "同一骨干逐级恢复结构化字段：重建指标持续改善；端到端 GenEval2 GM 72.5 vs 匹配 NL 56.2（Table 2，higher-is-better）",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "越长的提示词，画得越差吗",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "文本生图的缩放故事里，提示词一直被当作固定配角。本章先亲手做一件最直觉的事——把提示词写长——看看会发生什么。",
      "analogy": {
        "title": "写得长，不如写得准",
        "text": "客户把单据从一段话改写成三页散文，画师却画不出新东西——<b>纸变长了，信息没有变多</b>。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "长度阶梯：五个模型的共同命运",
          "desc": "拖动滑杆改变提示词长度，并用芯片切换「散文」与「结构化」两种写法。右侧是论文 Figure 1 的核心读数：每个模型都和自己的最短提示比。数据取自 Figure 1（GSB 净偏好，N=150，关闭一切提示增强器）。",
          "componentId": "m-1-1"
        }
      ],
      "insight": "单据的价值不在字数，而在<b>图像落地信息</b>——需要一种把信息显式组织起来的表示。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "加长无效",
          "desc": "加长散文式提示词，五个开放权重模型全部低于自己的短提示基线。"
        },
        {
          "icon": "🔧",
          "title": "信息才是变量",
          "desc": "画得准的前提是单据里有「图像落地信息」。"
        },
        {
          "icon": "✨",
          "title": "引出问题",
          "desc": "信息量如何度量、如何提升？这是后续所有章节的主线。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "结构化提示词 SP",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "既然「字数」无效，就要换一种写法。论文的答案是结构化提示词（SP）：一张类型化的 JSON 单据，把图像信息装进命名字段。",
      "analogy": {
        "title": "给每个视觉变量一个名字",
        "text": "场景、物件、关系各归其栏——<b>每个变量都有字段名，画师可以逐项对照</b>。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "点开 SP：三个作用域",
          "desc": "点击右侧伪 JSON 卡上的三个字段组，左侧客厅场景会同步高亮对应区域。示例取自论文 Figure 5 的客厅标注（沙发 bbox 28 564 464 786、depth 159 等）。",
          "componentId": "m-2-1"
        }
      ],
      "insight": "把「写得好」变成「<b>填得全</b>」——字段的完备度成了可以逐级控制、逐级度量的量。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三个作用域",
          "desc": "SP 用全局字段、逐元素条目、跨元素关系把图像信息组织成命名字段。"
        },
        {
          "icon": "🔧",
          "title": "可寻址",
          "desc": "每个物件有 id、属性、bbox、深度；物件之间有关系。"
        },
        {
          "icon": "✨",
          "title": "可度量",
          "desc": "字段化之后，「信息量」才能被逐级打开与测量。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "信息量，而非长度",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "长度与信息在上一章还只是猜想。论文用固定骨干重建探针把它们拆成两个变量：同一份标注，两种写法，一条分水岭。",
      "analogy": {
        "title": "同源内容，两种写法",
        "text": "同一份标注，写成散文重建纹丝不动；写成结构化清单，<b>每恢复一组字段就更像一点</b>。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "重建探针：散文平线 vs 清单上行",
          "desc": "按「开始」，两个面板同时从 L5 走到 L10。左：同内容拉长的自然语言；右：逐级恢复字段的结构化清单。指标为 DINOv3 余弦（越高越好），取自论文 Figure 3 的实测值。",
          "componentId": "m-3-1"
        }
      ],
      "insight": "需要一个能把「信息量」变成<b>数字</b>的度量——否则我们只能讲故事。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分化出现",
          "desc": "固定骨干与种子：NL 拉长重建持平，SP 恢复字段持续改善。"
        },
        {
          "icon": "🔧",
          "title": "两个变量",
          "desc": "把「长度」与「信息」拆开，因果才看得清。"
        },
        {
          "icon": "✨",
          "title": "下章预告",
          "desc": "给信息量一个可计算的刻度。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "GPG：看了图才写得出的词",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "第一条刻度是白盒的：借用冻结视觉语言模型的逐词概率。哪些词是「看了图像才写得出的」？把它们的似然增益加起来，就是 GPG。",
      "analogy": {
        "title": "哪些词是「看图写的」",
        "text": "给判官模型看图，它对哪些词更有把握？<b>似然提升之和，就是这条单据的 GPG</b>。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "逐词增益：GPG 计量台",
          "desc": "两句话是同一个意思：灰色口语词不看图也写得出，橙色信息词只有看图才写得出来。逐词点击替换，观察接地词比例、GPG（nats）与有图 logp 如何随之上升。GPG 为示意刻度，真实量程见第 5 章（100–220 nats）。",
          "componentId": "m-4-1"
        }
      ],
      "insight": "白盒度量要读模型的概率——如果只有黑盒 API 呢？下一章给出第二把尺子。",
      "formula": {
        "lead": "把「看了图像之后描述变得多确定」逐词加起来：",
        "unicode": "GPG(y, I) = Σ<sub>t=1..T</sub> m<sub>t</sub> · [ log p<sub>M</sub>(y<sub>t</sub> | I, y<sub>&lt;t</sub>) − log p<sub>M</sub>(y<sub>t</sub> | ∅, y<sub>&lt;t</sub>) ]",
        "symbols": [
          {
            "sym": "y<sub>t</sub>",
            "desc": "描述的第 t 个 token（经规范化与内容掩码处理）"
          },
          {
            "sym": "m<sub>t</sub>",
            "desc": "内容掩码：1 表示该 token 计入求和"
          },
          {
            "sym": "p<sub>M</sub>",
            "desc": "冻结判官 VLM（Qwen3.5-397B-A17B）的似然"
          },
          {
            "sym": "I / ∅",
            "desc": "配对图像 / 匹配的无图对照遍"
          },
          {
            "sym": "GPG",
            "desc": "逐词似然增益之和（nats；30,000 图均值）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "求和结构",
          "desc": "GPG = 有图似然 − 无图似然，逐内容词求和。"
        },
        {
          "icon": "🔧",
          "title": "操作性估计",
          "desc": "它是互信息的操作性估计，判官与模板全程固定。"
        },
        {
          "icon": "✨",
          "title": "长度警告",
          "desc": "GPG 是 token 和，会随长度增长——解读时必须与 ED 互校。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "ED 与两条缩放律",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "第二条刻度 ED 不需要读概率：把描述里的属性逐条与图像参考对账即可。论文的标题级发现在这里——收敛损失随这两把尺子可预测地下降。",
      "analogy": {
        "title": "属性对账单",
        "text": "说了的属性画面里要有（精确率），画面里的属性单据要提到（召回率）——<b>F₀.₅ 偏重前者</b>。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "两条拟合线：线性 GPG，幂律 ED",
          "desc": "用芯片切换横轴度量，再沿论文发布的拟合曲线移动配置点。曲线由论文 Eq.(3)/(4) 的拟合式直接画出（15 个受控配置，BAGEL 骨干，2.84×10¹⁰ image tokens）；每配置仅训练一次，误差带反映设置重采样敏感性而非置信区间。",
          "componentId": "m-5-1"
        }
      ],
      "insight": "两条律只在<b>标定过的配方与量程内</b>成立——它是经验规律，不是普适定理。",
      "formula": {
        "lead": "属性层面的第二把尺子，以及它对损失的预测：",
        "unicode": "ED(y, I) = F<sub>0.5</sub>(P<sub>A</sub>, R<sub>A</sub>)　；　MSE = 0.4200 · ED<sup>−0.2073</sup> (r = −0.971)",
        "symbols": [
          {
            "sym": "P<sub>A</sub>",
            "desc": "描述侧属性精确率（说了的属性，图像里有没有）"
          },
          {
            "sym": "R<sub>A</sub>",
            "desc": "图像侧属性召回率（图像里的属性，描述提没提）"
          },
          {
            "sym": "F<sub>0.5</sub>",
            "desc": "偏重精确率的 F 值（惩罚「说了却没有」更重）"
          },
          {
            "sym": "MSE",
            "desc": "收敛扩散损失（越低越好）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "黑盒可用",
          "desc": "ED 用 F₀.₅ 综合属性精确率与召回率，不需要模型概率。"
        },
        {
          "icon": "🔧",
          "title": "两条律",
          "desc": "收敛损失：GPG 线性（r=−0.984）、ED 幂律（r=−0.971）。"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "规律可筛选配置，但绑定配方与骨干——不可外推为普适定理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "可提示性：学徒填单",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "训练时有图像帮忙造单，推理时只有客户的一句话。谁来把单填满？一位 LLM 学徒。论文把这一侧的能力叫可提示性（promptability）。",
      "analogy": {
        "title": "一句话，一张单",
        "text": "客户只说一句，学徒要把场景、物件、关系<b>合理补全</b>——猜可以，但不能违背明确要求。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "从请求到 SP：明确与补全",
          "desc": "把细节芯片拖进三个字段格（也可以先点芯片再点格子）。蓝色芯片是用户明确要求，紫色芯片是学徒推断补全；把「雨夜」拖进白天的场景会被判为违规——补全不得违背明确请求。",
          "componentId": "m-6-1"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "只换学徒：规模阶梯的两个端点",
          "desc": "切换提示器规模与推理模式。论文只发布了思维链模式下两个已验证端点（GenEval++ 46.4% → 86.8%），未发布中间规模的逐级数值，因此这里只展示端点条；0.8B+思维链是论文标注的例外组合（易陷入循环、难产合法 JSON）。",
          "componentId": "m-6-2"
        }
      ],
      "insight": "表示（f）与提示器（π）缺一不可——论文把它们合起来画成 Quality = Diffusability × Promptability（<b>概念框架，非拟合公式</b>）。",
      "formula": {
        "lead": "把两个因子放在一个式子里记住分工（示意图，不是乘法定律）：",
        "unicode": "Quality(f, π) = Diffusability(f) × Promptability(f, π)",
        "symbols": [
          {
            "sym": "f",
            "desc": "描述接口（含其暴露的字段组）"
          },
          {
            "sym": "π",
            "desc": "LLM 提示器"
          },
          {
            "sym": "标注",
            "desc": "论文明确说明这是概念框架，不是拟合出的乘法质量律"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "无图可抄",
          "desc": "推理时没有配对图像：提示器要把请求变成填满的 SP。"
        },
        {
          "icon": "🔧",
          "title": "补全的纪律",
          "desc": "明确要求不可违背；合理补全正是能力本身。"
        },
        {
          "icon": "✨",
          "title": "两个因子",
          "desc": "端到端质量 = 表示侧 × 提示器侧（概念框架）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练侧：字段阶梯与三段修行",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "监督从哪来？论文用五阶段标注流水线把每张训练图像变成全量 L10 结构化单据，再确定性降级出 L5–L9——只控制暴露哪些字段组，不重新标注。零样本学徒能填单但填不满，论文于是给学徒安排三段修行——SFT、冷启动、验证器门控的 OPSD——再在柜台加一条精炼-渲染-评审循环。",
      "analogy": {
        "title": "逐级点亮字段",
        "text": "每个级别都是同一份 L10 标注的<b>确定性投影</b>——不重新标注，只控制暴露哪些字段组。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "L5→L10：每组字段值多少",
          "desc": "用上一步/下一步在六级之间步进。左：单据上被恢复的字段组；右：该级别训练出的 BAGEL 画师的生成质量（GenEval2 GM 与对 L5 的 GSB，取自论文 Table 1；注意这些数值与 Table 2 的 Qwen-Image 系统不可比）。",
          "componentId": "m-7-1"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "学徒的三段修行（类比）",
          "desc": "训练方法的动画隐喻：先学「长什么样」（SFT），再学「怎么推出来」（冷启动），最后<b>在自己被采纳的作业上被逐字蒸馏</b>（门控 OPSD）。",
          "componentId": "ana-9"
        },
        {
          "kind": "module",
          "id": "7.3",
          "title": "三段训练，各管一段",
          "desc": "步进观察每个训练阶段的边际贡献（结构分与 GSB，取自论文 Table 4；离线 GPT-5.4 评审，GSB 为双序净偏好，N=150）。可用芯片切换两种对照 RFT 信号。",
          "componentId": "m-9-1"
        },
        {
          "kind": "module",
          "id": "7.4",
          "title": "Tmax：多一轮值多少",
          "desc": "拖动滑杆改变评审循环的最大轮数 Tmax，并切换零样本/训练后提示器。全部八组数值直接取自论文 Table 5（在线 Gemini 评审 6/10 阈值，离线 GPT-5.4 终评）。",
          "componentId": "m-9-2"
        }
      ],
      "insight": "标注流水线解决「监督从哪来」——<b>VLM 管语义，专家管几何，最后由 VLM 汇编成单</b>；训练抬高起点，循环修正残余——<b>先训好，再少绕路</b>。",
      "formula": {
        "lead": "被接受的轨迹上，把「看图教师」的逐字偏好蒸给「无图学生」：",
        "unicode": "L<sub>OPSD</sub>(θ) = E<sub>τ 被接受</sub> [ (1/|T<sub>τ</sub>|) Σ<sub>t∈T<sub>τ</sub></sub> D<sub>KL</sub>( π⋆(·|τ<sub>&lt;t</sub>, prompt, I) ∥ π<sub>θ</sub>(·|τ<sub>&lt;t</sub>, prompt) ) ]",
        "symbols": [
          {
            "sym": "τ",
            "desc": "学生自己 rollout、且被验证器接受的轨迹"
          },
          {
            "sym": "π⋆ / π<sub>θ</sub>",
            "desc": "冻结的图像条件教师（看到参考图 I）/ 无图学生提示器（只更新它）"
          },
          {
            "sym": "D<sub>KL</sub>",
            "desc": "逐 token KL 散度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "确定性投影",
          "desc": "L5–L9 是 L10 的确定性投影，比较只改变暴露的字段组。"
        },
        {
          "icon": "🔧",
          "title": "单调上升",
          "desc": "GenEval2 GM 46.79→57.70、GSB 至 +26.0%，逐级单调。"
        },
        {
          "icon": "✨",
          "title": "大头在哪",
          "desc": "全局场景上下文与包围盒是贡献最大的两组字段。"
        },
        {
          "icon": "🎓",
          "title": "三段分工",
          "desc": "SFT 学分布、Cold-start 学推导、门控 OPSD 蒸馏收尾。"
        },
        {
          "icon": "🛡️",
          "title": "守门纪律",
          "desc": "验证器宁可少收不可错收；教师看图、学生无图。"
        },
        {
          "icon": "⚡",
          "title": "快速饱和",
          "desc": "Tmax=8 平均也只有 2.31 轮——增益迅速饱和。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "全流程架构",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "把前面所有零件装回一面墙：标注室、测量室、训练室与委托台。训练时图像造单，推理时请求造单——SP 是两个方向共用的接口。",
      "analogy": {
        "title": "一张画的完整旅程",
        "text": "训练时图像造单；推理时请求造单——<b>SP 是两个方向共用的接口</b>。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "画室流程墙：点哪儿亮哪儿",
          "desc": "点击墙上任意节点查看它的职责与关键数字，或按「播放流程」沿数据流走一遍。五阶段标注取自论文 Figure 8（Seed-VL 全局语义、Sapiens 133 姿态关键点、DepthAnything V2 深度、SAM 2.1 分割），评审循环取自 Figure 14（PASS 阈值 6/10）。",
          "componentId": "m-8-1"
        }
      ],
      "insight": "架构不变——<b>变的是流进扩散器的单据</b>。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "五阶段标注",
          "desc": "五阶段标注 + 字段降级构造训练监督。"
        },
        {
          "icon": "🔧",
          "title": "共用接口",
          "desc": "训练与推理共用 SP 接口，方向相反。"
        },
        {
          "icon": "✨",
          "title": "零架构改动",
          "desc": "骨干网络零改动，改的是条件表示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "评选会：结果、对照与局限",
      "badge": "both",
      "badgeLabel": "综合",
      "bridge": "把所有因子合到一起：端到端系统在几乎所有报告指标上领先开放权重模型并匹配或超过最强闭源系统。而最有说服力的，是那个「同预算换回自然语言重训」的匹配对照。",
      "analogy": {
        "title": "同题四作",
        "text": "换回自然语言重训（匹配对照）拿不到这个分数——<b>接口本身就是变量</b>。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "五项指标，一条证据链",
          "desc": "按「开始比较」触发竞赛，或用芯片切换指标。四名参赛者共用同一 Qwen-Image 骨干家族；全部数值取自论文 Table 2（均为越高越好），协议细节见论文附录 D。",
          "componentId": "m-10-1"
        }
      ],
      "insight": "好的表示让<b>所有下游环节</b>受益——度量、训练、提示与评审从此说同一种语言。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "端到端领先",
          "desc": "GenEval2 GM 72.5 vs 匹配 NL 56.2，CoReBench 85.2 vs 76.1。"
        },
        {
          "icon": "🔧",
          "title": "归因清晰",
          "desc": "匹配对照证明：收益来自结构化接口，而非额外训练。"
        },
        {
          "icon": "✨",
          "title": "知道边界",
          "desc": "配方与骨干特定、经验规律非定理；推理循环快速饱和。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-11",
      "title": "论文总结",
      "badge": "both",
      "badgeLabel": "总结",
      "bridge": "十个章节走完，回到封面那句论题收束全程：损失看什么、质量怎么评、两个干预各自改变哪一轴、证据有多硬、边界在哪里。",
      "analogy": {
        "title": "三个镜头收束全程",
        "text": "镜头①②是两条缩放律（GPG 线性、ED 幂律），镜头③是两个干预各对一轴——<b>整篇论文就是这三个镜头的完整展开</b>。",
        "componentId": "ana-11"
      },
      "modules": [],
      "insight": "一句话带走：<b>文生图的收敛损失与提示词长度无关，只由 GPG 与 ED 决定；SP 与 LLM 提示器分别抬高可扩散性与可提示性</b>。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "核心发现",
          "desc": "收敛损失随 GPG 近似线性（r=−0.984）、随 ED 呈幂律（MSE∝ED^−0.207，r=−0.971）——与 token 数无关。"
        },
        {
          "icon": "⚖️",
          "title": "评估双轴",
          "desc": "可扩散性（给定 SP 的画质上限）与可提示性（LLM 产出合法优质 SP 的能力）共同决定端到端质量。"
        },
        {
          "icon": "🔧",
          "title": "两个干预",
          "desc": "结构化提示词：GenEval2 GM 72.5 vs 匹配 NL 56.2；门控 OPSD 训练的 LLM 提示器：GenEval++ 46.4% → 86.8%。"
        },
        {
          "icon": "🏗️",
          "title": "监督与训练",
          "desc": "五阶段标注产出 L10 全量单据，确定性降级构造 L5–L9；SFT 学分布、Cold-start 学推导、门控 OPSD 蒸馏收尾。"
        },
        {
          "icon": "🧭",
          "title": "适用边界",
          "desc": "经验规律非普适定理；配方与骨干特定；推理循环快速饱和（Tmax=8 平均仅 2.31 轮）。"
        }
      ]
    }
  ]
};
