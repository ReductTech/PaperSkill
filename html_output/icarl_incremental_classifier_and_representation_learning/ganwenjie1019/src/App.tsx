import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ICARL_REFERENCE_ITEMS, type ReferenceOpenEvent } from "./data/icarl-reference-content";
import { pages, type PageId } from "./data/tutorial";
import { widgetRegistry } from "./modules/registry";
import { ReferenceHub } from "./shared/core/reference";
import { useFocusTrap } from "./shared/foundation/accessibility/useReducedMotion";

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("page-1");
  const [pageInstanceKey, setPageInstanceKey] = useState(0);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const activePageInfo = pages.find((page) => page.id === activePage)!;
  const ActivePage = widgetRegistry[activePage];
  const closeReference = useCallback(() => setReferenceOpen(false), []);
  const referenceDialogRef = useFocusTrap<HTMLElement>(referenceOpen, closeReference);

  function navigateToPage(pageId: PageId) {
    setActivePage(pageId);
    setPageInstanceKey((key) => key + 1);
  }

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pageInstanceKey]);

  useEffect(() => {
    const handleReferenceOpen = (event: Event) => {
      const { termId } = (event as ReferenceOpenEvent).detail;
      setReferenceOpen(true);
      const nextHash = `#ref-${encodeURIComponent(termId)}`;
      if (window.location.hash !== nextHash) window.location.hash = nextHash;
    };
    window.addEventListener("icarl:open-reference", handleReferenceOpen);
    return () => window.removeEventListener("icarl:open-reference", handleReferenceOpen);
  }, []);

  return (
    <>
    <div className="paper-app ewc-app" id="icarL_runtime" data-canonical-id="icarL_runtime">
      <a className="ewc-skip-link" href="#top">跳到当前页面</a>
      <aside className="ewc-rail" aria-label="Tutorial navigation">
        <a className="ewc-brand" href="#top" onClick={(event) => { event.preventDefault(); navigateToPage("page-1"); }} aria-label="iCaRL tutorial home">
          <span className="ewc-brand__mark">i</span>
          <span><b>iCaRL</b><small>INCREMENTAL LEARNING</small></span>
        </a>
        <p className="ewc-rail__section-label">学习路径</p>
        <nav className="ewc-slice-nav" aria-label="Tutorial pages">
          {pages.map((page) => (
            <button key={page.id} type="button" className={`ewc-slice-nav__item ${activePage === page.id ? "is-active" : ""}`} aria-current={activePage === page.id ? "page" : undefined} onClick={() => navigateToPage(page.id)}>
              <span className="ewc-slice-nav__number">{page.number}</span>
              <span className="ewc-slice-nav__copy"><b>{page.title}</b><small>{page.subtitle}</small></span>
            </button>
          ))}
        </nav>
        <div className="ewc-rail__scope"><span className="ewc-status-dot" /> 论文导读<p>沿着新类别到达、模型更新和下一轮就绪状态，观察同一个学习器。</p></div>
        <div className="ewc-rail__footer">iCaRL · 增量分类与表示学习<small>交互式论文教学页面</small></div>
      </aside>

      <div className="ewc-main-column">
        <header className="ewc-topbar">
          <div className="ewc-topbar__path"><span>ICARL</span><span className="ewc-slash">/</span><strong>{activePageInfo.number} · {activePageInfo.title}</strong></div>
          <div className="icarl-topbar__actions"><button type="button" className="icarl-hub-launch" aria-haspopup="dialog" aria-expanded={referenceOpen} onClick={() => setReferenceOpen(true)}><span aria-hidden="true">⌕</span> Reference Hub</button><span className="ewc-topbar__edition"><i /> W9 · 交互式教程</span></div>
        </header>
        <main className="tutorial-main ewc-main" id="top" key={pageInstanceKey}>
          <ActivePage navigateToPage={navigateToPage} />
        </main>
        <footer className="site-footer ewc-footer"><span>iCaRL · 论文教学页面</span><span>第 01 · 02 · 03 · 04 · 05 · 06 · 07 · 08 · 09 页</span></footer>
      </div>
    </div>
    {referenceOpen ? <div className="icarl-reference-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReferenceOpen(false); }}>
      <section ref={referenceDialogRef} className="icarl-reference-dialog" role="dialog" aria-modal="true" aria-label="Reference Hub" tabIndex={-1}>
        <header className="icarl-reference-dialog__toolbar"><span>iCaRL · REFERENCE INDEX</span><button type="button" onClick={closeReference} aria-label="Close Reference Hub">×</button></header>
        <ReferenceHub items={ICARL_REFERENCE_ITEMS} />
      </section>
    </div> : null}
    </>
  );
}
