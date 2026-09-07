"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import imageCompression from "browser-image-compression";
import { motion, Variants } from "framer-motion";
import { 
  Monitor, Cpu, Mouse, Wifi, Zap, Video, Image as ImageIcon, 
  Send, X, Loader2, CheckCircle2, User, MapPin, AlertTriangle
} from "lucide-react";

// --- รายการเช็กลิสต์ ---
const CHECKLIST_CATEGORIES = [
  {
    id: "display",
    title: "หมวดจอภาพ (Display)",
    icon: <Monitor className="w-5 h-5 text-blue-400" />,
    items: ["จอเปิดไม่ติด / ไฟไม่เข้า", "ขึ้น No Signal", "หน้าจอเป็นเส้น / สีเพี้ยน", "พอร์ตเชื่อมต่อชำรุด"],
  },
  {
    id: "pc",
    title: "หมวดเคส & ฮาร์ดแวร์",
    icon: <Cpu className="w-5 h-5 text-purple-400" />,
    items: ["เครื่องเปิดไม่ติด", "เครื่องค้าง / จอฟ้า", "ทำงานช้ามากผิดปกติ", "ช่อง USB ใช้งานไม่ได้", "เครื่องร้อน / เสียงดัง"],
  },
  {
    id: "peripheral",
    title: "อุปกรณ์ต่อพ่วง",
    icon: <Mouse className="w-5 h-5 text-pink-400" />,
    items: ["คีย์บอร์ดเสีย / ปุ่มหลุด", "เมาส์คลิกไม่ติด / ลูกกลิ้งเสีย", "หูฟัง / ไมค์เสีย", "กล้อง Webcam ไม่ทำงาน"],
  },
  {
    id: "network",
    title: "เครือข่าย & ซอฟต์แวร์",
    icon: <Wifi className="w-5 h-5 text-emerald-400" />,
    items: ["ออกอินเทอร์เน็ตไม่ได้", "สาย LAN ชำรุด", "ล็อกอิน Domain ไม่ได้", "โปรแกรมการเรียนเปิดไม่ได้"],
  },
  {
    id: "power",
    title: "ระบบไฟฟ้าประจำโต๊ะ",
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    items: ["ปลั๊กไฟใต้โต๊ะชำรุด", "ไฟไม่เข้า", "โต๊ะ/เก้าอี้ ชำรุด", "รางสายไฟแตกหัก"],
  },
  {
    id: "infra",
    title: "อุปกรณ์ส่วนกลาง",
    icon: <Video className="w-5 h-5 text-orange-400" />,
    items: ["โพรเจกเตอร์ภาพไม่ขึ้น", "เครื่องเสียงอาจารย์ไม่ดัง", "แอร์ไม่เย็น / น้ำหยด", "UPS ร้องเตือน / เบรกเกอร์ตัด"],
  }
];

type FormValues = {
  userRole?: string;
  name?: string;
  phone?: string;
  room?: string;
  customRoom?: string; // เพิ่มตัวแปรสำหรับเก็บชื่อห้องที่พิมพ์เอง
  pcNumber?: string;
  assetId?: string;
  description?: string;
  impact?: string;
  [key: string]: string | boolean | undefined;
};

