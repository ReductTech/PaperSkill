import React, { useState } from 'react';
import { C, Canvas, clear, rect, text, line } from './detr-kit';

const nodes = [
  { name: '图片特征', x: 100, y: 146, input: '3 × 800 × 1066 的图片', output: '2048 × 25 × 34 → 256 × 850', explanation: 'ResNet-50先用卷积提取较粗的空间特征。1×1卷积把每个位置的2048个通道组合成256个数，再把25×34个位置排成850条记录。', feedback: '卷积骨干把图片压成较粗的空间特征，1×1卷积把通道变为256。' },
  { name: '编码器', x: 330, y: 146, input: '850 × 256 的图像特征，加上二维位置编码', output: '850 × 256 的上下文特征', explanation: '每个图像位置通过自注意力参考其他位置，再由前馈网络更新自身。6层编码器保持记录条数和向量长度，改变的是记录里的内容。', feedback: '编码器让850个位置交换图像上下文。' },
  { name: '查询', x: 330, y: 40, input: '100个可学习的查询位置向量；100条内容向量初始为0', output: '100 × 256 的查询位置向量与内容向量', explanation: '学习得到的目标查询区分100个预测位置。解码器的内容输入初始为0，查询位置向量参与注意力计算，帮助不同位置读取不同的图像线索。', feedback: '100个可学习查询区分预测位置，内容输入初始为0。' },
  { name: '解码器', x: 600, y: 146, input: '100 × 256 的内容，加查询位置与编码器特征', output: '100 × 256 的物体表征', explanation: '每层先让预测位置彼此交流，再通过交叉注意力读取编码器的图像记录，随后用前馈网络加工。原始基线使用6层解码器、8个注意力头，100个位置在每层并行更新。', feedback: '6层解码器让预测位置读取图像并彼此交流。' },
  { name: '类别头', x: 920, y: 87, input: '每个预测位置的256维表征', output: '100 × (K + 1) 个类别分数', explanation: '所有预测位置共用同一个线性分类层，再经softmax得到概率。语义上K为80个COCO物体类别，额外一类为空；官方权重的类别索引表还保留了未使用的COCO编号。', feedback: '共享分类头给每个位置输出类别概率，还包含空类别。' },
  { name: '方框头', x: 920, y: 207, input: '每个预测位置的256维表征', output: '100 × 4 个归一化坐标', explanation: '所有预测位置共用一个三层感知机，输出经过sigmoid成为0到1之间的数。四个数分别记录框的中心横坐标、中心纵坐标、宽和高。', feedback: '共享三层方框头输出中心和宽高；训练模式额外接上监督。' },
];
const edges: [number, number][] = [[0, 1], [1, 3], [2, 3], [3, 4], [3, 5]];
const descendantSets = [[0, 1, 3, 4, 5], [1, 3, 4, 5], [2, 3, 4, 5], [3, 4, 5], [4], [5]];

function D8Content() {
  const [node, setNode] = useState(0);
  const [training, setTraining] = useState(false);
  const selected = nodes[node];
  const forward = descendantSets[node];
  return <div>
    <div style={{ cursor: 'pointer' }}><Canvas ariaLabel="可点选的DETR结构与训练监督" onPointerDown={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width * 1080;
      const y = (event.clientY - bounds.top) / bounds.height * 300;
      const hit = nodes.findIndex((v) => Math.abs(x - v.x) <= 62 && Math.abs(y - v.y) <= 30);
      if (hit >= 0) setNode(hit);
    }} draw={(ctx) => {
      clear(ctx);
      for (const [from, to] of edges) {
        const a = nodes[from], b = nodes[to];
        const active = forward.includes(from) && forward.includes(to);
        line(ctx, a.x + (from === 2 ? 0 : 57), a.y + (from === 2 ? 27 : 0), b.x - 57, b.y, active ? C.blue : '#d7deea', active ? 5 : 2);
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const tx = b.x - 63, ty = b.y;
        line(ctx, tx, ty, tx - Math.cos(angle - .5) * 10, ty - Math.sin(angle - .5) * 10, active ? C.blue : '#d7deea', active ? 4 : 2);
        line(ctx, tx, ty, tx - Math.cos(angle + .5) * 10, ty - Math.sin(angle + .5) * 10, active ? C.blue : '#d7deea', active ? 4 : 2);
      }
      nodes.forEach((v, i) => {
        const current = node === i;
        rect(ctx, v.x - 56, v.y - 27, 112, 54, current ? C.blue : '#e4eadb', true);
        if (current) { ctx.lineWidth = 4; rect(ctx, v.x - 61, v.y - 32, 122, 64, C.orange); }
        ctx.textAlign = 'center';
        text(ctx, String(i + 1), v.x, v.y + 9, 28, current ? '#ffffff' : C.ink);
        ctx.textAlign = 'left';
      });
      if (training) {
        const y = 257;
        for (let i = 0; i < 6; i++) {
          const x = 508 + i * 29;
          rect(ctx, x, y - 9, 20, 18, C.purple, true);
          line(ctx, 600, 177, x + 10, y - 13, C.purple, 1.5);
        }
        line(ctx, 685, y, 850, y, C.purple, 3);
        line(ctx, 920, 118, 1010, 257, C.purple, 2);
        line(ctx, 920, 238, 1010, 257, C.purple, 2);
        rect(ctx, 850, 242, 180, 40, C.purple, false);
        text(ctx, '配对与损失', 870, 269, 22, C.purple);
      }
    }} /></div>
    <div className="chip-row" style={{ marginTop: 12 }}>
      {nodes.map((v, i) => <button key={v.name} type="button" className={`chip ${node === i ? 'selected' : ''}`} aria-pressed={node === i} onClick={() => setNode(i)}>{i + 1} · {v.name}</button>)}
    </div>
    <div className="chip-row">
      <button type="button" className={`chip ${!training ? 'selected' : ''}`} aria-pressed={!training} onClick={() => setTraining(false)}>推理：读图片、出预测</button>
      <button type="button" className={`chip ${training ? 'selected' : ''}`} aria-pressed={training} onClick={() => setTraining(true)}>训练：加上标准答案</button>
    </div>
    <div style={{ minHeight: 178 }}>
      <table className="paper" aria-label={`${selected.name}的输入输出`}>
        <tbody><tr><th scope="row">{node + 1} · {selected.name}接收</th><td>{selected.input}</td></tr><tr><th scope="row">输出</th><td>{selected.output}</td></tr><tr><th scope="row">这里做什么</th><td>{selected.explanation}</td></tr></tbody>
      </table>
    </div>
    <div className={`feedback ${training ? 'good' : ''}`} role="status" aria-live="polite">{selected.feedback} {training ? '训练时，每层解码器的输出都通过共享预测头接受配对与损失监督；最后一层也如此。' : '推理沿蓝色连接产生预测，不需要标准答案或匈牙利配对。'}</div>
  </div>;
}

export function D8(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D8Content/></div>;}
