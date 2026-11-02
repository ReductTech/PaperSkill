import {binaryKL,squaredCoordinate,coordinateStep} from "../src/modules/formula-model.ts";
export async function formulaLessonChecks({page,base,check,shot}){
 const near=(a,b,label)=>check(Math.abs(a-b)<1e-7,label+": "+a+" / "+b);
 const setRange=async(locator,value)=>locator.fill(String(value));
 await page.emulateMedia({reducedMotion:"no-preference"});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 check(await page.locator("[data-reading-unit],.formula-lesson,.lesson-reading,.formula-spot").count()===0,"Mainline no longer opens with a separate formula lecture");
 const klBoard=page.locator(".der-u2"),klFormula=klBoard.locator(".kl-explanation .equation math").first();
 check(await klFormula.isVisible()&&(await klFormula.getAttribute("aria-label")).includes("KL 散度"),"KL definition is visible beside its matching calculation scene");
 check((await klBoard.locator(".kl-explanation").innerText()).includes("p = softmax(z) 固定"),"KL variables and their fixed/current roles are explained in the mainline");
 await klBoard.locator(".math-derivation").first().locator("summary").click();
 check((await klBoard.locator(".math-derivation").first().innerText()).includes("H(p) 不随 q 改变"),"Cross-entropy decomposition stays in the mainline");
 check(await klBoard.locator(".der-math-reading").innerText().then(text=>text.includes("共同平移")),"KL hands off the information loss question to logits");
 await shot("kl-mainline",".der-u2");
 const klProgress=await klBoard.getAttribute("data-progress");
 await klBoard.locator(".der-reference-links .text-button").first().click();
 const reference=page.locator(".reference-dialog"),klDetail=reference.locator("[data-reference-detail=kl]"),kl=klDetail.locator("[data-math-explorer=kl]"),point=kl.locator("[data-plot-x]");
 check(await kl.isVisible(),"KL deep proof and interactive curve are available from the existing Reference entry");
 for(const q of [.02,.6,.8,.98]){
  await setRange(kl.locator("input[type=range]"),q);const r=binaryKL(.8,q);
  near(+(await point.getAttribute("data-plot-x")),q,"Reference slider and plotted probability agree");
  near(+(await point.getAttribute("data-plot-y")),r.kl,"Reference curve matches the KL model");
  near(+(await point.getAttribute("data-plot-slope")),r.slope,"Reference tangent uses the constrained derivative");
  check(Math.abs(+(await kl.locator(".explorer-readout span").nth(0).locator("strong").innerText())-r.kl)<=.00051,"Reference KL readout is rounded from the model");
 }
 await shot("kl-reference","[data-math-explorer=kl]");
 await kl.getByRole("button",{name:"令 q=p"}).click();near(+(await point.getAttribute("data-plot-y")),0,"Equal distributions reset exactly to zero");
 await kl.getByRole("button",{name:"隐藏反向散度"}).click();check(await kl.locator(".explorer-reverse").count()===0,"Reference reverse curve can be hidden independently");
 await kl.getByRole("button",{name:"显示反向散度"}).click();check(await kl.locator(".explorer-reverse").count()===1,"Reference reverse curve can be restored");
 await setRange(kl.locator("input[type=range]"),.6);await kl.locator("input").focus();await page.keyboard.press("ArrowRight");near(+(await point.getAttribute("data-plot-x")),.61,"Reference probability slider works by keyboard");
 check(klProgress===await klBoard.getAttribute("data-progress"),"Reference math controls do not advance the mechanism animation");
 await reference.getByRole("button",{name:"关闭参考资料"}).click();

 await page.getByRole("button",{name:"分数空间 · 平方差",exact:true}).click();
 const score=page.locator(".der-u2"),scoreFormula=score.locator(".squared-explanation .equation math").first();
 check(await scoreFormula.isVisible()&&(await scoreFormula.getAttribute("aria-label")).includes("平方欧氏距离"),"Squared logit-matching definition is visible beside the score scene");
 check((await score.locator(".squared-explanation").innerText()).includes("历史 z 为常量"),"Current and frozen logits are identified in the mainline");
 await score.locator("[data-response-case=shifted]").click();await page.clock.runFor(1600);
 check((await score.locator(".der-lab-results").innerText()).includes("平方距离为 3"),"Common-shift comparison keeps its correct probability and squared-distance values");
 await shot("logit-mainline",".der-u2");
 await score.locator(".der-reference-links .text-button").last().click();
 const squared=reference.locator("[data-reference-detail=squared]"),square=squared.locator("[data-math-explorer=square]"),sp=square.locator("[data-plot-x]");
 check(await square.isVisible(),"Single-coordinate curve and gradient details are available from the squared-distance Reference entry");
 for(const delta of [-2,-1,0,2]){
  await setRange(square.locator("input[type=range]"),delta);const r=squaredCoordinate(delta);
  near(+(await sp.getAttribute("data-plot-y")),r.loss,"Reference parabola matches squared-distance model");near(+(await sp.getAttribute("data-plot-slope")),r.slope,"Reference tangent matches output gradient");
 }
 await setRange(square.locator("input[type=range]"),-1);await square.getByRole("button",{name:"沿负梯度走一步"}).click();near(+(await sp.getAttribute("data-plot-x")),coordinateStep(-1),"Interactive scalar step reaches its computed negative-gradient update");
 await shot("logit-reference","[data-math-explorer=square]");
 await reference.getByRole("button",{name:"关闭参考资料"}).click();

 const reservoir=page.locator("[data-scene=reservoir]"),derStep=page.locator("[data-scene=der-step]");
 check(await reservoir.locator("[data-reading-unit]").count()===0,"Reservoir opens on its mechanism rather than a separate formula lesson");
 const reservoirRule=await reservoir.locator(".rv-inline-rule").innerText();
 check(reservoirRule.includes("Uniform")&&reservoirRule.includes("N ← N + 1"),"Reservoir keeps its concise rule beside the mechanism");
 check(await derStep.locator("[data-reading-unit]").count()===0,"DER single-step opens on its mechanism rather than a separate formula lesson");
 check((await derStep.locator(".ds-total-formula").textContent()).includes("LDER"),"DER keeps the joint objective beside the shared network");
 const augmentation=page.locator("[data-scene=augmentation]");
 check(await augmentation.locator("[data-reading-unit]").count()===0,"Augmentation opens on the shared-image mechanism rather than a separate formula lesson");
 check((await augmentation.locator(".aug2-formula").last().textContent()).includes("Ldark"),"Augmentation keeps the concise matching rule beside its outputs");
 const derPlus=page.locator("[data-scene=der-plus]");
 check(await derPlus.locator("[data-reading-unit]").count()===0,"DER++ opens on the conflict and shared-update mechanism, not a separate formula lesson");
 check((await derPlus.locator("[data-total-formula]").textContent()).includes("Lcurrent + α Ldark + β Lreplay-CE"),"DER++ keeps its three-term objective beside the single update");
 check(await page.locator("[data-scene=lifecycle] [data-reading-unit]").count()===0,"D1 has no duplicated formula lecture");
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto(base);
 check(await page.locator(".der-u2 .kl-explanation math").first().isVisible(),"Mainline formulas remain visible with reduced motion");
 await page.locator(".der-u2 .der-reference-links .text-button").first().click();
 await setRange(page.locator("#reference-kl-q"),.4);near(+(await page.locator("[data-math-explorer=kl] [data-plot-x]").getAttribute("data-plot-x")),.4,"Manual Reference math remains available with reduced motion");
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Mainline and Reference math introduce no page overflow");
 await page.emulateMedia({reducedMotion:"no-preference"});
}
