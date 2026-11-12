import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const ASSETS_DIR = "dist/assets";
const BUDGET_FILE = "bundle-budget.json";

const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));
const files = readdirSync(ASSETS_DIR).filter((file) => file.endsWith(".js"));

if (files.length === 0) {
  console.error(`No JS files found in ${ASSETS_DIR}. Run "pnpm build" first.`);
  process.exit(1);
}

const chunks = files.map((file) => {
  const contents = readFileSync(join(ASSETS_DIR, file));
  return {
    file,
    raw: contents.length,
    gzip: gzipSync(contents).length,
  };
});

const entry = chunks.find((chunk) => /^index-.*\.js$/.test(chunk.file));

if (!entry) {
  console.error(`Could not find the entry chunk (index-*.js) in ${ASSETS_DIR}.`);
  process.exit(1);
}

const cssFiles = readdirSync(ASSETS_DIR).filter((file) => file.endsWith(".css"));
const cssGzip = cssFiles.reduce(
  (sum, file) => sum + gzipSync(readFileSync(join(ASSETS_DIR, file))).length,
  0,
);

const routeChunks = chunks.filter((chunk) => chunk !== entry);
const totalGzip = chunks.reduce((sum, chunk) => sum + chunk.gzip, 0);
const largestRouteChunk = routeChunks.reduce(
  (largest, chunk) => (chunk.gzip > largest.gzip ? chunk : largest),
  { file: "-", raw: 0, gzip: 0 },
);

const rows = [
  ["entry", entry.file, entry.gzip, budget.entryGzip],
  [
    "largest route chunk",
    largestRouteChunk.file,
    largestRouteChunk.gzip,
    budget.routeChunkGzip,
  ],
  ["total JS", `${chunks.length} chunks`, totalGzip, budget.totalGzip],
  ["CSS", `${cssFiles.length} files`, cssGzip, budget.cssGzip],
];

let failed = false;

console.log("\nBundle budget (gzip)\n");
for (const [label, detail, actual, limit] of rows) {
  const ok = actual <= limit;
  failed ||= !ok;
  const percent = limit > 0 ? Math.round((actual / limit) * 100) : 0;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label.padEnd(20)} ${String(actual).padStart(7)} B / ${String(limit).padStart(7)} B (${percent}%)  ${detail}`,
  );
}

if (failed) {
  console.error("\nBundle budget exceeded. Run \"ANALYZE=1 pnpm build\" to inspect dist/stats.html.\n");
  process.exit(1);
}

console.log("\nBundle budget OK.\n");
