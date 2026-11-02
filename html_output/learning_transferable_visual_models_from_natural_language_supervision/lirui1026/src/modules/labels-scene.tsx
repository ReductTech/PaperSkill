import React,{useRef,useState} from 'react';
import {C,Photo,Tag,Feedback,ToyNote,Term,Range,dot,vectors,names,subjects,deg,useTween,SubjectArt} from './ExhibitKit';

export function LabelsScene(){
 const [added,setAdded]=useState(false);const scores=vectors.slice(0,added?3:2).map(v=>dot(vectors[2],v));const winner=scores.indexOf(Math.max(...scores));
 const t=useTween(added?1:0);
 return <div className="clip-page">
  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:30,height:432}}>
   <section className="clip-paper" style={{padding:'22px 28px'}}>
    <h3>固定类别的监督分类器</h3>
    <div style={{display:'flex',gap:25,alignItems:'center',height:250}}>
     <Photo kind="boat" style={{width:250,height:250}}/>
     <div style={{flex:1}}><p>预先规定的输出</p><div style={{display:'flex',gap:12}}><span className="clip-tag" style={{fontSize:28}}>猫</span><span className="clip-tag" style={{fontSize:28}}>狗</span></div><p style={{color:C.red,marginTop:24}}>这张帆船没有对应类别。</p></div>
    </div>
    <div style={{borderTop:'2px solid #d9cbb8',paddingTop:14}}>改类别，通常需要新的分类头训练。</div>
   </section>
   <section className="clip-paper" style={{padding:'22px 28px'}}>
    <h3>CLIP：文字定义候选类别</h3>
    <div style={{display:'flex',gap:25,alignItems:'center',height:250}}>
     <Photo kind="boat" style={{width:220,height:220,transform:'rotate('+(-5+5*t)+'deg)',transition:'none'}}/>
     <div style={{flex:1}}>{scores.map((s,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'75px 1fr 74px',gap:10,alignItems:'center',margin:'15px 0'}}><span>{names[i]}</span><div style={{height:25,background:'#e2e6e9',borderRadius:4}}><div style={{height:25,width:(s*100)+'%',background:i===winner?(added?C.green:C.red):C.blue,transition:'width .5s',borderRadius:4}}/></div><b>{s.toFixed(2)}</b></div>)}<p style={{color:added?C.green:C.red}}>当前匹配：{names[winner]}</p></div>
    </div>
    <Tag selected={added} onClick={()=>setAdded(v=>!v)}>{added?'取下「一张帆船的照片」':'＋ 挂上「一张帆船的照片」'}</Tag>
   </section>
  </div>
  <div style={{position:'absolute',left:0,right:0,bottom:0,display:'grid',gap:9}}><ToyNote/><Feedback tone={added?'green':'orange'}>{added?'增加文字描述，就增加了一个可比较的类别；本例帆船相似度为 1.00。':'把帆船展签挂上去：编码器保持固定，候选集合与匹配结果会一起改变。'}</Feedback></div>
 </div>;
}

const captions=['一只橙色的猫','一只戴项圈的狗','海面上的帆船'];
export function PairsScene(){
 const [assignment,setAssignment]=useState([1,2,0]);const [selected,setSelected]=useState(0);const correct=assignment.filter((x,i)=>x===i).length;
 const assign=(label:number)=>{const oldSlot=assignment.indexOf(label);setAssignment(prev=>{const a=[...prev];[a[selected],a[oldSlot]]=[a[oldSlot],a[selected]];return a;});};
 return <div className="clip-page">
  <div className="clip-spread" style={{height:48}}><p>先点一幅照片，再点它对应的展签。</p><b style={{color:correct===3?C.green:C.blue}}>配对正确 {correct} / 3</b></div>
  <div style={{height:442,position:'relative',borderRadius:20,background:C.paper,border:'1px solid #e5ddce'}}>
   <div style={{position:'absolute',left:30,right:30,top:288,height:12,background:'#c4a582',boxShadow:'0 6px #ab8a65'}}/>
   {[0,1,2].map(i=><button key={i} aria-label={'选择'+names[i]+'照片'} aria-pressed={selected===i} onClick={()=>setSelected(i)} style={{position:'absolute',left:91+i*480,top:26,padding:0,border:selected===i?'5px solid '+C.orange:'5px solid transparent',borderRadius:9,background:'none',cursor:'pointer',transform:selected===i?'translateY(-7px)':'none',transition:'transform .25s'}}><Photo kind={subjects[i]} style={{width:250,height:250}}/></button>)}
   {captions.map((caption,label)=>{const slot=assignment.indexOf(label),good=slot===label;return <button key={label} onClick={()=>assign(label)} aria-label={'把展签“'+caption+'”配给'+names[selected]} style={{position:'absolute',left:56+slot*480,top:333,width:360,height:78,border:'3px solid '+(good?C.green:C.red),borderRadius:5,background:good?'#edf5e9':'#fffdf5',color:C.ink,fontSize:28,cursor:'pointer',transition:'left .6s ease,border-color .3s',boxShadow:'0 7px #e4d9c4'}}>{caption}</button>;})}
  </div>
  <div style={{position:'absolute',left:0,right:0,bottom:0}}><Feedback tone={correct===3?'green':'blue'}>{correct===3?'三个观测配对已归位。训练时，CLIP 学习让这些图文表示相近；真实网页配对仍可能含噪声。':'自然语言不仅给类别，还能描述动作与场景。这里在整理监督信号，还没有训练模型。'}</Feedback></div>
 </div>;
}

