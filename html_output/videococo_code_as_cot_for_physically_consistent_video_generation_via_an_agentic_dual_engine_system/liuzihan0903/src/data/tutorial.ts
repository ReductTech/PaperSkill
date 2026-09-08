import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "VideoCoCo: Code-as-CoT for Physically-Consistent Video Generation via an Agentic Dual-Engine System",
    titleZh: "VideoCoCo：以可执行代码外显物理过程，再生成高保真视频",
    venue: "arXiv · 2026年8月",
    authors: "Haodong Li、Tianfei Ren、Xiaoxiao Ma 等",
    affiliation: "CUHK、USTC、SCUT、HKU、NTU、PKU、SJTU、CMU、THU、HUST、MBZUAI",
    domain: "物理一致视频生成 · Agentic System",
    coreProblem: "文本提示高度压缩，无法直接指定完整的时空演化；直接文本到视频模型因此同时承担过程推理与外观合成。",
    coreInsight: "VideoCoCo 先让编码智能体生成并执行 <b>Blender Python</b>，得到确定性的低保真时空草稿，再由生成式视频引擎联合草稿与编辑指令完成高保真实现。",
    keywords: [
      "Code-as-CoT",
      "Causal Opacity",
      "双引擎",
      "VideoCoCo-3K"
    ]
  },
  hero: {
    oldMethod: {
      desc: "文本直接进入视频生成器：一个模型同时补全过程并合成外观。",
      componentId: "videococo-lab"
    },
    newMethod: {
      desc: "提示 → 可执行代码 → 时空草稿 → 高保真视频：先落实过程，再实现外观。",
      componentId: "videococo-lab"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "问题从哪里来：因果不透明性",
      badge: "inf",
      badgeLabel: "理解问题",
      bridge: "先不看模型结构，先回答论文的起点：为什么画面看起来真实，运动过程仍可能不符合提示中的物理动态？",
      analogy: {
        title: "固定机位记录一次压缩",
        text: "实验台上只观察泡棉被压下这一动作。这个视觉动作仅用于突出<b>中间状态与时间顺序</b>，不替代论文概念。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "提示里究竟缺了什么？",
          desc: "调节提示中显式给出的过程信息，观察仍需由生成器隐式补全的部分。该交互解释论文所称的 <b>Causal Opacity</b>，不把教学刻度当作实验数值。",
          componentId: "videococo-lab"
        }
      ],
      insight: "文本提示压缩了事件语义，却没有显式给出完整中间状态和时间演化。",
      takeaways: [
        {
          icon: "🎯",
          title: "压缩意图",
          desc: "提示只给出高度压缩的事件语义。"
        },
        {
          icon: "🔧",
          title: "双重负担",
          desc: "生成器同时承担过程推理与外观合成。"
        },
        {
          icon: "✓",
          title: "核心问题",
          desc: "需要在最终生成前外显隐含过程。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "视频生成中的四类 CoT",
      badge: "inf",
      badgeLabel: "理解差异",
      bridge: "既然直接生成缺少过程约束，已有方法已经在使用计划、候选或中间视觉状态；这一章只比较中间表示形式。",
      analogy: {
        title: "选择观察角度",
        text: "同一泡棉实验从不同角度被观察，但过程本身没有改变。这里对应的是<b>中间表示视角</b>的差别。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "切换 CoT 范式",
          desc: "切换论文图 1 中的四类范式，主图保持 Prompt 与 Video 两端不动，只替换中间表示与反馈，避免把先前工作描述为“错误”。",
          componentId: "videococo-lab",
          figure: "./images/figure-1.png"
        }
      ],
      insight: "VideoCoCo 与规划、测试时搜索、视觉状态三类 CoT 的关键差异在中间表示是否完整、可执行和可检查。",
      takeaways: [
        {
          icon: "🎯",
          title: "规划 CoT",
          desc: "使用文本计划、关键帧或布局。"
        },
        {
          icon: "🔧",
          title: "视觉/搜索 CoT",
          desc: "通过中间状态或候选修订推理。"
        },
        {
          icon: "✓",
          title: "Code-as-CoT",
          desc: "执行代码并渲染稠密时空草稿。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "为什么把 Code 作为 CoT",
      badge: "inf",
      badgeLabel: "核心洞见",
      bridge: "四类范式的差异落到一个问题：为什么 VideoCoCo 不选更长的文字计划，而选可运行的 Blender 程序？",
      analogy: {
        title: "沿轮廓描线",
        text: "沿可见轮廓检查一次形变记录，强调的是过程能够被<b>读出与复查</b>；技术含义仍以代码性质为准。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "显式、可执行、可检查",
          desc: "点击三项性质，查看它们分别约束代码中的对象/运动声明、可运行承诺和可编辑复执行能力。",
          componentId: "videococo-lab"
        }
      ],
      insight: "Blender Python 作为推理表示具有显式、可执行、可检查三项论文明确强调的性质。",
      takeaways: [
        {
          icon: "🎯",
          title: "显式",
          desc: "对象、运动和交互必须被声明。"
        },
        {
          icon: "🔧",
          title: "可执行",
          desc: "程序提交到一个实际可运行过程。"
        },
        {
          icon: "✓",
          title: "可检查",
          desc: "代码能够阅读、编辑和重新执行。"
        }
      ],
      formula: {
        lead: "编码智能体把文本提示映射为自包含 Blender 程序。",
        unicode: "c = A_code(p)",
        symbols: [
          {
            sym: "p",
            desc: "文本提示；字符串输入。"
          },
          {
            sym: "A_code",
            desc: "编码智能体；从提示到程序的映射。"
          },
          {
            sym: "c",
            desc: "自包含 Blender Python 程序。"
          }
        ]
      }
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "可执行仿真引擎",
      badge: "both",
      badgeLabel: "方法机制",
      bridge: "代码能够运行并不等于过程已经可见；还需要在受控环境中执行并把每个时刻渲染成草稿。",
      analogy: {
        title: "读取一次形变刻度",
        text: "读出一个连续动作的当前状态，强调草稿覆盖<b>从初态到结果</b>的稠密过程。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "从提示走到时空草稿",
          desc: "逐步推进文本提示、编码智能体、Blender 程序、沙箱执行和时空草稿，当前路径、节点、等式与反馈同步更新。",
          componentId: "videococo-lab"
        }
      ],
      insight: "编码智能体写程序，受控 Blender 沙箱执行程序并渲染确定性的低保真、时序稠密草稿。",
      takeaways: [
        {
          icon: "🎯",
          title: "受控执行",
          desc: "沙箱提供标准化原语和诊断信号。"
        },
        {
          icon: "🔧",
          title: "低保真",
          desc: "草稿不承担复杂材质与光照。"
        },
        {
          icon: "✓",
          title: "时序稠密",
          desc: "每一帧对应程序实例化的状态。"
        }
      ],
      formula: {
        lead: "阶段 1 先合成程序，再执行得到草稿。",
        unicode: "c = A_code(p),   d = B(c)",
        symbols: [
          {
            sym: "B",
            desc: "受控 Blender 沙箱执行与渲染。"
          },
          {
            sym: "d",
            desc: "确定性的低保真时空草稿。"
          },
          {
            sym: "c",
            desc: "上一式得到的 Blender 程序。"
          }
        ]
      }
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "双引擎：过程与外观解耦",
      badge: "both",
      badgeLabel: "总体框架",
      bridge: "阶段 1 已经回答发生什么以及何时发生，但白模草稿还不是最终视频；第二引擎只需解决它应该看起来怎样。",
      analogy: {
        title: "调整一次补光",
        text: "物体运动不变，只调整照明来观察外观变化，直观呈现<b>过程固定、外观实现</b>的分工。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "切换两台引擎的职责",
          desc: "在论文原始方法图下切换阶段 1 与阶段 2，高亮对应引擎、活动路径和职责说明。",
          componentId: "videococo-lab",
          figure: "./images/figure-2.png"
        }
      ],
      insight: "可执行仿真引擎负责过程级动态，生成式视频引擎负责高保真视觉实现。",
      takeaways: [
        {
          icon: "🎯",
          title: "阶段 1",
          desc: "可执行草稿提供过程级动态。"
        },
        {
          icon: "🔧",
          title: "阶段 2",
          desc: "视频编辑器提供高保真外观。"
        },
        {
          icon: "✓",
          title: "解耦",
          desc: "不再让一个生成器同时从头完成两项任务。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "Instruction Agent 与草稿条件编辑",
      badge: "inf",
      badgeLabel: "生成阶段",
      bridge: "草稿说明了过程，但白模没有足够的外观信息；原始提示又过于压缩，因此需要专门的编辑指令。",
      analogy: {
        title: "按帧记录同一动作",
        text: "保持泡棉压缩的时间轨迹，只改变记录画面的视觉条件，强调两类条件的<b>职责互补</b>。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "d 与 e 分别控制什么？",
          desc: "切换仅草稿、仅指令和论文方法的联合条件，观察结构锚点与外观描述缺失时的职责差异。前两种是教学性的职责缺失示意，不是论文报告的数值消融。",
          componentId: "videococo-lab"
        }
      ],
      insight: "指令智能体联合提示与草稿生成外观指令，编辑器再以草稿和指令为条件生成最终视频。",
      takeaways: [
        {
          icon: "🎯",
          title: "草稿 d",
          desc: "固定时空结构和运动演化。"
        },
        {
          icon: "🔧",
          title: "指令 e",
          desc: "描述主体、材质、光照与镜头风格。"
        },
        {
          icon: "✓",
          title: "联合条件",
          desc: "编辑器对已实例化过程做高保真实现。"
        }
      ],
      formula: {
        lead: "指令智能体先构造外观指令，编辑器再联合两类条件。",
        unicode: "e = A_edit(p,d),   v̂ = G_θ(d,e)",
        symbols: [
          {
            sym: "e",
            desc: "外观聚焦的编辑指令。"
          },
          {
            sym: "A_edit",
            desc: "读取提示 p 与草稿 d 的指令智能体。"
          },
          {
            sym: "G_θ",
            desc: "参数为 θ 的草稿条件视频编辑器。"
          },
          {
            sym: "v̂",
            desc: "最终高保真视频。"
          }
        ]
      }
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "VideoCoCo-3K 三元组数据",
      badge: "trn",
      badgeLabel: "数据构建",
      bridge: "草稿与自然视频分布不同，现成编辑器可能忽略草稿运动；因此需要把同一过程的草稿、外观指令和高保真目标对齐。",
      analogy: {
        title: "配对同一次实验记录",
        text: "把同一泡棉过程的草稿、文字说明和高保真记录对齐，直接对应数据集的<b>三元组结构</b>。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "查看一组三元组样例",
          desc: "使用用户提供的 edit_prompt.txt、video.mp4 与 seedance.mp4。按文件语义将 video.mp4 呈现为草稿、seedance.mp4 呈现为高保真目标，并保留完整编辑指令供展开查看。",
          componentId: "videococo-lab"
        }
      ],
      insight: "3,000 个草稿-指令-目标三元组为草稿条件编辑提供对齐监督。",
      takeaways: [
        {
          icon: "🎯",
          title: "规模",
          desc: "数据集包含 3,000 个对齐三元组。"
        },
        {
          icon: "🔧",
          title: "教师",
          desc: "论文使用 Seedance 2.0 产生高保真目标。"
        },
        {
          icon: "✓",
          title: "隔离评测",
          desc: "评测提示及近重复项被排除。"
        }
      ],
      formula: {
        lead: "教师编辑器从草稿与指令产生目标，3,000 个样本组成数据集。",
        unicode: "y_i = G_T(d_i,e_i),   D = {(d_i,e_i,y_i)}_{i=1}^{3000}",
        symbols: [
          {
            sym: "G_T",
            desc: "论文实例化为 Seedance 2.0 的高保真教师编辑器。"
          },
          {
            sym: "y_i",
            desc: "第 i 个高保真目标视频。"
          },
          {
            sym: "D",
            desc: "VideoCoCo-3K 三元组集合。"
          }
        ]
      }
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "编辑器适配与完整架构",
      badge: "trn",
      badgeLabel: "训练与结构",
      bridge: "有了三元组，还需让编辑器学会在保持草稿运动的同时生成目标外观；这一章把训练条件放回完整架构。",
      analogy: {
        title: "检查实验记录的每一步",
        text: "逐项检查一条记录链，保持所有节点在同一实验设置中，避免把真实架构做成静态流程图。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "点击组件，追踪活动路径",
          desc: "点击编码智能体、Blender 沙箱、指令智能体或视频编辑器，当前节点、上游活动路径、对应等式和说明同步更新。",
          componentId: "videococo-lab"
        }
      ],
      insight: "编辑器在三元组上优化条件去噪目标，完整系统由两个智能体、Blender 沙箱和草稿条件编辑器组成。",
      takeaways: [
        {
          icon: "🎯",
          title: "条件",
          desc: "草稿 d 与编辑指令 e 同时进入编辑器。"
        },
        {
          icon: "🔧",
          title: "目标",
          desc: "采用标准条件去噪损失。"
        },
        {
          icon: "✓",
          title: "适配",
          desc: "论文比较免调参、全量微调与 LoRA。"
        }
      ],
      formula: {
        lead: "目标视频潜变量加噪后，编辑器预测噪声并以草稿和指令为条件。",
        unicode: "L(θ) = E[‖ε − ε_θ(z_t,t,d,e)‖²₂],   ε ~ N(0,I)",
        symbols: [
          {
            sym: "z_t",
            desc: "目标潜变量 z₀ 在时间步 t 的加噪版本。"
          },
          {
            sym: "ε",
            desc: "服从 N(0,I) 的高斯噪声。"
          },
          {
            sym: "ε_θ",
            desc: "以 z_t、t、d、e 为输入的噪声预测器。"
          },
          {
            sym: "θ",
            desc: "被适配的视频编辑器参数。"
          }
        ]
      }
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "端到端推理、适用边界与局限",
      badge: "trn",
      badgeLabel: "使用判断",
      bridge: "完整结构能够自动运行，但“自动”不等于没有代价，也不等于任意物理现象都能被 Blender 零样本表达。",
      analogy: {
        title: "测试一次实验边界",
        text: "让同一实验对象接近可观察边界，强调方法结论带有<b>仿真器表达范围</b>这一条件。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "切换适用情形与论文局限",
          desc: "在可表达过程、复杂湍流和推理延迟三种情形间切换，只显示论文明确陈述的定性边界，不发明速度或成功率。",
          componentId: "videococo-lab"
        }
      ],
      insight: "用户推理时只需文本提示，但系统增加仿真时延并受底层 Blender 表达能力约束。",
      takeaways: [
        {
          icon: "🎯",
          title: "输入",
          desc: "用户在推理时只需文本提示。"
        },
        {
          icon: "🔧",
          title: "代价",
          desc: "执行仿真引入额外推理延迟。"
        },
        {
          icon: "✓",
          title: "边界",
          desc: "复杂湍流受 Blender 表达能力限制。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "实验：定性、定量与消融证据",
      badge: "both",
      badgeLabel: "结果与局限",
      bridge: "前九章解释了方法为何可能有效；最后只回答论文实际报告了什么，并把不同协议、指标单位和结论边界分开。",
      analogy: {
        title: "完成同一实验的对比记录",
        text: "在同一标尺下完成基线与 VideoCoCo 对比；这里只帮助读取<b>越高越好</b>的已验证指标。",
        componentId: "videococo-lab"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "两项基准的结果对比",
          desc: "选择 PhyGenBench 或 VBench-2.0 后启动结果比较。两套协议分别使用 [0,1] 一致性得分与百分比物理维度得分，不跨协议混合刻度。",
          componentId: "videococo-lab",
          figure: "./images/figure-3.png"
        },
        {
          kind: "module",
          id: "10.2",
          title: "草稿与调参分别贡献多少？",
          desc: "切换 OmniWeaving、Tune-Free、Full-Tune 与 LoRA-Tune，读取 Table 3 的精确 PhyGenBench 平均分。所有变体共享同一可执行草稿生成管线，仅编辑器适配不同。",
          componentId: "videococo-lab"
        }
      ],
      insight: "论文在两项物理基准上提高平均分，定性图展示四类过程，消融区分可执行草稿与编辑器适配的贡献。",
      takeaways: [
        {
          icon: "🎯",
          title: "定量",
          desc: "两项基准平均分均高于 OmniWeaving。"
        },
        {
          icon: "🔧",
          title: "定性",
          desc: "Figure 3 覆盖塌缩、升华、破碎与浮力。"
        },
        {
          icon: "✓",
          title: "消融",
          desc: "草稿与编辑器适配提供互补贡献。"
        }
      ]
    }
  ]
};
