import type { ChapterDef, TutorialData } from "../../types";
import { tutorial } from "../../data/tutorial.ts";
import { LWF_CHAPTERS } from "./chapters.ts";

export const LWF_UPSTREAM_CHAPTERS: ChapterDef[] = tutorial.chapters;

export const LWF_UPSTREAM_ADAPTER: Pick<TutorialData, "chapters"> & {
  chapterCount: number;
  readyChapterCount: number;
  activeModuleCount: number;
  chaptersWithMultipleModules: number;
  upstreamReady: boolean;
} = {
  chapters: LWF_UPSTREAM_CHAPTERS,
  chapterCount: LWF_UPSTREAM_CHAPTERS.length,
  readyChapterCount: LWF_CHAPTERS.filter((chapter) => chapter.status === "ready").length,
  activeModuleCount: LWF_UPSTREAM_CHAPTERS.reduce((count, chapter) => count + chapter.modules.length, 0),
  chaptersWithMultipleModules: LWF_UPSTREAM_CHAPTERS.filter((chapter) => chapter.modules.length >= 2).length,
  upstreamReady: LWF_UPSTREAM_CHAPTERS.length === 8 && LWF_CHAPTERS.every((chapter) => chapter.status === "ready"),
};
