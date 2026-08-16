import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'HY-Embodied-0.5: Embodied Foundation Models for Real-World Agents',
    titleZh: '看得准，想得明白，跑得起来',
    venue: 'arXiv:2604.07430 · 2026',
    authors: 'Tencent Robotics X × HY Vision Team',
    affiliation: '腾讯 Robotics X 与混元视觉团队',
    domain: '具身智能 · 多模态基础模型 · 机器人控制',
    coreProblem: '一个能认出马克杯的模型，真的能把它安全放进洗碗机吗？本教程让机器人先失败，再逐层打开 HY-Embodied-0.5 的技术显微镜。',
    coreInsight: '<b>主要贡献：</b>通过模态专属的 MoT 架构、自演化具身后训练和同策略蒸馏，把通用 VLM 的视觉语言能力转化为可部署、可执行的机器人能力。',
    keywords: ['01 看得准', '02 想得明白', '03 跑得起来', '4:00 精讲 / 8–12 分钟完整体验'],
  },
  hero: {
    oldMethod: {
      desc: '通用 VLM 能说出“这是红杯”，却不能直接回答是哪一个、边界在哪里、离我多远，以及从哪里接触。',
      figure: '/images/kitchen-baseline.png',
    },
    newMethod: {
      desc: 'HY-Embodied-0.5 把细粒度感知、具身推理和端侧蒸馏接成闭环，再通过 Action Expert 输出连续机器人动作。',
      figure: '/images/kitchen-hy-embodied.png',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: 'WHY #1：认出红杯，为什么还是抓不住？', badge: 'inf', badgeLabel: '01 看得准',
      bridge: '刚才我们说，目标是让模型“看得准、想得明白、跑得起来”。先从第一步开始：通用 VLM 既然能认出红杯，为什么机械臂还是抓不住？',
      analogy: { title: '找到“刚才喝水的那个”红杯', text: '桌面上同时有红色马克杯、透明玻璃杯和餐具。机器人必须锁定唯一目标，并给出可执行的接触位置。', componentId: 'analogy-1' },
      modules: [
        { kind: 'module', id: '1.1', title: '从“这是红杯”到“从杯柄抓”', desc: '逐层打开定位、边界、深度与抓取点。观察语义识别何时才转化为 <b>actionable perception</b>。<span class="source-ref">论文：具身预训练任务与 §6 Robot Control</span>', componentId: 'perception-explorer' },
      ],
      insight: 'Semantic Recognition ≠ Actionable Perception。机器人需要的不只是物体名称，而是能直接约束物理接触的空间证据。',
      takeaways: [
        { icon: '🎯', title: '先回答“哪一个”', desc: 'Grounding 把语言指代落到具体红杯。' },
        { icon: '✂️', title: '再回答“到哪里”', desc: '分割与局部结构保留杯柄和精确边界。' },
        { icon: '🤏', title: '最后回答“怎么碰”', desc: '深度与可抓取点让感知真正服务机械臂。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '技术显微镜：视觉与语言为什么要分开算？', badge: 'both', badgeLabel: 'MoT 路由',
      bridge: '刚才的失败暴露出视觉容量不足。小模型若让视觉和语言共用同一套 QKV 与 FFN，大量视觉训练会持续改写共享参数。',
      analogy: { title: '一双眼睛看细节，一条指令守约束', text: '视觉分支盯住红杯、杯柄与玻璃杯；语言分支保留“刚才喝水的”“上层”“不要碰倒”等约束。', componentId: 'analogy-3' },
      modules: [
        { kind: 'module', id: '2.1', title: 'Mixture-of-Transformers 参数路由', desc: '切换共享 Transformer 与 MoT，再选择视觉或文本 token，查看它真正激活的 QKV、Attention 与 FFN。<span class="source-ref">论文 §2.2 · Figure 2 / Figure 11</span>', componentId: 'mot-split' },
      ],
      insight: 'MoT 不是简单再加一个视觉网络，也不是动态专家路由：它按模态使用非共享 QKV/FFN，让总容量增长而单 token 不激活全部参数。',
      takeaways: [
        { icon: '🟠', title: '复制视觉参数', desc: '多模态训练前复制 LLM 的 QKV/FFN，并用原权重初始化。' },
        { icon: '🟢', title: '语言参数保留', desc: '文本 token 继续使用原有语言分支与因果注意力。' },
        { icon: '⚖️', title: '总量不等于激活量', desc: 'MoT-2B 约 4B 总参数、约 2B 激活参数。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: 'Attention Mask：图像块究竟能看见谁？', badge: 'inf', badgeLabel: 'Figure 3',
      bridge: '上一站明确了机器人必须看见目标、边界、深度和抓取点；接下来追问这些细节怎样进入模型。先用 MoT 分开视觉与语言的计算，再看 Attention 如何分开可见性规则。',
      analogy: { title: '手电筒照亮同一幅画面的局部关系', text: '同一张图里的视觉块可以彼此查看；换到另一张图或未来文本时，仍必须遵守边界。', componentId: 'analogy-2' },
      modules: [
        { kind: 'module', id: '3.1', title: '双 Mask 对比：为什么图像需要局部全注意力', desc: '上方两个 Mask 同步按 Query 行循环；下方用一张红杯 Patch 图解释为什么同一视觉元素必须双向互看。<span class="source-ref">论文 §2.2 · Figure 3</span>', componentId: 'attention-mask' },
      ],
      insight: 'HY-Embodied 并非简单取消 causal mask，而是为不同模态放入不同的 attention inductive bias。',
      formula: { lead: '讲解级掩码规则（以论文 Figure 3 为依据）：', unicode: 'image query：同一 visual element 内 full attention；其他 query：仅访问当前位置及此前 token', symbols: [{ sym: 'query', desc: '当前正在计算表示的 token。' }, { sym: 'visual element', desc: '一张图像或一个视频帧对应的局部视觉单元。' }] },
      takeaways: [
        { icon: '🟨', title: '视觉局部全注意力', desc: '同一 visual element 的图像块可以双向互看。' },
        { icon: '🟩', title: '全局因果路径', desc: 'latent、文本与输出只访问当前及此前上下文。' },
        { icon: '🚫', title: '不是分割掩码', desc: 'Attention Mask 控制 token 可见性；Segmentation Mask 描述像素归属。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '视觉细节怎样跨过语言语义的鸿沟？', badge: 'trn', badgeLabel: 'Latent + Loss',
      bridge: '局部全注意力保住了空间结构，但“杯柄 patch”仍要连接到“抓住杯柄、避开玻璃杯”的高层语言概念。论文为每张图或视频帧追加可学习的 Visual Latent。',
      analogy: { title: '给整幅厨房场景放一枚语义桥', text: '图像块继续保存细节；额外潜变量聚合任务相关区域，并把它们连接到动作与空间词义。', componentId: 'analogy-5' },
      modules: [
        { kind: 'module', id: '4.1', title: 'Visual Latent：局部视觉 ↔ 全局语义 ↔ 语言概念', desc: '依次查看没有潜变量、视觉聚合、语言注意与教师监督。拖动相似度，观察全局余弦对齐。<span class="source-ref">论文 §2.3 · Figure 12</span>', componentId: 'latent-bridge' },
        { kind: 'module', id: '4.2', title: 'Visual Next-Code Patch Puzzle', desc: '选择杯子图像块，让学生预测教师 ViT 的离散视觉代码。语言损失教模型“怎么说”，视觉损失迫使它保住局部细节。<span class="source-ref">论文 §3.3 · Visual Next-Code Prediction</span>', componentId: 'next-code' },
        { kind: 'module', id: '4.3', title: '三项损失在哪个阶段启用？', desc: '切换预训练与后续阶段：只有大规模预训练联合使用 L_llm、L_vision 与 L_global。<span class="source-ref">论文 §3.3</span>', componentId: 'three-losses' },
      ],
      formula: { lead: '预训练同时约束语言、局部视觉代码与全局语义：', unicode: 'L_total = L_llm + L_vision + L_global；L_global = −cos(f_latent, f_teacher)', symbols: [{ sym: 'L_vision', desc: '视觉下一代码预测损失，目标来自教师 ViT 离散代码。' }, { sym: 'L_global', desc: '视觉潜变量与教师全局 CLS 特征的负余弦相似度。' }] },
      takeaways: [
        { icon: '🌉', title: '桥，不是唯一表示', desc: '图像块保留细节；Visual Latent 是额外的全局语义桥。' },
        { icon: '🧩', title: '视觉要为视觉负责', desc: '2K codebook 的下一代码目标避免局部信息只被语言标签支配。' },
        { icon: '⏱️', title: '监督有阶段边界', desc: '中期训练与微调移除视觉和全局辅助损失。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: 'WHY #2：看懂了，为什么还不会行动？', badge: 'both', badgeLabel: '02 想得明白',
      bridge: '上一站解决了“怎样把红杯看清楚”，但看清并不等于会行动。现在把问题从像素推进到物理世界：机器人该怎样接近红杯，又怎样绕开玻璃杯？',
      analogy: { title: '同一只红杯，不同接触位置意味着不同动作', text: '杯口适合倾倒，杯底提供支撑，杯柄更适合当前的安全抓取任务。', componentId: 'analogy-6' },
      modules: [
        { kind: 'module', id: '5.1', title: 'Affordance Explorer：这个区域能做什么？', desc: '点击杯口、杯身或杯柄，比较区域的行动语义，再为当前任务选出稳定抓取位置。<span class="source-ref">论文：Affordance Data / Robot Control</span>', componentId: 'affordance-explorer' },
        { kind: 'module', id: '5.2', title: 'Trajectory Sandbox：终点对，不代表路径对', desc: '在三条候选轨迹中选择一条。直线路径虽然接近红杯，却会穿过玻璃杯；安全路径还要满足形状与终点约束。<span class="source-ref">论文 §4.2 · Figure 6</span>', componentId: 'trajectory-sandbox' },
        { kind: 'module', id: '5.3', title: '两个动画看懂 DTW 与 Fréchet Distance', desc: '终点只告诉我们“到了没有”，却看不出中途是否绕路或碰撞。论文用 DTW 对齐快慢不同的动作步骤，用 Fréchet Distance 检查整条路线的最大偏离。<span class="source-ref">论文 §4.2 · Trajectory-Based Reward</span>', componentId: 'trajectory-metrics-animation' },
      ],
      insight: '机器人输出不是只有“对 / 错”。一条轨迹可能终点正确、方向大致正确，却在中途碰撞；因此需要 path-aware 的连续反馈。',
      takeaways: [
        { icon: '🖐️', title: '从类别到可供性', desc: 'What is it? 必须进一步变成 What can I do with it?' },
        { icon: '🧭', title: '从点到路径', desc: '连续轨迹必须同时考虑形状、顺序、终点和碰撞。' },
        { icon: '🥛', title: '安全约束不可后补', desc: '玻璃杯是规划条件，不是任务完成后的检查项。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '奖励要懂题型，训练要追着能力边界走', badge: 'trn', badgeLabel: 'RL ↔ RFT',
      bridge: '要让具身推理稳定学出来，奖励不能一把尺子量所有输出，训练数据也不能永远固定。HY-Embodied 使用 task-aware reward 与动态 capability frontier。',
      analogy: { title: '练刚好够得着、又可能失手的抓取', text: '全成功的任务已学会，全失败的任务暂时过难；部分成功的任务提供最有信息的相对反馈。', componentId: 'analogy-7' },
      modules: [
        { kind: 'module', id: '6.1', title: 'Task-aware Reward Selector', desc: '切换定位、回归、轨迹与文本输出，观察奖励怎样匹配输出结构。<span class="source-ref">论文 §4.2 · Figure 6</span>', componentId: 'reward-selector' },
        { kind: 'module', id: '6.2', title: 'Capability Frontier：哪些任务值得本轮训练？', desc: '检查 rollout 成功数：全对与全错被移除，部分成功样本保留到当前能力边界。<span class="source-ref">论文 §4.2–§4.3</span>', componentId: 'frontier-reward' },
        { kind: 'module', id: '6.3', title: 'RL 探索，RFT 固化', desc: '沿 RL → RFT → OPD 逐步推进：RL 扩展能力边界，RFT 把偶发成功轨迹固化为稳定能力。<span class="source-ref">论文 §4.3</span>', componentId: 'posttrain-loop' },
      ],
      takeaways: [
        { icon: '📐', title: '奖励匹配结构', desc: '框、点、深度、轨迹和开放文本需要不同评分方式。' },
        { icon: '🧗', title: '能力边界动态刷新', desc: '当前模型部分成功的样本最适合提供相对学习信号。' },
        { icon: '🔁', title: '探索与固化互补', desc: 'RL 发现新推理，RFT 用高质量轨迹稳定它。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-7', title: 'WHY #3：模型会做，为什么机器人还是跑不动？', badge: 'trn', badgeLabel: '03 跑得起来',
      bridge: '前面定义了什么是好轨迹，接下来要把“偶发走对”训练成“稳定走对”。但即使大模型学会推理，真实机器人仍受延迟与算力约束，因此能力还必须迁移到端侧小模型。',
      analogy: { title: '答案必须在玻璃杯倒下之前到达', text: '云端往返会把感知与动作拉开；端侧模型需要在机器人真正走到的状态上学会纠偏。', componentId: 'analogy-9' },
      modules: [
        { kind: 'module', id: '7.1', title: 'Cloud vs Edge：正确但迟到仍是失败', desc: '切换云端与端侧路径，查看网络往返如何进入动作时延。数值仅为交互示意，不冒充论文实测。<span class="source-ref">论文 §4.4 · edge-oriented MoT-2B</span>', componentId: 'cloud-edge' },
        { kind: 'module', id: '7.2', title: 'On-Policy Distillation：Teacher 来到 Student 真正走到的地方', desc: 'RL 与 RFT 先让大模型稳定掌握能力，但“大模型会做”还不等于“小模型能部署”。学生自己 rollout，教师在同一个学生前缀上给出下一 token 分布并最小化 KL。<span class="source-ref">论文 §4.4 · On-Policy Distillation</span>', componentId: 'onpolicy-distill' },
      ],
      formula: { lead: 'OPD 在学生访问到的状态上对齐教师与学生分布：', unicode: 'L_OPD = E_{y~π_s} [ (1/|y|) Σₜ KL(π_t(·|x,y_<t) ‖ π_s(·|x,y_<t)) ]', symbols: [{ sym: 'π_s', desc: '学生策略；rollout 与前缀都由学生产生。' }, { sym: 'π_t', desc: '教师在相同学生前缀上的下一 token 分布。' }] },
      takeaways: [
        { icon: '☁️', title: '云端有物理代价', desc: '网络往返与推理延迟都会进入真实控制闭环。' },
        { icon: '🧑‍🏫', title: '教师跟到学生状态', desc: 'OPD 不只展示完美轨迹，而是在学生前缀上纠偏。' },
        { icon: '📱', title: '能力压入 MoT-2B', desc: '在策略蒸馏服务于面向端侧的较小模型。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '闭环：从 Embodied VLM 到真实机器人动作', badge: 'both', badgeLabel: 'VLM → VLA',
      bridge: 'OPD 已经把推理能力压进端侧小模型，最后一步就是把会思考的“脑”接上会控制的“手”。回到最初的红杯任务，看整条链路怎样闭环。',
      analogy: { title: '红杯进入上层，玻璃杯保持稳定', text: '看准目标、理解可供性、规划安全轨迹、在端侧推理，再由 Action Expert 输出连续控制。', componentId: 'analogy-10' },
      modules: [
        { kind: 'module', id: '8.1', title: '执行最终任务：把三层能力接成 VLA', desc: '逐步执行完整链路，观察 embodied VLM 与 Action Expert 的职责边界。<span class="source-ref">论文 §6 · Robot Control Results</span>', componentId: 'vla-replay' },
        { kind: 'module', id: '8.2', title: '结果与边界：成绩必须和协议一起读', desc: '切换紧凑模型、前沿系统、效率、真实机器人和局限五条证据赛道；每条结论同时显示“能说”与“不能说”。<span class="source-ref">论文 Figure 11 · §6 · 相关结果表</span>', componentId: 'result-race' },
      ],
      insight: '论文不是简单教 VLM 描述物理世界，而是重新设计感知、推理与部署，使视觉语言智能更有可能转化为物理行动。',
      takeaways: [
        { icon: '👁️', title: '看得准', desc: 'HY-ViT 2.0、MoT、Attention Mask 与 Visual Latent 打牢可行动感知。' },
        { icon: '🧠', title: '想得明白', desc: 'Affordance、Trajectory、task-aware reward 与 RL↔RFT 连接理解和行动。' },
        { icon: '🤖', title: '跑得起来', desc: 'On-Policy Distillation 把能力迁移到 MoT-2B，再由 Action Expert 扩展为 VLA。' },
      ],
    },
  ],
  bilibili: [
    {
      bvid: 'BV1YwVS6wEyF',
      title: 'Qwen-VLA 论文精讲：开启具身智能通用模型新纪元！',
      reason: '从另一篇 VLA 工作理解视觉、语言与动作如何统一建模，并对照本文的训练路线。',
      cover: 'https://i1.hdslb.com/bfs/archive/c3be680a1255b757b919258f91a3af7fcf87d58e.jpg',
      views: '1468播放',
    },
    {
      bvid: 'BV1VAMnznEkG',
      title: '具身智能入门：OpenVLA 复现',
      reason: '从代码和复现角度补充 VLA 的模型结构、训练与部署流程。',
      cover: 'https://i2.hdslb.com/bfs/archive/c5c654126216dd4982896cd06c43f2272123b7d5.jpg',
      views: '1.9万播放',
    },
    {
      bvid: 'BV1oUVG6NEZi',
      title: '半小时速通 VLA 具身智能：LeRobot 真机实操',
      reason: '观察 VLA 从模型推理落到真实机械臂执行时需要处理的工程问题。',
      cover: 'https://i2.hdslb.com/bfs/archive/1e3881876c8212bf24db438ad723bbe9019c1a97.jpg',
      views: '3.1万播放',
    },
  ],
};
