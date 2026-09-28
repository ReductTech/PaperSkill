export type SourceCategory =
  | 'Paper'
  | 'Author interpretation'
  | 'Mechanism interpretation'
  | 'Implementation mapping'
  | 'Teaching Toy'
  | 'General Background';

export type KnowledgeKind = 'symbol' | 'formula' | 'dataset' | 'method' | 'phase' | 'confusion' | 'evidence' | 'claim';

export interface KnowledgeCard {
  id: string;
  kind: KnowledgeKind;
  title: string;
  summary: string;
  category: SourceCategory;
  scenes: string[];
  related?: string[];
  evidence?: string[];
  boundary?: string;
}

export interface SymbolCard extends KnowledgeCard {
  kind: 'symbol';
  symbol: string;
  runtimeType: string;
  typicalShape: string;
  createdWhen: string;
  usedWhen: string;
  trainable: string;
  gradientSources: string;
  optimizerMembership: string;
  commonConfusion: string;
}

export interface FormulaCard extends KnowledgeCard {
  kind: 'formula';
  expression: string;
  variables: string[];
  meaning: string;
  codeMapping: string;
}

export interface DatasetCard extends KnowledgeCard {
  kind: 'dataset';
  taskType: string;
  inputType: string;
  classes: string;
  paperRole: string;
  paperRelation: string;
  whyItMatters: string;
  experiments: string[];
}

export interface MethodCard extends KnowledgeCard {
  kind: 'method';
  oldDataRequired: string;
  oldLabelsRequired: string;
  oldModelRequired: string;
  sharedTrainable: string;
  newHeadTrainable: string;
  oldResponseConstraint: string;
}

export interface PhaseCard extends KnowledgeCard {
  kind: 'phase';
  thetaS: string;
  thetaO: string;
  thetaN: string;
  mainAction: string;
}

export interface ConfusionCard extends KnowledgeCard {
  kind: 'confusion';
  question: string;
  answer: string;
}

export interface EvidenceCard extends KnowledgeCard {
  kind: 'evidence';
  measures: string;
  supports: string;
  doesNotEstablish: string;
  location: string;
}

export interface ClaimCard extends KnowledgeCard {
  kind: 'claim';
  verdict: 'Supported' | 'Too strong' | 'Not directly tested';
  supportingEvidence: string[];
}

export const sourceCategories: SourceCategory[] = [
  'Paper',
  'Author interpretation',
  'Mechanism interpretation',
  'Implementation mapping',
  'Teaching Toy',
  'General Background',
];

