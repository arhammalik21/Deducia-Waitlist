import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import DatabaseUnavailablePage from "@/components/ui/database-unavailable";
import { DatabaseUnavailableError } from "@/modules/auth/user-service";
import { getOnboardingState } from "@/modules/onboarding/service";
import "./onboarding.css";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  let state;
  try {
    state = await getOnboardingState();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return <DatabaseUnavailablePage message={error.message} />;
    }
    throw error;
  }

  if (!state) {
    redirect("/login?next=/onboarding");
  }

  const isComplete = state.profile?.onboardingStatus === "COMPLETED";

  return (
    <div className="onboarding-shell">
      <video
        className="onboarding-video"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
          type="video/mp4"
        />
      </video>
      <div className="onboarding-veil" aria-hidden="true" />

      <div className="onboarding-content">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-4">
          <div className="onboarding-card p-6 sm:p-8">
            <p className="onboarding-eyebrow">
              {isComplete ? "Update profile" : "Get set up"}
            </p>
            <h1 className="onboarding-title">
              {isComplete
                ? "Update your career targets"
                : "Start with your resume"}
            </h1>
            <p className="onboarding-lead">
              Upload a resume first. We extract what we can, then you confirm
              and fill only the gaps — role preferences, salary, and anything we
              missed.
            </p>
            {state.latestResume ? (
              <p className="onboarding-meta">
                Current resume on file: {state.latestResume.fileName}
              </p>
            ) : null}

            <div className="mt-8">
              <OnboardingForm
                defaults={{
                  fullName: state.profile?.fullName,
                  targetRole: state.primaryRole?.title,
                  geography: state.profile?.geography,
                  workPreference: state.profile?.workPreference,
                  experienceLevel: state.profile?.experienceLevel,
                  salaryMin: state.profile?.salaryTargetMin,
                  salaryMax: state.profile?.salaryTargetMax,
                  industry: state.profile?.industryPreference,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
