// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything that keeps running is registered on the per-mount `scope` so switching
// chapters tears the loop down instead of leaking one per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS4(scope: Scope) {
  var qp = new URLSearchParams(location.search);
  var hoverParam = window.__PART || qp.get('part');
  var frozenParam = (window.__FREEZE != null)
    ? Math.max(0, Math.min(1, window.__FREEZE / 100))
    : (qp.has('freeze') ? Math.max(0, Math.min(1, parseFloat(qp.get('freeze')) / 100)) : null);
  var play4 = document.getElementById('play4');
  if(play4){
    var D4 = 9600;
    var chips4 = play4.querySelectorAll('.f4c');
    var up4a = document.getElementById('f4up');
    var up4b = document.getElementById('f4up2');
    var jd4 = play4.querySelector('.jd4');
    var jd4s = document.getElementById('jd4s');
    var rs4 = play4.querySelector('.rs4');
    var cols4 = play4.querySelectorAll('.g4c');
    var bars4 = play4.querySelectorAll('.g4-b');
    var ce4 = play4.querySelector('.ce4');
    var cef4 = play4.querySelectorAll('.ce4-f');
    var t4 = 0, last4 = 0, raf4 = 0, run4 = false, froz4 = null;
    var bt4 = [[3250,3450,3720],[3750,3950,4220],[4250,4450,4720]];

    function st4(t){
      function on(el, cond){ if(el){ el.classList.toggle('on', !!cond); } }
      var live = t < 8850;
      on(chips4[0], live && t > 300);
      on(chips4[1], live && t > 550);
      on(chips4[2], live && t > 800);
      on(up4a, live && t > 1100);
      on(jd4, live && t > 1350);
      on(jd4s, live && t > 1900);
      on(up4b, live && t > 2350);
      on(rs4, live && t > 2550);
      on(cols4[0], live && t > 3150);
      on(cols4[1], live && t > 3650);
      on(cols4[2], live && t > 4150);
      for(var i = 0; i < bars4.length; i++){
        on(bars4[i], live && t > bt4[Math.floor(i / 3)][i % 3]);
      }
      on(ce4, live && t > 5200);
      on(cef4[0], live && t > 5500);
      on(cef4[1], live && t > 5750);
      on(cef4[2], live && t > 6000);
    }
    function frame4(now){
      var t = (now - t4) % D4;
      last4 = t;
      st4(t);
      raf4 = scope.raf(frame4);
    }
    function start4(){
      if(run4){ return; }
      run4 = true;
      t4 = performance.now() - last4;
      raf4 = scope.raf(frame4);
    }
    function stop4(){
      run4 = false;
      if(raf4){ raf4 = 0; }
    }

    if(frozenParam !== null){
      last4 = frozenParam * D4;
      play4.classList.add('is-shot');
      st4(last4);
    } else {
      if('IntersectionObserver' in window){
        var io4 = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if(en.isIntersecting){ start4(); } else { stop4(); }
          });
        }, {threshold: 0.25});
        io4.observe(play4);
      } else { start4(); }
      play4.addEventListener('mouseenter', function(){ froz4 = last4; stop4(); });
      play4.addEventListener('mouseleave', function(){ if(froz4 !== null){ last4 = froz4; froz4 = null; } start4(); });
    }

    var HOV4 = {
      samp: { t: '抽样 · 25,430 对',
              k1: '是什么', v1: 'Specify 按 discourse marker 分层抽 10,000 对，让高频标记词不霸占样本；Address 与 Broaden 数量本来就不多，全取。',
              k2: '干什么', v2: '先保证每个动作都有自己的样本量，再让判官去砍 —— 而不是先砍再发现某个动作已经没剩几条。' },
      jd: { t: '判官 · 两个提示词 AND',
            k1: '是什么', v1: '每类从 4–6 个提示词变体里，按在 100 对人工标签上的一致度挑出 2 个；只有两个都接受才保留。',
            k2: '干什么', v2: 'Address 要 query 陈述问题、gold 直接回应；Broaden / Specify 要两句同主题、方向不能反、同层级就丢。' },
      rs: { t: '银集 · 17,579 条',
            k1: '是什么', v1: '7,327 Specify / 9,668 Address / 584 Broaden，通过率 69%。被拒的对不当 query，但它们的 gold 句仍留在池里当干扰。',
            k2: '干什么', v2: '主实验都在这 17,579 条上跑；未过滤的全量测试集只做对照。' },
      gS: { t: 'Specify · 26.7 → 46.7 → 55.1',
            k1: '是什么', v1: '基线 26.7，微调 46.7（×1.7），GPT-5-mini 重排 top-100 后 55.1。一阶段 gold 进 top-100 的比例 80.8%。',
            k2: '干什么', v2: '重排还有余量，因为八成 query 的 gold 至少被召回到了 —— 这是三个动作里条件最好的一个。' },
      gA: { t: 'Address · 10.2 → 24.5 → 37.7',
            k1: '是什么', v1: '基线 10.2，微调 24.5（×2.4，倍数最高），重排后 37.7。但 gold 进 top-10 的只有 40.0%。',
            k2: '干什么', v2: '增益最大、绝对值仍然最低 —— 「回应问题」这件事，句向量里几乎没有可用的表面线索。' },
      gB: { t: 'Broaden · 17.3 → 27.3 → 28.2',
            k1: '是什么', v1: '基线 17.3，微调 27.3（×1.6），重排只加到 28.2（+0.9）。一阶段召回仅 57.2%，gold 进 top-10 的 41.4%。',
            k2: '干什么', v2: '重排几乎无效不是重排弱，是可捡的东西太少：近四成 query 的 gold 连 top-100 都没进。' },
      ce: { t: '天花板 · 一阶段召回',
            k1: '是什么', v1: '在召回成功的那些 query 里，重排把 gold 放进 top-10 的比例是 86.6% / 85.1% / 71.6%。',
            k2: '干什么', v2: '重排本身很准，但它只能在 top-100 里挑。召回这一层不提，后段再优化都是白做。' }
    };
    var hC4 = document.getElementById('hoverCard4');
    var h4T = document.getElementById('h4T');
    var h4K1 = document.getElementById('h4K1');
    var h4V1 = document.getElementById('h4V1');
    var h4K2 = document.getElementById('h4K2');
    var h4V2 = document.getElementById('h4V2');
    function hide4(){ if(hC4){ hC4.classList.remove('on'); } }
    function show4(key){
      var d = HOV4[key];
      if(!d || !hC4){ hide4(); return; }
      h4T.textContent = d.t;
      h4K1.textContent = d.k1; h4V1.textContent = d.v1;
      h4K2.textContent = d.k2; h4V2.textContent = d.v2;
      hC4.classList.toggle('warn', !!d.warn);
      hC4.classList.add('on');
    }
    play4.addEventListener('mouseover', function(e){
      var el = e.target && e.target.closest ? e.target.closest('[data-part4]') : null;
      if(el){ show4(el.getAttribute('data-part4')); }
    });
    play4.addEventListener('mouseleave', function(){ hide4(); });
    if(hoverParam && HOV4[hoverParam]){ show4(hoverParam); }
  }

}
