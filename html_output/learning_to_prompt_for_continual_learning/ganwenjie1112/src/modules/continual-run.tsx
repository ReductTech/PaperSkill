import { useState } from "react";
import { P8AlgorithmGuide } from "./p8-algorithm-guide";
import { Term } from "../shared/core/reference/ReferenceHub";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { Sub } from "./lesson-math";
import { interpolateKeyAngles, P8_STAGES, type RunStage } from "./continual-run-data";
import { P8StateLedger, P8TrainInferMap } from "./p8-run-visuals";
import { arrive, elapsed, MotionTrace, type MotionCurve } from "./guided-motion";
import "./guided-motion.css";
import "./continual-run.css";

const timeline = [
  { start: 0, seek: 0, label: "初始化" },
  { start: 1100, seek: 4410, label: "批次 1" },
  { start: 4800, seek: 6890, label: "写回 1" },
  { start: 7150, seek: 9620, label: "批次 2" },
  { start: 10050, seek: 12040, label: "写回 2" },
  { start: 12300, seek: 13400, label: "继承参数" },
  { start: 14400, seek: 17220, label: "批次 1" },
  { start: 17600, seek: 19810, label: "写回 3" },
  { start: 20100, seek: 23900, label: "预测" },
] as const;

const duration = 23900;
const sections = [
  { label: "起点", first: 0, end: 1 },
  { label: "Task 1", first: 1, end: 5 },
  { label: "任务交接", first: 5, end: 6 },
  { label: "Task 2", first: 6, end: 8 },
  { label: "测试", first: 8, end: 9 },
] as const;
const versionLabels = ["初始化", "Task 1 · 批次 1 后", "Task 1 · 批次 2 后", "Task 2 · 批次 1 后"];

function VersionRail({ cursor, version }: { cursor: number; version: number }) {
  return <div className="p8-state-rail" aria-label={`当前参数版本 Θ${version}`}>
    <div className="p8-state-track" aria-hidden="true">
      <div data-run-state style={{ left: `${cursor * 100 / (versionLabels.length - 1)}%` }} />
    </div>
    <ol>{versionLabels.map((label, index) => <li key={label} aria-current={version === index ? "step" : undefined}>
      <strong><math aria-label={`Theta ${index}`}><Sub base="Θ" index={index} /></math></strong><span>{label}</span>
    </li>)}</ol>
  </div>;
}

function KeyDial({ angle }: { angle: number }) {
  return <svg viewBox="0 0 30 30" aria-hidden="true">
    <circle cx="15" cy="15" r="13" />
    <path d="M15 15h10l-3-2m3 2-3 2" transform={`rotate(${-angle} 15 15)`} />
  </svg>;
}

function SharedModel({ stage, angles, slot, setSlot, hits, write, version }: {
  stage: RunStage; angles: readonly number[]; slot: number; setSlot: (index: number) => void;
  hits: readonly number[]; write: number; version: number;
}) {
  const isStep = stage.kind === "step";
  const touched = stage.batch?.selectedUnion.includes(slot);
  const previous = stage.batch?.startAngles[slot - 1];
  const current = angles[slot - 1];
  const lastWrite = P8_STAGES.reduce((latest, event) => (
    event.kind === "step" && event.parameterVersion <= version && event.batch?.selectedUnion.includes(slot)
      ? event.parameterVersion : latest
  ), 0);

  return <div className="p8-model">
    <div className="p8-backbone">
      <svg viewBox="0 0 54 40" aria-hidden="true">
        <path d="M2 8H43l8 6H10z M2 18H43l8 6H10z M2 28H43l8 6H10z" />
        <path d="M26 20v-4a4 4 0 0 1 8 0v4m-10 0h12v11H24z" />
      </svg>
      <strong>冻结 ViT</strong><span className="p8-backbone__functions"><math aria-label="f sub e"><Sub base="f" index="e" /></math><span aria-hidden="true">/</span><math aria-label="f sub r"><Sub base="f" index="r" /></math></span>
    </div>
    <div className="p8-pool">
      <div className="p8-pool-title"><strong>同一组 Key–Prompt</strong><span>固定配对 · 选择随输入改变</span></div>
      <div className="p8-pool-slots" role="group" aria-label="查看 Key 与 Prompt 槽位">
        {angles.map((angle, i) => {
          const id = i + 1;
          const strength = hits[i];
          const active = strength >= .65;
          const updated = isStep && stage.batch?.selectedUnion.includes(id);
          return <button key={id} type="button" data-slot={id} data-hit={active} style={{ backgroundColor: `rgba(165, 193, 156, ${Math.min(1, .47 * strength + (updated ? .23 * Math.sin(Math.PI * write) : 0))})` }} aria-pressed={slot === id}
            aria-label={`槽位 ${id}${active ? "，当前选中" : ""}`} onClick={() => setSlot(id)}>
            <KeyDial angle={angle} />
            <span className="p8-prompt-strips" aria-hidden="true" style={{ opacity: updated ? .75 + .25 * write : .75 }} />
            <span>{id}</span>
          </button>;
        })}
      </div>
      <p className="p8-slot-detail" data-angle={current.toFixed(4)}>
        <math><Sub base="k" index={slot} /></math> · {current.toFixed(1)}°
        <span>{isStep && touched ? `（批前 ${previous?.toFixed(1)}°）` : " "}</span>
        <span> · <math><Sub base="P" index={slot} /></math> 上次写入 <math><Sub base="Θ" index={lastWrite} /></math>{hits[slot - 1] >= .65 ? " · 本轮命中" : ""}</span>
      </p>
    </div>
    <div className="p8-classifier">
      <svg viewBox="0 0 48 34" aria-hidden="true">
        <path d="M5 8H18 M5 17H18 M5 26H18 M29 8H43 M29 17H43 M29 26H43" />
        <rect x="17" y="3" width="14" height="28" rx="3" fill={isStep ? `rgba(57, 103, 70, ${.15 + .32 * write})` : "#dce8d5"} />
      </svg>
      <strong>共享分类器</strong><math><mi>φ</mi><mo>·</mo><Sub base="Θ" index={version} /></math>
    </div>
  </div>;
}


