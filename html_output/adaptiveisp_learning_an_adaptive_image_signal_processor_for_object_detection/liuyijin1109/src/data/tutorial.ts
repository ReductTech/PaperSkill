import { chapters } from "../content";
import { moduleRegistry } from "../modules/registry";

// PaperSkill metadata points to the existing chapter text and rendered widgets.
export const tutorial = {
  chapters: chapters.map((chapter, index) => ({
    kind: "chapter" as const,
    id: `chapter-${index + 1}`,
    title: chapter[0],
    subtitle: chapter[1],
    takeaway: chapter[2],
    evidence: chapter[4],
    modules: [{ kind: "module" as const, id: `chapter-${index + 1}`, component: moduleRegistry[index] }],
  })),
};
