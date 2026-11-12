import { WeightedSum } from "./lesson-math";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";

const HEADS = [[2, 4], [1, 3], [5, 2]] as const;
const COLORS = ["#a3c3cc", "#b8cda9", "#e9ca9b"];
const INK = ["#315d73", "#396746", "#775023"];
const CONCAT = HEADS.flat();
const OUT = CONCAT.map((value, i) => (value + CONCAT[(i + 2) % CONCAT.length]) / 2);
const TOTAL = 5900;
const STAGES = [
  { at: 0, title: "并行处理" },
  { at: 2150, title: "沿特征轴拼接" },
  { at: 4350, title: "输出投影" },
  { at: TOTAL, title: "查看结果" },
];

function unit(value: number) { return Math.min(1, Math.max(0, value)); }
function interpolate(a: number, b: number, t: number) { return a + (b - a) * t; }
function cubic(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u ** 3 * a + 3 * u ** 2 * t * b + 3 * u * t ** 2 * c + t ** 3 * d;
}

export function HeadMergeMotion() {
  const playback = useLessonPlayback(TOTAL);
  const time = playback.position;
  const stage = STAGES.filter(step => time >= step.at).length - 1;
  const fork = unit(time / 1350);
  const forkFade = 1 - unit((time - 1350) / 210);
  const concat = unit((time - 2150) / 1850);
  const projection = unit((time - 4350) / 1550);
  return <div className="head-animation">
    <PlaybackControls playback={playback} label="多头拼接与输出投影进度" />
    <div className="motion-stops" aria-label="跳到多头计算步骤">
      {STAGES.map((step,i) => <button key={step.at} className="lesson-choice" type="button"
        aria-pressed={i === stage} onClick={() => playback.seek(step.at)}>{step.title}</button>)}
    </div>
    <svg className="head-animation-stage" viewBox="0 0 760 246" role="img" aria-label="三个两维 Head 结果移入同一位置的六维向量，经过矩阵映射得到六维输出">
      <rect width="760" height="246" rx="10" fill="#f2f5ed" />
      <g className="head-stage-label">
        <text x="29" y="30">目标位置 i</text><text x="183" y="30">各 Head 的输出</text>
        <text x="327" y="30">拼接槽位</text><text x="528" y="30">Wₒ</text><text x="632" y="30">输出位置 i</text>
      </g>
      <rect x="30" y="102" width="88" height="42" rx="6" fill="#e5ede0" stroke="#98ad9a" />
      <text className="head-stage-label" x="74" y="128" textAnchor="middle">同一序列</text>
      {HEADS.map((head, h) => {
        const y = 69 + h * 54;
        const fanY = y + 14.5;
        return <g key={h}>
          <path d={`M118 123 C145 123 149 ${fanY} 182 ${fanY}`} fill="none" stroke={INK[h]} opacity=".27" />
          {fork > 0 && forkFade > 0 && Array.from({length: 12},(_,j) => {
            const t = fork - j * .025;
            if (t < 0) return null;
            return <circle key={j} cx={cubic(118,145,149,182,t)} cy={cubic(123,123,fanY,fanY,t)}
              r={j === 0 ? 3 : 1.8} fill={INK[h]} opacity={forkFade * (1-j/12)} />;
          })}
          <text x="182" y={y - 6} className="head-stage-small" fill={INK[h]}>Head {h + 1}</text>
          {head.map((value,c) => {
            const target = 325 + (h * 2 + c) * 26;
            const x = interpolate(182 + c * 29, target, concat);
            const destY = interpolate(y, 109, concat);
            return <g key={c}>
              <rect x={target} y="109" width="24" height="29" rx="3" fill="none" stroke={INK[h]} strokeDasharray="2 3" opacity=".4" />
              <g transform={`translate(${x},${destY})`}>
                <rect width="24" height="29" rx="3" fill={COLORS[h]} stroke={INK[h]} />
                <text x="12" y="19" className="head-stage-value" textAnchor="middle" fill={INK[h]}>{value}</text>
              </g>
            </g>;
          })}
        </g>;
      })}
      <path d="M481 124h34m-7-4 7 4-7 4 M589 124h30m-7-4 7 4-7 4" stroke="#527760" fill="none" opacity=".6" />
      {CONCAT.flatMap((_, row) => CONCAT.map((__, col) => {
        const active = row === col || row === (col + 2) % CONCAT.length;
        return <rect key={row + ":" + col} x={519 + col * 10} y={94 + row * 10} width="8" height="8"
          fill={active ? "#669779" : "#dce6d8"} opacity={active ? .68 + projection * .32 : 1} />;
      }))}
      {OUT.map((value,i) => {
        const x = 625 + i % 3 * 28;
        const y = 93 + Math.floor(i / 3) * 32;
        return <g key={i}>
          <rect x={x} y={y} width="25" height="27" rx="3" fill="#e6eee3" stroke="#a9bbaa" />
          <g opacity={unit(projection * 1.25 - i * .05)}>
            <rect x={x} y={y} width="25" height="27" rx="3" fill="#bfdbc5" stroke="#508467" />
            <text x={x + 12.5} y={y + 18} textAnchor="middle" className="head-stage-value" fill="#214c3a">{value}</text>
          </g>
        </g>;
      })}
      {projection > 0 && projection < 1 && Array.from({length:16},(_,i) => {
        const t = projection * 1.2 - i * .022;
        return t > 0 && t < 1 && <circle key={i} cx={interpolate(479,620,t)} cy="124" r={i ? 2 : 3.2} fill="#326a50" opacity={1-i/16} />;
      })}
      <text x="325" y="216" className="head-stage-small">六个坐标都属于位置 i</text>
    </svg>
    <p className="motion-status">{[
      "各 Head 读取同一序列。这里只抽出它们在目标位置 i 上的结果。",
      "保留每个 Head 内部的坐标顺序，把三个两维向量排成六维向量。",
      "Wₒ 混合拼接后的特征。它作用在同一位置的特征轴上。",
      "得到位置 i 的新向量。其他位置分别做同样的拼接和投影。",
    ][stage]}</p>
    <div className="head-motion-equations">
      <p><strong>拼接</strong>　[{HEADS.map(head => head.join(", ")).join(" | ")}]</p>
      <p><strong>投影示例</strong>　第一个输出 <WeightedSum terms={[{weight: .5, value: CONCAT[0]}, {weight: .5, value: CONCAT[2]}]} result={OUT[0]} digits={1} /></p>
    </div>
    <p className="rk-note">图中用 3 个两维 Head 演示。典型 ViT-B/16 的 12 个 64 维 Head 在每个位置拼成 768 维，再乘学习得到的 Wₒ。拼接保留各头的值，投影才混合它们。</p>
  </div>;
}
