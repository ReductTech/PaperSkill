import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "QuerySplat",
    "titleZh": "解耦几何与外观，让三维重建各司其职",
    "venue": "arXiv · 2026 · v1",
    "authors": "Yinglong Li, Donghui Shen, Xiaoyu Zhang, Zhichao Ye, Hongyu Wu, Aimin Hao, Guofeng Zhang, Haomin Liu",
    "affiliation": "北京航空航天大学 · InSpatio Research · 浙江大学",
    "domain": "三维视觉 / 新视角合成",
    "coreProblem": "把场景优化的工作转移到跨场景训练后的预测网络。",
    "coreInsight": "几何需要全局空间证据，外观需要局部纹理线索。<b>QuerySplat</b> 以预训练几何先验和双分支查询，把两种需求分别建模。<br><a href=\"https://arxiv.org/abs/2608.01186\" target=\"_blank\" rel=\"noreferrer\">论文原文</a> · <a href=\"https://inspatio.github.io/querysplat/\" target=\"_blank\" rel=\"noreferrer\">作者项目页</a><br><small>QuerySplat: Decoupling Geometry and Appearance Representations in 3DGS Prediction · Yinglong Li 等<br>交互图为教学示意，非模型实测；实验图表取自论文。</small>",
    "keywords": [
      "前馈 3DGS",
      "几何先验",
      "双分支查询",
      "无需外部位姿"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "共享 query：同一表示兼顾结构与纹理，容易产生学习冲突。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "QuerySplat：几何建立空间支撑，外观继承它并补足局部细节。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一次前向，重建一个场景",
      "badge": "inf",
      "badgeLabel": "推理与基础",
      "bridge": "从几张照片得到一个能换视角观看的场景，需要先决定：为每个场景反复拟合，还是训练一个能直接预测高斯的模型？",
      "analogy": {
        "title": "印出轮廓",
        "text": "像用学会形状的模具压出模型：前期制作模具很费工，使用时却能直接成形。类比的是训练与推理的分工，不代表一次预测就没有误差。",
        "componentId": "analogy1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "一次预测与逐场景优化",
          "desc": "前馈 3DGS 在已训练的网络中一次预测高斯，再进行可微 splatting 渲染；逐场景优化则为当前场景反复调整参数。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx1\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "inference"
        }
      ],
      "insight": "把场景优化的工作转移到跨场景训练后的预测网络。",
      "takeaways": [
        {
          "icon": "01",
          "title": "训练不是免费",
          "desc": "前馈省去必要的逐场景迭代，但预训练仍需数据和算力。"
        },
        {
          "icon": "02",
          "title": "输出可以换视角",
          "desc": "输出是带空间位置和外观属性的高斯集合，而不是单张补全图片。"
        },
        {
          "icon": "03",
          "title": "不混淆两种速度",
          "desc": "场景重建耗时、渲染帧率、测试时优化开销是不同指标。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "摆脱像素网格之后，还缺什么？",
      "badge": "inf",
      "badgeLabel": "推理与基础",
      "bridge": "一次预测还不够，如何表示高斯决定了模型能把细节放到哪里。先比较射线绑定、共享查询和双分支查询。",
      "analogy": {
        "title": "贴纸不等于形状",
        "text": "贴纸可以贴得很细，但贴在偏移的模型上仍会重影。能自由塑形之后，也还需要专门保留表面纹理。",
        "componentId": "analogy2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "三种表示，同一件模型",
          "desc": "使用相同模型轮廓作概念示意，非论文模型推理或实测效果；query-based 对比特指论文讨论的 TokenGS 式共享查询。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx1\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "methods"
        }
      ],
      "insight": "空间自由度和外观清晰度是两个不同问题。",
      "takeaways": [
        {
          "icon": "01",
          "title": "pixel-aligned 的代价",
          "desc": "输出与像素、射线绑定，空间配置容易受观测误差影响。"
        },
        {
          "icon": "02",
          "title": "普通 query 的缺口",
          "desc": "自由放置高斯不等于已有可靠的几何先验与外观表示。"
        },
        {
          "icon": "03",
          "title": "不是普遍不可能定理",
          "desc": "共享表示并非数学上不能工作；此处结论由特定对照实验支持。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "几何管结构，外观管细节",
      "badge": "inf",
      "badgeLabel": "推理与基础",
      "bridge": "同一个查询要理解全局空间，也要记住细纹理。QuerySplat 把这两类证据的聚合拆开，但外观仍建立在几何 token 上。",
      "analogy": {
        "title": "轮廓确定，再描纹理",
        "text": "给模型描绘纹理时，需要知道表面已经在哪里。分工不等于彼此无关：外观分支接着几何表示继续工作。",
        "componentId": "analogy3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "双分支逐步显现",
          "desc": "开关控制教学图层的显隐，不是运行删除分支的消融模型；几何位置不随外观显隐改变。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx3\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "branches"
        }
      ],
      "insight": "按属性聚合不同证据，同时保留几何到外观的依赖。",
      "takeaways": [
        {
          "icon": "01",
          "title": "证据各有所长",
          "desc": "几何特征偏全局布局，RGB 与射线保留局部纹理和视角线索。"
        },
        {
          "icon": "02",
          "title": "分离而非断开",
          "desc": "论文以几何 token 作为外观查询基础，没有宣称两个网络完全独立。"
        },
        {
          "icon": "03",
          "title": "有对照才有支持",
          "desc": "同参数量与层数的单分支融合方案仍较弱，详见末章表 2。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "一个 3D Gaussian 的五类属性",
      "badge": "both",
      "badgeLabel": "原理与验证",
      "bridge": "双分支最终必须拼成同一个高斯。理解这五类属性，就能判断每个输出头实际在预测什么。",
      "analogy": {
        "title": "转模型，也转它的表面",
        "text": "移动、转动、拉伸改变模型占据的空间；覆盖程度与随观察方向变化的颜色改变它的外观。这里用二维投影帮助辨认属性。",
        "componentId": "analogy4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "属性分类与投影",
          "desc": "二维教学投影，不是完整 3DGS 渲染器；参数变化仅演示属性语义，不代表论文的预测结果。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx3\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "attributes"
        }
      ],
      "insight": "空间形状和渲染外观是不同但共同作用的参数组。",
      "takeaways": [
        {
          "icon": "01",
          "title": "几何三项",
          "desc": "p 是三维中心，r 是旋转四元数，s 是三维各向异性尺度。"
        },
        {
          "icon": "02",
          "title": "外观两项",
          "desc": "alpha 是不透明度；c 是球谐系数，不应把 SH 简化成固定 RGB。"
        },
        {
          "icon": "03",
          "title": "分组不是无关",
          "desc": "所有属性最终共同参与 splatting 和图像合成；opacity 在这里由外观头预测。"
        }
      ],
      "formula": {
        "lead": "高斯集合中的每个元素由空间属性与外观属性共同定义（式 1）。",
        "unicode": "gₖ = (rₖ, pₖ, sₖ, αₖ, cₖ)",
        "symbols": [
          {
            "sym": "rₖ",
            "desc": "旋转四元数，4 个分量，用于描述局部坐标轴方向。"
          },
          {
            "sym": "pₖ",
            "desc": "三维中心位置，pₖ ∈ R³。"
          },
          {
            "sym": "sₖ",
            "desc": "三维各向异性尺度，沿高斯局部三个轴控制大小。"
          },
          {
            "sym": "αₖ",
            "desc": "标量不透明度，由外观分支输出。"
          },
          {
            "sym": "cₖ",
            "desc": "SH 系数。本文用一阶 SH；4 个基函数 × RGB 三通道，即 12 个系数（维度推导）。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "VGM 给出的不止是一张深度图",
      "badge": "both",
      "badgeLabel": "原理与验证",
      "bridge": "几何分支从何获得空间知识？QuerySplat 使用冻结的 VGGT-Ω，分别利用其特征、相机和深度输出。",
      "analogy": {
        "title": "用参考尺校准模型",
        "text": "一把参考尺能提供形状和尺度线索，但不等于最终作品。VGM 先验是解码器的依据，高斯不会被永久锁死在预测深度上。",
        "componentId": "analogy5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "三类先验，各自去向",
          "desc": "VGGT-Ω 是本文使用的具体 Vision Geometric Model。它的权重全程冻结；可学习的特征混合器与高斯解码器承担适配。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx3.SSx1-2\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "prior"
        }
      ],
      "insight": "冻结的多视图几何模型同时提供特征、相机和深度先验。",
      "takeaways": [
        {
          "icon": "01",
          "title": "冻结主干",
          "desc": "保留预训练的跨视图空间先验，避免联合微调破坏相机与几何一致性。"
        },
        {
          "icon": "02",
          "title": "先验不是标签真值",
          "desc": "深度和相机是模型估计，可能带噪声与漂浮点。"
        },
        {
          "icon": "03",
          "title": "不绑定单一主干",
          "desc": "表 4 的 VGGT 替换实验得到相近质量，各指标有取舍。"
        }
      ],
      "formula": {
        "lead": "几何查询从几何记忆中聚合场景信息（式 2），随后由几何头预测位置、尺度和旋转。",
        "unicode": "Zgeo = Dgeo(Qgeo, Fgeo)",
        "symbols": [
          {
            "sym": "Zgeo",
            "desc": "解码后的几何 token，也是后续外观分支的基础查询状态。"
          },
          {
            "sym": "Dgeo",
            "desc": "几何解码器，本文采用 12 个 Transformer block。"
          },
          {
            "sym": "Qgeo",
            "desc": "可学习的场景查询；不是逐像素固定锚点。"
          },
          {
            "sym": "Fgeo",
            "desc": "冻结 VGM 输出经特征选择与可学习层混合后的几何记忆。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "没有标注相机，如何统一坐标？",
      "badge": "inf",
      "badgeLabel": "推理与基础",
      "bridge": "特征、射线和监督相机只有处于同一坐标系才能一起使用。训练时还必须防止目标视图的内容进入重建网络。",
      "analogy": {
        "title": "把两张描图纸对齐",
        "text": "两次描出的模型可能使用不同的原点、方向和尺度。利用共同的参照对齐它们，而不是把第二张纸的图案直接抄进第一张。",
        "componentId": "analogy6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "两次 VGM 前向的边界",
          "desc": "演示训练/评估相机准备；实际推理只使用输入图像。目标视图用于监督，不提供重建特征。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx3.SSx2\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "frames"
        }
      ],
      "insight": "隔离重建特征与监督相机，并通过 Sim(3) 对齐坐标。",
      "takeaways": [
        {
          "icon": "01",
          "title": "隔离目标信息",
          "desc": "全视图前向只估计相机，不能把目标图特征送入重建解码器。"
        },
        {
          "icon": "02",
          "title": "对齐解决坐标自由度",
          "desc": "Sim(3) 处理整体旋转、平移和尺度差异。"
        },
        {
          "icon": "03",
          "title": "相机仍然重要",
          "desc": "pose-free 表示不需要外部相机标注，而非脱离投影几何。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "损失函数：先站稳，再学细节",
      "badge": "trn",
      "badgeLabel": "训练与实现",
      "bridge": "位置自由也可能让高斯落到无效区域，或者过早透明。训练先提供临时支撑，再释放位置和不透明度去优化渲染。",
      "analogy": {
        "title": "临时支架适时撤去",
        "text": "塑形初期需要支架，成形后还一直紧夹着会限制修整。深度伪点云和 opacity 下限也是初期引导，不能成为永久绑带。",
        "componentId": "analogy7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "损失日程与训练阶段",
          "desc": "时间轴只显示论文报告的阶段和端点，不构造未经报告的连续损失曲线或精确退火函数。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx3\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "schedule"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "不透明度下限：惩罚什么？",
          "desc": "式 (7) 的函数演示：低于下限才有惩罚，不是把所有高斯都推向完全不透明。",
          "componentId": "opacity-floor"
        }
      ],
      "insight": "早期初始化先验应逐渐让位于图像空间重建。",
      "takeaways": [
        {
          "icon": "01",
          "title": "光度与可见性",
          "desc": "L1 对像素，SSIM 对结构，LPIPS 对感知纹理；可见性约束减少视锥外或相机后方高斯。"
        },
        {
          "icon": "02",
          "title": "只在早期扶一把",
          "desc": "深度反投影伪点云用于双向 Chamfer；opacity 下限避免早期透明失活。"
        },
        {
          "icon": "03",
          "title": "别误读损失突变",
          "desc": "附录 D 将中途升高归因于引入 LPIPS，后期下降归因于共同的 95% 样本筛选。"
        }
      ],
      "formula": {
        "lead": "训练同时考虑图像重建和可见性，早期再加入两项临时先验（式 4、5）。",
        "unicode": "L = Lphoto + λvis Lvis + βcd(t) Lcd + βα(t) Lα<br>Lphoto = L1 + λssim Lssim + λlpips Llpips",
        "symbols": [
          {
            "sym": "Lphoto",
            "desc": "图像重建损失：像素 L1、结构 SSIM 与感知 LPIPS 的加权组合。"
          },
          {
            "sym": "Lvis",
            "desc": "可见性正则，惩罚所有相关视锥外或相机后方的高斯中心。"
          },
          {
            "sym": "λvis",
            "desc": "可见性损失权重 1.0。"
          },
          {
            "sym": "βcd(t)",
            "desc": "Chamfer 正则的时间权重，初始 1.0，前 20K 迭代内退火至 0；论文未给具体连续函数。"
          },
          {
            "sym": "βα(t)",
            "desc": "opacity 下限正则的时间权重，初始 0.1，前 20K 迭代内退火至 0。"
          },
          {
            "sym": "Lcd",
            "desc": "预测中心与深度反投影伪点云之间的双向 Chamfer 距离（式 6）。"
          },
          {
            "sym": "Lα",
            "desc": "式 7 的平均对数 opacity 下限惩罚，αmin=0.1。"
          },
          {
            "sym": "λssim",
            "desc": "结构损失权重 0.2。"
          },
          {
            "sym": "λlpips",
            "desc": "感知损失权重，在 100K 后逐步增加到 0.05。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "沿双分支走一遍",
      "badge": "trn",
      "badgeLabel": "训练与实现",
      "bridge": "现在把输入、VGM、两类特征和五类属性接起来。追踪同一个场景槽位，可以看到外观分支如何继承几何 token。",
      "analogy": {
        "title": "检查形状与表面",
        "text": "用放大镜检查模型时，要分别看轮廓是否稳定、表面是否清晰。两类证据属于同一件作品，却需要不同的观察重点。",
        "componentId": "analogy8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "从输入到高斯的属性路径",
          "desc": "节点选择会高亮相关特征路径与输出组。框架使用 12 层几何解码器和 6 层外观解码器，二者宽度均为 2,048、16 个注意力头。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx3\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "architecture"
        }
      ],
      "insight": "不同记忆和查询经两个解码器汇合成一组高斯。",
      "takeaways": [
        {
          "icon": "01",
          "title": "几何读取空间记忆",
          "desc": "12 层 decoder 让不绑定像素的场景槽位聚合跨视图信息。"
        },
        {
          "icon": "02",
          "title": "外观继承几何",
          "desc": "6 层 decoder 保留几何 token 对应关系，补充纹理和方向证据。"
        },
        {
          "icon": "03",
          "title": "原图与交互互证",
          "desc": "原图用于核对完整结构，交互图用于跟踪属性路径。"
        }
      ],
      "formula": {
        "lead": "外观分支继承几何 token 的组织，再从 RGB 和射线记忆中获取局部外观证据（式 3）。",
        "unicode": "Zapp = Dapp(Zgeo, Qapp, Fapp)",
        "symbols": [
          {
            "sym": "Zapp",
            "desc": "用于预测 opacity 与 SH 的外观 token。"
          },
          {
            "sym": "Dapp",
            "desc": "外观解码器，采用 6 个 Transformer block。"
          },
          {
            "sym": "Zgeo",
            "desc": "几何解码器输出，作为外观查询的基础状态。"
          },
          {
            "sym": "Qapp",
            "desc": "额外的可学习外观查询。此公式描述依赖关系，不额外假定逐元素相加或梯度截断。"
          },
          {
            "sym": "Fapp",
            "desc": "RGB patch 与 Plücker ray embedding 构成的外观记忆。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "容量与测试时优化的取舍",
      "badge": "trn",
      "badgeLabel": "训练与实现",
      "bridge": "同一个解码器可扩展查询数量，也可在推理后优化场景特征。两者都不应该与纯前馈结果和耗时混在一起。",
      "analogy": {
        "title": "给模型留下更多空间",
        "text": "放大工作面能容纳更多形状细节，却也增加工作量。查询预算决定可生成的高斯数，不会因为照片分辨率变化而自动扩容。",
        "componentId": "analogy9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "渐进扩容的四个档位",
          "desc": "高斯总数由论文的每 query 64 个高斯相乘得到，是算术推导；不将容量增加解释为未经测量的线性质量提升。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx4.SSx1\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "capacity"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "重建时间与显存",
          "desc": "附录 C 表 14 的原始测量：硬件、查询预算和计时协议与数值一起呈现。",
          "componentId": "efficiency"
        }
      ],
      "insight": "增加query与优化特征都能适配表达能力，但有不同成本。",
      "takeaways": [
        {
          "icon": "01",
          "title": "TTO 优化谁",
          "desc": "固定 queries、decoder 和输出头，仅用输入视图损失优化提取特征。"
        },
        {
          "icon": "02",
          "title": "效率取决于条件",
          "desc": "单 H200、8,192 queries 的 4 视图前向为 0.949 秒；不能外推到任意显卡。"
        },
        {
          "icon": "03",
          "title": "应用不是新基准",
          "desc": "野外、生成视频和场景修复为定性展示；场景修复先依赖 ArtiFixer 修复视频。"
        }
      ],
      "formula": {
        "lead": "扩容时从已学习的查询初始化新查询，并加入小扰动。",
        "unicode": "q(new)[i] = q(old)[i mod Nold] + ξ",
        "symbols": [
          {
            "sym": "Nold",
            "desc": "扩容前的查询数，按索引取模循环复用旧查询。"
          },
          {
            "sym": "ξ",
            "desc": "小扰动。论文没有在此给出其分布或数值方差，因此不另行指定。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "实验支持什么，又没有支持什么？",
      "badge": "both",
      "badgeLabel": "原理与验证",
      "bridge": "架构解释需要实验支撑。先看完整模型的主表，再看缩短训练的消融；它们回答不同的问题。",
      "analogy": {
        "title": "用同一把尺评比",
        "text": "不同模型要在同一套条件下比较，轮廓与表面也未必给出相同排名。一个指标领先，不等于各方面都胜出。",
        "componentId": "analogy10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "主实验：指标与视图数",
          "desc": "表 1：DL3DV-Evaluation 插值视图，large/medium/small 三种图像间隔 split 平均，每 split 300 案例。输入短边 256，各方法按原生分辨率推理，渲染后回原分辨率计分。 <a href=\"https://arxiv.org/html/2608.01186v1#Sx3.T1\" target=\"_blank\" rel=\"noreferrer\">原文依据</a>",
          "componentId": "results"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "消融：是哪部分产生作用？",
          "desc": "三个独立对照：特征聚合、早期正则、VGM 主干。均为 150K 基础训练、4 视图插值。",
          "componentId": "ablations"
        }
      ],
      "insight": "在相同协议内比较，并承认指标分歧和适用边界。",
      "takeaways": [
        {
          "icon": "01",
          "title": "优势有条件",
          "desc": "在论文 DL3DV 插值协议下 PSNR 与 SSIM 整体突出，但 12 视图 LPIPS 存在明确取舍。"
        },
        {
          "icon": "02",
          "title": "消融不是主表",
          "desc": "表 2–4 只训练基础阶段 150K、4 视图插值，不能把其分数直接与完整模型作提升比较。"
        },
        {
          "icon": "03",
          "title": "局限与后续方向",
          "desc": "固定查询预算限制极大、复杂场景；分块重建、对齐合并与全局细化仍是未来方向。"
        }
      ]
    }
  ]
};
