"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "#home", label: "Home" },
  { href: "#product", label: "Product" },
  { href: "#case-studies", label: "Case Studies" },
  { href: "#contact", label: "Contact" },
] as const;

const STATS = [
  { icon: "<", target: 10, suffix: "", decimals: 0, label: "Career Loop Stages", delay: "0.5s" },
  { icon: "+", target: 5, suffix: "", decimals: 0, label: "Living Graphs", delay: "0.58s" },
  { icon: "*", target: 3, suffix: "", decimals: 0, label: "Gap Types", delay: "0.66s" },
  { icon: "#", target: 4, suffix: "", decimals: 0, label: "Match Stages", delay: "0.74s" },
] as const;

const LOOP = [
  "Diagnose",
  "Learn",
  "Practice",
  "Prove",
  "Unlock",
  "Match",
  "Apply",
  "Interview",
  "Get Hired",
  "Advance",
] as const;

const GRAPHS = [
  {
    name: "Career Graph",
    copy: "A living model of who you are — skills, projects, goals, and history — with provenance and confidence on every node.",
  },
  {
    name: "Skill Graph",
    copy: "Hierarchical skills with prerequisites, aliases, and proficiency: capability, evidence, recency, and confidence.",
  },
  {
    name: "Evidence Graph",
    copy: "Claims and proof stay separate. Repos, assessments, certificates, and deployments prove what you can do.",
  },
  {
    name: "Opportunity Graph",
    copy: "Jobs normalized into structured requirements — matched with explainable, multi-dimension scores.",
  },
  {
    name: "Outcome Graph",
    copy: "Applications, interviews, offers, and advancement feed the next recommendation.",
  },
] as const;

const JOURNEY = [
  {
    step: "01",
    title: "Onboard",
    copy: "Set target roles, geography, seniority, and salary. Upload a resume. Optionally connect evidence accounts.",
  },
  {
    step: "02",
    title: "Diagnose",
    copy: "Get a role-specific profile: strengths, weaknesses, opportunity count, and three gap classes.",
  },
  {
    step: "03",
    title: "Act daily",
    copy: "See top fits, almost-qualified roles, one skill mission, one proof task, and clear next steps.",
  },
  {
    step: "04",
    title: "Improve",
    copy: "Every mission, assessment, and outcome updates the graph and recalculates what unlocks next.",
  },
] as const;

const GAPS = [
  {
    title: "Skill gap",
    copy: "Knowledge or ability missing for your target roles.",
  },
  {
    title: "Evidence gap",
    copy: "You may have the skill, but proof is weak or missing.",
  },
  {
    title: "Positioning gap",
    copy: "Proof exists, but your profile does not communicate it.",
  },
] as const;

const CASES = [
  {
    title: "Backend engineer → staff track",
    copy: "Evidence from production APIs and Docker deployments closed an evidence gap and unlocked a denser set of high-fit roles.",
  },
  {
    title: "Career switcher → product role",
    copy: "Positioning rewrite grounded in real project outcomes turned vague bullets into recruiter-ready proof.",
  },
  {
    title: "Almost-qualified → interview-ready",
    copy: "One proof mission plus interview practice converted recurring weaknesses into measurable competency gains.",
  },
] as const;

