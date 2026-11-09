import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Self-Supervised Models are Continual Learners",
    "titleZh": "自监督模型本身就是持续学习者",
    "venue": "CVPR 2022",
    "authors": "Enrico Fini, Victor G. Turrisi da Costa, Xavier Alameda-Pineda, Elisa Ricci, Karteek Alahari, Julien Mairal",
    "affiliation": "University of Trento · Inria · Fondazione Bruno Kessler",
    "domain": "视觉表征学习 · 持续学习",
    "coreProblem": "离线自监督模型很强，但数据顺序到达、旧数据不可复用时表征会漂移退化；直接约束新旧表征相似又会压住模型继续学习新概念。",
    "coreInsight": "不要求表征不变，只要求存在一个可学习的映射把当前表征翻译回过去表征，并用原方法自己的自监督损失来训练这个映射。",
    "keywords": [
      "持续自监督学习",
      "表征漂移",
      "自蒸馏",
      "预测头"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "直接拉近新旧表征：新概念被压住，音准回来了，新曲子却弹不出来。",
      "componentId": "hero-tuning"
    },
    "newMethod": {
      "desc": "额外只学一个映射，把当前表征翻译回过去表征：旧录音合得上，新曲子也还在。",
      "componentId": "hero-tuning"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "顺序到来的数据为什么会走音",
      "badge": "inf",
      "badgeLabel": "问题",
      "bridge": "离线自监督模型在一次性拿到全部数据时很强。真实场景里数据是一批批到来的，先看清它在那种条件下为什么失效。",
      "analogy": {
        "title": "旧录音还在放，新琴已经走音",
        "text": "旧录音代表过去学到的表征，它不会变；新琴是当前模型，每学一个新任务就整体偏移一次。目标不是让琴不动，而是别偏到合不上。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "任务推进时发生了什么",
          "desc": "按住琴弦向下拉再松手，每拨一次就多学一个任务，音准标记随之偏开。右侧是论文表 2 报告的 CIFAR100 五任务类别增量最终 top-1（SimCLR 微调 / CaSSLe / 离线），越高越好。",
          "componentId": "ch1-drift"
        }
      ],
      "insight": "漂移发生在表征空间本身，不是某一层分类器的参数。",
      "takeaways": [
        {
          "title": "离线假设会失效",
          "desc": "自监督的强表现依赖一次性看到全部数据，顺序到达时这个前提不存在。"
        },
        {
          "title": "退化的是表征",
          "desc": "旧任务的表现下降，来自特征空间整体移动，而不只是分类头过时。"
        },
        {
          "title": "旧数据拿不回来",
          "desc": "不能靠全量重训：旧样本已经丢弃，重跑全部数据也不现实。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "没有标签时，SSL 靠什么校准",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "要理解后面的做法，先要知道自监督损失在比较什么。它比较的从来不是两张图，而是两个表征。",
      "analogy": {
        "title": "两种拨法，同一个音",
        "text": "同一段旋律换一种拨法，音色不同、语义相同；模型要学的就是让这两种外观落到相近的位置。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "两种视图到底对齐了什么",
          "desc": "拖动左侧的裁剪框，观察右侧视图与两个特征点如何变化。两点间距为相对位置示意，不标注具体数值。",
          "componentId": "ch2-views"
        }
      ],
      "insight": "这个比较器只认「同一语义的不同外观」，因此可以原封不动地换一对输入。",
      "formula": {
        "lead": "自监督训练就是让两个增强视图的表征尽量接近。",
        "unicode": "min<sub>θ</sub> 𝔼<sub>x∼𝒟</sub> [ L<sub>SSL</sub>(z<sup>A</sup>, z<sup>B</sup>) ]",
        "symbols": [
          {
            "sym": "θ",
            "desc": "编码器参数，由当前任务的数据更新"
          },
          {
            "sym": "𝒟",
            "desc": "数据分布，训练时用小批量近似期望"
          },
          {
            "sym": "z^A",
            "desc": "视图 A 经过 backbone 与投影头得到的表征"
          },
          {
            "sym": "z^B",
            "desc": "视图 B 的表征，来自同一网络或其 EMA 副本"
          },
          {
            "sym": "L_SSL",
            "desc": "基础自监督损失，可为 InfoNCE、MSE、交叉熵或互相关"
          }
        ]
      },
      "takeaways": [
        {
          "title": "两个视图",
          "desc": "随机裁剪、颜色抖动、水平翻转生成外观不同、语义相同的两张图。"
        },
        {
          "title": "损失作用在表征上",
          "desc": "网络不必重建像素，只要让同一语义落到特征空间的相近位置。"
        },
        {
          "title": "不变性是设计出来的",
          "desc": "增强比监督训练常用的人为扰动更强，模型因此学到对它们不敏感的表征。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "不要求不变，只要求能翻译回去",
      "badge": "inf",
      "badgeLabel": "洞察",
      "bridge": "上一章的对齐方式可以直接搬到新旧模型之间，但搬法有两种，结果差别很大。",
      "analogy": {
        "title": "卡上移调夹，而不是把琴调回去",
        "text": "把新琴硬调回旧音高，新曲子就弹不出来了。卡一个移调夹，音高仍然可以变，只要能对回旧录音。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "两种合奏方式",
          "desc": "拖动中间的分割线，左右擦开对比：左边直接压平新旧表征，右边只学一个移调映射。下方是论文表 2 中 BYOL 在 CIFAR100 五任务类别增量下的 top-1 准确率。",
          "componentId": "ch3-transpose"
        }
      ],
      "insight": "需要的是能把现在翻译回过去的能力，而不是让现在停在原地。",
      "takeaways": [
        {
          "title": "直接对齐有代价",
          "desc": "强制新旧表征相似会压住继续学习的能力，特征也不再随更长的训练继续精炼。"
        },
        {
          "title": "映射的约束更弱",
          "desc": "只要求存在一个可学习的投影把当前空间送回过去空间，当前空间本身可以自由移动。"
        },
        {
          "title": "稳定性与可塑性",
          "desc": "两者不是二选一：合得上旧录音，同时保留新琴自己的音色与表现力。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "冻结一份副本，继续训练当前编码器",
      "badge": "both",
      "badgeLabel": "机制",
      "bridge": "既然只需要一个映射，就得先有一个稳定参照。这一步把参照固定下来。",
      "analogy": {
        "title": "旧录音封存，只调整新琴",
        "text": "每个新任务开始时复制一份当前模型并冻结，它只负责给出过去的表征，不再更新。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "一次前向的四步",
          "desc": "逐步查看四条支路。只有当前编码器和预测头会收到梯度，冻结支路只提供参照。",
          "componentId": "ch4-freeze"
        }
      ],
      "insight": "冻结的目的不是保留旧模型本身，而是让「过去」在训练中保持不动。",
      "formula": {
        "lead": "蒸馏损失就是把同一个自监督损失，喂给预测后的新表征和冻结的旧表征。",
        "unicode": "L<sub>D</sub>(z, z̄) = L<sub>SSL</sub>(g(z), z̄)",
        "symbols": [
          {
            "sym": "L_D",
            "desc": "蒸馏损失，没有引入新的目标函数形式"
          },
          {
            "sym": "z̄",
            "desc": "冻结编码器给出的过去表征，从计算图 detach"
          },
          {
            "sym": "g",
            "desc": "预测头，把当前表征投影回过去所在的空间"
          },
          {
            "sym": "L_SSL",
            "desc": "与基础方法完全相同的自监督损失"
          }
        ]
      },
      "takeaways": [
        {
          "title": "每个任务复制一次",
          "desc": "新任务开始时把当前模型拷成冻结编码器，此后不再更新。"
        },
        {
          "title": "旧表征不回传梯度",
          "desc": "z̄ 被 detach，梯度只经过当前编码器与预测头。"
        },
        {
          "title": "g 是唯一接口",
          "desc": "两个特征空间之间只有预测头这一条可学习通路。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "同一支音叉，不需要第二支",
      "badge": "both",
      "badgeLabel": "损失",
      "bridge": "参照固定后，剩下的是拿什么标准去对齐。这个选择决定了方法能不能通用。",
      "analogy": {
        "title": "校视图和校新旧，用同一支音叉",
        "text": "同一个自监督损失，之前比较两个增强视图，现在比较预测表征和冻结表征。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "换一个校音法会怎样",
          "desc": "转动旋钮在四种设置间切换：关掉蒸馏、用本方法自己的损失、换别的损失、再加一个权重；松手会吸附到最近的档位。上方曲线只表示趋势，不标数值；下方是论文附录表 F 在 CIFAR100 两任务类别增量下的组合结果。",
          "componentId": "ch5-loss"
        }
      ],
      "insight": "通用性来自复用同一个比较器，而不是为每个方法另造一个蒸馏目标。",
      "formula": {
        "lead": "总损失就是原来的自监督损失加上蒸馏损失，两项直接相加。",
        "unicode": "L = L<sub>SSL</sub>(z<sup>A</sup>, z<sup>B</sup>) + L<sub>SSL</sub>(g(z<sup>A</sup>), z̄<sup>A</sup>)",
        "symbols": [
          {
            "sym": "L",
            "desc": "一个训练步的总损失，可对两个视图对称化"
          },
          {
            "sym": "L_SSL",
            "desc": "同一损失用了两次，一次管视图不变性，一次管时间一致性"
          },
          {
            "sym": "g",
            "desc": "预测头，只作用于当前表征"
          },
          {
            "sym": "z̄^A",
            "desc": "冻结编码器对视图 A 的表征，不接收梯度"
          }
        ]
      },
      "takeaways": [
        {
          "title": "蒸馏项就是原损失",
          "desc": "不为蒸馏另设目标函数，减少两套目标互相干扰的可能。"
        },
        {
          "title": "没有权重超参",
          "desc": "两项直接相加，不必为每个方法重新搜索一个平衡系数。"
        },
        {
          "title": "对称化沿用原方法",
          "desc": "基础方法怎么对称，CaSSLe 就怎么对称，不额外增加实现分支。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一步训练怎么走完",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "公式只说明算什么，不说明按什么顺序算。这一章按伪代码走一遍，并检查一个被否掉的变体。",
      "analogy": {
        "title": "一遍排练，两条校音",
        "text": "一次训练步里，当前支路和冻结支路各出两个表征，最后只做一次加法。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "跟着伪代码走一遍",
          "desc": "拖动时间轴上的播放头，按论文附录 A 的五步查看每一步新增的量与梯度走向。",
          "componentId": "ch6-step"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "交换视图有用吗",
          "desc": "切换三种蒸馏连法。下方是论文表 6 在 CIFAR100 五任务类别增量下的消融结果，top-1 越高越好。",
          "componentId": "ch6-swap"
        }
      ],
      "insight": "实现上只多了一次前向和一次损失计算，复杂度没有随方法数量膨胀。",
      "takeaways": [
        {
          "title": "五步训练",
          "desc": "两张视图、两路表征、两次同一个损失、一次相加，就是完整的一步。"
        },
        {
          "title": "对称化沿用原方法",
          "desc": "基础方法对两个视图怎么处理，CaSSLe 保持一致，不引入新分支。"
        },
        {
          "title": "两个变体都更差",
          "desc": "交叉对齐与去掉预测头在三种方法上都掉点，说明 g 不是可选项。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "三种「换新」不一样",
      "badge": "both",
      "badgeLabel": "设定",
      "bridge": "到这里方法已经完整。接下来的问题是它在什么条件下成立，以及增益有多大。",
      "analogy": {
        "title": "换曲目、换场次、换音乐厅",
        "text": "三种增量设定改变的是任务之间到底差在哪里，而不是方法本身。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "切换演出安排",
          "desc": "把下方的卡片拖到对应轨道上，放对才会显示该设定的结果。三组数值来自不同数据集与协议，不能互相比较。",
          "componentId": "ch7-settings"
        }
      ],
      "insight": "同一套 CaSSLe 流程在三种设定下的增益不同；三张卡的基座方法也不同，结论必须连设定一起记。",
      "formula": {
        "lead": "持续自监督学习的目标，是把每个任务上的自监督损失加起来，采样时不使用任何标签。",
        "unicode": "min<sub>θ</sub> ∑<sub>t=1</sub><sup>T</sup> 𝔼<sub>x∼𝒟ₜ</sub> [ L<sub>SSL</sub>(z<sup>A</sup>, z<sup>B</sup>) ]",
        "symbols": [
          {
            "sym": "T",
            "desc": "任务总数，class 与 data 增量用 5，DomainNet 用 6"
          },
          {
            "sym": "𝒟",
            "desc": "第 t 个任务的数据分布，旧任务的样本不再出现"
          },
          {
            "sym": "θ",
            "desc": "编码器参数，在所有任务上共用一套"
          },
          {
            "sym": "L_SSL",
            "desc": "与离线训练相同的自监督损失，不涉及类别标签"
          }
        ]
      },
      "takeaways": [
        {
          "title": "三种划分",
          "desc": "类别不相交、样本不相交、数据域变化，对应三种不同的「新」。"
        },
        {
          "title": "增益随设定变化",
          "desc": "类别增量下提升最稳定，数据增量下记住过去本来就没那么重要。"
        },
        {
          "title": "BYOL 是例外",
          "desc": "数据增量下 BYOL 的 CaSSLe 反而低于微调，作者推测与动量编码器已携带过去信息有关。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "一套框架，四种校音法",
      "badge": "trn",
      "badgeLabel": "架构",
      "bridge": "前面的推导只用了一种损失。这一章看点开计算图之后，框架如何与四类自监督方法对接。",
      "analogy": {
        "title": "四种校音法，同一把琴",
        "text": "换的是损失函数，不是整套装置；预测头、冻结副本、训练步序都保持不变。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点开计算图",
          "desc": "点击任一元素查看它的作用与梯度状态，再切换四类损失。所有说明以论文第 5.1 节与表 1 为准。",
          "componentId": "ch8-arch"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "预测头长什么样",
          "desc": "预测头是两层 MLP，隐藏层 2048 个单元、ReLU 激活。切换结构看差异：无 g 的数字来自论文表 6，去掉非线性来自附录。",
          "componentId": "ch8-predictor"
        }
      ],
      "insight": "框架与具体方法可组合：换损失不需要改装置，换装置也不需要改损失。",
      "formula": {
        "lead": "以 InfoNCE 为例，损失在做实例判别：拉近正样本，推开负样本。作为蒸馏项时，正样本换成预测表征与对应旧表征。",
        "unicode": "−log [ exp(sim(z<sub>i</sub><sup>A</sup>, z<sub>i</sub><sup>B</sup>) / τ) / ∑<sub>η(i)</sub> exp(sim(z<sub>i</sub><sup>A</sup>, z<sub>j</sub>) / τ) ]",
        "symbols": [
          {
            "sym": "sim",
            "desc": "余弦相似度，两个表征越接近值越大"
          },
          {
            "sym": "τ",
            "desc": "温度系数，控制分布的尖锐程度"
          },
          {
            "sym": "η(i)",
            "desc": "样本 i 在当前批次中的负样本集合"
          },
          {
            "sym": "z_i^A",
            "desc": "第 i 个样本视图 A 的表征；蒸馏时换成 g(z_i)"
          }
        ]
      },
      "takeaways": [
        {
          "title": "四个部件",
          "desc": "三个部件加一个损失：每个都能换实现，但都不能删。"
        },
        {
          "title": "四类损失可复用",
          "desc": "对比、MSE、聚类原型、互相关四类目标都能直接充当蒸馏损失。"
        },
        {
          "title": "g 的非线性不是关键",
          "desc": "去掉非线性，SimCLR 在 CIFAR100 五任务上只降 0.3%；起作用的更像是「存在一个可学习映射」这件事。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "长时间演出还准不准",
      "badge": "trn",
      "badgeLabel": "稳健性",
      "bridge": "五个任务的结论未必能直接推到更长的序列。这一章把条件收紧再看一遍。",
      "analogy": {
        "title": "换更长的演出季",
        "text": "演出季变长，每一场分到的排练时间就变少，模型更容易不稳。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "拆掉一个部件",
          "desc": "切换四种配置。数值取自论文表 2 与表 6，CIFAR100 五任务类别增量，top-1 越高越好。",
          "componentId": "ch9-ablation"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "把演出季拉长",
          "desc": "拖动任务数，观察每个任务分到的数据如何变少。下方是论文附录表 D 在 CIFAR100 十任务下的结果，数值不随拖动变化。",
          "componentId": "ch9-longer"
        }
      ],
      "insight": "结论在特定规模上成立；任务变长、每个任务数据变少时，稳定性本身会成为新问题。",
      "takeaways": [
        {
          "title": "部件都必要",
          "desc": "去掉预测头或交换视图都会掉点，完整框架在三种方法上都最好。"
        },
        {
          "title": "长序列更不稳",
          "desc": "十个任务时 SimCLR 掉得最狠，CaSSLe 的增益从 +9.4 扩大到 +13.4；Barlow 则从 +6.1 降到 +3.8。"
        },
        {
          "title": "更深网络同向",
          "desc": "换成 ResNet50 仍观察到同样的趋势，至少在更深的骨干上复现了。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "正式回放：赢了什么，还没解决什么",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "最后一章只做两件事：在同一协议下比较，然后把没解决的说清楚。",
      "analogy": {
        "title": "四段录音，一起回放",
        "text": "同一场考试才有可比性；上界不是参赛者。",
        "componentId": "band-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "同一场考试的分数",
          "desc": "启动一次比较，四根柱从 0 起画，在同一协议下比较。数值为论文表 2 中 BYOL 在 CIFAR100 五任务类别增量下的结果；offline 仅作上界，不参与比较。",
          "componentId": "ch10-race"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "还没解决的三件事",
          "desc": "点开三条限制与一个例外。它们与方法本身同样重要。",
          "componentId": "ch10-limits"
        }
      ],
      "insight": "提升主要来自表征质量；在 CIFAR100 上遗忘本来就不大，改善空间有限。",
      "takeaways": [
        {
          "title": "同协议下的优势",
          "desc": "CIFAR100 五任务类别增量中，论文六种 SSL 方法平均提升 6.8%（ImageNet100 为 4%）；图中三种方法分别为 +9.4 / +6.1 / +9.5。"
        },
        {
          "title": "遗忘要看数据集",
          "desc": "CIFAR100 上 SSL 方法的 F 本来就小；ImageNet100 上 F 的下降更明显。"
        },
        {
          "title": "三条限制",
          "desc": "需要任务边界、显存与时间约增加 30%、本身不做聚类；要得到类别仍需要分类器或聚类算法。"
        }
      ]
    }
  ]
};
