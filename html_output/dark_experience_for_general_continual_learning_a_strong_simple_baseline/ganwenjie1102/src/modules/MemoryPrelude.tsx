import SceneTransport, { useSceneTimeline } from './review/SceneTransport';
import { LIFECYCLE_FIXTURE as F } from './review/lifecycle-model';
import { MODEL_CLASSES } from '../data/model-classes';
import { NETWORK_NODE_FRACTIONS } from './DerPrimitives';
import { mix, windowAt } from './review/lifecycle-model';

const CLIPS = [
  { id: '更新前取得输出', durationMs: 3600, holdMs: 1200 },
  { id: '复制并冻结数值', durationMs: 3600, holdMs: 1500 },
  { id: '参数改变，副本不变', durationMs: 2600, holdMs: 1300 },
] as const;

function ResponseSlip({ x, frozen = false, copied = [1,1,1] }: {
  x: number;
  frozen?: boolean;
  copied?: number[];
}) {
  return <g transform={`translate(${x} 80)`} className="origin-slip" data-kind={frozen ? 'frozen' : 'source'}>
    <rect width="252" height="228" rx="12" className="origin-slip-surface" />
    <path d="M18 61H234" className="origin-slip-rule" />
    <text x="27" y="148" className="origin-slip-symbol">{frozen ? 'z₁' : 'h(x₁)'}</text>
    {MODEL_CLASSES.map((name, k) => <g key={name}>
      <text x={91 + k * 60} y="39" textAnchor="middle" className={`origin-class origin-class-${k}`}>{name}</text>
      {frozen && <text x={91+k*60} y="148" textAnchor="middle" className="origin-placeholder" opacity={1-copied[k]}>—</text>}
      <text x={91 + k * 60} y="148" textAnchor="middle" className="origin-value" opacity={copied[k]}>{F.z[k]}</text>
    </g>)}
  </g>;
}

function CurrentModel({ updated, updating }: { updated: boolean; updating: boolean }) {
  const layers = NETWORK_NODE_FRACTIONS.map(layer => layer.map(y => y * 124));
  return <g className="origin-model" data-updating={updating}>
    <rect x="48" y="80" width="210" height="228" rx="12" className="origin-model-surface" />
    <text x="153" y="123" textAnchor="middle" className="origin-theta">{updated ? 'θ₁' : 'θ₀'}</text>
    <g transform="translate(97 157)">
      {layers.slice(0, -1).flatMap((layer, l) => layer.flatMap((cy, i) => layers[l + 1].map((ny, j) =>
        <line key={`${l}-${i}-${j}`} x1={l * 56} y1={cy} x2={(l + 1) * 56} y2={ny} />)))}
      {layers.flatMap((layer, l) => layer.map((cy, i) => <circle key={`${l}-${i}`} cx={l * 56} cy={cy} r="4" />))}
    </g>
  </g>;
}

export function SnapshotOrigin() {
  const t = useSceneTimeline(CLIPS), { clipIndex: step, progress: p } = t.state;
  const copy = step > 1 ? 1 : step === 1 ? p * p * (3 - 2 * p) : 0;
  const updated = step === 2 && p === 1;
  const transfers = F.z.map(()=>windowAt(copy,.12,.88));
  const arrivals = transfers.map(v=>windowAt(v,.88,1));

  return <figure className="der-origin" data-front-scene="snapshot-origin" data-step={step} data-progress={p} data-theta={updated ? 1 : 0} data-frozen={copy === 1} data-target={F.z.join(',')}>
    <div className="origin-figure-heading"><h4>复制的是输出，继续学习的是模型。</h4><p>冻结发生在参数更新之前。</p></div>
    <div className="der-diagram-scroll"><svg className="origin-canvas" viewBox="0 0 1060 370" role="img" aria-label="当前模型产生更新前输出，三个数值从来源整组复制、移动并落入目标列，然后模型参数变为θ₁，副本保持不变且尚未入池">
      <text x="153" y="55" textAnchor="middle" className="origin-object-title">唯一当前模型</text>
      <text x="491" y="55" textAnchor="middle" className="origin-object-title">θ₀ 的更新前输出</text>
      <text x="876" y="55" textAnchor="middle" className="origin-object-title">冻结的历史目标</text>
      <path d="M258 194H365m-7 -5 7 5-7 5" className="origin-forward-link" />
      <path d="M617 194H750m-7 -5 7 5-7 5" className="origin-copy-link" />
      <text x="311" y="179" textAnchor="middle" className="origin-link-label">前向</text>
      <text x="683" y="316" textAnchor="middle" className="origin-link-label">复制</text>
      <CurrentModel updated={updated} updating={step === 2 && p > 0 && !updated} />
      <ResponseSlip x={365} />
      <ResponseSlip x={750} frozen copied={arrivals}/>
      {copy > 0 && <g data-vector-id="snapshot:frozen-copy" data-values={F.z.join(',')}>
        {F.z.map((value,k)=>{const v=transfers[k],start=456+k*60,x=mix(start,start+385,v),y=228-58*Math.sin(Math.PI*v),fade=windowAt(copy,.04,.12)*(1-arrivals[k]);return <g key={k} className="origin-numeric-transfer" data-transfer={v} opacity={fade}>
          <path d={`M${mix(start,x,.90)} ${y+5}L${x-14} ${y+5}`} className="origin-value-trail"/>
          <text x={x} y={y} textAnchor="middle" className="origin-value">{value}</text>
        </g>;})}
      </g>}
      <text x="153" y="343" textAnchor="middle" className="origin-object-note">{updated ? '参数已更新为 θ₁' : '当前参数 θ₀'}</text>
      <text x="491" y="343" textAnchor="middle" className="origin-object-note">保留来源，整组复制数值</text>
      <text x="876" y="343" textAnchor="middle" className="origin-object-note">{copy === 1 ? '数值固定 · 尚未入池' : '等待更新前的输出副本'}</text>
      {copy === 1 && <g transform="translate(991 65)" className="origin-freeze-mark" aria-label="历史目标已冻结">
        <path d="M-4 0v-4a4 4 0 0 1 8 0v4" /><rect x="-7" width="14" height="11" rx="2" /><path d="M0 4v3" />
      </g>}
    </svg></div>
    <figcaption aria-live="polite">{[
      '用本步更新前的模型产生整组输出，作为这份历史记录的来源。',
      '复制输出数值并冻结为 z₁；来源保留，此时模型参数尚未更新。',
      '模型继续更新到 θ₁，冻结副本仍为 (2,1,0)。完成更新后，候选才有机会入池。',
    ][step]}</figcaption>
    <SceneTransport timeline={t} clips={CLIPS} label="历史目标的来源" showTiming={false} teachingProgress />
  </figure>;
}
