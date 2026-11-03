export async function reviewFeedbackChecks({page,base,check,shot}){
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 const lesson=page.locator('.der-u2');
 for(const name of ['概率空间 · KL','分数空间 · 平方差']){
  await lesson.getByRole('button',{name,exact:true}).click();
  const boxes=await lesson.locator('.der-lens .equation').evaluateAll(nodes=>nodes.map(el=>({x:el.scrollWidth-el.clientWidth,y:el.scrollHeight-el.clientHeight})));
  check(boxes.length===1&&boxes.every(b=>b.x<=1&&b.y<=1),'Each focused lens typesets its definition without clipping');
 }
 await shot('feedback-comparison','.der-lab');
 const ev=page.locator('[data-scene=evidence]');
 check(await ev.locator('[data-experiment]').count()===3,'Three current static evidence settings remain visible');
 const ranges=await ev.locator('.evidence-row').evaluateAll(rows=>rows.map(row=>{
  const track=row.querySelector('.evidence-track').getBoundingClientRect(),dot=row.querySelector('.evidence-mean').getBoundingClientRect();
  return {meanError:Math.abs(dot.x+dot.width/2-(track.x+track.width*Number(row.dataset.mean)/100)),spread:row.querySelector('output small').textContent,expected:'±'+Number(row.dataset.spread).toFixed(2)};
 }));
 check(ranges.every(r=>r.meanError<1&&r.spread===r.expected),'Exact mean markers align and source uncertainty remains literal text: '+JSON.stringify(ranges));
 await shot('feedback-evidence','[data-scene=evidence]');
 const lifecycle=page.locator('[data-scene=lifecycle]');await lifecycle.locator('select').selectOption('2');
 const heading=await lifecycle.locator(':scope > header').boundingBox(),reading=await page.locator('.reading-layout').boundingBox();
 check(Math.abs(heading.x-reading.x)<1&&Math.abs(heading.width-reading.width)<1,'Lifecycle heading shares the main prose alignment');
 const network=await lifecycle.locator('[data-current-model]').elementHandle();
 for(const clip of [2,5,8]){
  await lifecycle.locator('select').selectOption(String(clip));
  const g=await lifecycle.evaluate(el=>{const stage=el.querySelector('.lifecycle-viewport').getBoundingClientRect(),bar=el.querySelector('.motion-transport').getBoundingClientRect(),root=el.getBoundingClientRect();return {noSidebar:!el.querySelector('.lifecycle-sidebar'),below:bar.top>=stage.bottom-1,center:Math.abs(stage.x+stage.width/2-innerWidth/2),root:root.x>=-1&&root.right<=innerWidth+1,notes:el.querySelectorAll('.lifecycle-reading>p').length,hasNote:!!el.querySelector('.lifecycle-example-note')};});
  check(g.noSidebar&&g.below&&g.center<2&&g.root&&g.notes===1&&g.hasNote,'Normal player uses a centered stage, compact controls and one observation: '+JSON.stringify(g));
  await shot('feedback-centered-'+clip,'[data-scene=lifecycle]');
 }
 await lifecycle.locator('.lifecycle-focus-button').click();check(await lifecycle.getAttribute('role')==='dialog','Focus remains available');
 check(await network.evaluate(el=>el===document.querySelector('[data-current-model]')),'Entering focus retains exact network object');
 await shot('feedback-focus');await lifecycle.locator('.lifecycle-exit-focus').click();
 check(await lifecycle.getAttribute('data-clip')==='8','Returning to reading retains phase');
 check(await network.evaluate(el=>el===document.querySelector('[data-current-model]')),'Returning retains exact network object');
 check(await page.evaluate(()=>document.body.style.overflow!=='hidden'&&document.documentElement.scrollWidth<=innerWidth+1),'Ordinary reading scroll and width are correct');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base);
}
