import type { FormulaDef, PaperEquationId } from '../types';

const sub = (base: string, index: string) => `<msub><mi>${base}</mi><mrow>${index}</mrow></msub>`;
const index = (name: string) => `<mi>${name}</mi>`;
const yi = sub('𝐲', index('i'));
const yj = sub('𝐲', index('j'));
const yl = sub('𝐲', index('l'));
const ai = sub('𝛂', index('i'));
const aij = sub('𝛂', '<mi>i</mi><mi>j</mi>');
const Ai = sub('𝐀', index('i'));
const Si = sub('S', index('i'));
const ri = sub('𝐑', index('i'));
const rj = sub('𝐑', index('j'));
const one = sub('𝟏', index('m'));
const D = '<mi>𝐃</mi>';
const epsilon = sub('ε', index('i'));
const pq = '<mi>p</mi><mo>,</mo><mi>q</mi>';

const sum = (variable: string, end: string) =>
  `<munderover><mo>∑</mo><mrow><mi>${variable}</mi><mo>=</mo><mn>1</mn></mrow><mi>${end}</mi></munderover>`;
const groupSum = `<munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo>${Si}</mrow></munder>`;
const minimize = (variables: string) => `<munder><mo>min</mo><mrow>${variables}</mrow></munder>`;
const normBase = (expr: string) => `<mrow><mo>∥</mo>${expr}<mo>∥</mo></mrow>`;
const norm = (expr: string, order: string) => `<msub>${normBase(expr)}<mrow>${order}</mrow></msub>`;
const squaredNorm = (expr: string) => `<msubsup>${normBase(expr)}<mn>2</mn><mn>2</mn></msubsup>`;
const difference = (left: string, right: string) => `${left}<mo>−</mo>${right}`;
const kernel = (patch: string) => `${sub('K', index('h'))}<mo>(</mo>${difference(yi, patch)}<mo>)</mo>`;
const subjectTo = '<mspace width=".35em"/><mtext>s.t.</mtext><mspace width=".35em"/>';
const all = (variable: string) => `<mo>∀</mo><mi>${variable}</mi><mspace width=".28em"/>`;
const rows = (lines: string[]) => '<mtable columnalign="left" rowspacing=".38em">' + lines
  .map(line => '<mtr><mtd>' + line + '</mtd></mtr>').join('') + '</mtable>';

