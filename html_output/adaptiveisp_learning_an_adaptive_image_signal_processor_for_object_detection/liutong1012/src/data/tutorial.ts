import type { TutorialData } from '../types';

// 论文数字来自 NeurIPS 2024 正式论文。交互中的图像与即时分数只是教学示意。
export const tutorial: TutorialData = {
  meta: {
    titleEn: 'AdaptiveISP: Learning an Adaptive Image Signal Processor for Object Detection',
    titleZh: 'AdaptiveISP：面向目标检测的自适应图像信号处理器',
    venue: 'NeurIPS 2024',
    authors: 'Yujin Wang · Tianyi Xu · Fan Zhang · Tianfan Xue · Jinwei Gu',
    affiliation: '上海人工智能实验室 · 北京大学 · 香港中文大学',
    domain: '计算机视觉 / 图像信号处理 / 强化学习',
    coreProblem: '固定 ISP 流水线难以适应不同场景；照片更好看，也不一定让目标检测更准确。',
    coreInsight: '把 ISP 变成逐步决策：根据当前图像选择处理模块与参数，用检测误差变化指导学习，同时可考虑运行成本。',
    keywords: ['场景自适应', '目标检测', '强化学习'],
  },
  hero: {
    oldMethod: { desc: '传统固定流水线对所有场景采用相似处理，遇到暗光或强反差时容易失配。', componentId: 'hero-old' },
    newMethod: { desc: 'AdaptiveISP 根据当前图像逐步选择模块及参数，让处理服务于预训练检测器。', componentId: 'hero-new' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '好看的照片，不一定好检测', badge: 'inf', badgeLabel: '问题',
      bridge: '论文引言：传统 ISP 面向摄影观感，固定处理难以适应动态场景；本研究改为面向下游目标检测。',
      analogy: { title: '摄影练习 · 先看清目标', text: '原创二次元相机观察员“小澄”先确认画面里的自行车轮廓，而不是只追求鲜艳。', componentId: 'analogy' },
      modules: [
        { kind: 'module', id: '1.1', title: '切换任务目标', desc: '切换“观感优先”和“检测优先”，观察同一场景关注点的变化。图像效果是教学示意。', componentId: 'goal' },
        { kind: 'module', id: '1.2', title: '固定策略的盲区', desc: '切换光照条件，观察一套固定设置为何难以照顾所有图像。', componentId: 'fixed' },
      ],
      insight: '亮度和饱和度不是检测准确率的替代指标。',
      takeaways: [
        { icon: '🎯', title: '任务目标', desc: '以检测表现为优化方向。' },
        { icon: '📷', title: '传统问题', desc: '固定 ISP 难以随场景变化。' },
        { icon: '🔍', title: '研究动机', desc: '每张图像可以需要不同处理。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '输入与模块池', badge: 'inf', badgeLabel: '表示',
      bridge: '论文 §3 说明：RAW 数据先经简单固定处理变成线性 RGB，研究主要调整后续 RGB 域模块。',
      analogy: { title: '摄影练习 · 拨一个旋钮', text: '小澄每次只拨一个设置，再检查当前画面的变化。', componentId: 'analogy' },
      modules: [{ kind: 'module', id: '2.1', title: '模块图鉴', desc: '点击 ISP 模块，查看它处理亮度、颜色、细节还是噪声。', componentId: 'pool' }],
      insight: '动作包含离散的模块类型 M 与连续的模块参数 Θ，二者需要共同确定。',
      takeaways: [
        { icon: '🧩', title: '模块选择', desc: '曝光、去饱和、CCM 等均可选。' },
        { icon: '🎚️', title: '参数预测', desc: '模块还需要合适的处理强度。' },
        { icon: '🖼️', title: '输入边界', desc: '自适应部分主要发生在 RGB 域。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '场景决定处理路线', badge: 'inf', badgeLabel: '洞察',
      bridge: '论文图 5 的条件性分析：高 ISO、高噪声样本倾向去饱和；低 ISO 样本倾向 CCM；高动态范围画面常需要色调映射。',
      analogy: { title: '摄影练习 · 看光线换设置', text: '小澄观察灯光与噪声，再选择这次最需要的调整。', componentId: 'analogy' },
      modules: [{ kind: 'module', id: '3.1', title: '三类场景', desc: '切换高噪声、低噪声与强反差，查看论文观察到的模块偏好。', componentId: 'scene' }],
      insight: '这些是论文样本中的趋势，不是对每张照片的绝对规则。',
      takeaways: [
        { icon: '🌙', title: '高 ISO', desc: '去饱和可减轻色彩噪声。' },
        { icon: '☀️', title: '低 ISO', desc: 'CCM 有助于校正偏色。' },
        { icon: '💡', title: '强反差', desc: '色调映射处理亮暗范围。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '把 ISP 变成逐步决策', badge: 'both', badgeLabel: '方法',
      bridge: '论文 §3.1–3.2：当前图像是状态；一次动作选择模块类型和参数；执行后得到下一幅图像。',
      analogy: { title: '摄影练习 · 一次调一项', text: '小澄调一项后再看结果，而不是提前锁死全部操作。', componentId: 'analogy' },
      modules: [{ kind: 'module', id: '4.1', title: '走完一条决策轨迹', desc: '逐步点击，观察状态、模块、参数及下一状态如何衔接。', componentId: 'mdp' }],
      formula: { lead: '论文式 (1)：处理按顺序复合。', unicode: 'Iₜ = (F(Mₜ, Θₜ) ∘ … ∘ F(M₀, Θ₀))(I)', symbols: [{ sym: 'Iₜ', desc: '第 t 阶段输出图像' }, { sym: 'Mₜ', desc: '所选模块类型' }, { sym: 'Θₜ', desc: '模块参数' }] },
      takeaways: [
        { icon: '🧭', title: '状态', desc: '当前图像决定后续动作。' },
        { icon: '🛠️', title: '动作', desc: '选模块，同时定参数。' },
        { icon: '🔁', title: '轨迹', desc: '模块顺序也会影响输出。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '检测误差就是反馈', badge: 'both', badgeLabel: '目标',
      bridge: '论文式 (4)、(9)：每一步比较处理前后检测误差，并减去惩罚。这里的拖动数字是教学算例，不是模型评测。',
      analogy: { title: '摄影练习 · 检查一次结果', text: '小澄调整后检查目标有没有更容易辨认。', componentId: 'analogy' },
      modules: [{ kind: 'module', id: '5.1', title: '奖励计算器', desc: '调节处理后误差和代价，亲眼看正奖励何时转为负奖励。', componentId: 'reward' }],
      formula: { lead: '论文式 (9)：误差下降带来奖励，惩罚抵消收益。', unicode: 'rᵢ = D(sᵢ) − D(sᵢ₊₁) − Pᵢ', symbols: [{ sym: 'D', desc: '给定检测器的检测误差' }, { sym: 'Pᵢ', desc: '第 i 步的惩罚项' }, { sym: 'rᵢ', desc: '第 i 步的奖励' }] },
      takeaways: [
        { icon: '⬇️', title: '误差下降', desc: '通常对应正向收益。' },
        { icon: '⏱️', title: '处理成本', desc: '耗时可能抵消部分收益。' },
        { icon: '⚖️', title: '核心方向', desc: '训练策略最大化累计奖励。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '推理时边看边选', badge: 'inf', badgeLabel: '推理',
      bridge: '推理时轻量策略网络逐阶段预测模块与参数。论文在所述硬件测试中报告每阶段预测约 1.2 ms；不代表整条流水线总耗时。',
      analogy: { title: '摄影练习 · 现场试拍', text: '小澄看当前画面，只做下一次有依据的调整。', componentId: 'analogy' },
      modules: [{ kind: 'module', id: '6.1', title: '两种场景的示意路线', desc: '切换场景并逐步推进。路线用来理解决策，非原模型逐样本输出。', componentId: 'rollout' }],
      insight: '改变执行阶段数，就能在推理阶段控制精度与用时的权衡；实际数值见论文表 5。',
      takeaways: [
        { icon: '👀', title: '观察', desc: '每步读取当前图像状态。' },
        { icon: '⚙️', title: '决策', desc: '一次输出一个模块及参数。' },
        { icon: '🛑', title: '长度', desc: '不必对简单样本一律运行最长路线。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-7', title: 'Actor–Critic 如何学习', badge: 'trn', badgeLabel: '训练',
      bridge: '论文图 2：策略网络输出模块概率与参数，价值网络估计状态价值；预训练 YOLOv3 在此实验中用于计算反馈并保持固定。',
      analogy: { title: '摄影练习 · 记录一次反馈', text: '小澄记住这次设置是否有利于看清目标。', componentId: 'analogy' },
      modules: [{ kind: 'module', id: '7.1', title: '训练反馈四步', desc: '逐步查看出动作、评估检测误差、估计价值与更新策略。', componentId: 'training' }],
      formula: { lead: '论文式 (5) 使用折扣回报，γ 决定后续奖励的权重。', unicode: 'gₜ = Σₖ γᵏ · rₜ₊ₖ', symbols: [{ sym: 'γ', desc: '范围为 0 到 1 的折扣因子' }, { sym: 'r', desc: '单步奖励' }, { sym: 'gₜ', desc: '从第 t 步起的折扣回报' }] },
      takeaways: [
        { icon: '🎬', title: 'Actor', desc: '选模块与参数。' },
        { icon: '🧮', title: 'Critic', desc: '估计状态价值。' },
        { icon: '🔒', title: '检测器', desc: '论文实验中的预训练 YOLOv3 不更新。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '点击打开系统结构', badge: 'trn', badgeLabel: '结构',
      bridge: '策略与价值网络都采用 CNN 加全连接层；输入包括图像以及模块使用记录和阶段信息。点击图中节点查看作用。',
      analogy: { title: '摄影练习 · 查看一个读数', text: '小澄读取取景信息，判断哪一项需要调整。', componentId: 'analogy' },
      modules: [{ kind: 'module', id: '8.1', title: 'Actor–Critic 结构地图', desc: '点击图像、策略、ISP、检测器或价值网络，观察高亮路径和说明变化。', componentId: 'architecture' }],
      insight: '“检测器参与训练反馈”不等于“检测器与策略网络一起更新参数”。',
      takeaways: [
        { icon: '🖼️', title: '输入', desc: '图像与历史记录帮助决策。' },
        { icon: '🧠', title: '策略', desc: '分别产生模块概率和参数。' },
        { icon: '📈', title: '价值', desc: 'Critic 估计状态价值。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-9', title: '避免重复，控制成本', badge: 'trn', badgeLabel: '工程',
      bridge: '论文 §3.3 引入模块使用记录与重复惩罚，另按模块运行时间加入成本惩罚；表 4 报告 LOD 上的实测取舍。',
      analogy: { title: '摄影练习 · 少做无效调节', text: '小澄看过使用记录，避免反复拨同一个设置。', componentId: 'analogy' },
      modules: [{ kind: 'module', id: '9.1', title: '时间权重实验', desc: '切换论文 λc 档位，比较 mAP@0.5 与单样本平均总时间。', componentId: 'cost' }],
      formula: { lead: '论文式 (11)：按选中模块的运行时间计费。', unicode: 'Pᶜ = λᶜ Σₘ Iₘ · Mᶜₘ', symbols: [{ sym: 'λᶜ', desc: '运行成本权重' }, { sym: 'Iₘ', desc: '模块 m 是否被使用' }, { sym: 'Mᶜₘ', desc: '模块 m 的运行时间' }] },
      takeaways: [
        { icon: '🧾', title: '使用记录', desc: '限制无意义的模块重复。' },
        { icon: '⌛', title: '成本', desc: '高耗时模块会受到更大惩罚。' },
        { icon: '📊', title: '表 4', desc: 'λc=0：71.4 / 14.73 ms；λc=0.01：71.0 / 11.54 ms。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-10', title: '读懂结果与边界', badge: 'both', badgeLabel: '证据',
      bridge: '论文表 1、3、5 的数字须按相同数据集、检测器和指标比较。按钮只把原论文数字画成图，不会运行检测模型。',
      analogy: { title: '摄影练习 · 对照同一成绩单', text: '小澄用同一标准比较不同设置，并分清检测精度和处理时间。', componentId: 'analogy' },
      modules: [{ kind: 'module', id: '10.1', title: '论文数据赛道', desc: '切换 LOD 方法、阶段数或检测器，然后点击播放，比较同协议数据。', componentId: 'results' }],
      insight: 'LOD + YOLOv3 的 mAP@0.5：AdaptiveISP 71.4，固定流水线且优化参数的基线 70.1。作者指出当前方案依赖可微 ISP 模块。',
      takeaways: [
        { icon: '🏁', title: 'LOD', desc: '71.4 只对应论文指定的评测协议。' },
        { icon: '🔄', title: '扩展', desc: '论文还报告跨数据集、跨检测器和分割结果。' },
        { icon: '🧱', title: '边界', desc: '不可微 ISP 尚待未来研究。' },
      ],
    },
  ],
};
