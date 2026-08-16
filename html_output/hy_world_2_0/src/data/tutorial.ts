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
        { kind: 'module', id: '1.2', title: '四阶段造物管线', desc: '逐幕体验 HY-Pano、WorldNav、WorldStereo 与 WorldMirror 如何把世界种子变成显式三维资产，并展开官方阶段图。', componentId: 'hy-creation-pipeline' },
        { kind: 'module', id: '1.3', title: '生成与重建双路线总图', desc: '选择文本、单图、多视图或视频，观察四阶段生成路线与共享 WorldMirror 重建路线如何汇合；可展开论文 Figure 2。', componentId: 'hy-mission-planner' },
      ],
      insight: '核心不是“一个网络做完所有事”，而是让生成负责扩展观察，让重建负责恢复几何，并根据输入丰富度选择路径。',
      takeaways: [
        { icon: '1', title: '视频会想象', desc: '开放域生成强，但没有显式三维几何保证。' },
        { icon: '2', title: '重建会测量', desc: '多视图一致且可实时渲染，但不会补未观测区域。' },
        { icon: '3', title: '系统做分工', desc: '稀疏输入先生成，丰富输入直接重建。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: 'A+B：先造世界种子，再规划观察路线', badge: 'inf', badgeLabel: '生成阶段',
      bridge: '论文生成路线的前两段先解决“世界大致是什么样”和“还应该去哪里看”。HY-Pano 建立 360 度上下文，WorldNav 把相机预算主动投向盲区。',
      analogy: { title: '先转一圈看全，再绕开障碍补盲区', text: '全景负责建立地图感，路线负责决定下一张真正有价值的照片。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '2.1', title: '全景三层修复扫描仪', desc: '比较显式投影依赖、潜空间隐式映射和 ERP 环形接缝修复；连续拖动扫描线不会闪烁。', componentId: 'hy-panorama' },
        { kind: 'module', id: '2.2', title: '全景数据双源策展镜头', desc: '浏览真实全景与 UE 合成样本，理解真实质感、精确标签与污染过滤为何需要一起设计。', componentId: 'hy-panorama-curation' },
        { kind: 'module', id: '2.3', title: 'WorldNav 五层规划回放', desc: '在五类轨迹间切换，逐层查看 NavMesh、候选采样、碰撞淘汰、连接与修剪，相机最终沿折线逐段转向。', componentId: 'hy-trajectory' },
      ],
      insight: '全景不是最终三维世界，而是后续场景解析和路线规划的世界种子；五类轨迹用不同观察方式补足背面、远端、空洞与顶部盲区。',
      takeaways: [
        { icon: 'A', title: '先补全上下文', desc: '隐式映射减少对精确相机内参的依赖。' },
        { icon: 'B', title: '再分配视角', desc: '常规、环绕、重建感知、漫游与航拍互补。' },
        { icon: 'C', title: '规划受几何约束', desc: '路线必须结合 NavMesh、障碍与可达区域。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: 'C：关键帧与双记忆扩展世界', badge: 'both', badgeLabel: '训练与推理',
      bridge: '路线确定后，WorldStereo 2.0 沿轨迹生成关键帧。难点不只是单帧清晰，而是几十条路线再次看见同一房间时，结构和纹理仍要对应。',
      analogy: { title: '少拍关键照片，并随时对照地图与相册', text: '关键帧保细节，GGM 看全局骨架，SSM++ 找局部参考。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '3.1', title: '关键帧取景沙盘', desc: '自由选择 8 个候选视角中的 3 帧，比较重复度、视角跨度和覆盖结构，理解 Keyframe-VAE 的取舍。', componentId: 'hy-keyframes' },
        { kind: 'module', id: '3.2', title: '记忆调度局', desc: '加载 GGM 全局骨架并选择相关历史视角，比较空间拼接与时间拼接如何改变跨视角一致性；可展开表 8。', componentId: 'hy-memory' },
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
        { icon: 'K', title: '关键帧保真', desc: '减少时间冗余压缩，保留跨视角高频细节。' },
        { icon: 'G', title: 'GGM 守骨架', desc: '用粗几何锚点约束多条路线。' },
        { icon: 'S', title: 'SSM++ 补细节', desc: '检索最相关历史视角做局部对应。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '如何训练：先控制、再记忆、后蒸馏', badge: 'trn', badgeLabel: '训练课程',
      bridge: '论文没有把相机控制、跨轨迹记忆和少步采样一次性硬塞进训练，而是先建立稳定前置能力，再压缩成熟教师。',
      analogy: { title: '先学走路线，再记住场景，最后加快步频', text: '训练顺序一旦颠倒，后面的模块就没有可靠能力可继承。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '4.1', title: '训练课程编排器', desc: '亲自排列领域适配、记忆中训和 DMD 后蒸馏；错误顺序直接显示教师不成熟、参考关系不稳或压缩过早的失败症状。', componentId: 'hy-training-stages' },
        { kind: 'module', id: '4.2', title: 'DMD 分布校准仪', desc: '切换噪声层级并执行教学更新，观察四步学生如何沿真实分数与伪分数之差靠近教师分布。', componentId: 'hy-dmd-lab' },
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
        { icon: '1', title: '先控制', desc: '领域适配建立关键帧空间与相机条件。' },
        { icon: '2', title: '再记忆', desc: '中训加入 GGM 与 SSM++。' },
        { icon: '3', title: '后压缩', desc: '成熟教师才能被蒸馏为四步学生。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: 'D1：WorldMirror 把多视图拉回几何', badge: 'trn', badgeLabel: '前馈重建',
      bridge: '生成的关键帧最终必须变成稳定的相机、点图、深度、法线和 3DGS 属性。WorldMirror 2.0 用共享骨干与多任务头一次前向完成恢复。',
      analogy: { title: '不同尺寸照片共用一把归一化坐标尺', text: '输入可以换分辨率、换视图数、增加几何先验，但共享骨干仍在统一坐标范围内处理 token。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '5.1', title: '跨分辨率位置探针', desc: '切换 L/M/H 分辨率并移动探针，观察整数位置外推为何退化、Normalized RoPE 如何把位置固定在区间内。', componentId: 'hy-resolution' },
        { kind: 'module', id: '5.2', title: 'Any-Modal 架构配线盘', desc: '以多视图图像为必需输入，可选接入位姿、内参和深度先验，再追踪共享骨干与五个输出头；可展开 Figure 12 和官方重建 GIF。', componentId: 'hy-architecture' },
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
        { icon: 'R', title: '位置变插值', desc: '归一化坐标减少训练外分辨率外推。' },
        { icon: 'M', title: '多先验可选', desc: '图像必需，位姿、内参和深度按条件接入。' },
        { icon: 'H', title: '共享骨干多头', desc: '一次前向联合恢复多种几何输出。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: 'D2：对齐、压缩并运行三维资产', badge: 'both', badgeLabel: '资产与运行时',
      bridge: 'WorldMirror 输出的逐帧深度仍有尺度与偏移差异。系统先把它们对齐到全景坐标，再用 3DGS 优化得到紧凑资产，最后交给 WorldLens 运行时。',
      analogy: { title: '先把照片标尺对齐，再删掉重复测量点', text: '几何先统一坐标，之后才有资格在画质、数量和漂浮物之间做资产压缩。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '6.1', title: '高斯预算帕累托实验', desc: '连续调节最大高斯数量和最低 PSNR，在表 9 的配置中寻找可行点，展开原表与官方 Mesh GIF 核对取舍。', componentId: 'hy-composition' },
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
        { icon: 'A', title: '先线性对齐', desc: '把逐帧深度尺度与偏移拉回共同坐标。' },
        { icon: 'G', title: '再压缩高斯', desc: '增密与概率稀疏化共同控制细节和冗余。' },
        { icon: 'W', title: '最后进运行时', desc: '生成阶段与实时交互阶段必须分开表述。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-7', title: '创新、代际与实验：把比较放回协议', badge: 'both', badgeLabel: '贡献与结果',
      bridge: '方法讲完后，再把每项创新接回它解决的旧问题，并在同一任务协议内比较模型。先看能力谱系，再看可自由筛选的模型分簇图。',
      analogy: { title: '比较相机前，先统一拍摄条件', text: '模型、指标、数据集和硬件必须一起选择；不同任务不能揉成一个总分。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '7.1', title: '创新证据链工作台', desc: '选择一个旧问题并切换连接机制，观察规划、记忆、重建与运行时为何不能互相替代；匹配后展开论文证据与外推边界。', componentId: 'hy-innovation-map' },
        { kind: 'module', id: '7.2', title: '模型能力进化图鉴', desc: '先看 HY-World 2.0，再看历代模型与外部谱系；只对资料已报告的能力开放详情，并标注发表时间。', componentId: 'hy-model-evolution' },
        { kind: 'module', id: '7.3', title: '可筛选模型分簇性能图', desc: '在同一图中让每个模型形成一簇，自由选择模型与多个指标；柱顶显示论文原值，柱高只做协议内归一化。', componentId: 'hy-performance-compare' },
      ],
      insight: 'HY-World 2.0 的创新来自完整链路分工，而不是单项指标通吃；性能图只允许在表 4、表 12 或表 14 各自兼容的协议内比较。',
      takeaways: [
        { icon: 'P', title: '问题对应机制', desc: '规划、记忆、重建和运行时各修复不同瓶颈。' },
        { icon: 'C', title: '能力不等于总榜', desc: '谱系图说明覆盖范围，不产生跨任务排名。' },
        { icon: 'D', title: '数据必须带协议', desc: '低优指标、OOM 和非领先结果都要保留。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '证据边界、开源使用与最终判断', badge: 'both', badgeLabel: '阅读收束',
      bridge: '最后不再做连续判题，而是按“论文报告、官方展示、第三方解读、未报告”整理结论。读者可以快速检查一句话能说到哪里，以及还缺什么条件。',
      analogy: { title: '交付世界时附上测量条件与来源标签', text: '数字看论文，产品能力看官方资料，体验看署名观点，未报告就保持未知。', componentId: 'hy-analogy' },
      modules: [
        { kind: 'module', id: '8.1', title: '证据边界仪表盘', desc: '按四种证据层级浏览协议性能、局部效率、Marble 比较、运行时能力、知乎工程直觉与许可证边界，不计分、不连续答题。', componentId: 'hy-evidence-court' },
      ],
      insight: '最稳妥的结论是：HY-World 2.0 把稀疏输入生成、丰富输入重建、显式资产和运行时接到同一工程框架；它仍是分钟级离线世界生产系统，外部闭源模型也缺少统一定量协议。',
      takeaways: [
        { icon: 'E', title: '论文事实', desc: '核心结构、公式、数字与消融回到原文定位。' },
        { icon: 'O', title: '官方状态', desc: '开放模块、演示能力和许可证看当前官方资料。' },
        { icon: 'U', title: '未知保持未知', desc: '未报告不等于不支持，也不等于已经证明。' },
      ],
    },
  ],
};
