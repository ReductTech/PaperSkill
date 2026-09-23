import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Evidence-based diagnostic reasoning with multi-agent copilot for human pathology",
    "titleZh": "面向人类病理学的多智能体循证诊断推理",
    "venue": "arXiv 2506.20964v2 · 2025",
    "authors": "Luca L. Weishaupt, Chengkuan Chen, Drew F. K. Williamson, Richard J. Chen, Guillaume Jaume, Tong Ding, Bowen Chen, Anurag Vaidya, Long Phi Le, Ming Y. Lu, Faisal Mahmood",
    "affiliation": "Brigham and Women's Hospital · Harvard Medical School · MGH · Broad Institute · MIT",
    "domain": "计算病理 × 多模态大模型 × 多智能体系统",
    "coreProblem": "多模态大模型只能在很小的感兴趣区域上工作，无法在十亿像素级的全切片上自主规划、跨区域取证并生成可追溯的病理报告。",
    "coreInsight": "把「看哪里」变成一个可迭代的循环：<strong>supervisor</strong> 提出假设并派发带坐标与倍率的任务，多个 <strong>explorer</strong> 并行取证，由病理专用的 <strong>PathChat+</strong> 提供形态学描述，累积够跨倍率证据后才下诊断——在 DDxBench 上取得 top-1 86.0%、top-3 92.7%。",
    "keywords": [
      "多智能体",
      "计算病理",
      "全切片图像",
      "多模态大模型"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "固定放大一小块区域：看得清，但整片组织里别处的证据不会进入视野。",
      "componentId": "hero-scan"
    },
    "newMethod": {
      "desc": "先低倍粗扫再高倍确认：同一片组织，重要的形态最终被定位并确认。",
      "componentId": "hero-scan"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "十亿像素的切片，和只能看一小块的模型",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "第一章建立整个教程的问题。它回答「为什么不能直接把整张切片丢给模型」，并为后面所有章节留下一个问题：模型该如何自己决定看哪里。",
      "analogy": {
        "title": "取一小块，就只能看一小块",
        "text": "从一整块标本上只取一小块做成切片：<strong>取到的那一块之外，都不在你的视野里</strong>，别处的证据不会自己跑进来。",
        "componentId": "analogy-scene-a"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "一个区域看不完一张切片",
          "desc": "亲手在一个区域里找癌：拖动 896×896 的取图框，在原文 Figure 4 的甲状腺切片上挑一个 20× 区域，看 PathChat+ 会给出什么描述。真正的血管侵犯在别处——单看一个区域，你会漏掉它。所以系统必须自己决定看哪里：20× 下每张切片平均有 <strong>1020 ± 783</strong> 个组织 ROI，而只给固定的 10 个专家 ROI 时 top-1 只有 0.800。",
          "componentId": "m1-coverage"
        }
      ],
      "insight": "真正缺的不是分辨率，而是一个能自己决定下一步看哪里的循环。",
      "takeaways": [
        {
          "icon": "🖼",
          "title": "十亿像素",
          "desc": "一张全切片在 20× 下有上千个候选区域，远超一次输入能容纳的范围。"
        },
        {
          "icon": "🔍",
          "title": "ROI 的天花板",
          "desc": "只给模型固定小区域，就丢掉了「该看哪里」这个决定。"
        },
        {
          "icon": "🔁",
          "title": "需要一个循环",
          "desc": "方法必须能反复规划、观察、再规划。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "切片怎样变成模型的输入",
      "badge": "inf",
      "badgeLabel": "输入",
      "bridge": "承接第一章的尺度矛盾，回答「模型实际看到的到底是什么」，为后面的任务派发与执行链提供输入表示的基础。",
      "analogy": {
        "title": "贴到玻片上，才能放到镜下",
        "text": "模型从不直接吞下整张切片，它拿到的是<strong>一块被圈定并注明倍率的区域</strong>。",
        "componentId": "analogy-scene-a"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "你交给模型的到底是什么",
          "desc": "点击原文 Figure 4 真实使用的四个 ROI，看清每一次「让模型看图」实际交出的坐标、倍率、取图尺寸与 token 数，以及 PathChat+ 对该区域的实际形态学描述。据原文数值推得：448×448 只有 1 块瓦片、不加缩略图 → 128 token；896×896 为 2×2 四块瓦片再加 1 张缩略图 → 640 token，所以单图 token 数落在 128–640 之间。",
          "componentId": "m2-zoom-inset"
        }
      ],
      "insight": "观察请求 = 坐标 + 倍率 + 有限 token，这是一次可以规划的选择。",
      "formula": {
        "lead": "据此推得：每块 448×448 瓦片或缩略图各占 128 token。只有 1 块瓦片时不加缩略图，所以 448×448 是 128 token；896×896 是 2×2 四块瓦片再加一张缩略图，共 5 × 128 = 640 token。",
        "unicode": "N<sub>token</sub> = 128 × N<sub>tile</sub>（N<sub>tile</sub> = 1）；N<sub>token</sub> = 128 × (N<sub>tile</sub> + 1)（N<sub>tile</sub> &gt; 1）",
        "symbols": [
          {
            "sym": "N_token",
            "desc": "该图占用的视觉 token 数，无量纲计数"
          },
          {
            "sym": "N_tile",
            "desc": "448×448 瓦片数，整数 1–4"
          },
          {
            "sym": "128",
            "desc": "每块瓦片或缩略图压成的 token 数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "坐标 + 倍率",
          "desc": "每一次取图都由这两项决定。"
        },
        {
          "icon": "🧮",
          "title": "128–640",
          "desc": "单图 token 数由瓦片数决定，输入是有预算的。"
        },
        {
          "icon": "👁",
          "title": "谁来决定",
          "desc": "所以「看哪里」必须由系统自己规划。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先低倍定位，再高倍确认",
      "badge": "inf",
      "badgeLabel": "洞见",
      "bridge": "给出全文的核心洞见，回答第二章留下的问题：「既然看哪里可以规划，那么该怎么规划？」",
      "analogy": {
        "title": "先扫一遍，再对准",
        "text": "同一张玻片，<strong>顺序不同，结果就不同</strong>：一直用高倍盯住一处会漏掉别处，先用低倍扫过再换高倍对准才不会漏。",
        "componentId": "analogy-scene-a"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同一起点：只看一处 vs 先粗后细",
          "desc": "用同一张甲状腺切片比较两条路线：只靠一处 20× 区域下判断，与 1.25× 粗扫 → 5× 看包膜与实质交界 → 20× 确认血管侵犯。原文里 1.25× 与 5× 都指向良性，只有 20× 的一个小位置暴露了癌；作为对照，原文把每张切片 10 个专家 ROI 直接交给 PathChat+（不做导航）时 top-1 为 0.800，比带导航的 0.860 低 6.0%（p=0.059）。",
          "componentId": "m3-route-compare"
        }
      ],
      "insight": "不是看得更多，而是把同样的预算放在更能决定诊断的位置上。",
      "takeaways": [
        {
          "icon": "🧭",
          "title": "先粗后细",
          "desc": "低倍负责不遗漏，高倍负责确认形态。"
        },
        {
          "icon": "💰",
          "title": "预算不变",
          "desc": "改的是分配，不是总量。"
        },
        {
          "icon": "🧪",
          "title": "有对照",
          "desc": "专家 ROI 直供 0.800，仍低于带导航的 0.860。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "读片预算与「证据已经够了」的判据",
      "badge": "both",
      "badgeLabel": "训练 + 推理",
      "bridge": "把第三章的洞见量化成两个可以亲手调节的量：<strong>预算分配</strong>与<strong>停止阈值</strong>；同时给出全文最重要的数量证据。",
      "analogy": {
        "title": "先圈出要看的地方",
        "text": "一张切片不能处处都细看：<strong>圈哪几处、用哪一档，决定你最后能看到什么</strong>。",
        "componentId": "analogy-scene-a"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "精检多少个区域才算够",
          "desc": "拖动把手决定高倍精检多少个区域，并与原文的实际用量对照：平均 <strong>194.5 ± 102.8</strong> 个区域（高倍 156.4 ± 90.3、中倍 31.1 ± 23.8、低倍 6.9 ± 4.8），而每张切片在 20× 下平均有 <strong>1020 ± 783</strong> 个组织 ROI。原文报告检视区域数与诊断准确率无显著相关——看得多不等于看得准。",
          "componentId": "m4-budget-split"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "什么时候可以说「够了」",
          "desc": "按原文 Figure 4 的真实任务逐轮推进，并在每一轮自己决定「继续观察」还是「就此下诊断」：1.25× 与 5× 的回报都指向良性，此时收工就会得到与金标准不符的结论；20× 发现血管侵犯后，supervisor 才置位 sufficient_evidence，并给出滤泡型腺瘤与乳头状甲状腺癌被排除的理由。",
          "componentId": "m4-stop-threshold"
        }
      ],
      "insight": "预算不是越多越好，停止条件才是把风险与成本分开的那把尺。",
      "formula": {
        "lead": "据此推得：原文给出的平均检视区域数与全量区域数之比，可以读成一次实际搜索的覆盖率。（R_检视 = 194.5 为平均检视区域数，R_全量 = 1020 为 20× 下每张切片的组织 ROI 均值；这是对原文描述性统计的换算，不是原文公式。）",
        "unicode": "覆盖率 = R<sub>检视</sub> / R<sub>全量</sub> = 194.5 / 1020 ≈ 0.19",
        "symbols": [
          {
            "sym": "R_检视",
            "desc": "平均检视区域数，均值 194.5"
          },
          {
            "sym": "R_全量",
            "desc": "20× 下每张切片的组织 ROI 均值 1020"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📊",
          "title": "高倍占大头",
          "desc": "原文分布是高倍 156.4、中倍 31.1、低倍 6.9。"
        },
        {
          "icon": "🛑",
          "title": "停止判据",
          "desc": "阈值决定漏检风险与预算消耗的平衡。"
        },
        {
          "icon": "🔗",
          "title": "不是看得越多越准",
          "desc": "检视数量与准确率无显著相关。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "条件信息怎样改变第一步",
      "badge": "both",
      "badgeLabel": "训练 + 推理",
      "bridge": "回答第四章之后的新问题：<strong>同样的切片，为什么系统会先去看不同的地方？</strong>并把「条件」与「任务派发」连起来。",
      "analogy": {
        "title": "申请单先决定方向",
        "text": "同一张玻片，<strong>临床信息不同，先看的地方就不同</strong>。",
        "componentId": "analogy-scene-a"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "同一张切片，换个提问",
          "desc": "在原文的两个真实病例之间切换提问方式，看输入任务与临床信息如何改写 supervisor 的初始鉴别与首轮任务：甲状腺病例先做结构评估以区分滤泡型病变，食管病例先看鳞状上皮与角化珠。条件是提示，不是答案——它改变搜索顺序，不提供结论。",
          "componentId": "m5-conditions"
        }
      ],
      "insight": "条件是提示，不是答案：它改变搜索的顺序，不改变必须自己去找证据这件事。",
      "takeaways": [
        {
          "icon": "🧾",
          "title": "条件进得去",
          "desc": "组织部位、性别与任务描述都会进入系统提示。"
        },
        {
          "icon": "🧭",
          "title": "假设先变",
          "desc": "条件先改写鉴别诊断列表。"
        },
        {
          "icon": "📌",
          "title": "任务再变",
          "desc": "首轮派发的方向与数量随之改变。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一次真实病例的三步执行链",
      "badge": "inf",
      "badgeLabel": "推理侧",
      "bridge": "用原文 Figure 4 的甲状腺病例把前面四章拼成一条可走完的执行链，回答<strong>「这个循环实际跑起来是什么样」</strong>。",
      "analogy": {
        "title": "逐级换物镜，一档一档看",
        "text": "每一次换物镜都缩小范围、提高可信度，<strong>最后一步才看到决定性形态</strong>。",
        "componentId": "analogy-scene-b"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "原文 Figure 4：甲状腺病例的完整推理链",
          "desc": "逐轮走完原文 Figure 4 三轮任务的真实文本、真实关键 ROI 坐标与 explorer 回报：1.25× 多个包膜完整的结节、倾向良性；5× 包膜仍完整、未见侵犯；20× 核增大、包膜透亮并侵入内皮衬里的血管，确诊滤泡型甲状腺癌（FTC），并以血管侵犯排除滤泡型腺瘤、以缺乏乳头状核特征排除乳头状甲状腺癌。低倍下「看起来良性」不是结论。",
          "componentId": "m6-case-trace"
        }
      ],
      "insight": "决定性的形态往往很小：低倍给出方向，高倍才能定案。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "三步链",
          "desc": "1.25× 定方向、5× 查交界、20× 定侵犯。"
        },
        {
          "icon": "🔄",
          "title": "每步更新",
          "desc": "发现回来就改写假设，而不是走完再看。"
        },
        {
          "icon": "⚖️",
          "title": "靠证据排除",
          "desc": "血管侵犯排除腺瘤，核特征排除乳头状癌。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "PathChat+ 是怎样练出可靠的形态学描述的",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "解释第六章里那句可靠描述从哪里来，回答「为什么换掉 captioner 会掉 43 %」这一前置条件。",
      "analogy": {
        "title": "把描述练短、练准",
        "text": "先学会把图和词对齐，再学会按要求说人话——<strong>两步训练，缺一不可</strong>。",
        "componentId": "analogy-scene-b"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "同一块组织，三种描述器",
          "desc": "把同一块 ROI 交给三种描述器，对照原文 Figure 1B 的真实形态学描述与下游 DDxBench top-1：PathChat+ 0.860、PathChat 1 0.640、通用多模态模型 0.427。PathChat+ 用 1,133,241 条指令、549 万轮问答、62.4 万张图训练，先冻结语言模型只训多模态适配器，再解冻做指令微调。描述质量本身就是系统能力的一部分。",
          "componentId": "m7-two-stage-training"
        }
      ],
      "insight": "换掉这个 captioner 会掉 43 %：描述质量本身就是系统能力的一部分。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "先对齐",
          "desc": "阶段一只训适配器，不动语言模型。"
        },
        {
          "icon": "🎯",
          "title": "再听指令",
          "desc": "阶段二整体放开，损失只算回答。"
        },
        {
          "icon": "📚",
          "title": "规模",
          "desc": "113 万条指令、549 万轮问答、62.4 万张图。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "supervisor–explorer：系统结构与消融",
      "badge": "trn",
      "badgeLabel": "结构与消融",
      "bridge": "把前七章讲到的角色拼成一张可操作的系统结构图，并用消融回答「哪一环最不能省」。",
      "analogy": {
        "title": "一张玻片，一处任务，一个人",
        "text": "主诊医师只做一件事：<strong>把任务分清楚</strong>，看片的活并行去做。",
        "componentId": "analogy-scene-b"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "换掉一个零件，会损失什么",
          "desc": "点开系统里每个零件的职责，再切换三种配置，对照 DDxBench 的<strong>聚合</strong>消融结果（非本病例单独结果）：完整层级 0.860、压成单 agent 0.780（−8.00%，p&lt;0.05）、换 PathChat 1 0.640、换通用描述器 0.427。推理型 supervisor 的 +4.66% 未达显著（p=0.142）。",
          "componentId": "m8-system-map"
        }
      ],
      "insight": "最不能省的不是更大的模型，而是分工与领域专用的描述。",
      "takeaways": [
        {
          "icon": "🧑‍✈️",
          "title": "supervisor 只管规划",
          "desc": "提出假设、派发任务、更新计划。"
        },
        {
          "icon": "🧑‍🔬",
          "title": "explorer 只管取证",
          "desc": "并行取图并回报关键 ROI。"
        },
        {
          "icon": "✂️",
          "title": "最不能省的两处",
          "desc": "层级压平掉 8.0 %，换掉病理 captioner 掉 43.3 %。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "置信度、失败模式与安全边界",
      "badge": "trn",
      "badgeLabel": "边界",
      "bridge": "冷静地划出方法与安全的边界，回答「它什么时候不该被信任」，也是全教程的责任声明。",
      "analogy": {
        "title": "不是这个染色能看到的，就不写",
        "text": "病理科有一条铁律：<strong>只报告本次染色真的能看到的形态</strong>。",
        "componentId": "analogy-scene-b"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "五种记录，五种可信度",
          "desc": "在五条真实记录之间切换：自评高置信 96 例准确率 0.906、自评不确定 54 例 0.778（p&lt;0.05）；以及三类失败的具体代价——分级错误 5 例（占全部失败的 45%，均为星形细胞瘤分级，3 例高估、2 例低估）、漏检被良性组织包围的 Merkel 细胞癌微小灶 1/150、在 H&E 上编出 IHC 结果 1/150。置信度可用于分流复核，但三类失败必须由人把关。",
          "componentId": "m9-confidence-triage"
        }
      ],
      "insight": "它知道自己不确定，但仍会在分级、微小病灶和模态上出错——所以人必须在环里。",
      "takeaways": [
        {
          "icon": "📈",
          "title": "置信度可用",
          "desc": "高置信 0.906 对不确定 0.778（p<0.05）。"
        },
        {
          "icon": "⚠️",
          "title": "三类失败",
          "desc": "分级 45 % 的失败、漏检 1/150、幻觉 1/150。"
        },
        {
          "icon": "🛡",
          "title": "模态约束",
          "desc": "任务必须限定在真实可用的检查范围内。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、对照与它的边界",
      "badge": "both",
      "badgeLabel": "收束",
      "bridge": "收束全教程，给出可核对的数字与协议，并明确哪些比较不能直接互换。",
      "analogy": {
        "title": "同一张玻片，同一个起点",
        "text": "只有把方法放在<strong>同一协议</strong>下比，数字才有意义。",
        "componentId": "analogy-scene-b"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "DDxBench 结果竞赛",
          "desc": "让学习者从零开始看到各方法的差距，同时把协议与指标方向钉在结果旁边。",
          "componentId": "m10-result-race"
        }
      ],
      "insight": "数字只在协议内成立：同一基准、同一指标方向、同一评价流程。",
      "formula": {
        "lead": "top-k 准确率的定义，用于读上面的两条指标。",
        "unicode": "top-k = |{ 正确诊断出现在前 k 个诊断中的病例 }| / N，k ∈ {1, 3}，N = 150",
        "symbols": [
          {
            "sym": "k",
            "desc": "取前 k 个诊断，1 或 3"
          },
          {
            "sym": "N",
            "desc": "DDxBench 病例数 150"
          },
          {
            "sym": "top-k",
            "desc": "比例，越高越好"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏁",
          "title": "协议优先",
          "desc": "0.860 与 0.800 的协议不同，不能互换。"
        },
        {
          "icon": "🧩",
          "title": "差距来自哪里",
          "desc": "换掉病理 captioner 掉到 0.427，压平层级掉到 0.780。"
        },
        {
          "icon": "🚧",
          "title": "边界",
          "desc": "罕见病更低（0.818），分级、微小病灶与模态幻觉仍需人工把关。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV11NLH6VEU7",
      "title": "AI病理脑膜瘤科普-Cambridge_PM2605",
      "reason": "17 集病理 AI 系列，其中「病理AI前沿：WSI全局建模」与「多模态病理AI：CONCH与TITAN架构」直接对应本文的切片级建模与 PathChat+ 视觉编码器；播放量低，但找不到第二支中文视频系统讲这两点。",
      "cover": "https://i0.hdslb.com/bfs/archive/68ed84accf3d486bd83fd4918564d4f322bce13e.jpg",
      "views": "195播放"
    },
    {
      "bvid": "BV1de411E7Qd",
      "title": "WSI(病理切片)切割成patch",
      "reason": "讲清整张切片如何被切成 patch，是理解第 2 章「一块 ROI 到底给了模型什么」最直观的动手材料。",
      "cover": "https://i1.hdslb.com/bfs/archive/d4b288780fc75d20bb7d58ede8cb6d0b6fe28900.jpg",
      "views": "1.0万播放"
    },
    {
      "bvid": "BV1YK421y7dH",
      "title": "病理patch切片的vit模型迁移学习特征提取(Transformer模型)",
      "reason": "用 ViT 提取病理 patch 特征的实操，对应 PathChat+ 用 CONCH v1.5 编码图像这一段。",
      "cover": "https://i0.hdslb.com/bfs/archive/b8070b2da94cb63460a45cb3a31a581e15ed96db.jpg",
      "views": "5709播放"
    },
    {
      "bvid": "BV1uK4y1i7ee",
      "title": "Anacodna及openslide安装",
      "reason": "SlideSeek 的 explorer 通过 OpenSlide 读取指定坐标与倍率的区域，这支视频把运行前提讲全了。",
      "cover": "https://i2.hdslb.com/bfs/archive/f27bf833f67a450526ec3259ae2202e829eaae41.jpg",
      "views": "4144播放"
    }
  ]
};
