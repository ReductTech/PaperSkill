import { FixedLab, ModuleLab, PipelineLab } from "../components/Labs";
import { ChapterTwo } from "../components/ChapterTwo";
import { ChapterFour } from "../components/ChapterFour";
import { ChapterFive } from "../components/ChapterFive";
import { ChapterSeven } from "../components/ChapterSeven";
import { ChapterEight } from "../components/ChapterEight";
import { ChapterNine } from "../components/ChapterNine";
import { ChapterTen } from "../components/ChapterTen";
import { ChapterEleven } from "../components/ChapterEleven";

// Same chapter-to-widget order used by App.tsx.
export const moduleRegistry = [
  FixedLab, ChapterTwo, ModuleLab, ChapterFour, ChapterFive, PipelineLab,
  ChapterSeven, ChapterEight, ChapterNine, ChapterTen, ChapterEleven,
] as const;
