import { Fragment } from "react";
import { ReferenceProvider, ReferenceButton, Term } from "./shared/core/reference/ReferenceHub";
import type { ReferenceEntry } from "./shared/core/reference/types";
import EditorialFlourish from "./shared/foundation/editorial/EditorialFlourish";

const expression = <math display="block"><mrow><msubsup><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></msubsup><mfrac><msup><mi>x</mi><mn>2</mn></msup><mi>n</mi></mfrac><mo>=</mo><msub><mi>s</mi><mi>n</mi></msub></mrow></math>;

function StaggeredExpression() {
  return <div className="rk-equation rk-equation--staggered" aria-label="40 项求和排版示例">
    {Array.from({ length: 8 }, (_, row) => <math display="block" key={row}><mrow>
      {Array.from({ length: 5 }, (_, column) => {
        const term = row * 5 + column;
        return <Fragment key={term}><msub><mi>x</mi><mn>{term}</mn></msub>{term < 39 && <mo>+</mo>}</Fragment>;
      })}
    </mrow></math>)}
  </div>;
}

const entries: ReferenceEntry[] = [
  {
    id: "notation",
    name: "公式排版",
    english: "Formula and reading layout",
    definition: "样式预览用来检查公式、段落与参考资料之间的阅读节奏。",
    role: "公式示例仅用于观察排版。",
    confusion: "预览内容不代表任何论文的研究结论。",
    related: ["layout"],
    source: "通用样式预览。",
    detail: <><div className="equation">{expression}</div><StaggeredExpression />{Array.from({ length: 16 }, (_, i) => <p key={i}>阅读示例 {i + 1}：长内容在资料面板内滚动，数学上下标保持清晰。</p>)}<div className="reference-table"><table><tbody><tr><th>符号</th><th>说明</th></tr><tr><td>x</td><td>示例变量</td></tr></tbody></table></div></>,
  },
  { id: "layout", name: "阅读布局", definition: "用相关条目检查面板切换与返回行为。", related: ["notation"] },
];

export default function StylePreview() {
  const query = new URLSearchParams(location.search);
  const entriesToShow = query.has("empty-reference") ? [] : entries;
  const sourceLink = query.has("source-link") ? { href: "https://example.org/reference", label: "测试来源" } : undefined;
  return <ReferenceProvider entries={entriesToShow} sourceLink={sourceLink}>
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#preview-opening" className="site-brand" aria-label="论文阅读样式预览开头"><span className="brand-mark">PAPER</span><span>论文学习笔记<small>PAPER TUTORIAL</small></span></a>
        <nav aria-label="预览章节">
          <a href="#preview-opening"><span>01</span>阅读起点</a>
          <a href="#preview-layout"><span>02</span>文字与公式</a>
          <a href="#preview-math"><span>03</span>长表达式</a>
        </nav>
        {entriesToShow.length > 0 && <ReferenceButton term="notation">参考资料</ReferenceButton>}
      </div>
    </header>
    <main className="rk-reading rk-editorial-preview">
      <div className="rk-editorial-meta"><span>PAPER TUTORIAL</span><span>从问题到证据</span></div>
      <section className="rk-editorial-opening" id="preview-opening">
        <h1 className="rk-headline rk-headline--paper">从问题开始，<mark className="rk-highlight">读懂研究的脉络</mark></h1>
        <p className="rk-lead">沿着核心问题，梳理概念、方法与证据之间的关系。</p>
        <EditorialFlourish />
      </section>
      <section className="rk-section rk-columns" id="preview-layout"><div className="rk-prose"><h2>文字与正文</h2><p>行内 <math><msub><mi>x</mi><mi>i</mi></msub></math> 与正文保持一致的阅读节奏。<Term id="notation">公式排版</Term> 可以打开参考资料。</p><p className="rk-caption">语义色示例：<span className="rk-text--positive">成立条件</span> · <span className="rk-text--caution">需要留意</span> · <span className="rk-text--negative">不支持结论</span></p><ReferenceButton term="notation">参考资料</ReferenceButton></div><figure><div className="rk-equation">{expression}</div><figcaption className="rk-caption">分数、求和与上下标的排版示例。</figcaption></figure></section>
      <section className="rk-section" id="preview-math"><h3>长表达式</h3><StaggeredExpression /><EditorialFlourish end /></section>
    </main>
  </ReferenceProvider>;
}
