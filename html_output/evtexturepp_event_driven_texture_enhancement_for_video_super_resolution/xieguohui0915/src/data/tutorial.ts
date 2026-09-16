import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "EvTexture++: Event-Driven Texture Enhancement for Video Super-Resolution",
    "titleZh": "EvTexture++：事件驱动的视频超分纹理增强",
    "venue": "IEEE TPAMI 2026, Vol. 48, No. 6",
    "authors": "Dachun Kai, Jiayao Lu, Yueyi Zhang, Xiaoyan Sun",
    "affiliation": "中国科学技术大学 (USTC) · 美的集团",
    "domain": "计算机视觉 · 视频超分 · 事件相机",
    "coreProblem": "视频超分里纹理始终恢复不好：纯 RGB 方法缺帧间运动信息，以往的事件方法又只把事件用来改对齐。",
    "coreInsight": "把事件从「运动线索」改当「纹理线索」：用 ITE 模块逐片迭代注入高频细节，用 TTA 模块保证时序一致，并且做成即插即用。",
    "keywords": [
      "视频超分",
      "事件相机",
      "纹理恢复",
      "时序一致性",
      "插件式模块"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只用 RGB 的传统做法：帧率有限，帧与帧之间是一段「盲时」。运动越大，可用的运动信息越少，纹理区域最终被抹平成一片灰。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "EvTexture++ 的做法：事件在盲时里连续不断地记录运动，纹理被一点点补回来。事件不再只是用来改对齐，而是被用来直接补纹理。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "多帧的纹理为什么糊",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "全站地基。先弄清一件最基本的事：视频里的纹理为什么会糊——以及为什么单帧救不回来。这一章必须看透，后面全部建立在它之上。",
      "analogy": {
        "title": "条纹去哪了",
        "text": "网屏的格距比条纹还宽时，条纹就被抹平成一片灰。这不是\"看不清\"，是<b>信息真的没被记下来</b>。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "像素格吃掉了布纹",
          "desc": "「🟢 每个数都是真算出来的」拖动格子大小，看一块布纹在传感器的格子里剩下什么。",
          "componentId": "m-1-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "错开半格就能补回来",
          "desc": "「🟢 每个数都是真算出来的」把第二帧的格子错开一点点，看两帧拼起来的细网格能补回多少。",
          "componentId": "m-1-2"
        }
      ],
      "insight": "糊掉的高频不是\"变模糊\"，是<b>根本没被记下来</b>——但相邻帧之间存在亚像素的错位，那份信息还有救。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一格一个数",
          "desc": "相机把画面切成格子，每个格子只留下一个平均数；比格子更细的纹理被平均掉了。"
        },
        {
          "icon": "🔧",
          "title": "放大救不回来",
          "desc": "那些平均数里已经没有织纹了，插值放大只会把它摊平，不会把它变回来。"
        },
        {
          "icon": "✨",
          "title": "但多帧有救",
          "desc": "物体在动，同一处纹理在不同帧落进格子的位置略有不同——错开半格时，两次采样拼起来最接近真实。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "事件相机能提供什么信息",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "上一章说清了 RGB 的死穴：帧与帧之间那段空白时间，什么都没记。现在看另一种传感器——它根本不属于\"帧\"这个概念。",
      "analogy": {
        "title": "指针只在超格时跳",
        "text": "变化不到一格，指针<b>完全不动</b>。它记的不是\"现在的密度是多少\"，而是\"密度变化够大了\"这件事。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "一个像素什么时候才报事件",
          "desc": "「🟢 按事件相机的真实定义模拟」拖动阈值，看一行像素在哪些时刻才值得记一笔。",
          "componentId": "m-2-1"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "从事件到时空体",
          "desc": "「🟢 按事件相机的真实定义模拟」先看 5 个像素各自怎么报出事件，再看这些事件在三维时空里长成什么样。",
          "componentId": "m-2-2"
        }
      ],
      "insight": "事件记的是<b>变化</b>，不是图像。它没有绝对亮度，但在时间上连续、锐利——恰好补上帧最缺的那一段。",
      "formula": {
        "lead": "事件的定义：某个像素的对数亮度 ΔL 达到阈值 C 时，就产生一个事件。这里的 x、y 是像素坐标，t 是微秒级时间戳，p 是极性（+1 变亮、−1 变暗）。",
        "unicode": "<math display='block'><mi>Δ</mi><mi>L</mi><mo>(</mo><mi>x</mi><mo>,</mo><mi>y</mi><mo>,</mo><mi>t</mi><mo>)</mo><mo>=</mo><mo>±</mo><mi>C</mi><mspace width='1.4em'/><mo>⇒</mo><mspace width='1.4em'/><mi>e</mi><mo>=</mo><mo>(</mo><mi>x</mi><mo>,</mo><mi>y</mi><mo>,</mo><mi>t</mi><mo>,</mo><mi>p</mi><mo>)</mo></math>",
        "symbols": []
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "异步",
          "desc": "事件不属于任何\"帧\"，变化一发生它立刻输出，时间精度是微秒级。"
        },
        {
          "icon": "🔧",
          "title": "阈值触发",
          "desc": "只有变化超过阈值才记一笔，场景静止时它一片空白——这是在省带宽，不是缺陷。"
        },
        {
          "icon": "✨",
          "title": "连续且锐利",
          "desc": "帧只是孤零零的几个时刻，中间一大段空白什么都不记；事件一个接一个，把这段时间填满。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "为什么事件能做好纹理超分",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "把前两章拼起来：纹理糊是因为信息没被记下，而事件恰好提供了 RGB 没有的两样东西。这一章就是论文的动机。",
      "analogy": {
        "title": "套准旋钮",
        "text": "旋钮偏一丝，两张印样就叠不齐。<b>叠不齐，两张合起来也等于一张。</b>",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "对齐偏差吃掉收益",
          "desc": "「🟢 每个数都是真算出来的」多帧重建的前提是知道错开了多少；拖动对齐偏差，看多帧的收益是怎么被吃掉的。",
          "componentId": "m-3-1"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "只记变化够不够？",
          "desc": "「🟢 由事件定义直接演示」同时启动两侧，看两块面板下面的明暗条会漂到哪去。",
          "componentId": "m-3-2"
        }
      ],
      "insight": "事件同时补上两块短板——更准的运动（对齐）和更密的高频（纹理）；但它没有绝对亮度，所以必须和 RGB 一起用。这就是论文那两条分支的由来。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "短板一：对齐",
          "desc": "多帧重建必须先知道每帧错开了多少。偏一点点还能忍，偏到接近半格，两帧的采样就几乎重合，多帧等于白拼。"
        },
        {
          "icon": "🔧",
          "title": "短板二：高频",
          "desc": "事件是逐像素触发的，纹理越密、边缘越锐的地方它越活跃——高频信息本来就在里面。"
        },
        {
          "icon": "✨",
          "title": "但不能单用",
          "desc": "事件只记变化，单独积分回来的画面会整体漂移；RGB 提供绝对亮度基准，两者缺一不可。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "输入表示：事件怎么变成张量",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "铺垫到此结束，从这里开始讲论文本身。第一件事最实际：一串异步的、没有绝对亮度的事件，网络要怎么吃进去？",
      "analogy": {
        "title": "划过的点连成线",
        "text": "边缘往哪走、走多快，留下的点就排成什么斜度的线。事件记的不是画面，是<b>运动的轨迹</b>。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "时间片：把一串点装进箱子",
          "desc": "「🟡 bin 数与消融结论来自论文 Eq.(1) 与 Table VIII」切换时间片数量，看事件被分进几个箱子。",
          "componentId": "m-4-1"
        }
      ],
      "insight": "事件本来是一串时间戳，网络吃不了；按时间切成 B 片再聚合成张量，它才能进卷积网络——这就是论文的输入表示。",
      "formula": {
        "lead": "体素网格 V：把事件按时间归入 B 个片，第 i 片的值是所有落进去的事件按时间距离加权求和。i 是片索引（1…B），p_k 是第 k 个事件的极性，t_k 是它的时刻，t_0 与 t_Ne 是这段事件流的起止时刻。论文另外按第 98 百分位截断归一化，用来压制热像素。",
        "unicode": "<math display='block'><mi>V</mi><mo>(</mo><mi>i</mi><mo>)</mo><mo>=</mo><munder><mo>∑</mo><mi>k</mi></munder><msub><mi>p</mi><mi>k</mi></msub><mo>·</mo><mi>max</mi><mo>(</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>−</mo><mrow><mo>|</mo><mo>(</mo><mi>i</mi><mo>−</mo><mn>1</mn><mo>)</mo><mo>−</mo><mfrac><mrow><mo>(</mo><msub><mi>t</mi><mi>k</mi></msub><mo>−</mo><msub><mi>t</mi><mn>0</mn></msub><mo>)</mo><mo>(</mo><mi>B</mi><mo>−</mo><mn>1</mn><mo>)</mo></mrow><mrow><msub><mi>t</mi><mrow><mi>N</mi><mi>e</mi></mrow></msub><mo>−</mo><msub><mi>t</mi><mn>0</mn></msub></mrow></mfrac><mo>|</mo></mrow><mo>)</mo></math>",
        "symbols": []
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "切成 5 片",
          "desc": "论文把事件流按时间离散成 B = 5 个时间片，聚合成体素网格再送进网络。"
        },
        {
          "icon": "🔧",
          "title": "抗热像素",
          "desc": "归一化时按第 98 百分位截断，避免个别坏点把整张特征图带偏。"
        },
        {
          "icon": "✨",
          "title": "多了没用",
          "desc": "切成 8 片并不会更好：片切太细，每片里的点变稀疏，反而不好提取特征（Table VIII）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "架构总览：两条分支",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "输入有了。现在看整台机器：一个时间步里，上一刻传下来的特征怎么被两条分支同时消费、又怎么传给下一刻。",
      "analogy": {
        "title": "压上纹理补片",
        "text": "一条分支负责\"补纹理\"，另一条负责\"别抖\"。它们最后合成同一张印样。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "三个时刻与两个方向",
          "desc": "「🟡 上面是论文原图 Fig.5(a)（图源见项目 README）」下面是它的交互版，版式与原图一致：三个时刻横排，每个时刻都有纹理与运动两条分支，前向和后向各自把特征传一遍。",
          "componentId": "m-5-1",
          "figure": "/images/fig5a-framework.png"
        }
      ],
      "insight": "两条分支是<b>并行</b>消费同一份输入的，不是一条接一条；而循环结构让特征能跨时间步累积，双向则让过去和未来都用得上。",
      "formula": {
        "lead": "四路特征在融合模块里汇合。F 是 15 个残差块组成的融合模块；I 的下标 t 上标 LR 是当前帧，f 的上标 B 是反向传播来的特征，M 与 T 分别是运动分支和纹理分支的输出。",
        "unicode": "<math display='block'><msub><mi>f</mi><mi>t</mi></msub><mo>=</mo><mi>F</mi><mo>(</mo><msubsup><mi>I</mi><mi>t</mi><mrow><mi>L</mi><mi>R</mi></mrow></msubsup><mo>,</mo><mspace width='0.5em'/><msubsup><mi>f</mi><mi>t</mi><mi>B</mi></msubsup><mo>,</mo><mspace width='0.5em'/><msubsup><mi>f</mi><mi>t</mi><mi>M</mi></msubsup><mo>,</mo><mspace width='0.5em'/><msubsup><mi>f</mi><mi>t</mi><mi>T</mi></msubsup><mo>)</mo></math>",
        "symbols": []
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两条分支各管一件事",
          "desc": "纹理分支用事件补高频细节，运动分支用事件改善时序对齐——这是本文与以往事件方法最大的不同。"
        },
        {
          "icon": "🔧",
          "title": "双向循环",
          "desc": "前向从过去走到现在，后向从未来回到现在，两条网络的隐状态互相连接，过去和未来都能用上。"
        },
        {
          "icon": "✨",
          "title": "残差输出",
          "desc": "网络不用从零画出整张 HR 图：双三次先给出低频底子，网络只补差值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "ITE：逐片迭代补纹理",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "架构看完了，现在钻进它的核心。纹理到底是怎么\"一次比一次清楚\"的？这一章讲论文最主要的那个模块。",
      "analogy": {
        "title": "圈出差值",
        "text": "不去重画整张图，只把<b>跟原件不一样的地方</b>圈出来。要补的信息其实很少，也很集中。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "ITE 迭代步进器",
          "desc": "「🔴 上面是论文原图 Fig.5(b)（图源见项目 README）」下面一步步推进迭代，看每个时间片补上一点什么。原理示意，非模型真实输出。",
          "componentId": "m-6-1",
          "figure": "/images/fig5b-ite.png"
        }
      ],
      "insight": "不是把事件一次性塞进去，而是<b>一片一片地</b>喂，每次只学一份残差，累加起来——这样每一片的时间细节都不会丢。",
      "formula": {
        "lead": "纹理特征是把每一次迭代学到的残差累加起来的。ζ 的上标 i 表示第 i 次迭代，下标 t 表示当前时刻；N 是迭代次数，设计上等于时间片数 5。注意它不是取最后一次的输出。",
        "unicode": "<math display='block'><msubsup><mi>f</mi><mi>t</mi><mi>T</mi></msubsup><mo>=</mo><msub><mi>f</mi><mrow><mi>t</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>+</mo><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>N</mi></munderover><msubsup><mi>ζ</mi><mi>t</mi><mi>i</mi></msubsup></math>",
        "symbols": []
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "逐片消费",
          "desc": "ITE 把事件流按时间片一片一片喂进去，每片贡献一份残差——而不是一次性压成一坨。"
        },
        {
          "icon": "🔧",
          "title": "残差累加",
          "desc": "最终纹理特征是把各次迭代的残差加上去，不是取最后一次的输出；去掉这个累加要掉 0.35 dB。"
        },
        {
          "icon": "✨",
          "title": "5 次就够",
          "desc": "迭代次数等于时间片数 5 时最好，加到 8 次没有额外收益；去掉迭代机制则掉 0.42 dB（Table VIII）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "TTA：双流时序对齐",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "§3 说过：对齐偏了，多帧就白拼。这一章先看清\"对齐\"这个动作本身到底在做什么，再看论文怎么用事件和 RGB 两条流一起把它做准。",
      "analogy": {
        "title": "把十字对准",
        "text": "对齐不是\"看起来差不多\"，而是<b>十字必须压在一起</b>。压不准，后面所有工序都白做。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "两条流谁搬得准",
          "desc": "「🟡 上面是论文原图 Fig.6（运动分支）（图源见项目 README）」大运动下，RGB 光流和事件光流各自把上一帧搬过来，看谁搬得准，再看融合之后是什么样。",
          "componentId": "m-7-1",
          "figure": "/images/fig6-tta.png"
        }
      ],
      "insight": "没有哪条流永远更好——小运动时 RGB 光流稳，大运动时事件流更能扛。所以论文不赌，而是两条一起用。",
      "formula": {
        "lead": "两条流各自把上一刻的特征对齐到当前时刻再融合。O^e 是事件流估出的光流，O^r 是 RGB 流估出的光流，W 是按光流做的反向 warp，F^M 是把两路结果拼起来再过一层 1×1 卷积的融合模块。",
        "unicode": "<math display='block'><msubsup><mi>f</mi><mi>t</mi><mi>M</mi></msubsup><mo>=</mo><msup><mi>F</mi><mi>M</mi></msup><mo>(</mo><mo>[</mo><mi>W</mi><mo>(</mo><msub><mi>f</mi><mrow><mi>t</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>,</mo><msup><mi>O</mi><mi>e</mi></msup><mo>)</mo><mo>,</mo><mspace width='0.6em'/><mi>W</mi><mo>(</mo><msub><mi>f</mi><mrow><mi>t</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>,</mo><msup><mi>O</mi><mi>r</mi></msup><mo>)</mo><mo>]</mo><mo>)</mo></math>",
        "symbols": []
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两条流各有胜负",
          "desc": "常规运动下 RGB 光流足够可靠；运动一大，RGB 光流被运动模糊和盲时拖垮，事件流明显更能扛。"
        },
        {
          "icon": "🔧",
          "title": "融合最稳",
          "desc": "不赌哪一条更好，而是两条并行、拼起来用——消融显示单加运动分支在运动复杂的 REDS4 上收益最明显。"
        },
        {
          "icon": "✨",
          "title": "时序一致性也赢了",
          "desc": "论文在 Vid4 与 REDS4 上 4× 的 tOF 最低、TCC 最高，说明这种对齐确实压住了纹理闪烁（Table IV）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "插件化：不用重训主干",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "方法讲完了。但读者一定会问：这么好的东西，我能直接用到现成模型上吗？这一章是论文在工程上最有价值的部分。",
      "analogy": {
        "title": "盖上一张现成的",
        "text": "不用重做整块版，把一张<b>已经做好的</b>补片直接盖上去就行。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "插件框架",
          "desc": "「🟡 上面是论文原图 Fig.7（图源见项目 README）」按原图版式画出来：主干吐出三样东西，插件冻住主干、只训自己。切换两种模式看谁在学。",
          "componentId": "m-8-1",
          "figure": "/images/fig7-plugin.png"
        }
      ],
      "insight": "插件模式的价值不在精度，而在迁移成本：主干一行都不用改，它只负责产出特征，补纹理的活儿交给插件。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "冻结主干",
          "desc": "训练时主干完全不更新，只训插件和上采样器——所以换任何现成模型都能挂。"
        },
        {
          "icon": "🔧",
          "title": "增益稳定",
          "desc": "Vid4 上 PSRT +1.63、MIA-VSR +1.54、IART +1.55 dB；BasicVSR++ 在 REDS4 上涨 0.55 dB，参数量和 FLOPs 只增加一点点（Table VI）。"
        },
        {
          "icon": "✨",
          "title": "是信息不是容量",
          "desc": "论文做了参数量对齐的对照：同样冻结主干、只加额外残差块，几乎不涨甚至略降——增益来自事件信息，不是模型变大。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "训练：这套东西是怎么训出来的",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "方法讲完了，还有一个很实际的问题：训这么一套东西要花多大代价？这一章把论文的实现细节讲清楚。",
      "analogy": {
        "title": "一遍一遍地滚",
        "text": "训练就是把同一批样本翻来覆去地过很多遍。论文的选择是：要么从零训 30 万遍，要么<b>冻住主干只训插件</b>，20 万遍就够。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "一次训练迭代里发生了什么",
          "desc": "「🟡 数值来自论文 Sec. IV-B」一步步走一遍训练回路：取一批样本、前向、算损失、反向更新参数。",
          "componentId": "m-9-1"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "训练样本长什么样",
          "desc": "「🟡 设置来自论文 Sec. IV-B」一步步看一段视频怎么变成一次训练的输入。",
          "componentId": "m-9-2"
        }
      ],
      "insight": "训练成本不是论文的副产品——插件模式之所以能\"即插即用\"，靠的就是把主干冻住、不去重训。",
      "formula": {
        "lead": "训练用的损失函数。I^HR 是高分辨率真值帧，I^SR 是网络输出帧；ε 是一个极小的常数，只是为了让函数在误差为 0 处也可导，它不是可调超参。",
        "unicode": "<math display='block'><mi>L</mi><mo>=</mo><msqrt><msup><mrow><mo>‖</mo><msup><mi>I</mi><mrow><mi>H</mi><mi>R</mi></mrow></msup><mo>−</mo><msup><mi>I</mi><mrow><mi>S</mi><mi>R</mi></mrow></msup><mo>‖</mo></mrow><mn>2</mn></msup><mo>+</mo><msup><mi>ε</mi><mn>2</mn></msup></msqrt></math>",
        "symbols": []
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两种模式",
          "desc": "从零训 30 万次迭代；插件模式冻住主干，只训插件，20 万次。"
        },
        {
          "icon": "🔧",
          "title": "代价",
          "desc": "都在 4 张 RTX 3090 上跑，分别约 4 天与 6 天；而 IART 自己训练要约 27 天。"
        },
        {
          "icon": "✨",
          "title": "损失",
          "desc": "Charbonnier 在大误差处更像绝对值，比 L2 更不容易被离群点带偏。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、消融与诚实的边界",
      "badge": "both",
      "badgeLabel": "通用",
      "bridge": "最后一章。先给出结果，再把\"这个页面没告诉你什么\"摆到台面上——这是本教程刻意保留的一节，也是最该带走的东西。",
      "analogy": {
        "title": "逐张看过去",
        "text": "结果不是靠一张漂亮的图说清的，要<b>一张一张比</b>，还要知道每张是在什么条件下拍的。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "谁在 Vid4 上最高",
          "desc": "「🟡 上面是论文原图 Fig.1（图源见项目 README）」数值全部来自论文 Table I，点一行看它的成绩。",
          "componentId": "m-10-1",
          "figure": "/images/fig1-scatter.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "合成事件 vs 真实事件",
          "desc": "「🟡 数据来源即事实」五个数据集里，事件分别是模拟的还是真实采集的。",
          "componentId": "m-10-2"
        }
      ],
      "insight": "论文还测了 BD 退化下的鲁棒性：Vid4 上比 BasicVSR 主干高 1.28 dB（Table XI）。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "全面领先",
          "desc": "五个数据集、多种放大倍数上都拿到了最好结果；Vid4 4× 比 IART 高 1.48 dB，LPIPS 0.2048 最低。"
        },
        {
          "icon": "🔧",
          "title": "增益有规律",
          "desc": "纹理越丰富、运动越剧烈，收益越大（Vimeo-90K-T 的 hard 子集 +0.50 dB，REDS4 Clip_000 比 EBVSR 高 2.46 dB）。"
        },
        {
          "icon": "✨",
          "title": "看清条件",
          "desc": "合成事件、通道差异、自行复现的基线——每一条都影响结论的力度，别只看那个 1.48。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1mE411H7mB",
      "title": "iniVation动态视觉传感器简介",
      "reason": "用真实器材演示 DVS 输出长什么样，是第 5 章「事件相机是什么」最直观的补充。",
      "cover": "https://i2.hdslb.com/bfs/archive/ac00e03a45580326e46161f7e4949706bd643315.jpg",
      "views": "2844播放"
    },
    {
      "bvid": "BV1c73kzwEjr",
      "title": "事件相机的视觉传感器成像演示及与标准相机传感器对比 | 友思特科技",
      "reason": "把事件相机与标准相机并排对比，直接对应第 5、6 章里「事件记录变化、RGB 记录绝对亮度」这一核心区别。",
      "cover": "https://i0.hdslb.com/bfs/archive/1e40681a182bd62a05e5e9a901cae2b5165533e1.jpg",
      "views": "353播放"
    },
    {
      "bvid": "BV1wH4y1c7vJ",
      "title": "20240717【面向事件相机的物体检测与跟踪】李家宁：Object Detection with Neuromorphic Cameras",
      "reason": "一场学术报告，讲事件表示、时序建模与多模态融合。读完第 6 章的体素网格再看，能把「事件怎么喂给网络」这条线接上。",
      "cover": "https://i0.hdslb.com/bfs/archive/22b29e5ffbd3bc05ed0c785e06208e3ca0c8710c.jpg",
      "views": "1976播放"
    },
    {
      "bvid": "BV1Go4y197gr",
      "title": "DVS姿态追踪",
      "reason": "事件相机在低光、高速场景下的落地案例，帮助理解「微秒级、无运动模糊」在实际系统里为什么值钱。",
      "cover": "https://i0.hdslb.com/bfs/archive/5b5402af85c079400ef73cb8da521c5cc7780d0e.jpg",
      "views": "283播放"
    }
  ]
};
