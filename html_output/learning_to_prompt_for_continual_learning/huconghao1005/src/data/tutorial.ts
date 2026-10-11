import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning to Prompt for Continual Learning",
    "titleZh": "学习如何为持续学习做提示（L2P）",
    "venue": "CVPR 2022",
    "authors": "Zifeng Wang, Zizhao Zhang, Chen-Yu Lee, Han Zhang, Ruoxi Sun, Xiaoqi Ren, Guolong Su, Vincent Perot, Jennifer Dy, Tomas Pfister",
    "affiliation": "Northeastern University · Google Cloud AI · Google Research",
    "domain": "视觉 · 持续学习",
    "coreProblem": "持续学习要用同一个模型依次学完一串任务，但改动模型自己的权重会覆盖掉先前学到的知识；而两条常用的退路——存一批旧数据反复排练，或是在测试时把任务编号告诉模型——恰恰是一个紧凑记忆系统本该避免的东西。",
    "coreInsight": "把预训练主干整个冻住，把任务知识存进一个由许多小 prompt 组成的池子，再用 key–query 匹配按每一个输入样本自己去检索该用哪几条，模型就能在不存旧数据、也不知道测试时是哪个任务的情况下，靠输入自己给自己发指令。",
    "keywords": [
      "prompt pool",
      "instance-wise query",
      "key–value retrieval",
      "frozen backbone",
      "continual learning"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统做法把旧菜存进冰箱、混进当前批次，然后去改动灶台自己的火候：每来一道新菜就重调一次 <b>Model N</b>，早先的味道就在这次微调里被覆盖掉。另一条退路是做菜时把菜系编号喂进来，让灶台去挂菜系专属的模块——但现实里没人会告诉你菜系。",
      "figure": "./images/fig1_teaser.png"
    },
    "newMethod": {
      "desc": "L2P 把灶台本身锁死：主干 <b>Model 0</b> 一个参数都不改，任务知识全部装在 <b>prompt pool</b> 那一小架调料里。做菜时不给菜系编号，每道菜拿自己的味道去比对调料架上的标签，挑出最对味的几样撒进去——<b>换调料，同一个灶台做不同的菜</b>。",
      "figure": "./images/fig2_pipeline.png"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "串味：学了新菜忘了旧味",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "第 1 章从一个最朴素的问题开始：厨师明明学会了旧菜，为什么一学新菜就串味？先看现象，再看数字。",
      "analogy": {
        "title": "学了新菜，旧菜的味就串了",
        "text": "灶台的火候和刀工是固定的，但每学一道新菜，调味的手感就被覆盖——上一道菜的味道再也找不回来。",
        "componentId": "change-forme"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "串味",
          "desc": "两种学法：连灶台一起重学（全参数微调）和只换调味（冻住主干），各学三道菜，看旧菜的味道还剩多少。",
          "componentId": "change-forme"
        }
      ],
      "insight": "不是「学新菜导致旧菜味道变差」，而是旧菜的调味从来没有被单独保存过。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "串味＝参数覆盖",
          "desc": "不是记忆衰退，而是旧菜的调味从来没有被单独保存过。"
        },
        {
          "icon": "🔧",
          "title": "Forgetting 指标",
          "desc": "旧菜历史最高分 − 最终分，对旧菜取平均。"
        },
        {
          "icon": "✨",
          "title": "只冻灶台不够",
          "desc": "实测：只冻灶台 17.72，连灶台一起调 33.61。调味勺仍被共用覆盖，必须外挂调料架。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "备料：灶台真正吃进去的是什么",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "第 1 章说：想不串味，就得在灶台外面挂调料架。挂在哪里？先弄清灶台自己吃进去的是什么。",
      "analogy": {
        "title": "先把食材切成小块",
        "text": "224 除以 16 得 14，行列各 14 块——这就是灶台真正吃到嘴里的东西。",
        "componentId": "cut-paper"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "备料",
          "desc": "拖动菜刀、点选食材块，看 224×224 的食材怎么被切成小块，又怎么腌制成一行 768 个数字。",
          "componentId": "cut-paper"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "品菜员",
          "desc": "让 196 块食材逐个入味，看最前面那位品菜员把它们的味道汇总成一句。",
          "componentId": "class-recorder"
        }
      ],
      "insight": "调料之所以能撒进来，是因为灶台吃的本来就是<b>一列小块</b>，不是一整盘菜。",
      "formula": {
        "lead": "一张 224×224 的图，进主干之前先被摊成一张表。",
        "unicode": "x_p ∈ R^{L×(S²·C)},  x_e = f_e(x) ∈ R^{L×D},  L = 196,  S²·C = 768,  D = 768,  q(x) = f(x)[0,:]",
        "symbols": [
          {
            "sym": "x_p",
            "desc": "切块展开后的输入，L 行、每行 S²·C 个数字"
          },
          {
            "sym": "L",
            "desc": "patch token 个数。ViT-B/16、224×224 输入下 L = 196。"
          },
          {
            "sym": "L×(S²·C)",
            "desc": "L 行 × 每行 S²·C 个数字：L 是 patch 个数，S²·C 是每个 patch 摊平后的原始像素长度。"
          },
          {
            "sym": "x_e",
            "desc": "嵌入后的序列，形状 L×D。"
          },
          {
            "sym": "f_e",
            "desc": "输入嵌入层：把每个 patch 的 S²·C 个数字映射成 D 维"
          },
          {
            "sym": "L×D",
            "desc": "196 行 × D 列。"
          },
          {
            "sym": "D",
            "desc": "嵌入维度。ViT-B/16 下 D = 768，与 patch 摊平长度数值相同。"
          },
          {
            "sym": "S²·C",
            "desc": "一个 patch 摊平后的原始像素长度。S=16、C=3 时为 768。"
          },
          {
            "sym": "768",
            "desc": "每个 patch 摊平后 768 个数字；224÷16 = 14，共 14×14 = 196 行。"
          },
          {
            "sym": "q(x)",
            "desc": "取 f(x)[0,:]，输入的自我描述，不含可学习参数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "图像变成了一张表",
          "desc": "196 行 × 768 列——主干读的不是图，是一列 token。"
        },
        {
          "icon": "🔧",
          "title": "第 0 行是记录员",
          "desc": "`[class]` 不来自任何一个 patch，是模型自己留的空位，负责汇总，不参与切块。"
        },
        {
          "icon": "✨",
          "title": "q(x) 没有可学习参数",
          "desc": "它只是把第 0 行读出来，本身不引入任何要训练的东西。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "调味：只在出锅前撒调料",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "第 2 章说灶台吃到的是一列小块。既然是一列，那就在最前面多放几份调料——这就是 L2P 的全部动作。",
      "analogy": {
        "title": "只在出锅前撒调料",
        "text": "灶台的火候和刀工不动，改的只是出锅前撒的那几份可调配的调料。",
        "componentId": "compose-head"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "调味",
          "desc": "点选要在出锅前撒几份调料，看可训练参数从 0 涨到 19,200，而灶台始终写着「0 个零件被改动」。",
          "componentId": "compose-head"
        }
      ],
      "insight": "L2P 把「改写灶台」换成了<b>挑选调料</b>——参数量不再是瓶颈，「挑得准不准」才是。",
      "formula": {
        "lead": "prompt 的形状和 patch 一模一样，所以能直接拼在最前面。",
        "unicode": "x_p = [P_e; x_e],  P_e ∈ R^{L_p×D},  x_e ∈ R^{L×D},  D = 768",
        "symbols": [
          {
            "sym": "x_p",
            "desc": "拼接后的输入序列：前面是可训练的 prompt，后面是原来的 patch 嵌入"
          },
          {
            "sym": "P_e",
            "desc": "一条 prompt，形状 L_p×D"
          },
          {
            "sym": "L_p×D",
            "desc": "L_p 是单条 prompt 的行数（本章取 5），D 与 patch 同宽 768。"
          },
          {
            "sym": "x_e",
            "desc": "切块嵌入后的序列 L×D，L = 196"
          },
          {
            "sym": "L×D",
            "desc": "196 行 × 768 列，来自第 2 章的切块结果"
          },
          {
            "sym": "D",
            "desc": "嵌入维度。ViT-B/16 下 D = 768。"
          },
          {
            "sym": "768",
            "desc": "行宽：一条 prompt 和一行 patch 都是 768 个数字。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "形状一致才能拼",
          "desc": "prompt 的行宽和 patch 完全一样，都是 768，所以能直接拼在最前面。"
        },
        {
          "icon": "🔧",
          "title": "插在序列最前面",
          "desc": "位置固定在开头（第 6 章挑池子、第 7 章算对签都要用到这个位置）。"
        },
        {
          "icon": "✨",
          "title": "主干冻结是硬承诺",
          "desc": "它不是训练技巧，而是这一方法的定义：主干一个参数都不改。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "选料：从调料架上挑最合适的几样",
      "badge": "both",
      "badgeLabel": "推理 + 训练",
      "bridge": "一份调料只对一类菜好使，所以得有一整架调料。调料一多，立刻多出一个新问题：这道菜该撒哪几样？这次挑选是一次离散跳变，没有中间坡度。",
      "analogy": {
        "title": "一样一样闻着挑",
        "text": "菜自己跟每瓶调料比味道相似度，最对味的那几瓶被拿出来。",
        "componentId": "check-tags"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "选料",
          "desc": "点'逐一闻香'，把菜和六瓶调料的味道相似度一瓶一瓶量出来，再自己挑出最对味的两瓶；最后按一下'如果再往前调一点点呢'，看出锅的味道会不会跟着变。",
          "componentId": "check-tags"
        }
      ],
      "insight": "调料不是一个'标签'，它是一段<b>可训练的数字</b>——它必须学会'我适合什么样的菜'。",
      "formula": {
        "lead": "挑哪几个，是一次“跳”过去的判断：",
        "unicode": "K_x = argmin_{s_i} Σ γ( q(x), k_{s_i} )",
        "symbols": [
          {
            "sym": "K_x",
            "desc": "被选中的那 N 个下标组成的集合。"
          },
          {
            "sym": "argmin",
            "desc": "取距离最小的那几个，是离散选择而非连续坡度。"
          },
          {
            "sym": "γ",
            "desc": "余弦距离。比的是方向而不是长度。"
          },
          {
            "sym": "q(x)",
            "desc": "输入自己的一行摘要，来自主干第 0 行 [class] token，不含可学习参数。"
          },
          {
            "sym": "k_{s_i}",
            "desc": "第 s_i 条 prompt 的 key，维度 D_k = D = 768。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "key 与 prompt 成对出现",
          "desc": "每一对是 {(k_j, P_j)}：P_j 是内容，k_j 是签条。没有 key，prompt 就是没人认领的字条。"
        },
        {
          "icon": "🔧",
          "title": "距离用余弦",
          "desc": "比的是方向而不是长度，未比较其他度量。"
        },
        {
          "icon": "✨",
          "title": "挑谁是离散跳变",
          "desc": "argmin 是离散选择、没有坡度。后续工作 CODA-Prompt 明确了这一点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "配菜：不是按菜系挑，是按这道菜自己挑",
      "badge": "both",
      "badgeLabel": "推理 + 设定",
      "bridge": "判据换成了菜自己，味道像的菜自然挑到同一批调料。这一节看选用记录，再回到那个根本问题：做菜时有没有人告诉你这是第几道菜。",
      "analogy": {
        "title": "各挑各的味",
        "text": "两道菜各自伸手进同一个调料架，挑出来的调料不一样，出锅的味道也不一样。",
        "componentId": "combine-cases"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "配菜",
          "desc": "切换菜系，拖动时间轴走到第 t 道菜，看这瓶调料被多少道菜用过。右栏频率柱是示意数据，用于对照共享/不共享两种形态。",
          "componentId": "combine-cases",
          "figure": "./images/fig3_hist.png"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "忘了菜系也没关系",
          "desc": "拨一下开关：告诉它菜系（旧法）和不告诉它菜系（L2P），同一道菜会各挑到什么。",
          "componentId": "task-id-toggle"
        }
      ],
      "insight": "把'按菜系找'换成'按菜找'，做菜时就不再需要菜系身份。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "选择是 instance-wise 的。",
          "desc": "判据是输入自己的那行 q(x)，不是任务编号；每个输入实例各挑一次。"
        },
        {
          "icon": "🔧",
          "title": "相似输入自动共享 prompt",
          "desc": "Split CIFAR-100 多任务反复用同一批字条，5-datasets 各用各的。共享是选择方式的自然结果。"
        },
        {
          "icon": "✨",
          "title": "这正是能免掉任务身份的原因。",
          "desc": "测试时不告诉你题号，方法才对更一般的 class-incremental 设定成立；因此不把需要题号的方法算作同类。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "炒菜五步：从备料到出锅的完整流程",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "所有零件都齐了：选料在灶台内部，调味在最前面。这一节合成一次完整做菜，走完五步出锅——顺便看准：品菜员尝的到底是谁。",
      "analogy": {
        "title": "开火，炒一道菜",
        "text": "锅热了，菜下锅，调料撒进去，翻炒几下出锅——中间五步，一步都不需要知道这是第几道菜。",
        "componentId": "five-step-pipeline"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "炒菜五步",
          "desc": "点'下一步'，从备料到出锅：取味道、选料、调味、翻炒、品菜，右栏的序列形状跟着一步一步变。",
          "componentId": "five-step-pipeline",
          "figure": "./images/fig2_pipeline.png"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "一次撒几样",
          "desc": "拖动 N，看调料变多几样、味道怎么动、灶台负担怎么涨。味道来自实测热力图，灶台负担是示意曲线。",
          "componentId": "select-count",
          "figure": "./images/fig4_heat.png"
        }
      ],
      "insight": "这条流水线里<b>没有任何一处需要知道'这是第几道菜'</b>。",
      "formula": {
        "lead": "分类器读的不是整条序列，只是版头那几行：",
        "unicode": "f_r^{avg} = AvgPool( f_r(x_p)[0 : N·L_p, :] )",
        "symbols": [
          {
            "sym": "AvgPool",
            "desc": "把选中的那些行按列取平均，得到一个定长向量再喂分类器。"
          },
          {
            "sym": "x_p",
            "desc": "拼上 prompt 后的序列：N·L_p 行 prompt 在前，1 行 [class]，最后 196 行 patch。"
          },
          {
            "sym": "N·L_p",
            "desc": "版头占的行数：N = 5 条、每条 L_p = 5 行，共 25 行。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "检索发生在主干内部，是一次额外前向。",
          "desc": "q(x) 由主干第 0 行给出，比签条也在这一步算完，不是外挂的后处理。"
        },
        {
          "icon": "🔧",
          "title": "序列长度是 N·L_p + 1 + 196",
          "desc": "行序：prompt 在前，[class] 在中间，196 行 patch 最后。别漏掉中间那 1 行 [class]。"
        },
        {
          "icon": "✨",
          "title": "分类器只读 prompt 行。",
          "desc": "196 行 patch 和 [class] 行都不进分类器，所以 prompt 是任务知识的容器，不是顺手递的提示。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "调味训练：如何让调料被正确使用",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "做菜跑通了，现在问：调料架和调料是怎么被训出来的？这一章盯住训练目标——两项损失，一项管猜得对，一项管被找到。",
      "analogy": {
        "title": "用味道牵引调料",
        "text": "挑调料这个动作没有坡度，于是给调料另找一条能被拉动的路径。",
        "componentId": "lambda-cord"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "调味训练",
          "desc": "拖动 λ 与「再训一轮」，看调料被拉动的幅度和两条损失条的高度同时改变。",
          "componentId": "lambda-cord"
        }
      ],
      "insight": "式5第二项是替代损失：把被选中的调料味道拉近菜的味道，为 argmin 不可导的离散选择另开一条梯度通路。它解耦了选料机制与调料的学习。",
      "formula": {
        "lead": "两项损失，一项管“猜得对”，一项管“被找到”。",
        "unicode": "min_{P,K,φ} L( g_φ( f_r^{avg}(x_p) ), y ) + λ Σ_{K_x} γ( q(x), k_{s_i} )",
        "symbols": [
          {
            "sym": "L",
            "desc": "分类损失，具体是 softmax 交叉熵；它只盯着预测对不对。"
          },
          {
            "sym": "g_φ",
            "desc": "线性分类器，φ 是它自己的参数；它读的是池化后的特征。"
          },
          {
            "sym": "λ",
            "desc": "第二项的权重。在很大范围内不敏感，统一取 0.5。"
          },
          {
            "sym": "Σ_{K_x}",
            "desc": "对被选中的 key 求和：把 key 往 query 方向拉。"
          },
          {
            "sym": "q(x)",
            "desc": "query：从输入第 0 行取出的汇总向量，无可学习参数。"
          },
          {
            "sym": "k_{s_i}",
            "desc": "被选中的第 i 个 key。第二项为它另开一条梯度通路。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "第一项管预测对，第二项管签条被找到",
          "desc": "两项缺一不可：只有分类损失时，key 收不到「该往哪挪」的信号。"
        },
        {
          "icon": "🔧",
          "title": "λ 在很大范围内不敏感",
          "desc": "统一取 0.5。注：官方代码中部分配置写 1.0，与正文不一致。"
        },
        {
          "icon": "✨",
          "title": "式5是另开一条通路",
          "desc": "argmin 依然离散不可导，第二项只是给 key 另开梯度通路——绕过去，不是把 argmin 变可导。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "调料架：调料的摆放与轮换",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "损失说完了，看被优化的对象：它是一张 M × L_p × D 的调料架，掩码决定谁参与，频率惩罚把冷门调料往前挪。",
      "analogy": {
        "title": "把冷门调料往前挪",
        "text": "调料架上的瓶子会被数着用，冷门的会被挪到更顺手的位置。",
        "componentId": "forme-architecture"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "后厨架构",
          "desc": "点结构图上的任一节点（食材 / 腌制层 / 调料区 / 食材区 / 12 层灶台 / 平均品菜 / 分类器）读它的输入输出形状，并切换品菜范围。要发现的判断是：唯一'关掉就废掉'的开关，是品菜员尝哪些行。",
          "componentId": "forme-architecture"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "调料轮换",
          "desc": "在调料架上拖动瓶子改变顺序，或打开「应用频率惩罚」。消融实验：去掉多样化选择，5-datasets 从 81.14 掉到 62.26。",
          "componentId": "shift-cell"
        }
      ],
      "insight": "5-datasets 消融：完整方法 81.14，去掉调料架掉到 51.96，去掉味道匹配掉到 58.33，去掉多样化选择掉到 62.26。三者都伤筋动骨，去掉整个架子跌得最狠。",
      "formula": {
        "lead": "池子就是一张表，掩码决定谁参与。",
        "unicode": "P = {P_1, …, P_M},  P_j ∈ R^{L_p×D};  K_x ← argmin Σ γ( q(x), k_{s_i} ) · h_{s_i}",
        "symbols": [
          {
            "sym": "P",
            "desc": "prompt pool：整张字条表，是被优化的对象。"
          },
          {
            "sym": "M",
            "desc": "池中 prompt 的总数；表格有 M 行，每行是一条 L_p × D 的字条。"
          },
          {
            "sym": "argmin",
            "desc": "按 key 与 query 的距离挑出下标，离散选择。"
          },
          {
            "sym": "h_{s_i}",
            "desc": "频率惩罚权重，仅训练时使用：按被选中次数给距离加惩罚，压平选择分布。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "pool 是一张 M × L_p × D 的表",
          "desc": "参数被结构化存储，「挑哪几条」是一个可操作的对象。"
        },
        {
          "icon": "🔧",
          "title": "分类器只看 prompt 行",
          "desc": "196 行 patch 和 [class] 都不进分类器，prompt 是任务知识的容器。"
        },
        {
          "icon": "✨",
          "title": "频率惩罚防止选择过度集中",
          "desc": "消融支持：去掉 diversified selection，5-datasets 从 81.14 掉到 62.26。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "调味三旋钮：调料种类、用量、同时用几种",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "结构看明白了，现在去转它的三个旋钮：<b>调料种类 M</b>、<b>每样用量 L_p</b>、<b>同时用几种 N</b>。前置：第 8 章。",
      "analogy": {
        "title": "换一个更大的调料架",
        "text": "调料变多、每样量变多，容量就变了——但容量不是越大越好。",
        "componentId": "three-knobs"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "调味三旋钮",
          "desc": "拖动 M、L_p、N 三个滑块，切换基准菜系，看调料架宽度和每瓶高度怎么变、热力图上哪一格被圈住、参数量怎么乘出来。",
          "componentId": "three-knobs"
        }
      ],
      "insight": "结论按菜系分开读：加大调料架在 5-datasets 上是正收益，在 Split CIFAR-100 上不明显。「扩架无效、选料才是瓶颈」是后续工作 CODA-Prompt 的主张。",
      "formula": {
        "lead": "参数量是三个旋钮乘出来的。",
        "unicode": "params = M · L_p · D + M · D_k，D_k = D = 768",
        "symbols": [
          {
            "sym": "M",
            "desc": "池中 prompt 的总数；它决定字盘有多宽，也决定加盘加得多快。"
          },
          {
            "sym": "L_p",
            "desc": "单条 prompt 的行数；它决定每格字身有多高。"
          },
          {
            "sym": "D",
            "desc": "嵌入维度（本教程的算例取 768，即 ViT-B/16 的宽度），也是每一行的长度。"
          },
          {
            "sym": "D_k",
            "desc": "key 的维度，等于 D。每个 prompt 还要配一条 key，所以加盘要加两次。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "M 定容量，L_p 定单条容量，N 定每次用量。",
          "desc": "三个旋钮各管一件事：池子有多宽、一条有多厚、每次读几条。"
        },
        {
          "icon": "🔧",
          "title": "L_p 太小太大都差，中间最好。",
          "desc": "实测热力图支持这一点：L_p = 1 最差只有 77.01，L_p = 20 回落，最好的一格是中间行的 83.50。"
        },
        {
          "icon": "✨",
          "title": "两类数值对不上要分开看",
          "desc": "正文与结果表对不上：5-datasets 配置写 (M=20,L_p=5,N=4)，但 81.14 这个分数落在 (L_p=10,N=2) 格。与官方代码也不一致：L_p 5→10、N 5→4、λ 0.5→1.0。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "厨艺大比：它赢了什么，又输在哪里",
      "badge": "both",
      "badgeLabel": "基础 + 训练",
      "bridge": "旋钮转明白了，回到最开始那个问题：它到底好不好、好在哪里。前置：第 9 章。",
      "analogy": {
        "title": "把几道菜摆在一起比",
        "text": "比之前先问清楚：这是哪个菜系、跟谁在同一组。",
        "componentId": "result-race"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "厨艺竞赛",
          "desc": "选一个菜系和 buffer 分组，按「开始」让每个方法滑到与味道分成比例的位置。切换分组名次会翻面：class-IL 零 buffer 组里 L2P 靠前，CORe50 上则输给有 buffer 的方法。",
          "componentId": "result-race"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "争议面板",
          "desc": "逐张展开三张卡片，问同一个结果表三个问题：哪个菜系、跟谁同组、拿谁的尺子量。",
          "componentId": "dispute-panel"
        }
      ],
      "insight": "它的三条限制（只验证视觉模态、依赖序列模型、Gaussian CIFAR-100 是合成的）也应被当作结论的一部分。",
      "formula": {
        "lead": "不同主干不能直接比准确率，于是比「离上界多远」。",
        "unicode": "Diff = Upper-bound − Accuracy",
        "symbols": [
          {
            "sym": "Diff",
            "desc": "与上界的差，越小越好。把不同主干放到同一把尺子上。"
          },
          {
            "sym": "Upper-bound",
            "desc": "在全部任务 i.i.d. 数据上监督微调的成绩，是天花板。"
          },
          {
            "sym": "Accuracy",
            "desc": "该方法在同样设定下的平均准确率。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "class-IL 零 buffer 组里最强",
          "desc": "零 buffer 组 L2P 83.83 打赢每类存 50 张的 ER（82.53）。但全表「最好」谈不上：L2P-R 86.31、上界 90.85 都在它上面。"
        },
        {
          "icon": "🔧",
          "title": "domain-IL 上输给有 buffer 的方法",
          "desc": "CORe50 上零 buffer 的 L2P 78.33，低于 ER 80.10、DER++ 79.70、L2P-R 81.07。但仍赢 GDumb（74.92）。"
        },
        {
          "icon": "✨",
          "title": "离上界还有 7.02",
          "desc": "上界 90.85，L2P 83.83。这 7.02 就是「在线学、不存数据、不给题号」的代价。"
        }
      ]
    }
  ]
};
