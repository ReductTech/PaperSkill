import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'OBR: Optimal Brain Restoration for Joint Quantization and Sparsification of LLMs',
    titleZh: 'OBR：大语言模型的联合量化与稀疏压缩',
    venue: 'ICLR 2026',
    authors: 'Hang Guo, Yawei Li, Luca Benini',
    affiliation: 'ETH Zürich',
    domain: '大语言模型 / 后训练量化 (PTQ) / 稀疏 / 联合压缩',
    coreProblem: '单一压缩（继续降 bit 或继续加稀疏）逼近极限时精度崩塌；而量化要权重紧凑、剪枝要权重高方差，两者分布需求根本冲突。',
    coreInsight: '把「剪枝」和「量化」用误差补偿撮合：先剪枝、再把剪掉的权重信息以闭式解 ΔW 补偿回未剪元素、最后量化，得到 W4A4KV4 + 50% 稀疏的 LLM。',
    keywords: ['PTQ', '量化', '稀疏', '误差补偿', '联合压缩', 'W4A4KV4'],
  },
  hero: {
    oldMethod: {
      title: '纯量化（GPTQ）',
      desc: '只压缩到少数比特档位，剪枝与量化各自为战，被剪掉的权重信息直接丢失。',
      componentId: 'cover-old',
    },
    newMethod: {
      title: 'OBR：联合量化 + 稀疏',
      desc: '先剪枝、再把剪掉的信息誊抄补偿回未剪元素、最后量化，闭式解修复精度。',
      componentId: 'cover-new',
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '动机：为什么「加稀疏」比「继续降 bit」更好',
      modules: [
        { kind: 'module', id: 'motive-curve', title: '单一技术 vs 联合压缩', desc: '切换三种压缩模式，观察精度随压缩率的崩塌点。', componentId: 'motive-curve' },
      ],
      scenes: [
        {
          id: 'ch1-motive',
          title: '为什么「加稀疏」比「继续降 bit」更好',
          goal: '单一压缩逼近极限后，联合两种正交技术能否再榨出额外压缩？',
          summary: '只量化 / 只剪枝在极限区精度崩塌；量化与稀疏正交，联合起来能在更高压缩率下守住精度。',
          interaction: '切换「只量化 / 只剪枝 / 联合 OBR」三条曲线',
          next: '量化与剪枝在分布上的根本冲突',
          notes: '来源：OBR-深度阅读笔记 §一 + 文献卡片 §解决的问题。曲线为示意趋势，非论文实测；真实对比见论文 Figure 1(a)。硬数据：QuaRot W4A4KV4 Llama2-7B 平均天然存在 14.28% 非结构化稀疏。',
          componentId: 'motive-curve',
          moduleId: 'motive-curve',
        },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '冲突：量化要紧凑、剪枝要高方差',
      modules: [
        { kind: 'module', id: 'conflict-dist', title: '量化 vs 剪枝的矛盾', desc: '切换是否旋转，观察权重分布与两种误差读数。', componentId: 'conflict-dist' },
      ],
      scenes: [
        {
          id: 'ch2-conflict',
          title: '量化要紧凑、剪枝要高方差',
          goal: '为什么量化与剪枝的分布需求会互相打架？',
          summary: '量化要权重范围紧凑（减误差），剪枝要权重高方差（暴露可剪稀疏）；Hadamard 旋转摊平 outlier 后量化误差下降，却让剪枝失效。',
          interaction: '切换「不旋转 / Hadamard 旋转」观察分布与读数',
          next: 'OBR 的四步 pipeline',
          notes: '来源：OBR-深度阅读笔记 §一「关键冲突」。分布与误差读数为示意估算，非论文实测；真实旋转为 Hadamard 变换。',
          componentId: 'conflict-dist',
          moduleId: 'conflict-dist',
        },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '四步 pipeline：旋转 → 剪枝 → 补偿 → 量化',
      modules: [
        { kind: 'module', id: 'pipeline-steps', title: '四步 pipeline', desc: '点击步骤切换矩阵状态，观察补偿加回位置。', componentId: 'pipeline-steps' },
      ],
      scenes: [
        {
          id: 'ch3-pipeline',
          title: '四步 pipeline：旋转 → 剪枝 → 补偿 → 量化',
          goal: 'OBR 把补偿插在剪枝和量化之间，完整流程是什么？',
          summary: 'Ŵ = quant( prune( rotate(W) ) + ΔW^OBR )：先旋转摊平 outlier，剪枝引入稀疏，加闭式补偿，最后量化。',
          interaction: '点击四步按钮切换矩阵状态',
          next: 'R/E 集合的信息转移（核心）',
          notes: '来源：OBR-深度阅读笔记 §二。矩阵与补偿幅度为示意；真实补偿由闭式解逐行计算（论文 §4）。',
          componentId: 'pipeline-steps',
          moduleId: 'pipeline-steps',
        },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '核心方法：R/E 集合的信息转移',
      modules: [
        { kind: 'module', id: 'transfer-sets', title: 'R/E 集合与闭式补偿', desc: '拖动分组比例 α、开关补偿，观察扰动变化。', componentId: 'transfer-sets' },
      ],
      scenes: [
        {
          id: 'ch4-transfer',
          title: 'R/E 集合：把 E 的信息搬到 R',
          goal: '闭式解如何决定「该补偿多少」？',
          summary: '权重行按敏感度分成 R（保留）与 E（剪除）两组，把 E 的信息以闭式补偿转移到 R，最小化总体扰动。',
          interaction: '拖动分组比例 α、开关 OBR 补偿',
          next: '闭式解怎么推导',
          notes: '来源：OBR-深度阅读笔记 §三。权重与补偿为示意估算；真实 Δw*_R 由闭式解逐行计算（论文 §4）。α 对应源码参数 obr_alpha（默认 0.5）。',
          componentId: 'transfer-sets',
          moduleId: 'transfer-sets',
        },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '闭式解：二阶泰勒 → 行解耦 → 闭式解',
      modules: [
        { kind: 'module', id: 'closedform-derive', title: '闭式解推导', desc: '点击三步推导，观察 Hessian 结构变化。', componentId: 'closedform-derive' },
      ],
      scenes: [
        {
          id: 'ch5-closedform',
          title: '二阶泰勒 → 行解耦 → 闭式解',
          goal: '免训练的补偿项 ΔW 是怎么算出来的？',
          summary: '把压缩对 loss 的扰动做二阶泰勒展开，行解耦近似后分 R/E 组，得到从 E 到 R 的闭式解，无需梯度下降。',
          interaction: '点击三步按钮切换推导与 Hessian 结构',
          next: '源码里它长什么样',
          notes: '来源：OBR-深度阅读笔记 §三 + 文献卡片 §核心方法。公式与 Hessian 结构为示意；精确推导与归一化见论文 §4。与 Optimal Brain 血脉同源：GPTQ 只补偿量化、SparseGPT 只补偿剪枝。',
          componentId: 'closedform-derive',
          moduleId: 'closedform-derive',
        },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '源码视角：可插拔的补偿模块',
      modules: [
        { kind: 'module', id: 'source-base', title: '旋转底座与关键参数', desc: '切换三条底座、算法版本，拖动剪枝率。', componentId: 'source-base' },
      ],
      scenes: [
        {
          id: 'ch6-source',
          title: '可插拔的补偿模块',
          goal: 'OBR 在工程上如何复用旋转底座？',
          summary: 'OBR 不重新发明旋转，而是叠加在 QuaRot / SpinQuant / FlatQuant 之上，核心代码一处定位，参数即插即用。',
          interaction: '切换三条旋转底座、选择算法版本、拖动剪枝率',
          next: '结果与局限',
          notes: '来源：OBR-深度阅读笔记 §四（官方 README）。核心代码 QuaRot/obr_utils.py#L186；obr_rtn 控制 OBR_GPTQ/OBR_RTN；obr_alpha=0.5、sparsity_ratio=0.5、prune_n/prune_m=0。HF 已放校准模型，--load_qmodel_path 一行复现。',
          componentId: 'source-base',
          moduleId: 'source-base',
        },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '结果与局限',
      modules: [
        { kind: 'module', id: 'results-limits', title: '结果与局限', desc: '阅读实测数字，切换收益 / 局限清单。', componentId: 'results-limits' },
      ],
      scenes: [
        {
          id: 'ch7-results',
          title: 'W4A4KV4 + 50% 稀疏，精度守住',
          goal: '联合压缩到底带来多大收益？代价是什么？',
          summary: 'Llama2-7B PPL 仅掉 1.4、Llama2-70B 差距 1.37，最高 4.72× 加速 + 6.4× 显存减少；但加速依赖 INT4 稀疏 GEMM 硬件。',
          interaction: '切换「收益 / 局限」清单',
          next: '（教程结尾）',
          notes: '来源：文献卡片 OBR-ICLR2026 §关键实验数据 + §优缺点与局限。数字为论文报告值；加速需 INT4-sparse GEMM kernel（Ampere/Hopper）。',
          componentId: 'results-limits',
          moduleId: 'results-limits',
        },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '总结：Optimal Brain 血脉的收口',
      modules: [
        { kind: 'module', id: 'summary', title: '家族演进', desc: '点击家族节点查看各自补偿对象。', componentId: 'summary' },
      ],
      scenes: [
        {
          id: 'ch8-summary',
          title: 'Optimal Brain 血脉的收口',
          goal: 'OBR 在误差补偿家族里处在什么位置？',
          summary: 'OBD → OBS → OBQ → GPTQ/SparseGPT → OBR，OBR 是第一个同时处理量化 + 剪枝的成员。',
          interaction: '点击家族节点查看各自补偿对象',
          next: '（教程结尾）',
          notes: '来源：OBR-深度阅读笔记 §五。GPTQ 只补偿量化、SparseGPT 只补偿剪枝，OBR 用通用误差扰动统一两者。',
          componentId: 'summary',
          moduleId: 'summary',
        },
      ],
    },
  ],
};
