import DERTrainingStep from "./DERTrainingStep";
import Augmentation from "./Augmentation";
import DERPlus from "./DERPlus";
import Workbench from "./Workbench";
import Evidence from "./Evidence";
import type { ComponentType } from "react";
import type { WidgetProps } from "../types";
import ReplayEntry from "./ReplayEntry";
import ResponseComparison from "./MechanismScenes";
import Reservoir from "./Reservoir";
import MemorySnapshot from "./MemorySnapshot";

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {};
widgetRegistry["der-replay-entry"] = ReplayEntry;
widgetRegistry["der-response-comparison"] = ResponseComparison;

widgetRegistry["der-memory-snapshot"] = MemorySnapshot;

widgetRegistry["der-reservoir"] = Reservoir;

widgetRegistry["der-training-step"] = DERTrainingStep;
widgetRegistry["der-augmentation"] = Augmentation;
widgetRegistry["der-plus"] = DERPlus;
widgetRegistry["der-workbench"] = Workbench;
widgetRegistry["der-evidence"] = Evidence;
