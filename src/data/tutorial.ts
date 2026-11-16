import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Photo-Realistic Single Image Super-Resolution Using a Generative Adversarial Network",
    "titleZh": "从像素准确到视觉真实：读懂 SRGAN",
    "venue": "CVPR 2017 · 四倍单图像超分辨率",
    "authors": "Christian Ledig、Lucas Theis、Ferenc Huszár、Jose Caballero、Andrew Cunningham 等十一位作者",
    "affiliation": "Twitter（依据所提供论文 v5 署名）",
    "domain": "计算机视觉 · 图像生成",
    "coreProblem": "逐像素误差很小，为什么照片仍然显得平滑？",
    "coreInsight": "结合 VGG 内容损失与对抗损失，在内容约束下学习更可信的自然纹理。",
    "keywords": [
      "单图像超分辨率",
      "残差网络",
      "感知损失",
      "对抗学习"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "像素误差优先：重建稳妥，却可能平均掉不确定纹理。示意画面，非模型输出。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "感知目标：内容特征与对抗约束鼓励照片质感；合理细节未必真实。示意画面。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "清晰与真实，是同一个目标吗？",
      "badge": "both",
      "badgeLabel": "问题与核心思路",
      "bridge": "Christian Ledig、Lucas Theis、Ferenc Huszár、Jose Caballero、Andrew Cunningham 等十一位作者，所提供 v5 的机构栏为 Twitter。先区分逐像素准确与视觉可信：原文据其所知，这是首个可在4×下推断照片级自然图像的框架；这一限定不表示 GAN 或感知损失的绝对首创。",
      "analogy": {
        "title": "旧照片修复 · 擦拭",
        "text": "把旧照片色差抹匀可能很稳妥，却也会抹掉砖缝；锐利不代表找回真实历史。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "一条分割线，两种修复目标",
          "desc": "拖动同一照片的分割线，比较平滑与纹理；滑块支持方向键，复位回到中点。依据论文第1页摘要、第2页图2，示意不代表真实模型对比。",
          "componentId": "compare"
        }
      ],
      "insight": "所有交互照片均为教学示意，非实际模型输出；实测结果见原文表格。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "目标有区别",
          "desc": "像素准确与照片质感衡量不同方面。"
        },
        {
          "icon": "🔎",
          "title": "限定研究范围",
          "desc": "论文讨论四倍自然图像超分辨率，贡献优先性遵循作者限定表述。"
        },
        {
          "icon": "⚠️",
          "title": "可信不等于真实",
          "desc": "清晰的合成纹理也可能是细节幻觉。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "四倍放大，为什么无法凭空找回信息？",
      "badge": "both",
      "badgeLabel": "输入表示与退化",
      "bridge": "明确目标后，先看信息从哪里丢失。低分辨率观测可对应多个高分辨率答案，扩大输出尺寸并不能消除这种歧义。",
      "analogy": {
        "title": "旧照片修复 · 对齐",
        "text": "换一个更大的相框，照片上消失的细线不会自动回来。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "缩小照片，再尝试放回去",
          "desc": "在1、2、4、8倍之间探索尺寸与采样关系。论文第4页第2节及第6页第3.1—3.2节采用四倍、三通道和双三次降采样；其余倍数仅为教学探索。",
          "componentId": "scale"
        }
      ],
      "formula": {
        "lead": "输入与输出形状",
        "unicode": "Iᴸᴿ ∈ ℝ^(W×H×C) → G(Iᴸᴿ) ∈ ℝ^(rW×rH×C)",
        "symbols": [
          {
            "sym": "W、H",
            "desc": "输入宽高"
          },
          {
            "sym": "C",
            "desc": "颜色通道数，实验为3"
          },
          {
            "sym": "r",
            "desc": "放大倍数，实验为4"
          }
        ]
      },
      "insight": "输出像素数量增加，无法证明高频信息被唯一恢复。",
      "takeaways": [
        {
          "icon": "📐",
          "title": "尺寸按比例增长",
          "desc": "宽高各乘 r，空间像素数乘 r²，通道数保持不变。"
        },
        {
          "icon": "🔬",
          "title": "实验固定四倍",
          "desc": "论文使用双三次降采样生成低分辨率训练输入。"
        },
        {
          "icon": "⚠️",
          "title": "尺寸不是信息量",
          "desc": "其他倍数为教学探索，块状示意不是论文退化实现。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "像素误差：平均答案为什么会模糊？",
      "badge": "trn",
      "badgeLabel": "关键洞察",
      "bridge": "多个答案都与低分辨率输入相容时，逐像素平方误差可能偏向它们的平均。用两条可能的线，观察准确与清晰为什么分离。",
      "analogy": {
        "title": "旧照片修复 · 描边",
        "text": "细线位置有两个可能答案，平均后可能出现两条更淡的线。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "选择一条线，或把答案平均",
          "desc": "切换候选 A、候选 B 与平均答案，核对等概率样本的期望 MSE。机制依据论文第3页图3、第5页式（4）；0.50与0.25是教学计算，不是论文测量。",
          "componentId": "average"
        }
      ],
      "formula": {
        "lead": "式（4），按空间位置数归一化；彩色像素差理解为通道向量范数",
        "unicode": "lᴿˢ_MSE = (1/r²WH) ΣₓΣᵧ ‖Iᴴᴿₓ,ᵧ − G(Iᴸᴿ)ₓ,ᵧ‖²",
        "symbols": [
          {
            "sym": "r²WH",
            "desc": "高分辨率空间位置数"
          },
          {
            "sym": "Iᴴᴿ",
            "desc": "训练参考图像"
          },
          {
            "sym": "G",
            "desc": "生成器"
          }
        ]
      },
      "insight": "在这个等概率例子中，平均降低了期望平方误差，却降低了线条对比度。",
      "takeaways": [
        {
          "icon": "➗",
          "title": "平方误差偏向均值",
          "desc": "有歧义的细节平均后可能更平滑。"
        },
        {
          "icon": "📏",
          "title": "核对归一化",
          "desc": "式（4）按高分辨率空间位置数归一化，通道差计入向量范数。"
        },
        {
          "icon": "⚠️",
          "title": "示例有条件",
          "desc": "两种真值等概率是教学假设，不能将数值当作模型评测。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "内容相似：到 VGG 特征里比较",
      "badge": "trn",
      "badgeLabel": "核心数学",
      "bridge": "像素平均可能抹平纹理，于是换一个比较空间：把参考图和生成图送入固定的 VGG19，用特征平方差约束内容。",
      "analogy": {
        "title": "旧照片修复 · 聚焦",
        "text": "修复时先核对屋檐与山体关系，不逐点对齐所有斑点；类比并非真实特征。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "切换内容损失，对照论文原图",
          "desc": "切换内容损失，比较论文图6中的真实重建图像与原图，再查看表1对应的实验结果。",
          "componentId": "features"
        }
      ],
      "formula": {
        "lead": "式（5），通道平方差包含于特征向量范数",
        "unicode": "lᴿˢ_VGG/i,j = (1/WᵢⱼHᵢⱼ) ΣₓΣᵧ ‖φᵢⱼ(Iᴴᴿ)ₓ,ᵧ − φᵢⱼ(G(Iᴸᴿ))ₓ,ᵧ‖²",
        "symbols": [
          {
            "sym": "φᵢⱼ",
            "desc": "第i次最大池化前第j个卷积ReLU后的特征"
          },
          {
            "sym": "Wᵢⱼ、Hᵢⱼ",
            "desc": "特征图空间宽高"
          }
        ]
      },
      "insight": "最终 SRGAN 使用 VGG54 内容项，但 VGG54 并非在所有数据集上都获得最高 MOS。",
      "takeaways": [
        {
          "icon": "🔍",
          "title": "在特征中比较",
          "desc": "内容损失对固定网络的特征求平方差。"
        },
        {
          "icon": "📍",
          "title": "准确定位 VGG54",
          "desc": "取第五次最大池化前第四个卷积经 ReLU 后的特征。"
        },
        {
          "icon": "⚠️",
          "title": "约束仍有边界",
          "desc": "特征相似不保证逐像素一致、纹理真实或所有数据集评分最高。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "对抗博弈：让修复结果像照片",
      "badge": "trn",
      "badgeLabel": "分布引导",
      "bridge": "内容约束之外，训练还加入可学习的真实性判断。逐步追踪 G 与 D 的更新权限，区分固定参数和保留梯度路径。",
      "analogy": {
        "title": "旧照片修复 · 比对",
        "text": "修复笔触接受真实性检查，检查标准也会更新，但不能证明细节确实存在过。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "分步看清谁在更新",
          "desc": "用上一步、下一步与重置检查预测、更新 D、固定 D、更新 G。依据论文第4页式（2）、第6页式（6）；展示更新角色，不虚构训练曲线。",
          "componentId": "game"
        }
      ],
      "formula": {
        "lead": "式（6），非饱和目标，原文按样本求和",
        "unicode": "lᴿˢ_Gen = Σₙ₌₁ᴺ −log D(G(Iᴸᴿₙ))",
        "symbols": [
          {
            "sym": "D",
            "desc": "判为真实高分辨率图像的概率"
          },
          {
            "sym": "N",
            "desc": "求和样本数；不是此式中额外取均值"
          }
        ]
      },
      "insight": "更新 G 时固定 D 参数，梯度仍通过 D 传回 G；固定参数不意味着截断梯度。",
      "takeaways": [
        {
          "icon": "🔄",
          "title": "交替更新角色",
          "desc": "更新 D 时固定 G；更新 G 时固定 D 参数并保留输入梯度。"
        },
        {
          "icon": "∑",
          "title": "目标符号要准确",
          "desc": "D 最大化真假对数目标；G 使用式（6）的非饱和负对数求和。"
        },
        {
          "icon": "⚠️",
          "title": "判断不是认证",
          "desc": "对抗约束鼓励自然纹理，不能确认细节对应真实历史。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "推理：输入一次，得到四倍结果",
      "badge": "inf",
      "badgeLabel": "推理过程",
      "bridge": "训练时的真假博弈结束后，观看照片只需要生成器的一次前向计算。本节沿内部节点核对尺寸。",
      "analogy": {
        "title": "旧照片修复 · 展开",
        "text": "展开修复照片即可观看，无需再次反复评分。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "沿一次前向计算查看尺寸",
          "desc": "逐步查看固定生成器内部的五个位置，核对两次2×如何组成4×。来源：第5页图4、第6页第3.2节。",
          "componentId": "inference"
        }
      ],
      "insight": "观察点不是多轮采样：输入一次 LR，输出一次 SR；BN 测试时不更新统计量。",
      "takeaways": [
        {
          "icon": "🔍",
          "title": "一次前向",
          "desc": "仅运行固定生成器 G。"
        },
        {
          "icon": "📐",
          "title": "宽高四倍",
          "desc": "两次2×亚像素上采样，像素数增至十六倍。"
        },
        {
          "icon": "⚠️",
          "title": "示意边界",
          "desc": "步进不是重新训练，也不运行 D 或固定 VGG19。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "感知损失：内容项与对抗项共同工作",
      "badge": "trn",
      "badgeLabel": "训练目标",
      "bridge": "推理路径确定后，回到训练：生成器如何同时获得内容约束与照片质感的信号？先亲手组合一次损失。",
      "analogy": {
        "title": "旧照片修复 · 调色",
        "text": "兼顾内容与质感需要平衡；权重本身不能保证画质。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "亲手计算一次损失组合",
          "desc": "编辑判真概率并计算内容项与对抗项；检查负号、自然对数与归一化。来源：第5页式（3）、第6页式（6）及第3.2节。",
          "componentId": "loss"
        }
      ],
      "insight": "最终 SRGAN 使用固定 VGG19 的 VGG54 内容损失；示例内容值仅为教学计算，不是论文日志。",
      "formula": {
        "lead": "式（3），最终模型的VGG54内容项与对抗项",
        "unicode": "lᴿˢ = lᴿˢ_VGG/5,4 + 10⁻³ lᴿˢ_Gen",
        "symbols": [
          {
            "sym": "lᴿˢ_VGG/5,4",
            "desc": "固定VGG19的VGG54特征内容损失"
          },
          {
            "sym": "10⁻³",
            "desc": "原文对抗项系数"
          },
          {
            "sym": "lᴿˢ_Gen",
            "desc": "生成器非饱和对抗损失"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧮",
          "title": "两项相加",
          "desc": "内容损失加上10⁻³倍生成器对抗损失。"
        },
        {
          "icon": "🔬",
          "title": "核对尺度",
          "desc": "系数意义依赖图像与VGG特征归一化。"
        },
        {
          "icon": "⚠️",
          "title": "不作画质承诺",
          "desc": "单次教学计算不能预测最终画质；概率0不能取对数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "三个网络，三种不同职责",
      "badge": "both",
      "badgeLabel": "网络结构",
      "bridge": "损失中的图像、概率和特征分别来自哪里？点选结构，先核对生成器尺寸，再区分三个网络的更新权限。",
      "analogy": {
        "title": "旧照片修复 · 加固",
        "text": "支撑板保留整体，笔触补充局部；残差数学还需在结构模块核对。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点选生成器，检查残差与尺寸",
          "desc": "点选节点或键盘按钮，同步检查高亮路径与张量形状；相加必须同形。来源：第4页第2.1节、第5页图4、第6页第3.2节。",
          "componentId": "generator"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "切换网络，核对更新权限",
          "desc": "切换 G、D 与固定 VGG19，比较输出图像、真假概率和内容特征。来源：第4页第2.1节、第5页图4。",
          "componentId": "networks"
        }
      ],
      "insight": "类似 VGG 的可训练判别器 D，与计算内容损失的固定 VGG19，职责与参数更新方式都不同。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "残差保持尺寸",
          "desc": "16个残差块含局部跳连，另有长跳连；上采样位于主干之后。"
        },
        {
          "icon": "🔬",
          "title": "核对网络",
          "desc": "D 含8层卷积，部分使用步幅降采样，另有LeakyReLU和两层全连接；固定VGG19提供内容特征。"
        },
        {
          "icon": "⚠️",
          "title": "同形才能相加",
          "desc": "残差不是把低分辨率图像直接加到四倍输出。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "稳定训练：先学重建，再学照片质感",
      "badge": "trn",
      "badgeLabel": "训练技巧",
      "bridge": "知道各网络职责后，再预测训练顺序。提交答案后，对照原文配方理解预训练和交替更新。",
      "analogy": {
        "title": "旧照片修复 · 试涂",
        "text": "先在照片边缘试涂，再补纹理；预训练不能消除全部伪影。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "先预测训练顺序，再检查配方",
          "desc": "自由切换三个训练阶段，比较网络更新、优化目标、训练次数和学习率。来源：第6页第3.1–3.2节、第8页第4节。",
          "componentId": "training"
        }
      ],
      "insight": "实验用双三次4×降采样构造训练对；一般退化描述不能替代这一具体实验设置。",
      "takeaways": [
        {
          "icon": "🧪",
          "title": "先重建再对抗",
          "desc": "先MSE预训练SRResNet，再初始化G并交替更新G与D。"
        },
        {
          "icon": "📋",
          "title": "真实配方",
          "desc": "35万ImageNet图像，HR裁块96×96，批量16，Adam β₁=0.9。"
        },
        {
          "icon": "⚠️",
          "title": "仍有训练边界",
          "desc": "超过16块的更深GAN训练更困难，预训练不能保证消除伪影。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "读懂结果：视觉评分提高，也有代价",
      "badge": "both",
      "badgeLabel": "结果与边界",
      "bridge": "训练完成后，该用什么标准验收？在同一数据集与协议内查看原文结果，再用消融检查结论能推广多远。",
      "analogy": {
        "title": "旧照片修复 · 验收",
        "text": "逐点比色与整体观感是不同评分表；欣赏、医学和取证的标准也不同。",
        "componentId": "life-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "切换评分标准，让真实结果说话",
          "desc": "切换数据集与指标，播放共享时间进度的比较，查看精确结果表和内容项消融。来源：第6页第3.1、3.3节，第7页表1，第8页表2与第4节。",
          "componentId": "results"
        }
      ],
      "insight": "BSD100 的 MOS 从2.29升至3.56，同时PSNR从27.58降至25.16 dB、SSIM从0.7620降至0.6688。感知偏好与像素保真不能互相替代。",
      "takeaways": [
        {
          "icon": "📊",
          "title": "读清评价含义",
          "desc": "PSNR、SSIM与MOS均越高越好，但衡量不同侧面。"
        },
        {
          "icon": "🔬",
          "title": "比较必须同协议",
          "desc": "4×、Y通道、裁边4像素用于像素指标；MOS由26位评分者给出1–5分。"
        },
        {
          "icon": "⚠️",
          "title": "不把纹理当事实",
          "desc": "Set5上VGG54并非MOS最高；伪影、文字与结构场景仍是边界。"
        }
      ]
    }
  ]
};
