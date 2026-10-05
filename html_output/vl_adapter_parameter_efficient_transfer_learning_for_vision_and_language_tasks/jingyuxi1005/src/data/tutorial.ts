import type { TutorialData } from '../types';

const a = (title: string, text: string) => ({ title, text, componentId: 'vl-widget' });
const t = (x: [string, string, string], y: [string, string, string], z: [string, string, string]) => [
  { icon: x[0], title: x[1], desc: x[2] }, { icon: y[0], title: y[1], desc: y[2] }, { icon: z[0], title: z[1], desc: z[2] },
];

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'VL-Adapter: Parameter-Efficient Transfer Learning for Vision-and-Language Tasks',
    titleZh: 'VL-Adapter：视觉语言模型的参数高效适配', venue: 'CVPR 2022',
    authors: 'Yi-Lin Sung · Jaemin Cho · Mohit Bansal', affiliation: 'UNC Chapel Hill',
    domain: 'Vision-and-Language / PEFT',
    coreProblem: '如何以少量可训练参数适配图文与视频文本任务？',
    coreInsight: '冻结视觉编码器与语言主干，在语言侧加入小型 Adapter，并训练视觉投影层与 LayerNorm；多任务还能共享一套 Adapter。<small>Yi-Lin Sung · Jaemin Cho · Mohit Bansal ｜ <a href="https://openaccess.thecvf.com/content/CVPR2022/html/Sung_VL-Adapter_Parameter-Efficient_Transfer_Learning_for_Vision-and-Language_Tasks_CVPR_2022_paper.html" target="_blank" rel="noreferrer">CVPR Official Paper</a> · <a href="https://arxiv.org/abs/2112.06825" target="_blank" rel="noreferrer">arXiv</a> · <a href="https://openaccess.thecvf.com/content/CVPR2022/supplemental/Sung_VL-Adapter_Parameter-Efficient_Transfer_CVPR_2022_supplemental.pdf" target="_blank" rel="noreferrer">Supplementary</a> · <a href="https://github.com/ylsung/VL_adapter" target="_blank" rel="noreferrer">Official Code</a></small>',
    keywords: ['视觉 + 语言', 'Adapter', '多任务共享'],
  },
  hero: {
    oldMethod: { desc: '本文 Full FT 基线用同一模型联合训练多个任务，更新语言侧主干；CLIP 仍冻结。', componentId: 'vl-widget' },
    newMethod: { desc: '冻结主干，训练视觉投影、LayerNorm 与语言侧 Adapter。', componentId: 'vl-widget' },
  },
  chapters: [
    { kind: 'chapter', id: 'chap-1', title: '为什么视觉语言模型也需要 PEFT？', badge: 'inf', badgeLabel: 'Problem',
      bridge: '图像或视频特征要与语言模型协作。一般情况下，若每个任务独立微调并保存完整模型，成本会随任务增加；即使共享模型，全量更新的训练成本仍高。本文的 Full FT 基线采用同一模型的多任务联合训练，而不是每任务一份完整副本。（主 §1、§3.1 Eq. 2；补 §F）',
      analogy: a('课程笔记的直觉', '多门课共用一本厚教材。如果每门课都重印整本书，成本很高；少量可替换批注更轻。'),
      modules: [{ kind:'module', id:'1.1', title:'独立适配时，任务数怎样影响存储？', desc:'调节任务数，比较“每任务独立完整副本”与“共享骨干 + 任务小模块”。<b>教学示例</b>：这是通用 PEFT 成本动机，不是本文多任务 Full FT 基线，也不表示实测 GB。', componentId:'vl-widget' }],
      insight: '多模态适配还要选择视觉侧是否更新，以及任务间能否共享参数。',
      takeaways: t(['🎯','问题','让 V&L 任务少量参数适配。'],['🧩','成本','每任务完整副本会放大存储负担。'],['🔎','范围','本文检验特定模型和任务。']) },
    { kind: 'chapter', id: 'chap-2', title: '图像怎样进入语言模型？', badge: 'inf', badgeLabel: 'V&L',
      bridge: 'CLIP 提取视觉特征，视觉投影把特征映射到语言模型维度，BART/T5 处理视觉与文本并生成答案。（主 §3.1、§4）',
      analogy: a('把看图要点写进同一页笔记', '图片中的信息先转成可供语言模型接收的表示，再与文字问题一起处理。'),
      modules: [{ kind:'module', id:'2.1', title:'切换图文与视频文本输入', desc:'图文主实验用 CLIP-ResNet101 特征；视频实验用 CLIP ViT-B/32 帧特征并加入字幕。本文主实验模型是 CLIP-BART。（主 §4）', componentId:'vl-widget' }],
      insight: 'VL-BART/VL-T5 是既有统一文本生成框架；CLIP-T5 是本文扩展，CLIP-ViL 是另验的判别式架构。',
      takeaways: t(['👁️','视觉侧','CLIP 提取视觉表征。'],['🔗','投影','视觉特征映射到语言侧维度。'],['📝','生成','主实验统一为文本输出。']) },
    { kind: 'chapter', id: 'chap-3', title: 'Adapter 到底是什么？', badge: 'both', badgeLabel: 'Adapter',
      bridge: 'Adapter 是放在原有子层后的轻量残差模块：降维、GELU、升维，然后加回原输入。（主 §3.2、Eq. 3）',
      analogy: a('只改批注，不重写教材', '原有内容保持；一张小批注页针对当前任务加修正，残差让原输入仍能通行。'),
      modules: [
        { kind:'module', id:'3.1', title:'沿主路与残差旁路理解 Adapter', desc:'点击结构中的节点，观察 dᵢ → d → dᵢ。旁路把原输入 x 直接送到加法处。<b>教学示意图，根据论文方法整理</b>。', componentId:'vl-widget' },
        { kind:'module', id:'3.2', title:'瓶颈更窄，少训练多少参数？', desc:'调整瓶颈维度 d，实时计算两块权重矩阵的参数量。<b>教学计算示例</b>；不包含 bias、LayerNorm、视觉投影或其他层，不能推算整模型的 4.18%。', componentId:'vl-widget' }
      ],
      formula: { lead: '主论文 Eq. 3：小模块学到的修正与原输入相加。', unicode: 'h = fθᵁ(σ(fθᴰ(x))) + x', symbols: [
        {sym:'x',desc:'原输入和残差支路。'},{sym:'θᴰ',desc:'降维权重：dᵢ → d。'},{sym:'θᵁ',desc:'升维权重：d → dᵢ。'},{sym:'σ',desc:'本文采用 GELU。'}] },
      takeaways: t(['⬇️','瓶颈','小维度限制新增参数量。'],['↪️','残差','在原输入之上学习修正。'],['📐','区别','这不是 LoRA 的低秩更新式。']) },
    { kind: 'chapter', id: 'chap-4', title: 'Adapter 插在 V&L 模型的哪里？', badge: 'trn', badgeLabel: 'V&L Adaptation',
      bridge: 'Adapter 插在语言模型的 attention 和 feed-forward 子层之后；解码器还有 cross-attention。本文没有在 CLIP 里插 Adapter。（主 Fig. 2、§3.2）',
      analogy: a('把批注放在语言处理的段落旁', '视觉读图工具保持原样，针对任务的批注放在语言处理的关键位置。'),
      modules: [
        { kind:'module', id:'4.1', title:'选择子层，查看插入位置', desc:'点击 Self-attention、Cross-attention 或 Feed-forward，观察对应 Adapter 位置。<b>教学示意图，根据论文 Fig. 2 整理</b>；原图可在封面链接的正式论文中核对。', componentId:'vl-widget' },
        { kind:'module', id:'4.2', title:'哪些模块冻结，哪些训练？', desc:'切换突出显示：Adapter、视觉投影和语言侧 LayerNorm 可训练；CLIP、其余语言主干权重及绑权输出层冻结。<b>教学示意图，根据论文方法整理</b>。（主 Fig. 2、§3.2）', componentId:'vl-widget' }],
      insight: '参数统计排除冻结的视觉编码器（补 §B）。100% 是排除该编码器后的 Full FT 参照；PEFT 比例包括 Adapter、视觉投影和 LayerNorm，不是仅 Adapter 占比。',
      takeaways: t(['🧊','冻结','CLIP 与语言主干（LayerNorm 除外）。'],['🟢','更新','视觉投影、LayerNorm、Adapter。'],['📎','依据','原论文 Fig. 2 可核对插入位置。']) },
    { kind: 'chapter', id: 'chap-5', title: '多个任务如何共享 Adapter？', badge: 'trn', badgeLabel: 'Multi-task Sharing',
      bridge: '论文比较每任务一套、部分共享、所有任务共用一套。这里共享的是不同任务在同一插入位置使用的权重，不是让模型所有层共用一个 Adapter。共享减少独立权重组数。（主 Fig. 3、§3.2）',
      analogy: a('四门课共用批注模板', '可每门课各写一套、共用一半格式，或四门课共用同一套模板；实际效果要看实验。'),
      modules: [
        { kind:'module', id:'5.1', title:'切换 Multiple / Half-shared / Single', desc:'Half-shared 主实验共享升维层，降维层任务专用；Single 所有任务共用一套。<b>教学示意图，根据论文 Fig. 3 整理</b>；原图可在封面链接的正式论文中核对。', componentId:'vl-widget' },
        { kind:'module', id:'5.2', title:'固定任务词 ≠ 可训练 Prompt', desc:'输入前的 vqa: 等固定词用于区分任务；Prompt-tuning 基线学习连续提示向量。（主 §3.1、§5.1；补 §F）', componentId:'vl-widget' }],
      insight: '主 Table 1：Multiple / Half-shared / Single 为 12.22% / 8.36% / 4.18%，Avg. 为 75.9 / 75.9 / 77.4。比例排除冻结视觉编码器，含视觉投影与 LN；只对应该 CLIP-BART 图文多任务设置。',
      takeaways: t(['🧍','Multiple','每任务独立 Adapter。'],['🧩','Half-shared','主实验共享升维层。'],['🤝','Single','所有任务共用一套。']) },
    { kind: 'chapter', id: 'chap-6', title: '它和其他 PEFT 方法有何不同？', badge: 'both', badgeLabel: 'Methods',
      bridge: '论文比较 Full fine-tuning、Adapter、Hyperformer、Compacter、Prompt-tuning 与 LoRA。先辨认各方法改变了什么，再看具体实验。（主 §3.2、§5.1）',
      analogy: a('同一本教材的不同改法', '整本重写、加批注、自动生成批注、压缩批注、在开头加入可训练提示，都是不同的适配选择。'),
      modules: [{ kind:'module', id:'6.1', title:'选择方法，查看更新对象', desc:'LoRA 学习低秩权重增量；Adapter 增加瓶颈模块。VL-Adapter 把 LoRA 作为实验基线，<b>并非 LoRA 的直接技术后继</b>。', componentId:'vl-widget' }],
      takeaways: t(['⚙️','Adapter','新增瓶颈残差模块。'],['📉','LoRA','低秩权重更新。'],['🧪','比较','必须结合任务和配置。']) },
    { kind: 'chapter', id: 'chap-7', title: '论文用什么任务检验？', badge: 'inf', badgeLabel: 'Experiments',
      bridge: '图文和视频文本分开验证。问答、推理用 Accuracy；描述用 CIDEr。论文 Avg. 混合两类指标，不能称为“平均准确率”。（主 §4、Table 1、4）',
      analogy: a('不同课程用不同评分尺', '问答看答对比例，描述看生成文本质量；汇总成绩不能把两种尺子都叫准确率。'),
      modules: [{ kind:'module', id:'7.1', title:'切换图文 / 视频文本任务组', desc:'图文：VQAv2、GQA、NLVR²、MSCOCO；视频文本：TVQA、How2QA、TVC、YC2C。点击任务查看类型与指标。', componentId:'vl-widget' }],
      insight: '主表是 CLIP-BART；CLIP-T5 和 CLIP-ViL 是不同设置的扩展验证。',
      takeaways: t(['🖼️','图文','问答、视觉推理、图像描述。'],['🎬','视频','视频问答与描述。'],['📏','指标','Accuracy 和 CIDEr 须分清。']) },
    { kind: 'chapter', id: 'chap-8', title: '少量参数是否够用？', badge: 'both', badgeLabel: 'Results',
      bridge: '主 Table 1、4 比较同一 CLIP-BART 多任务设置下的 Full FT 与 Single Adapter。两组主结果没有额外进行该统一框架的联合 V&L 预训练；CLIP 和 BART 自身的预训练仍然存在。主 Table 6 另行检验先联合预训练再适配的情况。（主 §5.3）',
      analogy: a('薄批注能完成测验吗？', '看共用教材加小批注能否接近重写整本书的效果，同时逐科检查得失。'),
      modules: [
        { kind:'module', id:'8.1', title:'选择任务组与预训练条件', desc:'先选图文或视频文本，再看对应 Full FT / Single Adapter。图文可另选 Table 6 的联合 V&L 预训练结果；每次只比较同一任务组和初始化条件。', componentId:'vl-widget' },
        { kind:'module', id:'8.2', title:'查看单任务的得与失', desc:'图文 VQA Accuracy 67.6 → 65.9、NLVR² Accuracy 73.0 → 74.2；视频 YC2C CIDEr 154.0 → 152.9。不能说所有任务都提升。', componentId:'vl-widget' }],
      insight: '主 Table 1（以及补 Table 6）写 4.18%；补 Table 1 的对应图文 d=96 配置写 4.36%，差异原因未确认。本页主结果按 CVPR 正式版 Table 1，不猜原因。77.6/77.4 按 Table 1 认作 Avg.，不沿用 Fig. 1 的 VQA Accuracy 标签。',
      takeaways: t(['📊','图文','4.18% 是四个图文任务的 Single Adapter 配置。'],['🎥','视频','3.39% 是四个视频文本任务的对应配置。'],['⚖️','Avg.','混合 Accuracy 与 CIDEr，不是平均准确率。']) },
    { kind: 'chapter', id: 'chap-9', title: '消融：究竟什么起作用？', badge: 'both', badgeLabel: 'Ablation',
      bridge: '比较共享程度和可训练模块的加入顺序，才能知道主结果由哪些设计支撑。（主 Table 1、5）',
      analogy: a('把批注逐项加回', '先只转换笔记格式，再调整排版，最后加任务批注；每一步变化帮助定位作用。'),
      modules: [{ kind:'module', id:'9.1', title:'切换共享与模块消融', desc:'共享：Multiple / Half-shared / Single 的 Avg. 为 75.9 / 75.9 / 77.4。模块：仅视觉投影 / 加 LayerNorm / 加 Adapter 的 Avg. 为 47.1 / 62.9 / 77.4。选择对照看它验证的问题。', componentId:'vl-widget' }],
      insight: '另一个单独 VQA 实验中，训练 CLIP+BART 为 65.6，冻结 CLIP 只训 BART 为 64.7（主 Table 3）；它与主多任务设置不同。',
      takeaways: t(['🤝','共享','本文设置中 Single 更省参数。'],['🔬','模块','Adapter 在投影与 LN 之上带来明显增量。'],['⚠️','条件','消融结论受任务与超参数限制。']) },
    { kind: 'chapter', id: 'chap-10', title: '边界与五篇研究路线', badge: 'both', badgeLabel: 'Research Path',
      bridge: '先区分作者明确写出的限制，与本项目根据实验范围总结的边界，再把本篇放回研究问题演进路线。',
      analogy: a('共用模板还不是私人助手', '共用批注可帮助多门课，但仍不知道某位同学的照片、习惯和长期目标。'),
      modules: [
        { kind:'module', id:'10.0', title:'哪些是作者限制，哪些是项目归纳？', desc:'边界说明用于约束结论，不能把未做的实验写成已证明的能力。', componentId:'vl-widget' },
        { kind:'module', id:'10.1', title:'点击五篇路线中的节点', desc:'LoRA → VL-Adapter → MyVLM → Yo’LLaVA → PersonaVLM 表示<b>本项目组织的研究问题演进</b>，不代表未经核实的直接技术继承。下一篇才开始用户特有视觉概念。', componentId:'vl-widget' }
      ],
      insight: 'LoRA 是低秩权重更新；VL-Adapter 检验 Adapter-based PEFT 在视觉语言多任务中的使用。',
      takeaways: t(['✅','已验证','论文设置中的图文与视频文本适配。'],['🚧','未验证','现代大规模 MLLM 的全面适用性、用户级长期个性化。'],['➡️','过渡','从通用 PEFT 走向视觉语言 PEFT。']) },
  ],
};
