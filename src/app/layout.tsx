import type { Metadata } from "next";
import "./globals.css";
import "./planora-brand.css";

export const metadata: Metadata = {
  title: { default: "Planora", template: "%s | Planora" },
  description: "Governed financial planning, analysis, and decision intelligence.",
  icons: { icon: "/brand/planora-mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
