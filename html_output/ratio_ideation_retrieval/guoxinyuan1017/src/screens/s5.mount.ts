// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything that keeps running is registered on the per-mount `scope` so switching
// chapters tears the loop down instead of leaking one per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS5(scope: Scope) {
  var qp = new URLSearchParams(location.search);
  var hoverParam = window.__PART || qp.get('part');
  var frozenParam = (window.__FREEZE != null)
    ? Math.max(0, Math.min(1, window.__FREEZE / 100))
    : (qp.has('freeze') ? Math.max(0, Math.min(1, parseFloat(qp.get('freeze')) / 100)) : null);
  var play5 = document.getElementById('play5');
  if(play5){
    var D5 = 9000;
    var lstA = play5.querySelector('[data-part5="la"]');
    var lstB = play5.querySelector('[data-part5="lb"]');
    var cA = lstA ? lstA.querySelectorAll('.c5') : [];
    var cB = lstB ? lstB.querySelectorAll('.c5') : [];
    var vote5 = play5.querySelector('.vote5');
    var vbars5 = play5.querySelectorAll('.vbar5 i');
    var vlab5 = play5.querySelector('.vlab5');
    var led5 = play5.querySelector('.led5');
    var lf5 = play5.querySelectorAll('.led5-f');
    var cross5 = play5.querySelector('.cross5');
    var t5 = 0, last5 = 0, raf5 = 0, run5 = false, froz5 = null;

    function st5(t){
      function on(el, cond){ if(el){ el.classList.toggle('on', !!cond); } }
      var live = t < 8250;
      on(lstA, live && t > 300);
      for(var i = 0; i < cA.length; i++){ on(cA[i], live && t > 560 + i * 55); }
      on(lstB, live && t > 1250);
      for(var j = 0; j < cB.length; j++){ on(cB[j], live && t > 1480 + j * 55); }
      on(vote5, live && t > 2250);
      on(vbars5[0], live && t > 2500);
      on(vbars5[1], live && t > 2650);
      on(vbars5[2], live && t > 2800);
      on(vlab5, live && t > 2950);
      on(led5, live && t > 3450);
      on(lf5[0], live && t > 3700);
      on(lf5[1], live && t > 4150);
      on(cross5, live && t > 5000);
    }
    function frame5(now){
      var t = (now - t5) % D5;
      last5 = t;
      st5(t);
      raf5 = scope.raf(frame5);
    }
    function start5(){
      if(run5){ return; }
      run5 = true;
      t5 = performance.now() - last5;
      raf5 = scope.raf(frame5);
    }
    function stop5(){
      run5 = false;
      if(raf5){ raf5 = 0; }
    }

    if(frozenParam !== null){
      last5 = frozenParam * D5;
      play5.classList.add('is-shot');
      st5(last5);
    } else {
      if('IntersectionObserver' in window){
        var io5 = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if(en.isIntersecting){ start5(); } else { stop5(); }
          });
        }, {threshold: 0.25});
        io5.observe(play5);
      } else { start5(); }
      play5.addEventListener('mouseenter', function(){ froz5 = last5; stop5(); });
      play5.addEventListener('mouseleave', function(){ if(froz5 !== null){ last5 = froz5; froz5 = null; } start5(); });
    }

    var HOV5 = {
      proto: { t: '盲评怎么做的',
               k1: '是什么', v1: '5 名 CS 研究生，各至少一篇论文，按子领域分到 125 条 query（39/40/46），每人 18–33 条，累计三十余小时；先看指南和示例，再独立标注。',
               k2: '干什么', v2: '对条件盲：同一 query 的微调前后 top-10 并排成 A / B、顺序打乱。逐条判有用，再选更想用的一张，允许平局。' },
      la: { t: 'List A · 微调前',
            k1: '是什么', v1: '基线 ModernBERT-embed-large 的 top-10：HR@10 47.6%、P@10 9.6、MRR@10 32.1。格子里深色代表「这条 query 至少捞到一个有用候选」。',
            k2: '干什么', v2: '作为对照的一半。它常常能捞到 1 条相关句，但很少捞到第二条。' },
      lb: { t: 'List B · 微调后',
            k1: '是什么', v1: 'HR@10 81.2%、P@10 18.6、MRR@10 51.7，三项全部 p<.01（配对置换检验）。',
            k2: '干什么', v2: '平均每个列表约两条有用候选 —— 不是把第一条排得更好，是整张列表都变可用了。' },
      vote: { t: '偏好票 · 81 : 15 : 35',
              k1: '是什么', v1: '125 次判断里 81 次选微调、15 次选基线、35 次平局；非平局中 73–91% 选微调。',
              k2: '干什么', v2: '逐动作看：Specify 29:3（10 平）、Address 30:4（7 平）、Broaden 22:8（18 平）—— Broaden 赢得最少，也最难。' },
      led: { t: '两本账 · 27.1 vs 51.7',
              k1: '是什么', v1: '只把 gold 句算作相关时 MRR@10 是 27.1；把标注者标「有用」的候选都算上，是 51.7。',
              k2: '干什么', v2: '金句在微调 top-10 中出现时 96.5% 被标有用，银标站得住；但银标口径系统性地低估了真实检索质量。' },
      cross: { t: '跨论文 · 91.7%',
               k1: '是什么', v1: '64.8% 的 query 在微调 top-10 里有「非金句但有用」的候选（基线 42.0%），其中 91.7% 来自别的论文（基线 81.4%）。',
               k2: '干什么', v2: '180 条这样的候选出自 176 篇不同论文 —— 灵感确实跨出了 query 自己那一篇。' }
    };
    var hC5 = document.getElementById('hoverCard5');
    var h5T = document.getElementById('h5T');
    var h5K1 = document.getElementById('h5K1');
    var h5V1 = document.getElementById('h5V1');
    var h5K2 = document.getElementById('h5K2');
    var h5V2 = document.getElementById('h5V2');
    function hide5(){ if(hC5){ hC5.classList.remove('on'); } }
    function show5(key){
      var d = HOV5[key];
      if(!d || !hC5){ hide5(); return; }
      h5T.textContent = d.t;
      h5K1.textContent = d.k1; h5V1.textContent = d.v1;
      h5K2.textContent = d.k2; h5V2.textContent = d.v2;
      hC5.classList.toggle('warn', !!d.warn);
      hC5.classList.add('on');
    }
    play5.addEventListener('mouseover', function(e){
      var el = e.target && e.target.closest ? e.target.closest('[data-part5]') : null;
      if(el){ show5(el.getAttribute('data-part5')); }
    });
    play5.addEventListener('mouseleave', function(){ hide5(); });
    if(hoverParam && HOV5[hoverParam]){ show5(hoverParam); }
  }
}
