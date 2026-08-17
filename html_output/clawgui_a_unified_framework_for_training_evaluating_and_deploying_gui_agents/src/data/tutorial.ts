import type { TutorialData } from '../types';

// ClawGUI 交互式论文教程 —— 数据主干（6 章 10 模块，面向 4 分钟汇报）
// 论文：ClawGUI: A Unified Framework for Training, Evaluating, and Deploying GUI Agents
// arXiv:2604.11784v1 [cs.LG] 13 Apr 2026，浙江大学
//
// 章节即 pipeline 的一个环节：
//   ①三段裂缝（地图）→ ②ClawGUI-RL → ③ClawGUI-Eval → ④ClawGUI-Agent
//   → ⑤ClawGUI-2B（端到端证据）→ ⑥整条路走完 + 边界
// 各实验就地归章：表 2 消融与表 1 主结果归第 5 章，表 3 复现率归第 3 章。
// GiGPO 为 Feng et al. 2025b 的已有算法，本文只是集成——全篇只在训练闭环里带过一句。
// 比喻按章取材于最贴切的日常场景（不强行统一到单一主线）：
//   ①断了三处的路 ②炖汤尝咸淡 ③两台没对齐的秤 ④常去那家店的「老样子」
//   ⑤练过的小个子跑赢大块头 ⑥三处断口都架上了桥（与①首尾呼应）

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'ClawGUI: A Unified Framework for Training, Evaluating, and Deploying GUI Agents',
    titleZh: 'ClawGUI：训练、评测与部署 GUI 智能体的统一框架',
    venue: 'arXiv:2604.11784v1 · 2026.04',
    authors: 'Fei Tang*, Zhiqiong Lu*, Boxuan Zhang, Weiming Lu, Jun Xiao, Yueting Zhuang, Yongliang Shen†',
    affiliation: '浙江大学（Zhejiang University）',
    domain: 'GUI 智能体 · 在线强化学习 · 系统基础设施',
    coreProblem:
      'GUI 智能体像人一样「看屏幕、点屏幕」操作任意软件。卡住它的不是模型不够强，而是训练、评测、部署三段基础设施各自断裂。',
    coreInsight:
      '把三段焊进同一套开源框架：ClawGUI-RL 补训练，ClawGUI-Eval 补评测，ClawGUI-Agent 补部署，最后用 ClawGUI-2B 端到端验证整条路走得通。',
    keywords: ['GUI 智能体', '在线强化学习', '过程奖励模型', '可复现评测', '真机部署', '端到端验证'],
  },

  hero: {
    oldMethod: {
      desc:
        '过去：一条断了三处的路。训练基建闭源、只跑模拟器；评测各家用各家的配置，分数没法比；训好的模型到不了用户手上。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc:
        'ClawGUI：三处断口全部接上。同一套接口既管模拟器也管真机，每步都有奖励反馈，评测做到 95.8% 复现，最后落到真手机上。',
      componentId: 'hero-new',
    },
  },

  chapters: [
    // ─────────────── 第 1 章 · 地图 ───────────────
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '三道裂缝：卡住进展的不是模型',
      badge: 'inf',
      badgeLabel: '问题 · 地图',
      bridge:
        '把问题摆正，把地图画出来。GUI 智能体只看屏幕、只用点击滑动打字，所以能操作任何 App——卡住它的从来不是这一点。这一节要说清的是：<b>从研究到用户的这条路断在哪三处</b>，以及后面三章分别去补哪一处。',
      analogy: {
        title: '一条断了三处的路',
        text:
          '一条本该从起点通到家门口的路，断了三处：车造好了开不出去，中途每一段的路牌标准还各写各的，最后一截压根没修到住的地方。',
        why:
          '<b>路</b>＝从研究成果通向真实用户的这条通路，<b>三处断口</b>＝论文点名的三段基建缺失：训练基建闭源、评测配置漂移、部署缺失。之所以把主角设成路而不是车，是因为论文的核心判断就是「受阻于基础设施而非模型能力」——车（模型）没问题，是路不通。',
        componentId: 'an2',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '走一遍 GUI 智能体的单步循环',
          desc: '看截图 → 想 → 出动作 → 屏幕变化。动作只有 TAP / SWIPE / TYPE，正是这种朴素让它能操作任何软件。',
          componentId: 'm1b',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '点开三道裂缝，看论文用哪个模块去补',
          desc: '研究 → 训练 → 评测 → 用户，三处断口各对应一个 ClawGUI 模块——点开任意一道，论文原图上会同步框出它。',
          componentId: 'm2a',
        },
      ],
      takeaways: [
        { icon: '👀', title: '像素就是全部输入', desc: '看不到后台，换来了 CLI 够不着的长尾应用覆盖。' },
        { icon: '🧱', title: '瓶颈在基建不在模型', desc: '原话：受阻「less by modeling capacity than by … infrastructure」。' },
        {
          icon: '🗺️',
          title: '三个模块 + 一个证明',
          desc: 'RL 补训练，Eval 补评测，Agent 补部署——接下来一章一个，最后用 ClawGUI-2B 端到端验证。',
        },
      ],
    },

    // ─────────────── 第 2 章 · ClawGUI-RL ───────────────
    {
      kind: 'chapter',
      id: 'chap-2',
      title: 'ClawGUI-RL：训练闭环与稠密奖励',
      badge: 'trn',
      badgeLabel: 'ClawGUI-RL',
      bridge:
        '补第一处断口：训练。想让智能体自己去试错，先得有一套跑得起来的基建。这一节看两件事——<b>这套开源闭环由哪几块拼成</b>，以及它真正对付的那个麻烦：几十步操作只在终点换来一个 0 或 1，中间全是黑箱。看完你会明白，稠密奖励是必需品，不是锦上添花。',
      analogy: {
        title: '教练什么时候开口',
        text:
          '一种教练全程不出声，开到终点才给一句「不合格」——问题出在哪个路口，学员无从知道。另一种每过一个路口就点评一句：哪一下该改，当场就知道。',
        why:
          '<b>开完一趟</b>＝一条几十步的 GUI 任务轨迹，<b>终点那句「合格 / 不合格」</b>＝二值结果奖励，<b>每个路口那句点评</b>＝过程奖励模型（PRM）在每个动作后立刻给出的逐步奖励。选「什么时候开口」当切入点，是因为论文要解决的正是信用分配：不是缺少评价，而是评价没有落到具体某一步上。',
        componentId: 'an6',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '点亮训练闭环的每一环',
          desc: '任务 → Rollout 管理器 → 虚拟环境 / 真机 → 轨迹 → 奖励管理器 → RL 训练器 → 更新模型，回到环境继续试错。',
          componentId: 'rl-pipeline',
          figure: './images/fig2-rl.png',
        },
        {
          kind: 'module',
          id: '2.2',
          title: '同一条轨迹，两种奖励设置',
          desc: '切换「只有结果奖励」与「结果奖励 + PRM」：监督信号从 1 个变成 13 个，死路当场被标成负向。',
          componentId: 'm6a',
        },
      ],
      takeaways: [
        { icon: '🕳️', title: '稀疏是 GUI 的天性', desc: '执行延迟和多步交互让动作和后果隔得很远——只靠终点奖励学不动。' },
        { icon: '➕', title: '两级奖励相加', desc: '论文式 (1)：R = R_outcome + R_step。结果奖励保住大方向，PRM 每步打分填满中间。' },
        {
          icon: '🔌',
          title: '虚拟与真机同一接口',
          desc: '设备后端藏在统一抽象后，可在同一训练循环里互换——这是首个验证过真机在线训练的开源基建。',
        },
      ],
    },

    // ─────────────── 第 3 章 · ClawGUI-Eval ───────────────
    {
      kind: 'chapter',
      id: 'chap-3',
      title: 'ClawGUI-Eval：先让分数可信，再谈提升',
      badge: 'inf',
      badgeLabel: 'ClawGUI-Eval',
      bridge:
        '补第二处断口：评测。上一节把模型训出来了，可只要分数不可比，训得好不好就无从谈起。这一节回答一个前置问题：<b>在配置可以随手改的情况下，两篇论文的数字凭什么放在一起看</b>。看完你会知道，可复现靠的不是自觉，是把配置钉死。',
      analogy: {
        title: '两台没对齐的秤',
        text:
          '同一个人先后站上两台体重秤：一台指针没归零，一台归了零，读数差了好几斤。差的是秤，不是人——量尺不统一，两个数放在一起就没有意义。',
        why:
          '<b>人</b>＝被测的模型（权重一比特没改），<b>秤</b>＝一整套评测配置：提示词模板、输入分辨率、坐标归一化、采样温度，<b>读数</b>＝论文里报出来的分数。论文的原话是「2% 的提升可能只是换了个分辨率」——所以 ClawGUI-Eval 做的第一件事不是提高分数，而是先把秤归零：逐模型钉死配置，再谈读数。',
        componentId: 'an8',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '配置漂移 ⇄ 配置锁定',
          desc: '同一个模型、同一个基准：配置各不相同时两个分数没法比；钉死配置并走同一条 Infer → Judge → Metric 流水线后才可比。',
          componentId: 'm8a',
        },
        {
          kind: 'module',
          id: '3.2',
          title: '95.8% 复现率：48 个格子里对上了 46 个',
          desc: '点开两个红色格子——恰好都是官方配置未公开的模型，反过来印证本章论点。',
          componentId: 'm10b',
        },
      ],
      takeaways: [
        { icon: '🎚️', title: '四个隐形旋钮', desc: '提示词、坐标归一化、分辨率、温度，每项都能让分数漂几个点。' },
        { icon: '📌', title: '逐模型钉死配置', desc: 'Infer → Judge → Metric 三段解耦，任一段可独立重跑；全部预测结果公开。' },
        { icon: '✅', title: '漂移是基建问题', desc: '95.8% 复现率证明：评测不可复现不是本质限制——配置钉死，数字就能对上。' },
      ],
    },

    // ─────────────── 第 4 章 · ClawGUI-Agent ───────────────
    {
      kind: 'chapter',
      id: 'chap-4',
      title: 'ClawGUI-Agent：从训练场开到你的手机',
      badge: 'inf',
      badgeLabel: 'ClawGUI-Agent',
      bridge:
        '补第三处断口：部署。训得动、测得准之后还剩最后一段——<b>这套东西怎么真的被人用起来</b>。这一节看智能体如何接管一台真实手机，以及它凭什么听得懂一句没头没尾的指令。答案是记忆，不是更大的模型。',
      analogy: {
        title: '「老样子」',
        text:
          '常去的那家店，你只发三个字「老样子」，少冰半糖的那杯就送到面前。不记得你，就得每次把偏好从头说一遍。',
        why:
          '<b>店家记住的那些偏好</b>＝智能体抽取出来的结构化事实（联系人、常用 App、使用习惯），<b>一句「老样子」就够</b>＝按相关性检索 top-k 注入上下文后，用户不必重复交代前提，<b>下次来还记得</b>＝记忆跨会话持久保存。挑「常去的店」而不是「聪明的助手」，是因为这里的关键不是模型更强，而是它存住了关于你的信息。',
        componentId: 'an9',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '纯 CLI / 纯 GUI / 混合，链路在哪里断',
          desc: '纯 CLI 遇到没有程序接口的应用直接断链；纯 GUI 全能但链路长；混合策略有接口走 CLI，没有就退回 GUI。',
          componentId: 'm9a',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '一句话下达，链路一路走到真机',
          desc: '聊天平台 → 感知 / 推理 / 动作 → 混合 CLI-GUI → 真机执行。开关记忆，看推理环节多出的那张个性化上下文。',
          componentId: 'm9b',
        },
      ],
      takeaways: [
        {
          icon: '💬',
          title: '12+ 平台随叫随到',
          desc: '飞书、钉钉、Telegram、Discord、Slack、QQ……远程模式发消息即可指挥；本地模式里智能体直接接管本机。',
        },
        {
          icon: '🧠',
          title: '记忆让它越用越懂你',
          desc: '联系人、常用 App、习惯被抽成结构化事实存进向量库，按相关性检索 top-k 注入上下文，跨会话持久。',
        },
        {
          icon: '🪄',
          title: '评测成了一句话技能',
          desc: '对它说「benchmark Qwen3-VL on ScreenSpot-Pro」，整条评测流水线自动跑完——回扣第 3 章。',
        },
      ],
    },

    // ─────────────── 第 5 章 · ClawGUI-2B ───────────────
    {
      kind: 'chapter',
      id: 'chap-5',
      title: 'ClawGUI-2B：这套流水线到底有没有用',
      badge: 'both',
      badgeLabel: 'ClawGUI-2B · 实验',
      bridge:
        '前面三节都在讲框架，这一节负责举证。把同源的 2B 权重完整走一遍 ClawGUI-RL，看它能不能换来实打实的提升。两组对照分别回答<b>奖励设计值不值</b>和<b>整套流水线值不值</b>，再看参数规模能不能解释最终的排名。',
      analogy: {
        title: '练过的小个子，跑赢没练过的大块头',
        text: '块头大但没练过的，跑一半就掉速；个子小却系统训练过的，先冲过终点。决定成绩的不是体格，是练没练、怎么练。',
        why:
          '<b>体格</b>＝参数规模（2B / 32B / 72B），<b>系统训练</b>＝走完 ClawGUI-RL 这套流水线，<b>终点成绩</b>＝MobileWorld GUI-Only 成功率。要强调的是「练过」这个动作而不是「个子小」这个属性——论文要证明的是训练流水线有效，不是小模型天生更强，所以下一个模块专门用同规模、同源权重再对照一次。',
        componentId: 'an10',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '两组核心证据：奖励消融与同规模对比',
          desc: '奖励消融 14.5% → 17.1%（+2.6）；同规模对比 MAI-UI-2B 11.1% → ClawGUI-2B 17.1%（+6.0）。',
          componentId: 'm10a',
        },
        {
          kind: 'module',
          id: '5.2',
          title: '跨规模赛跑：11 个模型同场竞速',
          desc: '切到「按规模排序」，看 2B 的 ClawGUI-2B 越过 32B、72B、235B——规模和成绩不是正相关。',
          componentId: 'scale-race',
        },
      ],
      takeaways: [
        {
          icon: '🏆',
          title: '+6.0 绝对点来自训练基建',
          desc: '同源权重、同规模：17.1% vs 11.1%，差距可归因于这套训练流水线本身。',
        },
        {
          icon: '📏',
          title: '规模解释不了排名',
          desc: '2B 的 ClawGUI-2B 越过了 Qwen3-VL-32B、UI-Venus-72B、Qwen3-VL-235B-A22B 等更大的模型。',
        },
        {
          icon: '⚖️',
          title: '诚实的边界',
          desc: '17.1% 绝对值仍低，MAI-UI-8B（19.7%）与 Doubao-1.5-UI-TARS（26.3%）仍在其上；闭源前沿模型搭建的智能体框架（55.6%）属于不同范式，不参与对照。',
        },
      ],
    },

    // ─────────────── 第 6 章 · 收尾 ───────────────
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '整条路走完：三类证据各管一段',
      badge: 'both',
      badgeLabel: '总结 · 边界',
      bridge:
        '把三段接回一条路，同时把话说清楚。这一节让一条任务从训练一路走到部署，也交代一件容易被含糊过去的事：<b>三段各有各的证据，证明的东西并不一样，谁也替代不了谁</b>。',
      analogy: {
        title: '三处断口，都架上了桥',
        text: '第 1 章那条断了三处的路，现在三处断口各架起一座桥。同一辆车从头开到尾，一次走完全程。',
        why:
          '刻意用回第 1 章那张图、同样的三处断口，是因为<b>三座桥正好一一对应三个模块</b>：ClawGUI-RL 补训练、ClawGUI-Eval 补评测、ClawGUI-Agent 补部署。让同一辆车一次开完而不是三辆车各开一段，是想说明它们被接成了一条连续的路，而不是三个互不相干的工具——这正是论文标题里 unified 的意思。',
        componentId: 'an11',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '一条任务走完训练 → 评测 → 部署',
          desc: '点一次，看任务依次经过三段，每段亮出它自己的那类证据；末尾给出三类证据的边界。',
          componentId: 'end-to-end',
        },
      ],
      takeaways: [
        {
          icon: '🔗',
          title: '三段焊成一条',
          desc: '同一套框架里，训练基建、评测流水线、真机部署第一次被打通并全部开源。',
        },
        {
          icon: '🧾',
          title: '证据不能互相替代',
          desc: '17.1% 只验证训练流水线，95.8% 只验证评测可复现，12+ 平台与三类设备只验证部署能力。',
        },
        {
          icon: '🚧',
          title: '仍未解决的',
          desc: 'GUI 智能体在真实长程任务上的绝对成功率依旧偏低——框架把路修通了，模型能力仍是下一个问题。',
        },
      ],
    },
  ],
};

export default tutorial;
