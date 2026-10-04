import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Variational Image Compression with a Scale Hyperprior",
    "titleZh": "带尺度超先验的变分图像压缩",
    "venue": "ICLR 2018",
    "authors": "Johannes Ballé · David Minnen · Saurabh Singh · Sung Jin Hwang · Nick Johnston",
    "affiliation": "Google",
    "domain": "图像压缩 · 深度学习 · 生成模型",
    "coreProblem": "如何让神经网络端到端地压缩图像——既省比特又少失真，同时处理好隐变量里的空间相关性。",
    "coreInsight": "给隐变量的每一处预测一个<b>尺度 σ</b>：先发送一张极小概览图（超先验 <b>z</b>），让解码端知道哪里细节多、哪里细节少，从而用最少比特刻画整张图像。",
    "keywords": [
      "图像压缩",
      "超先验",
      "率失真优化",
      "变分自编码器"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "分解先验：把每个隐变量当成<b>互不相关</b>的独立随机量，处处套用同一套熵模型，忽略边缘与纹理处抱团的空间结构——白白浪费比特。",
      "componentId": "hero-contrast"
    },
    "newMethod": {
      "desc": "尺度超先验：先发送一张<b>极小概览图 z</b>，预测每一处的尺度 σ，让熵模型跟着细节密度走——比特花在刀刃上。",
      "componentId": "hero-contrast"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "图像压缩的永恒难题：省比特还是保质量？",
      "badge": "inf",
      "badgeLabel": "推断",
      "bridge": "本节从<b>率失真权衡</b>讲起，为整篇论文定下「省比特 vs 少失真」的总目标——后续所有设计都在这个天平上做文章。",
      "analogy": {
        "title": "描线",
        "text": "一支绘图笔沿着地形描等高线：描得越密，<b>墨用得越多</b>，但越贴近真实地形；描得越疏越省墨，误差却越大。",
        "componentId": "ana-trace"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "拖动 λ：看省墨与保真如何此消彼长",
          "desc": "调节权衡系数 λ，观察同一张地形图上<b>墨线密度（码率）</b>与<b>草图误差（失真）</b>的反向变化。λ 越大，笔描得越密、误差越小；λ 越小，越省墨、误差越大。",
          "componentId": "mod-rate-distortion"
        }
      ],
      "insight": "压缩永远在「省」与「像」之间走钢丝——没有免费的午餐，λ 就是这条钢丝上的扶手。",
      "formula": {
        "lead": "率失真优化的总目标：把码率和失真放在同一天平上",
        "unicode": "L = R + λ · D",
        "symbols": [
          {
            "sym": "R",
            "desc": "码率：用概率模型编码 ŷ 所需的平均比特数"
          },
          {
            "sym": "D",
            "desc": "失真：重建 x̂ 与原图 x 的误差"
          },
          {
            "sym": "λ",
            "desc": "权衡系数：λ 越大越看重「像」"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "率失真权衡",
          "desc": "压缩的总纲：码率与失真此消彼长"
        },
        {
          "icon": "🔧",
          "title": "码率=交叉熵",
          "desc": "R = E[−log₂ p(ŷ)]，码率由概率模型决定"
        },
        {
          "icon": "✨",
          "title": "λ 是旋钮",
          "desc": "λ 决定你更看重「省」还是「像」"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把像素压成草图：分析变换与量化",
      "badge": "inf",
      "badgeLabel": "推断",
      "bridge": "本节解释输入图像如何经过<b>分析变换、量化、合成变换</b>三步，变成一份可压缩、可重建的「草图」。",
      "analogy": {
        "title": "压平",
        "text": "一支笔把起伏的地形<b>压成一张平面草图</b>——地形的高度起伏，浓缩进几条关键等高线里。",
        "componentId": "ana-flatten"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "步进：变换 → 量化 → 合成",
          "desc": "逐步走一遍端到端的变换编码：<b>分析变换 g_a</b> 把像素 x 压成隐变量 y，<b>量化</b> 把 y 取整成 ŷ（这是有损的根源），<b>合成变换 g_s</b> 再把 ŷ 重建回 x̂。",
          "componentId": "mod-transform"
        }
      ],
      "insight": "变换编码的精髓：把能量集中到少数系数、去掉冗余，才谈得上省比特。",
      "formula": {
        "lead": "变换编码的三步流水线",
        "unicode": "y = g_a(x)  →  ŷ = round(y)  →  x̂ = g_s(ŷ)",
        "symbols": [
          {
            "sym": "g_a",
            "desc": "分析变换：像素 → 隐变量"
          },
          {
            "sym": "round",
            "desc": "量化：四舍五入，引入有损"
          },
          {
            "sym": "g_s",
            "desc": "合成变换：隐变量 → 重建"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "变换编码",
          "desc": "把能量集中到少数系数，去掉冗余"
        },
        {
          "icon": "🔧",
          "title": "量化是有损根源",
          "desc": "round 这一步不可逆，丢掉了信息"
        },
        {
          "icon": "✨",
          "title": "端到端可学",
          "desc": "g_a 与 g_s 都是神经网络，可一起优化"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "关键洞察：草图里的线条是抱团的",
      "badge": "inf",
      "badgeLabel": "推断",
      "bridge": "本节揭示隐变量里最容易被忽略的<b>空间结构</b>：边缘与纹理处的系数会「抱团」。这正是分解先验看不到、也最浪费比特的地方。",
      "analogy": {
        "title": "标记",
        "text": "一支笔在等高线密集的地方点上墨点：墨点自动<b>聚成几簇</b>，暴露出「哪里细节多」。",
        "componentId": "ana-mark"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "对比：均匀假设 vs 真实抱团",
          "desc": "同步对比两幅图：左边是<b>分解先验的假设</b>——处处均匀、互不相关（红色，浪费比特）；右边是<b>真实隐变量</b>——在边缘处明显抱团（绿色，可被利用）。",
          "componentId": "mod-structure"
        }
      ],
      "insight": "先看清「哪里细节多」，才能把比特花在刀刃上——这正是超先验的出发点。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "空间相关性",
          "desc": "隐变量相邻元素高度相关，不是独立"
        },
        {
          "icon": "🔧",
          "title": "独立假设浪费比特",
          "desc": "分解先验把每处当独立量，冗余白白计入码率"
        },
        {
          "icon": "✨",
          "title": "启发边信息",
          "desc": "若有一张「概览图」标出抱团，就能精准省比特"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "数学框架：把压缩写成 KL 散度",
      "badge": "both",
      "badgeLabel": "综合",
      "bridge": "本节把「失真 + 码率」统一成一个<b>变分推断目标</b>，并说明训练期如何用均匀噪声让取整变得可导。",
      "analogy": {
        "title": "记账",
        "text": "一支笔在账本上同时记两栏：左边「误差」、右边「墨量」，两栏<b>加在一起</b>就是总账。",
        "componentId": "ana-ledger"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动 λ：看失真项与码率项的占比",
          "desc": "滑动 λ 观察<b>失真项</b>与<b>码率项</b>在总账里的占比如何重新分配。λ 大 → 失真项被压得更小、码率项上升；λ 小 → 反过来。",
          "componentId": "mod-kl"
        }
      ],
      "insight": "VAE 语言里，最小化「失真 + 码率」，就是在最小化真实后验与模型之间的 KL 散度。",
      "formula": {
        "lead": "把压缩写成变分目标：失真与码率合二为一",
        "unicode": "min  λ · D + R,   R = E[ −log₂ p(ŷ) ]",
        "symbols": [
          {
            "sym": "D",
            "desc": "失真：重建 x̂ 与原图 x 的误差"
          },
          {
            "sym": "R",
            "desc": "码率：隐变量 ŷ 的交叉熵"
          },
          {
            "sym": "p(ŷ)",
            "desc": "隐变量的概率模型（先验）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "VAE 视角",
          "desc": "压缩 = 变分推断，最小化 KL 散度"
        },
        {
          "icon": "🔧",
          "title": "KL = 失真 + 码率",
          "desc": "一个目标里同时照顾「像」与「省」"
        },
        {
          "icon": "✨",
          "title": "均匀噪声可导",
          "desc": "训练时用加噪声代替取整，让梯度能回传"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "尺度超先验：先发一张概览图",
      "badge": "both",
      "badgeLabel": "综合",
      "bridge": "本节引入论文的核心创新：<b>边信息 z</b> 通过 h_s 预测每处的尺度 σ，让先验跟着细节走——这比处处同一套假设省得多。",
      "analogy": {
        "title": "传真",
        "text": "动笔之前，先把一张<b>概览草图</b>传真给对方，标出哪里陡、哪里平，再按图下笔。",
        "componentId": "ana-overview"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "切换：分解先验 vs 尺度超先验",
          "desc": "切换两种先验模式，看 σ 的分布：<b>分解先验</b>给每一处相同的 σ（红色，浪费）；<b>尺度超先验</b>由 z 预测出逐元素的 σ，跟着细节密度变化（绿色，精准）。",
          "componentId": "mod-prior-modes"
        }
      ],
      "insight": "一小份边信息，换来处处更准的熵模型——这是本文最优雅的一次交换。",
      "formula": {
        "lead": "超先验：量化边信息 ẑ 预测每一处的尺度 σ",
        "unicode": "σ = h_s(ẑ),   p(ŷ | ẑ) = ∏ (N(0, σᵢ²) ∗ U(−½, ½))(ŷᵢ)",
        "symbols": [
          {
            "sym": "ẑ",
            "desc": "量化后的边信息：解码端先收到的小概览图"
          },
          {
            "sym": "σ",
            "desc": "尺度：每处隐变量的标准差"
          },
          {
            "sym": "h_s",
            "desc": "超先验合成变换：ẑ → σ"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "边信息 z",
          "desc": "解码端先看的那张概览图"
        },
        {
          "icon": "🔧",
          "title": "逐元素 σ",
          "desc": "先验跟着细节走，不再是处处相同"
        },
        {
          "icon": "✨",
          "title": "边信息也要压缩",
          "desc": "z 本身很小，用分解先验即可"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "推理：照着 σ 分配笔墨",
      "badge": "inf",
      "badgeLabel": "推断",
      "bridge": "本节走一遍完整的<b>压缩 / 解压流程</b>：编码端先送 z 再送 ŷ，σ 决定每处用多少比特；解码端顺序相反。",
      "analogy": {
        "title": "分配",
        "text": "收到概览图后，一支笔照着它把<b>笔墨密度分配</b>到地形各处：陡处多、平处少。",
        "componentId": "ana-allocate"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "拖动：给每处地形分配笔墨密度",
          "desc": "在等高线沿途拖动，把「笔墨密度」按地形陡缓重新分配：<b>陡处（大 σ）多给比特</b>、<b>平处（小 σ）少给比特</b>，看总码率随之变化。",
          "componentId": "mod-allocate"
        }
      ],
      "insight": "编码端先送一张小图 z，再送细节 ŷ——解码端先看小图，才知道细节该花多少比特来解。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先 z 后 ŷ",
          "desc": "编码顺序：边信息先行，细节随后"
        },
        {
          "icon": "🔧",
          "title": "σ 定比特数",
          "desc": "每处用多少比特由尺度 σ 决定"
        },
        {
          "icon": "✨",
          "title": "解码顺序相反",
          "desc": "先解 z 得 σ，再解 ŷ，最后合成 x̂"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练目标：把账本和地图一起练好",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "本节看<b>端到端训练</b>：式(10) 同时优化失真与两个码率项，λ 网格扫出整族不同码率的模型。",
      "analogy": {
        "title": "练习",
        "text": "一支笔反复描同一条等高线：<b>越描越稳</b>、越描越省墨。",
        "componentId": "ana-practice"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "步进：看训练迭代如何让草图变清晰",
          "desc": "逐步推进训练：随着迭代次数增加，<b>损失下降</b>、重建草图越来越清晰、码率也越来越省。观察三者在同一坐标里的联动。",
          "componentId": "mod-training"
        }
      ],
      "insight": "式(10) 把「像不像」「主码率」「边信息码率」三个愿望写进一个可导目标，梯度一次回传全部练到。",
      "formula": {
        "lead": "端到端训练目标（式 10）：λ·失真 + 主码率 + 边信息码率",
        "unicode": "loss = λ · E[ −log₂ p(x|x̂) ] + E[ −log₂ p(ŷ|ẑ) − log₂ p(ẑ) ]",
        "symbols": [
          {
            "sym": "p(x|x̂)",
            "desc": "失真项：原图 x 相对重建 x̂ 的似然（λ 加权）"
          },
          {
            "sym": "p(ŷ|ẑ)",
            "desc": "主码率：ŷ 在尺度条件先验下的码率"
          },
          {
            "sym": "p(ẑ)",
            "desc": "边信息码率：ẑ 在分解先验下的码率"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "式(10) 一次练全部",
          "desc": "失真、主码率、边信息码率一起优化"
        },
        {
          "icon": "🔧",
          "title": "λ 网格",
          "desc": "扫 λ 得到从低到高的整族码率模型"
        },
        {
          "icon": "✨",
          "title": "两种损失",
          "desc": "MSE 与 MS-SSIM 训练出的画风不同"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "双层工具箱：编码器与超先验网络",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "本节拆解网络结构：<b>g_a / g_s</b> 负责主变换，<b>h_a / h_s</b> 负责预测尺度，还有 GDN/IGDN 这种压缩友好的非线性。",
      "analogy": {
        "title": "换工具",
        "text": "一支笔在「粗测绘」与「精测绘」两套笔尖之间切换，<b>各管一段</b>。",
        "componentId": "ana-tools"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击：探索编码器的四块网络",
          "desc": "点击图中的 <b>g_a / g_s / h_a / h_s</b> 节点，查看每块的职责、结构与激活函数，并高亮它在整个压缩流程里的位置。",
          "componentId": "mod-arch-hotspots"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "切换：低码率段与高码率段的容量配置",
          "desc": "切换 <b>N（主变换通道）</b> 与 <b>M（超先验通道）</b> 的配置：低码率段用 N=128/M=192，高码率段加码到 N=192/M=320，观察参数量与适用码率段的变化。",
          "componentId": "mod-capacity"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "双层结构",
          "desc": "主变换 + 超先验，两套小网络各司其职"
        },
        {
          "icon": "🔧",
          "title": "GDN 激活",
          "desc": "压缩友好的归一化非线性（ga/gs 使用 GDN/IGDN）"
        },
        {
          "icon": "✨",
          "title": "容量随码率加码",
          "desc": "高码率段用更大 N/M，换取更高保真"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实操技巧：给密度模型加个保险",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "本节讲边信息自身的建模技巧：用<b>非参数密度模型</b>并与均匀分布卷积，让 z 的概率估计更稳、更省。",
      "analogy": {
        "title": "缓冲",
        "text": "一支笔把刚点下的密度点轻轻<b>抹匀</b>，让估计从锯齿变得平滑。",
        "componentId": "ana-buffer"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "拖动：加宽卷积，让密度估计变平滑",
          "desc": "拖动「卷积宽度」，看 z 的密度估计如何从<b>锯齿状直方图</b>变成<b>平滑曲线</b>。宽度太小会过拟合噪声，宽度合适则估计更稳、码率更低。",
          "componentId": "mod-density"
        }
      ],
      "insight": "密度模型越准，码率越低；与均匀分布卷积，等于给概率估计加一层「保险」，防止对训练样本过拟合。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "密度模型",
          "desc": "概率模型越准，编码就越省比特"
        },
        {
          "icon": "🔧",
          "title": "卷积加保险",
          "desc": "与均匀分布卷积，估计更平滑稳定"
        },
        {
          "icon": "✨",
          "title": "边信息几乎免费",
          "desc": "z 的码率 <0.1 bpp，不占预算"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果：这张地图能省多少墨？",
      "badge": "both",
      "badgeLabel": "综合",
      "bridge": "本节用 Kodak 基准「赛跑」：超先验在 <b>MS-SSIM 上超越当时 SOTA</b>、PSNR 上超越其他 ANN 方法并接近 HEVC/BPG，也诚实交代局限。",
      "analogy": {
        "title": "比较",
        "text": "新旧两支笔在同一片地形上<b>赛跑</b>：新笔更省墨、更贴地形。",
        "componentId": "ana-race"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "赛跑：看各方法在 Kodak 上的码率-质量",
          "desc": "先选指标（PSNR 或 MS-SSIM），再点「开始」让各方法从同一起点<b>赛跑</b>：JPEG2000、BPG、分解先验与尺度超先验，看谁的曲线爬得更高。",
          "componentId": "mod-results"
        }
      ],
      "insight": "本文的最大价值不在「全面碾压 BPG」，而在「用极小边信息换来大幅提升」——MS-SSIM 上超越了当时的 SOTA Rippel & Bourdev 2017。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "MS-SSIM 超越 SOTA",
          "desc": "在 Kodak 上超过 Rippel & Bourdev 2017"
        },
        {
          "icon": "🔧",
          "title": "PSNR 超其他 ANN 方法",
          "desc": "超越其他 ANN 方法、接近 HEVC/BPG，仍略逊一筹"
        },
        {
          "icon": "✨",
          "title": "下一步",
          "desc": "寻找比高斯尺度更准的密度模型"
        }
      ]
    }
  ]
};
