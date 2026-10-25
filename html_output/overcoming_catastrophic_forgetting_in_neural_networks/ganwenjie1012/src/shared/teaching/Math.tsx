import katex from "katex";
import "katex/dist/katex.min.css";
import "./math.css";

/** MathML supports reading/copying; the original TeX is also available as a title. */
export function MathFormula({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { displayMode: block, throwOnError: true, output: "htmlAndMathml", strict: "error" });
  return <span className={`ewc-math ${block ? "ewc-math--block" : ""}`} tabIndex={block ? 0 : undefined} title={tex} dangerouslySetInnerHTML={{ __html: html }} />;
}