const passes = [1, 3, 6, 8].map(index => {
  const stage = P8_STAGES[index];
  const inference = stage.kind === "inference";
  return {
    stage, inference,
    begin: timeline[index].start,
    forwardEnd: inference ? 23220 : timeline[index + 1].start,
    end: inference ? duration + 1 : timeline[index + 2].start,
    samples: stage.query ? [stage.query] : stage.batch?.samples ?? [],
  };
});
const stations = [77, 252, 424, 599, 774] as const;
const leaf = "#396746";
const blue = "#315d73";
const ochre = "#775023";

function passPresence(pass: typeof passes[number], time: number) {
  const enter = arrive(time, pass.begin, pass.begin + 340);
  return pass.inference ? enter : enter * (1 - arrive(time, pass.end - 480, pass.end));
}

function RunProcess({ stage, time }: { stage: RunStage; time: number }) {
  const test = arrive(time, timeline[8].start, timeline[8].start + 450);
  const returnCurve: MotionCurve = [{x:774,y:58},{x:774,y:157},{x:596,y:151},{x:473,y:151}];
  return <section className="p8-process" aria-label={stage.kind === "inference" ? "推断分支" : "当前数据与运算"} data-mode={stage.kind}>
    <svg className="p8-process-scene" viewBox="0 0 860 185" role="img" aria-label="样本连续经过 Query、Key 检索与分类。训练批次沿下方路径写回，测试输出预测。">
      <path d="M77 57H774" className="p8-path-guide" />
      {["输入样本", "无 Prompt Query", "检索当前 Key", "带 Prompt 分类"].map((name, i) =>
        <text x={stations[i]} y="28" textAnchor="middle" className="p8-path-label" key={name}>{name}</text>)}
      <text x={stations[4]} y="28" textAnchor="middle" className="p8-path-label" opacity={1 - test}>联合损失</text>
      <text x={stations[4]} y="28" textAnchor="middle" className="p8-path-label" opacity={test}>预测 <tspan className="p8-svg-math">ŷ</tspan></text>
      {stations.map(x => <circle key={x} cx={x} cy="57" r="5" fill="#dce8d5" stroke="#94ad98" />)}

      {passes.map(pass => {
        const visible = passPresence(pass, time);
        const completion = elapsed(time, pass.begin, pass.forwardEnd);
        const back = pass.inference ? 0 : elapsed(time, pass.forwardEnd + 80, pass.forwardEnd + (pass.end - pass.forwardEnd) * .43);
        const pathPresence = 1 - arrive(back, .09, .39);
        const ends = [0.2, 0.4, 0.62, 0.81, 0.96];
        return <g key={pass.stage.id} opacity={visible} data-run-trace={pass.stage.id}>
          {pass.samples.map(({sample, selected}, index) => {
            const y = pass.samples.length === 1 ? 57 : 51 + index * 13;
            const phase = elapsed(completion, index * .084, 1);
            const color = pass.inference ? leaf : index === 0 ? ochre : blue;
            const label = pass.inference ? "test" : sample.symbol.replace("x_", "");
            const offset = pass.samples.length > 1 ? index * 20 : 0;
            const x = stations.slice(1).reduce<number>((current, next, i) =>
              current + (next - stations[i]) * arrive(phase, .12 + .20 * i, .30 + .20 * i), stations[0] - 15 * (1 - arrive(phase, 0, .14)));
            return <g key={sample.id}>
              {stations.slice(1).map((next, i) => {
                const curve: MotionCurve = [{x:stations[i],y},{x:stations[i]+44,y},{x:next-44,y},{x:next,y}];
                const progress = arrive(phase, .12 + .2 * i, .30 + .2 * i);
                return <MotionTrace key={next} curve={curve} progress={progress} color={color}
                  opacity={pathPresence * arrive(progress, 0, .15) * (1 - arrive(progress, .94, 1))} />;
              })}
              <g data-sample-marker={sample.id} transform={`translate(${x} ${y})`} opacity={1 - arrive(back, .04, .40)}>
                <circle r="8" fill={color} stroke="#f5f7ef" strokeWidth="1.5" />
                <text y="3.7" textAnchor="middle" className="p8-sample-letter">{pass.inference ? "x" : label.slice(0, 1)}</text>
              </g>
              {[0, 1, 2, 3, 4].map(i => <text key={i} x={stations[i]} y={85 + offset} textAnchor="middle"
                opacity={arrive(phase, ends[i] - .08, ends[i]) * (i === 4 ? 1 - .6 * back : 1)}
                className="p8-path-data">
                {i === 0 && (sample.label && !pass.inference
                  ? <><tspan className="p8-svg-math">x</tspan><tspan className="p8-svg-math" fontSize=".75em" baselineShift="sub">{label}</tspan><tspan> · </tspan><tspan className="p8-svg-math">y</tspan><tspan className="p8-svg-math" fontSize=".75em" baselineShift="sub">{label}</tspan></>
                  : "无标签 · 无任务 ID")}
                {i === 1 && <><tspan className="p8-svg-math">q</tspan><tspan className="p8-svg-math" fontSize=".75em" baselineShift="sub">{label}</tspan><tspan> · {sample.angleDegrees}°</tspan></>}
                {i === 2 && selected.join(" · ")}
                {i === 3 && "Prompt 输出 → Logits"}
                {i === 4 && (pass.inference ? "最大分数类别" : "分类 + 匹配")}
              </text>)}
            </g>;
          })}
          {!pass.inference && <g opacity={arrive(back, 0, .24)}>
            <MotionTrace curve={returnCurve} progress={back} color={leaf} />
            <rect x="362" y="137" width="111" height="28" rx="4" fill="#dce8d5" stroke="#91ab92" opacity={arrive(back,.65,1)} />
            <text x="418" y="155" textAnchor="middle" className="p8-path-label" opacity={arrive(back,.65,1)}>批末写回</text>
          </g>}
        </g>;
      })}
    </svg>
  </section>;
}



