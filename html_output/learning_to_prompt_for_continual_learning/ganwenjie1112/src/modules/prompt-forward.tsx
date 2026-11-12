import { P6PoolingTrace } from "./p6-pooling-trace";
import { Term } from "../shared/core/reference/ReferenceHub";

import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { Sub } from "./lesson-math";
import { promptPoolConfig as config } from "./prompt-retrieval-data";
import {
  P6_IMAGE_CLS_SEQUENCE_INDEX, P6_LAST_PATCH_SEQUENCE_INDEX, P6_PROMPT_TOKEN_COUNT,
  P6_PROMPT_TOKEN_MAP, P6_SELECTED_PROMPT_INDICES, P6_SEQUENCE_LENGTH,
} from "./prompt-forward-data";
import { arrive, blend, curvePosition, DiagramParameter, MotionTrace, type MotionCurve } from "./guided-motion";
import { P6CallMap, P6SequenceRuler } from "./p6-reading-cards";
import "./guided-motion.css";
import "./prompt-forward.css";

const stops = [
  { start: 0, time: 0, label: "从池中读取", note: "看上方五组 Prompt。编号沿用 P5 的检索顺序，配对 Key 留在池中。" },
  { start: 600, time: 3060, label: "拼成输入", note: "每组的五个位置依次展开，图像 [CLS] 与 Patch 接在同一行的后面。" },
  { start: 3300, time: 5750, label: "经过编码器", note: "沿同一列向下看。所有 Token 一起经过冻结 Transformer，位置不变，内容已融合上下文。" },
  { start: 6100, time: 9700, label: "取出并平均", note: `蓝色图像输出留在原位。只汇聚前 ${P6_PROMPT_TOKEN_COUNT} 个 Prompt 输出，逐维求平均。` },
  { start: 9950, time: 13600, label: "生成类别分数", note: `平均向量 h 保留 ${config.featureWidth} 维。沿绿色路径进入共享分类器，得到类别分数。` },
] as const;
const duration = 13600;
const leaf = "#396746";
const blue = "#315d73";
const sceneWidth = 860;
const sceneCenter = sceneWidth / 2;
const railInset = 34;
const railWidth = sceneWidth - 2 * railInset;
const encoderLabelWidth = 228;
const promptStart = 45;
const patchWidth = 12;
const lastPatchOffset = 247;
const imageStart = sceneWidth - promptStart - lastPatchOffset - patchWidth;
const patchOffsets = [65, 94, 123, lastPatchOffset];
const poolY = 304;
const sourceX = (group: number, token: number) => promptStart + group * 96 + token * 8.8;
const rowX = (group: number, token: number) => promptStart + group * 99 + token * 13;

