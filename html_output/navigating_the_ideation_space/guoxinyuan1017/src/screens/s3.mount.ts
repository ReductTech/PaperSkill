// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything is registered on the per-mount `scope` so switching chapters tears the
// animation loop down instead of leaking one loop per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS3(scope: Scope) {
  const byId = (id: string): any => document.getElementById(id);
    var pipe = byId('pipe');
    var card3 = byId('hoverCard3');
    var hT = byId('h3T'), hK1 = byId('h3K1'), hV1 = byId('h3V1');
    var hK2 = byId('h3K2'), hV2 = byId('h3V2');
    var hSvg = byId('h3Svg');
    var D3 = 8000, t30 = 0, last3 = 0, froz3 = null, run3 = false, did3 = false;
    var GATES = pipe.querySelectorAll('.gate');
    var PAIRS = pipe.querySelectorAll('.ppair');
    var BARS = pipe.querySelectorAll('.pgbar i');
    var NEGI = pipe.querySelector('.pneg:not(.is-hard)');
    var NEGII = pipe.querySelector('.pneg.is-hard');
    var SEADOTS = pipe.querySelectorAll('.pdots i');

    function b3(t, a, b){ return Math.max(0, Math.min(1, (t - a) / (b - a))); }
    function ease3(u){ return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

    function render3(t){
      Array.prototype.forEach.call(SEADOTS, function(d, i){
        d.style.opacity = String(.3 + .45 * Math.max(0, Math.sin(((t * 2 + i * .13) % 1) * Math.PI)));
      });
      Array.prototype.forEach.call(GATES, function(g, i){
        g.classList.toggle('on', t >= .10 + i * .08);
      });
      Array.prototype.forEach.call(PAIRS, function(p, i){
        var u = b3(t, .34 + i * .03, .42 + i * .03);
        p.style.opacity = String(u);
        p.style.transform = 'translateY(' + ((1 - ease3(u)) * 6) + 'px)';
      });
      Array.prototype.forEach.call(BARS, function(bar, i){
        bar.style.transform = 'scaleX(' + ease3(b3(t, .46 + i * .05, .60 + i * .05)) + ')';
      });
      NEGI.classList.toggle('hot', t >= .62 && t < .72);
      NEGII.classList.toggle('hot', t >= .72 && t < .86);
    }

    function loop3(now){
      if(run3){
        var t;
        if(froz3 !== null){ t = froz3; }
        else { t = ((now - t30) % D3) / D3; last3 = t; }
        render3(t);
      }
      scope.raf(loop3);
    }
    function begin3(){
      if(did3){ return; }
      did3 = true; run3 = true;
      t30 = performance.now();
    }
    if('IntersectionObserver' in window){
      var io3 = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ begin3(); } });
      }, {threshold: .32});
      io3.observe(pipe);
    } else { begin3(); }
    scope.raf(loop3);
    scope.on(window, 'resize', function(){});
    pipe.addEventListener('mouseenter', function(){ if(run3){ froz3 = last3; } });
    pipe.addEventListener('mouseleave', function(){
      if(froz3 === null){ return; }
      t30 = performance.now() - froz3 * D3;
      froz3 = null;
    });

    var C3 = {
      sea: { t: '论文海', k1: '是什么', v1: 'arXiv 259,340 篇（1993–2024，cs.AI / LG / CV / CL）。', k2: '干什么', v2: '全部训练对都从这里筛出来。' },
      gates: { t: '三道闸', k1: '是什么', v1: '5 年出版窗口 + 直接引用 + （文献耦合 ≥10 或共引 ≥10）。', k2: '注意', v2: '≥10 两个阈值是手调的，没做敏感性分析——而候选对的口径直接决定训练集构成。', warn: true },
      g5: { t: '5 年窗口', k1: '是什么', v1: '只从相近年份的论文之间挖关系。', k2: '说明', v2: '会系统性丢掉长程引用（2005 年的经典被 2024 年论文引用），作者未讨论这个截断。' },
      gcite: { t: '直接引用', k1: '是什么', v1: '两篇论文之间要有明确的引用边。', k2: '干什么', v2: '保证候选对之间真的有关系，而不是随缘配对。' },
      g10: { t: '≥10 阈值', k1: '是什么', v1: '文献耦合（共享 ≥10 篇参考文献）或共引（被 ≥10 次成对引用）。', k2: '注意', v2: '两个阈值都是手调的，没有敏感性分析；和 07158 的 ≥3 / 500 / 200 是同一类问题。', warn: true },
      pairs: { t: '候选对', k1: '是什么', v1: '通过三道闸的论文对。', k2: '干什么', v2: '后面所有训练信号都从这些对里来。' },
      subs: { t: '三张子图', k1: '是什么', v1: 'G_problem / G_method / G_findings，按维度给论文对分类。', k2: '注意', v2: '跨维度可多标签；三维都不沾的对标 [Irrelevant] 丢弃。' },
      inbatch: { t: 'in-batch 负例', k1: '是什么', v1: '同批内、与锚点无引用 / 共引 / 耦合关系的论文。', k2: '干什么', v2: '保证负例与锚点结构独立。' },
      hard: { t: '硬概念负例', k1: '是什么', v1: '某一维高分、另一维低分的论文对。', k2: '干什么', v2: '专治「跨维度混淆」—— 全文少数值得抄的设计。', svg: true }
    };
    function hide3(){ if(card3){ card3.classList.remove('on'); } }
    function show3(d){
      if(!d || !hT){ hide3(); return; }
      hT.textContent = d.t;
      hK1.textContent = d.k1; hV1.textContent = d.v1;
      hK2.textContent = d.k2; hV2.textContent = d.v2;
      card3.classList.toggle('warn', !!d.warn);
      if(hSvg){ hSvg.hidden = !d.svg; }
      card3.classList.add('on');
    }
    function pick3(node){
      if(!node || !node.closest){ hide3(); return; }
      var el = node.closest('[data-part3]');
      if(el){ show3(C3[el.getAttribute('data-part3')]); return; }
      hide3();
    }
    pipe.addEventListener('mouseover', function(e){ pick3(e.target); });
    pipe.addEventListener('mouseleave', function(){ hide3(); });
}
