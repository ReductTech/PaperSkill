import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Joint Autoregressive and Hierarchical Priors for Learned Image Compression",
    "titleZh": "自回归与层级先验联合的学习式图像压缩",
    "venue": "NIPS 2018 · arXiv:1809.02736",
    "authors": "David Minnen, Johannes Ballé, George Toderici",
    "affiliation": "Google Research",
    "domain": "计算机视觉 · 图像压缩 · 生成式建模",
    "coreProblem": "尺度超先验(GSM)只预测每个隐变量的尺度、均值固定为 0，无法利用隐变量之间与全局的统计结构；更准的熵模型需要同时预测均值，并利用已解码的邻居。",
    "coreInsight": "把高斯尺度模型(GSM)泛化成<b>同时预测均值与尺度</b>的高斯熵模型，再加上<b>自回归上下文模型</b>——两者互补：盒盖(超先验)看未来、邻居(上下文)看过去，合并后熵模型更准、码率更低，首次在 PSNR 与 MS-SSIM 上双超 BPG。",
    "keywords": [
      "自回归上下文模型",
      "层级超先验",
      "高斯熵模型",
      "率失真优化",
      "学习式图像压缩"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只预测<b>尺度 σ</b>、均值固定为 0 的高斯熵模型——像拼图时<b>不许看盒盖</b>，落点全靠猜，预测误差大、码率高。",
      "componentId": "hero-side"
    },
    "newMethod": {
      "desc": "同时预测<b>均值 μ 与尺度 σ</b>，再叠加<b>自回归上下文</b>——有盒盖、有邻居，落点更准，码率更低。",
      "componentId": "hero-side"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "缺了盒盖的拼图：为什么要更好的熵模型",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "本节先让你亲手体验「没有盒盖」时拼图有多难，再引出学习式压缩的核心矛盾：旧熵模型只预测尺度、均值固定为 0。",
      "analogy": {
        "title": "缺了盒盖的拼图",
        "text": "没有盒盖参照，你只能靠猜——拼图左右摇晃，<b>均值</b>固定为零，怎么都对不上。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "试着在没有盒盖时拼一块",
          "desc": "拖动滑块模拟「没有盒盖」的难处：越往右，你越不确定这块该放哪，<b>预测误差</b>越大。点「看盒盖」后拼图稳稳落位。",
          "componentId": "mod-1-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "加上盒盖与邻居，稳稳落位",
          "desc": "同样的难度下，加入「盒盖参照（均值预测）」和「邻居参照（上下文）」，观察拼块如何稳定落位、误差如何变小。",
          "componentId": "mod-1-2"
        }
      ],
      "insight": "旧方法把每个隐变量的<b>均值固定为 0</b>，等于拼图时不许看盒盖；本文让模型<b>同时预测均值和尺度</b>，还能参考已放好的邻居。",
      "formula": {
        "lead": "压缩的目标用一句话说就是：<b>用尽量少的比特，带来尽量小的失真</b>。",
        "unicode": "R + λ·D = E[ −log₂ p(ŷ) ] + λ·E[ d(x, x̂) ]",
        "symbols": [
          {
            "sym": "R",
            "desc": "码率——写进文件需要多少比特"
          },
          {
            "sym": "D",
            "desc": "失真——重建图与原图差多少"
          },
          {
            "sym": "λ",
            "desc": "权衡系数——越大越偏向「保画质」"
          },
          {
            "sym": "ŷ",
            "desc": "量化后的隐变量"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "学习式压缩",
          "desc": "编码器 → 量化隐变量 → 熵模型无损编码。"
        },
        {
          "icon": "🔧",
          "title": "旧方法的短板",
          "desc": "只预测尺度、均值固定为 0，留下结构没被利用。"
        },
        {
          "icon": "✨",
          "title": "本文的思路",
          "desc": "同时预测均值+尺度，并参考已解码邻居。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把照片切成拼图块：编码成隐变量",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一节说要有更好的熵模型，这一节先看清「要建模的对象」——编码器把图像变成的量化隐变量到底长什么样。",
      "analogy": {
        "title": "把照片切成拼图块",
        "text": "编码器把整张图<b>切成小块</b>并转成数字——这些块就是<b>隐变量</b>，每一块还要再被<b>取整</b>。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "点击图片，看隐变量网格",
          "desc": "点击左侧图片的任一区域，右侧显示该区域对应的<b>隐变量网格</b>及其取值——理解编码器如何把像素变成可压缩的块。",
          "componentId": "mod-2-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "像素变隐变量",
          "desc": "编码器把图像非线性映射成低维隐变量（拼图块）。"
        },
        {
          "icon": "🔧",
          "title": "量化取整",
          "desc": "隐变量还要被量化取整，才能被熵编码。"
        },
        {
          "icon": "✨",
          "title": "结构越丰富越值得建模",
          "desc": "越复杂的图像区域，隐变量的结构越丰富。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "两块线索：邻居拼片 vs 盒盖",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "有了隐变量，关键问题是：预测它的取值能用哪两条线索？这一节讲清楚「邻居（上下文）」和「盒盖（超先验）」各自的角色。",
      "analogy": {
        "title": "两块线索，一个答案",
        "text": "邻居拼片告诉你<b>这块附近是什么</b>，盒盖告诉你<b>整幅图长什么样</b>——两条线索合起来才准。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "只靠邻居 vs 只靠盒盖 vs 两者都要",
          "desc": "点「开始对比」，三条并排的拼块线分别只用「邻居」「盒盖」「邻居+盒盖」预测，看谁的<b>预测误差</b>最小。",
          "componentId": "mod-3-1"
        }
      ],
      "insight": "上下文与超先验<b>互补</b>：超先验能「看到未来」但要花码率，上下文只靠已解码邻居、不花码率却看不到未来——合并最准。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "上下文看过去",
          "desc": "从已解码邻居预测，看的是过去。"
        },
        {
          "icon": "🔧",
          "title": "超先验看未来",
          "desc": "是随图传输的边信息，能看全局但要花码率。"
        },
        {
          "icon": "✨",
          "title": "核心洞见",
          "desc": "两者互补，合并后熵模型最准。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "拼得多紧就有多确定：均值与尺度",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "上一节看到两条线索互补，这一节把「互补」落成数学：均值 μ 与尺度 σ 如何构成每个隐变量的高斯熵模型。",
      "analogy": {
        "title": "拼得多紧就有多确定",
        "text": "<b>均值 μ</b> 告诉你这块该放哪，<b>尺度 σ</b> 告诉你放得有多确定——缝越紧，σ 越小，越省比特。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动拼块，看均值和尺度怎么变",
          "desc": "左右拖动拼块，观察右侧<b>高斯分布</b>的中心（均值 μ）和宽窄（尺度 σ）如何随之改变，以及需要多少<b>码率</b>。",
          "componentId": "mod-4-1"
        }
      ],
      "insight": "均值决定<b>落点</b>，尺度决定<b>确定度</b>：σ 越小熵越低、码率越低——这就是熵模型的价值所在。",
      "formula": {
        "lead": "合并后的熵模型，把每个隐变量看成<b>中心在 μ、宽窄由 σ 决定的高斯</b>。",
        "unicode": "p(ŷ | ẑ) = ∏ᵢ ( N(μᵢ, σᵢ²) ∗ U(−½, ½) )( ŷᵢ )",
        "symbols": [
          {
            "sym": "ŷ",
            "desc": "量化后的隐变量"
          },
          {
            "sym": "ẑ",
            "desc": "量化后的超隐变量（盒盖信息）"
          },
          {
            "sym": "μᵢ",
            "desc": "第 i 个隐变量的预测均值——这块该放哪"
          },
          {
            "sym": "σᵢ²",
            "desc": "预测方差——放得有多不确定"
          },
          {
            "sym": "ŷᵢ",
            "desc": "第 i 个量化隐变量"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "高斯卷积单位均匀",
          "desc": "每个隐变量建模成「高斯卷积单位均匀分布」。"
        },
        {
          "icon": "🔧",
          "title": "均值与尺度",
          "desc": "μ 是最佳猜测，σ 是不确定度。"
        },
        {
          "icon": "✨",
          "title": "越紧越省",
          "desc": "σ 越小越确定、熵越低、码率越低。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "用哪份参考：超先验的边信息代价",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "均值+尺度更好，但盒盖（超先验）是要花钱的边信息。这一节量化「用哪份参考」的代价，看清 GSM/高斯(均值+尺度)/上下文三种选择。",
      "analogy": {
        "title": "翻看盒盖要付点代价",
        "text": "盒盖能告诉你全图，但这张「盒盖信息」也要<b>随图一起传</b>——多花的这些比特就是<b>边信息</b>的代价。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "GSM / 高斯(均值+尺度) / 上下文，选哪个",
          "desc": "切换「只尺度(GSM)」「均值+尺度(高斯)」「加上下文」三种芯片，观察<b>边信息代价</b>与<b>码率节省</b>的天平。",
          "componentId": "mod-5-1"
        }
      ],
      "insight": "超先验改善熵模型<b>以更多边信息为代价</b>；上下文不花码率却看不到未来——三种参考代价不同，联合使用收益最大。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "超先验是边信息",
          "desc": "改善熵模型，但要花码率。"
        },
        {
          "icon": "🔧",
          "title": "上下文免费",
          "desc": "不花码率，但只能看已解码的部分。"
        },
        {
          "icon": "✨",
          "title": "联合最优",
          "desc": "三种参考代价不同，本文做法收益最大。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一行一行拼：串行解码",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "模型定下来了，但自回归解码有个硬约束：必须按顺序逐块来。这一节亲手走一遍光栅扫描，体会串行与因果掩码。",
      "analogy": {
        "title": "一行一行拼",
        "text": "解码时<b>必须按顺序</b>一块块来，当前块只能参考<b>左上方已经拼好</b>的邻居。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "跟着光栅扫描，逐块解码",
          "desc": "用「下一步」逐块推进光栅扫描，观察当前块只能参考<b>左上方的已解码掩码</b>，以及每块的均值与尺度。",
          "componentId": "mod-6-1"
        }
      ],
      "insight": "自回归解码<b>天生串行</b>：当前块只能看左上邻居（因果掩码），这是它难以并行的根源。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "光栅扫描顺序",
          "desc": "自回归解码按顺序逐块进行。"
        },
        {
          "icon": "🔧",
          "title": "因果掩码",
          "desc": "当前块只能参考左上方已解码邻居。"
        },
        {
          "icon": "✨",
          "title": "串行依赖",
          "desc": "这是自回归难以并行的根源。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "少写几笔记录 vs 少拼错几块：λ 平衡",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "结构会了，训练目标是什么？这一节把「隐变量码率 + 超隐变量码率 + λ×失真」的天平交给 λ 来调。",
      "analogy": {
        "title": "省笔记 vs 少拼错",
        "text": "<b>λ</b> 决定你更在意<b>少写记录（码率）</b>还是<b>少拼错（失真）</b>——λ 越大越保画质。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "拖动 λ，看码率与失真怎么权衡",
          "desc": "拖动 λ 滑块，观察<b>率失真曲线</b>上的当前点如何移动，以及码率、失真两个数值的反向变化。",
          "componentId": "mod-7-1"
        }
      ],
      "formula": {
        "lead": "训练时要同时压低<b>隐变量码率、超隐变量码率、和加权的失真</b>三样。",
        "unicode": "R + λ·D = E[ −log₂ p(ŷ) ] + E[ −log₂ p(ẑ) ] + λ·E[ ||x − x̂||² ]",
        "symbols": [
          {
            "sym": "p(ŷ)",
            "desc": "隐变量的熵模型——决定隐变量码率"
          },
          {
            "sym": "p(ẑ)",
            "desc": "超隐变量的熵模型（完全分解）"
          },
          {
            "sym": "λ",
            "desc": "率失真权衡系数——越大越保画质"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "完整损失",
          "desc": "隐变量码率 + 超隐变量码率 + λ×失真。"
        },
        {
          "icon": "🔧",
          "title": "λ 是权衡系数",
          "desc": "在码率与失真之间取平衡。"
        },
        {
          "icon": "✨",
          "title": "噪声松弛",
          "desc": "训练用噪声替代量化，才能端到端求梯度。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "拼图工作台：完整的网络结构",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "把前面所有组件拼成一张完整工作台：编码器、上下文、超编解码、熵参数网络各自负责什么，数据怎么流。",
      "analogy": {
        "title": "把两样参考摆好",
        "text": "编码器切块，上下文看邻居，超编码器做盒盖——<b>熵参数网络</b>把这两样合成最终的 μ 和 σ。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击组件，看数据怎么流",
          "desc": "点击架构图中的组件（编码器/上下文/超编码器/超解码器/熵参数网络/解码器），看它的<b>输入输出与职责</b>。",
          "componentId": "mod-8-1"
        }
      ],
      "insight": "熵参数网络用 <b>1×1 卷积</b>把盒盖 ψ 和邻居 φ 合成 μ、σ，且不能越界访问未来的上下文。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "熵参数网络",
          "desc": "把超先验 ψ 与上下文 φ 合成均值 μ、尺度 σ。"
        },
        {
          "icon": "🔧",
          "title": "超编解码做盒盖",
          "desc": "负责超先验 z/ẑ 的编解码。"
        },
        {
          "icon": "✨",
          "title": "因果掩码卷积",
          "desc": "上下文用 5×5 掩码卷积，只能看因果邻居。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "只看一眼就下手：受限上下文换速度",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "完整模型最准，但自回归串行慢。这一节看工程取舍：把上下文缩小，用一点体积换并行化。",
      "analogy": {
        "title": "只看一眼就下手",
        "text": "只瞄一眼左邻就能更快下手，代价是<b>偶尔拼错</b>——用一点体积换<b>并行化</b>的速度。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "换上下文尺寸，看体积与速度",
          "desc": "切换「5×5 / 3×3 / 7×7 / 只左邻 / 上一行3码」芯片，观察<b>体积增幅</b>与<b>并行化收益</b>的取舍条。",
          "componentId": "mod-9-1"
        }
      ],
      "insight": "限制上下文是「<b>用一点体积换并行速度</b>」的实用取舍：只左邻、上一行 3 码会带来小幅体积增加（示意），但把二维依赖降成一维。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "越小越能并行",
          "desc": "上下文越小越能并行，但预测越不准。"
        },
        {
          "icon": "🔧",
          "title": "降成一维",
          "desc": "只左邻、上一行3码带来小幅体积增加（示意）。"
        },
        {
          "icon": "✨",
          "title": "工程取舍",
          "desc": "这是「速度 vs 体积」的运行时取舍。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "谁拼得最小又最好：结果与极限",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "最后看结果：合并模型到底省了多少码率、超了谁，以及它至今没解决的代价。",
      "analogy": {
        "title": "最后一块，拼图完成",
        "text": "合并模型把最后一块<b>严丝合缝</b>地放进去——在同样画质下，它写下的记录最少。",
        "componentId": "analogy-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "码率节省赛跑",
          "desc": "点「开始对比」，看各方法相对 JPEG 的<b>码率节省</b>进度条赛跑，随后对照数据表与局限。",
          "componentId": "mod-10-1"
        }
      ],
      "insight": "本文在同样画质下<b>码率最低</b>，但自回归解码串行慢，是它尚未解决的方向。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "码率大省",
          "desc": "比最强 DL 省 15.8%、比 JPEG 省 59.8%、比 BPG 小 8.4%。"
        },
        {
          "icon": "🔧",
          "title": "双超 BPG",
          "desc": "首个在 PSNR 与 MS-SSIM 上都超过 BPG 的方法。"
        },
        {
          "icon": "✨",
          "title": "代价是慢",
          "desc": "自回归解码串行，速度是它的短板。"
        }
      ]
    }
  ]
};
