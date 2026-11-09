// 收束：结论分级（每条写依据）、复述五问、来源。
import { PMLR_PAGE, PMLR_PDF, REPO, COMMIT, VIDEO_COMMIT } from '../modules/sv-data';

export type Level = 'proven' | 'explained' | 'unknown';
export interface Verdict {
  id: string;
  level: Level;
  claim: string;
  basis: string;
  chap: number;
}

export const LEVELS: { level: Level; title: string; desc: string }[] = [
  { level: 'proven', title: '已证明', desc: '论文实测或代码直接支持，且本页复算对得上。' },
  { level: 'explained', title: '有解释但未证实', desc: '论文给了说法或间接证据，但缺少能把原因单独分离出来的实验。' },
  { level: 'unknown', title: '仍然未知', desc: '现有论文、代码和本页复算都回答不了。' },
];

export const VERDICTS: Verdict[] = [
  { id: 'v1', level: 'proven', chap: 8, claim: '在 LLaVA-1.5 的三个档位上，SparseVLM 的 8 项平均都高于同档的 ToMe、FastV、PDrop。', basis: '表 1：99.1 / 96.7 / 89.3% vs 次高的 PDrop 95.9 / 94.3 / 73.4%；百分比与平均分可由原始分数复算。论文仅报告一组汇总结果，未交代重复运行次数和方差；档位内差距都在 2 个点以上。' },
  { id: 'v2', level: 'proven', chap: 6, claim: '回收被删 token 在表 4 的 8 个设置里都没有降分，保留数越少帮助越大。', basis: '表 4：GQA +0.1 至 +1.6，POPE +0.1 至 +4.7；“+TR”一行与表 1 的 SparseVLM 一致。' },
  { id: 'v3', level: 'proven', chap: 7, claim: '固定代码里的“保留 192 / 128 / 64 个”是 32 层视觉 token 数的平均，逐层是 576 → 309 → 204 → 113（192 档）。', basis: 'score.py 的配额、剪枝层 [2, 6, 15]、回收与簇数公式，以及代码打印 equal token num 的方式；本页按代码常数逐层推算，三档平均为 192.0 / 128.6 / 64.8。' },
  { id: 'v4', level: 'proven', chap: 9, claim: '128 档的理论 FLOPs 比原模型少 62.8%，实测延迟少 42.4%。', basis: '表 1：1.72 vs 4.62 T、33.28 vs 57.82 ms；FLOPs 能用代码计数式复算到 ±0.02 T（需假设图像之外约 118 个 token）。' },
  { id: 'v5', level: 'explained', chap: 3, claim: '用评分员（而不是全部文本或全部 token）打分更准。', basis: '在图 5 的 64 档实验中，相比全部文本，使用评分员后 TextVQA 提高 0.4 个百分点，POPE 提高 2.7 个百分点；其他档位和基准没有报告。' },
  { id: 'v6', level: 'explained', chap: 2, claim: 'SparseVLM 领先 FastV，主要因为“看问题”打分。', basis: 'SparseVLM 与 FastV 同时在剪枝层数、逐层配额、回收上都不同；论文没有在相同配额、不回收的条件下单独比较“评分员打分”与“最后位置打分”。' },
  { id: 'v7', level: 'explained', chap: 5, claim: '打分矩阵的秩能反映视觉 token 的冗余，从而自适应决定每层删多少。', basis: 'Eq. (7) 只有一句论证；rank(P) 不超过评分员个数；图像版代码没有实现，只有视频分支使用（λ = 1）。' },
  { id: 'v8', level: 'explained', chap: 9, claim: '延迟下降主要来自 token 变少。', basis: 'FLOPs 与延迟不成比例；PDrop FLOPs 更低却更慢。论文没有拆分各部分耗时。附录 F 描述的计时范围包含图像编码等环节，固定提交的 CUDA 计时只包围解码器循环，未覆盖视觉编码和评分员选择；两者与表 1 结果的具体对应关系尚未确认。' },
  { id: 'v9', level: 'unknown', chap: 8, claim: '表 1 里不到 1 个点的差距是否稳定。', basis: '论文仅报告一组汇总结果，未交代重复运行次数和方差，也没有误差条或置信区间；评测本身的波动范围未报告。没有报告重复次数，不能据此认定只运行过一次。' },
  { id: 'v10', level: 'unknown', chap: 10, claim: '表 1 是否正是用固定提交的代码跑出来的。', basis: '论文写秩策略、余弦归簇、求和合并、双 FlashAttention，代码分别是固定配额、欧氏距离、求平均、显式注意力；README 也没有说明。' },
  { id: 'v11', level: 'unknown', chap: 10, claim: 'Qwen2-VL 与 Mini-Gemini 上具体怎样剪。', basis: '固定提交只包含 LLaVA 的实现；表 2 的保留数（600 / 500 / 400）怎样分到各层没有说明。' },
  { id: 'v12', level: 'unknown', chap: 4, claim: '附录 B 的“双 FlashAttention”是否被实际使用、方向是否正确。', basis: '按字面推导得到的是各位置对评分员的注意力，与 Eq. (3) 方向相反；固定代码没有使用它。' },
];

