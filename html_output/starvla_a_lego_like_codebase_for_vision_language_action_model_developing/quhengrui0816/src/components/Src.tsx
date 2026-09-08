import type { ReactNode } from "react";

type SrcKind = "true" | "calc" | "demo";

const KIND_LABEL: Record<SrcKind, string> = {
  true: "论文真实值",
  calc: "论文数据换算",
  demo: "教学示意",
};

/** 关键数字的来源标注：悬停/聚焦显示 来源 / 类型 / 可比性 */
export default function Src({
  where,
  kind = "true",
  cmp,
  children,
}: {
  where: string;
  kind?: SrcKind;
  cmp?: string;
  children?: ReactNode;
}) {
  return (
    <>
      {children}
      <span className="src" tabIndex={0} role="note" aria-label={`来源：${where}`}>
        i
        <span className="src-pop">
          <span className="row"><span className="k">来源</span><span>{where}</span></span>
          <span className="row">
            <span className="k">类型</span>
            <span className={`kind-${kind}`}>{KIND_LABEL[kind]}</span>
          </span>
          {cmp && <span className="row"><span className="k">可比性</span><span>{cmp}</span></span>}
        </span>
      </span>
    </>
  );
}
