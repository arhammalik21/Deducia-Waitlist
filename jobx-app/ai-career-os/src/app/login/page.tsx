import { SiteHeader } from "@/components/layout/site-header";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="atmosphere min-h-screen">
      <SiteHeader />
      <div className="relative z-10 mx-auto flex max-w-md flex-col px-6 pb-20 pt-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Welcome back
        </p>
        <h1 className="mt-3 text-[clamp(28px,4.2vw,42px)] font-semibold tracking-[-0.03em] text-white">
          Sign in
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          Continue with Google or email to keep building your career diagnosis.
        </p>
        {params.error ? (
          <p className="mt-4 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
            Google sign-in failed: {params.error}
          </p>
        ) : null}
        <div className="panel mt-8 p-6">
          <LoginForm nextPath={params.next} />
        </div>
      </div>
    </div>
  );
}
