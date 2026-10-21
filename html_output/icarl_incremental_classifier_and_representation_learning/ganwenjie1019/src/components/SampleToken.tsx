import type { Sample } from "../data/icarl-runtime";
import { CLASS_VISUALS, sampleModifier } from "../data/icarl-runtime";

export type SampleTokenRole = "raw" | "incoming" | "exemplar" | "selected" | "removed" | "ghost";

export function SampleToken({ sample, role = "raw", order, compact = false }: {
  sample: Sample;
  role?: SampleTokenRole;
  order?: number;
  compact?: boolean;
}) {
  const visual = CLASS_VISUALS[sample.classId];
  const roleLabel = role === "raw" ? "原始样本" : role === "incoming" ? "新类数据" : role === "exemplar" ? "已存样本" : role === "selected" ? "入选样本" : role === "removed" ? "本轮移除" : "过渡位置";
  const label = `${visual.displayLabel}，样本 ${sample.id}${order ? `，exemplar 顺序 p${order}` : ""}，${roleLabel}`;
  return (
    <span
      className={`sample-token sample-token--${role}${compact ? " sample-token--compact" : ""}`}
      aria-label={label}
      title={label}
      data-sample-id={sample.id}
      data-class-id={sample.classId}
    >
      <span className="sample-token__glyph" style={{ color: visual.color }} aria-hidden="true">{visual.glyph}<small>{sampleModifier(sample.id)}</small></span>
      <span className="sample-token__class">{visual.index}</span>
      <span className="sample-token__id">{sample.id}</span>
      {role !== "raw" ? <span className="sample-token__role" aria-hidden="true">{role === "incoming" ? "新类" : role === "exemplar" ? "记忆" : role === "selected" ? "入选" : role === "removed" ? "移除" : "过渡"}</span> : null}
      {order ? <span className="sample-token__order" aria-hidden="true">p{order}</span> : null}
    </span>
  );
}
