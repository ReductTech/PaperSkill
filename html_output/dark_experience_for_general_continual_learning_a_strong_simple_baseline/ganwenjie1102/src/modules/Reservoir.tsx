import { useMemo, useState } from 'react';
import SceneTransport, { useSceneTimeline } from './review/SceneTransport';
import ModelPixel from './review/ModelPixel';
import { MODEL_CLASSES } from '../data/model-classes';
import { curve, windowAt } from './review/lifecycle-model';
import { MotionTrail } from './review/MotionTrail';
import { RESERVOIR_CLIPS, RESERVOIR_INPUTS, reservoirInsert, type MemoryRecord, type MemoryState } from './reservoir-model';
import { ReferenceButton } from './Reference';
import { LessonCue, LessonPath } from './LessonGuidance';
import './der-redesign.css';
import './later-chapters.css';

const MAIN_CLIPS = RESERVOIR_CLIPS.slice(2);
const ATTENTION = ['抽签', '比较', '选留', '提交'];
function RecordTile({ record, x, y, width = 280, opacity = 1, hideIcon = false }: {
  record: MemoryRecord; x: number; y: number; width?: number; opacity?: number; hideIcon?: boolean;
}) {
  return <g transform={'translate(' + x + ' ' + y + ')'} opacity={opacity}
    data-record={record.id} data-frozen={record.z.join(',')} data-origin={record.origin}>
    <rect width={width} height="96" rx="12" className="rv2-record" />
    {!hideIcon && <ModelPixel model={record.model} x={14} y={26} size={43} />}
    <text x="72" y="29" className="rv2-record-title">{record.id} <tspan className="rv2-category">{MODEL_CLASSES[record.model]}</tspan></text>
    <text x="72" y="54" className="rv2-note">z 来自更新前 {record.origin}</text>
    <text x="72" y="80" className="rv3-vector lesson-math">z = ({record.z.join(', ')})</text>
  </g>;
}

