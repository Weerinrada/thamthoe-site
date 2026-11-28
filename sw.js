// ธรรมเถอะ — service worker: เปิดใช้ได้แม้ไม่มีสัญญาณอินเทอร์เน็ต
// เปลี่ยนเลขเวอร์ชันตรงนี้ทุกครั้งที่อยากให้เครื่องล้างแคชเก่า
const VERSION = "thamtoe-v64";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        Promise.all(SHELL.map((u) => cache.add(u).catch(() => {})))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function __reminderTime() {
  try {
    const cache = await caches.open("thamtoe-reminder");
    const res = await cache.match("/reminder-time");
    if (!res) return null;
    return (await res.text()).trim();
  } catch (e) {
    return null;
  }
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== "reminder-check") return;
  event.waitUntil(
    (async () => {
      try {
        const time = await __reminderTime();
        if (!time) return;
        const parts = time.split(":");
        const hh = Number(parts[0]) || 7;
        const mm = Number(parts[1]) || 0;
        const now = new Date();
        // Only notify within a 15-minute window after the target time
        const target = new Date();
        target.setHours(hh, mm, 0, 0);
        const diff = now - target;
        if (diff >= 0 && diff < 15 * 60 * 1000) {
          await self.registration.showNotification("ธรรมเถอะ", {
            body: "ถึงเวลาทำวัตรแล้ว",
            icon: "./icon-192.png",
            badge: "./icon-192.png",
          });
        }
      } catch (e) {}
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // เปิดหน้าแอป: ลองเน็ตก่อน (ได้เวอร์ชันใหม่เสมอ) ถ้าเน็ตช้าหรือไม่มี ใช้ฉบับในเครื่อง
  if (req.mode === "navigate") {
    event.respondWith(
      withTimeout(fetch(req), 4000)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put("index.html", copy));
          }
          return res;
        })
        .catch(() =>
          caches.match("index.html").then((r) => r || caches.match("./"))
        )
    );
    return;
  }

  // ฟอนต์จาก Google: ใช้ของเดิมไปก่อน แล้วอัปเดตเงียบ ๆ
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.open(VERSION).then((cache) =>
        cache.match(req).then((hit) => {
          const net = fetch(req)
            .then((res) => {
              cache.put(req, res.clone());
              return res;
            })
            .catch(() => hit);
          return hit || net;
        })
      )
    );
    return;
  }

  // ไฟล์อื่นในเว็บเดียวกัน (ไอคอน ฯลฯ): ใช้ของในเครื่องก่อน
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
  }
});
