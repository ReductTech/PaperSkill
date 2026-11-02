import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Camouflaged Object Detection with Feature Decomposition and Edge Reconstruction",
    "titleZh": "FEDER：在相似纹理中找出目标边界",
    "venue": "CVPR 2023",
    "authors": "Chunming He、Kai Li、Yachao Zhang、Longxiang Tang、Yulun Zhang、Zhenhua Guo、Xiu Li",
    "affiliation": "清华大学深圳国际研究生院、NEC Laboratories America、ETH Zürich、Tianyi Traffic Technology",
    "domain": "计算机视觉 · 伪装目标检测",
    "coreProblem": "如果目标的纹理与背景几乎一样、轮廓又断断续续，模型凭什么找出完整的前景？",
    "coreInsight": "FEDER 先对编码特征做可学习的频率分解，寻找局部纹理与整体分布的差异，再用边缘重建辅助分割，把可能漏掉的轮廓纳入预测。<br/><a class='feder-ref' href='https://openaccess.thecvf.com/content/CVPR2023/html/He_Camouflaged_Object_Detection_With_Feature_Decomposition_and_Edge_Reconstruction_CVPR_2023_paper.html' target='_blank' rel='noopener noreferrer'>对照阅读：CVPR 2023 原论文 ↗</a>",
    "keywords": [
      "伪装目标检测",
      "可学习小波",
      "频带注意力",
      "边缘辅助分割",
      "Runge–Kutta"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "粗拓只留下醒目的笔画。细纹一旦混进石面，拓本上就会出现缺口。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "挑出细纹，再校看轮廓。FEDER 用频带分解找线索，用边缘重建帮助确定前景。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "浅刻难寻，断边难描",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "伪装目标分割要解决两个不同的问题：物体藏在哪里？它的边界经过哪些像素？",
      "analogy": {
        "title": "擦看浅刻",
        "text": "石材和浅刻共享底色，第一眼难以找到字迹；即便找到了，风化的刻线也可能在转折处中断。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "比较两种失败",
          "desc": "切换困难类型，对照左边的拓片和右边的轮廓示意。几何图不是论文预测图。<br/><small>原论文图 1｜原图、标注、SegMaR 与 FEDER 的定性对照。图片来自 He 等，CVPR 2023；下方可操作图形为教学演示。</small>",
          "componentId": "feder-ch1-is-ed",
          "figure": "./images/feder-fig1.png"
        }
      ],
      "insight": "能圈出目标的大致位置，不等于能分清边界上的每一个像素。",
      "takeaways": [
        {
          "icon": "🪨",
          "title": "内在相似（IS）",
          "desc": "前景与背景颜色、纹理相近，会妨碍粗定位。"
        },
        {
          "icon": "🖋️",
          "title": "边缘破坏（ED）",
          "desc": "即使知道目标在哪儿，模糊或中断的轮廓仍会影响精细分割。"
        },
        {
          "icon": "📖",
          "title": "原文依据",
          "desc": "图1比较定位和边缘两种困难；示意图解释概念，不代表样本发生比例。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一张图如何得到区域与边缘",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "针对定位和边界两种困难，FEDER 先提取多层特征，再分解并筛选频率线索，最后同时估计区域和边缘。",
      "analogy": {
        "title": "传递拓纸",
        "text": "观察者传递的是同一张拓片：先记下整体形状，再辨别细纹，最后把轮廓与区域对应起来。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "沿图2查看信息流",
          "desc": "选择流程节点，观察拓片上的标记与该阶段的输入、输出怎样对应。节点表示处理阶段，不代表三次独立预测。<br/><small>原论文图 2｜编码、频带分解与边缘辅助解码的全貌。图片来自 He 等，CVPR 2023；下方可操作图形为教学演示。</small>",
          "componentId": "feder-ch2-path",
          "figure": "./images/feder-fig2.png"
        }
      ],
      "insight": "DWD 筛选有区分度的特征；SED 把边缘任务作为辅助监督，服务于最终的区域分割。",
      "takeaways": [
        {
          "icon": "🗂️",
          "title": "CFE：保留层次",
          "desc": "骨干提取多层特征；R-Net 把第1至4层分别转换为64通道表示。e-ASPP 从最深特征生成粗分割。"
        },
        {
          "icon": "🔀",
          "title": "DWD：有选择地融合",
          "desc": "式9只在第1、4层显式拼接聚合后的频带特征；第2、3层直接沿用压缩表示。"
        },
        {
          "icon": "🖊️",
          "title": "SED：两类输出",
          "desc": "四层解码器结合分割分支 RRS 与边缘分支 OER；边缘是辅助任务，不是最终分割的替代。"
        }
      ],
      "formula": {
        "lead": "式（9）列出了四个解码层的输入。方括号表示沿通道拼接。比较第 1、4 层和第 2、3 层，看看哪些层接收了额外的频带线索。",
        "unicode": "f₁ᵒ = Conv₁([f₁ʳ, ↑f₁ʰ]);  f₂ᵒ = f₂ʳ;  f₃ᵒ = f₃ʳ;  f₄ᵒ = Conv₁([f₄ʳ, f₃ˡ])",
        "symbols": [
          {
            "sym": "f₁ʳ",
            "desc": "第 1 层由 R-Net 压缩得到的 64 通道特征。"
          },
          {
            "sym": "f₂ʳ",
            "desc": "第 2 层由 R-Net 压缩得到的 64 通道特征。"
          },
          {
            "sym": "f₃ʳ",
            "desc": "第 3 层由 R-Net 压缩得到的 64 通道特征。"
          },
          {
            "sym": "f₄ʳ",
            "desc": "第 4 层由 R-Net 压缩得到的 64 通道特征。"
          },
          {
            "sym": "f₁ᵒ",
            "desc": "送往第 1 个解码层的集成特征。"
          },
          {
            "sym": "f₂ᵒ",
            "desc": "送往第 2 个解码层的集成特征。"
          },
          {
            "sym": "f₃ᵒ",
            "desc": "送往第 3 个解码层的集成特征。"
          },
          {
            "sym": "f₄ᵒ",
            "desc": "送往第 4 个解码层的集成特征。"
          },
          {
            "sym": "f₁ʰ",
            "desc": "第 1 层聚合得到的高频特征，上采样后补充浅层细节。"
          },
          {
            "sym": "f₃ˡ",
            "desc": "第 3 层的低频聚合结果，与第 4 层编码特征拼接。"
          },
          {
            "sym": "↑",
            "desc": "上采样，使两路特征的空间尺寸对齐。"
          },
          {
            "sym": "Conv₁",
            "desc": "1×1 卷积，在通道维度整合拼接结果。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把同一份特征拆成不同频带",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "不只看整体明暗：同一小块纹理里还藏着水平、垂直与对角方向的变化。FEDER 在编码特征上学习怎样提取这些线索。",
      "analogy": {
        "title": "折看横竖斜纹",
        "text": "把拓纸折出小窗口：大片底色变化缓慢，交错刻痕变化迅速。折纸只是观察比喻，不是算法中的实际操作。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "换一块纹理，读四个系数",
          "desc": "选择一个 2×2 拓纹样本，比较正交 Haar 示范中的四个系数；数值可以手算。",
          "componentId": "feder-ch3-haar"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "让频带走进不同的注意力分支",
          "desc": "选中高频或低频，观察与拓片对应的区域线索和处理路径。着色为教学示意，不是实测注意力。",
          "componentId": "feder-ch3-attention"
        }
      ],
      "insight": "Haar 提供初始化，学习发生在特征上；一个系数响应强，不能说明那个位置一定是前景。",
      "takeaways": [
        {
          "icon": "🧮",
          "title": "算例与模型有别",
          "desc": "固定 Haar 算例说明 LL 与三种细节响应。论文式1在编码特征上应用可学习的高、低频滤波器。"
        },
        {
          "icon": "🪚",
          "title": "高频也可能是背景",
          "desc": "纹理、边缘会产生高频，但背景刻纹同样会响应，因此需要选择与聚合。"
        },
        {
          "icon": "🌗",
          "title": "低频保留整体",
          "desc": "缓变的颜色和照明属于低频线索；低频分支用归一化和注意力减少冗余。"
        }
      ],
      "formula": {
        "lead": "论文式1先分离高、低频，再用式2和式3生成各自的注意力图。四子带的 Haar 算例是初始化直觉，并非训练后的精确系数。",
        "unicode": "rHF = WHF(fₖʳ)，rLF = WLF(fₖʳ)；pₖʰ = JA(ResB(rHF))；pₖˡ = JA(PN(ResIN(rLF)))",
        "symbols": [
          {
            "sym": "WHF",
            "desc": "由 Haar 初始化的可学习高频滤波器。"
          },
          {
            "sym": "WLF",
            "desc": "由 Haar 初始化的可学习低频滤波器。"
          },
          {
            "sym": "fₖʳ",
            "desc": "第 k 层编码特征，小波分解作用于这些特征。"
          },
          {
            "sym": "rHF",
            "desc": "高频响应，本页对式（1）高频特征的简写。"
          },
          {
            "sym": "rLF",
            "desc": "低频响应，本页对式（1）低频特征的简写。"
          },
          {
            "sym": "ResB",
            "desc": "含批归一化的残差块，处理高频特征。"
          },
          {
            "sym": "ResIN",
            "desc": "含实例归一化的残差块，处理低频特征。"
          },
          {
            "sym": "PN",
            "desc": "位置归一化。"
          },
          {
            "sym": "JA",
            "desc": "结合空间与通道的联合注意力。"
          },
          {
            "sym": "pₖʰ",
            "desc": "引导高频聚合的注意图。"
          },
          {
            "sym": "pₖˡ",
            "desc": "引导低频聚合的注意图。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "两种频带，怎样挑出值得看的纹理",
      "badge": "inf",
      "badgeLabel": "模型机制",
      "bridge": "分解只是把线索分开。现在要决定：细纹里哪些位置有辨别力，大片色调中哪些变化值得保留？",
      "analogy": {
        "title": "挑纹：细刻痕与大片墨色",
        "text": "细刻痕和整片墨色都能提供线索，拓印时关注的起伏却不同。对应到网络，高频和低频各有注意模块。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "切换频带，看同一块碑面",
          "desc": "左边显示拓片线索，右边显示相应的空间注意响应。两图均为示意，不是论文模型输出。<br/><small>原论文图 3｜GFA、HFA 和 LFA 的内部路径。图片来自 He 等，CVPR 2023；下方可操作图形为教学演示。</small>",
          "componentId": "feder-4",
          "figure": "./images/feder-fig3.png"
        }
      ],
      "insight": "两路共享“关注哪里、关注哪些通道”的思路，进入联合注意之前的特征处理却不相同。",
      "formula": {
        "lead": "对照原文 §3.2.2、图 3 与式（2）–（3）：两路都得到注意图，用于后续聚合。",
        "unicode": "pʰₖ = JA(ResB(HFₖ))；pˡₖ = JA(PN(ResIN(LFₖ)))",
        "symbols": [
          {
            "sym": "JA",
            "desc": "联合空间注意与通道注意"
          },
          {
            "sym": "ResB",
            "desc": "含卷积、批归一化和激活的残差块"
          },
          {
            "sym": "ResIN",
            "desc": "以实例归一化约束的残差块"
          },
          {
            "sym": "PN",
            "desc": "位置归一化"
          },
          {
            "sym": "HFₖ",
            "desc": "第 k 层的高频特征"
          },
          {
            "sym": "LFₖ",
            "desc": "第 k 层的低频特征"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔎",
          "title": "高频保纹",
          "desc": "HFA 保留纹理并强调有用的空间位置与通道；纹理丰富不等于一定属于前景。"
        },
        {
          "icon": "🌗",
          "title": "低频去扰",
          "desc": "LFA 兼顾实例与通道维度的归一化，帮助从整体色调与光照变化中寻找线索。"
        },
        {
          "icon": "🧭",
          "title": "注意不是掩膜",
          "desc": "这里得到的是引导后续特征聚合的注意图，还不是最终前景概率。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "GFA：把同一频带的线索接回解码器",
      "badge": "inf",
      "badgeLabel": "模型机制",
      "bridge": "有了频率注意图，怎样把粗尺度的语义带到细尺度，又不抹掉原有的细节？",
      "analogy": {
        "title": "叠纸：先对齐，再套合",
        "text": "同一字的两张拓片，细纸保留刻纹，粗纸帮助定位。GFA 用注意引导局部线性拟合，再把频带特征接回指定解码层。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "点选解码层，检查哪一张叠纸接入",
          "desc": "左边显示底版与频带叠纸，右边标出四个解码层。点击层号核对原文式（9）的输入。",
          "componentId": "feder-5"
        }
      ],
      "insight": "同频带内部的逐级聚合与频带接入解码器是两步：先回答“怎样结合”，再回答“送到哪层”。",
      "formula": {
        "lead": "原文图 3、式（4）–（8）：以高频为例，先在降采样的细层特征上按注意权重拟合粗层，再上采样局部系数作用于原细层；低频同理。",
        "unicode": "fʰₖ₋₁ = GFA(fʰₖ, HFₖ₋₁, pʰₖ)；fʰ₄ = HF₄",
        "symbols": [
          {
            "sym": "GFA",
            "desc": "注意引导的特征聚合：局部线性系数由加权拟合得到，不是简单拼接"
          },
          {
            "sym": "fʰₖ",
            "desc": "由更粗层传下来的高频聚合特征"
          },
          {
            "sym": "HFₖ₋₁",
            "desc": "相邻更细层的高频特征"
          },
          {
            "sym": "pʰₖ",
            "desc": "引导本次聚合的高频注意图"
          },
          {
            "sym": "HF₄",
            "desc": "最深层高频分量，是递推起点"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "局部拟合",
          "desc": "先在低分辨率上利用注意权重求局部线性系数，再上采样系数还原细分辨率。"
        },
        {
          "icon": "🪶",
          "title": "浅层接高频",
          "desc": "D₁ 接入上采样后的高频聚合结果；D₂、D₃ 直接接入各自编码特征。"
        },
        {
          "icon": "🗺️",
          "title": "深层接低频",
          "desc": "D₄ 将编码特征与第 3 层低频聚合结果拼接，再以 1×1 卷积整合通道。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "RRS：让漏看的位置再参与一次判断",
      "badge": "inf",
      "badgeLabel": "模型机制",
      "bridge": "前面得到四层解码输入。接下来，上一层的粗预测会决定哪些位置的特征在当前层被保留。",
      "analogy": {
        "title": "补拓：留下漏墨处",
        "text": "拓片中已有浓墨的地方不必反复补，浅处值得再看。但空白也可能原本就没有字；一次补拓不能替代判断。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "调节粗预测，追踪一个位置的特征",
          "desc": "把某个位置的解码器输入 fᵒₖ 的一个通道值设为 0.8，拖动粗预测前景概率。左侧朱砂显示补拓力度，右侧三柱显示同一位置的门控运算。",
          "componentId": "feder-6"
        }
      ],
      "insight": "对粗预测取反，得到的是“少被前景响应覆盖”的位置；模型还要结合边缘特征，才能判断是否属于目标。",
      "formula": {
        "lead": "原文 §3.3.1、图 4、式（10）：将粗分割图重复到 64 个通道，经 sigmoid 后逐元素取反，再与特征相乘。",
        "unicode": "r = 1 − sigmoid(repeat(dˢₖ₊₁))；dˢₖ = conv₃(concat(dᶠᵉₖ, fᵒₖ ⊙ r))",
        "symbols": [
          {
            "sym": "repeat",
            "desc": "沿通道重复粗分割图以匹配特征"
          },
          {
            "sym": "dˢₖ₊₁",
            "desc": "更粗层输出的分割 logits"
          },
          {
            "sym": "r",
            "desc": "逐位置的反向门控，值为 1−p"
          },
          {
            "sym": "dᶠᵉₖ",
            "desc": "本层的边缘特征"
          },
          {
            "sym": "fᵒₖ",
            "desc": "由编码端送来的集成特征"
          },
          {
            "sym": "⊙",
            "desc": "逐元素乘法"
          },
          {
            "sym": "conv₃",
            "desc": "通过卷积处理拼接后的特征，得到本层分割结果"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↩️",
          "title": "反向不是翻转标签",
          "desc": "粗前景概率越高，其反向权重越低；这不是把背景直接当成目标。"
        },
        {
          "icon": "🔗",
          "title": "边缘参与分割",
          "desc": "门控后的集成特征与边缘特征拼接，再经卷积得到本层分割结果。"
        },
        {
          "icon": "🧪",
          "title": "数值示例有边界",
          "desc": "0.8 是演示用的单位置特征。真实模型对多通道特征运算，门控值不是最终预测。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "两次试算，重建边缘",
      "badge": "inf",
      "badgeLabel": "推理机制",
      "bridge": "在图 4 中，本层解码输入与沿通道重复的上一级粗分割预测先拼接，再经 1×1 卷积形成 OER 的输入 eₜ。OER 更新这份特征，经 3×3 卷积得到边缘预测，同时把更新后的边缘特征送给 RRS。",
      "analogy": {
        "title": "试笔再落墨",
        "text": "第一笔探方向，第二笔在试笔的位置修正；最后合用两笔，不必把其中一笔当作答案。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "分步追踪两次特征更新",
          "desc": "点击步骤，跟随一个简化的二维例子。箭头表示特征增量，不是预测边缘。<br/><small>原论文图 4｜RRS 分割支路和 OER 边缘支路。图片来自 He 等，CVPR 2023；下方可操作图形为教学演示。</small>",
          "componentId": "feder-7",
          "figure": "./images/feder-fig4.png"
        }
      ],
      "insight": "RK2 的两次变换共享 θ，但输入不同；门控负责混合，通道耦合负责构造可逆的更新顺序。",
      "takeaways": [
        {
          "icon": "✍️",
          "title": "第二次从哪里出发？",
          "desc": "从 eₜ+F₁ 计算 F₂，而非对同一输入做两次完全相同的卷积。"
        },
        {
          "icon": "🎚️",
          "title": "两次增量怎样合成？",
          "desc": "可学习门控 g 给 F₁ 和 F₂ 分配互补权重；案例取标量只是为了算得清楚。"
        },
        {
          "icon": "🔄",
          "title": "何处可以反推？",
          "desc": "按通道分成两组，先加后减；逆向先还原第二组，再还原第一组，不需要逆卷积。"
        }
      ],
      "formula": {
        "lead": "图4与式（11–12）：先用两次共享参数的变换形成更新，再让两组通道先后影响对方。",
        "unicode": "F₁ = F(eₜ, θ)，F₂ = F(eₜ + F₁, θ)；eₜ₊₁ = eₜ + gF₁ + (1−g)F₂；a′ = a + RK2₁(b)，b′ = b − RK2₂(a′)",
        "symbols": [
          {
            "sym": "θ",
            "desc": "两次求值共享的卷积变换参数。"
          },
          {
            "sym": "g",
            "desc": "拼接两次增量，经过可学习变换与 sigmoid 得到的门值。"
          },
          {
            "sym": "a′",
            "desc": "第一组更新后的特征，由 a 加上第二组提供的增量得到。"
          },
          {
            "sym": "b′",
            "desc": "第二组更新后的特征，由 b 减去更新后第一组给出的增量得到。"
          },
          {
            "sym": "a",
            "desc": "按通道拆分后得到的第一组输入。"
          },
          {
            "sym": "b",
            "desc": "按通道拆分后得到的第二组输入。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "用区域和边缘两份真值训练",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "得到分割与边缘预测后，下一步是看每个层级接受哪种监督，以及它在总损失中占多大权重。",
      "analogy": {
        "title": "双样校印",
        "text": "一张样纸核对墨面，另一张核对轮廓。训练时，区域预测与掩膜真值比较，边缘预测与边缘真值比较。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "核对层级、监督对象与损失",
          "desc": "切换区域或边缘分支，再选预测层级。左图是该层预测，右图是上采样到标注尺寸的同一预测，用来和相应真值计算损失。图框大小示意分辨率层级。",
          "componentId": "feder-8"
        }
      ],
      "insight": "训练时用两种真值；预测时输入图像即可。边缘辅助分支改善特征，不需要用户提供边缘真值。",
      "takeaways": [
        {
          "icon": "🖼️",
          "title": "五张区域图",
          "desc": "每级区域预测上采样到掩膜真值大小，计算加权 BCE 和加权 IoU。"
        },
        {
          "icon": "🪶",
          "title": "四张边缘图",
          "desc": "边缘正像素稀少，使用 Dice 损失；第五级没有独立边缘损失项。"
        },
        {
          "icon": "⚙️",
          "title": "复现配置",
          "desc": "作者用 PyTorch 和两张 RTX 3090 Ti 训练。默认骨干为 ImageNet 预训练的 ResNet-50，输入 384×384，批量 36。Adam 参数为 (0.9, 0.999)，初始学习率 0.0001，每 80 轮除以 10。"
        }
      ],
      "formula": {
        "lead": "式（14）：各尺度先对齐真值，再按层加权。这里将两种分割损失合写为 Lₛ。",
        "unicode": "L = ∑ₖ₌₁⁵ 2¹⁻ᵏ Lₛ(k) + ∑ₖ₌₁⁴ 2¹⁻ᵏ Lₑ(k)",
        "symbols": [
          {
            "sym": "k",
            "desc": "输出层级索引；从1开始，权重依次为1、1/2、1/4……。"
          },
          {
            "sym": "Lₛ",
            "desc": "区域分支的加权 BCE 与加权 IoU 之和，对照分割掩膜。"
          },
          {
            "sym": "Lₑ",
            "desc": "边缘分支的 Dice 损失，对照边缘真值。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "公平比较：四个基准下的 ZoomNet 与 FEDER",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "前面解释了模型如何工作。现在把评价条件固定，查看实际收益是否随数据集和指标改变。",
      "analogy": {
        "title": "对照拓本",
        "text": "比两份拓本，先看纸张、尺寸和刻面是否一致；读表也应先看骨干、输入配置和指标定义。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "对照同条件下的四项指标",
          "desc": "选择测试集和指标。条形均从零起算，原始数值来自 FEDER 表1的多输入尺度分组。 表 1 将单尺度单阶段、多输入尺度（MIS）、多阶段（MS）分别列出。作者用同一套评估代码计算预测图的指标。",
          "componentId": "feder-9"
        }
      ],
      "insight": "COD10K 的结构指标是反例：FEDER-MIS 的 Sα 为0.837，略低于 ZoomNet 的0.838；同表其他指标改善不能抹掉这处差异。",
      "takeaways": [
        {
          "icon": "🧭",
          "title": "比较条件",
          "desc": "这里仅对照表1多输入尺度（MIS）分组：ZoomNet 与 FEDER-MIS 均用 ResNet50，不混入 Res2Net50 或四阶段结果。"
        },
        {
          "icon": "📐",
          "title": "指标不能串表",
          "desc": "M 为平均绝对误差，越低越好；自适应 Fβ、平均 Eφ、结构 Sα 越高越好。不要与 ZoomNet 原论文的加权 F 指标混用。"
        },
        {
          "icon": "🗂️",
          "title": "划分有别",
          "desc": "训练集为 COD10K 3040 张加 CAMO 1000 张；四个测试集均独立于训练。本页是论文报告，不是本机实测。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "撤去一道工序：主效应与 RK4 的取舍",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "对照主表后，再问每个组件起了什么作用。一次只换一种设置，把差异定位到实验条件内。",
      "analogy": {
        "title": "撤去一道工序",
        "text": "暂时撤去描边或选纹这道工序，再与完整拓本比较；比较的是少掉该工序后的整体变化。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "把一种消融与完整模型并排",
          "desc": "选择变体与基准，阅读表2同一数据划分下的精确数值；差值图显示自适应 Fβ 相对完整模型的变化。<br/><small>原论文图 7｜移除 DWD 或 OER 后的预测差异。图片来自 He 等，CVPR 2023；下方可操作图形为教学演示。</small>",
          "componentId": "feder-10",
          "figure": "./images/feder-fig7.png"
        }
      ],
      "insight": "RK4 在 COD10K 的 Fβ 略高，在 NC4K 却略低。作者选择 RK2 平衡性能与效率；表2未给运行时或 FLOPs，不能推算实测节省。",
      "takeaways": [
        {
          "icon": "🌊",
          "title": "DWD 的证据",
          "desc": "移除 DWD 后 COD10K 的 Fβ 从0.740降至0.697；这反映整套组件的消融，不代表每个频带都同样有用。"
        },
        {
          "icon": "✒️",
          "title": "OER 的证据",
          "desc": "移除 OER 后 COD10K 的 Fβ 降至0.714；换成普通残差块是另一行实验，不能当成完全移除。"
        },
        {
          "icon": "⚖️",
          "title": "成本边界",
          "desc": "RK4 需要更多阶段求值是算法层面的代价；论文表2没有设备时延、实际加速比或训练成本数据。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1bV41177ap",
      "title": "残差网络（ResNet）｜动手学深度学习",
      "reason": "FEDER 的编码器可用 ResNet-50。这段课程解释残差连接，适合在阅读编码器或 OER 之前补基础。"
    }
  ]
};
