import { Fragment, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { MethodScene, MethodLabel, useHeroTimeline } from "./components/MethodScene";
import { ChapterLoader } from "./components/ChapterLoader";
import { ChapterTwo } from "./components/ChapterTwo";
import { ChapterFour } from "./components/ChapterFour";
import { ChapterFive } from "./components/ChapterFive";
import { ChapterSeven } from "./components/ChapterSeven";
import { ChapterEight } from "./components/ChapterEight";
import { ChapterNine } from "./components/ChapterNine";
import { ChapterTen } from "./components/ChapterTen";
import { ChapterEleven } from "./components/ChapterEleven";
import { ChapterWrapUp, type ChapterWrapUpProps } from "./components/ChapterWrapUp";
import { PptBars } from "./components/PptBars";
import { chapters, PAPER, PDF, PROJECT, CODE, siteAsset } from "./content";
import {
  FixedLab,
  ModuleLab,
  PipelineLab,
} from "./components/Labs";
import { ChapterModuleNumbers, type Done } from "./components/Shared";

const KEY = "adaptiveisp-learning-v2";
const LEGACY_KEY = "adaptiveisp-learning-v1";
type Progress = {
  done: number[];
  started: boolean;
  revealed: number;
};
const emptyProgress = (): Progress => ({ done: [], started: false, revealed: 0 });
const legacySources = [[1], [3], [3], [2, 4, 5], [6, 9], [8], [7, 12], [10], [11, 12], [13], [16]];
const legacyMilestones = [1, 3, 3, 5, 9, 9, 12, 12, 12, 13, 16];
function validDone(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= chapters.length))];
}
function initial(): Progress {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const raw = JSON.parse(saved);
      const done = validDone(raw?.done);
      const revealed = Number.isInteger(raw?.revealed)
        ? Math.max(0, Math.min(chapters.length, raw.revealed))
        : Math.min(chapters.length, done.length + (raw?.started ? 1 : 0));
      return { done: done.filter((n) => n <= revealed), started: revealed > 0, revealed };
    }
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    if (!legacy) return emptyProgress();
    const oldDone = Array.isArray(legacy.done) ? legacy.done : [];
    const done: number[] = [];
    for (let i = 0; i < legacySources.length; i++) {
      if (legacySources[i].every((n) => oldDone.includes(n))) done.push(i + 1);
      else break;
    }
    const oldRevealed = Number.isInteger(legacy.revealed)
      ? Math.max(0, Math.min(17, legacy.revealed))
      : legacy.final ? 17 : oldDone.length ? Math.max(...oldDone) : legacy.started ? 1 : 0;
    const completedBeforeCurrent = legacyMilestones.filter((milestone) => milestone < oldRevealed).length;
    const revealed = oldRevealed > 0 ? Math.min(chapters.length, completedBeforeCurrent + 1) : 0;
    return { done, started: revealed > 0, revealed };
  } catch {
    return emptyProgress();
  }
}
const widgets: React.ComponentType<Done>[] = [
  FixedLab,
  ChapterTwo,
  ModuleLab,
  ChapterFour,
  ChapterFive,
  PipelineLab,
  ChapterSeven,
  ChapterEight,
  ChapterNine,
  ChapterTen,
  ChapterEleven,
];
const legacyHashChapters: Record<number, number> = {
  1: 1, 2: 4, 3: 3, 4: 4, 5: 4, 6: 5, 7: 7, 8: 6,
  9: 5, 10: 8, 11: 9, 12: 9, 13: 10, 16: 11,
};
const navigationChapters = chapters.map((chapter, index) => ({
  id: `chapter-${index + 1}`,
  title: chapter[0],
}));
const chapterWrapUps: ChapterWrapUpProps[] = chapters.map((chapter, index) => ({
  takeawayTitle: "本章节走一句话",
  takeawayText: chapter[2],
  evidenceTitle: "回到论文证据",
  evidenceText: chapter[4],
  nextTitle: "下一问",
  nextText: chapter[3],
  nextChapterLabel: chapters[index + 1]
    ? `→ §${index + 2}「${chapters[index + 1][0]}」`
    : "→ 回到论文原文",
}));
chapterWrapUps[1] = {
  ...chapterWrapUps[1],
  takeawayText: "相机先把 RAW 传感器数据变成 Linear RGB，AdaptiveISP 主要改变的是后续 RGB 域处理。",
  evidenceText: "§3 / App.B · RAW Domain → Linear RGB → AdaptiveISP",
  nextText: "既然 AdaptiveISP 可以在 RGB 域选择不同操作，那它究竟有哪些工具？",
};
chapterWrapUps[2] = {
  ...chapterWrapUps[2],
  takeawayText: "模块决定做什么处理，参数决定处理多少。",
  evidenceText: "App.B · Eq.12–22 / Fig.9",
  nextText: "有了十种工具，AdaptiveISP 怎样决定当前图像应该使用哪一个？",
};
chapterWrapUps[4] = {
  ...chapterWrapUps[4],
  takeawayText: "检测误差提供反馈，Actor–Critic 学习决策，可微 ISP 帮助优化参数。",
  evidenceText: "§3.2–3.3 · Fig.2 · Eq.4–11 · App.C.3",
  nextText: "训练完成后，一张图像究竟怎样走完整条 ISP 流水线？",
  nextChapterLabel: "→ §6 一张图的旅程",
};
chapterWrapUps[5] = {
  ...chapterWrapUps[5],
  takeawayText: "一张图像经过逐步 ISP 决策和处理，最终成为目标检测器的输入。",
  evidenceText: "§3.1–3.3 · Fig.2 · App.B / C",
  nextText: "既然能够生成不同处理路线，怎样在准确率和计算速度之间取舍？",
  nextChapterLabel: "→ §7 准确率与速度",
};
chapterWrapUps[6] = {
  ...chapterWrapUps[6],
  takeawayText: "更多 ISP 步骤不一定带来更多收益，AdaptiveISP 能在检测准确率与计算成本之间取舍。",
  evidenceText: "§3.3 · §4.2 · Table 4–5 · Eq.11",
  nextText: "为什么传统 ISP 方法难以同时做到结构自适应和高效决策？",
  nextChapterLabel: "→ §8 为什么不用旧方法？",
};
chapterWrapUps[7] = {
  ...chapterWrapUps[7],
  takeawayText: "已有方法可以优化参数或搜索 ISP 结构，但 AdaptiveISP 进一步实现了面向当前图像的逐阶段结构与参数决策。",
  evidenceText: "§1–2 · §4.1 · Table 1",
  nextText: "动态调整 ISP 真的比已有方法更准确吗？",
  nextChapterLabel: "§9 实验能证明什么？",
};
chapterWrapUps[8] = {
  ...chapterWrapUps[8],
  takeawayText: "AdaptiveISP 在主要检测实验中表现较好，并展现出一定泛化能力，但优势具有具体的实验范围。",
  evidenceText: "§4.1 · Table 1–3 · Fig.3–4",
  nextText: "不同图像为什么会选择不同 ISP 路线？",
  nextChapterLabel: "§10 不同图像，不同路径",
};
chapterWrapUps[9] = {
  ...chapterWrapUps[9],
  takeawayText: "不同图像子集对 ISP 路线有不同偏好；噪声、色偏和亮度条件能够解释部分选择差异。",
  evidenceText: "§4.2 · Fig.5 · Module preferences of different images",
  nextText: "AdaptiveISP 最终解决了什么问题，又有哪些没有解决？",
  nextChapterLabel: "§11 成果与边界",
};
chapterWrapUps[10] = {
  ...chapterWrapUps[10],
  takeawayText: "AdaptiveISP 通过面向检测任务的动态 ISP 决策，在性能与计算成本之间取舍，但仍存在方法与部署边界。",
  evidenceText: "§5 Conclusion · §3 Method · Table 1–5",
  nextTitle: "下一问",
  nextText: "如何将动态 ISP 进一步推广到不可微模块、完整 RAW 流程与真实设备？",
  nextChapterLabel: "→ 开放研究问题",
};

