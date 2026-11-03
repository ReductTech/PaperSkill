import { LESSON_DURATIONS } from './lesson-motion';
import { useState } from 'react';
import { MODEL_CLASSES } from '../data/model-classes';
import { runTraining, TRAIN_PHASES, trainingSceneAt, CONFIG } from './training-model';
import { curve, windowAt } from './review/lifecycle-model';
import { MotionTrail } from './review/MotionTrail';
import SceneTransport, { useSceneTimeline } from './review/SceneTransport';
import { SampleGlyph, NetworkGlyph, fmt, vectorText } from './LearningGlyphs';
import { DerObjective, LossSymbol, ParameterSymbol } from './LessonNotation';
import { LessonCue, LessonPath } from './LessonGuidance';
import './learning-scenes.css';
import './der-redesign.css';
import './later-chapters.css';

const steps = runTraining('DER');
export const DER_STEP_CLIPS = TRAIN_PHASES.map((id, i) => ({ id, durationMs: LESSON_DURATIONS['der-step'][i], holdMs: 1000 }));
const LOOK = ['读旧池', '前向与冻结', '历史匹配', '一次更新', '更新后写入'];
export default function DERTrainingStep() {
  const [empty, setEmpty] = useState(false), timeline = useSceneTimeline(DER_STEP_CLIPS);
  const phase = timeline.state.clipIndex, p = timeline.state.progress;
  const { step, state } = trainingSceneAt(steps, (empty ? 0 : 1) * 5 + phase, p);
  const done = (i: number) => phase > i ? 1 : phase < i ? 0 : windowAt(p, .06, .85);
  const input = phase === 1 ? windowAt(p, .04, .17) : phase > 1 ? 1 : 0;
  const forward = phase === 1 ? windowAt(p, .17, .45) : phase > 1 ? 1 : 0;
  const current = phase > 1 ? 1 : phase === 1 ? windowAt(p, .45, .6) : 0;
  const replayForward = phase === 2 ? windowAt(p, .08, .48) : 0;
  const replay = phase > 2 ? 1 : phase === 2 ? windowAt(p, .48, .8) : 0;
  const update = phase === 3 ? windowAt(p, .18, .8) : 0;
  const read = phase>0?1:windowAt(p,.08,.48), freeze = phase > 1 ? 1 : phase === 1 ? windowAt(p, .62, .9) : 0;
  const copyPoints = [{ x: 610, y: 190 }, { x: 548, y: 210 }, { x: 592, y: 354 }, { x: 433, y: 385 }] as const;
  const copyAt = curve(freeze, ...copyPoints);
  const write = phase === 4 ? windowAt(p, .6, .88) : 0;
  const writeAt = curve(write, {x:320,y:430}, {x:298,y:430}, {x:276,y:445}, {x:254,y:445});
  const notes = [
    empty ? '空池没有旧样本，先看当前输入。' : '看左下：只读出旧记录副本，原记录留在 M。',
    '看当前前向，再看网络下方：更新前输出复制成固定候选 z。',
    empty ? '空池没有历史匹配项，历史损失为 0。' : '看右下：同一模型的当前 a，与原来的固定 z 比较。',
    '看右侧汇合，再沿顶部金色箭头回到网络：参数只更新一次。',
    '看左下记忆状态：更新结束后才写入本轮候选。',
  ];
  const active = (i: number) => phase === i ? ' is-active' : '';
  return <section className="der-redesign later-lesson step-lesson" data-scene="der-step" data-clip={phase} data-progress={p}
    data-status={timeline.state.status} data-updates={state.updates} data-seen={state.N} data-memory={state.M.map(r => r.id).join(',')} data-loss={step.losses.total} data-freeze-progress={freeze}>
    <header className="later-scene-heading"><div><h3>先读旧记忆，再合成一次更新。</h3><p>两路监督使用同一组更新前参数。沿当前高亮对象观看，最后再观察候选如何进入记忆。</p></div><div className="scene-options"><button aria-pressed={!empty} onClick={() => { setEmpty(false); timeline.reset(); }}>有旧记忆</button><button aria-pressed={empty} onClick={() => { setEmpty(true); timeline.reset(); }}>空池首轮</button></div></header>
    <LessonCue steps={LOOK} active={phase} title={notes[phase]} detail={phase === 3 ? '当前 CE 与加权历史匹配合并；M、N 此刻尚未写入。' : '观察提示与图中高亮同步，其他对象保持原位。'} />
    <div className="ds3-stage"><svg viewBox="0 0 1120 505" className="teaching-canvas ds3-canvas" role="img" aria-label="当前与旧输入共用一台网络，两种损失就近汇合，顶部金色梯度箭头进入参数端口，最后才写候选">
      <g data-attention-object="current"><rect x="30" y="100" width="220" height="110" rx="12" className={'ds3-surface' + active(1)} />
        <SampleGlyph x={44} y={123} size={48} id={'current ' + step.input.id} model={step.input.model} />
        <text x="107" y="132" className="later-svg-title">当前 {step.input.id}</text><text x="107" y="161" className="later-svg-note">y = {MODEL_CLASSES[step.input.y]}</text><text x="107" y="187" className="later-svg-note">真实标签监督</text>
      </g>
      <g data-attention-object="memory"><rect x="30" y="260" width="220" height="110" rx="12" className={'ds3-memory' + active(0)} />
        {step.rd ? <><SampleGlyph x={44} y={282} size={48} id={step.rd.id + ' original memory'} model={step.rd.model} /><text x="107" y="290" className="later-svg-title">旧记忆 {step.rd.id}</text><text x="107" y="318" className="later-svg-note">原记录保留</text><text x="45" y="354" className="ds3-vector lesson-math">z = {vectorText(step.rd.z, 2)}</text></> : <><text x="50" y="300" className="lesson-math">M = ∅</text><text x="50" y="338" className="later-svg-note">没有历史匹配项</text></>}
      </g>
      <LessonPath d="M250 155H319" progress={phase === 1 ? input : phase > 1 ? 1 : 0} />
      {step.rd && <LessonPath d="M250 315H319" progress={read} tone="history" />}
      {step.rd && phase === 0 && read > 0 && read < 1 && <g opacity={windowAt(read,0,.12)*(1-windowAt(read,.86,1))}><MotionTrail points={[{x:226,y:315},{x:256,y:315},{x:290,y:315},{x:322,y:315}]} progress={read} className="lesson-record-trail"/><SampleGlyph x={202+96*read} y={291} size={48} id="replay read copy" model={step.rd.model}/></g>}
      {phase === 1 && input > 0 && input < 1 && <g opacity={windowAt(input,0,.12)*(1-windowAt(input,.86,1))}><MotionTrail points={[{x:226,y:155},{x:256,y:155},{x:290,y:155},{x:322,y:155}]} progress={input} className="lesson-record-trail"/><SampleGlyph x={202+96*input} y={131} size={48} id="current read copy" model={step.input.model}/></g>}
      <NetworkGlyph x={320} y={113} version={'θ' + state.updates} forward={phase === 1 ? forward : phase === 2 && step.rd ? replayForward : 0} backward={update} />
      <g opacity={phase === 1 ? 1 : .4}><LessonPath d="M547 155H609" progress={current} /></g>
      <g opacity={phase === 2 ? 1 : .4}>{step.rd && <LessonPath d="M547 315H609" progress={replay} tone="history" />}</g>
      <g data-attention-object="current-loss"><rect x="610" y="100" width="270" height="110" rx="12" className={'ds3-surface' + active(1)} />
        <text x="630" y="130" className="ds3-loss lesson-math"><LossSymbol kind="current" /> = {current > .1 ? fmt(step.losses.current, 4) : '—'}</text>
        {MODEL_CLASSES.map((name, k) => <g key={name}><text x={630 + k * 80} y="155" className="ds3-class">{name}</text><text x={630 + k * 80} y="187" className="ds3-value lesson-math" opacity={current}>{fmt(step.currentLogits[k], 2)}</text></g>)}
      </g>
      <g data-attention-object="dark-loss"><rect x="610" y="260" width="270" height="110" rx="12" className={'ds3-surface' + active(2)} />
        <text x="630" y="290" className="ds3-loss lesson-math"><LossSymbol kind="dark" /> = {replay > .1 ? fmt(step.losses.dark, 4) : '—'}</text>
        <text x="630" y="320" className="ds3-vector lesson-math" opacity={replay}>{step.replayLogits ? 'a′ = ' + vectorText(step.replayLogits, 2) : '空池 · 本项为 0'}</text><text x="630" y="350" className="later-svg-note">当前响应与冻结 z 比较</text>
      </g>
      <g opacity={done(3)} data-attention-object="joint-update">
        <LessonPath d="M880 155H898Q905 155 905 162V208Q905 215 912 215H930" className="ds3-merge-current" />
        <LessonPath d="M880 315H898Q905 315 905 308V262Q905 255 912 255H930" tone="history" className="ds3-merge-history" />
        <rect x="930" y="180" width="150" height="110" rx="14" className={'ds3-total' + active(3)} />
        <text x="1005" y="210" textAnchor="middle" className="later-svg-title">合并梯度</text>
        <text x="1005" y="246" textAnchor="middle" className="ds3-theta lesson-math"><ParameterSymbol index={step.before.updates} /> → <ParameterSymbol index={step.after.updates} /></text><text x="1005" y="273" textAnchor="middle" className="later-svg-note">只更新一次</text>
      </g>
      {phase === 3 && <><LessonPath d="M1005 180V73Q1005 65 997 65H441Q433 65 433 73V113" progress={update} tone="gradient" /><text x="714" y="53" textAnchor="middle" className="ds3-gradient-label">∇θ · 一次联合更新</text></>}
      <g data-attention-object="frozen-candidate" opacity={windowAt(freeze, .8, 1)}><rect x="320" y="385" width="226" height="90" rx="12" className="ds3-candidate" /><text x="337" y="413" className="later-svg-title">冻结候选 {step.candidate.id}</text><text x="337" y="443" className="ds3-candidate-vector lesson-math">z = {vectorText(step.candidate.z, 2)}</text><text x="337" y="464" className="later-svg-note">更新后才选留</text></g>
      {freeze > 0 && freeze < 1 && <g><MotionTrail points={copyPoints} progress={freeze} className="lesson-record-trail" /><circle cx={copyAt.x} cy={copyAt.y} r="12" className="ds3-copy-dot" /><text x={copyAt.x} y={copyAt.y + 5} textAnchor="middle" className="ds3-copy-z lesson-math">z</text></g>}
      <g opacity={done(3)}><rect x="610" y="410" width="470" height="75" rx="12" className="ds3-formula-panel" /><text x="630" y="440" className="ds-total-formula lesson-math"><DerObjective /></text><text x="630" y="468" className="ds3-vector lesson-math">{fmt(step.losses.current, 4)} + {CONFIG.alpha} × {fmt(step.losses.dark, 4)} = {fmt(step.losses.total, 4)}</text></g>
      {phase === 4 && <g><rect x="26" y="398" width="228" height="94" rx="12" fill="none" className="ds3-postwrite-focus"/><LessonPath d="M320 430C298 430 276 445 254 445" progress={write} className="ds3-write-route"/>{p>.6&&p<.88&&<SampleGlyph x={writeAt.x-24} y={writeAt.y-24} size={48} model={step.input.model} id="post-update write copy"/>}</g>}
      <text x="30" y="420" className="later-svg-note">更新后写入</text><text x="30" y="450" className="ds3-vector lesson-math">M = [{state.M.map(r => r.id).join(', ')}]</text><text x="30" y="479" className="later-svg-note">{phase === 4 && p >= .88 ? '本轮已提交，N=' + state.N : '读取期间 M 保持不变'}</text>
    </svg></div>
    <SceneTransport timeline={timeline} clips={DER_STEP_CLIPS} label="DER 单步" showTiming={false} teachingProgress />
    <p className="der-footnote">独立二维线性教学模型 · 像素图仅标识类别；不是上方插入示例的网络求值。α={CONFIG.alpha}。</p>
  </section>;
}
