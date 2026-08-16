import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Securing the Agent: Vendor-Neutral, Multitenant Enterprise Retrieval and Tool Use",
    titleZh: "守住 Agent：多租户 RAG 的授权边界",
    venue: "ACM CAIS '26",
    authors: "Francisco Javier Arceo · Varsha Prasad Narsing",
    affiliation: "Red Hat AI",
    domain: "多租户 Agentic RAG · 企业 AI 安全",
    coreProblem: "共享 RAG 只按相关性排序时，最相关的文档可能来自另一个租户；客户端控制的 Agent 循环还可能绕过授权与状态隔离。",
    coreInsight: "<b>最相关的答案，也可能最不该被看见。</b> ABAC 检索门控负责把未授权内容挡在上下文之外，服务端编排负责让客户端无法绕过这道门。",
    prerequisite: "RAG 按语义相关性从共享知识库召回文档片段（chunk），而多租户场景还必须在片段进入模型上下文前，检查当前用户是否有权访问。",
    keywords: ["共享 RAG", "多租户", "相关性", "授权边界", "4 分钟导览"]
  },
  hero: {
    oldMethod: {
      desc: "<b>普通共享 RAG：</b>同一 Finance 查询只按相似度排序，Legal 机密被送进上下文。",
      componentId: "library-scenes"
    },
    newMethod: {
      desc: "<b>论文架构：</b>同一查询先经过 ABAC，只有授权文档进入共享推理。",
      componentId: "library-scenes"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "最相关，为什么仍然会泄密？",
      badge: "inf",
      badgeLabel: "核心问题",
      bridge: "先让 Finance 查询共享语料，直接看到只按相关性排序为什么会把 Legal 文档送进模型上下文。",
      analogy: {
        title: "书名最像，不等于你能借",
        text: "目录只会把最像的书排在前面，<b>借阅证</b>才决定能不能拿走。",
        componentId: "library-scenes"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "亲手制造一次跨租户泄密",
          desc: "拖动查询意图，观察共享语料中最相似的 chunk 怎样被直接送进上下文。这里故意只做相关性排序：命中本租户文档只是碰巧，命中 Legal 文档则会立即形成越权上下文。",
          componentId: "relevance-leak-lab"
        }
      ],
      insight: "相关性回答“像不像”，授权回答“能不能看”；前者不能替代后者。",
      takeaways: [
        { icon: "关", title: "相关不等于有权", desc: "向量相似度无法表达租户权限。" },
        { icon: "漏", title: "上下文即泄漏面", desc: "禁止内容一旦进入上下文就已越过边界。" },
        { icon: "证", title: "实验风险很高", desc: "论文未门控配置的 CTLR 为 98%-100%。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "安全结果从哪里来？",
      badge: "both",
      badgeLabel: "公式与身份",
      bridge: "安全结果必须同时满足相关性和授权，而授权谓词又必须建立在摄取时写入的可信租户归属上。",
      analogy: {
        title: "借得到的书，必须同时过两关",
        text: "书既要与问题相关，也要被借阅证允许；上架前还必须先标清它属于哪个馆藏。",
        componentId: "library-scenes"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "拖动阈值，构造安全结果集",
          desc: "橙色阈值只改变哪些文档足够相关，授权开关决定哪些文档可以读取。最终上下文始终取相关集合与许可集合的绿色交集。",
          componentId: "secure-set-builder-lab"
        },
        {
          kind: "module",
          id: "2.2",
          title: "看文档归属如何传给每个 chunk",
          desc: "选择租户后执行写入与切分，文档的归属会被每个 chunk 继承。论文假设 A2 要求所有权元数据在摄取后不可变，否则后续授权判断没有可信依据。",
          componentId: "ingestion-stamp-lab"
        }
      ],
      insight: "先写入可信归属，再计算相关集合与许可集合的交集。",
      formula: {
        lead: "安全检索结果必须同时满足相关性阈值和授权谓词。",
        unicode: "{ d ∈ D : relevance(q,d) > θ ∧ P(u,d) = permit }",
        symbols: [
          { sym: "q", desc: "当前查询" },
          { sym: "u", desc: "已认证用户或租户主体" },
          { sym: "d", desc: "带可信归属的候选文档或 chunk" },
          { sym: "θ", desc: "相关性阈值，不授予权限" },
          { sym: "P(u,d)", desc: "返回 permit 或 deny 的授权策略" }
        ]
      },
      takeaways: [
        { icon: "∩", title: "两个条件缺一不可", desc: "相关集合与许可集合取交集。" },
        { icon: "签", title: "身份先写入", desc: "每个 chunk 继承文档租户归属。" },
        { icon: "A2", title: "元数据不可变", desc: "否则论文的授权保证不成立。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "门控怎样兼顾安全与检索质量？",
      badge: "both",
      badgeLabel: "门控与规模",
      bridge: "把授权谓词落实到资源级与 chunk 级两道门，再比较后过滤和谓词下推在大语料下的 Recall。",
      analogy: {
        title: "先刷馆门，再缩小书架",
        text: "先检查能否进入馆藏，再逐本验书；数据量大时还要先缩小到允许范围再搜索。",
        componentId: "library-scenes"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "组合 ABAC 规则，看请求在哪一层被挡下",
          desc: "资源级拒绝会在搜索和推理前停止；资源通过后仍需逐 chunk 过滤，只有两层都通过才能构造授权上下文。",
          componentId: "abac-policy-lab"
        },
        {
          kind: "module",
          id: "3.2",
          title: "把语料扩到 50K，看 Recall 如何坍塌",
          desc: "后过滤和谓词下推都能保持 CTLR=0，但论文的 sqlite-vec 后过滤实验在 50K 时 Recall@5 只剩 0.002；下推在各规模保持 1.000。",
          componentId: "pushdown-scale-lab"
        }
      ],
      insight: "两级门控守住“不能泄漏”，谓词下推进一步守住“还能找到”。",
      formula: {
        lead: "ABAC 把用户与资源属性交给同一个判定谓词。",
        unicode: "P(u, d) = permit",
        symbols: [
          { sym: "P(u,d)", desc: "搜索前和结果级共同使用的 ABAC 判定" },
          { sym: "permit", desc: "显式允许；未匹配规则时默认拒绝" }
        ]
      },
      takeaways: [
        { icon: "1", title: "搜索前验资源", desc: "不允许的资源不发起向量检索。" },
        { icon: "2", title: "检索时验 chunk", desc: "通过资源不等于每个结果都可见。" },
        { icon: "下", title: "规模下优先下推", desc: "前提是后端忠实实现过滤器 A4。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "租户需要隔离，为什么模型还能共享？",
      badge: "both",
      badgeLabel: "共享推理",
      bridge: "授权上下文已经隔离，接下来判断是否仍有必要为每个租户复制模型端点。",
      analogy: {
        title: "独立信封，共用翻译员",
        text: "每个租户的上下文保持封装和标记，但可以依次交给同一个模型端点处理。",
        componentId: "library-scenes"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "把三套租户模型收束成一个共享端点",
          desc: "切换“每租户模型”与“共享推理”，观察模型实例从 O(N × M) 收束到 O(M)，同时三份授权上下文始终保留各自租户标签，互不混合。",
          componentId: "shared-inference-lab"
        }
      ],
      insight: "在 A1-A4 成立时，需要隔离的是进入模型的上下文，而不是模型实例数量。",
      formula: {
        lead: "共享推理减少按租户重复部署的模型端点。",
        unicode: "O(N × M) → O(M)",
        symbols: [
          { sym: "N", desc: "租户数量" },
          { sym: "M", desc: "模型端点数量" }
        ]
      },
      takeaways: [
        { icon: "封", title: "上下文先隔离", desc: "每份上下文只包含当前租户获准读取的内容。" },
        { icon: "共", title: "模型端点可共享", desc: "隔离上下文不要求复制相同模型实例。" },
        { icon: "A3", title: "A3 不保护参数记忆", desc: "论文不保证预训练参数中的信息隔离。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "检索之外，Agent 还会从哪里泄密？",
      badge: "inf",
      badgeLabel: "Agent 风险",
      bridge: "数据路径安全以后，工具可能直接泄露，历史状态会跨轮累积，受攻破客户端还可能绕过所有检查。",
      analogy: {
        title: "每次取书都验卡，书签也分开保存",
        text: "工具调用要逐次授权，历史要按租户保存，执行循环还必须留在可信服务端。",
        componentId: "library-scenes"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "看工具结果怎样写入历史并污染下一轮",
          desc: "逐步走过 inference → tool → inference：工具执行前重新授权，结果按租户写入状态。共享历史会把旧的 Legal 工具结果回流到 Finance 下一轮上下文。",
          componentId: "conversation-state-lab"
        },
        {
          kind: "module",
          id: "5.2",
          title: "同一种攻击，客户端为什么能绕过？",
          desc: "分别观察直连未门控搜索、未传播用户授权的工具调用，以及 Legal 旧历史污染 Finance 上下文；服务端分别强制 ABAC、逐次工具授权和租户状态读取。",
          componentId: "orchestration-bypass-lab"
        }
      ],
      insight: "检索门控只保护检索；Agent 的工具、状态和执行位置也必须受控。",
      formula: {
        lead: "一次 Agent 执行是推理、工具调用与结果交替组成的轨迹。",
        unicode: "E = ⟨i₁, φ₁, r₁, …, iₙ, ∅, rₙ⟩",
        symbols: [
          { sym: "E", desc: "一次完整 Agent 执行轨迹" },
          { sym: "i", desc: "推理步骤" },
          { sym: "φ", desc: "工具调用" },
          { sym: "r", desc: "响应或工具结果" }
        ]
      },
      takeaways: [
        { icon: "具", title: "工具逐次授权", desc: "工具调用可在第一轮直接暴露新数据。" },
        { icon: "态", title: "状态按租户隔离", desc: "历史不能跨租户累积。" },
        { icon: "绕", title: "循环留在服务端", desc: "客户端不能选择跳过安全步骤。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "完整架构如何落到 OGX？",
      badge: "trn",
      badgeLabel: "架构与实现",
      bridge: "把摄取、检索、共享推理、工具和状态装进同一服务端边界，再用 OGX 的稳定 API 连接可替换后端。",
      analogy: {
        title: "所有必经点都留在馆内",
        text: "身份、检索、工具与状态都留在可信边界；底层书库可以更换，验卡位置不能消失。",
        componentId: "library-scenes"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "沿一次请求，看数据路径与控制路径如何闭环",
          desc: "沿一次 Finance 请求区分离线摄取与在线执行：ABAC 只让授权 chunk 进入共享推理，服务端编排再控制工具授权、租户状态和响应返回。",
          componentId: "layered-architecture-lab",
          figure: "/images/figure-1.png"
        }
      ],
      insight: "架构的关键不是绑定某个后端，而是让安全检查成为服务端不可绕过的必经点。",
      takeaways: [
        { icon: "3", title: "三层保护数据路径", desc: "摄取、门控、共享推理。" },
        { icon: "1", title: "服务端保护控制路径", desc: "服务端管理工具、状态与审计。" },
        { icon: "API", title: "OGX 保持安全表面稳定", desc: "提供者可替换，授权位置不随之漂移。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "实验究竟证明了什么，代价是什么？",
      badge: "both",
      badgeLabel: "结果与边界",
      bridge: "最后用安全、质量和代价三个问题检查论文结论，并明确每个数字对应的测试条件。",
      analogy: {
        title: "同一规则下再比结果",
        text: "先认清指标方向，再比较四种配置；安全、吞吐和 Recall 不能混成一个冠军。",
        componentId: "library-scenes"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "切换指标，读懂 2×2 配置矩阵",
          desc: "A/C 未门控，B/D 已门控；A/B 客户端编排，C/D 服务端编排。所有数值都来自论文的合成三租户实验，并明确显示指标方向。",
          componentId: "evidence-matrix-lab",
          figure: "/images/figure-4.png"
        }
      ],
      insight: "论文证明的是给定假设和测试床下的隔离与共享，不是无条件适用于所有 RAG。",
      formula: {
        lead: "安全指标都按越低越好解释。",
        unicode: "CTLR = 跨租户泄漏探针数 / 跨租户探针总数；AVR = 未授权响应数 / API 调用总数",
        symbols: [
          { sym: "CTLR", desc: "跨租户泄漏率，越低越好" },
          { sym: "AVR", desc: "授权违规率，越低越好" }
        ]
      },
      takeaways: [
        { icon: "门", title: "门控负责安全", desc: "两种门控配置的 CTLR 与 AVR 都为 0。" },
        { icon: "服", title: "服务端负责强制执行", desc: "受攻破客户端不能跳过安全步骤。" },
        { icon: "查", title: "成本取决于测试路径", desc: "约 19 ms 与约 3 s 对应不同负载与协议。" }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1JLN2z4EZQ",
      title: "RAG 工作机制详解——一个高质量知识库背后的技术全流程",
      reason: "补充 RAG 检索流程基础",
      cover: "https://i1.hdslb.com/bfs/archive/9aece9518fe00d08450b731fb8d2a2e748131765.jpg",
      views: "37.3万播放"
    },
    {
      bvid: "BV1hu4y1R7BY",
      title: "一个视频搞懂多租户架构该怎么做？",
      reason: "补充多租户隔离模式",
      cover: "https://i0.hdslb.com/bfs/archive/81d809ecf94407f30843ecc23d887632b83fc29d.jpg",
      views: "3.1万播放"
    },
    {
      bvid: "BV1KH3j6WEn4",
      title: "企业多租户多智能体系统：功能演示与架构解析",
      reason: "直接相关的企业多租户 Agent 实例",
      cover: "https://i1.hdslb.com/bfs/archive/ab5272389a77fe45dc84d9b8b9c4055c65c28155.jpg",
      views: "1331播放"
    }
  ]
};
