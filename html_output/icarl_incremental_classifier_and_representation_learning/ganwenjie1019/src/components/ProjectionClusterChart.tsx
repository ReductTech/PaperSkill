import type { CSSProperties } from "react";
import { CLASS_VISUALS, encode2D, sampleById, type ClassId, type FeatureState } from "../data/icarl-runtime";

const projectionSampleIds = ["x_7", "x_3", "x_9", "x_12", "x_15", "x_18", "x_2", "x_4", "x_6", "x_8", "x_10", "x_13", "x_1", "x_5", "x_11", "x_16", "x_19", "x_22"] as const;
const shownClasses: ClassId[] = ["A", "B", "C"];
const frame = { x: 320, y: 300, scaleX: 110, scaleY: 95 };
const labelOffsets: Record<string, { x: number; y: number; anchor: "start" | "end" }> = {
  x_7: { x: 12, y: 5, anchor: "start" },
  x_3: { x: 12, y: -10, anchor: "start" },
  x_9: { x: -12, y: 5, anchor: "end" },
  x_12: { x: 18, y: 3, anchor: "start" },
  x_15: { x: -12, y: -8, anchor: "end" },
  x_18: { x: 18, y: -12, anchor: "start" },
  x_2: { x: 12, y: -8, anchor: "start" },
  x_4: { x: 16, y: 19, anchor: "start" },
  x_6: { x: -12, y: -8, anchor: "end" },
  x_8: { x: -38, y: 22, anchor: "end" },
  x_10: { x: -12, y: -8, anchor: "end" },
  x_13: { x: 18, y: 20, anchor: "start" },
  x_1: { x: 16, y: -14, anchor: "start" },
  x_5: { x: 16, y: 14, anchor: "start" },
  x_11: { x: -12, y: -8, anchor: "end" },
  x_16: { x: 14, y: 10, anchor: "start" },
  x_19: { x: -12, y: 6, anchor: "end" },
  x_22: { x: 12, y: 16, anchor: "start" },
};

function plotPoint(id: string, state: FeatureState) {
  const sample = sampleById(id);
  const [x, y] = encode2D(sample, state);
  return { id, classId: sample.classId, x: frame.x + x * frame.scaleX, y: frame.y - y * frame.scaleY };
}

type ProjectionClusterChartProps = {
  state: FeatureState;
  sampleIds?: readonly string[];
  title?: string;
  description?: string;
  titleId?: string;
  compact?: boolean;
};

export function ProjectionClusterChart({
  state,
  sampleIds = projectionSampleIds,
  title = "同类样本在表示空间中形成局部类簇",
  description = "三种颜色对应三个类别，编号表示样本身份；切换模型状态时，每个编号沿新的特征映射移动。",
  titleId = "p2-cluster-title",
  compact = false,
}: ProjectionClusterChartProps) {
  const points = sampleIds.map(id => plotPoint(id, state));
  const clusters = shownClasses.map(classId => {
    const members = points.filter(point => point.classId === classId);
    return {
      classId,
      x: members.reduce((sum, point) => sum + point.x, 0) / members.length,
      y: members.reduce((sum, point) => sum + point.y, 0) / members.length,
      rx: classId === "A" ? 78 : classId === "B" ? 88 : 74,
      ry: classId === "A" ? 78 : classId === "B" ? 58 : 82,
    };
  });

  return <figure className={`p2-cluster-chart${compact ? " p2-cluster-chart--compact" : ""}`} aria-labelledby={titleId}>
    <figcaption className="p2-cluster-chart__header">
      <div><span className="p2-eyebrow">FEATURE SPACE · 3 类 · {points.length} 个样本</span><h3 id={titleId}>{title}</h3><p>{description}</p></div>
      <span className="p2-cluster-chart__state">{state === "before" ? "Θ 更新前" : "Θ 更新后"}</span>
    </figcaption>
    <div className="p2-cluster-chart__viewport">
      <svg viewBox="0 0 640 400" role="img" aria-label={`三个类别共 ${points.length} 个样本在参数 ${state === "before" ? "更新前" : "更新后"} 的二维教学投影`}>
        <title>三类样本的特征表示</title>
        <desc>蓝色为 Class 1，绿色为 Class 2，橙色为 Class 3。样本位于各自的虚线类簇范围中，切换状态时点和标签一起移动。</desc>
        <g className="p2-cluster-chart__grid" aria-hidden="true">
          {[80, 200, 320, 440, 560].map(x => <line key={`x-${x}`} x1={x} x2={x} y1="28" y2="372" />)}
          {[60, 140, 220, 300].map(y => <line key={`y-${y}`} x1="28" x2="612" y1={y} y2={y} />)}
        </g>
        <line className="p2-cluster-chart__axis" x1="28" x2="612" y1={frame.y} y2={frame.y} />
        <line className="p2-cluster-chart__axis" x1={frame.x} x2={frame.x} y1="28" y2="372" />
        <circle className="p2-cluster-chart__origin" cx={frame.x} cy={frame.y} r="3" />

        {clusters.map(cluster => <g key={cluster.classId} className="p2-cluster-region" style={{ "--cluster-x": `${cluster.x}px`, "--cluster-y": `${cluster.y}px`, "--cluster-color": CLASS_VISUALS[cluster.classId].color } as CSSProperties}>
          <ellipse cx="0" cy="0" rx={cluster.rx} ry={cluster.ry} />
          <text x={cluster.classId === "A" ? 48 : cluster.classId === "B" ? -52 : -38} y={-cluster.ry + 17} textAnchor="middle">{CLASS_VISUALS[cluster.classId].displayLabel}</text>
        </g>)}

        {points.map((point, index) => {
          const label = labelOffsets[point.id];
          return <g key={point.id} className="p2-cluster-sample" style={{ "--sample-x": `${point.x}px`, "--sample-y": `${point.y}px`, "--sample-color": CLASS_VISUALS[point.classId].color, "--sample-delay": `${index * 22}ms` } as CSSProperties} tabIndex={0} role="img" aria-label={`${CLASS_VISUALS[point.classId].displayLabel}，样本 ${point.id}`}>
            <circle cx="0" cy="0" r="6" />
            <text x={label.x} y={label.y} textAnchor={label.anchor}>{point.id}</text>
            <title>{`${CLASS_VISUALS[point.classId].displayLabel} · ${point.id}`}</title>
          </g>;
        })}
      </svg>
    </div>
    <div className="p2-cluster-chart__footer">
      <div className="p2-cluster-chart__legend" aria-label="类别颜色图例">
        {shownClasses.map(classId => <span key={classId}><i style={{ backgroundColor: CLASS_VISUALS[classId].color }} />{CLASS_VISUALS[classId].displayLabel} · {points.filter(point => point.classId === classId).length} 个样本</span>)}
        <span><i className="p2-cluster-chart__ring" />虚线范围 · 同类样本区域</span>
      </div>
      <p><span aria-hidden="true">↗</span>{state === "before" ? "点击“更新后”，观察同一批样本如何移动" : "位置已随 Θ 改变；样本编号与类别颜色保持不变"}</p>
    </div>
  </figure>;
}
