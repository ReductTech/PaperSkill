import React, { useState } from 'react';

const GREEN = '#228d5c';
const BLUE = '#27446e';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';

const CARDS = [
  {
    icon: '📦',
    title: '依赖存储原始样本',
    color: RED,
    body: 'MER 需要保留真实样本才能回放（蓄水池采样 M 个），这在三类场景下不可行：\n\n① 隐私敏感：医疗影像、用户行为、金融交易——GDPR/HIPAA 要求「被遗忘权」，不能无限期留存样本。\n\n② 存储受限：边缘设备（手机、IoT）记忆容量有限；高维数据（视频、点云）存 200 个样本就可能占满存储。\n\n③ 在线流场景：实时推荐系统每秒上万样本，物理上无法全留。\n\n改进方向与权衡：\n• 生成式回放（伪样本）：训练一个 GAN/VAE 生成旧任务样本，不存真样本。但生成器本身也会遗忘（mode collapse），且隐私风险未必完全消除（membership inference attack 仍可能重建训练数据）。\n• Mixture-of-Experts 显式拆分：让「何时共享参数」变成架构选择（不同专家处理不同任务子集），而非隐式学习。作者 App. B 提到可结合 MoE，但训练复杂度和路由策略设计是新挑战。\n• 压缩表示：存梯度统计量（均值/协方差）而非原样本——PackNet、CPG 等方法尝试这条路，但对齐项依赖样本级梯度，压缩后可能失效。'
  },
  {
    icon: '🎛️',
    title: '超参搜索空间更大',
    color: ORANGE,
    body: 'MER 引入 4 个新超参（β, γ, s, k）+ 学习率 α + 缓冲大小 M，相比 GEM（1 个记忆 M）、EWC（1 个惩罚权重 λ）调参代价显著更高。\n\n潜在隐患：\n• 不同数据集最优超参可能差异大：Table 1 的 Rotations 与 Table 3 的 Omniglot 是否用同一组超参？论文只在 App. M 说「换种子/换机器定性结论不变」，但没给各基准的超参搜索日志。\n• 公平比较存疑：如果 MER 搜了 100 组超参、GEM 只搜 10 组，胜出可能是「调参预算」而非「方法本质」。\n\n防御措施（论文已做的）：\n• App. M 用不同随机种子 + 不同计算节点重跑实验，验证「MER > GEM」的定性结论稳定。\n• 固定 γ=1、β ∈ [0.1, 0.5] 缩小搜索空间。\n\n仍需留意：\n• 新数据集应报告超参搜索范围和最优值，而非只报最终分数。\n• AutoML（如 Hyperband、贝叶斯优化）下 MER 的样本效率是否仍占优？这是开放问题。'
  },
  {
    icon: '🔀',
    title: '依赖任务间相似性',
    color: BLUE,
    body: '对齐（让梯度点积为正）的前提是「任务足够相似，未来梯度方向可被元学习泛化」（Sec 6 Q5 原文）。这在两类场景下会失效：\n\n① 剧烈域漂移：从 MNIST 数字突然切到 ImageNet 自然图像，特征空间完全不同，强制对齐可能让两边都学不好（负迁移）。\n\n② 任务对抗：任务 A 要最大化某目标、任务 B 要最小化——梯度天然相反，对齐会互相抵消。例如 GAN 训练（生成器 vs 判别器）或多目标优化（准确率 vs 公平性）的冲突目标。\n\n实验证据的局限：\n• 论文所有基准（MNIST Rotations/Permutations、Omniglot、RL）都是「同域内的相关任务」——旋转角度变、像素置换、不同 Atari 游戏，但都在视觉-控制闭环内。\n• 缺少「跨模态」基准：文本→图像、语音→视频，或「跨领域」：医疗→金融。\n\n可能的改进：\n• 任务相似度预测：训练前先估计任务间梯度相关性，相似度低时降低对齐权重（动态 α 调度）。\n• 分层对齐：底层特征（边缘、纹理）对齐，高层语义（类别、属性）独立——类似迁移学习的 fine-tuning 策略。'
  },
  {
    icon: '🔬',
    title: '只在小型模型上验证',
    color: PURPLE,
    body: '实验模型规模：两层 MLP（MNIST，~10K 参数）、4 层 CNN（Omniglot，~100K 参数）、小策略网络（RL，~50K 参数）。这与当前实践（Transformer 亿级参数）差距巨大。\n\n未验证的关键问题：\n\n① 计算开销是否可承受？\nMER 每个样本要回放 s×k 个旧样本（论文 s=5, k=10 → 每个新样本计算 50 个旧样本梯度）。对 GPT-3（175B 参数）做一次前向传播已需数秒，50 倍开销几乎不可行。\n• PackNet/LoRA 等参数高效方法能否与 MER 结合？如果只对齐低秩子空间的梯度，对齐项是否仍有效？\n\n② 大模型的遗忘曲线不同：\n• 小模型（10K 参数）灾难性遗忘严重（Table 1 Online 只剩 53%）。\n• 大模型可能自带「隐式正则」（过参数化的平坦最小值），遗忘更缓慢——此时 MER 的增益是否会缩水？Llama-2 的持续预训练实验显示，简单回放（ER）在大模型上已接近无遗忘。\n\n③ 记忆需求的规模效应：\n• 缓冲 M=200 对 MNIST（28×28=784 维）可接受，但对 GPT-3（每个样本几千 token）M=200 可能只覆盖几篇文档，代表性不足。\n• 蓄水池采样保证「每个样本留存概率 = M/N」，但当 N=万亿（LLM 预训练语料）时，M 需要多大才能保证低方差？论文未讨论。\n\n建议后续工作方向：\n• 在中等规模模型（BERT-base 110M、ResNet-50）上重现 MER，观察增益是否保持。\n• 探索「梯度检查点 + 混合精度」降低 MER 回放开销的可行性。\n• 对比 MER 与「Instruction Tuning + Replay」（LLM 常用方案）在多任务泛化上的差异。'
  },
];

