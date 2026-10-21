import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "QVHighlights: Detecting Moments and Highlights in Videos via Natural Language Queries",
    "titleZh": "一句话，找到视频里的那一刻",
    "venue": "NeurIPS 2021 · QVHighlights / Moment-DETR",
    "authors": "Jie Lei · Tamara L. Berg · Mohit Bansal",
    "affiliation": "University of North Carolina at Chapel Hill",
    "domain": "文本条件视频时刻定位 · Temporal Video Grounding",
    "coreProblem": "视频里有什么，和它在什么时候发生，是两种不同的理解。",
    "coreInsight": "把相关时间段作为一个集合直接预测，同时学习哪些片段更值得展示。",
    "keywords": [
      "时间定位",
      "集合预测",
      "显著性",
      "弱监督预训练"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "许多已有系统先生成候选区间，再评分和后处理；时刻检索与高光检测也常被分开研究。如何统一标注，并直接预测相关时间段与显著性？"
    },
    "newMethod": {
      "desc": "输入视频与一句描述，输出一个或多个相关时间段，并为片段打出显著性分数。先找到，再挑精彩。"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "看懂内容，为什么还找不到时间？",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "假如你想从一段做饭录像中找到“正在切番茄”的部分。视频分类可以告诉你“这是做饭”，但不会给出起止时间。文本条件视频时刻定位（Temporal Video Grounding，TVG）要把一句描述落到时间轴上；本文还进一步问：相关部分里，哪些画面最值得展示？",
      "analogy": {
        "title": "找回那次切菜",
        "text": "像从家庭录像里找回一个具体动作：记得是做饭还不够，你得沿着胶片找到那一刻。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "先判断：哪一种输出真正回答问题？",
          "desc": "请选择最符合“找到切番茄片段”的输出，再看为什么其他答案不够。所有做饭录像均为教学示意，不是论文实验样本。",
          "componentId": "query-quiz"
        }
      ],
      "insight": "看懂“是什么”是起点，找准“在何时”才回答了定位问题。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "视频 + 一句描述",
          "desc": "不是在视频库里找哪个视频，而是在给定视频中找时间。"
        },
        {
          "icon": "↔",
          "title": "一个或多个时间段",
          "desc": "相同事件可能在不同位置反复出现。"
        },
        {
          "icon": "✦",
          "title": "片段显著性分数",
          "desc": "找到相关区域后，还要区分哪些更适合展示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "先定义答案：相关，不等于精彩",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "上一章区分了“视频里有什么”和“什么时候发生”。现在还要确定什么才算正确答案：同一个动作可能出现两次，清晰的画面与模糊的画面也可能都相关。\n\nQVHighlights 把时间段标注与片段精彩程度一起收集，为两个问题分别提供监督。",
      "analogy": {
        "title": "给相关画面贴星",
        "text": "先圈出所有切菜画面，再给清晰的一格贴星。是否相关与是否精彩，是两次判断。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "你来标注：可以选不连续的片段",
          "desc": "每格代表 2 秒。选择所有“正在切番茄”的格子，再提交核对；点击星标可选出你认为最清晰的一格。切菜、摆盘与看起来漂亮不是同一件事。",
          "componentId": "annotation-lab"
        }
      ],
      "insight": "相关性决定候选范围，显著性决定其中谁更值得展示。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "每格 2 秒",
          "desc": "标注视频长 150 秒；教学用更短时间轴便于操作。"
        },
        {
          "icon": "↔",
          "title": "10,148 个视频",
          "desc": "对应 10,310 条查询、18,367 个时刻区间。"
        },
        {
          "icon": "✦",
          "title": "三人评定，五个等级",
          "desc": "显著性由 Very Bad 到 Very Good；保留多人的判断。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "边界差几秒，分数差多少？",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "知道哪些片段相关，只解决了语义的一半问题。假设动作只发生在第 8—16 秒，圈住整段视频当然能包含它，却不是精准定位。\n\n先亲手移动边界，你会理解为什么论文要同时报告宽松与严格的指标。",
      "analogy": {
        "title": "裁剪要对齐边缘",
        "text": "剪辑时多留或少留几秒，都会改变片段。裁剪框与真实动作重合得越多，定位越准。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "动手调整预测边界",
          "desc": "真实区间固定为 [8,16] 秒；拖动两个控制条改变预测区间，观察交集、并集和 IoU。再切换阈值，检验同一预测为什么会在一个标准下过关、另一个下失败。",
          "componentId": "iou-lab"
        }
      ],
      "insight": "同一预测能过宽松标准，不代表它已经准确贴住动作边界。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "IoU = 交集 / 并集",
          "desc": "预测把整段视频都圈住，并不会自动获得好分数。"
        },
        {
          "icon": "↔",
          "title": "R@1 看首个预测",
          "desc": "是否与任一正确区间达到指定 IoU 阈值。"
        },
        {
          "icon": "✦",
          "title": "mAP 不是平均 IoU",
          "desc": "它衡量排序检索；本文平均 mAP 汇总多个 IoU 阈值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "两种查询：一句话与十个预测槽",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "有了明确的答案形式和评价方式，接下来才轮到模型。Moment-DETR 先把视频与文本变成可比较的特征，再让多个预测槽同时提出时间段。\n\n最容易混淆的是：用户输入的一句话，与解码器里的 moment queries，并不是同一种“查询”。",
      "analogy": {
        "title": "空相框等待装片",
        "text": "十个空相框是可学习的预测位置；观众说出的那句话才是检索要求。空相框不是十句文字。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "逐步追踪：一句话怎样变成时间段？",
          "desc": "点击步骤或“下一步”，沿真实结构追踪数据形状。图中的数值路径按本文默认配置绘制；注意预提取特征、两种查询以及两个输出分支。",
          "componentId": "architecture"
        }
      ],
      "insight": "自然语言查询给出目标；可学习查询槽提供预测位置。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "视频与文字先对齐维度",
          "desc": "两个投影网络都映射到 256 维，再拼接序列。"
        },
        {
          "icon": "↔",
          "title": "十个槽是容量",
          "desc": "每个槽同时预测前景概率与中心/宽度，不保证都有效。"
        },
        {
          "icon": "✦",
          "title": "边界与精彩程度",
          "desc": "解码器预测区间，编码器视频位置输出显著性分数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "让预测各司其职：先匹配，再学习",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "十个预测槽没有预先约定“第一个负责开头”。训练数据中的多个正确时间段也没有固定顺序。\n\n如果硬把第一个预测对上第一个标注，交换标注顺序就会改变监督。集合预测需要先找到一对一的合适配对。",
      "analogy": {
        "title": "照片要各归其位",
        "text": "把两张照片分别放进最合适的相框；不能让两个相框争着领取同一张答案。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "配对实验：为什么需要一对一？",
          "desc": "给两个标注各选一个预测槽，比较总配对代价，再揭晓最优分配。代价采用论文结构的简化教学计算：−前景概率 + 边界距离；这里没有执行模型训练，也不是论文实际样本。",
          "componentId": "matching-lab"
        }
      ],
      "insight": "先解决对应关系，再讨论每个预测应该怎样改进。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "标注没有固定顺序",
          "desc": "交换标注顺序不应改变最佳集合预测目标。"
        },
        {
          "icon": "↔",
          "title": "一个答案对应一个槽",
          "desc": "匈牙利算法寻找总代价最小的一对一分配。"
        },
        {
          "icon": "✦",
          "title": "多余槽学习无目标",
          "desc": "匹配到空标注的槽不计算前景边界损失。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "学什么：边界、类别与显著性",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "匹配决定“谁负责哪个答案”，损失决定“它要改哪里”。分类帮助模型区分有效预测与背景，边界损失校正起止位置，显著性排序则让相关而精彩的片段得到更高分。\n\n三类信号彼此配合，但不能用一个总分代替理解各自作用。",
      "analogy": {
        "title": "调好边框与评分",
        "text": "裁剪边框需要校准，精彩程度也需要比较。只修其中一个，不能替代另一项工作。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "调一调分数，理解排序损失",
          "desc": "固定高质量与低质量片段的角色，调整其预测分数，观察 margin（间隔）是否满足。分数是模型输出的实数，不是概率；这里只演示显著性损失中的高低排序项。",
          "componentId": "loss-lab"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "公式分层展开：每一项在修什么？",
          "desc": "先理解任务，再逐步展开公式。完整目标同时包含分类、边界与显著性；只给真实前景匹配计算边界损失。",
          "componentId": "equation-reveal"
        }
      ],
      "insight": "一个总损失背后，是三个不同的学习目标。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "L1 + 一维 gIoU",
          "desc": "分别从坐标距离和区间重合关系约束预测。"
        },
        {
          "icon": "↔",
          "title": "前景 / 背景",
          "desc": "最终训练用 −log p；匹配代价里的分类项用 −p。"
        },
        {
          "icon": "✦",
          "title": "高分与低分拉开间隔",
          "desc": "还有区间内外排序；显著性不仅是外观漂亮。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "标注不够时，字幕怎样帮忙？",
      "badge": "trn",
      "badgeLabel": "训练机制",
      "bridge": "人工时间段和精彩程度标注都很费力。自然视频的语音识别字幕（ASR）自带文本与时间戳，虽然嘈杂，却能先教模型建立文字和视频时间的联系。\n\n注意：这改变的是训练数据与训练阶段，不是在预测时强制用户提供字幕。",
      "analogy": {
        "title": "先用字幕练手",
        "text": "先沿着自动字幕的粗时间线练习，再用人工标注精修。字幕不完美，但能提供起点。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "字幕有用，但不等于人工高光标注",
          "desc": "切换训练阶段，查看输入监督和保留的损失项。再比较同域与跨域预训练的论文结果，理解为什么不能把“更多数据”直接等同于“更好的表现”。",
          "componentId": "pretrain-lab"
        }
      ],
      "insight": "训练数据来源变了，比较结论的条件也必须跟着写清。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "字幕 + 时间戳",
          "desc": "本文从 5,406 个训练视频获得约 236K 对监督。"
        },
        {
          "icon": "↔",
          "title": "取消高低精彩排序项",
          "desc": "ASR 没有人工高光等级，但保留区间内外排序。"
        },
        {
          "icon": "✦",
          "title": "再用人工标注微调",
          "desc": "推理仍只需要视频与文字；预训练收益需单独报告。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "读懂结果，才算读懂方法",
      "badge": "both",
      "badgeLabel": "理解与实践",
      "bridge": "现在我们能读懂实验，而不只是寻找表格里的最大值。先看数据集与划分，再看是否预训练，最后看指标到底在测什么。\n\n下面保留了论文中的真实数字，也保留了方法不占优势的结果：它们恰好告诉我们后续 TVG 值得研究什么。",
      "analogy": {
        "title": "拿同一把尺比较",
        "text": "把作品放在同一把尺上比较。宽松标准、严格标准与精彩程度，需要分别查看。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "实验读表器：把结论放回条件里",
          "desc": "切换指标查看 QVHighlights 测试集结果，再用三道判断题检验理解。所有柱状图数值来自论文 Table 3；训练损失消融另列为验证集结果，避免混在一起比较。",
          "componentId": "results-lab"
        }
      ],
      "insight": "真正的结论有条件：看对场景、指标与训练设置，再谈优劣。",
      "takeaways": [
        {
          "icon": "◎",
          "title": "宽松与严格一起看",
          "desc": "原版不在所有定位指标上胜出，边界精度仍是问题。"
        },
        {
          "icon": "↔",
          "title": "预训练不是免费变量",
          "desc": "有无预训练要分开；验证集与测试集不能混算。"
        },
        {
          "icon": "✦",
          "title": "语义、边界与成本",
          "desc": "这三个问题可贯穿后续视频定位与智能体学习。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1Zo4y1A7FB",
      "title": "DETR｜算法概述",
      "reason": "补充集合预测与 Transformer 检测器基础。属于背景视频，不是本文的专门讲解。"
    }
  ]
};
