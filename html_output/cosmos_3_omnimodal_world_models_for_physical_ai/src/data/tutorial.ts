import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Cosmos 3: Omnimodal World Models for Physical AI",
    titleZh: "Cosmos 3：面向物理 AI 的全模态世界模型",
    venue: "arXiv:2606.02800v4 · 2026",
    authors: "NVIDIA",
    affiliation: "NVIDIA",
    domain: "世界模型 · 多模态生成 · 物理智能",
    coreProblem: "分离的视觉语言模型（VLM）、世界生成模型与控制策略通常只交换摘要或低维状态，难以保留完整上下文，也无法端到端联合优化。",
    coreInsight: "Cosmos 3 将两类 token 置于同一序列：<b>AR（Autoregressive，自回归）</b>按顺序生成推理文本；<b>DM（Diffusion Model，扩散模型）</b>在该推理条件下恢复视觉、音频与动作。",
    keywords: [
      "4 分钟演示",
      "统一序列",
      "非对称注意力",
      "物理智能"
    ]
  },
  hero: {
    oldMethod: {
      desc: "理解、生成与控制由不同模型完成；跨模型接口可能压缩细粒度上下文。",
      componentId: "hero-contrast"
    },
    newMethod: {
      desc: "自回归推理与扩散生成进入同一序列；两类参数保持独立，并通过受约束的联合注意力传递上下文。",
      componentId: "hero-contrast"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-0",
      title: "五个基础概念",
      badge: "inf",
      badgeLabel: "计时前 · 60–90 秒",
      bridge: "World Model 描述如何根据当前状态与动作预测未来变化；Autoregressive（AR）与 Diffusion Model（DM）表示两种计算方式；Clean Condition 与 Noisy Target 表示扩散序列中的两种数据角色。",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "0.1",
          title: "查看术语的输入、作用与输出",
          desc: "比较五个概念的输入、核心作用、输出及其在 Cosmos 3 中的具体含义。",
          componentId: "ch0-glossary"
        }
      ],
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-1",
      title: "为什么要统一：跨模型接口的信息瓶颈",
      badge: "inf",
      badgeLabel: "0:00–0:30",
      bridge: "<b>研究问题。</b>分离式视觉语言模型、世界模型与控制策略通过中间表示连接；该接口可能压缩后续预测和控制所需的完整上下文。",
      analogy: {
        title: "统一层级：共享上下文 ≠ 统一原始编码器",
        text: "Cosmos 3 统一的是<b>可训练序列与计算上下文</b>；语言、视觉、音频和动作仍保留各自适合的编码路径。AR 表示自回归分支，DM 表示扩散生成分支。",
        componentId: "ana-ch1"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "分离式管线与统一序列",
          desc: "以“绕过障碍，从杯柄抓起左侧红杯”为同一任务，比较分离式模型接口可能产生的摘要压缩，与 Cosmos 3 保留 token 级上下文的统一序列。",
          componentId: "ch1-unification"
        },
        {
          kind: "module",
          id: "1.2",
          title: "模态专用编码器与公共表示维度",
          desc: "视觉理解采用视觉 Transformer（ViT），视觉生成采用冻结的视频压缩编码器（Wan2.2 VAE）；音频每秒约形成 25 个 token，动作向量经各机器人域专用的线性层投影到公共维度。",
          componentId: "ch2-modalities"
        }
      ],
      insight: "Cosmos 3 将<b>理解、生成和动作表述为可联合训练的序列建模问题</b>，同时保留模态专用编码路径。",
      takeaways: [
        {
          icon: "①",
          title: "问题",
          desc: "模型接口会形成 token 级信息瓶颈。"
        },
        {
          icon: "②",
          title: "目标",
          desc: "让理解、生成、动作共享序列上下文。"
        },
        {
          icon: "③",
          title: "边界",
          desc: "各模态编码器仍然保持专门化。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "统一序列：用干净条件与加噪目标定义任务",
      badge: "both",
      badgeLabel: "0:30–1:10",
      bridge: "<b>任务定义。</b>自回归（AR）子序列位于前部；扩散（DM）子序列中，干净条件（clean condition）位于加噪目标（noisy target）之前。改变条件与目标的组合即可表示多种任务。",
      analogy: {
        title: "任务角色：干净条件与加噪目标",
        text: "同一视觉或动作信息保持原值时作为生成条件；被加入噪声时，则作为模型需要恢复并计算损失的预测目标。",
        componentId: "ana-ch3"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "统一序列的组成与排列",
          desc: "Cosmos 3 将序列分为前部的自回归子序列与后部的扩散子序列；扩散子序列内部按干净条件在前、加噪目标在后排列。",
          componentId: "ch3-token-layout"
        }
      ],
      insight: "Cosmos 3 的任务接口主要由<b>序列顺序、干净条件集合与加噪目标集合</b>定义，无需为每个任务重新搭建一套模型。",
      formula: {
        lead: "<span class='eq-ref'>论文 Eq. (5)</span> 视频迁移（V2V）的序列排列：自回归语言前缀在前，P 个干净的压缩视频帧作为条件，其余帧被加噪并作为预测目标。",
        unicode: "<span class='eq-line'>S<sub>V2V</sub> = [ S<sub>AR</sub> , v<sub>1:P</sub> , ṽ<sub>P+1:N</sub> ]</span>",
        symbols: [
          {
            sym: "AR",
            desc: "S_AR=[l₁,…,lₙ,〈EOS〉,〈BOG〉]：语言与特殊标记构成的自回归前缀"
          },
          {
            sym: "ṽ",
            desc: "ṽ：经视频压缩编码器处理后加入噪声、需要由扩散分支恢复的视频表示"
          },
          {
            sym: "v",
            desc: "v：保持原值并作为生成条件的视觉表示"
          },
          {
            sym: "P",
            desc: "P：作为条件的压缩视频帧数量；P=1 时对应图生视频"
          },
          {
            sym: "N",
            desc: "N：完整压缩视频的帧数"
          }
        ]
      },
      takeaways: [
        {
          icon: "①",
          title: "推理在前",
          desc: "先形成语言或视觉的自回归前缀。"
        },
        {
          icon: "②",
          title: "条件在前",
          desc: "条件保持原值且不参与去噪损失。"
        },
        {
          icon: "③",
          title: "加噪项是目标",
          desc: "视觉、音频和动作均可成为预测对象。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "核心架构：非对称注意力与双分支参数",
      badge: "both",
      badgeLabel: "1:10–2:05",
      bridge: "<b>架构约束。</b>自回归分支的查询（query）仅按因果顺序读取自回归 token；扩散分支可读取自回归条件与全部扩散 token。该结构称为 MoT（Mixture-of-Transformers，双 Transformer 分支）。",
      analogy: {
        title: "信息流约束：推理条件单向传给生成目标",
        text: "信息只允许从自回归条件流向扩散目标。反向读取会造成目标泄漏，即训练时提前看到本应预测的内容，并破坏预训练视觉语言模型的因果生成方式。",
        componentId: "ana-ch4"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "比较正确注意力掩码与两种错误设置",
          desc: "注意力掩码规定每一类查询可以读取哪些 token。“论文掩码”是 Cosmos 3 使用的正确设置；另外两个按钮是人为构造的故障对照，不是论文提出的替代方法，分别用于展示目标泄漏和条件断开。",
          componentId: "ch4-attention-mask"
        },
        {
          kind: "module",
          id: "3.2",
          title: "双 Transformer 分支的参数与信息交换",
          desc: "自回归分支与扩散分支各自拥有独立的归一化层、注意力投影和前馈网络参数；两者由同一个预训练视觉语言模型初始化，但训练后不共享这些参数。",
          componentId: "ch8-mot-architecture",
          figure: "./images/figure-5.png"
        }
      ],
      insight: "Cosmos 3 以<b>分支独立参数</b>保持推理与生成的专门化，并以<b>非对称联合注意力</b>将推理条件传给生成分支。",
      formula: {
        lead: "<span class='eq-ref'>论文 Eq. (7–8)</span> 自回归分支使用因果自注意力；扩散分支使用全双向注意力，其键和值由两个子序列拼接而成。",
        unicode: "<span class='eq-line'>O<sub>AR</sub> = Attn<sub>causal</sub>(Q<sub>AR</sub>, K<sub>AR</sub>, V<sub>AR</sub>)</span><span class='eq-line'>O<sub>DM</sub> = Attn<sub>full</sub>(Q<sub>DM</sub>, [K<sub>AR</sub>; K<sub>DM</sub>], [V<sub>AR</sub>; V<sub>DM</sub>])</span>",
        symbols: [
          {
            sym: "Q",
            desc: "Q（查询）：表示当前位置正在检索什么；两分支使用各自的投影参数"
          },
          {
            sym: "K",
            desc: "K（键）：表示可被匹配的信息索引；扩散分支同时使用两类键"
          },
          {
            sym: "V",
            desc: "V（值）：匹配后实际读取的内容；扩散分支同时使用两类值"
          }
        ]
      },
      takeaways: [
        {
          icon: "①",
          title: "推理保持因果",
          desc: "自回归 token 不读取扩散目标。"
        },
        {
          icon: "②",
          title: "生成读取条件",
          desc: "扩散分支访问推理前缀与扩散上下文。"
        },
        {
          icon: "③",
          title: "参数独立",
          desc: "联合注意力不表示两分支共享投影权重。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "训练与生成：自回归预测与直线路径流匹配",
      badge: "trn",
      badgeLabel: "2:05–2:40",
      bridge: "<b>训练目标。</b>推理模型（Reasoner）预测下一个离散 token；生成模型（Generator）由 Reasoner 权重初始化，再以 masked Rectified Flow（直线路径流匹配）损失学习连续模态生成。",
      analogy: {
        title: "优化目标：离散自回归与连续流匹配",
        text: "自回归分支预测下一个离散 token 的概率；扩散分支学习连续压缩表示从噪声返回数据的速度。二者共享上下文，但优化目标和推理算法不同。",
        componentId: "ana-ch7"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "调节噪声水平，观察流匹配的监督目标",
          desc: "调节 σ 可观察 xσ 在干净数据 x₀ 与噪声 ε 之间的线性插值；监督速度 v*=ε−x₀ 不随 σ 改变。干净条件被掩码排除，不计入这些位置的均方误差。",
          componentId: "ch7-flow-training"
        },
        {
          kind: "module",
          id: "4.2",
          title: "自回归续写与扩散恢复的推理顺序",
          desc: "该模块依次展示条件输入、自回归续写、目标噪声初始化、扩散迭代求解与输出。离散状态仅用于说明推理次序，不代表论文采用的采样步数。",
          componentId: "ch6-inference"
        }
      ],
      insight: "训练流程先获得推理模型的语义与物理智能表示，再以其权重初始化生成模型，并继续学习连续生成目标。",
      formula: {
        lead: "<span class='eq-ref'>论文 Sec. 4.2 · 未编号公式</span> x₀ 是干净的压缩目标，ε 是同形状高斯噪声，σ∈[0,1]；带掩码的均方误差仅监督加噪目标。",
        unicode: "<span class='eq-line'>x<sub>σ</sub> = σ ε + (1−σ) x<sub>0</sub></span><span class='eq-line'>v<sup>*</sup>(x<sub>σ</sub>, σ) = ε − x<sub>0</sub></span>",
        symbols: [
          {
            sym: "x",
            desc: "x₀：干净的压缩目标；xσ：噪声水平 σ 下的插值状态"
          },
          {
            sym: "ε",
            desc: "ε∼𝒩(0,I)：与目标表示同形状的高斯噪声"
          },
          {
            sym: "σ",
            desc: "σ∈[0,1]：噪声水平"
          },
          {
            sym: "v",
            desc: "v*：rectified-flow 的监督速度 ε−x₀"
          }
        ]
      },
      takeaways: [
        {
          icon: "①",
          title: "推理模型",
          desc: "预测下一个离散 token。"
        },
        {
          icon: "②",
          title: "生成模型",
          desc: "学习连续表示的速度场。"
        },
        {
          icon: "③",
          title: "条件不加噪",
          desc: "损失只作用于加噪目标位置。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "物理智能接口：物理时间与动作表示",
      badge: "both",
      badgeLabel: "2:40–3:20",
      bridge: "<b>时序与动作接口。</b>视频、音频和动作每秒产生的 token 数不同，需要映射到同一物理时间轴；动作也可被设为干净条件或加噪目标。",
      analogy: {
        title: "时间坐标：序列索引 ≠ 物理时间",
        text: "视频、音频和动作每秒产生的 token 数不同。若直接使用离散序号，同一真实时刻会落在不同位置；论文据每秒 token 数重新标定位置增量。",
        componentId: "ana-ch8"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "由每秒 token 数计算物理时间位置增量",
          desc: "切换视频、音频与动作可比较 Δt=TPSbase/TPS，其中 TPS 表示每秒 token 数。音频约为 25 token/s，视觉基准为 24 FPS÷4=6 token/s；TPS 越大，单个 token 的时间位置增量越小。",
          componentId: "ch8-time-alignment"
        },
        {
          kind: "module",
          id: "5.2",
          title: "前向动力学、逆动力学与策略生成",
          desc: "前向动力学（FD）以状态和动作预测未来视觉；逆动力学（ID）以起始/目标视觉估计动作；策略（Policy）联合预测未来视频与动作。动作向量经域专用投影进入公共隐空间。",
          componentId: "ch9-action-interface"
        }
      ],
      insight: "动作被建模为与视觉、音频并列的<b>连续扩散模态</b>，从而使状态预测、动作估计和策略生成共享序列接口。",
      formula: {
        lead: "<span class='eq-ref'>论文 Eq. (9)</span> TPSm 表示模态 m 每秒产生的 token 数；视觉基准采用 24 帧/秒和视频压缩编码器的 4 倍时间压缩率。",
        unicode: "<span class='eq-line'>Δt<sub>m</sub> = TPS<sub>base</sub> / TPS<sub>m</sub></span><span class='eq-line'>TPS<sub>base</sub> = 24 fps / 4 = 6 token/s</span>",
        symbols: [
          {
            sym: "TPS",
            desc: "TPSm：模态 m 每物理秒产生的 token 数"
          },
          {
            sym: "base",
            desc: "TPSbase：压缩视频表示的基准速率 6 token/s"
          },
          {
            sym: "Δt",
            desc: "Δtm：模态 m 相邻 token 的时间位置增量"
          }
        ]
      },
      takeaways: [
        {
          icon: "①",
          title: "统一物理时间",
          desc: "位置编码反映真实秒而非 token 序号。"
        },
        {
          icon: "②",
          title: "动作正式入模",
          desc: "动作可以是条件，也可以是加噪目标。"
        },
        {
          icon: "③",
          title: "三类任务",
          desc: "同一序列覆盖前向动力学、逆动力学与策略生成。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "证据与边界：广覆盖不等于全面领先",
      badge: "both",
      badgeLabel: "3:20–4:00",
      bridge: "<b>主要定量结果。</b>Physics-IQ 用于评估生成视频的物理一致性；音频质量、合成域到真实域的差距与多任务权衡构成结论边界。",
      analogy: {
        title: "评测口径：异质指标不可直接合成",
        text: "UniGenBench、Physics-IQ、SoundBench 与机器人指标使用不同量尺。任何结果都必须连同数据集、评测协议、指标方向和候选筛选方法一起解读。",
        componentId: "ana-ch10"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "用 Physics-IQ 结果检验物理一致性主张",
          desc: "选择 Physics-IQ 后运行比较：Cosmos3-Super 的图生视频（I2V）直接生成得分为 43.8，经 WMReward 从 N 个候选中择优（BoN）后为 48.9；视频迁移（V2V）分别为 59.7 与 63.4。",
          componentId: "ch10-evidence-race"
        }
      ],
      insight: "实验支持 Cosmos 3 的<b>跨理解、生成、音频与动作统一建模能力</b>；同时，音频感知质量、合成域到真实域的差距，以及前向动力学图像质量下降表明其优势并非覆盖全部指标。",
      takeaways: [
        {
          icon: "①",
          title: "支持主张",
          desc: "Physics-IQ 中 I2V/V2V 均有竞争力。"
        },
        {
          icon: "②",
          title: "协议边界",
          desc: "提高后的分数包含 WMReward 候选择优。"
        },
        {
          icon: "③",
          title: "结论克制",
          desc: "统一能力不等于所有指标全面领先。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV11LPWzNEkm",
      title: "全面解析“世界模型”：定义、路线、实践与 AGI 的更近一步",
      reason: "从定义、路线和应用层面建立世界模型全景，适合课前补背景。",
      cover: "https://i2.hdslb.com/bfs/archive/11c45d3be6a74137d3889bef7f5a5c014dac8ba5.jpg",
      views: "25.6万播放"
    },
    {
      bvid: "BV1s4X5B1EBP",
      title: "世界是虚拟的吗？为什么要搭建世界模型？",
      reason: "用自动驾驶和机器人例子解释为何需要模拟物理世界。",
      views: "22.9万播放"
    },
    {
      bvid: "BV1hxfSYLEfc",
      title: "英伟达官宣首个世界基础模型 Cosmos",
      reason: "介绍 NVIDIA Cosmos 的发布背景，帮助区分平台谱系与本文的新统一机制。",
      views: "12.6万播放"
    },
    {
      bvid: "BV182c6eoELc",
      title: "英伟达 Cosmos：为物理 AI 搭建世界基础模型平台",
      reason: "直接聚焦 Cosmos 世界基础模型平台，适合作为论文谱系补充。",
      cover: "https://i0.hdslb.com/bfs/archive/2e3e156e297bc8fa5efa404dda67593c67e388b7.jpg",
      views: "4296播放"
    }
  ]
};
