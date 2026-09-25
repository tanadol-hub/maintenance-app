"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Clock, CheckCircle2, Wrench, AlertCircle, 
  Settings, Filter, X, Save, LogIn, MessageCircle,
  User, MapPin, Image as ImageIcon, ExternalLink,
  ShieldAlert, Lock, ShieldCheck, Copy, Check, LogOut,
  Download, FileSpreadsheet
} from "lucide-react";

type TicketStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface MaintenanceTicket {
  id: string; 
  userRole: string; 
  reporterName: string; 
  phone: string; 
  room: string; 
  pcNumber: string; 
  issues: string[]; 
  description?: string; 
  imageUrl?: string; 
  impact: "Critical" | "High" | "Low"; 
  status: TicketStatus; 
  createdAt: string; 
  technicianNote?: string;
}

interface AdminProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

// --------------------------------------------------------------------------
// ⚙️ การตั้งค่าระบบ
// --------------------------------------------------------------------------
const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || "https://script.google.com/macros/s/AKfycbw2ZKH5_XyrtgiZJgwfeyMaljH75yFoDrUClbqLZ-ZJ8puT74Kza7apXEdwVO2BP_OvWA/exec";
const LIFF_ADMIN_ID = process.env.NEXT_PUBLIC_LIFF_ADMIN_ID || "2011648763-lxIG7crp"; 

// 🔑 รายชื่อ UID ของ LINE ที่ระบุว่าเป็นแอดมิน
const ALLOWED_ADMIN_UIDS: string[] = [];
// --------------------------------------------------------------------------

// ฟังก์ชันแปลงสถานะจากภาษาไทยใน Google Sheets ให้ตรงกับ TicketStatus ใน Next.js
const mapStatus = (thaiStatus: string): TicketStatus => {
  if (thaiStatus === "กำลังดำเนินการ" || thaiStatus === "กำลังซ่อม") return "in_progress";
  if (thaiStatus === "เสร็จสิ้น") return "completed";
  if (thaiStatus === "ยกเลิก") return "cancelled";
  return "pending"; // Default คือ รอดำเนินการ
};

const mapStatusToThai = (status: TicketStatus): string => {
  switch (status) {
    case "in_progress": return "กำลังดำเนินการ";
    case "completed": return "เสร็จสิ้น";
    case "cancelled": return "ยกเลิก";
    default: return "รอดำเนินการ";
  }
};

