import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Deep Residual Learning for Image Recognition",
    titleZh: "深度残差学习用于图像识别（ResNet）",
    venue: "arXiv 2015 · ILSVRC & COCO 2015 第一名 · ICCV 2016 Best Paper",
    authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
    affiliation: "Microsoft Research",
    domain: "计算机视觉 / 图像分类 / 深度学习架构",
    coreProblem: "网络加深后出现退化：普通（plain）深层网络的训练误差不降反升",
    coreInsight: "残差重表述：让堆叠层学残差 F(x)=H(x)−x，恒等捷径使超深网络可训练并获得精度红利",
    keywords: [
      "残差学习",
      "恒等捷径",
      "退化问题",
      "ImageNet",
      "Bottleneck"
    ]
  },
  hero: {
    oldMethod: {
      desc: "层层重写：每一层都要无中生有地拟合整个映射，越深越乱",
      componentId: "hero-old"
    },
    newMethod: {
      desc: "原稿 + 小修：保留输入 x，只学残差修正，越深越准",
      componentId: "hero-new"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "越抄越糊：更深的网络为什么反而更差？",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "上一页我们看到深度几乎是视觉识别的「万能钥匙」；可一旦真的把网络加到几十层，一个反直觉的现象出现了：模型反而变差了。这一章我们先直面这个<b>退化问题</b>。",
      analogy: {
        title: "反复抄写，越抄越走样",
        text: "把一段话反复抄写几十遍，字形会一点点走样——更深的网络也一样：20 层的普通网络训练得比 56 层更好，这就是<b>退化</b>的样子。",
        componentId: "ch1-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "传抄走样实验",
          desc: "拖动「抄写次数」，观察文字清晰度与训练误差如何同步恶化——这就是论文 Fig.1 里 20 层与 56 层普通网络的故事。",
          componentId: "ch1mod1"
        },
        {
          kind: "module",
          id: "1.2",
          title: "本可不变差",
          desc: "如果新增的层原样把内容传下去（<b>恒等映射</b>），误差本可以保持不变——那真实网络为什么做不到？",
          componentId: "ch1mod2"
        }
      ],
      insight: "深层网络不是「记不住」，而是优化器很难让一层层非线性层学会「什么都不做」。",
      takeaways: [
        {
          icon: "🎯",
          title: "退化现象",
          desc: "更深未必更好：56 层的训练误差反而高于 20 层（论文 Fig.1）"
        },
        {
          icon: "🔧",
          title: "与过拟合无关",
          desc: "连训练误差本身都升高了，说明是优化困难而非容量不足"
        },
        {
          icon: "✨",
          title: "理论下限",
          desc: "恒等构造解证明：深层本可以不差于浅层"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "一段文字如何被读进来",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "要弄明白为什么深网络会「退步」，先得看清信息在网络里是怎么被读取和传递的。这一章讲卷积网络处理一张图的基本方式。",
      analogy: {
        title: "逐段通读，提取要点",
        text: "阅读一段文字时，目光一次聚焦一小块，再串起整段意思——<b>卷积层</b>也是这样：局部读取，层层堆叠后看懂全图。",
        componentId: "ch2-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "局部阅读器",
          desc: "拖动阅读窗口在稿纸上移动，观察它「看到」的内容，以及特征图如何逐级缩小（224→7）、通道逐级翻倍（64→512）。",
          componentId: "ch2mod1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "卷积 = 局部读取器",
          desc: "一次只看一个小窗口（感受野），层层堆叠覆盖全图"
        },
        {
          icon: "🔧",
          title: "VGG 式设计规则",
          desc: "输出尺寸减半时，滤波器数量翻倍，保持每层算力相当"
        },
        {
          icon: "✨",
          title: "层级浓缩",
          desc: "224×224×3 的图片最终浓缩为 7×7×512 的语义特征"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "保留原文，只改差异",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "现在回到退化问题。第 1 章说深网络难优化，这一章给出论文的第一个关键想法：与其让每一层「无中生有」，不如让它「只改一点点」。",
      analogy: {
        title: "重写整段 vs 原句加批注",
        text: "改一句话，整段重写容易，还是保留原句、旁边写个小修正容易？ResNet 选了后者：把「重写」变成「保留 + 修正」。",
        componentId: "ch3-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "两种改法，同步对照",
          desc: "按「开始对照」，左右两栏用同一处语病展示两种改法：整段重写（越改越乱）vs 原句批注修正（越改越准）。",
          componentId: "ch3mod1"
        },
        {
          kind: "module",
          id: "3.2",
          title: "修正量从哪里来",
          desc: "逐步叠加批注修正量，观察「原文 + 修正」如何逼近正确版本——这就是残差块的学习过程：最优解接近恒等时，残差应当趋近于 0。",
          componentId: "ch3mod2"
        }
      ],
      insight: "只要把目标改成「学残差」，网络就多了一条「原样通过」的后路——实在改不动时，把修正推向 0 即可。",
      formula: {
        lead: "我们不再让堆叠层直接拟合期望的映射 H(x)，而是先学它与输入 x 的差——这就是残差重表述。",
        unicode: "F(x) := H(x) − x",
        symbols: [
          {
            sym: "F",
            desc: "残差函数：要学习的「修正量」"
          },
          {
            sym: "H",
            desc: "期望的底层映射：想得到的输出"
          },
          {
            sym: "x",
            desc: "层输入（也就是前一层输出）"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "残差重表述",
          desc: "学 F(x)=H(x)−x，而不是直接学 H(x)"
        },
        {
          icon: "🔧",
          title: "恒等是免费保险",
          desc: "最优解接近恒等时，把残差推向 0 即可"
        },
        {
          icon: "✨",
          title: "优化难度骤降",
          desc: "从「无中生有」变成「微调增量」"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "一个加号，两个世界",
      badge: "both",
      badgeLabel: "核心",
      bridge: "残差不是口号，是一个极简的式子。这一章把「保留原文 + 修正」变成数学，并看清为什么这个加号不花一分钱。",
      analogy: {
        title: "原句与批注相加",
        text: "修订稿 = 原句 + 批注修正。网络里也一样：输出 <b>y</b> = 残差 <b>F(x)</b> + 原输入 <b>x</b>。",
        componentId: "ch4-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "批注相加器",
          desc: "调整「修正量」，看原文与修正的合并效果，以及公式 <b>y = F(x, {Wᵢ}) + x</b> 的数值如何同步变化。",
          componentId: "ch4mod1"
        }
      ],
      formula: {
        lead: "残差块通过恒等捷径做逐元素相加：输出 = 残差映射 + 原输入（论文 Eq.1）。",
        unicode: "y = F(x, {Wᵢ}) + x",
        symbols: [
          {
            sym: "x",
            desc: "输入向量（也是前一层输出）"
          },
          {
            sym: "y",
            desc: "输出向量"
          },
          {
            sym: "F",
            desc: "残差映射：两层时 F = W₂·σ(W₁·x)"
          },
          {
            sym: "Wᵢ",
            desc: "残差块内第 i 层权重"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "核心公式",
          desc: "y = F(x, {Wᵢ}) + x：输出 = 残差 + 输入"
        },
        {
          icon: "🔧",
          title: "零成本捷径",
          desc: "恒等捷径不增加参数与计算，plain 与 residual 才能公平对比"
        },
        {
          icon: "✨",
          title: "维度对齐",
          desc: "维度不匹配时用投影 Wₛ·x 对齐（论文 Eq.2）"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "捷径的三种打开方式",
      badge: "both",
      badgeLabel: "核心",
      bridge: "捷径只有一条加号，但碰上「维度不匹配」时怎么接？论文试了三种接法，结论出人意料地简单。",
      analogy: {
        title: "三种批注记号",
        text: "补空白、划线对齐、整句重写——三种记号都能改稿，但成本不同。捷径的 A / B / C 三种选项也是这样。",
        componentId: "ch5-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "三种捷径对比",
          desc: "用芯片切换 A（补零恒等）、B（升维处投影）、C（全投影），观察架构图中捷径的画法与验证误差（论文 Table 3，越低越好）。",
          componentId: "ch5mod1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "都优于 plain",
          desc: "A / B / C 的 top-1 误差 25.03 / 24.52 / 24.19，远好于 plain-34 的 28.54"
        },
        {
          icon: "🔧",
          title: "差距很小",
          desc: "B 略好于 A、C 略好于 B，但差异不足 1 个百分点"
        },
        {
          icon: "✨",
          title: "恒等最关键",
          desc: "投影对解决退化并非必需，只在维度不匹配时使用"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "从草稿到誊清稿",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "结构和公式都清楚了，现在把一张 224×224 的图片从输入走到 1000 类的输出，看看信息每一步长什么样。",
      analogy: {
        title: "按修订稿逐段誊清",
        text: "誊清时一笔一画照着走，每段都落在固定版式里——<b>前向传播</b>也一样：每一步按既定结构把张量送进下一层。",
        componentId: "ch6-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "一路向前",
          desc: "点击「下一层」，沿架构图步进，观察每个阶段张量的尺寸与通道数，直到 1000 类输出。",
          componentId: "ch6mod1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "标准结构",
          desc: "全卷积主干 + 全局平均池化 + 1000 类 softmax"
        },
        {
          icon: "🔧",
          title: "尺寸规律",
          desc: "分辨率逐级减半（224→7）、通道逐级加倍（64→512）"
        },
        {
          icon: "✨",
          title: "推理一次前向",
          desc: "分类不再需要额外的「搜索」过程"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "把稿子改到稳定为止",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "网络结构再精巧，也要靠训练把它「改」出来。这一章看训练的关键旋钮——<b>学习率</b>——怎么决定一稿能不能改好。",
      analogy: {
        title: "改动力度要拿捏",
        text: "改稿时下笔太重划破纸面、太轻改不动——<b>学习率</b>就是训练里的「下笔力度」。",
        componentId: "ch7-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "学习率旋钮",
          desc: "调节学习率（对数档），观察「动笔幅度」与损失曲线的收敛形态；并查看论文的标准训练配置。",
          componentId: "ch7mod1"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "标准调度",
          desc: "学习率 0.1 起步，误差平台期除以 10（论文 §3.4）"
        },
        {
          icon: "🔧",
          title: "配置清单",
          desc: "BN（卷积后激活前）、SGD batch 256、权重衰减 1e-4、动量 0.9、无 dropout"
        },
        {
          icon: "✨",
          title: "超深层热身",
          desc: "110 层等超深网络先用 0.01 热身，再切回 0.1"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "152 层怎么装进有限算力",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "深度是红利，但 152 层的计算量怎么办？这一章拆开 ResNet 的「省力机关」——<b>bottleneck</b>——并亲手点一点整张架构图。",
      analogy: {
        title: "把厚稿装订成册",
        text: "页数再多，只要每页都按统一版式排布，就能装订成一本整齐的书——<b>bottleneck</b> 就是让 152 层「排得下、算得起」的版式。",
        componentId: "ch8-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "交互式架构图",
          desc: "点击架构图上的阶段与捷径，查看张量尺寸、块数与算力；用芯片切换 plain-34 / ResNet-34 / ResNet-50 / ResNet-101 / ResNet-152 观察差异。",
          componentId: "ch8mod1"
        },
        {
          kind: "module",
          id: "8.2",
          title: "bottleneck 省力术",
          desc: "步进拆解 1×1→3×3→1×1 瓶颈块内部，观察参数量如何被「压缩」再「还原」。",
          componentId: "ch8mod2"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "Bottleneck",
          desc: "1×1 降维 + 3×3 瓶颈 + 1×1 升维，重活在低维空间做"
        },
        {
          icon: "🔧",
          title: "算力可控",
          desc: "152 层仅 11.3 BFLOPs，低于 VGG-16/19（15.3/19.6）"
        },
        {
          icon: "✨",
          title: "恒等防翻倍",
          desc: "bottleneck 中若用投影捷径，时间复杂度和模型大小会翻倍"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "复核一遍，再交付",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "深网络能训练了，接下来是「能不能用好」：<b>批归一化</b>做了什么、深到 1202 层会发生什么。这一章像交付前的复核。",
      analogy: {
        title: "交付前的逐项复核",
        text: "交稿前要逐项打勾：字号、页码、装订。<b>批归一化</b>、不用 dropout、以及「多深算够」，都是训练中的复核项。",
        componentId: "ch9-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "BN 开关",
          desc: "切换批归一化的开/关，观察训练稳定性与收敛速度的差异。",
          componentId: "ch9mod1"
        },
        {
          kind: "module",
          id: "9.2",
          title: "多深算够",
          desc: "从 20 层一路看到 1202 层，对比训练误差与测试误差，找到过拟合的拐点（论文 Table 6）。",
          componentId: "ch9mod2"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "BN 稳定训练",
          desc: "批归一化放在卷积后、激活前，替代 dropout"
        },
        {
          icon: "🔧",
          title: "深度即正则",
          desc: "1202 层（19.4M 参数）在 CIFAR-10 上过拟合，测试误差 7.93%"
        },
        {
          icon: "✨",
          title: "甜点深度",
          desc: "110 层是 CIFAR-10 最优：6.43%（5 次运行 6.61±0.16）"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "终稿对比：一页定胜负",
      badge: "both",
      badgeLabel: "核心",
      bridge: "最后把 ResNet 放回战场：ImageNet 上它拿下了什么成绩，又留下哪些边界与遗憾。这一章看数据说话。",
      analogy: {
        title: "两卷稿件同台评比",
        text: "两份终稿摆在评审桌上，用同一把尺子量——模型也一样，同一指标、同一数据集，谁更准一目了然。",
        componentId: "ch10-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "误差冲刺",
          desc: "点击「开始评比」，五个模型在同一把尺上比拼 top-5 误差（ImageNet 测试集，越低越好），胜者到达终点。",
          componentId: "ch10mod1"
        },
        {
          kind: "module",
          id: "10.2",
          title: "深度红利的边界",
          desc: "用芯片切换三组证据：ImageNet 单模型系列、COCO 迁移检测、CIFAR-10 深度曲线，并查看论文承认的局限。",
          componentId: "ch10mod2"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "冠军成绩",
          desc: "集成 top-5 误差 3.57%，ILSVRC 2015 分类第一名"
        },
        {
          icon: "🔧",
          title: "单模型也领先",
          desc: "ResNet-152 单模型 4.49%，超过此前所有集成结果"
        },
        {
          icon: "✨",
          title: "迁移通用",
          desc: "换 ResNet-101 骨干，COCO 检测 mAP@[.5,.95] +6.0（28% 相对提升），纯靠特征"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1bV41177ap",
      title: "29 残差网络 ResNet【动手学深度学习v2】",
      reason: "李沐官方课程：从原理到代码的系统讲解",
      cover: "https://i2.hdslb.com/bfs/archive/300fb344d7e0f1fb18e169c9ed3ecb7af8841143.jpg",
      views: "41.5万播放"
    },
    {
      bvid: "BV1T7411T7wa",
      title: "6.1 ResNet网络结构，BN以及迁移学习详解",
      reason: "霹雳吧啦Wz：网络结构与 BN 讲解清晰",
      cover: "https://i0.hdslb.com/bfs/archive/1d2d1580a8992fe2c17710cf9b7b79717709cb66.jpg",
      views: "29.7万播放"
    },
    {
      bvid: "BV14E411H7Uw",
      title: "6.2 使用pytorch搭建ResNet并基于迁移学习训练",
      reason: "霹雳吧啦Wz：PyTorch 实现与迁移学习",
      cover: "https://i0.hdslb.com/bfs/archive/36ae6431a7031d57c6dd5bc101f2eba4de98a759.jpg",
      views: "27.8万播放"
    }
  ]
};
