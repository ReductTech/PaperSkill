import type { TutorialData } from '../types';
import { assetPath } from '../lib/assetPath';

// Four-minute presentation route. Original figures and official media stay
// primary; widgets are short speaking aids layered on top of them.
export const tutorial: TutorialData = {
  meta: {
    titleEn: 'HorizonStream: Long-Horizon Attention for Streaming 3D Reconstruction',
    titleZh: 'HorizonStream：面向流式三维重建的长时域注意力',
    venue: 'arXiv · 2026',
    authors: 'Chong Cheng et al.',
    affiliation: 'HKUST (Guangzhou) · Horizon Robotics · CASIA · Central South University',
    domain: '流式三维重建 · 长时域注意力 · 相机位姿与稠密深度',
    coreProblem: '流式 3D 重建可以继续处理很长的视频，但历史几何证据会以错误的方式被删除、污染或无限残留，最终造成位姿、深度和尺度漂移。',
    coreInsight: 'HorizonStream 将长序列重建拆成一条清晰的因果链：局部匹配负责可靠性，跨窗口状态负责多时间尺度记忆，MRT 负责统一尺度。核心答案不是记住一切，而是让不同几何证据以不同速度遗忘。',
    keywords: ['48 帧训练', '>10K 帧评测', 'O(1) 持久状态', 'K = K_spatial × K_time'],
  },
  hero: {
    oldMethod: {
      desc: '<b>LingBot-map</b>：官方 KITTI 07 定性对比中，长序列推进后出现更明显的轨迹抖动。',
      figure: assetPath('images/kitti07-lingbot.webp'),
    },
    newMethod: {
      desc: '<b>HorizonStream</b>：用固定大小的持久状态和多时间尺度保留，维持长时几何稳定。',
      figure: assetPath('images/kitti07-horizon.webp'),
    },
  },
  chapters: [
    {
      kind: "chapter",
      id: 'chap-1',
      title: '问题：能处理万帧，不等于万帧稳定',
      badge: 'both',
      badgeLabel: '问题与现象',
      bridge: '开场只回答两个问题：为什么短片段看不出问题？长序列里哪些历史证据被错误地忘掉或保留？先用官方片段建立现象，再给出一句话贡献。',
      analogy: { title: '先看长镜头，再看记忆规则', text: '官方 KITTI 07 对比先把抖动变得可见。网页中的定性动画用于引出问题，不替代 ATE 数值。' },
      modules: [
        {
          kind: "module",
          id: '1.1',
          title: '官方 KITTI 07：能跑和跑得稳是两件事',
          desc: '同一段官方片段并排呈现两种方法的长时轨迹与重建行为，定性差异直接对应论文所讨论的长程稳定性问题。',
          componentId: 'chap01-synchronized-comparison',
        },
      ],
      insight: '流式重建真正的考验不是处理几百帧，而是几千上万帧后还能否保持位姿、深度和点云的一致。',
      formula: {
        lead: '长序列可处理，不等于长时几何稳定。',
        unicode: '支持更长输入 ≠ 长时几何稳定',
        symbols: [
          { sym: 'ATE', desc: '绝对轨迹误差，必须在相同数据与协议下比较，越低越好。' },
          { sym: '长序列', desc: '错误会跨窗口传播，短片段上的小偏差会被逐步放大。' },
        ],
      },
      takeaways: [],
    },
    {
      kind: "chapter",
      id: 'chap-2',
      title: '切入点：让不同几何证据拥有不同寿命',
      badge: 'both',
      badgeLabel: '核心切入点',
      bridge: '滑窗会硬丢掉旧结构，无门控递归会积累噪声，因果注意力还可能形成 attention sink。HorizonStream 的切入点是把影响拆为空间可靠性和时间保留两个因子。',
      analogy: { title: '局部线索和全局尺度不是同一种记忆', text: '镜头移开后，局部匹配很快失效；场景结构和尺度却需要跨越很多窗口继续存在。' },
      modules: [
        {
          kind: "module",
          id: '2.1',
          title: 'Figure 1：四种旧机制如何失稳',
          desc: '原论文 Figure 1 对比四类影响核：滑窗硬截断、周期刷新、attention sink、无门控递归。共同问题是让不同寿命的几何证据共用一种忘法。',
          componentId: 'chap03-pathology-inspector',
        },
        {
          kind: "module",
          id: '2.2',
          title: '影响核：空间精度 × 时间续航',
          desc: '短动画把论文的核心抽象变成可读的因果链：空间因子决定当前匹配信不信，时间因子决定过去证据记多久。',
          componentId: 'chap04-kernel-composer',
          figure: assetPath('images/fig-1-influence-kernels.png'),
        },
      ],
      insight: '贡献不是把缓存做得更大，而是把“当前对应是否可靠”和“历史应该保留多久”拆成两个可学习的几何问题。',
      formula: {
        lead: '历史几何证据的影响由空间可靠性和时间保留共同决定。',
        unicode: 'K(t,i) = K_spatial(t,i) · K_time(t,i)',
        symbols: [
          { sym: 'K_spatial', desc: '窗口内的 3D 对应可靠性，由局部注意力处理。' },
          { sym: 'K_time', desc: '跨窗口的证据保留，由几何线性注意力处理。' },
        ],
      },
      takeaways: [],
    },
    {
      kind: "chapter",
      id: 'chap-3',
      title: 'Pipeline：Local → Linear → MRT',
      badge: 'both',
      badgeLabel: 'Pipeline',
      bridge: '不要先背模块名。沿原论文 Figure 3 看一帧：RGB Token 进入局部窗口，可靠匹配被筛选，长期几何写入固定状态，MRT 与位姿融合读出可度量的三维结果。',
      analogy: { title: '一帧只走一条因果路径', text: '当前帧只能使用当前和过去；它经过局部匹配、长期状态和度量读出，最终得到位姿、深度与重建。' },
      modules: [
        {
          kind: "module",
          id: '3.1',
          title: '原 Figure 3：从 RGB 到三维重建的完整数据流',
          desc: '完整保留论文 Figure 3。局部窗口、持久状态、MRT 与位姿融合在同一条数据流中协同工作。',
          componentId: 'chap08-pipeline-hotspots',
        },
      ],
      insight: 'Pipeline 的分工很清楚：Local 管当前窗口的精确对应，Linear 管跨窗口的多尺度记忆，MRT 管尺度与位姿的可度量读出。',
      formula: {
        lead: '一帧从 RGB Token 经过局部匹配和长期状态，最终读出位姿、深度与点云。',
        unicode: 'RGB tokens → Local(K_spatial) → Linear(S_t, K_time) → MRT + pose fusion → pose + depth → 3D reconstruction',
        symbols: [
          { sym: 'S_t', desc: '大小不随序列长度增长的持久几何状态。' },
          { sym: 'MRT', desc: '从持久几何中读出度量尺度的特殊 Token。' },
        ],
      },
      takeaways: [],
    },
    {
      kind: "chapter",
      id: 'chap-4',
      title: 'Geometric Linear Attention：固定状态中的多时间尺度',
      badge: 'both',
      badgeLabel: 'GLA',
      bridge: '先讲最长程的关键：状态大小固定，但每个通道的衰减率不同。这样局部对应、场景结构和全局尺度可以拥有不同的有效记忆期限。',
      analogy: { title: '同一个抽屉，放不同保质期的证据', text: '低保留通道很快清空，中保留通道维持结构，高保留通道留下尺度和全局几何。' },
      modules: [
        {
          kind: "module",
          id: '4.1',
          title: 'Geometric Linear Attention：固定状态，逐通道遗忘',
          desc: '状态更新依次经历 S_(t−1) 衰减、当前几何写入与 q_t 读取。低 γ 通道快速遗忘局部匹配，高 γ 通道保留结构与尺度。',
          componentId: 'chap05-state-update',
        },
      ],
      insight: '通道级 γ 把“不要无限累积”与“不要一刀切丢弃”同时实现：旧证据指数衰减，长期结构仍有稳定通道承载。',
      formula: {
        lead: '固定状态的外框不增长，内容按通道衰减并持续写入。',
        unicode: 'S_t = diag(γ_t) S_(t−1) + φ(k_t) ṽ_tᵀ,   0 ≤ γ_t < 1',
        symbols: [
          { sym: 'γ_t', desc: '逐通道保留率；低值对应短寿命，高值对应长寿命。' },
          { sym: 'S_t', desc: '固定大小的递推几何状态，带来近似线性时间和常数内存。' },
        ],
      },
      takeaways: [],
    },
    {
      kind: "chapter",
      id: 'chap-5',
      title: 'Local 过滤对应，MRT 统一尺度',
      badge: 'both',
      badgeLabel: 'Local + MRT',
      bridge: '短程几何不能交给长期状态直接吞下去：Local Attention 先用 head-wise gate 和时空 RoPE 过滤噪声，再由 MRT 从长寿命通道读出统一尺度。',
      analogy: { title: '先判断这条线索可信，再用同一把尺读三维', text: '可靠性门控负责“信不信”，MRT 负责“用什么尺度解释”。两个动作分别对应局部精度和全局一致性。' },
      modules: [
        {
          kind: "module",
          id: '5.1',
          title: 'Geometric Local Attention：先把不可靠匹配挡住',
          desc: '逐头可靠性门控压低噪声匹配，时空 RoPE 同时编码时间、高度与宽度，减少相似纹理的相对位置歧义。',
          componentId: 'chap06-head-gate',
        },
        {
          kind: "module",
          id: '5.2',
          title: 'MRT：同一把尺同时校准平移和深度',
          desc: 'MRT 从持久几何读出正尺度，同一个 ŝ 同时校准平移与深度，多个位姿 Token 形成窗口级共识。',
          componentId: 'chap07-metric-scale',
        },
      ],
      insight: '三个核心动作可以压成一句话：Local 判断信不信，Linear 决定记多久，MRT 决定怎样用同一把尺读出三维结果。',
      formula: {
        lead: 'Local 过滤不可靠对应，Linear 保存多种寿命，MRT 统一三维尺度。',
        unicode: 'K = K_spatial · K_time<br />γ_head = σ(g_head),  RoPE(t,h,w)<br />ŝ = exp(g(z_metric));  t̂ = ŝ·t̂_raw;  D̂ = ŝ·D̂_raw',
        symbols: [
          { sym: 'γ_head', desc: '每个注意力头的可靠性门控。' },
          { sym: 'RoPE(t,h,w)', desc: '时间、高度、宽度三轴的相对位置编码。' },
          { sym: 'ŝ', desc: 'MRT 读出的正尺度，同步校准平移与深度。' },
        ],
      },
      takeaways: [],
    },
    {
      kind: "chapter",
      id: 'chap-6',
      title: '实验与边界：长序列优势并非无条件保证',
      badge: 'inf',
      badgeLabel: '证据与边界',
      bridge: '实验按证据链展开：先看跨 benchmark 的定量性能，再切到官方定性轨迹和重建图，随后用 Table 6 做模块消融，最后用 Figure 10 交代边界。',
      analogy: { title: '1000 帧才看得出谁真的在工作', text: '短序列差距可能很小，长序列会放大错误记忆、局部匹配和尺度读出的差异。' },
      modules: [
        {
          kind: "module",
          id: '6.1',
          title: '定量性能对比：跨基准的 ATE 证据',
          desc: '默认先展示 VBR、Oxford Spires 和 KITTI 的 ATE 对比；再切换到原论文 Figure 4/5 与官方片段观察定性差异。',
          componentId: 'chap09-streaming-evidence',
        },
        {
          kind: "module",
          id: '6.2',
          title: '消融实验：去掉 Linear 或 Local 后误差放大',
          desc: 'Table 6 在 80 / 200 / 1000 帧比较完整模型、去掉 Linear、去掉 Local 等设置，回答每个记忆部件是否真的贡献长序列稳定性。',
          componentId: 'chap09-ablation-table',
        },
        {
          kind: "module",
          id: '6.3',
          title: 'Figure 10：固定状态不是无限细节',
          desc: '原论文失败案例显示，重复访问、视觉歧义和动态前景仍可能污染几何。固定状态可以继续与稀疏关键帧检索、动态静态分解和不确定性写入结合。',
          componentId: 'chap10-boundary-check',
          figure: assetPath('images/fig-10-failure-cases.png'),
        },
      ],
      insight: '定量、定性和消融证据共同支持同一个结论：多时间尺度记忆让长序列误差增长更受控，但固定状态仍有明确边界。',
      takeaways: [],
    },
  ],
};
