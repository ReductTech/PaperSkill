import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning Transferable Visual Models From Natural Language Supervision",
    "titleZh": "CLIP：从图文配对到零样本分类",
    "venue": "arXiv:2103.00020v1 · 2021",
    "authors": "Alec Radford、Jong Wook Kim 等 · 教程：xiong",
    "affiliation": "OpenAI",
    "domain": "计算机视觉 · 多模态学习",
    "coreProblem": "预先限定的标签表，让视觉模型难以直接迁移到新任务。",
    "coreInsight": "从大量图文配对中学会对齐，再用文字描述构造新任务的类别。",
    "keywords": [
      "自然语言监督",
      "对比学习",
      "零样本",
      "线性探针",
      "鲁棒性"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "固定标签：先定义类别，再用带标签图片拟合分类器。换一套类别，通常还需要新的监督适配。",
      "componentId": "clip-hero-old"
    },
    "newMethod": {
      "desc": "语言接口：先学图文配对，再比较图片和候选描述。零样本分类时保持模型固定。",
      "componentId": "clip-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从固定标签到语言监督",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "固定标签表遇到新类别时，通常需要调整分类头并收集标注。CLIP想让文字成为描述任务的接口；先看它获得监督的方式。",
      "analogy": {
        "title": "给相册留一个新位置",
        "text": "相册不必只有三种图签，文字还可以描述新候选。能写出标签不等于模型一定能识别它。",
        "componentId": "clip-analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "标签表能容纳什么？",
          "desc": "比较同一张照片在两种标签设计下的候选范围。这里演示的是分类接口，不是实际模型预测。",
          "componentId": "clip-scope"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "监督来自配对文字",
          "desc": "预训练使用互联网图文配对，WIT包含约4亿对；这不是完全没有监督。"
        },
        {
          "icon": "🔧",
          "title": "零样本针对目标任务",
          "desc": "没有用目标数据集的带标签训练集拟合，不代表预训练从未接触相关概念。"
        },
        {
          "icon": "✨",
          "title": "先学对应，再灵活比较",
          "desc": "CLIP学习图文表示与匹配能力，本身不是图片生成器或自由写描述的模型。"
        }
      ],
      "insight": "自然语言监督让模型从图文对应中学习；零样本迁移则把类别文字作为可替换的任务描述。"
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把图片和文字变成可比较的表示",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "像素数组和文字字符串不能直接算语义相似度。两个编码器各自提取特征，再把它们映射到共同的空间。",
      "analogy": {
        "title": "用相同尺寸摆放照片",
        "text": "相框尺寸一致才能并排对照，但尺寸一致不会自动使内容对应。共享维度只是比较的前提，语义对齐需要训练。",
        "componentId": "clip-analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "两种输入如何对齐？",
          "desc": "选择一条分支，观察原始特征和共享向量的区别。箭头是二维教学投影，不代表真实模型的全部坐标。",
          "componentId": "clip-embedding"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "编码器提取信息",
          "desc": "图像和文字先经过各自的编码器，形成不同类型的特征。"
        },
        {
          "icon": "🔧",
          "title": "投影统一维度",
          "desc": "图像N×dᵢ、文字N×dₜ分别线性投影为N×d；两侧原始维度不必相同。"
        },
        {
          "icon": "✨",
          "title": "归一化后比较方向",
          "desc": "对投影结果做L2归一化，使点积成为余弦相似度。来源：Figure 3。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "核心洞见：找到搭配，而非写出全文",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "同一张图片可能有多种合理描述。论文尝试逐词生成描述时学习效率较低，于是改成找出同批样本的原始配对。",
      "analogy": {
        "title": "把图签贴在对应照片下",
        "text": "一张照片能有不同的描述；先辨认哪条文字与它配对，不必逐字复写原说明。",
        "componentId": "clip-analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "在三对样本中找搭配",
          "desc": "推进教学分数矩阵，观察正确配对的概率怎样变化；绿色对角线表示原始配对。",
          "componentId": "clip-pairs"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一批同时产生很多比较",
          "desc": "N对样本产生N×N分数矩阵，只有N个位置是原始配对。"
        },
        {
          "icon": "🔧",
          "title": "负例来自同批非配对",
          "desc": "非对角线被当作候选负例，但它们可能语义相近，不一定是“错误描述”。"
        },
        {
          "icon": "✨",
          "title": "效率证据有比较条件",
          "desc": "Figure 2中词袋预测比所试描述生成基线快约3倍，改用对比目标再快约4倍；这是特定零样本学习效率实验。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "方向、相似度与温度",
      "badge": "both",
      "badgeLabel": "共同理解",
      "bridge": "找到配对需要可比较的分数。先操纵方向看余弦变化，再观察正缩放如何改变候选概率的尖锐程度。",
      "analogy": {
        "title": "让图签朝向照片",
        "text": "不同长度的图签也可以指向同一方向。CLIP先归一化特征，再用方向的接近程度作比较。",
        "componentId": "clip-analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动方向，观察概率",
          "desc": "橙色端点控制文字向量方向；缩放α相当于1/τ。右侧依次是当前文字和另外两个固定候选的概率。",
          "componentId": "clip-similarity"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "方向决定余弦",
          "desc": "单位向量的点积在−1到1之间；越同向，余弦越大。"
        },
        {
          "icon": "🔧",
          "title": "缩放不改变第一名",
          "desc": "对同一组分数乘正数不会改变argmax，但会影响softmax的集中程度。"
        },
        {
          "icon": "✨",
          "title": "概率依赖候选集合",
          "desc": "这里的概率只表示给定候选之间的相对偏好，不能直接视作现实可靠度。"
        }
      ],
      "formula": {
        "lead": "先将两侧特征归一化，再用正缩放后的点积产生候选概率。",
        "unicode": "sⱼ = α(u · vⱼ)； pⱼ = exp(sⱼ) / Σₖ exp(sₖ)",
        "symbols": [
          {
            "sym": "α",
            "desc": "正的logit缩放，α=exp(t)=1/τ；标量。固定特征时只改变概率尖锐程度。"
          },
          {
            "sym": "u",
            "desc": "一张图像的L2归一化d维向量，范数为1。"
          },
          {
            "sym": "vⱼ",
            "desc": "第j个候选文字的L2归一化d维向量，与u维度相同。"
          },
          {
            "sym": "sⱼ",
            "desc": "图像与第j个候选的缩放相似度，标量。"
          },
          {
            "sym": "pⱼ",
            "desc": "给定候选集合上的相对softmax概率，不是可靠性认证。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "提示词：把类别意思说清楚",
      "badge": "both",
      "badgeLabel": "共同理解",
      "bridge": "有了共享空间，类名就能转成向量；但单词可能多义，也未必像预训练中的完整描述。提示词为类别补充语境。",
      "analogy": {
        "title": "让标签补全语境",
        "text": "“boxer”可能是拳击手，也可能是犬种。给图签加上“宠物”的语境，才能表达要区分的概念。",
        "componentId": "clip-analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "裸类名、模板与集成",
          "desc": "选择文字方案，观察同一组ImageNet提示词消融中的相对准确率增益。",
          "componentId": "clip-prompt"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "默认模板补足语境",
          "desc": "“A photo of a {label}.”在本文ImageNet设置中比裸类名提高1.3个百分点。"
        },
        {
          "icon": "🔧",
          "title": "集成的是文本特征",
          "desc": "80个模板在嵌入空间集成，比单默认模板再提高3.5个百分点，可预先缓存类别向量。"
        },
        {
          "icon": "✨",
          "title": "提示词不是参数训练",
          "desc": "改变任务文字时无需更新模型权重；其效果仍需评估，不能保证所有任务都改善。来源：§3.1.4。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "推理：零样本和线性探针分开看",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "表示学好后，可以用文字直接定义类别，也可以用目标数据集标注训练新分类器。它们使用的信息不同，论文图表也必须分开读。",
      "analogy": {
        "title": "把新照片放入当前目录",
        "text": "可以按文字图签直接归类，也可以用已标注照片学一套新目录。前者是零样本接口，后者是监督适配。",
        "componentId": "clip-analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "一张新图如何分类？",
          "desc": "从候选文字到最终选择逐步展开。预训练模型保持固定，所有分数是教学示例。",
          "componentId": "clip-inference"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "冻结什么，训练什么？",
          "desc": "比较三种迁移协议中哪些参数可以更新，避免把线性探针理解成重新训练CLIP。",
          "componentId": "clip-probe"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "零样本由文字给出类别",
          "desc": "文本编码器把候选描述变成类别向量，与图像特征比较。"
        },
        {
          "icon": "🔧",
          "title": "线性探针训练分类头",
          "desc": "冻结图像编码器，只拟合目标任务上的线性分类器权重W和偏置b。"
        },
        {
          "icon": "✨",
          "title": "别把两种实验混在一起",
          "desc": "§3.2还比较不同预训练模型的冻结特征；不是只拿CLIP与“换头后的自己”比较。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练：双向交叉熵如何推动配对",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "推理只需比较已经学好的特征，训练则需要一个优化目标。CLIP既要求每张图找到对应文字，也要求每条文字找到对应图片。",
      "analogy": {
        "title": "减少图鉴配对错误",
        "text": "图签贴错后，反过来查照片也会查错。两个方向都检查，才能把同批配对对齐。",
        "componentId": "clip-analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "同一矩阵，两种归一化",
          "desc": "切换按行或按列，查看候选概率；推进教学分数，观察两个方向的交叉熵和平均损失。",
          "componentId": "clip-loss"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两个方向各自归一化",
          "desc": "图找文对每行做softmax；文找图对每列做softmax。目标都是原始配对位置。"
        },
        {
          "icon": "🔧",
          "title": "损失共同更新两侧",
          "desc": "双向平均交叉熵训练图像编码器、文本编码器、线性投影和可学习缩放。"
        },
        {
          "icon": "✨",
          "title": "规模与训练细节",
          "desc": "本文从头训练32个epoch，batch为32768，并用混合精度等节省成本；与小矩阵演示的规模不同。来源：§2.5。"
        }
      ],
      "formula": {
        "lead": "提高原始配对在所有候选中的概率；图找文和文找图的损失取平均。",
        "unicode": "L = (Lᵢ→ₜ + Lₜ→ᵢ) / 2<br/>Lᵢ→ₜ = −(1/N) Σᵢ log[exp(Sᵢᵢ) / Σⱼ exp(Sᵢⱼ)]",
        "symbols": [
          {
            "sym": "Lᵢ→ₜ",
            "desc": "每张图在同批N条文字中找原始配对，按行归一化的平均交叉熵。"
          },
          {
            "sym": "Lₜ→ᵢ",
            "desc": "每条文字在N张图中找原始配对，对应按列归一化的交叉熵。"
          },
          {
            "sym": "N",
            "desc": "训练批次中的图文配对数；教学例3，论文实际batch为32768。"
          },
          {
            "sym": "Sᵢᵢ",
            "desc": "原始配对的logit，即N×N分数矩阵的对角位置。"
          },
          {
            "sym": "Sᵢⱼ",
            "desc": "第i张图与第j条文字的logit，由归一化嵌入点积乘正缩放得到。"
          },
          {
            "sym": "L",
            "desc": "两个方向平均后的标量损失，用于联合优化两侧编码器、投影与缩放。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "结构：两条编码分支在哪里相遇",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "理解训练信号后再看结构：两侧独立编码，线性投影和归一化后才通过相似度相遇。结构图不代表数据在图签间搬运。",
      "analogy": {
        "title": "检查图鉴细节",
        "text": "照片和文字各有自己的查看工具，最后按共同的尺度对照。共享比较空间不表示共用同一个编码器。",
        "componentId": "clip-analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "双编码器结构可点击",
          "desc": "选择节点，观察活动路径和输出维度；也可切换本文使用的两种图像编码器家族。",
          "componentId": "clip-architecture"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "图像侧有两个家族",
          "desc": "修改ResNet使用注意力池化；ViT将patch序列送入Transformer，并有论文所述的小改动。"
        },
        {
          "icon": "🔧",
          "title": "文本侧是Transformer",
          "desc": "分词后的文字输入独立文本编码器，取[EOS]位置高层表示，归一化后投影。"
        },
        {
          "icon": "✨",
          "title": "在分数层比较",
          "desc": "训练时两个N×d单位特征矩阵生成N×N分数；这不是图文交叉注意力网络。来源：§2.4、Figure 3。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "迁移检查：鲁棒性与数据重叠",
      "badge": "both",
      "badgeLabel": "共同理解",
      "bridge": "熟悉的验证集得分不能保证换环境后也可靠。先分清两种鲁棒性，再看训练和测试重复样本如何影响总分。",
      "analogy": {
        "title": "检查图签是否只靠背景",
        "text": "换一个背景，标签还能成立吗？同时检查测试照片是否混入练习相册；这两个问题都不能只靠一项准确率回答。",
        "componentId": "clip-analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "有效鲁棒性不是域外高分",
          "desc": "切换三个教学模型，比较域内水平、域外水平，以及域内性能所预测的域外基线。",
          "componentId": "clip-robustness"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "重叠怎样影响总分？",
          "desc": "调节教学例的重复比例，观察加权平均与All−Clean差值；教学数值与论文测量分开。",
          "componentId": "clip-overlap"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "相对与有效有区别",
          "desc": "相对鲁棒性关注相对基线的域外增量；有效鲁棒性关注超出域内性能预测水平的部分。"
        },
        {
          "icon": "🔧",
          "title": "适配可能只改善熟悉环境",
          "desc": "论文ImageNet探针适配将整体准确率从76.2%提升到85.4%，但自然分布偏移上的平均准确率略降。"
        },
        {
          "icon": "✨",
          "title": "数据重叠需量化也有局限",
          "desc": "§5检测35个数据集，重叠率中位数2.2%；最大检测整体提升估计0.6个百分点，不能据此断言完全无泄漏。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、局限与类别设计的责任",
      "badge": "both",
      "badgeLabel": "共同理解",
      "bridge": "最后按实验协议回看证据。语言接口很灵活，但每项结果只支持特定条件下的结论，不能把高准确率等同于万能或公平。",
      "analogy": {
        "title": "完成图鉴验收",
        "text": "评分尺只衡量指定项目。一本图鉴的强项不代表每一页都可靠，更不保证所有用途都适当。",
        "componentId": "clip-analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "按协议查看论文结果",
          "desc": "启动比较并切换协议；每次只展示一组可解释的数据，表格保留精确值。",
          "componentId": "clip-results"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先辨认比较协议",
          "desc": "Table 1是ImageNet零样本；Figure 11是监督线性评估；Table 7是特定类别设计的偏见探针。"
        },
        {
          "icon": "🔧",
          "title": "能力仍有明显边界",
          "desc": "§6指出计数、部分细粒度、真正域外数据和数据效率等限制；开发中多次使用验证集也限制“纯零样本”解释。"
        },
        {
          "icon": "✨",
          "title": "准确率不等于公平",
          "desc": "§7研究FairFace特征上的逻辑回归和零样本模型；较高准确率不能证明部署公平，也不能支持从相貌判断行为。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1SL4y1s7LQ",
      "title": "CLIP 论文逐段精读｜跟李沐学AI",
      "reason": "原始CLIP论文逐段讲解；可结合本教程的交互回看训练、迁移和局限。",
      "views": "约38.6万播放（检索时）"
    }
  ]
};
