import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "OmniTaskonomy: When Does Visual Generation Improve Visual Understanding?",
    "titleZh": "OmniTaskonomy：视觉生成何时提升视觉理解？",
    "venue": "arXiv:2609.38079 · cs.CV · 2026",
    "authors": "Jiaxin Ge, Yiming Qin, Ji Xie, Haozhe Jiang, Xiaochuang Han, Junyi Zhang, Andrew Dai, Yinfei Yang, Jitendra Malik, Ranjay Krishna, Sewon Min, Haiwen Feng, Le Xue, Baifeng Shi, Trevor Darrell, XuDong Wang",
    "affiliation": "UC Berkeley · Duke · CMU · UW · Elorian · Impossible Research",
    "domain": "视觉 / 多模态",
    "coreProblem": "理解能帮生成，早有证据；但生成能否、何时帮理解，一直没有清楚答案。",
    "coreInsight": "在受控配对任务上：先用生成任务（I2I）以共享参数做一段训练建立初始化，再用少量理解数据（I2T）微调，配对任务的准确率会随生成数据量稳定提升。",
    "keywords": [
      "I2I→I2T",
      "OmniTaskonomy",
      "迁移增益",
      "梯度对齐",
      "统一多模态模型"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "仅 I2T：只练口述",
      "desc": "只有讲解时，木片顺序始终报不稳。",
      "componentId": "cover-shop"
    },
    "newMethod": {
      "title": "I2I→I2T：先拼后说",
      "desc": "先动手拼一批、手感更新，再练口述就报得准。",
      "componentId": "cover-shop"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 训练配方与配对任务",
      "modules": [
        {
          "kind": "module",
          "id": "m1-paired-task",
          "title": "同一输入的两种监督目标",
          "desc": "点两片木料交换位置，观察图像目标与文本目标同步变化。",
          "componentId": "s1-paired-task"
        },
        {
          "kind": "module",
          "id": "m2-recipes",
          "title": "六种训练配方的共享参数",
          "desc": "选一种配方，看两段工序里共享参数是否被更新。",
          "componentId": "s2-recipes"
        },
        {
          "kind": "module",
          "id": "m3-substitute",
          "title": "I2I 数据量对 I2T 预算的替代",
          "desc": "选任务与 I2T 预算，比较两条训练路径。",
          "componentId": "s3-substitute"
        }
      ],
      "scenes": [
        {
          "id": "s1-paired-task",
          "title": "配对任务：同一输入，两种输出模态",
          "goal": "在打乱的木料上亲手完成“拼回去”和“报出顺序”两件事，理解 I2I 与 I2T 只是同一视觉问题的两种输出。",
          "summary": "Jigsaw 与 Zoom-In 把输入与视觉问题固定，只改变答案是图像还是文本。",
          "interaction": "点一片木料再点另一片交换位置，右侧文本排列随之更新。",
          "next": "看六种训练配方如何处理共享参数",
          "notes": "出处：p.4 §3 Controlled paired tasks；p.4 Figure 2(a)。论文的 Jigsaw 把图像 patch 打乱，要求 I2I 还原成图、I2T 输出文本排列如 ('reorder',[4,2,3,1])；1k I2T 训练样本、15 epochs、3 个种子。本页把 patch 级重排简化为 2×2 木料示意，只保留“同一输入、两种输出模态”的结构，不对应论文的任何模型内部表示。",
          "componentId": "s1-paired-task",
          "moduleId": "m1-paired-task"
        },
        {
          "id": "s2-recipes",
          "title": "六种训练配方与共享参数更新",
          "goal": "区分六种配方，并从“共享参数是否被更新”解释为什么只有先做一段 I2I 的两条配方随数据稳定提升。",
          "summary": "I2I→I2T 与 I2I→Mixed 稳定 scaling；冻结共享参数或一开始就混合收益更弱或不稳定。",
          "interaction": "选一张配方卡，再拖动 I2I 数据档，观察工序条、共享参数状态、趋势示意与结论卡同步变化。",
          "next": "量化生成数据能替代多少讲解数据",
          "notes": "出处：p.4 §3 Which training recipe transfers best?；Figure 2(b)；FINDING 1。→ 表示先后两阶段，Mixed 表示同一 batch 混合 I2I 与 I2T，Frozen I2I 表示冻结与 I2T 共享的参数、只更新生成专有参数。论文只报告相对趋势（稳定上升 / 更弱或不稳定），本页不给出曲线数值；“师傅手感”只是共享参数的类比，真实共享参数是 LM、理解组件与 ViT 权重（VAE 在 I2I 阶段冻结）。",
          "componentId": "s2-recipes",
          "moduleId": "m2-recipes"
        },
        {
          "id": "s3-substitute",
          "title": "I2I 数据替代 I2T 数据",
          "goal": "说出在给定任务上，多少生成数据加多少理解数据可以达到“只用理解数据”的可比水平。",
          "summary": "100k I2I + 1k/3k I2T 达到只用 10k I2T 的可比水平；I2T 预算越小，增益越大。",
          "interaction": "选任务，再选 I2T 预算（1k/3k/10k/30k），比较两条路径的条形长度、节省量与结论。",
          "next": "把对应关系落到单个样本上",
          "notes": "出处：p.4-5 §3；Figure 2(c)。I2I 预算固定 100k；论文对 1k/3k/10k/30k 四个预算都报告了提升，并指出预算越小增益越大。等价点是“可比（comparable）”而非严格相等：Zoom-In 为 1k、Jigsaw 为 3k 对标 10k I2T。条形长度按对数刻度绘制，仅为可读性，不改变数值含义。",
          "componentId": "s3-substitute",
          "moduleId": "m3-substitute"
        },
        {
          "id": "s4-instance",
          "title": "逐样本对应：拼对了，也说对了",
          "goal": "用同一批样本上的条件正确率，判断 I2I 与 I2T 的对应是否只发生在总体均值上。",
          "summary": "同一输入上 I2I 预测正确时，I2T 正确率明显更高。",
          "interaction": "切换任务，点四格样本条中的任一格，看该格的计数、含义与对应的条件正确率。",
          "next": "进入 OmniTaskonomy 的统一分类",
          "notes": "出处：p.5 Table 1。30k I2I + 1k I2T、三次种子、1k 配对评估输入；Jigsaw：I2I 70.9、I2T 81.3、P(I2T✓|I2I✓)=88.2、P(I2T✓|I2I×)=64.3；Zoom-In：91.8、90.6、90.9、86.7。两个任务是不同难度，因此不要把 88.2 与 90.9 直接比大小，只在同一任务内比较两个条件。",
          "componentId": "s4-instance"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 统一分类与迁移地图",
      "modules": [
        {
          "kind": "module",
          "id": "m5-taxonomy",
          "title": "3R 层级与分离叶子",
          "desc": "点一个能力叶子，看它在三 R 中的归属与同族任务。",
          "componentId": "s5-taxonomy"
        },
        {
          "kind": "module",
          "id": "m6-build",
          "title": "分类树的构建与人工校验",
          "desc": "推进四个构建阶段，观察树结构与该阶段的真实规模。",
          "componentId": "s6-build"
        },
        {
          "kind": "module",
          "id": "m7-transfer",
          "title": "源任务对能力的显著增益",
          "desc": "点一个 I2I 源任务，看它显著提升了哪些理解能力。",
          "componentId": "s7-transfer"
        }
      ],
      "scenes": [
        {
          "id": "s5-taxonomy",
          "title": "三 R 层级与分离的叶子",
          "goal": "把一项能力放回 3R 中的位置，并区分“理解能力叶子”和“I2I 任务叶子”。",
          "summary": "19 个 I2I 任务与 25 个理解能力共享同一 3R 层级，但仍是分离的叶子。",
          "interaction": "先把 5 个 I2I 任务逐个挂到三块挂板上，再看每块板里的能力示例与判定反馈。",
          "next": "看这张表是怎么建出来的",
          "notes": "出处：p.5-6 §4；Figure 3（本页用自绘的三块挂板复述其层级关系，未改画原图；原图 3 的叶子标签在原尺寸已很密，缩到幻灯片尺寸会不可读，故按契约 §11 不嵌入）。3R 取自 Malik et al. 2016；细粒度能力自下而上从 7 个基准问题归纳。形状区分：圆=理解能力，方=I2I 任务。25 个能力里有 6 个评估样本少于 100，不出现在主文迁移图中。",
          "componentId": "s5-taxonomy",
          "moduleId": "m5-taxonomy"
        },
        {
          "id": "s6-build",
          "title": "分类树怎么建出来，校验到什么程度",
          "goal": "说清四步构建流程与该阶段的真实规模，并知道人工校验只覆盖抽样。",
          "summary": "7 个基准 → 固定属性 schema → 10 批局部树 → 合并并归入 3R；三评审 ≥2/3 一致保留 9,444 例。",
          "interaction": "点四个阶段节点推进树状示意，并切换三个评审的投票，看 ≥2 一致才保留的规则。",
          "next": "读迁移地图",
          "notes": "出处：p.6 §4；p.19 Figure 7；p.21-22 Table 6。真实数字：7 个基准（BLINK、MM-Star、MMT-Bench、CV-Bench、RealWorldQA、MMVP、VStarBench）、属性描述用 gemini-3-flash-preview、10 个基准分层批次、三评审 ≥2/3 一致保留 9,444 例；人工校验 250 例 / 400 次评审，确定判断中 97.4% 与 VLM 一致，Cohen's κ 0.956–0.989（均值 0.972），四人共同复核 50 例 Krippendorff's α = 0.943。树节点数只是示意，真实叶子为 25 个能力。",
          "componentId": "s6-build",
          "moduleId": "m6-build"
        },
        {
          "id": "s7-transfer",
          "title": "19×25 的迁移地图：谁帮了谁",
          "goal": "读出迁移的选择性：只有少数能力被显著提升，且每个源任务帮助的对象不同。",
          "summary": "Metric 3D 与 Counting 受益源最多（各 12 个），2D Ordering 11 个；OCR 与外观理解没有显著提升。",
          "interaction": "点源任务列高亮整列，再点具体单元格，看该单元的增益、来源与显著性条件。",
          "next": "转而问：为什么会迁移",
          "notes": "出处：p.7 §5.2；Figure 4；p.8 §5.2 正文数值。本页只画正文报告了具体 pp 的单元：Localization→Counting +2.5、Object pointing→Counting +2.0、Inpainting→Counting +1.5、Jigsaw→2D Ordering +6.8、Inpainting→2D Ordering +7.2、Z-depth→Metric 3D +3.6、Euclidean depth→Metric 3D +3.8、Surface normals→Metric 3D +3.4、2.5D segmentation→Category recognition +1.2、Z-depth→Localization +2.3（图 4 标注值）。空白表示论文未报告该组合的显著增益，不等于零增益或有害。",
          "componentId": "s7-transfer",
          "moduleId": "m7-transfer"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 梯度对齐：为什么会迁移",
      "modules": [
        {
          "kind": "module",
          "id": "m8-alignment",
          "title": "对齐分数的计算",
          "desc": "拖夹角、调有效维度，实时算出对齐分数 s。",
          "componentId": "s8-alignment"
        },
        {
          "kind": "module",
          "id": "m9-where",
          "title": "对齐集中的参数块与层",
          "desc": "选参数块与层，看论文报告的对齐强弱分布。",
          "componentId": "s9-where"
        }
      ],
      "scenes": [
        {
          "id": "s8-alignment",
          "title": "对齐分数：s = √d_eff · cos(θ)",
          "goal": "亲手改变两个梯度方向的夹角与有效维度，理解分数为正/负的条件，以及为什么不同参数块可以比较。",
          "summary": "对齐分数＝归一化梯度在共享 PCA 子空间内的余弦，再乘有效维度的平方根。",
          "interaction": "拖动橙色箭头或用滑块改变 θ，并调整 d_eff，观察 cos、s 与判定文字实时变化。",
          "next": "看这种对齐落在哪些模块与层",
          "notes": "出处：p.9 §6.1（公式）。论文做法：梯度在预训练 checkpoint θ0 处计算，逐参数块 L2 归一化，拟合共享无中心 PCA（保留累计 99% 方差的最少主成分），在子空间内算余弦并乘 √d_eff。本页把高维方向压成二维夹角：θ、d_eff 的取值域都是示意，真正的 s 是逐参数块、逐样本计算后再平均；符号说明用 SymbolHint，不要让学习者以为 d_eff 可随意设定。",
          "componentId": "s8-alignment",
          "moduleId": "m8-alignment"
        },
        {
          "id": "s9-where",
          "title": "对齐集中在注意力前的归一化层",
          "goal": "指出对齐最强的参数块与层区间，并说明图的读法与它的定性性质。",
          "summary": "受控配对里，理解分支 pre-attention RMSNorm 的对齐最强，且较早层更强。",
          "interaction": "点参数块、点层条或在层条上横向拖动，观察结论卡、层区间着色与相对对齐强度条。",
          "next": "看对齐与下游增益的相关",
          "notes": "出处：p.8-9 §6.2；Figure 5(a,b)；p.10 FINDING 3。Jigsaw 与 Zoom-In 各采样 500 个配对样本，在预训练 checkpoint 处计算。本页柱高与配色是定性示意（论文正文未给逐层数值），只表达“pre-attn 最强、较早层更强、部分块为负”。Q-norm / K-norm / Out 的负值依据图 5(a)。",
          "componentId": "s9-where",
          "moduleId": "m9-where"
        },
        {
          "id": "s10-correlation",
          "title": "对齐与增益的两种粒度相关",
          "goal": "比较两种聚合粒度下的相关强度，并守住“相关不是因果”的边界。",
          "summary": "平均对齐越高的能力，平均迁移增益越大；单对层面方向一致但更松。",
          "interaction": "点图 5 的左/右半幅，或切换下方两张卡，读对应的 r、含义与“相关不是因果”的边界。",
          "next": "把增益换算成具体准确率并看条件",
          "notes": "出处：p.9 §6.3；Figure 5(c,d)。能力级为 7 个能力（评估样本 > 500）对 19 个源平均；任务对级为 19×7=133 对。r 为 Pearson 相关系数，论文用“associated with”，本页明确写“相关不是因果”。本页只截取原图 5 的 (c)(d) 两联（./images/fig5-cd.png），(a)(b) 已在上一页讨论。",
          "componentId": "s10-correlation"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 增益的换算与适用条件",
      "modules": [
        {
          "kind": "module",
          "id": "m11-gain",
          "title": "基线 + Δ 的换算",
          "desc": "选能力与源任务，把百分点增益换算成具体准确率。",
          "componentId": "s11-gain"
        },
        {
          "kind": "module",
          "id": "m12-recipe-card",
          "title": "按目标能力挑生成任务",
          "desc": "选一个想提升的能力，生成对应的任务与配方卡。",
          "componentId": "s12-recipe-card"
        }
      ],
      "scenes": [
        {
          "id": "s11-gain",
          "title": "把百分点增益换算成准确率",
          "goal": "用 Δ 的定义算出训练后的绝对准确率，并知道这个差值来自哪种检验与多少个种子。",
          "summary": "Δ 是相对 I2T-only 基线的百分点变化；训练后准确率 = 基线 + Δ。",
          "interaction": "选能力、选源任务，再拖动“你的基线”滑块，刻度尺上的基线与训练后两点随之移动。",
          "next": "把方法用起来并说明适用条件",
          "notes": "出处：Δ 定义见 p.7 §5.1；基线见 p.32 Table 12；Δ 数值见 p.7-8 §5.2 与图 4。只列正文报告过显著增益的组合；Localization 的源 Z-depth 为图 4 标注值（+2.3）。显著性为逐样本精确配对置换检验 p<0.05，三次种子平均。跨能力不应比较绝对准确率（各能力难度不同）。",
          "componentId": "s11-gain",
          "moduleId": "m11-gain"
        },
        {
          "id": "s12-recipe-card",
          "title": "按目标能力挑生成任务与配方",
          "goal": "把论文的路线图用一次：给定想提升的能力，选生成任务、定配方，并说清适用范围。",
          "summary": "先 I2I 后 I2T，并按目标能力挑选有显著增益的源任务。",
          "interaction": "选目标能力，再切换“同一底座 / 换底座或改预算”，看任务清单、配方与可外推性判定。",
          "next": "",
          "notes": "出处：结论与路线图见 p.3 与 p.10 §7；增益数值见 p.7-8 §5.2。适用范围来自实验设置（单一底座 BAGEL-7B-MoT、50k/50k 预算、4 GPU、三次种子，见 p.7 §5.1 与 p.32 Table 11），是本教程按论文条件写出的解读，不是论文的独立 Limitations 章节。不要把“按能力挑任务”写成已被验证的通用做法。",
          "componentId": "s12-recipe-card",
          "moduleId": "m12-recipe-card"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "s1-paired-task": "./thumbnails/s1-paired-task.png",
    "s2-recipes": "./thumbnails/s2-recipes.png",
    "s3-substitute": "./thumbnails/s3-substitute.png",
    "s4-instance": "./thumbnails/s4-instance.png",
    "s5-taxonomy": "./thumbnails/s5-taxonomy.png",
    "s6-build": "./thumbnails/s6-build.png",
    "s7-transfer": "./thumbnails/s7-transfer.png",
    "s8-alignment": "./thumbnails/s8-alignment.png",
    "s9-where": "./thumbnails/s9-where.png",
    "s10-correlation": "./thumbnails/s10-correlation.png",
    "s11-gain": "./thumbnails/s11-gain.png",
    "s12-recipe-card": "./thumbnails/s12-recipe-card.png"
  }
};