export const symbols: SymbolCard[] = [
  { id: 'symbol:theta_s', kind: 'symbol', title: 'Shared parameters', symbol: 'θ_s', summary: '由多个任务共同使用的 CNN 参数。', category: 'Paper', runtimeType: '参数集合；可能映射到 backbone 参数', typicalShape: '由网络结构决定，不是单个固定张量', createdWhen: '预训练旧模型时已经存在', usedWhen: '旧、新任务分支共享表示时', trainable: 'Warm-up 冻结；joint-optimize 可训练', gradientSources: 'L_old、L_new、R（联合阶段）', optimizerMembership: '由训练阶段与实现中的 optimizer groups 决定', commonConfusion: '不是旧任务 head；parameter set 也不等于一张矩阵。', scenes: ['B', 'C', 'E', 'F', 'H', 'J'], related: ['formula:shared_gradient'], evidence: ['A01', 'A05'] },
  { id: 'symbol:theta_o', kind: 'symbol', title: 'Old-task parameters', symbol: 'θ_o', summary: '已有旧任务的专属输出参数。', category: 'Paper', runtimeType: '旧任务输出 head 参数集合', typicalShape: '类别数 × 共享表示宽度（随实现而定）', createdWhen: '旧任务训练期间', usedWhen: '旧模型生成旧响应；Student 生成当前旧输出', trainable: 'Warm-up 冻结；joint-optimize 可训练', gradientSources: 'L_old、R；不接收 L_new 的直接梯度', optimizerMembership: '实现选择；联合阶段通常纳入', commonConfusion: '下标 o 表示 old，不是数字 0。', scenes: ['B', 'C', 'D', 'E', 'H', 'J'], related: ['symbol:y_old', 'symbol:yhat_old'], evidence: ['A02', 'A05'] },
  { id: 'symbol:theta_n', kind: 'symbol', title: 'New-task parameters', symbol: 'θ_n', summary: '新任务到来时添加的输出参数。', category: 'Paper', runtimeType: '新任务 head 参数集合', typicalShape: '新类别数 × 共享表示宽度（随实现而定）', createdWhen: '新任务到来并扩展模型时', usedWhen: '产生新任务 logits 与预测', trainable: 'Warm-up 单独训练；joint-optimize 可训练', gradientSources: 'L_new、R；不接收 L_old 的直接梯度', optimizerMembership: '实现选择；warm-up 与联合阶段均训练', commonConfusion: '“new”是相对于当前阶段的角色；后续阶段它成为旧任务 head。', scenes: ['B', 'C', 'E', 'H', 'J'], related: ['symbol:theta_s', 'formula:total_loss'], evidence: ['A03', 'A05'] },
  { id: 'symbol:x_new', kind: 'symbol', title: 'New-task input', symbol: 'X_n', summary: '当前新任务的训练输入，也是 Teacher 生成旧任务响应时的输入。', category: 'Paper', runtimeType: '输入 Tensor / batch', typicalShape: '[B,C,H,W]（图像实现示意）', createdWhen: '当前新任务 DataLoader 产出时', usedWhen: 'Teacher 与 Student 前向', trainable: '不训练', gradientSources: '无参数梯度', optimizerMembership: '不属于 optimizer', commonConfusion: 'Teacher 在 X_n 上算出的 Y_o 不是旧图像 replay。', scenes: ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'J'], related: ['symbol:y_old'], evidence: ['C01', 'A04'] },
  { id: 'symbol:y_new', kind: 'symbol', title: 'New-task labels', symbol: 'Y_n', summary: '新任务数据集提供的真实监督标签。', category: 'Paper', runtimeType: '类别索引或目标 Tensor', typicalShape: '[B] 或 [B,C_n]', createdWhen: '随新任务训练样本提供', usedWhen: '计算 L_new', trainable: '不训练', gradientSources: '作为目标；梯度流向 Student 新分支', optimizerMembership: '不属于 optimizer', commonConfusion: '与 Teacher 给出的旧任务 response Y_o 是不同目标。', scenes: ['A', 'B', 'C', 'D', 'J'], related: ['formula:l_new'], evidence: ['F01'] },
  { id: 'symbol:y_old', kind: 'symbol', title: 'Recorded old-task response', symbol: 'Y_o', summary: '旧模型在当前 X_n 上计算的旧任务软响应。', category: 'Paper', runtimeType: 'response Tensor；作为固定 target 使用', typicalShape: '[B,C_old]', createdWhen: '当前阶段优化前，由旧模型前向生成', usedWhen: '与 Student 当前旧分支输出比较并计算 L_old', trainable: '不训练；target 侧无梯度', gradientSources: '不作为可训练参数', optimizerMembership: '不属于 optimizer', commonConfusion: '不是旧任务真实标签、旧图像或 replay memory。', scenes: ['B', 'C', 'D', 'G', 'H', 'J'], related: ['symbol:yhat_old', 'formula:l_old'], evidence: ['C02', 'A04'] },
  { id: 'symbol:yhat_old', kind: 'symbol', title: 'Student old-task response', symbol: 'Ŷ_o', summary: '当前扩展 Student 对 X_n 的旧任务输出。', category: 'Mechanism interpretation', runtimeType: '可微 Student logits 经温度变换后的概率', typicalShape: '[B,C_old]', createdWhen: 'Student 前向时', usedWhen: '作为 L_old 的预测端', trainable: '不是参数；计算图可微', gradientSources: 'L_old 梯度经过 θ_o 与共享 θ_s', optimizerMembership: '不属于 optimizer', commonConfusion: '不同于固定的 Teacher target Y_o。', scenes: ['C', 'D', 'J'], related: ['symbol:y_old', 'formula:l_old'], evidence: ['A04', 'F03'] },
  { id: 'symbol:yhat_new', kind: 'symbol', title: 'Student new-task response', symbol: 'Ŷ_n', summary: '当前扩展 Student 对 X_n 的新任务输出。', category: 'Mechanism interpretation', runtimeType: '可微 Student logits 或预测概率', typicalShape: '[B,C_new]', createdWhen: 'Student 前向时', usedWhen: '作为 L_new 的预测端', trainable: '不是参数；计算图可微', gradientSources: 'L_new 梯度经过 θ_n 与共享 θ_s', optimizerMembership: '不属于 optimizer', commonConfusion: '由新任务标签 Y_n 监督；它不是标签本身。', scenes: ['C', 'D', 'J'], related: ['symbol:y_new', 'formula:l_new'], evidence: ['F01'] },
  { id: 'symbol:temperature', kind: 'symbol', title: 'Temperature', symbol: 'T', summary: '重标定 Teacher 与 Student 的分类响应分布。', category: 'Paper', runtimeType: '正标量超参数', typicalShape: 'scalar；论文实验通常取 2', createdWhen: '训练配置确定时', usedWhen: '计算 temperature-transformed old responses', trainable: '不训练', gradientSources: '影响响应损失的数值与梯度', optimizerMembership: '不是模型参数', commonConfusion: '提高 T 不是旧任务保护百分比；论文公式可以写在概率空间或 logits 空间。', scenes: ['D', 'E', 'J'], related: ['formula:temperature'], evidence: ['A06', 'F02', 'F06'] },
  { id: 'symbol:lambda_old', kind: 'symbol', title: 'Old-response loss weight', symbol: 'λ_o', summary: '联合目标中旧响应损失的系数。', category: 'Paper', runtimeType: '非负标量超参数', typicalShape: 'scalar；多数实验设为 1', createdWhen: '训练配置确定时', usedWhen: '缩放 λ_o L_old', trainable: '不训练', gradientSources: '按链式法则缩放 L_old 的参数梯度', optimizerMembership: '不是模型参数', commonConfusion: 'λ_o=1 不等于两个任务各占 50%；实际贡献还依赖 loss、reduction、T 与梯度几何。', scenes: ['D', 'E', 'J'], related: ['formula:total_loss', 'formula:shared_gradient'], evidence: ['F04', 'F05'] },
  { id: 'symbol:regularization', kind: 'symbol', title: 'Regularization term', symbol: 'R', summary: '联合目标中的常规正则项。', category: 'Paper', runtimeType: '标量损失项', typicalShape: 'scalar', createdWhen: '组合优化目标时', usedWhen: '与 λ_o L_old 和 L_new 一起加入目标', trainable: 'R 本身不是参数；其梯度按正则项定义计算', gradientSources: '可对 θ_s、θ_o、θ_n 产生正则梯度', optimizerMembership: '由对应模型参数决定', commonConfusion: 'R 不是第三个任务的监督损失；其具体实现细节需看训练配置。', scenes: ['C', 'J'], related: ['formula:total_loss', 'formula:shared_gradient'], evidence: ['A05', 'F04'] },
  { id: 'symbol:shared_feature', kind: 'symbol', title: 'Shared feature', symbol: 'h', summary: '由共享网络对输入计算得到的中间表示。', category: 'Mechanism interpretation', runtimeType: 'activation Tensor', typicalShape: '[B,D]（分类 head 输入示意）', createdWhen: '共享 backbone 前向时', usedWhen: '旧、新任务 head 的共同输入', trainable: '不是参数；对训练图可微', gradientSources: '经两条输出路径回传到 θ_s', optimizerMembership: '不属于 optimizer', commonConfusion: '不是单独的可训练权重。', scenes: ['B', 'C', 'E', 'H', 'J'], related: ['symbol:theta_s'], evidence: ['A01', 'B03'] },
  { id: 'symbol:old_logits', kind: 'symbol', title: 'Old-task logits', symbol: 'z_o', summary: '旧任务分类头输出的未归一化分数。', category: 'Implementation mapping', runtimeType: 'Tensor', typicalShape: '[B,C_old]', createdWhen: 'Student 旧分支前向时', usedWhen: 'softmax / temperature transform 后参与 L_old', trainable: '不是参数；图中可微', gradientSources: 'L_old 对 z_o 的导数', optimizerMembership: '不属于 optimizer', commonConfusion: 'logits 不是概率；数值可为任意实数。', scenes: ['C', 'D', 'J'], related: ['formula:l_old', 'symbol:temperature'], evidence: ['F02', 'F03'] },
];