export default function Reservoir({ focused = false }: { focused?: boolean; chapterId?: string; moduleId?: string }) {
  const timeline = useSceneTimeline(focused ? RESERVOIR_CLIPS : MAIN_CLIPS);
  const localClip = timeline.state.clipIndex, clip = localClip + (focused ? 0 : 2), p = timeline.state.progress;
  const [draws, setDraws] = useState([0, 3]);
  const steps = useMemo(() => {
    let state: MemoryState = { K: 2, N: 0, M: [] };
    return RESERVOIR_INPUTS.map((candidate, i) => {
      const step = reservoirInsert(state, candidate, i >= 2 ? draws[i - 2] : undefined);
      state = step.after;
      return step;
    });
  }, [draws]);
  const step = steps[clip], committed = p >= .9, state = committed ? step.after : step.before;
  const accepted = step.slot !== null, empty = step.before.N < state.K;
  const focus = p < .18 ? 0 : p < .38 ? 1 : p < .9 ? 2 : 3;
  const slotY = (slot: number) => 140 + slot * 126;
  const moving = windowAt(p, .38, .82), leaving = windowAt(p, .38, .56);
  const points = [{ x: 71.5, y: 227.5 }, { x: 71.5, y: 420 }, { x: 700, y: 420 }, { x: 789.5, y: slotY(step.slot ?? 0) + 47.5 }] as const;
  const at = curve(moving, ...points);
  const originFade = windowAt(p, accepted ? .28 : .4, accepted ? .38 : .7);
  const outcome = empty ? '空槽直接接收' : accepted ? 'j=' + step.j + ' < K，替换 slot ' + step.slot : 'j=' + step.j + ' ≥ K，保留原来的记忆';
  const title = [empty ? '看空槽：本轮无需抽签' : '看中间：抽取一个整数 j', '看比较：' + outcome,
    accepted ? '看 slot ' + step.slot + '：' + step.candidate.id + (empty ? ' 写入空位' : ' 替换 ' + step.evicted?.id) : '看左侧：候选淡出，旧池不动',
    '本轮完成：N 从 ' + step.before.N + ' 增加到 ' + step.after.N][focus];
  const detail = focus < 2 ? '候选已参与训练，记忆池此刻尚未改变。' : focus === 2 ? '短尾迹只跟随记录副本；冻结 z 不会重算。' : '无论是否入池，本轮训练都有效。';
  const choose = (j: number) => {
    setDraws(values => values.map((value, i) => i === clip - 2 ? j : value));
    timeline.playFrom(localClip);
  };

  return <section className="der-redesign later-lesson reservoir-lesson" data-scene="reservoir" data-clip={clip}
    data-progress={p} data-status={timeline.state.status} data-seen={state.N} data-memory={state.M.map(r => r.id).join(',')}
    data-committed={committed} data-focus={focus}>
    <header className="later-scene-heading"><div><h3>{empty ? '先填空槽，再看满池抽签。' : '记忆已满，下一条该留给谁？'}</h3><p>候选、抽签与双槽在同一条视线上。先判断去向，再观察指定槽位的替换；其他记录保持原位。</p></div>
      <dl className="later-state-strip"><div><dt>容量 K</dt><dd>{state.K}</dd></div><div><dt>已处理 N</dt><dd>{state.N}</dd></div><div><dt>池中记录</dt><dd>{state.M.length}</dd></div></dl>
    </header>
    {!empty && <details className="rv3-manual"><summary>手动指定 j，观察另一种结果</summary><div className="rv2-manual"><span>手动抽样演示</span>
      {Array.from({ length: step.before.N + 1 }, (_, j) => <button key={j} aria-pressed={step.j === j} onClick={() => choose(j)}>j = {j}</button>)}<small>选择后直接播放，不额外执行训练。</small>
    </div></details>}
    <LessonCue steps={ATTENTION} active={focus} title={title} detail={detail} />
    <div className="rv3-stage"><svg className="rv-canvas teaching-canvas" viewBox="0 0 1120 460" role="img" aria-label="候选、抽签判断和固定双槽依次聚焦；替换仅改变选定槽位，拒收不改变旧池">
      <text x="36" y="143" className="later-svg-title">本轮候选 (x,z)</text>
      <text x="36" y="166" className="later-svg-note">已经完成当前训练</text>
      <rect x="36" y="180" width="280" height="96" rx="12" className="rv3-origin-outline" />
      {committed && <text x="176" y="236" textAnchor="middle" className="later-svg-note">{accepted ? step.candidate.id + ' 已进入 slot ' + step.slot : step.candidate.id + ' 本轮不入池'}</text>}


      <g data-attention-object="draw" data-active={focus < 2}>
        <rect x="365" y="110" width="300" height="196" rx="16" className={focus < 2 ? 'rv3-decision is-active' : 'rv3-decision'} />
        <text x="389" y="144" className="later-svg-title">{empty ? '槽位尚未填满' : '从 0 到 N 等概率抽取'}</text>
        {!empty && Array.from({ length: step.before.N + 1 }, (_, j) => <g key={j} transform={'translate(' + (389 + j * 61) + ' 162)'}>
          <rect width="46" height="44" rx="8" className={j === step.j && p >= .12 ? 'rv2-draw is-selected' : 'rv2-draw'} />
          <text x="23" y="30" textAnchor="middle" className="rv2-number lesson-math">{j}</text>
        </g>)}
        <text x="389" y="247" className="rv3-comparison lesson-math">{focus === 0 ? (empty ? '|M| < K' : 'j = ?') : empty ? '直接追加' : 'j = ' + step.j + (accepted ? ' < K' : ' ≥ K')}</text>
        <text x="389" y="279" className="later-svg-note">{focus === 0 ? (empty ? '空槽可用，不需要抽签' : '先观察号码，再看它是否小于 K') : accepted ? '只改变 slot ' + step.slot : '旧记录全部保留'}</text>
      </g>
      <g opacity={focus < 2 ? 1 : .35}><LessonPath d="M316 228H365" /></g>
      {accepted && <LessonPath d="M665 228H730" progress={windowAt(p, .18, .32)} />}
      {!accepted && focus >= 1 && <g><path d="M686 216L700 230M700 216L686 230" className="rv3-reject-mark"/><text x="693" y="255" textAnchor="middle" className="later-svg-note">止于此</text></g>}

      <rect x="730" y="68" width="360" height="326" rx="20" className="rv2-memory" />
      <text x="754" y="104" className="later-svg-title">记忆 M</text>
      <text x="1066" y="104" textAnchor="end" className="later-svg-note">固定两个槽位</text>
      {[0, 1].map(slot => <g key={slot} data-attention-object={'slot-' + slot}>
        <text x="754" y={slotY(slot) - 10} className="rv2-slot-label">slot {slot}</text>
        <rect x="754" y={slotY(slot)} width="312" height="96" rx="12" className="rv2-slot" />
        {!state.M[slot] && <text x="910" y={slotY(slot) + 56} textAnchor="middle" className="later-svg-note">空位</text>}
      </g>)}
      {state.M.map((record, slot) => <RecordTile key={record.id} record={record} x={754} y={slotY(slot)} width={312}
        opacity={!committed && step.decision === 'replace' && slot === step.slot ? 1 - leaving : 1} />)}
      {!committed && <RecordTile record={step.candidate} hideIcon={accepted}
        x={accepted && p >= .38 ? 754 : 36} y={accepted && p >= .38 ? slotY(step.slot!) : 180}
        width={accepted && p >= .38 ? 312 : 280}
        opacity={accepted && p >= .38 ? windowAt(p, .8, .9) : 1 - originFade} />}
      {accepted && focus >= 1 && <rect x="750" y={slotY(step.slot!) - 4} width="320" height="104" rx="15" fill="none" className="rv3-slot-focus" opacity={windowAt(p, .18, .32)} />}
      {accepted && !committed && <g data-record-token data-position={at.x + ',' + at.y}>
        <MotionTrail points={points} progress={moving} className="lesson-record-trail" />
        <ModelPixel model={step.candidate.model} x={at.x-21.5} y={at.y-21.5} size={43}/>
        <text x={at.x+32} y={at.y+5} className="rv3-vector lesson-math" opacity={windowAt(p,.38,.46)*(1-windowAt(p,.67,.78))}>z = ({step.candidate.z.join(', ')})</text>
      </g>}
      <text x="36" y="431" className="later-svg-note">{committed ? '提交完成：M=[' + state.M.map(r => r.id).join(', ') + ']，N=' + state.N : '候选的 z 始终固定；只有提交时才改变 M 与 N。'}</text>
    </svg></div>

    <SceneTransport timeline={timeline} clips={focused ? RESERVOIR_CLIPS : MAIN_CLIPS} label="在线记忆选留" showTiming={false} teachingProgress />
    <div className="later-reading-pair"><div><h4>公平针对流项，不保证类别均衡。</h4><p>满池时从 N+1 个整数中等概率抽签，当前候选入池概率为 K/(N+1)。处理完 n≥K 条数据后，每个流项的边际留存概率都是 K/n。</p><p className="rv-inline-rule">j ∼ Uniform&#123;0,…,N&#125;；j &lt; K 时替换 slot j；无论结果如何，N ← N + 1。</p></div><div><h4>本条没留下，也已经学过。</h4><p>拒收决定未来的回放机会，不撤销当前样本已经参与的训练。此处 z 是给定冻结值，独立演示在线选留。</p><ReferenceButton term="reservoir">展开 K/n 的归纳解释</ReferenceButton></div></div>
  </section>;
}
