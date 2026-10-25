import React, { useCallback, useState, useEffect } from 'react';
import { C, ViperCanvas, box, clearScene, label, line } from './viper-kit';
import { CodePane, LabStyles, Stepper, drawPhoto, usePaperImage } from './lab-kit';

export const muffinCode = [
  'patch = ImagePatch(image)',
  'muffin_patches = patch.find("muffin")',
  'kid_patches = patch.find("kid")',
  'return str(len(muffin_patches) // len(kid_patches))',
];
const muffinCenters = [[82,250],[170,243],[234,250],[298,278],[20,294],[114,310],[171,307],[239,308]];
function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string) {
 line(ctx,x1,y1,x2,y2,color,3); const angle=Math.atan2(y2-y1,x2-x1);
 line(ctx,x2,y2,x2-10*Math.cos(angle-.5),y2-10*Math.sin(angle-.5),color,3);
 line(ctx,x2,y2,x2-10*Math.cos(angle+.5),y2-10*Math.sin(angle+.5),color,3);
}
function photoRegion(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string) {
 ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);
}
function patchSample(ctx:CanvasRenderingContext2D,image:HTMLImageElement|null,sx:number,sy:number,sw:number,sh:number,x:number,y:number,w:number,h:number,color:string) {
 box(ctx,x,y,w,h,'#fff',color,3);
 if(image){const scaleX=image.naturalWidth/324,scaleY=image.naturalHeight/324;ctx.drawImage(image,sx*scaleX,sy*scaleY,sw*scaleX,sh*scaleY,x+3,y+3,w-6,h-6);}
}

export const HeroOldProof:React.FC = () => {
 const image=usePaperImage('muffins');
 const draw=useCallback((ctx:CanvasRenderingContext2D)=>{
  clearScene(ctx,560,140);drawPhoto(ctx,image,12,10,120,120);
  box(ctx,178,38,146,64,'#edf0f3',C.muted,8);label(ctx,'黑箱模型',196,70,C.muted,24);arrow(ctx,136,70,169,70,C.muted);
  arrow(ctx,331,70,402,70,C.muted);label(ctx,'4',430,70,C.blue,46);
 },[image]);
 return <div className="vlab"><LabStyles/><h3 className="paper-baseline-title">端到端视觉问答（概念示意）</h3><ViperCanvas width={560} height={140} draw={draw} ariaLabel="原文两名孩子与松饼照片，直接作答示意输出4，但中间证据不可见"/><p style={{margin:'8px 0',fontSize:18}}>答案是 <strong>4</strong>，计数和计算过程没有展示。</p><p className="lab-caption">黑箱式呈现（教学对照）；此处未声称某个基线在这张图上的实际输出。</p></div>;
};

export const HeroNewProof:React.FC = () => {
 const image=usePaperImage('muffins');const [revealed,setRevealed]=useState(false);
 const draw=useCallback((ctx:CanvasRenderingContext2D)=>{
  clearScene(ctx,560,140);drawPhoto(ctx,image,12,10,120,120);
  photoRegion(ctx,14,91,116,36,C.blue);photoRegion(ctx,14,14,55,77,C.orange);photoRegion(ctx,73,14,55,77,C.orange);
  arrow(ctx,140,70,195,70,C.blue);box(ctx,200,35,135,70,'white',C.blue,6);label(ctx,'程序执行',213,70,C.blue,22);
  arrow(ctx,342,70,390,70,C.green);label(ctx,'4',425,70,C.green,46);

 },[image,revealed]);
 return <div className="vlab"><LabStyles/><div className="hero-pipeline" aria-label="本文方法主线">{['问题','Codex','Python 程序','工具','答案'].map((name,i)=><React.Fragment key={name}>{i>0&&<span aria-hidden="true">→</span>}<b>{name}</b></React.Fragment>)}</div><ViperCanvas width={560} height={140} draw={draw} ariaLabel={revealed?'8个松饼、2名孩子，经整除得到4':'程序调用工具获取计数，Python计算，返回4'}/><div className="lab-stage"><button type="button" aria-pressed={revealed} onClick={()=>setRevealed(v=>!v)}>{revealed?'收起执行依据':'显示执行依据'}</button></div><p style={{margin:'8px 0',fontSize:18}}>{revealed?<><strong>8 个区域 ÷ 2 个区域 → 字符串“4”</strong>。</>:'展开计数，核对 8 // 2 = 4。'}</p><p className="lab-caption">图1报告值；框线为教学示意。</p></div>;
};

