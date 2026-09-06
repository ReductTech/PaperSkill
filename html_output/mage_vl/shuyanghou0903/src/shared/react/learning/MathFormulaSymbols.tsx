import type { HTMLAttributes, ReactNode } from 'react';
import { MathFormulaStatic, MathFormulaTerm, type MathFormulaTermProps } from './MathFormulaBlock';

export type MathSymbolTone = NonNullable<MathFormulaTermProps['tone']>;

export interface MathSymbolDefinition {
  key: string;
  latex: string;
  label: string;
  description: string;
  category: 'array' | 'set' | 'index' | 'linear-algebra' | 'calculus' | 'probability' | 'function' | 'dataset';
  tone?: MathSymbolTone;
}

export const DL_MATH_SYMBOLS = {
  scalar: { key: 'scalar', latex: 'a', label: '标量', description: 'a：标量，可以是整数或实数。', category: 'array' },
  vector: { key: 'vector', latex: '\\boldsymbol{a}', label: '向量', description: 'a：向量，一组按顺序排列的数。', category: 'array' },
  matrix: { key: 'matrix', latex: '\\boldsymbol{A}', label: '矩阵', description: 'A：矩阵，按行和列组织的二维数组。', category: 'array' },
  tensor: { key: 'tensor', latex: '\\mathsf{A}', label: '张量', description: '张量：超过二维或泛指多维数组的数据结构。', category: 'array' },
  identityN: { key: 'identityN', latex: '\\boldsymbol{I}_n', label: 'n 阶单位矩阵', description: 'I_n：n 行 n 列的单位矩阵。', category: 'array' },
  identity: { key: 'identity', latex: '\\boldsymbol{I}', label: '单位矩阵', description: 'I：维度由上下文确定的单位矩阵。', category: 'array' },
  basisVector: { key: 'basisVector', latex: '\\boldsymbol{e}^{(i)}', label: '标准基向量', description: 'e^(i)：第 i 个位置为 1，其余位置为 0 的标准基向量。', category: 'array' },
  diagonalMatrix: { key: 'diagonalMatrix', latex: '\\operatorname{diag}(\\boldsymbol{a})', label: '对角矩阵', description: 'diag(a)：以向量 a 的元素作为对角线元素的对角矩阵。', category: 'array' },
  randomScalar: { key: 'randomScalar', latex: '\\mathrm{a}', label: '标量随机变量', description: 'a：标量随机变量。', category: 'probability' },
  randomVector: { key: 'randomVector', latex: '\\boldsymbol{\\mathrm{a}}', label: '向量随机变量', description: 'a：向量随机变量。', category: 'probability' },
  randomMatrix: { key: 'randomMatrix', latex: '\\boldsymbol{\\mathrm{A}}', label: '矩阵随机变量', description: 'A：矩阵随机变量。', category: 'probability' },

  realSet: { key: 'realSet', latex: '\\mathbb{R}', label: '实数集', description: 'R：实数集合。', category: 'set' },
  binarySet: { key: 'binarySet', latex: '\\{0,1\\}', label: '二元集合', description: '{0,1}：只包含 0 和 1 的集合。', category: 'set' },
  integerRangeSet: { key: 'integerRangeSet', latex: '\\{0,1,\\ldots,n\\}', label: '整数范围集合', description: '{0,1,...,n}：从 0 到 n 的整数集合。', category: 'set' },
  closedInterval: { key: 'closedInterval', latex: '[a,b]', label: '闭区间', description: '[a,b]：包含端点 a 和 b 的实数区间。', category: 'set' },
  halfOpenInterval: { key: 'halfOpenInterval', latex: '(a,b]', label: '半开半闭区间', description: '(a,b]：不包含 a、但包含 b 的实数区间。', category: 'set' },
  setDifference: { key: 'setDifference', latex: '\\mathbb{A}\\setminus\\mathbb{B}', label: '差集', description: 'A\\B：包含在 A 中但不包含在 B 中的元素集合。', category: 'set' },
  graph: { key: 'graph', latex: '\\mathcal{G}', label: '图', description: 'G：图结构，由节点和边组成。', category: 'set' },
  parents: { key: 'parents', latex: '\\operatorname{Pa}_{\\mathcal{G}}(x_i)', label: '父节点', description: 'Pa_G(x_i)：图 G 中 x_i 的父节点集合。', category: 'set' },

  vectorElement: { key: 'vectorElement', latex: 'a_i', label: '向量第 i 个元素', description: 'a_i：向量 a 的第 i 个元素。', category: 'index' },
  vectorExceptI: { key: 'vectorExceptI', latex: '\\boldsymbol{a}_{-i}', label: '除第 i 项外的向量', description: 'a_-i：向量 a 中除第 i 个元素外的所有元素。', category: 'index' },
  matrixElement: { key: 'matrixElement', latex: 'A_{i,j}', label: '矩阵元素', description: 'A_{i,j}：矩阵 A 的第 i 行、第 j 列元素。', category: 'index' },
  matrixRow: { key: 'matrixRow', latex: 'A_{i,:}', label: '矩阵第 i 行', description: 'A_{i,:}：矩阵 A 的第 i 行。', category: 'index' },
  matrixColumn: { key: 'matrixColumn', latex: 'A_{:,i}', label: '矩阵第 i 列', description: 'A_{:,i}：矩阵 A 的第 i 列。', category: 'index' },
  tensorElement: { key: 'tensorElement', latex: 'A_{i,j,k}', label: '三维张量元素', description: 'A_{i,j,k}：三维张量 A 的一个元素。', category: 'index' },
  tensorSlice: { key: 'tensorSlice', latex: 'A_{:,:,i}', label: '张量二维切片', description: 'A_{:,:,i}：三维张量 A 的第 i 个二维切片。', category: 'index' },

  transpose: { key: 'transpose', latex: '\\boldsymbol{A}^{\\top}', label: '转置', description: 'A^T：矩阵 A 的转置。', category: 'linear-algebra' },
  pseudoInverse: { key: 'pseudoInverse', latex: '\\boldsymbol{A}^{+}', label: 'Moore-Penrose 伪逆', description: 'A^+：矩阵 A 的 Moore-Penrose 伪逆。', category: 'linear-algebra' },
  hadamardProduct: { key: 'hadamardProduct', latex: '\\boldsymbol{A}\\odot\\boldsymbol{B}', label: 'Hadamard 乘积', description: 'A ⊙ B：矩阵 A 和 B 的逐元素乘积。', category: 'linear-algebra' },
  determinant: { key: 'determinant', latex: '\\det(\\boldsymbol{A})', label: '行列式', description: 'det(A)：矩阵 A 的行列式。', category: 'linear-algebra' },
  normP: { key: 'normP', latex: '\\lVert\\boldsymbol{x}\\rVert_p', label: 'Lp 范数', description: '||x||_p：向量 x 的 Lp 范数。', category: 'linear-algebra' },
  normTwo: { key: 'normTwo', latex: '\\lVert\\boldsymbol{x}\\rVert_2', label: 'L2 范数', description: '||x||_2：向量 x 的 L2 范数。', category: 'linear-algebra' },

  derivative: { key: 'derivative', latex: '\\frac{dy}{dx}', label: '导数', description: 'dy/dx：y 关于 x 的导数。', category: 'calculus' },
  partialDerivative: { key: 'partialDerivative', latex: '\\frac{\\partial y}{\\partial x}', label: '偏导数', description: '∂y/∂x：y 关于 x 的偏导数。', category: 'calculus' },
  gradient: { key: 'gradient', latex: '\\nabla_{\\boldsymbol{x}}y', label: '梯度', description: '∇_x y：y 关于向量 x 的梯度。', category: 'calculus' },
  matrixDerivative: { key: 'matrixDerivative', latex: '\\nabla_{\\boldsymbol{X}}y', label: '矩阵导数', description: '∇_X y：y 关于矩阵 X 的导数。', category: 'calculus' },
  jacobian: { key: 'jacobian', latex: '\\boldsymbol{J}_{\\boldsymbol{X}}y', label: 'Jacobian 矩阵', description: 'J_X y：y 关于 X 求导后的 Jacobian 矩阵。', category: 'calculus' },
  hessian: { key: 'hessian', latex: '\\boldsymbol{H}(f)(\\boldsymbol{x})', label: 'Hessian 矩阵', description: 'H(f)(x)：函数 f 在点 x 处的 Hessian 矩阵。', category: 'calculus' },
  integralDomain: { key: 'integralDomain', latex: '\\int f(x)\\,dx', label: '定积分', description: '积分符号：在整个域上对 x 积分。', category: 'calculus' },
  integralSet: { key: 'integralSet', latex: '\\int_{\\mathbb{S}} f(x)\\,dx', label: '集合上的积分', description: '在集合 S 上关于 x 的积分。', category: 'calculus' },

  independent: { key: 'independent', latex: 'a\\perp b', label: '独立', description: 'a ⟂ b：随机变量 a 和 b 相互独立。', category: 'probability' },
  conditionallyIndependent: { key: 'conditionallyIndependent', latex: 'a\\perp b\\mid c', label: '条件独立', description: 'a ⟂ b | c：给定 c 后，a 和 b 条件独立。', category: 'probability' },
  probabilityMass: { key: 'probabilityMass', latex: 'P(a)', label: '概率质量函数', description: 'P(a)：离散变量 a 上的概率分布。', category: 'probability' },
  probabilityDensity: { key: 'probabilityDensity', latex: 'p(a)', label: '概率密度函数', description: 'p(a)：连续变量或未指定类型变量上的概率分布。', category: 'probability' },
  distributedAs: { key: 'distributedAs', latex: 'a\\sim P', label: '服从分布', description: 'a ~ P：随机变量 a 服从分布 P。', category: 'probability' },
  expectation: { key: 'expectation', latex: '\\mathbb{E}_{x\\sim P}[f(x)]', label: '期望', description: 'E[f(x)]：函数 f(x) 在分布 P 下的期望。', category: 'probability' },
  variance: { key: 'variance', latex: '\\operatorname{Var}(f(x))', label: '方差', description: 'Var(f(x))：f(x) 在分布 P(x) 下的方差。', category: 'probability' },
  covariance: { key: 'covariance', latex: '\\operatorname{Cov}(f(x),g(x))', label: '协方差', description: 'Cov(f(x),g(x))：两个函数在分布 P(x) 下的协方差。', category: 'probability' },
  entropy: { key: 'entropy', latex: 'H(x)', label: '香农熵', description: 'H(x)：随机变量 x 的香农熵。', category: 'probability' },
  klDivergence: { key: 'klDivergence', latex: 'D_{\\mathrm{KL}}(P\\Vert Q)', label: 'KL 散度', description: 'D_KL(P||Q)：分布 P 和 Q 的 KL 散度。', category: 'probability' },
  gaussian: { key: 'gaussian', latex: '\\mathcal{N}(\\boldsymbol{x};\\boldsymbol{\\mu},\\boldsymbol{\\Sigma})', label: '高斯分布', description: 'N(x; μ, Σ)：均值为 μ、协方差为 Σ 的高斯分布。', category: 'probability' },

  functionMapping: { key: 'functionMapping', latex: 'f:\\mathbb{A}\\rightarrow\\mathbb{B}', label: '函数映射', description: 'f: A -> B：定义域为 A、值域为 B 的函数。', category: 'function' },
  composition: { key: 'composition', latex: 'f\\circ g', label: '函数组合', description: 'f ∘ g：函数 f 和 g 的组合。', category: 'function' },
  parameterizedFunction: { key: 'parameterizedFunction', latex: 'f(\\boldsymbol{x};\\boldsymbol{\\theta})', label: '参数化函数', description: 'f(x; θ)：由参数 θ 参数化、关于输入 x 的函数。', category: 'function' },
  log: { key: 'log', latex: '\\log x', label: '自然对数', description: 'log x：x 的自然对数。', category: 'function' },
  sigmoid: { key: 'sigmoid', latex: '\\sigma(x)', label: 'Logistic sigmoid', description: 'σ(x)：Logistic sigmoid 函数。', category: 'function' },
  softplus: { key: 'softplus', latex: '\\zeta(x)=\\log(1+\\exp(x))', label: 'Softplus', description: 'ζ(x)：Softplus 函数，定义为 log(1+exp(x))。', category: 'function' },
  positivePart: { key: 'positivePart', latex: 'x^{+}=\\max(0,x)', label: '正数部分', description: 'x+：x 的正数部分，即 max(0,x)。', category: 'function' },
  indicator: { key: 'indicator', latex: '\\mathbb{1}_{\\mathrm{condition}}', label: '指示函数', description: '1_condition：条件为真时等于 1，否则等于 0。', category: 'function' },

  dataDistribution: { key: 'dataDistribution', latex: 'p_{\\mathrm{data}}', label: '数据生成分布', description: 'p_data：数据生成分布。', category: 'dataset' },
  empiricalDistribution: { key: 'empiricalDistribution', latex: '\\hat{p}_{\\mathrm{data}}', label: '经验分布', description: 'p_hat_data：由训练集定义的经验分布。', category: 'dataset' },
  trainingSet: { key: 'trainingSet', latex: '\\mathbb{X}', label: '训练样本集合', description: 'X：训练样本的集合。', category: 'dataset' },
  trainingInput: { key: 'trainingInput', latex: '\\boldsymbol{x}^{(i)}', label: '第 i 个输入样本', description: 'x^(i)：数据集中的第 i 个输入样本。', category: 'dataset' },
  trainingTarget: { key: 'trainingTarget', latex: 'y^{(i)}', label: '第 i 个监督目标', description: 'y^(i)：监督学习中与 x^(i) 关联的目标。', category: 'dataset' },
  designMatrix: { key: 'designMatrix', latex: '\\boldsymbol{X}\\in\\mathbb{R}^{m\\times n}', label: '设计矩阵', description: 'X：m×n 的矩阵，每一行是一个输入样本。', category: 'dataset' },
} as const satisfies Record<string, MathSymbolDefinition>;

