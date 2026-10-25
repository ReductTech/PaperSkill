import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "An Image is Worth 16×16 Words",
    "titleZh": "一张图像，如何成为一串词？",
    "venue": "ICLR 2021",
    "authors": "Alexey Dosovitskiy 等 12 位作者",
    "affiliation": "Google Research, Brain Team",
    "domain": "计算机视觉 · 图像分类",
    "coreProblem": "不预先规定怎样提取视觉特征，只把照片切成图块，Transformer 真能学会识图吗？",
    "coreInsight": "把照片切成图块，<b>Transformer 真能学会识图吗？</b><br/>跟着观鸟相册理解机制，再用论文结果验证。",
    "keywords": [
      "问题驱动",
      "图块与位置",
      "注意力与读出",
      "规模与迁移"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>卷积：局部连接，共享卷积核。</b>多层扩大感受野；图示为单层运算。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>自注意力：按内容建立全图联系。</b>权重随查询变化；连线仅作示意。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "照片能直接当成一句话吗？",
      "badge": "inf",
      "badgeLabel": "识图机制",
      "bridge": "照片是一整幅，模型却接收一串向量：先把它分成多大的输入单位？",
      "analogy": {
        "title": "先决定一次看多大",
        "text": "<b>每块装得越多，块数越少。</b>橙框对准同一处鸟嘴，比较三种切法。图块大小不限制后续注意力的范围。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "同一张照片，三种切法",
          "desc": "切换切法，比较图块数 N 与配对数 N²。",
          "componentId": "patches"
        }
      ],
      "insight": "图块把长得难以处理的像素序列压缩成可用的输入单位。",
      "formula": {
        "lead": "把二维照片切成等大图块，得到序列长度。",
        "unicode": "N = HW / P²",
        "symbols": [
          {
            "sym": "H、W",
            "desc": "图像高和宽，均可被 P 整除。"
          },
          {
            "sym": "P",
            "desc": "方形图块边长；/16 就表示 P=16。"
          },
          {
            "sym": "N",
            "desc": "图块数，尚未加上 CLS。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "输入单位",
          "desc": "切图块减少序列长度，并非要求把图重新拼回去。"
        },
        {
          "icon": "↔",
          "title": "粒度取舍",
          "desc": "图块更大，单位更少，细节粒度也更粗。"
        },
        {
          "icon": "？",
          "title": "下一处缺口",
          "desc": "图块还是像素，怎样成为模型能处理的表示？"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "图块怎样变成模型能读的表示？",
      "badge": "inf",
      "badgeLabel": "识图机制",
      "bridge": "图块数可控了，怎样把每块像素变成同样宽的表示？",
      "analogy": {
        "title": "同规则，同格数",
        "text": "不同内容，都写成 <b>D 格表示</b>。共享同一个投影 E，数值随内容变化；E 由训练学习。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "跟着一块图走进向量",
          "desc": "选一块图，依次查看 RGB → 展平 → 共享投影。",
          "componentId": "embedding"
        }
      ],
      "insight": "展平后通过所有图块共享的可学习线性投影。",
      "formula": {
        "lead": "每个展平图块乘同一个可学习矩阵，进入统一表示空间。",
        "unicode": "eᵢ = xₚⁱ E",
        "symbols": [
          {
            "sym": "xₚⁱ",
            "desc": "第 i 个图块，行向量长度 P²C。"
          },
          {
            "sym": "E",
            "desc": "共享投影矩阵，形状 (P²C)×D。"
          },
          {
            "sym": "eᵢ、D",
            "desc": "输出图块表示与隐藏宽度；示例 D=768。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎨",
          "title": "保留内部结构",
          "desc": "展平保留固定的像素排列，图块并非一个颜色均值。"
        },
        {
          "icon": "＝",
          "title": "共享规则",
          "desc": "所有位置使用同一个投影矩阵 E。"
        },
        {
          "icon": "📍",
          "title": "下一处缺口",
          "desc": "表示告诉模型有什么，还没有明确告诉它在哪里。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "知道有什么，等于知道在哪里吗？",
      "badge": "inf",
      "badgeLabel": "识图机制",
      "bridge": "有了内容表示，模型怎样知道它出现在什么位置？",
      "analogy": {
        "title": "内容需要有地址",
        "text": "图块相同，<b>格位不同</b>。只记内容清单不够，还要把内容与地址配对。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "交换内容，还是连地址一起移动？",
          "desc": "交换橙框图块，比较“只换内容”与“连地址一起换”。",
          "componentId": "positions"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "论文真的需要复杂的二维位置吗？",
          "desc": "先预测二维相对一维的收益，再揭示论文的五样本评估结果。",
          "componentId": "position-evidence"
        }
      ],
      "insight": "位置编码绑定内容和空间；序列重排不等于图像空间变换。",
      "formula": {
        "lead": "把内容表示和可学习位置向量相加，而不是拼接二维坐标。",
        "unicode": "zᵢ = eᵢ + pᵢ",
        "symbols": [
          {
            "sym": "eᵢ",
            "desc": "图块内容表示，D维。"
          },
          {
            "sym": "pᵢ",
            "desc": "对应序列位置的可学习 D 维向量。"
          },
          {
            "sym": "zᵢ",
            "desc": "二者相加后的 token 表示。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📌",
          "title": "位置绑定",
          "desc": "空间变化要看内容和位置的配对是否改变。"
        },
        {
          "icon": "≠",
          "title": "两种重排",
          "desc": "移动整对 token，不等于交换固定位置上的图块。"
        },
        {
          "icon": "🔎",
          "title": "下一处缺口",
          "desc": "有了内容和位置，一块翅膀应该向谁获取信息？"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "一块翅膀应该参考哪些地方？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "内容和位置都有了，一块翅膀该从哪里补充信息？",
      "analogy": {
        "text": "翅膀带着问题找线索：<b>谁能补充我的信息？</b>问题不同，参考比例可不同；线粗仅作示意。",
        "title": "带着问题去看",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "title": "从平均看，到有区别地参考",
          "componentId": "attention",
          "id": "4.1",
          "desc": "换查询，看权重与输出；再改变背景值，比较它对两种汇聚的影响。"
        }
      ],
      "insight": "注意力按查询与键的匹配程度对值做加权汇聚。",
      "takeaways": [
        {
          "icon": "？",
          "title": "查询是问题",
          "desc": "同一个值会被不同查询赋予不同参考权重。"
        },
        {
          "icon": "∑",
          "title": "汇聚是运算",
          "desc": "权重沿键维度归一化，再作用于 V。"
        },
        {
          "icon": "🧠",
          "title": "下一处缺口",
          "desc": "一套参考关系够用吗，汇聚之后还缺什么变换？"
        }
      ],
      "formula": {
        "unicode": "A = softmax(QKᵀ / √dₕ)；O = AV",
        "symbols": [
          {
            "sym": "Q、K",
            "desc": "查询和键，每头宽度 dₕ；沿每个查询对应的键维度归一化。"
          },
          {
            "sym": "V、O",
            "desc": "值及加权汇聚后的输出。"
          },
          {
            "sym": "A、dₕ",
            "desc": "注意力权重矩阵；dₕ=D/h，缩放用于控制点积尺度。"
          }
        ],
        "lead": "Q 和 K 决定参考比例，V 提供被汇聚的内容。"
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "为什么还需要多头和完整的编码块？",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "一套参考关系够吗？交换信息后，各图块还需要怎样加工？",
      "analogy": {
        "text": "同一照片，可以看纹理，也可以看轮廓。<b>多头保留不同观察，MLP 加工记录，残差保留底稿。</b>真实头的分工由训练形成。",
        "title": "同一张照片，不同观察角度",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "title": "换一个头，参考关系会怎样改变？",
          "componentId": "heads",
          "id": "5.1",
          "desc": "拖动头 B 的投影方向，比较两头的参考对象与融合结果。"
        },
        {
          "kind": "module",
          "title": "信息交换之后，还缺哪一步？",
          "componentId": "encoder",
          "id": "5.2",
          "desc": "逐步查看编码块；改动鸟嘴行，检查影响能否传到翅膀。"
        }
      ],
      "insight": "多头提供并行关系子空间，MLP和残差完成可堆叠编码块。",
      "takeaways": [
        {
          "icon": "◉",
          "title": "多头有边界",
          "desc": "多个头能形成不同关系，但职责不是预先命名的。"
        },
        {
          "icon": "⇄",
          "title": "两种混合",
          "desc": "MSA 混合 token；MLP 变换单个 token 的特征。"
        },
        {
          "icon": "🏷",
          "title": "下一处缺口",
          "desc": "编码块给出一串表示，怎样做整张图的分类？"
        }
      ],
      "formula": {
        "unicode": "z′ = MSA(LN(z)) + z；zₙₑₓₜ = MLP(LN(z′)) + z′",
        "symbols": [
          {
            "sym": "MSA",
            "desc": "多头自注意力，负责 token 间信息交换。"
          },
          {
            "sym": "MLP",
            "desc": "各位置共享的两层前馈网络，隐藏宽度通常4D。"
          },
          {
            "sym": "LN、+",
            "desc": "子层前归一化与残差相加；形状均保持 T×D。"
          }
        ],
        "lead": "完整的编码块把信息交换、逐位置处理和残差通路连在一起。"
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "怎样从一串图块得到一个类别？",
      "badge": "inf",
      "badgeLabel": "推理机制",
      "bridge": "一串图块表示已经更新，怎样得到整张图的类别？",
      "analogy": {
        "text": "局部线索汇成<b>整图记录</b>，再由分类头判断。CLS 是参与观察的记录位，还不是类别答案。",
        "title": "一张整图记录",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "title": "拿走一块内容，整图判断怎样改变？",
          "componentId": "readout",
          "id": "6.1",
          "desc": "拿走一块内容，追踪局部贡献 → CLS → 类别分数。"
        }
      ],
      "insight": "CLS充当可学习的全局读出位置，GAP是可行替代。",
      "takeaways": [
        {
          "icon": "📝",
          "title": "不是标签",
          "desc": "CLS 是可学习的读出位置，不携带真实类别答案。"
        },
        {
          "icon": "⚖",
          "title": "不是唯一",
          "desc": "适当调学习率后，平均汇聚也可行。"
        },
        {
          "icon": "📚",
          "title": "下一处缺口",
          "desc": "这些投影、位置和注意力参数从哪里学到？"
        }
      ],
      "formula": {
        "unicode": "y = LN(zᴸ₀)；s = yW + b",
        "symbols": [
          {
            "sym": "zᴸ₀",
            "desc": "L 个编码块之后的 CLS 表示。"
          },
          {
            "sym": "y",
            "desc": "归一化后的全局表示，长度 D。"
          },
          {
            "sym": "W、s",
            "desc": "微调分类头 D×K；输出 K 个类别分数。"
          }
        ],
        "lead": "最终用一个 D 维全局表示交给任务分类头。"
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "模型靠什么学会识图？",
      "badge": "trn",
      "badgeLabel": "训练与迁移",
      "bridge": "前向计算有了，参数靠什么学会识图？数据少又会怎样？",
      "analogy": {
        "title": "修订下次还会用的识鸟规则",
        "text": "核对答案后，改的是<b>给线索打分的参数</b>。下一张照片沿用新规则；推理时不提供答案。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "一张带标签照片，怎样改变参数？",
          "desc": "完成一轮训练，观察概率、损失、梯度与参数的变化。",
          "componentId": "training"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "同样是大模型，为什么数据少时反而吃亏？",
          "desc": "比较重复照片与新增搭配：哪一种能排除错误规则？再看论文结果。",
          "componentId": "data-scale"
        }
      ],
      "insight": "监督损失学习参数，而数据规模改变大模型的收益。",
      "takeaways": [
        {
          "icon": "✎",
          "title": "目标驱动",
          "desc": "主实验采用有标签的监督预训练。"
        },
        {
          "icon": "↗",
          "title": "规模有条件",
          "desc": "大模型收益取决于数据规模与训练设置。"
        },
        {
          "icon": "🗺",
          "title": "下一处缺口",
          "desc": "把局部机制放回一起，完整 ViT 长什么样？"
        }
      ],
      "formula": {
        "lead": "监督训练用真实类别对应的预测概率构造交叉熵。",
        "unicode": "ℒ = −log p(y正确 | x)",
        "symbols": [
          {
            "sym": "p",
            "desc": "教学示意中的分类概率，非真实模型输出。"
          },
          {
            "sym": "y正确",
            "desc": "训练图片的真实类别。"
          },
          {
            "sym": "ℒ",
            "desc": "损失越低越好；它不是准确率。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把前面的机制拼成完整 ViT",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "部件齐了：同一张图怎样经过完整 ViT，最终影响分类？",
      "analogy": {
        "title": "把局部观察写成完整鉴定",
        "text": "记录<b>内容与格位</b>，让局部观察相互补充，再形成<b>全图判断</b>。下面用数值把这些作用接起来。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "同一张图，怎样一步步变成类别？",
          "desc": "沿六步查看输入与输出；将鸟嘴置零，追踪变化从哪一步扩散。",
          "componentId": "architecture"
        }
      ],
      "insight": "完整架构由已解释部件组成；大小配置控制深度宽度和头数。",
      "takeaways": [
        {
          "icon": "🔗",
          "title": "机制接上了",
          "desc": "完整 ViT 由前面逐个补齐的部件构成。"
        },
        {
          "icon": "▦",
          "title": "形状可检查",
          "desc": "编码块保持 T×D；读出之后才变成 D。"
        },
        {
          "icon": "↗",
          "title": "下一处缺口",
          "desc": "已有预训练模型，怎样适应新任务和更高分辨率？"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "怎样把已有能力迁移过去？",
      "badge": "trn",
      "badgeLabel": "训练与迁移",
      "bridge": "已有识图能力，怎样适应新类别和更高分辨率？",
      "analogy": {
        "title": "看得更细，也要重新对齐格位",
        "text": "每块仍是 16×16 像素，分辨率提高后<b>格子变多</b>。位置表要按二维布局插值，CLS 位置单独保留。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "分辨率改变，哪些参数必须调整？",
          "desc": "调节分辨率，观察 token 数、位置表与任务头的变化。",
          "componentId": "transfer"
        }
      ],
      "insight": "更换任务头并微调整网；高分辨率需插值图块位置编码。",
      "takeaways": [
        {
          "icon": "🔄",
          "title": "任务适配",
          "desc": "更换分类头，并微调整个网络。"
        },
        {
          "icon": "⌖",
          "title": "空间适配",
          "desc": "二维插值图块位置表，CLS 单独保留。"
        },
        {
          "icon": "📊",
          "title": "最后的问题",
          "desc": "这些设计在论文的哪些条件下得到了结果支持？"
        }
      ],
      "formula": {
        "lead": "更高分辨率保持图块边长不变，增加的是真正参与交互的 token。",
        "unicode": "T = HW/P² + 1",
        "symbols": [
          {
            "sym": "T",
            "desc": "包括 CLS 的总序列长度。"
          },
          {
            "sym": "P",
            "desc": "图块边长固定为16；不是把图块本身放大。"
          },
          {
            "sym": "+1",
            "desc": "单独的 CLS token，其位置向量不参与图块网格插值。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "用论文结果回答开场问题",
      "badge": "both",
      "badgeLabel": "机制与证据",
      "bridge": "回到开场：论文结果能支持“Transformer 学会识图”到什么程度？",
      "analogy": {
        "title": "回到证据，再下结论",
        "text": "换题再测，同时看<b>成绩与学习花费</b>。跨任务表现、接近项和训练条件，共同决定结论。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "论文证据支持哪一种结论？",
          "desc": "读差值、波动与开销，判断四个说法是否成立。",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "移除一个机制，会发生什么？",
          "desc": "补回位置、信息交换或参数更新，检查缺失机制造成的变化。",
          "componentId": "recap"
        }
      ],
      "insight": "ViT大规模预训练可有效迁移，但收益有条件且并非各任务全胜。",
      "takeaways": [
        {
          "icon": "✓",
          "title": "开场有答案",
          "desc": "标准 Transformer 配合图块输入，在大规模监督预训练与迁移中有效。"
        },
        {
          "icon": "⚖",
          "title": "优势有条件",
          "desc": "数据、模型规模、评价协议和训练开销必须一同阅读。"
        },
        {
          "icon": "↻",
          "title": "闭环可复述",
          "desc": "从输入到学习再到证据，能够说明每个设计解决了什么问题。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV15P4y137jb",
      "title": "李沐：ViT 论文逐段精读",
      "reason": "配合原论文阅读，补充背景、实验解读与逐段推导；视频链接已由作者的论文精读目录核对。"
    }
  ]
};
