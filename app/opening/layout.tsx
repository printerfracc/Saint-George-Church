import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "افتتاح",
  robots: { index: false, follow: false },
};

export default function OpeningLayout({ children }: { children: ReactNode }) {
  return children;
}
