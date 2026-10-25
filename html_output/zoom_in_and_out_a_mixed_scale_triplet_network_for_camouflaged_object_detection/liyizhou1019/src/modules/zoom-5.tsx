import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawSceneLabel, drawLegend, Feedback, Chips } from './kit-anchor';

const rows = [[2, 173.616, .721, .030], [4, 188.556, .723, .029], [6, 203.496, .729, .029], [8, 218.436, .726, .029]];
const feedback = ['当前 2 组计算量较低，仍需对照分割指标。', '4 组的 Fωβ 为 0.723；增加分组并不等于免费获得改进。', '这组实验中，6 组取得最高 Fωβ 0.729，因此论文采用它作为默认设置。', '8 组计算量升到 218.436 GFLOPs，Fωβ 却降为 0.726；更多分组不保证更好。'];
function line(ctx: CanvasRenderingContext2D, pts: number[][], color: string) {
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
  pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}
export function Zoom5() {
  const [groupIndex, setGroupIndex] = useState(0);
  const groups = rows[groupIndex][0];
  return <div>
    <SceneCanvas aria-label={`${groups} 组 HMU 结构示意：组间传递部分特征，另两路形成通道调制和输出，并保留残差。`} draw={ctx => {
      clearScene(ctx, 1080, 280);
      line(ctx, [[65, 145], [65, 55], [1000, 55], [1000, 145]], C.muted);
      const space = 700 / groups;
      for (let i = 0; i < groups; i++) {
        const x = 95 + i * space; const width = Math.min(94, space - 24);
        ctx.fillStyle = C.bg; ctx.strokeStyle = C.dark; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(x, 100, width, 90, 8); ctx.fill(); ctx.stroke();
        const colors = i === groups - 1 ? [C.purple, C.green] : [C.blue, C.purple, C.green];
        colors.forEach((color, j) => { ctx.fillStyle = color; ctx.globalAlpha = .55; ctx.fillRect(x + 8, 110 + j * 23, width - 16, 14); ctx.globalAlpha = 1; });
        if (i < groups - 1) {
          const next = 95 + (i + 1) * space;
          line(ctx, [[x + width, 117], [next, 117]], C.blue);
          line(ctx, [[next - 6, 112], [next, 117], [next - 6, 122]], C.blue);
        }
        line(ctx, [[x + width / 2, 190], [x + width / 2, 210], [885, 210]], C.purple);
        line(ctx, [[x + width / 2 + 6, 190], [x + width / 2 + 6, 222], [953, 222], [953, 145]], C.green);
      }
      ctx.fillStyle = C.purple; ctx.globalAlpha = .15; ctx.beginPath(); ctx.roundRect(850, 105, 80, 80, 12); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = C.purple; ctx.stroke();
      for (let i = 0; i < 4; i++) { ctx.fillStyle = C.purple; ctx.fillRect(860 + i * 17, 160 - i * 9, 9, 15 + i * 9); }
      line(ctx, [[885, 210], [885, 185]], C.purple);
      line(ctx, [[930, 145], [980, 145]], C.green);
      ctx.strokeStyle = C.green; ctx.beginPath(); ctx.arc(1000, 145, 20, 0, Math.PI * 2); ctx.stroke();
      line(ctx, [[990, 145], [1010, 145]], C.green); line(ctx, [[1000, 135], [1000, 155]], C.green);
      drawSceneLabel(ctx, '组间交互', 600, 32); drawSceneLabel(ctx, '通道调制', 845, 80);
      drawLegend(ctx, [{ label: '传递子特征', color: C.blue }, { label: '调制线索', color: C.purple }, { label: '输出子特征', color: C.green }]);
    }} />
    <div className="ctrl" aria-label="HMU 分组数"><Chips options={['2 组', '4 组', '6 组（论文默认）', '8 组']} value={groupIndex} onChange={setGroupIndex} /></div>
    <table className="paper" style={{ width: '100%' }}><caption style={{ textAlign: 'left', padding: '8px 0', color: C.muted }}>分组消融 · COD10K-Test · 论文 Table 2</caption><thead><tr><th>分组数 G</th><th>GFLOPs</th><th>Fωβ ↑</th><th>MAE ↓</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r[0]} style={i === groupIndex ? { background: '#e9f1e4', fontWeight: 700 } : undefined}><td>{r[0]}{i === groupIndex ? ' · 当前' : ''}</td><td>{r[1].toFixed(3)}</td><td>{r[2].toFixed(3)}</td><td>{r[3].toFixed(3)}</td></tr>)}</tbody></table>
    <Feedback tone={groupIndex === 2 ? 'good' : groupIndex === 3 ? 'bad' : 'neutral'}>{feedback[groupIndex]}</Feedback>
  </div>;
}
