import type { SymbolDef } from '../types';

export interface MathMeaning { tex: string; name: string; description: string }
export interface AnnotatedMath { tex: string; meanings: MathMeaning[]; explanation: string }

const definitions: Record<string, [string, string]> = {
  S: ['相似度矩阵', '矩阵就是按行、列排列的一张数值表。这里一行对应一张图片，一列对应一段文字，每格由这对图文的单位向量做点积得到。'],
  I: ['图像向量矩阵', '把每张图片的单位向量排成一行，再把多行叠在一起。行数等于图片数，每行都有 d 个分量。'],
  T: ['文本向量矩阵', '把每段文字的单位向量排成一行，每行都有 d 个分量。右上角额外的 T 表示转置，即交换矩阵的行与列，不是另一个文本输入。'],
  Z: ['缩放分数矩阵', '把相似度矩阵的每一格都除以同一个正温度，得到进入 Softmax 前的分数。'],
  h: ['编码器特征', '编码器从图片或文字中提取的一串数值。下标 I 表示图像分支，T 表示文本分支；这些特征还要经过线性投影与归一化才能按 CLIP 的方式比较。'],
  image: ['图像单位向量', '图片经过编码、线性投影和 L2 归一化后的表示。它的长度为 1，方向用于和文本向量比较。'],
  text: ['文本单位向量', '文字经过编码、线性投影和 L2 归一化后的表示。它与图像单位向量处在同一个 d 维空间。'],
  prediction: ['预测类别', '取最高分候选的索引。它只能来自当前提供的候选列表，不保证一定是真实类别。'],
  norm: ['L2 长度', '把向量各分量平方后相加，再开平方。非零向量除以这个长度，就得到单位向量。'],
  theta: ['向量夹角', '两个向量方向之间的夹角。方向相同为 0°，垂直为 90°，方向相反为 180°。'],
  tau: ['温度', '严格大于 0 的缩放量。先用分数除以温度，再经 Softmax 转成概率。固定候选和分数时，温度越低，概率越集中于最高分项；若最高分错了，也会更集中地选错。'],
  eta: ['学习率', '控制一次更新迈多大步。在三个 logit 的实验中，用学习率乘以梯度，再从当前分数中减去；这里更新的是教学分数，不是编码器权重。'],
  candidates: ['当前候选集合', '当前提供的类别索引集合。移除类别会改变模型可选的答案，也会改变 Softmax 的分母。'],
  imageEncoder: ['图像编码器', '把图片 x 转换成特征向量的函数。CLIP 使用独立的图像编码器处理视觉输入。'],
  textEncoder: ['文本编码器', '把类别描述 c 转换成特征向量的函数。它处理文字，不负责生成回答。'],
  imageProjection: ['图像投影矩阵', '图像分支自己的线性权重表。它与图像特征相乘，把原分量重新组合成 d 个分量；真实预训练会与编码器一起学习这些权重。'],
  textProjection: ['文本投影矩阵', '文本分支自己的线性权重表。它把文本特征重新组合成 d 个分量，与图像投影的输出维数一致；两边的权重不共享。'],
  s: ['相似度', '归一化图像向量与文本向量的点积，也就是余弦相似度，范围为 −1 到 1。它本身不是概率。'],
  p: ['候选概率', 'Softmax 在当前比较的候选中分配的相对概率，所有候选加起来为 1。它依赖候选范围，不能直接当作预测在现实中正确的概率。'],
  q: ['按列归一化的概率', '固定第 j 段文字，比较它与各张图片的分数后，经 Softmax 得到的概率。qᵢⱼ 是分给图片 i 的份额，每一列加起来为 1。'],
  z: ['缩放分数 / logit', '进入 Softmax 之前的分数。在 CLIP 中通常由相似度除以正温度得到；更新实验直接调整三个示意 logit。'],
  y: ['训练目标', '用来标记原始配对的目标向量：原配的位置为 1，其他位置为 0。更新实验设为 [1, 0, 0]，所以三个候选中的第 1 个是训练目标。'],
  v: ['图像投影向量', '图像特征经过线性投影后的 d 维非零向量。它还需要除以自己的 L2 长度。'],
  u: ['文本投影向量', '文本特征经过线性投影后的 d 维非零向量，与图像投影向量有相同维数。'],
  comparisonCount: ['图文比较总数', 'N 张图片分别与 N 段文字比较，共有 N × N 个分数。它包含 N 个原始配对，以及 N² − N 个批内非配对。'],
  N: ['批次配对数', '预训练时，一次送入的这批原始图文对的数量，不是类别数。N 张图片与 N 段文字两两比较，会产生 N × N 个分数。'],
  B: ['待预测图片数', '这次零样本使用中同时输入的图片数量。它决定相似度矩阵有多少行。'],
  K: ['候选类别数', '这次零样本分类可选择的类别数量。每类由一个类别向量代表，因此 K 决定相似度矩阵有多少列，不一定等于图片数。'],
  d: ['共同维数', '线性投影后的每个向量有多少个分量，不是向量的 L2 长度。两边维数相同才能做点积；让相近内容得到相近表示，还需要配对训练。'],
  imageDimension: ['图像特征维数', '图像编码器输出特征的维数，在进入共同空间之前可以与文本特征维数不同。'],
  textDimension: ['文本特征维数', '文本编码器输出特征的维数。它随后通过独立投影变成共同的 d 维。'],
  i: ['图片索引', '用来区分当前批次里的图片，例如第 1 张、第 2 张。它是编号，不是向量的长度。'],
  j: ['文字或类别索引', '用来区分候选文字或类别。矩阵的第 j 列对应第 j 段文字。'],
  k: ['遍历索引', '求和或寻找最高分时使用的临时编号，用来依次查看当前方向的各个候选。'],
  L: ['损失', '用一个数衡量原始配对获得概率的情况。单个原配的交叉熵为负对数概率，原配概率越高，该项损失越低；完整批次还要对多个原配取平均，不能据此断言每项都变好了。'],
  rowLoss: ['图片找文字的损失', '固定每张图片，按行比较候选文字；计算原始配对的负对数概率，再对全部图片取平均。'],
  columnLoss: ['文字找图片的损失', '固定每段文字，按列比较候选图片；计算原始配对的负对数概率，再对全部文字取平均。'],
  t: ['可学习的对数缩放参数', '论文通过指数函数得到正的缩放量。写成温度时，τ = exp(−t)，所以温度始终为正。'],
  x: ['输入图片', '送入图像编码器的图片数据；它与文字描述是两种不同形式的输入。'],
  c: ['输入描述', '送入文本编码器的文字，例如 a photo of a cat。零样本时用它描述候选类别。'],
  argmax: ['取最大值的索引', '比较全部候选的得分，返回最高分对应的编号，而不是返回分数本身。'],
  sum: ['求和', '按照上下标指定的索引范围，把每一项计算结果相加。'],
  exp: ['指数函数', 'exp(a) 就是 e 的 a 次方。它把分数变成正数，供 Softmax 再归一化。'],
  log: ['自然对数', 'log 或 ln 在这里都表示自然对数。概率越接近 1，负对数越接近 0。'],
};

