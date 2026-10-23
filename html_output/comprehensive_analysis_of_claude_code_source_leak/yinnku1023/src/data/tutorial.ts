import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Comprehensive Analysis of Claude Code Source Leak!",
    "titleZh": "Claude Code 源码泄露分析",
    "venue": "Sabrina.dev · 技术分析文章 · 2026",
    "authors": "Sabrina Ramonov",
    "affiliation": "原文未明确机构",
    "domain": "AI 代理 · 软件工程 · 安全边界",
    "coreProblem": "发布、记忆与执行中的判断，怎样做到可追溯、可验证？",
    "coreInsight": "检查产物、保留来源、运行验证，让系统判断可追溯。",
    "keywords": [
      "发布清单",
      "信任边界",
      "上下文压缩",
      "解析一致性",
      "失败预算",
      "实际验证"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "未经检查的发布包",
      "desc": "教学对比：夹里的内部草稿，也随讲义公开。",
      "componentId": "editorial-cover"
    },
    "newMethod": {
      "title": "核验最终发布清单",
      "desc": "先核对要公开的内容，再封口交付。",
      "componentId": "editorial-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "来源与范围",
      "modules": [],
      "scenes": [
        {
          "id": "source-boundary",
          "title": "分析文章与可验证结论",
          "goal": "先明确来源、作者判断与教学模型的区别。",
          "summary": "引用原文，区分判断和复现。",
          "interaction": "静态阅读原文与边界",
          "next": "发布清单决定暴露范围",
          "notes": "原文：https://www.sabrina.dev/p/claude-code-source-leak-analysis\n章节：标题与发布日期\n本页为原创教学模型：无状态。引用原文，区分判断和复现。\n边界：不代表 Claude Code 真实执行结果或当前产品行为；未复现原文提出的安全问题。所有示例值都由教学状态计算。",
          "componentId": "source-boundary",
          "thumbnail": "./thumbnails/source-boundary.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "发布包检查",
      "modules": [
        {
          "kind": "module",
          "id": "package-manifest-module",
          "title": "发布清单决定暴露范围",
          "desc": "含调试映射或草稿时提示暴露风险；移除后提示清单只剩公开文件。",
          "componentId": "package-manifest"
        }
      ],
      "scenes": [
        {
          "id": "package-manifest",
          "title": "发布清单决定暴露范围",
          "goal": "点选桌面文件，加入或移出公开讲义夹",
          "summary": "含调试映射或草稿时提示暴露风险；移除后提示清单只剩公开文件。",
          "interaction": "点选桌面文件，加入或移出公开讲义夹",
          "next": "保密与公开署名分别处理",
          "notes": "原文：https://www.sabrina.dev/p/claude-code-source-leak-analysis\n章节：原文第 1 节\n本页为原创教学模型：selected 字符串数组，初值 cli.js、cli.js.map；可选 cli.js、README.md、cli.js.map、notes.txt。含调试映射或草稿时提示暴露风险；移除后提示清单只剩公开文件。\n边界：不代表 Claude Code 真实执行结果或当前产品行为；未复现原文提出的安全问题。所有示例值都由教学状态计算。",
          "componentId": "package-manifest",
          "moduleId": "package-manifest-module",
          "thumbnail": "./thumbnails/package-manifest.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "来源与信任",
      "modules": [
        {
          "kind": "module",
          "id": "attribution-module",
          "title": "保密与公开署名分别处理",
          "desc": "保密不自动等于省略贡献署名。",
          "componentId": "attribution"
        },
        {
          "kind": "module",
          "id": "trusted-summary-module",
          "title": "摘要压缩保留来源标签",
          "desc": "无标签时无法追溯；有标签时外部文字仍只作资料。",
          "componentId": "trusted-summary"
        }
      ],
      "scenes": [
        {
          "id": "attribution",
          "title": "保密与公开署名分别处理",
          "goal": "勾选讲义页上的公开信息字段",
          "summary": "保密不自动等于省略贡献署名。",
          "interaction": "勾选讲义页上的公开信息字段",
          "next": "摘要压缩保留来源标签",
          "notes": "原文：https://www.sabrina.dev/p/claude-code-source-leak-analysis\n章节：原文第 2 节\n本页为原创教学模型：codeName=false，credit=false；两布尔字段独立。保密不自动等于省略贡献署名。\n边界：不代表 Claude Code 真实执行结果或当前产品行为；未复现原文提出的安全问题。所有示例值都由教学状态计算。",
          "componentId": "attribution",
          "moduleId": "attribution-module",
          "thumbnail": "./thumbnails/attribution.png"
        },
        {
          "id": "trusted-summary",
          "title": "摘要压缩保留来源标签",
          "goal": "开启或关闭摘录卡的来源标签",
          "summary": "无标签时无法追溯；有标签时外部文字仍只作资料。",
          "interaction": "开启或关闭摘录卡的来源标签",
          "next": "校验语义与执行语义一致",
          "notes": "原文：https://www.sabrina.dev/p/claude-code-source-leak-analysis\n章节：原文第 4 节\n本页为原创教学模型：preserve=false；用户卡与外部文件卡各一张。无标签时无法追溯；有标签时外部文字仍只作资料。\n边界：不代表 Claude Code 真实执行结果或当前产品行为；未复现原文提出的安全问题。所有示例值都由教学状态计算。",
          "componentId": "trusted-summary",
          "moduleId": "trusted-summary-module",
          "thumbnail": "./thumbnails/trusted-summary.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "执行语义",
      "modules": [
        {
          "kind": "module",
          "id": "parser-agreement-module",
          "title": "校验语义与执行语义一致",
          "desc": "空格和制表符时一致；回车时此教学模型不同。",
          "componentId": "parser-agreement"
        }
      ],
      "scenes": [
        {
          "id": "parser-agreement",
          "title": "校验语义与执行语义一致",
          "goal": "选择两个字母之间的分隔符",
          "summary": "空格和制表符时一致；回车时此教学模型不同。",
          "interaction": "选择两个字母之间的分隔符",
          "next": "连续失败触发重试熔断",
          "notes": "原文：https://www.sabrina.dev/p/claude-code-source-leak-analysis\n章节：原文第 5 节\n本页为原创教学模型：separator=CR，可选 space、tab、CR；两组显式分隔规则计算输出数组。空格和制表符时一致；回车时此教学模型不同。\n边界：不代表 Claude Code 真实执行结果或当前产品行为；未复现原文提出的安全问题。所有示例值都由教学状态计算。",
          "componentId": "parser-agreement",
          "moduleId": "parser-agreement-module",
          "thumbnail": "./thumbnails/parser-agreement.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "资源与后台任务",
      "modules": [
        {
          "kind": "module",
          "id": "retry-budget-module",
          "title": "连续失败触发重试熔断",
          "desc": "限制失败预算，保留错误交由诊断；减少次数不意味着修复原因。",
          "componentId": "retry-budget"
        },
        {
          "kind": "module",
          "id": "background-gates-module",
          "title": "后台任务先检查启动条件",
          "desc": "条件不足时列出未满足项；全部满足才开始；这些门槛是教学设定。",
          "componentId": "background-gates"
        }
      ],
      "scenes": [
        {
          "id": "retry-budget",
          "title": "连续失败触发重试熔断",
          "goal": "拖动演练盖章次数的上限",
          "summary": "限制失败预算，保留错误交由诊断；减少次数不意味着修复原因。",
          "interaction": "拖动演练盖章次数的上限",
          "next": "后台任务先检查启动条件",
          "notes": "原文：https://www.sabrina.dev/p/claude-code-source-leak-analysis\n章节：原文第 6 节\n本页为原创教学模型：limit=3，整数1到8；场景固定八次请求均失败。限制失败预算，保留错误交由诊断；减少次数不意味着修复原因。\n边界：不代表 Claude Code 真实执行结果或当前产品行为；未复现原文提出的安全问题。所有示例值都由教学状态计算。",
          "componentId": "retry-budget",
          "moduleId": "retry-budget-module",
          "thumbnail": "./thumbnails/retry-budget.png"
        },
        {
          "id": "background-gates",
          "title": "后台任务先检查启动条件",
          "goal": "设置演讲提醒钟的时间、资料数和锁状态",
          "summary": "条件不足时列出未满足项；全部满足才开始；这些门槛是教学设定。",
          "interaction": "设置演讲提醒钟的时间、资料数和锁状态",
          "next": "运行结果检验实现判断",
          "notes": "原文：https://www.sabrina.dev/p/claude-code-source-leak-analysis\n章节：原文第 3 节\n本页为原创教学模型：elapsed=5，范围0到20；sessions=1，范围0到5；lock=false；教学门槛时间10且资料2且锁可用。条件不足时列出未满足项；全部满足才开始；这些门槛是教学设定。\n边界：不代表 Claude Code 真实执行结果或当前产品行为；未复现原文提出的安全问题。所有示例值都由教学状态计算。",
          "componentId": "background-gates",
          "moduleId": "background-gates-module",
          "thumbnail": "./thumbnails/background-gates.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "验证与发布",
      "modules": [
        {
          "kind": "module",
          "id": "run-verification-module",
          "title": "运行结果检验实现判断",
          "desc": "仅阅读不授予通过；运行可暴露偏差；修复后重新运行验证。",
          "componentId": "run-verification"
        },
        {
          "kind": "module",
          "id": "release-defense-module",
          "title": "发布防线检验最终产物",
          "desc": "都未开启会暴露两项；单扫描阻断但没有修复；允许清单移除两项；两层同时启用可发布此样例。",
          "componentId": "release-defense"
        }
      ],
      "scenes": [
        {
          "id": "run-verification",
          "title": "运行结果检验实现判断",
          "goal": "修改两个数并运行讲义中的算术例子，再勾选修复",
          "summary": "仅阅读不授予通过；运行可暴露偏差；修复后重新运行验证。",
          "interaction": "修改两个数并运行讲义中的算术例子，再勾选修复",
          "next": "发布防线检验最终产物",
          "notes": "原文：https://www.sabrina.dev/p/claude-code-source-leak-analysis\n章节：原文第 7 节\n本页为原创教学模型：a=2,b=2,repair=false,ran=false；错误实现返回a+b+1，期望a+b。仅阅读不授予通过；运行可暴露偏差；修复后重新运行验证。\n边界：不代表 Claude Code 真实执行结果或当前产品行为；未复现原文提出的安全问题。所有示例值都由教学状态计算。",
          "componentId": "run-verification",
          "moduleId": "run-verification-module",
          "thumbnail": "./thumbnails/run-verification.png"
        },
        {
          "id": "release-defense",
          "title": "发布防线检验最终产物",
          "goal": "为封好的公开讲义启用允许清单和最终扫描",
          "summary": "都未开启会暴露两项；单扫描阻断但没有修复；允许清单移除两项；两层同时启用可发布此样例。",
          "interaction": "为封好的公开讲义启用允许清单和最终扫描",
          "next": "回到原文，核验这些设计选择的适用边界。",
          "notes": "原文：https://www.sabrina.dev/p/claude-code-source-leak-analysis\n章节：原文第 9 节\n本页为原创教学模型：allowlist=false,scan=false；三个固定文件public.js、debug.map、private-notes.txt；只允许 public.js。都未开启会暴露两项；单扫描阻断但没有修复；允许清单移除两项；两层同时启用可发布此样例。\n边界：不代表 Claude Code 真实执行结果或当前产品行为；未复现原文提出的安全问题。所有示例值都由教学状态计算。",
          "componentId": "release-defense",
          "moduleId": "release-defense-module",
          "thumbnail": "./thumbnails/release-defense.png"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "source-boundary": "./thumbnails/source-boundary.png",
    "package-manifest": "./thumbnails/package-manifest.png",
    "attribution": "./thumbnails/attribution.png",
    "trusted-summary": "./thumbnails/trusted-summary.png",
    "parser-agreement": "./thumbnails/parser-agreement.png",
    "retry-budget": "./thumbnails/retry-budget.png",
    "background-gates": "./thumbnails/background-gates.png",
    "run-verification": "./thumbnails/run-verification.png",
    "release-defense": "./thumbnails/release-defense.png"
  }
};