export const formulas: FormulaCard[] = [
  { id: 'formula:l_new', kind: 'formula', title: 'New-task objective', summary: '使用新任务真实标签监督新任务输出。', category: 'Paper', expression: 'L_new = −Y_n · log Ŷ_n', variables: ['Y_n', 'Ŷ_n'], meaning: '多类逻辑回归交叉熵；具体 reduction 属于实现细节。', codeMapping: 'task_loss(new_logits, y_new)', scenes: ['C', 'D', 'E', 'J'], related: ['symbol:y_new', 'symbol:theta_n'], evidence: ['F01'] },
  { id: 'formula:l_old', kind: 'formula', title: 'Old-response preservation loss', summary: '用温度变换后的 Teacher response 监督 Student 旧任务输出。', category: 'Paper', expression: 'L_old = −Σ_i y′_o(i) log ŷ′_o(i)', variables: ['Y_o', 'Ŷ_o', 'T'], meaning: '逐旧类别交叉熵；Teacher target 不回传梯度，Student 预测端可微。', codeMapping: 'response_loss(teacher_target, student_old_logits, temperature=T)', scenes: ['C', 'D', 'E', 'J'], related: ['symbol:y_old', 'symbol:yhat_old', 'symbol:temperature'], evidence: ['F02', 'F03'] },
  { id: 'formula:total_loss', kind: 'formula', title: 'Combined objective', summary: '联合旧响应保持、新任务学习与普通 weight decay。', category: 'Paper', expression: 'L = λ_o L_old + L_new + R(θ_s, θ_o, θ_n)', variables: ['λ_o', 'L_old', 'L_new', 'R'], meaning: 'warm-up 阶段的可训练参数另受冻结策略限制；该式不表示三组参数每阶段都更新。', codeMapping: 'loss = lambda_old * loss_old + loss_new + regularization', scenes: ['C', 'D', 'E', 'J'], related: ['formula:l_old', 'formula:l_new'], evidence: ['F04', 'A05'] },
  { id: 'formula:temperature', kind: 'formula', title: 'Temperature transform', summary: '在概率空间提升每个响应的 1/T 次方并重新归一化。', category: 'Paper', expression: 'p_i^(T) = p_i^(1/T) / Σ_j p_j^(1/T)', variables: ['p_i', 'T'], meaning: '对 softmax 概率先变换再归一化；等价 logits 写法为 softmax(z/T)。', codeMapping: 'softmax(logits / T)', scenes: ['D', 'E', 'J'], related: ['symbol:temperature'], evidence: ['F02', 'A06'] },
  { id: 'formula:shared_gradient', kind: 'formula', title: 'Shared-parameter gradient composition', summary: '旧、新任务目标以及正则化对共享参数的梯度相加。', category: 'Mechanism interpretation', expression: '∇θ_s L = λ_o ∇θ_s L_old + ∇θ_s L_new + ∇θ_s R', variables: ['θ_s', 'λ_o', 'L_old', 'L_new', 'R'], meaning: '目标在共享参数区相遇；损失系数不是梯度夹角或更新百分比。', codeMapping: 'loss.backward(); optimizer.step() applies updates only to eligible parameters', scenes: ['C', 'D', 'E', 'J'], related: ['symbol:theta_s', 'symbol:lambda_old'], evidence: ['F04', 'A05'] },
  { id: 'formula:parameter_l2', kind: 'formula', title: 'Parameter-L2 preservation baseline', summary: '论文对照基线约束当前共享权重靠近旧权重。', category: 'Paper', expression: 'L_param = L_new + (λ/2) ||w − w₀||²₂', variables: ['w', 'w₀', 'λ'], meaning: '这是 parameter-preservation baseline，不是主 LwF response loss。', codeMapping: 'weight penalty against a saved old-parameter snapshot', scenes: ['F', 'I'], related: ['formula:l_old'], evidence: ['C11'] },
  { id: 'formula:response_preservation', kind: 'formula', title: 'Response preservation on observed inputs', summary: '在当前新任务样本 X_n 上比较 Teacher 与 Student 旧任务响应。', category: 'Mechanism interpretation', expression: 'D(f_old(X_n), f_student(X_n))', variables: ['X_n', 'f_old', 'f_student'], meaning: '直接约束观察到的输出行为；并不推出所有旧域输入上的全局等价。', codeMapping: 'match teacher targets and student old-head outputs for each current new-task batch', scenes: ['F', 'G', 'H'], related: ['symbol:x_new', 'symbol:y_old'], evidence: ['C02', 'C07', 'C11'], boundary: '约束仅覆盖所见的 X_n。' },
  { id: 'formula:sgd_step', kind: 'formula', title: 'Plain SGD step', summary: '梯度计算与参数更新分属 backward 与 optimizer step。', category: 'General Background', expression: 'θ ← θ − η g', variables: ['θ', 'η', 'g'], meaning: '教学 toy 的 plain-SGD 更新式；论文实验使用 SGD，但实际优化器细节要依设置说明。', codeMapping: 'optimizer.step()', scenes: ['C', 'E', 'J'], related: ['formula:shared_gradient'], evidence: ['I03'] },
];

