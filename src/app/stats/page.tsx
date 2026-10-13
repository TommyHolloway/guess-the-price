import type { Metadata } from "next";
import StatsView from "@/components/StatsView";

export const metadata: Metadata = { title: "Your stats · Guess the Price" };

export default function StatsPage() {
  return <StatsView />;
}
