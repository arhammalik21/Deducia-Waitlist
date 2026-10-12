import Link from "next/link";
import { RebuildGraphButton } from "@/components/career/rebuild-graph-button";
import type { getCareerGraphView } from "@/modules/career-graph/service";

type GraphData = Awaited<ReturnType<typeof getCareerGraphView>>;

const KIND_STYLE: Record<
  GraphData["nodes"][number]["kind"],
  { ring: string; label: string }
> = {
  person: { ring: "border-white bg-white text-black", label: "You" },
  skill: { ring: "border-[#7dd3a0]/50 bg-[#7dd3a0]/10 text-[#b8f0cc]", label: "Skill" },
  experience: {
    ring: "border-[#8cb4ff]/50 bg-[#8cb4ff]/10 text-[#c5d9ff]",
    label: "Experience",
  },
  project: {
    ring: "border-[#f0c674]/50 bg-[#f0c674]/10 text-[#f5dba0]",
    label: "Project",
  },
  evidence: {
    ring: "border-[#d4a5ff]/50 bg-[#d4a5ff]/10 text-[#e6ccff]",
    label: "Evidence",
  },
  education: {
    ring: "border-[#9ad7e5]/50 bg-[#9ad7e5]/10 text-[#c7ebf3]",
    label: "Education",
  },
};

export function GraphView({ data }: { data: GraphData }) {
  const empty = data.nodes.length <= 1;

  const skills = data.nodes.filter((n) => n.kind === "skill");
  const experiences = data.nodes.filter((n) => n.kind === "experience");
  const projects = data.nodes.filter((n) => n.kind === "project");
  const education = data.nodes.filter((n) => n.kind === "education");
  const evidence = data.nodes.filter((n) => n.kind === "evidence");
  const supportEdges = data.edges.filter((e) => e.kind === "supports");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Career Graph
          </p>
          <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-white">
            How your evidence supports your skills
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[var(--muted)]">
            Relational view stored in PostgreSQL — person, roles, projects, and
            skills linked through evidence. Not a separate graph database.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link href="/app/profile" className="btn-ghost">
            Career Profile
          </Link>
          {data.latestResume ? <RebuildGraphButton /> : null}
        </div>
      </div>

      {empty ? (
        <section className="panel mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">Graph is empty</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {data.latestResume
              ? "Rebuild from your uploaded resume to populate nodes and links."
              : "Upload a resume first, then we will build this graph."}
          </p>
          <div className="mt-4">
            {data.latestResume ? (
              <RebuildGraphButton label="Build Career Graph" />
            ) : (
              <Link href="/onboarding" className="btn-primary">
                Upload resume
              </Link>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="panel mt-8 overflow-hidden p-6">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Center
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {data.nodes
                .filter((n) => n.kind === "person")
                .map((n) => (
                  <NodeChip key={n.id} node={n} />
                ))}
            </div>

            <GraphBand title="Skills" nodes={skills} />
            <GraphBand title="Experience" nodes={experiences} />
            <GraphBand title="Projects" nodes={projects} />
            <GraphBand title="Education" nodes={education} />
            {evidence.length > 0 ? (
              <GraphBand title="Other evidence" nodes={evidence} />
            ) : null}
          </section>

          <section className="panel mt-6 p-6">
            <h2 className="text-lg font-semibold text-white">
              Skill support links
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {supportEdges.length} evidence → skill connections
            </p>
            <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {supportEdges.length === 0 ? (
                <li className="text-sm text-[var(--muted)]">
                  No explicit skill links yet. Rebuild with AI extraction for
                  richer edges, or add technologies on projects.
                </li>
              ) : (
                supportEdges.slice(0, 40).map((edge) => {
                  const from = data.nodes.find((n) => n.id === edge.from);
                  const to = data.nodes.find((n) => n.id === edge.to);
                  if (!from || !to) return null;
                  return (
                    <li
                      key={edge.id}
                      className="flex flex-wrap items-center gap-2 text-sm text-[var(--trust-text)]"
                    >
                      <span className="text-white">{from.label}</span>
                      <span className="text-[var(--muted)]">→</span>
                      <span className="text-[#b8f0cc]">{to.label}</span>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            {Object.entries(KIND_STYLE).map(([kind, style]) => (
              <span key={kind} className="inline-flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full border ${style.ring}`}
                />
                {style.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GraphBand({
  title,
  nodes,
}: {
  title: string;
  nodes: GraphData["nodes"];
}) {
  if (nodes.length === 0) return null;
  return (
    <div className="mt-8 border-t border-[var(--border)] pt-6">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {nodes.map((n) => (
          <NodeChip key={n.id} node={n} />
        ))}
      </div>
    </div>
  );
}

function NodeChip({ node }: { node: GraphData["nodes"][number] }) {
  const style = KIND_STYLE[node.kind];
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${style.ring}`}
      title={node.sublabel}
    >
      <p className="text-sm font-medium">{node.label}</p>
      {node.sublabel ? (
        <p className="mt-0.5 text-[11px] opacity-70">{node.sublabel}</p>
      ) : null}
    </div>
  );
}
