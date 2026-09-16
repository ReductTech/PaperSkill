import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Agentic Harness Engineering: Observability-Driven Automatic Evolution of Coding-Agent Harnesses",
    "titleZh": "智能体 Harness 工程：可观测性驱动的编码智能体 Harness 自动演化",
    "venue": "Preprint (arXiv:2604.25850v3 [cs.CL]) · 2026",
    "authors": "Jiahang Lin, Shichun Liu, Chengjun Pan, Lizhi Lin, Shihan Dou, Xuanjing Huang, Hang Yan, Zhenhua Han, Tao Gui",
    "affiliation": "复旦大学、北京大学、上海期智智风科技有限公司",
    "domain": "编码智能体 · agent harness · 自动演化 · 可观测性",
    "coreProblem": "编码智能体的 Harness（提示词、工具、中间件等模型外可编辑组件）目前依赖人工工程；自动化面临三大障碍——可编辑组件的动作空间异构、长而杂乱的轨迹淹没可执行信号、编辑效果难以归因。",
    "coreInsight": "瓶颈在可观测性而非智能体能力：AHE 用组件/经验/决策三层可观测性把每次 Harness 编辑变成可证伪的文件级契约，使 Harness 能由智能体闭环自动演化，十轮迭代将 Terminal-Bench 2 pass@1 从 69.7% 提升到 77.0%。",
    "keywords": [
      "harness engineering",
      "observability",
      "self-evolving agent",
      "Terminal-Bench 2",
      "pass@1"
    ]
  },
  "hero": {
    "flowId": "hero-loops",
    "oldMethod": {
      "desc": "开发者人工阅读轨迹、凭经验修改组件、再重跑评估。基座模型演进越快，这一人工循环越跟不上——模型能力与释放其能力所需的 Harness 之间缺口不断扩大。"
    },
    "newMethod": {
      "desc": "轨迹被蒸馏为证据，演化智能体基于证据修改组件；每次编辑附带自我声明的预测，由下一轮任务级结果验证——兑现的保留、未兑现的按文件粒度回滚，每处编辑都成为可证伪的契约。"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "Harness 的更新之困与 AHE 破题",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "lead": "Coding agents 正越来越多地承担长周期软件工程任务，并在真实代码仓库的问题修复、多步骤终端工作流等方面取得可衡量的进展。",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "Harness 是什么、为什么难更新",
          "desc": "进展不仅来自语言模型，也来自外围工程组件。点击左侧组件查看作用；再切换两条更新路径，推演各自的困境。",
          "componentId": "mod-harness-intro"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "AHE 闭环总览：三层可观测性",
          "desc": "AHE 把 harness 优化变成由演化智能体驱动的闭环。点击节点与三个可观测性标注，查看每一环的作用。",
          "componentId": "mod-ahe-loop"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "方法总览：三层可观测性与 AHE 闭环",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "lead": "AHE 把闭环拆成三根可观测性支柱——组件、经验、决策——再由 Algorithm 1 的外层循环把三者组装成无人值守的逐轮迭代。",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "组件可观测性：解耦的文件级组件",
          "desc": "七类正交组件如何解耦、各承担什么；再看种子 H₀ 为什么刻意极简。",
          "componentId": "mod-comp-obs"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "经验可观测性：一个跑、一个读",
          "desc": "Coding Agent 负责跑出轨迹，Agent Debugger 负责读懂轨迹——点击各环节与三层证据查看分工。",
          "componentId": "mod-exp-obs"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "决策可观测性：两个约束",
          "desc": "可控性约束与预测约束如何共同让每次编辑成为可证伪的契约。",
          "componentId": "mod-dec-obs"
        },
        {
          "kind": "module",
          "id": "2.4",
          "title": "Algorithm 1：AHE 外层循环",
          "desc": "沿六个阶段逐步走一轮迭代，理解归因先于蒸馏与 H_best 更新。",
          "componentId": "mod-alg-loop"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "实证研究总览：最终结果与实验设置",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "lead": "我们围绕三个问题组织实证研究——RQ1：为什么是智能体 harness 工程，而不是人工设计的 harness 或其他自动化方法？RQ2：AHE 是否过拟合其优化目标？RQ3：AHE 内部是什么驱动了增益，循环的自我归因有多可靠？",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "最终结果：Figure 1 十轮演化曲线",
          "desc": "点「开始推演」观看曲线从第 1 轮播到第 10 轮；播完后出现四个方框标注，点击查看每个里程碑编辑。",
          "componentId": "mod-fig1"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "实验设置：基准、协议与模型",
          "desc": "点击四张设置卡，查看基准构成、严格口径、模型配置与迁移探测设计。",
          "componentId": "mod-setup"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "RQ1：AHE 的现有定位",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "lead": "同样是自进化，差距从何而来？ACE 与 TF-GRPO 从未把外围脚手架开放给编辑——而增益恰好住在那些层里。",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "主结果：Terminal-Bench 2 全对比",
          "desc": "七种方法 × 四个难度档；下方解释差距为什么住在基线从不编辑的层里。",
          "componentId": "mod-race"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "RQ2：向未见任务与基础模型迁移",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "lead": "把演化好的 harness 原样冻结，搬到没见过的任务面和没见过的底座模型上——增益还在吗？",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "迁移实验：换基准、换模型",
          "desc": "两组视图：跨模型六组配对柱、跨基准分仓库对比；下方是简明解释。",
          "componentId": "mod-transfer"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "RQ3：价值如何在组件间累积",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "lead": "把完整 AHE 的组件逐个换进种子，看每个组件各自值多少；再用 Figure 4 检验循环的自我归因有多可靠。",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "价值在哪里累积：单组件消融",
          "desc": "Table 3 可视化：四个组件各换进种子一次，看各自成败；下方分析非加性。",
          "componentId": "mod-comp-value"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "自我归因有多可靠：Figure 4",
          "desc": "修复预测与回归预测的精确率/召回率，对照随机基线；点击柱子看含义。",
          "componentId": "mod-fig4"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "结论、局限与未来方向",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "lead": "harness 级演化是一条与模型侧训练互补的轴线：外部化、可审计的经验积累面。论文同时划清了自己结论的边界。",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "论文全景：从问题到结论",
          "desc": "§1 问题 → §2 相关工作 → §3 方法 → §4 实验 → §5 结论，点击各节回顾要点。",
          "componentId": "mod-paper-map"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "三条局限：论文自己划定的边界",
          "desc": "基准范围 / 演化操作点 / 自我修改治理——点击展开每条局限及其对解读结论的影响。",
          "componentId": "mod-limitations"
        },
        {
          "kind": "module",
          "id": "7.3",
          "title": "未来方向",
          "desc": "论文点名的改进方向：回归盲区、交互感知演化、多操作点、更广验证面与完整治理栈。",
          "componentId": "mod-future"
        }
      ]
    }
  ]
};
