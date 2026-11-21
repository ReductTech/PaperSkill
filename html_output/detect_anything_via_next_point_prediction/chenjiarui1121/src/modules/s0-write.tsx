import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { AllBirds, BoxRect, C, EGRETS, LakeScene, TokenChip, clamp, iou, svgPoint, type Box } from './rex-kit';

// The reader plays the MLLM: draw boxes one by one (each becomes 4 coordinate tokens),
// then decide when to write the end marker. Hits / duplicates / drift / misses are computed live.
const GT: Box[] = EGRETS.map(e => e.box).sort((a, b) => a[0] - b[0]);
type Verdict = 'hit' | 'dup' | 'drift' | 'stray';

function judge(preds: Box[]) {
  const claimed = new Set<number>();
  const verdicts = preds.map(p => {
    let best = -1, bestIou = 0;
    GT.forEach((g, j) => { const v = iou(p, g); if (v > bestIou) { bestIou = v; best = j; } });
    let v: Verdict = bestIou >= .5 ? (claimed.has(best) ? 'dup' : 'hit') : bestIou > .1 ? 'drift' : 'stray';
    if (v === 'hit') claimed.add(best);
    return { v, iou: bestIou, gt: best };
  });
  return { verdicts, claimed };
}
const COLOR: Record<Verdict, string> = { hit: C.green, dup: C.red, drift: C.orange, stray: C.red };
const NAME: Record<Verdict, string> = { hit: '命中', dup: '重复', drift: '偏移', stray: '误框' };

export function S0Write(_: WidgetProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [preds, setPreds] = useState<Box[]>([]);
  const [draft, setDraft] = useState<Box | null>(null);
  const [ended, setEnded] = useState(false);
  const { verdicts, claimed } = judge(preds);
  const count = (v: Verdict) => verdicts.filter(x => x.v === v).length;
  const missed = GT.length - claimed.size;
  const hitIous = verdicts.filter(x => x.v === 'hit').map(x => x.iou);
  const meanIou = hitIous.length ? hitIous.reduce((a, b) => a + b, 0) / hitIous.length : 0;
  const pt = (e: React.PointerEvent) => { const p = svgPoint(svgRef.current!, e.clientX, e.clientY); return { x: clamp(p.x, 0, 1000), y: clamp(p.y, 0, 560) }; };
  const down = (e: React.PointerEvent) => {
    if (ended || !svgRef.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = pt(e); setDraft([p.x, p.y, p.x, p.y]);
  };
  const move = (e: React.PointerEvent) => { if (!draft) return; const p = pt(e); setDraft([draft[0], draft[1], p.x, p.y]); };
  const up = () => {
    if (!draft) return;
    const b: Box = [Math.min(draft[0], draft[2]), Math.min(draft[1], draft[3]), Math.max(draft[0], draft[2]), Math.max(draft[1], draft[3])];
    setDraft(null);
    if (b[2] - b[0] > 12 && b[3] - b[1] > 12) setPreds(ps => [...ps, b]);
  };
  const last = verdicts[verdicts.length - 1];
  const feedback = ended
    ? (missed === 0 && count('dup') === 0 && count('drift') === 0 && count('stray') === 0
      ? `5 只全部命中、没有多写，平均 IoU ${meanIou.toFixed(2)}。真实的 MLLM 恰恰常在这里出错。`
      : `结束后不能再补：漏检 ${missed} 只、重复 ${count('dup')} 个、偏移 ${count('drift')} 个。论文把这三类称为低召回、重复预测和坐标错位。`)
    : !last ? '在照片上按住拖动，给每只白鹭画一个框。写完后点“结束”。'
      : last.v === 'hit' ? `命中，IoU ${last.iou.toFixed(2)}。还有没有没框的？想停就点“结束”。`
        : last.v === 'dup' ? '这只已经框过：多写的框就是“重复预测”。'
          : last.v === 'drift' ? `框到了鸟，但只重合 ${Math.round(last.iou * 100)}%：这就是“坐标漂移”。`
            : '这个框没框住任何白鹭。';
  return <div className="rx-page rx-s0">
    <div className="rx-s0-left">
      <svg ref={svgRef} viewBox="0 0 1000 560" width="860" height="482" role="group" aria-label="按住拖动画框"
        className={ended ? '' : 'rx-draw'} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDraft(null)}>
        <LakeScene><AllBirds /></LakeScene>
        {ended && GT.filter((_, j) => !claimed.has(j)).map((g, i) => <g key={'m' + i}><BoxRect box={g} color={C.red} width={3} dashed />
          <rect x={g[0] - 2} y={g[1] - 40} width="44" height="36" rx="6" fill={C.red} /><path d={`M${g[0] + 10} ${g[1] - 30} l20 16 M${g[0] + 30} ${g[1] - 30} l-20 16`} stroke="#fff" strokeWidth="4" /></g>)}
        {preds.map((b, i) => <BoxRect key={i} box={b} color={COLOR[verdicts[i].v]} width={6} dashed={verdicts[i].v === 'dup'} />)}
        {draft && <BoxRect box={draft} color={C.blue} width={4} dashed />}
      </svg>
      <div className="rx-row">
        <button className="rx-btn rx-btn-main" disabled={ended} onClick={() => setEnded(true)}>结束，不再写框</button>
        <button className="rx-btn" disabled={ended || !preds.length} onClick={() => setPreds(preds.slice(0, -1))}>擦掉上一个框</button>
        <button className="rx-btn" onClick={() => { setPreds([]); setEnded(false); }}>重来</button>
      </div>
    </div>
    <div className="rx-s0-right">
      <div className="rx-counters rx-s0-counters" aria-live="polite">
        <span className="is-good"><b>{count('hit')}</b>命中</span>
        <span className="is-bad"><b>{count('dup')}</b>重复</span>
        <span className="is-warn"><b>{count('drift')}</b>偏移</span>
        <span className="is-bad"><b>{ended ? missed : '?'}</b>漏检</span>
      </div>
      <p className="rx-text">{feedback}</p>
      <div className="rx-notebook rx-s0-notebook">
        {preds.length === 0 ? <p className="rx-text rx-muted">写出的框会按顺序列在这里。</p> :
          <div className="rx-tokline">{preds.slice(-4).map((b, i) => <TokenChip key={i} text={`[${b.map(Math.round).join(', ')}]`} kind={verdicts[preds.length - Math.min(4, preds.length) + i].v === 'hit' ? 'coord' : 'bad'} />)}</div>}
      </div>
      <p className="rx-text rx-muted">{preds.length > 4 ? `只显示最后 4 个框，共写了 ${preds.length} 个。` : '框的颜色：绿 命中，橙 偏移，红 重复或误框。判定规则见讲稿。'}</p>
    </div>
  </div>;
}
