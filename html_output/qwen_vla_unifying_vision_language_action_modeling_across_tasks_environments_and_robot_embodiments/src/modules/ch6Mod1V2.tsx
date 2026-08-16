import React, { useEffect, useMemo, useState } from 'react';
import { PsChip, PsFeedback } from '../components/ps-controls';
import {
  BENCHMARKS, computeDelta, getBestSpecialist, getQwenInstructScore, getSpecialistsForBenchmark, tweenValue, type BenchmarkId,
} from './ch6EvidenceData';
import type { WidgetProps } from './registry';

function useCountUp(target: number, dep: unknown, ms = 620) {
  const [val, setVal] = useState(0);
  useEffect(() => { const start = performance.now(); let raf = 0; const tick = (now: number) => { const t = Math.min(1, (now - start) / ms); setVal(tweenValue(0, target, t)); if (t < 1) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [target, dep, ms]);
  return val;
}

function SceneGlyph({ scene }: { scene: string }) {
  return <div className={`c6m1x-scene-glyph is-${scene}`} aria-hidden="true"><span className="c6m1x-table" /><i className="c6m1x-arm a" /><i className="c6m1x-arm b" /><b /></div>;
}

export const Ch6Mod1V2: React.FC<WidgetProps> = () => {
  const [bench, setBench] = useState<BenchmarkId>('libero');
  const [mode, setMode] = useState<'all' | 'best'>('best');
  const meta = BENCHMARKS.find((b) => b.id === bench)!;
  const qwen = getQwenInstructScore(bench) ?? 0;
  const best = getBestSpecialist(bench);
  const delta = computeDelta(bench);

  const rows = useMemo(() => {
    const specialists = getSpecialistsForBenchmark(bench).map(({ model, score }) => ({ id: model.id, name: model.name, score, type: 'specialist' as const }));
    const q = { id: 'qwen-instruct', name: 'Qwen‑VLA‑Instruct', score: qwen, type: 'generalist' as const };
    return (mode === 'best' && best ? [q, { id: best.model.id, name: best.model.name, score: best.score, type: 'specialist' as const }] : [q, ...specialists]).sort((a, b) => b.score - a.score);
  }, [bench, mode, best, qwen]);

  const qAnim = useCountUp(qwen, bench);
  const bestAnim = useCountUp(best?.score ?? 0, bench);

  return (
    <div className="c6m1x-lab">
      <div className="c6m1x-tabs">{BENCHMARKS.map((b) => <PsChip key={b.id} selected={bench === b.id} onClick={() => setBench(b.id)}>{b.label}</PsChip>)}</div>

      <div className="c6m1x-arena">
        <aside className="c6m1x-scene">
          <span className="c6m1x-kicker">当前赛场</span>
          <SceneGlyph scene={meta.scene} />
          <strong>{meta.label}</strong>
          <small>同一 benchmark 内直接比较</small>
          <div className="c6m1x-mode"><button type="button" className={mode === 'best' ? 'is-active' : ''} onClick={() => setMode('best')}>只看最佳专用策略</button><button type="button" className={mode === 'all' ? 'is-active' : ''} onClick={() => setMode('all')}>全部模型</button></div>
        </aside>

        <section className="c6m1x-race">
          <div className="c6m1x-axis">{[0, 25, 50, 75, 100].map((v) => <span key={v} style={{ left: `${v}%` }}>{v}</span>)}</div>
          <div className="c6m1x-lanes">{rows.map((r, idx) => {
            const isQwen = r.type === 'generalist';
            const isBest = !isQwen && best && r.name === best.model.name && r.score === best.score;
            return <div key={r.id} className={`c6m1x-lane${isQwen ? ' is-qwen' : ''}${isBest ? ' is-best' : ''}`}>
              <span className="c6m1x-rank">{idx + 1}</span><span className="c6m1x-name">{r.name}</span>
              <div className="c6m1x-track"><i className="c6m1x-grid" /><b style={{ width: `${r.score}%` }}><em /></b></div><strong>{r.score.toFixed(1)}</strong>
            </div>;
          })}</div>
          {mode === 'best' && delta && best ? <div className={`c6m1x-gap${delta.delta >= 0 ? ' is-win' : ' is-near'}`}><span>Qwen 与最佳专用策略差值</span><b>{delta.delta >= 0 ? '+' : ''}{delta.delta.toFixed(1)}</b><p>{delta.delta >= 0 ? '通用模型在该 benchmark 上达到或超过最佳专用策略。' : '通用模型与最佳专用策略保持接近。'}</p></div> : null}
        </section>

        <aside className="c6m1x-scoreboard">
          <div className="c6m1x-score is-qwen"><span>通用模型</span><strong>{qAnim.toFixed(1)}</strong><small>Qwen‑VLA‑Instruct</small></div>
          <div className="c6m1x-versus">VS</div>
          <div className="c6m1x-score is-best"><span>最佳专用策略</span><strong>{bestAnim.toFixed(1)}</strong><small>{best?.model.name ?? '—'}</small></div>
          <div className="c6m1x-summary"><b>{delta?.delta != null ? `${delta.delta >= 0 ? '+' : ''}${delta.delta.toFixed(1)}` : '—'}</b><span>{delta && delta.delta >= 0 ? 'Qwen 领先' : '与最佳专用策略差距'}</span></div>
        </aside>
      </div>

      <PsFeedback tone={delta && delta.delta >= 0 ? 'good' : 'neutral'}>{meta.label}：这里比较的是同一 benchmark 内的 Qwen‑VLA‑Instruct 与专用策略。</PsFeedback>
    </div>
  );
};

export default Ch6Mod1V2;
