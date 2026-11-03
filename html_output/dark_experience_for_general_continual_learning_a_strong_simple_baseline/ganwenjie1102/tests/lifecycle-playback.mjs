import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {lifecycleSceneAt} from '../src/modules/review/lifecycle-model.ts';
const require=createRequire(new URL('../../../../../reusable-kit/demo/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=resolve(process.env.DER_PLAYBACK_DIR||'.visual-qa/der-w8-playback','lifecycle');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PAPERWORK_PLAYWRIGHT_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1}),errors=[],samples=[],seen=new Set();
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
try {
 await page.goto((process.env.DER_PREVIEW_URL||'http://127.0.0.1:5195/')+'?review=1&focus=lifecycle#lifecycle-player');
 const scene=page.locator('[data-scene=lifecycle]');
 assert.equal(await scene.getAttribute('data-status'),'paused');
 await scene.locator('.lifecycle-start').click();
 const start=Date.now();
 while(Date.now()-start<85000) {
  const s=await scene.evaluate(el=>({clip:+el.dataset.clip,p:+el.dataset.progress,status:el.dataset.status,N:+el.dataset.seen,updates:+el.dataset.updateCount,memory:+el.dataset.memoryCount,z:el.querySelector('[data-record-id="record:x1:i"]')?.getAttribute('data-history-z')}));
  const expected=lifecycleSceneAt(s.clip,s.p);
  assert.equal(s.N,expected.seen);assert.equal(s.updates,expected.updateCount);assert.equal(s.memory,expected.memoryCount);
  if(s.z)assert.equal(s.z,'2,1,0');
  samples.push({wallMs:Date.now()-start,...s});
  if(s.p>.6&&!seen.has(s.clip)){seen.add(s.clip);if([0,2,4,7,8].includes(s.clip))await page.screenshot({path:resolve(output,'phase-'+s.clip+'.png')});}
  if(s.status==='finished')break;
  await page.waitForTimeout(180);
 }
 assert.equal(samples.at(-1).status,'finished');assert.equal(seen.size,9);assert.equal(samples.at(-1).memory,2);assert.equal(samples.at(-1).updates,2);assert.deepEqual(errors,[]);
 await writeFile(resolve(output,'playback.json'),JSON.stringify({browser:browser.version(),timing:'real browser clock; no acceleration',fullscreenReal:'NOT_RUN',phases:seen.size,samples,errors},null,2));
 console.log('LIFECYCLE_REAL_PLAYBACK_PASS phases='+seen.size+' samples='+samples.length+' elapsedMs='+samples.at(-1).wallMs);
} finally {await browser.close();}
