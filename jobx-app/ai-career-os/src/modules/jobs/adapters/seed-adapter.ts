import type { JobSourceAdapter, RawJobPayload } from "@/modules/jobs/adapters/types";

/**
 * Controlled fixture feed for Milestone 4.
 * Replace / extend with Remotive, Greenhouse, Lever, etc. later.
 */
const SEED_JOBS: RawJobPayload[] = [
  {
    externalId: "seed-be-001",
    title: "Backend Engineer",
    company: "Northwind Labs",
    location: "Remote — US / Canada",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    seniority: "MID",
    salaryMin: 130000,
    salaryMax: 165000,
    salaryCurrency: "USD",
    requiredSkills: ["TypeScript", "Node.js", "PostgreSQL", "REST APIs"],
    preferredSkills: ["Docker", "AWS", "GraphQL"],
    applicationUrl: "https://example.com/jobs/northwind-backend",
    postedAt: "2026-09-20",
    description: `We're hiring a Backend Engineer to build APIs that power our career diagnostics product.

Required:
- Strong TypeScript and Node.js
- PostgreSQL schema design and query performance
- REST API design, authentication, and testing

Nice to have:
- Docker and AWS
- GraphQL
- Experience with Prisma or similar ORMs

You'll own services end-to-end with a small team. Remote-friendly across US and Canada.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-fe-001",
    title: "Frontend Engineer",
    company: "Cascade Studio",
    location: "New York, NY (Hybrid)",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    seniority: "MID",
    salaryMin: 125000,
    salaryMax: 155000,
    salaryCurrency: "USD",
    requiredSkills: ["JavaScript", "TypeScript", "React", "CSS", "HTML"],
    preferredSkills: ["Next.js", "Accessibility", "Design Systems"],
    applicationUrl: "https://example.com/jobs/cascade-frontend",
    postedAt: "2026-09-28",
    description: `Cascade Studio needs a Frontend Engineer to craft fast, accessible product UI.

Must have:
- JavaScript / TypeScript
- React
- Solid CSS and HTML fundamentals

Preferred:
- Next.js App Router
- Accessibility (WCAG)
- Design systems

Hybrid in New York, 2–3 days on-site.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-fs-001",
    title: "Full Stack Engineer",
    company: "Harbor Analytics",
    location: "Remote",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    seniority: "SENIOR",
    salaryMin: 150000,
    salaryMax: 190000,
    salaryCurrency: "USD",
    requiredSkills: [
      "TypeScript",
      "React",
      "Node.js",
      "PostgreSQL",
      "System Design",
    ],
    preferredSkills: ["Next.js", "Docker", "CI/CD"],
    applicationUrl: "https://example.com/jobs/harbor-fullstack",
    postedAt: "2026-10-01",
    description: `Senior Full Stack Engineer for a B2B analytics platform.

Required skills: TypeScript, React, Node.js, PostgreSQL, System Design.
Preferred: Next.js, Docker, CI/CD.

You will lead features across the stack and mentor mid-level engineers. Fully remote.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-data-001",
    title: "Data Engineer",
    company: "Lattice Metrics",
    location: "Austin, TX",
    workMode: "ONSITE",
    employmentType: "FULL_TIME",
    seniority: "MID",
    salaryMin: 135000,
    salaryMax: 170000,
    salaryCurrency: "USD",
    requiredSkills: ["Python", "SQL", "Airflow", "AWS"],
    preferredSkills: ["dbt", "Spark", "Kafka"],
    applicationUrl: "https://example.com/jobs/lattice-data",
    postedAt: "2026-09-15",
    description: `Data Engineer to own reliable pipelines for product analytics.

Required: Python, SQL, Airflow, AWS.
Nice to have: dbt, Spark, Kafka.

On-site in Austin.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-ml-001",
    title: "Machine Learning Engineer",
    company: "SignalForge",
    location: "Remote — Worldwide",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    seniority: "SENIOR",
    salaryMin: 160000,
    salaryMax: 210000,
    salaryCurrency: "USD",
    requiredSkills: [
      "Python",
      "Machine Learning",
      "PyTorch",
      "SQL",
      "Statistics",
    ],
    preferredSkills: ["MLOps", "Docker", "AWS"],
    applicationUrl: "https://example.com/jobs/signalforge-ml",
    postedAt: "2026-09-22",
    description: `Senior ML Engineer building ranking and recommendation models.

Must have: Python, Machine Learning, PyTorch, SQL, Statistics.
Preferred: MLOps, Docker, AWS.

Remote worldwide. Strong evidence of shipped models required.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-devops-001",
    title: "DevOps Engineer",
    company: "Orbit Cloud",
    location: "Berlin, Germany (Hybrid)",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    seniority: "MID",
    salaryMin: 70000,
    salaryMax: 95000,
    salaryCurrency: "EUR",
    requiredSkills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux"],
    preferredSkills: ["Terraform", "Python", "Observability"],
    applicationUrl: "https://example.com/jobs/orbit-devops",
    postedAt: "2026-09-18",
    description: `DevOps Engineer for a multi-tenant SaaS platform.

Required: AWS, Docker, Kubernetes, CI/CD, Linux.
Preferred: Terraform, Python, Observability tooling.

Hybrid Berlin.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-pm-001",
    title: "Product Manager",
    company: "Brightpath",
    location: "San Francisco, CA",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
    seniority: "MID",
    salaryMin: 140000,
    salaryMax: 175000,
    salaryCurrency: "USD",
    requiredSkills: [
      "Roadmapping",
      "User Research",
      "Analytics",
      "Communication",
    ],
    preferredSkills: ["SQL", "A/B Testing"],
    applicationUrl: "https://example.com/jobs/brightpath-pm",
    postedAt: "2026-10-02",
    description: `Product Manager for career tooling used by job seekers.

Required: Roadmapping, User Research, Analytics, Communication.
Preferred: SQL, A/B Testing.

Hybrid SF.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-be-jr-001",
    title: "Junior Backend Developer",
    company: "Pinecone Apps",
    location: "Remote — India",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    seniority: "JUNIOR",
    salaryMin: 800000,
    salaryMax: 1400000,
    salaryCurrency: "INR",
    requiredSkills: ["JavaScript", "Node.js", "SQL", "REST APIs"],
    preferredSkills: ["TypeScript", "MongoDB", "Docker"],
    applicationUrl: "https://example.com/jobs/pinecone-junior-be",
    postedAt: "2026-09-30",
    description: `Junior Backend Developer — great first industry role.

Required: JavaScript, Node.js, SQL, REST APIs.
Nice to have: TypeScript, MongoDB, Docker.

Fully remote in India. Mentorship included.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-contract-001",
    title: "Contract React Developer",
    company: "Velvet Agency",
    location: "Remote",
    workMode: "REMOTE",
    employmentType: "CONTRACT",
    seniority: "SENIOR",
    salaryMin: 70,
    salaryMax: 95,
    salaryCurrency: "USD",
    requiredSkills: ["React", "TypeScript", "CSS", "Next.js"],
    preferredSkills: ["Design Systems", "Storybook"],
    applicationUrl: "https://example.com/jobs/velvet-react-contract",
    postedAt: "2026-10-03",
    description: `3–6 month contract for a Senior React Developer.

Required: React, TypeScript, CSS, Next.js.
Preferred: Design Systems, Storybook.

Hourly USD. Remote.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-lead-001",
    title: "Lead Software Engineer",
    company: "Summit Health Tech",
    location: "Chicago, IL (On-site)",
    workMode: "ONSITE",
    employmentType: "FULL_TIME",
    seniority: "LEAD",
    salaryMin: 175000,
    salaryMax: 220000,
    salaryCurrency: "USD",
    requiredSkills: [
      "System Design",
      "TypeScript",
      "Leadership",
      "PostgreSQL",
      "AWS",
    ],
    preferredSkills: ["Kubernetes", "Mentoring", "Healthcare Domain"],
    applicationUrl: "https://example.com/jobs/summit-lead",
    postedAt: "2026-09-12",
    description: `Lead Software Engineer for clinical workflow products.

Required: System Design, TypeScript, Leadership, PostgreSQL, AWS.
Preferred: Kubernetes, Mentoring, Healthcare Domain knowledge.

On-site Chicago.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-sre-001",
    title: "Site Reliability Engineer",
    company: "Packetline",
    location: "Remote — EU",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    seniority: "SENIOR",
    salaryMin: 90000,
    salaryMax: 120000,
    salaryCurrency: "EUR",
    requiredSkills: [
      "Linux",
      "Kubernetes",
      "Observability",
      "CI/CD",
      "Python",
    ],
    preferredSkills: ["Go", "Terraform", "AWS"],
    applicationUrl: "https://example.com/jobs/packetline-sre",
    postedAt: "2026-09-25",
    description: `SRE focused on reliability for high-throughput APIs.

Must have: Linux, Kubernetes, Observability, CI/CD, Python.
Preferred: Go, Terraform, AWS.

Remote within the EU.`,
    raw: { fixture: true },
  },
  {
    externalId: "seed-ai-001",
    title: "AI Platform Engineer",
    company: "Context Layer",
    location: "Remote",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    seniority: "MID",
    salaryMin: 145000,
    salaryMax: 185000,
    salaryCurrency: "USD",
    requiredSkills: [
      "Python",
      "TypeScript",
      "Docker",
      "PostgreSQL",
      "REST APIs",
    ],
    preferredSkills: ["OpenAI API", "LangChain", "AWS", "Vector Databases"],
    applicationUrl: "https://example.com/jobs/context-ai-platform",
    postedAt: "2026-10-04",
    description: `AI Platform Engineer wiring LLM features into production apps.

Required: Python, TypeScript, Docker, PostgreSQL, REST APIs.
Preferred: OpenAI API, LangChain, AWS, Vector Databases.

Remote. Strong shipping evidence preferred over research-only backgrounds.`,
    raw: { fixture: true },
  },
];

export class SeedJobAdapter implements JobSourceAdapter {
  readonly sourceName = "seed";

  async fetchJobs(): Promise<RawJobPayload[]> {
    return SEED_JOBS.map((job) => ({
      ...job,
      raw: { ...job.raw, source: "seed" },
    }));
  }
}
