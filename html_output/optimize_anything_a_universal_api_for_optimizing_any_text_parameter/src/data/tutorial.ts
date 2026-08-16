import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "optimize_anything: A Universal API for Optimizing any Text Parameter",
    "titleZh": "中文交互式论文教程",
    "venue": "CAIS 2026 · arXiv:2605.19633",
    "authors": "Lakshya A Agrawal, Donghyun Lee, Shangyin Tan, Wenjie Ma, Karim Elmaaroufi, Rohit Sandadi, Sanjit A. Seshia, Koushik Sen, Dan Klein, Ion Stoica, Joseph E. Gonzalez, Omar Khattab, Alexandros G. Dimakis, Matei Zaharia",
    "affiliation": "UC Berkeley · MIT",
    "domain": "LLM-based Text Optimization",
    "coreProblem": "Prompt、代码、Agent、调度策略乃至 SVG 都能写成文本，但传统优化器往往绑定对象类型与任务。能否只换 evaluator，就复用同一套搜索循环？",
    "coreInsight": "论文把候选统一成 <mark class=\"oa-key\">Text Artifact</mark>，把领域目标封装进 Evaluator，再用 Score 与 Side Information 驱动 Reflection、Mutation 和 Pareto 搜索。真正的核心不是“LLM 随便改文本”，而是用一个 <mark class=\"oa-key\">统一</mark> 接口持续、可诊断地 <mark class=\"oa-key warm\">优化</mark> 可评价的文本候选。",
    "keywords": [
      "统一 Text Optimization",
      "Side Information",
      "Pareto Search",
      "Single · Multi · Generalization"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>对象类型与优化流程绑定</b>：表示方式、反馈接口和搜索工作流都随 Prompt、Program、Agent 的变化而重新适配。",
      componentId: "optimize-anything-lab"
    },
    "newMethod": {
      "desc": "<b>统一表示，替换 evaluator</b>：不同对象先成为 Text Artifact x；领域差异进入 f(x,e)，Reflection、Mutation 与搜索策略得以复用。",
      componentId: "optimize-anything-lab"
    }
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "从专用优化器到 Universal Optimizer",
      "badge": "inf",
      "badgeLabel": "CORE · WHY",
      "bridge": "AlphaEvolve 能演化程序，GEPA 能根据反馈优化 Prompt。它们共同说明 LLM 已经可以承担优化器的角色；但优化对象一换，问题表示、反馈来源与搜索流程往往也要重新设计。",
      "analogy": {
        "title": "能力已经出现，但还没有统一",
        "text": "AlphaEvolve 面向程序，GEPA 面向 Prompt，Agent、调度策略和 Kernel 也各有自己的优化流程。现有方法证明了 LLM 优化的能力，同时也暴露出对象与优化器之间的专用绑定。",
        componentId: "optimize-anything-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "已有方法很强，但优化器仍然彼此专用",
          "desc": "AlphaEvolve 与 GEPA 都利用 LLM 持续提出并改进候选，但它们分别围绕程序和 Prompt 组织自己的优化闭环。点击任一方法，可以查看这两条闭环为何不能直接互换。",
          componentId: "optimize-anything-lab"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "统一抽象：把不同问题变成文本优化",
      "badge": "inf",
      "badgeLabel": "CORE · WHAT",
      "bridge": "Prompt、CUDA Kernel、Agent 与调度策略的结构和用途都不相同。论文能够用一个框架处理它们，关键不在于抹平领域差异，而在于为这些差异找到共同的优化接口。",
      "analogy": {
        "title": "不同对象如何进入同一个优化问题？",
        "text": "共同接口由两部分组成：一个可读取、可修改的 <b>Text Artifact（文本候选解）</b>，以及一个知道怎样评价它的 <b>Evaluator（评估器）</b>。",
        componentId: "optimize-anything-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "不同对象，先收束成 Text Artifact（文本候选解）",
          "desc": "选择论文中的对象，观察它们如何转换成优化器可以读取和修改的文本。Prompt 本身是文本；代码、Agent 架构、调度策略与图形描述也都能以程序或结构化文本保存。这里的 <b>Text Artifact</b> 更自然地理解为“文本候选解”。",
          componentId: "optimize-anything-lab"
        },
        {
          kind: "module",
          "id": "2.2",
          "title": "文本可以修改，但什么叫“更好”？",
          "desc": "仅仅把候选写成文本还不能产生优化方向。切换 AIME、Circle Packing 与 ARC-AGI，可以看到每个领域都需要自己的 <b>Evaluator（评估器）</b>实际运行候选，并把任务目标转换成可比较的 Score（分数）。",
          componentId: "optimize-anything-lab"
        },
        {
          kind: "module",
          "id": "2.3",
          "title": "把领域问题压缩成同一个函数接口",
          "desc": "当 Text Artifact 与 Evaluator 配对后，不同任务都呈现为同一种输入输出关系：评估文本候选解，返回分数与可选诊断信息，再寻找更好的候选。领域知识仍由各自的 Evaluator 负责。",
          componentId: "optimize-anything-lab"
        }
      ],
      "insight": "问题已经被统一成“文本候选解 + Evaluator”；那么，用户究竟需要向 optimize_anything 提供哪些信息？",
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "统一接口：用户只需要定义“优化什么”",
      "badge": "inf",
      "badgeLabel": "CORE · API",
      "bridge": "第二章把不同问题统一成 <b>Text Artifact + Evaluator</b>。到了 API 层，这两个抽象几乎原样成为参数：把候选起点交给 <code>seed_candidate</code>，把评价方法交给 <code>evaluator</code>。用户描述问题，框架组织搜索。",
      "analogy": {
        "title": "用户定义问题，框架执行搜索",
        "text": "用户声明 seed 或 objective、evaluator 以及可选数据；框架负责候选选择、执行、Reflection、Mutation、minibatch gate 和 Pareto 更新。",
        componentId: "optimize-anything-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "把统一抽象写成一次最小 API 调用",
          "desc": "切换论文中的任务，观察候选内容和评价逻辑如何变化，而函数形状保持不变。通常从 <code>seed_candidate + evaluator</code> 开始；如果连起始候选都难以编写，可以改用自然语言 <code>objective</code>，让 LLM 从零生成第一个候选。",
          componentId: "optimize-anything-lab"
        },
        {
          kind: "module",
          "id": "3.2",
          "title": "用户声明 what，框架接管 how",
          "desc": "接口还可以接收 <code>dataset</code>、<code>valset</code>、<code>background</code> 和 <code>config</code> 等可选信息。它们补充任务、验证集、领域知识与运行设置；用户不需要再编写 mutation prompt、候选选择规则或搜索流程。",
          componentId: "optimize-anything-lab"
        }
      ],
      "insight": "接口已经说明用户需要提供什么。接下来打开框架内部：这些信息如何驱动 Candidate 一轮轮变成 Better Candidate？",
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "优化循环：从 Candidate 到 Better Candidate",
      "badge": "trn",
      "badgeLabel": "CORE · LOOP",
      "bridge": "第三章把候选起点与 evaluator 交给了 API。现在只追踪一次改写：Candidate 如何被真实执行，评价结果如何变成 Reflection，以及 Reflection 如何推动 Mutation 生成新的 Candidate。",
      "analogy": {
        "title": "一次迭代究竟发生了什么？",
        "text": "Candidate 先经过 evaluator 得到 Score 与 SI；Reflection 将反馈转成修改理由，Mutation 生成新候选；只有 minibatch 改善才触发完整评估。",
        componentId: "optimize-anything-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "从 Candidate x 到 Candidate x′",
          "desc": "点击流程节点或使用“上一步 / 下一步”，观察一轮候选改写。这个网页版中文图重绘了论文 Figure 1 的核心关系：候选必须先经过 Evaluator，Score 与 Side Information 再交给 LLM proposer 形成 Reflection 与 Mutation。",
          componentId: "optimize-anything-lab"
        }
      ],
      "insight": "Candidate x′ 是一次有依据的改写，但不是已经被证明更优的答案；它必须重新进入 Evaluator。下一章继续追问：Score 之外，什么反馈能真正告诉 LLM 应该改哪里？",
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "让搜索变得“有方向”：Side Information",
      "badge": "both",
      "badgeLabel": "CORE · DIAGNOSIS",
      "bridge": "第四章中，Evaluator 的输出会进入 Reflection。但一个标量 Score 只能告诉 proposer 表现升了还是降了，无法说明失败发生在哪里。Side Information 把评估过程中的诊断线索一起带回优化循环。",
      "analogy": {
        "title": "Score 与 Side Information 分工不同",
        "text": "Score 告诉系统候选之间谁更好；Side Information 解释错误样例、编译失败、执行瓶颈或局部指标，使 Reflection 能提出针对性修改。",
        componentId: "optimize-anything-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "同一低分：盲改，还是按诊断定向改？",
          "desc": "两条教学支线从同一候选和同一 Score 出发。逐轮执行 Evaluator，观察 Score-only 为什么只能泛化猜测，而 Score + SI 如何根据编译错误、Profiler 与正确性反馈改变下一次 mutation。数值为机制示意，不是论文实验结果。",
          componentId: "optimize-anything-lab"
        },
        {
          kind: "module",
          "id": "5.2",
          "title": "消融证据：SI 到底贡献了什么？",
          "desc": "切换任务查看由论文 Figure 9 与 Table 4 重绘的网页图表。Facility Support 比较收敛速度与最终测试分数；Circle Packing、KernelBench ST 和 MT 使用各自的实验指标与独立刻度。",
          componentId: "optimize-anything-lab"
        }
      ],
      "insight": "高质量 SI 的标准不是“信息多”，而是能让 Reflection 明确指出失败机制，并生成可验证的下一步改动。",
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "让搜索保持“多样性”：Pareto-based Search",
      "badge": "trn",
      "badgeLabel": "CORE · DIVERSITY",
      "bridge": "第五章解决了“下一步往哪里改”，但搜索还要决定“哪些候选值得继续改”。当候选分别擅长不同任务、样例或指标时，一个平均分会抹掉这些局部优势；只保留平均分冠军，候选池很快只剩下一种解题思路。",
      "analogy": {
        "title": "平均分最优，不等于每个维度都最有价值",
        "text": "一个候选可能只在部分任务或指标上突出。Pareto Frontier 保留未被全面支配的候选，让这些局部优势继续参与后续搜索。",
        componentId: "optimize-anything-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "先看平均分：两个局部最强候选如何消失",
          "desc": "下面三个候选使用教学用示意分数。把 Task A 与 Task B 压成平均分时，系统只会看到候选 C 排名第一；展开逐任务表现后，候选 A 和 B 各自拥有无法由 C 替代的局部优势。",
          componentId: "optimize-anything-lab"
        },
        {
          kind: "module",
          "id": "6.2",
          "title": "Pareto Frontier：只删除被全面超过的候选",
          "desc": "点击任一候选，检查是否存在另一个候选在所有维度都不差、并且至少一个维度更好。只有满足这个条件，前者才会被支配。论文按 per-task、per-example 或 SI 中的 per-metric 子分数维护多维比较；默认 GEPA 后端再按 Frontier frequency 选择父本，并用 2–3 个样例的 minibatch 聚焦下一次 Reflection。",
          componentId: "optimize-anything-lab"
        }
      ],
      "insight": "平均分只回答“整体谁更高”；Pareto Frontier 还保留“谁在哪个局部不可替代”。这些互补候选会继续作为后续 Reflection 与 Mutation 的父本，也成为下一章 Multi-task Search 共享经验的基础。",
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "一个接口，三种 Optimization Modes",
      "badge": "both",
      "badgeLabel": "CORE · MODES",
      "bridge": "第六章说明了候选池如何保存互补经验。接下来，同一套接口可以处理三种不同目标：直接优化一个任务、在一组相关任务之间共享搜索经验，或学习一个能用于未见样例的全局解。它们分别对应 Single-task Search、Multi-task Search 与 Generalization。",
      "analogy": {
        "title": "三种模式的区别在输入、共享机制与输出",
        "text": "Single-task 优化一个任务；Multi-task 在相关任务间共享搜索中的 Pareto Frontier，并分别输出专用解；Generalization 学习一个用于未见样例的全局 Artifact。",
        componentId: "optimize-anything-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "两个可选参数，决定三种模式",
          "desc": "切换模式，观察共同的 <code>seed / objective + evaluator</code> 如何保持不变，而 <code>dataset</code>、<code>valset</code>、搜索语义与输出数量同步变化。模式不是三套 API，而是同一个调用在不同数据配置下的三种含义。",
          componentId: "optimize-anything-lab"
        },
        {
          kind: "module",
          "id": "7.2",
          "title": "Multi-task 何时迁移，何时产生负迁移？",
          "desc": "Multi-task 的前提不是“任务越多越好”，而是任务之间存在可复用结构。相关 CUDA Kernel 可以共享 memory coalescing、vectorized access 与 warp-level reduction 等模式；不同 N 的 Circle Packing 相互独立，联合搜索反而引入噪声。",
          componentId: "optimize-anything-lab"
        }
      ],
      "insight": "Single-task 返回一个问题的专用解；Multi-task 在搜索中共享 Frontier，但为每个任务分别输出专用解；Generalization 用训练反馈优化一个全局 Artifact，再由 valset 检查它能否面对未见样例。",
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-8",
      "title": "原理总装：四个设计如何组成统一优化器",
      "badge": "both",
      "badgeLabel": "CORE · SYNTHESIS",
      "bridge": "前面六章分别解释了统一接口、优化循环、Side Information、Pareto-based Search 与三种 Optimization Modes。本章不再引入新概念，只把这些设计装回同一套系统，回答它们如何共同推动一次完整搜索。",
      "analogy": {
        "title": "现在可以重新回答第一章的问题",
        "text": "不同对象不需要拥有相同语法或目标。对象内容进入 <b>Text Artifact</b>，领域差异进入 <b>Evaluator</b>；上层框架只负责反复评价、诊断、改写和比较候选。",
        componentId: "optimize-anything-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "8.1",
          "title": "完整闭环：候选如何改进，又如何进入下一轮",
          "desc": "从 Pareto Frontier 选择候选，交给 Evaluator 真实运行；Score 用于比较，Side Information 解释问题；LLM 据此形成 Reflection 并执行 Mutation。默认后端先在 minibatch 上评价新候选 x′；只有表现改善，才触发完整评价并更新 Pareto Frontier。",
          componentId: "optimize-anything-lab"
        },
        {
          kind: "module",
          "id": "8.2",
          "title": "四个关键设计，各自解决什么问题？",
          "desc": "四个设计分别回答：问题如何进入、下一步怎样改、哪些候选值得保留，以及最终为谁优化。",
          componentId: "optimize-anything-lab"
        }
      ],
      "insight": "这篇论文的核心不是某一种 mutation 技巧，而是把统一表示、可诊断反馈、多样性搜索与三种任务模式接成同一个可复用框架。这里的 “Universal” 指不同文本候选可以复用同一套 API 与搜索闭环；领域差异仍由各自的 Evaluator 与 Side Information 定义。",
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-9",
      "title": "实验结果总览：数据支持了哪些主张？",
      "badge": "both",
      "badgeLabel": "CORE · EVIDENCE",
      "bridge": "这一章集中展示论文的实验结论，不追踪某个案例的具体演化过程。所有结果按“数据是什么、比较对象是谁、它支持什么结论”组织：先看跨领域表现，再看关键机制消融，最后看成本与失效边界。",
      "analogy": {
        "title": "如何判断 Universal 的主张是否成立？",
        "text": "需要四类证据共同支撑：跨领域结果、SI 消融、Single-task 与 Multi-task 对照，以及揭示失效条件的反例。这里先读结论和数据口径，不展开逐实验复盘。",
        componentId: "optimize-anything-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "9.1",
          "title": "跨领域主结果：一个接口覆盖了什么？",
          "desc": "六类主实验覆盖 Skill、调度策略、完整 Agent、Prompt、CUDA Kernel 与数值算法；正文另有 Image Generation 扩展实验，附录用 Numerical Blackbox 和 3D Modeling 作初步展示。",
          componentId: "optimize-anything-lab"
        },
        {
          kind: "module",
          "id": "9.2",
          "title": "关键机制消融：SI 与 Multi-task 真的有效吗？",
          "desc": "Side Information 的受控消融覆盖 Prompt、Circle Packing 与 KernelBench；Multi-task scaling 比较相关 CUDA 任务在相同单题预算下的表现。",
          componentId: "optimize-anything-lab"
        },
        {
          kind: "module",
          "id": "9.3",
          "title": "适用范围与局限",
          "desc": "Multi-task 只在相关任务间表现出迁移收益；搜索成本取决于 proposer 与 evaluator；Figure 8 只反映筛选出的 10 个任务。",
          componentId: "optimize-anything-lab"
        }
      ],
      "insight": "综合来看，实验支持“统一接口能够跨多类文本化问题取得有竞争力的结果”，也支持 SI 与相关任务间 Multi-task transfer 的作用；但方法仍受 proposer 能力、Evaluator 成本、文本表示、任务相关性与 SI 设计质量限制。",
      "takeaways": []
    }
  ],
  "bilibili": [
    {
      bvid: "BV1zkzRBSE4X",
      "title": "工作流 Agent 多 Prompt 联合优化（1）GEPA：超越 GRPO，让 Prompt 像基因一样进化",
      "reason": "直接讲解论文默认 GEPA 后端；用于补充反思—变异—保留候选的搜索背景。",
      "cover": "https://i2.hdslb.com/bfs/archive/70e1ba7a0950121bc341181ce2caf125550f5aed.jpg",
      "views": "1103播放"
    },
    {
      bvid: "BV1QbWEzUEH7",
      "title": "别再收藏提示词了！掌握这个循环，让 AI 为你打造完美提示词",
      "reason": "用直观案例展示测试、诊断、迭代的提示词优化循环。",
      "cover": "https://i2.hdslb.com/bfs/archive/6db24246fa1fcbf432879e0e7ce5dddb8eedba9f.jpg",
      "views": "1.4万播放"
    },
    {
      bvid: "BV1ov4y1H7GK",
      "title": "ChatGPT 提示词工程师教程",
      "reason": "补足提示词工程和迭代改写的基础背景，不作为论文实验依据。",
      "cover": "https://i1.hdslb.com/bfs/archive/e003ea9d7899a1d6768044ac8b76919a4e9fd0cc.png",
      "views": "46.1万播放"
    },
    {
      bvid: "BV1NHmsBwEbT",
      "title": "15分钟从 Prompt Engineering 到 Agent！",
      "reason": "帮助把 Prompt、Agent 与系统级优化对象放进同一概念地图。",
      "cover": "https://i2.hdslb.com/bfs/archive/495022df07137146d00e3ac2ba60868553fa4efe.jpg",
      "views": "1.8万播放"
    }
  ]
};
