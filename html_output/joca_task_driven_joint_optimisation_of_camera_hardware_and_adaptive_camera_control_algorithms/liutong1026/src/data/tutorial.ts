import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "JOCA: Task-Driven Joint Optimisation of Camera Hardware and Adaptive Camera Control Algorithms",
    "titleZh": "JOCA：相机硬件与自适应控制，为什么要一起设计？",
    "venue": "WACV 2026",
    "authors": "Chengyang Yan · Mitch Bryson · Donald G. Dansereau",
    "affiliation": "悉尼大学 · Australian Centre for Robotics",
    "domain": "主动视觉 / 相机协同设计 / 目标检测",
    "coreProblem": "只设计一台“好相机”，却把自动曝光当成独立模块，可能在夜间和运动场景里错过目标。",
    "coreInsight": "把固定硬件、逐帧曝光与增益、最终检测效果放进同一个任务目标。",
    "keywords": [
      "相机硬件",
      "逐帧曝光",
      "DF-Grad",
      "目标检测"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "先选硬件，再独立调曝光；每一步看似合理，最后却未必让检测器看得更准。",
      "componentId": "joca-widget"
    },
    "newMethod": {
      "desc": "JOCA 用目标检测的表现一起评价硬件与控制策略：换相机，也要重新想怎么曝光。",
      "componentId": "joca-widget"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一张亮照片，未必是一张好证据",
      "badge": "inf",
      "badgeLabel": "问题",
      "bridge": "论文引言：自动曝光常追求合适亮度，但远处目标还受噪声和运动拖影影响。先看清这道取舍题。",
      "analogy": {
        "title": "夜间巡路 · 看见路牌",
        "text": "同一辆车驶向远处路牌，快门太短看不清，太长又可能拖影。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "只追求亮度会怎样？",
          "desc": "切换夜间与快速运动，再调曝光；亮度和拖影不能只顾一头。示意值不是实测。",
          "componentId": "joca-widget"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "分开设计还是一起设计",
          "desc": "在同一个检测目标下切换两种设计方式，辨认 JOCA 补上的空白。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "“好”的标准是目标检测，而不只是照片看起来亮。",
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "低光时短曝光容易缺信号。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "长曝光在运动中可能拉出拖影。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "示意图不等于论文检测结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "固定硬件与动态控制",
      "badge": "inf",
      "badgeLabel": "变量",
      "bridge": "论文 §3–4：传感器、像素尺寸、焦距与位置在设计阶段选；曝光时间和增益可逐帧调整。时间尺度不同，但相互牵制。",
      "analogy": {
        "title": "夜间巡路 · 选相机",
        "text": "出发前选镜头和传感器，行驶中随照明变化调曝光。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "参数归位",
          "desc": "点击参数，查看它属于硬件设计、运行时控制，还是任务评价。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "CARLA 搜索位置与视场等参数；Waymo 实验固定了位置与视场，两组设计空间不能混称。",
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "像素尺寸与焦距属于相机设计。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "曝光与增益是运行时控制量。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "不同实验的可选硬件范围不同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "增益不是免费的亮度",
      "badge": "inf",
      "badgeLabel": "成像",
      "bridge": "论文 §3 式 (1)–(3)：曝光 E 与增益 G 都影响像素强度，但增益还改变噪声；长曝光遇到运动还可能模糊。",
      "analogy": {
        "title": "夜间巡路 · 调快门",
        "text": "车仍在行驶；快门开久一点，路牌亮了，也可能被拉花。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "曝光、增益和运动的拉扯",
          "desc": "调 E 或 G，看三种效应的方向。网页中指数仅作教学示意。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "成像式只描述强度缩放；噪声和运动模糊需要另外考虑。",
      "formula": {
        "lead": "论文式 (2)：以校准图像和校准参数表示强度缩放。",
        "unicode": "I = I₀ × (Eₜ / E₀) × (Gₜ / G₀)",
        "symbols": [
          {
            "sym": "I₀",
            "desc": "以 E₀、G₀ 得到的校准图像。"
          },
          {
            "sym": "Eₜ",
            "desc": "第 t 帧曝光时间。"
          },
          {
            "sym": "Gₜ",
            "desc": "第 t 帧增益。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "E、G 都能改变强度。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "提高增益会牵动噪声。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "示意数值不是物理仿真或 mAP。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "下一帧的设置从哪里来？",
      "badge": "inf",
      "badgeLabel": "反馈",
      "bridge": "论文 §4：控制器根据当前图像及先前动态参数预测下一帧曝光与增益，不能把“下一帧”倒写为“本帧”。",
      "analogy": {
        "title": "夜间巡路 · 记住上次设置",
        "text": "司机看清这一帧路况后，为下一帧调整相机。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "逐帧走一遍",
          "desc": "点击阶段，查看图像特征、先前参数、控制预测与下一帧之间的先后关系。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "模型保留全局图像与语义特征分支，并把先前参数接入语义分支，最终预测两个控制量。",
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "输入含当前图像与先前控制信息。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "输出是下一帧 E 和 G。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "该工作没有在真实车辆上验证行动闭环。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "梯度走不过去的地方",
      "badge": "trn",
      "badgeLabel": "难点",
      "bridge": "论文 §5：相机候选可能是离散的，运动模糊渲染也可能不可微。硬件可无导数搜索，检测器可用梯度；控制网络需要桥梁。",
      "analogy": {
        "title": "夜间巡路 · 绕过弯道",
        "text": "没有连续坡度时，围绕当前路线试几个方向，比较哪一个更接近路牌。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "三个变量，三种信号",
          "desc": "选择硬件、控制网络或检测器，辨认其更新来源。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "不可微不意味着系统不能训练，只是不能假定梯度能穿过所有成像步骤。",
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "硬件由遗传算法搜索。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "检测器用任务损失更新。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "DF-Grad 为控制器接上任务信号。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "DF-Grad：试几步，再告诉网络往哪走",
      "badge": "trn",
      "badgeLabel": "方法",
      "bridge": "论文 §5、附录 B.2：围绕控制器的曝光和增益预测做扰动，以任务适应度挑选候选，再把较优参数变为训练监督。",
      "analogy": {
        "title": "夜间巡路 · 小幅试拍",
        "text": "面对同一块路牌，围绕当前设置小幅试拍，保留更便于识别的方案。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "一次 DF-Grad 练习",
          "desc": "逐步查看预测、四个扰动候选、按任务评价选中、监督控制器。候选分数只是示意。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "论文使用四个扰动候选；选中者提供训练方向，不保证全局最优。",
      "formula": {
        "lead": "论文 §5：实验把任务损失和 GA 监督组合。",
        "unicode": "ℓ = 7ℓtask + ℓGA",
        "symbols": [
          {
            "sym": "ℓtask",
            "desc": "目标检测任务损失。"
          },
          {
            "sym": "ℓGA",
            "desc": "预测参数与选中扰动的 L1 差异。"
          },
          {
            "sym": "7",
            "desc": "文中实验权重，不是普适常数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "控制网络先预测 E、G。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "扰动由任务表现比较。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "任务损失与 L1 遗传搜索监督共同训练 ACC。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "联合训练，也有不同的时钟",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "论文 §5–6、附录 B：硬件、ACC 和检测器面向同一任务，但不是每一帧同时更新所有参数。",
      "analogy": {
        "title": "夜间巡路 · 定期重选装备",
        "text": "开车时经常调曝光；硬件只能在设计阶段重新考虑。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "三个更新时钟",
          "desc": "点击时钟，查看每类变量的更新方式与论文实验频率。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "论文将扰动优化每四步进行一次、硬件优化每四十五步进行一次；这是实验设置，不是通用最佳频率。",
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "硬件候选离线搜索。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "ACC 逐帧输出可调参数。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "不能把网页动画当成真实模型训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把整套系统连起来",
      "badge": "both",
      "badgeLabel": "结构",
      "bridge": "论文图 2：前向时由相机成像、ACC 控制和检测器评价组成逐帧路径；训练时另有硬件搜索与 DF-Grad 分支。",
      "analogy": {
        "title": "夜间巡路 · 追踪一帧",
        "text": "跟着同一辆车拍到的一帧，辨清“现在看见”和“下一帧怎样拍”。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点开系统中的一环",
          "desc": "选择虚拟相机、成像、控制器、检测器或 DF-Grad，相关路径即时高亮。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "Waymo 用预录实景图像再模拟新相机效果，不等于论文已实际部署一台新相机。",
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "前向路径给出图像与任务评价。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "反馈决定下一帧的曝光、增益。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "训练分支和推理路径应分清。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "同条件比较，数字才有意义",
      "badge": "both",
      "badgeLabel": "证据",
      "bridge": "论文表 1–3：CARLA 合成实验与 Waymo 实景图像模拟实验设置不同。下面只在同一数据集、同一条件、同一指标下比较 mAP（越高越好）。",
      "analogy": {
        "title": "夜间巡路 · 比较同一段路",
        "text": "固定路况再比较相机方案；换了场景，绝对分数不能草率横比。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "基线对照",
          "desc": "切换 CARLA 标定、Waymo 标定与增强噪声条件；数值均来自论文表 1–2。",
          "componentId": "joca-widget"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "去掉一块会怎样？",
          "desc": "查看 CARLA 标定条件下的消融结果，比较完整 JOCA 与三个删减版本。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "CARLA 标定条件中 JOCA 0.325、FLIR+NeuralAE 0.318，差 0.007；不应夸成所有条件都“大幅领先”。",
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "同一表、同一协议内比大小。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "消融帮助判断训练机制贡献。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "Waymo 是图像模拟相机，不是硬件实测。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "我的问题：离完整主动视觉还差什么？",
      "badge": "both",
      "badgeLabel": "反思",
      "bridge": "以下是个人分析，不是论文已完成的实验。JOCA 让相机根据场景改变曝光和增益，但没有完整验证主动选视角、采样时刻或行动决策。",
      "analogy": {
        "title": "夜间巡路 · 决定下一眼",
        "text": "如果还能决定何时拍、往哪里看，问题就从调曝光扩展到主动感知。 图形为教学示意，并非论文原图或真实推理。",
        "componentId": "joca-widget"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "把疑问变成实验",
          "desc": "切换四个问题，查看可执行的对照组、指标与尚缺的证据。",
          "componentId": "joca-widget"
        }
      ],
      "insight": "我最想验证的是：在新相机、突发照明和算力受限条件下，联合优化的收益能否保持。",
      "takeaways": [
        {
          "icon": "①",
          "title": "问题",
          "desc": "JOCA 属于任务驱动成像控制。"
        },
        {
          "icon": "②",
          "title": "方法",
          "desc": "完整行动闭环尚未验证。"
        },
        {
          "icon": "③",
          "title": "边界",
          "desc": "批判性问题要落实为可测对照。"
        }
      ]
    }
  ]
};
