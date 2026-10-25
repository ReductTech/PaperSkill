import { useState } from 'react';
import { StudyCanvas, palette, drawPaper, drawPencil, drawLabel, drawMask } from './studio-kit';

const targets = [
  { name: '新任务', term: '可塑性', example: '刚开始学习花卉分类，能否区分新的花卉类别？', question: '新知识学会了吗？' },
  { name: '旧任务', term: '后向稳定性', example: '花卉学完后，先前学过的飞机分类还能保持多少？', question: '已学能力保住了吗？' },
  { name: '未见任务', term: '前向稳定性', example: '还没有训练手写数字任务时，预训练模型的识别能力还剩多少？', question: '预训练迁移保住了吗？' },
];
const modes = ['只看新任务', '加看旧任务', '再看未见任务'];
const messages = [
  '新知识学会了，旧任务与未见任务还需要分别检查。',
  '旧任务保持衡量已经学过的能力；现在同时检查学习新知识与保留旧知识。',
  '未见任务表现检验预训练迁移能力；三个评价对象共同描述持续学习效果。',
];

export function Chapter1Main() {
  const [focus, setFocus] = useState(0);
  return <div>
    <div className="ctrl" role="group" aria-label="选择评价范围">
      {modes.map((mode, i) => <button key={mode} className={`chip ${focus === i ? 'selected' : ''}`} aria-pressed={focus === i} onClick={() => setFocus(i)}>{mode}</button>)}
      <button className="chip" onClick={() => setFocus(0)}>重置</button>
    </div>
    <StudyCanvas ariaLabel={`评价范围：${modes[focus]}。右侧等高示意柱中，前${focus + 1}个评价目标已启用。`} draw={(c) => {
      drawPaper(c, 32, 28, 448, 220);
      drawLabel(c, '补绘一笔', 55, 58);
      c.strokeStyle = palette.blue; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(82, 204); c.lineTo(158, 101); c.lineTo(243, 204); c.moveTo(109, 171); c.lineTo(216, 171); c.stroke();
      c.strokeStyle = '#b8c9a7'; c.lineWidth = 2; c.setLineDash([6, 6]);
      c.beginPath(); c.moveTo(271, 207); c.bezierCurveTo(274, 140, 343, 106, 406, 125); c.stroke(); c.setLineDash([]);
      if (focus > 0) drawMask(c, 73, 90, 181, 126);
      c.strokeStyle = focus === 0 ? palette.red : palette.green; c.lineWidth = 5;
      c.beginPath(); c.moveTo(focus === 0 ? 143 : 291, 193); c.lineTo(focus === 0 ? 250 : 392, 127); c.stroke();
      drawPencil(c, focus === 0 ? 263 : 405, 119, -.5, focus === 0 ? palette.red : palette.green);
      if (focus === 2) { c.strokeStyle = palette.blue; c.lineWidth = 3; c.beginPath(); c.moveTo(271, 207); c.bezierCurveTo(274, 140, 343, 106, 406, 125); c.stroke(); }
      drawLabel(c, '评价范围', 580, 58);
      c.strokeStyle = palette.border; c.lineWidth = 2; c.beginPath(); c.moveTo(580, 226); c.lineTo(1032, 226); c.stroke();
      for (let i = 0; i < 3; i++) {
        const x = 604 + i * 145;
        c.fillStyle = i <= focus ? [palette.green, palette.blue, palette.dark][i] : '#e0e5dd';
        c.beginPath(); c.roundRect(x, 104, 94, 122, [10, 10, 0, 0]); c.fill();
        c.strokeStyle = i === focus ? palette.orange : 'transparent'; c.lineWidth = 3;
        c.beginPath(); c.roundRect(x - 6, 98, 106, 134, 12); c.stroke();
      }
    }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 12 }}>
      {targets.map((target, i) => <div key={target.name} style={{ padding: '13px 15px', border: `1px solid ${i <= focus ? palette.blue : palette.border}`, borderRadius: 12, background: i <= focus ? '#edf3f5' : '#fafbf8', opacity: i <= focus ? 1 : .65 }}>
        <strong>{i + 1}. {target.name} · {target.term}</strong>
        <p style={{ margin: '6px 0', fontSize: 14 }}>{target.example}</p>
        <span style={{ fontSize: 14, color: i <= focus ? palette.blue : palette.muted }}>{i <= focus ? target.question : '等待纳入评价'}</span>
      </div>)}
    </div>
    <div className="feedback good" role="status" aria-live="polite">{messages[focus]}</div>
    <p style={{ fontSize: 13, color: palette.muted }}>等高柱表示三个评价目标，数值实验见第10章。论文分类设置中，推理候选类别来自当前任务的类别词表。来源：第3.1—3.2节。</p>
  </div>;
}
