import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Video-LaVIT: Unified Video-Language Pre-training with Decoupled Visual-Motional Tokenization',
    titleZh: 'Video-LaVIT：用解耦视觉—运动 Token 统一视频语言预训练',
    venue: 'ICML · 2024',
    authors: 'Yang Jin 等',
    affiliation: 'Video-LaVIT',
    domain: '视频语言预训练 / 视频生成',
    coreProblem: '逐帧视频含有大量重复外观，长 token 序列给语言模型带来负担。',
    coreInsight: '使用压缩视频的 I-frame 表示外观、motion vector 表示变化；分别离散化后交给统一语言模型，再解码为视频。',
    keywords: ['I-frame', 'Motion Vector', 'Motion Tokenizer', '长视频生成'],
  },
  hero: {
    oldMethod: { desc: '逐帧表示反复编码背景。' },
    newMethod: { desc: '关键帧与运动分路编码，再统一建模。' },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '视频为什么需要解耦？', badge: 'inf', badgeLabel: '问题与洞察',
      bridge: '从 Figure 1 的时间冗余出发，再看视频 token 序列为什么迅速变长。',
      analogy: { title: '翻页书中的重复背景', text: '翻页时保留场景起点，再描述角色如何移动，就不必每页重画整幅背景。' },
      modules: [
        { kind: 'module', id: '1.1', title: '时间轴：看见重复外观', desc: '拖动帧并切换完整画面／解耦表示；图形与说明同步更新。', componentId: 'lab-timeline', figure: './images/figure-1.png', figureCrop: { x: 10, y: 5, width: 735, height: 440, sourceWidth: 764, sourceHeight: 627 }, evidence: { kind: 'DEMO', source: 'Figure 1', note: '画面与 token 形状为教学模拟。' }, figureRegions: [{ label: '连续帧', left: 1, top: 0, width: 98, height: 35 }, { label: '关键帧与运动', left: 1, top: 40, width: 98, height: 49 }] },
        { kind: 'module', id: '1.2', title: '三种视频表示的序列成本', desc: '切换编码方法并调整时长；比较信息职责和示例 token 数。', componentId: 'lab-cost', evidence: { kind: 'DEMO', source: 'Introduction / Appendix A.1', note: '2.2 秒与 4 秒示例并非同协议压缩率。时长外推仅是线性示意。' } },
      ],
      representationPreset: { visual: 0, motion: 0, clips: 1 },
      takeaways: [
        { icon: '🎞️', title: '时间冗余', desc: '相邻帧反复出现相同外观。' },
        { icon: '🧩', title: '外观与变化分路', desc: '两种信息承担不同职责。' },
        { icon: '📏', title: '数字带条件', desc: '不同视频时长与协议不能直接求压缩率。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '压缩视频里有什么？', badge: 'inf', badgeLabel: '输入表示',
      bridge: '直接利用 MPEG-4 的 I-frame 和 motion vector；不虚构均匀关键帧采样器。',
      analogy: { title: '完整画面与位移便签', text: '一页画出场景，后面的便签只写局部往哪里移动。' },
      modules: [
        { kind: 'module', id: '2.1', title: 'MPEG-4 解剖', desc: '点选 I/P 帧与宏块，辨认外观和运动信号。', componentId: 'lab-mpeg', evidence: { kind: 'PAPER', source: 'Section 3.1 / Figure 2' } },
        { kind: 'module', id: '2.2', title: 'Eq.1 宏块匹配搜索', desc: '选择候选位移并改变搜索半径，观察示意误差与搜索量。', componentId: 'lab-motion-search', evidence: { kind: 'DEMO', source: 'Eq.1', note: '格子与误差值是教学模拟。' } },
      ],
      representationPreset: { visual: 0, motion: 0, clips: 1 },
      formula: { lead: 'Eq.1 在候选位移中寻找差异最小的 16×16 宏块。', unicode: 'm⃗(p,q) = arg minᵢ,ⱼ ‖Iₜ(p,q) − Iₜ₋₁(p−i,q−j)‖', symbols: [{ sym: 'm⃗(p,q)', desc: '宏块位置的运动向量' }, { sym: '(i,j)', desc: '候选位移' }] },
      takeaways: [
        { icon: '🖼️', title: 'I-frame 保留外观', desc: '压缩流自带关键帧。' },
        { icon: '↗️', title: '向量记录变化', desc: '宏块匹配得到位移信息。' },
        { icon: '🔎', title: 'Eq.1 是搜索', desc: '选择差异最小的候选位置。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '视觉分支：继承 LaVIT', badge: 'trn', badgeLabel: '视觉 Token',
      bridge: '关键帧进入视觉 tokenizer；平均 token 数和词表容量是两个不同量。',
      analogy: { title: '一页画面写成视觉词', text: '已有的视觉词典负责表示关键帧的外观与语义。' },
      modules: [
        { kind: 'module', id: '3.1', title: '224×224 关键帧到视觉 token', desc: '逐步点亮 EVA-CLIP 与离散化路径，再查看图像区域的示意覆盖。', componentId: 'lab-visual-pipeline', figure: './images/figure-2.png', figureCrop: { x: 0, y: 0, width: 1555, height: 640, sourceWidth: 1555, sourceHeight: 770 }, evidence: { kind: 'DEMO', source: 'Figure 2 / Appendix A.1', note: '区域覆盖是教学抽象。' }, figureRegions: [{ label: '关键帧入口', left: 11, top: 58, width: 14, height: 10 }, { label: '视觉 tokenizer', left: 12, top: 37, width: 21, height: 13 }] },
        { kind: 'module', id: '3.2', title: '每帧约 90 与词表 16,384', desc: '调整关键帧个数，再切换“当前 token 数／可选码字数”读法。', componentId: 'lab-visual-budget', evidence: { kind: 'DEMO', source: 'Appendix A.1', note: '多关键帧计数为按论文均值的教学估算。' } },
      ],
      representationPreset: { visual: 90, motion: 0, clips: 1 },
      takeaways: [
        { icon: '👁️', title: '复用视觉先验', desc: '视觉分支继承 LaVIT。' },
        { icon: '🔤', title: '约 90 个/帧', desc: '这是平均输出长度。' },
        { icon: '📚', title: '16,384 项', desc: '这是视觉 codebook 的容量。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '运动分支：135 个符号', badge: 'trn', badgeLabel: 'Motion Tokenizer',
      bridge: '24 帧运动张量经过 12 层编码与逐级下采样，最后量化成 135 个 token。',
      analogy: { title: '把动作轨迹折成短记号', text: '保留运动结构，把密集位移压进有限的符号序列。' },
      modules: [
        { kind: 'module', id: '4.1', title: '运动张量逐层折叠', desc: '逐步查看维度变化，点选 3、6、9、12 层的下采样位置。', componentId: 'lab-motion-fold', figure: './images/figure-2.png', figureCrop: { x: 900, y: 10, width: 635, height: 610, sourceWidth: 1555, sourceHeight: 770 }, evidence: { kind: 'DEMO', source: 'Figure 2 / Appendix A.1', note: '方块是张量形状示意。' }, figureRegions: [{ label: '时空编码器', left: 28, top: 61, width: 50, height: 34 }, { label: '量化与码本', left: 5, top: 27, width: 75, height: 31 }] },
        { kind: 'module', id: '4.2', title: 'Eq.2 归一化最近邻量化', desc: '拖动 latent 并手选码字，对照归一化距离和最终 token ID。', componentId: 'lab-quantize', evidence: { kind: 'DEMO', source: 'Eq.2 / Appendix A.1', note: '二维位置与五个码字是教学模拟；实际码本有 1024 项。' } },
      ],
      representationPreset: { visual: 90, motion: 135, clips: 1 },
      formula: { lead: 'Eq.2 使用 L2 归一化后的最近邻码字。', unicode: 'zᵢ = arg minⱼ ‖l₂(ẑᵢ) − l₂(cⱼ)‖₂', symbols: [{ sym: 'ẑᵢ', desc: '运动 embedding' }, { sym: 'cⱼ', desc: '码本向量' }, { sym: 'zᵢ', desc: '离散 token ID' }] },
      takeaways: [
        { icon: '🧊', title: '24×20×36×2', desc: '6 fps 下的运动输入形状。' },
        { icon: '🏗️', title: '编码与解码各 12 层', desc: '第 3、6、9、12 层后下采样。' },
        { icon: '💜', title: '3×9×5=135', desc: '最终运动 token 数。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '让 LLM 学会视频语言', badge: 'both', badgeLabel: '统一序列',
      bridge: '视觉段与运动段成组交替，不是 visual token 与 motion token 一一配对。',
      analogy: { title: '给不同词汇加边界', text: '标记指明一段是图像、一段是运动，语言模型仍使用统一的预测接口。' },
      modules: [
        { kind: 'module', id: '5.1', title: '成组 Token 序列构造器', desc: '增删与重排视觉、运动、文本段，切换 IMG/MOV 边界标记并检查解释。', componentId: 'lab-sequence-builder', evidence: { kind: 'DEMO', source: 'Figure 2', note: '构造顺序是教学实验；文本段不添加论文未说明的边界标记。' } },
        { kind: 'module', id: '5.2', title: 'Eq.5 自回归预测', desc: '逐步推进 token 位置，展开当前可见上下文和计数。', componentId: 'lab-next-token', evidence: { kind: 'DEMO', source: 'Eq.5', note: '预测目标与内容计数为简化示意。' } },
      ],
      representationPreset: { visual: 0, motion: 0, clips: 1 },
      formula: { lead: 'Eq.5：仅以位置 i 之前的 token 为条件，预测下一个 token。', unicode: 'p(y) = ∑(y∈D) ∑(i=1…S)\nlog Pθ(yᵢ | y₍<i₎)', symbols: [{ sym: 'yᵢ', desc: '当前位置 token' }, { sym: 'y₍<i₎', desc: '位置 i 之前的 token 序列' }] },
      takeaways: [
        { icon: '🔗', title: '统一预测接口', desc: '视觉、运动与文本都进入序列。' },
        { icon: '🏷️', title: '成组边界', desc: 'IMG/MOV 标记保留模态职责。' },
        { icon: '🧮', title: '内容计数', desc: '计数不含文本及特殊标记。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '从 Token 重新长出视频', badge: 'trn', badgeLabel: 'Detokenizer',
      bridge: '先恢复关键帧，再用直接输入和特征 cross-attention 两条运动条件路径生成连续帧。',
      analogy: { title: '先定场景再注入动作', text: '关键帧提供画面起点，运动条件指导后续变化。' },
      modules: [
        { kind: 'module', id: '6.1', title: '关键帧与视频解码路径', desc: '点选节点追踪条件流，调节 Eq.3 的教学噪声示意。', componentId: 'lab-decode-flow', figure: './images/figure-3.png', figureCrop: { x: 30, y: 25, width: 900, height: 565, sourceWidth: 1547, sourceHeight: 696 }, evidence: { kind: 'DEMO', source: 'Figure 3(a) / Eq.3', note: '噪声强弱动画不是实际 EDM 损失。' }, figureRegions: [{ label: '关键帧与运动条件', left: 1, top: 4, width: 50, height: 65 }, { label: '3D U-Net', left: 51, top: 14, width: 45, height: 72 }] },
        { kind: 'module', id: '6.2', title: 'EMC 拔线实验', desc: '切换直接输入与运动特征路径，并在 Figure 10 中定位定性差异。', componentId: 'lab-emc', figure: './images/figure-10.png', figureCrop: { x: 25, y: 25, width: 1430, height: 835, sourceWidth: 1480, sourceHeight: 960 }, evidence: { kind: 'PAPER', source: 'Figure 10', note: '该图没有报告 FVD 数值。' }, figureRegions: [{ label: 'w/ EMC', left: 4, top: 17, width: 95, height: 17 }, { label: 'w/o EMC', left: 4, top: 34, width: 95, height: 17 }] },
      ],
      representationPreset: { visual: 90, motion: 135, clips: 1 },
      formula: { lead: 'Eq.3 是对加噪视频重建误差的加权期望。', unicode: 'E₍X₀,Î,M,σ,n₎ [λσ ‖gᵥ(X₀+n, σ, Î, M) − X₀‖]', symbols: [{ sym: 'X₀', desc: '原始视频 clip' }, { sym: 'σ', desc: '噪声级别' }] },
      takeaways: [
        { icon: '🎨', title: '先恢复关键帧', desc: '外观提供视频起点。' },
        { icon: '🔌', title: '两条运动条件', desc: '直接输入与特征 cross-attention。' },
        { icon: '🔍', title: 'EMC 有定性消融', desc: 'Figure 10 展示重建差异。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-7', title: '从短片接到长视频', badge: 'trn', badgeLabel: '连续生成',
      bridge: '跨 clip 的边界由前一末帧的 DDIM inversion 和 noise constraint 连接。',
      analogy: { title: '把镜头接成一条长线', text: '上一段的最后画面为下一段提供起点。' },
      modules: [
        { kind: 'module', id: '7.1', title: '多 Clip 连续生成', desc: '增加 clip、选择边界，并用 Figure 9 检查跨段定性案例。', componentId: 'lab-clip-chain', figure: './images/figure-9.png', figureCrop: { x: 105, y: 220, width: 925, height: 980, sourceWidth: 1160, sourceHeight: 1500 }, evidence: { kind: 'DEMO', source: 'Figure 3(b) / Figure 9 / Appendix C', note: '约 225 内容 tokens/clip 不等于完整上下文预算。' }, figureRegions: [{ label: '柯基案例', left: 1, top: 4, width: 98, height: 30 }, { label: '海滩汽车案例', left: 1, top: 37, width: 98, height: 33 }, { label: '林间小屋案例', left: 1, top: 70, width: 98, height: 29 }] },
        { kind: 'module', id: '7.2', title: 'DDIM 边界缝合', desc: '逐步执行 Eq.4 反演并切换噪声约束，对照 Figure 5。', componentId: 'lab-ddim', figure: './images/figure-5.png', figureCrop: { x: 25, y: 10, width: 1440, height: 555, sourceWidth: 1492, sourceHeight: 669 }, evidence: { kind: 'DEMO', source: 'Eq.4 / Figure 5', note: '状态动画为教学模拟；原图是定性对照。' }, figureRegions: [{ label: '无约束', left: 0, top: 68, width: 100, height: 31 }, { label: '有约束', left: 0, top: 0, width: 100, height: 65 }] },
      ],
      representationPreset: { visual: 180, motion: 270, clips: 2 },
      formula: { lead: 'Eq.4 将前一 clip 的末帧反演到带噪状态，作为下一关键帧初始噪声。', unicode: 'xₜ₊₁ = √(αₜ₊₁/αₜ) xₜ + [√(1/αₜ₊₁−1) − √(1/αₜ−1)] gᵢ(xₜ,t,Î)', symbols: [{ sym: 'xₜ', desc: '反演状态' }, { sym: 'αₜ', desc: '噪声日程参数' }] },
      takeaways: [
        { icon: '⛓️', title: '逐段生成', desc: '每段影响下一段边界。' },
        { icon: '🧵', title: 'DDIM 反演', desc: '上一末帧约束下一起点。' },
        { icon: '⚖️', title: '定性对照', desc: 'Figure 5 检查跨段一致性。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '三阶段训练与模块配置', badge: 'trn', badgeLabel: '训练',
      bridge: 'Stage 1/2/3 是训练目标顺序；Table 8 的 30K/100K/60K 是按模块列出的训练步数。',
      analogy: { title: '分阶段练习', text: '先学表示与重建，再学统一预测，最后练习遵循图像和视频指令。' },
      modules: [
        { kind: 'module', id: '8.1', title: '三阶段数据与目标', desc: '切换阶段与数据来源，核对每阶段训练任务。', componentId: 'lab-training-stage', evidence: { kind: 'PAPER', source: 'Section 3.3 / Appendix A.2' } },
        { kind: 'module', id: '8.2', title: 'Table 8 模块配置', desc: '切换 LM/Tokenizer/Detokenizer 并定位训练步数、GPU 等字段。', componentId: 'lab-training-config', evidence: { kind: 'PAPER', source: 'Table 8 / Appendix A.3' } },
      ],
      representationPreset: { visual: 90, motion: 135, clips: 1 },
      takeaways: [
        { icon: '🪜', title: '训练阶段', desc: '三阶段的目的不同。' },
        { icon: '📋', title: '模块配置', desc: 'Table 8 按模块列数值。' },
        { icon: '🚧', title: '网页不运行模型', desc: '配置查阅不等于实时训练。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-9', title: '理解与生成评测', badge: 'both', badgeLabel: '实验',
      bridge: '按任务、指标、数据集与基线阅读 Tables 1–5；数字只在相同协议内比较。',
      analogy: { title: '按赛道看成绩', text: '图像理解、视频理解与视频生成各有自己的成绩单。' },
      modules: [
        { kind: 'module', id: '9.1', title: '理解任务 Benchmark Arena', desc: '切换图像／视频任务，再选数据集和比较基线。', componentId: 'lab-understanding', evidence: { kind: 'PAPER', source: 'Tables 1–3' } },
        { kind: 'module', id: '9.2', title: '生成指标与原图案例', desc: '切换文生视频／长视频指标；短视频的定性案例可在 Figure 4 原图查看。', componentId: 'lab-generation', figure: './images/figure-4.png', figureCrop: { x: 90, y: 105, width: 820, height: 430, sourceWidth: 1020, sourceHeight: 1320 }, evidence: { kind: 'PAPER', source: 'Tables 4–5 / Figure 4' }, figureRegions: [{ label: '文生视频', left: 1, top: 8, width: 98, height: 44 }, { label: '图生视频', left: 1, top: 54, width: 98, height: 42 }] },
      ],
      representationPreset: { visual: 90, motion: 135, clips: 1 },
      takeaways: [
        { icon: '👁️', title: '任务分开看', desc: '理解与生成的指标不同。' },
        { icon: '📊', title: '方向与协议', desc: 'FVD/KVD 越低越好，CLIPSIM 越高越好。' },
        { icon: '🔎', title: '谨慎比较', desc: '基线与训练数据条件必须说明。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-10', title: '消融、局限与结论', badge: 'both', badgeLabel: '审稿人模式',
      bridge: '通过视频任务消融判断 motion、token 数和 EMC 的贡献，再阅读作者写出的边界。',
      analogy: { title: '用证据答辩', text: '先选主张，再找论文实际支持它的表格或图。' },
      modules: [
        { kind: 'module', id: '10.1', title: 'Motion / Token 数 / EMC 消融', desc: '切换设计与指标，查看 Table 6、7 和 Figure 10 的离散对照。', componentId: 'lab-ablation', evidence: { kind: 'PAPER', source: 'Tables 6–7 / Figure 10', note: 'Table 7 仅有 135 和 256 两个设置。' } },
        { kind: 'module', id: '10.2', title: 'Reviewer：局限与证据判断', desc: '选择论文局限，再判断哪些结论可由现有实验支持。', componentId: 'lab-review', evidence: { kind: 'PAPER', source: 'Tables 6–7 / Figure 10 / Appendix C / Impact Statement' } },
      ],
      representationPreset: { visual: 90, motion: 135, clips: 1 },
      takeaways: [
        { icon: '✅', title: 'Motion 改善所测视频任务', desc: 'Table 6 提供消融证据；图像指标见 Appendix Table 9。' },
        { icon: '🧮', title: '135 是设计点', desc: 'Table 7 只比较两个离散设置。' },
        { icon: '🧭', title: '承认局限', desc: '上下文长度、短视频数据与训练成本仍受限制。' },
      ],
    },
  ],
};
