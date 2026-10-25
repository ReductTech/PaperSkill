// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything that keeps running is registered on the per-mount `scope` so switching
// chapters tears the loop down instead of leaking one per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS0(scope: Scope) {
  var qp = new URLSearchParams(location.search);
  var hoverParam = window.__PART || qp.get('part');
  var frozenParam = (window.__FREEZE != null)
    ? Math.max(0, Math.min(1, window.__FREEZE / 100))
    : (qp.has('freeze') ? Math.max(0, Math.min(1, parseFloat(qp.get('freeze')) / 100)) : null);
  var card0 = document.getElementById('s0');
  var play = document.querySelector('.s0-grid > div:nth-child(2)');
  if(card0 && play){
    var DUR = 7200;
    var qEl = document.getElementById('q0');
    var mvA = play.querySelector('.mv-a');
    var mvB = play.querySelector('.mv-b');
    var mvS = play.querySelector('.mv-s');
    var all = [qEl, mvA, mvB, mvS].filter(Boolean);

    var t0 = 0, lastT = 0, frozen = null, raf = 0, running = false;

    function setStates(t){
      qEl && qEl.classList.toggle('on', t > 300 && t < 6500);
      mvA && mvA.classList.toggle('on', t > 900 && t < 6300);
      mvB && mvB.classList.toggle('on', t > 2400 && t < 6300);
      mvS && mvS.classList.toggle('on', t > 3900 && t < 6300);
    }
    function frame(now){
      var t = (now - t0) % DUR;
      lastT = t;
      setStates(t);
      raf = scope.raf(frame);
    }
    function start(){
      if(running){ return; }
      running = true;
      t0 = performance.now() - lastT;
      raf = scope.raf(frame);
    }
    function stop(){
      running = false;
      if(raf){ raf = 0; }
    }

    if(frozenParam !== null){
      lastT = frozenParam * DUR;
      play.classList.add('is-shot');
      setStates(lastT);
    } else {
      if('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if(en.isIntersecting){ start(); } else { stop(); }
          });
        }, {threshold: 0.25});
        io.observe(play);
      } else {
        start();
      }
      play.addEventListener('mouseenter', function(){ frozen = lastT; stop(); });
      play.addEventListener('mouseleave', function(){ if(frozen !== null){ lastT = frozen; frozen = null; } start(); });
    }

    // ---- 悬停弹卡 ----
    var HOV = {
      q: { t: '查询句 · 论文引言的真实例子',
           k1: '是什么', v1: '一位研究者面对的真实问题：RL 训练的 LLM 学会刷奖励（reward hacking）怎么办。',
           k2: '干什么', v2: '同一个问题引出三种不同的灵感来源 —— 这正是三个构思动作存在的理由。' },
      a: { t: 'Address · 应对',
           k1: '是什么', v1: '查询句提出问题，候选句是回应它的方法或洞见。标记词如 to address this issue。',
           k2: '干什么', v2: '功能性的回应：训练对 222,707 个，银标查询 9,668 条 —— 数量第二多的动作。' },
      b: { t: 'Broaden · 抽象',
           k1: '是什么', v1: '候选句把查询句改写成更一般的表述，查询句是它的特例。标记词如 more generally。',
           k2: '干什么', v2: '沿抽象层级向上走一步。但全库只有 15,592 对、银标仅 584 条 —— 最稀缺的动作。' },
      s: { t: 'Specify · 实例',
           k1: '是什么', v1: '候选句把查询句落成具体案例、机制或示例。标记词如 for example。',
           k2: '干什么', v2: '沿抽象层级向下走一步。语料里最自然出现的动作：2,779,177 对，占全库 92%。' }
    };
    var hCard = document.getElementById('hoverCard0');
    var hT = document.getElementById('h0T');
    var hK1 = document.getElementById('h0K1');
    var hV1 = document.getElementById('h0V1');
    var hK2 = document.getElementById('h0K2');
    var hV2 = document.getElementById('h0V2');
    function hideH(){ if(hCard){ hCard.classList.remove('on'); } }
    function showH(key){
      var d = HOV[key];
      if(!d || !hCard){ hideH(); return; }
      hT.textContent = d.t;
      hK1.textContent = d.k1; hV1.textContent = d.v1;
      hK2.textContent = d.k2; hV2.textContent = d.v2;
      hCard.classList.add('on');
    }
    var hoverParam = window.__PART || qp.get('part');
    card0.addEventListener('mouseover', function(e){
      var el = e.target && e.target.closest ? e.target.closest('[data-part0]') : null;
      if(el){ showH(el.getAttribute('data-part0')); }
    });
    card0.addEventListener('mouseout', function(e){
      var el = e.target && e.target.closest ? e.target.closest('[data-part0]') : null;
      if(el){ hideH(); }
    });
    if(hoverParam && HOV[hoverParam]){
      showH(hoverParam);
    }
  }

}
