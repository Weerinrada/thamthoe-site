# สรุปสถานะล่าสุด

อัปเดต: 2026-11-25 · สาขา `main` · ตรงกับ origin แล้ว

## ตำแหน่งปัจจุบัน

- เช็ก SHA ล่าสุดด้วย `git log -1 --oneline` และ `git ls-remote origin refs/heads/main`
- หลัง push แล้ว `main` และ `origin/main` ตรงกัน ไม่มี commit ค้างส่ง

## commit ล่าสุด

| commit    | สิ่งที่เปลี่ยน                                                                                                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ล่าสุด      | `fix: measure chant time from timestamps and fold metta into chant` — วัดเวลาสวดจาก timestamp เริ่มบทแรกถึงบทสุดท้าย รวมบทเมตตาเข้า `chant`, หน้าโปรไฟล์เหลือ สวด/สมาธิ, bump `sw.js` เป็น `thamtoe-v5`                                       |
| `ab30a77` | `fix: restore chant patch syntax and bump offline cache` — ซ่อม escaped quote ในคำแปล `bahung` ของ `__chantUpdates` ที่ทำให้ inline script parse ไม่ได้จนหน้าเว็บว่าง คงเนื้อหาบทสวดที่แก้ไว้ และ bump `sw.js` จาก `thamtoe-v3` เป็น `thamtoe-v4` |
| `8468c79` | `feat: add daily practice loop and tracking` — เพิ่มเส้นทาง สวด → ภาวนา → เมตตา, กฎการเก็บครั้งฝึก, ความสม่ำเสมอ (streak, จุด 7 วัน, milestone), ถอดฟีเจอร์จำลอง, Screen Wake Lock, และชุดทดสอบ                                                |
| `351b51c` | `revise: update chant usage wording` — ปรับข้อความแนะนำการใช้บทสวด                                                                                                                                                                   |

## ผลตรวจสอบล่าสุด

- `npm test` exit 0 ผ่านทั้งหมด 43 รายการ
- inline script ทั้ง 3 ก้อน parse ผ่าน; `__chantUpdates` และ `__newChants` อ่านเป็น JSON ได้ถูกต้อง
- จำลองสวดด้วยนาฬิกาปลอม 125 วินาที → บันทึก `chant` 2 นาที; เปิดใน Chrome tab ใหม่ไม่มี JavaScript exception และแอปเรนเดอร์ปกติ
- pre-commit hook รัน `lint-staged` (Prettier) ตามด้วย `npm test`

## หมายเหตุ

- `index.html` คือ bundle ที่ minify ไว้แล้ว ห้ามให้ Prettier ฟอร์แมต (อยู่ใน `.prettierignore`)
- ทุกครั้งที่เปลี่ยน bundle ต้อง bump `VERSION` ใน `sw.js` ด้วย (ตอนนี้คือ `thamtoe-v5`)
- เอกสารอ้างอิงอื่น: `README.md` (วิธีใช้/พัฒนา), `CONTEXT.md` (ศัพท์โดเมน)
