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
    icon: <Monitor className="w-5 h-5 text-orange-500"/>,
    items: ["จอเปิดไม่ติด / ไฟไม่เข้า", "ขึ้น No Signal", "หน้าจอเป็นเส้น / สีเพี้ยน", "พอร์ตเชื่อมต่อชำรุด"],
  },
  {
    id: "pc",
    title: "หมวดเคส & ฮาร์ดแวร์",
    icon: <Cpu className="w-5 h-5 text-orange-500"/>,
    items: ["เครื่องเปิดไม่ติด", "เครื่องค้าง / จอฟ้า", "ทำงานช้ามากผิดปกติ", "ช่อง USB ใช้งานไม่ได้", "เครื่องร้อน / เสียงดัง"],
  },
  {
    id: "peripheral",
    title: "อุปกรณ์ต่อพ่วง",
    icon: <Mouse className="w-5 h-5 text-orange-400"/>,
    items: ["คีย์บอร์ดเสีย / ปุ่มหลุด", "เมาส์คลิกไม่ติด / ลูกกลิ้งเสีย", "หูฟัง / ไมค์เสีย", "กล้อง Webcam ไม่ทำงาน"],
  },
  {
    id: "network",
    title: "เครือข่าย & ซอฟต์แวร์",
    icon: <Wifi className="w-5 h-5 text-orange-500"/>,
    items: ["ออกอินเทอร์เน็ตไม่ได้", "สาย LAN ชำรุด", "ล็อกอิน Domain ไม่ได้", "โปรแกรมการเรียนเปิดไม่ได้"],
  },
  {
    id: "power",
    title: "ระบบไฟฟ้าประจำโต๊ะ",
    icon: <Zap className="w-5 h-5 text-amber-500"/>,
    items: ["ปลั๊กไฟใต้โต๊ะชำรุด", "ไฟไม่เข้า", "โต๊ะ/เก้าอี้ ชำรุด", "รางสายไฟแตกหัก"],
  },
  {
    id: "infra",
    title: "อุปกรณ์ส่วนกลาง",
    icon: <Video className="w-5 h-5 text-orange-600"/>,
    items: ["โพรเจกเตอร์ภาพไม่ขึ้น", "เครื่องเสียงอาจารย์ไม่ดัง", "แอร์ไม่เย็น / น้ำหยด", "UPS ร้องเตือน / เบรกเกอร์ตัด"],
  }
];

type FormValues = {
  userRole?: string;
  name?: string;
  phone?: string;
  room?: string;
  customRoom?: string;
  pcNumber?: string;
  assetId?: string;
  description?: string;
  impact?: string;
  [key: string]: string | boolean | undefined;
};

