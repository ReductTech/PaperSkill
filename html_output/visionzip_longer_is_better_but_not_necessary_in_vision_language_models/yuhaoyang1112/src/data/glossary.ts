export const glossary = {
  patch: {
    title: 'Patch / 图块', short: 'patch', english: 'image patch',
    meaning: '输入图像切成的小块。A3 这样的坐标指向原图中的一个位置。',
    role: '视觉编码器经过多层自注意力后，A3 位置的特征也能携带来自其他图块的信息。',
  },
  '视觉 token': {
    title: '视觉 token', short: '视觉 token', english: 'visual token',
    meaning: '模型用来表示一个视觉位置或一组位置的特征向量。',
    role: '论文中的 64 个输出数的是压缩后送进语言模型的向量个数，每个向量各占一个序列位置。',
  },
  CLS: {
    title: 'CLS / 类别标记', short: 'CLS', english: 'class token',
    meaning: 'CLIP 在所有 patch 前加的汇聚位置。它能对整张图分配注意力。',
    role: 'VisionZip 读取 CLS 发给各 patch 的注意力给它们打分；在作者的 LLaVA / CLIP 代码中，CLS 自己的特征也占一个输出名额。',
  },
  '主导 token': {
    title: '主导 token', short: '主导 token', english: 'dominant token',
    meaning: '由视觉注意力分数选出的高分位置，直接保留其隐藏特征。',
    role: '在 LLaVA / CLIP 的 64 档，dominant 参数传入 54，代码为 CLS 腾出一位，实际选 53 个高分 patch。',
  },
  '上下文代表': {
    title: '上下文代表', short: '上下文代表', english: 'target token',
    meaning: '从所有非主导位置中按步长取出的一个位置，后续由它接收分到同一组的特征。',
    role: '作者代码先定代表，再比较每个其余位置和各代表 key 的方向，把它分给最相似的代表。',
  },
  '上下文 token': {
    title: '上下文 token', short: '上下文 token', english: 'contextual token',
    meaning: '一个代表与归给它的其余组员合并后，整组贡献的输出向量。',
    role: '固定 CLIP 实现先求其余组员隐藏特征的逐维均值，再加回代表自己的隐藏特征；没有其他组员时保留代表本身。',
  },
  query: {
    title: 'Query / 查询向量', short: 'query', english: 'query vector',
    meaning: '注意力中一个位置用来查询其他位置的向量。',
    role: '读注意力矩阵时，行对应发起查询的位置。CLIP 跟踪 CLS 发出的查询；无 CLS 的 SigLIP 把所有查询纳入统计。',
  },
  key: {
    title: 'Key / 键向量', short: 'key', english: 'key vector',
    meaning: '一个位置用于匹配的向量。归一化后，可以用点积比较两个 key 的方向。',
    role: 'VisionZip 用 key 选择组员要跟随的代表。决定归哪一组后，真正参与合并的是各位置的隐藏特征。',
  },
  '余弦相似度': {
    title: '余弦相似度', short: '余弦相似度', english: 'cosine similarity',
    meaning: '两个非零向量单位化后的点积。值越大，向量的方向越接近。',
    role: '归组时每个待归并位置选择 key 余弦相似度最高的代表，所以图像上相隔很远的两个位置也可能同组。',
  },
  '隐藏特征': {
    title: '隐藏特征', short: '隐藏特征', english: 'hidden state',
    meaning: '视觉编码器在一个序列位置上算出的内容向量。',
    role: '主导位置直接保留此向量。代表聚合组员时对这些向量逐维求均值，而 key 只在决定归组时使用。',
  },
  '投影层': {
    title: 'Projector / 投影层', short: '投影层', english: 'projector 投影器',
    meaning: '把视觉特征映射到语言模型输入空间的模块。',
    role: 'LLaVA 路径先压缩再投影。表 1 的 ‡ 配置对投影器做了微调，免训练的 VisionZip 也可以直接使用原投影器。',
  },
  prefill: {
    title: 'Prefill / 预填充', short: 'prefill', english: 'time to first token 首 token',
    meaning: '语言模型读入已有的图文前缀，建立后续生成使用的键值缓存。',
    role: '表 4 把首个 token 的延迟和整套 POPE 测试的耗时分开列出。读表时需要分别查看两个时间比值。',
  },
  '相对表现': {
    title: '相对表现', short: '相对表现', english: 'relative performance',
    meaning: '以同一任务上的完整模型得分作为参照，把压缩后得分换算为百分比。',
    role: '表 1 同列原始分数、对应百分比和 11 项的汇总。页面沿用论文印出的数值；四舍五入后的单项未必能逐格复原百分比。',
  },
} as const;

export type TermKey = keyof typeof glossary;
