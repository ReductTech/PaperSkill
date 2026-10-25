import { useRef, useState } from 'react';
import { arrow, clearScene, drawLabel, Feedback, palette, roundRect, useDrawing } from './vit-kit';
import { computeQkv, KEY_RULES, PART_NAMES, QUERY_RULES, VALUE_RULES } from './vit-numbers';

const stages = ['先看这块的输入', '同一输入算Q', '同一输入算K', '同一输入算V', '把三个角色放在一起'];
const vector = (values: number[]) => `[${values.join(', ')}]`;
const roles = ['q：拿去匹配', 'k：供别人匹配', 'v：供别人取回'];
const ruleNames = ['W_Q', 'W_K', 'W_V'];
const ruleTables = [QUERY_RULES, KEY_RULES, VALUE_RULES];

export function Widget4b() {
  const [part, setPart] = useState(0);
  const [stage, setStage] = useState(0);
  const ref = useRef<HTMLCanvasElement>(null);
  const current = computeQkv(part);
  const rows = [current.q, current.k, current.v];
  const activeRole = Math.max(0, Math.min(2, stage - 1));
  const rules = ruleTables[activeRole];
  const feedback = [
    `当前${PART_NAMES[part]}，输入x=${vector(current.input)}。这些数是直接给定的小算例，不是像素，也不是模型自动写出的名称；我们只用它演示乘法。`,
    `仍用${PART_NAMES[part]}的同一行x，乘W_Q，得到q=${vector(current.q)}。当这张卡要参考别人时，用它与所有候选k比较。`,
    `没有换输入，只把规则表换成W_K，得到k=${vector(current.k)}。当别的卡来参考这张卡时，用这个k算匹配分数；它不是q的复制品。`,
    `再用同一个x乘W_V，得到v=${vector(current.v)}。v是后面按比例带回去的内容；不是匹配分数，也不是类别概率。`,
    `${PART_NAMES[part]}同时有q=${vector(current.q)}、k=${vector(current.k)}、v=${vector(current.v)}。每一块都做三次投影；选择另一块可以看见：规则表不变，输入与结果改变。`,
  ];
  useDrawing(ref, ctx => {
    clearScene(ctx, 1080, 280);
    [0, 1, 2].forEach(i => {
      const y = 35 + i * 77;
      roundRect(ctx, 32, y, 130, 63, 7, '#fff', i === part ? palette.orange : palette.border);
      ctx.save(); ctx.fillStyle = i === part ? palette.blue : palette.light;
      if (i === 0) { ctx.beginPath(); ctx.moveTo(60, y + 47); ctx.lineTo(97, y + 13); ctx.lineTo(134, y + 47); ctx.closePath(); ctx.fill(); }
      else if (i === 1) { ctx.beginPath(); ctx.arc(97, y + 31, 21, 0, Math.PI * 2); ctx.fill(); }
      else roundRect(ctx, 65, y + 14, 64, 37, 2, palette.light, palette.support);
      ctx.restore();
    });
    arrow(ctx, 175, 66 + part * 77, 288, 140);
    current.input.forEach((v, i) => {
      roundRect(ctx, 310 + i * 62, 108, 51, 64, 4, '#fff', palette.blue);
      drawLabel(ctx, String(v), 330 + i * 62, 142);
    });
    if (stage > 0) rows.forEach((row, i) => {
      const visible = stage === 4 || i === activeRole;
      if (!visible) return;
      arrow(ctx, 500, 140, 736, 59 + i * 78, palette.blue);
      row.forEach((v, j) => {
        roundRect(ctx, 770 + j * 80, 29 + i * 78, 68, 59, 5, '#fff', palette.green);
        drawLabel(ctx, String(v), 791 + j * 80, 61 + i * 78, palette.green);
      });
    });
    drawLabel(ctx, '同一行输入', 309, 82);
    if (stage > 0) drawLabel(ctx, stage === 4 ? '上q中k下v' : ['查询结果', '键的结果', '值的结果'][activeRole], 766, 16);
  });
  return <div>
    <div className="ctrl" role="group" aria-label="选择哪张卡生成QKV">
      {PART_NAMES.map((name, i) => <button type="button" key={name} className={'chip' + (part === i ? ' selected' : '')} aria-pressed={part === i} onClick={() => setPart(i)}>{name}</button>)}
    </div>
    <canvas ref={ref} role="img" aria-label={`${PART_NAMES[part]}：${stages[stage]}。${feedback[stage]}`} />
    <div className="step-ctrl">
      <button type="button" className="chip" disabled={stage === 0} onClick={() => setStage(s => s - 1)}>上一步</button>
      <span className="step-label">{stage + 1}/5 · {stages[stage]}</span>
      <button type="button" className="chip" disabled={stage === 4} onClick={() => setStage(s => s + 1)}>下一步</button>
      <button type="button" className="chip" onClick={() => { setPart(0); setStage(0); }}>重看QKV的来源</button>
    </div>
    <Feedback>{feedback[stage]}</Feedback>
    {stage >= 1 && stage <= 3 && <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
      <table className="paper">
        <caption>{ruleNames[activeRole]}这张表：3行输入，2列输出；列是两条乘加规则</caption>
        <thead><tr><th>输入位置</th><th>输入x</th><th>系数第1列</th><th>系数第2列</th></tr></thead>
        <tbody>{current.input.map((v, i) => <tr key={i}><th scope="row">第{i + 1}个数</th><td>{v}</td><td>{rules[i][0]}</td><td>{rules[i][1]}</td></tr>)}</tbody>
        <tfoot>{[0, 1].map(j => <tr key={j}><th scope="row">输出第{j + 1}个数</th><td colSpan={3}>{current.input.map((v, i) => `${v}×(${rules[i][j]})`).join(' + ')} = {rows[activeRole][j]}</td></tr>)}</tfoot>
      </table>
    </div>}
    {stage === 4 && <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
      <table className="paper">
        <caption>三个图块各有三个角色；把这一列向量上下叠起，才得到大写Q、K、V</caption>
        <thead><tr><th>来自哪块</th>{roles.map(role => <th key={role}>{role}</th>)}</tr></thead>
        <tbody>{PART_NAMES.map((name, i) => { const r = computeQkv(i); return <tr key={name} style={i === part ? { background: '#eef2f8', fontWeight: 700 } : undefined}><th scope="row">{name}</th><td>{vector(r.q)}</td><td>{vector(r.k)}</td><td>{vector(r.v)}</td></tr>; })}</tbody>
      </table>
    </div>}
  </div>;
}
