import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Towards Metric-Agnostic Trajectory Forecasting",
    "titleZh": "面向评测指标解耦的轨迹预测",
    "venue": "ECCV 2026 · 交互式论文导读",
    "authors": "Markus Knoche、Daan de Geus、Bastian Leibe",
    "affiliation": "亚琛工业大学、埃因霍温理工大学",
    "domain": "自动驾驶轨迹预测",
    "coreProblem": "车到路口，可能左转、直行或右转。只交出几个候选，怎样保留这些可能性？",
    "coreInsight": "学习：未来有哪些可能、各有多大可能。输出：按当前指标，从这些可能性中挑出 K 个候选。",
    "keywords": [
      "轨迹预测",
      "TraDiE",
      "minFDE",
      "soft mAP",
      "负对数似然"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "原有做法：围绕有限候选训练",
      "desc": "示例：候选偏向常见方向，其他未来可能被忽略。",
      "componentId": "td-cover-direct"
    },
    "newMethod": {
      "title": "本文方法：先学分布，再选候选",
      "desc": "把“判断未来”与“按指标交答案”分成两步。",
      "componentId": "td-cover-policy"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "指标冲突与问题",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "什么叫距离，什么叫命中窗口？",
          "desc": "选择近处、框内较远处或框外",
          "componentId": "td-scoring"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "有限候选的指标取舍",
          "desc": "在固定分布上切换距离策略和窗口策略",
          "componentId": "td-conflict"
        }
      ],
      "scenes": [
        {
          "id": "scoring",
          "title": "什么叫距离，什么叫命中窗口？",
          "goal": "移动同一个预测点，同时看距离评分和窗口判定。",
          "summary": "先看真实点、预测点和容差框，再理解两种评分偏好。",
          "interaction": "选择近处、框内较远处或框外",
          "next": "有限候选的指标取舍",
          "notes": "§3.1–3.2。绿色菱形是固定真实终点，黄色点是预测终点，矩形是按真实位置与航向定义的容差窗口。三个位置距离分别约0.63、1.41、2.41米，前两个都在窗口内。minFDE有多个候选时只取最小误差；窗口先判命中，不计算IoU，也不在框内继续按距离加分。mAP还需置信度排序和跨样本汇总。教学窗口半长1.55、半宽0.78，并非Waymo官方阈值。实际容差由基准协议规定。",
          "componentId": "td-scoring",
          "moduleId": "1.1"
        },
        {
          "id": "conflict",
          "title": "有限候选的指标取舍",
          "goal": "同一分布、相同名额，换个目标会发生什么？",
          "summary": "切换两个实际计算的策略，比较平均最近距离与窗口命中数。",
          "interaction": "在固定分布上切换距离策略和窗口策略",
          "next": "为什么把学习与输出分开？",
          "notes": "§3.3、§4。96个模拟终点、K=2；中心方向较宽，两侧较集中，窗口尺寸固定。覆盖量仅为命中示意，不是AP。两套候选实际计算，展示取舍不代表所有数据必然冲突。得分可能反映分布质量与选择策略两个因素。",
          "componentId": "td-conflict",
          "moduleId": "1.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "为什么解耦",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "为什么把学习与输出分开？",
          "desc": "依次查看为什么分开、怎样学习、怎样输出",
          "componentId": "td-decoupling"
        }
      ],
      "scenes": [
        {
          "id": "decoupling",
          "title": "为什么把学习与输出分开？",
          "goal": "先解释这一步为什么有帮助，再进入训练与选点。",
          "summary": "从有限候选的取舍，过渡到保留共同分布信息。",
          "interaction": "依次查看为什么分开、怎样学习、怎样输出",
          "next": "位置与航向的概率表示",
          "notes": "§3.3–5。先讲动机：有限候选压缩未来信息，不同指标偏好不同摆法；训练直接围绕某种候选摆法，会把分布质量与输出适配混在一起。论文让模型先学条件概率分布，再固定网络，由下游策略按目标挑K个输出，便于同一模型服务不同评价目标。这不等于消除输出取舍，也不是声称所有基线都同时优化两个指标。两类指标不是两个模型参数。随后第5–7页解释分布表示、WTA基线与两种NLL训练方式；第8页起讲输出。真实未来仅用于训练和评分，推理选点不使用真实未来。",
          "componentId": "td-decoupling",
          "moduleId": "2.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "如何学习分布",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "位置与航向的概率表示",
          "desc": "调整航向与纵向尺度",
          "componentId": "td-density"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "WTA 回归与混合 NLL",
          "desc": "选择训练目标，再逐次训练十步",
          "componentId": "td-learn-mixture"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "Traj-NLL 与 Step-NLL",
          "desc": "切换目标、调节早期与后期模式权重",
          "componentId": "td-temporal"
        }
      ],
      "scenes": [
        {
          "id": "density",
          "title": "位置与航向的概率表示",
          "goal": "一个运动模式包含位置、尺度与方向。",
          "summary": "旋转预测航向、改变纵向尺度，观察分布形状和观测似然。",
          "interaction": "调整航向与纵向尺度",
          "next": "WTA 回归与混合 NLL",
          "notes": "§5.1式12。DONUT是仅含解码器的轨迹预测Transformer。输入参与者历史与场景信息，为每个参与者、每个模式、每个未来时刻输出位置和航向分布参数，小预测头再给出模式权重。原DONUT沿全局xy轴的Laplace改为沿预测航向的纵横向；航向用von Mises。混合分布将各模式密度按权重相加。教学固定局部残差0.8、0.25，真实航向55度，集中参数4，横向尺度0.45，计算三个密度乘积。点阵仅示意一个模式的密度范围。",
          "componentId": "td-density",
          "moduleId": "3.1"
        },
        {
          "id": "learn-mixture",
          "title": "WTA 回归与混合 NLL",
          "goal": "让模型给真实观测更高的密度。",
          "summary": "运行训练更新，观察均值、权重与损失同时改变。",
          "interaction": "选择训练目标，再逐次训练十步",
          "next": "Traj-NLL 与 Step-NLL",
          "notes": "§5式13–15。单时刻一维Laplace混合小模型，8个固定观测，尺度1.25。WTA仅演示回归赢家，权重固定；原论文还有式14的分类权重损失和stop-gradient密度，不能据此说WTA完全不学权重。NLL直接优化混合似然。小模型使用数值梯度和回溯，不运行DONUT。",
          "componentId": "td-learn-mixture",
          "moduleId": "3.2"
        },
        {
          "id": "temporal",
          "title": "Traj-NLL 与 Step-NLL",
          "goal": "模式先跨时间组合，还是各时刻先混合？",
          "summary": "在同一条真实轨迹的两个时刻上，计算不同混合顺序与权重的损失。",
          "interaction": "切换目标、调节早期与后期模式权重",
          "next": "分布样本与输出预算",
          "notes": "§5.2式15–16。两模式、两时刻似然矩阵为[[0.8,0.1],[0.2,0.7]]，行对应模式，列对应时刻。Traj共享pi并先乘时间；Step每时刻不同pi，先混合后跨时间。训练时把真实未来代入密度，取负对数，再对参与者求和，通过梯度更新网络。这里报告负对数联合教学似然。Step表达更灵活，时间耦合更弱。作者还比较位置分布：广义高斯增加形状参数，包含Laplace和Gaussian特例；高斯尺度混合用5个同均值、不同尺度的分量。这5个是密度内部的分量，不能当成最终5条输出。表4使用Step与广义高斯。与概率质量不同，连续密度可以大于1。NLL不保证现实校准，需实验检验。",
          "componentId": "td-temporal",
          "moduleId": "3.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "按评价目标选择",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "分布样本与输出预算",
          "desc": "改变样本比例与候选数量",
          "componentId": "td-budget"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "期望 minFDE 的终点优化",
          "desc": "拖动候选或迭代优化，模型分布固定",
          "componentId": "td-distance"
        },
        {
          "kind": "module",
          "id": "4.3",
          "title": "距离目标与 k-means",
          "desc": "移动候选或跳到两个目标各自的最优中心",
          "componentId": "td-clustering"
        },
        {
          "kind": "module",
          "id": "4.4",
          "title": "窗口策略的贪心覆盖",
          "desc": "调节选取轮数和教学窗口大小",
          "componentId": "td-window"
        },
        {
          "kind": "module",
          "id": "4.5",
          "title": "新增命中概率与置信度",
          "desc": "改变累计轮数，核算每个候选的边际收益",
          "componentId": "td-confidence"
        },
        {
          "kind": "module",
          "id": "4.6",
          "title": "有效命中与全局排序",
          "desc": "切换mAP与soft mAP并调整置信度",
          "componentId": "td-ranking"
        }
      ],
      "scenes": [
        {
          "id": "budget",
          "title": "分布样本与输出预算",
          "goal": "许多可能未来怎样变成有限候选？",
          "summary": "保留模型样本，改变候选预算，区分样本和输出。",
          "interaction": "改变样本比例与候选数量",
          "next": "期望 minFDE 的终点优化",
          "notes": "§4式3–5、附录D。网页96个教学样本，K=1至4；论文M=3000、K=6。样本按模型分布出现，候选是再选择或优化后的结果，不等同于模型模式均值。模型分量数是另一概念，MTR为64。",
          "componentId": "td-budget",
          "moduleId": "4.1"
        },
        {
          "id": "distance",
          "title": "期望 minFDE 的终点优化",
          "goal": "用所有模型样本计算最近候选距离。",
          "summary": "拖动终点或更新位置，观察平均未平方距离。",
          "interaction": "拖动候选或迭代优化，模型分布固定",
          "next": "距离目标与 k-means",
          "notes": "§4.1式4–6。每个样本取最近候选，再在所有样本间平均。移动自由终点，不更新模型。网页96样本、3候选、带回溯梯度；原文3000样本、6候选、Adam学习率0.2迭代300步，10次随机初始化取最好。不保证全局最优。",
          "componentId": "td-distance",
          "moduleId": "4.2"
        },
        {
          "id": "clustering",
          "title": "距离目标与 k-means",
          "goal": "一个候选，平方距离会改变最优位置。",
          "summary": "移动候选，比较[0,0,0,0,10]的平均距离与平均平方距离。",
          "interaction": "移动候选或跳到两个目标各自的最优中心",
          "next": "窗口策略的贪心覆盖",
          "notes": "§3.3、附录B。k-means平方距离与式6未平方欧氏距离不同。一维例子K=1，均值2、距离最优中位数0。窗口选择另外对应最大覆盖。HOME的聚类更新另有3米截断与热图权重，不等于普通k-means。",
          "componentId": "td-clustering",
          "moduleId": "4.3"
        },
        {
          "id": "window",
          "title": "窗口策略的贪心覆盖",
          "goal": "每轮选择落入最多剩余窗口的位置。",
          "summary": "逐轮选择，观察样本航向窗口与未覆盖集合。",
          "interaction": "调节选取轮数和教学窗口大小",
          "next": "新增命中概率与置信度",
          "notes": "§4.2式7–9。将样本当可能真实终点，按样本航向放窗口，寻找被最多窗口覆盖的样本位置。已命中窗口不计下一轮收益。网页窗口为教学大小；实际按基准定义，不为提高指标另调半径。候选选自样本，距离策略终点可自由移动。",
          "componentId": "td-window",
          "moduleId": "4.4"
        },
        {
          "id": "confidence",
          "title": "新增命中概率与置信度",
          "goal": "为何每一轮的分母始终相同？",
          "summary": "逐轮计算新增命中与置信度之和。",
          "interaction": "改变累计轮数，核算每个候选的边际收益",
          "next": "有效命中与全局排序",
          "notes": "§4.2式7–11。置信度=新增命中/原始样本总数，未覆盖概率质量可剩余，置信度不要求归一化。首次命中事件互斥，和为至少命中概率，因此与漏失率直接关联。AP全局排序只用逐目标贪心近似，无全局最优保证。",
          "componentId": "td-confidence",
          "moduleId": "4.5"
        },
        {
          "id": "ranking",
          "title": "有效命中与全局排序",
          "goal": "覆盖相同，重复命中和排序仍影响 AP。",
          "summary": "合并两个模拟路口的预测，改变重复候选置信度。",
          "interaction": "切换mAP与soft mAP并调整置信度",
          "next": "训练目标的实验验证",
          "notes": "§3.2、§4.2。教学AP按两次TP处精确率平均，尚非Waymo官方平滑和类别分桶。窗口内较低置信度重复命中，在mAP算FP、soft mAP忽略。选择新增命中希望提高排序与召回，不能把覆盖率当成AP。",
          "componentId": "td-ranking",
          "moduleId": "4.6"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "证据与适用范围",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "训练目标的实验验证",
          "desc": "切换soft mAP和minFDE",
          "componentId": "td-results"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "同一权重的两套提交",
          "desc": "切换窗口策略与距离策略提交",
          "componentId": "td-same-weights"
        },
        {
          "kind": "module",
          "id": "5.3",
          "title": "多时域配对与轨迹连续性",
          "desc": "选择名次，并改变8秒时最可信的转向",
          "componentId": "td-horizons"
        },
        {
          "kind": "module",
          "id": "5.4",
          "title": "分布失配下的策略边界",
          "desc": "低估左转并切换模型与真实分布",
          "componentId": "td-shift"
        }
      ],
      "scenes": [
        {
          "id": "results",
          "title": "训练目标的实验验证",
          "goal": "直接输出与策略输出，模型排序会改变。",
          "summary": "查看表1，比较相同模型配置接对应策略前后的结果。",
          "interaction": "切换soft mAP和minFDE",
          "next": "同一权重的两套提交",
          "notes": "§6表1，Waymo val，DONUT Laplace。WTA、Traj-NLL、Step-NLL全部原值保留。minFDE直接输出WTA1.0520优于Step1.2236；对应距离策略后Step1.0200优于WTA1.0824。此结果支持训练概率分布和输出策略的联合设计，非两个目标在同一候选上同时最优。",
          "componentId": "td-results",
          "moduleId": "5.1"
        },
        {
          "id": "same-weights",
          "title": "同一权重的两套提交",
          "goal": "论文说“多项指标领先”具体指什么？",
          "summary": "对照表4，看同一分布按两种策略分别适应指标。",
          "interaction": "切换窗口策略与距离策略提交",
          "next": "多时域配对与轨迹连续性",
          "notes": "§6表4，Waymo test，DONUT-NLL Step-NLL generalized Gaussian。同权重，window softmAP0.5018/minFDE1.3280；distance0.1649/1.0304。两种不同候选输出；路口仅教学示意，柱图为原文固定实测。不得说同一批候选同时取得两项最佳。",
          "componentId": "td-same-weights",
          "moduleId": "5.2"
        },
        {
          "id": "horizons",
          "title": "多时域配对与轨迹连续性",
          "goal": "同名次终点可能属于不同运动分支。",
          "summary": "改变8秒名次，观察3/5/8秒配对与8秒置信度。",
          "interaction": "选择名次，并改变8秒时最可信的转向",
          "next": "分布失配下的策略边界",
          "notes": "附录D/G。Waymo3/5/8秒分别优化；window按每时域置信度排名配对，以8秒置信度代表整轨迹。minFDE不依赖置信度，配对不改各时域最近距离。中间点未定义，不保证连续路径。示例排序非作者实测。",
          "componentId": "td-horizons",
          "moduleId": "5.3"
        },
        {
          "id": "shift",
          "title": "分布失配下的策略边界",
          "goal": "如果低估左转，选点会继承什么错误？",
          "summary": "观察模型预期命中与真实分布覆盖的差异。",
          "interaction": "低估左转并切换模型与真实分布",
          "next": "",
          "notes": "§6表3、§7、附录G/H。真实分布仅用于教学诊断，不可作为推理输入。QCNet WTA minFDE1.2254到2.2805；原文归因于朝向参数化和尺度失配，下降也可能受采样优化影响。主要Waymo验证；Step在AV2有过拟合初步现象；额外开销window约0.03s/scene、distance0.26s，硬件协议限定。学习分布与选择输出解耦依赖分布质量。",
          "componentId": "td-shift",
          "moduleId": "5.4"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg",
    "ranking": "./thumbnails/ranking.jpg",
    "decoupling": "./thumbnails/decoupling.jpg",
    "shift": "./thumbnails/shift.jpg",
    "scoring": "./thumbnails/scoring.jpg",
    "horizons": "./thumbnails/horizons.jpg",
    "temporal": "./thumbnails/temporal.jpg",
    "window": "./thumbnails/window.jpg",
    "learn-mixture": "./thumbnails/learn-mixture.jpg",
    "clustering": "./thumbnails/clustering.jpg",
    "density": "./thumbnails/density.jpg",
    "results": "./thumbnails/results.jpg",
    "budget": "./thumbnails/budget.jpg",
    "distance": "./thumbnails/distance.jpg",
    "same-weights": "./thumbnails/same-weights.jpg",
    "confidence": "./thumbnails/confidence.jpg",
    "conflict": "./thumbnails/conflict.jpg"
  }
};
