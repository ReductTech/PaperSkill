import React, { useState } from 'react';
import { C, Stage, Chips, Feedback, clearScene, line, pill } from './BirdKit';

const names = ['鸟嘴', '翅膀', '背景'];
const questions = ['寻找鸟嘴相关线索', '寻找翅膀相关线索', '寻找背景相关线索'];
const Q = [[2, 0], [0, 2], [-1, -1]];
const K = [[2, 0], [0, 2], [-1, -1]];
const vector = (v: number[], digits = 3) => `[${v.map(n => n.toFixed(digits)).join('，')}]`;
function softmax(values: number[]) {
  const max = Math.max(...values), exp = values.map(v => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(v => v / sum);
}
const note: React.CSSProperties = { fontSize: 16, lineHeight: 1.7, color: C.muted };

export function Attention() {
  const [query, setQuery] = useState(1);
  const [background, setBackground] = useState(0.2);
  const values = [[1, 0], [0, 1], [background, background]];
  const logits = K.map(k => (Q[query][0] * k[0] + Q[query][1] * k[1]) / Math.sqrt(2));
  const weights = softmax(logits);
  const average = [0, 1].map(d => values.reduce((s, v) => s + v[d] / 3, 0));
  const output = [0, 1].map(d => values.reduce((s, v, i) => s + v[d] * weights[i], 0));
  const delta = background - 0.2;
  return <div>
    <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}><b>① 换查询：同一组值，会取回什么？</b></p>
    <Chips label="选择要寻找的线索" options={names.map((name, value) => ({ value, label: `${name}提问` }))}
      value={query} onChange={setQuery} />
    <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>{questions[query]}；Q = {vector(Q[query],0)}，K、V 固定。</p>
    <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}><b>② 匹配打分 → 分配权重 → 汇聚 V</b></p>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16, color: C.ink }}>
        <thead><tr>{['来源', '匹配键 K', 'Q·K / √2', '权重 α', '携带的值 V', '实际贡献 αV'].map(label =>
          <th key={label} scope="col" style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `1px solid ${C.line}` }}>{label}</th>)}</tr></thead>
        <tbody>{names.map((name, i) => <tr key={name} style={{ background: i === query ? '#fff1e9' : undefined }}>
          <th scope="row" style={{ textAlign: 'left', padding: '12px 8px' }}>{name}</th>
          <td style={{ padding: 8 }}>{vector(K[i], 0)}</td>
          <td style={{ padding: 8 }}>{logits[i].toFixed(3)}</td>
          <td style={{ padding: 8, fontWeight: 700 }}>{(weights[i] * 100).toFixed(1)}%</td>
          <td style={{ padding: 8 }}>{vector(values[i], 1)}</td>
          <td style={{ padding: 8 }}>{vector(values[i].map(v => v * weights[i]))}</td>
        </tr>)}</tbody>
        <tfoot><tr><th colSpan={3} style={{ padding: '12px 8px', textAlign: 'left' }}>贡献逐维相加得到输出</th>
          <td style={{ padding: 8 }}>{weights.reduce((s, a) => s + a, 0).toFixed(3)}</td>
          <td colSpan={2} style={{ padding: 8, fontWeight: 700 }}>O = {vector(output)}</td></tr></tfoot>
      </table>
    </div>
    <Stage height={295}
      label={`同一组值的并列对照：平均参考输出 ${vector(average)}；${names[query]}查询按内容匹配输出 ${vector(output)}。蓝色和紫色分别表示两个示意特征维度。`}
      render={(c, w, h) => {
        clearScene(c, w, h);
        const panels = [
          { x: 28, title: '平均参考：每块固定占 1/3', values: average, caption: '换问题，输出仍相同' },
          { x: 574, title: `按内容匹配：${names[query]}提问`, values: output, caption: '换 Q → 换权重 → 换输出' },
        ];
        panels.forEach(panel => {
          c.font = '600 21px sans-serif'; c.fillStyle = C.ink;
          c.fillText(panel.title, panel.x, 35);
          panel.values.forEach((v, d) => {
            const y = 87 + d * 69, start = panel.x + 90;
            c.font = '18px sans-serif'; c.fillStyle = C.ink;
            c.fillText(`特征 ${d + 1}`, panel.x, y + 20);
            pill(c, start, y, 288, 28, '#e0e8d8');
            pill(c, start, y, Math.max(1, v / 2 * 288), 28, d === 0 ? C.blue : C.purple);
            c.fillStyle = C.ink; c.font = '600 18px sans-serif';
            c.fillText(v.toFixed(3), start + 303, y + 21);
          });
          c.font = '17px sans-serif'; c.fillStyle = C.muted;
          c.fillText('两侧同尺度：0 到 2；两条表示两个特征维度', panel.x, 222);
          c.fillStyle = C.blue; c.font = '600 20px sans-serif';
          c.fillText(panel.caption, panel.x, 266);
        });
        line(c, 539, 24, 539, 275, C.line, 1);
      }} />
    <Feedback tone="green">{query===2?"询问背景时，背景权重上升：注意力按问题取信息，并不固定排斥背景。":<>本例 {names[query]} 的权重为 {(weights[query]*100).toFixed(1)}%。匹配分数越高，其值的贡献越大；平均参考不随查询改变。</>}</Feedback>
    <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}><b>③ 只改背景 V：同样的变化，会传出多少？</b></p>
    <div className="ctrl">
      <label htmlFor="attention-background">背景 V 的两个分量</label>
      <input id="attention-background" type="range" min={0.2} max={2} step={0.1}
        value={background} onChange={e => setBackground(Number(e.target.value))}
        onKeyDown={e => e.stopPropagation()} />
      <output htmlFor="attention-background" className="val">{background.toFixed(1)}</output>
      <button className="tiny ghost" onClick={() => setBackground(0.2)}>恢复背景值</button>
    </div>
    <div aria-live="polite"><Feedback>ΔV = {delta.toFixed(1)}；平均输出变化 {(delta/3).toFixed(3)}，匹配输出变化 {(delta*weights[2]).toFixed(3)}。<br/>{query===2?"关注背景时，变化被更多保留。":"背景权重越小，同样变化对输出影响越小。"}</Feedback></div>
    <><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>Q、K 决定取多少，V 决定取什么；本实验只改 V。</p><details><summary>展开变化量的计算</summary><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>平均：{delta.toFixed(1)} × 1/3 = {(delta/3).toFixed(3)}；匹配：{delta.toFixed(1)} × {weights[2].toFixed(3)} = {(delta*weights[2]).toFixed(3)}。</p><p style={note}>
      原理在于：Q、K 决定“取多少”，V 决定“取什么”。实验只改背景 V，Q、K 固定，所以分数和权重不变；
      这是为隔离因果关系设计的数值实验，不是在修改真实照片。真实模型改变输入时，Q、K、V 都可能变化。
    </p></details></>
    <><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>数值为教学构造；按内容选择不保证准确率更高。</p><details><summary>示例边界与论文依据</summary><p style={note}>
      数值均为手工构造的教学示例：三个 token、每头两维，省略 CLS、其他图块与输出投影。两维并非实际 ViT 中预先指定的语义属性。
      真实 Q、K、V 由输入经可学习投影产生；训练通过任务损失学习有用的匹配和取值。
      有区别地参考提供按查询选择信息的能力，不保证每次权重合理或准确率更高。依据：论文附录 A，式（5–8）。
    </p></details></>
  </div>;
}
