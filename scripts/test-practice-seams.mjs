// Unit tests for the practice seams extracted from index.html.
// Run: node scripts/test-practice-seams.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const bundle = html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/)[1];
const start = bundle.indexOf("function thamtoeSessionPayload(");
const end = bundle.indexOf("function Pa(){", start);
if (start < 0 || end < 0) {
  console.error("FAIL: practice seams not found in index.html");
  process.exit(1);
}
const snippet = bundle.slice(start, end);
const context = vm.createContext({ console });
vm.runInContext(snippet, context);

let failed = false;
function check(name, condition) {
  if (condition) {
    console.log(`PASS: ${name}`);
  } else {
    failed = true;
    console.error(`FAIL: ${name}`);
  }
}

const FIXED = "2026-11-24T07:30:00.000Z";

{
  const p = context.thamtoeSessionPayload("chant", 7.9, "set-1", FIXED);
  check("chant payload has the right type", p.value.type === "chant");
  check("chant payload has the right title", p.value.title === "สวดมนต์");
  check("minutes are floored", p.value.minutes === 7);
  check("date is recorded", p.value.date === FIXED);
  check(
    "key is stable for the unit",
    p.idempotency_key === "thamtoe-chant-set-1"
  );
}
{
  const p = context.thamtoeSessionPayload("meditation", 10, "med-1", FIXED);
  check("meditation payload has the right type", p.value.type === "meditation");
  check("meditation payload has the right title", p.value.title === "นั่งสมาธิ");
  check(
    "meditation key is namespaced",
    p.idempotency_key === "thamtoe-meditation-med-1"
  );
}
{
  const p = context.thamtoeSessionPayload("metta", 5, "metta-1", FIXED);
  check("metta payload has the right type", p.value.type === "metta");
  check("metta payload has the right title", p.value.title === "แผ่เมตตา");
}
{
  const p = context.thamtoeSessionPayload("chant", 0.4, "tiny", FIXED);
  check("minutes are at least one", p.value.minutes === 1);
}
{
  const a = context.thamtoeSessionPayload("chant", 5, "same", FIXED);
  const b = context.thamtoeSessionPayload("chant", 5, "same", FIXED);
  const c = context.thamtoeSessionPayload("chant", 5, "other", FIXED);
  check(
    "same unit yields the same key",
    a.idempotency_key === b.idempotency_key
  );
  check(
    "different units yield different keys",
    a.idempotency_key !== c.idempotency_key
  );
}
{
  const set = { ids: ["namo", "buddha", "metta-self", "kruad"] };
  const t = context.thamtoeMettaTarget(set);
  check(
    "keeps the active set ids",
    JSON.stringify(t.ids) === JSON.stringify(set.ids)
  );
  check("opens the set at the metta chant", t.index === 2);
}
{
  const t = context.thamtoeMettaTarget({ ids: ["namo", "buddha"] });
  check(
    "falls back to a metta-only set",
    JSON.stringify(t.ids) === '["metta"]'
  );
  check("fallback opens at index zero", t.index === 0);
}
{
  const t = context.thamtoeMettaTarget(null);
  check(
    "handles a missing set",
    JSON.stringify(t) === '{"ids":["metta"],"index":0}'
  );
}

function practiceDays(count, start = "2026-11-01T00:00:00.000Z") {
  return Array.from({ length: count }, (_, i) => ({
    value: {
      date: new Date(Date.parse(start) + i * 86400000).toISOString(),
      minutes: 1,
      type: "chant",
    },
  }));
}

{
  const m = context.thamtoeLatestMilestone(practiceDays(7));
  check("streak 7 unlocks streak-7", m === "streak-7");
}
{
  const m = context.thamtoeLatestMilestone(practiceDays(30));
  check("streak 30 unlocks streak-30", m === "streak-30");
}
{
  const m = context.thamtoeLatestMilestone(
    Array.from({ length: 100 }, () => practiceDays(1)[0])
  );
  check("100 sessions unlock sessions-100", m === "sessions-100");
}
{
  const records = [
    ...Array.from({ length: 100 }, () => practiceDays(1)[0]),
    ...practiceDays(7, "2026-11-20T00:00:00.000Z"),
  ];
  const m = context.thamtoeLatestMilestone(records);
  check("latest milestone is chosen by date", m === "streak-7");
}
{
  const m = context.thamtoeLatestMilestone([]);
  check("no records means no milestone", m === "");
}

process.exit(failed ? 1 : 0);