function ForwardScene({ time }: { time: number }) {
  const encode = arrive(time, 3470, 5500);
  const context = arrive(time, 4190, 5030);
  const read = arrive(time, 6100, 6670);
  const pooled = arrive(time, 8810, 9650);
  const classify = arrive(time, 10150, 11850);
  const rowY = blend(116, 220, encode);
  const imageJoin = arrive(time, 1810, 2920);
  const imageY = blend(72, rowY, imageJoin);
  const flow: MotionCurve = [{x: sceneCenter, y: poolY}, {x: 486, y: poolY}, {x: 592, y: poolY}, {x: 641, y: poolY}];
  const vector = curvePosition(flow, classify);
  const encoderFocus = arrive(time, 3160, 3640) * (1 - arrive(time, 5370, 5930));
  const shelf = 1 - .67 * arrive(time, 2100, 3080);

  return <svg className="p6-scene" viewBox={`0 0 ${sceneWidth} 344`} role="img"
    aria-label="追踪选中的 Prompt Token 及图像 Token，经冻结编码器后仅汇聚 Prompt 输出。">
    <g opacity={shelf}>
      <text x={promptStart} y="28" className="p6-label">池中配对 · Query A</text>
      {P6_SELECTED_PROMPT_INDICES.map((id, i) => <text key={id} x={sourceX(i, 2) + 3.5} y="53" textAnchor="middle" className="p6-symbol">
        <DiagramParameter symbol="k" index={id} />
      </text>)}
      <text x={imageStart} y="28" className="p6-label">图像嵌入 xₑ</text>
      <text x={imageStart} y="48">[CLS] + {config.imageLength - 1} 个 Patch</text>
    </g>

    <g opacity={arrive(time, 810, 1870) * (1 - .7 * encode)}>
      <path d={`M${railInset} 132h${railWidth}`} className="p6-guide" />
      <text x={sceneCenter} y="104" textAnchor="middle" opacity={arrive(time, 2610, 3080)}>
        输入 xₚ · {P6_PROMPT_TOKEN_COUNT} + {config.imageLength} = {P6_SEQUENCE_LENGTH} 个位置
      </text>
    </g>
    <rect className="p6-encoder-rail" x={railInset} y="145" width={railWidth} height="43" rx="8" fill="#e6ede3" stroke="#acbeac" />
    <rect x={railInset} y="145" width={railWidth} height="43" rx="8" fill="#c8dcc9" opacity={.65 * encoderFocus} />
    <path d={`M${railInset + 12} 157h${railWidth - 24} M${railInset + 12} 176h${railWidth - 24}`} className="p6-guide" />
    <foreignObject x={sceneCenter - encoderLabelWidth / 2} y="151" width={encoderLabelWidth} height="31" opacity={1 - .76 * encoderFocus}>
      <div className="p6-encoder-label">
        <svg viewBox="0 0 16 18" aria-hidden="true">
          <path d="M4 7V5a4 4 0 0 1 8 0v2M2 7h12v9H2z" fill="none" stroke="currentColor" />
        </svg>
        <span>冻结 Transformer · <math><Sub base="f" index="r" /></math></span>
      </div>
    </foreignObject>

    {P6_PROMPT_TOKEN_MAP.map(({promptIndex, promptOrdinal: group, tokenIndex: token, sequenceIndex}) => {
      const join = arrive(time, 770 + group * 231 + token * 48, 1780 + group * 231 + token * 48);
      const x = blend(sourceX(group, token), rowX(group, token), join);
      const y = blend(78, rowY, join);
      const dispatch = arrive(time, 6640 + sequenceIndex * 32, 8300 + sequenceIndex * 32);
      const endX = sceneCenter - 16.5 + token * 6;
      const route: MotionCurve = [{x, y}, {x, y: 263}, {x: endX, y: 269}, {x: endX, y: poolY}];
      const contribution = curvePosition(route, dispatch);
      return <g key={sequenceIndex} data-position={sequenceIndex}>
        <rect x={x} y={y - 9} width={blend(7, 10, join)} height="18" rx="2"
          fill="#b8cda9" stroke="#6f9475" opacity={1 - .54 * dispatch} />
        <path d={`M${x + 2} ${y - 3}h6m-6 4h4m-4 4h5`} stroke={leaf} opacity={context * (1 - .62 * dispatch)} />
        {token === 2 && <text x={x + blend(3.5, 5, join)} y={y + blend(26, -14, encode)} textAnchor="middle"
          className="p6-symbol" opacity={1 - .86 * encoderFocus}>
          <DiagramParameter symbol="P" index={promptIndex} />
        </text>}
        <rect data-read-position={sequenceIndex} x={contribution.x} y={contribution.y - 8} width="9" height="16" rx="2"
          fill="#a4c0a3" stroke={leaf} opacity={read * arrive(dispatch, 0, .15) * (1 - pooled)} />
      </g>;
    })}
    <g transform={`translate(${imageStart} ${imageY})`} opacity={1 - .36 * read}>
      <rect y="-9" width="49" height="18" rx="3" fill="#dce9ed" stroke="#7e9da9" />
      <text x="24.5" y="4" textAnchor="middle" className="p6-token-label">[CLS]</text>
      {patchOffsets.map(offset => <g key={offset}>
        <rect x={offset} y="-9" width={patchWidth} height="18" rx="2" fill="#abc7cf" stroke="#7e9da9" />
        <path d={`M${offset + 3} -3h6m-6 4h4m-4 4h5`} stroke={blue} opacity={context} />
      </g>)}
      <text x="188" y="4" textAnchor="middle">…</text>
    </g>

    <g opacity={arrive(time, 5430, 5790)}>
      <path d="M42 259v5h465v-5 M552 259v5h267v-5" className="p6-guide" />
      <path d="M42 259v5h465v-5" stroke={leaf} strokeWidth="2" fill="none" opacity={read} />
      <text x={promptStart} y="281" className="p6-label">H · Prompt 位置 0–{P6_PROMPT_TOKEN_COUNT - 1}</text>
      <text x="686" y="281" textAnchor="middle">图像位置 {P6_IMAGE_CLS_SEQUENCE_INDEX}–{P6_LAST_PATCH_SEQUENCE_INDEX}</text>
    </g>
    <g opacity={read}>
      <text x={promptStart} y="312" className="p6-label">AvgPool</text>
      <text x="117" y="312">逐维相加 ÷ {P6_PROMPT_TOKEN_COUNT}</text>
    </g>
    <MotionTrace curve={flow} progress={classify} color={leaf} opacity={arrive(time, 9880, 10270)} />
    <g transform={`translate(${vector.x} ${poolY})`} opacity={pooled}>
      <rect x="-23" y="-12" width="46" height="24" rx="4" fill="#c4d8bd" stroke={leaf} />
      <path d="M-15 -4h9m-9 4h6m-6 4h9" stroke={leaf} />
      <text x="8" y="5" className="p6-label">h</text>
    </g>
    <g opacity={arrive(time, 11300, 12100)}>
      <rect x="667" y="291" width="91" height="27" rx="4" fill="#dce8d5" stroke="#81a186" />
      <text x="712" y="309" textAnchor="middle" className="p6-label">分类器 gφ</text>
    </g>
    <g opacity={arrive(time, 11850, 12600)}>
      <path d="M758 304h17m-4-4 4 4-4 4" stroke={leaf} fill="none" />
      <text x="786" y="309" className="p6-label">Logits z</text>
    </g>
  </svg>;
}