export function MerLimits() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 18 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {CARDS.map((c, i) => (
          <button key={i} onClick={() => setOpen(open === i ? null : i)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', background: open === i ? '#fff' : '#f7f9fc', border: `2px solid ${open === i ? c.color : LINE}`, borderRadius: 14, padding: '10px 18px', cursor: 'pointer' }}>
            <span style={{ fontSize: 40 }}>{c.icon}</span>
            <span style={{ fontSize: 28, color: c.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{c.title}</span>
            <span style={{ fontSize: 24, color: MUTED, marginLeft: 'auto' }}>{open === i ? '▲ 收起' : '▼ 展开'}</span>
          </button>
        ))}
      </div>
      <div style={{ width: 520, background: '#fff', border: '1px solid #d7deea', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: CARDS[open ?? 0].color }}>{CARDS[open ?? 0].title}</div>
        <p style={{ fontSize: 24, color: INK, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>{CARDS[open ?? 0].body}</p>
        <div style={{ fontSize: 22, color: MUTED, borderTop: `1px solid ${LINE}`, paddingTop: 10, lineHeight: 1.4 }}>
          <b style={{ color: INK }}>批判性阅读的三个层次：</b><br/>
          ① 知道方法<b>在哪些条件下成立</b>（上面四张卡片）<br/>
          ② 评估这些条件在<b>你的场景</b>是否满足（隐私？规模？任务分布？）<br/>
          ③ 当条件不满足时，能<b>指出改进方向</b>而非简单否定<br/><br/>
          这才是「读方法」而不是「背结论」——MER 在小模型、相似任务、可存样本的设定下显著优于 GEM/EWC，但这不意味着它在所有场景都是最优解。
        </div>
      </div>
    </div>
  );
}
