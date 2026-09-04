import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Latent Spatial Memory for Video World Models",
    "titleZh": "视频世界模型的潜空间三维记忆",
    "venue": "arXiv:2606.09828v1 · 2026",
    "authors": "Weijie Wang, Haoyu Zhao, Yifan Yang, Feng Chen 等",
    "affiliation": "浙江大学 · 微软研究院 · 阿德莱德大学 · 莫纳什大学",
    "domain": "视频世界模型 / 三维一致性 / 扩散模型",
    "coreProblem": "传统 RGB 点云记忆每次读出都要经历<b>渲染 → VAE 编码</b>，既慢，又可能把模型原生 latent 特征压回三通道颜色。",
    "coreInsight": "先看结果：当相机沿长轨迹移动并再次看到旧区域时，画面还能否保持为<b>同一个三维世界</b>？",
    "keywords": [
      "3D 空间记忆",
      "视频扩散",
      "相机轨迹",
      "10.57× 推理加速",
      "55× 存储节省"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>Gen3C</b>：在Latent和RGB空间反复编码渲染，导致出现伪影、失真等情况。",
      componentId: "lsm-hero-contrast"
    },
    "newMethod": {
      "desc": "<b>Mirage（Ours）</b>：潜空间三维记忆帮助生成结果保持跨视角一致。",
      componentId: "lsm-hero-contrast"
    }
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "为什么需要3D缓存？",
      "badge": "inf",
      "badgeLabel": "背景",
      "bridge": "先把世界模型分成三类：只依赖短上下文、把颜色写入 RGB 三维点云、把原生 latent 直接钉在三维位置。三者都能生成下一帧，但重访旧区域时，能查到的“世界状态”完全不同。",
      "analogy": {
        "title": "重访旧区域的案例：缺乏3D缓存",
        "text": "如左侧所示，绿色代表真实的门框位置，红色代表<b>纯粹的视频生成模型</b>随相机位置变化生成的门框位置。在没有3D缓存的情况下，模型几乎无法保持一致的空间结构。",
        componentId: "lsm-photo-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "主流程相同，记忆层不同",
          "desc": "点击“重访旧区域”，观察同一个 DIT 在三种记忆范式下分别能读到什么。这里的“无持久 3D”是短上下文基线；RGB 与 latent 是两种持久空间表示。",
          componentId: "lsm-c1-main"
        },
        {
          kind: "module",
          "id": "1.2",
          "title": "重访旧区域：三条读出路径",
          "desc": "选择一种记忆，沿着“目标视角 → 读出 → 条件输入”走一遍。注意 RGB 点云并非没有记忆，而是每次读出要经过像素中间层。",
          componentId: "lsm-c1-compare"
        }
      ],
      "insight": "核心分界线不是“有没有生成器”，而是“有没有可按目标视角查询的持久三维状态，以及状态是否仍处在模型原生 latent 空间”。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "主干可以相同",
          "desc": "三种范式都把序列送入 DIT，差异在 DIT 旁边的记忆层。"
        },
        {
          "icon": "🧭",
          "title": "RGB 是持久的，但要绕路",
          "desc": "位置能留下，读出还要 Render → Encode。"
        },
        {
          "icon": "💡",
          "title": "Latent 把位置和特征绑在一起",
          "desc": "pᵢ 负责“在哪”，fᵢ 负责“是什么”。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "3D缓存究竟装了什么",
      "badge": "inf",
      "badgeLabel": "存储库定义",
      "bridge": "既然需要长期记忆，下一步不是马上搭网络，而是决定每个三维位置保存什么。传统RGB点云存储 只保存颜色；Mirage 保存扩散模型真正消费的 latent  Token 。",
      "analogy": {
        "title": "同一个三维位置，保存颜色还是保存模型特征？",
        "text": "RGB 点云记录的是三维坐标和颜色，最后的点云体积巨大；Latent 点云记录的是三维坐标和视频模型可以直接读取的特征。",
        componentId: "lsm-photo-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "切换同一空间点的存储内容",
          "desc": "",
          componentId: "lsm-c2-main"
        }
      ],
      "formula": {
        "lead": "Mirage 的每个记忆元素把世界位置与模型原生特征绑定在一起。",
        "unicode": "M = {(pᵢ, fᵢ)}，pᵢ ∈ R³，fᵢ ∈ Rᶜ",
        "symbols": [
          {
            "sym": "M",
            "desc": "持久的潜空间三维记忆集合。"
          },
          {
            "sym": "pᵢ",
            "desc": "第 i 个表面的三维世界坐标，属于 R³。"
          },
          {
            "sym": "fᵢ",
            "desc": "锚定在该位置的 C 通道 VAE latent  Token 。"
          },
          {
            "sym": "C",
            "desc": "latent 通道数；论文的 Wan2.2 配置取 48。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📍",
          "title": "位置 + 内容",
          "desc": "三维坐标负责“在哪”，latent  Token 负责“是什么”。"
        },
        {
          "icon": "🧠",
          "title": "保持原生信号空间",
          "desc": "读出结果可直接进入视频扩散骨干。"
        },
        {
          "icon": "⚠️",
          "title": "数字有配置边界",
          "desc": "C=48、s=16 来自论文的具体 VAE。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "历史场景Latent如何进行存储",
      "badge": "inf",
      "badgeLabel": "构建",
      "bridge": "知道要存 latent 还不够：模型必须知道每个网格单元对应现实中的哪一块表面。<b>深度、相机内参与位姿共同完成反投影。</b>",
      "analogy": {
        "title": "给机位钉一枚地图标记",
        "text": "三脚架固定视角，深度决定标记沿视线落在近墙还是远墙。",
        componentId: "lsm-photo-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "点一个 latent 格，看它落到哪里",
          "desc": "点击网格单元并切换近/远深度。左边选中的格、中央相机射线和右边世界坐标钉由同一状态驱动。",
          componentId: "lsm-c3-main"
        }
      ],
      "formula": {
        "lead": "每个 latent 单元先通过深度反投影得到世界点，再携带本格的完整通道特征。",
        "unicode": "pᵤᵥ = π⁻¹(u,v,D(u,v);K,E)，Fᵤᵥ = z[:,v,u]",
        "symbols": [
          {
            "sym": "pᵤᵥ",
            "desc": "latent 网格位置 (u,v) 对应的三维世界点。"
          },
          {
            "sym": "D(u,v)",
            "desc": "该 latent 单元的有限正深度。"
          },
          {
            "sym": "K",
            "desc": "已经按 latent 分辨率缩放的相机内参。"
          },
          {
            "sym": "E",
            "desc": "相机外参；附录约定 E 把世界点映到相机坐标。"
          },
          {
            "sym": "Fᵤᵥ",
            "desc": "从 z 的 (u,v) 位置取得的 C 通道 Token 。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "内参也要同步缩放",
          "desc": "深度与 K 必须和 latent 网格处在同一分辨率。"
        },
        {
          "icon": "🔦",
          "title": "深度决定射线落点",
          "desc": "同一网格格在不同深度会锚定到不同世界位置。"
        },
        {
          "icon": "🧩",
          "title": "一格对应一 Token ",
          "desc": "避免先把特征上采样到像素网格再提升。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "如何从记忆中“看见”目标视角",
      "badge": "both",
      "badgeLabel": "核心",
      "bridge": "构建阶段得到的是一堆带特征的三维点；生成器需要的是目标相机视角下的规则 latent 网格进行输入。投影、z-buffer 和可见性掩码负责把两者接起来。",
      "analogy": {
        "title": "对焦最近的可见立面",
        "text": "一条视线可能穿过多块表面；相机应读取<b>最靠前</b>的那一块，而不是把它们混在一起。",
        componentId: "lsm-photo-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "固定目标相机，逐个投影记忆点",
          "desc": "保持目标相机 K、Eₜ 和全部世界点 pᵢ 不变，依次把每个点投影到目标 latent 网格。观察有效点写入、同格 z-buffer 竞争，以及负深度和越界点被丢弃。",
          componentId: "lsm-c4-main"
        }
      ],
      "formula": {
        "lead": "在所有投影到目标格且深度为正的点中，选择相机坐标系里最靠前者。",
        "unicode": "iₜ(u,v) = arg minᵢ∈Ωₜ(u,v) [Eₜpᵢ]z；ẑₜ(u,v) = Fᵢₜ(u,v)",
        "symbols": [
          {
            "sym": "Ωₜ(u,v)",
            "desc": "投影到目标格 (u,v) 且深度为正的候选记忆点集合。"
          },
          {
            "sym": "iₜ",
            "desc": "z-buffer 选中的最近候选索引。"
          },
          {
            "sym": "ẑₜ",
            "desc": "目标视角下读出的 latent 特征网格。"
          },
          {
            "sym": "mₜ",
            "desc": "二值可见性掩码：有点投到此格为 1，否则为 0。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "👁️",
          "title": "最近点胜出",
          "desc": "z-buffer 处理同一格上的遮挡冲突。"
        },
        {
          "icon": "0️⃣",
          "title": "零值不等于未见",
          "desc": "可见性掩码把两种情况分开。"
        },
        {
          "icon": "🗺️",
          "title": "读出发生在 latent 网格",
          "desc": "无需先合成目标视角 RGB 图。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "记忆如何更新",
      "badge": "both",
      "badgeLabel": "循环",
      "bridge": "Mirage 每生成一块视频，就把新观察到的静态结构补入缓存，于是长期记忆随探索扩张。",
      "analogy": {
        "title": "仅存入静态结构",
        "text": "只把可靠的墙面和门窗等写进长期参考，不把路人和天空等动态场景永久钉住。",
        componentId: "lsm-photo-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "逐步走完一次 Mirage 循环",
          "desc": "用上一步/下一步依次查看初始化、latent 读出、去噪、解码、深度分割、再编码更新。橙色像素操作只出现在<b>按块更新</b>，不是每次条件读出。",
          componentId: "lsm-c5-main",
          "figure": "/images/figure-3-mirage-overview.png"
        }
      ],
      "formula": {
        "lead": "只有通过有效深度与静态区域筛选的单元才加入长期记忆。",
        "unicode": "M ← M ∪ {(pᵤᵥ, Fᵤᵥ)}(u,v)∈Λₜ",
        "symbols": [
          {
            "sym": "M",
            "desc": "持续累积的潜空间三维记忆。"
          },
          {
            "sym": "Λₜ",
            "desc": "深度有效且位于动态物体、天空掩码之外的 latent 单元。"
          },
          {
            "sym": "Fᵤᵥ",
            "desc": "生成帧重新编码后取得的干净 latent  Token 。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔁",
          "title": "初始化—读出—更新",
          "desc": "三个动作构成长轨迹的空间记忆循环。"
        },
        {
          "icon": "🧾",
          "title": "像素操作没有消失",
          "desc": "它被摊到一次 chunk 更新，而非每个条件读取。"
        },
        {
          "icon": "🧹",
          "title": "长期缓存只收静态可靠内容",
          "desc": "过滤避免运动物体变成过期几何。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "完整视频生成过程",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "空间缓存解决“还记不记得这里”，重叠 chunk 解决“动作是否连续”。Mirage 同时使用长期几何记忆与短期时序上下文。",
      "analogy": {
        "title": "沿拍摄路线推进一组镜头",
        "text": "相机每次完成一个片段，保留少量相邻画面衔接，同时从全局地图读取旧区域。",
        componentId: "lsm-photo-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "推进一个 9 帧 latent 块",
          "desc": "按阶段查看目标位姿读出、骨干去噪、RGB 解码和缓存更新。论文配置中 9×44×80 latent 对应 33 帧 704×1280 RGB。",
          componentId: "lsm-c6-main"
        }
      ],
      "insight": "短期重叠维护时间连续，持久缓存维护跨 chunk 的空间一致性；两者不能互相替代。",
      "takeaways": [
        {
          "icon": "🎞️",
          "title": "逐块生成",
          "desc": "长视频由多个有重叠的 chunk 组成。"
        },
        {
          "icon": "🧠",
          "title": "两类上下文分工",
          "desc": "短期帧管连续，长期缓存管重访。"
        },
        {
          "icon": "⚙️",
          "title": "参数属于论文配置",
          "desc": "40 步 UniPC 与具体张量尺寸不是普遍常数。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "两阶段训练法",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "新的记忆条件分支一开始不会说骨干网络熟悉的“语言”。如果立即同时改动所有部件，骨干会追逐尚不成熟的条件信号。",
      "analogy": {
        "title": "先校对新增分支，再启用 LoRA 适配器",
        "text": "先让侧分支学会将投影特征对齐到主干特征空间；随后联合训练侧分支与 Wan 注意力层上的 LoRA 增量参数。Wan 的原始权重始终冻结。",
        componentId: "lsm-photo-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "切换训练阶段，看谁在更新",
          "desc": "阶段一只训练侧分支；阶段二再加入注意力 q/k/v/o 上的 rank-64 LoRA。VAE 与 Wan2.2 原始权重始终冻结；单阶段消融改变的是训练顺序，而不是改成全参数微调。",
          componentId: "lsm-c7-main"
        }
      ],
      "takeaways": [
        {
          "icon": "1️⃣",
          "title": "先对齐记忆分支",
          "desc": "VAE 与 Wan2.2 原始权重冻结，只更新记忆侧分支，学习率 10⁻⁵。"
        },
        {
          "icon": "2️⃣",
          "title": "再更新 LoRA 增量参数",
          "desc": "侧分支与 q/k/v/o 上的 rank-64 LoRA 联合训练，Wan 原始权重不更新。"
        },
        {
          "icon": "📉",
          "title": "消融支持阶段设计",
          "desc": "同一 split 的单阶段训练明显更弱。"
        }
      ]
    },
    // {
    //   kind: "chapter",
    //   "id": "chap-8",
    //   "title": "记忆怎样接入 5B 视频骨干",
    //   "badge": "trn",
    //   "badgeLabel": "架构",
    //   "bridge": "现在把表示、几何和训练拼起来：Mirage 没有重做一个生成器，而是在 Wan2.2 骨干旁增加一条能理解 latent 记忆的条件分支。",
    //   "analogy": {
    //     "title": "给相机装一只记忆侧盒",
    //     "text": "侧盒不替换主相机，而是在关键层把当前视角的空间线索送进去。",
    //     componentId: "lsm-photo-analogy"
    //   },
    //   "modules": [
    //     {
    //       kind: "module",
    //       "id": "8.1",
    //       "title": "点开 Mirage 的每条有效路径",
    //       "desc": "点击缓存、投影掩码、侧分支、分段 RoPE、Wan 骨干和输出；每次选择都更新高亮节点、下游路径与固定详情区。",
    //       componentId: "lsm-c8-main"
    //     }
    //   ],
    //   "insight": "因为读出已经是 48 通道 latent，侧分支无需再放一个桥接编码器。",
    //   "takeaways": [
    //     {
    //       "icon": "🧱",
    //       "title": "ControlNet 风格侧分支",
    //       "desc": "保留预训练骨干的外观与运动先验。"
    //     },
    //     {
    //       "icon": "🔌",
    //       "title": "八个注入层",
    //       "desc": "论文配置连接到 0、4、8、12、16、20、24、28 层。"
    //     },
    //     {
    //       "icon": "🏷️",
    //       "title": "三类帧被显式标记",
    //       "desc": "分段旋转编码区分目标、前序和参考帧。"
    //     }
    //   ]
    // },
    /* §9“工程细节与消融”暂不展示，保留内容便于后续恢复。
    {
      kind: "chapter",
      "id": "chap-9",
      "title": "哪些工程细节真正有用",
      "badge": "trn",
      "badgeLabel": "消融",
      "bridge": "一个完整方法包含许多看似次要的选择。消融实验的价值，是在其他条件不变时一次拆掉一个部件，判断它是否真的支撑结果。",
      "analogy": {
        "title": "把路人挡在建筑参考之外",
        "text": "遮罩卡只让门、墙等刚性结构进入长期相册，避免把会移动的人钉成“永久墙面”。",
        componentId: "lsm-photo-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "9.1",
          "title": "一次只拆掉一个部件",
          "desc": "切换 RGB 缓存、像素分辨率提升、关闭动态过滤和单阶段训练，查看 Table 3 的 Average、3D Consistency、Photo Consistency。",
          componentId: "lsm-c9-main"
        },
        {
          kind: "module",
          "id": "9.2",
          "title": "拖动遮罩：什么能进长期记忆",
          "desc": "拖动遮罩经过建筑、天空和路人；只有静态且深度有效的单元加入缓存。深度源和下采样选项显示论文的真实敏感性数据。",
          componentId: "lsm-c9-mask"
        }
      ],
      "takeaways": [
        {
          "icon": "🧪",
          "title": "四个设计都有贡献",
          "desc": "所有被替换或移除的版本都低于完整方法。"
        },
        {
          "icon": "🌊",
          "title": "深度源有一定弹性",
          "desc": "MapAnything 与 UniDepth 只带来较小下降。"
        },
        {
          "icon": "🕳️",
          "title": "双线性是经验默认",
          "desc": "它在四种规则中 hole rate 最低，但会模糊深度边缘。"
        }
      ]
    },
    */
    // {
    //   kind: "chapter",
    //   "id": "chap-10",
    //   "title": "结果很强，但边界在哪里",
    //   "badge": "both",
    //   "badgeLabel": "结果与限制",
    //   "bridge": "最后把“有效”拆成四个问题：生成质量、闭环重访、速度与显存，以及在哪些场景下这个优势会减弱。不同协议和指标方向不能混在一条赛道上。",
    //   "analogy": {
    //     "title": "紧凑特征本对上全分辨率相册",
    //     "text": "同一拍摄路线中，轻量 latent 记忆更快读出；但这场胜利建立在<b>刚性场景</b>和论文评测配置上。",
    //     componentId: "lsm-photo-analogy"
    //   },
    //   "modules": [
    //     {
    //       kind: "module",
    //       "id": "10.1",
    //       "title": "选择指标，再启动证据赛道",
    //       "desc": "切换 WorldScore、RealEstate10K 闭环、缓存读出时间与缓存显存。所有数值来自对应表格/图，反馈会同时指出胜项和未胜指标。",
    //       componentId: "lsm-c10-main",
    //       "figure": "/images/figure-5-efficiency.png"
    //     }
    //   ],
    //   "insight": "Mirage 的主张是：在论文配置与基准上，latent 记忆兼顾质量和效率；它不是对动态世界状态的完整解决方案。",
    //   "takeaways": [
    //     {
    //       "icon": "🏆",
    //       "title": "WorldScore 平均分 70.36",
    //       "desc": "在表中列出的系统里最高，3D 与光度一致性也领先。"
    //     },
    //     {
    //       "icon": "⚡",
    //       "title": "最高 10.57× / 55×",
    //       "desc": "对应 H100 设置下的端到端速度与 3D 缓存显存优势。"
    //     },
    //     {
    //       "icon": "🚧",
    //       "title": "动态人物是明确缺口",
    //       "desc": "被过滤的运动实体不会跨 chunk 保存状态。"
    //     }
    //   ]
    // }
  ]
};
