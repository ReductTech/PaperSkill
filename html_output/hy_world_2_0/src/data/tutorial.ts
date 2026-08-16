import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'HY-World 2.0: A Multi-Modal World Model for Reconstructing, Generating, and Simulating 3D Worlds',
    titleZh: 'HY-World 2.0：用于重建、生成与模拟三维世界的多模态世界模型',
    venue: 'arXiv 2604.14268v1 · 2026',
    authors: 'Team HY-World',
    affiliation: 'Tencent Hunyuan',
    domain: '三维世界模型 · 视频扩散 · 前馈三维重建 · 3D Gaussian Splatting',
    coreProblem: '开放域视频生成会“想象”未见区域，却不稳定保存几何；多视图重建会“测量”真实空间，却无法补齐从未拍到的世界。',
    coreInsight: 'HY-World 2.0 的核心答卷是<b>生成辅助重建</b>：按输入丰富度分流，用四阶段生成链补观察，再用共享前馈重建恢复几何，最终交付可保存、可渲染、可运行的显式三维资产。',
    keywords: ['生成辅助重建', '四阶段管线', '双记忆世界扩展', '前馈 3DGS'],
  },
  hero: {
    oldMethod: { desc: '视频生成与三维重建各自解决一半问题：前者缺持久几何，后者缺开放域补全。', componentId: 'hy-hero' },
    newMethod: { desc: '作者搭建两条输入路线、四阶段生成链与 WorldMirror 共享重建核心，把想象、测量和资产运行接成一套系统。', componentId: 'hy-hero' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '背景、重要性与论文总答卷', badge: 'inf', badgeLabel: '问题与贡献',
      bridge: '先回答世界模型是什么、为什么需要持久三维、作者完成了哪些工作，以及这些工作取得了什么结果。',
      analogy: { title: '缺照片时补拍，照片够时测量', text: '线索稀少时要<b>想象未见区域</b>，观察充分时要<b>忠实恢复空间</b>；两种目标不能混为同一件事。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '1.1', title: '论文阅读罗盘：背景、价值、工作与结果', desc: '先切换四个阅读问题，再用范式压力测试分清画面生成、真实重建与持久三维。', componentId: 'hy-world-model-basics' },
        { kind: 'module', id: '1.2', title: '四阶段造物管线', desc: '逐步播放全景、规划、扩展和重建四个阶段。', componentId: 'hy-creation-pipeline' },
        { kind: 'module', id: '1.3', title: '生成与重建双路线总图', desc: '点击输入卡，查看四种输入如何汇入同一 WorldMirror 2.0。', componentId: 'hy-mission-planner' },
      ],
      insight: '核心不是“一个网络做完所有事”，而是让生成负责扩展观察，让重建负责恢复几何，并根据输入丰富度选择路径。',
      takeaways: [
        { icon: '🎬', title: '视频会想象', desc: '开放域生成强，但没有显式三维几何保证。' },
        { icon: '📐', title: '重建会测量', desc: '多视图一致且可实时渲染，但不会补未观测区域。' },
        { icon: '🧩', title: '系统做分工', desc: '稀疏输入先生成，丰富输入直接重建。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '工作 A+B：建立世界种子并主动规划视角', badge: 'inf', badgeLabel: '全景与规划',
      bridge: '作者先解决“世界看不全”，再解决“下一张图该拍哪里”：HY-Pano 补 360° 上下文，WorldNav 把镜头预算投向盲区。',
      analogy: { title: '先转一圈看全，再绕开障碍补盲区', text: '全景负责建立地图感，路线负责决定下一张真正有价值的照片。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '2.1', title: '全景故障擦除实验', desc: '拖动扫描线，对比投影、潜空间和像素层修复。', componentId: 'hy-panorama' },
        { kind: 'module', id: '2.2', title: '全景数据二维分布地图', desc: '切换数据配方，观察覆盖率与污染风险如何变化。', componentId: 'hy-panorama-curation' },
        { kind: 'module', id: '2.3', title: 'WorldNav 五层规划回放', desc: '逐层淘汰碰撞路线，最后回放相机的真实分段转向。', componentId: 'hy-trajectory' },
      ],
      insight: '全景不是最终三维世界，而是后续场景解析和路线规划的世界种子；五类轨迹用不同观察方式补足背面、远端、空洞与顶部盲区。',
      takeaways: [
        { icon: '🌐', title: '先补全上下文', desc: '隐式映射减少对精确相机内参的依赖。' },
        { icon: '🧭', title: '再分配视角', desc: '常规、环绕、重建感知、漫游与航拍互补。' },
        { icon: '🚧', title: '规划受几何约束', desc: '路线必须结合 NavMesh、障碍与可达区域。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '工作 C：用关键帧与双记忆扩展世界', badge: 'both', badgeLabel: '一致性生成',
      bridge: '路线确定后，作者用 Keyframe-VAE、GGM 与 SSM++ 同时处理关键帧细节、全局骨架和局部对应。',
      analogy: { title: '少拍关键照片，并随时对照地图与相册', text: '关键帧保细节，GGM 看全局骨架，SSM++ 找局部参考。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '3.1', title: '关键帧取景沙盘', desc: '自由选择 8 个候选视角中的 3 帧，比较重复度、视角跨度和覆盖结构，理解 Keyframe-VAE 的取舍。', componentId: 'hy-keyframes' },
        { kind: 'module', id: '3.2', title: 'GGM × SSM++ 双记忆实验', desc: '切换记忆组合，区分全局骨架与局部参考。', componentId: 'hy-memory' },
      ],
      insight: 'GGM 管“大尺度结构不能自相矛盾”，SSM++ 管“局部纹理和对应关系能对上”；两种记忆解决的尺度不同。',
      formula: {
        lead: '全局几何记忆把参考点云和额外视角点云拼成共同骨架。',
        unicode: 'P_glo = [P_ref, P_hat] in R^(N+N_hat)x3',
        symbols: [
          { sym: 'P_glo', desc: '提供给 GGM 的扩展全局点云。' },
          { sym: 'P_ref', desc: '参考全景或参考视角点云。' },
          { sym: 'P_hat', desc: '从额外目标视角采样的点云。' },
        ],
      },
      takeaways: [
        { icon: '📸', title: '关键帧保真', desc: '减少时间冗余压缩，保留跨视角高频细节。' },
        { icon: '🏗️', title: 'GGM 守骨架', desc: '用粗几何锚点约束多条路线。' },
        { icon: '🔍', title: 'SSM++ 补细节', desc: '检索最相关历史视角做局部对应。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: 'WorldStereo 如何训练：先控制、再记忆、后蒸馏', badge: 'trn', badgeLabel: '训练课程',
      bridge: '作者没有一次加入全部能力，而是先建立相机控制，再训练跨路线记忆，最后把成熟教师蒸馏为四步学生。',
      analogy: { title: '先学走路线，再记住场景，最后加快步频', text: '训练顺序一旦颠倒，后面的模块就没有可靠能力可继承。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '4.1', title: '训练课程编排器', desc: '排列三个训练阶段，观察错误顺序造成的失败。', componentId: 'hy-training-stages' },
        { kind: 'module', id: '4.2', title: '从多步教师到四步学生', desc: '切换噪声并执行更新，观察学生分布靠近教师。', componentId: 'hy-dmd-lab' },
      ],
      insight: '四步只描述 WorldStereo 2.0 的扩散采样；全景、规划、重建与资产合成仍属于完整离线系统生命周期。',
      formula: {
        lead: 'DMD 使用教师真实分数与学生伪分数的差异更新少步生成器。',
        unicode: 'grad L_DMD = -E_t[(s_real(x_t,t)-s_fake(x_t,t)) · J_theta]',
        symbols: [
          { sym: 's_real', desc: '冻结教师给出的真实分数函数。' },
          { sym: 's_fake', desc: '随训练更新的学生伪分数函数。' },
          { sym: 'J_theta', desc: '带噪样本对学生参数的导数项。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '先控制', desc: '领域适配建立关键帧空间与相机条件。' },
        { icon: '🧠', title: '再记忆', desc: '中训加入 GGM 与 SSM++。' },
        { icon: '⚡', title: '后压缩', desc: '成熟教师才能被蒸馏为四步学生。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '工作 D1：WorldMirror 把多视图拉回统一几何', badge: 'trn', badgeLabel: '前馈重建',
      bridge: '生成得到的新观察和真实多视图最终都需要被测量：WorldMirror 用一次共享前向恢复相机、几何和 3DGS 属性。',
      analogy: { title: '不同尺寸照片共用一把归一化坐标尺', text: '输入可以换分辨率、换视图数、增加几何先验，但共享骨干仍在统一坐标范围内处理 token。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '5.1', title: '同一物体的跨分辨率坐标实验', desc: '切换分辨率，比较整数索引与归一化坐标。', componentId: 'hy-resolution' },
        { kind: 'module', id: '5.2', title: '一次重建，五类几何产物', desc: '选择先验并运行共享骨干；五个输出头会生成可检查的小示意图。', componentId: 'hy-architecture' },
      ],
      insight: '跨分辨率稳定性不是单靠位置编码：Normalized RoPE、深度-法线耦合、Depth Mask Head、token budget 和并行策略共同作用。',
      formula: {
        lead: 'patch 中心被映射到固定归一化坐标范围。',
        unicode: 'x_hat_i=(2i+1)/H_p-1,  y_hat_j=(2j+1)/W_p-1',
        symbols: [
          { sym: 'x_hat_i', desc: '高度方向第 i 个 patch 的归一化中心。' },
          { sym: 'y_hat_j', desc: '宽度方向第 j 个 patch 的归一化中心。' },
          { sym: 'H_p, W_p', desc: '输入对应的 patch 网格尺寸。' },
        ],
      },
      takeaways: [
        { icon: '📍', title: '位置变插值', desc: '归一化坐标减少训练外分辨率外推。' },
        { icon: '🧩', title: '多先验可选', desc: '图像必需，位姿、内参和深度按条件接入。' },
        { icon: '🌲', title: '共享骨干多头', desc: '一次前向联合恢复多种几何输出。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '工作 D2：对齐、压缩并运行三维资产', badge: 'both', badgeLabel: '资产与运行时',
      bridge: '恢复几何不是终点：作者继续对齐深度、压缩高斯，再把可交付资产接入 WorldLens 光照、碰撞与漫游。',
      analogy: { title: '先把照片标尺对齐，再删掉重复测量点', text: '几何先统一坐标，之后才有资格在画质、数量和漂浮物之间做资产压缩。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '6.1', title: '3DGS 配方逐步重建实验', desc: '切换五个真实配置，同时检查细节、漂浮物和高斯数量。', componentId: 'hy-composition' },
        { kind: 'module', id: '6.2', title: 'WorldLens 运行时实验', desc: '切换 IBL 光照、碰撞代理和角色漫游，区分“资产已经生成后的实时交互”与“完整世界实时生成”。', componentId: 'hy-worldlens-lab' },
      ],
      insight: 'MaskGaussian 以可学习存在概率抑制冗余与漂浮物；WorldLens 负责资产进入运行时后的光照、碰撞和角色，不负责重新生成世界。',
      formula: {
        lead: '高斯存在掩码参与渲染，并与颜色、几何和正则项共同优化。',
        unicode: 'c(x)=sum_k M_k c_k sigma_k T_k;  L_GS=L_color+L_geo+L_reg+L_mask',
        symbols: [
          { sym: 'M_k', desc: '第 k 个高斯的可学习存在掩码。' },
          { sym: 'T_k', desc: '按深度顺序累积的透射率。' },
          { sym: 'L_GS', desc: '3DGS 合成阶段的总训练目标。' },
        ],
      },
      takeaways: [
        { icon: '📏', title: '先线性对齐', desc: '把逐帧深度尺度与偏移拉回共同坐标。' },
        { icon: '✨', title: '再压缩高斯', desc: '增密与概率稀疏化共同控制细节和冗余。' },
        { icon: '🎮', title: '最后进运行时', desc: '生成阶段与实时交互阶段必须分开表述。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-7', title: '创新证据与实验结果：这些工作真的解决了什么', badge: 'both', badgeLabel: '贡献与验证',
      bridge: '先把每项作者工作接回它要解决的旧问题，再用消融、协议内指标和代际对比检查效果。',
      analogy: { title: '比较相机前，先统一拍摄条件', text: '模型、指标、数据集和硬件必须一起选择；不同任务不能揉成一个总分。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '7.1', title: '作者工作与创新证据链', desc: '选择旧问题，匹配作者提出或升级的工作，并查看贡献类型、结果与证据边界。', componentId: 'hy-innovation-map' },
        { kind: 'module', id: '7.2', title: '模型能力进化图鉴', desc: '用统一矩阵比较 HY 谱系与其它模型的已报告能力。', componentId: 'hy-model-evolution' },
        { kind: 'module', id: '7.3', title: '协议内分簇图与跨论文工程记录', desc: '选择模型与指标；跨论文记录始终保留硬件和输入条件。', componentId: 'hy-performance-compare' },
      ],
      insight: 'HY-World 2.0 的创新来自完整链路分工，而不是单项指标通吃；表 4、表 12、表 14 可以在各自协议内画比例图，跨论文资源记录只能带完整条件并列阅读。',
      takeaways: [
        { icon: '🔗', title: '问题对应机制', desc: '规划、记忆、重建和运行时各修复不同瓶颈。' },
        { icon: '🧬', title: '能力不等于总榜', desc: '谱系图说明覆盖范围，不产生跨任务排名。' },
        { icon: '🧪', title: '数据必须带协议', desc: '低优指标、OOM 和非领先结果都要保留。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '最终判断、官方功能与逐篇第三方评论', badge: 'both', badgeLabel: '结论与阅读',
      bridge: '最后分别回答论文报告了什么、官方当前展示了什么功能，以及两篇中文文章如何评价这项工作的意义。',
      analogy: { title: '交付世界时附上测量条件、功能说明与评论索引', text: '实验数字回到论文，规划与重建功能看官方展示，行业意义阅读署名文章自己的观点。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '8.1', title: '结论地图、官方功能与逐篇评论', desc: '切换论文证据与官方功能展示，并分别展开两篇第三方文章的独立观点。', componentId: 'hy-evidence-court' },
        { kind: 'module', id: '8.2', title: '版本星轨与完整更新日志', desc: '切换最近三个大型版本，快速展示每轮调整的重点模块与审查目标；完整 TUTORIAL_CHANGELOG.md 默认折叠，现场需要追溯时再展开。', componentId: 'hy-update-log' },
      ],
      insight: '最稳妥的结论是：HY-World 2.0 的贡献不在一个万能总分，而在把开放域观察生成、前馈几何恢复、紧凑显式资产和运行时接成完整链路；它仍是分钟级离线世界生产系统。',
      takeaways: [
        { icon: '📖', title: '论文事实', desc: '核心结构、公式、数字与消融回到原文定位。' },
        { icon: '🌐', title: '官方功能', desc: '规划、重建、Mesh 与 WorldLens 展示回到项目页和仓库。' },
        { icon: '💬', title: '逐篇评论', desc: '技术拆解与应用评价保留各自作者、观点和边界。' },
      ],
    },
  ],
};
