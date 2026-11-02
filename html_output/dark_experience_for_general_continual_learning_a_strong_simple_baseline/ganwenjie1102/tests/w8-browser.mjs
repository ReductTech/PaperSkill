import {LESSON_DURATIONS} from '../src/modules/lesson-motion.ts';
import {runTraining,trainingSceneAt,WORKBENCH_CLIPS} from "../src/modules/training-model.ts";
import {EXPERIMENTS,COUNTEREXAMPLES} from "../src/modules/evidence-data.ts";
const MAIN_EXPERIMENT_IDS=new Set(["cifar-class","mnist500","mnist200"]);
const MAIN_EXPERIMENTS=EXPERIMENTS.filter(e=>MAIN_EXPERIMENT_IDS.has(e.id));
export async function fullW8Checks({page,base,check,shot}){
 const geometry=async scene=>{
 const result=await scene.locator(".teaching-canvas").evaluate(svg=>{
  const frame=svg.getBoundingClientRect(),outside=[],small=[];
  const visible=el=>{for(let n=el;n&&n!==svg;n=n.parentElement)if(+getComputedStyle(n).opacity<.02)return false;return true;};
  for(const el of svg.querySelectorAll("text,rect,circle,path")){
   if(!visible(el)||el.closest("svg[data-image-identity]"))continue;const r=el.getBoundingClientRect();
   if(r.width&&r.height&&(r.left<frame.left-2||r.right>frame.right+2||r.top<frame.top-2||r.bottom>frame.bottom+2))outside.push(el.textContent||el.tagName);
   if(el.tagName==="text"&&parseFloat(getComputedStyle(el).fontSize)*Math.hypot(el.getScreenCTM().a,el.getScreenCTM().b)<12)small.push(`${svg.closest("[data-scene]").dataset.scene} / ${el.getAttribute("class")} / ${el.textContent} / ${parseFloat(getComputedStyle(el).fontSize)*Math.hypot(el.getScreenCTM().a,el.getScreenCTM().b)}px`);
  }
  // Artwork intentionally extends outside its native cropped viewport; verify the viewport instead.
  for(const art of svg.querySelectorAll("svg[data-image-identity]")){if(!visible(art))continue;const matrix=art.parentElement.getScreenCTM(),a=new DOMPoint(art.x.baseVal.value,art.y.baseVal.value).matrixTransform(matrix),b=new DOMPoint(art.x.baseVal.value+art.width.baseVal.value,art.y.baseVal.value+art.height.baseVal.value).matrixTransform(matrix);if(a.x<frame.left-2||b.x>frame.right+2||a.y<frame.top-2||b.y>frame.bottom+2)outside.push("image viewport");}
  return {outside,small};
 });check(!result.outside.length,"All semantic shapes fit the canvas: "+result.outside);check(!result.small.length,"Diagram text retains >=12px actual size: "+result.small);
 };
 const seek=async(scene,i,duration,progress)=>{
  await scene.locator("select").selectOption(String(i));await scene.locator("[data-play]").click();await page.clock.runFor(32);await page.clock.fastForward(duration*progress);await scene.locator("[data-play]").click();
 };
 await page.emulateMedia({reducedMotion:"no-preference"});
 for(const [name,durations] of Object.entries(LESSON_DURATIONS)){
  await page.goto(base+"?focus="+name);await page.evaluate(()=>document.fonts.ready);const scene=page.locator("[data-scene="+name+"]");
  let canvasOffset=null;
  for(let i=0;i<durations.length;i++){
   await seek(scene,i,durations[i],.6);check(await scene.getAttribute("data-status")==="paused","Mid-process pause is real");await geometry(scene);const offset=await scene.evaluate(el=>el.querySelector('.teaching-canvas').getBoundingClientRect().top-el.getBoundingClientRect().top);if(canvasOffset===null)canvasOffset=offset;else check(Math.abs(offset-canvasOffset)<1,"Observation copy does not move the diagram between events");check(await scene.locator(".lesson-cue li[aria-current=step]").count()===1,"Each new animation identifies exactly one current observation step");
   if(name==="der-plus"&&i===0||[1,2,4].includes(i))await shot(name+"-"+i,"[data-scene="+name+"]");
   const snapshot=await scene.locator(".teaching-canvas").innerHTML();await page.clock.fastForward(1200);check(snapshot===await scene.locator(".teaching-canvas").innerHTML(),"Pause holds all geometry and values");
   await scene.locator("[data-back]").click();check(+(await scene.getAttribute("data-progress"))===0,"Back restores stage start");
  }
  if(name==="der-step"){
 await seek(scene,0,LESSON_DURATIONS["der-step"][0],.28);
 const readSizes=await scene.locator('[data-sample="replay read copy"]>rect,[data-sample="x₁ original memory"]>rect').evaluateAll(ns=>ns.map(n=>+n.getAttribute("width")));
 check(readSizes.length===2&&readSizes.every(n=>n===48),"Reading preserves the source glyph size instead of shrinking it into a dot");
 check(await scene.locator("[data-trail-progress]").count()>0,"A real travelled trail is present behind the moving read copy");
 await seek(scene,1,LESSON_DURATIONS["der-step"][1],.45);check(await scene.locator("[data-network]").getAttribute("data-forward")==="1"&&await scene.getAttribute("data-freeze-progress")==="0","Output fully arrives before its frozen copy starts");
 await seek(scene,3,LESSON_DURATIONS["der-step"][3],.6);check(await scene.locator(".tg-network.is-updating").count()===1,"Edge attachment is checked while reverse signalling is active");
 const edgeAnchors=await scene.locator("[data-network]").evaluate(g=>{const points=[...g.querySelectorAll(".tg-node")].map(n=>[+n.getAttribute("cx"),+n.getAttribute("cy")]);return [...g.querySelectorAll(".tg-edge")].every(e=>{const v=e.getAttribute("d").match(/-?\d+(?:\.\d+)?/g).map(Number);return points.some(([x,y])=>x===v[0]&&y===v[1])&&points.some(([x,y])=>x===v[2]&&y===v[3]);});});check(edgeAnchors,"Static network edges remain attached to their nodes during reverse signalling");
   await page.emulateMedia({reducedMotion:"reduce"});await scene.locator("select").selectOption("3");
   check(await scene.getAttribute("data-updates")==="2"&&await scene.getAttribute("data-seen")==="1","One update precedes any memory write");
   await scene.locator("select").selectOption("4");check(await scene.getAttribute("data-seen")==="2","Write occurs only after update");
   await scene.getByRole("button",{name:"空池首轮",exact:true}).click();await scene.locator("select").selectOption("2");
   check(await scene.locator("[data-sample*='replay']").count()===0,"Empty pool never invents replay");
  }
  if(name==="augmentation"){
   const formulaLayout=await scene.locator('.aug2-formula').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,bottom:n.getBoundingClientRect().bottom,next:n.nextElementSibling.getBoundingClientRect().top,sub:n.querySelectorAll('tspan[baseline-shift=sub]').length,font:getComputedStyle(n).fontFamily})));
   check(formulaLayout.every(f=>!f.text.includes('_')&&f.sub>0&&f.font.includes('Cambria Math')&&f.bottom<f.next),"Image formulas have real subscripts, D1's mathematical face and clear separation from prose");
   const target=await scene.getAttribute("data-target");
   await scene.getByRole("button",{name:"中心裁剪",exact:true}).click();
   const centerView=await scene.locator('.aug2-transformed').getAttribute('data-image-view');
   await scene.getByRole("button",{name:"水平翻转",exact:true}).click();
   check(await scene.getAttribute("data-view")==="flip","Replay view control selects the flipped pelican illustration");
   check(target===await scene.getAttribute("data-target"),"Augmentation never rewrites historical target when changing the view");
   check(centerView!==await scene.locator('.aug2-transformed').getAttribute('data-image-view'),"Choosing a new image view changes actual illustration transform"); check(await scene.locator('.tg-number').count()===0,"Pelican pixels are not assigned synthetic model logits");
   check(await scene.getByRole("button",{name:"水平翻转",exact:true}).getAttribute("aria-pressed")==="true","Selected replay view is exposed to assistive technology");
  }
  if(name==="der-plus"){
   const conflict=await scene.locator('[data-memory-record="xₑ"]').evaluate(el=>el.textContent||"");
   check(conflict.includes("真实 y = Claude")&&conflict.includes("旧 z 最高：GPT"),"DER++ opens with the E04 label/logit conflict visible");
   check(await scene.locator(".dp-z-wrong").count()===1,"The historical top logit is singled out inside the frozen vector");
   await scene.getByRole("button",{name:"DER",exact:true}).click();
   check(await scene.getAttribute("data-ry")==="none"&&await scene.getAttribute("data-supervision-count")==="2","DER removes the historical-label branch");
   await scene.getByRole("button",{name:"DER++",exact:true}).click();
   check(await scene.getAttribute("data-rd")==await scene.getAttribute("data-ry"),"Independent reads can happen to overlap");
   await scene.locator('[data-overlap-choice="different"]').click();
   check(await scene.getAttribute("data-rd")==="xₑ"&&await scene.getAttribute("data-ry")==="x_f","R-d and R-y can independently read different records");
   check(await scene.getAttribute("data-supervision-count")==="3","DER++ adds replay CE beside current CE and dark matching");
   await seek(scene,1,LESSON_DURATIONS["der-plus"][1],.6);await shot("der-plus-different-read","[data-scene=der-plus]");
  }
  await page.emulateMedia({reducedMotion:"reduce"});await scene.locator("select").selectOption(String(durations.length-1));
  check(await scene.getAttribute("data-progress")==="1","Reduced motion shows whole semantic result");
  if(name==="der-plus"){
   check(await scene.getAttribute("data-updates")==="1","All DER++ signals reach exactly one completed parameter update");
   check(await scene.locator(".dp-updated-parameter text").evaluate(e=>getComputedStyle(e).fill!=="rgb(255, 255, 255)"),"Joint-update caption remains readable against its pale background");
   check(await scene.locator(".dp-update-hub").count()===1&&await scene.locator(".dp-updated-parameter").count()===1,"The joint objective has one shared theta hub and no claimed corrective prediction");
   check((await scene.locator("[data-total-formula]").textContent()).includes("β Lreplay-CE"),"The historical-label term appears in the one joint objective");
  }
  const stable=await scene.locator(".teaching-canvas").innerHTML();await page.clock.fastForward(2000);check(stable===await scene.locator(".teaching-canvas").innerHTML(),"Reduced motion is static");
  await page.emulateMedia({reducedMotion:"no-preference"});
 }
 await page.goto(base);const rv=page.locator('[data-scene=reservoir]');
 check(await rv.getAttribute('data-clip')==='2'&&await rv.getAttribute('data-memory')==='x₁,x₂',"Main reservoir begins with the full old pool and third candidate");
 await rv.locator("details summary").click();
 await rv.getByRole('button',{name:'j = 1',exact:true}).click();
 check(await rv.getAttribute("data-status")==="playing","Manual draw immediately starts its visible demonstration");
 await page.clock.runFor(4800*.61);
 const movingWidth=await rv.locator("[data-record-token] [data-model-pixel]").evaluate(n=>n.getBBox().width);
 const normalWidth=await rv.locator('[data-record="x₂"] [data-model-pixel]').evaluate(n=>n.getBBox().width);
 check(Math.abs(movingWidth-normalWidth)<.1,"Travelling DeepSeek has the same pixel grid size as the normal GPT record");
 await page.clock.runFor(2000);
 const landedWidth=await rv.locator('[data-record="x₃"] [data-model-pixel]').evaluate(n=>n.getBBox().width);
 check(Math.abs(movingWidth-landedWidth)<.1,"The arriving icon keeps its size when it becomes the stored record");
 await page.emulateMedia({reducedMotion:'reduce'});await rv.locator('select').selectOption('1');
 check(await rv.getAttribute('data-memory')==='x₁,x₃',"Manual legal replacement persists into the next rejected input");
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(base+"?focus=workbench");const wb=page.locator("[data-scene=workbench]");
 for(const start of [0,5,10,15,20]){
  await wb.locator('select').selectOption(String(start));
  const input=await wb.locator('.wb-current-input').evaluate(el=>({opacity:getComputedStyle(el).opacity,text:el.textContent,transform:el.getAttribute('transform')}));
  check(await wb.getAttribute('data-progress')==='0'&&input.opacity==='1'&&!input.transform,'Every paused round/query start shows its input immediately at its final position');
  check(input.text.includes(start===20?'查询 u':['x₁','x₂','x₃','x₄'][start/5]),'Initial input identity matches the selected round/query');
 }
 await wb.locator('[data-replay]').click();check(await wb.locator('.wb-current-input').getAttribute('opacity')==='1','Replay starts with the current input visible before time advances');await wb.locator('select').selectOption('0');
 check(!(await wb.locator('.wb-handoff-rounds').innerText()).includes('替换'),"Initial round navigation does not expose future reservoir outcomes");
 const recordNodes=await wb.locator('[data-instance-id]').elementHandles();
 const network=await wb.locator("[data-network]").elementHandle(),memory=await wb.locator("[data-workbench-memory]").elementHandle();
 for(const mode of ["DER","DER++"]){
  await wb.locator("[data-mode="+(mode==="DER"?"DER":'"DER++"')+"]").click();
  const steps=runTraining(mode);
  for(let i=0;i<steps.length;i++){
   const handoff=wb.locator("[data-handoff-round='"+(i+1)+"']"),after=steps[i].after;
   check(+(await handoff.getAttribute("data-updates"))===after.updates,"Handoff ledger inherits the exact round-end parameter version");
   check(+(await handoff.getAttribute("data-seen"))===after.N,"Handoff ledger inherits exact processed count");
   check(await handoff.getAttribute("data-memory")===after.M.map(r=>r.id).join(","),"Handoff ledger preserves record identity and order");
   check(await handoff.getAttribute("data-weights")===JSON.stringify(after.W),"Handoff ledger is derived from the computed model, not a hand-entered diagram");
  }
  await page.emulateMedia({reducedMotion:"reduce"});
  for(let c=0;c<21;c++){
   await wb.locator("select").selectOption(String(c));const expected=trainingSceneAt(steps,c,1);
   check(await wb.getAttribute("data-weights")===JSON.stringify(expected.state.W),"Every displayed parameter equals computed state");
   check(+(await wb.getAttribute("data-seen"))===expected.state.N,"Every phase inherits exact N");
   check(+(await wb.getAttribute("data-updates"))===expected.state.updates,"Only one update per round");
   check(await wb.getAttribute("data-memory")===expected.state.M.map(r=>r.id).join(","),"Every memory snapshot follows shared model");
   check(await wb.locator("text").filter({hasText:/slot [01] · 空/}).count()===2-expected.state.M.length,"Only genuinely empty slots carry an empty label");
   if(c<20&&c%5===1){const response=await wb.locator('.tg-number').allTextContents();const frozen=(await wb.locator('[data-training-record="'+steps[Math.floor(c/5)].candidate.id+'"] .wb-record-vector').textContent()).replace(/[()]/g,'').split(',').map(s=>s.trim());check(JSON.stringify(response)===JSON.stringify(frozen),"Displayed frozen copy preserves exactly the displayed source numbers");}
   if(c===13)check(await wb.getAttribute("data-memory")==="x₁,x₂","Round 3 trains from old memory before replacement");
   if(c===14)check(await wb.getAttribute("data-memory")==="x₃,x₂","Round 3 replaces only after update");
   if(c===18)check(+(await wb.getAttribute("data-updates"))===4&&+(await wb.getAttribute("data-seen"))===3,"Rejected item still trains before reservoir");
   if(c===20){
    check(await wb.locator(".wb-exit-bay,.wb-objective").count()===0,"Read-only prediction removes training loss and reservoir exit branches");
    check(await wb.locator("[data-read-d=true],[data-read-y=true]").count()===0,"Prediction does not imply a replay read");
    check(await wb.locator("[data-query-result]").count()===1,"Prediction has one distinct output state");
   }
   if([0,7,13,14,19,20].includes(c)){const fits=await wb.locator('.tg-number').evaluateAll(ns=>ns.every(n=>{const b=n.getBoundingClientRect(),r=n.parentElement.querySelector('rect').getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1&&b.top>=r.top-1&&b.bottom<=r.bottom+1;}));check(fits,"Mathematical score numerals fit their cells without squeezing");await geometry(wb);await shot("workbench-"+mode.replace("++","plus")+"-"+c,"[data-scene=workbench]");}
  }
  const before=await wb.getAttribute("data-weights"),seen=await wb.getAttribute("data-seen");
  await wb.locator("[data-predict]").click();await page.clock.fastForward(2000);
  check(before===await wb.getAttribute("data-weights")&&seen===await wb.getAttribute("data-seen"),"Prediction leaves trained parameters and N unchanged");
  await wb.locator("[data-round-select='2']").click();check(await wb.getAttribute("data-round")==="3","Direct round rewind works");
  await wb.locator("[data-numeric-details] summary").click();check((await wb.locator("[data-numeric-details]").innerText()).includes("联合梯度"),"Exact numeric inspection is available");
  await wb.locator("[data-numeric-details] summary").click();
  await page.emulateMedia({reducedMotion:"no-preference"});
  for(const c of [1,5,13,14,19,20]){await seek(wb,c,WORKBENCH_CLIPS[c].durationMs,.5);await geometry(wb);await shot("workbench-motion-"+c,"[data-scene=workbench]");}
 }
 await wb.locator('[data-round-select="2"]').click();
 await wb.locator('[data-round-scrub]').fill('1.45');
 check(await wb.locator('[data-network]').getAttribute('data-forward')==='1'&&await wb.getAttribute('data-freeze-progress')==='0','Workbench freezes only after the complete forward');
 await wb.locator('[data-round-scrub]').fill('1.64');
 check(await wb.getAttribute('data-clip')==='11'&&Math.abs(+(await wb.getAttribute('data-progress'))-.64)<.002,"Round scrub seeks a true paused intermediate frame");
 check(await wb.getAttribute('data-status')==='paused',"Scrubbing never silently resumes playback");
 check(await wb.locator('.wb-handoff-rounds button[aria-pressed=true] strong').evaluate(e=>getComputedStyle(e).color!=="rgb(255, 255, 255)"),"Active round text stays readable on its pale surface");
 const scrubFrame=await wb.locator('.teaching-canvas').innerHTML();await page.clock.fastForward(1800);
 check(scrubFrame===await wb.locator('.teaching-canvas').innerHTML(),"Scrubbed objects stay at exact intermediate positions");
 for(const node of recordNodes)check(await node.evaluate(el=>el.isConnected),"Record DOM objects persist through rounds and method resets");
 check(await network.evaluate(el=>el===document.querySelector("[data-network]")),"The same network DOM object persists through rounds and mode resets");
 check(await memory.evaluate(el=>el===document.querySelector("[data-workbench-memory]")),"The same memory container persists");
 await page.goto(base+"?focus=evidence");const evidence=page.locator("[data-scene=evidence]");
  check(+(await evidence.getAttribute("data-experiment-count"))===MAIN_EXPERIMENTS.length,"The mainline selects three evidence settings");
  check(await evidence.locator(".evidence-card").count()===MAIN_EXPERIMENTS.length,"Only selected comparisons occupy the mainline");
  for(const e of MAIN_EXPERIMENTS){
  const card=evidence.locator("[data-experiment='"+e.id+"']");
  check(await card.getAttribute("data-evidence-id")===e.evidence,"Each result keeps its evidence registry ID");
  check(await card.getAttribute("data-source-locator")===e.locator,"Each result keeps its complete table/source locator");
  check((await card.locator(".evidence-protocol").innerText())===e.protocol,"Protocol is explicit beside the plotted values");
  for(const v of e.values){const row=card.locator("[data-method='"+v.method+"']");check(+(await row.getAttribute("data-mean"))===v.mean,"Real paper value retained");check(+(await row.getAttribute("data-spread"))===v.spread,"Paper ± retained");}
 }
 await shot("evidence-top");
 await shot("evidence-results","[data-scene=evidence] .evidence-grid");
  await evidence.getByRole("button",{name:/查看完整主表、反例与来源/}).click();
  const resultReference=page.locator("[data-reference-detail='evidence-results']");
  const referenceRows=EXPERIMENTS.reduce((n,e)=>n+e.values.length,0)+COUNTEREXAMPLES.length;
  check(await resultReference.locator("table tbody tr").count()===referenceRows,"The Reference retains the complete table and additional counterexamples");
  await shot("evidence-full-reference");await page.keyboard.press("Escape");
 check(await evidence.locator(".evidence-error").count()===0,"± notation is not recast as a statistical interval");
 await evidence.getByRole("button",{name:/查看分析与局限/}).click();check(await page.locator("dialog").isVisible(),"Reference analyses open");
 check(await page.locator("[data-reference-detail='evidence-analysis'] math").count()>0,"ECE uses mathematical layout");
 await page.keyboard.press("Escape");await page.goto(base);
 await shot("article-final-opening");
 check(await page.locator(".lesson-section").count()===7,"All seven reading units are real");
 check(await page.locator(".chapter-flourish").count()===14,"Each of the seven pages carries both small botanical motifs");
 const bad=await page.locator(".site-header nav a,.kl-main-equation math,.score-main-equation math,.wb-rounds button").evaluateAll(nodes=>nodes.filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.textContent));
 check(!bad.length,"Navigation and mainline math fit: "+bad);
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Full article has no horizontal overflow");
}
