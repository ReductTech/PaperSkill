import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "PersonaVLM",
    "titleZh": "长期个性化多模态助手",
    "venue": "CVPR 2026",
    "authors": "Chang Nie, Chaoyou Fu, Yifan Zhang, Haihua Yang, Caifeng Shan",
    "affiliation": "Nanjing University · ByteDance",
    "domain": "Personalized Multimodal LLMs",
    "coreProblem": "在跨会话图文交互中，理解不断变化的用户。",
    "coreInsight": "<b>记住过去，也理解正在变化的用户。</b><br>PersonaVLM: Long-Term Personalized Multimodal LLMs<br>通过分类型资料、带时间条件的检索与人格状态更新，探索长期个性化。<br><small>Chang Nie · Chaoyou Fu · Yifan Zhang · Haihua Yang · Caifeng Shan<br>Nanjing University · ByteDance · CVPR 2026</small><br><a href=\"https://openaccess.thecvf.com/content/CVPR2026/papers/Nie_PersonaVLM_Long-Term_Personalized_Multimodal_LLMs_CVPR_2026_paper.pdf\" target=\"_blank\" rel=\"noreferrer\">正式论文</a> · <a href=\"https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf\" target=\"_blank\" rel=\"noreferrer\">Supplementary</a> · <a href=\"https://arxiv.org/abs/2604.13074\" target=\"_blank\" rel=\"noreferrer\">arXiv</a> · <a href=\"https://personavlm.github.io/\" target=\"_blank\" rel=\"noreferrer\">项目页</a> · <a href=\"https://github.com/MiG-NJU/PersonaVLM\" target=\"_blank\" rel=\"noreferrer\">GitHub</a>",
    "keywords": [
      "图文交互",
      "时间线",
      "动态偏好",
      "人格对齐",
      "9章 · 6个交互"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>教学示意：静态个性化的局限</b><br>保存了旧喜好，却未必识别最新变化；统一语气也可能不合适。概括原文问题，不表示所有方法都有相同缺点。",
      "componentId": "notebook-scene"
    },
    "newMethod": {
      "desc": "<b>教学示意：持续更新与有条件取用</b><br>保留历史、更新当前状态，按需查找证据，并用人格条件调整回答。这里不代表无限记忆或真实用户纵向验证。",
      "componentId": "notebook-scene"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "记得旧偏好，为什么仍会答错？",
      "badge": "inf",
      "badgeLabel": "问题",
      "bridge": "用户过去喜欢什么，并不总等于现在需要什么。先观察：旧记录、最新证据与回应方式，分别解决了哪一种错误？",
      "analogy": {
        "title": "教学示意 · 旧笔记仍在，偏好已经变了",
        "text": "像翻阅一册持续更新的图文手记：找到旧页不难，难的是判断哪条记录仍适合今天。这里只作理解辅助，不代表模型真实输出。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一个问题，加入哪些用户证据？",
          "desc": "<b>【论文明确提出】</b> 静态用户信息与固定对齐难以完整适应长期变化。原论文 Fig.1 展示了偏好改变和语气不合适两类问题；下方回答草案为自制教学示意。<a href=\"./images/fig1.png\" target=\"_blank\" rel=\"noreferrer\">原论文图 Fig.1（可放大）</a> · <a href=\"https://openaccess.thecvf.com/content/CVPR2026/papers/Nie_PersonaVLM_Long-Term_Personalized_Multimodal_LLMs_CVPR_2026_paper.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：主文 §1，PDF 1–2 页</a>",
          "componentId": "conditions",
          "figure": "./images/fig1.png"
        }
      ],
      "insight": "记住用户信息、辨认当前偏好、采用合适语气，是三个相关但不同的目标。",
      "takeaways": [
        {
          "icon": "·",
          "title": "记住谁",
          "desc": "个性化涉及某位用户的具体图文信息。"
        },
        {
          "icon": "·",
          "title": "适应变化",
          "desc": "旧偏好可能过时，最新证据需要参与判断。"
        },
        {
          "icon": "·",
          "title": "回应方式",
          "desc": "相同事实也需要适合用户的语气与风格。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一次回答之后，系统还会做什么？",
      "badge": "inf",
      "badgeLabel": "整体框架",
      "bridge": "怎样让一次交互留下下一次可用的资料？PersonaVLM 把“回答当前问题”与“更新持久状态”分开。",
      "analogy": {
        "title": "教学示意 · 翻页与修订，各有时机",
        "text": "读旧页帮助完成眼前的回应；把新信息记下来，是为了之后的交互。读写分工帮助理解 Response 与 Update，不代表两次模型训练。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "这类资料怎样进入回答？",
          "desc": "<b>【论文明确提出】</b> 基础模型为 Qwen2.5-VL-7B。Response 使用当前图文、近期上下文和已有状态；Update 在回答后推断人格并保存信息。原论文 Fig.2 与下方自制结构图分开展示。<a href=\"./images/fig2.png\" target=\"_blank\" rel=\"noreferrer\">原论文图 Fig.2（可放大）</a> · <a href=\"https://openaccess.thecvf.com/content/CVPR2026/papers/Nie_PersonaVLM_Long-Term_Personalized_Multimodal_LLMs_CVPR_2026_paper.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：§3.1，PDF 3–5 页</a>",
          "componentId": "memory-map",
          "figure": "./images/fig2.png"
        }
      ],
      "insight": "Response / Update 是运行阶段；SFT / RL 才是训练阶段。",
      "takeaways": [
        {
          "icon": "·",
          "title": "输入",
          "desc": "当前文本、可选图片、时间戳与近期对话。"
        },
        {
          "icon": "·",
          "title": "回答",
          "desc": "先使用已有状态，按需取回历史证据。"
        },
        {
          "icon": "·",
          "title": "更新",
          "desc": "回答后整理信息，为后续交互准备状态。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "用户资料为什么要分成四类记忆？",
      "badge": "inf",
      "badgeLabel": "表示与保存",
      "bridge": "保存一个姓名、一次经历和一个长期目标，并不需要完全相同的规则。现在细看四类 memory、人格 P 与原始 history 的差别。",
      "analogy": {
        "title": "教学示意 · 摘要与原始页，各有用途",
        "text": "手记的常用信息页记录当前概况，日期索引帮助找到旧页。这个比喻只说明不同访问方式；原文的具体类别和更新规则以下方为准。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同一份历史，怎样组织成可用资料？",
          "desc": "<b>【论文明确提出】</b> Core 分 Human / Persona；Semantic 保存事实、偏好和视觉概念；Episodic 按话题保存摘要、关键词与原始轮次索引；Procedural 保存用户目标与习惯。P 单独表示 Big Five，不是第五类 memory。<a href=\"https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：补充材料 A.1–A.3，PDF 1–2 页</a>",
          "componentId": "memory-map"
        }
      ],
      "insight": "Semantic / Episodic 追加历史；Core / Procedural 保留最新可变版本。原始图文对话不删除。",
      "takeaways": [
        {
          "icon": "·",
          "title": "资料不是一类",
          "desc": "四类 memory 的用途与管理策略不同，内容可有交叠。"
        },
        {
          "icon": "·",
          "title": "persona ≠ P",
          "desc": "Core 的 Persona block 与五维人格 profile 是不同对象。"
        },
        {
          "icon": "·",
          "title": "保留证据",
          "desc": "Episodic 通过索引组织原始文本与完整图片。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "变化中的用户，如何更新人格画像？",
      "badge": "both",
      "badgeLabel": "长期变化",
      "bridge": "一句话透露的状态可能只是短暂波动。如何吸收本轮线索，又避免长期人格画像被一次表达完全覆盖？",
      "analogy": {
        "title": "教学示意 · 修订一行，而非擦掉全册",
        "text": "当前概况可以修订，旧页仍可保留。偏好记录的更新与人格数值的平滑，是两种不同机制，不把喜欢什么直接等同于某个人格维度。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "沿着时间线，看人格状态怎样更新",
          "desc": "<b>【论文明确提出】</b> PEM 推断本轮 1–5 整数人格分数，用 EMA 更新长期浮点状态。全为中性分数 3 时跳过更新。<b>【教学解释】</b> 下方输入序列与初始值均为预设，不是论文实测人格轨迹。<a href=\"https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：补充材料 A.1、Fig.18</a>",
          "componentId": "persona-timeline"
        }
      ],
      "formula": {
        "lead": "先看一次表达怎样影响状态，再读 PEM 的平滑规则：",
        "unicode": "pₘ = λₘ pₘ₋₁ + (1 − λₘ) p′ₘ<br>λₘ = 0.7 − 0.2 cos(π · min(m, 50) / 50)",
        "symbols": [
          {
            "sym": "pₘ",
            "desc": "长期人格状态：五维实数向量，各维在 1–5；不要求和为 1。"
          },
          {
            "sym": "p′ₘ",
            "desc": "本轮推断的五维整数分数，各维 1–5；全为 3 时跳过本次更新。"
          },
          {
            "sym": "λₘ",
            "desc": "保留旧状态的权重。随轮次增大而提高，m≥50 时为0.9。"
          },
          {
            "sym": "m",
            "desc": "交互轮次。演示 p₀=(3,3,3,3,3) 不是原文披露的统一初始化。"
          }
        ]
      },
      "insight": "Long-Term Personalization 指跨会话、带时间线的动态用户理解，不是无限记忆或真实人格测量。",
      "takeaways": [
        {
          "icon": "·",
          "title": "状态随时间变",
          "desc": "偏好与人格线索都可能改变，但更新方式不同。"
        },
        {
          "icon": "·",
          "title": "估计不是真值",
          "desc": "PEM 平滑模型推断；曲线变化不证明心理测量准确。"
        },
        {
          "icon": "·",
          "title": "长期有范围",
          "desc": "训练20–100轮、最长1月；测试20–100或100–500轮、最长3月，均为模拟。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "当前图文如何找到相关的过去？",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "用户说“上次那个东西”时，只有关键词相似可能还不够。PersonaVLM 需要决定是否检索、查哪段时间，以及是否继续查找。",
      "analogy": {
        "title": "教学示意 · 从日期索引找到相关页",
        "text": "带着当前问题查手记时，日期能排除不合适的旧记录；找到一页后，可能还需要另一条证据。这对应有条件的多步资料取用。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "推理时，哪些信息真正可见？",
          "desc": "<b>【论文明确提出】</b> 文本检索先按时间过滤，再并行搜索 Procedural、Semantic、Episodic。编码与索引采用 all-MiniLM-L6-v2 与 FAISS；默认 procedural / semantic / episodic top-k 为 2 / 4 / 2。含图输入还触发 Grounding DINO + CLIP 视觉概念匹配；当前图片仍是 MLLM 输入。下面是自制运行轨迹，不是论文真实推理日志。<a href=\"https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：主文 §3.1；补充 A.2、Algorithm 1、Figs.16–17</a>",
          "componentId": "process"
        }
      ],
      "insight": "128k 是历史评估配置，不表示每一步都读入 128k 全量原始历史。",
      "takeaways": [
        {
          "icon": "·",
          "title": "先判断",
          "desc": "证据足够时可直接回答，并非每问必检索。"
        },
        {
          "icon": "·",
          "title": "时间与语义",
          "desc": "生成关键词和时间范围，再从不同类型资料中找证据。"
        },
        {
          "icon": "·",
          "title": "视觉有两条作用",
          "desc": "当前图像参与理解，已保存概念与历史补充用户关联。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "模型怎样学会记忆管理和检索？",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "结构化保存、检索和回应并非只靠列出资料类别。模型需要学习这些操作，但日常写入用户资料不等于重新训练参数。",
      "analogy": {
        "title": "教学示意 · 练习写法，与日常记事分开",
        "text": "学会怎样记录、怎样查阅，是能力训练；每次把新经历写入手记，则是使用这种能力。两者改变的对象不同。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "训练与使用，改变的分别是什么？",
          "desc": "<b>【论文明确提出】</b> 约 78k SFT 样本训练人格推断、记忆管理与结构化轨迹；约 5.6k RL 样本以 GRPO 增强推理。从 PersonaHub 采样并随机赋予人格特征，以 Seed1.6-thinking 合成图文对话与中间监督；500 训练、200 测试 personas 分开。训练 QA 答案仅据当前问题和检索内容重建。原文未交代完整参数冻结范围或 SFT loss / mask 细节。<a href=\"https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：主文 §3.2–§4；补充 B.2–C</a>",
          "componentId": "process"
        }
      ],
      "formula": {
        "lead": "RL 的轨迹奖励组合如下；未披露的 judge 分值刻度不自行补造：",
        "unicode": "rᵢ = f_acc(R̂, Rτᵢ) · f_cons(Q, Rτᵢ) + 0.5 · f_format(Rτᵢ)",
        "symbols": [
          {
            "sym": "f_acc",
            "desc": "参考答案与轨迹回答的准确性，由 Qwen3-30B-A3B 零样本打分。"
          },
          {
            "sym": "f_cons",
            "desc": "推理与最终答案的逻辑一致性；与准确性项相乘。"
          },
          {
            "sym": "f_format",
            "desc": "规定输出格式的遵守程度；系数为0.5。"
          },
          {
            "sym": "GRPO",
            "desc": "本文用 GRPO 比较同一问题的一组候选轨迹奖励，形成相对 advantage 并更新 policy，以增强多轮推理/检索。目标含 clipped surrogate 与 KL 正则，loss 仅计算生成 token。"
          }
        ]
      },
      "insight": "参考答案、监督目标与奖励裁判属于训练；推理时不获得待回答问题的真值。",
      "takeaways": [
        {
          "icon": "·",
          "title": "SFT",
          "desc": "学习结构化记忆操作、人格推断与检索回答示例。"
        },
        {
          "icon": "·",
          "title": "RL",
          "desc": "比较同组轨迹，优化推理与检索行为；不是直接测量真实人格。"
        },
        {
          "icon": "·",
          "title": "披露边界",
          "desc": "视觉编码器和各模块训练/冻结范围，原文未明确说明。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "从“记住”到“对齐”，实验怎样验证？",
      "badge": "both",
      "badgeLabel": "实验",
      "bridge": "“更了解用户”不是单一分数。先区分历史理解、人格对齐和开放生成，再在同一口径内比较模型。",
      "analogy": {
        "title": "教学示意 · 比较同一类记录",
        "text": "比较手记是否有用，先要确认是在比回忆细节、最新偏好，还是回应方式。评价问题不同，分数就不能直接互换。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "在同一评测口径下比较",
          "desc": "<b>【实验结果支持】</b> Persona-MME 报告 2,034 个 in-situ cases，基于合成对话，由 Gemini-2.5-Pro 生成初始问题并经人工审核；覆盖七方面、14 任务；PERSONAMEM 测动态用户理解，P-SOUPS 测给定 profile 的二选一对齐。主表1的六方面 overall 与补表4 comprehensive overall 分开读。<a href=\"https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：主文 Tables 1–2；补充 Tables 4–7</a>",
          "componentId": "results"
        }
      ],
      "insight": "提高多少必须同时说明：哪个 benchmark、哪种 context、相对哪种设置，以及差值是否为百分点。",
      "takeaways": [
        {
          "icon": "·",
          "title": "同口径",
          "desc": "Full、简单 RAG、SFT、RL 的标签和来源始终保留。"
        },
        {
          "icon": "·",
          "title": "不只看领先",
          "desc": "P-SOUPS 49.60 的绝对分数与二选一随机期望接近。"
        },
        {
          "icon": "·",
          "title": "胜率不是准确率",
          "desc": "开放生成200问由自动模型裁判作成对比较。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "拆掉一个组件，能力会失去多少？",
      "badge": "both",
      "badgeLabel": "消融",
      "bridge": "整体成绩提高，仍不能判断每个设计的作用。每次只移除论文实际测试过的一个组件，看什么能力受到影响。",
      "analogy": {
        "title": "教学示意 · 遮住一条记录，观察能否回答",
        "text": "一次只遮住一种资料，才能观察失去它的影响。这个类比不意味着多个消融降幅可以相加；实际结果以下方原表为准。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "Ablation Explorer：每次移除一个组件",
          "desc": "<b>【实验结果支持】</b> Table 8 比较四类 memory 与多轮推理/检索。w/o Reasoning 指关闭多轮检索；下方结构高亮是自制教学图，数值是论文实测。<a href=\"https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：补充 Table 8，PDF 9 页</a>",
          "componentId": "ablation"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "人格 profile 的更新是否有用？",
          "desc": "<b>【实验结果支持】</b> Table 9 的 PEM 消融属于 P-SOUPS，不能与上面的 Persona-MME 分数混画。比较的是完整组件，不是对所有 EMA 调度的独立检验。<a href=\"https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：补充 Table 9</a>",
          "componentId": "ablation"
        }
      ],
      "insight": "Episodic 的移除造成最大整体下降；这支持相关原始历史访问的重要性，而非每项子任务都同等依赖它。",
      "takeaways": [
        {
          "icon": "·",
          "title": "历史访问重要",
          "desc": "Episodic 移除：32k下降12.41pp，128k下降5.19pp。"
        },
        {
          "icon": "·",
          "title": "多步有作用",
          "desc": "关闭多轮检索使两个 context 配置的 overall 都下降。"
        },
        {
          "icon": "·",
          "title": "不相加推测",
          "desc": "各项是单独消融；没有报告的联合设置不生成分数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "长期个性化走到了哪里？",
      "badge": "both",
      "badgeLabel": "边界与总结",
      "bridge": "最后把整体增益放回任务边界：它在哪些地方有效，哪些能力仍然落后，又有哪些问题尚未被验证？",
      "analogy": {
        "title": "教学示意 · 合上手记，保留边界",
        "text": "一册持续更新的手记能够提供相关证据，却不会自动解决所有记忆、理解与测量问题。论文的贡献与尚未完成的部分需要一起保留。",
        "componentId": "notebook-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "重新检查优势，也看不足与成本",
          "desc": "<b>【实验结果支持】</b> 视觉回忆仍落后于部分模型；补表4 overall 低于 GPT-5。效率时间未计入异步更新，完整推理版本耗时更长。下方可切换不足与效率视图。<a href=\"https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf\" target=\"_blank\" rel=\"noreferrer\">出处：补充 Tables 4、11</a><br><b>原论文图：Fig.6</b> 展示作者选取的成功案例；不代表随机总体。火车颜色案例中 GPT-4o 也答对。<a href=\"./images/fig6.png\" target=\"_blank\" rel=\"noreferrer\">查看原图</a><br><b>开放生成（200问，Gemini-2.5-Pro裁判）：</b>对 Qwen2.5-VL-7B 的胜/平/负为92.5/2.5/5.0%，对 InternVL3-8B 为84.0/7.5/8.5%，对 GPT-4o 为79.0/5.0/16.0%。这是成对偏好判断，不是准确率；原文未公开系统的逐例失败集。",
          "componentId": "results",
          "figure": "./images/fig6.png"
        }
      ],
      "insight": "作者明确指出：尚不支持视频/音频中的人物识别跟踪，受 backbone 能力限制，尚未连接或合并跨时间相关 episodic。",
      "takeaways": [
        {
          "icon": "·",
          "title": "得到支持",
          "desc": "动态资料管理、多步取用和人格条件，在所测协议中有收益。"
        },
        {
          "icon": "·",
          "title": "尚未验证",
          "desc": "合成长期评测不等于真实长期部署；人格估计、完整隐私与遗忘仍有证据边界。"
        },
        {
          "icon": "·",
          "title": "保留成本",
          "desc": "完整推理2170 tokens、10.18秒；更新未计入。低token不等于更快。"
        }
      ]
    }
  ]
};
