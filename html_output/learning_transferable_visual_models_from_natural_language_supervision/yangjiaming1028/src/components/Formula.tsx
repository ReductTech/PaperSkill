import type { FormulaDef } from '../types';
import { MathText } from './MathText';

export function Formula({ formula }: { formula: FormulaDef }) {
  return <div className="formula-explain">
    <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }}/>
    <p className="formula-hover-hint"><span>带点线的符号</span>可悬停查看含义；触屏可点击，键盘聚焦公式后用 ← → 查看。</p>
    <div className="formula-equations">
      {formula.equations.map((equation, index) => <div className="equation-row" key={equation.tex}>
        <div className="equation-caption"><span>{String(index + 1).padStart(2, '0')}</span>{equation.label}</div>
        <MathText tex={equation.tex} display symbols={formula.symbols} explanation={equation.label}/>
      </div>)}
    </div>
  </div>;
}
