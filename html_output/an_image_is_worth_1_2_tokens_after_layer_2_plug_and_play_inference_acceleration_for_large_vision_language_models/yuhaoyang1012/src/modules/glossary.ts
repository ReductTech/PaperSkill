// ============================================================================
//  术语弹注与证据定位（悬停 / 键盘聚焦 / 触摸点按都可打开）。
//  图、表、章节编号统一采用 ECCV 2024 正式版（正文 + 补充材料）。
// ============================================================================

export const LINKS = {
  paper: 'https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/10478.pdf',
  supp: 'https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/10478-supp.pdf',
  arxiv: 'https://arxiv.org/abs/2403.06764',
  code: 'https://github.com/pkunlp-icler/FastV/blob/d1659729b5bf1be225e99ee15783deeea80f63b1/src/transformers/src/transformers/models/llama/modeling_llama.py#L738-L746',
  readme: 'https://github.com/pkunlp-icler/FastV/blob/d1659729b5bf1be225e99ee15783deeea80f63b1/README.md',
};

export interface Term {
  name: string;
  intuition: string; // 一句话直觉
  role: string; // 在本文中的作用
}

export const GLOSSARY: Record<string, Term> = {
  CIDEr: {
    name: 'CIDEr',
    intuition: '衡量生成的图像描述与多条人工参考描述有多“像”，看重共同出现、且不太常见的词组。',
    role: 'Nocaps 与 Flickr30k 两个图像描述任务的评分指标（越高越好），是 Table 1 平均分的一部分。',
  },
  'Rouge-L': {
    name: 'Rouge-L',
    intuition: '按“最长公共子序列”比较模型答案与标准答案的重合程度，0 到 1 之间。',
    role: 'OCR-VQA 的评分指标（Table 5、Fig. 6），用来检验剪枝是否伤到读字等细节能力。',
  },
  'Q-Former': {
    name: 'Q-Former',
    intuition: 'BLIP-2 / InstructBLIP 里的一个小 Transformer，用少量可学习的“查询”去图像特征里提取信息。',
    role: '它在进入语言模型前已压缩过视觉 token，所以 InstructBLIP 对剪枝更敏感，需要把 K 调大（Table 2）。',
  },
  消融实验: {
    name: '消融实验（Ablation）',
    intuition: '每次只改一个设计（去掉、替换或换个做法），看结果变化，从而判断这个设计是否必要。',
    role: 'Table 7 用它比较剪图像 / 剪文字 / 随机剪 / 训练时少 token，Fig. 6 用它扫描 K 与 R。',
  },
  topk: {
    name: 'topk',
    intuition: '在一组分数里挑出最大的 k 个，返回它们的位置。',
    role: '官方代码用 topk 从视觉 token 中保留注意力得分最高的 (1−R)·576 个，其余被剪掉。',
  },
  标准误: {
    name: '标准误（Standard Error）',
    intuition: '多次重复实验时，平均值会“晃动”多少——它告诉你一个差值是不是可能只是运气。',
    role: '论文的随机剪枝只跑了一次、没有报告方差或标准误，所以 0.2～1.7 分的小差距无法排除来自噪声。',
  },
  系统提示: {
    name: '系统提示（System Prompt）',
    intuition: '每次对话开头固定的一段说明文字，规定模型的身份和行为，在指令微调阶段就已确定。',
    role: '在 LLaVA 中它排在图像之前，平均约 35 个 token；深层注意力的“竖直亮线”出现在这里（Fig. 3、4）。',
  },
  FLOPs: {
    name: 'FLOPs（浮点运算次数）',
    intuition: '模型完成一次计算需要多少次乘加——衡量“理论工作量”，不是实际耗时。',
    role: '论文用 Eq. 5 估算理论 FLOPs 与降幅；Table 1 的 B 数值是按层平均的理论量，不是实测。',
  },
  FFN: {
    name: 'FFN（前馈网络）',
    intuition: 'Transformer 每层里注意力之后的两层全连接网络，对每个 token 独立做一次“加工”。',
    role: '被剪掉的 token 在后续层连 FFN 也不再计算，这是 FastV 比稀疏注意力更省的原因（Eq. 5 的 2ndm 项）。',
  },
  'KV Cache': {
    name: 'KV Cache（键值缓存）',
    intuition: '生成时把之前 token 的 Key、Value 存下来，下一步只算新 token，不必整条序列重算。',
    role: 'FastV 原始实现不支持 KV Cache、每次前向都重新剪枝；后来加入的 KV Cache 版本只在首次前向剪一次。',
  },
  因果注意力: {
    name: '因果注意力（Causal Attention）',
    intuition: '解码器里每个 token 只能看见排在它前面的 token，信息只能从前往后流。',
    role: '系统提示排在图像之前，所以它的隐藏状态读不到图像——这限制了“锚点储存视觉信息”的说法。',
  },
  注意力汇: {
    name: '注意力汇（Attention Sink）',
    intuition: 'StreamingLLM 发现：开头几个 token 总被大量关注，像注意力的“停靠点”，本身未必携带多少内容。',
    role: '本页用它作为解读深层“竖直亮线”的一种可能（属于解读，论文未下此结论）。',
  },
  MMMU: {
    name: 'MMMU',
    intuition: '多学科、大学难度的图文选择题基准。',
    role: '论文称 development set；按 13B 基线 36.4 与 MMMU 论文验证集的分数比对，实为 900 题的验证集。',
  },
  MME: {
    name: 'MME',
    intuition: '覆盖感知与认知的 14 个子任务，每题是“是 / 否”判断。',
    role: '每个子任务得分 = 准确率 + 每图两问都答对的比例，总分为各子任务之和（Table 2、3）。',
  },
  帕累托前沿: {
    name: '帕累托前沿（Pareto Front）',
    intuition: '一组“不可能同时更省又更好”的配置：要再省就得牺牲效果，反之亦然。',
    role: 'Fig. 1 与 9.2 模块中，各 (K, R) 配置的 FLOPs–平均分连线。',
  },
};

