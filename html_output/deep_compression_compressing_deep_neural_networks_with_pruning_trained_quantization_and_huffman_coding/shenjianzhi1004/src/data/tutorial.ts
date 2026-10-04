import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Deep Compression: Compressing Deep Neural Networks with Pruning, Trained Quantization and Huffman Coding",
    "titleZh": "深度压缩：用剪枝、训练量化与霍夫曼编码压缩深度神经网络",
    "venue": "ICLR 2016 · arXiv:1510.00149",
    "authors": "Song Han, Huizi Mao, William J. Dally",
    "affiliation": "斯坦福大学 · 清华大学 · NVIDIA",
    "domain": "模型压缩 / 高效推理",
    "coreProblem": "大模型权重数量极大，占用大量存储与内存带宽，装不进移动设备，而且 DRAM 访问远比计算耗能。",
    "coreInsight": "先剪掉不重要的连接，再让相近权重共享同一个值，最后用霍夫曼编码压偏斜分布；三招叠加可把模型存储压缩 35×–49× 且不掉准确率。",
    "keywords": [
      "模型压缩",
      "剪枝",
      "权值共享",
      "霍夫曼编码"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "直接保存 32 位浮点权重：AlexNet 240MB、VGG-16 552MB，只能放在耗电的 DRAM 里。",
      "componentId": "dc-hero-old"
    },
    "newMethod": {
      "desc": "深度压缩把 AlexNet 压到 6.9MB、VGG-16 压到 11.3MB，可以放进片上 SRAM。",
      "componentId": "dc-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "模型太大：装不进的相册",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "先理解为什么要压缩：模型装不进设备，能耗也扛不住。这一章用一只塞爆的相册，让你亲手感受存储与访存的约束。",
      "analogy": {
        "title": "装满的相册",
        "text": "手想把<b>新照片</b>塞进相册，可相册早就爆满。模型也一样：几百 MB 的权重<b>塞不进手机</b>。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "存储预算",
          "desc": "拖动存储预算，看看 AlexNet 与 VGG-16 能不能放下，以及要多小才能进入片上 SRAM。",
          "componentId": "m1-budget"
        }
      ],
      "insight": "压缩不是锦上添花，而是让模型能部署到移动设备、并省下昂贵 DRAM 访存的前提。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "约束是真实的",
          "desc": "模型动辄 240MB 到 552MB，装不进手机，App 体积与下载都受限。"
        },
        {
          "icon": "🔧",
          "title": "能耗瓶颈在访存",
          "desc": "一次 DRAM 访问约 640pJ，比一次加法高约三个数量级。"
        },
        {
          "icon": "✨",
          "title": "本文三步走",
          "desc": "剪枝删冗余、量化让权重共享、霍夫曼编码压分布，合起来压 35×–49×。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "相册里到底是什么",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "既然要压，就得先看清里面有什么。这一章翻一遍相册，看清权重的分布，找出可压缩的空间。",
      "analogy": {
        "title": "翻一遍相册",
        "text": "翻过一遍才发现，<b>大多数照片几乎一样</b>，真正重要的只有少数。权重也一样：<b>小而冗余</b>的占绝大多数。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "权重分布",
          "desc": "拖动橙色阈值线扫过直方图，看有多少连接落在低幅值区域。",
          "componentId": "m2-dist"
        }
      ],
      "insight": "可压缩性来自一个事实：大多数权重很小、彼此相似，删掉或共享它们几乎不影响结果。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "冗余是常态",
          "desc": "神经网络过参数化，权重里存在大量冗余。"
        },
        {
          "icon": "🔧",
          "title": "分布不均",
          "desc": "剪枝之后权重呈双峰，大量权重集中在 0 附近。"
        },
        {
          "icon": "✨",
          "title": "两步可压",
          "desc": "先按大小删连接（剪枝），再让相近权重共享（量化）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "核心洞见：删掉不重要的照片",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "看清分布后，第一个动作就明确了：把不重要的连接删掉。这一章给出剪枝的直觉、规则与安全边界。",
      "analogy": {
        "title": "划掉没用的",
        "text": "手把糊掉、雷同的照片划掉，相册一下<b>薄了很多</b>。模型里就是删掉<b>小权值连接</b>，只留重要的。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "剪枝比例",
          "desc": "拖动剪枝比例，看连接数、存储与准确率如何变化，找到不掉点的安全区间。曲线为示意，趋势参考论文 §6.1。",
          "componentId": "m3-prune"
        }
      ],
      "insight": "剪枝的直觉是「幅值越小越不重要」：删掉它们，连接数能掉一个数量级。",
      "formula": {
        "lead": "剪枝可以写成一个「保留重要连接」的掩码操作。",
        "unicode": "W̃ = W ⊙ M , M_ij = 1[ |W_ij| ≥ λ ]",
        "symbols": [
          {
            "sym": "W",
            "desc": "原始权重矩阵（32 位浮点）。"
          },
          {
            "sym": "W̃",
            "desc": "剪枝后的稀疏权重矩阵，被剪位置为 0。"
          },
          {
            "sym": "M",
            "desc": "与 W 同形状的 0/1 掩码。"
          },
          {
            "sym": "⊙",
            "desc": "逐元素相乘。"
          },
          {
            "sym": "λ",
            "desc": "每层的小权重阈值，论文按层选择。"
          },
          {
            "sym": "1[·]",
            "desc": "条件成立取 1，否则取 0。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "只留要用的",
          "desc": "先正常训练，再删掉小于阈值的连接。"
        },
        {
          "icon": "🔧",
          "title": "数量很可观",
          "desc": "AlexNet 连接减到 1/9，VGG-16 减到 1/13。"
        },
        {
          "icon": "✨",
          "title": "阈值留余量",
          "desc": "剪太狠会掉点，需要重训练兜底。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "剪枝怎么不伤模型",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "删掉连接后准确率会短暂下降。这一章看剪枝如何靠重训练把精度补回来，形成可迭代的闭环。",
      "analogy": {
        "title": "对着刻度检查",
        "text": "手拿放大镜，对着<b>清晰度刻度</b>一张张检查，不够格的丢掉。模型里，这个刻度就是<b>权重阈值</b>。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "剪枝—重训练循环",
          "desc": "用上一步、下一步走一遍「训练 → 剪枝 → 重训练 → 再剪一轮」，看精度怎么被拉回来。",
          "componentId": "m4-loop"
        }
      ],
      "insight": "剪枝不是一次性动作，而是「删一点、再训回来」的循环；掩码负责挡住被剪连接的更新。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "剪枝必配重训练",
          "desc": "删除之后要重新学习剩余连接。"
        },
        {
          "icon": "🔧",
          "title": "掩码实现",
          "desc": "用掩码挡住被剪连接的梯度更新。"
        },
        {
          "icon": "✨",
          "title": "可以迭代",
          "desc": "多轮「剪枝 → 重训练」逐步逼近目标。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "权值共享：把相似的照片并成一组",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "剪枝减少了连接的数量。这一章换个方向：不删连接，而是让相近的权重共享同一个值，降低每个连接需要的位数。",
      "analogy": {
        "title": "摞成一叠",
        "text": "一组连拍只留<b>一张代表</b>就够，其余只要记住「它属于哪一叠」。相近的权重也<b>共享一个值</b>。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "分几组",
          "desc": "切换聚类数 k，观察簇内误差、每连接位数与码本大小的权衡。",
          "componentId": "m5-cluster"
        }
      ],
      "insight": "聚类的目标很朴素：让每个权重离它所属的中心尽量近。k 越大误差越小，但索引位数越多。",
      "formula": {
        "lead": "聚类要让每个权重离它所属的中心尽量近。",
        "unicode": "argmin_C Σ_{i=1}^{k} Σ_{w∈c_i} ‖ w − c_i ‖²",
        "symbols": [
          {
            "sym": "C",
            "desc": "所有中心值构成的集合 {c₁,…,c_k}。"
          },
          {
            "sym": "k",
            "desc": "每层的聚类数，也就是共享权值个数。"
          },
          {
            "sym": "c_i",
            "desc": "第 i 个簇的中心值（共享权值）。"
          },
          {
            "sym": "w",
            "desc": "落入该簇的某个原始权重。"
          },
          {
            "sym": "n ≫ k",
            "desc": "权重数远大于簇数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "每层聚类",
          "desc": "一维 k-means，同簇共享中心值，权重不跨层共享。"
        },
        {
          "icon": "🔧",
          "title": "训练后再聚",
          "desc": "比训练前用哈希固定共享更贴合网络。"
        },
        {
          "icon": "✨",
          "title": "有得必有失",
          "desc": "组越多误差越小，索引位数越多。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "码本与索引：相册里只留编号",
      "badge": "inf",
      "badgeLabel": "基础必读",
      "bridge": "上一章把相近权重并成了 k 组。这一章看这些组最终怎么存：一张码本，加上每个连接的一个短索引。",
      "analogy": {
        "title": "贴上编号",
        "text": "每叠只留<b>一张代表</b>并给它编号，其余照片只写编号。模型里就变成<b>码本 + 索引</b>。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "码本与索引",
          "desc": "点击一个共享权值，看哪些连接在用它的索引，以及权重、索引、码本各占多少存储。",
          "componentId": "m6-codebook"
        }
      ],
      "insight": "量化的存储等于「少量中心值（码本）」加上「每个连接一个很短的索引」。",
      "formula": {
        "lead": "压缩率等于原来每个连接 b 位，除以索引位加上摊到每个连接的码本开销。",
        "unicode": "r = n·b / ( n·log₂(k) + k·b )",
        "symbols": [
          {
            "sym": "r",
            "desc": "压缩率，越大越好。"
          },
          {
            "sym": "n",
            "desc": "该层的连接数。"
          },
          {
            "sym": "b",
            "desc": "每个共享权值占的位数，例如 32。"
          },
          {
            "sym": "k",
            "desc": "共享权值个数，也就是码本大小。"
          },
          {
            "sym": "n·log₂(k)",
            "desc": "所有索引的总位数。"
          },
          {
            "sym": "k·b",
            "desc": "码本的总位数，开销很小。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "存储结构变了",
          "desc": "从每个权重 32 位，变成少量中心值加每连接短索引。"
        },
        {
          "icon": "🔧",
          "title": "索引很便宜",
          "desc": "k 个中心只要 log₂k 位索引。"
        },
        {
          "icon": "✨",
          "title": "码本开销小",
          "desc": "码本只占很小一部分，常常可以忽略。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "让分组不掉质量：中心微调",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "聚类只是近似，直接用量化权重会掉点。这一章讲「训练量化」里真正的那一步训练：用梯度把中心值调好。",
      "analogy": {
        "title": "反复对齐",
        "text": "代表照不是贴上去就完事，手要反复<b>微调</b>它，让整组看起来一致。中心值也要<b>再训练</b>。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "微调前 vs 微调后",
          "desc": "按下同一次比较，左右两栏从同一初始状态出发：左边只聚类，右边聚类加中心微调。",
          "componentId": "m7-finetune"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "梯度归到中心",
          "desc": "用 4×4 梯度矩阵演示「按索引分组求和，再更新中心值」。",
          "componentId": "m7-gradient"
        }
      ],
      "insight": "一个中心值接收同簇所有连接求和后的梯度，所以整簇能被「一起」训练。",
      "formula": {
        "lead": "中心值的梯度，就是所有用到它的连接梯度之和。",
        "unicode": "∂L/∂C_k = Σ_{i,j} (∂L/∂W_ij) · 1[ I_ij = k ]",
        "symbols": [
          {
            "sym": "L",
            "desc": "损失函数。"
          },
          {
            "sym": "W_ij",
            "desc": "第 i 列、第 j 行的权重。"
          },
          {
            "sym": "I_ij",
            "desc": "权重 W_ij 所属中心值的索引。"
          },
          {
            "sym": "C_k",
            "desc": "第 k 个中心值（共享权值）。"
          },
          {
            "sym": "1[·]",
            "desc": "示性函数，I_ij 等于 k 时取 1。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "微调是必需的",
          "desc": "聚类之后还要再训练中心值。"
        },
        {
          "icon": "🔧",
          "title": "梯度按簇求和",
          "desc": "同一簇的连接共享一次更新。"
        },
        {
          "icon": "✨",
          "title": "初始化要挑",
          "desc": "线性初始化保住了大权重，效果最好。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "三阶段流水线",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "剪枝、量化、霍夫曼编码都讲完了。这一章把它们拼成一条流水线，看压缩率如何一步步累积。",
      "analogy": {
        "title": "收进薄盒",
        "text": "删、并、编号都做完，相册被收进<b>薄盒</b>。论文里就是<b>剪枝 → 量化 → 霍夫曼</b>三阶段协同。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "压缩流水线",
          "desc": "点击三个阶段并切换模型，观察存储如何从 240MB 一步步降到 6.9MB。",
          "componentId": "m8-pipeline"
        }
      ],
      "insight": "三个阶段互补：剪枝让可训练权重更少、量化误差更小；霍夫曼再吃掉偏斜分布。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三步协同",
          "desc": "剪枝、量化、霍夫曼编码合起来压 35×–49×。"
        },
        {
          "icon": "🔧",
          "title": "顺序有讲究",
          "desc": "先剪枝让可训练权重更少，量化误差更小。"
        },
        {
          "icon": "✨",
          "title": "互不干扰",
          "desc": "剪枝不会削弱量化，反而常常更好。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "霍夫曼编码与稀疏索引",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "三阶段里的最后一步是无损编码。这一章看变长码如何利用分布偏斜，以及稀疏索引怎么存。",
      "analogy": {
        "title": "短签给常客",
        "text": "常出现的编号配<b>最短的标签</b>，罕见的用长标签。这就是<b>霍夫曼编码</b>。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "频率与码长",
          "desc": "拖动分布偏斜，观察高频符号如何拿到短码，以及平均码长如何下降。",
          "componentId": "m9-huffman"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "相对索引",
          "desc": "拖动一个索引差值，比较存相对差值比存绝对位置省多少，以及越界时如何补零。",
          "componentId": "m9-index"
        }
      ],
      "insight": "分布越偏斜，变长码越省；稀疏索引则存相对差值，越界时补零分片。",
      "formula": {
        "lead": "平均码长等于每个符号的概率乘它的码长之和，越常出现的符号码长越短，平均值就越小。",
        "unicode": "L̄ = Σ_i p_i · l_i",
        "symbols": [
          {
            "sym": "L̄",
            "desc": "平均码长，每个符号的平均位数，越小越好。"
          },
          {
            "sym": "p_i",
            "desc": "第 i 个符号的出现概率。"
          },
          {
            "sym": "l_i",
            "desc": "第 i 个符号的霍夫曼码长。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "高频短码",
          "desc": "变长码让常见符号只花更少的位。"
        },
        {
          "icon": "🔧",
          "title": "分布越偏越省",
          "desc": "论文实测再省约 20%–30%。"
        },
        {
          "icon": "✨",
          "title": "索引存差值",
          "desc": "稀疏索引存相对位置，越界时补零。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、速度与局限",
      "badge": "both",
      "badgeLabel": "深入原理",
      "bridge": "前面讲的是机制，这一章把压缩前后的真实数字放到同一把秤上，并说清适用边界。",
      "analogy": {
        "title": "上秤比一比",
        "text": "整理前的相册又厚又重，整理后<b>轻得多</b>，内容还一样。论文把压缩前后放上了<b>同一把秤</b>。",
        "componentId": "dc-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果对照",
          "desc": "按下开始，让不同模型的压缩前后在同一坐标上赛跑，并切换指标查看误差、加速与能耗。",
          "componentId": "m10-race"
        }
      ],
      "insight": "35×–49× 的压缩不是用精度换来的；但量化模型的硬件收益尚未被基准覆盖，这是明确边界。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "数据说话",
          "desc": "压缩 35×–49×、精度不变，AlexNet 6.9MB、VGG-16 11.3MB。"
        },
        {
          "icon": "🔧",
          "title": "顺带提速省电",
          "desc": "剪枝模型有 3×–4× 加速与 3×–7× 更省电。"
        },
        {
          "icon": "✨",
          "title": "认清边界",
          "desc": "量化只看存储，硬件上没测；霍夫曼对 LeNet 增益有限。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1384y187tL",
      "title": "模型压缩架构和流程介绍！量化/剪枝/蒸馏/二值化 4 件套",
      "reason": "模型压缩总览，先建立整体框架再进入本文细节。",
      "cover": "https://i0.hdslb.com/bfs/archive/cfec6f96326fd120b9bfbfbae84b3c962ac715ad.jpg",
      "views": "3.3万播放"
    },
    {
      "bvid": "BV1y34y1Z7KQ",
      "title": "模型剪枝核心原理！模型剪枝算法和流程介绍",
      "reason": "剪枝原理与流程，对应本文第一阶段。",
      "cover": "https://i1.hdslb.com/bfs/archive/3c3f9fc69f9c6911e5c7ad658227df26672cfc74.jpg",
      "views": "2.4万播放"
    },
    {
      "bvid": "BV1VD4y1n7AR",
      "title": "低比特量化原理！【推理引擎】模型压缩系列第 02 篇",
      "reason": "低比特量化原理，对应本文权值共享/量化阶段。",
      "cover": "https://i1.hdslb.com/bfs/archive/c297c9b3ad4ea6180fdd76526d08bdcfdb6bee54.jpg",
      "views": "1.9万播放"
    },
    {
      "bvid": "BV11q4y1r7MN",
      "title": "分享文章：深度压缩：剪枝，量化，哈夫曼（含代码）",
      "reason": "唯一逐篇讲解本文（剪枝+量化+哈夫曼，含代码）的视频；播放量较低但主题完全对应。",
      "cover": "https://i1.hdslb.com/bfs/archive/342384821cb7484d92fa8b5f7667ab1c88b3c148.jpg",
      "views": "531播放"
    }
  ]
};
