import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'HY-World 2.0: A Multi-Modal World Model for Reconstructing, Generating, and Simulating 3D Worlds',
    titleZh: 'HY-World 2.0：用于重建、生成与模拟三维世界的多模态世界模型',
    venue: 'arXiv 2604.14268v1 · 2026',
    authors: 'Team HY-World',
    affiliation: 'Tencent Hunyuan',
    domain: '三维世界模型 · 视频扩散 · 前馈三维重建 · 3D Gaussian Splatting',
    coreProblem: '视频生成善于补出未观测区域，却缺少显式几何；3DGS 重建能稳定保存空间，却只能恢复已经拍到的地方。',
    coreInsight: 'HY-World 2.0 用<b>生成辅助重建</b>把两类能力串联起来：稀疏输入先扩展观察，丰富输入直接恢复几何，最终都落到可保存、可渲染、可交互的显式三维资产。',
    keywords: ['生成辅助重建', '四阶段管线', '双记忆世界扩展', '前馈 3DGS'],
  },
  hero: {
    oldMethod: { desc: '视频生成可以想象，却容易发生视角漂移；传统重建忠于观察，却不会补全未见空间。', componentId: 'hy-hero' },
    newMethod: { desc: '先生成缺失观察，再以前馈重建和 3DGS 把多视图拉回统一几何，并保留纯重建支路。', componentId: 'hy-hero' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '为什么需要“生成辅助重建”', badge: 'inf', badgeLabel: '概念与总览',
      bridge: '先比较视频生成、传统 3DGS 与前馈 3DGS 的能力边界，再看 HY-World 2.0 为什么不是单个大模型，而是一套按输入条件分流的世界生产系统。',
      analogy: { title: '缺照片时补拍，照片够时测量', text: '线索稀少时要<b>想象未见区域</b>，观察充分时要<b>忠实恢复空间</b>；两种目标不能混为同一件事。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '1.1', title: '世界模型概念实验室', desc: '切换像素视频、动作条件世界、显式三维资产与混合系统，用遮挡、回访和动作压力测试理解不同范式。', componentId: 'hy-world-model-basics' },
        { kind: 'module', id: '1.2', title: '四阶段造物管线', desc: '每次清空画布演示一个子系统：WorldStereo 的相机沿真实贝塞尔曲线移动并随切线转向，四个曲线取景点分别连接到对应目标关键帧。', componentId: 'hy-creation-pipeline' },
        { kind: 'module', id: '1.3', title: '生成与重建双路线总图', desc: '点击显式标注的输入任务卡，在紧凑路径图中切换文本、单图、多视图和视频；两条路线共享同一个 WorldMirror 2.0 落点。', componentId: 'hy-mission-planner' },
      ],
      insight: '核心不是“一个网络做完所有事”，而是让生成负责扩展观察，让重建负责恢复几何，并根据输入丰富度选择路径。',
      takeaways: [
        { icon: '🎬', title: '视频会想象', desc: '开放域生成强，但没有显式三维几何保证。' },
        { icon: '📐', title: '重建会测量', desc: '多视图一致且可实时渲染，但不会补未观测区域。' },
        { icon: '🧩', title: '系统做分工', desc: '稀疏输入先生成，丰富输入直接重建。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: 'A+B：先造世界种子，再规划观察路线', badge: 'inf', badgeLabel: '生成阶段',
      bridge: '论文生成路线的前两段先解决“世界大致是什么样”和“还应该去哪里看”。HY-Pano 建立 360 度上下文，WorldNav 把相机预算主动投向盲区。',
      analogy: { title: '先转一圈看全，再绕开障碍补盲区', text: '全景负责建立地图感，路线负责决定下一张真正有价值的照片。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '2.1', title: '全景故障擦除实验', desc: '同一 ERP 场景只绘制一次，扫描线右侧局部叠加焦距拉伸、周期断边或颜色跳变；拖到 0% / 100% 可明确对应三种修复层级。', componentId: 'hy-panorama' },
        { kind: 'module', id: '2.2', title: '全景数据二维分布地图', desc: '在“常见现实→稀有想象”与“真实采集→可控合成”两条轴上切换四种数据配方，观察十二类场景、质量门、学到的先验与生成表现。', componentId: 'hy-panorama-curation' },
        { kind: 'module', id: '2.3', title: 'WorldNav 五层规划回放', desc: '所有路线先以虚线候选出现，再由 Ray-casting 逐条淘汰；幸存路线保持虚线直到最终连接完成，只有执行回放时变成实线。', componentId: 'hy-trajectory' },
      ],
      insight: '全景不是最终三维世界，而是后续场景解析和路线规划的世界种子；五类轨迹用不同观察方式补足背面、远端、空洞与顶部盲区。',
      takeaways: [
        { icon: '🌐', title: '先补全上下文', desc: '隐式映射减少对精确相机内参的依赖。' },
        { icon: '🧭', title: '再分配视角', desc: '常规、环绕、重建感知、漫游与航拍互补。' },
        { icon: '🚧', title: '规划受几何约束', desc: '路线必须结合 NavMesh、障碍与可达区域。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: 'C：关键帧与双记忆扩展世界', badge: 'both', badgeLabel: '训练与推理',
      bridge: '路线确定后，WorldStereo 2.0 沿轨迹生成关键帧。难点不只是单帧清晰，而是几十条路线再次看见同一房间时，结构和纹理仍要对应。',
      analogy: { title: '少拍关键照片，并随时对照地图与相册', text: '关键帧保细节，GGM 看全局骨架，SSM++ 找局部参考。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '3.1', title: '关键帧取景沙盘', desc: '自由选择 8 个候选视角中的 3 帧，比较重复度、视角跨度和覆盖结构，理解 Keyframe-VAE 的取舍。', componentId: 'hy-keyframes' },
        { kind: 'module', id: '3.2', title: 'GGM × SSM++ 双记忆实验', desc: '分别定义 GGM 与 SSM++，并把后者拆成目标查询、3D FoV 评分、选择性检索、横向 2W 拼接和共享时间索引，再观察结构与纹理如何分工。', componentId: 'hy-memory' },
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
      kind: 'chapter', id: 'chap-4', title: '如何训练：先控制、再记忆、后蒸馏', badge: 'trn', badgeLabel: '训练课程',
      bridge: '论文没有把相机控制、跨轨迹记忆和少步采样一次性硬塞进训练。原因是 DMD 只能压缩已经成熟的教师：教师先学会精确控制与跨轨迹一致性，四步学生才有稳定分布可继承。',
      analogy: { title: '先学走路线，再记住场景，最后加快步频', text: '训练顺序一旦颠倒，后面的模块就没有可靠能力可继承。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '4.1', title: '训练课程编排器', desc: '亲自排列领域适配、记忆中训和 DMD 后蒸馏；错误顺序直接显示教师不成熟、参考关系不稳或压缩过早的失败症状。', componentId: 'hy-training-stages' },
        { kind: 'module', id: '4.2', title: '从多步教师到四步学生', desc: '先看蒸馏动机与三步过程，再切换噪声层级并执行 DMD 教学更新，理解分数差如何校准少步学生。', componentId: 'hy-dmd-lab' },
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
      kind: 'chapter', id: 'chap-5', title: 'D1：WorldMirror 把多视图拉回几何', badge: 'trn', badgeLabel: '前馈重建',
      bridge: '生成的关键帧最终必须变成稳定的相机、点图、深度、法线和 3DGS 属性。WorldMirror 2.0 用共享骨干与多任务头一次前向完成恢复。',
      analogy: { title: '不同尺寸照片共用一把归一化坐标尺', text: '输入可以换分辨率、换视图数、增加几何先验，但共享骨干仍在统一坐标范围内处理 token。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '5.1', title: '同一物体的跨分辨率坐标实验', desc: '固定同一相对位置并切换 L/M/H，直接比较整数索引进入训练外范围与归一化坐标保持可比的因果差异。', componentId: 'hy-resolution' },
        { kind: 'module', id: '5.2', title: '一次重建，五类几何产物', desc: '在一张从左到右、再进入下一行的大结构图中，为固定三图委托接入 Pose、K、Depth，观察共享骨干如何分流五个输出头；只有带问题的教学候选会被退回，正常候选直接通过。', componentId: 'hy-architecture' },
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
      kind: 'chapter', id: 'chap-6', title: 'D2：对齐、压缩并运行三维资产', badge: 'both', badgeLabel: '资产与运行时',
      bridge: 'WorldMirror 输出的逐帧深度仍有尺度与偏移差异。系统先把它们对齐到全景坐标，再用 3DGS 优化得到紧凑资产，最后交给 WorldLens 运行时。',
      analogy: { title: '先把照片标尺对齐，再删掉重复测量点', text: '几何先统一坐标，之后才有资格在画质、数量和漂浮物之间做资产压缩。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '6.1', title: '3DGS 配方逐步重建实验', desc: '按表 9 的五个真实配置推进配方，并同时查看主场景、墙面细节放大镜与天空区域放大镜，区分删点损失、错误增密、掩码剪枝和非天空增密各自解决的问题。', componentId: 'hy-composition' },
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
      kind: 'chapter', id: 'chap-7', title: '创新、代际与实验：把比较放回协议', badge: 'both', badgeLabel: '贡献与结果',
      bridge: '方法讲完后，再把每项创新接回它解决的旧问题，并在同一任务协议内比较模型。先看能力谱系，再看可自由筛选的模型分簇图。',
      analogy: { title: '比较相机前，先统一拍摄条件', text: '模型、指标、数据集和硬件必须一起选择；不同任务不能揉成一个总分。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '7.1', title: '创新证据链工作台', desc: '选择一个旧问题并切换连接机制，观察规划、记忆、重建与运行时为何不能互相替代；匹配后展开论文证据与外推边界。', componentId: 'hy-innovation-map' },
        { kind: 'module', id: '7.2', title: '模型能力进化图鉴', desc: '先看 HY-World 2.0，再看历代模型与外部谱系；外部谱系压缩为一屏展示，不再横向滑动，只对资料已报告的能力开放详情并标注发表时间。', componentId: 'hy-model-evolution' },
        { kind: 'module', id: '7.3', title: '协议内分簇图与跨论文工程记录', desc: '在“本文 Table 14 / 其它模型公开记录”之间切换：论文内配置按同协议零基线比例绘制，跨论文显存、秒数和 FPS 分组显示并保留全部硬件与测量边界。', componentId: 'hy-performance-compare' },
      ],
      insight: 'HY-World 2.0 的创新来自完整链路分工，而不是单项指标通吃；表 4、表 12、表 14 可以在各自协议内画比例图，跨论文资源记录只能带完整条件并列阅读。',
      takeaways: [
        { icon: '🔗', title: '问题对应机制', desc: '规划、记忆、重建和运行时各修复不同瓶颈。' },
        { icon: '🧬', title: '能力不等于总榜', desc: '谱系图说明覆盖范围，不产生跨任务排名。' },
        { icon: '🧪', title: '数据必须带协议', desc: '低优指标、OOM 和非领先结果都要保留。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '最终判断、观点汇总与资料星图', badge: 'both', badgeLabel: '阅读收束',
      bridge: '贯穿全文后，用四句话收束系统价值、技术抓手、现实边界与外部看法；再按证据层级检查关键结论，最后把论文、代码、演示、权重、文章与相关工作收入可展开资料库。',
      analogy: { title: '交付世界时附上测量条件、来源标签与继续阅读地图', text: '数字看论文，产品能力看官方资料，体验看署名观点，未报告就保持未知。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '8.1', title: '结论地图与继续阅读资料库', desc: '先汇总论文、官方资料和第三方文章能共同支持的四个判断，再浏览证据边界、完成两道不计分快问，并从下拉资料库进入论文、代码、演示、权重、许可证、相关文章与相关论文。', componentId: 'hy-evidence-court' },
        { kind: 'module', id: '8.2', title: '版本星轨与完整更新日志', desc: '切换最近三个大型版本，快速展示每轮调整的重点模块与审查目标；完整 TUTORIAL_CHANGELOG.md 默认折叠，现场需要追溯时再展开。', componentId: 'hy-update-log' },
      ],
      insight: '最稳妥的结论是：HY-World 2.0 把稀疏输入生成、丰富输入重建、显式资产和运行时接到同一工程框架；它仍是分钟级离线世界生产系统，外部闭源模型也缺少统一定量协议。',
      takeaways: [
        { icon: '📖', title: '论文事实', desc: '核心结构、公式、数字与消融回到原文定位。' },
        { icon: '🌐', title: '官方状态', desc: '开放模块、演示能力和许可证看当前官方资料。' },
        { icon: '🌫️', title: '未知保持未知', desc: '未报告不等于不支持，也不等于已经证明。' },
      ],
    },
  ],
};
