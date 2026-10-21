import { useState } from 'react';
import { C, Scene, photo, bird, frame, line, Chips, Feedback } from './gd-kit';

export function TaskGrounded() {
  const [prompt, setPrompt] = useState(0);
  const names = ['鸟', '红色的鸟', '树枝左侧的红鸟'];
  const count = prompt === 0 ? 2 : 1;
  return <div>
    <Chips items={names} value={prompt} onChange={setPrompt} label="文本条件请求" />
    <Scene label={`语言条件的任务示意：${names[prompt]}，人工定义的目标集合包含${count}只鸟`} draw={ctx => {
      photo(ctx, 20, 20, 720, 240);
      line(ctx, 770, 24, 770, 256, C.border);
      frame(ctx, 190, 84, 94, 78, C.green);
      if (prompt === 0) frame(ctx, 420, 74, 94, 78, C.green);
      else frame(ctx, 420, 74, 94, 78, C.muted, true);
      if (prompt === 2) { line(ctx, 286, 165, 350, 165, C.blue, 3); line(ctx, 286, 165, 298, 157, C.blue, 3); line(ctx, 286, 165, 298, 173, C.blue, 3); }
      ctx.save(); ctx.fillStyle=C.text;ctx.textAlign='center';ctx.font='600 19px sans-serif';ctx.fillText('目标集合',920,68);
      ctx.font='700 54px sans-serif';ctx.fillText(String(count),920,139);ctx.restore();
      if (count === 2) { bird(ctx, 885, 207, 20, C.red);bird(ctx,956,207,20,C.blue); }
      else bird(ctx, 920, 207, 26, C.red);
    }} />
    <Feedback tone="info">
      {prompt === 0 ? '输入类别“鸟”，人工定义的目标集合含两只鸟。语言接口允许在推理时提供类别名。' : prompt === 1 ? '加入颜色属性后，本例的目标集合只含红鸟。界面展示“应该找谁”，尚未验证模型是否能找对。' : '关系描述在这张示意图中仍指向同一只红鸟，所以目标数保持为 1。描述更长，并不自动证明真实模型理解了空间关系。'}
    </Feedback>
  </div>;
}
