import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import "@/app/landing.css";

export const metadata: Metadata = {
  title: {
    absolute: "Intelligence Designed To Evolve",
  },
  description:
    "JobX diagnoses your career state, closes skill and evidence gaps, and unlocks better opportunities — built for job seekers and career switchers.",
};

export default function HomePage() {
  return <LandingPage />;
}
