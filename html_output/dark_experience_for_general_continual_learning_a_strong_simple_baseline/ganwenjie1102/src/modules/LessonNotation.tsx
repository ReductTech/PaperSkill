import type { ReactNode } from 'react';

/** Match D1: upright mathematical face, with real SVG sub/superscripts. */
export function MathSub({ children }: { children: ReactNode }) {
  return <tspan baselineShift="sub" fontSize=".7em">{children}</tspan>;
}

export function MathSup({ children }: { children: ReactNode }) {
  return <tspan baselineShift="super" fontSize=".7em">{children}</tspan>;
}

export function LossSymbol({ kind }: { kind: 'current' | 'dark' | 'DER' | 'replay-CE' }) {
  return <tspan className="lesson-symbol">L<MathSub>{kind}</MathSub></tspan>;
}

export function ParameterSymbol({ index }: { index: string | number }) {
  return <tspan className="lesson-symbol">θ<MathSub>{index}</MathSub></tspan>;
}

export function SavedTargetFormula() {
  return <>z = stopgrad(h<MathSub>θold</MathSub>(A<MathSub>0</MathSub>(x)))</>;
}

export function ReplayTargetFormula() {
  return <><LossSymbol kind="dark" /> = ‖h<MathSub>θ</MathSub>(A<MathSub>1</MathSub>(x)) − z‖<MathSup>2</MathSup></>;
}

export function DerObjective({ plus = false }: { plus?: boolean }) {
  return <><tspan className="lesson-symbol">L<MathSub>{plus ? 'DER++' : 'DER'}</MathSub></tspan> = <LossSymbol kind="current" /> + α <LossSymbol kind="dark" />{plus && <> + β <LossSymbol kind="replay-CE" /></>}</>;
}
