import { P5RankGuide } from "./reading-guides";
import { QueryOverlap } from "./p5-pool-overlap";
import { Term } from "../shared/core/reference/ReferenceHub";
import { useState } from "react";
import { PlaybackControls, useLessonPlayback } from "./lesson-playback";
import { Specimen } from "./specimen";
import { buildSelectionSnapshot, promptPoolConfig, type QueryId } from "./prompt-retrieval-data";
import {
  CandidateBars, IndexedMath, PromptShelf, PromptTokens, VectorSpace, clamp01, eased,
} from "./prompt-retrieval-visuals";
import "./prompt-retrieval.css";

const snapshots = { A: buildSelectionSnapshot("A"), B: buildSelectionSnapshot("B") };
const { poolSize, topN, promptLength } = promptPoolConfig;
const compareStepMs = 1200;
const keyRevealMs = 260;
const angleMoveMs = 500;
const scanTravelMs = 180;
const finalScoreHoldMs = 800;
const scanDuration = poolSize * compareStepMs + finalScoreHoldMs;
const rankEnd = 4400;
const readStart = 5100;
const copyMs = 600;
const readDuration = readStart + copyMs * topN + 700;

function RetrievalFlowArrow() {
  return <svg className="flow-arrow" viewBox="0 0 120 18" preserveAspectRatio="none" aria-hidden="true">
    <path d="M2 9h116m-6-4 6 4-6 4" />
  </svg>;
}

