import type { ReactNode } from "react";

function Sum({ upper = false, index = "k", className }: { upper?: boolean; index?: string; className?: string }) {
  return upper ? <munderover className={className}><mo>∑</mo><mrow><mi>{index}</mi><mo>=</mo><mn>1</mn></mrow><mi>C</mi></munderover> : <munder className={className}><mo>∑</mo><mi>{index}</mi></munder>;
}
const Sub = ({ value, index = "k", className }: { value: string; index?: string; className?: string }) => <msub className={className}><mi>{value}</mi><mi>{index}</mi></msub>;
export function Equation({ label, children, id }: { label: string; children: ReactNode; id?: string }) {
  return <div className="equation" data-vqa-check-clipping id={id}><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label={label}>{children}</math></div>;
}
export function KLDefinition({ identified = true, focus, onSelect }: { identified?: boolean; focus?: number; onSelect?: (part: number) => void } = {}) {
  const mark = (part: number, name: string) => onSelect ? `kl-symbol kl-${name}${focus === part ? " is-linked-symbol" : ""}` : undefined;
  return <div className={onSelect ? "linked-formula" : undefined} onClick={onSelect ? (event) => {
    const target = event.target as Element;
    const symbol = target.closest(".kl-symbol");
    if (symbol) onSelect(symbol.classList.contains("kl-p") ? 0 : symbol.classList.contains("kl-q") ? 1 : symbol.classList.contains("kl-log") ? 2 : 3);
  } : undefined}><Equation id={identified ? "kl-definition" : undefined} label="KL 散度等于从类别 1 到 C，旧概率 p k 乘以 p k 与 q k 比值的对数之和。"><mrow><msub><mi>D</mi><mtext>KL</mtext></msub><mo>(</mo><mi>p</mi><mo>∥</mo><mi>q</mi><mo>)</mo></mrow><mo>=</mo><Sum upper className={mark(3, "sum")} /><Sub value="p" className={mark(0, "p")} /><mrow className={mark(2, "log")}><mi mathvariant="normal">log</mi><mfrac><Sub value="p" className={mark(0, "p")} /><Sub value="q" className={mark(1, "q")} /></mfrac></mrow></Equation></div>;
}
export function KLDecomposition({ identified = true }: { identified?: boolean } = {}) {
  return <div id={identified ? "kl-decomposition" : undefined}><Equation label="拆开对数比：KL 等于负的 p 加权 log q 的和，加上 p 加权 log p 的和。"><msub><mi>D</mi><mtext>KL</mtext></msub><mo>=</mo><mo>−</mo><Sum /><Sub value="p" /><mi mathvariant="normal">log</mi><Sub value="q" /><mo>+</mo><Sum /><Sub value="p" /><mi mathvariant="normal">log</mi><Sub value="p" /></Equation><Equation label="即交叉熵 H p q 减去固定熵 H p。"><mo>=</mo><mi>H</mi><mo>(</mo><mi>p</mi><mo>,</mo><mi>q</mi><mo>)</mo><mo>−</mo><mi>H</mi><mo>(</mo><mi>p</mi><mo>)</mo></Equation></div>;
}
export function SquaredDefinition({ identified = true }: { identified?: boolean } = {}) {
  return <Equation id={identified ? "squared-definition" : undefined} label="历史匹配损失等于当前 logits a 与历史 logits z 的平方欧氏距离，即各类别分数差的平方之和。"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>=</mo><msubsup><mrow><mo>‖</mo><mi>a</mi><mo>−</mo><mi>z</mi><mo>‖</mo></mrow><mn>2</mn><mn>2</mn></msubsup><mo>=</mo><Sum upper /><msup><mrow><mo>(</mo><Sub value="a" /><mo>−</mo><Sub value="z" /><mo>)</mo></mrow><mn>2</mn></msup></Equation>;
}
export function ShiftIdentity() {
  return <Equation label="所有 logits 增加同一个 c，softmax 分子分母同时乘 e 的 c 次方，概率不变。"><mfrac><msup><mi>e</mi><mrow><Sub value="z" /><mo>+</mo><mi>c</mi></mrow></msup><mrow><Sum index="j" /><msup><mi>e</mi><mrow><Sub value="z" index="j" /><mo>+</mo><mi>c</mi></mrow></msup></mrow></mfrac><mo>=</mo><mfrac><mrow><msup><mi>e</mi><mi>c</mi></msup><msup><mi>e</mi><Sub value="z" /></msup></mrow><mrow><msup><mi>e</mi><mi>c</mi></msup><Sum index="j" /><msup><mi>e</mi><Sub value="z" index="j" /></msup></mrow></mfrac><mo>=</mo><mfrac><msup><mi>e</mi><Sub value="z" /></msup><mrow><Sum index="j" /><msup><mi>e</mi><Sub value="z" index="j" /></msup></mrow></mfrac></Equation>;
}

/** Keep prose out of math fonts and typeset the derivation as actual mathematics. */
export function KLGradientDerivation() {
  return <div className="kl-proof">
    <div><p>展开当前概率的对数：</p><Equation label="log q k 等于 a k 减去 log 求和 exp a j"><mi mathvariant="normal">log</mi><Sub value="q" /><mo>=</mo><Sub value="a" /><mo>−</mo><mi mathvariant="normal">log</mi><mrow><Sum index="j" /><msup><mi>e</mi><Sub value="a" index="j" /></msup></mrow></Equation></div>
    <div><p>代入 KL，分离固定项：</p><Equation label="KL 等于 p log p 的和，减去 p a 的和，加上 log 求和 exp a j"><msub><mi>D</mi><mtext>KL</mtext></msub><mo>=</mo><Sum /><Sub value="p" /><mi mathvariant="normal">log</mi><Sub value="p" /><mo>−</mo><Sum /><Sub value="p" /><Sub value="a" /><mo>+</mo><mi mathvariant="normal">log</mi><mrow><Sum index="j" /><msup><mi>e</mi><Sub value="a" index="j" /></msup></mrow></Equation></div>
    <div><p>历史概率固定且归一化，对当前分数求导：</p><Equation label="KL 对当前 a k 的偏导数等于 q k 减 p k"><mfrac><mrow><mo>∂</mo><msub><mi>D</mi><mtext>KL</mtext></msub></mrow><mrow><mo>∂</mo><Sub value="a" /></mrow></mfrac><mo>=</mo><Sub value="q" /><mo>−</mo><Sub value="p" /></Equation></div>
    <p>等价地，KL 是交叉熵 H(p,q) 减去历史熵 H(p)。H(p) 不随 q 改变，因此最小化 KL 与最小化软标签交叉熵等价；交换 p、q 通常会改变结果。</p>
  </div>;
}
