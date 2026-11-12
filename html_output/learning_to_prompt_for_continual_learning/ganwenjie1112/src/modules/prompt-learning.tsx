
import { useState } from "react";
import { P7BatchGuide } from "./reading-guides";
import { P7KeyLab } from "./p7-key-lab";
import { Term } from "../shared/core/reference/ReferenceHub";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { Sub } from "./lesson-math";
import { promptPoolConfig, QUERIES } from "./prompt-retrieval-data";
import {
  gradientSourcesForSlot, P7_BATCH_INDICES, P7_BATCH_SAMPLES,
  P7_COMMON_INDICES, P7_UNTOUCHED_INDICES,
} from "./prompt-learning-data";
import { P7GradientGraph } from "./p7-gradient-graph";
import { arrive, curvePosition, DiagramParameter, type MotionCurve } from "./guided-motion";
import "./guided-motion.css";
import "./prompt-learning.css";

const stops = [
  { start: 0, time: 0, label: "读取同一快照", note: "先看左侧 A、B 的选集。它们都读取 Θᵦ。下方可以切换要追踪的槽位。" },
  { start: 800, time: 3640, label: "分类梯度", note: "沿蓝线观察 A 的两份分类贡献。Prompt 路径经过冻结 Transformer，分类器直接收到梯度。" },
  { start: 3860, time: 5610, label: "匹配梯度", note: "沿绿线看 A 的匹配贡献到达 Key。硬 Top‑N 的整数索引不传分类梯度。" },
  { start: 5850, time: 10300, label: "汇总两份贡献", note: "接着看 B 的贡献进入同一个槽位；合并标记保留样本来源，参数仍是 Θᵦ。" },
  { start: 10600, time: 14300, label: "一次写回", note: "按参数归并贡献，优化器在批末写回一次。下一批读取 Θᵦ₊₁。" },
] as const;
const duration = 14300;
const blue = "#315d73";
const leaf = "#396746";
const ochre = "#775023";
const rows = [
  { kind: "prompts", y: 75, color: blue, fill: "#dce9ed", loss: "分类损失 · 经冻结 ViT" },
  { kind: "classifier", y: 151, color: blue, fill: "#dce9ed", loss: "分类损失 · 直接回传" },
  { kind: "keys", y: 227, color: leaf, fill: "#dce8d5", loss: "匹配损失 · 直接对 Key 求导" },
] as const;
const timings = [
  [[1150, 2490], [6200, 7610]],
  [[2390, 3490], [7570, 8850]],
  [[4020, 5440], [8930, 10180]],
] as const;

