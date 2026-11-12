import type { ReactNode } from "react";
export type ReferenceEntry = {
  id: string;
  name: string;
  english?: string;
  page?: string;
  definition: string;
  role?: string;
  confusion?: string;
  detail?: ReactNode;
  source?: ReactNode;
  related?: string[];
};
export type TermRefLabels = {
  definition: string; paperRole: string; easyToConfuse: string; openReference: string;
};
