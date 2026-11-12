import { P4ParameterGuide } from "./reading-guides";
import { P4Rerun } from "./p4-rerun";
import { P4SharedPrompt } from "./p4-shared-prompt";
import { useLessonPlayback, PlaybackControls } from "./lesson-playback";
import { Term } from "../shared/core/reference/ReferenceHub";
import { P4_TOY_EXPERIMENT as experiment, P4_TRAINING_TRACE as trace } from "./prompt-tuning-demo";
import "./prompt-tuning.css";

type Pair = readonly [number, number];

const stops = [
  { at: 0, label: "组装输入", hint: "紫色 Prompt 与图像 Token 一起进入冻结 Attention。" },
  { at: 2300, label: "前向", hint: "观察 P₀ 如何汇合四个位置的信息，再与 P₁ 的输出一起形成读出。" },
  { at: 6600, label: "计算损失", hint: "分类头读取 h；交叉熵把预测与固定标签 y = 1 对照。" },
  { at: 8800, label: "反向传播", hint: "虚线逆着前向路径展开。梯度经过冻结运算，抵达 Prompt；分类头也获得梯度。" },
  { at: 12800, label: "更新一次", hint: "跟踪向量分量和分类头偏置的位移。中间画面只是一次写回的过渡。" },
  { at: 15300, label: "同图复算", hint: "用更新后的 Prompt 与分类头重跑前向，对照同一图像和标签的损失。" },
];
const duration = 21100;
const number = (value: number) => value.toFixed(3);
const pairText = (pair: Pair) => '[' + pair.map(number).join(', ') + ']';
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const mix = (start: number, end: number, amount: number) => start + (end - start) * amount;
const mixPair = (start: Pair, end: Pair, amount: number): Pair =>
  [mix(start[0], end[0], amount), mix(start[1], end[1], amount)];

function PairBars({ values, name }: { values: Pair; name: string }) {
  return <div className="p4-vector" aria-label={name + " " + pairText(values)}>
    <strong>{name}</strong>
    <div className="p4-components">
      {values.map((value, coordinate) => <div key={coordinate}>
        <span className="p4-axis" aria-hidden="true"><i style={{
          transform: `scaleX(${Math.abs(value)})`,
          [value < 0 ? "right" : "left"]: "50%",
          transformOrigin: value < 0 ? "right" : "left",
        }} /></span>
        <span>{number(value)}</span>
      </div>)}
    </div>
  </div>;
}

function Edge({ forward, backward }: { forward: number; backward: number }) {
  return <div className="p4-edge" aria-hidden="true">
    <span className="p4-edge-base" />
    <span className="p4-edge-forward" style={{ transform: `scaleX(${forward})` }} />
    <span className="p4-edge-backward" style={{ transform: `scaleX(${backward})` }} />
  </div>;
}

function TrainingStage({ position, phase }: { position: number; phase: number }) {
  const elapsed = position - stops[phase].at;
  const revised = phase === 5;
  const write = phase === 4 ? clamp(elapsed / 1800) : revised ? 1 : 0;
  const prompt = experiment.prompt.map((pair, row) => mixPair(pair, trace.updatedPrompt[row], write));
  const bias = mix(experiment.classifier.bias[1], trace.updatedClassifierBias[1], write);
  const state = revised ? trace.updated : trace.initial;
  const forward = phase === 1 || revised ? elapsed : phase >= 2 ? Infinity : 0;
  const reverse = phase === 3 ? elapsed : phase === 4 ? Infinity : 0;
  const edge = (offset: number) => clamp((forward - offset) / 850);
  const gradient = (offset: number) => clamp((reverse - offset) / 800);
  const attention = clamp((forward - 850) / 900);
  const readoutReady = forward >= 3000;
  const lossReady = revised ? forward >= 3950 : phase > 2 || (phase === 2 && elapsed >= 650);
  const version = write === 1 ? "写回完成 · 1 步" : phase === 4 ? "正在写回 · 1 步" : "初始参数";

  return <div className="p4-stage" data-phase={phase} data-updates={write === 1 ? 1 : 0}>
    <div className="p4-training-path">
      <section className="p4-node p4-input" data-active={phase === 0 || phase === 4 || reverse >= 2700}>
        <h4>输入序列</h4>
        <div className="p4-prompt-group">
          <span>可学习 Prompt · P</span>
          <PairBars name="P₀" values={prompt[0]} />
          <PairBars name="P₁" values={prompt[1]} />
        </div>
        <div className="p4-image-group"><span>固定图像 Token</span><strong>x₀</strong><strong>x₁</strong></div>
      </section>
      <Edge forward={edge(0)} backward={gradient(1900)} />
      <section className="p4-node p4-frozen" data-active={forward >= 850 && forward < 2150 || reverse >= 1050 && reverse < 2700}>
        <h4>冻结 Attention</h4>
        <span className="p4-frozen-status">权重固定 · 梯度可通过</span>
        <div className="p4-attention">
          <strong>Q₀ 对四个位置的权重</strong>
          <div className="p4-attention-strip" aria-label="P₀ 的 Attention 权重">
            {state.firstPromptAttention.map((weight, index) => <div key={index} style={{ flexGrow: weight }}>
              <span><i style={{ transform: `scaleY(${attention})` }} /></span>
              <strong>{["P₀", "P₁", "x₀", "x₁"][index]}</strong>
            </div>)}
          </div>
        </div>
      </section>
      <Edge forward={edge(2150)} backward={gradient(950)} />
      <section className="p4-node p4-readout" data-active={readoutReady && (phase === 1 || revised)}>
        <h4>Prompt 位置读出</h4>
        <strong className="p4-pooling"><math><msub><mi>H</mi><mn>0</mn></msub><mo>+</mo><msub><mi>H</mi><mn>1</mn></msub></math> → 均值 <math><mi>h</mi></math></strong>
        <span className="p4-value">{readoutReady ? pairText(state.promptReadout) : "等待读出"}</span>
        <span>按坐标平均</span>
      </section>
      <Edge forward={edge(3100)} backward={gradient(0)} />
      <section className="p4-node p4-loss" data-active={phase === 2 || phase === 4 || lossReady && revised}>
        <h4>分类头与损失</h4>
        <span>φ 的偏置 b₁ <strong className="p4-value">{number(bias)}</strong></span>
        <span>{phase === 4 ? "上次交叉熵" : "分类交叉熵"} · y = {experiment.label}</span>
        <strong className="p4-loss-value">{lossReady ? number(state.loss) : "待计算"}</strong>
        <span className="p4-value">p(y) {lossReady ? number(state.probabilities[experiment.label]) : "待计算"}</span>
      </section>
    </div>
    <div className="p4-stage-foot">
      <strong>{version}</strong>
      <span>{phase === 3 && reverse >= 2700
        ? "∇P₀ = " + pairText(trace.promptGradients[0]) + "，φ 获得梯度"
        : "写回范围 · Prompt P 与分类头 φ"}</span>
    </div>
  </div>;
}


