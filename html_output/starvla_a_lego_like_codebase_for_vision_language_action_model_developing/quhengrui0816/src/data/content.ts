/* 共享内容数据：动作头 / 骨干 / 组合成绩 / 基准 / 实验数据
   所有数字均来自论文（arXiv:2604.05014）正文表格 */

export type HeadId = "fast" | "oft" | "pi" | "groot";
export type BackboneId = "qwen" | "cosmos";

export interface HeadInfo {
  id: HeadId;
  name: string;
  color: string;
  deep: string;
  tagline: string;      // 一句话原理
  family: string;       // 谱系
  mechanism: string;    // 机制描述（对比小表用）
  stageHint: string;    // 剧场字幕
}

export const HEADS: HeadInfo[] = [
  {
    id: "fast",
    name: "StarVLA-FAST",
    color: "var(--c-fast)",
    deep: "var(--red-deep)",
    tagline: "像写作文一样，把动作一个 token 一个 token「念」出来",
    family: "VLM 原生 · 自回归",
    mechanism: "FAST 分词器把连续动作离散成 token，直接复用 LLM 词表做 next-token 预测",
    stageHint: "动作被切成离散 token，自回归逐个生成 —— 复用语言模型自己的词表，最省事，但速度慢、精度受离散化限制。",
  },
  {
    id: "oft",
    name: "StarVLA-OFT",
    color: "var(--c-oft)",
    deep: "var(--blue-deep)",
    tagline: "一个轻量 MLP，一次前向，8 步动作同时出炉",
    family: "VLM 原生 · 并行回归",
    mechanism: "读取预定 action token 的 hidden states，MLP 并行回归连续动作（L1 损失）",
    stageHint: "动作头上只有一个轻量 MLP：一次前向传播，整段动作块同时回归出来 —— 最快、最简单，成绩却常常最好。",
  },
  {
    id: "pi",
    name: "StarVLA-π",
    color: "var(--c-pi)",
    deep: "var(--purple-deep)",
    tagline: "从一团噪声出发，迭代去噪出平滑动作轨迹",
    family: "生成式 · 流匹配",
    mechanism: "逐层 cross-DiT 流匹配动作专家，交叉注意力读取多层 VLM hidden states，迭代去噪",
    stageHint: "动作从纯噪声开始，经过约 10 步去噪逐渐「显影」成平滑轨迹 —— 能表达多峰动作分布，代价是多步迭代。",
  },
  {
    id: "groot",
    name: "StarVLA-GR00T",
    color: "var(--c-groot)",
    deep: "var(--green-deep)",
    tagline: "系统 2 慢慢想，系统 1 快快做",
    family: "双系统 · 快慢分工",
    mechanism: "VLM 作系统 2 负责场景推理，DiT 流匹配模块作系统 1 负责快速动作生成",
    stageHint: "VLM 骨干扮演「系统 2」缓慢推理场景与子目标，DiT 动作专家扮演「系统 1」快速反射出动作 —— 连推理节奏都能换。",
  },
];

export interface BackboneInfo {
  id: BackboneId;
  name: string;
  color: string;
  kind: string;
  sub: string;
}

export const BACKBONES: BackboneInfo[] = [
  {
    id: "qwen",
    name: "Qwen3-VL-4B",
    color: "var(--blue)",
    kind: "VLM 骨干",
    sub: "指令微调的视觉-语言模型，擅长语言对齐与场景理解",
  },
  {
    id: "cosmos",
    name: "Cosmos-Predict2-2B",
    color: "var(--purple)",
    kind: "世界模型骨干",
    sub: "视频生成式世界模型，自带物理动态先验",
  },
];

/* LIBERO 四套件平均成功率（%，30K 步，论文 Table 2）；null = 论文未报告 */
export const LIBERO_COMBO: Record<BackboneId, Record<HeadId, number | null>> = {
  qwen:   { fast: 95.4, oft: 96.6, pi: 95.7, groot: 96.5 },
  cosmos: { fast: null, oft: 95.8, pi: 95.5, groot: 95.2 },
};

/* §1 巴比塔：互不通电的三个阵营 */
export interface Camp {
  id: string;
  name: string;
  color: string;
  plug: "circle" | "square" | "triangle";
  desc: string;
  stack: string;
}
export const CAMPS: Camp[] = [
  { id: "pi0", name: "π0 阵营", color: "var(--purple)", plug: "circle", desc: "流匹配生成动作，代码与自家数据管线深度绑定", stack: "OpenPI" },
  { id: "openvla", name: "OpenVLA 阵营", color: "var(--blue)", plug: "square", desc: "自回归离散 token，整套预处理为自家骨干定制", stack: "OpenVLA-OFT" },
  { id: "groot", name: "GR00T 阵营", color: "var(--green)", plug: "triangle", desc: "双系统架构，评测协议又是一套自己的玩法", stack: "Isaac-GR00T" },
];

/* §5 遗忘曲线（趋势复刻论文 Figure 4 与 Table 8） */
export const FORGET_STEPS_MAX = 50; // 单位：K 步

export interface CurveSet { see: [number, number][]; act: [number, number][]; }

