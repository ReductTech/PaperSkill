import type { TutorialData } from '../types';

// ============================================================================
//  DivPrune 精读教程 —— 全部论文专属内容集中在本文件。
//  编号、数字一律以 CVPR 2025 正式版（CVF Open Access）及其补充材料为准；
//  代码引用固定到 github.com/vbdi/divprune 的 commit 799e2d9。
//  富文本语法：[[ev:键|标签]] 证据芯片，[[t:键|文字]] 术语，[[tag:demo|extrap|paper|code]] 口径标记。
// ============================================================================

const MAIN =
  'https://openaccess.thecvf.com/content/CVPR2025/papers/Alvar_DivPrune_Diversity-based_Visual_Token_Pruning_for_Large_Multimodal_Models_CVPR_2025_paper.pdf';
const SUPP =
  'https://openaccess.thecvf.com/content/CVPR2025/supplemental/Alvar_DivPrune_Diversity-based_Visual_CVPR_2025_supplemental.pdf';
const HTML =
  'https://openaccess.thecvf.com/content/CVPR2025/html/Alvar_DivPrune_Diversity-based_Visual_Token_Pruning_for_Large_Multimodal_Models_CVPR_2025_paper.html';
export const COMMIT = '799e2d950aa01ba7860907f5a6d86061f885dca6';
const CODE = `https://github.com/vbdi/divprune/blob/${COMMIT}/`;
const ARCH = CODE + 'LLaVA/llava/model/llava_arch.py';

const pg = (p: number) => `${MAIN}#page=${p}`;
const sp = (p: number) => `${SUPP}#page=${p}`;

// ---------------------------------------------------------------------------
// 论文表格数据（论文实测，逐格转录自正式版 / 补充材料）
// ---------------------------------------------------------------------------

export interface ResultRow {
  method: string;
  tflop: string;
  values: (number | null)[];
  group: 'orig' | 'pnp' | 'var' | 'cal' | 'ft';
  ours?: boolean;
}
export interface ResultTable {
  id: string;
  label: string;
  where: string;
  ev: string;
  cols: string[];
  metrics: string[];
  rows: ResultRow[];
}

const IMG_COLS = ['COCO', 'Flickr', 'GQA', 'MMB', 'MME', 'MMMU', 'Nocaps', 'OKVQA', 'POPE', 'SQA', 'SEEDB'];
const IMG_METRICS = ['CIDEr', 'CIDEr', 'EM', 'Acc', 'P-score', 'Acc', 'CIDEr', 'EM', 'F1', 'EM', 'Acc'];

export const RESULT_TABLES: ResultTable[] = [
  {
    id: 'l15-7b',
    label: 'LLaVA 1.5-7B',
    where: 'Table 1 上段',
    ev: 'tab1',
    cols: IMG_COLS,
    metrics: IMG_METRICS,
    rows: [
      { method: '原模型', tflop: '3.228 (100.00)', group: 'orig', values: [1.1, 0.75, 61.96, 64.09, 1506, 36.44, 1.06, 53.39, 85.84, 69.41, 66.17] },
      { method: 'VTW', tflop: '0.603 (18.46)', group: 'pnp', values: [0.05, 0.03, 38.94, 21.31, 681, 32.6, 0.03, 18.64, 25.35, 65.29, 36.13] },
      { method: 'FastV', tflop: '0.514 (15.69)', group: 'pnp', values: [0.06, 0.03, 38.73, 20.62, 696, 32.0, 0.04, 18.32, 32.84, 65.15, 35.69] },
      { method: 'DivPrune', tflop: '0.512 (15.63)', group: 'pnp', ours: true, values: [0.96, 0.62, 56.85, 59.19, 1328, 35.89, 0.92, 46.98, 86.02, 68.27, 59.47] },
      { method: 'PruMerge', tflop: 'Variable', group: 'var', values: [0.77, 0.5, 51.3, 54.47, 1259, 35.11, 0.73, 41.74, 66.89, 68.91, 53.26] },
      { method: 'DivPrune*', tflop: 'Variable', group: 'var', ours: true, values: [0.91, 0.56, 55.25, 58.16, 1330, 35.44, 0.87, 44.38, 83.06, 67.87, 57.88] },
      { method: 'FitPrune△', tflop: '0.513 (15.65)', group: 'cal', values: [0.9, 0.56, 52.39, 57.65, 1197, 36.0, 0.86, 42.53, 60.89, 68.02, 54.84] },
      { method: 'M³•', tflop: '0.512 (15.63)', group: 'ft', values: [1.0, 0.67, 60.81, 65.81, 1391, 31.8, 0.95, 55.12, 86.33, 64.65, 64.93] },
      { method: 'PruMerge-LoRA•', tflop: 'Variable', group: 'ft', values: [0.96, 0.63, 55.96, 59.88, 1334, 34.89, 0.9, 47.99, 77.13, 68.32, 57.93] },
    ],
  },
  {
    id: 'l15-13b',
    label: 'LLaVA 1.5-13B',
    where: 'Table 1 中段',
    ev: 'tab1',
    cols: IMG_COLS,
    metrics: IMG_METRICS,
    rows: [
      { method: '原模型', tflop: '6.281 (100.00)', group: 'orig', values: [1.16, 0.8, 63.33, 68.64, 1522, 35.67, 1.09, 58.28, 85.99, 72.88, 66.82] },
      { method: 'VTW', tflop: '1.030 (16.16)', group: 'pnp', values: [0.08, 0.05, 39.71, 21.91, 622, 32.1, 0.05, 22.49, 0.4, 66.24, 38.59] },
      { method: 'FastV', tflop: '1.003 (15.73)', group: 'pnp', values: [0.38, 0.18, 44.98, 37.8, 942, 35.11, 0.33, 32.14, 30.02, 69.96, 44.95] },
      { method: 'DivPrune', tflop: '1.002 (15.71)', group: 'pnp', ours: true, values: [1.0, 0.66, 57.29, 63.4, 1407, 34.89, 0.95, 53.29, 83.43, 72.34, 62.04] },
      { method: 'PruMerge△', tflop: 'Variable', group: 'var', values: [0.8, 0.53, 52.01, 58.93, 1256, 36.56, 0.77, 49.15, 64.36, 72.53, 56.1] },
      { method: 'DivPrune*', tflop: 'Variable', group: 'var', ours: true, values: [0.94, 0.59, 56.09, 61.77, 1344, 34.89, 0.91, 50.86, 79.6, 71.34, 60.0] },
    ],
  },
  {
    id: 'l16-7b',
    label: 'LLaVA 1.6-7B',
    where: 'Table 1 下段',
    ev: 'tab1',
    cols: IMG_COLS,
    metrics: IMG_METRICS,
    rows: [
      { method: '原模型', tflop: '11.849 (100.00)', group: 'orig', values: [1.0, 0.68, 64.28, 67.01, 1520, 36.44, 0.88, 44.2, 86.38, 70.15, 70.16] },
      { method: 'VTW', tflop: '1.318 (11.23)', group: 'pnp', values: [0.06, 0.03, 38.62, 19.76, 606, 31.3, 0.03, 8.66, 7.13, 65.74, 37.48] },
      { method: 'FastV', tflop: '1.327 (11.30)', group: 'pnp', values: [0.06, 0.03, 38.79, 20.36, 619, 32.56, 0.04, 8.8, 7.78, 65.49, 37.62] },
      { method: 'DivPrune', tflop: '1.266 (10.79)', group: 'pnp', ours: true, values: [0.89, 0.61, 58.69, 63.49, 1362, 37.11, 0.76, 41.92, 82.97, 68.57, 64.11] },
      { method: 'M³•', tflop: '1.266 (10.79)', group: 'ft', values: [1.01, 0.67, 62.97, 69.16, 1490, 35.0, 0.85, 57.49, 87.44, 69.51, 68.49] },
    ],
  },
  {
    id: 'video',
    label: 'LLaVA-NeXT-Video-7B',
    where: 'Table 2 左侧',
    ev: 'tab2',
    cols: ['ActivityNet 分数', 'ActivityNet 准确率', 'SeedBench', 'VChatGPT', 'NextQA', 'EgoSchema'],
    metrics: ['GPT 分', 'Acc', 'Acc', 'GPT 分', 'WUPS', 'Acc'],
    rows: [
      { method: '原模型', tflop: '6.539 (100)', group: 'orig', values: [2.67, 48.1, 38.7, 2.16, 26.05, 41.8] },
      { method: 'VTW', tflop: '1.124 (16.97)', group: 'pnp', values: [1.61, 26.84, 29.39, 1.19, 18.66, 25.42] },
      { method: 'FastV', tflop: '0.943 (14.20)', group: 'pnp', values: [1.95, 33.91, 32.98, 1.44, 22.51, 29.14] },
      { method: 'DivPrune', tflop: '0.937 (14.10)', group: 'pnp', ours: true, values: [2.56, 45.9, 37.0, 1.92, 24.48, 39.76] },
    ],
  },
  {
    id: 'supp',
    label: '补充材料 · 3 个额外数据集',
    where: 'supp Table 1',
    ev: 'supp-tab1',
    cols: ['TextVQA', 'VizWiz', 'VQAv2'],
    metrics: ['EM', 'EM', 'EM'],
    rows: [
      { method: '原模型', tflop: '3.13 (100.00)', group: 'orig', values: [46.08, 54.24, 76.65] },
      { method: 'VTW', tflop: '0.507 (16.20)', group: 'pnp', values: [8.22, 50.13, 42.13] },
      { method: 'FastV', tflop: '0.418 (13.35)', group: 'pnp', values: [8.21, 50.48, 41.71] },
      { method: 'DivPrune', tflop: '0.416 (13.29)', group: 'pnp', ours: true, values: [35.97, 57.41, 71.55] },
      { method: 'PruMerge', tflop: 'Variable', group: 'var', values: [37.7, 56.31, 65.01] },
      { method: 'DivPrune*', tflop: 'Variable', group: 'var', ours: true, values: [35.0, 57.43, 69.59] },
      { method: 'FitPrune△', tflop: '0.417 (13.32)', group: 'cal', values: [30.1, 54.62, 64.86] },
      { method: 'M³•', tflop: '0.416 (13.29)', group: 'ft', values: [44.31, 52.98, 75.87] },
    ],
  },
];

/** Table 2 右侧：效率（LLaVA-NeXT-Video-7B，VideoChatGPT 499 个样本） */
export const EFFICIENCY = [
  { method: '原模型', ratio: 100, tflop: 6.539, mem: 14.06, prefill: 0.33, e2e: 4.37 },
  { method: 'VTW', ratio: 16.97, tflop: 1.124, mem: 13.63, prefill: 0.15, e2e: 3.43 },
  { method: 'FastV', ratio: 14.2, tflop: 0.943, mem: 13.57, prefill: 0.15, e2e: 3.63 },
  { method: 'DivPrune', ratio: 14.1, tflop: 0.937, mem: 13.51, prefill: 0.161, e2e: 3.39 },
];

