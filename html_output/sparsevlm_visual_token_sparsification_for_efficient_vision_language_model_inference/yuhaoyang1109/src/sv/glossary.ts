// 术语表：每条有“直觉”和“在本文中的作用”。正文里写 [[t:键|显示文字]]，悬停 / 聚焦 / 点按显示释义。
export interface Term {
  term: string;
  en?: string;
  intuition: string;
  role: string;
}

export const GLOSSARY: Record<string, Term> = {
  vlm: { term: '视觉语言模型', en: 'VLM', intuition: '先把图像编码成一串 token，再和文字一起交给大语言模型逐层处理。', role: '本文的加速对象：LLaVA-1.5、Mini-Gemini、Qwen2-VL、Video-LLaVA。' },
  vtok: { term: '视觉 token', en: 'visual token', intuition: '图像切成小块后，每块变成一个和词向量同维度的向量。', role: 'LLaVA-1.5 每张图 576 个，占输入大头；SparseVLM 逐层删掉其中不重要的。' },
  ttok: { term: '文本 token', en: 'text token', intuition: '问题与对话模板分词后的片段。', role: '代码里指图像之后的全部 token（问题 + “ASSISTANT:”等模板），是评分员的候选。' },
  rater: { term: '评分员', en: 'rater', intuition: '只请与图像相关的词来投票，介词、代词不投。', role: 'Eq. (5)(6)：相关度 r 高于平均值的文本 token；它们对视觉 token 的注意力决定保留谁。' },
  attn: { term: '注意力矩阵', en: 'attention map', intuition: '每个位置把“注意力”按比例分给前面的各个位置，一行加起来是 1。', role: 'SparseVLM 直接复用解码层里已经算出的注意力来打分，不加参数、不训练。' },
  causal: { term: '因果注意力', en: 'causal attention', intuition: '每个位置只能看见自己和前面的位置。', role: '视觉 token 排在问题之前，所以“问题看图”能算，“图看问题”在因果掩码下为 0（见 §4 的附录 B 核对）。' },
  pmat: { term: '打分矩阵 P', en: 'sparsification priority matrix', intuition: '从注意力矩阵里只截出“评分员行 × 视觉列”这一块。', role: '对行求平均得到每个视觉 token 的分数 p̃；论文还用它的秩决定删多少。' },
  rank: { term: '矩阵的秩', en: 'rank', intuition: '矩阵里真正“互不重复”的行（或列）有几条。', role: 'Eq. (7) 用 Lv − rank(P) 衡量冗余；但 rank(P) 不会超过评分员个数，图像版代码也没用它。' },
  topk: { term: '前 k 个', en: 'top-k', intuition: '按分数排序，只留最高的 k 个。', role: '固定提交的代码在第 2、6、15 层按配额 top-k 保留视觉 token。' },
  prefill: { term: '预填充', en: 'prefill', intuition: '把整段输入一次性算过 32 层，得到第一个输出词。', role: 'SparseVLM 的剪枝只发生在预填充阶段；表 1 的 FLOPs 按预填充计算。' },
  decode: { term: '解码', en: 'decoding', intuition: '之后每次只算一个新 token，读取前面缓存的 K、V。', role: '剪枝后各层缓存变短，解码时读得更少。' },
  kv: { term: 'KV Cache', intuition: '把每层每个 token 的 K、V 存下来，解码时不必重算。', role: '论文称 192 个 token 时缓存从 302.4 MB 降到 100.8 MB；按代码逐层保留数，视觉部分约省 64%（§7）。' },
  pos: { term: '位置编号', en: 'position ids / RoPE', intuition: '告诉模型每个 token 在序列里排第几。', role: '代码剪枝后截取前 n 个位置号，相当于把剩下的 token 连续重新编号。' },
  recycle: { term: 'token 回收', en: 'token recycling', intuition: '扔掉之前，把“落选里最好的一批”打包留下。', role: '被删 token 里分数最高的 30% 进回收池，聚类后每簇合成 1 个 token 插回序列。' },
  dpc: { term: '密度峰聚类', en: 'density peaks clustering', intuition: '簇中心周围很密，而且离更密的点都很远。', role: 'Eq. (8)(9)：用 kNN 密度 ρ 和距离 δ 的乘积选中心，再把其余 token 分给最近的中心。' },
  knn: { term: 'k 近邻', en: 'k-nearest neighbors', intuition: '离自己最近的 k 个点。', role: '密度 ρ 由 k 个近邻的平均距离算出；代码里 k 取簇数。' },
  equal: { term: '等效 token 数', en: 'equal token num', intuition: '把 32 层各自的视觉 token 数取平均。', role: '代码打印的就是它；表 1 的“保留 192 个”在代码里就是这个平均数，不是每层都 192 个。' },
  flops: { term: 'FLOPs', intuition: '按公式数出来的乘加次数，与硬件无关。', role: '表 1 给出预填充 TFLOPs；代码计数式为每层 4nd² + 2n²d + 3ndm。' },
  latency: { term: 'CUDA 延迟', en: 'CUDA latency', intuition: '在 GPU 上实际计时得到的毫秒数。', role: '表 1 的 Latency 在单张 A100-80GB 上测。附录 F 说计时包含图像编码与前向；固定代码的计时只包围解码器循环（见 §9）。' },
  trainfree: { term: '无需训练', en: 'training-free', intuition: '不改权重、不加模块，推理时直接插入。', role: 'SparseVLM 只读注意力和隐藏状态做选择与合并。' },
  fastv: { term: 'FastV', intuition: '在第 2 层之后，按最后一个位置对图像的注意力删掉一部分视觉 token。', role: '表 1、表 3 的主要对照；同为不训练的注意力剪枝。' },
  tome: { term: 'ToMe', en: 'Token Merging', intuition: '把彼此最相似的 token 两两合并。', role: '表 1 的对照，不看问题；64 档掉分最多。' },
  pdrop: { term: 'PDrop', en: 'PyramidDrop', intuition: '分几个阶段，每阶段按比例丢掉一批视觉 token，形成金字塔。', role: '表 1 的对照（不训练版本）；FLOPs 比 SparseVLM 低，但实测延迟更高。' },
  flash: { term: 'FlashAttention', intuition: '分块计算注意力，不把完整的 L × L 矩阵写进显存。', role: '它不输出注意力矩阵，打分要另想办法：附录 B 提了一个技巧，固定代码则在剪枝层显式算完整矩阵。' },
};
