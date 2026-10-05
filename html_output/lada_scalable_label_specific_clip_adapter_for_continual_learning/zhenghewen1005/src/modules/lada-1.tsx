import { useState } from 'react';
import { C, Scene, Chips, Feedback, Readout, Source, drawCard, drawAlbum, arrow, roundRect, text } from './lada-kit';

const routeScores = [2.4, 1.2, 0.7];
const routeLabels = ['猫', '狗', '鸟'];

export function LadaOne() {
  const [method, setMethod] = useState('route');
  const [route, setRoute] = useState('bird');
  const eligible = routeLabels.map((_, index) => method === 'unified' || (route === 'pet' ? index < 2 : index === 2));
  const winner = routeScores.reduce((best, value, index) => eligible[index] && (best < 0 || value > routeScores[best]) ? index : best, -1);
  const correct = winner === 0;
  const candidateNames = routeLabels.filter((_, index) => eligible[index]).join('、');
  const feedback = method === 'unified'
    ? '三类同时比较，猫以2.4分胜出。任务页不再限制候选范围。'
    : route === 'bird'
      ? '照片被送入鸟类页，正确的“猫”被排除在候选之外；鸟以0.7分成为当前输出。'
      : '照片进入宠物页，猫和狗参加比较；猫以2.4分胜出。';

  return <div className="lada-one" onKeyDown={event => event.stopPropagation()}>
    <style>{`
      .lada-one .lada-one-controls{display:grid;gap:8px;margin-bottom:16px}
      .lada-one .lada-one-scope{margin:3px 0;color:#526357;font-size:14px}
      .lada-one .lada-one-table-wrap{overflow-x:auto;margin:16px 0}
      .lada-one .lada-one-table{border-collapse:collapse;width:100%;font-size:14px;text-align:left;font-variant-numeric:tabular-nums}
      .lada-one .lada-one-table th,.lada-one .lada-one-table td{padding:10px 12px;border-bottom:1px solid #dce4d6}
      .lada-one .lada-one-table th{font-weight:600;color:#526357;background:#f5f8f0}
      .lada-one .lada-one-table tr[data-excluded="true"]{color:#7e897e;background:#f5f6f3}
      .lada-one .lada-one-table tr[data-winner="true"]{font-weight:700;background:#eaf4ec}
      .lada-one .lada-one-table tr[data-wrong="true"]{background:#fbeef0}
      .lada-one .lada-one-note{font-size:13px;color:#647163;margin:12px 0 0;line-height:1.7}
      @media(max-width:540px){.lada-one .lada-one-table th,.lada-one .lada-one-table td{padding:9px 7px;font-size:13px}}
    `}</style>
    <div className="lada-one-controls">
      <Chips label="检索方式" options={[{ value: 'route', label: '任务路由' }, { value: 'unified', label: '统一候选' }]} value={method} onChange={setMethod} />
      {method === 'route'
        ? <Chips label="先选择任务页" options={[{ value: 'bird', label: '鸟类页' }, { value: 'pet', label: '宠物页' }]} value={route} onChange={setRoute} />
        : <p className="lada-one-scope">当前范围：猫、狗、鸟三个候选同时参与比较。</p>}
    </div>
    <Scene label={`教学示例：猫照片；${method === 'unified' ? '统一候选' : route === 'bird' ? '鸟类页' : '宠物页'}；候选${candidateNames}；输出${routeLabels[winner]}。右侧三条依次对应猫、狗、鸟。`} draw={(ctx, w, h) => {
      const bookX = w * 0.045, bookY = h * 0.23, bookW = w * 0.39, bookH = h * 0.6;
      const barX = w * 0.58, barW = w * 0.35;
      const selectedPet = method === 'unified' || route === 'pet';
      const catX = bookX + bookW * (selectedPet ? 0.74 : 0.26);
      const catY = bookY + bookH * 0.50;
      drawAlbum(ctx, bookX, bookY, bookW, bookH);
      if (method === 'unified') {
        roundRect(ctx, bookX + 5, bookY + 5, bookW - 10, bookH - 10, 10, 'rgba(34,141,92,0.06)', C.green);
      } else {
        roundRect(ctx, bookX + bookW * (selectedPet ? 0.53 : 0.04), bookY + 9, bookW * 0.43, bookH - 18, 8, correct ? 'rgba(34,141,92,0.08)' : 'rgba(196,63,82,0.08)', correct ? C.green : C.red);
      }
      routeScores.forEach((score, index) => {
        const y = h * (0.29 + index * 0.24);
        roundRect(ctx, barX, y - 12, barW, 24, 5, '#e8ede2');
        roundRect(ctx, barX, y - 12, barW * score / 2.6, 24, 5, eligible[index] ? (index === winner ? (correct ? C.green : C.red) : C.blue) : '#cbd3c8');
        if (!eligible[index]) {
          ctx.save(); ctx.strokeStyle = '#8a9789'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(barX, y + 16); ctx.lineTo(barX + barW * score / 2.6, y - 16); ctx.stroke(); ctx.restore();
        }
        if (index === winner) roundRect(ctx, barX - 4, y - 17, barW + 8, 34, 7, 'transparent', correct ? C.green : C.red);
      });
      arrow(ctx, catX + Math.min(27, bookW * 0.17), catY, barX - 10, h * (0.29 + winner * 0.24), correct ? C.green : C.red, 2.5);
      drawCard(ctx, catX, catY, Math.min(72, bookW * 0.43), 0, correct ? C.green : C.red, selectedPet ? -0.08 : 0.12);
      text(ctx, '图鉴检索', bookX + bookW * 0.5, h * 0.13, 13, C.muted, 'center');
      text(ctx, '候选得分', barX + barW * 0.5, h * 0.13, 13, C.muted, 'center');
    }} />
    <Readout items={[{ label: '参与比较', value: `${eligible.filter(Boolean).length} / 3 类` }, { label: '分类输出', value: routeLabels[winner] }, { label: '正确类别的得分', value: '猫：2.4' }]} />
    <Feedback tone={correct ? 'good' : 'bad'}>{feedback}</Feedback>
    <div className="lada-one-table-wrap">
      <table className="lada-one-table">
        <caption className="lada-one-note">教学示例：图中条形从上到下对应下表三类，原始得分固定。</caption>
        <thead><tr><th scope="col">类别</th><th scope="col">原始得分</th><th scope="col">候选资格</th><th scope="col">比较结果</th></tr></thead>
        <tbody>{routeLabels.map((label, index) => <tr key={label} data-excluded={!eligible[index]} data-winner={index === winner} data-wrong={index === winner && !correct}>
          <th scope="row">{label}{index === 0 ? '（真实）' : ''}</th><td>{routeScores[index].toFixed(1)}</td><td>{eligible[index] ? '参与' : '被排除'}</td><td>{index === winner ? '最高分输出' : eligible[index] ? '低于最高分' : '未进入比较'}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <Source page={3} label="§3.1：X-TAIL测试设置；按类记忆结构见第4页公式(5)" />
  </div>;
}
