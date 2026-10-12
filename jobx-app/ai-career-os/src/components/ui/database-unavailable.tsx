import Link from "next/link";

export default function DatabaseUnavailablePage({
  message,
}: {
  message?: string;
}) {
  return (
    <div className="atmosphere flex min-h-screen items-center justify-center px-6 py-16">
      <div className="relative z-10 w-full max-w-xl panel p-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Database offline
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-white">
          We can&apos;t reach your app database
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          {message ??
            "You are signed in, but Postgres rejected the connection. Start the local database, then refresh."}
        </p>
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-[var(--trust-text)]">
          <li>Open Docker Desktop and wait until it is running.</li>
          <li>
            In the project folder run{" "}
            <code className="text-white">docker compose up -d</code>
          </li>
          <li>
            Run <code className="text-white">npm run db:migrate</code>
          </li>
          <li>
            Confirm <code className="text-white">DATABASE_URL</code> in{" "}
            <code className="text-white">.env</code> is{" "}
            <code className="text-white">
              postgresql://career:career@localhost:5433/ai_career_os?schema=public
            </code>
          </li>
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="btn-primary">
            Try again
          </Link>
          <Link href="/" className="btn-ghost">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
