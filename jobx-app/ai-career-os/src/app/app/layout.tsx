import { AppSidebar } from "@/components/layout/app-sidebar";
import DatabaseUnavailablePage from "@/components/ui/database-unavailable";
import {
  DatabaseUnavailableError,
  ensureAppUser,
} from "@/modules/auth/user-service";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await ensureAppUser();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return <DatabaseUnavailablePage message={error.message} />;
    }
    throw error;
  }

  if (!user) {
    redirect("/login?next=/app");
  }

  if (user.profile?.onboardingStatus !== "COMPLETED") {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen bg-black">
      <AppSidebar
        userEmail={user.email}
        userName={user.profile?.fullName ?? user.email.split("@")[0]}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
