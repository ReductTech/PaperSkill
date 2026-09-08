import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Unified Zero-Shot Time Series Forecasting: A Darts Foundation',
    titleZh: '统一零样本时间序列预测：Darts FoundationModel',
    venue: 'Preprint, June 2026',
    authors: 'Zhihao Dai, Dennis Bader, Alain Gysi',
    affiliation: 'University of Oxford; Unit8 SA',
    domain: '时间序列基础模型、零样本预测、统一接口与评估工具链',
    coreProblem: '时间序列基础模型常以彼此隔离的软件包发布：输入格式、概率输出和评估方式各不相同，联合比较与接入完整流水线都很费力。',
    coreInsight: '论文没有再造一个预测模型，而是在 Darts 中提供统一的 <b>FoundationModel 类集合</b>：四个 TSFM 后端保留各自能力，同时共享 TimeSeries、fit/predict、回测、微调与解释工具。',
    keywords: ['Darts', 'FoundationModel', 'zero-shot', 'TSFM', 'backtesting'],
  },
  hero: {
    oldMethod: {
      desc: '每个模型包都像一套凸点规格不同的积木：换一个后端，输入、预测和评估代码也要重新搭。',
      componentId: 'hero-old',
    },
    newMethod: {
      desc: '四个模型积木都能扣到 FoundationModel 标准底板：更换后端，TimeSeries、调用方式与工具链保持一致。',
      componentId: 'hero-new',
    },
  },
  chapters: [
    {
      kind: 'chapter', id: 'chap-1', title: '模型很强，为什么还会堵在接口上', badge: 'inf', badgeLabel: '问题 / 使用',
      bridge: '零样本模型省下了逐任务训练，却没有自动省下工程集成。依次加入论文中的四个模型，看看每个模型单独接入时会增加多少适配工作。',
      analogy: { title: '四种模型，四块专用底板', text: 'Chronos-2、TimesFM 2.5、TiRex 与 PatchTST-FM 各自配一块专用底板。FoundationModel 提供共同的连接规格，不改变模型内部。', componentId: 'analogy-1' },
      modules: [
        { kind: 'module', id: '1.1', title: '拉高模型数量，观察适配成本', desc: '滑动模型数量。矩阵中的每个红色方格，代表一个模型与输入、预测或评估工具之间的专用适配。', componentId: 'ch1m1' },
        { kind: 'module', id: '1.2', title: '只换模型积木，外层结构不动', desc: '选择四个初始 TSFM 中的任意一个，观察标准底板右侧的调用链是否变化。', componentId: 'ch1m2' },
      ],
      insight: '论文的贡献是互操作层：统一接口降低共同评估和流水线集成的摩擦，但不等于四个模型内部结构或预测能力相同。',
      takeaways: [
        { icon: '01', title: '痛点', desc: '孤立包会重复输入适配、概率处理与评估代码。' },
        { icon: '02', title: '贡献', desc: '首批统一接入 Chronos-2、TimesFM 2.5、TiRex 与 PatchTST-FM。' },
        { icon: '03', title: '边界', desc: '重点是统一接口及接入后的性能保持，不对预测库进行能力排名。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-2', title: '同一块标准底板：TimeSeries、fit、predict', badge: 'inf', badgeLabel: '接口 / 推理',
      bridge: '统一接口沿用 Darts 已有的数据结构与方法，包括 TimeSeries、fit()、predict() 以及回测等工具，而不另建一套 API。零样本场景仍需执行 fit()，用于模型创建与数据检查。',
      analogy: { title: '把 TimeSeries 积木片扣到底板', text: '输入积木片规格固定；fit 负责对齐与检查，predict 沿相同凸点向未来补出预测积木。', componentId: 'analogy-2' },
      modules: [{ kind: 'module', id: '2.1', title: '逐步点亮统一生命周期', desc: '依次点击 TimeSeries、fit、就绪与 predict。零样本时 fit 仍必须调用，但默认冻结 TSFM 权重，只负责模型创建、数据检查与统一工作流。', componentId: 'ch2m1' }],
      insight: 'FoundationModel 只对 TorchForecastingModel 做最小扩展，不增加额外方法；fit 与 predict 继续消费和产出 Darts TimeSeries。',
      formula: {
        lead: '统一零样本调用在 fit 与 predict 中传入同一条序列：', unicode: 'model.fit(series); forecast = model.predict(n=n, series=series)',
        symbols: [
          { sym: 'series', desc: 'Darts 的三维时间索引容器：(time, components, samples)' },
          { sym: 'fit', desc: '零样本也要调用；默认不更新 TSFM 参数' },
          { sym: 'n', desc: '向未来预测的步数' },
        ],
      },
      takeaways: [
        { icon: '01', title: '最小扩展', desc: 'FoundationModel 沿用 Darts 方法，而非另立 API。' },
        { icon: '02', title: '重要细节', desc: '训练自由不等于跳过 fit；fit 仍负责初始化与检查。' },
        { icon: '03', title: '互操作', desc: '标准 TimeSeries 让后续转换、评估与保存工具继续工作。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-3', title: '协变量：预测时还能参考哪些信息', badge: 'inf', badgeLabel: '条件 / 防泄漏',
      bridge: '协变量是与目标序列按时间对齐、用于辅助预测的信息。先区分过去协变量与未来协变量，再拖动预测起点，判断哪些值在预测当时确实可用。',
      analogy: { title: '店长预测下周冰淇淋销量', text: '过去实测气温只能看到今天；下周的周末与节日已经写在日历上；下周实际气温尚未发生，不能当成已知信息使用。', componentId: 'analogy-3' },
      modules: [{ kind: 'module', id: '3.1', title: '协变量类型与合法时间边界', desc: '协变量是与目标序列按时间对齐的辅助信息。过去协变量截止到 forecast start，未来协变量必须在整个预测区间内预先可知。', componentId: 'ch3m1' }],
      insight: 'Darts 自动对齐目标序列与协变量以避免泄漏；真正能利用协变量的前提，是所选 TSFM 本身支持该类条件输入，论文举例为 Chronos-2。',
      formula: {
        lead: '合法预测只依赖预测时可获得的信息：', unicode: 'ŷₜ₊₁:ₜ₊ₙ = f(y≤t, xᵖ≤t, xᶠ≤t+n)',
        symbols: [
          { sym: 'y≤t', desc: '预测起点前已观测的目标序列' },
          { sym: 'xᵖ', desc: '只观测到预测起点的过去协变量' },
          { sym: 'xᶠ', desc: '在预测结束前已经预知的未来协变量' },
        ],
      },
      takeaways: [
        { icon: '01', title: '过去协变量', desc: '可用范围截止到 forecast start。' },
        { icon: '02', title: '未来协变量', desc: '必须在预测时已知，例如日历属性。' },
        { icon: '03', title: '能力条件', desc: '统一接口不意味着每个 TSFM 都支持同样的协变量。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-4', title: '多序列预测：批量上路，顺序不乱', badge: 'both', badgeLabel: '批处理 / 推理',
      bridge: '真实业务往往有多家门店或多台设备。把序列数量拉高，观察 Darts 如何分成 mini-batches 并在输出端恢复原顺序。',
      analogy: { title: '一条编号积木带，整体扣到底板', text: '底板内部可以分批计算，取回结果时仍按积木编号排列。批处理改变效率，不改变对应关系。', componentId: 'analogy-4' },
      modules: [{ kind: 'module', id: '4.1', title: '改变序列数量，查看分批与回位', desc: '每个编号代表一条 TimeSeries。输入会被自动组成 mini-batches，预测完成后再按原编号重组。', componentId: 'ch4m1' }],
      insight: 'predict 可以接收 TimeSeries 序列并返回预测序列；并行批处理是实现细节，外层仍看到稳定的一一对应。',
      takeaways: [
        { icon: '01', title: '输入', desc: '可直接传入多条 TimeSeries。' },
        { icon: '02', title: '效率', desc: '底层自动分成 mini-batches 并行处理。' },
        { icon: '03', title: '秩序', desc: '输出预测会恢复为输入序列的原始顺序。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-5', title: '历史预测：站在过去，模拟当时的未来', badge: 'both', badgeLabel: '回测 / 评估',
      bridge: 'historical_forecasts 在多个过去时间点遮住后续真实值，模拟从当时向未来预测。retrain 控制是否重复 fit；backtest 和 residuals 使用这些历史预测进行评估。',
      analogy: { title: '在多个旧时点重复“只看左边，预测右边”', text: '每一行代表一次独立模拟：蓝色部分是当时可见的历史，橙色部分是从该历史起点向前预测的 n 步。', componentId: 'analogy-5' },
      modules: [{ kind: 'module', id: '5.1', title: '历史预测、retrain 与两种评估结果', desc: '历史起点 tᵢ 是“历史到此为止、预测从下一步开始”的边界。retrain 控制是否重复 fit；随后 backtest 汇总预测表现，residuals 保留逐点误差。', componentId: 'ch5m1' }],
      insight: 'backtest 与 residuals 都使用历史预测的结果。retrain 只控制每个历史起点前是否再次执行 fit；默认冻结的零样本 TSFM 即使 retrain=True，也不会因此微调基础权重。',
      formula: {
        lead: '历史预测可以进一步产生评分与逐点误差：', unicode: 'H = {ŷ[tᵢ+1:tᵢ+n]}; score = metric(y, H); eₜ = yₜ − ŷₜ',
        symbols: [
          { sym: 'H', desc: '所有历史起点产生的预测集合' },
          { sym: 'score', desc: 'backtest 使用指定指标汇总得到的模型表现' },
          { sym: 'eₜ', desc: '时点 t 的残差；这里用真实值减预测值表示' },
        ],
      },
      takeaways: [
        { icon: '01', title: '历史预测', desc: '在过去重复模拟“如果当时开始预测”。' },
        { icon: '02', title: 'backtest', desc: '用指标汇总历史预测与真实值之间的差异。' },
        { icon: '03', title: 'residuals', desc: '保留逐点误差，用于观察偏差和异常时段。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-6', title: '概率预测：输出一个分布，而非一个孤立读数', badge: 'inf', badgeLabel: '不确定性 / 推理',
      bridge: '点预测为每个未来时点给出一个数值；概率预测描述一组可能结果及其分布位置。Monte Carlo Sampling 生成样本轨迹，Direct Parameter Prediction 直接输出分布参数。',
      analogy: { title: '天气预报不只报一个温度', text: '与其断言明天一定是 26°C，概率预测会说明较低、典型和较高的可能温度。可能范围越宽，表示预报越不确定。', componentId: 'analogy-6' },
      modules: [{ kind: 'module', id: '6.1', title: '两种概率输出：采样未来轨迹或直接给出参数', desc: 'Monte Carlo Sampling 从模型预测的分布中随机采样 N 次，生成 N 条可能的未来轨迹。Direct Parameter Prediction 直接输出未来每个时间步的分布参数，例如均值、方差或分位数，再据此计算区间和概率结果。', componentId: 'ch6m1' }],
      insight: '两种模式共享同一次模型前向计算，区别发生在输出阶段。论文图 1 中的四个 TSFM 都使用 QuantileRegression likelihood；图中结果经过可视化调整，不能当作真实性能比较。',
      formula: {
        lead: '想象把 100 个可能结果从小到大排成一队：', unicode: 'q10 ≈ 第 10 个；q50 ≈ 第 50 个；q90 ≈ 第 90 个',
        symbols: [
          { sym: 'q10', desc: '偏低位置：大约 10% 的可能结果比它更低' },
          { sym: 'q50', desc: '中间位置：一半可能结果更低，一半更高' },
          { sym: 'q90', desc: '偏高位置：大约 90% 的可能结果比它更低' },
        ],
      },
      takeaways: [
        { icon: '01', title: 'Monte Carlo', desc: '从预测分布采样 N 次，得到 N 条未来轨迹。' },
        { icon: '02', title: 'Direct Parameters', desc: '直接输出均值、方差或分位数等分布参数。' },
        { icon: '03', title: '共同前提', desc: '参数含义与采样方式由匹配的 likelihood 决定。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-7', title: '微调：明确选择哪些参数可以更新', badge: 'trn', badgeLabel: '微调 / 训练',
      bridge: 'enable_finetuning 定义三种离散状态：冻结全部参数、解冻全部参数，或通过通配符选择一部分参数。',
      analogy: { title: '锁住或解锁模型积木层', text: '可以固定全部积木层，也可以全部开放，或只解锁指定层；fit 只更新可移动的部分。', componentId: 'analogy-7' },
      modules: [{ kind: 'module', id: '7.1', title: '选择 enable_finetuning 的真实状态', desc: '点击 None/False、True 或 dict。层图会同步显示冻结与可训练参数，并给出 fit 的实际行为。', componentId: 'ch7m1' }],
      insight: '对 TSFM，None/False 默认冻结，True 全量解冻，dict 用 Unix shell 风格通配符选择冻结或解冻参数；当前不支持 LoRA 等参数高效微调。',
      takeaways: [
        { icon: '01', title: '零样本', desc: 'None/False：fit 不更新模型参数。' },
        { icon: '02', title: '全量与部分', desc: 'True 全量训练；dict 只改变匹配参数。' },
        { icon: '03', title: '实现边界', desc: '论文实现不支持 LoRA 等 PEFT 方法。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-8', title: '四种模型积木，共用一块 Darts 底板', badge: 'trn', badgeLabel: '系统 / 架构',
      bridge: '统一不是抹平模型差异。选择任一后端，沿高亮路径查看 FoundationModel 如何把它接到 Darts 生命周期与工具链。',
      analogy: { title: '把模型积木扣到标准凸点', text: '积木内部算法各不相同，底板只规定输入输出与控制方式；统一接口保留差异，同时提供互操作。', componentId: 'analogy-8' },
      modules: [{ kind: 'module', id: '8.1', title: '选择模型，追踪统一系统路径', desc: '四个模型都进入 FoundationModel 类集合，再复用 PyTorch Lightning 后端与 Darts 的数据、评估、保存和解释能力。', componentId: 'ch8m1' }],
      insight: '模型提供方只需实现 PLForecastingModule 的 forward 与 FoundationModel 的 _create_model；HuggingFaceConnector 可选，并非强制依赖。',
      takeaways: [
        { icon: '01', title: '后端保留差异', desc: '统一的是外层契约，不是内部网络。' },
        { icon: '02', title: '实现入口', desc: '提供 forward 与 _create_model，生命周期由 Darts 承接。' },
        { icon: '03', title: '依赖边界', desc: 'darts[torch] 是先决安装，Hugging Face 连接器可选。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-9', title: 'SHAP：为什么模型输出 250，而不是基线 150', badge: 'trn', badgeLabel: '解释 / 生态',
      bridge: 'SHAP 会反复遮蔽输入并调用同一个基础模型，观察预测怎样变化，再把平均变化分配给各个特征。沿着 250、190、220、240 这组结果逐步计算。',
      analogy: { title: '逐块遮住输入积木，反复询问同一个模型', text: '问号表示用背景参考值替代该输入，而不是传入空值。比较每次输出变化后，再把贡献加回平均预测。', componentId: 'analogy-9' },
      modules: [{ kind: 'module', id: '9.1', title: '从基线 150 到预测 250 的 SHAP 分解', desc: '原始预测为 250。依次用背景参考值替代 x1、x2、x3 后，模型输出为 190、220、240。本数值案例设定特征无交互，因此替代差值与贡献 60、30、10 一致。', componentId: 'ch9m1' }],
      insight: 'Darts 默认使用模型无关的 Permutation SHAP。问号代表背景或参考值，不是 NaN；SHAP 解释模型对输入的响应，不自动证明现实因果。Deep SHAP 与 Gradient SHAP 因架构限制及 base value 缺失而未采用。',
      formula: {
        lead: '当前预测等于背景平均预测加上各输入贡献：', unicode: '250 = 150 + 60 + 30 + 10',
        symbols: [
          { sym: '150', desc: '基础模型在背景参考数据上的平均预测，即 base value' },
          { sym: '60/30/10', desc: 'x1、x2、x3 的平均边际贡献' },
          { sym: '250', desc: '需要解释的当前模型输出' },
        ],
      },
      takeaways: [
        { icon: '01', title: '反复调用', desc: '遮蔽不同输入，多次调用同一个基础模型。' },
        { icon: '02', title: '排列取平均', desc: '跨不同加入顺序平均边际变化，得到 SHAP 值。' },
        { icon: '03', title: '不要过读', desc: 'SHAP 解释模型预测，不自动证明因果关系。' },
      ],
    },
    {
      kind: 'chapter', id: 'chap-10', title: '接入 Darts 后，模型性能是否基本保持', badge: 'both', badgeLabel: '结果 / 限制',
      bridge: '最后查看论文报告的复现结果。选择模型，对比 Darts 与原实现的 SQL、MASE skill score，观察接入统一接口后分数下降了多少。',
      analogy: { title: '同一份试卷，检查换一种答题流程损失多少分', text: '使用相同模型、数据集和评分规则时，Darts 的分数与原实现接近，最大下降 1.3 个百分点，说明接入统一接口后模型性能基本保持。', componentId: 'analogy-10' },
      modules: [{ kind: 'module', id: '10.1', title: '切换模型，查看接入 Darts 后的分数变化', desc: 'SQL 用于概率预测，MASE 用于点预测；均为相对 seasonal naive 的 skill score。图中直接标出 Darts 相对原实现的最大下降。', componentId: 'ch10m1' }],
      insight: 'fev-bench-mini 含完整 fev-bench 100 个数据集中的 20 个。三种已评估模型接入 Darts 后的分数下降为 0.2 至 1.3 个百分点，表明统一实现没有带来明显的性能损失。',
      takeaways: [
        { icon: '01', title: '协议', desc: '20 个 fev-bench-mini 数据集；0% 表示与季节性朴素基线相当。' },
        { icon: '02', title: '性能保持', desc: '三种已评估模型的分数下降均不超过 1.3 个百分点。' },
        { icon: '03', title: '限制', desc: 'PatchTST-FM 未验证；首发仅四个模型，也尚无参数高效微调。' },
      ],
    },
  ],
};
