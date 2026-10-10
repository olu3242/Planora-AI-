import type { Metadata } from "next";
import { BrandLanding } from "@/components/brand-landing";
import "./brand-landing.css";
import "./feature-cluster.css";

export const metadata: Metadata = {
  title: { absolute: "Planora | From numbers to what's next." },
  description: "Bring accounting, financial reporting, forecasting, and governed insights into one connected finance workspace.",
  icons: { icon: "/brand/planora-mark.svg" },
};

export default function Home() {
  return <BrandLanding />;
}
