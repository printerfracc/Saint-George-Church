import type { ReactNode } from "react";

export default function HomeFadeIn({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
