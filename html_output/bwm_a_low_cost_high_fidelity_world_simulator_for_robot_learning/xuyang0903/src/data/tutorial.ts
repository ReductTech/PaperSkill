import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "BWM: A Low-Cost High-Fidelity World Simulator for Robot Learning",
    titleZh: "BWM：面向机器人学习的低成本高保真世界模拟器",
    venue: "arXiv:2607.29302v1 · 2026",
    authors: "BWM Team",
    affiliation: "论文与官方仓库",
    domain: "机器人学习 · 动作条件视频世界模型",
    coreProblem: "真实采集昂贵，物理仿真存在迁移差距，通用视频模型又缺少精细动作接口。",
    coreInsight: "BWM用固定初始环境、动态视觉历史和时间对齐动作，把视频预测转化为可闭环滚动的学习式世界模拟器。",
    keywords: [
      "动作条件",
      "时间对齐",
      "自回归 rollout",
      "WorldArena"
    ]
  },
  hero: {
    oldMethod: {
      desc: "真实采集、物理模拟器和通用视频生成各有优势，却分别受成本、安全、Sim-to-Real差距或动作接口限制。",
      componentId: "bwm-hero"
    },
    newMethod: {
      desc: "BWM从真实视觉数据学习外观与交互规律，并通过时间对齐动作驱动有状态的未来观测预测。",
      componentId: "bwm-hero"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "机器人学习的困境与世界模拟器的必要性",
      badge: "inf",
      badgeLabel: "引言 / 动机",
      bridge: "从真实采集、物理模拟与通用视频生成的互补短板出发，感受高质量训练数据的需求和动作响应的需求，理解为什么机器人学习还需要一种学习式世界模拟器。",
      analogy: {
        title: "定格片场：能拍、能控与能复现并不是一回事",
        text: "真实拍摄最可信但昂贵；搭建数字片场便于反复试拍却存在迁移差异；生成一段逼真影片也不代表它会服从逐帧动作脚本。学习式世界模拟器尝试把真实视觉先验与动作条件连接起来。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "三种数据来源，三种结构性痛点",
          desc: "点击真实机器人轨迹、物理模拟器和通用视频模型三张卡片，分别查看它们能提供什么，以及为何单独使用仍有边界；底部对照动作响应、视觉先验与构建负担。",
          componentId: "bwm-foundations"
        },
        {
          kind: "module",
          id: "1.2",
          title: "同一动作脚本，输出是否真的随指令改变？",
          desc: "拖动同一条动作指令，对照物理模拟器、通用视频模型与 BWM 的响应。示意重点不是谁的画面更漂亮，而是输出是否受给定动作控制并保持场景身份。",
          componentId: "bwm-foundations"
        }
      ],
      insight: "BWM 被论文定位为补充方案：它从真实交互数据学习外观与动力学，并复用通用视频先验，通过领域特定后训练降低完全重建场景或从零训练模型的负担；这不等于它普遍取代物理模拟器。",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "现有方法的边界",
      badge: "inf",
      badgeLabel: "相关工作",
      bridge: "沿着“生成逼真视频—接受交互输入—对齐机器人动作—服务 VLA”的路线，比较不同方法究竟解决了哪一层问题。",
      analogy: {
        title: "从成片、遥控舞台到机器人动作脚本",
        text: "视频生成模型擅长成片，交互式世界模型加入键盘、导航或文本事件，机器人动作条件模型才进一步使用精细动作轨迹。接口越接近机器人控制，越需要检查动作—帧对齐与任务状态。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "从视频生成到机器人动作条件：方法发展时间线",
          desc: "点击时间线节点，查看 Sora、Stable Video Diffusion、HunyuanVideo、Wan，GameNGen、Genie，以及 IRASim、Cosmos-Predict 2.5、Ctrl-World 等代表方法在论文相关工作中的定位与边界。",
          componentId: "bwm-related-work"
        },
        {
          kind: "module",
          id: "2.2",
          title: "勾选需求：哪一类方法最接近你的机器人模拟目标？",
          desc: "选择视觉先验、机器人动作轨迹、状态化 rollout、低成本适配或多功能评测等需求，查看类别级推荐与属性矩阵。推荐只依据论文的相关工作分类，不替代逐模型工程审计。",
          componentId: "bwm-related-work"
        }
      ],
      insight: "相关工作的共同缺口并非“都不能生成视频”，而是评测常聚焦单一任务或功能角色，缺少同时覆盖感知质量、物理与动作响应、多种下游功能，以及仿真和实物场景的综合协议。",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "BWM 的设计哲学与问题形式化",
      badge: "both",
      badgeLabel: "建模 / 推理",
      bridge: "通过对前面两章的介绍，我们已经明白了当前的困境以及我们想要实现的目标，因此BWM应运而生。那么我们如何设计BWM呢？BWM 以通用视频先验为起点，再针对目标机器人、场景、传感设置与动作空间做领域特定后训练；预测时同时读取固定环境锚点、动态历史与未来动作块。",
      analogy: {
        title: "参考照、近期样片和未来场记共同决定下一镜",
        text: "开场参考照固定片场身份，最近 H 帧说明道具刚刚如何移动，未来动作脚本规定接下来要执行什么。三者缺一，下一段成片就可能不响应动作或丢失状态。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "执行一次动作：同时检查响应与状态保持",
          desc: "在同一个初始环境中选择推左、保持或推右，并同步执行三路预测：通用视频模型暴露动作脱钩，只响应动作的模型暴露身份漂移，BWM 则同时核对动作响应与任务状态保持。三路动画均为机制示意，不是论文实测轨迹。",
          componentId: "bwm-formalization"
        },
        {
          kind: "module",
          id: "3.2",
          title: "拆开条件分布：谁在约束下一段未来？",
          desc: "点击公式中的 x₀、hₜ、aₜ₊₁:ₜ₊K 与 K，高亮场景里的参考照、动态历史、动作场记和未来片段，并查看每个符号的职责。",
          componentId: "bwm-formalization"
        }
      ],
      insight: "固定初始环境与动态历史定义当前视觉状态，动作块指定要模拟的转移；把新预测持续回填到 hₜ，片段预测器才成为可滚动的学习式视觉模拟器。",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "数据管线——构建动作对齐的训练数据",
      badge: "both",
      badgeLabel: "推理 + 训练",
      bridge: "我们想要得到的BWM的结果搞清楚了，我们就要解决第一层问题数据问题：把同一条机器人轨迹变成更清晰、连续且适合自回归学习的片段，同时锁住动作时间索引。",
      analogy: {
        title: "同一段定格镜头：重拍、滑窗、修复开场照",
        text: "轨迹重放像按原场记逐帧重拍，重叠采样像让相邻胶片保留共同画格，初始观察增强像修复固定的开场参考照。三步都不改动作脚本的时间戳。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "沿时间线检查三步数据处理",
          desc: "逐步播放 Trajectory Replay、Overlapping Clip Sampling 与 Initial-Observation Enhancement，并在每一步核对“动作时间轴不变”。切换“可回放模拟器”后，关闭状态会禁用轨迹重放；点击 SeedVR-2 查看其仅用于初始环境观察恢复的边界。直观示意：窗口跨过“夹爪接触道具”的边界时，重叠片段仍同时保留接触前后画格；该画面为机制示意，不是论文实测。",
          componentId: "bwm-core-mechanics"
        }
      ],
      insight: "Trajectory Replay 只重渲染原规划轨迹的高分辨率观察，不引入新行为；重叠滑窗保留固定切片边界附近的转移，并匹配自回归推理的滑动上下文。若推理环境不能回放，论文只对固定初始观察使用 SeedVR-2 恢复。",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "模型架构——双路径动作注入",
      badge: "both",
      badgeLabel: "推理 + 训练",
      bridge: "我们得到了合理的数据，接着就要解决第二层动作输入问题：同一个动作块沿帧级 Cross-Attention 与潜变量级 AdaLN 两条互补路径进入视频扩散模型。",
      analogy: {
        title: "逐帧场记与分组节拍同时指导拍摄",
        text: "逐动作 token 像每一画格旁的场记指令，保留细时间控制；分组动作嵌入像压缩胶片上的节拍标记，在 latent 时间分辨率调制去噪。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "点击架构节点，追踪两条动作路径",
          desc: "在简化网络图中依次点击“归一化、Action Encoder、Cross-Attention、AdaLN、去噪块”：帧级路径逐动作编码后进入 Cross-Attention；潜变量级路径在前置 P=3 个边界动作后，按 G=4 聚合并加入 timestep embedding，以调制 AdaLN。直观示意：连续“接近—接触—推动”的控制序列中，帧级 token 标出动作发生时刻，分组嵌入提供压缩时间尺度的整体节拍；路径动画为机制示意。",
          componentId: "bwm-core-mechanics"
        },
        {
          kind: "module",
          id: "5.2",
          title: "切换注入配置，读取 WorldArena 消融证据",
          desc: "切换仅 AdaLN、仅 Cross-Attention 与两者结合，并并列显示 EWMScore / TrajA：61.12 / 49.16、59.54 / 43.42、63.51 / 64.36，均标注“论文 Tables 9–10，WorldArena 消融”。这些数值只支持论文协议内的配置比较，不代表跨任务普适最优。",
          componentId: "bwm-core-mechanics"
        }
      ],
      insight: "动作各维先以训练数据的第 1/99 百分位裁剪，再映射到 [ℓₐ,uₐ]。论文报告配置为 dₐ=14、P=3、G=4；组合注入在 WorldArena 消融中取得 EWMScore 63.51、TrajA 64.36。",
      formula: {
        lead: "每个动作维度分别裁剪并线性映射到目标范围：",
        unicode: "a′ = ℓₐ + [clip(a,p₁,p₉₉)−p₁] / (p₉₉−p₁) · (uₐ−ℓₐ)",
        symbols: [
          { "sym": "a′", "desc": "当前动作维度经过裁剪与线性映射后的归一化值。" },
          { "sym": "a", "desc": "归一化前的单个动作维度；论文报告完整动作向量维度 dₐ=14。" },
          { "sym": "p₁", "desc": "该动作维度在训练数据中的第 1 百分位，作为下裁剪边界。" },
          { "sym": "p₉₉", "desc": "该动作维度在训练数据中的第 99 百分位，作为上裁剪边界。" },
          { "sym": "ℓₐ", "desc": "归一化目标区间的下界。" },
          { "sym": "uₐ", "desc": "归一化目标区间的上界。" }
        ]
      },
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "训练目标——Future-only Flow Matching",
      badge: "trn",
      badgeLabel: "训练",
      bridge: "完成了前置的所有条件，我们就要正式进入训练环节，初始帧和历史帧是条件，不是需要重新生成的答案。模型真正需要学习的是：给定过去和未来动作，尚未发生的画面应该怎样变化。那么固定初始环境保持干净，动态历史接受低水平扰动，调度器只对未来 latent 构造训练目标。",
      analogy: {
        title: "保护参考照，只训练尚未拍出的画格",
        text: "开场参考照 z₀ 始终清晰，近期胶片 z_hist 只加轻微颗粒；真正需要模型学习去预测的是未来胶片 z_fut，因此损失只覆盖未来速度。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "拖动 τ，观察噪声与损失落在哪里",
          desc: "拖动调度器时间步 τ：x₀ / z₀ 区域始终保持干净，历史区域维持由 σₕ 控制的低水平扰动，未来区域随 τ 改变噪声状态；“future-only”损失标记只出现在未来区域。点击公式符号可联动高亮对应胶片。颗粒强弱动画是机制示意，不表示论文测得的噪声百分比。",
          componentId: "bwm-evaluation-lab"
        }
      ],
      insight: "模型输入为 [z₀, z̃_hist, zᶠᵘᵗ_τ]；条件前缀不承担未来速度损失。自回归推理采用与训练相同类型的历史扰动，以保持条件构造一致。",
      formula: {
        lead: "历史 latent 仅受低水平扰动，损失只监督未来速度：",
        unicode: "z̃_hist=(1−σₕ)z_hist+σₕε_hist；L_future=E[w(τ)‖v̂ᶠᵘᵗ_θ(z̃_τ,a,τ)−vᶠᵘᵗ_τ‖²₂]",
        symbols: [
          { "sym": "z̃_hist", "desc": "加入低水平扰动后送入模型的动态历史 latent；它是条件前缀，不属于future-only损失区域。" },
          { "sym": "z_hist", "desc": "扰动前的动态视觉历史latent，由最近H个真实或已生成观察编码得到。" },
          { "sym": "σₕ", "desc": "历史扰动的固定低水平尺度，控制保留原历史与注入噪声的比例；论文没有在该公式处把它解释为可随τ变化的量。" },
          { "sym": "ε_hist", "desc": "历史扰动使用的标准高斯噪声，满足ε_hist∼N(0,I)，形状与历史latent一致。" },
          { "sym": "L_future", "desc": "只在未来latent位置计算的Flow Matching训练目标；固定初始环境与动态历史不承担该速度损失。" },
          { "sym": "w(τ)", "desc": "调度器时间步τ对应的损失权重，用于加权不同噪声状态下的未来速度误差。" },
          { "sym": "v̂ᶠᵘᵗ_θ", "desc": "参数为θ的模型对未来latent速度的预测，仅取输出中的未来区域。" },
          { "sym": "vᶠᵘᵗ_τ", "desc": "未来latent在时间步τ对应的目标速度，与预测速度做平方L₂误差。" },
          { "sym": "z̃_τ", "desc": "送入模型的完整带条件latent，其中初始环境保持干净、历史为低噪条件、未来处于τ对应的噪声状态。" },
          { "sym": "a", "desc": "与未来观察共享时间索引的机器人动作条件。" },
          { "sym": "τ", "desc": "从训练调度器采样的时间步，决定未来latent当前处于哪种噪声状态；教程滑块为机制可视化，不是论文测得噪声百分比。" }
        ]
      },
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "自回归推理与误差管理",
      badge: "inf",
      badgeLabel: "基础 / 推理",
      bridge: "训练完成进行推理的过程需要形成闭环处理，每轮预测 K 帧，只把新生成帧追加到 rollout，再更新动态历史并处理下一动作块。",
      analogy: {
        title: "续拍镜头，但始终保留开场参考照",
        text: "上一轮生成画格会进入下一轮动态历史，因此误差可能沿 rollout 累积；固定初始环境提供场景身份锚点，紧凑的近期历史负责跟踪最新变化。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "滚动八个预测块，观察误差如何进入历史",
          desc: "点击“生成下一块”或拖动进度滑块，滚动 1–8 个 rollout 块（每块使用论文报告的 K=72），观察每轮“丢弃条件帧→追加新预测→截取最近 H 帧更新 hₜ”。可切换初始环境锚点，并在论文实际消融设置 H=4/8/16 之间比较；误差累积曲线始终标注为机制示意，不能冒充论文实测。",
          componentId: "bwm-evaluation-lab"
        }
      ],
      insight: "在 WorldArena 消融中，K=72 相比 K=32 将 EWMScore 从 63.15 提升到 63.51、TrajA 从 61.76 提升到 64.36；H=8 的结果为 63.51 / 64.36，高于 H=4 的 55.49 / 41.43 与 H=16 的 63.02 / 56.89。这里只能说明论文协议内的报告配置，不是所有场景的通用最优。",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "作为数据引擎的应用与效果",
      badge: "both",
      badgeLabel: "推理 + 训练",
      bridge: "最后我们看一下BWM的真正作用，可以作为数据引擎。把动作脚本交给BWM生成未来观测，再将动作与生成观测成对加入模仿学习数据；这一章只在各自实验协议内判断生成数据是否真正帮助下游策略。",
      analogy: {
        title: "把动作脚本拍成可训练的练习镜头",
        text: "以论文中的“调瓶”和“按铃”为例：一段看起来逼真的影片还不够，生成的每一帧必须继续对应原动作时间轴，才能组成可供策略学习的观测—动作轨迹。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "从动作对齐轨迹到下游成功率",
          desc: "在“模拟环境”和“实物机器人”之间切换。WorldArena页签对应两项任务：每个世界模型每项生成25条轨迹训练π0.5，并以每项100次执行统计成功率；实物页签对应ARX X5六项任务：每项50条真实轨迹再增加40条生成轨迹，并以25次硬件试验统计成功率。点击BWM柱可逐步查看“初始观察与动作块→自回归观测→观测—动作配对轨迹→模仿学习”的数据生成链。",
          componentId: "bwm-evaluation-lab"
        }
      ],
      insight: "在WorldArena两任务Data Engine协议中，BWM为94.50%，真实数据训练为71.50%（论文Table 3）；在实物六任务增强协议中，Real+BWM为71.00%，Real only为50.67%（论文Table 7）。两组数字来自不同任务、数据配额与执行环境，只能在各自协议内比较，不能合并成新的总成功率。",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "作为策略评估器的应用与效果",
      badge: "inf",
      badgeLabel: "推理 / 评估",
      bridge: "除了上一章提出的作为数据引擎之外，BWM还可以作为策略评估器。策略给出动作，BWM预测新观测，新观测再送回策略；这样反复闭环，世界模拟器才能用于策略排序与部署前风险预判。",
      analogy: {
        title: "危险镜头先试拍，失败片段也不能剪掉",
        text: "示意：若候选策略把道具推向目标后又偏离，失败结尾正是部署风险的证据。只保留顺利完成的试拍，会把策略能力估得过高。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "逐步运行策略—世界闭环",
          desc: "点击“下一步”依次推进策略→动作→BWM预测→新观测；一圈结束后记录成功或失败。计数器强调评估单位是完整闭环rollout，而不是挑选单张逼真画面。",
          componentId: "bwm-evaluation-lab"
        },
        {
          kind: "module",
          id: "9.2",
          title: "把失败纳入风险证据",
          desc: "切换“只看成功”与“成功+失败”，对照六项任务的BWM估计成功率和真实硬件成功率；偏差较大的任务会显示警示。这里的实体结果来自固定MOTIF策略、六项任务、每项25次闭环rollout；Pearson r衡量跨任务变化是否一致，MAE衡量成功率绝对偏差。",
          componentId: "bwm-evaluation-lab"
        }
      ],
      insight: "WorldArena Policy Evaluator以五个不同能力的π0.5策略和RoboTwin结果为参照，BWM的Pearson r=0.978，略低于Ctrl-World的0.986（论文Table 4）。实体评估使用固定MOTIF策略；纳入失败rollout后，BWM达到r=0.908、MAE=14.67（论文Table 8）。前者比较跨策略排序，后者比较跨任务硬件一致性，不能视为同一评测。",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "综合排名与开源生态",
      badge: "both",
      badgeLabel: "评测 + 复现",
      bridge: "最后我们查看论文提出的创新点在实际应用上的结果。",
      analogy: {
        title: "既看放映评分，也逐件清点工具箱",
        text: "五张成绩单采用不同量纲，不能直接相加；模型能推理，也不等于从数据构造到全部表格都已有一条命令可复现。",
        componentId: "bwm-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "并列查看五项证据与赛道名次",
          desc: "启动雷达图后依次选择EWMScore、WorldArena Data Engine成功率、WorldArena Policy Evaluator相关系数、实物Data Engine成功率和实物Policy Evaluator相关系数。悬停或切换只读取各轴的原始数值与来源；图形用于导航证据，不据此计算跨协议综合分。论文报告：三项成绩合并后综合第一；Track 1总体第二、开源第一；Track 2开源Data Engine第一、Policy Evaluator第二。",
          componentId: "bwm-evaluation-lab"
        },
        {
          kind: "module",
          id: "10.2",
          title: "逐项核对代码、权重与复现边界",
          desc: "折叠清单默认展示模型定义、模型权重和推理示例；展开后再看训练与端到端复现边界。“快速上手”指向官方仓库推理说明。核对依据为本地官方仓库commit 44acfd1b06f35f365f02f7bb2fc5da6beafcd6bc。",
          componentId: "bwm-evaluation-lab"
        }
      ],
      insight: "仓库README将推理代码、模型定义与权重标为已发布，并提供BWM checkpoint和Wan2.2-TI2V-5B基座链接；README中的训练发布仍未勾选，Training段写着Coming soon。仓库虽存在scripts/train.py、启动脚本、数据算子和训练配置，但没有覆盖trajectory replay、重叠片段构造、两类功能实验及全部论文表格的一键端到端复现命令。因此不能把训练脚本“存在”写成完整训练与论文复现流程“已经开放”。评测结论严格遵循WorldArena协议；开源状态以该commit为准。",
      takeaways: []
    }
  ],
  bilibili: [
    {
      bvid: "BV1s4X5B1EBP",
      title: "世界是虚拟的吗？为什么要搭建世界模型？",
      reason: "用于补充世界模型在自动驾驶与机器人中的宏观背景；不是BWM论文事实来源。",
      views: "22.9万播放"
    },
    {
      bvid: "BV11LPWzNEkm",
      title: "全面解析“世界模型”：定义、路线、实践与AGI的更近一步",
      reason: "补充视频生成、空间智能、智能体训练与抽象预测等世界模型路线；用于拓展背景，不作为BWM论文证据。",
      views: "25.6万播放"
    },
    {
      bvid: "BV1mSQsB2EkS",
      title: "VLA_模型：教会机器人去看、去理解、去行动",
      reason: "介绍VLA模型的基本概念，阐述其如何让机器人具备视觉感知、语义理解和动作执行能力，与用户关注的机器人操作算法主题直接相关。",
      views: "890播放"
    }
  ]
};