export const datasets: DatasetCard[] = [
  { id: 'dataset:imagenet', kind: 'dataset', title: 'ImageNet', summary: '大规模自然图像物体分类数据集。', category: 'General Background', taskType: '自然图像物体分类', inputType: '彩色自然图像', classes: '1,000 类', paperRole: '常作为旧任务或预训练来源', paperRelation: '与 CUB、Places365、VOC 等组成不同任务对；论文将 ImageNet→MNIST 作为高度不相似案例。', whyItMatters: '可观察旧任务保持，也用于多种新任务适配实验。', experiments: ['Table 1(a): ImageNet → CUB', 'Table 1(b): ImageNet → Scenes', 'ImageNet → MNIST'], scenes: ['G', 'H', 'I'], evidence: ['E01', 'E05'] },
  { id: 'dataset:places365', kind: 'dataset', title: 'Places365', summary: '场景分类数据集，包含 365 类。', category: 'General Background', taskType: '场景分类', inputType: '彩色场景图像', classes: '365 类', paperRole: '常作为旧任务', paperRelation: '论文把 Places365 与 MIT Indoor Scenes 描述为相对相似，与 CUB 描述为不相似。', whyItMatters: 'Places365→CUB 是旧任务退化较明显的被报告案例之一。', experiments: ['Places365 → VOC', 'Places365 → CUB', 'Places365 → Scenes', 'Figure 4 sequence'], scenes: ['G', 'H', 'I'], evidence: ['E05'] },
  { id: 'dataset:voc', kind: 'dataset', title: 'PASCAL VOC 2012', summary: '自然图像多标签物体识别任务。', category: 'General Background', taskType: '多标签物体识别', inputType: '彩色自然图像；一张图像可含多种类别', classes: '20 类物体标签', paperRole: '新任务；VOC 2012 train set 按类别拆分顺序阶段', paperRelation: '论文将 VOC 与 ImageNet 描述为相对相似。', whyItMatters: '顺序实验按 transport、animals、objects 拆标签子集，图像会共享，不能当作互斥数据集。', experiments: ['Table 1: ImageNet / Places365 → VOC', 'Figure 4: Places365 → VOC parts'], scenes: ['G', 'H', 'I'], evidence: ['C09'] },
  { id: 'dataset:cub', kind: 'dataset', title: 'CUB-200-2011', summary: '细粒度鸟类识别数据集。', category: 'General Background', taskType: '细粒度鸟类分类', inputType: '彩色鸟类自然图像', classes: '200 类鸟种', paperRole: '新任务', paperRelation: '论文认为它与 ImageNet / Places365 相对不相似。', whyItMatters: '类别差异细、要求区分鸟类内部特征；用于说明任务对差异与旧响应覆盖边界。', experiments: ['Table 1(a): ImageNet → CUB', 'Places365 → CUB'], scenes: ['G', 'I'], evidence: ['E01', 'E05'] },
  { id: 'dataset:scenes', kind: 'dataset', title: 'MIT Indoor Scenes', summary: '室内场景分类数据集。', category: 'General Background', taskType: '室内场景分类', inputType: '室内场景图像', classes: '67 类', paperRole: '新任务；顺序实验按房间大小分成子任务', paperRelation: '论文认为它与 Places365 相对相似。', whyItMatters: 'Figure 4 中与 ImageNet 或 Places365 构成逐步添加任务的序列。', experiments: ['Table 1(b): ImageNet → Scenes', 'Figure 4: ImageNet → Scenes parts'], scenes: ['G', 'H', 'I'], evidence: ['E05'] },
  { id: 'dataset:mnist', kind: 'dataset', title: 'MNIST', summary: '手写数字图像分类数据集。', category: 'General Background', taskType: '手写数字分类', inputType: '28×28 灰度图', classes: '10 类：数字 0–9', paperRole: 'ImageNet→MNIST 的高度不相似新任务案例', paperRelation: '论文将其视为与 ImageNet 高度不相关的 deliberately dissimilar task。', whyItMatters: '用于讨论新输入上的旧响应可能无法充分约束 ImageNet 旧任务行为；不把这种关系写成数值距离。', experiments: ['ImageNet → MNIST'], scenes: ['G', 'I'], evidence: ['E05'] },
];

