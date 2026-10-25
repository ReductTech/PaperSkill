// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything is registered on the per-mount `scope` so switching chapters tears the
// animation loop down instead of leaking one loop per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS5(scope: Scope) {
  const byId = (id: string): any => document.getElementById(id);
    var play5 = byId('play5');
    var card5 = byId('hoverCard5');
    var h5T = byId('h5T');
    var h5K1 = byId('h5K1'), h5V1 = byId('h5V1');
    var h5K2 = byId('h5K2'), h5V2 = byId('h5V2');
    var D5 = 9000, t50 = 0, last5 = 0, froz5 = null, run5 = false, did5 = false;
    var GNS = play5.querySelectorAll('.gn');
    var GES = play5.querySelectorAll('.ge');
    var GSS = play5.querySelectorAll('.gs');
    var WBS = play5.querySelectorAll('.w5-b i');
    var PTS = play5.querySelectorAll('.ax5-pt');
    var TIES = play5.querySelectorAll('[data-tie]');

    function render5(t){
      Array.prototype.forEach.call(GNS, function(g, i){
        g.classList.toggle('on', t >= .02 + i * .025);
        g.classList.toggle('is-hot', t >= .56 && t < .72 + i * .012);
      });
      Array.prototype.forEach.call(GES, function(e, i){
        e.classList.toggle('on', t >= .15 + i * .022);
      });
      Array.prototype.forEach.call(WBS, function(b, i){
        b.style.width = (t >= .28 + i * .05) ? (b.getAttribute('data-w') + '%') : '0%';
      });
      Array.prototype.forEach.call(GSS, function(s, i){
        s.classList.toggle('on', t >= .34 + i * .034);
      });
      Array.prototype.forEach.call(PTS, function(p, i){
        p.classList.toggle('on', t >= .68 + i * .05);
      });
      Array.prototype.forEach.call(TIES, function(el, i){
        el.classList.toggle('on', t >= .90 + i * .02);
      });
    }

    function loop5(now){
      if(run5){
        var t;
        var fz = parseFloat(play5.getAttribute('data-freeze'));
        if(!isNaN(fz)){ t = fz; }
        else if(froz5 !== null){ t = froz5; }
        else { t = ((now - t50) % D5) / D5; last5 = t; }
        render5(t);
      }
      scope.raf(loop5);
    }
    function begin5(){
      if(did5){ return; }
      did5 = true; run5 = true;
      t50 = performance.now();
    }
    if('IntersectionObserver' in window){
      var io5 = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ begin5(); } });
      }, {threshold: .3});
      io5.observe(play5);
    } else { begin5(); }
    scope.raf(loop5);
    setTimeout(begin5, 0);

    play5.addEventListener('mouseenter', function(){ if(run5){ froz5 = last5; } });
    play5.addEventListener('mouseleave', function(){
      if(froz5 === null){ return; }
      t50 = performance.now() - froz5 * D5;
      froz5 = null;
    });

    var C5 = {
      nbg: {
        t: '背景节点 · BG',
        k1: '是什么', v1: '想法里那些「已知事实」—— 领域共识、既有设定、被当成前提的东西。',
        k2: '干什么', v2: '按角色映射到问题空间查库。这类内容通常最不新颖，但权重小的时候对总分影响有限。'
      },
      nrp: {
        t: '研究问题节点 · RP',
        k1: '是什么', v1: '这项研究要填的那个缺口 —— 现有工作没解决、作者打算解决的事。',
        k2: '干什么', v2: '同样映射到问题空间：BG 与 RP 共用 E_problem。五类节点是多对一地挤进三个空间，不是一一对应。'
      },
      nri: {
        t: '推理洞见节点 · RI',
        k1: '是什么', v1: '从问题推向方法的中间推理步骤 —— 论文讲「逻辑跃迁」时指的就是它。',
        k2: '干什么', v2: '映射到方法空间。它常被多条路径穿过，介数中心性高；在这个示例里它拿到最大的一份权重。'
      },
      npa: {
        t: '提出方法节点 · PA',
        k1: '是什么', v1: '具体的技术方案 —— 用了什么架构、什么训练方式。',
        k2: '干什么', v2: '映射到方法空间。示例里它的相似度最低（0.52），说明这份想法的新颖性主要来自方法这一维。'
      },
      nco: {
        t: '预期贡献节点 · CO',
        k1: '是什么', v1: '作者声称的结果与影响 —— 打算证明什么、改变什么。',
        k2: '干什么', v2: '唯一映射到发现空间的节点类型，与前三类分开查库。'
      },
      weight: {
        t: '权重 w(v) = ½(度中心性 + 介数中心性)',
        k1: '是什么', v1: '度中心性 = 这个节点连了几条边（除以 |V|−1，天然落在 0–1）；介数中心性 = 有多少条最短路径经过它。',
        k2: '问题', v2: '两者量纲不同：度中心性总是铺满 0–1，介数中心性在一般图上远小于 1。直接等权相加，等于让度中心性说了算。论文说会 rescale 到 [0.5, 2.0]，但没说是在合并前各自归一再加、还是在合并值上归一；等权与这个区间也都没有消融实验支撑。',
        warn: true
      },
      nif: {
        t: '新颖性分数 N(I)',
        k1: '是什么', v1: '1 减去加权平均后的最大相似度 —— 越像已有工作，分数越低。',
        k2: '假设', v2: '「相似度 ≈ 非新颖性」这条反推的误差没有被量化。检索到的证据本身质量参差（真值也是 LLM 判的），这层误差会直接传到分数上。',
        warn: true
      },
      tie: {
        t: '0.370 与 0.369',
        k1: '实测', v1: 'Pearson 上本文 0.370、GPT-5 Mini 0.369 —— 差 0.001，在 93 个样本下没有统计意义。论文只报了两个 p 值，没报置信区间。',
        k2: '反差', v2: '换成 Spearman，本文 0.384、GPT-5 Mini 0.385，本文反而落后。摘要写的是 attains 0.37 correlation，结论 §6 写的是 comparable to frontier LLMs —— 后者更诚实，引用时用后者。',
        warn: true
      },
      base: {
        t: '嵌入基线',
        k1: '结果', v1: 'SPECTER2 最强（concat Pearson 0.333）、E5-base-v2 次之（0.287）、SciNCL 最弱（0.157）。',
        k2: '观察', v2: 'SciNCL 用引文邻域做对比学习，在细粒度判别上反而最弱 —— 与另一条线上「用引文对训练的编码器排最后」的观察方向一致。'
      }
    };
    function hide5(){ if(card5){ card5.classList.remove('on'); } }
    function show5(d){
      if(!d || !h5T){ hide5(); return; }
      h5T.textContent = d.t;
      h5K1.textContent = d.k1; h5V1.textContent = d.v1;
      h5K2.textContent = d.k2; h5V2.textContent = d.v2;
      card5.classList.toggle('warn', !!d.warn);
      card5.classList.add('on');
    }
    function pick5(node){
      if(!node || !node.closest){ hide5(); return; }
      var el = node.closest('[data-part5]');
      if(el){ show5(C5[el.getAttribute('data-part5')]); return; }
      hide5();
    }
    play5.addEventListener('mouseover', function(e){ pick5(e.target); });
    play5.addEventListener('mouseleave', function(){ hide5(); });
}
