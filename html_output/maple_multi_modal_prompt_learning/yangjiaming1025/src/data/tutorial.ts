import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "MaPLe: Multi-modal Prompt Learning",
    "titleZh": "让图像与文字，一起适应新任务",
    "venue": "CVPR 2023",
    "authors": "Muhammad Uzair Khattak · Hanoona Rasheed · Muhammad Maaz · Salman Khan · Fahad Shahbaz Khan",
    "affiliation": "MBZUAI · Australian National University · Linköping University",
    "domain": "视觉语言模型 · 少样本学习 · 提示学习",
    "coreProblem": "当新任务只有少量标注图片时，只调整文字侧提示，可能限制图像与文字共同适应的能力。",
    "coreInsight": "MaPLe 在冻结的 CLIP 两条分支中加入可学习提示，用映射将文字提示与视觉提示相连，并在多个早期层分别注入。你将用 10 个短章节，亲手拆开这套机制，再回到真实实验判断它的价值。",
    "keywords": [
      "CLIP → CoOp → CoCoOp → MaPLe",
      "双分支协同",
      "深层提示",
      "Base → New"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "CoOp：文字侧学习提示，视觉侧没有对应的提示输入。",
      "componentId": "maple-hero-old"
    },
    "newMethod": {
      "desc": "MaPLe：两条分支都加入提示，由同一组文字提示通过 F 关联起来。",
      "componentId": "maple-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么要让两条分支一起适应？",
      "badge": "both",
      "badgeLabel": "问题与直觉",
      "bridge": "CLIP 已经能把图片与类别名称联系起来。MaPLe 想解决的下一步是：只有少量新任务样本时，<b>怎样同时调整图像与文字的表示方式</b>，又保留原有的泛化能力？",
      "analogy": {
        "title": "只改图鉴的文字说明，够吗？",
        "text": "图鉴里的图片和说明需要相互配合。这里把两侧的批注类比为提示向量；它们调整编码方式，不会改写图片像素。",
        "componentId": "maple-analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "沿着四篇论文，看提示放在哪里",
          "desc": "先看 CoOp 的单侧提示，再切换到 MaPLe。留意：绿色提示出现在哪一侧，紫色连接又连接了什么。",
          "componentId": "maple-methods"
        }
      ],
      "insight": "MaPLe 的关键是<b>多模态 + 耦合 + 深层</b>。先理解“双方都可适应”，再逐步拆开后两个设计。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "已有能力来自 CLIP",
          "desc": "MaPLe 利用预训练的图文模型，而不是重新从头训练。"
        },
        {
          "icon": "↔",
          "title": "单侧适应有局限",
          "desc": "只改变文字提示，无法直接给视觉分支加入提示。"
        },
        {
          "icon": "✦",
          "title": "结构创新需要证据",
          "desc": "多加一条分支并不自动保证更好，最后要看实测的泛化结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图片和类别名称，如何放在一起比较？",
      "badge": "inf",
      "badgeLabel": "CLIP 基础",
      "bridge": "要理解提示改变了什么，先看 CLIP 如何做分类：图片走视觉编码器，候选类别名称走文字编码器，再比较两侧输出的<b>特征方向</b>。",
      "analogy": {
        "title": "用同一套索引查图鉴",
        "text": "放大镜让观察聚焦到细节，共同索引让图片和类别名称可以比较。下面把这个直觉变成能亲手计算的特征方向。",
        "componentId": "maple-analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "把“相似”变成一次可计算的比较",
          "desc": "切换图片，再逐个检查候选类别。观察向量的夹角与点积如何一起变化。所有坐标都是<b>手工设定的教学数值</b>。",
          "componentId": "maple-matching"
        }
      ],
      "formula": {
        "lead": "归一化后，两个单位向量的点积就是余弦相似度。分数越高，表示方向越接近。",
        "unicode": "s(x, c) = v(x) · t(c)；预测类别 = argmax₍c₎ s(x, c)",
        "symbols": [
          {
            "sym": "v(x)",
            "desc": "图像 x 经视觉编码器、最终投影和归一化后的特征。"
          },
          {
            "sym": "t(c)",
            "desc": "候选类别 c 连同提示，经文字编码器、最终投影和归一化后的特征。"
          },
          {
            "sym": "·",
            "desc": "对应分量相乘再相加，叫作点积。"
          },
          {
            "sym": "argmax",
            "desc": "选出所有候选类别中分数最高的那一个。"
          },
          {
            "sym": "s(x, c)",
            "desc": "图像 x 与候选类别 c 的相似度分数。逐个比较候选类别的分数后，选择最高者；分数本身不是概率。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↗",
          "title": "比较的是表示",
          "desc": "编码器把原始输入转换成可比较的特征向量。"
        },
        {
          "icon": "∠",
          "title": "相似度不是概率",
          "desc": "余弦分数还不是分类概率；训练时会进一步缩放并计算损失。"
        },
        {
          "icon": "512",
          "title": "二维只是示意",
          "desc": "论文中的两侧最终特征都在 512 维空间中比较。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "提示在学习，还是在随每张图变化？",
      "badge": "both",
      "badgeLabel": "参数与输入",
      "bridge": "现在知道输出特征负责分类了。提示则是放进编码器的<b>可训练向量</b>，它帮助模型形成适合当前任务的特征。需要分清：参数改变与输入改变不是一回事。",
      "analogy": {
        "title": "一套编校规则，可以服务许多条目",
        "text": "一张书签可以在许多条目间复用，但每页内容仍不同。MaPLe 的提示在训练后共享，特征输出仍随图片或类别改变。",
        "componentId": "maple-analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "只改变一个输入，找出保持不变的量",
          "desc": "分别尝试换图片和换类别。画面上排是固定提示，下排是输出特征；观察哪一部分真正发生变化。",
          "componentId": "maple-invariants"
        }
      ],
      "insight": "这里的“固定”指<b>当前任务训练完成后的推理阶段</b>。训练时 Pᵢ 与 Fᵢ 都会更新；换一个任务通常需要重新训练它们。",
      "takeaways": [
        {
          "icon": "P",
          "title": "提示是向量参数",
          "desc": "可学习提示不要求对应某段人类可读的自然语言。"
        },
        {
          "icon": "＝",
          "title": "训练后共享",
          "desc": "同一任务里的类别与图像使用同一组已学习的 Pᵢ 和 Fᵢ。"
        },
        {
          "icon": "↻",
          "title": "输出仍因输入而异",
          "desc": "共享提示不会让不同图片或类别得到完全相同的特征。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "一次修改，怎样抵达两个分支？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "上一节看到，提示向量可以跨图片、跨类别复用。接下来要解决的是：文字与视觉两边都能学习时，怎样让一次提示修改同时影响两边？",
      "analogy": {
        "title": "用同一把描图尺联动两侧页边",
        "text": "沿同一把描图尺调整两侧页边，一次改动就有了关联。MaPLe 用映射 F 建立这种依赖：视觉提示由文字提示计算得到。",
        "componentId": "maple-analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动提示，比较独立与耦合",
          "desc": "保持图片和类名不变，只移动文字提示的示意点。在两种连接方式间切换，看视觉提示条是否响应。",
          "componentId": "maple-coupling"
        }
      ],
      "insight": "关键不是“两个分支是否使用同一个损失”，而是视觉提示是否明确依赖文字提示。独立双支也共享分类监督；MaPLe 用 Fᵢ 把两边的提示参数关联起来。",
      "formula": {
        "lead": "耦合映射把本层文字提示变成同层视觉提示，前向方向只有这一条。",
        "unicode": "P̃ᵢ = Fᵢ(Pᵢ)",
        "symbols": [
          {
            "sym": "Pᵢ",
            "desc": "第 i 组可学习文字提示，形状 b × 512。"
          },
          {
            "sym": "Fᵢ",
            "desc": "可学习的仿射映射，逐个提示把 512 维映射为 768 维。"
          },
          {
            "sym": "P̃ᵢ",
            "desc": "派生的视觉提示，形状 b × 768；不是独立的一组自由参数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔗",
          "title": "连接的是提示参数",
          "desc": "Fᵢ 的输入是 Pᵢ，不是类别名称或文字编码器的最终输出。"
        },
        {
          "icon": "↔️",
          "title": "独立也有共同监督",
          "desc": "独立双支仍共享分类损失；耦合增加显式的参数依赖。"
        },
        {
          "icon": "🧪",
          "title": "示意不代替实验",
          "desc": "二维到三维的小模型只展示依赖关系，不证明准确率提升。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "深层提示：先替换，再继续传播",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "耦合解释了同一层的两支如何关联。但一次输入提示未必能覆盖整个编码过程，因此 MaPLe 在多个早期层放入各自的提示。它们怎样接续？",
      "analogy": {
        "title": "翻到下一页，保留已有观察",
        "text": "翻到下一页，可以换一条新的页边注记，同时保留已有观察。对应到模型，只替换提示槽位，普通 token 的状态仍然传下去。",
        "componentId": "maple-analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "走过 12 层，观察哪些槽位被替换",
          "desc": "先选 J = 3 和第 2 层，按四步看清一次提示替换；再选择第 4 层，检查越过注入边界后，哪些状态继续保留。",
          "componentId": "maple-depth"
        }
      ],
      "insight": "替换旧提示位置不会抹去整层信息：普通 token 已经受到此前提示影响，仍然向后传递。超过 J 后，提示隐藏状态也继续传播，并非突然被删掉。",
      "formula": {
        "lead": "J 控制前多少层注入新的参数提示；后面的层继续处理已有状态。",
        "unicode": "k ≤ J：换入 Pₖ₋₁；k > J：传播已有提示隐藏状态",
        "symbols": [
          {
            "sym": "k",
            "desc": "当前 Transformer 层，从第 1 层开始计数。"
          },
          {
            "sym": "J",
            "desc": "注入新提示的早期层数；主要实验配置为 9。"
          },
          {
            "sym": "Pₖ₋₁",
            "desc": "本层独有的文字提示；视觉提示由对应的 Fₖ₋₁ 生成。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📑",
          "title": "深度增加提示组数",
          "desc": "J = 9 是 1 组浅层加 8 组深层提示，序列不会逐层无限加长。"
        },
        {
          "icon": "🌱",
          "title": "保留普通 token 的影响",
          "desc": "换掉提示槽位时，原输入 token 的隐藏状态仍然保留。"
        },
        {
          "icon": "🔍",
          "title": "浅层 MaPLe 仍是双支",
          "desc": "完整 MaPLe 的 J = 1 仍有耦合与视觉提示，不能直接等同于 CoOp。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "学会之后，怎样识别新类别？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "看清逐层提示后，接着追踪它们何时学习、何时停止更新。论文中的“新类别”指任务适配时没有训练图像的类别；预测时仍会提供候选类别名称。",
      "analogy": {
        "title": "把旧图鉴的标注法用到新一页",
        "text": "把新标本放进图鉴，检查原来的标注方法是否仍适用。模型也会固定训练好的提示，再去检验从未参与适配的新类别或新数据。",
        "componentId": "maple-analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "从训练卡片走到目标测试",
          "desc": "切换三种评测，再逐步查看数据准备、提示学习、固定提示和目标分类。留意目标图像有没有进入训练。",
          "componentId": "maple-protocol"
        }
      ],
      "insight": "“新类别零样本”不等于 MaPLe 没有训练。它先在指定的训练类别上学习提示，测试新类别时不再优化；类别名称用于构造候选文字特征。",
      "formula": {
        "lead": "对一张目标图像，比较所有候选类别的特征，选择相似度最高的一类。",
        "unicode": "预测类别 = argmax_c ⟨v, t_c⟩",
        "symbols": [
          {
            "sym": "v",
            "desc": "归一化后的图像特征。"
          },
          {
            "sym": "t_c",
            "desc": "候选类别 c 对应的归一化文字特征。"
          },
          {
            "sym": "argmax",
            "desc": "找出使相似度最大的候选类别。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🗂️",
          "title": "先分清没有见过什么",
          "desc": "三种协议分别检验新类别、其他数据集与图像分布变化。"
        },
        {
          "icon": "🔒",
          "title": "推理时提示也固定",
          "desc": "学习结束后，P_i 与 F_i 不再为每张测试图像重新训练。"
        },
        {
          "icon": "🏷️",
          "title": "新类别名称仍然已知",
          "desc": "没有新类别训练图像，不等于不给模型候选类别名称。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "权重冻结了，提示为什么还能学？",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "上一节把训练与新类测试分开了。现在回到训练内部：如果预训练编码器不更新，分类误差怎样让页边的提示向量发生变化？",
      "analogy": {
        "title": "修改页边，保留印版",
        "text": "铅笔修订页边，印版保持原样。模型更新的是提示与映射；冻结的编码器仍参与运算，并把梯度传回可学习的输入。",
        "componentId": "maple-analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "沿梯度走一遍：计算、反传、更新",
          "desc": "上半区用一个可计算的标量玩具展示冻结运算，下半区独立展示 MaPLe 的两条梯度路径。二者不要当成同一个训练实验。",
          "componentId": "maple-gradients"
        }
      ],
      "insight": "冻结的是参数更新，不是求导路径。梯度仍需经过编码器回到提示；通过 Fᵢ，视觉分支的梯度也能抵达 Pᵢ。两路梯度不保证同向，Fᵢ 自身也会学习。",
      "formula": {
        "lead": "以下只属于标量玩具。固定系数仍参与链式法则，因此提示 p 能收到梯度。",
        "unicode": "h = 2(u + p)，L = ½h²，∂L/∂p = 2h",
        "symbols": [
          {
            "sym": "u",
            "desc": "玩具里的固定输入 0.5。"
          },
          {
            "sym": "p",
            "desc": "玩具里的可学习标量；不是真实 CLIP 提示。"
          },
          {
            "sym": "2",
            "desc": "冻结的乘法系数，参与计算但不更新。"
          },
          {
            "sym": "L",
            "desc": "玩具平方误差；真实 MaPLe 使用类别 logits 上的分类交叉熵。"
          },
          {
            "sym": "h",
            "desc": "玩具模型的输出：输入 u 与提示 p 相加，再乘固定系数 2。这里 h=2(u+p)。"
          },
          {
            "sym": "∂L/∂p",
            "desc": "误差对提示 p 的导数。它告诉我们 p 略微变化时误差如何变化；更新时沿负梯度方向迈出一小步。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔒",
          "title": "冻结不截断梯度",
          "desc": "权重不更新，仍可以计算输出对提示输入的导数。"
        },
        {
          "icon": "🛤️",
          "title": "两条路径汇到 Pᵢ",
          "desc": "文字路径直接到 Pᵢ，视觉路径经过 Fᵢ；映射参数也更新。"
        },
        {
          "icon": "🧮",
          "title": "分清玩具与真实损失",
          "desc": "页面的平方误差只讲链式法则，论文适配使用分类交叉熵。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "拼回完整的 MaPLe 前向过程",
      "badge": "both",
      "badgeLabel": "整体框架",
      "bridge": "提示的来源、逐层替换与训练梯度都已清楚。现在把它们拼回一次预测，检查哪里耦合、哪里保持独立，以及最后究竟比较什么。",
      "analogy": {
        "title": "叠上透明索引，读完整本图鉴",
        "text": "把透明索引叠回图鉴，局部关系就组成了完整流程。接下来沿着图片、提示与类别特征，逐步看清一次预测。",
        "componentId": "maple-analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点亮五个节点，追踪一张图的去向",
          "desc": "从输入到类别比较逐步点选，特别区分紫色 Fᵢ 与两支末端的冻结投影。点击任何阶段都可以返回重看。",
          "componentId": "maple-architecture"
        }
      ],
      "insight": "Fᵢ 的任务是把提示从文字隐藏维度映射到视觉隐藏维度；CLIP 原有的末端投影才把两支读出变成可以比较的特征。两种投影的位置、对象与是否训练都不同。",
      "formula": {
        "lead": "最终读出经冻结投影得到 z，再做长度归一化，才得到用于比较的 v 与 t_c。",
        "unicode": "v = zᵥ / ‖zᵥ‖，t_c = z_c / ‖z_c‖",
        "symbols": [
          {
            "sym": "zᵥ",
            "desc": "视觉 CLS 读出经原有图像投影后的特征。"
          },
          {
            "sym": "z_c",
            "desc": "类别 c 的文字 EOT 读出经原有文字投影后的特征。"
          },
          {
            "sym": "v",
            "desc": "归一化图像特征，最终为 512 维。"
          },
          {
            "sym": "t_c",
            "desc": "归一化类别文字特征，同样为 512 维。"
          },
          {
            "sym": "‖zᵥ‖",
            "desc": "图像向量 zᵥ 的长度（L2 范数）。除以这个长度后，向量方向不变、长度变为 1。"
          },
          {
            "sym": "‖z_c‖",
            "desc": "类别向量 z_c 的长度。每个候选类别都单独归一化，使最后比较的是方向相似性。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "中间耦合，末端比较",
          "desc": "提示通过 Fᵢ 关联，两支独立编码后在最终特征空间比较。"
        },
        {
          "icon": "📐",
          "title": "两个投影别混淆",
          "desc": "可学习 Fᵢ 做 512 → 768；冻结末端投影得到共同的 512 维输出。"
        },
        {
          "icon": "🎯",
          "title": "测试时只做前向",
          "desc": "输入图片与候选类名，选择最高相似度类别；不再优化提示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "提示加多少，才算够？",
      "badge": "trn",
      "badgeLabel": "容量与代价",
      "bridge": "完整结构有两个可以调整的量：J 表示前多少层加入可学习提示，b 表示每层有多少个提示向量。结构规模能直接数出来，新类别表现必须靠实验测量。",
      "analogy": {
        "title": "更宽的页边，也可能写得太满",
        "text": "页边更宽，能容纳更多注记，却不保证更会辨认新标本。提示的深度和长度决定可调整空间，效果仍要通过实验判断。",
        "componentId": "maple-analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "先数结构，再查看证据",
          "desc": "调整深度和长度，直接观察提示位置与数量。下方将结构计算、论文验证结论和可训练参数分别呈现。",
          "componentId": "maple-budget"
        }
      ],
      "insight": "滑块能确定提示的数量与位置，不能预测准确率。论文的深度实验与长度实验也不能拼成一张任意 J×b 组合的性能地图。",
      "formula": {
        "lead": "每层有 b 个提示位置，前 J 层分别设置提示，因此每个分支共对应 J×b 个层级提示位置。",
        "unicode": "层级提示位置数 = J × b",
        "symbols": [
          {
            "sym": "J",
            "desc": "前 J 层引入各层独立的可学习提示。"
          },
          {
            "sym": "b",
            "desc": "每层提示向量的数量。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "数量不等于性能",
          "desc": "默认 J=9、b=2 是论文的一套设置，不是所有任务的最优答案。"
        },
        {
          "icon": "🌿",
          "title": "视觉提示由文字提示生成",
          "desc": "视觉提示有对应位置，但并非另一套独立自由参数。"
        },
        {
          "icon": "⚖️",
          "title": "参数、速度、泛化分开看",
          "desc": "更少可训练参数不自动等于更快；更大容量也不自动改善新类别。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果支持什么，又没有证明什么？",
      "badge": "both",
      "badgeLabel": "证据与边界",
      "bridge": "现在用真实实验检验结构设计。已见类别与新类别的准确率可能此消彼长；调和平均 HM 用于同时考察两端，随后还要检查消融、跨数据集与域变化的证据。",
      "analogy": {
        "title": "同一把尺，量两栏成绩",
        "text": "评价一本新版图鉴，要同时查看熟悉与陌生标本的成绩。统一的尺子帮助比较，但不能把总体提升说成每一项都更好。",
        "componentId": "maple-analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "真实结果与 HM 数学练习",
          "desc": "切换数据集与指标，观察同一 0–100 刻度下的真实结果。数学练习另有明确标签，不与论文分数混用。",
          "componentId": "maple-results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "让主张找到对应证据",
          "desc": "选择一个主张，查看支持它的表格及限制。结论随证据变化，而不是一律给出“全面领先”。",
          "componentId": "maple-evidence"
        }
      ],
      "insight": "MaPLe 的贡献是改善适配与泛化的整体平衡。它没有证明所有数据集都更好，也没有直接证明同样收益会出现在三维点云或分割任务上。",
      "formula": {
        "lead": "当 Base 与 New 很不均衡时，调和平均会受到较低一端的限制。",
        "unicode": "HM = 2 × B × N / (B + N)",
        "symbols": [
          {
            "sym": "B",
            "desc": "已见类别 Base 的准确率。"
          },
          {
            "sym": "N",
            "desc": "新类别 New 的准确率，原文称 Novel。"
          },
          {
            "sym": "HM",
            "desc": "两项准确率的调和平均；汇总表对平均 Base 与平均 New 计算。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📊",
          "title": "同时读 Base、New 与 HM",
          "desc": "平均 HM 最高，不代表每个数据集的每项指标都最高。"
        },
        {
          "icon": "🔬",
          "title": "消融支持设计价值",
          "desc": "不同基线的深度和长度有差异，不能把分差当成严格单因素因果贡献。"
        },
        {
          "icon": "🧭",
          "title": "让结论留在证据范围内",
          "desc": "主要证据来自 ViT-B/16 的 16-shot 二维图像分类与指定迁移协议。"
        }
      ]
    }
  ]
};