export const methods: MethodCard[] = [
  { id: 'method:feature_extraction', kind: 'method', title: 'Feature Extraction', summary: '冻结共享表示，仅训练新任务输出头。', category: 'Paper', oldDataRequired: '否', oldLabelsRequired: '否', oldModelRequired: '是', sharedTrainable: '否；θ_s 冻结', newHeadTrainable: '是', oldResponseConstraint: '无显式旧响应约束；旧分支保持', scenes: ['A', 'E', 'I'], evidence: ['C06'] },
  { id: 'method:fine_tuning', kind: 'method', title: 'Fine-tuning', summary: '用新任务监督更新共享表示和新任务 head。', category: 'Paper', oldDataRequired: '否', oldLabelsRequired: '否', oldModelRequired: '是', sharedTrainable: '是', newHeadTrainable: '是', oldResponseConstraint: '否', scenes: ['A', 'E', 'I'], evidence: ['C06'] },
  { id: 'method:fine_tune_fc', kind: 'method', title: 'Fine-tune FC', summary: '将全连接部分纳入更新的对比方案。', category: 'Paper', oldDataRequired: '否', oldLabelsRequired: '否', oldModelRequired: '是', sharedTrainable: '部分全连接层可训练', newHeadTrainable: '是', oldResponseConstraint: '否', scenes: ['I'], evidence: ['A08'] },
  { id: 'method:joint_training', kind: 'method', title: 'Joint Training', summary: '新旧任务样本与真实标签共同监督训练。', category: 'Paper', oldDataRequired: '是', oldLabelsRequired: '是', oldModelRequired: '可从旧模型初始化', sharedTrainable: '是', newHeadTrainable: '是', oldResponseConstraint: '通过旧真实标签提供监督', scenes: ['A', 'G', 'I'], evidence: ['C06'] },
  { id: 'method:lwf', kind: 'method', title: 'Learning without Forgetting', summary: '在新任务输入上匹配旧模型的旧任务响应，并学习新任务标签。', category: 'Paper', oldDataRequired: '否', oldLabelsRequired: '否', oldModelRequired: '是', sharedTrainable: 'Warm-up 冻结；joint-optimize 可训练', newHeadTrainable: '是', oldResponseConstraint: '是；Teacher(X_n)', scenes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], evidence: ['C01', 'C02', 'C03', 'C05'] },
  { id: 'method:parameter_l2', kind: 'method', title: 'Parameter-L2 baseline', summary: '用软参数惩罚让共享权重靠近旧参数。', category: 'Paper', oldDataRequired: '否', oldLabelsRequired: '否', oldModelRequired: '是；需保存旧参数', sharedTrainable: '是并受距离惩罚', newHeadTrainable: '是', oldResponseConstraint: '否；约束参数值', scenes: ['F', 'I'], evidence: ['C11'] },
  { id: 'method:network_expansion', kind: 'method', title: 'Network Expansion', summary: '按任务扩展网络容量的架构对照。', category: 'Paper', oldDataRequired: '否（扩展架构实验条件）', oldLabelsRequired: '否', oldModelRequired: '是', sharedTrainable: '随架构设计而定', newHeadTrainable: '是', oldResponseConstraint: '不一定；单独 expansion 与 expansion + LwF 是不同配置', scenes: ['B', 'I'], evidence: ['A08'] },
  { id: 'method:network_expansion_lwf', kind: 'method', title: 'Network Expansion + LwF', summary: '将网络扩展与旧响应保持结合的消融变体。', category: 'Paper', oldDataRequired: '否', oldLabelsRequired: '否', oldModelRequired: '是', sharedTrainable: '按扩展结构设置', newHeadTrainable: '是', oldResponseConstraint: '是', scenes: ['B', 'I'], evidence: ['A08'] },
  { id: 'method:lfl_loss_variants', kind: 'method', title: 'LwF response-loss variants', summary: '替换旧响应之间的相似度损失进行比较。', category: 'Paper', oldDataRequired: '否', oldLabelsRequired: '否', oldModelRequired: '是', sharedTrainable: 'joint-optimize 可训练', newHeadTrainable: '是', oldResponseConstraint: '是；KD、cross-entropy、L1 或 L2 等对照', scenes: ['D', 'I'], evidence: ['C11'] },
];

