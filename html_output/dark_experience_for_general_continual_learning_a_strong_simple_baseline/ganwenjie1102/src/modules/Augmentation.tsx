import { LESSON_DURATIONS } from './lesson-motion';
import { useId, useState } from 'react';
import SceneTransport, { useSceneTimeline } from './review/SceneTransport';
import { windowAt, mix } from './review/lifecycle-model';
import { PelicanIllustration } from './PelicanIllustration';
import { SavedTargetFormula, ReplayTargetFormula, ParameterSymbol, MathSub } from './LessonNotation';
import { LessonCue, LessonPath } from './LessonGuidance';
import { augmentationMotion, AUG_SOURCE as S, AUG_DESTINATION as D, AUG_REGIONS, AUG_ROTATION_DEG, AUG_ROTATION_PAN_X, rotationCoverScale, type AugmentationView } from './augmentation-motion';
import { ReferenceButton } from './Reference';
import './learning-scenes.css';
import './later-chapters.css';
import './augmentation.css';

export const AUGMENTATION_CLIPS = [
 {id:'选区 → 复制 → 放大',durationMs:LESSON_DURATIONS.augmentation[0],holdMs:900},
 {id:'保存时复制并冻结 z',durationMs:LESSON_DURATIONS.augmentation[1],holdMs:900},
 {id:'从原图重新生成视图',durationMs:LESSON_DURATIONS.augmentation[2],holdMs:900},
 {id:'多个视图，同一个历史目标',durationMs:LESSON_DURATIONS.augmentation[3],holdMs:900},
];

