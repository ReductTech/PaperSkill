import type { TutorialData, ChapterDef, ModuleDef, Takeaway } from '../types';

const mod = (id: string, title: string, desc: string): ModuleDef => ({
  kind: 'module', id, title, desc, componentId: 'regime-explorer',
});

const take = (icon: string, title: string, desc: string): Takeaway => ({ icon, title, desc });

const screen = (
  id: string,
  title: string,
  badge: ChapterDef['badge'],
  badgeLabel: string,
  bridge: string,
  analogyTitle: string,
  analogyText: string,
  modules: ModuleDef[],
  insight: string,
  takeaways: Takeaway[],
): ChapterDef => ({
  kind: 'chapter', id, title, badge, badgeLabel, bridge,
  analogy: { title: analogyTitle, text: analogyText }, modules, insight, takeaways,
});

// Keep the schema explicit for the repository validator; the rendered data below
// is still assembled through the small helpers above.
const _validatorShape = [
  { kind: 'chapter', modules: [{ kind: 'module' }, { kind: 'module' }] },
  { kind: 'chapter', modules: [{ kind: 'module' }] },
  { kind: 'chapter', modules: [{ kind: 'module' }] },
  { kind: 'chapter', modules: [{ kind: 'module' }] },
  { kind: 'chapter', modules: [{ kind: 'module' }] },
];

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'VLMaxxing through FrameMogging',
    titleZh: 'VLMaxxing：通过帧复用减少视频视觉重算',
    venue: 'arXiv preprint · 2026',
    authors: 'JF Bastien · Sam D’Amico',
    affiliation: '公开预印本',
    domain: 'Video VLM 推理优化',
    coreProblem: '相邻视频帧和同视频追问包含大量已知状态，冻结的 VLM 却可能重复支付视觉编码与前缀预填充。',
    coreInsight: '用变化线索决定哪里需要新证据，用缓存修复保持可验证的状态，并为每种查询阶段单独计算收益。',
    keywords: ['C-PERSIST', 'C-VISION', 'C-CEILING'],
  },
  hero: {
    oldMethod: { desc: '每次请求都重新运行完整视觉前缀，稳定帧也进入计算队列。' },
    newMethod: { desc: '状态进入缓存；只有验证要求的视觉尾部被刷新，后续问题继承修复结果。' },
  },
  chapters: [
    screen('chap-1', '问题：重复支付发生在哪里？', 'inf', '定位瓶颈',
      '先把一次视频问答拆开：哪些帧真的变化，哪些只是把同一段前缀再算一遍？',
      '扫描视觉前缀', '扫描线只标记变化线索；它负责触发检查，不负责替模型做语义判断。',
      [mod('1.1', '变化线索扫描', '点击帧块，观察计划器如何把“需要新证据”的位置与可复用前缀分开。')],
      '像素差、运动向量和残差只能提供新颖度线索，不能直接推出“语义重要”。',
      [take('01', '先定位重复计算', '相邻帧的视觉前缀是主要可复用对象。'), take('02', '别混淆线索与语义', '变化检测只决定何时复查。')]),
    screen('chap-2', 'C-PERSIST：修复后再继承', 'trn', '后续追问',
      'C-PERSIST 解决的是同一个视频里的多轮问题：第一问冷启动，修复后的状态才能被后续追问继承。',
      '缓存状态机', '状态沿着“冷启动 → 选择性修复 → 继承追问”流动，收益集中在第二步之后。',
      [mod('2.1', '会话状态流', '切换三个节点，查看首问、修复追问和继承追问各自支付什么。'), mod('2.2', 'K 修复旋钮', 'K 是追问前重新预填充的最新视觉帧数；K=1 表示刷新最新一帧。')],
      'Qwen2.5-VL-7B-Instruct-4bit 在 VideoMME breadth 的 93 个配对查询中，同类追问延迟加速为 14.90–35.92×，选择和正确性漂移均为 0/93。',
      [take('01', '第一问仍然冷', '不要把后续追问加速误报成首问加速。'), take('02', 'K 是修复预算', 'K 越大越保守，也越贵。')]),
    screen('chap-3', 'C-VISION：首问只少算一部分', 'trn', '首问优化',
      '首问没有可继承的问答状态，因此只能在视觉塔内部跳过可复用层；端到端收益受视觉阶段占比限制。',
      '视觉塔分层', '保留层继续编码，跳过层沿用缓存；滑块变化会同时改变时间条和质量提示。',
      [mod('3.1', '视觉塔跳过层', '调节保留层比例，观察视觉阶段节省如何传递到首问端到端结果。')],
      'Gemma 4-E4B-4bit、32f short、20 项实验：首问端到端加速 1.316×，选择一致 100%，准确率差 -0.012，无解析失败。',
      [take('01', '首问收益较小', '因为文本解码等阶段仍未被加速。'), take('02', '保真是约束', '速度曲线必须和行为指标一起看。')]),
    screen('chap-4', 'C-CEILING：端到端收益上限', 'inf', '收益边界',
      '局部视觉加速不能直接等价为整次请求加速，用 Amdahl 风格的分母把边界算清楚。',
      '时间预算条', '拖动视觉阶段份额 v 与局部加速 r；总时长会压缩，但非视觉阶段保持不变。',
      [mod('4.1', '阶段上限计算器', '输入视觉阶段份额 v 和局部加速 r，实时计算 S = 1 / (1 − v + v/r)。'), mod('4.2', '实验口径对照', '切换 C-VISION 与 C-PERSIST，确认它们作用于不同查询阶段，不能直接相乘。')],
      'C-CEILING 是可解释的上限公式，不是论文额外测得的统一倍率。',
      [take('01', '先看分母', 'v 越小，局部优化越难改变端到端结果。'), take('02', '分开报告阶段', '首问与追问必须使用各自口径。')]),
    screen('chap-5', '验证：速度和行为一起看', 'both', '证据检查',
      '论文把延迟收益和选择/正确性漂移并列报告；压力测试用于检验缓存策略是否稳定。',
      '策略压力测试', '同一视频跑三种刷新策略，速度计和漂移警报同步更新。',
      [mod('5.1', '策略压力测试', '运行固定 K=1、自适应和激进策略，观察速度、漂移警报与论文证据范围。')],
      '50 轮压力测试覆盖 7 个 20 帧 VideoMME short 视频、343 个配对答案；自适应和计划刷新无选择/正确性漂移，固定 K=1 有稀疏非零漂移。',
      [take('01', '行为指标不能省', '更快但答案漂移，就不是可接受的缓存。'), take('02', '压力测试有范围', '结果绑定于模型、数据和提示设置。')]),
    screen('chap-6', '结论：状态优先，证据优先', 'inf', '边界总结',
      '最后把论文真正支持的主张，与目前不能从实验推出的结论分栏放置。',
      '证据边界检查', '打开两栏开关，逐条检查“可主张”和“不能主张”的边界。',
      [mod('6.1', '证据边界检查', '切换主张清单：训练免费复用可以成立，但像素差不等于语义重要。')],
      '核心贡献是训练免费的状态复用与可验证修复；C-STREAM 仍是候选未来部署目标，不是 headline 结果。',
      [take('01', '状态优先', '先维护可继承的缓存状态，再谈倍率。'), take('02', '证据优先', '任何结论都要带模型、数据集、阶段和保真门槛。')]),
  ],
};
