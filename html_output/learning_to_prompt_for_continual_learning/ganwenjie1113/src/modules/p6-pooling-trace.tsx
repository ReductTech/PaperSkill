import type { CSSProperties } from "react";
import { P6_FINAL_POOL_EXAMPLE as result, P6_POOL_SAMPLE_ROWS, P6_IMAGE_CLS_SEQUENCE_INDEX } from "./prompt-forward-data";
import { ViewportFigure } from "./viewport-figure";

const centerY = 145;
const sumX = 652;
const sum = result.sum.toFixed(2);
const mean = result.runningMean?.toFixed(2);

export function P6PoolingTrace() {
  return <ViewportFigure className="p6-pooling-trace" label="平均池化的第一维"
    timing={[620, 3420]}
    cues={[
      { title: "对准同一维", text: "左边 25 格都是第 1 维；只取紫色的 Prompt 行。" },
      { title: "跟小计汇入", text: `五个小计沿连线汇到同一个总和 ${sum}。` },
      { title: "除以位置数", text: `分母是 ${result.totalCount} 个位置；${mean} 是输出的一个分量。` },
    ]}
    caption="五组只用于帮助跟读。其余维度各自重复同样的运算，因此池化减少的是位置数，特征宽度不变。">
      <svg viewBox="0 0 1060 328" role="img"
        aria-label={`只读 Prompt 输出的第 1 维，${result.totalCount} 项相加为 ${sum}，再除以 ${result.totalCount} 得 ${mean}`}>
        <text x="28" y="31" className="pooling-trace__heading">H 的第 1 维</text>
        <text x="160" y="31" className="viewport-muted">教学数值</text>
        <text x="423" y="31" className="viewport-muted" textAnchor="middle">每组小计</text>
        <text x={sumX} y={centerY - 59} textAnchor="middle" className="pooling-trace__heading">相加</text>
        <text x="785" y={centerY - 15} textAnchor="middle" className="pooling-trace__heading">÷ {result.totalCount}</text>
        <text x="931" y={centerY - 59} textAnchor="middle" className="pooling-trace__heading">得到 h 的第 1 维</text>
        {P6_POOL_SAMPLE_ROWS.map(({ promptIndex, sequenceStart, values }, index) => {
          const y = 66 + index * 39;
          const subtotal = result.groupSums[index].toFixed(2);
          return <g key={promptIndex}>
            <path className="pooling-trace__route" d={`M 445 ${y} L ${sumX} ${centerY}`} />
            <text x="28" y={y + 5} className="viewport-muted">行 {sequenceStart}–{sequenceStart + values.length - 1}</text>
            <text x="109" y={y + 5} className="pooling-trace__prompt">P<tspan fontSize="12" dy="4">{promptIndex}</tspan></text>
            {values.map((value, slot) => <g key={slot} transform={`translate(${160 + slot * 46} ${y})`}>
              <rect x="-1" y="-14" width="40" height="28" rx="4" className="pooling-trace__cell" />
              <text className="pooling-trace__number" x="19" y="5" textAnchor="middle">{value.toFixed(1)}</text>
            </g>)}
            <g transform={`translate(423 ${y})`} className="pooling-trace__subtotal">
              <rect x="-25" y="-14" width="50" height="28" rx="5" />
              <text y="5" textAnchor="middle">{subtotal}</text>
            </g>
            <g transform={`translate(423 ${y})`}>
              <g className="pooling-trace__packet"
                style={{ "--to-x": `${sumX - 423}px`, "--to-y": `${centerY - y}px`, "--delay": `${index * 250}ms` } as CSSProperties}>
                <rect x="-25" y="-14" width="50" height="28" rx="5" />
                <text y="5" textAnchor="middle">{subtotal}</text>
              </g>
            </g>
          </g>;
        })}
        <path d={`M 652 ${centerY} H 888 m -7 -5 7 5 -7 5`} className="pooling-trace__divide" />
        <g transform={`translate(${sumX} ${centerY})`} className="pooling-trace__sum">
          <rect x="-37" y="-25" width="74" height="50" rx="8" />
          <text y="7" textAnchor="middle">{sum}</text>
        </g>
        <g transform={`translate(${sumX} ${centerY})`}>
          <g className="pooling-trace__quotient"><circle r="5" /></g>
        </g>
        <g transform={`translate(931 ${centerY})`} className="pooling-trace__mean">
          <rect x="-37" y="-25" width="74" height="50" rx="8" />
          <text y="7" textAnchor="middle">{mean}</text>
        </g>
        <path className="pooling-trace__boundary" d="M 28 251 H 1032" />
        <rect x="28" y="273" width="57" height="30" rx="5" className="pooling-trace__cls" />
        <text x="56.5" y="293" textAnchor="middle" className="pooling-trace__cls-label">[CLS]</text>
        <text x="100" y="293" className="viewport-muted">行 {P6_IMAGE_CLS_SEQUENCE_INDEX} 起是图像输出，不进入这条求和路线。</text>
      </svg>
  </ViewportFigure>;
}