export const trainingPhases: PhaseCard[] = [
  { id: 'phase:old_model', kind: 'phase', title: 'Old model', summary: '旧任务训练完成的模型快照。', category: 'Paper', thetaS: '已训练', thetaO: '已训练', thetaN: '尚不存在', mainAction: '旧任务预测；随后作为 Teacher 使用。', scenes: ['A', 'B', 'J'], evidence: ['A01', 'A02'] },
  { id: 'phase:record_responses', kind: 'phase', title: 'Record responses', summary: 'Teacher 在当前新任务输入上生成旧任务响应。', category: 'Paper', thetaS: '冻结', thetaO: '冻结', thetaN: '尚不存在或待创建', mainAction: '计算并保存与样本对应的 Y_o。', scenes: ['B', 'D', 'J'], evidence: ['A04', 'A07'] },
  { id: 'phase:warmup', kind: 'phase', title: 'Warm-up', summary: '先单独训练新任务 head。', category: 'Paper', thetaS: '冻结', thetaO: '冻结', thetaN: '训练', mainAction: '用 Y_n 学习新增输出参数。', scenes: ['B', 'C', 'J'], evidence: ['A05'] },
  { id: 'phase:joint', kind: 'phase', title: 'Joint optimization', summary: '联合旧响应、新标签与正则化目标。', category: 'Paper', thetaS: '训练', thetaO: '训练', thetaN: '训练', mainAction: '计算联合损失、backward，再由优化器更新可训练参数。', scenes: ['B', 'C', 'D', 'E', 'J'], evidence: ['A05', 'F04'] },
];

export const confusions: ConfusionCard[] = [
  { id: 'confusion:theta_o', kind: 'confusion', title: 'θ_o 是字母 o，不是数字 0', summary: '记号里的 o 指旧任务（old）。', question: '下标 o 表示什么？', answer: 'o 表示 old task 的旧任务输出参数。', category: 'General Background', scenes: ['B'], related: ['symbol:theta_o'] },
  { id: 'confusion:y_old', kind: 'confusion', title: 'Y_o 不是旧任务真实标签', summary: 'Y_o 是旧模型对当前新任务输入生成的响应。', question: 'Y_o 是什么？', answer: '旧模型对当前新任务输入 X_n 产生的旧任务响应；不是旧真值，也不是回放旧图像。', category: 'Paper', scenes: ['B', 'D', 'G'], related: ['symbol:y_old'], evidence: ['C02'] },
  { id: 'confusion:backward', kind: 'confusion', title: 'backward 不直接更新参数', summary: '反向传播计算梯度，优化器步骤应用参数更新。', question: 'backward() 会改变参数值吗？', answer: '不会。它计算梯度；optimizer.step() 才尝试更新其参数组中的参数。', category: 'Implementation mapping', scenes: ['C', 'J'], related: ['formula:sgd_step'], evidence: ['I03'] },
  { id: 'confusion:freeze_detach', kind: 'confusion', title: 'freeze 不等于 detach', summary: '冻结参数状态和切断计算图是不同操作。', question: '冻结参数是否会切断计算图？', answer: '不必然。冻结通常是不为该参数累积梯度；若计算图仍连通，梯度仍可穿过该运算回到更早的可训练参数。', category: 'General Background', scenes: ['C', 'J'], evidence: ['I03'] },
  { id: 'confusion:lambda_share', kind: 'confusion', title: 'λ_o=1 不等于 50/50', summary: '损失系数不是任务贡献百分比。', question: '旧、新任务各贡献一半吗？', answer: '不是。λ_o 是 loss coefficient；梯度量级、方向、温度、reduction 和 batch scaling 共同影响实际更新。', category: 'Mechanism interpretation', scenes: ['E', 'I'], related: ['symbol:lambda_old'], evidence: ['F05'] },
  { id: 'confusion:global_function', kind: 'confusion', title: '响应保持不是全局函数不变', summary: '输出约束只覆盖训练时观察到的新任务输入。', question: '匹配 Y_o 是否证明所有旧输入都不变？', answer: '不证明。约束只作用于训练中观察到的新任务输入 X_n。', category: 'Mechanism interpretation', scenes: ['F', 'G', 'H'], related: ['formula:response_preservation'], evidence: ['C07', 'C11'] },
  { id: 'confusion:sequential_refresh', kind: 'confusion', title: '旧任务响应会随新阶段重算', summary: '每加入一个任务，旧任务 Teacher 都在当前新任务输入上重新生成响应目标。', question: '第一阶段的旧响应会作为一份永久 cache 一直沿用吗？', answer: '不会。每次加入新任务时，当前 Teacher 会在这一阶段的新任务输入上重新计算所有旧任务响应；较早任务的 Y_o 因此会随阶段变化。这不需要取回旧任务训练图像或标签。', category: 'Paper', scenes: ['H'], related: ['evidence:figure_4', 'symbol:y_old'], evidence: ['E05'] },
  { id: 'confusion:stability_plasticity', kind: 'confusion', title: '稳定性—可塑性是目标张力的教学解读', summary: '旧响应保持与新任务学习共同作用于共享参数 θ_s。', question: 'λ_o 能直接设定旧、新任务的准确率比例吗？', answer: '不能。λ_o 只改变目标中 L_old 的相对权重；实际更新还取决于两项损失的梯度等因素。这是对目标张力的教学解读，不是准确率保证。', category: 'Mechanism interpretation', scenes: ['E', 'I'], related: ['formula:total_loss', 'symbol:lambda_old'], evidence: ['F04', 'F05'] },
  { id: 'confusion:jacobian', kind: 'confusion', title: 'Jacobian：参数变化与输出变化的局部关系', summary: '作为进阶背景，Jacobian 描述输出对参数微小变化的局部敏感度。', question: '参数距离能否直接代表旧任务输出变化？', answer: '不能直接等同。不同参数方向可能以不同方式影响输出。这里仅提供一般局部敏感度背景，不是 LwF 的训练目标、论文中的定量结果或本教程的实验数据。', category: 'General Background', scenes: ['F'], related: ['formula:parameter_l2', 'formula:response_preservation'] },
];

