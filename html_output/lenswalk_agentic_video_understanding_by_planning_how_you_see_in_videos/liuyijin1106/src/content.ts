export const PAPER = 'https://arxiv.org/html/2603.24558';
export const CVPR_PDF = 'https://openaccess.thecvf.com/content/CVPR2026/papers/Li_LensWalk_Agentic_Video_Understanding_by_Planning_How_You_See_in_CVPR_2026_paper.pdf';
export const CODE = 'https://github.com/likanchuan09171/LensWalk';
export const PROJECT = 'https://likanchuan09171.github.io/LensWalk/';

export type ChapterSpec = { id:string; title:string; sidebarTitle:string; question:string; takeaway:string; bridge:string; source:string; claim:string };

export const chapters: ChapterSpec[] = [
  {id:'fixed',title:'固定观察范式：关键视觉证据的遗漏',sidebarTitle:'固定采样的局限',question:'固定视频采样为何可能错过短时事件？',takeaway:'当视觉上下文预先固定时，模型可能无法获取回答问题所必需的关键证据。',bridge:'观察应由谁来决定？',source:'Introduction · Figure 1',claim:'C1'},
  {id:'loop',title:'推理驱动的观察：Reason–Plan–Observe 闭环',sidebarTitle:'主动观察闭环',question:'Reasoner、Observer、Toolkit 与 History 如何协作？',takeaway:'LensWalk 让推理结果参与下一轮观察决策，从而形成动态证据获取闭环。',bridge:'一次观察计划需要写明哪些参数？',source:'§3.1–3.2 · Figure 2',claim:'C2'},
  {id:'scope',title:'参数化观察规划：时间范围与采样密度',sidebarTitle:'观察参数规划',question:'工具、子问题、时间区间和采样预算如何共同确定观察？',takeaway:'参数化观察行动让 Reasoner 的规划可以被真正执行，并决定模型能够获得哪些视觉证据。',bridge:'长视频里先如何寻找候选位置？',source:'§3.2 · Algorithm 1',claim:'C2'},
  {id:'scan',title:'广域视觉搜索：Scan Search',sidebarTitle:'广域搜索',question:'怎样在长视频中分片搜索相关证据？',takeaway:'Scan Search 对宽范围分片稀疏观察，返回值得进一步核查的区间。',bridge:'候选片段如何被细看？',source:'§3.3 · Scan Search',claim:'C3'},
  {id:'segment',title:'局部细粒度观察：Segment Focus',sidebarTitle:'局部精查',question:'候选时间段已找到，怎样重新取帧确认短暂动作？',takeaway:'Segment Focus 通过针对连续时间区间重新采样，为推理补充更细粒度的视觉证据。',bridge:'不连续证据怎样同时核对？',source:'§3.3 · Segment Focus',claim:'C4'},
  {id:'stitch',title:'跨片段联合验证：Stitched Verify',sidebarTitle:'跨片段联合验证',question:'怎样把相隔较远的片段放进同一视觉上下文？',takeaway:'Stitched Verify 联合非连续片段，让 Observer 比较跨时刻关系。',bridge:'跨轮观察如何保持证据和主体一致？',source:'§3.3 · Stitched Verify',claim:'C5'},
  {id:'memory',title:'证据锚定机制：时间戳与主体记忆',sidebarTitle:'时间戳与主体记忆',question:'如何定位证据并保持跨轮身份一致？',takeaway:'Timestamp Anchors 定位证据；Subject Memory Table 维持主体指代。',bridge:'这些机制连成怎样的完整轨迹？',source:'§3.4 · Figure 2',claim:'C6–C7'},
  {id:'simulator',title:'完整推理轨迹：观察规划与证据迭代',sidebarTitle:'完整推理轨迹',question:'从问题到 Finish，观察计划怎样随证据更新？',takeaway:'行动、观察、证据和记忆反复更新，直到 Reasoner 决定 Finish。',bridge:'作者怎样检验这条路径？',source:'Algorithm 1 · Figure 2',claim:'C2–C6'},
  {id:'benchmarks',title:'性能验证：跨基准测试与模型组合',sidebarTitle:'性能与模型组合',question:'哪些 Benchmark、Baseline 和模型组合参与主实验？',takeaway:'六个基准和多种 Reasoner–Observer 组合检验跨任务适用性。',bridge:'性能收益来自哪些机制，又付出什么成本？',source:'§4.1–4.2 · Tables 1–3',claim:'C8–C11'},
  {id:'results',title:'机制分析：消融实验、观察策略与可靠性边界',sidebarTitle:'消融、策略与局限',question:'哪些机制有效，如何观察，又付出什么代价？',takeaway:'消融、策略行为与成本分析共同说明主动观察的收益及其边界。',bridge:'完成机制分析后，回看整条证据链。',source:'§4.3–4.4 · Table 4 · Figures 3–4 · Appendix Tables 6–7',claim:'C12–C14'}
];
