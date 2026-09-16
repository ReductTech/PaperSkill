import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "When and Why Grouping Attention Heads Accelerates Muon Optimization",
    "titleZh": "Muon 应该逐个注意力头处理吗？",
    "venue": "arXiv:2605.08933 · 2026",
    "authors": "Hongtao Zhang · Wenjie Zhou · Wei Chen · Xueqi Cheng",
    "affiliation": "中国科学院计算技术研究所 · 中国科学院大学",
    "domain": "优化器 × 多头注意力",
    "coreProblem": "同一个 attention projection：整块、逐头，还是按组 白化（正交化）？",
    "coreInsight": "论文中文题名：<b>何时以及为何对注意力头分组能够加速 Muon 优化</b>。Muon 是训练时调整模型参数的优化器；本文研究的是“一次应该一起处理多少个注意力头”。先做选择，再看实验与收益—代价的权衡。",
    "keywords": [
      "Muon",
      "注意力头分组",
      "一步下降分析"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "固定处理单位：整块或逐头",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "把 head 分组粒度作为优化器超参数",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "先选一选：Muon 应该逐个注意力头处理吗？",
      "badge": "inf",
      "badgeLabel": "建立直觉",
      "bridge": "先认识两个角色：<b>注意力头（head）</b>是多头注意力中的一个计算分支；<b>Muon</b> 是训练时调整模型参数的优化器。注意力按头计算，Muon 默认按矩阵处理，因此我们要问：优化器也应该逐头处理吗？",
      "analogy": {
        "title": "选择纸束",
        "text": "把一叠纸作为整体、逐张或分束整理，看起来都合理。这个类比只用于认识处理单位。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "粒度选择：全矩阵、逐头或分组",
          "desc": "<b>怎么理解、怎么看：</b>全矩阵（Full）整体处理一个投影；逐头（Head-wise）每个头独立处理；分组（Grouped）让若干头一起处理。选择后看大边框如何圈住小块：边框表示一次正交化的范围，不表示注意力连接。<br/><br/><b>证据与范围：</b>教学示意｜选择会改变处理边界；这里不预先宣布哪个方案获胜。",
          "componentId": "quiz"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "先选再看证据",
          "desc": "合理直觉需要验证。"
        },
        {
          "icon": "◇",
          "title": "分组是优化器选择",
          "desc": "它改变正交化的范围。"
        },
        {
          "icon": "✓",
          "title": "不预设胜者",
          "desc": "三个方案都有值得追问的地方。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图 1：早期领先，未必最后领先",
      "badge": "inf",
      "badgeLabel": "打破直觉",
      "bridge": "<b>验证损失（验证损失）</b>衡量模型在验证数据上的预测表现，数值越低越好。上一章的直觉需要实验检验：早期下降快，是否意味着训练结束也更好？",
      "analogy": {
        "title": "推进纸张",
        "text": "一张纸先移动得快，不等于最后整理得更好。纸张位置只表示相对趋势，不表示实测速度。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "早期优势会一直保持吗？",
          "desc": "<b>怎么理解、怎么看：</b>原图横轴 Training steps 是训练步数，纵轴 Validation loss 是验证损失；同一时刻曲线越低越好。切换早期和后期，再对照原图：逐头早期领先、整矩阵后期反超，说明不能只看开头；这也不直接等于运行时间加速。<br/><br/><b>证据与范围：</b>论文证据｜图 1（第 2 页）；下方位置示意仅表达阶段关系，不生成训练曲线。",
          "componentId": "reversal"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "早期",
          "desc": "逐头（Head-wise） 更快下降。"
        },
        {
          "icon": "◇",
          "title": "后期",
          "desc": "整矩阵（全矩阵-matrix） 表现更好。"
        },
        {
          "icon": "✓",
          "title": "需要解释",
          "desc": "更细并不始终更优。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "粒度冲突：一张矩阵，多个注意力头",
      "badge": "inf",
      "badgeLabel": "理解冲突",
      "bridge": "<b>矩阵</b>可以理解为一张数字表；多头注意力把其中的不同部分分给不同的头。参数仍是同一批，但处理单位不同，这个单位的大小就是<b>粒度（granularity）</b>。",
      "analogy": {
        "title": "对齐纸边",
        "text": "整理纸张时，可以对齐整叠，也可以观察每张纸。对象没变，处理边界变了。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "Muon 看矩阵，注意力看多个头",
          "desc": "<b>怎么理解、怎么看：</b>Q（Query，查询）与 K（Key，键）共同计算关注程度，V（Value，值）提供被汇总的信息；生成它们的线性变换称为注意力投影。这里画单个 Q 或 K：768×768 的矩阵，按论文行分块记法，每个头对应 64×768；切换视角时只是划分边界改变。<br/><br/><b>证据与范围：</b>论文证据｜第 1–3 页。矩形为结构示意，不是实际参数数值。",
          "componentId": "mismatch"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "同一参数",
          "desc": "两种结构视角并存。"
        },
        {
          "icon": "◇",
          "title": "矩阵单位",
          "desc": "Muon 在二维矩阵上正交化。"
        },
        {
          "icon": "✓",
          "title": "注意力头单位",
          "desc": "注意力自然拆成多个注意力头。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "三种正交化范围，一眼看清",
      "badge": "both",
      "badgeLabel": "看懂机制",
      "bridge": "<b>白化／正交化（白化（正交化））</b>在本文中指调整更新矩阵的奇异值尺度：理想情况下保留非零奇异方向，把其奇异值变成 1。先理解为减少更新在不同方向上的尺度失衡；它不是把每个数字都改成一样。",
      "analogy": {
        "title": "束起纸张",
        "text": "一条束带圈住哪些纸，就像一次正交化包含哪些 head。束带不表示 head 之间的注意力连接。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "全矩阵、逐头、分组",
          "desc": "<b>怎么理解、怎么看：</b>整体处理时，各头通过同一次正交化相互影响；拆开后，每个头或每组按自己的矩阵结构计算更新。切换三个选项并数边框：分别是 1、12、4 个独立块；这就是分组实际改变的机制。<br/><br/><b>证据与范围：</b>教学示意｜本模块只画单个 Q 或 K 投影。单投影全矩阵不等同于 表 1 的 packed Full-QKV 基线。",
          "componentId": "scopes"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "全矩阵",
          "desc": "单投影全局正交化。"
        },
        {
          "icon": "◇",
          "title": "逐头（Head-wise）",
          "desc": "逐头 独立正交化。"
        },
        {
          "icon": "✓",
          "title": "分组",
          "desc": "在两个极端之间选范围。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "核心天平：额外收益值得额外代价吗？",
      "badge": "both",
      "badgeLabel": "理解理论",
      "bridge": "分组可能让更新与当前下降方向更契合，带来<b>额外收益（Gain）</b>；但整体更新也可能变大，在弯曲的损失曲面上引入<b>额外范数代价（Cost）</b>。这里的代价不是显卡耗时，而是理论下降保证中被扣掉的二阶项。",
      "analogy": {
        "title": "称量纸束",
        "text": "天平比较两侧重量。这里用它表示额外收益与额外代价，不把真实训练过程当作秤重。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "收益—代价交互天平",
          "desc": "<b>怎么理解、怎么看：</b>左边是比整矩阵多得到的收益，右边是多付出的代价；左边更重才值得分组。把 a 从 0.30 调到 0.60，再调到 1.00，观察收益不足、相等、收益超过代价三种状态；D 表示理论下降下界，不是实际损失。<br/><br/><b>证据与范围：</b>解析示例｜依据附录 E 的对齐低秩构造，固定 k=4、βη/2=0.4，调整每组强度 a；数值不是训练实测。",
          "componentId": "balance"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "公式逐步揭示：为什么要收益大于代价？",
          "desc": "<b>先认符号：</b>G 是梯度，η 是学习率（一步的步幅），β 是光滑性常数，约束曲面的弯曲程度；all 表示整矩阵，grp 表示分组。<br/><br/><b>读公式顺序：</b>先看收益减代价，再分别写出两个下降下界，最后相减；下界是理论给出的保证，不等于实际下降量，也不保证实际下降的排序。<br/><br/>论文理论｜命题 1 与附录 B：β 光滑、共同步长 η > 0、精确梯度 极分解因子。逐步比较下降下界。",
          "componentId": "equations"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "收益",
          "desc": "额外的一阶 白化（正交化） 收益。"
        },
        {
          "icon": "◇",
          "title": "代价",
          "desc": "额外更新范数造成的二阶代价。"
        },
        {
          "icon": "✓",
          "title": "判断标准",
          "desc": "比较两者，不数切了多少块。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "亲手给 12 个注意力头分组",
      "badge": "trn",
      "badgeLabel": "操作分组",
      "bridge": "<b>g 是每组的头数，不是组数。</b>12 个头、g=3 表示每组 3 个，共 4 组；分组规则 S 决定哪些头成为同组成员。改变组大小与改变成员关系，是两个不同的选择。",
      "analogy": {
        "title": "重排纸束",
        "text": "同样大小的纸束，也可以包含不同纸张。改变成员与改变束大小是两种操作。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "注意力头分组可视化",
          "desc": "<b>怎么理解、怎么看：</b>相邻分组把连续编号放一起；间隔分组按固定步长取成员；随机分组先打乱编号再划分。保持 g=3 切换相邻与间隔，观察组数不变、成员改变；点击 H0 可以突出它所在的组。<br/><br/><b>证据与范围：</b>论文证据｜附录 C，第 12–13 页。结构示意：只展示一个投影的分组，不预测该随机样本的 loss。",
          "componentId": "grouping"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "g 是每组注意力头 数",
          "desc": "组数是 12/g。"
        },
        {
          "icon": "◇",
          "title": "S 决定成员",
          "desc": "相邻、间隔、随机。"
        },
        {
          "icon": "✓",
          "title": "随机每步重采样",
          "desc": "不把一次随机分组固定整个训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练阶段探索：合适粒度为什么会变？",
      "badge": "trn",
      "badgeLabel": "探索阶段",
      "bridge": "训练过程中，梯度和更新的结构会变化，额外收益与代价的相对大小也可能变化。论文比较不同固定分组配置，发现<b>早期领先的粒度，到了后期可能不再领先</b>。",
      "analogy": {
        "title": "移动纸束",
        "text": "整理阶段变了，合适的束大小也可能改变。纸束大小只映射粒度偏好。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "训练阶段探索器",
          "desc": "<b>怎么理解、怎么看：</b>早期 g=1 的验证损失最低；中期 g=6 超过 g=1；后期 g=6 最好。阶段按钮展示不同固定配置的竞争，不是验证过的“早期用 g=1、后期切换 g=6”训练方案；收益—代价是论文对此的解释，而非逐步测出的因果分解。<br/><br/><b>证据与范围：</b>论文证据＋定性示意｜仅适用于 图 2 的 Q/K 随机分组 设置；没有任意 step 的精确 loss，也没有已验证的动态调度策略。",
          "componentId": "stages"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "阶段相关",
          "desc": "最佳粒度不是静态直觉。"
        },
        {
          "icon": "◇",
          "title": "范围明确",
          "desc": "这里只展示 Q/K 随机分组 实验。"
        },
        {
          "icon": "✓",
          "title": "不替代新实验",
          "desc": "从 g=1 切换到 g=6 的调度尚未在本文验证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "近满秩，为什么仍有实际代价？",
      "badge": "trn",
      "badgeLabel": "区分理想与实际",
      "bridge": "<b>秩（rank）</b>可粗略理解为矩阵包含多少个独立方向；<b>近满秩</b>表示接近能达到的最大秩。但理想分析中的秩差小，不意味着实际近似更新的范数代价一定为零。",
      "analogy": {
        "title": "检视纸边",
        "text": "看起来对齐的纸边，仍可能需要实际测量。理想条件与操作结果要分别检查。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "图 3 / 图 4：理想与实际",
          "desc": "<b>怎么理解、怎么看：</b>图 3 看秩：接近满行秩支持理想秩差较小的条件；图 4 看实际更新：有限次 Newton–Schulz 迭代近似正交化后，逐头更新的平方 Frobenius 范数更大。范数衡量更新整体有多大，两张图回答的问题不同，所以并不矛盾。<br/><br/><b>证据与范围：</b>论文证据｜第 14–15 页，附录 D。原图保留真实坐标；教学图不制造 rank 或 norm 读数。",
          "componentId": "practical"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "近满秩",
          "desc": "支持理想分析的小代价条件。"
        },
        {
          "icon": "◇",
          "title": "近似白化",
          "desc": "实际更新不满足精确 polar 恒等式。"
        },
        {
          "icon": "✓",
          "title": "测量 范数差",
          "desc": "代数秩不能代替实际二阶项。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "结果揭晓：中间粒度胜出",
      "badge": "both",
      "badgeLabel": "核对结果",
      "bridge": "<b>基线（baseline）</b>是用来比较的已有配置；<b>最佳已测试配置（best tested configuration）</b>只表示在本文试过的选项中最好。下面比较同一实验协议下的验证损失，越低越好。",
      "analogy": {
        "title": "比较纸束",
        "text": "在同一把尺子上比较整理结果。尺子对应同一验证协议，不能拿别的实验混比。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "最终结果比较器",
          "desc": "<b>怎么理解、怎么看：</b>点击开始对比，正的“改善”表示当前损失低于 Full-QKV 基线。3.2780 减去 3.2722 等于 0.0058；最好的已测试配置只对 Q/K 随机分组，每组 6 个头，不能推广为所有模型的最优选择。<br/><br/><b>证据与范围：</b>论文证据｜表 1（第 5 页）。GPT-2 Small + FineWeb；6,200 steps，固定验证预算 10,485,760 tokens；验证损失 越低越好。",
          "componentId": "results"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "最佳已测试配置",
          "desc": "Q/K 随机分组，g=6。"
        },
        {
          "icon": "◇",
          "title": "改善幅度",
          "desc": "3.2780 → 3.2722，下降 0.0058。"
        },
        {
          "icon": "✓",
          "title": "外推边界",
          "desc": "不是所有 Transformer 的普遍最优。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "带走一个判断，而非一个数字",
      "badge": "both",
      "badgeLabel": "迁移理解",
      "bridge": "把全文连起来：Muon 按矩阵处理，注意力按头组织，所以值得研究处理范围；拆开可能增加收益，却也可能增加范数代价，因此中间粒度可能更合适。你要带走的是这个判断过程，而不只是数字 g=6。",
      "analogy": {
        "title": "压平纸束",
        "text": "整理完成后，用一块压板检查是否稳妥。最终判断关心效果与代价是否匹配。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "把结论用在正确的地方",
          "desc": "<b>怎么理解、怎么看：</b>不要只问“切得够不够细”，要问“多获得的收益能否补偿多付出的代价”，再用对应模型和数据上的实验检验。数学补充放在折叠区域；不展开也应能用自己的话讲清这条主线。<br/><br/><b>证据与范围：</b>理解检查｜新情境是教学判断题，不是论文新增实验；可展开数学补充查看 SVD、极分解因子 和两种范数。",
          "componentId": "conclusion"
        }
      ],
      "takeaways": [
        {
          "icon": "◉",
          "title": "更细并不总是更好",
          "desc": "更细并不总是更好。"
        },
        {
          "icon": "◇",
          "title": "更粗也不总是更好",
          "desc": "更粗也不总是更好。"
        },
        {
          "icon": "✓",
          "title": "What matters is whether the 白化（正交化） gain is worth the norm cost.",
          "desc": "关键在于 白化（正交化） 收益是否值得范数代价。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1YpDkBNEE4",
      "title": "Muon 可扩展训练：背景补充",
      "reason": "介绍 Muon 的相关工作，不作为本文分组结论的证据；其标题中的算力收益不属于本论文。"
    }
  ]
};
