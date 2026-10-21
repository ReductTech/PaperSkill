import { useState } from 'react';
import { CanvasPlot, COLORS as C, clearScene, line, box, text } from './vdsr-kit';
const table: Record<string, number[]> = {
  '2': [37.10,30.42,28.43], '3':[30.05,32.89,28.73],
  '4':[28.13,30.50,30.84], '23':[37.09,33.22,28.70], '24':[37.03,31.20,30.86], '34':[32.43,33.24,30.94], '234':[37.06,33.27,30.95],
};
const bicubic = [33.66,30.39,28.42];
export function Vdsr5() {
  const [train,setTrain] = useState('2');
  const [test,setTest] = useState(3);
  const model = table[train][test-2], base = bicubic[test-2];
  const covered = train.includes(String(test));
  return <div className="vdsr-widget" onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))e.stopPropagation();}}>
    <div className="vdsr-controls" role="group" aria-label="训练倍率">
      <strong>训练包含</strong>{['2','3','4','23','24','34','234'].map(t=><button key={t} className={train===t?'is-active':''} aria-pressed={train===t} onClick={()=>setTrain(t)}>{t.split('').map(s=>`×${s}`).join('、')}</button>)}
    </div>
    <div className="vdsr-controls" role="group" aria-label="测试倍率"><strong>测试倍率</strong>{[2,3,4].map(t=><button key={t} className={test===t?'is-active':''} aria-pressed={test===t} onClick={()=>setTest(t)}>×{t}</button>)}</div>
    <CanvasPlot label="同测试倍率下，双三次插值与当前训练模型的PSNR比较；条形采用0至40dB刻度" draw={(ctx,w,h)=>{
      clearScene(ctx,w,h);
      const left=170,right=940,y0=226,span=right-left;
      line(ctx,left,y0,right,y0,C.axis,2);
      [0,10,20,30,40].forEach(v=>line(ctx,left+span*v/40,y0-4,left+span*v/40,y0+4,C.axis,2));
      box(ctx,left,66,span*base/40,42,C.blue);
      box(ctx,left,146,span*model/40,42,covered?C.green:C.red);
      text(ctx,'插值',58,96,C.blue,22); text(ctx,'模型',58,176,covered?C.green:C.red,22);
    }}/>
    <div className="vdsr-metrics"><span>模型 PSNR：<strong>{model.toFixed(2)} dB</strong></span><span>双三次：<strong>{base.toFixed(2)} dB</strong></span><span>差值：<strong>{(model-base).toFixed(2)} dB</strong></span></div>
    <p className="vdsr-feedback" aria-live="polite">{train==='2'&&test===3?'单倍率×2模型测试×3：30.42 dB，几乎没有超过双三次插值的30.39 dB。':covered?`训练包含×${test}，模型为${model.toFixed(2)} dB；联合训练共享参数来处理训练过的倍率。`:`训练没有包含×${test}，跨倍率测试为${model.toFixed(2)} dB；不能把单倍率能力直接推广到其他倍率。`}</p>
    <p>第6页表2：91张训练图、Set5、PSNR越高越好。只展示论文中的×2、×3、×4，不保证任意未见倍率；条长以0 dB为基线。</p>
  </div>;
}
