import "dotenv/config";
import { ingestSeedJobs } from "../src/modules/jobs/ingest";

async function main() {
  const result = await ingestSeedJobs();
  console.log(JSON.stringify(result, null, 2));
  if (result.failed > 0 && result.created + result.updated === 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
