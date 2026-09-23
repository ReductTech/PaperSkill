import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "CapRL++: Unified Reinforcement Learning with Verifiable Rewards for Dense Image and Video Captioning",
    "titleZh": "CapRL++：面向密集图像与视频描述的统一可验证奖励强化学习",
    "venue": "arXiv:2606.09393v1 · 2026",
    "authors": "Penghui Yang, Long Xing, Xiaoyi Dong, Yuhang Zang, Yuhang Cao, Yibin Wang, Yujie Zhou, Jiazi Bu, Jianze Liang, Qidong Huang, Jiaqi Wang, Feng Wu, Dahua Lin",
    "affiliation": "清华大学 · 中国科学技术大学 · 微软 · 上海人工智能实验室 · 上海创智学院 · 阿里云 · 香港中文大学",
    "domain": "视觉语言模型 · 图像与视频描述 · 可验证奖励强化学习",
    "coreProblem": "描述模型大多靠有监督微调：既要昂贵的成对标注，又被要求去拟合唯一那条参考描述，于是模型背句子而不是讲画面。可是「描述好不好」本身很主观，改用奖励模型或「LLM 当裁判」来打分，又会被钻空子——模型学会把话说得又长又绕，专门讨好裁判的偏好。",
    "coreInsight": "把「描述好不好」换成一个能自动判定的事实：让一位<b>看不见画面</b>的学生只读讲解稿回答问题，答对几题就是几分。这样分数不再来自「参考答案」或「裁判偏好」，而来自「信息到底有没有传过去」。",
    "keywords": [
      "可验证奖励强化学习",
      "密集描述",
      "GRPO",
      "无参考奖励",
      "空间锚定自举"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "旧办法有两条各不相同的路：要么按 ROUGE / BLEU 这类指标<b>和参考答案比重合度</b>，要么交给<b>判别者</b>主观打分（奖励模型 / LLM 当裁判，带偏好）。左图（论文 Figure 1a）画的就是这两种奖励的偏差：要么偏爱冗长、要么偏爱简短。",
      "figure": "./images/caprl-fig1.webp",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "CapRL++ 里讲解者只产出<b>一条讲解稿</b>；题目来自预先筛好的题库，由看不见画面的学生自己读稿作答——答对几题，讲解者就得几分。右图即论文 Figure 3 的两阶段流程。",
      "figure": "./images/caprl-fig3.webp",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "像范文，不等于讲清楚",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "先看清旧办法是怎么打分的。它只问一件事：这段讲解和那条「标准答案」像不像。我们把它拉到最像，再看看那位看不见画面的学生到底能不能答出来。",
      "analogy": {
        "title": "抄得再像，也没讲明白",
        "text": "讲解者照着标准范文把句子改得一模一样，<b>可蒙眼学生一道细节题都答不出来</b>。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "旧尺子只量「像不像」",
          "desc": "拖动讲解稿与标准范文的「相似率（%）」，看它升高时学生的答对题数怎么变。你会发现这条尺子和「讲没讲清楚」几乎无关，而且它不是准确率。",
          "componentId": "mod-1-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "换一把尺子：看学生答对几题",
          "desc": "把评分方式换成「看不见画面的学生答对几题」，逐题点一点，看分数怎么长出来。",
          "componentId": "mod-1-2"
        }
      ],
      "insight": "描述好不好，本来就很主观。与其找一条参考答案去比，不如问一个能被机器判定的问题：读了这段话的人，能不能答对关于画面本身的问题？",
      "formula": {
        "lead": "于是评分变成一场小测验：把讲解稿交给看不见画面的学生，让它做 N 道题，答对的比例就是分数。",
        "unicode": "R<sub>acc</sub>(c<sub>i</sub>) = (1/N) · Σ<sub>k=1..N</sub> 𝟙[ M<sub>L</sub>(c<sub>i</sub>, Shuffle(q<sub>mk</sub>)) = GT<sub>mk</sub> ]",
        "symbols": [
          {
            "sym": "R_acc",
            "desc": "效用奖励：学生答对的比例，取值 0 到 1，越大越好"
          },
          {
            "sym": "c_i",
            "desc": "第 i 段候选讲解稿"
          },
          {
            "sym": "N",
            "desc": "抽题作答的轮数，本课默认 8 轮（不是题库的题数）"
          },
          {
            "sym": "M_L",
            "desc": "看不见画面的学生模型，只能读讲解稿"
          },
          {
            "sym": "Shuffle(q_mk)",
            "desc": "第 k 轮抽到的第 m 题，选项顺序被打乱"
          },
          {
            "sym": "GT_mk",
            "desc": "该题的标准答案；𝟙[·] 为指示函数，答对取 1、答错取 0"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "主观变客观",
          "desc": "把「像不像参考答案」换成「读了能不能答对」，描述质量才第一次变得可自动判定。"
        },
        {
          "icon": "🔧",
          "title": "两个角色",
          "desc": "讲解者看得见画面、负责讲；蒙眼学生看不见画面、只负责答题。"
        },
        {
          "icon": "✨",
          "title": "背范文没用",
          "desc": "句子与参考答案高度一致的讲解，可能一道细节题都答不对。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "讲解稿里要装下什么",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "既然分数来自学生答题，那讲解稿里到底该写什么？漏掉一整类信息，就会有整类问题必然答错——这不是「写得不够漂亮」，而是「根本没讲」。",
      "analogy": {
        "title": "一件一件指过去",
        "text": "讲解者把画面拆成四块逐个讲：<b>有什么、什么样、谁和谁、写了什么</b>。每讲一块，学生能答的问题就多一类。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "四类信息，各管一类问题",
          "desc": "点击画面上的四块区域，看每块能支撑哪一类问题。一次只看一类，才看得清对应关系。",
          "componentId": "mod-2-1",
          "figure": "./images/caprl-fig2.webp"
        }
      ],
      "insight": "讲解稿是一段有限的信息预算，得按类别分配：主体、属性、关系、画面里的文字。哪一类没讲到，学生在那一类问题上就只能瞎猜。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四类预算",
          "desc": "讲解稿要覆盖：有什么物体、它们什么属性、彼此什么关系、画面里写了什么字。"
        },
        {
          "icon": "🔧",
          "title": "视频再加一类",
          "desc": "视频讲解还要交代事件顺序与时间戳，否则「什么时候发生的」这一整类问题无从答起。"
        },
        {
          "icon": "✨",
          "title": "整类缺失",
          "desc": "漏掉一整类信息，就会有整类问题必然答错——分数会精确地反映这个漏洞。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "不是考生，而是讲解者",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "评分对象变了，整个思路也跟着变。这一段是全文的转折点：我们不再让模型去「考高分」，而是让它去「把人讲明白」。",
      "analogy": {
        "title": "一边改范文，一边看答题",
        "text": "左边的人一直对照范文改句子；右边的人写完就交卷，<b>让看不见画面的学生真答一遍</b>。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "两种做法，同一起点跑一遍",
          "desc": "按同一个「开始」，让「抄范文」和「看答题」两种评分从相同起点跑起来，比较它们对同一段内容的判断。",
          "componentId": "mod-3-1"
        }
      ],
      "insight": "关键不是把描述写得更像谁，而是让它对另一个人真正有用。同一个原则后面还会用到评测上：Prism 评测就是把「学生」固定住，用它当尺子量讲解者的能力。",
      "formula": {
        "lead": "论文没有为「解耦两阶段」单独写一个公式，它的原文奖励就是下面这一条（式 (2)）。这里先看它，第 4 章再把另外两项加进来。",
        "unicode": "R<sub>acc</sub>(c<sub>i</sub>) = (1/N) · Σ<sub>k=1..N</sub> 𝟙[ M<sub>L</sub>(c<sub>i</sub>, Shuffle(q<sub>mk</sub>)) = GT<sub>mk</sub> ]　（论文式 (2)，page 6, §3.2）",
        "symbols": [
          {
            "sym": "R_acc",
            "desc": "效用奖励：学生答对的比例（accuracy），0 到 1"
          },
          {
            "sym": "c_i",
            "desc": "第 i 段候选讲解稿（论文原文的 caption）"
          },
          {
            "sym": "N",
            "desc": "从该画面的题目里抽题作答的轮数，默认 8"
          },
          {
            "sym": "M_L",
            "desc": "看不见画面的学生模型（vision-free LLM），只能读讲解稿"
          },
          {
            "sym": "q_mk",
            "desc": "第 k 轮抽到的第 m 道题，来自该画面的题库"
          },
          {
            "sym": "Shuffle(·)",
            "desc": "每次呈现题目时打乱选项顺序，消掉位置偏好"
          },
          {
            "sym": "GT_mk",
            "desc": "该题标准答案；𝟙[·] 为指示函数，答对 1、答错 0"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "换角色",
          "desc": "模型不再是考生，而是讲解者；它的水平由学生考得怎么样来体现。"
        },
        {
          "icon": "🔧",
          "title": "不能偷看",
          "desc": "学生看不到画面，所以它答对只可能来自讲解稿——这正是「可验证」的来源。"
        },
        {
          "icon": "✨",
          "title": "同一套尺子",
          "desc": "训练用它当奖励，评测也用它当尺子（Prism 就是把学生固定住），目标和测量因此一致。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "三关一起过",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "只看「答得对」还不够。讲解者很快会发现：把话说得越长，越容易蒙中答案。所以分数得由三关共同决定。",
      "analogy": {
        "title": "三格都要过关",
        "text": "一段讲解要同时过三关：<b>答得对、时间戳规范、别太长</b>。任一关不合格，总分就被拖下来。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "关掉长度这一关会怎样",
          "desc": "把长度关掉，只让「答得对」说话：拖动长度滑块，看稿子会一路写长，以及训练里会发生什么。",
          "componentId": "mod-4-1",
          "figure": "./images/caprl-fig5.webp"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "三关的权重怎么配",
          "desc": "切换几种配比，看同一段内容的总分怎么变，以及缺掉的那一关会带来什么风险。",
          "componentId": "mod-4-2",
          "figure": "./images/caprl-fig8.webp"
        }
      ],
      "insight": "单一目标一定会被钻空子。长度这一关不只是为了简洁——它同时挡住「靠堆字数蒙答案」，还顺带把训练速度提了上去。",
      "formula": {
        "lead": "总奖励就是三关按权重加起来；α 与 β 控制「结构规范」与「别太长」的相对分量。",
        "unicode": "R<sub>total</sub>(c<sub>i</sub>) = R<sub>acc</sub>(c<sub>i</sub>) + α · R<sub>format</sub>(c<sub>i</sub>) + β · R<sub>len</sub>(c<sub>i</sub>)",
        "symbols": [
          {
            "sym": "R_total",
            "desc": "这段讲解稿的总奖励，越大越好"
          },
          {
            "sym": "R_acc",
            "desc": "答得对：学生答对的比例，0 到 1"
          },
          {
            "sym": "R_format",
            "desc": "时间戳规范：有效率与时序一致性，0 到 1"
          },
          {
            "sym": "R_len",
            "desc": "别太长：2048 token 内满分，3072 以上为 0"
          },
          {
            "sym": "α, β",
            "desc": "平衡「答得对 / 结构规范 / 简洁」的超参数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三关缺一不可",
          "desc": "效用、格式、长度三项加权，每一项都在封住一种作弊路径。"
        },
        {
          "icon": "🔧",
          "title": "写长会被罚",
          "desc": "长度项在 2048 token 内给满分，2048 到 3072 之间线性衰减，超过 3072 归零。"
        },
        {
          "icon": "✨",
          "title": "顺带提速",
          "desc": "论文报告加上长度项后 rollout 吞吐量约快 9%，而且训练中因超长被截断的回复从三成以上降到很少。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "题库本身也要被验一遍",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "分数可不可信，取决于题目可不可信。如果一道题不看画面也能答对，那学生在考常识，不是在考讲解者。",
      "analogy": {
        "title": "出题的人，不能看答案",
        "text": "能不看图就答出来的题，一律划掉——<b>留着的题，才真的要靠讲解稿</b>。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "三道验题法",
          "desc": "同一批题换三种方式判一遍：带图作答、去掉图作答、两道都验。看哪些题会被划掉。",
          "componentId": "mod-5-1"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "题库是怎么攒出来的",
          "desc": "按「下一步」走完：收素材 → 多个强模型批量出题 → 两道都验 → 得到固定题库。",
          "componentId": "mod-5-3"
        },
        {
          "kind": "module",
          "id": "5.3",
          "title": "视频还要多讲一件事",
          "desc": "视频讲解里的时间戳像号码牌：既要有，又要按时间排好。拖动顺序看格式分怎么被拆成两半。",
          "componentId": "mod-5-2"
        }
      ],
      "insight": "这是整套方法最容易被忽略的一环：如果题目本身能靠常识答对，那么「学生答对」和「讲解者讲得好」之间就没有关系，分数再高也是假的。",
      "formula": {
        "lead": "留下哪些题，由一个交集条件决定：带图答对，去掉图就答错。",
        "unicode": "Q = { (q, a) ∈ D | M<sub>Vf</sub>(q, I) = a ∧ M<sub>Vf</sub>(q) ≠ a }",
        "symbols": [
          {
            "sym": "Q",
            "desc": "过滤后保留下来的题库"
          },
          {
            "sym": "D",
            "desc": "自动生成的初始问答数据集"
          },
          {
            "sym": "q, a",
            "desc": "一道题及其答案"
          },
          {
            "sym": "I",
            "desc": "对应的图像或视频"
          },
          {
            "sym": "M_Vf",
            "desc": "用来验题的视觉语言模型：带图作答一次、去掉图再作答一次"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "验证题目",
          "desc": "只有「带图答对、去掉图答错」的题才配给讲解者打分。"
        },
        {
          "icon": "🔧",
          "title": "两类都要有",
          "desc": "题库要同时包含通用理解题与时间定位题，否则总有一类能力没被考到。"
        },
        {
          "icon": "✨",
          "title": "视频加一关",
          "desc": "视频讲解的时间戳要有效、且按时间递增；格式分就是这两半的平均。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一次评分是怎么走完的",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "公式写着简单，但一次评分是一步一步走出来的。这里把动作拆开：抽题、打乱选项、学生作答、计分。",
      "analogy": {
        "title": "讲稿递过去，一题一题答",
        "text": "讲解者只负责写，学生只负责答；<b>每答对一题，黑板就亮一格</b>。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "四步走完一次评分",
          "desc": "用「下一步」走一遍完整评分，看每一步在做什么、分数在哪里产生。",
          "componentId": "mod-6-1"
        }
      ],
      "insight": "「每次打乱选项」和「问很多轮取平均」都不是工程细节，而是必需品：学生有位置偏好（总想选 A），不平均掉它，分数就不反映讲解质量。",
      "formula": {
        "lead": "一次评分是「抽题作答」若干轮的平均；轮数 N 越大，位置偏好被平均得越干净。",
        "unicode": "R<sub>acc</sub> = (1/N) Σ 𝟙[ M<sub>L</sub>(c<sub>i</sub>, Shuffle(q<sub>mk</sub>)) = GT<sub>mk</sub> ]，本课默认 N = 8",
        "symbols": [
          {
            "sym": "N",
            "desc": "抽题作答的轮数，默认 8；只做 1 轮时分数明显不稳"
          },
          {
            "sym": "Shuffle(·)",
            "desc": "每次呈现题目时重新打乱选项顺序"
          },
          {
            "sym": "𝟙[·]",
            "desc": "指示函数：答对为 1、答错为 0"
          },
          {
            "sym": "GT_mk",
            "desc": "第 k 轮那道题的标准答案"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四步一次",
          "desc": "一次评分 = 抽题 → 打乱选项 → 盲学生作答 → 计分。"
        },
        {
          "icon": "🔧",
          "title": "必须打乱",
          "desc": "不打乱选项，学生可能摸出「答案总在 A」的规律，分数就失去意义。"
        },
        {
          "icon": "✨",
          "title": "多轮取平均",
          "desc": "默认问 8 轮取平均；论文的消融显示 N 从 1 提到 8 时图像从 47.3 升到 48.3、视频从 43.9 升到 45.7。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "怎么用这个分数去训练",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "分数已经可信了，接下来用它来调讲解者。做法很朴素：同一个画面讲几遍，看哪一遍让学生答对更多。",
      "analogy": {
        "title": "讲三遍，学讲得最好的那遍",
        "text": "同一个画面讲三遍，各自算分，<b>谁让学生答对更多，就往谁的方向调一点</b>。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "问一遍够不够？",
          "desc": "拖动「轮数 N」和「一组几段稿」，看组内分数稳不稳、组均值的基线稳不稳。",
          "componentId": "mod-7-1"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "一轮训练的四步",
          "desc": "逐步走完一轮：讲三遍 → 各自算分 → 比组内高低 → 往讲得好的方向调一点。",
          "componentId": "mod-7-2"
        }
      ],
      "insight": "因为比的是「同一画面下几段讲解稿的相对高低」，所以不需要额外的价值网络来估计绝对分数——这就是 GRPO 的做法。但前提是分数本身要稳，所以轮数 N 默认取 8。",
      "formula": {
        "lead": "优势就是「这段讲解稿比同组平均好多少」，用它来代替单独的价值网络。",
        "unicode": "A<sub>i</sub> = R<sub>total</sub>(c<sub>i</sub>) − mean<sub>j</sub> R<sub>total</sub>(c<sub>j</sub>)，讲解者按 A<sub>i</sub> 加权微调",
        "symbols": [
          {
            "sym": "A_i",
            "desc": "第 i 段讲解稿的优势值，可正可负"
          },
          {
            "sym": "R_total(c_i)",
            "desc": "这段讲解稿的加权总分（第 4 章）"
          },
          {
            "sym": "mean_j",
            "desc": "同一画面下整组的平均分，充当基线"
          },
          {
            "sym": "G",
            "desc": "一组里讲几遍；组太小则基线不稳"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "组内比高低",
          "desc": "GRPO 用同一画面下几段讲解稿的相对高低当优势，不需要额外的价值网络。"
        },
        {
          "icon": "🔧",
          "title": "先稳再比",
          "desc": "组内比较的前提是分数稳定：轮数 N 默认取 8，只问 1 轮时高低不可信。"
        },
        {
          "icon": "✨",
          "title": "小步多次",
          "desc": "每轮只朝更好的方向挪一小步，所以要反复迭代，而不是一次学成。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "摆放位置决定成败",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "训练流程清楚了，但系统长什么样？论文的做法是把三样东西摆成互相看不见的位置关系，让作弊在结构上不可能。",
      "analogy": {
        "title": "稿子过去，画面留下",
        "text": "两人之间只有一条<b>只传稿子的通道</b>，画面永远留在讲解者这一侧。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "三者互不可见",
          "desc": "点一个部件，看它的职责，以及它为什么必须看不到另一样东西。",
          "componentId": "mod-8-1"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "先学静态，再学动态",
          "desc": "切换三种训练顺序，比较图像侧与视频侧的平均分：为什么不一起学？",
          "componentId": "mod-8-2",
          "figure": "./images/caprl-fig4.webp"
        }
      ],
      "insight": "被训练的只有讲解者一个人。学生和题库在训练期间都是固定的工具——它们不更新，所以不存在「学生也跟着变强，导致分数虚高」的问题。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "结构上防作弊",
          "desc": "讲解者拿不到题库、学生看不到画面——两者互不可见，作弊在结构上就不可能。"
        },
        {
          "icon": "🔧",
          "title": "只有讲解者在变",
          "desc": "训练期间学生与题库固定不变，分数才有可比性；第 3 章讲过，Prism 评测也是同一个思路。"
        },
        {
          "icon": "✨",
          "title": "分阶段建能力",
          "desc": "SpaBoot 先只在静态图上训练（打空间底子），再带着视频训练并开启时间戳那一关；论文报告这样两侧都拿得最好。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "要多少题、多少稿",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "最后一个实操问题：这套方法费不费数据？答案是意外地省——每张图只要一道题，就能拿到大部分收益；而多出来的那部分，主要涨在「看懂顺序」上。",
      "analogy": {
        "title": "一题就够，多了不涨",
        "text": "每张图只用一道题的讲解训练，<b>分数就已经接近上限</b>；再加题，收益只是零头。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "每张图要几道题",
          "desc": "一张图一条曲线、一个滑块：拖动每张图的题数，看平均分在哪里饱和。论文消融显示每项只需 1 道题就能拿到大部分收益。",
          "componentId": "mod-9-1",
          "figure": "./images/caprl-fig7.webp"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "多出来的收益涨在哪种能力上",
          "desc": "同样一个滑块，这次看两条曲线：题量变大时，「看懂画面」与「看懂顺序」谁涨得更快。",
          "componentId": "mod-9-4"
        },
        {
          "kind": "module",
          "id": "9.3",
          "title": "两种模态，两种饱和速度",
          "desc": "切换图像侧与视频侧：视频在更少的题数上就接近饱和，因为它单条样本的信息密度更高。",
          "componentId": "mod-9-3",
          "figure": "./images/caprl-fig9.webp"
        }
      ],
      "insight": "论文的消融显示：每张图只用 1 道题，平均分就从 40.6 升到 48.0；每段视频只用 1 道，从 39.7 升到 45.2。也就是说瓶颈不在标注量，而在有没有一套可信的题目。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一题就够",
          "desc": "每项只用 1 道题就能拿到大部分收益，再加题只剩边际提升。"
        },
        {
          "icon": "🔧",
          "title": "涨在顺序上",
          "desc": "题量变大时涨得最快的是「看懂顺序」；通用视频理解很早就接近饱和。"
        },
        {
          "icon": "✨",
          "title": "视频更划算",
          "desc": "视频用更少的题就拿到相近增益，因为一段视频本身信息更密。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "效果与边界",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "最后把同一把尺子摆出来。三个问题：小模型能追到什么程度、「效用即奖励」能不能换个方向用、以及代价是什么。",
      "analogy": {
        "title": "同一把尺子，一起跑",
        "text": "所有选手都在<b>同一套题、同一个学生</b>下比较；分数越高越好，但题组不同就不能互相比。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "Prism 对抗赛",
          "desc": "按一次按钮，让几个模型在同一套协议下从零跑分。切换图像组与视频组时注意：两组题目不同，数值不可跨组比较。",
          "componentId": "mod-10-1"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "换个方向也成立",
          "desc": "切换三组证据：视频预训练、时间定位、文生图。看同一个原则在不同任务上的表现，以及它的代价。",
          "componentId": "mod-10-2",
          "figure": "./images/caprl-fig10.webp"
        }
      ],
      "insight": "论文没有单独的局限性章节。能确认的代价是：描述更密集、更长，精确率因此更低；而长视频上的表现目前只在推理阶段测过，训练用的仍以 30 秒以内的短片为主。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "小模型追平大模型",
          "desc": "基于 Qwen2.5-VL-3B 的 CapRL++ 在 Prism 上拿到 48.3，与 Qwen2.5-VL-72B 持平；基于 Qwen3-VL-4B 的版本拿到 47.5，高于 32B 的 46.9 与 235B-A22B 的 46.0。"
        },
        {
          "icon": "🔧",
          "title": "收益不均衡",
          "desc": "收益在时间定位与时间理解上最大（TimeLens-Bench 从 10.4 到 21.4），通用理解提升相对温和。"
        },
        {
          "icon": "✨",
          "title": "代价与边界",
          "desc": "代价是精确率与冗余：描述更密集导致 Precision 更低；长视频泛化只在推理阶段得到验证。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1g2E26AEPD",
      "title": "大模型强化学习一次讲透：RLHF、DPO、GRPO、RLVR 到底怎么选？",
      "reason": "把 RLHF / DPO / GRPO / RLVR 放在一张图里对照，正好对应第 3 章与第 8 章的范式选择。",
      "cover": "https://i2.hdslb.com/bfs/archive/d792940aa11f330f5842ac4534427bcfdf9e9e5d.jpg",
      "views": "2774播放"
    },
    {
      "bvid": "BV1fBTtz1Ezt",
      "title": "RL专题：请详细解释 GRPO 中「群组相对」的优势计算方法，以及它为何比传统价值函数估计更有效？",
      "reason": "直击第 8 章的核心：为什么可以用同一画面下几段讲解稿的相对高低来替代价值网络。",
      "cover": "https://i1.hdslb.com/bfs/archive/5728c031b5b452b07c91e4e6222b3cf19bdd7c10.jpg",
      "views": "2101播放"
    },
    {
      "bvid": "BV13sVW6HEcS",
      "title": "【CS336 2026】Lec16 Post-Training-RLVR：可验证奖励后训练",
      "reason": "系统讲解「可验证奖励」这一范式本身，对应第 1 章与第 4 章的奖励设计。",
      "cover": "https://i1.hdslb.com/bfs/archive/ad4a0c61bad30bc5386f0db81c18fa50d79d2f3c.jpg",
      "views": "1312播放"
    },
    {
      "bvid": "BV1t148zEEkF",
      "title": "推理大模型 | GRPO 精讲",
      "reason": "更聚焦 GRPO 细节的补充视角，可作为第 8 章的延伸。",
      "cover": "https://i2.hdslb.com/bfs/archive/0b0aa21edbfb038bd8813334b5404a1118d8fb84.jpg",
      "views": "624播放"
    }
  ]
};
