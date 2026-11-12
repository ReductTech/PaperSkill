import type { CSSProperties } from "react";
import { ViewportFigure } from "./viewport-figure";

export function P4SharedPrompt() {
  return <ViewportFigure className="p4-shared-prompt" label="同一组 Prompt 在两项任务间共享"
    timing={[2260, 2980]}
    cues={[
      { title: "先跟写回", text: "沿琥珀色虚线，看任务 B 的更新进入中央槽位。" },
      { title: "盯住同一槽", text: "P 变成 P′，槽位和读取路线不变。" },
      { title: "再看两边读取", text: "若 A 的样本再来，它会和 B 一样读到 P′。" },
    ]}
    caption="任务 A 的数据可以不参与本次更新；它之后仍可能读到改写后的参数。旧任务表现是否下降，需要实测。">
      <svg viewBox="0 0 1060 252" role="img" aria-label="任务 B 的写回修改唯一一组 Prompt，A 和 B 后续输入均读取更新值">
        <path className="shared-prompt__read" d="M 408 114 H 264 m 8 -5 -8 5 8 5 M 652 114 H 796 m -8 -5 8 5 -8 5" />
        <text x="335" y="98" textAnchor="middle" className="viewport-muted">读取</text>
        <text x="725" y="98" textAnchor="middle" className="viewport-muted">读取</text>
        <path className="shared-prompt__write" d="M 903 165 V 206 H 530 V 174" />
        <path className="shared-prompt__write-tip" d="M 525 181 L 530 174 L 535 181" />
        <circle cx="903" cy="206" r="3.5" className="shared-prompt__write-origin" />
        <text x="716" y="230" textAnchor="middle" className="shared-prompt__write-label">B 本次训练的优化器写回</text>

        <g className="shared-prompt__reader">
          <rect x="31" y="64" width="229" height="100" rx="10" />
          <text x="54" y="102">若再输入任务 A 的样本</text>
          <text x="54" y="131" className="viewport-muted">会读到改写后的 Prompt</text>
        </g>
        <g className="shared-prompt__reader" data-reader="b">
          <rect x="800" y="64" width="229" height="100" rx="10" />
          <text x="823" y="102">任务 B 的后续输入</text>
          <text x="823" y="131" className="viewport-muted">也读取这一组 Prompt</text>
        </g>

        <rect x="411" y="53" width="238" height="114" rx="12" className="shared-prompt__slot" />
        <text x="530" y="81" textAnchor="middle" className="shared-prompt__label">共享参数 · 只有一组</text>
        <rect x="468" y="102" width="124" height="42" rx="6" className="shared-prompt__param" />
        <text x="530" y="131" textAnchor="middle" className="shared-prompt__value shared-prompt__old">P</text>
        <text x="530" y="131" textAnchor="middle" className="shared-prompt__value shared-prompt__new">P′</text>
        <g transform="translate(903 165)"><circle r="5.5" className="shared-prompt__write-pulse" /></g>
        <g transform="translate(408 114)"><circle r="5" className="shared-prompt__read-pulse" style={{ "--read-x": "-144px" } as CSSProperties} /></g>
        <g transform="translate(652 114)"><circle r="5" className="shared-prompt__read-pulse" style={{ "--read-x": "144px" } as CSSProperties} /></g>
      </svg>
  </ViewportFigure>;
}
