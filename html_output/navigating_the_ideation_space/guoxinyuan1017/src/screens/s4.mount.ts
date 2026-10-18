// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything is registered on the per-mount `scope` so switching chapters tears the
// animation loop down instead of leaking one loop per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS4(scope: Scope) {
  const byId = (id: string): any => document.getElementById(id);
    var play4 = byId('play4');
    var card4 = byId('hoverCard4');
    var h4T = byId('h4T');
    var h4K1 = byId('h4K1'), h4V1 = byId('h4V1');
    var h4K2 = byId('h4K2'), h4V2 = byId('h4V2');
    var h4R3 = byId('h4R3');
    var h4K3 = byId('h4K3'), h4V3 = byId('h4V3');
    var D4 = 9000, t40 = 0, last4 = 0, froz4 = null, run4 = false, did4 = false;
    var QVS = play4.querySelectorAll('.q4-vs i');
    var FORKS = play4.querySelectorAll('.p4-fork path');
    var DBS = play4.querySelectorAll('.db4');
    var HBS = play4.querySelectorAll('.hb4');
    var KEY = play4.querySelectorAll('.ks4-key');

    function b4(t, a, b){ return Math.max(0, Math.min(1, (t - a) / (b - a))); }
    function e4(u){ return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

    function render4(t){
      var fresh = t < .015;
      play4.classList.toggle('is-reset', fresh);
      Array.prototype.forEach.call(QVS, function(v, i){
        v.classList.toggle('on', t >= .02 + i * .03);
      });
      Array.prototype.forEach.call(FORKS, function(f, i){
        f.classList.toggle('on', t >= .10 + i * .05);
      });
      Array.prototype.forEach.call(DBS, function(d, i){
        d.classList.toggle('on', t >= .16 + i * .06);
      });
      Array.prototype.forEach.call(HBS, function(hb, i){
        var on = t >= .38 + i * .07;
        hb.classList.toggle('on', on);
        var bar = hb.querySelector('.hb4-tr i');
        if(bar){
          var w = on ? (hb.getAttribute('data-w') + '%') : '0%';
          bar.style.width = w;
        }
      });
      Array.prototype.forEach.call(KEY, function(k, i){
        k.classList.toggle('on', t >= .76);
      });
    }

    function loop4(now){
      if(run4){
        var t;
        var fz = parseFloat(play4.getAttribute('data-freeze'));
        if(!isNaN(fz)){ t = fz; }
        else if(froz4 !== null){ t = froz4; }
        else { t = ((now - t40) % D4) / D4; last4 = t; }
        render4(t);
      }
      scope.raf(loop4);
    }
    function begin4(){
      if(did4){ return; }
      did4 = true; run4 = true;
      t40 = performance.now();
    }
    if('IntersectionObserver' in window){
      var io4 = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ begin4(); } });
      }, {threshold: .3});
      io4.observe(play4);
    } else { begin4(); }
    scope.raf(loop4);
    setTimeout(begin4, 0);

    play4.addEventListener('mouseenter', function(){ if(run4){ froz4 = last4; } });
    play4.addEventListener('mouseleave', function(){
      if(froz4 === null){ return; }
      t40 = performance.now() - froz4 * D4;
      froz4 = null;
    });

    var C4 = {
      query: {
        t: '查询构造',
        k1: '是什么', v1: '一篇 query 论文，一次抽出 5 个查询向量（3 个维度向量 + 2 个相减得来的跃迁向量）。',
        k2: '注意', v2: '基线吃原始标题 / 摘要，本文吃 Qwen3-8B 抽取的三维文本 —— 输入不对等。缺的对照是：把同一份抽取文本喂给 SPECTER2 / E5，看还能不能拿到同等增益。',
        warn: true
      },
      dbp: {
        t: '问题节点库',
        k1: '是什么', v1: '存放全部论文的 E_problem 向量。',
        k2: '干什么', v2: '按「在解决什么问题」召回，单库 R@30 = 0.300。'
      },
      dbm: {
        t: '方法节点库',
        k1: '是什么', v1: '存放全部论文的 E_method 向量。',
        k2: '干什么', v2: '按「怎么做」召回。案例：query = LongHalQA，按方法维度 top-1 命中 AMBER —— 两者共享「LLM-free 低成本评测管线」，而基线 top-3 全是通用多模态评测框架。基线找的是话题邻居，本文找的是做法邻居。'
      },
      dbf: {
        t: '发现节点库',
        k1: '是什么', v1: '存放全部论文的 E_findings 向量。',
        k2: '干什么', v2: '按「得出了什么」召回，单库 R@30 = 0.304。'
      },
      dbpm: {
        t: 'P2M 跃迁库',
        k1: '是什么', v1: '存放 T_PM = E_method − E_problem。',
        k2: '干什么', v2: '找「问题 → 方法」推理结构相似的论文（不必话题相同），单库 R@30 = 0.168。'
      },
      dbmf: {
        t: 'M2F 跃迁库',
        k1: '是什么', v1: '存放 T_MF = E_findings − E_method。',
        k2: '干什么', v2: '找「方法 → 发现」推理结构相似的论文。这一支的实测见右边那条结果。'
      },
      hbmf: {
        t: 'M2F 的负增益',
        k1: '实测', v1: 'R@30 = 0.148、HR@30 = 0.548。',
        k2: '对照', v2: 'E5-base-v2 是 0.160 / 0.627 —— 两项都低于基线。这一支单独用是负增益，靠 P2M 与融合才拉回来（融合后 0.180 / 0.643）。',
        warn: true
      },
      kx: {
        t: '×3 口径',
        k1: '原文', v1: '表注写着 K values are scaled by 3x —— 显示 K=9 / 30 / 90 对应真实 K=3 / 10 / 30。',
        k2: '后果', v2: '0.329 是 10 篇里的召回，不是 30 篇。论文没解释放大规则，且这个口径与 SciDocs / BEIR / RATIO 都不同，横比会得出错误结论。',
        warn: true
      }
    };
    function hide4(){ if(card4){ card4.classList.remove('on'); } }
    function show4(d){
      if(!d || !h4T){ hide4(); return; }
      h4T.textContent = d.t;
      h4K1.textContent = d.k1; h4V1.textContent = d.v1;
      h4K2.textContent = d.k2; h4V2.textContent = d.v2;
      if(d.k3 && h4R3){ h4K3.textContent = d.k3; h4V3.textContent = d.v3; h4R3.hidden = false; }
      else if(h4R3){ h4R3.hidden = true; }
      card4.classList.toggle('warn', !!d.warn);
      card4.classList.add('on');
    }
    function pick4(node){
      if(!node || !node.closest){ hide4(); return; }
      var el = node.closest('[data-part4]');
      if(el){ show4(C4[el.getAttribute('data-part4')]); return; }
      hide4();
    }
    play4.addEventListener('mouseover', function(e){ pick4(e.target); });
    play4.addEventListener('mouseleave', function(){ hide4(); });
}