export const evidenceCards: EvidenceCard[] = [
  { id: 'evidence:table_1', kind: 'evidence', title: 'Table 1 · 单次新任务比较', summary: '对照 feature extraction、fine-tuning、LwF 与 joint training 等方法。', category: 'Paper', measures: '多个视觉分类任务对的 old-task 与 new-task 表现；VOC 使用 mAP，其余主要用 accuracy。', supports: '在论文测试的大多数任务对中，LwF 相对 fine-tuning 减少旧任务退化，同时通常比 feature extraction 更能适配新任务。', doesNotEstablish: '不证明 LwF 消除遗忘或普遍优于 joint training；表内部分值是相对 LwF 的差值。', location: 'PDF p.7；任务协议 p.6', scenes: ['I'], related: ['dataset:imagenet', 'dataset:cub', 'method:lfl'], evidence: ['E01', 'E02', 'E03', 'E04', 'E05'] },
  { id: 'evidence:table_2', kind: 'evidence', title: 'Table 2 · 架构与训练消融', summary: '检查 task-specific layers、network expansion、学习率、warm-up 等设计。', category: 'Paper', measures: 'ImageNet→CUB 上不同架构与训练设置的比较。', supports: '额外 task-specific layers、network expansion 或较低共享学习率没有显示一致优势；warm-up 对 LwF 并非关键条件。', doesNotEstablish: '不证明这些替代设置在所有架构、任务或超参数下都无效。', location: 'PDF p.9', scenes: ['B', 'I'], related: ['method:network_expansion', 'phase:warmup'], evidence: ['A08', 'C05'] },
  { id: 'evidence:figure_4', kind: 'evidence', title: 'Figure 4 · 连续加入任务', summary: 'Places365→VOC 与 ImageNet→Scenes 两组设置中，将新任务类别分批加入并观察各任务表现。', category: 'Paper', measures: '每阶段显示各任务表现；横轴标出新加入的任务，误差线为 3 次不同 θ_n 随机初始化的 ±2 个标准差。VOC 使用 mAP，其余任务使用 accuracy。', supports: '在这些测试设置中，LwF 随时间退化慢于 fine-tuning，并在多数情形优于 feature extraction；旧任务表现仍可能下降，且每阶段会重算旧任务响应。', doesNotEstablish: '不证明 LwF 消除遗忘，也不建立退化必然线性或单调累积的规律。', location: 'PDF p.8 · §IV-A', scenes: ['H', 'I'], related: ['dataset:voc', 'dataset:scenes'], evidence: ['E05'] },
  { id: 'evidence:figure_7', kind: 'evidence', title: 'Figure 7 · 目标与损失选择', summary: '比较 λ_o 设置、parameter-L2 baseline 与多种 response loss。', category: 'Paper', measures: 'old-task / new-task operating points 及 response-loss 变体比较。', supports: '论文实验中，响应正则优于所测试的 parameter-L2 baseline；KD 略优但与其他 response losses 差异不大。', doesNotEstablish: '不构成严格 Pareto frontier，也不证明任意 response loss 完全等价。', location: 'PDF pp.9–10', scenes: ['D', 'E', 'F', 'I'], related: ['formula:parameter_l2', 'formula:response_preservation'], evidence: ['C04', 'C08', 'C11'] },
  { id: 'evidence:tracking', kind: 'evidence', title: 'Tracking appendix · MD-Net', summary: '附录报告一项 VOT 2015 跟踪比较。', category: 'Paper', measures: 'Expected average overlap：MD-Net 0.373，MD-Net + LwF 0.383。', supports: '作为作者探索跟踪任务的单项附录结果。', doesNotEstablish: '论文称差异没有统计显著性；不能把它当作显著提升或广泛跟踪保证。', location: 'PDF pp.12–13', scenes: ['I'], evidence: ['E06'] },
];

