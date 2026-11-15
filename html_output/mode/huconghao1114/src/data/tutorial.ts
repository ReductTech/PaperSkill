import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Mitigating Intra- and Inter-modal Forgetting in Continual Learning of Unified Multimodal Models",
    "titleZh": "缓解统一多模态模型持续学习中的模态内与模态间遗忘",
    "venue": "NeurIPS 2025",
    "authors": "Xiwen Wei · Mustafa Munir · Radu Marculescu",
    "affiliation": "UT Austin · ECE",
    "domain": "持续学习 × 统一多模态生成",
    "coreProblem": "统一多模态模型按顺序学习新任务时，答题任务互相挤占（模态内遗忘），学答题还会毁掉画图能力（模态间遗忘）——以往的持续指令微调方法默认单一文本输出，各自只能缓解其中一类遗忘。",
    "coreInsight": "遗忘的载体是参数。与其用更聪明的约束去抑制两个模态的梯度冲突，不如把参数按模态切开——文本走 T-MoE、图像走 V-Adapter，让一阶冲突在结构上不可能发生（干扰 O(η)→O(η²)），再用冻结教师的知识蒸馏把视觉分支锚在原地。",
    "keywords": [
      "持续学习",
      "模态间遗忘",
      "参数解耦",
      "专家混合",
      "知识蒸馏"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "顺序微调·共享适配器：为答题拧参数，出图能力被顺手带坏——FID 52.13→56.12，文本对齐 0.2592→0.2162（表1）。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "MoDE·模态解耦+蒸馏锚定：文本走 T-MoE、图像走 V-Adapter，一阶冲突结构性消失（O(η)→O(η²)）——两块小适配器扛下全部改造。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "学新活，毁旧活",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "一台既会答题又会出图的相机，接了新订单，老订单的活却干砸了。本章用一条任务队列把「遗忘」量化出来，并建立 ACC、Fgt、FID 三个量尺。",
      "analogy": {
        "title": "接了新订单，老照片开始偏色",
        "text": "为了接<b>答题订单</b>拧动共用预设盘，墙上那张<b>风光样片</b>却悄悄偏了色——一台机身服务两种活，参数动一处，两头都受牵连。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "任务队列压力测试",
          "desc": "亲手逐单接下五个理解订单（论文图1的场景）：每个任务都有「最好成绩」和「最终成绩」两根条，落差就是遗忘；出图 FID 在收尾时恶化。<b>演示数据：SeqLoRA 顺序微调（表1、表2）</b>；零样本 FID 52.13 即同一骨干训练前的基线。",
          "componentId": "m11-queue",
          "figure": "./images/fig1.jpg"
        }
      ],
      "insight": "所有订单共用同一组参数——为答题拧参数，出图的活就被顺手改坏了；答题订单互相挤占则是另一回事。两种遗忘，从此分开统计。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "持续学习 = 按顺序接单",
          "desc": "学新单时看不到旧数据，还要兼顾老活——这正是灾难性遗忘的土壤。"
        },
        {
          "icon": "🔧",
          "title": "遗忘分两种",
          "desc": "模态内（答题互挤）与模态间（学答题毁出图）——后者是统一多模态模型特有的新问题。"
        },
        {
          "icon": "✨",
          "title": "三个量尺",
          "desc": "ACC 平均正确率（越高越好）、Fgt 平均遗忘（越低越好）、FID 生成质量（越低越好）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "统一骨架：图文走同一条序列",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一章的麻烦根源在「共用」。本章拆开机身看：图像被切成 token，和文本 token 混排在同一条序列里，理解与生成共用同一套参数——这正是遗忘的物理来源。",
      "analogy": {
        "title": "照片被裁成「字」，和字条排成一队",
        "text": "<b>图像被切成 token</b>，和文本 token 混排在同一条序列里——对机身来说，理解与生成都是「预测下一个 token」。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "交错序列观察台",
          "desc": "切换「理解 / 生成」两种模式，再点序列里的任意一个 token：右侧面板告诉你这个位置的<b>输入</b>与<b>预测对象</b>——两种活其实是同一个「预测下一个 token」。",
          "componentId": "m21-tokens"
        }
      ],
      "formula": {
        "lead": "两种活，一个损失写法——都是「给定前文，预测下一个 token」的对数似然。",
        "unicode": "<span class='fe-eq'><b class='fe-eq-tag'>式2 · 理解</b>max<sub>θ</sub> Σ<sub>i</sub> log p<sub>θ</sub>( X<sub>i</sub><sup>ans</sup> | X<sup>img</sup>, X<sup>ins</sup>, X<sub>&lt;i</sub><sup>ans</sup> )</span><span class='fe-eq'><b class='fe-eq-tag'>式3 · 生成</b>p( X<sup>img</sup> | X<sup>ins</sup> ) = ∏<sub>i</sub> p<sub>θ</sub>( X<sub>i</sub><sup>img</sup> | X<sup>ins</sup>, X<sub>&lt;i</sub><sup>img</sup> )</span>",
        "symbols": [
          {
            "sym": "θ",
            "desc": "模型参数——理解与生成共用同一套，这正是干扰的物理载体。"
          },
          {
            "sym": "X",
            "desc": "token 序列：上标 img 表示图像 token（由分词器把图切成离散格），ins 表示指令/提示，ans 表示答案。"
          },
          {
            "sym": "Σ",
            "desc": "对答案序列每个位置求和：理解任务的损失是答案段的交叉熵（式2）。"
          },
          {
            "sym": "∏",
            "desc": "连乘：生成把整张图拆成 L 个图像 token 逐个预测（式3），拼满后解码成片。"
          },
          {
            "sym": "p",
            "desc": "模型预测「下一个 token」的概率——两种模式唯一的区别是预测哪种 token。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "统一 = 一条序列一套参数",
          "desc": "同一条混排序列、同一套 transformer 参数、同一种「下一 token 预测」。"
        },
        {
          "icon": "🔧",
          "title": "图像先被切成 token",
          "desc": "分词器把图变成离散 token，生成完再用解码器还原成片；文本侧同理。"
        },
        {
          "icon": "✨",
          "title": "共用是双刃剑",
          "desc": "共用参数是效率的来源，也是两类遗忘共同的物理根源。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "两类遗忘，一一看清",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "「共用参数」只是推测，得先证实两类遗忘都真实存在。本章把两张现场证据摆上看片灯箱：图1 的成绩落差，与图2 的「车画成建筑」。",
      "analogy": {
        "title": "拧一格参数，两支样片一起受伤",
        "text": "同一格参数，既挤掉了<b>老客户的合影水准</b>（模态内），又带偏了<b>自家的风光创作</b>（模态间）——两种遗忘常被混为一谈，其实是两件事。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "现场证据台",
          "desc": "用论文图2的原片逐任务观察「提示没变、画面变了」：下方四档 chips 对应预训练与三个 VQA 任务，左区灯箱里同一提示的四张样片逐渐偏色，右侧读出提示词 “A photo of a car” 的 <b>CLIP 对齐分</b>（图2标注值；右下 0.15 参考线是教学设定，论文并无此阈值）。",
          "componentId": "m31-degrade",
          "figure": "./images/fig2.jpg"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "遗忘分类器",
          "desc": "四个真实案例（数字全部来自论文表1、表2、图2），给每个案例贴上<b>模态内 / 模态间</b>的标签——判别标准只有一条：被毁的能力与被训练的能力是否同属一个输出模态。",
          "componentId": "m32-classify"
        }
      ],
      "insight": "判断遗忘种类只问一件事：被毁的能力和被训练的能力，在不在同一个输出模态——同模态是模态内，跨模态是模态间。",
      "formula": {
        "lead": "「平均遗忘」怎么算？把每个任务「历史最好成绩」与「最终成绩」的落差平均一下。",
        "unicode": "<span class='fe-eq'><b class='fe-eq-tag'>指标定义</b>Fgt = (1/S) Σ<sub>τ</sub> ( best<sub>τ</sub> − final<sub>τ</sub> )</span>",
        "symbols": [
          {
            "sym": "S",
            "desc": "任务总数——主表 S=5（四个 VQA 数据集 + ImageNet 分类）。"
          },
          {
            "sym": "τ",
            "desc": "第 τ 个任务的编号。"
          },
          {
            "sym": "best",
            "desc": "任务 τ 在整个持续学习过程中的最好准确率（表2 上行）。"
          },
          {
            "sym": "final",
            "desc": "学完全部任务后任务 τ 的最终准确率（表2 下行）。"
          },
          {
            "sym": "Fgt",
            "desc": "平均遗忘，越低越好——但它隐瞒「没学会」的情况，§10 会揭穿这个口径陷阱。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两张表分工",
          "desc": "模态内遗忘看「理解列掉分」，模态间遗忘看「生成列退化」——评测上就是两张不同的表。"
        },
        {
          "icon": "🔧",
          "title": "图2 是铁证",
          "desc": "提示词不变，car 却画成了建筑，CLIP 分从 0.3422 一路掉到 0.1458。"
        },
        {
          "icon": "✨",
          "title": "Fgt 有盲区",
          "desc": "Fgt 是「最好 − 最终」的平均；它测不了「从头就没学会」的情况。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "梯度冲突：把拉扯写成公式",
      "badge": "both",
      "badgeLabel": "理论+方法",
      "bridge": "机身背面有一枚共用的参数环。本章把它拆下来放在灯箱底下：两个模态的梯度落在同一组参数上、方向相反时，一步更新会在数学上发生什么？这是全文的理论核心。",
      "analogy": {
        "title": "两个方向一打架，指针就进红区",
        "text": "参数环上，<b>答题要拧的方向</b>与<b>出图需要的方向</b>夹角一旦超过 90°，这一步更新就在帮倒忙——这就是模态梯度冲突。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "梯度方向盘",
          "desc": "拖动蓝色箭头（文本梯度 g<sub>t</sub> 的方向），右侧实时分解视觉损失的变化量。<b>演示用单位化假设</b>：‖g‖=1、H<sub>v</sub>=I、η=0.1，便于看清一阶/二阶项的相对大小。",
          "componentId": "m41-dial"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "步长旋钮",
          "desc": "固定冲突夹角 120°（cos = −0.5），拖动学习率 η：一阶项线性增长、二阶项平方增长——步长越小，二阶项衰减越快、一阶干扰就越主导；把它归零靠的是 §5 的参数解耦，不是调 η。二阶项按 λ<sub>max</sub>=2 的演示设定计算。",
          "componentId": "m42-eta"
        }
      ],
      "insight": "遗忘不是玄学：在足够小的步长下，两个梯度内积为负时，一步普通更新就会抬高另一个模态的损失，量级 O(η)。",
      "formula": {
        "lead": "文本方向走一步，视觉损失变化多少？二阶泰勒展开给出两项：一项看两个梯度的内积，一项看曲率。",
        "unicode": "<span class='fe-eq'><b class='fe-eq-tag'>式1 · 命题1</b>ΔL<sub>v</sub> = −η⟨g<sub>t</sub>, g<sub>v</sub>⟩ + (η²/2)·g<sub>t</sub><sup>T</sup> H<sub>v</sub> g<sub>t</sub></span>",
        "symbols": [
          {
            "sym": "ΔL",
            "desc": "一步更新后视觉（生成）损失的变化量——为正就是遗忘发生了。"
          },
          {
            "sym": "η",
            "desc": "学习率：一步走多远。一阶项量级 O(η)，二阶项量级 O(η²)。"
          },
          {
            "sym": "g",
            "desc": "梯度向量：g_t 是答题想拧的方向，g_v 是出图需要的方向（命题1，式1）。"
          },
          {
            "sym": "⟨·,·⟩",
            "desc": "欧氏内积：为负（夹角>90°）就是模态梯度冲突（定义1）。"
          },
          {
            "sym": "H",
            "desc": "视觉损失的 Hessian（曲率）——决定二阶项的大小与方向。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "冲突看内积",
          "desc": "⟨g_t, g_v⟩ < 0 即冲突；在足够小的步长下，冲突的一步更新必然抬高视觉损失。"
        },
        {
          "icon": "🔧",
          "title": "量级差一个 η",
          "desc": "一阶项 O(η)、二阶项 O(η²)——小步长下前者主导一切。"
        },
        {
          "icon": "✨",
          "title": "错的是结构",
          "desc": "优化器没做错什么：错的是两个模态在同一组参数上各有各的方向。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "解耦：让冲突不可能发生",
      "badge": "both",
      "badgeLabel": "理论+方法",
      "bridge": "墙上的共用预设板就是麻烦本身。最直接的对策不是抑制冲突，而是让它无处发生——把板沿中缝拆成两块，参数按模态切开、各自划归所有权。",
      "analogy": {
        "title": "把一块板拆成两块，灯光互不打扰",
        "text": "参数一<b>分开</b>，答题的调整就再也传不到出图那边——不是压制冲突，而是让冲突<b>无处发生</b>。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "拆分方案选择器",
          "desc": "四种参数安排逐个切换，左看「一阶冲突有/无」，右读已验证成绩（表1、表9）：共享专家是反面教材，解耦是抗遗忘的主体。",
          "componentId": "m51-split"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "正交性证明器",
          "desc": "三步走完命题2的骨架：共享参数 → 拆分块 → 内积归零；论文附录B 用跨模态梯度余弦分布做了同向实证（ScienceQA 上 MoDE 全为 0）。注意「一阶项消失」不是被压制变小，而是<b>结构性不存在</b>。",
          "componentId": "m52-ortho"
        }
      ],
      "insight": "与其设计更聪明的约束去抑制冲突，不如让冲突在结构上不可能发生——把优化问题降级成「划分参数所有权」。",
      "formula": {
        "lead": "参数块不相交时，文本更新对视觉损失的干扰只剩一个能写出来的上界。式里出现两处 φ 并非笔误——它们指同一块 T-MoE 参数：λ_max 量的是视觉损失沿 φ 方向的曲率，范数项量的是文本梯度在 φ 上的大小。",
        "unicode": "<span class='fe-eq'><b class='fe-eq-tag'>式9 · 命题2</b>ΔL<sub>v</sub> = (η²/2)·λ<sub>max</sub>(∇²<sub>φφ</sub>L<sub>v</sub>)·‖∇<sub>φ</sub>L<sub>t</sub>‖² = O(η²)</span>",
        "symbols": [
          {
            "sym": "φ",
            "desc": "T-MoE 的参数块——只服务文本 token。"
          },
          {
            "sym": "ψ",
            "desc": "V-Adapter 的参数块——只服务图像 token，与 φ 不相交（支撑集正交）。"
          },
          {
            "sym": "λmax",
            "desc": "视觉损失在 φ 方向上曲率的最大特征值：最坏情形的放大系数。∇²<sub>φφ</sub> 的双下标表示对 φ 求二阶偏导（黑塞矩阵），不是两个不同的参数块。"
          },
          {
            "sym": "‖·‖²",
            "desc": "向量长度的平方：文本梯度落在自己参数块内的能量——与上一项（曲率）相乘，即得一步更新造成的干扰上界。"
          },
          {
            "sym": "O(η²)",
            "desc": "量级记号：步长的平方级——命题2（式9），比耦合情形的 O(η) 小一个数量级。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "所有权代替约束",
          "desc": "内积恒为 0 不是「冲突变小」，而是「冲突不可能发生」——两种性质。"
        },
        {
          "icon": "🔧",
          "title": "共享专家是反面教材",
          "desc": "跨模态共享同一组专家，干扰面更大——MoE-LoRA 的 FID 65.16 比朴素 SeqLoRA 的 56.12 还差；§8 的「6 支更好」在解耦架构内，两者不矛盾。"
        },
        {
          "icon": "✨",
          "title": "解耦 ≠ 完事",
          "desc": "解耦只管跨块冲突；单个适配器内部的漂移，下一章用蒸馏来锚。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一张混排订单的前向旅程",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "参数块分开了，一张图文混排的订单到底怎么在机身里走？本章跟着它走一遍：按 token 模态拆分、各走各的适配器、按原位置拼回——骨干全程冻结。",
      "analogy": {
        "title": "混排订单进门，先按模态分流",
        "text": "序列里的<b>字条</b>走答题预设槽，<b>底片格</b>走出图预设槽——处理完按原位置拼回，机身本体一个参数都不动。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "前向流水灯",
          "desc": "五步走完一次前向：进入 → 按模态拆分 → V-Adapter 处理图像股（式5）→ T-MoE 处理文本股（式8）→ 拼回输出。灰色骨干带始终挂着<b>冻结</b>锁标。",
          "componentId": "m61-forward"
        }
      ],
      "formula": {
        "lead": "两股序列各用一条前向式——图像股是普通 LoRA（式5），文本股是带门控的专家加权（式8）。",
        "unicode": "<span class='fe-eq'><b class='fe-eq-tag'>式5 · V-Adapter</b>f(h) = hW<sup>T</sup> + (α/r)·hA<sup>T</sup>B<sup>T</sup></span><span class='fe-eq'><b class='fe-eq-tag'>式8 · T-MoE</b>f(h) = hW<sup>T</sup> + (α/r)·Σ<sub>j</sub> g<sub>j</sub>(x)·hA<sub>j</sub><sup>T</sup>B<sub>j</sub><sup>T</sup></span>",
        "symbols": [
          {
            "sym": "W",
            "desc": "冻结的骨干线性层权重——前向第一项，永不更新。"
          },
          {
            "sym": "h",
            "desc": "一个 token 的隐状态。"
          },
          {
            "sym": "A, B",
            "desc": "LoRA 的两个低秩矩阵，秩 r=8；ΔW=(α/r)BA（式4）。"
          },
          {
            "sym": "α/r",
            "desc": "缩放系数与秩的比值：控制低秩修正的整体强度。"
          },
          {
            "sym": "gj(x)",
            "desc": "门控给第 j 支专家的权重（softmax，和为 1）——T-MoE 按 token 加权 4 支专家；定义式见 §8 式6。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "前向五步",
          "desc": "进入 → 按模态拆分 → 各走各的适配器 → 按原位置拼回 → 输出。"
        },
        {
          "icon": "🔧",
          "title": "冻结骨干的意义",
          "desc": "省算力只是顺带——要保住的是预训练换来的跨模态对齐，一旦被改写就回不来。"
        },
        {
          "icon": "✨",
          "title": "推理不分任务",
          "desc": "推理无需任何任务标签——两股适配器的结构分工本身就承担了区分。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "训练目标：两套损失，一支锚",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "解耦挡住了跨参数块的冲突，但出图预设自己内部，学理解与保出图仍在抢同一块参数——需要一个「锚」：每次出片都对照出厂样片册，这就是知识蒸馏。",
      "analogy": {
        "title": "每拍一张，就对照一次出厂样片",
        "text": "V-Adapter 学着<b>看懂图</b>的同时，用<b>蒸馏</b>把自己的分布拴在冻结教师身上——偏差大，就往回拉一点。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "λ 权衡台",
          "desc": "拨动蒸馏权重 λ（松手吸附到论文表5 的四个验证点）：左看「对照样片册的松紧」，右读理解 ACC 与出图 FID 的变化——四个验证点的成绩并非单调，λ=0.3 是论文按整体最优的选定（表5）。",
          "componentId": "m71-lambda"
        }
      ],
      "insight": "解耦管跨块冲突，蒸馏管块内漂移——V-Adapter 既要学理解又别忘出图，唯一办法是时时对照冻结教师的分布。",
      "formula": {
        "lead": "蒸馏损失 = 教师与学生对同一段图像 token 的软化分布做 KL 对齐；总目标按适配器分两套（式10、式11、式12）。",
        "unicode": "<span class='fe-eq'><b class='fe-eq-tag'>式10 · 蒸馏</b>L<sub>KD</sub> = β²·Σ<sub>i</sub> KL( Softmax(z<sub>i</sub><sup>T</sup>/β) ‖ Softmax(z<sub>i</sub><sup>S</sup>/β) )</span><span class='fe-eq'><b class='fe-eq-tag'>式12 · 总目标</b>L<sub>V-Adapter</sub> = L<sub>CE</sub> + λ·L<sub>KD</sub></span>",
        "symbols": [
          {
            "sym": "z",
            "desc": "教师（上标 T，冻结预训练模型）与学生（上标 S，带 V-Adapter）对第 i 个图像 token 的 logits。"
          },
          {
            "sym": "β",
            "desc": "蒸馏温度（=2.0）：温度越高分布越平缓，学生能学到「哪些近似答案也沾边」的暗知识。"
          },
          {
            "sym": "KL",
            "desc": "KL 散度：两个分布的差距——对齐的是分布，不是单个标签。"
          },
          {
            "sym": "β²",
            "desc": "标准写法：抵消温度对梯度幅度的缩放。"
          },
          {
            "sym": "λ",
            "desc": "蒸馏权重（=0.3）：锚的松紧，表5 给出四个验证点的权衡。"
          },
          {
            "sym": "LCE",
            "desc": "答案的交叉熵——理解侧的学习信号（式11 里 T-MoE 只用它）。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "解耦 + 锚定是一组配方",
          "desc": "解耦管跨块冲突，蒸馏管块内漂移——两个组件不可互替。"
        },
        {
          "icon": "🔧",
          "title": "锚只加在 V-Adapter",
          "desc": "T-MoE 要学新任务，加锚会限制可塑性；V-Adapter 的任务恰恰是「别退化」。"
        },
        {
          "icon": "✨",
          "title": "参考数据不需要旧任务",
          "desc": "只要一小批覆盖旧分布的通用图像（LAION-5B），就能把生成分布锚在原地。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "MoDE 架构：不对称的设计",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "双板分挂只是骨架，两块板上插的「预设」并不对称——文本多专家、图像单适配，各花各的预算。点开架构图上的每个组件，看清它为什么存在。",
      "analogy": {
        "title": "答题板四扇窗，出图板一扇门",
        "text": "文本要在多个答题任务间切换，才配得上<b>专家分工</b>；出图只有「画得对」一个目标，<b>一支预设</b>足够——预算花在需要的地方。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "MoDE 架构地图",
          "desc": "点组件（或用下方等价按钮）看职责，切「答题流 / 出图流 / 训练更新流」看路径——训练流里注意：梯度只流向两块适配器，教师虚线只把蒸馏信号送进 V-Adapter。",
          "componentId": "m81-arch"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "专家数选择器",
          "desc": "T-MoE 的专家数在 2 / 4 / 6 之间切换（论文表7）：6 支的数字其实更好，论文选 4 是<b>性能与算力的折中</b>——读超参要看消融表。",
          "componentId": "m82-experts"
        }
      ],
      "insight": "参数预算花在需要的地方：答题要在多个任务间切换，才需要专家分工；出图只有一个目标，一支预设足够。",
      "formula": {
        "lead": "门控就是一个小 softmax：给每个 token 一份「专家用量表」（式6）。",
        "unicode": "<span class='fe-eq'><b class='fe-eq-tag'>式6 · 门控</b>g<sub>j</sub>(x) = softmax( x·W<sub>g</sub> )<sub>j</sub></span>",
        "symbols": [
          {
            "sym": "x",
            "desc": "当前 token 的表示——路由的输入。"
          },
          {
            "sym": "Wg",
            "desc": "可训练门控矩阵（d_in × n）：打分谁该多干活。"
          },
          {
            "sym": "softmax",
            "desc": "归一化：n 个权重非负且和为 1——软路由，每个专家都分一点。"
          },
          {
            "sym": "gj(x)",
            "desc": "第 j 支专家分到的权重，决定它在 ΔW 里的占比（式7/式8）。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "不对称是刻意的",
          "desc": "文本多专家管「多任务切换」，图像单适配管「一专两用」——不是实现差异，是预算分配。"
        },
        {
          "icon": "🔧",
          "title": "轻量是结构红利",
          "desc": "相对 MoELoRA（表13）：训练时间 +5.0%（440.3 vs 419.2ms）、峰值显存 +12.9%（84.98 vs 75.27GB）、可训练参数 0.0211% 略高于 0.0171%——收益来自结构，不靠堆参数。"
        },
        {
          "icon": "✨",
          "title": "默认 ≠ 最优",
          "desc": "6 支专家成绩更好（ACC 34.90，表7），4 支是算力折中——读超参要看消融。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "消融与双向验证",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "三件设备装好了，进验收间逐个断电测试：谁在管什么？再换个训练方向试一遍——「只是碰巧护图」的解释能不能堵死？",
      "analogy": {
        "title": "三件套逐个验收，缺一不可",
        "text": "<b>解耦</b>挡跨块冲突，<b>路由</b>拉理解分数，<b>蒸馏</b>为出图质量付账——消融表里各管一段。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "组件开关台",
          "desc": "五种配置（表3、表9）逐个切换：左看三盏灯（解耦 / 路由 / 蒸馏）亮了哪几盏，右读 ACC、Fgt、FID 三根条——每个组件的边际贡献自己算。",
          "componentId": "m91-ablation"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "双向验证对比器",
          "desc": "一次启动，左右两栏同时跑：左栏「学答题 → 测出图」（表1），右栏「学生成 → 测答题」（表10，附录F）——保护永远落在<b>没被训练的那个模态</b>上。",
          "componentId": "m92-reverse"
        }
      ],
      "insight": "解耦 + 锚定是一组配方：只解耦会漂，只锚定会僵——附录E.3 的失败样本正是「共享专家不解耦却加 KD」。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "会读消融表",
          "desc": "解耦是抗遗忘主体，MoE 路由拉准确率，KD 救生成质量——三件套缺一不可。"
        },
        {
          "icon": "🔧",
          "title": "反例最有信息量",
          "desc": "给共享专家的 MoE 类基线加 KD：图像变好但理解下降（MoELoRA 33.01→30.07，表8，单次运行），论文据此提出不解耦时 KD 会「锁死」教师特征；朴素 LoRA+KD 则两项都改善（56.12→52.83、28.43→30.81）——结论依赖基线结构。"
        },
        {
          "icon": "✨",
          "title": "机制是对称的",
          "desc": "学生成伤理解同样成立：LoRA 把 ImageNet 打到 0.00，MoDE 保住 16.61（零样本 16.53，表10）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "验收：主表、口径与边界",
      "badge": "both",
      "badgeLabel": "结果+方法",
      "bridge": "年终评审：七本影集在主表（Chameleon，5 任务，三次运行取平均）同台交卷；五种指标任意切换——谁同时在三条线上不落后？再练一次「先查口径再下结论」。",
      "analogy": {
        "title": "年终评审，五本影集同台",
        "text": "同一条任务队列、同一套指标，五家方案一起交卷——<b>谁同时在三条线上不落后</b>，章就盖给谁。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果赛跑",
          "desc": "按「开始评审」让全部方法在所选指标上同轴生长（表1，三次运行平均）：ACC / Fgt / FID / 文本对齐 / 图像对齐五个口径任切。",
          "componentId": "m101-race"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "指标口径警示台",
          "desc": "两个经典口径陷阱，各练一次：A）DualPrompt 的 Fgt=6.82 为什么有误导（表2）；B）FID 低为什么 ≠ 听提示（表1 的文本对齐列）。",
          "componentId": "m102-metric"
        }
      ],
      "insight": "读遗忘类论文的三个习惯：先查指标口径，再看峰值准确率，最后核对适用架构。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "一句话记住 MoDE",
          "desc": "参数按模态切开，让冲突结构性消失；蒸馏把视觉分支拴在教师身边——理解能学，出图不丢。"
        },
        {
          "icon": "🔧",
          "title": "战绩与差距",
          "desc": "主表同时拿到最高 ACC 33.47 与持续学习方法里最低的 FID 53.74（零样本 52.13 仍更低），ACC 距逐任务上界 57.32 尚差 23.85 分；换字母序任务也稳健（表6：ACC 36.68）；Janus-Pro 上优势更大（53.02 vs 43.18，表11），六任务序列优势收窄到 0.09（表12）。"
        },
        {
          "icon": "✨",
          "title": "适用边界（论文自述）",
          "desc": "只适用自回归 transformer 型 UMGM，非自回归（如扩散+MLLM 拼接）不适用（NeurIPS 检查表第 2 条）；骨干容量越大收益越大（Janus-Pro 上 ACC +9.84，表11）。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV11V411s7LJ",
      "title": "李宏毅机器学习2021：终身学习（灾难性遗忘）",
      "reason": "广度概览：灾难性遗忘与持续学习对策的经典中文课（唯一主题完全对口的入门课，播放量不足1万但主题唯一相关）。",
      "cover": "https://i2.hdslb.com/bfs/archive/969299008ea59242e009833f340d0293b196e9d5.png",
      "views": "9910播放"
    },
    {
      "bvid": "BV17i421X7q7",
      "title": "LoRA是什么？5分钟讲清楚LoRA的工作原理",
      "reason": "方法深潜：LoRA 低秩适配正是 MoDE 全部适配器的构件。",
      "cover": "https://i0.hdslb.com/bfs/archive/ae6c459c1615f63840aead1bc8d820a856036e91.jpg",
      "views": "23.0万播放"
    },
    {
      "bvid": "BV1vw4m1k78r",
      "title": "什么是混合专家模型（MoE）？",
      "reason": "实现视角：T-MoE 专家路由的思想来源。",
      "cover": "https://i0.hdslb.com/bfs/archive/b359b65ca8ccf34973db8a6e85ed3ac6b5569f85.jpg",
      "views": "5.4万播放"
    },
    {
      "bvid": "BV1o7TizwENj",
      "title": "知识蒸馏：超详细的论文讲解和代码复现教程",
      "reason": "相关延伸：V-Adapter 的 KD 锚定组件。",
      "cover": "https://i2.hdslb.com/bfs/archive/4c93a74ed6270e944645a17cdb202dbacbf18ae0.jpg",
      "views": "40.6万播放"
    }
  ]
};
