export const PAPER = 'https://arxiv.org/html/2512.05774v2';
export const ARXIV = 'https://arxiv.org/abs/2512.05774';
export const CVPR = 'https://openaccess.thecvf.com/content/CVPR2026F/html/Wang_Active_Video_Perception_Iterative_Evidence_Seeking_for_Agentic_Long_Video_CVPRF_2026_paper.html';
export const CODE = 'https://github.com/SalesforceAIResearch/ActiveVideoPerception';

export type Chapter = { id: string; title: string; question: string; takeaway: string; next: string; source: string; evidence: string };

export const chapters: Chapter[] = [
  { id: 'problem', title: '视觉盲区：长视频中的稀疏证据', question: '固定采样为何会漏掉当前问题所需的短暂线索？', takeaway: '相关证据稀疏且随问题变化；保留可再次访问的原视频，才能主动寻找缺失线索。', next: '谁来计划、观察并判断证据是否充分？', source: '摘要、§1、Figure 1', evidence: 'C01–C02' },
  { id: 'loop', title: '主动感知：Plan–Observe–Reflect', question: 'Planner、Observer 与 Reflector 怎样组成反馈闭环？', takeaway: '计划指定观察，观察产生时间戳证据，反思决定回答或带着缺口继续规划。', next: '一项观察计划具体包含什么？', source: '§3、Algorithm 1、Figure 2', evidence: 'C02–C05' },
  { id: 'planner', title: '观察规划：What–Where–How', question: '如何根据问题与历史选择目标、时间范围和采样粒度？', takeaway: 'Planner 将未知信息转换为 what / where / how 的可执行观察动作。', next: 'Observer 如何把指定片段变成证据？', source: '§3.1；官方代码 avp/main.py、avp/prompt.py', evidence: 'C03、C07' },
  { id: 'observer', title: '目标观察：从视频帧到时间戳证据', question: '为什么观察结果是带时间区间的事件描述，而非原始帧列表？', takeaway: 'Observer 观察计划指定的视频，输出与问题相关的 [起点, 终点, 描述]。', next: '积累多少证据才应该停止？', source: '§3.2、Algorithm 1', evidence: 'C04' },
  { id: 'reflector', title: '证据反思：充分性判断与停止', question: '证据不足、达到阈值和耗尽轮数分别如何处理？', takeaway: 'Reflector 评估累积证据；报告设置采用 0.7 阈值和最多三轮，轮数耗尽仍可能强制回答。', next: '真实取证怎样从粗扫走向精看？', source: '§3.3、§4.3、Algorithm 1', evidence: 'C05–C06' },
  { id: 'case', title: '迭代取证：完整主动观察过程', question: '第一轮只找到候选区间时，下一轮如何补齐细节？', takeaway: '上一轮的证据缺口进入历史，驱动下一轮更有目标的观察；Tombstone 案例在第二轮定位目标。', next: '按需观察能节约多少计算预算？', source: '§3、§5.3、Figure 3（教学模拟另标注）', evidence: 'C13、C18' },
  { id: 'efficiency', title: '计算效率：按需观察与预算分配', question: '在论文 LVBench 对照中，时间、输入 token 和准确率如何变化？', takeaway: '相较 DVD，AVP 使用 18.4% 推理时间和 12.4% 输入 token，准确率为 74.8% 对 74.2%。', next: '五个基准上的性能表现如何？', source: '§5.2.1、Table 2', evidence: 'C10' },
  { id: 'benchmarks', title: '基准评测：任务覆盖与性能比较', question: '五个 Benchmark 覆盖哪些视频理解挑战，AVP 在相同基础模型上提高了多少？', takeaway: '五个基准均显示准确率提升，但任务与评测范围不同，不能把成绩当作同一难度的能力排名。', next: '哪些模块和配置带来了提升？', source: '§4.1–4.2、§5.1、Table 1', evidence: 'C08、C19' },
  { id: 'ablations', title: '组件消融：性能提升来自哪里', question: 'Planner、Reflector、Observer 强弱及关键设置如何影响结果？', takeaway: '组件逐项加入带来增益；更强 Observer 尤其重要，三轮配置在报告实验中达到最好结果。', next: '闭环在哪些证据缺失场景仍会失败？', source: '§4.3、§5.2.2、Appendix B.3、Tables 3–5、10–11', evidence: 'C06、C11–C12' },
  { id: 'limits', title: '可靠性边界：证据遗漏与研究局限', question: '短暂事件被漏看时，反思为什么仍可能自信地答错？', takeaway: '粗略观察遗漏短暂三分球，Observer 的证据不完整，Reflector 因而以 0.8 置信度答 2；完整计数是 3。', next: '带着证据缺口，继续研究更可靠的主动观察。', source: '', evidence: '' }
];
