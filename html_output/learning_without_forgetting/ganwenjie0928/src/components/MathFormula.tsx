import React from 'react';

type FormulaId =
  | 'formula:l_new'
  | 'formula:l_old'
  | 'formula:total_loss'
  | 'formula:temperature'
  | 'formula:shared_gradient'
  | 'formula:parameter_l2'
  | 'formula:response_preservation'
  | 'formula:sgd_step'
  | 'formula:training_response'
  | 'formula:old_task_risk'
  | 'inline:combined_loss'
  | 'inline:old_head_gradient'
  | 'inline:new_head_gradient'
  | 'inline:sgd_update'
  | 'inline:sgd_update_regularized';

function Sub({ children, sub }: { children: React.ReactNode; sub: React.ReactNode }) {
  return <msub><mi>{children}</mi><mi>{sub}</mi></msub>;
}

function FormulaContent({ id }: { id: FormulaId }) {
  switch (id) {
    case 'formula:l_new':
      return <mrow><Sub sub="new">L</Sub><mo>=</mo><mo>−</mo><msub><mi>Y</mi><mi>n</mi></msub><mo>·</mo><mi>log</mi><mspace width="0.2em"/><msub><mi>Ŷ</mi><mi>n</mi></msub></mrow>;
    case 'formula:l_old':
      return <mrow><Sub sub="old">L</Sub><mo>=</mo><mo>−</mo><munder><mo>∑</mo><mi>i</mi></munder><msup><msub><mi>y</mi><mi>o</mi></msub><mo>′</mo></msup><mo>(</mo><mi>i</mi><mo>)</mo><mi>log</mi><msup><msub><mi>ŷ</mi><mi>o</mi></msub><mo>′</mo></msup><mo>(</mo><mi>i</mi><mo>)</mo></mrow>;
    case 'formula:total_loss':
    case 'inline:combined_loss':
      return <mrow><mi>L</mi><mo>=</mo><msub><mi>λ</mi><mi>o</mi></msub><msub><mi>L</mi><mi>old</mi></msub><mo>+</mo><msub><mi>L</mi><mi>new</mi></msub><mo>+</mo><mi>R</mi><mo>(</mo><msub><mi>θ</mi><mi>s</mi></msub><mo>,</mo><msub><mi>θ</mi><mi>o</mi></msub><mo>,</mo><msub><mi>θ</mi><mi>n</mi></msub><mo>)</mo></mrow>;
    case 'formula:temperature':
      return <mrow><msubsup><mi>p</mi><mi>i</mi><mi>T</mi></msubsup><mo>=</mo><mfrac><msup><mi>p</mi><mrow><mn>1</mn><mo>/</mo><mi>T</mi></mrow></msup><mrow><munder><mo>∑</mo><mi>j</mi></munder><msup><mi>p</mi><mrow><mn>1</mn><mo>/</mo><mi>T</mi></mrow></msup></mrow></mfrac></mrow>;
    case 'formula:shared_gradient':
      return <mrow><msub><mi>∇</mi><msub><mi>θ</mi><mi>s</mi></msub></msub><mi>L</mi><mo>=</mo><msub><mi>λ</mi><mi>o</mi></msub><msub><mi>∇</mi><msub><mi>θ</mi><mi>s</mi></msub></msub><msub><mi>L</mi><mi>old</mi></msub><mo>+</mo><msub><mi>∇</mi><msub><mi>θ</mi><mi>s</mi></msub></msub><msub><mi>L</mi><mi>new</mi></msub><mo>+</mo><msub><mi>∇</mi><msub><mi>θ</mi><mi>s</mi></msub></msub><mi>R</mi></mrow>;
    case 'inline:old_head_gradient':
      return <mrow><msub><mi>∇</mi><msub><mi>θ</mi><mi>o</mi></msub></msub><mi>L</mi><mo>=</mo><msub><mi>λ</mi><mi>o</mi></msub><msub><mi>∇</mi><msub><mi>θ</mi><mi>o</mi></msub></msub><msub><mi>L</mi><mi>old</mi></msub><mo>+</mo><msub><mi>∇</mi><msub><mi>θ</mi><mi>o</mi></msub></msub><mi>R</mi></mrow>;
    case 'inline:new_head_gradient':
      return <mrow><msub><mi>∇</mi><msub><mi>θ</mi><mi>n</mi></msub></msub><mi>L</mi><mo>=</mo><msub><mi>∇</mi><msub><mi>θ</mi><mi>n</mi></msub></msub><msub><mi>L</mi><mi>new</mi></msub><mo>+</mo><msub><mi>∇</mi><msub><mi>θ</mi><mi>n</mi></msub></msub><mi>R</mi></mrow>;
    case 'formula:parameter_l2':
      return <mrow><msub><mi>L</mi><mi>param</mi></msub><mo>=</mo><msub><mi>L</mi><mi>new</mi></msub><mo>+</mo><mfrac><mi>λ</mi><mn>2</mn></mfrac><msup><mrow><mo>∥</mo><mi>w</mi><mo>−</mo><msub><mi>w</mi><mn>0</mn></msub><mo>∥</mo></mrow><mn>2</mn></msup><mo>₂</mo></mrow>;
    case 'formula:response_preservation':
      return <mrow><mi>D</mi><mo>(</mo><msub><mi>f</mi><mi>old</mi></msub><mo>(</mo><msub><mi>X</mi><mi>n</mi></msub><mo>)</mo><mo>,</mo><msub><mi>f</mi><mi>student</mi></msub><mo>(</mo><msub><mi>X</mi><mi>n</mi></msub><mo>)</mo><mo>)</mo></mrow>;
    case 'formula:training_response':
      return <mrow><msub><mo>𝔼</mo><mrow><mi>x</mi><mo>∼</mo><msub><mi>p</mi><mi>n</mi></msub></mrow></msub><mo>[</mo><mi>D</mi><mo>(</mo><msub><mi>f</mi><mi>teacher</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>,</mo><msub><mi>f</mi><mi>student</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>)</mo><mo>]</mo></mrow>;
    case 'formula:old_task_risk':
      return <mrow><msub><mo>𝔼</mo><mrow><mo>(</mo><mi>x</mi><mo>,</mo><mi>y</mi><mo>)</mo><mo>∼</mo><msub><mi>p</mi><mi>o</mi></msub></mrow></msub><mo>[</mo><msub><mi>ℓ</mi><mi>old</mi></msub><mo>(</mo><msub><mi>f</mi><mi>student</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>,</mo><mi>y</mi><mo>)</mo><mo>]</mo></mrow>;
    case 'formula:sgd_step':
      return <mrow><mi>θ</mi><mo>←</mo><mi>θ</mi><mo>−</mo><mi>η</mi><mi>g</mi></mrow>;
    case 'inline:sgd_update':
      return <mrow><msup><mi>θ</mi><mo>′</mo></msup><mo>=</mo><mi>θ</mi><mo>−</mo><msub><mi>η</mi><mi>s</mi></msub><mo>(</mo><msub><mi>λ</mi><mi>o</mi></msub><msub><mi>g</mi><mi>old</mi></msub><mo>+</mo><msub><mi>g</mi><mi>new</mi></msub><mo>)</mo></mrow>;
    case 'inline:sgd_update_regularized':
      return <mrow><msup><mi>θ</mi><mo>′</mo></msup><mo>=</mo><mi>θ</mi><mo>−</mo><msub><mi>η</mi><mi>s</mi></msub><mo>(</mo><msub><mi>λ</mi><mi>o</mi></msub><msub><mi>g</mi><mi>old</mi></msub><mo>+</mo><msub><mi>g</mi><mi>new</mi></msub><mo>+</mo><msub><mi>g</mi><mi>R</mi></msub><mo>)</mo></mrow>;
  }
}

export function MathFormula({ id, compact = false }: { id: FormulaId | string; compact?: boolean }) {
  const supported = new Set<FormulaId>([
    'formula:l_new', 'formula:l_old', 'formula:total_loss', 'formula:temperature',
    'formula:shared_gradient', 'formula:parameter_l2', 'formula:response_preservation',
    'formula:sgd_step', 'formula:training_response', 'formula:old_task_risk',
    'inline:combined_loss',
    'inline:old_head_gradient', 'inline:new_head_gradient', 'inline:sgd_update', 'inline:sgd_update_regularized',
  ]);
  if (!supported.has(id as FormulaId)) return <span className="v2-math-fallback">{id}</span>;
  return (
    <math
      className={`v2-math-formula${compact ? ' is-compact' : ''}`}
      xmlns="http://www.w3.org/1998/Math/MathML"
      display={compact ? 'inline' : 'block'}
      aria-label={`公式：${id}`}
    >
      <FormulaContent id={id as FormulaId} />
    </math>
  );
}
