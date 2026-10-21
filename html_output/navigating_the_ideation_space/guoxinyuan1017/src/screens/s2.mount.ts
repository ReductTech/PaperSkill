// @ts-nocheck
// Ported from the single-file prototype. The behaviour is plain DOM code: it looks up the
// elements it owns, drives one requestAnimationFrame timeline and reveals hover cards.
// Everything is registered on the per-mount `scope` so switching chapters tears the
// animation loop down instead of leaking one loop per visit.
import type { Scope } from '../lib/lifecycle';

export function mountS2(scope: Scope) {
  const byId = (id: string): any => document.getElementById(id);
    var s2 = byId('s2');
    if (!s2) { return; }
    var segBtns = s2.querySelectorAll('.seg-btn');
    var tiles = s2.querySelectorAll('.ev-tile');
    var arrows = s2.querySelectorAll('.carrow');

    function pick(branch){
      Array.prototype.forEach.call(segBtns, function(b){
        var on = b.getAttribute('data-branch') === branch;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      Array.prototype.forEach.call(tiles, function(t){
        t.classList.toggle('is-on', t.getAttribute('data-branch') === branch);
      });
      Array.prototype.forEach.call(arrows, function(a){
        a.classList.toggle('is-on', a.getAttribute('data-link') === branch);
      });
    }

    Array.prototype.forEach.call(segBtns, function(b){
      b.addEventListener('click', function(){ pick(b.getAttribute('data-branch')); });
    });

    var segWrap = s2.querySelector('.seg');
    if(segWrap){
      segWrap.addEventListener('keydown', function(e){
        if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight'){ return; }
        e.preventDefault();
        var cur = segWrap.querySelector('.seg-btn.is-on');
        var next = (cur && cur.getAttribute('data-branch') === 'pm') ? 'mf' : 'pm';
        pick(next);
        var target = segWrap.querySelector('.seg-btn[data-branch="' + next + '"]');
        if(target){ target.focus(); }
      });
    }

    [['starA', 'annoA'], ['starB', 'annoB']].forEach(function(pair){
      var btn = byId(pair[0]);
      var box = byId(pair[1]);
      if(btn && box){
        btn.addEventListener('click', function(){
          var open = box.classList.toggle('open');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      }
    });
}
