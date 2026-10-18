import type { Metadata } from "next";
import { ApprovedLanding } from "@/components/approved-landing";
import "./approved-landing.css";

export const metadata: Metadata = {
  title: { absolute: "Planora | Your finance operations. Finally working together." },
  description: "Bring accounting, financial reporting, forecasting, and governed insights into one connected finance workspace.",
  icons: { icon: "/brand/planora-mark.svg" },
};

export default function Home() {
  return <ApprovedLanding />;
}