const PLANS = [
  {
    name: "Free",
    price: "$0",
    blurb: "Start the diagnosis loop.",
    features: [
      "Career profile",
      "Limited diagnosis",
      "Limited opportunity matching",
      "Basic daily intelligence",
    ],
    cta: "Start your diagnosis",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    price: "Soon",
    blurb: "Deeper diagnosis and practice.",
    features: [
      "Deeper gap diagnosis",
      "More job matching",
      "Advanced resume variants",
      "Interview simulations",
      "Richer analytics",
    ],
    cta: "Start your diagnosis",
    href: "/signup",
    featured: true,
  },
  {
    name: "Career Agent",
    price: "Soon",
    blurb: "Continuous personalized missions.",
    features: [
      "Higher limits",
      "Personalized missions",
      "Advanced application support",
      "Deeper interview prep",
      "Premium intelligence",
    ],
    cta: "Start your diagnosis",
    href: "/signup",
    featured: false,
  },
] as const;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("#home");
  const [values, setValues] = useState(() => STATS.map(() => 0));
  const counted = useRef(false);
  const statsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 720) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const ids = ["home", "product", "case-studies", "contact"];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveNav(`#${visible[0].target.id}`);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

    if (reduce) {
      nodes.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((el) => observer.observe(el));

    // Safety: never leave sections invisible
    const fallback = window.setTimeout(() => {
      nodes.forEach((el) => el.classList.add("is-in"));
    }, 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = () => {
      if (counted.current) return;
      counted.current = true;

      if (reduce) {
        setValues(STATS.map((s) => s.target));
        return;
      }

      STATS.forEach((stat, i) => {
        const duration = 1500 + i * 80;
        const delay = 480 + i * 90;
        window.setTimeout(() => {
          const start = performance.now();
          const frame = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const next = stat.target * easeOutCubic(t);
            setValues((prev) => {
              const copy = [...prev];
              copy[i] = next;
              return copy;
            });
            if (t < 1) requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        }, delay);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) run();
        });
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-root">
      {/* Exact single-viewport hero from the template */}
      <section className="viewport" id="home">
        <div className="bg" aria-hidden="true">
          <video className="bg-video" autoPlay muted loop playsInline>
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        <div className="page">
          <header className="header">
            <div className="header-inner">
              <a className="logo-btn" href="#home" aria-label="JobX Home">
                <img src="/assets/logo.png?v=2" alt="" width={52} height={52} />
              </a>

              <nav className="nav-pill" aria-label="Primary">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    className={`nav-link${activeNav === item.href ? " is-active" : ""}`}
                    href={item.href}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <Link className="sign-in desktop-only" href="/login">
                Sign in
              </Link>

              <button
                className="burger"
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>

            {menuOpen ? (
              <>
                <div
                  className="menu-overlay"
                  id="menu-overlay"
                  aria-hidden="false"
                  onClick={() => setMenuOpen(false)}
                />
                <nav className="mobile-menu" id="mobile-menu" aria-label="Mobile">
                  {NAV.map((item) => (
                    <a
                      key={item.href}
                      className={`mobile-link${activeNav === item.href ? " is-active" : ""}`}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                  <Link
                    className="mobile-sign-in"
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                </nav>
              </>
            ) : null}
          </header>

          <main className="hero">
            <div className="trust anim" style={{ ["--d" as string]: "0.05s" }}>
              <div className="trust-avatars" aria-hidden="true">
                <span className="trust-avatar a1">
                  <i className="fa-brands fa-github" />
                </span>
                <span className="trust-avatar a2">
                  <i className="fa-brands fa-linkedin-in" />
                </span>
                <span className="trust-avatar a3">
                  <i className="fa-solid fa-file-lines" />
                </span>
              </div>
              <div className="trust-pill">For job seekers &amp; career switchers</div>
            </div>

            <h1 className="headline">
              <span className="headline-line" style={{ ["--d" as string]: "0.12s" }}>
                Intelligence
              </span>
              <span className="headline-line" style={{ ["--d" as string]: "0.3s" }}>
                Designed To Evolve
              </span>
            </h1>

            <p className="subhead anim" style={{ ["--d" as string]: "0.28s" }}>
              JobX diagnoses where you stand, closes real skill and evidence gaps,
              and unlocks better opportunities — with explanations you can trust.
            </p>

            <Link
              className="cta anim"
              style={{ ["--d" as string]: "0.4s" }}
              href="/signup"
            >
              Start your diagnosis
            </Link>
          </main>

          <footer className="stats" ref={statsRef}>
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="stat anim"
                style={{ ["--d" as string]: stat.delay }}
              >
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-value">
                  <span className="stat-num">{values[i].toFixed(stat.decimals)}</span>
                  <span className="stat-suffix">{stat.suffix}</span>
                </span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </footer>
        </div>
      </section>

      <div className="below">
      <section className="band" id="product">
        <div className="band-inner reveal">
          <p className="eyebrow">Product</p>
          <h2 className="band-title">Not another job board.</h2>
          <p className="band-lead">
            JobX is a persistent career intelligence system around one person.
            Jobs are an outcome. The primary object is your career state — continuously
            compared against what the market requires.
          </p>
          <p className="band-quote">
            Diagnose → Learn → Practice → Prove → Unlock → Match → Apply → Interview →
            Get Hired → Advance.
          </p>
        </div>
      </section>

      <section className="band band-alt">
        <div className="band-inner reveal">
          <p className="eyebrow">The closed loop</p>
          <h2 className="band-title">Every feature feeds the same loop.</h2>
          <p className="band-lead">
            Resume analysis, matching, learning, practice, interviews, and applications
            all read from and update one Career Graph. No disconnected AI demos.
          </p>
          <ol className="loop-track" aria-label="Career loop stages">
            {LOOP.map((stage, i) => (
              <li key={stage} className="loop-item">
                <span className="loop-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="loop-name">{stage}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band">
        <div className="band-inner reveal">
          <p className="eyebrow">Core system</p>
          <h2 className="band-title">Five graphs. One intelligence layer.</h2>
          <p className="band-lead">
            The differentiation is a closed-loop system where real evidence changes your
            profile, matching reveals gaps, practice closes them, and outcomes improve
            the next action.
          </p>
          <div className="detail-list">
            {GRAPHS.map((g) => (
              <article key={g.name} className="detail-row">
                <h3>{g.name}</h3>
                <p>{g.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band band-alt">
        <div className="band-inner reveal">
          <p className="eyebrow">How it works</p>
          <h2 className="band-title">From baseline to daily progress.</h2>
          <div className="detail-list">
            {JOURNEY.map((j) => (
              <article key={j.step} className="detail-row journey-row">
                <span className="journey-step">{j.step}</span>
                <div>
                  <h3>{j.title}</h3>
                  <p>{j.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="band-inner reveal">
          <p className="eyebrow">Gap diagnosis</p>
          <h2 className="band-title">Three classes of gap. Clear next actions.</h2>
          <p className="band-lead">
            Every recommendation includes an explanation. “Missing Docker evidence for
            37 high-fit roles” beats “Learn Docker.”
          </p>
          <div className="detail-list">
            {GAPS.map((g) => (
              <article key={g.title} className="detail-row">
                <h3>{g.title}</h3>
                <p>{g.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band band-alt" id="case-studies">
        <div className="band-inner reveal">
          <p className="eyebrow">Case Studies</p>
          <h2 className="band-title">Evidence in, opportunity unlocked.</h2>
          <p className="band-lead">
            The product success test: connect evidence, get a defensible diagnosis,
            complete a targeted action, and see better-fit opportunities — with a clear
            causal chain.
          </p>
          <div className="detail-list">
            {CASES.map((c) => (
              <article key={c.title} className="detail-row">
                <h3>{c.title}</h3>
                <p>{c.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="band-inner reveal">
          <p className="eyebrow">Pricing</p>
          <h2 className="band-title">Start free. Grow with outcomes.</h2>
          <p className="band-lead">
            Users pay for better career outcomes. Employers pay for better talent
            discovery. We never sell raw private user data.
          </p>
          <div className="pricing-grid">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`price-panel${plan.featured ? " is-featured" : ""}`}
              >
                <div className="price-top">
                  <h3>{plan.name}</h3>
                  <p className="price-amount">{plan.price}</p>
                  <p className="price-blurb">{plan.blurb}</p>
                </div>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link
                  className={plan.featured ? "cta" : "cta-ghost"}
                  href={plan.href}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band band-cta" id="contact">
        <div className="band-inner narrow reveal">
          <p className="eyebrow">Contact</p>
          <h2 className="band-title">
            A living, evidence-backed model of your abilities.
          </h2>
          <p className="band-lead">
            Close the gap through personalized learning and real practice. Prove the
            improvement. Unlock better opportunities.
          </p>
          <div className="cta-row">
            <Link className="cta" href="/signup">
              Start your diagnosis
            </Link>
            <Link className="cta-ghost" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/assets/logo.png?v=2" alt="" width={28} height={28} />
            <span>JobX</span>
          </div>
          <p>Diagnose → Learn → Practice → Prove → Unlock → Match</p>
          <div className="footer-links">
            <Link href="/signup">Sign up</Link>
            <Link href="/login">Sign in</Link>
            <a href="#product">Product</a>
            <a href="#case-studies">Case Studies</a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
