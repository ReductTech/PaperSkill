// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything that keeps running is registered on the per-mount `scope` so switching
// chapters tears the loop down instead of leaking one per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS2(scope: Scope) {
  var qp = new URLSearchParams(location.search);
  var hoverParam = window.__PART || qp.get('part');
  var frozenParam = (window.__FREEZE != null)
    ? Math.max(0, Math.min(1, window.__FREEZE / 100))
    : (qp.has('freeze') ? Math.max(0, Math.min(1, parseFloat(qp.get('freeze')) / 100)) : null);
  var play2 = document.getElementById('play2');
  if(play2){
    var D2 = 8800;
    var srcs2 = play2.querySelectorAll('#srcs2 .src');
    var flow2 = document.getElementById('flow2');
    var lex2 = play2.querySelector('.lex2');
    var scan2 = play2.querySelector('.scan2');
    var track2 = document.getElementById('track2');
    var tris2 = play2.querySelectorAll('.tri-cell');
    var t2 = 0, last2 = 0, raf2 = 0, run2 = false, froz2 = null;

    function st2(t){
      function on(el, cond){ if(el){ el.classList.toggle('on', cond); } }
      var live = t < 8000;
      on(srcs2[0], live && t > 400);
      on(srcs2[1], live && t > 1000);
      on(srcs2[2], live && t > 1600);
      on(srcs2[3], live && t > 2200);
      on(flow2, live && t > 2600);
      on(lex2, live && t > 2900);
      on(scan2, live && t > 3400);
      on(track2, live && t > 3600);
      on(tris2[0], live && t > 5000);
      on(tris2[1], live && t > 5300);
      on(tris2[2], live && t > 5600);
    }
    function frame2(now){
      var t = (now - t2) % D2;
      last2 = t;
      st2(t);
      raf2 = scope.raf(frame2);
    }
    function start2(){
      if(run2){ return; }
      run2 = true;
      t2 = performance.now() - last2;
      raf2 = scope.raf(frame2);
    }
    function stop2(){
      run2 = false;
      if(raf2){ raf2 = 0; }
    }

    if(frozenParam !== null){
      last2 = frozenParam * D2;
      play2.classList.add('is-shot');
      st2(last2);
    } else {
      if('IntersectionObserver' in window){
        var io2 = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if(en.isIntersecting){ start2(); } else { stop2(); }
          });
        }, {threshold: 0.25});
        io2.observe(play2);
      } else { start2(); }
      play2.addEventListener('mouseenter', function(){ froz2 = last2; stop2(); });
      play2.addEventListener('mouseleave', function(){ if(froz2 !== null){ last2 = froz2; froz2 = null; } start2(); });
    }

    var HOV2 = {
      s1: { t: '人工梳理 · 169 个起点',
            k1: '是什么', v1: '取每句第一个逗号前的短语（≤7 词），统计最高频的 400 个；两位 NLP 专家各读 15 对句子，两票全过才算。',
            k2: '干什么', v2: '得到 84 个 Address、13 个 Broaden、72 个 Specify —— 数量少但精度最高，是全表的锚点。' },
      s2: { t: '前缀扩展 · 并入同一条目',
            k1: '是什么', v1: '对 To address 这类高频前缀，把到逗号为止的短扩展（如 to address this potential bias）并回同一条目。',
            k2: '干什么', v2: '避免同一语义被拆成几十个词条虚增规模，让 4,252 这个数字反映真实的表达多样性。' },
      s3: { t: 'LLM 生成 · 3,779 条强真',
            k1: '是什么', v1: '三个不同模型家族在人工词表上补充 Address 与 Broaden 候选，再由 LLM 标 strong / weak / false，只留强真；专家抽 1,500 条复核。',
            k2: '干什么', v2: '覆盖人工想不到的措辞 —— 但也是空转大头：四路合计 4,252 条里只有 809 条真在语料中出现。' },
      s4: { t: '模板扩展 · 397 条（297 新）',
            k1: '是什么', v1: '仿 Hearst 式模板为 Address / Broaden 造槽位句（to [回应词] [指示词] [问题词]），再让 GPT-5.4 过滤不合语法的结果。',
            k2: '干什么', v2: '补足结构化变体。Specify 没做这一步 —— 它的人工加扩展词表已经产出 2.8M 对，不缺数据。' },
      lex: { t: '互斥词表 · 4,252',
             k1: '是什么', v1: '三张表互不相交，每个标记词只属于一个动作。',
             k2: '干什么', v2: '保证同一句不会被两个动作同时认领 —— 这是三个任务能分开评测的前提。' },
      scan: { t: '命中率 19%',
              k1: '现状', v1: '4,252 个词里只有 809 个在 366.6M 相邻句对中至少命中一次，产出约 3M 对、来自 1.1M 篇论文。',
              k2: '后果', v2: '词表规模不能当质量指标：八成词条一次都没出现过。真正起作用的是那 809 个，两位专家已逐一复核。' },
      tri: { t: '三元组 (u(i), ℓ, g)',
             k1: '是什么', v1: '前句 u(i) 是查询；后句拆成标记词 ℓ 与剩余部分 g，g 才是标准答案。',
             k2: '干什么', v2: 'ℓ 只当元数据并从 gold 开头剥掉 —— 否则检索器只要认句首短语就能全中，学不到任何构思关系。' }
    };
    var hC2 = document.getElementById('hoverCard2');
    var h2T = document.getElementById('h2T');
    var h2K1 = document.getElementById('h2K1');
    var h2V1 = document.getElementById('h2V1');
    var h2K2 = document.getElementById('h2K2');
    var h2V2 = document.getElementById('h2V2');
    function hide2(){ if(hC2){ hC2.classList.remove('on'); } }
    function show2(key){
      var d = HOV2[key];
      if(!d || !hC2){ hide2(); return; }
      h2T.textContent = d.t;
      h2K1.textContent = d.k1; h2V1.textContent = d.v1;
      h2K2.textContent = d.k2; h2V2.textContent = d.v2;
      hC2.classList.toggle('warn', !!d.warn);
      hC2.classList.add('on');
    }
    play2.addEventListener('mouseover', function(e){
      var el = e.target && e.target.closest ? e.target.closest('[data-part2]') : null;
      if(el){ show2(el.getAttribute('data-part2')); }
    });
    play2.addEventListener('mouseleave', function(){ hide2(); });
    if(hoverParam && HOV2[hoverParam]){ show2(hoverParam); }
  }

}