function BatchScene({ time, slot }: { time: number; slot: number }) {
  const sources = gradientSourcesForSlot(slot);
  const batchStart = 12600;
  const committed = time >= 13260;
  return <svg className="p7-scene" viewBox="0 0 860 300" role="img"
    aria-label={`槽位 ${slot} 的梯度贡献。分类损失更新 Prompt 和分类器，匹配损失更新 Key，A、B 的贡献按参数汇总后由优化器批末写回一次。`}>
    <text x="30" y="31" className="p7-label">两个样本 · 同读 Θᵦ</text>
    <text x="239" y="31" className="p7-label">A、B 的梯度贡献</text>
    <text x="623" y="31" className="p7-label" textAnchor="middle">整批梯度</text>
    <text x="783" y="31" className="p7-label" textAnchor="middle">
      <tspan opacity={1 - arrive(time, batchStart, 13260)}>参数 Θᵦ</tspan>
      <tspan x="783" opacity={arrive(time, batchStart, 13260)}>参数 Θᵦ₊₁</tspan>
    </text>

    {P7_BATCH_SAMPLES.map(({id, selected}, i) => {
      const y = 80 + i * 104;
      const query = QUERIES[id].vector;
      const reveal = i === 0 ? 1 - .38 * arrive(time, 5750, 6310) : .66 + .34 * arrive(time, 5750, 6310);
      const color = i === 0 ? ochre : leaf;
      return <g key={id} opacity={reveal}>
        <circle cx="48" cy={y} r="16" fill={i === 0 ? "#f0e2c9" : "#dce8d5"} stroke={color} />
        <path d={`M48 ${y}l${11 * query.x} ${-11 * query.y}`} stroke={color} strokeWidth="2" />
        <text x="73" y={y + 4} className="p7-label">样本 {id} · 标签 <DiagramParameter symbol="y" index={id} /></text>
        {selected.map((index, order) => <g key={index} transform={`translate(${29 + 30 * order} ${y + 22})`}>
          <rect width="24" height="22" rx="3" fill={index === slot ? "#e8d9ba" : "#edf3e9"} stroke={index === slot ? "#a78450" : "#b9c9b8"} />
          <text x="12" y="15" textAnchor="middle">{index}</text>
        </g>)}
      </g>;
    })}
    <path d="M207 46V264 M708 46V264" className="p7-rule" />
    <text x="30" y="276" className="p7-muted">硬 Top‑N 只给出索引</text>
    {rows.map(({kind, y, color, fill, loss}, row) => {
      const ids = sources[kind];
      const mergeStart = 10700 + row * 140;
      const sourceExit = arrive(time, mergeStart, mergeStart + 280);
      const resultReveal = arrive(time, mergeStart + 340, 11950 + row * 140);
      const write = arrive(time, batchStart, 13260);
      const target = kind === "prompts"
        ? <>Prompt <DiagramParameter symbol="P" index={slot} /></>
        : kind === "keys" ? <>Key <DiagramParameter symbol="k" index={slot} /></> : "分类器 φ";
      const resultWidth = ids.length > 1 ? 52 : 24;
      const resultStartX = ids.length > 1 ? 624 : ids[0] === "B" ? 639 : 609;
      const resultRoute: MotionCurve = [
        {x:resultStartX,y:y+14}, {x:652,y:y+14}, {x:677,y:y+9},
        {x:731-resultWidth/2-4,y:y+9},
      ];
      const resultPoint = curvePosition(resultRoute, write);
      return <g key={kind} data-parameter={kind} data-written={committed && ids.length > 0}>
        <rect x="222" y={y - 26} width="609" height="67" rx="7" fill={fill} opacity=".41" />
        <text x="239" y={y - 8} className="p7-loss-label" style={{fill:color}}>{loss}</text>
        <rect x="588" y={y - 2} width="74" height="33" rx="4" fill="#f6f8f2" stroke="#b8c8b7" />
        <rect x="731" y={y - 9} width="86" height="36" rx="5" fill={fill} stroke="#a1b3a1" />
        <rect x="731" y={y - 9} width="86" height="36" rx="5" fill={color} opacity={ids.length > 0 ? .23 * write : 0} />
        <text x="774" y={y + 13} textAnchor="middle" className="p7-label">{target}</text>
        {ids.length === 0 && <text x="625" y={y + 19} textAnchor="middle" className="p7-muted">无梯度</text>}

        {ids.map(id => {
          const index = id === "A" ? 0 : 1;
          const [begin, end] = timings[row][index];
          const move = arrive(time, begin, end);
          const laneY = y + 9 + index * 22;
          const targetX = 609 + index * 30;
          const route: MotionCurve = [{x:251,y:laneY},{x:366,y:laneY},{x:493,y:laneY},{x:targetX,y:y+14}];
          const point = curvePosition(route, move);
          const opacity = (.47 + .53 * arrive(time, begin - 300, begin)) * (1 - sourceExit);
          return <g key={id}>
            <g data-contribution={`${id}-${kind}`} transform={`translate(${point.x} ${point.y})`} opacity={opacity}>
              <rect x="-9" y="-8" width="18" height="16" rx={id === "A" ? 8 : 3} fill={fill} stroke={color} />
              <text y="4.7" textAnchor="middle" className="p7-mark" style={{fill:color}}>{id}</text>
            </g>
          </g>;
        })}
        {ids.length > 0 && <>
          <g transform={`translate(${resultPoint.x} ${resultPoint.y})`} opacity={resultReveal * (1 - arrive(time, 13140, 13340))}>
            <rect x={-resultWidth / 2} y="-10" width={resultWidth} height="20" rx="6" fill="#f6f8f2" stroke={color} />
            {ids.map((id, index) => {
              const sourceX = ids.length > 1 ? (index === 0 ? -15 : 15) : 0;
              const sourceColor = id === "A" ? ochre : leaf;
              const sourceFill = id === "A" ? "#f0e2c9" : "#dce8d5";
              return <g key={id}>
                <circle cx={sourceX} cy="0" r="6.5" fill={sourceFill} stroke={sourceColor} />
                <text x={sourceX} y="3.4" textAnchor="middle" className="p7-sum-label" style={{fill:sourceColor}}>{id}</text>
              </g>;
            })}
            {ids.length > 1 && <text x="0" y="3.4" textAnchor="middle" className="p7-sum-plus">+</text>}
          </g>
        </>}
      </g>;
    })}
  </svg>;
}



