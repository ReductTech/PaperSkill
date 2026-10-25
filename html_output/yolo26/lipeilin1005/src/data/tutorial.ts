import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Ultralytics YOLO26: Unified Real-Time End-to-End Vision Models",
    "titleZh": "Ultralytics YOLO26：统一的实时端到端视觉模型",
    "venue": "arXiv preprint arXiv:2606.03748 · 2026",
    "authors": "Glenn Jocher, Jing Qiu, Mengyu Liu, Shuai Lyu, Fatih Cagatay Akyon, Muhammet Esat Kalfaoglu",
    "affiliation": "Ultralytics",
    "domain": "计算机视觉 / 实时目标检测",
    "coreProblem": "旧款实时 YOLO 检测器仍依赖 NMS 后处理、DFL 检测头臃肿且回归范围受限、训练要约 600 个 epoch、小于最小步长的小目标拿不到任何正样本——四个痛点叠加，拖慢了部署与迭代。",
    "coreInsight": "YOLO26 的答案是一组协调的改造：免 NMS 的双头架构 + 彻底移除 DFL 的轻头部，再配合三种训练技术（Muon 混合优化器 MuSGD、渐进损失 Progressive Loss、小目标感知分配 STAL），在五个尺度、五种任务上同时推进精度—延迟前沿。",
    "keywords": [
      "YOLO26",
      "端到端检测",
      "NMS-free"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "旧管线：DFL 头部臃肿、推理后还要过 <b>NMS 检查站</b>，小零件松了也没人管。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "YOLO26：去 DFL 的轻头部、双头设计，默认<b>端到端免 NMS</b> 直达终点。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "四个痛点：旧款实时检测器为何又慢又重",
      "badge": "inf",
      "badgeLabel": "入门必读",
      "bridge": "实时检测器要的是“准、快、好部署”。本章先不讲解法，先让你亲身体验旧款 YOLO 管线为什么会吃力。",
      "analogy": {
        "title": "驮着全家当爬坡",
        "text": "旧款检测器像一辆挂满沉重配件的车：检测头臃肿、推理后还要排队过 NMS 这道“检查站”，小零件松了也没人管。骑手的目标只有一个——<b>轻装、直达</b>。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "加压测试：复杂度如何拖垮旧管线",
          "desc": "拖动滑块加大“路况难度”（目标更多、分辨率更高），观察旧管线的延迟与重复预测如何恶化，再看右侧载重骑行的联动。",
          "componentId": "ch1-stress"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "同一个检测头，拆掉 DFL 后还剩多少",
          "desc": "点击两个模式芯片，对比带 DFL 与移除 DFL 的头部参数量、计算量与回归范围上限。",
          "componentId": "ch1-lighten"
        }
      ],
      "insight": "这些负担不是单点故障，而是结构性的：头重、后处理慢、训练久、小目标漏标——需要一个协调的整体改造。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四个痛点",
          "desc": "NMS 后处理、DFL 头重且范围受限、约 600 epoch 训练、TAL 小目标零正样本。"
        },
        {
          "icon": "🔧",
          "title": "协调改造",
          "desc": "架构（双头、去 DFL）与训练（MuSGD、渐进损失、STAL）互相配合，缺一不可。"
        },
        {
          "icon": "✨",
          "title": "减负立竿见影",
          "desc": "nano 模型移除 DFL 即省 12% 参数与 20% FLOPs。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "多尺度表示：特征金字塔与齿比",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "上一章说“小零件松了没人管”。要理解小目标为什么会漏标，得先看图像在检测器里是怎样被表示的。",
      "analogy": {
        "title": "上坡要换小齿比",
        "text": "图像里的物体也有“坡度”：小物体需要细密的网格（小齿比、高踏频），大物体适合粗网格（大齿比、省力）。<b>选错档，要么踩空，要么踩不动。</b>",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "三档步长各管多大的物体",
          "desc": "点击 stride 8 / 16 / 32 三档，联动观察左侧坡度骑行与右侧特征网格、锚点中心和各档负责的物体尺度。",
          "componentId": "ch2-strides"
        }
      ],
      "insight": "网格密度决定“谁看得见谁”。小于最小步长（8 px）的物体，锚点中心天然落不进任何真值框——这就是后续要修的盲区。",
      "formula": {
        "lead": "步长 s 表示特征图上一个格子对应原图的像素数；YOLO26 使用三级金字塔：",
        "unicode": "strides = [ 8, 16, 32 ]   →   网格密度 ∝ 1 / s",
        "symbols": [
          {
            "sym": "s",
            "desc": "特征层步长：8 / 16 / 32，即特征图 1 格对应原图的像素数"
          },
          {
            "sym": "1/s",
            "desc": "网格密度：步长越小格子越密，越看得见小物体"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三级金字塔",
          "desc": "stride 8/16/32 各负责一段物体尺度，像齿比分工。"
        },
        {
          "icon": "🔧",
          "title": "天然盲区",
          "desc": "小于最小步长（8 px）的物体没有任何锚点中心落入真值框。"
        },
        {
          "icon": "✨",
          "title": "表示定上限",
          "desc": "表示的选择决定了后续匹配与回归能做什么。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "核心洞察：一对一匹配，告别 NMS",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "知道了盲区在哪，现在看本文最大的“啊哈”：与其事后去重，不如让模型从一开始就只报一次。",
      "analogy": {
        "title": "一条车道，一人直达",
        "text": "与其冲线后让裁判挤掉多余选手，不如起跑时就约定：<b>一条车道只过一人</b>。一对一匹配让检测器从训练起就学会“一个目标只报一次”。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同一个场景，两种输出方式",
          "desc": "按下开始按钮，左右两个等尺寸面板从同一张街景出发：左侧一对多头产生大量重叠预测、需要 NMS 检查站筛除；右侧一对一头每个目标只给一个框、直接输出。",
          "componentId": "ch3-onetoone"
        }
      ],
      "insight": "只要训练时让一对一-branched 获得专门的监督，推理就可以省掉整个 NMS 检查站——这就是 YOLO26 默认的端到端路径。",
      "formula": {
        "lead": "两种头的匹配基数不同：一个真值框在训练时匹配多少个预测，由 topk 决定——",
        "unicode": "一对多头：topk = 10　　一对一头：topk = 7 → topk2 = 1（唯一匹配）",
        "symbols": [
          {
            "sym": "topk",
            "desc": "TAL 为每个真值框选取的候选正样本数量"
          },
          {
            "sym": "topk2 = 1",
            "desc": "一对一头再做一次唯一过滤：每个真值框只保留一个正样本"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "根源在训练",
          "desc": "一对一匹配让每个真值框只有一个正样本，重复在训练时就被消除。"
        },
        {
          "icon": "🔧",
          "title": "后处理归零",
          "desc": "端到端输出 ≤300 个检测，形状固定 (N, 300, 6)，部署友好。"
        },
        {
          "icon": "✨",
          "title": "代价很小",
          "desc": "E2E 路径仅比 NMS 路径低 0.6–0.8 AP（第 5 章细看权衡）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "回归的数学：从 DFL 分布到直接回归",
      "badge": "both",
      "badgeLabel": "原理+训练",
      "bridge": "一对一解决了“报几次”，但框的位置怎么算出来？本章看第一个正式公式：DFL 的分布解码，以及它为什么会被“刻度”卡住。",
      "analogy": {
        "title": "16 格的表盘读不了全程",
        "text": "DFL 像一块只有 16 个刻度的表盘：距离一远，指针顶到尽头只能估读。<b>直接回归</b>换成数字直显——多远都能读。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "目标越大，DFL 的刻度越不够用",
          "desc": "拖动滑块改变真值框尺寸（或切换 640/1280 分辨率），观察 DFL 的 16 个 bin 如何在范围上限处被截断，而直接回归始终精确跟随。下方配图来自论文 1280 分辨率的定性对比。",
          "componentId": "ch4-regression",
          "figure": "./images/fig-dfl-large.jpg"
        }
      ],
      "insight": "分布式回归的代价是“刻度有限 + 头部更重”。直接回归更简单也更自由；去 DFL 损失的 0.6 AP 由 L1、STAL 与颈部新增注意力层三项各 +0.2 合力补回 47.0 AP，而去 DFL 头部本身 −0.3M 参数、−1.4G FLOPs、−0.2ms。",
      "formula": {
        "lead": "DFL 把每条边的距离预测成 K 个 bin 上的分布，再取期望作为最终距离：",
        "unicode": "d = Σᵢ₌₀ᴷ⁻¹ i · softmax(z)ᵢ ， z ∈ Rᴷ，d ∈ [0, (K−1) · stride]",
        "symbols": [
          {
            "sym": "z",
            "desc": "DFL 头输出的 K 个 logits（默认 K=16），长度为 K 的向量"
          },
          {
            "sym": "i",
            "desc": "bin 的索引，取 0…K−1"
          },
          {
            "sym": "softmax(z)ᵢ",
            "desc": "第 i 个 bin 的概率"
          },
          {
            "sym": "d",
            "desc": "解码后的边框距离（像素），被限制在 0 到 (K−1)·stride"
          },
          {
            "sym": "stride",
            "desc": "该特征层的步长；单边距离上限 = (K−1) × stride（K=16、s=32 时为 480 px），整框宽/高界 ≈ 2(K−1) × stride ≈ 960 px"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "DFL = 分布 + 期望",
          "desc": "4 个标量变成 4K 个 logits（K=16 即 64 个），头部明显变重。"
        },
        {
          "icon": "🔧",
          "title": "范围是硬约束",
          "desc": "上限 (K−1)·stride；1280 分辨率下大物体 APL 差距达 +2.2。"
        },
        {
          "icon": "✨",
          "title": "替代组合存在",
          "desc": "去 DFL 降到 46.4；L1、STAL、颈部注意力层各 +0.2 补回 47.0 AP，头部 −0.3M 参数、−1.4G FLOPs、−0.2ms。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "双头部署：直达绿道还是景观大道",
      "badge": "both",
      "badgeLabel": "部署权衡",
      "bridge": "免 NMS 很诱人，但部署从来不是单选题。本章把两条路线摆上台面，用数据做决策。",
      "analogy": {
        "title": "两条路，同一个终点",
        "text": "直达绿道不用过检查站（免 NMS，快而干净）；景观大道风景更好（极限精度高），但出城要排队盖章。<b>选哪条，取决于你更在意什么。</b>",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "选头指南：精度、延迟与后处理",
          "desc": "在五个模型尺度间切换，并选择一对一头或一对多头，查看 COCO mAP、T4 延迟与是否需要 NMS 后处理。",
          "componentId": "ch5-dualhead"
        }
      ],
      "insight": "E2E 的代价很小且稳定（约 0.6–0.8 AP），换来部署确定性与免后处理；极限精度场景保留 NMS 完全合法。",
      "formula": {
        "lead": "同一尺度下，两条路径的经验关系可以写成一句话：",
        "unicode": "mAP(E2E) ≈ mAP(NMS) − 0.6 ~ 0.8　　（COCO val2017，五个尺度一致成立）",
        "symbols": [
          {
            "sym": "mAP(E2E)",
            "desc": "一对一头、免 NMS 的验证精度"
          },
          {
            "sym": "mAP(NMS)",
            "desc": "一对多头、带 NMS 的验证精度，同尺度略高"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "默认路径",
          "desc": "一对一头免 NMS、输出固定 ≤300 框，部署最简单。"
        },
        {
          "icon": "🔧",
          "title": "精度后备",
          "desc": "一对多头保留，极限精度场景选它。"
        },
        {
          "icon": "✨",
          "title": "代价可预期",
          "desc": "差距是稳定的小数（0.6–0.8 AP），工程上可权衡。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "端到端推理：一次骑行直达终点",
      "badge": "inf",
      "badgeLabel": "推理基础",
      "bridge": "路线选好了，现在完整走一遍。本章把前面所有概念串成一次不间断的端到端推理。",
      "analogy": {
        "title": "一条路骑到底",
        "text": "端到端推理像一次不设检查站的骑行：从出发到冲线，每一步都事先规划好，<b>没有事后折返</b>。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "从图像到检测框，中间发生了什么",
          "desc": "用「上一步 / 下一步」推进五个阶段，观察数据流经的部件、张量形状如何变化，以及一对一头如何最终免 NMS 输出。",
          "componentId": "ch6-pipeline"
        }
      ],
      "insight": "端到端不是某个单点技巧，而是一条每一步都为“免后处理”设计好的路线。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "五步链路",
          "desc": "输入 → 骨干 → 颈部（含新增注意力层）→ 双头 → top-300 选择输出。"
        },
        {
          "icon": "🔧",
          "title": "过滤开销极小",
          "desc": "训练分配 topk=7→1 保证唯一匹配；推理期一次 top-300 选择输出，免 NMS。"
        },
        {
          "icon": "✨",
          "title": "形状友好",
          "desc": "输出固定 (N, 300, 6)，利于编译部署与形状推断。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练配方：渐进课表与 MuSGD",
      "badge": "trn",
      "badgeLabel": "训练进阶",
      "bridge": "第三章说过：一对一头需要专门监督，否则练不透。本章兑现这个伏笔，并顺手解决 600 epoch 的训练时长问题。",
      "analogy": {
        "title": "课表前期平路多，后期爬坡多",
        "text": "好课表从不第一天就拉爆你：先平路打基础，再把强度一点点移到爬坡上——就像训练损失从“多对一辅助”<b>渐进移向“一对一主攻”</b>。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "α(t) 怎么调，一对一头才练得出来",
          "desc": "拖动训练轮次滑块，或切换四种课表（权重调度），观察 α(t) 曲线、两个分支的损失权重条与对应的最终 E2E mAP。",
          "componentId": "ch7-progressive"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "传动效率：MuSGD 对 SGD",
          "desc": "比较 SGD 与 MuSGD 的收敛过程：曲线、达到精度所需 epoch 数，以及 MuSGD 正交化更新的直观示意。",
          "componentId": "ch7-musgd"
        }
      ],
      "insight": "权重调度解决“谁来监督推理头”，而 600 epoch 的训练时长还需要一个更直接的加速器——从 LLM 训练借来的 MuSGD。",
      "formula": {
        "lead": "总损失是两个分支损失的加权和，权重随训练轮次线性翻转：",
        "unicode": "L_total = α(t) · L_o2m + (1 − α(t)) · L_o2o　　α(t): 0.8 → 0.1 线性（每 epoch 更新一次）",
        "symbols": [
          {
            "sym": "α(t)",
            "desc": "第 t 轮时 one-to-many 分支的损失权重，默认从 0.8 线性降到 0.1"
          },
          {
            "sym": "L_o2m / L_o2o",
            "desc": "稠密分支 / 端到端分支的检测损失"
          },
          {
            "sym": "t / E",
            "desc": "当前轮次 / 总轮数；α 每 epoch 更新一次"
          },
          {
            "sym": "α_init / α_final",
            "desc": "权重调度起止值：实现选择，作者声明并非精调超参"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "渐进最优",
          "desc": "0.8→0.1 线性调度 E2E mAP 46.7，优于固定权重（46.4）。"
        },
        {
          "icon": "🔧",
          "title": "MuSGD 更快更高",
          "desc": "500 epoch 达 47.4 mAP，超过 SGD 600 epoch 的 47.0。"
        },
        {
          "icon": "✨",
          "title": "部署零成本",
          "desc": "两项都是训练期改动，不改变推理图。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "整车结构：YOLO26 架构全览",
      "badge": "trn",
      "badgeLabel": "结构进阶",
      "bridge": "概念都齐了，现在把它们安放到一张“整车图”上——每一个零件都能点开看。",
      "analogy": {
        "title": "转一圈脚踏，看整车是否顺畅",
        "text": "好车不靠单个零件，而靠整车配合：车架承力、传动高效、轮组轻快。<b>点开每个部件</b>，看看 YOLO26 的“整车”长什么样。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击部件，读懂 YOLO26",
          "desc": "点击五个部件热点（或下方对应的按钮），查看其职责、关键事实与数据流向；选中部件在图上高亮并显示下游激活路径。",
          "componentId": "ch8-arch"
        }
      ],
      "insight": "YOLO26 是“共享底座 + 专用头部”的系统设计：每项改进——注意力层、双头、任务头——都能在车架上找到位置。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "公共底座",
          "desc": "共享骨干 + 颈部注意力层 + 双检测头，五种任务共用。"
        },
        {
          "icon": "🔧",
          "title": "换轮组不换车架",
          "desc": "分割用原型掩膜、姿态用 RLE、OBB 用长边角度，各自专用。"
        },
        {
          "icon": "✨",
          "title": "改动可分离验证",
          "desc": "架构与训练改动正交，Table 2 的逐项消融可单独核对。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实用机制：小螺丝也不能松（STAL 与多任务头）",
      "badge": "trn",
      "badgeLabel": "训练进阶",
      "bridge": "回到第 1 章的第四个痛点：小目标零监督。现在有了表示、匹配与回归的知识，可以看懂这个“一颗螺丝”级别的精巧修复了。",
      "analogy": {
        "title": "最小的螺丝，也决定安全",
        "text": "再小的零件松了都可能出问题。STAL 就是赛前那颗必检的小螺丝：<b>小于最小步长的目标，也能拿到属于自己的正样本。</b>",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "零监督盲区：一颗螺丝的救赎",
          "desc": "拖动目标尺寸滑块，对比 TAL 与 STAL 的候选筛选：当宽高小于最小步长 8 px 时，TAL 没有任何锚点中心落入真值框（零正样本），STAL 用 16 px 代理框仅做筛选找回监督。下方配图来自论文定性对比。",
          "componentId": "ch9-stal",
          "figure": "./images/fig-stal-small.jpg"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "同一副车架，三种骑法",
          "desc": "切换实例分割 / 姿态估计 / 旋转框任务头，查看各头的关键设计与相对 YOLO11 的增益条。",
          "componentId": "ch9-tasks"
        }
      ],
      "insight": "小目标的问题是“制度性遗漏”而非模型能力——改一条筛选规则就能救回来，而且几乎零成本。",
      "formula": {
        "lead": "STAL 只替换“候选筛选”用的尺寸：小于最小步长的边，临时按参考尺寸判断是否纳入候选——",
        "unicode": "d̃ᵢ = s_ref（若 dᵢ < s_min）；否则 d̃ᵢ = dᵢ　—— 仅用于候选筛选，匹配与回归仍用原始 dᵢ",
        "symbols": [
          {
            "sym": "dᵢ",
            "desc": "真值框的宽或高（像素），i ∈ {w, h}"
          },
          {
            "sym": "s_min",
            "desc": "最小特征步长，默认 8（三级金字塔 [8,16,32]）"
          },
          {
            "sym": "s_ref",
            "desc": "参考尺寸，取第二档步长 16；实验证明 8 太弱、32 过度"
          },
          {
            "sym": "d̃ᵢ",
            "desc": "仅用于候选筛选的代理尺寸，绝不参与回归"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题出在规则",
          "desc": "TAL 的几何过滤让 <8 px 目标拿到零正样本——不是模型看不见，是制度没给它机会。"
        },
        {
          "icon": "🔧",
          "title": "代理几何的精髓",
          "desc": "STAL 只做筛选、不动回归：总 AP +0.2、APS +0.6。"
        },
        {
          "icon": "✨",
          "title": "多任务增益",
          "desc": "分割 +3.7、姿态 +7.2、OBB +3.4（各自最优档，跨尺度一致）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "成绩单：COCO 对比、多任务收益与局限",
      "badge": "both",
      "badgeLabel": "总结对比",
      "bridge": "理论的终点是实测。最后一场同尺度对决，用论文的验证数据收束全文。",
      "analogy": {
        "title": "同一条赛道，重新计时的对决",
        "text": "成绩说明一切：同样的赛道规则（COCO 协议），轻装新车（YOLO26）与老车（YOLO11）同场计时。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "同尺度对决：YOLO11 vs YOLO26",
          "desc": "选择模型尺度，按下开始，观察同尺度下 YOLO11 与 YOLO26 的 COCO mAP 竞赛条；下方验证表保留精确数值与协议说明。",
          "componentId": "ch10-race"
        }
      ],
      "insight": "论文的收益是“全尺度、全任务”的一致提升而非单点冠军；代价（E2E −0.6~0.8 AP）明确且可预期。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "全尺度领先",
          "desc": "COCO 40.9–57.5 mAP、T4 1.7–11.8 ms；同尺度对 YOLO11 +1.6~+2.8 AP。"
        },
        {
          "icon": "🔧",
          "title": "全任务提升",
          "desc": "分割 +3.7、姿态 +7.2、OBB +3.4（各自最优档）。"
        },
        {
          "icon": "✨",
          "title": "诚实的边界",
          "desc": "E2E 低 0.6–0.8 AP；评测以 COCO 为中心，调度形状与更大预训练是开放问题。本教程聚焦闭集检测与三个任务头，YOLOE-26 开放词汇扩展（LVIS minival 文本提示 40.6 AP）未展开。"
        }
      ]
    }
  ]
};
