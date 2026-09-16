import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "VibeThinker-3B: Exploring the Frontier of Verifiable Reasoning in Small Language Models",
    "titleZh": "探索小语言模型可验证推理的前沿",
    "venue": "2026 · arXiv 预印本",
    "authors": "Sen Xu, Shixi Liu, Wei Wang, Jixin Min, Yingwei Dai, Zhibin Yin, Yirong Chen, Xin Zhou, Junlin Zhang",
    "affiliation": "原文 HTML 未列机构",
    "domain": "小语言模型 · 可验证推理 · 强化学习",
    "coreProblem": "只有30亿参数的稠密模型，能在可验证任务上达到怎样的能力边界？",
    "coreInsight": "理解小模型如何拓宽解法、强化信号与核验答案。",
    "keywords": [
      "3B 稠密模型",
      "数学与代码",
      "约 35 分钟",
      "中文交互教程"
    ]
  },
  "hero": {
    "oldMethod": {
      "componentId": "notebook-scene",
      "desc": "<b>只记一种解法</b><br/>以单一路径模仿作教学对照：看似会做，换个条件就可能失灵。"
    },
    "newMethod": {
      "componentId": "notebook-scene",
      "desc": "<b>先见多解，再把正确解练稳</b><br/>Spectrum-to-Signal：让探索有空间，让验证有信号。"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "小模型，能把题做到多好？",
      "badge": "inf",
      "badgeLabel": "直觉入门",
      "bridge": "先把研究问题缩小：这篇论文考察的是<b>有明确检验条件的推理</b>，例如数学答案和通过测试的程序。它研究 3B 模型的能力边界，不是在证明模型能替代所有大模型。",
      "analogy": {
        "title": "圈出答案，还要代回去检验",
        "text": "练习本里的一行答案，需要对得上题目条件。<b>可验证奖励</b>把“看起来像答案”变成“接受具体检验”；答案过关仍不保证每一步推导都正确。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "给答案找一个合适的裁判",
          "desc": "切换任务和候选答案，观察裁判能否给出明确的二值奖励。下方是<b>教学微型例子</b>，不是调用真实模型。<a href=\"https://arxiv.org/html/2606.16140v1#S2.SS2.SSS2\" target=\"_blank\" rel=\"noreferrer\">原文 §2.2.2 ↗</a>",
          "componentId": "verifier"
        }
      ],
      "insight": "当解题目标可以检验，训练就能围绕“哪些尝试真的成功”提供反馈。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题有边界",
          "desc": "可验证推理强调答案约束、可执行测试等可靠反馈。"
        },
        {
          "icon": "🔧",
          "title": "3B 是什么",
          "desc": "B 表示十亿；本模型是30亿参数的稠密模型，底座为 Qwen2.5-Coder-3B。"
        },
        {
          "icon": "📖",
          "title": "审读第一原则",
          "desc": "竞赛数学强，不足以推出开放写作、知识覆盖或真实工程全面领先。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "先把练习材料选对",
      "badge": "trn",
      "badgeLabel": "训练深入",
      "bridge": "裁判明确后，还要避免把坏题、错解当教材。作者从可信种子出发扩写问题，让强教师采样多条完整推理轨迹，再做质量过滤；课程学习则决定先练什么、后练什么。",
      "analogy": {
        "title": "先擦掉练习本里的错行",
        "text": "带着错误答案反复练习，只会把错误记得更牢。<b>质检</b>检查重复与基准重叠、题目是否成立、推理和最终答案是否通过验证。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "哪道题进入第二阶段？",
          "desc": "第一阶段用过滤后的全量数据练 5 轮；第二阶段再练 2 轮，同时要求<b>轨迹至少 5K tokens</b>，且参考 VibeThinker-1.5B 的 8 次采样<b>错误率至少 0.75</b>。以下是假想样本，默认已通过质检。<a href=\"https://arxiv.org/html/2606.16140v1#S2.SS1.SSS2\" target=\"_blank\" rel=\"noreferrer\">原文 §2.1.2 ↗</a>",
          "componentId": "curriculum"
        }
      ],
      "insight": "“更长”与“更难”必须同时满足；长篇但浅显的答案并不是第二阶段要找的教材。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先过滤再分层",
          "desc": "n-gram过滤、LLM问题质检、答案/代码/投票验证构成三层质量控制；教师投票也可能出错。"
        },
        {
          "icon": "🔧",
          "title": "先广再深",
          "desc": "多域覆盖冷启动，再集中练长程难题；tokens 是文本切分单位，不等同于汉字数。"
        },
        {
          "icon": "📖",
          "title": "训练配置",
          "desc": "全局 batch 128，初始学习率 5×10⁻⁵、最低 8×10⁻⁸，余弦退火与 5% 预热；第一阶段用 sequence packing。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先学多种解法，再练可靠性",
      "badge": "both",
      "badgeLabel": "概念与实践",
      "bridge": "只给出一份标准答案，学生可能只会复述一条路线。作者沿用 <b>Spectrum-to-Signal Principle（SSP）</b>：监督微调 SFT 先构建解法谱，再用强化学习 RL 放大其中的有效信号。",
      "analogy": {
        "title": "同一道题，描出另一种解法",
        "text": "练习本不只留下最常见的一解，也保存可行的分解和检验方式。多解不等于多写废话，<b>有用的多样性</b>才给后续探索留下空间。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "从单一模仿走到多解探索",
          "desc": "逐步展开同一道示意题的候选笔迹。图中“三条候选、两条通过”仅用来说明机制，不是论文的采样数或实验结果。<a href=\"https://arxiv.org/html/2606.16140v1#S2.SS1.SSS2\" target=\"_blank\" rel=\"noreferrer\">原文 §2.1.2 ↗</a>",
          "componentId": "spectrum"
        }
      ],
      "insight": "SFT 负责让模型“有路可走”，RL 负责让它“更常走对”。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "多路径蒸馏",
          "desc": "强教师为每题给多条完整推理轨迹，保留不同解题策略。"
        },
        {
          "icon": "🔧",
          "title": "按 Pass@K 选专家",
          "desc": "在各域探针上选候选覆盖更好的检查点，并在参数层面合并；不是只挑最低验证损失。"
        },
        {
          "icon": "📖",
          "title": "指标不要混淆",
          "desc": "Pass@1关注单次正确率；Pass@K关注K个候选至少一个成功的能力。候选多不保证实际单次就稳。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "MGPO：练在能力边界上",
      "badge": "both",
      "badgeLabel": "概念与实践",
      "bridge": "会得太熟的题，反馈已经饱和；怎么试都错的题，又缺少正信号。MGPO 沿用 1.5B 工作的算法，把更多训练权重放在<b>正确与错误共存</b>的题目组上。",
      "analogy": {
        "title": "把笔尖停在“还不稳”的地方",
        "text": "完全不会和闭眼都会，都不如“有时做对、有时做错”容易比较成功与失败的尝试。这里的难度来自模型当前表现，会随训练变化。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动笔尖，组成一组训练反馈",
          "desc": "橙色笔尖控制 8 次教学采样中做对的次数；可以拖动，或用左右按钮。只展示组正确率与原文支持的偏好，<b>不虚构 D_ME 的展开式或权重曲线</b>。<a href=\"https://arxiv.org/html/2606.16140v1#S2.SS2.SSS1\" target=\"_blank\" rel=\"noreferrer\">原文 §2.2.1，式1–3 ↗</a>",
          "componentId": "boundary"
        }
      ],
      "insight": "最有区分度的反馈来自能力边界；MGPO 调整的是题目组对策略更新的贡献。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "经验正确率",
          "desc": "p(q) 是这一组实际采样的正确比例，不是模型永久不变的能力。"
        },
        {
          "icon": "🔧",
          "title": "更新什么",
          "desc": "w(q)乘到组相对优势 A_i 上，进入 GRPO 风格的裁剪目标；不是把错误答案改判成正确。"
        },
        {
          "icon": "📖",
          "title": "稳定性也重要",
          "desc": "作者保留 MGPO 核心形式，各 RL 阶段采用 on-policy 方式缓解训练与推理概率不匹配。"
        }
      ],
      "formula": {
        "lead": "先算组正确率，再看它偏离 0.5 有多远。正文未给出 D_ME 的具体展开与 γ 数值，因此此处保留符号。",
        "unicode": "p(q) = (1/G) Σᵢ 𝟙(rᵢ = 1)<br/>w(q) = exp[−γ · D_ME(p(q) ∥ 0.5)]",
        "symbols": [
          {
            "sym": "p(q)",
            "desc": "问题q的一组经验正确率，标量，范围0到1。"
          },
          {
            "sym": "G",
            "desc": "此处为每题采样数，正整数。示意G=8，不声称是论文RL组大小。"
          },
          {
            "sym": "rᵢ",
            "desc": "第i条轨迹的可验证奖励，正确1、错误0。"
          },
          {
            "sym": "γ",
            "desc": "正的权重强度参数。论文未给具体值。"
          },
          {
            "sym": "D_ME",
            "desc": "衡量经验正确率偏离最大熵点0.5的量；原文没有在本报告中展开其定义。"
          },
          {
            "sym": "w(q)",
            "desc": "题目组权重；接近能力边界的题目得到更高权重。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "长思考，先留够草稿纸",
      "badge": "trn",
      "badgeLabel": "训练深入",
      "bridge": "选对题也不够：如果一条好的推理没写完就被截断，训练看到的便是残缺的轨迹。作者发现，1.5B 阶段有效的渐增窗口策略，在这个 3B 模型上不再适用。",
      "analogy": {
        "title": "展开草稿纸，让推导写完",
        "text": "折起的纸面容不下完整解答。先<b>保留完整思考</b>，与后来主动删去冗余，是两个不同的问题。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "同一条长轨迹，两种窗口",
          "desc": "固定一条 48K tokens 的<b>教学轨迹</b>；短窗口 16K 是对照示意，64K 是论文采用的 RL 窗口。图形表达能否容纳，不模拟性能提升。<a href=\"https://arxiv.org/html/2606.16140v1#S2.SS2.SSS2\" target=\"_blank\" rel=\"noreferrer\">原文 §2.2.2 ↗</a>",
          "componentId": "context"
        }
      ],
      "insight": "作者直接使用单一 64K 长窗口，减少高质量长轨迹被截断；这是一项有前提的经验选择。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "作者的观察",
          "desc": "高截断的早期阶段会损伤长思考，之后扩大窗口也难以完全恢复。"
        },
        {
          "icon": "🔧",
          "title": "解释仍是推测",
          "desc": "作者认为更强的SFT起点、更少无效轨迹可能改变了截断的作用；不能把它写成普遍定律。"
        },
        {
          "icon": "📖",
          "title": "不要只看参数",
          "desc": "小权重规模仍可搭配很长的推理；上下文、KV缓存与生成长度都会影响实际成本。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "CLR：答案多，还要站得住",
      "badge": "inf",
      "badgeLabel": "直觉入门",
      "bridge": "训练完成后，还可以花额外推理预算挑答案。CLR（关键主张可靠性评估）让模型每题生成 <b>32 条候选</b>，每条抽取 <b>5 个影响决策的主张</b>，再由模型自己验证它们。",
      "analogy": {
        "title": "放大镜只检查关键一句",
        "text": "一份长解答里，有些关键判断一错，后面全会偏。聚焦这些锚点，比把整篇草稿都当作同等可靠的投票更有针对性。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "多数票会输给更可靠的少数票吗？",
          "desc": "缩小到 4 条<b>教学候选</b>：答案 A 出现 3 次且每条通过4项，答案 B 出现1次且通过5项。切换 A 的主张判定，观察等价答案组的加权结果；不模拟真实自验证器。<a href=\"https://arxiv.org/html/2606.16140v1#S3.SS1\" target=\"_blank\" rel=\"noreferrer\">原文 §3.1，式5–6 ↗</a>",
          "componentId": "clr"
        }
      ],
      "insight": "每条轨迹先按关键主张打折，再把等价答案的权重相加；数量多，并不一定赢。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "为何五次方",
          "desc": "通过4/5时权重是0.8⁵=0.32768，而非0.8；非线性惩罚降低含缺陷轨迹的贡献。"
        },
        {
          "icon": "🔧",
          "title": "预算要分清",
          "desc": "CLR不更新参数，但有32条生成和后续核验的开销；作者将完整流程独立执行8次取平均。"
        },
        {
          "icon": "📖",
          "title": "仍有失败模式",
          "desc": "自验证可能与生成共享错误；r_k是相对聚合权重，不是已校准的正确概率，也不是数学证明。"
        }
      ],
      "formula": {
        "lead": "一条候选越能经受主张核验，它的答案在聚合时就越有分量。",
        "unicode": "rₖ = [(1/M) Σₘ vₖ,ₘ]ᴹ<br/>Score(G) = Σₖ: yₖ∈G rₖ",
        "symbols": [
          {
            "sym": "rₖ",
            "desc": "第k条轨迹的可靠性权重，范围0到1，不解释为真实正确概率。"
          },
          {
            "sym": "M",
            "desc": "每条轨迹的关键主张数，论文设为5。"
          },
          {
            "sym": "vₖ,ₘ",
            "desc": "模型自验证给出的二值判定：主张通过1、不通过0。"
          },
          {
            "sym": "G",
            "desc": "此处是一个等价答案集合，与MGPO公式中的采样组大小G含义不同。"
          },
          {
            "sym": "yₖ",
            "desc": "第k条候选对应的最终答案，按答案等价性分组。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "Long2Short：只奖励正确的简洁",
      "badge": "trn",
      "badgeLabel": "训练深入",
      "bridge": "留够空间，是为了把题做对；题做对以后，才优化冗余。数学 RL 先追求准确，再加入 Long2Short：<b>只在正确轨迹之间</b>偏好更短的解答，错误轨迹的奖励不变。",
      "analogy": {
        "title": "擦去重复草稿，保留正确步骤",
        "text": "简洁是建立在正确之上的。把关键推导删掉的短答案，不会因为省纸就获得奖励。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "亲手重新分配一组奖励",
          "desc": "改变三条教学轨迹的长度和对错，使用原文公式实时计算。λ 固定为论文值0.2；奖励可以超过1，<b>它不是准确率</b>。试试等长、单条正确和全错的边界情况。<a href=\"https://arxiv.org/html/2606.16140v1#S2.SS2.SSS2\" target=\"_blank\" rel=\"noreferrer\">原文 §2.2.2 Long2Short ↗</a>",
          "componentId": "long-short"
        }
      ],
      "insight": "把正确集合中的奖励做零和调整，改变相对偏好，却不系统性抬高整组的平均奖励。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先分对错",
          "desc": "错误轨迹始终保持0；再短也不加分。只有正确集合参与长度比较。"
        },
        {
          "icon": "🔧",
          "title": "零和守恒",
          "desc": "各正确轨迹的奖励改变量之和为0；同长、只有一条正确时不调整，全错时跳过。"
        },
        {
          "icon": "📖",
          "title": "实验边界",
          "desc": "原文目标是在保持验证集表现时减少冗余，但未给出具体token节省百分比；均值守恒本身不证明准确率必然不变。"
        }
      ],
      "formula": {
        "lead": "用倒数长度衡量简洁程度，减去正确集合的均值，再按最大绝对偏差归一。只有分母非零时才调整。",
        "unicode": "sᵢ = 1/Lᵢ<br/>rᵢ′ = rᵢ + λ · (sᵢ − s̄) / maxⱼ∈C |sⱼ − s̄|<br/>Σᵢ∈C (rᵢ′ − rᵢ) = 0",
        "symbols": [
          {
            "sym": "Lᵢ",
            "desc": "第i条回答的正token长度；倒数长度越大，回答越短。"
          },
          {
            "sym": "s̄",
            "desc": "只在正确轨迹集合C内计算的平均倒数长度。"
          },
          {
            "sym": "C",
            "desc": "正确轨迹索引集合；空集合不计算均值，直接保持奖励。"
          },
          {
            "sym": "λ",
            "desc": "最大调整幅度，论文设为0.2；正确奖励因此落在0.8到1.2之间。"
          },
          {
            "sym": "rᵢ′",
            "desc": "调整后的奖励；错误轨迹保持原来的0。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把训练拼成一套系统",
      "badge": "trn",
      "badgeLabel": "训练深入",
      "bridge": "现在把已经操作过的机制放回全貌。本文主要贡献是<b>后训练体系</b>，不是新的 Transformer 网络结构。点击训练阶段，查看监督信号、检查点和自蒸馏的回流关系。",
      "analogy": {
        "title": "把分科练习页归回一本笔记",
        "text": "数学、代码和科学练习各有擅长的检查方式。最后整理成一个可使用的学生模型，需要吸收不同阶段留下的优质解题记录。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "逐站检查训练方案",
          "desc": "节点表示真实训练阶段；亮线标出选中阶段及其关系，固定顺序不能任意重排。Math / Code / STEM 保存的检查点将提供离线自蒸馏轨迹。<a href=\"https://arxiv.org/html/2606.16140v1#S2\" target=\"_blank\" rel=\"noreferrer\">原文 §2，图3 ↗</a>",
          "componentId": "pipeline"
        }
      ],
      "insight": "分域强化、轨迹回流、指令约束，共同构成这个3B模型；最终分数不能自动归因给其中某一个模块。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分域顺序",
          "desc": "数学RL（含Long2Short）→代码RL→STEM RL。三域共享MGPO，验证器按任务变化。"
        },
        {
          "icon": "🔧",
          "title": "两种整合不同",
          "desc": "SFT的域专家在参数层面合并；离线自蒸馏把各RL检查点的正确轨迹作为监督数据教给学生。"
        },
        {
          "icon": "📖",
          "title": "部署分支",
          "desc": "训练以Instruct RL收尾；CLR属于可选的推理时增强，不是又一次训练，也不增加参数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "复习什么，怎样听懂要求？",
      "badge": "trn",
      "badgeLabel": "训练深入",
      "bridge": "把所有正确轨迹都再学一遍，可能浪费时间；只挑学生最不熟悉的，又可能挑到噪声。本章补齐<b>学习潜力过滤</b>，并用显式约束体会最后的 Instruct RL。",
      "analogy": {
        "title": "标出值得复习的句子",
        "text": "已经滚瓜烂熟的记录收益有限；完全看不懂的异常文本也未必是好教材。先确认正确，再在可比的练习页里找有挑战的材料。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "分数高，就一定值得学？",
          "desc": "点击教学样本，比较学生的平均负对数似然。数值与分类用于说明原理，<b>不是论文筛选阈值</b>；真实流程按领域和长度分桶，优先中高分正确轨迹。<a href=\"https://arxiv.org/html/2606.16140v1#S2.SS3\" target=\"_blank\" rel=\"noreferrer\">原文 §2.3 ↗</a>",
          "componentId": "potential"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "答案对，还要按要求回答",
          "desc": "教学指令：“只输出 JSON 对象，只有 results 字段，值是恰好两个偶数组成的数组。”切换候选输出，让三条显式规则逐条检查。<a href=\"https://arxiv.org/html/2606.16140v1#S2.SS4\" target=\"_blank\" rel=\"noreferrer\">原文 §2.4 ↗</a>",
          "componentId": "instruct"
        }
      ],
      "insight": "自蒸馏关注“正确且值得学”，Instruct RL关注“能按要求交付”；它们解决不同问题。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先拒绝错轨迹",
          "desc": "使用各域验证器做拒绝采样，再算学生对正确轨迹的学习潜力。"
        },
        {
          "icon": "🔧",
          "title": "不盲目贪高分",
          "desc": "极短轨迹不参与分数优选，极端高分异常会过滤；按域与长度分桶，避免全局排名失真。"
        },
        {
          "icon": "📖",
          "title": "奖励并非全是规则",
          "desc": "明确约束用规则验证；开放提示用rubric奖励模型评估帮助性、连贯性、遵从和冗余。"
        }
      ],
      "formula": {
        "lead": "学生越不擅长预测一条已验证轨迹，它的平均负对数似然通常越高；但高分还需要经过质量与可比性筛选。",
        "unicode": "S_LP(q,y) = −(1/|y|) Σₜ log π_student(yₜ | q, y&lt;ₜ)",
        "symbols": [
          {
            "sym": "S_LP",
            "desc": "学习潜力分数，是标量；它衡量学生当前的不熟悉程度，而非轨迹真假的概率。"
          },
          {
            "sym": "|y|",
            "desc": "轨迹的token数；长度归一化减少长文本的累计偏差，但仍要分桶。"
          },
          {
            "sym": "π_student",
            "desc": "学生在给定问题和前缀时预测当前token的概率。"
          },
          {
            "sym": "log",
            "desc": "自然对数；概率小于1时对数非正，取负号得到非负平均损失。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "读懂成绩，也读懂边界",
      "badge": "both",
      "badgeLabel": "概念与实践",
      "bridge": "最后回到研究问题：这个小模型在什么条件下表现强？把论文报告的分数和评测预算一起读，再判断证据是否支持“3B已经能替代大模型”这样的结论。",
      "analogy": {
        "title": "给成绩盖章之前，先读评分细则",
        "text": "同一个分数，可能来自不同的采样预算和裁判。成绩页上的勾，必须连同任务范围一起保留。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "切换基准，看看优势是否还在",
          "desc": "以下对比摘自论文表2，固定0–100轴，越高越好。对比模型来自公开报告与排行榜，<b>不是作者统一等算力复测</b>；CLR另需推理预算，代码CLR没有报告。<a href=\"https://arxiv.org/html/2606.16140v1#S3.T2\" target=\"_blank\" rel=\"noreferrer\">原文 表2 ↗</a>",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "五个判断，把论文讲给同学听",
          "desc": "不计分、不锁学习进度。选择一个说法，查看解释与反例；可以反复改选。<a href=\"https://arxiv.org/html/2606.16140v1#S4\" target=\"_blank\" rel=\"noreferrer\">原文 §4 ↗</a>",
          "componentId": "review"
        }
      ],
      "insight": "“可压缩的推理核心”与“需要广覆盖的知识”是作者提出的解释性假说，实验提供支持线索，尚不是定理。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "核心发现",
          "desc": "AIME26 94.3、LCB v6 80.2显示特定可验证任务的竞争力；GPQA 70.2（CLR72.9）仍明显落后于表中最强系统。"
        },
        {
          "icon": "🔧",
          "title": "分母不能省",
          "desc": "LeetCode 96.1%=123/128次Python独立首答提交；8场×4题×4次采样，共32题。W501因公共榜缺失被省略。"
        },
        {
          "icon": "📖",
          "title": "还缺什么证据",
          "desc": "本报告未给出训练组件逐项定量消融、完整算力/耗时和CLR等预算对照；不能断言某一组件单独贡献多少，或小参数一定低总成本。"
        }
      ]
    }
  ]
};
