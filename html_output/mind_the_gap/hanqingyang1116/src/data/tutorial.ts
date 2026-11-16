import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Mind the Gap: Preserving and Compensating for the Modality Gap in CLIP-Based Continual Learning",
    "titleZh": "CLIP 持续学习：模态间隙的保持与补偿",
    "venue": "ICCV 2025",
    "authors": "Linlan Huang, Xusheng Cao, Haori Lu, Yifan Meng, Fei Yang, Xialei Liu",
    "affiliation": "南开大学 VCIP / NKIARI 深圳福田",
    "domain": "计算机视觉 · 类增量学习 · 视觉语言模型",
    "coreProblem": "把间隙越训越大要遗忘，把间隙强行抹平又要毁掉预训练知识。",
    "coreInsight": "间隙本身是预训练知识的度量：先把它稳住，再用视觉空间的分类器补上被它压住的那部分能力。",
    "keywords": [
      "类增量学习",
      "CLIP",
      "模态间隙",
      "无回放",
      "视觉空间分类器"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "一路狂录",
      "desc": "越录越偏，旧片段先糊。",
      "componentId": "mg-cover"
    },
    "newMethod": {
      "title": "MG-CLIP：盯表停手 + 另开一路近场",
      "desc": "间隙稳住，再另开一路不受它限制的视觉分类。",
      "componentId": "mg-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 间隙是出厂设定",
      "modules": [
        {
          "kind": "module",
          "id": "m1",
          "title": "试录进度与旧片段",
          "desc": "拖动试录进度，看两轨偏差与旧类准确率一起走坏。",
          "componentId": "mg-gap-base"
        }
      ],
      "scenes": [
        {
          "id": "p1-gap-base",
          "title": "出厂就有的那点偏差，是这把琴的底子",
          "goal": "拖动“总训练量”（第几任务 / 共 10 个），比较偏差读数、负样本相似度与旧类准确率。",
          "summary": "两路之间本来就有固定偏差；它不是故障，而是预训练知识的形态。任务是跨 10 个任务累积下来才把它越推越开。",
          "interaction": "拖动任务进度（0–10 个任务），音分表指针偏移、负样本相似度与旧类准确率按端点线性下降，累计 Δ 同步显示",
          "next": "如果一路狂录和硬掰同音都毁录音，那到底该怎么调",
          "notes": "证据：Table 5 的 CLIP 行 neg 0.1719 / Last 75.40 与 Base 行 neg 0.0579 / Last 72.74（ImageNet-100）。注意这两个端点是跨 10 个任务的结果，不是单任务内的逐轮变化（后者是 Fig.3，见 p3）；因此本页横轴写成“第几任务”，中间值按任务数线性插值，属示意。累计 Δ = (neg⁰ − neg)/neg⁰ 在任务 10 时约 66%，与 p4 单任务内的 Δ（阈值 α=10%）不是同一量，页面已分开表述。§4.1 指出交叉熵会把这组相似度往 +1/−1 推。类比边界：音分差只是“可测偏差”的替身，真实间隙是跨模态余弦相似度的整体水平，并非音高差；间隙扩大与准确率下降是同步观察，不能说成唯一因果。",
          "componentId": "mg-gap-base",
          "moduleId": "m1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 两种调法都毁录音",
      "modules": [
        {
          "kind": "module",
          "id": "m2",
          "title": "朴素微调 vs 硬掰对齐",
          "desc": "切换两种调法并推进训练，比较相似度与准确率两条曲线。",
          "componentId": "mg-two-failures"
        }
      ],
      "scenes": [
        {
          "id": "p2-two-failures",
          "title": "越录越偏，硬掰同音也不行",
          "goal": "切换“朴素微调 / 硬掰对齐”，在两条曲线上比较间隙与准确率。",
          "summary": "朴素微调把间隙拉开；直接对齐把间隙压平却改坏预训练表征。两条路都掉准确率。",
          "interaction": "点选调法、拖动训练进度，相似度曲线与准确率曲线同步移动，音分表在“越走越偏”与“被按平”之间切换",
          "next": "既然两条路都不通，训练过程中有没有一个可停的时机",
          "notes": "证据：Fig.2a（朴素微调：相似度 0.10–0.16 区间下滑、准确率 70–100% 区间下滑）、Fig.2b（对齐损失把图文相似度从约 0.2 抬到约 0.8、间隙压小，但准确率从约 95% 掉到约 60%）、§4.1 段4 指出下游数据只覆盖原特征空间一小块，直接对齐易过特殊化。朴素微调曲线的端点取 Table 5 的 CLIP/Base 行；对齐曲线按 Fig.2b 的定性形状，中间值不是实测。类比边界：真实的对齐损失是最小化匹配图文的欧氏距离（引 [7]），本页用“把音高硬掰到 0 音分”表示它压平间隙，不表示其数值大小。",
          "componentId": "mg-two-failures",
          "moduleId": "m2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 一次录制里的转折",
      "modules": [
        {
          "kind": "module",
          "id": "m3",
          "title": "正样本与负样本的逐轮读数",
          "desc": "拖动训练轮次，看 pos 先涨、neg 后降的转折。",
          "componentId": "mg-epoch-turn"
        }
      ],
      "scenes": [
        {
          "id": "p3-epoch-turn",
          "title": "先涨正样本，后掉负样本",
          "goal": "拖动训练轮次，找出正样本转平、负样本开始下降的那一段。",
          "summary": "前期的提升来自正样本变高（学到新知识）；后期负样本被推远，那只是间隙在扩。",
          "interaction": "拖动轮次指针，pos/neg 两条曲线上的读数点移动，并显示当前处于“学到”还是“推远”阶段",
          "next": "既然有个转折点，能不能用一条公式把它卡住",
          "notes": "证据：Fig.3(a) ImageNet-R 的逐轮读数——pos 0.26→0.305（epoch 2–3 后转平）、neg 0.165→0.108（epoch 2 之后开始下降），绿虚线标在 epoch 2；§4.2 段2 与 Eq.(1)(2) 定义 pos/neg。曲线按这些读数绘制，轮间为线性连接。Table 5 的 pos/neg 是最后任务下不同方法的对比，与本页的逐轮轨迹不是同一量，不能混用。类比边界：pos 上升对应“越来越确定自己拉的是哪个音”，neg 下降对应“把别的音推远”，二者都不是准确率本身。",
          "componentId": "mg-epoch-turn",
          "moduleId": "m3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 把阈值当刹车",
      "modules": [
        {
          "kind": "module",
          "id": "m4",
          "title": "Δ 与 α 的停手规则",
          "desc": "调整 α，看 Δ 曲线与停手轮次如何变化。",
          "componentId": "mg-stop-rule"
        }
      ],
      "scenes": [
        {
          "id": "p4-stop-rule",
          "title": "Δ 越过 α 就停手",
          "goal": "拖动 α，观察停手轮次 max(e,1) 与最终间隙。",
          "summary": "用负样本的相对变化量 Δ 当刹车：越过 α 就退回上一轮，整份数据集都按这个轮数训练。",
          "interaction": "拖动 α 阈值线，Δ 曲线与停手竖线移动，训练轮次与音分表读数同步更新",
          "next": "间隙稳住了，可它同时也把文本分类器压住了",
          "notes": "证据：Eq.(3) Δ=|neg^e−neg^0|/neg^0、§4.2 段3（超过 α 取最后一次仍低于 α 的轮次，全部任务训 max(e,1) 轮）、§5.1（α=10%）。neg 轨迹取 Fig.3(a) 的读数（0.165→0.108），因此停手轮次是“按公式演示”的结果（α=10% 时停在 e=3），不是论文报告的固定轮数；论文未给 α 的敏感性分析（在补充材料）。类比边界：α 是相对变化阈值，不是绝对音分；本页音分表把 Δ 按 0.6 倍映射成音分，仅为可读性。",
          "componentId": "mg-stop-rule",
          "moduleId": "m4"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 文本分类器够不到",
      "modules": [
        {
          "kind": "module",
          "id": "m5",
          "title": "子空间覆盖与秩下界",
          "desc": "切换分类器，比较图像空间被覆盖的比例。",
          "componentId": "mg-rank-bound"
        }
      ],
      "scenes": [
        {
          "id": "p5-rank-bound",
          "title": "参考麦的指向，够不到整个琴身",
          "goal": "切换三种分类器，比较覆盖距离 d(B_i,B·) 与未被覆盖的扇区。",
          "summary": "文本特征一般张不满图像空间（r<r′），最优分类器有一部分永远在它外面，误差有下界。",
          "interaction": "点选“只用文本 / 只用视觉 / 两路合用”，扇区覆盖与奇异值柱同步变化",
          "next": "既然够不到，就在够得到的那一侧另建一个分类器",
          "notes": "证据：§4.3 段1–2（T=T∥+T⊥；最优分类器存在等价形式完全落在图像子空间内）、Eq.(4) 的界 ‖T∥−W_opt‖_F²≥Σ_{i=r+1}^{r′}s_i²、Eq.(6) 的覆盖距离、Table 4（CIFAR-100：0.7732 / 0.6076 / 0.4917，ImageNet-R 与 ImageNet-100 同序）。d 是子空间覆盖距离（1=正交，0=包含），不是准确率；Eq.(4) 的下界需 r<r′ 才非零。页面右侧的 8 根奇异值柱、柱高与红蓝分界都是示意——论文只给 d 与 Eq.(4) 的下界，没有逐奇异值数据；扇区角度按 1−d 缩放同为可视化手段，真实空间是 512 维。",
          "componentId": "mg-rank-bound",
          "moduleId": "m5"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "06 · 在视觉空间另建一路",
      "modules": [
        {
          "kind": "module",
          "id": "m6",
          "title": "原型初始化与冻结",
          "desc": "摆新类原型、加训练轮次，看边界只在新类这一侧生长。",
          "componentId": "mg-visual-clf"
        }
      ],
      "scenes": [
        {
          "id": "p6-visual-clf",
          "title": "旧类锁住，只教新类",
          "goal": "拖动原型位置与训练轮次，观察视觉分类器边界如何包住新类。",
          "summary": "冻结骨干与旧类权重，新类用原型初始化余弦分类器，只用图像特征训练三轮。",
          "interaction": "拖动原型位置和训练轮次，新类边界向外生长；原型压到旧类一侧时边界侵入旧类并报警",
          "next": "两路分类器各自出分，最后怎么合",
          "notes": "证据：§4.3 段3（冻结 f_clip 与旧类权重，用原型初始化 W_v，仅用图像特征训练，梯度留在输入即视觉空间）、§5.1（3 epoch、lr 5e-4、cosine classifier）。二维决策区为教学示意，真实空间 512 维；滑块语义是“原型越靠左越贴近旧类边界”，越过边界时提示“旧类判定可能被改写”——这是从“旧类权重冻结”推出的推断，论文没有做这个消融，页面文案已标（推断）。类比边界：贴纸式原型对应类原型（均值特征），不是真实样本。",
          "componentId": "mg-visual-clf",
          "moduleId": "m6"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "07 · 两路合分",
      "modules": [
        {
          "kind": "module",
          "id": "m7",
          "title": "β 权重与最终分数",
          "desc": "拖动 β，看三类分数与最终判定翻转。",
          "componentId": "mg-fuse-beta"
        }
      ],
      "scenes": [
        {
          "id": "p7-fuse-beta",
          "title": "β 决定听谁的",
          "goal": "拖动 β 推子，观察新类分数从被压住到被救回、再到反超。",
          "summary": "最终分数是文本分类器分数加上加权的视觉 softmax；β 小则新类吃亏，β 大则旧类被抢。",
          "interaction": "拖动 β 推子，两路权重与三类概率条同步变化，顶部判定结果翻转",
          "next": "把两个阶段和推理串起来，看整条流水线",
          "notes": "证据：Eq.(5) pre(x)=f_clip(x,t)+β·softmax(W_vᵀx)、§5.1（β=4）。三类分数为教学玩具值，用于展示相加后排序如何变化，不是论文实验数据；β 的敏感性分析在补充材料。页面把三类分数乘 2.2 再 softmax，只是为了把概率拉开到能看出翻转（显示用温度），论文没有这个系数，公式仍是 Eq.(5) 原样。类比边界：推子是把“加权和”具象化，真实 β 是固定常数，不随样本自适应。",
          "componentId": "mg-fuse-beta",
          "moduleId": "m7"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "08 · 两阶段与推理",
      "modules": [
        {
          "kind": "module",
          "id": "m8",
          "title": "管线与冻结状态",
          "desc": "逐步推进阶段Ⅰ、阶段Ⅱ与推理，看谁冻结、谁训练。",
          "componentId": "mg-pipeline"
        }
      ],
      "scenes": [
        {
          "id": "p8-pipeline",
          "title": "调音台走一遍：谁冻结、谁训练",
          "goal": "逐步切换四个阶段，核对每一步冻结了哪些参数、输出怎么合成。",
          "summary": "阶段Ⅰ只练 LoRA 并盯 Δ；阶段Ⅱ冻结骨干与旧类权重、只建视觉分类器；推理时两路相加。",
          "interaction": "点选阶段按钮，管线上的模块从灰变亮、线缆从虚线变实线，右侧说明与读数同步替换",
          "next": "这套流程在五个数据集上到底换来多少",
          "notes": "证据：Fig.4 的两阶段与推理合分、§4.2、§4.3、Eq.(5)、§5.4（0.54M 可学习参数、首任务每轮一次前向无反向）。阶段Ⅰ是“LoRA 微调骨干 + 训练分类头（旧类权重）”一起做，不是只练 LoRA；阶段Ⅱ才把骨干与旧类权重冻结。文本分类器在阶段Ⅰ就被使用（类名相似度 + 交叉熵），因此三个阶段都保持点亮，只是“合分”从阶段Ⅱ之后才启用。图中模块顺序依 Fig.4，线缆与配色为教程重绘；参数量只计可学习参数，不含存储。",
          "componentId": "mg-pipeline",
          "moduleId": "m8"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "09 · 主结果",
      "modules": [
        {
          "kind": "module",
          "id": "m9",
          "title": "五个数据集的 Last 排序",
          "desc": "切换数据集，比较四种方法在 Last 上的高低。",
          "componentId": "mg-main-results"
        }
      ],
      "scenes": [
        {
          "id": "p9-main-results",
          "title": "五个数据集上的 Last",
          "goal": "逐个数据集查看 Last，判断哪一组我们并非第一。",
          "summary": "四个数据集上 Last 最高；ImageNet-100 上低于两个用回放的方法，但在非回放方法里最高。",
          "interaction": "点选数据集，高亮该组四根柱子并显示数值表",
          "next": "Last 高了，那 CLIP 原本的零样本能力还在吗",
          "notes": "证据：Table 1 的 Last 列（CIFAR-100 80.57、ImageNet-R 82.67、ImageNet-100 78.38、ImageNet-1K 73.68、VTAB 91.53；对比 RAPF/CLAP/MagMax）；§5.2 给出“至少高 1.53%/1.82%”与“IN-100 低于用回放的 RAPF/CLAP”的原始表述。Exemplar 列是合并单元格：DR = PROOF/CLAP，FR = SLCA/RAPF，NR 覆盖 L2P++ 至 MagMax 以及本文——因此 MagMax 与本文同为无回放（图中空心点），IN-100 的 78.38 高于 MagMax 的 75.92，但低于 RAPF(80.23)/CLAP(79.16)。图形用点图而不是柱状图：纵轴从 45% 起时，柱长会编码“值−45”，1.57 的差距看起来像 3 倍；点的高度只由数值决定，虚线只作引导。不跨数据集平均。",
          "componentId": "mg-main-results",
          "moduleId": "m9"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "10 · 零样本能力",
      "modules": [
        {
          "kind": "module",
          "id": "m10",
          "title": "训练后的零样本复核",
          "desc": "切换方法，看三个独立集合上的零样本准确率。",
          "componentId": "mg-zeroshot"
        }
      ],
      "scenes": [
        {
          "id": "p10-zeroshot",
          "title": "训完之后，还认得没见过的集合吗",
          "goal": "切换方法，比较三个独立集合与 Avg 的零样本准确率。",
          "summary": "只在 CIFAR-100 上做过类增量，本方法仍略高于原始 CLIP；回放方法的零样本能力大幅下降。",
          "interaction": "点选方法按钮，柱状图与数值表同步替换，磁带标签换色",
          "next": "两个部件各自贡献了多少",
          "notes": "证据：Table 2 与 §5.3 全表七个方法（CLIP 85.14/87.6/64.44，Avg 79.06；PROOF 9.75/22.81/11.18，14.58；RAPF 17.18/28.56/15.2，20.31；CLAP 80.82/74.68/56.04，70.51；MOE4CL 82.85/84.06/66.02，77.64；MagMax 81.67/85.96/66.44，78.02；Ours 85.70/88.17/67.29，80.39）。CLIP 行是未经下游训练的参照，不是上界——Ours 的 Avg 80.39 比它略高。只测了这三个集合；回放方法下降是该设定下的观察，不能推广成“回放必然破坏零样本”。",
          "componentId": "mg-zeroshot",
          "moduleId": "m10"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-11",
      "title": "11 · 模块消融",
      "modules": [
        {
          "kind": "module",
          "id": "m11",
          "title": "MGP / MGC 开关",
          "desc": "开关两个部件，看 Avg、Last 与 neg 的组合变化。",
          "componentId": "mg-ablation"
        }
      ],
      "scenes": [
        {
          "id": "p11-ablation",
          "title": "保持与补偿各管什么",
          "goal": "组合开关 MGP 与 MGC，比较四种组合的 Last 与 neg。",
          "summary": "两个部件单独用都涨，合用最好；单独加 MGP 的收益更大，而 MGC 在基线已被拉开时更显眼。",
          "interaction": "切换两个开关，四根柱子高亮当前组合，数值表与音分表读数同步",
          "next": "这套办法的代价和适用边界在哪",
          "notes": "证据：Table 3 四行 Avg / Last（84.30/72.74、85.10/74.58、86.73/76.86、87.31/78.38，ImageNet-100）；§5.5 指出基线已扩大间隙，因此单独加 MGC 的 1.84% 大于在 MGP 之上再加的 1.52%。neg 只有 Table 5 给了 Base（0.0579）与 Ours（0.1520）两个组合；Table 5 的 0.1719 属于原始 CLIP、0.1718 属于 Distill，都不是“只保/只补”组合，所以表格里这两行标“—”，不做推断。类比边界：推子开关对应模块开关，不表示两者的参数共享关系。",
          "componentId": "mg-ablation",
          "moduleId": "m11"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-12",
      "title": "12 · 代价与边界",
      "modules": [
        {
          "kind": "module",
          "id": "m12",
          "title": "参数量与作者自述局限",
          "desc": "切换方法比较可学习参数，并核对三条适用边界。",
          "componentId": "mg-cost-limits"
        }
      ],
      "scenes": [
        {
          "id": "p12-cost-limits",
          "title": "0.54M 换来的，与换不来的",
          "goal": "比较各方法的可学习参数，并指出“参数少”不等于“总开销小”。",
          "summary": "本方法只多 0.54M 参数、无需回放；但 IN-100 上不如回放方法，且未做专门的遗忘约束。",
          "interaction": "点选方法，参数条高亮并显示该方法的口径说明；选中 RAPF 时出现 26M 存储开销提示",
          "next": "回到目录，选下一步要做什么",
          "notes": "证据：Fig.5 与 §5.4（PROOF 13.35、RAPF 0.26、CLAP 9.45、MOE4CL 86.18、MagMax 1.31、Ours 0.54，单位 M；RAPF 另需按类存协方差，100 类约 26M）、§6 Limitations（只用 LoRA、无专门损失或参数约束、未与其他 CL 方法结合）。参数与存储是两种口径，不能直接合并比较；三条边界中第一条来自 Table 1 的 IN-100 行。类比边界：台面器材清单只是“清单”意象，不表示显存占用。",
          "componentId": "mg-cost-limits",
          "moduleId": "m12"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg",
    "p1-gap-base": "./thumbnails/p1-gap-base.jpg",
    "p2-two-failures": "./thumbnails/p2-two-failures.jpg",
    "p3-epoch-turn": "./thumbnails/p3-epoch-turn.jpg",
    "p4-stop-rule": "./thumbnails/p4-stop-rule.jpg",
    "p5-rank-bound": "./thumbnails/p5-rank-bound.jpg",
    "p6-visual-clf": "./thumbnails/p6-visual-clf.jpg",
    "p7-fuse-beta": "./thumbnails/p7-fuse-beta.jpg",
    "p8-pipeline": "./thumbnails/p8-pipeline.jpg",
    "p9-main-results": "./thumbnails/p9-main-results.jpg",
    "p10-zeroshot": "./thumbnails/p10-zeroshot.jpg",
    "p11-ablation": "./thumbnails/p11-ablation.jpg",
    "p12-cost-limits": "./thumbnails/p12-cost-limits.jpg"
  }
};
