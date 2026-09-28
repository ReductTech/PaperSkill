import React from "react";
import { SignalSource as Inner } from "./problem-compare";
export function SignalSource(props: { chapterId: string; moduleId: string }) { return React.createElement(Inner, props); }
