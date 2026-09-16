"use client";

import { useCallback, useEffect, useState } from "react";
import { learningSections, type SectionId } from "@/src/data/vista4d";
import { LearningSidebar } from "@/src/modules/LearningSidebar";
import {
  FinalSection, HeroSection, SectionEight, SectionFive, SectionFour, SectionNine,
  SectionOne, SectionSeven, SectionSix, SectionThree, SectionTwo,
} from "@/src/modules/TutorialChapters";

const chapterIds = learningSections.slice(1).map((section) => section.id);

export default function Home() {
  const [unlockedThrough, setUnlockedThrough] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("hero");
  const [interactionEpoch, setInteractionEpoch] = useState(0);
  const [progress, setProgress] = useState(0);

  const scrollTo = useCallback((id: SectionId, behavior: ScrollBehavior = "smooth") => {
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior, block: "start" }));
  }, []);

  const unlock = useCallback((chapterNumber: number, id: SectionId) => {
    setUnlockedThrough((current) => Math.max(current, chapterNumber));
    setActiveSection(id);
    window.setTimeout(() => scrollTo(id), 40);
  }, [scrollTo]);

  const restart = useCallback(() => {
    setCompleted(false);
    setUnlockedThrough(0);
    setActiveSection("hero");
    setInteractionEpoch((value) => value + 1);
    setProgress(0);
    if (window.location.hash) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const complete = useCallback(() => {
    setCompleted(true);
    setUnlockedThrough(chapterIds.length);
    setActiveSection("final");
  }, []);

  useEffect(() => {
    if (!completed && window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [completed]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
      const rendered = learningSections
        .map(({ id }, index) => ({ id, index, element: document.getElementById(id) }))
        .filter((item) => item.element && (item.index === 0 || item.index <= unlockedThrough));
      const current = rendered.filter((item) => item.element!.getBoundingClientRect().top < 220).pop();
      if (current) setActiveSection(current.id);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [unlockedThrough]);

  const reviewNavigate = (id: SectionId) => {
    if (!completed) return;
    setActiveSection(id);
    scrollTo(id);
  };

  return <div className={completed ? "tutorial-shell review-mode" : "tutorial-shell learning-mode"}>
    {completed && <LearningSidebar active={activeSection} onNavigate={reviewNavigate} onRestart={restart} />}
    <div className="reading-progress" style={{ width: `${progress}%` }} />
    <main className="tutorial-main" key={interactionEpoch}>
      <HeroSection onStart={() => unlock(1, "section-1")} started={unlockedThrough > 0} />
      {unlockedThrough >= 1 && <SectionOne onNext={() => unlock(2, "section-2")} />}
      {unlockedThrough >= 2 && <SectionTwo onNext={() => unlock(3, "section-3")} />}
      {unlockedThrough >= 3 && <SectionThree onNext={() => unlock(4, "section-4")} />}
      {unlockedThrough >= 4 && <SectionFour onNext={() => unlock(5, "section-5")} />}
      {unlockedThrough >= 5 && <SectionFive onNext={() => unlock(6, "section-6")} />}
      {unlockedThrough >= 6 && <SectionSix onNext={() => unlock(7, "section-7")} />}
      {unlockedThrough >= 7 && <SectionSeven onNext={() => unlock(8, "section-8")} />}
      {unlockedThrough >= 8 && <SectionEight onNext={() => unlock(9, "section-9")} />}
      {unlockedThrough >= 9 && <SectionNine onNext={() => unlock(10, "final")} />}
      {unlockedThrough >= 10 && <FinalSection onComplete={complete} onRestart={restart} />}
    </main>
  </div>;
}
