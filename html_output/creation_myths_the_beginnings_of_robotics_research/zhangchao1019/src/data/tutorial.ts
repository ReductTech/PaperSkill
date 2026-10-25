import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Creation Myths: The Beginnings of Robotics Research",
    "titleZh": "创世神话：机器人研究的开端",
    "venue": "IEEE Robotics & Automation Magazine · 2012 · pp. 72–77",
    "authors": "Matthew T. Mason",
    "affiliation": "Carnegie Mellon University",
    "domain": "机器人学史 · 不确定性 · 结构化环境",
    "coreProblem": "单一起源叙事与工厂／厨房二分，会遮蔽机器人研究如何持续处理不确定性。",
    "coreInsight": "对照学科视角，以任务、机器人和可利用结构重新理解研究历史。",
    "keywords": [
      "研究起源",
      "柔顺控制",
      "结构化连续性"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "单一视角",
      "desc": "只用一束光，看见自己熟悉的历史。",
      "componentId": "museum-cover"
    },
    "newMethod": {
      "title": "对照史料",
      "desc": "移动视角，看见彼此延续的研究传统。",
      "componentId": "museum-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "研究边界",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "机器人研究的边界",
          "desc": "在机器史与研究共同体之间切换。",
          "componentId": "museum-scope"
        }
      ],
      "scenes": [
        {
          "id": "scope",
          "title": "机器人研究的边界",
          "goal": "先确定“起源”在讨论什么",
          "summary": "历史不是从第一台会动的机器自动开始。",
          "interaction": "在机器史与研究共同体之间切换。",
          "next": "选择证据，再选择起点。",
          "notes": "研究共同体而非古代机器。作者限定为持续、共同的科学研究活动 来源：印刷页 72，Origin of Robotics Research。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-scope",
          "moduleId": "1.1",
          "thumbnail": "./thumbnails/scope.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "多种起源与转向",
      "modules": [
        {
          "kind": "module",
          "id": "2.2",
          "title": "四种起源叙事",
          "desc": "选择四个学科视角。",
          "componentId": "museum-origins"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "计算机科学的几何转向",
          "desc": "改变位置与机器人半径，观察碰撞约束。",
          "componentId": "museum-planning"
        },
        {
          "kind": "module",
          "id": "2.4",
          "title": "创世与范式革命",
          "desc": "逐步展开历史层次。",
          "componentId": "museum-revolutions"
        }
      ],
      "scenes": [
        {
          "id": "origins",
          "title": "四种起源叙事",
          "goal": "改变学科视角，观察同一历史如何被重新组织",
          "summary": "不同学科把不同的最后一块拼图视为诞生。",
          "interaction": "选择四个学科视角。",
          "next": "起点差异并不意味着此前的研究消失。",
          "notes": "四种起源叙事。约1950遥操作、约1960工业、1964机械、约1980计算机；并非精确断代 来源：印刷页 73–74，Myth #1 / More Creation Myths。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-origins",
          "moduleId": "2.2",
          "thumbnail": "./thumbnails/origins.png"
        },
        {
          "id": "planning",
          "title": "计算机科学的几何转向",
          "goal": "把机器人形状纳入空间表示",
          "summary": "构形空间把机器人运动转为构形的变化。",
          "interaction": "改变位置与机器人半径，观察碰撞约束。",
          "next": "几何方法不是机器人研究唯一的起源。",
          "notes": "几何规划使计算机科学取得牵引力。正文将构形空间工作追溯到1977；参考文献列1978报告与1979论文，保留这一差别 来源：印刷页 73，Myth #1。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-planning",
          "moduleId": "2.3",
          "thumbnail": "./thumbnails/planning.png"
        },
        {
          "id": "revolutions",
          "title": "创世与范式革命",
          "goal": "区分新研究共同体与软件设计范式变化",
          "summary": "行为与统计转向延续研究，不是死后重生。",
          "interaction": "逐步展开历史层次。",
          "next": "不确定性在这些转向之前已经存在。",
          "notes": "行为与统计是革命而非创世。十年节律是作者编排，遗漏多个领域；2010未知 来源：印刷页 74–75，More Creation Myths。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-revolutions",
          "moduleId": "2.4",
          "thumbnail": "./thumbnails/revolutions.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "不确定性的早期线索",
      "modules": [
        {
          "kind": "module",
          "id": "3.5",
          "title": "不确定性与柔顺运动",
          "desc": "改变圆心估计误差，比较刚性轨迹与顺应约束。",
          "componentId": "museum-crank"
        }
      ],
      "scenes": [
        {
          "id": "crank",
          "title": "不确定性与柔顺运动",
          "goal": "转动曲柄时，让世界的约束参与决定运动",
          "summary": "实际圆心未知时，精确重复错误的圆也会冲突。",
          "interaction": "改变圆心估计误差，比较刚性轨迹与顺应约束。",
          "next": "误差何时消失，与环境能否设计不是一回事。",
          "notes": "曲柄约束实际运动轨迹。刚性固定曲柄；柔顺控制原理，本文无控制律或实测数值 来源：印刷页 75，Uncertainty。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-crank",
          "moduleId": "3.5",
          "thumbnail": "./thumbnails/crank.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "结构化环境的定义",
      "modules": [
        {
          "kind": "module",
          "id": "4.6",
          "title": "结构化环境的三种定义",
          "desc": "选择场景与定义，检查满足定义的理由。",
          "componentId": "museum-definitions"
        },
        {
          "kind": "module",
          "id": "4.7",
          "title": "结构化程度是连续的",
          "desc": "切换机器人任务，并开关可利用条件。",
          "componentId": "museum-continuum"
        }
      ],
      "scenes": [
        {
          "id": "definitions",
          "title": "结构化环境的三种定义",
          "goal": "同一场景，在不同定义下会得到不同判断",
          "summary": "任务、工程意图和机器人能力共同影响判定。",
          "interaction": "选择场景与定义，检查满足定义的理由。",
          "next": "定义之后，还需要问程度。",
          "notes": "协同工程、工程、规律三种含义。相对于给定任务；第一种还依赖特定机器人和设计历史 来源：印刷页 76，Definitions 1–3。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-definitions",
          "moduleId": "4.6",
          "thumbnail": "./thumbnails/definitions.png"
        },
        {
          "id": "continuum",
          "title": "结构化程度是连续的",
          "goal": "改变任务和机器人，观察可利用的规律",
          "summary": "不能把场景名称直接当作结构化程度。",
          "interaction": "切换机器人任务，并开关可利用条件。",
          "next": "连续性不等于已有统一评分公式。",
          "notes": "结构化程度连续。信息论度量只是提议，本文未定义可计算通用分数 来源：印刷页 76，Definition 4。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-continuum",
          "moduleId": "4.7",
          "thumbnail": "./thumbnails/continuum.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "设计与感知的权衡",
      "modules": [
        {
          "kind": "module",
          "id": "5.8",
          "title": "自动化中的不确定性管理",
          "desc": "分配环境改造和感知投入。",
          "componentId": "museum-factory"
        },
        {
          "kind": "module",
          "id": "5.9",
          "title": "为谁设计的环境结构",
          "desc": "改变夹爪宽度，检验把手可利用性。",
          "componentId": "museum-kitchen"
        }
      ],
      "scenes": [
        {
          "id": "factory",
          "title": "自动化中的不确定性管理",
          "goal": "选择改造或感知，观察残余误差与代价",
          "summary": "完全消除不确定性可能昂贵且不灵活。",
          "interaction": "分配环境改造和感知投入。",
          "next": "工厂与厨房都不能用二元标签概括。",
          "notes": "工厂管理不确定性。有成本、产品更换、感知与改造权衡；没有成本实验 来源：印刷页 76，Structured and Unstructured Environments。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-factory",
          "moduleId": "5.8",
          "thumbnail": "./thumbnails/factory.png"
        },
        {
          "id": "kitchen",
          "title": "为谁设计的环境结构",
          "goal": "换一个执行者，重新审视同一个把手",
          "summary": "为人类工程化，不保证适配任意机器人。",
          "interaction": "改变夹爪宽度，检验把手可利用性。",
          "next": "结构必须放回机器人与任务关系中解释。",
          "notes": "厨房也有工程结构。为人类设计的结构未必能被任意机器人利用 来源：印刷页 76，Structured and Unstructured Environments。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-kitchen",
          "moduleId": "5.9",
          "thumbnail": "./thumbnails/kitchen.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "长期进展的边界",
      "modules": [
        {
          "kind": "module",
          "id": "6.10",
          "title": "机器人进展的测量边界",
          "desc": "选择观测覆盖条件，查看能否外推。",
          "componentId": "museum-future"
        }
      ],
      "scenes": [
        {
          "id": "future",
          "title": "机器人进展的测量边界",
          "goal": "只给出成功例子，能否推出总体完成比例",
          "summary": "缺少任务总体和权重，就不能计算长期进度。",
          "interaction": "选择观测覆盖条件，查看能否外推。",
          "next": "把判断落到原文证据，而不是趋势想象。",
          "notes": "缺少长期进度尺度。作者观点；没有机器人已掌握人类技能百分比的统计 来源：印刷页 76–77，The Future。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-future",
          "moduleId": "6.10",
          "thumbnail": "./thumbnails/future.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "证据复盘",
      "modules": [
        {
          "kind": "module",
          "id": "7.11",
          "title": "论断与史料的交叉核验",
          "desc": "判断三条论断，查看页码和解释。",
          "componentId": "museum-review"
        }
      ],
      "scenes": [
        {
          "id": "review",
          "title": "论断与史料的交叉核验",
          "goal": "给一次组会汇报挑选可被原文支持的句子",
          "summary": "区分原文结论、作者观点与教学示意。",
          "interaction": "判断三条论断，查看页码和解释。",
          "next": "带着边界返回论文。",
          "notes": "缺少长期进度尺度。作者观点；没有机器人已掌握人类技能百分比的统计 来源：印刷页 76–77，The Future。所有交互数值为教学示意，不是论文测量。DOI:10.1109/MRA.2012.2191437",
          "componentId": "museum-review",
          "moduleId": "7.11",
          "thumbnail": "./thumbnails/review.png"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png"
  }
};