/** Table 3：剪枝层位置消融（LLaVA 1.5-7B） */
export const TABLE3 = [
  { layer: 0, ratio: 19.61, mmb: 59.19, mmmu: 35.89, pope: 86.02, sqa: 68.27, avg: 62.34 },
  { layer: 1, ratio: 19.65, mmb: 59.02, mmmu: 34.89, pope: 80.67, sqa: 67.18, avg: 60.44 },
  { layer: 2, ratio: 19.7, mmb: 54.9, mmmu: 34.22, pope: 69.27, sqa: 69.56, avg: 56.99 },
  { layer: 3, ratio: 19.8, mmb: 23.97, mmmu: 32.67, pope: 31.82, sqa: 65.94, avg: 38.6 },
];

/** Table 4：距离度量与选择策略消融（LLaVA 1.5-7B，TFLOP 19.61%） */
export const TABLE4 = [
  { id: 'cos', label: '余弦（默认）', mmb: 59.19, mmmu: 35.89, pope: 86.02, sqa: 68.27, avg: 62.34 },
  { id: 'l1', label: 'ℓ1', mmb: 59.71, mmmu: 34.67, pope: 85.4, sqa: 67.97, avg: 61.94 },
  { id: 'l2', label: 'ℓ2', mmb: 59.97, mmmu: 35.0, pope: 85.64, sqa: 68.27, avg: 62.22 },
  { id: 'random', label: '随机', mmb: 52.66, mmmu: 34.56, pope: 72.78, sqa: 66.63, avg: 56.66 },
  { id: 'minmax', label: 'Min-Max', mmb: 38.57, mmmu: 33.11, pope: 49.26, sqa: 65.2, avg: 46.53 },
];

/** Fig. 1 纵轴所用四个数据集在 IMG_COLS 中的下标：COCO、OKVQA、POPE、MMB */
export const FIG1_COLS = [0, 7, 8, 3];

