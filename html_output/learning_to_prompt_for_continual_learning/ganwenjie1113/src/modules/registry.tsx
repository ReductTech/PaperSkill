import type { ComponentType } from "react";
import type { WidgetProps } from "../types";
import { TaskStream, ViTPath, EncoderAttention } from "./lessons";
import { PromptTuning } from "./prompt-tuning";
import { PromptRetrieval } from "./prompt-retrieval";
import { PromptForward } from "./prompt-forward";
import { PromptLearning } from "./prompt-learning";
import { ContinualRun } from "./continual-run";
import { MethodEvidence } from "./method-evidence";

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  "task-stream": TaskStream,
  "vit-path": ViTPath,
  "encoder-attention": EncoderAttention,
  "prompt-tuning": PromptTuning,
  "prompt-retrieval": PromptRetrieval,
  "prompt-forward": PromptForward,
  "prompt-learning": PromptLearning,
  "continual-run": ContinualRun,
  "method-evidence": MethodEvidence,
};
