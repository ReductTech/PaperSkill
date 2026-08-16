import { useEffect, useRef, useState } from 'react';
import { Term } from '../components/Glossary';
import { PAPER_FACTS } from '../data/facts';
import type { ChapterExperienceProps } from '../types';
import '../styles/experience-training.css';

const partitionFromState = (state?: string) => state === 'partition-1' ? 1 : state === 'partition-2' ? 2 : 3;

const PREDICTION_TOKENS = [
  { id: 'prediction-1', text: 'Invoice' },
  { id: 'prediction-2', text: 'total' },
  { id: 'prediction-3', text: '= $320' },
] as const;

export function MgamMatchingPuzzle({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const restoredPartition = restoredModuleState?.moduleId === 'results-boundary'
    ? 1
    : restoredModuleState?.moduleId === 'mgam-lab' ? partitionFromState(restoredModuleState.state) : 3;
  const [merged12, setMerged12] = useState(restoredPartition <= 2);
  const [merged23, setMerged23] = useState(restoredPartition === 1);
  const [evidenceOpen, setEvidenceOpen] = useState(restoredModuleState?.moduleId === 'results-boundary' && restoredModuleState.state === 'evidence-open');
  const completed = useRef(false);
  const partition = 3 - Number(merged12) - Number(merged23);
  const correct = partition === 1;

  useEffect(() => {
    if (!restoredModuleState) return;
    if (restoredModuleState.moduleId === 'mgam-lab') {
      const nextPartition = partitionFromState(restoredModuleState.state);
      setMerged12(nextPartition <= 2);
      setMerged23(nextPartition === 1);
      setEvidenceOpen(false);
      return;
    }
    if (restoredModuleState.moduleId === 'results-boundary') {
      setMerged12(true);
      setMerged23(true);
      setEvidenceOpen(restoredModuleState.state === 'evidence-open');
    }
  }, [restoredModuleState]);

  const merge = (separator: '12' | '23') => {
    const nextMerged12 = merged12 || separator === '12';
    const nextMerged23 = merged23 || separator === '23';
    const nextPartition = 3 - Number(nextMerged12) - Number(nextMerged23);
    setMerged12(nextMerged12);
    setMerged23(nextMerged23);
    onInteract('mgam-lab');
    onStateChange({ moduleId: 'mgam-lab', state: `partition-${nextPartition}` });
    if (nextPartition === 1 && !completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  return <section className="mgam-puzzle" aria-label="MGAM 匹配拼图" data-partition={partition}>
    <header className="mgam-puzzle__header">
      <div><span className="mgam-puzzle__heldout"><Term id="mgam">MGAM</Term> · <Term id="held-out">HELD-OUT TEST</Term></span><h3>TEST-{PAPER_FACTS.benchmark.hardPages}</h3></div>
      <p>这是与训练阶段视觉和 ID 均不同的新测试样本；GT 始终固定，只合并预测侧。</p>
    </header>

    <div className="mgam-puzzle__reference">
      <div className="mgam-puzzle__spec-strip" aria-label="Markdown 输出规范差异示意">
        <span className="source-tag">教学示意</span>
        <code><b>输出 A</b>| Invoice | total | = $320 |</code>
        <code><b>输出 B</b>Invoice total = $320</code>
      </div>
      <p><strong>为什么要看输出规范：</strong>同一张表，不同工具写出的 Markdown 格式可能不同（教学示意，非原始评测样本）；MGAM 固定 GT、只合并预测侧，才不被格式差异冤枉。</p>
    </div>

    <div className="mgam-puzzle__board">
      <div className="mgam-puzzle__lane" data-testid="mgam-ground-truth" data-immutable="true">
        <span>GT · 固定</span><strong>Invoice total = $320</strong>
      </div>
      <div className="mgam-puzzle__lines" data-testid="mgam-matching-lines" data-partition={partition} data-merged-12={String(merged12)} data-merged-23={String(merged23)} aria-hidden="true">
        {PREDICTION_TOKENS.map((token) => <i key={token.id} />)}
      </div>
      <div className="mgam-puzzle__prediction">
        <span>Prediction · 仅此侧可合并</span>
        <div className="mgam-puzzle__blocks" data-partition={partition}>
          {PREDICTION_TOKENS.map((token, index) => <strong
            key={token.id}
            data-token-id={token.id}
            data-joined-left={String(index === 1 ? merged12 : index === 2 ? merged23 : false)}
            data-joined-right={String(index === 0 ? merged12 : index === 1 ? merged23 : false)}
          >{token.text}</strong>)}
        </div>
        <div className="mgam-puzzle__separators" role="group" aria-label="预测块分隔线">
          {!merged12 ? <button type="button" onClick={() => merge('12')}>合并预测块 1 和 2</button> : null}
          {!merged23 ? <button type="button" onClick={() => merge('23')}>合并预测块 2 和 3</button> : null}
        </div>
      </div>
      <div className="mgam-puzzle__score" aria-live="polite">
        <span>匹配质量</span>
        <strong>{correct ? '合理匹配' : partition === 2 ? '更接近 GT' : '过度分块'}</strong>
        <b>{correct ? '粒度已对齐' : partition === 2 ? '已重算：仍有 1 条分隔线' : '等待合并预测块'}</b>
      </div>
    </div>

    {correct ? <div className="mgam-puzzle__results">
      <div className="mgam-puzzle__waterfall" aria-label="训练阶段消融瀑布">
        {[
          { id: 'base', label: 'Base', score: PAPER_FACTS.scores.stage0 },
          { id: 'stage-1', label: 'Stage 1', score: PAPER_FACTS.scores.stage1, gain: PAPER_FACTS.scores.stageGains.stage1 },
          { id: 'stage-2', label: 'Stage 2', score: PAPER_FACTS.scores.stage2, gain: PAPER_FACTS.scores.stageGains.stage2 },
          { id: 'stage-3', label: 'Stage 3', score: PAPER_FACTS.scores.stage3, gain: PAPER_FACTS.scores.stageGains.stage3 },
        ].map(({ id, label, score, gain }) => <div key={id} data-testid={`waterfall-${id}`}><span>{label}</span><strong>{score}</strong>{gain ? <b>{`+${gain}`}</b> : null}</div>)}
      </div>
      <p className="mgam-puzzle__rounding">分段报告 +{PAPER_FACTS.scores.roundedStageGain}；端点 +{PAPER_FACTS.scores.endpointGain}。差异来自四舍五入。</p>
      <div className="mgam-puzzle__benchmarks">
        <p><span>Base</span><strong>{PAPER_FACTS.scores.basePro}</strong><small>非第一；Best {PAPER_FACTS.scores.baseBest}</small></p>
        <p><span>Hard</span><strong>{PAPER_FACTS.scores.hardPro}</strong><small><span>v2 主文比较项（GLM-OCR / PaddleOCR-VL-1.5）</span> <b>{PAPER_FACTS.scores.hardMainTextComparator}</b></small><b>{`+${PAPER_FACTS.scores.hardMainTextLead}`}</b></p>
      </div>
    </div> : null}

    {correct ? <details className="mgam-puzzle__evidence" open={evidenceOpen} onToggle={(event) => {
      const open = event.currentTarget.open;
      setEvidenceOpen(open);
      onInteract('results-boundary');
      onStateChange({ moduleId: 'results-boundary', state: open ? 'evidence-open' : 'evidence-closed' });
    }}>
      <summary>证据口径与边界</summary>
      {evidenceOpen ? <p>v2 主文以 {PAPER_FACTS.scores.hardMainTextComparator} 为比较项；附录 Table 8 另列 {PAPER_FACTS.scores.hardAppendixRunnerUp}，对应领先 +{PAPER_FACTS.scores.hardAppendixLead.toFixed(2)}。两种口径不可混写。</p> : null}
    </details> : null}
    <p className="experience-boundary">事实边界：MGAM 固定 GT，并只枚举预测侧连续合并；教学分块不证明语义等价，也不是论文原始评测样本。</p>
  </section>;
}

export default MgamMatchingPuzzle;
