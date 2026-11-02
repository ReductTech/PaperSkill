import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Act Like a Pathologist: Tissue-Aware Whole Slide Image Reasoning",
    "titleZh": "像病理医生那样读片：组织感知的全切片图像推理",
    "venue": "arXiv 2603.00667v3 · 2026",
    "authors": "Wentao Huang, Weimin Lyu, Peiliang Lou, Qingqiao Hu, Xiaoling Hu, Shahira Abousamra, Wenchao Han, Ruifeng Guo, Jiawei Zhou, Chao Chen, Chen Wang",
    "affiliation": "石溪大学 · 梅奥诊所 · 哈佛医学院 · 斯坦福大学",
    "domain": "计算病理 · 全切片图像视觉问答",
    "coreProblem": "一张切片切成成千上万块，旧方法为了压进 token 上限只能均匀或随机抽样，问题无关的片块占满了预算。",
    "coreInsight": "HistoSelect 先按 <b>13 类组织提示</b>给片块分区，再用<b>组采样 + 片块选择</b>两级信息瓶颈，只把约 30% 的片块送进模型——视觉 token 省约 70%，准确率反而更高。",
    "keywords": [
      "病理视觉问答",
      "全切片图像",
      "组织感知检索",
      "信息瓶颈",
      "两级选择"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "旧做法：把成千上万块片块<b>不加区分</b>地送进模型，问题无关的占满 token 预算。图中问题问的是「肿瘤细胞核是否有多形性」，但送进去的既有背景也有重复片块。",
      "figure": "./images/fig1-old.png"
    },
    "newMethod": {
      "desc": "本文做法：先按组织<b>分区</b>，再由问题引导<b>由粗到细</b>挑片块；图中红色虚线把问题里的「tumor cells」连到恶性组织区域。",
      "figure": "./images/fig1-new.png"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一张切片装不进一次提问",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "论文要解决的不是<b>模型能不能看图</b>，而是<b>一张千兆像素的切片里，哪一小部分值得送进模型</b>。",
      "analogy": {
        "title": "一次曝光拍下整面墙",
        "text": "广角能收下整面墙，却看不清任何一格；想看清就得一格一格放大，代价是你根本看不完。<b>切片也是同样的取舍</b>。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "送进去的片块，多少才够",
          "desc": "同一道题、同一张片子，只改送进模型的视觉 token 预算。四档数值都是论文在 WSI-Bench 的形态题上实测的准确率；被点亮的片块格数是示意，按 5k≈全部片块的 30% 推算。",
          "componentId": "m1-budget",
          "figure": "./images/fig2-relevance.png"
        }
      ],
      "insight": "真正的问题不是「能不能塞下」，而是<b>塞进去的一大半是不是白送</b>。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "预算有峰值",
          "desc": "5k token 时形态题 94.57%，1k 只有 91.19%，10k 反而降到 94.12%。"
        },
        {
          "icon": "🔧",
          "title": "省下的是七成视觉 token",
          "desc": "5k 约为全部片块的 30%，也就是视觉 token 省掉约 70%（论文原文口径）。"
        },
        {
          "icon": "✨",
          "title": "先定预算，再挑内容",
          "desc": "预算决定「最多看几块」，接下来两章解决「究竟看哪几块」。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "先按组织类型分区",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "既然要少送，就得<b>有依据地少送</b>。病理医生先认出组织类型，再判断哪一类值得细看。",
      "analogy": {
        "title": "先分格，再挑片",
        "text": "印样先按场景分行，你才可能说「这次只看人像」。<b>组织类型就是切片的分行规则</b>。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "这一块，该贴到哪一行",
          "desc": "拖动左边的照片，落到一张组织卡片上，或用下面的按钮选择。归属规则只有一个：与哪类组织提示最相似，就归哪一类。照片与相似度数值是示意；论文正文把提示数记作 M 类，补充材料的 13 维采样率与 Figure 4 图例给出的是 13 类。",
          "componentId": "m2-tissue",
          "figure": "./images/fig4-select.png"
        }
      ],
      "insight": "有了组织标签，<b>「相关」才有落点</b>：问题指向哪类组织，就先看哪类。",
      "formula": {
        "lead": "每个片块归到与提示特征最相似的那一类：",
        "unicode": "<div><span class='sym fe-formula-sym' data-sym='l_i'>l<sub>i</sub></span> = argmax<sub>j</sub> ( <span class='sym fe-formula-sym' data-sym='x_i'>x<sub>i</sub></span> · <span class='sym fe-formula-sym' data-sym='t_j'>t<sub>j</sub></span> ) / ( ‖<span class='sym fe-formula-sym' data-sym='x_i'>x<sub>i</sub></span>‖ · ‖<span class='sym fe-formula-sym' data-sym='t_j'>t<sub>j</sub></span>‖ )，其中 j = 1 … <span class='sym fe-formula-sym' data-sym='M'>M</span></div>",
        "symbols": [
          {
            "sym": "x_i",
            "label": "x<sub>i</sub>",
            "desc": "第 i 个片块的特征向量（CONCH 视觉编码器给出）"
          },
          {
            "sym": "t_j",
            "label": "t<sub>j</sub>",
            "desc": "第 j 类组织提示的特征向量（CONCH 文本编码器给出）"
          },
          {
            "sym": "l_i",
            "label": "l<sub>i</sub>",
            "desc": "第 i 个片块的组织标签，取值 1 到 13"
          },
          {
            "sym": "M",
            "desc": "组织类型总数，论文为 13 类"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "13 类组织提示",
          "desc": "提示词由论文与专家病理医生共同设计，覆盖恶性、间质、淋巴细胞、坏死等。"
        },
        {
          "icon": "🔧",
          "title": "硬归属",
          "desc": "归属取相似度最大的那一类，不是模糊的概率云；贴错一行，后面的检索就从这里开始偏。"
        },
        {
          "icon": "✨",
          "title": "整片变成若干区域",
          "desc": "一片切片被分成若干类组织区域，后续的「相关」才有比较对象。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "组采样：先决定看哪几类",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "分好区之后，先要决定的是<b>每一类各看多少</b>——这一步比逐块挑选便宜得多。",
      "analogy": {
        "title": "先决定冲哪几卷",
        "text": "冲洗架只有几个槽位，你先把胶卷按「这次要什么」排队。<b>采样率就是这份排队顺序</b>。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "采样率怎么变成块数",
          "desc": "三步看懂采样率到名额的换算。四类的片块数与采样率是示意（合计 16,667 块，由「5k≈全部片块的 30%」推得；画面底部按每块 1 token 估算），换算规则与论文一致：先平均出组原型，再由问题算出采样率，最后乘以类内块数并向上取整。",
          "componentId": "m3-group"
        }
      ],
      "insight": "先按类别分预算，再在类别里挑块：<b>粗选比细选便宜得多</b>。",
      "formula": {
        "lead": "每类的名额由三件事决定：组原型、采样率、类内片块数。",
        "unicode": "<div><span class='sym fe-formula-sym' data-sym='g_j'>g<sub>j</sub></span> = (1/<span class='sym fe-formula-sym' data-sym='N_j'>N<sub>j</sub></span>) · Σ<sub>i∈I<sub>j</sub></sub> <span class='sym fe-formula-sym' data-sym='x_i'>x<sub>i</sub></span></div><div><span class='sym fe-formula-sym' data-sym='r_j'>r<sub>j</sub></span> = σ( <span class='sym fe-formula-sym' data-sym='F_group'>F<sub>组</sub></span>([<span class='sym fe-formula-sym' data-sym='g_j'>g<sub>j</sub></span>; <span class='sym fe-formula-sym' data-sym='q'>q</span>]) )</div><div><span class='sym fe-formula-sym' data-sym='k_j'>k<sub>j</sub></span> = ⌈ <span class='sym fe-formula-sym' data-sym='r_j'>r<sub>j</sub></span> · <span class='sym fe-formula-sym' data-sym='N_j'>N<sub>j</sub></span> ⌉</div>",
        "symbols": [
          {
            "sym": "g_j",
            "label": "g<sub>j</sub>",
            "desc": "第 j 组的组原型：组内所有片块特征的平均，代表「这类组织长什么样」"
          },
          {
            "sym": "N_j",
            "label": "N<sub>j</sub>",
            "desc": "第 j 组内的片块总数"
          },
          {
            "sym": "r_j",
            "label": "r<sub>j</sub>",
            "desc": "第 j 组的采样率，取值在 0 到 1 之间，由两层线性层加 sigmoid 给出"
          },
          {
            "sym": "k_j",
            "label": "k<sub>j</sub>",
            "desc": "第 j 组实际抽取的片块数，向上取整"
          },
          {
            "sym": "q",
            "desc": "问题的文本特征"
          },
          {
            "sym": "x_i",
            "label": "x<sub>i</sub>",
            "desc": "组内第 i 个片块的特征向量"
          },
          {
            "sym": "F_group",
            "label": "F<sub>组</sub>",
            "desc": "组采样器：两层线性层，输出经 sigmoid 变成该组的采样率"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "组原型先出场",
          "desc": "同类片块先平均成一个向量，再与问题特征拼在一起算采样率。"
        },
        {
          "icon": "🔧",
          "title": "名额向上取整",
          "desc": "采样率乘以类内块数就是名额；这一步只看类别，还没看具体片块。"
        },
        {
          "icon": "✨",
          "title": "组选错，后面补不回来",
          "desc": "理想组选择能让单组织题多 2.0 个点、多组织题多 6.0 个点（论文 Table 13）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "片块选择：在预算里挑出最相关的块",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "组采样决定「看哪几类」，现在要在组内决定<b>「看哪几块」</b>，并说清压缩该压到多狠。",
      "analogy": {
        "title": "一张一张圈出来",
        "text": "预算只有几个圈，圈错一格就少看一处证据。<b>选择器就是在排这个圈序</b>。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "六个名额，你会圈哪几块",
          "desc": "这是同一类组织里的 24 块候选（示意）。预算只允许留 6 块（此处 k=6 仅为示意，论文的 k<sub>j</sub> 随组织与问题变化），论文按概率从高到低取前 k<sub>j</sub> 块；名额满了以后每多圈一块，都要先点掉一块。",
          "componentId": "m4-patch"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "压缩该压到什么程度",
          "desc": "两个 β 分别控制组级与片块级的压缩强度。八档都是论文在 WSI-Bench 的形态题上实测的准确率：先选组级，再选片块级，看准确率怎样在中间那档达到峰值。",
          "componentId": "m4-tune"
        }
      ],
      "insight": "排名不是装饰：<b>它决定哪些证据能进模型</b>，也决定压缩该在哪儿停。",
      "formula": {
        "lead": "组内按概率排序取前 k<sub>j</sub> 块；压缩项是两个伯努利分布之间的 KL 距离。",
        "unicode": "<div><span class='sym fe-formula-sym' data-sym='s_i'>s<sub>i</sub></span> = σ( <span class='sym fe-formula-sym' data-sym='F_patch'>F<sub>片块</sub></span>([<span class='sym fe-formula-sym' data-sym='x_i'>x<sub>i</sub></span>; <span class='sym fe-formula-sym' data-sym='q'>q</span>]) )</div><div><span class='sym fe-formula-sym' data-sym='D_KL'>D<sub>KL</sub></span>( B(<span class='sym fe-formula-sym' data-sym='π'>π</span>) ‖ B(<span class='sym fe-formula-sym' data-sym='p'>p</span>) ) = <span class='sym fe-formula-sym' data-sym='π'>π</span>·log(<span class='sym fe-formula-sym' data-sym='π'>π</span>/<span class='sym fe-formula-sym' data-sym='p'>p</span>) + (1−<span class='sym fe-formula-sym' data-sym='π'>π</span>)·log((1−<span class='sym fe-formula-sym' data-sym='π'>π</span>)/(1−<span class='sym fe-formula-sym' data-sym='p'>p</span>))</div><div>组内取前 <span class='sym fe-formula-sym' data-sym='k_j'>k<sub>j</sub></span> 块</div>",
        "symbols": [
          {
            "sym": "s_i",
            "label": "s<sub>i</sub>",
            "desc": "第 i 块被选中的概率，由「片块特征 + 问题特征」经两层线性层加 sigmoid 给出"
          },
          {
            "sym": "x_i",
            "label": "x<sub>i</sub>",
            "desc": "第 i 个片块的特征向量"
          },
          {
            "sym": "q",
            "desc": "问题的文本特征；与片块特征拼接后送进片块选择器"
          },
          {
            "sym": "D_KL",
            "label": "D<sub>KL</sub>",
            "desc": "两个伯努利分布之间的 KL 距离：压缩项就是用它衡量「学到的概率」与「先验」差多远"
          },
          {
            "sym": "F_patch",
            "label": "F<sub>片块</sub>",
            "desc": "片块选择器：两层线性层，输出经 sigmoid 变成每块被选中的概率"
          },
          {
            "sym": "π",
            "desc": "学习到的选择概率（组级是 r<sub>j</sub>，片块级是 s<sub>i</sub>）"
          },
          {
            "sym": "p",
            "desc": "先验概率：该特征与问题的余弦相似度，不是常数"
          },
          {
            "sym": "k_j",
            "label": "k<sub>j</sub>",
            "desc": "组内保留的块数；排序只在组内进行"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "组内排序取前 k 块",
          "desc": "概率来自片块特征与问题的拼接，排序发生在每一类组织内部。"
        },
        {
          "icon": "🔧",
          "title": "β 是拉锯",
          "desc": "β 为 0 时压缩失效；组级 β 取 0.2、片块级 β 取 0.10 时最好，再加大就压过头。"
        },
        {
          "icon": "✨",
          "title": "去掉排序的代价",
          "desc": "去掉片块选择器，形态题从 94.57% 掉到 92.07%（Table 5）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "训练：把「压缩」写进损失",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "片块选择器不是手写规则，它是被损失函数训出来的。<b>这一章看这个损失长什么样</b>。",
      "analogy": {
        "title": "同一张底片，两盘药水",
        "text": "药水太淡，影像是糊的；浓度合适，细节才出来。<b>β 就是那个浓度</b>。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "同样预算，随机抽样还是按概率选",
          "desc": "同一道题、同样 5k 预算：左边把片块随便送进去，右边送训练后选出的片块。两侧同时开始，准确率来自 WSI-Bench 的形态题的实测结果。",
          "componentId": "m5-train",
          "figure": "./images/fig3-arch.png"
        }
      ],
      "insight": "选择器是学出来的策略：<b>先验是相似度</b>，正则化让「留下」和「丢掉」都有依据。",
      "formula": {
        "lead": "总损失由回答的似然与两级压缩项组成，两个 β 分开调节。",
        "unicode": "<div><span class='sym fe-formula-sym' data-sym='L_final'>L<sub>final</sub></span> = <span class='sym fe-formula-sym' data-sym='L_VQA'>L<sub>VQA</sub></span> + <span class='sym fe-formula-sym' data-sym='β_g'>β<sub>g</sub></span> · <span class='sym fe-formula-sym' data-sym='L_group'>L<sub>group</sub></span> + <span class='sym fe-formula-sym' data-sym='β_p'>β<sub>p</sub></span> · <span class='sym fe-formula-sym' data-sym='L_patch'>L<sub>patch</sub></span></div>",
        "symbols": [
          {
            "sym": "L_final",
            "label": "L<sub>final</sub>",
            "desc": "最终一起优化的总损失：回答好不好，与「选得够不够精」同时被约束"
          },
          {
            "sym": "L_VQA",
            "label": "L<sub>VQA</sub>",
            "desc": "答案序列的负对数似然：回答得越准，这一项越小"
          },
          {
            "sym": "L_group",
            "label": "L<sub>group</sub>",
            "desc": "组级压缩项：让组采样率贴近「组原型与问题的相似度」这个先验"
          },
          {
            "sym": "L_patch",
            "label": "L<sub>patch</sub>",
            "desc": "片块级压缩项：让片块选择概率贴近「片块与问题的相似度」这个先验"
          },
          {
            "sym": "β_g",
            "label": "β<sub>g</sub>",
            "desc": "组级压缩权重，训练时从 0 线性升到 0.1"
          },
          {
            "sym": "β_p",
            "label": "β<sub>p</sub>",
            "desc": "片块级压缩权重，训练时从 0 线性升到 0.2"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两项压缩，两个旋钮",
          "desc": "组级与片块级各自有一个 KL 项，权重分别预热到 0.1 与 0.2。"
        },
        {
          "icon": "🔧",
          "title": "硬选择也能训",
          "desc": "前向用硬掩码真的丢掉片块，反向把梯度补回软概率（直通估计器）。"
        },
        {
          "icon": "✨",
          "title": "同样预算，差在排序",
          "desc": "随机采样 88.84%，训练后的选择器 94.57%（Table 4）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "结果、代价与边界",
      "badge": "both",
      "badgeLabel": "两者",
      "bridge": "方法有效到什么程度、哪些列其实没有拉开差距、作者自己承认哪些边界——<b>这一章逐列看</b>。",
      "analogy": {
        "title": "排进相册才算定稿",
        "text": "挑片、冲洗、排页都做完，最后要看的是一页排下来是否真的更好。<b>结果要按列看</b>，不能只看平均。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "五个任务列，两套方法",
          "desc": "点一次开始，两套方法从同一起点跑到各自在论文里的准确率。数值来自 Table 1：同一数据划分、同一批任务列；治疗题 97.92% 与 Quilt-LLaVA 并列，而不是独自领先。图里只画五列代表列，平均那组数字来自论文的七个任务列。",
          "componentId": "m6-race"
        }
      ],
      "insight": "平均值之外还有并列、有略低的指标，也有<b>覆盖不到的数据</b>。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "七列平均高 2.92 个点",
          "desc": "83.80% 对 80.88%（Table 1）；这是多列汇总，不是逐案例结论。"
        },
        {
          "icon": "🔧",
          "title": "开卷题 6 项中 5 项最高",
          "desc": "治疗建议的 WSI-R 是 0.801，低于 Quilt-LLaVA 的 0.807，不能说「全部最高」。"
        },
        {
          "icon": "✨",
          "title": "作者承认的边界",
          "desc": "验证主要在 TCGA 与院内数据；选中了哪些片块，模型仍不给文字理由。"
        }
      ]
    }
  ]
};
