import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Mega-ASR: Towards In-the-wild2 Speech Recognition via Scaling Up Real-world Acoustic Simulation",
    "titleZh": "Mega-ASR：以大规模真实声学仿真迈向野外进阶语音识别",
    "venue": "arXiv preprint 2026",
    "authors": "Zhifei Xie, Kaiyu Pang, Haobin Zhang, Deheng Ye, Xiaobin Hu, Shuicheng Yan, Chunyan Miao",
    "affiliation": "NTU · NUS · Shanghai AI Lab",
    "domain": "音频 · 语音识别 · 鲁棒性",
    "coreProblem": "真实环境中的复合声学失真会让 ASR（自动语音识别）失去声学依据，产生漏读与幻觉。",
    "coreInsight": "用 7 类原子效应×54 个复合场景大规模仿真真实声场，配合渐进声学-语义训练与双粒度 WER（词错误率）门控奖励，可同时恢复声学感知与语义重建。",
    "keywords": [
      "ASR（自动语音识别）",
      "真实声学仿真",
      "鲁棒语音识别",
      "RL（强化学习）奖励设计"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统 ASR 在噪声、远场、回声等叠加时，<b>词错误率急剧上升</b>，常输出空文本或流畅却错误的幻觉。",
      "componentId": "mega-asr-scene"
    },
    "newMethod": {
      "desc": "Mega-ASR 用<b>7 类原子效应×54 个复合场景</b>数据 + 渐进声学-语义训练 + 双粒度奖励，恢复语音并保留语义主干。",
      "componentId": "mega-asr-scene"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "问题：为什么真实环境让 ASR 崩溃？",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "干净榜单上 WER 可以接近 1.00%，但真实声场中的复合失真会让同一模型迅速失效。本节先看清问题从何处来。",
      "analogy": {
        "title": "风声太大，听不清鸟叫",
        "text": "一位观鸟者在风中侧耳倾听：鸟鸣（语音信号）在风噪/环境（声学失真）中越来越模糊，最后把模糊声误听成一整句不存在的话。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "把风噪调大，看识别如何崩坏",
          "desc": "拖动静音到嘈杂：<b>波形被噪声淹没</b>，传统识别从轻微词错迅速变成空输出或整句幻觉。",
          "componentId": "mega-asr-scene"
        }
      ],
      "insight": "问题不是单个词听不懂，而是<b>声学证据被摧毁后，模型开始编造整句</b>。",
      "formula": {
        "lead": "把识别误差量化，最常见的就是词错误率：",
        "meaning": "物理意义：WER 表示识别结果相对参考文本的错误比例，越低越接近逐字还原。",
        "unicode": "WER = (S + I + D) / N",
        "symbols": [
          {
            "sym": "WER",
            "desc": "词错误率，越低越好"
          },
          {
            "sym": "S",
            "desc": "替换错误数"
          },
          {
            "sym": "I",
            "desc": "插入错误数"
          },
          {
            "sym": "D",
            "desc": "删除错误数"
          },
          {
            "sym": "N",
            "desc": "参考文本词数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "复合失真",
          "desc": "真实环境的噪声、远场与回声常同时出现，远非单一扰动。"
        },
        {
          "icon": "🔧",
          "title": "两种失败",
          "desc": "轻度失真多为词级混淆，重度失真转为空输出与幻觉。"
        },
        {
          "icon": "✨",
          "title": "本节目标",
          "desc": "先建立直觉：声学证据越弱，语义编造越可能发生。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "声学证据：频谱与七类原子效应",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "要修复识别，先要知道输入被怎样破坏。本节把声音变成可观察的频谱，并拆出七类基础失真（噪声效应对应不同 SNR，即信噪比水平）。",
      "analogy": {
        "title": "用望远镜逐层观察鸟羽",
        "text": "观鸟者举起望远镜（声学编码器），在风、雾、枝叶遮挡（声学失真）之间提取同一只鸟鸣（语音信号）的羽毛纹理（声学特征）。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "拖动探针，扫描频谱中的失真区域",
          "desc": "在频谱图上左右拖动探针：<b>噪声、远场、遮挡、回声混响、录音染色、电子失真、传输丢包</b>各有不同的能量痕迹。",
          "componentId": "mega-asr-scene"
        }
      ],
      "formula": {
        "lead": "本节不引入新公式；先把七类失真当作可定位、可组合的“声学零件”。",
        "meaning": "物理意义：七类原子效应是真实声场的最小失真单元，可组合逼近复杂退化。",
        "unicode": "7 类原子效应 = {噪声, 远场, 遮挡, 回声混响, 录音染色, 电子失真, 传输丢包}",
        "symbols": [
          {
            "sym": "7",
            "desc": "原子效应数量"
          },
          {
            "sym": "原子效应",
            "desc": "可独立模拟的基础声学退化"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "频谱是证据",
          "desc": "声学退化在频谱上有稳定痕迹，因此可在频谱层面高效模拟。"
        },
        {
          "icon": "🔧",
          "title": "七类零件",
          "desc": "噪声、远场、遮挡、回声混响、录音染色、电子失真、传输丢包。"
        },
        {
          "icon": "✨",
          "title": "可组合性",
          "desc": "每个效应有统一难度参数，后续才能组合成复合场景。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "核心洞察：复合场景才是真实世界",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "单效应模型只修一处，真实世界却多处同时失真。本节比较“孤立失真”与“物理合理复合”的差距。",
      "analogy": {
        "title": "孤鸟易认，林间难辨",
        "text": "孤立的鸟鸣（语音信号）容易辨认；当<b>回声、落叶声与风噪</b>（复合声学失真）叠加时，同一声鸟叫才真正变难。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "按下开始：孤立失真 vs 复合场景",
          "desc": "同一句话，分别经过<b>单一噪声</b>与<b>远场+回声混响</b>的复合处理；点开始同步播放两个面板的识别结果。",
          "componentId": "mega-asr-scene"
        }
      ],
      "insight": "真实世界几乎从不只坏一处。复合场景不是简单拼接，而是只保留物理上真实存在的组合。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "覆盖缺口",
          "desc": "旧数据多只覆盖一到两种孤立条件。"
        },
        {
          "icon": "🔧",
          "title": "复合数据",
          "desc": "Mega-ASR 用 2–5 个原子效应组成 54 个物理合理场景。"
        },
        {
          "icon": "✨",
          "title": "训练信号",
          "desc": "复合场景让模型学会在证据残缺时保留语义。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "数学机制：WER 与编辑相似度",
      "badge": "both",
      "badgeLabel": "入门+训练",
      "bridge": "有了数据，还要有可微、可感知细节的信号。本节把“听错多少”拆成词级距离与相似度。",
      "analogy": {
        "title": "用望远镜细看，数清听写差异",
        "text": "观鸟者用望远镜（声学编码器）细看，逐字核对听写记录：<b>写错、漏写、多写</b>各有代价。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动编辑相似度，看奖励如何变化",
          "desc": "拖动“编辑相似度”滑块：相似度越高，替换错误越接近<b>软错误</b>，得到的细化奖励也越高。",
          "componentId": "mega-asr-scene"
        }
      ],
      "formula": {
        "lead": "奖励直接锚定评价指标；同时用编辑相似度区分软硬替换：",
        "meaning": "物理意义：奖励与 WER 反向绑定；编辑相似度区分轻微听混与彻底编造。",
        "unicode": "Rwer = 1 − WER<br>sim(h, r) = 1 − edit(h, r) / max(|h|, |r|)",
        "symbols": [
          {
            "sym": "Rwer",
            "desc": "WER 奖励，识别越准越高"
          },
          {
            "sym": "WER",
            "desc": "词错误率"
          },
          {
            "sym": "sim",
            "desc": "编辑相似度，0 到 1"
          },
          {
            "sym": "h",
            "desc": "假设文本 token（词元）"
          },
          {
            "sym": "r",
            "desc": "参考文本 token（词元）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "奖励锚定",
          "desc": "Rwer 把奖励直接绑到评价指标 WER。"
        },
        {
          "icon": "🔧",
          "title": "软硬区分",
          "desc": "相似度≥0.50 视为软错误，插删统一视为硬错误。"
        },
        {
          "icon": "✨",
          "title": "细节信号",
          "desc": "相似度让奖励能区分“听混”和“编造”。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "可控难度：从四种分布挑训练剖面",
      "badge": "both",
      "badgeLabel": "入门+训练",
      "bridge": "太简单学不到鲁棒，太难又训练不稳。本节用一个统一难度参数 k 标定每条语音的难度。",
      "analogy": {
        "title": "挑一条平缓或陡峭的观鸟路线",
        "text": "观鸟者在地图上选路线：<b>平缓、陡峭、中间集中或均匀分布</b>，决定一路遇到的挑战。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "切换难度分布，观察训练剖面",
          "desc": "在四种难度分布间切换：<b>线性分布</b>最终被采用，因为它在各难度上提供最平衡的训练信号。",
          "componentId": "mega-asr-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "统一难度",
          "desc": "每个效应共享 k∈[0,1] 的严重度参数。"
        },
        {
          "icon": "🔧",
          "title": "四种剖面",
          "desc": "Sqrt-Forward、Sqrt-Backward、Gaussian-Mid、Linear。"
        },
        {
          "icon": "✨",
          "title": "线性胜出",
          "desc": "线性分布在探针实验中最稳，并作为数据集难度剖面。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "从声学到语义：三段渐进训练",
      "badge": "inf",
      "badgeLabel": "入门",
      "bridge": "直接硬啃最难样本会崩溃。本节展示 A2S-SFT（声学到语义的渐进式监督微调）如何分阶段把能力从声学感知推进到语义重建。",
      "analogy": {
        "title": "先近后远，逐步听清",
        "text": "观鸟者先听清近处鸟叫（语音信号），再逐步挑战远处、被遮挡的鸟叫，最后靠图鉴（LLM，大语言模型语义先验）补全缺失信息。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步推进：WER<30 → <50 → <70",
          "desc": "点击“下一步”逐步扩大训练难度范围：<b>编码器/对齐器</b>先学声学，<b>LLM</b>再学语义重建，最后联合微调。",
          "componentId": "mega-asr-scene"
        }
      ],
      "formula": {
        "lead": "三段课程用三个 WER 阈值组织：",
        "meaning": "物理意义：按 WER 上限逐步放宽课程，先学可靠声学感知，再学残缺语义重建。",
        "unicode": "课程：WER < 30% → WER < 50% → WER < 70%",
        "symbols": [
          {
            "sym": "WER",
            "desc": "词错误率"
          },
          {
            "sym": "<30%",
            "desc": "第一阶段，声学感知基础"
          },
          {
            "sym": "<50%",
            "desc": "第二阶段，更难的声学证据"
          },
          {
            "sym": "<70%",
            "desc": "第三阶段，需要语义重建"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先声学后语义",
          "desc": "先把可听清的部分学稳，再让 LLM 补全残缺证据。"
        },
        {
          "icon": "🔧",
          "title": "三段课程",
          "desc": "WER<30%、<50%、<70% 逐级扩大。"
        },
        {
          "icon": "✨",
          "title": "联合微调",
          "desc": "最后对齐编码器、对齐器与 LLM，端到端一致。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练目标：双粒度 WER 门控奖励",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "标准 WER 奖励在高难度下会饱和，无法区分句级失败。本节展示 DG-WGPO（双粒度 WER 门控策略优化），以 DAPO（解耦裁剪与动态采样策略优化）为强化学习骨干，拆出词级细化与句级重构两类信号。",
      "analogy": {
        "title": "校对笔记：小错逐字改，大错重写主干",
        "text": "观鸟者校对笔记：<b>小错逐字改</b>（词级细化），整句崩塌就用<b>图鉴（LLM 语义先验）重写语义主干</b>（句级重构）。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "拖动门控阈值，看奖励怎么翻转",
          "desc": "拖动 WER 门控阈值 τ：低于 τ 时<b>词级细化</b>占主导，达到 τ 后切换为<b>句级重构</b>占主导。",
          "componentId": "mega-asr-scene"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "逐步拆解：奖励由哪些部分组成",
          "desc": "点击“下一步”依次叠加 WER 奖励、抗重复门控、词级细化与句级重构，最后看门控融合如何组合它们。",
          "componentId": "mega-asr-scene"
        }
      ],
      "formula": {
        "lead": "门控融合在 τ 处翻转两个粒度的权重，最终目标把规则锚点与动态信号混合：",
        "meaning": "物理意义：WER 低时以词级小错为主，词级细化占优；WER 高时转为句级失败，句级语义重建占优。",
        "unicode": "Rdynamic = 0.75·Rfine + 0.25·Rstruc（WER < τ）<br>Rdynamic = 0.25·Rfine + 0.75·Rstruc（WER ≥ τ）<br>R = (1 − αdyn)·Rsimple + αdyn·Rdynamic",
        "symbols": [
          {
            "sym": "Rdynamic",
            "desc": "动态奖励"
          },
          {
            "sym": "Rfine",
            "desc": "词级细化奖励"
          },
          {
            "sym": "Rstruc",
            "desc": "句级重构奖励，用 LCS（最长公共子序列）衡量语义主干保留"
          },
          {
            "sym": "τ",
            "desc": "WER 门控阈值，取 0.3"
          },
          {
            "sym": "αdyn",
            "desc": "动态信号权重，取 0.6"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两种失败",
          "desc": "WER≤30% 以词级混淆为主，超过后转为句级失败。"
        },
        {
          "icon": "🔧",
          "title": "门控融合",
          "desc": "τ 处翻转权重，让奖励贴合当下错误类型。"
        },
        {
          "icon": "✨",
          "title": "关键消融",
          "desc": "去掉句级重构 Rstruc 的退化最大。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "系统结构：编码器、对齐器、LLM 与路由",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "前面的数据与训练最终落到一个可部署的系统。本节点选各组件，看清数据流与职责。",
      "analogy": {
        "title": "观鸟装备各司其职",
        "text": "望远镜（声学编码器）提取声学特征，图鉴（LLM 语义先验）补全语义，降噪耳塞（鲁棒 LoRA，低秩自适应权重）只在嘈杂时启用；鸟鸣（语音信号）与风噪/环境（声学失真）决定走哪条路。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击组件，追踪从声学到文本的路径",
          "desc": "点击<b>音频编码器、对齐器、LLM、路由</b>任一组件：信号先经编码器→对齐器→LLM 处理，再由<b>路由分流</b>到原骨干或 Mega-ASR 鲁棒分支。",
          "componentId": "mega-asr-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "编码器",
          "desc": "从波形提取声学特征，经对齐器压缩成 token 序列。"
        },
        {
          "icon": "🔧",
          "title": "LLM",
          "desc": "在声学证据残缺时用语言先验做语义重建。"
        },
        {
          "icon": "✨",
          "title": "路由",
          "desc": "只在该用时启用鲁棒 LoRA 分支，保持干净域能力。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "即插即用：环境感知路由",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "鲁棒权重未必总最优：干净语音、热词和流式能力可能被牺牲。本节用轻量路由做条件激活。",
      "analogy": {
        "title": "干净路段摘下耳塞",
        "text": "到了安静路段，观鸟者摘下<b>降噪耳塞（鲁棒 LoRA 权重）</b>；只有走进嘈杂林间才重新戴上。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "切换路由策略，比较干净与退化两头的表现",
          "desc": "在<b>始终鲁棒</b>与<b>环境路由</b>间切换：路由把干净语音送回原骨干，把退化语音交给鲁棒分支。",
          "componentId": "mega-asr-scene"
        }
      ],
      "formula": {
        "lead": "路由是一个轻量二分类器，输出一个二元决定：",
        "meaning": "物理意义：路由输出 0/1，干净输入走原骨干，退化输入才启用鲁棒分支。",
        "unicode": "ŷ ∈ {0, 1}，0 = 干净 → 原骨干，1 = 退化 → Mega-ASR 分支",
        "symbols": [
          {
            "sym": "ŷ",
            "desc": "路由决策"
          },
          {
            "sym": "0",
            "desc": "干净语音，走原 Qwen3-ASR"
          },
          {
            "sym": "1",
            "desc": "退化语音，走 Mega-ASR LoRA 分支"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "即插即用",
          "desc": "鲁棒模块只在需要时启用，不改动解码过程。"
        },
        {
          "icon": "🔧",
          "title": "轻量路由",
          "desc": "log-Mel（对数梅尔频谱）特征经一层 Transformer（自注意力神经网络）分类，准确率超 99.50%。"
        },
        {
          "icon": "✨",
          "title": "能力保留",
          "desc": "干净识别、热词与流式能力不被鲁棒训练侵蚀。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果与边界：真实战报",
      "badge": "both",
      "badgeLabel": "入门+训练",
      "bridge": "最后看量化结果与适用范围：Mega-ASR 在复合场景大幅领先，但也有明确边界。",
      "analogy": {
        "title": "两条路线，谁先看到目标鸟",
        "text": "观鸟者按下开始，比较<b>不同路线</b>到达目标鸟的差距，并复盘哪条路更稳。",
        "componentId": "mega-asr-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "按下开始：WER 结果赛跑",
          "desc": "点击“开始对比”，让 Qwen3-ASR、Whisper-L-v3 与 Mega-ASR 从同一基线出发，比较 CHiME-4、VOiCES、NOIZEUS 三大鲁棒基准的平均 WER（%）与复合场景 WER（%）。",
          "componentId": "mega-asr-scene"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "鲁棒领先",
          "desc": "CHiME-4/VOiCES/NOIZEUS 平均 WER 6.70%，优于 Qwen3-ASR 的 7.93% 与 Whisper-L-v3 的 10.72%。"
        },
        {
          "icon": "🔧",
          "title": "复合场景",
          "desc": "混合退化 WER 2.73%/4.57%，相比 Whisper-L-v3 降低约 65.80%/69.10%。"
        },
        {
          "icon": "✨",
          "title": "边界",
          "desc": "语义收益依赖训练数据覆盖；极难样本仍可能出错，路由是鲁棒与干净能力的折中。"
        }
      ]
    }
  ]
};