export const RETELL: { q: string; a: string }[] = [
  { q: 'SparseVLM 想解决什么问题？', a: '视觉 token 占输入的大头（LLaVA-1.5 每张图 576 个），每层都要算；已有的剪枝方法没有充分利用问题来决定留哪些图块。SparseVLM 不训练、不加参数，在解码层里按问题逐层删掉视觉 token。' },
  { q: '“评分员”是什么，为什么要挑？', a: '进入解码层前，用嵌入算每个文本 token 与图像的平均相关度，高于均值的当评分员。介词、代词、模板 token 与图像无关，让它们参与打分会稀释信号（图 5：64 档 POPE +2.7）。' },
  { q: '一个视觉 token 的去留怎样决定？', a: '在剪枝层（代码里第 2、6、15 层）取评分员对视觉 token 的注意力，头平均、评分员平均后排序。论文用秩决定删几个；固定代码按配额保留前 k 个。' },
  { q: '被删的 token 去了哪里？', a: '分数最高的 30% 进回收池，用 kNN 密度峰聚类分组（每 10 个约 1 组），每组平均成一个新 token，插回保留的视觉 token 之后。表 4 显示保留数越少，回收帮助越大。' },
  { q: '读表 1 时要注意什么？', a: '“保留 192 个”是 32 层平均，前 3 层仍是 576 个，所以同档 FLOPs 反而最高；FLOPs 与延迟不成比例；论文仅报告一组汇总结果，未交代重复运行次数和方差，小差距不可判；数字以 ICML 正式版为准，早期版本与 VisionZip 引用的数字不同。' },
];

export const SOURCES: { label: string; url: string; note: string }[] = [
  { label: 'ICML 2025 正式版（PMLR 267: 74840–74857）', url: PMLR_PAGE, note: '本页第一依据；页码、表号、公式号均按正式版。PDF：' + PMLR_PDF },
  { label: 'arXiv 2410.04417v4（2025-06-03）', url: 'https://arxiv.org/abs/2410.04417v4', note: 'arXiv 最新版本；本页数字不以它为准。' },
  { label: 'arXiv 2410.04417v1（2024-10-06）', url: 'https://arxiv.org/abs/2410.04417v1', note: '早期版本：主表列与数值不同（如 192 档 GQA 57.6，正式版 59.5）。' },
  { label: `官方代码 v1.5 分支，固定提交 ${COMMIT.slice(0, 7)}`, url: `${REPO}/tree/${COMMIT}`, note: '该提交只改 README；代码最后一次改动是 535f8ba（2025-03-03）。不要用 main 分支（现为 SparseVLM+）。' },
  { label: `官方代码 video 分支，提交 ${VIDEO_COMMIT.slice(0, 7)}`, url: `${REPO}/tree/${VIDEO_COMMIT}`, note: '表 3 的 Video-LLaVA 实验；使用秩策略，只在第 1 层剪。' },
  { label: 'VisionZip（CVPR 2025）', url: 'https://openaccess.thecvf.com/content/CVPR2025/html/Yang_VisionZip_Longer_is_Better_but_Not_Necessary_in_Vision_Language_CVPR_2025_paper.html', note: '表 1 引用“SparseVLM(2024.10)”，即早期版本数字；§8.2 只并排展示，不与正式版混算。' },
  { label: 'FastV（ECCV 2024）', url: 'https://arxiv.org/abs/2403.06764', note: '表 1、表 3 的主要对照：第 2 层后按最后位置的注意力剪枝。' },
  { label: 'PyramidDrop（CVPR 2025）', url: 'https://arxiv.org/abs/2410.17247', note: '表 1 对照（不训练版本）。' },
  { label: 'ToMe（ICLR 2023）', url: 'https://arxiv.org/abs/2210.09461', note: '表 1 对照：按相似度合并 token。' },
  { label: 'Clustering by fast search and find of density peaks（Science 2014）', url: 'https://doi.org/10.1126/science.1242072', note: '§6 密度峰聚类的出处。' },
];