function VectorStrip({values,color}:{values:number[];color:string}){return <div style={{display:'flex',justifyContent:'center',gap:14}}>{values.map((x,i)=><div key={i} style={{width:100,textAlign:'center'}}><div style={{height:45,background:'#e7ebef',borderRadius:5,display:'flex',alignItems:'flex-end'}}><div style={{width:'100%',height:(x*100)+'%',background:color,borderRadius:5,transition:'height .5s'}}/></div><b style={{fontSize:28}}>{x.toFixed(2)}</b></div>)}</div>;}
export function EncoderScene(){
 const [ii,setIi]=useState(0),[ti,setTi]=useState(0);const score=dot(vectors[ii],vectors[ti]);const shown=useTween(score);
 return <div className="clip-page">
  <div style={{display:'grid',gridTemplateColumns:'480px 392px 552px',gap:24,height:442}}>
   <section className="clip-paper" style={{padding:16,textAlign:'center'}}><h3>图像编码器</h3><div style={{display:'flex',justifyContent:'center',height:125}}><Photo kind={subjects[ii]} style={{height:115,width:115}}/></div><div style={{display:'flex',gap:12,justifyContent:'center',marginBottom:14}}>{[0,1,2].map(i=><Tag key={i} selected={ii===i} onClick={()=>setIi(i)} style={{padding:'7px 17px',minHeight:50}}>{names[i]}</Tag>)}</div><VectorStrip values={vectors[ii]} color={C.blue}/><p style={{margin:'7px 0 0'}}>ResNet 或 ViT</p></section>
   <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}><p style={{margin:"6px 0"}}>线性投影后<br/>L2 归一化</p><div className="clip-equation"><Term meaning="u：图片经过编码、投影和L2归一化后的d维向量。">u</Term>{' · '}<Term meaning="v：文本经过编码、投影和L2归一化后的d维向量。">v</Term></div><div className="clip-emphasis" style={{color:ii===ti?C.green:C.blue}}>{shown.toFixed(3)}</div><p style={{margin:"6px 0"}}>同一维度，才可比较</p><p className="clip-muted" style={{margin:"6px 0"}}>三个分量仅用于演示，<br/>不是命名的语义属性。</p></div>
   <section className="clip-paper" style={{padding:16,textAlign:'center'}}><h3>文本编码器</h3><div style={{display:'flex',flexDirection:'column',gap:9,margin:'10px 0 16px'}}>{captions.map((cap,i)=><Tag key={i} selected={ti===i} onClick={()=>setTi(i)} style={{minHeight:50,padding:'6px 12px'}}>{cap}</Tag>)}</div><VectorStrip values={vectors[ti]} color={C.purple}/><p style={{margin:'7px 0 0'}}>Transformer</p></section>
  </div>
  <div style={{position:'absolute',left:0,right:0,bottom:0,display:'grid',gap:8}}><ToyNote/><Feedback tone={ii===ti?'green':'blue'}>{ii===ti?'本例图文方向相同，相似度为 1。试着只换照片，观察文本向量保持不动。':'改变一侧输入，只重新编码那一侧；另一侧向量可以复用。训练使两个不同编码器学会对齐。'}</Feedback></div>
 </div>;
}

