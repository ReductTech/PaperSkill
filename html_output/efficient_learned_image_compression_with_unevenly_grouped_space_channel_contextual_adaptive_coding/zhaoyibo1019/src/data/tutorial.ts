import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ELIC: Efficient Learned Image Compression with Unevenly Grouped Space-Channel Contextual Adaptive Coding",
    "titleZh": "ELIC：基于非均匀分组空间-通道上下文自适应编码的高效学习式图像压缩",
    "venue": "CVPR 2022 · arXiv:2203.10886",
    "authors": "Dailan He, Ziming Yang, Weikun Peng, Rui Ma, Hongwei Qin, Yan Wang",
    "affiliation": "商汤科技研究院 · 清华大学",
    "domain": "计算机视觉 · 图像压缩",
    "coreProblem": "学习式图像压缩要同时兼顾码率、失真与解码速度，但串行的自回归上下文模型和笨重的变换网络拖慢了推理。",
    "coreInsight": "潜变量通道的能量与熵天然<b>集中在前几个通道</b>——ELIC 用<b>非均匀分组</b>快速压缩主要信息，再叠加<b>空间-通道上下文（SCCTX）</b>与<b>残差块</b>，在码率与速度上同时达到帕累托最优。",
    "keywords": [
      "学习式图像压缩",
      "上下文熵模型",
      "非均匀分组",
      "SCCTX"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "串行自回归上下文：一个符号一个符号地等前一个解完，<b>解码很慢</b>。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "ELIC：非均匀分组 + 空间-通道上下文 + 残差块，<b>5 步并行</b>解完。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "又快又好：图像压缩的权衡",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "压缩永远在<b>码率</b>与<b>失真</b>之间权衡；先建立这个目标函数，再指出传统串行上下文带来的速度瓶颈，为 ELIC 的登场铺路。",
      "analogy": {
        "title": "一张照片，又快又好地洗出来",
        "text": "冲印照片总要在「文件更小」和「画面更清晰」之间取舍；传统方法要一张张慢慢来，很慢。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "拖动 λ，感受码率与失真的权衡",
          "desc": "压缩就是把图像编码成比特流。<b>λ</b> 是「码率 ↔ 失真」的旋钮：<b>λ 越大越省码率，但画面越失真</b>；λ 越小画面越清晰，但文件越大。",
          "componentId": "ch1mod1"
        }
      ],
      "insight": "学习式压缩想要同时兼顾性能与速度——这正是 ELIC 要解决的难题。",
      "formula": {
        "lead": "学习式图像压缩的训练目标，就是这条率失真损失。",
        "unicode": "L = R(ŷ) + λ·D(x, gs(ŷ))",
        "symbols": [
          {
            "sym": "L",
            "desc": "训练损失"
          },
          {
            "sym": "R",
            "desc": "码率"
          },
          {
            "sym": "D",
            "desc": "失真"
          },
          {
            "sym": "λ",
            "desc": "权衡系数"
          },
          {
            "sym": "ŷ",
            "desc": "量化编码符号"
          },
          {
            "sym": "gs",
            "desc": "合成变换（解码网络）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "码率与失真",
          "desc": "压缩在码率 R 与失真 D 之间权衡，λ 是旋钮。"
        },
        {
          "icon": "🔧",
          "title": "速度瓶颈",
          "desc": "串行上下文模型是解码速度的主要瓶颈。"
        },
        {
          "icon": "✨",
          "title": "ELIC 目标",
          "desc": "又省码、又清晰、又快。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图像如何变成符号：分析与量化",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "在讨论上下文编码之前，先看清输入的来源：图像经<b>分析变换</b>变成潜变量，再经<b>量化</b>变成离散编码符号，这是后续所有熵建模的对象。",
      "analogy": {
        "title": "底片感光，留下潜影",
        "text": "图像先经过分析网络，像底片感光一样被压缩成一组「潜影」符号。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "逐步把图像变成编码符号",
          "desc": "图像 x 经 <b>分析网络 ga</b> 逐层下采样、变换，得到连续潜变量 y，再经 <b>量化 ⌈·⌋</b> 取整成离散符号 ŷ，才能送入熵编码。",
          "componentId": "ch2mod1"
        }
      ],
      "formula": {
        "lead": "编码符号就是分析变换的输出取整。",
        "unicode": "ŷ = ⌈ga(x)⌋",
        "symbols": [
          {
            "sym": "x",
            "desc": "原图"
          },
          {
            "sym": "ga",
            "desc": "分析变换（编码网络）"
          },
          {
            "sym": "⌈·⌋",
            "desc": "量化（取整）"
          },
          {
            "sym": "ŷ",
            "desc": "编码符号"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分析变换",
          "desc": "图像先经分析网络变成潜变量。"
        },
        {
          "icon": "🔧",
          "title": "量化取整",
          "desc": "量化把连续潜变量变成离散符号。"
        },
        {
          "icon": "✨",
          "title": "编码对象",
          "desc": "潜变量是后续熵建模与上下文编码的对象。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "关键洞察：信息压缩性质",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "ELIC 的全部设计都建立在一个观察上：<b>潜变量通道的能量与熵集中在前几个通道</b>。本节用可拖动的能量排序让这个「前重后轻」的规律看得见。",
      "analogy": {
        "title": "主体先浮现，细节随后",
        "text": "显影时结构先出现，纹理细节最后才清晰——信息天然是「前重后轻」的。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "拖动通道按能量排序，发现信息压缩",
          "desc": "每个通道是一张特征图。把通道<b>按能量从大到小排序</b>，会发现开头几个通道能量极大、越往后越稀疏——这就是<b>信息压缩性质</b>。",
          "componentId": "ch3mod1"
        }
      ],
      "insight": "信息压缩让「前面通道」最有价值——这直接启发 ELIC 的非均匀分组。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "能量集中",
          "desc": "潜变量通道的能量/熵集中在前几个通道。"
        },
        {
          "icon": "🔧",
          "title": "越后越稀疏",
          "desc": "后面的通道越来越稀疏、信息量小。"
        },
        {
          "icon": "✨",
          "title": "理论基础",
          "desc": "「前重后轻」是非均匀分组的理论基础。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "熵模型与超先验",
      "badge": "both",
      "badgeLabel": "直觉+技术",
      "bridge": "要估计码率，就要给每个符号一个概率。本节建立<b>均值-方差高斯熵模型</b>，并说明<b>超先验</b>如何提供自适应的 μ、σ，让概率更贴合真实符号。",
      "analogy": {
        "title": "先用参照样张估个大概",
        "text": "超先验像一张「参照样张」，先给出画面的总体亮暗分布，让编码更省比特。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "切换超先验，看高斯拟合与码率",
          "desc": "熵模型用<b>均值 μ、方差 σ²</b> 的高斯分布预测每个符号。有了<b>超先验 ẑ</b> 提供的 μ、σ，分布更贴合真实符号，码率更低。",
          "componentId": "ch4mod1"
        }
      ],
      "formula": {
        "lead": "符号概率用一个带均值和方差的高斯来近似。",
        "unicode": "p(ŷ|ẑ) = [N(μ, σ²) ∗ U(−0.5, 0.5)](ŷ)",
        "symbols": [
          {
            "sym": "p",
            "desc": "概率质量"
          },
          {
            "sym": "μ",
            "desc": "高斯均值"
          },
          {
            "sym": "σ",
            "desc": "高斯标准差"
          },
          {
            "sym": "ẑ",
            "desc": "超先验（边信息）"
          },
          {
            "sym": "N",
            "desc": "高斯分布"
          },
          {
            "sym": "U",
            "desc": "均匀分布（量化噪声）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "高斯熵模型",
          "desc": "熵模型用高斯分布估计符号概率。"
        },
        {
          "icon": "🔧",
          "title": "自适应参数",
          "desc": "超先验 ẑ 提供自适应的 μ、σ。"
        },
        {
          "icon": "✨",
          "title": "更准更低码",
          "desc": "更准的概率 → 更低的码率。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "通道条件与非均匀分组",
      "badge": "both",
      "badgeLabel": "直觉+技术",
      "bridge": "既然信息集中在前几个通道，就该给前面通道更细的粒度。本节介绍<b>通道条件模型</b>，并重点讲 ELIC 的<b>非均匀分组</b>：只靠 5 步并行就解完全部通道。",
      "analogy": {
        "title": "重要区域先显影",
        "text": "与其等量处理所有区域，不如给关键区域更细的时间分配，其余粗略处理。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "逐步解码 5 个非均匀分组",
          "desc": "通道条件模型把 M 个通道分成若干组，第 k 组靠前 k−1 组预测。ELIC 用<b>非均匀分组</b>：前面组通道少（16、16）、后面组通道多（32、64、M−128），只需 <b>5 步并行</b> 解完。",
          "componentId": "ch5mod1"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "对比均匀与不均匀分组",
          "desc": "均匀 10 切片要 10 步，非均匀只要 5 步；非均匀的熵估计延迟<b>约减半</b>（13.46→6.45 ms），仍保持相近码率。",
          "componentId": "ch5mod2"
        }
      ],
      "formula": {
        "lead": "第 k 个通道组靠前面已解码的组来预测。",
        "unicode": "Φch⁽ᵏ⁾ = gch⁽ᵏ⁾(ŷ⁽¹⁻ᵏ⁻¹⁾)",
        "symbols": [
          {
            "sym": "Φch",
            "desc": "第 k 组通道上下文"
          },
          {
            "sym": "gch",
            "desc": "通道上下文网络"
          },
          {
            "sym": "ŷ",
            "desc": "前 k−1 组已解码符号"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分组预测",
          "desc": "通道条件模型分组预测，组数决定并行度。"
        },
        {
          "icon": "🔧",
          "title": "延迟减半",
          "desc": "非均匀分组用 5 步替代 10 步，延迟减半。"
        },
        {
          "icon": "✨",
          "title": "前细后粗",
          "desc": "前面组细、后面组粗，正好利用信息压缩。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "空间-通道上下文：SCCTX",
      "badge": "both",
      "badgeLabel": "直觉+技术",
      "bridge": "只用通道条件还不够——图像是二维的，邻近像素高度相关。ELIC 的 <b>SCCTX</b> 把<b>空间上下文</b>、<b>通道上下文</b> 和<b>超先验</b> 三个信号聚合起来，一起预测当前符号的均值 μ 与尺度 σ。",
      "analogy": {
        "title": "放大镜逐块检查",
        "text": "暗房师傅先用放大镜看局部纹理，再对照整张底片，逐块确认每处细节。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "三个分支如何合流",
          "desc": "点击三个分支：<b>空间上下文 Φsp</b>（已解码邻居）、<b>通道上下文 Φch</b>（前几组通道）、<b>超先验 Ψ</b>（侧信息 ẑ），看它们如何在聚合节点汇成 (μ, σ)。",
          "componentId": "ch6mod1"
        }
      ],
      "formula": {
        "lead": "三个上下文信号聚合成高斯参数。",
        "unicode": "[Φsp, Φch, Ψ] → 聚合 → (μ, σ)",
        "symbols": [
          {
            "sym": "Φsp",
            "desc": "空间上下文"
          },
          {
            "sym": "Φch",
            "desc": "通道上下文"
          },
          {
            "sym": "Ψ",
            "desc": "超先验"
          },
          {
            "sym": "μ, σ",
            "desc": "高斯均值与尺度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "三路合流",
          "desc": "空间、通道、超先验三者缺一不可。"
        },
        {
          "icon": "🔍",
          "title": "空间补局部",
          "desc": "空间上下文捕捉邻域纹理细节。"
        },
        {
          "icon": "📦",
          "title": "通道补结构",
          "desc": "通道上下文利用跨通道结构。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "用 λ 扫出整条率失真曲线",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "训练用约 <b>8000 张 ImageNet</b> 图、<b>Adam</b> 优化器、<b>两阶段</b>训练，损失 <b>L = R + λD</b> 里的 λ 控制码率与失真的取舍。用 <b>8 档 λ</b> 各训一个点，就能扫出整条<b>率失真曲线</b>——λ 越小越看重质量，越大越看重压缩。",
      "analogy": {
        "title": "显影液用量",
        "text": "显影液倒得多，画面细腻但费时；倒得少，快但粗糙——用量就是 λ。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "拖动 λ 看工作点移动",
          "desc": "拖动滑块在 <b>8 档 λ</b> 间切换，工作点沿率失真曲线移动：λ 小 → 码率大、失真小；λ 大 → 码率小、失真大。",
          "componentId": "ch7mod1"
        }
      ],
      "formula": {
        "lead": "训练用的 λ 从一组值里选取，覆盖不同码率点。",
        "unicode": "λ ∈ {4, 8, 16, 32, 75, 150, 300, 450} × 10⁻⁴",
        "symbols": [
          {
            "sym": "λ",
            "desc": "率失真权衡系数"
          },
          {
            "sym": "10⁻⁴",
            "desc": "λ 的数量级"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "λ 是旋钮",
          "desc": "一个 λ 对应曲线上的一个工作点。"
        },
        {
          "icon": "🎚️",
          "title": "扫掠整条曲线",
          "desc": "多组 λ 训出整条率失真曲线。"
        },
        {
          "icon": "📉",
          "title": "越低越好",
          "desc": "曲线整体越低，压缩性能越好。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "ELIC 整体架构",
      "badge": "both",
      "badgeLabel": "直觉+技术",
      "bridge": "把前面几节串起来，就是 ELIC 的完整结构：主变换 → 量化 → <b>SCCTX 熵模型</b> → 算术编码，外加一条<b>超先验</b>支路。其中主变换用<b>堆叠残差瓶颈块</b>替代 GDN，非线性更强、更省码。点击各个模块了解它的职责与规模。",
      "analogy": {
        "title": "放大机投影",
        "text": "放大机把底片投到相纸上，光路越准，洗出的照片越清晰。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击架构各模块",
          "desc": "点击 ga、SCCTX、超先验、算术编解码、gs，看每个模块的职责与通道数（N=192、M=320）。",
          "componentId": "ch8mod1"
        }
      ],
      "formula": {
        "lead": "两个关键规模参数。",
        "unicode": "N = 192, M = 320",
        "symbols": [
          {
            "sym": "N",
            "desc": "主潜变量 y 的通道数"
          },
          {
            "sym": "M",
            "desc": "上下文/超先验通道数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏗️",
          "title": "模块串联",
          "desc": "主变换、熵模型、超先验、编解码各司其职。"
        },
        {
          "icon": "🔢",
          "title": "两个规模",
          "desc": "N=192 主通道，M=320 上下文通道。"
        },
        {
          "icon": "🔗",
          "title": "三路合流",
          "desc": "SCCTX 是空间+通道+超先验的汇合点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "渐进解码：先轮廓后细节",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "比特流是按序传输的，解码器可以<b>边收边解</b>：先收到的比特先给出粗略轮廓，后续比特逐步补全细节——这就是<b>渐进解码</b>。ELIC 还用一个<b>缩略图合成器</b>，只用前 128 通道约 <b>3 微秒</b> 就生成小样。",
      "analogy": {
        "title": "样片按帧显影",
        "text": "暗房里把同一张底片洗成一排样片，从模糊到清晰，展示显影的渐进过程。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "逐步接收比特看画面变清晰",
          "desc": "步进接收比特：先轮廓、再结构、最后细节，画面随比特增加逐渐清晰。",
          "componentId": "ch9mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🖼️",
          "title": "先粗后细",
          "desc": "早期比特给轮廓，后期比特补细节。"
        },
        {
          "icon": "📡",
          "title": "边收边解",
          "desc": "无需等全部比特就能出图。"
        },
        {
          "icon": "⚡",
          "title": "低延迟",
          "desc": "渐进解码利于低延迟预览。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果：BD-Rate 领跑",
      "badge": "both",
      "badgeLabel": "直觉+技术",
      "bridge": "用 <b>BD-Rate</b>（相同质量下省多少码率，越低越好）衡量压缩性能。ELIC 相比 VVC 平均省 <b>7.88%</b>（PSNR）、<b>12.73%</b>（MS-SSIM），且解码仅 49.16ms，在码率与速度上帕累托最优。",
      "analogy": {
        "title": "照片依次冲出",
        "text": "打印机把各家的作品一张张冲出，越靠左（越省纸）的作品越好。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "BD-Rate 竞赛",
          "desc": "看 BD-Rate 条向左延伸（向左=越省码率）：Gao2021 更省但解码超 1 秒/图，ELIC 兼顾码率与速度，是帕累托最优。",
          "componentId": "ch10mod1"
        }
      ],
      "formula": {
        "lead": "ELIC 相对 VVC 的平均码率节省。",
        "unicode": "BD-Rate = −7.88% (PSNR) / −12.73% (MS-SSIM) vs VVC",
        "symbols": [
          {
            "sym": "BD-Rate",
            "desc": "Bjøntegaard 码率差"
          },
          {
            "sym": "−7.88%",
            "desc": "相对 VVC 的 PSNR 节省"
          },
          {
            "sym": "−12.73%",
            "desc": "相对 VVC 的 MS-SSIM 节省"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏆",
          "title": "领跑",
          "desc": "ELIC 在 BD-Rate 上优于 VVC 与上一代方法。"
        },
        {
          "icon": "📏",
          "title": "统一指标",
          "desc": "BD-Rate 把不同质量的码率差归一。"
        },
        {
          "icon": "🎯",
          "title": "实际意义",
          "desc": "同样画质省约 7.88% 的码率。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1ga411x7S6",
      "title": "ELIC【CVPR 2022 Oral】非均匀分组空间-通道上下文图像压缩",
      "reason": "直接讲解本文方法，覆盖非均匀分组与 SCCTX 的核心思想。",
      "cover": "https://i0.hdslb.com/bfs/archive/2e82c258531ba74b9cf3999d970a3f4398f93574.jpg",
      "views": "1.1万播放"
    },
    {
      "bvid": "BV1iF411c7An",
      "title": "商汤研究院 CVPR 2022 分享会：ELIC 高效学习式图像压缩",
      "reason": "作者团队的官方分享，从动机到实验完整梳理。",
      "cover": "https://i1.hdslb.com/bfs/archive/74a3114a098264ce2a29e448bc83d2be3afe07f0.jpg",
      "views": "1361播放"
    },
    {
      "bvid": "BV1D5CAYGEfd",
      "title": "可学习的图像与视频压缩领域入门概览",
      "reason": "领域全景入门，帮助理解 ELIC 在图像压缩中的位置。",
      "cover": "https://i1.hdslb.com/bfs/archive/0817f0f8e2893c1eb63c12e2059a8d8cd6c771f5.jpg",
      "views": "1308播放"
    }
  ]
};