export function PromptForward() {
  const playback = useLessonPlayback(duration);
  const stop = stops.reduce((active, candidate) => candidate.start <= playback.position ? candidate : active, stops[0]);
  return <>
    <p className="lesson-lead">上一页为图像 A 找到了 {P6_SELECTED_PROMPT_INDICES.map(id => `P${id}`).join("、")}。这些是池中已经学到的向量组。要得到类别分数，还要把它们交给 ViT，让每个 Prompt 位置吸收当前图像的信息。</p>

    <section className="explain-section">
      <h3>同一组冻结权重，<span className="editorial-key">两次调用</span></h3>
      <p>检索时，ViT 先单独处理图像，从 <code>[CLS]</code> 位置得到 Query，再用它与外部 Key 比较。拿到索引之后，分类调用重新使用<span className="lesson-key lesson-term--object">同一组冻结权重</span>，输入现在包括选中的 Prompt。Key 留在池中，Query 已经完成寻址。</p>
      <P6CallMap />
    </section>

    <section className="explain-section">
      <h3>沿序列方向，把 Prompt 接到图像前面</h3>
      <p>P2 的图像嵌入 <math><Sub base="x" index="e" /><mo>=</mo><Sub base="f" index="e" /><mo>(</mo><mi>x</mi><mo>)</mo></math> 已经包含 [CLS] 和 {config.imageLength - 1} 个 Patch。每组选中的 Prompt 含 <math><Sub base="L" index="p" /><mo>=</mo><mn>{config.promptLength}</mn></math> 个 Token。播放时可以看见各组依 P5 的顺序展开，做<Term id="prompt-prefix">序列前置拼接</Term>，随后整条序列穿过冻结编码器。</p>
      <div className="guided-equations p6-equation"><math display="block">
        <Sub base="x" index="p" /><mo>=</mo><mo>[</mo><Sub base="P" index="s₁" /><mo>;</mo><mo>…</mo><mo>;</mo><Sub base="P" index="sₙ" /><mo>;</mo><Sub base="x" index="e" /><mo>]</mo>
      </math></div>
    </section>

    <figure className="lesson-figure guided-motion p6-forward-figure">
      <div className="motion-dock p6-control-dock">
        <div className="motion-stops" role="group" aria-label="分类前向阶段">
          {stops.map(item => <button type="button" className="lesson-choice" key={item.time} aria-pressed={item === stop}
            onClick={() => playback.playSegment(item.start, item.time)}>{item.label}</button>)}
        </div>
        <PlaybackControls playback={playback} label="分类进度" />
        <span className="motion-pan-hint">横向滑动查看完整过程</span>
      </div>
      <div className="motion-window p6-scene-scroll" tabIndex={0} role="region" aria-label="Token 装配、编码与读出图">
        <ForwardScene time={playback.position} />
      </div>
      <figcaption aria-live="polite">{stop.note}</figcaption>
    </figure>

    <section className="explain-section" id="p6-readout">
      <h3>从编码后的 Prompt 位置读出类别特征</h3>
      <p>冻结 Transformer 计算 <math><mi>H</mi><mo>=</mo><Sub base="f" index="r" /><mo>(</mo><Sub base="x" index="p" /><mo>)</mo></math> 时，扩展序列的全部位置参与上下文计算。行号一一对应，向量内容已经改变，因此开头 {P6_PROMPT_TOKEN_COUNT} 个 <span className="lesson-key lesson-term--value"><Term id="prompt-readout">Prompt 输出位置</Term></span>现在带有图像信息。图像的 [CLS] 与 Patch 输出仍在 H 中，它们从位置 {P6_IMAGE_CLS_SEQUENCE_INDEX} 开始。</p>
      <P6PoolingTrace />
      <p>L2P 对开头 <math><mi>N</mi><Sub base="L" index="p" /></math> 行做<Term id="prompt-pooling">平均池化</Term>。每一维独立相加并除以位置数，结果 <math><mi>h</mi></math> 仍为 {config.featureWidth} 维。共享分类器由它得到各类别的 <Term id="logits">Logits</Term>，最高分所在的类别就是本次预测。</p>
      <div className="guided-equations p6-equation"><math display="block">
        <Sub base="h" index="d" /><mo>=</mo><mfrac><mn>1</mn><mrow><mi>N</mi><Sub base="L" index="p" /></mrow></mfrac>
        <munderover><mo>∑</mo><mrow><mi>r</mi><mo>=</mo><mn>0</mn></mrow><mrow><mi>N</mi><Sub base="L" index="p" /><mo>−</mo><mn>1</mn></mrow></munderover>
        <Sub base="H" index="r,d" />
      </math><math display="block"><mi>z</mi><mo>=</mo><Sub base="g" index="φ" /><mo>(</mo><mi>h</mi><mo>)</mo></math></div>
    </section>
    <section className="explain-section">
      <h3>拼接改变位置数，特征宽度保持不变</h3>
      <p>池容量 <math><mi>M</mi><mo>=</mo><mn>{config.poolSize}</mn></math> 给出候选组数，本次只读 <math><mi>N</mi><mo>=</mo><mn>{P6_SELECTED_PROMPT_INDICES.length}</mn></math> 组。它们贡献 <span className="lesson-key lesson-key--type">{P6_PROMPT_TOKEN_COUNT} 个位置</span>，与 {config.imageLength} 个图像位置合为 {P6_SEQUENCE_LENGTH} 个位置。输入与输出的每一行都保持 <math><mi>D</mi><mo>=</mo><mn>{config.featureWidth}</mn></math> 维。</p>
      <P6SequenceRuler />
    </section>
    <p className="lesson-takeaway">有了类别分数，就能用训练标签衡量预测误差。下一页追踪这个误差怎样训练 Prompt 与分类器，以及检索 Key 从哪里获得自己的学习信号。</p>
  </>;
}
