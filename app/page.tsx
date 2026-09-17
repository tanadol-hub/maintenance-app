"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wrench, Search, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden p-4">
      
      {/* Glow Effects โทนสีส้ม */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Glass Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10 max-w-3xl mx-auto space-y-6 bg-white/75 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-white/80 shadow-2xl shadow-orange-950/10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-sm font-semibold">
          <Zap className="w-4 h-4" />
          ระบบแจ้งซ่อมออนไลน์ 24 ชั่วโมง
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 leading-tight">
          หมดปัญหาเรื่องอุปกรณ์ในห้องมีปัญหา <br className="hidden md:block" /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">แจ้งผู้ดูแลห้องได้ทันที</span>
        </h1>
        
        <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto font-medium">
           ระบบรับเรื่องแจ้งซ่อมอุปกรณ์คอมพิวเตอร์ เครือข่าย และโสตทัศนูปกรณ์ในห้องปฏิบัติการ
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link href="/report" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/30">
            <Wrench className="w-5 h-5" />
            แจ้งปัญหาการใช้งาน
          </Link>

          <Link href="/track" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-md">
            <Search className="w-5 h-5 text-orange-500" />
            ติดตามสถานะการซ่อม
          </Link>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto z-10 w-full"
      >
        {[
          { title: "รวดเร็ว ทันใจ", desc: "ส่งเรื่องตรงถึงช่างเทคนิคทันทีผ่านระบบ LINE" },
          { title: "ติดตามได้ตลอด", desc: "เช็กสถานะการดำเนินการได้ด้วยตัวคุณเอง" },
          { title: "จัดการเป็นระบบ", desc: "มีฐานข้อมูลจัดเก็บประวัติการแก้ไขปัญหา" }
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 text-center shadow-lg shadow-slate-900/5">
            <h3 className="text-orange-600 font-bold mb-2 text-lg">{item.title}</h3>
            <p className="text-slate-600 text-sm font-medium">{item.desc}</p>
          </div>
        ))}
      </motion.div>

    </div>
  );
}