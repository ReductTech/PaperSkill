import { Fragment } from "react";

export function Sub({ base, index }: { base: string; index: string | number }) {
  return <msub><mi>{base}</mi>{typeof index === "number" ? <mn>{index}</mn> : <mi>{index}</mi>}</msub>;
}

export function Tuple({ values, digits = 0 }: { values: readonly number[]; digits?: number }) {
  return <mrow><mo>[</mo>{values.map((value, i) => <Fragment key={i}>
    {i > 0 && <mo>,</mo>}<mn>{value.toFixed(digits)}</mn>
  </Fragment>)}<mo>]</mo></mrow>;
}

export function ProjectionFormula({ symbol }: { symbol: string }) {
  return <math><mi>{symbol}</mi><mo>=</mo><mi>X</mi><Sub base="W" index={symbol} /></math>;
}

export function WeightedSum({ terms, result, digits = 3 }: {
  terms: readonly { weight: number; value: number }[];
  result: number;
  digits?: number;
}) {
  return <math><mrow>{terms.map(({weight, value}, i) => <Fragment key={i}>
    {i > 0 && <mo>+</mo>}<mn>{weight}</mn><mo>×</mo><mn>{value.toFixed(digits)}</mn>
  </Fragment>)}<mo>=</mo><mn>{result.toFixed(digits)}</mn></mrow></math>;
}

export function SoftmaxFormula() {
  return <math><mfrac>
    <msup><mi mathvariant="normal">e</mi><Sub base="s" index="j" /></msup>
    <mrow><msub><mo>∑</mo><mi>k</mi></msub><msup><mi mathvariant="normal">e</mi><Sub base="s" index="k" /></msup></mrow>
  </mfrac></math>;
}
