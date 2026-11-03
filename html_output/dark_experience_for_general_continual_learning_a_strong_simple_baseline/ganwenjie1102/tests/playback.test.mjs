import assert from "node:assert/strict";import {createRequire} from "node:module";import {mkdir,writeFile,rename} from "node:fs/promises";import {resolve} from "node:path";import {runTraining,trainingSceneAt} from "../src/modules/training-model.ts";
const require=createRequire(new URL("../../../../../reusable-kit/demo/package.json",import.meta.url)),{chromium}=require("playwright");
const output=resolve(process.env.DER_PLAYBACK_DIR||".visual-qa/der-w8-playback");
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:output,size:{width:1440,height:900}}});
const page=await context.newPage(),errors=[],samples=[],seen=new Set(),steps=runTraining("DER++");
page.on("pageerror",e=>errors.push(e.message));page.on("requestfailed",r=>errors.push(r.url()));page.on("response",r=>{if(r.status()>=400)errors.push(r.status()+" "+r.url())});
let video;
try{
 await page.goto((process.env.DER_PREVIEW_URL||"http://127.0.0.1:5195/")+"?focus=workbench");
 const scene=page.locator("[data-scene=workbench]");
 await scene.locator("button[data-mode='DER++']").click();await scene.locator("[data-replay]").click();
 await scene.locator("svg").scrollIntoViewIfNeeded();
 const start=Date.now();
 while(Date.now()-start<155000){
  const s=await scene.evaluate(el=>({c:+el.dataset.clip,p:+el.dataset.progress,status:el.dataset.status,N:+el.dataset.seen,updates:+el.dataset.updates,M:el.dataset.memory,W:el.dataset.weights}));
  const expected=trainingSceneAt(steps,s.c,s.p);
  assert.equal(s.N,expected.state.N);assert.equal(s.updates,expected.state.updates);assert.equal(s.M,expected.state.M.map(r=>r.id).join(","));assert.equal(s.W,JSON.stringify(expected.state.W));
  samples.push({wallMs:Date.now()-start,...s});
  if(s.p>.56&&!seen.has(s.c)){seen.add(s.c);if([0,2,7,13,14,18,19,20].includes(s.c))await scene.locator("svg").screenshot({path:resolve(output,"phase-"+s.c+".png")});}
  if(s.status==="finished")break;
  await page.waitForTimeout(220);
 }
 assert.equal(samples.at(-1).status,"finished");assert.equal(seen.size,21);assert.equal(samples.at(-1).N,4);assert.equal(samples.at(-1).updates,4);assert.deepEqual(errors,[]);
 video=page.video();
 await writeFile(resolve(output,"playback.json"),JSON.stringify({browser:browser.version(),mode:"DER++",timing:"real browser wall clock; no mocked/accelerated time",fullscreenReal:"NOT_RUN",elapsedMs:samples.at(-1).wallMs,errors,samples},null,2));
 console.log("REAL_PLAYBACK_PASS phases="+seen.size+" samples="+samples.length+" elapsedMs="+samples.at(-1).wallMs);
}finally{await context.close();if(video)await rename(await video.path(),resolve(output,"workbench-derplus.webm"));await browser.close();}
