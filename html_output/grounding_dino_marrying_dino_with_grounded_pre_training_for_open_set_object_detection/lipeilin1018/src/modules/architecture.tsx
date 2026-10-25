import { useState } from 'react';
import { C, Scene, line, number, Chips, Feedback } from './gd-kit';

const stages = [
  { title: '双编码器', shape: '投影后：图像 Nᵢ × 256；文本 Nₜ × 256', desc: 'Swin 与 BERT-base 分别编码图像和文本，投影到共同的 256 维隐空间后参与交互。这里的 DINO 是目标检测器。' },
  { title: '特征增强', shape: '增强后的 Nᵢ × 256 与 Nₜ × 256', desc: '视觉与文本通过双向跨注意力交换信息；同时保留各自模态的自注意力。论文默认 6 层增强器。' },
  { title: '查询选择', shape: '900 个图像索引 → 位置初始化；内容为 900 × 256', desc: '按图文点积分数筛选位置。位置部分来自编码器预测的动态锚框，内容部分仍是可学习参数。900 不是物体数量。' },
  { title: '跨模态解码', shape: '900 × 256 查询；读取图像与文本 memory', desc: '查询经自注意力、图像跨注意力、文本跨注意力和 FFN 更新；默认 6 层。增强特征也直接提供 memory。' },
  { title: '框与词语', shape: '900 × 4 框；900 × Nₜ 词语匹配分数', desc: '输出预测框及其与输入词语的关联，随后依据分数筛选；不是自由生成一段文字，也不是像素级分割。' },
];

export function Architecture() {
  const [stage, setStage] = useState(0);
  const nodes = [{ x: 100, y: 80, group: 0 }, { x: 100, y: 240, group: 0 }, { x: 330, y: 160, group: 1 }, { x: 550, y: 160, group: 2 }, { x: 770, y: 160, group: 3 }, { x: 970, y: 160, group: 4 }];
  const hit = (x: number, y: number) => { const n = nodes.find(v => Math.hypot(x - v.x, y - v.y) < 55); if (n) setStage(n.group); };
  return <div>
    <Chips label="查看架构环节" items={stages.map(s => s.title)} value={stage} onChange={setStage} />
    <Scene height={320} label="点击六个数字节点，查看对应模型环节。上方按钮提供等价键盘操作。" onPoint={hit} draw={ctx => {
      const edge = (a: number, b: number, active: boolean) => {
        const n = nodes[a], m = nodes[b], dx = m.x - n.x, dy = m.y - n.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
        const endx = m.x - ux * 47, endy = m.y - uy * 47, color = active ? C.blue : C.border;
        line(ctx, n.x + ux * 47, n.y + uy * 47, endx, endy, color, active ? 4 : 2);
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(endx, endy); ctx.lineTo(endx - ux * 10 - uy * 5, endy - uy * 10 + ux * 5); ctx.lineTo(endx - ux * 10 + uy * 5, endy - uy * 10 - ux * 5); ctx.closePath(); ctx.fill();
      };
      edge(0, 2, stage <= 1); edge(1, 2, stage <= 1); edge(2, 3, stage === 1 || stage === 2); edge(3, 4, stage === 2 || stage === 3); edge(4, 5, stage >= 3);
      ctx.strokeStyle = stage === 1 || stage === 3 ? C.purple : C.border; ctx.lineWidth = stage === 1 || stage === 3 ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(330, 113); ctx.bezierCurveTo(330, 18, 770, 18, 770, 113); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(770, 113); ctx.lineTo(763, 101); ctx.lineTo(777, 101); ctx.closePath(); ctx.fill();
      nodes.forEach((n, i) => {
        const active = stage === n.group;
        ctx.fillStyle = active ? '#e6eff4' : '#f5f8f0'; ctx.strokeStyle = active ? C.blue : C.border; ctx.lineWidth = active ? 4 : 2;
        ctx.beginPath(); ctx.roundRect(n.x - 43, n.y - 43, 86, 86, 18); ctx.fill(); ctx.stroke();
        number(ctx, String(i + 1), n.x - 6, n.y + 7, active ? C.blue : C.muted);
      });
    }} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 22px', fontSize: 13, margin: '8px 0 14px', color: C.muted }}>
      <span>① 图像编码器</span><span>② 文本编码器</span><span>③ 增强器</span><span>④ 查询选择</span><span>⑤ 解码器</span><span>⑥ 输出</span>
      <span style={{ color: C.purple }}>紫色弧线：增强特征直接供解码器读取</span>
    </div>
    <div style={{ padding: 16, border: `1px solid ${C.border}`, borderRadius: 12, background: '#f7f9fc', minHeight: 88 }}>
      <strong>{stages[stage].title}</strong><div style={{ fontFamily: 'monospace', marginTop: 6, color: C.blue }}>{stages[stage].shape}</div>
      <p style={{ margin: '8px 0 0', fontSize: 14 }}>{stages[stage].desc}</p>
    </div>
    <Feedback tone="info">三个融合位置分别是特征增强、语言引导的查询选择、解码中的文本跨注意力。图为论文架构重绘，张量形状采用默认 d = 256、Nq = 900。</Feedback>
  </div>;
}
