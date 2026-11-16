import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "RanPAC: Random Projections and Pre-trained Models for Continual Learning",
    "titleZh": "RanPAC：随机投影与预训练模型驱动的持续学习",
    "venue": "NeurIPS 2023 · University of South Australia / The University of Adelaide",
    "authors": "Mark D. McDonnell, Dong Gong, Amin Parvaneh, Ehsan Abbasnejad, Anton van den Hengel",
    "affiliation": "University of South Australia; The University of Adelaide",
    "domain": "视觉持续学习 · 预训练模型 · 随机投影",
    "coreProblem": "冻结预训练模型后，怎样在不回放旧样本、不依赖测试任务编号的条件下持续吸收新类别，并避免旧类原型与分类器失真？",
    "coreInsight": "一次采样并冻结非线性随机投影，持续累计投影 Gram 矩阵与类原型，再用岭校准闭式求出分类权重。",
    "keywords": [
      "持续学习",
      "随机投影",
      "类原型",
      "Gram 矩阵",
      "岭回归",
      "ViT"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "原始特征更新",
      "desc": "同一套共享分类器在旧页与新页上反复施压，旧标签逐渐被覆盖。",
      "componentId": "rp-cover-old"
    },
    "newMethod": {
      "title": "固定随机板 + 累积账本",
      "desc": "随机穿孔板一次成形后保持不动，投影账本逐任务累加，岭校准把重叠纹理压成清晰标签。",
      "componentId": "rp-cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "顺序学习为何制造漂移",
      "modules": [
        {
          "kind": "module",
          "id": "drift",
          "title": "持续更新的稳定性—可塑性压力",
          "desc": "拖动拓印压力，观察当前页清晰度上升的同时，旧页标签被逐渐抹去。",
          "componentId": "rp-ch1-drift"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch1-drift",
          "componentId": "rp-ch1-drift",
          "title": "顺序学习为何制造漂移",
          "goal": "在一个共享分类器上顺序写入新类别时，为什么旧类标签会被新类的压力覆盖？",
          "summary": "手账的三页纸由同一个拓印拓板依次压印：压力越大，当前页的叶脉越清楚，旧页铅笔标签却越淡。蓝色说明压力偏低，绿色说明新旧可以兼顾，红色说明旧标签正在被抹掉。",
          "interaction": "拖动「书写压力」滑块（20 至 95，默认 48），或按住 Canvas 上的拓印垫左右拖动；滑块支持方向键微调，Canvas 支持点击与方向键。当前页清晰度与旧页保留率都由压力推导，共享天平条随压力从红端滑向绿端。",
          "next": "下一章先看清被冻结的主干究竟交出了什么：预训练特征向量 f 里已有的通用证据。",
          "notes": "对应 p.2 §1 对顺序、非平稳学习与灾难性遗忘的界定。压力只是稳定性—可塑性冲突的教学编码，不是梯度幅度，Canvas 不建立任何基准准确率；旧页保留率与当前页清晰度是一对互相挤压的推导量，用于说明单一共享更新无法同时最大化旧类保留与新类适配。三页纸叠放在同一页手账里，暗示旧样本不会被回放，只能靠过去的写入痕迹维持。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "冻结预训练特征能提供什么",
      "modules": [
        {
          "kind": "module",
          "id": "feature-lens",
          "title": "原始特征的可复用证据",
          "desc": "选择叶片的四个局部区域，看不同纹理点亮同一个冻结特征向量的不同维度，并改变最近类。",
          "componentId": "rp-ch2-feature-lens"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch2-feature-lens",
          "componentId": "rp-ch2-feature-lens",
          "title": "冻结预训练特征能提供什么",
          "goal": "被冻结的 ViT-B/16 主干给出的原始特征向量 f，在交给 RanPAC 之前已经包含哪些可复用证据？",
          "summary": "一片被压平的叶子对应一张原始特征向量：叶缘、叶脉交叉、叶柄、叶斑四个局部区域各自点亮十二个教学维度的不同格子，并让三个教学类别得到不同的余弦分数。叶脉交叉证据最丰富，叶斑最稀疏。",
          "interaction": "点击四个区域按钮之一，或直接点击 Canvas 上对应的叶脉热点；热点可聚焦后用方向键切换区域。右侧十二格特征条与最近类分数随即重算，叶片放大镜同时移到该区域并放大局部纹理。",
          "next": "通用证据已经存在，但多个类别仍共享同样的纹理方向；下一章把类均值放进二维平面，看余弦与 Gram 分数为什么会被这份重叠误导。",
          "notes": "对应 p.3 §3 与 p.2 Fig.1：冻结预训练主干把图像映射为特征向量，RanPAC 消费的是这份未再训练的表征。L=768 是 ViT-B/16 的实现规模事实，页内十二维特征与三个类别的分数只是教学用小向量，不来自论文任何测量。最近类由点积并归一化得到，属于余弦型归类，与 p.4 Eq.(1) 的 NCM 概念一致；类比边界：这不是真实 ViT 的激活可视化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "相关类原型为何需要去相关",
      "modules": [
        {
          "kind": "module",
          "id": "ncm",
          "title": "相关类原型与余弦 NCM",
          "desc": "在二维平面里拖动类均值标记，观察两个余弦分数一起升高而差值缩小的过程。",
          "componentId": "rp-ch3-ncm"
        },
        {
          "kind": "module",
          "id": "gram",
          "title": "Gram 逆映射与残差相关",
          "desc": "选择共享方向、类别残差或噪声，查看 toy Gram 矩阵与逆映射对分数和残差相关的作用。",
          "componentId": "rp-ch3-gram"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch3-ncm",
          "componentId": "rp-ch3-ncm",
          "title": "相关类原型为何需要去相关",
          "goal": "当两个类原型共享同一条叶脉方向时，余弦 NCM 为什么会被共同基线误导？",
          "summary": "测试特征与两个类均值画在同一平面里，余弦分数由真实角度算出。把类均值标记拖向共享方向，两个分数会一起升高，而它们的差值缩小，绿色可分离结论随之消失。",
          "interaction": "拖动橙色类均值标记在共享方向与类别残差之间移动，或在标记上按左右方向键；也可以点击「重置位置」回到初始角度。Canvas 中两个原型向量的夹角、分数条、差值刻度与反馈都由同一个二维坐标推导。",
          "next": "余弦只比较方向；下一幕把类原型放回矩阵视角，看 Gram 逆映射怎样尝试消除共享方向，又为何会放大不稳定方向。",
          "notes": "对应 p.4 Eq.(1)：NCM 以类均值 c_y 与测试特征 f_test 的余弦相似度排序，分数越高越接近该类。二维角度只为了让余弦几何可见，坐标与雷达环是教学构造，不是论文图 2 的数值重绘。图 2 的训练集探针准确率（联合探针 82%、原始余弦 NCM 64%、Gram 75%、Gram+RP 87%，M=2000）在本页不出现，也不能与最终基准准确率比较。"
        },
        {
          "id": "rp-ch3-gram",
          "componentId": "rp-ch3-gram",
          "title": "原始 Gram 分数能否消除共享方向",
          "goal": "把余弦换成 Gram 逆映射之后，共享方向真的被去掉了吗？分数又为什么不是余弦相似度？",
          "summary": "四乘四 Gram 热图显示强非对角项，右下角的向量分解与分数条展示 G 逆映射对类原型的分量重分配；选择共享方向、类别残差或噪声，分数与残差相关同时变化，去掉共享方向后分数更多由类别残差决定，近奇异方向会被放大。",
          "interaction": "点击三个分量按钮或 Gram 热图中的任一格，该格所在行列高亮并映射到对应分量；每个格可用键盘 Tab 聚焦、回车或空格选择。分数按 s_y = f_test^T G^-1 c_y 与三个分量各自的分数向量逐步相加，残差相关由逐步更新的二维相关矩阵重新计算。",
          "next": "原始空间的逆映射会放大病态方向，这正是后续随机投影去相关要处理的问题。",
          "notes": "对应 p.4 Eq.(3) 与 p.4 Fig.2：原始 Gram 分数使用 f_test^T G^-1 c_y，不是余弦相似度，也不做归一化。矩阵 G=[[1.8,1.5],[1.5,1.6]]、三个分量向量与协方差均为教学小例；残差相关由逐步更新的二维相关矩阵实时算出，不是论文热图的复现。Gram 逆映射是真实算子而非标签，但近奇异方向会被放大，所以它不是免费的清洗。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "固定随机投影怎样展开非线性纹理",
      "modules": [
        {
          "kind": "module",
          "id": "width",
          "title": "冻结随机投影的宽度与非线性",
          "desc": "拖动投影宽度 M、切换非线性 φ，或直接在固定穿孔板上横向蹭动拓印垫：孔位数量始终不变，展开后的叶脉条数、分数差值与宽度档位都由同一状态算出。",
          "componentId": "rp-ch4-width"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch4-width",
          "componentId": "rp-ch4-width",
          "title": "孔位不动的板能展开多少纹理",
          "goal": "同一块固定随机穿孔板为什么不靠“掷色子”而靠宽度与非线性提供原始特征之外的可分纹理？",
          "summary": "板上孔洞数量固定，只随宽度 M 决定同一份随机组合能压出多少条局部叶脉；把 φ 从恒等换成 ReLU 后，负向贡献被截零，两类分数差随之放大。宽度档位用 24 个采样点跨越 100 到 15000，并标出论文常用的 M=10000 与 L=768 的位置。",
          "interaction": "拖动「投影宽度 M」滑块或在固定穿孔板上横向拖动拓印垫（方向键左右也可移动垫子），再切换「非线性 φ」为逐元素 ReLU 或恒等。板面隐藏的随机矩阵决定每条叶脉对两个类别的贡献，条数、高度、分数差、宽度档位与回执全部由 M 与 φ 重新计算。",
          "next": "展开后的 h 进入累计账本后仍是接近奇异的统计，下一幕用岭参数决定它被放大还是被压住。",
          "notes": "依据 p.5 §4：W 一次采样后冻结，h = φ(fᵀW)，f 为 L×1、W 为 L×M、h 为 M×1；论文主实验通常取 M=10000（ViT-B/16 原始维数 L=768）。p.8 图 3(a) 为 split ImageNet-R、T=10、仅 Phase 2 的消融；p.24 表 A5 为 split CIFAR100、无 Phase 1、固定 λ=100、T=10，两者协议不同，本页不混用其数值。叶脉条数与分数差为教学编码，不代表真实激活图或测得的准确率；M>L 且带非线性是常用设计区，不是普适保证，若冻结主干给出的原始特征本身区分度不足，加大宽度也不会把它修好。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "岭校准怎样形成输出权重",
      "modules": [
        {
          "kind": "module",
          "id": "ridge",
          "title": "岭校准与输出权重",
          "desc": "在 -8 到 8 的对数轴上调节岭参数 λ，或直接点三个压力档：四个固定教学特征值的逆被放大或压住，类别对比曲线、输出权重条与分数余量同时更新。",
          "componentId": "rp-ch5-ridge"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch5-ridge",
          "componentId": "rp-ch5-ridge",
          "title": "λ 到底调节了什么",
          "goal": "在 W_o=(G+λI)⁻¹C 里，岭参数 λ 究竟压住哪些方向，又为什么不能当作通用准确率旋钮？",
          "summary": "四个固定特征值 0.08、0.6、1.4、5.0 模拟累计账本沿主方向的强弱。λ 极小时最小方向被放大成噪声放大倍数，两个类别的输出权重与分数余量随 λ 一起被压平；中段余量最大，过大时所有方向被同等压住、类别对比被过度平滑。",
          "interaction": "拖动「岭参数 λ」滑块或在三个压力档按钮间选择，主图里的四个逆增益柱、紫色不稳定带、类别对比曲线与两条输出权重条都会重算，同时给出 (G+λI)⁻¹ 中最小方向与最大方向的放大倍数、条件数以及两个类别的教学用分数余量。",
          "next": "有了稳定的逆与输出权重，下一步按时间顺序走一遍 Phase 2，看每个任务只写入累计统计、不做 SGD。",
          "notes": "依据 p.5 Eq.(4)-(6)：G=Σhhᵀ、C=Σhyᵀ、W_o=(G+λI)⁻¹C，算法中没有偏置项；p.6 §4.1 说明 λ 在每个任务上用当前任务的 80:20 划分从 10⁻⁸ 到 10⁸ 之间选择，不回放旧任务。四个特征值、类别向量与分数余量都是教学小例，不对应任何一次真实求解；λ 不是准确率旋钮，过小的 λ 放大不稳定方向，过大的 λ 会连类别证据一起压平。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "第二阶段每个任务做什么",
      "modules": [
        {
          "kind": "module",
          "id": "phase2",
          "title": "第二阶段的无 SGD 累计循环",
          "desc": "点击五个账本站点或按左右方向键推进一个任务：提取、投影、累计、选 λ、分类。活动位置、f 与 h 的维度、G 与 C 的累计进度和 c_y 的类别编号同步变化，主干与 W 始终冻结。",
          "componentId": "rp-ch6-phase2"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch6-phase2",
          "componentId": "rp-ch6-phase2",
          "title": "一个任务在账本上留下什么",
          "goal": "新任务到达后，Phase 2 的哪些量会变化，哪些量一次都不该被更新？",
          "summary": "账本流水线从左到右排开：冻结主干输出 L×1 的 f，固定板把它变成 M×1 的 h，再把 hhᵀ 与 hyᵀ 写进 M×M 的 G 与 M×K 的 C，随后只在当前任务内部选一次 λ，最后用 h_testᵀ(G+λI)⁻¹c_y 打分。站点越靠右，累计账本填得越满，但主干与 W 的锁始终不动。",
          "interaction": "点击流水线上的任一站点，或在站点组内按左右方向键移动；拓印垫跳到该位置，已完成的站点变绿，当前站点以下方刻度条显示 G 的累计进度，维度区改写成该步骤涉及的量，回执句子按当前步重算。",
          "next": "这条循环不训练任何东西；但任务一之前还留有一个可选的 PETL 阶段，下一幕处理它的启用条件与丢弃规则。",
          "notes": "依据 p.5 Algorithm 1 与 p.6 §4.1：Phase 2 只做特征提取、非线性投影、累计 G 与 C、在当前任务 80:20 划分上选择 λ（10⁻⁸ 到 10⁸）以及闭式分类，全程没有 SGD 权重更新；主干与随机投影 W 冻结，而 G、C、λ、W_o 仍会改变。图中的类别编号、累计进度条与样本刻度均为符号化表示，不是数据集计数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "首任务 PETL 何时值得启用",
      "modules": [
        {
          "kind": "module",
          "id": "firstsession",
          "title": "可选首任务 PETL 与临时分类头",
          "desc": "在无 PETL、仅适配器、适配器加提示三种首任务配置中选择，再按下「锁定首任务设置」：可训练模块、冻结主干、临时分类头与后续任务的入口全部由 mode 与 locked 推出。",
          "componentId": "rp-ch7-firstsession"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch7-firstsession",
          "componentId": "rp-ch7-firstsession",
          "title": "首任务适配该开到哪一档",
          "goal": "首任务 PETL 是必需步骤吗？它适配了哪些部件，又绝不允许在后续任务里发生什么？",
          "summary": "第一页夹具上，蓝色表示冻结的主干与 W，橙色表示只在任务一开启的适配器与提示，红色虚线表示只服务任务一的临时分类头。锁定之后夹具压紧、配置固定，临时头被划掉并盖上「已丢弃临时头」，进入后续任务的只有适配后的冻结特征入口。",
          "interaction": "用三个单选按钮改动首任务配置（无 PETL / 仅适配器 / 适配器+提示），然后点击「锁定首任务设置」或点击夹具上的锁扣；锁定后配置按钮禁用，夹具、流程标签、维度区与回执改为丢弃临时头之后的冻结入口描述。",
          "next": "适配是可选项，主干与固定板才是主线；下一章把两阶段的参数所有权与存储规模一次算清。",
          "notes": "依据 p.6 §4.1 与 p.23 图 A1：首任务 PETL 是可选项，只在任务一发生，做法是参数高效迁移学习（适配器或提示）配一个临时线性头；该临时头在 Phase 2 之前丢弃。SGD 只出现一次，即任务一上的这一步 PETL 训练；此后 Phase 2 不做 SGD。论文不认为它是必需步骤，也不保证每种方法在每个主干上都带来提升，增益取决于主干与数据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "架构与参数究竟放在哪里",
      "modules": [
        {
          "kind": "module",
          "id": "architecture",
          "title": "RanPAC 两阶段参数所有权",
          "desc": "在五段数据通路上选择部件或按数字键 1-5，查看冻结主干、一次成形的 W、逐元素 φ、累计 G/C 账本与闭式 W_o 各自的状态归属。",
          "componentId": "rp-ch8-architecture"
        },
        {
          "kind": "module",
          "id": "parameters",
          "title": "随机板存储与类权重开销",
          "desc": "切换 RanPAC / L2P 与 M=10000 / M=2000，按论文讨论规模 L=768、K=200 重算冻结随机板存储、类权重数量与总可训练参数区间。",
          "componentId": "rp-ch8-parameters"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch8-architecture",
          "componentId": "rp-ch8-architecture",
          "title": "冻结、累计与计算分别落在哪一步",
          "goal": "沿五段数据通路检查每个部件是否训练，回答 RanPAC 到底更新了哪些量。",
          "summary": "预训练主干与随机投影矩阵 W 一次成形后冻结；非线性 φ 逐元素作用，没有自己的可训练参数；Gram 账本 G 与类原型账本 C 随任务累计；输出权重 W_o=(G+λI)⁻¹C 由累计统计闭式求出，第二阶段不做 SGD，也没有偏置项。",
          "interaction": "点击通路上的五个部件，或直接按数字键 1-5；选中节点、它上游的依赖路径、下游的用法与右侧状态卡一起更新，回执区说明该部件的归属与依据。",
          "next": "所有权清楚之后，下一幕把冻结存储与前向类权重换算成具体规模，并与 L2P 的做法对照。",
          "notes": "依据 p.2 图 1 与 p.23 图 A1 的两阶段流程：Phase 2 中主干与 W 冻结，但 G、C、λ、W_o 仍会改变，Phase 2 没有 SGD 权重更新，论文也未描述偏置项。图中为紧凑拓扑，省略实现细节，不代表不同 PETL 架构的内部结构完全一致。"
        },
        {
          "id": "rp-ch8-parameters",
          "componentId": "rp-ch8-parameters",
          "title": "冻结存储与类权重的规模账",
          "goal": "在 L=768、K=200 的论文讨论规模下，投影宽度与方法各自带来多少冻结存储与可训练类权重？",
          "summary": "按论文讨论估算：M=10000 时冻结随机板处于约 10M 量级；约 200×M 表示前向类权重的规模估算，而不是精确的总可训练参数。论文给出的总可训练参数约 2.0-2.5M 会随 PETL 方法变化；选择 L2P 时只对照其约 0.3M-0.5M 可训练参数区间，不能据此单独判定方法优劣。",
          "interaction": "先用两个按钮选择方法（RanPAC / L2P），再选择投影宽度（M=10000 / M=2000）；板堆厚度、账本格数、可训练参数点阵与三个数值卡全部由这组选择重算，回执随组合变化。",
          "next": "宽度既影响代价也影响精度；下一章用受控宽度消融确认哪一段宽度才真正超过无 RP，并检查去掉任务边界后增益是否仍在。",
          "notes": "数值依据 p.9 §4.5 与表 2/表 4 讨论：L=768、K=200、M=10000 时注入 RP 层约带来 10 倍于原始维数的类权重、约 10M 非可训练权重，总可训练参数约 2-2.5M（依 PETL 方法），L2P、DualPrompt、ADaM 约 0.3M-0.5M。所有数字都只表示参数与存储规模，按论文讨论估算，不是延迟或能耗测量；论文也提醒 M 不必取到 10000（表 A5）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "宽度与任务边界是否改变结论",
      "modules": [
        {
          "kind": "module",
          "id": "width-gauge",
          "title": "投影宽度门限与任务无关稳健性",
          "desc": "拖动 Table A5 的九个投影宽度位置，只绘制论文报告的 RP 准确率，并把 M>1250 才超过 no-RP 的结论保留为文字门限；再切换到 200 个五批量微任务，查看任务无关设置下的定性结论。",
          "componentId": "rp-ch9-width-gauge"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch9-width-gauge",
          "componentId": "rp-ch9-width-gauge",
          "title": "窄板何时不足，宽度何时跨过门限",
          "goal": "在 split CIFAR100、无 Phase 1、λ=100、T=10 的受控消融中，检查 RP 宽度与最终准确率的关系，并区分宽度结论和任务边界结论。",
          "summary": "Table A5 的九个 RP 准确率从 M=100 的 71.6% 上升到 M=15000 的 89.0%。论文给出的门限结论是 M>1250 才会超过同一受控消融中的 no-RP；界面不伪造未报告的 no-RP 数值曲线。切换到 200 个五批量微任务后，论文报告去掉任务边界和最优 λ 选择，RP 的最终增益仍然保留。",
          "interaction": "拖动橙色板宽指针、使用原生宽度滑杆或按左右方向键，在最接近的九个固定 M 位置间移动；两个协议按钮切换十个任务与 200 个微任务的解释，图表数值始终只来自 Table A5。",
          "next": "宽度与任务边界的稳健性确认后，下一幕转到多个 CIL / DIL 基准的最终平均准确率，并把适用条件放在结果旁边。",
          "notes": "数值依据 p.24 表 A5：split CIFAR100、无 Phase 1、λ=100、T=10，RP 准确率依次为 71.6、80.3、83.9、86.2、86.8、87.7、88.4、88.8、89.0。M>1250 超过 no-RP 是论文在该受控消融中的文字结论，不绘制未报告的 no-RP 数值线；任务无关结论依据 p.27 图 A6 的 200 个五批量微任务，不是另一条 Table A5 数值曲线。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果、边界与适用条件",
      "modules": [
        {
          "kind": "module",
          "id": "results",
          "title": "CIL 与 DIL 的最终平均准确率",
          "desc": "切换 CIL / DIL，点击开始核对，让每行从零基线增长到论文报告的完整 RanPAC、无 RP、仅 NCM 数值；选择数据集行查看精确报告值与适用边界。",
          "componentId": "rp-ch10-results"
        }
      ],
      "scenes": [
        {
          "id": "rp-ch10-results",
          "componentId": "rp-ch10-results",
          "title": "多基准结果怎样说，又在哪里停下",
          "goal": "比较 Table 1 / Table 3 的最终平均准确率，确认 RP 与 Gram 校准的增益范围，同时明确预训练特征与参数开销条件。",
          "summary": "在 CIL 的七个报告基准和 DIL 的三个报告基准上，完整 RanPAC 的最终平均准确率均高于对应的无 RP 与仅 NCM 数值。CIL 示例包括 CIFAR100 的 92.2 / 90.6 / 83.4，Cars 的 77.5 / 73.0 / 37.7；DIL 示例包括 CORe50 的 96.7 / 94.8 / 80.4。结果依赖 ImageNet 预训练的 ViT 特征，并从零训练场景外推，也不代表延迟或能耗收益。",
          "interaction": "选择 CIL 或 DIL 协议，再点击开始核对；三组零基线柱从零增长到精确报告值并停在终点。点击任一数据集行，右侧检查器显示精确的三个数值、协议单位和该行边界说明。",
          "next": "本教程的主线到此闭合：固定随机展开、累计 Gram 账本与岭校准在多个报告中有效，但收益仍以可复用预训练特征为前提。",
          "notes": "数值依据 p.7 表 1 与表 3 的 Final Average Accuracy：CIL 为 CIFAR100 92.2/90.6/83.4、ImageNet-R 77.9/73.9/61.2、ImageNet-A 62.4/57.7/49.3、CUB 90.3/86.6/85.1、OmniBenchmark 79.9/74.3/73.1、VTAB 92.2/90.0/88.4、Cars 77.5/73.0/37.7；DIL 为 CORe50 96.7/94.8/80.4、CDDB-Hard 86.2/84.2/69.8（M=5K）、DomainNet 66.6/55.2/46.4。顺序均为完整 RanPAC、无 RP、仅 NCM。图 2 是训练集探针准确率，不能混入这里；适用边界依据 p.8-9 与 limitations。"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "rp-ch1-drift": "./thumbnails/rp-ch1-drift.png",
    "rp-ch2-feature-lens": "./thumbnails/rp-ch2-feature-lens.png",
    "rp-ch3-ncm": "./thumbnails/rp-ch3-ncm.png",
    "rp-ch3-gram": "./thumbnails/rp-ch3-gram.png",
    "rp-ch4-width": "./thumbnails/rp-ch4-width.png",
    "rp-ch5-ridge": "./thumbnails/rp-ch5-ridge.png",
    "rp-ch6-phase2": "./thumbnails/rp-ch6-phase2.png",
    "rp-ch7-firstsession": "./thumbnails/rp-ch7-firstsession.png",
    "rp-ch8-architecture": "./thumbnails/rp-ch8-architecture.png",
    "rp-ch8-parameters": "./thumbnails/rp-ch8-parameters.png",
    "rp-ch9-width-gauge": "./thumbnails/rp-ch9-width-gauge.png",
    "rp-ch10-results": "./thumbnails/rp-ch10-results.png"
  }
};