export default function MaintenanceForm() {
  // เพิ่ม watch เพื่อดึงค่าที่กำลังเลือกแบบ Real-time
  const { register, handleSubmit, reset, watch } = useForm<FormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string>("");

  // จับตาดูฟิลด์ "room" ว่าผู้ใช้เลือกอะไร
  const selectedRoom = watch("room");

  // ฟังก์ชันจัดการรูปภาพและบีบอัด
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => setBase64Image(reader.result as string);
      } catch (error) {
        console.error("บีบอัดรูปไม่สำเร็จ:", error);
      }
    }
  };

  const removeImage = () => {
    setPreviewUrl(null);
    setBase64Image("");
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    const selectedIssues: string[] = [];
    
    // 1. ดึงข้อมูลจาก Checkbox ที่ถูกติ๊ก
    for (const key in data) {
      if (key.startsWith("check_") && data[key]) {
        selectedIssues.push(key.replace("check_", ""));
      }
    }

    // 2. ดึงข้อมูลจากช่อง "พิมพ์อาการอื่นๆ" ของแต่ละหมวด
    CHECKLIST_CATEGORIES.forEach(category => {
      const otherValue = data[`other_${category.id}`];
      if (otherValue && typeof otherValue === 'string' && otherValue.trim() !== '') {
        const shortCategoryName = category.title.split(' ')[0]; 
        selectedIssues.push(`${shortCategoryName}: ${otherValue.trim()}`);
      }
    });

    // 3. จัดการกรณีที่เลือกห้อง "อื่นๆ"
    const finalRoomName = data.room === "other" ? data.customRoom : data.room;

    const finalData = {
      ...data,
      room: finalRoomName, // เขียนทับค่า room ด้วยชื่อห้องที่พิมพ์เอง (ถ้ามี)
      issuesList: selectedIssues.join(", "),
      imageBase64: base64Image,
    };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });
      if (response.ok) {
        setIsSuccess(true);
        reset();
        removeImage();
        setTimeout(() => setIsSuccess(false), 5000); 
      } else {
        alert("❌ เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("submit error:", error);
      alert("❌ ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  // แอนิเมชัน
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-200">
      
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10 py-10"
      >
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-3xl p-6 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-10 border-b border-white/10 pb-8">
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6"
            >
              <Monitor className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
              แจ้งซ่อมห้องปฏิบัติการคอมพิวเตอร์
            </h1>
            <p className="text-slate-400 text-sm">มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน</p>
          </div>

          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-2xl p-10 text-center"
            >
              <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-green-400 mb-2">ส่งเรื่องสำเร็จ!</h2>
              <p className="text-green-400/80">ระบบได้รับข้อมูลเรียบร้อยแล้ว ฟอร์มจะรีเฟรชในอีกสักครู่...</p>
            </motion.div>
          ) : (
            <motion.form variants={containerVariants} initial="hidden" animate="show" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              
              {/* Section 1 */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                  <User className="w-5 h-5 text-blue-400" /> 1. ข้อมูลผู้แจ้ง
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-400">สถานะผู้แจ้ง</label>
                    <select {...register("userRole")} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none">
                      <option value="อาจารย์" className="bg-slate-900">👨‍🏫 อาจารย์ / ผู้สอน</option>
                      <option value="นักศึกษา" className="bg-slate-900">🎓 นักศึกษา</option>
                      <option value="เจ้าหน้าที่" className="bg-slate-900">💼 เจ้าหน้าที่ห้องแล็บ</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-400">ชื่อ - นามสกุล *</label>
                    <input type="text" {...register("name", { required: true })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600" placeholder="ระบุชื่อผู้แจ้ง" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-400">เบอร์ติดต่อ *</label>
                    <input type="text" {...register("phone", { required: true })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600" placeholder="08X-XXX-XXXX" />
                  </div>
                </div>
              </motion.section>

              {/* Section 2 */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                  <MapPin className="w-5 h-5 text-purple-400" /> 2. ตำแหน่งอุปกรณ์
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  
                  {/* เปลี่ยนแปลงส่วน Dropdown ห้องแล็บ */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 block">ห้องปฏิบัติการ *</label>
                    <select {...register("room", { required: true })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 appearance-none">
                      <option value="" className="bg-slate-900 text-slate-500">-- เลือกห้องแล็บ --</option>
                      <option value="LAB 706" className="bg-slate-900">LAB 706 (ตึก 34)</option>
                      <option value="LAB 707" className="bg-slate-900">LAB 707 (ตึก 34)</option>
                      <option value="LAB 708" className="bg-slate-900">LAB 708 (ตึก 34)</option>
                      <option value="LAB 806" className="bg-slate-900">LAB 806 (ตึก 34)</option>
                      <option value="LAB 807" className="bg-slate-900">LAB 807 (ตึก 34)</option>
                      <option value="other" className="bg-slate-900 font-bold text-purple-400">+ อื่นๆ (โปรดระบุ)</option>
                    </select>

                    {/* ช่องสำหรับพิมพ์ชื่อห้องเอง จะโชว์เมื่อเลือก "อื่นๆ" เท่านั้น */}
                    {selectedRoom === "other" && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-1">
                        <input 
                          type="text" 
                          {...register("customRoom", { required: selectedRoom === "other" })} 
                          className="w-full bg-[#111] border border-purple-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                          placeholder="พิมพ์ระบุชื่อห้อง หรือสถานที่..." 
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 block">หมายเลขเครื่อง หรือ ระบุตำแหน่ง *</label>
                    <input type="text" {...register("pcNumber", { required: true })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-600" placeholder="เช่น PC-15 หรือ โต๊ะแถว 2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 block">รหัสครุภัณฑ์ (ถ้ามี)</label>
                    <input type="text" {...register("assetId")} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-600" placeholder="COM-67-001" />
                  </div>
                </div>
              </motion.section>

              {/* Section 3: Checklists */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" /> 3. อาการที่พบ (เลือกได้มากกว่า 1 ข้อ)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CHECKLIST_CATEGORIES.map((category) => (
                    <div key={category.id} className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4 font-semibold text-slate-200">
                        {category.icon} {category.title}
                      </div>
                      
                      <div className="space-y-3 flex-grow">
                        {category.items.map((item, idx) => (
                          <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" {...register(`check_${item}`)} className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 transition-all" />
                            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{item}</span>
                          </label>
                        ))}
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/10">
                        <input
                          type="text"
                          {...register(`other_${category.id}`)}
                          placeholder="อาการอื่นๆ โปรดระบุ..."
                          className="w-full bg-black/40 text-sm text-slate-200 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-2">
                  <label className="text-sm font-medium text-slate-400 mb-1 block">รายละเอียดเพิ่มเติมอื่นๆ (ถ้ามี)</label>
                  <textarea {...register("description")} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 placeholder-slate-600 resize-none" placeholder="อธิบายสภาพแวดล้อมหรืออาการเพิ่มเติมแบบยาวๆ ..."></textarea>
                </div>
              </motion.section>

              {/* Section 4: Impact */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">4. ระดับผลกระทบ</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Critical */}
                  <label className="relative flex p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                    <input type="radio" value="Critical" {...register("impact", { required: true })} className="peer sr-only" />
                    <div className="peer-checked:border-red-500 peer-checked:bg-red-500/10 absolute inset-0 rounded-xl border border-transparent transition-all"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                      <div>
                        <div className="font-bold text-red-400">วิกฤต (Critical)</div>
                        <div className="text-xs text-slate-400 mt-0.5">กระทบการสอน / เน็ตหลุดทั้งห้อง</div>
                      </div>
                    </div>
                  </label>

                  {/* High */}
                  <label className="relative flex p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                    <input type="radio" value="High" {...register("impact", { required: true })} className="peer sr-only" />
                    <div className="peer-checked:border-yellow-500 peer-checked:bg-yellow-500/10 absolute inset-0 rounded-xl border border-transparent transition-all"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                      <div>
                        <div className="font-bold text-yellow-400">ด่วน (High)</div>
                        <div className="text-xs text-slate-400 mt-0.5">PC เสีย ใช้งานไม่ได้ ต้องย้ายที่</div>
                      </div>
                    </div>
                  </label>

                  {/* Low */}
                  <label className="relative flex p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                    <input type="radio" value="Low" defaultChecked {...register("impact", { required: true })} className="peer sr-only" />
                    <div className="peer-checked:border-green-500 peer-checked:bg-green-500/10 absolute inset-0 rounded-xl border border-transparent transition-all"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                      <div>
                        <div className="font-bold text-green-400">ปกติ (Low)</div>
                        <div className="text-xs text-slate-400 mt-0.5">ชำรุดเล็กน้อย แต่ยังใช้งานได้</div>
                      </div>
                    </div>
                  </label>

                </div>
              </motion.section>

              {/* Section 5: Image Upload */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                  <ImageIcon className="w-5 h-5 text-pink-400" /> 5. รูปถ่ายปัญหา
                </h2>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center bg-black/20 hover:bg-white/5 transition-colors relative">
                  {previewUrl ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Preview" className="max-h-56 rounded-lg shadow-xl" />
                      <button type="button" onClick={removeImage} className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:bg-red-600 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-3">
                      <div className="bg-white/10 p-4 rounded-full text-white/70 mb-2">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <span className="font-medium text-slate-300">คลิกเพื่ออัปโหลด หรือถ่ายรูป</span>
                      <span className="text-xs text-slate-500">(บีบอัดรูปภาพอัตโนมัติ เพื่อความรวดเร็ว)</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </motion.section>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-6">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full relative group overflow-hidden rounded-xl bg-white text-black font-bold text-lg py-4 px-6 flex items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-black mr-3" />
                      กำลังเข้ารหัสและส่งข้อมูล...
                    </>
                  ) : (
                    <>
                      ยืนยันการแจ้งซ่อม
                      <Send className="w-5 h-5 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>

            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}