export const claims: ClaimCard[] = [
  { id: 'claim:reduces_forgetting', kind: 'claim', title: 'LwF reduces forgetting relative to fine-tuning', summary: '限定在论文测试设置中，LwF 通常比直接 fine-tuning 保留更多旧任务表现。', category: 'Paper', verdict: 'Supported', supportingEvidence: ['evidence:table_1', 'evidence:figure_4'], scenes: ['A', 'I'], evidence: ['C06'] },
  { id: 'claim:retains_plasticity', kind: 'claim', title: 'LwF retains more new-task plasticity than feature extraction', summary: '在多个测试设置中，LwF 通常比冻结共享表示的 feature extraction 更能学习新任务。', category: 'Paper', verdict: 'Supported', supportingEvidence: ['evidence:table_1'], scenes: ['A', 'E', 'I'], evidence: ['C06'] },
  { id: 'claim:similar_to_joint', kind: 'claim', title: 'LwF is generally equivalent to joint training', summary: '把局部任务对表现概括为所有模型与任务都等价，超出了证据。', category: 'Paper', verdict: 'Too strong', supportingEvidence: ['evidence:table_1'], scenes: ['I'], evidence: ['C06'] },
  { id: 'claim:domain_mismatch', kind: 'claim', title: 'Task mismatch can weaken response coverage', summary: '作者讨论 CUB、MNIST 等任务对时指出分布或任务差异可能使新输入上的旧响应约束不足。', category: 'Author interpretation', verdict: 'Supported', supportingEvidence: ['evidence:table_1', 'evidence:figure_4'], scenes: ['F', 'G', 'I'], evidence: ['C07'] },
  { id: 'claim:response_beats_parameter', kind: 'claim', title: 'Response regularization beats the tested parameter-L2 baseline', summary: '只限论文 Figure 7 所测试的设置。', category: 'Paper', verdict: 'Supported', supportingEvidence: ['evidence:figure_7'], scenes: ['F', 'I'], evidence: ['C11'] },
  { id: 'claim:any_response_loss', kind: 'claim', title: 'Any response loss works identically', summary: 'KD 略优而差异不大，不能扩大为所有损失完全相同。', category: 'Paper', verdict: 'Too strong', supportingEvidence: ['evidence:figure_7'], scenes: ['D', 'I'], evidence: ['C08'] },
  { id: 'claim:warmup_unnecessary', kind: 'claim', title: 'Warm-up is not crucial to LwF in the reported ablation', summary: '作者在所测设置中认为 warm-up 对 LwF 不是关键。', category: 'Paper', verdict: 'Supported', supportingEvidence: ['evidence:table_2'], scenes: ['B', 'C', 'I'], evidence: ['C05'] },
  { id: 'claim:sequential_degradation', kind: 'claim', title: 'Sequential addition can still degrade old-task performance', summary: 'Figure 4 的任务序列展示旧任务仍可能退化；不意味着每个任务每一步必然下降。', category: 'Paper', verdict: 'Supported', supportingEvidence: ['evidence:figure_4'], scenes: ['H', 'I'], evidence: ['C06'] },
  { id: 'claim:eliminates_forgetting', kind: 'claim', title: 'LwF eliminates catastrophic forgetting', summary: '绝对化保证超过论文证据。', category: 'Paper', verdict: 'Too strong', supportingEvidence: ['evidence:table_1', 'evidence:figure_4'], scenes: ['I'], evidence: ['C06', 'C07'] },
  { id: 'claim:no_old_training_data', kind: 'claim', title: 'LwF adapts without old-task training data', summary: '在论文的问题设定与报告的适配方法中，LwF 不取回旧任务训练图像或标签。', category: 'Paper', verdict: 'Supported', supportingEvidence: ['evidence:table_1'], scenes: ['A', 'I'], related: ['method:lwf'], evidence: ['C01', 'A07'] },
  { id: 'claim:foundation_models_scope', kind: 'claim', title: 'LwF works on foundation models', summary: '论文的系统主实验集中于视觉分类，并包含一项跟踪附录实验；没有检验 foundation models。', category: 'Paper', verdict: 'Not directly tested', supportingEvidence: [], scenes: ['I'], related: ['evidence:table_1', 'evidence:tracking'], evidence: ['C09'] },
  { id: 'claim:kd_necessary', kind: 'claim', title: 'A KD loss is necessary for LwF', summary: '论文比较多种 response loss；实验更支持保持旧输出这一设计，不支持 KD 名称本身不可替代。', category: 'Paper', verdict: 'Not directly tested', supportingEvidence: ['evidence:figure_7'], scenes: ['D', 'I'], evidence: ['C08'] },
];

export const allKnowledgeCards: KnowledgeCard[] = [
  ...symbols, ...formulas, ...datasets, ...methods, ...trainingPhases, ...confusions, ...evidenceCards, ...claims,
];

export const knowledgeById = new Map(allKnowledgeCards.map((card) => [card.id, card]));
