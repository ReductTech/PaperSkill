import React from "react";
import { ProgressNavigation } from "./presentation/ProgressNavigation";
import { useStoryNavigation } from "./presentation/useStoryNavigation";
import {
  HeroSection,
} from "./presentation/sections";
import { MentalModelSection } from "./presentation/MentalModelSection";
import { TemporalAlignmentSection } from "./presentation/TemporalAlignmentSection";
import { ActionSpaceAlignmentSection } from "./presentation/ActionSpaceAlignmentSection";
import { TrainTestAlignmentSection } from "./presentation/TrainTestAlignmentSection";
import { FinalSynthesisSection } from "./presentation/FinalSynthesisSection";
import { STORY_SECTIONS } from "./presentation/ProgressNavigation";
import { PptBars } from "./components/PptBars";

export default function App() {
  const { active, goTo } = useStoryNavigation(6);
  return (
    <div className="story-app">
      <ProgressNavigation active={active} onSelect={goTo} />
      <main>
        <HeroSection onStart={() => goTo(1)} />
        <MentalModelSection />
        <TemporalAlignmentSection />
        <ActionSpaceAlignmentSection />
        <TrainTestAlignmentSection />
        <FinalSynthesisSection />
      </main>
      <PptBars
        sections={STORY_SECTIONS}
        active={active}
        onSelect={goTo}
        venue="ABot-M0.5"
        title="Unified Mobility-and-Manipulation World Action Model"
      />
    </div>
  );
}
