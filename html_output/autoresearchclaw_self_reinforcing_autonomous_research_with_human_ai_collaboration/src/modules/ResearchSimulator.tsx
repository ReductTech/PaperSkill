import { useEffect, useState } from 'react';
import { DebateVisual, type HealingBranch } from './ResearchVisuals';
import { ExperimentFailureScene, HealingRouteScene, MemoryStreamScene, VerificationGateScene } from './ResearchMotionScenes';

export type SimulatorStage = 'hypothesis' | 'experiment' | 'healing' | 'result' | 'verification' | 'hitl' | 'evolution';
type HealingChoice = HealingBranch;

const stageLabels: Array<[SimulatorStage, string]> = [
  ['hypothesis', '假设生成'],
  ['experiment', '实验执行'],
  ['healing', '修复 / 决策'],
  ['result', '结果辩论'],
  ['verification', '证据验证'],
  ['hitl', '人类介入'],
  ['evolution', '经验沉淀'],
];

export function ResearchSimulator({ presenterStage, presenterKey }: { presenterStage?: SimulatorStage; presenterKey?: string }) {
  const [stage, setStage] = useState<SimulatorStage>('hypothesis');
  const [failed, setFailed] = useState(false);
  const [healing, setHealing] = useState<HealingChoice>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!presenterStage) return;
    setStage(presenterStage);
    setFailed(false);
    setHealing(null);
    setPaused(false);
  }, [presenterStage, presenterKey]);

  const go = (next: SimulatorStage) => setStage(next);
  const selectHealing = (choice: HealingChoice) => setHealing(choice);
  const activeLoopNodes: Record<SimulatorStage, string[]> = {
    hypothesis: ['idea', 'debate', 'hypothesis'],
    experiment: ['experiment', 'evidence'],
    healing: ['experiment', 'evidence', 'decision'],
    result: ['result', 'evidence'],
    verification: ['evidence', 'verification', 'paper'],
    hitl: ['decision', 'experiment', 'result'],
    evolution: ['lesson', 'future'],
  };
  const loopNode = (id: string, label: string) => <span className={activeLoopNodes[stage].includes(id) ? 'active' : ''}>{label}</span>;

  return (
    <div className="simulator-shell" aria-label="AutoResearchClaw 研究模拟器">
      <div className="simulator-topline">
        <div>
          <span className="eyebrow">交互式科研模拟器 · Interactive Research Simulator</span>
          <h3>让失败、证据与判断重新进入下一轮研究</h3>
        </div>
        <button className="text-button" onClick={() => { setStage('hypothesis'); setFailed(false); setHealing(null); setPaused(false); }}>
          重置模拟器
        </button>
      </div>

      <div className="sim-stage-rail" aria-label="研究流程阶段">
        {stageLabels.map(([id, label], index) => (
          <button key={id} className={stage === id ? 'active' : ''} aria-current={stage === id ? 'step' : undefined} onClick={() => go(id)}>
            <span>{String(index + 1).padStart(2, '0')}</span>{label}
          </button>
        ))}
      </div>

      <div className="sim-persistent-loop" aria-label="Scientific Research Loop">
        <div><b>科研闭环</b><small>Scientific Research Loop</small></div>
        <p>{loopNode('idea', '想法')} <i>↓</i> {loopNode('debate', '辩论')} <i>↓</i> {loopNode('hypothesis', '假设')} <i>↓</i> {loopNode('experiment', '实验')} <i>↓</i> {loopNode('evidence', '证据 / 失败')} <i>↓</i> {loopNode('result', '结果辩论')} <i>↓</i> {loopNode('verification', '验证')} <i>↓</i> {loopNode('paper', '论文')} <i>↓</i> {loopNode('lesson', '经验')} <i>↓</i> {loopNode('future', '下一轮研究')}</p>
        <aside>{loopNode('decision', '◆ 人类关键判断')} <em>Refine ↻</em> <em>Pivot ↶</em></aside>
      </div>

      <section className={`sim-scene ${stage === 'hypothesis' ? 'is-active' : ''}`} id="sim-hypothesis">
        <div className="scene-kicker">场景 01 · 假设辩论</div>
        <DebateVisual initialMode="hypothesis" />
        <div className="scene-action"><button className="primary-button" onClick={() => go('experiment')}>带着可证伪假设进入实验 →</button></div>
      </section>

      <section className={`sim-scene ${stage === 'experiment' ? 'is-active' : ''}`} id="sim-experiment">
        <div className="scene-kicker">场景 02 · 实验执行{failed ? ' · 失败已记录' : ''}</div>
        <ExperimentFailureScene sceneKey={`${presenterKey ?? 'free'}-${stage}`} autoRun={presenterStage === 'experiment'} onFailure={() => setFailed(true)} onDiagnose={() => go('healing')} />
      </section>

      <section className={`sim-scene ${stage === 'healing' ? 'is-active' : ''}`} id="sim-healing">
        <div className="scene-kicker">场景 03 · 自愈式执行 · Self-Healing</div>
        <HealingRouteScene selected={healing} onSelect={selectHealing} />
        <div className="scene-action">
          {healing === 'pivot' ? <button className="primary-button" onClick={() => go('hypothesis')}>沿 Pivot 回到假设辩论 ↺</button> : healing ? <button className="primary-button" onClick={() => { setFailed(false); go('experiment'); }}>沿路径返回当前实验 ↺</button> : <button className="primary-button" disabled>先选择一条处理路径</button>}
        </div>
      </section>

      <section className={`sim-scene ${stage === 'result' ? 'is-active' : ''}`} id="sim-result-debate">
        <div className="scene-kicker">场景 04 · 结果辩论</div>
        <DebateVisual initialMode="result" />
        <p className="scene-note"><b>系统在两个时刻辩论：</b>实验前决定“该测什么”；实验后判断“结果实际支持什么”。</p>
        <div className="scene-action"><button className="primary-button" onClick={() => go('verification')}>把主张送入验证 →</button></div>
      </section>

      <section className={`sim-scene ${stage === 'verification' ? 'is-active' : ''}`} id="sim-verification">
        <div className="scene-kicker">场景 05 · 可验证结果报告 · Verifiable Result Reporting</div>
        <VerificationGateScene />
        <div className="scene-action"><button className="primary-button" onClick={() => go('hitl')}>遇到高不确定性决策 →</button></div>
      </section>

      <section className={`sim-scene ${stage === 'hitl' ? 'is-active' : ''}`} id="sim-hitl">
        <div className="scene-kicker">场景 06 · 人在环协作 · Human-in-the-Loop</div>
        <div className="human-loop">
          <div className="loop-machine">AI 科研闭环<br /><small>默认自主运行</small></div>
          <div className={paused ? 'smart-pause active' : 'smart-pause'}>SmartPause<br /><small>系统不确定性升高</small></div>
          <div className="human-node">研究者<br /><small>高价值判断</small></div>
        </div>
        <div className="scene-action"><button className="human-button" onClick={() => setPaused(true)}>触发 SmartPause</button></div>
        <div className="human-feedback" role="status" aria-live="polite">{paused ? <>系统：<b>“当前证据倾向于 Pivot。”</b><br />研究者：<b>“Baseline 还不充分，先 Refine 实验。”</b></> : 'AI 负责运行科研闭环；人类只在不确定且高价值的决策点介入。'}</div>
        <div className="scene-action"><button className="primary-button" onClick={() => go('evolution')}>把本次教训留给下一次 →</button></div>
      </section>

      <section className={`sim-scene ${stage === 'evolution' ? 'is-active' : ''}`} id="sim-evolution">
        <div className="scene-kicker">场景 07 · 跨运行经验演化 · Cross-Run Evolution</div>
        <MemoryStreamScene />
        <p className="scene-note"><b>跨运行经验演化不是重新训练 LLM。</b> 它通过长期经验库、经验检索和 Prompt 注入复用教训。</p>
      </section>
    </div>
  );
}