export default function MaintenanceForm() {
  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { impact: "normal" }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string>("");

  const selectedRoom = watch("room");

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
    
    for (const key in data) {
      if (key.startsWith("check_") && data[key]) {
        selectedIssues.push(key.replace("check_", ""));
      }
    }

    CHECKLIST_CATEGORIES.forEach(category => {
      const otherValue = data[`other_${category.id}`];
      if (otherValue && typeof otherValue === 'string' && otherValue.trim() !== '') {
        const shortCategoryName = category.title.split(' ')[0]; 
        selectedIssues.push(`${shortCategoryName}: ${otherValue.trim()}`);
      }
    });

    const finalRoomName = data.room === "other" ? data.customRoom : data.room;

    const finalData = {
      ...data,
      room: finalRoomName,
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-10 overflow-hidden font-sans bg-slate-50">
      
      {/* ภาพพื้นหลังเบลอปรับให้สว่างขึ้น */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center blur-md scale-105 opacity-20"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2866&auto=format&fit=crop")' }}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10"
      >
        {/* กล่องฟอร์มสีขาว */}
        <div className="bg-white border border-orange-100 shadow-xl rounded-3xl p-6 md:p-10 text-slate-800">
          
          {/* Header */}
          <div className="text-center mb-10 border-b border-slate-100 pb-8">
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-tr from-orange-400 to-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6"
            >
              <Monitor className="w-8 h-8 text-white"/>
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Maintenance Service 
            </h1>
            <p className="text-slate-500 text-sm">มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน</p>
          </div>

          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center"
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6"/>
              <h2 className="text-2xl font-bold text-green-700 mb-2">ส่งเรื่องสำเร็จ!</h2>
              <p className="text-green-600">ระบบได้รับข้อมูลเรียบร้อยแล้ว ฟอร์มจะรีเฟรชในอีกสักครู่...</p>
            </motion.div>
          ) : (
            <motion.form variants={containerVariants} initial="hidden" animate="show" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              
              {/* Section 1 */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <User className="w-5 h-5 text-orange-500"/> 1. ข้อมูลผู้แจ้ง
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">สถานะผู้แจ้ง</label>
                    <select {...register("userRole")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none">
                      <option value="อาจารย์">👨‍🏫 อาจารย์ / ผู้สอน</option>
                      <option value="นักศึกษา">🎓 นักศึกษา</option>
                      <option value="เจ้าหน้าที่">💼 เจ้าหน้าที่ห้องแล็บ</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">ชื่อ - นามสกุล *</label>
                    <input type="text" {...register("name", { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400" placeholder="ระบุชื่อผู้แจ้ง" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">เบอร์ติดต่อ *</label>
                    <input type="text" {...register("phone", { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400" placeholder="08X-XXX-XXXX" />
                  </div>
                </div>
              </motion.section>

              {/* Section 2 */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <MapPin className="w-5 h-5 text-orange-500"/> 2. ตำแหน่งอุปกรณ์
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 block">ห้องปฏิบัติการ *</label>
                    <select {...register("room", { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none">
                      <option value="" className="text-slate-500">-- เลือกห้องแล็บ --</option>
                      <option value="LAB 706">LAB 706 (ตึก 34)</option>
                      <option value="LAB 707">LAB 707 (ตึก 34)</option>
                      <option value="LAB 708">LAB 708 (ตึก 34)</option>
                      <option value="LAB 806">LAB 806 (ตึก 34)</option>
                      <option value="LAB 807">LAB 807 (ตึก 34)</option>
                      <option value="other" className="font-bold text-orange-600">+ อื่นๆ (โปรดระบุ)</option>
                    </select>

                    {selectedRoom === "other" && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-1">
                        <input 
                          type="text" 
                          {...register("customRoom", { required: selectedRoom === "other" })} 
                          className="w-full bg-slate-50 border border-orange-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400 shadow-[0_0_15px_rgba(249,115,22,0.05)]" 
                          placeholder="พิมพ์ระบุชื่อห้อง หรือสถานที่..." 
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 block">หมายเลขเครื่อง หรือ ระบุตำแหน่ง *</label>
                    <input type="text" {...register("pcNumber", { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400" placeholder="เช่น PC-15 หรือ โต๊ะแถว 2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 block">รหัสครุภัณฑ์ (ถ้ามี)</label>
                    <input type="text" {...register("assetId")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400" placeholder="COM-67-001" />
                  </div>
                </div>
              </motion.section>

              {/* Section 3: Checklists */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500"/> 3. อาการที่พบ (เลือกได้มากกว่า 1 ข้อ)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CHECKLIST_CATEGORIES.map((category) => (
                    <div key={category.id} className="bg-white rounded-xl p-5 border border-slate-200 hover:border-orange-300 transition-colors flex flex-col h-full shadow-sm">
                      <div className="flex items-center gap-3 mb-4 font-semibold text-slate-800">
                        {category.icon} {category.title}
                      </div>
                      
                      <div className="space-y-3 flex-grow">
                        {category.items.map((item, idx) => (
                          <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              {...register(`check_${item}`)} 
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 bg-white text-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
                            />
                            <span className="text-sm text-slate-600 group-hover:text-orange-600 transition-colors">{item}</span>
                          </label>
                        ))}
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100">
                        <input
                          type="text"
                          {...register(`other_${category.id}`)}
                          placeholder="อาการอื่นๆ โปรดระบุ..."
                          className="w-full bg-slate-50 text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-sm font-medium text-slate-600 mb-1 block">รายละเอียดเพิ่มเติมอื่นๆ (ถ้ามี)</label>
                  <textarea 
                    {...register("description")} 
                    rows={3} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400 resize-none" 
                    placeholder="อธิบายสภาพแวดล้อมหรืออาการเพิ่มเติมแบบยาวๆ ..."
                  ></textarea>
                </div>
              </motion.section>

             {/* Section 4: Impact */}
             

              {/* Section 5: Upload Image */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ImageIcon className="w-5 h-5 text-orange-500" /> 5. แนบรูปภาพประกอบ (ถ้ามี)
                </h2>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-orange-200 rounded-xl p-6 bg-orange-50/30 hover:bg-orange-50 transition-colors">
                  {previewUrl ? (
                    <div className="relative inline-block">
                      <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg object-contain" />
                      <button type="button" onClick={removeImage} className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer w-full py-4">
                      <div className="w-12 h-12 bg-white shadow-sm border border-orange-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6 text-orange-400" />
                      </div>
                      <span className="text-slate-700 font-medium mb-1">คลิกเพื่ออัปโหลดรูปภาพ</span>
                      <span className="text-slate-400 text-sm">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</span>
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
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  {isSubmitting ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลแจ้งซ่อม"}
                </button>
              </motion.div>

            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}