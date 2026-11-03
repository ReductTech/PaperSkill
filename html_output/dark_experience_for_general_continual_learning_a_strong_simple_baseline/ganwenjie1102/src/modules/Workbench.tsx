import { useId, useMemo, useState } from "react";
import SceneTransport, { useSceneTimeline } from "./review/SceneTransport";
import {
  runTraining,
  trainingSceneAt,
  WORKBENCH_CLIPS,
  TRAIN_PHASES,
  predict,
  CONFIG,
  type Mode,
  type TrainingRecord,
} from "./training-model";
import { curve, mix, windowAt } from "./review/lifecycle-model";

import { MotionTrail } from "./review/MotionTrail";
import { NetworkGlyph, SampleGlyph, ScoreGlyph, fmt, vectorText } from "./LearningGlyphs";
import { MODEL_CLASSES } from "../data/model-classes";
import { LossSymbol, ParameterSymbol } from "./LessonNotation";
import { LessonCue, LessonPath } from "./LessonGuidance";
import { Equation } from "./MathNotation";
import "./learning-scenes.css";
import "./workbench.css";
import "./later-chapters.css";

const SLOT_X = 66;
const slotY = (slot: number) => 420 + slot * 86;
const CANDIDATE_HOME = { x: 414, y: 416 };

function StoredRecord({
  record,
  x,
  y,
  opacity = 1,
  mode,
  readD = false,
  readY = false,
}: {
  record: TrainingRecord;
  x: number;
  y: number;
  opacity?: number;
  mode: Mode;
  readD?: boolean;
  readY?: boolean;
}) {
  return (
    <g
      transform={"translate(" + x + " " + y + ")"}
      opacity={opacity}
      data-training-record={record.id}
      data-instance-id={"workbench:" + record.id}
      data-target={record.z.join(",")}
      data-generated-by={record.origin}
      data-read-d={readD}
      data-read-y={readY}
    >
      <rect width="270" height="80" rx="12" className="wb-record-card" />
      <SampleGlyph x={10} y={17} size={44} model={record.model} id={"workbench:" + record.id} />
      <text x="64" y="22" className="wb-record-title">
        {record.id} · 冻结 z
      </text>
      <text x="64" y="45" className="wb-record-vector">
        {vectorText(record.z, 3)}
      </text>
      <text x="64" y="67" className="wb-record-note">
        z @<ParameterSymbol index={record.origin.replace("θ", "")}/>{mode === "DER++" ? " · y=" + MODEL_CLASSES[record.y!] : " · 无 y"}
      </text>
      {readD && (
        <g className="wb-read-badge wb-read-dark">
          <rect x="198" y="8" width="32" height="20" rx="6" />
          <text x="214" y="23" textAnchor="middle">Rd</text>
        </g>
      )}
      {readY && (
        <g className="wb-read-badge wb-read-label">
          <rect x={readD ? 232 : 198} y="8" width="32" height="20" rx="6" />
          <text x={readD ? 248 : 214} y="23" textAnchor="middle">Ry</text>
        </g>
      )}
    </g>
  );
}

