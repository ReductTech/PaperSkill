import { useState } from 'react';
import { C, Scene, photo, bird, person, frame, line, Chips, Feedback } from './gd-kit';

export function TaskClosed() {
  const [prompt, setPrompt] = useState(0);
  const count = prompt === 0 ? 1 : prompt === 1 ? 2 : null;
  const names = ['人', '鸟', '红色的鸟'];
  return <div>
    <Chips items={names} value={prompt} onChange={setPrompt} label="固定类别请求" />
    <Scene label={`固定类别教学示意：${names[prompt]}，${count === null ? '不支持属性请求' : `${count}个匹配目标`}`} draw={ctx => {
      photo(ctx, 20, 20, 720, 240);
      line(ctx, 770, 24, 770, 256, C.border);
      if (prompt === 0) frame(ctx, 562, 121, 68, 126, C.green);
      if (prompt === 1) {
        frame(ctx, 190, 84, 94, 78, C.green);
        frame(ctx, 420, 74, 94, 78, C.green);
      }
      ctx.save();
      ctx.fillStyle = count === null ? C.red : C.text;
      ctx.font = '600 19px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(count === null ? '超出词表' : '匹配数', 920, 68);
      ctx.font = '700 54px sans-serif';
      ctx.fillText(count === null ? '—' : String(count), 920, 139);
      if (prompt === 0) {
        person(ctx, 920, 164, 86);
      } else if (prompt === 1) { bird(ctx, 885, 207, 20, C.red); bird(ctx, 956, 207, 20, C.blue); }
      else { ctx.strokeStyle=C.red; ctx.lineWidth=3; ctx.beginPath();ctx.arc(920,210,22,0,Math.PI*2);ctx.moveTo(904,194);ctx.lineTo(936,226);ctx.stroke(); }
      ctx.restore();
    }} />
    <Feedback tone={prompt === 2 ? 'bad' : 'info'}>
      {prompt === 0 ? '固定类别表含“人”，本例的目标是一位人物。类别由预先定义的预测空间决定。' : prompt === 1 ? '“鸟”会把两只不同颜色的鸟都纳入目标集合。这个接口没有单独的颜色筛选入口。' : '本例词表只有“人”和“鸟”，无法直接请求“红色的鸟”。这里的空框表示接口不支持，不是检测模型漏检。'}
    </Feedback>
  </div>;
}
