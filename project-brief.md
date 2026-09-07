# Project Name: Campus CMMS (ระบบแจ้งซ่อมห้องปฏิบัติการคอมพิวเตอร์)

## 📌 Project Overview
ระบบแจ้งซ่อมออนไลน์สำหรับมหาวิทยาลัย (เน้นห้องแล็บคอมพิวเตอร์) เพื่อทดแทนการใช้กระดาษ โดยผู้ใช้ (อาจารย์/นักศึกษา/เจ้าหน้าที่) สามารถกรอกฟอร์มแจ้งอาการเสียผ่าน Web App พร้อมแนบรูปถ่าย และระบบจะยิงแจ้งเตือนผ่าน LINE Flex Message เข้าไปที่ผู้ดูแลระบบทันทีแบบ 1-on-1

## 🛠️ Tech Stack & Architecture
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, React Hook Form
- **Icons & UI:** `lucide-react`
- **Image Processing:** `browser-image-compression` (แปลงรูปเป็น Base64 ก่อนส่ง)
- **Backend/API (Next.js):** Route Handler (`app/api/submit/route.ts`)
- **Database & Cloud Storage:** Google Sheets (บันทึกข้อมูล) และ Google Drive (เก็บรูปภาพ) ผ่าน Google Apps Script (GAS)
- **Notification:** LINE Messaging API (Flex Message Push Notification)

## 📝 Data Structure (Form Fields)
1. **Requester Info:** userRole, name, phone
2. **Location:** room (Lab name), pcNumber, assetId
3. **Issues (Checklist):** แยกหมวดหมู่ Display, PC, Peripheral, Network, Power, Infra (ส่งข้อมูลรวบยอดเป็น String คั่นด้วยลูกน้ำ)
4. **Impact Level:** Critical, High, Low
5. **Image:** Base64 string

## 🚀 Workflow
1. User Submit Form (Next.js) -> Base64 Image + JSON Data
2. Next.js API (`/api/submit`) รับข้อมูล -> ยิง POST ไปที่ Google Apps Script URL
3. Google Apps Script -> บันทึกรูปลง Drive (ได้ URL) -> บันทึก Data ลง Sheets -> Return success + Image URL
4. Next.js API รับ URL รูปกลับมา -> ประกอบร่าง JSON Payload เป็น Flex Message
5. Next.js API -> ยิง POST ไปที่ LINE Messaging API (`/message/push`) เป้าหมายคือ `LINE_USER_ID` ของผู้ดูแลที่ตั้งไว้ใน `.env.local`

## 🎯 Current Status
- Frontend UI (MaintenanceForm.tsx) และ Checklists สร้างเสร็จแล้ว
- ได้เชื่อมต่อ Google Gemini เข้ามาใน Editor เพื่อช่วยเขียนโค้ดแล้ว
- สเต็ปถัดไป: กำลังจะอัปเดต Google Sheets Columns, Google Apps Script (GAS) และ Next.js Route Handler (`route.ts`)