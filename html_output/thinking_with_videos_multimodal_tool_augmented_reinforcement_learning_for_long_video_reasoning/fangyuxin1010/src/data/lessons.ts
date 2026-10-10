export type Kind='compare'|'tasks'|'window'|'history'|'iou'|'tools'|'runtime'|'training'|'filter'|'architecture'|'task-reward'|'sample-reward'|'results'|'ablations'|'limits';
export type Lesson={chapter:number;title:string;subtitle:string;kind:Kind;points:{title:string;text:string}[];formula?:string};
export const paperTitle="Thinking With Videos: Multimodal Tool-Augmented Reinforcement Learning for Long Video Reasoning";
export const chapterNames=["稀疏观察的盲区：为什么关键动作会被漏掉","按需回看视频：把观察机会用在关键片段","多模态推理：让新画面成为下一步判断的证据","时间定位的评价：用交并比衡量边界是否准确","工具选择与训练：为什么接入工具还不够","一次调用的执行：回答、裁剪与错误如何分流","四阶段学习：从基础推理走向主动寻找证据","模型与工具协作：新视觉信息如何进入上下文","难度感知奖励：兼顾任务差异与样本难易","实验结果与能力边界：理解收益、条件和代价"];
export const lessons:Lesson[]=[
{chapter:1,title:'没看见的动作，不能靠猜补齐',subtitle:'局部回看把稀疏采样漏掉的关键动作带回视野。',kind:'compare',points:[{title:'先看覆盖范围',text:'均匀抽取少量帧时，短暂动作可能落在两次观察之间。'},{title:'再补足视觉证据',text:'VITAL 可以在推理中选择时间段，回到原视频提取新帧。'},{title:'形成判断的前提',text:'新画面提供额外证据；更长的文字本身不会增加看见的信息。'}]},
{chapter:1,title:'答案和证据，分别回答什么',subtitle:'同一个事件可以形成时间定位、视频问答和带定位问答。',kind:'tasks',points:[{title:'时间定位',text:'输出事件发生的起止时间。'},{title:'视频问答',text:'回答视频中的对象、动作或关系。'},{title:'带定位问答',text:'同时给出答案和支持答案的时间区间。'}]},
{chapter:2,title:'把观察机会用在关键片段',subtitle:'裁剪工具按起止时间重新采样，让局部动作更容易被看清。',kind:'window',points:[{title:'先选时间范围',text:'拖动窗口改变回看的位置，而不是放大一张静态图片。'},{title:'再返回局部画面',text:'工具从原始视频取出片段，保留动作发生的先后顺序。'},{title:'观察仍有预算',text:'训练中的工具返回最多64帧，每帧像素上限为224×224。'}],formula:'Vₖ₊₁ = g_clip(V₀, t_start, t_end)'},
{chapter:3,title:'新画面如何改变原来的判断',subtitle:'文字推理、工具请求和视觉结果交替积累，形成多模态思维链。',kind:'history',points:[{title:'提出待验证的问题',text:'最初的帧不足以确定动作时，先定位需要补看的片段。'},{title:'读到真实的新证据',text:'工具返回的视觉内容加入此前的上下文。'},{title:'更新而非重复',text:'后续判断使用新增证据；证据充分时也可以直接作答。'}],formula:'Oₖ = f_MLLM({Tᵢ, Cᵢ, Vᵢ}ᵢ₌₀…ₖ)'},
{chapter:4,title:'时间边界如何变成一个分数',subtitle:'IoU 用重叠时长除以并集时长，同时衡量漏看和多看。',kind:'iou',points:[{title:'交集',text:'预测和参考都覆盖到的时间。'},{title:'并集',text:'至少被预测或参考一方覆盖到的总时间。'},{title:'分数的含义',text:'完全重合得1，互不重叠得0；mIoU与阈值召回率仍是不同指标。'}],formula:'IoU = |预测区间 ∩ 参考区间| / |预测区间 ∪ 参考区间|'},
{chapter:5,title:'接上工具，还要学会使用',subtitle:'不同工具回传的信息不同，直接接入并不保证推理能力提升。',kind:'tools',points:[{title:'描述与问答工具',text:'把片段内容压缩为文字描述或文字答案。'},{title:'视频裁剪工具',text:'直接返回视觉内容，保留进一步检查细节的机会。'},{title:'训练条件很重要',text:'零样本工具实验与经过专门训练的VITAL不能混为一谈。'}]},
{chapter:6,title:'继续观察，还是给出答案',subtitle:'模型输出决定本轮是结束、调用工具，还是返回错误信息。',kind:'runtime',points:[{title:'直接回答',text:'证据足够时，输出最终答案并结束循环。'},{title:'合法调用',text:'解析起止时间，执行裁剪，再把结果交回模型。'},{title:'失败分支',text:'错误信息不会变成视觉证据；评测最多允许2轮工具调用。'}]},
{chapter:7,title:'从基本推理到带工具推理',subtitle:'先完成无工具学习，再用工具轨迹示范和强化学习建立回看能力。',kind:'training',points:[{title:'两次冷启动',text:'第1阶段学习基本推理，第3阶段学习如何生成工具轨迹。'},{title:'两次强化学习',text:'DGRPO分别优化无工具推理与带工具推理。'},{title:'训练约束',text:'各阶段训练1轮，视觉编码器冻结；总计640 GPU小时。'}]},
{chapter:7,title:'保留能区分不同尝试的练习',subtitle:'同题8次采样的奖励极差大于0.05时，才保留该样本。',kind:'filter',points:[{title:'先尝试8次',text:'观察同一道题在不同采样轨迹上的奖励。'},{title:'比较最高与最低',text:'极差反映这些尝试能否提供有区分度的信号。'},{title:'不只过滤全对全错',text:'即使平均分处于中间，只要奖励都差不多，也会被剔除。'}],formula:'ΔR = max(R₁…R₈) − min(R₁…R₈)；保留条件：ΔR > 0.05'},
{chapter:8,title:'新视觉证据怎样接回模型',subtitle:'视觉编码、投影、语言推理和工具返回组成一个可重复的观察循环。',kind:'architecture',points:[{title:'复用视觉语言主干',text:'视频帧经视觉编码与合并投影，进入Qwen2.5-VL-7B。'},{title:'分离判断与执行',text:'语言模型生成请求，解析器提取参数，工具执行裁剪。'},{title:'再次进入上下文',text:'返回片段重新提供视觉信息；裁剪本身不等于可微网络层。'}]},
{chapter:9,title:'给不同任务校准奖励刻度',subtitle:'相同IoU经过任务相关映射后，产生不同的定位奖励。',kind:'task-reward',points:[{title:'短视频定位',text:'α=0.2、β=0.8，将这个区间线性映射到0至1。'},{title:'长视频VidCh定位',text:'α=0、β=0.5，使较低IoU区间也能形成奖励区分。'},{title:'注意适用范围',text:'带定位问答先变换IoU再合入答案分数；选择题准确奖励不做此变换。'}],formula:'S = clamp((IoU − α) / (β − α), 0, 1)'},
{chapter:9,title:'对容易样本打折，但不清零',subtitle:'同题平均奖励越高，软权重越低，而权重下限保留在0.5。',kind:'sample-reward',points:[{title:'先估计样本难易',text:'D是8次采样的平均预权重奖励；D越高，通常表示更容易。'},{title:'再计算软权重',text:'D≤1时w=1；D从1升至2时，w从1降至0.5。'},{title:'奖励与梯度不同',text:'这个变换作用于奖励，不能直接解释为最终策略梯度的倍数。'}],formula:'D = mean(R̂₁…R̂₈)；w = 0.5 + 0.5 clamp(2−D, 0, 1)；R = wR̂'},
{chapter:10,title:'在相同指标上判断收益',subtitle:'长视频任务收益明显，但结果需要结合比较条件、计算成本和能力边界。',kind:'results',points:[{title:'长视频推理',text:'LVR准确率达到79.3%，比无工具VITAL高9.1个百分点。'},{title:'不是所有任务都领先',text:'Video-MME上VITAL为64.1%，同组Gemini 1.5 Pro为75.0%。'},{title:'仍有能力边界',text:'当前主要使用视觉，未整合音频，空间定位能力有限。'}]}
];
export const resultRows=[
{dataset:'LongVideo-Reason',metric:'准确率',values:[60.1,70.2,79.3]},
{dataset:'Video-MME',metric:'整体准确率',values:[62.9,62.5,64.1]},
{dataset:'VidChapters-7M',metric:'R@0.5',values:[.3,25.8,34.7]},
{dataset:'VUE-TR-Vision',metric:'IoU AUC',values:[12.6,31.6,35.3]},
{dataset:'VSI-Bench',metric:'准确率',values:[31.8,37.5,41.8]},
{dataset:'Video-MMMU',metric:'准确率',values:[47.4,52.1,54.2]},
{dataset:'MMVU（选择题）',metric:'准确率',values:[61.3,62.6,68.7]},
{dataset:'NExT-GQA',metric:'mIoU',values:[15.4,37.2,43.0]},
{dataset:'Charades-STA',metric:'mIoU',values:[43.6,57.1,59.9]},
{dataset:'ActivityNet-MR',metric:'mIoU',values:[21.1,46.6,49.8]},
{dataset:'ReXTime',metric:'mIoU',values:[27.5,40.9,47.6]}
];