export function PromptTuning() {
  const playback = useLessonPlayback(duration);
  const next = stops.findIndex(stop => stop.at > playback.position);
  const phase = next === -1 ? stops.length - 1 : next - 1;
  return <>
    <p className="lesson-lead">P3 让一组不同的 Token 穿过同一个冻结 Transformer，输出随输入改变。现在把这个现象变成训练办法：如果额外的 Token 可以根据分类误差调整，冻结主干也能适应新任务。这就是 <Term id="prompt-tuning">Prompt Tuning</Term>。</p>

    <section className="explain-section">
      <h3>把可学习参数放在<span className="editorial-key">输入端</span></h3>
      <p>从图像得到的 Token 随图像改变。Prompt 则是<span className="lesson-key lesson-term--value">可训练的输入向量</span>，同一组参数可以与不同图像拼接。每个 <Term id="prompt-token">Prompt Token</Term> 的宽度与图像 Token 相同，因此它们能一起参与 P3 的注意力计算。</p>
      <div className="p4-input-equation">
        <math><mi>P</mi><mo>∈</mo><msup><mi>ℝ</mi><mrow><msub><mi>L</mi><mi>p</mi></msub><mo>×</mo><mi>D</mi></mrow></msup></math>
        <math><msub><mi>x</mi><mi>p</mi></msub><mo>=</mo><mo>[</mo><mi>P</mi><mo>;</mo><msub><mi>x</mi><mi>e</mi></msub><mo>]</mo></math>
        <span>沿序列轴拼接，向量宽度 D 相同</span>
      </div>
      <p>下面固定一张图像和一个标签，用两个二维 Prompt Token 和单头 Attention 追踪一次更新。前向时先看紫色的 P₀ 怎样读取四个位置，再看两个 Prompt 输出怎样汇成分类特征 h。</p>
    </section>

    <section className="explain-section">
      <h3>用分类误差找到该改的参数</h3>
      <p>分类头读取 h 并给每个类别打分，交叉熵把分数和标签联系起来。<Term id="gradient-flow">梯度回传</Term>沿着这些依赖回溯：冻结的运算仍会<span className="lesson-key">把梯度传到输入端</span>，因此 P 和分类头 φ 都能获得梯度。优化器只写回这两处，主干权重继续参与前向并保持原值。</p>
      <P4ParameterGuide />
    </section>

    <figure className="lesson-figure p4-training-figure">
      <div className="figure-top"><strong>从一次预测到同图复算</strong></div>
      <div className="figure-body">
        <div className="p4-control-dock">
          <div className="motion-stops p4-phase-list" role="group" aria-label="训练阶段">
            {stops.map((stop, index) => <button key={stop.label} type="button" className="lesson-choice"
              aria-pressed={index === phase} onClick={() => playback.seek(stop.at + [0, 1740, 1000, 2300, 900, 4400][index])}>
              {stop.label}
            </button>)}
          </div>
          <PlaybackControls playback={playback} label="训练进度" />
        </div>
        <p className="p4-observation" aria-live="polite">{stops[phase].hint}</p>
        <TrainingStage position={playback.position} phase={phase} />
      </div>
      <figcaption>实线沿前向依赖展开。暖色虚线沿同一条路径反向回传梯度。</figcaption>
    </figure>

    <section className="explain-section">
      <h3>只换 Prompt，预测也会<span className="editorial-key">改变</span>吗？</h3>
      <p>刚才同一步 SGD 更新了 Prompt 和分类头。为了分清是谁改变了输出，我们额外复算一次：先只换成更新后的 <span className="lesson-key lesson-term--value">Prompt</span>，分类头仍用原来的参数。三次都用同一组图像 Token、同一个标签和同一套冻结主干。</p>
      <P4Rerun />
    </section>

    <section className="explain-section">
      <h3>下一批任务还要共用这组 Prompt 吗？</h3>
      <p>这一轮改写对当前标签有利。若任务 B 继续更新同一组 Prompt，任务 A 的输入也会读到改写后的值，原有表示可能随之变化。</p>
      <P4SharedPrompt />
      <p>P5 将用一个 Prompt 池提供多组候选，再让每张图像自己决定取哪几组。</p>
    </section>
  </>;
}
