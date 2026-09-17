import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ระบบแจ้งซ่อมคอมพิวเตอร์ | ศูนย์บริการเทคโนโลยีสารสนเทศ",
  description: "ระบบแจ้งซ่อมอุปกรณ์คอมพิวเตอร์และเครือข่าย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body 
        className="min-h-full flex flex-col text-slate-800 relative bg-cover bg-center bg-fixed bg-no-repeat"
        style={{ backgroundImage: "url('/bg.jpg')" }} /* 🟢 ใช้วิธีนี้ รูปขึ้นแน่นอน 100% */
      >
        
        {/* 🟢 Layer ฟิล์มสีขาวจางๆ เพื่อให้ภาพตึกด้านหลังซอฟต์ลง และอ่านตัวหนังสือสีเข้มได้ง่ายขึ้น */}
        <div className="fixed inset-0 bg-white/50 backdrop-blur-[2px] pointer-events-none -z-10" />
        
        <Navbar />
        
        <main className="flex-1 pt-16 relative z-0">
          {children}
        </main>
      </body>
    </html>
  );
}