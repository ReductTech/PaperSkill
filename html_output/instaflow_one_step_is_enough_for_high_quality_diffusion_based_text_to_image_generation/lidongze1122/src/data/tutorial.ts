import type { TutorialData } from '../types';
export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "InstaFlow",
    "titleZh": "一步文生图：先改善耦合，再压缩预测",
    "venue": "ICLR 2024",
    "authors": "Xingchao Liu · Xiwen Zhang · Jianzhu Ma · Jian Peng · Qiang Liu",
    "affiliation": "UT Austin · Helixon Research",
    "domain": "文生图 · Rectified Flow · 蒸馏",
    "coreProblem": "多步扩散生成成本高，直接一步蒸馏又难以保持质量。",
    "coreInsight": "先用文本条件reflow改善噪声与图像的耦合，再蒸馏为一步端点预测。",
    "keywords": [
      "Reflow",
      "耦合",
      "一步蒸馏",
      "Stable Diffusion"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "弯曲的生成轨迹需要多次局部判断；直接压缩映射容易丢失质量。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "先改善耦合与轨迹，再用一次网络预测端点。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "生成一张图，为什么需要反复判断？",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "多步采样质量好，但每一步都要计算。先体验减少局部判断的代价，再看为什么直接压缩成一步还不够。",
      "analogy": {
        "title": "边走边取景，还是提前选好位置？",
        "text": "摄影师逐次调整拍摄位置，直到构图合适。想减少调整次数，既需要少操作，也需要更容易预测的目标。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "逐次判断的计算预算",
          "desc": "调整示意调用次数，观察路径上的判断点。该图不模拟真实模型速度或图像质量。原文：§2.1，第3页；§2.2式(4)，第4页。",
          "componentId": "a1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "直接蒸馏与先 reflow 再蒸馏",
          "desc": "选择教师再查看一步预测。这里仅以取景是否到位比喻映射难度，不展示模型生成的真实图像。原文：图3、第4页；§3.1—3.2，第6—7页。",
          "componentId": "a1b"
        }
      ],
      "insight": "InstaFlow先改进教师的噪声—图像映射，再把这个映射压缩为一步。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "减少计算",
          "desc": "少步采样有成本与精度取舍。"
        },
        {
          "icon": "🔧",
          "title": "直接压缩有难度",
          "desc": "论文SD1.4初步实验中直接蒸馏效果差。"
        },
        {
          "icon": "✨",
          "title": "先改善再压缩",
          "desc": "reflow与蒸馏解决不同问题。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "起点是噪声，终点是什么表示？",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "上一章把过程压成了一条路。现在要分清路的两端：潜空间中的变量与最后看到的像素图。",
      "analogy": {
        "title": "拍摄位置不是成片本身",
        "text": "摄影师站位只决定拍摄条件，成片仍要经过相机成像。类似地，流模型的终点潜变量还需要解码。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "切换噪声、潜变量与像素图",
          "desc": "点击三个表示阶段，观察当前对象与轮廓变化。潜空间图案为教学示意；一步指流模型的一次更新。原文：§2.2，第3—5页；§3.1及§4网络设置。",
          "componentId": "a2"
        }
      ],
      "insight": "本文基于Stable Diffusion的潜空间模型，一步流更新后仍需解码。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "X₀",
          "desc": "生成起点通常取标准高斯噪声。"
        },
        {
          "icon": "🔧",
          "title": "X₁",
          "desc": "reflow中的终端样本来自本轮教师求解器。"
        },
        {
          "icon": "✨",
          "title": "不能混同",
          "desc": "潜变量更新与像素解码是不同运算。"
        }
      ],
      "formula": {
        "lead": "时间从0走向1，速度场驱动随机起点到达终端分布。",
        "unicode": "dZₜ/dt = v(Zₜ,t)，Z₀ ∼ π₀，Z₁ ∼ π₁",
        "symbols": [
          {
            "sym": "Zₜ",
            "desc": "d维流模型状态；本文图像模型主要在潜空间计算。"
          },
          {
            "sym": "v",
            "desc": "d维速度场；文本条件写作v(Zₜ,t|T)。"
          },
          {
            "sym": "π₀、π₁",
            "desc": "起点噪声与终端样本分布；t∈[0,1]。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "耦合：同样的端点，可以重新配对",
      "badge": "inf",
      "badgeLabel": "基础与推理",
      "bridge": "知道起点与终点的分布仍不够。每个噪声对应哪一个图像端点，会影响映射是否容易学习。",
      "analogy": {
        "title": "重新选择更顺手的拍摄位置",
        "text": "同一组拍摄目标，可以搭配不同站位。调整站位与目标的配对，有时能让每次构图所需的动作更小。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "比较两种噪声—端点配对",
          "desc": "切换两种有限点示意，观察连线交叉与相对位移。它只说明耦合概念，不是最优传输算法或真实图像配对。原文：§2.2性质1—3，第5页。",
          "componentId": "a3"
        }
      ],
      "insight": "reflow改变单个噪声的映射，同时在理想理论中保留终端分布。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "分布不等于配对",
          "desc": "同样的端点分布可以对应不同运输映射。"
        },
        {
          "icon": "🔧",
          "title": "保留范围",
          "desc": "理论保留终端分布，不承诺全部中间边缘相同。"
        },
        {
          "icon": "✨",
          "title": "理论有条件",
          "desc": "有限数据和优化误差会使实际训练偏离理想性质。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "Reflow：用直线训练目标重塑速度场",
      "badge": "both",
      "badgeLabel": "原理与实践",
      "bridge": "重新配对如何落实为训练？教师先生成端点，学生在两端的线性插值上回归位移。",
      "analogy": {
        "title": "沿构图方向平稳调整",
        "text": "摄影师在两个位置之间匀速移动，沿途使用同一个目标方向。这个直线练习解释训练目标，不能保证实际走法立即完全笔直。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "沿线性插值逐点检查速度",
          "desc": "按四分之一步推进t，切换示意速度估计，比较当前箭头与目标位移的方向。原文：式(3)、(5)、算法1，第4—5页。",
          "componentId": "a4"
        }
      ],
      "insight": "线性插值的监督目标是端点位移；学成的ODE只有在理想条件下逐渐变直。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先取教师端点",
          "desc": "X₁=ODE[vₖ](X₀|T)。"
        },
        {
          "icon": "🔧",
          "title": "再回归位移",
          "desc": "所有插值时间的目标都是X₁−X₀。"
        },
        {
          "icon": "✨",
          "title": "有限轮不严格直",
          "desc": "论文在近似变直后继续做一步蒸馏。"
        }
      ],
      "formula": {
        "lead": "从教师的配对构造直线上的训练样本，并用平方误差拟合位移。",
        "unicode": "Xₜ=(1−t)X₀+tX₁；L_reflow=E[∫₀¹ ‖(X₁−X₀)−v(Xₜ,t|T)‖²dt]",
        "symbols": [
          {
            "sym": "X₀、X₁",
            "desc": "X₀为高斯噪声；X₁由上轮教师vₖ数值积分生成，两者配对使用。"
          },
          {
            "sym": "Xₜ",
            "desc": "训练用线性插值，区别于一般ODE解轨迹Zₜ。"
          },
          {
            "sym": "v、T",
            "desc": "待训练速度网络及从提示词数据集抽取的文本条件。"
          },
          {
            "sym": "E",
            "desc": "对噪声起点和文本提示词取期望，时间积分通常用采样近似。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "文本引导：朝提示词方向外推",
      "badge": "both",
      "badgeLabel": "原理与实践",
      "bridge": "直线目标还要知道“想拍什么”。文本条件进入速度网络，CFG进一步调整有条件和无条件速度的组合。",
      "analogy": {
        "title": "按拍摄意图调整取景方向",
        "text": "没有明确主题时，摄影师只作一般取景；给定拍摄意图后，调整方向偏向目标。强调主题并不意味着所有质量指标都同步改善。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "切换无条件、原条件和外推引导",
          "desc": "选择α查看同一组二维速度的组合结果。向量仅解释公式，不代表真实模型的精确速度值。原文：式(7)，第6页；§4引导分析。",
          "componentId": "a5"
        }
      ],
      "insight": "引导强度是在文本一致性和样本分布指标之间作权衡，不能当作单调质量旋钮。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "α=0",
          "desc": "使用无条件速度。"
        },
        {
          "icon": "🔧",
          "title": "α=1",
          "desc": "保留原来的文本条件速度。"
        },
        {
          "icon": "✨",
          "title": "α>1",
          "desc": "从无条件方向向文本条件方向外推。"
        }
      ],
      "formula": {
        "lead": "CFG将条件速度与无条件速度作仿射组合。",
        "unicode": "vᵅ(Zₜ,t|T)=αv(Zₜ,t|T)+(1−α)v(Zₜ,t|NULL)",
        "symbols": [
          {
            "sym": "α",
            "desc": "引导强度；等于1时回到原条件场，增大并不保证FID改善。"
          },
          {
            "sym": "T、NULL",
            "desc": "文本提示词与空文本条件。"
          },
          {
            "sym": "vᵅ",
            "desc": "组合后的速度场；式子本身不意味着蒸馏的一步模型必须推理两支网络。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一步生成：把整段位移放进一次预测",
      "badge": "inf",
      "badgeLabel": "推理机制",
      "bridge": "路线更直，并不意味着有限训练模型已精确直线。蒸馏进一步把多步教师的端点映射压缩到一步学生。",
      "analogy": {
        "title": "按下快门，直接记录目标",
        "text": "摄影师先确定最终构图，再一次按下快门；这比喻端点预测，不表示模型拍摄了真实场景。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "逐项追踪一次学生调用",
          "desc": "点击下一步，分清噪声、速度预测与端点相加。中间教学画面不是额外采样。原文§2.2，式(6)、算法2，第5页。",
          "componentId": "b6"
        }
      ],
      "insight": "一步是网络调用次数，不是省略文本编码与图像解码。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "端点监督",
          "desc": "教师端点来自多步ODE求解。"
        },
        {
          "icon": "🔧",
          "title": "位移预测",
          "desc": "学生预测完整潜空间位移。"
        },
        {
          "icon": "⚖️",
          "title": "一次解码",
          "desc": "最终潜变量仍需解码。"
        }
      ],
      "formula": {
        "lead": "蒸馏拟合教师的完整端点，而不是仅拟合某个局部速度。",
        "unicode": "min_v E[D(ODE[vₖ](X₀|T), X₀+v(X₀|T))]",
        "symbols": [
          {
            "sym": "X₀",
            "desc": "潜空间的初始高斯噪声向量。"
          },
          {
            "sym": "T",
            "desc": "文本提示条件；不是时间上限。"
          },
          {
            "sym": "vₖ",
            "desc": "经reflow得到的教师速度场。"
          },
          {
            "sym": "D",
            "desc": "可微相似性损失，训练包括L2与LPIPS。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练成本：快推理来自事先的练习",
      "badge": "trn",
      "badgeLabel": "训练与结构",
      "bridge": "一步学生不是免费获得的。训练需要教师配对数据、reflow以及端点蒸馏，成本必须按阶段计算。",
      "analogy": {
        "title": "练习曝光，再正式拍摄",
        "text": "摄影师事先练习取景，正式拍摄才更迅速；这不意味着练习成本不存在。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "预测并揭示训练预算",
          "desc": "先判断108 GPU天是否足够代表全部训练，再揭示0.9B各阶段成本。柱图按GPU天线性绘制。原文§4、附录D，第8、21—22页。",
          "componentId": "b7"
        }
      ],
      "insight": "199 GPU天是在SD预训练基础上的适配成本，不是从零训练成本。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "reflow损失",
          "desc": "匹配线性插值上的端点位移。"
        },
        {
          "icon": "🔧",
          "title": "蒸馏损失",
          "desc": "先L2后LPIPS进行学生端点拟合。"
        },
        {
          "icon": "⚖️",
          "title": "成本范围",
          "desc": "1.7B另有39.6 A100 GPU天蒸馏。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "网络结构：一次前向也能更深",
      "badge": "trn",
      "badgeLabel": "训练与结构",
      "bridge": "压缩采样步数之后，仍可以增加一次网络前向的表达能力。0.9B与1.7B的变化发生在网络内部。",
      "analogy": {
        "title": "更换镜头，保留同一次曝光",
        "text": "摄影师换用更复杂的镜头，但一次曝光仍是一次曝光；对应网络加深与采样步数的区别。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击组件，追踪条件与潜变量",
          "desc": "选择文本、噪声、U-Net或解码器，再切换模型规模，观察当前组件与主体结构。模块图为简化示意，省略细节连接。原文§4、附录B，第8、17—19页。",
          "componentId": "b8"
        }
      ],
      "insight": "Stacked U-Net的两段网络属于一次前向计算，不是两次采样。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "冻结组件",
          "desc": "文本编码器与自动编码器保持冻结。"
        },
        {
          "icon": "🔧",
          "title": "主体扩展",
          "desc": "1.7B使用串联且不共享权重的主体。"
        },
        {
          "icon": "⚖️",
          "title": "代价可见",
          "desc": "论文单图延迟从0.09增至0.12秒。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "消融：更多reflow一定更好吗？",
      "badge": "both",
      "badgeLabel": "实验与边界",
      "bridge": "reflow改善耦合有理论动机，但有限数据和优化误差会积累，不能用“越多越好”替代实验。",
      "analogy": {
        "title": "多次调整取景，可能错过平衡",
        "text": "摄影师继续调整构图，未必每次都更好；对应模型质量的经验取舍。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "切换教师与学生结构",
          "desc": "对比SD1.4初步实验中2-RF与3-RF蒸馏结果；共享Stacked U-Net不是最终1.7B。原文附录C.2、表4，第20—21页。",
          "componentId": "b9"
        }
      ],
      "insight": "额外reflow是否有益取决于网络、指标和训练设置。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "U-Net有改善",
          "desc": "FID从31.0降至29.3。"
        },
        {
          "icon": "🔧",
          "title": "共享堆叠有反例",
          "desc": "FID从24.6升至26.3。"
        },
        {
          "icon": "⚖️",
          "title": "指标有取舍",
          "desc": "FID改善也不保证CLIP同时改善。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果：在同一评测协议内比较",
      "badge": "both",
      "badgeLabel": "实验与边界",
      "bridge": "最后以原文表2检验速度与质量。COCO年份、样本数、模型版本与计时条件不同，就不能共用一个排行榜。",
      "analogy": {
        "title": "比较照片，也比较拍摄条件",
        "text": "摄影师应在相同光线和同一任务下比较照片；评测也必须保持协议一致。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "选择协议，主动揭示结果",
          "desc": "切换COCO2017-5k或COCO2014-30k后开始比较。柱图仅突出少步模型，表格保留完整摘录。原文表2，第8页；计时附录B、C。 论文§5指出复杂组合、物体关系与构图仍可能失败。图10使用SDXL Refiner可进一步改善细节，但增加额外计算，不能把其1024×1024结果计为0.09秒。",
          "componentId": "b10"
        }
      ],
      "insight": "一步生成在低延迟区间表现突出，但并未全面优于所有模型。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "FID降低",
          "desc": "0.9B在2017-5k主表为23.4。"
        },
        {
          "icon": "🔧",
          "title": "规模换质量",
          "desc": "1.7B对应22.4及0.12秒。"
        },
        {
          "icon": "⚖️",
          "title": "评测有限",
          "desc": "计时与指标都受设备和协议限制。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1sn4y1X7s7",
      "title": "Rectified Flow论文解读及实现",
      "reason": "包含InstaFlow相关机制，虽播放量不足一万但内容直接相关。",
      "cover": "https://i1.hdslb.com/bfs/archive/bc726c40a2f40c6ae95e680305d2db5bb7bf930d.jpg",
      "views": "4195播放"
    },
    {
      "bvid": "BV1nw4m1Y7nz",
      "title": "Rectified Flow：Reflow与蒸馏",
      "reason": "直接讲解重流与蒸馏关系，作为原论文之外的补充。",
      "cover": "https://i2.hdslb.com/bfs/archive/0948c6c7f8f6d311247feb1bead9341e4fe44029.jpg",
      "views": "7701播放"
    }
  ]
};
