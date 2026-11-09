import React, { useState } from 'react';
import { Photo, Feedback, useTween } from './blip-kit';

const ink = '#21324a', blue = '#27446e', green = '#228d5c', red = '#c43f52';

export function BlipNoise() {
  const [caption, setCaption] = useState<0 | 1>(0);
  const move = useTween(caption, 500);
  const labels = ['日落公园的蓝天面包房', '铺着奶油的巧克力蛋糕'];
  const facts = ['蛋糕', '奶油'];
  return <div className="blip-page" style={{position:'relative',width:'100%',height:'100%',color:ink,fontSize:'var(--ppt-body-text)'}}>
    <div style={{position:'absolute',left:0,top:0,width:900,height:494,background:'#efe9dd',borderRadius:24,padding:22,boxSizing:'border-box'}}>
      <div style={{position:'absolute',left:22,top:24,bottom:24,width:20,borderRight:'4px dashed #bca98a'}} aria-hidden="true"/>
      <div style={{position:'absolute',left:70,top:14}}><Photo kind="cake" width={640} height={300}/></div>
      <div style={{position:'absolute',left:588,top:48,width:240,transform:`rotate(${8-14*move}deg) translateY(${24-24*move}px)`,background:'#fff9db',padding:'22px 20px',boxShadow:'0 8px 18px #6a57451c',borderBottom:`5px solid ${caption ? green : red}`,lineHeight:1.5}}>
        {labels[caption]}
      </div>
      <div style={{position:'absolute',left:70,right:30,bottom:22,display:'flex',gap:16}}>
        {labels.map((text,index)=><button key={text} type="button" className="blip-control" aria-pressed={caption===index} onClick={()=>setCaption(index as 0|1)} style={{width:390,minHeight:104,padding:'14px 18px',border:`3px solid ${caption===index ? blue : '#cfc7b8'}`,borderRadius:14,background:caption===index ? '#e6edf5' : '#fffdf6',color:ink,fontSize:'var(--ppt-body-text)',textAlign:'left',lineHeight:1.4,cursor:'pointer'}}>
          <strong>{index===0 ? '原网页便签' : '看图写的描述'}</strong><br/>{text}
        </button>)}
      </div>
    </div>
    <div style={{position:'absolute',left:948,top:12,width:510}}>
      <p style={{fontSize:'var(--ppt-body-heading)',margin:'0 0 22px',fontWeight:750}}>有文字，未必有视觉监督</p>
      <p style={{lineHeight:1.55,margin:'0 0 30px'}}>网页文字可能讲地点或背景；模型需要学到图像内容与词语的对应。</p>
      <div style={{display:'flex',gap:12,marginBottom:26}}>{facts.map(fact=><span key={fact} style={{border:`3px solid ${caption ? green : '#c6c8c5'}`,background:caption ? '#e3f1e9' : '#f0efeb',borderRadius:12,padding:'13px 24px',fontWeight:700}}>{caption ? '✓ ' : '○ '}{fact}</span>)}</div>
      <div style={{fontSize:'var(--ppt-body-emphasis)',fontWeight:800,color:caption ? green : red}}>{caption ? 2 : 0} / 2 个可见事实</div>
      <p style={{lineHeight:1.45,margin:'18px 0 0'}}>点一张便签，把它贴进照片册。</p>
    </div>
    <div style={{position:'absolute',left:0,right:0,bottom:0,minHeight:96}}><Feedback tone={caption ? 'green' : 'red'}>{caption ? '描述提到了蛋糕和奶油，能为图文对齐提供更直接的信号。' : '便签可能真实，却没有说出这张照片中的蛋糕和奶油。'}</Feedback></div>
  </div>;
}
