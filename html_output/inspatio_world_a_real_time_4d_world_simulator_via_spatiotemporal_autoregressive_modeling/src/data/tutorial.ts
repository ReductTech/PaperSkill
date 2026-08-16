import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "InSpatio-World: A Real-Time 4D World Simulator via Spatiotemporal Autoregressive Modeling",
    titleZh: "InSpatio-World：基于时空自回归建模的实时 4D 世界模拟器",
    venue: "arXiv 2604.07209 · 2026",
    authors: "InSpatio Team（按字母序，22 位作者）",
    affiliation: "InSpatio Team",
    domain: "视频生成 · 世界模型 · 4D 交互",
    coreProblem: "现有视频生成在长时程漫游中丢失空间结构、被合成数据拖累画质、无法精确执行用户轨迹",
    coreInsight: "把一段参考视频变成可实时漫游的『活世界』：<b>隐式时空缓存</b>记住场景，<b>显式几何约束</b>执行指令，<b>双教师蒸馏 JDMD</b> 兼得控制与画质，1.3B 模型跑出 24 FPS。",
    keywords: [
      "世界模型",
      "时空自回归 STAR",
      "KV 缓存",
      "相机可控生成",
      "分布匹配蒸馏",
      "实时推理"
    ]
  },
  hero: {
    oldMethod: {
      componentId: "hero-old",
      desc: "无记忆自回归：走得越远，<b>场景越碎、轨迹越歪</b>；合成数据训练又让画面失真。"
    },
    newMethod: {
      componentId: "hero-new",
      desc: "ST-Cache 记住世界，显式几何执行指令，JDMD 保住画质——<b>24 FPS 实时漫游</b>。"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "4D 世界长什么样：先看 Demo，再看三道难题",
      badge: "inf",
      badgeLabel: "入门",
      bridge: "先别急着看模型结构。第一步是弄清楚：一个能实时交互的 <b>4D 世界</b>到底长什么样，以及把它做出来究竟难在哪。",
      analogy: {
        title: "开进浓雾的车",
        text: "把生成的世界当成一段可以开车漫游的山谷：走得越远，路在眼前越模糊——<b>没有记忆的生成器</b>撑不起一次长途漫游。",
        componentId: "ana-1"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "先看它能做什么：4D 世界漫游 Demo",
          desc: "切换四种能力，看论文项目主页的真实生成片段：<b>自由漫游</b>（视角听你的）、<b>时间控制</b>（世界会动且能倒回）、<b>物理真实</b>（不是一眼假）、<b>长时程稳定</b>（走远了也不塌）。这四条合起来，就是「4D 世界」的含义。",
          componentId: "m1-demo"
        },
        {
          kind: "module",
          id: "1.2",
          title: "为什么这么难：三道难题",
          desc: "点开每一道难题，看现有方法在那里具体是怎么坏掉的。这三道难题是本教程后半程的主线——每一道都会对应到论文的一件武器。",
          componentId: "m1-problems"
        }
      ],
      insight: "三道难题，三件武器：<b>记不住空间</b> → 隐式时空缓存；<b>操作对不上相机</b> → 显式空间约束；<b>实时与真实二选一</b> → JDMD 双教师蒸馏。",
      takeaways: [
        {
          icon: "🎯",
          title: "4D＝可漫游＋会演化",
          desc: "不只是生成一段视频，而是生成一个你能自由走动、还会随时间变化的世界。"
        },
        {
          icon: "🔧",
          title: "三道难题",
          desc: "记住已生成的空间、把操作变成精确相机移动、在实时的同时保住真实感。"
        },
        {
          icon: "✨",
          title: "主线已定",
          desc: "第 4–5 章解难题一，第 6 章解难题二，第 7 章解难题三，第 8 章拼回全图。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "出发前的路书：参考视频怎么变成世界素材",
      badge: "inf",
      badgeLabel: "入门",
      bridge: "三道难题都指向同一个前提：模型得先把<b>参考视频</b>读懂。本章看这段视频具体被拆成了哪些素材，又分别流向哪里。",
      analogy: {
        title: "出发前翻路书",
        text: "漫游开始前，参考视频被整理成<b>潜变量</b>和<b>深度</b>——一本随时可查的实景路书。",
        componentId: "ana-2"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "架构图：视频信息是怎么被提取出来的",
          desc: "点击流水线上的任一环节，看它做什么、产出什么、流向哪一道难题。一条视频进去，出来的是<b>两份素材</b>：给记忆用的参考潜变量，给几何用的深度与内参。",
          componentId: "m2-extract"
        },
        {
          kind: "module",
          id: "2.2",
          title: "点开一帧，看它变成什么",
          desc: "点击路书的四页（参考视频的四帧），在右侧固定观察窗里切换 像素 → 潜变量 → 深度 三种视图（潜变量网格与深度条带为示意）。",
          componentId: "m2-album"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "两份素材",
          desc: "参考视频被压成潜变量，再由前馈重建估出深度与相机内参。"
        },
        {
          icon: "🔧",
          title: "分工明确",
          desc: "潜变量当「长期记忆」，深度与内参当「几何底座」，各自解决一道难题。"
        },
        {
          icon: "✨",
          title: "一次前馈",
          desc: "不同于 NeRF、3DGS 需要多视角输入并逐场景优化，这里一次前馈就出几何，才跟得上实时。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "分段续驶：块级自回归与三重条件",
      badge: "both",
      badgeLabel: "通用",
      bridge: "素材备好了，世界怎么一步步生成出来？答案是<b>一块接一块</b>。而每一块所受的三类条件，正好对上前面的三道难题。",
      analogy: {
        title: "分段续驶",
        text: "整段旅程写成<b>一块接一块</b>的条件生成——每个路段亮起时，上一段、路书与方向盘都在场。",
        componentId: "ana-4"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "逐块看清三重条件",
          desc: "用「上一块 / 下一块」推进 5 个生成块，观察每一块被哪三类条件约束：<b>历史</b>管平滑、<b>参考</b>管认得世界、<b>几何</b>管听懂指令。",
          componentId: "m4-blocks"
        }
      ],
      formula: {
        lead: "整段漫游的概率被拆成一块接一块的条件概率；每一块的去噪同时受三类条件约束。把鼠标停在任一符号上看含义，点击可固定说明。",
        unicode: '<div class="fx-line">p(<span data-tip="整段视频的潜变量序列，共 I 块，每块 K 帧">Z₁:I</span> | <span data-tip="全局参考上下文，也就是那本路书">C_ref</span>, <span data-tip="用户实时交互指令的集合">T</span>) = ∏ᵢ₌₁ᴵ p(<span data-tip="第 i 块要生成的潜变量">zᵢ</span> | <span data-tip="已生成的历史块，短期记忆">z₍&lt;i₎</span>, <span data-tip="第 i 块实时检索到的参考引导">c_refⁱ</span>, <span data-tip="第 i 块的用户交互指令">τᵢ</span>)<span class="fx-tag">(1)</span></div><div class="fx-line"><span data-tip="第 i 块去噪后的输出">ẑᵢ</span> = Denoise(<span data-tip="第 i 块在噪声水平 σ 下的初始潜变量">zᵢ,σ</span> | <span data-tip="历史条件：保证块与块之间运动平滑">z₍&lt;i₎</span>, <span data-tip="参考条件：全局空间锚点，对应难题一">z_refⁱ</span>, [<span data-tip="几何条件：重投影得到的对齐特征，对应难题二">z_warpⁱ</span>, <span data-tip="有效掩码：标出哪些像素真正可见">mᵢ</span>])<span class="fx-tag">(2)</span></div>',
        symbols: [
          { sym: "Z₁:I", desc: "整段视频的潜变量序列（共 I 块，每块 K 帧）" },
          { sym: "C_ref", desc: "全局参考上下文，由参考视频提供" },
          { sym: "c_refⁱ", desc: "第 i 块实时检索到的参考引导" },
          { sym: "zᵢ,σ", desc: "第 i 块在噪声水平 σ 下的初始潜变量" },
          { sym: "zᵢ", desc: "第 i 块的潜变量" },
          { sym: "ẑᵢ", desc: "第 i 块去噪后的输出" },
          { sym: "z_refⁱ", desc: "从参考视频检索并压缩的潜变量，充当长期空间锚点" },
          { sym: "z_warpⁱ", desc: "由用户位姿驱动、几何对齐后的重投影特征" },
          { sym: "mᵢ", desc: "二值有效掩码，区分「黑色纹理」与「真正不可见」" },
          { sym: "τᵢ", desc: "第 i 块的用户交互指令" }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "公式 (1)",
          desc: "长视频 = 逐块条件生成的连乘，理论上可以无限接下去。"
        },
        {
          icon: "🔧",
          title: "公式 (2)",
          desc: "每一块被历史、参考、几何三重条件同时约束，没有一步是放飞的。"
        },
        {
          icon: "✨",
          title: "对上难题",
          desc: "参考条件应对难题一，几何条件应对难题二，剩下的画质问题交给训练（难题三）。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "难题一 · 记住走过的世界：隐式时空缓存",
      badge: "inf",
      badgeLabel: "入门",
      bridge: "先解决<b>难题一</b>。要让你折返时看到的还是原来那个世界，模型需要两种记忆：一种管眼前，一种管全局。",
      analogy: {
        title: "一眼路书，一眼后视镜",
        text: "后视镜里是<b>刚驶过的路</b>，路书里是<b>整个山谷的样子</b>——两种记忆一起用，才不迷路。",
        componentId: "ana-3"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "记忆开关实验台",
          desc: "选择一种记忆配置再出发，对比三种结局；右侧显示漂移曲线（示意）与 KV 缓存占用（恒定占用为论文机制）。",
          componentId: "m3-cache"
        },
        {
          kind: "module",
          id: "4.2",
          title: "同样的距离，换本文的方法",
          desc: "在相同漫游距离下切换两种方法，直观对比有无「参考锚点 + 几何约束」的差别（对比为示意）。",
          componentId: "m1-repair"
        }
      ],
      insight: "短期滑窗保证「这一步接得上上一步」，长期参考锚点保证「走再远也认得这个世界」——<b>ST-Cache</b> 把两者合而为一，且显存恒定。",
      takeaways: [
        {
          icon: "🎯",
          title: "短期滑窗",
          desc: "滑动窗口存最近生成的潜变量，保证块与块之间运动平滑。"
        },
        {
          icon: "🔧",
          title: "长期锚点",
          desc: "按当前块实时检索参考潜变量，走再远也能对上原场景的纹理与语义。"
        },
        {
          icon: "✨",
          title: "恒定显存",
          desc: "两者装进恒定大小的 KV 缓存，长度增长不会撑爆显存——这是实时的前提。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "难题一（续）· 走得再远也不失稳：位置索引固定",
      badge: "inf",
      badgeLabel: "入门",
      bridge: "记忆装好了，长途还剩一个隐形杀手：<b>位置编码</b>会随序列变长而越出训练时见过的量程。本章看论文怎么把它按住。",
      analogy: {
        title: "里程无限，刻度有限",
        text: "路可以无限长，但仪表刻度必须<b>停在熟悉的量程里</b>——超出量程，读数就不可信了。",
        componentId: "ana-6"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "同时出发：索引增长 vs 索引固定",
          desc: "点「同时出发」，两个等大的面板在同一时间轴上跑长序列：左边位置索引持续增长并冲出训练量程，右边把索引重锚到固定原点（抖动效果为示意，机制为论文策略）。",
          componentId: "m6-rope"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "隐形杀手",
          desc: "长序列会让 RoPE 位置外推，带来分布漂移与数值不稳定。"
        },
        {
          icon: "🔧",
          title: "重锚原点",
          desc: "把当前块、参考锚、历史块的起始索引统一锚到固定原点（fᵢ, fᵢʳ, fᵢʰ）。"
        },
        {
          icon: "✨",
          title: "难题一收官",
          desc: "缓存管「记得住」，索引固定管「记得稳」，两者合起来才是完整的空间持久性。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "难题二 · 把操作变成精确的相机移动：显式空间约束",
      badge: "both",
      badgeLabel: "通用",
      bridge: "轮到<b>难题二</b>。你要转 30°，模型就得真的转 30°。这一章的答案不是让模型「学着猜」，而是直接<b>算出来</b>。",
      analogy: {
        title: "方向盘直通路面",
        text: "转多少方向盘，路就弯多少——指令被翻译成<b>确定的几何位姿</b>，不靠模型猜。",
        componentId: "ana-5"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "拖动位姿，看重投影与掩码",
          desc: "拖动橙色手柄改变相机位姿（左右=转向，上下=前进），观察参考画面被深度重投影到新视角，以及哪些区域「看不见」需要生成（覆盖率条为示意）。也可用下方滑块精确调节。",
          componentId: "m5-steer"
        }
      ],
      formula: {
        lead: "把当前位姿交给投影算子，参考潜变量被搬到新视角，同时得到一张「哪里可见」的掩码。悬停看含义，点击可固定说明。",
        unicode: '<div class="fx-line"><span data-tip="几何对齐后的引导特征">z_warpⁱ</span>, <span data-tip="二值有效掩码，标出哪些像素真正可见">mᵢ</span> = <span data-tip="基于深度与内参的重投影算子">Proj</span>(<span data-tip="参考视频的潜变量">z_ref</span> | <span data-tip="前馈重建：从参考潜变量估出深度图与相机内参">FFR</span>(z_ref), <span data-tip="第 i 块的全局相机位姿">Tᵢ</span>)<span class="fx-tag">(3)</span></div><div class="fx-line"><span data-tip="第 i 块的全局相机位姿">Tᵢ</span> ← <span data-tip="本块的 6 自由度相对位姿增量，由你的操作决定">ΔTᵢ</span> 累积到 <span data-tip="上一块结束时的相机位姿">T₍i−1₎</span><span class="fx-tag">位姿累积</span></div>',
        symbols: [
          { sym: "z_warpⁱ", desc: "几何对齐后的引导特征，给生成器一份确定的结构底稿" },
          { sym: "mᵢ", desc: "二值有效掩码，区分「黑色纹理」与「真正不可见」" },
          { sym: "Proj", desc: "基于深度与内参的重投影（渲染）算子" },
          { sym: "FFR", desc: "前馈重建：从参考潜变量估计深度图 D_ref 与相机内参 K" },
          { sym: "z_ref", desc: "参考视频的潜变量" },
          { sym: "ΔTᵢ", desc: "本块的 6 自由度相对位姿增量，直接由用户操作决定" },
          { sym: "T₍i−1₎", desc: "上一块结束时的全局相机位姿" },
          { sym: "Tᵢ", desc: "第 i 块的全局相机位姿，由历史增量累积而来" }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "确定性控制",
          desc: "指令 → 6 自由度位姿增量 → 累积成全局位姿，精度不依赖模型的猜测。"
        },
        {
          icon: "🔧",
          title: "重投影+掩码",
          desc: "深度重投影给出结构底稿，掩码申明可见范围，让「看不见」保持诚实。"
        },
        {
          icon: "✨",
          title: "思想传承",
          desc: "该思想源自团队前作 InSpatio-WorldFM，本文推广到视频生成并支持可选点云记忆。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "难题三 · 又快又真：JDMD 双教师蒸馏",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "最后是<b>难题三</b>。它不在架构里，在训练方式里：<b>几何完美的数据都是合成的，画面真实的数据都没几何标注</b>。",
      analogy: {
        title: "绕桩练习",
        text: "一位教练盯<b>动作是否标准</b>，一位教练盯<b>画面是否真实</b>——同一辆车，两套作业。",
        componentId: "ana-7"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "只跟一位教练会怎样",
          desc: "切换三种训练配置，观察绕桩精度与画面质感如何此消彼长（结果为论文定性结论的示意呈现）。",
          componentId: "m7-teachers"
        },
        {
          kind: "module",
          id: "7.2",
          title: "调一调损失天平 λ_ctrl",
          desc: "拖动权重滑块，看总损失 L_JDMD 中两项的相对占比如何变化（占比示意；论文将 λ_ctrl 设为平衡超参，未给具体数值）。",
          componentId: "m7-lambda"
        }
      ],
      insight: "与其在「控制」和「画质」之间二选一，不如让<b>两位冻结的教师</b>同时教一个共享权重的学生：动作教师管几何服从，画质教师把纹理光照拉回真实分布。",
      formula: {
        lead: "DMD 把学生往「教师评分高于学生自评」的方向推；JDMD 把两位教师的推动力加权合并。悬停看含义，点击可固定说明。",
        unicode: '<div class="fx-line">∇_θ E_t[D_KL] = −E[(<span data-tip="真实教师评分网络近似的得分函数">s_real</span> − <span data-tip="跟踪学生的伪评分网络给出的得分函数">s_fake</span>) · ∂<span data-tip="学生输出加噪后的样本">x̂ₜ</span> / ∂θ]<span class="fx-tag">(4)</span></div><div class="fx-line"><span data-tip="JDMD 的总损失">L_JDMD</span> = <span data-tip="T2V 任务的视觉蒸馏损失，教师是真实分布的 Wan-T2V">L_vis</span> + <span data-tip="平衡画质与控制的权重超参数">λ_ctrl</span> · <span data-tip="V2V 任务的条件控制损失，教师是合成数据微调的动作教师">L_ctrl</span><span class="fx-tag">(5)</span></div>',
        symbols: [
          { sym: "s_real", desc: "真实（教师）评分网络近似的得分函数" },
          { sym: "s_fake", desc: "跟踪学生的伪评分网络给出的得分函数" },
          { sym: "x̂ₜ", desc: "学生输出加噪后的样本（t 为噪声时刻）" },
          { sym: "L_JDMD", desc: "JDMD 的总损失，由两项加权而成" },
          { sym: "L_vis", desc: "T2V 任务的视觉蒸馏损失，来自真实分布教师 Wan-T2V" },
          { sym: "λ_ctrl", desc: "平衡画质与控制的权重超参数" },
          { sym: "L_ctrl", desc: "V2V 任务的条件控制损失，来自合成数据微调的动作教师" }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "零和困境",
          desc: "单教师蒸馏在相机控制场景必然被拖进合成域：控制与画质此消彼长。"
        },
        {
          icon: "🔧",
          title: "双师破局",
          desc: "双冻结教师 + 共享权重学生 + 交替任务，用真实分布当正则引导。"
        },
        {
          icon: "✨",
          title: "互不干扰",
          desc: "两任务输入结构不同，天然阻断梯度互相干扰。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "打开引擎盖：STAR 全架构地图",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "三道难题各有解法，现在把它们拼回一张图：<b>数据从参考视频到输出视频，究竟怎么流</b>。",
      analogy: {
        title: "打开引擎盖之前",
        text: "仪表盘亮起的那一刻，<b>缓存、几何、扩散主干</b>已经各就各位。",
        componentId: "ana-8"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "点亮流水线的每个部件",
          desc: "点击任一节点查看它的职责与论文依据；切换「推理 / 训练」查看哪些部件只在训练时在场。",
          componentId: "m8-arch"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "主干即标准",
          desc: "主干是标准 DiT（Wan2.1），创新在「往里注什么、怎么注」。"
        },
        {
          icon: "🔧",
          title: "两路注入",
          desc: "隐式记忆走 KV 缓存，显式几何走通道拼接，各司其职。"
        },
        {
          icon: "✨",
          title: "推理零负担",
          desc: "JDMD 的两个评分器只在训练期在场，推理期零开销。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "轻装上路：让世界模型跑进 24 FPS",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "设计再好，跑不动就没有「交互」可言——这也是难题三的另一半。本章看几件实用机关：<b>多条件因果初始化、逐块反传、轻量 VAE 与图编译</b>。",
      analogy: {
        title: "卸下多余的行李",
        text: "换轻量 VAE、做图编译、逐块反传——每卸一件行李，<b>实时</b>就近一步。",
        componentId: "ana-9"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "逐块反传三步走",
          desc: "一步步执行逐块反传策略，盯住右侧显存条：全程可微，但峰值始终只有单块规模（显存条为示意；机制与 FPS 数字来自论文）。",
          componentId: "m9-backprop"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "先排练再蒸馏",
          desc: "多条件因果初始化：先在真实数据或教师轨迹上逐块「排练」，稳住三类条件的依赖。"
        },
        {
          icon: "🔧",
          title: "时间换空间",
          desc: "逐块反传：无梯度全程 + 逐块重算，显存峰值只有单块规模。"
        },
        {
          icon: "✨",
          title: "实时达成",
          desc: "Tiny-VAE + torch.compile：以少量画质换来 24 FPS（1.3B，H 系列 GPU；RTX 4090 上 10 FPS）。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "终点线上的成绩单：实测、对比与局限",
      badge: "both",
      badgeLabel: "通用",
      bridge: "三道难题都给了解法，上考场。本章只用<b>论文验证过的数字</b>说话，并把论文自己承认的局限一并摆上桌面。",
      analogy: {
        title: "终点前见真章",
        text: "同一条测试道、同一套量尺——<b>验证过的数字</b>才有资格分胜负。",
        componentId: "ana-10"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "RE10K-Long 四强对决",
          desc: "选择指标并点「开始对比」。四条赛道按真实测得的误差换算成进度（误差越低，跑得越远）；表格保留原始数值。协议：RE10K 中 100 条超过 150 帧的序列，本文使用 14B 版本，四项指标均为<b>越低越好</b>。",
          componentId: "m10-race"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "四项全胜",
          desc: "长时程漫游四项误差全面第一，轨迹误差比第二名低数倍（RE10K-Long，14B）。"
        },
        {
          icon: "🔧",
          title: "诚实比较",
          desc: "实时/可交互榜单第一（动态 68.72、相机 81.51），但非实时的 FantasyWorld-1.0 动态总分 71.39 仍更高。"
        },
        {
          icon: "✨",
          title: "已知局限",
          desc: "自生成区域的细粒度纹理记不牢；动态元素的 360° 全向漫游仍是开放挑战。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1aVPrz8En7",
      title: "我们开源了一个实时生成的 3D 世界模型：InSpatio-WorldFM",
      reason: "团队前作官方视频——本文显式空间约束的直接源头",
      cover: "https://i2.hdslb.com/bfs/archive/d61087d6c7b821ad01469d731a52ac20180d437d.jpg",
      views: "5258播放"
    },
    {
      bvid: "BV1GXfCYYEw6",
      title: "一文讲清楚世界模型",
      reason: "高播放量的世界模型总览，适合零基础补背景",
      cover: "https://i2.hdslb.com/bfs/archive/61d40acca4a3b16ec84feb7105596c2e258f3739.jpg",
      views: "19.5万播放"
    },
    {
      bvid: "BV1ExRnBtEpk",
      title: "世界模型月报 2026.04：实时交互生成的同期进展",
      reason: "帮读者把本文放进世界模型领域的最新坐标系",
      cover: "https://i2.hdslb.com/bfs/archive/3c2f043d47174ecb2456011f75c726cec6aed1b8.jpg",
      views: "3.2万播放"
    }
  ]
};
