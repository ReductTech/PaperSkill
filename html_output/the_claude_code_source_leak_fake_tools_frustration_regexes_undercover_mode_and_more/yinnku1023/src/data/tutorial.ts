import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "The Claude Code Source Leak: fake tools, frustration regexes, undercover mode, and more",
    "titleZh": "Claude Code 源码线索与功能边界",
    "authors": "Alex Kim",
    "venue": "Alex Kim · Alex Kim's blog · 2026-03-31",
    "affiliation": "原文未明确机构",
    "domain": "AI 代理 · 软件工程 · 证据判断",
    "coreProblem": "代码中出现一个功能，能证明它已经可用吗？",
    "coreInsight": "先核对激活条件，再观察行为，最后限定结论。",
    "keywords": [
      "功能开关",
      "伪工具",
      "关键词检测",
      "原生校验",
      "连续失败",
      "提示缓存"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "只看代码中的功能名字",
      "desc": "把代码存在误当成可用。",
      "componentId": "cafe-cover"
    },
    "newMethod": {
      "title": "核对条件与运行证据",
      "desc": "开关满足后，还要验证结果。",
      "componentId": "cafe-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "来源与判断",
      "modules": [],
      "scenes": [
        {
          "id": "source-boundary",
          "title": "先区分代码线索与运行证据",
          "goal": "这篇博客能支持多强的结论？",
          "summary": "这篇博客能支持多强的结论？",
          "interaction": "静态核对作者、载体、日期和类型；不补写机构或会刊。",
          "next": "改变一个开关，结果会怎样？",
          "notes": "【建议时长】约 60 秒。\n【本页只讲】先区分代码线索与运行证据\n【讲解】博客分析不是正式实验报告。不要把源码路径、作者推断和产品当前状态混为一谈。\n【演示与停顿】静态核对作者、载体、日期和类型；不补写机构或会刊。 每次先预测，再观察。\n【反馈核对】元信息与文章类型可追溯。\n【过渡】改变一个开关，结果会怎样？\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】引言与 So what?\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "source-boundary"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "激活条件",
      "modules": [
        {
          "kind": "module",
          "id": "feature-gates-module",
          "title": "四个条件同时满足，分支才激活",
          "desc": "改变一个开关，结果会怎样？",
          "componentId": "feature-gates"
        },
        {
          "kind": "module",
          "id": "decoy-tools-module",
          "title": "目录可见，不代表工具可执行",
          "desc": "点选一个目录条目，核对注册表。",
          "componentId": "decoy-tools"
        }
      ],
      "scenes": [
        {
          "id": "feature-gates",
          "title": "四个条件同时满足，分支才激活",
          "goal": "改变一个开关，结果会怎样？",
          "summary": "改变一个开关，结果会怎样？",
          "interaction": "勾选编译标志、CLI 入口、第一方服务、远程开关。初值前三真、最后假。",
          "next": "点选一个目录条目，核对注册表。",
          "notes": "【建议时长】约 75 秒。\n【本页只讲】四个条件同时满足，分支才激活\n【讲解】四个布尔量取合取。任意一个假就不激活；全部真才显示激活。门移动、灯与反馈同源。先补最后一个条件，再取消 CLI，比较结果。\n【演示与停顿】勾选编译标志、CLI 入口、第一方服务、远程开关。初值前三真、最后假。 每次先预测，再观察。\n【反馈核对】开启全部条件：分支激活；缺条件：逐项指出未满足项。\n【过渡】点选一个目录条目，核对注册表。\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】Anti-distillation: injecting fake tools to poison copycats\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "feature-gates",
          "moduleId": "feature-gates-module"
        },
        {
          "id": "decoy-tools",
          "title": "目录可见，不代表工具可执行",
          "goal": "点选一个目录条目，核对注册表。",
          "summary": "点选一个目录条目，核对注册表。",
          "interaction": "点选查库存、列菜单或未注册的隐藏配方；切换目录是否包含伪条目。",
          "next": "隐藏内部代号后，仍能留下哪些说明？",
          "notes": "【建议时长】约 75 秒。\n【本页只讲】目录可见，不代表工具可执行\n【讲解】本地注册表只定义前两项。伪条目只改变观测目录，选择它会返回未注册。打开目录诱饵并点它，与真实工具对照；不是服务端实测，也不教授规避机制。\n【演示与停顿】点选查库存、列菜单或未注册的隐藏配方；切换目录是否包含伪条目。 每次先预测，再观察。\n【反馈核对】同一个选择同时更新菜单边框、回执内容和已注册/未注册反馈。\n【过渡】隐藏内部代号后，仍能留下哪些说明？\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】Anti-distillation: injecting fake tools to poison copycats\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "decoy-tools",
          "moduleId": "decoy-tools-module"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "披露边界",
      "modules": [
        {
          "kind": "module",
          "id": "privacy-credit-module",
          "title": "内部信息与贡献披露应分开判断",
          "desc": "隐藏内部代号后，仍能留下哪些说明？",
          "componentId": "privacy-credit"
        }
      ],
      "scenes": [
        {
          "id": "privacy-credit",
          "title": "内部信息与贡献披露应分开判断",
          "goal": "隐藏内部代号后，仍能留下哪些说明？",
          "summary": "隐藏内部代号后，仍能留下哪些说明？",
          "interaction": "独立切换公开内部代号、保留贡献说明。初值隐藏代号、保留说明。",
          "next": "改写一句反馈，观察误报或漏报。",
          "notes": "【建议时长】约 65 秒。\n【本页只讲】内部信息与贡献披露应分开判断\n【讲解】两个独立布尔量映射到公开字段，覆盖四种组合。禁止声称真实 Undercover 实现一定提供这两个设置。信息隐藏与披露责任是本教程的设计比较。\n【演示与停顿】独立切换公开内部代号、保留贡献说明。初值隐藏代号、保留说明。 每次先预测，再观察。\n【反馈核对】字段分别出现/移除，反馈分别报告暴露与披露情况。\n【过渡】改写一句反馈，观察误报或漏报。\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】Undercover mode: AI that hides its AI\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "privacy-credit",
          "moduleId": "privacy-credit-module"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "快速启发式",
      "modules": [
        {
          "kind": "module",
          "id": "frustration-regex-module",
          "title": "关键词命中不等于理解挫败情绪",
          "desc": "改写一句反馈，观察误报或漏报。",
          "componentId": "frustration-regex"
        }
      ],
      "scenes": [
        {
          "id": "frustration-regex",
          "title": "关键词命中不等于理解挫败情绪",
          "goal": "改写一句反馈，观察误报或漏报。",
          "summary": "改写一句反馈，观察误报或漏报。",
          "interaction": "编辑最多 56 字符的反馈；手动标注是否负面。预置直接不满、否定语境、无关键词不满、正面四句。",
          "next": "盖章以后改订单，本地校验还能通过吗？",
          "notes": "【建议时长】约 85 秒。\n【本页只讲】关键词命中不等于理解挫败情绪\n【讲解】教学模式只匹配 awful 或 this sucks；不复制原始正则。计算匹配与标注一致性，展示四种判断。样例标注是人为设定，不是数据集，也不宣称准确率。\n【演示与停顿】编辑最多 56 字符的反馈；手动标注是否负面。预置直接不满、否定语境、无关键词不满、正面四句。 每次先预测，再观察。\n【反馈核对】没有关键词且标为负面时提示漏报；命中但标为非负面时提示误报。\n【过渡】盖章以后改订单，本地校验还能通过吗？\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】Frustration detection via regex (yes, regex)\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "frustration-regex",
          "moduleId": "frustration-regex-module"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "执行与成本",
      "modules": [
        {
          "kind": "module",
          "id": "native-seal-module",
          "title": "校验值必须与实际请求对应",
          "desc": "盖章以后改订单，本地校验还能通过吗？",
          "componentId": "native-seal"
        },
        {
          "kind": "module",
          "id": "retry-budget-module",
          "title": "连续失败达到阈值后，停止本会话尝试",
          "desc": "成功会清零计数，停止状态何时解除？",
          "componentId": "retry-budget"
        }
      ],
      "scenes": [
        {
          "id": "native-seal",
          "title": "校验值必须与实际请求对应",
          "goal": "盖章以后改订单，本地校验还能通过吗？",
          "summary": "盖章以后改订单，本地校验还能通过吗？",
          "interaction": "把订单数量从 2 改成 3，再重新生成教学校验码。数量 1–9；另可恢复 00000 占位。",
          "next": "成功会清零计数，停止状态何时解除？",
          "notes": "【建议时长】约 85 秒。\n【本页只讲】校验值必须与实际请求对应\n【讲解】五位公开教学校验码由订单字符串确定，不是密码学认证。stamp 初值对应 2，订单变更不自动重盖；相同则本地一致，改变后失配。服务器如何处理真实字段仍未验证。\n【演示与停顿】把订单数量从 2 改成 3，再重新生成教学校验码。数量 1–9；另可恢复 00000 占位。 每次先预测，再观察。\n【反馈核对】码始终为五字符；输入变更时码保留、预期改变、反馈失配；重盖后恢复一致。\n【过渡】成功会清零计数，停止状态何时解除？\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】Native client attestation below the JS runtime\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "native-seal",
          "moduleId": "native-seal-module"
        },
        {
          "id": "retry-budget",
          "title": "连续失败达到阈值后，停止本会话尝试",
          "goal": "成功会清零计数，停止状态何时解除？",
          "summary": "成功会清零计数，停止状态何时解除？",
          "interaction": "点失败一次、成功一次或新会话。初值 0 次，阈值 3。停机后只能新会话。",
          "next": "缺少原始日志时，哪些量不能推出来？",
          "notes": "【建议时长】约 80 秒。\n【本页只讲】连续失败达到阈值后，停止本会话尝试\n【讲解】失败使连续计数加一，成功在未停机时清零，第三次失败锁存停止。失败、失败、成功恢复 0；失败三次进入停止。全为确定性教学事件。\n【演示与停顿】点失败一次、成功一次或新会话。初值 0 次，阈值 3。停机后只能新会话。 每次先预测，再观察。\n【反馈核对】机身与杯中液面由结果变化；触发后明确停止只限制消耗，不修复根因。\n【过渡】缺少原始日志时，哪些量不能推出来？\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】250,000 wasted API calls per day\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "retry-budget",
          "moduleId": "retry-budget-module"
        },
        {
          "id": "incident-evidence",
          "title": "注释中的规模数字需要保留统计边界",
          "goal": "缺少原始日志时，哪些量不能推出来？",
          "summary": "缺少原始日志时，哪些量不能推出来？",
          "interaction": "静态阅读注释日期、全局范围与单位。",
          "next": "改共享菜单与改本次订单有何区别？",
          "notes": "【建议时长】约 65 秒。\n【本页只讲】注释中的规模数字需要保留统计边界\n【讲解】展示作者引述代码注释中的约数、会话数与最长失败次数，不绘制不兼容指标对比，不计算节省率。原始数据与修复后记录缺失。\n【演示与停顿】静态阅读注释日期、全局范围与单位。 每次先预测，再观察。\n【反馈核对】静态页保留记录夹作为主题实物，随后回到可操作的缓存实验。\n【过渡】改共享菜单与改本次订单有何区别？\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】250,000 wasted API calls per day\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "incident-evidence"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "缓存与自主性",
      "modules": [
        {
          "kind": "module",
          "id": "prompt-prefix-module",
          "title": "公共前缀变化，会提前终止复用",
          "desc": "改共享菜单与改本次订单有何区别？",
          "componentId": "prompt-prefix"
        }
      ],
      "scenes": [
        {
          "id": "prompt-prefix",
          "title": "公共前缀变化，会提前终止复用",
          "goal": "改共享菜单与改本次订单有何区别？",
          "summary": "改共享菜单与改本次订单有何区别？",
          "interaction": "选择改公共菜单或仅改本次订单。初值改公共菜单。",
          "next": "发现后台任务路径后，还缺哪些证据？",
          "notes": "【建议时长】约 75 秒。\n【本页只讲】公共前缀变化，会提前终止复用\n【讲解】比较两个自拟字符串数组，从首项开始逐项比较，到第一个差异停止。改第三段得到 2 段相同前缀；只改第五段得到 4 段。不是实际 token、收费或产品缓存策略。\n【演示与停顿】选择改公共菜单或仅改本次订单。初值改公共菜单。 每次先预测，再观察。\n【反馈核对】相同前缀行绿色，首个差异红色，其余中性；段数与反馈同源。\n【过渡】发现后台任务路径后，还缺哪些证据？\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】Other stuff → Prompt cache economics\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "prompt-prefix",
          "moduleId": "prompt-prefix-module"
        },
        {
          "id": "roadmap-boundary",
          "title": "KAIROS 的代码线索不能证明公开可用",
          "goal": "发现后台任务路径后，还缺哪些证据？",
          "summary": "发现后台任务路径后，还缺哪些证据？",
          "interaction": "静态区分文章报告的后台功能线索与未验证的产品发布。",
          "next": "收窄权限后，计划中哪些动作仍被允许？",
          "notes": "【建议时长】约 65 秒。\n【本页只讲】KAIROS 的代码线索不能证明公开可用\n【讲解】只说作者根据门控路径作推断。5 分钟是文中刷新计划线索，不是实际运营保证；不宣称当前已发布或未发布。\n【演示与停顿】静态区分文章报告的后台功能线索与未验证的产品发布。 每次先预测，再观察。\n【反馈核对】以夜间值班画面说明计划与执行不同，下一页收窄具体任务权限。\n【过渡】收窄权限后，计划中哪些动作仍被允许？\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】KAIROS: the unreleased autonomous agent mode\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "roadmap-boundary"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "我的验证提案",
      "modules": [
        {
          "kind": "module",
          "id": "night-permissions-module",
          "title": "我的提案：夜间任务逐项授权",
          "desc": "收窄权限后，计划中哪些动作仍被允许？",
          "componentId": "night-permissions"
        }
      ],
      "scenes": [
        {
          "id": "night-permissions",
          "title": "我的提案：夜间任务逐项授权",
          "goal": "收窄权限后，计划中哪些动作仍被允许？",
          "summary": "收窄权限后，计划中哪些动作仍被允许？",
          "interaction": "直接点读取库存、改写菜单、对外发布三张授权卡。初值仅允许读取。",
          "next": "把判断带回受控测试，再决定结论能有多强。",
          "notes": "【建议时长】约 80 秒。\n【本页只讲】我的提案：夜间任务逐项授权\n【讲解】允许集合决定三项任务的授权状态与数量；无真实读取、写入或发布。两种对照：只读允许 1 项，全部勾选允许 3 项。授权数量不是安全性评分。后续实验应固定任务集测越权与有效任务阻断。\n【演示与停顿】直接点读取库存、改写菜单、对外发布三张授权卡。初值仅允许读取。 每次先预测，再观察。\n【反馈核对】允许章、权限数量及反馈同步变化；限制风险和可完成任务之间的权衡不填实测数字。\n【过渡】把判断带回受控测试，再决定结论能有多强。\n【来源】https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/\n【章节定位】KAIROS 章节启发；本教程原创提案\n【边界】原文为技术博客；本教程未运行泄露源码或复现产品。交互是原创确定性示例，教学数值不是产品实测；静态统计只转述注释，不计算未经支持的效果。",
          "componentId": "night-permissions",
          "moduleId": "night-permissions-module"
        }
      ]
    }
  ]
};
