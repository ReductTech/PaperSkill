import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "DreamX-World 1.0: A General-Purpose Interactive World Model",
    titleZh: "DreamX-World 1.0：通用可交互世界模型",
    venue: "arXiv:2606.16993 · 2026",
    authors: "DreamX Team",
    affiliation: "DreamX Team / AMAP-ML",
    domain: "视频生成 · 交互式世界模型",
    coreProblem: "普通视频扩散模型只能被动生成短片；交互式世界模型还必须响应相机与事件控制、在长时程内保持场景一致，并满足实时延迟要求。",
    coreInsight: "DreamX-World 1.0 以全栈思路构建通用交互世界模型：多源数据引擎提供带精确相机标注的训练素材，<b>E-PRoPE</b> 在下采样 token 上注入相机几何，<b>几何检索记忆</b>让旧地重访不走样，<b>因果强制 + DMD 蒸馏</b>把双向模型变成少步自回归生成器，配合保守 RL 对齐与系统级加速，在 8 张 RTX5090 上实现最高 16 FPS 的流式交互生成。",
    keywords: [
      "世界模型",
      "相机控制",
      "E-PRoPE",
      "场景记忆",
      "事件指令",
      "DMD蒸馏",
      "实时推理"
    ]
  },
  hero: {
    oldMethod: {
      componentId: "hero-old",
      desc: "普通视频模型：只能重播固定路线；<b>回到老地方，街景却变了样</b>——没有控制，也没有记忆。"
    },
    newMethod: {
      componentId: "hero-new",
      desc: "DreamX-World 1.0：相机可控、事件听话、旧地重访<b>街景如初</b>——控制、事件、记忆、实时，四者兼得。"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "从看视频到走进世界",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "开篇先立题：普通视频生成和世界模型之间，差的到底是什么？这一章用一次亲手操作把差别摆在你面前。",
      analogy: {
        title: "一段开不进去的风景",
        text: "普通视频像一段<b>沿途录像</b>：再美也只能按固定路线播放。世界模型则把方向盘交给你——<b>往哪开，世界就往哪展开</b>。",
        componentId: "ana-1"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "拖一拖路线：视频与世界模型的差别",
          desc: "在下方路线条上左右拖动目的地旗（或用 ←/→ 键）：左边是普通视频，右边是世界模型，看看谁听你的。文末附论文 Figure 2 系统总览（数据系统 → 渐进训练 → 流式推理）。",
          componentId: "mod-1-1",
          figure: "/images/figure2.png"
        }
      ],
      insight: "要“开进”视频里，模型必须把相机轨迹当作一等输入——这正是 DreamX-World 要解决的第一件事。",
      takeaways: [
        {
          icon: "🎯",
          title: "问题",
          desc: "视频生成是被动的，世界模型要求可交互：相机能动、事件能改、旧地重访不变样。"
        },
        {
          icon: "🔧",
          title: "挑战",
          desc: "交互带来四件事——相机控制、事件交互、长时程记忆、实时延迟（论文 §1）。"
        },
        {
          icon: "✨",
          title: "直觉",
          desc: "把“看风景”变成“开进去”，是整篇论文的出发点。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "数据引擎：给世界模型修三条路",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "知道了目标，下一个问题是：这样的模型拿什么训练？没有任何单一数据源既精确又多样，答案是组合。",
      analogy: {
        title: "三张地图拼成一张",
        text: "UE 合成的地图<b>标注精确</b>但景象有限；真实世界的地图<b>风貌多样</b>却要补测坐标；游戏实录的地图<b>动作丰富</b>。叠加对齐，才拼得出完整世界。",
        componentId: "ana-2"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "三路数据源各管什么",
          desc: "点击切换三种数据源，比较它们在<b>标注精度、动作丰富度、视觉多样性</b>上的长短（定性示意，依据论文 §2 的描述）。",
          componentId: "mod-2-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "问题",
          desc: "真实视频缺标注，合成数据缺多样性——任何单一来源都不够。"
        },
        {
          icon: "🔧",
          title: "方案",
          desc: "UE 合成 + 真实视频 + 游戏实录三路合并，三段质检（基础过滤、几何清洗、属性打标）统一把关。"
        },
        {
          icon: "✨",
          title: "判断",
          desc: "数据引擎是世界模型的地基工程；覆盖与标注不可兼得时，就用组合。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "关键洞察：让相机几何直接参与注意力",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "有了带位姿标注的数据还不够：模型结构上怎样“听懂”相机指令？这一章给出全文第一个关键洞察。",
      analogy: {
        title: "跟着路牌转弯",
        text: "没有路牌时，司机只能凭感觉猜弯；把<b>相机几何</b>直接写进注意力，就像每个弯道口都立起一块<b>相对路牌</b>——“从你现在位置，向左转 30°”。",
        componentId: "ana-3"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "同一条路，两种开法",
          desc: "点击切换「注入相机几何 / 无相机条件」：看几何包如何从相机轨迹逐一飞入自注意力的 token，以及生成画面的实际视线是否跟住规定轨迹的应到位置。",
          componentId: "mod-3-1"
        }
      ],
      insight: "相机轨迹不是附加说明，而是要在每一次注意力计算里都“在场”的几何条件。",
      takeaways: [
        {
          icon: "🎯",
          title: "问题",
          desc: "没有几何条件的视频模型，无法稳定跟随规定的相机轨迹。"
        },
        {
          icon: "🔧",
          title: "方案",
          desc: "PRoPE 把相机几何作为相对位置编码注入自注意力（论文 §3.1）。"
        },
        {
          icon: "✨",
          title: "判断",
          desc: "控制信号注入得越“深”，跟随越可靠——代价是计算量，下一章解决。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "E-PRoPE：只算必要的相机几何",
      badge: "both",
      badgeLabel: "核心",
      bridge: "把相机几何放进注意力很有效，但全分辨率计算几乎让成本翻倍。这一章看 E-PRoPE 如何把这笔账算小。",
      analogy: {
        title: "少描几个点，路线依然准",
        text: "描一条路线不必点满每个像素——<b>关键的稀疏采样点</b>就足以还原走向。E-PRoPE 正是这样：在<b>下采样 token</b> 上算相机几何，又快又准。",
        componentId: "ana-4"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "E-PRoPE 的捷径：下采样 + 残差加回",
          desc: "点击切换 E-PRoPE / 完整 PRoPE：上方动画演示完整计算流水线——token 流（S = 18480）经下采样汇入投影注意力（N = 4096），再上采样、残差加回主干注意力输出；下方是延迟与相机控制分（论文 Table 1 实测锚点）。",
          componentId: "mod-4-1"
        }
      ],
      formula: {
        lead: "PRoPE 给每个 token 配一个矩阵：一半装相机投影几何，一半装常规旋转位置编码；E-PRoPE 只保留前者：",
        unicode: "D<sub>s</sub><sup>PRoPE</sup> = <table class=\"mx\"><tr><td>D<sub>s</sub><sup>Proj</sup></td><td>0</td></tr><tr><td>0</td><td>D<sub>s</sub><sup>RoPE</sup></td></tr></table><br>→ E-PRoPE：只保留 D<sub>s</sub><sup>Proj</sup>，投影 token 从 S = 18480 压到 N = 4096（输出上采样后残差加回主干注意力输出）",
        symbols: [
          {
            sym: "D<sub>s</sub><sup>Proj</sup>",
            desc: "投影子矩阵（d/2×d/2），编码世界到图像的投影几何（论文 §3.1）"
          },
          {
            sym: "D<sub>s</sub><sup>RoPE</sup>",
            desc: "RoPE 子矩阵（d/2×d/2）；E-PRoPE 将其省略，因为 DiT 主干已提供足够的时空归纳偏置"
          },
          {
            sym: "S",
            desc: "全量 token 数：5 秒 720P 视频经 Wan2.2 5B VAE 压缩后为 18480"
          },
          {
            sym: "N",
            desc: "下采样后的 token 数：4096，超过 4.5 倍压缩"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "问题",
          desc: "全分辨率 PRoPE 几乎让注意力计算翻倍，训练和推理都吃不消。"
        },
        {
          icon: "🔧",
          title: "方案",
          desc: "空间下采样 token + 只留投影子矩阵 + 输出上采样后残差加回主干（论文 §3.1）。"
        },
        {
          icon: "✨",
          title: "数据",
          desc: "相机控制 73.75 对 73.89 基本持平，单段延迟从约 80 秒降到 59 秒（Table 1）。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "事件指令微调：一句话导演多个角色",
      badge: "both",
      badgeLabel: "核心",
      bridge: "相机会开了，接下来问：世界里的“事”能不能也听话？这一章看事件如何只通过文本接口注入模型。",
      analogy: {
        title: "一页手账，多枚印记",
        text: "真实世界的热闹从来不是独角戏：<b>雪在下、人在走、灯在亮</b>。组合事件指令就像在手账上连盖几枚章——<b>一条指令，多个角色同时登场</b>。",
        componentId: "ana-5"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "从单一事件到组合事件",
          desc: "点击切换「无事件 / 单一事件 / 组合事件」：组合档中车辆会避让横穿斑马线的行人、信号灯同步变红——多个实体在单次生成中互相响应，右侧查看对应的<b>结构化事件记录</b>（含实体间交互）。",
          componentId: "mod-5-1"
        }
      ],
      insight: "事件语义全部走文本条件接口进入模型——架构不变，能力新增（论文 §3.3）。",
      takeaways: [
        {
          icon: "🎯",
          title: "问题",
          desc: "公开系统普遍不支持“多实体、多动作、互相交互”的组合事件（论文 Table 2）。"
        },
        {
          icon: "🔧",
          title: "方案",
          desc: "层级标注（全局描述 + 实体级记录）+ 事件指令微调，保守更新与梯度裁剪保护预训练先验。"
        },
        {
          icon: "✨",
          title: "判断",
          desc: "事件能力是“数据标注 + 文本接口”的胜利，而不是架构改动。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "因果强制与 DMD 蒸馏：把老师傅的本事教给快车手",
      badge: "trn",
      badgeLabel: "训练细节",
      bridge: "交互要求实时，双向教师却太慢。这一章看论文如何用一条五步蒸馏流水线，把双向教师变成能流式交互的少步自回归模型。",
      analogy: {
        title: "沿着师傅的车辙练",
        text: "双向教师像老师傅，开得稳但<b>每一步都反复琢磨</b>；学生要学得又快又不跑偏，就得沿着师傅压出的<b>车辙</b>一遍遍练。",
        componentId: "ana-7"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "少步与质量的拉锯",
          desc: "拖动滑块改变每块的去噪步数：越少越快，但直接砍步会伤画质与相机可控性——这是需要蒸馏与训练补回质量的动机。",
          componentId: "mod-7-1"
        },
        {
          kind: "module",
          id: "6.2",
          title: "DMD-forcing 蒸馏流水线",
          desc: "沿流水线逐节点点击：因果强制少步基座 → 长视频适配 → 插入 E-PRoPE 相机分支 → 冻结双向教师在长视频局部窗口上做 DMD 蒸馏 → I2V 首帧条件变体（§3.4，Figure 7）。",
          componentId: "mod-7-2"
        }
      ],
      insight: "双向教师不必变成自回归也能教出流式学生：蒸馏只在长视频的局部窗口上进行，长程一致性交给自回归接口与 Infinity-RoPE（§3.4，Figure 7）。",
      takeaways: [
        {
          icon: "🎯",
          title: "问题",
          desc: "双向教师质量高但无法流式；直接砍步数或朴素自回归化，会撞上暴露偏差与画质、相机控制、长程稳定性的退化（§1、§3.4）。"
        },
        {
          icon: "🔧",
          title: "方案",
          desc: "一条五步流水线：因果强制训少步基座 → LongLive 式长展开 + Infinity-RoPE 适配长视频 → 插入 E-PRoPE 相机分支（LoRA）→ 冻结双向教师在长视频局部窗口上 DMD 蒸馏（相机退化时重复一遍）→ I2V 首帧条件变体（§3.4，Figure 7）。"
        },
        {
          icon: "✨",
          title: "数据",
          desc: "训练后的模型可稳定流式生成最长约 1 分钟的可控视频，跨块保持时序一致与相机跟随（§3.4）。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "流式推理：一块接一块地生成世界",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "蒸馏已经把双向教师变成少步自回归学生，接下来的工程问题是：推理时怎样边开边生成、还不丢上下文？这一章拆解分块流式推理。",
      analogy: {
        title: "开过一站，记下一笔",
        text: "长途驾驶不用背下全程——每开过一站，在<b>里程碑</b>上记一笔，下一段导航只需说“<b>从当前位置出发</b>”。",
        componentId: "ana-6"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "逐块生成与滚动缓存",
          desc: "用「下一步 / 上一步」逐块推进：看噪声如何变成画面、写入滚动 KV 缓存，以及相机口令为何按<b>块相对位姿</b>给出。",
          componentId: "mod-6-1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "问题",
          desc: "长视频不能整段重算，历史必须可携带、可流式。"
        },
        {
          icon: "🔧",
          title: "方案",
          desc: "逐块去噪 + 滚动 KV 缓存 + 块相对相机位姿；I2V 只需替换首块首帧（论文 §4.1）。"
        },
        {
          icon: "✨",
          title: "判断",
          desc: "流式的本质是“只带行李走”，而不是“每次回家重新出发”。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "记忆条件的场景持久化：回到老地方不走样",
      badge: "both",
      badgeLabel: "核心",
      bridge: "车越开越远，老地方滑出上下文窗口后，再回来时场景会不会“物是人非”？这一章是全文最关键的结构创新。",
      analogy: {
        title: "回老地方前，先翻相册",
        text: "人回到旧地会凭<b>当时拍的照片</b>校准记忆；模型也一样：按<b>相机几何</b>翻出最相关的老画面，再去生成今天的街景。",
        componentId: "ana-8"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "记忆如何打包进注意力",
          desc: "点击数据流图中的每个组件，看记忆帧、历史帧、目标帧如何拼进同一条自注意力流，以及<b>残差回收</b>为什么只扰动条件。",
          componentId: "mod-8-1"
        },
        {
          kind: "module",
          id: "8.2",
          title: "开回老地方：有记忆 vs 没记忆",
          desc: "拖动下方滑块让小车沿 U 形路线走一个来回：镜头视角随去程连续偏移、返程回正；无记忆一侧镜头回不正且街景<b>连续漂移变形</b>，有几何检索记忆的一侧按相机几何逐帧校准、视角与街景都不变。下方附论文 Figure 11 的三类重访轨迹实测（往返 / 平移加转向 / 闭环）。",
          componentId: "mod-8-2",
          figure: "/images/figure11.png"
        }
      ],
      insight: "记忆的敌人是“训练用真值、推理用自己生成画面”的曝光偏差——误差注入正是为此而设（论文 §3.2.3）。",
      formula: {
        lead: "记忆、历史与目标被打包成一条序列，损失只算在目标帧上：",
        unicode: "z<sub>pack</sub> = [ z<sub>M</sub> | z<sub>H</sub> | z<sub>C</sub><sup>τ</sup> ]",
        symbols: [
          {
            sym: "z<sub>M</sub>",
            desc: "记忆帧潜变量：按相机位姿与视角重叠检索到的早期干净帧（论文 §3.2.1-3.2.2）"
          },
          {
            sym: "z<sub>H</sub>",
            desc: "最近历史帧潜变量：目标窗口之前刚去噪的帧"
          },
          {
            sym: "z<sub>C</sub><sup>τ</sup>",
            desc: "加噪目标帧潜变量，唯一被监督的部分"
          },
          {
            sym: "τ",
            desc: "扩散噪声水平；训练采用标准 rectified flow 目标"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "问题",
          desc: "旧画面滑出上下文后，重访时场景会“物是人非”。"
        },
        {
          icon: "🔧",
          title: "方案",
          desc: "几何检索 + 原始时间位置重编码 + 残差回收抗误差（论文 §3.2，式 1）。"
        },
        {
          icon: "✨",
          title: "数据",
          desc: "重访增益 ΔPSNR 3.92、ΔDINO-Sim 0.246 等五个层面最高；SP-Match 与 CLIP-V 由 HY-WorldPlay 1.5 领先（Table 5）。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "强化学习对齐与推理加速：稳字当头",
      badge: "trn",
      badgeLabel: "训练细节",
      bridge: "蒸馏换来了速度，却伤了画质与可控性。最后一棒：用保守的 RL 把质量找回来，再用工程优化把速度推到实时。",
      analogy: {
        title: "调校到绿区",
        text: "蒸馏后的模型像一辆<b>待调校的车</b>：奖励拧得太猛会散架，恰到好处才能既快又稳——指针回到<b>绿区</b>。",
        componentId: "ana-9"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "强化学习对齐（§3.5）：技术清单",
          desc: "蒸馏换回速度后，用保守的 RL 后训练把画质与相机跟随找回来：",
          componentId: "mod-9-1"
        },
        {
          kind: "module",
          id: "9.2",
          title: "推理加速（§4.2）：流水线动画",
          desc: "点击切换「异步流水线 / 串行」：看去噪块（量化 DiT）与解码块（75% 剪枝 VAE + 8 卡分片）如何在时间上重叠，把 8×RTX 5090 推到 16 FPS。",
          componentId: "mod-9-2"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "定位",
          desc: "本节是成熟的工程组合拳而非创新点：RL 负责找回质量，加速栈负责推到实时。"
        },
        {
          icon: "🔧",
          title: "RL 对齐",
          desc: "长 rollout 保上下文、短片段计奖控显存；双奖励 + KL 正则 + DiffusionNFT 渐进更新（§3.5，Figure 8）。"
        },
        {
          icon: "✨",
          title: "推理加速",
          desc: "INT8/FP8 量化 + 序列并行 + Triton 融合 + TeaCache；75% 剪枝 VAE 单块 ≈0.25s + 异步流水线——8×RTX5090 最高 16 FPS（§4.2）。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "评测结果：强在哪里，还缺什么",
      badge: "both",
      badgeLabel: "核心",
      bridge: "所有机制都已就位，最后回到证据：三组互补评测加盲测人评，看清优势，也看清边界。",
      analogy: {
        title: "同一条终点线",
        text: "评测就像赛车：<b>同一起点、同一把尺</b>。三项评测、多个维度，比的不只是快慢，还有<b>记性与稳定</b>。",
        componentId: "ana-10"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "三组评测，一次看清",
          desc: "一张总表印证下方结论与边界：两项总分、30 秒相机控制、重访记忆指标（六项增益 + CLIP-V 绝对值，Tables 3-5 实测）；<b>点击表头指标名可查看含义</b>，每列第一加粗标 ★。",
          componentId: "mod-10-1"
        }
      ],
      formula: {
        lead: "相机控制的好坏由一个几何平均误差决定（逐帧计算后归一化，分数越高越好）：",
        unicode: "e<sub>camera</sub> = √( e<sub>θ</sub> · e<sub>t</sub> )",
        symbols: [
          {
            sym: "e<sub>θ</sub>",
            desc: "尺度不变的旋转误差（相对真值轨迹，位姿由 MegaSaM 估计）"
          },
          {
            sym: "e<sub>t</sub>",
            desc: "尺度不变的平移误差"
          },
          {
            sym: "e<sub>camera</sub>",
            desc: "相机误差；归一化为 [0,100] 分数，越高越好（论文 §5.1，式 2）"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "结论",
          desc: "5 秒总分 84.76、30 秒总分 70.41 均为第一；重访记忆六项增益指标中五项最高，CLIP-V 为绝对值口径（Tables 3-5）。"
        },
        {
          icon: "🔧",
          title: "边界",
          desc: "30 秒档相机控制三家最低（62.03 < 63.76 < 65.86）；SP-Match 与 CLIP-V 由 HY-WorldPlay 1.5 领先——如实呈现。"
        },
        {
          icon: "✨",
          title: "局限",
          desc: "长时程漂移、控制信号冲突、自动评测不完善（论文 §7）——世界模型仍在路上。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1NTrpBGEFE",
      title: "颠覆传统！下一代实时生成世界模型震撼发布！【PixVerse R1】",
      reason: "实时生成世界模型发布解读，帮助建立“实时可交互”的领域全景。",
      cover: "https://i2.hdslb.com/bfs/archive/1a782212274415dd20968cdcc0bc7329ae12d00b.jpg",
      views: "4.9万播放"
    },
    {
      bvid: "BV1ju4y1n7aj",
      title: "World Model！大火的世界模型到底是什么？",
      reason: "世界模型概念科普入门，适合零基础读者补背景。",
      cover: "https://i2.hdslb.com/bfs/archive/b9a856fb0edef0040e8c87154c17471a9f57e9f3.jpg",
      views: "1.4万播放"
    }
  ]
};
