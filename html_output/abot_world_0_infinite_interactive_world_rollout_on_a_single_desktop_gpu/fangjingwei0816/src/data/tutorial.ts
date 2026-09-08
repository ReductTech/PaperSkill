import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Infinite Interactive World Rollout on a Single Desktop GPU",
    "titleZh": "单张桌面 GPU 上的无限交互世界推演",
    "venue": "AMAP CV Lab | Alibaba Group Technical Report · 2026",
    "authors": "ABot-World Team",
    "affiliation": "AMAP CV Lab · Alibaba Group",
    "domain": "动作条件视频世界模型 · 因果生成 · 单卡部署",
    "coreProblem": "漂亮的短视频并不等于可进入的世界：动作控制、长时漂移、响应延迟、吞吐和显存必须在闭环里同时成立。",
    "coreInsight": "用统一键盘动作连接数据与推理，以双向教师逐步蒸馏因果学生，再用 LongForcing 和整栈优化覆盖长滚动与单卡实时部署。",
    "keywords": [
      "ABot-World-0",
      "LongForcing",
      "动作条件",
      "世界模型",
      "RTX 5090"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "短片生成关注一次成片；进入交互闭环后，模型必须持续接收动作，并承受自己的历史输出。"
    },
    "newMethod": {
      "desc": "ABot-World-0 同时设计数据、动作条件、长时训练与流式部署，把高质量视频模型转成可在线控制的世界模型。"
    },
    "pillars": [
      { "index": "01", "title": "动作控制与身份记忆", "desc": "键盘决定怎么动，参考角色记忆回答是谁。" },
      { "index": "02", "title": "三源数据体系", "desc": "游戏、仿真与互联网视频提供互补的控制监督与视觉多样性。" },
      { "index": "03", "title": "渐进式学生蒸馏", "desc": "Teacher Forcing → ODE Distillation → LongForcing。" },
      { "index": "04", "title": "单卡流式部署", "desc": "LightVAE、低比特 DiT、Fast-RoPE、缓存与调度共同工作。" }
    ],
    "metrics": [
      { "value": "约 16 FPS", "label": "优化低比特运行包络上沿" },
      { "value": "1.2 s", "label": "动作到首个解码响应帧" },
      { "value": "约 19 GiB", "label": "峰值显存预算" }
    ],
    "conditions": "论文报告条件：单张 NVIDIA RTX 5090，1280×704（720P），batch size 1，块式流式推理；不同指标来自论文所述运行包络，并非任意配置都同时达到。"
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "从短片到可进入的世界",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "先抓住最根本的变化：普通视频生成在输出完成后结束；交互世界会把刚生成的结果写回历史，再根据下一次动作继续生成。",
      "analogy": {
        "title": "不是把视频简单拉长",
        "text": "一次性生成的终点，在交互世界里恰好是下一轮的起点。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "一次生成 vs 持续交互",
          "desc": "切换两种状态，观察普通视频生成在哪里结束，以及 A、B 如何被写回 History 并成为下一轮输入。",
          componentId: "chapter-one-loop-compare"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "数据如何教会模型‘听指挥’",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "闭环需要可靠动作，也需要足够多样的世界。接下来比较游戏、仿真和互联网视频各自提供了什么，又牺牲了什么。",
      "analogy": {
        "title": "三种素材，各补一块",
        "text": "游戏给出精确按键，仿真能设计轨迹，互联网视频带来真实多样性。它们不能互换，却能在同一标注格式里互补。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "三种来源，如何拼成一套训练数据",
          "desc": "点击游戏、仿真或互联网视频，先看它最擅长提供什么、仍缺少什么，再沿统一流水线追踪数据如何进入模型。",
          componentId: "chapter-two-data-sources"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "八个按键如何进入视频 token",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "本节追踪两条独立条件路径：按键怎样合成动作指令并进入视频表示，参考图像怎样提供稳定的身份信息。",
      "analogy": {
        "title": "方向提示与演员照片不是一回事",
        "text": "按键告诉镜头下一步怎么动；参考角色记忆告诉模型“这个人应该长什么样”。运动与身份进入不同通道。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "两条条件路径，各自解决什么",
          "desc": "切换两条路径，分别观察按键如何改变下一段视频，以及身份记忆为何只读不写。",
          componentId: "chapter-three-action-identity"
        }
      ],
      integratedModules: [
        {
          kind: "module",
          "id": "3.2",
          "title": "身份记忆交互",
          "desc": "该交互已集成在 3.1 的 Identity Memory 标签页中，不重复渲染。",
          componentId: "chapter-three-action-identity"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "为什么模型会“越滚越偏”？",
      "badge": "both",
      "badgeLabel": "共同核心",
      "bridge": "第一次的小偏差不会自动消失：模型把新画面写回 History 后，下一轮还会继续读取它。部署越久，自生成内容越可能把后续画面带偏。",
      "analogy": {
        "title": "只看已经拍到的，再决定下一段",
        "text": "在线生成不能偷看未来画面。模型只能使用已有历史、下一段动作和条件，逐块把世界往前推。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "同一个角色，为什么会越生成越奇怪？",
          "desc": "先看角色和背景怎样逐渐跑偏，再顺着一条因果链理解：生成结果写回历史后，小误差也会被下一轮继续读取。",
          componentId: "causal-longforcing-core"
        }
      ],
      "formula": {
        "lead": "<strong>用公式写出来：模型只能看过去，再预测下一块。</strong>",
        "unicode": "pθ(vₜ:ₜ₊L₋₁ | v₀:ₜ₋₁, aₜ:ₜ₊L₋₁, c)<span class=\"chap4-formula-notes\"><span><b>v₀:ₜ₋₁</b> 历史视频</span><span><b>aₜ:ₜ₊L₋₁</b> 当前动作</span><span><b>c</b> 其他条件</span><span><b>vₜ:ₜ₊L₋₁</b> 下一视频块</span></span>",
        "symbols": [
          {
            "sym": "vₜ:ₜ₊L₋₁",
            "desc": "模型要预测的下一视频块。"
          },
          {
            "sym": "v₀:ₜ₋₁",
            "desc": "模型已经观察到的视频历史。"
          },
          {
            "sym": "aₜ:ₜ₊L₋₁",
            "desc": "下一视频块对应的动作序列。"
          },
          {
            "sym": "c",
            "desc": "文本提示与参考图像等多模态条件。"
          },
          {
            "sym": "L",
            "desc": "一次预测的未来视频块长度。"
          }
        ]
      },
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "为什么先训练双向教师",
      "badge": "both",
      "badgeLabel": "共同核心",
      "bridge": "最终部署需要只能读取过去的因果学生；本章先回答为什么还要训练一个能够利用完整时域上下文的双向教师。",
      "analogy": {
        "title": "完整分镜与现场跟拍",
        "text": "双向教师像先看完整分镜，容易保持全局一致；因果学生像现场跟拍，只能根据已经发生的画面继续。后者才能实时交互。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "同一时间轴，两种信息权限",
          "desc": "选择当前时间点，直接比较双向教师的完整时域注意力与因果学生被 Mask 的未来区域。",
          componentId: "chapter-five-teacher-student"
        }
      ],
      "formula": {
        "lead": "两者预测视频，但条件集合不同。",
        "unicode": "pᵇⁱ_ϕ(v₁:T | v₀,a₁:T,c) → pᶜᵃᵘˢᵃˡ_θ(vₜ:ₜ₊L₋₁ | v₀:ₜ₋₁,aₜ:ₜ₊L₋₁,c)",
        "symbols": [
          {
            "sym": "T",
            "desc": "双向教师共同建模的完整时域。"
          },
          {
            "sym": "ϕ",
            "desc": "双向教师参数。"
          },
          {
            "sym": "θ",
            "desc": "因果学生参数。"
          }
        ]
      },
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "三步让模型能上线、跑得快、跑得久",
      "badge": "inf",
      "badgeLabel": "推理流程",
      "bridge": "最终模型要同时满足三件事：能够只看过去在线生成，每段视频算得足够快，并且适应长时间运行时不断增加的自生成历史。",
      "analogy": {
        "title": "先学现场规则，再压缩动作，最后练长镜头",
        "text": "第一阶段改信息权限，第二阶段压缩去噪，第三阶段专门面对长时间自反馈。顺序不能随意互换。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "三步闯关：先上线，再加速，最后练长跑",
          "desc": "从总览进入三个阶段，分别看懂它们为什么解决“能上线”“跑得快”和“跑得久”三个不同问题。",
          componentId: "chapter-six-distillation-stages"
        }
      ],
      "formula": {
        "lead": "ODE 蒸馏把同一因果轨迹上的中间噪声潜变量映射到干净终点。",
        "unicode": "zᶜ₀ = Φθc,s→0(zᶜₛ; Cₜ); L_ODE = E ||fθ(zᶜₛ,s,Cₜ) − sg(zᶜ₀)||²₂",
        "symbols": [
          {
            "sym": "Cₜ",
            "desc": "部署时可用的因果条件集合。"
          },
          {
            "sym": "Φ",
            "desc": "Stage 1 因果模型的概率流 ODE 积分。"
          },
          {
            "sym": "sg",
            "desc": "停止梯度操作。"
          },
          {
            "sym": "zᶜ₀",
            "desc": "同一因果轨迹的干净终点。"
          }
        ]
      },
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "LongForcing：长期生成为什么更稳定？",
      "badge": "trn",
      "badgeLabel": "训练进阶",
      "bridge": "本节不再继续讲 LongForcing 的训练方法，而是通过论文中的 60 秒 rollout 实验，检验它是否真的能减缓长期生成中的质量退化，并说明这组实验能证明什么、不能证明什么。",
      "analogy": {
        "title": "偏差往往在后半程才显形",
        "text": "每一段小误差都会进入下一段输入。短时训练里不明显的偏差，到了长镜头后半程会累积成饱和、模糊或重复。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "60 秒 Rollout：LongForcing 如何减缓质量退化",
          "desc": "Causal-Forcing-style 基线（下文简称‘因果基线’）。下面这张图只看一件事：视频越生成越长时，因果基线和 LongForcing 谁退化得更快？",
          componentId: "longforcing-evidence"
        }
      ],
      "insight": "LongForcing 不是让模型一帧不差地模仿老师，而是让它在长时间自己生成时，也尽量保持更稳定的整体趋势。",
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-8",
      "title": "动作、记忆与流式架构怎样连起来",
      "badge": "trn",
      "badgeLabel": "结构进阶",
      "bridge": "现在才展开完整结构：动作、身份、因果生成、上下文缓存和解码各走不同路径。点击节点，检查哪些连接是论文允许的。",
      "analogy": {
        "title": "机身上每个部件只解决一类问题",
        "text": "控制适配器负责动作，参考记忆负责身份，因果 DiT 负责下一块，缓存与解码器负责持续输出。把它们混成一个“魔法模块”会丢掉设计边界。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "8.1",
          "title": "三条路，最后都汇到视频生成模型",
          "desc": "动作告诉模型怎么动，身份告诉模型是谁，运行系统负责把生成的视频持续输出。",
          componentId: "chapter-eight-architecture"
        }
      ],
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-9",
      "title": "一张显卡，怎么从‘跑不起来’做到接近16 FPS？",
      "badge": "trn",
      "badgeLabel": "部署进阶",
      "bridge": "先解决显存，再提高速度，最后逼近实时运行。",
      "analogy": {
        "title": "轻一个部件，不等于整套设备就能跑",
        "text": "注意力更快仍可能爆显存。论文的实时结果来自解码器、精度、位置编码和调度共同改变整机瓶颈。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "9.1",
          "title": "四级优化阶梯：从 OOM 到接近16 FPS",
          "desc": "点击四级阶梯，看整套系统怎样从显存溢出，逐步进入可运行区间并提高到 15.831 FPS。",
          componentId: "deployment-tradeoffs"
        }
      ],
      "insight": "单卡实时不是靠某一个‘神奇加速器’，<br>而是多个地方一起省显存、减计算，最后才把模型推到接近16 FPS。<br><small>完整优化涉及解码器、低比特计算、位置编码、注意力、缓存与调度。</small>",
      "takeaways": []
    },
    {
      kind: "chapter",
      "id": "chap-10",
      "title": "结果、边界与下一步",
      "badge": "both",
      "badgeLabel": "共同结论",
      "bridge": "最后只回答两个问题：结果是否有竞争力，以及整套方案的价值在哪里。",
      "analogy": {
        "title": "完成长镜头，也要看评分规则",
        "text": "控制、画质、物理与记忆是不同考题。一个总冠军标签会掩盖模型在哪些指标领先、又在哪些指标仍有差距。",
        componentId: "life-scene"
      },
      "modules": [
        {
          kind: "module",
          "id": "10.1",
          "title": "结果先看一句话：有竞争力，但不是全面第一",
          "desc": "切换 Strict Acc.、Aesthetic 与 Memory，直接查看论文 Table 3 的真实结果。",
          componentId: "benchmark-race"
        }
      ],
      "insight": "ABot-World-0 的核心价值，不是某个模块单独取胜，<br>而是把数据、控制、长时训练与单卡部署连成了一套完整方案。",
      "takeaways": []
    }
  ]
};
