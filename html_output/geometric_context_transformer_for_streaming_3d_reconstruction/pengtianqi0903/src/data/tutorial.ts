import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Geometric Context Transformer for Streaming 3D Reconstruction',
    titleZh: '面向流式三维重建的几何上下文 Transformer',
    venue: 'arXiv:2604.14141v2 · 2026',
    authors:
      'Lin-Zhuo Chen, Jian Gao, Yihang Chen, Ka Leong Cheng, Yipengjing Sun, Liangxiao Hu, Nan Xue, Xing Zhu, Yujun Shen, Yao Yao, Yinghao Xu',
    affiliation: 'Ant Group · Robbyant Team',
    domain: 'Streaming 3D Reconstruction · Transformer · SLAM',
    coreProblem:
      '流式三维重建只能使用当前与过去帧持续预测位姿和深度，但完整历史会让缓存失控，纯滑窗又会丢失长程几何参照。',
    coreInsight:
      '<b>不是记住更多，而是按几何职责记对内容：</b>Anchor 提供固定参照，Window 保留近期稠密证据，Trajectory Memory 延续长程轨迹线索。',
    keywords: ['LingBot-Map', 'GCT / GCA', '6-token Memory', 'Video RoPE', 'Paged KV'],
  },
  hero: {
    oldMethod: {
      desc: '<b>全历史注意力</b>保留全部图像 token，状态随序列快速膨胀；<b>纯滑窗</b>成本可控，却切断远期参照。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: '<b>GCA</b>完整保留 Anchor 与最近窗口，把淘汰帧压成 6-token 轨迹摘要，兼顾局部配准与长程一致。',
      componentId: 'hero-new',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: 'Streaming 为什么形成两难',
      navTitle: '核心矛盾',
      badge: 'inf',
      badgeLabel: '问题定义',
      bridge:
        '先定义任务：输入是一条只允许向前看的图像流，输出是逐帧位姿与稠密深度。序列变长后，Mask 决定当前帧究竟能看见哪些历史：“完整保留”让重 token 持续增长，“只看最近”又切断远期参照；下一章再回答哪些内容值得长期保留。',
      analogy: {
        title: '真实校园漫游：一边拍摄，一边长出轨迹与点云',
        text: '拍摄者沿校园道路前进，每张图像都会贡献相机位姿和深度；右侧小地图同步累积轨迹与稀疏点云。走得越远，历史怎样保存就越会影响整张地图能否留在同一坐标参照中。',
        componentId: 'campus-walk-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '拖长同一段序列：看 Mask 怎样改变可见历史与状态规模',
          desc:
            '只拖动一个序列长度滑杆，三行同步更新 Full Causal、Sliding Window 与 GCA：先看因果 Mask 允许读取哪些过去帧，再看完整 image token、6-token Memory 与长程参照怎样变化。离线 Global 会读取未来，因此不放进这组三种在线策略；可见性也不等于精度排名、连续误差曲线或显存实测。',
          componentId: 'streaming-tradeoff',
          role: 'primary',
          evidenceLabel: '论文机制 + 教学示意',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '四种注意力模式分别能看见哪些帧',
          desc:
            '切换 Global、Full Causal、Sliding Window 与 GCA，直接读取注意力 Mask：Global 双向看全局，Full Causal 只看过去，滑窗只留近邻，而 GCA 还保留锚点和远帧的轻量轨迹上下文。',
          componentId: 'attention-patterns',
          role: 'supplementary',
          evidenceLabel: '论文 Figure 3 · Attention Mask 对比',
          figure: '/images/figure-3-attention.png',
          figureCaption:
            '论文 Figure 3：四种注意力 Mask。来源：Chen et al., arXiv:2604.14141v2，CC BY 4.0；为网页展示进行了 PDF→PNG 格式转换。',
        },
      ],
      insight: '本章定位了状态难题：真正的问题不是简单地“多记或少记”，而是有限状态中应该留下哪些仍能约束几何的历史。',
      takeaways: [
        { icon: '📷', title: '因果输入', desc: '第 t 帧只能读取当前帧与过去帧，不能借用未来信息。' },
        { icon: '🧱', title: '全历史代价', desc: '每帧都保留完整图像 token，会让缓存与计算持续增长。' },
        { icon: '🪟', title: '纯滑窗短板', desc: '近邻信息充足，但远期坐标参照会随窗口移动而消失。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: 'GCA 怎样组织一帧和整段历史',
      navTitle: 'GCA 组织',
      badge: 'both',
      badgeLabel: '核心机制',
      bridge:
        '上一章说明“全记”和“只留近邻”都不理想；本章回答该记什么。先拆开一帧的 token 组成，再沿时间轴放入 Anchor、Window、Trajectory Memory，最后比较三类 context 各自的职责和生命周期。',
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '点击三类 context：同步看一帧组成、时间覆盖与几何职责',
          desc:
            '按固定顺序阅读三层图：①一帧由 M image + c camera + a learnable anchor + 4r register 组成；②三类 context 覆盖不同时间段；③当前选择保留什么、负责什么、保留多久、缺失会怎样。Memory 是直接丢弃 M 而非池化成 6；a 不等于 Anchor frames，4r 也没有论文规定的逐个手工语义。',
          componentId: 'gca-timeline',
          role: 'primary',
          evidenceLabel: '论文机制',
        },
      ],
      insight: '先区分“token 类型”，再区分“历史放在哪里”：M 承载稠密图像特征，c 是 camera token，a 是 learnable anchor token，4r 是 register tokens；Anchor、Window 与 Memory 则规定这些内容的保留周期和几何职责。',
      formula: {
        label: '训练期坐标规范化',
        lead: '训练期尺度规范化：论文用 Anchor 帧真值点到原点的平均距离定义规范尺度。',
        unicode: 's = (1/|X̄_anchor|) Σₓ∈X̄_anchor ‖x‖₂；D′ = D/s，t′ = t/s',
        symbols: [
          { sym: 's', desc: '由 Anchor 帧真值点云计算出的规范尺度。' },
          { sym: 'X̄_anchor', desc: 'Anchor 帧的真值点云集合。' },
          { sym: 'D', desc: '深度；用 s 归一化到统一尺度。' },
          { sym: 't', desc: '相机平移；与深度同除以 s，旋转不做尺度归一化。' },
        ],
      },
      takeaways: [
        { icon: '🧩', title: '一帧的组成', desc: 'M 保留稠密视觉信息；c 是 camera token，a 是 learnable anchor token，4r 是 register tokens。' },
        { icon: '🗂️', title: '保留规则', desc: 'Anchor 与最近 Window 保存完整 M+6；普通旧帧在 Memory 中只保存 c+a+4r。' },
        { icon: '🧭', title: '几何分工', desc: 'Anchor 给固定参照，Window 给近期稠密重叠，Memory 给有序的长程轨迹线索。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '旧帧变轻后，缓存怎样增长',
      navTitle: '缓存复杂度',
      badge: 'inf',
      badgeLabel: '复杂度',
      bridge:
        '上一章已经说明普通旧帧为何只留下 6 个 context token；现在把这条保留规则代入整段序列，量化 Full Causal 与 GCA 的总状态和边际增长。',
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '把序列拉长：精确比较两种状态规模',
          desc:
            '拖动序列长度 T，比较 Full Causal 的 T(M+6) 与 GCA 的 (n+k)M+6T。论文复杂度示例 n=3、k=16、T=10000，与默认推理窗口 k=64 分开展示，避免混用实验条件。',
          componentId: 'memory-complexity-exact',
          role: 'primary',
          evidenceLabel: '公式推导',
        },
      ],
      insight: 'GCA 没有删除完整时间历史：它把淘汰帧的边际增长从 M+6 降到 6，但总状态仍含随 T 线性增长的 6T。',
      formula: {
        label: '复杂度公式',
        lead: '固定 n 和 k 后，昂贵的 image-token 项不再随 T 增长，轻量轨迹摘要仍会累积。',
        unicode: 'N<sub>GCA</sub> = (n+k)M + 6T；N<sub>causal</sub> = T(M+6)',
        symbols: [
          { sym: 'N_GCA', html: 'N<sub>GCA</sub>', desc: 'GCA 处理 T 帧后保留的上下文 token 总数。' },
          { sym: 'N_causal', html: 'N<sub>causal</sub>', desc: 'Full Causal 处理 T 帧后保留的上下文 token 总数。' },
          { sym: 'T', desc: '已经处理的总帧数。' },
          { sym: 'M', desc: '每帧 image token 数；论文增长率示例取 M≈500。' },
          { sym: 'n', desc: '固定 Anchor frame 数；一万帧示例取 n=3。' },
          { sym: 'k', desc: 'Pose-reference Window 大小；复杂度示例取 16，默认推理取 64。' },
        ],
      },
      takeaways: [
        { icon: '🧩', title: '完整帧', desc: 'Anchor 或最近窗口中的一帧保留 M+6 个 token。' },
        { icon: '✂️', title: '离窗压缩', desc: '普通帧离窗后丢弃 M 个 image token，只保留 6 个 context token。' },
        { icon: '📐', title: '约 80×', desc: '当 M≈500 时，这是每个淘汰帧 token 增长率的近似差异，不是总显存倍数。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '三层记忆怎样落进完整系统',
      navTitle: '完整系统',
      badge: 'trn',
      badgeLabel: '结构进阶',
      bridge:
        '上一章量化了状态规模，但还没有说明状态如何被网络读写。本章先跟随一帧完成预测，再分别操作长序列训练、Video RoPE 与动态 KV 缓存。',
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '点击五个阶段：跟随一帧完成预测并更新缓存',
          desc:
            '按阶段查看当前帧 token 如何经过帧内注意力、读取三类 GCA 上下文，并由 Camera Head 与 Depth Head 输出相机位姿和稠密深度；缓存更新发生在跨帧状态侧。',
          componentId: 'gct-pipeline',
          role: 'primary',
          evidenceLabel: '论文架构',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '拖动当前相机：看训练轨迹怎样从 24 延伸到 320 views',
          desc:
            '沿轨迹拖动橙色相机，观察 Streaming stage 的训练序列从 24 线性延伸到 320 views，以及最近窗口怎样随当前相机移动。窗口内的代表帧同时展开成对几何监督；论文实际对全部 i≠j 帧对施加 Relative Pose Loss，训练窗口 k 随机采样 16–64。',
          componentId: 'training-support',
          role: 'primary',
          evidenceLabel: '论文训练',
        },
        {
          kind: 'module',
          id: '4.3',
          title: '拖动同一个 token：看内容不变而时间身份怎样改变',
          desc:
            '把同一个 token 从 t−4 拖到当前时刻 t：未加入时间位置时，相同内容仍会重合；加入 Video RoPE 后，二维投影中的旋转相位与相对时间间隔同步改变，使注意力能够区分观测先后。投影只作机制示意，不是论文给出的单角度定量模型。',
          componentId: 'video-rope-demo',
          role: 'primary',
          evidenceLabel: '论文时序表示',
        },
        {
          kind: 'module',
          id: '4.4',
          title: '逐页写入 KV：看分页缓存怎样响应动态状态',
          desc:
            '逐次写入新的 KV 页，观察分页布局怎样配合 GCA 的动态追加与淘汰，避免连续缓存反复重分配。论文的约 20 FPS 来自 Paged KV 与 FlashInfer 的组合实现，必须绑定 518×378、≤1,000 帧、k=64、bfloat16 等条件，不能归因于分页单项。',
          componentId: 'paged-kv-demo',
          role: 'primary',
          evidenceLabel: '论文推理工程',
        },
      ],
      formula: {
        label: '训练目标',
        lead: '训练同时约束稠密深度、绝对位姿和局部窗口中的相对位姿。',
        unicode: 'L = λ<sub>depth</sub>L<sub>depth</sub> + λ<sub>abs-pose</sub>L<sub>abs-pose</sub> + λ<sub>rel-pose</sub>L<sub>rel-pose</sub>',
        symbols: [
          { sym: 'L', desc: 'LingBot-Map 的总训练损失。' },
          { sym: 'λ_depth', html: 'λ<sub>depth</sub>', desc: '稠密深度监督项的权重。' },
          { sym: 'L_depth', html: 'L<sub>depth</sub>', desc: '深度值、梯度与预测不确定性相关的监督损失。' },
          { sym: 'λ_abs-pose', html: 'λ<sub>abs-pose</sub>', desc: '绝对相机位姿监督项的权重。' },
          { sym: 'L_abs-pose', html: 'L<sub>abs-pose</sub>', desc: '每帧绝对相机位姿的监督损失。' },
          { sym: 'λ_rel-pose', html: 'λ<sub>rel-pose</sub>', desc: '相对位姿监督项的权重。' },
          { sym: 'L_rel-pose', html: 'L<sub>rel-pose</sub>', desc: '最近窗口内帧对的相对旋转与平移损失。' },
        ],
      },
      takeaways: [
        { icon: '👁️', title: '帧内', desc: 'Frame Attention 独立细化每帧视觉特征。' },
        { icon: '🧠', title: '训练与时序', desc: '渐进训练扩大序列监督，Relative Pose Loss 约束局部帧对，Video RoPE 标记观测先后。' },
        { icon: '⚙️', title: '缓存工程', desc: 'Paged KV 与 FlashInfer 高效处理动态状态；它们不是 GCT 的新网络层。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '论文证据支持什么、不能证明什么',
      navTitle: '证据边界',
      badge: 'both',
      badgeLabel: '结果与反例',
      bridge:
        '机制与复杂度推导只能说明设计为何合理，不能替代实验。本章分别核对 Oxford 长序列和 Table 7 窗口消融，并为每组数据同时写出“支持的结论”与“不能推出的结论”。',
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '切换两组协议：同时读数值、反例与结论边界',
          desc:
            'Oxford 从 320 帧到 3840 帧时，ATE 由 6.42 m 变为 7.11 m，dense 设置报告 20.29 FPS；Table 7 则在独立协议下比较 Window 64 与 Full 的 ATE、RPE、FPS 和显存，并保留 Full 在 RPE-rot 上更好的反例。',
          componentId: 'long-sequence-evidence',
          role: 'primary',
          evidenceLabel: '论文数据 · Oxford / Table 7',
          figure: '/images/figure-5-trajectories.png',
          figureLabel: '论文结果图',
          figurePlacement: 'after',
          figureCaption:
            '论文 Figure 5(a)：Oxford Spires 两段序列的轨迹对比，蓝色为真值、橙色为预测。来源：Chen et al., arXiv:2604.14141v2，CC BY 4.0。',
        },
      ],
      insight: '论文数据支持 GCA 在给定协议下兼顾长程一致性、吞吐与显存，但不代表它在每一个局部指标上都优于 Full。',
      takeaways: [
        { icon: '📏', title: '长序列', desc: 'Oxford 320→3840 帧，ATE 6.42→7.11 m；两个采样点不能外推成连续误差曲线。' },
        { icon: '⚡', title: '运行条件', desc: '20.29 FPS 属于论文指定实验设置，不能脱离分辨率、窗口和实现条件引用。' },
        { icon: '⚖️', title: '保留反例', desc: 'Table 7 中 Full 的 RPE-rot 1.71 优于 Window 64 的 1.93。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '怎样运行，哪些局限性仍需后端补足',
      navTitle: '运行与局限',
      badge: 'both',
      badgeLabel: '运行与局限',
      bridge:
        '上一章确认了论文证据的有效范围，但数据有效不等于已经具备完整 SLAM 后端。最后先用轨迹图比较 Direct 与 VO 怎样展开序列，再把回环、细节保真和测试时精修三项局限性独立列出。',
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '切换 Direct / VO：先看运行轨迹，再检查方法局限性',
          desc:
            '切换运行方式只改变轨迹演示：Direct 连续维护三层状态；VO 把数万帧序列拆成重叠窗口，在边界 reset 并用 Sim(3) 拼接，接缝误差仍可能累积。下方三项局限性始终直接列出，不随运行方式切换。',
          componentId: 'applicability-boundary',
          role: 'primary',
          evidenceLabel: '运行与边界',
        },
      ],
      insight: 'GCT/GCA 解决的是“流式状态怎样组织”；LingBot-Map 仍不是一套包办回环检测、全局图优化和测试时精修的完整 SLAM 后端。',
      takeaways: [
        { icon: '🛣️', title: '先选运行方式', desc: 'Direct 连续维护状态；更长序列可用 VO 重叠窗口拼接，但 Sim(3) 边界误差可能累积。' },
        { icon: '🧱', title: '再检查局限性', desc: '无显式 loop closure、6-token 可能丢细节、无 test-time optimization。' },
        { icon: '🧭', title: '最后记住主线', desc: '关键不是记住一切，而是让不同几何信息按不同生命周期进入流式状态。' },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1dG2PBXEoz',
      title: 'Feed-Forward 3D Model - 前馈式重建模型发展历程',
      reason: '补充 VGGT、CUT3R 等前馈三维重建背景；播放量不高，但主题最直接相关。',
      cover: 'https://i2.hdslb.com/bfs/archive/57a31f2dfb8d2c5eebf4512db01bceac5595d88f.jpg',
      views: '7038播放',
    },
    {
      bvid: 'BV1zY4y1X7UJ',
      title: '如何进行三维重建？从单帧深度估计到完整模型重建',
      reason: '复习相机位姿、深度和点云重建基础。',
      cover: 'https://i0.hdslb.com/bfs/archive/90915a82d6c0591747e35cab19bc424388f86177.jpg',
      views: '4939播放',
    },
    {
      bvid: 'BV17x8jzvEm6',
      title: '15分钟认识注意力与多头注意力',
      reason: '补充理解 GCA 结构化注意力 Mask 所需的 Transformer 基础。',
      cover: 'https://i2.hdslb.com/bfs/archive/c4e6924860fdf1629dec15b08e97d2b19626b630.jpg',
      views: '7.4万播放',
    },
  ],
};
