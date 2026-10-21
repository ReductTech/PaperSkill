// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything is registered on the per-mount `scope` so switching chapters tears the
// animation loop down instead of leaking one loop per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS1(scope: Scope) {
  const byId = (id: string): any => document.getElementById(id);
    var play = byId('play');
    var DIMS = ['p', 'm', 'f'];
    var DUR = 6000;
    var geo = {}, srcEl = {}, flyEl = {}, slotEl = {};
    var t0 = 0, lastT = 0, frozen = null, started = false, hasRun = false;

    if(play){
      var flyers = play.querySelectorAll('.flyer');
      DIMS.forEach(function(d, i){
        srcEl[d] = play.querySelector('.abs [data-src="' + d + '"]');
        slotEl[d] = play.querySelector('.slot[data-dim="' + d + '"]');
        flyEl[d] = flyers[i];
        if(flyEl[d]){ flyEl[d].style.background = 'var(--dim-' + d + ')'; }
      });

      function measure(){
        var sb = play.getBoundingClientRect();
        DIMS.forEach(function(d){
          var s = srcEl[d];
          var v = slotEl[d] ? slotEl[d].querySelector('.vblock') : null;
          if(!s || !v){ return; }
          var a = s.getBoundingClientRect(), b = v.getBoundingClientRect();
          geo[d] = {
            x0: a.left - sb.left + a.width / 2,
            y0: a.top - sb.top + a.height / 2,
            x1: b.left - sb.left + b.width / 2,
            y1: b.top - sb.top + b.height / 2
          };
        });
      }

      function clamp01(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }
      function ease(u){ return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

      function render(t){
        DIMS.forEach(function(d, i){
          var s = srcEl[d], f = flyEl[d], g = geo[d], sl = slotEl[d];
          if(!s || !g){ return; }
          var ha = i * 0.08, hb = ha + 0.16;
          var hi = (t >= ha && t < hb) ? Math.sin((t - ha) / 0.16 * Math.PI) : 0;
          var fa = 0.28 + i * 0.06, fb = fa + 0.20;
          var u = clamp01((t - fa) / (fb - fa));
          var gone = u > 0 ? Math.min(1, u * 2.2) : 0;
          s.style.opacity = String((0.76 + 0.24 * hi) * (1 - 0.74 * gone));
          s.style.borderBottomWidth = (2.5 + 1.5 * hi) + 'px';
          if(f){
            if(u > 0 && u < 1){
              var e = ease(u);
              f.style.transform = 'translate(' + (g.x0 + (g.x1 - g.x0) * e - 10) + 'px,' +
                (g.y0 + (g.y1 - g.y0) * e - 10) + 'px) scale(' + (1 - 0.22 * u) + ')';
              f.style.opacity = u < 0.86 ? '1' : String(clamp01((1 - u) / 0.14));
            } else {
              f.style.opacity = '0';
              f.style.transform = 'translate(' + (g.x0 - 10) + 'px,' + (g.y0 - 10) + 'px)';
            }
          }
          if(sl){ sl.classList.toggle('on', u >= 0.86); }
        });
      }

      function loop(now){
        if(started){
          var t;
          if(frozen !== null){ t = frozen; }
          else { t = ((now - t0) % DUR) / DUR; lastT = t; }
          render(t);
        }
        scope.raf(loop);
      }

      function begin(){
        if(hasRun){ return; }
        hasRun = true;
        started = true;
        measure();
        t0 = performance.now();
      }

      if('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(en){ if(en.isIntersecting){ begin(); } });
        }, {threshold: 0.32});
        io.observe(play);
      } else {
        begin();
      }

      scope.raf(loop);
      scope.on(window, 'resize', function(){ measure(); });

      play.addEventListener('mouseenter', function(){ if(started){ frozen = lastT; } });
      play.addEventListener('mouseleave', function(){
        if(frozen === null){ return; }
        t0 = performance.now() - frozen * DUR;
        frozen = null;
      });

      var card = byId('hoverCard');
      var hcT = byId('hcT');
      var hcK1 = byId('hcK1'), hcV1 = byId('hcV1');
      var hcK2 = byId('hcK2'), hcV2 = byId('hcV2');
      var CARD = {
        p: {
          t: '「问题」子空间 · E_problem',
          k1: '是什么', v1: '论文要填的那个缺口 —— 现有工作没能解决的事。',
          k2: '干什么', v2: '检索时按「在解决什么」匹配，把提问方式相似的论文拉近。'
        },
        m: {
          t: '「方法」子空间 · E_method',
          k1: '是什么', v1: '论文提出的技术路径与做法。',
          k2: '干什么', v2: '检索时按「怎么做」匹配，跨话题找到同类思路的工作。'
        },
        f: {
          t: '「发现」子空间 · E_findings',
          k1: '是什么', v1: '论文得到的结果与结论。',
          k2: '干什么', v2: '检索时按「得出了什么」匹配，供新颖性判断使用。'
        }
      };
      var CARD_SIM = {
        t: '三个子空间有多像？',
        k1: '现状', v1: '三个编码器各自独立训练（都从 SPECTER2 初始化），论文从未测过它们之间的相关性。',
        k2: '实测', v2: '三个单子空间在同一批查询上得分几乎重合 —— R@30 = 0.300 / 0.299 / 0.304。若真刻画不同维度，不该这么齐。',
        warn: true
      };
      var PART = {
        title: {
          t: '论文标题',
          k1: '是什么', v1: '论文的标题 —— 一句话说明这项研究在做什么。',
          k2: '作用', v2: '传统相似度最依赖的信号：标题像，就算两篇论文像。'
        },
        authors: {
          t: '作者与机构',
          k1: '是什么', v1: '论文的作者与所属单位。',
          k2: '注意', v2: '它们和正文一起被压进同一个向量，并不单独表示。'
        },
        body: {
          t: '摘要的其余文字',
          k1: '是什么', v1: '摘要里没有着色的灰字 —— 背景、相关工作、实验设置等。',
          k2: '说明', v2: '三类信息只占一部分；剩下的内容同样混在同一个向量里。'
        },
        figure: {
          t: '图表入口',
          k1: '是什么', v1: '论文的图与表。',
          k2: '注意', v2: '只抽取摘要文本，图表与正文都没有进入模型。'
        }
      };
      function hideCard(){ if(card){ card.classList.remove('on'); } }
      function showCard(data){
        if(!card || !hcT){ return; }
        hcT.textContent = data.t;
        hcK1.textContent = data.k1; hcV1.textContent = data.v1;
        hcK2.textContent = data.k2; hcV2.textContent = data.v2;
        card.classList.toggle('warn', !!data.warn);
        card.classList.add('on');
      }
      function pickTarget(node){
        if(!node || !node.closest){ hideCard(); return; }
        var slot = node.closest('.slot');
        if(slot){ showCard(CARD[slot.getAttribute('data-dim')]); return; }
        var ch = node.closest('[data-src]');
        if(ch){ showCard(CARD[ch.getAttribute('data-src')]); return; }
        var part = node.closest('[data-part]');
        if(part){ showCard(PART[part.getAttribute('data-part')]); return; }
        if(node.closest('.simline')){ showCard(CARD_SIM); return; }
        hideCard();
      }
      play.addEventListener('mouseover', function(e){ pickTarget(e.target); });
      play.addEventListener('mouseleave', function(){ hideCard(); });
    }

    var foldBtn = byId('foldBtn');
    var foldBody = byId('foldBody');
    if(foldBtn && foldBody){
      foldBtn.addEventListener('click', function(){
        var open = foldBody.classList.toggle('open');
        foldBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
}