function StepDetails({ step }: { step: ReturnType<typeof runTraining>[number] }) {
  return (
    <details className="local-detail" data-numeric-details>
      <summary>展开本轮可复算状态、前向视图与联合梯度</summary>
      <p>
        这是 W5 的二维线性合成模型 h<sub>W</sub>(u)=Wu；无 bias/momentum。各支路用自己的输入把输出梯度转成矩阵梯度，再按目标权重合并。
        η={CONFIG.eta}，α={CONFIG.alpha}，β={CONFIG.beta}（仅 DER++）。图中类别标识用于稳定身份，u 不是从真实图片计算的特征。
      </p>
      <Equation label="线性模型把输出梯度转换为权重矩阵梯度"><msub><mi>∇</mi><mi>W</mi></msub><mi>L</mi><mo>=</mo><mo>(</mo><msub><mi>∇</mi><mi>a</mi></msub><mi>L</mi><mo>)</mo><msup><mi>u</mi><mi mathvariant="normal">T</mi></msup></Equation>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>来源</th><th>原始 u / 标签</th><th>增强视图</th><th>更新前输出</th><th>目标</th></tr>
          </thead>
          <tbody>
            <tr>
              <th>当前 {step.input.id}</th>
              <td>{vectorText(step.input.u, 1)} / {MODEL_CLASSES[step.input.y]}</td>
              <td>{vectorText(step.currentView, 1)}</td>
              <td>{vectorText(step.currentLogits, 6)}</td>
              <td>真实 y；候选 z 复制此输出</td>
            </tr>
            {step.rd && (
              <tr>
                <th>Rd {step.rd.id}</th>
                <td>{vectorText(step.rd.u, 1)}</td>
                <td>{vectorText(step.replayView!, 1)}</td>
                <td>{vectorText(step.replayLogits!, 6)}</td>
                <td>固定 z={vectorText(step.rd.z, 6)}</td>
              </tr>
            )}
            {step.ry && (
              <tr>
                <th>Ry {step.ry.id}</th>
                <td>{vectorText(step.ry.u, 1)} / {MODEL_CLASSES[step.ry.y!]}</td>
                <td>{vectorText(step.labelView!, 1)}</td>
                <td>{vectorText(step.labelLogits!, 6)}</td>
                <td>真实 {MODEL_CLASSES[step.ry.y!]}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="wb-matrices">
        {[
          ["进入 W", step.before.W],
          ["联合梯度", step.gradients.total],
          ["更新后 W", step.after.W],
        ].map(([title, matrix]) => (
          <div key={String(title)}>
            <strong>{String(title)}</strong>
            <pre>{(matrix as readonly (readonly number[])[]).map(row => row.map(v => fmt(v, 9)).join("   ")).join("\n")}</pre>
          </div>
        ))}
      </div>
      <p>
        总损失 {fmt(step.losses.total, 9)} = 当前 {fmt(step.losses.current, 9)}
        {" + α·"}{fmt(step.losses.dark, 9)}
        {step.mode === "DER++" ? " + β·" + fmt(step.losses.label, 9) : ""}。
        各项都使用同一个更新前 W；梯度求和后只更新一次。
      </p>
    </details>
  );
}


function outcomeLabel(step: ReturnType<typeof runTraining>[number]) {
 return step.insertion.decision==='append'?'追加 '+step.input.id:step.insertion.decision==='replace'?'替换 '+step.insertion.evicted?.id+' → '+step.input.id:'拒收 '+step.input.id+'；训练有效';
}
export default function Workbench(){
 const arrowId=useId().replace(/:/g,'');
 const [mode,setMode]=useState<Mode>('DER'),[jump,setJump]=useState('从空池开始');
 const steps=useMemo(()=>runTraining(mode),[mode]),timeline=useSceneTimeline(WORKBENCH_CLIPS);
 const {clipIndex:c,progress:p}=timeline.state,{step,round,phase,prediction,state}=trainingSceneAt(steps,c,p),result=predict(steps[3].after);

 const ending=!prediction&&phase===4?windowAt(p,.88,1):0;
 const readVisibility=prediction?0:phase===0?1:phase===1?1-windowAt(p,0,.16):0;
 const inputFlow=prediction?windowAt(p,.04,.18):phase>1?1:phase===1?windowAt(p,.04,.17):0;
 const flow=prediction?windowAt(p,.18,.65):phase>1?1:phase===1?windowAt(p,.17,.45):0;
 const outputFlow=prediction?windowAt(p,.65,.82):phase>1?1:phase===1?windowAt(p,.45,.6):0;
 const historyForward=!prediction&&phase===2&&step.rd?windowAt(p,.05,.5):0;
 const historyOutput=prediction?0:phase>2?1:phase===2?windowAt(p,.5,.62):0;
 const loss=prediction?0:phase>2?1:phase===2?windowAt(p,step.rd ? .62 : .08,.86):0,update=!prediction&&phase===3?windowAt(p,.18,.8):0;
 const freeze=prediction?0:phase>1?1:phase===1?windowAt(p,.62,.9):0;
 const retire=!prediction&&phase===4&&step.insertion.decision==='replace'?windowAt(p,.12,.36):0;
 const placing=!prediction&&phase===4?windowAt(p,.4,.88):0;
 const rejecting=!prediction&&phase===4&&step.insertion.decision==='reject'?windowAt(p,.3,.84):0;
 const jumpTo=(index:number)=>{setJump('状态跳转：定位'+(index===20?'只读预测':'第 '+(Math.floor(index/5)+1)+' 轮'));timeline.start(index);};
 const scrub=(value:number)=>{const event=Math.min(4,Math.floor(value));timeline.seek(round*5+event,value>=5?1:value-event);setJump('本轮时间定位：暂停检查中间状态');};
 const freezePoints=[{x:654,y:250},{x:654,y:410},{x:500,y:416},CANDIDATE_HOME] as const;
 const writePoints=[CANDIDATE_HOME,{x:370,y:slotY(step.insertion.slot??0)},{x:340,y:slotY(step.insertion.slot??0)},{x:SLOT_X,y:slotY(step.insertion.slot??0)}] as const;
 const candidateAt=phase===1?curve(freeze,...freezePoints):phase===4?(step.insertion.decision==='reject'?{x:CANDIDATE_HOME.x+rejecting*22,y:CANDIDATE_HOME.y+rejecting*34}:curve(placing,...writePoints)):CANDIDATE_HOME;

 const completed=prediction?4:round+(phase===4&&p>=.88?1:0);
 const focusBox=prediction?(p<.65?{x:351,y:74,w:234,h:252}:{x:650,y:125,w:294,h:128}):phase===0||phase===4?{x:35,y:362,w:333,h:246}:phase===1&&p>=.62?{x:candidateAt.x-4,y:candidateAt.y-4,w:278,h:88}:phase===2?(p<.5&&step.rd?{x:351,y:74,w:234,h:252}:p<.62&&step.rd?{x:646,y:244,w:300,h:85}:{x:956,y:79,w:286,h:230}):{x:351,y:74,w:234,h:252};
 return <section className="der-redesign teaching-scene workbench later-lesson wb2-lesson" data-scene="workbench" data-mode={mode} data-clip={c} data-progress={p} data-status={timeline.state.status} data-round={round+1} data-phase={phase} data-seen={state.N} data-updates={state.updates} data-memory={state.M.map(r=>r.id).join(',')} data-weights={JSON.stringify(state.W)} data-freeze-progress={freeze}>
 <header className="later-scene-heading"><div><h3>让同一组 θ、M、N 连续走完四轮。</h3><p>从 θ₀、空池和 N=0 开始。读旧记忆、前向并冻结、合并更新，最后才在线选留。结束状态直接成为下一轮起点。</p></div><div className="mode-switch" aria-label="算法模式">{(['DER','DER++'] as Mode[]).map(m=><button key={m} data-mode={m} aria-pressed={mode===m} onClick={()=>{setMode(m);setJump('切换方法：从相同初态重新计算独立轨迹');timeline.reset();}}>{m}</button>)}</div></header>

 <div className="wb-handoff"><div className="wb-handoff-intro"><span>连续状态</span><p>θ₀ · M=∅ · N=0</p></div><ol className="wb-handoff-rounds">{steps.map((s,i)=><li key={s.input.id} data-handoff-round={i+1} data-active={!prediction&&round===i} data-updates={s.after.updates} data-seen={s.after.N} data-memory={s.after.M.map(r=>r.id).join(',')} data-weights={JSON.stringify(s.after.W)}><button data-round-select={i} aria-pressed={!prediction&&round===i} onClick={()=>jumpTo(i*5)}><span className="wb-handoff-kicker">0{i+1} · {s.input.id}</span><strong>{i<completed?outcomeLabel(s):i===round&&!prediction?'本轮进行中':'等待执行'}</strong><span className="wb-handoff-state">{i<completed?'θ'+s.after.updates+' · N='+s.after.N:'点击定位本轮起点'}</span><span className="wb-handoff-memory">{i<completed?'M = '+s.after.M.map(r=>r.id).join('，'):'结果在完成后显示'}</span></button></li>)}</ol><button className={'wb-query-node'+(prediction?' is-active':'')} data-predict aria-pressed={prediction} onClick={()=>jumpTo(20)}><span>之后 · 只读</span><strong>查询 θ₄</strong><small>M、N 不变</small></button></div>
 <div className="wb-state"><span>当前参数 <b>θ<sub>{state.updates}</sub></b></span><span>已处理 N <b>{state.N}</b></span><span>固定容量 K <b>2</b></span><span>记忆 |M| <b>{state.M.length}</b></span><button data-replay-round onClick={()=>jumpTo(round*5)}>回到本轮起点</button></div>
 <LessonCue steps={['读旧池','前向与冻结','形成监督','联合更新','在线选留']} active={prediction?-1:phase} title={prediction?'看输入到输出：训练已停止，只做一次查询':('第 '+(round+1)+' 轮 · '+['看左下记忆与进入模型的副本',(p<.17?'看左侧：当前输入副本进入网络':p<.45?'看网络：信号逐层传播':p<.62?'看上方：三类输出逐项到达':'看输出下方：数值副本转为冻结候选'),(p<.5&&step.rd?'看模型：旧输入也用更新前参数前向':p<.62&&step.rd?'看中间：当前 a 与冻结 z 比较':'看右侧：本轮监督已经准备好'),'看金色回传箭头：只更新同一个 θ 一次','看候选与原槽：只有现在才提交 M、N'][phase])} detail={prediction?'本步没有训练损失、回放或写池。':['旧记录保留，每条读取只产生副本。','z 复制自本轮更新前输出，随后保持冻结。','全部监督使用同一组更新前参数。','梯度合并后只更新一次；M、N 此刻尚未写入。','移动完成后提交，结束状态直接交给下一轮。'][phase]}/><div className="teaching-stage wb-stage"><svg viewBox="0 0 1280 640" className="teaching-canvas wb-canvas" role="img" aria-label="一套持续模型和双槽记忆，真实记录副本和冻结候选连续移动，四轮执行后只读预测">
 <defs><marker id={arrowId+'-gradient'} viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" fill="none" stroke="#b89363" strokeWidth="1.4"/></marker></defs>
 <text x="42" y="35" className="wb-canvas-kicker">{prediction?'训练停止 · 只读查询':'持续状态 · 第 '+(round+1)+' 轮'}</text><text x="1235" y="35" textAnchor="end" className="wb-canvas-mode">{mode} · {prediction?'只读预测':TRAIN_PHASES[phase]}</text><path d="M42 48H1238" className="wb-canvas-rule"/>
 <g opacity={1-ending} className="wb-current-input"><rect x="40" y="90" width="238" height="142" rx="16" className="wb-panel wb-input-panel"/><text x="57" y="114" className="wb-panel-kicker">{prediction?'QUERY · 普通预测':'CURRENT · 当前样本'}</text>{prediction?<g><rect x="56" y="133" width="58" height="58" rx="10" className="wb2-query-input"/><text x="85" y="171" textAnchor="middle" className="wb2-query-u">u</text></g>:<SampleGlyph x={56} y={133} size={58} model={step.input.model} id={'workbench:'+step.input.id+':source'}/>}<text x="126" y="156" className="wb-panel-title">{prediction?'查询 u':step.input.id+' · y='+MODEL_CLASSES[step.input.y]}</text><text x="126" y="181" className="wb-panel-value">{vectorText(prediction?result.u:step.input.u,1)}</text><text x="126" y="205" className="wb-panel-note">{prediction?'使用训练完成的 θ₄':'原始二维输入 · 标签监督'}</text></g>
 <g opacity={1-ending}><LessonPath d="M278 161H354" progress={inputFlow}/></g>
 <g opacity={(prediction?windowAt(p,.04,.08)*(1-windowAt(p,.18,.23)):phase===1?windowAt(p,.04,.06)*(1-windowAt(p,.17,.21)):0)} data-current-copy><MotionTrail points={[{x:278,y:161},{x:300,y:161},{x:333,y:161},{x:355,y:161}]} progress={inputFlow} className="lesson-record-trail"/>{prediction?<text x={mix(278,355,inputFlow)} y="166" className="wb2-query-u">u</text>:<SampleGlyph x={mix(278,355,inputFlow)-29} y={132} size={58} model={step.input.model} id="workbench:current-copy"/>}</g>
 <NetworkGlyph x={355} y={78} version={'θ'+state.updates} forward={phase===2&&step.rd?historyForward:flow} backward={update}/>

 <g opacity={1-ending}><LessonPath d="M582 185H653" progress={outputFlow}/></g>
 <g opacity={outputFlow*(1-ending)}><ScoreGlyph x={654} y={139} label={prediction?'查询 logits':step.input.id+' 更新前输出'} parameterIndex={prediction?4:step.before.updates} values={prediction?result.logits:step.currentLogits} reveal={outputFlow} note={prediction?'只读查询；不产生训练候选':'复制当前数值为 z；随后保持冻结'}/></g>
 {!prediction&&step.rd&&<g className="wb-replay-match" opacity={historyOutput*(1-ending)}><rect x="650" y="248" width="292" height="77" rx="12" className="wb-match-panel"/><text x="666" y="271" className="wb-match-kicker">Rd {step.rd.id} · 当前 a 对冻结 z</text><text x="666" y="296" className="wb-match-value">a = {vectorText(step.replayLogits!,3)}</text><text x="666" y="316" className="wb-match-target">z = {vectorText(step.rd.z,3)}</text></g>}
 {!prediction&&<g className="wb-objective" opacity={loss*(1-ending)}><rect x="960" y="83" width="278" height={mode==='DER++'?222:192} rx="15" className="wb-objective-panel"/><text x="980" y="111" className="wb-panel-kicker">联合目标 · 同一组更新前 θ</text><text x="980" y="142" className="wb-objective-title">当前 CE</text><text x="1217" y="142" textAnchor="end" className="wb-objective-value">{fmt(step.losses.current)}</text><path d="M980 154H1218" className="wb-objective-rule"/><text x="980" y="181" className="wb-objective-title wb-objective-dark lesson-math">α <LossSymbol kind="dark"/></text><text x="1217" y="181" textAnchor="end" className="wb-objective-value">{fmt(CONFIG.alpha*step.losses.dark)}</text><text x="980" y="201" className="wb-objective-note">{step.rd?'Rd '+step.rd.id+' · ‖a−z‖²':'空池 · 本项为 0'}</text>{mode==='DER++'&&<><path d="M980 212H1218" className="wb-objective-rule"/><text x="980" y="239" className="wb-objective-title wb-objective-label lesson-math">β <LossSymbol kind="replay-CE"/></text><text x="1217" y="239" textAnchor="end" className="wb-objective-value">{fmt(CONFIG.beta*step.losses.label)}</text><text x="980" y="260" className="wb-objective-note">{step.ry?'Ry '+step.ry.id+' · y='+MODEL_CLASSES[step.ry.y!]:'空池 · 本项为 0'}</text></>}<text x="980" y={mode==='DER++'?286:261} className="wb-objective-total">总计 {fmt(step.losses.total)}</text></g>}
 {!prediction&&<LessonPath d={"M1070 "+(mode==='DER++'?305:275)+"V340Q1070 348 1062 348H476Q468 348 468 340V322"} className="wb-joint-gradient" progress={update} tone="gradient"/>}
 <g data-workbench-memory><rect x="39" y="366" width="325" height="238" rx="17" className="wb-memory-panel"/><text x="57" y="391" className="wb-memory-title">持久记忆 M · K=2</text><text x="346" y="391" textAnchor="end" className="wb-memory-count">N={state.N}</text><text x="57" y="410" className="wb-memory-note">{prediction?'预测不读取 M':step.rd?'Rd '+step.rd.id+(step.ry?' / Ry '+step.ry.id:'')+' · 读取副本':'空池 · 无回放'}</text>{[0,1].map(slot=><g key={slot}><rect x="54" y={slotY(slot)-4} width="295" height="84" rx="13" className="wb-slot-outline"/>{!state.M[slot]&&<text x="206" y={slotY(slot)+48} textAnchor="middle" className="wb-empty-slot">slot {slot} · 空</text>}</g>)}</g>
 {!prediction&&[step.rd,mode==='DER++'?step.ry:null].map((r,i)=>{if(!r)return null;const slot=step.before.M.findIndex(old=>old.id===r.id),start={x:337,y:slotY(slot)+40},end={x:440+i*22,y:322},points=[start,{x:374,y:start.y},{x:370,y:349+i*10},end] as const;const startTime=i===1 ? .44 : .08,endTime=i===1 ? .82 : step.ry ? .44 : .72;const t=phase===0 ? windowAt(p,startTime,endTime) : 1,at=curve(t,...points);return <g key={i} data-replay-copy={i?'Ry':'Rd'} opacity={readVisibility}><LessonPath d={'M'+start.x+' '+start.y+'C374 '+start.y+' 370 '+(349+i*10)+' '+end.x+' 322'} progress={t} tone={i?'gradient':'history'}/>{t>0&&t<1&&<g opacity={windowAt(t,0,.1)*(1-windowAt(t,.88,1))}><MotionTrail points={points} progress={t} className="lesson-record-trail"/><SampleGlyph x={at.x-22} y={at.y-22} size={44} model={r.model} id={'workbench:read-'+i}/><text x={at.x+26} y={at.y+5} className="wb2-copy-label">{i?'Ry':'Rd'}</text></g>}</g>;})}
 {!prediction&&phase===1&&<MotionTrail points={freezePoints} progress={freeze} className="lesson-record-trail"/>}
 {!prediction&&phase===4&&step.insertion.decision!=='reject'&&<MotionTrail points={writePoints} progress={placing} className="lesson-record-trail"/>}
 <g data-workbench-records>{steps.map((s,i)=>{const frozen=s.candidate;let x=SLOT_X,y=slotY(0),opacity=0;
 if(prediction){const slot=state.M.findIndex(r=>r.id===frozen.id);if(slot>=0){y=slotY(slot);opacity=1;}}
 else if(i<round){const slot=step.before.M.findIndex(r=>r.id===frozen.id);if(slot>=0){y=slotY(slot);opacity=1;if(phase===4&&step.insertion.evicted?.id===frozen.id){x+=retire*18;opacity=1-retire;}}}
 else if(i===round){x=candidateAt.x;y=candidateAt.y;opacity=phase<1?0:phase===1?windowAt(p,.62,.70):step.insertion.decision==='reject'&&phase===4?1-rejecting:1;}
 return <StoredRecord key={frozen.id} record={frozen} x={x} y={y} opacity={opacity} mode={mode} readD={!prediction&&step.rd?.id===frozen.id} readY={!prediction&&mode==='DER++'&&step.ry?.id===frozen.id}/>;
 })}</g>
 {!prediction&&<><text x="414" y="392" className="wb-candidate-heading" opacity={windowAt(freeze,.88,1)*(1-ending)}>候选 z 已冻结 · 更新后才选留</text><g className="wb-exit-bay" opacity={phase===4?windowAt(p,.04,.25):0}><text x="770" y="420" className="wb-panel-kicker">更新后 · 在线选留</text><text x="770" y="458" className="wb-selector-title">{outcomeLabel(step)}</text><text x="770" y="490" className="wb-selector-note">{step.insertion.j===null?'空槽直接写入':'j='+step.insertion.j+' · K=2'}</text><text x="770" y="523" className="wb-exit-note">{p>=.88?'提交完成 · N='+state.N:'提交前 M、N 不变；移动结束再写入'}</text><text x="770" y="556" className="wb-exit-note">{step.insertion.decision==='reject'?'拒收候选已参与训练，N 仍增加 1':'其余记录与冻结 z 均保持不变'}</text></g></>}
 {prediction&&<g className="wb-query-result" data-query-result opacity={windowAt(p,.82,.98)}><rect x="961" y="293" width="277" height="105" rx="15" className="wb-query-panel"/><text x="982" y="323" className="wb-panel-kicker">只读输出</text><text x="982" y="355" className="wb-query-label">argmax → {MODEL_CLASSES[result.label]}</text><text x="982" y="380" className="wb-query-note">θ、M、N 均保持不变</text></g>}
 <rect data-focus-frame x={focusBox.x} y={focusBox.y} width={focusBox.w} height={focusBox.h} rx="18" fill="none" className="wb3-focus-frame" opacity={.4+.6*windowAt(p,.02,.18)}/>
 <text x="41" y="628" className="wb-boundary" data-transition-note>合成教学模型 · 读池 → 冻结 → 单次更新 → 后选留；数值由 trainStep 计算。</text>
 </svg></div>

 <div className="wb2-scrub"><label htmlFor="workbench-round-time">{prediction?'预测过程':'本轮时间'} · {prediction?'只读':Math.round((phase+p)/5*100)+'%'}</label><input id="workbench-round-time" data-round-scrub type="range" min="0" max="5" step="0.001" value={prediction?5:phase+p} disabled={prediction||timeline.reducedMotion} onChange={e=>scrub(Number(e.target.value))}/><span aria-live="polite">{jump}</span></div>
 <SceneTransport timeline={timeline} clips={WORKBENCH_CLIPS} label="四轮工作台" showTiming={false} teachingProgress/>
 <div className="wb2-round-nav"><button disabled={round===0&&!prediction} onClick={()=>jumpTo((prediction?3:round-1)*5)}>上一轮起点</button><button disabled={prediction} onClick={()=>jumpTo(round===3?20:(round+1)*5)}>{round===3?'定位只读预测':'下一轮起点'}</button><small>跨轮定位是状态跳转；不会把未观看的过程标成已播放。</small></div>
 <StepDetails step={step}/><p className="quiet-note">结构图保持 3–5–3 视觉示意，精确计算使用 W∈R³ˣ² 的线性模型；类别像素图仅标识身份。DER / DER++ 各自从相同初态重新计算，冻结 z 不随更新改写。</p>
 </section>;
}