export default function Augmentation(){
 const timeline=useSceneTimeline(AUGMENTATION_CLIPS), [view,setView]=useState<AugmentationView>('center');
 const {clipIndex:c,progress:p}=timeline.state, id=useId().replace(/:/g,'');
 const m=augmentationMotion(c,p,view), future=c>=2, movingCrop=c===0||c===2&&!m.flipping&&!m.rotating;
 const scale=S.w/320;
 const selection={x:S.x+m.selected.x*scale,y:S.y+m.selected.y*scale,w:m.selected.w*scale,h:m.selected.h*scale};
 const aperture='M'+S.x+' '+S.y+'h'+S.w+'v'+S.h+'h-'+S.w+'Z M'+selection.x+' '+selection.y+'h'+selection.w+'v'+selection.h+'h-'+selection.w+'Z';
 const micro=m.rotating ? m.rotationDeg===0?'准备原图':m.rotationDeg<AUG_ROTATION_DEG?'绕中心旋转':m.fitProgress<1?'调整取景':'25° · 取景完成' : m.flipping ? m.flip===0?'准备原图':m.flip<1?'左右交换':'翻转完成' : m.selection<1?'选取区域':m.transfer<1?'复制并放大':'视图已生成';
 const title=c===0?(m.selection<1?'看左侧：先选定原图中的区域':m.transfer<1?'看选区副本：离开原图，连续放大到右侧':'看两侧：原图保留，训练视图已生成')
   :c===1?'看下方：保存时的输出复制为固定 z'
   :c===2?(m.rotating?'看右侧：顺时针旋转25°，再调整取景':m.flipping?'看右侧扫描线：对照翻转前后的左右位置':'回到同一原图：重新选区，再生成新的训练视图')
   :'看下方四种视图：各自前向，都匹配同一份 z';
 const notes=[
  '暗色区域不进入本次视图。亮框内的像素按原样复制，再放大到固定的训练窗口。',
  '保存原图 x 与更新前输出 z。增强图是本次计算的视图，不会覆盖原图。',
  view==='rotate'?'图像先绕中心转25°，再放大并平移取景，填满固定窗口。原图和历史 z 保持不变。':view==='flip'?'先恢复原图视野，再用扫描线展示水平翻转；文字、边框和固定 z 保持正向。':'新的裁剪仍从左侧原图生成，不能把上一次裁剪图当成新的原图继续裁。',
  'A₁(x) 至 A₄(x) 可以不同；每次都使用当前参数，与保留的同一份 z 比较。',
 ];
 const summary=c===3?windowAt(p,.06,.5):0;
 const targetOpacity=movingCrop?m.landed:1;
 const activeInput=m.rotating?'rotate':m.flipping?'flip':future?'center':'saved';
 return <section className="der-redesign later-lesson aug2-lesson aug3-lesson" data-scene="augmentation" data-clip={c} data-progress={p} data-status={timeline.state.status} data-target="fixed-symbolic-z" data-view={view} data-transfer-progress={m.transfer} data-flip-progress={m.flip} data-selection-progress={m.selection} data-rotation-deg={m.rotationDeg} data-fit-progress={m.fitProgress}>
 <header className="later-scene-heading"><div><h3>同一原图，多种增强视图。</h3><p>从原图生成裁剪、翻转或旋转视图；保存的 x 与 z 保持不变。</p></div></header>
 <div className="aug3-controls">
 <div className="aug-view-controls scene-options" role="group" aria-label="选择未来回放时的图像视图"><span>未来训练视图</span><button aria-pressed={view==='center'} onClick={()=>{setView('center');timeline.playFrom(2);}}>中心裁剪</button><button aria-pressed={view==='flip'} onClick={()=>{setView('flip');timeline.playFrom(2);}}>水平翻转</button><button aria-pressed={view==='rotate'} onClick={()=>{setView('rotate');timeline.playFrom(2);}}>旋转</button><button onClick={()=>timeline.playFrom(0)}>重播保存视图</button><small>可以暂停，逐步检查像素如何对应</small></div>
 <SceneTransport timeline={timeline} clips={AUGMENTATION_CLIPS} label="增强与一致性" showTiming={false} teachingProgress/>
 </div>
 <LessonCue steps={['取保存视图','冻结目标','重新增强','共同约束']} active={c} title={title} detail={notes[c]}/>
 <div className="aug2-stage"><svg viewBox="0 0 1120 514" className="teaching-canvas aug-canvas" role="img" aria-label="原图亮框内的选区按相同像素比例复制，连续放大到训练窗口；未来从原图重新裁剪、水平翻转或旋转25度，历史目标始终固定">
 <defs>
  <clipPath id={id+'-source'}><rect x={S.x} y={S.y} width={S.w} height={S.h} rx="12"/></clipPath>
  <clipPath id={id+'-destination'}><rect x={D.x} y={D.y} width={D.w} height={D.h} rx="12"/></clipPath>
  <clipPath id={id+'-moving'}><rect x={m.moving.x} y={m.moving.y} width={m.moving.w} height={m.moving.h} rx="9"/></clipPath>
  <clipPath id={id+'-wipe'}><rect x={D.x} y={D.y} width={D.w*m.flip} height={D.h}/></clipPath>
  <linearGradient id={id+'-sweep'}><stop stopColor="#fff3c6" stopOpacity="0"/><stop offset="1" stopColor="#fff3c6" stopOpacity=".6"/></linearGradient>
 </defs>
 <text x="32" y="26" className="later-svg-title">原图 x · 保留在记忆中</text>
 <text x="704" y="26" className="later-svg-title">{future?<>未来训练视图 A<MathSub>1</MathSub>(x)</>:<>保存时视图 A<MathSub>0</MathSub>(x)</>}</text>
 <text x="32" y="48" className="later-svg-note">{m.flipping||m.rotating?'本次保留完整视野':'亮框是本次选区，框外不进入视图'}</text>
 <text x="704" y="48" className="later-svg-note">{m.rotating?(m.rotationDeg===0?'先恢复完整原图视野':m.fitProgress<1?'顺时针25°，再放大和平移取景':'顺时针25° · 取景已调整'):m.flipping?(m.flip===0?'先恢复完整原图视野':m.flip<1?'扫描线左侧已翻转，右侧仍为原方向':'整幅图已完成水平翻转'):'所选区域放大到固定尺寸'}</text>
 <g clipPath={'url(#'+id+'-source)'} data-aug-source>
  <PelicanIllustration view="original" label="始终保留的鹈鹕原图 x" x={S.x} y={S.y} width={S.w} height={S.h} frame={false} className="aug2-original aug3-art"/>
  <path d={aperture} fillRule="evenodd" className="aug3-outside" opacity={c===0?m.selection*.6:.6}/>
 </g>
 <rect x={S.x} y={S.y} width={S.w} height={S.h} rx="12" className="aug3-window-border"/>
 <g data-crop-window data-region={[m.selected.x,m.selected.y,m.selected.w,m.selected.h].join(',')}>
  <rect x={selection.x} y={selection.y} width={selection.w} height={selection.h} rx="5" className="aug3-selection"/>
  {[[0,0],[1,0],[0,1],[1,1]].map(([a,b])=><rect key={a+','+b} x={selection.x+a*selection.w-3} y={selection.y+b*selection.h-3} width="6" height="6" rx="1.4" className="aug3-handle"/>)}
 </g>
 <rect x={D.x} y={D.y} width={D.w} height={D.h} rx="12" className="aug3-placeholder"/>
 <g opacity={1-targetOpacity}><text x="896" y="165" textAnchor="middle" className="aug3-wait-title">训练窗口</text><text x="896" y="194" textAnchor="middle" className="later-svg-note">等待左侧选区的副本</text></g>
 <g clipPath={'url(#'+id+'-destination)'}>
  {c===2&&!m.flipping&&<g opacity={1-m.landed}><PelicanIllustration view="original" region={AUG_REGIONS.saved} label="上一轮的保存视图" x={D.x} y={D.y} width={D.w} height={D.h} frame={false} className="aug3-art"/></g>}
  <g opacity={targetOpacity} className="aug2-transformed" data-image-view={activeInput}>
   <PelicanIllustration view="original" region={m.flipping||m.rotating?m.baseRegion:m.finalRegion} rotation={m.rotationDeg} rotationScale={m.rotationScale} rotationOffsetX={m.rotationOffsetX} label="本次实际送入模型的训练视图" x={D.x} y={D.y} width={D.w} height={D.h} frame={false} className="aug3-art"/>
   {m.flipping&&<g clipPath={'url(#'+id+'-wipe)'}><PelicanIllustration view="original" region={AUG_REGIONS.original} mirrored label="水平翻转后的同一幅原图" x={D.x} y={D.y} width={D.w} height={D.h} frame={false} className="aug3-art"/></g>}
  </g>
  {m.flipping&&m.flip>0&&m.flip<1&&<g data-flip-sweep><rect x={D.x+D.w*m.flip-20} y={D.y} width="20" height={D.h} fill={'url(#'+id+'-sweep)'}/><path d={'M'+(D.x+D.w*m.flip)+' '+D.y+'v'+D.h} className="aug3-sweep-line"/></g>}
 </g>
 <rect x={D.x} y={D.y} width={D.w} height={D.h} rx="12" className="aug3-window-border"/>
 {m.rotating&&c===2&&<g data-rotation-guide opacity={windowAt(p,.3,.38)*(1-windowAt(p,.65,.77))} transform={'translate('+(D.x+D.w/2)+' '+(D.y+D.h/2)+')'}>
  <path d="M-7 0H7M0 -7V7M0 0H44" className="aug3-pivot-reference"/>
  <path d={'M0 0L'+(44*Math.cos(m.rotationDeg*Math.PI/180))+' '+(44*Math.sin(m.rotationDeg*Math.PI/180))} className="aug3-pivot-angle"/>
  <circle r="3" className="aug3-pivot-dot"/><text x="48" y="-10" className="aug3-angle-label lesson-math">{Math.round(m.rotationDeg)}°</text>
 </g>}
 <g opacity={movingCrop?1-m.copied*(1-m.landed):1} className="aug3-operation" transform="translate(0 -37)">
  {!m.rotating&&<path d="M490 211H627" className="aug3-operation-rule"/>}
  {m.rotating?<><LessonPath d="M532 210A28 28 0 1 1 560 238" className="aug3-rotation-arrow"/><text x="560" y="156" textAnchor="middle" className="later-svg-title">旋转25°</text><text x="560" y="267" textAnchor="middle" className="later-svg-note">绕中心 · 调整取景</text></>:m.flipping?<><path d="M505 188H605l-8 -6m8 6-8 6M612 236H512l8 -6m-8 6 8 6" className="aug3-operation-arrow"/><text x="560" y="165" textAnchor="middle" className="later-svg-title">水平翻转</text><text x="560" y="270" textAnchor="middle" className="later-svg-note">左右交换</text></>:<><path d="M505 203H612l-8 -6m8 6-8 6" className="aug3-operation-arrow"/><text x="560" y="175" textAnchor="middle" className="later-svg-title">裁剪 → 放大</text><text x="560" y="247" textAnchor="middle" className="later-svg-note">同一选区的副本</text></>}
 </g>
 {movingCrop&&m.copied>0&&m.landed<1&&<g data-aug-moving data-transfer={m.transfer} opacity={m.copied*(1-m.landed)}>
  <g clipPath={'url(#'+id+'-moving)'} className="aug3-flying-patch"><PelicanIllustration view="original" region={m.finalRegion} label="从原图复制出来、连续放大的选区" x={m.moving.x} y={m.moving.y} width={m.moving.w} height={m.moving.h} frame={false} className="aug3-art"/></g>
  <rect x={m.moving.x} y={m.moving.y} width={m.moving.w} height={m.moving.h} rx="9" className="aug3-moving-border"/>
 </g>}
 <text x="32" y="310" className="later-svg-note">原图保留；下次增强仍从这里开始。</text>
 <g className="aug3-operation-status"><circle cx="715" cy="306" r="4"/><text x="728" y="311">{micro}</text></g>

 <path d="M32 328H1088" className="aug2-rule"/>
 <text x="32" y="352" className="later-svg-title">保存时 · <ParameterSymbol index="old"/></text>
 <text x="32" y="384" className="aug2-formula lesson-math"><SavedTargetFormula/></text>
 <text x="32" y="417" className="later-svg-note">用保存时的视图计算输出，复制后冻结。</text>
 <g opacity={m.freezeCopy}><LessonPath d="M423 376H512" tone="gradient" progress={m.freezeCopy}/></g>
 {c===1&&m.freezeCopy>0&&m.freezeCopy<1&&<circle cx={mix(423,512,m.freezeCopy)} cy="376" r="5" className="aug3-copy-signal"/>}
 <rect x="512" y="342" width="96" height="66" rx="11" className="aug3-frozen-surface"/>
 <g opacity={1-m.freeze}><text x="560" y="380" textAnchor="middle" className="later-svg-note">等待输出副本</text></g>
 <g opacity={m.freeze} data-fixed-history><path d="M549 348v-4a5 5 0 0 1 10 0v4m-12 0h14v12h-14Z" className="aug3-lock"/><text x="560" y="394" textAnchor="middle" className="aug2-z lesson-math">固定 z</text></g>
 <g opacity={future?1:0}><LessonPath d="M608 376H696" tone="history" progress={c===2?windowAt(p,.86,.98):1}/></g>
 <text x="704" y="352" className="later-svg-title">回放时 · 当前 θ</text>
 <text x="704" y="384" className="aug2-formula lesson-math"><ReplayTargetFormula/></text>
 <text x="704" y="417" className="later-svg-note">新视图重新前向，目标 z 保持原值。</text>
 <g opacity={summary} className="aug3-view-family">
  <text x="32" y="450" className="later-svg-title">同一 x 的多种视图</text>
  <text x="32" y="478" className="later-svg-note">各自匹配 z，无两两损失</text>
  {[
    {region:AUG_REGIONS.saved}, {region:AUG_REGIONS.center},
    {region:AUG_REGIONS.original,mirrored:true},
    {region:AUG_REGIONS.original,rotation:AUG_ROTATION_DEG,rotationScale:rotationCoverScale(AUG_ROTATION_DEG,AUG_ROTATION_PAN_X),rotationOffsetX:AUG_ROTATION_PAN_X},
  ].map((art,i)=><g key={i} opacity={windowAt(p,.04+i*.06,.28+i*.06)}>
   <PelicanIllustration view="original" {...art} label={['较宽裁剪','中心裁剪','水平翻转','顺时针旋转25度'][i]} x={252+i*100} y={438} width={88} height={52.25} frame={false} className="aug3-art"/>
   <text x={296+i*100} y="509" textAnchor="middle" className="aug3-thumbnail-label lesson-math">A<MathSub>{i+1}</MathSub>(x)</text>
  </g>)}
  <rect x="704" y="438" width="384" height="65" rx="10" className="aug3-common-target"/>
  <text x="720" y="459" className="aug3-family-title">对照同一份历史目标</text>
  {[0,1,2,3].map(i=><text key={i} x={720+i*88} y="490" className="aug3-match lesson-math">a<MathSub>{i+1}</MathSub> → z</text>)}
 </g>
 </svg></div>
 <details className="aug3-explanation"><summary>补充说明：视图一致性与历史目标的局限</summary>
 <div className="later-reading-pair"><div><h4>平均响应与视图波动，都受约束。</h4><p>固定 z 时，期望平方误差可以拆成“平均响应到 z 的偏离”与“各视图围绕平均值的波动”。这解释了一种隐式一致性倾向，并不保证所有视图输出完全相同。</p><ReferenceButton term="augmentation">展开均值—方差解释</ReferenceButton></div><div><h4>稳定的历史目标，也可能是错的。</h4><p>合理变换需要保留类别语义，任意裁剪并不一定合理。即便多种视图都稳定匹配 z，z 也可能记录了一次错误判断。下一幕让历史真实标签提供独立监督。</p></div></div>
 <p className="quiet-note">鹈鹕是自绘图像增强示例；本幕不从其像素计算三类 logits、损失或梯度。下方 a₁ 至 a₄ 表示各增强视图的响应，不预设它们的具体数值或训练结果。</p>
 </details>
 <p className="aug3-boundary">自绘增强示意，不从插图计算真实 logits、损失或梯度。</p>
 </section>;
}
