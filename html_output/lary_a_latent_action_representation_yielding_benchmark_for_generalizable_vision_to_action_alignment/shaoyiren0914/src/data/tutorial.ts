import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LARY: A Latent Action Representation Yielding Benchmark for Generalizable Vision-to-Action Alignment",
    "titleZh": "夜幕下的潜在动作案：LARYBench 互动调查",
    "venue": "arXiv:2604.11689v1 · 2026",
    "authors": "Dujun Nie, Fengjiao Chen, Qi Lv, Jun Kuang, Xiaoyu Li, Xuezhi Cao, Xunliang Cai",
    "affiliation": "Meituan, Beijing, China",
    "domain": "具身智能 · 潜在动作 · 视觉—动作对齐 · 表示评测",
    "coreProblem": "从无动作标签的人类与机器人视频中学到的表示，究竟保留了多少可泛化的动作语义与连续控制信息？<b>先别急着背结论，你来主导调查。</b>",
    "coreInsight": "LARYBench 用语义分类和控制回归两道审讯，把“看起来会”与“表示里真的含有动作信息”分开。",
    "keywords": [
      "LARYBench",
      "潜在动作",
      "语义 Probe",
      "控制回归",
      "VLA"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "糯糯倒在现场，瓶子身份不明。只看画面变化，<b>证据链仍是空白</b>。",
      "figure": "./images/characters/nuonuo-base.png",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "菲比：‘我早就看出有蹊跷——但今天你主审。<b>你怎么看？</b>’",
      "figure": "./images/characters/phebe-investigate.png",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "案发现场：监控看见了什么？",
      "badge": "inf",
      "badgeLabel": "先判断",
      "bridge": "糯糯倒在档案室，旁边有一只神秘小瓶。菲比先是一惊，随后把主导权交给你：监控中的画面变化，能证明机器人真的理解动作吗？",
      "analogy": {
        "title": "监控不会替你作证",
        "text": "画面变了，只说明<b>发生了变化</b>。菲比：‘先别急着给机器人发理解证书，你怎么看？’",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "选择你的调查风格",
          "desc": "先决定你想怎样查案。选择只会改变提示、互动方式与笑点，所有核心证据都会完整出现。",
          "componentId": "mod-1-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "案发现场 · 是否查看监控？",
          "desc": "监控给出前后两帧，却没有动作标签。请先判断机器人为何会学习人类行为，再查看这份判断哪里还缺证据。",
          "componentId": "mod-1-2"
        }
      ],
      "insight": "无论你选哪一种解释，都会撞上同一个空白：我们没有真实动作标签，怎么知道中间发生了什么？",
      "takeaways": [
        {
          "icon": "🔦",
          "title": "画面是线索",
          "desc": "视觉变化不是理解的判决书。"
        },
        {
          "icon": "🧠",
          "title": "理解待检验",
          "desc": "先提出能区分理解与捷径的问题。"
        },
        {
          "icon": "🗂️",
          "title": "你来主导",
          "desc": "调查风格改变体验，不删减知识。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "无标签的空白：中间动作去哪了？",
      "badge": "inf",
      "badgeLabel": "核心直觉",
      "bridge": "刚才的两场审讯已经明确了评分目标：既要读出“做什么”，也要还原“怎么做”。现在回到证物本身——没有动作标签时，什么样的中间表示能接受这两场测试？",
      "analogy": {
        "title": "没有口供，就看痕迹",
        "text": "这是帮助理解的类比，不是技术等价：侦探根据前后现场推测中间动作，模型也从视觉变化压出一份<b>潜在动作</b>。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "逐步补上缺失的一格",
          "desc": "按顺序查看观察、差异、潜在表示和可检验结果。你先操作，名称在现象出现之后再揭晓。",
          "componentId": "mod-2-1"
        }
      ],
      "insight": "潜在动作不是隐藏着的真实动作标签，而是从视觉转变中抽出的、等待下游任务检验的表示。",
      "formula": {
        "lead": "形式化只说一件事：视觉序列被压成潜在表示。",
        "unicode": "o₁:T → z ∈ Z",
        "symbols": [
          {
            "sym": "o₁:T",
            "desc": "从第1个到第T个视觉观察。"
          },
          {
            "sym": "z",
            "desc": "由视觉变化得到的潜在动作表示。"
          },
          {
            "sym": "Z",
            "desc": "所有可用潜在表示构成的空间。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎞️",
          "title": "输入",
          "desc": "模型看到的是视觉序列或图像对。"
        },
        {
          "icon": "🧩",
          "title": "中间量",
          "desc": "潜在动作把视觉变化变成可操作表示。"
        },
        {
          "icon": "⚠️",
          "title": "边界",
          "desc": "能重建画面仍不等于懂动作。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "两道审讯：做什么，怎么做？",
      "badge": "both",
      "badgeLabel": "评测逻辑",
      "bridge": "有了潜在表示，还不能直接宣布结案。你需要设计两种互补问题，防止模型只会说动作名或只会拟合轨迹。",
      "analogy": {
        "title": "一份口供，两种追问",
        "text": "会说‘在倒水’是<b>做什么</b>；能还原手臂轨迹是<b>怎么做</b>。两关不能互相冒充。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "应该如何运用两道审讯？",
          "desc": "先观察语义分类与控制回归两幅动态证据，再判断怎样组合两种审讯，避免单项能力替动作理解作证。",
          "componentId": "mod-3-1"
        }
      ],
      "insight": "LARYBench 的关键不是再做一项下游任务，而是把表示里的高层意图与低层动力学拆开询问。",
      "formula": {
        "lead": "同一个潜在空间，要能被两种读取器分别读出类别与动作。",
        "unicode": "f_sem: Z → C　　f_dyn: Z → A",
        "symbols": [
          {
            "sym": "f_sem",
            "desc": "把潜在表示读成动作类别的语义探针。"
          },
          {
            "sym": "C",
            "desc": "动作类别集合。"
          },
          {
            "sym": "f_dyn",
            "desc": "把潜在表示映射到连续控制的回归器。"
          },
          {
            "sym": "A",
            "desc": "数据集对应的动作空间。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🗣️",
          "title": "做什么",
          "desc": "分类测动作语义是否可分。"
        },
        {
          "icon": "🦾",
          "title": "怎么做",
          "desc": "回归测控制轨迹是否可还原。"
        },
        {
          "icon": "⚖️",
          "title": "双轨",
          "desc": "两类证据共同约束结论。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "Probe 出庭：表示里到底藏了什么？",
      "badge": "inf",
      "badgeLabel": "语义证据",
      "bridge": "如果直接训练完整机器人策略，策略可能替表示回答。你会怎样更干净地抽查表示本身？",
      "analogy": {
        "title": "突然抽查脑内笔记",
        "text": "Probe 像老师突然问：‘你脑子里到底学到了什么？’这是帮助理解的类比，不是技术等价。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "为什么要使用 Probe？",
          "desc": "观察冻结表示经过统一读出器的动态过程，再判断 Probe 如何控制变量，以及它仍然保留哪些测量边界。",
          "componentId": "mod-4-1"
        }
      ],
      "insight": "统一读出器减少了策略代答，但 Probe 自己仍有容量，因此它是受控测量，不是万能测谎仪。",
      "takeaways": [
        {
          "icon": "🧪",
          "title": "隔离变量",
          "desc": "尽量少让复杂策略掩盖表示差异。"
        },
        {
          "icon": "🪜",
          "title": "分层动作",
          "desc": "从28类原子机器人动作到人机复合行为。"
        },
        {
          "icon": "🧷",
          "title": "仍有边界",
          "desc": "Probe 的结构和训练也会影响读出结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "轨迹尺：知道动作名还不够",
      "badge": "both",
      "badgeLabel": "控制证据",
      "bridge": "认出‘倒水’只是高层意图。机器人还得知道连续方向、姿态和夹爪状态，才能真正执行。",
      "analogy": {
        "title": "会报菜名，不等于会下锅",
        "text": "这是帮助理解的类比，不是技术等价：动作名只给意图，控制还需要<b>连续轨迹</b>。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "摇杆上的轨迹误差",
          "desc": "操作时间摇杆暂停任意一帧，直接观察预测轨迹、真实轨迹、瞬时距离与平方误差的关系。",
          "componentId": "mod-5-1"
        }
      ],
      "insight": "回归误差越低，说明潜在表示越容易恢复物理控制；但动作空间与切分协议必须一起读。",
      "formula": {
        "lead": "MSE 惩罚预测轨迹与真值轨迹之间的平方距离，数值越低越好。",
        "unicode": "MSE = (1/N) Σᵢ ‖âᵢ − aᵢ‖²",
        "symbols": [
          {
            "sym": "âᵢ",
            "desc": "第i个预测动作或轨迹元素。"
          },
          {
            "sym": "aᵢ",
            "desc": "对应的真实动作或轨迹元素。"
          },
          {
            "sym": "N",
            "desc": "参与平均的元素数量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📏",
          "title": "指标",
          "desc": "控制回归使用 MSE，越低越好。"
        },
        {
          "icon": "🧭",
          "title": "异构空间",
          "desc": "任务保留7、12或16自由度动作。"
        },
        {
          "icon": "🖐️",
          "title": "边界",
          "desc": "RoboCOIN 的灵巧手关节被屏蔽。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "四组嫌疑人：谁带了什么先验？",
      "badge": "trn",
      "badgeLabel": "结构证据",
      "bridge": "比较结果之前，先查清四类模型各自带了什么先验、经过什么瓶颈。履历不是判决，却决定证据该怎样解释。",
      "analogy": {
        "title": "嫌疑人履历不能当判决",
        "text": "General Vision Model 像什么都看、什么都学的通才；Embodied LAM 像专刷机器人题库的学生。类比帮助理解，不代表技术等价。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "点亮模型路径",
          "desc": "选择四种表示范式，再点击结构节点。高亮路径、节点作用与有效配置会同步变化。",
          "componentId": "mod-6-1"
        }
      ],
      "insight": "通用 LAM 把冻结的强视觉骨干接入 LAPA 式训练，但仍可能被量化与动作建模瓶颈限制。",
      "takeaways": [
        {
          "icon": "🧑‍🎓",
          "title": "通才",
          "desc": "通用视觉编码器从大规模视觉预训练获得先验。"
        },
        {
          "icon": "🤖",
          "title": "专才",
          "desc": "具身 LAM 围绕机器人动作数据训练。"
        },
        {
          "icon": "🧱",
          "title": "混合体",
          "desc": "通用 LAM 同时拥有视觉先验和量化瓶颈。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "下注时刻：专才一定赢吗？",
      "badge": "both",
      "badgeLabel": "反直觉实验",
      "bridge": "三组模型已经进入嫌疑人列队，成绩单暂时扣下。现在请你先押注：谁才是真正懂动作的人？",
      "analogy": {
        "title": "这题像期末突袭",
        "text": "专门刷题的人会稳赢吗？<b>别急着背结论，先下注。</b>",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "谁才是真正懂动作的人？",
          "desc": "先选择你预测的赢家，再揭开分类 Accuracy 与控制 MSE。两种指标方向相反，请分别判断。",
          "componentId": "mod-7-1"
        }
      ],
      "insight": "在这套探测协议下，现成通用视觉编码器领先具身 LAM；加入动作瓶颈也没有自动超过原始视觉表示。",
      "takeaways": [
        {
          "icon": "🎲",
          "title": "先预测",
          "desc": "先记录直觉，再用证据修正。"
        },
        {
          "icon": "📊",
          "title": "双指标",
          "desc": "Accuracy 越高越好，MSE 越低越好。"
        },
        {
          "icon": "🚧",
          "title": "别说满",
          "desc": "这是特定基准与读出协议下的排名。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "像素的烟雾：哪里才是动作？",
      "badge": "both",
      "badgeLabel": "因果线索",
      "bridge": "通用视觉赢下这一轮，所以 LAM 就没有价值了吗？先别急着撤案：进入“像素的烟雾”，继续用注意力落点与跨时间稳定性检查 latent 和 pixel 各自保留了什么。",
      "analogy": {
        "title": "别被背景灯光带跑",
        "text": "动作常发生在手与物体接触处。菲比：‘整间屋都亮着，不代表每个角落都有线索。’",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "把注意力移到交互点",
          "desc": "拖动手电光圈检查交互点，再切换模型与 stride。注意力图是诊断线索，跨步长 MSE 才是定量证据。",
          "componentId": "mod-8-1"
        }
      ],
      "insight": "latent-based 表示在论文协议下更贴近控制；LAM 跨跨度更稳，但稳定不等于绝对精度最高。",
      "takeaways": [
        {
          "icon": "🔍",
          "title": "交互落点",
          "desc": "自监督视觉编码器更集中于手与物体交互处。"
        },
        {
          "icon": "⏱️",
          "title": "跨距稳定",
          "desc": "短期亮眼的像素特征可能在长跨度失速。"
        },
        {
          "icon": "🧯",
          "title": "证据等级",
          "desc": "注意力可视化不能单独证明因果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "64页词典，只看第一页？",
      "badge": "trn",
      "badgeLabel": "量化证据",
      "bridge": "通用视觉先验并不自动解决一切。现在检查量化瓶颈：容量、序列长度和潜在维度会不会越大越好？",
      "analogy": {
        "title": "买了64页，只翻第一页",
        "text": "Codebook Collapse 就像买了一本64页词典，最后只看第一页。类比帮助理解，不等同于 VQ 训练动力学。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "调参不许凭体感",
          "desc": "先选择要调查的因素，再调节论文实际测试值。码本利用率、分类 Accuracy 与回归 MSE 会一起更新。",
          "componentId": "mod-9-1"
        }
      ],
      "insight": "容量、利用率与任务性能是非单调关系；论文讨论的设置是多指标折中，不是普遍最优常数。",
      "formula": {
        "lead": "利用率只统计被真正使用过的码字比例；这是帮助读表的定义。",
        "unicode": "U = |{k : count(k)>0}| / K × 100%",
        "symbols": [
          {
            "sym": "U",
            "desc": "码本利用率。"
          },
          {
            "sym": "k",
            "desc": "一个离散码字索引。"
          },
          {
            "sym": "K",
            "desc": "码本总容量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📚",
          "title": "容量",
          "desc": "更大的码本或维度不必然更好。"
        },
        {
          "icon": "🕳️",
          "title": "塌缩",
          "desc": "序列过短或维度不稳会让利用率骤降。"
        },
        {
          "icon": "⚖️",
          "title": "联合判断",
          "desc": "同时看利用率、Accuracy 与 MSE。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "三层复盘：结案前的最后判断",
      "badge": "both",
      "badgeLabel": "结果与边界",
      "bridge": "结案前，把最近三份证据重新对齐：注意力告诉我们模型看向哪里，stride 检查动作信息能保持多久，参数实验提醒我们“大”不等于“懂”。三层都通过，才能按下结案按钮。",
      "analogy": {
        "title": "结案章最怕过度自信",
        "text": "真正的侦探会写边界。真正的论文读者，也会。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "热力图、Stride 与参数：三层结案复盘",
          "desc": "依次完成三道选择题，重新核对注意力诊断、长跨度稳定性和参数权衡。菲比汇总实验结论后，由你亲手完成案件。",
          "componentId": "mod-10-1"
        }
      ],
      "insight": "机器人会模仿，不代表机器人真的理解。LARYBench 做的，就是把‘看起来会’和‘真的懂’分开。",
      "takeaways": [
        {
          "icon": "🧾",
          "title": "可支持结论",
          "desc": "通用视觉先验在本基准中更值得重视。"
        },
        {
          "icon": "🧱",
          "title": "必须带边界",
          "desc": "Probe、标签、数据与动作空间限定外推。"
        },
        {
          "icon": "🍪",
          "title": "现场结案",
          "desc": "糯糯只是睡着，零食被菲比当作‘证物’拿走。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1L3oFBNETg",
      "title": "LARYBench 论文解读：潜在动作表示如何被单独评测",
      "reason": "直接对应本论文，适合复盘双轨评测与反直觉结论。",
      "views": "8.8万播放"
    },
    {
      "bvid": "BV144KPeYE9v",
      "title": "Latent Action Pretraining from Videos 论文速览",
      "reason": "补充 LAPA 背景，帮助理解具身 LAM 与量化动作 token。",
      "views": "5003播放"
    }
  ]
};
