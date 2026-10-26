import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning without Forgetting",
    "titleZh": "学习而不遗忘",
    "venue": "IEEE TPAMI 2018",
    "authors": "Zhizhong Li, Derek Hoiem",
    "affiliation": "University of Illinois at Urbana-Champaign",
    "domain": "计算机视觉 · 持续学习 · 知识蒸馏",
    "coreProblem": "想给一个训练好的 CNN 加上新任务，可旧任务的训练数据已经拿不到了；直接微调会把旧本事冲掉。",
    "coreInsight": "只用新任务的图片，先把旧网络对它们的<b>旧类输出</b>录成一份快照，再让训练同时拟合新标签和这份快照 —— 旧任务不必冻住，只要别变味。",
    "keywords": [
      "持续学习",
      "灾难性遗忘",
      "知识蒸馏",
      "迁移学习"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只微调：新任务满了，旧任务的味道散了。",
      "componentId": "hero-tea"
    },
    "newMethod": {
      "desc": "LwF：新任务满了，旧任务还是那个颜色。",
      "componentId": "hero-tea"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "留样杯不能被打翻",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "开场先不走新路：把<b>特征提取</b>、<b>微调</b>、<b>微调 FC</b>与<b>联合训练</b>挨个试一遍，让你亲手摸到那个缺口 —— 旧数据拿不到了，旧本事还得留着。",
      "analogy": {
        "title": "添新叶，别搅浑旧茶",
        "text": "新叶要进壶，可桌上那杯旧茶还得保持原来的颜色。<b>添</b>的时候，壶里的水也在动。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "三条老路各自塌一边",
          "desc": "依次点四个 chip，看每条现成路线各牺牲哪一边：<b>特征提取</b>学不深、<b>微调</b>忘得快、只调顶层两头不靠。<b>联合训练</b>两边都好看，可它必须握着旧任务的图片和标签。<br><span class=\"data-note\">数据：ImageNet→CUB（AlexNet），Table 1(a)</span>",
          "componentId": "m1-methods"
        }
      ],
      "insight": "数据走了，网络还在 —— 能不能让它把「旧任务会怎么答」先留下来？",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三条老路各塌一边",
          "desc": "特征提取学不深（ImageNet→CUB 新任务 52.5），微调忘得快（旧任务 50.9），只调顶层两头不靠。"
        },
        {
          "icon": "🔧",
          "title": "联合训练是最强上界",
          "desc": "它两边都好看，可它必须握着旧任务的图片和标签 —— 我们这场里没有这份数据。"
        },
        {
          "icon": "✨",
          "title": "LwF 的目标",
          "desc": "只用新任务的图片和标签，让旧任务和新任务都不塌。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "把旧数据换成一份响应快照",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "接住上一节那句没说完的话：既然旧数据不能存，那就存<b>旧网络对新图片的输出</b>。这一节只做一件事 —— 看清这份快照长什么样。",
      "analogy": {
        "title": "先记下这一杯的味道",
        "text": "旧茶喝一口少一口，先把<b>色、香、厚</b>记在卡上。卡片不会变，杯子会。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "快照里到底存了什么",
          "desc": "点开三张新任务的图片，右边就是旧网络当场给出的<b>旧类概率</b>。这一整行存下来，就是<b>响应快照</b> —— 既没有旧图片，也没有旧标签。",
          "componentId": "m2-snapshot"
        }
      ],
      "insight": "快照把「数据」换成了「输出」：旧图片不必再留，旧标签也不必再要。",
      "formula": {
        "lead": "快照的正式写法，就是把新任务图片喂给旧网络做一次前向。",
        "unicode": "Y_o = CNN(X_n; θ_s, θ_o)",
        "symbols": [
          {
            "sym": "X_n",
            "desc": "新任务的图片，张量形状 N×3×224×224"
          },
          {
            "sym": "θ_s",
            "desc": "共享参数：卷积层与 fc6、fc7（fc8 属 θ_o）"
          },
          {
            "sym": "θ_o",
            "desc": "旧任务专属参数：旧类输出层"
          },
          {
            "sym": "Y_o",
            "desc": "旧类概率矩阵，每行和为 1，列数 = 旧类数"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "旧知识不必存图片",
          "desc": "存「旧网络对新图片的输出」就够了：一次前向，换掉整份旧数据集。"
        },
        {
          "icon": "🔧",
          "title": "快照是一整行概率",
          "desc": "行数等于新任务图片数，列数等于旧类数，每行的概率和为 1。"
        },
        {
          "icon": "✨",
          "title": "快照也有边界",
          "desc": "新图片越接近旧任务，快照越可靠；差得远时它只是一行噪声。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "蒸馏加微调：一手抓两头",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "§2 已经把旧网络的响应录成了一份快照。这一节把它接进训练：共享层不用冻住，只要在学新类的同时，让旧类输出别离开快照。",
      "analogy": {
        "title": "一壶茶，两只杯",
        "text": "新任务要满，旧任务也不能浅。<b>分</b>得平均，才叫会泡。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "有没有蒸馏项",
          "desc": "同一次点击、两栏同步推进。左边只学新任务，右边多一项旧输出的蒸馏 —— 看左边最长的那根条会不会塌。<br><span class=\"data-note\">数据：ImageNet→CUB（AlexNet），Table 1(a)；0.92→0.55 / 0.88 为示意</span>",
          "componentId": "m3-distill"
        }
      ],
      "insight": "旧任务不必冻住，只要「别变味」—— 把它的输出当成交付标准。",
      "formula": {
        "lead": "于是训练目标变成三件事相加：学好新类、按住旧输出、别让参数乱长。",
        "unicode": "L = L_new + λ_o·L_old + R",
        "symbols": [
          {
            "sym": "L_new",
            "desc": "新任务的交叉熵，只用到新任务的图片和标签。"
          },
          {
            "sym": "L_old",
            "desc": "旧任务输出的蒸馏损失，比的是旧类概率与快照的差距。"
          },
          {
            "sym": "λ_o",
            "desc": "两项的平衡权重，多数实验取 1；调大更偏旧任务。"
          },
          {
            "sym": "R",
            "desc": "权重衰减正则，系数是 0.0005。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "LwF = 微调 + 一项旧输出蒸馏",
          "desc": "共享层照常更新，只是每一步多看一眼旧类输出。"
        },
        {
          "icon": "🔧",
          "title": "蒸馏项只要求输出像原来",
          "desc": "它不要求 θ_s 不动，所以新任务还能继续学下去。"
        },
        {
          "icon": "✨",
          "title": "这一项顺带起了正则作用",
          "desc": "旧输出被按住时，新任务常常也比只微调更好。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "温度：把不起眼的小概率也看清",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "§3 的总损失里还留着一个 T。它不是装饰：T 决定旧类分布里多细的差别会被算进损失。",
      "analogy": {
        "title": "灯亮一点，才看得见层次",
        "text": "汤色差一点点，暗处是看不见的。<b>调</b>亮，长尾的差别才浮出来。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "温度怎么改写分布",
          "desc": "拖动 T，12 个类的两排条形实时重算：上排是记录下来的旧类概率，下排是它开过 1/T 次方再归一化的结果。看长尾被抬起，也看最高条被压平。<br><span class=\"data-note\">数据：12 类示意分布，KD 数值非论文实测</span>",
          "componentId": "m4-temp"
        }
      ],
      "insight": "T 不是把概率整体放大，而是决定「哪些细小的差别算数」；论文的 2 是搜出来的，不是推出来的。",
      "formula": {
        "lead": "旧任务的损失不是直接比概率，而是先做一次带温度的归一化。",
        "unicode": "y′_o⁽ⁱ⁾ = (y_o⁽ⁱ⁾)^(1/T) / Σ_j (y_o⁽ʲ⁾)^(1/T)，L_old = − Σ_i y′_o⁽ⁱ⁾ log ŷ′_o⁽ⁱ⁾",
        "symbols": [
          {
            "sym": "T",
            "desc": "温度，标量；大于 1 时放大长尾，论文在验证集上取 2。"
          },
          {
            "sym": "y_o⁽ⁱ⁾",
            "desc": "旧网络在第 i 个旧类上的原始概率。"
          },
          {
            "sym": "y′_o⁽ⁱ⁾",
            "desc": "按 1/T 次方重新归一化后的概率，整行仍然和为 1。"
          },
          {
            "sym": "l",
            "desc": "旧类总数，ImageNet 上 l = 1000。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "蒸馏比的是形状",
          "desc": "温度决定形状里多细的部分被看见。"
        },
        {
          "icon": "🔧",
          "title": "T 太大，两排都会被压平",
          "desc": "所有类都差不多时区分度反而下降；论文在验证集上搜到 T=2。"
        },
        {
          "icon": "✨",
          "title": "换别的相似度损失差别不大",
          "desc": "关键是按住旧输出；温度版只是论文的选择，不是唯一解。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "λ 是那只分账的手",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "§4 把温度调清楚了，蒸馏项长什么样也定下来了。可总损失前面还站着一个系数 λ：它不改变损失的结构，只决定你把力气往哪边使。这一节把 λ 从“一个数”变成“一条可以走动的取舍前沿”。",
      "analogy": {
        "title": "多一分新，就少一分旧",
        "text": "两只茶荷抢同一只茶匙；<b>配</b>比例的时候，两边一定是互相让的。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "拧一下 λ，两边怎么换",
          "desc": "拖动 λ，橙点会在旧–新准确率平面上移动，右边两只小杯的液面此消彼长。<b>λ 不是最优点，是一条前沿</b>：调大偏旧、调小偏新。<br><span class=\"data-note\">数据：Places365→VOC（AlexNet），按 Fig.7(a) 读点</span>",
          "componentId": "m5-lambda"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "拉参数还是拉输出",
          "desc": "同样想保住旧任务，拉参数和拉输出是两回事。点四个 chip，看它们落在平面上的位置 —— <b>参数 L2 的几个点都挤在微调旁边</b>，而把输出拉住，旧任务几乎不掉、新任务还能到最高。<br><span class=\"data-note\">数据：ImageNet→Scenes（AlexNet），Table 1(a)</span>",
          "componentId": "m5-constraint"
        }
      ],
      "insight": "会调 λ 只是会“分账”，真正决定上限的是“拉哪儿”——拉输出还是拉参数。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "λ 是一条前沿，不是一个最优值",
          "desc": "调大偏旧、调小偏新；论文默认取 λ=1，正好落在两边的折中区。"
        },
        {
          "icon": "🔧",
          "title": "两端都不好看",
          "desc": "λ 太小旧任务掉，λ 太大新任务学不动 —— 这是在换，不是在加。"
        },
        {
          "icon": "✨",
          "title": "约束对象比力度更重要",
          "desc": "把参数按住不如把输出按住：L2 只在微调附近换来换去（旧升新降，54.0–54.9 / 63.4–64.1）；LwF 旧任务只比完全冻结低 1.2，新任务却是最高。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "四步：记、加、温、联",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "§5 只说了力气往哪边使；真正动手时，顺序还得对。这一节把前面的零件装成一条能照着跑的流程：记快照、加新头、热身、联合优化。",
      "analogy": {
        "title": "先温壶，再出汤",
        "text": "空壶直接冲，味道会跑偏。<b>温</b>一遍，是让壶先到状态。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "一次加任务的四步",
          "desc": "点「下一步」，依次走过四个阶段。注意每一步哪些块被灰遮罩锁住、哪些块亮起绿边：<b>热身只动新头</b>，联合那一步才动共享层。<br><span class=\"data-note\">数据：ImageNet→CUB（AlexNet），Table 1(a)</span>",
          "componentId": "m6-steps"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "顺序是固定的",
          "desc": "先记录快照、再加新头、再热身、最后联合优化 —— 顺序换了结果就变了。"
        },
        {
          "icon": "🔧",
          "title": "热身只动 θ_n",
          "desc": "冻结 θ_s 和 θ_o，共享层一动不动；新任务先及格，再谈联合。"
        },
        {
          "icon": "✨",
          "title": "新头很小",
          "desc": "参数量只有“新类数 × 最后一层宽度”，扩容代价极小。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "任务越多，贵在哪里",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "上一章把四步流程走完了，这一节来算账：多学一个任务，到底要多花多少。结论先摆在这里 —— <b>LwF 只比微调贵一点点</b>，真正随任务数涨起来的是联合训练，还有「每个任务各存一份网络」的测试开销。",
      "analogy": {
        "title": "每加一道，都要多等一会",
        "text": "一壶水只烧一次，<b>等</b>的时间却随杯数走。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "任务数一多，谁先贵起来",
          "desc": "拖动任务数 m，看三条成本曲线怎么分开。共享层每张图只前向、反传一次，所以<b>微调和 LwF 几乎贴着 1</b>，联合训练却一路涨到 m。<br><span class=\"data-note\">数据：相对成本示意，非实测毫秒</span>",
          "componentId": "m7-cost"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "成本排序",
          "desc": "训练成本：微调 ≈ LwF < 联合训练，差距随任务数拉大。"
        },
        {
          "icon": "🔧",
          "title": "测试也要算",
          "desc": "一份网络一份时间；每个任务各存一份，就是 m 倍。"
        },
        {
          "icon": "✨",
          "title": "省下的是数据",
          "desc": "真正省下的不只是算力，还有「必须保存旧数据」这件事本身。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "网络手术：只换头，还是加层",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "前面几章一直在讲「学什么」，这一节看「长什么样」。把 AlexNet 的每一块点开，你会发现<b>只有最后那层输出才是任务专属的</b>；再把五种改法摆在一起：多划专属层没有稳定收益，扩张能救旧任务却拖累新任务。",
      "analogy": {
        "title": "换一只滤网",
        "text": "壶身还是那只壶，<b>装</b>上去的滤网决定谁能过。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点一块，看它在 LwF 里干什么",
          "desc": "点一下网络行里的任意一块，下方固定高度的详情区会告诉你它的形状、参数量和 θ 归属。再切「热身 / 联合」，看冻结遮罩整体挪到哪几块上。<br><span class=\"data-note\">结构：AlexNet（形状与参数量取自论文）</span>",
          "componentId": "m8-surgery"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "五种改法，谁真划算",
          "desc": "五种改法、两条准确率。多划一层专属没有稳定收益；网络扩张单独用能把旧任务抬到 57.0，代价是新任务掉到 54.0、参数随任务数二次增长。<br><span class=\"data-note\">数据：ImageNet→CUB（AlexNet），Table 2(a)</span>",
          "componentId": "m8-variants"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "专属从哪开始",
          "desc": "共享参数到 fc7 为止，fc8 和新增的类节点才是任务专属。"
        },
        {
          "icon": "🔧",
          "title": "多划不划算",
          "desc": "多划一层专属没有稳定收益，参数量和存储却跟着变大。"
        },
        {
          "icon": "✨",
          "title": "扩张的取舍",
          "desc": "扩张靠冻结旧参数守住旧任务（57.0），代价是新任务掉到 54.0，参数量还随任务数二次增长；再加 LwF 也只是打平原版。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "三种替代，一种正解",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "上一节把 λ 讲成一只分账的手；这一节换个问法：<b>不碰旧任务的输出</b>，只降学习率、加参数惩罚、或者干脆冻住共享层，能不能也保住旧任务？三条替代路线各顾一头，本文的输出蒸馏想两头都要。",
      "analogy": {
        "title": "撇掉浮沫，汤还是那杯汤",
        "text": "表面<b>撇</b>干净，底下的味道一点没变。只顾一头的事，最容易骗人。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三种替代与一种正解",
          "desc": "逐个点开三条「看起来合理」的替代路线 —— 降学习率、参数 L2、冻结共享层 —— 再把它们和本文的输出蒸馏摆在一起比。留意：<b>冻共享层其实保住了旧任务</b>（57.1），代价是新任务停在 61.2；降学习率和 L2 连旧任务也保不住。左侧留样杯的液面表示旧任务还剩多少，右侧条形（L2 为 Fig.7(b) 读出的一小段区间）给出旧/新准确率。数据来自 ImageNet→Scenes（AlexNet）。",
          "componentId": "m9-alt"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "热身到底帮了谁",
          "desc": "先选微调或 LwF，再按下开始：两栏同时跑 2.4 秒，比较有热身和无热身的旧任务曲线。热身对谁会救命，一眼就能看出来。曲线是 ImageNet→CUB 的旧任务准确率（AlexNet）。",
          "componentId": "m9-warmup"
        }
      ],
      "insight": "热身也一样：对微调是救命稻草，对 LwF 只是锦上添花。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三条路线各顾一头",
          "desc": "降学习率（旧 54.8）、参数 L2（旧 54.0–54.9）都保不住旧任务；冻共享层保住了旧任务（57.1），新任务却停在 61.2。"
        },
        {
          "icon": "🔧",
          "title": "两头兼顾只有一条路",
          "desc": "只有把旧任务的输出按住（蒸馏），才能旧任务 55.9 的同时把新任务抬到 64.5 —— 旧任务只比冻共享层低 1.2，新任务却高 3.3。"
        },
        {
          "icon": "✨",
          "title": "热身只帮微调",
          "desc": "热身对微调关键，对 LwF 只是小幅加成。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果：赢在哪，输在哪",
      "badge": "both",
      "badgeLabel": "综合",
      "bridge": "十章的零件在这里合上：同一套任务、同一套指标、同一张评分表。先看三条任务对里的胜负，再记住<b>两个反例</b>。",
      "analogy": {
        "title": "把分数摆到桌上",
        "text": "说好不算，<b>举</b>牌才算。同一套杯子、同一套评分标准。",
        "componentId": "ana-tea"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "三种任务对，四条跑道",
          "desc": "先选一对任务，再按开始：上排旧任务、下排新任务，四条条形从 0 跑到真实数值。下方数据表保留精确分数，奖杯只发给这一行严格最高的方法。<br><span class=\"data-note\">数据：ImageNet→VOC / ImageNet→CUB / Places365→CUB（AlexNet），Table 1(a)</span>",
          "componentId": "m10-race"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "多数场景新任务第一",
          "desc": "新任务上 LwF 多数场景第一，旧任务上远好于微调、常不如特征提取。"
        },
        {
          "icon": "🔧",
          "title": "两个反例要看住",
          "desc": "ImageNet→MNIST 旧任务掉到 49.8；Places365→CUB 新任务输给微调 1.0 分。"
        },
        {
          "icon": "✨",
          "title": "差得越远越难守",
          "desc": "任务差得越远，新图片对旧任务的间接监督越弱，这是方法的边界。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV12bugz1ESN",
      "title": "【新芽播种】克服灾难性遗忘——持续学习方法对比分析",
      "reason": "把 LwF 放进 EWC、回放、正则化的谱系里横向比较，适合学完本教程后定位方法。",
      "cover": "https://i1.hdslb.com/bfs/archive/428cd99d1a6b2d30e88841da49d4cf46973a24e2.jpg",
      "views": "2344播放"
    },
    {
      "bvid": "BV1sZTHzBEaW",
      "title": "【新芽播种】持续学习：从基础到前沿",
      "reason": "系统梳理持续学习的问题设定与主流路线，可作为第 1 章的背景补充。",
      "cover": "https://i1.hdslb.com/bfs/archive/c9688136d04cf9ba040b29c3bed0d1e54f47d131.jpg",
      "views": "1381播放"
    },
    {
      "bvid": "BV1XcRpBpERT",
      "title": "【李宏毅 | 机器学习2026春】hw5 Finetuning without Forgetting",
      "reason": "作业设定与 LwF「只拿新数据继续训练」几乎同构，可作为动手参考。",
      "cover": "https://i0.hdslb.com/bfs/archive/9d1c33af60c88af5aa5e0d6ef150fa6a8d95b3b4.jpg",
      "views": "280播放"
    }
  ]
};
