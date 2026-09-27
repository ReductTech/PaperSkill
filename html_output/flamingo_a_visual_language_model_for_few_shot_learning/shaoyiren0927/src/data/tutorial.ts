import type { TutorialData } from '../types';

const widget = 'flamingo-explorer';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Flamingo: a Visual Language Model for Few-Shot Learning',
    titleZh: 'Flamingo：少样本学习的视觉语言模型',
    venue: 'NeurIPS 2022',
    authors: 'Jean-Baptiste Alayrac 等',
    affiliation: 'DeepMind',
    domain: '视觉语言模型 / 多模态学习',
    coreProblem: '一个模型能否只看几条例子，就把视觉问题迁移到新任务，而不为每个任务重新微调？',
    coreInsight: '论文背景：现有方法往往为每个视觉语言任务单独训练，难以处理任意交错的图像、视频与文本，并用少量示例快速适配新任务。<br/><span class="cover-label">核心思想：</span>冻结强大的视觉与语言骨干，用 Perceiver Resampler 压缩视觉信息，再以门控交叉注意力把视觉证据按需注入语言模型。',
    keywords: ['少样本学习', '视觉语言', '交叉注意力', '多模态对话'],
  },
  hero: {
    oldMethod: { desc: '传统做法：每遇到新任务就收集大量标注并微调一个专用模型；换任务要重来。', componentId: widget },
    newMethod: { desc: 'Flamingo：给出少量图文示例作为上下文，冻结骨干，只让轻量连接器学会“看哪里、说什么”。', componentId: widget },
  },
  chapters: [
    { kind:'chapter', id:'chap-1', title:'序章：漂浮在现实里的问题', badge:'inf', badgeLabel:'序章', bridge:'夜色还没有散去。不要急着学习论文知识——先在一片安静的灰绿色天空里，找到那些让“通用视觉语言模型”迟迟没有出现的现实问题。', analogy:{title:'一片还没有答案的天空',text:'碎片从远处缓慢漂来。每一块都藏着一个真实困境。请先听见问题，再亲手选择你认为可行的方向。',componentId:undefined}, modules:[{kind:'module',id:'1.1',title:'漂浮碎片',desc:'点击任意碎片，回答它提出的现实问题。选择后，碎片会停在自己的位置；当所有碎片都被回答，它们会拼成一块矩形入口。',componentId:'flamingo-opening'}], takeaways:[]},
    { kind:'chapter', id:'chap-2', title:'第二章：跟随一束视觉信息穿过 Flamingo', badge:'inf', badgeLabel:'沉浸路线', bridge:'你已经进入通道。现在不要俯视架构图，而是跟随一张 image 或一段 video 的信息，沿真实数据流逐站前进。每个节点只有在上一站完成后才会解锁。', analogy:{title:'沿着数据真正走过的路',text:'从视觉输入出发，依次经过 Vision Encoder、Perceiver Resampler、Visual Tokens、GATED XATTN-DENSE、Frozen LM，最后抵达 Text Output。',componentId:undefined}, modules:[{kind:'module',id:'2.1',title:'Flamingo 数据路线',desc:'按顺序选择节点；每站随机回答三个问题。回答完成后可查看一句话总结与技术细节抽屉。走完整条路线后，将在新的架构窗口中完成最终拼图。',componentId:'flamingo-route'},{kind:'module',id:'2.2',title:'架构拼图入口',desc:'拼图窗口由路线完成状态驱动。',componentId:'flamingo-route-puzzle'}], takeaways:[]},
    { kind:'chapter', id:'chap-3', title:'第三章：进入两个关键连接器', badge:'both', badgeLabel:'深入结构', bridge:'现在从路线图下潜到两个真正决定 Flamingo 能否工作的结构：Perceiver Resampler 负责把可变视觉输入整理成固定记忆，GATED XATTN-DENSE 负责让语言状态按需读取这份记忆。', analogy:{title:'先看水流，再看阀门',text:'你会先进入一个把大水面压成 64 个稳定水滴的房间，再进入一个由阀门控制视觉水流进入语言河道的房间。',componentId:undefined}, modules:[{kind:'module',id:'3.1',title:'Perceiver Resampler → GATED XATTN-DENSE',desc:'先观察视觉特征如何变成 64 个 visual tokens，再回答四个问题；点击按钮切换到 GATED XATTN-DENSE，继续回答四个问题。最后用生活类比、Transformer 级解释和 Figure 4 风格伪代码拼起完整过程。',componentId:'flamingo-deepdive'}], takeaways:[]},
    { kind:'chapter', id:'chap-4', title:'第四章：Few Shot 的秘密藏在数据里', badge:'both', badgeLabel:'Few Shot·数据', bridge:'架构只是入口。Flamingo 的 few-shot 能力还来自它见过怎样的数据：图像和文字如何交错、注意力如何被限制、示例如何在上下文中彼此照应。', analogy:{title:'在一叠混排相册里学会新游戏',text:'你手里有几张图文示范卡。每张卡的顺序、可见范围和问题格式，都在告诉模型“这一次要完成什么任务”。',componentId:undefined}, modules:[{kind:'module',id:'4.1',title:'Few Shot 与数据实验室',desc:'依次回答六个核心问题；每题都附一个延伸问题、即时答案和技术细节抽屉。最后用 4-shot multimodal prompt 逐 token 追踪模型能访问哪些信息。',componentId:'fewshot-data'}], takeaways:[]},
    { kind:'chapter', id:'chap-5', title:'第五章：严格审稿人模式——为什么相信它有效？', badge:'both', badgeLabel:'证据审查', bridge:'这一章不再复述做法，而是审查证据：作者提出了什么假设？消融实验真正测试了什么？哪些数据支持结论，哪些地方不能推出更强的因果判断？', analogy:{title:'拿着审稿人的铅笔逐项打分',text:'先看完整架构，再进入评审桌。每个设计都要面对假设、对照、结果和边界，最后由你决定证据有多可信。',componentId:undefined}, modules:[{kind:'module',id:'5.1',title:'Flamingo 证据审查台',desc:'先点击进入完整架构，再为 M3W、Perceiver Resampler、tanh gating、GATED XATTN-DENSE、cross-attention frequency、strong vision encoder、freezing LM 七项设计拖动评分。完成后查看实验依据、Figure 2 趋势和证据强弱判断。',componentId:'reviewer-evidence'}], takeaways:[]},
    { kind:'chapter', id:'chap-10', title:'最后一章：能力的边界，以及下一步', badge:'both', badgeLabel:'局限分析', bridge:'最后不再追问“它能做什么”，而是逐项判断：问题来自 Flamingo 架构、冻结语言模型，还是当前训练范式？只有分清来源，改进方向才不会停留在口号。', analogy:{title:'',text:'',componentId:undefined}, modules:[{kind:'module',id:'10.1',title:'局限诊断旅程',desc:'依次判断六类局限的主要来源，作答后查看技术边界；随后提出三个值得继续研究的问题，留下你的解决思路并完成全文复盘。',componentId:'limitation-journey'}], takeaways:[]},
  ],
};