export const MuffinTrace:React.FC = () => {
 const [step,setStep]=useState(0),[moving,setMoving]=useState(false);useEffect(()=>{setMoving(step===1||step===2);const timer=window.setTimeout(()=>setMoving(false),650);return()=>window.clearTimeout(timer);},[step]);const image=usePaperImage('muffins');
 const draw=useCallback((ctx:CanvasRenderingContext2D,time:number)=>{
  const p=moving?Math.min(1,time/600):1,e=p*p*(3-2*p);clearScene(ctx,1080,280);drawPhoto(ctx,image,18,15,250,250);
  if(step>=1) photoRegion(ctx,23,177,239,84,C.blue);
  if(step>=2){photoRegion(ctx,23,21,118,157,C.orange);photoRegion(ctx,145,25,117,153,C.orange);}
  if(step>=1){muffinCenters.forEach(([x,y],i)=>patchSample(ctx,image,Math.max(0,x-22),Math.max(0,y-20),Math.min(44,324-Math.max(0,x-22)),Math.min(40,324-Math.max(0,y-20)),step===1?180+(328+(i%4)*55-180)*e:328+(i%4)*55,step===1?210+(35+Math.floor(i/4)*52-210)*e:35+Math.floor(i/4)*52,46,44,C.blue));arrow(ctx,269,217,316,85,C.blue);label(ctx,'8',582,85,C.blue,38);}
  else {ctx.setLineDash([6,5]);box(ctx,326,34,270,99,"#f8f9fb",C.border,5);ctx.setLineDash([]);label(ctx,"muffin_patches = ?",343,85,C.muted,20);}
  if(step>=2){patchSample(ctx,image,1,1,150,211,step===2?70+(333-70)*e:333,step===2?60+(165-60)*e:165,76,97,C.orange);patchSample(ctx,image,159,1,164,211,step===2?190+(428-190)*e:428,step===2?60+(165-60)*e:165,76,97,C.orange);arrow(ctx,269,80,316,206,C.orange);label(ctx,'2',582,207,C.orange,38);}
  else {ctx.setLineDash([6,5]);box(ctx,326,164,270,98,"#f8f9fb",C.border,5);ctx.setLineDash([]);label(ctx,"kid_patches = ?",350,208,C.muted,20);}
  if(step>=3){arrow(ctx,637,85,720,140,C.blue);arrow(ctx,637,207,720,140,C.orange);box(ctx,726,97,102,86,'#fff',C.green,8);ctx.beginPath();ctx.moveTo(750,155);ctx.lineTo(805,122);ctx.strokeStyle=C.green;ctx.lineWidth=4;ctx.stroke();ctx.beginPath();ctx.arc(752,121,4,0,Math.PI*2);ctx.arc(801,156,4,0,Math.PI*2);ctx.fillStyle=C.green;ctx.fill();arrow(ctx,838,140,907,140,C.green);label(ctx,'4',942,140,C.green,56);}
  else {ctx.setLineDash([6,5]);box(ctx,735,97,290,86,"#f8f9fb",C.border,8);ctx.setLineDash([]);label(ctx,"等待两个计数",784,140,C.muted,22);}
 },[image,step,moving]);
 const feedback=[
  'ImagePatch(image) 只包装输入图像；还没有获得任何检测列表。',
  'find("muffin") 返回8个区域组成的列表。len(muffin_patches) 才是整数8。',
  'find("kid") 返回2个区域组成的列表。图像检测为计算提供两个计数。',
  'Python 计算8 // 2 = 4，再由 str(...) 返回字符串“4”。整除不需要视觉模型完成。',
 ][step];
 return <div className="vlab"><LabStyles/><p className="lab-question">每个孩子可以分到几个松饼？假设平均分配全部松饼。</p><Stepper compact labels={['包装图像','识别松饼','识别孩子','计算并返回']} step={step} onChange={setStep}/><ViperCanvas draw={draw} animate={moving} ariaLabel={`松饼推理第${step+1}步：原图、区域列表、计数和计算随步骤同步更新`}/><p className="lab-caption">原文图1的照片；区域裁剪与框线为教学近似，未重新运行检测模型。</p><div className="lab-columns"><section><h4 className="lab-heading">执行中的变量</h4><div className="lab-table-scroll"><table><thead><tr><th>变量</th><th>类型与当前值</th></tr></thead><tbody><tr><td className="lab-term">muffin_patches</td><td>{step>=1?'list[ImagePatch]，长度8':'尚未执行 find'}</td></tr><tr><td className="lab-term">kid_patches</td><td>{step>=2?'list[ImagePatch]，长度2':'尚未执行 find'}</td></tr><tr><td className="lab-term">返回值</td><td>{step>=3?'str，"4"':'尚未返回'}</td></tr></tbody></table></div></section><section><h4 className="lab-heading">可检查的程序</h4><CodePane lines={muffinCode} active={[step]} title="图1程序的等价教学写法"/></section></div><div className={`lab-output ${step===3?'is-good':'is-active'}`} aria-live="polite">{feedback}</div></div>;
};

