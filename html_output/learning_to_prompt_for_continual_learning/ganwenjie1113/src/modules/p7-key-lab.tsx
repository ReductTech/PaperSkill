import { useId, type CSSProperties } from "react";
import { arrive, blend, elapsed, MotionTrace, type MotionCurve } from "./guided-motion";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { P7_KEY_STEP as step } from "./prompt-learning-data";
import { cosineDistance, type Vector2 } from "./prompt-retrieval-data";
import "./p7-key-lab.css";

const duration = 8100;
const writeStart = 3680;
const writeEnd = 6300;
const colors = { A: "var(--lab-a)", B: "var(--lab-b)", key: "var(--lab-key)" } as const;
const phases = [
  { title: "梯度汇入", at: 3450, note: "A 与 B 的梯度指向相反方向，先相加；Key 仍停在原位。" },
  { title: "批末写回", at: 4990, note: "紫色箭头沿合成方向移到新位置。途中是同一步的示意过渡。" },
  { title: "距离复核", at: duration, note: "Key 更接近 B、离 A 更远，但两项距离之和比写回前更小。" },
];
const origin = { x: 264, y: 218 };
const radius = 148;
const place = (v: Vector2) => ({ x: origin.x + radius * v.x, y: origin.y - radius * v.y });
const direction = (v: Vector2) => Math.atan2(v.y, v.x);
const initialTip = place(step.initial);
const updatedTip = place(step.updated);
const distances = (key: Vector2) => step.contributions.map(item => cosineDistance(item.query, key));
const initialDistances = distances(step.initial);
const total = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0);

function arc(a: number, b: number, r: number) {
  const point = (angle: number) => [origin.x + Math.cos(angle) * r, origin.y - Math.sin(angle) * r].join(" ");
  return `M ${point(a)} A ${r} ${r} 0 0 ${b > a ? 0 : 1} ${point(b)}`;
}

function VectorArrow({ vector, color }: { vector: Vector2; color: string }) {
  return <g transform={`translate(${origin.x} ${origin.y}) rotate(${-direction(vector) * 180 / Math.PI})`} stroke={color} fill={color}>
    <path d={`M 0 0 H ${radius * Math.hypot(vector.x, vector.y) - 7}`} strokeWidth="2" />
    <path d="M 0 -5 L 10 0 L 0 5 Z" transform={`translate(${radius * Math.hypot(vector.x, vector.y) - 10} 0)`} stroke="none" />
  </g>;
}

function KeyPlot({ keyVector, time }: { keyVector: Vector2; time: number }) {
  const title = useId();
  const tip = place(keyVector);
  const keyAngle = direction(keyVector);
  const updating = elapsed(time, writeStart, writeEnd);
  const pulseOpacity = 1 - elapsed(time, 3450, 4030);
  return <svg className="p7-lab-plot" viewBox="0 0 540 410" role="img" aria-labelledby={title}>
    <title id={title}>两枚固定 Query 与同一枚共享 Key 的方向和批末位移</title>
    <g className="p7-lab-grid" fill="none">
      <path d="M 90 218 H 457 M 264 51 V 366" />
      {[55, 101, radius].map(r => <circle key={r} cx={origin.x} cy={origin.y} r={r} className={r === radius ? "p7-lab-unit" : undefined} />)}
    </g>
    <text x="467" y="223" className="p7-lab-axis">x</text>
    <text x="260" y="45" className="p7-lab-axis">y</text>
    <text x="105" y="393" className="p7-lab-axis">虚线圆 · 单位长度</text>

    {step.contributions.map(({ id, query, gradient }, index) => {
      const qTip = place(query);
      const bend = id === "A" ? { x: 473, y: 156 } : { x: 280, y: 52 };
      const lane: MotionCurve = [qTip, bend, { x: bend.x, y: initialTip.y - 12 }, initialTip];
      const t = elapsed(time, 440 + index * 750, 2420 + index * 750);
      // The tangent arrows are negative gradient contributions, drawn at a common origin.
      const gx = -gradient.x * 65;
      const gy = gradient.y * 65;
      const angle = Math.atan2(gy, gx) * 180 / Math.PI;
      return <g key={id}>
        <path d={arc(direction(query), keyAngle, index === 0 ? 70 : 104)} stroke={colors[id]} strokeWidth="1.5" fill="none" opacity=".76" />
        <VectorArrow vector={query} color={colors[id]} />
        <text x={qTip.x + (id === "A" ? 16 : -14)} y={qTip.y + (id === "A" ? 5 : -9)}
          textAnchor={id === "A" ? "start" : "end"} fill={colors[id]}>Query {id}</text>
        <MotionTrace curve={lane} progress={t} color={colors[id]} opacity={pulseOpacity} />
        <g transform={`translate(${initialTip.x} ${initialTip.y}) rotate(${angle})`}
          opacity={elapsed(t, .87, 1) * pulseOpacity} fill={colors[id]} stroke={colors[id]}>
          <line x1="0" y1="0" x2={Math.hypot(gx, gy) - 5} y2="0" strokeWidth="3" />
          <path d="M -8 -5 L 0 0 L -8 5 Z" transform={`translate(${Math.hypot(gx, gy)} 0)`} stroke="none" />
        </g>
      </g>;
    })}
    <path d={`M ${initialTip.x} ${initialTip.y} L ${updatedTip.x} ${updatedTip.y}`}
      stroke={colors.key} opacity={.15 + .55 * elapsed(time, 3160, writeStart)} strokeDasharray="4 5" fill="none" />
    <path d={`M ${origin.x} ${origin.y} L ${initialTip.x} ${initialTip.y}`}
      stroke={colors.key} opacity={.42 * updating} strokeDasharray="3 5" />
    <circle cx={initialTip.x} cy={initialTip.y} r="4" fill="none" stroke={colors.key} opacity={updating} />
    <VectorArrow vector={keyVector} color={colors.key} />
    <g data-key-identity={step.index} transform={`translate(${tip.x} ${tip.y})`}>
      <circle r="12" fill={colors.key} opacity=".22" />
      <circle r="5" fill={colors.key} />
      <text x="16" y="-9" fill={colors.key}>Key {step.index}</text>
    </g>
    <circle cx={origin.x} cy={origin.y} r="3" fill="var(--lab-muted)" />
    <g transform="translate(352 388)">
      <path d="M 0 0 H 24" stroke={colors.key} strokeDasharray="4 5" />
      <text x="32" y="5" className="p7-lab-axis">写回轨迹</text>
    </g>
  </svg>;
}

