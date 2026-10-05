import { useState, type PointerEvent } from 'react';
import { C, Scene, clear, frame, text, Feedback, Source } from './shared-kit';

const nodes = [
  { name: '骨干网络', x: 24, y: 32, detail: '从一张图像提取 S3、S4、S5 三个阶段的特征。640×640 输入、步长 8/16/32 对应 80×80、40×40、20×20 网格；这是配置下的尺寸说明。' },
  { name: '混合编码器', x: 206, y: 32, detail: 'AIFI 在 S5 内交互，CCFF 融合 S3、S4 与 F5。低层特征沿旁路保留，输出多尺度图像特征 O；标准 embedding 为 256 维。' },
  { name: '查询选择', x: 388, y: 32, detail: '按分类分数选 Top-300 编码器特征作内容查询，相应预测框作初始位置查询。提高查询质量的机制来自训练，推理没有真实框。' },
  { name: '解码器', x: 388, y: 164, detail: '标准配置有 6 层，查询与图像特征交互并逐步细化。前一节只裁剪同一六层训练模型的推理深度；不混用不同训练模型的结果。' },
  { name: '预测头', x: 206, y: 164, detail: '预测目标类别与边界框。COCO 配置包含 80 类；辅助预测头为训练提供监督，类别输出不是跨帧身份标签。' },
  { name: '单帧输出', x: 24, y: 164, detail: '得到当前图像的类别、置信度和框。没有跨帧身份、历史轨迹或未来轨迹；进入动态场景系统还需要额外的关联与预测。' },
];
const boxW = 148, boxH = 64;

export function ArchitectureLab() {
  const [selected, setSelected] = useState(0);
  function pick(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * 560 / rect.width;
    const y = (e.clientY - rect.top) * 260 / rect.height;
    const index = nodes.findIndex(n => x >= n.x && x <= n.x + boxW && y >= n.y && y <= n.y + boxH);
    if (index >= 0) setSelected(index);
  }
  return <div onKeyDown={e => { if (e.key.startsWith('Arrow')) e.stopPropagation(); }}>
    <div className="chip-row" role="group" aria-label="选择网络节点" style={{ flexWrap: 'wrap' }}>
      {nodes.map((n, i) => <button key={n.name} className="chip" type="button" aria-pressed={selected === i}
        style={selected === i ? { background: '#eaf3e6', borderColor: '#228d5c' } : undefined} onClick={() => setSelected(i)}>{i + 1}. {n.name}</button>)}
    </div>
    <Scene height={260} label="网络结构示意，六个编号按骨干、编码器、查询、解码器、预测头、输出连接；点击矩形或用上方键盘按钮选择。" onPointerDown={pick}
      draw={ctx => {
        clear(ctx, 560, 260);
        const links = [[172,64,206,64],[354,64,388,64],[462,96,462,164],[388,196,354,196],[206,196,172,196]];
        links.forEach(([x1,y1,x2,y2], i) => {
          const active = selected === i || selected === i + 1;
          const angle = Math.atan2(y2-y1, x2-x1);
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.strokeStyle = active ? C.green : C.line; ctx.lineWidth = active ? 3 : 2; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2-7*Math.cos(angle-0.45),y2-7*Math.sin(angle-0.45)); ctx.lineTo(x2-7*Math.cos(angle+0.45),y2-7*Math.sin(angle+0.45)); ctx.closePath(); ctx.fillStyle = active ? C.green : C.line; ctx.fill();
        });
        // Static encoder-output link to decoder: decoder also consumes the encoded image features.
        ctx.save(); ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(280,96); ctx.lineTo(280,126); ctx.lineTo(418,126); ctx.lineTo(418,164); ctx.strokeStyle = selected === 1 || selected === 3 ? C.green : C.line; ctx.stroke(); ctx.restore();
        nodes.forEach((n, i) => {
          ctx.fillStyle = i === selected ? '#eaf3e6' : '#ffffff'; ctx.fillRect(n.x,n.y,boxW,boxH);
          frame(ctx,n.x,n.y,boxW,boxH,i === selected ? C.green : C.line);
          text(ctx,String(i+1),n.x+68,n.y+37,i === selected ? C.green : C.ink);
        });
        text(ctx, '图像特征旁路', 264, 149, C.ink);
      }} />
    <p style={{ fontSize: 16 }}>实线：主干连接；虚线：编码器图像特征同时供解码器使用。节点号与上方按钮对应；示意省略模块内部连线。</p>
    <Feedback tone={selected === 5 ? 'neutral' : 'good'}><strong>{nodes[selected].name}：</strong>{nodes[selected].detail}</Feedback>
    <Source page={5} label="原文 P5 · Fig. 4：完整结构与查询、图像特征的连接" />
    <p style={{ fontSize: 14 }}><a href="https://openaccess.thecvf.com/content/CVPR2024/supplemental/Zhao_DETRs_Beat_YOLOs_CVPR_2024_supplemental.pdf#page=1" target="_blank" rel="noreferrer">补充材料 P1 · Table A：300 queries、256 维、6 层解码器</a></p>
  </div>;
}