const pancakeCode=[
 'patch = ImagePatch(image)',
 'pancake = patch.find("pancake")[0]',
 'is_brown = pancake.verify_property("pancake", "brown")',
 'is_round = pancake.verify_property("pancake", "round")',
 'return "yes" if is_brown and is_round else "no"',
];
const bookcaseCode=[
 'patch = ImagePatch(image)',
 'bookcases = patch.find("bookcase")',
 'bookcase = next(b for b in bookcases if b.verify_property("bookcase", "wood"))',
 'bottle = patch.find("water bottle")[0]',
 'x_bookcase = bookcase.horizontal_center',
 'x_bottle = bottle.horizontal_center',
 'return "yes" if x_bottle > x_bookcase else "no"',
];
export const pancakeOrCode=[
 'patch = ImagePatch(image)',
 'pancake = patch.find("pancake")[0]',
 'is_brown = pancake.verify_property("pancake", "brown")',
 'is_round = pancake.verify_property("pancake", "round")',
 'return "yes" if is_brown or is_round else "no"',
];
export const GqaLab:React.FC = () => {
 const [mode,setMode]=useState<'pancake'|'bookcase'>('pancake');
 const [brown,setBrown]=useState(true),[round,setRound]=useState(true),[useOr,setUseOr]=useState(false);
 const [bookX,setBookX]=useState(239),[bottleX,setBottleX]=useState(608.5);
 const pancake=mode==='pancake';
 const changed=pancake?(!brown||!round||useOr):(bookX!==239||bottleX!==608.5);
 const answer=pancake?(useOr?brown||round:brown&&round):bottleX>bookX;
 const expected=pancake?brown&&round:bottleX>bookX;
 const image=usePaperImage(mode),firstPatch=usePaperImage(pancake?'pancake-patch':'bookcase-patch'),secondPatch=usePaperImage('bottle-patch');
 const restore=()=>{setBrown(true);setRound(true);setUseOr(false);setBookX(239);setBottleX(608.5);};
 const draw=useCallback((ctx:CanvasRenderingContext2D)=>{
  clearScene(ctx,1080,280);drawPhoto(ctx,image,15,20,350,240);
  if(pancake){photoRegion(ctx,20,37,210,196,C.blue);drawPhoto(ctx,firstPatch,410,57,164,164);arrow(ctx,370,139,402,139,C.blue);}
  else{photoRegion(ctx,113,31,195,232,C.blue);photoRegion(ctx,334,126,26,120,C.orange);drawPhoto(ctx,firstPatch,413,26,105,111);drawPhoto(ctx,secondPatch,428,153,77,106);arrow(ctx,370,90,403,79,C.blue);arrow(ctx,370,217,418,207,C.orange);}
  box(ctx,628,32,156,77,'#fff',pancake&&!brown?C.red:C.blue,6);box(ctx,628,171,156,77,'#fff',pancake?(round?C.blue:C.red):C.orange,6);
  arrow(ctx,581,105,618,70,C.blue);arrow(ctx,581,184,618,210,pancake?C.blue:C.orange);
  const color=answer?C.green:C.red;
  arrow(ctx,791,70,859,133,C.blue);arrow(ctx,791,210,859,147,pancake?C.blue:C.orange);
  ctx.beginPath();ctx.moveTo(870,100);ctx.lineTo(922,140);ctx.lineTo(870,180);ctx.lineTo(827,140);ctx.closePath();ctx.fillStyle=answer?'#edf7f0':'#fff2ec';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();arrow(ctx,929,140,997,140,color);box(ctx,1006,112,42,56,color,color,5);label(ctx,pancake?(useOr?'or':'and'):'>',pancake?845:858,140,color,20);label(ctx,answer?'yes':'no',1011,140,'white',16);
 },[image,firstPatch,secondPatch,pancake,brown,round,useOr,answer]);
 return <div className="vlab"><LabStyles/>
 <div className="lab-stage" role="group" aria-label="选择图4问题"><button type="button" aria-pressed={pancake} onClick={()=>setMode('pancake')}>煎饼：棕色且圆形？</button><button type="button" aria-pressed={!pancake} onClick={()=>setMode('bookcase')}>水瓶：在木制书架右侧？</button></div>
 <p className="lab-question">{pancake?'切换模型返回的属性。模型提供True/False；Python组合这些值。论文使用AND，OR为教学扩展。':'移动教学中心坐标。让水瓶跨过书架，观察“在右侧”何时从yes变为no。'}</p>
 <div className="lab-experiment">{pancake?<><div className="lab-columns"><label className="lab-switch"><input type="checkbox" checked={brown} onChange={e=>setBrown(e.target.checked)}/> brown = {String(brown?'True':'False')}（棕色）</label><label className="lab-switch"><input type="checkbox" checked={round} onChange={e=>setRound(e.target.checked)}/> round = {String(round?'True':'False')}（圆形）</label></div><div className="lab-stage" role="group" aria-label="选择逻辑运算"><button type="button" aria-pressed={!useOr} onClick={()=>setUseOr(false)}>原文 AND：两个都满足</button><button type="button" aria-pressed={useOr} onClick={()=>setUseOr(true)} style={{background:useOr?"#fff0e3":"white",color:"#934516",borderColor:"#f07e47"}}>教学实验 OR：至少一个满足</button></div></>:<><div className="lab-columns">{[['书架',bookX,setBookX],['水瓶',bottleX,setBottleX]].map(([name,value,setter])=><label key={String(name)}>{String(name)}水平中心：<strong>{Number(value).toFixed(1)}</strong><input type="range" min="0" max="800" step="0.5" aria-label={`${String(name)}的教学水平中心`} value={Number(value)} onKeyDown={e=>e.stopPropagation()} onChange={e=>(setter as (value:number)=>void)(Number(e.target.value))} className="lab-range"/></label>)}</div><div className="coordinate-track" role="img" aria-label={`教学坐标轴：书架${bookX}，水瓶${bottleX}`}><span className="coordinate-marker" style={{left:`${bookX/8}%`,top:8}}>书架</span><span className="coordinate-marker is-bottle" style={{left:`${bottleX/8}%`,top:54}}>水瓶</span></div></>}
 <div className="lab-stage"><button type="button" onClick={restore}>恢复图4原文值</button></div>
 <p className="lab-caption">{changed?'当前为教学实验：照片不变，只改变传给Python的属性、坐标或逻辑代码。':'原文基准：brown=True、round=True；书架239.0、水瓶608.5。'}不是重新运行视觉模型。</p></div>
 <div className="dual-labels"><span>感知模型 · 属性与坐标</span><span>Python · 组合与判断</span></div><div style={{position:'relative'}}><ViperCanvas draw={draw} ariaLabel={pancake?`${brown} ${useOr?'or':'and'} ${round} 得到${answer?'yes':'no'}`:`${bottleX} > ${bookX} 得到${answer?'yes':'no'}`}/>{[pancake?brown?'True':'False':bookX.toFixed(1),pancake?round?'True':'False':bottleX.toFixed(1)].map((value,i)=><span key={i} style={{position:'absolute',left:'65.4%',top:i===0?'25%':'75%',transform:'translate(-50%,-50%)',color:pancake?(value==='False'?C.red:C.blue):(i===0?C.blue:C.orange),fontSize:'clamp(16px,2vw,28px)',fontWeight:700}}>{value}</span>)}<span className="logic-gate-label" style={{left:'80.5%',color:answer?C.green:C.red}}>{pancake?(useOr?'or':'and'):'>'}</span><span className="logic-gate-label" style={{left:'95.1%',color:'white',background:answer?C.green:C.red}}>{answer?'yes':'no'}</span></div>
 <div className="lab-columns"><CodePane lines={pancake?(useOr?pancakeOrCode:pancakeCode):bookcaseCode} active={[pancake?4:6]} title={useOr&&pancake?'教学实验：将 AND 换为 OR（非论文程序）':'等价简化代码 · Figure 4 逻辑（非逐行原代码）'}/><div className={`lab-output ${useOr&&pancake?'is-experiment':answer?'is-good':''}`} aria-live="polite"><b>Python现在执行</b><span className="lab-value">{pancake?`${brown?'True':'False'} ${useOr?'or':'and'} ${round?'True':'False'}`:`${bottleX.toFixed(1)} > ${bookX.toFixed(1)}`} → "{answer?'yes':'no'}"</span>{pancake&&useOr?<p>题目仍然问“且”。按AND应返回“{expected?'yes':'no'}”；{answer!==expected?'OR改变了问题的含义，当前结果不符合题意。':(brown?'这一组输入恰好同结果；把其中一个属性改为False，就能看见区别。':'两个都为False时结果相同；把其中一个改为True，就能看见区别。')}</p>:<p>{pancake?'程序忠实组合两个输入。任何一个是False，AND都不成立。':bottleX===bookX?'两中心相同，严格大于不成立。':'水平坐标越大越靠右。图像中的对象没有移动，移动的是教学输入。'}</p>}</div></div>
 <p className="lab-caption">原图与裁片来自图4，框线为教学近似。原文属性值为True／True；修改值与OR分支都是教学实验。</p>
 <style>{`.vlab .logic-gate-label{position:absolute;top:50%;transform:translate(-50%,-50%);font-weight:700;font-size:clamp(14px,1.8vw,20px);padding:0 2px;background:#f5f8f0}.vlab .coordinate-track{position:relative;height:102px;margin:12px 30px;border-bottom:2px solid #68778f}.vlab .coordinate-marker{position:absolute;transform:translateX(-50%);padding:4px 8px;background:#edf3f8;border-bottom:3px solid #27446e;font-size:16px;white-space:nowrap;transition:left .2s}.vlab .coordinate-marker.is-bottle{background:#fff0df;border-color:#f07e47}`}</style>
 </div>;
};
