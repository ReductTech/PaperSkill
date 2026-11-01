export const PAPER = 'https://arxiv.org/html/2605.01657';
export const ARXIV = 'https://arxiv.org/abs/2605.01657';
export const CVF = 'https://openaccess.thecvf.com/content/CVPR2026/html/Q._Act2See_Emergent_Active_Visual_Perception_for_Video_Reasoning_CVPR_2026_paper.html';
export const CODE = 'https://github.com/martinmamql/act2see';

export const chapters = [
  { id:'evidence-gap', title:'视觉盲区：固定采样的证据缺失', difficulty:'入门', role:'认识固定采样后的证据缺口', question:'固定采样为什么可能错过关键动作？', takeaway:'关键不是一开始看多少帧，而是推理途中能否按需再看。', bridge:'模型怎样判断缺少什么？', sourceRefs:['§1'] },
  { id:'evidence-decision', title:'观察决策：何时回答，何时补充视觉信息', difficulty:'入门', role:'判断当前问题需要哪种画面', question:'现有证据够用，还是要请求新画面？', takeaway:'Act2See 的关键变化，是让获取新画面的请求成为推理过程的一部分。', bridge:'那么，检索和生成究竟怎样得到这些新画面？', sourceRefs:['§1','§2.1'] },
  { id:'visual-tools', title:'双工具机制：真实帧检索与假设帧生成', difficulty:'入门', role:'辨认检索与生成的画面来源', question:'真实帧和假设帧怎样得到？', takeaway:'Retrieve 寻找真实证据，Generate 构造假设画面；两者都能为后续推理提供新的视觉信息，但证据性质不同。', bridge:'这些新画面怎样插入模型正在进行的推理？', sourceRefs:['§2.1','§3.2'] },
  { id:'interleaved-cot', title:'交错式推理：从工具调用到证据整合', difficulty:'进阶', role:'串起调用、返回帧和续写的顺序', question:'模型怎样把新的画面纳入下一步思考？', takeaway:'文字推理、视觉调用与返回帧交错出现，随后继续推理。', bridge:'示范轨迹从何而来？', sourceRefs:['§2.1','Table 1','Algorithm 1','Figure 1'] },
  { id:'demonstrations', title:'示范数据构建：生成、筛选与组织', difficulty:'进阶', role:'理解原始数据如何经生成与筛选成为 3,373 条 SFT 示范', question:'哪些 Gemini 推理轨迹能成为训练示范？', takeaway:'人工标注 CoT 充当事后质量标尺，而不是生成时交给 Gemini 的答案。', bridge:'这些示范怎样教会模型主动观察？', sourceRefs:['§3.1–3.4','Figure 2'] },
  { id:'sft-learning', title:'监督微调：学习生成视觉工具请求', difficulty:'进阶', role:'认识目标序列与图像帧的损失边界', question:'训练目标是图像本身，还是发出视觉动作的序列？', takeaway:'损失覆盖文字及工具查询 token，排除返回的图像帧。', bridge:'如何检验学到的能力？', sourceRefs:['§2.2','§4.3','Eq. 1','Figure 3'] },
  { id:'evaluation', title:'性能验证：基准对比与消融分析', difficulty:'进阶', role:'对照五项主结果、1k 样本消融与结论边界', question:'提升来自哪里，比较条件是否一致？', takeaway:'五项基准均高于同一基座；分支消融支持两类调用结合。', bridge:'具体案例中真的出现调用吗？', sourceRefs:['§4.1','Tables 2, 8'] },
  { id:'cases', title:'案例解析：检索、生成与失败', difficulty:'综合', role:'观察论文中的三次视觉调用', question:'新画面怎样影响判断，又可能出现什么错误？', takeaway:'Act2See 会主动请求新画面，但生成画面并非总可靠。', bridge:'当新画面本身有错误时，模型的推理还值得信任吗？', sourceRefs:['Figure 4'] },
  { id:'reliability', title:'可靠性边界：生成误差与方法局限', difficulty:'综合', role:'审视反事实、成本、局限与理解检查', question:'生成失败、工具成本和评估边界怎样限制结论？', takeaway:'未测量的风险仍需明确标成方法分析。', bridge:'用理解检查回顾整篇论文。', sourceRefs:['§4.4','Figure 4','Appendix F','Tables 11–13'] },
] as const;

export type ChapterId = (typeof chapters)[number]['id'];
const ids = chapters.map(chapter => chapter.id);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate chapter ID in content.ts');

export const benchmarks = [
  {name:'Video-MME', skill:'一般视频理解', why:'不同视频长度与领域，检验通用分析。', metric:'准确率（不含字幕）', score:74.2, base:71.8},
  {name:'VideoEspresso', skill:'细粒度语义与时空定位', why:'跨 14 类任务，适合观察复杂 CoT。', metric:'平均准确率', score:46.8, base:41.5},
  {name:'EgoNormia', skill:'第一视角的物理—社会规范', why:'要求同时选对行为与理由。', metric:'verified split：行为和理由均正确', score:51.3, base:48.9},
  {name:'VCR-Bench', skill:'感知与逻辑推理', why:'把过程拆成七类任务维度。', metric:'平均准确率', score:47.1, base:38.2},
  {name:'ViTIB', skill:'视频—文本交错推理', why:'直接检验在推理中纳入关键帧。', metric:'平均准确率', score:63.3, base:60.2},
] as const;

export const figures = [
  {n:1, src:'./paper/figure-1.png', title:'两轮构建交错 CoT', explain:'左侧：Gemini 2.5 Pro 输出检索查询；右侧：工具返回真实帧后，第二轮续写。', limit:'该图是训练数据构造流程，不是 Act2See 推理日志。'},
  {n:2, src:'./paper/figure-2.png', title:'SFT 数据组成', explain:'展示三个数据来源及类型分布；正文给出 3,373 条轨迹与视觉调用计数。', limit:'组成图不能单独证明性能提升。'},
  {n:3, src:'./paper/figure-3.png', title:'一条交错训练样本', explain:'视频、问题、检索调用、返回帧与后续推理出现在同一训练序列。', limit:'单个样本只说明格式和机制，不能代表总体准确率。'},
  {n:4, src:'./paper/figure-4.png', title:'推理时的检索与生成', explain:'左半为真实帧检索，右半为条件化生成；作者用它展示调用能在推理时出现。', limit:'最右侧咖啡例子也暴露生成帧与提示不完全一致。'},
] as const;
