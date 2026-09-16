import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "MOSS-Audio Technical Report",
    "titleZh": "MOSS-Audio 技术报告",
    "venue": "arXiv 2606.01802 · 2026",
    "authors": "Chen Yang, Chufan Yu, Hanfu Chen, Jie Zhu, Jingqi Chen, Ke Chen, Wenxuan Wang, Yang Wang, Yaozhou Jiang, Yi Jiang, Zhengyuan Lin, Ziqi Chen, Zhaoye Fei, Xipeng Qiu",
    "affiliation": "上海创智学院 · MOSI Intelligence · 复旦大学",
    "domain": "音频 · 语音 · 多模态大模型",
    "coreProblem": "复用为 ASR 优化的单一前端会丢掉韵律、说话人与环境声线索，无法支撑统一的音频理解。",
    "coreInsight": "专用音频编码器经模态适配器接入大语言模型解码器；两项核心设计是 DeepStack 跨层特征注入与显式时间标记，使解码器同时获得多粒度声学证据与绝对时间。",
    "keywords": [
      "音频语言模型",
      "DeepStack",
      "时间标记",
      "时间戳 ASR",
      "音频描述"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只用一个为 ASR 优化的单层前端：转写尚可，却丢失韵律、环境声与音乐结构。",
      "componentId": "hero-compare"
    },
    "newMethod": {
      "desc": "MOSS-Audio：编码器-适配器-解码器 + DeepStack 多层注入 + 时间标记，兼顾转写、描述与时间定位。",
      "componentId": "hero-compare"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "引言 · 统一音频理解难题",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "音频里不只有字词，还有说话人、韵律、环境声与音乐结构。本节先看清：为什么只做语音识别的前端不足以支撑统一的音频理解。",
      "analogy": {
        "title": "只听见一层",
        "text": "只从一个位置听，细节会悄悄溜走；真正的音频理解需要同时抓住多种声学线索。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "声学复杂度压力测试",
          "desc": "拖动<b>声学复杂度</b>滑块，观察只保留最终层表征的模型如何逐步丢失非语音线索。",
          "componentId": "c1mod1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "时间推断压力测试",
          "desc": "拖动<b>音频长度</b>，观察没有显式时间线索时，仅靠相对位置推断事件时间会越来越偏。",
          "componentId": "c1mod2"
        }
      ],
      "insight": "音频理解既要抓住多种粒度的声学证据，也要知道事件在何时发生——只靠相对位置推断时间并不可靠。",
      "takeaways": [
        { "icon": "🎧", "title": "统一理解", "desc": "一个模型要同时覆盖语音、环境声与音乐。" },
        { "icon": "⚠️", "title": "前端瓶颈", "desc": "ASR 专用前端只保留词法信息，会丢掉韵律与环境线索。" },
        { "icon": "🔄", "title": "核心循环", "desc": "音频 → 紧凑时间表征 → 自回归文本。" }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "架构 · 音频编码器",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "进入论文的「架构」部分。MOSS-Audio 的专用编码器从零训练而成，最终把声音整理成每秒 12.5 个离散表征——先看它怎样训练，再看它输出什么。",
      "analogy": {
        "title": "把声音变成刻度",
        "text": "就像调音要把连续的声波对准刻度，模型也要把长音频压缩成有节奏的离散表征。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "编码器的多任务训练",
          "desc": "逐步前进，观察共享编码器如何依次用 <b>ASR、AST、音频描述</b>三种任务训练，覆盖的任务越多，表征要兼顾的能力越广。",
          "componentId": "c2mod1"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "帧序列与滑窗注意力",
          "desc": "拖动<b>窗口</b>，观察 12.5 Hz 帧序列上 100 帧的注意力窗口如何滑动——只关注局部，计算量随长度线性增长。",
          "componentId": "c2mod2"
        }
      ],
      "insight": "专用编码器从零训练，能保留说话人、韵律、环境与音乐等更广的声学属性，而非只做语音到词法的映射；受控对比中，它在 36/38 个数据集上错误率低于 AuT。",
      "formula": {
        "lead": "三层 stride-2 卷积把时间轴按固定比例压缩。",
        "unicode": "f_rep = f_base / 8 = 12.5 Hz",
        "symbols": [
          { "sym": "f_base", "desc": "编码器输入的声学特征帧率" },
          { "sym": "f_rep", "desc": "下采样后的音频表征帧率（12.5 Hz）" }
        ]
      },
      "takeaways": [
        { "icon": "🌱", "title": "从零训练", "desc": "在百万小时级多样音频上，用 ASR、AST、音频描述任务从零训练，而非复用现成前端。" },
        { "icon": "⚙️", "title": "紧凑高效", "desc": "约 0.6B 参数、32 层 Transformer、隐藏维度 1280；三层 stride-2 卷积压到 12.5 Hz。" },
        { "icon": "🪟", "title": "滑窗注意力", "desc": "限制在 100 帧（8 秒），使计算随长度线性扩展、显著降低内存，并支持实时 KV-cache，长程语义交给语言模型。" }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "架构 · 跨层特征注入",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "编码器已经有了 12.5 Hz 表征。但只用最后一层够吗？本节揭示为什么单一末层会丢掉细节，以及多粒度表征的必要性。",
      "analogy": {
        "title": "多听几层",
        "text": "只留主音会丢掉音色与质感，多保留几层泛音才能听出细节。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "末层 vs 多层",
          "desc": "点击<b>开始对比</b>，两侧同步推进，比较末层表征与多层注入的线索保留。",
          "componentId": "c3mod1"
        }
      ],
      "insight": "把多个编码器深度的特征都暴露给解码器，能补回被末层冲淡的声学证据。",
      "takeaways": [
        { "icon": "📶", "title": "分层分工", "desc": "已有层分析显示：低/中层集中声学与说话人线索，深层偏向语义；多层组合在多种语音任务上稳定优于仅用末层。" },
        { "icon": "🚧", "title": "末层瓶颈", "desc": "单一末层无法覆盖全部粒度。" },
        { "icon": "🔍", "title": "多粒度视图", "desc": "DeepStack 让解码器看到多层编码器特征。" }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "架构 · DeepStack 实现",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "上一节说明了为什么需要多层。本节看 DeepStack 具体如何把多层特征注入解码器。",
      "analogy": {
        "title": "叠加声部",
        "text": "主声部之外再叠加其他声部，整体层次才完整；DeepStack 就是给解码器叠加多层声学声部。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "DeepStack 架构地图",
          "desc": "点击编码器层或适配器，查看它注入解码器的<b>路径与作用</b>。",
          "componentId": "c4mod1"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "DeepStack 开关消融",
          "desc": "切换“仅末层”与“DeepStack”，比较 MECAT-Caption 各场景的 DATE 分数。",
          "componentId": "c4mod2"
        }
      ],
      "insight": "不增大编码器，也能让解码器获得多粒度的声学证据。",
      "takeaways": [
        { "icon": "🔀", "title": "两条路径", "desc": "主适配器投影末层，合并适配器聚合中间层。" },
        { "icon": "🧱", "title": "同一投影", "desc": "两者都用 GatedMLP，注入解码器早期层。" },
        { "icon": "📉", "title": "消融权衡", "desc": "非语音场景提升、语音略降，整体更好。" }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "架构 · 时间感知建模",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "bridge": "架构还有一项关键设计：让模型知道时间。本节介绍第二个核心设计——显式时间标记。",
      "analogy": {
        "title": "每隔两秒落一格",
        "text": "显式的刻度比靠相对位置猜时间更可靠，尤其在长音频里。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "时间标记插入",
          "desc": "逐步前进，观察每 <b>25 个音频特征</b>后插入一个秒数标记。",
          "componentId": "c5mod1"
        }
      ],
      "insight": "把时间标记放进音频 token 流，模型就能在生成时直接给出时间戳；MOSS-Audio-8B 在时间戳 ASR 上 AAS 仅 35.77ms（中文 AISHELL-1）、131.61ms（英文 LibriSpeech），远低于基线。",
      "formula": {
        "lead": "标记间隔由表征帧率决定。",
        "unicode": "标记间隔 = 25 帧 / 12.5 Hz = 2 秒",
        "symbols": [
          { "sym": "25", "desc": "两次时间标记之间的音频特征数" }
        ]
      },
      "takeaways": [
        { "icon": "📌", "title": "显式标记", "desc": "每 25 个特征插入一个秒数标记。" },
        { "icon": "⏲️", "title": "两秒一格", "desc": "12.5 Hz 下 25 帧正好是 2 秒。" },
        { "icon": "🕐", "title": "绝对时间", "desc": "时间进入上下文，支持时间戳生成与定位。" }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "数据管道",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "架构讲完，转向数据。对每段录音统一套用同一种描述、或用固定窗口粗暴切分，会切断完整声学事件并引入重复与幻觉。MOSS-Audio 用帧级 SED（BEATs）按自然事件边界切分，映射到 9 类粗粒度，再分支标注并合并。",
      "analogy": {
        "title": "先分后合",
        "text": "先把不同声部分别记清楚，再合成一段统一描述，信息才既不重复也不遗漏。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "数据管道全流程",
          "desc": "逐步前进，观察事件切分、9 类分类画像、三分支标注到描述合并的完整数据管道。",
          "componentId": "c6mod1"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "ASR 与强制对齐",
          "desc": "逐步前进，观察多 ASR 集成如何经 WER 一致性筛选，再由强制对齐生成词级与句级时间戳。",
          "componentId": "c6mod2"
        }
      ],
      "insight": "内容自适应的分支标注让统一描述既不重复也不遗漏；保留的中间标注还能构造面向任务的 SFT 数据，支撑百万小时级规模。",
      "takeaways": [
        { "icon": "✂️", "title": "事件切分", "desc": "用帧级 SED 按自然事件边界切分（>60s 非语音不参与），映射到 9 类粗粒度。" },
        { "icon": "🧩", "title": "分而合之", "desc": "三分支标注经 Router-R1 先验路由后合成统一描述，减少幻觉与冗余。" },
        { "icon": "📈", "title": "数据规模", "desc": "产出百万小时级标注数据，中间标注还能构造任务型 SFT 数据。" }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "预训练",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "数据管道之后是训练。预训练分三组目标——ASR 相关（普通 / 词级时间戳 / 句级时间戳 ASR）、音频描述、纯文本语言建模；如果只用音频数据，解码器的通用语言能力会退化。",
      "analogy": {
        "title": "练习配比",
        "text": "不同的练习配比会练出不同的能力，音频对齐需要 ASR、描述和语言能力一起练。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "预训练配比",
          "desc": "拖动 <b>ASR 占比</b>，观察剩余两类按比例变化，以及对齐与语言能力条的变化。",
          "componentId": "c7mod1"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "两阶段预训练",
          "desc": "逐步前进，比较第一阶段（只训适配器 + DeepStack）与第二阶段（全参数端到端）分别训练哪些模块、用哪些数据。",
          "componentId": "c7mod2"
        }
      ],
      "insight": "混合纯文本能防止音频训练把通用语言能力带偏。",
      "formula": {
        "lead": "三组目标的默认采样比例。",
        "unicode": "p_ASR : p_cap : p_text = 30 : 40 : 30",
        "symbols": [
          { "sym": "p_ASR", "desc": "ASR 相关任务在预训练中的采样比例" }
        ]
      },
      "takeaways": [
        { "icon": "⚖️", "title": "默认配比", "desc": "30% ASR / 40% 描述 / 30% 文本；ASR 组含普通、词级、句级时间戳 ASR。" },
        { "icon": "📊", "title": "规模与混合", "desc": "约 1.2T token；数据集按平方根（√size）混合，避免大数据集独占。" },
        { "icon": "🪜", "title": "两阶段", "desc": "阶段一只训适配器 + DeepStack（不含纯文本）；阶段二全参数端到端并启用纯文本。" }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "后训练",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "预训练之后是后训练，分三阶段：SFT 用音频问答/描述/ASR/自我认知数据适配指令；推理冷启动用音频推理 + 纯文本推理数据初始化思维；DAPO 用在线采样与奖励优化提升鲁棒性。",
      "analogy": {
        "title": "反复练习",
        "text": "像练习一样，先模仿、再自己摸索，水平才会稳定提升。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "分阶段后训练",
          "desc": "逐步前进，观察 <b>SFT → 推理冷启动 → DAPO</b> 三段后训练如何依次推进，以及 DAPO 的奖励提升。",
          "componentId": "c8mod1"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "DAPO 强化学习",
          "desc": "逐步前进，观察 <b>采样打分 → 动态过滤 → 裁剪更新</b>，以及 DAPO 的关键超参数。",
          "componentId": "c8mod2"
        }
      ],
      "insight": "DAPO 的在线采样 + 奖励优化让模型超越固定推理模板，提升在多样音频问题上的鲁棒性。",
      "takeaways": [
        { "icon": "🪜", "title": "SFT 配方", "desc": "音频问答 + 描述 + ASR/时间戳 ASR + 自我认知数据，适配指令格式。" },
        { "icon": "🧠", "title": "推理冷启动", "desc": "音频推理 + 纯文本推理数据，先初始化稳定的思维模式。" },
        { "icon": "📉", "title": "DAPO", "desc": "动态过滤 + 裁剪目标（ε=0.2/0.28），奖励从 0.69 升至 0.82。" }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "评估 · 时间对齐与推理",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "bridge": "架构、数据与训练都讲完了，最后是评估。先看如何度量时间对齐，再看模型怎样把理解变成文字。",
      "analogy": {
        "title": "对准刻度",
        "text": "时间对齐就是让每个音符落在它该在的刻度上，偏移越小越好。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "AAS 误差计算器",
          "desc": "拖动<b>整体偏移</b>，观察每个时间戳的绝对误差与 AAS 平均值如何变化。",
          "componentId": "c9mod1"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "自回归生成步进",
          "desc": "逐步前进，观察解码器每次只生成一个 <b>token</b>，并把它拼回上下文。",
          "componentId": "c9mod2"
        }
      ],
      "insight": "AAS 让“何时发生”可量化，统一的自回归生成让转写、描述、问答与时间戳共用一个接口。",
      "formula": {
        "lead": "对所有时间戳槽位取预测与参考之差的绝对值再平均。",
        "unicode": "AAS = (1/N) Σᵢ |t̂ᵢ − tᵢ|",
        "symbols": [
          { "sym": "N", "desc": "时间戳槽位总数" },
          { "sym": "t̂ᵢ", "desc": "第 i 个预测时间戳" },
          { "sym": "tᵢ", "desc": "第 i 个参考时间戳" }
        ]
      },
      "takeaways": [
        { "icon": "📏", "title": "度量目标", "desc": "AAS 衡量时间戳平均绝对偏移，越低越好。" },
        { "icon": "🕐", "title": "时间证据", "desc": "MOSS-Audio-8B 时间戳 ASR 的 AAS 仅 35.77ms（中）/131.61ms（英），远低于基线。" },
        { "icon": "🧩", "title": "统一接口", "desc": "一个自回归接口覆盖转写、描述、问答与时间戳。" }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "评估 · 结果与结论",
      "badge": "both",
      "badgeLabel": "基础+进阶",
      "bridge": "从引言到评估，我们已经走完全程。最后一节回到实证并收束全篇：这些设计带来了怎样的结果，整体结论又是什么。",
      "analogy": {
        "title": "两版对比",
        "text": "把不同方法放在同一基线上比较，才能看出真实差距。",
        "componentId": "music-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果与协议",
          "desc": "选择任务，查看它的数据集、维度、指标方向，以及 MOSS-Audio 与基线的结果对比。",
          "componentId": "c10mod1"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "全篇总结",
          "desc": "逐步前进，沿因果链回顾全篇：问题 → 架构 → 数据管道 → 训练 → 结果。",
          "componentId": "c10mod2"
        }
      ],
      "insight": "从修复多粒度与时间线索，到事件保持的数据管道与分阶段训练，MOSS-Audio 把理解、转写、时间定位与推理统一在一个模型族里，Thinking 偏推理、Instruct 偏直接执行，定位为面向未来语音智能体的理解基础。",
      "takeaways": [
        { "icon": "🏆", "title": "通用理解", "desc": "发布 4B/8B 的 Instruct 与 Thinking 四个变体；8B-Thinking 在 MMAU/MMAU-Pro/MMAR/MMSU 平均 71.08（开源最佳）。" },
        { "icon": "🎙️", "title": "语音任务", "desc": "语音描述（13 维度均分 3.7252）与 ASR（12 维度平均 CER 11.30）由 Instruct 变体领先。" },
        { "icon": "⚠️", "title": "注意协议", "desc": "四个任务组各有数据集与指标方向；闭源模型仍强，比较时须对齐协议。" }
      ]
    }
  ]
};
