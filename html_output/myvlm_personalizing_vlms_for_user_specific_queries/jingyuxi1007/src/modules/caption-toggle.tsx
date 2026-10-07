import React, {useState} from 'react';
export function CaptionToggle(){
  const [personal,setPersonal]=useState(false);
  return <div className="mv-widget" data-testid="caption-toggle" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}}>
    <div className="mv-caption-view">
      <div className="mv-reference"><small>已登记的概念 S*</small><img src="./images/m-fig4-reference.png" alt="论文 Fig.4：三张戴眼镜杯子的参考图"/><p>同一个具体杯子</p></div>
      <div className="mv-new-image"><small>新场景 · 同图切换</small><div className="mv-image-frame"><img src="./images/m-fig4-fridge-image.png" alt="论文 Fig.4 的打开冰箱新图，目标杯子位于第二层右侧"/>{personal&&<span className="mv-target-outline" aria-label="目标概念所在区域，教学标记"/>}</div></div>
    </div>
    <div className="mv-controls"><button className={'mv-button '+(!personal?'mv-selected':'')} aria-pressed={!personal} onClick={()=>setPersonal(false)}>通用 LLaVA</button><button className={'mv-button '+(personal?'mv-selected':'')} aria-pressed={personal} onClick={()=>setPersonal(true)}>MyVLM</button></div>
    <div className={'mv-output '+(personal?'mv-personal-output':'')} aria-live="polite"><small>{personal?'MyVLM · 输出的中文转述':'Generic LLaVA · 输出的中文转述'}</small><blockquote>{personal?<><mark>目标 S*</mark> 位于打开冰箱的第二层。</>:'冰箱里储备丰富，准备好了周末烹饪所需的食材。'}</blockquote></div>
    <div className="mv-feedback" role="status">{personal?'目标实例与当前场景的位置联系起来，描述开始围绕用户概念。':'描述了整张图，但没有聚焦已登记的杯子。类别 / 场景描述仍可能正确。'}</div>
    <p className="mv-source">M Fig.4，p.10，最右列 · 输出预先固定，非实时模型；绿色框为教学标记，非模型定位框。</p>
    <details className="mv-original"><summary>查看论文原始图文对照</summary><img src="./images/m-fig4-fridge-context.png" alt="ECCV 主文 Fig.4 最右列完整原图与 LLaVA / MyVLM 文本对照"/></details>
  </div>;
}
