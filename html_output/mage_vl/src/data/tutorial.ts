import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Mage-VL: Efficient Multimodal Foundation Model with Codec-Native Streaming",
    titleZh: "Mage-VL：高效的编解码器原生流式多模态基础模型",
    venue: "arXiv:2607.24904v1 · 2026",
    authors: "Senqiao Yang、Kaichen Zhang、Zhaoyang Jia 等",
    affiliation: "Microsoft",
    domain: "多模态视频理解与主动流式交互",
    coreProblem: "连续视频中，模型怎样同时解决“看哪里”和“何时说”？",
    coreInsight: "<b>一分钟内核：</b>利用视频编解码器已有的运动与残差信号判断<strong class=\"mvl-core-em\">“哪里发生了变化”</strong>，只把重要 patch 送进视觉编码器；在连续视频流中，再由轻量级认知门控判断<strong class=\"mvl-core-em\">“现在是否值得开口”</strong>，只有必要时才触发语言模型生成。",
    keywords: [
      "Codec-Native 筛选",
      "Shared 3D RoPE",
      "图像 · 视频 · 流式统一",
      "主动式 Cognition Gate"
    ]
  },
  hero: {
    oldMethod: {
      desc: "<b>采到一帧，就完整编码：</b>即使大部分背景几乎不变，每个采样帧仍会生成完整 patch grid，造成大量时空冗余。",
      componentId: "hero-football-comparison"
    },
    newMethod: {
      desc: "<b>只看变化，该说才说：</b>Codec-Native Patch Selection 决定<b>“看哪里”</b>，Cognition Gate 决定<b>“什么时候说”</b>。",
      componentId: "hero-football-comparison"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "均匀采帧：为什么重复编码会浪费 token？",
      badge: "inf",
      badgeLabel: "推理",
      bridge: "先把问题量化：当视频通过均匀采帧、并对每个采样帧进行稠密编码时，视频越长，多少视觉 token 被花在了重复的静态区域上？",
      analogy: {
        title: "每采一帧，都要把整片球场重新读一遍吗？",
        text: "传统方法会完整编码每个采样帧，即使大部分背景几乎没有变化；Mage-VL 则进一步追问：哪些区域真正带来了新的时间信息？",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "拖长视频，看看 Dense Visual Tokens 怎么增长",
          desc: "在论文的视频设置下，每帧对应 16×16=256 个 spatial visual tokens。调整采样帧数，观察 dense token 数如何随视频长度增加。",
          componentId: "dense-token-growth"
        }
      ],
      insight: "真正的问题不是“不能看更多帧”，而是更多帧会让大量静态区域被反复编码。",
      formula: {
        lead: "在论文的视频设置下，每帧对应 16×16=256 个 spatial visual tokens，因此：",
        unicode: "<span data-sym=\"N_visual\">N_visual</span> = <span data-sym=\"N_frame\">N_frame</span> × <span data-sym=\"N_token/frame\">N_token/frame</span><br/><span data-sym=\"N_token/frame\">N_token/frame</span> = 16 × 16 = 256",
        latex: "\\begin{aligned} N_{\\mathrm{visual}} &= N_{\\mathrm{frame}} \\times N_{\\mathrm{token/frame}} \\\\ N_{\\mathrm{token/frame}} &= 16 \\times 16 = 256 \\end{aligned}",
        interactiveLatex: "\\begin{aligned} \\htmlData{sym=N_visual}{N_{\\mathrm{visual}}} &= \\htmlData{sym=N_frame}{N_{\\mathrm{frame}}} \\times \\htmlData{sym=N_token_frame}{N_{\\mathrm{token/frame}}} \\\\ \\htmlData{sym=N_token_frame}{N_{\\mathrm{token/frame}}} &= 16 \\times 16 = 256 \\end{aligned}",
        symbols: [
          {
            sym: "N_visual",
            desc: "全部帧产生的 dense visual token 总数。"
          },
          {
            sym: "N_frame",
            desc: "采样帧数。"
          },
          {
            sym: "N_token/frame",
            desc: "每个采样帧产生的 spatial visual token 数：16×16=256。"
          }
        ]
      },
      takeaways: [
        {
          icon: "📈",
          title: "视觉 token 线性增长",
          desc: "采样帧越多，输入视觉 token 数随帧数线性增加。"
        },
        {
          icon: "🌱",
          title: "重复编码",
          desc: "静态区域也会反复进入视觉编码器。"
        },
        {
          icon: "🔎",
          title: "寻找变化",
          desc: "下一步需要先找到真正变化的区域。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "追着球看：I/P 帧、运动向量与残差",
      badge: "inf",
      badgeLabel: "推理",
      bridge: "要少看重复内容，先检查视频编解码器已经记录了哪些变化。",
      analogy: {
        title: "追球，不必每次重扫看台",
        text: "当局部内容发生位移时，codec 会用运动向量描述“这个区域从哪里预测过来”；如果预测后仍和真实画面不同，残差再记录没有解释掉的变化。",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "两帧进入 Codec 后，Motion 与 Residual 从哪来？",
          desc: "先拆开 HEVC 如何得到 Motion 与 Residual，最后再看 Mage-VL 如何复用已有侧信息形成 patch importance S。",
          componentId: "codec-signal-inspector"
        },
        {
          kind: "module",
          id: "2.2",
          title: "拖动预测块，亲手完成一次运动补偿",
          desc: "把从参考帧搬来的蓝色预测块拖向当前真实位置：Motion Vector 记录搬到哪里，Residual 显示搬运后仍未解释的差异。",
          componentId: "motion-compensation-lab"
        }
      ],
      insight: "HEVC 为了压缩视频，本来就要估计“哪里移动、哪里预测失败”；Mage-VL 不重新寻找变化，而是直接复用这些已有信号。",
      formula: {
        lead: "残差表示当前真实画面中没有被运动补偿预测解释掉的部分；残差大只说明这一块更难被时间预测解释，不等于出现了重要事件：",
        unicode: "<span data-sym=\"R\">R</span> = <span data-sym=\"I_current\">I_current</span> − <span data-sym=\"I_pred\">Î_pred</span>",
        latex: "R = I_{\\mathrm{current}} - \\hat{I}_{\\mathrm{pred}}",
        interactiveLatex: "\\htmlData{sym=R}{R} = \\htmlData{sym=I_current}{I_{\\mathrm{current}}} - \\htmlData{sym=I_pred}{\\hat{I}_{\\mathrm{pred}}}",
        symbols: [
          {
            sym: "R",
            desc: "残差；表示当前真实画面与运动补偿预测之间的差异。"
          },
          {
            sym: "I_current",
            desc: "当前真实画面。"
          },
          {
            sym: "I_pred",
            desc: "由参考画面经过运动补偿得到的预测画面。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🖼️",
          title: "参考与预测",
          desc: "I 帧独立提供完整场景；P 帧主要利用参考帧进行时间预测，只额外编码预测不能解释的变化。"
        },
        {
          icon: "↗️",
          title: "两种变化",
          desc: "运动提示位移，残差提示预测误差。"
        },
        {
          icon: "⚠️",
          title: "不是语义",
          desc: "编解码器信号描述变化，不直接等于事件含义。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "从变化信号到重要性：Codec 如何决定哪些 Patch 值得保留？",
      badge: "inf",
      badgeLabel: "推理",
      bridge: "Motion 与 residual 只描述“哪里发生了变化”。这一节进一步把 codec 的编码代价转换为 patch importance S，为后续 Top-k token selection 做准备。",
      analogy: {
        title: "哪里值得多说一句？",
        text: "解说员不框出“足球”或“球员”，而是在固定网格上把变化更强、编码更难的位置标得更亮；亮度表示优先看，不表示已经理解事件。",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "切换信号，看同一画面的重要性地图",
          desc: "保持同一时刻、同一球场坐标，依次查看 RGB、运动强度、残差能量与最终 patch importance 如何变化。",
          componentId: "importance-mode-switcher"
        }
      ],
      insight: "压缩系统为“哪里难预测”付出的比特，可以成为视觉模型的候选清单。",
      formula: {
        lead: "论文把 codec 派生的重要性写成覆盖时间与空间的非负张量：",
        unicode: "<span data-sym=\"S\">S</span> ∈ ℝ<sub>≥0</sub><sup><span data-sym=\"T\">T</span>×<span data-sym=\"H\">H</span>×<span data-sym=\"W\">W</span></sup>",
        latex: "S \\in \\mathbb{R}_{\\ge 0}^{T \\times H \\times W}",
        interactiveLatex: "\\htmlData{sym=S}{S} \\in \\mathbb{R}_{\\ge 0}^{\\htmlData{sym=T}{T} \\times \\htmlData{sym=H}{H} \\times \\htmlData{sym=W}{W}}",
        symbols: [
          {
            sym: "S",
            desc: "codec 派生的 patch-level importance／significance score，不是目标检测分数或语义真值。"
          },
          {
            sym: "T",
            desc: "时间维。"
          },
          {
            sym: "H",
            desc: "patch 网格高度。"
          },
          {
            sym: "W",
            desc: "patch 网格宽度。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🏷️",
          title: "重要性代理",
          desc: "编码代价形成 patch-level 排序代理，不是语义真值。"
        },
        {
          icon: "🧭",
          title: "信号到排序",
          desc: "Motion 与 residual 提供变化线索，编码代价进一步形成 Importance S。"
        },
        {
          icon: "🔢",
          title: "先排序",
          desc: "S 给 patch 排序，不直接生成答案。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "把聚光灯收窄：Top-k patch selection 与预算 B",
      badge: "inf",
      badgeLabel: "推理",
      bridge: "有了 patch 排名，还要用全局预算决定到底保留多少视觉 token。",
      analogy: {
        title: "预算有限，聚光灯应该照哪里？",
        text: "完整保留开场全景，再把剩余镜头给最有变化的局部，而不是整段丢掉某些时刻。",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "调整 token 预算，观察哪些 patch 留下",
          desc: "以 64 帧、每帧 256 patch 为基准，切换预算并观察保留率和 patch 覆盖如何变化。",
          componentId: "token-budget-selector"
        },
        {
          kind: "module",
          id: "4.2",
          title: "整帧丢弃，还是局部筛选？",
          desc: "同步播放同一事件，比较 frame-level 与 patch-level 的选择粒度。",
          componentId: "frame-patch-comparison"
        }
      ],
      insight: "Mage-VL 节省的不是时间轴本身，而是每个时刻不值得付费的空间区域。",
      formula: {
        lead: "选择规则可以概括为：先完整保留 I 帧，再让 P 帧高分 patch 填满预算。",
        unicode: "keep = all(<span data-sym=\"I\">I</span>) ∪ top<sub><span data-sym=\"B\">B</span>−|I|</sub>(<span data-sym=\"P\">P</span>, <span data-sym=\"S\">S</span>)",
        latex: "\\operatorname{keep} = \\operatorname{all}(I) \\cup \\operatorname{top}_{B-\\lvert I \\rvert}(P,S)",
        interactiveLatex: "\\operatorname{keep} = \\operatorname{all}(\\htmlData{sym=I}{I}) \\cup \\operatorname{top}_{\\htmlData{sym=B}{B}-\\lvert \\htmlData{sym=I}{I} \\rvert}(\\htmlData{sym=P}{P},\\htmlData{sym=S}{S})",
        symbols: [
          {
            sym: "I",
            desc: "I-frame 的全部 patch。"
          },
          {
            sym: "P",
            desc: "候选 P-frame patch。"
          },
          {
            sym: "B",
            desc: "全视频的视觉 token 总预算。"
          },
          {
            sym: "S",
            desc: "用于排序的 codec 重要性代理。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🧱",
          title: "保留锚点",
          desc: "I 帧完整保留，P 帧按 S 排名填预算。"
        },
        {
          icon: "¾",
          title: "约减 75%",
          desc: "论文示例把 16,384 个 token 压到 4,096。"
        },
        {
          icon: "🎯",
          title: "粒度更细",
          desc: "patch 级筛选保留时间轴上的局部变化。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "把标记钉回球场：Shared 3D RoPE",
      badge: "inf",
      badgeLabel: "推理",
      bridge: "patch 被挑散以后，还必须记得它原本出现在何时、何地。",
      analogy: {
        title: "留下几个镜头，也不能忘记来自哪里",
        text: "复盘员把稀疏标记钉回原来的比赛时间和球场坐标，避免把左路进攻说成右路。",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "一个 token 被选中后，原始 (t,x,y) 还在吗？",
          desc: "观察 Top-k patch 重新打包后，原始 (t,x,y) 坐标如何保留。",
          componentId: "rope-position-inspector"
        }
      ],
      insight: "稀疏不等于失去秩序：少量 token 仍可以共享原视频的时空坐标系。",
      formula: {
        lead: "每个被保留的 token 继续携带它在未剪枝网格中的原始坐标：",
        unicode: "(<span data-sym=\"t\">t</span>, <span data-sym=\"x\">x</span>, <span data-sym=\"y\">y</span>)",
        latex: "(t,x,y)",
        interactiveLatex: "(\\htmlData{sym=t}{t},\\htmlData{sym=x}{x},\\htmlData{sym=y}{y})",
        symbols: [
          {
            sym: "t",
            desc: "原始时间位置。"
          },
          {
            sym: "x",
            desc: "原始 patch 网格列。"
          },
          {
            sym: "y",
            desc: "原始 patch 网格行。"
          }
        ]
      },
      takeaways: [
        {
          icon: "📍",
          title: "保留原坐标",
          desc: "每个 token 都携带原始 (t,x,y)。"
        },
        {
          icon: "🧭",
          title: "共享位置系",
          desc: "Shared 3D RoPE 保持稀疏 token 的位置关系。"
        },
        {
          icon: "🚫",
          title: "不做重建",
          desc: "位置编码不会恢复被丢弃像素。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "切换导播画面：统一 image / video / stream 接口",
      badge: "both",
      badgeLabel: "推理 + 训练",
      bridge: "有序的稀疏视觉表示可以服务照片、离线录像和持续到来的直播流。",
      analogy: {
        title: "三种画面，都进同一个解说席",
        text: "导播切换单张定格、完整回放或连续信号，但核心解说路径不换人。",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "切换输入模式，观察共享路径和新增组件",
          desc: "三种输入共用 Mage-ViT → 两层 MLP → Qwen3-4B-Instruct-2507；连续流额外接入第 7 章的流式扩展。",
          componentId: "unified-input-router"
        }
      ],
      insight: "统一主干负责看懂输入；连续流还要进一步回答：状态如何累积，什么时候才触发语言生成？",
      takeaways: [
        {
          icon: "🔀",
          title: "共享主干",
          desc: "图像、视频和流共享视觉—语言路径。"
        },
        {
          icon: "⏱️",
          title: "增量进入",
          desc: "连续流按段进入系统。"
        },
        {
          icon: "➕",
          title: "流式扩展",
          desc: "记忆与门控位于共享主干之上。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "该举麦时才说：主动流式架构与 Cognition Gate",
      badge: "both",
      badgeLabel: "推理 + 训练",
      bridge: "连续视频不断到来时，EPFE 先把新证据写入感知记忆 M_per；Cognition Gate 再判断此刻应该保持沉默，还是触发回答。",
      analogy: {
        title: "一直看，不等于一直说",
        text: "回放桌持续更新比赛摘要；解说员保留最近可讲的画面，关键事件成立才抬起话筒。这像人的双系统：一个便宜的快系统先判断「有没有值得响应的事件」，有才启动慢而贵的深度理解与生成——前者是 Cognition Gate（System 1），后者是 Qwen 解码器（System 2）。",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "运行流式系统：一直看，什么时候说？",
          desc: "跟随视频段进入系统，观察 M_per 如何更新，以及 Gate 何时打开 Local N-window 与 Qwen。",
          componentId: "streaming-architecture-map"
        }
      ],
      insight: "M_per 用来决定该不该说，Local N-window 用来支持说什么。",
      formula: {
        lead: "推理时，Cognition Gate 把当前流式状态映射为说话概率，并与阈值比较：",
        unicode: "<span data-sym=\"p_speak\">p_speak</span> = g(<span data-sym=\"h_t\">h_t</span>), SPEAK if p_speak ≥ <span data-sym=\"τ\">τ</span>",
        latex: "p_{\\mathrm{speak}} = g(h_t), \\quad \\operatorname{SPEAK}\\;\\text{if}\\;p_{\\mathrm{speak}} \\ge \\tau",
        interactiveLatex: "\\htmlData{sym=p_speak}{p_{\\mathrm{speak}}} = g(\\htmlData{sym=h_t}{h_t}), \\quad \\operatorname{SPEAK}\\;\\text{if}\\;\\htmlData{sym=p_speak}{p_{\\mathrm{speak}}} \\ge \\htmlData{sym=tau}{\\tau}",
        symbols: [
          {
            sym: "p_speak",
            desc: "当前时刻触发回答的门控概率。"
          },
          {
            sym: "h_t",
            desc: "Cognition Gate 在当前时刻读取的流式状态。"
          },
          {
            sym: "τ",
            desc: "决定 SILENT 与 SPEAK 的推理阈值。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🧠",
          title: "递归感知",
          desc: "EPFE 融合新视频段与历史状态，持续更新 M_per。"
        },
        {
          icon: "🪟",
          title: "局部生成",
          desc: "语言模型只在触发后读取最近 N 段窗口。"
        },
        {
          icon: "🎙️",
          title: "门控触发",
          desc: "SILENT 时不启动生成；SPEAK 后才打开 Local N-window 与 Qwen。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "分阶段练习：两阶段 Mage-ViT + 五阶段 Mage-VL",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "理解系统如何持续感知并决定开口后，再看它如何被分阶段训练：先练视觉，再练多模态，最后只训练主动门控。",
      analogy: {
        title: "先练看球，再练解说，最后练何时开口",
        text: "七级训练阶梯分成两门相邻课程：前两级训练视觉编码器，后五级训练多模态系统。",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "先看两门课程，再走完七个训练阶段",
          desc: "每一步只回答三个问题：现在训练谁、为什么在此时训练、哪些组件保持冻结。",
          componentId: "training-curriculum-stepper"
        }
      ],
      insight: "Mage-ViT 先两步学会看，Mage-VL 再五步学会对齐、理解长视频，并最终学会何时开口。",
      formula: {
        lead: "最后的主动流式阶段冻结主干，只用类别加权的 token 交叉熵训练 Cognition Gate：",
        unicode: "L_gate = −Σ<sub>t</sub> <span data-sym=\"w_g\">w_{g_t}</span> log p(<span data-sym=\"g_t\">g_t</span> | g_{&lt;t}, <span data-sym=\"M_per\">M_per</span>)",
        latex: "\\mathcal{L}_{\\mathrm{gate}} = -\\sum_t w_{g_t} \\log p(g_t \\mid g_{<t}, M_{\\mathrm{per}})",
        interactiveLatex: "\\mathcal{L}_{\\mathrm{gate}} = -\\sum_t \\htmlData{sym=w_g}{w_{g_t}} \\log p(\\htmlData{sym=g_t}{g_t} \\mid g_{<t}, \\htmlData{sym=M_per}{M_{\\mathrm{per}}})",
        symbols: [
          {
            sym: "g_t",
            desc: "silent 或 speak 目标 token。"
          },
          {
            sym: "w_g",
            desc: "对应类别的权重，用于处理 speak 稀疏。"
          },
          {
            sym: "M_per",
            desc: "EPFE 递归维护、专供门控决策的感知记忆。"
          }
        ]
      },
      takeaways: [
        {
          icon: "👁️",
          title: "先练视觉",
          desc: "Mage-ViT 有两阶段视觉预训练。"
        },
        {
          icon: "🪜",
          title: "再练多模态",
          desc: "Mage-VL 随后进行五阶段课程。"
        },
        {
          icon: "🔒",
          title: "只训门控",
          desc: "最后阶段冻结视觉主干、EPFE 与语言模型。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "同样的视觉预算，应该怎么花？",
      badge: "inf",
      badgeLabel: "推理",
      bridge: "公平比较不是让两种方法接触相同数量的 source frames，而是先对齐送进昂贵 Vision Encoder 的名义视觉预算。",
      analogy: {
        title: "同一份视觉预算，完整看少量时间点还是稀疏看更多时间点？",
        text: "Frame-N 把预算花在 N 张完整 RGB 帧；tc-N 从 8N 个更密集时间点中挑出重要 patch，再打包成 N 个 codec canvases。",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "同预算，完整看少量时间点还是稀疏看更多时间点？",
          desc: "从同一段视频分叉：Frame-N 完整编码 N 个均匀采样时间点；tc-N 从 8N 个 source frames 中筛选重要 patch，再打包为 N 个 codec canvases。",
          componentId: "matched-budget-explorer"
        }
      ],
      insight: "Frame-N 是“少看几个时间点，但每次看完整”；tc-N 是“多看时间点，但每次只看变化”。Matched-budget 比较的是相近视觉编码预算下，哪种计算分配方式更有效。",
      formula: {
        lead: "论文先对齐送入 Vision Encoder 的名义视觉容量，关系可简写为：",
        unicode: "Frame-<span data-sym=\"N\">N</span> ↔ 8<span data-sym=\"N\">N</span> raw frames → tc-<span data-sym=\"N\">N</span>",
        latex: "\\operatorname{Frame}\\text{-}N \\;\\leftrightarrow\\; 8N\\;\\text{raw frames} \\to \\operatorname{tc}\\text{-}N",
        interactiveLatex: "\\operatorname{Frame}\\text{-}\\htmlData{sym=N}{N} \\;\\leftrightarrow\\; 8\\htmlData{sym=N}{N}\\;\\text{raw frames} \\to \\operatorname{tc}\\text{-}\\htmlData{sym=N}{N}",
        symbols: [
          {
            sym: "N",
            desc: "两种方案对齐的名义视觉画布容量。"
          }
        ]
      },
      takeaways: [
        {
          icon: "8×",
          title: "两种预算分配",
          desc: "Frame-N 完整看 N 个时间点；tc-N 稀疏看 8N 个时间点。"
        },
        {
          icon: "⚖️",
          title: "名义容量可比",
          desc: "两条路线送入视觉编码器的 nominal token workload 相近。"
        },
        {
          icon: "🎯",
          title: "预算重新分配",
          desc: "把完整编码静态区域的预算，转给更多时间点中的变化 patch。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "最终验收：结果与两条核心主线",
      badge: "inf",
      badgeLabel: "推理",
      bridge: "最后做两件事：比较同一任务上的准确率与耗时，再完整复述“看哪里”与“什么时候说”。",
      analogy: {
        title: "看完比分，再复盘两条战术",
        text: "先看这场比赛是否赢得更准、更快，再把“盯住变化区域”和“关键时刻才播报”从头走一遍。",
        componentId: "football-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "结果验证：是否又准又快？",
          desc: "选择一个表 5 任务，同时比较分数与耗时。",
          componentId: "verified-result-race"
        },
        {
          kind: "module",
          id: "10.2",
          title: "机制回顾：看哪里，什么时候说",
          desc: "沿两条主线走一遍，确认每个机制在信息流中的位置。",
          componentId: "core-lines-explainer"
        }
      ],
      insight: "Mage-VL 不是单纯压缩视频：视觉层选择性地看，交互层选择性地说。",
      takeaways: [
        {
          icon: "📋",
          title: "同任务读结果",
          desc: "分数与时间要放在同一任务、同一协议下阅读。"
        },
        {
          icon: "👁️",
          title: "选择性地看",
          desc: "Codec 信号引导 Importance S 与 Top-k patch selection。"
        },
        {
          icon: "🎙️",
          title: "选择性地说",
          desc: "感知记忆持续更新，Cognition Gate 决定何时生成。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1i5316SEbS",
      title: "4B凭什么干翻20B、32B？微软开源Mage模型家族全拆解",
      reason: "直接补充 Mage 模型家族与 4B 模型的整体背景，适合在教程前建立全局认识。"
    },
    {
      bvid: "BV1Ba4y1D7JY",
      title: "华为媒体编解码技术实验室主任 王晶：AI Codec研究进展与展望【RTE 2023】",
      reason: "从编解码器视角补充 AI Codec 背景，帮助理解 Mage-VL 为什么复用已有编码信号。"
    },
    {
      bvid: "BV1NP8xzrEDa",
      title: "【01】VLM视觉大模型~工作原理篇",
      reason: "补齐 VLM 视觉编码与语言对齐背景。",
      cover: "https://i0.hdslb.com/bfs/archive/babbf594552f68954b3bc28e21b16828fb6ebe0f.jpg",
      views: "2.7万播放"
    },
    {
      bvid: "BV1USRHYnEnW",
      title: "打造自己的智能监控系统：Qwen-VL + DeepSeek+本地数据库+摄像头 = 24小时的智能保安",
      reason: "观察连续视觉流应用，为主动响应建立直觉。",
      cover: "https://i0.hdslb.com/bfs/archive/ef06c7ff10945be6d7b9f40f45ae6a3a0a2fb88a.jpg",
      views: "6.2万播放"
    }
  ]
};
