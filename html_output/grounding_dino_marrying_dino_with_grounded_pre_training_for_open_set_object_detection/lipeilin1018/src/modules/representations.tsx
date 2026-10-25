import { useState } from 'react';
import { C, Scene, photo, frame, line, Chips, Feedback } from './gd-kit';

const regions = [
  { name: '鸟', cx: .30, cy: .42, rect: [.215, .25, .17, .36], tokens: [0, 1], detail: 'red / bird' },
  { name: '树', cx: .12, cy: .50, rect: [.015, .12, .21, .80], tokens: [2, 3], detail: 'green / tree' },
  { name: '人', cx: .80, cy: .64, rect: [.735, .44, .13, .49], tokens: [4], detail: 'person' },
];
const px = 20, py = 25, pw = 560, ph = 220;
export function Representations() {
  const [region, setRegion] = useState(0);
  const selected = regions[region];
  const point = (x: number, y: number) => {
    const nx=(x-px)/pw, ny=(y-py)/ph;
    const found=regions.findIndex(r => nx>=r.rect[0] && nx<=r.rect[0]+r.rect[2] && ny>=r.rect[1] && ny<=r.rect[1]+r.rect[3]);
    if(found>=0) setRegion(found);
  };
  return <div>
    <Chips items={['鸟区域','树区域','人区域']} value={region} onChange={setRegion} label="检查区域（也可点击照片）" />
    <Scene label={`区域检查：选中${selected.name}；右侧是三种裁剪视野与词语片段的教学示意`} onPoint={point} draw={ctx => {
      photo(ctx,px,py,pw,ph);
      regions.forEach((r,i) => frame(ctx,px+r.rect[0]*pw,py+r.rect[1]*ph,r.rect[2]*pw,r.rect[3]*ph,i===region?C.green:C.border,i!==region));
      line(ctx,605,28,605,248,C.border);
      const sizes=[1,.62,.32];
      sizes.forEach((span,i)=>{
        const x=644+i*137,y=60,w=114,h=114;
        ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
        const cropW=pw*span,cropH=cropW;
        const sx=Math.max(0,Math.min(pw-cropW,selected.cx*pw-cropW/2));
        const sy=selected.cy*ph-cropH/2;
        const scale=w/cropW;
        ctx.translate(x-sx*scale,y-sy*scale);ctx.scale(scale,scale);
        photo(ctx,0,0,pw,ph);
        ctx.restore();frame(ctx,x,y,w,h,C.blue);
        ctx.save();ctx.fillStyle=C.muted;ctx.textAlign='center';ctx.font='600 16px sans-serif';ctx.fillText(String(i+1),x+w/2,47);ctx.restore();
      });
      for(let i=0;i<5;i++){
        const x=648+i*78,y=216,active=selected.tokens.includes(i);
        ctx.save();ctx.fillStyle=active?'#e1f0e7':'#f2f4f7';ctx.fillRect(x,y,62,34);
        ctx.strokeStyle=active?C.green:C.border;ctx.lineWidth=active?3:1;ctx.strokeRect(x,y,62,34);
        ctx.fillStyle=active?C.green:C.muted;ctx.textAlign='center';ctx.font='600 16px sans-serif';ctx.fillText(String(i+1),x+31,y+23);ctx.restore();
      }
      line(ctx,644,196,1035,196,C.border);
    }} />
    <div style={{display:'flex',gap:16,justifyContent:'space-between',flexWrap:'wrap',fontSize:13,color:C.muted,margin:'6px 0 12px'}}>
      <span>右上：①场景　②局部　③细节（裁剪仅作尺度类比）</span>
      <span>词语示意：① red　② bird　③ green　④ tree　⑤ person</span>
    </div>
    <Feedback tone="info">现在检查{selected.name}区域，示意关联为 {selected.detail}。Swin 提取多尺度图像特征，BERT 保留文本 token；右侧裁剪不是实际特征图，词语切分也不是实际 BERT 分词结果。后续融合才让两种特征交换信息。</Feedback>
  </div>;
}
