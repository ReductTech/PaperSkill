// @ts-nocheck
// Ported from the single-file prototype: the three metric cards on the opening screen are
// click-to-expand. They hold no animation, so nothing here needs the raf side of the scope.
import type { Scope } from '../lib/lifecycle';

export function mountS0(scope: Scope) {
  var metrics = document.querySelectorAll('.metric');
  Array.prototype.forEach.call(metrics, function (el) {
    function toggle() {
      var open = el.classList.toggle('open');
      el.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    scope.on(el, 'click', toggle);
    scope.on(el, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggle();
      }
    });
  });
}
