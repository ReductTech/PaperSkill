export const logicNodes=[
 {id:'lora',title:'LoRA 已经省参数，分配还值得改进',why:'少量参数也可能放在不合适的位置。',source:'第 2 页 Introduction / Figure 1'},
 {id:'modules',title:'不同模块的适配价值可能不同',why:'同预算下改变放置位置，实验表现可能改变；结论仍受任务条件限制。',source:'第 2 页 Figure 1a、1b'},
 {id:'adjust',title:'需要能调整容量的低秩结构',why:'给一处更多空间，需要让其他地方少一些。Rank 帮助控制更新容量，不是准确率刻度。',source:'第 3–4 页 Section 2 / 3.1'},
 {id:'svd',title:'用方向和强度，把贡献分开控制',why:'SVD-like 的 P、Λ、Q 把两侧方向和强度分开，抑制强度不等于删除全部方向参数；正交正则鼓励方向少重复。',source:'第 4 页 Section 3.1，Eq. 3–4'},
 {id:'importance',title:'用训练信号，估计谁值得留下',why:'Importance-aware Allocation 结合敏感性历史和变化估计保留优先级，估计有噪声。',source:'第 5 页 Section 3.2，Eq. 7–11'},
 {id:'scheduler',title:'安排什么时候探索、削减和固定',why:'Global Budget Scheduler 先预热，再逐减，最后固定分配并继续优化；容量和时间一起考虑。',source:'第 6 页 Section 3.3 / Algorithm 1'},
 {id:'outcome',title:'在可比预算条件下，争取更有效的适配',why:'论文实验支持有限预算下通常更有竞争力，仍需保留例外与实际参数差异；不是所有任务必胜。',source:'第 7–10 页 Table 1–5 / Figure 3'},
] as const;
export type LogicId=typeof logicNodes[number]['id'];
export const shuffledLogic:LogicId[]=['lora','modules','adjust','importance','svd','outcome','scheduler'];
export function validOrder(v:unknown):v is LogicId[]{return Array.isArray(v)&&v.length===logicNodes.length&&new Set(v).size===v.length&&v.every(id=>logicNodes.some(n=>n.id===id));}
export function coherentOrder(v:LogicId[]){if(!validOrder(v))return false;const i=(id:LogicId)=>v.indexOf(id);return i('lora')<i('modules')&&i('modules')<i('adjust')&&i('adjust')<i('svd')&&i('svd')<i('importance')&&i('svd')<i('scheduler')&&i('importance')<i('outcome')&&i('scheduler')<i('outcome');}
export const limits=[
 {id:'budget',title:'换一个任务，还用同样预算？',options:['同样预算足够所有任务。','需要比较该任务在不同预算下的收益。'],correct:1,finding:'不同任务对增加预算的收益不同，预算需要结合任务和资源选择。',source:'第 9 页 Figure 2 / Section 4.3',type:'paper_evidence'},
 {id:'noise',title:'重要性分数，能当作绝对真相？',options:['它是带噪声的估计，需要平滑和验证。','分数直接等于移除方向的真实因果影响。'],correct:0,finding:'评分来自训练信号与局部近似。历史和变化帮助估计，但不能消除所有噪声，也不保证准确率。',source:'第 5 页 Section 3.2 / Eq. 8–11',type:'paper_evidence'},
 {id:'cost',title:'省可训练参数，也保证训练更快？',options:['参数少就一定更快，不用检查耗时。','还要检查评分和分配带来的训练开销。'],correct:1,finding:'AdaLoRA 额外计算评分和调度。Table 15 的 MNLI 对照报告每轮训练比 LoRA 更长；不把它推广成所有设备的固定比例。',source:'第 17 页 Appendix H / Table 15（仅 MNLI）',type:'paper_evidence'},
 {id:'scope',title:'原论文主要验证了哪些任务？',options:['语言理解、问答与文本生成。','同时证明语言、图像和多模态任务普遍有效。'],correct:0,finding:'主要实验使用 DeBERTaV3-base 和 BART-large，覆盖语言理解、问答和文本摘要；证据范围需要明说。',source:'第 6–9 页 Section 4.1–4.3 / Table 1–3',type:'paper_evidence'},
 {id:'multimodal',title:'接入图像和文本的新模型，能直接宣布成功？',options:['不能，原文没有给出多模态实验，需要另外验证。','可以，把最终 Rank 图照搬过去就行。'],correct:0,finding:'这是对本文证据范围的判断：本文没有提供多模态实验，不能据此断言多模态效果。新模型仍要做可比预算的真实对照。',source:'根据第 6–9 页实验范围；不是多模态结果',type:'hypothetical_scenario'},
] as const;
export type LimitId=typeof limits[number]['id'];
export const relations=[
 {id:'why',question:'为什么有限参数还要考虑分配？',options:['因为不同位置的适配价值可能不同。','因为只要参数一样多，结果就必然相同。'],correct:0,feedback:'参数数量相同，还要检查位置与任务需求。',act:1},
 {id:'how',question:'哪些机制让动态分配可行？',options:['只把 LoRA 换个名字。','可调整的方向强度、重要性估计、全局预算调度，并配合方向约束。'],correct:1,feedback:'结构负责能调整，评分负责按什么分，调度负责何时收紧。',act:3},
 {id:'claim',question:'更多 Rank 或更高分数能保证准确率更高吗？',options:['能，这两个数字都是准确率的直接刻度。','不能，它们描述容量或估计，表现仍要用具体任务实验检验。'],correct:1,feedback:'容量、评分与任务表现是不同变量。',act:8},
] as const;
export type RelationId=typeof relations[number]['id'];
export const discoveries=[
 ['同样预算，位置也值得研究。','第 2 页 Figure 1a'],['LoRA 省参数；模块与层的适配价值可能不同。','第 2–4 页 Figure 1 / Section 2'],['Rank 控制更新容量，一处增加需考虑另一处预算。','第 3 页 Section 2'],['方向强度可被抑制，方向结构可以保留。','第 4 页 Section 3.1'],['重要性由有噪声的训练信号估计。','第 5 页 Section 3.2'],['动态分配需要合理的时间安排。','第 6 页 Section 3.3'],['表现受任务、预算和指标影响。','第 7–9 页 Table 1–3'],['多项设计需要配合，消融解释需要控制条件。','第 9–10 页 Table 4、5'],['最终分配不均，也不是单调规则。','第 10 页 Figure 3'],['解释机制，也为工程选择保留证据边界。','机制与实验范围的综合复习'],
] as const;
