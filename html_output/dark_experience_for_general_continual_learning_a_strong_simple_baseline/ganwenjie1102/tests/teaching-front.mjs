import {responseComparison,RESPONSE_CASES,LABEL_OLD,LABEL_CURRENT} from '../src/modules/math-model.ts';
export async function teachingFrontChecks({page,base,check,shot}){
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 const label=page.locator('.label-investigation'),stream=page.locator('[data-front-scene=stream]');
 const lineCrossings=await stream.locator('.der-current-route').evaluate(path=>{
  const root=path.ownerSVGElement,ids=['stream:earlier','stream:earlier-2','stream:current'];
  const boxes=ids.map(id=>root.querySelector(`[data-sample-id="${id}"]>rect`).getBoundingClientRect());
  return Array.from({length:31},(_,i)=>{const p=path.getPointAtLength(path.getTotalLength()*i/30),q=new DOMPoint(p.x,p.y).matrixTransform(path.getScreenCTM());return boxes.some(b=>q.x>b.left&&q.x<b.right&&q.y>b.top&&q.y<b.bottom);}).some(Boolean);
 });
 check(!lineCrossings,'Current-input connector stays outside all stationary sample objects');
 const identities=await stream.locator('[data-sample-id="stream:earlier"] [data-model-pixel],[data-sample-id="stream:earlier-2"] [data-model-pixel],[data-sample-id="stream:current"] [data-model-pixel]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-model-pixel')));
 check(JSON.stringify(identities)===JSON.stringify(['Claude','GPT','DeepSeek']),'Historical x1 and x2 are Claude/GPT; current x3 is DeepSeek from the initial frame');
 for(const selector of ['.der-stream','.der-origin']){
  const scene=page.locator(selector),last=selector==='.der-stream'?3:2;
  await scene.locator('select').selectOption(String(last));
  check(await scene.locator('progress').evaluate(el=>el.value<el.max),'Last-stage start is distinguished from completed playback');
  check((await scene.locator('[data-time-readout]').innerText()).includes('0%'),'Readout explains that the selected last step is at zero percent');
  await scene.locator('[data-next]').click();
  check(await scene.locator('progress').evaluate(el=>el.value===el.max),'Completing the last step fills the teaching progress bar');
  await scene.locator('select').selectOption('0');
  await scene.locator('[role=combobox]').click();
  const boxes=await scene.evaluate(el=>{const a=el.querySelector('[role=combobox]').getBoundingClientRect(),b=el.querySelector('[role=listbox]').getBoundingClientRect();const options=[...el.querySelectorAll('[role=option]')];return {match:Math.abs(a.x-b.x)<1&&Math.abs(a.width-b.width)<1,visible:options.every(n=>{const r=n.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=0&&r.bottom<=innerHeight&&top&&n.contains(top);})};});
  check(boxes.match,'Stage menu matches trigger width and alignment');check(boxes.visible,'Every menu option is visible, unclipped and hit-testable');
  await shot(selector==='.der-stream'?'stream-menu-fixed':'origin-menu-fixed',selector);
  await page.keyboard.press('Escape');
 }

 for(const selector of ['.der-network','.origin-model']){
  const counts=await page.locator(selector+' circle').evaluateAll(nodes=>Object.values(nodes.reduce((layers,node)=>{const x=node.getAttribute('cx');layers[x]=(layers[x]||0)+1;return layers;},{})));
  check(JSON.stringify(counts)===JSON.stringify([3,5,3]),'Intro network has the shared 3–5–3 topology: '+selector);
  check(await page.locator(selector+' line').count()===30,'Both adjacent layers have complete 3×5 and 5×3 connections');
 }
 check(await stream.locator('.der-memory-connector').isVisible(),'Memory-to-model arrow is visible from the initial explanatory state');
 const dots=await stream.locator('.der-stream-ellipsis circle').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width));
 check(dots.length===3&&dots.every(w=>w>=6),'Stream omission is three visibly sized dots');

 check(await label.locator('.prediction-answer').count()===2,'Both classification answers precede the full response');
 check(await label.getAttribute('data-current-progress')==='0'&&!await label.locator('.response-finding').isVisible(),'Dark knowledge conclusion waits for the response observation');
 await shot('redesign-u1-answer','.label-investigation');
 await label.locator('[data-label-mode=full]').click();await page.clock.runFor(700);
 check(+(await label.getAttribute('data-history-progress'))>0&&+(await label.getAttribute('data-history-progress'))<1&&await label.getAttribute('data-current-progress')==='0','History is revealed before changing the current response');
 await label.locator('[data-label-play]').click();const held=await label.getAttribute('data-history-progress');await page.clock.runFor(500);check(held===await label.getAttribute('data-history-progress'),'Reveal pause preserves its intermediate frame');
 await label.locator('[data-label-replay]').click();await page.clock.runFor(5000);
 for(const [id,expected] of [['history',LABEL_OLD],['current',LABEL_CURRENT]]){const values=await label.locator(`[data-response=${id}] output`).allTextContents();check(JSON.stringify(values.map(Number))===JSON.stringify(expected),'Exact final response uses shared coordinates: '+id);}
 check(await label.locator('.response-finding').isVisible(),'Completed observation explains the missing history');
 await shot('redesign-u1-response','.label-investigation');
 await stream.locator('[data-play]').click();await page.clock.runFor(900);check(+(await stream.getAttribute('data-progress'))>0&&await stream.getAttribute('data-theta')==='θ₀','Input arrives before a parameter update');
 await stream.locator('[data-play]').click();const paused=await stream.getAttribute('data-progress');await page.clock.runFor(500);check(paused===await stream.getAttribute('data-progress'),'Stream pause holds all positions');
 await stream.locator('[data-replay]').click();await page.clock.runFor(15000);check(await stream.getAttribute('data-theta')==='θ₁','New x3 and replay x1 share exactly one final parameter update');
 check(await stream.locator('[data-sample-id="stream:retained-x1"]').count()===1,'Reading a copy preserves the original memory record');
 check(await page.locator('.der-constraints dl>div').count()===3,'GCL retains all three constraints');
 const objects=await page.locator('.origin-model-surface,.origin-slip-surface').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return r.height/r.width}));
 check(objects.every(r=>r>=.65),'Model and response objects retain a comfortably tall proportion');
 const symbolStyles=await page.locator('.origin-theta,.origin-slip-symbol').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).fontStyle));
 check(symbolStyles.every(s=>s==='normal'),'Origin diagram symbols use upright text');

 await shot('redesign-u1-stream','.der-stream');
 const lab=page.locator('[data-design=response-comparison]');
 for(let i=0;i<3;i++){await lab.locator(`[data-response-case=${RESPONSE_CASES[i].id}]`).click();await page.clock.runFor(1800);const r=responseComparison(i),d=await lab.evaluate(el=>({...el.dataset}));check(d.z==='2,1,0'&&d.a===r.a.join(','),'Historical target fixed across case '+i);for(const k of ['p','q'])check(d[k].split(',').every((v,j)=>Math.abs(+v-r[k][j])<1e-12),'Unrounded probabilities share one calculation');check(Math.abs(+d.kl-r.probabilityKL)<1e-12&&+d.l2===r.squaredDistance,'Both losses agree with the shared model');check(Math.abs(+(await lab.locator('[data-kl-value]').innerText())-r.probabilityKL)<.000051,'Visible KL matches exact data');check(+(await lab.locator('[data-l2-value]').innerText())===r.squaredDistance,'Visible squared total matches exact data');}
 await lab.locator('[data-response-case=preference]').click();await page.clock.runFor(700);await lab.locator('[data-response-play]').click();const mid=await lab.getAttribute('data-a');await page.clock.runFor(500);check(mid===await lab.getAttribute('data-a'),'Lab pauses vector and losses together');await shot('redesign-u2-mid','.der-lab');
 // Retarget in flight, including a second click on the same case.
 await lab.locator('[data-response-case=equal]').click();await page.clock.runFor(250);await lab.locator('[data-response-case=shifted]').click();await page.clock.runFor(250);await lab.locator('[data-response-case=shifted]').click();await page.clock.runFor(1800);check(await lab.getAttribute('data-a')==='3,2,1'&&await lab.getAttribute('data-kl')==='0','Rapid retargeting converges to the final selected case');
 for(const name of ['概率空间 · KL','分数空间 · 平方差']){await lab.getByRole('button',{name,exact:true}).click();check(await lab.locator('table tbody tr').count()===3,'Each lens preserves the same three class coordinates');await shot(name.startsWith('概率')?'redesign-u2-kl':'redesign-u2-squared','.der-lab');}
 const origin=page.locator('[data-front-scene=snapshot-origin]');await origin.locator('select').selectOption('1');await origin.locator('[data-play]').click();await page.clock.runFor(1800);const copy=origin.locator('[data-vector-id]');const clearCopy=await origin.evaluate(el=>{const values=[...el.querySelectorAll('.origin-numeric-transfer text')].map(t=>t.getBoundingClientRect());return !el.querySelector('.origin-copy-token')&&values.length===3&&values[1].left-values[0].left>50&&values[2].left-values[1].left>50;});check(clearCopy,'Three copied values retain their spacing throughout transfer, with no popping box');check(await origin.getAttribute('data-theta')==='0'&&await copy.count()===1,'Copy exists while the parameter is still pre-update');await origin.locator('[data-play]').click();const transform=await copy.innerHTML();await page.clock.runFor(500);check(transform===await copy.innerHTML(),'Frozen-copy motion can be paused');await shot('redesign-u3-copy','.der-origin');
 await origin.locator('[data-replay]').click();await page.clock.runFor(14000);check(await origin.getAttribute('data-theta')==='1'&&await origin.getAttribute('data-frozen')==='true'&&await copy.getAttribute('data-values')==='2,1,0','Parameter updates after copying while the target remains unchanged');
 check(await page.locator('.two-round-preview,.teacher-relation').count()===0&&await page.locator('.der-round-row').count()===2,'Two compact rows replace the duplicate complete player');
 check(await page.locator('[data-scene=lifecycle]').count()===1&&await page.locator('.der-redesign [data-scene=lifecycle]').count()===0,'The sole original D1 stage is outside redesign styling');
 await shot('redesign-u3-final','.der-u3');
 for(const selector of ['.der-stream svg','.der-origin svg']){const outside=await page.locator(selector).evaluate(svg=>{const b=svg.getBoundingClientRect();return [...svg.querySelectorAll('text')].filter(el=>{const r=el.getBoundingClientRect();return r.x<b.x-1||r.right>b.right+1||r.y<b.y-1||r.bottom>b.bottom+1;}).map(el=>el.textContent)});check(!outside.length,'Diagram labels stay inside their canvas: '+outside);}
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base);await page.locator('[data-label-mode=full]').click();check(await page.locator('.label-investigation').getAttribute('data-current-progress')==='1','Reduced motion reaches the full response without running a timeline');
 for(const [id,l2] of [['equal',0],['preference',2],['shifted',3]]){await page.locator(`[data-response-case=${id}]`).click();check(+(await page.locator('[data-design=response-comparison]').getAttribute('data-l2'))===l2,'Reduced motion keeps exact loss for '+id);}
 const o=page.locator('[data-front-scene=snapshot-origin]');await o.locator('select').selectOption('2');check(await o.getAttribute('data-theta')==='1'&&await o.getAttribute('data-target')==='2,1,0','Reduced motion preserves the complete freeze sequence');
 await page.locator('[data-label-mode=answer]').focus();await page.keyboard.press('Tab');check(await page.locator(':focus').evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),'Keyboard focus has a visible outline');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No desktop page overflow');await page.emulateMedia({reducedMotion:'no-preference'});
}
