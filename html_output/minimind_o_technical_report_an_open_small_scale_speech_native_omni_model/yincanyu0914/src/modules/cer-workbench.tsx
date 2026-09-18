import {useMemo,useState} from 'react';

type Pair={ref:string;hyp:string;kind:'same'|'substitute'|'delete'|'insert'};
const descriptions={same:'匹配',substitute:'替换 S',delete:'删除 D',insert:'插入 I'};
const examples=[
  {name:'漏掉一个字',ref:'带一把雨伞',hyp:'带一把伞',note:'“雨”被删除。参考有 5 个字，因此 CER = 1/5 = 20%。'},
  {name:'意思近，措辞不同',ref:'现在外面下雨了',hyp:'现在外面在下雨',note:'两个句子表达的意思接近，但字符序列不同。CER 比较字面，不会判断同义表达。'},
  {name:'说得一致，内容却错',ref:'一加一等于三',hyp:'一加一等于三',note:'一加一应等于二。这里虽然 CER 为 0，文字本身仍有错误：内容一致性不能代替答案正确性。'},
];
function align(reference:string,hypothesis:string):Pair[]{
  const a=Array.from(reference),b=Array.from(hypothesis),dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)dp[i][0]=i;
  for(let j=0;j<=b.length;j++)dp[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=Math.min(dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1),dp[i-1][j]+1,dp[i][j-1]+1);
  const result:Pair[]=[];let i=a.length,j=b.length;
  while(i||j){
    if(i&&j&&dp[i][j]===dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1)){result.push({ref:a[i-1],hyp:b[j-1],kind:a[i-1]===b[j-1]?'same':'substitute'});i--;j--;}
    else if(i&&dp[i][j]===dp[i-1][j]+1){result.push({ref:a[i-1],hyp:'',kind:'delete'});i--;}
    else {result.push({ref:'',hyp:b[j-1],kind:'insert'});j--;}
  }
  return result.reverse();
}

export function CerWorkbench(){
  const [reference,setReference]=useState(examples[0].ref),[hypothesis,setHypothesis]=useState(examples[0].hyp),[ignore,setIgnore]=useState(true),[chosen,setChosen]=useState(0),[preset,setPreset]=useState<number|null>(0);
  const normalize=(s:string)=>ignore?s.replace(/[\p{P}\p{Z}\s]/gu,''):s;
  const ref=normalize(reference),hyp=normalize(hypothesis),pairs=useMemo(()=>align(ref,hyp),[ref,hyp]);
  const counts=pairs.reduce((r,p)=>({...r,[p.kind]:r[p.kind]+1}),{same:0,substitute:0,delete:0,insert:0});
  const n=Array.from(ref).length,edits=counts.substitute+counts.delete+counts.insert,selected=pairs[Math.min(chosen,pairs.length-1)];
  const pick=(i:number)=>{setReference(examples[i].ref);setHypothesis(examples[i].hyp);setPreset(i);setChosen(0);};
  return <section data-experiment-state={JSON.stringify({实验:"字符编辑教学",参考:ref,假设转录:hyp,编辑计数:counts,参考字数:n,实测:false})} aria-label="字符错误率编辑实验" className="lab-card" style={{marginTop:20,background:'#f7faff'}}>
    <span className="lab-eyebrow">亲手改一句话 · 指标实验</span><h3 style={{margin:'7px 0'}}>改掉一个字，CER 怎样变化？</h3>
    <p>左边是参考文字，右边是假设的语音转录。你可以直接编辑两句话，下面会重新对齐字符、标出错误，并计算 CER。</p>
    <div className="ctrl">{examples.map((e,i)=><button key={e.name} aria-pressed={preset===i} onClick={()=>pick(i)}>{e.name}</button>)}<button onClick={()=>{pick(0);setIgnore(true);}}>重置字符实验</button></div>
    <div className="lab-grid">{[{name:'参考文字',value:reference,set:setReference},{name:'假设的转录文字',value:hypothesis,set:setHypothesis}].map(field=><label key={field.name}>{field.name}<textarea aria-label={field.name} maxLength={60} rows={2} value={field.value} onChange={e=>{field.set(e.target.value);setPreset(null);setChosen(0);}} style={{width:'100%',boxSizing:'border-box',padding:12,border:'1px solid #becfe2',borderRadius:8,resize:'vertical',color:'#27446e',background:'white'}}/></label>)}</div>
    <label><input type="checkbox" checked={ignore} onChange={e=>{setIgnore(e.target.checked);setChosen(0);}}/>忽略标点和空白（只影响本实验的预处理）</label>
    <div className="lab-grid"><div><div className="lab-note">CER = (S + D + I) / N</div><output className="lab-metric" data-testid="edited-cer">{n?`${(edits/n*100).toFixed(1)}%`:'无法计算'}</output></div><div><div className="lab-note">替换 / 删除 / 插入 / 参考字数</div><output className="lab-metric" data-testid="edited-counts">{counts.substitute} / {counts.delete} / {counts.insert} / {n}</output></div></div>
    {!n&&<p role="status">参考文字为空，分母 N 为 0。先输入至少一个有效字符，才能计算 CER。</p>}
    <div role="group" aria-label="字符对齐结果" style={{display:'flex',flexWrap:'wrap',gap:7,margin:'14px 0'}}>{pairs.map((p,i)=><button key={i} aria-pressed={chosen===i} aria-label={`位置 ${i+1}，${descriptions[p.kind]}，参考 ${p.ref||'空位'}，转录 ${p.hyp||'空位'}`} onClick={()=>setChosen(i)} style={{minWidth:65,padding:'9px 10px',background:chosen===i?'#27446e':p.kind==='same'?'#edf4fa':'#fff0df',color:chosen===i?'#fff':'#27446e'}}><span style={{display:'block',fontSize:20}}>{p.ref||'∅'}</span><span style={{display:'block',fontSize:20,borderTop:'1px solid #a6b9ce',marginTop:5,paddingTop:5}}>{p.hyp||'∅'}</span><small>{descriptions[p.kind]}</small></button>)}</div>
    <p className="lab-note">每列上方是参考、下方是转录；∅ 表示对齐空位。点击某一列查看计分原因。</p>
    <div className="feedback" aria-live="polite">{selected?`${descriptions[selected.kind]}：${selected.kind==='same'?`“${selected.ref}”与参考相同，不增加错误。`:selected.kind==='delete'?`参考中的“${selected.ref}”没有对应转录，D 增加 1。`:selected.kind==='insert'?`转录多出“${selected.hyp}”，I 增加 1。`:`参考的“${selected.ref}”被转录为“${selected.hyp}”，S 增加 1。`}`:'输入文字后可查看对齐。'}{n>0&&edits>n?' 插入很多字时，CER 可以超过 100%，它不是有固定上限的正确率。':''}</div>
    {preset!==null&&<p>{examples[preset].note}</p>}
    <p className="lab-note">这里没有录音、ASR 调用或模型实测，输入仅在浏览器里用于计算。按单位编辑代价寻找最少编辑对齐；若存在多个同样最优的对齐，此处固定展示其中一个。论文真实 CER 仍以上面的实验表格为准。</p>
  </section>;
}
