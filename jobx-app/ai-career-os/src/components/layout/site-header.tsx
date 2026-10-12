import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env.public";
import { signOutAction } from "@/modules/auth/actions";
import { ensureAppUser } from "@/modules/auth/user-service";
import { OnboardingGateNav } from "@/components/layout/onboarding-gate-nav";

const guestNav = [
  { href: "/#product", label: "Product" },
  { href: "/#case-studies", label: "Case Studies" },
  { href: "/#contact", label: "Contact" },
];

const appNav = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/jobs", label: "Jobs" },
  { href: "/app/gaps", label: "Gaps" },
  { href: "/app/plan", label: "Plan" },
];

export async function SiteHeader({ className }: { className?: string }) {
  let signedIn = false;
  let onboardingComplete = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      signedIn = Boolean(user);
      if (signedIn) {
        try {
          const appUser = await ensureAppUser();
          onboardingComplete =
            appUser?.profile?.onboardingStatus === "COMPLETED";
        } catch {
          onboardingComplete = false;
        }
      }
    } catch {
      signedIn = false;
    }
  }

  const homeHref = !signedIn
    ? "/"
    : onboardingComplete
      ? "/app"
      : "/onboarding";

  return (
    <header
      className={cn(
        "relative z-20 flex items-center justify-center px-[clamp(14px,3vw,32px)] py-[clamp(16px,2.4vh,28px)]",
        className,
      )}
    >
      <div className="flex w-full max-w-[820px] items-center justify-center gap-[clamp(14px,2.4vw,24px)]">
        <Link
          href={homeHref}
          aria-label="JobX Home"
          className="grid h-[clamp(40px,4.4vw,46px)] w-[clamp(40px,4.4vw,46px)] shrink-0 place-items-center transition hover:scale-[1.04]"
        >
          <img
            src="/assets/logo.png?v=2"
            alt=""
            width={52}
            height={52}
            className="h-full w-full object-contain"
          />
        </Link>

        {signedIn ? (
          <OnboardingGateNav
            items={appNav}
            locked={!onboardingComplete}
          />
        ) : (
          <nav className="hidden h-[clamp(44px,5.2vw,48px)] flex-1 items-center justify-evenly rounded-full bg-white px-2 shadow-[var(--nav-shadow)] md:flex md:max-w-[520px]">
            {guestNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-1.5 py-2 text-[clamp(12px,1.3vw,14px)] font-medium tracking-[-0.01em] text-[#2e2e2e] transition hover:text-black"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {signedIn ? (
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex h-[clamp(44px,5.2vw,48px)] items-center justify-center rounded-full bg-[var(--pill-dark)] px-5 text-[clamp(13px,1.4vw,15px)] font-medium text-[var(--sign-in-text)] shadow-[var(--nav-shadow)] transition hover:-translate-y-px hover:bg-[#323234] hover:text-white"
            >
              Log out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-[clamp(44px,5.2vw,48px)] items-center justify-center rounded-full bg-[var(--pill-dark)] px-5 text-[clamp(13px,1.4vw,15px)] font-medium text-[var(--sign-in-text)] shadow-[var(--nav-shadow)] transition hover:-translate-y-px hover:bg-[#323234] hover:text-white"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