export const FORGET_CURVES: Record<"vanilla" | "cotrain", CurveSet> = {
  vanilla: {
    // 感知（RefCOCO-g IoU@0.5）：20K 步内崩塌到接近随机
    see: [[0, 80], [3, 62], [7, 38], [12, 18], [18, 7], [25, 5], [35, 4], [50, 4]],
    // 操作（WidowX 成功率 %）：缓慢爬升到 54.7（Table 8）
    act: [[0, 2], [5, 18], [10, 32], [18, 44], [28, 51], [40, 54], [50, 54.7]],
  },
  cotrain: {
    // 感知：有波动但守住约 70% 的原水平（ST4VLA 保住 71.2）
    see: [[0, 80], [4, 66], [9, 71], [14, 62], [20, 68], [27, 63], [35, 69], [43, 66], [50, 71.2]],
    // 操作：爬得更高更稳（73.2）
    act: [[0, 2], [5, 22], [10, 40], [18, 55], [28, 65], [40, 71], [50, 73.2]],
  },
};

/* §6 基准客户端 */
export interface Bench {
  id: string;
  name: string;
  kind: string;
  note: string;
  real?: boolean;
}
export const BENCHES: Bench[] = [
  { id: "libero", name: "LIBERO", kind: "仿真", note: "130 个桌面操作任务，4 个套件" },
  { id: "simpler", name: "SimplerEnv", kind: "仿真", note: "WidowX / Google Robot 真机代理评测" },
  { id: "robotwin", name: "RoboTwin 2.0", kind: "仿真", note: "50 个双臂任务 × 10000 次评测" },
  { id: "real", name: "真实机器人", kind: "真机", note: "同一 checkpoint，不换模型代码", real: true },
];

/* §7-a 效率：达到同等 LIBERO 水平的训练步数 */
export const EFFICIENCY_ROWS = [
  { who: "OpenVLA-OFT", sub: "官方报告", steps: 175, score: 97.1, ours: false },
  { who: "GR00T-N1.5", sub: "官方报告", steps: 20, score: 86.5, ours: false },
  { who: "StarVLA-OFT", sub: "本工作，同样分数带", steps: 30, score: 96.6, ours: true },
];

/* §7-b 专才 vs 通才（Table 9：StarVLA-OFT specialist vs Generalist） */
export const GENERALIST_ROWS = [
  { name: "LIBERO 平均", spec: 98.8, gen: 97.8 },
  { name: "SimplerEnv WidowX", spec: 64.6, gen: 70.2 },
  { name: "SimplerEnv Google VM", spec: 76.0, gen: 79.3 },
  { name: "RoboTwin 2.0 clean", spec: 88.2, gen: 88.7 },
  { name: "RoboCasa-GR1 (24 任务)", spec: 53.8, gen: 57.3 },
];

/* §7-c 多机扩展（Table 11，per-GPU batch=8） */
export const SCALING = [
  { gpus: 8, sps: 87.0 },
  { gpus: 16, sps: 150.7 },
  { gpus: 32, sps: 284.7 },
  { gpus: 64, sps: 553.8 },
  { gpus: 128, sps: 1111.5 },
  { gpus: 256, sps: 2200.0 },
];

/* 能力矩阵（Table 1） */
export const MATRIX_COLS = ["可换动作头", "可换 VLM 骨干", "世界模型骨干", "混合数据加载", "多模态共训", "跨本体共训", "接入基准数"];
export const MATRIX_ROWS: { name: string; cells: (boolean | string)[]; ours?: boolean }[] = [
  { name: "OpenPI", cells: [false, false, false, true, true, true, "2"] },
  { name: "Isaac-GR00T", cells: [false, false, false, true, true, true, "6"] },
  { name: "OpenVLA-OFT", cells: [false, false, false, false, false, false, "1"] },
  { name: "Dexbotic", cells: [true, true, false, true, true, false, "5"] },
  { name: "X-VLA", cells: [true, false, false, true, false, true, "5"] },
  { name: "StarVLA", cells: [true, true, true, true, true, true, "7"], ours: true },
];

/* 导航章节：subs 为该章包含的所有（子）幕 id，用于目录分组与高亮
   叙述顺序：痛感 → 能力总览 → 实现（契约/拼装） → 结论（公式/动作头）
   → 评测架构 → 训练配方（清单/遗忘实验） → 数据结论 → 收束 */
export const ACTS = [
  { n: "01", label: "巴比塔之痛", subs: ["act-01-babel"] },
  { n: "02", label: "能力总览", subs: ["act-02c-matrix"] },
  { n: "03", label: "乐高式解法", subs: ["act-02a-contract", "act-02b-build"] },
  { n: "04", label: "一个公式", subs: ["act-03-formula"] },
  { n: "05", label: "动作头剧场", subs: ["act-04-heads"] },
  { n: "06", label: "评测部署", subs: ["act-06-serve"] },
  { n: "07", label: "训练配方", subs: ["act-05b-recipes", "act-05a-forget"] },
  { n: "08", label: "数据说话", subs: ["act-07-results"] },
  { n: "09", label: "收束", subs: ["act-08-finale"] },
];
export const ALL_SECTION_IDS = ACTS.flatMap((a) => a.subs);

/* PPT 模式：播放顺序（封面在最前）与每节的目录短名 */
export const DECK_ORDER = ["top", ...ALL_SECTION_IDS];
export const SECTION_TITLES: Record<string, string> = {
  top: "封面",
  "act-01-babel": "巴比塔之痛",
  "act-02c-matrix": "能力总览",
  "act-02a-contract": "03A · 两份契约",
  "act-02b-build": "03B · 亲手拼一台",
  "act-03-formula": "一个公式",
  "act-04-heads": "动作头剧场",
  "act-06-serve": "评测部署",
  "act-05b-recipes": "07A · 配方清单",
  "act-05a-forget": "07B · 遗忘实验",
  "act-07-results": "数据说话",
  "act-08-finale": "收束",
};
