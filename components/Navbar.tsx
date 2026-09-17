"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Monitor, Wrench, Search, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "หน้าแรก", href: "/", icon: <Monitor className="w-4 h-4" /> },
    { name: "แจ้งซ่อม", href: "/report", icon: <Wrench className="w-4 h-4" /> },
    { name: "ติดตามสถานะ", href: "/track", icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-800 font-bold text-lg tracking-wide hidden sm:block">
              Maintenance<span className="text-orange-500">Service</span>
            </span>
          </Link>

          {/* Menu Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.name} href={link.href} className="relative px-3 py-2 text-sm font-semibold transition-colors">
                  <span className={`flex items-center gap-2 relative z-10 ${isActive ? "text-orange-600" : "text-slate-600 hover:text-orange-500"}`}>
                    {link.icon}
                    <span className="hidden sm:block">{link.name}</span>
                  </span>
                  {isActive && (
                    <motion.div layoutId="navbar-active" className="absolute inset-0 bg-orange-500/10 rounded-lg border border-orange-200" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Admin Button */}
          <Link href="/admin" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-md shadow-orange-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:block">สำหรับเจ้าหน้าที่</span>
          </Link>

        </div>
      </div>
    </nav>
  );
}