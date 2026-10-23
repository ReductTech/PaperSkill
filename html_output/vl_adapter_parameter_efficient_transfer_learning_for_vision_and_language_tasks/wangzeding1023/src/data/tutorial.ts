import type { TutorialData } from '../types';

const componentId = 'vl-adapter-lab';
const take = (a: string, b: string, c: string) => [
  { icon: '1', title: a.split('：')[0] ?? '', desc: a.split('：')[1] ?? '' },
  { icon: '2', title: b.split('：')[0] ?? '', desc: b.split('：')[1] ?? '' },
  { icon: '3', title: c.split('：')[0] ?? '', desc: c.split('：')[1] ?? '' }
];

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'VL-Adapter: Parameter-Efficient Transfer Learning for Vision-and-Language Tasks',
    titleZh: 'VL-Adapter：视觉与语言任务的参数高效迁移学习',
    venue: 'CVPR 2022 · arXiv:2112.06825v2',
    authors: 'Yi-Lin Sung · Jaemin Cho · Mohit Bansal',
    affiliation: 'UNC Chapel Hill',
    domain: '视觉语言模型 · 参数高效迁移 · 多任务学习',
    coreProblem: '视觉语言模型同时包含视觉编码器与语言模型；面对多种问答、推理和描述任务时，为每个任务完整微调会产生高昂的训练与存储成本。',
    coreInsight: '冻结 CLIP 与大部分语言模型权重，在语言层中插入瓶颈 Adapter，并让多个任务共享同一套 Adapter，可以用很少的更新参数学习跨任务共性。',
    keywords: ['多任务共享', '瓶颈 Adapter', '统一文本生成']
  },
  hero: {
    oldMethod: { desc: '每项拍摄任务都复制并重新调校整套相机系统，任务越多，成本越高。', componentId },
    newMethod: { desc: '保留同一台相机机身，只训练轻量滤镜，并让相关任务共享调节经验。', componentId }
  },
  chapters: [
    { kind:'chapter', id:'chap-1', title:'视觉语言微调为何昂贵', badge:'trn', badgeLabel:'问题', bridge:'先把模型规模换成可见的任务副本，理解参数高效迁移要解决的实际成本。', analogy:{title:'每次拍摄都搬一套器材',text:'相机机身已有通用能力；若每种任务都复制整套器材，新增任务会持续放大存储负担。',componentId}, modules:[{kind:'module',id:'1.1',title:'任务数量怎样推高更新成本',desc:'拖动任务数量，比较完整微调与共享 Adapter 的增长方式。',componentId},{kind:'module',id:'1.2',title:'把训练方法放到同一把尺上',desc:'切换完整微调、独立 Adapter 与共享 Adapter，观察任务副本的组织方式。',componentId}], insight:'真正需要复制的不是基础能力，而是每个任务相对基础模型的那一小部分适配。', takeaways:take('任务累积：完整微调为每项任务维护大规模更新。','多模态更重：视觉与语言模型同时占用资源。','目标共享：保留主干，只训练轻量增量。') },
    { kind:'chapter', id:'chap-2', title:'把不同任务统一成文本生成', badge:'both', badgeLabel:'框架', bridge:'要共享参数，首先让问答、推理与描述使用同一种输入输出接口。', analogy:{title:'统一取景与出片格式',text:'不同拍摄需求都经过同一台相机，最终形成可比较的照片；任务差异由提示与目标文本表达。',componentId}, modules:[{kind:'module',id:'2.1',title:'沿统一生成路径前进',desc:'逐步推进图像、文本、视觉投影、编码器与解码器。',componentId}], insight:'统一成文本生成后，不同数据集可以组成一个多任务集合，共用同一架构和训练目标。', formula:{lead:'模型最小化目标文本在统一数据集上的平均交叉熵：',unicode:'L(D) = (1/|D|) Σ CE(f(xᴵ, xˢ), y)',symbols:[{sym:'D',desc:'多个视觉语言数据集合并的训练集'},{sym:'xᴵ',desc:'图像或视频输入'},{sym:'xˢ',desc:'问题、字幕或任务提示'},{sym:'y',desc:'目标答案或描述文本'}]}, takeaways:take('双模态输入：视觉特征与文本嵌入共同进入模型。','统一输出：不同任务都转化为文本生成。','便于共享：统一接口支撑跨任务 Adapter。') },
    { kind:'chapter', id:'chap-3', title:'瓶颈 Adapter 如何工作', badge:'both', badgeLabel:'方法', bridge:'统一架构仍然很大，下一步是在注意力层和前馈层后加入小型可训练支路。', analogy:{title:'给镜头装一片小滤镜',text:'机身保持不动，小滤镜先压缩特征，再恢复到原尺寸，并保留原始光路。',componentId}, modules:[{kind:'module',id:'3.1',title:'走过降维、激活与升维',desc:'点击下一步，让特征依次通过瓶颈并与残差相加。',componentId}], insight:'Adapter 只在低维瓶颈中学习任务变化，残差连接让原表示可以直接保留。', formula:{lead:'一个 Adapter 的核心计算是：',unicode:'h = fᵁ(σ(fᴰ(x))) + x',symbols:[{sym:'fᴰ',desc:'从 dᵢ 降到 d 的线性层'},{sym:'σ',desc:'论文采用 GELU 激活函数'},{sym:'fᵁ',desc:'从 d 升回 dᵢ 的线性层'},{sym:'x',desc:'残差路径保留的输入'}]}, takeaways:take('两层瓶颈：降维与升维控制参数规模。','残差保底：原始表示可直接保留。','语言侧插入：模块位于注意力与前馈层之后。') },
    { kind:'chapter', id:'chap-4', title:'瓶颈大小决定什么', badge:'trn', badgeLabel:'容量', bridge:'瓶颈维度 d 越大，可训练容量越高，但参数效率也随之下降。', analogy:{title:'调节滤镜口径',text:'过窄会限制可调信息；增大口径能容纳更多变化，也会增加器材重量。',componentId}, modules:[{kind:'module',id:'4.1',title:'在容量与参数之间调节',desc:'选择附录中的 Single Adapter 配置，比较瓶颈维度、更新参数与四任务平均分。',componentId}], insight:'参数效率不是单纯追求最小模块，而是在目标性能附近寻找足够小的瓶颈。', takeaways:take('容量可控：d 直接控制中间宽度。','收益非线性：参数增加不保证分数等比增长。','协议固定：比较必须使用同一模型与任务设置。') },
    { kind:'chapter', id:'chap-5', title:'为什么共享一套 Adapter', badge:'both', badgeLabel:'共享', bridge:'多任务既有差异，也共享视觉理解与语言生成能力；论文把共享程度作为核心变量。', analogy:{title:'多种拍摄共用一片滤镜',text:'每项任务不再独占滤镜，同一片滤镜从多种场景中学习通用调节。',componentId}, modules:[{kind:'module',id:'5.1',title:'切换三种共享策略',desc:'比较多套、半共享与单套 Adapter；结果来自 CLIP-BART 图文多任务实验。',componentId}], insight:'Single Adapter 同时减少参数并学习跨任务信息，在论文设置中形成最佳折中。', takeaways:take('多套独立：容量足，但无法交换信息。','半共享：只共享降维或升维权重。','单套共享：所有任务共同训练同一组模块。') },
    { kind:'chapter', id:'chap-6', title:'为什么冻结视觉编码器', badge:'trn', badgeLabel:'消融', bridge:'Adapter 应该加入视觉端还是语言端，不能只凭结构对称性决定。', analogy:{title:'锁住成熟的相机机身',text:'机身已有稳定视觉能力，先锁住它，只调节语言侧滤镜与连接部件。',componentId}, modules:[{kind:'module',id:'6.1',title:'组合冻结与微调',desc:'点击四种 CLIP/BART 组合，查看论文表 5 的 VQA 准确率。',componentId}], insight:'微调 CLIP 只带来约 1 个百分点提升，而冻结 BART 会造成显著性能下降。', takeaways:take('语言侧关键：更新 BART 对下游性能至关重要。','视觉收益小：微调 CLIP 的边际提升有限。','位置明确：论文只在语言模型中插入 Adapter。') },
    { kind:'chapter', id:'chap-7', title:'哪些参数必须一起训练', badge:'trn', badgeLabel:'组件', bridge:'只训练视觉投影层是否足够？论文逐项加入 LayerNorm 与 Adapter 来回答。', analogy:{title:'逐项校准拍摄配件',text:'只校准转接环无法完成复杂拍摄；加入机身校准与滤镜后，成片质量明显提高。',componentId}, modules:[{kind:'module',id:'7.1',title:'逐项打开可训练组件',desc:'依次加入视觉投影、LayerNorm 与 Adapter，观察四任务平均分变化。',componentId}], insight:'视觉投影连接模态，LayerNorm 适应新分布，而 Adapter 提供主要的任务变换容量。', takeaways:take('投影接口：把视觉表示映射到语言维度。','归一化贡献：更新 LayerNorm 明显改善结果。','Adapter 主体：加入瓶颈后平均分升至 77.4。') },
    { kind:'chapter', id:'chap-8', title:'三类 Adapter 的结构取舍', badge:'both', badgeLabel:'架构', bridge:'参数更少的结构不一定更适合视觉语言迁移，需要同时观察结构约束与性能。', analogy:{title:'点选不同滤镜结构',text:'普通滤镜直接调节；自动配方生成参数；复合滤镜用矩阵分解进一步压缩。',componentId}, modules:[{kind:'module',id:'8.1',title:'点选架构并查看活动路径',desc:'选择 Adapter、Hyperformer 或 Compacter，结构图会高亮权重来源。',componentId},{kind:'module',id:'8.2',title:'把复杂度与结果并排看',desc:'比较论文表 1 的更新参数比例与四任务平均分。',componentId}], insight:'在论文的视觉语言任务中，最简单的共享 vanilla Adapter 比复杂方案更稳定。', takeaways:take('Hyperformer：按任务和层索引生成权重。','Compacter：以 Kronecker 积和低秩分解压缩。','迁移边界：语言任务中的设计未必适合多模态。') },
    { kind:'chapter', id:'chap-9', title:'提示与预训练怎样配合', badge:'both', badgeLabel:'辅助', bridge:'共享参数可能混淆任务，任务提示和预训练分别提供任务标识与更好的初始化。', analogy:{title:'给拍摄任务贴标签',text:'标签告诉共享滤镜当前拍摄什么；预先练习则让它具备更好的跨模态基础。',componentId}, modules:[{kind:'module',id:'9.1',title:'组合提示与预训练',desc:'切换任务提示与视觉语言预训练，查看论文表 8、9 的对应结果。',componentId}], insight:'提示带来小幅增益；在视觉语言预训练权重上，Single Adapter 的平均分超过对应完整微调。', takeaways:take('提示标识：帮助共享模块区分任务。','并非必需：移除提示仍有较强表现。','初始化重要：Adapter 能利用多模态预训练。') },
    { kind:'chapter', id:'chap-10', title:'结果、迁移与边界', badge:'both', badgeLabel:'结论', bridge:'最后把图文、视频与判别式模型三组证据放到同一决策视图中。', analogy:{title:'评审多组拍摄成片',text:'同时查看成片质量与器材重量；轻量方案在对应协议下保持质量，才算真正有效。',componentId}, modules:[{kind:'module',id:'10.1',title:'启动三组结果对比',desc:'选择实验组并启动比较，查看更新参数比例、指标定义与完整微调差距。',componentId}], insight:'VL-Adapter 用跨任务共享的小模块，在多种视觉语言设置中维持接近完整微调的性能。', takeaways:take('图文任务：4.18% 更新参数，平均 77.4 对 77.6。','视频任务：3.39% 更新参数，平均同为 87.4。','适用边界：效果依赖任务相关性、预训练与模块位置。') }
  ]
};
