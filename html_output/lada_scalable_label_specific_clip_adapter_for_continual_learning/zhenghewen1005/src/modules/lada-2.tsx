import { useState } from 'react';
import { C, Scene, Feedback, Readout, Source, drawCard, drawAlbum, arrow, line, text } from './lada-kit';

const anchors = [{ label: '猫', angle: 0, color: '#27446e' }, { label: '狗', angle: 2.1, color: '#7c3aed' }, { label: '鸟', angle: 4.2, color: '#7e6951' }];
const tau = 2 * Math.PI;
const circleGeometry = (w: number, h: number) => ({ x: w < 480 ? w * 0.58 : w * 0.66, y: h * 0.52, r: Math.min(h * 0.32, w * 0.275) });
const normalizeAngle = (value: number) => (value % tau + tau) % tau;

export function LadaTwo() {
  const [angle, setAngle] = useState(0.4);
  const similarities = anchors.map(anchor => Math.cos(angle - anchor.angle));
  const scores = similarities.map(value => 4 * value);
  const maxScore = Math.max(...scores);
  const exponents = scores.map(score => Math.exp(score - maxScore));
  const denominator = exponents.reduce((sum, value) => sum + value, 0);
  const probabilities = exponents.map(value => value / denominator);
  const winner = scores.indexOf(maxScore);

  return <div className="lada-two" onKeyDown={event => event.stopPropagation()}>
    <style>{`
      .lada-two .lada-two-actions{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
      .lada-two .lada-two-button{font:inherit;font-size:14px;border:1px solid #c7d4bf;background:#fff;border-radius:8px;padding:10px 14px;cursor:pointer;color:#27446e;min-height:44px}
      .lada-two .lada-two-button[aria-pressed="true"]{background:#27446e;color:#fff;border-color:#27446e}
      .lada-two .lada-two-button:focus-visible{outline:3px solid #f07e47;outline-offset:3px}
      .lada-two .lada-two-help{font-size:14px;line-height:1.7;color:#526357;margin:12px 0}
      .lada-two .lada-two-table-wrap{overflow-x:auto;margin:14px 0}
      .lada-two .lada-two-table{border-collapse:collapse;width:100%;font-size:14px;text-align:left;font-variant-numeric:tabular-nums}
      .lada-two .lada-two-table th,.lada-two .lada-two-table td{padding:10px;border-bottom:1px solid #dce4d6}
      .lada-two .lada-two-table thead{background:#f5f8f0;color:#526357}
      .lada-two .lada-two-table tr[data-winner="true"]{background:#edf5ed;font-weight:700}
      .lada-two .lada-two-class{display:inline-block;padding-left:8px;border-left:4px solid}
      .lada-two .lada-two-probability{display:flex;align-items:center;gap:8px;min-width:100px}
      .lada-two .lada-two-track{flex:1;min-width:24px;height:5px;background:#dfe8dc;border-radius:4px;overflow:hidden}
      .lada-two .lada-two-fill{height:100%;background:#228d5c}
      @media(max-width:540px){.lada-two .lada-two-table th,.lada-two .lada-two-table td{padding:9px 6px;font-size:12px}.lada-two .lada-two-probability{min-width:72px}.lada-two .lada-two-track{display:none}}
    `}</style>
    <div className="lada-two-actions" aria-label="图像方向预置">
      {anchors.map(anchor => <button type="button" className="lada-two-button" key={anchor.label} aria-pressed={Math.abs(Math.atan2(Math.sin(angle - anchor.angle), Math.cos(angle - anchor.angle))) < 0.001} onClick={() => setAngle(anchor.angle)}>靠近{anchor.label}</button>)}
    </div>
    <Scene label={`教学示例：可拖动橙色图像向量，方向${angle.toFixed(3)}弧度；当前最接近${anchors[winner].label}，概率${(probabilities[winner] * 100).toFixed(1)}%。`} draggable onPoint={(x, y, w, h) => {
      const g = circleGeometry(w, h);
      if (Math.hypot(x - g.x, y - g.y) > 8) setAngle(normalizeAngle(Math.atan2(g.y - y, x - g.x)));
    }} draw={(ctx, w, h) => {
      const g = circleGeometry(w, h);
      const narrow = w < 480;
      const bookW = narrow ? w * 0.23 : w * 0.29;
      const bookX = w * 0.035, bookY = h * 0.36;
      drawAlbum(ctx, bookX, bookY, bookW, h * 0.34);
      drawCard(ctx, bookX + bookW * 0.51, bookY + h * 0.17, Math.min(66, bookW * 0.68), 0, C.orange, -angle * 0.1);
      ctx.save(); ctx.strokeStyle = '#d5dfce'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, tau); ctx.stroke();
      ctx.setLineDash([3, 5]);
      line(ctx, g.x - g.r - 12, g.y, g.x + g.r + 12, g.y, '#cbd7c6', 1);
      line(ctx, g.x, g.y - g.r - 12, g.x, g.y + g.r + 12, '#cbd7c6', 1);
      ctx.setLineDash([]); ctx.restore();
      anchors.forEach((anchor, index) => {
        const tx = g.x + Math.cos(anchor.angle) * g.r, ty = g.y - Math.sin(anchor.angle) * g.r;
        arrow(ctx, g.x, g.y, tx, ty, anchor.color, index === winner ? 3 : 1.8);
        ctx.save(); ctx.translate(tx, ty); ctx.rotate(Math.PI / 4); ctx.fillStyle = anchor.color; ctx.fillRect(-4, -4, 8, 8); ctx.restore();
        if (index === winner) { ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx, ty, 11, 0, tau); ctx.stroke(); ctx.restore(); }
      });
      const ix = g.x + Math.cos(angle) * g.r, iy = g.y - Math.sin(angle) * g.r;
      arrow(ctx, g.x, g.y, ix, iy, C.orange, 4);
      ctx.save(); ctx.fillStyle = '#fff9ee'; ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ix, iy, 9, 0, tau); ctx.fill(); ctx.stroke(); ctx.restore();
      text(ctx, '图像', bookX + bookW * 0.5, h * 0.22, 13, C.orange, 'center');
      text(ctx, '共享特征空间', g.x, h * 0.09, 13, C.muted, 'center');
    }} />
    <p className="lada-two-help">拖动橙色空心点改变图像方向。蓝、紫、褐色箭头依次为猫、狗、鸟的固定文本方向，绿色环标出当前最高分。</p>
    <Readout items={[{ label: '图像方向 θ', value: `${angle.toFixed(3)} rad` }, { label: '二维图像向量 i', value: `(${Math.cos(angle).toFixed(3)}, ${Math.sin(angle).toFixed(3)})` }, { label: '向量长度', value: '1.000' }]} />
    <Feedback tone="good">当前最接近“{anchors[winner].label}”，内积为{similarities[winner].toFixed(4)}，该类在三个候选中的概率为{(probabilities[winner] * 100).toFixed(2)}%。</Feedback>
    <div className="lada-two-table-wrap"><table className="lada-two-table">
      <caption className="lada-two-help">教学示例：logit = 4 × 内积；概率由三个logit共同归一化。</caption>
      <thead><tr><th scope="col">文本方向</th><th scope="col">内积</th><th scope="col">logit</th><th scope="col">概率</th></tr></thead>
      <tbody>{anchors.map((anchor, index) => <tr key={anchor.label} data-winner={index === winner}>
        <th scope="row"><span className="lada-two-class" style={{ borderColor: anchor.color }}>{anchor.label} / {anchor.angle.toFixed(1)} rad</span></th>
        <td>{similarities[index].toFixed(4)}</td><td>{scores[index].toFixed(4)}</td>
        <td><div className="lada-two-probability"><span>{(probabilities[index] * 100).toFixed(2)}%</span><span className="lada-two-track" aria-hidden="true"><span className="lada-two-fill" style={{ width: `${probabilities[index] * 100}%`, display: 'block' }} /></span></div></td>
      </tr>)}</tbody>
    </table></div>
    <Source page={3} label="§3.1–3.2：CLIP表示与文本侧适配；参数高效文本训练见附录B" />
  </div>;
}
