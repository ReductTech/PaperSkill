import React from 'react';
import type { FormulaDef } from '../types';

export function Formula({ formula }: { formula: FormulaDef }) {
  return (
    <div className="formula-explain">
      <p className="fe-hint">悬停主要符号查看解释；也可以用 Tab 聚焦，点击后固定说明</p>
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div className="fe-formula" dangerouslySetInnerHTML={{ __html: formula.unicode }} />
    </div>
  );
}
