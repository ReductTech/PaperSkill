(function () {
  'use strict';

  var PHONE_MAX = 720;
  var OVERFLOW_TOLERANCE = 8;
  var queued = false;

  function isVisible(element) {
    var rect = element.getBoundingClientRect();
    var style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  }

  function tableToCards(table, force) {
    var scroller = table.parentElement;
    if (!scroller || (!force && table.scrollWidth <= scroller.clientWidth + OVERFLOW_TOLERANCE)) return;

    var headers = Array.from(table.querySelectorAll('thead th')).map(function (cell) {
      return (cell.textContent || '').trim();
    });
    if (!headers.length) return;

    table.classList.add('mobile-table-cards');
    table.querySelectorAll('tbody tr').forEach(function (row) {
      Array.from(row.children).forEach(function (cell, index) {
        if (cell.tagName === 'TD') cell.setAttribute('data-mobile-label', headers[index] || '');
      });
    });
    scroller.style.overflowX = 'visible';
  }

  function preservesHorizontalScroll(element) {
    return Boolean(element.closest(
      '.dl-video-strip, .carousel, .swiper-wrapper, [class*="carousel" i], [class*="slider" i], [class*="scroller" i], [data-mobile-scroll]'
    ));
  }

  function markWideGrids(scope) {
    scope.querySelectorAll('body table').forEach(tableToCards);

    scope.querySelectorAll('body *').forEach(function (element) {
      if (!isVisible(element) || element.classList.contains('mobile-auto-stack')) return;

      var style = getComputedStyle(element);
      if (style.display !== 'grid' && style.display !== 'inline-grid') return;
      if (preservesHorizontalScroll(element)) return;

      var parent = element.parentElement;
      if (!parent) return;
      var rect = element.getBoundingClientRect();
      var parentRect = parent.getBoundingClientRect();
      var overflows = element.scrollWidth > parent.clientWidth + OVERFLOW_TOLERANCE
        || rect.right > parentRect.right + OVERFLOW_TOLERANCE
        || rect.left < parentRect.left - OVERFLOW_TOLERANCE;

      if (overflows) element.classList.add('mobile-auto-stack');
    });
  }

  function markWideFlex(scope) {
    scope.querySelectorAll('body *').forEach(function (element) {
      if (!isVisible(element) || element.classList.contains('mobile-auto-wrap')) return;
      var style = getComputedStyle(element);
      if (style.display !== 'flex' && style.display !== 'inline-flex') return;
      if (style.flexWrap !== 'nowrap' || preservesHorizontalScroll(element)) return;

      var parent = element.parentElement;
      if (!parent) return;
      var rect = element.getBoundingClientRect();
      var parentRect = parent.getBoundingClientRect();
      var overflows = element.scrollWidth > parent.clientWidth + OVERFLOW_TOLERANCE
        || rect.right > parentRect.right + OVERFLOW_TOLERANCE
        || rect.left < parentRect.left - OVERFLOW_TOLERANCE;
      if (overflows) element.classList.add('mobile-auto-wrap');
    });
  }

  function markSqueezedColumns(scope) {
    var changed = false;
    scope.querySelectorAll('body *').forEach(function (element) {
      if (!isVisible(element) || element.closest('thead, [aria-hidden="true"], .katex-mathml')) return;
      var text = (element.textContent || '').trim();
      var rect = element.getBoundingClientRect();
      var style = getComputedStyle(element);
      var lineHeight = Number.parseFloat(style.lineHeight) || 0;
      var squeezed = text.length > 18
        && rect.width > 0
        && rect.width < 72
        && rect.height > 100
        && lineHeight > 0
        && rect.height / lineHeight > 5
        && style.writingMode === 'horizontal-tb';
      if (!squeezed) return;

      var table = element.closest('table');
      if (table && !table.classList.contains('mobile-table-cards')) {
        tableToCards(table, true);
        changed = true;
        return;
      }

      var layout = element.parentElement;
      var className = '';
      while (layout && layout !== document.body) {
        var layoutStyle = getComputedStyle(layout);
        var isGrid = layoutStyle.display === 'grid' || layoutStyle.display === 'inline-grid';
        var isFlex = layoutStyle.display === 'flex' || layoutStyle.display === 'inline-flex';
        className = isGrid ? 'mobile-auto-stack' : isFlex ? 'mobile-auto-wrap' : '';
        if (isFlex && layout.classList.contains('mobile-auto-wrap')
          && !layout.classList.contains('mobile-squeezed-parent')) {
          layout.classList.add('mobile-squeezed-parent');
          changed = true;
          return;
        }
        if (className && !layout.classList.contains(className)) break;
        layout = layout.parentElement;
      }
      if (!layout || layout === document.body || preservesHorizontalScroll(layout)) return;
      if (!layout.classList.contains(className)) {
        layout.classList.add(className);
        if (className === 'mobile-auto-wrap') layout.classList.add('mobile-squeezed-parent');
        changed = true;
      }
    });
    return changed;
  }

  function audit() {
    queued = false;
    if (window.innerWidth > PHONE_MAX) return;
    for (var pass = 0; pass < 4; pass += 1) {
      markWideGrids(document);
      markWideFlex(document);
      if (!markSqueezedColumns(document)) break;
    }
  }

  function scheduleAudit() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(audit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleAudit, { once: true });
  } else {
    scheduleAudit();
  }

  new MutationObserver(scheduleAudit).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', scheduleAudit, { passive: true });
})();