export type MathSymbolKey = keyof typeof DL_MATH_SYMBOLS;

export interface MathSymbolTermProps extends Omit<MathFormulaTermProps, 'latex' | 'tooltip' | 'ariaLabel'> {
  symbolKey?: MathSymbolKey;
  latex?: string;
  tooltip?: ReactNode;
  ariaLabel?: string;
}

export function getMathSymbol(symbolKey: MathSymbolKey): MathSymbolDefinition {
  return DL_MATH_SYMBOLS[symbolKey];
}

export function MathSymbolTerm({ symbolKey, latex, tooltip, ariaLabel, tone, ...props }: MathSymbolTermProps) {
  const symbol = symbolKey ? getMathSymbol(symbolKey) : null;
  const resolvedLatex = latex ?? symbol?.latex;
  if (!resolvedLatex) {
    throw new Error('MathSymbolTerm requires either symbolKey or latex.');
  }

  return (
    <MathFormulaTerm
      {...props}
      latex={resolvedLatex}
      tooltip={tooltip ?? symbol?.description ?? resolvedLatex}
      ariaLabel={ariaLabel ?? symbol?.label ?? resolvedLatex}
      tone={tone ?? symbol?.tone ?? 'default'}
    />
  );
}

export function MathSymbolStatic({ symbolKey, latex, ...props }: { symbolKey?: MathSymbolKey; latex?: string } & HTMLAttributes<HTMLSpanElement>) {
  const symbol = symbolKey ? getMathSymbol(symbolKey) : null;
  const resolvedLatex = latex ?? symbol?.latex;
  if (!resolvedLatex) {
    throw new Error('MathSymbolStatic requires either symbolKey or latex.');
  }
  return <MathFormulaStatic {...props} latex={resolvedLatex} />;
}
