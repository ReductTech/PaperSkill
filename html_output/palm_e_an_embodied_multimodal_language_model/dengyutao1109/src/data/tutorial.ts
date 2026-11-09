import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "PaLM-E: An Embodied Multimodal Language Model",
    "titleZh": "PaLM-E：一个具身多模态语言模型",
    "venue": "arXiv:2303.03378v1, 2023",
    "authors": "Danny Driess, Fei Xia, Mehdi S. M. Sajjadi, Corey Lynch, Aakanksha Chowdhery, Brian Ichter, Ayzaan Wahid, Jonathan Tompson, Quan Vuong, Tianhe Yu, Wenlong Huang, Yevgen Chebotar, Pierre Sermanet, Daniel Duckworth, Sergey Levine, Vincent Vanhoucke, Karol Hausman, Marc Toussaint, Klaus Greff, Andy Zeng, Igor Mordatch, Pete Florence",
    "affiliation": "Robotics at Google; TU Berlin; Google Research",
    "domain": "具身智能 · 视觉语言模型 · 机器人规划 · 多模态表示 · 迁移学习 · 灾难性遗忘",
    "coreProblem": "大语言模型推理能力强却没有锚定到感知；现成的 SOTA 视觉语言模型零样本难以完成具身推理，而只判断可行动性的方法只能约束当下可行动作，排不出长程计划。",
    "coreInsight": "把图像、状态与 3D 场景表示作为多模态 token，与文本交错注入预训练 decoder-only 大语言模型；一个联合训练的模型即可完成具身规划、视觉问答与描述，并跨具身形态迁移，规模越大保留的语言能力越多。",
    "keywords": [
      "PaLM-E",
      "具身语言模型",
      "多模态句子",
      "观测嵌入",
      "前缀条件",
      "物体中心表示",
      "OSRT",
      "ViT 图像编码",
      "状态向量",
      "跨任务迁移",
      "灾难性遗忘",
      "链式思维",
      "视觉问答",
      "机器人规划",
      "高层子步骤",
      "低层策略",
      "单样本泛化",
      "零样本泛化",
      "扰动恢复",
      "端到端微调",
      "冻结路线",
      "规模抗遗忘",
      "多图推理",
      "5Hz 闭环"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "只凭文本的模型看不见桌上有什么；只判断当下可行动性的方法被眼前一步卡住，长程计划无法展开。",
      "figure": "./images/comic/palm-e-cover-old.png"
    },
    "newMethod": {
      "desc": "图像 / 状态 / 3D 场景表示被编码成语言空间 token，与文本交错进入预训练 LLM，自回归输出答案或高层子步骤，交由既有低层策略执行。",
      "figure": "./images/comic/palm-e-cover-new.png"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为何需要具身语言模型",
      "badge": "inf",
      "badgeLabel": "问题引入",
      "bridge": "本节先把问题立住：一个推理很强但看不见现场的模型，和一个只盯着眼前可行动作的方法，各自卡在哪。论文在 TAMP 具身问答与规划上对照了两类基线：未训练机器人数据的 PaLI 零样本表现很差；SayCan 式可行动性方法即便给了 oracle 可行性，也只能判断当前一步能不能做。理解这两类失败方式后，后续章节再讲 PaLM-E 如何把观测写进同一张多模态句子。这里先不展开模型结构，重点是看清“缺了什么”。全篇沿“问题动机 → 架构与编码 → 训练配方 → 迁移与规模证据 → 真机与评测”的顺序展开，本章同时给出反复出现的英文名称解释和一张全文脉络地图。",
      "analogy": {
        "title": "雾里看桌，只走一步",
        "text": "桌面被雾遮住、物体轮廓不清，手里只有一张文字纸条；眼前又只有一级空台阶，后面几步全卡住——<b>只凭文字</b>看不见桌上有什么，<b>只看一步</b>又排不出整段计划。类比只承载动机，不展示任何基准数字，也不否定可行动性方法本身的价值。",
        "figure": "./images/comic/palm-e-problem.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "两条旧路径，分别卡在哪",
          "desc": "点击切换两张旧路径卡片，体会两类基线的失败方式，再接受“需要把感知锚定进语言”这一动机。左侧是<b>只凭文本</b>的零样本视觉语言模型（未训机器人数据的 PaLI 式基线）：模型知道“去抓蓝块”这句话，却不知道蓝块在桌面哪个位置、桌上还有什么，零样本搬到机器人任务上答非所问。右侧是<b>只判断当下可行动性</b>的 SayCan 式方法：它只评估当前动作是否可行，信息不足以拼出有先后约束的长程操作。注意：这里只呈现两类方法各自的短板，并不否定可行动性方法本身的价值。",
          "componentId": "problem-baseline"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "英文名称速览与全文脉络",
          "desc": "先把本教程反复出现的英文缩写和论文对照方法解释清楚，再用一条路线看完整篇论文的章节安排：从问题动机到架构、编码、训练，再到迁移、规模与真机证据，最后收束于语言能力评测。",
          "componentId": "glossary-overview"
        }
      ],
      "insight": "要把语言推理用到具身任务上，模型得先“看见”现场，并且能把观测组织成可分步执行的计划；缺感知锚定（不知道物体在哪）和缺长程规划约束（只能看当前一步），是两类旧路径各自的病根。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题",
          "desc": "纯文本推理与现成 VLM 都没有把语言锚定到桌面、物体位置和机器人状态，词汇与现场物体之间缺少对应。"
        },
        {
          "icon": "🔧",
          "title": "短板",
          "desc": "可行动性方法只约束当下可行动作，给出“现在能不能做”，无法支撑有先后约束、需要多步回溯的长程规划。"
        },
        {
          "icon": "✨",
          "title": "动机",
          "desc": "PaLM-E 的出发点，是把感知观测锚定进语言，并支持把观测组织成长程分步指令，而不是只判断当前一步。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "架构总览：观测从哪进入模型",
      "badge": "inf",
      "badgeLabel": "方法概览",
      "bridge": "承接上一章的动机，本节给出整体架构地图：观测在哪进入、经过什么、从哪输出。先建立主干印象，编码器细节、多模态句子装配与训练配方分别在 §3、§4、§5 展开，本节不深入内部参数。Figure 1 是论文的核心架构图，先沿着“观测 → 编码器 token → PaLM → 高层输出”读一遍，再认出环绕四周的多类任务。",
      "analogy": {
        "title": "三类观测汇入同一条语言卷轴",
        "text": "照片、状态便签与 3D 网格三类观测，经引导汇入中央同一份语言卷轴，卷轴另一侧再分出步骤卡片——PaLM-E 把不同模态的观测收进同一份语言序列，由核心模型排出高层子步骤。卷轴上既有文字订单，也有现场观察到的观测条目，二者排在同一条序列里。",
        "figure": "./images/comic/palm-e-pass.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "从观测到高层指令的整体通路",
          "desc": "沿论文 Figure 1 走通“观测 → 编码器 token → LLM → 高层输出”的主干，认出环绕的多类任务。点击图中热点部件，查看它在通路中的角色。<b>读图顺序</b>：左侧以 emb、img 等占位符表示的观测先经编码器变成彩色 token，交错进入中央的 PaLM 大语言模型，右侧输出高层控制指令；四周环绕移动操作、任务运动规划、桌面操作、视觉问答/描述和纯语言任务，说明同一模型服务多类任务。<b>图注解读</b>：图中心是预训练 PaLM 语言模型，左侧各类观测经编码器转成与文本同序列的 token，右侧给出高层子步骤或文本答案；环绕图标对应具身规划、视觉问答、图像描述与纯语言任务。图中不含低层电机控制器，模型只发高层指令。",
          "componentId": "arch-overview",
          "figure": "./images/paper/fig-1.png"
        }
      ],
      "insight": "关键不是为机器人单独造一个新模型，而是让预训练语言模型直接接收多模态观测作为输入，在同一套参数里同时完成规划、问答与描述；观测接入的是语言序列，而不是另起一套机器人控制网络。",
      "takeaways": [
        {
          "icon": "🧭",
          "title": "主干",
          "desc": "观测经编码器变成 token，与文本交错进入预训练 PaLM，自回归生成答案或高层子步骤，通路方向是观测 → 编码 → LLM → 输出。"
        },
        {
          "icon": "🧩",
          "title": "统一",
          "desc": "同一套模型同时服务机器人规划、视觉问答、图像描述和纯语言任务，不需要为每类任务各训一个独立模型。"
        },
        {
          "icon": "📌",
          "title": "边界",
          "desc": "模型输出高层指令或文本答案，闭环执行交给既有低层策略，不直接驱动关节或电机。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "多模态句子与前缀条件",
      "badge": "both",
      "badgeLabel": "机制推导",
      "bridge": "上一章给出了架构地图，本节拆开最核心的一步：观测是怎样进入语言序列的，前缀又如何决定下一个词。先看清“观测不是拼成像素词表，而是编码成嵌入向量进入前缀”，再看概率形式如何写。论文 §3 把由文本与观测 token 交错构成的序列称为<b>多模态句子</b>（multimodal sentence），模型在这条句子上以前缀为条件自回归续写。",
      "analogy": {
        "title": "观测与文字串成同一条序列",
        "text": "文字卡片和彩色观测珠交错串在同一条轨道上；前缀里包含哪些观测，直接决定右端下一颗被点亮的珠子是什么。观测不是贴在文字旁边的照片，而是作为嵌入项直接排进这条序列。",
        "figure": "./images/comic/palm-e-insert.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "拖拽观测进入前缀，走一步自回归",
          "desc": "把观测卡片（图像 / 状态 / 3D 槽位）拖到文字行空位，点“下一步”推进一个自回归步，观察前缀条件下点亮的下一个 token。<b>对比两种状态</b>：前缀只有文字时输出笼统、指不到具体物体；插入图像等观测后，输出开始点名具体物体与子步骤。理解多模态句子与前缀条件概率：前缀 `w1:n` 交错文本与观测嵌入，续写遵循条件概率 `p(w_{n+1:L}|w1:n)`。<b>论文短引</b>：<em>“The multimodal tokens corresponding to these observations are interleaved with the text to form multi-modal sentences.”</em>（§3, p.4）释义：这些观测对应的多模态 token 与文本交错排列，构成多模态句子。示例序列：问题 “How to grasp the blue block?” 后接图像 token，模型续写 “First, grasp the yellow block and …”。",
          "componentId": "multimodal-sentence"
        }
      ],
      "insight": "跳过离散词这一层，把连续观测直接映射成语言空间向量，是这套模型能“读懂现场”的关键；前缀里的观测内容，直接约束了模型下一步能写出什么。观测进入的是嵌入序列，而不是把原始像素拼进词表。",
      "formula": {
        "lead": "语言模型按前缀条件逐词生成；整条序列是每个词条件概率的连乘，预测目标只是非前缀的文本 token。",
        "unicode": "Eq.1  p(w<sub>1:L</sub>) = ∏<sub>l=1</sub><sup>L</sup> pLM(w<sub>l</sub> | w<sub>1:l-1</sub>)　；　Eq.2  p(w<sub>n+1:L</sub> | w<sub>1:n</sub>) = ∏<sub>l=n+1</sub><sup>L</sup> pLM(w<sub>l</sub> | w<sub>1:l-1</sub>)",
        "symbols": [
          {
            "sym": "w_l",
            "desc": "序列中第 l 个 token，取自离散词表 W。"
          },
          {
            "sym": "W",
            "desc": "离散词表，本文 |W| = 256000。"
          },
          {
            "sym": "γ",
            "desc": "词嵌入映射 γ:W→X，把词映射到嵌入空间。"
          },
          {
            "sym": "x_i",
            "desc": "第 i 个嵌入向量，x<sub>i</sub> = γ(w<sub>i</sub>) ∈ R<sup>k</sup>。"
          },
          {
            "sym": "k",
            "desc": "语言嵌入空间维度。"
          },
          {
            "sym": "n",
            "desc": "前缀长度，w<sub>1:n</sub> 为条件前缀。"
          },
          {
            "sym": "pLM",
            "desc": "大型 Transformer 语言模型网络（公式中写作 pLM）。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔗",
          "title": "多模态句子",
          "desc": "观测嵌入与文本 token 交错排列，构成模型读取的同一条序列。"
        },
        {
          "icon": "➡️",
          "title": "前缀条件",
          "desc": "模型以前缀为条件自回归续写，前缀里的观测直接影响下一步输出。"
        },
        {
          "icon": "🧮",
          "title": "概率形式",
          "desc": "序列概率分解为条件概率连乘，预测目标只是非前缀的文本 token。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "四种编码器路线",
      "badge": "both",
      "badgeLabel": "机制推导",
      "bridge": "上一章讲了观测怎样进序列，本节回答“各类观测分别由什么表示、各自前提和局限是什么”。核心区别在是否依赖真值分割、数据量大小，以及对 3D 物体结构的要求；注意 GT 掩码路线与无监督槽位不是同一类方法，不能混为一谈。四条路线分别对应状态向量、ViT 图像、GT 物体中心分解与 OSRT 无监督槽位，下面逐格查看输入、映射与前提。",
      "analogy": {
        "title": "四类观测，四种登记容器",
        "text": "状态像一张手写便签，图像像一张照片卡，物体可按掩码分格托盘拆开，也可放进编号槽位盒；四种登记方式经各自投影汇入同一条语言序列，选哪种登记法取决于有没有真值分割、数据量和对 3D 结构的要求。下方热点可逐格查看映射与前提。漫画只类比登记方式，不承载真实网络结构或数字。",
        "figure": "./images/comic/palm-e-encoder-routes.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "选一条观测编码路线",
          "desc": "点击四张记录卡之一，查看其输入、到语言空间的映射、是否依赖真值掩码、局限与维度说明。四条路线分别为：状态向量经 MLP；图像经 ViT 再由仿射投影 ψ；GT 物体中心按实例掩码拆分；OSRT 无监督发现物体槽位。<b>前提区分</b>：GT 路线依赖真值实例分割（给定的物体掩码），OSRT 是无监督槽位、冻结槽位只训投影；ViT 输出维度 k̃ 不必等于语言维度 k。<b>不要混淆</b>：GT 掩码是有监督的真值分割，OSRT 是无监督发现的物体槽位，二者前提不同；图像级 ViT 编码不显式拆分单个物体。",
          "componentId": "encoder-select"
        }
      ],
      "insight": "同一条语言序列可以接多种观测表示，选择哪一种取决于真值分割可得性、数据量和对 3D 物体结构的要求；没有一种编码器在所有设定下都最优，路线选择本身就是一个设计决策。",
      "formula": {
        "lead": "四类观测接入语言空间的映射形式与维度如下；k（语言维度）与 k̃（ViT 维度）互不相等，ψ 是可学习投影。",
        "unicode": "状态 s ∈ R<sup>S</sup> → MLP → 语言空间；图像 I → x̃<sub>1:m</sub> = φ̃<sub>ViT</sub>(I) ∈ R<sup>m×k̃</sup> → ψ；GT 物体 x<sub>j</sub> = φ<sub>ViT</sub>(M<sub>j</sub>◦I)；OSRT 槽位 o<sub>j</sub> = φ̄<sub>OSRT</sub>(I<sub>1:v</sub>)<sub>j</sub> ∈ R<sup>k̄</sup> → ψ。",
        "symbols": [
          {
            "sym": "I",
            "desc": "输入图像（2D 观测）。"
          },
          {
            "sym": "φ̃",
            "desc": "ViT 视觉编码器（下标 ViT），输出 m 个特征 token。"
          },
          {
            "sym": "x̃",
            "desc": "ViT 输出的 m 个特征 token（x̃<sub>1:m</sub>），形状 R<sup>m×k̃</sup>。"
          },
          {
            "sym": "k̃",
            "desc": "ViT 输出嵌入维度，不必等于语言维度 k。"
          },
          {
            "sym": "ψ",
            "desc": "可学习仿射 / MLP 投影，把 ViT 特征投到语言维度。"
          },
          {
            "sym": "s",
            "desc": "场景状态向量，维度 S（位姿、尺寸、颜色等）。"
          },
          {
            "sym": "M",
            "desc": "第 j 个物体的真值实例掩码（M<sub>j</sub>）。"
          },
          {
            "sym": "o",
            "desc": "OSRT 第 j 个物体槽位向量（o<sub>j</sub>），∈ R<sup>k̄</sup>，是物体级向量而非单张图。"
          },
          {
            "sym": "k̄",
            "desc": "OSRT 物体槽位维度。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🗂️",
          "title": "状态向量",
          "desc": "最简单的状态 / 位姿 / 尺寸等向量，经 MLP 映射进语言空间。"
        },
        {
          "icon": "🖼️",
          "title": "视觉编码",
          "desc": "ViT 提图像特征，再由可学习投影 ψ 投到语言维度，维度不必一致。"
        },
        {
          "icon": "🧊",
          "title": "物体表示",
          "desc": "GT 掩码拆物体依赖真值分割；OSRT 用无监督槽位，冻结槽位只训投影。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "实体引用与训练配方",
      "badge": "trn",
      "badgeLabel": "训练方法",
      "bridge": "上一章选好了表示路线，本节补上两个落地细节：计划里怎样反复指到同一个物体，以及模型靠什么数据、按什么目标训练。先看实体引用如何锁定同款物体，再看损失口径、数据占比与两条微调路线的区别。训练样本由若干连续观测、一段文本和一个前缀索引组成，损失只算在作为预测目标的非前缀文本 token 上。",
      "analogy": {
        "title": "给同款物体编号",
        "text": "两块一样的方块靠颜色说不清，就给各自挂编号牌；计划里点编号，低层操作也照着编号找对应物件。旁边的训练手册区分保持不动的旧能力与一起微调的新参数。编号依赖已经由槽位或掩码给出的物体身份，而不是靠自然语言描述硬猜。",
        "figure": "./images/comic/palm-e-tag.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "打开实体引用，指到正确的同款物体",
          "desc": "切换实体引用开 / 关，点击任一方块查看其编号标签，读取计划中被引用的 obj<sub>j</sub>。无标记时同名同色物体无法区分，计划只能写“那块方块”，指向模糊；打开引用后，提示写成 “Obj 1 is &lt;obj1&gt;”、“Obj 2 is &lt;obj2&gt;”，计划用 obj<sub>j</sub> 锁定目标，低层策略也按同一 token 操作对应物体。前提：槽位 / 掩码已经提供物体身份；本模块不展示模型如何分割未见的杂乱场景。",
          "componentId": "entity-referral"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "训练配方：损失算在哪、两条路线怎么选",
          "desc": "在“冻结 LLM，只训编码器”与“端到端微调”两张路线卡之间切换，查看损失口径、混合数据占比与规模组合。损失只作用于预测目标文本 token，前缀（多模态句子）不算入交叉熵；完整混合数据仅 8.9% 为具身数据（采样频率占比，非样本条数比例）。<b>两条路线区别</b>：冻结路线语言模型权重不动、只训编码器与投影；端到端路线全部参数一起微调，语言能力保留情况随规模变化（见 §7）。规模组合：8B LLM + 4B ViT = 12B，62B + 22B = 84B，540B + 22B = 562B。<b>读 Table 6</b>：完整混合以通用视觉语言与文本数据为主（Webli 52.4%、VQ²A 13.1%、CC3M 13.1% 等），具身数据只有三行——真机移动操作 3.1%、Language-Table 仿真与真机 4.2%、TAMP 仿真 1.6%，合计 8.9%；这是采样频率占比，不是样本条数比例。",
          "componentId": "training-recipe",
          "figure": "./images/paper/tab-6.png"
        }
      ],
      "insight": "训练复用了预训练语言模型的能力，只在多模态句子上补观测接入与跨任务联合；是否解冻全部参数是一条明确的路线选择，两者更新范围不同，不能混为一谈。损失作用对象、数据口径与路线更新范围是三个要分开记的点。",
      "formula": {
        "lead": "每条样本由若干连续观测、一段文本和一个前缀索引组成；损失只算在作为预测目标的非前缀文本 token 上。",
        "unicode": "数据集 D = {( I<sub>i</sub><sup>1:u<sub>i</sub></sup>, w<sub>i</sub><sup>1:L<sub>i</sub></sup>, n<sub>i</sub> )}<sub>i=1</sub><sup>N</sup>；损失作用于 w<sub>n<sub>i</sub>+1:L<sub>i</sub></sub> 的平均交叉熵。",
        "symbols": [
          {
            "sym": "I",
            "desc": "第 i 个样本（I<sub>i</sub>）的 u<sub>i</sub> 个连续观测。"
          },
          {
            "sym": "w",
            "desc": "第 i 个样本（w<sub>i</sub>）的 L<sub>i</sub> 个文本 token。"
          },
          {
            "sym": "n",
            "desc": "第 i 个样本的前缀索引（n<sub>i</sub>）；目标为 w<sub>n<sub>i</sub>+1:L<sub>i</sub></sub>。"
          },
          {
            "sym": "L",
            "desc": "文本 token 总数（L<sub>i</sub>）；u<sub>i</sub> 为连续观测个数。"
          },
          {
            "sym": "obj",
            "desc": "实体引用特殊 token（obj<sub>j</sub>），在计划中指代第 j 个物体，低层策略也按同一 token 操作。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🏷️",
          "title": "实体引用",
          "desc": "用 obj<sub>j</sub> 在计划中锁定同款物体，低层策略按同一 token 操作。"
        },
        {
          "icon": "🎯",
          "title": "损失口径",
          "desc": "前缀是多模态句子，交叉熵只平均在预测目标文本 token 上。"
        },
        {
          "icon": "🔀",
          "title": "两条路线",
          "desc": "冻结 LLM 只训编码器，或端到端微调全部参数；规模组合按 12B / 84B / 562B 记录。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "跨域迁移与表示效率",
      "badge": "trn",
      "badgeLabel": "实验证据",
      "bridge": "上一章讲完训练配方，本节用论文报告的证据看联合训练是否带来迁移，以及哪类表示在低数据下更高效。证据图表是支撑，不替代 §3–§5 的机制模块；下列数值都只在其报告协议内成立，不能外推到未测量的任务。Figure 3 看跨域迁移，Figure 4 看五种训练条件下的规划成功率，两张图先分清前提再读数值。",
      "analogy": {
        "title": "共享花圃，移栽多盆都更稳",
        "text": "从同一个共享花圃长出的苗，移栽到不同任务的花盆里都长势更好——跨任务跨具身联合训练把视觉语言领域的能力迁到了具身决策。角落单独一盆瘦弱小苗，对应只在单一域训练的对比。类比只表达“见多类任务后单任务更稳”，不对应具体基准分数。",
        "figure": "./images/comic/palm-e-board.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "完整混合是否比单域训练更好",
          "desc": "在“单域数据”与“完整混合”之间切换，分组条按报告值生长；可切换任务组（TAMP / Language-Table / SayCan 可行动性）查看。<b>读图与结论</b>：Figure 3 分组柱对比 TAMP、Language-Table、SayCan 可行动性三类成功率，单域各管一段，完整混合（全部机器人 + 网络 VLI/VQA/COCO 等）三类都更高；下方三张小环境图对应不同具身形态。协议：TAMP 1% 数据，p1/p2 各 320 样本；低数据下 ViT-4B 规划较单一机器人训练翻倍以上。这是论文报告的对比，学习者操作不能推出未测量的提升，也不声称迁移在每个任务都成立。",
          "componentId": "transfer-evidence",
          "figure": "./images/paper/fig-3.png"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "读 Figure 4：五种训练条件的规划成功率",
          "desc": "选择一条横条，高亮并在面板读出其前提（预训练 / 冻结 / 微调、单机器人 / 完整混合）与成功率。<b>读图方式</b>：纵轴为规划成功率（越高越好），五条横条按原图顺序排列，先看训练前提再读百分比。<b>报告值</b>（1% 数据、12B、p1/p2 平均）：端到端微调完整混合 94.9%，微调单机器人 48.6%，未预训练 42.9%，冻结完整混合 74.3%，冻结单机器人 31.8%。结合 Tab 1，低数据下 OSRT 3D 物体表示最佳；预训练 LLM 在状态输入下更有帮助，62B 比 8B 分布外泛化更好，未预训练 LLM 基本没有分布外泛化。边界：Fig 4 展示 LLM 训练变体，OSRT 最佳结论来自 Tab 1，分开记录；OSRT 优势仅限该低数据设定，不外推到大规模视觉数据。",
          "componentId": "representation-evidence",
          "figure": "./images/paper/fig-4.png"
        }
      ],
      "insight": "迁移与表示效率都来自同一套跨任务联合训练与可选择的观测表示；证据只在其报告协议内成立，读图时要先分清前提条件（预训练与否、冻结或微调、单域或混合）再看数值。",
      "takeaways": [
        {
          "icon": "🚚",
          "title": "跨域迁移",
          "desc": "完整混合联合训练改善单任务表现，低数据 ViT-4B 规划翻倍以上。"
        },
        {
          "icon": "📊",
          "title": "条件差异",
          "desc": "预训练、完整混合、冻结 / 微调路径分别对应可辨识的成功率档位。"
        },
        {
          "icon": "🧊",
          "title": "低数据表示",
          "desc": "OSRT 3D 物体表示在低数据设定最佳；该结论不外推到大规模视觉数据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "通用视觉语言能力与规模遗忘",
      "badge": "both",
      "badgeLabel": "结果分析",
      "bridge": "上一章看具身与表示证据，本节把视野放回通用语言能力：模型是否仍是有竞争力的 V-L 模型，规模又如何影响灾难性遗忘。先看通用任务成绩（Tab 5 静态对照），再看 Figure 6 中规模档位与语言能力保留之间的关系。Figure 6 比较同规模 PaLM 与其继承权重的 PaLM-E 在 21 个 NLU/NLG 基准平均上的差距。",
      "analogy": {
        "title": "书摞越高，经典牌越稳",
        "text": "三摞由小到大的书代表规模档位，每摞旁立一面经典牌；书摞越大，经典牌越完整挺立——语言模型规模越大，变成具身代理后保留的语言能力越多。类比只表达“规模越大遗忘越轻”，图中百分比是相对退化、不是保留率。",
        "figure": "./images/comic/palm-e-chef.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "选规模档位，看语言能力相对退化",
          "desc": "选择规模档位（12B / 84B / 562B），查看对应 PaLM 与 PaLM-E 成对条与相对退化标注。<b>读图与口径提醒</b>：Figure 6 成对比较同规模 PaLM 基线与继承权重的 PaLM-E；这些是相对退化百分比、不是保留率；结论对应端到端微调路线，不套用到冻结 LLM 路线。相对退化：12B ≈ 87.3%，84B ≈ 61.6%，562B ≈ 3.9%（Fig 6 正文取整；Tab 8 明细 NLG delta 为 -3.8%，同为 562B 档）。协议：21 个 NLU/NLG 基准平均（Tab 8），相对退化 = PaLM 基线 − PaLM-E；趋势不外推到 562B 之后。",
          "componentId": "scale-forgetting",
          "figure": "./images/paper/fig-6.png"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "通用视觉语言模型成绩（Tab 5，静态对照）",
          "desc": "通用模型为同一检查点跨任务评测；任务专用微调模型各自使用单独微调检查点，两类成绩不混记。下表为 generalist 单 checkpoint 成绩，任务专用行单列、不计入通用检查点。协议：VQAv2 test-dev/test-std、OK-VQA val、COCO Karpathy test（描述）。562B 在 OK-VQA 验证集达到当时报告最高分；冻结路线在 VQAv2 上优于此前 Frozen 方法。读表时先区分“同一检查点通用模型”与“逐任务微调模型”，两类数字不能合并比较。<b>读 Table 5</b>：上半 Generalist（one model）为同一检查点跨任务评测，PaLM-E-12B 76.2 / 55.5 / 135.0，PaLM-E-562B 80.0 / 66.1 / 138.7；中间 Task-specific finetuned models 是逐任务单独微调的对照行，单列不计入通用检查点；底部 Generalist with frozen LLM 为冻结语言模型路线（PaLM-E-12B frozen 70.3 / 51.5 / 128.0）。OK-VQA 带 † 的 32-shot 行未微调。",
          "componentId": "generalist-evidence",
          "figure": "./images/paper/tab-5.png"
        }
      ],
      "insight": "扩大语言模型规模同时保住了通用语言能力，这是具身化少付语言代价的关键途径之一；但相对退化与保留率、端到端与冻结路线必须分开表述，不能把退化百分比说成保留率。",
      "takeaways": [
        {
          "icon": "🌐",
          "title": "通用能力",
          "desc": "同一 PaLM-E 检查点在 VQAv2、OK-VQA、COCO 描述上具备竞争力。"
        },
        {
          "icon": "📈",
          "title": "规模抗遗忘",
          "desc": "端到端微调下，规模越大相对语言退化越轻（87.3% → 61.6% → 3.9%）。"
        },
        {
          "icon": "⚠️",
          "title": "口径提醒",
          "desc": "退化是相对百分比、非保留率；通用与任务专用检查点成绩不可混记。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "真机应用、涌现与局限",
      "badge": "both",
      "badgeLabel": "应用与边界",
      "bridge": "最后回到核心方法在真机上的落地，诚实记录涌现观察与局限，收束整份教程。先看长程移动操作与扰动恢复，再区分哪些是论文已验证结果、哪些仍是开放问题。Figure 5 展示同一个 PaLM-E 模型指挥两台真机：厨房长程移动操作（含扰动恢复）与桌面单样本 / 零样本泛化样例。",
      "analogy": {
        "title": "机械臂报步，底盘闭环执行",
        "text": "上方机械臂只从步骤卷轴取下高层步骤卡，下方小型底盘完成闭环动作；被碰倒的小方块重新扶正，代表扰动恢复。模型不直接控制关节，低层闭环仍由既有策略在 5Hz 完成；类比不代表模型直接驱动电机。",
        "figure": "./images/comic/palm-e-call.png"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "跟着真机序列走完长程任务与扰动恢复",
          "desc": "上一步 / 下一步推进厨房长程序列，查看当前帧与子步骤卡；扰动步与恢复步高亮。<b>序列（共 7 步）</b>：走到抽屉前 → 拉开顶层抽屉 → 取出米饼 → 扰动（米饼被撞回抽屉）→ 重新取出米饼 → 递给用户 → 放下。模型输出高层子步骤，低层策略在 5Hz 闭环执行；桌面任务展示单样本（Move the remaining blocks to the group）与零样本（Move the green blocks to the turtle）泛化样例，属演示而非大样本统计基准。最大 562B 涌现多图与链式思维推理，训练提示只有单图样本，该能力只在最大模型上观察到。",
          "componentId": "real-robot-scene",
          "figure": "./images/paper/fig-5.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "已解决结果 vs 开放问题（静态复盘）",
          "desc": "左侧为论文已验证结果，右侧为论文自陈的开放问题；复盘板记录论文报告的局限，不评判未报告的未来工作，也不否定冻结路线在语言保留上的价值。注意：562B 的多图 / 链式思维是涌现观察，未经专门训练验证；OSRT 路线尚需结合大规模视觉数据；冻结 LLM、只训编码器路线偶尔在机器人任务吃力（集中在 Language-Table 少样本）。<b>读 Figure 2</b>：这是 562B 零样本多模态能力的样例拼图，包含视觉条件笑话、机器人感知对话、零样本链式思维、物理预测、空间定位、多图关系判断、端到端自我中心问答与 OCR-free 数学推理；这些样例训练提示只有单图，多图与 CoT 推理是在最大模型上观察到的涌现行为，属定性演示，不是专门训练验证的结论。",
          "componentId": "limitation-recap",
          "figure": "./images/paper/fig-2.png"
        }
      ],
      "insight": "这套方法把感知接入预训练语言模型、用一个模型覆盖多任务与迁移，但边界也写得清楚：低层执行、冻结路线短板、OSRT 数据规模与涌现验证都还留待后续；真机演示与定性样例不能当作大样本统计结论。",
      "takeaways": [
        {
          "icon": "🤖",
          "title": "真机落地",
          "desc": "同一模型指挥两台真机，输出高层子步骤，既有低层策略在 5Hz 闭环执行。"
        },
        {
          "icon": "🌱",
          "title": "涌现观察",
          "desc": "562B 出现多图与链式思维推理，训练仅有单图提示；属定性观察，非专门验证结论。"
        },
        {
          "icon": "🔍",
          "title": "诚实边界",
          "desc": "冻结路线偶有吃力、OSRT 待结合大规模视觉数据、涌现能力尚需专门验证。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "真机样例与表示对照图解",
      "badge": "both",
      "badgeLabel": "原图精读",
      "bridge": "承接上一章的真机演示，本节把论文里两类原图摊开读：一是 Language-Table 上 50 demos、单样本、零样本的长程操作样例与闭环频率；二是 TAMP 上不同输入表示的成功率对照。原图是证据载体，下列读数只在论文报告的协议与设定内成立，不替代前面的机制讲解。",
      "analogy": {
        "title": "样例摊开，逐格对照",
        "text": "把真机画面和表示对照表像卡片一样逐格摊开：先看每一格处在什么训练条件下，再读对应分数与动作，最后分清哪些是演示样例、哪些是统计结果。对照只帮助看清前提与数值，不把单格样例当成普遍结论。",
        "componentId": "figure-notes"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "读 Table 1：不同输入表示的 TAMP 对照",
          "desc": "对照原图逐行读输入表示与成功率。基线两行是 SayCan（oracle 可行动性）与 PaLI 零样本；PaLM-E 各行依次为 State（GT）两种、ViT + TL、ViT-4B single robot、ViT-4B full mixture、OSRT（no VQA）与 OSRT。列分为具身 VQA 的 q<sub>1</sub>–q<sub>4</sub> 与规划的 p<sub>1</sub>、p<sub>2</sub>。<b>报告值</b>：OSRT 行 99.7 / 98.2 / 100.0 / 93.7 / 82.5 / 76.2，在该低数据设定下为最有效的物体表示；State（GT）第二行 100.0 / 96.3 / 95.1 / 93.1 / 55.9 / 49.7。<b>边界</b>：OSRT 优势仅限该低数据设定，不外推到大规模视觉数据；GT 路线依赖真值实例掩码，OSRT 为无监督槽位，二者前提不同。",
          "componentId": "figure-notes",
          "figure": "./images/paper/tab-1.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "读 Figure 7：Language-Table 长程任务与泛化样例",
          "desc": "对照原图四行样例读训练条件与结果。<b>a) 50 demonstrations</b>：50 条演示下完成长程排序；<b>b) 1-shot learning</b>：单样本学习后把剩余方块归组；<b>c) zero-shot learning（new object pair）</b>：零样本面对新物体对，把红块移到咖啡杯；<b>d) zero-shot learning（unseen object）</b>：零样本操作未见物体（绿块移向乌龟）。每行中间都有 Adversarial disturbance（对抗扰动）后继续完成。右下角示意：PaLM-E 按长程目标在 1Hz 给出语言指令与重规划，机器人图像回传，低层策略在 5Hz 闭环执行动作。<b>边界</b>：这些是定性真机样例，不是大样本统计基准；1Hz 为重规划频率，5Hz 为低层闭环频率。",
          "componentId": "figure-notes",
          "figure": "./images/paper/fig-7.png"
        }
      ],
      "insight": "真机样例与表示对照共同说明：跨任务联合训练与合适的观测表示，能在少样本与零样本设定下支撑长程操作；但样例是定性演示，分数只在论文报告的设定内成立，不能外推到未测量的任务。",
      "takeaways": [
        {
          "icon": "🧊",
          "title": "表示对照",
          "desc": "低数据设定下 OSRT 3D 物体表示在 TAMP 上成功率最高；GT 掩码与无监督槽位前提不同，不可混为一谈。"
        },
        {
          "icon": "🎮",
          "title": "真机泛化",
          "desc": "Language-Table 样例覆盖 50 demos、单样本与零样本新物体对 / 未见物体，并在对抗扰动后恢复完成。"
        },
        {
          "icon": "🔁",
          "title": "闭环频率",
          "desc": "高层指令与重规划在 1Hz，低层策略在 5Hz 闭环执行；模型不直接驱动关节电机。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "语言评测明细与全章收束",
      "badge": "both",
      "badgeLabel": "原图精读",
      "bridge": "§7 用 Figure 6 柱状图看规模与灾难性遗忘的关系，本节补上其原始明细表 Table 8，看清 21 项 NLU/NLG 基准上的成对成绩与相对退化，最后收束整份教程。表中相对退化是百分比、不是保留率；端到端微调与冻结 LLM 路线分开表述。",
      "analogy": {
        "title": "明细对账，再收束全篇",
        "text": "把柱状图背后的明细表摊开逐项对账：先成对看同规模 PaLM 与 PaLM-E，再读平均项与相对退化，最后把前面各章的机制、证据与边界归拢成一张总图。对账只核对论文报告的数字，不追加未测量的结论。",
        "componentId": "figure-notes"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "读 Table 8：21 项 NLU/NLG 成对评测",
          "desc": "对照原图读六组成对模型：PaLM-8B、PaLM-E-12B（unfrozen）、PaLM-62B、PaLM-E-84B（unfrozen）、PaLM-540B、PaLM-E-562B（unfrozen），行为 21 项 1-shot 基准，分 NLG 与 NLU 两类。<b>平均项</b>：Avg NLU 64.7 / 55.0 / 72.3 / 69.2 / 78.2 / 78.5；Avg NLG 32.4 / 4.1 / 47.8 / 18.4 / 53.8 / 51.7。<b>相对退化（%，相对）</b>：NLU delta -15.0% / -4.3% / +0.4%，NLG delta -87.3% / -61.6% / -3.8%，对应 12B、84B、562B 三档。注：本表（Tab 8）明细 NLG delta 为 -3.8%，Figure 6 正文取整报 3.9%，二者同为 562B 档，不是两个不同数值。规模越大，端到端微调后的相对语言退化越轻；冻结 LLM、只训编码器路线的成绩与对应底层 PaLM 相同。<b>边界</b>：退化是相对百分比、非保留率；趋势不外推到 562B 之后。",
          "componentId": "figure-notes",
          "figure": "./images/paper/tab-8.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "全章收束：已验证结果与开放问题",
          "desc": "复盘板收束整份教程：左侧为论文已验证结果，右侧为论文自陈的开放问题。已验证部分包括单模型覆盖多任务、跨域迁移收益、规模抗遗忘与真机长程可完成；开放问题包括冻结路线偶有吃力、OSRT 待结合大规模视觉数据、涌现能力尚需专门验证，以及低层执行仍依赖既有策略。复盘只记录论文报告内容，不评判未报告的未来工作。",
          "componentId": "limitation-recap"
        }
      ],
      "insight": "扩大语言模型规模同时保住了通用语言能力，这是具身化少付语言代价的关键途径之一；读明细时要把相对退化与保留率、端到端与冻结路线分开，定性样例不能当作大样本统计结论。",
      "takeaways": [
        {
          "icon": "📊",
          "title": "成对明细",
          "desc": "Table 8 给出同规模 PaLM 与 PaLM-E 在 21 项 NLU/NLG 基准上的成对成绩与平均项。"
        },
        {
          "icon": "📈",
          "title": "规模抗遗忘",
          "desc": "端到端微调下规模越大相对语言退化越轻：NLG 退化 87.3% → 61.6% → 3.8%。"
        },
        {
          "icon": "🎯",
          "title": "口径收束",
          "desc": "退化是相对百分比而非保留率；通用与任务专用检查点、端到端与冻结路线成绩不可混记。"
        }
      ]
    }
  ]
};
