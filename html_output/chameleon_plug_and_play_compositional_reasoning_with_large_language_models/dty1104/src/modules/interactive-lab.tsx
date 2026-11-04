import React,{useEffect,useRef,useState} from 'react';
import {setupCanvas} from '../lib/canvasKit';

type Props={chapterId:string;moduleId:string};
const C={bg:'#f5f8f0',paper:'#fffdf8',line:'#d7deea',ink:'#21324a',muted:'#68778f',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',pale:'#b8c9a7'};
type Config={options:string[];summary:string[];detail:string[];source:string};
const D:Record<string,Config>={
 '1.1':{options:['纯文字','插图题','表格题'],summary:['已有文字线索','需要视觉线索','需要定位与计算'],detail:['纯文字题可直接尝试解答；遇到陌生事实仍需核对知识来源。','插图题先识别对象与关系，再将视觉信息交给解答模块。','表格题先缩小相关行列，再在需要时用程序做精确计算。'],source:'图1、§3–4'},
 '2.1':{options:['原始输入','加入图像描述','加入检索知识'],summary:['缓存暂时为空','缓存获得视觉语义','缓存进一步获得背景知识'],detail:['当前只有原题，后续模块还读不到外部证据。','图像描述写入缓存，后续模块可以引用。描述可能损失细节。','知识线索也进入缓存；它与题目相关性仍需判断。'],source:'§3，式(2)–(4)'},
 '3.1':{options:['直接猜测','图像描述路线','文字检测路线'],summary:['缺少证据','看场景的路线','读海报文字的路线'],detail:['直接生成答案，没有取得图中文字。','图像描述可给出画面语义，却可能漏掉广告的准确文案。','文字检测→知识检索→解答→答案，更适合图中文字主导的问题。'],source:'图1，§3'},
 '4.1':{options:['原始输入','图像描述','知识检索','形成解答','输出答案'],summary:['x₀ + c₀','y₁ 写入 c₁','y₂ 写入 c₂','产生推理文本','末步产生 r'],detail:['规划器已生成工具序列，但尚未执行。','图像描述产生语义并进入缓存。','知识检索增加背景信息，保留已有视觉语义。','解答模块根据题目与缓存形成推理。','答案生成器抽取并规范最终选项。'],source:'§3，式(1)–(5)'},
 '5.1':{options:['图像描述','文字检测','两者结合'],summary:['场景语义','图内字词','互补证据'],detail:['能概括画面对象，但未必读出准确小字。','能读取图表或海报上的字词，但不能单独说明画面关系。','两路信息可互补；真正调用哪路仍由规划器根据问题决定。'],source:'图1，§4.1'},
 '6.1':{options:['不检索','知识检索','生成查询再搜索'],summary:['现有线索','背景概念','外部搜索结果'],detail:['陌生概念只能靠模型已有知识，可能猜错。','知识检索提供任务相关背景；内容仍须核对。','先生成更针对性的查询，再取回网页结果；来源和相关性仍重要。'],source:'§4.1，图4'},
 '7.1':{options:['整张表','定位相关行列','生成并验证程序'],summary:['噪声较多','数据收窄','精确计算'],detail:['示意表中只有一部分数字与问题有关。','突出需要的行与列，减少无关上下文。','教学示例：3件每件12元，加运费4元，共40元；程序可执行不保证读数一定正确。'],source:'§4.1–4.3'},
 '8.1':{options:['视觉模块','知识模块','计算模块','答案模块'],summary:['转写视觉线索','补充外部知识','执行数值运算','输出规范答案'],detail:['图像描述和文字检测处理不同的视觉证据。','检索模块把背景概念或搜索结果放进缓存。','TabMWP路线使用表格处理及Python程序模块。','解答与答案模块位于任务序列末端。'],source:'§3–4，表2'},
 '9.1':{options:['结尾无效','结尾有效','执行限制'],summary:['触发固定回退','按计划执行','不会动态重规划'],detail:['ScienceQA 中不以解答与答案模块结尾的计划会回退到固定两步。','格式满足末端约束，可以按序运行；仍可能出现内容错误。','论文说明计划一次生成，执行中不会重新规划。'],source:'§4.2，附录B'},
 '10.1':{options:['ScienceQA','TabMWP'],summary:['86.54% 对 83.99%','98.78% 对 96.93%'],detail:['测试集准确率；GPT-4版 Chameleon 比同表 GPT-4 CoT 高2.55个百分点。','测试集准确率；GPT-4版 Chameleon 比同表 GPT-4 PoT 高1.85个百分点。'],source:'表3、表4'},
 '10.2':{options:['知识检索','网页搜索','文字检测','图像描述','程序生成'],summary:['ScienceQA −7.8','ScienceQA −7.4','ScienceQA −8.4','ScienceQA −6.0','TabMWP −7.4'],detail:['禁用知识检索后的准确率下降7.8个百分点。','禁用Bing搜索后的准确率下降7.4个百分点。','禁用文字检测后的准确率下降8.4个百分点。','禁用图像描述后的准确率下降6.0个百分点。','禁用程序生成后的准确率下降7.4个百分点。'],source:'表5；ChatGPT规划器，500题'}
};

function box(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill:string,border=C.line,r=12){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();g.strokeStyle=border;g.lineWidth=1.5;g.stroke()}
function stroke(g:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=2){g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke()}
function dot(g:CanvasRenderingContext2D,x:number,y:number,r:number,col:string){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=col;g.fill()}
function label(g:CanvasRenderingContext2D,s:string,x:number,y:number,color=C.ink,size=15){g.fillStyle=color;g.font=`600 ${size}px system-ui`;g.fillText(s,x,y)}
function card(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,active=false){g.shadowColor='rgba(33,50,74,.08)';g.shadowBlur=active?13:8;g.shadowOffsetY=3;box(g,x,y,w,h,active?'#f0f6ff':C.paper,active?C.blue:C.line);g.shadowBlur=0;g.shadowOffsetY=0}
function base(g:CanvasRenderingContext2D){g.clearRect(0,0,760,300);g.fillStyle=C.bg;g.fillRect(0,0,760,300);box(g,18,18,724,264,'#f9fbf7','#e0e8db',16);stroke(g,484,38,484,264,C.line,1)}
function miniPaper(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){card(g,x,y,w,h);for(let i=0;i<4;i++)stroke(g,x+20,y+27+i*19,x+w-20-(i%2)*23,y+27+i*19,C.line,3)}
function evidence(g:CanvasRenderingContext2D,n:number,selected:number,caption:string){
 card(g,507,73,205,150,true);
 if(n===1){for(let i=0;i<3;i++){box(g,526,94+i*38,166,26,i===selected?'#e4edf7':'#f3f5f1',i===selected?C.blue:C.line,7);dot(g,544,107+i*38,6,i===selected?C.orange:C.pale);stroke(g,560,107+i*38,675,107+i*38,i===selected?C.blue:C.line,3)}}
 else if(n===2){for(let i=0;i<3;i++){const y=98+i*35;box(g,534,y,154,27,i<=selected?(i===0?'#e3edf8':i===1?'#e2f0e9':'#fff0df'):'#f3f5f1',i<=selected?(i===2?C.orange:C.blue):C.line,5);stroke(g,548,y+14,668,y+14,i<=selected?C.blue:C.line,3)}}
 else if(n===3){for(let i=0;i<4;i++){const x=543+i*45;dot(g,x,143,9,i<=selected+1?selected===0?C.red:C.blue:C.pale);if(i<3)stroke(g,x+10,143,x+35,143,i<=selected?C.blue:C.line,3)}dot(g,674,143,11,selected===0?C.red:C.green)}
 else if(n===4){for(let i=0;i<5;i++){const x=535+i*34;dot(g,x,145,10,i<=selected?C.blue:C.pale);if(i<4)stroke(g,x+11,145,x+23,145,i<selected?C.blue:C.line,3)}box(g,544,178,127,15,'#ecf1ee',C.line,4);box(g,544,178,Math.max(12,(selected+1)*25),15,'#a3d0b5',C.green,4)}
 else if(n===5){box(g,535,100,62,85,selected!==1?'#dff0e4':'#f3f5f1',selected!==1?C.green:C.line,8);dot(g,566,134,16,selected!==1?C.green:C.pale);box(g,622,100,62,85,selected!==0?'#fff0df':'#f3f5f1',selected!==0?C.orange:C.line,8);for(let i=0;i<3;i++)stroke(g,632,122+i*18,672,122+i*18,selected!==0?C.orange:C.line,3)}
 else if(n===6){box(g,539,100,141,83,selected===2?'#fff0df':'#e9f1e9',selected===2?C.orange:C.green,7);dot(g,564,126,12,selected===0?C.pale:selected===1?C.green:C.orange);for(let i=0;i<3;i++)stroke(g,586,118+i*19,659-(i%2)*17,118+i*19,selected===0?C.line:C.blue,3)}
 else if(n===7){for(let i=0;i<3;i++){box(g,535+i*47,108,37,44,i<=selected?'#e4edf7':'#f3f5f1',i<=selected?C.blue:C.line,4);dot(g,553+i*47,130,7,i<=selected?C.orange:C.pale)}stroke(g,550,185,672,185,selected===2?C.green:C.line,5)}
 else if(n===8){dot(g,607,137,21,C.blue);for(let i=0;i<4;i++){const a=i*Math.PI/2-Math.PI/2,x=607+63*Math.cos(a),y=137+62*Math.sin(a);stroke(g,607,137,x,y,i===selected?C.orange:C.line,i===selected?4:2);dot(g,x,y,12,i===selected?C.orange:C.pale)}}
 else if(n===9){dot(g,607,142,39,selected===0?C.red:selected===1?C.green:C.orange);if(selected===0){stroke(g,592,127,622,157,C.paper,5);stroke(g,622,127,592,157,C.paper,5)}else if(selected===1){stroke(g,589,142,603,156,C.paper,5);stroke(g,603,156,629,124,C.paper,5)}else{stroke(g,593,142,621,142,C.paper,5)}}
 else if(n===10){const delta=selected===0?2.55:1.85;dot(g,608,140,44,'#e4f2e8');label(g,'+'+delta.toFixed(2),570,149,C.green,22)}
 else {dot(g,608,140,44,'#fbe9eb');label(g,caption.split(' ').slice(-1)[0]||'−7.8',576,149,C.red,20)}
 const tone=(n===11||n===9&&selected===0)?C.red:C.green;
 box(g,507,234,205,28,tone===C.red?'#fbe9eb':'#e9f2e8',tone,6);stroke(g,526,248,684,248,tone,3)
}
function taskIcon(g:CanvasRenderingContext2D,type:number,x:number,y:number){
 if(type===0){miniPaper(g,x,y,185,151);dot(g,x+65,y+113,12,C.orange);stroke(g,x+96,y+114,x+146,y+114,C.blue,4)}
 if(type===1){card(g,x,y,185,151);box(g,x+16,y+15,153,83,'#e2ece5','#b8c9a7',6);dot(g,x+51,y+43,14,C.orange);stroke(g,x+28,y+83,x+78,y+56,C.blue,4);stroke(g,x+78,y+56,x+142,y+85,C.blue,4);stroke(g,x+33,y+119,x+149,y+119,C.line,4)}
 if(type===2){card(g,x,y,185,151);for(let k=0;k<5;k++)stroke(g,x+18,y+28+k*24,x+164,y+28+k*24,C.line,1);for(let k=0;k<4;k++)stroke(g,x+18+k*49,y+28,x+18+k*49,y+124,C.line,1);box(g,x+19,y+77,143,22,'rgba(240,126,71,.2)',C.orange,3)}
}
function draw(g:CanvasRenderingContext2D,id:string,k:number){
 const cfg=D[id];base(g);
 if(id==='1.1'){taskIcon(g,k,94,80);for(let j=0;j<3;j++){box(g,309,86+j*51,125,38,j===k?'#e2edf8':'#f3f5ee',j===k?C.blue:C.line,8);dot(g,329,105+j*51,6,j===k?C.orange:C.pale);stroke(g,345,105+j*51,413,105+j*51,j===k?C.blue:C.line,4)}evidence(g,1,k,cfg.summary[k])}
 else if(id==='2.1'){miniPaper(g,48,85,154,133);card(g,267,81,178,140,true);stroke(g,209,145,255,145,C.blue,3);dot(g,256,145,5,C.blue);if(k>0){box(g,288,108,137,30,'#dfece8',C.green,5);stroke(g,300,123,405,123,C.green,3)}if(k>1){box(g,288,152,137,30,'#fff0df',C.orange,5);stroke(g,300,167,396,167,C.orange,3)}evidence(g,2,k,cfg.summary[k])}
 else if(id==='3.1'){taskIcon(g,1,44,85);const yy=[103,151,199];for(let j=0;j<3;j++){box(g,256,yy[j],181,31,j===k?'#e7f1e9':'#f4f5f0',j===k?(k===0?C.red:C.green):C.line,6);for(let m=0;m<3;m++)dot(g,279+m*54,yy[j]+15,5,j===k?(k===0?C.red:C.green):C.pale)}evidence(g,3,k,cfg.summary[k])}
 else if(id==='4.1'){for(let j=0;j<5;j++){const x=49+(j%3)*134,y=90+Math.floor(j/3)*91;card(g,x,y,109,63,j===k);dot(g,x+27,y+30,11,j<=k?C.blue:C.pale);stroke(g,x+48,y+30,x+89,y+30,j<=k?C.blue:C.line,4)}evidence(g,4,k,cfg.summary[k])}
 else if(id==='5.1'){card(g,75,75,335,175,true);box(g,92,92,121,103,'#dfece8',C.line,7);dot(g,132,128,18,C.orange);stroke(g,110,176,151,142,C.blue,4);stroke(g,151,142,194,178,C.blue,4);stroke(g,227,113,390,113,C.line,5);stroke(g,227,137,371,137,C.line,5);stroke(g,227,161,382,161,C.line,5);if(k!==1)box(g,91,91,123,105,'rgba(34,141,92,.08)',C.green,7);if(k!==0)box(g,220,98,174,76,'rgba(240,126,71,.06)',C.orange,6);evidence(g,5,k,cfg.summary[k])}
 else if(id==='6.1'){miniPaper(g,53,83,143,143);for(let j=0;j<2;j++){card(g,248,86+j*80,181,63,j+1===k);dot(g,275,117+j*80,13,j+1===k?C.orange:C.pale);stroke(g,300,113+j*80,405,113+j*80,j+1===k?C.blue:C.line,4)}if(k===0)stroke(g,211,155,238,155,C.red,4);else stroke(g,211,155,238,155,C.green,4);evidence(g,6,k,cfg.summary[k])}
 else if(id==='7.1'){card(g,60,76,357,172,true);for(let j=0;j<5;j++)stroke(g,83,105+j*27,393,105+j*27,C.line,1);for(let j=0;j<5;j++)stroke(g,83+j*77,105,83+j*77,213,C.line,1);if(k>0)box(g,84,159,306,26,'rgba(240,126,71,.16)',C.orange,2);if(k>1){box(g,169,216,150,26,'#e4f1e8',C.green,5);label(g,'3×12+4=40',184,235,C.green,13)}evidence(g,7,k,cfg.summary[k])}
 else if(id==='8.1'){const pos:[[number,number],[number,number],[number,number],[number,number]]=[[94,112],[314,112],[94,210],[314,210]];for(let j=0;j<4;j++){const [x,y]=pos[j];card(g,x,y,118,58,j===k);dot(g,x+25,y+29,12,j===k?C.orange:C.pale);stroke(g,x+47,y+29,x+95,y+29,j===k?C.blue:C.line,4)}stroke(g,212,141,314,141,C.line,3);stroke(g,153,170,153,210,C.line,3);stroke(g,373,170,373,210,C.line,3);evidence(g,8,k,cfg.summary[k])}
 else if(id==='9.1'){card(g,61,88,346,139,true);for(let j=0;j<4;j++){dot(g,101+j*86,149,13,j<2?C.blue:(k===0?C.red:C.green));if(j<3)stroke(g,115+j*86,149,174+j*86,149,k===0&&j>1?C.red:C.blue,3)}if(k===0){stroke(g,331,189,379,211,C.red,3);stroke(g,379,189,331,211,C.red,3)}if(k===1){stroke(g,333,199,349,212,C.green,4);stroke(g,349,212,381,182,C.green,4)}if(k===2){box(g,287,184,103,29,'#fff0df',C.orange,5)}evidence(g,9,k,cfg.summary[k])}
 else if(id==='10.1'){const values=k===0?[83.99,86.54]:[96.93,98.78];for(let j=0;j<2;j++){const y=103+j*78;card(g,47,y,405,54,j===1);const w=Math.round(values[j]/100*305);box(g,72,y+17,w,21,j===0?'#b6c8dc':'#77bd92',j===0?C.blue:C.green,5);label(g,values[j].toFixed(2)+'%',393,y+35,j===0?C.blue:C.green,15)}evidence(g,10,k,cfg.summary[k])}
 else {const drops=[7.8,7.4,8.4,6.0,7.4];card(g,63,88,365,137,true);box(g,86,120,305,22,'#b6c8dc',C.blue,5);box(g,86,159,Math.round(drops[k]/9*305),23,'#f2a5ad',C.red,5);label(g,'−'+drops[k].toFixed(1),346,205,C.red,19);evidence(g,11,k,cfg.summary[k])}
}

export const InteractiveLab:React.FC<Props>=({moduleId})=>{
 const [k,setK]=useState(0),ref=useRef<HTMLCanvasElement>(null),cfg=D[moduleId];
 useEffect(()=>setK(0),[moduleId]);
 useEffect(()=>{const el=ref.current;if(!el||!cfg)return;const g=setupCanvas(el,760,300);el.style.width='100%';el.style.height='auto';draw(g,moduleId,k);el.classList.add('is-ready')},[moduleId,k,cfg]);
 if(!cfg)return <div className="feedback bad">该交互尚未配置。</div>;
 return <div style={{maxWidth:760,margin:'0 auto'}}>
  <div role="group" aria-label="交互选项" style={{display:'flex',flexWrap:'wrap',gap:8,margin:'8px 0 13px'}}>{cfg.options.map((v,i)=><button key={v} type="button" aria-pressed={k===i} onClick={()=>setK(i)} style={{border:`1px solid ${k===i?C.blue:C.line}`,background:k===i?C.blue:C.paper,color:k===i?'white':C.ink,borderRadius:999,padding:'8px 13px',cursor:'pointer',fontSize:14,fontWeight:600,whiteSpace:'normal',textAlign:'center'}}>{v}</button>)}</div>
  <canvas ref={ref} width={760} height={300} role="img" aria-label={`${cfg.summary[k]}的交互示意`} />
  <div style={{display:'flex',flexWrap:'wrap',gap:7,alignItems:'center',marginTop:12}}><span style={{background:'#e4edf7',color:C.blue,borderRadius:6,padding:'5px 9px',fontWeight:700,fontSize:13}}>当前状态：{cfg.summary[k]}</span><span style={{color:C.muted,fontSize:12}}>依据：论文{cfg.source}</span></div>
  <div className={`feedback ${(moduleId==='9.1'&&k===0)||moduleId==='10.2'?'bad':'good'}`} style={{marginTop:10}} aria-live="polite">{cfg.detail[k]}</div>
 </div>;
};