const getDirectImageUrl = (url: string | undefined) => {
  if (!url) return null;
  let fileId = "";
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);

  if (fileMatch) {
    fileId = fileMatch[1];
  } else if (idMatch) {
    fileId = idMatch[1];
  }

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=s800`;
  }
  return url;
};

export default function AdminDashboard() {
  // สถานะเกี่ยวกับการเข้าสู่ระบบและตรวจสอบแอดมิน
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [unauthorizedUid, setUnauthorizedUid] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // สถานะข้อมูลใบแจ้งซ่อม
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // สถานะตัวกรองและการค้นหา
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // สถานะ Modal สำหรับแก้ไข
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [editStatus, setEditStatus] = useState<TicketStatus>("pending");
  const [editNote, setEditNote] = useState("");

  // 1. ตรวจสอบการเข้าสู่ระบบ LIFF และเช็ค UID แอดมินเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    const verifyAdminAuth = async () => {
      setIsCheckingAuth(true);
      try {
        if (!LIFF_ADMIN_ID) {
          setIsLoggedIn(true);
          setIsCheckingAuth(false);
          return;
        }

        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: LIFF_ADMIN_ID });

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          const userUid = profile.userId;

          setAdminProfile({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl
          });

          let sheetAdmins: string[] = [];
          try {
            const res = await fetch(`${GAS_URL}?action=getAdmins`, { cache: "no-store" });
            const text = await res.text();
            if (!text.trim().startsWith("<")) {
              const json = JSON.parse(text);
              if (json.status === "success" && Array.isArray(json.data)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sheetAdmins = json.data.map((item: any) => String(item.uid).trim());
              }
            }
          } catch (err) {
            console.error("Failed to fetch admins from Google Sheets", err);
          }

          const envUids = process.env.NEXT_PUBLIC_ADMIN_UIDS 
            ? process.env.NEXT_PUBLIC_ADMIN_UIDS.split(",").map(u => u.trim()) 
            : [];
          const validUids = [...ALLOWED_ADMIN_UIDS, ...envUids, ...sheetAdmins].filter(Boolean);

          if (validUids.length > 0 && validUids.includes(userUid)) {
            setIsLoggedIn(true);
            setUnauthorizedUid(null);
          } else {
            setIsLoggedIn(false);
            setUnauthorizedUid(userUid);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("LIFF Admin Verification Error:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAdminAuth();
  }, []);

  // 2. ดึงข้อมูลจริงจาก Google Sheets
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${GAS_URL}?action=getAllTickets`, { cache: "no-store" });
        const text = await res.text();

        if (text.trim().startsWith("<")) {
          console.error("GAS returned HTML response instead of JSON:", text);
          alert("ไม่สามารถดึงข้อมูลได้: Google Apps Script ส่งคืนหน้าเว็บ HTML กรุณาเช็คว่าตั้งค่า 'Who has access' เป็น 'Anyone' หรือยัง");
          return;
        }

        const json = JSON.parse(text);

        if (json.status === "success" && Array.isArray(json.data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedTickets: MaintenanceTicket[] = json.data.map((item: any) => ({
            id: String(item.ticketId || item.id || ""),
            createdAt: String(item.createdAt || ""),
            userRole: String(item.userRole || ""),
            reporterName: String(item.name || item.reporterName || ""),
            phone: String(item.phone || ""),
            room: String(item.room || ""),
            pcNumber: String(item.pcNumber || ""),
            issues: item.issuesList 
              ? (Array.isArray(item.issuesList) ? item.issuesList : String(item.issuesList).split(", ")) 
              : (Array.isArray(item.issues) ? item.issues : []),
            description: String(item.description || ""),
            impact: (item.impact as "Critical" | "High" | "Low") || "Low",
            imageUrl: String(item.imageUrl || ""),
            status: mapStatus(item.status),
            technicianNote: String(item.technicianNote || item.note || ""),
          }));

          setTickets(formattedTickets.reverse());
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [isLoggedIn]);

  // ฟังก์ชันดาวน์โหลดเฉพาะงานที่ "เสร็จสิ้น" ออกเป็นไฟล์ CSV (เปิดใน Excel ได้ภาษาไทยไม่ติดสัญลักษณ์)
  const handleExportCompletedCSV = () => {
    const completedList = tickets.filter((t) => t.status === "completed");

    if (completedList.length === 0) {
      alert("ไม่มีข้อมูลงานที่เสร็จสิ้นสำหรับ Export ในขณะนี้");
      return;
    }

    const headers = [
      "เลขที่ใบแจ้ง",
      "วันที่แจ้งซ่อม",
      "กลุ่มผู้แจ้ง",
      "ชื่อ-สกุล ผู้แจ้ง",
      "เบอร์โทรศัพท์",
      "ห้อง/สถานที่",
      "หมายเลข PC",
      "หัวข้อปัญหา",
      "รายละเอียดเพิ่มเติม",
      "บันทึกช่าง/การแก้ไข"
    ];

    const rows = completedList.map((t) => [
      `"${t.id}"`,
      `"${t.createdAt}"`,
      `"${t.userRole}"`,
      `"${t.reporterName}"`,
      `"${t.phone}"`,
      `"${t.room}"`,
      `"${t.pcNumber}"`,
      `"${t.issues.join(", ")}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      `"${(t.technicianNote || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `รายงานงานซ่อมเสร็จสิ้น_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLineLogin = async () => {
    try {
      if (!LIFF_ADMIN_ID) {
        setIsLoggedIn(true);
        return;
      }
      const liff = (await import("@line/liff")).default;
      if (!liff.isLoggedIn()) {
        liff.login();
      }
    } catch (error) {
      console.error("Login Error:", error);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = async () => {
    try {
      if (LIFF_ADMIN_ID) {
        const liff = (await import("@line/liff")).default;
        if (liff.isLoggedIn()) {
          liff.logout();
        }
      }
    } catch (error) {
      console.error("Logout Error:", error);
    }
    setIsLoggedIn(false);
    setAdminProfile(null);
    setUnauthorizedUid(null);
  };

  const copyUidToClipboard = () => {
    if (unauthorizedUid) {
      navigator.clipboard.writeText(unauthorizedUid);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const openDetailsModal = (ticket: MaintenanceTicket) => {
    setEditingTicket(ticket);
    setEditStatus(ticket.status);
    setEditNote(ticket.technicianNote || "");
    setIsModalOpen(true);
  };

  const saveUpdate = async () => {
    if (!editingTicket) return;
    
    const thaiStatus = mapStatusToThai(editStatus);

    try {
      const res = await fetch(
        `${GAS_URL}?action=updateStatus&ticketId=${encodeURIComponent(editingTicket.id)}&status=${encodeURIComponent(thaiStatus)}&note=${encodeURIComponent(editNote)}`,
        { cache: "no-store" }
      );
      
      const text = await res.text();
      if (text.trim().startsWith("<")) {
        alert("เกิดข้อผิดพลาด: Google Apps Script ส่งตอบกลับเป็น HTML");
        return;
      }

      const json = JSON.parse(text);

      if (json.status === "success") {
        setTickets(tickets.map(t => t.id === editingTicket.id ? { ...t, status: editStatus, technicianNote: editNote } : t));
        setIsModalOpen(false);
        alert("อัปเดตสถานะเรียบร้อยแล้ว!");
      } else {
        alert("เกิดข้อผิดพลาดในการอัปเดต: " + (json.message || "ไม่ทราบสาเหตุ"));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("ไม่สามารถติดต่อกับ Google Sheets ได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // คำนวณสรุปจำนวนงานสำหรับ Dashboard Cards
  const pendingCount = tickets.filter((t) => t.status === "pending").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const completedCount = tickets.filter((t) => t.status === "completed").length;

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium text-sm">กำลังตรวจสอบสิทธิ์ผู้ใช้งาน...</p>
      </div>
    );
  }

  if (unauthorizedUid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl border border-red-100 text-center relative z-10">
          <div className="w-20 h-20 bg-red-50 rounded-2xl mx-auto flex items-center justify-center mb-6 text-red-500">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">ไม่มีสิทธิ์เข้าถึงระบบ</h1>
          <p className="text-slate-500 text-sm mb-6">บัญชี LINE ของคุณยังไม่ได้ลงทะเบียนเป็นแอดมิน</p>

          {adminProfile && (
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 flex items-center gap-3 text-left border border-slate-100">
              {adminProfile.pictureUrl && (
                <img src={adminProfile.pictureUrl} alt="Profile" className="w-12 h-12 rounded-full border border-slate-200" />
              )}
              <div className="overflow-hidden">
                <p className="font-bold text-slate-800 text-sm truncate">{adminProfile.displayName}</p>
                <p className="text-xs text-slate-400">LINE User</p>
              </div>
            </div>
          )}

          <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-2xl text-left mb-4 space-y-2">
            <p className="text-xs font-bold text-orange-800">LINE UID ของคุณคือ:</p>
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-orange-200 font-mono text-xs text-slate-800 break-all">
              <span>{unauthorizedUid}</span>
              <button onClick={copyUidToClipboard} className="ml-2 p-1.5 hover:bg-orange-50 rounded-lg text-orange-600 shrink-0 transition-colors" title="คัดลอก UID">
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ✨ เพิ่มกล่องข้อความแนะนำการแอด LINE Bot ตรงนี้ */}
          <div className="bg-[#00B900]/10 border border-[#00B900]/20 p-4 rounded-2xl text-left mb-6">
            <p className="text-xs font-bold text-[#00B900] mb-1.5 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> ขั้นตอนที่ต้องทำเพิ่มเติม
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              เมื่อแจ้งเพิ่ม UID เข้าระบบแล้ว กรุณาแอดเพื่อน LINE ID: <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">@009mldgp</span> แล้วทักแชท 1 ครั้ง เพื่อเปิดรับการแจ้งเตือน
            </p>
          </div>

          <button onClick={handleLogout} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
            <LogOut className="w-4 h-4" /> สลับบัญชี / ออกจากระบบ
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-md shadow-2xl border border-orange-100 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
            <Settings className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Workspace</h1>
          <p className="text-slate-500 text-sm">ระบบจัดการและติดตามงานแจ้งซ่อมสำหรับเจ้าหน้าที่</p>
          
          <button onClick={handleLineLogin} className="w-full mt-8 bg-[#00B900] hover:bg-[#00A000] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-emerald-500/20 active:scale-[0.99]">
            <MessageCircle className="w-6 h-6" /> เข้าสู่ระบบด้วย LINE
          </button>
        </motion.div>
      </div>
    );
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = String(ticket.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(ticket.room).toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(ticket.reporterName).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "pending": return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1.5 w-fit"><Clock className="w-3.5 h-3.5" /> รอดำเนินการ</span>;
      case "in_progress": return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5 w-fit"><Wrench className="w-3.5 h-3.5" /> กำลังซ่อม</span>;
      case "completed": return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> เสร็จสิ้น</span>;
      case "cancelled": return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1.5 w-fit"><AlertCircle className="w-3.5 h-3.5" /> ยกเลิก</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-7 h-7 text-orange-500" /> ระบบจัดการการแจ้งซ่อม
            </h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {adminProfile && (
              <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                {adminProfile.pictureUrl ? (
                  <img src={adminProfile.pictureUrl} alt="Admin" className="w-7 h-7 rounded-full border border-orange-300" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-orange-500" />
                )}
                <span className="text-xs font-bold text-slate-700">{adminProfile.displayName}</span>
              </div>
            )}

            <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-red-500 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-red-50 transition-colors">
              <LogIn className="w-4 h-4 rotate-180" /> ออกจากระบบ
            </button>
          </div>
        </div>

        {/* 📊 1. การ์ดสรุปสถานะงาน (Dashboard Stat Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-amber-200/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">รอดำเนินการ (รอซ่อม)</p>
              <p className="text-2xl font-black text-amber-500">{pendingCount} <span className="text-xs font-normal text-slate-400">รายการ</span></p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-orange-200/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">กำลังดำเนินการ (กำลังซ่อม)</p>
              <p className="text-2xl font-black text-orange-500">{inProgressCount} <span className="text-xs font-normal text-slate-400">รายการ</span></p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
              <Wrench className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">ซ่อมเสร็จสิ้นแล้ว</p>
              <p className="text-2xl font-black text-emerald-600">{completedCount} <span className="text-xs font-normal text-slate-400">รายการ</span></p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Toolbar (พร้อมปุ่ม Export ข้อมูลงานเสร็จแล้ว) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" placeholder="ค้นหาด้วย เลขใบแจ้ง, ชื่อผู้แจ้ง, ห้อง..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              {[
                { id: "all", label: "ทั้งหมด" }, { id: "pending", label: "รอซ่อม" },
                { id: "in_progress", label: "กำลังซ่อม" }, { id: "completed", label: "เสร็จสิ้น" },
              ].map((tab) => (
                <button
                  key={tab.id} onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === tab.id ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 📥 2. ปุ่ม Export งานที่เสร็จแล้วเป็น Excel/CSV */}
            <button
              onClick={handleExportCompletedCSV}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 shrink-0"
              title="ส่งออกรายงานเฉพาะงานที่ซ่อมเสร็จแล้วเป็น Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export งานเสร็จแล้ว
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">เลขที่ใบแจ้ง</th>
                  <th className="px-6 py-4 font-semibold">ผู้แจ้ง</th>
                  <th className="px-6 py-4 font-semibold">สถานที่ / เครื่อง</th>
                  <th className="px-6 py-4 font-semibold">สถานะ</th>
                  <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        กำลังโหลดข้อมูล...
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      ไม่พบข้อมูลการแจ้งซ่อม
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-orange-600">{ticket.id}</div>
                        <div className="text-xs text-slate-400">{ticket.createdAt}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          {ticket.reporterName} 
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{ticket.userRole}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{ticket.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">{ticket.room}</div>
                        <div className="text-xs text-slate-500">{ticket.pcNumber}</div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => openDetailsModal(ticket)}
                          className="bg-white hover:bg-orange-500 text-orange-600 hover:text-white font-medium px-4 py-2 rounded-lg border border-orange-200 hover:border-orange-500 transition-all text-xs shadow-sm"
                        >
                          ดูรายละเอียด & อัปเดต
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal จัดการรายละเอียดใบแจ้งซ่อม */}
      <AnimatePresence>
        {isModalOpen && editingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative z-10 flex flex-col">
              <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b border-slate-100 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-xl text-slate-900">จัดการแจ้งซ่อม {editingTicket.id}</h3>
                  {(editingTicket.impact === "Critical" || editingTicket.impact === "High") && <span className="bg-red-100 text-red-600 text-xs px-2.5 py-1 rounded-full font-bold">ด่วนมาก</span>}
                </div>
                <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-orange-500"/> ข้อมูลผู้แจ้ง</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 text-sm">
                      <div className="flex gap-2"><span className="text-slate-500 w-20">สถานะ:</span> <span className="font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{editingTicket.userRole}</span></div>
                      <div className="flex gap-2"><span className="text-slate-500 w-20">ชื่อ-สกุล:</span> <span className="font-semibold text-slate-900">{editingTicket.reporterName}</span></div>
                      <div className="flex gap-2 items-center"><span className="text-slate-500 w-20">เบอร์โทร:</span> <span className="font-semibold text-orange-600">{editingTicket.phone}</span></div>
                      <div className="flex gap-2"><span className="text-slate-500 w-20">แจ้งเมื่อ:</span> <span className="text-slate-700">{editingTicket.createdAt}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500"/> ตำแหน่ง & อาการเสีย</h4>
                    <div className="bg-orange-50/40 border border-orange-100 p-4 rounded-2xl space-y-3 text-sm">
                      <div className="flex gap-2"><span className="text-slate-500 w-24">ห้อง/สถานที่:</span> <span className="font-semibold text-slate-900">{editingTicket.room}</span></div>
                      <div className="flex gap-2"><span className="text-slate-500 w-24">หมายเลข PC:</span> <span className="font-semibold text-slate-900">{editingTicket.pcNumber}</span></div>
                      <div className="flex gap-2"><span className="text-slate-500 w-24">หัวข้อปัญหา:</span> 
                        <div className="flex flex-wrap gap-1">
                          {editingTicket.issues.map((iss, i) => <span key={i} className="bg-white border border-orange-200 text-orange-700 font-medium px-2 py-0.5 rounded-md text-xs">{iss}</span>)}
                        </div>
                      </div>
                      {editingTicket.description && (
                        <div className="mt-2 pt-2 border-t border-orange-100">
                          <span className="text-slate-500 block mb-1">รายละเอียดเพิ่มเติม:</span>
                          <p className="text-slate-800 bg-white p-3 rounded-xl border border-orange-100 leading-relaxed">{editingTicket.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-orange-500"/> รูปภาพประกอบจากผู้แจ้ง</h4>
                    {editingTicket.imageUrl ? (
                      <div className="grid grid-cols-1 gap-3">
                        <a href={editingTicket.imageUrl} target="_blank" rel="noopener noreferrer" className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 block">
                          <img 
                            src={getDirectImageUrl(editingTicket.imageUrl) || ""} 
                            alt="รูปภาพแนบ" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=800&auto=format&fit=crop"; 
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium gap-2">
                            <ExternalLink className="w-4 h-4" /> กดเพื่อดูรูปภาพต้นฉบับ
                          </div>
                        </a>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-200 p-4 rounded-xl text-center text-xs text-slate-400">
                        ไม่มีรูปภาพแนบสำหรับรายการนี้
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 h-fit space-y-5">
                  <h4 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2"><Wrench className="w-4 h-4 text-orange-500"/> ส่วนจัดการของเจ้าหน้าที่</h4>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">ปรับสถานะปัจจุบัน</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as TicketStatus)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-900 font-bold text-base shadow-sm cursor-pointer">
                      <option value="pending" className="text-slate-900 bg-white font-semibold py-1">🟡 รอดำเนินการ (รอคิว)</option>
                      <option value="in_progress" className="text-slate-900 bg-white font-semibold py-1">🟠 กำลังซ่อมแซม / สั่งอะไหล่</option>
                      <option value="completed" className="text-slate-900 bg-white font-semibold py-1">🟢 ซ่อมเสร็จสิ้น (ใช้งานได้ปกติ)</option>
                      <option value="cancelled" className="text-slate-900 bg-white font-semibold py-1">⚫ ยกเลิกรายการ (ซ้ำ/ไม่ใช่ปัญหา)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">บันทึกการซ่อม (ผู้แจ้งจะเห็นข้อความนี้)</label>
                    <textarea 
                      rows={4} 
                      value={editNote} 
                      onChange={(e) => setEditNote(e.target.value)} 
                      placeholder="เช่น เปลี่ยนสายจอภาพใหม่แล้วใช้งานได้ปกติ..." 
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-sm shadow-sm resize-none"
                    />
                  </div>

                  <button 
                    onClick={saveUpdate}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 text-sm"
                  >
                    <Save className="w-4 h-4" /> บันทึกการอัปเดต
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}