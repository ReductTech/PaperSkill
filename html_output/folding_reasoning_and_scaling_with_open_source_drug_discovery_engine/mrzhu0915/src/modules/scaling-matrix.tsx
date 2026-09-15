import React, { useState } from 'react';
import { C, Choices, Feedback, Scene } from './shared-visual';

const records=[
  {n:100,singleTime:161.2,cp4Time:557.4,singleMem:4959,cp4Mem:15549},
  {n:250,singleTime:180.8,cp4Time:543.7,singleMem:10619,cp4Mem:17353},
  {n:500,singleTime:330.8,cp4Time:612.4,singleMem:50971,cp4Mem:30279},
  {n:900,singleTime:615.2,cp4Time:920.2,singleMem:56855,cp4Mem:56443},
  {n:1200,singleTime:1133.8,cp4Time:1127.3,singleMem:67105,cp4Mem:49273},
  {n:1400,singleTime:1784.4,cp4Time:1398.3,singleMem:67665,cp4Mem:59237},
  {n:2000,singleTime:null,cp4Time:2714.1,singleMem:null,cp4Mem:80899}
];
const lengths=[384,768,1000,2000];
function line(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=2,dash:number[]=[]){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.lineCap='round';c.stroke();c.setLineDash([]);}
function label(c:CanvasRenderingContext2D,s:string,x:number,y:number,color=C.ink,size=14){c.fillStyle=color;c.font=`600 ${size}px "Segoe UI","Microsoft YaHei",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y);}
function panel(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill='rgba(255,255,255,.84)'){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,12);c.fill();c.strokeStyle=C.line;c.lineWidth=1.5;c.stroke();}
function LogicStrip({purpose,action,output}:{purpose:string;action:string;output:string}){return <div className="logic-strip"><div><b>为什么做</b><span>{purpose}</span></div><div><b>怎么做</b><span>{action}</span></div><div><b>得到什么</b><span>{output}</span></div></div>}

export function ScalingMatrixWidget(){
  const [view,setView]=useState(0);
  const [lengthIndex,setLengthIndex]=useState(0);
  const [recordIndex,setRecordIndex]=useState(0);
  const [metric,setMetric]=useState(0);
  const n=lengths[lengthIndex],gb=n*n*384*2/1024/1024/1024,record=records[recordIndex];
  const info=[
    {purpose:'找出长复合体显存快速增长的根源',action:'枚举N个token的每一个(i,j)关系，并为每格保存384个特征',output:`长度${n}的单个z张量约${gb.toFixed(2)} GiB`},
    {purpose:'让每张GPU不再复制完整N×N关系张量',action:'沿z的行、列两个token轴切成2×2四块，并在需要时通信',output:'4张卡协作执行同一个OpenDDE模型'},
    {purpose:'判断分片是否值得，以及能否处理目标长度',action:`对照N=${record.n}时单卡和CP4的端到端时间与峰值显存`,output:record.singleTime===null?'单卡OOM，CP4能够完成':'得到速度与显存的真实权衡'}
  ][view];
  return <div>
    <Choices label="按三个问题理解并行" options={['① 为什么平方增长','② CP4怎样切分','③ 论文实测代价']} value={view} onChange={setView}/>
    <Scene label={['成对张量为什么随N平方增长','CP4怎样把成对张量切到四张GPU','单卡与CP4论文实测'][view]} draw={(c,w,h)=>{
      c.fillStyle=C.bg;c.fillRect(0,0,w,h);
      if(view===0){
        const size=230,x=80,y=55,cells=10;c.fillStyle='rgba(124,58,237,.72)';c.fillRect(x,y,size,size);
        for(let i=0;i<=cells;i++){line(c,x+i*size/cells,y,x+i*size/cells,y+size,'rgba(255,255,255,.3)',1);line(c,x,y+i*size/cells,x+size,y+i*size/cells,'rgba(255,255,255,.3)',1);}
        c.strokeStyle=C.orange;c.lineWidth=4;c.strokeRect(x+4*size/cells,y+7*size/cells,size/cells,size/cells);label(c,'zᵢⱼ',x+4.5*size/cells,y+7.5*size/cells,C.white,11);label(c,'N个token作为行',x+size/2,31,C.blue,13);c.save();c.translate(45,y+size/2);c.rotate(-Math.PI/2);label(c,'N个token作为列',0,0,C.blue,13);c.restore();
        panel(c,390,48,610,244);label(c,'为什么是 N²？',695,78,C.blue,19);label(c,'每个token都要与N个token建立成对表示',695,116,C.ink,15);label(c,'N行 × N列 × 384个关系特征 × 2 bytes',695,158,C.purple,18);line(c,470,206,920,206,'rgba(104,119,143,.18)',22);line(c,470,206,470+450*gb/(2000*2000*384*2/1024/1024/1024),206,C.orange,22);label(c,`${n} tokens → ${gb.toFixed(2)} GiB`,695,250,C.orange,20);label(c,'这里只估算一个z张量，不等于整模型峰值显存',695,278,C.muted,12);
      }
      if(view===1){
        const x=74,y=55,size=250,half=size/2,colors=['#27446e','#7c3aed','#228d5c','#f07e47'];colors.forEach((color,i)=>{const px=x+(i%2)*half,py=y+Math.floor(i/2)*half;c.fillStyle=color;c.globalAlpha=.82;c.fillRect(px,py,half,half);label(c,`GPU ${i+1}`,px+half/2,py+half/2,C.white,16);});c.globalAlpha=1;for(let i=0;i<=8;i++){line(c,x+i*size/8,y,x+i*size/8,y+size,'rgba(255,255,255,.22)',1);line(c,x,y+i*size/8,x+size,y+i*size/8,'rgba(255,255,255,.22)',1);}label(c,'完整Z不再复制到每张卡',199,31,C.blue,14);
        panel(c,390,45,620,252);label(c,'2 × 2上下文并行网格',700,75,C.purple,18);[['1. 本地保存','每卡只保存一个行列分片'],['2. 本地计算','pair transition等先在本块执行'],['3. 必要通信','沿行、列交换三角更新和attention所需信息'],['4. 结果等价','模型权重与推理含义保持不变']].forEach((item,i)=>{const yy=112+i*45;label(c,item[0],490,yy,[C.blue,C.green,C.orange,C.purple][i],13);label(c,item[1],745,yy,C.ink,13);if(i<3)line(c,430,yy+22,970,yy+22,C.line,1);});
      }
      if(view===2){
        const single=metric===0?record.singleTime:record.singleMem,cp4=metric===0?record.cp4Time:record.cp4Mem,max=Math.max(single??0,cp4??0)*1.18||1,unit=metric===0?'秒':'MiB',baseY=286,barW=170;
        label(c,`N=${record.n}｜${metric===0?'端到端时间':'峰值GPU显存'}`,540,31,C.blue,18);line(c,90,baseY,990,baseY,C.muted,2);
        const drawBar=(x:number,value:number|null,color:string,name:string)=>{if(value===null){panel(c,x,86,barW,190,'rgba(196,63,82,.07)');label(c,'OOM',x+barW/2,175,C.red,30);label(c,name,x+barW/2,310,C.red,15);return;}const height=value/max*190;c.fillStyle=color;c.beginPath();c.roundRect(x,baseY-height,barW,height,8);c.fill();label(c,`${value} ${unit}`,x+barW/2,baseY-height-18,color,17);label(c,name,x+barW/2,310,color,15);};
        drawBar(260,single,C.blue,'单卡');drawBar(650,cp4,C.purple,'CP4');label(c,single===null?'CP4让本来无法运行的长度完成推理':record.n<1200?'短输入：通信开销可能大于分片收益':'长输入：主要比较显存可行性与速度权衡',540,67,single===null?C.green:C.orange,14);
      }
    }}/>
    {view===0?<Choices label="概念长度N" options={lengths.map(String)} value={lengthIndex} onChange={setLengthIndex}/>:null}
    {view===2?<><Choices label="论文实测N" options={records.map(item=>String(item.n))} value={recordIndex} onChange={setRecordIndex}/><Choices label="实测指标" options={['端到端时间','峰值GPU显存']} value={metric} onChange={setMetric}/></>:null}
    <LogicStrip purpose={info.purpose} action={info.action} output={info.output}/>
    <Feedback tone={view===2&&record.singleTime===null?'good':'neutral'}>{view===0?<>z包含N×N个关系格子，所以N翻倍时格子数约变为四倍。当前估算假设C=384、每元素2字节。</>:view===1?<>Fold-CP改变的是执行方式，不是模型结构。每张卡少存一部分关系张量，但跨块运算需要通信。</>:record.singleTime===null?<>论文实测N=2000时单卡OOM；CP4以2714.1秒、80899 MiB峰值GPU显存完成端到端推理。</>:<>N={record.n}时，{metric===0?'端到端时间':'峰值GPU显存'}：单卡{metric===0?record.singleTime:record.singleMem}{metric===0?'秒':' MiB'}，CP4为{metric===0?record.cp4Time:record.cp4Mem}{metric===0?'秒':' MiB'}。短输入不一定因并行更快。</>}</Feedback>
  </div>;
}