// ---------------------------------------------------------------------------
// 教程主体
// ---------------------------------------------------------------------------

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'DivPrune: Diversity-based Visual Token Pruning for Large Multimodal Models',
    titleZh: 'DivPrune：基于多样性的视觉 Token 剪枝',
    venue: 'CVPR 2025',
    authors: 'Saeed Ranjbar Alvar, Gursimran Singh†, Mohammad Akbari†, Yong Zhang',
    affiliation: 'Huawei Technologies Canada Co., Ltd.（† 同等贡献）',
    domain: '多模态大模型 · 推理加速 · Token 剪枝',
    coreProblem: '视觉 token 数量远多于文本，拖慢多模态大模型的推理；按“重要性”剪枝在高剪枝率下会保留大量相似 token。',
    coreInsight: '把剪枝写成 Max-Min 多样性问题：保留一组彼此尽量不同的视觉 token，让少量 token 覆盖整张图。',
    keywords: ['Max-Min 多样性', '视觉 token 剪枝', '免训练', '即插即用'],
  },
  heroX: {
    kicker: 'CVPR 2025 · 论文精读',
    lines: ['读一张图要先吞下几百个视觉 token。DivPrune 只留一小部分——每次挑离已选集合最远的那个。'],
    stats: [
      { value: '56 / 576', label: 'LLaVA 1.5 保留的视觉 token（代码 SUBSET_RATIO = 0.098）', ev: 'code-arch', tag: 'code' },
      { value: '15.63%', label: 'TFLOP 比例（Table 1，11 个数据集平均）', ev: 'tab1', tag: 'paper' },
      { value: '0', label: '训练与校准步骤', ev: 's1', tag: 'paper' },
      { value: '2.05×', label: '预填充提速（Table 2：0.330 → 0.161 s）', ev: 'tab2', tag: 'paper' },
    ],
    chips: ['Saeed Ranjbar Alvar 等', 'Huawei Technologies Canada', 'CVPR 2025', 'arXiv 2503.02175'],
  },
  hero: {
    oldMethod: {
      desc: '按“重要性”Top-k：给每个 token 打分、只留高分。名额容易被彼此相似的 token 占满，远处的区域一个也留不下。',
    },
    newMethod: {
      desc: '按“多样性”Max-Min：每一轮都挑离已选集合最远的 token，让少量 token 尽量覆盖整张图。',
    },
  },
  chapters: [
    // ------------------------------------------------------------------ 1
    {
      kind: 'chapter',
      id: 'chap-1',
      short: 'token 账单',
      title: '一张图 = 576 个 token',
      badge: 'inf',
      badgeLabel: '背景 · 推理成本',
      bridge:
        'LLaVA 1.5 把一张图切成 **576 个**视觉 token，LLaVA 1.6 约 1600–2300 个，视频 8 帧共 1152 个 [[ev:s41]]；问题文本通常只有几十个 [[ev:code-ntok]]。LLM 每一层、每生成一个词都要处理它们——这就是剪枝要省下的账。',
      analogy: {
        title: '沙越多，漏得越久',
        text: '每粒沙是一个视觉 token。剪枝不改沙漏本身（模型参数），只是少放沙。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '一张图片在 LLaVA 里走过的路',
          desc: '点“下一步”跟随一次推理；切换模型看 token 数，打开开关看 DivPrune 插在哪里。',
          componentId: 'ch1-pipeline',
          tags: ['paper', 'code', 'demo'],
        },
        {
          kind: 'module',
          id: '1.2',
          title: 'token 账本：视觉占多少，二次项占多少',
          desc: '切换模型与数据集，看序列构成和单层计算量的三项占比。',
          componentId: 'ch1-ledger',
          tags: ['code', 'extrap'],
        },
      ],
      formulas: [
        {
          label: 'Eq. (1)',
          evidence: 'eq1',
          numbered: true,
          title: '自回归生成',
          html: 'P(<i data-s="y">y<sub>1</sub>, …, y<sub>N̂</sub></i> | <i data-s="Et">E<sub>t</sub></i>, <i data-s="Ev">E<sub>v</sub></i>) = <i data-s="prod">∏<sub>i=1</sub><sup>N̂</sup></i> P(<i data-s="yi">y<sub>i</sub></i> | <i data-s="ylt">y<sub>&lt;i</sub></i>, <i data-s="Et">E<sub>t</sub></i>, <i data-s="Ev">E<sub>v</sub></i>)',
          plain: '每生成第 i 个词，条件都是“已生成的词 + 全部 N 个文本 token + 全部 M 个视觉 token”。',
          symbols: [
            { key: 'y', sym: 'y₁ … y_N̂', desc: '模型输出的 N̂ 个 token（答案）。' },
            { key: 'Et', sym: 'E_t', desc: 'N 个文本 token。' },
            { key: 'Ev', sym: 'E_v', desc: 'M 个视觉 token（LLaVA 1.5 中 M = 576）；剪枝后换成子集 Ẽ_v。' },
            { key: 'prod', sym: '∏', desc: '连乘 N̂ 项：联合概率 = 每一步条件概率之积。' },
            { key: 'yi', sym: 'y_i', desc: '第 i 个输出 token。' },
            { key: 'ylt', sym: 'y_{<i}', desc: '第 i 步之前已生成的 token。' },
          ],
        },
      ],
      check:
        '论文说成本随长度“二次增长” [[ev:s1]]；按它自己的计算式，在 LLaVA 这个长度下二次项只占单层计算的 3%–12%，计算量近似线性 [[tag:extrap]]。',
      insight: '剪枝不改模型参数，只减少它能看到的视觉 token——所以能即插即用，但删掉的信息再也找不回来。',
      deepDives: [
        {
          title: '账单细节：576 从哪来，二次项为什么不是大头',
          facts: [
            { value: '576', label: 'LLaVA 1.5 视觉 token（24 × 24 图块）' },
            { value: '≈ 3%', label: 'μ ≈ 600 时二次项占单层计算（本页外推）' },
            { value: '1152', label: '视频 8 帧 × 144' },
          ],
          blocks: [
            { type: 'p', text: '576 来自 LLaVA 1.5 的视觉编码器配置：CLIP ViT-L/14、输入 336×336，336 ÷ 14 = 24，24 × 24 = 576（LLaVA 官方配置，论文只写了 576 [[ev:s41]]）。每个 token 是投影层输出的 4096 维向量 [[ev:s42]]。' },
            { type: 'p', text: '单层计算量为 4nd² + 2n²d + 2ndm，二次项与线性项之比约 2n / (4d + 2m)：LLaVA 1.5-7B 中 n ≈ 600 时约 3%，n ≈ 2300 时约 12% [[tag:extrap]]。所以剪掉约 90% 的视觉 token，TFLOPs 大约降到 15%，而不是 1%。' },
            { type: 'p', text: 'KV cache 让解码时不必重算旧 token 的 K、V，但每一步注意力仍要读取全部缓存；视觉 token 越多，缓存越大、读得越多。' },
          ],
        },
      ],
      pitfalls: [
        '“576 个 token”是 24×24 个图块的特征向量，不是 576 个像素。',
        '文本长度 N 不固定：代码里的 15–113 是各数据集的平均估计 [[ev:code-ntok]]。',
      ],
      takeaways: [
        { icon: '📦', title: '视觉占大头', desc: '一张图几百到上千个 token，问题只有几十个。' },
        { icon: '🧮', title: '近似线性', desc: '这个尺度下剪掉多少 token，大致就省多少计算。' },
        { icon: '🔁', title: '每步都要读', desc: '预填充和逐词解码都以全部视觉 token 为条件。' },
      ],
    },
    // ------------------------------------------------------------------ 2
    {
      kind: 'chapter',
      id: 'chap-2',
      short: '重要性的盲区',
      title: '按“重要性”挑 token，为什么会扎堆',
      badge: 'inf',
      badgeLabel: '动机 · 旧方法局限',
      bridge:
        '[[t:fastv|FastV]]、[[t:prumerge|PruMerge]] 用注意力给 token 打分、只留高分的 [[ev:s23]]。论文指出：高分 token 往往彼此相似，名额被重复信息占满 [[ev:s1]]；剪得越狠，这个问题越严重。',
      analogy: {
        title: '只在手电筒照到的地方钉图钉',
        text: '亮处钉子越钉越密，暗处一颗也没有——每颗单看都“重要”，合起来却大量重复。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '同一预算，三种挑法',
          desc: '示意点云，三个场景：高分集中在左下簇、高分分散在各簇、远处有被设定为无关的离群点。切换场景与方法，比较覆盖、冗余和（场景设定的）相关性——没有哪种挑法在所有场景都占优。',
          componentId: 'ch2-compare',
          tags: ['demo'],
        },
      ],
      check:
        'Fig. 3(a) 只是单个样本的 [[t:tsne|t-SNE]] 图 [[ev:fig3a]]，簇间距离不能直接解读；它能说明“会扎堆”，不能证明“总是扎堆”。',
      insight: '“重要”不等于“有代表性”：Top-k 从不检查已选 token 之间是否重复，Max-Min 只看重复。',
      deepDives: [
        {
          title: '方法谱系：在哪里剪、靠什么剪、付出什么代价',
          blocks: [
            {
              type: 'table',
              head: ['方法', '在哪里剪', '依据', '额外代价', '本文中的角色'],
              rows: [
                ['FastV', 'LLM 第 K 层之后', '第 K 层注意力分数', '无需训练', '即插即用主对手'],
                ['PruMerge', '视觉编码器输出', '注意力稀疏性 + 聚类合并', '保留数随样本变化', '可变比例对手'],
                ['VTW', 'LLM 第 K 层之后', '撤走全部视觉 token', '默认需校准选层（本文关闭）', '即插即用主对手'],
                ['FitPrune', 'LLM 内部多层', '校准集上的注意力差异', '需要校准集', '完整性对照'],
                ['M³', '视觉编码器输出', '嵌套多粒度表示', '需要微调', '完整性对照'],
                ['DivPrune', 'LLM 第 0 层之前', '特征间余弦距离（Max-Min）', '无需训练、无需校准', '本文方法'],
              ],
              caption: '依据 §2.3 [[ev:s23]] 与 §4.1 [[ev:s41]] 整理。',
            },
            { type: 'p', text: 'Fig. 3(b) 显示在 1000 个 SeedBench 样本上，DivPrune 的 Max-Min 距离整体高于 FastV [[ev:fig3b]]。但这正是 DivPrune 直接优化的量，胜出在意料之中，不能单独证明“多样性带来精度”。' },
          ],
        },
      ],
      pitfalls: [
        '2.1 的“重要性分数”是人为构造的；FastV 的真实分数来自第 K 层注意力，因样本而异。',
        '论文实验里的 FastV 第 3 层后几乎只留 1 个 token（第 10 章），不能直接当作“注意力打分有多差”的证据。',
      ],
      takeaways: [
        { icon: '🔦', title: '高分集中时可能扎堆', desc: '按分数选择不主动去重，是否冗余取决于分数与特征的分布。' },
        { icon: '🧭', title: '覆盖与相关性要权衡', desc: '覆盖能让子集代表原集合的各个部分，但几何分散不自动等于更高的任务精度。' },
        { icon: '🧰', title: 'DivPrune 的定位', desc: '不训练、不校准、即插即用。' },
      ],
    },
    // ------------------------------------------------------------------ 3
    {
      kind: 'chapter',
      id: 'chap-3',
      short: '目标函数',
      title: '理想目标算不动，于是换一个',
      badge: 'both',
      badgeLabel: '问题形式化',
      bridge:
        '理想做法是让剪枝前后的输出尽量一致（Eq. (2)）[[ev:eq2]]，但这要运行模型，而且 576 个里留 56 个就有约 10⁷⁸ 种挑法 [[tag:extrap]]。DivPrune 换成只看特征的目标：让留下的 token 彼此尽量不同 [[ev:s33]]。',
      analogy: {
        title: '永远转不完的计数轮',
        text: '把每种挑法都试一遍，计数轮要转到 10⁷⁸——只能换一条好执行的规则。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '组合爆炸计算器',
          desc: '选 M、调保留比例，看子集数量 C(M, M̃) 落在对数刻度尺的哪里。',
          componentId: 'ch3-explosion',
          tags: ['extrap'],
        },
      ],
      formulas: [
        {
          label: 'Eq. (2)',
          evidence: 'eq2',
          numbered: true,
          title: '剪枝问题的一般形式',
          html: '<span class="eq-lines"><span><b>Find:</b> <i data-s="f">f</i> : <i data-s="Ev">E<sub>v</sub></i> → <i data-s="Et">Ẽ<sub>v</sub></i></span><span><b>Objective:</b> min<sub><i data-s="f">f</i></sub> <i data-s="L">ℒ</i>(<i data-s="P">𝒫</i>, <i data-s="Pt">𝒫̃</i>)</span><span><b>Subject to:</b> |<i data-s="Et">Ẽ<sub>v</sub></i>| = <i data-s="Mt">M̃</i></span></span>',
          plain: '在“保留个数恰好是 M̃”的约束下，找一种挑法 f，让剪枝后的输出分布尽量接近原来的。',
          symbols: [
            { key: 'f', sym: 'f', desc: '剪枝规则：从全部视觉 token 映射到保留子集。' },
            { key: 'Ev', sym: 'E_v', desc: '全部 M 个视觉 token。' },
            { key: 'Et', sym: 'Ẽ_v', desc: '保留下来的子集。' },
            { key: 'Mt', sym: 'M̃', desc: '保留个数（代码中 LLaVA 1.5 为 56）。' },
            { key: 'L', sym: 'ℒ', desc: '输出差异的损失函数；论文未指定具体形式。' },
            { key: 'P', sym: '𝒫', desc: '剪枝前的输出分布（Eq. (1)）。' },
            { key: 'Pt', sym: '𝒫̃', desc: '剪枝后的输出分布。' },
          ],
          note: 'DivPrune 并不直接优化 Eq. (2)，而是用 Eq. (3) 作为代理目标。',
        },
      ],
      check:
        '补充材料写“剪枝率 91.2%” [[ev:supp-s5]]，代码用的是保留比例 0.098（剪 90.2%）[[ev:code-run]]；只有后者能复现 Table 1 的 15.63% [[tag:extrap]]。',
      insight: '最关键的一步是换目标：从“让输出不变”（必须跑模型）换成“让 token 彼此不同”（只需特征）。代价是它不知道用户问了什么。',
      deepDives: [
        {
          title: '它不看问题：query-agnostic 的后果',
          facts: [
            { value: '3.4×10⁷⁸', label: 'C(576, 56)：576 选 56 的挑法数（本页外推）' },
            { value: '56', label: 'LLaVA 1.5 保留的视觉 token' },
            { value: '−10.1', label: 'TextVQA 降幅（supp Table 1）' },
          ],
          blocks: [
            { type: 'p', text: '官方实现只把视觉段的特征传给 DivPrune [[ev:code-apply]]：同一张图无论问什么，留下的 56 个 token 都一样 [[tag:code]]。选择可以在进入 LLM 前一次完成，但当问题只关心很小的区域（如图中小字）时，相关图块可能恰好被剪掉。' },
            { type: 'p', text: '补充材料中 TextVQA 从 46.08 降到 35.97，降幅明显大于 VizWiz、VQAv2 [[ev:supp-tab1]]，与这个解释相符；论文没有分析原因，这里是本页推测。' },
          ],
        },
      ],
      pitfalls: [
        'Eq. (2) 是问题的一般表述，不是 DivPrune 实际优化的目标。',
        '剪枝率与保留率方向相反：代码的 SUBSET_RATIO 是保留率。',
      ],
      takeaways: [
        { icon: '🎯', title: '理想目标算不动', desc: '要跑模型，且子集多达 ~10⁷⁸ 个。' },
        { icon: '🔄', title: '换成代理目标', desc: '只看特征的多样性，无需训练与校准。' },
        { icon: '❓', title: '代价：不看问题', desc: '问题只关心小区域时可能吃亏。' },
      ],
    },
    // ------------------------------------------------------------------ 4
    {
      kind: 'chapter',
      id: 'chap-4',
      short: 'Max-Min 目标',
      title: 'Max-Min：让最近的一对尽量远',
      badge: 'both',
      badgeLabel: '核心数学',
      bridge:
        '[[t:mmdp|MMDP]] 在所有大小为 M̃ 的子集里，挑“最近一对距离最大”的那个 [[ev:eq3]]。距离用[[t:cosdist|余弦距离]]（Eq. (4)），只看方向、不看长度，在 4096 维投影特征上计算 [[ev:s42]]。',
      analogy: {
        title: '罗盘上两根指针',
        text: '只读两根指针张开的角度，不管指针有多长——这就是余弦距离。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '余弦距离：只看方向',
          desc: '拖动夹角和长度：长度变了，欧氏距离跟着变，余弦距离不动。',
          componentId: 'ch4-cosine',
          tags: ['demo'],
        },
        {
          kind: 'module',
          id: '4.2',
          title: '找短板：你选的子集得几分',
          desc: '点选 4 个点，红线是最近的一对；试着让它最长，再和穷举最优比。',
          componentId: 'ch4-bottleneck',
          tags: ['demo'],
        },
      ],
      formulas: [
        {
          label: 'Eq. (3)',
          evidence: 'eq3',
          numbered: true,
          title: 'Max-Min 多样性问题',
          html: 'Find <i data-s="Et">Ẽ<sub>v</sub></i> = <i data-s="argmax">arg max</i> [ <i data-s="min">min<sub>γ, ω ∈ S</sub></i> ( <i data-s="d">d</i>(<i data-s="go">γ, ω</i>) ) : ∀<i data-s="S">S</i> ⊂ <i data-s="Ev">E<sub>v</sub></i> ]',
          plain: '在所有恰好 M̃ 个 token 的子集里，选“内部最近一对距离”最大的那个。',
          symbols: [
            { key: 'Et', sym: 'Ẽ_v', desc: '要找的保留子集。' },
            { key: 'argmax', sym: 'arg max', desc: '在所有子集 S 中取使方括号最大的那个。' },
            { key: 'min', sym: 'min_{γ,ω∈S}', desc: 'S 内两两不同元素间的最小距离，即子集的短板。' },
            { key: 'd', sym: 'd', desc: '距离函数，默认是 Eq. (4) 的余弦距离。' },
            { key: 'go', sym: 'γ, ω', desc: 'S 中任意两个不同元素（γ ≠ ω）。' },
            { key: 'S', sym: 'S', desc: 'E_v 的任意子集，大小为 M̃（式下文字说明）。' },
            { key: 'Ev', sym: 'E_v', desc: '全部 M 个视觉 token。' },
          ],
          note: '式中没有写出 γ ≠ ω；若允许 γ = ω，min 恒为 0。Algorithm 1 第 8 行的 i ≠ j 印证应理解为不同元素。',
        },
        {
          label: 'Eq. (4)',
          evidence: 'eq4',
          numbered: true,
          title: '余弦距离',
          html: '<i data-s="d">d</i>(<i data-s="g">γ</i>, <i data-s="w">ω</i>) = 1 − <span class="fr"><span class="fr-n"><i data-s="dot">γ · ω</i></span><span class="fr-d"><i data-s="norm">‖γ‖ ‖ω‖</i></span></span>',
          plain: '方向越接近越趋于 0；正交为 1；相反为 2。',
          symbols: [
            { key: 'd', sym: 'd(γ, ω)', desc: '余弦距离，范围 [0, 2]。' },
            { key: 'g', sym: 'γ', desc: '一个视觉 token 的特征向量（7B 模型 4096 维）。' },
            { key: 'w', sym: 'ω', desc: '另一个视觉 token 的特征向量。' },
            { key: 'dot', sym: 'γ · ω', desc: '内积。' },
            { key: 'norm', sym: '‖γ‖ ‖ω‖', desc: '两个向量长度之积；除以它就消去了长度。' },
          ],
        },
      ],
      insight: 'Max-Min 是“短板”指标：只要有一对几乎相同的 token，整组得分就低——所以它天然惩罚冗余。',
      deepDives: [
        {
          title: '两处值得知道的数学细节',
          blocks: [
            { type: 'p', text: '**1 − cos 不满足三角不等式**：取 0°、45°、90° 三个方向，d(0°, 90°) = 1，而 d(0°, 45°) + d(45°, 90°) ≈ 0.586 [[tag:extrap]]。Max-Min 选择问题的经典“贪心 2-近似”保证依赖三角不等式，论文没有讨论近似保证，不能直接套用（本页补充）。' },
            { type: 'p', text: '**为什么不是“距离总和最大”**：Max-Sum 可能挑出“两大堆彼此很远、堆内高度重复”的子集；Max-Min 只看最近一对，直接针对冗余。论文没有比较 Max-Sum，Table 4 只比较了随机与 Min-Max [[ev:tab4]]。' },
          ],
        },
      ],
      pitfalls: [
        '余弦距离范围是 [0, 2]；Fig. 3(b) 横轴的 0–1 只是实际取值范围 [[ev:fig3b]]。',
        '4.2 用二维欧氏距离示意；论文在 4096 维特征上用余弦距离。',
      ],
      takeaways: [
        { icon: '📏', title: '看最近的一对', desc: '子集得分 = 内部最小两两距离。' },
        { icon: '🧭', title: '余弦只看方向', desc: '向量长度不影响距离。' },
        { icon: '⚠️', title: '补全了读', desc: 'γ、ω 必须不同，子集大小恰为 M̃。' },
      ],
    },
    // ------------------------------------------------------------------ 5
    {
      kind: 'chapter',
      id: 'chap-5',
      short: 'Algorithm 1',
      title: 'Algorithm 1：一次挑一个',
      badge: 'inf',
      badgeLabel: '算法',
      bridge:
        'Algorithm 1 先挑**最孤立**的 token，再一轮轮挑“离已选集合最远”的候选，直到选满 M̃ 个 [[ev:alg1]]；全部两两距离只用一次矩阵乘法算好 [[ev:s33]]。',
      analogy: {
        title: '在地图最大的空白处落针',
        text: '每一针都落在离已有图钉最远的地方，落下就不再拔起。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '照着伪代码跑一遍',
          desc: '每按一次“下一步”，伪代码对应行高亮；细线连向每个候选的“最近者”，柱子就是数组 D。',
          componentId: 'ch5-stepper',
          tags: ['demo'],
        },
        {
          kind: 'module',
          id: '5.2',
          title: '贪心 vs 穷举',
          desc: '12 个点选 4 个，同时跑 Algorithm 1 和穷举；找一个反例，或批量统计 200 组。',
          componentId: 'ch5-exact',
          tags: ['demo', 'extrap'],
        },
      ],
      formulas: [
        {
          label: 'Algorithm 1 · 第 13–21 行（公式化写法，非论文编号公式）',
          evidence: 'alg1',
          numbered: false,
          title: '每一轮的选择规则',
          html: '<i data-s="kt">k<sub>t</sub></i> = <i data-s="R">R</i>[ arg max<sub>i ∈ R</sub> min<sub>j ∈ <i data-s="Et">Ẽ<sub>v</sub></i></sub> d(i, j) ]，<i data-s="t">t</i> = 2, …, <i data-s="Mt">M̃</i>',
          plain: '每轮算出每个候选到已选集合的最近距离，取最大者；第 1 轮（第 4–11 行）改为“到其他候选的最近距离”（i ≠ j）。',
          symbols: [
            { key: 'kt', sym: 'k_t', desc: '第 t 轮选中的 token，随后从 R 移入 Ẽ_v。' },
            { key: 'R', sym: 'R', desc: '剩余候选集合，初始为全部 M 个视觉 token。' },
            { key: 'Et', sym: 'Ẽ_v', desc: '已选集合，每轮多 1 个。' },
            { key: 't', sym: 't', desc: '轮次；总轮数 = M̃。' },
            { key: 'Mt', sym: 'M̃', desc: '目标保留个数（LLaVA 1.5 为 56）。' },
          ],
        },
      ],
      check:
        '论文称“求得了精确解” [[ev:s33]]，但 Algorithm 1 是贪心，没有回溯或穷举，不保证达到 Eq. (3) 的最优——5.2 能找到反例。',
      insight: '贪心每轮都填补当前最大的空洞：很快，但从不回头修正。',
      deepDives: [
        {
          title: '开销有多大，“最高多样性”该怎么理解',
          facts: [
            { value: '56', label: 'LLaVA 1.5 的选择轮数（= M̃）' },
            { value: '≈ 0.04%', label: '距离矩阵占一次 prefill 计算量（本页外推）' },
            { value: '+11 ms', label: '预填充比 FastV / VTW 慢（Table 2）' },
          ],
          blocks: [
            { type: 'p', text: '距离矩阵约 576² × 4096 ≈ 1.4 × 10⁹ 次乘加，只占 Eq. (5) 口径下一次预填充（3.228 TFLOPs）的 0.04%–0.08% [[tag:extrap]]。但贪心循环逐轮串行，Table 2 中 DivPrune 的预填充比基线多约 11 ms（0.161 vs 0.150 s），论文归因于距离计算 [[ev:s45]]。' },
            { type: 'p', text: '摘要说 DivPrune “达到最高多样性” [[ev:abs]]，应理解为“在所比较方法中最高”。第一阶段确定性地选最孤立的 token，结果可复现，但最孤立的也可能是噪声图块，论文未讨论（本页分析）。' },
          ],
        },
      ],
      pitfalls: [
        '伪代码会把选中的 k 移出 R；官方代码没有移出，靠“到自身距离为 0”避免重复选（第 6 章）。',
        '循环次数是 M̃，不是 M。',
      ],
      takeaways: [
        { icon: '1️⃣', title: '先选最孤立的', desc: '第一阶段：最近邻距离最大的 token。' },
        { icon: '🔁', title: '再反复填空洞', desc: '到已选集合最远的候选，直到 M̃ 个。' },
        { icon: '🧪', title: '贪心 ≠ 最优', desc: '小规模穷举就能找到反例。' },
      ],
    },
    // ------------------------------------------------------------------ 6
    {
      kind: 'chapter',
      id: 'chap-6',
      short: '论文 vs 代码',
      title: '从伪代码到 LLaVA：逐行对照',
      badge: 'inf',
      badgeLabel: '实现细节',
      bridge:
        '核心代码只有两处：`DivPrune` 函数 [[ev:code-arch]] 和它在拼好输入后的调用 [[ev:code-apply]]。主干与论文一致；保留比例、候选集处理、索引偏移和排序有细节差异。',
      analogy: {
        title: '把蓝图压在成品上',
        text: '一处处比对：照做了的打勾，改了的圈出，图上没画的标问号。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '论文 ↔ 代码对照面板',
          desc: '选一个条目：左边论文怎么说，右边代码怎么做（固定 commit 行号）。可按状态筛选。',
          componentId: 'ch6-codemap',
          tags: ['code', 'paper'],
        },
        {
          kind: 'module',
          id: '6.2',
          title: '留几个、按什么顺序放回去',
          desc: '拖 SUBSET_RATIO 看保留个数；再看示意图块先按选择顺序、再按位置排序送入 LLM。',
          componentId: 'ch6-keep',
          tags: ['code', 'demo'],
        },
      ],
      formulas: [
        {
          label: 'llava_arch.py 第 153 行（代码口径，非论文编号公式）',
          evidence: 'code-arch',
          numbered: false,
          title: '保留个数',
          html: '<i data-s="Mt">M̃</i> = int( <i data-s="round">round</i>( <i data-s="r">r</i> · <i data-s="M">M</i> ) )　→　round(0.098 × 576) = 56',
          plain: '保留比例乘以视觉 token 总数，再四舍五入。',
          symbols: [
            { key: 'Mt', sym: 'M̃', desc: '保留个数（代码中的 threshold_terms）。' },
            { key: 'round', sym: 'round', desc: 'Python 银行家舍入；56.448 不涉及 .5 的情况。' },
            { key: 'r', sym: 'r', desc: 'SUBSET_RATIO：图像 0.098，tflops.py 中视频为 0.1。' },
            { key: 'M', sym: 'M', desc: '视觉 token 总数（image_feature_length）。' },
          ],
        },
      ],
      check:
        '代码索引从 **0** 开始：`s` 是视觉段内的位置（0…M−1），加上硬编码的 `SYS_TOKEN_LEN = 35` 才是序列位置 [[ev:code-apply]]；换对话模板就需要改。',
      insight: '论文说“选哪些”，代码还决定“放哪里”：保留的 token 按原位置排序后送入 LLM，选择顺序被丢弃。',
      deepDives: [
        {
          title: '位置编码、边界情况与缺失的实验代码',
          blocks: [
            { type: 'p', text: '**位置编码（代码推断）**：`generate` 路径中 `position_ids` 通常为 None，Transformers 会按剪枝后的长度从 0 重新连续编号——相对顺序不变，RoPE 位置间距被“压紧”。论文未讨论，本页未运行验证。' },
            { type: 'p', text: '**边界情况（阅读推断）**：代码不维护候选集 R，每轮对全部 M 列取 argmax。若存在完全相同的 token，或半精度让 1 − cos(x, x) 略大于 0，理论上可能重复选择。未实测。' },
            {
              type: 'list',
              items: [
                '层内剪枝（Table 3 的 Layer 1–3）：`LAYER_INDEX` 不为 0 时只记录长度，无剪枝实现 [[ev:code-apply]]。',
                '视频模型：依赖外部 `llavavid` 包，仓库中没有对应的 DivPrune 修改。',
                '效率脚本 `eval_time.sh` 用 LLaVA-1.6 + COCO [[ev:code-time]]，与 Table 2 的视频设置不同 [[ev:s45]]。',
                '`run_Divprune.sh` 运行名写 7B，实际加载 13B（第 8、15 行）[[ev:code-run]]。',
              ],
            },
          ],
        },
      ],
      pitfalls: [
        '`SUBSET_RATIO` 是**保留**比例：0.098 = 保留 9.8%。',
        '代码只处理 batch 第 0 个样本，与论文 batch = 1 的设定一致 [[ev:s41]]，不能直接批量推理。',
      ],
      takeaways: [
        { icon: '🔗', title: '主干一致', desc: '第 0 层、投影特征、余弦距离、两阶段贪心。' },
        { icon: '🧷', title: '细节有差', desc: '0.098 ≠ 91.2%、候选集不移除、硬编码 35、按位置排序。' },
        { icon: '🕳️', title: '部分实验无代码', desc: '层内剪枝、视频模型、Table 2 的效率设置。' },
      ],
    },
    // ------------------------------------------------------------------ 7
    {
      kind: 'chapter',
      id: 'chap-7',
      short: '剪在哪一层',
      title: '在哪一层剪：Table 3 藏着第二个变量',
      badge: 'both',
      badgeLabel: '消融 · 层位置',
      bridge:
        'DivPrune 默认在 **Layer 0**（进入解码器之前）剪枝 [[ev:s46]]。Table 3 在固定约 19.6% TFLOPs 下比较第 0–3 层：平均分 62.34 → 60.44 → 56.99 → 38.60 [[ev:tab3]]。',
      analogy: {
        title: '同一箱油，早卸货还是晚卸货',
        text: '油量固定：越晚卸下多余的货，前面烧掉的油越多，后面能带的货就越少。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '固定预算下，每一层留了几个 token',
          desc: '切换剪枝层；柱高 = 该层处理的 token 数。打开“保留数相同”，看 TFLOPs 会涨多少。',
          componentId: 'ch7-budget',
          tags: ['paper', 'extrap'],
        },
        {
          kind: 'module',
          id: '7.2',
          title: '因果注意力：被剪的 token 留下了什么',
          desc: '信息只能向后、向上流。选剪枝位置并逐层播放，看被剪 token 的信息是否已流进问题。',
          componentId: 'ch7-causal',
          tags: ['demo'],
        },
      ],
      formulas: [
        {
          label: '按 Eq. (5) 反推保留数（本页外推，非论文公式）',
          evidence: 'eq5',
          numbered: false,
          title: '固定预算 B 下，第 K 层剪枝最多留几个',
          html: '<i data-s="MK">M̃(K)</i> = max { M̃ : <i data-s="ratio">TFLOP比例</i>(<i data-s="K">K</i>, M̃) ≤ <i data-s="B">B</i> }',
          plain: '越晚剪，前面越多层处理全部 token，能留下的就越少。',
          symbols: [
            { key: 'MK', sym: 'M̃(K)', desc: '第 K 层剪枝时可保留数：K = 0/1/2/3 约为 56/39/21/2。' },
            { key: 'ratio', sym: 'TFLOP 比例', desc: '按 Eq. (5) + 号修正式，对 MMB、MMMU、POPE、SQA 取平均。' },
            { key: 'K', sym: 'K', desc: '剪枝层；0 = 进入第 1 层之前。' },
            { key: 'B', sym: 'B', desc: '固定预算，Table 3 中约 19.6%。' },
          ],
        },
      ],
      check:
        '预算固定时越晚剪，能留的越少：本页按 Eq. (5) 反推为 **56 → 39 → 21 → 2** 个，恰好复现 Table 3 的 TFLOP 列 [[tag:extrap]]。表中同时变了“层位置”和“保留数”。',
      insight: '固定预算的消融回答的是“预算怎么花”，不是“哪一层的信息更好”。',
      deepDives: [
        {
          title: '为什么 FastV 不能在第 0 层剪，以及两处表述细节',
          blocks: [
            { type: 'p', text: 'FastV 的依据是第 K 层的注意力，必须先跑完前 K 层（其论文标题就是“第 2 层之后只值一半 token”）[[ev:ext-fastv]]。DivPrune 只用投影特征，可以在第 0 层剪，32 层全部受益——这是按 TFLOPs 对齐时的结构性优势。' },
            { type: 'p', text: '[[t:causal|因果注意力]]下，前 K 层里问题 token 已从全部视觉 token 读取信息，晚剪可能保留更多信息（本页解释，论文未展开）。另外，正文说该消融“使用 5 个数据集” [[ev:s46]]，表中只有 4 列；19.61% 与 Table 1 的 15.63% 是同一配置，差别来自取平均的数据集不同 [[tag:extrap]]。' },
          ],
        },
      ],
      pitfalls: [
        '“Layer 1”指第 1 层处理完后再剪；“Layer 0”才是进入任何解码层之前。',
        '39、21、2 是本页反推值，论文没有报告。',
      ],
      takeaways: [
        { icon: '🧱', title: 'Layer 0 是默认', desc: '进入第一层前剪，全部层受益。' },
        { icon: '⚖️', title: '第二个变量', desc: '固定预算下保留数 56 → 39 → 21 → 2。' },
        { icon: '➡️', title: '信息不能倒流', desc: '晚剪的 token 可能已把信息传给后面的问题。' },
      ],
    },
    // ------------------------------------------------------------------ 8
    {
      kind: 'chapter',
      id: 'chap-8',
      short: '距离与策略',
      title: '尺子不重要，规则才重要',
      badge: 'both',
      badgeLabel: '消融 · 选择策略',
      bridge:
        'Table 4 [[ev:tab4]] 换距离：余弦 62.34、ℓ1 61.94、ℓ2 62.22，几乎一样；换规则：随机 56.66、Min-Max 46.53，明显变差。都在保留 56 个、单次运行的条件下。',
      analogy: {
        title: '三把尺子量同一对',
        text: '卷尺、刻度尺、量角器读数各不相同，却都指出同一对“最远的点”。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '同一张图，五种挑法',
          desc: '左边是示意图块场景，切换距离或规则看 56 个图块落在哪；右边是 Table 4 实测分数。',
          componentId: 'ch8-strategies',
          tags: ['demo', 'paper'],
        },
      ],
      formulas: [
        {
          label: 'Min-Max 策略（§4.6 文字描述，论文未编号）',
          evidence: 's46',
          numbered: false,
          title: '反面对照：故意挑相似的',
          html: '<i data-s="Et">Ẽ<sub>v</sub></i> = arg min<sub><i data-s="S">S</i></sub> max<sub>γ ≠ ω ∈ S</sub> d(γ, ω)',
          plain: '与 Eq. (3) 相反：让子集内“最远的一对”尽量近，也就是挑一团彼此相似的 token。',
          symbols: [
            { key: 'Et', sym: 'Ẽ_v', desc: '按 Min-Max 规则选出的子集。' },
            { key: 'S', sym: 'S', desc: '任意含 M̃ 个元素的子集。' },
          ],
          note: '论文没有说明求解方式；8.1 用贪心近似演示。ℓ1、ℓ2 分别为各维差的绝对值之和与直线距离，都受向量长度影响。',
        },
      ],
      check:
        '正文说随机“低约 5.6%”、Min-Max“低约 15.8%” [[ev:s46]]——其实是**百分点**；相对降幅约 9.1% 与 25.4% [[tag:extrap]]。',
      insight: '用哪把尺子几乎不影响结果，挑选规则决定结果。',
      deepDives: [
        {
          title: '随机为什么不差，它又说明了什么',
          blocks: [
            { type: 'p', text: '56 个随机 token 大致均匀分布，本身就有一定多样性。值得注意：Table 4 中随机留 56 个（MMB 52.66、POPE 72.78）远高于 Table 1 中 FastV（MMB 20.62、POPE 32.84）[[ev:tab1]]——后者是在第 3 层后几乎只留 1 个。这提示 FastV 的低分很大程度来自比较时的极端配置（本页推断，见第 10 章）。' },
            { type: 'p', text: '余弦、ℓ1、ℓ2 之间不到 0.4 分的差距来自单次运行，没有误差条，不宜据此排序。论文也没有报告“多样性程度”与“精度”的连续关系。' },
          ],
        },
      ],
      pitfalls: [
        '“5.6%”“15.8%”是百分点差，不是相对比例。',
        '8.1 的图块特征是 4 维颜色向量，不是 CLIP 特征。',
      ],
      takeaways: [
        { icon: '📐', title: '尺子不重要', desc: '三种距离平均分相差 < 0.4。' },
        { icon: '🎲', title: '规则很重要', desc: '62.34 > 56.66 > 46.53。' },
        { icon: '🔍', title: '注意“%”', desc: '论文的“%”在这里是百分点。' },
      ],
    },
    // ------------------------------------------------------------------ 9
    {
      kind: 'chapter',
      id: 'chap-9',
      short: '算力与延迟',
      title: '理论算力 ≠ 实际速度',
      badge: 'inf',
      badgeLabel: '效率',
      bridge:
        'TFLOP 比例按 Eq. (5) 估算，只计 LLM 解码层的预填充 [[ev:eq5]]。Table 2 实测：14.10% 的 TFLOPs 换来约 **2.05×** 预填充提速、**1.29×** 端到端提速、显存少 0.55 GB [[ev:tab2]]。',
      analogy: {
        title: '台秤与秒表',
        text: '背包减重 86%，秤上读数骤降；跑完全程却只快了两成。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: 'TFLOPs 复算器',
          desc: '选论文配置或自定义，按 tflops.py 同口径复算并与表格比对；三个开关看口径差异。',
          componentId: 'ch9-calc',
          tags: ['paper', 'extrap', 'code'],
        },
        {
          kind: 'module',
          id: '9.2',
          title: '四种指标赛跑',
          desc: 'Table 2 实测数据。点“开跑”看端到端延迟，切换指标比较 TFLOPs、预填充与显存。',
          componentId: 'ch9-race',
          tags: ['paper'],
        },
      ],
      formulas: [
        {
          label: 'Eq. (5)（按正式版印刷）',
          evidence: 'eq5',
          numbered: true,
          title: 'TFLOP 比例',
          html: '<span class="fr"><span class="fr-n"><i data-s="K">K</i>×(4<i data-s="mu">μ</i><i data-s="d">d</i>² <b class="hl-bad">−</b> 2μ²d + 2μd<i data-s="m">m</i>) + (<i data-s="T">T</i>−K)×(4<i data-s="mut">μ̃</i>d² <b class="hl-bad">−</b> 2μ̃²d + 2μ̃dm)</span><span class="fr-d">T×(4μd² <b class="hl-bad">−</b> 2μ²d + 2μdm)</span></span>',
          plain: '前 K 层按完整长度 μ 算，其余 T − K 层按剪枝后长度 μ̃ 算，再除以原模型。',
          symbols: [
            { key: 'K', sym: 'K', desc: '剪枝所在层；DivPrune 为 0，本文实验中 FastV 为 3。' },
            { key: 'T', sym: 'T', desc: '解码层数：7B 为 32，13B 为 40。' },
            { key: 'mu', sym: 'μ = N + M', desc: '剪枝前序列长度。' },
            { key: 'mut', sym: 'μ̃ = N + M̃', desc: '剪枝后序列长度。' },
            { key: 'd', sym: 'd', desc: '隐藏维度：7B 为 4096，13B 为 5120。' },
            { key: 'm', sym: 'm', desc: 'FFN 中间维度：7B 为 11008，13B 为 13824。' },
          ],
          note: '印刷的“−2μ²d”与代码不一致，只有“+”能复现表格。各项按乘加计；LLaMA 的 SwiGLU 精确计数应为 3μdm，论文沿用 FastV 的 2μdm（9.1 可切换）。',
        },
      ],
      check:
        'Eq. (5) 印刷为 **−2μ²d**，按它算 LLaVA 1.5-7B 为 16.50%，与表不符；代码为 **+2n²d** [[ev:code-flop]]，可复现 16 个可核对配置中的 15 个 [[tag:extrap]]。',
      insight: 'TFLOPs 只是理论账：端到端还包括视觉编码、逐词解码和调度，所以 14% 的算力只换来约 1.29× 的端到端提速。',
      deepDives: [
        {
          title: '四种指标的含义，以及正文与表格对不上的地方',
          facts: [
            { value: '2.05×', label: '预填充 0.330 → 0.161 s' },
            { value: '1.29×', label: '端到端 4.37 → 3.39 s' },
            { value: '−0.55 GB', label: '显存峰值 14.06 → 13.51 GB' },
          ],
          blocks: [
            {
              type: 'table',
              head: ['指标', '含义', '本文怎么测'],
              rows: [
                ['理论 TFLOPs', 'Eq. (5) 估算的 LLM 预填充计算量', '公式计算，与硬件无关'],
                ['预填充时间', '处理输入并产生第 1 个 token，近似首 token 延迟', '生成长度设为 1 后计时（该行在公开代码中被注释）[[ev:code-time]]'],
                ['端到端延迟', '单样本从输入到完整答案（batch = 1）', 'CUDA Event 为 generate 计时 [[ev:code-time]]'],
                ['显存峰值', 'max_memory_allocated，含模型权重', '每个样本后读取并重置'],
              ],
              caption: '8 × V100 32GB，VideoChatGPT 499 个样本取平均 [[ev:s45]]。',
            },
            {
              type: 'list',
              items: [
                '正文称预填充“快约 55%” [[ev:s45]]，按表为 51.2%；原因未知。',
                '正文称显存“少约 400MB”，按表为 0.55 GB；原因未知。',
                '视频模型 FastV 的 14.20% 无法复现（保留 2 或 3 个分别为 14.15%、14.22%），原因未知。',
                '端到端延迟随答案长度变化，论文未报告各方法的输出长度；7B fp16 权重本身约 13–14 GB（本页估算），所以显存只省 0.55 GB 并不意外。',
              ],
            },
          ],
        },
      ],
      pitfalls: [
        '不要把“TFLOP 比例 14.10%”说成“快 7 倍”。',
        'Table 1 的 TFLOPs 是 11 个数据集比例的平均，单个数据集在 11.70%–23.89% 之间 [[tag:extrap]]。',
      ],
      takeaways: [
        { icon: '🧾', title: '能复现', desc: '按代码的 + 号，16 个配置中 15 个一致。' },
        { icon: '⏱️', title: '理论 ≠ 实测', desc: '预填充约 2.05×，端到端约 1.29×。' },
        { icon: '🧪', title: '正文要对表', desc: '“55%”“400MB”与表格算出的不一致。' },
      ],
    },
    // ------------------------------------------------------------------ 10
    {
      kind: 'chapter',
      id: 'chap-10',
      short: '读懂结果',
      title: '结果很亮眼，先对口径再下结论',
      badge: 'both',
      badgeLabel: '实验 · 结论',
      bridge:
        '在约 10–17% 的 TFLOP 比例下，DivPrune 在 16 个数据集上普遍领先同类即插即用方法 [[ev:tab1]] [[ev:tab2]]，补充材料的 3 个数据集也一致 [[ev:supp-tab1]]。例如 COCO CIDEr：FastV 0.06，DivPrune 0.96（原模型 1.10）。',
      analogy: {
        title: '翻牌计分板',
        text: '比分翻得很快——先看清比的是不是同一个项目、同样的规则。',
        componentId: 'analogy-scene',
      },
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '结果浏览器：差距有多大，能说明什么',
          desc: '切换模型和数据集；差值可在百分点与相对百分比间切换。论文为单次运行，本页只报告表中差值，不画误差带。',
          componentId: 'ch10-results',
          tags: ['paper', 'extrap'],
        },
        {
          kind: 'module',
          id: '10.2',
          title: '公平性检查：FastV 输在哪里',
          desc: '把 FastV（第 3 层后约留 1 个）、随机（第 0 层留 56 个）和 DivPrune 放在一起比。',
          componentId: 'ch10-fairness',
          tags: ['paper', 'extrap'],
        },
      ],
      formulas: [
        {
          label: '单模型准确率的抽样误差（教学示例，非论文公式）',
          evidence: 's43',
          numbered: false,
          title: '只描述一个模型自己的波动量级',
          html: '<i data-s="SE">SE</i> ≈ √( <i data-s="p">p</i>(1 − p) / <i data-s="n">n</i> )　→　p = 0.36，n = 900：SE ≈ 1.6 个百分点',
          plain: '假设题目独立同分布、逐题对错，单个模型的准确率大约会波动这么多。它不能用来判断两个模型谁更好——那需要同一批题目的逐题结果做配对比较（如 McNemar 检验），论文没有提供；F1 等非逐题平均的指标也不适用这个公式。',
          symbols: [
            { key: 'SE', sym: 'SE', desc: '标准误：换一批同分布题目，单个模型的准确率大约波动这么多（不是两个模型差值的区间）。' },
            { key: 'p', sym: 'p', desc: '准确率（0–1）。' },
            { key: 'n', sym: 'n', desc: '题量；论文未报告，取公开基准常见规模。' },
          ],
        },
      ],
      check:
        '全部结果为单次运行，论文没有报告逐样本结果、置信区间或多次运行。POPE（86.02 vs 85.84）、MMMU（37.11 vs 36.44）上的“超过原模型”差值很小，现有材料无法判断它是否超出评测波动，不宜解读为能力提升。',
      insight: '差距越小，越要先问噪声；差距越大，越要先问比较条件。',
      deepDives: [
        {
          title: '五个口径问题与对比条件核对',
          facts: [
            { value: '0.06 → 0.96', label: 'COCO CIDEr：FastV vs DivPrune（Table 1）' },
            { value: '≈ 1 个', label: 'FastV 第 3 层后保留的 token（本页外推）' },
            { value: '单次', label: '全部结果均为单次运行，无误差条或置信区间' },
          ],
          blocks: [
            {
              type: 'list',
              items: [
                '**百分点与百分比混用**：GQA“下降 5.1%”实为 5.11 个百分点（相对 8.2%）；“COCO 下降 12.7%”是相对降幅 [[ev:s43]]。',
                '**评测划分**：脚本显示 MMBench 用英文 dev、MMMU 用验证集、OKVQA 用 val2014、COCO 用 2017 验证集 [[ev:code-run]]，均非隐藏测试集。',
                '**指标聚合**：Fig. 1 纵轴把 CIDEr（可超过 1）与三个 0–1 分数直接平均 [[ev:fig1]]。',
                '**负面信号**：TextVQA 从 46.08 降到 35.97，微调的 M³ 为 44.31 [[ev:supp-tab1]]。',
              ],
            },
            {
              type: 'table',
              head: ['检查项', '论文做法', '影响'],
              rows: [
                ['算力对齐', '基线取“不低于目标的最小可用比例” [[ev:s41]]', '对基线略有利（论文自述）'],
                ['FastV 配置', 'K = 3，R = 0.001 [[ev:supp-s5]]；按“保留比例”解读才能复现 15.69%', '远离默认的“第 2 层后留一半” [[ev:ext-fastv]]'],
                ['VTW 配置', '关闭校准，7B 用 K = 4 [[ev:supp-s5]]', '第 K 层后视觉 token 全部撤走'],
                ['实现来源', '作者在同一 lmms-eval 环境自行运行 [[ev:s41]]', '未说明基线代码版本'],
                ['随机性', '单次运行，无误差条', '小差距无法判断是否超出评测波动'],
              ],
            },
          ],
        },
      ],
      pitfalls: [
        '“下降 5.1%”可能是百分点，“下降 12.7%”可能是相对比例——回到表格自己算。',
        'FastV / VTW 的低分对应极端配置，不代表它们默认设定下的表现。',
      ],
      takeaways: [
        { icon: '🏁', title: '优势真实', desc: '高剪枝率下普遍领先同类即插即用方法。' },
        { icon: '🧮', title: '先对口径', desc: '百分点 / 百分比、噪声、聚合方式。' },
        { icon: '⚖️', title: '差距受配置影响', desc: 'FastV 被迫第 3 层后只留约 1 个 token。' },
      ],
    },
  ],

  // ------------------------------------------------------------------ 证据
  evidence: {
    abs: { label: 'Abstract', source: 'main', loc: '正文第 1 页（会议页码 9392）· 摘要', content: '把剪枝表述为 MMDP；称 DivPrune “achieves the highest diversity”；在 16 个图像/视频数据集上达到 SOTA；降低端到端延迟与显存。', url: pg(1) },
    s1: { label: '§1', source: 'main', loc: '正文第 1–2 页 · §1 Introduction', content: '运行时间与显存随输入长度“二次增长”；注意力分数并非最优、且倾向保留彼此相似的 token；贡献：免训练、免校准、即插即用，16 个数据集，剪枝率 ≥ 80% 时增益明显。', url: pg(1) },
    s23: { label: '§2.3', source: 'main', loc: '正文第 2–3 页 · §2.3 Visual Token Pruning', content: 'FastV、PruMerge 基于注意力；FitPrune、VTW 依赖校准集；M³ 与 [17] 需要训练。', url: pg(2) },
    fig1: { label: 'Fig. 1', source: 'main', loc: '正文第 1 页 · Figure 1', content: 'LLaVA 1.5-7B 上不同剪枝方法在各 TFLOP 比例下的平均性能；纵轴为 COCO(CIDEr)、OKVQA、POPE(F1)、MMBench 的平均，横轴为 TFLOP 比例。', url: pg(1) },
    fig2: { label: 'Fig. 2', source: 'main', loc: '正文第 3 页 · Figure 2', content: 'LMM 结构总览：文本编码器、视觉编码器 + 投影层，DivPrune 作用于投影后的视觉 token。', url: pg(3) },
    eq1: { label: 'Eq. (1)', source: 'main', loc: '正文第 3 页 · §3.1', content: 'P(y₁…y_N̂ | E_t, E_v) = ∏ P(y_i | y_<i, E_t, E_v)。', url: pg(3) },
    eq2: { label: 'Eq. (2)', source: 'main', loc: '正文第 3 页 · §3.2', content: 'Find f: E_v → Ẽ_v；Objective: min_f ℒ(𝒫, 𝒫̃)；Subject to |Ẽ_v| = M̃。', url: pg(3) },
    eq3: { label: 'Eq. (3)', source: 'main', loc: '正文第 3 页 · §3.3', content: 'Ẽ_v = arg max [min_{γ,ω∈S} d(γ, ω) : ∀S ⊂ E_v]，S 含 M̃ 个元素（式下文字说明）。', url: pg(3) },
    eq4: { label: 'Eq. (4)', source: 'main', loc: '正文第 3 页 · §3.3', content: 'd(γ, ω) = 1 − γ·ω / (‖γ‖‖ω‖)。', url: pg(3) },
    s33: { label: '§3.3', source: 'main', loc: '正文第 3–4 页 · §3.3 DivPrune: Method Overview', content: '因 token 数有限、求解器不适合 GPU，称“obtain exact solution”；选择开销相对 LLM 计算可忽略；距离矩阵由一次矩阵乘法得到；也可用于中间层隐藏状态。', url: pg(4) },
    alg1: { label: 'Algorithm 1', source: 'main', loc: '正文第 4 页 · Algorithm 1（第 1–22 行）', content: '第一阶段（第 3–11 行）按 i ≠ j 的最近邻距离取 argmax；第二阶段（第 12–21 行）按到已选集合的最近距离取 argmax，直到 |Ẽ_v| = M̃。', url: pg(4) },
    s41: { label: '§4.1', source: 'main', loc: '正文第 4–5 页 · §4.1 Experimental Settings', content: '基线 FastV/PruMerge/VTW/FitPrune/M³；模型 LLaVA 1.5-7B/13B、1.6-7B、NeXT-Video-7B；LLaVA 1.5 为 576 个视觉 token，1.6 为 3–5 倍，视频每帧 144、8 帧共 1152；8×V100 32GB；lmms-eval；batch size 1；基线取“不低于目标的最小可用 TFLOP 比例”。', url: pg(4) },
    eq5: { label: 'Eq. (5)', source: 'main', loc: '正文第 5 页 · §4.1', content: 'TFLOP 比例 = [K×(4μd² − 2μ²d + 2μdm) + (T−K)×(4μ̃d² − 2μ̃²d + 2μ̃dm)] / [T×(4μd² − 2μ²d + 2μdm)]（按印刷；二次项符号与代码不一致）。', url: pg(5) },
    s42: { label: '§4.2', source: 'main', loc: '正文第 5 页 · §4.2 Insights', content: 'LLaVA 1.5 的视觉 token 为 4096 维；t-SNE 可视化，保留 10%；在 1000 个 SeedBench 随机样本上统计 Max-Min 距离直方图。', url: pg(5) },
    fig3a: { label: 'Fig. 3(a)', source: 'main', loc: '正文第 5 页 · Figure 3(a)', content: '单个样本的 t-SNE：DivPrune 的选择覆盖所有簇；FastV 未选上方簇，且选中点扎堆。', url: pg(5) },
    fig3b: { label: 'Fig. 3(b)', source: 'main', loc: '正文第 5 页 · Figure 3(b)', content: 'SeedBench 1000 个样本上已选 token 的 Max-Min 距离直方图：DivPrune 整体高于 FastV。', url: pg(5) },
    tab1: { label: 'Table 1', source: 'main', loc: '正文第 6 页 · Table 1', content: 'LLaVA 1.5-7B / 1.5-13B / 1.6-7B 在 11 个图像数据集上的结果与 TFLOPs（ratio %）。', url: pg(6) },
    s43: { label: '§4.3', source: 'main', loc: '正文第 6–7 页 · §4.3 Image-Language Understanding', content: 'GQA/MMB 下降 5.1%/4.9%，VTW/FastV 至少下降 23.0%/42.8%；COCO CIDEr 下降约 95% vs 12.7%；POPE 略升；Ours* 对齐 PruMerge 的比例；13B 与 1.6 的对比；Fig. 1 讨论。', url: pg(6) },
    tab2: { label: 'Table 2', source: 'main', loc: '正文第 7 页 · Table 2', content: 'LLaVA-NeXT-Video-7B：5 个视频数据集的分数，以及显存峰值、预填充时间、端到端延迟。', url: pg(7) },
    s44: { label: '§4.4', source: 'main', loc: '正文第 7–8 页 · §4.4 Video-Language Understanding', content: '与图像实验相同的剪枝比例；基线取不低于 DivPrune TFLOPs 的最小可用配置。', url: pg(7) },
    s45: { label: '§4.5', source: 'main', loc: '正文第 8 页 · §4.5 Efficiency Analysis', content: 'VideoChatGPT 499 个样本；显存约少 400MB；预填充与端到端约快 55% 与 22%；预填充比基线长 6–7%，端到端短 1–7%；原因归于距离计算与基线逐步剪枝。', url: pg(8) },
    tab3: { label: 'Table 3', source: 'main', loc: '正文第 8 页 · Table 3', content: '在 Layer 0/1/2/3 剪枝：TFLOP 19.61/19.65/19.70/19.80%；平均 62.34/60.44/56.99/38.60。', url: pg(8) },
    tab4: { label: 'Table 4', source: 'main', loc: '正文第 8 页 · Table 4', content: '余弦/ℓ1/ℓ2/随机/Min-Max：平均 62.34/61.94/62.22/56.66/46.53（TFLOP 19.61%）。', url: pg(8) },
    s46: { label: '§4.6', source: 'main', loc: '正文第 8 页 · §4.6 Ablation Study', content: '默认在 Layer 0 剪枝；称该消融“using 5 datasets”；距离度量影响不大；随机低约 5.6%，Min-Max 低约 15.8%。', url: pg(8) },
    'supp-tab1': { label: 'supp Table 1', source: 'supp', loc: '补充材料第 1 页 · Table 1', content: 'LLaVA 1.5-7B 在 TextVQA、VizWiz、VQAv2 上的结果（EM）。', url: sp(1) },
    'supp-tab2': { label: 'supp Table 2', source: 'supp', loc: '补充材料第 2 页 · Table 2', content: '各数据集的任务、指标与提示词（lmms-eval 默认提示）。', url: sp(2) },
    'supp-fig1': { label: 'supp Fig. 1', source: 'supp', loc: '补充材料第 3 页 · Figure 1', content: 'SeedBench 2 例、GQA 3 例的 t-SNE，以及 GQA 上的 Max-Min 距离直方图。', url: sp(3) },
    'supp-fig2': { label: 'supp Fig. 2', source: 'supp', loc: '补充材料第 4 页 · Figure 2', content: 'LLaVA 1.5-13B 在不同 TFLOP 比例下的平均性能。', url: sp(4) },
    'supp-s5': { label: 'supp §5', source: 'supp', loc: '补充材料第 4 页 · §5 Hyper-Parameters of Baselines', content: 'DivPrune 剪枝率 91.2%；FastV（7B）K = 3、R = 0.001，（13B）K = 3、R = 0.023；VTW 在 LLaVA 1.5 用 K = 4、1.6 用 K = 3；M³ S = 56；FitPrune 剪枝率 90%。', url: sp(4) },
    'code-readme': { label: 'README', source: 'code', loc: 'README.md', content: '默认保留比例 0.098；tflops.py 复现论文 TFLOPs；eval_time.sh 用 LLaVA-1.6 测显存与延迟；代码基于 lmms-eval、LLaVA、FastV。', url: CODE + 'README.md' },
    'code-arch': { label: 'llava_arch.py L146–171', source: 'code', loc: 'LLaVA/llava/model/llava_arch.py 第 146–171 行', content: '`pairwise_cosine_similarity` 归一化后一次矩阵乘法；`DivPrune` 中 threshold_terms = int(round(ratio × len))；第一轮取每列第二小距离（排除自身），之后取到已选行的最小值，再 argmax。', url: ARCH + '#L146-L171' },
    'code-apply': { label: 'llava_arch.py L352–385', source: 'code', loc: 'LLaVA/llava/model/llava_arch.py 第 352–385 行', content: 'LAYER_INDEX == 0 时：SYS_TOKEN_LEN = 35；取 new_input_embeds[0] 的视觉段；选择结果加 35 后与前缀、后续文本拼成 keep_indexs 并 sort()；再索引 embeds、position_ids（非空时）与 attention_mask。', url: ARCH + '#L352-L385' },
    'code-encode': { label: 'llava_arch.py L141–144', source: 'code', loc: 'LLaVA/llava/model/llava_arch.py 第 141–144 行', content: 'encode_images：视觉塔输出经 mm_projector 投影，得到送入 LLM 的视觉 token。', url: ARCH + '#L141-L144' },
    'code-skip': { label: 'llava_arch.py L178', source: 'code', loc: 'LLaVA/llava/model/llava_arch.py 第 178 行', content: '当 input_ids.shape[1] == 1（解码阶段）时直接返回：剪枝只在预填充时做一次，KV cache 中只存剪枝后的序列。', url: ARCH + '#L178' },
    'code-flop': { label: 'tflops.py L1–22', source: 'code', loc: 'tflops.py 第 1–22 行', content: 'find_flop = T × (4nd² + 2n²d + 2ndm)；剪掉 int(round((1−r)·v)) 个视觉 token；前 layer 层按全长、其余按剪枝后长度计算。', url: CODE + 'tflops.py#L1-L22' },
    'code-ntok': { label: 'tflops.py L40–49', source: 'code', loc: 'tflops.py 第 40–49 行', content: '11 个图像数据集的平均文本 token 数 [15,15,23,83,25,113,15,39,21,91,57]；LLaVA 1.6 各数据集视觉 token 数 [2225,…,2116]；视频 5 个数据集文本 token 数 [28,63,21,38,196]，视觉 8×144。', url: CODE + 'tflops.py#L40-L49' },
    'code-r': { label: 'tflops.py L64–71', source: 'code', loc: 'tflops.py 第 64–71 行', content: 'DivPrune：k = 0；图像 r = 0.098，视频 r = 0.1。', url: CODE + 'tflops.py#L64-L71' },
    'code-run': { label: 'run_Divprune.sh', source: 'code', loc: 'run_Divprune.sh 第 5–20 行', content: '任务：coco2017_cap_val, flickr30k_test, gqa, mmbench_en_dev, mme, mmmu_val, nocaps_val, ok_vqa_val2014, pope, scienceqa_img, seedbench；LAYER_INDEX=0，SUBSET_RATIO=0.098；batch_size 1；RUN_NAME 为 llava_1.5_7b，但 pretrained 为 llava-v1.5-13b。', url: CODE + 'run_Divprune.sh#L5-L20' },
    'code-time': { label: 'eval_time.sh / llava.py L424–449', source: 'code', loc: 'eval_time.sh 第 1–37 行；lmms_eval/models/llava.py 第 424–449 行', content: 'eval_time.sh 用 llava-v1.6-vicuna-7b 与 coco2017_cap_val；用 CUDA Event 为 generate 计时；“max_new_tokens = 1 用于预填充计时”一行被注释。', url: CODE + 'lmms_eval/models/llava.py#L424-L449' },
    'ext-fastv': { label: 'FastV 原论文', source: 'ext', loc: 'arXiv 2403.06764（ECCV 2024）· 标题', content: 'An Image is Worth 1/2 Tokens After Layer 2：标题即其默认设定——第 2 层之后剪掉一半视觉 token。', url: 'https://arxiv.org/abs/2403.06764' },
  },

  // ------------------------------------------------------------------ 术语
  glossary: {
    lmm: { term: '大型多模态模型（LMM）', en: 'Large Multimodal Model', intuition: '能同时读图（或视频）和文字的大语言模型：先把图像编码成 token，再和文字一起交给 LLM。', role: '论文测试的对象：LLaVA 1.5-7B/13B、LLaVA 1.6-7B、LLaVA-NeXT-Video-7B。' },
    vtoken: { term: '视觉 token', en: 'visual token', intuition: '图像中一小块区域编码后的向量，在 LLM 眼里和一个文字 token 地位相同。', role: '剪枝对象。LLaVA 1.5 每图 576 个，每个 4096 维。' },
    projector: { term: '投影层', en: 'projector', intuition: '把视觉编码器的输出“翻译”到 LLM 词向量空间的一个小网络。', role: 'DivPrune 在投影层输出（即送入 LLM 的视觉 token）上计算余弦距离。' },
    prefill: { term: '预填充', en: 'prefill', intuition: '生成答案前，LLM 一次性处理全部输入并建立 KV cache 的阶段。', role: 'Eq. (5) 的 TFLOPs 只统计这一阶段；DivPrune 的选择也只在这一阶段做一次。' },
    kvcache: { term: 'KV cache', intuition: '把已处理 token 的键（K）和值（V）缓存起来，生成下一个词时不必重算。', role: '剪枝后缓存里只存保留的 token，因此能省显存；论文称 DivPrune 与 KV cache 兼容。' },
    mmdp: { term: '最大-最小多样性问题（MMDP）', en: 'Max-Min Diversity Problem', intuition: '从一堆元素里挑固定个数，让挑出的元素中“最近的那一对”尽量远。', role: 'DivPrune 对剪枝问题的数学表述（Eq. (3)）。' },
    cosdist: { term: '余弦距离', en: 'cosine distance', intuition: '1 减去两个向量夹角的余弦；只看方向、不看长度，范围 [0, 2]。', role: 'DivPrune 默认的距离（Eq. (4)）；Table 4 显示换成 ℓ1/ℓ2 影响很小。' },
    greedy: { term: '贪心算法', en: 'greedy algorithm', intuition: '每一步都做当下看起来最好的选择，从不回头修改。', role: 'Algorithm 1 的本质：每轮加入离已选集合最远的 token。它不保证得到 Eq. (3) 的最优解。' },
    tflops: { term: 'TFLOPs / TFLOP 比例', intuition: '万亿次浮点运算；比例是剪枝后计算量占原模型的百分比。', role: '论文对齐各方法算力的标尺（Eq. (5)）；只是理论估算，不等于实测速度。' },
    e2e: { term: '端到端延迟', en: 'end-to-end latency', intuition: '从输入到生成完整答案所用的总时间。', role: 'Table 2 中 DivPrune 从 4.37 s 降到 3.39 s；受输出长度影响。' },
    fastv: { term: 'FastV', intuition: '在 LLM 第 K 层看注意力分数，把得分低的视觉 token 剪掉。', role: '主要对手；本文实验中被配置为 K = 3、之后只保留约 1 个视觉 token。' },
    vtw: { term: 'VTW', en: 'Visual Tokens Withdrawal', intuition: '到某一层之后，把视觉 token 全部撤走。', role: '主要对手；本文关闭其校准，按 FLOPs 选层（7B 为 K = 4）。' },
    prumerge: { term: 'PruMerge', intuition: '在视觉编码器侧，根据注意力把 token 聚类、合并成少数几个。', role: '可变比例对手；DivPrune* 对齐它的平均保留比例。' },
    fitprune: { term: 'FitPrune', intuition: '用一小批校准数据，算出每层该剪多少 token 的“配方”。', role: '需要校准集的对照方法。' },
    m3: { term: 'M³（Matryoshka 多模态模型）', intuition: '通过微调，让模型学会使用嵌套的多粒度视觉 token。', role: '需要微调的对照方法；在部分数据集上高于 DivPrune。' },
    calib: { term: '校准集', en: 'calibration set', intuition: '为确定方法超参数而额外准备的一小批数据。', role: 'DivPrune 不需要；FitPrune、VTW（默认）需要。' },
    tsne: { term: 't-SNE', intuition: '把高维数据压到二维的可视化方法，擅长保留“谁和谁挨得近”。', role: 'Fig. 3(a) 用它展示选择分布；簇间距离不能直接解读。' },
    causal: { term: '因果注意力', en: 'causal attention', intuition: '每个位置只能看到它前面的位置，信息不能从后往前流。', role: '解释为什么晚剪的视觉 token 可能已把信息传给后面的问题 token（第 7 章）。' },
    se: { term: '标准误', en: 'standard error', intuition: '换一批同类题目重测时，分数大约会波动多少。', role: '描述单个模型分数的抽样波动量级；判断两个模型的差异需要同一批题目的配对分析。论文未报告任何不确定性。' },
    lmmseval: { term: 'lmms-eval', intuition: '一个开源的多模态模型统一评测工具包。', role: '论文所有基准分数都用它跑出；数据集划分由其任务名决定。' },
    ablation: { term: '消融实验', en: 'ablation study', intuition: '每次只改方法的一个部件，看效果变化多少。', role: 'Table 3（剪枝层位置）与 Table 4（距离与策略）。' },
    cider: { term: 'CIDEr', intuition: '图像描述任务的评分，衡量生成句子与多条参考描述的一致程度，可以超过 1。', role: 'COCO、Flickr、Nocaps 的指标；Fig. 1 把它与 0–1 分数直接平均。' },
  },

  // ------------------------------------------------------------------ 结论分级
  verdict: [
    {
      level: 'proven',
      title: '已证明',
      desc: '在论文测试的模型、数据集与单次运行条件下，有直接数据支撑。',
      items: [
        { claim: '在约 10–17% 的 TFLOP 比例下，DivPrune 的分数普遍高于作者复现的 FastV 与 VTW。', basis: 'Table 1（3 个图像模型 × 11 个数据集）、Table 2（5 个视频数据集）、补充材料 Table 1（3 个数据集）；均在同一环境下单次运行。' },
        { claim: '论文报告的 TFLOP 比例可以按公式与代码复现。', basis: '本页按 tflops.py 口径（+2n²d）复算 16 个可核对配置，15 个与表格一致；视频模型的 FastV（14.20%）不一致，原因未知。' },
        { claim: '在 Layer 0、保留 56 个 token 时，Max-Min 规则优于随机与 Min-Max。', basis: 'Table 4：62.34 / 56.66 / 46.53（四个数据集平均，单次运行）。' },
        { claim: '在 LLaVA-NeXT-Video-7B 上，DivPrune 降低了预填充时间、端到端延迟和显存峰值。', basis: 'Table 2：0.330→0.161 s，4.37→3.39 s，14.06→13.51 GB（VideoChatGPT 499 个样本平均，8×V100）。' },
        { claim: '把距离度量换成 ℓ1 或 ℓ2，结果几乎不变。', basis: 'Table 4：62.34 / 61.94 / 62.22。' },
      ],
    },
    {
      level: 'explained',
      title: '有解释但未证实',
      desc: '论文给出了解释或一致的证据，但实验设计不足以排除其他解释。',
      items: [
        { claim: '“多样性高 → 更能代表原 token → 精度更高”的因果链。', basis: 'Fig. 3(b) 显示 DivPrune 的 Max-Min 距离更高，但这正是它直接优化的量；Table 4 的随机/Min-Max 对照与该解释一致，但没有“多样性程度 vs 精度”的剂量关系实验。' },
        { claim: '在 Layer 0 剪枝优于在中间层剪枝。', basis: 'Table 3 固定了 TFLOPs，越晚剪保留越少（本页反推为 56/39/21/2），层位置与保留数两个变量混在一起。' },
        { claim: 'FastV、VTW 端到端更慢，是因为每个解码步都要重复剪枝计算。', basis: '§4.5 的解释依赖基线的具体实现；论文未说明实现版本，也未报告输出长度。' },
        { claim: 'Algorithm 1 求得了 MMDP 的精确解 / 达到最高多样性。', basis: 'Algorithm 1 是贪心算法；5.2 的穷举对照显示贪心并非总是最优；论文未给出最优性证明。' },
        { claim: '剪枝能提升部分任务的表现（POPE、MMMU、VizWiz）。', basis: 'POPE、MMMU 的差值很小（+0.18、+0.67 个百分点），论文为单次运行、未报告不确定性，无法判断是否超出评测波动；VizWiz 的原因论文未分析。' },
      ],
    },
    {
      level: 'unknown',
      title: '仍然未知',
      desc: '论文没有提供足够证据，或者超出了论文的测试范围。',
      items: [
        { claim: '结果的波动范围有多大。', basis: '全部为单次运行，没有多次运行或置信区间。' },
        { claim: '在其他架构和更大模型上的效果。', basis: '论文只测试了 LLaVA 系列（7B、13B）。README 列出了社区移植到 Gemma、Qwen2.5-VL 的仓库，但不属于论文证据。' },
        { claim: '与问题相关的细节任务会损失多少。', basis: 'DivPrune 不看问题文本；补充材料中 TextVQA 下降约 10 分，但论文未分析原因。' },
        { claim: '在更多 token（高分辨率、长视频）下的开销与效果。', basis: '距离矩阵为 M × M，贪心循环为 M̃ 轮串行；论文最多只测到约 2300 个视觉 token（LLaVA 1.6）。' },
        { claim: '层内剪枝与视频实验能否用公开代码复现。', basis: '公开仓库没有层内剪枝与视频模型的 DivPrune 实现，也没有与 Table 2 设置一致的效率脚本。' },
      ],
    },
  ],

  sources: [
    { label: '正式版论文（CVF Open Access）', url: HTML, note: 'CVPR 2025，第 9392–9401 页；本页编号以此为准。' },
    { label: '正式版 PDF', url: MAIN, note: '证据芯片中的页码指向此 PDF。' },
    { label: '补充材料 PDF', url: SUPP, note: '补充材料中的图表在页面中注明为 supp。' },
    { label: 'arXiv 2503.02175', url: 'https://arxiv.org/abs/2503.02175', note: '预印本；内容与正式版可能有出入，本页不以它为准。' },
    { label: '官方代码 vbdi/divprune', url: `https://github.com/vbdi/divprune/tree/${COMMIT}`, note: '固定到 commit 799e2d9（2026-04-16）；核心文件最后修改于 commit 689ab4d（2025-03-23）。' },
    { label: 'FastV 原论文（arXiv 2403.06764）', url: 'https://arxiv.org/abs/2403.06764', note: '仅用于说明 FastV 的默认设定。' },
  ],
};
