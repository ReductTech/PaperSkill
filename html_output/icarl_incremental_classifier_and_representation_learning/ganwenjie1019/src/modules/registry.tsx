import type { ComponentType } from "react";
import type { PageId } from "../data/tutorial";
import { PageOne } from "../pages/PageOne";
import { PageTwo } from "../pages/PageTwo";
import { PageThree } from "../pages/PageThree";
import { PageFour } from "../pages/PageFour";
import { PageFive } from "../pages/PageFive";
import { PageSix } from "../pages/PageSix";
import { PageSeven } from "../pages/PageSeven";
import { PageEight } from "../pages/PageEight";
import { PageNine } from "../pages/PageNine";

export type RegisteredPageProps = {
  navigateToPage: (pageId: PageId) => void;
};

export const widgetRegistry = {} as Record<PageId, ComponentType<RegisteredPageProps>>;

widgetRegistry["page-1"] = ({ navigateToPage }) => <PageOne onOpenPageTwo={() => navigateToPage("page-2")} />;
widgetRegistry["page-2"] = ({ navigateToPage }) => <PageTwo onOpenPageThree={() => navigateToPage("page-3")} />;
widgetRegistry["page-3"] = ({ navigateToPage }) => <PageThree onContinue={() => navigateToPage("page-4")} />;
widgetRegistry["page-4"] = ({ navigateToPage }) => <PageFour onContinue={() => navigateToPage("page-5")} />;
widgetRegistry["page-5"] = ({ navigateToPage }) => <PageFive onContinue={() => navigateToPage("page-6")} />;
widgetRegistry["page-6"] = ({ navigateToPage }) => <PageSix onContinue={() => navigateToPage("page-7")} />;
widgetRegistry["page-7"] = ({ navigateToPage }) => <PageSeven onContinue={() => navigateToPage("page-8")} />;
widgetRegistry["page-8"] = ({ navigateToPage }) => <PageEight onContinue={() => navigateToPage("page-9")} />;
widgetRegistry["page-9"] = ({ navigateToPage }) => <PageNine onExit={() => navigateToPage("page-8")} />;
