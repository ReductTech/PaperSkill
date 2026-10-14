export const route = [
  { title: '发现分配问题', subtitle: '预算危机', purpose: '试着分配有限的资源，再看看真实研究记录。先分清“给多少”和“给谁”是两个问题。', action: '先判断，再分配', icon: 'gauge' },
  { title: '回顾旧办法，找对位置', subtitle: 'LoRA 回顾 · 模块议会', purpose: '先认识 Transformer 的层、Attention 和 FFN，找到 LoRA 的小型更新支路，看看为什么它省参数。再问：把这些参数放在哪里更值得？', action: '回顾 → 观察 → 比较', icon: 'layers' },
  { title: '调整改动的容量', subtitle: 'Rank 配额室', purpose: '把一个部门的调节通道转给另一个。预算不变时，一处增加就需要另一处减少。', action: '转移一个通道', icon: 'sliders' },
  { title: '保留容易调整的结构', subtitle: '奇异方向工坊', purpose: '关闭一个方向的当前贡献，看看哪些结构仍被保留。分清暂时不参与和删除整套参数。', action: '关闭 → 检查 → 尝试恢复', icon: 'layers' },
  { title: '判断哪些方向更重要', subtitle: '重要性裁判所', purpose: '比较只看大小、只看一次测量和结合历史记录的判断。重要性需要估计，测量也会有噪声。', action: '预测 → 比较判断依据', icon: 'sliders' },
  { title: '安排削减的时间', subtitle: '预算控制塔', purpose: '先探索，再逐步收紧，最后保持分配继续优化。看看为什么不在开始时就把所有决定做死。', action: '走过三个阶段', icon: 'gauge' },
  { title: '验证效果，也找例外', subtitle: '参数预算竞技场', purpose: '先预测，再比较语言理解、问答和摘要的真实实验。观察收益怎样随任务、预算和指标改变。', action: '预测 → 阅读真实结果', icon: 'chart' },
  { title: '检查每项设计的作用', subtitle: '消融实验室', purpose: '查阅移除或替换某个设计后的实验。保持其他条件可比，才能判断这部分是否有用。', action: '一次检查一个设计', icon: 'sliders' },
  { title: '观察最终的分配', subtitle: 'Rank 分布观测站', purpose: '看原始分布图，找支持最初猜想的地方，也找反例。让开始的问题与最后的证据连起来。', action: '观察 → 回访最初的判断', icon: 'chart' },
  { title: '解释方案与适用边界', subtitle: '工程审查室', purpose: '用自己的话讲清楚为什么分配、怎样做到，以及哪些还需要验证。无需背下算法步骤。', action: '整理理解，完成审查', icon: 'check' },
] as const;

export const sections = ['接管任务', '先做判断', '试着分配', '看看证据', '修正认识', '本章发现'];

export const allocationSource = { type: 'conceptual_simulation' as const, assumptions: ['四个教学部门', '12 枚容量筹码', '不测量模型效果'], label: '教学模拟 · 筹码表示改动容量，不代表真实训练结果' };
export const scenarioSource = { type: 'hypothetical_scenario' as const, label: '工厂故事是帮助理解的假设情境。' };

export const predictions = [
  { id: 'equal', label: '每个部门一样多，应该就够了。', detail: '我会先沿用平均分配。' },
  { id: 'different', label: '各部门需要的资源可能不一样。', detail: '我想试着改变资源放的位置。' },
  { id: 'unsure', label: '现在还不知道，需要更多信息。', detail: '我会先观察，再决定。' },
] as const;