export interface Evidence {
  label: string; // 正文中显示的短标签
  where: string; // 定位
  what: string; // 这一处证据说明了什么
  href: string;
}

export const EVIDENCE: Record<string, Evidence> = {
  intro: { label: '§1', where: '正文 §1 引言', what: '研究动机、0.21% / 50% 的注意力对比与三点贡献。', href: LINKS.paper },
  sec2: { label: '§2', where: '正文 §2 相关工作', what: 'LVLM 的 token 数增长、LLM 推理优化与 ViT token 剪枝的归类。', href: LINKS.paper },
  fig1: { label: 'Fig. 1', where: '正文 Fig. 1', what: '效率 / 性能权衡曲线：横轴为理论 FLOPs 降幅，纵轴为四项任务平均分。', href: LINKS.paper },
  fig2: { label: 'Fig. 2', where: '正文 Fig. 2 · §3.1', what: 'LVLM 的经典结构：图像 token 与三类文本 token 一起送入语言模型。', href: LINKS.paper },
  fig3: { label: 'Fig. 3', where: '正文 Fig. 3 · §3.3', what: 'LLaVA-1.5-7B、1000 个样本：浅层 / 深层的注意力分配 λ 与注意力效率 ε。', href: LINKS.paper },
  fig4: { label: 'Fig. 4', where: '正文 Fig. 4 · §3.4', what: '一次解码过程的注意力图（首层、中层、末层），深层出现竖直亮线。', href: LINKS.paper },
  sfig7: { label: '补充 Fig. 7', where: '补充材料 Fig. 7', what: 'LLaVA 每一层的完整注意力图。', href: LINKS.supp },
  sec34: { label: '§3.4', where: '正文 §3.4 Insights', what: '作者的“锚点”解释：少数锚点聚合信息、深层偏好关注它们（假设，未逐层验证）。', href: LINKS.paper },
  fig5: { label: 'Fig. 5', where: '正文 Fig. 5 · §4.1', what: 'FastV 示意：在第 K 层后剪掉 R% 的图像 token。', href: LINKS.paper },
  sec41: { label: '§4.1', where: '正文 §4.1', what: '排序函数 φ、剪枝层 K、剪枝比例 R；K=0 时改用随机排序。', href: LINKS.paper },
  sec42: { label: '§4.2', where: '正文 §4.2', what: '计算量估计：单层 4nd²+2n²d+2ndm 与整模型降幅 Eq. 5。', href: LINKS.paper },
  sec42f: { label: '§4.2 单层计算量', where: '正文 §4.2', what: '单层计算量估计 4nd² + 2n²d + 2ndm（只计注意力与 FFN）。它是 Eq. 5 的组成部分；完整模型的 FLOPs 降幅公式才是 Eq. 5。', href: LINKS.paper },
  sfig8: { label: '补充 Fig. 8', where: '补充材料 Fig. 8', what: '理论 FLOPs 降幅随 K、R 变化的热力图。', href: LINKS.supp },
  suppA: { label: '补充 §A', where: '补充材料 §A', what: '各评测任务的数据集、子集、指标与提示词。', href: LINKS.supp },
  eq1: { label: 'Eq. 1', where: '正文 §3.1 式 (1)', what: '自回归生成：每个输出 token 以图像、问题和已生成内容为条件。', href: LINKS.paper },
  eq2: { label: 'Eq. 2', where: '正文 §3.2 式 (2)', what: '四类输入的注意力之和为 1。', href: LINKS.paper },
  eq34: { label: 'Eq. 3–4', where: '正文 §3.2 式 (3)(4)', what: '注意力分配 λ 与注意力效率 ε 的定义。', href: LINKS.paper },
  eq5: { label: 'Eq. 5', where: '正文 §4.2 式 (5)', what: '整个模型（T 层）的理论 FLOPs 降幅公式。', href: LINKS.paper },
  tab1: { label: 'Table 1', where: '正文 Table 1 · §5.3', what: '三个模型在不同 (K, R) 下的 FLOPs 与 Nocaps / Flickr30k / A-OKVQA / MMMU 分数。', href: LINKS.paper },
  tab2: { label: 'Table 2', where: '正文 Table 2 · §5.3', what: '更多基准（AI2D、SciQA-IMG、SeedBench、MMVet、MME）与 InstructBLIP。', href: LINKS.paper },
  tab3: { label: 'Table 3', where: '正文 Table 3', what: 'MME 的 14 个细项分数。', href: LINKS.paper },
  tab4: { label: 'Table 4', where: '正文 Table 4 · §5.3', what: '单张 A40、A-OKVQA 上的总耗时、显存、分数与单样本延迟（FastV 为 K=0、R=50%）。', href: LINKS.paper },
  tab5: { label: 'Table 5', where: '正文 Table 5 · §5.3', what: 'PCA-Bench 与 OCR-VQA 细分结果，含 K=0、R=50% 的 78.9B。', href: LINKS.paper },
  tab6: { label: 'Table 6', where: '正文 Table 6 · §5.3', what: 'Video-LLaVA 在 TGIF / MSVD / MSRVTT 上的 GPT 评测结果。', href: LINKS.paper },
  tab7: { label: 'Table 7', where: '正文 Table 7 · §5.4', what: '重训 LLaVA-1.5-7B 上的消融：剪什么、怎么剪、训练时少 token。', href: LINKS.paper },
  fig6: { label: 'Fig. 6', where: '正文 Fig. 6 · §5.4', what: 'LLaVA-1.5-13B 在 OCR-VQA 上的 K / R 消融。', href: LINKS.paper },
  sec43: { label: '§4.3', where: '正文 §4.3 · §5.4', what: '与“训练时就少用视觉 token”（平均池化）的对比。', href: LINKS.paper },
  code: { label: '代码 L738', where: '官方代码 modeling_llama.py L738–746', what: '平均各注意力头 → 取最后一个查询对视觉 token 的注意力 → topk 保留。', href: LINKS.code },
  readme: { label: 'README', where: '官方 README（同一提交）', what: '掩码实现不加速；inplace 实现测延迟（A100、首 token）；KV Cache 版只在首次前向剪枝。', href: LINKS.readme },
};

const esc = (s: string) => s.replace(/"/g, '&quot;');

/** 术语弹注标记（用于 tutorial.ts 的 HTML 字符串） */
export const T = (key: string, text?: string) =>
  `<span class="term" tabindex="0" role="button" aria-haspopup="dialog" data-term="${esc(key)}">${text ?? key}</span>`;

/** 证据定位标记 */
export const E = (...keys: string[]) =>
  keys
    .map(
      (k) =>
        `<span class="ev" tabindex="0" role="button" aria-haspopup="dialog" data-ev="${esc(k)}">${EVIDENCE[k] ? EVIDENCE[k].label : k}</span>`
    )
    .join('');
