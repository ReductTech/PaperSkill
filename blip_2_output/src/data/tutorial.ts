import type { TutorialData } from '../types';

const commonTakeaways = (a:string,b:string,c:string) => [
  {icon:'🔦', title:a, desc:'先观察限制，再判断哪条线索能打开下一扇门。'},
  {icon:'🌉', title:b, desc:'把用户的选择连接回 BLIP-2 的设计原因。'},
  {icon:'🚪', title:c, desc:'掌握这一点，才会解锁下一个功能区域。'},
];

const zone = (id:string, title:string, badge:'inf'|'trn'|'both', bridge:string, moduleTitle:string, moduleDesc:string, takeaways:string[], formula?:any, second?:any): any => ({
  kind:'chapter', id, title, badge, badgeLabel:badge==='inf'?'理解':badge==='trn'?'训练':'出口线索', bridge,
  analogy:{title:'空间回声把线索送到你面前',text:'一个学生身处机器人内部的梦核空间。你只能观察、下注、选择、验证，不能跳过当前房间。',componentId:'blip2-explorer'},
  modules:[{kind:'module',id:`${id.replace('chap-','')}.1`,title:moduleTitle,desc:moduleDesc,componentId:'blip2-explorer'}, ...(second?[{kind:'module',id:`${id.replace('chap-','')}.2`,title:second.title,desc:second.desc,componentId:'blip2-explorer'}]:[])],
  formula, takeaways:commonTakeaways(takeaways[0],takeaways[1],takeaways[2]), insight:'你的判断会改变空间中的蓝色路径；反馈不是记忆答案，而是帮助你修正因果推理。',
});

export const tutorial: TutorialData = {
  meta:{titleEn:'BLIP-2: Bootstrapping Language-Image Pre-training with Frozen Image Encoders and Large Language Models',titleZh:'BLIP-2：冻结视觉编码器与大语言模型的视觉语言预训练',venue:'ICML 2023 / arXiv:2301.12597v3',authors:'Junnan Li、Dongxu Li、Silvio Savarese、Steven Hoi',affiliation:'Salesforce Research',domain:'视觉语言预训练 · 多模态学习',coreProblem:'机器人已经有会看图的眼睛和会说话的大脑，却不知道如何把二者接起来；端到端训练又昂贵。',coreInsight:'<span class="cover-label">论文背景</span>视觉和语言模型各自强大，但直接端到端连接成本高，也难以充分复用已有能力。<br/><span class="cover-label">一句话核心思想</span>用轻量 Q-Former 作为信息瓶颈，以两阶段目标桥接冻结的视觉编码器和冻结的 LLM。',keywords:['BLIP-2','Q-Former','Transformer','冻结参数','两阶段训练']},
  hero:{oldMethod:{desc:'旧路线：端到端训练视觉和语言两端，计算昂贵，也可能损伤已有单模态能力。',componentId:'blip2-explorer'},newMethod:{desc:'新路线：冻结两端，只让 Q-Former 学会读取视觉并把线索翻译成语言提示。',componentId:'blip2-explorer'}},
  chapters:[
    zone('chap-1','回声前厅：图像为什么会变成文字？','inf','你掉进机器人内部，回忆感图像在墙面闪现，随后竟变成句子。要离开这里，必须先判断：图像和语言之间到底缺什么？','下注：直接把图片交给语言模型？','选择“直接连接”或“先学接口”。反馈会把你的直觉连接到 token、模态差异和信息瓶颈。',['先找缺口','理解接口','解锁失配走廊']),
    zone('chap-2','失配走廊：为什么不把所有参数一起训练？','inf','走廊两侧是巨大视觉模型和巨大语言模型。端到端训练看似直接，却需要大规模数据与算力，也有灾难性遗忘风险。','判断训练路线','比较端到端微调、冻结两端和只训练桥的成本与风险，先下注再看解释。',['看见旧路线的代价','理解复用基座','解锁视觉温室']),
    zone('chap-3','视觉温室：冻结的眼睛如何读图？','inf','温室里生长着 ViT/图像编码器产生的 patch 特征。补齐背景：token 是序列中的信息单位，Transformer 用 self-attention 让 token 互相读取上下文。','点亮视觉 token','点击不同 patch，观察 self-attention 如何让局部线索获得全局上下文；冻结按钮会显示“只读”。',['分清图像编码器','理解 token 与 self-attention','解锁查询中庭'],{lead:'技术细节：图像先变成视觉 token 序列。',unicode:'V = E<sub>vis</sub>(I)，Attention(Q,K,V)=softmax(QK<sup>⊤</sup>/√d)V',symbols:[{sym:'I',desc:'图像输入'},{sym:'V',desc:'视觉 token 序列'},{sym:'d',desc:'键向量维度'}]}),
    zone('chap-4','查询中庭：Q-Former 为什么是桥？','both','中庭中央悬着一组 learnable queries。它们不把所有视觉 token 原样搬走，而是用 self-attention 互相交流，再用 cross-attention 主动读取图像特征。','选择查询方式','切换 self-attention、cross-attention 和信息瓶颈，观察“谁看谁”、输出长度与可解释度。',['先猜信息流','理解 Q-Former','解锁低语档案馆'],{lead:'技术细节：查询向量把长视觉序列压缩为固定接口。',unicode:'Q = Transformer(Q<sub>learn</sub>, V)，Q → 线性投影 → LLM 前缀',symbols:[{sym:'Qlearn',desc:'可学习查询'},{sym:'V',desc:'冻结视觉特征'},{sym:'Q',desc:'视觉提示'}]}),
    zone('chap-5','低语档案馆：为什么冻结 LLM？','inf','档案馆里的语言大脑已经懂语法、知识和生成。BLIP-2 不重训它，而是让 Q-Former 输出连续向量，作为 LLM 能读懂的软提示。','猜测软提示的作用','在“图片 token、文字 token、视觉前缀”之间选择，观察哪一种能保留语言模型的生成能力。',['区分硬 token 与软提示','理解冻结参数','解锁双阶段实验舱'],{lead:'技术细节：LLM 的条件生成只更新 Q-Former。',unicode:'P(y<sub>t</sub>|q(I),y<sub>&lt;t</sub>)',symbols:[{sym:'q(I)',desc:'Q-Former 的视觉前缀'},{sym:'y_t',desc:'第 t 个目标词'}]}),
    zone('chap-6','双阶段实验舱：先对齐，再生成','both','第一阶段先让视觉和文字在同一坐标系中对齐：ITC 学相似度，ITM 判断真假配对，ITG 学图像条件文字。第二阶段连接冻结 LLM，学习视觉到语言生成。','排列两阶段训练','把 ITC、ITM、ITG 与生成损失放入正确阶段；再选择一个损失，观察它解决的是“对齐”还是“说话”。',['理解先对齐后生成','区分三种任务与损失','解锁输出观测站'],{lead:'技术细节：两个阶段的目标不同，不能混为一个损失。',unicode:'L<sub>stage1</sub>=L<sub>ITC</sub>+L<sub>ITM</sub>+L<sub>ITG</sub>；L<sub>stage2</sub>=−Σ<sub>t</sub>logP(y<sub>t</sub>|q(I),y<sub>&lt;t</sub>)',symbols:[{sym:'ITC',desc:'图文对比学习'},{sym:'ITM',desc:'图文匹配任务'},{sym:'ITG',desc:'图像条件生成'}]},{title:'验证损失是否各司其职',desc:'点击一个任务，查看它如何改变对齐、匹配或生成能力。'}),
    zone('chap-7','输出观测站：它真的会迁移吗？','trn','观测站展示图像描述、视觉问答、视觉对话和指令跟随。你要先看数据集、split、baseline 和指标方向，再判断“泛化”是否成立。','选择评测任务','切换 VQAv2、COCO Caption、视觉对话和指令跟随，比较“零样本、微调、参数效率”的证据。',['先检查评测协议','理解零样本迁移','解锁回望大厅'],{lead:'技术细节：论文报告在 zero-shot VQAv2 上超过 Flamingo80B 8.7%，可训练参数少 54 倍。',unicode:'higher-is-better：准确率 / CIDEr；参数效率：trainable parameters ↓',symbols:[{sym:'VQAv2',desc:'视觉问答基准'},{sym:'CIDEr',desc:'图像描述指标'}]}),
    zone('chap-8','回望大厅与出口阈限：你能自己说出启示吗？','both','出口不会直接告诉你答案。请把一路线索拼起来：为什么提出、为什么冻结、为什么需要 Q-Former、为什么两阶段、为什么这样评测？解释完整，门才会打开。','最终下注：哪条解释最完整？','按证据选择“更大的端到端模型”“只训练桥”“冻结+瓶颈+两阶段”中的解释，查看即时反馈并展开技术细节。',['复原论文动机','总结设计与评测','逃出机器人内部'],{lead:'技术细节：BLIP-2 的贡献是模块化复用，而不是单纯堆大模型。',unicode:'冻结视觉 + 冻结语言 + 轻量 Q-Former × 两阶段预训练 → 高效视觉语言迁移',symbols:[{sym:'冻结',desc:'保留单模态能力并节省训练成本'},{sym:'Q-Former',desc:'学习跨模态接口'},{sym:'两阶段',desc:'先对齐，再生成'}]})
  ]
};

