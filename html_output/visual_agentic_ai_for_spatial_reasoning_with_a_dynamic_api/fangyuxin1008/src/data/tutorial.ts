import type { TutorialData } from '../types';
export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Visual Agentic AI for Spatial Reasoning with a Dynamic API",
    "titleZh": "VADAR：用动态 API 理解三维空间",
    "venue": "",
    "authors": "Damiano Marsili、Rohun Agrawal、Yisong Yue、Georgia Gkioxari",
    "affiliation": "加州理工学院",
    "domain": "视觉空间推理",
    "coreProblem": "认出物体，不等于能回答多步三维空间问题。",
    "coreInsight": "先构建可复用的空间函数，再通过程序和视觉工具回答复杂问题。",
    "keywords": [
      "动态 API",
      "两阶段协作",
      "实验边界"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "固定 API：依赖预先定义的功能；<br/>遇到缺少适用组合的新问题时，扩展受限。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "先扩展函数库，再合成并执行程序。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "takeaways": [
        {
          "icon": "✓",
          "title": "问题在关系链",
          "desc": "识别、测量与运算缺一不可。"
        },
        {
          "icon": "✓",
          "title": "可检查的程序",
          "desc": "中间步骤让推理过程可以追踪。"
        },
        {
          "icon": "✓",
          "title": "示例有假设",
          "desc": "投影模型用于教学，不能代替真实测量。"
        }
      ],
      "id": "chap-1",
      "kind": "chapter",
      "bridge": "认出桌子只是开始：若问题给出一个假设尺寸，还要把像素、深度和参照物联系起来。先观察同样大的投影为什么不代表同样高的家具。",
      "analogy": {
        "title": "看得见，不等于量得准",
        "componentId": "analogy-1",
        "text": "认出桌子只是开始：若问题给出一个假设尺寸，还要把像素、深度和参照物联系起来。先观察同样大的投影为什么不代表同样高的家具。"
      },
      "badge": "inf",
      "insight": "识别出物体并不足以回答三维尺寸问题。",
      "title": "看得见，不等于量得准",
      "modules": [
        {
          "title": "同一张投影，两种判断",
          "desc": "识别出物体并不足以回答三维尺寸问题。",
          "id": "1.1",
          "componentId": "vadar-1-1",
          "kind": "module"
        }
      ],
      "badgeLabel": "问题与核心直觉"
    },
    {
      "takeaways": [
        {
          "icon": "✓",
          "title": "基础API",
          "desc": "视觉模型先提供可调用的基本能力。"
        },
        {
          "icon": "✓",
          "title": "任务有区别",
          "desc": "CLEVR的大小类别不同于真实场景尺寸。"
        },
        {
          "icon": "✓",
          "title": "误差会传递",
          "desc": "错误的视觉输入仍会污染后续答案。"
        }
      ],
      "id": "chap-2",
      "kind": "chapter",
      "bridge": "尺寸推理需要线索；VADAR 用预训练视觉模块提供位置、深度、属性与二维尺寸，再由程序组合。",
      "analogy": {
        "title": "把图像变成可调用的线索",
        "componentId": "analogy-2",
        "text": "尺寸推理需要线索；VADAR 用预训练视觉模块提供位置、深度、属性与二维尺寸，再由程序组合。"
      },
      "badge": "inf",
      "insight": "区分感知输出与空间推理。",
      "title": "把图像变成可调用的线索",
      "modules": [
        {
          "title": "选择你要读取的线索",
          "desc": "区分感知输出与空间推理。",
          "id": "2.1",
          "componentId": "vadar-2-1",
          "kind": "module"
        }
      ],
      "badgeLabel": "输入与视觉专用模块"
    },
    {
      "takeaways": [
        {
          "icon": "✓",
          "title": "先建API",
          "desc": "先实现公共子问题，再合成解题程序。"
        },
        {
          "icon": "✓",
          "title": "按需扩展",
          "desc": "不是为每个问题都重新生成整套工具。"
        },
        {
          "icon": "✓",
          "title": "仍需验证",
          "desc": "函数名合理并不保证实现语义正确。"
        }
      ],
      "id": "chap-3",
      "kind": "chapter",
      "bridge": "基础工具能读出线索，却未必直接回答“谁在谁后面”。VADAR先生成可复用函数，再用它们写解题程序。",
      "analogy": {
        "title": "让 API 随问题长出来",
        "componentId": "analogy-3",
        "text": "基础工具能读出线索，却未必直接回答“谁在谁后面”。VADAR先生成可复用函数，再用它们写解题程序。"
      },
      "badge": "inf",
      "insight": "理解动态扩展与无API单次长程序的区别。",
      "title": "让 API 随问题长出来",
      "modules": [
        {
          "title": "固定工具，还是补齐函数",
          "desc": "理解动态扩展与无API单次长程序的区别。",
          "id": "3.1",
          "componentId": "vadar-3-1",
          "kind": "module"
        }
      ],
      "badgeLabel": "动态API关键洞见"
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "像素尺寸怎样关联三维尺寸",
      "badge": "both",
      "badgeLabel": "数学机制",
      "bridge": "有了二维尺寸与深度，还需要把它们放进同一个比例中。下面只推导参考物约束下的教学近似，不把像素乘深度当作通用米制测量。",
      "analogy": {
        "title": "像素尺寸怎样关联三维尺寸",
        "componentId": "analogy-4",
        "text": "有了二维尺寸与深度，还需要把它们放进同一个比例中。下面只推导参考物约束下的教学近似，不把像素乘深度当作通用米制测量。"
      },
      "modules": [
        {
          "title": "只改变目标深度",
          "desc": "用一个控制同时理解家具比例与几何计算。",
          "id": "4.1",
          "componentId": "vadar-4-1",
          "kind": "module"
        }
      ],
      "insight": "用一个控制同时理解家具比例与几何计算。",
      "takeaways": [
        {
          "icon": "📐",
          "title": "先讲条件",
          "desc": "同焦距与可比较方向支撑这一简化比例。"
        },
        {
          "icon": "📐",
          "title": "题设尺度",
          "desc": "输出遵循参考物的假设尺寸。"
        },
        {
          "icon": "📐",
          "title": "不是万能重建",
          "desc": "姿态、遮挡与感知误差仍然存在。"
        }
      ],
      "formula": {
        "lead": "在同一焦距、可比较的投影尺寸与有效参照下，像素尺寸和深度的乘积可形成相对尺寸比例。该比例成立需要上述几何假设。",
        "unicode": "Hₜ = Hᵣ × (pₜ zₜ) / (pᵣ zᵣ)",
        "symbols": [
          {
            "sym": "Hₜ",
            "desc": "目标在题设参考尺度下的估计高度，单位米。"
          },
          {
            "sym": "Hᵣ",
            "desc": "题设给定的参考物高度，单位米，不一定是真实物理尺寸。"
          },
          {
            "sym": "pₜ",
            "desc": "目标的可比较投影尺寸，像素。"
          },
          {
            "sym": "pᵣ",
            "desc": "参考物的可比较投影尺寸，像素。"
          },
          {
            "sym": "zₜ",
            "desc": "目标深度，与参考深度采用同一单位。"
          },
          {
            "sym": "zᵣ",
            "desc": "参考深度，必须为正；同焦距在比值中约去。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "从问题提炼函数签名",
      "badge": "both",
      "badgeLabel": "API生成的条件与签名",
      "bridge": "比例只是一个子问题。怎样知道还需要哪些函数？Signature Agent从一批不带答案的问题里寻找可复用的功能。",
      "analogy": {
        "title": "从问题提炼函数签名",
        "componentId": "analogy-5",
        "text": "比例只是一个子问题。怎样知道还需要哪些函数？Signature Agent从一批不带答案的问题里寻找可复用的功能。"
      },
      "modules": [
        {
          "title": "哪些请求值得增加接口",
          "desc": "只在现有API不能组合满足需求时引入新的通用签名。",
          "id": "5.1",
          "componentId": "vadar-5-1",
          "kind": "module"
        }
      ],
      "insight": "只在现有API不能组合满足需求时引入新的通用签名。",
      "takeaways": [
        {
          "icon": "📐",
          "title": "只看问题",
          "desc": "主设置用15道问题，不提供答案。"
        },
        {
          "icon": "📐",
          "title": "避免重复",
          "desc": "当前API以文档字符串形式进入提示。"
        },
        {
          "icon": "📐",
          "title": "多样性优先",
          "desc": "签名阶段未用上下文示例，具体实现另行处理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "依赖没实现，就先补依赖",
      "badge": "inf",
      "badgeLabel": "实现与执行纠错",
      "bridge": "签名不是可执行代码。实现一个函数时，可能依赖另一个尚未实现的函数；VADAR用Python异常与深度优先实现处理这一问题。",
      "analogy": {
        "title": "依赖没实现，就先补依赖",
        "componentId": "analogy-6",
        "text": "签名不是可执行代码。实现一个函数时，可能依赖另一个尚未实现的函数；VADAR用Python异常与深度优先实现处理这一问题。"
      },
      "modules": [
        {
          "title": "沿依赖关系补齐实现",
          "desc": "看清未定义函数如何触发深度优先返回。",
          "id": "6.1",
          "componentId": "vadar-6-1",
          "kind": "module"
        }
      ],
      "insight": "看清未定义函数如何触发深度优先返回。",
      "takeaways": [
        {
          "icon": "📐",
          "title": "深度优先",
          "desc": "优先完成被依赖的基础函数。"
        },
        {
          "icon": "📐",
          "title": "异常是反馈",
          "desc": "测试者是Python解释器，不是另一个语言模型。"
        },
        {
          "icon": "📐",
          "title": "纠错有上限",
          "desc": "多次修订后仍存在的依赖环会被移除。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "不训练权重，也需要好的提示",
      "badge": "trn",
      "badgeLabel": "实现细节",
      "bridge": "上述流程没有新增目标任务权重训练，但这不等于毫无先验。系统依赖预训练模型，并用示例和自然语言说明提高生成质量。",
      "analogy": {
        "title": "不训练权重，也需要好的提示",
        "text": "上述流程没有新增目标任务权重训练，但这不等于毫无先验。系统依赖预训练模型，并用示例和自然语言说明提高生成质量。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "逐项加入提示策略",
          "desc": "按同一消融协议观察API与提示的增量。",
          "componentId": "vadar-7-1"
        }
      ],
      "insight": "按同一消融协议观察API与提示的增量。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "免训练的范围",
          "desc": "VADAR组合阶段不做目标任务监督训练。"
        },
        {
          "icon": "🔧",
          "title": "提示分工",
          "desc": "弱ICL讲接口用法，伪ICL讲自然语言推理策略。"
        },
        {
          "icon": "💡",
          "title": "协议要一致",
          "desc": "这里是CLEVR100子集，不能混入完整基准排行榜。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "两阶段系统怎样协作",
      "badge": "trn",
      "badgeLabel": "实现细节",
      "bridge": "现在把签名、实现、测试与解题程序连起来。先建库，后解题；图像在执行阶段被视觉模块读取。",
      "analogy": {
        "title": "两阶段系统怎样协作",
        "text": "现在把签名、实现、测试与解题程序连起来。先建库，后解题；图像在执行阶段被视觉模块读取。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "选择组件，追踪输入与输出",
          "desc": "理解真实架构与两条Python异常反馈回路。",
          "componentId": "vadar-8-1"
        }
      ],
      "insight": "理解真实架构与两条Python异常反馈回路。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两阶段",
          "desc": "API可在许多问题之间复用，建库成本可摊薄。"
        },
        {
          "icon": "🔧",
          "title": "不是五个LLM",
          "desc": "测试与执行角色是确定性的Python解释器。"
        },
        {
          "icon": "💡",
          "title": "改进仍是未来",
          "desc": "图像参与程序合成与自动选择专家并非现成功能。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "程序跑通，答案仍可能错",
      "badge": "both",
      "badgeLabel": "原理与实践",
      "bridge": "异常能暴露代码问题，却未必发现“把参照物也数进去”这样的语义错误。这里用可拖动的家具布局检验同一物体排除规则。",
      "analogy": {
        "title": "程序跑通，答案仍可能错",
        "text": "异常能暴露代码问题，却未必发现“把参照物也数进去”这样的语义错误。这里用可拖动的家具布局检验同一物体排除规则。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "排除参照物，才是在数“其他”",
          "desc": "体验一个不会触发Python异常的计数错误。",
          "componentId": "vadar-9-1"
        }
      ],
      "insight": "体验一个不会触发Python异常的计数错误。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "运行正确≠语义正确",
          "desc": "异常检查覆盖不了所有逻辑错误。"
        },
        {
          "icon": "🔧",
          "title": "身份也重要",
          "desc": "same_object用于排除参照物和重复对象。"
        },
        {
          "icon": "💡",
          "title": "误差有多种",
          "desc": "定位、深度、尺度换算与多步逻辑都会影响答案。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "读懂成绩，也读懂边界",
      "badge": "both",
      "badgeLabel": "原理与实践",
      "bridge": "最后把机制和证据对齐。先选择同一评测协议内的方法，再看精确数值；真实视觉、理想视觉与小样本消融各自回答不同问题。",
      "analogy": {
        "title": "读懂成绩，也读懂边界",
        "text": "最后把机制和证据对齐。先选择同一评测协议内的方法，再看精确数值；真实视觉、理想视觉与小样本消融各自回答不同问题。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "在同一协议内比较",
          "desc": "避免跨数据量、视觉条件与指标的无效排名。",
          "componentId": "vadar-10-1"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "浮点答案怎样计分",
          "desc": "理解MRA严格阈值与相对误差。",
          "componentId": "vadar-10-2"
        }
      ],
      "insight": "避免跨数据量、视觉条件与指标的无效排名。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "真实表现",
          "desc": "优于实验比较的两种静态API方法，但并非击败所有VLM。"
        },
        {
          "icon": "🔧",
          "title": "理想实验",
          "desc": "揭示感知瓶颈，不能当作实际系统成绩。"
        },
        {
          "icon": "💡",
          "title": "适用边界",
          "desc": "五步及以上推理仍困难；VSI的50.1%仅适用于75题单帧子集。"
        }
      ],
      "formula": {
        "lead": "对浮点型numeric(other)回答，评测在10个相对误差阈值上平均计分，越高越好。",
        "unicode": "MRA = (1 / |C|) Σ[ |ŷ − y| / y < 1 − θ ]，C = {0.50, 0.55, …, 0.95}",
        "symbols": [
          {
            "sym": "ŷ",
            "desc": "模型预测的数值，与真值单位相同。"
          },
          {
            "sym": "y",
            "desc": "正且非零的真值；不能把零代入分母。"
          },
          {
            "sym": "θ",
            "desc": "阈值，取0.50至0.95共10个值。"
          },
          {
            "sym": "C",
            "desc": "阈值集合；方括号是条件成立为1、否则为0的指示函数。"
          }
        ]
      }
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1wGuEz8Epv",
      "title": "什么是空间智能",
      "reason": "理解空间智能的基本问题。",
      "cover": "https://i1.hdslb.com/bfs/archive/26cbb1cd5fb3d60c8a17aa9aabc8976c39d31c2e.jpg",
      "views": "790播放"
    },
    {
      "bvid": "BV1RvqpB7EYG",
      "title": "开放世界下的类人视觉搜索与空间推理",
      "reason": "视觉搜索与空间推理讲座。",
      "cover": "https://i0.hdslb.com/bfs/archive/a111b6ea97c7ed1166e528decdae12b267d462c6.jpg",
      "views": "683播放"
    }
  ]
};
