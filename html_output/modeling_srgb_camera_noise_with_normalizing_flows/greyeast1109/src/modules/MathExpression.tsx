import type { HTMLAttributes, ReactNode } from 'react';

type MathNodeProps = HTMLAttributes<MathMLElement>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: MathNodeProps & { display?: 'inline' | 'block' };
      mrow: MathNodeProps;
      mi: MathNodeProps & { mathvariant?: 'normal' };
      mn: MathNodeProps;
      mo: MathNodeProps;
      mspace: MathNodeProps & { width: string };
      mtext: MathNodeProps;
      mfrac: MathNodeProps;
      msub: MathNodeProps;
      msup: MathNodeProps;
      mover: MathNodeProps & { accent?: 'true' | 'false' };
      munderover: MathNodeProps;
    }
  }
}

export function MathExpression({ children, label, block = false }: {
  children: ReactNode;
  label: string;
  block?: boolean;
}) {
  const expression = <math className="study-math" display={block ? 'block' : 'inline'} aria-label={label}>
    <mrow>{children}</mrow>
  </math>;
  return block ? <div className="study-equation">{expression}</div> : expression;
}

export function NoisyImageSymbol({ synthetic = false }: { synthetic?: boolean }) {
  const symbol = <mover accent="true"><mi>I</mi><mo>˜</mo></mover>;
  return synthetic ? <msub>{symbol}<mtext>syn</mtext></msub> : symbol;
}

export function SyntheticResidualSymbol() {
  return <msub><mi>N</mi><mtext>syn</mtext></msub>;
}

export function FlowFunctionSymbol({ inverse = false }: { inverse?: boolean }) {
  const name = <msub><mi>f</mi><mi>θ</mi></msub>;
  return inverse ? <msup>{name}<mrow><mo>−</mo><mn>1</mn></mrow></msup> : name;
}

function ConditionArguments() {
  return <><mo>|</mo><mi>I</mi><mo>,</mo><mi>c</mi><mo>,</mo><mi>g</mi></>;
}

export function ForwardEquation() {
  return <MathExpression label="潜变量 z 等于给定干净图、相机和 ISO 的残差正向变换">
    <mi>z</mi><mo>=</mo><FlowFunctionSymbol /><mo>(</mo><mi>N</mi><ConditionArguments /><mo>)</mo>
  </MathExpression>;
}

export function InverseEquation() {
  return <MathExpression label="合成残差等于给定干净图、相机和 ISO 的潜变量逆变换">
    <SyntheticResidualSymbol /><mo>=</mo><FlowFunctionSymbol inverse /><mo>(</mo><mi>z</mi><ConditionArguments /><mo>)</mo>
  </MathExpression>;
}

export function GaussianSampleEquation() {
  return <MathExpression label="z 从 d 维标准高斯分布采样">
    <mi>z</mi><mo>∼</mo><mi>𝒩</mi><mo>(</mo><mn>0</mn><mo>,</mo>
    <msub><mi mathvariant="normal">Id</mi><mi>d</mi></msub><mo>)</mo>
  </MathExpression>;
}

export function SynthesisEquation() {
  return <MathExpression label="合成带噪图等于干净图加合成残差">
    <NoisyImageSymbol synthetic /><mo>=</mo><mi>I</mi><mo>+</mo><SyntheticResidualSymbol />
  </MathExpression>;
}

export function LogDensityEquation() {
  return <MathExpression block label="真实残差的条件对数密度等于基分布对数密度加雅可比行列式绝对值的对数">
    <mi mathvariant="normal">log</mi><mspace width="0.16em" />
    <mrow><msub><mi>p</mi><mi>θ</mi></msub><mo>(</mo><mi>N</mi><ConditionArguments /><mo>)</mo></mrow><mo>=</mo>
    <mi mathvariant="normal">log</mi><mspace width="0.16em" />
    <mrow><msub><mi>p</mi><mi>Z</mi></msub><mo>(</mo><mi>z</mi><mo>)</mo></mrow><mo>+</mo>
    <mi mathvariant="normal">log</mi><mspace width="0.16em" />
    <mrow><mo>|</mo><mi mathvariant="normal">det</mi><mspace width="0.16em" />
      <mfrac><mrow><mi>∂</mi><FlowFunctionSymbol /></mrow><mrow><mi>∂</mi><mi>N</mi></mrow></mfrac><mo>|</mo>
    </mrow>
  </MathExpression>;
}
