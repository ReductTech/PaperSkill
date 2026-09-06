import type { TutorialData } from '../types';

// SWIM（See What I Mean）交互式教程数据。可见文字均为简体中文。
// 每个 componentId 已在 src/modules/registry.tsx 注册。

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'See What I Mean: Aligning Vision and Language Representations for Video Fine-grained Object Understanding',
    titleZh: '所见即所意：对齐视觉与语言表征的视频细粒度物体理解',
    venue: 'arXiv:2605.18018v1 [cs.CV] · 2026',
    authors: 'Boyuan Sun, Bowen Yin, Yuanming Li, Xihan Wei, Qibin Hou',
    affiliation: '南开大学 · 阿里巴巴通义实验室 · NKIARI',
    domain: '多模态大语言模型 / 视频理解',
    coreProblem: '通用 MLLM 整体场景理解很强，却难以稳定聚焦到用户指定的物体，限制了细粒度物体理解能力。',
    coreInsight: '跨注意力可视化揭示系统性错位：属性词激活锐利，物体名词激活弥散。SWIM 在训练期用掩码把物体名词的跨注意力对齐到目标区域，推理时只需纯文本即可精确指代。',
    keywords: ['跨注意力对齐', '视频物体理解', '纯文本指代', 'NL-Refer'],
  },
  hero: {
    oldMethod: {
      desc: '视觉提示范式——需要掩码、框或点来引导，推理时仍需额外视觉输入，增加复杂度。',
      componentId: 'hero-focus',
    },
    newMethod: {
      desc: 'SWIM——训练期用掩码对齐物体名词的跨注意力，推理时纯文本即可定位。',
      componentId: 'hero-focus',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '问题：为什么「说得到」却「指不到」',
      badge: 'inf',
      badgeLabel: '理解',
      bridge: '从整体理解到细粒度指代，本节点出 SWIM 要解决的核心痛点：模型能描述画面，却对不准那个指定的物体。',
      analogy: {
        title: '对焦环失准',
        text: '盆栽花失焦，红色散焦框松散包围，绿色对焦框始终套不牢主体——只靠整体看画面，却对不准「指定的物体」。',
        componentId: 'photo-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '对齐监督强度与对焦',
          desc: '拖动「对齐监督强度」滑块，观察注意力热斑如何从弥散（红）收紧为锐利（绿），对焦框由松散变紧贴主体。',
          componentId: 'mod1-focus',
        },
      ],
      insight: '弥散与锐利之间，只差一个针对物体名词的对齐监督信号。',
      takeaways: [
        { icon: '🎯', title: '问题', desc: '只靠文本难聚焦指定物体' },
        { icon: '🔧', title: '旧法', desc: '视觉提示增加复杂度与额外输入' },
        { icon: '✨', title: '目标', desc: '纯文本精确定位' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '输入：物体名词 vs 属性词',
      badge: 'inf',
      badgeLabel: '理解',
      bridge: '上一节引出「指不到」；本节拆解文本 token 如何与视觉 token 交互，并区分两种关键词。',
      analogy: {
        title: '取景框框选',
        text: '取景框在画面游移，最终框住盆栽花——关键在框住「命名主体」，而不是背景纹理。',
        componentId: 'photo-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '点击词汇看对焦范围',
          desc: '点击句子里的词，观察视觉 token 网格上的注意力热斑：属性词对应颜色、纹理等低层局部特征，激活更锐利；物体名词承载高层语义身份，激活更宽泛、弥散。',
          componentId: 'mod2-words',
        },
      ],
      insight: '这不是个别词的偶发现象，而是系统性语义错位：属性词天然对应低层局部视觉，物体名词依赖分布式高层语义，因此需要显式的跨模态对齐监督。',
      takeaways: [
        { icon: '🎨', title: '属性词', desc: '低层局部特征，激活锐利' },
        { icon: '📦', title: '物体名词', desc: '高层分布式语义，激活弥散' },
        { icon: '⚖️', title: '系统性错位', desc: '语义层级差异，需要显式对齐' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '数学：softmax 注意力与多层聚合',
      badge: 'both',
      badgeLabel: '综合',
      bridge: '承接「错位」；本节给出度量和聚合错位的公式，为对齐监督奠定数学基础。',
      analogy: {
        title: '多层信号叠合',
        text: '不同网络层各自给出一张注意力图；将多层稳定信号取平均，可以压低单层噪声并保留共同峰值。',
        componentId: 'photo-analogy',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: 'softmax 温度与 token 概率',
          desc: '拖动「集中度」（即温度倒数），观察同一组视觉 token 的 softmax 概率如何重新分配：集中度越高，最大响应 token 的概率越大、分布熵越低。',
          componentId: 'mod4-spread',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '多层聚合方式',
          desc: '切换 Add / Pool / Prod / Mean，比较 VideoRefer-D 平均分，看哪种聚合最稳。',
          componentId: 'mod4-agg',
        },
      ],
      formula: {
        lead: '物体名词到视觉 token 的注意力权重经 softmax 归一化，再对选定层取平均聚合：',
        unicode: 'A_{l,i} = softmax( Q·Kᵀ / √d )，  Ā_i = (1/|S|) · Σ_{l∈S} A_{l,i}',
        symbols: [
          { sym: 'A_{l,i}', desc: '第 l 层物体名词到视觉 token 的注意力权重（向量，长 Lv）' },
          { sym: 'Q, K', desc: 'query / key 向量（长 d）' },
          { sym: 'd', desc: '隐藏维度（标量）' },
          { sym: 'Ā_i', desc: '多层平均聚合注意力图（H×W）' },
          { sym: 'S', desc: '选定层集合' },
        ],
      },
      takeaways: [
        { icon: '📐', title: 'softmax', desc: '跨注意力权重归一化' },
        { icon: '➗', title: '平均聚合', desc: '多层取平均最稳' },
        { icon: '🎯', title: '对齐', desc: '聚合图与掩码对齐' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '方法：NL-Refer 自然语言指代',
      badge: 'both',
      badgeLabel: '综合',
      bridge: '承接「如何获得对齐信号」；本节引入 NL-Refer 数据集，把「指什么」写进文本。',
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '指代方式对比',
          desc: '切换「〈region〉 占位符」与「自然语言指代」，看模型能否把对焦框锁定到命名物体。',
          componentId: 'mod5-refer',
        },
      ],
      insight: '占位符不含语义身份，自然语言指代把「指什么」写进了文本。',
      formula: {
        lead: '用 GPT-4o 把占位符替换为自然语言指代，并用 〈ins〉 标记核心名词：',
        unicode: 'Ĥ_i = Mark( Replace(H_i, 〈region〉, r_i), w_i )，  r_i = NLRef(G_i)',
        symbols: [
          { sym: 'H_i, Ĥ_i', desc: '原始 / 精炼人类消息（文本序列）' },
          { sym: 'r_i', desc: '自然语言指代表达（文本）' },
          { sym: 'w_i', desc: '标记物体名词（单 token）' },
          { sym: '〈ins〉', desc: '标记核心名词' },
        ],
      },
      takeaways: [
        { icon: '🚫', title: '占位符', desc: '缺语义身份' },
        { icon: '🤖', title: 'GPT-4o', desc: '生成指代表达' },
        { icon: '🏷️', title: '〈ins〉', desc: '标记核心名词' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '推理：纯文本五步定位',
      badge: 'inf',
      badgeLabel: '理解',
      bridge: '承接「数据就绪」；本节走一遍纯文本推理，看对齐如何在训练期内化。',
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '纯文本定位五步',
          desc: '逐步推进：输入视频+文本 → 标记物体名词 → 多层跨注意力 → 聚合与掩码对齐（训练期）→ 推理时直接定位回答。',
          componentId: 'mod6-infer',
        },
      ],
      insight: '训练期把对齐内化进模型，推理期就只需纯文本。',
      takeaways: [
        { icon: '🚀', title: '推理输入', desc: '无需视觉提示' },
        { icon: '🔁', title: '五步闭环', desc: '从输入到定位' },
        { icon: '🧠', title: '内化', desc: '对齐是训练期内化' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '训练：BCE 对齐损失',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: '承接「对齐如何内化」；本节给出把聚合注意力图对齐到掩码的 BCE 损失。',
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '损失函数对比',
          desc: '切换 BCE / Dice / mIoU / Focal，比较 VideoRefer-D 平均分与对焦精度。',
          componentId: 'mod7-loss',
        },
      ],
      formula: {
        lead: '用逐像素二值交叉熵对齐聚合注意力图与二值掩码：',
        unicode: 'L_BCE = −(1/HW) · ΣΣ [ M·log Ā + (1−M)·log(1−Ā) ]',
        symbols: [
          { sym: 'M', desc: '真值二值掩码（H×W，{0,1}）' },
          { sym: 'Ā', desc: '聚合注意力图（H×W）' },
          { sym: 'H, W', desc: '特征图高 / 宽' },
          { sym: 'L_BCE', desc: '二值交叉熵损失（标量）' },
        ],
      },
      takeaways: [
        { icon: '🧮', title: 'BCE', desc: '逐像素独立惩罚' },
        { icon: '🎯', title: '适配', desc: '适合 softmax 稀疏注意力' },
        { icon: '🏆', title: '最优', desc: '消融中 BCE 最优' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '架构：MLLM + SWIM 监督管线',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: '承接「损失」；本节看 SWIM 完整训练管线，理解监督分支如何挂接在骨干上。',
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: 'SWIM 训练管线',
          desc: '点击组件（视频帧 / 视觉编码器 / 文本 token / 跨注意力层 / 真值掩码 / BCE 损失），高亮激活路径并显示其作用。',
          componentId: 'mod8-arch',
        },
      ],
      insight: 'SWIM 不改骨干，只加一条从物体名词到掩码的监督分支。',
      takeaways: [
        { icon: '🏗️', title: '骨干不变', desc: 'Qwen2.5-VL-7B' },
        { icon: '🟢', title: '监督分支', desc: '只训练期用' },
        { icon: '0️⃣', title: '推理', desc: '零额外输入' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '鲁棒：消融、可扩展与同义噪声',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: '承接「管线」；本节看调参与鲁棒性，验证方法的稳定性。',
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '层选择与数据规模',
          desc: '切换监督层数（1/3/6/14）或数据规模（30K/50K/80K/125K），比较 VideoRefer-D 分数。',
          componentId: 'mod9-ablate',
        },
      ],
      insight: '均匀分布的 6 层 + 更多标注数据，带来稳定提升且未到平台期。',
      takeaways: [
        { icon: '🧅', title: '6 层', desc: '均匀分布最优' },
        { icon: '📈', title: '数据', desc: '单调提升' },
        { icon: '🛡️', title: '噪声', desc: '同义词仅降 0.04' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果：基准对比',
      badge: 'both',
      badgeLabel: '综合',
      bridge: '承接「鲁棒」；本节用基准结果收束，看 SWIM 在细粒度与通用基准上的表现。',
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '基准结果竞赛',
          desc: '点击开始，SWIM / VideoRefer-7B / Qwen2.5-VL / GPT-4o 的 VideoRefer-Q 分数赛跑到最终值；可切换到 D 类指标。',
          componentId: 'mod10-race',
        },
      ],
      takeaways: [
        { icon: '🏆', title: 'Q 平均', desc: '78.3% 领先' },
        { icon: '🥇', title: 'D 平均', desc: '3.78 领先' },
        { icon: '⚖️', title: '通用基准', desc: '保持竞争力' },
      ],
    },
  ],
};
