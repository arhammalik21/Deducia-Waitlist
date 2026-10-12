function PlaceholderPage({
  title,
  milestone,
  description,
}: {
  title: string;
  milestone: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {milestone}
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-white">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-[var(--muted)]">{description}</p>
    </div>
  );
}

export default PlaceholderPage;
