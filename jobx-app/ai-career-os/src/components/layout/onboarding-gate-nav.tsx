"use client";

import Link from "next/link";
import { useState } from "react";

export type NavItem = { href: string; label: string };

export function OnboardingGateNav({
  items,
  locked,
}: {
  items: NavItem[];
  locked: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="flex h-[clamp(44px,5.2vw,48px)] max-w-[min(520px,58vw)] flex-1 items-center justify-evenly gap-0.5 overflow-x-auto rounded-full bg-white px-2 shadow-[var(--nav-shadow)] scrollbar-none">
        {items.map((item) =>
          locked ? (
            <button
              key={item.href}
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 px-1.5 py-2 text-[clamp(11px,1.3vw,14px)] font-medium tracking-[-0.01em] text-[#2e2e2e] transition hover:text-black"
            >
              {item.label}
            </button>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 px-1.5 py-2 text-[clamp(11px,1.3vw,14px)] font-medium tracking-[-0.01em] text-[#2e2e2e] transition hover:text-black"
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-gate-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#121214] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
              Almost there
            </p>
            <h2
              id="onboarding-gate-title"
              className="mt-3 font-display text-[28px] leading-tight tracking-tight text-white"
            >
              Fill your details first
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Finish onboarding — upload a resume and confirm your profile —
              before opening Dashboard, Jobs, Gaps, or Plan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setOpen(false)}
              >
                Continue setup
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
