import { Hint } from '../components/Hint';
import { position } from './labModel';

type FormulaProps = { stage: number; clip: boolean; pinned: number };
type SymbolName = 's' | 'j' | 'A' | 'h' | 'q' | 'CLS' | 'Σ' | 'mean' | 'K' | 'i' | 't' | 'cos' | 'C' | 'H';
const meanings: Record<Exclude<SymbolName, 'j' | 's'>, string> = {
  A: '视觉自注意力矩阵。行表示发出注意力的 query，列表示收到注意力的 key。',
  h: '哪个注意力头。每个头都有自己的矩阵 Aₕ；CLIP 代码把各头给同一位置的权重相加。',
  q: '哪个查询位置发出了注意力。SigLIP 沿所有 q 取平均，得到一列的平均接收量。',
  CLS: 'CLIP 的全局位置。取 CLS 这一行，就是读取它分别给各图像 patch 的注意力。',
  Σ: '把各个注意力头对同一列给出的权重相加。',
  mean: '算术平均。注意力公式跨头和查询行平均，特征合并公式对归到同组的其他成员逐维取平均。',
  K: 'key 向量决定位置分给谁。比较归一化 key 的方向，把位置分给余弦相似度最高的代表。',
  i: '一个等待归并的图像位置。主导 patch 和上下文代表已从这些候选位置中排除。',
  t: '一个候选代表的位置。每个待归并位置最终只选一个代表。',
  cos: '余弦相似度。将两个 key 各自归一化后取点积；方向越接近，值越大。',
  C: '以位置 t 为代表的上下文特征。图中的 G1 等组各产生一个这样的输出。',
  H: '隐藏特征决定交给 LLM 的内容。代表保留自己的 H，再加上其他组员的 H 的均值，随后经投影器送入 LLM。',
};

export default function LabFormula({ stage, clip, pinned }: FormulaProps) {
  const example = position(pinned);
  const symbol = (name: SymbolName) => {
    let text: string;
    if (name === 'j') text = `图上的哪个 patch。你固定的是 ${example}，把 j 取为 ${example}，就读取注意力矩阵里 ${example} 对应的列。`;
    else if (name === 's') text = `位置 j 的接收分数。s(${example}) 用来决定你固定的 ${example} 在图上排第几。`;
    else if (name === 'mean') text = stage === 0
      ? 'SigLIP 没有 CLS。固定图块这一列，先后对注意力头和查询位置取算术平均，就得到该图块收到的平均注意力。'
      : '对分到同一代表的其余组员，逐维求隐藏特征均值，再加上代表原有特征。组内没有其他成员时，这一项按零处理。';
    else text = meanings[name];
    return <Hint text={text} label={`公式符号 ${name}`}>{name}</Hint>;
  };
  return <div className="vzlab-eqarea">
    <div className="vzlab-eq" aria-label="本步公式">
      {stage === 0 ? <>
        <span className="vzlab-unit">{symbol('s')}({symbol('j')})</span> ={' '}
        <span className="vzlab-unit">{clip ? symbol('Σ') : symbol('mean')}<sub>{symbol('h')}{!clip && <>,{symbol('q')}</>}</sub></span>{' '}
        <span className="vzlab-unit">{symbol('A')}<sub>{symbol('h')}</sub>[{clip ? symbol('CLS') : symbol('q')},{symbol('j')}]</span>
      </> : stage === 1 ? <>
        分给使 <span className="vzlab-unit">{symbol('cos')}({symbol('K')}<sub>{symbol('i')}</sub>, {symbol('K')}<sub>{symbol('t')}</sub>)</span> 最大的代表 {symbol('t')}
      </> : <>
        <span className="vzlab-unit">{symbol('C')}<sub>{symbol('t')}</sub></span> ={' '}
        <span className="vzlab-unit">{symbol('H')}<sub>{symbol('t')}</sub></span> +{' '}
        <span className="vzlab-unit">{symbol('mean')}({symbol('H')}<sub>{symbol('i')}</sub>，</span>
        <span className="vzlab-unit">{symbol('i')} 归入 {symbol('t')})</span>
      </>}
    </div>
    {stage > 0 && <p className="vzlab-key-hidden">{symbol('K')} 决定分给谁，{symbol('H')} 计算交给 LLM 的内容。</p>}
  </div>;
}
