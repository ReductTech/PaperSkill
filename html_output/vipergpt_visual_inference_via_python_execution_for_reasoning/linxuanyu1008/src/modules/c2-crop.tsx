import React,{useState} from 'react';
import {LabStyles,PaperPhoto} from './lab-kit';
export function ImagePatchCrop(){
 const [local,setLocal]=useState(false);
 return <div className="vlab"><LabStyles/><div className="lab-stage" role="group" aria-label="选择图像块范围"><button type="button" aria-pressed={!local} onClick={()=>setLocal(false)}>整张图像</button><button type="button" aria-pressed={local} onClick={()=>setLocal(true)}>局部：前方披萨</button></div>
 <div className="lab-columns" style={{gridTemplateColumns:'160px minmax(0,1fr)'}}><div><PaperPhoto name={local?'pizza-b':'pizza'} alt={local?'图3前方披萨裁片':'图3完整披萨照片'}/></div><div role="status"><strong>ImagePatch = 图像区域 + 几何属性 + 可调用方法</strong><p style={{margin:'6px 0'}}>区域：{local?'局部裁片；保留与原图的坐标关系':'整张输入图像'}<br/>几何：horizontal_center 等<br/>方法：find / simple_query / compute_depth</p></div></div>
 <p className="lab-caption"><span className="source-tag">教学示意</span>边框坐标只是对象的一部分；ImagePatch 还持有图像和方法。VideoSegment 表示视频片段，第7章使用。</p>
 </div>;
}
