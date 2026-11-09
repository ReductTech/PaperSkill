// 证据芯片：正文里写 [[ev:键]]，渲染成可点的小标签（论文链接到 PMLR 正式版 PDF 的页码，代码链接到固定提交的行号）。
import { PMLR_PDF, code, videoCode } from '../modules/sv-data';

export interface Evidence {
  label: string;
  url: string;
  loc: string;
  content: string;
  source: 'paper' | 'code' | 'arxiv' | 'ext';
}

const P = (page: number) => `${PMLR_PDF}#page=${page}`;
const F = 'llava/model/language_model/modelling_sparse_llama.py';
const S = 'llava/model/language_model/score.py';
const U = 'llava/model/language_model/utils.py';

export const EVIDENCE: Record<string, Evidence> = {
  intro: { label: '正文 p.1–2', url: P(1), loc: 'ICML 正式版第 1–2 页 引言', content: '文本引导、无需训练；4.5× 压缩保持 97%；CUDA 延迟降 37%、精度降 0.9%', source: 'paper' },
  fig1: { label: '图 1 p.2', url: P(2), loc: 'ICML 正式版第 2 页 图 1', content: '同一张图、三个问题：文本引导的稀疏化选出不同图块；不看文本的方法对所有问题选同一批', source: 'paper' },
  related: { label: '相关工作 p.2–3', url: P(2), loc: 'ICML 正式版第 2–3 页', content: 'LLaVA 336×336 → 576 个 token；672×672 → 2304 个；视觉 token 数常是文本的数十到数百倍', source: 'paper' },
  eq1: { label: 'Eq. (1) p.3', url: P(3), loc: 'ICML 正式版第 3 页 Eq. (1)', content: 'A = Softmax(QKᵀ/√D)', source: 'paper' },
  eq23: { label: 'Eq. (2)(3) p.3', url: P(3), loc: 'ICML 正式版第 3 页 Eq. (2)(3)', content: 'P 取语言指令为 query、图像为 key 的注意力；p̃ = 对文本维求平均', source: 'paper' },
  fig3: { label: '图 3 p.5', url: P(5), loc: 'ICML 正式版第 5 页 图 3', content: '四个基准的示例问题：介词、代词等与图像无关，不应参与打分', source: 'paper' },
  eq56: { label: 'Eq. (5)(6) p.4', url: P(4), loc: 'ICML 正式版第 4 页 Eq. (5)(6)', content: 'r = (1/Lv)·Σⱼ Softmax(Hv Hqᵀ)ⱼ；r ≥ mean(r) 的文本 token 成为评分员；只在进入解码层前算一次', source: 'paper' },
  eq7: { label: 'Eq. (7) p.4', url: P(4), loc: 'ICML 正式版第 4 页 Eq. (7)', content: 'N = λ·(Lv − rank(P))；删除 P 中分数最小的 N 个；N = 0 时跳过该层', source: 'paper' },
  recycle: { label: '§3.3 p.4', url: P(4), loc: 'ICML 正式版第 4 页 §3.3', content: '回收被删池中 P 值最高的 τ%，kNN 密度峰聚类（Eq. 8–9），按余弦相似度归簇，Eq. (10) 组内逐元素求和', source: 'paper' },
  eq11: { label: 'Eq. (11) p.5', url: P(5), loc: 'ICML 正式版第 5 页 §3.4 Eq. (11)', content: '每层减少 6(N−C)D² + 2(N−C)²D 的 FLOPs，减去打分、选评分员、求秩、聚类的开销', source: 'paper' },
  tab1: { label: '表 1 p.6', url: P(6), loc: 'ICML 正式版第 6 页 表 1', content: 'LLaVA-1.5，8 个基准 × 192 / 128 / 64 × ToMe / FastV / PDrop / SparseVLM，含 FLOPs（T）与延迟（ms）', source: 'paper' },
  tab2: { label: '表 2 p.6', url: P(6), loc: 'ICML 正式版第 6 页 表 2', content: 'Qwen2-VL：动态分辨率 / 600 / 500 / 400 个 token', source: 'paper' },
  fig4: { label: '图 4 p.7', url: P(7), loc: 'ICML 正式版第 7 页 图 4', content: 'MGM 上 POPE / TextVQA / GQA 随保留 token 数的曲线（无数值表）', source: 'paper' },
  tab3: { label: '表 3 p.7', url: P(7), loc: 'ICML 正式版第 7 页 表 3', content: 'Video-LLaVA，2048 → 194 个 token，与 FastV 对比；每个基准前 1000 个样本', source: 'paper' },
  fig5: { label: '图 5 p.7', url: P(7), loc: 'ICML 正式版第 7 页 图 5', content: 'LLaVA-7B，64 个 token：全部 token / 全部文本 / 评分员 三种打分来源', source: 'paper' },
  tab4: { label: '表 4 p.8', url: P(8), loc: 'ICML 正式版第 8 页 表 4', content: '回收（TR）消融：GQA、POPE × 64 / 96 / 128 / 192', source: 'paper' },
  eff: { label: '§5.3 p.8', url: P(8), loc: 'ICML 正式版第 8 页 §5.3', content: '单张 A100-80GB；CUDA 时间降 43.1%、FLOPs 降 62.8%、保持 96.7%；KV Cache 302.4MB → 100.8MB', source: 'paper' },
  concl: { label: '结论 p.8', url: P(8), loc: 'ICML 正式版第 8 页 §6', content: '延迟降 37.0%、压缩率 77.8%、保持 97%；视频上超过 FastV 14.7%', source: 'paper' },
  appB: { label: '附录 B p.12–13', url: P(12), loc: 'ICML 正式版第 12–13 页 附录 B', content: '“双 FlashAttention”：第二遍用特制 V 矩阵（评分员行为 1/n）直接得到对评分员的平均注意力', source: 'paper' },
  appC: { label: '附录 C p.14', url: P(14), loc: 'ICML 正式版第 14 页 附录 C', content: '各步骤开销：打分 Lt·Lv，选评分员 Lt·Lv·2D，求秩约 Lt·Lv·min(Lt, Lv)，聚类 Lr(3Lr−1)·2D + Lr', source: 'paper' },
  appE: { label: '附录 E p.15', url: P(15), loc: 'ICML 正式版第 15 页 附录 E', content: '单张 A100-80G；Python 3.10、PyTorch 2.1.2、CUDA 11.8、transformers 4.31.0', source: 'paper' },
  appF: { label: '附录 F p.16', url: P(16), loc: 'ICML 正式版第 16 页 附录 F', content: '论文描述：CUDA 时间包含图像编码（如适用）、KV Cache 读取（如适用）与 Transformer 前向；不含模型加载；注意力用 FlashAttention', source: 'paper' },

  cLoc: { label: '剪枝层 [2, 6, 15]', url: code(F, 69), loc: `${F} 第 69 行`, content: 'pruning_loc=[2, 6, 15]（层号从 0 起计）', source: 'code' },
  cRaters: { label: '选评分员 L202–204', url: code(F, 202, 204), loc: `${F} 第 202–204 行`, content: 'm_v_t = v_t @ t_tᵀ；softmax(2).mean(1)；取 > 均值的文本位置（用的是进入第 0 层前的嵌入）', source: 'code' },
  cFlops: { label: 'FLOPs 计数 L221', url: code(F, 221), loc: `${F} 第 221 行`, content: 'all_FLOPs += 4nd² + 2n²d + 3ndm（n 为进入该层的 token 数）', source: 'code' },
  cTopk: { label: 'score.py L5–9', url: code(S, 5, 9), loc: `${S} 第 5–9 行`, content: 'layer_dict = {2:0, 6:1, 15:2}；192:[300,200,110]，128:[303,110,36]，64:[66,30,17]', source: 'code' },
  cScore: { label: '打分 score.py L21–35', url: code(S, 21, 35), loc: `${S} 第 21–35 行`, content: '注意力对头平均 → 取评分员行、视觉列 → 对评分员平均 → topk(配额)', source: 'code' },
  cRecycle: { label: '回收 L286–296', url: code(F, 286, 296), loc: `${F} 第 286–296 行`, content: '被删 token 按分数取前 int(0.3·删除数)+1 个；簇数 int(回收数/10)+1；cluster_and_merge', source: 'code' },
  cConcat: { label: '拼接 L301–308', url: code(F, 301, 308), loc: `${F} 第 301–308 行`, content: '合并 token 插在保留的视觉 token 之后、文本之前；position_ids 截取前 n 个（连续重排）', source: 'code' },
  cCount: { label: '计数 L363、L373', url: code(F, 363), loc: `${F} 第 363、373 行`, content: '每层记录该层处理后的视觉 token 数，32 层平均后打印为 equal token num', source: 'code' },
  cLogits: { label: '显式注意力 L564–578', url: code(F, 564, 578), loc: `${F} 第 564–578 行`, content: '剪枝层另外计算完整的 softmax(QKᵀ/√d)（L × L），再走 FlashAttention2 计算输出', source: 'code' },
  cBuilder: { label: 'builder.py L114–116', url: code('llava/model/builder.py', 114, 116), loc: 'llava/model/builder.py 第 114–116 行', content: '给 32 层都挂上 LlamaDynamicvitFlashAttention2 并复制权重', source: 'code' },
  cCluster: { label: 'utils.py L247–270', url: code(U, 247, 270), loc: `${U} 第 247–270 行`, content: '距离 / √C；k = 簇数的近邻求密度；比自己密度高的最近距离 δ；score = δ·ρ 取前 C 个为中心', source: 'code' },
  cAssign: { label: 'utils.py L273–275', url: code(U, 273, 275), loc: `${U} 第 273–275 行`, content: '按（归一化的）欧氏距离把每个 token 分给最近的中心', source: 'code' },
  cMerge: { label: 'utils.py L289–308', url: code(U, 289, 308), loc: `${U} 第 289–308 行`, content: '权重全为 1，除以组内总权重 → 组内求平均', source: 'code' },
  cTiming: { label: '计时 L214–366', url: code(F, 214, 366), loc: `${F} 第 214、366 行`, content: '计时起点在评分员选择（第 202–204 行）之后、终点在解码层循环之后；图像编码在更早的 prepare_sparse_inputs_labels_for_multimodal 里；只在预填充（序列长度不为 1）时计时', source: 'code' },
  cDecodePos: { label: '解码位置 L554', url: code(F, 554), loc: `${F} 第 554 行`, content: '解码新 token 时位置号 = 该层缓存长度（各层不同）', source: 'code' },
  vRank: { label: 'video 分支 score.py L12', url: videoCode('videollava/model/language_model/score.py', 12), loc: 'video 分支 f05b898 videollava/model/language_model/score.py 第 12 行', content: 'rank = torch.linalg.matrix_rank(P)；保留 rank 个视觉 token', source: 'code' },
  vLoc: { label: 'video 分支 L69', url: videoCode('videollava/model/language_model/modeling_sparse_llama.py', 69), loc: 'video 分支 f05b898 modeling_sparse_llama.py 第 69 行', content: 'pruning_loc=[1]：只在第 1 层剪一次', source: 'code' },
  vCall: { label: 'video 分支 L236', url: videoCode('videollava/model/language_model/modeling_sparse_llama.py', 236), loc: 'video 分支 f05b898 modeling_sparse_llama.py 第 236 行', content: '调用 attn_postprocess_rank 时传 5 个参数，函数定义需要 6 个（缺 layer_idx）', source: 'code' },

  arxivV1: { label: 'arXiv v1', url: 'https://arxiv.org/abs/2410.04417v1', loc: 'arXiv 2410.04417v1（2024-10-06）', content: '早期版本：主表的列与数值与正式版不同（如 192 档 GQA 57.6）', source: 'arxiv' },
  arxivV4: { label: 'arXiv v4', url: 'https://arxiv.org/abs/2410.04417v4', loc: 'arXiv 2410.04417v4（2025-06-03）', content: 'arXiv 最新版本；本页数字以 ICML 正式版为准', source: 'arxiv' },
  visionzip: { label: 'VisionZip 表 1', url: 'https://openaccess.thecvf.com/content/CVPR2025/html/Yang_VisionZip_Longer_is_Better_but_Not_Necessary_in_Vision_Language_CVPR_2025_paper.html', loc: 'VisionZip（CVPR 2025）表 1', content: '引用行标为 SparseVLM(2024.10)，即早期版本的数字', source: 'ext' },
};
