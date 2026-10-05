import { useState } from 'react';
import { C, Scene, Feedback, Readout, Source, line, arrow, roundRect } from './lada-kit';

const OLD_TRUE = 2.2;
const OLD_OTHER = 0.8;
const ETA = 0.8;
const MAX_STEPS = 12;

function evaluate(newScore: number) {
  const logits = [OLD_TRUE, OLD_OTHER, newScore];
  const maximum = Math.max(...logits);
  const exponentials = logits.map(value => Math.exp(value - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  const probabilities = exponentials.map(value => value / total);
  return { probabilities, loss:maximum + Math.log(total) - OLD_TRUE, winner:logits.indexOf(maximum) };
}

const styles = `
.lada-five { color:#24352d; }
.lada-five-intro { display:flex; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:8px; margin:0 0 12px; }
.lada-five-intro strong { font-size:14px; font-weight:650; }
.lada-five-intro span,.lada-five-axis { color:#61716b; font-size:12px; }
.lada-five-slider { display:grid; grid-template-columns:auto minmax(110px,1fr) 42px; align-items:center; gap:14px; padding:13px 16px; border:1px solid #dce5d9; border-radius:12px; background:#fbfcf8; }
.lada-five-slider label { font-size:14px; font-weight:650; }
.lada-five-slider input { width:100%; min-width:0; accent-color:#c43f52; cursor:pointer; }
.lada-five-slider output { font-variant-numeric:tabular-nums; font-size:18px; font-weight:700; color:#c43f52; text-align:right; }
.lada-five-actions { display:flex; flex-wrap:wrap; align-items:center; gap:9px; margin:13px 0; }
.lada-five-actions button { font:inherit; font-size:13px; min-height:42px; padding:9px 14px; border-radius:9px; border:1px solid #27446e; background:#27446e; color:#fff; cursor:pointer; }
.lada-five-actions button.lada-five-reset { color:#27446e; background:#fff; border-color:#d0dccd; }
.lada-five-actions button:hover { filter:brightness(.95); }
.lada-five-actions button:disabled { cursor:default; background:#e5ece0; border-color:#d0dccd; color:#61716b; filter:none; }
.lada-five-actions button:focus-visible,.lada-five-slider input:focus-visible { outline:3px solid #a3c1e8; outline-offset:3px; }
.lada-five-step { font-size:12px; color:#61716b; margin-left:3px; }
.lada-five-axis { display:flex; gap:10px; justify-content:space-between; margin:8px 0 15px; }
.lada-five-classes { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; margin:0 0 16px; }
.lada-five-class { min-width:0; padding:12px 8px; text-align:center; border-radius:11px; border:1px solid #dce5d9; background:#fff; }
.lada-five-class[data-winner=true] { border-color:#228d5c; background:#f1f8f1; }
.lada-five-class[data-new=true][data-winner=true] { border-color:#c43f52; background:#fdf3f4; }
.lada-five-class strong { display:block; font-variant-numeric:tabular-nums; font-size:22px; color:#27446e; margin:5px 0 3px; }
.lada-five-class[data-new=true] strong { color:#c43f52; }
.lada-five-class b { font-size:12px; font-weight:600; }
.lada-five-class span { display:block; font-size:11px; color:#61716b; line-height:1.55; }
.lada-five-change { margin:16px 0; padding:13px 15px; border-left:3px solid #228d5c; background:#f2f7ee; border-radius:0 10px 10px 0; }
.lada-five-change p { margin:0; font-size:13px; line-height:1.75; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
.lada-five-change p + p { margin-top:4px; color:#61716b; font-size:12px; }
@media(max-width:560px) { .lada-five-slider { padding:11px; gap:8px; } .lada-five-slider label { font-size:12px; } .lada-five-classes { gap:6px; } .lada-five-class { padding:10px 4px; } .lada-five-class strong { font-size:19px; } .lada-five-axis { font-size:11px; } }
`;

type Update = { before:number; after:number; beforeLoss:number; afterLoss:number; gradient:number };

export function LadaFive() {
  const [newScore, setNewScore] = useState(3.2);
  const [startScore, setStartScore] = useState(3.2);
  const [steps, setSteps] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Update | null>(null);
  const result = evaluate(newScore);
  const start = evaluate(startScore);
  const correct = result.winner === 0;
  const tie = newScore === OLD_TRUE;
  const lossDrop = start.loss - result.loss;
  const resetTo = (value: number) => {
    setNewScore(value);
    setStartScore(value);
    setSteps(0);
    setLastUpdate(null);
  };
  const updateOnce = () => {
    if (steps >= MAX_STEPS) return;
    const gradient = result.probabilities[2];
    const after = newScore - ETA * gradient;
    setLastUpdate({ before:newScore, after, beforeLoss:result.loss, afterLoss:evaluate(after).loss, gradient });
    setNewScore(after);
    setSteps(steps + 1);
  };

  return <div className="lada-five" onKeyDown={event => event.stopPropagation()}>
    <style>{styles}</style>
    <div className="lada-five-intro"><strong>当前输入携带旧真实类标签</strong><span>教学示例 · 对新类 logit 的一维梯度 · η = 0.8</span></div>
    <div className="lada-five-slider">
      <label htmlFor="lada-five-new">新类分数起点</label>
      <input id="lada-five-new" type="range" min="0" max="4" step="0.1" value={startScore} onChange={event => resetTo(Number(event.target.value))} onKeyDown={event => event.stopPropagation()} />
      <output htmlFor="lada-five-new">{startScore.toFixed(1)}</output>
    </div>
    <div className="lada-five-actions">
      <button type="button" disabled={steps >= MAX_STEPS} onClick={updateOnce} onKeyDown={event => event.stopPropagation()}>{steps >= MAX_STEPS ? '本轮 12 次约束完成' : '施加一次原型约束'}</button>
      <button className="lada-five-reset" type="button" onClick={() => resetTo(3.2)} onKeyDown={event => event.stopPropagation()}>重置</button>
      <span className="lada-five-step">已约束 {steps} / {MAX_STEPS} 次</span>
    </div>
    <Scene label={`旧真实类分数固定 2.2，另一旧类固定 0.8，新类为 ${newScore.toFixed(4)}。当前最高分为${correct ? '旧真实类' : '新类'}。`} height={280} draw={(ctx, w, h) => {
      const baseline = h * 0.79;
      const unit = h * 0.145;
      const left = w * 0.09;
      const right = w * 0.91;
      for (let value = 0; value <= 4; value++) line(ctx, left, baseline - value * unit, right, baseline - value * unit, C.line, value === 0 ? 1.6 : 0.7);
      const scores = [OLD_TRUE, OLD_OTHER, newScore];
      scores.forEach((score, index) => {
        const cx = w * (0.23 + index * 0.27);
        const bw = Math.min(74, w * 0.12);
        const color = index === 2 ? (correct ? C.orange : C.red) : (index === 0 && correct ? C.green : C.blue);
        const displayed = Math.max(-0.85, score);
        if (displayed >= 0) roundRect(ctx, cx - bw / 2, baseline - displayed * unit, bw, Math.max(2, displayed * unit), 6, color);
        else roundRect(ctx, cx - bw / 2, baseline, bw, Math.max(2, -displayed * unit), 6, color);
        if (index < 2) {
          const ly = baseline - score * unit - 24;
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.7;
          ctx.beginPath(); ctx.arc(cx, ly - 2, 5, Math.PI, 0); ctx.stroke();
          roundRect(ctx, cx - 7, ly - 1, 14, 11, 2, '#f6f9f1', color);
          ctx.restore();
        }
        if (index === result.winner) {
          const markerY = baseline - Math.max(0, displayed) * unit - (index < 2 ? 44 : 18);
          line(ctx, cx - 7, markerY, cx - 1, markerY + 6, color, 2.5);
          line(ctx, cx - 1, markerY + 6, cx + 9, markerY - 7, color, 2.5);
        }
        if (score < -0.85) arrow(ctx, cx, baseline + unit * 0.66, cx, baseline + unit * 1.06, color, 2);
      });
    }} />
    <div className="lada-five-axis"><span>纵轴：logit，正向固定刻度 0–4</span><span>{newScore < -0.85 ? '向下箭头：新类分数低于 −0.85' : '锁形标记：旧类分数固定'}</span></div>
    <div className="lada-five-classes">
      {[{ name:'旧真实类', value:OLD_TRUE }, { name:'另一旧类', value:OLD_OTHER }, { name:'新类', value:newScore }].map((item, index) => <div className="lada-five-class" key={item.name} data-winner={index === result.winner} data-new={index === 2}>
        <b>{item.name}</b><strong>{item.value.toFixed(index === 2 ? 4 : 1)}</strong><span>{index < 2 ? '分数固定' : '分数随约束更新'}</span><span>{(result.probabilities[index] * 100).toFixed(1)}%</span>
      </div>)}
    </div>
    <Readout items={[
      { label:'argmax', value:tie ? '旧真实类 / 新类并列' : correct ? '旧真实类' : '新类' },
      { label:'旧样本 CE', value:result.loss.toFixed(4) },
      { label:'CE 累计下降', value:lossDrop.toFixed(4) },
      { label:'真实类概率', value:`${(result.probabilities[0] * 100).toFixed(1)}%` },
    ]} />
    <div className="lada-five-change" aria-live="polite">
      {lastUpdate ? <>
        <p>最近一步：{lastUpdate.before.toFixed(4)} − 0.8 × {lastUpdate.gradient.toFixed(4)} = {lastUpdate.after.toFixed(4)}</p>
        <p>旧样本 CE：{lastUpdate.beforeLoss.toFixed(4)} → {lastUpdate.afterLoss.toFixed(4)}，下降 {(lastUpdate.beforeLoss - lastUpdate.afterLoss).toFixed(4)}。</p>
      </> : <>
        <p>本次梯度 ∂L / ∂z<sub>new</sub> = p<sub>new</sub> = {result.probabilities[2].toFixed(4)}</p>
        <p>下一次约束将把新类分数从 {newScore.toFixed(4)} 更新到 {(newScore - ETA * result.probabilities[2]).toFixed(4)}。</p>
      </>}
    </div>
    <Feedback tone={tie ? 'neutral' : correct ? 'good' : 'bad'}>
      {tie ? '旧真实类与新类的分数均为 2.2，两者并列最高。' : correct
        ? `旧真实类${steps > 0 ? '重新' : ''}成为最高分。新类分数为 ${newScore.toFixed(4)}，旧类概率 ${(result.probabilities[0] * 100).toFixed(1)}%，交叉熵 ${result.loss.toFixed(4)}；两项旧类分数始终固定。`
        : `旧类分数保持 2.2，但新类分数 ${newScore.toFixed(4)} 更高，旧样本被归为新类。${steps > 0 ? `当前交叉熵 ${result.loss.toFixed(4)}，继续约束会按新类概率降低其分数。` : '施加原型约束可观察旧标签监督的梯度。'}`}
    </Feedback>
    <Source page={4} label="公式 7–8 及第 5 页公式 9–10 · 旧类原型监督" />
  </div>;
}
