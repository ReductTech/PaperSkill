// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything that keeps running is registered on the per-mount `scope` so switching
// chapters tears the loop down instead of leaking one per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS3(scope: Scope) {
  var qp = new URLSearchParams(location.search);
  var hoverParam = window.__PART || qp.get('part');
  var frozenParam = (window.__FREEZE != null)
    ? Math.max(0, Math.min(1, window.__FREEZE / 100))
    : (qp.has('freeze') ? Math.max(0, Math.min(1, parseFloat(qp.get('freeze')) / 100)) : null);
  var play3 = document.getElementById('play3');
  if(play3){
    var D3 = 9400;
    var g3 = function(sel){ return play3.querySelector(sel); };
    var segTr = g3('.seg3[data-part3="tr"]');
    var segVa = g3('.seg3[data-part3="va"]');
    var segTe = g3('.seg3[data-part3="te"]');
    var iso3 = g3('.iso3');
    var pool3 = g3('.pool3');
    var rows3 = play3.querySelectorAll('.zrow');
    var zS = g3('.zb-s'), zA = g3('.zb-a'), zB = g3('.zb-b');
    var zD1 = g3('.zd-1'), zD2 = g3('.zd-2'), zD3 = g3('.zd-3'), zD4 = g3('.zd-4');
    var traps3 = play3.querySelectorAll('.tr3');
    var t3 = 0, last3 = 0, raf3 = 0, run3 = false, froz3 = null;

    function st3(t){
      function on(el, cond){ if(el){ el.classList.toggle('on', !!cond); } }
      var live = t < 8650;
      on(segTr, live && t > 350);
      on(segVa, live && t > 1000);
      on(segTe, live && t > 1650);
      on(iso3, live && t > 2300);
      on(pool3, live && t > 3000);
      on(rows3[0], live && t > 3900);
      on(zS, live && t > 4300);
      on(zA, live && t > 4620);
      on(zB, live && t > 4940);
      on(rows3[1], live && t > 5350);
      on(zD1, live && t > 5650);
      on(zD2, live && t > 5850);
      on(zD3, live && t > 6050);
      on(zD4, live && t > 6250);
      on(traps3[0], live && t > 6900);
      on(traps3[1], live && t > 7400);
    }
    function frame3(now){
      var t = (now - t3) % D3;
      last3 = t;
      st3(t);
      raf3 = scope.raf(frame3);
    }
    function start3(){
      if(run3){ return; }
      run3 = true;
      t3 = performance.now() - last3;
      raf3 = scope.raf(frame3);
    }
    function stop3(){
      run3 = false;
      if(raf3){ raf3 = 0; }
    }

    if(frozenParam !== null){
      last3 = frozenParam * D3;
      play3.classList.add('is-shot');
      st3(last3);
    } else {
      if('IntersectionObserver' in window){
        var io3 = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if(en.isIntersecting){ start3(); } else { stop3(); }
          });
        }, {threshold: 0.25});
        io3.observe(play3);
      } else { start3(); }
      play3.addEventListener('mouseenter', function(){ froz3 = last3; stop3(); });
      play3.addEventListener('mouseleave', function(){ if(froz3 !== null){ last3 = froz3; froz3 = null; } start3(); });
    }

    var HOV3 = {
      tr: { t: '训练段 · 2,814,807 条查询',
            k1: '是什么', v1: '2015-01-01 至 2025-09-30 发表的论文：13,787,834 个候选句，gold 只占约 20%。',
            k2: '干什么', v2: '微调唯一能用的语料。切分单位是论文而非句子 —— 同段相邻句共享几乎全部上下文，分开就会泄漏。' },
      va: { t: '验证段 · 93,160 条查询',
            k1: '是什么', v1: '2025-10-01 至 12-31，361,172 个候选句。',
            k2: '干什么', v2: '只用来调超参。取一个季度而非整年：2025 年 CS 发文量涨得快，全年验证集会大到没必要。' },
      te: { t: '测试段 · 109,509 条查询',
            k1: '是什么', v1: '2026-01-01 至 05-05，404,371 个候选句；所有被评测模型都在此之前发布。',
            k2: '干什么', v2: '再短就不行 —— Broaden 的测试 gold 只有 1,410 句，窗口一压就不够撑起一个子任务。' },
      iso: { t: '论文级隔离 · 三个月缓冲',
             k1: '是什么', v1: '按论文发表日期切，不按句子切；训练截止到测试开始只隔三个月。',
             k2: '干什么', v2: '一头堵住预训练污染（测试论文更新），另一头压住话题漂移（间隔够短）—— 两个风险方向相反，只能这样折中。' },
      pool: { t: '共享池 · 404,371 句',
              k1: '是什么', v1: '三个动作共用同一个测试池，池子只由该时段的论文构成：gold 109,509 句 + 干扰 294,862 句。',
              k2: '干什么', v2: '检索器不能假设池里全是所请求动作的候选 —— 它必须判断候选是否真的实现了这个动作。' },
      gold: { t: 'gold 句 · 三个动作各一份',
              k1: '是什么', v1: 'Specify 94,079、Address 14,020、Broaden 1,410 —— 同一批论文里三个动作的 gold 差了 67 倍。',
              k2: '干什么', v2: '共享池让它们互为负样本：一句 Specify 的 gold，对 Address 查询就是「主题对、动作不对」的干扰。' },
      dist: { t: '干扰句 · 四类被拒标记词',
              k1: '是什么', v1: '开头是被判为非标记的短语：通用无关（In general / Therefore）218,857、显式对比 63,086、显式相似 12,518、隐式相似 401。',
              k2: '干什么', v2: '和 gold 一样剥掉开头短语，体裁、位置、长度都相似 —— 认首词或认「像论文句」都分不出来。' },
      t1: { t: 'pilot ① 非时间切分', warn: true,
            k1: '现状', v1: '论文报告：按随机方式切、甚至按标记词切，分数都显著更高 —— 与模型在预训练中见过评测文本相符。',
            k2: '后果', v2: '所以切分点定在 2025-09-30 之后。原文只写 substantially higher，没给具体数字。' },
      t2: { t: 'pilot ② 随机句当干扰', warn: true,
            k1: '现状', v1: '拿语料里的随机句填充池子，负样本几乎都与查询无关，靠主题相似就能排对。',
            k2: '后果', v2: '原文只说 inflated scores、无具体数值。所以干扰句必须来自被拒标记词，覆盖对比 / 相似 / 延续 / 推断四类关系。' }
    };
    var hC3 = document.getElementById('hoverCard3');
    var h3T = document.getElementById('h3T');
    var h3K1 = document.getElementById('h3K1');
    var h3V1 = document.getElementById('h3V1');
    var h3K2 = document.getElementById('h3K2');
    var h3V2 = document.getElementById('h3V2');
    function hide3(){ if(hC3){ hC3.classList.remove('on'); } }
    function show3(key){
      var d = HOV3[key];
      if(!d || !hC3){ hide3(); return; }
      h3T.textContent = d.t;
      h3K1.textContent = d.k1; h3V1.textContent = d.v1;
      h3K2.textContent = d.k2; h3V2.textContent = d.v2;
      hC3.classList.toggle('warn', !!d.warn);
      hC3.classList.add('on');
    }
    play3.addEventListener('mouseover', function(e){
      var el = e.target && e.target.closest ? e.target.closest('[data-part3]') : null;
      if(el){ show3(el.getAttribute('data-part3')); }
    });
    play3.addEventListener('mouseleave', function(){ hide3(); });
    if(hoverParam && HOV3[hoverParam]){ show3(hoverParam); }
  }

}