export function ContinualRun() {
  const playback = useLessonPlayback(duration);
  const [slot, setSlot] = useState(3);
  const phase = timeline.reduce((active, item, index) => item.start <= playback.position ? index : active, 0);
  const stage = P8_STAGES[phase];
  const { start } = timeline[phase];
  const end = timeline[phase + 1]?.start ?? duration;
  const local = (playback.position - start) / (end - start);
  const batch = stage.batch;
  const isStep = stage.kind === "step" && batch !== null;
  const write = isStep ? arrive(local, .43, .83) : 0;
  const writing = isStep && local < .83;
  const version = stage.parameterVersion - Number(writing);
  const cursor = writing ? version + arrive(local, .56, .83) : version;
  const angles = isStep ? interpolateKeyAngles(batch.startAngles, batch.endAngles, write) : stage.angles;
  const hits = angles.map((_, i) => Math.max(0, ...passes.map(pass => {
    const hit = pass.samples.some(sample => sample.selected.includes(i + 1));
    const searchStart = pass.begin + (pass.forwardEnd - pass.begin) * .43;
    return hit ? passPresence(pass, playback.position) * arrive(playback.position, searchStart, searchStart + 480) : 0;
  })));
  const note = writing
    ? "先汇总损失和梯度，再写回当前这一个批次。状态到达下一版本后才供下一批读取。"
    : stage.note;

  return <>
    <p className="lesson-lead">P7 解释了一批数据如何完成一次更新。在持续学习中，这次更新的结果还要交给下一批，甚至交给另一个任务。模型用的是一套持续保存的参数，当前样本只决定这一轮会用到其中哪些槽位。</p>
    <section className="explain-section">
      <h3>起点只<span className="editorial-key">初始化一次</span></h3>
      <p>将预训练 ViT 的<span className="lesson-key lesson-term--object">嵌入层和 Transformer</span>固定下来，并初始化 Key Pool、Prompt Pool 与共享分类器。把这三个可学习部分的<Term id="parameter-state">参数状态</Term>记为 <math><Sub base="Θ" index="0" /><mo>=</mo><mo>(</mo><mi>K</mi><mo>,</mo><mi>P</mi><mo>,</mo><mi>φ</mi><mo>)</mo></math>。同一个槽位上的 Key 用于检索，Prompt 用于分类。槽位的编号贯穿整个训练与测试。</p>
    </section>
    <section className="explain-section">
      <h3>每批读取当前版本，批末交出新版本</h3>
      <p>Task 1 的第一批沿用 P5 的 A、B。两者各自提取 Query、检索并带 Prompt 分类，计算联合损失后一起写回。看下方版本标记从 <math><Sub base="Θ" index="0" /></math> 移到 <math><Sub base="Θ" index="1" /></math> 时，池和分类器的位置与身份都保持固定。<span className="lesson-key">第二批读取 <math><Sub base="Θ" index="1" /></math></span>，再用自己的 Query 在更新后的 Key 上排名。</p>
    </section>

    <figure className="lesson-figure guided-motion p8-continuous-figure">
      <div className="motion-dock p8-control-dock">
        <div className="p8-stage-stops" role="group" aria-label="持续学习时间线">
          {sections.map(section => <div className="p8-time-group" key={section.label}>
            <span>{section.label}</span>
            {timeline.slice(section.first, section.end).map((event, offset) => {
              const index = section.first + offset;
              return <button type="button" className="lesson-choice" key={event.start} aria-pressed={index === phase} data-run-event={index}
                onClick={() => playback.playSegment(event.start, event.seek)}>{event.label}</button>;
            })}
          </div>)}
        </div>
        <PlaybackControls playback={playback} label="运行进度" />
        <span className="motion-pan-hint">横向滑动查看完整流程</span>
      </div>
      <div className="motion-window p8-scene-window">
        <VersionRail cursor={cursor} version={version} />
        <SharedModel stage={stage} angles={angles} slot={slot} setSlot={setSlot} hits={hits} write={write} version={version} />
        <RunProcess stage={stage} time={playback.position} />
      </div>
      <figcaption aria-live="polite">{note}</figcaption>
    </figure>
    <P8StateLedger />

    <section className="explain-section">
      <h3>任务交接切换数据，模型继承 <math><Sub base="Θ" index="2" /></math></h3>
      <p>Task 1 的第二批写回 <math><Sub base="Θ" index="2" /></math> 后，Task 1 的数据退出。基础 L2P 直接用继承下来的 <span className="lesson-key">同一套 Key、Prompt 和分类器</span>处理 Task 2 的第一批，新的 Query 在原池里重新选槽位。这个批次完成后，最新状态变为 <math><Sub base="Θ" index="3" /></math>。</p>
    </section>
    <section className="explain-section">
      <h3>测试只做检索与分类</h3>
      <p><Term id="l2p-inference">无任务 ID 推断</Term>只接收图像，没有标签。模型用 <math><Sub base="Θ" index="3" /></math> 按式 (3) 做普通 Key 距离检索，再取配对 Prompt 做分类前向，最后选出分数最高的类别。此时画面里只剩这条前向路径，损失、反向和优化器都退出，<span className="lesson-key"><math><Sub base="Θ" index="3" /></math> 保持固定</span>。</p>
    </section>
    <P8TrainInferMap />
    <section className="explain-section p8-pseudocode">
      <h3>Algorithm 1 中，循环层级决定<span className="editorial-key">写回时机</span></h3>
      <p>在有任务边界的协议中，每个任务可多轮遍历当前数据，每一轮包含多个批次。样本逐个产生选集与损失，选集取并集，损失累积到整批再反向。参数因此可以跨 <Term id="epoch">Epoch</Term> 和任务持续保存。</p>
      <P8AlgorithmGuide />
      <p>在无明确任务边界的 task-agnostic 设置里，基础方法随数据到达逐批更新。基础 L2P 无需旧样本回放，L2P-R 是加入回放缓存的实验变体。</p>
    </section>
    <p className="lesson-takeaway">同一个槽位可被多个任务中的样本选中。P9 将比较可选的历史频率策略，并用论文的选择分布、消融和主实验观察共享实际发生了多少。</p>
  </>;
}
