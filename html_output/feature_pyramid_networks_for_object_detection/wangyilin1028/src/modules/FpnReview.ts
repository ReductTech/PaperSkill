import { auditSlide } from '../lib/slideAudit';
// 本地制作检查，不显示在导读中，也不在生产构建中运行。
if ((import.meta as unknown as {env:{DEV:boolean}}).env.DEV && new URLSearchParams(location.search).has('qa')) {
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      queued = false;
      if (document.querySelector('[data-slide-canvas]')) {
        document.documentElement.dataset.fpnLayoutAudit = JSON.stringify(auditSlide());
      }
    }));
  };
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('resize',schedule);
  document.addEventListener('input',schedule);
  document.addEventListener('click',schedule);
  document.fonts.ready.then(schedule);
  schedule();
}
