import type { TutorialData } from '../types';
import { T } from './terminology';

export const tutorial: TutorialData = {
  meta: {
    titleShort: 'Qwen-VLA',
    titleEn:
      'Qwen-VLA: Unifying Vision-Language-Action Modeling across Tasks, Environments, and Robot Embodiments',
    titleZh: '跨任务、环境与机器人本体的统一视觉-语言-动作建模',
    venue: 'arXiv 2026 · cs.RO',
    authors: 'Qwen Team',
    affiliation: 'Alibaba Qwen Team',
    domain: '具身智能 · Vision-Language-Action',
    coreProblem: '机器人操纵、视觉-语言导航与第一视角人体动作建模往往各自训练专用策略，能力碎片化。',
    coreInsight:
      '操纵、导航与轨迹预测虽然拥有<b>不同控制语义</b>，却可以共享「<b>视觉 + 指令 + 本体约束 → 未来动作/轨迹</b>」的统一条件预测框架。',
    keywords: ['VLA', 'Flow Matching', '本体感知提示', '通用模型'],
  },
  hero: {
    oldMethod: {
      panelHead: '传统专用策略',
      desc: '机器人操纵、视觉-语言导航、第一视角人体动作 → 往往<b>各自独立</b>训练的专用策略。',
      componentId: 'hero-specialist',
    },
    newMethod: {
      panelHead: 'Qwen-VLA 统一通用模型',
      desc: '中央 <b>Qwen-VLA 核心不变</b>，通过本体感知提示轮流服务 WidowX / Mobile ALOHA / VLN 配置。',
      componentId: 'hero-unified',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '为什么需要统一？',
      subtitleEn: 'Why unify?',
      badge: 'inf',
      badgeLabel: '问题与动机',
      bridge:
        '本节回答：表面异构的具身任务，背后是否存在可共享的计算结构？为何可能由一个通用模型处理多种任务族与本体？',
      analogy: {
        title: '多套专用策略 → 一个共享 VLA 模型',
        text: '不同任务和本体可以共享同一模型，具体本体与控制约定由<b>本体感知提示</b>指定。',
        componentId: 'ch1-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '从「各自为战」到「共享模型」',
          desc: '切换模式：操纵 / 导航 / 人体动作三套专用策略如何沿路径合并为中央 Qwen-VLA，并重新连接输入/输出路径。',
          componentId: 'ch1-mod1',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '看起来不同，计算结构却相同',
          desc: '开关视觉 o、语言 x、本体 e、任务 z（可选），观察 prediction 所需条件是否完整。',
          componentId: 'ch1-mod2',
        },
      ],
      formula: {
        lead: '所有任务族共享的统一条件预测形式：',
        unicode: 'p<sub>θ</sub>(y<sub>t:t+H−1</sub> | o<sub>t</sub>, x, e, z)',
        symbols: [
          { sym: 'o_t', desc: 'visual context — 视觉上下文（单帧/多帧/历史窗口）' },
          { sym: 'x', desc: 'language instruction — 自然语言任务指令' },
          { sym: 'e', desc: 'embodiment description — 本体与控制约定的文本描述' },
          { sym: 'z', desc: 'optional task identifier — 可选任务标识' },
          { sym: 'y', desc: 'future action / trajectory — 未来 H 步动作或轨迹序列' },
        ],
      },
      insight:
        '机器人操纵、视觉-语言导航与第一视角人体动作建模的输出格式不同，但都依赖「看、听懂、按本体约定输出未来动作」这一共享结构 — 因而可以联合学习。',
      takeaways: [
        { icon: '01', title: '表面异构', desc: '动作维度、频率、预测时域 H 不同。' },
        { icon: '02', title: '计算同构', desc: '都依赖视觉、语言、本体条件预测未来序列。' },
        { icon: '03', title: '可联合学习', desc: '共享结构让通用模型成为可能。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '统一预测接口',
      subtitleEn: 'Unified prediction interface',
      badge: 'both',
      badgeLabel: '核心洞察',
      bridge:
        '本节回答：Manipulation 与 Navigation 的物理动作完全不同，论文到底统一了什么？关键句：<b>统一张量接口 ≠ 统一物理动作语义</b>。',
      analogy: {
        title: '同尺寸运输托盘装不同货物',
        text: '张量外形统一，但不同任务仍保留各自的原生控制约定。',
        componentId: 'ch2-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '不同动作，装进同一张量',
          titleShort: 'Native Action → Unified Tensor',
          desc: '切换操纵 / 导航 / 人体轨迹，观察 native token 沿 PACK 路径飞入 H×K grid；打开掩码与梯度演示理解 M 的作用。',
          componentId: 'ch2-mod1',
        },
        {
          kind: 'module',
          id: '2.2',
          title: '掩码实验室',
          desc: '拖动有效通道 c 与有效时间步 h，观察二维 grid / mask 实时变化与 cell inspector。',
          componentId: 'ch2-mod2',
        },
        {
          kind: 'module',
          id: '2.3',
          title: '同一接口，不同语义',
          desc: '对比 Navigation 与 Manipulation 张量 — 形状相同，物理含义不同。',
          componentId: 'ch2-mod3',
        },
      ],
      formula: {
        lead: '统一张量接口与掩码（非统一物理语义）：',
        unicode: 'Y ∈ R<sup>H×K</sup>，M ∈ {0,1}<sup>H×K</sup>',
        symbols: [
          { sym: 'Y', desc: '统一张量接口 — 所有任务共享 H×K 外形' },
          { sym: 'H', desc: '预测时域 H — future horizon' },
          { sym: 'K', desc: '共享最大通道维度' },
          { sym: 'M', desc: '有效性掩码 — 零填充不参与梯度' },
          { sym: 'c', desc: '当前任务 / 本体实际使用的通道数' },
        ],
      },
      takeaways: [
        { icon: '01', title: '统一外形', desc: '所有任务共享 H×K 张量接口。' },
        { icon: '02', title: '保留语义', desc: '不同数据集仍使用原生控制约定。' },
        { icon: '03', title: '掩码训练', desc: '零填充通过有效性掩码排除在梯度之外。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '换身体，不换大脑',
      subtitleEn: 'Same brain, different bodies',
      badge: 'both',
      badgeLabel: '本体条件',
      bridge:
        '本节回答：一个共享模型如何知道自己现在控制哪种机器人？答案在本体感知提示条件化 — 共享架构不变，控制语义通过 prompt 注入。',
      analogy: {
        title: '同一个驾驶员，换车先读车辆说明',
        text: '共享模型不变；换本体时，通过 <b>本体感知提示</b> 告诉模型当前控制对象与控制约定。',
        componentId: 'ch3-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '身体在变，大脑不变',
          desc: '三栏本体切换器 — 左侧 robot、中央共享 Qwen-VLA、右侧结构化 prompt 与 action semantics 联动。',
          componentId: 'ch3-mod1',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '本体提示构造器',
          desc: '点击 prompt token，高亮 template placeholder、robot SVG 区域与中文解释。',
          componentId: 'ch3-mod2',
        },
        {
          kind: 'module',
          id: '3.3',
          title: '换本体时，究竟谁在变？',
          desc: '对照哪些组件保持不变、哪些随 embodiment 变化 — 共享架构无需 per-embodiment 输出头。',
          componentId: 'ch3-mod3',
        },
      ],
      insight:
        '本体感知提示包含 robot platform、arm configuration、control convention、control frequency、prediction horizon。不同 benchmark 可能使用不同 model variant。',
      takeaways: [
        { icon: '01', title: '文字即接口', desc: '本体信息通过本体感知提示注入。' },
        { icon: '02', title: '共享大脑', desc: 'VLM + DiT 共享架构与参数化。' },
        { icon: '03', title: '身体可变', desc: '机器人与控制语义变化，模型通过条件适配。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '从理解到动作',
      subtitleEn: 'From understanding to action',
      badge: 'both',
      badgeLabel: '架构与 Flow Matching',
      bridge:
        '本节回答：Qwen-VLA 如何把图像与语言理解，最终变成连续机器人动作？采用论文的「大脑 + 小脑」类比：VLM 负责理解，DiT 负责精细连续控制。',
      analogy: {
        title: '大脑 + 小脑',
        text: '大脑负责理解视觉与指令，小脑负责把理解转成连续、精细的动作。',
        componentId: 'ch4-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '模型架构流水线',
          desc: '自动演示或单步追踪：输入 → VLM → 联合序列 → DiT → 条件速度场 → 欧拉积分 → 动作块。',
          componentId: 'ch4-mod1',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '流匹配实验室',
          desc: '拖 τ 看插值路径，或播放从噪声生成目标动作块。',
          componentId: 'ch4-mod2',
        },
        {
          kind: 'module',
          id: '4.3',
          title: '欧拉积分步进器',
          desc: '2/4/8 步积分对比 — 神经网络给方向，欧拉积分逐步走出动作。',
          componentId: 'ch4-mod3',
        },
      ],
      formula: {
        lead: '条件流匹配插值：',
        unicode: 'Y<sub>τ</sub> = (1−τ)Y<sub>0</sub> + τY<sub>1</sub>',
        symbols: [
          { sym: 'Y₀', desc: '目标动作块 — 点击可在 §4.2 中对应 clean target 区域' },
          { sym: 'Y₁', desc: '高斯噪声 — 推理起点 τ=1' },
          { sym: 'τ', desc: '流时间 — 训练可自由采样；推理从 1 积分到 0' },
        ],
      },
      takeaways: [
        { icon: '01', title: '理解', desc: 'VLM 将图像、语言与本体条件编码成 VLM 隐状态。' },
        { icon: '02', title: '生成', desc: 'DiT 动作专家 + 流匹配学习连续条件速度场。' },
        { icon: '03', title: '执行', desc: '欧拉积分从噪声逐步得到 H 步动作块。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '它是如何学会的？',
      subtitleEn: 'How does it learn?',
      badge: 'trn',
      badgeLabel: '训练配方',
      bridge:
        '本节回答：为何不直接把预训练 VLM 与随机初始化 DiT 一起训练？论文用 T2A → CPT → SFT → RL 分阶段建立动作先验、视觉落地、任务专精与闭环任务成功率。',
      analogy: {
        title: '先学动作语法 → 再看环境 → 再针对考试 → 最后实战',
        text: 'T2A 建立 language→action 先验；CPT 加入视觉落地；SFT 用高质量 demonstration 专精；RL 在 SimplerEnv 中优化闭环任务成功率。',
        componentId: 'ch5-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '四阶段训练路线',
          desc: '点击 T2A / CPT / SFT / RL，查看 VLM/DiT 冻结策略、SFT 双分支与 RL 闭环反馈。',
          componentId: 'ch5-mod1',
        },
        {
          kind: 'module',
          id: '5.2',
          title: '从一句话到一串动作',
          desc: '一句 instruction 如何展开为 H×c 高维 action sequence — T2A 的核心直觉。',
          componentId: 'ch5-mod2',
        },
        {
          kind: 'module',
          id: '5.3',
          title: '预训练数据混合',
          desc: 'Table 1 数据比例：Robot 74.2% · Human ego 6.0% · Nav 7.5% · Synth 3.7%。',
          componentId: 'ch5-mod3',
        },
      ],
      takeaways: [
        { icon: '01', title: '动作先验', desc: 'T2A 先学习 language + 本体感知提示 → action。' },
        { icon: '02', title: '视觉与专项', desc: 'CPT 加视觉落地，SFT 做任务专精。' },
        { icon: '03', title: '闭环优化', desc: 'RL 在 SimplerEnv 中直接优化闭环任务成功率。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '一个模型真的够吗？',
      subtitleEn: 'Does one model really work?',
      badge: 'both',
      badgeLabel: '实验证据',
      bridge:
        '本节用论文报告数字检验：统一通用模型能否与专用策略竞争？预训练是否带来 OOD 鲁棒？泛化边界在哪里？',
      analogy: {
        title: '一张成绩单上的多门科目',
        text: 'Qwen-VLA-Instruct 在 manipulation、navigation、dynamic 等多张 benchmark 上同时交卷 — 需区分 model variant。',
        componentId: 'ch6-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '通用模型 Benchmark 竞技场',
          desc: '切换 LIBERO / RoboCasa / Simpler / RoboTwin，观察 Qwen-VLA-Instruct 与专用策略同场竞技。',
          componentId: 'ch6-mod1',
        },
        {
          kind: 'module',
          id: '6.2',
          title: T.ood.title,
          desc: 'ALOHA 真实 OOD 五类泛化 — 对比 Qwen-VLA-aloha w/o vs w/ pretrain（36.2 → 76.9）。',
          componentId: 'ch6-mod2',
        },
        {
          kind: 'module',
          id: '6.3',
          title: T.domino.title,
          desc: 'R2R/RxR 滑动窗口航点预测与 DOMINO 零样本动态操纵 — 观察跨任务泛化。',
          componentId: 'ch6-mod3',
        },
      ],
      insight:
        '局限：embodied action data 仍相对不足；joint VL/navigation/action training 有 objective trade-offs；长时间真实世界 failure-prone deployment 仍未解决。',
      takeaways: [
        { icon: '01', title: '通用模型也能竞争', desc: 'Qwen-VLA-Instruct 在多个 manipulation benchmark 上接近或超过强专用策略。' },
        { icon: '02', title: '预训练带来 OOD 鲁棒', desc: 'ALOHA 同架构对比：36.2 → 76.9 OOD avg（Qwen-VLA-aloha w/ pretrain）。' },
        { icon: '03', title: '能力能跨任务，但边界仍在', desc: 'Navigation 与 DOMINO 展示迁移能力；长期真实部署仍未解决。' },
      ],
    },
  ],
};