export function CosineScene(){
 const [angle,setAngle]=useState(65),[length,setLength]=useState(1);const pointers=useRef(new Set<number>()),drag=useRef<number|null>(null);const svgRef=useRef<SVGSVGElement>(null);const a=deg(angle),cx=316,cy=244,r=170;const ux=Math.cos(a),uy=-Math.sin(a);const score=Math.cos(a);const px=cx+r*ux,py=cy+r*uy;
 const changeAt=(e:React.PointerEvent<SVGSVGElement>)=>{if(drag.current!==e.pointerId||pointers.current.size!==1)return;const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left)*640/b.width,y=(e.clientY-b.top)*442/b.height;const t=Math.atan2(cy-y,x-cx)*180/Math.PI;setAngle(Math.max(0,Math.min(180,t)));};
 return <div className="clip-page" style={{display:'grid',gridTemplateColumns:'650px 798px',gap:24}}>
  <div><div className="clip-paper" style={{height:464,padding:0,position:'relative'}}>
   <svg ref={svgRef} viewBox="0 0 640 442" width="640" height="442" role="group" aria-label="拖动圆周上的猫咪图卡，改变与文字方向的夹角" onPointerDown={e=>{pointers.current.add(e.pointerId);if(pointers.current.size>1)drag.current=null;else{drag.current=e.pointerId;changeAt(e);}}} onPointerMove={changeAt} onPointerUp={e=>{pointers.current.delete(e.pointerId);drag.current=null;}} onPointerCancel={e=>{pointers.current.delete(e.pointerId);drag.current=null;}} onPointerLeave={e=>{pointers.current.delete(e.pointerId);drag.current=null;}} style={{touchAction:'auto',cursor:'grab'}}>
    <path d="M50 400 H590" stroke="#b3926d" strokeWidth="12"/><path d="M90 400 L170 352 M550 400 L470 352" stroke="#b3926d" strokeWidth="8"/>
    <circle cx={cx} cy={cy} r={r} fill="#fcfbf7" stroke="#cabfa9" strokeWidth="4"/>
    <path d={'M'+cx+' '+cy+' L'+(cx+r)+' '+cy} stroke={C.purple} strokeWidth="5"/>
    <path d={'M'+cx+' '+cy+' L'+(cx+75*length*ux)+' '+(cy+75*length*uy)} stroke={C.orange} strokeWidth="11" opacity=".45"/>
    <path d={'M'+cx+' '+cy+' L'+px+' '+py} stroke={C.blue} strokeWidth="5"/>
    <circle cx={cx} cy={cy} r="7" fill={C.ink}/>
    <path d={'M'+(cx+65)+' '+cy+' A65 65 0 0 0 '+(cx+65*ux)+' '+(cy+65*uy)} stroke={C.orange} strokeWidth="4" fill="none"/>
    <g transform={'translate('+(px-38)+' '+(py-38)+')'}><rect width="76" height="76" rx="9" fill="#fff" stroke={C.orange} strokeWidth="4"/><g transform="translate(4 4) scale(.34)"><SubjectArt kind="cat"/></g></g>
    <rect x="444" y="305" width="166" height="54" rx="5" fill="#fff" stroke={C.purple} strokeWidth="2"/><text x="527" y="341" textAnchor="middle" fill={C.ink} fontSize="28">猫的描述</text>
    <text x="26" y="40" fill={C.ink} fontSize="28">拖图卡，改变方向</text>
    <text x="30" y="432" fill={C.muted} fontSize="28">淡橙线：未归一化的长度</text>
   </svg>
  </div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:28,marginTop:26,padding:'0 8px'}}><Range label="夹角（度）" value={angle} min={0} max={180} onChange={setAngle}/><Range label="原始长度" value={length} min={.5} max={3} step={.1} onChange={setLength}/></div></div>
  <div style={{display:'flex',flexDirection:'column',gap:8,padding:'5px 10px 0 12px'}}><h3>归一化，让长度不再主导相似度</h3><p>图片和文本都落到单位球面上。<br/>方向越一致，点积越大。</p><div className="clip-equation"><Term meaning="s：图文余弦相似度，范围−1到1。">s</Term>{' = '}<Term meaning="u：L2归一化后的图像向量，长度为1。">u</Term>{' · '}<Term meaning="v：L2归一化后的文本向量，长度为1。">v</Term>{' = '}<Term meaning="cos θ：两向量夹角的余弦；本演示使用二维单位向量。">cos θ</Term></div><div className="clip-emphasis" style={{color:score>.7?C.green:score<0?C.red:C.blue}}>相似度 {Math.abs(score)<1e-9?'0.000':score.toFixed(3)}</div><p>先把夹角拖到 0°、90° 或 180°。<br/>再改变长度，比较结果。</p><ToyNote>二维教学示意 · 真实表示为高维向量</ToyNote><Feedback tone={score>.7?'green':score<0?'red':'blue'}>{angle===0?'方向重合，相似度为 1；原始向量再长也不会超过它。':angle===90?'方向正交，相似度为 0；改变原始长度仍为 0。':angle===180?'方向相反，相似度为 −1；长度不能把方向相反变成匹配。':'夹角决定相似度；改变原始长度，不改变归一化后的方向与点积。'}</Feedback></div>
 </div>;
}