function escapedAt(source: string, index: number): boolean {
  let slashes = 0;
  for (let i = index - 1; i >= 0 && source[i] === '\\'; i--) slashes++;
  return slashes % 2 === 1;
}
function groupEnd(source: string, index: number, open = '{', close = '}'): number {
  if (source[index] !== open) return index + 1;
  let depth = 0;
  for (let cursor = index; cursor < source.length; cursor++) {
    if (escapedAt(source, cursor)) continue;
    if (source[cursor] === open) depth++;
    if (source[cursor] === close && --depth === 0) return cursor + 1;
  }
  return source.length;
}
function skipSpace(source: string, index: number): number {
  while (/\s/.test(source[index] || '') && index < source.length) index++;
  return index;
}
/** One TeX token or one complete group; preserve bare macro arguments unchanged. */
function argumentEnd(source: string, index: number): number {
  const start = skipSpace(source, index);
  if (start >= source.length) return start;
  if (source[start] === '{') return groupEnd(source, start);
  if (source[start] === '\\') return start + (/^\\[a-zA-Z]+/.exec(source.slice(start))?.[0].length || 2);
  return start + 1;
}
function withScripts(source: string, end: number): number {
  let result = end;
  const modifierStart = skipSpace(source, result);
  const modifier = /^\\(?:limits|nolimits|displaylimits)(?![A-Za-z])/.exec(source.slice(modifierStart));
  if (modifier) result = modifierStart + modifier[0].length;
  for (let n = 0; n < 2; n++) {
    const start = skipSpace(source, result);
    if (source[start] !== '_' && source[start] !== '^') break;
    result = argumentEnd(source, start + 1);
  }
  return result;
}
const special: [RegExp, string][] = [
  [/^\\lVert(?![A-Za-z])[\s\S]*?\\rVert(?![A-Za-z])(?:_\{2\}|_2)?/, 'norm'],
  [/^\\hat(?![A-Za-z])\s*\{\s*\\mathbf(?![A-Za-z])\s*(?:\{i\}|i)\s*\}/, 'image'],
  [/^\\hat(?![A-Za-z])\s*\{\s*\\mathbf(?![A-Za-z])\s*(?:\{t\}|t)\s*\}/, 'text'],
  [/^\\hat(?![A-Za-z])\s*(?:\{y\}|y)/, 'prediction'],
  [/^\\mathcal(?![A-Za-z])\s*(?:\{C\}|C)/, 'candidates'],
  [/^\\mathcal(?![A-Za-z])\s*(?:\{L\}|L)/, 'L'],
  [/^\\mathbf(?![A-Za-z])\s*(?:\{v\}|v)/, 'v'],
  [/^\\mathbf(?![A-Za-z])\s*(?:\{u\}|u)/, 'u'],
  [/^\\mathbf(?![A-Za-z])\s*(?:\{h\}|h)/, 'h'],
  [/^\\operatorname(?![A-Za-z])\s*\{arg(?:\\,|\s)*max\}/, 'argmax'],
  [/^\\(?:tau|theta|eta|sum|exp|log|ln)(?![A-Za-z])/, 'command'],
  [/^f_(?:[IT]|\{[IT]\})/, 'encoder'],
  [/^W_(?:[IT]|\{[IT]\})/, 'projection'],
  [/^d_(?:[IT]|\{[IT]\})/, 'dimension'],
];
const literalArgument = /^\\(?:text|textrm|textsf|texttt|textnormal|textbf|textit|textup|textmd|emph|mathrm|mathsf|mathtt|mathbf|mathit|mathnormal|mathcal|mathbb|mathfrak|mathscr|boldsymbol|bm|operatorname|begin|end)$/;
const argumentCounts: Record<string, number> = {
  '\\sqrt': 1, '\\hat': 1, '\\widehat': 1, '\\bar': 1, '\\overline': 1,
  '\\underline': 1, '\\vec': 1, '\\tilde': 1, '\\widetilde': 1,
  '\\dot': 1, '\\ddot': 1, '\\breve': 1, '\\check': 1, '\\acute': 1, '\\grave': 1,
  '\\overbrace': 1, '\\underbrace': 1, '\\boxed': 1, '\\phantom': 1,
  '\\hphantom': 1, '\\vphantom': 1, '\\mathord': 1, '\\mathop': 1,
  '\\mathbin': 1, '\\mathrel': 1, '\\mathopen': 1, '\\mathclose': 1,
  '\\mathpunct': 1, '\\mathinner': 1, '\\frac': 2, '\\dfrac': 2,
  '\\tfrac': 2, '\\binom': 2, '\\dbinom': 2, '\\tbinom': 2,
  '\\overset': 2, '\\underset': 2, '\\stackrel': 2,
};
/** Braced math arguments remain explorable; a bare argument is copied intact. */
function protectedCommandEnd(source: string, command: string, end: number): number {
  if (literalArgument.test(command)) return argumentEnd(source, end);
  const count = argumentCounts[command];
  if (!count) return end;
  let cursor = skipSpace(source, end), bare = false;
  if (command === '\\sqrt' && source[cursor] === '[') {
    cursor = groupEnd(source, cursor, '[', ']');
  }
  for (let n = 0; n < count; n++) {
    cursor = skipSpace(source, cursor);
    if (source[cursor] !== '{') bare = true;
    cursor = argumentEnd(source, cursor);
  }
  return bare ? cursor : end;
}
const normalized = (value: string) => value.replace(/\s+/g, '');
const plain = (value: string) => value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Annotate complete TeX atoms; never rewrite inside command names or literal text. */
export function annotateFormula(source: string, symbols: SymbolDef[] = [], explanation?: string): AnnotatedMath {
  const meanings: MathMeaning[] = [];
  let result = '', index = 0;
  while (index < source.length) {
    // An unrecognized base may still have a bare script, e.g. a^N.
    // Copy that argument intact instead of inserting an unbraced htmlData command.
    if (source[index] === '_' || source[index] === '^') {
      const end = argumentEnd(source, index + 1);
      result += source.slice(index, end);
      index = end;
      continue;
    }
    const rest = source.slice(index);
    let atom = '', key = '';
    for (const [pattern, meaning] of special) {
      const match = pattern.exec(rest);
      if (match) { atom = match[0]; key = meaning; break; }
    }
    if (!atom && /^[spqzyvuNBKdijkLtxcSITZh]/.test(rest)) { atom = rest[0]; key = atom; }
    if (atom) {
      const end = withScripts(source, index + atom.length);
      atom = source.slice(index, end);
      if (key === 'command') key = /^\\([a-z]+)/.exec(atom)?.[1] || '';
      if (key === 'ln') key = 'log';
      if (key === 'N' && /^N\s*\^\s*(?:2|\{\s*2\s*\})\s*$/.test(atom)) key = 'comparisonCount';
      if (key === 'encoder') key = /^f_\{?I/.test(atom) ? 'imageEncoder' : 'textEncoder';
      if (key === 'projection') key = /^W_\{?I/.test(atom) ? 'imageProjection' : 'textProjection';
      if (key === 'dimension') key = /^d_\{?I/.test(atom) ? 'imageDimension' : 'textDimension';
      if (key === 'L' && /I\\to T/.test(atom)) key = 'rowLoss';
      if (key === 'L' && /T\\to I/.test(atom)) key = 'columnLoss';
      const definition = definitions[key];
      if (definition) {
        const override = symbols.find(symbol => normalized(symbol.tex || symbol.sym) === normalized(atom));
        const termId = meanings.length;
        meanings.push({ tex: atom, name: definition[0], description: override ? plain(override.desc) : definition[1] });
        result += '\\htmlData{term-id=' + termId + '}{' + atom + '}';
        index = end;
        continue;
      }
    }
    if (source[index] === '\\') {
      const command = /^\\[a-zA-Z]+/.exec(rest)?.[0] || rest.slice(0, 2);
      const end = protectedCommandEnd(source, command, index + command.length);
      result += source.slice(index, end);
      index = end;
    } else { result += source[index++]; }
  }
  const fallback = source.includes('\\begin{bmatrix}') ? '按行排列的数值表示一个矩阵，只有一列时表示列向量。矩阵乘向量会把输入映射成新的表示。'
    : source.includes('\\frac') ? '分式表示上面的量除以下面的量。将鼠标移到带点线的符号上，可以分别查看各个量的含义。'
    : meanings.length ? meanings[0].description : '这里展示的是当前实验的数值表达；数值随相应输入和操作即时计算。';
  return { tex: result, meanings, explanation: explanation || fallback };
}
