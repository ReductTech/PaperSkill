import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Towards Compact Sign Language Translation: Frame Rate and Model Size Trade-offs',
    titleZh: '紧凑型手语翻译：帧率与模型大小的取舍',
    venue: 'arXiv 2026',
    authors: 'Kuanwei Chen, Mengfeng Tsai',
    affiliation: 'National Central University, Taiwan',
    domain: '手语翻译 / 姿态表示 / 轻量化 Transformer',
    coreProblem: '免 gloss 手语翻译常依赖大规模视频编码器或 T5-base 级模型，部署成本高；论文要回答：能否用更小模型和更低帧率保持可用翻译质量。',
    coreInsight: '把视频先压成 MMPose 骨架点序列，再用一个线性层接入 T5-small；同时比较 24 fps 与 12 fps，展示序列长度、二次自注意力成本和 BLEU 质量之间的实际取舍。',
    keywords: ['Sign Language Translation', 'MMPose', 'T5-small', 'Frame Rate', 'BLEU'],
  },
  hero: {
    oldMethod: {
      desc: '传统路线直接从密集视频帧学习手语到文本的映射，信息保留更充分，但输入更长、模型更重，部署门槛也更高。',
        componentId: 'slt-hero-intro',
      },
      newMethod: {
      desc: '手语翻译就是把连续手势、身体姿态和手部关键点序列转换成自然语言文本。这里用二维 keypoints 动画示意“模型先读姿态，再输出翻译”。',
      componentId: 'slt-sign-icon',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '问题从哪里来：手语视频太长，模型太重', badge: 'inf', badgeLabel: '问题',
      bridge: '本论文要优化的对象：在保留基本设置的同时，把输入长度和模型规模压到更适合部署。',
      analogy: { title: '', text: '', componentId: '' },
      modules: [
        { kind: 'module', id: '1.1', title: '帧率如何影响输入长度？', desc: '切换 24 fps 和 12 fps，观察输入帧数和注意力负载变化。', componentId: 'slt-analogy' },
        { kind: 'module', id: '1.2', title: '成本从哪一段爆炸？', desc: '切换帧率和模型尺寸，观察输入帧数、注意力成本和参数规模如何同时变化。', componentId: 'slt-cost' },
      ],
      insight: '论文的核心不是追求最高 BLEU，而是证明一个轻量系统在质量损失有限时能显著降低计算成本。',
      takeaways: [
        { icon: '1', title: '目标清楚', desc: '论文解决的是轻量化部署问题，而不是单纯刷榜。' },
        { icon: '2', title: '瓶颈明确', desc: '长视频序列让自注意力计算快速膨胀。' },
        { icon: '3', title: '旋钮简单', desc: '帧率和模型大小是两个直接可调的效率旋钮。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: 'MMPose：将输入表示从 RGB 视频变成 255 维骨架姿态', badge: 'inf', badgeLabel: '表示',
      bridge: '选择姿态而不是原始视频作为输入。丢掉纹理背景，保留手、身体、脸的结构运动，降低视觉编码负担。',
      analogy: { title: '', text: '', componentId: '' },
      modules: [
        { kind: 'module', id: '2.1', title: '如何对输入进行姿态编码？', desc: '点击不同身体区域，查看每个关键点的 x、y、z 坐标如何拼成每帧姿态向量。', componentId: 'slt-pose' },
      ],
      insight: 'MMPose 每帧检测双手、上半身和脸部共 85 个关键点；每点三个坐标，因此 85 × 3 = 255。坐标按画面宽高归一化，减少分辨率差异。',
      formula: { lead: '每帧特征维度来自关键点数量与坐标数。', unicode: '85 keypoints × (x, y, z) = 255-d pose vector', symbols: [{ sym: '85', desc: '双手、上半身、脸部关键点总数' }, { sym: '255', desc: '每一帧输入线性层的姿态特征维度' }] },
      takeaways: [
        { icon: '1', title: '姿态压缩', desc: '骨架表示避免直接处理高维像素。' },
        { icon: '2', title: '结构保留', desc: '手部、身体和脸部仍然被纳入。' },
        { icon: '3', title: '归一化必要', desc: '按宽高归一化帮助跨分辨率视频对齐。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '接口转换：一层线性映射', badge: 'inf', badgeLabel: '洞察',
      bridge: '语言生成能力依靠预训练的T5-small，而T5-small期待 512 维 token embedding，而姿态帧是 255 维。论文没有堆复杂视频编码器，而是用单个全连接层完成接口转换。',
      analogy: { title: '', text: '', componentId: '' },
      modules: [{ kind: 'module', id: '3.1', title: '255 到 512 的接口转换', desc: '姿态向量被映射到 T5-small 可接收的 512 维空间。', componentId: 'slt-projection' }],
      insight: '这一步的价值在于把视觉前端极简化：MMPose 负责抽骨架，线性层负责对齐维度，语言生成能力交给预训练 T5-small。',
      formula: { lead: '投影层把每帧姿态向量映射到模型维度。', unicode: 'e_t = W p_t + b,  p_t ∈ R²⁵⁵,  e_t ∈ R⁵¹²', symbols: [{ sym: 'p_t', desc: '第 t 帧的 255 维姿态向量' }, { sym: 'e_t', desc: '送入 T5-small 编码器的 512 维 embedding' }] },
      takeaways: [
        { icon: '1', title: '接口极简', desc: '只用一个线性层完成姿态到语言模型空间的连接。' },
        { icon: '2', title: '减少视觉负担', desc: '不再额外引入重型视频编码器。' },
        { icon: '3', title: '借用预训练', desc: '生成能力来自 google/t5-v1_1-small 的语言先验。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '数学取舍：为什么 12 fps 能省 75% 注意力成本', badge: 'both', badgeLabel: '数学',
      bridge: '帧率降低不是线性地省一点点，而是在自注意力里产生二次收益。理解这一点，就能看懂论文最重要的效率论证。',
      analogy: { title: '', text: '', componentId: '' },
      modules: [{ kind: 'module', id: '4.1', title: '二次注意力成本模拟器', desc: '在 12 fps 和 24 fps 间切换，观察 token 数减半为何让 n² 成本降到四分之一。', componentId: 'slt-attention' }],
      insight: '论文报告：12 fps 相对 24 fps 序列长度减半，因此编码器二次自注意力计算复杂度约减少 75%。这是模型轻量化之外的第二个主要收益。',
      formula: { lead: '如果 24 fps 产生 n 个输入 token，12 fps 约产生 n/2 个。', unicode: '(n/2)² / n² = 1/4；节省 = 1 - 1/4 = 75%', symbols: [{ sym: 'n²', desc: '自注意力两两交互数量的数量级' }, { sym: '75%', desc: '论文强调的编码器二次自注意力复杂度降低幅度' }] },
      takeaways: [
        { icon: '1', title: '不是线性收益', desc: '帧数减半会让注意力交互数变成四分之一。' },
        { icon: '2', title: '质量会下降', desc: '12 fps BLEU-4 低于 24 fps，但降幅有限。' },
        { icon: '3', title: '适合实时场景', desc: '低帧率更适合延迟和算力敏感部署。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '模型大小：77M 对 248M 的部署账', badge: 'both', badgeLabel: '规模',
      bridge: '论文将 T5-small 系统与过往 T5-base 系统对照。重点是参数量约三分之一时，性能是否仍然接近可用。',
      analogy: { title: '', text: '', componentId: '' },
      modules: [{ kind: 'module', id: '5.1', title: '参数量与 BLEU 的跷跷板', desc: '比较 77M T5-small 与约 248M T5-base 的参数量和 BLEU-4 差距。', componentId: 'slt-size' }],
      insight: 'T5-small 约 60M，完整系统约 77M；对照的 T5-base 系统约 248M。本文最佳 24 fps 配置 BLEU-4 为 10.06，T5-base 参考结果为 11.89。',
      formula: { lead: '论文把完整系统视为约三倍更小。', unicode: '248M / 77M ≈ 3.22；BLEU-4 gap = 11.89 - 10.06 = 1.83', symbols: [{ sym: '77M', desc: '本文完整模型参数量' }, { sym: '248M', desc: '参考 T5-base 系统参数量' }] },
      takeaways: [
        { icon: '1', title: '小模型可竞争', desc: '77M 没有达到最高分，但保留了相当质量。' },
        { icon: '2', title: '参数节省明显', desc: '相对 248M 级系统约小三倍。' },
        { icon: '3', title: '比较要看条件', desc: '不同数据、帧率和模型设置不能脱离实验协议解读。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '推理流程：骨架序列进入编码器，文本逐词生成', badge: 'inf', badgeLabel: '推理',
      bridge: '看清完整流水线：视频不是直接翻译，而是先变成姿态 token，再由 T5-small 编码，最后用 beam search 自回归生成英文。',
      analogy: { title: '', text: '', componentId: '' },
      modules: [{ kind: 'module', id: '6.1', title: '端到端流程开关', desc: '逐步点亮 MMPose、线性投影、T5 编码器、T5 解码器与 beam search。', componentId: 'slt-pipeline' }],
      insight: '输入最多截断到 256 帧，输出最多 128 tokens；解码使用 beam size 5。论文没有引入层级编码器，流程非常短。',
      formula: { lead: '推理链可以写成一个四步映射。', unicode: 'video → pose(255) → linear(512) → T5 encoder/decoder → text', symbols: [{ sym: '255', desc: '每帧姿态向量维度：85 个关键点 × 3 坐标' }, { sym: '512', desc: '线性层投影到 T5-small 的 d_model 维度' }, { sym: 'text', desc: '解码器逐 token 生成英文翻译' }] },
      takeaways: [
        { icon: '1', title: '流程短', desc: 'MMPose 加线性层后直接进入 T5-small。' },
        { icon: '2', title: '生成受限', desc: '输入和输出都有长度上限，利于控制成本。' },
        { icon: '3', title: 'beam search', desc: '以 beam size 5 在多个候选翻译间搜索。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-7', title: 'Beam search：翻译生成时如何选择候选句子', badge: 'trn', badgeLabel: '解码',
      bridge: 'T5 解码器不是一次性输出完整句子，而是逐词生成。beam search 会同时保留多个高分候选路径，比每一步只选最高分的贪心解码更稳。',
      analogy: { title: '', text: '', componentId: '' },
      modules: [{ kind: 'module', id: '7.1', title: 'Beam search 与普通贪心解码对比', desc: '左侧展示每一步只保留一个候选的贪心解码，右侧展示 beam size 5 同时保留多条候选翻译路径。', componentId: 'slt-training' }],
      insight: '论文在生成英文翻译时使用 beam search，beam size 为 5，并把输出长度限制在 128 tokens 以内。这样可以在多个候选句子之间搜索，而不是被某一步的局部最高概率过早锁死。',
      takeaways: [
        { icon: '1', title: '逐词生成', desc: '解码器按 token 自回归生成英文翻译。' },
        { icon: '2', title: '保留候选', desc: 'beam search 同时维护多条可能的句子路径。' },
        { icon: '3', title: 'beam=5', desc: '论文设置 beam size 5，并限制输出最多 128 tokens。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '训练目标：用平滑标签约束翻译 token', badge: 'trn', badgeLabel: '损失',
      bridge: '模型生成英文时，本质是在每个位置预测下一个 token 的概率分布。论文训练设置中使用 label smoothing=0.1，可以把目标从“只押一个词”变成“主要押正确词，同时给其它词一点余量”。',
      analogy: { title: '', text: '', componentId: '' },
      modules: [
        { kind: 'module', id: '8.1', title: 'Label smoothing 如何改变交叉熵目标？', desc: '拖动平滑强度，观察目标分布从 one-hot 变成更柔和的训练目标。', componentId: 'slt-architecture' },
      ],
      insight: '论文最终训练配置包含 label smoothing 0.1。它服务于稳定微调 T5-small：正确 token 仍占最大权重，但模型不会被迫把其它候选词概率压到绝对 0。',
      formula: { lead: '训练目标可理解为带 label smoothing 的 token 级交叉熵。', unicode: 'CE_smooth = -Σ q_smooth(y) log p(y | pose tokens)', symbols: [{ sym: 'q_smooth', desc: '平滑后的目标分布' }, { sym: 'p(y | pose tokens)', desc: 'T5 解码器给出的下一个 token 概率' }] },
      takeaways: [
        { icon: '1', title: '逐 token 学习', desc: '每个输出位置都学习下一个英文 token 的概率。' },
        { icon: '2', title: '正确词仍最高', desc: 'label smoothing 不改变正确答案，只让目标分布更柔和。' },
        { icon: '3', title: '稳定微调', desc: '论文使用 0.1 平滑强度来稳定 T5-small 训练。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-9', title: '结果表：不同训练数据与帧率的负载/性能', badge: 'trn', badgeLabel: '结果',
      bridge: '论文 Table II 的结果：H2S、YT-ASL、YT-ASL+H2S 三种训练数据，在 12 fps 与 24 fps 下的 BLEU 表现，并同时显示帧率带来的编码器注意力负载差异。',
      analogy: { title: '', text: '', componentId: '' },
      modules: [{ kind: 'module', id: '9.1', title: '原文数据：Table II 负载与性能总览', desc: '一次性列出 T5-base 参考结果与本文 T5-small 的 12/24 fps 原始 BLEU 数据，并用负载条呈现计算代价差异。', componentId: 'slt-data' }],
      insight: '原文 Table II 显示：混合训练 YT-ASL+H2S 最强，T5-small 24 fps 的 BLEU-4 为 10.06，12 fps 为 9.53；12 fps 以 0.53 BLEU-4 的下降换来约 75% 编码器自注意力复杂度降低。',
      formula: { lead: '帧率减半时，输入序列长度约减半；自注意力复杂度按 n² 缩放。', unicode: '12 fps load ≈ (1/2)² = 25%；BLEU-4 gap = 10.06 - 9.53 = 0.53', symbols: [{ sym: '25%', desc: '12 fps 相对 24 fps 的近似注意力负载' }, { sym: '0.53', desc: '混合训练下 24 fps 相对 12 fps 的 BLEU-4 增益' }] },
      takeaways: [
        { icon: '1', title: '混合数据最佳', desc: 'YT-ASL+H2S 在 12/24 fps 下都是最高 BLEU-4。' },
        { icon: '2', title: '24 fps 更准', desc: '三种训练数据下 24 fps 都略高于 12 fps。' },
        { icon: '3', title: '12 fps 更省', desc: '性能只小幅下降，但注意力负载约为 24 fps 的四分之一。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-10', title: '结果与局限：选择 12 fps 还是 24 fps？', badge: 'both', badgeLabel: '结论',
      bridge: '最后把所有数字放到一个决策问题里：如果你要部署系统，应该选更快的 12 fps，还是更准的 24 fps？',
      analogy: { title: '', text: '', componentId: '' },
      modules: [{ kind: 'module', id: '10.1', title: '部署决策器', desc: '根据“端侧/实时/最高质量”需求选择帧率，查看参数、BLEU 和注意力成本的综合判断。', componentId: 'slt-decision' }],
      insight: '论文结论：以 12 fps 运行时，序列长度减半使自注意力复杂度降低 75%，而 BLEU-4 仅小幅下降到 9.53，证实了朝向高效、实时手语翻译的可行路径',
      formula: { lead: '最终取舍可写成质量差与成本差。', unicode: 'ΔBLEU-4 = 10.06 - 9.53 = 0.53；attention saving ≈ 75%', symbols: [{ sym: '0.53', desc: '混合训练下 24 fps 相对 12 fps 的 BLEU-4 增益' }, { sym: '75%', desc: '12 fps 相对 24 fps 的注意力复杂度节省' }] },
      takeaways: [
        { icon: '1', title: '24 fps 更准', desc: '混合训练 BLEU-4 达到本文最佳 10.06。' },
        { icon: '2', title: '12 fps 更省', desc: 'BLEU-4 为 9.53，但注意力成本约降 75%。' },
        { icon: '3', title: '不是终点', desc: '论文仍留下时间聚合、数据增强和模型变体空间。' },
      ],
    },
  ],
};
