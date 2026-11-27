// Regression check for the shipped single-file bundle.
// Parses every inline <script> in index.html so a corrupted bundle cannot ship.
// Run: node scripts/check-index-bundle.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Script } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const scripts = [
  ...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),
].map((m) => m[1]);

let failed = false;
if (scripts.length === 0) {
  console.error("FAIL: no inline <script> blocks found in index.html");
  process.exit(1);
}

scripts.forEach((source, index) => {
  try {
    new Script(source, { filename: `index.html:inline-script-${index}` });
    console.log(`PASS: inline script ${index} parses (${source.length} chars)`);
  } catch (error) {
    failed = true;
    console.error(
      `FAIL: inline script ${index} does not parse: ${error.message}`
    );
  }
});

if (
  !scripts.some((source) =>
    /createRoot\s*\(\s*document\.getElementById\(["']root["']\)\s*\)/.test(
      source
    )
  )
) {
  failed = true;
  console.error("FAIL: no script mounts React into #root");
}

if (
  !scripts.some((source) =>
    source.includes('navigator.wakeLock.request("screen")')
  )
) {
  failed = true;
  console.error("FAIL: wake lock acquisition is missing from the bundle");
}

const removedFeatures = [
  "ตรวจตาปิดแบบจำลอง",
  "ไม่ขอสิทธิ์กล้องจริง",
  "เสียงสวดจำลอง",
  "เล่นเสียง",
  '_byType("metta")',
];
for (const label of removedFeatures) {
  if (html.includes(label)) {
    failed = true;
    console.error(
      `FAIL: removed feature still present in index.html: ${label}`
    );
  }
}

const requiredFeatures = [
  "thamtoeSessionPayload(",
  "thamtoeChantMinutes(",
  "thamtoeMettaTarget(",
  "thamtoeLatestMilestone(",
  "ไปนั่งสมาธิ",
  "ไปหน้าบทสวด",
  "ความสม่ำเสมอ",
];
for (const label of requiredFeatures) {
  if (!html.includes(label)) {
    failed = true;
    console.error(`FAIL: expected feature missing from index.html: ${label}`);
  }
}

process.exit(failed ? 1 : 0);
