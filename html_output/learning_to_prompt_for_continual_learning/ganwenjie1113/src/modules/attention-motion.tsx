import { PlaybackControls, useLessonPlayback } from "./lesson-playback";

type Route = { name: string; weight: number };
type Vector = readonly [number, number];
const DURATION = 3800;

function curve(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t;
  return u ** 3 * a + 3 * u ** 2 * t * b + 3 * u * t ** 2 * c + t ** 3 * d;
}

function position(value: number) { return Math.max(0, Math.min(1, value)); }
function display(vector: Vector, digits: number) { return "[" + vector.map(value => value.toFixed(digits)).join(", ") + "]"; }

export function AttentionMotion({ rows, query, output, target }: { rows: Route[]; query: Vector; output: Vector; target: string }) {
  const playback = useLessonPlayback(DURATION);
  const matching = position(playback.position / 1250);
  const normalization = position((playback.position - 1250) / 850);
  const aggregation = position((playback.position - 2100) / 1500);
  const stage = playback.position < 1250 ? 0 : playback.position < 2100 ? 1 : 2;
  return <div className="attention-motion">
    <PlaybackControls playback={playback} label="注意力计算进度" />
    <div className="motion-stops" aria-label="跳到注意力步骤">
      {["Q 匹配各 Key", "Softmax 归一化", "按权重汇聚 Value"].map((label, i) =>
        <button className="lesson-choice" type="button" key={label} aria-pressed={stage === i}
          onClick={() => playback.seek([0, 1700, DURATION][i])}>{i + 1}. {label}</button>)}
    </div>
    <div className="attention-routing" aria-label="目标 Query 分别匹配各 Key，每个 Value 按权重汇入目标输出">
      <svg className="routing-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {rows.map(({name, weight}, i) => {
          const y = (i + .5) * 100 / rows.length;
          return <g key={name}>
            <path className="query-line" d={`M20 50 C29 50 31 ${y} 40 ${y}`} vectorEffect="non-scaling-stroke" />
            <path className="value-line" d={`M60 ${y} C69 ${y} 71 50 80 50`} vectorEffect="non-scaling-stroke" strokeWidth={1 + weight * 6 * normalization} />
            {matching > 0 && matching < 1 && <path className="routing-particle matching-particle"
              transform={`translate(${curve(matching,20,29,31,40)},${curve(matching,50,50,y,y)})`}
              d="M-.01 0h.02" vectorEffect="non-scaling-stroke" />}
            {aggregation > 0 && aggregation < 1 && <path className="routing-particle value-particle"
              transform={`translate(${curve(aggregation,60,69,71,80)},${curve(aggregation,y,y,50,50)})`}
              d="M-.01 0h.02" strokeWidth={2 + weight * 9} vectorEffect="non-scaling-stroke" />}
          </g>;
        })}
      </svg>
      <div className="routing-end"><small>目标 {target}</small><strong>Q {display(query, 0)}</strong></div>
      <div className="routing-sources">
        {rows.map(({name,weight}) => <div key={name}><b>{name}</b><small>Key ↔ Value</small><span>{(weight * 100).toFixed(1)}%</span></div>)}
      </div>
      <div className="routing-end"><small>汇聚结果</small><strong>{display(output, 3)}</strong></div>
    </div>
    <p className="motion-status">{[
      "同一目标 Q 沿虚线送往各来源，分别与 Key 算匹配分数。",
      "对同一目标的所有分数做 Softmax。表中权重合计为 1。",
      "各来源 Value 沿实线汇入输出，线的粗细对应归一化后的权重。",
    ][stage]}</p>
  </div>;
}
