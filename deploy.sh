#!/bin/bash
# deploy.sh
# --------------------------------------------------
# Deploy "ธรรมเถอะ" (Thamtoe) ขึ้น GitHub Pages
# วัตถุประสงค์: ให้ผู้ใช้งานฟรี ไม่ต้องพกหนังสือสวดมนต์,
#             มี PWA อ่านออฟไลน์ได้ และตั้งเวลาเตือนทำสมาธิในตัว
#
# วิธีใช้งาน:
#   cd projects/thamtoe-site
#   chmod +x deploy.sh
#   ./deploy.sh
# --------------------------------------------------

set -e

REPO="https://github.com/Weerinrada/thamthoe-site.git"
BRANCH="main"

echo "🕉  เริ่มต้น Deploy แอปธรรมเถอะ..."

# 1. ตรวจสอบไฟล์หลัก
if [ ! -f index.html ] || [ ! -f sw.js ]; then
    echo "❌ พบไม่ไฟล์ index.html หรือ sw.js กรุณารันสคริปต์ในโฟลเดอร์ projects/thamtoe-site/"
    exit 1
fi

for f in manifest.webmanifest icon-192.png icon-512.png apple-touch-icon.png .gitignore package.json package-lock.json; do
    if [ ! -f "$f" ]; then
        echo "⚠️  ไม่พบไฟล์ $f (จะข้ามไป แต่แนะนำให้มีครบ)"
    fi
done

# 2. รันทดสอบก่อน deploy
echo "🧪 รันทดสอบ bundle & tests..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ ทดสอบไม่ผ่าน หยุด deploy"
    exit 1
fi

# 3. Commit และ push (ถ้ามีการเปลี่ยนแปลง)
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 มีการเปลี่ยนแปลงที่ยังไม่ได้ commit กำลัง commit อัตโนมัติ..."
    git add .
    git commit -m "chore: auto-deploy $(date '+%Y-%m-%d %H:%M:%S')"
else
    echo "📝 ไม่มีการเปลี่ยนแปลงใหม่ ข้ามการ commit"
fi

echo "🚀 ดันโค้ดขึ้น GitHub..."
git push origin "$BRANCH"

echo "🌐 เว็บไซต์อัปโหลดแล้ว GitHub Actions จะสร้างและเผยแพร่โดยอัตโนมัติ"
echo "📎 ผู้ใช้สามารถเข้าใช้งานได้ที่: https://weerinrada.github.io/thamthoe-site/"
echo "📱 ผู้ใช้สามารถติดตั้งเป็น PWA ได้ทันที และดาวน์โหลดบทสวดออฟไลน์ได้"
