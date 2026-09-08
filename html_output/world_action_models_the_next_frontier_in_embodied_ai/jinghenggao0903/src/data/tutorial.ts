import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'World Action Models: The Next Frontier in Embodied AI',
    titleZh: '世界动作模型：具身智能的下一个前沿',
    venue: '', authors: '', affiliation: '', domain: '具身智能',
    coreProblem: '机器人能否在行动前预见后果，并让预测真正改变动作？',
    coreInsight: '世界动作模型把未来状态建模与动作生成统一起来，让机器人先预见行动后果，再生成与未来一致的动作。',
    keywords: ['综述', '具身智能', '世界模型', '机器人学习']
  },
  hero: {
    oldMethod: { desc: '看到目标，直接给出动作。' },
    newMethod: { desc: '预见后果，再选择动作。' }
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '为什么“会做”仍然不够？', badge: 'both', badgeLabel: '问题',
      bridge: '视觉—语言—动作模型（Vision-Language-Action Model，VLA）已经能理解画面、语言和任务，并直接输出机器人动作。但它的标准目标通常<strong>没有显式要求预测动作之后的世界变化</strong>。世界动作模型（World Action Model，WAM）关注的正是这一缺口。',
      analogy: {
        title: '机械臂知道目标，却没先看见碰撞',
        text: '把球放进篮子并不难，难的是中间隔着玻璃。在这个示意任务中，若策略只按目标直接出动作，可能撞上障碍；若先建模动作后的状态变化，就能据此选择绕行。'
      },
      modules: [
        { kind: 'module', id: '1.1', title: '同一个目标，两种决策方式', componentId: 'wam-foresight-animation', desc: '左侧从观察直接走向动作，右侧先展开可能的未来。差别不在“能否出手”，而在出手前是否理解后果。' }
      ],
      takeaways: [
        { icon: '01', title: 'VLA 已经很强', desc: '它把视觉、语言与动作有效连接起来。' },
        { icon: '02', title: '缺口在目标', desc: '动作预测不等于显式预测干预后的世界。' },
        { icon: '03', title: '因此需要预见', desc: '让可能的后果在执行前进入决策。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-2', title: '什么样的系统才算 WAM？', badge: 'inf', badgeLabel: '定义',
      bridge: 'WAM 不是某个固定架构，也不等于“使用了视频生成骨干的机器人”。按照论文定义，它至少同时满足两点：<strong>产生或使用可量化的未来状态表示，并让动作生成与这份未来状态明确耦合</strong>。',
      analogy: {
        title: '未来不是展示结果，而是控制条件',
        text: '只预测给定动作后的未来，仍是世界模型；只从观察直接生成动作，仍是动作策略。WAM 要求未来状态建模与动作生成处在同一框架中，并存在明确耦合。'
      },
      formula: { lead: '论文给出的统一目标', unicode: 'p(o′, a | o, l)', symbols: [{ sym: 'p', desc: '条件联合概率分布：模型同时描述未来状态与动作。' }, { sym: 'o′', desc: '后续观察，也就是模型要形成或使用的未来状态表示。' }, { sym: 'a', desc: '机器人动作或控制序列。' }, { sym: 'o', desc: '机器人当前获得的观察。' }, { sym: 'l', desc: '语言指令或任务目标。' }] },
      modules: [
        { kind: 'module', id: '2.1', title: 'VLA、世界模型与 WAM 分别建模什么', componentId: 'wam-concept-flow-animation', desc: '典型 VLA 建模 p(a|o,l)，动作条件世界模型建模 p(o′|o,a)，WAM 则统一建模 p(o′,a|o,l)。' },
        { kind: 'module', id: '2.2', title: '用两个条件划清概念边界', componentId: 'wam-boundary-map', desc: '沿候选系统滑动：是否具有未来状态建模目标、动作是否与预测结果明确耦合，是论文用于判断 WAM 的两个核心条件；仅使用视频骨干并不充分。' }
      ],
      takeaways: [
        { icon: '01', title: 'VLA ≠ WAM', desc: '直接动作预测并不要求建模后续状态。' },
        { icon: '02', title: '世界模型 ≠ WAM', desc: '只预测给定动作的后果，并不等于生成动作。' },
        { icon: '03', title: '视频生成骨干策略未必是 WAM', desc: '视频骨干只是结构来源；是否明确预测未来并让它参与动作生成，才是判据。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-3', title: '为什么预测必须进入行动？', badge: 'both', badgeLabel: '汇合',
      bridge: '典型的 VLA 擅长根据观察和目标回答<strong>“现在做什么”</strong>，世界模型擅长回答<strong>“这样做会发生什么”</strong>。WAM 的关键不是把两者并排放置，而是让预测结果真正参与动作选择。',
      analogy: {
        title: '会做与会预见，单独都不够',
        text: '动作策略负责生成控制，世界模型负责预测给定干预后的状态；二者各自存在都不等于 WAM。关键是让未来状态表示参与动作生成，使动作与预测结果明确对齐。'
      },
      modules: [
        { kind: 'module', id: '3.1', title: '把未来预测接入动作回路', componentId: 'wam-convergence-animation', desc: '拖动“未来预测”模块，观察教学示意中的结构变化：并排存在不构成耦合；只有预测结果成为动作生成的条件，才符合 WAM 的核心要求。' }
      ],
      takeaways: [
        { icon: '01', title: 'VLA 提供行动能力', desc: '从观察和目标生成机器人动作。' },
        { icon: '02', title: '世界模型提供预测能力', desc: '展开候选动作可能造成的未来。' },
        { icon: '03', title: 'WAM 建立明确耦合', desc: '在统一目标或级联条件中，让未来状态参与动作生成。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-4', title: 'WAM 可以怎样实现？', badge: 'both', badgeLabel: '架构',
      bridge: '论文按结构流与训练方式把 WAM 分为两类：<strong>级联式先形成未来表示，再由独立模块提取动作</strong>；<strong>联合式在统一模型和联合监督目标下建模未来状态与动作</strong>。',
      analogy: {
        title: '读懂架构只需要三个问题',
        text: '级联式首先区分像素空间的显式计划与潜空间的隐式计划；联合式再区分自回归与扩散式路线，其中扩散式结构还可采用统一流或多流。'
      },
      modules: [
        { kind: 'module', id: '4.1', title: '级联式（Cascaded）：先形成未来，再提取动作', componentId: 'wam-cascade-animation', desc: '中间载体可以是可解释的像素级未来，也可以是更紧凑的未来潜表示。两阶段职责分离；显式计划较易检查，隐式计划更高效但较难解释。' },
        { kind: 'module', id: '4.2', title: '联合式（Joint）：在统一模型中共同建模', componentId: 'wam-joint-animation', desc: '联合式以未来状态和动作为联合监督目标。图中以扩散式路线为例，对比共享主干的统一流与通过交叉注意力等机制耦合的多流结构。' }
      ],
      takeaways: [
        { icon: '01', title: '级联式', desc: '未来 → 动作，接口清楚但可能传播误差。' },
        { icon: '02', title: '联合式', desc: '统一模型、联合监督，耦合更紧但优化与推理更复杂。' },
        { icon: '03', title: '没有已证实赢家', desc: '论文指出仍缺少规模、数据和协议匹配的受控比较。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-5', title: '模型靠什么学会物理世界？', badge: 'trn', badgeLabel: '数据',
      bridge: 'WAM 既需要准确的动作—后果对应，也希望吸收开放世界的物理经验。因此数据问题不是“越多越好”，而是<strong>不同来源各自提供什么、又缺少什么</strong>。',
      analogy: {
        title: '精确练习与广泛观摩缺一不可',
        text: '机器人数据像亲手练习，动作—状态对齐精确但采集昂贵；人类视频像广泛观摩，规模大却通常缺少机器人动作标签。便携式示范与仿真在二者之间提供互补监督。'
      },
      modules: [
        { kind: 'module', id: '5.1', title: '四类数据，各自提供什么', componentId: 'wam-data-landscape', desc: '依次查看机器人遥操作、便携式人类示范、仿真和人类视频。这里比较的是监督来源、规模条件、场景覆盖与主要落差，不把定性判断伪装成统一分数。' },
        { kind: 'module', id: '5.2', title: '世界知识怎样跨到机器人身体', componentId: 'wam-transfer-animation', desc: '无动作视频可提供视觉动力学、物理先验与任务逻辑；若要用于控制，还需借助姿态估计、动作重定向或少量机器人动作标注完成具身对齐。' }
      ],
      takeaways: [
        { icon: '01', title: '机器人具身对齐', desc: '遥操作数据提供严格对齐的真实动作—状态轨迹。' },
        { icon: '02', title: '开放世界先验', desc: '人类与第一视角视频提供规模、多样性和长尾经验。' },
        { icon: '03', title: '关键仍是混合', desc: '如何组合多源数据并跨身体迁移，论文认为尚无通用配方。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-6', title: '怎样证明预测真的支撑行动？', badge: 'both', badgeLabel: '评价',
      bridge: '论文把现有评估分成两条互补但分离的轴：<strong>世界建模能力</strong>关注视觉保真、物理常识和动作可推断性；<strong>动作策略能力</strong>关注任务执行。二者之间尚缺成熟的联合协议。',
      analogy: {
        title: '两个分数都高，仍不能证明二者真正耦合',
        text: '视觉真实、物理合理和动作可推断用于评价世界建模；任务成功用于评价策略。论文强调，现有工作通常分开测量，尚不能直接证明动作由正确的未来预测所支撑。'
      },
      modules: [
        { kind: 'module', id: '6.1', title: '从世界建模指标扩展到策略任务表现', componentId: 'wam-evaluation-animation', desc: '前三项对应论文总结的世界建模评价维度，第四项属于动作策略评价。拖动表示扩大检查范围，不代表已有一个公认的总分或顺序协议。' },
        { kind: 'module', id: '6.2', title: '当前评价体系缺失的那座桥', componentId: 'wam-coupling-gap', desc: '论文指出联合评价仍是空缺，并把反事实一致性列为可能方向之一：观察对未来或动作的干预，是否在另一侧引起一致响应。' }
      ],
      takeaways: [
        { icon: '01', title: 'Visual ≠ Physical', desc: '画面逼真不保证接触与运动规律正确。' },
        { icon: '02', title: 'World ≠ Policy', desc: '世界建模指标与策略任务指标目前通常分开报告。' },
        { icon: '03', title: '最缺联合评价', desc: '反事实一致性是论文提出的候选方向，而非既有标准。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-7', title: '距离可靠部署，还缺什么？', badge: 'both', badgeLabel: '挑战',
      bridge: '开放问题并不是一张普通待办清单。它们共同追问：<strong>什么样的未来表示、数据、计算和验证，才足以支撑长期、实时且安全的行动？</strong>',
      analogy: {
        title: '五组矛盾共同约束一个系统',
        text: '这里把论文的七类开放问题压缩成五组：多模态状态、架构耦合、数据混合、长时域与效率、联合评价与安全。分组用于讲解，不表示这些问题已经有统一解法。'
      },
      modules: [
        { kind: 'module', id: '7.1', title: '把挑战看成相互连接的研究地图', componentId: 'wam-challenge-map', desc: '页面将论文的七类挑战合并为五组讲解线索；它们彼此牵动，但这种合并是教学整理，不是论文给出的新分类。' }
      ],
      takeaways: [
        { icon: '01', title: '表示机会', desc: '探索对行动有用、可验证且高效的未来状态。' },
        { icon: '02', title: '规模机会', desc: '连接多源数据、跨身体迁移与长时域规划。' },
        { icon: '03', title: '可靠性底线', desc: '在执行前验证预测、不确定性与安全约束。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-8', title: 'WAM 真正改变了什么？', badge: 'both', badgeLabel: '收束',
      bridge: 'WAM 把目标从只建模动作扩展为<strong>联合建模未来状态与动作</strong>。论文的核心贡献是定义这一范式、梳理级联式与联合式设计空间，并指出数据、评价、效率和安全仍是开放问题。',
      analogy: {
        title: '最终目标是一个可验证的行动闭环',
        text: '理解当前观察、预测后续状态、生成与未来对齐的动作，并在任务执行中接受验证。这是对论文主线的教学性收束，而不是某一种固定 WAM 架构。'
      },
      modules: [
        { kind: 'module', id: '8.1', title: '用一张图收束完整 WAM 思维框架', componentId: 'wam-essence-animation', desc: '这张闭环图用于综合论文观点：未来状态表示要与动作生成明确耦合，最终价值仍需通过动作可行性与任务表现验证。' }
      ],
      takeaways: [
        { icon: '01', title: '从反应到预测', desc: '不只输出动作，还要预见干预后的世界。' },
        { icon: '02', title: '从模块到系统', desc: '未来与动作必须在数据、架构和评价中共同设计。' },
        { icon: '03', title: '核心判断', desc: 'WAM 的价值是让可验证的未来真正改变行动。' }
      ]
    }
  ],
  bilibili: [
    {
      bvid: 'BV1QxB9YuERU',
      title: '具身智能大模型简介',
      reason: '系统梳理 VLA、RT 系列与机器人操作基础，适合作为概念补课。',
      cover: 'https://i0.hdslb.com/bfs/archive/2a1bca11ff1596a21d9d77971cb0cc62441cb8ad.jpg',
      views: '8.5万播放'
    },
    {
      bvid: 'BV11LPWzNEkm',
      title: '全面解析“世界模型”：定义、路线、实践与AGI的更近一步【硅谷101】',
      reason: '补充世界模型的技术全景，帮助理解“预测世界”为何重要。',
      cover: 'https://i2.hdslb.com/bfs/archive/11c45d3be6a74137d3889bef7f5a5c014dac8ba5.jpg',
      views: '27.7万播放'
    },
    {
      bvid: 'BV1veg6zmEz4',
      title: '迈向自回归动作世界模型WorldVLA',
      reason: '用具体工作观察未来预测与动作生成怎样结合。',
      cover: 'https://i2.hdslb.com/bfs/archive/cbce807b751356a8890a54f1285570ba5ad138f6.jpg',
      views: '668播放'
    },
    {
      bvid: 'BV1EgXaBnECo',
      title: 'Fast-WAM: 关于World Action Model核心能力来源的思考',
      reason: '进一步讨论视频预测训练与推理时未来想象各自贡献了什么。',
      cover: 'https://i1.hdslb.com/bfs/archive/ae62173bb429d2257db92a21a9483ab666b984a9.jpg',
      views: '4275播放'
    }
  ]
};
