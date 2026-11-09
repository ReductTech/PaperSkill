import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Modeling sRGB Camera Noise with Normalizing Flows",
    "titleZh": "用归一化流建模 sRGB 相机噪声",
    "venue": "CVPR 2022",
    "authors": "Shayan Kousha, Ali Maleky, Michael S. Brown, Marcus A. Brubaker",
    "affiliation": "约克大学 · Vector Institute · 三星多伦多 AI 中心",
    "domain": "计算机视觉 · 条件生成 · 相机噪声",
    "coreProblem": "RAW 域的噪声假设难以覆盖 ISP 处理后的 sRGB 噪声。",
    "coreInsight": "真实噪声会随<b>图像内容、相机与 ISO</b>改变。本文用可逆的条件流学习这种分布，再生成噪声训练去噪器。<br/>10 章交互导读 · 公式与实验均有原文定位 · 动画与纹理是教学示意",
    "keywords": [
      "条件噪声模型",
      "可逆变换",
      "精确似然",
      "合成数据 → 去噪"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "统一或线性方差假设难以覆盖 sRGB 中复杂的噪声变化。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "固定干净图、相机与 ISO，学习条件分布并反向采样。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "噪声，不只是撒一把高斯颗粒",
      "badge": "inf",
      "badgeLabel": "直觉与生成",
      "bridge": "只拿到 sRGB 照片时，RAW 域的噪声假设还合适吗？先看它遗漏了什么，再看本文真正要生成的对象。",
      "analogy": {
        "title": "同一枚印章，不同的纸面",
        "text": "印章的纹理会受纸面与压力影响。相机噪声也会随成像处理改变；这个比喻只解释“分布依赖条件”，不代表 ISP 的物理模型。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "比较两种噪声假设",
          "desc": "切换同一底图上的教学噪声纹理；这些图案是示意，不是论文样本或模型推理。原文依据：第 2 页图 2、第 3 页图 3。",
          "componentId": "lab-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "从像素噪声到训练对",
          "desc": "切换用途，区分噪声模型的输出与下游去噪器的输出。画面是同一纸面纹理的两种用途示意。",
          "componentId": "lab-purpose"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "问题在域",
          "desc": "ISP 中的非线性处理会改变噪声分布。"
        },
        {
          "icon": "◆",
          "title": "目标是建模",
          "desc": "本文学习条件噪声分布，不直接输出去噪图像。"
        },
        {
          "icon": "◆",
          "title": "不要混淆",
          "desc": "图中纹理用于理解；数值结论以最后的原文表格为准。"
        }
      ],
      "insight": "需要学的是“给定干净图与相机设置时，噪声怎样分布”，而不只是一个通用噪声强度。"
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "先把照片变成噪声残差",
      "badge": "inf",
      "badgeLabel": "直觉与生成",
      "bridge": "要学噪声，而不是把场景内容也学进去，就需要干净图像作参照。先从成对图像中分离出残差。",
      "analogy": {
        "title": "放大镜只检查印痕的偏差",
        "text": "放大镜在固定纸面上寻找偏差。对应到论文，我们比较同一位置的带噪值与干净值，而不是猜测整幅图的内容。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "拖动取样点，观察残差",
          "desc": "拖动橙色取样点会同时改变纸面取样位置和右侧的干净值、带噪值、残差。示例像素为教学构造；原文依据：第 3 页式 (2)、第 4 页数据处理。",
          "componentId": "lab-2"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "需要配对",
          "desc": "训练依赖已对齐的干净与带噪图像。"
        },
        {
          "icon": "◆",
          "title": "残差仍有条件",
          "desc": "减去干净图像，不代表噪声就与内容独立。"
        },
        {
          "icon": "◆",
          "title": "先去量化",
          "desc": "论文对两幅图先去量化，再计算差值。"
        }
      ],
      "formula": {
        "lead": "把带噪图与对应的干净图相减，才得到要建模的噪声。",
        "unicode": "N = Ĩ − I",
        "symbols": [
          {
            "sym": "N",
            "desc": "噪声残差；32×32×3 色彩块包含 3072 个标量维度。"
          },
          {
            "sym": "Ĩ",
            "desc": "带噪 sRGB 图像；先完成去量化。"
          },
          {
            "sym": "I",
            "desc": "对应的干净图像；同时作为后续条件输入。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "一条可逆映射，两种用法",
      "badge": "inf",
      "badgeLabel": "直觉与生成",
      "bridge": "残差分布复杂，直接写出密度很难。可逆映射让“给噪声打分”和“生成噪声”共用同一套参数。",
      "analogy": {
        "title": "橡胶转过去，还能转回来",
        "text": "一枚橡胶印章转动后可以按相反角度回到原位。这里只借用可逆性：固定条件后，正变换与逆变换必须互相还原。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "正向标准化，再反向还原",
          "desc": "逐步查看一维仿射例子。示例固定 f(n)=(n−2)/3，与论文网络权重无关。原文依据：第 3 页式 (3) 与采样说明。",
          "componentId": "lab-3"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "同维双射",
          "desc": "残差与潜变量维度相同，没有压缩成较小编码。"
        },
        {
          "icon": "◆",
          "title": "正向评估",
          "desc": "把已有噪声变成潜变量，计算其密度。"
        },
        {
          "icon": "◆",
          "title": "反向生成",
          "desc": "从标准高斯采样，再用逆映射合成噪声。"
        }
      ],
      "formula": {
        "lead": "固定干净图与相机条件，可逆映射允许双向计算。",
        "unicode": "z = f(N | I,c,g)　；　N = f⁻¹(z | I,c,g)",
        "symbols": [
          {
            "sym": "z",
            "desc": "标准高斯基分布中的潜变量，形状与 N 相同。"
          },
          {
            "sym": "f",
            "desc": "数据到基分布的可逆映射；固定条件后可求逆。"
          },
          {
            "sym": "c",
            "desc": "相机类型。"
          },
          {
            "sym": "g",
            "desc": "增益设置，即 ISO 条件。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "拉伸空间，要把密度一起改掉",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "只计算基分布的密度还不够：空间被拉伸或压缩后，同一概率质量占据的体积也变了。",
      "analogy": {
        "title": "橡胶拉长，印痕就摊薄",
        "text": "同一条橡胶被拉长后，标记之间的间距变大。密度换算也必须补偿这种尺度变化；比喻只对应体积变化，不对应真实油墨守恒。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "调节缩放，检验概率质量",
          "desc": "滑块改变教学映射 z=n/a 的尺度 a。右侧同时显示密度曲线和对应区间 [−a,a] 的概率质量；a 始终大于零。原文依据：第 3 页式 (3)。",
          "componentId": "lab-4"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "密度不是概率",
          "desc": "单点密度可以大于 1；概率是对区间积分。"
        },
        {
          "icon": "◆",
          "title": "补偿体积",
          "desc": "正向映射用 |det Df|，不能漏掉或取错方向。"
        },
        {
          "icon": "◆",
          "title": "尺度非零",
          "desc": "零缩放会丢失信息，不能作为可逆层。"
        }
      ],
      "formula": {
        "lead": "正向映射算密度时，要乘上它的局部体积变化。",
        "unicode": "log p(N | I,c,g) = log pZ(f(N)) + log |det Df(N)|",
        "symbols": [
          {
            "sym": "pZ",
            "desc": "同维标准高斯的密度；条件固定时省略 f 的条件记号。"
          },
          {
            "sym": "Df",
            "desc": "f 对残差 N 的 d×d 雅可比矩阵。"
          },
          {
            "sym": "|det Df|",
            "desc": "绝对行列式；确保方向翻转也给出非负密度。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "让模型知道相机、ISO 与内容",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "一条统一的强度曲线解释不了所有相机。本文让变换参数由相机、ISO 和干净图像共同决定。",
      "analogy": {
        "title": "选一枚适合纸面的印章",
        "text": "同样的印法遇到不同纸面会留下不同痕迹。选择匹配的工具，比假设所有纸面都一样更合理。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "切换条件，查看原文消融",
          "desc": "选项严格对应表 2 的 CCS×2 条件消融。每种配置显示同一测试协议下的 NLL 与边际 KL；图案变化仅作条件依赖的示意。",
          "componentId": "lab-5"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "CL 的条件",
          "desc": "条件线性层使用相机 c 和 ISO g。"
        },
        {
          "icon": "◆",
          "title": "耦合的条件",
          "desc": "条件仿射耦合另外使用干净图 I 和未变的一组输入。"
        },
        {
          "icon": "◆",
          "title": "区分配置",
          "desc": "完整条件的 CCS×2，不等于最后的完整模型。"
        }
      ],
      "formula": {
        "lead": "条件线性层先调整每个位置的尺度和偏移。",
        "unicode": "y = x ⊙ fs(c,g) + ft(c,g)",
        "symbols": [
          {
            "sym": "x",
            "desc": "当前层的输入，与输出 y 具有相同形状。"
          },
          {
            "sym": "fs",
            "desc": "与输入可广播匹配的非零缩放因子；条件固定后不依赖 x。"
          },
          {
            "sym": "ft",
            "desc": "对应的平移因子。"
          },
          {
            "sym": "⊙",
            "desc": "逐元素乘法；逆变换先减平移，再逐元素除以缩放。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "生成噪声，再加回干净图",
      "badge": "inf",
      "badgeLabel": "直觉与生成",
      "bridge": "打分方向已经清楚了。要制造新的训练对，就从标准高斯抽样，沿同一个映射的逆方向返回残差空间。",
      "analogy": {
        "title": "同一枚印章，留下不同印痕",
        "text": "每次按下印章，细小纹理可以不同，但工具与纸面条件保持固定。对应到生成：改变随机种子，保留 I、c、g。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "同条件下重新采样",
          "desc": "一个按钮同时更新左右两个样本：左侧为固定高斯基线，右侧为条件残差示意。共享同一组随机数，便于观察建模假设；未加载论文模型。",
          "componentId": "lab-6"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "输入条件",
          "desc": "合成时需要干净图、相机与 ISO 信息。"
        },
        {
          "icon": "◆",
          "title": "没有迭代去噪",
          "desc": "这里是逆向执行可逆层，不是扩散时间步。"
        },
        {
          "icon": "◆",
          "title": "输出训练对",
          "desc": "得到 (I, I+N) 后，才交给独立的去噪器。"
        }
      ],
      "formula": {
        "lead": "生成过程先造残差，再把它加到已知的干净图像上。",
        "unicode": "z ∼ 𝒩(0,Id)　；　N = f⁻¹(z | I,c,g)　；　Ĩ = I + N",
        "symbols": [
          {
            "sym": "Id",
            "desc": "d 维单位协方差矩阵；不是干净图 I。"
          },
          {
            "sym": "f⁻¹",
            "desc": "按正向层次的相反顺序执行各层的逆。"
          },
          {
            "sym": "Ĩ",
            "desc": "合成带噪图；本交互只示意残差，不复现完整离散成像。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练的是似然，不是像素去噪误差",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "生成路径不需要逐张匹配某个噪声样本。训练要让真实残差在条件密度下更可能出现，同时计入体积变化。",
      "analogy": {
        "title": "把印章对齐参照线",
        "text": "印章逐渐贴近参照位置，表示模型逐渐适配数据。示意移动不对应论文的真实优化轨迹。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "逐步拟合一个玩具分布",
          "desc": "教学数据仅为残差 −1、0、1，拟合均值为零的高斯尺度。按钮依次改变尺度与精确玩具 NLL；不是论文训练日志。",
          "componentId": "lab-7"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "真实训练",
          "desc": "论文使用配对 SIDD 数据、Adam 与负对数似然。"
        },
        {
          "icon": "◆",
          "title": "数据划分",
          "desc": "约每图 3000 个 32×32 块，按块随机分成 80% / 20%。"
        },
        {
          "icon": "◆",
          "title": "不是 MSE",
          "desc": "流的目标是密度拟合；DnCNN 是后续另训的模型。"
        }
      ],
      "formula": {
        "lead": "标准高斯的代价与雅可比修正都属于同一个负对数似然。",
        "unicode": "ℒ = −(1/M) Σᵢ [ log pZ(f(Nᵢ | Iᵢ,cᵢ,gᵢ)) + log |det Df(Nᵢ)| ]",
        "symbols": [
          {
            "sym": "M",
            "desc": "残差训练样本数；这里写平均 NLL，原文式 (4) 写求和。"
          },
          {
            "sym": "ℒ",
            "desc": "整个对数密度的负值；不能把雅可比项单独改成正号。"
          },
          {
            "sym": "Nᵢ",
            "desc": "第 i 个经过双图去量化后得到的残差块。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "拆开一块可逆网络",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "有了训练目标，还需要能高效求逆、计算行列式的结构。现在才展开本文的四块网络。",
      "analogy": {
        "title": "转动印章，让另一侧也接触纸面",
        "text": "同一枚印章转动后，不同区域可以参与接触。对应到结构直觉：通道混合让后续耦合看到不同组合；这不是网络的物理实现。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "选择层，查看变换与活动路径",
          "desc": "节点可点选，并配有键盘可用的按钮。展示一个流块内部结构；整网默认重复四次。张量尺寸以论文 32×32×3 图块为例。",
          "componentId": "lab-8"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "四个流块",
          "desc": "每块为 CL + 两个 CCS，CCS 又含卷积与条件耦合。"
        },
        {
          "icon": "◆",
          "title": "没有降维",
          "desc": "可逆变换保留总维度；示意不指定补充材料中的具体掩码。"
        },
        {
          "icon": "◆",
          "title": "局部易算",
          "desc": "耦合的三角雅可比让行列式可由缩放项求得。"
        }
      ],
      "formula": {
        "lead": "保留 A 组，才能从输出直接重算 B 组所需的变换参数。",
        "unicode": "yA = xA　；　yB = xB ⊙ fcs(xA | I,c,g) + fct(xA | I,c,g)",
        "symbols": [
          {
            "sym": "xA",
            "desc": "输入的一组维度；原样保留，作为参数预测的参照。"
          },
          {
            "sym": "xB",
            "desc": "与 A 不重叠的另一组维度；受仿射变换。"
          },
          {
            "sym": "fcs",
            "desc": "B 组非零缩放；log-det 是各维 log|fcs| 之和。"
          },
          {
            "sym": "fct",
            "desc": "B 组平移；求逆用 (yB−fct(yA|…)) ⊘ fcs(yA|…)。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "去量化：不要让连续密度钻空子",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "网络面对的是连续分布，sRGB 却常用 256 个整数等级。训练前需要把格点样本变成连续观测。",
      "analogy": {
        "title": "把刻度尺移到格子之间",
        "text": "刻度尺滑过相邻格子，提醒我们：整数格点只是连续范围的标记。这里不把“取整”说成可逆操作。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "比较格点与双图去量化",
          "desc": "示意将同一干净值 120 与带噪值 122 分别加独立 U[0,1) 扰动。残差扰动是两个均匀变量之差，不能误写成直接加一个均匀变量。",
          "componentId": "lab-9"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "两幅都处理",
          "desc": "论文明确要求干净图与带噪图都做去量化。"
        },
        {
          "icon": "◆",
          "title": "固定尺度",
          "desc": "图中 U[0,1) 采用原始 8-bit 强度单位作教学说明。"
        },
        {
          "icon": "◆",
          "title": "不是新模型",
          "desc": "去量化是连续流处理量化数据的训练步骤。"
        }
      ],
      "formula": {
        "lead": "独立去量化两幅图后，残差中的扰动也会随之改变。",
        "unicode": "N = (Ĩq + u₁) − (Iq + u₂),　u₁,u₂ ∼ U[0,1)",
        "symbols": [
          {
            "sym": "Ĩq, Iq",
            "desc": "8-bit 整数强度的带噪与干净值；此处采用一个量化单位的教学例子。"
          },
          {
            "sym": "u₁,u₂",
            "desc": "独立均匀扰动；差值 u₁−u₂ 呈三角形密度，范围 (−1,1)。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "读结果：拟合更好，还差多远",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "最后分别检查密度拟合、合成噪声和下游去噪。不同协议与不同方向的指标，不能混成一个“总分”。",
      "analogy": {
        "title": "把印痕放到参照旁检查",
        "text": "把一张印痕对齐参照，比较整体和局部差异。类比只提醒我们多角度评估，真正的结论来自下方原文数据。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "启动原文指标对照",
          "desc": "选择指标后开始对照。长度直接对应原始数值：NLL 与 KL 越短越好，PSNR 与 SSIM 越长越好。密度表与去噪表采用不同评估协议。",
          "componentId": "lab-10"
        }
      ],
      "takeaways": [
        {
          "icon": "◆",
          "title": "更适合 sRGB",
          "desc": "本实验中，专门的条件流优于所比较的 RAW 域模型改用方案。"
        },
        {
          "icon": "◆",
          "title": "收益有边界",
          "desc": "五种手机、软件 ISP 的 SIDD；不能据此保证未知相机或所有 ISP。"
        },
        {
          "icon": "◆",
          "title": "仍有差距",
          "desc": "ISO 3200 样本较少且出现过拟合；真实噪声训练仍更好。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1dS4y1c7xB",
      "title": "Normalizing Flow 论文导读与原理精讲",
      "reason": "补充 Glow、正逆变换与 log-det 基础；不是本文的作者报告。"
    },
    {
      "bvid": "BV1T24y1t7Ro",
      "title": "深度生成模型：Normalizing flows 标准化流",
      "reason": "补充归一化流的生成建模背景；不替代本论文阅读。"
    }
  ]
};
