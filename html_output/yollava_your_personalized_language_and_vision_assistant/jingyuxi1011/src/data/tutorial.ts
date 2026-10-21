import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Yo'LLaVA: Your Personalized Language and Vision Assistant",
    "titleZh": "你的个性化语言与视觉助手",
    "venue": "NeurIPS 2024",
    "authors": "Thao Nguyen · Haotian Liu · Yuheng Li · Mu Cai · Utkarsh Ojha · Yong Jae Lee",
    "affiliation": "University of Wisconsin–Madison",
    "domain": "个性化多模态模型",
    "coreProblem": "模型认识一只狗，却未必认识用户自己的 <bo>。",
    "coreInsight": "用少量参考图片学习一个具体主体的表示，让 LMM 在后续<b>文本与视觉对话</b>中使用它。",
    "keywords": [
      "5 张参考图片",
      "16 个 latent tokens",
      "冻结 LLaVA",
      "文本 + 视觉对话"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "识别类别：一只狗。<br/>用户的主体身份仍然未知。",
      "componentId": "hero-generic"
    },
    "newMethod": {
      "desc": "学习具体主体：&lt;bo&gt;。<br/>随后在文字与图片问题中调用它。",
      "componentId": "hero-personalized"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "认识“一只狗”，为什么还不认识 <bo>？",
      "badge": "inf",
      "badgeLabel": "Introduction",
      "bridge": "通用多模态模型会描述一只狗，却未必知道这就是用户的 &lt;bo&gt;。本文要连接的是“具体主体的身份”与后续对话。",
      "analogy": {
        "title": "类别标签与自己的相册",
        "text": "“柴犬”说明类别；“我的 &lt;bo&gt;”指向一个具体个体。只知道类别不能确定用户说的是谁。",
        "componentId": "album-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "类别描述，还是主体描述？",
          "desc": "同一张论文图片，切换两种模型设定。下面的简短回答是教学示意，不是论文逐字输出。",
          "componentId": "generic-compare"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "具体主体",
          "desc": "“一只狗”与“用户自己的那只狗”是两个问题。"
        },
        {
          "icon": "▣",
          "title": "输入材料",
          "desc": "少量相同主体照片加主体标识，而非要求手工标注整套问答。"
        },
        {
          "icon": "↗",
          "title": "任务目标",
          "desc": "在后续文本和视觉对话中正确引用并理解这个主体。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "用少量照片教会一个主体",
      "badge": "both",
      "badgeLabel": "Overview",
      "bridge": "确认主体是什么之后，看看用户提供哪些信息，以及模型最终保留什么。少量照片是学习材料，不是每次提问都要重复上传的相册。",
      "analogy": {
        "title": "照片是学习材料",
        "text": "用户提供同一主体的少量参考图片和名字。模型从这些图片准备监督，学习随后可调用的主体表示。",
        "componentId": "album-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "从照片到可以调用的表示",
          "desc": "默认每主体 5 张参考图片；论文展示的相册缩略图只是其中的示例。随后学习的是主体提示，而不是将参考图库永久附在每个问题前。",
          "componentId": "overview-map"
        }
      ],
      "takeaways": [
        {
          "icon": "5",
          "title": "少量参考图",
          "desc": "默认 5 张主体图片，不等于只有 5 条训练样本。"
        },
        {
          "icon": "16",
          "title": "紧凑主体提示",
          "desc": "默认 16 个 latent tokens 加一个主体标识。"
        },
        {
          "icon": "⇄",
          "title": "两种调用",
          "desc": "同一学习表示服务文本和视觉对话。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "主体怎样进入 LLaVA？",
      "badge": "trn",
      "badgeLabel": "Learning Personalized Subjects",
      "bridge": "整体方法的关键是主体表示。下面把“可读的主体标识”和“学习得到的连续嵌入”分开，再看它们如何进入 LLaVA。",
      "analogy": {
        "title": "名字与表示各司其职",
        "text": "标识像相册的名字，latent tokens 承载学习得到的视觉信息。这个类比不意味着每个 token 都对应一个可读属性。",
        "componentId": "album-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "标识、latent tokens 与冻结模型",
          "desc": "点击路径上的组件，查看它的职责和是否参与更新。默认 k=16，因此新增输入嵌入总数是 17。",
          "componentId": "subject-architecture"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "优化目标：让表示支持回答",
          "desc": "识别任务保留图片，属性问答在 personalization 优化时不带图片。两者都通过目标回答的语言建模监督更新同一组小参数。",
          "componentId": "training-objective"
        }
      ],
      "takeaways": [
        {
          "icon": "⌁",
          "title": "连续嵌入",
          "desc": "latent tokens 不是普通词，也没有固定逐槽属性含义。"
        },
        {
          "icon": "17",
          "title": "可学习输入",
          "desc": "默认更新一个标识嵌入与 16 个 latent token 嵌入。"
        },
        {
          "icon": "◇",
          "title": "冻结主体模型",
          "desc": "原视觉编码器、投影器、LLM 权重保留；输出仅更新新标识列。"
        }
      ],
      "formula": {
        "lead": "只优化新主体相关的 θ；公式 (1) 将目标回答分解为逐 token 条件概率。问题与主体提示在上下文中，属性问答训练省略图像条件。",
        "unicode": "θ = {eₛₖₛ, e₁, …, eₖ, W[:, N+1]}<br/>p(Xₐ | Iⁱ) = ∏<sub>j=1</sub><sup>L</sup> pθ(xⱼ | Iⁱ, Xₐ,&lt;ⱼ)",
        "symbols": [
          {
            "sym": "θ",
            "desc": "可学习变量：k+1 个新增输入嵌入与新主体标识的输出权重列。其余模型参数冻结。"
          },
          {
            "sym": "eₖ",
            "desc": "第 k 个 latent token 的连续输入嵌入；k 是 latent tokens 数量，默认 16，不含主体标识。"
          },
          {
            "sym": "W",
            "desc": "论文采用 C×N 的输出分类器记法，扩展后为 C×(N+1)，只更新新增列。"
          },
          {
            "sym": "Iⁱ",
            "desc": "识别训练的输入图片。属性对话优化时不输入这张图片。"
          },
          {
            "sym": "xⱼ",
            "desc": "目标回答的第 j 个 token；Xₐ,<ⱼ 为预测前可见上下文，L 为回答长度。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "先学习，再调用",
      "badge": "both",
      "badgeLabel": "Personalization Pipeline",
      "bridge": "知道哪些参数可学习后，还要知道监督从哪里来。训练准备、参数优化和实际调用是不同环节。",
      "analogy": {
        "title": "准备、学习、使用",
        "text": "准备问答时可以看照片；属性对话优化时特意去掉照片；后来提问则调用已经学好的表示。",
        "componentId": "album-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "训练与推理使用不同路径",
          "desc": "准备数据时，参考图用于构造识别与属性监督；参数优化只更新新主体相关变量。推理使用已经学习的提示与新问题。",
          "componentId": "pipeline-switch"
        }
      ],
      "takeaways": [
        {
          "icon": "▣",
          "title": "识别监督",
          "desc": "正例、随机负例与检索困难负例教模型判断主体是否出现。"
        },
        {
          "icon": "◇",
          "title": "属性监督",
          "desc": "生成问答时看图，优化时去图，促使属性进入主体表示。"
        },
        {
          "icon": "→",
          "title": "调用阶段",
          "desc": "使用学好的提示，不在每个问题上再次优化 token。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "无图与有图的两种对话",
      "badge": "inf",
      "badgeLabel": "Personalized Conversation",
      "bridge": "同一主体表示有两种调用方式：没有新图片时调用已学属性，有新图片时结合当前场景判断身份与活动。",
      "analogy": {
        "title": "已学外观与眼前场景",
        "text": "旧照片能教会主体长什么样；只有新图片才能支持“它现在在这张图里做什么”的判断。",
        "componentId": "album-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "文本对话与视觉对话",
          "desc": "文本示例来自 Table 7；含主体图片来自 Table 3；主体不在图中的例子来自 Table 12。它们不是同一段连续对话。",
          "componentId": "conversation-switch"
        }
      ],
      "takeaways": [
        {
          "icon": "T",
          "title": "文字调用",
          "desc": "没有新图时回答已学属性，不能凭空知道当前场景。"
        },
        {
          "icon": "V",
          "title": "视觉调用",
          "desc": "结合新图判断主体是否出现，并描述当前活动。"
        },
        {
          "icon": "!",
          "title": "拒认也必要",
          "desc": "图里有一只同类猫，不意味着图里有 <mam>。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "实验验证了什么？",
      "badge": "both",
      "badgeLabel": "Experiments",
      "bridge": "能举例回答还不够，需要看受控评测。这里分别看主体识别、文本问答、视觉问答与 caption 中的名称使用。",
      "analogy": {
        "title": "分别衡量不同能力",
        "text": "认出是谁、选对答案、在描述中用对名称，分别需要不同的评测。一个数字不能替代所有能力。",
        "componentId": "album-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "四组证据，四个明确的问题",
          "desc": "所有结果标出任务、指标、基线与来源。Table 5 的识别指标是正负正确率等权平均；Table 6 的名称 recall 使用另一套 29 物体协议。",
          "componentId": "results-cards"
        }
      ],
      "takeaways": [
        {
          "icon": "92.4",
          "title": "主体识别",
          "desc": "Table 5 的 weighted accuracy 为 92.4%。"
        },
        {
          "icon": "88.3",
          "title": "文本问答",
          "desc": "400 条 A/B 问答准确率为 88.3%，并非全面对话质量。"
        },
        {
          "icon": "100",
          "title": "名称 recall",
          "desc": "在 29 物体协议中，名称出现 recall 为 100%，并非描述全对。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "什么让个性化有效？",
      "badge": "both",
      "badgeLabel": "Ablation & Generalization",
      "bridge": "主结果说明方法可用；消融进一步检查训练数据、图片数量与表示长度的作用。不同消融条件不能拼成一个性能预测器。",
      "analogy": {
        "title": "检验相册里学到了什么",
        "text": "改变参考材料或表示长度，再观察识别结果。消融回答的是特定设置下的作用，不是通用定律。",
        "componentId": "album-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "改变训练设置，结果怎样变化？",
          "desc": "Table 7 展示累计数据设置；Figure 5 分别固定图数量或 token 数量。曲线没有精确数值表，因此不补造读图小数。",
          "componentId": "ablation-explorer"
        }
      ],
      "takeaways": [
        {
          "icon": "↑",
          "title": "监督共同作用",
          "desc": "困难负例使同一累计设置识别指标由 75.4% 到 91.4%。"
        },
        {
          "icon": "≈",
          "title": "图片与表示长度",
          "desc": "作者选择 n=5、k=16；消融条件各自固定，曲线不保证单调。"
        },
        {
          "icon": "↗",
          "title": "有限迁移证据",
          "desc": "新图与未训练问题有成功例子，未证明任意变化下都可靠。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "会认错，也会编造",
      "badge": "both",
      "badgeLabel": "Failure Cases & Limitations",
      "bridge": "成功案例展示能力，失败案例划定边界。模型仍可能漏认、误认，或在没有证据时编造个人信息。",
      "analogy": {
        "title": "熟悉也可能认错",
        "text": "远处的小脸可能被漏认，相似的眼镜与发型可能造成误认。记住外观不等于掌握所有个人信息。",
        "componentId": "album-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "真实失败，与尚未验证的能力",
          "desc": "Table 15 保留作者展示的漏认、误认与幻觉。长期记忆和持续状态更新等能力则属于实验范围之外。",
          "componentId": "failure-explorer"
        }
      ],
      "takeaways": [
        {
          "icon": "!",
          "title": "作者明确失败",
          "desc": "小脸漏认、相似人物误认及生日、手表幻觉。"
        },
        {
          "icon": "◇",
          "title": "未验证扩展",
          "desc": "多主体有例子，但规模化、多轮持续状态与偏好未系统验证。"
        },
        {
          "icon": "⌛",
          "title": "仍需学习",
          "desc": "新主体需独立 personalization；不等于自动长期个人记忆。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "从主体表示到个性化回答",
      "badge": "both",
      "badgeLabel": "Summary",
      "bridge": "回到最初的问题：少量照片怎样变成可调用的主体表示？把输入、学习、调用和证据连成一条完整理解。",
      "analogy": {
        "title": "把主体带入下一次对话",
        "text": "Yo’LLaVA 把具体主体的信息装入可学习提示，让冻结的 LLaVA 在后续文字或图片问题中调用它。",
        "componentId": "album-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "检验你的完整理解",
          "desc": "用三个简短判断检查是否分清主体表示、推理调用与实验结论。",
          "componentId": "summary-check"
        }
      ],
      "takeaways": [
        {
          "icon": "◎",
          "title": "问题",
          "desc": "让通用 LMM 理解用户的具体主体。"
        },
        {
          "icon": "⌁",
          "title": "机制",
          "desc": "少量图片形成监督，学习主体标识与连续 latent tokens。"
        },
        {
          "icon": "↔",
          "title": "边界",
          "desc": "识别与问答的改进不等于完整个人 Agent。"
        }
      ]
    }
  ]
};
