import { useState } from "react";
import { ReferenceButton, ReferenceProvider } from "./shared/core/reference/ReferenceHub";
import { lazy, Suspense } from "react";
import { tutorial } from "./data/tutorial";
import { widgetRegistry } from "./modules/registry";
import EditorialFlourish from "./shared/foundation/editorial/EditorialFlourish";

const chapterLabels: Record<string, string> = { p1: "任务约束", p2: "ViT 架构", p3: "注意力", p4: "Prompt 调优", p5: "动态检索", p6: "完整分类", p7: "联合更新", p8: "持续运行", p9: "实验与证据" };

const StylePreview = import.meta.env.DEV ? lazy(() => import("./StylePreview")) : null;

export default function App() {
  if (StylePreview && new URLSearchParams(location.search).has("style-preview")) {
    return <Suspense fallback={<p>正在加载样式预览…</p>}><StylePreview /></Suspense>;
  }
  return <ReferenceProvider entries={tutorial.references ?? []} sourceLink={{ href: "https://arxiv.org/abs/2112.08654", label: "L2P 论文原文" }}><Tutorial /></ReferenceProvider>;
}

function Tutorial() {
  const requestedPage = new URLSearchParams(location.search).get("page");
  const [activeChapterId, setActiveChapterId] = useState(
    tutorial.chapters.find(chapter => chapter.id === requestedPage)?.id ?? tutorial.chapters[0]?.id ?? "",
  );
  function openChapter(id: string) {
    setActiveChapterId(id);
    const url = new URL(location.href);
    url.searchParams.set("page", id);
    url.hash = "";
    history.replaceState(null, "", url);
    window.scrollTo(0, 0);
  }
  const activeIndex = tutorial.chapters.findIndex(chapter => chapter.id === activeChapterId);
  const activeChapter = tutorial.chapters[activeIndex];
  const previous = tutorial.chapters[activeIndex - 1];
  const next = tutorial.chapters[activeIndex + 1];
  const title = tutorial.meta?.titleZh || tutorial.meta?.titleEn || "论文学习笔记";
  const subtitle = tutorial.meta?.titleEn && tutorial.meta?.titleZh ? tutorial.meta.titleEn : "PAPER TUTORIAL";
  const highlight = activeChapter?.titleHighlight;
  const highlightStart = activeChapter && highlight ? activeChapter.title.indexOf(highlight) : -1;

  return (
    <>
      <header className={"site-header" + (tutorial.chapters.length > 8 ? " site-header--dense-nav" : "")}>
        <div className="site-header-inner">
          <a href="#tutorial-opening" className="site-brand" aria-label={`${title} 开头`}>
            <span className="brand-mark" aria-hidden="true">PAPER</span>
            <span>{title}<small>{subtitle}</small></span>
          </a>
          {tutorial.chapters.length > 0 && (
            <nav aria-label="教程章节">
              {tutorial.chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  type="button"
                  aria-pressed={chapter.id === activeChapterId}
                  onClick={() => openChapter(chapter.id)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>{chapterLabels[chapter.id] ?? chapter.title}
                </button>
              ))}
            </nav>
          )}
          {(tutorial.references?.length ?? 0) > 0 && <ReferenceButton page={activeChapterId.toUpperCase()}>术语与资料</ReferenceButton>}
        </div>
      </header>
      <main className="rk-reading rk-editorial-preview">
        <div className="rk-editorial-meta">
          <span>{subtitle}</span>
          <span>{activeChapter?.title || "从问题到证据"}</span>
        </div>
        {activeChapter ? (
          <article className="chapter-content" aria-labelledby="tutorial-title">
            <section className="rk-editorial-opening" id="tutorial-opening">
              <h1 className="rk-headline rk-headline--paper" id="tutorial-title">
                {highlightStart >= 0 && highlight ? <>
                  {activeChapter.title.slice(0, highlightStart)}
                  <mark className="rk-highlight">{highlight}</mark>
                  {activeChapter.title.slice(highlightStart + highlight.length)}
                </> : activeChapter.title}
              </h1>
              {(activeChapter.summary || activeChapter.bridge) && (
                <p className="rk-lead">{activeChapter.summary || activeChapter.bridge}</p>
              )}
              <EditorialFlourish />
            </section>
            <div className="module-list">
              {activeChapter.modules.map((module) => {
                const Widget = module.componentId ? widgetRegistry[module.componentId] : undefined;
                return (
                  <section className="rk-section teaching-module" key={module.id} aria-labelledby={`module-${module.id}`}>
                    <h2 id={`module-${module.id}`}>{module.title}</h2>
                    {(module.desc || module.summary) && <p>{module.desc || module.summary}</p>}
                    {Widget && <div className="lesson-copy" data-lesson-page={activeChapter.id}><Widget chapterId={activeChapter.id} moduleId={module.id} /></div>}
                  </section>
                );
              })}
            </div>
            <div className="chapter-actions" aria-label="阅读顺序">
              {previous && <button type="button" className="text-button" onClick={() => openChapter(previous.id)}>上一页 · {chapterLabels[previous.id]}</button>}
              {next && <button type="button" className="text-button" onClick={() => openChapter(next.id)}>下一页 · {chapterLabels[next.id]}</button>}
            </div>
          </article>
        ) : (
          <section className="empty-state rk-editorial-opening" id="tutorial-opening" aria-labelledby="empty-state-title">
            <h1 className="rk-headline rk-headline--paper" id="empty-state-title">论文教程项目已初始化</h1>
            <p className="rk-lead">完成论文阅读与教学设计后，从首个真实学习切片开始添加章节和交互解释。</p>
            <EditorialFlourish />
          </section>
        )}
      </main>
    </>
  );
}