export function PromptLearning() {
  const playback = useLessonPlayback(duration);
  const [slot, setSlot] = useState(P7_COMMON_INDICES[0]);
  const stop = stops.reduce((active, item) => item.start <= playback.position ? item : active, stops[0]);
  return <>
    <p className="lesson-lead">P6 用已经选好的 Prompt 得到了类别分数。训练时还知道图像的真实标签，于是可以衡量预测偏差，并用它调整分类过程。检索本身也要学习，因为这一轮选中的 Key 决定了下一轮有哪些 Prompt 容易被读到。</p>
    <section className="explain-section">
      <h3>分类误差沿着前向计算回到 Prompt</h3>
      <p>用交叉熵比较样本的类别分数和标签得到<span className="lesson-key lesson-term--value"><Term id="classification-loss">分类损失</Term></span>。共享分类器直接参与预测，因此可以接收这项损失的梯度。选中的 Prompt 先经过 Transformer，再经平均池化影响类别分数，所以梯度也沿着这条路径回到这些 Prompt。冻结层照常参与求导，其权重保持固定。</p>
      <div className="guided-equations p7-equation"><math display="block"><Sub base="L" index="cls" /><mo>=</mo><mi>CE</mi><mo>(</mo><Sub base="g" index="φ" /><mo>(</mo><mi>h</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>)</mo><mo>,</mo><mi>y</mi><mo>)</mo></math></div>
    </section>
    <section className="explain-section">
      <h3>用距离给已选 Key 直接的学习信号</h3>
      <p>轻微移动一个 Key 时，余弦距离会连续变化。<span className="lesson-key"><Term id="retrieval-top-n">硬 Top‑N</Term></span>只返回一组整数索引，名次越过入选边界时，索引才会跳变。以当前选集为条件求分类梯度，无法沿离散索引回到 Key 排名。</p>
      <p>因此，L2P 把已选 Key 到冻结 Query 的距离相加，作为<span className="lesson-key lesson-term--object"><Term id="matching-loss">匹配损失</Term></span>。这项距离直接依赖 Key 向量，能让已选 Key 向当前 Query 的方向靠近。系数 λ 控制匹配损失在<Term id="joint-objective">联合目标</Term>中的权重。</p>
      <div className="guided-equations p7-equation">
        <math display="block"><Sub base="L" index="match" /><mo>=</mo><munder><mo>∑</mo><mrow><mi>j</mi><mo>∈</mo><mi>S</mi><mo>(</mo><mi>x</mi><mo>)</mo></mrow></munder>
        <mi>γ</mi><mo>(</mo><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>,</mo><Sub base="k" index="j" /><mo>)</mo></math>
        <math display="block"><mi>L</mi><mo>=</mo><Sub base="L" index="cls" /><mo>+</mo><mi>λ</mi><Sub base="L" index="match" /></math>
      </div>
    </section>
    <P7GradientGraph />
    <section className="explain-section">
      <h3>两个样本先把贡献累积到<span className="editorial-key">同一份参数</span></h3>
      <p><Term id="mini-batch">Mini-batch</Term> 是一组共同完成一次更新的样本。下图中的 A、B 沿用 P5 的选集，前向和损失计算都从同一份 <math><Sub base="Θ" index="b" /></math> 读取参数。选集相交于 {P7_COMMON_INDICES.join("、")} 号槽位。观察这些槽位时，<span className="lesson-key lesson-term--value">两份分类梯度</span>会汇入同一个 Prompt，<span className="lesson-key lesson-term--object">两份匹配梯度</span>会汇入其配对 Key。</p>
    </section>
    <P7BatchGuide />
    <figure className="lesson-figure guided-motion p7-batch-figure">
      <div className="motion-dock p7-control-dock">
        <div className="motion-stops p7-motion-stops" role="group" aria-label="联合训练阶段">
          {stops.map(item => <button className="lesson-choice" type="button" key={item.time} aria-pressed={stop === item}
            onClick={() => playback.playSegment(item.start, item.time)}>{item.label}</button>)}
        </div>
        <PlaybackControls playback={playback} label="批内更新进度" />
        <span className="motion-pan-hint">横向滑动查看完整过程</span>
      </div>
      <div className="motion-window p7-scene-scroll" role="region" tabIndex={0} aria-label="两个样本的学习路径">
        <BatchScene time={playback.position} slot={slot} />
      </div>
      <div className="p7-slots" role="group" aria-label="查看池中槽位">
        <strong>放大槽位</strong>
        {Array.from({length: promptPoolConfig.poolSize}, (_, offset) => {
          const index = offset + 1;
          const sources = gradientSourcesForSlot(index).keys;
          return <button className="lesson-choice" key={index} type="button" aria-pressed={slot === index} data-slot={index}
            aria-label={`槽位 ${index} · ${sources.join(" 和 ") || "本批未命中"}`} onClick={() => setSlot(index)}>
            {index}<span>{sources.join("+") || "·"}</span>
          </button>;
        })}
      </div>
      <figcaption aria-live="polite">{stop.note}</figcaption>
    </figure>
    <section className="explain-section">
      <h3>汇总整批梯度后，优化器写回一次</h3>
      <p>这里按 Algorithm 1 将样本损失相加。对每个参数求导时，A、B 对它的贡献相加，之后执行<span className="lesson-key"><Term id="batch-writeback">一次 Batch 更新</Term></span>。本批命中的槽位是 {P7_BATCH_INDICES.join("、")}，{P7_UNTOUCHED_INDICES.join("、")} 号槽位没有来自本批样本的直接梯度。共享分类器收到 A、B 两份分类梯度。</p>
      <div className="guided-equations p7-equation">
        <math display="block"><Sub base="L" index="batch" /><mo>=</mo><Sub base="L" index="A" /><mo>+</mo><Sub base="L" index="B" /></math>
        <math display="block"><Sub base="Θ" index="b+1" /><mo>=</mo><mi>OptimizerStep</mi><mo>(</mo><Sub base="Θ" index="b" /><mo>,</mo><mo>∇</mo><Sub base="L" index="batch" /><mo>)</mo></math>
      </div>
    </section>
    <section className="explain-section">
      <h3>两张图同时命中一个 Key，它会<span className="editorial-key">朝哪边走</span>？</h3>
      <p>用 A、B 在 P5 共同命中的 {P7_COMMON_INDICES[0]} 号槽位做一次复算。两张图的 Query 都固定，匹配损失的梯度先在同一枚 Key 上相加，批末才移动它。播放时注意：<span className="lesson-key">总距离下降</span>，并不要求每个样本的距离都下降。</p>
      <P7KeyLab />
      <details className="p7-optimizer-note">
        <summary>论文中的优化器设置 · Adam</summary>
        <p>论文使用 Adam（β₁ = 0.9、β₂ = 0.999），批大小为 128，学习率为 0.03。上方 Key 位移是便于复算梯度方向的一步 SGD 教学例子，不代表论文采用 SGD，也不模拟 Adam 的内部状态。</p>
      </details>
    </section>
    <p className="lesson-takeaway">下一批重新用更新后的 Key 排名，并从同一组参数读取选中的 Prompt 和分类器。P8 将沿这份状态追踪下一批、下一项任务与最终预测。</p>
  </>;
}
