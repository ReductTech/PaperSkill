import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Scal3R: Scalable Test-Time Training for Large-Scale 3D Reconstruction",
    titleZh: "Scal3R：面向大规模三维重建的可扩展测试时训练",
    venue: "arXiv 2026 (arXiv:2604.08542v1)",
    authors: "Tao Xie, Peishan Yang, Yudong Jin, Yingfeng Cai, Wei Yin, Weiqiang Ren, Qian Zhang, Wei Hua, Sida Peng, Xiaoyang Guo, Xiaowei Zhou",
    affiliation: "浙江大学 · 地平线（Horizon Robotics）",
    domain: "三维重建 · 前馈位姿与深度 · 测试时训练 · 长序列扩展",
    coreProblem: "VGGT 式统一 Transformer 把所有帧放进一次全局注意力，代价随帧数<b>平方</b>增长；序列一长（大场景），显存就会爆掉（连 A800 也 OOM），无法扩展。",
    coreInsight: "任务：对长视频序列进行大规模三维场景重建",
    keywords: [
      "三维重建",
      "长序列扩展",
      "测试时训练",
      "全局上下文记忆",
      "上下文并行"
    ]
  },
  hero: {
    oldMethod: {
      desc: "<b>VGGT：一次看完整条路。</b>所有帧塞进一次全局注意力，代价 O(N²)——序列一长，“地图纸”被撑裂，显存 OOM。",
      componentId: "hero-old"
    },
    newMethod: {
      desc: "<b>Scal3R：分块 + 共享记录本 + 同步。</b>重叠分块并行、全局上下文记忆压缩全局信息、测试时校准、跨块同步，拼成一张一致地图。",
      figure: "/images/scal3r_overview.png",
      componentId: "hero-new"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "一次记不全整条路",
      badge: "both",
      badgeLabel: "问题",
      bridge: "本节建立问题与全书主线：为什么“一次看完整条路”行不通，从而引出“分块 + 共享记忆”的必要性。",
      analogy: {
        title: "一眼看完整条路？",
        text: "想<b>一次</b>把整条山路记在脑子里，路一长就<b>记不下、要崩</b>。",
        componentId: "ana-overview"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "路越长，显存呈平方级增长",
          desc: "让学习者亲手感到“帧数↑ → 代价平方↑ → 越过红线就 OOM”。拖动序列长度 <code>N</code>，看显存条按 <b>N²</b> 升高。",
          componentId: "mod-scale-wall"
        }
      ],
      insight: "分块思想：既然一次装不下，就把长路切成一段一段地走",
      formulaAfter: "1.1",
      insightAfter: "1.1",
      formula: {
        lead: "VGGT 用一个统一 Transformer 把整段图像映射成<b>每帧的几何标注</b>：相机参数、深度图、点图、点跟踪特征网格。<br/><b>问题所在：</b>这次全局注意力的代价随帧数 N <b>平方级增长（O(N²)）</b>，无法扩展到公里级长序列。",
        unicode: "f( {I<sub>i</sub>}<sub>i=1</sub><sup>N</sup> ) = { g<sub>i</sub>, D<sub>i</sub>, P<sub>i</sub>, T<sub>i</sub> }<sub>i=1</sub><sup>N</sup>",
        symbols: [
          {
            sym: "f",
            desc: "VGGT 主干（统一 Transformer，一次前向处理全部 N 帧）"
          },
          {
            sym: "I",
            desc: "第 i 帧输入 RGB 图像 I<sub>i</sub>"
          },
          {
            sym: "g",
            desc: "第 i 帧相机参数 g<sub>i</sub>（内参 + 外参）"
          },
          {
            sym: "D",
            desc: "第 i 帧深度图 D<sub>i</sub>"
          },
          {
            sym: "P",
            desc: "第 i 帧点图 P<sub>i</sub>（point map）"
          },
          {
            sym: "T",
            desc: "第 i 帧点跟踪特征网格 T<sub>i</sub>（feature grid for point tracking）"
          },
          {
            sym: "N",
            desc: "序列帧数；全局注意力代价随 N 平方增长（O(N²)），是长序列 OOM 的根因"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "目标",
          desc: "从很长的图像序列一次重建整座场景。"
        },
        {
          icon: "🔧",
          title: "瓶颈",
          desc: "全局注意力 O(N²)，序列一长就 OOM。"
        },
        {
          icon: "✨",
          title: "出路",
          desc: "切块并行 + 共享全局信息（后续各章展开）。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "分块：把长路切成有重叠的段",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "本节讲清输入表示——把长序列切成有重叠的块并多卡并行，这是整套方法的骨架；同时揭示分块带来的新代价：块间漂移。",
      analogy: {
        title: "一段一段地走",
        text: "把长路切成<b>有重叠</b>的小段，逐段测量，重叠处留作<b>对齐的公共桩</b>。",
        componentId: "ana-segments"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "逐段推进，看清重叠",
          desc: "点“上一段/下一段”一步步走完各块，理解<b>块</b>与<b>重叠</b>的关系：当前块高亮为蓝，重叠带用蓝软色标出与相邻块的公共帧。",
          componentId: "mod-chunking"
        },
        {
          kind: "module",
          id: "2.2",
          title: "为什么分块能把平方变线性",
          desc: "拖动 <code>N</code>，用<b>注意力矩阵</b>看懂原理：一次全局要点亮整块 <b>N×N</b>（亮格∝N²）；分块后每帧只在本块 <b>M</b> 帧内互相看，只点亮对角线上 <b>K=N/M</b> 个 <b>M×M</b> 小块——总亮格 <b>K·M²=N·M</b>，M 是常数，于是随 N <b>线性</b>增长。",
          componentId: "mod-why-linear"
        },
        {
          kind: "module",
          id: "2.3",
          title: "平方增长 vs 近似线性",
          desc: "用同一个 <code>N</code> 对比“一次全局”与“分块并行”的代价曲线：红色 <b>O(N²)</b> 很快撑爆，蓝色近似线性可扩展。",
          componentId: "mod-cost-compare"
        },
        {
          kind: "module",
          id: "2.4",
          title: "分块的代价：接缝对不上",
          desc: "分块省了显存，却带来新问题。拖动<code>块数 K</code>：每次只看本块、<b>各自估计方向与尺度</b>，重叠帧被相邻两块放到<b>不同位置</b>——红叉处接缝对不上；误差<b>一段段累加</b>，块数越多，红色估计轨迹相对灰色真值<b>越远</b>。",
          componentId: "mod-chunk-drift"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "分块",
          desc: "长序列 → 多个可并行处理的窗口。"
        },
        {
          icon: "🔧",
          title: "重叠",
          desc: "相邻块留公共帧，作对齐用。"
        },
        {
          icon: "⚠️",
          title: "新代价",
          desc: "块间独立 → 接缝对不上、漂移随块数累积。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "全局上下文记忆GCM：捕获和存储长距离上下文信息",
      badge: "both",
      badgeLabel: "核心创新",
      bridge: "本节分两步讲清核心创新 <b>GCM</b> 的架构：<b>3.1</b> 它是什么：由若干轻量子网络 AMU 承载的动态记忆；3.2它怎么接进主干：用可学习门控 α 做残差融合。",
      analogy: {
        title: "一本页数固定的记录本",
        text: "测量员走几百个观测点，兜里只揣<b>一本页数固定的记录本</b>：每到一处，就把要点<b>压缩成一行</b>记下；无论路多长，本子厚度不变，随手一翻就知道“大致到哪、坡朝哪”。这本被全程共享、大小不变的记录本，就是 <b>GCM</b>。",
        componentId: "ana-logbook"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "GCM 是什么",
          desc: "<b>GCM（Global Context Memory，全局上下文记忆）</b>是 Scal3R 在 <b>VGGT</b> 主干上新增的核心神经模块，作用是<b>捕捉并存储跨块的长程上下文</b>，让分块并行处理的各段仍能共享“全局大局观”。<br/><br/>它由三部分组成：① <b>QKV 投影层</b>——把输入 token 投影成键 K、值 V、查询 Q；② 一个<b>紧凑 MLP，充当若干 AMU（自适应记忆单元）</b>（真正“记东西”的地方）；③ <b>输出投影层</b>。",
          figure: "/images/amu.png"
        },
        {
          kind: "module",
          id: "3.2",
          title: "怎么接进主干：门控残差",
          desc: "GCM <b>接在全局注意力层之后</b>。原始 VGGT 是“帧内 fattn → 帧间 gattn”再残差（式 2）；接入 GCM 后，用<b>可学习门控向量 α</b> 把 GCM 输出的长程上下文残差融合回主干（式 3）。拖动<b>门控强度 α</b>：<code>α=0</code> 退化为式 2（只有块内上下文），α 越大，越多全局上下文流入、跨块一致性越好。全文共接 <b>4 个</b> GCM。",
          componentId: "mod-gcm-integrate"
        }
      ],
      formulaAfter: "3.2",
      formula: {
        lead: "3.2涉及公式：",
        unicode: "gate(GCM, X<sup>i</sup><sub>k</sub>; α) = α ⊗ GCM(X<sup>i</sup><sub>k</sub>) + X<sup>i</sup><sub>k</sub>　(1)<br/>X̄<sup>i</sup><sub>k</sub> = gattn( fattn(X<sup>i</sup><sub>k</sub>) ) + X<sup>i</sup><sub>k</sub>　(2)<br/>X̄<sup>i</sup><sub>k</sub> = gate(GCM, gattn( fattn(X<sup>i</sup><sub>k</sub>) ); α) + X<sup>i</sup><sub>k</sub>　(3)",
        symbols: [
          {
            sym: "GCM",
            desc: "全新的<b>神经全局上下文记忆模块</b>：接在<b>全局注意力层之后</b>，用于捕捉并存储长程上下文；其记忆参数由若干轻量子网络 <b>AMU（自适应记忆单元）</b>承载，破 RNN 固定隐藏状态的容量瓶颈。全文共接 <b>4 个</b>"
          },
          {
            sym: "α",
            desc: "<b>可学习门控向量</b>（α ∈ ℝ<sup>d</sup>）：自适应地平衡 GCM 输出与原始 token 的相对权重，以残差形式写回主干"
          },
          {
            sym: "gate",
            desc: "门控残差融合算子：α ⊗ GCM(X) 为门控后的记忆增量，再加回原 token X"
          },
          {
            sym: "fattn",
            desc: "<b>帧内注意力</b>（intra-frame attention）：VGGT 交替注意力中处理单帧内部的部分"
          },
          {
            sym: "gattn",
            desc: "<b>帧间/全局注意力</b>（inter-frame attention）：VGGT 交替注意力中跨帧聚合的部分；GCM 正是接在这一层之后"
          },
          {
            sym: "X",
            desc: "token 表示 X<sup>i</sup><sub>k</sub>：第 k 块、第 i 个全局注意力层的输出 token；X̄<sup>i</sup><sub>k</sub> 为增强后送往输出头的全局上下文 token"
          }
        ]
      },
      takeaways: [
        {
          icon: "🧠",
          title: "AMU 承载记忆",
          desc: "GCM 记忆参数由若干轻量子网络 AMU 承载，破 RNN 固定状态容量瓶颈。"
        },
        {
          icon: "🔌",
          title: "接在全局注意力层",
          desc: "建于 VGGT 之上，GCM 接在全局注意力层之后，全文共 4 个。"
        },
        {
          icon: "🎚️",
          title: "门控残差融合",
          desc: "可学习门控 α 把长程上下文残差写回主干（式 1–3），保留 VGGT 几何能力。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "测试时训练TTT：扩大记忆容量和增强计算效率",
      badge: "both",
      badgeLabel: "核心",
      bridge: "本节讲清核心创新 TTT/AMU 的更新机制：在<b>测试时</b>用<b>自监督</b>目标、以整块为单位现场更新记忆，校准到当前这段真实地形。",
      analogy: {
        title: "按这段地形校准自己",
        text: "不靠预设，<b>现场</b>按脚下地形把步幅（记忆）<b>校准</b>到最合适。",
        componentId: "ana-calibrate"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "一步步做测试时更新",
          desc: "点“下一步”逐步执行“读当前块→算<b>自监督损失</b>→更新记忆”，步幅与坡度越来越吻合、<code>损失</code>逐步下降。",
          componentId: "mod-ttt-loop"
        }
      ],
      formula: {
        lead: "在推理时，把整块 token 当作<b>单一更新单元</b>，用<b>自监督点积损失</b>对AMU的快速权重 <b>W</b> 做<b>内循环</b>梯度更新（式 4）；损失取点积形式（式 5）。更新后的 W 存下本块上下文，再用它把查询 Q 变换为输出（<b>块级更新</b>，提升并行度与 GPU 利用率）。",
        unicode: "W ← W − ∇<sub>W</sub> Σ<sub>i=1</sub><sup>M</sup> η<sub>i</sub> ℒ( f<sub>W</sub>(k<sub>i</sub>), v<sub>i</sub> )　(4)<br/>ℒ( f<sub>W</sub>(K), V ) = Σ<sub>i=1</sub><sup>M</sup> −f<sub>W</sub>(k<sub>i</sub>)<sup>⊤</sup> v<sub>i</sub>　(5)",
        symbols: [
          {
            sym: "W",
            desc: "AMU 的<b>快速权重</b>（fast weights）：测试时被内循环在线更新的动态记忆载体，容量远大于 RNN 固定隐藏状态"
          },
          {
            sym: "f",
            desc: "记忆单元网络 f<sub>W</sub>（AMU，轻量非线性子网络）：用快速权重 W 把键/查询映射为输出"
          },
          {
            sym: "k",
            desc: "第 i 个 token 的键 k<sub>i</sub>；整块的键矩阵记作 K"
          },
          {
            sym: "v",
            desc: "第 i 个 token 的值 v<sub>i</sub>；整块的值矩阵记作 V（自监督点积损失的目标）"
          },
          {
            sym: "M",
            desc: "分块大小（块内 token 数）：Σ 从 1 到 M 表示<b>整块作为单一更新单元</b>——即块级更新"
          },
          {
            sym: "η",
            desc: "由输入预测的<b>逐 token 学习率</b> η<sub>i</sub>（内循环更新步长）"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "TTT",
          desc: "测试时用自监督目标现场更新记忆。"
        },
        {
          icon: "🔧",
          title: "整块更新",
          desc: "以块为单位（LaCT 式），稳定高效。"
        },
        {
          icon: "✨",
          title: "贴合地形",
          desc: "让记忆贴合“真实地形”，而非死记预训练。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "全局上下文同步（GCS）",
      badge: "trn",
      badgeLabel: "",
      bridge: "让并行的块保持一致的关键机制：全局上下文同步（GCS）：各块在测试时更新记忆时把梯度对齐，保证学到一致的全局信息。",
      analogy: {
        title: "播给所有人",
        text: "各块把更新<b>对齐</b>（all-reduce），大家的记录本才一致。",
        componentId: "ana-radio"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "GCS 在做什么：把各块的记忆连成全局",
          desc: "<b>为什么需要它：</b>上一章的 <b>GCM</b> 只能记住<b>本块内部</b>的上下文，块与块之间彼此看不见，缺了<b>整条序列</b>的全局视野；而大场景重建恰恰需要各块<b>一致</b>。<br/><br/><b>怎么做：</b>把“分块分到不同 GPU”看作一种<b>上下文并行</b>：每张 GPU 先<b>各自</b>算出本块 AMU 记忆的<b>梯度更新</b>；随后把所有 GPU 的这份梯度<b>相加</b>、再<b>广播</b>回每一张卡。这样每块的记忆里都写进了<b>整条序列</b>的观测，实现真正的“全局上下文共享”。<br/><br/><b>用在哪：训练和推理均使用。每个局部块都被全局信息增强，既提升单块精度，又加强跨块一致性，最终完成公里级的一致重建。"
        }
      ],
      formula: {
        lead: "把 K 个块各自的记忆梯度<b>相加</b>（all-reduce 求和后广播回每张卡），得到<b>同步梯度</b> g，再用它统一更新每块的 AMU 记忆。",
        unicode: "g = ∇<sub>W</sub> Σ<sub>j=1</sub><sup>K</sup> Σ<sub>i=1</sub><sup>M</sup> η<sub>i</sub> ℒ<sub>i</sub> = Σ<sub>j=1</sub><sup>K</sup> ∇<sub>W</sub> Σ<sub>i=1</sub><sup>M</sup> η<sub>i</sub> ℒ<sub>i</sub>",
        symbols: [
          {
            sym: "g",
            desc: "<b>同步后的记忆梯度</b>：对 K 个块的本地梯度<b>求和</b>后广播回每张 GPU，用它统一更新 AMU 快速权重 W"
          },
          {
            sym: "K",
            desc: "并行的块数（每块放在一张 GPU 上，即“上下文并行”的并行度）"
          },
          {
            sym: "ℒ",
            desc: "块内的自监督点积损失 ℒ<sub>i</sub>（与式 5 一致）；η<sub>i</sub> 为逐 token 学习率"
          },
          {
            sym: "∇<sub>W</sub>",
            desc: "对 AMU 快速权重 W 求梯度；求和与求梯度可交换，故先各块求梯度、再 all-reduce 相加等价"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "GCS",
          desc: "各块本地梯度 all-reduce 求和再广播（上下文并行）。"
        },
        {
          icon: "🔧",
          title: "作用",
          desc: "补上 GCM 缺的跨块视野，训练与推理都用。"
        },
        {
          icon: "✨",
          title: "证据",
          desc: "消融去掉 GCS，ATE 13.70→15.80。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "Scal3R 架构",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "本节交互式讲清网络结构与 GCM 的插入位置：主干各站点做什么，以及 4 个 GCM 放在哪几层后。",
      analogy: {
        title: "装好整套仪器",
        text: "在主干的<b>特定几层后</b>挂上记忆单元，整套装备才完整。",
        componentId: "ana-toolbelt"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "点开每个模块看它做什么",
          desc: "点击主干各站点，<b>高亮该组件</b>、点亮到它的数据通路并给出说明；<code>GCM</code> 以紫色 ×4 标注，插在第 4/11/17/24 层后。",
          componentId: "mod-architecture"
        },
        {
          kind: "module",
          id: "6.2",
          title: "放几个、放在哪",
          desc: "切换 GCM 数量变体“1 个 / 2 个 / 4 个（本文）”，看<b>参数量与精度</b>的权衡；论文只报告到 4 个。",
          componentId: "mod-gcm-placement"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "主干",
          desc: "Encoder→Frame/Global Attn→GCM→Decoder→对齐。"
        },
        {
          icon: "🔧",
          title: "插入",
          desc: "第 4/11/17/24 层后各一 GCM，共 4 个、75.55M。"
        },
        {
          icon: "✨",
          title: "特点",
          desc: "GCM 是可插拔的全局记忆模块。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "训练目标与实验设置",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "① <b>损失函数</b> ② <b>实验设置</b>：优化器、学习率、步数、硬件等训练参数",
      analogy: {
        title: "三项质检",
        text: "一张好地图要同时过<b>相机、深度、点图</b>三关,缺一关就不合格。",
        componentId: "ana-checklist"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "损失函数",
          desc: "",
          componentId: "mod-loss-formula"
        },
        {
          kind: "module",
          id: "7.2",
          title: "实验设置",
          desc: "GCM 与 VGGT 主干<b>端到端联合训练</b>的关键参数一览:优化器、学习率、调度、梯度裁剪、步数与硬件、训练数据与长度泛化技巧——逐项摘自论文 4.3。",
          componentId: "mod-train-setup"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "目标",
          desc: "相机 + 深度 + 点图三项联合损失"
        },
        {
          icon: "🔧",
          title: "设置",
          desc: "AdamW、GCM 1e-4/主干 1e-5、32×A800等"
        },
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "结果：Scal3R表现",
      badge: "both",
      badgeLabel: "直觉·结果",
      bridge: "本节汇总结果、对比、边界与总结：Scal3R 在相机位姿与几何上达到 SOTA、推理时间随序列近似线性，同时明确它在光照突变或视角极稀疏时会失效。",
      analogy: {
        title: "谁先到顶",
        text: "更少漂移、更快拼齐的方法，<b>更快、更准</b>地登顶。",
        componentId: "ana-summit"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "开始比拼：谁的漂移小",
          desc: "点“开始比拼”，让 Scal3R 与基线沿真值轨迹竞速：<b>Scal3R</b> 最贴合真值、率先登顶，（VKITTI2 <code>ATE</code> 0.85）。",
          componentId: "mod-race"
        },
        {
          kind: "module",
          id: "8.2",
          title: "数字面板：几何与运行时",
          desc: "点两枚芯片“几何 / 运行时”切换证据面板：几何看 ETH3D <code>CD</code> 0.11（越低越好）/ <code>F1</code> 0.91（越高越好），运行时看推理时间随序列长度的近似线性折线（Table 5）。",
          componentId: "mod-results-table"
        },
        {
          kind: "module",
          id: "8.3",
          title: "演示：大场景一次拼齐",
          desc: "浙江大学大场景重建 hero 视频：",
          componentId: "mod-video"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "结果",
          desc: "位姿与几何双 SOTA（VKITTI2 ATE 0.85；ETH3D CD 0.11/F1 0.91）。"
        },
        {
          icon: "🔧",
          title: "扩展",
          desc: "推理时间随序列近似线性（Table 5）。"
        },
        {
          icon: "🎬",
          title: "定性",
          desc: "大场景演示视频：长序列一次拼成一致地图，无明显漂移。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "边界与改进：会在哪失效，怎么补",
      badge: "both",
      badgeLabel: "问题反思",
      bridge: "讲清方法的<b>适用边界</b>：9.1它在什么情况下会失效（光照突变、视角极稀疏）；9.2针对这些失效的改进思路。",
      analogy: {
        title: "地图也有画不准的地方",
        text: "再好的测量员，遇上<b>忽明忽暗的天光</b>或<b>只有寥寥几眼</b>的路段，也会画不准；知道<b>什么时候会错</b>，才知道<b>下一步怎么补</b>。",
        componentId: "ana-summit"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "失败情形：光照突变与视角极稀疏",
          desc: "两种情况：<b>光照突变</b>：帧间外观骤变，跨块记忆读到的上下文不一致，位姿与深度失配；<b>视角极稀疏</b>：相邻帧重叠不足，重叠带缺少可对齐的公共桩。",
          componentId: "mod-limitations"
        },
        {
          kind: "module",
          id: "9.2",
          title: "改进思路",
          desc: "针对 9.1 的两类失败：<b>光照鲁棒表征</b>、<b>几何先验补稀疏</b>、<b>自适应块划分</b>。",
          componentId: "mod-improve"
        }
      ],
      takeaways: [
        {
          icon: "⚠️",
          title: "边界",
          desc: "光照突变、视角极稀疏时会失效。"
        },
        {
          icon: "🔧",
          title: "根因",
          desc: "外观骤变 → 上下文不一致；重叠不足 → 无公共桩可对齐。"
        },
        {
          icon: "🧭",
          title: "思路",
          desc: "光照鲁棒特征、几何先验、自适应分块。"
        }
      ]
    }
  ]
};
