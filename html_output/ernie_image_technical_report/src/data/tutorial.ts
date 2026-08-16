import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ERNIE-Image Technical Report",
    "titleZh": "ERNIE-Image 技术报告：从数据监督到开放文生图系统",
    "venue": "arXiv 预印本 · 2026",
    "authors": "ERNIE Team, Baidu",
    "affiliation": "Baidu",
    "domain": "文生图 · 潜空间扩散 · DiT · 偏好对齐 · 蒸馏 · 审美评估",
    "coreProblem": "开放权重文生图模型在复杂指令、可见文字和审美质量上仍有缺口；单纯扩大模型参数规模会遇到边际收益递减和更高计算成本，不能替代对数据与监督质量的改进。",
    "coreInsight": "ERNIE-Image 以 8B 单流 DiT 为生成主体，把预训练数据组织、分辨率课程、真实提示适配、偏好对齐、多教师蒸馏和审美评估接成一条可检查的系统链路。",
    "keywords": [
      "8B 单流 DiT",
      "分层采样",
      "SFT 与 PE",
      "DPO 锚定",
      "MT-DMD",
      "ERIA-1K"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统思路主要通过<b>提高模型参数规模</b>增强能力；论文指出这种直接扩展会出现边际收益递减，并增加计算需求。",
      "componentId": "poster-hero"
    },
    "newMethod": {
      "desc": "ERNIE-Image 用<b>数据—训练—对齐—蒸馏—评估</b>的完整链路提高模型能力，而不是把扩大参数规模作为唯一杠杆。",
      "componentId": "poster-hero"
    }
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "为什么需要一个开放、强大且易用的文生图模型？",
      "badge": "inf",
      "badgeLabel": "Motivation",
      "bridge": "论文从现实落差出发：领先文生图模型多为闭源，限制深入研究、私有部署和垂直微调；现有开源模型又难以同时兼顾能力、计算成本与易用性。",
      "analogy": {
        "title": "把封闭的专业工具变成可打开的工具箱",
        "text": "展柜里的工具再强，也难以拆解和改造；论文希望提供一套能够打开、能力足够而且容易使用的工具箱。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "沿四步问题链读懂论文动机",
          "desc": "依次点击“闭源壁垒、开源两难、能力缺口、论文目标”，查看每一步如何推出下一步。这里呈现的是引言中的问题陈述，不虚构参数规模消融。",
          componentId: "ch1-motivation"
        }
      ],
      "insight": "ERNIE-Image 的出发点是缩小开源模型与领先闭源系统之间的差距，并让复杂文生图能力能够被研究、部署和实际使用。",
      "takeaways": [
        {
          "icon": "🔓",
          "title": "开放性缺口",
          "desc": "闭源策略限制深入研究、私有部署与垂直领域微调。"
        },
        {
          "icon": "⚠️",
          "title": "开源两难",
          "desc": "直接扩展规模带来成本与边际收益问题，高效小模型又仍有困难任务短板。"
        },
        {
          "icon": "🎯",
          "title": "论文目标",
          "desc": "构建开放、强大、易用的模型，重点补齐复杂指令、文字渲染与审美生成。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "ERNIE-Image 的整体架构是什么？",
      "badge": "inf",
      "badgeLabel": "架构",
      "bridge": "论文没有给出正式架构图。本节依据 Introduction 明确公开的组件重建高层架构：8B 单流 DiT 是生成主体，FLUX.2 VAE 提供图像潜空间，Ministral-3（3B）提供文字条件，Prompt Enhancer 与 ERNIE-Image-Aes 分别承担提示扩展和数据/评估侧路。",
      "analogy": {
        "title": "先把生成主路与辅助侧路分开",
        "text": "像阅读一张系统蓝图：文字条件与图像潜变量汇入生成主体；提示增强发生在输入前，Aes 则位于数据筛选和审美评估侧。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "沿高层架构图追踪每个组件",
          "desc": "先查看根据论文文字生成的顶会风格架构图，再点击组件追踪生成主路或数据/评估侧路。图中不补写论文未公开的张量尺寸、层数和逐层连接。",
          componentId: "ch2-representation"
        }
      ],
      "insight": "ERNIE-Image 的核心是受文字条件约束的 8B 单流 DiT；Prompt Enhancer 改写输入，VAE 管理图像潜空间，Aes 负责数据与评估，它们不能互相替代。",
      "takeaways": [
        {
          "icon": "🖼️",
          "title": "生成主体",
          "desc": "8B 单流 DiT 接收文字条件与图像潜变量，是核心生成器。"
        },
        {
          "icon": "📝",
          "title": "双路条件",
          "desc": "Ministral-3（3B）形成文字条件，FLUX.2 VAE 提供图像潜空间。"
        },
        {
          "icon": "📐",
          "title": "辅助组件",
          "desc": "Prompt Enhancer 是可选输入预处理；Aes 位于数据筛选和审美评估侧，不直接生成图像。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "海量数据如何同时保住长尾和质量？",
      "badge": "inf",
      "badgeLabel": "预训练数据",
      "bridge": "表征确定后，下一步是决定喂给模型什么数据。论文把类间语义覆盖与类内审美质量拆成两级问题，并增加文字感知描述。",
      "analogy": {
        "title": "把一张样片推到合适的位置",
        "text": "只挑热门漂亮样片会丢掉长尾，只追求稀有也不保证质量。两级采样把这两个问题分开处理。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "拖动样片，分清两级采样",
          "desc": "水平拖动表示从常见类别到长尾覆盖，垂直拖动表示同一类别内从较低到较高审美质量；再对比“只描述画面”和“同时写入图中文字”，观察文字感知描述究竟多保留了什么信息。坐标明确标注为教学示意，不显示虚构概率。",
          componentId: "ch3-data"
        }
      ],
      "insight": "一个总体质量排名无法同时修复长尾缺失；类间覆盖和类内择优必须分开解释。",
      "takeaways": [
        {
          "icon": "🗂️",
          "title": "语义组织",
          "desc": "论文用 10,000 个细粒度类别组织预训练数据。"
        },
        {
          "icon": "⚖️",
          "title": "两级分工",
          "desc": "类间采样关注覆盖，类内采样结合 ERNIE-Image-Aes 分数关注质量。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-9",
      "title": "审美分数从哪里来，又如何服务数据筛选？",
      "badge": "trn",
      "badgeLabel": "审美数据治理",
      "bridge": "上一章的类内采样依赖可靠的审美分数。本章继续追问这个分数如何获得：论文先用两两判断和 Swiss 配对构造人工标签，再训练 ERNIE-Image-Aes 为预训练语料评分；ERIA-1K 则作为持出集检查评分器是否符合人工判断。",
      "analogy": {
        "title": "只比较这一对校样",
        "text": "绝对打分容易随时间漂移，两两判断只回答“这一对谁更美”。Swiss配对再让相近名次继续比较。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "从 Swiss 标注到 ERNIE-Image-Aes",
          "desc": "原始 Swiss 标注界面与层级预览图展示论文的标签构建方法；Canvas 名次和三轮配对只用于解释机制。切到 ERIA-1K 后，可查看评分器在持出集上的 SRCC、PLCC；这些结果验证评分器，而审美分数随后用于预训练数据的过滤与分层采样。",
          componentId: "ch9-aesthetic"
        }
      ],
      "insight": "Swiss 人工标注负责建立审美监督，ERNIE-Image-Aes 把这种监督扩展到海量预训练图片，ERIA-1K 再独立检查评分器的泛化能力；三者分别对应标签、应用与验证。",
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "相近排名配对",
          "desc": "Swiss 赛制把当前排名接近的样本集中到后续两两比较。"
        },
        {
          "icon": "🧹",
          "title": "服务预训练数据",
          "desc": "ERNIE-Image-Aes 为候选图片打分，用于大规模过滤和分层采样。"
        },
        {
          "icon": "📊",
          "title": "持出验证",
          "desc": "ERIA-1K 用于评测评分器相关性，不是 ERNIE-Image-Aes 的训练集。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "渐进提高分辨率的三阶段训练策略",
      "badge": "trn",
      "badgeLabel": "预训练课程",
      "bridge": "语义组织、文字描述与审美筛选共同确定预训练数据后，基础模型再按 256×256、512×512、1024×1024 三段课程逐步提高分辨率，并在每个阶段保留多种长宽比。",
      "analogy": {
        "title": "把取景框扩到目标尺寸",
        "text": "先练整体布局，再提高细节分辨率；每一步都保留不同长宽比，而不是只练正方形。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "推进三段分辨率课程",
          "desc": "用前后按钮推进论文报告的三段分辨率，再切换正方形、竖版或横版取景框。页面不生成质量百分比、阶段步数或优化器参数。",
          componentId: "ch4-curriculum"
        }
      ],
      "insight": "分辨率课程解决的是基础训练如何逐步提高细节。",
      "takeaways": [
        {
          "icon": "1️⃣",
          "title": "三段分辨率",
          "desc": "预训练依次采用 256×256、512×512 和 1024×1024。"
        },
        {
          "icon": "▭",
          "title": "多种长宽比",
          "desc": "三个阶段都保留多种长宽比，不等于只训练正方形。"
        },
        {
          "icon": "🧱",
          "title": "训练课程",
          "desc": ""
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "模型如何听懂真实用户的不同说法？",
      "badge": "both",
      "badgeLabel": "SFT与PE",
      "bridge": "训练期的监督微调（SFT）让模型见过不同领域与用户表达，推理前的提示增强器（Prompt Enhancer, PE）再把过短输入扩成结构化说明；两者相邻但不相同。",
      "analogy": {
        "title": "把标准说明改成用户会说的话",
        "text": "训练时先见过短词、自然请求和详细构图，使用时再把过短需求补成结构化说明。两步发生在不同阶段。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "同一图片，换成四种用户表达",
          "desc": "选择重点领域与用户表达形式，观察训练期 SFT 如何构造多样提示。K2.5 改写属于训练数据构建，不是运行时提示增强。",
          componentId: "ch5-sft"
        },
        {
          kind: "module",
          "id": "6.2",
          "title": "Prompt Enhancer",
          "desc": "",
          componentId: "ch5-pe"
        }
      ],
      "insight": "训练时让模型见过多种表达，解决的是鲁棒性；用户输入仍过短时，才轮到推理前的 PE。",
      "takeaways": [
        {
          "icon": "🏋️",
          "title": "SFT",
          "desc": "监督微调在训练期引入重点领域和多样用户表达。"
        },
        {
          "icon": "✍️",
          "title": "PE",
          "desc": "提示增强器在推理前把短提示扩成结构化说明。"
        },
        {
          "icon": "🖼️",
          "title": "强大的指令遵循",
          "desc": ""
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "偏好怎样进入流匹配训练而不被钻空子？",
      "badge": "both",
      "badgeLabel": "DPO",
      "bridge": "直接偏好优化（DPO）比较策略模型与冻结参考模型的胜负重建误差差距。只把负样本误差推高也能拉开差距，却会形成奖励投机；论文用胜负锚定项约束这种路径。",
      "analogy": {
        "title": "把偏好旋钮拧到安全区",
        "text": "只让负样本变得更差也能拉开差距，却会破坏模型。锚定项要求胜负两边都留在可控范围。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "对比健康优化与奖励投机",
          "desc": "分别拖动胜样本和负样本的教学误差，观察两条路径为什么都能降低 L_DPO；再把目标切换为 L_DPO + Anchor Losses，查看锚定惩罚如何改变 L_total 的优化方向。β=0.05、λ_win=0.35、λ_lose=0.15 是论文设置，其余数值为公式教学代入。",
          componentId: "ch6-dpo"
        }
      ],
      "insight": "降低胜样本误差和抬高负样本误差都能改善 DPO 单项；Anchor Losses 通过奖励前者、惩罚后者，让总目标区分健康优化与奖励投机。",
      "formula": {
        "lead": "sigmoid 是 logistic 函数 sigmoid(z)=1/(1+e^(−z))；这里的 sigmoid 与下一章表示噪声尺度的符号无关。",
        "unicode": "Diff_policy = ℓ_pol^win − ℓ_pol^lose<br/>L_DPO = −E[log sigmoid(−β(Diff_policy − Diff_ref))]<br/>L_total = L_DPO + λ_win E[ℓ_win] + λ_lose E[ℓ_lose]<br/>ℓ = ‖vθ(x_t,h,t) − v_t‖₂²",
        "symbols": [
          {
            "sym": "Diff_policy",
            "desc": "策略模型的胜样本重建误差减负样本重建误差。"
          },
          {
            "sym": "Diff_ref",
            "desc": "冻结参考模型按相同方式计算的胜负误差差距。"
          },
          {
            "sym": "sigmoid",
            "desc": "logistic 函数，把实数映射到 0 与 1 之间。"
          },
          {
            "sym": "β",
            "desc": "DPO 缩放系数，论文设置为 0.05。"
          },
          {
            "sym": "λ_win",
            "desc": "胜样本锚定权重，论文设置为 0.35。"
          },
          {
            "sym": "λ_lose",
            "desc": "负样本锚定权重，论文设置为 0.15。"
          },
          {
            "sym": "vθ",
            "desc": "策略模型预测的流匹配速度场。"
          },
          {
            "sym": "v_t",
            "desc": "时间 t 的目标流速度。"
          },
          {
            "sym": "h",
            "desc": "提示词隐藏状态。"
          },
          {
            "sym": "x_t",
            "desc": "时间 t 的噪声图像潜变量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "比较相对差距",
          "desc": "DPO 比较策略模型与冻结参考模型的胜负重建误差差距。"
        },
        {
          "icon": "⚠️",
          "title": "识别奖励投机",
          "desc": "无界 L2 误差会诱发只破坏负样本来拉开差距的路径。"
        },
        {
          "icon": "⚓",
          "title": "DPO",
          "desc": ""
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "ERNIE-Image-Turbo 如何兼顾速度与能力？",
      "badge": "trn",
      "badgeLabel": "MT-DMD",
      "bridge": "本章把两个阶段明确分开：训练时，MT-DMD 根据噪声状态、语义条件和 CA/DM 目标组合多位教师的监督；蒸馏完成后，Turbo 学生模型独立完成 8 NFE（八次模型函数求值），教师不再参与生成。",
      "analogy": {
        "title": "先由多位老师会诊，再让学生独立完成",
        "text": "训练阶段由不同领域教师共同监督学生；训练完成后，学生把这些能力带入自己的八次模型函数求值，推理时不再调用教师。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "8.1",
          "title": "分开观察 MT-DMD 训练与 8 NFE 推理",
          "desc": "",
          componentId: "ch7-turbo"
        }
      ],
      "insight": "MT-DMD 是训练期的多教师监督机制，8 NFE 是蒸馏后 Turbo 的推理预算；教师能力被吸收到学生参数中，而不是在推理八步里继续路由。",
      "formula": {
        "lead": "论文给出单个路由权重属于 [0,1]，但没有报告所有权重和为 1，也没有公开逐步路由轨迹。",
        "unicode": "x̂₀ = Σₖ Wₖ(x_t, noise_scale, c, O) · Eₖ(x_t, noise_scale, c)",
        "symbols": [
          {
            "sym": "x̂₀",
            "desc": "多教师集合给出的去噪目标。"
          },
          {
            "sym": "Eₖ",
            "desc": "第 k 个专家教师。"
          },
          {
            "sym": "Wₖ",
            "desc": "第 k 个专家的路由权重，论文给出的范围为 [0,1]。"
          },
          {
            "sym": "x_t",
            "desc": "当前噪声图像潜变量。"
          },
          {
            "sym": "noise_scale",
            "desc": "扩散噪声尺度，与上一章的 sigmoid 函数不是同一概念。"
          },
          {
            "sym": "c",
            "desc": "语义条件。"
          },
          {
            "sym": "O",
            "desc": "优化目标分支，取 CA 或 DM。"
          }
        ]
      },
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-10",
      "title": "结果",
      "badge": "both",
      "badgeLabel": "结果与边界",
      "bridge": "每个结果都绑定具体数据集、模型版本、指标方向和证据强度。公开基准、内部人工评测与定性图片不能被混成一个跨协议总排名。",
      "analogy": {
        "title": "只给同一份验收表盖章",
        "text": "不同测试集像不同验收表，不能混成一场总排名。每次只在同一协议里比较。",
        "componentId": "poster-analogies"
      },
      "modules": [
        {
          kind: "module",
          "id": "9.1",
          "title": "先看论文原图，再读取对应评测表",
          "desc": "",
          componentId: "ch10-results"
        }
      ],
      "takeaways": []
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1qMdzB1E2T",
      "title": "6大维度硬核实测：ERNIE-Image 开源生图模型",
      "reason": "直接展示 ERNIE-Image 在文字、海报与复杂指令场景中的实际表现，适合作为论文结果的应用补充。",
      "cover": "https://i1.hdslb.com/bfs/archive/5e3c34eee7cd3200d029b745e90d818ace6d2158.jpg",
      "views": "1.6万播放"
    },
    {
      "bvid": "BV1cRwJeREgk",
      "title": "【NeurIPS 2024 Tutorial】Flow Matching for Generative Modeling",
      "reason": "系统讲解流匹配，为理解 DPO 中的速度预测误差提供数学背景。",
      "cover": "https://i2.hdslb.com/bfs/archive/8b8b9ed954bfb61bebe9a933b85b1858b644390d.jpg",
      "views": "2.6万播放"
    },
    {
      "bvid": "BV1ZzrHB8ESf",
      "title": "Decoupled DMD 与 DMDR：少步蒸馏实践",
      "reason": "播放量较低但主题直接覆盖 DMD、DMDR 与少步生成，对 MT-DMD 章节最相关。",
      "cover": "https://i2.hdslb.com/bfs/archive/998055e827346f09d41d3f8c57ab398f3e0a0796.jpg",
      "views": "1341播放"
    },
    {
      "bvid": "BV1Yu4y1w7Lt",
      "title": "Diffusion Model Alignment Using Direct Preference Optimization",
      "reason": "播放量较低但直接解释扩散模型中的 DPO，是偏好对齐章节的针对性延伸。",
      "cover": "https://i2.hdslb.com/bfs/archive/7ff127d72ac8a328291237e5c0b5c36728535d6f.png",
      "views": "1507播放"
    }
  ]
};
