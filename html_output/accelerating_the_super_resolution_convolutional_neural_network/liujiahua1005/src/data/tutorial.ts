import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Accelerating the Super-Resolution Convolutional Neural Network',
    titleZh: '加速超分辨率卷积神经网络',
    venue: 'ECCV 2016 · arXiv:1608.00367v1',
    authors: 'Chao Dong · Chen Change Loy · Xiaoou Tang',
    affiliation: '香港中文大学',
    domain: '计算机视觉 · 单图像超分辨率',
    coreProblem: '原始 SRCNN 先把图像插值到高分辨率，计算量随空间尺寸平方增长；240×240 图像三倍放大约只有 1.32 fps，难以实时使用。',
    coreInsight: 'FSRCNN 直接从原始低分辨率图像学习，末端用反卷积上采样，并用“收缩—映射—扩展”的 hourglass 结构减少计算。',
    keywords: ['FSRCNN', 'SRCNN 加速', '实时超分辨率']
  },
  hero: {
    oldMethod: { desc: 'SRCNN 先双三次插值再卷积；中间高分辨率特征图让计算变重。图示为概念示意，并非论文样本。', componentId: 'photo-scene' },
    newMethod: { desc: 'FSRCNN 在低分辨率空间完成特征处理，最后用反卷积恢复尺寸；论文报告超过 40 倍加速。图示为概念示意。', componentId: 'photo-scene' }
  },
  chapters: [
    { kind:'chapter', id:'chap-1', title:'为什么 SRCNN 还不够快', badge:'inf', badgeLabel:'问题 · 动机', bridge:'先看瓶颈：插值把每一层都搬到更大的空间，速度因此被拖慢。', analogy:{title:'先放大再处理很费力',text:'同一张纸先放大三倍再描线，每一步都要处理更多面积。',componentId:'photo-scene'}, modules:[{kind:'module',id:'1.1',title:'空间尺寸与速度瓶颈',desc:'拖动放大倍率，观察先插值会如何扩大后续计算面积。',componentId:'lesson-widget'}], insight:'论文以 240×240、三倍放大为例：原始 SRCNN 约 1.32 fps，而实时视频通常需要 24 fps。', takeaways:[{icon:'▣',title:'先插值',desc:'输入先被放到高分辨率尺寸。'},{icon:'◎',title:'面积变大',desc:'卷积在更大特征图上反复计算。'},{icon:'✦',title:'目标实时',desc:'加速至少要跨过 24 fps 门槛。'}] },
    { kind:'chapter', id:'chap-2', title:'FSRCNN 从哪里开始计算', badge:'both', badgeLabel:'核心 · 输入', bridge:'解决瓶颈的第一步，是把学习映射移回原始低分辨率图像。', analogy:{title:'在小纸面上先描线',text:'先在小尺寸纸面提取轮廓，最后一次性放大，重复劳动会少很多。',componentId:'photo-scene'}, modules:[{kind:'module',id:'2.1',title:'插值输入与低分辨率输入',desc:'切换两种路径，比较 SRCNN 的先插值和 FSRCNN 的直接输入。',componentId:'lesson-widget'}], insight:'FSRCNN 省去输入端插值，把反卷积放到网络末端；训练和测试都可以直接接收原始低分辨率图像。', formula:{lead:'网络映射从低分辨率输入到高分辨率输出。',unicode:'F(Y;Θ) → X',symbols:[{sym:'Y',desc:'原始低分辨率图像。'},{sym:'F',desc:'FSRCNN 的卷积、映射和反卷积组合。'},{sym:'X',desc:'目标高分辨率图像。'}]}, takeaways:[{icon:'□',title:'原图输入',desc:'不先把 Y 插值到目标尺寸。'},{icon:'◫',title:'末端上采样',desc:'反卷积承担尺寸恢复。'},{icon:'◉',title:'空间更省',desc:'主要计算留在低分辨率空间。'}] },
    { kind:'chapter', id:'chap-3', title:'Hourglass 怎样压缩映射', badge:'both', badgeLabel:'核心 · 结构', bridge:'第二步是收缩通道、进行映射，再扩展回去，形成紧凑的 hourglass。', analogy:{title:'先收窄再展开',text:'先把宽大的草图压缩成重点线索，处理后再展开成完整轮廓。',componentId:'photo-scene'}, modules:[{kind:'module',id:'3.1',title:'收缩—映射—扩展',desc:'逐层查看 FSRCNN 的特征通道如何变化，以及每一段承担的职责。',componentId:'lesson-widget'}], insight:'收缩层把 d 个特征通道压到 s 个，映射层用 m 个小卷积核处理，扩展层再恢复到 d 个通道。', formula:{lead:'论文的基本 hourglass 可写成通道维度的变化。',unicode:'d → s → (m mapping layers) → d',symbols:[{sym:'d',desc:'收缩前的特征通道数。'},{sym:'s',desc:'瓶颈通道数，通常小于 d。'},{sym:'m',desc:'映射层数量。'}]}, takeaways:[{icon:'⌗',title:'收缩',desc:'先减少映射阶段的通道。'},{icon:'◇',title:'映射',desc:'用更多小核层积累非线性。'},{icon:'▤',title:'扩展',desc:'恢复通道后交给反卷积。'}] },
    { kind:'chapter', id:'chap-4', title:'反卷积负责最后放大', badge:'trn', badgeLabel:'训练 · 重建', bridge:'第三步是把上采样放到最后，让网络直接学习从低分辨率到高分辨率的映射。', analogy:{title:'最后一步展开成大图',text:'前面只整理线索，最后一次展开纸张并完成清晰轮廓。',componentId:'photo-scene'}, modules:[{kind:'module',id:'4.1',title:'反卷积与放大倍率',desc:'切换低分辨率输入与高分辨率目标，理解末端上采样的职责。',componentId:'lesson-widget'}], insight:'论文使用反卷积层替代输入端插值；不同放大倍率需要相应的反卷积设置，迁移策略可以复用卷积层。', formula:{lead:'训练仍以重建误差为目标。',unicode:'L(Θ)=1/n Σᵢ ‖F(Yᵢ;Θ)−Xᵢ‖²',symbols:[{sym:'Θ',desc:'卷积、PReLU 和反卷积参数。'},{sym:'Yᵢ',desc:'低分辨率训练样本。'},{sym:'Xᵢ',desc:'对应高分辨率真值。'}]}, takeaways:[{icon:'◧',title:'末端放大',desc:'反卷积只在最后恢复空间尺寸。'},{icon:'⊙',title:'端到端',desc:'输入和输出之间统一优化。'},{icon:'▥',title:'倍率相关',desc:'不同倍率需要匹配的上采样设置。'}] },
    { kind:'chapter', id:'chap-5', title:'速度和质量怎样取舍', badge:'trn', badgeLabel:'实验 · 设计', bridge:'FSRCNN 通过 d、s、m 三个旋钮在参数量、速度和 PSNR 之间找平衡。', analogy:{title:'轻装跑得快',text:'减少随身负重可以跑得更快，但过度减负会损失表现。',componentId:'photo-scene'}, modules:[{kind:'module',id:'5.1',title:'查看 hourglass 层次',desc:'点选特征提取、瓶颈映射和反卷积，观察 FSRCNN 的处理阶段。',componentId:'lesson-widget'},{kind:'module',id:'5.2',title:'比较 FSRCNN 配置',desc:'切换论文中的配置，查看参数量、加速比和 Set5 ×3 PSNR。',componentId:'lesson-widget'}], insight:'论文表 1 的结构演化从 57,184 参数、1× 速度到 12,464 参数、41.3× 加速，Set5 PSNR 从 32.83 提升到 33.06 dB。', takeaways:[{icon:'⌘',title:'更小滤波器',desc:'映射层使用小核并增加层数。'},{icon:'◈',title:'参数更少',desc:'hourglass 减少瓶颈阶段开销。'},{icon:'↗',title:'FSRCNN-s',desc:'32,5,1 配置达到 24.7 fps。'}] },
    { kind:'chapter', id:'chap-6', title:'结果是否真的达到实时', badge:'both', badgeLabel:'结果 · 边界', bridge:'最后在同一数据集和倍率下比较 PSNR 与测试时间，检查加速是否牺牲质量。', analogy:{title:'同一跑道比速度',text:'只有在相同跑道和规则下计时，速度与成绩才有可比性。',componentId:'photo-scene'}, modules:[{kind:'module',id:'6.1',title:'PSNR 与测试时间对照',desc:'选择数据集，比较固定三倍放大条件下 SRCNN-Ex、FSRCNN-s 和 FSRCNN 的 PSNR 与时间。',componentId:'lesson-widget'}], insight:'论文报告 FSRCNN 在 ×3 上比 SRCNN-Ex 快至少 40 倍；FSRCNN-s 在几乎所有测试图上超过 24 fps，但 ×4 的 PSNR 略低于 SCN。', takeaways:[{icon:'≋',title:'协议一致',desc:'结果来自 Set5、Set14、BSD200 和指定倍率。'},{icon:'▥',title:'质量保留',desc:'×2、×3 上 FSRCNN 的 PSNR 更有优势。'},{icon:'◉',title:'边界清楚',desc:'速度依赖 CPU、图像尺寸和具体配置。'}] }
  ]
};
