import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Planora", template: "%s | Planora" },
  description: "Governed financial planning, analysis, and decision intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
