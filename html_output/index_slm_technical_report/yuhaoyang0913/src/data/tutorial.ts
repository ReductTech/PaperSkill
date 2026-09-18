import type { TutorialData } from '../types';

const term = (en: string, zh: string, intuition: string, role: string) =>
  `<span class="term" tabindex="0" data-tip="${zh} / ${en}｜直觉：${intuition}｜本文：${role}">${en}</span>`;

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Index SLM Technical Report', titleZh: '把 1.9B 的能力榨出来',
    venue: 'arXiv · v3 · Mechanism-driven V3', authors: 'Bilibili Index LLM Team', affiliation: 'Bilibili', domain: 'Small Language Model',
    coreProblem: '一个 1.9B 小模型，怎样通过数据、Tokenizer、架构、优化、后训练与评测，把能力一步步榨出来？',
    coreInsight: '这是一条可操作的证据链：<b>数据 → Tokenizer → 36-layer Decoder → Norm-Head → WSD × Curated Data → SFT / DPO → RAG → Evaluation</b>。每一步都区分论文事实、作者解释与仍未知的问题。<br/><a href="https://arxiv.org/abs/2607.09885v3" target="_blank" rel="noreferrer">Index SLM Technical Report ↗</a>',
    keywords: ['1.9B non-embedding params', '2.8T tokens', '36 layers', 'WSD × curated data', 'Evidence-first'],
  },
  hero: {
    oldMethod: { desc: '只看“1.9B”和最终分数，模型为什么有效仍是黑箱。', componentId: 'hero-old' },
    newMethod: { desc: '沿训练生命周期拆开控制变量，看每个设计决策改变了什么。', componentId: 'hero-new' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '四个 Index，与文本进入模型', badge: 'both', badgeLabel: '系统地图',
      bridge: `先固定研究对象。Base、Pure、Chat、Character 是一条实验谱系；${term('Tokenizer','分词器','把文本切成离散编号','决定 65,029 词表如何表示中英日韩与代码')} 则是所有版本共同的输入接口。`,
      analogy: { title: '一张纸，只保留一条边界', text: '少量保留“切词像给连续文字划边界”的直觉；核心视图直接显示模型谱系与 token 序列。', componentId: 'analogy-2' },
      modules: [
        { kind: 'module', id: '1.1', title: '模型谱系树：谁从谁而来', desc: `点击节点追踪 Base / Pure / Chat / Character。${term('Control group','对照组','保持大部分条件不变，只隔离一个因素','Pure 用于观察 instruction-like data 的影响')} 是读懂后续消融的关键；${term('Instruction Data','指令数据','具有“要求→回答”结构的训练样本','Pure/Boost 分支用它检验评测表现变化')} 是被隔离的变量。`, componentId: 'index-lineage' },
        { kind: 'module', id: '1.2', title: 'Token Playground：文本怎样成为 ID 序列', desc: `切换三种教学粒度，区分字符数、${term('Token','词元','模型一次读写的离散符号','影响压缩率、上下文占用和输出词表')} 数与${term('Vocabulary','词表','模型可直接表示的全部 token 集合','Index tokenizer 最终包含 65,029 项')}容量。论文 tokenizer 采用 ${term('BPE','Byte-Pair Encoding','逐步合并高频相邻符号','与 SentencePiece 共同构成 Index tokenizer')} 与 ${term('SentencePiece','子词切分框架','直接从原始文本学习子词单元','承载 Index 的多语言词表训练')}。`, componentId: 'index-tokens' },
        { kind: 'module', id: '1.3', title: '术语交互规则', desc: '全页关键英文术语第一次出现时可悬停、聚焦或轻触；解释固定包含“一句话直觉 + 在本文中的作用”。', componentId: 'index-glossary-primer' },
      ],
      insight: 'Pure 不是“更弱的 Chat”，而是实验控制变量；Tokenizer 也不是预处理琐事，而是小模型计算效率的入口。',
      takeaways: [
        { icon:'◫', title:'四种分工', desc:'Base 预训练；Pure 做控制；Chat 经 SFT/DPO；Character 加角色数据与 RAG。' },
        { icon:'⌁', title:'65,029 vocab', desc:'词表容量与隐藏维度是不同量；网页切词仅作机制示意。' },
        { icon:'↗', title:'压缩率', desc:'中文 piece 长度策略影响 token 序列长度，论文按语言与代码比较压缩率。' },
      ],
    },
    {
      kind:'chapter', id:'chap-2', title:'从 token 到下一个 token：36 层 Decoder', badge:'inf', badgeLabel:'架构',
      bridge:`沿一次 ${term('Autoregressive','自回归','每一步只利用已经出现的 token','Index 逐 token 生成')} 预测展开：${term('Embedding','嵌入表示','把 token ID 映射为连续向量','作为 36 层 Decoder 的输入')} → ${term('Decoder-only Transformer','仅解码器 Transformer','只使用因果注意力逐 token 建模','构成 Index-1.9B 的网络主干')} → ${term('Hidden State','隐藏状态','网络为当前位置形成的上下文向量','送入输出头产生词表分数')} → ${term('LM Head','语言模型输出头','把隐藏向量投影到整个词表','Norm-Head 修改的正是这一层')} → ${term('Logits','未归一化分数','softmax 前每个候选 token 的原始分值','决定下一 token 的相对概率')} → ${term('Softmax','归一化指数函数','把一组分数变成总和为 1 的概率','得到下一 token 分布')}。`,
      analogy:{title:'一层层叠，但不再停留在积木',text:'“层数”只用一眼建立直觉；主交互直接进入 causal mask、残差路径与固定参数量的深宽塑形。',componentId:'analogy-9'},
      modules:[
        {kind:'module',id:'2.1',title:'Causal Playground：因果遮罩逐步展开',desc:`逐步移动预测位置，看 ${term('Causal Mask','因果遮罩','当前位置看不到未来 token','保证训练与生成遵守左到右因果关系')} 怎样限制注意力。${term('Teacher Forcing','教师强制','训练时把真实历史 token 作为下一步条件','使所有位置可并行计算 next-token loss')} 与推理时使用已生成历史不同。`,componentId:'index-autoregressive'},
        {kind:'module',id:'2.2',title:'Decoder 热点图：点击结构，追踪张量路径',desc:`点击结构，追踪 ${term('RoPE','旋转位置编码','用旋转把相对位置信息写入注意力','支持 Index 的 4096 context')}、${term('RMSNorm','均方根归一化','按向量均方根稳定激活尺度','用于 Decoder 各子层前的归一化')}、${term('SwiGLU','门控前馈激活','用门控选择并变换特征','构成 FFN 5888 的非线性部分')} 与 ${term('Residual','残差连接','把子层输入直接加回输出','帮助 36 层网络传递信息和梯度')}。这里同时标出 hidden 2048、16 heads 与 context 4096。`,componentId:'index-decoder-map'},
        {kind:'module',id:'2.3',title:'模型塑形器：固定预算下，深还是宽',desc:`拖动层数，观察固定参数预算下深度与宽度的此消彼长。论文比较 36-layer deep 与 9-layer wide-shallow；这是 ${term('Controlled experiment','受控实验','只改变关键因素来比较结果','用于选择最终模型形状')}。`,componentId:'index-depth-width'},
      ],
      formula:{lead:'每一步把隐藏状态投影到整个词表，再用 softmax 得到下一 token 分布：',unicode:'p(xₜ | x₍<t₎) = softmax(Ŵhₜ)',explanation:'在已有序列 x₍<t₎ 的条件下，取第 t 处隐藏状态 hₜ，经输出头 Ŵ 投影并做 softmax，得到下一个 token xₜ 的概率。',symbols:[{sym:'p',desc:'条件概率分布；所有候选 token 的概率总和为 1'},{sym:'xₜ',desc:'第 t 个位置要预测的 token'},{sym:'x₍<t₎',desc:'位置 t 之前已经出现的全部 token'},{sym:'softmax',desc:'把词表 logits 转换为概率分布'},{sym:'Ŵ',desc:'Norm-Head 中逐行归一化后的输出头权重'},{sym:'hₜ',desc:'第 t 个位置经过 36 层 Decoder 的隐藏状态'}]},
      takeaways:[{icon:'36',title:'深层主干',desc:'最终配置采用 36 层与 2048 hidden。'},{icon:'◩',title:'标准积木',desc:'RoPE、RMSNorm、SwiGLU、Residual 构成常规主干。'},{icon:'⇄',title:'本文选择',desc:'深宽受控实验和 Norm-Head 才是设计决策重点。'}],
    },
    {
      kind:'chapter',id:'chap-3',title:'Norm-Head：让稀疏词表行不再乱跑',badge:'trn',badgeLabel:'核心创新',
      bridge:`普通 LM head 的部分词表行更新稀疏，权重尺度与 ${term('Gradient Norm','梯度范数','梯度向量的整体大小','论文观察输出头梯度问题并引入权重归一化')} 可能不稳定。Norm-Head 直接约束输出头权重。`,
      analogy:{title:'控制方向，先固定杆长',text:'保留“方向相同、长度统一”的短直觉；主画面直接操作词表行、权重范数与梯度状态。',componentId:'analogy-8'},
      modules:[{kind:'module',id:'3.1',title:'Normal Head ↔ Norm-Head：切换词频与权重尺度',desc:`同时切换 head 类型和 frequent / rare token。观察 ${term('Weight Normalization','权重归一化','把向量除以自身 L2 范数','限制每个输出词表行的尺度')} 如何保留方向并消除任意尺度。`,componentId:'index-norm-head-v2'}],
      insight:'论文把 Norm-Head 与训练稳定性、采用更高峰值学习率联系起来；它没有证明“所有梯度都被统一缩小”。',
      formula:{lead:'对 LM head 的每个词表行分别归一化：',unicode:'ŵᵢ = wᵢ / ‖wᵢ‖₂,   logitᵢ = ŵᵢᵀh',explanation:'先用第 i 个词表行自身的 L2 范数缩放 wᵢ，得到单位尺度的 ŵᵢ；再让它与隐藏状态 h 做内积，产生该词的 logit。',symbols:[{sym:'ŵᵢ',desc:'归一化后的第 i 个输出头权重行'},{sym:'wᵢ',desc:'词表第 i 项原始输出头权重向量'},{sym:'‖wᵢ‖₂',desc:'wᵢ 的 L2 范数；它是这里用于缩放的尺度'},{sym:'logitᵢ',desc:'词表第 i 项进入 softmax 前的分数'},{sym:'ᵀ',desc:'转置标记；这里表示与隐藏状态进行向量内积'},{sym:'h',desc:'Decoder 输出的隐藏状态'}]},
      takeaways:[{icon:'‖w‖',title:'约束尺度',desc:'归一化发生在 LM head 权重行。'},{icon:'rare',title:'稀有词行',desc:'更新稀疏是作者解释稳定性问题的关键。'},{icon:'η↑',title:'连接大学习率',desc:'最终峰值 5×10⁻⁴ 与稳定性设计一起理解。'}],
    },
    {
      kind:'chapter',id:'chap-4',title:'训练信号与数据净化：一次更新到底发生什么',badge:'trn',badgeLabel:'优化',
      bridge:`先从目标 token 的概率得到 ${term('Cross-Entropy','交叉熵','正确答案概率越低，惩罚越大','形成预训练与 SFT 的 token-level loss')}，再经 ${term('Backpropagation','反向传播','从 loss 反向计算每个参数的梯度','把预测误差传回 Index 的全部层')}、${term('AdamW','解耦权重衰减的自适应优化器','按历史梯度调节各参数步幅','执行论文的实际参数更新')}、${term('Weight Decay','权重衰减','在优化时持续抑制过大的参数','作为 AdamW 的正则项')} 与 ${term('Gradient Clipping','梯度裁剪','超过阈值时缩放整体梯度','避免单步更新过大')} 更新参数；干净数据决定这些更新在学什么。`,
      analogy:{title:'只保留一次纠偏动作',text:'概率像水位的短类比只作为入口；主视图同步显示 p、−log p、PPL 和一次参数更新。',componentId:'analogy-4'},
      modules:[
        {kind:'module',id:'4.1',title:'Loss Lab：概率、CE、PPL 与一次更新',desc:`拖动目标概率并执行一次更新。${term('Perplexity','困惑度','交叉熵指数化后的不确定性尺度','帮助解释语言建模损失')} 与 CE 同向变化；示例不冒充论文训练曲线。`,componentId:'index-optimizer-step'},
        {kind:'module',id:'4.2',title:'Data Purification：让语料通过每一道筛选',desc:`依次操作 ${term('Heuristic Filtering','启发式过滤','用人工规则快速排除明显低质文本','清理乱码、极短页等确定性噪声')}、${term('Classifier Filtering','分类器过滤','由质量模型判断更复杂的文本','以保守阈值减少误删高质量内容')}、${term('MinHash','最小哈希','用签名近似找相似文档','执行 document-level deduplication')} 与 ${term('Exact Substring Deduplication','精确子串去重','寻找跨文档反复出现的完全相同片段','移除 MinHash 难以发现的模板文本')}。`,componentId:'index-data-pipeline'},
      ],
      formula:{lead:'目标 token 的负对数似然：',unicode:'Lₜ = −log pθ(xₜ | x₍<t₎),   PPL = exp(mean(Lₜ))',explanation:'模型给正确 token 的概率越小，−log 惩罚越大；把所有 token 的损失取平均并指数化，就得到更易比较的困惑度 PPL。',symbols:[{sym:'Lₜ',desc:'第 t 个目标 token 的负对数似然损失'},{sym:'log',desc:'自然对数；前面的负号把高概率变成低损失'},{sym:'pθ',desc:'参数为 θ 的模型给出的条件概率'},{sym:'xₜ',desc:'当前位置的正确目标 token'},{sym:'x₍<t₎',desc:'当前位置之前的真实上下文 token'},{sym:'PPL',desc:'困惑度；平均 token 损失指数化，通常越低越好'},{sym:'exp',desc:'指数函数，是自然对数的反函数'},{sym:'mean',desc:'对序列中的 token 损失取平均'}]},
      takeaways:[{icon:'−log',title:'概率变损失',desc:'正确 token 概率越高，NLL 越低。'},{icon:'∇',title:'梯度变更新',desc:'Backprop 给出方向，AdamW 与裁剪决定步幅。'},{icon:'◇',title:'数据先净化',desc:'过滤与两级去重降低重复和低质信号。'}],
    },
    {
      kind:'chapter',id:'chap-5',title:'WSD × Curated Data：关键不是调度单独换皮',badge:'trn',badgeLabel:'核心实验',
      bridge:`${term('WSD','Warmup–Stable–Decay','先预热、长期稳定、最后衰减','把长训练与末段精选数据集中联系起来')} 需要和${term('Learning Rate','学习率','控制每次参数更新的基础步幅','论文比较 2e−4 与 5e−4，并最终采用较高峰值')}及数据策略放在同一时间轴上，${term('Factorial Experiment','因子实验','独立组合多个变量以观察主效应和交互','WSD 与 Curated Data 构成 2×2 四格')} 才说明组合效应。`,
      analogy:{title:'同一条长跑轨迹，最后改变节奏',text:'类比被压成一句；主要学习发生在真实学习率曲线、数据质量轨和 2×2 factorial experiment 上。',componentId:'analogy-3'},
      modules:[{kind:'module',id:'5.1',title:'双轨时间轴 + 2×2 因子实验',desc:`切换 Warmup / Stable / Decay、峰值学习率和四个实验格。${term('Curated Data','精选数据','更高质量、经筛选的数据子集','在 WSD 末段提高采样集中度')} 与调度的交互才是重点。`,componentId:'index-wsd-data-lab'}],
      insight:'Cosine 35.63 与 WSD 35.75 几乎持平；Cosine+精选降至 34.65；WSD+精选达到 38.10。页面不把 WSD 单独写成“魔法”。',
      takeaways:[{icon:'W',title:'三阶段',desc:'Warmup → Stable → Decay；最终衰减 400B tokens。'},{icon:'2×2',title:'看交互作用',desc:'单因素结果不能解释 WSD × 数据组合。'},{icon:'38.10',title:'条件性结论',desc:'最好结果限于论文该受控实验。'}],
    },
    {
      kind:'chapter',id:'chap-6',title:'Instruction Data 改变了什么？另一个仍未解释的现象',badge:'both',badgeLabel:'消融 / 未知',
      bridge:`前半节从同一 ${term('Checkpoint','检查点','训练过程中保存的一组模型状态','Pure 与 Boost 从同一 stable checkpoint 分叉')} 分叉：Boost 加入 7% instruction data，Pure 不加入。后半节单独调查早在 decay 之前出现的 1.0T–1.2T ${term('Performance Surge','性能突增','训练指标在短区间内明显跃升','作者报告该现象但没有解释触发机制')}。<b>论文没有证明 instruction data 导致这次突增。</b>`,
      analogy:{title:'同一起跑线，两条实验分支',text:'只保留共同起点的直觉，主画面直接显示八项 benchmark 的任务级变化与未知现象。',componentId:'analogy-5'},
      modules:[
        {kind:'module',id:'6.1',title:'Pure ↔ Boost：同一检查点的 7% 指令数据消融',desc:`切换八项任务，查看 MMLU 43.75→51.21 以及 HellaSwag 63.21→57.80 等差异。${term('Ablation','消融实验','固定共同起点，只改变一个因素','隔离 instruction data 对 benchmark 的影响')} 不能被简化成“所有能力都提升”。`,componentId:'index-instruction-ablation'},
        {kind:'module',id:'6.2',title:'独立事件：Performance Surge Investigation',desc:'切换 Observed / Known controls / Hypothesis / Unknown 四个镜头。突增发生在 stable phase、早于 decay 分支，因此不能归因于后来的 7% instruction data；作者也明确表示尚不能解释。',componentId:'index-surge-investigation'},
      ],
      insight:`instruction-like data 会改变 benchmark 表现；这既可能反映能力，也要求警惕评测解释、${term('Contamination','评测污染','训练数据与测试题发生直接或近似重合','会让 benchmark 分数高估真实泛化')} 与 ${term('Instruction-tuning Effect','指令微调效应','模型更熟悉题目呈现和作答格式','可能提升分数而不等价于底层知识同幅增长')}。`,
      takeaways:[{icon:'7%',title:'唯一主变量',desc:'Boost 分支加入 7% instruction data。'},{icon:'↕',title:'任务异质',desc:'多数任务上升，HellaSwag 在该表中下降。'},{icon:'?',title:'保留未知',desc:'surge 的触发机制仍未被论文解释。'}],
    },
    {
      kind:'chapter',id:'chap-7',title:'SFT：一千万样本池，为什么最后不到十万',badge:'trn',badgeLabel:'后训练',
      bridge:`${term('SFT','Supervised Fine-Tuning','用高质量“输入→回答”示范教模型遵循指令','Base 到 Chat 的第一阶段')} 的价值不在数据量堆积，而在 ${term('Clustering','聚类','把相似样本按语义组织起来','帮助 SFT 数据覆盖更多任务类型')}、${term('Reward Model','奖励模型','给候选回答估计偏好质量','参与从千万级候选池筛选高质量示范')} 和精确的 response-only loss mask。`,
      analogy:{title:'从大量草稿中选出少量示范',text:'只用“筛选示范”建立直觉；主交互直接展开数据漏斗和 system/query/response token mask。',componentId:'analogy-6'},
      modules:[{kind:'module',id:'7.1',title:'SFT Data Funnel + Loss Mask + Training Strategy',desc:`点击 >10M pool → clustering / reward model → <100k SFT，再展开 ${term('Loss Masking','损失遮罩','决定哪些 token 贡献训练损失','只让 response tokens 产生 SFT loss')}；随后独立切换 ${term('Optimizer State','优化器状态','AdamW 累积的一阶与二阶梯度统计','论文比较是否继承预训练状态')} 与 ${term('Pretraining Replay','预训练回放','SFT 时混入一部分原预训练 token','论文用 40% token 缓解分布漂移')}，查看 Table 3 已报告配置。`,componentId:'index-sft-mask'}],
      insight:'system 与 query 是条件，不参与这里展示的 SFT loss；optimizer state / replay 的对照必须保留论文实验设置。',
      takeaways:[{icon:'10M+',title:'候选池',desc:'先广泛收集，再聚类与奖励模型筛选。'},{icon:'<100k',title:'最终 SFT',desc:'质量与覆盖比原始数量更关键。'},{icon:'mask',title:'只训回应',desc:'response tokens 计 loss，system/query 提供上下文。'}],
    },
    {
      kind:'chapter',id:'chap-8',title:'DPO 与 Character RAG：偏好和记忆放在哪里',badge:'both',badgeLabel:'对齐 / 检索',
      bridge:`${term('DPO','Direct Preference Optimization','直接提高 chosen 相对 rejected 的偏好','SFT 后继续对齐回答')} 调整行为；${term('RAG','Retrieval-Augmented Generation','先检索外部片段，再把它放入提示词','让 Character 使用角色台词上下文')} 提供可更新的角色记忆。`,
      analogy:{title:'先选更好的回答，再翻角色台词',text:'两个生活动作被拆开，分别服务偏好优化和检索；不把检索误写成参数更新。',componentId:'analogy-7'},
      modules:[
        {kind:'module',id:'8.1',title:'DPO Preference Mass：让概率从 rejected 移向 chosen',desc:`调整 ${term('β','Beta / 偏好强度','控制偏好优化相对参考策略的压力','交互中决定 chosen 与 rejected 的迁移速度')} 并训练一步，观察相对概率质量迁移，同时显示 ${term('Catastrophic Forgetting','灾难性遗忘','新训练让模型丢失原有能力','DPO 过强时需要监测的风险')} 与 ${term('Over-refusal','过度拒绝','模型对本可回答的问题也选择拒绝','偏好对齐需要避免的行为副作用')}。`,componentId:'index-dpo-lab'},
        {kind:'module',id:'8.2',title:'Character RAG：Query → Retrieve → Context → Response',desc:`逐步推进完整检索链：约 80k 角色对话、超过 1,000 个角色，训练和推理均可把检索台词放入 ${term('Prompt','提示词','送入模型的指令、上下文和用户输入','承载 RAG 检索到的角色台词')}。${term('Few-shot Customization','少样本定制','用少量示例约束输出风格','Character 可借检索上下文快速适配角色')} 不等于立即更新权重。`,componentId:'index-rag-flow'},
      ],
      formula:{lead:'DPO 比较 chosen 与 rejected 相对参考策略的对数概率差：',unicode:'log σ(β[(log πθ(yw|x)−log πref(yw|x))−(log πθ(yl|x)−log πref(yl|x))])',explanation:'先分别计算当前策略相对参考策略对 chosen 和 rejected 的偏好增量，再取两者差；β 控制力度，σ 把结果压到 0—1，外层 log 形成训练目标。',symbols:[{sym:'log',desc:'对数函数；把偏好概率转成可优化的对数目标'},{sym:'σ',desc:'Sigmoid 函数，把任意实数压缩到 0—1'},{sym:'β',desc:'偏好优化强度，越大表示对偏好差施加更强压力'},{sym:'πθ',desc:'正在训练的当前策略'},{sym:'πref',desc:'冻结的参考策略，用来限制模型偏离幅度'},{sym:'yw',desc:'chosen response，偏好数据中更好的回答'},{sym:'yl',desc:'rejected response，偏好数据中较差的回答'},{sym:'x',desc:'同一条用户输入或上下文'}]},
      takeaways:[{icon:'≻',title:'偏好对',desc:'DPO 学习 chosen 相对 rejected 的优势。'},{icon:'β',title:'力度要平衡',desc:'过强会增加遗忘或过度拒绝风险。'},{icon:'RAG',title:'检索进 prompt',desc:'角色知识可在推理时由外部上下文提供。'}],
    },
    {
      kind:'chapter',id:'chap-9',title:'Benchmark Constellation 与 Evidence Map',badge:'both',badgeLabel:'评测 / 边界',
      bridge:`最后不只看巨大表格。把 MMLU、C-Eval、CMMLU、HellaSwag、ARC、GSM8K、HumanEval 放回各自任务和 ${term('Evaluation Protocol','评测协议','规定 few-shot、PPL 或生成式打分方式','决定分数能否比较')}，再区分 Established / Suggested / Unknown。`,
      analogy:{title:'同一张成绩单，先看科目和评分规则',text:'结果比较只保留共同刻度的要求；主视图变成任务星图和证据等级。',componentId:'analogy-10'},
      modules:[
        {kind:'module',id:'9.1',title:'Benchmark Constellation：任务与协议地图',desc:`点击任务节点，区分知识、常识、科学、数学、代码，以及 ${term('5-shot PPL','五样本困惑度评测','先给五个示例，再比较候选答案概率','用于 MMLU、C-Eval、CMMLU')}、${term('0-shot PPL','零样本困惑度评测','不给示例，直接按候选概率作答','用于 HellaSwag 与 ARC')} 和 ${term('Generation Evaluation','生成式评测','让模型生成答案后再做抽取或验证','用于 GSM8K 与 HumanEval')}。`,componentId:'index-benchmark-map'},
        {kind:'module',id:'9.2',title:'Evidence Map：论文证明了什么，还不知道什么',desc:'切换 Established / Suggested / Unknown，检查事实、作者解释和开放问题。64.92 是论文六任务均分，不包含数学与代码。',componentId:'index-evidence-map'},
      ],
      insight:'能复述结论，也要说清结论在什么协议、检查点和实验条件下成立。',
      takeaways:[{icon:'✦',title:'任务地图',desc:'每个 benchmark 测量不同能力。'},{icon:'≠',title:'协议不可混写',desc:'PPL 与 generation evaluation 需要分别解释。'},{icon:'?',title:'证据分级',desc:'Established、Suggested、Unknown 使用不同措辞。'}],
    },
  ],
};
