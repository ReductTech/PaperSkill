import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "MambaPSA: A Mamba-based Replacement for C2PSA in YOLO26",
    titleZh: "MambaPSA：用 Mamba 替换 YOLO26 中的 C2PSA 模块",
    venue: "arXiv 预印本 · 2026",
    authors: "Sheng-Wei Chan、Chia-Min Lin、Hsin-Jui Pan、Ching-Yu Tsai、Chih-Hsiang Yang、Yung-Che Wang、Jen-Shiun Chiang",
    affiliation: "台湾淡江大学电机工程学系",
    domain: "计算机视觉 · 目标检测 · 状态空间模型 · 轻量化网络",
    coreProblem: "YOLO26 主干末尾的 C2PSA 块用自注意力做全局聚合，计算量随 token 数量平方增长，轻量边缘设备难以负担。",
    coreInsight: "把平方复杂度的自注意力换成线性复杂度的选择性扫描（Mamba）：外壳仍是 C2PSA 的 CSP 结构，内部换成 Mamba 核心，参数几乎不变，同时减少 FLOPs、加快 CPU 推理，精度基本不损失。",
    keywords: ["目标检测", "YOLO26", "状态空间模型", "Mamba", "轻量化网络"]
  },
  hero: {
    oldMethod: {
      desc: "C2PSA 自注意力：token 越多，要打的分数越多（N²），CPU 上约 <b>17 FPS</b>。",
      componentId: "hero-contrast"
    },
    newMethod: {
      desc: "MambaPSA：一次线性扫描 + 隐状态记忆，CPU 约 <b>20 FPS</b>，参数 <b>−2.9%</b>、FLOPs <b>−12.1%</b>。",
      componentId: "hero-contrast"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "论文速览：一分钟看懂 MambaPSA",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "C2PSA 在 YOLO26 主干末尾用自注意力做全局聚合，计算量随 token 数平方增长；MambaPSA 保留其 CSP 外壳，内部换成线性复杂度的选择性扫描——参数几乎不变，FLOPs 更低、CPU 推理更快，精度基本不损失。颈部再接入双向 BiViM 补全两侧上下文。",
      analogy: {
        title: "先看全貌，再翻细节",
        text: "读论文像整理书架：<b>先把整排书的归位看一遍</b>，再逐本细读。图里就是整条网络的骨架。",
        figure: "/images/net-struct.svg",
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "论文速览动画：一分钟看懂 MambaPSA",
          desc: "把全文串成一条完整叙事线：引言 → 问题 → Mamba 思路 → MambaPSA 块 → BiViM → 实验结果 → 结论。",
          componentId: "paper-summary"
        },
        {
          kind: "module",
          id: "1.2",
          title: "真实推理体验：在浏览器里跑 MambaPSA 与基线",
          desc: "把官方仓库的 MambaPSA 与 C2PSA 基线权重导出成 ONNX，用 onnxruntime-web 在浏览器里直接推理，实时对比两个模型的检测框与耗时。",
          componentId: "web-infer"
        }
      ],
      takeaways: [
        { icon: "", title: "速览覆盖全文", desc: "动画把全文串成一条完整叙事线，一分钟建立整体印象；后续章节再逐段展开。" },
        { icon: "", title: "章节逐一展开", desc: "后续章节逐条把这根主线拆开讲细，可随时对照速览回看所处位置。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "YOLO26 的主干：CSP 结构与 C2PSA 块",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "这篇论文改动的是 YOLO26 主干末尾的 C2PSA 块，它建立在 CSP（跨阶段部分连接）结构之上。C3k2 把特征按通道拆分、一半精修一半恒等、再拼接合并；SPPF 汇集多尺度特征；C2PSA 内部则以位置敏感自注意力做全局聚合。",
      analogy: {
        title: "分头整理，再并回一排",
        text: "CSP 块的做法：把一排书<b>分成两半</b>，一半送去精修，一半保持原样，最后<b>并回同一排</b>。计算量得以减少，信息却不丢失。YOLO26 主干的 C3k2 块正是如此构造。",
        componentId: "yolo26-ana"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "C3k2 块里：拆两半 → 精修 → 并回",
          desc: "CSP 块内部：输入、按通道拆分、一半经 Bottleneck 精修、一半恒等映射，再拼接投影回原通道。",
          componentId: "yolo26-m1"
        },
        {
          kind: "module",
          id: "2.2",
          title: "Bottleneck 内部：两次 3×3 卷积 + 残差",
          desc: "Bottleneck 是 C3k2 里精修特征的模块：两个 3×3 卷积（先收窄、后复原）加一条残差捷径。",
          componentId: "yolo26-bottleneck"
        },
        {
          kind: "module",
          id: "2.3",
          title: "主干全景：P2–P5、SPPF 与末尾的 C2PSA",
          desc: "主干各层：C3k2 从 P2 到 P5 逐层加深，SPPF 汇集多尺度特征，最后 C2PSA 做全局聚合。",
          componentId: "yolo26-m2"
        },
        {
          kind: "module",
          id: "2.4",
          title: "C2PSA 块：CSP 外壳里装的是自注意力",
          desc: "C2PSA 块结构：同样采用 CSP 外壳，a 分支以位置敏感自注意力（PSA）做全局聚合、b 分支恒等映射，最后拼接投影。",
          componentId: "ch2-m4"
        },
        {
          kind: "module",
          id: "2.5",
          title: "PSA 的注意力是怎么算的：Q/K/V → 打分 → 加权求和",
          desc: "a 分支先用 1×1 卷积投影出 Q、K、V，再展平成 token；用 Q 与所有 K 计算得分（除以 √d）、经 softmax 归一化为权重，再按权重对 V 加权求和，注意力由此聚合整块信息。",
          componentId: "ch2-m5"
        }
      ],
      formula: {
        lead: "PSA 的自注意力分为三步：投影出 Q、K、V → 打分 Q·Kᵀ/√d → softmax 归一后加权求和 V。",
        unicode: "score = Q·Kᵀ / √d_k　·　out = softmax(score) · V",
        symbols: [
          { sym: "Q", desc: "query：当前 token 想找什么（1×1 卷积投影）" },
          { sym: "K", desc: "key：各 token 有什么可被参考（1×1 卷积投影）" },
          { sym: "V", desc: "value：各 token 携带的信息内容（1×1 卷积投影）" },
          { sym: "d_k", desc: "key 的维度；除以 √d_k 防止点积数值过大" },
          { sym: "softmax", desc: "把一行分数归一成和为 1 的权重" }
        ]
      },
      insight: "YOLO26 主干由 CSP 类块（C3k2）逐层堆叠；末尾的 C2PSA 并非 CSP 块，而是位置敏感自注意力块，仅外壳沿用 CSP 拓扑。本论文将 C2PSA 内部的自注意力分支替换为 Mamba，即构成 MambaPSA。",
      takeaways: [
        { icon: "", title: "CSP 是什么", desc: "跨阶段部分连接：特征拆两半，一半过重计算、一半恒等，再并回，省计算不丢信息。" },
        { icon: "", title: "主干结构", desc: "Stem → C3k2 P2–P5 → SPPF → C2PSA，逐层下采样、感受野加深。" },
        { icon: "", title: "论文的改动位置", desc: "主干末尾的 C2PSA 建在 CSP 拓扑上，内部是自注意力，正是被替换的对象。" },
        { icon: "", title: "C2PSA 内部", desc: "拆分 a、b 两半：a 做位置敏感自注意力全局聚合（O(N²)）、b 恒等，再拼接投影；开销集中在 a 分支。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "问题：自注意力的计算量为什么爆炸",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "YOLO26 主干末尾的 C2PSA 用自注意力做全局聚合，而自注意力的计算量随 token 数平方增长。序列一长，轻量边缘设备将首先难以承受。线性扫描只需 N 步，是更省力的替代方案。",
      analogy: {
        title: "和每一本都比一遍",
        text: "要让一本新书认识整排书，最直接的办法是<b>和架上每一本都比对一遍</b>。书越多，比对次数增长越快，自注意力的平方级开销正源于此。",
        componentId: "ch3-ana"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "同样的序列，两种扫描方式的花费",
          desc: "固定 N=64，对比两种方式完成同样任务的开销差距。",
          componentId: "ch3-m2"
        },
        {
          kind: "module",
          id: "3.2",
          title: "自测：两种复杂度，你分清了吗",
          desc: "三道小题检验自注意力与线性扫描的复杂度差距。",
          componentId: "quiz"
        }
      ],
      insight: "问题不在于是否需要全局信息，而在于比对的次数。只需扫描一遍、记住沿途要点，即可线性地获得全局上下文。",
      formula: {
        lead: "自注意力里，每个 token 都要和包括自己在内的所有 token 打分一次，打分次数是 N×N。",
        unicode: "自注意力打分次数 C = N×N = N²　·　线性扫描步数 C = N",
        symbols: [
          { sym: "N", desc: "token 数量（展平的空间位置数，等于 H×W）" },
          { sym: "C", desc: "自注意力的打分次数（N×N），或线性扫描的步数" }
        ]
      },
      takeaways: [
        { icon: "", title: "两种复杂度", desc: "自注意力要对 N×N 个位置对打分（O(N²)），线性扫描是走一遍 O(N)。" },
        { icon: "", title: "最先受限的设备", desc: "序列越长差距越大，轻量边缘设备最先达到算力上限。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "相关工作：从轻量卷积到 Mamba 检测器",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "为使检测器更轻量，此前的尝试走过三条路线：轻量卷积、注意力混合、状态空间模型，各自在 YOLO 系列中的集成位置与收益代价不同。本文将 YOLO26 主干末尾的 C2PSA 内部的自注意力替换为 Mamba——此前尚无工作做到这一步。",
      analogy: {
        title: "一代一代，换更省力的走法",
        text: "整理书架也一样：<b>先省力气（轻量卷积），再学会一眼看全（自注意力），最后边走边记、一趟读完（Mamba）</b>。每一代都保留上一代的目标，只是换更高效的实现方式。本论文即属于最新这一代。",
        componentId: "rw-ana"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "四条路线：轻量卷积、注意力混合、Mamba、本文",
          desc: "各条路线的代表方法及其节省的计算量：从廉价卷积，到将全局注意力引入检测器，再到用线性扫描处理长序列。",
          componentId: "rw-m1"
        },
        {
          kind: "module",
          id: "4.2",
          title: "接入哪一层：Mamba 进 YOLO 的三个位置",
          desc: "YOLO 管线上的集成点：Mamba-YOLO 替换颈部 C2f，后续工作修改 YOLO11 的 C3k2，而 YOLO26 主干末尾的 C2PSA 尚无工作涉及——这正是本文填补的位置。",
          componentId: "rw-m2"
        }
      ],
      insight: "Mamba 并非首次进入 YOLO：此前已有工作替换 YOLOv8 颈部的 C2f、YOLO11 主干的 C3k2，但 YOLO26 主干末尾的 C2PSA 一直未被涉及。本论文保留 CSP 外壳，将内部自注意力替换为 Mamba 核心（d_state=8、expansion=1），是第一个在 NMS-free 的 YOLO26 上直接替换 C2PSA 的工作。",
      takeaways: [
        { icon: "🔁", title: "前辈路线", desc: "轻量卷积节省计算、自注意力做全局聚合、Mamba 以线性时间读长序列——目标一致，实现方式一代比一代高效。" },
        { icon: "🕳️", title: "尚未覆盖的位置", desc: "YOLO26 是 NMS-free 框架，其 C2PSA 与 SSM 的结合此前无人探索。" },
        { icon: "🧩", title: "本文的定位", desc: "保留 CSP 外壳、内部替换为 Mamba 核心（d_state=8、e=1），将 C2PSA 换成 MambaPSA。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "Mamba 简介：状态空间模型如何读取序列",
      badge: "inf",
      badgeLabel: "基础",
      bridge: "Mamba 读的是把特征图展平后的一串 token，位置信息编码在顺序之中。它沿序列线性扫描，借助隐状态携带历史；作为状态空间模型，它与卷积、RNN、Transformer 以不同的方式读取序列。",
      analogy: {
        title: "沿书架扫一遍",
        text: "Mamba 处理序列像<b>沿书架走一遍</b>：每经过一本书，将需要记忆的内容汇入不断更新的记忆，全程只遍历一次，代价随书架长度线性增长。",
        componentId: "mamba-ana"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "特征图上的每个位置对应一个 token",
          desc: "特征图的每个位置对应一个 token，展平后按序排列；详情区显示该 token 的内容。",
          componentId: "ch5-m1"
        },
        {
          kind: "module",
          id: "5.2",
          title: "动画：同一条序列，四种处理器各自怎么算",
          desc: "同一串 token 经四种处理器：卷积局部窗口滑动、RNN 顺序递推、自注意力两两打分、Mamba 线性扫描。",
          componentId: "four-procs-video"
        },
        {
          kind: "module",
          id: "5.3",
          title: "自测：四种处理器，各自怎么读序列",
          desc: "三道小题核对输入格式、训练并行性与全局上下文的来源。",
          componentId: "quiz"
        }
      ],
      formula: {
        lead: "四种处理器处理同一序列，获取上下文的方式与开销各不相同：卷积仅覆盖局部窗口，RNN 按序递推，自注意力对所有位置两两打分，Mamba 线性扫描。",
        unicode: "卷积：局部 O(N·k)　·　RNN：顺序递推　·　自注意力：全局 O(N²)　·　Mamba：线性扫描 O(N)",
        symbols: [
          { sym: "N", desc: "序列长度，即展平特征图的像素数 H×W" },
          { sym: "卷积", desc: "只看一个局部窗口，窗口大小 k 远小于 N" },
          { sym: "RNN", desc: "沿序列一步步递推，隐状态携带历史；每步固定开销，但前后步互相依赖、训练难并行" },
          { sym: "自注意力", desc: "对 N×N 个位置对打分，全局信息但平方级" },
          { sym: "Mamba", desc: "线性扫描 + 隐状态，全局上下文、每步固定开销" }
        ]
      },
      insight: "Mamba 希望同时兼具 RNN 与 Transformer 的优点：拥有 RNN 式的固定大小隐状态，推理时节省内存；又能像 Transformer 一样获取长程上下文，只是依靠线性扫描而非平方级打分。其覆盖范围优于卷积，计算开销低于自注意力。",
      takeaways: [
        { icon: "", title: "输入是 token", desc: "C×H×W 的特征图被展平成 H·W 个 token，顺序编码了空间结构。" },
        { icon: "", title: "什么是 SSM", desc: "状态空间模型：输入序列经过一个隐状态，逐步映射为输出序列。Mamba 是其在深度学习框架下的现代实现。" },
        { icon: "", title: "四种处理器", desc: "卷积只看邻居（局部）、RNN 顺序递推（难并行）、自注意力看全部（O(N²)）、Mamba 靠隐状态看走过的历史（O(N)）。" },
        { icon: "", title: "和 RNN / Transformer 的区别", desc: "与 RNN 同样按序递推、有隐状态，但 Mamba 训练时整条序列可并行；与 Transformer 不同，它靠固定大小的隐状态携带历史而非 N×N 权重，序列越长差距越大。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "SSM 的数学：递推、卷积加速与 HiPPO",
      badge: "both",
      badgeLabel: "综合",
      formulaFirst: true,
      bridge: "Mamba 属于状态空间模型，核心是一个隐状态递推式。参数固定时该递推可整体展开为一次卷积，训练因而可以并行，这称为「卷积加速」。A 矩阵的初始化同样关键（HiPPO），它决定隐状态能保留多远的记忆。",
      analogy: {
        title: "走一步，记一次",
        text: "递推即沿序列行进：每走一步，记忆按 Ā 衰减一部分、按 B̄ 融入当前这一步的内容，再读出该位置的输出。走完全程，全程历史都保存在记忆之中。",
        componentId: "ch6-ana"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "演示视频：递推与卷积，算出一模一样的答案",
          desc: "用具体数字把递推和卷积各算一遍，两条路径得到完全相同的输出。",
          componentId: "ssm-conv-video"
        },
        {
          kind: "module",
          id: "6.2",
          title: "没有 HiPPO：RNN 式递推的困境",
          desc: "先看问题再给解药：用朴素递推（随机初始化的 A）处理序列，记忆会以多快的速度消失？又是怎么在「遗忘」与「爆炸」之间进退两难？——这是 HiPPO 要解决的困境。",
          componentId: "ssm-forget"
        },
        {
          kind: "module",
          id: "6.3",
          title: "HiPPO 的核心想法：把整个历史压进几个系数",
          desc: "HiPPO 不直接记每一步输入，而是把「整段历史」当作一条曲线，用一组正交多项式（Legendre）当坐标轴，投影出 d 个系数存进隐状态；d_state 越大，对历史的还原越精细——隐状态就是历史的「低维摘要」。",
          componentId: "ssm-hippo-proj"
        },
        {
          kind: "module",
          id: "6.4",
          title: "HiPPO 的 A 矩阵：系数递推如何保留长程记忆",
          desc: "系数之间的递推关系被写进 A 矩阵：对角项决定每个系数每步的衰减速度、下三角让高阶系数从低阶继承。对比随机初始化——为什么随机 A 几步就忘光，HiPPO A 能留得住长程。",
          componentId: "ssm-hip"
        }
      ],
      formula: {
        lead: "SSM 的核心是一个线性递推：隐状态按 Ā 演化、按 B̄ 融入输入，输出由 C̄ 读出。参数固定时，将递推逐项展开，即得到一次卷积。",
        unicode: "hₜ = Āhₜ₋₁ + B̄xₜ　·　yₜ = C̄hₜ　⇒　y = K * x，K = (C̄B̄, C̄ĀB̄, C̄Ā²B̄, …)",
        symbols: [
          { sym: "hₜ", desc: "t 时刻的隐状态，即扫描中携带的记忆" },
          { sym: "xₜ", desc: "t 时刻读入的输入 token" },
          { sym: "yₜ", desc: "t 时刻的输出，由此 token 的上下文表示" },
          { sym: "Ā", desc: "状态转移（保持）矩阵；默认对所有 token 相同" },
          { sym: "B̄, C̄", desc: "输入投影与输出投影矩阵" },
          { sym: "K", desc: "卷积核：由 Ā、B̄、C̄ 展开得到的冲激响应" }
        ]
      },
      insight: "同一套递推存在两种视角。训练时参数固定，可按一次卷积并行处理整条序列；推理时逐步递推，每步开销固定。这正是 SSM 易于训练且节省内存的原因。而 HiPPO 把「整段历史」投影到一组正交多项式（Legendre）系数上存进隐状态（d_state 越大还原越精细），并把这一系数递推写进 A 矩阵：对角决定每个系数每步的衰减、低阶（长期趋势）系数慢衰减——长程历史因此留得住。",
      takeaways: [
        { icon: "", title: "递推与卷积等价", desc: "Ā、B̄、C̄ 固定时，递推可以展开成对输入的卷积，卷积核 K 就是冲激响应。" },
        { icon: "", title: "训练并行、推理线性", desc: "训练用卷积（整条序列并行、充分利用硬件），推理用递推（每步固定开销）。" },
        { icon: "", title: "HiPPO 是什么", desc: "用一组正交多项式（Legendre）把历史投影到隐状态：距离当前越近的历史权重越高，越久远则逐渐衰减。" },
        { icon: "", title: "为什么重要", desc: "良好的初始化使长序列的信息得以保留，这是 SSM 在序列建模中成立的基础。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "选择性扫描：Mamba 的核心创新",
      badge: "both",
      badgeLabel: "综合",
      formulaFirst: true,
      bridge: "上一章的卷积加速有一个前提：Ā、B̄、C̄ 对所有 token 一视同仁。Mamba 则要求这些矩阵随输入变化，以便模型有选择地记忆。代价是卷积等价性不再成立，需借助硬件友好的并行选择性扫描恢复训练效率。",
      analogy: {
        title: "只记住该记的",
        text: "并非所有内容都值得记忆。Mamba 使模型自行筛选：<b>重要的内容纳入隐状态，无关的内容忽略</b>。扫描仍为一次，只是每一步记忆多少由输入决定。",
        componentId: "ch7-ana"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "演示视频：选择性递推的具体计算",
          desc: "用具体数字把选择性递推逐步算出来——强 token 大幅改写记忆、弱 token 几乎不动。",
          componentId: "ssm-worked-video"
        },
        {
          kind: "module",
          id: "7.2",
          title: "跑一次扫描：隐状态怎么演化",
          desc: "token 逐个流过，隐状态曲线实时演化；「普通扫描」与「选择性扫描」的差异，正是本章「只记该记的」的直观体现。",
          componentId: "ssm-scan-demo"
        },
        {
          kind: "module",
          id: "7.3",
          title: "自测：选择性机制，怎么做到「只记该记的」",
          desc: "三道小题核对选择性的含义、代价与相近的模型。",
          componentId: "quiz"
        }
      ],
      formula: {
        lead: "选择性机制将固定矩阵变为输入的函数：这一步输入的内容决定 Ā、B̄、C̄ 的取值，模型据此决定记忆多少。",
        unicode: "Ā(xₜ), B̄(xₜ), C̄(xₜ)　·　hₜ = Ā(xₜ)hₜ₋₁ + B̄(xₜ)xₜ　·　yₜ = C̄(xₜ)hₜ",
        symbols: [
          { sym: "xₜ", desc: "触发选择的输入：矩阵随这一步的内容而变" },
          { sym: "Ā(xₜ)", desc: "随输入变化的状态转移：决定这一步「保留多少旧记忆」" },
          { sym: "B̄(xₜ)", desc: "随输入变化的输入投影：决定这一步「融入多少新信息」" },
          { sym: "Δ(xₜ)", desc: "门控量：由输入决定，Δ 大＝大幅更新记忆，Δ 小≈忽略（本例取 Δₜ=xₜ）" },
          { sym: "C̄(xₜ)", desc: "随输入变化的输出投影" },
          { sym: "hₜ", desc: "更新后的隐状态" }
        ]
      },
      insight: "选择性是 Mamba 与 S4 的关键区别。S4 保持时间不变，可利用卷积并行训练；Mamba 令矩阵随输入变化，卷积等价性随之失效，遂以硬件友好的并行选择性扫描恢复训练效率。其代价换来的是模型具备选择性：相关内容保留，无关内容忽略。",
      takeaways: [
        { icon: "", title: "为什么叫选择性", desc: "矩阵随输入变化，模型按内容决定每步记忆什么：保留重要内容，忽略无关内容。" },
        { icon: "", title: "代价是什么", desc: "输入相关性破坏了时间不变性，上一章的卷积加速不再适用。" },
        { icon: "", title: "如何应对", desc: "Mamba 借助硬件感知的并行扫描（分块并行 + 扫描）在 GPU 上恢复训练速度。" },
        { icon: "", title: "和门控 RNN 的关系", desc: "其行为类似带门控的 RNN：记忆多少由输入决定，但借助并行扫描训练，长序列也可高效训练。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "MambaPSA 块：一半 Mamba，一半保持原样",
      badge: "both",
      badgeLabel: "综合",
      bridge: "MambaPSA 保留 C2PSA 的 CSP 外壳：1×1 卷积把特征拆成两半 a、b，a 经 Mamba、b 恒等映射，拼接后再投影。恒等、残差、双向等稳定机制共同保证轻量化替换的稳定性。",
      analogy: {
        title: "一半整理，一半原样",
        text: "与其让所有特征都进入自注意力，不如<b>只让一半经 Mamba 加工、另一半原样保留</b>。只处理一半，参数与计算开销均随之减少。",
        componentId: "ch8-ana"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "拆两半：a 经 Mamba、b 恒等，最后拼接",
          desc: "块内高亮的处理路径，以及整网参数、FLOPs、精度的相对变化。",
          componentId: "ch8-m1"
        },
        {
          kind: "module",
          id: "8.2",
          title: "三个开关：恒等、残差、双向",
          desc: "恒等、残差、双向三组开关，块的参数计量与输出稳定性随之变化。",
          componentId: "ch8-m2"
        }
      ],
      formula: {
        lead: "块的输出就是：两半各走各的路径，再拼起来投影一次。",
        unicode: "(a, b) = Split(Conv₁(x))　·　out = Conv₂(Concat(Mamba(a), b))",
        symbols: [
          { sym: "x", desc: "输入特征，C×H×W" },
          { sym: "Conv₁", desc: "把 C 通道投影到 2C′ 的 1×1 卷积" },
          { sym: "a, b", desc: "拆分后的两半特征，各 C′ 通道" },
          { sym: "Mamba", desc: "对展平的 H·W 个 token 做一次单向扫描的 Mamba 块" },
          { sym: "Conv₂", desc: "把拼接后的 2C′ 通道映射回 C 通道的 1×1 卷积" }
        ]
      },
      takeaways: [
        { icon: "", title: "结构", desc: "MambaPSA = CSP 外壳 + 内部换 Mamba 核心，a 扫描、b 恒等、再拼接投影。" },
        { icon: "", title: "轻量配置", desc: "dstate=8、e=1、单向扫描，整体块相对 C2PSA 近似参数中性。" },
        { icon: "", title: "稳定机制", desc: "恒等路径与残差连接使输出贴近输入，双向扫描补充反向上下文。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "Mamba 的两个集成点：主干的 MambaPSA 与颈部的 BiViM",
      badge: "both",
      badgeLabel: "综合",
      bridge: "YOLO26 是一条主干→颈部→检测头的完整管线，Mamba 有两个集成点。MambaPSA 替换主干末尾的 C2PSA；BiViM 是双向 Mamba 块，正反各扫描一遍、将两个方向的上下文相加，再经线性投影并接残差，可选择性接入颈部某一层。两个集成点分别改变整网的参数、FLOPs 与精度。",
      analogy: {
        title: "正着读一遍，再倒着读一遍",
        text: "模块的替换需要考量位置：<b>MambaPSA 替换主干末尾的 C2PSA</b>；<b>BiViM 则如同正读一遍、再倒读一遍</b>的双向 Mamba，补全两侧上下文，可接入颈部某一层。放置在合适位置，整条管线才能兼具轻量与精度。",
        componentId: "ch9-ana"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "YOLO26 中的 MambaPSA 与 BiViM",
          desc: "静态结构示意：整条管线（主干 → 颈部 PAN-FPN → 检测头），标注 MambaPSA 与 BiViM 两个改动点。",
          componentId: "ch9-m1"
        },
        {
          kind: "module",
          id: "9.2",
          title: "BiViM：双向 Mamba 块，正反各扫一遍",
          desc: "BiViM 块内部：同一行 token 正反各扫一遍，两方向上下文相加后经线性投影并接残差；扫描方向决定目标 token 能获取哪一侧的信息，接入 P3/P4/P5 三档时的整网代价见下方对比。",
          componentId: "bivim-m1"
        },
        {
          kind: "module",
          id: "9.3",
          title: "结构总览动画：一条管线，两个集成点",
          desc: "把整条管线串成五幕：整网主干 → C2PSA 内幕（O(N²)）→ 换成 MambaPSA → 颈部 BiViM → 两个集成点总览。",
          componentId: "pipeline-video"
        }
      ],
      formula: {
        lead: "展平到主干或颈部特征图大小后，一次 Mamba 扫描的步数就是该层的像素数。",
        unicode: "该层 token 数 N = H × W　·　扫描步数 = N，每步开销固定",
        symbols: [
          { sym: "H", desc: "该层特征图高度" },
          { sym: "W", desc: "该层特征图宽度" },
          { sym: "N", desc: "该层展平后的 token 数，即扫描步数" }
        ]
      },
      takeaways: [
        { icon: "", title: "管线", desc: "主干 → 颈部 PAN-FPN → 检测头，C2PSA 在主干末尾、BiViM 在颈部。" },
        { icon: "", title: "BiViM 是什么", desc: "双向 Mamba 块：正反各扫描一遍、两方向上下文相加，再经线性投影与残差（dstate=16、e=2）；单向扫描无法覆盖的一侧，双向扫描得以补全。" },
        { icon: "", title: "两个集成点", desc: "MambaPSA 替换主干末尾的 C2PSA（最省）；BiViM 只在 P3/P4/P5 中一个层级生效，其余位置保持原样。" },
        { icon: "", title: "变体代价", desc: "P4 精度最高（+0.9）但参数 +9.6%；P5 贵（+43.8% 参数）；MambaPSA 最省（−2.9% 参数、−12.1% FLOPs）。" }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "结果：效率与精度的权衡",
      badge: "both",
      badgeLabel: "综合",
      bridge: "效率与精度一并权衡：五条配置按参数、FLOPs、mAP50:95、CPU FPS 四组指标横向对比，各项精确数值由证据表核实。",
      analogy: {
        title: "验收：一排整齐",
        text: "整理完成，书脊对齐、便于取用。但仍需考察付出的代价与是否损坏书本，这正是精度与效率的权衡。",
        componentId: "ch10-ana"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "五条配置横向对比：谁的性价比更高",
          desc: "四个指标各配一张对比图：参数、FLOPs 越低越好，mAP50:95、CPU FPS 越高越好；绿框标出各指标最优者，下方证据表保留精确数值。",
          componentId: "ch10-m1"
        },
        {
          kind: "module",
          id: "10.2",
          title: "问题与局限性：结论的边界在哪",
          desc: "单一种子、单一数据集、收益集中在效率而非精度、单向扫描缺未来信息、CPU FPS 数据不全——把这些限制说清楚，结论才算完整。",
          componentId: "limitations"
        }
      ],
      takeaways: [
        { icon: "", title: "综合表现", desc: "MambaPSA 参数 −2.9%、FLOPs −12.1%、CPU FPS +17.6%，mAP 仅 −0.1。" },
        { icon: "", title: "权衡", desc: "P4 BiViM 精度最高（+0.9）但参数 +9.6%；P5 提升有限且贵（+43.8% 参数）。" },
        { icon: "", title: "边界", desc: "单一种子、单次 CPU 测量；差异是方向性趋势，COCO 与多种子验证留待未来。" }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1WYrWBVEGb",
      title: "YOLO26终于来了～给大家讲解一下相对于YOLO11的变动和常见问题～",
      reason: "YOLO26 框架级讲解，本论文改的正是 YOLO26",
      cover: "https://i0.hdslb.com/bfs/archive/52fccca03ab9536bb57b365bc6d0ad03344435ad.jpg",
      views: "2.3万播放"
    },
    {
      bvid: "BV1x6zzY4Evu",
      title: "Vision Mamba讲解+Mamba复习",
      reason: "Vision Mamba + Mamba 复习，理解核心 Mamba 机制",
      cover: "https://i2.hdslb.com/bfs/archive/6be2a9b64612218d0b99ff0b3265b48af0a486b7.jpg",
      views: "9870播放"
    },
    {
      bvid: "BV1PRmTB1Enr",
      title: "2025最火的两个模型：Mamba+YOLO两大目标检测模型，论文创新思路+0代码复现",
      reason: "Mamba+YOLO 目标检测模型的论文思路 + 代码复现，与本文主题最贴近",
      cover: "https://i0.hdslb.com/bfs/archive/6a16680e3ae727ce40deef673ce9b9738bfbb79d.jpg",
      views: "679播放"
    },
    {
      bvid: "BV1LizWBWEFV",
      title: "14分钟速通yolo26，使用自己的数据集从环境搭建到模型训练、推理、导出",
      reason: "YOLO26 训练、推理、导出的上手实践，看完能自己跑通基线",
      cover: "https://i0.hdslb.com/bfs/archive/ee7101ef1c6fc60e22b4eb8954a18be2be9f41c1.jpg",
      views: "5747播放"
    }
  ]
};
