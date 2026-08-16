import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "HY-World 2.0: A Multi-Modal World Model for Reconstructing, Generating, and Simulating 3D Worlds",
    "titleZh": "HY-World 2.0：用于重建、生成与模拟三维世界的多模态世界模型",
    "venue": "arXiv 2604.14268v1 · 2026",
    "authors": "Team HY-World",
    "affiliation": "Tencent Hunyuan",
    "domain": "三维世界模型 · 视频扩散 · 前馈三维重建 · 3D Gaussian Splatting",
    "coreProblem": "开源三维世界系统往往在“从稀疏线索生成未见空间”和“从充分观察准确恢复几何”之间二选一。",
    "coreInsight": "HY-World 2.0 根据输入丰富度切换生成或重建目标，并用<b>全景初始化、场景感知轨迹、记忆驱动关键帧扩展、前馈重建与 3DGS 合成</b>连接两条路径。",
    "keywords": [
      "多模态输入",
      "四阶段管线",
      "空间摄影勘景",
      "证据驱动交互"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "生成模型善于想象，却容易偏离几何；重建模型忠于观察，却无法补出未见区域。",
      componentId: "hy-hero"
    },
    "newMethod": {
      "desc": "同一框架按输入条件切换目标，并让重建能力反过来支撑生成世界的几何合成。",
      componentId: "hy-hero"
    }
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "先理解世界模型：一套系统，两种任务",
      "badge": "inf",
      "badgeLabel": "推理必读",
      "bridge": "先建立概念坐标：世界模型不等于普通视频生成器。它要表示环境状态，并支持预测、生成、重建或模拟；HY-World 2.0 选择的是离线显式三维路线。",
      "analogy": {
        "title": "同一台相机，不同的拍摄任务",
        "text": "线索稀少时，需要<b>补出未见区域</b>；观察充分时，重点变成<b>恢复真实空间关系</b>。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.0",
          "title": "世界模型概念实验室",
          "desc": "切换四种世界建模范式，再用遮挡、回访和动作三项压力测试，比较它们如何处理未见区域、状态持久性、显式资产与反馈闭环。",
          componentId: "hy-world-model-basics"
        },
        {
          kind: "module",
          "id": "1.1",
          "title": "四任务共享路径总图",
          "desc": "在同一张系统大图中比较文本、单图、多视图与视频四种输入。点击任务卡切换生成或重建路径，当前经过的模块与共享输出被高亮，其余模块灰显。",
          componentId: "hy-mission-planner"
        },
        {
          kind: "module",
          "id": "1.2",
          "title": "统一系统边界透视台",
          "desc": "逐条展开五个证据切片，让系统大图只高亮当前关系；直接区分三条论文支持的关系与“单体网络”“实时生成”两类常见误读，无需连续答题。",
          componentId: "hy-boundary-compare",
          "figure": "/images/figure-2-architecture.png"
        }
      ],
      "insight": "世界模型是一个任务家族而不是单一输出格式；HY-World 2.0 的核心选择是把生成与重建接到可持久保存、可运行的显式三维资产上。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先辨范式",
          "desc": "像素视频、动作条件世界与显式三维资产回答的问题不同。"
        },
        {
          "icon": "🔧",
          "title": "再看输入",
          "desc": "文本或单图用于生成，多视图或视频用于重建。"
        },
        {
          "icon": "⚠️",
          "title": "离线系统",
          "desc": "完整世界生成耗时以分钟计，不能称为实时生成。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "从局部照片到完整全景",
      "badge": "inf",
      "badgeLabel": "推理必读",
      "bridge": "确定生成任务后，第一步不是立刻建模整个三维世界，而是先获得具有全局上下文的 360 度初始化。",
      "analogy": {
        "title": "转一圈，先把房间看完整",
        "text": "全景不是普通照片的拉宽版，它要让左右边界重新接上，并为后续勘景提供<b>全局上下文</b>。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "全景故障取证台",
          "desc": "检查相机元数据、潜空间边界和解码后像素三类故障，为每个症状匹配正确机制，并用论文表 4 核查完整系统结果。",
          componentId: "hy-panorama"
        },
        {
          kind: "module",
          "id": "2.2",
          "title": "全景数据策展暗房",
          "desc": "检查六张真实拍摄或 UE 合成教学样本，保留能扩展训练分布的高质量数据，并剔除明显接缝与拍摄设备污染。",
          componentId: "hy-panorama-curation"
        }
      ],
      "insight": "HY-Pano 2.0 同时升级数据与模型：用真实 / 合成双源数据扩展分布并过滤明显污染，再以隐式映射降低相机元数据依赖、以双层修复处理 ERP 环形边界。",
      "takeaways": [
        {
          "icon": "🌀",
          "title": "双源策展",
          "desc": "真实质感与合成标签互补，明显接缝和设备入镜需要过滤。"
        },
        {
          "icon": "🧠",
          "title": "隐式映射",
          "desc": "MMDiT 在统一潜空间学习透视图到 ERP 的对应。"
        },
        {
          "icon": "🪡",
          "title": "接缝修复",
          "desc": "循环填充与像素融合共同平滑左右边界。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "WorldNav：把视角花在盲区上",
      "badge": "inf",
      "badgeLabel": "推理必读",
      "bridge": "有了全景仍然只站在一个中心点。下一步必须决定相机去哪儿，才能看到物体背面、远端走廊和俯视区域。",
      "analogy": {
        "title": "不是多走，而是走到看不见的地方",
        "text": "好的勘景路线既要覆盖盲区，也要避开墙体和障碍。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "盲区勘景任务台",
          "desc": "先指定物体背面、走廊远端或俯视盲区，再从五类 WorldNav 路线中组合最多两类策略，比较覆盖目标、执行条件与互补性。",
          componentId: "hy-trajectory"
        }
      ],
      "insight": "五类路线是互补的启发式策略，而不是一个端到端学习的最优策略。",
      "takeaways": [
        {
          "icon": "🗺️",
          "title": "先解析场景",
          "desc": "点云、语义掩码和 NavMesh 提供规划约束。"
        },
        {
          "icon": "👁️",
          "title": "互补视角",
          "desc": "不同路线针对物体背面、远端和俯视盲区。"
        },
        {
          "icon": "🧱",
          "title": "不是任意飞行",
          "desc": "路线生成始终结合碰撞检测与可导航区域。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "关键帧潜空间：少而清晰的观察",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "路线已经确定，但普通视频潜空间会把大量相近帧一起做时空压缩，快速视角变化时容易损伤几何和细节。",
      "analogy": {
        "title": "少拍几张，但每张都要站得住",
        "text": "关键帧跨越更大的视角变化，避免把大量重复帧一起压缩。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "关键帧取景谜题",
          "desc": "从同一条快速转弯轨迹的 8 个候选视角中选择 3 帧，检查相邻重复、首尾跨度与 Keyframe-VAE 的保真逻辑，再阅读论文相机误差证据。",
          componentId: "hy-keyframes"
        }
      ],
      "insight": "关键帧保真度与选择性冻结共同形成视觉质量、相机精度和泛化之间的平衡。",
      "formula": {
        "lead": "目标视角中的点由参考深度与相机参数变换而来。",
        "unicode": "P_target(x) ≈ R_c→w D(x) K⁻¹ x̂",
        "symbols": [
          {
            "sym": "P_target(x)",
            "desc": "像素 x 在目标视角对应的三维点。"
          },
          {
            "sym": "R_c→w",
            "desc": "目标相机到世界坐标的旋转。"
          },
          {
            "sym": "D(x)",
            "desc": "参考图像的单目深度估计。"
          },
          {
            "sym": "K",
            "desc": "目标视角相机内参矩阵。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎞️",
          "title": "关键帧优先",
          "desc": "去除时间压缩以保存高频外观和几何。"
        },
        {
          "icon": "📐",
          "title": "双重相机引导",
          "desc": "Plücker 射线与点云提供互补控制。"
        },
        {
          "icon": "⚖️",
          "title": "冻结层有取舍",
          "desc": "最高视觉分数不一定带来最佳相机精度。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "GGM 与 SSM++：全局骨架和局部记忆",
      "badge": "both",
      "badgeLabel": "训练与推理",
      "bridge": "单条轨迹可以生成清晰关键帧，但多条轨迹若各自独立生成，空间结构和局部纹理仍会互相漂移。",
      "analogy": {
        "title": "先看房间地图，再翻最近的一张照片",
        "text": "全局记忆守住空间骨架，局部记忆补回纹理与对应关系。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "记忆调度局：为目标视角配对",
          "desc": "加载 GGM 全局骨架，从三个历史视角中选择最相关关键帧，并比较空间拼接与时间拼接如何改变局部对应；最后展开论文表 8 核对真实消融。",
          componentId: "hy-memory"
        }
      ],
      "insight": "GGM 和 SSM++ 解决的尺度不同：前者约束全局粗结构，后者恢复局部对应与细节。",
      "formula": {
        "lead": "全局几何记忆把参考点云与额外视角点云合并。",
        "unicode": "P_glo = [P_ref, P̂] ∈ R^(N+N̂)×3",
        "symbols": [
          {
            "sym": "P_glo",
            "desc": "用于全局几何记忆的扩展点云。"
          },
          {
            "sym": "P_ref",
            "desc": "参考视角提取的点云。"
          },
          {
            "sym": "P̂",
            "desc": "从额外目标视角采样的点云。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🌐",
          "title": "GGM 管全局",
          "desc": "全景点云提供粗粒度三维结构。"
        },
        {
          "icon": "🖼️",
          "title": "SSM++ 管细节",
          "desc": "选择相关关键帧并与目标做空间拼接。"
        },
        {
          "icon": "🛡️",
          "title": "增强换鲁棒性",
          "desc": "训练增强可能牺牲少量干净数据指标。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "三段训练与四步推理",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "相机控制和多轨迹记忆并不是一次训练同时获得的。论文把能力拆成三段，再在最后压缩扩散步数。",
      "analogy": {
        "title": "先学走位，再学记忆，最后压缩快门次数",
        "text": "三段训练依次解决控制、一致性和速度。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "三阶段训练能力时间轴",
          "desc": "依次点选领域适配、记忆训练和后蒸馏，查看每段的前置条件、引入组件、能力增量与继承关系，并观察相机控制、跨轨迹一致性和四步采样如何逐层累积。",
          componentId: "hy-training-stages"
        },
        {
          kind: "module",
          "id": "6.2",
          "title": "DMD 分布校准仪",
          "desc": "切换噪声层级时连续观察分布宽度与 score 方向的形变；执行教学更新时，跟随学生峰值沿分数差平滑靠近教师，再核对四步 DiT 与完整 712 秒生成管线的边界。",
          componentId: "hy-dmd-lab"
        }
      ],
      "insight": "四步 DiT 只加速 WorldStereo 2.0 的生成器，不能把整个 712 秒世界生成管线称为实时。",
      "formula": {
        "lead": "DMD 用真实分数与伪分数的差异更新少步生成器；J_θ 缩写样本对学生参数的导数项。",
        "unicode": "∇L_DMD = -E_t[(s_real(x_t,t)-s_fake(x_t,t)) · J_θ]",
        "symbols": [
          {
            "sym": "s_real",
            "desc": "冻结教师模型给出的真实分数函数。"
          },
          {
            "sym": "s_fake",
            "desc": "随训练更新的伪分数函数。"
          },
          {
            "sym": "L_DMD",
            "desc": "分布匹配蒸馏目标，用于训练少步学生生成器。"
          },
          {
            "sym": "x_t",
            "desc": "在扩散时间 t 的带噪样本。"
          },
          {
            "sym": "J_θ",
            "desc": "样本对学生参数 θ 的雅可比项，即 dx_t/dθ。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "先控制",
          "desc": "领域适配建立关键帧空间与相机控制。"
        },
        {
          "icon": "🧠",
          "title": "再一致",
          "desc": "中段训练加入全局和局部记忆。"
        },
        {
          "icon": "⚡",
          "title": "后提速",
          "desc": "DMD 把生成器蒸馏为四步 DiT。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "WorldMirror 2.0：跨分辨率恢复几何",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "生成的关键帧最终需要变成稳定几何。WorldMirror 1.0 在训练外分辨率、深度一致性和大视图数上存在明显问题。",
      "analogy": {
        "title": "换分辨率，坐标尺不能跟着失真",
        "text": "归一化坐标把不同大小的图像映到同一范围，让新分辨率变成更密的采样。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "分辨率外推变插值",
          "desc": "点选 L/M/H 分辨率，再移动相对位置探针，观察原始索引为何外推、归一化坐标为何仍保持在固定区间，并展开表 12 / 表 11 核对不同评测协议。",
          componentId: "hy-resolution"
        }
      ],
      "insight": "分辨率稳定性来自归一化位置、深度-法线耦合、无效像素掩码和训练预算共同作用。",
      "formula": {
        "lead": "每个 patch 中心被映射到固定的 [-1,1] 坐标范围。",
        "unicode": "x̂_i=(2i+1)/H_p-1,  ŷ_j=(2j+1)/W_p-1",
        "symbols": [
          {
            "sym": "x̂_i",
            "desc": "高度方向第 i 个 patch 中心的归一化坐标。"
          },
          {
            "sym": "ŷ_j",
            "desc": "宽度方向第 j 个 patch 中心的归一化坐标。"
          },
          {
            "sym": "H_p",
            "desc": "输入图像在高度方向对应的 patch 网格尺寸。"
          },
          {
            "sym": "W_p",
            "desc": "输入图像在宽度方向对应的 patch 网格尺寸。"
          },
          {
            "sym": "i",
            "desc": "patch 在高度方向的整数索引。"
          },
          {
            "sym": "j",
            "desc": "patch 在宽度方向的整数索引。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📏",
          "title": "坐标归一化",
          "desc": "把训练外位置外推转成固定区间内插值。"
        },
        {
          "icon": "🧭",
          "title": "深度与法线耦合",
          "desc": "局部表面方向为深度提供额外几何监督。"
        },
        {
          "icon": "🧮",
          "title": "按 token 预算",
          "desc": "训练时分辨率和视图数共同受总 token 约束。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-8",
      "title": "从重建架构到论文创新证据",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "理解关键改进后，先看多种输入如何进入共享重建骨干，再把整篇论文的贡献拆成方法、训练效率、系统集成和运行时四类证据。",
      "analogy": {
        "title": "一台机身，多个可选测量附件",
        "text": "图像和几何先验先被统一成 token，再由共享骨干提取特征，最后交给不同输出头。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "8.1",
          "title": "Any-Modal 架构配线盘",
          "desc": "以多视图图像为必需输入，独立接入位姿、内参和深度先验，再检查五个同时在线的 DPT 输出头及无先验 / 全先验的论文端点。",
          componentId: "hy-architecture",
          "figure": "/images/figure-12-worldmirror.png"
        },
        {
          kind: "module",
          "id": "8.2",
          "title": "创新证据星图",
          "desc": "按核心方法、训练效率、系统集成或运行时筛选贡献，再追踪每项创新的旧问题、新机制、论文证据和不能外推的边界。",
          componentId: "hy-innovation-map"
        }
      ],
      "insight": "HY-World 2.0 的贡献不是单个模块包打天下：生成、规划、记忆、重建、资产压缩与运行时分别解决不同瓶颈，证据类型也不同。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "方法要落到问题",
          "desc": "每项机制都应回答它修复了哪一个旧瓶颈。"
        },
        {
          "icon": "🏗️",
          "title": "证据要分类型",
          "desc": "表格、消融、系统架构和官方演示承担不同证明责任。"
        },
        {
          "icon": "🎛️",
          "title": "边界同样重要",
          "desc": "四步、5.60 秒和官方 GIF 都不能代表整套系统无条件实时。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-9",
      "title": "从对齐深度到紧凑 3DGS",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "前馈重建给出的深度仍有尺度歧义，直接把所有点变成高斯又会在效率、细节和漂浮物之间冲突。",
      "analogy": {
        "title": "先把照片对齐，再删掉重复的拍摄点",
        "text": "生成深度先对齐到全景坐标，随后只在需要细节的区域保留足够高斯。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "9.1",
          "title": "高斯预算帕累托实验",
          "desc": "调节最大高斯数量与最低 PSNR，在表 9 的五个真实配置中寻找可行点、最低数量推荐与被支配方案，再展开原表核对完整指标。",
          componentId: "hy-composition"
        }
      ],
      "insight": "均匀降采样会伤害高频细节；非天空增密与概率掩码共同实现更紧凑的表示。",
      "formula": {
        "lead": "高斯存在掩码参与渲染，并与颜色、几何和正则项一起优化。",
        "unicode": "c(x)=Σ M_k c_k σ_k T_k;  L_GS=L_color+L_geo+L_reg+L_mask",
        "symbols": [
          {
            "sym": "M_k",
            "desc": "第 k 个高斯的可学习存在掩码。"
          },
          {
            "sym": "T_k",
            "desc": "按深度顺序累积的透射率。"
          },
          {
            "sym": "L_GS",
            "desc": "3DGS 的总训练目标。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "先对齐坐标",
          "desc": "可靠区域约束每帧尺度与偏移。"
        },
        {
          "icon": "✂️",
          "title": "不能均匀删点",
          "desc": "高频纹理区域需要更密的高斯覆盖。"
        },
        {
          "icon": "☁️",
          "title": "天空限制增密",
          "desc": "减少缺少深度监督区域产生漂浮物。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-10",
      "title": "结果、代价与使用边界",
      "badge": "both",
      "badgeLabel": "结果与判断",
      "bridge": "最后把所有设计放回实验协议：哪些指标真正改善、代价是什么，以及哪些结论只能在特定数据和硬件上成立。",
      "analogy": {
        "title": "交付的不只是好看照片，还要附上拍摄条件",
        "text": "结果只有连同数据集、指标方向、硬件和限制一起看，才有意义。",
        componentId: "hy-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "10.1",
          "title": "结论审判庭：八案证据挑战",
          "desc": "对论文数字、效率边界、Marble 比较、官方开源状态、在线体验与许可证说法作出判决，答题后解锁对应证据。",
          componentId: "hy-evidence-court"
        },
        {
          kind: "module",
          "id": "10.2",
          "title": "模型能力进化图鉴",
          "desc": "点击模型与功能交叉单元格，对比 HY-World 历代、重建前代和外部参照的能力、用途、2.0 改进点与证据边界。",
          componentId: "hy-model-evolution"
        }
      ],
      "insight": "HY-World 2.0 的系统价值来自把稀疏输入生成、密集输入重建、持久三维资产和运行时交互接入同一框架；但不同前代与外部模型的目标并不相同，Marble 也只有定性比较，不能把能力矩阵误读成统一排行榜。",
      "takeaways": [
        {
          "icon": "📊",
          "title": "先读协议",
          "desc": "数据集、分辨率、硬件和指标方向缺一不可。"
        },
        {
          "icon": "🏁",
          "title": "优势有条件",
          "desc": "全景质量、高分辨率稳定性和效率在对应协议下改善。"
        },
        {
          "icon": "🔗",
          "title": "按能力轴比较",
          "desc": "先区分生成、重建、三维资产与在线交互，再判断 2.0 改进了哪一段。"
        }
      ]
    }
  ]
};
