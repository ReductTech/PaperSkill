import test from 'node:test';
import assert from 'node:assert/strict';
import { augmentationMotion, AUG_REGIONS, AUG_SOURCE, AUG_DESTINATION, AUG_ROTATION_DEG } from '../src/modules/augmentation-motion.ts';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('all selected regions stay within the original and preserve its aspect ratio',()=>{
 for(const view of ['center','flip','rotate'])for(let clip=0;clip<4;clip++)for(let i=0;i<=100;i++){
  const s=augmentationMotion(clip,i/100,view),r=s.selected;
  assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=320&&r.y+r.h<=190);
  near(r.w/r.h,320/190);near(s.moving.w/s.moving.h,320/190);
 }
});

test('copy departs from the exact original pixels, then lands in the fixed training window',()=>{
 for(const clip of [0,2]){
  const first=augmentationMotion(clip,.33,'center'),last=augmentationMotion(clip,.83,'center');
  const r=first.finalRegion,scale=AUG_SOURCE.w/320;
  for(const [x,y] of [[181,44],[144,101],[163,153]]){
   near(first.moving.x+(x-r.x)/r.w*first.moving.w,AUG_SOURCE.x+x*scale);
   near(first.moving.y+(y-r.y)/r.h*first.moving.h,AUG_SOURCE.y+y*scale);
  }
  for(const k of ['x','y','w','h'])near(last.moving[k],AUG_DESTINATION[k]);
  assert.equal(last.landed,1);
 }
});

test('future crop is derived from the retained original, and flip restores its full field first',()=>{
 assert.deepEqual(augmentationMotion(2,1,'center').finalRegion,AUG_REGIONS.center);
 const ready=augmentationMotion(2,.30,'flip');
 assert.deepEqual(ready.baseRegion,AUG_REGIONS.original);
 assert.equal(ready.flip,0);
 assert.equal(augmentationMotion(2,.84,'flip').flip,1);
});

test('history freezes only after the copied output and remains fixed through future views',()=>{
 assert.equal(augmentationMotion(0,1,'center').freeze,0);
 assert.equal(augmentationMotion(1,.15,'center').freezeCopy,0);
 assert.equal(augmentationMotion(1,.82,'center').freeze,1);
 for(const view of ['center','flip','rotate'])for(const clip of [2,3])for(const p of [0,.25,.5,.75,1]){
  assert.equal(augmentationMotion(clip,p,view).freeze,1);
 }
});

test('rotation turns 25 degrees before adjusting the crop; final viewport has no empty corners',()=>{
 assert.equal(AUG_ROTATION_DEG,25);
 const turned=augmentationMotion(2,.65,'rotate'),final=augmentationMotion(2,1,'rotate');
 assert.equal(turned.rotationDeg,25);assert.equal(turned.rotationScale,1);
 assert.equal(final.rotationDeg,25);assert.ok(final.rotationScale>1);
 const a=25*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 for(const x of [-160,160])for(const y of [-95,95]){
  const u=(c*(x-final.rotationOffsetX)+s*y)/final.rotationScale;
  const v=(-s*(x-final.rotationOffsetX)+c*y)/final.rotationScale;
  assert.ok(Math.abs(u)<=160+1e-8&&Math.abs(v)<=95+1e-8,'Every output corner samples inside the source');
 }
 const beak={x:251-160,y:45-95};
 const bx=160+final.rotationOffsetX+final.rotationScale*(c*beak.x-s*beak.y);
 const by=95+final.rotationScale*(s*beak.x+c*beak.y);
 assert.ok(bx>0&&bx<320&&by>0&&by<190,'Final pan keeps the distinctive beak inside the image');
});
