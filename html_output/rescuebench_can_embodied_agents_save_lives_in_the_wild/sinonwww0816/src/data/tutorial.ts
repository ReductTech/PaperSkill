import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "RescueBench: Can Embodied Agents Save Lives in the Wild?",
    "titleZh": "RescueBench：具身智能体能在野外挽救生命吗？",
    "venue": "arXiv 预印本 · 2026",
    "authors": "Kui Wu, Beiyu Guo, Hao Chen, ShuHang Xu, Yuling Li, Yongdan Zeng, Zhoujun Li, Yizhou Wang, Fangwei Zhong",
    "affiliation": "北京航空航天大学、北京师范大学、北京大学、澳门城市大学、ATEC2025 Challenge Committee",
    "domain": "具身智能 · 搜索救援 · 导航基准 · 空间记忆",
    "coreProblem": "现有基准常把导航、交互与记忆分开测试，无法看见这些能力串联后如何发生级联失败。",
    "coreInsight": "RescueBench把<b>探索—救援—返回—交接</b>组成连续闭环，并用阶段分数定位失败究竟来自搜索、接近还是空间记忆。",
    "keywords": [
      "搜索救援（SAR）",
      "具身智能",
      "诊断基准",
      "多模态探索",
      "空间记忆"
    ]
  },
  "hero": {
    "eyebrow": "RescueBench · 交互式论文教程",
    "title": "会导航，就真的会救人吗？",
    "subtitle": "现有基准已经能测试很多局部能力，但一次搜索救援要求它们在同一条任务链中连续发生。",
    "prompt": "导航完成，任务就完成了吗？",
    "background": "/images/rescuebench_scene.jpeg",
    "componentId": "hero-loop",
    "cta": "看看问题从哪里开始"
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "为什么把能力单独测还不够？",
      "badge": "inf",
      "badgeLabel": "理解基准",
      "bridge": "已有基准原本就在回答不同的局部问题；这一章追问的是，当这些能力必须按顺序依赖地发生时，评测还能看见什么。",
      "analogy": {
        "title": "局部能力不是一条完整任务链",
        "text": "会遵循导航指令、会在局部交互、会到达已知目的地，分别说明了不同能力；它们并不会自动证明一次连续搜索救援能够完成。"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "从局部能力到连续救援",
          "desc": "先区分已有基准回答的局部问题，再选择第一个失败阶段，观察错误如何截断后续流程。",
          componentId: "benchmark-gap"
        },
        {
          kind: "module",
          "id": "1.2",
          "title": "回到论文原图核对这一评测缺口",
          "desc": "",
          componentId: "paper-evidence"
        }
      ],
      "insight": "RescueBench 填补的评测缺口不在于“以前没测导航或交互”，而在于它让我们观察这些能力在连续依赖任务中如何共同失效。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "局部测试各有价值",
          "desc": "它们回答不同能力是否存在。"
        },
        {
          "icon": "🔗",
          "title": "SAR 强调顺序依赖",
          "desc": "搜索、救援、返回、交接共享任务状态。"
        },
        {
          "icon": "⚠️",
          "title": "失败会向后传播",
          "desc": "前一阶段失败会让后续阶段无法到达。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "一次完整救援，智能体到底要做什么？",
      "badge": "inf",
      "badgeLabel": "任务定义",
      "bridge": "第1章说明了连续任务为何会暴露级联失败；现在来看 RescueBench 给智能体什么信息，又要求它连续完成什么。",
      "analogy": {
        "title": "线索告诉你“该找什么”，却不会直接告诉你“该怎么走”",
        "text": "RescueBench 把救援定义为一条连续任务链：智能体要根据多模态线索主动搜索，靠近伤员完成救援，再依靠先前形成的空间信息返回并交接。"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "线索不是路线：智能体知道什么，又不知道什么？",
          "desc": "切换可用线索，观察候选搜索区域怎样被逐步约束。无论选择哪种线索，系统都不会自动生成完整导航路线。",
          componentId: "clue-search-v2"
        },
        {
          kind: "module",
          "id": "2.2",
          "title": "一次完整救援的四个阶段",
          "desc": "亲自推进探索、定位与救援、返回、定位与交接。每个阶段都显示当前目标、可用信息、依赖能力与任务状态；除 ROCKET-2 外，多数方法在进入目标或交接区域约 1.5 m 后由环境辅助触发交互。",
          componentId: "rescue-stage-stepper-v2"
        }
      ],
      "insight": "RescueBench 尽量把“是否到达正确位置”和“是否具备复杂操作能力”分开：线索只约束搜索，S3 依赖空间记忆，多数方法在 1.5 m 内由环境辅助触发交互。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "线索不是路线",
          "desc": "没有伤员坐标，也没有逐步导航指令。"
        },
        {
          "icon": "↔️",
          "title": "探索与返回",
          "desc": "S1 依赖自主探索，S3 依赖前期空间信息。"
        },
        {
          "icon": "◎",
          "title": "到达触发交互",
          "desc": "多数方法进入约 1.5 m 范围后由环境辅助触发。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "什么时候“导航”开始变成真正的“搜索”？",
      "badge": "inf",
      "badgeLabel": "渐进难度",
      "bridge": "第2章建立了完整救援流程；这一章观察同一套流程怎样沿环境复杂度、线索歧义与空间层级逐步增加压力。",
      "analogy": {
        "title": "难度不是只把目标放得更远",
        "text": "L1–L5 同时改变环境视觉复杂度、线索需要的推理方式和空间结构。关键变化发生在 L2 → L3：目标不再只是等待被发现，而需要主动搜索。"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "五档难度怎样升级？",
          "desc": "拖动离散滑块或点击难度标签，同时查看论文场景、环境条件、任务要求和线索推理；L3–L5 的线索依次强调视觉匹配、方向推理和层级空间推理。",
          componentId: "difficulty-progressor-v2"
        },
        {
          kind: "module",
          "id": "3.2",
          "title": "从“发现目标”到“主动搜索”",
          "desc": "对照 L2 与 L3：前者仍在复杂背景中发现近距目标，后者必须先判断应该去哪里寻找。",
          componentId: "l2-l3-transition"
        },
        {
          kind: "module",
          "id": "3.3",
          "title": "难度怎样真正落到 Episode 上？",
          "desc": "L1–L5 不只是文字标签。查看 Table 7 对距离、高度变化与环境交互给出的生成约束。",
          componentId: "difficulty-recipe-v2"
        }
      ],
      "insight": "L2 → L3 是任务设计上的关键转折：从 L3 开始，智能体首先要回答的已经不是“怎么走到目标”，而是“去哪里找目标”。",
      "takeaways": [
        {
          "icon": "◫",
          "title": "三条难度轴",
          "desc": "环境、线索与空间结构共同升级。"
        },
        {
          "icon": "🔎",
          "title": "主动搜索从 L3 开始",
          "desc": "L2 → L3 是任务设计上的关键转折。"
        },
        {
          "icon": "↥",
          "title": "高难度加入结构约束",
          "desc": "L4 加入环境交互，L5 要求显著高度变化。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "失败不是只有 0 和 1——怎样知道它卡在哪？",
      "badge": "both",
      "badgeLabel": "核心指标",
      "bridge": "难度升高后任务失败，仅仅记录“失败”够不够？",
      "analogy": {
        "title": "没完成，也要看已经走到了哪里",
        "text": "终点只回答有没有完成；分段记录还能说明推进了多少、具体卡在哪一步。",
        componentId: "course-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "两个“失败”真的一样吗？",
          "desc": "切换失败位置：最终结果都为失败，但任务推进程度完全不同。",
          componentId: "failure-episodes-v2"
        },
        {
          kind: "module",
          "id": "4.2",
          "title": "任务完成率（TCR）：严格完成判定",
          "desc": "分别切换四个阶段；只有 S1–S4 全部成功，本次任务才算完整完成。",
          componentId: "tcr-judge-v2"
        },
        {
          kind: "module",
          "id": "4.3",
          "title": "任务分数（TS）：没完成，离成功还有多远？",
          "desc": "拖动智能体靠近目标，观察最佳距离与阶段得分如何实时变化。",
          componentId: "stage-score-distance-v2"
        },
        {
          kind: "module",
          "id": "4.4",
          "title": "阶段得分（StageScore）：究竟卡在哪一步？",
          "desc": "切换两种匿名分布：任务分数同为 44，四个阶段的能力轮廓却不同。",
          componentId: "stage-profile-v2"
        }
      ],
      "insight": "TCR 回答是否完整成功，TS 回答整体推进了多少，StageScore 进一步定位失败发生在哪一步。",
      "takeaways": [
        {
          "icon": "✅",
          "title": "TCR最严格",
          "desc": "四段全成才记成功。"
        },
        {
          "icon": "📏",
          "title": "TS看推进程度",
          "desc": "四段连续得分相加，总分0–100。"
        },
        {
          "icon": "⌖",
          "title": "StageScore定位",
          "desc": "同一总分也可能卡在不同阶段。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "现有智能体到底表现得有多差？",
      "badge": "both",
      "badgeLabel": "总体结果",
      "bridge": "现在用 TCR 与 TS 看真实实验结果：现有智能体在五档难度下到底能走多远？",
      "analogy": {
        "title": "同一条逐级变难的路线，谁还能抵达终点？",
        "text": "随着路线加入视觉干扰、主动搜索和空间层级，比较完整抵达与途中进展。",
        componentId: "course-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "谁在接受测试？",
          "desc": "按架构家族查看 7 个学习型基线，以及 Human 与 Oracle 两类参照。",
          componentId: "method-families-v2"
        },
        {
          kind: "module",
          "id": "5.2",
          "title": "难度升高以后，任务分数怎样下降？",
          "desc": "选择方法与 L1–L5 难度，观察总体任务进展的下降曲线。",
          componentId: "ts-difficulty-curve-v2"
        },
        {
          kind: "module",
          "id": "5.3",
          "title": "L5：完整救援还能完成吗？",
          "desc": "切换学习型基线、人类玩家与 Oracle，比较完整任务完成率和任务分数；学习型方法的 TCR 虽然同为 0，TS 仍保留 1.8–12.2 的部分进展差异。",
          componentId: "l5-capability-gap-v2"
        }
      ],
      "insight": "难度升高后 TS 整体下降；L5 的学习型基线 TCR 全为 0，但 Human 与 Oracle 说明任务并非不可完成。",
      "takeaways": [
        {
          "icon": "↘",
          "title": "TS快速下降",
          "desc": "L1→L2先出现明显能力断崖。"
        },
        {
          "icon": "0",
          "title": "L5完整完成归零",
          "desc": "所有学习型基线的TCR均为0。"
        },
        {
          "icon": "⇄",
          "title": "失败仍有差异",
          "desc": "TCR相同，TS与整体行为仍可不同。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "失败发生在哪里，又为什么？",
      "badge": "both",
      "badgeLabel": "实验诊断",
      "bridge": "学习型方法整体失败，而且相同 TCR 下仍有不同程度的部分进展——这些进展究竟在哪一步断掉？",
      "analogy": {
        "title": "先定位断点，再查看失败时留下的轨迹",
        "text": "阶段得分回答失败在哪里；代表性轨迹进一步说明不同架构为什么以不同方式失败。",
        componentId: "course-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "阶段诊断器：失败究竟断在哪一步？",
          "desc": "选择方法与 L1–L5，使用 Table 4–5 的精确数据查看四个阶段的得分。",
          componentId: "stage-diagnosis-v2"
        },
        {
          kind: "module",
          "id": "6.2",
          "title": "第一断点：找不到——S1 自主探索",
          "desc": "切换 L3–L5，观察 ROCKET-2（微调）的 S1 如何随搜索空间扩大而下降。",
          componentId: "exploration-decline-v2"
        },
        {
          kind: "module",
          "id": "6.3",
          "title": "第二断点：找到人了，却回不来——S3 空间记忆",
          "desc": "切换典型案例，查看从 S2 到 S3 的返回记忆缺口。",
          componentId: "return-memory-gap-v2"
        },
        {
          kind: "module",
          "id": "6.4",
          "title": "轨迹诊断：为什么不同架构会这样失败？",
          "desc": "切换 Figure 7 的代表性 L3 轨迹面板，连接轨迹现象、论文诊断与架构范式。",
          componentId: "trajectory-lab-v2"
        }
      ],
      "insight": "第一断点是 S1 自主探索的“找不到”，第二断点是 S3 空间记忆的“回不来”。",
      "takeaways": [
        {
          "icon": "⌕",
          "title": "S1是主要瓶颈",
          "desc": "搜索空间扩大后，有效覆盖迅速下降。"
        },
        {
          "icon": "↩",
          "title": "S3是第二断点",
          "desc": "找到目标不代表能够稳定返回。"
        },
        {
          "icon": "◇",
          "title": "失败方式因架构而异",
          "desc": "轨迹现象与架构范式高度相关。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "更多数据能解决这些问题吗？",
      "badge": "trn",
      "badgeLabel": "自动数据与适配",
      "bridge": "第6章定位了“找不到”与“回不来”两个缺口；现在继续追问，它们会不会只是因为模型没有见过足够多的 RescueBench 数据？",
      "analogy": {
        "title": "练习确实有效，但收益不一定覆盖整条路线",
        "text": "自动生成的救援任务能提供密集练习；是否能把简单任务上的进步带到跨区域搜索与返回，需要逐难度、逐阶段核对。",
        componentId: "course-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "数据怎样自动产生？",
          "desc": "选择 L1–L5 并推进四步管线，观察生成约束、自动执行、完整记录、不合格重采与线索生成如何组成闭环；有效 Episodes 最终汇聚为约 400K expert steps，用于适配四种可训练方法。",
          componentId: "auto-data-pipeline-v2"
        },
        {
          kind: "module",
          "id": "7.2",
          "title": "训练前 vs 微调后：自动数据真的有效吗？",
          "desc": "选择方法、TCR / TS 与 L1–L5，直接比较 Table 3 的训练前后精确值。",
          componentId: "finetune-browser-v2"
        },
        {
          kind: "module",
          "id": "7.3",
          "title": "训练收益能坚持到第几级？",
          "desc": "沿 L1–L5 同时查看 zero-shot 与微调后结果，辨认收益如何随方法、难度和指标变化。",
          componentId: "adaptation-across-levels-v2"
        },
        {
          kind: "module",
          "id": "7.4",
          "title": "回到两个瓶颈：各阶段都一起改善了吗？",
          "desc": "用固定 0–25 尺度比较 ROCKET-2 / L4 的训练前后阶段分数，观察适配收益的阶段依赖。",
          componentId: "stage-adaptation-v2"
        }
      ],
      "insight": "自动数据确实提供了有效监督，但收益具有架构、难度与阶段依赖。在论文测试的约 400K expert steps、四种架构和对应适配设置下，高难度探索与空间记忆缺口仍未消失；更大数据规模或新的训练方式是否能够解决它，论文没有直接回答。",
      "takeaways": [
        {
          "icon": "✓",
          "title": "自动数据确实有效",
          "desc": "四种适配方法的 L1 TCR 均有提升。"
        },
        {
          "icon": "↕",
          "title": "收益并不均匀",
          "desc": "方法、难度、指标与阶段都会影响结果。"
        },
        {
          "icon": "△",
          "title": "结论有明确边界",
          "desc": "当前实验没有完成系统的数据缩放研究。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-8",
      "title": "RescueBench 最终告诉了我们什么？",
      "badge": "both",
      "badgeLabel": "最终收束",
      "bridge": "前7章已经从任务设计、难度、指标、总体结果、失败诊断与自动数据回答了“发生了什么”。最后回到 Hero：会导航为什么仍不足以保证完成一次连续搜索救援？",
      "analogy": {
        "title": "找到目标，也要记得怎样把任务带回终点",
        "text": "一次完整救援不是沿着已知路线抵达终点：智能体还要在目标未知时主动搜索，并在经历救援之后调用早期空间信息返回。",
        componentId: "course-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "8.1",
          "title": "从“会导航”到“会完成救援”：最终诊断",
          "desc": "沿 8.1–8.5 回答 Hero，点击四阶段查看 S1 / S3 两个能力断点，再切换排行榜与诊断视角，最后收束到论文支持的结论边界与能力需求。",
          componentId: "chapter8-finale-v2"
        }
      ],
      "insight": "RescueBench 的核心价值不只是给出更低的分数，而是让连续依赖子任务中的失败传播变得可定位、可解释。",
      "takeaways": [
        {
          "icon": "⌕",
          "title": "S1：先找到",
          "desc": "开放环境自主探索是主要瓶颈。"
        },
        {
          "icon": "↩",
          "title": "S3：还能回来",
          "desc": "持久空间记忆是第二个独立瓶颈。"
        },
        {
          "icon": "◎",
          "title": "诊断失败传播",
          "desc": "结论限定在论文当前评测设置内。"
        }
      ]
    }
  ]
};
