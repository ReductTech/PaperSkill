import React, {useId, useState} from 'react';
import './learning-kit.css';

type Tone = 'info'|'success'|'warning'|'error';
export function MechanismFeedback({tone='info',children}:{tone?:Tone;children:React.ReactNode}) {
  return <div className="h1-feedback" data-tone={tone} role="status" aria-live="polite">{children}</div>;
}
export function PaperImage({src,alt,caption}:{src:string;alt:string;caption?:string}) {
  const url=/^https?:/.test(src)?src:`${import.meta.env.BASE_URL}${src.replace(/^\//,'')}`;
  return <figure className="h1-paper-image"><a href={url} target="_blank" rel="noreferrer" aria-label={`打开原尺寸图片：${alt}`}><img src={url} alt={alt} loading="lazy"/></a>{caption&&<figcaption>{caption}</figcaption>}</figure>;
}
export function SourceEvidence({title,children,href,image,caption}:{title:string;children?:React.ReactNode;href?:string;image?:string;caption?:string}) {
  return <details className="h1-source"><summary>{title}</summary><div className="h1-source-content">{image&&<PaperImage src={image} alt={title} caption={caption}/>}<div>{children}</div>{href&&<a href={href} target="_blank" rel="noreferrer">核对论文对应位置 ↗</a>}</div></details>;
}
export function UnderstandingCheck({question,options,answer,explanations}:{question:string;options:string[];answer:number;explanations:string[]}) {
  const [selected,setSelected]=useState<number|null>(null);const id=useId();
  return <div className="h1-check" aria-labelledby={id}>
    <div className="h1-check-kicker">理解检查 · 可重新选择</div>
    <p id={id} className="h1-check-question">{question}</p>
    <div className="h1-check-options">{options.map((option,i)=><button key={option} type="button" aria-pressed={selected===i} data-selected={selected===i} onClick={()=>setSelected(i)}><span aria-hidden="true">{String.fromCharCode(65+i)}</span>{option}</button>)}</div>
    <div className="h1-check-explanation" aria-live="polite" data-tone={selected===null?'info':selected===answer?'success':'warning'}>{selected===null?'选一个判断，再对照上面的状态变化解释原因。':<><strong>{selected===answer?'判断正确。':'再看一下依据。'}</strong>{explanations[selected]}</>}</div>
  </div>;
}
