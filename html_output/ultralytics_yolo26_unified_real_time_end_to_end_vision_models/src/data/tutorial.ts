import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Ultralytics YOLO26: Unified Real-Time End-to-End Vision Models",
    titleZh: "YOLO26：重新设计一个实时检测器的四个关键环节",
    venue: "arXiv · 2026",
    authors: "Glenn Jocher、Jing Qiu、Mengyu Liu、Shuai Lyu、Fatih Cagatay Akyon、Muhammet Esat Kalfaoglu",
    affiliation: "Ultralytics",
    domain: "实时目标检测 · 端到端视觉 · 多任务学习",
    coreProblem: "现有 YOLO 检测器仍可能依赖 NMS、承担 DFL 头部成本、漏掉极小目标监督，并需要较长训练周期。",
    coreInsight: "YOLO26 保留 <b>dense prediction</b> 基础，并重新思考谁负责目标、框如何预测、小目标如何获得监督，以及参数如何更新。",
    keywords: [
      "NMS-free",
      "DFL-free",
      "STAL",
      "MuSGD"
    ]
  },
  hero: {
    oldMethod: {
      desc: "密集预测仍有效，但重复框、有限回归范围、极小目标监督缺口与较长训练周期增加了部署和训练负担。",
      componentId: "hero-old-map"
    },
    newMethod: {
      desc: "YOLO26 用相互配合的双头分配、直接回归、STAL、Progressive Loss 与 MuSGD 处理这些问题。",
      componentId: "hero-new-map"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "YOLO 是如何检测一个目标的？",
      badge: "both",
      badgeLabel: "训练与推理",
      bridge: "后续改动涉及预测、训练分配、边界回归和参数优化。先从基础流程开始：多个空间位置同时生成预测，训练分配再决定每个目标由哪些位置学习。",
      analogy: {
        title: "每个网格位置都是一名守卫",
        text: "把特征图上的每个预测位置（anchor point）看作一名站岗守卫，把待检测目标看作嫌犯。守卫会报告嫌犯的<b>类别</b>，并画出一个<b>可疑区域</b>；这个区域对应模型预测的边界框。",
        componentId: "photo-ana-1"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "点一个特征图位置，看看它会输出什么",
          desc: "点击特征图中的位置，观察预测框、四边距离和训练分配如何同步变化。图中数值用于解释密集预测与任务对齐分配（TAL）的空间关系。",
          componentId: "prediction-point-explorer"
        }
      ],
      insight: "模型先在多个空间位置生成预测，再由训练分配决定哪些位置负责学习目标；无 NMS 设计从责任分配入手减少重复框。",
      takeaways: [
        {
          icon: "🎯",
          title: "多尺度预测",
          desc: "YOLO 在多尺度特征图上同时观察许多空间位置。"
        },
        {
          icon: "▣",
          title: "空间位置的输出",
          desc: "每个空间位置同时产生类别置信度和边界框信息。"
        },
        {
          icon: "✓",
          title: "分配决定监督",
          desc: "任务对齐分配（TAL）决定训练时哪些位置从标注目标获得监督。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "为什么 YOLO26 可以去掉 NMS？",
      badge: "both",
      badgeLabel: "训练与推理",
      bridge: "一个标注目标可以监督多个空间位置；多个位置学习同一目标时，推理阶段容易出现重复高置信框。",
      analogy: {
        title: "多人上报，还是一人负责？",
        text: "one to many 分配允许多名守卫同时报告同一名嫌犯，指挥中心需要用 NMS 合并重复报告。one to one 分配训练一名主守卫承担高置信报告，从源头减少重复框。",
        componentId: "photo-ana-2"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "同一个目标，多点负责还是一点负责？",
          desc: "切换 one to many（一对多）与 one to one（一对一）分配，比较正样本数量、分类目标值和是否需要 NMS。",
          componentId: "o2m-o2o-compare"
        },
        {
          kind: "module",
          id: "2.2",
          title: "one to one 分配如何选出唯一正样本？",
          desc: "从全部空间点开始，依次经过几何筛选、任务对齐分配（TAL）的首轮 top-k=7 和第二轮 top-k=1，观察候选集合如何缩减。",
          componentId: "assignment-steps"
        }
      ],
      insight: "默认推理要移除 NMS，训练阶段需要把一个标注目标的高置信责任收缩到唯一预测。",
      formula: {
        lead: "Progressive Loss 决定一对多分支和一对一分支在每个训练轮次所占的损失权重。",
        unicode: "L<sub>total</sub> = α(t)L<sub>one to many</sub> + [1 − α(t)]L<sub>one to one</sub>",
        symbols: [
          {
            sym: "α(t)",
            desc: "一对多分支的权重；默认实现从 0.8 线性降到 0.1。"
          },
          {
            sym: "L_one to many",
            desc: "一对多分支的检测损失。"
          },
          {
            sym: "L_one to one",
            desc: "一对一推理分支的检测损失。"
          }
        ]
      },
      takeaways: [
        {
          icon: "1",
          title: "唯一责任",
          desc: "one to one 分配让每个标注目标只对应一个高置信正样本。"
        },
        {
          icon: "＋",
          title: "丰富监督",
          desc: "one to many 分配在训练早期提供更密集的正样本信号。"
        },
        {
          icon: "↘",
          title: "渐进转移",
          desc: "Progressive Loss 逐步提高 one to one 分支的训练权重。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "DFL 如何预测边界距离，YOLO26 为什么移除它？",
      badge: "both",
      badgeLabel: "训练与推理",
      bridge: "决定“谁负责”之后，还要回答负责该目标的 point 如何表示四条边的距离。",
      analogy: {
        title: "守卫如何描述嫌犯离边界多远？",
        text: "使用 DFL 时，守卫给 0 到 15 的距离刻度分别填写可信权重，再上报归一化后的加权距离；直接回归则上报一个连续数值。两种方式都用于确定可疑区域的四条边。",
        componentId: "photo-ana-3"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "为什么使用 DFL？",
          desc: "为 0 到 15 的每个离散位置设置非负权重。系统先将权重归一化，再计算 Σ(i×pᵢ)，得到连续的单边距离。",
          componentId: "dfl-distance-explorer"
        },
        {
          kind: "module",
          id: "3.2",
          title: "移除 DFL 后，成本、范围和精度如何变化？",
          desc: "四个视图分别展示头部参数成本、单层回归范围，以及 640 和 1280 分辨率下的同协议对照结果。",
          componentId: "dfl-evidence-modes"
        }
      ],
      insight: "移除 DFL 可以减少检测头参数并解除固定回归范围；最终精度由直接回归、L1、STAL 等训练设计共同决定。",
      formula: {
        lead: "DFL 通过离散分布的期望得到连续的单边距离。",
        unicode: "d = Σ<sub>i=0</sub><sup>K−1</sup> i·softmax(z)<sub>i</sub>",
        symbols: [
          {
            sym: "d",
            desc: "乘特征层步长之前的单边距离，范围为 [0,K−1]。"
          },
          {
            sym: "K",
            desc: "离散位置数量；本例使用 16 个位置，对应 0 到 15。"
          },
          {
            sym: "z",
            desc: "K 个回归分数，经 softmax 转换为总和为 1 的概率。"
          }
        ]
      },
      takeaways: [
        {
          icon: "▥",
          title: "分布式回归",
          desc: "DFL 用离散位置的概率分布表达连续距离，并通过加权求和得到预测值。"
        },
        {
          icon: "↔",
          title: "成本与范围",
          desc: "每条边需要输出 K 个回归分数，同时具有固定的可表示范围。"
        },
        {
          icon: "⚖",
          title: "系统级判断",
          desc: "直接回归的效果依赖 L1、STAL 等配套训练设计。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "极小目标连正样本都没有怎么办？",
      badge: "trn",
      badgeLabel: "训练重点",
      bridge: "one to many 和 one to one 分配都要先找到几何候选；极小标注框有时不包含任何候选点。",
      analogy: {
        title: "嫌犯太小，恰好躲在巡逻点之间",
        text: "极小嫌犯可能落在几名守卫的站位之间，导致没有守卫进入候选名单。STAL 临时扩大搜寻参考区，让附近守卫获得报告资格；训练仍以嫌犯的<b>真实边界</b>计算匹配和回归。",
        componentId: "photo-ana-4"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "拖动极小标注框，观察候选数如何从 0 恢复",
          desc: "<b>先读论文图：</b>Figure 5 从左到右依次是 TAL 基线、使用 s<sub>ref</sub>=16 的 STAL、真实标注；三幅图都采用 0.25 置信度阈值。中图相较左图找回了更多小目标，检测框也更贴近右图的真实标注。<br/><b>再做交互：</b>在 stride=8 的网格上拖动 5×6 像素标注框。打开 STAL 后，候选筛选临时使用 16×16 参考框，因此原本为 0 的候选数可以恢复；匹配评分与边界框回归仍使用原始标注框。",
          componentId: "tiny-gt-drag",
          figure: "/images/stal-qualitative.png"
        }
      ],
      insight: "STAL 只在候选筛选阶段扩大参考区域；训练目标和回归边界继续使用原始标注框。",
      formula: {
        lead: "仅在候选筛选时，小于最小 stride 的边会使用参考尺寸。",
        unicode: "d̃<sub>i</sub> = s<sub>ref</sub>（d<sub>i</sub> &lt; s<sub>min</sub>），否则为 d<sub>i</sub>",
        symbols: [
          {
            sym: "d̃_i",
            desc: "候选筛选阶段使用的参考框宽或高。"
          },
          {
            sym: "s_ref",
            desc: "默认三层金字塔下为 16。"
          },
          {
            sym: "s_min",
            desc: "默认 strides=[8,16,32] 时为 8。"
          }
        ]
      },
      takeaways: [
        {
          icon: "0",
          title: "零候选",
          desc: "极小标注框可能不包含任何网格中心点。"
        },
        {
          icon: "▧",
          title: "只改筛选",
          desc: "STAL 的参考框只参与候选点筛选。"
        },
        {
          icon: "✓",
          title: "目标仍真实",
          desc: "匹配评分和边界回归继续使用原始标注框。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "MuSGD 为什么能让训练更快？",
      badge: "trn",
      badgeLabel: "训练重点",
      bridge: "前面解决了训练信号从哪里来，接着看梯度如何真正更新模型参数。",
      analogy: {
        title: "训练官如何校准守卫的更新方向？",
        text: "训练反馈会从多个方向修正守卫的判断，有些方向过强、有些方向过弱。Muon 调整高维更新的方向尺度，MuSGD 再把这种更新与 SGD 结合，用于训练不同类型的参数。",
        componentId: "photo-ana-5"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "同一个更新矩阵，SGD、Muon 和 MuSGD 会怎样处理？",
          desc: "切换优化器，比较奇异方向、矩阵变换与更新路径。图中的 σ=[10,2,0.1] 用于展示三个更新方向的强弱差异。",
          componentId: "musgd-spectrum"
        }
      ],
      insight: "Table 4 的同协议实验显示：MuSGD 训练 500 个 epoch 得到 47.4 mAP，SGD 训练 600 个 epoch 得到 47.0 mAP。",
      formula: {
        lead: "SVD 把更新矩阵分解为输入方向、方向强度和输出方向。",
        unicode: "M = UΣVᵀ，Mv<sub>i</sub> = σ<sub>i</sub>u<sub>i</sub>",
        symbols: [
          {
            sym: "M",
            desc: "概念性的 momentum-derived 高维更新矩阵。"
          },
          {
            sym: "Σ",
            desc: "非负奇异值组成的对角矩阵。"
          },
          {
            sym: "U",
            desc: "输出奇异方向。"
          },
          {
            sym: "V",
            desc: "输入奇异方向。"
          }
        ]
      },
      takeaways: [
        {
          icon: "⊥",
          title: "改善方向条件",
          desc: "Muon 对高维更新做近似正交化。"
        },
        {
          icon: "＋",
          title: "混合更新",
          desc: "MuSGD 对高维权重混合 Muon 与 SGD。"
        },
        {
          icon: "≈",
          title: "受控实验结果",
          desc: "MuSGD：500 epoch / 47.4 mAP；SGD：600 epoch / 47.0 mAP。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "把 YOLO26 整体重新拼起来",
      badge: "both",
      badgeLabel: "训练与推理",
      bridge: "理解训练分配、边界回归、小目标监督和参数优化后，再把这些环节放回完整系统。",
      analogy: {
        title: "训练演习和正式执勤使用不同编制",
        text: "演习时，one to many 分支让多名守卫获得监督，one to one 分支学习唯一报告责任；正式执勤时，默认端到端路径只接收 one to one 分支的报告。",
        componentId: "photo-ana-6"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "点一个组件，看它影响训练还是推理",
          desc: "点击架构节点并切换训练/推理阶段，观察组件高亮、真实路径、输出和说明同时改变。",
          componentId: "architecture-explorer"
        }
      ],
      insight: "YOLO26 的改进分布在分配、回归、损失调度和优化器等多个训练环节。",
      takeaways: [
        {
          icon: "⌘",
          title: "多处协同",
          desc: "分配、回归、损失和优化器位于不同环节。"
        },
        {
          icon: "⇉",
          title: "双头分工",
          desc: "one to many 分支提供密集监督，one to one 分支负责默认端到端推理。"
        },
        {
          icon: "✓",
          title: "没有额外后处理",
          desc: "STAL、Progressive Loss 与 MuSGD 都不会成为推理后处理。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "主干之外：不同任务如何扩展？",
      badge: "both",
      badgeLabel: "训练与推理",
      bridge: "目标检测给出类别和边界框；第 7 章进一步介绍像素级分割、人体关键点、旋转目标和开放词汇检测分别解决什么问题。",
      analogy: {
        title: "同一支卫队，配备不同侦查装备",
        text: "基础守卫网络负责观察现场；专用装备分别描出嫌犯轮廓、定位身体关键点、标记倾斜区域，或根据通缉令中的文字与图片寻找新目标。",
        componentId: "photo-ana-7"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "同一套 YOLO26 特征如何服务四类视觉任务？",
          desc: "切换四个任务，先了解它们要输出什么、适合什么场景，再查看相应的任务头、损失函数和论文实验结果。",
          componentId: "task-extension-selector"
        }
      ],
      insight: "四个任务复用 YOLO26 的特征提取部分，并针对掩膜、关键点、旋转角度或开放类别增加专用输出。",
      takeaways: [
        {
          icon: "◉",
          title: "共享核心",
          desc: "多个任务复用 YOLO26 的 backbone、neck 与检测基础。"
        },
        {
          icon: "＋",
          title: "专用设计",
          desc: "实例分割、姿态估计和旋转框检测的专用设计主要位于各自的任务头或损失函数。"
        },
        {
          icon: "↗",
          title: "开放词汇",
          desc: "YOLOE-26 在共享检测器上增加提示与数据引擎能力。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "这些设计最终真的值得吗？",
      badge: "both",
      badgeLabel: "结果与权衡",
      bridge: "在单组件证据之后，用同一推理协议评估完整 YOLO26 的精度、延迟与部署选择。",
      analogy: {
        title: "指挥中心按任务目标调度卫队",
        text: "追求最快响应、最高识别精度或省去 NMS 合并流程时，指挥中心会选择不同规模的模型和推理协议。",
        componentId: "photo-ana-8"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "你更看重检测精度、延迟，还是无 NMS 部署？",
          desc: "选择部署目标并启动比较。散点与表格均来自 COCO 640、T4 TensorRT10 的论文 Table 7。",
          componentId: "result-competition"
        }
      ],
      insight: "比较模型时需要固定输入尺寸、运行硬件、指标方向和推理协议，再读取精度与延迟。",
      takeaways: [
        {
          icon: "◎",
          title: "核心贡献",
          desc: "YOLO26 重做分配、回归和训练优化，但没有放弃 dense detection。"
        },
        {
          icon: "⚖",
          title: "条件性优势",
          desc: "多项提升来自组合设计；DFL-free、STAL 与 MuSGD 分别针对特定训练或部署环节。"
        },
        {
          icon: "⌁",
          title: "部署折中",
          desc: "无 NMS 部署、最高 AP、模型规模、延迟和训练成本需要一起权衡。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1P4r9BfEfu",
      title: "YOLO26 创新点解析、训练与推理",
      reason: "从创新点到训练实践的整体导览。",
      cover: "https://i0.hdslb.com/bfs/archive/bc817f3d74b2c1fffb41f4286d1489618e4d7099.jpg",
      views: "1.4万播放"
    },
    {
      bvid: "BV1nJcxzbEA2",
      title: "ProgLoss 与 STAL：问题和解决方案",
      reason: "聚焦论文两项训练机制的细节。",
      cover: "https://i2.hdslb.com/bfs/archive/f1ffb11f412800312e90ad4d16d8fd76e3bc6a7e.jpg",
      views: "1816播放"
    },
    {
      bvid: "BV1ver4BuEmK",
      title: "YOLO26 在 RDK 上的部署",
      reason: "补充端侧真实部署视角。",
      cover: "https://i1.hdslb.com/bfs/archive/87dc6d444e10cde3f16c77742834f94f373aace8.jpg",
      views: "4211播放"
    },
    {
      bvid: "BV1EZwjzvECK",
      title: "YOLO26 裂缝分割：训练、推理与部署",
      reason: "展示任务扩展的应用路径。",
      cover: "https://i1.hdslb.com/bfs/archive/3feebfe7783bdd089d3e540b29779fb49d6cb932.jpg",
      views: "6517播放"
    }
  ]
};
