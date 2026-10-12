import { SiteHeader } from "@/components/layout/site-header";
import { SignupForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="atmosphere min-h-screen">
      <SiteHeader />
      <div className="relative z-10 mx-auto flex max-w-md flex-col px-6 pb-20 pt-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Get started
        </p>
        <h1 className="mt-3 text-[clamp(28px,4.2vw,42px)] font-semibold tracking-[-0.03em] text-white">
          Create your account
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          Continue with Google or email, then upload a resume — we&apos;ll build
          the rest.
        </p>
        <div className="panel mt-8 p-6">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