export function PromptRetrieval() {
  const [query, setQuery] = useState<QueryId>("A");
  const [inspected, setInspected] = useState<number | null>(null);
  const scan = useLessonPlayback(scanDuration);
  const retrieval = useLessonPlayback(readDuration);
  const snapshot = snapshots[query];
  const candidateOffset = Math.min(poolSize - 1, Math.floor(scan.position / compareStepMs));
  const candidate = snapshot.candidates[inspected ?? candidateOffset];
  const stepTime = Math.max(0, scan.position - candidateOffset * compareStepMs);
  const nextCandidate = inspected === null ? snapshot.candidates[candidateOffset + 1] : undefined;
  const travelProgress = nextCandidate
    ? eased(clamp01((stepTime - (compareStepMs - scanTravelMs)) / scanTravelMs))
    : 0;
  const nextAngle = nextCandidate?.key.angleDegrees ?? candidate.key.angleDegrees;
  const scanAngleDegrees = inspected === null
    ? candidate.key.angleDegrees + (nextAngle - candidate.key.angleDegrees) * travelProgress
    : candidate.key.angleDegrees;
  const scanSweepDegrees = inspected === null
    ? scanAngleDegrees - snapshot.candidates[0].key.angleDegrees
    : 0;
  const keyProgress = inspected === null ? eased(clamp01(stepTime / keyRevealMs)) : 1;
  const angleProgress = inspected === null
    ? eased(clamp01((stepTime - keyRevealMs) / angleMoveMs))
    : 1;
  const computed = inspected === null ? candidateOffset + (angleProgress >= 1 ? 1 : 0) : 1;
  const hasScore = (index: number) => inspected === null ? index < computed : index === inspected;
  const scanControls = {
    ...scan,
    toggle() { setInspected(null); scan.toggle(); },
    seek(value: number) { setInspected(null); scan.seek(value); },
  };
  const sort = clamp01((retrieval.position - 900) / (rankEnd - 900));
  const read = Math.min(topN, Math.max(0, (retrieval.position - readStart) / copyMs));
  const rankHint = sort < 1 ? "观察同一个候选条怎样移动到它的距离名次。"
    : read < topN ? "按入选名次，从同编号槽位逐个读取 Prompt。"
    : "五组 Prompt 已备好，源池的十个槽位仍留在原处。";

  function chooseQuery(next: QueryId) {
    if (query === next) return;
    setQuery(next);
    setInspected(null);
    scan.seek(0);
    retrieval.seek(0);
  }

  return <div className="p5-lesson">
    <p className="lesson-lead">P4 中，两批任务若轮流改写同一个 Prompt，旧输入依赖的表示也可能跟着变。用<Term id="prompt-pool">Prompt 池</Term>存放多组候选，可以分担这种干扰，但测试时只给图像。L2P 要先解决一个问题：如何让图像自己找到合适的 Prompt？</p>

    <section className="explain-section p5-query-primer">
      <h3>用图像本身生成查询向量</h3>
      <p>先让原始图像走一遍不插入 Prompt 的冻结 ViT，再取末层的 <span className="lesson-key lesson-term--object">[CLS] 特征</span>作为<Term id="retrieval-query">检索 Query</Term>。这样，检索可以在选出 Prompt 之前完成，得到的向量用于找相近的 Key。分类要等选中的 Prompt 接入下一次前向。</p>
      <div className="p5-query-flow" role="group" aria-label="当前图像经不插入 Prompt 的冻结 ViT 生成 Query">
        <div className="p5-query-input"><Specimen /><strong>当前图像</strong></div>
        <RetrievalFlowArrow />
        <div className="p5-query-model"><strong>冻结 ViT</strong><span>原始图像序列</span></div>
        <RetrievalFlowArrow />
        <div className="p5-query-output"><strong>末层 [CLS] 特征</strong><math><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>[</mo><mn>0</mn><mo>,</mo><mo>:</mo><mo>]</mo></math></div>
      </div>
    </section>

    <section className="explain-section p5-pair-intro">
      <h3>用同一个下标把地址和内容配成一对</h3>
      <p>池中每个槽位存两个对象。<span className="lesson-key lesson-term--object"><Term id="pool-key">外部 Key</Term></span>负责被比较，配对的<span className="lesson-key lesson-term--value"> Prompt </span>负责进入模型。例如，若 Key 的编号是 j，读出的就是同槽位的 Prompt j。P3 的 Attention Key 则是在模型内部计算的，两者处于不同的运算阶段。</p>
      <div className="p5-slot-anatomy" role="group" aria-label="同槽位的检索 Key 与 Prompt">
        <div className="p5-slot-key"><strong>检索地址</strong><math><msub><mi>k</mi><mi>j</mi></msub></math><span>一条向量，参与距离比较</span></div>
        <div className="p5-slot-pair-link">同槽位 j</div>
        <div className="p5-slot-prompt"><strong>可取用的输入</strong><math><msub><mi>P</mi><mi>j</mi></msub></math><PromptTokens /><span>{promptLength} 个 Prompt Token</span></div>
      </div>
    </section>

    <section className="explain-section">
      <h3>固定 Query，逐个比较<span className="editorial-key">方向</span></h3>
      <p>先点选一个 Key，观察它与 Query 的夹角。方向越接近，余弦越接近 1，<Term id="cosine-distance">余弦距离</Term>就越小。再播放一次扫描：同一个 Query 保持方向，十个 Key 轮流接受同一条比较规则。下面用二维单位向量演示这一过程。</p>
      <div className="p5-query-controls" role="group" aria-label="切换两个输入的 Query">
        <strong>当前查询</strong>
        {(["A", "B"] as const).map(id => <button key={id} type="button" className="lesson-choice"
          aria-pressed={query === id} onClick={() => chooseQuery(id)}>
          查询 {id} · {snapshots[id].query.angleDegrees}°
        </button>)}
      </div>
      <figure className="lesson-figure p5-compare-figure">
        <div className="figure-top"><strong>每次只量一个夹角</strong></div>
        <div className="figure-body">
          <PlaybackControls playback={scanControls} label="比较进度" />
          <div className="p5-compare-grid" data-query={query} data-computed={computed}>
            <VectorSpace snapshot={snapshot} candidate={candidate} rayProgress={keyProgress} angleProgress={angleProgress}
              scanAngleDegrees={scanAngleDegrees} scanSweepDegrees={scanSweepDegrees} />
            <div className="p5-score">
              <div className="p5-score-pair"><span><IndexedMath base="q" index={query} /></span><span>与</span><span><IndexedMath base="k" index={candidate.index} /></span></div>
              <dl>
                <div><dt>夹角 θ</dt><dd>{angleProgress >= 1 ? `${candidate.thetaDegrees.toFixed(0)}°` : "—"}</dd></div>
                <div><dt>余弦 cos θ</dt><dd>{angleProgress >= 1 ? candidate.cosineSimilarity.toFixed(3) : "—"}</dd></div>
                <div><dt>余弦距离 γ</dt><dd>{angleProgress >= 1 ? candidate.distance.toFixed(3) : "—"}</dd></div>
              </dl>
              <div className="p5-scan-heading"><strong>候选 Key</strong><span>已比较 {computed}/{poolSize}</span></div>
              <div className="p5-scan-keys" role="group" aria-label="点选要比较的 Key">
                {snapshot.candidates.map((item, index) => <button type="button" key={item.index}
                  className="lesson-choice" aria-pressed={item === candidate} data-computed={hasScore(index)}
                  onClick={() => { scan.seek(0); setInspected(index); }}>
                  <IndexedMath base="k" index={item.index} />
                  <i aria-hidden="true" style={{ transform: `scaleX(${hasScore(index) ? item.distance / 2 : 0})` }} />
                </button>)}
              </div>
            </div>
          </div>
        </div>
        <figcaption className="p5-legend" aria-label="Query 与 Key 夹角图例">
          <span><i className="p5-legend-query" aria-hidden="true" /><strong>固定 Query</strong><small><IndexedMath base="q" index={query} /></small></span>
          <span><i className="p5-legend-key" aria-hidden="true" /><strong>当前比较</strong><small><IndexedMath base="k" index={candidate.index} /></small></span>
          <span><i className="p5-legend-candidate" aria-hidden="true" /><strong>候选 Key</strong><small>橙色为当前项</small></span>
          <span><i className="p5-legend-scan" aria-hidden="true" /><strong>扫描顺序</strong><small>沿环逐个比较</small></span>
          <span><i className="p5-legend-angle" aria-hidden="true" /><strong>夹角</strong><small>θ</small></span>
        </figcaption>
      </figure>
      <p>每个候选的记录都是 <math><mi>γ</mi><mo>(</mo><mi>q</mi><mo>,</mo><mi>k</mi><mo>)</mo><mo>=</mo><mn>1</mn><mo>−</mo><mi>cos</mi><mi>θ</mi></math>。把十个距离排在一起，才能知道哪几个方向最接近当前 Query。</p>
    </section>

    <section className="explain-section">
      <h3>选出最小的五个距离，再用下标取 Prompt</h3>
      <p>横排的十根柱先按池槽位放置，柱越短，距离越小。排序把短柱移到前面，<Term id="retrieval-top-n">Top‑N 检索</Term>取前 {topN} 名，给出本例的索引集合。然后按入选次序读出配对的 Prompt，每次取用都保留池中的源参数。</p>
      <P5RankGuide />
      <figure className="lesson-figure p5-retrieval-figure">
        <div className="figure-top"><strong>距离排序与同索引读取</strong><span>当前 Query {query}</span></div>
        <div className="figure-body">
          <div className="p5-motion-controls">
            <PlaybackControls playback={retrieval} label="排序与读取进度" />
          </div>
          <p className="p5-rank-hint" aria-live="polite">{rankHint}</p>
          <CandidateBars snapshot={snapshot} progress={sort} />
          <PromptShelf snapshot={snapshot} progress={read} />
        </div>
        <figcaption className="p5-legend p5-retrieval-legend" aria-label="距离排序与 Prompt 读取图例">
          <span><i className="p5-legend-distance" aria-hidden="true" /><strong>余弦距离</strong><small>柱高 · γ(q, k<sub>j</sub>)</small></span>
          <span><i className="p5-legend-topn" aria-hidden="true" /><strong>Top-{topN}</strong><small>入选 Key</small></span>
          <span><i className="p5-legend-source" aria-hidden="true" /><strong>源池槽位</strong><small><IndexedMath base="k" index="j" /></small></span>
          <span><i className="p5-legend-prompt" aria-hidden="true" /><strong>配对 Prompt</strong><small><IndexedMath base="P" index="j" /></small></span>
        </figcaption>
      </figure>
      <p>论文公式 (3) 选择的是总距离最小的 N 个索引。只要各项距离独立评分，取最小的 N 项就能得到这个集合。这里按距离顺序展示，方便把每个名次和一次读取对上。</p>
    </section>

    <section className="explain-section p5-query-sharing">
      <h3>换一个输入，哪些 Prompt 还能共用？</h3>
      <p>换 Query 后，角度和排名会变，池还是同一个。A 和 B 都选到 P₂、P₃，也分别读到了对方没有取用的三个 Prompt。<span className="lesson-key">共享</span>来自输入和 Key 的匹配，因此一个槽位可以被不同输入取用。</p>
      <QueryOverlap first={snapshots.A} second={snapshots.B} />
      <p>P6 沿用 A 的读取结果，把这五组 Prompt 接在图像 Token 前面，执行一次带 Prompt 的前向分类。</p>
    </section>
  </div>;
}
