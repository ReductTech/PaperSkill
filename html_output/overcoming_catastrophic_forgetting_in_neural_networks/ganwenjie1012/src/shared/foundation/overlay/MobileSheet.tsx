import type { ReactNode } from "react";
import { Drawer } from "./Drawer";

/** Drawer on wide screens; bottom sheet on narrow touch layouts. */
export function MobileSheet(props: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return <div className="rk-mobile-sheet"><Drawer {...props} /></div>;
}
