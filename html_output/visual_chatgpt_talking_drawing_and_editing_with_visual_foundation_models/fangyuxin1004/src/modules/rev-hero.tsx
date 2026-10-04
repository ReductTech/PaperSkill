import { useState } from 'react';
import { Scene, colors, photo, panel, line, dot, label } from './vc-visual-kit';
const stages = ['接收任务', '估计深度', '生成红花', '转为卡通'];
const epoch = performance.now() / 1000;
function arrow(c: CanvasRenderingContext2D, x: number, y: number, w: number, color: string) { line(c,x,y,x+w,y,color,2); line(c,x+w-7,y-5,x+w,y,color,2); line(c,x+w-7,y+5,x+w,y,color,2); }
export function HeroComparison({ oldDesc, newDesc }: { oldDesc: string; newDesc: string }) {
  const [automatic, setAutomatic] = useState(true);
  const [selected, setSelected] = useState(0);
  const draw = (good: boolean) => (c: CanvasRenderingContext2D, t: number) => {
    const cycle = ((t - epoch) % 20 + 20) % 20;
    const step = automatic ? Math.floor(cycle / 5) : selected;
    const progress = automatic ? Math.min(1, (cycle % 5) / 3) : 1;
    label(c, good ? `当前阶段 · ${stages[step]}` : '仅有文本能力，无法执行视觉变换', 22, 30, good ? colors.blue : colors.muted, 18);
    const inputs = ['yellow', 'yellow', 'depth', 'red'];
    const outputs = ['yellow', 'depth', 'red', 'cartoon'];
    photo(c, 24, 75, 150, 150, good ? inputs[step] : 'yellow');
    label(c, good && step === 2 ? '预测深度' : good && step === 3 ? '生成的红花' : '输入黄花', 37, 251, colors.muted, 16);
    arrow(c, 187, 145, 140, good ? colors.blue : colors.muted);
    if (good) {
      const pulse = (t % 2) / 2;
      dot(c, 192 + 128 * pulse, 145, 5, colors.blue);
      label(c, ['整理请求', '深度估计', '条件生成', '风格转换'][step], 210, 116, colors.blue, 16);
      if (step === 2) label(c, '+ 红花描述', 208, 184, colors.red, 15);
      photo(c, 346, 75, 150, 150, step === 0 ? 'yellow' : inputs[step]);
      if (step > 0) { c.save(); c.beginPath(); c.rect(346, 75, 150 * progress, 150); c.clip(); photo(c, 346, 75, 150, 150, outputs[step]); c.restore(); }
      if (progress < 1 && step > 0) line(c,346+150*progress,82,346+150*progress,211,colors.blue,2);
      label(c, ['等待选择工具', '深度条件图', '红花图像', '卡通红花'][step], 359, 251, colors.blue, 16);
      panel(c,22,275,476,52,'#fff',colors.border);
      label(c, ['语言模型分解任务，视觉模型处理图像。', '从原图估计远近关系，形成结构条件。', '深度条件与红花描述共同引导生成。', '在红花结果上继续进行风格转换。'][step],34,307,colors.ink,16);
    } else {
      const x = 196 + ((t % 2) / 2) * 66;
      dot(c,x,145,5,colors.muted); line(c,269,132,269,158,colors.red,3);
      panel(c,346,75,150,150,'#fff',colors.border);
      label(c,'文本答复',382,120,colors.muted,18);
      label(c,'需要视觉工具',367,155,colors.ink,16);
      label(c,'才能修改图像',367,181,colors.ink,16);
      label(c,'未生成图像',376,251,colors.muted,16);
      panel(c,22,275,476,52,'#fff',colors.border);
      label(c,'能讨论任务，但缺少实际执行视觉操作的能力。',34,307,colors.muted,16);
    }
  };
  return <div>
    <div className="hero-step-controls" aria-label="封面演示阶段">
      <button type="button" className={`chip ${automatic ? 'active' : ''}`} aria-pressed={automatic} onClick={() => setAutomatic(!automatic)}>自动演示 {automatic ? '开' : '关'}</button>
      {stages.map((s,i) => <button type="button" key={s} className={`chip ${!automatic && selected === i ? 'active' : ''}`} aria-pressed={!automatic && selected === i} onClick={() => { setSelected(i); setAutomatic(false); }}>{i + 1}. {s}</button>)}
    </div>
    <div className="hero-compare">
      <div className="bg-side old"><div className="bg-side-head">文本对话模型 · 未连接视觉工具</div><div className="bg-side-canvas"><Scene width={520} height={348} animate label="文本模型能理解任务文字，但没有视觉工具便无法产出编辑后的图像" draw={draw(false)} /></div><div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: oldDesc }} /></div>
      <div className="bg-side new"><div className="bg-side-head">Visual ChatGPT · 协调视觉工具</div><div className="bg-side-canvas"><Scene width={520} height={348} animate label="黄花经过深度估计、深度条件红花生成、风格转换，得到卡通红花" draw={draw(true)} /></div><div className="bg-side-tag" dangerouslySetInnerHTML={{ __html: newDesc }} /></div>
    </div>
  </div>;
}
