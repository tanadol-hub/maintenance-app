"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Search, Clock, CheckCircle2, Wrench, AlertCircle, 
  MapPin, User, Calendar, Filter
} from "lucide-react";

// --- ข้อมูลจำลอง (Mock Data) ---
type TicketStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface MaintenanceTicket {
  id: string;
  reporterName: string;
  phone: string;
  room: string;
  pcNumber: string;
  issues: string[];
  impact: "high" | "normal";
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  technicianNote?: string;
}

const MOCK_TICKETS: MaintenanceTicket[] = [
  {
    id: "REP-6701",
    reporterName: "สมชาย สายช่าง",
    phone: "0812345678",
    room: "LAB 706",
    pcNumber: "PC-12",
    issues: ["จอเปิดไม่ติด / ไฟไม่เข้า"],
    impact: "high",
    status: "in_progress",
    createdAt: "17 ก.ย. 2026 - 09:30 น.",
    updatedAt: "17 ก.ย. 2026 - 10:15 น.",
    technicianNote: "กำลังเปลี่ยนสาย DisplayPort",
  },
  {
    id: "REP-6702",
    reporterName: "วิภาดา รักเรียน",
    phone: "0898765432",
    room: "LAB 807",
    pcNumber: "PC-05",
    issues: ["เมาส์คลิกไม่ติด / ลูกกลิ้งเสีย"],
    impact: "normal",
    status: "completed",
    createdAt: "16 ก.ย. 2026 - 14:00 น.",
    updatedAt: "16 ก.ย. 2026 - 15:30 น.",
    technicianNote: "เปลี่ยนเมาส์ตัวใหม่ให้เรียบร้อยแล้ว",
  },
  {
    id: "REP-6703",
    reporterName: "ดร.นพดล สอนดี",
    phone: "0861112233",
    room: "LAB 708",
    pcNumber: "เครื่องอาจารย์",
    issues: ["โพรเจกเตอร์ภาพไม่ขึ้น"],
    impact: "high",
    status: "pending",
    createdAt: "17 ก.ย. 2026 - 11:20 น.",
    updatedAt: "17 ก.ย. 2026 - 11:20 น.",
    technicianNote: "รอดำเนินการจัดคิวเจ้าหน้าที่",
  },
];

export default function TrackingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTickets = MOCK_TICKETS.filter((ticket) => {
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.phone.includes(searchTerm) ||
      ticket.pcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.reporterName.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> รอดำเนินการ
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200 animate-pulse">
            <Wrench className="w-3.5 h-3.5" /> กำลังซ่อมแซม
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> ซ่อมเสร็จสิ้น
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5" /> ยกเลิก
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 py-10 font-sans backdrop-blur-sm relative z-10">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-orange-100 shadow-lg text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            ติดตามสถานะการแจ้งซ่อม
          </h1>
          <p className="text-slate-500 text-sm">
            ค้นหาด้วยเลขที่ใบแจ้งซ่อม เบอร์โทรศัพท์ หรือหมายเลขเครื่อง
          </p>
        </div>

        {/* ค้นหา & ตัวกรอง */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium pr-2">
              <Filter className="w-3.5 h-3.5" /> สถานะ:
            </span>
            {[
              { id: "all", label: "ทั้งหมด" },
              { id: "pending", label: "รอดำเนินการ" },
              { id: "in_progress", label: "กำลังซ่อม" },
              { id: "completed", label: "เสร็จสิ้น" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* รายการการแจ้งซ่อม */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">ไม่พบข้อมูลการแจ้งซ่อม</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-orange-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                      #{ticket.id}
                    </span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {ticket.createdAt}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                    <span><strong>ตำแหน่ง:</strong> {ticket.room} - {ticket.pcNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4 text-orange-500 shrink-0" />
                    <span><strong>ผู้แจ้ง:</strong> {ticket.reporterName}</span>
                  </div>
                </div>

                {ticket.technicianNote && (
                  <div className="mt-3 pt-3 border-t border-dashed border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">บันทึกช่าง:</span> {ticket.technicianNote}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}