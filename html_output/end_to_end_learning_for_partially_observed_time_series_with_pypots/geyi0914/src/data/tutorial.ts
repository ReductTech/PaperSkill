import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "End-to-End Learning for Partially-Observed Time Series with PyPOTS",
    "titleZh": "用 PyPOTS 做部分观测时间序列的端到端学习",
    "venue": "KDD '26 Tutorial · arXiv:2604.24041",
    "authors": "Wenjie Du, Yiyuan Yang, Tianxiang Zhan, Qingsong Wen",
    "affiliation": "PyPOTS Research / University of Oxford / Squirrel Ai Learning",
    "domain": "时间序列 · 部分观测数据 · 机器学习工具生态",
    "coreProblem": "大多数已有工具链把<i>缺失值处理</i>与<i>下游学习任务</i>完全拆开，于是 POTS 流水线被切成两段——论文把代价写成三条：性能次优、复用性受限、<b>误差传播</b>。",
    "coreInsight": "PyPOTS 让模型<b>带着缺口直接学</b>：把 missingness simulation → preprocessing → modeling → evaluation 串成一条无缝流水线，用同一套 API 覆盖<b>五个核心任务</b>。",
    "keywords": [
      "时间序列",
      "POTS",
      "PyPOTS",
      "缺失值",
      "端到端学习",
      "KDD 2026"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "「先补好再学」：插补与下游任务被拆成两段，补出来的值不是真值，误差会一路带下去。",
      "componentId": "hero-old-brew"
    },
    "newMethod": {
      "desc": "「带着缺口直接学」：模型从不完整数据学习，五类任务共用一套 API；输出仅供参考，不当作 ground truth。",
      "componentId": "hero-new-brew"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "残缺才是常态",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "先看清楚问题本身。<b>部分观测时间序列（POTS）</b>不是数据事故，而是真实系统的默认状态——本章先把这份「常态」变得可见。",
      "analogy": {
        "title": "铺平了，也还是有洞",
        "text": "<b>真实的时间序列天生残缺</b>——就像这层粉，怎么铺都有空隙。论文指出：在 IoT、医疗监护、工业传感器、交通与金融这些真实系统里，「完整观测」的假设已经严重站不住脚。",
        "componentId": "pots-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "缺失强度：粉层里的洞",
          "desc": "拖动滑块提高缺失强度，观察粉层里的洞和右侧观测格同时变化。缺失率越高，能看见的位置越少。观测格的 48 步 × 37 个变量取自官方 KDD'26 notebook 里 PhysioNet-2012 的形态，属于生态事实，不是论文的实验数字。",
          "componentId": "ch1-mod1"
        }
      ],
      "insight": "既然残缺是常态，问题就不再是「怎么把洞补上」，而是「怎么让模型带着洞工作」。",
      "formula": {
        "lead": "先给缺失率一个不含歧义的定义，后面的讨论才不会含糊。",
        "unicode": "r = 缺失位置数 ÷ (样本数 × 时间步数 × 变量数)",
        "symbols": [
          {
            "sym": "r",
            "desc": "缺失率，取值 [0, 1] 的比例；r = 0.3 表示三成位置没有值。"
          },
          {
            "sym": "缺失位置数",
            "desc": "输入张量 X 中取值为 NaN 的位置个数。"
          },
          {
            "sym": "样本数",
            "desc": "样本条数；官方 notebook 里 PhysioNet-2012 的每个样本是 48 步 × 37 个变量。"
          },
          {
            "sym": "时间步数",
            "desc": "每条样本的时间长度；本教程用官方 notebook 的 48 做形态示意。"
          },
          {
            "sym": "变量数",
            "desc": "每一步的观测维度；本教程用官方 notebook 的 37 做形态示意。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "残缺是常态",
          "desc": "论文明确说：在 IoT、医疗监护、工业传感器、交通与金融这些真实系统里，「完整观测」的假设已经严重站不住脚。"
        },
        {
          "icon": "🔧",
          "title": "缺失就是 NaN",
          "desc": "在 PyPOTS 生态里，部分观测不需要额外的标记列——张量里的 NaN 本身就是缺失标记。"
        },
        {
          "icon": "✨",
          "title": "三个成因",
          "desc": "传感器故障、异步采集、通信中断——论文只给了这三个，别自行扩展。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "输入长什么样",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "第一章说明数据是残缺的，但还没说这份残缺在代码里长什么样。本章回答：模型究竟吃到的是什么，以及评估需要的真值标在哪里。",
      "analogy": {
        "title": "哪些格子有值？",
        "text": "模型拿到的是 <b>不完整的张量</b>：NaN 就是缺口。为了评估，还要额外标出 <b>哪些缺口是人为造的</b>——只有这些位置才有真值可比。",
        "componentId": "observation-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "把观察点按进时间格",
          "desc": "在时间格上拖拽，把观察点按进去。右侧同步显示这份输入的三态结构：已观测、人工缺失、天然缺失。PyPOTS 模型吃的是 {\"X\": …} 这样的字典，NaN 本身就是缺失标记。",
          "componentId": "ch2-mod1"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "三态：已观测、人工缺失、天然缺失",
          "desc": "拖动覆盖率标尺，或切换统计口径，看有多少位置真的能进入评分。天然缺失的位置没有真值，任何指标都算不出来——这是官方 KDD'26 notebook 的评估协议。",
          "componentId": "ch2-mod2"
        }
      ],
      "insight": "输入本身可以继续残缺，但「哪些位置有真值」必须被明确标出来——这就是指示掩码存在的理由。",
      "formula": {
        "lead": "指示掩码把「人工缺失」从「天然缺失」里择出来，用的是逐元素的异或。",
        "unicode": "M = isnan(X) ⊕ isnan(X(原始))",
        "symbols": [
          {
            "sym": "M",
            "desc": "指示掩码（indicating mask），布尔张量，形状 [样本数, 时间步数, 变量数]；1 表示该位置是人工注入的缺失，有真值可评。"
          },
          {
            "sym": "X",
            "desc": "模型输入，NaN 表示缺失。"
          },
          {
            "sym": "X(原始)",
            "desc": "揭开人工掩码后的原始值，只作评估真值，永不进入模型输入。"
          },
          {
            "sym": "⊕",
            "desc": "逐元素异或：两个 isnan 结果不同的位置才是人工造成的缺失。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "字典输入",
          "desc": "PyPOTS 模型吃的是 {\"X\": …} 这样的字典，NaN 本身就是缺失标记，不需要额外的标记列。"
        },
        {
          "icon": "🔧",
          "title": "指示掩码",
          "desc": "M = isnan(X) ⊕ isnan(X(原始)) 精确标出哪些位置是人为造出来的洞。"
        },
        {
          "icon": "✨",
          "title": "天然缺失不可评估",
          "desc": "没有真值就没有误差，因此可复现的评估必须先自己注入缺失。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先补再学，还是带着洞学",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "输入可以继续残缺，真值也被标出来了。那么第一个真正的分歧出现了：先把洞补好再训练，还是让模型直接从不完整数据里学？",
      "analogy": {
        "title": "先刮平，还是直接冲",
        "text": "论文指出：把插补与下游任务<b>完全解耦</b>，会带来性能次优、复用性受限与 <b>误差传播</b>。左图像「先补好再学」，右图像「带着缺口直接学」。",
        "componentId": "level-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "两段式与端到端：误差去了哪里",
          "desc": "按下开始对比，两块面板从同一初始状态、同一时间基准出发。左侧走「先补再学」，右侧走「端到端」。这是机制示意，不是实验结果——论文没有报告任何误差数值。",
          "componentId": "ch3-mod1"
        }
      ],
      "insight": "与其在残缺的数据上先造出一份「假完整」，不如让模型直接从不完整里学习。",
      "formula": {
        "lead": "两种做法可以写成两条不同的依赖链，差别只在有没有那个中间产物。",
        "unicode": "两段式：X →(插补)→ X̂ →(任务)→ ŷ　　端到端：X →(端到端)→ ŷ",
        "symbols": [
          {
            "sym": "X",
            "desc": "部分观测输入，含 NaN。"
          },
          {
            "sym": "X̂",
            "desc": "插补器输出的「完整」数据；它由模型生成、不是真值，因此带有插补误差。"
          },
          {
            "sym": "插补",
            "desc": "先补缺失、再交给下游的第一段流程，也就是论文批评的解耦做法。"
          },
          {
            "sym": "任务",
            "desc": "下游任务模型，吃的是插补后的「完整」数据。"
          },
          {
            "sym": "ŷ",
            "desc": "任务输出，例如预测值、类别或异常分数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "解耦的代价",
          "desc": "论文把「插补与下游任务完全解耦」的后果明确写成三条：性能次优、复用性受限、误差传播。"
        },
        {
          "icon": "🔧",
          "title": "现有工具的边界",
          "desc": "多数已有库只解决「数据修补」这一件事，撑不起 POTS 的完整机器学习生命周期。"
        },
        {
          "icon": "✨",
          "title": "论文的选择",
          "desc": "把 missingness simulation → preprocessing → modeling → evaluation 合成一条无缝流水线，让下游直接从不完整数据学习。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "缺失有九种面孔",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "路线已经选定：让模型带着洞学。但洞是怎么来的？本章把「缺失」拆开——机制不同，含义完全不同，能用的策略也不同。",
      "analogy": {
        "title": "洞的形状不一样",
        "text": "随机丢一个点和整段丢失，是完全不同的两件事。缺失的 <b>形态</b> 决定了它背后的含义，也决定了评估该怎么设计。",
        "componentId": "bloom-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "缺失模拟器：九种真实模式",
          "desc": "选择一种缺失模式，粉层里的洞会立刻换形状。下方三种经典机制是<b>统计学通用定义</b>，论文只提到 common missingness mechanisms，并未展开定义；九个函数名来自 PyGrinder 官方 README，形态由前端自实现的伪随机算法绘制。",
          "componentId": "ch4-mod1"
        }
      ],
      "insight": "缺失的模式决定了它背后的含义——随机丢了和「越异常越容易丢」是完全两件事。",
      "formula": {
        "lead": "缺失率是机制无关的度量，这也是为什么它不能单独描述数据损坏。",
        "unicode": "r = 缺失位置数 ÷ 全部位置数",
        "symbols": [
          {
            "sym": "r",
            "desc": "缺失率，取值 [0, 1]；与机制无关，只描述丢了多少。"
          },
          {
            "sym": "缺失位置数",
            "desc": "张量中为 NaN 的元素个数。"
          },
          {
            "sym": "全部位置数",
            "desc": "样本数 × 时间步数 × 变量数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "机制决定含义",
          "desc": "MCAR / MAR / MNAR 说的是「为什么会丢」——随机丢了和「越异常越容易丢」是完全不同的问题。"
        },
        {
          "icon": "🔧",
          "title": "九种真实工具",
          "desc": "PyGrinder 提供 mcar、mar_logistic、mnar_x、mnar_t、mnar_nonuniform、rdo、seq_missing、block_missing 八种注入方式，外加 calc_missing_rate 负责计算缺失率。"
        },
        {
          "icon": "✨",
          "title": "造缺失是为了评估",
          "desc": "论文的 I.2 明确把「受控缺失注入」作为可复现 benchmark 的前提。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "换任务，不换写法",
      "badge": "both",
      "badgeLabel": "基础 + 进阶",
      "bridge": "机制看清了，下一步是把它接进真实代码的形状：同一套写法怎么服务五个任务，而真实业务约束又从哪里插进去。",
      "analogy": {
        "title": "同一个壶口",
        "text": "换任务就像换水流——壶不变、手不变、杯子不变。PyPOTS 里五个任务共用同一套 <b>fit / predict</b> 写法，只是 <b>predict()</b> 返回的 key 不同。",
        "componentId": "flow-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "五个任务，一套写法",
          "desc": "点击五个任务中的任意一个。左侧是你要写的代码形状，右侧是 predict() 会还给你的 key。五个任务是<b>论文口径</b>；返回键与模型数量来自官方 notebook、开发者文档与仓库模型清单。",
          "componentId": "ch5-mod1"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "领域约束：让模型听懂业务",
          "desc": "切换三类约束：不规则采样、按特征掩码、任务特定目标。论文的 II.3 正是把这三类列为医疗、IoT、工业场景里的实际定制模式，它们分别落在输入张量、权重与损失函数上。",
          "componentId": "ch5-mod2"
        }
      ],
      "insight": "写法统一只是表层，真正被统一的是数据契约——输入字典与返回键。",
      "formula": {
        "lead": "领域约束最终体现为「输入多一项」或「损失多一项」，可以写成一份带权的目标。",
        "unicode": "ℒ = Σ w(c) · ℓ(ŷ(c), y(c))",
        "symbols": [
          {
            "sym": "ℒ",
            "desc": "训练损失，标量。"
          },
          {
            "sym": "ℓ",
            "desc": "单个特征或单个位置上的基础损失项，例如均方误差。"
          },
          {
            "sym": "ŷ(c) / y(c)",
            "desc": "第 c 个特征的预测值与真值。"
          },
          {
            "sym": "w(c)",
            "desc": "第 c 个特征的权重，非负；按特征掩码或加权目标就体现在这里，默认全部为 1。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一套写法",
          "desc": "{\"X\": …} 进，fit / predict / impute / save / load 走，predict() 回一个按任务名做 key 的字典——五个任务都是这个形状。"
        },
        {
          "icon": "🔧",
          "title": "返回键随任务变",
          "desc": "插补是 imputation、预测是 forecasting、分类是 classification_proba、聚类是 clustering、异常检测是 anomaly_detection。"
        },
        {
          "icon": "✨",
          "title": "约束靠插拔",
          "desc": "不规则采样、按特征掩码、任务特定目标分别落在输入张量、权重与损失函数上，论文把它们列为医疗、IoT、工业场景的定制模式。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "50+ 模型凭什么都能吃缺失数据",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "统一 API 的外观已经看到了，现在揭开它背后的代价：统一不是免费的，而是一次接口适配。",
      "analogy": {
        "title": "先挖个小坑",
        "text": "有些模型天生喝不了带缺口的数据。PyPOTS 的做法不是重写它们，而是像挖这个小坑一样，给它们加一层能接受缺口的入口——复用 <b>SAITS 论文</b>的 ORT + MIT 策略。",
        "componentId": "bloom-center-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "适配手术：从「拒绝」到「通过」",
          "desc": "用上一步 / 下一步逐步走。第一步是原模型的输入层，第二步它遇到 NaN，第三步接上 ORT + MIT 的嵌入与训练路径。ORT / MIT 出自 <b>SAITS 论文（arXiv:2202.08516）</b>，不是本 tutorial 论文的原创。",
          "componentId": "ch6-mod1"
        }
      ],
      "insight": "统一 API 不是把几十个模型塞进一个壳，而是给它们各自做了一场接口适配。",
      "formula": {
        "lead": "适配的两个训练目标可以写成一个带权重的组合损失。",
        "unicode": "ℒ = ℒ(ORT) + α · ℒ(MIT)",
        "symbols": [
          {
            "sym": "ℒ",
            "desc": "总训练损失，标量。"
          },
          {
            "sym": "ℒ(ORT)",
            "desc": "观测重建任务的损失：在模型已经看得见的位置上重建输入，学到正常数据分布。"
          },
          {
            "sym": "ℒ(MIT)",
            "desc": "掩码插补任务的损失：预测训练时被故意挖掉的位置。"
          },
          {
            "sym": "α",
            "desc": "两项之间的权重，非负；代码里对应 ORT_weight 与 MIT_weight。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "不是重写是适配",
          "desc": "Transformer、iTransformer、Informer 这类模型原本不接受含缺失值的输入，PyPOTS 给它们补上可接受缺口的入口。"
        },
        {
          "icon": "🔧",
          "title": "两个训练目标",
          "desc": "ORT 重建看得见的值、MIT 预测被挖掉的值，二者合成一个组合损失。"
        },
        {
          "icon": "✨",
          "title": "出处要写清",
          "desc": "ORT + MIT 来自 SAITS 论文（arXiv:2202.08516），本 tutorial 论文只是复用了这一策略，不能算作它的原创贡献。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "评估协议决定结论",
      "badge": "trn",
      "badgeLabel": "进阶",
      "bridge": "模型怎么被适配已经清楚了，接下来是做完之后怎么判断好坏。本章把「评估」和「可复现」都落成可核对的动作。",
      "analogy": {
        "title": "一段一段地浇",
        "text": "评估也要「分段」：只在人工挖出来的洞上算误差，并且把 <b>鲁棒性</b> 和训练代价放在一起看。只报一个平均分数，等于只尝了一口就下结论。",
        "componentId": "pulse-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "只在该算的地方算",
          "desc": "拖动评分区间，看误差统计的分母怎么变。时间轴上有三类位置：已观测、人工缺失、天然缺失。只有人工缺失位置有真值，这是官方 notebook 的评估协议。",
          "componentId": "ch7-mod1"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "四步可复现检查",
          "desc": "逐步核对四项：统一随机种子、保存产物、checkpoint 重载一致、记录缺失机制与缺失率。每一步都对应生态里已经存在的机制，论文把标准化流水线与评估协议视为改善可复现性的关键。",
          "componentId": "ch7-mod2"
        }
      ],
      "insight": "先定口径，再看数字——否则同一份输出可以被解读成完全不同的结论。",
      "formula": {
        "lead": "把「只在该算的地方算」写成一行，就是带掩码的误差。",
        "unicode": "MAE(掩码) = Σ (M ⊙ |X̂ − X(原始)|) ÷ Σ M",
        "symbols": [
          {
            "sym": "M",
            "desc": "指示掩码，1 表示该位置是人工注入的缺失（有真值）。"
          },
          {
            "sym": "X̂",
            "desc": "模型输出的插补结果，形状与 X 相同。"
          },
          {
            "sym": "X(原始)",
            "desc": "揭开人工掩码后的原始值，仅作评估真值。"
          },
          {
            "sym": "⊙ / Σ M",
            "desc": "逐元素相乘把不该算的位置清零；Σ M 是参与统计的位置数，也就是分母。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "只在人工缺失上评分",
          "desc": "天然缺失没有真值，把它算进分母会让指标失去意义。"
        },
        {
          "icon": "🔧",
          "title": "鲁棒性要对得起代价",
          "desc": "论文的 I.3 与 I.4 把不同缺失率下的表现与训练耗时、模型规模放在一起讨论，也就是 robustness–efficiency 权衡。"
        },
        {
          "icon": "✨",
          "title": "重载一致才算保存成功",
          "desc": "checkpoint 载入新实例后必须复现同样输出，这一步定义了「可复现」。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "一条流水线，一支器具队",
      "badge": "both",
      "badgeLabel": "进阶 + 综合",
      "bridge": "输入、痛点、机制、API、适配、评估都已经看清，最后把零件装成一台可运行的流水线，并交代它的边界在哪里。",
      "analogy": {
        "title": "一条水流，两只杯子",
        "text": "一条流水线从「造缺失」一路走到「评估」，中间不换工具；而它到底覆盖哪些任务，也要像品鉴一样逐项对照，而不是靠一句「更好用」。",
        "componentId": "two-cup-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "四段流水线与五库分工",
          "desc": "点击四个阶段中的任意一个。左侧是流水线本身，右侧是这一段的职责与承担它的库。四段顺序出自论文；五个库的分工（PyPOTS / PyGrinder / BenchPOTS / TSDB / BrewPOTS）是生态事实。",
          "componentId": "ch8-mod1",
          "figure": "./images/pypots-logo.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "能力覆盖对照：不是成绩单",
          "desc": "按下「开始对照」，两侧能力条从同一起点生长。这里比较的是<b>覆盖面</b>：支持几个任务、覆盖多少模型、多少个数据集。论文本身没有报告任何实验，本条不含任何性能指标，画面固定标注「生态事实统计，非性能实验结果」。",
          "componentId": "ch8-mod2"
        }
      ],
      "insight": "流水线的价值不在某一段更强，而在于四段之间不用交接、不用对齐口径。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一条流水线",
          "desc": "missingness simulation → preprocessing → modeling → evaluation，四段之间不换工具、不对齐口径。"
        },
        {
          "icon": "🔧",
          "title": "五个库分工",
          "desc": "PyPOTS 做算法与训练、PyGrinder 造缺失、BenchPOTS 做标准化预处理与基准、TSDB 提供 172 个数据集、BrewPOTS 负责教程，全部由论文 §Related Materials 指向的官方渠道发布。"
        },
        {
          "icon": "✨",
          "title": "诚实边界",
          "desc": "论文明确写出——由 POTS 推导出的输出不应被当作 ground truth，仅供参考；本教程因此只做能力覆盖对照，不做任何性能比较。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1H2JHzFEuW",
      "title": "SAITS：基于自注意力机制的多元时间序列缺失值填补算法",
      "reason": "全站唯一直接讲 SAITS 的中文视频，对应 §6 里 ORT + MIT 适配策略的出处；播放量偏低（300），但相关性无可替代。",
      "cover": "https://i1.hdslb.com/bfs/archive/cf2859dff72fdf8ddc50e4ff203a3ba5cf02ca61.jpg",
      "views": "300播放"
    },
    {
      "bvid": "BV122ykYmE4M",
      "title": "缺失数据 - 缺失机制简介 (MCAR/MAR/MNAR)",
      "reason": "直接介绍 §4 用到的三种缺失机制的统计学通用定义；播放量 487，缺少更高播放量的同主题替代。",
      "cover": "https://i2.hdslb.com/bfs/archive/edc0168d11873baf7adf140fa1b84ad700ee2206.jpg",
      "views": "487播放"
    },
    {
      "bvid": "BV1Dm3tz5ECf",
      "title": "插补：多重插补与插补空值",
      "reason": "演示 §3 里「先补再学」那条传统路径的插补做法，正好与端到端路线形成对照；播放量 1160。",
      "cover": "https://i2.hdslb.com/bfs/archive/434ae10e03bc4370f8913d379c0c3167e7e83958.jpg",
      "views": "1160播放"
    },
    {
      "bvid": "BV1744y1B7o6",
      "title": "数据分析｜一则视频学会处理缺失数据",
      "reason": "面向通用读者的缺失数据处理概览，是本次检索中相关性成立且播放量最高的一条（6434）。",
      "cover": "https://i1.hdslb.com/bfs/archive/526332b6ade2de7d0436fc421c459149d682375f.jpg",
      "views": "6434播放"
    }
  ]
};
