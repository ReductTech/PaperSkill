import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "VLM3: Vision Language Models Are Native 3D Learners",
    titleZh: "VLM3：视觉语言模型天生就是三维学习者",
    venue: "arXiv 2026",
    authors: "Zhipeng Cai, Zhuang Liu, Yunyang Xiong, Zechun Liu, Vikas Chandra, Yangyang Shi",
    affiliation: "Meta / Princeton",
    domain: "VLM · 三维视觉 · 深度/位姿/对应",
    coreProblem: "三维理解长期依赖带有复杂任务特定设计的专家视觉模型；标准 VLM 在细粒度 3D 上仍显吃力。",
    coreInsight: "<strong>VLM 天生就是三维学习者。</strong>VLM3 让标准 VLM 以最简、可扩展的方式掌握多样细粒度 3D，性能匹敌专家模型。",
    keywords: [
      "VLM3",
      "简单可扩展",
      "细粒度3D"
    ]
  },
  hero: {
    oldMethod: {
      desc: "切任务 → 中间模块整栈重建",
      componentId: "hero-old"
    },
    newMethod: {
      desc: "三步固定 · 只换提示",
      componentId: "hero-new"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "专家很强却很重，VLM 细粒度仍难",
      badge: "inf",
      badgeLabel: "推理",
      bridge: "三维理解长期靠专家视觉模型：精度高，但任务特定设计复杂。标准 VLM 语义强，细粒度 3D 却仍吃力——因此作者希望设计出能够学习多样化的3D任务，且精度高的 VLM。",
      analogy: {
        title: "两难之间的第三条路",
        text: "专家像<strong>重型专用仪器</strong>（准但重）；普通 VLM 像<strong>轻量泛用设备</strong>（轻但测不准）。论文则主张：给标准 VLM 对的条件，它就能学多样 3D。",
        componentId: "ana-1"
      },
      insight: "关键论点：VLMs are native 3D learners。VLM3 让标准 VLM 学多样化 3D 任务，并达到专家视觉模型的精度。",
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "能力图：专家 / 标准VLM / VLM3",
          desc: "",
          componentId: "ch1mod1"
        }
      ],
      takeaways: [
        {
          icon: "🧱",
          title: "专家",
          desc: "细粒度 3D 强，设计沉重。"
        },
        {
          icon: "🪟",
          title: "标准 VLM",
          desc: "简洁，细粒度 3D 弱。"
        },
        {
          icon: "✨",
          title: "VLM3",
          desc: "多样细粒度 3D 接近专家，且简洁可扩展。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "相关工作：专家很重，VLM 已在探索",
      badge: "inf",
      badgeLabel: "相关工作",
      bridge: "论文 Related Work：专家视觉模型靠任务特定设计堆出精度，但架构、损失与增强都极重；同时已有工作用 VLM 做三维理解——尤其是 DepthLM 表明标准 VLM 能学像素级深度，直接启发了 VLM3。",
      analogy: {
        title: "专家视觉模型：设计为何复杂",
        text: "专家精度高，但代价是<strong>任务特定设计层层叠加</strong>：预训练编码器配<strong>多解码器与任务路由</strong>（DPT / FPN / GP 等）；多预测头带来 <strong>MSE、L1、certainty、clipped L2</strong> 等损失，还需为不同任务<strong>调权平衡</strong>；此外还常依赖几何与光度的<strong>重数据增强</strong>。复杂度不只在「用了什么」，更在「叠了多少层、调了多少权」。",
        componentId: "ana-2"
      },
      insight: "小结：专家视觉模型靠任务特定设计做强 3D，但很重；已有 VLM 工作从物体级试到 DepthLM 像素深度——启发本文用更简单、可扩展的方式，让标准 VLM 覆盖多样细粒度 3D。为了实现这个目标，本文提出了3个核心要素：统一焦距、文本像素引用与数据配比与规模。",
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "VLM 探索如何启发本文",
          desc: "物体级试水 → 细粒度深度（DepthLM）→ 启发更简、更广的 VLM3。",
          componentId: "ch2mod1"
        }
      ],
      takeaways: [
        {
          icon: "🧭",
          title: "物体级起步",
          desc: "已有 VLM-3D 工作多偏物体/场景级，且常需额外模块。"
        },
        {
          icon: "📐",
          title: "DepthLM 关键口",
          desc: "标准 VLM 首次以接近专家的精度学像素级度量深度。"
        },
        {
          icon: "💡",
          title: "启发 VLM3",
          desc: "扩大任务广度与研究深度：去掉任务特定设计，仍要匹配专家精度。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "关键要素①：焦距统一",
      badge: "inf",
      badgeLabel: "方法 §3.1",
      bridge: "进入方法：与 DepthLM 相同，用图像缩放把有效焦距统一到 1000px，解决相机歧义，且无需为物体级空间推理另加编码器。未知内参时，先用单图标定模型估焦，再统一。",
      analogy: {
        title: "先把窗框缩到同一把尺",
        text: "不同相机像不同窗洞；按 <strong>s = 1000 / f</strong> 缩放，使有效焦距落到 1000px，混数据才公平。",
        componentId: "ana-3"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "缩放使有效 f→1000",
          desc: "拖动原始焦距，观察 s=1000/f 与画幅变化。",
          componentId: "ch4mod2"
        }
      ],
      formula: {
        lead: "",
        unicode: "s = 1000 / f ,   I′ = resize(I, s)",
        symbols: [
          { sym: "s", desc: "缩放比例（使有效焦距变为 1000 像素）" },
          { sym: "f", desc: "原始焦距（像素）" },
          { sym: "I", desc: "输入图像" },
          { sym: "I′", desc: "统一焦距后的图像" }
        ]
      },
      takeaways: [
        {
          icon: "📷",
          title: "消相机歧义",
          desc: "内参不同会扭曲几何阅读；统一后再混训。"
        },
        {
          icon: "🧩",
          title: "兼容标准 VLM",
          desc: "不改架构，前后训练流程保持简单。"
        },
        {
          icon: "🛠️",
          title: "未知内参",
          desc: "先单图标定估焦，再统一（物体级实验即如此）。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "关键要素②：文本像素引用",
      badge: "both",
      badgeLabel: "方法 §3.1",
      bridge: "DepthLM 用图像上渲染的视觉标记指点，同图多问需复制多张图，也难支持「输出也是像素」的任务。VLM3 把横纵坐标归一到 [0,2000)，用文本引用；归一化后精度可媲美视觉标记，且可同图打包多 QA。",
      analogy: {
        title: "在玻璃上写下格子号",
        text: "坐标归一到 <b>[0,2000)</b>——用文字指点，而不是在像素上盖印；一张图可贴多条问句。",
        componentId: "ana-4"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "拖点生成 [0,2000) 文本坐标",
          desc: "对比视觉标记：文本坐标即可指像素。",
          componentId: "ch4mod1"
        },
        {
          kind: "module",
          id: "4.2",
          title: "同图打包多 QA",
          desc: "调节问答数：视觉标记要复制图，将渲染标记设置在不同位置；文本引用几乎不增图像成本。",
          componentId: "ch6mod1"
        }
      ],
      formula: {
        lead: "",
        unicode: "c = ⌊x / W × 2000⌋ ∈ [0, 2000)",
        symbols: [
          { sym: "x", desc: "像素坐标" },
          { sym: "W", desc: "对应边图像尺寸" },
          { sym: "c", desc: "文本坐标" }
        ]
      },
      insight: "归一化像素空间后，文本引用对粗粒度区域与细粒度像素都有效；深度上可每样本打包约 10 个标注像素。",
      takeaways: [
        {
          icon: "📝",
          title: "替代视觉标记",
          desc: "不必为每个问点重渲 marker 图。"
        },
        {
          icon: "📦",
          title: "同图多问",
          desc: "一次编码服务多条 QA，算力更省、规模可更大。"
        },
        {
          icon: "🔗",
          title: "任务通用",
          desc: "物体 bbox、对应点对都可写成同一套文本坐标。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "关键要素③：数据配比与规模",
      badge: "trn",
      badgeLabel: "方法 §3.1",
      bridge: "相机歧义与像素引用一旦解决，放大数据就足以让标准 VLM 学准 3D；复杂任务特定设计并非必要条件。多源体量悬殊时，均匀抽样易过拟合小集——需按规模加权，配比几乎决定上限。",
      analogy: {
        title: "相册要按来源配比抽",
        text: "均匀乱抽不如<strong>按数据源加权</strong>；小而简单的集权重要压低，否则大参数 VLM 很快背下来。",
        componentId: "ana-9"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "数据集加权对照",
          desc: "均匀 / size-based / VLM3 配比 → δ1（条件固定：32M samples + 10 QA）。",
          componentId: "ch9mod1"
        }
      ],
      takeaways: [
        {
          icon: "⚖️",
          title: "配比影响大",
          desc: "Table 3：均匀 0.842 / size-based 0.884 / VLM3 0.904。"
        },
        {
          icon: "📈",
          title: "规模优先",
          desc: "消歧义+可引用后，放大与混合比堆架构更关键。"
        },
        {
          icon: "📚",
          title: "多源混合",
          desc: "Taskonomy、HM3d、Argoverse2、Internal 等需非均匀权重。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "启用任务①②：度量深度与物体级三维",
      badge: "both",
      badgeLabel: "方法 §3.2",
      bridge: "接下来，为验证VLM3的通用性，论文选择了4个主流的、具有足够多样性的3D理解任务。单视两类任务共用同一套文本接口。深度：沿用 DepthLM，估计查询像素到相机的距离，文本像素引用并每图打包 10 QA，数据扩至约 32M samples。物体级：对齐 SpatialRGPT（定性+定量），用文本 bbox 引用物体、去掉额外区域编码器；无内参时先单图标定再统一焦距。",
      analogy: {
        title: "一点多远，一框几何",
        text: "深度问<strong>像素到相机多远</strong>；物体问<strong>框内几何关系</strong>——都写成 [0,2000) 文本，不必视觉标记或 mask 编码器。",
        componentId: "ana-6"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "深度：文本坐标 → 米制读数",
          desc: "拖动查询点：文本坐标与到相机距离同步变化。",
          componentId: "ch6depth"
        },
        {
          kind: "module",
          id: "6.2",
          title: "物体：bbox 文本引用",
          desc: "切换定性/定量问题设置，观察文本框引用与输出如何变化。",
          componentId: "ch6object"
        }
      ],
      formula: {
        lead: "",
        unicode: "bbox = (xMin, yMin, xMax, yMax) ⊂ [0, 2000)",
        symbols: [
          { sym: "bbox", desc: "物体区域的文本框表示" },
          { sym: "xMin", desc: "左上角横坐标（归一到 [0,2000)）" },
          { sym: "yMin", desc: "左上角纵坐标（归一到 [0,2000)）" },
          { sym: "xMax", desc: "右下角横坐标（归一到 [0,2000)）" },
          { sym: "yMax", desc: "右下角纵坐标（归一到 [0,2000)）" }
        ]
      },
      insight: "深度侧靠文本点引用 + 打包放大标注；物体侧靠文本框替代 SpatialRGPT 的额外编码器——都是「只换提示、不改骨干」。",
      takeaways: [
        {
          icon: "📍",
          title: "度量深度",
          desc: "像素→相机米制距离；约 10 QA/图、32M samples。"
        },
        {
          icon: "📦",
          title: "文本 bbox",
          desc: "定性+定量共用框坐标，去掉区域编码器。"
        },
        {
          icon: "🛠️",
          title: "未知内参",
          desc: "物体级互联网图可先标定再 f→1000。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "启用任务③④：对应与位姿",
      badge: "both",
      badgeLabel: "方法 §3.2",
      bridge: "像素对应：左图像素 → 右图像素，查询与答案皆为文本坐标；约 10M 对、按体量加权，训练可打包多 QA。相机位姿：两视图输入，用文本输出平移距离、平移方向单位向量、yaw-pitch-roll；同一样本打包三问。标准下一词预测即可——回归头并非必要。",
      analogy: {
        title: "对应画线，位姿读成句子",
        text: "匹配点写成 <strong>(x,y)→(x′,y′)</strong>；位姿写成距离/方向/姿态角句子。即使是作为大多数专家3D视觉模型基础的回归公式，也不是有效3D学习的必要条件。",
        componentId: "ana-7"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "对应 / 位姿：文本条件化",
          desc: "切换对应点或位姿三问设置，观察文本输出如何变化。",
          componentId: "ch7multi"
        },
        {
          kind: "module",
          id: "7.2",
          title: "回归头 vs 文本 SFT",
          desc: "切换回归头 / 文本 SFT，对比连续数值预测与逐 token 生成。",
          componentId: "ch7mod1"
        }
      ],
      insight: "位姿上达到很强精度却只用文本 SFT，说明即便输出复杂，回归损失也不是有效 3D 学习的必要条件。",
      takeaways: [
        {
          icon: "↔️",
          title: "像素对应",
          desc: "问答皆文本坐标；焦距归一经验上非必须。"
        },
        {
          icon: "📹",
          title: "位姿三问",
          desc: "平移距离 + 方向向量 + yaw/pitch/roll，同样本打包。"
        },
        {
          icon: "🚫",
          title: "回归非必须",
          desc: "不必多任务回归头与复杂损失耦合。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "主结果：四项任务成绩单",
      badge: "both",
      badgeLabel: "实验 §4.1",
      bridge: "进入论文第 4 章实验：本节展示主结果（§4.1）。深度、物体级、像素对应与相机位姿——分别对照 VLM 与专家模型；指标方向有所不同（δ1/Acc 越高越好，EPE 越低越好）。",
      analogy: {
        title: "对照成绩单",
        text: "左表三列展示了:其他 VLM / VLM3 / 专家模型 在深度、物体级、像素对应与相机位姿四个任务上的表现。深度·物体见 <b>Table 1</b>；对应·位姿见 Table 1（VLM 侧）与 <b>Table 2</b>（专家侧，UFM / DA3）。",
        componentId: "ana-10"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "分项主结果对照",
          desc: "四项任务分组柱状图：其他 VLM（相近暖色）/ VLM3（绿）/ 专家（相近蓝紫）；更多详细数值见论文的 Table 1·2。",
          componentId: "ch10mod1"
        },
        {
          kind: "module",
          id: "8.2",
          title: "三者雷达总览",
          desc: "雷达总览：外圈更好。对比其他 VLM / VLM3 / 专家在四轴上的形状——VLM3 如何追近专家、短板在哪。",
          componentId: "ch8radar"
        }
      ],
      insight: "主结果要点：深度平均约 0.84→0.9；物体定性/定量均超 SpatialRGPT 且无额外编码器；对应优于 DKM/RoMa 但仍落后 UFM；位姿 AUC@30°≈94.0，接近 DA3-Giant 94.7。",
      takeaways: [
        {
          icon: "📐",
          title: "深度与物体",
          desc: "深度 0.84→0.9；物体定性/定量均提升，且去掉区域编码器。"
        },
        {
          icon: "↔️",
          title: "像素对应",
          desc: "EPE 15.37 优于 DKM/RoMa，仍落后 UFM 7.89。"
        },
        {
          icon: "📹",
          title: "位姿接近专家模型",
          desc: "AUC@30°≈94.0，接近 DA3-Giant 94.7。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "分析：文本引用、配比与模型规模",
      badge: "trn",
      badgeLabel: "实验 §4.2",
      bridge: "主结果之后进行分析（§4.2 / Table 3）：文本像素引用是否够用？数据配比差多少？更大模型是否一定更好？通过三组消融实验来回答「VLM3为何这么简单仍有效」。",
      analogy: {
        title: "四种不同任务演示",
        text: "VLM3适用于多样化的任务，包括单视图和多视图输入，以及室内和室外场景。在四种不同任务中均有较好表现。",
        componentId: "ana-11"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "消融①：文本像素引用",
          desc: "同设定下文本坐标 vs 视觉标记：δ1 0.853 ≈ 0.849（Table 3 左）。",
          componentId: "ch9ref"
        },
        {
          kind: "module",
          id: "9.2",
          title: "消融②：数据配比",
          desc: "使用不同数据配比策略（均匀 / size-based / VLM3 权重）：0.842 → 0.884 → 0.904（Table 3 中）。",
          componentId: "ch9mix"
        },
        {
          kind: "module",
          id: "9.3",
          title: "消融③：模型与数据规模",
          desc: "上→下按数据规模 32M→64M（同规模内模型 4B→8B→32B）：4B+32M 最优，更大或更长易过拟合。",
          componentId: "ch9size"
        }
      ],
      insight: "消融实验结果总结：1）文本引用与视觉提示精度接近（0.853 vs 0.849）；2）均匀配比 0.842→size-based 0.884→VLM3 0.904，VLM3的配比效果最好；3）更大模型在当前数据规模下未必更好，4B+恰当配比可达 SOTA。",
      takeaways: [
        {
          icon: "📝",
          title: "文本≈视觉",
          desc: "同数据同模型下，文本引用不输视觉标记。"
        },
        {
          icon: "⚖️",
          title: "配比关键",
          desc: "盲目均匀放大无效；加权与调权拉开上限。"
        },
        {
          icon: "🧱",
          title: "小模型够用",
          desc: "当前数据规模下放大模型易过拟合；4B 可追 SOTA。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "总结：VLM 天生就是三维学习者",
      badge: "inf",
      badgeLabel: "结论 §5",
      bridge: "收束全文（论文 §5）：VLM3 以最简、可扩展设计证明——标准架构 + 文本 SFT，即可跨多样 3D 任务匹敌专家；简单、灵活、可扩展，为通用 3D 基础模型开辟新路。",
      analogy: {
        title: "VLM 的三个核心",
        text: "标准 VLM 要学好细粒度 3D，关键只要三块：<strong>统一焦距</strong> · <strong>文本像素引用</strong> · <strong>数据配比与规模</strong>。不必改架构、不必堆回归头——即论文提出的：<strong>VLMs are native 3D learners</strong>。",
        componentId: "ana-concl"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "论证链：三件套为何不是必要条件",
          desc: "逐步推出：旧共识 → 换提问 → 只留三要素 → 否掉回归头 → 否掉增强与堆损 → 总证伪。",
          componentId: "ch10concl"
        }
      ],
      insight: "VLM3 首次证明：标准 VLM 架构与文本 SFT 足以学准多样细粒度 3D，并一致匹敌专家视觉模型；其简洁性与可扩展性，有望推动通用 3D 基础模型。",
      takeaways: [
        {
          icon: "✨",
          title: "核心主张",
          desc: "VLM 天生就是三维学习者；最简设计即可有效。"
        },
        {
          icon: "🧩",
          title: "实践含义",
          desc: "标准架构 + 文本 SFT，覆盖深度/物体/对应/位姿。"
        },
        {
          icon: "🔭",
          title: "开放问题",
          desc: "什么才是有效 3D 学习的必要条件？值得社区重思。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1J4muBkE34",
      title: "Depth Anything V3 相关解读",
      reason: "对照深度基础模型语境，帮助理解 VLM3 深度结果。"
    },
    {
      bvid: "BV1EkREYbE8i",
      title: "FoundationStereo 相关",
      reason: "立体与几何视觉背景，补充多视图直觉。"
    },
    {
      bvid: "BV1hGNozuEe4",
      title: "深度估计应用向介绍",
      reason: "理解深度结果如何被下游使用。"
    }
  ]
};