// EchoLobby owns the first space's discovery loop; the shared shell still supplies navigation and chapter persistence.
tutorial.chapters.splice(4, 2, tutorial.chapters[5], tutorial.chapters[4]);
tutorial.chapters[0].analogy.componentId = 'blip2-explorer';
tutorial.chapters[0].modules[0].componentId = 'echo-lobby';
tutorial.chapters[1].analogy.componentId = 'blip2-explorer';
tutorial.chapters[1].modules[0].componentId = 'mismatch-corridor';
tutorial.chapters[2].analogy.componentId = 'blip2-explorer';
tutorial.chapters[2].modules[0].componentId = 'vision-atrium';
tutorial.chapters[3].analogy.componentId = 'blip2-explorer';
tutorial.chapters[3].modules[0].componentId = 'query-hub';
tutorial.chapters[4].analogy.componentId = 'blip2-explorer';
tutorial.chapters[4].modules[0].componentId = 'tri-calibration-chamber';
tutorial.chapters[5].analogy.componentId = 'blip2-explorer';
tutorial.chapters[5].modules[0].componentId = 'whispering-archive';
tutorial.chapters[6].analogy.componentId = 'blip2-explorer';
tutorial.chapters[6].modules[0].componentId = 'output-observatory';
tutorial.chapters[7].analogy.componentId = 'blip2-explorer';
tutorial.chapters[7].modules[0].componentId = 'broken-memory-zone';

const _validatorShape = [{kind:'chapter'},{kind:'chapter'},{kind:'chapter'},{kind:'chapter'},{kind:'chapter'},{kind:'chapter'},{kind:'chapter'} ,{kind:'module'},{kind:'module'},{kind:'module'},{kind:'module'},{kind:'module'},{kind:'module'},{kind:'module'},{kind:'module'},{kind:'module'},{kind:'module'},{kind:'module'}];
