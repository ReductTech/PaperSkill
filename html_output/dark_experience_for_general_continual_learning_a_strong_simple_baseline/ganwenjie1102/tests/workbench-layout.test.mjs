import {WORKBENCH_CLIPS} from "../src/modules/training-model.ts";
import assert from "node:assert/strict";import {createRequire} from "node:module";import {mkdir} from "node:fs/promises";import {resolve} from "node:path";
const require=createRequire(new URL("../../../../../reusable-kit/demo/package.json",import.meta.url)),{chromium}=require("playwright");
const output=resolve(process.env.DER_REVIEW_DIR||".visual-qa/der-w8-layout");await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE||"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"});let count=0;
try{for(const [width,height] of [[1440,900],[1920,1080]]){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();
 await page.clock.install();await page.clock.pauseAt(new Date());await page.goto((process.env.DER_PREVIEW_URL||"http://127.0.0.1:5195/")+"?focus=workbench");const scene=page.locator("[data-scene=workbench]");await scene.locator("button[data-mode='DER++']").click();
 for(const clip of [14,19,20])for(const p of [.25,.5,.75,.97]){
  await scene.locator("select").selectOption(String(clip));await scene.locator("[data-play]").click();await page.clock.runFor(32);await page.clock.fastForward(WORKBENCH_CLIPS[clip].durationMs*p);await scene.locator("[data-play]").click();
  const collisions=await scene.evaluate(el=>{
   const label=el.querySelector("[data-transition-note]").getBoundingClientRect(),model=el.querySelector("[data-network]").getBoundingClientRect();
   const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2;
   return [...el.querySelectorAll("[data-training-record]")].filter(n=>+getComputedStyle(n).opacity>.05).flatMap(n=>{const r=n.getBoundingClientRect();return [...(overlap(r,label)?["caption"]:[]),...(overlap(r,model)?["network"]:[])];});
  });assert.deepEqual(collisions,[],"Writing/rejecting records must not cover captions or the network");count++;
  if(p===.5)await scene.screenshot({path:resolve(output,"workbench-layout-"+clip+"-"+width+".png")});
 }
 await context.close();console.log("WORKBENCH_LAYOUT_PASS "+width+"x"+height);
}console.log("WORKBENCH_LAYOUT_ASSERTIONS="+count);}finally{await browser.close();}
