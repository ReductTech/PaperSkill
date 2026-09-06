import { useState } from 'react';
import type { WidgetProps } from './registry';
import '../styles/conclusion-evidence-chain.css';

type StageId = 'discover' | 'circuit' | 'verify';

const STAGES: Array<{ id: StageId; index: number; label: string; metric: string }> = [
  { id: 'discover', index: 1, label: '发现稳定信号', metric: '100 → 112 → Top-10' },
  { id: 'circuit', index: 2, label: '定位核心电路', metric: '10 → 2' },
  { id: 'verify', index: 3, label: '验证关键组合', metric: '联合 Steering' },
];

function DiscoveryStage() {
  return (
    <div className="cec-flow-stage">
      <section><span>实验输入</span><strong>100</strong><b>条隐藏密钥 Prompt</b></section>
      <i aria-hidden="true">→</i>
      <section><span>归因追踪 + Steering</span><strong>112</strong><b>个候选 Feature</b></section>
      <i aria-hidden="true">→</i>
      <section className="is-accent"><span>按出现频率筛选</span><strong>Top-10</strong><b>55%–95% 的 Prompt 中出现</b></section>
    </div>
  );
}

function CircuitStage() {
  return (
    <div className="cec-circuit-stage">
      <div className="cec-ten-nodes" aria-label="Top-10 Feature电路，其中两个为核心节点">
        {Array.from({ length: 10 }, (_, index) => <i className={index === 0 || index === 2 ? 'is-core' : ''} key={index}>{index + 1}</i>)}
      </div>
      <div className="cec-core-arrow"><span>统计跨 Prompt 重复边与向外连接数</span><strong>→</strong></div>
      <div className="cec-core-pair">
        <section><span>核心 Feature 1</span><strong>Obscuring information</strong><b>6/10</b></section>
        <em>+</em>
        <section><span>核心 Feature 2</span><strong>Secrets / confidentiality</strong><b>6/10</b></section>
      </div>
    </div>
  );
}

function ResultBar({ label, core, control }: { label: string; core: number; control: number }) {
  return (
    <section className="cec-result-group">
      <header><strong>{label}</strong></header>
      <div><span>核心双 Feature</span><i><b style={{ width: `${core}%` }} /></i><strong>{core}%</strong></div>
      <div className="is-control"><span>普通双 Feature 平均</span><i><b style={{ width: `${control}%` }} /></i><strong>{control}%</strong></div>
    </section>
  );
}

function VerifyStage() {
  return (
    <div className="cec-verify-stage">
      <div className="cec-pair-label"><span>联合干预</span><strong>两个核心 Feature</strong><b>保留 Top-10 的主要作用</b></div>
      <ResultBar label="负向 · D → ND" core={100} control={45.8} />
      <ResultBar label="正向 · ND → D" core={17.3} control={3.7} />
    </div>
  );
}

export function ConclusionEvidenceChain(_props: WidgetProps) {
  const [stageId, setStageId] = useState<StageId>('discover');

  return (
    <div className={'cec-root is-' + stageId}>
      <div className="cec-stage-controls" role="tablist" aria-label="回放论文完整路线">
        {STAGES.map((stage) => (
          <button type="button" role="tab" aria-selected={stage.id === stageId} className={stage.id === stageId ? 'is-active' : ''} onClick={() => setStageId(stage.id)} key={stage.id}>
            <span>{stage.index}</span><div><strong>{stage.label}</strong><small>{stage.metric}</small></div>
          </button>
        ))}
      </div>

      <div className="cec-stage-viewport" aria-live="polite">
        <div className="cec-stage-enter" key={stageId}>
          {stageId === 'discover' ? <DiscoveryStage /> : null}
          {stageId === 'circuit' ? <CircuitStage /> : null}
          {stageId === 'verify' ? <VerifyStage /> : null}
        </div>
      </div>

      <div className="cec-verdict">
        <span>论文结论</span>
        <strong>Transcoder 为难以解释的 MLP 计算建立了一张可分析的 Feature 地图，让与欺骗行为相关的内部路径能够被定位、追踪和干预，为模型风险监测提供了新的方法。</strong>
      </div>

      <div className={`cec-model-summary is-${stageId}`}>
        <section className={`cec-capability is-locate${stageId === 'discover' ? ' is-active' : ''}`}>
          <span>可定位</span>
          <strong>100 → 112 → Top-10</strong>
          <p>从 100 条 Prompt 中找到稳定复现的内部 Feature。</p>
        </section>

        <section className={`cec-capability is-trace${stageId === 'circuit' ? ' is-active' : ''}`}>
          <span>可追踪</span>
          <strong>重复连接 → 两个 6/10 枢纽</strong>
          <p>沿跨层连接形成电路，并定位两个核心节点。</p>
        </section>

        <section className="cec-model-cutaway" aria-label="模型内部Feature电路剖面">
          <div className="cec-model-cutaway-title">
            <span>打开输出黑箱</span>
            <strong>模型内部的 Feature 电路</strong>
          </div>
          <svg viewBox="0 0 520 190" role="img" aria-label="两个核心Feature通过跨层连接影响输出">
            <rect className="cec-model-shell" x="18" y="18" width="484" height="150" rx="18" />
            <line className="cec-layer-line" x1="175" y1="34" x2="175" y2="153" />
            <line className="cec-layer-line" x1="340" y1="34" x2="340" y2="153" />
            <text className="cec-layer-label" x="94" y="48">较早层</text>
            <text className="cec-layer-label" x="258" y="48">中间层</text>
            <text className="cec-layer-label" x="420" y="48">较晚层</text>

            <path className="cec-circuit-edge" d="M86 92 C145 72, 190 74, 245 102" />
            <path className="cec-circuit-edge" d="M88 127 C150 138, 190 130, 245 102" />
            <path className="cec-circuit-edge is-core" d="M245 102 C315 76, 350 78, 418 91" />
            <path className="cec-circuit-edge is-core" d="M245 102 C310 132, 362 130, 424 128" />
            <path className="cec-circuit-edge" d="M86 92 C188 52, 312 50, 418 91" />

            <circle className="cec-feature-node" cx="86" cy="92" r="15" />
            <circle className="cec-feature-node" cx="88" cy="127" r="13" />
            <circle className="cec-feature-node is-core" cx="245" cy="102" r="25" />
            <circle className="cec-feature-node" cx="418" cy="91" r="15" />
            <circle className="cec-feature-node is-core" cx="424" cy="128" r="22" />
            <text className="cec-core-node-label" x="245" y="107">核心 1</text>
            <text className="cec-core-node-label" x="424" y="133">核心 2</text>
          </svg>
          <div className="cec-model-behavior">
            <span>联合 Steering</span>
            <b>D</b>
            <i aria-hidden="true">→</i>
            <b className="is-nd">ND</b>
          </div>
        </section>

        <section className={`cec-capability is-intervene${stageId === 'verify' ? ' is-active' : ''}`}>
          <span>可干预</span>
          <strong>两个核心 Feature 改变回答</strong>
          <div><b>负向</b><em>D → ND 100%</em></div>
          <div><b>正向</b><em>ND → D 17.3%</em></div>
          <p>结构定位最终由行为翻转完成验证。</p>
        </section>
      </div>
    </div>
  );
}

export default ConclusionEvidenceChain;