export function P7KeyLab() {
  const playback = useLessonPlayback(duration);
  const time = playback.position;
  // Ease geometry on the existing frame clock. The model commits only at writeEnd.
  const t = arrive(time, writeStart, writeEnd);
  const keyVector = { x: blend(step.initial.x, step.updated.x, t), y: blend(step.initial.y, step.updated.y, t) };
  const current = distances(keyVector);
  const phase = time < writeStart ? 0 : time < writeEnd ? 1 : 2;
  return <figure className="p7-key-lab" data-phase={phase} data-writebacks={phase === 2 ? 1 : 0} aria-label="共享 Key 的批次更新实验">
    <div className="p7-key-lab__surface">
      <div className="p7-lab-steps" role="group" aria-label="查看更新阶段">
        {phases.map((item, index) => <button key={item.title} type="button" aria-pressed={phase === index} onClick={() => playback.seek(item.at)}>
          <span>{String(index + 1).padStart(2, "0")}</span>{item.title}
        </button>)}
      </div>
      <div className="p7-key-lab__body">
        <div className="p7-key-lab__geometry"><KeyPlot keyVector={keyVector} time={time} /></div>
        <div className="p7-key-lab__data">
          <h4>同一枚 Key 的两项距离</h4>
          <p>圆点标当前距离，短刻线标写回前。这里取 0–1 的局部刻度。</p>
          <dl>
            {step.contributions.map(({ id }, index) => <div key={id} className="p7-lab-measure" data-query={id}>
              <dt>与 Query {id}</dt>
              <dd data-distance={current[index].toFixed(6)}>{current[index].toFixed(3)}</dd>
              <dd className="p7-lab-track" aria-hidden="true">
                <i className="p7-lab-baseline" style={{ left: `${initialDistances[index] * 100}%` }} />
                <i className="p7-lab-point" style={{ transform: `translateX(${current[index] * 100}cqw)` }} />
              </dd>
            </div>)}
            <div className="p7-lab-total"><dt>匹配距离之和 <span>原值 {total(initialDistances).toFixed(3)}</span></dt>
              <dd data-total={total(current).toFixed(6)}>{total(current).toFixed(3)}</dd></div>
          </dl>
        </div>
      </div>
      <div className="p7-key-lab__controls" style={{ "--lab-progress": `${100 * time / duration}%` } as CSSProperties}>
        <PlaybackControls playback={playback} label="共享 Key 更新进度" />
        <p aria-live="polite">{phases[phase].note}</p>
      </div>
    </div>
    <figcaption>沿用 P5 的二维 Query 和 Key，按两项余弦距离的梯度之和做一次 SGD 教学计算（此处步长 {step.learningRate}，把 λ 吸收到步长中）。圆弧标两侧夹角；彩色短箭头标各样本的负梯度方向。论文实验使用 Adam。</figcaption>
  </figure>;
}
