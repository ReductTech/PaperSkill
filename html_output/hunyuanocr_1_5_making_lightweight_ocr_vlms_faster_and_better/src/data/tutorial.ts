import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "HunyuanOCR-1.5: Making Lightweight OCR VLMs Faster and Better",
    titleZh: "HunyuanOCR-1.5：让轻量 OCR 视觉语言模型更快、更强",
    venue: "arXiv:2607.04884v2 · 2026",
    authors: "Gengluo Li、Xingyu Wan、Shangpin Peng、Weinong Wang 等",
    affiliation: "中国科学院信息工程研究所 · 腾讯大语言模型部 · 南开大学",
    domain: "端到端 OCR · 视觉语言模型 · 推测解码 · 数据工程 · 强化学习",
    coreProblem: "把模型想成一位会誊写整页的轻量修复师：HunyuanOCR-1.0 已经能完成工作，但遇到长表格会写得慢、遇到稀有文字会看不懂，看到不合理的错词还可能“自作聪明”地改掉。1.5 要在约 1B、端到端、完整输出和目标模型最终裁决都不变的条件下，解决这三次失手。",
    coreInsight: "论文没有换掉主模型，而是给它三套更合适的工具：<b>先并行草拟、再由主模型盖章</b>的 DFlash；<b>先找能力缺口、再配材料与质检</b>的 Agentic Data Flow；以及<b>按任务选校对尺、用错词冲突查忠实性</b>的奖励设计与 CHAOS-Bench。",
    applicability: "更适合需要完整长结构输出的文档、表格和公式 OCR，以及存在明确低资源语言、古文字或多页理解缺口的轻量端到端场景；实际收益需要在目标后端、输出长度和并发条件下验证。",
    limitations: "DFlash 会增加草拟模型的训练与部署成本，短输出未必获得同等收益；Agentic Data Flow 仍依赖工具质量和人工复核；CHAOS 的 14.15 绝对召回仍低，不能承诺模型已经忠实或在所有协议下固定加速。",
    keywords: [
      "HunyuanOCR",
      "DFlash",
      "Agentic Data Flow",
      "IcePop",
      "CHAOS-Bench"
    ]
  },
  hero: {
    oldMethod: {
      desc: "1.0 已经会“看完整页并写出答案”，却还有三种失手：<b>长内容写得慢</b>、<b>稀有内容看不懂</b>、<b>把眼前错词擅自改对</b>。",
      componentId: "hero-restoration"
    },
    newMethod: {
      desc: "1.5 不换主干，而是逐一配工具：<b>DFlash 管“更快”</b>，<b>定向数据与训练管“更广”</b>，<b>任务奖励与 CHAOS 管“是否忠实”</b>。",
      componentId: "hero-restoration"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "为什么已经有 HunyuanOCR-1.0，还需要 1.5？",
      badge: "inf",
      badgeLabel: "研究问题",
      bridge: "HunyuanOCR-1.0 已经验证轻量端到端路线，1.5 并不是重新发明骨干。论文要在约 1B、端到端、完整输出和目标模型仍负责裁决的约束下，同时解决速度、能力边界与视觉忠实性。",
      analogy: {
        title: "能读完整页，不等于读得快、读得广、读得忠实",
        text: "<span class='concept-lead'>把 1.0 想成一位已经会上岗、但仍会三种失手的修复师。</span><span class='concept-chain'><b>长输出慢 → DFlash</b><i>·</i><b>长尾看不懂 → 定向数据与训练</b><i>·</i><b>擅自纠错 → 奖励与 CHAOS</b></span><span class='concept-payoff'>1.5 的内核，就是让每堵墙都有一项对应升级，同时不牺牲轻量、端到端和最终裁决权。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "亲手验证三堵墙与设计约束",
          desc: "<b>先选一堵墙，再试一次最直觉的办法。</b>你会看到“截短、换大模型、相信自动纠错”分别破坏了哪项约束；切到论文路线后，问题、方法和保留下来的条件会一一对上。",
          componentId: "motivation-lab"
        },
        {
          kind: "module",
          id: "1.2",
          title: "哪些是 1.0 的基础，哪些是 1.5 的扩展？",
          desc: "<b>把任务放回正确的历史位置。</b>蓝色表示 1.0 已有、1.5 继续增强；绿色表示 1.5 重点扩展；橙色表示新增的可靠性检查。这样不会把“模型会做”误说成“论文首次提出”。",
          componentId: "capability-scope"
        }
      ],
      insight: "<b>一眼记住论文：</b>不是换更大的主模型，而是让“慢、窄、不忠实”三类失败各自找到对应工具。",
      takeaways: [
        {
          icon: "🧩",
          title: "已有基础",
          desc: "1.0 已经证明轻量端到端 OCR 可以覆盖多种任务。"
        },
        {
          icon: "🧠",
          title: "三堵墙",
          desc: "长输出慢、长尾能力窄、语言先验可能覆盖视觉证据。"
        },
        {
          icon: "🧭",
          title: "对应升级",
          desc: "DFlash、数据与训练、奖励与 CHAOS 分别回答三类问题。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "约 1B 模型怎样先看清整页？",
      badge: "inf",
      badgeLabel: "推理基础",
      bridge: "研究问题明确后，先补齐理解后文所需的模型基础：长收据、密集正文、表格和图表怎样在紧凑模型中保留空间关系？答案是先按原生比例编码，再学习压缩视觉特征。",
      analogy: {
        title: "先铺开整张地图，再把关键信息压成路线卡",
        text: "<span class='concept-lead'>轻量模型最怕的不是页面大，而是一开始就把页面裁碎、丢掉布局关系。</span><span class='concept-chain'><b>保留原生比例</b><i>→</i><b>ViT 看清文字与布局</b><i>→</i><b>自适应 MLP 压成视觉 token</b></span><span class='concept-payoff'>先看清整页，再把看见的内容压紧交给语言模型。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "拖动放大镜读一整页",
          desc: "<b>拖动放大镜观察长收据、密集正文和表格区域。</b>画面先保留页面原有长宽与位置，再展示高分辨率特征怎样被压成更少的视觉 token；4K 是输入上限，不是把每页强行放大到 4K。",
          componentId: "native-resolution-lens"
        }
      ],
      insight: "<b>因果链：</b>原生比例保住空间关系，自适应压缩再控制 token 数量，所以轻量模型仍能看整页。",
      takeaways: [
        {
          icon: "🖼️",
          title: "原生比例",
          desc: "长图与密集页保持空间结构。"
        },
        {
          icon: "🔍",
          title: "4K 上限",
          desc: "为小字和复杂图表留出更多细节容量。"
        },
        {
          icon: "🧺",
          title: "学习压缩",
          desc: "自适应 MLP 把密集特征变成紧凑视觉 token。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "DFlash 为什么能减少串行等待？",
      badge: "inf",
      badgeLabel: "推理基础",
      bridge: "视觉特征已经进入语言模型，但长表格、公式和 Markdown 仍要自回归生成很多 token。DFlash 的关键不是跳过校验，而是让一次目标模型前向推进更多已验证 token。",
      analogy: {
        title: "草拟员先写 16 个，主审从第一个字开始盖章",
        text: "<span class='concept-lead'>普通解码像每写一个字就请主审一次；DFlash 改成先递交一整段草稿。</span><span class='concept-chain'><b>并行草拟 16 个</b><i>→</i><b>主模型找首个分歧</b><i>→</i><b>只收连续正确前缀</b></span><span class='concept-payoff'>如果第 10 个开始错，就一次接受前 9 个；后面即使碰巧正确，也不能跨过去。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "请你找出第一个分歧点",
          desc: "<b>现在你就是目标模型。</b>选择文本、公式或表格，再点击第一个与目标答案不一致的 token。画面会把它之前的候选连成绿色前缀，让你直接看到“接受长度”怎样决定一次前向能推进多远。候选序列是教学示意，正式速度结果来自论文表格。",
          componentId: "dflash-stepper",
          figure: "/images/dflash-mask.png"
        }
      ],
      insight: "<b>加速因果链：</b>一次提出多个候选 → 主模型一次校验 → 一次推进多个已验证 token；答案仍由主模型决定。",
      formula: {
        lead: "用一行记住草拟输入：目标隐藏状态给出锚点前上下文，mask query 同时提出一个块。",
        unicode: "ŷ₁:B = Draft(h<ₐ, m₁:B)",
        symbols: [
          {
            sym: "B",
            desc: "草拟块大小，论文实现为 16。"
          },
          {
            sym: "h<ₐ",
            desc: "锚点之前的目标模型隐藏状态。"
          },
          {
            sym: "m₁:B",
            desc: "草拟块的 B 个 mask query。"
          }
        ]
      },
      takeaways: [
        {
          icon: "⚡",
          title: "并行草拟",
          desc: "候选块不再逐 token 生成。"
        },
        {
          icon: "✅",
          title: "目标校验",
          desc: "最终接受权仍在目标模型。"
        },
        {
          icon: "📏",
          title: "前缀推进",
          desc: "一次前向推进多少取决于连续接受长度。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "为什么远处 token 权重更轻",
      badge: "both",
      badgeLabel: "数学机制",
      bridge: "理解草拟—验证循环后，再看训练目标：多个锚点块在一次前向中彼此隔离，越远的候选位置越难预测，因此位置权重按指数衰减。",
      analogy: {
        title: "离已知答案越远，草拟越像猜题",
        text: "<span class='concept-lead'>锚点附近有足够上下文，远处候选却要依赖更多尚未确认的内容。</span><span class='concept-chain'><b>位置更远</b><i>→</i><b>预测更不稳</b><i>→</i><b>训练权重指数衰减</b></span><span class='concept-payoff'>模型把更多学习力度放在更有把握的近端候选上。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "拖动 k 查看位置权重",
          desc: "<b>拖动 k，观察一个候选离锚点越来越远时会发生什么。</b>权重按 γ=7.0 逐步降低；锚点自身和无效位置不会参与损失。K=16 指一次训练序列里抽取 16 个彼此隔离的草拟起点。",
          componentId: "draft-weight-curve"
        }
      ],
      insight: "<b>训练直觉：</b>多锚点让一次前向练更多草拟任务，位置衰减避免远端的高不确定候选淹没可靠信号。",
      formula: {
        lead: "位置越远，权重越小；所有有效项再用 Z 归一化。",
        unicode: "wₖ = I[k>0]·I[valid]·exp(-max(k-1,0)/γ)；L_DFlash = (1/Z)ΣⱼΣₖwₖ[-log pθ(yₖ|h<ₐⱼ,m₁:B)]",
        symbols: [
          {
            sym: "K",
            desc: "每个序列的随机锚点数，论文实现为 16。"
          },
          {
            sym: "γ",
            desc: "位置衰减常数，论文实现为 7.0。"
          },
          {
            sym: "Z",
            desc: "所有有效位置权重之和。"
          }
        ]
      },
      takeaways: [
        {
          icon: "⚓",
          title: "多锚点",
          desc: "K=16 个独立草拟任务共用一次训练前向。"
        },
        {
          icon: "📉",
          title: "位置衰减",
          desc: "远处候选更难，权重按 γ=7 衰减。"
        },
        {
          icon: "🧊",
          title: "冻结目标",
          desc: "训练只更新约 90.7M 参数的草拟模型。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "Agentic Data Flow 为什么不是“随便找数据”？",
      badge: "both",
      badgeLabel: "方法系统",
      bridge: "更快只解决了部署的一半。为了变得更强，论文没有简单堆数据，而是把低资源语言、古文字、多图问答等薄弱点转成可执行的数据工程任务。",
      analogy: {
        title: "先圈出哪里破了，再找对应纸张、墨色和检查工具",
        text: "<span class='concept-lead'>“数据不够”太模糊，Agent 无法据此生产真正有用的样本。</span><span class='concept-chain'><b>写清能力缺口</b><i>→</i><b>寻找对应材料</b><i>→</i><b>工具质检</b><i>→</i><b>人工复核</b></span><span class='concept-payoff'>数据增长不再靠随机堆量，而是围绕具体弱点形成可复用管线。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "沿着能力缺口搭建数据管线",
          desc: "<b>先切换能力缺口，再逐步推进“定义缺口—寻找材料—工具质检—人工收口”。</b>画面不会让你猜标准答案，而会即时解释每一步为何由上一步决定；切换低资源语言、古文字或多页问答，可以比较三条管线怎样使用不同材料与检查。",
          componentId: "agentic-data-map"
        }
      ],
      insight: "<b>核心不是“Agent 自动找数据”：</b>而是把模糊弱点翻译成材料要求、质量门槛和人工可检查的生产流程。",
      takeaways: [
        {
          icon: "🎯",
          title: "弱点定向",
          desc: "数据要求来自具体能力缺口。"
        },
        {
          icon: "🛠️",
          title: "工具协同",
          desc: "搜索、清洗、验证和写脚本可由 Agent 组织。"
        },
        {
          icon: "👩‍🔬",
          title: "人在回路",
          desc: "工程师检查样例并决定约束与质量。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "Stage3、SFT 与 RL 各自解决什么？",
      badge: "trn",
      badgeLabel: "训练细节",
      bridge: "数据要求已经明确，接下来要把新能力注入模型又不遗忘旧能力。论文复用前两段预训练，只重规划 Stage3，再用 SFT 与 RL 逐步提高能力上限。",
      analogy: {
        title: "先保住旧手艺，再用干净范本打底，最后只练真正的难题",
        text: "<span class='concept-lead'>三阶段不是把同一批数据重复训练三遍，而是承担不同职责。</span><span class='concept-chain'><b>Stage3 扩边界</b><i>→</i><b>SFT 统一任务接口</b><i>→</i><b>RL 精修有信息难例</b></span><span class='concept-payoff'>旧数据回放防遗忘，坏样本和已稳定解决的样本则不继续浪费训练算力。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "拖动训练进程，切换观察视角",
          desc: "<b>拖动滑杆经过 Stage3、SFT 与 RL，再切换“看目标、看数据、看边界”。</b>你会直接看到三阶段不是重复训练：Stage3 用新数据和历史回放扩边界，SFT 用清洗样本统一接口，RL 用 16 次 rollout 中存在奖励差异的难例精修上限。",
          componentId: "training-stage-stepper"
        }
      ],
      insight: "<b>三段分工：</b>Stage3 决定模型能覆盖多远，SFT 决定任务接口是否干净，RL 把算力集中到仍有提升空间的难例。",
      takeaways: [
        {
          icon: "🧱",
          title: "复用基础",
          desc: "前两阶段不重做。"
        },
        {
          icon: "🌐",
          title: "扩大边界",
          desc: "Stage3 加入新数据、4K 与 128K。"
        },
        {
          icon: "🏋️",
          title: "精修上限",
          desc: "SFT 打底，RL 用难例与奖励继续优化。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "为什么不能用一个分数判断所有输出？",
      badge: "trn",
      badgeLabel: "训练细节",
      bridge: "同一种编辑距离无法同时判断正文、表格、图表、问答、翻译和长输出退化。HunyuanOCR-1.5 按任务路由奖励，再单独抑制过长与重复。",
      analogy: {
        title: "检查正文、表格和问答，就像批改语文、表格和证明题",
        text: "<span class='concept-lead'>一把编辑距离尺看不见表格结构，也判断不了问答是否真正回答了问题。</span><span class='concept-chain'><b>先识别输出类型</b><i>→</i><b>选择对应校对尺</b><i>→</i><b>过长或重复直接拦下</b></span><span class='concept-payoff'>奖励必须对准任务真正关心的事实、结构或语义。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "给不同输出选择正确校对尺",
          desc: "<b>先看答案属于哪种任务，再给它选校对尺。</b>正文比较字符，表格同时检查内容与结构，问答和翻译检查参考一致性；如果用错尺，界面会指出被漏掉的事实、结构或语义信息。",
          componentId: "reward-router"
        }
      ],
      insight: "<b>奖励的作用不是给所有答案排一个总分：</b>而是让不同输出按自己的正确性标准接受检查。",
      formula: {
        lead: "论文式 (8–9)：文档解析先分正文与特殊元素，再组合各自的奖励。",
        unicode: "R_parse = λ₁R_text + λ₂(1/M)ΣⱼR_elem(eⱼ)；表格 R_elem = 0.5R_content + 0.5R_struct",
        symbols: [
          {
            sym: "R_text",
            desc: "正文的归一化编辑距离奖励。"
          },
          {
            sym: "R_elem",
            desc: "表格或图表的元素特定奖励。"
          },
          {
            sym: "M",
            desc: "参考答案中的特殊元素数量。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🧾",
          title: "结构分治",
          desc: "正文、表格和图表使用不同匹配。"
        },
        {
          icon: "⚖️",
          title: "参考一致",
          desc: "问答与翻译由参考约束的 Judge 评分。"
        },
        {
          icon: "🛑",
          title: "抑制退化",
          desc: "过长或尾部重复直接得到零奖励。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "完整架构中谁负责答案，谁只负责加速？",
      badge: "trn",
      badgeLabel: "架构细节",
      bridge: "现在再看完整结构：Hunyuan-ViT、Adaptive MLP 和 Hunyuan-0.5B 构成端到端目标路径；DFlash 是草拟—校验加速旁路，不替代目标语言模型。",
      analogy: {
        title: "主修复师负责最终誊写，DFlash 助手只递草稿",
        text: "<span class='concept-lead'>理解模型时最容易犯的错，是把加速旁路误当成新的答案模型。</span><span class='concept-chain'><b>ViT 看整页</b><i>→</i><b>MLP 压特征</b><i>→</i><b>0.5B 语言模型写答案</b></span><span class='concept-payoff'>DFlash 从旁边提出候选，但每个可接受 token 都必须交回目标模型验证。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "点选组件，看激活路径",
          desc: "<b>沿着页面到答案的路径逐个点选组件。</b>主路径负责“看懂并写出”；点到 DFlash 时，路径会绕到旁路草拟候选，再返回目标语言模型校验。由此区分谁负责答案、谁只负责加速。",
          componentId: "architecture-map",
          figure: "/images/architecture.png"
        }
      ],
      insight: "<b>架构分工：</b>目标模型始终是作者和裁判，DFlash 只是一次多递几张草稿纸的加速助手。",
      takeaways: [
        {
          icon: "👁️",
          title: "视觉编码",
          desc: "原生分辨率保留布局。"
        },
        {
          icon: "🗜️",
          title: "连接压缩",
          desc: "自适应 MLP 形成紧凑视觉 token。"
        },
        {
          icon: "⚡",
          title: "辅助加速",
          desc: "DFlash 是草拟旁路，目标模型仍是裁判。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "当常识与图中文字冲突，应该相信谁？",
      badge: "trn",
      badgeLabel: "可靠性",
      bridge: "可靠性包含两个环节：训练端按输出类型选择奖励，减少‘看起来合理但不忠实’的答案；评测端用 CHAOS-Bench 把常见词改成无意义拼写，检查模型会照图抄录，还是被语言先验拉回正确单词。CHAOS 是检验方法，不是让模型变可靠的训练方法。",
      analogy: {
        title: "具体方法：训练时选对奖励，评测时故意制造冲突",
        text: "<span class='concept-lead'><b>训练端：</b>正文按字符匹配，表格同时检查内容与结构，问答和翻译按参考一致性评分，过长或重复输出直接拦截。</span><span class='concept-chain'><b>任务化奖励抑制错误偏好</b><i>→</i><b>每页改写 2–3 个常见词</b><i>→</i><b>检查无意义错词能否被整词抄出</b></span><span class='concept-payoff'><b>评测端：</b>每页先算扰动词召回，再对页面等权平均；因此 CHAOS 测的是视觉证据能否压过语言常识。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "具体方法：任务化奖励提升，CHAOS 负责检验",
          desc: "<b>先分清“怎样提升”和“怎样测量”。</b>训练时根据输出类型路由奖励：正文看字符，表格兼顾内容与结构，问答和翻译看参考一致性，过长或重复输出记为无效；评测时，CHAOS 每页把 2–3 个常见词改成无意义拼写，要求模型仍按图完整抄出。下面完成三页挑战，观察整词命中、单页召回和页面等权平均如何变化。",
          componentId: "chaos-inspector"
        }
      ],
      insight: "<b>最反直觉的一点：</b>语言模型越擅长猜出“合理单词”，在 OCR 中越可能覆盖图片真正写出的字符。",
      formula: {
        lead: "每页先计算扰动词命中率，再对页面取平均。",
        unicode: "Rᵢ = (1/|Pᵢ|)Σ_{w∈Pᵢ}I_hit(w,Oᵢ)；Recall_page = (1/N)ΣᵢRᵢ",
        symbols: [
          {
            sym: "Pᵢ",
            desc: "第 i 页的扰动词集合。"
          },
          {
            sym: "Oᵢ",
            desc: "模型对第 i 页的输出。"
          },
          {
            sym: "I_hit",
            desc: "大小写不敏感的整词命中指示。"
          }
        ]
      },
      takeaways: [
        {
          icon: "👀",
          title: "所见优先",
          desc: "OCR 首先忠实于视觉证据。"
        },
        {
          icon: "🧠",
          title: "先验会误导",
          desc: "合理词不一定是图中词。"
        },
        {
          icon: "⚠️",
          title: "仍有缺口",
          desc: "14.15 的绝对值说明可靠性远未解决。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "最后怎样读懂结果、适用条件与主要局限？",
      badge: "both",
      badgeLabel: "结果与限制",
      bridge: "最后用一套可复查的方法读结果：先锁定后端、输出长度、并发与指标方向，在同一协议内比较 AR 和 DFlash；再把真实需求逐项对照草拟模型、数据质量、人工复核和目标后端复测等条件，最后才给出‘适合、有条件或论文未证明’的结论。",
      analogy: {
        title: "具体方法：先锁定比较协议，再把需求对照证据边界",
        text: "<span class='concept-lead'><b>实验比较：</b>在同一后端和当前表格报告的条件内比较 AR 与 DFlash，再分别查看长度分组、并发分组和任务基准。</span><span class='concept-chain'><b>锁定协议与指标</b><i>→</i><b>只比较同表证据</b><i>→</i><b>需求对照采用前提</b></span><span class='concept-payoff'><b>部署判断：</b>写清输出长度、任务类型、后端与并发、能否部署草拟模型，再判断适合、有条件还是论文未证明。</span>",
        componentId: "restoration-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "具体方法一：固定协议，再读取实验结果",
          desc: "<b>速度实验先在 OmniDocBench 上固定推理后端和当前表格报告的 batch／并发条件，再比较自回归解码（AR）与 DFlash 的延迟。</b>随后分别查看输出长度分组与 vLLM 并发分组；能力和忠实性则各自遵循 OmniDoc 与 CHAOS 的指标。切换下方条件时，页面只生成同一协议内能够成立的结论。",
          componentId: "benchmark-race"
        },
        {
          kind: "module",
          id: "10.2",
          title: "具体方法二：把部署需求逐项对照论文条件",
          desc: "<b>先写清四项需求：输出长短、任务类型、目标后端与并发，以及能否训练并部署约 90.7M 参数的草拟模型。</b>再对照论文中的数据材料、工具质检、人工复核和实测协议，给出“适合采用、有条件采用或论文未证明”。每次误判都会立即指出遗漏的前提。",
          componentId: "deployment-boundary-lab"
        },
        {
          kind: "module",
          id: "10.3",
          title: "这套方案在什么条件下值得采用？",
          desc: "<b>读完这篇论文，请同时记住适用场景、采用前提和主要局限。</b>它更适合完整长结构输出或能够明确描述的能力缺口；落地需要草拟模型、可靠材料、工具质检、人工复核和目标环境实测；论文没有承诺固定加速倍率、零成本部署或绝对视觉忠实。",
          componentId: "final-boundary-summary"
        }
      ],
      insight: "<b>最终边界：</b>论文证明了轻量端到端 OCR 在特定协议下可以更快、更强；没有证明所有输出、后端和并发都固定加速，也没有证明视觉忠实性已经解决。",
      formula: {
        lead: "速度部分按样本延迟与总生成 token 计算，延迟越低越好，吞吐越高越好。",
        unicode: "Latency=(1/N)Σtᵢ；Token/s=Σcᵢ/Σtᵢ；Page/s=N/Σtᵢ",
        symbols: [
          {
            sym: "tᵢ",
            desc: "第 i 个样本的生成延迟（秒）。"
          },
          {
            sym: "cᵢ",
            desc: "第 i 个样本生成的 token 数。"
          },
          {
            sym: "N",
            desc: "样本数量。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🏎️",
          title: "适用场景",
          desc: "完整长结构输出，以及有明确数据缺口的轻量端到端 OCR。"
        },
        {
          icon: "🧰",
          title: "采用前提",
          desc: "可部署草拟模型，并具备任务材料、工具质检和人工复核。"
        },
        {
          icon: "🔭",
          title: "主要局限",
          desc: "收益依赖长度与协议，短输出不保证；CHAOS 绝对召回仍低。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1TySJBZExf",
      title: "HunyuanOCR：端到端 OCR 专家 VLM",
      reason: "直接介绍 HunyuanOCR 的能力与部署背景。",
      views: "1.3万播放"
    },
    {
      bvid: "BV1Q5KWzQEhn",
      title: "Speculative Decoding 实现方案",
      reason: "深入理解论文核心的草拟—校验加速机制。",
      views: "5130播放"
    },
    {
      bvid: "BV1bLFmeME1x",
      title: "视觉语言模型中的 OCR 与文档解析",
      reason: "补充 OCR VLM、定位与结构化解析的通用背景。",
      views: "1.4万播放"
    },
    {
      bvid: "BV1SPWozJEos",
      title: "相关 OCR VLM 的本地部署与实测",
      reason: "从相关模型理解端到端 OCR 的工程部署语境。",
      views: "1.4万播放"
    }
  ]
};
