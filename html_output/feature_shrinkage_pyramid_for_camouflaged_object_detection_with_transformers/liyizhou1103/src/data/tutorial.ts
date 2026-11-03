import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Feature Shrinkage Pyramid for Camouflaged Object Detection with Transformers",
    "titleZh": "FSPNet：从相邻线索拼出伪装目标",
    "venue": "CVPR 2023",
    "authors": "Zhou Huang、Hang Dai、Tian-Zhu Xiang、Shuo Wang、Huai-Xin Chen、Jie Qin、Huan Xiong",
    "affiliation": "四川长虹、电子科技大学、格拉斯哥大学、G42、苏黎世联邦理工学院、南京航空航天大学、MBZUAI",
    "domain": "计算机视觉 · 伪装目标检测",
    "coreProblem": "编码器已经看到了整幅图，为什么解码时仍会丢掉藏在背景里的目标？",
    "coreInsight": "一片轮廓可能只比背景多出几道纹。FSPNet 让相邻编码特征先交换线索，再逐层拼合，最终预测目标掩膜。<br/><a href=\"https://arxiv.org/abs/2303.14816\" target=\"_blank\" rel=\"noopener noreferrer\">阅读原论文与附录 ↗</a>",
    "keywords": [
      "伪装目标检测",
      "Vision Transformer",
      "局部特征增强",
      "图卷积",
      "逐层解码"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "把相差很大的纹样直接拼在一起，局部花纹容易在接缝处断开。",
      "componentId": "quilt-old"
    },
    "newMethod": {
      "desc": "先配对相邻布片，再将小块逐层拼成整幅图案。",
      "componentId": "quilt-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "相似布纹里，怎样辨出整块布？",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "同色同纹会让目标不显眼。COD 要回答每个像素是否属于目标，既要找准位置，也要保住细小边缘。",
      "analogy": {
        "componentId": "analogy-1",
        "title": "辨一块同纹布",
        "text": "把近似花纹的布块叠在底布上，一根相近的线很难看出边界；整片轮廓与局部接缝提供不同证据。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "componentId": "fsp-front-1",
          "title": "对照三类伪装场景",
          "desc": "切换小目标、遮挡和边界模糊，对照左侧输入与右侧理想可见掩膜。图形为教学示意，不是网络输出。<br/><small>Huang 等，FSPNet，图 1（目标大小、遮挡与边界差异）。</small>",
          "figure": "./images/fig1.png"
        }
      ],
      "insight": "全局上下文有助于定位，局部细节有助于描边；目标掩膜需要两类信息。",
      "takeaways": [
        {
          "icon": "🧵",
          "title": "位置和边界",
          "desc": "知道目标大致在哪儿，并不代表已经得到逐像素的完整分割。"
        },
        {
          "icon": "🪡",
          "title": "图1的证据",
          "desc": "图1给出小、大、多目标、遮挡、边界不确定五类视觉例子，是定性比较，不是分类别的准确率。"
        },
        {
          "icon": "🧩",
          "title": "保住细微线索",
          "desc": "FSPNet 用 Transformer 编码全局关系，再增强局部特征并逐级解码。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "裁方布：把图像排成 token 序列",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "全局建模之前，先弄清 ViT 的输入单位：一个图块对应一个序列位置。",
      "analogy": {
        "componentId": "analogy-2",
        "title": "裁一格，记一个位置",
        "text": "把整幅布划成不重叠的小方格，每格留一个行列记号。记号帮助找回空间位置，但并不改变方格里原有的花纹。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "componentId": "fsp-front-2",
          "title": "在图块和序列之间找同一个位置",
          "desc": "点击布面选格，或用滑块逐个查看序号；右侧展示同一位置在序列中的邻域。编号采用从0开始、逐行排列的教学约定。"
        }
      ],
      "insight": "把图块排成序列后，位置嵌入让编码器同时获得内容和位置线索。",
      "takeaways": [
        {
          "icon": "✂️",
          "title": "论文尺寸",
          "desc": "384×384 图像、不重叠的16×16图块；每边24格，共576个图像 token。"
        },
        {
          "icon": "📍",
          "title": "位置相加",
          "desc": "图块经线性映射形成 T⁰，然后加上可学习的位置嵌入 Eₚ；这里的编号不是嵌入向量本身。"
        },
        {
          "icon": "🔗",
          "title": "编码器",
          "desc": "作者采用按 DeiT 策略预训练的 ViT-Base。每个块在 MSA 和 MLP 前做层归一化，之后使用残差连接。"
        }
      ],
      "formula": {
        "lead": "序列长度来自不重叠切块；式1简写了编码计算，未在式中展开归一化与残差。",
        "unicode": "l = HW/s²；Tₚ = T⁰ + Eₚ；T = MLP(MSA(Tₚ))",
        "symbols": [
          {
            "sym": "l",
            "desc": "图像块序列长度；此处为576。"
          },
          {
            "sym": "H",
            "desc": "输入图像高度，论文设置为384像素。"
          },
          {
            "sym": "W",
            "desc": "输入图像宽度，论文设置为384像素。"
          },
          {
            "sym": "s",
            "desc": "正方形图块边长，取16像素。"
          },
          {
            "sym": "T⁰",
            "desc": "图块线性投影后的 token 表示。"
          },
          {
            "sym": "Eₚ",
            "desc": "与序列位置对应的可学习位置嵌入。"
          },
          {
            "sym": "Tₚ",
            "desc": "加上位置嵌入的输入序列。"
          },
          {
            "sym": "MSA",
            "desc": "多头自注意力，允许不同位置之间交换信息。"
          },
          {
            "sym": "MLP",
            "desc": "多层感知机，作用于各位置的表示。"
          },
          {
            "sym": "T",
            "desc": "编码输出的 token 特征序列。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "对齐布片：相邻特征怎样共同选线索？",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "编码器输出包含全局信息。NL-TEM 取相邻的编码表示，在保留差异的同时为后续关系推理准备更紧凑的线索。",
      "analogy": {
        "componentId": "analogy-3",
        "title": "把两份布样对齐",
        "text": "同一幅花纹的两份描样重叠后，用双方提供的信息选择该强调的线迹；用小框汇总强调后的结果，好比池化。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "componentId": "fsp-front-3",
          "title": "重算一次式2：先加权，再池化",
          "desc": "选一种权重分配，对比两处线迹的贡献。这里只截取两项演示 softmax 与平均池化，不代表真实网络的特征值或全部维度。<br/><small>Huang 等，FSPNet，图 3（ViT、NL-TEM 与 FSD 的连接，注意 A 区域）。</small>",
          "figure": "./images/fig3.png"
        }
      ],
      "insight": "式2得到的是池化后的特征，不是最终注意力图，也不是分割结果。",
      "takeaways": [
        {
          "icon": "🪡",
          "title": "两份特征共同参与",
          "desc": "先归一化相邻表示 T₁、T₂，再拼接得到 Tq；T₁ 还分别通过投影得到 Tk 和 Tv。"
        },
        {
          "icon": "🧮",
          "title": "两步不能互换",
          "desc": "先将投影分数做 softmax，再与 Tk 逐元素相乘，之后进行自适应平均池化以减轻后续计算。"
        },
        {
          "icon": "🕸️",
          "title": "作用范围",
          "desc": "将池化特征 T′q 与 Tk 的转置相乘，再用 softmax 归一化，得到注意力映射 Tₐ。图融合模块用它把具有相似特征的位置映射到图节点。"
        }
      ],
      "formula": {
        "lead": "图3(A)、式2：从联合表示产生权重，用它筛选一份输入的投影特征。",
        "unicode": "T′q = P(Tk ⊙ softmax(wq(Tq)))",
        "symbols": [
          {
            "sym": "T′q",
            "desc": "池化后用于后续相关性计算的特征。"
          },
          {
            "sym": "P",
            "desc": "自适应平均池化。小算例把两项平均为一项。"
          },
          {
            "sym": "Tk",
            "desc": "T₁ 经键投影得到的降维特征。"
          },
          {
            "sym": "⊙",
            "desc": "对应元素相乘，不是矩阵乘法。"
          },
          {
            "sym": "softmax",
            "desc": "把分数归一化为权重；示例只展示两个分数。"
          },
          {
            "sym": "wq",
            "desc": "作用于联合表示的可学习线性投影。"
          },
          {
            "sym": "Tq",
            "desc": "相邻编码表示 T₁ 与 T₂ 拼接得到的联合表示。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "GFM：把相似区域放到图上",
      "badge": "inf",
      "badgeLabel": "模型机制",
      "bridge": "邻近 token 已经交换过线索。现在回到一个 token 表示内部，看看彼此相似却不一定相邻的位置如何交换信息。",
      "analogy": {
        "title": "认纹样：隔着布块也能呼应",
        "text": "拼布时可把分散的同类纹样归为一组，再看这些组如何呼应。图节点代表由相似特征映射而来的区域，不是固定的像素坐标。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "选择一种纹样，追踪它对应的节点",
          "desc": "左侧是六块布样，右侧是三个区域节点。切换选择，同时观察布样与关系图；数量、连线和颜色均为教学示意。",
          "componentId": "fsp-4"
        }
      ],
      "insight": "GFM 先把像素区域投到图域，进行一次跨节点传播，再把增强量映回并加上原表示。",
      "formula": {
        "lead": "图 3(A)、式（3）–（4）。先以注意映射把值特征投到节点；图卷积与残差回投分两步完成。",
        "unicode": "T̂g = ReLU((I − A) Tg wg)；Tᴼ₁ = D(T̂g ⊗ Tₐᵀ + T₁)",
        "symbols": [
          {
            "sym": "T̂g",
            "desc": "传播后的节点表示"
          },
          {
            "sym": "ReLU",
            "desc": "逐元素激活函数"
          },
          {
            "sym": "I",
            "desc": "单位矩阵"
          },
          {
            "sym": "A",
            "desc": "图邻接矩阵，描述节点间连接"
          },
          {
            "sym": "Tg",
            "desc": "投到图域的顶点特征"
          },
          {
            "sym": "wg",
            "desc": "GCN 权重，文中大小为 16×16"
          },
          {
            "sym": "Tᴼ₁",
            "desc": "局部增强后的二维特征"
          },
          {
            "sym": "D",
            "desc": "将序列重排为二维特征图"
          },
          {
            "sym": "⊗",
            "desc": "矩阵乘法"
          },
          {
            "sym": "Tₐᵀ",
            "desc": "注意映射的转置，用于从图域映回"
          },
          {
            "sym": "T₁",
            "desc": "跳接保留的原 token 表示"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧵",
          "title": "区域成为节点",
          "desc": "注意映射把特征相似的位置投到同一顶点，区别于对每个像素单独建点。"
        },
        {
          "icon": "🔗",
          "title": "传播发生在图上",
          "desc": "单层 GCN 在顶点之间推理区域关系。示意图只用于辨别节点，不展示真实邻接权重。"
        },
        {
          "icon": "↩️",
          "title": "回投保留原线索",
          "desc": "回投后的表示与原 token 相加，再重排为供解码器使用的二维特征。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "FSD：拼布的层数怎样收缩",
      "badge": "inf",
      "badgeLabel": "模型机制",
      "bridge": "得到多层局部增强特征后，解码器要处理一个次序问题：哪些特征应该先见面？",
      "analogy": {
        "title": "两两拼接：先合邻近布片",
        "text": "先拼相邻布片，下一轮处理的便是已经拼好的片组。这里用布片张数代表特征图数量，不代表图像面积。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "逐层核对金字塔的输出数",
          "desc": "点选一个层级，查看被强调的布片数量。该图按算法 1 展示输出数，不规定奇数层的具体配对实现。<br/><small>Huang 等，FSPNet，图 2（不同解码结构的连线与层级）。</small>",
          "componentId": "fsp-5",
          "figure": "./images/fig2.png"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "图 2 的五种解码思路",
          "desc": "切换图 2（a）至（e）中的结构，比较跨层连接和反馈方向。示意图保留连接思想，不逐节点复刻网络。",
          "componentId": "fsp-5b"
        }
      ],
      "insight": "特征数逐层减少，是聚合组织方式的改变；不能据此推出图像尺寸逐步缩小。",
      "takeaways": [
        {
          "icon": "🪡",
          "title": "先处理相邻特征",
          "desc": "相邻层先交互，再逐级累积，设计目的是少丢失不显眼的线索。"
        },
        {
          "icon": "🔢",
          "title": "四层十二个 AIM",
          "desc": "四个收缩层分别输出 6、3、2、1 份特征。输入的 12 份特征不计入收缩层数。"
        },
        {
          "icon": "🧭",
          "title": "结构比较有边界",
          "desc": "图 2 对比的是解码连接方式。图形本身不能说明不同结构的精度或计算开销。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "AIM：同一条缝线通向两处",
      "badge": "inf",
      "badgeLabel": "模型机制",
      "bridge": "上一章数清了各层有多少块布；现在打开一对布块之间的 AIM，看一次融合怎样生成两条传递路径。",
      "analogy": {
        "title": "沿缝线连接：续接本行，也接下一行",
        "text": "拼好的一块布既能续在本行，又能作为下一行的材料。AIM 同样把当前聚合结果送向两个目的地；跨层一路还会改变空间尺寸。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "沿一块 AIM 追踪两条输出",
          "desc": "点选当前特征对、同层或跨层路径。线路是结构教学示意，高亮某一路不会关闭模型中的另一路。",
          "componentId": "fsp-6"
        }
      ],
      "insight": "同层路径把聚合结果继续往后传，跨层路径把同一结果再加工后送入下一收缩层。",
      "formula": {
        "lead": "图 3(B)、式（5）：以下是存在同层前驱的一般情形。每层首个 AIM 如算法 1 所示，由相邻特征对启动。",
        "unicode": "Fₚ = CBR(Cat(CBR(Cat(Fₚ₋₁, Fᵢ)), Fᵢ₋₁))；F′ᵢ = Up(CBR(Fₚ))",
        "symbols": [
          {
            "sym": "Fₚ₋₁",
            "desc": "前一个 AIM 沿本层传来的聚合特征"
          },
          {
            "sym": "Fᵢ₋₁",
            "desc": "当前相邻特征对中的另一项"
          },
          {
            "sym": "Fᵢ",
            "desc": "当前相邻特征对的一项"
          },
          {
            "sym": "Fₚ",
            "desc": "传给同层下一 AIM 的聚合结果"
          },
          {
            "sym": "F′ᵢ",
            "desc": "给下一收缩层的输出"
          },
          {
            "sym": "CBR",
            "desc": "依次执行卷积、批归一化和 ReLU"
          },
          {
            "sym": "Cat",
            "desc": "通道维拼接"
          },
          {
            "sym": "Up",
            "desc": "两倍空间上采样"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧶",
          "title": "配对还有上下文",
          "desc": "除首个 AIM 外，当前单元会接收本层先前累积的特征。"
        },
        {
          "icon": "↔️",
          "title": "水平路径续传",
          "desc": "Fₚ 直接供同层下一 AIM 继续融合，不是最终的分割概率。"
        },
        {
          "icon": "↗️",
          "title": "跨层路径上采样",
          "desc": "F′ᵢ 经 CBR 和 2× 上采样形成；空间放大与每层输出份数减少并不矛盾。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "逐层检查：四个输出怎样共同学习",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "解码器每收缩一层便给出一张侧输出。下面检查四张预测在同一份训练目标中各负多少责任。",
      "analogy": {
        "title": "逐层检查针脚",
        "text": "拼布时每层都校对同一张纸样，最后一道检查分量最大。类比中的“分量”对应损失系数。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "读出每一层的损失权重",
          "desc": "选择一张侧输出，查看它的柱高和对总损失的数值贡献。",
          "componentId": "fsp-7"
        }
      ],
      "insight": "四层都与同一真值计算 BCE；P₃ 是最终预测，权重专门定为 1。",
      "takeaways": [
        {
          "icon": "🪡",
          "title": "侧输出不是四份答案",
          "desc": "最终 AIM 的输出经 sigmoid 和上采样得到目标预测；其余层的侧输出主要提供监督。"
        },
        {
          "icon": "⚙️",
          "title": "训练配置",
          "desc": "384×384 输入，随机翻转；ViT-Base 按 DeiT 策略预训练，其余模块随机初始化。"
        },
        {
          "icon": "⏱️",
          "title": "复现条件",
          "desc": "Adam 初始学习率 10⁻⁴，每 50 轮除以 10；batch 2，200 轮。原文约 8 小时使用 8 张 V100，不等于单卡耗时。"
        }
      ],
      "formula": {
        "lead": "式（6）展开后，前三层按指数加权，最终层直接相加。",
        "unicode": "L总 = BCE(P₀,G)/16 + BCE(P₁,G)/8 + BCE(P₂,G)/4 + BCE(P₃,G)",
        "symbols": [
          {
            "sym": "P₀",
            "desc": "第一个侧输出，其 BCE 权重为 1/16。"
          },
          {
            "sym": "P₁",
            "desc": "第二个侧输出，其 BCE 权重为 1/8。"
          },
          {
            "sym": "P₂",
            "desc": "第三个侧输出，其 BCE 权重为 1/4。"
          },
          {
            "sym": "P₃",
            "desc": "最后一层的预测，其 BCE 权重为 1。"
          },
          {
            "sym": "G",
            "desc": "用于监督每个层级的目标掩膜真值。"
          },
          {
            "sym": "BCE",
            "desc": "二元交叉熵；此处不是额外的边缘损失或 IoU 损失。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "对照拼布样本：FSPNet 与 ZoomNet",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "在相同测试集上，完整的 FSPNet 与 ZoomNet 各自表现如何？表 1 比较两套系统。要判断侧输出监督本身的贡献，需要在同一模型中控制其他条件。",
      "analogy": {
        "title": "在同一把尺上量两件样本",
        "text": "读差异时先统一数据集、指标和刻度；两件样本的制作工艺仍然可以不同。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "同一坐标比较两篇工作的结果",
          "desc": "切换三个测试集和六项指标，检查两行结果的方向与差距。",
          "componentId": "fsp-8"
        }
      ],
      "insight": "在表1列出的三套测试集、六个指标上，FSPNet 这行均占优；这不等于它在每张图上更好。",
      "takeaways": [
        {
          "icon": "🔍",
          "title": "两种不同的编码器",
          "desc": "FSPNet 为按 DeiT 策略预训练的 ViT-Base；ZoomNet 是共享 ResNet-50 的多尺度架构。主表比较完整方法，并未控制骨干。"
        },
        {
          "icon": "📏",
          "title": "六把尺各有含义",
          "desc": "Sₘ 衡量结构；加权 F 与平均 F 不同，平均 E 与最大 E 也不同。仅平均绝对误差 M 越小越好。"
        },
        {
          "icon": "🧾",
          "title": "保留协议",
          "desc": "CAMO 250、COD10K 2026、NC4K 4121 张。这里照录 FSPNet 主表，不将其他论文的自适应 F 值混入比较。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "拆掉一道工序：B、D、T 分别带来什么",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "主表体现整套方法的差别。若只想判断取层、解码器或纹理模块的影响，应使用论文表2的配对行。",
      "analogy": {
        "title": "拆开同款拼布的工序",
        "text": "布料不换，仅更换一道工序，前后差异才更容易解释。若连布料也换了，便不能单独归因。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "一次改一个实验设置",
          "desc": "选择成对实验和测试集；点图跟踪加权 F，表中保留其余五项读数。",
          "componentId": "fsp-9"
        }
      ],
      "insight": "固定十二层特征和 FSD 后，加入 NL-TEM 使 COD10K 的加权 Fβ 从 0.728 升到 0.735。若问侧输出监督单独贡献了多少，附录表 4 的 x→y 同时加入了侧输出监督和同层特征交互，这个差值只能说明两项改动的合并效果。",
      "takeaways": [
        {
          "icon": "🧵",
          "title": "第一组是基线",
          "desc": "B₁、B₄、B₈、B₁₂ 使用基线解码器，由拼接、重排和上采样构成。"
        },
        {
          "icon": "🔗",
          "title": "第二组替换解码器",
          "desc": "B₄+D、B₈+D、B₁₂+D 的 FSD 分别有 2、3、4 层；判断 D 的贡献时应保持取层数不变。"
        },
        {
          "icon": "🧩",
          "title": "第三组再加纹理模块",
          "desc": "B₁₂+D 与 B₁₂+D+T 比较 NL-TEM；不能用 B₁ 和完整模型的差值代表 T 的贡献。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "检查漏缝：哪些伪装仍然难以发现",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "均值和消融能解释总体表现，不能说明每个个例。最后用补充图10讨论两类仍然困难的场景。",
      "analogy": {
        "title": "暗处检查同色针脚",
        "text": "暗光削弱可见线索；同色布即使光照充分也可能看不出边界。揭开提示才能核对细缝在哪里。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "找出不易辨认的布块",
          "desc": "在两种困难条件间切换，先目测目标，再打开人为轮廓提示。这是教学重绘。<br/><small>Huang 等，FSPNet，图 10（困难样本中的原图、标注与预测）。</small>",
          "componentId": "fsp-10",
          "figure": "./images/fig10.png"
        }
      ],
      "insight": "补充图10的定性案例支持“模型仍可能失手”；没有分组统计，就无法给出失败概率或归因比例。",
      "takeaways": [
        {
          "icon": "🌘",
          "title": "极低光照",
          "desc": "补充§7.4指出光照极低时仍难检测，不能据此声称某种补光策略已经得到验证。"
        },
        {
          "icon": "🪡",
          "title": "与背景近似",
          "desc": "目标与背景外观极相似是第二类报告的困难，不能一概归为遮挡。"
        },
        {
          "icon": "📌",
          "title": "结论范围",
          "desc": "应把主表整体提升与图10个例并列理解；动画中的轮廓是人为提示，既不是真实预测，也不是额外实验。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV15P4y137jb",
      "title": "ViT 论文逐段精读",
      "reason": "了解 FSPNet 编码器所用的图像分块、位置编码与自注意力。来自跟李沐学 AI。",
      "views": "53.2万播放"
    }
  ]
};
