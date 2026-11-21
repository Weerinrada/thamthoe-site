// Unit test for the inline wake-lock helper extracted from index.html.
// Run: node scripts/test-wake-lock.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const bundle = html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/)[1];
const start = bundle.indexOf("var thamtoeWakeHandle=null;");
const end = bundle.indexOf("var Id=(e)=>", start);
if (start < 0 || end < 0) {
  console.error("FAIL: wake-lock helper not found in index.html");
  process.exit(1);
}
const snippet = bundle.slice(start, end);

function makeBrowser({ supported = true, fail = false } = {}) {
  const listeners = {};
  const sentinel = {
    released: false,
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
    async release() {
      if (this.released) return;
      this.released = true;
      listeners.release?.();
    },
  };
  const state = { requests: 0, sentinel, listeners };
  const navigator = supported
    ? {
        wakeLock: {
          async request(type) {
            state.requests++;
            if (type !== "screen") throw new Error(`unexpected type: ${type}`);
            if (fail) throw new Error("denied");
            return sentinel;
          },
        },
      }
    : {};
  return { navigator, state };
}

let failed = false;
function check(name, condition) {
  if (condition) {
    console.log(`PASS: ${name}`);
  } else {
    failed = true;
    console.error(`FAIL: ${name}`);
  }
}

function load(navigator) {
  const context = vm.createContext({ navigator, console });
  vm.runInContext(snippet, context);
  return {
    acquire: context.thamtoeWakeAcquire,
    release: context.thamtoeWakeRelease,
    handle: () => context.thamtoeWakeHandle,
  };
}

{
  const { navigator, state } = makeBrowser();
  const w = load(navigator);
  check("acquires a screen lock", (await w.acquire()) === true);
  check("requested exactly once", state.requests === 1);
  check("handle is stored", w.handle() === state.sentinel);
  check(
    "second acquire is a no-op",
    (await w.acquire()) === true && state.requests === 1
  );
  await w.release();
  check("release frees the sentinel", state.sentinel.released === true);
  check("handle cleared after release", w.handle() === null);
  await w.release();
  check("releasing twice is safe", state.requests === 1);
  check(
    "can reacquire after release",
    (await w.acquire()) === true && state.requests === 2
  );
}

{
  const { navigator } = makeBrowser({ supported: false });
  const w = load(navigator);
  check("unsupported browser returns false", (await w.acquire()) === false);
  check("no handle on unsupported browser", w.handle() === null);
}

{
  const { navigator } = makeBrowser({ fail: true });
  const w = load(navigator);
  check("denied request returns false", (await w.acquire()) === false);
  check("no handle after denied request", w.handle() === null);
}

{
  const { navigator, state } = makeBrowser();
  const w = load(navigator);
  await w.acquire();
  state.listeners.release();
  check("system release clears handle", w.handle() === null);
  check(
    "reacquires after system release",
    (await w.acquire()) === true && state.requests === 2
  );
}

process.exit(failed ? 1 : 0);
