import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: { titleEn: 'Learning Transferable Visual Models From Natural Language Supervision', titleZh: 'CLIP：从自然语言监督学习可迁移视觉模型', venue: 'arXiv:2103.00020, 2021', authors: 'Alec Radford 等', affiliation: 'OpenAI', domain: '视觉语言预训练', coreProblem: '固定类别监督让视觉模型难以用自然语言扩展到新概念。', coreInsight: '用海量图文配对训练双编码器；把配对检索能力直接改写为零样本分类器。', keywords: ['CLIP','图文对比学习','零样本迁移','Prompt'] },
  hero: { oldMethod: { title: '固定类别分类', desc: '输出空间在训练前被写死，新概念需要标注数据和重新训练。', componentId: 'clipCover' }, newMethod: { title: 'CLIP 图文对比预训练', desc: '学习图像与文本的共同空间，用文字即时指定目标概念。', componentId: 'clipCover' } },
  chapters: [
    { kind: 'chapter', id: 'chap-problem', title: '为什么要让文字参与视觉学习？', modules: [{kind:'module',id:'1.1',title:'Batch 内配对',desc:'比较全部图文组合并突出真实配对。',componentId:'pairingMatrix'}], scenes: [
      {id:'pairing',title:'N×N 图文相似度矩阵',goal:'理解 CLIP 不只看正样本，而是在一个 batch 中比较所有候选配对。',summary:'真实图文对位于矩阵对角线。',interaction:'点击任意图像行，观察它的正确文本目标。',next:'相似度如何由两个编码器产生？',notes:'来源：论文 §2.3，Figure 3。N 个真实对产生 N² 个候选配对；此页数值是教学合成示例。',componentId:'pairingMatrix',moduleId:'1.1'},
      {id:'encoders',title:'两个编码器，进入同一个嵌入空间',goal:'理解图像和文字先独立编码，再用余弦相似度比较。',summary:'图像编码器可为 ResNet 或 ViT；文本编码器为 Transformer。',interaction:'切换候选文本，观察共享空间中的相似度变化。',next:'相似度怎样变成可训练的目标？',notes:'来源：论文 §2.3–2.4。页面向量与分数仅用于说明，非模型实际输出。',componentId:'dualEncoder',moduleId:'1.1'} ] },
    { kind: 'chapter', id: 'chap-objective', title: 'CLIP 如何把配对变成训练信号？', modules: [{kind:'module',id:'2.1',title:'双向交叉熵',desc:'从图找文与从文找图共享同一矩阵。',componentId:'symmetricLoss'}], scenes: [
      {id:'loss',title:'双向交叉熵：两种检索方向同时对齐',goal:'看到温度如何影响 Softmax，及为何需要图→文、文→图两个方向。',summary:'对同一相似度矩阵分别按行与按列计算交叉熵。',interaction:'调节温度 τ，观察正确候选的概率与教学损失。',next:'训练完成后，怎样不训练新分类头就完成分类？',notes:'来源：论文 §2.3，Figure 3。实际 τ 为训练中学习的缩放参数；此页为三类简化计算。',componentId:'symmetricLoss',moduleId:'2.1'} ] },
    { kind: 'chapter', id: 'chap-transfer', title: '自然语言怎样成为零样本分类器？', modules: [{kind:'module',id:'3.1',title:'零样本 Prompt',desc:'类名经文本编码器生成分类器权重。',componentId:'promptClassifier'},{kind:'module',id:'3.2',title:'模板集成',desc:'多个提示模板可降低单一措辞的偏差。',componentId:'promptEnsemble'}], scenes: [
      {id:'zeroshot',title:'用候选文本临时“写出”分类器',goal:'把类别名放入 prompt，复用图文匹配能力完成分类。',summary:'最大相似度的候选文本给出预测类别。',interaction:'切换图片和文本模板，观察候选文本的相对得分。',next:'为什么 prompt 的措辞会改变表现？',notes:'来源：论文 §3.1.2。分数为教学合成示例；真实流程对类别文本编码、计算余弦相似度并 Softmax。',componentId:'promptClassifier',moduleId:'3.1'},
      {id:'prompts',title:'Prompt engineering：措辞也是分类器的一部分',goal:'理解文本模板改变了文本特征，从而可能影响零样本结果。',summary:'将多个模板的文本嵌入集成，是论文使用的改进策略之一。',interaction:'调节模板数量，查看合成置信度示意。',next:'这项能力在哪些证据中得到检验？',notes:'来源：论文 §3.1.4。环图是教学示意，不代表任何论文报告的准确率。',componentId:'promptEnsemble',moduleId:'3.2'} ] },
    { kind: 'chapter', id: 'chap-evidence', title: '证据与边界：迁移能力不等于通用视觉智能', modules: [], scenes: [
      {id:'evidence',title:'ImageNet 零样本：匹配原始 ResNet-50',goal:'区分论文的具体比较条件与过度泛化的结论。',summary:'CLIP 不用 ImageNet 的训练样本，也能匹配原始 ResNet-50 的准确率。',interaction:'阅读同一条件下的比较条与实验限制。',next:'哪些任务仍是 CLIP 的边界？',notes:'来源：论文摘要、§3。论文称其在超过 30 个视觉数据集上评估；此图避免把“匹配”误读成处处领先。',componentId:'evidenceScene'},
      {id:'limits',title:'局限性与社会影响需要和能力一起阅读',goal:'认识细粒度、分布外泛化与社会风险并未被大规模预训练自动解决。',summary:'选择一个边界，阅读它为何影响部署判断。',interaction:'切换限制类型，查看论文讨论的不同边界。',next:'回到问题：CLIP 将图文检索式训练转化为可用自然语言调用的视觉表示。',notes:'来源：论文 §6–7。这里概括作者讨论；不把模型能力延伸到论文未证实的结论。',componentId:'limitsScene'} ] }
  ]
};
