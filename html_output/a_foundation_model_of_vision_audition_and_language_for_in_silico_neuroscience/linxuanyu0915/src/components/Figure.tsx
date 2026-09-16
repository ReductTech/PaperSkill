import { useRef, useId } from 'react';
export function Figure({src,alt,caption}:{src?:string;alt?:string;caption?:string}){
 const dialog=useRef<HTMLDialogElement>(null);const title=useId();
 if(!src)return null;
 return <><figure className="paper-figure"><button type="button" className="figure-zoom-trigger" aria-label={'放大查看：'+(alt||caption||'论文原图')} onClick={()=>dialog.current?.showModal()}><img src={src} alt={alt||''} loading="lazy"/><span>点击放大原图 ↗</span></button>{caption&&<figcaption>{caption}</figcaption>}</figure><dialog className="paper-dialog" ref={dialog} aria-labelledby={title} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}><div className="paper-dialog-bar"><span id={title}>{caption||alt||'论文原图'}</span><button type="button" onClick={()=>dialog.current?.close()}>关闭 ✕</button></div><img src={src} alt={alt||'论文原图'}/></dialog></>;
}
