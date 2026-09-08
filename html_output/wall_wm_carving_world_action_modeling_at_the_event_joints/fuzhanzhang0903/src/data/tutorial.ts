import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'WALL-WM: Carving World Action Modeling at the Event Joints',
    titleZh: 'WALL-WM：在事件节点上构建世界动作模型',
    venue: '',
    authors: 'X Square Robot Team',
    affiliation: 'X Square Robot Team',
    domain: '具身智能 · Vision-Language-Action · World Action Model',
    coreProblem:
      '现有 WAM/VLA 往往按固定长度 action chunk 学习，但语言描述事件、视频承载连续动态、动作依赖精细接触，三者被同一时钟硬切后会出现粒度失配。',
    coreInsight:
      'WALL-WM 把 <b>action-grounded semantic event</b> 作为学习原子：一个片段必须能被语言说清、被视频看见、被动作执行。',
    keywords: ['事件中心 WAM', '多视角视频 DiT', '阶梯隐推理', '任务进度'],
  },
  hero: {
    oldMethod: {
      desc: '传统 fixed-length chunk 用外部时钟切片，训练方便，却可能把接触、抬起、释放这些完整行为切断。',
      componentId: 'wm-hero-old',
    },
    newMethod: {
      desc: 'WALL-WM 使用事件 caption、事件视频、事件动作三者同区间配对，让学习目标从 <b>下一段固定时间</b> 变成 <b>下一个可执行事件</b>。',
      componentId: 'wm-hero-new',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '固定 chunk 的问题',
      badge: 'inf',
      badgeLabel: '问题入口',
      bridge:
        '论文第 1 节和 Figure 2 先指出一个训练范式问题：主流 VLA/WAM 常从当前观测和全局指令预测固定长度动作块。这个做法工程上整齐，但它按钟表切行为，不按机器人真实动态切行为。',
      analogy: {
        title: '本章在八章路线中的位置',
        text: '先建立整篇论文的入口问题：传统 fixed chunk 为什么会把完整机器人行为切碎。',
        componentId: 'wm-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '切分边界诊断器：固定窗口 vs 完整事件',
          desc: '切换两种模式。红色窗口显示固定 chunk 如何把 caption、视频状态和动作轨迹切成局部碎片；绿色区间显示事件边界如何让三种模态落在同一段完整行为上。',
          componentId: 'wm-cut',
        },
      ],
      insight: 'WALL-WM 的起点判断是：如果学习单位错了，模型再大也会被错误边界拖着走。',
      formula: {
        lead: '本章先记住这个核心差别。',
        unicode: 'fixed-length chunk <span class="formula-danger">!=</span> action-grounded semantic event',
        symbols: [
          { sym: 'fixed-length chunk', desc: '固定时长动作块，便于批处理，但可能割裂完整行为' },
          { sym: 'action-grounded semantic event', desc: '动作绑定语义事件，起止由可执行行为变化决定' },
        ],
      },
      takeaways: [
        { icon: '1', title: '问题先于架构', desc: '论文先质疑训练原子，而不是只堆模型规模。' },
        { icon: '2', title: '局部 chunk 会歧义', desc: '全局指令落到局部片段时常常说不清当前该做哪一步。' },
        { icon: '3', title: '事件让目标清楚', desc: '事件 caption、视频、动作描述同一段语义区间。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '语言、视频、动作的粒度错位',
      badge: 'inf',
      badgeLabel: '对齐问题',
      bridge:
        'Figure 1 把问题说成模态层级（modality hierarchy）：文本提供粗粒度语义，视频提供稠密时空动态，动作需要接触敏感的局部精度。因此难点不是普通的多模态拼接，而是几何保留对齐（geometry-preserving alignment）。',
      analogy: {
        title: '本章在八章路线中的位置',
        text: '这一章先讲三种模态为何不能粗暴塞进同一空间，再说明 WALL-WM 为什么用事件作为三者的共同接口。',
        componentId: 'wm-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: 'Figure 1 可拖拽流形图：三种模态不是同一几何',
          desc: '拖动画布改变观察角度。斜视时看三者处在不同抽象高度；俯视时看语言、视觉、动作的邻域形状和尺度完全不同，说明不能粗暴塞进同一个嵌入空间。',
          componentId: 'wm-alignment',
        },
        {
          kind: 'module',
          id: '2.2',
          title: '事件三条件：语言能说清、视频能看见、动作能执行',
          desc: 'action-grounded semantic event 以完整可执行机器人行为作为统一最小单元，让文本、视频、动作顺着自身语义 / 时序天然边界完成对齐，无需人为切割时序窗口；既保留三类模态各自独立表征流形，又完整继承视频大模型预训练的事件级视觉先验，同时构建完整行为因果闭环，从根源解决多模态尺度错位的核心痛点。',
          componentId: 'wm-event',
        },
      ],
      insight: '这一章的逻辑是先破后立：传统做法把三种不同几何的模态硬对齐；WALL-WM 则用 action-grounded semantic event 作为语言、视频、动作共同承认的接口。',
      formula: {
        lead: '论文的三条设计准则可以压缩成这个交集。',
        unicode: 'event unit = language ∩ video ∩ action',
        symbols: [
          { sym: 'language', desc: '可用自然语言命名，如 reach、grasp、lift、place' },
          { sym: 'video', desc: '在未来视频中有可观察的连续状态变化' },
          { sym: 'action', desc: '可通过末端轨迹和控制命令执行' },
        ],
      },
      takeaways: [
        { icon: '1', title: '文本最粗', desc: '它说目标和事件，但不直接给接触细节。' },
        { icon: '2', title: '视频是桥', desc: '它既能对齐语义，又保留时空动态。' },
        { icon: '3', title: '事件是接口', desc: '事件必须同时能说清、看得见、做得到。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: 'WALL-WM 的建模目标',
      badge: 'both',
      badgeLabel: '模型目标',
      bridge:
        '第 3.1 节给出核心建模式：给定当前多视角观测、本体状态和事件 caption，联合预测事件未来视频与末端动作轨迹。它不是单纯的动作头，也不是只管环境演化的世界模型，而是把事件作为最小预测单元，把未来画面和完整动作放到同一条条件分布里联合建模。',
      analogy: {
        title: '本章在八章路线中的位置',
        text: '这一章先对比普通 VLA 和传统 WAM，再落到 WALL-WM 的核心公式：输入当前观测、状态和事件文本，同时预测未来视频与动作。',
        componentId: 'wm-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '建模目标三分区：普通 VLA / 传统 WAM / WALL-WM',
          desc: ' ',
          componentId: 'wm-objective',
        },
      ],
      insight: '普通 VLA 只管反应式动作映射，传统 WAM 只管环境动力学，WALL-WM 则把语言、视频、动作统一进同一个事件分布里。',
      formula: {
        lead: '论文最核心的概率建模目标如下。先把它读成一句话：给定当前观测、本体状态和单个事件文本，同步预测这个事件全过程的未来画面与机器人动作。',
        unicode: 'pθ(Ve, ae | V0, s, ce)',
        symbols: [
          { sym: 'θ', desc: '模型全部可学习参数，包括视频塔、动作塔和推理模块' },
          { sym: 'V0', desc: '当前多视角观测，通常是每个相机一帧关键帧' },
          { sym: 's', desc: '当前机器人本体状态，如关节角度、夹爪状态等' },
          { sym: 'ce', desc: '单事件描述文本，是训练阶段的基础监督单元' },
          { sym: 'Ve, ae', desc: '事件未来多视角视频和末端轨迹，长度都随事件语义变化' },
        ],
      },
      takeaways: [
        { icon: '1', title: '先分清三类模型', desc: '普通 VLA、传统 WAM、WALL-WM 的建模目标本来就不一样。' },
        { icon: '2', title: '再读核心公式', desc: 'WALL-WM 不是只预测动作，而是联合预测未来视频与完整动作。' },
        { icon: '3', title: '长度跟事件走', desc: '预测目标由事件语义决定，不再被固定窗口硬切。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: 'WALL-WM 框架',
      badge: 'trn',
      badgeLabel: '主架构',
      bridge:
        'Figure 3 是整篇方法的总框架：a 负责把全局任务和历史进度转成下一事件条件；b 负责把事件条件送入 Multi-View Video DiT 与 Action Transformer，联合建模未来视频和动作；c 展开说明多视角 token 如何融合，并逐层把视频 KV 送给动作塔。',
      analogy: {
        title: '本章在八章路线中的位置',
        text: '这一章先总览 Figure 3，再分别讲 a 语言引导推理、b 事件世界建模、c 时空融合三块如何接起来。',
        componentId: 'wm-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: 'Figure 3 总览：下一事件如何变成可执行片段',
          desc: 'a 负责把全局任务和历史进度转成下一事件条件；b 负责把事件条件送入 Multi-View Video DiT 与 Action Transformer，联合建模未来视频和动作；c 展开说明多视角 token 如何融合，并逐层把视频 KV 送给动作塔。',
          componentId: 'wm-framework-overview',
        },
        {
          kind: 'module',
          id: '4.2',
          title: 'a) Language-Guided Reasoning：下一事件从哪里来',
          desc: '事件模式直接接收自然语言事件文本；统一模式用 Qwen3.5 与 Staircase Decoder 生成连续 embedding；历史观测和历史执行用来告诉模型任务已经推进到哪一步。',
          componentId: 'wm-framework-reasoning',
        },
        {
          kind: 'module',
          id: '4.3',
          title: 'b) Event World Modeling：事件如何变成未来视频和动作',
          desc: 'Multi-View Video DiT 继承视频模型的世界动态先验以及a的事件输出，Action Transformer 负责动作轨迹去噪。通过并行多视角视频 DiT、动作 Transformer 双塔单向分层耦合，联合预测对应时段内完整未来场景视频与机械臂可执行动作轨迹。',
          componentId: 'wm-framework-world',
        },
        {
          kind: 'module',
          id: '4.4',
          title: 'c) Spatial-Temporal Fusion：多视角 token 如何接到动作塔',
          desc: 'c 是 b 里视频塔每一层内部的微观计算流水线：三路独立相机特征 → S1 单视角编码（保留原图视觉先验） → S2 跨视角注意力（建立 3D 跨相机对应） → S3 拼接为统一多视图 KV 特征 → S4 把每层视频 KV 单向输送给对应动作层做交叉注意力。',
          componentId: 'wm-framework-fusion',
        },
      ],
      takeaways: [
        { icon: '1', title: 'a 决定下一事件', desc: '语言推理把全局任务落成自然语言事件或连续 embedding。' },
        { icon: '2', title: 'b 联合建模世界和动作', desc: '视频塔预测未来世界，动作塔生成对应动作。' },
        { icon: '3', title: 'c 解释特征怎么流动', desc: '多视角先融合，再把视频 KV 逐层送给动作塔。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '两种推理模式',
      badge: 'inf',
      badgeLabel: '部署方式',
      bridge:
        '紧接 Figure 3 的 a 模块来看，WALL-WM 暴露两种推理接口：event mode 直接使用自然语言事件，unified mode 使用 Qwen3.5 与 Staircase 生成 embedding。前者按事件自然 rollout，后者兼容传统固定 chunk 部署。',
      analogy: {
        title: '本章在八章路线中的位置',
        text: '这一章把 Figure 3 左侧的 Event Mode 和 Unified Mode 单独拎出来，解释同一个框架如何同时支持自然事件接口和固定窗口接口。',
        componentId: 'wm-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '条件路由器：同一进度，两种接口给 WAM 什么条件',
          desc: '这张图要表达的不是两个模型，而是为了兼容性，在推理时有两个模式：event mode 直接给自然语言事件，unified mode 用全局指令加历史窗口生成隐式事件条件。前者更贴合论文思想，后者更方便接传统固定 chunk 控制系统。',
          componentId: 'wm-inference',
        },
      ],
      insight: 'WALL-WM 不是简单抛弃 chunk，而是用事件预训练做基座，再提供自然事件接口和固定窗口兼容接口。',
      takeaways: [
        { icon: '1', title: '事件模式更自然', desc: '片段长度跟随真实行为阶段。' },
        { icon: '2', title: '统一模式更兼容', desc: '可接入固定动作块评测和部署。' },
        { icon: '3', title: '历史窗口消歧义', desc: '全局指令下需要知道任务进度。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '事件数据生态',
      badge: 'trn',
      badgeLabel: '数据系统',
      bridge:
        '框架成立以后，下一步要问：事件从哪里来？第 4 节说明 WALL-WM 不是只改模型，而是按事件重新组织数据：多来源数据、视频动作同步、四层 caption、视觉-语言与动作双聚类均衡采样，以及 contact-rich recovery data。',
      analogy: {
        title: '本章在八章路线中的位置',
        text: '这一章解释事件级训练需要什么数据支撑：如果没有事件 caption 和均衡采样，模型仍会被高频简单动作牵着走。',
        componentId: 'wm-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '黄瓜示例：长 episode 如何变成事件训练样本',
          desc: '点击五个步骤。从“拿起黄瓜放到菜板上”的长轨迹开始，依次切成事件、配 caption、绑定事件视频与动作轨迹，最后用均衡采样保护接触和恢复等长尾事件。',
          componentId: 'wm-data',
        },
      ],
      insight: '事件单位如果没有事件级 caption 和均衡采样支撑，就会重新被高频简单动作淹没。',
      takeaways: [
        { icon: '1', title: '数据多源', desc: '互联网、第一人称、XR、遥操作共同覆盖。' },
        { icon: '2', title: '标注分层', desc: 'L3 到 L0 捕捉任务、子任务、动作和微修正。' },
        { icon: '3', title: '采样抗长尾', desc: '视觉-语言和动作轨迹双聚类均衡。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '实验结果',
      badge: 'both',
      badgeLabel: '实验结论',
      bridge:
        '第七章主要对应论文 Section 7 Experiments，汇报时应把重点放在 Section 7.2 Real-Robot Evaluation。Table 5 给出四个真实机器人任务套件的 Task Progress，是最适合展示论文成功的主证据。',
      analogy: {
        title: '本章在八章路线中的位置',
        text: '这一章只回答一个问题：前面讲的事件建模和框架设计，到真实机器人任务上到底有没有带来可见收益。',
        componentId: 'wm-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: 'Section 7.2 / Table 5：四个真实机器人任务套件',
          desc: 'WALL-WM-E 事件模式在多样操作、推理操作和泛化任务上明显更强；灵巧操作只小幅提升。',
          componentId: 'wm-results',
        },
      ],
      
      formula: {
        lead: 'Task Progress 是越高越好的 0 到 100 连续进度分。',
        unicode: 'Task Progress ∈ [0, 100], higher is better',
        symbols: [
          { sym: '0', desc: '没有完成可观察步骤' },
          { sym: '100', desc: '按任务 rubrics 完整完成' },
          { sym: 'higher', desc: '分数越高表示任务推进越远' },
        ],
      },
      takeaways: [
        { icon: '1', title: '泛化是亮点', desc: '复杂桌面随机指令下差距最大。' },
        { icon: '2', title: '推理有效', desc: '事件分解帮助分类、排序和选择。' },
        { icon: '3', title: '多样操作稳定', desc: '抓取、放置、倒水等直接操作整体更稳。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '局限和最终判断',
      badge: 'both',
      badgeLabel: '最终判断',
      bridge:
        '最后不要把 WALL-WM 讲成万能机器人。它真正推进的是机器人视频-动作学习的组织单位：从按固定时钟切 chunk，转到按语义事件切行为；但灵巧操作、精密接触和低层控制仍然是开放问题。',
      analogy: {
        title: '本章在八章路线中的位置',
        text: '这一章负责给评委留下准确结论：WALL-WM 的强项是事件级泛化和推理，不是把所有低层接触难题一次解决。',
        componentId: 'wm-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '最终判断板：解决了什么、证明了什么、没解决什么',
          desc: 'WALL-WM 解决的是 fixed chunk 切碎行为的问题；真实机器人实验证明事件建模提升推理、泛化和多样操作；但灵巧操作提升有限，精密接触和低层控制仍然困难。',
          componentId: 'wm-summary',
        },
      ],
      takeaways: [],
    },
  ],
};
