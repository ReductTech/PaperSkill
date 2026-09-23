import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "GNM Head: A Generative aNthropometric Model of the human head",
    "titleZh": "GNM Head：生成式人体测量头部模型",
    "venue": "arXiv:2607.23687v2 · 2026",
    "authors": "Stylianos Ploumpis、Jan Bednarik 等 30 位作者",
    "affiliation": "Google",
    "domain": "计算机视觉 · 计算机图形学 · 三维可变形模型",
    "coreProblem": "现有公开参数化头模常只覆盖外部表面，难以为张嘴、伸舌和眼球变化提供完整的几何约束。",
    "coreInsight": "GNM 用高分辨率数据、分区线性基、专门的口腔与眼球子模型和语义采样器，把<b>完整解剖</b>与<b>细粒度可控</b>放进同一个显式三维先验。",
    "keywords": [
      "3DMM",
      "完整头部解剖",
      "PCA + LBS",
      "语义采样"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只建外壳：张嘴后缺少牙齿、舌头与精细眼球几何。",
      "componentId": "hero-comparison"
    },
    "newMethod": {
      "desc": "GNM：外表、眼球、牙齿和舌头在统一统计空间中协同。",
      "componentId": "hero-comparison"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "空壳为何不够",
      "badge": "inf",
      "badgeLabel": "推理必读",
      "bridge": "先不看公式。让同一个数字头张嘴，直接检查传统外壳遗漏了什么。",
      "analogy": {
        "title": "先看里面",
        "text": "只雕外轮廓，正面也许过关；一旦张嘴或转动眼球，<b>空壳</b>立刻暴露。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "壳体检查",
          "desc": "切换表示范围，观察口腔和眼球是否拥有独立、可控制的几何。",
          "componentId": "ch1-shell",
          "figure": "./images/figure-01.png"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "同起点张嘴对照",
          "desc": "两侧从同一中性姿态同步张嘴，只比较结构是否随动作协调。",
          "componentId": "ch1-anatomy"
        }
      ],
      "insight": "论文的关键不是把脸画得更漂亮，而是给生成与重建提供更完整、可控的三维结构先验。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题",
          "desc": "公开参数化头模常缺少口腔内部和精细眼球结构。"
        },
        {
          "icon": "🧩",
          "title": "贡献",
          "desc": "GNM 统一外表、眼球、牙齿和舌头。"
        },
        {
          "icon": "⚠️",
          "title": "边界",
          "desc": "几何完整不等于模型本身直接生成照片级外观。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "数据不是越多越好：要能看见细节",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "既然要建完整解剖，下一问就是：这些几何规律从哪里来？",
      "analogy": {
        "title": "先量准，再雕细",
        "text": "参数模型压缩的是测量规律；分辨率、覆盖范围和数据来源共同决定它能学到多细。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "采集台解剖",
          "desc": "点击采集要素，核对相机、灯光、受试者与表情样本的论文原始数字。",
          "componentId": "ch2-data"
        }
      ],
      "insight": "数据仍有盲区：头发遮挡头颅、口腔内部难直接扫描，因此论文还使用艺术家资产。",
      "takeaways": [
        {
          "icon": "📷",
          "title": "采集",
          "desc": "22 台 6144×4096 相机与 14 盏灯组成多视图系统。"
        },
        {
          "icon": "📚",
          "title": "规模",
          "desc": "约 5,000 人、约 150,000 个静态表情样本。"
        },
        {
          "icon": "🧑‍🎨",
          "title": "来源",
          "desc": "真实扫描与解剖专用艺术家数据共同构成基础。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "两组旋钮：身份与表情",
      "badge": "both",
      "badgeLabel": "核心机制",
      "bridge": "采集得到许多网格后，GNM 用低维系数控制“是谁”和“此刻怎么动”。",
      "analogy": {
        "title": "同一块泥，两类变化",
        "text": "<b>身份</b>决定是谁，<b>表情</b>决定此刻怎么动；两类偏移先加到同一模板上。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "拖动参数平面",
          "desc": "在 β/φ 二维切片上拖动橙点，把身份形状与表情变化区分开。",
          "componentId": "ch3-basis",
          "figure": "./images/figure-02.png"
        }
      ],
      "formula": {
        "lead": "绑定姿态先把模板与两类线性偏移相加。",
        "unicode": "T(β, φ) = T + Σᵢ βᵢ Iᵢ + Σⱼ φⱼ Eⱼ",
        "symbols": [
          {
            "sym": "β / φ",
            "desc": "身份系数与表情系数；页面只展示二维切片。"
          },
          {
            "sym": "I / E",
            "desc": "由数据学习的身份基与表情基位移。"
          },
          {
            "sym": "T",
            "desc": "Nᵥ×3 的模板或绑定姿态顶点。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧬",
          "title": "身份",
          "desc": "β 控制相对持久的头部形状。"
        },
        {
          "icon": "🙂",
          "title": "表情",
          "desc": "φ 控制相对瞬时的面部形变。"
        },
        {
          "icon": "🧭",
          "title": "边界",
          "desc": "二维交互只解释分工，不冒充完整高维空间。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "从绑定姿态到会转动的头",
      "badge": "both",
      "badgeLabel": "数学机制",
      "bridge": "身份和表情回答“长什么样”，关节与蒙皮继续回答“现在朝哪里”。",
      "analogy": {
        "title": "塑形之后还要摆姿势",
        "text": "绑定姿态是可变形的坯体；四个关节把它变成可转头、转眼的网格。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "四步看懂 LBS",
          "desc": "逐步点亮模板偏移、身份相关关节、四个变换和顶点加权混合。",
          "componentId": "ch4-lbs"
        }
      ],
      "formula": {
        "lead": "每个顶点由四个关节变换按蒙皮权重加权。",
        "unicode": "vᵢ = Σₖ₌₁ᴷ Wₖ,ᵢ · Xₖ · [Vᵢᴮ, 1]",
        "symbols": [
          {
            "sym": "K",
            "desc": "GNM 使用 4 个关节：头、颈、左眼、右眼。"
          },
          {
            "sym": "W",
            "desc": "艺术家设计的线性混合蒙皮权重。"
          },
          {
            "sym": "X",
            "desc": "沿运动链传播得到的关节仿射变换。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🦴",
          "title": "骨架",
          "desc": "四关节负责头颈和双眼姿态。"
        },
        {
          "icon": "⚖️",
          "title": "混合",
          "desc": "每个顶点按 W 融合多个关节变换。"
        },
        {
          "icon": "🧑‍🎨",
          "title": "来源",
          "desc": "蒙皮权重和运动链不是从扫描中自动学习。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "局部表情：张嘴不必眨眼",
      "badge": "both",
      "badgeLabel": "关键洞察",
      "bridge": "全局基容易把远处区域绑在一起；GNM 把表达能力拆到解剖区域。",
      "analogy": {
        "title": "只改该改的地方",
        "text": "局部遮罩让雕刻集中在眼周或下脸，减少不相关区域跟着乱动。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "点击区域做表情",
          "desc": "选择左眼、右眼或下脸，再切换全局假想与 GNM 局部控制。",
          "componentId": "ch5-regions",
          "figure": "./images/figure-08.png"
        }
      ],
      "insight": "分区不是硬切割：相邻掩码允许小幅重叠，并以线性方式平滑融合。",
      "formula": {
        "lead": "表达空间由不同解剖区域的子基沿分量维拼接。",
        "unicode": "E = Eˡᵉᶠᵗ ᵉʸᵉ ∥ Eʳⁱᵍʰᵗ ᵉʸᵉ ∥ Eˡᵒʷᵉʳ ᶠᵃᶜᵉ ∥ Eᵗᵒⁿᵍᵘᵉ ∥ Eᵖᵘᵖⁱˡ",
        "symbols": [
          {
            "sym": "Eʳ",
            "desc": "区域 r 的 PCA 表情位移基。"
          },
          {
            "sym": "∥",
            "desc": "沿基分量维拼接，而不是按空间做不连续切割。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "局部性",
          "desc": "控制落在目标眼周或下脸区域。"
        },
        {
          "icon": "🪞",
          "title": "对称",
          "desc": "右眼周基由左眼周基镜像得到。"
        },
        {
          "icon": "🌊",
          "title": "平滑",
          "desc": "邻界的小幅重叠避免硬边界。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "牙齿、舌头与眼球不再是贴片",
      "badge": "inf",
      "badgeLabel": "解剖子模型",
      "bridge": "局部脸部控制还不够；真正填满空壳，需要三种性质不同的内部子模型。",
      "analogy": {
        "title": "内部结构各有工具",
        "text": "牙齿、舌头、眼球的形变规律不同，不能用同一种固定贴片代替。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "解剖工作台",
          "desc": "切换牙齿、舌头与眼球，比较各自的数据来源、参数归属和有效范围。",
          "componentId": "ch6-anatomy",
          "figure": "./images/figure-09.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🦷",
          "title": "牙齿",
          "desc": "5,000 个程序化牙列形状形成身份子空间。"
        },
        {
          "icon": "👅",
          "title": "舌头",
          "desc": "约 2,500 个样本形成舌头表情子空间。"
        },
        {
          "icon": "👁️",
          "title": "眼球",
          "desc": "双球几何与一个独立瞳孔扩张系数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "从照片把模型拉回人脸",
      "badge": "trn",
      "badgeLabel": "拟合实践",
      "bridge": "有了可控模型，重建任务要把它对齐到图像地标，同时守住解剖边界。",
      "analogy": {
        "title": "对齐不是越用力越好",
        "text": "只追地标可能把表面拉穿；先验与碰撞约束让拟合保持解剖合理。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "目标函数配平",
          "desc": "调节地标约束并开关解剖碰撞保护，观察贴合度与穿插风险。",
          "componentId": "ch7-fit"
        }
      ],
      "formula": {
        "lead": "拟合把四类需求写进同一个加权能量。",
        "unicode": "Eₜₒₜₐₗ = wₗₐₙEₗₐₙ + wₚᵣᵢₒᵣEₚᵣᵢₒᵣ + wₐₙₐₜEₐₙₐₜ + wₜₑₘₚEₜₑₘₚ",
        "symbols": [
          {
            "sym": "Eₗₐₙ",
            "desc": "稠密地标重投影误差。"
          },
          {
            "sym": "Eₚᵣᵢₒᵣ / Eₐₙₐₜ",
            "desc": "系数 L2 先验与解剖碰撞惩罚。"
          },
          {
            "sym": "Eₜₑₘₚ",
            "desc": "视频序列时间平滑；单帧时权重为 0。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📍",
          "title": "观测",
          "desc": "真实图像拟合由约 600 个检测地标驱动。"
        },
        {
          "icon": "🛡️",
          "title": "约束",
          "desc": "先验与碰撞惩罚阻止异常几何。"
        },
        {
          "icon": "🎞️",
          "title": "序列",
          "desc": "时间项只在多帧拟合中启用。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "让参数旋钮说人话",
      "badge": "trn",
      "badgeLabel": "交互架构",
      "bridge": "原始 PCA 轴难以命名；语义采样器把人能理解的类别映射回 β 与 φ。",
      "analogy": {
        "title": "把统计轴换成语义旋钮",
        "text": "条件决定“微笑或惊讶”，随机潜变量保留同一类别里的自然差异。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "双 CVAE 路线图",
          "desc": "选择身份或表情分支，逐步点亮条件、64 维 z、解码器、系数与网格。",
          "componentId": "ch8-sampler"
        }
      ],
      "formula": {
        "lead": "身份和表情各有一条条件生成映射。",
        "unicode": "β = fᵢd(zᵢd, cᵢd),  φ = fₑₓₚ(zₑₓₚ, cₑₓₚ)",
        "symbols": [
          {
            "sym": "c",
            "desc": "one-hot 语义条件；身份为 2+4 类，表情为 20 类。"
          },
          {
            "sym": "z",
            "desc": "64 维标准正态潜变量，描述类内变化。"
          },
          {
            "sym": "f",
            "desc": "对应 CVAE 的条件解码器。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "可解释",
          "desc": "条件向量提供明确语义方向。"
        },
        {
          "icon": "🎲",
          "title": "多样性",
          "desc": "z 保留类别内部的随机变化。"
        },
        {
          "icon": "🏗️",
          "title": "双路",
          "desc": "身份和表情由两个独立 CVAE 处理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "训练连续、可混合的语义空间",
      "badge": "trn",
      "badgeLabel": "训练策略",
      "bridge": "有语义架构还不够，训练必须同时兼顾忠实重建与可采样、可插值。",
      "analogy": {
        "title": "既要像，也要能采样",
        "text": "重建项让输出忠实，KL 让潜空间规整；周期升温避免过早忽略随机变量。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "KL 退火与条件 mixup",
          "desc": "拖动训练步并切换周期升温/直接拉满，理解论文报告的权重日程。",
          "componentId": "ch9-training"
        }
      ],
      "insight": "论文给出这些训练设计，但没有逐项消融数字；交互只解释机制，不制造收益。",
      "formula": {
        "lead": "CVAE 同时优化系数重建与潜分布正则。",
        "unicode": "L_CVAE = L_recon + w_KL L_KL",
        "symbols": [
          {
            "sym": "L_recon",
            "desc": "L1 重建损失，用于保留尖锐几何边界。"
          },
          {
            "sym": "L_KL",
            "desc": "后验到 N(0,I) 的 KL 散度。"
          },
          {
            "sym": "w_KL",
            "desc": "前 4,000 步从 0 升到 0.05。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "重建",
          "desc": "L1 对尖锐解剖边界更稳健。"
        },
        {
          "icon": "🌀",
          "title": "采样",
          "desc": "KL 把潜变量拉向标准正态。"
        },
        {
          "icon": "🔀",
          "title": "插值",
          "desc": "Beta(0.2,0.2) 条件 mixup 训练连续混合。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "证据、适用范围与边界",
      "badge": "both",
      "badgeLabel": "结果与判断",
      "bridge": "最后不只看谁的数字小，还要核对数据、共同区域、拟合协议和单位。",
      "analogy": {
        "title": "先统一尺子，再谈胜负",
        "text": "扫描到网格距离只有连同协议一起读，才是可复核的证据；<b>越低越好</b>。",
        "componentId": "studio-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "两套协议结果赛",
          "desc": "选择留出扫描或合成单视图协议，再启动同标尺误差比较。",
          "componentId": "ch10-results",
          "figure": "./images/table-02.png"
        }
      ],
      "insight": "结论应写成“在这些协议下误差更低”，不能扩张成“GNM 在所有人脸任务上都更好”。",
      "takeaways": [
        {
          "icon": "📉",
          "title": "结果",
          "desc": "两套协议下 GNM 的平均与中位误差更低。"
        },
        {
          "icon": "🧪",
          "title": "前提",
          "desc": "共同区域、相同拟合流程和同一单位保证可比。"
        },
        {
          "icon": "⚠️",
          "title": "局限",
          "desc": "艺术家资产、粗粒度人群条件与未发布地标限制复用。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1La4y1c7Qg",
      "title": "基于 3DMM 的三维人脸重建",
      "reason": "中文课程项目，补充 3DMM 拟合直觉。",
      "views": "3998播放",
      "cover": "./images/figure-02.png"
    },
    {
      "bvid": "BV1hi421h7en",
      "title": "3D 人脸重建与 3DMM 详解",
      "reason": "系统介绍三维人脸表达与可变形模型。",
      "views": "7689播放",
      "cover": "./images/figure-01.png"
    },
    {
      "bvid": "BV1f34y1e7EK",
      "title": "变分自编码器 VAE：可视化讲明白",
      "reason": "用动画补足第 8–9 章 CVAE、潜空间与 KL 正则的直觉。",
      "views": "12.6万播放",
      "cover": "./images/figure-08.png"
    },
    {
      "bvid": "BV1695Sz8EVH",
      "title": "超写实 3D 数字人大模型 LAM 技术报告解读",
      "reason": "把 GNM 的显式几何先验放到现代可驱动数字人语境中比较。",
      "views": "9615播放",
      "cover": "./images/figure-09.png"
    }
  ]
};
