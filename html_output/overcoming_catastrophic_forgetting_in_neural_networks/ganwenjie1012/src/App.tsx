import { ReferenceProvider, useReferenceApi } from "./shared/reference/ReferenceProvider";
import { ReferenceHubDrawer } from "./shared/reference/ReferenceHubDrawer";
import { useReducedMotion } from "./shared/foundation/accessibility/useReducedMotion";
import type { PageId } from "./contracts/ids";
import { PageProblem } from "./pages/PageProblem";
import { PageProbability } from "./pages/PageProbability";
import { PageBayes } from "./pages/PageBayes";
import { PageLaplace } from "./pages/PageLaplace";
import { PageFisher } from "./pages/PageFisher";
import { PageObjective } from "./pages/PageObjective";
import { PageLifecycle } from "./pages/PageLifecycle";
import { PageMnist } from "./pages/PageMnist";
import { PageAtari } from "./pages/PageAtari";
import { PageGrandAnimation } from "./pages/PageGrandAnimation";

const LEARNING_PAGES: { id: PageId; number: string; title: string; eyebrow: string }[] = [
  { id: "page-01-problem", number: "01", title: "顺序训练中的参数变化", eyebrow: "问题起点" },
  { id: "page-02-probability", number: "02", title: "从网络概率到 Loss", eyebrow: "普通训练" },
  { id: "page-03-bayes", number: "03", title: "参数的 Prior 与 Posterior", eyebrow: "Bayesian 视角" },
  { id: "page-04-laplace", number: "04", title: "Task A 解附近的局部约束", eyebrow: "Laplace 近似" },
  { id: "page-05-fisher", number: "05", title: "参数局部敏感性", eyebrow: "Fisher Information" },
  { id: "page-06-ewc-objective", number: "06", title: "Task B 的 EWC 目标", eyebrow: "EWC Objective" },
  { id: "page-07-lifecycle", number: "07", title: "EWC 顺序训练生命周期", eyebrow: "Task Boundary" },
  { id: "page-08-mnist", number: "08", title: "Permuted MNIST 实验", eyebrow: "受控分类证据" },
  { id: "page-09-atari", number: "09", title: "Atari 系统与实验边界", eyebrow: "强化学习证据" },
  { id: "page-10-grand-animation", number: "10", title: "让 EWC 真正运行起来", eyebrow: "最终整合" },
];

function AppFrame() {
  const api = useReferenceApi();
  const reducedMotion = useReducedMotion();
  const active = LEARNING_PAGES.find((page) => page.id === api.currentPage);
  const content = api.currentPage === "page-01-problem" ? <PageProblem />
    : api.currentPage === "page-02-probability" ? <PageProbability />
      : api.currentPage === "page-03-bayes" ? <PageBayes />
        : api.currentPage === "page-04-laplace" ? <PageLaplace />
          : api.currentPage === "page-05-fisher" ? <PageFisher />
            : api.currentPage === "page-06-ewc-objective" ? <PageObjective />
              : api.currentPage === "page-07-lifecycle" ? <PageLifecycle />
                : api.currentPage === "page-08-mnist" ? <PageMnist />
                  : api.currentPage === "page-09-atari" ? <PageAtari />
                    : api.currentPage === "page-10-grand-animation" ? <PageGrandAnimation />
              : <section className="ewc-slice-placeholder"><div className="ewc-kicker">W8 · FULL IMPLEMENTATION</div><h1>这一页将在后续实现批次开放。</h1><p>当前学习主线已包含顺序训练问题、网络概率与损失、参数的 Bayes 更新、Laplace 局部近似、Fisher 局部敏感性，以及 EWC 目标与梯度。其余页面仍沿用已冻结的导航与 Reference ID。</p><div className="ewc-contract-preview"><button type="button" className="ewc-button" onClick={() => api.navigatePage("page-01-problem")}>打开 Page 1</button><button type="button" className="ewc-button" onClick={() => api.navigatePage("page-02-probability")}>打开 Page 2</button><button type="button" className="ewc-button" onClick={() => api.navigatePage("page-03-bayes")}>打开 Page 3</button><button type="button" className="ewc-button" onClick={() => api.navigatePage("page-04-laplace")}>打开 Page 4</button><button type="button" className="ewc-button" onClick={() => api.navigatePage("page-05-fisher")}>打开 Page 5</button><button type="button" className="ewc-button ewc-button--primary" onClick={() => api.navigatePage("page-06-ewc-objective")}>打开 Page 6</button></div></section>;
  return (
    <div className={`ewc-app ${reducedMotion ? "is-reduced-motion" : ""} ${api.currentPage === "page-10-grand-animation" ? "ewc-app--grand" : ""}`}>
      <a className="ewc-skip-link" href="#main-content">跳到当前页面</a>
      <aside className="ewc-rail">
        <div className="ewc-brand"><span className="ewc-brand__mark">E</span><span><b>PaperSkill</b><small>LEARNING SYSTEMS</small></span></div>
        <div className="ewc-rail__section-label">已实现页面</div>
        <nav className="ewc-slice-nav" aria-label="学习主线页面导航">
          {LEARNING_PAGES.map((page) => (
            <button key={page.id} type="button" className={`ewc-slice-nav__item ${api.currentPage === page.id ? "is-active" : ""}`} aria-current={api.currentPage === page.id ? "page" : undefined} onClick={() => api.navigatePage(page.id)}>
              <span className="ewc-slice-nav__number">{page.number}</span><span className="ewc-slice-nav__copy"><b>{page.title}</b><small>{page.eyebrow}</small></span>
            </button>
          ))}
        </nav>
        <div className="ewc-rail__scope"><span className="ewc-status-dot" />W8 · Pages 1–10<p>从顺序训练问题到概率、EWC 推导、生命周期、实验边界与最终整合。</p></div>
        <div className="ewc-rail__footer"><span>Overcoming catastrophic forgetting</span><small>Kirkpatrick et al. · PNAS 2017</small></div>
      </aside>

      <div className="ewc-main-column">
        <header className="ewc-topbar">
          <div className="ewc-topbar__path"><span>CONTINUAL LEARNING</span><span className="ewc-slash">/</span><strong>{active?.eyebrow ?? "W8 Preview"}</strong></div>
          <button type="button" className="ewc-hub-launch" onClick={() => api.openHub()}><span className="ewc-hub-launch__icon">⌕</span><span>Reference Hub</span><kbd>R</kbd></button>
        </header>

        <main id="main-content" className="ewc-main" tabIndex={-1}>{content}</main>
      </div>
      <ReferenceHubDrawer />
    </div>
  );
}

export default function App() {
  return <ReferenceProvider><AppFrame /></ReferenceProvider>;
}
