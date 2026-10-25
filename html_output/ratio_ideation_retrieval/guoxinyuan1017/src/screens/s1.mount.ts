// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything that keeps running is registered on the per-mount `scope` so switching
// chapters tears the loop down instead of leaking one per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS1(scope: Scope) {
  var qp = new URLSearchParams(location.search);
  var hoverParam = window.__PART || qp.get('part');
  var frozenParam = (window.__FREEZE != null)
    ? Math.max(0, Math.min(1, window.__FREEZE / 100))
    : (qp.has('freeze') ? Math.max(0, Math.min(1, parseFloat(qp.get('freeze')) / 100)) : null);
  var play1 = document.getElementById('play1');
  if(play1){
    var D1 = 8000;
    var nQ = document.getElementById('n1-q');
    var nA = document.getElementById('n1-a');
    var nB = document.getElementById('n1-b');
    var nS = document.getElementById('n1-s');
    var lU = document.getElementById('l1-up');
    var lD = document.getElementById('l1-dn');
    var lR = document.getElementById('l1-rt');
    var c1s = play1.querySelectorAll('#cands1 .cand');
    var t1 = 0, last1 = 0, raf1 = 0, run1 = false, froz1 = null;

    function st1(t){
      function on(el, cond){ if(el){ el.classList.toggle('on', cond); } }
      var live = t > 200 && t < 7300;
      on(nQ, live);
      on(c1s[0], t > 1100 && t < 7300);
      on(nA, t > 1100 && t < 7300);
      on(lR, t > 1100 && t < 7300);
      on(c1s[1], t > 2200 && t < 7300);
      on(nB, t > 2200 && t < 7300);
      on(lU, t > 2200 && t < 7300);
      on(c1s[2], t > 3300 && t < 7300);
      on(nS, t > 3300 && t < 7300);
      on(lD, t > 3300 && t < 7300);
      on(c1s[3], t > 4400 && t < 7300);
    }
    function frame1(now){
      var t = (now - t1) % D1;
      last1 = t;
      st1(t);
      raf1 = scope.raf(frame1);
    }
    function start1(){
      if(run1){ return; }
      run1 = true;
      t1 = performance.now() - last1;
      raf1 = scope.raf(frame1);
    }
    function stop1(){
      run1 = false;
      if(raf1){ raf1 = 0; }
    }

    if(frozenParam !== null){
      last1 = frozenParam * D1;
      play1.classList.add('is-shot');
      st1(last1);
    } else {
      if('IntersectionObserver' in window){
        var io1 = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if(en.isIntersecting){ start1(); } else { stop1(); }
          });
        }, {threshold: 0.25});
        io1.observe(play1);
      } else { start1(); }
      play1.addEventListener('mouseenter', function(){ froz1 = last1; stop1(); });
      play1.addEventListener('mouseleave', function(){ if(froz1 !== null){ last1 = froz1; froz1 = null; } start1(); });
    }

    var HOV1 = {
      q: { t: '查询句 q · 任务的输入',
           k1: '是什么', v1: '一句科学陈述：可以是一个问题、主张、观察、方法或方法学目标。',
           k2: '干什么', v2: '配上动作 r 之后，系统要在这个 404K 句子的共享池里排出 top-k —— 同一句 q 配不同 r，正确答案完全不同。' },
      a: { t: 'Address · 应对通道',
           k1: '是什么', v1: 'q 提出一个问题，c 是能帮它解决的方法或洞见。典型标记词：to address this issue。',
           k2: '干什么', v2: '功能性的回应，与抽象层级无关 —— 这是它和另外两个动作最本质的差别。' },
      b: { t: 'Broaden · 向上通道',
           k1: '是什么', v1: 'c 把 q 改写成更一般的表述，使 q 成为 c 的一个特例。典型标记词：more generally。',
           k2: '干什么', v2: '沿抽象层级上移一步。判定时要求两句同主题，且方向不能反 —— 同层级或反向下移都会被判官拒掉。' },
      s: { t: 'Specify · 向下通道',
           k1: '是什么', v1: 'c 用具体案例、机制或示例把 q 落实。典型标记词：for example / even more specifically。',
           k2: '干什么', v2: '沿抽象层级下移一步。它与 Broaden 是同一根轴上的相反运动，这决定了二者不能互换。' },
      d: { t: '干扰句 · 主题相关但动作不成立', warn: true,
           k1: '现状', v1: '它谈的正是 RLHF 与奖励模型，主题相似度很高，但既不回应 q 的问题，也不提供更一般或更具体的表述。',
           k2: '后果', v2: '若候选池按动作分开，这类句子永远不必被排除；共享池逼着系统学会拒绝它 —— 否则它在每个动作下都会靠主题相似混进 top-10。' }
    };
    var hC1 = document.getElementById('hoverCard1');
    var h1T = document.getElementById('h1T');
    var h1K1 = document.getElementById('h1K1');
    var h1V1 = document.getElementById('h1V1');
    var h1K2 = document.getElementById('h1K2');
    var h1V2 = document.getElementById('h1V2');
    function hide1(){ if(hC1){ hC1.classList.remove('on'); } }
    function show1(key){
      var d = HOV1[key];
      if(!d || !hC1){ hide1(); return; }
      h1T.textContent = d.t;
      h1K1.textContent = d.k1; h1V1.textContent = d.v1;
      h1K2.textContent = d.k2; h1V2.textContent = d.v2;
      hC1.classList.toggle('warn', !!d.warn);
      hC1.classList.add('on');
    }
    play1.addEventListener('mouseover', function(e){
      var el = e.target && e.target.closest ? e.target.closest('[data-part1]') : null;
      if(el){ show1(el.getAttribute('data-part1')); }
    });
    play1.addEventListener('mouseleave', function(){ hide1(); });
    if(hoverParam && HOV1[hoverParam]){ show1(hoverParam); }
  }

}
