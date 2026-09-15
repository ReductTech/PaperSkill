import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Geometry-Aware Representation Denoising for Robust Multi-View 3D Reconstruction",
    "titleZh": "面向鲁棒多视角三维重建的几何感知表示去噪",
    "venue": "arXiv 2605.26230 · 2026",
    "authors": "Jin Hyeon Kim, Jaeeun Lee, Claire Kim 等",
    "affiliation": "KAIST AI · 三星电子",
    "domain": "计算机视觉 / 三维重建 / 扩散模型",
    "coreProblem": "前馈三维重建模型在运动模糊等退化输入下鲁棒性不足，位姿与重建精度大幅下降。",
    "coreInsight": "在前馈重建器的几何感知特征空间（而非像素或 VAE 潜空间）里做扩散去噪，可同时恢复准确的三维几何与高清 RGB 图像。",
    "keywords": [
      "多视角三维重建",
      "几何感知去噪",
      "扩散模型",
      "运动模糊"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "先把每张模糊图单独恢复，再喂给重建模型——单视角修复丢失了跨视角一致性，VAE 潜空间又抹除了细节。",
      "figure": "./images/fig2a_pixel.png"
    },
    "pointCloud": {
      "desc": "<b>核心思想</b>：把去噪放在前馈重建器内部的<em>几何感知特征空间</em>（左：清晰原图；右：模型实际「看见」的几何特征激活热区）",
      "figure": "./images/hero_feature_block.png"
    },
    "newMethod": {
      "desc": "与论文 Teaser 一致：从退化输入恢复出<em>清晰多视角图像、稠密点云与深度图</em>，三维几何与外观同步重建（点云对比效果）",
      "figure": "./images/teaser_pointcloud.jpg"
    }
  },
  "darkroom": {
    "lead": "为了把「在特征空间里做扩散去噪」这件抽象的事讲清楚，全文贯穿一个<em>暗房冲洗</em>的比喻——把三维重建想象成「把一卷拍坏的照片重新冲成清晰的成片」。下面的对照表先把这条暗房流程和论文各章的知识点一次性对上，之后每章开头遇到比喻时，你都能自动归位。",
    "steps": [
      { "stage": "拍坏了", "metaphor": "糊掉的照片", "concept": "运动模糊等退化输入", "chapter": "§1" },
      { "stage": "素材", "metaphor": "叠放对齐的底片", "concept": "多视角特征表示（cost volume）", "chapter": "§2" },
      { "stage": "在哪修", "metaphor": "表面 / 小样 / 底片原版", "concept": "去噪空间的选择（像素 / VAE / 几何特征）", "chapter": "§3" },
      { "stage": "怎么修", "metaphor": "相纸在显影液里逐步浮现", "concept": "插值流匹配（逐步去噪）", "chapter": "§4" },
      { "stage": "修哪", "metaphor": "手电照准关键区域", "concept": "注意力对齐损失", "chapter": "§5" },
      { "stage": "设备", "metaphor": "放大机 / 显影盘 / 灯箱", "concept": "GARD 去噪器架构", "chapter": "§6" },
      { "stage": "显影", "metaphor": "一步步显影（不是一步到位）", "concept": "ODE 采样（推理）", "chapter": "§7" },
      { "stage": "时机", "metaphor": "在哪一步加修正液", "concept": "去噪器插层位置 / 解码器", "chapter": "§8" },
      { "stage": "成片", "metaphor": "冲出来的 3D 几何", "concept": "结果：位姿 + 点云重建", "chapter": "§9" },
      { "stage": "校准", "metaphor": "校准冲洗参数", "concept": "消融实验（两个组件各贡献什么）", "chapter": "§10" }
    ]
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "问题：退化让重建崩坏",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "三维重建的前提是清晰的输入，但真实拍摄里运动模糊无处不在。这一章先让你亲手感受：模糊是怎么毁掉重建的。",
      "analogy": {
        "title": "糊掉的照片",
        "text": "相机一晃，照片就糊了。真实拍摄中，运动模糊是最常见的退化之一。",
        "figure": "./images/analogy_blur_car.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "模糊强度与位姿精度的关系",
          "desc": "默认自动演示：模糊强度来回扫描，观察前馈重建模型的位姿估计精度如何一路下滑；拖动滑块可切为手动。数值来自论文 Table 1（HiRoom 基准）。",
          "componentId": "ch1mod1",
          "figure": "./images/fig1_teaser.png"
        }
      ],
      "insight": "退化会顺着前馈重建模型一路传播，最终让三维重建彻底崩坏——恢复不是可选项，而是鲁棒重建的前提。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "退化是常态",
          "desc": "前馈重建模型在干净输入下很强，但真实世界的运动模糊会让它脆弱。"
        },
        {
          "icon": "🔧",
          "title": "模糊毁掉几何",
          "desc": "运动模糊抹掉了细微纹理与边缘，跨视角对应无法可靠建立。"
        },
        {
          "icon": "✨",
          "title": "恢复是前提",
          "desc": "要鲁棒重建，必须先在某个环节把退化纠正过来。"
        }
      ],
      "nextTeaser": "下一步：退化是怎么顺着模型一路传播的？先看它「流经」的通道——特征空间。"
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "输入：多视角特征表示",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一章看到退化会毁掉重建。在动手修复之前，得先知道修复发生在哪——答案是前馈重建器内部的特征空间。",
      "analogy": {
        "title": "叠放对齐的底片",
        "text": "把同一场景的几张底片叠在一起对齐，细节互补，场景才完整。",
        "figure": "./images/analogy_film.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "点击不同视角，看特征如何编码几何",
          "desc": "前馈重建器把多视角图像编码成几何感知的特征表示。点击不同视角，观察每个视角如何贡献互补的几何信息。",
          "componentId": "ch2mod1",
          "figure": "./images/fig_attn_maps.png"
        }
      ],
      "insight": "前馈重建器内部有一个由多视角 Transformer 注意力编码出来的几何感知特征空间，这正是 GARD 要去做去噪的地方。",
      "formula": {
        "lead": "多视角编码器把输入图像映射为特征表示，这是整个去噪的载体。",
        "unicode": "z = E(I)",
        "symbols": [
          {
            "sym": "z",
            "desc": "特征表示，维度 V×N×C（V 视角数、N token 数、C 特征维度）"
          },
          {
            "sym": "E",
            "desc": "多视角编码器，由 L 层 Transformer 构成"
          },
          {
            "sym": "I",
            "desc": "输入的多视角图像"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "特征空间存在",
          "desc": "前馈重建器内部有几何感知的特征表示，不是黑盒。"
        },
        {
          "icon": "🔧",
          "title": "注意力编码几何",
          "desc": "这个特征空间是跨视角注意力编码出来的，天然带几何结构。"
        },
        {
          "icon": "✨",
          "title": "去噪的载体",
          "desc": "GARD 的扩散去噪就发生在这个特征空间里。"
        }
      ],
      "nextTeaser": "下一步：特征空间不止一种，去噪该在哪个空间做？"
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "洞察：在哪个空间去噪",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "现在我们知道有特征空间可以用。但为什么不能直接在像素空间或 VAE 潜空间去噪？这一章是论文最核心的洞察。",
      "analogy": {
        "title": "在哪里修复最有效",
        "text": "同一张画面，修表面、修小样、还是修底片原版——修错地方，细节就丢了。<span class=\"analogy-map\">对应三种去噪空间：像素空间 → VAE 潜空间 → 几何感知特征空间</span>",
        "figure": "./images/analogy_repair_levels.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "三个 cost-volume 表示的几何保真度对比",
          "desc": "对比 DA3（Ours）、DINOv2、VAE 三种特征表示在 HQ + 三档退化下的 PCK 关键点正确率。下方交互同时给出 PCK 柱状图与论文 Fig 4(a)(b) 的官方证据。可切换看几何对应可视化。",
          "componentId": "ch3mod1"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "选择正确的修复层面",
          "desc": "用摄影类比理解：修表面、修压缩小样、修底片原版，结果天差地别。上方论文 Fig 9 直观展示三个 cost volume 在多视角中的几何对应：DA3 精确对齐，VAE 完全噪声——这就是\"几何细节丢失\"在特征层的肉眼证据。下方交互给出评分条 + 说明。",
          "componentId": "ch3mod2"
        }
      ],
      "insight": "去噪的空间选错了，再强的模型也救不回丢掉的几何信息——几何感知特征空间天然保留了结构，是最优去噪域。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "像素空间缺一致性",
          "desc": "单视角逐张恢复，无法利用多视角互补信息，也无法强制跨视角一致。"
        },
        {
          "icon": "🔧",
          "title": "VAE 有信息瓶颈",
          "desc": "压缩严重的潜空间抹除细粒度结构，细节丢失拖累重建。"
        },
        {
          "icon": "✨",
          "title": "特征空间最优",
          "desc": "几何感知特征空间天然编码几何结构，是去噪的正确选择。"
        }
      ],
      "nextTeaser": "下一步：选定了特征空间，去噪的「路径」怎么走？——流匹配。"
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "数学框架：插值流匹配",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "选对了去噪空间，接下来要回答：怎么在特征空间里做去噪？GARD 用的是插值流匹配——一种从退化表示直接搬运到干净表示的扩散方式。",
      "analogy": {
        "title": "显影中的相纸",
        "text": "相纸在显影液里，图像一点点浮现——去噪也是逐步逼近。",
        "figure": "./images/analogy_developing.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动流匹配进度，看表示如何从退化走向干净",
          "desc": "流匹配学一个速度场，把退化表示沿直线路径搬运到干净表示。拖动进度 t，观察插值路径和速度场方向。",
          "componentId": "ch4mod1",
          "figure": "./images/fig3b_training.png"
        }
      ],
      "insight": "流匹配不是从纯噪声开始，而是从退化表示（加一点扰动）出发——这样保留了结构先验，去噪更有效。",
      "formula": {
        "lead": "流匹配的目标是让预测速度场逼近真值速度场（退化到干净的直线速度）。",
        "unicode": "L_flow = E[‖ v(z_t, t) − v*(z_t, t) ‖²]",
        "symbols": [
          {
            "sym": "v",
            "desc": "预测速度场，由去噪器 S_θ 输出"
          },
          {
            "sym": "v*",
            "desc": "真值速度场，等于 z_clean − z̃_deg（从退化到干净的直线）"
          },
          {
            "sym": "z_t",
            "desc": "插值表示，z_t = (1−t)·z̃_deg + t·z_clean，t∈[0,1]"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "学一个速度场",
          "desc": "流匹配学习把退化表示搬运到干净表示的速度场。"
        },
        {
          "icon": "🔧",
          "title": "从退化出发",
          "desc": "源分布是退化表示加扰动，而非纯高斯噪声，保留了结构先验。"
        },
        {
          "icon": "✨",
          "title": "直线路径",
          "desc": "插值路径 z_t 是退化到干净的直线，推理时用 ODE 积分。"
        }
      ],
      "nextTeaser": "下一步：光知道路径还不够，得告诉模型「往哪儿修」——注意力对齐。"
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "引导：注意力对齐",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "流匹配只对齐特征数值，不显式要求跨视角对应一致。GARD 用注意力对齐损失，让去噪器的注意力聚焦在几何对应的区域。",
      "analogy": {
        "title": "照亮对应区域",
        "text": "手电照准关键区域，修复才不会修错地方。",
        "componentId": "ch5ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "开启/关闭注意力对齐，看注意力图的变化",
          "desc": "切换注意力对齐开关，对比论文 Fig. 11（嵌入下方）的 (a) Before 与 (b) After 注意力对应图——并直观展示 query 在四个视角中是否找到同一对应点。",
          "componentId": "ch5mod1"
        }
      ],
      "insight": "流匹配管数值对齐，注意力对齐管几何对应——两者结合，跨视角一致性才有显式监督。",
      "formula": {
        "lead": "注意力对齐用交叉熵，让第 J 层全局注意力逼近由干净点云得到的目标对应图。",
        "unicode": "L_attn = −E[ A* · log(A^J) ]",
        "symbols": [
          {
            "sym": "A^J",
            "desc": "第 J 层全局注意力图（本文 J=9），维度 V×N×N"
          },
          {
            "sym": "A*",
            "desc": "目标对应图，由干净输入重建的点云得到，温度 T=0.01"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "对齐几何对应",
          "desc": "让注意力聚焦几何对应区域，而非虚假伪影。"
        },
        {
          "icon": "🔧",
          "title": "交叉熵监督",
          "desc": "用交叉熵损失让注意力图逼近目标对应图。"
        },
        {
          "icon": "✨",
          "title": "跨视角一致",
          "desc": "这是多视角一致性的显式监督信号。"
        }
      ],
      "nextTeaser": "下一步：两个损失都齐了，承载它们的模型长什么样？"
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "架构：GARD 去噪器",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "去噪空间定了、两个损失也清楚了。现在看承载这一切的模型长什么样：GARD 去噪器是什么结构，插在编码器第几层。",
      "analogy": {
        "title": "暗房的设备布局",
        "text": "放大机、显影盘、灯箱各司其职，流程才跑得通。",
        "figure": "./images/analogy_enlarger.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "点击架构组件，理解数据流",
          "desc": "GARD 去噪器插在多视角编码器第 18 层。点击每个组件，查看它的作用与维度信息。",
          "componentId": "ch8mod1",
          "figure": "./images/fig3_framework.png"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "帧级注意力 vs 全局注意力",
          "desc": "去噪器内部交错使用帧级注意力和全局注意力。切换两种注意力，看它们各自负责什么。",
          "componentId": "ch8mod2"
        }
      ],
      "insight": "去噪器是 DiT^DH 结构（编码器 8 层 + 宽解码器 6 层），并插入全局注意力实现多视角建模。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "插在第 18 层",
          "desc": "去噪器插在 40 层编码器的第 18 层，精修退化特征。"
        },
        {
          "icon": "🔧",
          "title": "DiT^DH + 全局注意力",
          "desc": "编码器 8 层 + 宽解码器 6 层，交错全局注意力。"
        },
        {
          "icon": "✨",
          "title": "帧级 + 全局",
          "desc": "帧级注意力管局部结构，全局注意力管跨视角一致。"
        }
      ],
      "nextTeaser": "下一步：模型训练好了，推理时怎么一步步把退化「显影」干净？"
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "推理：ODE 采样",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "去噪器模型清楚了，推理时怎么用它？用 ODE 求解器逐步积分速度场，把退化表示一步步变成恢复表示。",
      "analogy": {
        "title": "一步步显影",
        "text": "显影不是一步到位，而是分步推进，每步更清晰。",
        "componentId": "ch6ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "逐步推进 ODE 采样，看表示逐步恢复",
          "desc": "默认自动演示：采样一步步从退化走向干净，循环播放；点「下一步」可手动接管。多条虚线是可能的采样轨迹，橙色箭头是速度场方向。",
          "componentId": "ch6mod1"
        }
      ],
      "insight": "推理时用 ODE 求解器积分速度场，恢复表示随后传入编码器剩余层，完成单次前向去噪与解码。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "ODE 积分",
          "desc": "推理时用 ODE 求解器积分所学速度场，得到恢复表示。"
        },
        {
          "icon": "🔧",
          "title": "单次前向",
          "desc": "恢复表示传入编码器剩余层，再解码，无需重训骨干。"
        },
        {
          "icon": "✨",
          "title": "逐步逼近",
          "desc": "每步积分都让表示更接近干净状态。"
        }
      ],
      "nextTeaser": "下一步：几个工程细节——去噪器插在哪一层、怎么解码回像素。"
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "实用技术：插层与解码",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "模型与推理流程都清楚了，再看几个关键工程细节：去噪器插在哪一层最有效、RGB 解码器怎么工作、特征相似性如何验证 GARD 抑制退化传播。",
      "analogy": {
        "title": "修正环节的时机",
        "text": "在显影/定影/晾干的哪一步加修正液，决定了最终照片的细节保留。",
        "componentId": "ch9ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "拖动插入层位置，看特征相似度变化",
          "desc": "拖动滑块选择去噪器的插入层，观察跨层特征相似度曲线：退化表示（红）在深层下降，恢复表示（蓝）保持接近干净。",
          "componentId": "ch9mod1",
          "figure": "./images/fig8_similarity.png"
        }
      ],
      "insight": "在较早的层应用 GARD，能在退化传播前纠正特征，让恢复表示在深层保持高保真——这正是特征相似性分析证明的。",
      "formula": {
        "lead": "第 l 层的特征相似度用余弦相似度衡量恢复表示与干净表示的距离。",
        "unicode": "Sim^l = (z_res^l · z_clean^l) / (‖z_res^l‖ · ‖z_clean^l‖)",
        "symbols": [
          {
            "sym": "Sim^l",
            "desc": "第 l 层特征余弦相似度，越接近 1 越相似"
          },
          {
            "sym": "z_res^l",
            "desc": "第 l 层的恢复表示"
          },
          {
            "sym": "z_clean^l",
            "desc": "第 l 层的干净表示"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "早插层更有效",
          "desc": "在退化传播前（第 18 层）应用去噪，特征相似度更高。"
        },
        {
          "icon": "🔧",
          "title": "RGB 解码器",
          "desc": "从多尺度特征 {20,28,34,40} 恢复高清图像。"
        },
        {
          "icon": "✨",
          "title": "相似度验证",
          "desc": "恢复表示在深层保持接近干净，证明 GARD 抑制了退化传播。"
        }
      ],
      "nextTeaser": "下一步：方法讲完了，看它在位姿和点云上的实际战果。"
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "结果：全面领先与局限",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "方法讲完了，看实验结果。GARD 在五个 DA3 基准上全面领先，但也有扩散方法的固有局限。",
      "analogy": {
        "title": "3D 重建的鲁棒性",
        "text": "同样一堆模糊输入，谁能重建出更完整、更准确的 3D 几何。GARD 不是图像清晰器，而是 3D 重建的鲁棒性提升器。",
        "componentId": "ch10ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "点击开始，看 GARD 的对比结果",
          "desc": "点击「开始对比」，看 GARD 在 ETH3D 基准上如何领先基线。可切换指标（位姿 AUC30 / 重建 F-score / 图像 PSNR）。数值来自论文 Table 1/2/3。",
          "componentId": "ch10mod1",
          "figure": "./images/table1_pose.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "点云重建的定性对比",
          "desc": "GARD 恢复的点云在结构完整性和细节保留上明显优于基线方法。左列输入为退化多视角图像，右列为各方法重建的 3D 点云。",
          "componentId": "ch10mod2"
        }
      ],
      "insight": "GARD 的全面优势来自几何感知特征空间的选择——这是贯穿全文的核心洞察。局限是扩散迭代去噪在延迟敏感场景效率受限。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "全面领先",
          "desc": "GARD 在五个 DA3 基准的位姿、重建、图像恢复上均最优。"
        },
        {
          "icon": "🔧",
          "title": "洞察驱动",
          "desc": "优势来自在几何感知特征空间去噪，而非模型规模。"
        },
        {
          "icon": "✨",
          "title": "局限与未来",
          "desc": "扩散迭代慢，未来聚焦更高效去噪器与多层去噪策略。"
        }
      ],
      "nextTeaser": "下一步：全面领先到底靠哪个组件？消融实验收尾验证。"
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "消融：两个组件的贡献",
      "badge": "both",
      "badgeLabel": "验证",
      "bridge": "结果全面领先，但究竟靠哪个组件？这一章用消融实验收尾，验证流匹配与注意力对齐各自的贡献——揭示一个反直觉结论：注意力对齐必须配合插值流匹配才有效。",
      "analogy": {
        "title": "校准冲洗参数",
        "text": "冲洗参数要一项项校准，缺一不可。",
        "figure": "./images/analogy_calibrate.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "消融实验：4 配置 × 3 数据集对比",
          "desc": "切换 4 个消融配置（A/B/C/D），对照论文 Table 4(a) Pose estimation AUC30。三数据集并列柱状图直观看出 D (论文采用) 全面领先与 B 反而下降的反直觉结论。",
          "componentId": "ch7mod1"
        }
      ],
      "insight": "消融实验验证：插值流匹配提供的结构先验，让注意力对齐信号真正发挥作用——单独加对齐反而下降，两者协同才达最优。",
      "formula": {
        "lead": "总损失是流匹配损失与注意力对齐损失的加权和。",
        "unicode": "L = L_flow + λ_attn · L_attn",
        "symbols": [
          {
            "sym": "L_flow",
            "desc": "插值流匹配损失"
          },
          {
            "sym": "L_attn",
            "desc": "注意力对齐损失"
          },
          {
            "sym": "λ_attn",
            "desc": "对齐损失系数，本文设为 1.0"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "联合优化",
          "desc": "流匹配与注意力对齐两个损失加权求和，共同训练。"
        },
        {
          "icon": "🔧",
          "title": "协同才有效",
          "desc": "注意力对齐单独配合标准流匹配无效，配合插值流匹配才提升。"
        },
        {
          "icon": "✨",
          "title": "结构先验关键",
          "desc": "从退化出发的结构先验，让几何对应学习更有效。"
        }
      ],
      "nextTeaser": "恭喜看完！可回到目录重温任何一章。"
    },]
};
