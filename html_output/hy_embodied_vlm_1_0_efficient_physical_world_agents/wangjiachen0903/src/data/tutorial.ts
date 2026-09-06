import type { TutorialData } from '../types';

// ============================================================================
//  Hy-Embodied-VLM-1.0 · 高效物理世界智能体
//  所有正文为简体中文。数据驱动：框架只负责渲染 tutorial 对象。
//  全部 componentId 均已在 src/modules/registry.tsx 注册。
// ============================================================================

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Hy-Embodied-VLM-1.0: Efficient Physical-World Agents',
    titleZh: 'Hy-Embodied-VLM-1.0：高效物理世界智能体',
    venue: 'arXiv:2607.12894v1 [cs.CV] · 2026',
    authors: 'Tencent Robotics X · Hy Vision Team · Futian Laboratory',
    affiliation: 'Tencent Robotics X / Hy Vision Team / Futian Laboratory',
    domain: '具身智能 · 视觉-语言模型 · 机器人',
    coreProblem:
      '物理世界智能体不仅需要看懂场景，还要推理动作、预测状态变化并在长程任务中持续纠错；同时还要足够轻，才能低延迟部署。',
    coreInsight:
      '以“动作”为中心，把能力组织成状态理解 → 动作转换 → 长程自适应三层；再用每 token 仅激活约 3B 参数的 MoE 架构，把强能力装进小推理预算。',
    keywords: ['具身智能', '视觉-语言模型', '混合专家 MoE', '强化学习', '视觉语言导航'],
    stats: ['38 基准平均 65.6', '领先 Qwen3.6-A3B 4.4 分', '每 token 激活约 3B'],
  },

  hero: {
    oldMethod: {
      desc: '常规 VLM 偏向“看图问答”，动作后果、长程规划与失败恢复都弱；密集大模型又让低延迟部署变得困难。',
      componentId: 'hero-compare',
    },
    newMethod: {
      desc: 'Hy-Embodied-VLM-1.0 用动作中心三层能力组织数据与训练，Hy-ViT2 原生分辨率看世界，Hy3-A3B 只激活约 3B 参数；38 个基准平均 <b>65.6</b>，领先最强可比基线 4.4 分。',
      componentId: 'hero-compare',
    },
  },

  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '这篇论文在解决什么问题？',
      shortTitle: '问题',
      badge: 'inf',
      badgeLabel: '问题导入',
      bridge:
        '数字世界里的智能体已经很能干了；但进入真实物理世界，模型不能只回答“图里有什么”，而必须完成三件事：看懂可行动的状态、预测动作后果、在长周期任务中持续纠错。接下来的五章，就是论文围绕这三件事给出的五条核心贡献：能力分类法、数据管线、模型架构、训练管线和评测验证。',
      analogy: {
        title: '同一张桌面上的三件事',
        text:
          '先让一束光扫过桌面，把物体、深度与可操作性都看清；再拨动一颗球，提前推演它会造成什么变化；最后沿一条会出错的长路线走到终点，并及时修正。',
        componentId: 'ana-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '准确理解当前物理状态',
          desc:
            '拖动扫描线扫过房间：画面被逐层解析成物体、深度/几何、空间关系，以及机器人真正关心的可抓取部位与可放置区域。这就是“动作相关的状态理解”。',
          componentId: 'state-scanner',
        },
        {
          kind: 'module',
          id: '1.2',
          title: '判断动作，并预测它带来的状态变化',
          desc:
            '在台球桌上拖动瞄准方向与力度：虚线是模型在动作执行前对“状态转移”的预测，松手发射后白球真实运动。物理智能体必须同时懂动作与后果。',
          componentId: 'action-table',
        },
        {
          kind: 'module',
          id: '1.3',
          title: '长周期任务里规划、发现失败、自我修复',
          desc:
            '逐步推进一段航线：小船按计划航行，中途被侧风吹偏，模型发现偏差后不再硬走原路，而是重新规划并到达终点。长程任务需要持续执行与自我恢复。',
          componentId: 'route-replan',
        },
        {
          kind: 'module',
          id: '1.4',
          title: '整篇教程路线图',
          desc:
            '点击路线节点，预览后面五章如何逐层回答三个问题：分类法给出能力语言，数据管线提供训练素材，模型架构承载能力，训练管线把能力炼出来，最后用评测与闭环验证收束。',
          componentId: 'route-map',
        },
      ],
      insight:
        '三个问题不是三张独立的考卷，而是同一条感知—行动链：先看懂状态，再预测动作后果，最后在长周期执行中不断规划与修复。',
      takeaways: [
        { icon: '👁️', title: '看懂状态', desc: '物体、深度、空间与机器人可操作性，都要变成可行动的状态。' },
        { icon: '🎯', title: '预测后果', desc: '选择一个动作，并推演它引发的局部状态变化。' },
        { icon: '🧭', title: '持续修复', desc: '长程任务中持续规划、发现偏差并自我恢复。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-2',
      title: '核心贡献 1：以动作中心的三级能力分类法',
      shortTitle: '分类法',
      badge: 'inf',
      badgeLabel: '顶层设计',
      bridge:
        '上一章把问题拆成“看懂状态、预测转换、长程修正”三件事。这一章给出论文的第一条贡献：把这三件事正式定义成<b>动作相关状态理解、动作-转移推理、序列与自适应推理</b>三个递进层级。它不是一句口号，而是后面数据、训练、评测共同使用的统一设计语言。',
      analogy: {
        title: '一张纸的三种读法',
        text:
          '先读懂纸上的折痕与几何；再折一下，观察形状如何改变；最后按步骤折成纸飞机，折错了就展开重来。',
        componentId: 'origami-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '三层能力，一张折纸工作台看懂',
          figure: '/images/fig-2-taxonomy.png',
          desc:
            '点击三个层级，观察同一张纸的三种状态：Level 1 只看懂折痕与几何；Level 2 执行一次折叠并观察形状变化；Level 3 按多步顺序折成纸飞机，并在折错时重来。下方详情区列出论文中每一层的完整子能力与评测证据。',
          componentId: 'origami-layers',
        },
        {
          kind: 'module',
          id: '2.2',
          title: '折一下：动作如何造成局部状态变化',
          desc:
            '拖动纸张右边缘完成一次折叠：橙色虚线是动作前的“预测折痕”，蓝色阴影是折叠后应当出现的新状态。这对应 Level 2 的动作决策、物理可行性与局部效果——动作必须同时回答“做什么、能否做、做完会变成什么样”。',
          componentId: 'origami-fold',
        },
        {
          kind: 'module',
          id: '2.3',
          title: '纸飞机步骤：选下一步，错了就展开重来',
          desc:
            '每个回合根据当前纸张状态选择“下一步动作”。如果选择因果倒置或不可执行的步骤，模型会拒绝并给出正确方向；连续选对四步后折出纸飞机。这对应 Level 3 的目标分解、因果动作排序与进度感知续推。',
          componentId: 'origami-planner',
        },
      ],
      insight:
        '分类法本身不是网络结构，而是一种能力语言：Level 1 建立可行动的状态，Level 2 选择动作并预测局部转移，Level 3 用历史、目标与反馈持续规划并修正。',
      formula: {
        lead: '论文 Figure 2 背后是一条从状态到长程行为的能力链，点击公式中的彩色符号查看含义：',
        unicode: '<i class="fm-state">ω</i><sub>t</sub> <span class="fm-arrow">→</span> <i class="fm-act">a</i><sub>t</sub> <span class="fm-arrow">→</span> <i class="fm-delta">Δ</i><sub>t</sub> <span class="fm-arrow">→</span> <i class="fm-hist">H</i><sub>t+1</sub> <span class="fm-arrow">→</span> <i class="fm-act">a</i><sub>t+1</sub>',
        symbols: [
          { sym: 'ω', desc: 't 时刻的动作相关状态：物体、几何、机器人状态与可供性。' },
          { sym: 'a', desc: '当前选择的动作或技能，需要接地到目标物体与部件。' },
          { sym: 'Δ', desc: '动作引起的局部状态变化，包括前置条件、机制与后置条件。' },
          { sym: 'H', desc: '更新后的观察历史与执行反馈，支持长程规划与重规划。' },
        ],
      },
      takeaways: [
        { icon: '👁️', title: 'Level 1 看懂状态', desc: '物理/语义感知、空间推理、机器人中心理解，共 23 个基准，平均 68.6。' },
        { icon: '🔁', title: 'Level 2 预测转换', desc: '交互理解、动作接地、物理可行性与局部效果，共 8 个基准，平均 64.1。' },
        { icon: '🧭', title: 'Level 3 持续修正', desc: '长程规划、视觉语言导航、反思修复与恢复，共 7 个基准，平均 57.4。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-3',
      title: '核心贡献 2：围绕分类法构建的系统化数据管线',
      shortTitle: '数据',
      badge: 'trn',
      badgeLabel: '数据管线',
      bridge:
        '能力分类体系确定要培养什么能力，数据管线决定各训练阶段如何供给监督。预训练数据完全继承 Hy-Embodied-0.5，用于建立广泛视觉接地与通用具身理解；中期训练与 SFT 在继承混合数据的基础上新增七类能力导向数据与少量思维链；RL 优先选择可用结构化规则或可靠裁判评价的任务。这不是同一批数据依次经过三层过滤，也不是完整训练流程——第一阶段 RL 之后还有拒绝采样、RFT、奖励专门化 RL 与参数融合，详见 §5。',
      analogy: {
        title: '三份配方，分阶段喂给同一个模型',
        text:
          '预训练、SFT、RL 不是同一批数据被反复过滤，而是三份不同配方：一份打广泛基础，一份按能力层补监督，一份优先用可评价奖励优化推理。',
        componentId: 'stage-mix-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '三阶段数据组织：预训练 / SFT / RL',
          figure: '/images/fig-3-data.png',
          desc:
            '点击三个阶段：预训练数据完全继承 Hy-Embodied-0.5，建立广泛视觉接地与通用具身理解；SFT 在继承混合数据上新增七类能力导向数据与少量思维链，覆盖全部三个能力层；RL 优先使用可结构化验证或可靠裁判评价的任务。注意：这里显示的 θ_rl 只是第一阶段 RL 的产物，不是最终部署模型；RFT、第二阶段 RL 与专家融合在 §5。',
          componentId: 'data-distiller',
        },
        {
          kind: 'module',
          id: '3.2',
          title: 'DAgger 教学交接：老师慢慢放手',
          desc:
            '转动半圆刻度盘，沿轨迹时间 t 移动。β_t = 1 − α·t/T，α=0.5：开始时几乎总由 oracle 老师演示，越到后期学生策略自己试错的概率越高。无论当前访问状态由谁到达，都保存该状态下未来 4 步 oracle 动作块作为训练监督——它不是“每帧实际执行”的轨迹，而是纠错标签。论文正文中有一句英文描述与公式方向相反，本页按公式解释。',
          componentId: 'dagger-dial',
        },
        {
          kind: 'module',
          id: '3.3',
          title: '七类新增 SFT 数据：从数据源到训练信号',
          desc:
            '点击七个数据瓶，查看每一类新增 SFT 数据的来源、构造方式和它服务的能力层级：深度推理、任务条件接地与可供性定位、社会交互、物体/机器人中心轨迹监督、因果推理、失败感知型机器人推理、视觉-语言导航。',
          componentId: 'data-jars',
        },
      ],
      insight:
        '能力分类体系是数据组织的统一主线：SFT 与 RL 数据都按能力层级重新组织，Embodied-R1.5 的部分数据也按这套体系重组。但进入哪个阶段还取决于监督形式、输出结构、标签可靠性与奖励可验证性，论文并未给出严格的“先分类再分配”算法。',
      formula: {
        lead: 'DAgger 第二阶段，老师（oracle）与学生（当前策略）的交接概率：',
        unicode: '<i class="fm-state">β</i><sub>t</sub> = 1 − <i class="fm-act">α</i> · <i class="fm-delta">t</i> / <i class="fm-hist">T</i>, <i class="fm-act">α</i> = 0.5',
        symbols: [
          { sym: 'β', desc: '当前步由 oracle 老师执行的概率；随 t 从 1 线性下降。' },
          { sym: 'α', desc: '交接速度系数，论文中设为 0.5。' },
          { sym: 't', desc: '当前轨迹步数。' },
          { sym: 'T', desc: '该条 ground-truth 路径的总步数。' },
        ],
      },
      takeaways: [
        { icon: '🧱', title: '预训练打广泛基础', desc: '完全继承上一代混合数据，覆盖检测、深度、分割、指向、计数、空间对应、几何、可供性、轨迹、规划与通用视觉语言理解。' },
        { icon: '🧪', title: 'SFT 补七类能力数据', desc: '深度推理、任务条件接地与可供性定位、社会交互、物体/机器人轨迹、因果推理、失败感知推理、视觉语言导航。' },
        { icon: '🎯', title: 'RL 优先可评价', desc: '优先使用结构化规则奖励；开放式任务由 LLM 裁判兜底；只有裁判服务失败才掩码该样本。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-4',
      title: '核心贡献 3：高效的模型架构',
      shortTitle: '架构',
      badge: 'trn',
      badgeLabel: '模型架构',
      bridge:
        '模型采用模块化视觉语言架构：Hy-ViT2 视觉编码器支持不同分辨率和宽高比的输入，以更好地保留细粒度视觉信息并减少统一缩放造成的失真；视觉特征经轻量连接器投影到语言模型表示空间，与文本上下文联合处理。语言主干 Hy3-A3B 采用 MoE 架构，约有 30B 总参数，每个 token 约激活 3B 参数。论文未披露具体专家数量、Top-k、模态专家分工、图像填充策略或实际延迟数据。',
      analogy: {
        title: '光路开关，只点亮需要的专家支路',
        text:
          '专家并不是从一束总参数里分出来的，而是本来就存在的参数子网络；路由器像光路开关，根据当前 token 的表示，选择少量专家支路让它通过。',
        componentId: 'prism-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '原生分辨率取景框：画面不该被统一裁切',
          desc:
            '左边是原图，拖动右下角手柄改变它的宽高比；右上只是“常见的固定分辨率编码”教学示意：等比缩放后填充到 1:1 正方形，宽图上下留白、竖图左右留白；右下 Hy-ViT2 支持任意宽高比，尽量减少统一固定尺寸缩放造成的失真。论文未披露本模型具体的缩放、填充与分块策略，因此不要把此图当作实现细节。',
          componentId: 'native-window',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '稀疏光路：每个 token 只点亮少量专家',
          desc:
            '这是 MoE 稀疏路由的概念示意，不是论文披露的真实配置。点击三种示意 token，观察“当前 token 只经过少量专家支路”的思想：语言主干总参数约 30B，每个 token 约 3B 参数参与计算。论文未披露专家总数、Top-k、专家编号或模态分工；E1–E8、E2+E5 只为示意。',
          componentId: 'moe-fibers',
        },
      ],
      insight:
        '架构的核心权衡是模型能力与推理效率：原生分辨率视觉编码有助于减少统一固定尺寸缩放造成的信息损失；MoE 通过稀疏参数激活降低语言主干每个 token 参与计算的参数规模；轻量连接器保持多模态架构简洁。激活参数量不等于实际 FLOPs 或延迟，真实性能还取决于视觉 token 数、序列长度、路由通信、硬件和部署实现。',
      formula: {
        lead: '参数账本（激活参数量 ≠ FLOPs / 显存 / 延迟）：',
        unicode: 'N_total ≈ 30B    N_active ≈ 3B',
        symbols: [
          { sym: 'N_total', desc: 'Hy3-A3B 语言主干约 30B 总参数；论文未说明是否已包含视觉编码器与连接器。' },
          { sym: '30B', desc: '约 300 亿总参数；存储和分布式部署仍可能接近总参数规模。' },
          { sym: 'N_active', desc: '每个 token 参与计算的参数规模，约 3B；它不是 FLOPs、显存或延迟本身。' },
          { sym: '3B', desc: '约 30 亿激活参数；不等于一个 3B 稠密模型的总计算或显存成本。' },
        ],
      },
      takeaways: [
        { icon: '🖼️', title: 'Hy-ViT2 原生分辨率', desc: '支持不同分辨率与宽高比，减少统一固定尺寸缩放造成的信息损失与几何失真；具体填充/分块策略未披露。' },
        { icon: '🧠', title: 'Hy3-A3B 稀疏专家', desc: '语言主干总参数约 30B，每 token 约 3B 参数参与计算；实际 FLOPs、显存与延迟还取决于序列长度、视觉 token 数、路由通信与部署实现。' },
        { icon: '🔌', title: '轻量连接器', desc: '把视觉特征投影进语言空间，与文本组成统一序列；论文还提到若干多模态适配，但未披露具体结构。' },
      ],
    },





    {
      kind: 'chapter',
      id: 'chap-5',
      title: '核心贡献 4：RL 激发、拒绝采样内化与专门化融合',
      shortTitle: '训练',
      badge: 'trn',
      badgeLabel: '训练机制',
      bridge:
        '模型架构已经固定，这一章看如何把能力“炼”出来。训练不是一次微调到位，而是一次离线自生成数据回流：<b>Stage-I RL</b> 激发推理，<b>拒绝采样微调（RFT）</b> 把约 100 万条经自动条件筛选的 long-CoT 内化回干净模型，<b>Stage-II RL</b> 训练连续/离散奖励专门化模型，最后参数融合部署。它不是部署后的自主持续进化，而是人工设计、离线执行的多阶段后训练流水线。',
      analogy: {
        title: '老师出题，学生重新学教材',
        text:
          'RL 模型像老师，先大量解题；系统筛选出高质量教材后，不直接保留老师末期参数，而是让预训练底座重新学习这些教材，再分科练习后合卷。',
        componentId: 'teacher-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '本文 GRPO 变体：组内中心化 + batch 级尺度归一化',
          desc:
            '点击五个采样奖励中的一个（五样本仅为教学简化，实际 G=16）。本文变体把分子按组内均值中心化，分母改用整个 batch 的标准差，这是本文的 GRPO 变体，不是标准 GRPO 定义。优势为正只表示优化目标倾向于提高该回答相对旧策略的概率，是否实际增加还受概率比与非对称裁剪 [0.8,1.35]（本文超参数）影响。',
          componentId: 'grpo-balance',
        },
        {
          kind: 'module',
          id: '5.2',
          title: '奖励结构匹配输出结构',
          desc:
            '切换输出类型，观察本文任务感知奖励的简化示例：单框 IoU、点距离衰减、长度归一化离散 Fréchet、连续量相对误差、LCS 排序、方向命中且不矛盾。可解析结构优先使用规则奖励；开放式输出主要依赖 LLM 裁判，部分结构化任务解析失败时也会调用裁判提取答案；只有裁判服务无法给出有效判定时才掩码样本。结构匹配降低解析噪声，但仍需阈值与抽检防止奖励投机。',
          componentId: 'reward-gauges',
        },
        {
          kind: 'module',
          id: '5.3',
          title: '多阶段流程：RL 出数据，RFT 从 θ_pt 重训，双分支融合',
          figure: '/images/fig-4-training.png',
          desc:
            '点击检查点查看参数继承与数据依赖：θ_pt → θ_sft → θ_rl；θ_rl 只负责生成候选轨迹，拒绝采样得到约 100 万条经自动条件筛选的 long-CoT；RFT 回到 θ_pt 重新训练得到 θ_cons；再从 θ_cons 并行训练 θ_cont 与 θ_disc，最后参数融合为 θ_final。注意 θ_rl → θ_cons 不是参数连续微调。',
          componentId: 'train-helix',
        },
        {
          kind: 'module',
          id: '5.4',
          title: 'RFT 三重筛选条件：奖励阈值、critic、一致性',
          desc:
            '点击三个筛选条件，看一条 RL 生成轨迹如何被筛选：任务奖励达到该类型的阈值 η；LLM critic 检查推理连贯性与视觉依据；候选间一致性用于比较。best-of-N=4 是候选采样数，self-consistency 是候选间比较，二者不是一回事。论文按这三个互补条件过滤，页面不把它们包装成必须按固定顺序串联的“三关”。',
          componentId: 'rft-stamps',
        },
      ],
      insight:
        '训练的核心是把 RL 当成生成器、把 RFT 当成内化器：先让模型学会推理，再把经自动条件筛选的推理数据回灌到较干净的预训练检查点。这个过程是离线、单次的数据回流流水线；参数融合是否能同时保留两个专门化模型的峰值能力，仍需融合消融与各任务评测确认。',
      formula: {
        lead: '多阶段训练流程（点击符号查看含义；实线为参数继承，虚线为数据依赖）：',
        unicode: 'θ_pt → θ_sft → θ_rl<br/>θ_rl ⇢ D_CoT（数据）<br/>(θ_pt, D_CoT) → θ_cons<br/>θ_cons → θ_cont ∥ θ_disc → θ_final',
        symbols: [
          { sym: 'θ_pt', desc: '具身预训练检查点；RFT 从这里重新训练，而不是从 θ_rl 继续微调。' },
          { sym: 'θ_sft', desc: '中期训练与 SFT 后的冷启动策略，带少量思维链格式。' },
          { sym: 'θ_rl', desc: 'Stage-I RL 激发出的推理策略；在流程中主要作为数据生成器。' },
          { sym: 'D_CoT', desc: 'θ_rl 生成的候选轨迹经奖励、critic、一致性筛选后得到的 long-CoT 数据集。' },
          { sym: 'θ_cons', desc: 'RFT 从 θ_pt 和筛选后 D_CoT 重训得到的推理内化检查点。' },
          { sym: 'θ_cont', desc: '连续奖励专门化模型，从 θ_cons 并行训练；不是 MoE 架构内部的专家。' },
          { sym: 'θ_disc', desc: '离散奖励专门化模型，从 θ_cons 并行训练；不是 MoE 架构内部的专家。' },
          { sym: 'θ_final', desc: '两个专门化模型参数融合后的最终部署模型；融合系数论文未披露。' },
        ],
      },
      takeaways: [
        { icon: '⚖️', title: '本文 GRPO 变体', desc: '组内均值中心化 + batch 级标准差归一化；[0.8,1.35] 是本文超参数。' },
        { icon: '🧪', title: '奖励看结构', desc: '可解析结构优先规则奖励；开放式输出主要依赖 LLM 裁判，解析失败也可用裁判提取。' },
        { icon: '🌱', title: 'RFT 回炉重训', desc: '拒绝采样得到约 100 万条经自动条件筛选的 long-CoT，再从 θ_pt 重训。' },
      ],
    },



    {
      kind: 'chapter',
      id: 'chap-6',
      title: '核心贡献 5：大规模评测与闭环验证',
      shortTitle: '评测',
      badge: 'both',
      badgeLabel: '评测验证',
      bridge:
        '训练完成后，最后的问题是：能力到底行不行，结论在什么边界内成立。论文用 38 个诊断基准按三层能力分组评测，并在统一管线里独立重评可比参数模型；再用 R2R-CE 和零样本 ObjectNav 两个闭环系统验证能力能否串起来工作。这一章同时把论文的局限如实摆出来。',
      analogy: {
        title: '同一把卷尺量三根木条',
        text:
          '卷尺依次拉过三根木条，刻度相同、起点相同；最长的那根不是靠目测，而是靠同一把尺子读出来的。评测协议就是这样一把卷尺。',
        componentId: 'ruler-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '38 个基准的排名台',
          figure: '/images/fig-1-performance.png',
          desc:
            '切换指标，查看可比参数模型在同一评测协议下的成绩：总平均 65.6、状态理解 68.6、动作转换 64.1、长程自适应 57.4，以及 R2R-CE 与 ObjectNav。A30B 只作参考，不参与排名。',
          componentId: 'bench-podium',
        },
        {
          kind: 'module',
          id: '6.2',
          title: '闭环导航：观察 → 记忆 → 决策 → 环境更新',
          figure: '/images/fig-8-nav.png',
          desc:
            '点击回路节点，看同一个模型如何在每一步重复“观察、记忆、动作块、验证停止”：R2R-CE 得到 SR 57.9 / SPL 54.2 / NE 4.5m；零样本 MP3D ObjectNav 得到 SR 38.3 / SPL 11.2。',
          componentId: 'nav-loopmap',
        },
        {
          kind: 'module',
          id: '6.3',
          title: '证据边界检查：原话、推断与未竟问题',
          desc:
            '点击四个结论，区分“论文原话 / 合理推断 / 需要更多证据”。例如 A32B 与 A30B 的写法不一致、没有正式 Limitations 章节，都是读者需要知道的边界。',
          componentId: 'evidence-scale',
        },
        {
          kind: 'module',
          id: '6.4',
          title: '成绩单怎么读：五条对比协议',
          desc:
            '点击清单上的五条协议，逐条看懂这张成绩单的成立条件：只与可比激活参数模型排名、所有基线由作者统一重评、thinking / non-thinking 模式分别记录、分数统一为越高越好、A30B 仅参考不参与排名。',
          componentId: 'protocol-board',
        },
      ],
      insight:
        '评测的意义不是挑一个最高分，而是让读者知道：在什么协议下、和谁比、指标方向是什么、结论能在多大范围内成立。',
      formula: {
        lead: '论文的总体结论：',
        unicode: 'Overall = 65.6    Δ = 65.6 − 61.2 = 4.4',
        symbols: [
          { sym: 'Overall', desc: '38 个诊断基准的总体平均分，统一换算为百分比且越高越好。' },
          { sym: '65.6', desc: 'Hy-Embodied-VLM-1.0 A3B 的总平均分。' },
          { sym: '61.2', desc: '最强可比基线 Qwen3.6-A3B 的总平均分。' },
          { sym: 'Δ', desc: '本文模型相对最强可比基线的平均提升。' },
        ],
      },
      takeaways: [
        { icon: '🏆', title: '38 基准第一 19 项', desc: '第二 11 项，前二共 30 项；总平均 65.6。' },
        { icon: '🧭', title: '闭环导航成立', desc: 'R2R-CE SR 57.9；零样本 ObjectNav SR 38.3。' },
        { icon: '🧾', title: '结论有边界', desc: '排名只在参数可比协议下成立；基线由作者统一重评。' },
      ],
    },

    {
      kind: 'chapter',
      id: 'chap-7',
      title: '总结：五条贡献合成一个完整答案',
      shortTitle: '总结',
      badge: 'both',
      badgeLabel: '总结',
      bridge:
        '把前面六章收拢成一张图：三个问题催生五条贡献——分类法定义能力，数据管线提供素材，模型架构承载能力，训练管线把能力炼出来，评测与闭环验证证明能力可用；每一环都以前一环为前提。',
      analogy: {
        title: '六块拼图合成一张完整地图',
        text:
          '问题、分类法、数据、架构、训练、评测像六块独立拼图，只有按正确顺序拼在一起，才能看到 Hy-Embodied-VLM-1.0 的完整设计地图。',
        componentId: 'summary-ana',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '核心贡献总览：点击六边形回顾全篇',
          desc:
            '点击六边形节点，回顾每一环解决什么问题、留下什么关键数字。最后一次检查：这篇论文不是六个孤立模块，而是一条从问题到部署的完整逻辑链。',
          componentId: 'summary-hive',
        },
      ],
      insight:
        '阅读论文的最高目标不是记住所有数字，而是能复述这条链：为了造一个高效物理世界智能体，先用动作中心分类法统一语言，再围绕它造数据、选架构、设训练，最后用统一协议证明它。',
      takeaways: [
        { icon: '🧩', title: '一条完整逻辑链', desc: '分类法 → 数据 → 架构 → 训练 → 评测，环环相扣。' },
        { icon: '📊', title: '关键数字', desc: '38 基准平均 65.6；状态 68.6、转换 64.1、长程 57.4；R2R-CE SR 57.9。' },
        { icon: '🧭', title: '带着边界读论文', desc: '记住结论的成立条件，比记住第一名更重要。' },
      ],
    },

  ],

  // 未找到可核验的 B 站视频，按 contract.md §7 省略 bilibili 数组。
};
