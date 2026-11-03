export async function connectorChecks({page,base,check,shot}){
 await page.emulateMedia({reducedMotion:'reduce'});
 const portCheck=async(scene,route,source,target,sourceSide,targetSide)=>{
  const result=await scene.evaluate((el,{route,source,target,sourceSide,targetSide})=>{
   const p=el.querySelector(route+' .lesson-shaft'),a=el.querySelector(source).getBoundingClientRect(),b=el.querySelector(target).getBoundingClientRect();
   const point=t=>{const q=p.getPointAtLength(t);return new DOMPoint(q.x,q.y).matrixTransform(p.getScreenCTM());},length=p.getTotalLength(),start=point(0),end=point(length),near=point(length-.5);
   const side=(r,name)=>name==='left'?r.left:name==='right'?r.right:name==='bottom'?r.bottom:r.top;
   const startValue=sourceSide==='bottom'||sourceSide==='top'?start.y:start.x,endValue=targetSide==='bottom'||targetSide==='top'?end.y:end.x;
   return {sourceGap:Math.abs(startValue-side(a,sourceSide)),targetGap:Math.abs(endValue-side(b,targetSide)),dx:end.x-near.x,dy:end.y-near.y};
  },{route,source,target,sourceSide,targetSide});
  check(result.sourceGap<.15&&result.targetGap<.15,'Connector starts and ends on actual object borders: '+route+' '+JSON.stringify(result));
  check((targetSide==='bottom'?result.dy<0&&Math.abs(result.dx)<Math.abs(result.dy)*.05:(targetSide==='left'?result.dx>0:result.dx<0)&&Math.abs(result.dy)<Math.abs(result.dx)*.05),'Arrow arrives perpendicular to its target border: '+route);
 };
 await page.goto(base+'?focus=der-step');const ds=page.locator('[data-scene=der-step]');await ds.locator('select').selectOption('3');
 await portCheck(ds,'.ds3-merge-current','[data-attention-object=current-loss]>rect','[data-attention-object=joint-update]>rect','right','left');
 await portCheck(ds,'.ds3-merge-history','[data-attention-object=dark-loss]>rect','[data-attention-object=joint-update]>rect','right','left');
 const mirror=await ds.evaluate(el=>{const a=el.querySelector('.ds3-merge-current .lesson-shaft'),b=el.querySelector('.ds3-merge-history .lesson-shaft'),r=el.querySelector('[data-attention-object=joint-update]>rect'),cy=+r.getAttribute('y')+ +r.getAttribute('height')/2;return Array.from({length:21},(_,i)=>{const p=a.getPointAtLength(a.getTotalLength()*i/20),q=b.getPointAtLength(b.getTotalLength()*i/20);return Math.abs(p.x-q.x)<.01&&Math.abs(p.y+q.y-2*cy)<.01;}).every(Boolean);});
 check(mirror,'Both gradient inputs are mirror images about the merge panel center');await shot('connectors-merge','[data-scene=der-step] .teaching-canvas');
 await ds.locator('select').selectOption('4');await portCheck(ds,'.ds3-write-route','[data-attention-object=frozen-candidate]>rect','.ds3-postwrite-focus','left','right');await shot('connectors-write','[data-scene=der-step] .teaching-canvas');
 await page.goto(base+'?focus=workbench');const wb=page.locator('[data-scene=workbench]');
 for(const mode of ['DER','DER++']){await wb.getByRole('button',{name:mode,exact:true}).click();await wb.locator('select').selectOption('13');await portCheck(wb,'.wb-joint-gradient','.wb-objective-panel','.tg-network','bottom','bottom');}
 await shot('connectors-workbench','[data-scene=workbench] .teaching-canvas');
 await page.goto(base+'?focus=augmentation');const aug=page.locator('[data-scene=augmentation]');await aug.getByRole('button',{name:'旋转',exact:true}).click();
 check(await aug.locator('.aug3-operation-rule').count()===0,'Rotation gesture has no unrelated line crossing its center');
 const tangent=await aug.locator('.aug3-rotation-arrow .lesson-shaft').evaluate(p=>{const l=p.getTotalLength(),a=p.getPointAtLength(l),b=p.getPointAtLength(l-.1);return {dx:a.x-b.x,dy:a.y-b.y};});
 check(tangent.dx<0&&Math.abs(tangent.dy)<.01,'Clockwise arc ends with its arrowhead following the arc tangent');await shot('connectors-rotation','[data-scene=augmentation]');
 for(const [name,last] of [['augmentation',3],['reservoir',3],['der-step',4],['der-plus',2],['workbench',13]]){
  await page.goto(base+'?focus='+name);const scene=page.locator('[data-scene='+name+']');await scene.locator('select').selectOption(String(last));
  const defects=await scene.evaluate(el=>[...el.querySelectorAll('.lesson-path')].filter(g=>+g.dataset.pathProgress>=1).flatMap(g=>{
   const tip=g.querySelector('.lesson-tip'),head=tip?.getAttribute('marker-end'),id=head?.match(/#([^)]*)/)?.[1],marker=id&&document.getElementById(id);
   return !tip||tip.hasAttribute('mask')||!marker||marker.getAttribute('overflow')!=='visible'||marker.getAttribute('markerUnits')!=='userSpaceOnUse'?['clipped or missing arrowhead']:[];
  }));check(!defects.length,'All completed '+name+' arrows have complete, independently painted tips: '+defects);
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
}
