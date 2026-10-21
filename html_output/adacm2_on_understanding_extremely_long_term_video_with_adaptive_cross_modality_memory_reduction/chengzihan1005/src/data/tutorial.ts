import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "AdaCM2: On Understanding Extremely Long-Term Video with Adaptive Cross-Modality Memory Reduction",
    "titleZh": "AdaCM²：两小时的视频，模型到底该记住什么？",
    "venue": "CVPR 2025",
    "authors": "Yuanbin Man, Ying Huang, Chengming Zhang, Bingzhe Li, Wei Niu, Miao Yin",
    "affiliation": "UT Arlington · University of Houston · UT Dallas · University of Georgia",
    "domain": "超长视频理解 · 视觉语言模型 · KV Cache 压缩",
    "coreProblem": "长视频让视觉缓存持续增长，而只依据画面相似度压缩又可能删除与当前问题最相关的小线索。",
    "coreInsight": "让文本问题参与视觉 token 打分：最近缓存完整保留，旧缓存按跨模态相关性逐层择优。",
    "keywords": [
      "AdaCM²",
      "长视频理解",
      "跨模态注意力",
      "记忆压缩"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只按视觉显著性挑重点：运动画面留下了，但球衣号码 10 这个小线索被删掉。",
      "componentId": "adacm2-hero-old"
    },
    "newMethod": {
      "desc": "让问题参与筛选：文本关注球衣号码，关键 token 被保留，最终回答 10。",
      "componentId": "adacm2-hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "记忆爆仓：两小时视频有多可怕？",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "<strong>快速理解：</strong>把教学进度推向长视频末尾，观察帧、token 与缓存怎样持续累积。<br/><strong>论文怎么做：</strong>现有方案通常按视觉相似度合并或压缩，却没有回答“当前问题真正需要什么”。<br/><strong>证据边界：</strong>本章曲线是教学归一化示意；论文的实际显存对比留到 Figure 6。",
      "analogy": {
        "title": "两小时卷宗，一只小抽屉",
        "text": "证据不断变多，但抽屉容量有限。删减时最怕的不是少记，而是把答案线索一起扔掉。",
        "componentId": "adacm2-c1-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "显存危机模拟器",
          "desc": "拖动视频时长，再切换记忆策略；曲线是教学归一化示意，不代表固定 GPU GB。",
          "componentId": "adacm2-c1-pressure-v3",
          "figure": "./images/fig1-motivation.png"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "盲删 vs 查询引导",
          "desc": "在相同 10% 预算下比较视觉显著性与问题引导，观察球衣号码是否被保留。",
          "componentId": "adacm2-c1-clue",
          "figure": "./images/fig2-egovideo.png"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Figure 1 / Figure 2：</strong>论文把单模态 token merge 与跨模态注意力并置比较，并展示超过两小时的 Ego4D 案例。这里的关键不是“把视频看完”，而是把有限记忆预算用在能回答当前问题的证据上。",
      "takeaways": [
        {
          "icon": "🎞️",
          "title": "时长带来压力",
          "desc": "帧数增加会不断累积视觉 token。"
        },
        {
          "icon": "🔍",
          "title": "显著不等于相关",
          "desc": "小细节也可能决定答案。"
        },
        {
          "icon": "🧠",
          "title": "选择性记忆",
          "desc": "压缩必须由任务需求约束。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "谁决定什么值得记住？",
      "badge": "inf",
      "badgeLabel": "直觉",
      "bridge": "<strong>快速理解：</strong>同一帧里，地点、动作和号码对应不同视觉区域。<br/><strong>论文怎么做：</strong>AdaCM² 让文本 query 进入视觉 token 的相关性计算，而不是先用固定视觉规则决定命运。<br/><strong>证据边界：</strong>这里的 attention 是预计算教学映射，不是浏览器现场运行 Q-Former。",
      "analogy": {
        "title": "问题一换，重点就换",
        "text": "同一张证据照片，问地点、动作或号码时，放大镜应该停在不同位置。",
        "componentId": "adacm2-c2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "问题改变→重要 Token 改变",
          "desc": "选择三个问题之一，同一帧的 token 高亮与相关性条形图会同步变化；分数仅作教学示意。",
          "componentId": "adacm2-c2-query",
          "figure": "./images/fig1-motivation.png"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "方法版图探测器",
          "desc": "点击短视频理解、视觉压缩与跨模态记忆，定位 AdaCM² 的问题边界。",
          "componentId": "adacm2-c2-map"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Figure 1：</strong>同一个视觉编码器可以面对不同问题产生不同的筛选信号。把 query 放进压缩环节，才能解释为什么一个很小的号码 token 可能比整片运动场更值得留下。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "同帧多义",
          "desc": "不同问题需要不同视觉区域。"
        },
        {
          "icon": "💬",
          "title": "文本参与",
          "desc": "问题本身成为记忆筛选器。"
        },
        {
          "icon": "⚠️",
          "title": "固定规则有风险",
          "desc": "纯视觉压缩可能漏掉答案细节。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "观察一：真正重要的 Token 很少",
      "badge": "inf",
      "badgeLabel": "观察",
      "bridge": "<strong>快速理解：</strong>先把注意力当作一张侦探放大镜，找出少量深色线索。<br/><strong>论文怎么做：</strong>Figure 3(a)(b) 观察帧内 cross-attention 的稀疏性与分数分布，说明大量 token 的相关性很低。<br/><strong>证据边界：</strong>交互数值是教学模拟，非论文原图逐点复刻；本章 3.2 预览 Figure 3(c) 的层间相似性，下一章再展开。",
      "analogy": {
        "title": "许多痕迹，其实在重复",
        "text": "放大镜下只有少量墨迹特别深；叠起相邻证据页，很多位置又高度重合。",
        "componentId": "adacm2-c3-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "稀疏注意力探针",
          "desc": "教学模拟：拖动阈值，观察保留 token 数量与答案线索是否同时幸存；图形重构自论文观察，非逐点复刻。",
          "componentId": "adacm2-c3-microscope",
          "figure": "./images/fig3-sparsity.png"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "层间冗余观察台",
          "desc": "切换 Q-Former 层，比较相邻帧注意力形状；最近五帧相似度超过 90% 来自论文 Figure 3(c) 的观察。",
          "componentId": "adacm2-c3-layer"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Figure 3(a)(b)(c)：</strong>Figure 3(a)(b) 显示帧内只有一部分视觉 token 对文本 query 呈现较强相关性；3.2 的层间观察依据 Figure 3(c)。这些观察为压缩提供空间，但不意味着可以把所有低分 token 随意删除；下一章会展开层与帧距的影响。",
      "formula": {
        "lead": "余弦相似度衡量两帧注意力得分方向是否一致。",
        "unicode": "sim(a,b)=a·b/(||a|| ||b||)",
        "symbols": [
          {
            "sym": "a,b",
            "desc": "两帧的注意力得分向量"
          },
          {
            "sym": "sim",
            "desc": "越接近 1 表示形状越相似"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔦",
          "title": "帧内稀疏",
          "desc": "少量 token 获得较高相关性。"
        },
        {
          "icon": "🪞",
          "title": "相邻重复",
          "desc": "最近帧注意力形状高度相似。"
        },
        {
          "icon": "🧱",
          "title": "逐层适配",
          "desc": "深浅层的冗余程度不同。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "观察二：不同层冗余程度不同",
      "badge": "both",
      "badgeLabel": "机制",
      "bridge": "<strong>快速理解：</strong>把同一个问题放到相邻帧上，注意力形状往往重复；但不同层的重复速度不同。<br/><strong>论文怎么做：</strong>本章只聚焦 Figure 3(c)：横轴是 Adjacent Frame Distance，纵轴是 Cosine Similarity，比较 Layer 2/4/6/8/10/12。<br/><strong>实现提醒：</strong>论文最终实验采用 α=β=0.1；“逐层自适应”是机制视角，不应被误读成每层一定使用不同数值。曲线交互是教学模拟，不是逐点复刻。",
      "analogy": {
        "title": "叠起相邻证据页",
        "text": "管理员把相邻档案页叠起来比较：浅层仍有局部差异，深层的注意力形状更容易重复。",
        "componentId": "adacm2-c4-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "Layer-Distance Explorer",
          "desc": "教学模拟：选择 Layer 2/4/6/8/10/12，再拖 Adjacent Frame Distance；曲线重构 Figure 3(c) 的观察，不是逐点复刻。",
          "componentId": "adacm2-c4-layer-distance",
          "figure": "./images/fig3-c-distance.png"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "一帧一帧建立缓存",
          "desc": "逐步查看一帧如何进入视觉 token、Recent Cache 与 Previous Cache。",
          "componentId": "adacm2-c4-cache"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Figure 3(c)：</strong>论文报告最近五帧的 cross-attention cosine similarity 超过 90%，且深层在更远帧距下仍保持更强相似性。因此记忆压缩不能只看时间，也不能只看一个固定层。",
      "formula": {
        "lead": "位置编码把“看见什么”与“何时看见”绑定。",
        "unicode": "fₜ=xₜ+E(t),  fₜ∈Rᴾˣᶜ",
        "symbols": [
          {
            "sym": "xₜ",
            "desc": "第 t 帧的 P 个 C 维视觉 token"
          },
          {
            "sym": "E(t)",
            "desc": "第 t 帧的位置编码"
          },
          {
            "sym": "fₜ",
            "desc": "带时间信息的帧特征"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎞️",
          "title": "按帧处理",
          "desc": "视频逐帧进入模型。"
        },
        {
          "icon": "🕒",
          "title": "加入时序",
          "desc": "位置编码保留帧顺序。"
        },
        {
          "icon": "🗃️",
          "title": "持续更新",
          "desc": "KV cache 与查询同步演化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "文本问题如何给视觉线索打分？",
      "badge": "both",
      "badgeLabel": "数学",
      "bridge": "<strong>快速理解：</strong>注意力矩阵不是装饰，它可以被读成“文本 token 对视觉 token 的投票表”。<br/><strong>论文怎么做：</strong>从 Q/K/V 与 softmax cross-attention 出发，对视觉列累加得到 Sᶜₜ(i)，再按分数排序。<br/><strong>学习目标：</strong>先亲手完成一次列求和，再回头看 Eq.5。",
      "analogy": {
        "title": "给每张线索卡累计关注票",
        "text": "问题里的不同词会关注不同视觉位置；把同一视觉列收到的关注加起来，就得到保留优先级。",
        "componentId": "adacm2-c5-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "注意力矩阵列求和",
          "desc": "点击视觉列，再按步骤完成查看、求和与排序。矩阵数值是解释公式的教学示例。",
          "componentId": "adacm2-c5-score",
          "figure": "./images/fig5-reduction.png"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "Query Scoring Arena",
          "desc": "切换预设问题，观察 8×8 token 网格、Token Ranking 与相关性分数同步重排；这是预计算教学可视化。",
          "componentId": "adacm2-c5-arena"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Eq.2–5 / Figure 5：</strong>对同一视觉列求和，会把多个文本 query 对它的关注合并成一个可比较分数。这个分数只在当前 cross-modal alignment 语境中成立，不应直接等同于 LLM 自注意力里的通用 token importance。",
      "formula": {
        "lead": "先计算跨模态注意力，再累加每个视觉位置收到的注意力。",
        "unicode": "Aₜ=softmax(QₜKₜᵀ/√C)Vₜ；Sᶜₜ(i)=ΣⱼSₜ(j,i)",
        "symbols": [
          {
            "sym": "Qₜ",
            "desc": "可学习查询与文本 token"
          },
          {
            "sym": "Kₜ,Vₜ",
            "desc": "视频键值缓存"
          },
          {
            "sym": "Sᶜₜ(i)",
            "desc": "视觉位置 i 的累计相关分"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧮",
          "title": "跨模态矩阵",
          "desc": "文本和视觉共同产生注意力。"
        },
        {
          "icon": "➕",
          "title": "按列累加",
          "desc": "每个视觉 token 得到总分。"
        },
        {
          "icon": "🏅",
          "title": "分数排序",
          "desc": "高相关旧线索优先保留。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "AdaCM² 核心：最近全留，过去择优",
      "badge": "inf",
      "badgeLabel": "推理",
      "bridge": "<strong>快速理解：</strong>Recent Cache 像桌面上的材料，先完整保护；Previous Cache 像档案柜，只保留与问题相关的 Top-β。<br/><strong>论文怎么做：</strong>α 划分 recent/previous，β 控制旧缓存保留比例，Eq.6–7 把分区与排名写成可执行规则。<br/><strong>挑战目标：</strong>既降低记忆压力，又不能删掉号码 10。",
      "analogy": {
        "title": "桌面全留，档案择优",
        "text": "刚拿到的证据先完整留在桌面；更早的档案只保留与问题最相关的一部分。",
        "componentId": "adacm2-c6-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "Memory Cleaner",
          "desc": "调节 α 与 β，再执行一次清理；40 张卡片仅用于教学计数，不是论文固定 batch。",
          "componentId": "adacm2-c6-cleaner",
          "figure": "./images/fig5-reduction.png"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "Memory Vault Challenge：关键线索救援",
          "desc": "切换号码或动作线索，再改变问题；逐步追踪示意 token 从最近缓存进入旧缓存后的命运。图中分数与路径均为教学示例。",
          "componentId": "adacm2-c6-surgery"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Figure 5 / Eq.6–7：</strong>每个 token 的命运由所在缓存分区和 cross-modality score 共同决定。救援挑战用教学示例展示这条因果链：调低 β 会降低旧缓存规模，但也可能删掉关键历史线索。",
      "formula": {
        "lead": "α 决定最近区，β 决定旧缓存的保留比例。",
        "unicode": "|K̂ₜ|/|K̃ₜ|=(1−α)/α；|K̄ₜ|/|K̂ₜ|=β",
        "symbols": [
          {
            "sym": "K̃ₜ",
            "desc": "最近缓存，完整保留"
          },
          {
            "sym": "K̂ₜ",
            "desc": "旧缓存，等待排名"
          },
          {
            "sym": "K̄ₜ",
            "desc": "排名后保留的旧缓存"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🟦",
          "title": "最近全留",
          "desc": "保护最新视觉信息。"
        },
        {
          "icon": "🟩",
          "title": "过去择优",
          "desc": "旧 token 按问题相关性排序。"
        },
        {
          "icon": "✂️",
          "title": "逐层压缩",
          "desc": "K/V 缓存同步执行减法。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "视频无限长，记忆也能有限吗？",
      "badge": "both",
      "badgeLabel": "数学",
      "bridge": "<strong>快速理解：</strong>如果视频永远继续，缓存会不会永远增长？<br/><strong>论文怎么做：</strong>令 r=α+(1−α)β，递推式把每轮新增 token 的保留量写成几何级数。<br/><strong>证据边界：</strong>只有在 0≤r<1 且采用论文推导假设时，才得到有限 token cache 上界；这不是固定 GPU 显存承诺，Figure 6 的实测 GPU memory 需要单独阅读。",
      "analogy": {
        "title": "不断来新证据，抽屉仍有上限",
        "text": "每一轮只让一部分旧档案继续留下；只要有效保留因子小于 1，历史尾巴就会收敛。",
        "componentId": "adacm2-c7-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "Infinite Video Lab",
          "desc": "教学模拟：调节 α、β，观察有效保留因子 r 与归一化缓存曲线；它解释 token 规模，不等于实测 GPU GB。",
          "componentId": "adacm2-c7-limit",
          "figure": "./images/fig6-memory.png"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "Layer-wise Memory Board",
          "desc": "教学示意：点击六个代表层；论文报告设置各层均用 α=β=0.1，但层间注意力分数不同，被保留的旧 token 可以不同。40 格卡片的取整仅供理解。",
          "componentId": "adacm2-c7-layer-board"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Eq.8 / Figure 6：</strong>在论文推导条件下，当 0≤r&lt;1 时长期 token cache 有有限上界；当 r 接近 1，极限会变大。这个结论不等于固定 GPU GB 保证。论文实测还显示 InstructBLIP 随帧数增长很快触发 OOM，AdaCM² 在报告设置下保持近似恒定的显存占用。",
      "formula": {
        "lead": "当有效保留因子 r 小于 1 时，几何级数有有限极限。",
        "unicode": "r=α+(1−α)β；|K_T|=Pr(1−rᵀ)/(1−r)；T→∞⇒Pr/(1−r)",
        "symbols": [
          {
            "sym": "r",
            "desc": "每轮有效保留因子"
          },
          {
            "sym": "P",
            "desc": "每帧视觉 token 数"
          },
          {
            "sym": "T",
            "desc": "视频帧数；有限极限要求 r<1"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📉",
          "title": "历史递减",
          "desc": "旧缓存贡献按轮次衰减。"
        },
        {
          "icon": "♾️",
          "title": "r<1 才有界",
          "desc": "收敛条件不能省略。"
        },
        {
          "icon": "🧠",
          "title": "推导与实测分开",
          "desc": "token 极限不等于固定显存值。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "把整台 AdaCM² 拆开来看",
      "badge": "trn",
      "badgeLabel": "架构",
      "bridge": "<strong>快速理解：</strong>现在不再把 AdaCM² 当成一个孤立剪枝器，而是沿一帧数据走完整条系统路径。<br/><strong>论文怎么做：</strong>视觉编码器提取特征，Video Q-Former 递归处理帧并做跨模态对齐，记忆压缩发生在缓存内部，learned query 再交给 Vicuna-7B。<br/><strong>实现条件：</strong>视觉编码器与 LLM 冻结，主要微调 Q-Former。",
      "analogy": {
        "title": "沿着一条证据链追到答案",
        "text": "视觉编码器提取线索，Q-Former 对齐问题并整理记忆，LLM 把有限查询表示写成答案。",
        "componentId": "adacm2-c8-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "模型路径追踪图",
          "desc": "切换正向与反向，再逐步追踪节点；高亮展示教学示意路径。模型冻结与微调状态以论文 Figure 4 为准。",
          "componentId": "adacm2-c8-trace",
          "figure": "./images/fig4-architecture.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "一帧推理 Stepper",
          "desc": "按 Encode → Attention → Score → Reduce → Query → Answer 走完一次论文配置下的推理路径。",
          "componentId": "adacm2-c8-stepper"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Figure 4：</strong>架构图中的雪花代表 frozen，火焰代表 fine-tuned。正向 Stepper 与反向溯源是机制教学示意，并非论文报告的逐 token 推理日志，也不是浏览器现场运行 EVA-CLIP、Q-Former 或 Vicuna。",
      "takeaways": [
        {
          "icon": "❄️",
          "title": "两端冻结",
          "desc": "论文配置冻结视觉编码器与 Vicuna-7B。"
        },
        {
          "icon": "🔥",
          "title": "中间微调",
          "desc": "Q-Former 学习对齐与记忆。"
        },
        {
          "icon": "🧬",
          "title": "逐层自适应",
          "desc": "逐层评估注意力；论文报告配置各层均用 α=β=0.1。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "数据会说话：它真的有效吗？",
      "badge": "trn",
      "badgeLabel": "消融",
      "bridge": "<strong>快速理解：</strong>实验不是表格墙，而是一组需要被审问的 claim。<br/><strong>论文怎么做：</strong>分别报告 LVU、Breakfast、COIN、MSRVTT/MSVD/YouCook2 以及 memory、random eviction、α/β 和 LLM decoding 分析。<br/><strong>操作规则：</strong>论文没有测过的组合只显示为教学模拟，不伪造逐点结论。",
      "analogy": {
        "title": "线索太少会漏，太多也会吵",
        "text": "过度遗忘会删答案，什么都舍不得又会让冗余占据注意力；好设置追求有效线索密度。",
        "componentId": "adacm2-c9-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "Ablation Lab：α/β 调参",
          "desc": "选择预设或拖动 α、β 滑杆；色块仅示意论文 Figure 8 的趋势，圆点位置由当前参数决定，不代表逐点实测准确率。",
          "componentId": "adacm2-c9-tune",
          "figure": "./images/fig8-ablation.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "证据法庭",
          "desc": "切换 LVU 平均、显存、长期上界和随机淘汰，分别核对论文表格、图示或推导的证据边界。",
          "componentId": "adacm2-c9-evidence",
          "figure": "./images/fig7-random-eviction.png"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Tables 1–4 / Figures 6–8：</strong>在 LVU 七项任务平均 Top-1 中，AdaCM² 为 67.5，MA-LMM 为 63.0；MSVD 描述任务报告 51.4 METEOR、189.4 CIDEr。Figure 8 说明 α、β 增大时性能可能先升后降；论文报告配置为 α=β=0.1，不能把教学曲面当作逐点实测结果。",
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "存在权衡",
          "desc": "少了漏线索，多了增显存。"
        },
        {
          "icon": "📍",
          "title": "报告点 0.1/0.1",
          "desc": "它是论文实验配置。"
        },
        {
          "icon": "🚫",
          "title": "更多不必更准",
          "desc": "冗余可能干扰关注。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "两小时记忆终极挑战",
      "badge": "both",
      "badgeLabel": "结果",
      "bridge": "<strong>快速理解：</strong>最后先审查数字，再回到 02:10:13 的 Ego4D 案例寻找一条真实长程线索。<br/><strong>论文怎么做：</strong>把 benchmark 的准确率、captioning 指标和 memory claim 分开解读，最后用 zero-shot 视频问答闭环。<br/><strong>开放问题：</strong>65% 是论文设置下的最高报告，不是任何模型、视频和部署环境的固定保证。",
      "analogy": {
        "title": "结案不是一句“全面领先”",
        "text": "真正的结论必须带上数据集、指标和条件；既看胜利，也看没有获胜的项目与仍待验证的边界。",
        "componentId": "adacm2-c10-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "Result Race：论文结果赛",
          "desc": "选择指标并开始比较；数值来自论文表格，界面标注数据集、指标和 baseline，包括 AdaCM² 未领先的 MSRVTT 描述任务。显存项是论文设置下的相对示意。",
          "componentId": "adacm2-c10-results",
          "figure": "./images/fig6-memory.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "02:10:13 时间轴寻宝",
          "desc": "论文案例重现：拖动时间轴到 02:10:13，打开 Memory Vault，找出白色球衣背后的号码 10；这不是浏览器现场运行模型。",
          "componentId": "adacm2-c10-mystery",
          "figure": "./images/fig2-egovideo.png"
        }
      ],
      "insight": "<strong>📄 Paper Evidence · Table 3 / Figure 2 / Figure 6：</strong>Table 3 的 MSRVTT 描述任务中，AdaCM² 的 METEOR/CIDEr 为 33.0/73.1，低于 MA-LMM 的 33.4/74.6，因此不能概括为全面领先。Figure 2 的 Ego4D 定性案例展示了白色球衣号码 10；Figure 6 报告论文设置下的显存表现。时间轴与 Memory Vault 是论文案例重现，不是浏览器现场运行模型。",
      "takeaways": [
        {
          "icon": "🏆",
          "title": "LVU 平均 67.5",
          "desc": "同表 MA-LMM 为 63.0。"
        },
        {
          "icon": "💾",
          "title": "最高约 65%",
          "desc": "仅限论文报告的实验设置。"
        },
        {
          "icon": "🧭",
          "title": "并非全面领先",
          "desc": "MSRVTT 描述任务的两项指标均低于 MA-LMM。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1mqaVz7E6k",
      "title": "打破长视频理解极限：Video-XL 与 Video-XL-2",
      "reason": "小时级长视频理解的相关研究分享，用于扩展视野，不作为本文证据。",
      "views": "1577播放"
    },
    {
      "bvid": "BV1ExgQzXEio",
      "title": "多模态 RAG：让 AI 看视频并答题",
      "reason": "从应用角度理解视频问答与文本—视觉桥接。",
      "views": "2656播放"
    },
    {
      "bvid": "BV1wGHXewEpJ",
      "title": "视频理解模型实战：批量处理海量视频",
      "reason": "视频理解工作流背景材料，不代表 AdaCM² 的论文结论。",
      "views": "1.3万播放"
    }
  ]
};

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  evidence: string;
};

export const chapterQuizzes: Record<string, [QuizQuestion, QuizQuestion]> = {
  "chap-1": [
    {
      prompt: "超长视频理解首先遇到的核心瓶颈是什么？",
      options: ["视频帧完全无法读取", "视觉 token 与缓存随时长持续累积", "文本问题无法输入", "只能处理静态图片"],
      answer: 1,
      explanation: "正确。视频越长，视觉 token/KV cache 越容易持续堆积，系统会面临内存压力。",
      evidence: "对应论文 Figure 1/5/6：问题重点是 memory consumption，而不是简单的播放能力。"
    },
    {
      prompt: "为什么只按视觉相似度删 token 可能会失败？",
      options: ["相似度计算一定很慢", "视觉上很小的细节可能正是问题答案", "所有帧都必须保留", "文本模型不认识视频"],
      answer: 1,
      explanation: "正确。球衣号码等小线索在画面上不显眼，却可能决定问答结果。",
      evidence: "论文 Figure 1 与 Ego4D 案例强调：视觉显著性不等于对当前问题有用。"
    }
  ],
  "chap-2": [
    {
      prompt: "AdaCM² 中，什么信息会参与视觉 token 的重要性判断？",
      options: ["视频文件名", "当前文本问题的跨模态相关性", "屏幕亮度", "随机噪声"],
      answer: 1,
      explanation: "正确。当前 query 会通过跨模态注意力为视觉线索提供问题相关的分数。",
      evidence: "这正是 cross-modality memory reduction 的核心动机。"
    },
    {
      prompt: "当问题从“他在做什么？”换成“球衣号码是多少？”时，最合理的现象是：",
      options: ["重要 token 永远完全不变", "与球衣号码相关的局部 token 排名上升", "系统必须丢弃全部文本", "只能重新下载视频"],
      answer: 1,
      explanation: "正确。重要性是 query-dependent：问题变化会改变需要保留的视觉证据。",
      evidence: "交互中的热力图是教学重建，用来展示论文提出的 query-guided intuition。"
    }
  ],
  "chap-3": [
    {
      prompt: "论文对 cross-modal attention 的观察更接近下面哪一种？",
      options: ["所有视觉 token 权重都一样", "少数 token 获得较高关注，大量 token 贡献较小", "注意力只存在于音频", "注意力完全随机"],
      answer: 1,
      explanation: "正确。注意力具有稀疏性，为保留少量高价值 token 提供了依据。",
      evidence: "Figure 3(a)/(b) 用注意力分布支持“少数 token 更重要”的观察。"
    },
    {
      prompt: "在稀疏注意力实验中，Top-K 的作用是什么？",
      options: ["保留得分最高的一小部分 token", "把所有 token 复制一遍", "把视频变成音频", "关闭跨模态信息"],
      answer: 0,
      explanation: "正确。Top-K 是一种可视化压缩旋钮，帮助观察少量高分 token 能覆盖多少注意力质量。",
      evidence: "注意：该交互用于解释论文观察，不代表网页现场运行 Q-Former。"
    }
  ],
  "chap-4": [
    {
      prompt: "Figure 3(c) 的横轴表示什么？",
      options: ["Adjacent Frame Distance", "GPU 温度", "文本长度", "视频分辨率"],
      answer: 0,
      explanation: "正确。横轴是相邻帧距离，用来观察帧间余弦相似度如何变化。",
      evidence: "论文 Figure 3(c) 展示 Layer 2/4/6/8/10/12 的曲线。"
    },
    {
      prompt: "论文关于相邻帧冗余的观察是：",
      options: ["最近若干帧通常高度相似，深层相似性更稳定", "相邻帧永远完全不同", "只有第一层存在冗余", "层数越深越随机"],
      answer: 0,
      explanation: "正确。论文指出最近五帧相似度很高，并观察到深层比浅层保持更高相似度。",
      evidence: "这也是为什么压缩策略需要逐层、逐时间尺度适配，而不是一刀切。"
    }
  ],
  "chap-5": [
    {
      prompt: "跨模态分数在 AdaCM² 中主要承担什么角色？",
      options: ["衡量视觉 token 与当前 query 的相关性", "记录鼠标坐标", "替代全部视觉编码", "决定视频播放音量"],
      answer: 0,
      explanation: "正确。它把文本问题带来的语义需求传回视觉记忆筛选。",
      evidence: "分数可理解为 query-guided importance signal，网页中的柱状图是教学可视化。"
    },
    {
      prompt: "如果一个 token 视觉上不显眼，但对问题答案很关键，它应该怎样处理？",
      options: ["因为不显眼就一定删除", "获得更高的 query-aware 保留优先级", "只在最后一帧出现才保留", "与所有 token 交换位置"],
      answer: 1,
      explanation: "正确。AdaCM² 的价值就在于避免把“视觉不显著”误判成“任务不重要”。",
      evidence: "球衣号码是贯穿教程的例子；最终是否保留仍受缓存预算约束。"
    }
  ],
  "chap-6": [
    {
      prompt: "AdaCM² 的缓存更新策略可以概括为：",
      options: ["最近信息全部保留，旧信息按相关性择优", "所有旧信息随机删除", "只保留第一帧", "完全不使用缓存"],
      answer: 0,
      explanation: "正确。Recent Cache 保持连续性，Previous Cache 则根据重要性进行压缩。",
      evidence: "Figure 4 展示了 recent/previous cache 与 cross-modal reduction 的组合。"
    },
    {
      prompt: "为什么要把最近缓存和旧缓存区别对待？",
      options: ["最近帧通常仍有局部时序信息，旧帧更适合做选择性压缩", "旧帧永远无用", "最近帧不能编码", "只是为了让动画更好看"],
      answer: 0,
      explanation: "正确。保留近期上下文能减少时序断裂，再对更早的记忆做有依据的淘汰。",
      evidence: "交互中的 token genealogy 用来展示“同一 token 命运随 query 改变”的反事实。"
    }
  ],
  "chap-7": [
    {
      prompt: "令 r=α+(1−α)β，论文推导的长期 token cache 上界在什么条件下有限？",
      options: ["r=1", "0≤r<1", "r>1", "只要帧数足够大就一定有限"],
      answer: 1,
      explanation: "正确。当 0≤r<1，几何级数收敛，式(8)给出有限的 token cache 上界。",
      evidence: "论文 Eq.8 的上界为 Pr/(1−r)，成立条件是 r<1。"
    },
    {
      prompt: "式(8)的有限上界是否直接保证 GPU 显存固定不变？",
      options: ["是，任何模型都恰好占用相同 GB", "否，它只约束推导假设下的 token cache 规模", "是，不必测量显存", "否，因为 r 必须大于 1"],
      answer: 1,
      explanation: "正确。token 数量的数学上界不等于整套系统的固定显存值；GPU memory 还需看 Figure 6 的实测设置。",
      evidence: "论文 Eq.8 是缓存规模推导，Figure 6 是实验显存曲线，两者证据类型不同。"
    }
  ],
  "chap-8": [
    {
      prompt: "理解 AdaCM² 的数据流时，哪条链路最关键？",
      options: ["视频帧 → 视觉 token → query-aware scoring → cache 更新", "音量 → 字幕颜色 → 页面背景", "随机数 → 删除全部帧", "答案 → 随机帧"],
      answer: 0,
      explanation: "正确。这个链路把输入、跨模态打分、记忆更新和最终回答串起来。",
      evidence: "Figure 4 是方法结构的主要论文证据；网页增加了可逆追踪方便理解。"
    },
    {
      prompt: "为什么“反向追踪答案”有助于理解方法？",
      options: ["它展示答案依赖哪些帧和 token 证据", "它证明所有 token 都相同", "它绕过了模型", "它只是在播放 GIF"],
      answer: 0,
      explanation: "正确。把答案追溯到 token 和帧，能直观看到压缩策略是否保住了支持答案的证据。",
      evidence: "反向追踪是可解释性教学视图，不等同于论文新增的推理日志。"
    }
  ],
  "chap-9": [
    {
      prompt: "阅读论文实验表格时，为什么不能只看一个最高分？",
      options: ["还要结合数据集、指标、基线与内存代价", "因为分数没有意义", "因为所有表格都是装饰", "只要看颜色即可"],
      answer: 0,
      explanation: "正确。准确率、任务类型、压缩比例和对比方法共同决定结论是否成立。",
      evidence: "Table 1–4 分别覆盖 LVU、Breakfast/COIN、captioning 与 decoding 等证据。"
    },
    {
      prompt: "论文报告的 AdaCM² 结果更准确的表述是：",
      options: ["在相关长视频任务上取得更好的精度—内存折中", "所有任务都达到 100%", "完全不需要视觉 token", "只适用于图片分类"],
      answer: 0,
      explanation: "正确。论文展示的是在压缩内存的同时保持/提升多个任务表现，而不是无条件地全面胜出。",
      evidence: "具体数字和适用范围应以论文表格与实验设置为准。"
    }
  ],
  "chap-10": [
    {
      prompt: "长时案例中，Memory Vault 的作用是什么？",
      options: ["从长时间轴中检索并追溯与问题相关的记忆证据", "替代视频播放器", "随机生成答案", "删除所有历史帧"],
      answer: 0,
      explanation: "正确。它把长时间轴、缓存和答案证据连接起来，模拟一次完整的长时检索。",
      evidence: "Figure 2 的 Ego4D 案例是终章的主要论文证据。"
    },
    {
      prompt: "这篇论文最值得带走的一句话是：",
      options: ["记忆越大越好", "不是看见什么都记住，而是为当前问题留下正确证据", "只要删得多就一定更强", "文本和视觉必须完全分离"],
      answer: 1,
      explanation: "正确。AdaCM² 的核心思想是让跨模态相关性参与记忆压缩。",
      evidence: "这是对论文动机、方法和实验结果的概括；交互中的总结卡同时标注了证据边界。"
    }
  ]
};
