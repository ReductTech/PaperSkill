import { useId, useState } from "react";

type PreservationMode = "parameters" | "responses";

export function PreservationCompare() {
  const [mode, setMode] = useState<PreservationMode>("responses");
  const titleId = useId();
  const isResponses = mode === "responses";

  return <div className="v3-preservation-compare">
    <div className="v3-compact-toggle" role="group" aria-label="选择保持对象">
      <button type="button" aria-pressed={!isResponses} onClick={() => setMode("parameters")}>Parameter view</button>
      <button type="button" aria-pressed={isResponses} onClick={() => setMode("responses")}>Response view</button>
    </div>
    <figure className="v3-preservation-figure" aria-labelledby={titleId}>
      <div className="v3-preservation-stage">
      <div className={`v3-preservation-panel ${isResponses ? "is-active" : "is-inactive"}`} aria-hidden={!isResponses}>
        <div className="v3-response-comparison" role="img" aria-label="同一个当前输入 Xn 分别经过冻结 Teacher 和可训练 Student，比较两者的旧任务响应">
        <div className="v3-preservation-input"><strong>Xₙ</strong><span>当前任务输入</span></div>
        <div className="v3-preservation-branches">
          <div className="v3-preservation-branch is-teacher"><span className="v3-preservation-arrow" aria-hidden="true">→</span><div><strong>Teacher</strong><small>固定旧模型</small></div><span className="v3-preservation-arrow" aria-hidden="true">→</span><b>Yₒ</b></div>
          <div className="v3-preservation-branch is-student"><span className="v3-preservation-arrow" aria-hidden="true">→</span><div><strong>Student</strong><small>当前模型</small></div><span className="v3-preservation-arrow" aria-hidden="true">→</span><b>Ŷₒ</b></div>
          <div className="v3-response-match"><span aria-hidden="true">↕</span>比较同一输入上的旧任务输出</div>
        </div>
        </div>
      </div>
      <div className={`v3-preservation-panel ${!isResponses ? "is-active" : "is-inactive"}`} aria-hidden={isResponses}>
        <div className="v3-parameter-comparison" role="img" aria-label="参数保持比较旧模型参数 theta old 和更新后参数 theta new 的坐标距离">
        <div className="v3-parameter-point"><strong>θ old</strong><span>旧模型参数</span></div>
        <div className="v3-parameter-distance"><span aria-hidden="true">↔</span><b>parameter distance</b></div>
        <div className="v3-parameter-point is-current"><strong>θ new</strong><span>更新后参数</span></div>
        </div>
      </div>
      </div>
      <figcaption id={titleId} aria-live="polite">{isResponses ? "关注同一输入上的旧任务响应是否接近。" : "关注参数坐标相对旧模型移动了多少。"}</figcaption>
    </figure>
    <p className="v3-mechanism-takeaway">LwF 直接约束当前可观察输入上的旧任务响应；它不要求 Student 参数停在旧坐标附近。</p>
  </div>;
}