export default function App() {
  const heroTimeline = useHeroTimeline();
  const [progress, setProgress] = useState<Progress>(initial);
  const [destination, setDestination] = useState<number | null>(null);
  const hashInitialized = useRef(false);
  const unlocked = Math.min(chapters.length, progress.revealed);
  function revealNext() {
    const n = Math.min(chapters.length, progress.revealed + 1);
    setProgress((p) => ({ ...p, started: true, revealed: n }));
    setDestination(n);
    window.history.replaceState(null, "", `#chapter-${n}`);
  }
  function navigate(n: number) {
    if (n > unlocked || n < 0) return;
    if (n > 0) setProgress((p) => ({ ...p, started: true }));
    setDestination(n);
    window.history.replaceState(null, "", n === 0 ? "#top" : `#chapter-${n}`);
  }
  function complete(n: number) {
    setProgress((p) =>
      p.done.includes(n) ? p : { ...p, done: [...p.done, n] },
    );
  }
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress));
    } catch {
      /* Reading works without storage. */
    }
  }, [progress]);
  useEffect(() => {
    function readHash() {
      const h = window.location.hash;
      if (!h) return;
      const match = /^#chapter-([1-9]\d*)$/.exec(h);
      const legacyMatch = /^#s([1-9]\d*)$/.exec(h);
      const n = h === "#top" ? 0 : match ? Number(match[1]) : legacyMatch ? legacyHashChapters[Number(legacyMatch[1])] ?? -1 : -1;
      if (n >= 0 && n <= unlocked) {
        if (legacyMatch) window.history.replaceState(null, "", `#chapter-${n}`);
        if (n > 0) setProgress((p) => ({ ...p, started: true }));
        setDestination(n);
      } else {
        window.history.replaceState(null, "", "#top");
        setDestination(0);
      }
    }
    if (!hashInitialized.current) {
      readHash();
      hashInitialized.current = true;
    }
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [unlocked]);
  useEffect(() => {
    if (destination === null) return;
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(
        destination === 0 ? "top" : `chapter-${destination}`,
      );
      el?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      el?.querySelector<HTMLElement>("h1,h2")?.focus({ preventScroll: true });
      setDestination(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [destination, progress.started, unlocked]);
  return (
    <div className="app-shell inspatio-layout">
      <a className="skip-link" href="#top">
        跳到正文
      </a>
      <PptBars
        chapters={navigationChapters}
        revealed={unlocked}
        visible={progress.started}
        venue="Interactive Tutorial"
        title="AdaptiveISP: Learning an Adaptive Image Signal Processor for Object Detection"
        onNavigate={navigate}
      />
      <section id="top" className="hero">
        <div className="hero-inner">
          <div className="hero-venue">Interactive Tutorial</div>
          <h1 tabIndex={-1}>
            AdaptiveISP: Learning an Adaptive Image Signal Processor for Object
            Detection
          </h1>
          <div className="hero-sub">
            面向目标检测的自适应图像信号处理器 · NeurIPS 2024
          </div>
          <p className="hero-abs">
            同一套 ISP，真的适合每一张图像吗？
            <br />
            传统方法沿用固定处理流程；
            <b>AdaptiveISP 根据当前图像，逐步选择 ISP 模块与参数</b>
            。
          </p>
          <div className="hero-meta">
            <span className="tag">RGB 域处理</span>
            <span className="tag">自适应 ISP</span>
            <span className="tag">逐步决策</span>
            <span className="tag">目标检测</span>
          </div>
          <div className="hero-compare" ref={heroTimeline}>
            <div className="bg-side old">
              <div className="bg-side-head">传统方法</div>
              <div className="bg-side-canvas">
                <MethodScene />
              </div>
              <div className="bg-side-tag">
                <MethodLabel />
              </div>
            </div>
            <div className="bg-side new">
              <div className="bg-side-head">本文方法</div>
              <div className="bg-side-canvas">
                <MethodScene adaptive />
              </div>
              <div className="bg-side-tag">
                <MethodLabel adaptive />
              </div>
            </div>
          </div>
          <p className="hero-diagram-note">基础 RAW 域处理 → RGB 图像 → ISP 处理</p>
          {!progress.started && (
            <ChapterLoader next={1} onContinue={revealNext} />
          )}
          <details className="paper-details">
            <summary>论文信息与资源 · {chapters.length} 个渐进章节</summary>
            <p>
              Yujin Wang · Tianyi Xu · Fan Zhang · Tianfan Xue · Jinwei Gu
              <br />
              上海人工智能实验室 · 北京大学 · 香港中文大学
            </p>
            <div className="hero-meta">
              {[
                ["Paper", PAPER],
                ["PDF", PDF],
                ["Project", PROJECT],
                ["Code", CODE],
              ].map(([name, href]) => (
                <a key={name} href={href} target="_blank" rel="noreferrer">
                  {name} <ExternalLink size={14} />
                </a>
              ))}
            </div>
            <p>核心实验台、原图与证据随章可查</p>
          </details>
        </div>
      </section>
      <main className="tutorial-main">
        <div>
          {progress.started &&
            chapters.slice(0, unlocked).map((c, i) => {
              const n = i + 1,
                Widget = widgets[i];
              return (
                <section
                  id={`chapter-${n}`}
                  key={n}
                  className="chapter chap"
                  aria-labelledby={`chapter-${n}-title`}
                >
                  <header className="paper-section-header">
                    <h2 className="chap-title" id={`chapter-${n}-title`} tabIndex={-1}>
                      <span className="num">§{n}.</span>
                      {c[0]}
                      <span
                        className={`badge-tag ${n === 5 ? "trn" : n >= 7 && n <= 10 ? "inf" : "both"}`}
                      >
                        {n <= 3
                          ? "建立问题"
                          : n <= 6
                            ? "走进决策"
                            : n <= 10
                              ? "检验证据"
                              : "成果与边界"}
                      </span>
                    </h2>
                    <nav className="flow-mini" aria-label="章节导航">
                      {chapters.map((ch, j) => (
                        <Fragment key={j}>
                          {j > 0 && (
                            <span className="flow-arrow" aria-hidden="true">
                              →
                            </span>
                          )}
                          <button
                            className={`flow-step ${j + 1 === progress.revealed ? "active" : j + 1 < progress.revealed ? "done" : ""}`}
                            disabled={j + 1 > unlocked}
                            aria-current={j + 1 === n ? "step" : undefined}
                            aria-label={`第 ${j + 1} 章：${ch[0]}`}
                            onClick={() => navigate(j + 1)}
                          >
                            §{j + 1}
                          </button>
                        </Fragment>
                      ))}
                    </nav>
                    <div className="chap-bridge">
                      <div className="cb-icon" aria-hidden="true">
                        🔗
                      </div>
                      <div className="cb-body">
                        <div className="cb-title">本节作用 · {c[1]}</div>
                        <div className="cb-text">{c[2]}</div>
                      </div>
                    </div>
                  </header>
                  <ChapterModuleNumbers chapter={n}>
                    <Widget onDone={() => complete(n)} />
                  </ChapterModuleNumbers>
                  <ChapterWrapUp {...chapterWrapUps[i]} />
                  {n === progress.revealed && n < chapters.length && (
                    <ChapterLoader next={n + 1} onContinue={revealNext} />
                  )}
                </section>
              );
            })}
        </div>
        {unlocked === chapters.length && (
            <footer className="footer">
              <div>
                <strong>AdaptiveISP · PaperSkill</strong>
                <p>基于 NeurIPS 2024 正式版及附录 · 核查日期 2026-10-07</p>
              </div>
              <div>
                <a
                  href={siteAsset("audit/source-audit.md")}
                  target="_blank"
                  rel="noreferrer"
                >
                  来源审计
                </a>
                <a
                  href={siteAsset("audit/evidence-mapping.md")}
                  target="_blank"
                  rel="noreferrer"
                >
                  证据映射
                </a>
              </div>
            </footer>
        )}
      </main>
    </div>
  );
}
