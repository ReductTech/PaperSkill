import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "AlayaWorld: Interactive Long-Horizon World Modeling – Full Technical Report",
    "titleZh": "AlayaWorld：交互式长时程世界建模完整技术报告",
    "venue": "arXiv 技术报告 · 2026",
    "authors": "AlayaWorld Team, Kaipeng Zhang, Chuanhao Li, Yifan Zhan, Yongtao Ge, Yuanyang Yin 等",
    "affiliation": "Alaya Lab",
    "domain": "生成式视频世界模型 / 视频扩散 Transformer / 交互式生成",
    "coreProblem": "传统 3D 游戏世界依赖漫长制作链，通用视频生成器又难以同时保持可交互、长期一致、稳定且低延迟。",
    "coreInsight": "AlayaWorld 用有界视觉上下文、几何对齐空间记忆和抗漂移训练维持长时程自回归世界生成，再用少步蒸馏把推理压缩到每块四步。<br/><a href='https://arxiv.org/pdf/2607.18367' target='_blank' rel='noopener noreferrer'>论文原文 PDF：arXiv:2607.18367</a>",
    "keywords": [
      "世界模型",
      "视频扩散",
      "自回归生成",
      "空间记忆",
      "少步蒸馏"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统 3D 游戏依赖长制作链，通用视频生成又缺少长期一致、可控和低延迟的统一结构。",
      "componentId": "alaya-hero-old"
    },
    "newMethod": {
      "desc": "AlayaWorld 用有界上下文、空间记忆和抗漂移训练，把交互式世界生成变成稳定滚动的潜块循环。",
      "componentId": "alaya-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么世界会越走越漂",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "先让学习者亲身体会滑得越久越偏，再引出 AlayaWorld 的四项耦合目标。 长时程交互会放大误差，单靠更长的历史窗口并不能同时保证交互、一致性、稳定和效率。",
      "analogy": {
        "title": "走久了，路标会“漂”",
        "text": "勘察者只靠最近几步前进时，远处的<strong>旧地标</strong>会慢慢偏出路线；这正是长时程误差累积的直观版本。",
        "componentId": "alaya-ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "把时间范围拉长",
          "desc": "拖动滑杆改变勘察时长，观察旧式上下文中的路线偏差如何累积。",
          "componentId": "alaya-mod-1a"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "同一段路程，换上有界上下文",
          "desc": "按一次开始，让旧式长历史与本文有界上下文从相同起点同步前进。",
          "componentId": "alaya-mod-1b"
        }
      ],
      "insight": "需要一种有界、可回访、能修正自身误差的上下文，而不是无限堆叠过去。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题不是单点误差",
          "desc": "自回归生成越久，细小残差越容易变成可见漂移。"
        },
        {
          "icon": "🧭",
          "title": "四项能力彼此牵制",
          "desc": "交互、一致性、稳定和效率不能各自孤立优化。"
        },
        {
          "icon": "🗺️",
          "title": "有界上下文是入口",
          "desc": "保留足够证据，同时避免历史无限增长。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把世界切成可走的潜块",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "解释生成单位、控制输入与时序因果，让后续记忆和训练章节有统一对象。 AlayaWorld 在 VAE 潜在空间按块自回归生成，每块包含 4 个潜在帧，并由相机轨迹和可选文本提示控制。论文报告其输出为 24 fps 的 540p/720p 视频。",
      "analogy": {
        "title": "每走过一个路口，盖下一枚章",
        "text": "勘察者只根据<strong>已经走过的路</strong>和下一段方向盖下新章，不提前偷看未来。",
        "componentId": "alaya-ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "拖动下一段相机路线",
          "desc": "拖动罗盘改变下一块的相机方向，观察潜在块、路线和轨迹反馈同步变化。",
          "componentId": "alaya-mod-2"
        }
      ],
      "insight": "把世界拆成短块后，下一块只需要过去、当前相机控制和当前文本意图。",
      "formula": {
        "lead": "第 i 块只依赖过去的内容、当前及过去的相机轨迹，以及当前文本提示。",
        "unicode": "p(z₁:ₙ | π₁:ₙ, y₁:ₙ) = ∏ᵢ₌₁ᴺ pθ(zᵢ | z&lt;ᵢ, π≤ᵢ, yᵢ)",
        "symbols": [
          {
            "sym": "zᵢ",
            "desc": "第 i 个潜在视频块"
          },
          {
            "sym": "πᵢ",
            "desc": "第 i 块的相机轨迹"
          },
          {
            "sym": "yᵢ",
            "desc": "第 i 块的文本提示"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "生成单位是潜块",
          "desc": "每块 K=4 个潜在帧，块间按时间因果展开。"
        },
        {
          "icon": "🎥",
          "title": "相机是独立控制信号",
          "desc": "目标位姿从生成的视觉内容中分离出来。"
        },
        {
          "icon": "💬",
          "title": "提示可按块切换",
          "desc": "文本意图能在块边界引入新的开放动作。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "走远了，还能找回原地标",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "从短期连续性推进到长期空间一致性，回答“为什么回访不会重新想象一个地方”。 空间记忆把过去帧、估计深度和相机位姿缓存起来，在回访时重投影到当前视角。",
      "analogy": {
        "title": "回头时，门牌还在原处",
        "text": "路线可以绕开，<strong>已观察过的地标</strong>却不能被重新发明；空间记忆负责把它带回当前视角。",
        "componentId": "alaya-ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "一步一步走回旧地标",
          "desc": "逐步推进或后退回访路线，观察缓存帧、覆盖掩码与地标位置是否保持稳定。",
          "componentId": "alaya-mod-3"
        }
      ],
      "insight": "只有最近帧不够，必须保存可几何对齐的长期证据。",
      "takeaways": [
        {
          "icon": "📍",
          "title": "回访是检验器",
          "desc": "真正的一致性要在离开再返回时暴露。"
        },
        {
          "icon": "🧱",
          "title": "深度与位姿提供几何骨架",
          "desc": "缓存帧不只是图像，还带有视图关系。"
        },
        {
          "icon": "✅",
          "title": "覆盖区域才可信",
          "desc": "未观察到的区域不能被当作已验证证据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "四张卡片组成有界上下文",
      "badge": "both",
      "badgeLabel": "核心",
      "bridge": "把第一章的“有界上下文”拆成可命名、可操作的四个证据角色。 上下文前缀由 sink、时间记忆、空间记忆和 nearby/I2V 四条干净流组成，并与目标潜块一起进入自注意力。",
      "analogy": {
        "title": "四张卡，四种记忆",
        "text": "地图锚点、最近路线、已勘测平面和上一帧像四张卡一样各司其职，最后共同支撑下一段路线。",
        "componentId": "alaya-ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "选择一条上下文流",
          "desc": "点击四种上下文芯片，观察前缀组成、活跃区域和对应作用说明如何变化。",
          "componentId": "alaya-mod-4"
        }
      ],
      "insight": "上下文不是一条不断变长的视频，而是一组角色明确、尺寸有界的证据。",
      "formula": {
        "lead": "四条干净流与目标潜块拼成一个前缀，让注意力在同一序列里共同读取。",
        "unicode": "Sᵢ = [ s ; hᵢ ; gᵢ ; nᵢ ; zᵢ<sup>τ</sup> ]",
        "symbols": [
          {
            "sym": "s",
            "desc": "固定 sink 锚点"
          },
          {
            "sym": "hᵢ",
            "desc": "时间压缩记忆"
          },
          {
            "sym": "gᵢ",
            "desc": "空间重投影记忆"
          },
          {
            "sym": "nᵢ",
            "desc": "最近帧条件"
          },
          {
            "sym": "zτ",
            "desc": "带噪目标潜块"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚓",
          "title": "Sink 保持身份",
          "desc": "一个干净潜在帧作为全局外观锚点。"
        },
        {
          "icon": "🕒",
          "title": "时间记忆保持局部连续",
          "desc": "压缩最近六帧的短期动态。"
        },
        {
          "icon": "🗺️",
          "title": "空间记忆保持回访一致",
          "desc": "把过去观察重投影到当前视角。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "罗盘控制方向，便签改变事件",
      "badge": "both",
      "badgeLabel": "核心",
      "bridge": "区分几何控制与语义控制，解释为什么相机不应只依赖文本描述。 相机轨迹通过逐帧相对位姿、Fourier 特征和 AdaLN 注入；文本提示在块边界切换，控制开放动作。",
      "analogy": {
        "title": "先转罗盘，再换一张便签",
        "text": "罗盘决定往哪里走，便签决定路上发生什么；两种控制不能混成一句话。",
        "componentId": "alaya-ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "转动罗盘对准目标视角",
          "desc": "直接拖动罗盘改变相对位姿，观察 AdaLN 强度、路线弯曲与块边界定位同步更新。",
          "componentId": "alaya-mod-5"
        }
      ],
      "insight": "相机控制提供可重复的几何方向，文本提示负责在正确时刻引入事件。",
      "formula": {
        "lead": "相机条件把六个相对位姿分量变成 Fourier 特征，再通过 MLP 调制时间步嵌入。",
        "unicode": "c_cam = MLP(∥ₖ₌₁⁶ PE(Δπₖ))，e ← e + c_cam",
        "symbols": [
          {
            "sym": "Δπₖ",
            "desc": "一帧中第 k 个相对位姿分量"
          },
          {
            "sym": "PE",
            "desc": "Fourier 位置编码"
          },
          {
            "sym": "e",
            "desc": "注入 AdaLN 的时间步嵌入"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "相机走独立通道",
          "desc": "相对位姿被单独编码并调制去噪网络。"
        },
        {
          "icon": "🏷️",
          "title": "提示在块边界切换",
          "desc": "事件不必破坏已有场景上下文。"
        },
        {
          "icon": "🧱",
          "title": "控制与记忆共享位姿源",
          "desc": "缓存和相机条件使用同一轨迹定义。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一块接一块地展开世界",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "把抽象结构变成执行循环，解释“常数计算量、原则上无限时程”的含义。 每一步读取相机与提示、构造有界前缀、采样下一块、流式解码，再更新历史与空间缓存。",
      "analogy": {
        "title": "走一步，卷动一次地图",
        "text": "旧图不会无限摊开；路线前进时，窗口沿同一张地图卷动，始终只保留必要证据。",
        "componentId": "alaya-ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐步执行自回归循环",
          "desc": "使用上一步、下一步和重置推进五个块，观察窗口滑动与计算预算保持稳定。",
          "componentId": "alaya-mod-6"
        }
      ],
      "insight": "有界窗口让每一步的执行保持一致，长时程来自重复可靠的小步，而不是一次性生成全部未来。",
      "takeaways": [
        {
          "icon": "🔄",
          "title": "循环由过去的生成驱动",
          "desc": "新块生成后会更新历史和空间缓存。"
        },
        {
          "icon": "📏",
          "title": "窗口保持有界",
          "desc": "每块只读取固定规模的四条上下文流。"
        },
        {
          "icon": "♾️",
          "title": "时程来自滚动",
          "desc": "原则上的长时程来自稳定的小步执行。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "刻意走错，才能学会修正",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "揭示训练时为何要模拟错误，以及错误银行如何弥补模拟漂移与真实漂移的差距。 Anti-drift 训练把噪声、模糊和饱和度变化施加到过去上下文，并回放模型自身产生的残差。",
      "analogy": {
        "title": "先把地图弄脏，再学会擦净",
        "text": "模型不是只在干净历史上学习前进，还要在<strong>被污染的历史</strong>中学会回到正确路线。",
        "componentId": "alaya-ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "选择一种历史损坏",
          "desc": "切换噪声、模糊、饱和度或论文方法，观察路线恢复状态与误差反馈。",
          "componentId": "alaya-mod-7"
        }
      ],
      "insight": "想让推理时能从自身误差恢复，训练时就必须制造足够真实的历史损坏。",
      "formula": {
        "lead": "错误银行把模型重建残差加回上下文，让训练样本包含自身的失败模式。",
        "unicode": "δ = ẑ₀ − z₀，z ← z + γδ",
        "symbols": [
          {
            "sym": "δ",
            "desc": "模型重建残差"
          },
          {
            "sym": "z",
            "desc": "历史上下文潜变量"
          },
          {
            "sym": "γ",
            "desc": "残差回放强度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🌧️",
          "title": "模拟漂移覆盖常见退化",
          "desc": "噪声、模糊和饱和度改变迫使模型恢复。"
        },
        {
          "icon": "🧾",
          "title": "错误银行保存真实残差",
          "desc": "回放模型自己的失败模式，贴近推理分布。"
        },
        {
          "icon": "🧼",
          "title": "恢复能力来自训练而非事后修补",
          "desc": "容错先被写进条件构造过程。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "四路上下文如何汇入同一张地图",
      "badge": "trn",
      "badgeLabel": "结构",
      "bridge": "从单点功能进入完整结构，让学习者看到各组件如何连接、哪些部分有边界。 四路干净上下文与目标块组成一个前缀；空间记忆通过最大覆盖检索、前向投影和 coverage attention bias 注入当前视角。",
      "analogy": {
        "title": "把四层路线叠成一张勘察图",
        "text": "每层都保留不同证据，只有叠到一起，世界身份、短期连续和长期几何才能共同支持下一步。",
        "componentId": "alaya-ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击查看上下文通路",
          "desc": "点击 Sink、历史、空间、最近帧或目标块，高亮它在自注意力前缀中的位置与输出作用。",
          "componentId": "alaya-mod-8a"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "拖动覆盖帧，检查空间证据",
          "desc": "拖动缓存帧选择器改变覆盖帧数量，观察有效掩码、空洞区域和反馈同步变化。",
          "componentId": "alaya-mod-8b"
        }
      ],
      "insight": "结构的价值不在组件数量，而在四类证据使用同一状态、同一位姿源并保持固定预算。",
      "formula": {
        "lead": "空间记忆把缓存帧像素按深度和相机位姿重投影到目标视角。",
        "unicode": "u′ = πᵢ(πⱼ⁻¹(u, Dⱼ(u)))",
        "symbols": [
          {
            "sym": "u",
            "desc": "缓存帧中的像素"
          },
          {
            "sym": "Dⱼ(u)",
            "desc": "该像素的估计深度"
          },
          {
            "sym": "πᵢ",
            "desc": "目标相机位姿投影"
          },
          {
            "sym": "Mᵢ",
            "desc": "当前视角的二值覆盖掩码"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧷",
          "title": "前缀是唯一汇合点",
          "desc": "四条流与目标块在同一自注意力序列中交互。"
        },
        {
          "icon": "🧮",
          "title": "空间记忆有明确上限",
          "desc": "最多选择十帧，按最大覆盖而非任意拼接。"
        },
        {
          "icon": "🕳️",
          "title": "未覆盖区域不冒充证据",
          "desc": "coverage mask 作为注意力键偏置抑制盲信。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "四步学生追上三十步教师",
      "badge": "trn",
      "badgeLabel": "效率",
      "bridge": "解释效率提升的来源与代价边界，避免把少步推理误解为简单跳过计算。 DMD、self-forcing++ 和一致性蒸馏把约 30 步教师采样压缩到 4 步学生，同时保留相机与记忆栈。",
      "analogy": {
        "title": "更少停步，仍走同一条路",
        "text": "目标不是随便少走几步，而是让<strong>少步学生</strong>在自生成路径上仍能对齐教师分布。",
        "componentId": "alaya-ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "把采样步数从三十降到四",
          "desc": "拖动步数滑杆，观察质量、稳定性与推理成本在四步附近形成的可交互平衡。",
          "componentId": "alaya-mod-9"
        }
      ],
      "insight": "速度来自分布匹配与自回归自校正，不是单纯减少去噪次数。",
      "formula": {
        "lead": "学生同时接受分布匹配和相邻噪声级一致性约束。",
        "unicode": "L = L_DMD + 0.5L_cm",
        "symbols": [
          {
            "sym": "L_DMD",
            "desc": "分布匹配蒸馏损失"
          },
          {
            "sym": "L_cm",
            "desc": "相邻噪声级的一致性蒸馏损失"
          },
          {
            "sym": "Gθ",
            "desc": "学生的生成映射"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚡",
          "title": "四步是蒸馏目标",
          "desc": "报告把约三十步教师压缩为四步学生。"
        },
        {
          "icon": "🌀",
          "title": "自生成路径用于校正",
          "desc": "Self-forcing++ 缩小训练与推理分布差。"
        },
        {
          "icon": "🧊",
          "title": "记忆栈被保留",
          "desc": "加速不是丢弃相机控制或长期记忆。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、边界与可复用的判断",
      "badge": "both",
      "badgeLabel": "结论",
      "bridge": "把交互中学到的机制拉回证据边界，强调协议、指标方向和限制。 表 3 使用四步蒸馏模型在 480p 下评估 iWorld-Bench 的 Action Control 与 Memory Ability；三个维度指标均在 [0,1] 且越高越好。WorldMark 采用同参考图与动作序列的盲测人偏好 Elo，但报告未给出数值表。",
      "analogy": {
        "title": "同一起点，跑同一张地图",
        "text": "赛道和刻度保持一致，终点只承认真实测量值；速度、记忆或画质不能混成一个结论。",
        "componentId": "alaya-ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "按指标开始验证竞赛",
          "desc": "按下开始后，选择记忆对称性、轨迹准确率或亮度一致性，比较表中的真实数值。",
          "componentId": "alaya-mod-10"
        }
      ],
      "insight": "强结果要按协议阅读，图像质量、轨迹控制和长期记忆是不同问题。",
      "takeaways": [
        {
          "icon": "🥇",
          "title": "优势是多维的",
          "desc": "亮度一致性、轨迹准确率和记忆对称性均在同表中领先。"
        },
        {
          "icon": "⚠️",
          "title": "图像质量不是最高",
          "desc": "同表 Image Quality 为 0.6620，低于 HunyuanVideo-1.5。"
        },
        {
          "icon": "🔎",
          "title": "限制同样重要",
          "desc": "系统仍主要依赖视觉观测、估计几何和视觉记忆；对物体状态、物理因果与长期任务结构的理解受可见结果限制。"
        }
      ]
    }
  ]
};