export const paperEquations: Record<PaperEquationId, FormulaDef> = {
  1: {
    label: '式（1）',
    page: 2,
    title: '非局部均值怎样借用相似块',
    lead: '论文先用非局部均值解释图像自相似。两块越接近，候选像素在加权平均里通常越有分量。分母把所有权重归一化。',
    mathml: `<mi>𝐱</mi><mo>[</mo><mi>i</mi><mo>]</mo><mo>=</mo>${sum('j', 'n')}
      <mfrac><mrow>${kernel(yj)}</mrow><mrow>${sum('l', 'n')}${kernel(yl)}</mrow></mfrac>
      <mi>𝐲</mi><mo>[</mo><mi>j</mi><mo>]</mo>`,
    symbols: [
      { sym: 'Kₕ', desc: '以 h 为带宽的高斯核。两块越相似，核权重通常越大。' },
      { sym: '𝐲ᵢ、𝐲ⱼ', desc: '分别围绕第 i 个、第 j 个像素提取的观测图块。' },
      { sym: '𝐱[i]、𝐲[j]', desc: '𝐱[i] 是目标像素的估计，𝐲[j] 是候选像素的观测值。' },
    ],
  },
  2: {
    label: '式（2）',
    page: 2,
    title: '用固定字典估计一个图块',
    lead: '在误差预算 ε 内选尽量稀疏的系数。演示取 p = 0，比较用了多少个原子。约束中的 α 沿用原文记号。',
    mathml: `${minimize(`${ai}<mo>∈</mo><msup><mi>ℝ</mi><mi>k</mi></msup>`)}
      ${norm(ai, index('p'))}${subjectTo}${squaredNorm(difference(yi, D + '<mi>𝛂</mi>'))}<mo>≤</mo><mi>ε</mi>`,
    symbols: [
      { sym: '𝐃', desc: '固定的字典，每列是一种可以用于组合的图块原子。' },
      { sym: '𝛂ᵢ', desc: '第 i 个图块的 k 维编码，记录各字典原子的权重。' },
      { sym: 'ε', desc: '观测与重建之间允许的平方误差上限。' },
    ],
  },
  3: {
    label: '式（3）',
    page: 2,
    title: '从图像学习适合自己的字典',
    lead: '在独立稀疏编码中，把每块的稀疏度相加，同时学习各块的系数和一套共同字典。',
    mathml: rows([
      `${minimize(`${D}<mo>∈</mo><mi>𝒞</mi><mo>,</mo><mi>𝐀</mi>`)}${sum('i', 'n')}${norm(ai, index('p'))}`,
      `${subjectTo}${squaredNorm(difference(yi, D + ai))}<mo>≤</mo><mi>ε</mi>`,
    ]),
    symbols: [
      { sym: '𝒞', desc: '列向量具有单位二范数的字典集合。' },
      { sym: '𝐀', desc: '把独立编码的系数按列排在一起，每列对应一个图块。' },
      { sym: 'p', desc: '决定稀疏度量。论文讨论 p = 0 与 p = 1。' },
    ],
  },
  4: {
    label: '式（4）',
    page: 3,
    title: '独立编码时如何平均',
    lead: '把每个恢复块放回原位置。在原文每个像素有 m 份估计的设定下，求和后除以 m。',
    mathml: `<mi>𝐱</mi><mo>=</mo><mfrac><mn>1</mn><mi>m</mi></mfrac>${sum('i', 'n')}${ri}${D}${ai}`,
    symbols: [
      { sym: '𝐑ᵢ', desc: '把第 i 个重建块放回整图的插入矩阵。' },
      { sym: 'm', desc: '此处原文设定下，每个像素由 m 个重叠块估计。' },
    ],
  },
  5: {
    label: '式（5）',
    page: 3,
    title: '用系数矩阵的行表达共享原子',
    lead: '把一组相似块的系数排成矩阵。每列对应一个块，每行对应同一个原子，按行度量就能把原子选择联在一起。',
    mathml: `${norm('<mi>𝐀</mi>', pq)}<mo>≜</mo>${sum('i', 'k')}
      <msubsup>${normBase('<msup><mi>𝛂</mi><mi>i</mi></msup>')}<mi>q</mi><mi>p</mi></msubsup>`,
    symbols: [
      { sym: '𝛂ⁱ', desc: '系数矩阵的第 i 行，描述同一个原子在各图块中的系数。' },
      { sym: 'p、q', desc: '原文讨论 (1, 2) 与 (0, ∞)。后者统计系数矩阵有多少行参与重建。' },
    ],
  },
  6: {
    label: '式（6）',
    page: 3,
    title: '用块距离决定相似组',
    lead: '比较整个图块的灰度结构。距离的平方不超过阈值 ξ，候选块就进入第 i 组。',
    mathml: `${Si}<mo>≜</mo><mo>{</mo><mi>j</mi><mo>=</mo><mn>1</mn><mo>,</mo><mo>…</mo><mo>,</mo><mi>n</mi>
      ${subjectTo}${squaredNorm(difference(yi, yj))}<mo>≤</mo><mi>ξ</mi><mo>}</mo>`,
    symbols: [
      { sym: 'Sᵢ', desc: '以图块 i 为参考得到的相似块索引集合。' },
      { sym: 'ξ', desc: '入组的平方欧氏距离阈值。越严格的阈值会留下更少的候选块。' },
    ],
  },
  7: {
    label: '式（7）',
    page: 3,
    title: '联合编码 · 固定字典，求一组图块的系数',
    lead: '最小化符号下只有系数矩阵 Aᵢ，字典 D 已经给定。最终重建采用 ℓ₀,∞，即在整组的拟合误差不超过 εᵢ 时，尽量少启用原子行。',
    mathml: rows([
      `${minimize(Ai)}${norm(Ai, pq)}`,
      `${subjectTo}${groupSum}${squaredNorm(difference(yj, D + aij))}<mo>≤</mo>${epsilon}`,
    ]),
    symbols: [
      { sym: '𝐀ᵢ', desc: '第 i 个相似组的系数矩阵。每个列向量可以取不同数值。' },
      { sym: '𝛂ᵢⱼ', desc: '在第 i 个相似组中，为第 j 个图块求出的系数。' },
      { sym: 'εᵢ', desc: '整组的平方重建误差上限。' },
    ],
  },
  8: {
    label: '式（8）',
    page: 4,
    title: '字典学习 · 用所有图块组一起更新字典',
    lead: '最小化符号下同时有 D 和各组的 Aᵢ。论文用 ℓ₁,₂ 度量各组的稀疏性，并用组大小归一化各组的代价。所有组共同决定字典中的原子应该长什么样。',
    mathml: rows([
      `${minimize(`<msubsup><mrow><mo>(</mo>${Ai}<mo>)</mo></mrow><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></msubsup>
        <mo>,</mo>${D}<mo>∈</mo><mi>𝒞</mi>`)}${sum('i', 'n')}
        <mfrac>${norm(Ai, pq)}<msup><mrow><mo>|</mo>${Si}<mo>|</mo></mrow><mi>p</mi></msup></mfrac>`,
      `<mtext>s.t.</mtext><mspace width=".35em"/>${all('i')}${groupSum}
        ${squaredNorm(difference(yj, D + aij))}<mo>≤</mo>${epsilon}`,
    ]),
    symbols: [
      { sym: '|Sᵢ|ᵖ', desc: '相似组的大小的 p 次幂，用来归一化该组在目标函数中的代价。' },
      { sym: '𝐃 ∈ 𝒞', desc: '可学习的字典，其列向量具有单位二范数。' },
    ],
  },
  9: {
    label: '式（9）',
    page: 4,
    title: '把相似组的恢复结果融合成整图',
    lead: '有的像素收到更多估计。先累加所有还原块，再按每个像素真正收到的次数逐点归一化。',
    mathml: rows([
      `<mi>𝐱</mi><mo>=</mo><msup><mrow><mi mathvariant="normal">diag</mi><mo>(</mo>
        ${sum('i', 'n')}${groupSum}${rj}${one}<mo>)</mo></mrow><mrow><mo>−</mo><mn>1</mn></mrow></msup>`,
      `<mspace width="1.4em"/><mo>×</mo>${sum('i', 'n')}${groupSum}${rj}${D}${aij}`,
    ]),
    symbols: [
      { sym: '𝐑ⱼ𝟏ₘ', desc: '把块中的全一向量回填到整图，对覆盖到的每个像素计一次。' },
      { sym: 'diag(…)⁻¹', desc: '用覆盖次数构成对角矩阵并取逆，实现每个像素各除以自己的次数。' },
      { sym: '𝐑ⱼ𝐃𝛂ᵢⱼ', desc: '把第 i 组中第 j 块的恢复结果放回原图位置。' },
    ],
  },
  10: {
    label: '式（10）',
    page: 5,
    title: '补色时只约束已经采样的位置',
    lead: 'Bayer 掩码筛出实际测到的颜色。原文这一步要求候选重建在实测位置吻合，其余分量由字典和组稀疏约束共同估计。',
    mathml: rows([
      `${minimize(`${Ai}<mo>∈</mo><msup><mi>ℝ</mi><mrow><mi>k</mi><mo>×</mo><mo>|</mo>${Si}<mo>|</mo></mrow></msup>`)}
        ${norm(Ai, '<mn>0</mn><mo>,</mo><mo>∞</mo>')}`,
      `${subjectTo}${all('j')}${sub('M', index('j'))}<mo>(</mo>
        ${difference(yj, sub('𝐃', '<mn>0</mn>') + aij)}<mo>)</mo><mo>=</mo><mn>0</mn>`,
    ]),
    symbols: [
      { sym: 'Mⱼ', desc: '第 j 个图块的 Bayer 掩码，只保留实测颜色分量上的残差。' },
      { sym: '𝐃₀', desc: '从自然彩色图像预学得到的初始字典。' },
      { sym: '𝐀ᵢ', desc: '第 i 组的系数矩阵，用参与重建的行数衡量共享原子的多少。' },
    ],
  },
  psnr: {
    label: '§4.1 注 5',
    page: 5,
    title: '原文怎样把误差换算成 PSNR',
    lead: '原文对 0–255 强度范围写出下面的指标。教学 RAW 演示用 0–1 归一化读数，峰值相应取 1。',
    mathml: `<mi mathvariant="normal">PSNR</mi><mo>=</mo><mn>10</mn><msub><mi mathvariant="normal">log</mi><mn>10</mn></msub>
      <mo>(</mo><mfrac><msup><mn>255</mn><mn>2</mn></msup><mi mathvariant="normal">MSE</mi></mfrac><mo>)</mo>`,
    symbols: [
      { sym: 'MSE', desc: '在同一评价区域内，把恢复结果与参考值之差平方后取平均。' },
      { sym: '255', desc: '原文评估图像强度的最大值。结果以 dB 为单位，数值越高代表平方误差越小。' },
    ],
  },
};
