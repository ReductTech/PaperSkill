import { useMemo } from "react";
import katex from "katex";

/** KaTeX 数学排版：公式归公式，代码归代码 */
export default function Math({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, displayMode: display, trust: true }),
    [tex, display]
  );
  return <span className="math" dangerouslySetInnerHTML={{ __html: html }} />;
}
